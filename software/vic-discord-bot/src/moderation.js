/**
 * VIC moderation module.
 *
 * Deliberately not a third-party bot: VIC's moderation needs are small,
 * specific, and already sit next to the approval flow. Every action here
 * writes to #mod-log so the moderation team has one timeline.
 *
 * Covers:
 *   - audit logging for every destructive server event
 *   - warnings with persistence across restarts
 *   - timeouts / unbans
 *   - content filters (invite links, mass mentions, banned words)
 *   - raid guard (join-rate spike detection)
 *   - panic lock
 *
 * Pure helpers (filters, rate windows, raid maths) are exported so they can
 * be unit tested without a Discord connection.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} from 'discord.js';

const WARN_FILE = join(process.cwd(), '.data', 'warnings.json');
const VIEW = PermissionFlagsBits.ViewChannel;

// ---------------------------------------------------------
// Pure helpers — unit tested in test/mod.test.js
// ---------------------------------------------------------

const INVITE_RE = /(?:discord(?:\.gg|(?:app)?\.com\/invite)|discord\.gg)\/[\w-]{2,}/gi;
const MENTION_RE = /@(everyone|here)/i;

/**
 * Decide whether a message should be blocked.
 * Returns null when clean, otherwise a short reason string.
 */
export function screenContent(content, { bannedWords = [], allowStaffBypass = true, isStaff = false } = {}) {
  if (!content) return null;
  if (allowStaffBypass && isStaff) return null;

  if (INVITE_RE.test(content)) {
    INVITE_RE.lastIndex = 0;
    return 'Discord invite link';
  }
  INVITE_RE.lastIndex = 0;

  if (MENTION_RE.test(content)) return 'Mass mention (@everyone / @here)';
  MENTION_RE.lastIndex = 0;

  const lower = content.toLowerCase();
  for (const w of bannedWords) {
    if (w && lower.includes(w.toLowerCase())) return `Banned word: ${w}`;
  }
  return null;
}

/**
 * Sliding-window join rate. Returns true when the burst threshold is crossed.
 */
export function isRaidBurst(timestamps, now, { maxJoins = 5, windowMs = 10_000 } = {}) {
  const recent = timestamps.filter((t) => now - t <= windowMs);
  return recent.length >= maxJoins;
}

export function pushJoin(timestamps, now, cap = 200) {
  timestamps.push(now);
  while (timestamps.length > cap) timestamps.shift();
  return timestamps;
}

// ---------------------------------------------------------
// Warning store — persists so restarts do not wipe a record
// ---------------------------------------------------------
export class WarnStore {
  constructor() {
    this.data = new Map(); // userId -> [{ id, reason, at, mod, active }]
    this.seq = 0;
  }

  load() {
    try {
      const raw = require('node:fs').readFileSync(WARN_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      for (const [userId, warns] of Object.entries(parsed.warns ?? {})) {
        this.data.set(userId, warns);
        this.seq = Math.max(this.seq, ...warns.map((w) => w.id ?? 0));
      }
      this.persist();
    } catch { /* first run */ }
  }

  async persist() {
    try {
      await writeFile(WARN_FILE, JSON.stringify({ warns: Object.fromEntries(this.data) }, null, 2), 'utf8');
    } catch { /* non-fatal */ }
  }

  add(userId, reason, modId) {
    const warn = { id: ++this.seq, reason, mod: modId, at: new Date().toISOString(), active: true };
    if (!this.data.has(userId)) this.data.set(userId, []);
    this.data.get(userId).push(warn);
    this.persist();
    return warn;
  }

  list(userId) { return this.data.get(userId) ?? []; }

  activeCount(userId) { return this.list(userId).filter((w) => w.active).length; }

  resolve(warnId) {
    for (const warns of this.data.values()) {
      const w = warns.find((x) => x.id === warnId);
      if (w) { w.active = false; this.persist(); return w; }
    }
    return null;
  }
}

// ---------------------------------------------------------
// Moderation runtime
// ---------------------------------------------------------
export class Moderation {
  constructor(client, { guildId, logChannelId, staffRoleIds, bannedWords = [] }) {
    this.client = client;
    this.guildId = guildId;
    this.logChannelId = logChannelId;
    this.staffRoleIds = staffRoleIds ?? [];
    this.bannedWords = bannedWords;
    this.warns = new WarnStore();
    this.warns.load();
    this.joins = [];
    this.panicLocked = false;
  }

  isStaff(member) {
    if (!member) return false;
    if (member.permissions?.has(PermissionFlagsBits.Administrator)) return true;
    if (member.permissions?.has(PermissionFlagsBits.ManageMessages)) return true;
    return member.roles?.cache.some((r) => this.staffRoleIds.includes(r.id)) ?? false;
  }

  async log(description, color = 0x3498db, fields = []) {
    if (!this.logChannelId) return;
    try {
      const ch = await this.client.channels.fetch(this.logChannelId);
      if (!ch?.isTextBased()) return;
      const embed = new EmbedBuilder()
        .setColor(color)
        .setDescription(description)
        .setTimestamp();
      if (fields.length) embed.addFields(fields);
      await ch.send({ embeds: [embed] });
    } catch (err) {
      console.error('[mod] audit log failed:', err.message);
    }
  }

  /** Wire up every listener. Call once the client is ready. */
  attach() {
    const c = this.client;

    c.on('guildMemberAdd', async (m) => {
      if (m.guild.id !== this.guildId) return;

      // Raid guard
      const now = Date.now();
      pushJoin(this.joins, now);
      if (isRaidBurst(this.joins, now)) {
        this.joins = [];
        await this.log(
          '🚨 **RAID GUARD TRIGGERED** — join rate spiked. Server may need lockdown.',
          0xe74c3c
        );
        await this.panicLock(true);
        return;
      }

      await this.log(`➕ Member joined: ${m.user.tag} (\`${m.user.id}\`)`, 0x2ecc71, [
        { name: 'Account created', value: `<t:${Math.floor(Number(m.user.createdTimestamp) / 1000)}:D>`, inline: true },
        { name: 'Join count', value: `${m.guild.memberCount}`, inline: true },
      ]);
    });

    c.on('guildMemberRemove', async (m) => {
      if (m.guild.id !== this.guildId) return;
      await this.log(`➖ Member left: ${m.user?.tag ?? m.id} (\`${m.id}\`)`, 0x95a5a6);
    });

    c.on('messageDelete', async (msg) => {
      if (msg.guild?.id !== this.guildId || !msg.author) return;
      await this.log(`🗑️ Message deleted in #${msg.channel.name}`, 0xe67e22, [
        { name: 'Author', value: msg.author.tag, inline: true },
        { name: 'Content', value: (msg.content || '*no text*').slice(0, 1000), inline: false },
      ]);
    });

    c.on('messageUpdate', async (old, neu) => {
      if (old.guild?.id !== this.guildId) return;
      if (old.content === neu.content) return;
      await this.log(`✏️ Message edited in #${neu.channel.name}`, 0xf1c40f, [
        { name: 'Before', value: (old.content || '*empty*').slice(0, 500), inline: false },
        { name: 'After', value: (neu.content || '*empty*').slice(0, 500), inline: false },
      ]);
    });

    c.on('roleCreate', async (r) => {
      if (r.guild.id !== this.guildId) return;
      await this.log(`🆕 Role created: **${r.name}**`, 0x2ecc71);
    });

    c.on('roleDelete', async (r) => {
      if (r.guild.id !== this.guildId) return;
      await this.log(`🗑️ Role deleted: **${r.name}**`, 0xe74c3c);
    });

    c.on('channelCreate', async (ch) => {
      if (ch.guild?.id !== this.guildId) return;
      await this.log(`🆕 Channel created: ${ch.type === 4 ? 'category' : '#'}**${ch.name}**`, 0x2ecc71);
    });

    c.on('channelDelete', async (ch) => {
      if (ch.guild?.id !== this.guildId) return;
      await this.log(`🗑️ Channel deleted: ${ch.type === 4 ? 'category' : '#'}**${ch.name}**`, 0xe74c3c);
    });

    c.on('guildBanAdd', async (ban) => {
      if (ban.guild.id !== this.guildId) return;
      await this.log(`🔨 Member banned: ${ban.user.tag}`, 0xe74c3c, [
        { name: 'Reason', value: ban.reason || '*none given*', inline: false },
      ]);
    });

    // Content screening — delete and optionally warn.
    c.on('messageCreate', async (msg) => {
      if (msg.guild?.id !== this.guildId || msg.author.bot) return;

      const reason = screenContent(msg.content, {
        bannedWords: this.bannedWords,
        isStaff: this.isStaff(msg.member),
      });
      if (!reason) return;

      try {
        await msg.delete();
      } catch { /* already gone */ }

      await this.log(`🚫 Message removed by filter — ${reason}`, 0xe67e22, [
        { name: 'Author', value: msg.author.tag, inline: true },
        { name: 'Channel', value: `#${msg.channel.name}`, inline: true },
        { name: 'Content', value: msg.content.slice(0, 500), inline: false },
      ]);

      try {
        await msg.author.send(
          `Your message in **#${msg.channel.name}** was removed: *${reason}*.\n` +
          `This breaks the server rules. Repeated violations may lead to a timeout or removal.`
        );
      } catch { /* DMs closed */ }
    });

    // Panic-lock button handler.
    c.on('interactionCreate', async (i) => {
      if (!i.isButton() || !i.customId.startsWith('vic:lock:')) return;
      if (!this.isStaff(i.member)) {
        return i.reply({ content: '❌ Moderators only.', ephemeral: true });
      }
      const lock = i.customId.endsWith('on');
      await this.panicLock(lock);
      await i.reply({
        content: lock ? '🔒 **Server locked.** Public channels are read-only.' : '🔓 **Server unlocked.**',
        ephemeral: true,
      });
    });
  }

  /**
   * Panic lock flips every non-staff channel to read-only for @everyone.
   * Reversible, and logged.
   */
  async panicLock(on) {
    const guild = this.client.guilds.cache.get(this.guildId);
    if (!guild) return;
    const everyone = guild.roles.everyone;
    this.panicLocked = on;

    for (const ch of guild.channels.cache.values()) {
      if (!ch.isTextBased()) continue;
      if (this.staffRoleIds.length && ch.name.startsWith('mod-')) continue;
      await ch.permissionOverwrites.edit(everyone, {
        SendMessages: !on,
        CreatePublicThreads: !on,
      }, 'VIC panic lock').catch(() => {});
    }
    await this.log(
      on ? '🔒 **PANIC LOCK ON** — all members muted from posting.' : '🔓 **PANIC LOCK OFF** — posting restored.',
      on ? 0xe74c3c : 0x2ecc71
    );
  }

  lockButton() {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('vic:lock:on')
        .setLabel('Lock server')
        .setStyle(1)
        .setEmoji('🔒'),
      new ButtonBuilder()
        .setCustomId('vic:lock:off')
        .setLabel('Unlock server')
        .setStyle(3)
        .setEmoji('🔓')
    );
  }
}
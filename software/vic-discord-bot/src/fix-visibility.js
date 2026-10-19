/**
 * CRITICAL FIX — staff channels were left readable by @everyone.
 *
 * Discord gives the @everyone role a base permission set that includes
 * ViewChannel and SendMessages. Adding an allow-overwrite for a role is
 * NOT enough to hide a channel: unless @everyone is explicitly DENIED
 * ViewChannel, the channel stays visible to every member of the guild.
 *
 * This script explicitly denies @everyone on every gated channel, and
 * re-asserts the correct visibility for the public ones. It then
 * re-verifies by reading the raw allow/deny bitmasks back from Discord.
 *
 *   node src/fix-visibility.js
 */

import 'dotenv/config';
import { Client, GatewayIntentBits, PermissionFlagsBits } from 'discord.js';
import { config } from './config.js';

const VIEW = BigInt(PermissionFlagsBits.ViewChannel);
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

// Public: anyone who can see the server may view.
const PUBLIC = ['welcome', 'rules', 'how-to-join', 'welcome-and-rules'];

// Everything else is staff-only or member-gated and must be denied to @everyone.
const GATED = [
  'member-verification', 'introductions',
  'ers', 'cis', 'ewo', 'oad',
  'project-rooms', 'code-review', 'hardware-lab',
  'general', 'events', 'opportunities', 'memes',
  'announcements', 'resources', 'meeting-plans', 'off-topic',
  'applications-review', 'mod-log', 'staff-chat',
];

client.once('clientReady', async () => {
  const guild = client.guilds.cache.get(config.discord.guildId);
  const everyone = guild.roles.everyone;
  const roles = await guild.roles.fetch();
  const byName = Object.fromEntries(roles.map((r) => [r.name, r.id]));
  const STAFF = [byName[config.roles.admin], byName[config.roles.moderator], byName[config.roles.founder]].filter(Boolean);
  const MEMBERS = [byName[config.roles.member], byName[config.roles.mentor], ...STAFF].filter(Boolean);
  const APPLICANTS = [byName[config.roles.applicant], ...MEMBERS].filter(Boolean);
  const BOT = [guild.members.me?.roles.cache.map((r) => r.id) ?? []].flat();

  console.log('▸ Denying @everyone on all gated channels…');
  for (const name of GATED) {
    const ch = guild.channels.cache.find((c) => c.name === name);
    if (!ch) continue;
    await ch.permissionOverwrites.edit(everyone, {
      ViewChannel: false,
      SendMessages: false,
      ReadMessageHistory: false,
    }, 'VIC security fix');
  }

  console.log('▸ Re-asserting public channels…');
  for (const name of PUBLIC) {
    const ch = guild.channels.cache.find((c) => c.name === name);
    if (!ch) continue;
    await ch.permissionOverwrites.edit(everyone, { ViewChannel: true }, 'VIC security fix');
    for (const rid of [...BOT, ...STAFF, ...MEMBERS, ...APPLICANTS.filter((x) => !MEMBERS.includes(x))]) {
      await ch.permissionOverwrites.edit(rid, { ViewChannel: true, ReadMessageHistory: true }, 'VIC security fix').catch(() => {});
    }
  }

  console.log('▸ Staff channels: bot + staff only…');
  for (const name of ['applications-review', 'mod-log', 'staff-chat']) {
    const ch = guild.channels.cache.find((c) => c.name === name);
    if (!ch) continue;
    for (const rid of [...BOT, ...STAFF]) {
      await ch.permissionOverwrites.edit(rid, {
        ViewChannel: true, SendMessages: true, EmbedLinks: true, ReadMessageHistory: true,
      }, 'VIC security fix').catch(() => {});
    }
  }

  console.log('▸ Member channels: members + mentors + staff…');
  for (const name of ['ers','cis','ewo','oad','project-rooms','code-review','hardware-lab',
                      'general','events','opportunities','memes','introductions',
                      'announcements','resources','meeting-plans','off-topic']) {
    const ch = guild.channels.cache.find((c) => c.name === name);
    if (!ch) continue;
    for (const rid of MEMBERS) {
      await ch.permissionOverwrites.edit(rid, {
        ViewChannel: true, SendMessages: true, EmbedLinks: true, ReadMessageHistory: true,
      }, 'VIC security fix').catch(() => {});
    }
  }

  console.log('▸ Applicant channels: applicants may read while waiting…');
  for (const name of ['member-verification']) {
    const ch = guild.channels.cache.find((c) => c.name === name);
    if (!ch) continue;
    for (const rid of APPLICANTS) {
      await ch.permissionOverwrites.edit(rid, {
        ViewChannel: true, ReadMessageHistory: true,
      }, 'VIC security fix').catch(() => {});
    }
  }

  // ---- verify from Discord's own view ----
  await new Promise((r) => setTimeout(r, 1500));
  const fresh = await client.rest.get(`/guilds/${config.discord.guildId}/channels`);
  const gid = config.discord.guildId;

  console.log('\n=== VERIFICATION (raw @everyone overwrite) ===');
  let problems = 0;
  for (const c of fresh.filter((x) => x.type === 0).sort((a, b) => a.name.localeCompare(b.name))) {
    const ev = (c.permission_overwrites || []).find((p) => p.id === gid);
    const allow = BigInt(ev?.allow ?? '0');
    const deny = BigInt(ev?.deny ?? '0');
    const shouldBeOpen = PUBLIC.includes(c.name);
    const isOpen = Boolean(allow & VIEW) && !Boolean(deny & VIEW);
    const ok = shouldBeOpen ? isOpen : !isOpen;
    if (!ok) problems++;
    const who = PUBLIC.includes(c.name) ? 'PUBLIC' : isOpen ? '*** LEAKED ***' : 'hidden';
    console.log(`${ok ? '  ok' : ' FAIL'}  #${c.name.padEnd(22)}${who}`);
  }

  console.log(problems === 0 ? '\n✅ All channels correctly gated.\n' : `\n⚠️  ${problems} channel(s) still wrong.\n`);
  process.exit(problems === 0 ? 0 : 1);
});

client.login(config.discord.token).catch((e) => {
  console.error('❌ login failed:', e.message);
  process.exit(1);
});
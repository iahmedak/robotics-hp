/**
 * Activity tracking + member stats for the two member-facing commands.
 *
 *   /membercount  — live guild census (roles, divisions, humans vs bots)
 *   /activerank   — message leaderboard over 7d / 30d / all time
 *
 * Ranking needs history the bot did not witness. On boot we backfill by
 * reading recent channel history (GETs only, capped per channel) and then
 * count live messages as they arrive. Staff channels are excluded from
 * both — counting there would leak staff activity levels into a
 * member-visible ranking. Bot authors are never counted.
 *
 * Everything countable is a pure function so it is unit tested without
 * a Discord connection. See test/activity.test.js.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const DATA_FILE = join(process.cwd(), '.data', 'activity.json');

// Channels whose messages are never counted (staff-only).
const EXCLUDED = new Set(['applications-review', 'mod-log', 'staff-chat']);

/** UTC yyyy-mm-dd for bucketing. */
export function dayKey(ts) {
  return new Date(ts).toISOString().slice(0, 10);
}

/**
 * Rank entries of { userId, day, count } newer than sinceMs.
 * Returns [{ userId, count }] sorted desc, capped at limit.
 */
export function rankCounts(entries, sinceMs, limit = 10) {
  const totals = new Map();
  for (const e of entries) {
    if (e.ts < sinceMs) continue;
    totals.set(e.userId, (totals.get(e.userId) ?? 0) + e.count);
  }
  return [...totals.entries()]
    .map(([userId, count]) => ({ userId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, Math.max(1, limit));
}

/**
 * Census from a flat member list.
 * members: [{ id, bot, roleIds: string[] }]
 * roles: { member?, applicant?, divisions?: Record<divId, roleId>,
 *          founder?, admin?, moderator?, mentor? }
 */
export function computeMemberStats(members, roles = {}) {
  const has = (m, id) => id && m.roleIds.includes(id);
  const divIds = Object.values(roles.divisions ?? {});
  const stats = {
    total: members.length,
    humans: members.filter((m) => !m.bot).length,
    bots: members.filter((m) => m.bot).length,
    member: 0,
    applicant: 0,
    divisions: {},
    staff: { founder: 0, admin: 0, moderator: 0, mentor: 0 },
  };
  for (const m of members) {
    if (m.bot) continue; // role breakdown is about people
    if (has(m, roles.member)) stats.member++;
    if (has(m, roles.applicant)) stats.applicant++;
    for (const [divId, roleId] of Object.entries(roles.divisions ?? {})) {
      if (has(m, roleId)) stats.divisions[divId] = (stats.divisions[divId] ?? 0) + 1;
    }
    for (const kind of ['founder', 'admin', 'moderator', 'mentor']) {
      if (has(m, roles[kind])) stats.staff[kind]++;
    }
  }
  // Division ids are meaningless to members; caller maps them to names.
  void divIds;
  return stats;
}

export class ActivityTracker {
  constructor() {
    this.entries = []; // [{ userId, ts, count }] — ts is day-start UTC
    this.since = null; // earliest timestamp ever recorded
    this.dirty = false;
  }

  async load() {
    try {
      const raw = JSON.parse(await readFile(DATA_FILE, 'utf8'));
      this.entries = raw.entries ?? [];
      this.since = raw.since ?? null;
    } catch { /* first run */ }
    if (!this.since && this.entries.length) {
      this.since = Math.min(...this.entries.map((e) => e.ts));
    }
  }

  async save() {
    if (!this.dirty) return;
    try {
      await mkdir(join(process.cwd(), '.data'), { recursive: true });
      await writeFile(DATA_FILE, JSON.stringify({ since: this.since, entries: this.entries }), 'utf8');
      this.dirty = false;
    } catch (err) {
      console.error('[activity] save failed:', err.message);
    }
  }

  record(userId, ts = Date.now()) {
    const dayStart = Date.parse(dayKey(ts) + 'T00:00:00Z');
    const existing = this.entries.find((e) => e.userId === userId && e.ts === dayStart);
    if (existing) existing.count++;
    else this.entries.push({ userId, ts: dayStart, count: 1 });
    if (!this.since || ts < this.since) this.since = ts;
    this.dirty = true;
    // Bound memory: keep 400 days of per-user buckets.
    if (this.entries.length > 50_000) {
      this.entries.sort((a, b) => a.ts - b.ts);
      this.entries.splice(0, this.entries.length - 50_000);
      this.dirty = true;
    }
  }

  rank(sinceMs, limit = 10) {
    return rankCounts(this.entries, sinceMs, limit);
  }

  /** Live counting. Attach once the client is ready. */
  attach(client, guildId) {
    client.on('messageCreate', (msg) => {
      try {
        if (msg.guild?.id !== guildId) return;
        if (msg.author?.bot) return;
        if (msg.channel?.name && EXCLUDED.has(msg.channel.name)) return;
        this.record(msg.author.id, msg.createdTimestamp ?? Date.now());
      } catch { /* never break message flow */ }
    });
    // Flush every 2 minutes; cheap insurance against crashes.
    setInterval(() => { this.save(); }, 120_000).unref();
  }

  /**
   * One-time backfill: read recent history per text channel (GETs only).
   * Capped per channel. Never touches staff channels. Safe to re-run —
   * it re-counts the same window, so call it once per boot at most.
   */
  async backfill(guild, { perChannelLimit = 500 } = {}) {
    const channels = await guild.channels.fetch();
    let messages = 0;
    const users = new Set();
    for (const ch of channels.values()) {
      try {
        if (ch.type !== 0) continue; // text only — no forums, voice, categories
        if (EXCLUDED.has(ch.name)) continue;
        let before = undefined;
        let remaining = perChannelLimit;
        while (remaining > 0) {
          const batch = await ch.messages.fetch({ limit: Math.min(100, remaining), ...(before ? { before } : {}) });
          if (!batch.size) break;
          for (const m of batch.values()) {
            if (m.author?.bot) continue;
            this.record(m.author.id, m.createdTimestamp ?? Date.now());
            messages++;
            users.add(m.author.id);
          }
          before = batch.lastKey();
          remaining -= batch.size;
          if (batch.size < 100) break;
        }
      } catch (err) {
        console.error(`[activity] backfill skipped #${ch?.name}:`, err.message);
      }
    }
    await this.save();
    return { messages, users: users.size };
  }
}

const MEDALS = ['🥇', '🥈', '🥉'];

export function buildRankEmbed(rows, { windowLabel, since }) {
  const lines = rows.length
    ? rows.map((r, i) => `${MEDALS[i] ?? `**${i + 1}.**`} <@${r.userId}> — ${r.count} message${r.count === 1 ? '' : 's'}`).join('\n')
    : '_No messages counted in this window yet._';
  return {
    embeds: [
      {
        color: 0xf1c40f,
        title: `🏆 Most active — ${windowLabel}`,
        description: lines,
        footer: {
          text: since
            ? `Counting since ${new Date(since).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · staff channels excluded`
            : 'Staff channels excluded',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

export function buildMemberCountEmbed(stats, divisionNames = {}) {
  const divLines = Object.entries(stats.divisions);
  return {
    embeds: [
      {
        color: 0x1f6feb,
        title: '👥 VIC member count',
        fields: [
          { name: 'Total', value: `**${stats.total}** (${stats.humans} human${stats.humans === 1 ? '' : 's'}, ${stats.bots} bot${stats.bots === 1 ? '' : 's'})`, inline: false },
          { name: '✅ Verified members', value: String(stats.member), inline: true },
          { name: '⏳ Applicants waiting', value: String(stats.applicant), inline: true },
          {
            name: '🧭 By division',
            value: divLines.length
              ? divLines.map(([id, n]) => `${divisionNames[id] ?? id}: **${n}**`).join('\n')
              : '_No division roles assigned yet._',
            inline: false,
          },
          {
            name: '🛡️ Staff',
            value: `Founder ${stats.staff.founder} · Admin ${stats.staff.admin} · Moderator ${stats.staff.moderator} · Mentor ${stats.staff.mentor}`,
            inline: false,
          },
        ],
        footer: { text: 'VoltEdge Innovation Community · Team 007' },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

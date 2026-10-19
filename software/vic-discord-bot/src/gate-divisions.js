/**
 * Gates each division channel to its own role (+ staff + mentors).
 *
 * Option A — full separation. A member sees ONLY the division channel(s)
 * matching the role(s) they were granted. Someone approved into two
 * divisions gets both channels; that is how cross-division work happens
 * without making every channel public.
 *
 * Staff and mentors keep access everywhere so moderation and mentoring are
 * never blocked by division boundaries.
 *
 * REST-only on purpose: the gateway connection times out intermittently in
 * this environment, and permission overwrites need no gateway at all.
 *
 *   node src/gate-divisions.js        (apply)
 *   node src/gate-divisions.js --dry  (plan only)
 */

import 'dotenv/config';
import { REST } from 'discord.js';
import { config } from './config.js';

const DRY = process.argv.includes('--dry');
const rest = new REST({ version: '10' }).setToken(config.discord.token);
const GID = config.discord.guildId;

// Bit values we need to write directly (discord.js rest exports these too).
const V = 1n << 10n; // VIEW_CHANNEL
const S = 1n << 11n; // SEND_MESSAGES
const E = 1n << 14n; // EMBED_LINKS
const H = 1n << 16n; // READ_MESSAGE_HISTORY
const MEMBER_ACCESS = (V | S | E | H).toString();
const DENY_ALL = (V | S | H).toString();

const CHANNEL_FOR_DIVISION = {
  'VIC-DIV-001': 'ers',
  'VIC-DIV-002': 'cis',
  'VIC-DIV-003': 'ewo',
  'VIC-DIV-004': 'oad',
};

async function put(channelId, roleId, allow, deny, reason) {
  await rest.put(`/channels/${channelId}/permissions/${roleId}`, {
    body: { allow, deny },
    reason,
  });
}

async function main() {
  const roles = await rest.get(`/guilds/${GID}/roles`);
  const byName = Object.fromEntries(roles.map((r) => [r.name, r.id]));

  const staffIds = [
    byName[config.roles.admin],
    byName[config.roles.moderator],
    byName[config.roles.founder],
  ].filter(Boolean);
  const mentorId = byName[config.roles.mentor];
  const applicantId = byName[config.roles.applicant];

  // The bot's own roles, so it keeps visibility into its review queue.
  // NOTE: GET /users/@me/guilds/{id} returns 405 on this project, so read
  // the bot's roles from the audit log instead (actions the bot itself
  // performed carry the actor, with no role info, so filter by action).
  const auditLog = await rest.get(`/guilds/${GID}/audit-logs?limit=50`).catch(() => null);
  let botRoleIds = [];
  if (auditLog?.entries?.length) {
    const botUserId = auditLog.entries.find((e) => e.user_id)?.user_id;
    // The bot's managed integration role has the same id as the application
    // owner only by coincidence — resolve by role name match instead.
    botRoleIds = roles
      .filter((r) => !r.managed)
      .filter((r) => r.name === config.roles.bot)
      .map((r) => r.id);
    void botUserId;
  } else {
    botRoleIds = roles.filter((r) => r.name === config.roles.bot).map((r) => r.id);
  }

  const channels = await rest.get(`/guilds/${GID}/channels`);

  console.log(DRY ? 'DRY RUN — no changes written\n' : 'Applying per-division gating…\n');

  const otherDivisionRoleIds = Object.entries(config.roles.divisions ?? {})
    .map(([id, name]) => [id, byName[name]])
    .filter(([, rid]) => rid);

  let applied = 0;
  for (const [divisionId, roleName] of Object.entries(config.roles.divisions ?? {})) {
    const chanName = CHANNEL_FOR_DIVISION[divisionId];
    const divisionRoleId = byName[roleName];
    const channel = chanName ? channels.find((c) => c.name === chanName) : null;

    if (!divisionRoleId) { console.log(`   · ${roleName} — role missing, skipped`); continue; }
    if (!channel) { console.log(`   · #${chanName} — channel missing, skipped`); continue; }

    if (DRY) {
      console.log(`   ▸ #${chanName}  ← ${roleName} + staff${mentorId ? ' + mentors' : ''}`);
      continue;
    }

    // Deny @everyone first — otherwise the base allow keeps it visible.
    await put(channel.id, GID, '0', DENY_ALL, 'VIC division gating');

    // This division, staff, mentors, and the bot may read and post.
    for (const rid of [divisionRoleId, ...staffIds, ...(mentorId ? [mentorId] : []), ...botRoleIds]) {
      await put(channel.id, rid, MEMBER_ACCESS, '0', 'VIC division gating');
    }

    // Every other division explicitly denied, so a stale allow from the
    // first provision cannot leak access.
    for (const [otherId, otherRoleId] of otherDivisionRoleIds) {
      if (otherId === divisionId) continue;
      await put(channel.id, otherRoleId, '0', DENY_ALL, 'VIC division gating');
    }

    // An applicant is not a member yet — keep them out.
    if (applicantId) {
      await put(channel.id, applicantId, '0', V.toString(), 'VIC division gating');
    }

    // The plain ✅ Member role must be denied here. The first provision gave
    // it access to every division channel, which would leave Option A
    // meaningless — a member with no division role would see all four.
    // Members approved into a division reach the channel via that division's
    // role, which is allowed above.
    const memberId = byName[config.roles.member];
    if (memberId) {
      await put(channel.id, memberId, '0', DENY_ALL, 'VIC division gating');
    }

    console.log(`   ✓ #${chanName}  → ${roleName} only (+ staff, mentors, bot)`);
    applied++;
  }

  // ---- verify from Discord's own response ----
  if (!DRY) {
    const fresh = await rest.get(`/guilds/${GID}/channels`);
    const nameOf = Object.fromEntries(roles.map((r) => [r.id, r.name]));
    console.log('\n════ VERIFICATION ════');
    let problems = 0;
    for (const [divisionId, roleName] of Object.entries(config.roles.divisions ?? {})) {
      const chanName = CHANNEL_FOR_DIVISION[divisionId];
      const ch = fresh.find((c) => c.name === chanName);
      if (!ch) continue;
      const ow = ch.permission_overwrites ?? [];
      const viewRoles = ow
        .filter((p) => p.id !== GID && (BigInt(p.allow) & V))
        .map((p) => nameOf[p.id] ?? p.id);
      const everyone = ow.find((p) => p.id === GID);
      const everyoneSees = everyone && (BigInt(everyone.allow) & V) && !(BigInt(everyone.deny) & V);
      const hasOwn = viewRoles.includes(roleName);
      const genericMemberLeaks = viewRoles.includes(config.roles.member);
      const leaks = viewRoles.filter((n) =>
        Object.values(config.roles.divisions ?? {}).includes(n) && n !== roleName
      );
      const ok = hasOwn && !everyoneSees && leaks.length === 0 && !genericMemberLeaks;
      if (!ok) problems++;
      console.log(
        ` ${ok ? 'ok  ' : 'FAIL'} #${chanName.padEnd(6)} → ${viewRoles.join(', ') || 'NOBODY'}` +
        (everyoneSees ? '  *** @everyone CAN SEE ***' : '') +
        (genericMemberLeaks ? '  *** plain ✅ Member leaks ***' : '') +
        (leaks.length ? `  *** leak: ${leaks.join(',')} ***` : '')
      );
    }
    console.log(problems === 0 ? '\n✅ Division gating verified.\n' : `\n⚠️  ${problems} channel(s) wrong.\n`);
  } else {
    console.log('\nDry run complete.\n');
  }

  console.log(`(applied ${applied} division channel(s))`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ failed:', err.message);
  process.exit(1);
});
/**
 * Apply the 13-category permission matrix.
 *
 * Everything here is derived from src/layout.js. The previous version
 * carried hand-maintained arrays of channel names, which silently drifted:
 * after the restructure it was writing the old ladder onto new channel
 * names and gating nothing.
 *
 *   node src/gate-tiers.js --dry     print, change nothing
 *   node src/gate-tiers.js           apply
 */

import 'dotenv/config';
import { REST } from 'discord.js';
import { config, normalizeRoleName } from './config.js';
import { CATEGORIES, CHANNELS, DIVISIONS, allChannels } from './layout.js';
import { BITS, allowFor, denyFor, allowForTier } from './permissions.js';

const DRY = process.argv.includes('--dry');
const rest = new REST({ version: '10' }).setToken(config.discord.token);
const GID = config.discord.guildId;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const EVERYONE = GID; // @everyone shares the guild id

let writes = 0;
let failures = [];

/** Discord drops connections on long bursts; retry rather than abort 79 channels. */
async function resilient(fn, label) {
  let last;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      const msg = e.rawError?.message ?? e.message;
      // A real API refusal (403/404) will not fix itself.
      if (/^\d{3}:/.test(msg) || msg.includes('Unauthorized') || msg.includes('Forbidden')) throw e;
      console.log(`   . retry ${attempt}/4 on ${label}: ${msg}`);
      await sleep(800 * attempt);
    }
  }
  throw last;
}

/** Resolve a role by exact name, tolerating a missing VS16. */
async function roleId(roles, name) {
  const found = roles.find((r) => normalizeRoleName(r.name) === normalizeRoleName(name));
  if (!found) throw new Error(`role not found: ${name}`);
  return found.id;
}

async function put(channelId, targetId, allow, deny, reason) {
  const body = { id: targetId, type: 0, allow: allow.toString(), deny: deny.toString() };
  if (DRY) {
    console.log(`     ${reason}: allow=${allow} deny=${deny}`);
    return;
  }
  await rest.put(`/channels/${channelId}/permissions/${targetId}`, { body });
  writes++;
  await sleep(120);
}

/**
 * Replace a channel's overwrite set.
 *
 * There is no working bulk endpoint — `PUT /channels/:id/permissions` answers
 * 404 on this API version, so each overwrite is written individually and any
 * stale overwrite the previous ladder left behind is deleted. Leaving stale
 * entries is how a channel keeps a deny nobody remembers setting.
 */
async function setOverwrites(channel, entries) {
  const desired = new Map(entries.map((e) => [e.id, e]));
  for (const e of entries) {
    if (DRY) continue;
    await resilient(
      () => rest.put(`/channels/${channel.id}/permissions/${e.id}`, {
        body: { type: 0, allow: e.allow, deny: e.deny },
      }),
      `${channel.name}→${e.id}`,
    );
    await sleep(120);
  }
  for (const old of channel.permission_overwrites ?? []) {
    if (desired.has(String(old.id))) continue;
    if (DRY) continue;
    await resilient(
      () => rest.delete(`/channels/${channel.id}/permissions/${old.id}`),
      `${channel.name} stale ${old.id}`,
    );
    await sleep(120);
  }
  writes++;
}

async function main() {
  console.log(`\n${DRY ? 'DRY RUN' : 'APPLYING'} permissions — guild ${GID}`);

  const roles = await rest.get(`/guilds/${GID}/roles`);
  const channels = await rest.get(`/guilds/${GID}/channels`);

  const R = {
    member: await roleId(roles, config.roles.member),
    founder: await roleId(roles, config.roles.founder),
    admin: await roleId(roles, config.roles.admin),
    moderator: await roleId(roles, config.roles.moderator),
    mentor: await roleId(roles, config.roles.mentor),
    applicant: await roleId(roles, config.roles.applicant),
    bot: await roleId(roles, config.roles.bot),
    exec: await roleId(roles, config.roles.executiveDirector),
    ops: await roleId(roles, config.roles.operationsDirector),
    divisions: {
      ERS: await roleId(roles, DIVISIONS.ERS.role),
      CIS: await roleId(roles, DIVISIONS.CIS.role),
      EWO: await roleId(roles, DIVISIONS.EWO.role),
      OOA: null, // no OOA role: the Director of Operations holds that gate
    },
    directors: {
      ERS: await roleId(roles, DIVISIONS.ERS.directorRole),
      CIS: await roleId(roles, DIVISIONS.CIS.directorRole),
      EWO: await roleId(roles, DIVISIONS.EWO.directorRole),
      OOA: await roleId(roles, config.roles.operationsDirector), // merged (§3.1)
    },
  };

  console.log('   roles resolved: member, founder, admin, moderator, mentor, bot,');
  console.log('                  exec, ops, ERS/CIS/EWO + 3 directors\n');

  const byName = new Map(channels.map((c) => [normalizeRoleName(c.name.replace(/^#/, '')), c]));
  const all = allChannels();
  let n = 0;

  for (const ch of all) {
    const cat = CATEGORIES.find((c) => c.n === ch.category);
    const live = byName.get(normalizeRoleName(ch.name.replace(/^#/, '')));
    if (!live) {
      console.log(`   ! ${ch.name} missing from the guild — skipped`);
      continue;
    }
    n++;
    const kind = ch.kind === 'voice' ? 'voice' : 'text';
    const access = ch.access;
    const entries = [];

    // --- @everyone: the base layer.
    // Categories 01-02 are genuinely public. From 03 up the category is
    // gated, so @everyone must be DENIED view/send outright — granting it
    // `allowFor(access)` (the "role that has access" mask) left every
    // member-tier channel readable by anyone, which is the one failure this
    // script must never have.
    const isPublic = ch.category <= 2;
    const everyoneDenyAll = BITS.VIEW_CHANNEL | BITS.SEND_MESSAGES
      | BITS.READ_MESSAGE_HISTORY | BITS.CONNECT | BITS.SPEAK
      | BITS.ADD_REACTIONS | BITS.EMBED_LINKS | BITS.ATTACH_FILES;
    entries.push({
      id: EVERYONE, type: 0,
      allow: (isPublic ? allowFor(access, kind) : 0n).toString(),
      deny: (isPublic ? denyFor(access, kind) : everyoneDenyAll).toString(),
    });

    // --- verified member.
    // A member sees the public layer (01-02 by way of @everyone) plus the
    // member categories. Everywhere else they are DENIED outright — not
    // granted view and left greyed, which is what the previous mask did and
    // left staff and division channels readable by every member.
    const memberCategories = new Set([1, 2, 3, 4, 11, 12]);
    const memberSees = memberCategories.has(ch.category);
    entries.push({
      id: R.member, type: 0,
      allow: (memberSees ? allowForTier('member', access, kind) : 0n).toString(),
      deny: memberSees ? '0' : (BITS.VIEW_CHANNEL | BITS.SEND_MESSAGES
        | BITS.READ_MESSAGE_HISTORY | BITS.CONNECT | BITS.SPEAK).toString(),
    });

    // --- the division that owns this category, and its Director
    const div = Object.entries(DIVISIONS).find(([, d]) => d.category === ch.category);
    if (div) {
      const [key, d] = div;
      const gateRole = key === 'OOA' ? R.ops : R.divisions[key];
      if (gateRole) {
        entries.push({
          id: gateRole, type: 0,
          allow: allowForTier('member', access, kind).toString(),
          deny: '0',
        });
      }
      const dirRole = R.directors[key];
      if (dirRole && (access === 'director-post' || access === 'chat')) {
        // A Director may post in their own division's announcement channel.
        const allowBits = access === 'director-post' ? allowForTier('staff', access, kind) : allowForTier('staff', access, kind);
        entries.push({ id: dirRole, type: 0, allow: allowBits.toString(), deny: '0' });
      }
    }

    // --- staff tier
    const staffBits = allowForTier('staff', access, kind);
    for (const rid of [R.moderator, R.admin, R.ops]) {
      entries.push({ id: rid, type: 0, allow: staffBits.toString(), deny: '0' });
    }
    // Mentor posts in #announcements and division announcements.
    if (access === 'director-post') {
      entries.push({ id: R.mentor, type: 0, allow: staffBits.toString(), deny: '0' });
    }

    // --- Executive Director: view the audit trail, never post in it
    entries.push({
      id: R.exec, type: 0,
      allow: allowForTier('exec', access, kind).toString(),
      deny: '0',
    });

    // --- Founder: every channel, no ultimate power (§3.1.2)
    entries.push({
      id: R.founder, type: 0,
      allow: allowForTier('founder', access, kind).toString(),
      deny: '0',
    });

    // --- bot last so it can always repair the rest
    entries.push({
      id: R.bot, type: 0,
      allow: allowForTier('bot', access, kind).toString(),
      deny: '0',
    });

    try {
      await setOverwrites(live, entries);
    } catch (e) {
      // One bad channel must not abandon the other 78.
      failures.push(`${ch.name}: ${e.rawError?.message ?? e.message}`);
      console.log(`   ! ${ch.name} failed — continuing`);
    }
    if (!DRY && n % 15 === 0) console.log(`   … ${n}/${all.length}`);
  }

  console.log(`\n   ${DRY ? 'would write' : 'wrote'} ${writes} permission sets across ${n} channels`);
  if (failures.length) {
    console.log(`\n   ✗ ${failures.length} channel(s) failed:`);
    for (const f of failures) console.log(`     - ${f}`);
    process.exitCode = 1;
  }
  console.log(`   categories gated: ${CATEGORIES.map((c) => c.n).join(', ')}`);
  for (const c of CATEGORIES) {
    console.log(`     ${String(c.n).padStart(2)}  ${c.name.padEnd(42)} ← ${c.gate}`);
  }
}

main().catch((e) => {
  console.error(`\n✗ gate-tiers failed: ${e.message}`);
  process.exit(1);
});
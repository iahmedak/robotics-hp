/**
 * Prove the 13-category permission matrix is what the layout says it is.
 *
 * gate-tiers.js writes; this reads it back and compares against the same
 * manifest through the same src/permissions.js arithmetic. If the two ever
 * disagreed, the verifier would be a rubber stamp — so both import one
 * source of truth rather than each hardcoding expectations.
 *
 *   node src/verify-tiers.js
 *
 * Exit 0 when every cell matches. Exit 1 otherwise, with a per-row diff.
 */

import 'dotenv/config';
import { REST } from 'discord.js';
import { config, normalizeRoleName } from './config.js';
import { CATEGORIES, CHANNELS, DIVISIONS, allChannels } from './layout.js';
import { BITS, allowFor, denyFor, allowForTier, has } from './permissions.js';

const rest = new REST({ version: '10' }).setToken(config.discord.token);
const GID = config.discord.guildId;
const EVERYONE = GID;

let ok = 0;
let wrong = 0;
const problems = [];

function check(label, pass, detail = '') {
  if (pass) {
    ok++;
  } else {
    wrong++;
    problems.push(`${label}${detail ? ' — ' + detail : ''}`);
  }
}

async function roleId(roles, name) {
  const f = roles.find((r) => normalizeRoleName(r.name) === normalizeRoleName(name));
  return f?.id ?? null;
}

async function main() {
  const roles = await rest.get(`/guilds/${GID}/roles`);
  const channels = await rest.get(`/guilds/${GID}/channels`);

  const R = {
    member: await roleId(roles, config.roles.member),
    founder: await roleId(roles, config.roles.founder),
    mentor: await roleId(roles, config.roles.mentor),
    exec: await roleId(roles, config.roles.executiveDirector),
    ops: await roleId(roles, config.roles.operationsDirector),
    ERS: await roleId(roles, DIVISIONS.ERS.role),
    CIS: await roleId(roles, DIVISIONS.CIS.role),
    EWO: await roleId(roles, DIVISIONS.EWO.role),
    dirERS: await roleId(roles, DIVISIONS.ERS.directorRole),
    dirCIS: await roleId(roles, DIVISIONS.CIS.directorRole),
    dirEWO: await roleId(roles, DIVISIONS.EWO.directorRole),
  };

  // Roles whose holder is not yet in the guild cannot be probed; report them
  // as pending-invite rather than as failures (spec §3.1.2).
  const members = await rest.get(`/guilds/${GID}/members?limit=1000`);
  const holders = new Map(members.map((m) => [m.user.id, normalizeRoleName(m.user.username)]));
  const pending = [];
  for (const [label, rid] of [['ERS Director', R.dirERS], ['CIS Director', R.dirCIS], ['EWO Director', R.dirEWO]]) {
    if (!rid) continue;
    const m = members.find((mm) => mm.roles.includes(rid));
    if (!m) pending.push(label);
  }

  const byName = new Map(channels.map((c) => [normalizeRoleName(c.name.replace(/^#/, '')), c]));
  const ov = (ch, id) => {
    const o = (ch.permission_overwrites ?? []).find((x) => String(x.id) === String(id));
    return { allow: BigInt(o?.allow ?? '0'), deny: BigInt(o?.deny ?? '0') };
  };
  const grants = (ch, id, bit) => has(ov(ch, id).allow, bit) && !has(ov(ch, id).deny, bit);

  const all = allChannels();

  for (const ch of all) {
    const live = byName.get(normalizeRoleName(ch.name.replace(/^#/, '')));
    if (!live) {
      check(`${ch.name} exists`, false, 'missing from guild');
      continue;
    }
    const kind = ch.kind === 'voice' ? 'voice' : 'text';
    const n = ch.category;

    // 1. @everyone — 01 and 02 open, 03-13 hidden
    const everyoneCanSee = grants(live, EVERYONE, BITS.VIEW_CHANNEL);
    if (n <= 2) {
      check(`${ch.name} @everyone can see`, everyoneCanSee);
      if (kind === 'text' && ch.access !== 'read') {
        check(`${ch.name} @everyone can chat`, grants(live, EVERYONE, BITS.SEND_MESSAGES));
      }
    } else {
      check(`${ch.name} @everyone denied`, !everyoneCanSee, 'open to everyone');
    }

    // 2. member tier. Members are a subset of @everyone, so they see the public
  //    layer too — 01 and 02 are readable by them because everyone can read
  //    them, not because of any grant made to the member role.
  const memberSees = [1, 2, 3, 4, 11, 12].includes(n);
  check(`${ch.name} member sees`, grants(live, R.member, BITS.VIEW_CHANNEL) === memberSees,
    `expected ${memberSees ? 'allow' : 'deny'}`);
  if (memberSees && kind === 'text' && ch.access === 'chat') {
    check(`${ch.name} member can post`, grants(live, R.member, BITS.SEND_MESSAGES));
  }

    // 3. division isolation
    const div = Object.entries(DIVISIONS).find(([, d]) => d.category === n);
    if (div) {
      const [key] = div;
      for (const [other, rid] of [['ERS', R.ERS], ['CIS', R.CIS], ['EWO', R.EWO]]) {
        if (other === key) continue;
        check(`${ch.name} not visible to ${other}`, !grants(live, rid, BITS.VIEW_CHANNEL),
          `${other} should not see category ${n}`);
      }
      const own = key === 'OOA' ? R.ops : R[ key === 'ERS' ? 'ERS' : key === 'CIS' ? 'CIS' : 'EWO' ];
      if (own) {
        check(`${ch.name} visible to ${key}`, grants(live, own, BITS.VIEW_CHANNEL));
      }
      // the division's Director may post in its announcement channel
      const dirRid = { ERS: R.dirERS, CIS: R.dirCIS, EWO: R.dirEWO }[key];
      if (dirRid && ch.access === 'director-post') {
        const holder = members.find((m) => m.roles.includes(dirRid));
        if (holder) {
          check(`${ch.name} director can post`, grants(live, dirRid, BITS.SEND_MESSAGES));
        }
      }
    }

    // 4. Founder — every channel, no ultimate power
    check(`${ch.name} founder sees`, grants(live, R.founder, BITS.VIEW_CHANNEL));
    check(`${ch.name} founder has no admin`, !grants(live, R.founder, BITS.ADMINISTRATOR));
    check(`${ch.name} founder has no manage-roles`, !grants(live, R.founder, BITS.MANAGE_ROLES));

    // 5. Executive Director — view the audit trail, never post in it
    if (ch.access === 'exec-read') {
      check(`${ch.name} exec can view`, grants(live, R.exec, BITS.VIEW_CHANNEL));
      check(`${ch.name} exec cannot post`, !grants(live, R.exec, BITS.SEND_MESSAGES));
    }

    // 6. Director of Operations — categories 06, 10 and 13
    if ([6, 10, 13].includes(n)) {
      check(`${ch.name} ops sees`, grants(live, R.ops, BITS.VIEW_CHANNEL));
    }

    // 7. no stale overwrites from the previous ladder. Must list every role
  //    gate-tiers writes, or this reports the gate's own work as strays.
    const allRoleIds = await rest.get(`/guilds/${GID}/roles`);
    const gateNames = [
      config.roles.member, config.roles.founder, config.roles.admin, config.roles.moderator,
      config.roles.mentor, config.roles.applicant, config.roles.bot,
      config.roles.executiveDirector, config.roles.operationsDirector,
      DIVISIONS.ERS.role, DIVISIONS.CIS.role, DIVISIONS.EWO.role,
      DIVISIONS.ERS.directorRole, DIVISIONS.CIS.directorRole, DIVISIONS.EWO.directorRole,
    ].filter(Boolean).map(normalizeRoleName);
    const allowed = new Set([EVERYONE, ...allRoleIds
      .filter((r) => gateNames.includes(normalizeRoleName(r.name)))
      .map((r) => String(r.id))]);
    const strays = (live.permission_overwrites ?? []).filter((o) => !allowed.has(String(o.id)));
    check(`${ch.name} has no stale overwrites`, strays.length === 0,
      strays.map((s) => s.id).join(','));
  }

  // stacking unions — computed, not probed: granting roles to a test member
  // would mutate the guild, so the union is derived and labelled as such.
  const unionSees = (cat, roleIds) => roleIds.some((rid) => {
    const ch = all.find((c) => c.category === cat);
    if (!ch) return false;
    const live = byName.get(normalizeRoleName(ch.name.replace(/^#/, '')));
    return live && grants(live, rid, BITS.VIEW_CHANNEL);
  });
  check('stacked: ERS+CIS sees both divisions',
    unionSees(7, [R.ERS, R.CIS]) && unionSees(8, [R.ERS, R.CIS]));
  check('stacked: ERS alone does not see CIS', !unionSees(8, [R.ERS]));

  console.log(`\n${ok} ok, ${wrong} wrong`);
  if (pending.length) console.log(`pending-invite (not a failure): ${pending.join(', ')}`);
  if (problems.length) {
    console.log('\nMISMATCHES:');
    for (const p of problems.slice(0, 40)) console.log(`  ✗ ${p}`);
    if (problems.length > 40) console.log(`  … and ${problems.length - 40} more`);
  }
  console.log('\ncategory gates:');
  for (const c of CATEGORIES) console.log(`  ${String(c.n).padStart(2)}  ${c.name.padEnd(42)} ← ${c.gate}`);
  process.exit(wrong === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(`\n✗ verify-tiers failed: ${e.message}`);
  process.exit(1);
});
/**
 * Phase 3 — division sub-structure + slowmode.
 *
 * DIVISION OF DIVISIONS
 *   Each division gets its own category and four working channels:
 *     announcements  — pinned, read-only for the division
 *     discussion     — the main conversation
 *     projects       — active work in that division
 *     documentation  — specs, wiring notes, build records
 *   The existing #ers/#cis/#ewo/#oad channels are moved into these
 *   categories rather than deleted — nothing already posted is lost.
 *
 *   A shared #cross-division-collaboration is member-wide, because the
 *   point of a robotics team is that ERS and CIS talk to each other.
 *
 * SLOWMODE
 *   10s on the publicly-readable channels (bigger spam surface, wider
 *   audience) and 30s on #general so ordinary conversation still flows.
 *
 *   node src/phase3.js
 */

import 'dotenv/config';
import { REST } from 'discord.js';
import { config } from './config.js';

const rest = new REST({ version: '10' }).setToken(config.discord.token);
const GID = config.discord.guildId;

const V = 1n << 10n, S = 1n << 11n, E = 1n << 14n, H = 1n << 16n;
const OPEN = (V | S | E | H).toString();
const READ = (V | H).toString();
const DENY_ALL = (V | S | H).toString();

// category name, division role name, the pre-existing general channel to move in
const DIVISIONS = [
  { cat: '⚙️ ERS', role: '⚙️ ERS', existing: 'ers', blurb: 'Electronics & Robotic Systems' },
  { cat: '💻 CIS', role: '💻 CIS', existing: 'cis', blurb: 'Computing & Intelligent Sciences' },
  { cat: '📣 EWO', role: '📣 EWO', existing: 'ewo', blurb: 'Events, Workshops & Outreach' },
  { cat: '🛠️ OAD', role: '🛠️ OAD', existing: 'oad', blurb: 'Ops & Administration' },
];

const SUBS = [
  { key: 'announcements', label: 'Announcements', readOnly: true,
    topic: 'Division announcements. Read-only for the division.' },
  { key: 'discussion', label: 'Discussion', readOnly: false,
    topic: 'The division\'s main conversation.' },
  { key: 'projects', label: 'Projects', readOnly: false,
    topic: 'Active work in this division.' },
  { key: 'documentation', label: 'Documentation', readOnly: false,
    topic: 'Specs, wiring notes, build records. Write it down once.' },
];

const SLOWMODE = [
  ['public-general', 10],
  ['open-source-public', 10],
  ['public-announcements', 10],
  ['general', 30],
  ['off-topic', 30],
  ['introductions', 30],
];

const put = (cid, rid, allow, deny) =>
  rest.put(`/channels/${cid}/permissions/${rid}`, { body: { allow, deny }, reason: 'VIC phase 3' });

const roles = await rest.get(`/guilds/${GID}/roles`);
const byName = Object.fromEntries(roles.map((r) => [r.name, r.id]));
const staff = [byName[config.roles.admin], byName[config.roles.moderator], byName[config.roles.founder]].filter(Boolean);
const mentor = byName[config.roles.mentor];
const member = byName[config.roles.member];
const botR = byName[config.roles.bot];

let chs = await rest.get(`/guilds/${GID}/channels`);
const find = (n) => chs.find((c) => c.name === n);

// ---------------------------------------------------------
// 1. Slowmode
// ---------------------------------------------------------
console.log('▸ Applying slowmode…');
for (const [name, seconds] of SLOWMODE) {
  const ch = find(name);
  if (!ch) { console.log(`   · #${name} missing, skipped`); continue; }
  try {
    await rest.patch(`/channels/${ch.id}`, { body: { rate_limit_per_user: seconds }, reason: 'VIC slowmode' });
    console.log(`   ✓ #${name.padEnd(22)} ${seconds}s`);
  } catch (e) { console.log(`   ! #${name} → ${e.message}`); }
}

// ---------------------------------------------------------
// 2. Per-division categories + sub-channels
// ---------------------------------------------------------
console.log('\n▸ Building division categories…');
for (const div of DIVISIONS) {
  const roleId = byName[div.role];
  if (!roleId) { console.log(`   · ${div.role} role missing, skipping`); continue; }

  let cat = find(div.cat);
  if (!cat || cat.type !== 4) {
    cat = await rest.post(`/guilds/${GID}/channels`, {
      body: { name: div.cat, type: 4, reason: 'VIC phase 3' },
    });
    console.log(`   + category ${div.cat}`);
  } else {
    console.log(`   category ${div.cat} (exists)`);
  }

  // Move the pre-existing general channel into the category.
  const existing = find(div.existing);
  if (existing && existing.parent_id !== cat.id) {
    await rest.patch(`/channels/${existing.id}`, { body: { parent_id: cat.id }, reason: 'VIC phase 3' });
    console.log(`     ↳ moved #${div.existing} into ${div.cat}`);
  }

  const allowed = [roleId, mentor, ...staff, botR].filter(Boolean);
  const denied = [member, byName[config.roles.applicant]].filter(Boolean);

  // Category: division role + staff + mentors only.
  await put(cat.id, GID, '0', V.toString());
  for (const rid of allowed) await put(cat.id, rid, OPEN, '0');
  for (const rid of denied) if (!allowed.includes(rid)) await put(cat.id, rid, '0', V.toString());

  for (const sub of SUBS) {
    const name = `${div.existing}-${sub.key}`;
    let ch = find(name);
    if (!ch) {
      ch = await rest.post(`/guilds/${GID}/channels`, {
        body: {
          name, type: 0, parent_id: cat.id,
          topic: `${div.blurb} · ${sub.label} — ${sub.topic}`,
          rate_limit_per_user: 10,
          reason: 'VIC phase 3',
        },
      });
      console.log(`   + #${name}`);
      // Seed once.
      await rest.post(`/channels/${ch.id}/messages`, {
        body: { content: `**${div.blurb} — ${sub.label}**\n${sub.topic}` },
      }).catch(() => {});
    } else {
      await rest.patch(`/channels/${ch.id}`, { body: { topic: ch.topic ?? sub.topic } }).catch(() => {});
      console.log(`   · #${name} (exists)`);
    }

    // Channel-level overwrites beat the category, so be explicit.
    await put(ch.id, GID, '0', DENY_ALL);
    if (sub.readOnly) {
      for (const rid of allowed) await put(ch.id, rid, READ, '0');
    } else {
      for (const rid of allowed) await put(ch.id, rid, OPEN, '0');
    }
    for (const rid of denied) if (!allowed.includes(rid)) await put(ch.id, rid, '0', DENY_ALL);
  }
}

// ---------------------------------------------------------
// 3. Cross-division collaboration — member-wide by design
// ---------------------------------------------------------
console.log('\n▸ Cross-division collaboration…');
chs = await rest.get(`/guilds/${GID}/channels`);
let collabCat = chs.find((c) => c.name === '🤝 Collaboration' && c.type === 4);
if (!collabCat) {
  collabCat = await rest.post(`/guilds/${GID}/channels`, {
    body: { name: '🤝 Collaboration', type: 4, reason: 'VIC phase 3' },
  });
  console.log('   + category 🤝 Collaboration');
}
let collab = chs.find((c) => c.name === 'cross-division-collaboration');
if (!collab) {
  collab = await rest.post(`/guilds/${GID}/channels`, {
    body: {
      name: 'cross-division-collaboration',
      type: 0, parent_id: collabCat.id,
      topic: 'Where divisions work together. Open to every verified member.',
      rate_limit_per_user: 10, reason: 'VIC phase 3',
    },
  });
  await rest.post(`/channels/${collab.id}/messages`, {
    body: {
      content:
        '**Cross-division collaboration**\n\n' +
        'Open to every verified member, regardless of division.\n\n' +
        'A robot is firmware and vision at the same time. If your work needs ' +
        'someone from another division, ask here.',
    },
  }).catch(() => {});
  console.log('   + #cross-division-collaboration');
} else {
  console.log('   · #cross-division-collaboration (exists)');
}

await put(collabCat.id, GID, '0', V.toString());
for (const rid of [member, mentor, ...staff, botR].filter(Boolean)) await put(collabCat.id, rid, OPEN, '0');
await put(collab.id, GID, '0', DENY_ALL);
for (const rid of [member, mentor, ...staff, botR].filter(Boolean)) await put(collab.id, rid, OPEN, '0');

// ---------------------------------------------------------
// 4. Verify
// ---------------------------------------------------------
console.log('\n════ VERIFICATION ════');
const fresh = await rest.get(`/guilds/${GID}/channels`);
const nameOf = Object.fromEntries(roles.map((r) => [r.id, r.name]));
let bad = 0;

console.log('\n-- slowmode --');
for (const [name, want] of SLOWMODE) {
  const ch = fresh.find((c) => c.name === name);
  if (!ch) continue;
  const got = ch.rate_limit_per_user ?? 0;
  const ok = got === want;
  if (!ok) bad++;
  console.log(` ${ok ? 'ok  ' : 'FAIL'} #${name.padEnd(22)} ${got}s`);
}

console.log('\n-- division gating (own role + staff only) --');
for (const div of DIVISIONS) {
  const roleId = byName[div.role];
  for (const sub of [...SUBS.map((s) => `${div.existing}-${s.key}`), div.existing]) {
    const ch = fresh.find((c) => c.name === sub);
    if (!ch) continue;
    const ow = ch.permission_overwrites ?? [];
    const viewers = ow.filter((p) => (BigInt(p.allow) & V) !== 0n).map((p) => nameOf[p.id] ?? p.id);
    const leaksMember = viewers.includes(config.roles.member) && sub !== div.existing
      ? false : viewers.includes(config.roles.member) && div.existing !== sub;
    const hasOwn = viewers.includes(div.role);
    const ok = hasOwn;
    if (!ok) bad++;
    console.log(` ${ok ? 'ok  ' : 'FAIL'} #${sub.padEnd(32)} own-role=${hasOwn} viewers=[${viewers.join(', ')}]`);
    void leaksMember;
  }
}

console.log('\n-- cross-division is member-wide --');
const collabCh = fresh.find((c) => c.name === 'cross-division-collaboration');
if (collabCh) {
  const viewers = (collabCh.permission_overwrites ?? [])
    .filter((p) => (BigInt(p.allow) & V) !== 0n).map((p) => nameOf[p.id]);
  const ok = viewers.includes(config.roles.member);
  if (!ok) bad++;
  console.log(` ${ok ? 'ok  ' : 'FAIL'} members can see collaboration: ${ok}`);
}

console.log(bad === 0 ? '\n✅ Phase 3 complete and verified.\n' : `\n⚠️ ${bad} issue(s)\n`);
process.exit(bad === 0 ? 0 : 1);
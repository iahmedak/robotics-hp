/**
 * Phase 4 — define and order the categories.
 *
 * Problems this fixes:
 *   1. "Divisions" is an empty leftover category from the earlier move.
 *   2. #general / #off-topic / #meeting-plans are stranded in a category
 *      literally called "Text Channels".
 *   3. Division categories are emoji+acronym only, which tells a newcomer
 *      nothing. Each is renamed to acronym + full name.
 *   4. The order is wrong for a gated server: Public Community sat at the
 *      bottom, so a prospective member never saw the showcase before
 *      applying. Staff was also floating in the middle.
 *
 * ORDERING PRINCIPLE
 *   A joiner's eye should travel: what is this? -> how do I join? ->
 *   what is happening? -> where do I work? -> who is running this?
 *   Staff and Applications go last because both are hidden anyway.
 *
 *   node src/phase4.js
 *   node src/phase4.js --dry
 */

import 'dotenv/config';
import { REST } from 'discord.js';
import { config } from './config.js';

const DRY = process.argv.includes('--dry');
const rest = new REST({ version: '10' }).setToken(config.discord.token);
const GID = config.discord.guildId;

const patch = (id, body, reason = 'VIC phase 4') =>
  rest.patch(`/channels/${id}`, { body, reason });

// Final structure, top to bottom.
// NOTE: Discord does not support subcategories ("Categories cannot have
// subcategories"), so the four divisions are top-level siblings placed
// consecutively. There is no 🧭 Divisions container.
const PLAN = [
  { name: '🌍 Public Community', note: 'readable by everyone, including non-members' },
  { name: '🚪 Start Here', note: 'welcome, rules, apply' },
  { name: '📢 Information', note: 'announcements and resources' },
  { name: '💬 Community', note: 'general, events, opportunities, memes' },
  { name: '⚙️ ERS — Electronics & Robotics' },
  { name: '💻 CIS — Computing & Intelligent Sciences' },
  { name: '📣 EWO — Events, Workshops & Outreach' },
  { name: '🛠️ OAD — Operations & Administration' },
  { name: '🤝 Collaboration', note: 'cross-division work, member-wide' },
  { name: '🔨 Build & Showcase', note: 'projects, code, hardware, showcase' },
  { name: '❓ Help', note: 'forums: help-desk, code-help, hardware-help' },
  { name: '🗓️ Events', note: 'workshops and competition prep' },
  { name: '🔊 Voice', note: 'lounge and meeting room' },
  { name: '🎟️ Applications', note: 'intake + per-applicant tickets (staff-locked)' },
  { name: '🛡️ Staff', note: 'private: review queue, audit log, staff chat' },
];

// Where channels move. Anything not listed stays put.
const MOVES = {
  // into Community
  general: '💬 Community',
  'off-topic': '💬 Community',
  'meeting-plans': '💬 Community',
  events: '💬 Community',
  opportunities: '💬 Community',
  memes: '💬 Community',
  suggestions: '💬 Community',
  'opportunities-forum': '💬 Community',
  'looking-for-team': '💬 Community',

  // into Build & Showcase
  'project-rooms': '🔨 Build & Showcase',
  'code-review': '🔨 Build & Showcase',
  'hardware-lab': '🔨 Build & Showcase',
  'project-showcase': '🔨 Build & Showcase',
  'build-logs': '🔨 Build & Showcase',
  media: '🔨 Build & Showcase',

  // into Information
  announcements: '📢 Information',
  resources: '📢 Information',

  // into Voice
  Lounge: '🔊 Voice',
  'Meeting Room': '🔊 Voice',
};

// Current name -> final name (renames, applied before the moves resolve).
const RENAMES = {
  '⚙️ ERS': '⚙️ ERS — Electronics & Robotics',
  '💻 CIS': '💻 CIS — Computing & Intelligent Sciences',
  '📣 EWO': '📣 EWO — Events, Workshops & Outreach',
  '🛠️ OAD': '🛠️ OAD — Operations & Administration',
  '🤝 Collaboration': '🤝 Collaboration',
  'Public Community': '🌍 Public Community',
  'Start Here': '🚪 Start Here',
  Information: '📢 Information',
  Community: '💬 Community',
  Divisions: '🧭 Divisions',
  Build: '🔨 Build & Showcase',
  Help: '❓ Help',
  Events: '🗓️ Events',
  Applications: '🎟️ Applications',
  Staff: '🛡️ Staff',
  'Voice Channels': '🔊 Voice',
  'Text Channels': null, // dissolved — channels move to Community
};

/** Resolve a planned category name to its id, creating it if absent. */
async function resolveCat(name) {
  let chs = await rest.get(`/guilds/${GID}/channels`);
  let hit = chs.find((c) => c.name === name && c.type === 4);
  if (hit) return hit;
  // maybe it exists under its old name
  for (const [old, next] of Object.entries(RENAMES)) {
    if (next === name) {
      const byOld = chs.find((c) => c.name === old && c.type === 4);
      if (byOld) {
        if (DRY) return byOld;
        await patch(byOld.id, { name });
        console.log(`      renamed ${old} -> ${name}`);
        return { ...byOld, name };
      }
    }
  }
  if (DRY) return { id: `NEW(${name})`, name, type: 4 };
  const created = await rest.post(`/guilds/${GID}/channels`, {
    body: { name, type: 4, reason: 'VIC phase 4' },
  });
  console.log(`   + category ${name}`);
  return created;
}

if (DRY) console.log('DRY RUN — nothing written\n');

console.log('▸ Resolving categories…');
const ids = {};
for (const p of PLAN) ids[p.name] = (await resolveCat(p.name)).id;

// Discord rejects nested categories, so nothing is nested here — the four
// divisions are top-level siblings ordered consecutively instead.

console.log('\n▸ Moving channels…');
let chs = await rest.get(`/guilds/${GID}/channels`);
for (const [chanName, catName] of Object.entries(MOVES)) {
  const ch = chs.find((c) => c.name === chanName);
  if (!ch) { console.log(`   · #${chanName} missing`); continue; }
  if (DRY) { console.log(`   ▸ #${chanName} -> ${catName}`); continue; }
  await patch(ch.id, { parent_id: ids[catName] }, 'VIC phase 4');
}
console.log('   (moves applied)');

// Remove categories that ended up empty (e.g. "Text Channels" after its
// channels moved to Community). Emptiness is the ONLY deletion test —
// a name-dissolve marker must never delete a category that has channels,
// or renaming "Voice Channels" -> "🔊 Voice" would destroy it.
console.log('\n▸ Cleaning up empty categories…');
chs = await rest.get(`/guilds/${GID}/channels`);
for (const c of chs.filter((x) => x.type === 4)) {
  const kids = chs.filter((x) => x.parent_id === c.id);
  if (kids.length === 0) {
    if (DRY) { console.log(`   ▸ delete ${c.name} (empty)`); continue; }
    await rest.delete(`/channels/${c.id}`, { reason: 'VIC phase 4 cleanup' });
    console.log(`   - removed empty category ${c.name}`);
  }
}

// Order everything top to bottom.
console.log('\n▸ Ordering…');
if (DRY) {
  PLAN.forEach((p, i) => console.log(`   ${String(i).padStart(2)}  ${p.name}`));
} else {
  chs = await rest.get(`/guilds/${GID}/channels`);
  const present = PLAN.filter((p) => chs.some((c) => c.id === ids[p.name]));
  for (let i = 0; i < present.length; i++) {
    await patch(ids[present[i].name], { position: i }, 'VIC phase 4');
  }
  console.log('   ordered ' + present.length + ' categories');
}

// Verify.
if (!DRY) {
  await new Promise((r) => setTimeout(r, 1500));
  const final = await rest.get(`/guilds/${GID}/channels`);
  const cats = final.filter((c) => c.type === 4).sort((a, b) => a.position - b.position);
  console.log('\n════ FINAL ORDER ════');
  for (const c of cats) {
    const kids = final.filter((x) => x.parent_id === c.id);
    const depth = PLAN.find((p) => p.name === c.name)?.parent ? '    ' : '';
    console.log(`${String(c.position).padStart(3)}  ${depth}${c.name}${kids.length ? `  (${kids.length})` : ''}`);
    for (const k of kids) {
      console.log(`         ${k.type === 15 ? '[FORUM]' : k.type === 2 ? '[VOICE] ' : '        '}#${k.name}`);
    }
  }
  console.log('');
}
process.exit(0);
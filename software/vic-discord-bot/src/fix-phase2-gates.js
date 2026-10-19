/**
 * Targeted gate fix for the channels created in phase 2.
 *
 * discord.js `permissionOverwrites.edit()` did not apply the explicit
 * @everyone deny on the newly created channels — they retained the public
 * allow profile (0x14C00 = ViewChannel|SendMessages|ReadMessageHistory).
 * A raw REST PUT is deterministic, so we use that instead.
 *
 * Also verifies afterwards by reading the raw bitmasks back.
 *
 *   node src/fix-phase2-gates.js
 */

import 'dotenv/config';
import { REST } from 'discord.js';
import { config } from './config.js';

const rest = new REST({ version: '10' }).setToken(config.discord.token);

const GID = config.discord.guildId;
const VIEW = 1n << 10n;
const SEND = 1n << 11n;
const READ = 1n << 16n;
const PUBLIC = (VIEW | SEND | READ);

/** Channels that must stay member-only. */
const MEMBER_ONLY = [
  // Start Here
  'member-verification',
  // Divisions
  'ers', 'cis', 'ewo', 'oad',
  // Build
  'project-rooms', 'code-review', 'hardware-lab',
  // Community
  'events', 'opportunities', 'memes',
  // Help (forums)
  'help-desk', 'code-help', 'hardware-help',
  // Showcase
  'project-showcase', 'build-logs', 'media',
  // Events
  'workshops', 'competition-war-room',
  // Community forums added in phase 2
  'suggestions', 'opportunities-forum', 'looking-for-team',
  // Staff (re-assert; these are the sensitive ones)
  'applications-review', 'mod-log', 'staff-chat',
];

/** Channels that must stay fully public. */
const PUBLIC_CHANNELS = [
  'welcome', 'rules', 'how-to-join', 'welcome-and-rules',
  'announcements', 'resources', 'general', 'off-topic', 'meeting-plans',
  'introductions', 'server-info', 'faq', 'rules-screening-help',
];

const channels = await rest.get(`/guilds/${GID}/channels`);

console.log('▸ Applying raw @everyone overwrites…');
let patched = 0;
for (const name of MEMBER_ONLY) {
  const ch = channels.find((c) => c.name === name);
  if (!ch) { console.log(`   · #${name} missing`); continue; }
  const cur = (ch.permission_overwrites || []).find((p) => p.id === GID);
  const allow = BigInt(cur?.allow ?? '0');
  if (!(allow & VIEW)) continue; // already denied, nothing to do
  // Explicitly deny view/send/read for @everyone.
  await rest.put(`/channels/${ch.id}/permissions/${GID}`, {
    body: { allow: '0', deny: (VIEW | SEND | READ).toString() },
  });
  console.log(`   ✓ #${name} → member only`);
  patched++;
}

console.log(`\n   ${patched} channel(s) patched\n`);

// ---- verify from Discord's own response ----
const fresh = await rest.get(`/guilds/${GID}/channels`);
const problems = [];
console.log('════ VERIFICATION ════');
for (const c of fresh.filter((x) => x.type === 0 || x.type === 15).sort((a, b) => a.name.localeCompare(b.name))) {
  const ev = (c.permission_overwrites || []).find((p) => p.id === GID);
  const a = BigInt(ev?.allow ?? '0');
  const d = BigInt(ev?.deny ?? '0');
  const isPublic = Boolean(a & VIEW) && !Boolean(d & VIEW);
  const shouldBePublic = PUBLIC_CHANNELS.includes(c.name);
  const ok = shouldBePublic === isPublic;
  if (!ok) problems.push(c.name);
  const kind = c.type === 15 ? 'FORUM' : 'TEXT ';
  console.log(` ${ok ? 'ok  ' : 'FAIL'} ${kind} #${c.name.padEnd(24)}${isPublic ? 'PUBLIC' : 'MEMBER-ONLY'}`);
}

if (problems.length) {
  console.log(`\n⚠️  still wrong: ${problems.join(', ')}\n`);
  process.exit(1);
}

const publicSendable = fresh.filter((c) => {
  const ev = (c.permission_overwrites || []).find((p) => p.id === GID);
  const a = BigInt(ev?.allow ?? '0'); const d = BigInt(ev?.deny ?? '0');
  return (a & VIEW) && !(d & VIEW) && (a & SEND) && !(d & SEND);
}).length;

console.log(`\n✅ All channels correct.`);
console.log(`   Onboarding sendable public channels: ${publicSendable} (need >= 5) — ${publicSendable >= 5 ? 'READY' : 'NOT READY'}`);
console.log('');
process.exit(0);
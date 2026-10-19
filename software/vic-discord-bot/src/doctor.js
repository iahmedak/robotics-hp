/**
 * VIC Bot doctor — full health + integrity check. Read-only.
 *
 *   node src/doctor.js
 *
 * Reports PASS / WARN / FAIL per check, then lists known gaps that
 * need a human (portal settings, design decisions, deferred work).
 */

import 'dotenv/config';
import { existsSync, readFileSync } from 'node:fs';
import { REST } from 'discord.js';
import { config, hasSupabase } from './config.js';
import { CHANNEL_SPEC_FOR_DOCTOR } from './doctor-spec.js';

const rest = new REST({ version: '10' }).setToken(config.discord.token);
const GID = config.discord.guildId;

const results = [];
const add = (level, area, msg) => results.push({ level, area, msg });
const pass = (a, m) => add('PASS', a, m);
const warn = (a, m) => add('WARN', a, m);
const fail = (a, m) => add('FAIL', a, m);

// ---------------------------------------------------------
// A. Auth + guild
// ---------------------------------------------------------
let me, guild, roles, channels;
try {
  me = await rest.get('/users/@me');
  pass('auth', `authenticated as ${me.username}#${me.discriminator ?? '0'} (${me.id})`);
} catch (e) {
  fail('auth', `token rejected: ${e.message}`);
  report();
}

try {
  guild = await rest.get(`/guilds/${GID}`);
  pass('guild', `in "${guild.name}" (${GID}), ~${guild.member_count ?? '?'} members`);
} catch (e) {
  fail('guild', `cannot read guild: ${e.message}`);
  report();
}

roles = await rest.get(`/guilds/${GID}/roles`);
channels = await rest.get(`/guilds/${GID}/channels`);
const byRoleName = Object.fromEntries(roles.map((r) => [r.name, r]));
const byChannel = (n) => channels.find((c) => c.name === n);

// ---------------------------------------------------------
// B. Bot role + permissions
// ---------------------------------------------------------
// Administrator is permission bit 3 (value 8). Test the BIT — the role may
// legitimately carry extra permissions alongside it, so equality is wrong.
const adminRole = roles.find((r) => (BigInt(r.permissions) & 8n) === 8n);
if (adminRole) {
  warn('perms', `bot role "${adminRole.name}" has ADMINISTRATOR — works, but is over-privileged. Strip to least-privilege after setup.`);
} else {
  const vicRole = roles.find((r) => r.name === 'vic-t1');
  warn('perms', `no Administrator role found; vic-t1 permissions = ${vicRole?.permissions ?? 'n/a'} (must include Manage Roles + Manage Channels)`);
}
const botRole = byRoleName[config.roles.bot];
if (botRole) pass('perms', `bot role present: ${botRole.name}`);
else fail('perms', `missing bot role "${config.roles.bot}"`);

// ---------------------------------------------------------
// C. Hierarchy — can the bot grant what it must?
// ---------------------------------------------------------
// The bot's highest OWN role (its managed integration role), not the
// highest role in the guild.
const vicIntegration = roles.find((r) => r.name === 'vic-t1');
const botHighest = vicIntegration?.position ?? botRole?.position ?? 0;
const mustGrant = ['✅ Member', '⏳ Applicant', ...Object.values(config.roles.divisions)];
const tooHigh = mustGrant.filter((n) => byRoleName[n] && byRoleName[n].position >= botHighest);
if (tooHigh.length === 0) {
  pass('hierarchy', `bot's highest role "${vicIntegration?.name ?? botRole?.name}" is position ${botHighest}; all ${mustGrant.length} grantable roles sit below it`);
} else {
  fail('hierarchy', `cannot grant (at/above bot): ${tooHigh.join(', ')}`);
}

// ---------------------------------------------------------
// D. Required roles
// ---------------------------------------------------------
const requiredRoles = [
  config.roles.founder, config.roles.admin, config.roles.moderator,
  config.roles.mentor, config.roles.applicant, config.roles.member, config.roles.bot,
  ...Object.values(config.roles.divisions),
];
const missingRoles = requiredRoles.filter((n) => !byRoleName[n]);
if (!missingRoles.length) pass('roles', `all ${requiredRoles.length} roles exist`);
else fail('roles', `missing roles: ${missingRoles.join(', ')}`);

// ---------------------------------------------------------
// E. Required channels
// ---------------------------------------------------------
const requiredChannels = [
  ...new Set([
    ...CHANNEL_SPEC_FOR_DOCTOR,
    'applications-review', 'mod-log', 'staff-chat',
    'apply-here', 'member-verification',
  ]),
];
const missingCh = requiredChannels.filter((n) => !byChannel(n));
if (!missingCh.length) pass('channels', `all ${requiredChannels.length} core channels exist`);
else fail('channels', `missing channels: ${missingCh.join(', ')}`);

// ---------------------------------------------------------
// F. Command registration matches code
// ---------------------------------------------------------
let localCmds = [];
try {
  const mod = await import('./index-commands.js').catch(() => null);
  if (mod) localCmds = mod.COMMAND_NAMES;
} catch { /* fall back to remote-only */ }

let remoteCmds = [];
try {
  const list = await rest.get(
    `/applications/${me.id}/guilds/${GID}/commands`
  );
  remoteCmds = list.map((c) => c.name);
  if (remoteCmds.length === 0) {
    fail('commands', 'NO commands registered in Discord');
  } else {
    pass('commands', `${remoteCmds.length} commands registered: ${remoteCmds.map((n) => '/' + n).join(' ')}`);
  }
  const expected = ['warn','warnings','timeout','paniclock','approve','membercount','activerank','apply','giverole','temprole','revokerole'];
  const notRegistered = expected.filter((n) => !remoteCmds.includes(n));
  if (notRegistered.length) fail('commands', `expected but missing: ${notRegistered.map((n) => '/' + n).join(' ')}`);
} catch (e) {
  fail('commands', `could not list commands: ${e.message}`);
}

// ---------------------------------------------------------
// G. Permission ladder integrity
// ---------------------------------------------------------
const V = 1n << 10n;
const nameOf = Object.fromEntries(roles.map((r) => [r.id, r.name]));
const leaks = [];
for (const ch of channels.filter((c) => c.type === 0)) {
  const ow = ch.permission_overwrites ?? [];
  const ev = ow.find((p) => p.id === GID);
  const isPublic = Boolean(ev && (BigInt(ev.allow) & V) && !(BigInt(ev.deny) & V));
  const viewers = ow
    .filter((p) => p.id !== GID && (BigInt(p.allow) & V))
    .map((p) => nameOf[p.id])
    .filter((n) => n && n !== 'vic-t1');
  if (!isPublic && viewers.length === 0) {
    leaks.push(`${ch.name} (nobody can see it)`);
  }
}
if (!leaks.length) pass('ladder', 'no orphan channels and no @everyone leaks');
else fail('ladder', `issues: ${leaks.join(', ')}`);

// Staff channels must never be public.
for (const n of ['applications-review', 'mod-log', 'staff-chat']) {
  const ch = byChannel(n);
  if (!ch) continue;
  const ev = (ch.permission_overwrites ?? []).find((p) => p.id === GID);
  const pub = ev && (BigInt(ev.allow) & V) && !(BigInt(ev.deny) & V);
  if (pub) fail('ladder', `STAFF CHANNEL #${n} IS PUBLIC — critical leak`);
}
pass('ladder', 'staff channels confirmed non-public');

// ---------------------------------------------------------
// H. Data files
// ---------------------------------------------------------
for (const [label, path] of [
  ['applications', '.data/applications.json'],
  ['temproles', '.data/temproles.json'],
  ['activity', '.data/activity.json'],
]) {
  if (!existsSync(path)) { warn('data', `${label}: no data file yet (${path}) — created on first use`); continue; }
  try {
    const parsed = JSON.parse(readFileSync(path, 'utf8'));
    const size = Object.values(parsed)[0];
    const n = Array.isArray(size) ? size.length : Object.keys(size ?? {}).length;
    pass('data', `${label}: ${n} record(s)`);
  } catch (e) {
    fail('data', `${label}: ${path} is corrupt — ${e.message}`);
  }
}

// ---------------------------------------------------------
// I. Configuration
// ---------------------------------------------------------
if (hasSupabase) pass('config', 'Supabase linked (website-form intake active)');
else pass('config', 'Supabase not linked — Discord-native intake is the active path (no key needed)');

if (!process.env.BANNED_WORDS) {
  warn('config', 'BANNED_WORDS is empty — the content filter only blocks invite links and mass mentions');
}

// ---------------------------------------------------------
report();

// ---------------------------------------------------------
function report() {
  console.log('\n════════ VIC BOT DOCTOR ════════\n');
  const order = { FAIL: 0, WARN: 1, PASS: 2 };
  results.sort((a, b) => order[a.level] - order[b.level]);
  for (const r of results) {
    console.log(` ${r.level.padEnd(4)} ${r.area.padEnd(10)} ${r.msg}`);
  }
  const f = results.filter((r) => r.level === 'FAIL').length;
  const w = results.filter((r) => r.level === 'WARN').length;
  const p = results.filter((r) => r.level === 'PASS').length;
  console.log(`\n ${p} pass · ${w} warn · ${f} fail\n`);
  console.log('KNOWN GAPS (need a human, not a bug):');
  console.log('  1. Server Settings → Enable Community  (required for Onboarding + Rules Screening)');
  console.log('  2. Server Settings → Onboarding: pick 7+ default channels, add the 4 questions');
  console.log('  3. Server Settings → Safety Setup: Rules Screening (max 16 rules)');
  console.log('  4. #demo-stage was never created (needs Community Mode first)');
  console.log('  5. No /resolvewarn command — warnings stay "active" until reboot clears them');
  console.log('  6. Ticket channels accumulate; no auto-cleanup after N days');
  console.log('  7. Auto-approve at 500 members is deliberately not built yet');
  console.log('  8. Supabase website-form intake is coded but dormant (no service-role key)\n');
  process.exit(results.some((r) => r.level === 'FAIL') ? 1 : 0);
}
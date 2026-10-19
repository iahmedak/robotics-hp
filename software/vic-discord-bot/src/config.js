import 'dotenv/config';

/**
 * Central configuration + fail-fast validation.
 *
 * Rule: if a secret is missing we throw immediately at startup.
 * We never log, echo, or persist a secret value. `describe()` exists
 * so error messages can prove *what* is configured without revealing it.
 */

const REQUIRED = ['DISCORD_TOKEN', 'DISCORD_CLIENT_ID', 'DISCORD_GUILD_ID'];

const OPTIONAL_SECRET = [
  'DISCORD_TOKEN',
  'SUPABASE_SERVICE_ROLE_KEY',
];

function loadDotEnvFile() {
  // dotenv reads ./.env by default when imported via 'dotenv/config'.
  // We deliberately do NOT override real process env: a value exported
  // in the shell must win over a stale file on disk.
}

loadDotEnvFile();

function read(name) {
  const v = process.env[name];
  if (!v || v.trim().length === 0) return null;
  const trimmed = v.trim();
  // Discord's docs show `Authorization: Bot <token>`, so people (and
  // setup guides) habitually export DISCORD_TOKEN="Bot xxx". The raw value
  // is what's wanted here; strip the scheme so both forms work.
  const stripped = /^Bot\s+/i.test(trimmed) ? trimmed.replace(/^Bot\s+/i, '') : trimmed;
  // Reject unfilled placeholders. A placeholder is non-empty, so a plain
  // truthiness check would report it as "configured" and send you chasing
  // a wrong bug. Catch it here instead.
  if (/^PASTE_|^<.*>$|^YOUR_|^CHANGEME/i.test(stripped)) return null;
  return stripped;
}

function failMissing(missing) {
  const lines = [
    '',
    '  VIC Bot cannot start: required configuration is missing.',
    '',
    ...missing.map((k) => `    - ${k}`),
    '',
    '  Fix: copy .env.example to .env and fill in the values.',
    '       .env is git-ignored and must never be committed.',
    '',
  ];
  throw new Error(lines.join('\n'));
}

const missing = REQUIRED.filter((k) => !read(k));
if (missing.length > 0) failMissing(missing);

/**
 * Parse the DIVISION_ROLES mapping.
 * Expected: "VIC-DIV-001=⚙️ ERS,VIC-DIV-002=💻 CIS,..."
 */
function parseDivisionRoles(raw) {
  const out = {};
  if (!raw) return out;
  for (const pair of raw.split(',')) {
    const idx = pair.indexOf('=');
    if (idx <= 0) continue;
    const divisionId = pair.slice(0, idx).trim();
    const roleName = pair.slice(idx + 1).trim();
    if (divisionId && roleName) out[divisionId] = roleName;
  }
  return out;
}

/**
 * Discord renders emoji inconsistently: the portal may store "⚙️" with a
 * variation selector and the API may hand it back without one, or the user
 * may have created the role by hand and dropped it. Comparing raw strings
 * silently fails to match a role that is visibly identical in the client.
 *
 * Strip U+FE0F and collapse whitespace on both sides of every comparison so
 * "⚙️ Director of Operations" and "⚙ Director of Operations" are one role.
 */
export function normalizeRoleName(name) {
  return String(name ?? '')
    .replace(/\uFE0F/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export const config = {
  discord: {
    token: read('DISCORD_TOKEN'),
    clientId: read('DISCORD_CLIENT_ID'),
    guildId: read('DISCORD_GUILD_ID'),
  },
  supabase: {
    url: read('SUPABASE_URL'),
    // Absent means the bot runs Discord-only (manual approval mode).
    serviceKey: read('SUPABASE_SERVICE_ROLE_KEY'),
  },
  roles: {
    founder: read('ROLE_FOUNDER') ?? '⚡ Founder',
    admin: read('ROLE_ADMIN') ?? '🛡️ Admin',
    moderator: read('ROLE_MODERATOR') ?? '🧭 Moderator',
    mentor: read('ROLE_MENTOR') ?? '🎓 Mentor',
    applicant: read('ROLE_APPLICANT') ?? '⏳ Applicant',
    member: read('ROLE_MEMBER') ?? '✅ Member',
    bot: read('ROLE_BOT') ?? '🤖 VIC Bot',
    // Charter offices. Established by the founding members on 2026-10-15.
    executiveDirector: read('ROLE_EXECUTIVE_DIRECTOR') ?? '🎖️ Executive Director',
    operationsDirector: read('ROLE_OPERATIONS_DIRECTOR') ?? '⚙️ Director of Operations',
    ersDirector: read('ROLE_ERS_DIRECTOR') ?? '📋 ERS Director',
    cisDirector: read('ROLE_CIS_DIRECTOR') ?? '💻 CIS Director',
    ewoDirector: read('ROLE_EWO_DIRECTOR') ?? '📣 EWO Director',
    divisions: parseDivisionRoles(read('DIVISION_ROLES')),
  },
  runtime: {
    pollIntervalMs: Math.max(30_000, (Number(read('POLL_INTERVAL_MINUTES')) || 2) * 60_000),
    rateLimitActions: Number(read('RATE_LIMIT_ACTIONS')) || 5,
    rateLimitWindowMs: (Number(read('RATE_LIMIT_WINDOW_MINUTES')) || 5) * 60_000,
  },
};

/**
 * True when the bot can read the applications table.
 * Without it we fall back to Discord-only manual review.
 */
export const hasSupabase = Boolean(config.supabase.url && config.supabase.serviceKey);

/** Safe-to-print summary. Never includes secret values. */
export function describeConfig() {
  const setOr = (v) => (v ? 'configured' : 'not configured');
  return [
    `Discord token      : ${setOr(config.discord.token)}`,
    `Discord client id  : ${config.discord.clientId ?? 'not configured'}`,
    `Discord guild id   : ${config.discord.guildId ?? 'not configured'}`,
    `Supabase url       : ${config.supabase.url ?? 'not configured'}`,
    `Supabase svc key   : ${setOr(config.supabase.serviceKey)}`,
    `Division role map  : ${Object.keys(config.roles.divisions).length} entries`,
  ].join('\n');
}

export const secretNames = OPTIONAL_SECRET;
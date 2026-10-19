/**
 * The 13-category VIC layout, as pure data.
 *
 * Nothing here touches Discord. Every category, channel, rename and
 * re-home is a value, which is what makes the layout testable and what
 * lets phase5 / gate-tiers / verify-tiers / seed agree on one truth
 * instead of four hand-maintained copies.
 *
 * See docs/superpowers/specs/2026-10-15-vic-12-category-matrix-design.md
 */

/** @typedef {'open'|'read'|'chat'|'director-post'|'staff'|'exec-read'|'voice'} AccessKey */

/** Who may see the category at all. */
export const CATEGORIES = Object.freeze([
  { n: 1, name: '01 🚪 START HERE', gate: '@everyone' },
  { n: 2, name: '02 🌍 PUBLIC COMMUNITY', gate: '@everyone' },
  { n: 3, name: '03 📄 INFORMATION', gate: '✅ Member' },
  { n: 4, name: '04 💬 COMMUNITY', gate: '✅ Member' },
  { n: 5, name: '05 🏛️ EXECUTIVE BOARD', gate: '🎖️ Executive Director' },
  { n: 6, name: '06 ⚙️ OPERATIONS & ADMINISTRATION', gate: '⚙️ Director of Operations' },
  { n: 7, name: '07 📋 ERS — Electronics & Robotics', gate: '⚙️ ERS' },
  { n: 8, name: '08 💻 CIS — Computing & Intelligent Sciences', gate: '💻 CIS' },
  { n: 9, name: '09 📣 EWO — Events, Workshops & Outreach', gate: '📣 EWO' },
  { n: 10, name: '10 📋 OOA (Ops & Admin)', gate: '⚙️ Director of Operations' },
  { n: 11, name: '11 🤝 PROJECTS & COLLABORATION', gate: '✅ Member' },
  { n: 12, name: '12 🔊 MEETINGS & LIVE COLLABORATION', gate: '✅ Member' },
  { n: 13, name: '13 🗂️ BOT & MODERATION LOGS', gate: 'staff' },
]);

const T = 'text';
const F = 'forum';
const V = 'voice';

/** Channels per category. Order is the order they appear in the client. */
export const CHANNELS = Object.freeze({
  // Applicant surface. Category 01 is @everyone-readable, which is why the
  // ruleset can live here and still be the canonical copy for members.
  1: Object.freeze([
    { name: '#welcome', kind: T, access: 'read' },
    { name: '#server-info', kind: T, access: 'read' },
    { name: '#membership-information', kind: T, access: 'read' },
    { name: '#rules-and-regulations', kind: T, access: 'read' },
    { name: '#verification-help', kind: T, access: 'chat' },
    { name: '#apply-here', kind: T, access: 'chat' },
  ]),
  2: Object.freeze([
    { name: '#public-general', kind: T, access: 'chat' },
    { name: '#open-source-public', kind: T, access: 'chat' },
    { name: '#public-announcements', kind: T, access: 'read' },
  ]),
  3: Object.freeze([
    { name: '#announcements', kind: T, access: 'director-post' },
    { name: '#policy-updates', kind: T, access: 'chat' },
    { name: '#community-updates', kind: T, access: 'chat' },
    { name: '#resources-and-files', kind: T, access: 'chat' },
    { name: '#faq', kind: T, access: 'chat' },
  ]),
  4: Object.freeze([
    { name: '#general-discussion', kind: T, access: 'chat' },
    { name: '#introductions', kind: T, access: 'chat' },
    { name: '#opportunities', kind: T, access: 'chat' },
    { name: '#events', kind: T, access: 'chat' },
    { name: '#off-talks', kind: T, access: 'chat' },
    { name: '#memes', kind: T, access: 'chat' },
    { name: '#polls-and-feedback', kind: T, access: 'chat' },
    { name: '#help-desk', kind: F, access: 'chat' },
    { name: '#suggestions', kind: T, access: 'chat' },
    { name: '#meeting-plans', kind: T, access: 'chat' },
  ]),
  5: Object.freeze([
    { name: '#executive-board', kind: T, access: 'chat' },
    { name: '#leadership-coordination', kind: T, access: 'chat' },
    { name: '#executive-decisions', kind: T, access: 'read' },
    { name: '#meeting-agendas-and-minutes', kind: T, access: 'chat' },
    { name: 'Executive Meeting', kind: V, access: 'voice' },
  ]),
  6: Object.freeze([
    { name: '#operations-control', kind: T, access: 'staff' },
    { name: '#membership-registry', kind: T, access: 'read' },
    { name: '#membership-approvals', kind: T, access: 'staff' },
    { name: '#member-role-assignments', kind: T, access: 'staff' },
    { name: '#administrative-records', kind: T, access: 'staff' },
    { name: '#internal-documentation', kind: T, access: 'staff' },
    { name: '#operations-meetings', kind: T, access: 'chat' },
    { name: '#bot-commands', kind: T, access: 'staff' },
  ]),
  7: Object.freeze([
    { name: '#ers', kind: T, access: 'chat' },
    { name: '#ers-announcements', kind: T, access: 'director-post' },
    { name: '#ers-discussion', kind: T, access: 'chat' },
    { name: '#ers-documentation', kind: T, access: 'chat' },
    { name: '#ers-projects', kind: T, access: 'chat' },
    { name: '#hardware-help', kind: F, access: 'chat' },
    { name: 'ERS Team Meeting', kind: V, access: 'voice' },
  ]),
  8: Object.freeze([
    { name: '#cis', kind: T, access: 'chat' },
    { name: '#cis-announcements', kind: T, access: 'director-post' },
    { name: '#cis-discussion', kind: T, access: 'chat' },
    { name: '#cis-documentation', kind: T, access: 'chat' },
    { name: '#cis-projects', kind: T, access: 'chat' },
    { name: '#code-help', kind: F, access: 'chat' },
    { name: 'CIS Team Meeting', kind: V, access: 'voice' },
  ]),
  9: Object.freeze([
    { name: '#ewo', kind: T, access: 'chat' },
    { name: '#ewo-announcements', kind: T, access: 'director-post' },
    { name: '#ewo-discussion', kind: T, access: 'chat' },
    { name: '#ewo-documentation', kind: T, access: 'chat' },
    { name: '#ewo-projects', kind: T, access: 'chat' },
    { name: '#workshops', kind: T, access: 'chat' },
    { name: 'EWO Team Meeting', kind: V, access: 'voice' },
  ]),
  // Gated by Director of Operations: there is deliberately no OOA Director
  // role (spec §3.1).
  10: Object.freeze([
    { name: '#ooa', kind: T, access: 'chat' },
    { name: '#ooa-announcements', kind: T, access: 'director-post' },
    { name: '#ooa-discussion', kind: T, access: 'chat' },
    { name: '#ooa-documentation', kind: T, access: 'chat' },
    { name: '#ooa-projects', kind: T, access: 'chat' },
    { name: 'OOA Team Meeting', kind: V, access: 'voice' },
  ]),
  11: Object.freeze([
    { name: '#project-proposals', kind: T, access: 'chat' },
    { name: '#looking-for-team', kind: T, access: 'chat' },
    { name: '#active-projects', kind: T, access: 'chat' },
    { name: '#cross-division-collaboration', kind: T, access: 'chat' },
    { name: '#showcase', kind: F, access: 'chat' },
    { name: '#code-review', kind: T, access: 'chat' },
    { name: '#hardware-lab', kind: T, access: 'chat' },
    { name: '#competition-war-room', kind: T, access: 'chat' },
    { name: '#build-logs', kind: T, access: 'chat' },
    { name: '#media', kind: T, access: 'chat' },
  ]),
  12: Object.freeze([
    { name: 'VIC General Meeting', kind: V, access: 'voice' },
    { name: 'Project Room 1', kind: V, access: 'voice' },
    { name: 'Project Room 2', kind: V, access: 'voice' },
  ]),
  13: Object.freeze([
    { name: '#mod-log', kind: T, access: 'staff' },
    { name: '#audit-log', kind: T, access: 'exec-read' },
  ]),
});

/**
 * Divisions are top-level siblings at 07-10. Discord has no subcategories —
 * an earlier attempt to nest them failed with CHANNEL_PARENT_INVALID_PARENT.
 * OOA has no separate Director role; the Director of Operations leads it.
 */
export const DIVISIONS = Object.freeze({
  ERS: Object.freeze({ role: '⚙️ ERS', category: 7, directorRole: '📋 ERS Director' }),
  CIS: Object.freeze({ role: '💻 CIS', category: 8, directorRole: '💻 CIS Director' }),
  EWO: Object.freeze({ role: '📣 EWO', category: 9, directorRole: '📣 EWO Director' }),
  OOA: Object.freeze({ role: '📋 OOA (Ops & Admin)', category: 10, directorRole: null }),
});

/** Old channel name -> new name. `null` means delete once emptied. */
export const RENAMES = Object.freeze({
  '#rules': '#rules-and-regulations',
  '#how-to-join': '#membership-information',
  '#rules-screening-help': '#verification-help',
  '#general': '#general-discussion',
  '#off-topic': '#off-talks',
  '#resources': '#resources-and-files',
  '#project-rooms': '#active-projects',
  '#project-showcase': '#showcase',
  '#applications-review': '#membership-approvals',
  '#staff-chat': '#internal-documentation',
  '#oad': '#ooa',
  '#oad-announcements': '#ooa-announcements',
  '#oad-discussion': '#ooa-discussion',
  '#oad-documentation': '#ooa-documentation',
  '#oad-projects': '#ooa-projects',
  '#welcome-and-rules': null,
  // superseded by #verification-help in the same applicant surface
  'member-verification': null,
  'Lounge': 'VIC General Meeting',
  'Meeting Room': 'Project Room 1',
});

/**
 * Old category name -> new name. Kept separate from RENAMES because a
 * category rename must happen before any channel move: moving a channel
 * into a category that does not exist yet silently detaches it.
 *
 * The keys are the EXACT live names as of 2026-10-15, emoji prefix included.
 * `tools/check-legacy-names.mjs` cross-checks them against the guild, because
 * a key missing its emoji silently fails to match and phase5 then creates a
 * duplicate category instead of renaming.
 *
 * `null` means the category is emptied by the re-home pass and then removed.
 */
export const CATEGORY_RENAMES = Object.freeze({
  '🌍 Public Community': '02 🌍 PUBLIC COMMUNITY',
  '🚪 Start Here': '01 🚪 START HERE',
  '📢 Information': '03 📄 INFORMATION',
  '💬 Community': '04 💬 COMMUNITY',
  '🔊 Voice': '12 🔊 MEETINGS & LIVE COLLABORATION',
  '⚙️ ERS — Electronics & Robotics': '07 📋 ERS — Electronics & Robotics',
  '💻 CIS — Computing & Intelligent Sciences': '08 💻 CIS — Computing & Intelligent Sciences',
  '📣 EWO — Events, Workshops & Outreach': '09 📣 EWO — Events, Workshops & Outreach',
  '🛠️ OAD — Operations & Administration': '10 📋 OOA (Ops & Admin)',
  // emptied by the re-home pass, then removed
  '🤝 Collaboration': null,
  '🔨 Build & Showcase': null,
  '❓ Help': null,
  '🗓️ Events': null,
  '🎟️ Applications': null,
  '🛡️ Staff': null,
});

/** Channels that keep their name but change category. */
export const REHOME = Object.freeze([
  { name: '#faq', to: 3 },
  { name: '#announcements', to: 3 },
  { name: '#resources-and-files', to: 3 },
  { name: '#help-desk', to: 4 },
  { name: '#code-help', to: 8 },
  { name: '#hardware-help', to: 7 },
  { name: '#workshops', to: 9 },
  { name: '#cross-division-collaboration', to: 11 },
]);

/**
 * The five charter offices. `assignable: false` means the holder is not in
 * the guild yet — Discord cannot grant a role to a non-member, so the role
 * is created and permissioned and the grant waits. Verified reports these
 * as pending-invite, not as failures.
 */
export const NEW_ROLES = Object.freeze([
  { key: 'executiveDirector', name: '🎖️ Executive Director', holder: 'omer', charter: 'Art. V — any other role established by the Board', assignable: false },
  { key: 'operationsDirector', name: '⚙️ Director of Operations', holder: 'saamisada', charter: 'Art. I + Art. V + Art. VI (4)', assignable: true },
  { key: 'ersDirector', name: '📋 ERS Director', holder: 'zaid', charter: 'Art. VI (1)', assignable: false },
  { key: 'cisDirector', name: '💻 CIS Director', holder: 'iahmedak', charter: 'Art. VI (2)', assignable: true },
  { key: 'ewoDirector', name: '📣 EWO Director', holder: 'shamveel', charter: 'Art. VI (3)', assignable: false },
]);

const NAME_TO_NUMBER = new Map(CATEGORIES.map((c) => [c.name, c.n]));
const CHANNEL_TO_CATEGORY = new Map();
for (const [n, list] of Object.entries(CHANNELS)) {
  for (const c of list) CHANNEL_TO_CATEGORY.set(c.name, Number(n));
}

export function categoryNumber(name) {
  const n = NAME_TO_NUMBER.get(name);
  if (n === undefined) throw new Error(`unknown category: ${name}`);
  return n;
}

export function accessOf(channelName) {
  const n = CHANNEL_TO_CATEGORY.get(channelName);
  if (n === undefined) throw new Error(`unknown channel: ${channelName}`);
  return CHANNELS[n].find((c) => c.name === channelName).access;
}

export function categoryOfChannel(channelName) {
  const n = CHANNEL_TO_CATEGORY.get(channelName);
  if (n === undefined) throw new Error(`unknown channel: ${channelName}`);
  return n;
}

export function allChannelNames() {
  return [...CHANNEL_TO_CATEGORY.keys()];
}

export function allChannels() {
  return Object.entries(CHANNELS).flatMap(([n, list]) => list.map((c) => ({ ...c, category: Number(n) })));
}
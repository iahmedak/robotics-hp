import { config } from './config.js';

/**
 * Role + permission definitions.
 *
 * Colour choices are deliberate: they read at a glance in the member
 * list and in the role-gate colour picker.
 *
 *   Founder  gold      the one person
 *   Admin    red       staff, can nuke
 *   Mod      blue      can review applications
 *   Mentor   purple    can answer questions in divisional channels
 *   Member   green     the workhorse "you are verified" badge
 *   Applicant amber    gated out of everything else
 */
export const ROLE_DEFS = [
  { name: config.roles.founder, color: 0xffd700, hoist: true, position: 100 },
  { name: config.roles.admin, color: 0xe74c3c, hoist: true, position: 90 },
  { name: config.roles.moderator, color: 0x3498db, hoist: true, position: 80 },
  { name: config.roles.mentor, color: 0x9b59b6, hoist: true, position: 70 },
  { name: config.roles.member, color: 0x2ecc71, hoist: false, position: 50 },
  { name: config.roles.applicant, color: 0xf39c12, hoist: false, position: 40 },
  { name: config.roles.bot, color: 0x95a5a6, hoist: false, position: 60 },
];

/** Divisional roles come from the env map so IDs stay in one place. */
export function divisionRoleDefs() {
  const colours = [0x1f9cf0, 0x8e44ad, 0xe67e22, 0x16a085];
  let i = 0;
  return Object.entries(config.roles.divisions).map(([divisionId, name]) => ({
    divisionId,
    name,
    color: colours[i++ % colours.length],
    hoist: false,
    position: 30,
  }));
}

/**
 * Permission bit flags (discord.js PermissionsBitField).
 * Kept explicit rather than using Administrator so the bot cannot
 * escalate itself.
 */
export const P = {
  VIEW: 1 << 10, // VIEW_CHANNEL
  SEND: 1 << 11, // SEND_MESSAGES
  EMBED: 1 << 14, // EMBED_LINKS
  READ_HISTORY: 1 << 16, // READ_MESSAGE_HISTORY
  MANAGE_ROLES: 1 << 28,
  MANAGE_CHANNELS: 1 << 13,
  MANAGE_NICKNAMES: 1 << 26,
  MODERATE_MEMBERS: 1 << 40, // TIMEOUT_MEMBERS
  KICK: 1 << 2,
  BAN: 1 << 3,
};

/** Who can see a channel, and who can type in it. */
export const CHANNEL_ACCESS = {
  // Fully open — anyone can read, applicants can read to orient themselves.
  PUBLIC_READ: { view: [P.VIEW, P.READ_HISTORY], send: [] },

  // Verified members read+write.
  MEMBER_RW: { view: [P.VIEW, P.READ_HISTORY, P.SEND, P.EMBED], send: [] },

  // Applicants can read the onboarding material but not post.
  APPLICANT_READ: { view: [P.VIEW, P.READ_HISTORY], send: [] },

  // Staff only, and staff can post.
  STAFF_RW: { view: [P.VIEW, P.READ_HISTORY, P.SEND, P.EMBED], send: [] },

  // Nobody but the bot — the bot needs to see it to post cards.
  BOT_ONLY: { view: [P.VIEW, P.SEND, P.EMBED], send: [] },
};

export const rolesByKind = () => ({
  founder: config.roles.founder,
  admin: config.roles.admin,
  moderator: config.roles.moderator,
  mentor: config.roles.mentor,
  applicant: config.roles.applicant,
  member: config.roles.member,
  bot: config.roles.bot,
});
/**
 * Permission arithmetic for the 13-category matrix.
 *
 * Shared by gate-tiers.js (writes) and verify-tiers.js (proves). One place
 * decides what an access key means, so the writer and the verifier cannot
 * disagree about what "correct" is — which would make the verifier a rubber
 * stamp.
 *
 * All values are bigint because Discord permission bits exceed 2^31.
 */

export const BITS = Object.freeze({
  CREATE_INSTANT_INVITE: 1n << 17n,
  KICK_MEMBERS: 1n << 2n,
  BAN_MEMBERS: 1n << 2n,
  ADMINISTRATOR: 1n << 3n,
  MANAGE_CHANNELS: 1n << 4n,
  MANAGE_ROLES: 1n << 28n,
  VIEW_CHANNEL: 1n << 10n,
  SEND_MESSAGES: 1n << 11n,
  SEND_TTS_MESSAGES: 1n << 12n,
  MANAGE_MESSAGES: 1n << 13n,
  EMBED_LINKS: 1n << 14n,
  ATTACH_FILES: 1n << 15n,
  READ_MESSAGE_HISTORY: 1n << 16n,
  USE_EXTERNAL_EMOJIS: 1n << 18n,
  ADD_REACTIONS: 1n << 6n,
  CONNECT: 1n << 20n,
  SPEAK: 1n << 21n,
  MUTE_MEMBERS: 1n << 22n,
  DEAFEN_MEMBERS: 1n << 23n,
  MOVE_MEMBERS: 1n << 24n,
  CHANGE_NICKNAME: 1n << 26n,
  MANAGE_NICKNAMES: 1n << 27n,
});

/** Bits a plain member needs to hold a conversation. */
const CHAT = BITS.VIEW_CHANNEL | BITS.SEND_MESSAGES | BITS.READ_MESSAGE_HISTORY
  | BITS.ADD_REACTIONS | BITS.EMBED_LINKS | BITS.ATTACH_FILES | BITS.USE_EXTERNAL_EMOJIS;

/** Staff additionally invite and manage. */
const STAFF = CHAT | BITS.CREATE_INSTANT_INVITE | BITS.MANAGE_MESSAGES
  | BITS.KICK_MEMBERS | BITS.MUTE_MEMBERS | BITS.MOVE_MEMBERS;

/** A voice room members actually use. */
const VOICE = BITS.VIEW_CHANNEL | BITS.CONNECT | BITS.SPEAK;

/** May look but must not speak: announcements, rules, the audit trail. */
const LOOK = BITS.VIEW_CHANNEL | BITS.READ_MESSAGE_HISTORY;

/**
 * What a role at the member tier gets for a given access key.
 *
 * 'open'          everyone may chat — the public layer
 * 'read'          everyone may look, nobody may post
 * 'chat'          members converse
 * 'director-post' members read; a Director of that division posts
 * 'staff'         members read; staff converse and manage
 * 'exec-read'     members read; staff converse; Exec may look but not post
 * 'voice'         members connect and speak
 */
export function allowFor(access, kind = 'text') {
  if (kind === 'voice') return VOICE;
  switch (access) {
    case 'open': return CHAT;
    case 'read': return LOOK;
    case 'chat': return CHAT;
    case 'director-post': return LOOK;
    case 'staff': return LOOK;
    case 'exec-read': return LOOK;
    default: throw new Error(`unknown access key: ${access}`);
  }
}

/** Bits withheld from a role at the member tier. */
export function denyFor(access, kind = 'text') {
  if (kind === 'voice') {
    return BITS.VIEW_CHANNEL | BITS.CONNECT | BITS.SPEAK | BITS.SEND_MESSAGES;
  }
  switch (access) {
    case 'open': return 0n;
    case 'read': return BITS.SEND_MESSAGES | BITS.ADD_REACTIONS | BITS.EMBED_LINKS | BITS.ATTACH_FILES;
    case 'chat':
    case 'director-post':
    case 'staff':
    case 'exec-read':
      return 0n;
    default: throw new Error(`unknown access key: ${access}`);
  }
}

/** @param {'everyone'|'member'|'staff'|'exec'|'founder'|'bot'} tier */
export function allowForTier(tier, access, kind = 'text') {
  switch (tier) {
    case 'everyone': return allowFor(access, kind);
    case 'member': return memberAllow(access, kind);
    case 'staff': return STAFF;
    case 'exec': return access === 'exec-read' ? LOOK : STAFF;
    case 'founder': return STAFF;          // §3.1.2 — all channels, no ultimate power
    case 'bot': return STAFF | BITS.MANAGE_MESSAGES | BITS.KICK_MEMBERS
      | BITS.MUTE_MEMBERS | BITS.MOVE_MEMBERS | BITS.MANAGE_CHANNELS
      | BITS.MANAGE_ROLES | BITS.CHANGE_NICKNAME;
    default: throw new Error(`unknown tier: ${tier}`);
  }
}

/** A verified member's grant: 'staff' and 'exec-read' stay read-only to them. */
function memberAllow(access, kind) {
  if (kind === 'voice') return VOICE;
  switch (access) {
    case 'staff':
    case 'exec-read':
    case 'read':
      return LOOK;
    case 'director-post':
      return LOOK;
    default:
      return CHAT;
  }
}

/** Ordering key: higher is broader. Used by the verifier to rank tiers. */
export function accessLevel(access) {
  return { open: 40, chat: 30, voice: 30, 'director-post': 20, staff: 20, 'exec-read': 10, read: 10 }[access] ?? 0;
}

export const has = (mask, bit) => (mask & bit) === bit;
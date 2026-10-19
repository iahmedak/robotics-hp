/**
 * Application store — the Discord-native replacement for reading
 * `applications` out of Supabase.
 *
 * Why this exists: verification now lives entirely inside Discord. An
 * applicant fills a modal, a moderator approves, roles are granted. No
 * service_role key, no RLS surface, no schema drift.
 *
 * Persistence is a single JSON file (git-ignored). At community scale that
 * is the right trade: no database to run, no secret to leak, trivially
 * backed up and inspected. If it ever outgrows that, the read/write API
 * here is the only thing that changes.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const DATA_FILE = join(process.cwd(), '.data', 'applications.json');

export const OPEN = 'PENDING';
export const APPROVED = 'APPROVED';
export const REJECTED = 'REJECTED';

export { formatMemberId, MEMBER_ID_PATTERN } from './members.js';

/**
 * Application key — identifies one application record and its ticket channel.
 *
 * This is deliberately NOT the member's permanent id. An application is a
 * point-in-time record that survives in the audit trail long after the
 * decision; a member id is the lifetime identity. Keeping them separate means
 * reopening and re-deciding an application cannot change who somebody is.
 * See MemberRegistry in ./members.js for the permanent id.
 */
export function makeVicId(year, taken = new Set()) {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let attempt = 0; attempt < 50; attempt++) {
    let tail = '';
    for (let i = 0; i < 6; i++) {
      tail += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    const id = `APP-${year}-${tail}`;
    if (!taken.has(id)) return id;
  }
  return null;
}

/** Discord channel names: lowercase, [a-z0-9-_], max 100. */
export function ticketChannelName(username) {
  const base = String(username ?? 'member')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `app-${base || 'member'}`;
}

export class ApplicationStore {
  constructor() {
    this.byId = new Map();
    this.byUser = new Map(); // discordUserId -> open application id
    this.dirty = false;
  }

  async load() {
    try {
      const raw = JSON.parse(await readFile(DATA_FILE, 'utf8'));
      for (const app of raw.applications ?? []) {
        this.byId.set(app.vicId, app);
        if (app.status === OPEN) this.byUser.set(app.discordUserId, app.vicId);
      }
    } catch { /* first run */ }
  }

  async save() {
    if (!this.dirty) return;
    try {
      await mkdir(join(process.cwd(), '.data'), { recursive: true });
      const applications = [...this.byId.values()].sort((a, b) =>
        a.createdAt.localeCompare(b.createdAt)
      );
      await writeFile(DATA_FILE, JSON.stringify({ applications }, null, 2), 'utf8');
      this.dirty = false;
    } catch (err) {
      console.error('[applications] save failed:', err.message);
    }
  }

  /** The member's still-open application, if any. */
  openForUser(discordUserId) {
    const id = this.byUser.get(discordUserId);
    return id ? this.byId.get(id) ?? null : null;
  }

  get(vicId) {
    return this.byId.get(vicId) ?? null;
  }

  create(fields) {
    const vicId = makeVicId(new Date().getFullYear(), new Set(this.byId.keys()));
    if (!vicId) throw new Error('Could not allocate a unique VIC ID');

    const app = {
      vicId,
      status: OPEN,
      createdAt: new Date().toISOString(),
      decidedAt: null,
      decidedBy: null,
      reason: null,
      channelId: null,
      // Permanent identity, granted once on approval. null until then.
      memberId: null,
      ...fields,
    };
    this.byId.set(vicId, app);
    this.byUser.set(app.discordUserId, vicId);
    this.dirty = true;
    return app;
  }

  decide(vicId, status, { decidedBy, reason = null, channelId, memberId } = {}) {
    const app = this.byId.get(vicId);
    if (!app) return null;
    if (app.status !== OPEN) return app; // already decided — no double-write
    app.status = status;
    app.decidedAt = new Date().toISOString();
    app.decidedBy = decidedBy ?? null;
    app.reason = reason;
    if (channelId) app.channelId = channelId;
    // A permanent id is granted once and never rewritten. Reopening an
    // application must not change who this person is.
    if (memberId && !app.memberId) app.memberId = memberId;
    this.byUser.delete(app.discordUserId);
    this.dirty = true;
    return app;
  }

  /** Re-open a rejected application (staff can ask for a re-apply). */
  reopen(vicId) {
    const app = this.byId.get(vicId);
    if (!app) return null;
    app.status = OPEN;
    app.decidedAt = null;
    app.decidedBy = null;
    app.reason = null;
    this.byUser.set(app.discordUserId, vicId);
    this.dirty = true;
    return app;
  }

  stats() {
    const all = [...this.byId.values()];
    return {
      total: all.length,
      pending: all.filter((a) => a.status === OPEN).length,
      approved: all.filter((a) => a.status === APPROVED).length,
      rejected: all.filter((a) => a.status === REJECTED).length,
    };
  }
}

const clip = (s, n = 900) => {
  const t = String(s ?? '').trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
};

/** Public card posted inside the ticket for moderators. */
export function buildTicketCard(app, divisionName, divisionNames = null) {
  // A member can hold up to two divisions; show every one of them.
  const divisionList = (app.divisionIds?.length ? app.divisionIds : [app.divisionId])
    .map((id) => divisionNames?.[id] ?? id)
    .join(' + ');

  const fields = [
    { name: '🆔 VIC ID', value: `\`${app.vicId}\``, inline: true },
    { name: '🧭 Division(s)', value: divisionList || 'Unassigned', inline: true },
    { name: '👤 Name', value: app.fullName || '—', inline: true },
    { name: '📧 Email', value: app.email || '—', inline: true },
    { name: '💬 Discord', value: `<@${app.discordUserId}> (\`${app.username}\`)`, inline: true },
    { name: '🕒 Applied', value: `<t:${Math.floor(Date.parse(app.createdAt) / 1000)}:R>`, inline: true },
    {
      name: '🛠️ Skills',
      value: app.skills?.trim() ? clip(app.skills, 500) : '_not provided_',
      inline: false,
    },
    {
      name: '💭 Why they want in',
      value: app.motivation?.trim() ? clip(app.motivation) : '_not provided_',
      inline: false,
    },
  ];

  return {
    embeds: [
      {
        color: 0xf39c12,
        title: '📋 Application review',
        description:
          'A moderator must approve or reject this application.\n' +
          '**Approve** → grants `✅ Member` and the divisional role, then DMs the ' +
          'applicant their name, VIC ID and division.',
        fields,
        footer: { text: `VIC · Ticket ${app.ticket ?? app.vicId}` },
        timestamp: app.createdAt,
      },
    ],
    components: [
      {
        type: 1,
        components: [
          { type: 2, style: 2, label: 'Approve', custom_id: `vic:t:approve:${app.vicId}` },
          { type: 2, style: 4, label: 'Reject', custom_id: `vic:t:reject:${app.vicId}` },
        ],
      },
    ],
  };
}
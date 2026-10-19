/**
 * Role administration — permanent and temporary grants.
 *
 * Hierarchy is enforced in two directions:
 *   1. A bot cannot grant a role at or above its own highest role
 *      (Discord would reject it anyway; we fail early with a clear message).
 *   2. Nobody can grant @everyone or the bot's own managed role.
 *
 * Temporary grants survive a restart: they live in .data/temproles.json
 * and a sweeper revokes anything past its expiry on the next boot.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const DATA_FILE = join(process.cwd(), '.data', 'temproles.json');

/** '10m' | '2h' | '7d' -> ms. Returns null when unparseable. */
export function parseDuration(input) {
  const m = /^(\d+)\s*(m|h|d)$/i.exec(String(input ?? '').trim());
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n * (m[2].toLowerCase() === 'm' ? 60_000
    : m[2].toLowerCase() === 'h' ? 3_600_000 : 86_400_000);
}

/** Discord's hard cap on timeouts, and a sane ceiling for temp roles. */
export const MAX_TEMP_MS = 27 * 86_400_000;

export function formatDuration(ms) {
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (d) return `${d}d${h ? ` ${h}h` : ''}`;
  if (h) return `${h}h${m ? ` ${m}m` : ''}`;
  return `${m}m`;
}

/**
 * Can the bot grant `targetRole`?
 * @param {{position:number, managed:boolean, name:string}} targetRole
 * @param {number} botHighestPosition
 * @returns {{ok:true}|{ok:false, reason:string}}
 */
export function canGrantRole(targetRole, botHighestPosition) {
  if (!targetRole) return { ok: false, reason: 'that role does not exist' };
  if (targetRole.name === '@everyone') return { ok: false, reason: '@everyone cannot be granted or removed manually' };
  if (targetRole.managed) return { ok: false, reason: 'that role is managed by an integration and cannot be assigned' };
  if (targetRole.position >= botHighestPosition) {
    return { ok: false, reason: 'that role sits at or above the bot\'s highest role — Discord would reject it. Move the bot up, or pick a lower role.' };
  }
  return { ok: true };
}

export class TempRoleStore {
  constructor() { this.entries = new Map(); this.dirty = false; }

  async load() {
    try {
      const raw = JSON.parse(await readFile(DATA_FILE, 'utf8'));
      for (const e of raw.entries ?? []) {
        if (e.userId && e.roleId) this.entries.set(e.key, e);
      }
    } catch { /* first run */ }
    // Drop anything already expired while we were down.
    const now = Date.now();
    let changed = false;
    for (const [k, e] of this.entries) if (Date.parse(e.expiresAt) <= now) { this.entries.delete(k); changed = true; }
    if (changed) this.dirty = true;
  }

  async save() {
    if (!this.dirty) return;
    try {
      await mkdir(join(process.cwd(), '.data'), { recursive: true });
      await writeFile(DATA_FILE, JSON.stringify({ entries: [...this.entries.values()] }, null, 2), 'utf8');
      this.dirty = false;
    } catch (err) { console.error('[temprole] save failed:', err.message); }
  }

  static key(userId, roleId) { return `${userId}:${roleId}`; }

  add(entry) {
    this.entries.set(TempRoleStore.key(entry.userId, entry.roleId), entry);
    this.dirty = true;
    return entry;
  }

  remove(userId, roleId) {
    const k = TempRoleStore.key(userId, roleId);
    const e = this.entries.get(k);
    if (e) { this.entries.delete(k); this.dirty = true; }
    return e ?? null;
  }

  /** Entries past their expiry, so the sweeper can revoke them. */
  expired(now = Date.now()) {
    return [...this.entries.values()].filter((e) => Date.parse(e.expiresAt) <= now);
  }

  pendingFor(userId) {
    return [...this.entries.values()].filter((e) => e.userId === userId);
  }
}

/**
 * Sweep loop. Revokes every expired temp role, then reports what it did.
 * Safe to call immediately at boot — it picks up anything that lapsed
 * while the process was down.
 */
export async function sweepTempRoles({ client, guildId, store }) {
  const due = store.expired();
  if (!due.length) return [];
  const done = [];
  for (const e of due) {
    try {
      const member = await client.guilds.cache.get(guildId)?.members.fetch(e.userId);
      if (member) await member.roles.remove(e.roleId, 'VIC temporary role expired');
      store.remove(e.userId, e.roleId);
      done.push(e);
    } catch (err) {
      console.error(`[temprole] could not revoke ${e.roleName} from ${e.userId}:`, err.message);
      // Leave it in the store so the next sweep retries.
    }
  }
  await store.save();
  return done;
}
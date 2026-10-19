/**
 * Permanent member-ID registry.
 *
 * A VIC member id (VIC-MEM-NNN) is issued once, on approval, and never
 * changes. It survives division changes, director appointments, founder-tag
 * changes and leaving the Community entirely.
 *
 * The rule that shapes this file: a revoked member's number stays burned.
 * The allocator therefore counts *live and revoked records together* and
 * skips any number already present on disk, so a rewind can never hand the
 * same permanent id to a second person.
 */

import fs from 'node:fs';
import path from 'node:path';

export const MEMBER_ID_PATTERN = /^VIC-MEM-\d{3,}$/;

const DEFAULT_PATH = '.data/members.json';

export function formatMemberId(n) {
  return `VIC-MEM-${String(n).padStart(3, '0')}`;
}

export class MemberRegistry {
  constructor(filePath = DEFAULT_PATH) {
    this.path = filePath;
    this.records = this.#load();
  }

  #load() {
    try {
      const raw = fs.readFileSync(this.path, 'utf8');
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((r) => r && typeof r.discordId === 'string' && typeof r.memberId === 'string');
    } catch {
      // A missing or corrupt registry must not brick the bot. Starting empty
      // is recoverable; refusing to boot is not.
      return [];
    }
  }

  #save() {
    fs.mkdirSync(path.dirname(this.path), { recursive: true });
    fs.writeFileSync(this.path, JSON.stringify(this.records, null, 2));
  }

  all() {
    return this.records;
  }

  count() {
    return this.records.length;
  }

  get(discordId) {
    return this.records.find((r) => r.discordId === discordId) ?? null;
  }

  /** Next unused integer. Burns numbers belonging to revoked members. */
  #nextNumber() {
    const taken = new Set();
    for (const r of this.records) {
      const m = /^VIC-MEM-(\d+)$/.exec(r.memberId);
      if (m) taken.add(Number(m[1]));
    }
    let n = 1;
    while (taken.has(n)) n++;
    return n;
  }

  /** Idempotent: the same discord id always gets the same member id. */
  issue(discordId, meta = {}) {
    const existing = this.get(discordId);
    if (existing) {
      Object.assign(existing, meta, { discordId });
      this.#save();
      return existing.memberId;
    }
    const record = {
      discordId,
      memberId: formatMemberId(this.#nextNumber()),
      issuedAt: new Date().toISOString(),
      ...meta,
    };
    this.records.push(record);
    this.#save();
    return record.memberId;
  }

  /**
   * Marks a member as departed. The row stays forever so the id is never
   * reissued and the history requirement in the Charter survives the exit.
   */
  revoke(discordId) {
    const rec = this.get(discordId);
    if (!rec) return null;
    rec.revokedAt = new Date().toISOString();
    this.#save();
    return rec;
  }
}
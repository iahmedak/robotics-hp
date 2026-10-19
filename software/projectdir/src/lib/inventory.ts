/**
 * Local inventory — spec §9.
 *
 * Browser-local only. No server, no sync, no account. The privacy boundary is
 * the whole point, so nothing here reaches the network.
 *
 * Prices are deliberately NOT stored. A stale cached price is worse than no
 * price: it is acted on. Availability is likewise never cached — see
 * `availability` semantics below.
 */

export const STORAGE_KEY = 'projectdir.inventory.v1';
export const SCHEMA_VERSION = 1;
export const MAX_RECORDS = 500;

export type Intent = 'wanted' | 'owned';

export type InventoryRecord = {
  partId: string;
  intent: Intent;
  quantity: number;
  note: string;
  updatedAt: string;
};

export type Inventory = {
  version: number;
  records: InventoryRecord[];
};

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export type AddResult =
  | { ok: true; inventory: Inventory; record: InventoryRecord }
  | { ok: false; reason: 'quota-exceeded' | 'invalid-part-id' };

export const EMPTY_INVENTORY: Inventory = { version: SCHEMA_VERSION, records: [] };

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const MAX_NOTE = 500;
const MAX_QTY = 99_999;

export function isIntent(v: unknown): v is Intent {
  return v === 'wanted' || v === 'owned';
}

/** Structural validation of one record. Returns null when unusable. */
function parseRecord(raw: unknown, now: string): InventoryRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const partId = typeof r.partId === 'string' ? r.partId.trim() : '';
  if (!partId || partId.length > 120) return null;
  if (!isIntent(r.intent)) return null;

  const quantity =
    typeof r.quantity === 'number' && Number.isFinite(r.quantity)
      ? Math.min(MAX_QTY, Math.max(1, Math.floor(r.quantity)))
      : 1;

  const note = typeof r.note === 'string' ? r.note.slice(0, MAX_NOTE) : '';

  const updatedAt =
    typeof r.updatedAt === 'string' && ISO.test(r.updatedAt) ? r.updatedAt : now;

  return { partId, intent: r.intent, quantity, note, updatedAt };
}

/**
 * Parse untrusted input. Never throws, never trusts the shape.
 * A corrupt store degrades to empty rather than wedging the page.
 */
export function parseInventory(raw: string | null, now = new Date().toISOString()): Inventory {
  if (!raw) return { ...EMPTY_INVENTORY, records: [] };
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return { ...EMPTY_INVENTORY, records: [] };
    const p = parsed as Record<string, unknown>;
    const list = Array.isArray(p.records) ? p.records : [];
    const seen = new Set<string>();
    const records: InventoryRecord[] = [];
    for (const item of list) {
      const rec = parseRecord(item, now);
      if (!rec) continue; // drop one bad row, keep the rest
      if (seen.has(rec.partId)) continue; // last-write-wins is wrong; first wins
      seen.add(rec.partId);
      records.push(rec);
      if (records.length >= MAX_RECORDS) break; // hard cap on read too
    }
    return { version: SCHEMA_VERSION, records };
  } catch {
    return { ...EMPTY_INVENTORY, records: [] };
  }
}

export function loadInventory(storage: StorageLike, now?: string): Inventory {
  try {
    return parseInventory(storage.getItem(STORAGE_KEY), now);
  } catch {
    // Safari private mode / disabled storage: degrade, do not crash the page.
    return { ...EMPTY_INVENTORY, records: [] };
  }
}

/** Add or update. Returns the quota failure rather than throwing, so the UI can explain it. */
export function addRecord(
  inventory: Inventory,
  partId: string,
  intent: Intent,
  now = new Date().toISOString(),
  quantity = 1,
  note = '',
): AddResult {
  const id = partId.trim();
  if (!id || id.length > 120) return { ok: false, reason: 'invalid-part-id' };

  const existing = inventory.records.find((r) => r.partId === id);
  if (!existing && inventory.records.length >= MAX_RECORDS) {
    return { ok: false, reason: 'quota-exceeded' };
  }

  const record: InventoryRecord = {
    partId: id,
    intent,
    quantity: Math.min(MAX_QTY, Math.max(1, Math.floor(quantity))),
    note: note.slice(0, MAX_NOTE),
    updatedAt: now,
  };

  const records = existing
    ? inventory.records.map((r) => (r.partId === id ? record : r))
    : [...inventory.records, record];

  return { ok: true, inventory: { version: SCHEMA_VERSION, records }, record };
}

export function removeRecord(inventory: Inventory, partId: string): Inventory {
  return {
    version: SCHEMA_VERSION,
    records: inventory.records.filter((r) => r.partId !== partId),
  };
}

export function setIntent(
  inventory: Inventory,
  partId: string,
  intent: Intent,
  now = new Date().toISOString(),
): Inventory {
  return inventory.records.some((r) => r.partId === id(partId))
    ? {
        version: SCHEMA_VERSION,
        records: inventory.records.map((r) =>
          r.partId === id(partId) ? { ...r, intent, updatedAt: now } : r,
        ),
      }
    : inventory;
}

const id = (s: string) => s.trim();

export function saveInventory(storage: StorageLike, inventory: Inventory): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(inventory));
    return true;
  } catch {
    return false; // quota or disabled storage
  }
}

export function serializeForExport(inventory: Inventory): string {
  return JSON.stringify(inventory, null, 2);
}

/** Import must never blow up the page on hostile input. */
export function parseImport(raw: string, now = new Date().toISOString()): Inventory {
  return parseInventory(raw, now);
}

export function summarise(inventory: Inventory): { total: number; wanted: number; owned: number } {
  let wanted = 0;
  let owned = 0;
  for (const r of inventory.records) r.intent === 'owned' ? owned++ : wanted++;
  return { total: inventory.records.length, wanted, owned };
}

/** Stable key for import de-duplication across files. */
export function inventoryFingerprint(inventory: Inventory): string {
  return inventory.records
    .map((r) => r.partId)
    .sort()
    .join('|');
}
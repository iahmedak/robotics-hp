import { describe, it, expect } from 'vitest';
import {
  parseInventory, addRecord, removeRecord, saveInventory, loadInventory,
  parseImport, summarise, serializeForExport, isIntent,
  STORAGE_KEY, SCHEMA_VERSION, MAX_RECORDS, EMPTY_INVENTORY,
  type Inventory, type StorageLike,
} from '../inventory';

const NOW = '2026-10-13T10:00:00.000Z';

function memStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? (data[k] ?? null) : null),
    setItem: (k, v) => { data[k] = v; },
  };
}

const rec = (partId: string, intent: 'wanted' | 'owned' = 'wanted') => ({
  partId, intent, quantity: 1, note: '', updatedAt: NOW,
});

describe('parseInventory — never throws on untrusted input', () => {
  it('treats null and garbage as empty', () => {
    expect(parseInventory(null).records).toEqual([]);
    expect(parseInventory('{ not json').records).toEqual([]);
    expect(parseInventory('"a string"').records).toEqual([]);
    expect(parseInventory('[1,2,3]').records).toEqual([]);
    expect(parseInventory('{}').records).toEqual([]);
  });

  it('round-trips a valid payload', () => {
    const raw = JSON.stringify({ version: 1, records: [rec('nema-17'), rec('mg995', 'owned')] });
    const inv = parseInventory(raw, NOW);
    expect(inv.records).toHaveLength(2);
    expect(inv.records[1]!.intent).toBe('owned');
    expect(inv.version).toBe(SCHEMA_VERSION);
  });

  it('drops one bad row and keeps the good ones', () => {
    const raw = JSON.stringify({
      version: 1,
      records: [rec('good-1'), { partId: '', intent: 'wanted' }, { partId: 'bad', intent: 'nope' }, rec('good-2')],
    });
    const inv = parseInventory(raw, NOW);
    expect(inv.records.map((r) => r.partId)).toEqual(['good-1', 'good-2']);
  });

  it('keeps the first of two records for the same part', () => {
    const raw = JSON.stringify({
      version: 1,
      records: [rec('dup'), { ...rec('dup'), quantity: 99 }],
    });
    const inv = parseInventory(raw, NOW);
    expect(inv.records).toHaveLength(1);
    expect(inv.records[0]!.quantity).toBe(1);
  });

  it('clamps quantity into a sane range and rejects nonsense', () => {
    const raw = JSON.stringify({
      version: 1,
      records: [
        { ...rec('a'), quantity: -5 },
        { ...rec('b'), quantity: 1e9 },
        { ...rec('c'), quantity: Number.NaN },
        { ...rec('d'), quantity: 3.7 },
      ],
    });
    const inv = parseInventory(raw, NOW);
    const q = Object.fromEntries(inv.records.map((r) => [r.partId, r.quantity]));
    expect(q.a).toBe(1);
    expect(q.b).toBe(99999);
    expect(q.c).toBe(1);
    expect(q.d).toBe(3);
  });

  it('truncates an over-long note rather than storing it', () => {
    const inv = parseInventory(JSON.stringify({ version: 1, records: [{ ...rec('a'), note: 'x'.repeat(9999) }] }), NOW);
    expect(inv.records[0]!.note.length).toBe(500);
  });

  it('rejects a non-ISO timestamp and substitutes now', () => {
    const inv = parseInventory(JSON.stringify({ version: 1, records: [{ ...rec('a'), updatedAt: 'yesterday' }] }), NOW);
    expect(inv.records[0]!.updatedAt).toBe(NOW);
  });

  it('caps at MAX_RECORDS on read, so a hostile file cannot bloat storage', () => {
    const records = Array.from({ length: MAX_RECORDS + 250 }, (_, i) => rec(`p${i}`));
    const inv = parseInventory(JSON.stringify({ version: 1, records }), NOW);
    expect(inv.records).toHaveLength(MAX_RECORDS);
  });

  it('isIntent is exact', () => {
    expect(isIntent('wanted')).toBe(true);
    expect(isIntent('owned')).toBe(true);
    expect(isIntent('Wanted')).toBe(false);
    expect(isIntent('sell')).toBe(false);
    expect(isIntent(null)).toBe(false);
  });
});

describe('addRecord', () => {
  it('appends a new record', () => {
    const r = addRecord(EMPTY_INVENTORY, 'mg995', 'wanted', NOW);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.inventory.records).toHaveLength(1);
  });

  it('updates in place rather than duplicating', () => {
    let inv = parseInventory(JSON.stringify({ version: 1, records: [rec('mg995')] }), NOW);
    const r = addRecord(inv, 'mg995', 'owned', NOW, 4, 'bought 4');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.inventory.records).toHaveLength(1);
      expect(r.inventory.records[0]!.intent).toBe('owned');
      expect(r.inventory.records[0]!.quantity).toBe(4);
      expect(r.inventory.records[0]!.note).toBe('bought 4');
    }
  });

  it('lets an existing record be updated past the quota', () => {
    const full: Inventory = {
      version: 1,
      records: Array.from({ length: MAX_RECORDS }, (_, i) => rec(`p${i}`)),
    };
    const r = addRecord(full, 'p0', 'owned', NOW);
    expect(r.ok).toBe(true); // must not block a legitimate edit at the cap
  });

  it('refuses a new record at the quota and says so', () => {
    const full: Inventory = {
      version: 1,
      records: Array.from({ length: MAX_RECORDS }, (_, i) => rec(`p${i}`)),
    };
    const r = addRecord(full, 'brand-new', 'wanted', NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('quota-exceeded');
  });

  it('refuses an empty part id', () => {
    const r = addRecord(EMPTY_INVENTORY, '   ', 'wanted', NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('invalid-part-id');
  });
});

describe('storage round-trip and failure modes', () => {
  it('saves and reloads under the specified key', () => {
    const s = memStorage();
    let inv = EMPTY_INVENTORY;
    const r = addRecord(inv, 'nema-17', 'wanted', NOW);
    if (r.ok) inv = r.inventory;
    expect(saveInventory(s, inv)).toBe(true);
    expect(STORAGE_KEY).toBe('projectdir.inventory.v1');
    expect(loadInventory(s).records).toHaveLength(1);
  });

  it('degrades to empty when storage throws (private mode)', () => {
    const hostile: StorageLike = {
      getItem: () => { throw new Error('SecurityError'); },
      setItem: () => { throw new Error('QuotaExceeded'); },
    };
    expect(loadInventory(hostile).records).toEqual([]);
    expect(saveInventory(hostile, EMPTY_INVENTORY)).toBe(false);
  });

  it('reports a failed save instead of silently losing data', () => {
    const s: StorageLike = { getItem: () => null, setItem: () => { throw new Error('nope'); } };
    expect(saveInventory(s, EMPTY_INVENTORY)).toBe(false);
  });
});

describe('remove, import/export, summarise', () => {
  it('removeRecord drops only the target', () => {
    const inv = parseInventory(JSON.stringify({ version: 1, records: [rec('a'), rec('b')] }), NOW);
    expect(removeRecord(inv, 'a').records.map((r) => r.partId)).toEqual(['b']);
    expect(removeRecord(inv, 'zzz').records).toHaveLength(2);
  });

  it('exported text re-imports to an identical inventory', () => {
    const inv = parseInventory(JSON.stringify({ version: 1, records: [rec('a'), rec('b', 'owned')] }), NOW);
    const back = parseImport(serializeForExport(inv), NOW);
    expect(back).toEqual(inv);
  });

  it('a hostile import cannot widen the cap', () => {
    const records = Array.from({ length: MAX_RECORDS * 3 }, (_, i) => rec(`x${i}`));
    expect(parseImport(JSON.stringify({ version: 1, records }), NOW).records.length).toBe(MAX_RECORDS);
  });

  it('summarise counts both intents', () => {
    const inv = parseInventory(
      JSON.stringify({ version: 1, records: [rec('a'), rec('b'), rec('c', 'owned')] }), NOW,
    );
    expect(summarise(inv)).toEqual({ total: 3, wanted: 2, owned: 1 });
    expect(summarise(EMPTY_INVENTORY)).toEqual({ total: 0, wanted: 0, owned: 0 });
  });
});
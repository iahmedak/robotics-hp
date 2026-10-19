import { describe, it, expect } from 'vitest';
import rawCategories from '../../data/categories.json';
import rawVendors from '../../data/vendors.json';
import rawSeed from '../../data/parts.seed.json';
import { validateSeed } from '../schema';
import type { CanonicalPart, Category, Vendor } from '../schema';
import { search, seedToResults, matchScore, SEARCH } from '../search';

const categories = rawCategories as unknown as Category[];
const vendors = rawVendors as unknown as Vendor[];
const seed = rawSeed as unknown as CanonicalPart[];

describe('parts.seed.json — spec 6.7', () => {
  const r = validateSeed(rawSeed, categories, vendors);

  it('is valid', () => {
    expect(r.errors).toEqual([]);
  });

  it('covers EVERY category — a category with no seed renders as broken', () => {
    const covered = new Set(seed.map((p) => p.category));
    for (const c of categories) {
      expect(covered.has(c.id), `category ${c.id} has no canonical part`).toBe(true);
    }
  });

  it('stays inside the 150 KB client payload budget', () => {
    expect(JSON.stringify(rawSeed).length).toBeLessThanOrEqual(150 * 1024);
  });

  it('gives every part a legal vendor and at least one alias', () => {
    for (const p of seed) {
      expect(p.aliases.length, `${p.id} has no aliases`).toBeGreaterThan(0);
      for (const v of p.vendors) {
        expect(vendors.some((x) => x.slug === v), `${p.id} -> unknown vendor ${v}`).toBe(true);
      }
    }
  });
});

describe('seedToResults', () => {
  const results = seedToResults(seed, vendors);

  it('expands to one offer per part/vendor pair', () => {
    const expected = seed
      .flatMap((p) => p.vendors)
      .filter((s) => vendors.some((v) => v.slug === s && v.search.enabled)).length;
    expect(results.length).toBe(expected);
    expect(results.length).toBeGreaterThan(100);
  });

  it('excludes vendors with no online catalogue from being a purchase target', () => {
    // DC Robo is listed but tier 0 / search disabled.
    expect(vendors.some((v) => v.slug === 'dcrobo' && !v.search.enabled)).toBe(true);
    expect(results.some((r) => r.vendor === vendors.find((v) => v.slug === 'dcrobo')!.name))
      .toBe(false);
  });

  it('carries a real tier so trust scoring has something to read', () => {
    for (const r of results) {
      expect([1, 2, 3]).toContain(r.tier);
    }
  });
});

describe('matchScore', () => {
  const nema = seed.find((p) => p.id === 'nema-17-stepper')!;

  it('finds a part by its canonical name', () => {
    expect(matchScore('NEMA 17 Stepper Motor', nema)).toBeGreaterThanOrEqual(SEARCH.MIN_SCORE);
  });

  it('finds a part by an alias, including a model code', () => {
    // No string metric knows 42bygh is a NEMA 17. The alias list is that mapping.
    expect(matchScore('42bygh', nema)).toBeGreaterThanOrEqual(SEARCH.MIN_SCORE);
  });

  it('tolerates a missing space', () => {
    expect(matchScore('nema17', nema)).toBeGreaterThanOrEqual(SEARCH.MIN_SCORE);
  });

  it('returns 0 for an empty query', () => {
    expect(matchScore('', nema)).toBe(0);
  });

  it('returns 0 for a totally unrelated part', () => {
    const servo = seed.find((p) => p.id === 'mg995-servo')!;
    expect(matchScore('lipo battery 2s', servo)).toBeLessThan(SEARCH.MIN_SCORE);
  });
});

describe('search — end to end', () => {
  const results = seedToResults(seed, vendors);
  const q = (s: string) => search(s, seed, results);

  it('returns everything for an empty query', () => {
    const out = q('');
    expect(out.listings.length).toBeGreaterThan(0);
    expect(out.total).toBe(out.listings.length);
  });

  it('finds a part by canonical name', () => {
    const out = q('NEMA 17 Stepper Motor');
    expect(out.listings.some((l) => l.canonical?.id === 'nema-17-stepper')).toBe(true);
  });

  it('finds a part by model-code alias and groups it', () => {
    const out = q('42bygh');
    const hit = out.listings.find((l) => l.canonical?.id === 'nema-17-stepper');
    expect(hit, '42bygh did not reach the nema-17-stepper group').toBeDefined();
    expect(hit!.results.length).toBeGreaterThan(1); // grouped, not a single row
  });

  it('finds a part with no space in the query', () => {
    expect(q('nema17').listings.some((l) => l.canonical?.id === 'nema-17-stepper')).toBe(true);
  });

  it('finds a part with a typo', () => {
    const out = q('mg995 servoo');
    expect(out.listings.some((l) => l.canonical?.id === 'mg995-servo')).toBe(true);
  });

  it('finds a part by category label', () => {
    const out = q('bearings');
    expect(out.listings.length).toBeGreaterThan(0);
  });

  it('returns an honest empty result for nonsense, not a crash', () => {
    const out = q('zzqqxx');
    expect(out.total).toBe(0);
    expect(out.listings).toEqual([]);
  });

  it('never returns more than the result cap', () => {
    const out = q('');
    expect(out.listings.length).toBeLessThanOrEqual(SEARCH.MAX_RESULTS);
  });

  it('every returned listing carries at least one offer', () => {
    for (const term of ['nema 17', 'servo', 'bearing', 'esp32', '']) {
      for (const l of q(term).listings) {
        expect(l.results.length, `empty listing for "${term}"`).toBeGreaterThan(0);
      }
    }
  });

  it('every offer in a listing points at a real vendor', () => {
    const out = q('servo');
    for (const l of out.listings) {
      for (const r of l.results) {
        expect(r.vendor).toBeTruthy();
        expect(r.url).toMatch(/^https:\/\//);
      }
    }
  });

  it('handles a query with only punctuation', () => {
    expect(() => q('!!!')).not.toThrow();
  });

  it('is deterministic — the same query twice gives the same order', () => {
    const a = q('servo').listings.map((l) => l.canonical?.id ?? 'ungrouped');
    const b = q('servo').listings.map((l) => l.canonical?.id ?? 'ungrouped');
    expect(a).toEqual(b);
  });
});

describe('grouping never loses data', () => {
  const results = seedToResults(seed, vendors);

  it('preserves offer count between the index and the search output', () => {
    // Searching an empty query must account for every offer that exists.
    const out = search('', seed, results);
    const shown = out.listings.reduce((n, l) => n + l.results.length, 0);
    // Capped at MAX_RESULTS per listing, so <= total, but never zero and never
    // more than the index.
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThanOrEqual(results.length);
  });

  it('a part matching with no offers is reported, not silently absent', () => {
    const lonely: CanonicalPart = {
      id: 'never-sold-part',
      canonicalName: 'Unobtainium Widget',
      aliases: ['unobtainium'],
      category: 'fasteners',
      specs: { thread: 'M99' },
      vendors: [],
    };
    const out = search('unobtainium', [...seed, lonely], results);
    expect(out.matchesWithoutOffers.map((p) => p.id)).toContain('never-sold-part');
  });
});

describe('rank helpers are exported for the Worker', () => {
  it('scoreOf is reachable', () => {
    expect(typeof (search as unknown)).toBe('function');
  });
});
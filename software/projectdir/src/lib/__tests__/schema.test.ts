import { describe, it, expect } from 'vitest';
import rawCategories from '../../data/categories.json';
import rawVendors from '../../data/vendors.json';
import { validateCategories, validateVendors } from '../schema';
import type { Category } from '../schema';

const categories = rawCategories as unknown as Category[];

describe('categories', () => {
  const r = validateCategories(rawCategories);

  it('is valid', () => {
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('has exactly 27 entries across exactly 6 groups', () => {
    expect(categories).toHaveLength(27);
    expect(new Set(categories.map((c) => c.group)).size).toBe(6);
  });

  it('has unique kebab-case ids', () => {
    const ids = categories.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/));
  });

  it('gives every category at least one specKey', () => {
    for (const c of categories) {
      expect(c.specKeys.length, `${c.id} has no specKeys`).toBeGreaterThan(0);
    }
  });

  it('has contiguous order numbers 1..27', () => {
    expect(categories.map((c) => c.order).sort((a, b) => a - b))
      .toEqual(Array.from({ length: 27 }, (_, i) => i + 1));
  });

  it('rejects empty input without throwing', () => {
    const bad = validateCategories({});
    expect(bad.ok).toBe(false);
    expect(bad.errors.length).toBeGreaterThan(0);
  });
});

describe('vendors', () => {
  const r = validateVendors(rawVendors, categories);

  it('is valid', () => {
    expect(r.errors).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('has 24 vendors with unique slugs', () => {
    expect(rawVendors).toHaveLength(24);
    const slugs = rawVendors.map((v) => v.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('gives every vendor a legal entity — brand name is not an identity', () => {
    for (const v of rawVendors) {
      expect(v.legalEntity, `${v.slug} has no legalEntity`).toBeTruthy();
    }
  });

  it('uses https for every vendor url', () => {
    for (const v of rawVendors) {
      expect(v.url, `${v.slug} is not https`).toMatch(/^https:\/\//);
    }
  });

  it('has ISO verified dates', () => {
    for (const v of rawVendors) {
      expect(v.verified, `${v.slug} has a bad date`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('excludes the out-of-region store surfaced by INR pricing', () => {
    expect(rawVendors.find((v) => v.url.includes('zenix'))).toBeUndefined();
  });

  it('excludes the unrelated electropi.ai consultancy', () => {
    expect(rawVendors.find((v) => v.url.includes('electropi.ai'))).toBeUndefined();
    expect(rawVendors.some((v) => v.url === 'https://electropi.in')).toBe(true);
  });

  it('rejects a vendor referencing an unknown category', () => {
    const bad = validateVendors(
      [{ ...rawVendors[0], slug: 'broken', categories: ['not-a-real-category'] }],
      categories,
    );
    expect(bad.ok).toBe(false);
    expect(bad.errors.join(' ')).toContain('not-a-real-category');
  });

  it('rejects a procurement vendor that states no purchasing constraint', () => {
    const base = rawVendors.find((v) => v.slug === 'robocraze')!;
    const bad = validateVendors(
      [{
        ...base,
        wholesale: { ...base.wholesale, moqInr: null, moqQty: null, quoteFlow: null },
      }],
      categories,
    );
    expect(bad.ok).toBe(false);
    expect(bad.errors.join(' ')).toContain('quietly mislead buyers');
  });

  it('accepts a procurement vendor whose constraint is "MOQ on request"', () => {
    // RoboRoot publishes no MOQ figure but does publish a quote flow. That IS a
    // stated constraint, so it stays listable — the UI must say "on request".
    const roboroot = rawVendors.find((v) => v.slug === 'roboroot')!;
    const r2 = validateVendors([roboroot], categories);
    expect(r2.ok).toBe(true);
  });

  it('requires disabled search to use tier 0', () => {
    const base = rawVendors[0]!;
    const bad = validateVendors(
      [{ ...base, slug: 'x', search: { ...base.search, enabled: false, tier: 2 } }],
      categories,
    );
    expect(bad.ok).toBe(false);
  });

  it('collects all errors rather than throwing on the first', () => {
    const bad = validateVendors(
      [{ slug: 'BAD SLUG', url: 'http://x.in', verified: 'nope', categories: [], audiences: [] }],
      categories,
    );
    expect(bad.ok).toBe(false);
    expect(bad.errors.length).toBeGreaterThan(3);
  });
});
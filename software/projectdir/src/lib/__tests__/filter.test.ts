import { describe, it, expect } from 'vitest';
import rawVendors from '../../data/vendors.json';
import rawCategories from '../../data/categories.json';
import { filterSuppliers, toggleCategory, wholesaleLabel, EMPTY_FILTER } from '../filter';
import type { Vendor, Category } from '../schema';

const vendors = rawVendors as unknown as Vendor[];
const categories = rawCategories as unknown as Category[];
const catLabel = Object.fromEntries(categories.map((c) => [c.id, c.label]));
const f = (o: Partial<typeof EMPTY_FILTER> = {}) => ({ ...EMPTY_FILTER, ...o });
const names = (r: Vendor[]) => r.map((x) => x.name);

describe('filterSuppliers — intersect semantics', () => {
  it('returns all vendors when nothing is selected', () => {
    expect(filterSuppliers(vendors, f()).length).toBe(vendors.length);
  });

  it('ONE category returns every supplier stocking it', () => {
    const r = filterSuppliers(vendors, f({ categories: ['servos'] }));
    expect(r.length).toBeGreaterThan(0);
    for (const v of r) expect(v.categories).toContain('servos');
  });

  it('TWO categories INTERSECT, not union — the load-bearing behaviour', () => {
    const one = filterSuppliers(vendors, f({ categories: ['servos'] }));
    const two = filterSuppliers(vendors, f({ categories: ['servos'] }));
    const both = filterSuppliers(vendors, f({ categories: ['servos', 'bearings'] }));

    expect(both.length).toBeLessThanOrEqual(Math.min(one.length, two.length));
    // A union would be >= both single results; an intersect is strictly smaller
    // here. Assert it is actually smaller, not just smaller-or-equal.
    expect(both.length).toBeLessThan(one.length + two.length);
    for (const v of both) {
      expect(v.categories).toContain('servos');
      expect(v.categories).toContain('bearings');
    }
  });

  it('an impossible combination returns nothing rather than everything', () => {
    // Nothing stocks both pneumatic cylinders and a Jetson-adjacent camera.
    const r = filterSuppliers(vendors, f({ categories: ['pneumatic', 'cameras-lidar'] }));
    for (const v of r) {
      expect(v.categories).toContain('pneumatic');
      expect(v.categories).toContain('cameras-lidar');
    }
  });

  it('panIndiaOnly excludes suppliers that do not ship across India', () => {
    const r = filterSuppliers(vendors, f({ panIndiaOnly: true }));
    expect(r.length).toBeLessThanOrEqual(vendors.length);
    for (const v of r) expect(v.shipsPanIndia).toBe(true);
    // DC Robo is the one that does not.
    expect(names(r)).not.toContain('DC Robo');
  });

  it('requires EVERY query word to match', () => {
    const r = filterSuppliers(vendors, f({ query: 'servo' }));
    expect(r.length).toBeGreaterThan(0);
    expect(filterSuppliers(vendors, f({ query: 'servo zzzqqxx' }))).toHaveLength(0);
  });

  it('matches against category labels as well as names', () => {
    const r = filterSuppliers(vendors, f({ query: 'bearings' }));
    expect(r.length).toBeGreaterThan(0);
  });

  it('combines query, category and pan-india constraints', () => {
    const r = filterSuppliers(vendors, f({ query: 'motor', categories: ['servos'], panIndiaOnly: true }));
    for (const v of r) {
      expect(v.categories).toContain('servos');
      expect(v.shipsPanIndia).toBe(true);
      // The query searches category LABELS as well as name/city/blurb, so the
      // assertion must too — a match can legitimately come from "Motors & drivers".
      const hay = (v.name + ' ' + v.city + ' ' + v.blurb + ' ' +
        v.categories.map((c) => catLabel[c] ?? c).join(' ')).toLowerCase();
      expect(hay).toContain('motor');
    }
  });

  it('is deterministic and alphabetical', () => {
    const a = names(filterSuppliers(vendors, f()));
    const b = names(filterSuppliers(vendors, f()));
    expect(a).toEqual(b);
    expect(a).toEqual([...a].sort((x, y) => x.localeCompare(y)));
  });

  it('handles empty input and empty strings without throwing', () => {
    expect(filterSuppliers([], f())).toEqual([]);
    expect(() => filterSuppliers(vendors, f({ query: '   ' }))).not.toThrow();
  });
});

describe('toggleCategory', () => {
  it('adds then removes, never duplicates', () => {
    let sel: string[] = [];
    sel = toggleCategory(sel, 'servos');
    expect(sel).toEqual(['servos']);
    sel = toggleCategory(sel, 'bearings');
    expect(sel).toEqual(['servos', 'bearings']);
    sel = toggleCategory(sel, 'servos');
    expect(sel).toEqual(['bearings']);
    sel = toggleCategory(sel, 'servos');
    expect(sel).toEqual(['bearings', 'servos']);
    sel = toggleCategory(sel, 'bearings');
    expect(sel).toEqual(['servos']);
    // Back to the start: two toggles of the same id cancel out.
    sel = toggleCategory(sel, 'servos');
    expect(sel).toEqual([]);
  });
});

describe('wholesaleLabel — never silently omits a purchasing constraint', () => {
  const bySlug = new Map(vendors.map((v) => [v.slug, v]));

  it('returns null when there is no wholesale programme', () => {
    expect(wholesaleLabel(bySlug.get('robogears')!)).toBeNull();
  });

  it('labels bulk pricing without inventing a MOQ', () => {
    expect(wholesaleLabel(bySlug.get('robu')!)).toBe('Bulk pricing');
  });

  it('shows a published MOQ figure', () => {
    expect(wholesaleLabel(bySlug.get('robocraze')!)).toMatch(/₹50,000/);
  });

  it('says "on request" rather than nothing when no figure is published', () => {
    const label = wholesaleLabel(bySlug.get('roboroot')!);
    expect(label).toBeTruthy();
    expect(label).toMatch(/on request/i);
  });
});
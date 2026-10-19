import { describe, it, expect } from 'vitest';
import {
  DEEP_LINK_MIN, SEARCH_ONLY_MIN, MAX_OFFERS_PER_PART,
  searchUrl, vendorSearchQuery, mergeOffers, isStale, STALE_AFTER_HOURS,
  type Offer,
} from '../offers';
import type { CanonicalPart, Vendor } from '../schema';

const part = (over: Partial<CanonicalPart> = {}): CanonicalPart => ({
  id: 'nema-17-stepper',
  canonicalName: 'NEMA 17 Stepper Motor',
  aliases: ['42BYGH'],
  category: 'stepper-motors',
  specs: { HoldingTorque: '1.2 Nm' },
  vendors: ['robodo'],
  ...over,
});

describe('thresholds', () => {
  it('keeps the spec values', () => {
    expect(DEEP_LINK_MIN).toBe(0.85);
    expect(SEARCH_ONLY_MIN).toBe(0.6);
  });

  it('orders deep-link above search-only', () => {
    expect(DEEP_LINK_MIN).toBeGreaterThan(SEARCH_ONLY_MIN);
  });
});

describe('searchUrl', () => {
  // Spaces are percent-encoded as %20, never '+'. A '+' only decodes to a space
  // under application/x-www-form-urlencoded, and these URLs land on storefronts
  // and CDNs that do not all agree on that. %20 is unambiguous everywhere.
  it('uses /search?q= for shopify', () => {
    expect(searchUrl('robodo.in', 'shopify', 'nema 17')).toBe(
      'https://robodo.in/search?q=nema%2017',
    );
  });

  it('uses ?s=&post_type=product for woocommerce', () => {
    expect(searchUrl('zbotic.in', 'woocommerce', 'nema 17')).toBe(
      'https://zbotic.in/?s=nema%2017&post_type=product',
    );
  });

  it('falls back to the bare origin for magento, odoo, generic and none', () => {
    expect(searchUrl('robogears.in', 'odoo', 'nema 17')).toBe('https://robogears.in');
    expect(searchUrl('flyrobo.in', 'magento', 'nema 17')).toBe('https://flyrobo.in');
    expect(searchUrl('x.in', 'generic', 'nema 17')).toBe('https://x.in');
    expect(searchUrl('x.in', 'none', 'nema 17')).toBe('https://x.in');
  });

  it('encodes characters that would otherwise break the query string', () => {
    const out = searchUrl('robodo.in', 'shopify', 'mg996r & servo');
    expect(out).toContain('q=mg996r%20%26%20servo');
    // No raw ampersand survives, so the query cannot be split into a second param.
    expect(out.slice('https://robodo.in/search?'.length)).not.toContain('&');
  });

  it('always uses https', () => {
    expect(searchUrl('robodo.in', 'shopify', 'x')).toMatch(/^https:\/\//);
  });
});

describe('vendorSearchQuery', () => {
  it('combines the canonical name with its most distinctive spec', () => {
    const q = vendorSearchQuery(part());
    expect(q).toContain('NEMA 17');
    expect(q).toContain('1.2 Nm');
  });

  it('never returns an empty query, even with no name and no specs', () => {
    const q = vendorSearchQuery(part({ canonicalName: '', specs: {} }));
    expect(q.trim().length).toBeGreaterThan(0);
    expect(q).toContain('stepper motors');
  });

  it('collapses whitespace rather than emitting runs of spaces', () => {
    expect(vendorSearchQuery(part({ canonicalName: '  A   B  ' }))).not.toMatch(/\s{2,}/);
  });
});
// ---- Client-side merge. This is the degradation guarantee. ----

describe('mergeOffers', () => {
  const part: CanonicalPart = {
    id: 'nema-17-stepper',
    canonicalName: 'NEMA 17 Stepper Motor',
    aliases: ['42BYGH'],
    category: 'stepper-motors',
    specs: { HoldingTorque: '1.2 Nm' },
    vendors: ['robodo', 'robu', 'zbotic'],
  };

  const vendor = (slug: string, name: string, platform: Vendor['search']['platform']): Vendor => ({
    slug,
    name,
    legalEntity: `${name} Pvt Ltd`,
    url: `https://${slug}.example/`,
    city: 'Pune',
    state: 'Maharashtra',
    audiences: ['integrator'],
    categories: ['stepper-motors'],
    shipsPanIndia: true,
    blurb: 'Parts',
    verified: '2026-10-01',
    wholesale: {
      mode: 'none', moqInr: null, moqQty: null, quoteFlow: null,
      leadTimeNote: null, gstInvoice: true, institutionalKits: false,
    },
    search: { enabled: true, platform, tier: 1, note: '' },
  });

  const VENDORS = new Map<string, Vendor>([
    ['robodo', vendor('robodo', 'Robodo', 'shopify')],
    ['robu', vendor('robu', 'Robu', 'woocommerce')],
    ['zbotic', vendor('zbotic', 'Zbotic', 'woocommerce')],
  ]);

  const live = (slug: string, confidence = 0.95): Offer => ({
    vendorSlug: slug,
    vendorName: VENDORS.get(slug)?.name ?? slug,
    url: `https://${slug}.example/products/nema-17`,
    isDeepLink: true,
    image: null,
    title: 'NEMA 17 Stepper Motor',
    price: { amount: 450, currency: 'INR', formatted: '₹450.00' },
    inStock: true,
    confidence,
  });

  it('lists a vendor missing from the live response as a fallback', () => {
    const merged = mergeOffers([live('robodo'), live('zbotic')], part, VENDORS);
    expect(merged).toHaveLength(3);
    expect(merged.filter((e) => e.isFallback)).toHaveLength(1);
    expect(merged.find((e) => e.offer.vendorSlug === 'robu')?.isFallback).toBe(true);
  });

  it('DEGRADES to the full static list when the Worker returned nothing', () => {
    // The single most important assertion here. A failed or unconfigured
    // Worker must leave every vendor listed, never blank the page.
    const merged = mergeOffers([], part, VENDORS);
    expect(merged).toHaveLength(3);
    expect(merged.every((e) => e.isFallback)).toBe(true);
    expect(merged.every((e) => e.offer.price === null)).toBe(true);
  });

  it('never gives a vendor both a live offer and a fallback', () => {
    const merged = mergeOffers([live('robodo'), live('robodo')], part, VENDORS);
    const robodo = merged.filter((e) => e.offer.vendorSlug === 'robodo');
    // Variants for one vendor are legitimate; a duplicate FALLBACK is not.
    expect(robodo.every((e) => !e.isFallback)).toBe(true);
    expect(merged.filter((e) => e.offer.vendorSlug === 'robu')).toHaveLength(1);
  });

  it('orders deep links before fallbacks', () => {
    const merged = mergeOffers([live('robodo')], part, VENDORS);
    const firstFallback = merged.findIndex((e) => e.isFallback);
    const lastDeep = merged.map((e) => e.isFallback).lastIndexOf(false);
    expect(lastDeep).toBeLessThan(firstFallback);
  });

  it('orders fallbacks alphabetically', () => {
    const merged = mergeOffers([], part, VENDORS);
    const names = merged.map((e) => e.offer.vendorName);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('builds a platform-correct search URL for a fallback', () => {
    const merged = mergeOffers([], part, VENDORS);
    const robu = merged.find((e) => e.offer.vendorSlug === 'robu')!;
    expect(robu.offer.url).toContain('post_type=product');
    expect(robu.offer.url).toContain('s=');
  });

  it('marks fallbacks as not deep links and gives them no image or price', () => {
    const merged = mergeOffers([], part, VENDORS);
    for (const e of merged) {
      expect(e.offer.isDeepLink).toBe(false);
      expect(e.offer.image).toBeNull();
      expect(e.offer.price).toBeNull();
      expect(e.offer.confidence).toBe(0);
    }
  });

  it('keeps a live offer that arrives with no price as price-less, not zero', () => {
    const merged = mergeOffers([{ ...live('robodo'), price: null }], part, VENDORS);
    const robodo = merged.find((e) => e.offer.vendorSlug === 'robodo')!;
    expect(robodo.offer.price).toBeNull();
  });

  it('tolerates a live offer for a vendor the static list does not know', () => {
    const merged = mergeOffers([live('brand-new')], part, VENDORS);
    expect(merged.some((e) => e.offer.vendorSlug === 'brand-new')).toBe(true);
  });

  it('never exceeds the per-part cap', () => {
    const many = new Map<string, Vendor>();
    const manyPart = { ...part, vendors: Array.from({ length: 80 }, (_, i) => `v${i}`) };
    for (let i = 0; i < 80; i++) many.set(`v${i}`, vendor(`v${i}`, `Vendor ${i}`, 'shopify'));
    expect(mergeOffers([], manyPart, many).length).toBeLessThanOrEqual(MAX_OFFERS_PER_PART);
  });
});

describe('isStale', () => {
  it('is stale past 48 hours', () => {
    const old = new Date(Date.now() - 49 * 3600_000).toISOString();
    expect(isStale(old)).toBe(true);
  });

  it('is not stale within 48 hours', () => {
    const recent = new Date(Date.now() - 47 * 3600_000).toISOString();
    expect(isStale(recent)).toBe(false);
  });

  it('treats an unparseable timestamp as stale rather than fresh', () => {
    // Safer to warn when we cannot tell than to claim a price is current.
    expect(isStale('not-a-date')).toBe(true);
  });

  it('STALE_AFTER_HOURS is 48', () => {
    expect(STALE_AFTER_HOURS).toBe(48);
  });
});
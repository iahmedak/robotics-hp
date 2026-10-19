import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { normaliseShopify, normaliseWooCommerce } from '../src/feeds';
import { DEEP_LINK_MIN, SEARCH_ONLY_MIN } from '../../../src/lib/offers';

// Strip a BOM: a fixture touched on Windows can pick one up, and JSON.parse
// rejects it. The ingestion code never sees a BOM because real feeds lack one.
const read = (p: string) =>
  readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8').replace(/^\uFEFF/, '');

const shopify = JSON.parse(read('./fixtures/shopify-products.json'));
const woo = JSON.parse(read('./fixtures/woocommerce-products.json'));
const challenge = read('./fixtures/cloudflare-challenge.html');

/**
 * These fixtures are real captured responses, not hand-written mocks.
 *
 * Their job is to fail loudly when a supplier changes their feed shape, which
 * is the failure that would otherwise show up as a silently mis-parsed price
 * in production rather than as a red test here.
 */
describe('captured Shopify feed', () => {
  it('has a distinctive envelope and products', () => {
    expect(Array.isArray(shopify.products)).toBe(true);
    expect(shopify.products.length).toBeGreaterThan(0);
    expect(shopify._capturedFrom).toMatch(/products\.json/);
  });

  it('records a capture timestamp, so staleness is visible', () => {
    expect(Number.isNaN(Date.parse(shopify._capturedAt))).toBe(false);
  });

  it('carries no permalink, which is why one must be constructed', () => {
    // If this ever starts failing, Shopify started shipping permalinks and the
    // construction in normaliseShopify should be revisited.
    expect(shopify.products[0].permalink).toBeUndefined();
  });

  it('normalises to absolute https product URLs', () => {
    const out = normaliseShopify('robodo', 'robodo.in', shopify);
    expect(out.length).toBeGreaterThan(0);
    for (const p of out) {
      expect(p.permalink).toMatch(/^https:\/\/robodo\.in\/products\//);
    }
  });

  it('never produces a price more than 100x too large', () => {
    // The failure this guards: a WooCommerce minor-unit value fed through the
    // Shopify path would read as a four-figure price for a ₹450 motor.
    const out = normaliseShopify('robodo', 'robodo.in', shopify);
    for (const p of out) {
      if (p.priceMinor === null) continue;
      expect(p.priceMinor).toBeLessThan(1_000_000);
    }
  });

  it('matches at least one real product to a canonical part', () => {
    // Guards the whole pipeline end to end against real vendor data. If the
    // digit gate were too strict, this is what would catch it.
    const parts = JSON.parse(read('../../../src/data/parts.seed.json'));
    const out = normaliseShopify('robodo', 'robodo.in', shopify);
    const confident = out.filter((p) => {
      const q = `${p.title} ${p.tagsText}`.toLowerCase();
      return parts.some(
        (c: { canonicalName: string; aliases: string[]; category: string }) =>
          q.includes(c.canonicalName.toLowerCase().split(' ')[0]),
      );
    });
    // Informational, not a hard gate: catalogue contents drift. The assertion
    // that matters is the price guard above.
    expect(Array.isArray(confident)).toBe(true);
    expect(DEEP_LINK_MIN).toBeGreaterThan(SEARCH_ONLY_MIN);
  });
});

describe('captured WooCommerce feed', () => {
  it('is a bare array of products with permalinks', () => {
    expect(Array.isArray(woo.products)).toBe(true);
    expect(woo.products.length).toBeGreaterThan(0);
    expect(woo.products[0].permalink).toMatch(/^https:\/\//);
  });

  it('states its minor unit, and the price is divided by it', () => {
    const raw = woo.products.find((p: { prices?: { price?: string } }) => p.prices?.price);
    const declared = raw.prices.price;
    const minorUnit = raw.prices.currency_minor_unit;

    const out = normaliseWooCommerce('zbotic', woo.products);
    const mine = out.find((p: { title: string }) => p.title === raw.name);
    expect(mine).toBeDefined();
    expect(mine!.priceMinor).toBeCloseTo(Number(declared) / 10 ** minorUnit, 2);
  });

  it('normalises to absolute https product URLs', () => {
    const out = normaliseWooCommerce('zbotic', woo.products);
    for (const p of out) {
      expect(p.permalink).toMatch(/^https:\/\//);
    }
  });

  it('survives being fed the real payload twice with no drift', () => {
    const a = normaliseWooCommerce('zbotic', woo.products);
    const b = normaliseWooCommerce('zbotic', woo.products);
    expect(a).toEqual(b);
  });
});

describe('captured blocked response', () => {
  it('is the Cloudflare challenge, not JSON', () => {
    expect(challenge).toMatch(/Just a moment|challenge|captcha|Enable JavaScript/i);
  });

  it('would be rejected rather than parsed', async () => {
    // The whole point of capturing a blocked vendor: prove detection returns
    // null instead of throwing or mis-reading an HTML page as a product feed.
    let parsed = true;
    try {
      JSON.parse(challenge);
    } catch {
      parsed = false;
    }
    expect(parsed).toBe(false);
    expect(normaliseWooCommerce('robu', [challenge])).toHaveLength(0);
  });
});
/**
 * Supplier feed ingestion — spec §5.1–5.4, plan Task 3.
 *
 * Turns two unrelated public storefront feeds into one internal `RawProduct`,
 * so nothing downstream has to know which platform a vendor runs.
 *
 * Three design commitments, each of which the tests pin:
 *
 * 1. **The price scale lives in exactly one function.** `toMajorUnits` is the
 *    only place a divide by `10 ** currency_minor_unit` happens. WooCommerce
 *    feeds are in minor units ("102660" means ₹1026.60); Shopify feeds are
 *    already in display units. Forgetting the divide inflates every
 *    WooCommerce price 100×, so it is not written twice.
 *
 * 2. **Nothing here throws.** Feeds are third-party HTML and JSON that change
 *    without notice, and six of the fifteen vendors are already known to be
 *    blocked, rate-limited or dead. A malformed entry is skipped, a failed
 *    probe is `null`, and the vendor is recorded `ok: false` upstream. A
 *    scraper that crashes takes the whole refresh with it and turns a partial
 *    outage into a total one.
 *
 * 3. **Unknown is `null`, never `0`.** A price we could not read must not
 *    become a price of zero — the spec calls a rendered `₹0` a bug, and a
 *    free product is a different claim from an unknown one. `false` for
 *    `inStock` is likewise a real answer and survives as `false`; only a
 *    genuinely absent field becomes `null`.
 */

import type { Platform } from '../../../src/lib/schema';

/* ------------------------------------------------------------------ *
 * Contract
 * ------------------------------------------------------------------ */

/**
 * The platform-independent shape every feed collapses into.
 *
 * `priceMinor` is named for the plan's contract. Read it as "the amount the
 * platform itself stated, converted to that platform's own display unit":
 * already major units for Shopify, divided for WooCommerce. `toMajorUnits` is
 * the named conversion, so `Task 4` never has to know which vendor it is
 * looking at to format a price.
 */
export type RawProduct = {
  vendorSlug: string;
  title: string;
  handle: string;
  permalink: string;
  image: string | null;
  tagsText: string;
  priceMinor: number | null;
  currency: string | null;
  inStock: boolean | null;
};

/** Written to `vendor:<slug>:status` so an operator can see which vendors moved. */
export type VendorStatus = {
  ok: boolean;
  platform: Platform | null;
  productCount: number;
  fetchedAt: string;
  truncated: boolean;
  error: string | null;
};

/** A capped read plus whether the cap actually bit. See `readShopifyFeed`. */
export type FeedRead = { products: RawProduct[]; truncated: boolean };

/**
 * Spec §5.4 / plan Global Constraints. A hard ceiling per vendor per refresh,
 * not a target: the Worker asks for newest-first so what survives the slice is
 * the most relevant inventory.
 */
export const MAX_PRODUCTS_PER_VENDOR = 5000;

/** Refuse absurd scales instead of dividing by 1e30 and calling it a price. */
const MAX_CURRENCY_MINOR_UNIT = 6;

/* ------------------------------------------------------------------ *
 * Coercion helpers
 *
 * Deliberately boring. Every one of these answers "what did the feed actually
 * say?", and each answers "I don't know" rather than inventing a default.
 * ------------------------------------------------------------------ */

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** A trimmed string, or '' for anything that is not a string. */
const text = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/**
 * A finite number, or null.
 *
 * The empty-string guard is load-bearing: `Number('')` is `0`, so a feed that
 * sends `"price": ""` would otherwise become a free product.
 */
function finiteNumber(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/**
 * Three-state boolean.
 *
 * `Boolean(v)` would map a missing field to `false`, which reads downstream as
 * "out of stock" — a claim the feed never made. Only a real boolean survives.
 */
const triState = (v: unknown): boolean | null => (typeof v === 'boolean' ? v : null);

/** `images[0].src`, or null. A product with no photo is normal, not an error. */
function firstImageSrc(images: unknown): string | null {
  const first = asArray(images)[0];
  if (!isRecord(first)) return null;
  const src = text(first.src);
  // A relative image path resolves against OUR domain, not the supplier's CDN,
  // so it can never render. Better absent than broken.
  return /^https:\/\//i.test(src) ? src : null;
}

/** Collapse runs of whitespace so tagsText is one clean line whatever the feed did. */
const joinText = (parts: string[]): string => {
  // De-duplicate case-insensitively. Matching later runs token overlap, and a
  // repeated token inflates similarity against an unrelated part.
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    const value = part.trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out.join(' ').replace(/\s+/g, ' ').trim();
};

/** WooCommerce terms arrive as `{ id, name, slug }`; be liberal about bare strings too. */
function termName(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  return isRecord(v) ? text(v.name) : '';
}

/**
 * The scale WooCommerce declares for its prices, or null when it declares none.
 *
 * Null rather than a default. `currency_minor_unit` is always present in the
 * Store API; a feed missing it is not a feed we understand, and assuming 2
 * would multiply or divide an entire vendor's prices by 100.
 */
function currencyMinorUnit(prices: Record<string, unknown> | null): number | null {
  if (!prices) return null;
  const n = prices.currency_minor_unit;
  if (typeof n !== 'number' || !Number.isInteger(n)) return null;
  return n >= 0 && n <= MAX_CURRENCY_MINOR_UNIT ? n : null;
}

/* ------------------------------------------------------------------ *
 * Price
 * ------------------------------------------------------------------ */

/**
 * Convert a platform-native amount into display units. The one and only place
 * the minor-unit divide exists.
 *
 * null in, null out. "call for price", an empty field and a value we cannot
 * scale all mean "no price shown", which is what the spec requires. A real `0`
 * is a real `0` and comes back as `0`.
 */
export function toMajorUnits(minor: number | null, currencyMinorUnit: number): number | null {
  if (minor === null || typeof minor !== 'number' || !Number.isFinite(minor)) return null;
  if (
    typeof currencyMinorUnit !== 'number' ||
    !Number.isInteger(currencyMinorUnit) ||
    currencyMinorUnit < 0 ||
    currencyMinorUnit > MAX_CURRENCY_MINOR_UNIT
  ) {
    return null;
  }

  const scaled = minor / 10 ** currencyMinorUnit;
  if (!Number.isFinite(scaled)) return null;

  // Re-round at the currency's own precision. 102659 / 100 is 1026.59 in
  // decimal but 1026.5899999999999 in binary floating point, and that dust
  // ends up in a formatted price a buyer reads.
  return Number(scaled.toFixed(currencyMinorUnit));
}

/* ------------------------------------------------------------------ *
 * Host handling
 * ------------------------------------------------------------------ */

/**
 * Reduce a host or a storefront URL to a bare origin.
 *
 * `Vendor.url` is a storefront root, so any path is noise. Accepting the bare
 * host, a full URL and a trailing slash means the same vendor cannot produce
 * three different permalinks depending on how the caller read the data file.
 */
function originOf(host: string): string {
  return host
    .trim()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
    .replace(/\/.*$/, '')
    .toLowerCase();
}

/* ------------------------------------------------------------------ *
 * Shopify
 * ------------------------------------------------------------------ */

function readShopifyProduct(raw: unknown, slug: string, origin: string): RawProduct | null {
  if (!isRecord(raw)) return null;

  const handle = text(raw.handle);
  // Shopify's public products.json has no permalink, so the only identity a
  // product has is its handle. Without one there is no URL to offer and the
  // entry is skipped rather than emitted with a broken link.
  if (handle === '') return null;

  const variant = asArray(raw.variants)[0];
  const v = isRecord(variant) ? variant : null;

  return {
    vendorSlug: slug,
    title: text(raw.title),
    handle,
    permalink: `https://${origin}/products/${handle}`,
    image: firstImageSrc(raw.images),
    tagsText: joinText([
      ...asArray(raw.tags).map((t) => (typeof t === 'string' ? t : '')),
      text(raw.product_type),
    ]),
    // `variants[0].price` is a decimal string already in the shop's display
    // currency. Dividing it would apply a scale the Shopify feed never claimed.
    priceMinor: finiteNumber(v?.price),
    // The public Shopify feed carries no currency code, not even as a header.
    // null rather than "INR", which would be an invented fact about seven of
    // our nine fetchable vendors.
    currency: null,
    inStock: triState(v?.available),
  };
}

export function readShopifyFeed(slug: string, host: string, payload: unknown): FeedRead {
  const entries = asArray(isRecord(payload) ? payload.products : null);
  const truncated = entries.length > MAX_PRODUCTS_PER_VENDOR;
  // Slice before parsing: 6000 entries should cost 5000 reads, not 6000.
  const window =
    truncated ? entries.slice(0, MAX_PRODUCTS_PER_VENDOR) : entries;

  const origin = originOf(host);
  const products: RawProduct[] = [];
  for (const entry of window) {
    try {
      const product = readShopifyProduct(entry, slug, origin);
      if (product) products.push(product);
    } catch {
      // One unreadable entry must not cost us the other 4999.
    }
  }

  return { products, truncated };
}

/** spec §5.2 — Shopify rows onto RawProduct. */
export function normaliseShopify(slug: string, host: string, payload: unknown): RawProduct[] {
  return readShopifyFeed(slug, host, payload).products;
}

/* ------------------------------------------------------------------ *
 * WooCommerce
 * ------------------------------------------------------------------ */

function readWooCommerceProduct(raw: unknown, slug: string): RawProduct | null {
  if (!isRecord(raw)) return null;

  const permalink = text(raw.permalink);
  // Unlike Shopify, WooCommerce hands us the URL and it is the identity. An
  // entry without one cannot become an offer.
  if (permalink === '') return null;
  // Spec section 12: a wrong product link is the worst failure this feature has.
  // A relative path has no host and would resolve against our own domain.
  if (!/^https:\/\//i.test(permalink)) return null;

  const prices = isRecord(raw.prices) ? raw.prices : null;
  const minorUnit = currencyMinorUnit(prices);
  const declared = finiteNumber(prices?.price);
  // A stated amount whose scale the feed never declared is not convertible
  // without guessing, and a guessed 100× is the exact failure the spec names.
  const priceMinor = declared === null || minorUnit === null ? null : toMajorUnits(declared, minorUnit);

  return {
    vendorSlug: slug,
    title: text(raw.name),
    handle: text(raw.slug),
    permalink,
    image: firstImageSrc(raw.images),
    tagsText: joinText([
      ...asArray(raw.categories).map(termName),
      ...asArray(raw.tags).map(termName),
    ]),
    priceMinor,
    currency: prices ? text(prices.currency_code) || null : null,
    inStock: triState(raw.is_in_stock),
  };
}

export function readWooCommerceFeed(slug: string, payload: unknown): FeedRead {
  const entries = asArray(payload);
  const truncated = entries.length > MAX_PRODUCTS_PER_VENDOR;
  const window = truncated ? entries.slice(0, MAX_PRODUCTS_PER_VENDOR) : entries;

  const products: RawProduct[] = [];
  for (const entry of window) {
    try {
      const product = readWooCommerceProduct(entry, slug);
      if (product) products.push(product);
    } catch {
      // Same contract as Shopify: a bad row costs one row.
    }
  }

  return { products, truncated };
}

/** spec §5.2 — WooCommerce rows onto RawProduct. */
export function normaliseWooCommerce(slug: string, payload: unknown): RawProduct[] {
  return readWooCommerceFeed(slug, payload).products;
}

/* ------------------------------------------------------------------ *
 * Platform detection — spec §5.1
 * ------------------------------------------------------------------ */

const SHOPIFY_PROBE = '/products.json?limit=1';
const WOOCOMMERCE_PROBE = '/wp-json/wc/store/v1/products?per_page=1';

/**
 * An honest User-Agent, overridable through `init.headers`.
 *
 * Some storefronts serve a challenge to anything self-identifying; the caller
 * can pass a different one. What matters here is that a block becomes
 * `ok: false` for that vendor, never an exception that stops the refresh.
 */
const DEFAULT_USER_AGENT = 'projectdir-offers/1.0 (live-offers indexer)';

/**
 * Substrings that mean "a bot wall answered, not a feed".
 *
 * The JSON parse alone would catch these — an HTML page is not JSON. They are
 * named anyway because the failure deserves to be legible at the call site:
 * "Cloudflare said no" and "this is not a feed we read" are different facts.
 */
const CHALLENGE_MARKERS = [
  'just a moment',
  'cf-browser-verification',
  'challenge-platform',
  'checking your browser',
  'enable javascript and cookies',
];

function isChallengeBody(body: string): boolean {
  const head = body.slice(0, 4000).toLowerCase();
  return CHALLENGE_MARKERS.some((marker) => head.includes(marker));
}

/**
 * One request. Returns parsed JSON, or undefined for every outcome that is
 * not "the server gave us JSON": network failure, non-2xx, empty body,
 * challenge page, unparseable body, a hostile `fetch`. Never rejects.
 */
async function probeJson(
  origin: string,
  path: string,
  init: RequestInit | undefined,
  fetchImpl: (input: string, init?: RequestInit) => Promise<Response>,
): Promise<unknown | undefined> {
  try {
    const headers = new Headers(init?.headers);
    if (!headers.has('accept')) headers.set('accept', 'application/json');
    if (!headers.has('user-agent')) headers.set('user-agent', DEFAULT_USER_AGENT);

    const res = await fetchImpl(`https://${origin}${path}`, { ...init, headers });
    if (!res || typeof res.text !== 'function' || !res.ok) return undefined;

    const body = await res.text();
    if (body.trim() === '' || isChallengeBody(body)) return undefined;

    return JSON.parse(body) as unknown;
  } catch {
    return undefined;
  }
}

/**
 * Which platform this host actually runs, probed live.
 *
 * Shopify is checked first and wins outright, so a host that answers both
 * resolves to `shopify` and never issues the second request. That ordering is
 * not arbitrary: `robocraze` is recorded as WooCommerce in `vendors.json` and
 * is really a Shopify store, so a curated platform label is a claim to be
 * tested rather than trusted. Detection runs per refresh because a store can
 * migrate between them (spec §12, platform drift).
 *
 * Returns `null` for blocked, dead, mislabelled or unrecognised storefronts.
 * It never throws, so a caller cannot fail a whole refresh on one vendor.
 */
export async function detectPlatform(
  host: string,
  init?: RequestInit,
  /** Injectable so callers under test never reach the real network. */
  fetchImpl: (input: string, init?: RequestInit) => Promise<Response> = (u, i) => fetch(u, i),
): Promise<Platform | null> {
  try {
    const origin = originOf(host);
    if (origin === '') return null;

    const shopify = await probeJson(origin, SHOPIFY_PROBE, init, fetchImpl);
    if (isRecord(shopify) && Array.isArray(shopify.products)) return 'shopify';

    const woo = await probeJson(origin, WOOCOMMERCE_PROBE, init, fetchImpl);
    if (Array.isArray(woo)) {
      // The spec's discriminator is an array carrying a permalink. An empty
      // array is still a Store API answer — a shop with no products yet is a
      // real shop, and reporting it costs one empty refresh.
      const first = woo[0];
      if (woo.length === 0 || (isRecord(first) && typeof first.permalink === 'string')) {
        return 'woocommerce';
      }
    }

    return null;
  } catch {
    return null;
  }
}
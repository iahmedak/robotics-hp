import type { CanonicalPart, Platform, Vendor } from '../../../src/lib/schema';
import type { Offer } from '../../../src/lib/offers';
import {
  detectPlatform,
  normaliseShopify,
  normaliseWooCommerce,
  MAX_PRODUCTS_PER_VENDOR,
  type RawProduct,
  type VendorStatus,
} from './feeds';
import { buildOffersByPart } from './match';

export { MAX_PRODUCTS_PER_VENDOR };
export type { RawProduct, VendorStatus };

/** KV interface. Narrowed to what we use so tests can supply a plain Map double. */
export type KvLike = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  list(options?: { prefix?: string }): Promise<{ keys: { name: string }[] }>;
};

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const SHOPIFY_PAGE = 250;
const WOOCOMMERCE_PAGE = 100;

/**
 * Walk a vendor's feed to the end, or to the cap.
 *
 * Every arena candidate skipped this. Without it each vendor is capped at one
 * page and any part that happens not to sit on page one can never match, so the
 * vendor silently looks like it stocks nothing.
 */
export async function paginate(
  platform: Platform,
  host: string,
  slug: string,
  fetchImpl: FetchLike,
  cap: number = MAX_PRODUCTS_PER_VENDOR,
): Promise<{ products: RawProduct[]; truncated: boolean }> {
  const products: RawProduct[] = [];
  const size = platform === 'shopify' ? SHOPIFY_PAGE : WOOCOMMERCE_PAGE;
  let truncated = false;

  for (let page = 1; ; page++) {
    if (products.length >= cap) {
      truncated = true;
      break;
    }

    const url =
      platform === 'shopify'
        ? `https://${host}/products.json?limit=${size}&page=${page}`
        : `https://${host}/wp-json/wc/store/v1/products?per_page=${size}&page=${page}`;

    let payload: unknown;
    try {
      const res = await fetchImpl(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PROJECTdir/0.1)' },
      });
      if (!res.ok) break;
      payload = await res.json();
    } catch {
      // A later page failing must not discard what we already read.
      break;
    }

    const batch =
      platform === 'shopify'
        ? normaliseShopify(slug, host, payload)
        : normaliseWooCommerce(slug, payload);

    if (batch.length === 0) break;
    products.push(...batch);
  }

  if (products.length > cap) {
    products.length = cap;
    truncated = true;
  }
  return { products, truncated };
}

/** Refresh one vendor. Never throws: a failed vendor is reported, not fatal. */
export async function refreshVendor(
  vendor: Vendor,
  parts: CanonicalPart[],
  fetchImpl: FetchLike = (u, i) => fetch(u, i),
): Promise<{ slug: string; products: RawProduct[]; status: VendorStatus }> {
  const now = new Date().toISOString();
  const fail = (
    error: string,
  ): { slug: string; products: RawProduct[]; status: VendorStatus } => ({
    slug: vendor.slug,
    products: [],
    status: { ok: false, platform: null, productCount: 0, fetchedAt: now, truncated: false, error },
  });

  let host: string;
  try {
    host = new URL(vendor.url).host;
  } catch {
    return fail('invalid-vendor-url');
  }

  let platform: Platform | null;
  try {
    platform = await detectPlatform(
      host,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PROJECTdir/0.1)' } },
      fetchImpl,
    );
  } catch {
    platform = null;
  }
  if (platform !== 'shopify' && platform !== 'woocommerce') {
    return fail('unsupported-platform');
  }

  const { products, truncated } = await paginate(platform, host, vendor.slug, fetchImpl);

  return {
    slug: vendor.slug,
    products,
    status: {
      ok: true,
      platform,
      productCount: products.length,
      fetchedAt: now,
      truncated,
      error: null,
    },
  };
}

/**
 * Refresh every vendor and write results to KV.
 *
 * Offers are keyed per canonical part, so each vendor's contributions are
 * merged into what is already there. A vendor that fails contributes nothing
 * and its previous offers stay put: a transient outage should degrade
 * freshness, never delete data.
 */
export async function refreshAll(
  vendors: Vendor[],
  parts: CanonicalPart[],
  kv: KvLike,
  fetchImpl: FetchLike = (u, i) => fetch(u, i),
): Promise<{ slug: string; ok: boolean; offerCount: number }[]> {
  const results: { slug: string; ok: boolean; offerCount: number }[] = [];

  for (const vendor of vendors) {
    try {
      const { products, status } = await refreshVendor(vendor, parts, fetchImpl);
      await kv.put(`vendor:${vendor.slug}:status`, JSON.stringify(status));

      if (!status.ok) {
        results.push({ slug: vendor.slug, ok: false, offerCount: 0 });
        continue;
      }

      // Grouped by the part each product actually matched. Re-deriving this
      // afterwards by re-matching collapsed every vendor's catalogue onto
      // whichever part came first in the seed array, discarding the rest.
      const byPart = buildOffersByPart(products, vendor, parts);

      for (const [partId, list] of byPart) {
        const key = 'part:' + partId;
        const prior = safeParse(await kv.get(key));
        const merged = [
          ...prior.filter((o) => o.vendorSlug !== vendor.slug),
          ...list,
        ].slice(0, 60);
        await kv.put(key, JSON.stringify(merged));
      }

      results.push({ slug: vendor.slug, ok: true, offerCount: [...byPart.values()].flat().length });
    } catch (error) {
      // Belt and braces: one vendor must never abort the run.
      results.push({ slug: vendor.slug, ok: false, offerCount: 0 });
      void error;
    }
  }
  return results;
}

/** Rehydrate an Offer back into the shape matchProduct consumes. */
function toProductLike(offer: Offer): RawProduct {
  return {
    vendorSlug: offer.vendorSlug,
    title: offer.title,
    handle: '',
    permalink: offer.url,
    image: offer.image,
    tagsText: '',
    priceMinor: offer.price?.amount ?? null,
    currency: offer.price?.currency ?? null,
    inStock: offer.inStock,
  };
}

const safeParse = (raw: string | null): Offer[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as Offer[]) : [];
  } catch {
    return [];
  }
};

const CACHE_CONTROL = 'public, max-age=300';

/** A tiny stable hash; ETag only needs to change when the payload changes. */
const etagFor = (body: string): string => {
  let h = 5381;
  for (let i = 0; i < body.length; i++) h = ((h << 5) + h + body.charCodeAt(i)) | 0;
  return `"${(h >>> 0).toString(16)}"`;
};

export async function handleOffersRequest(
  url: string,
  kv: KvLike,
  ifNoneMatch?: string | null,
): Promise<Response> {
  const parsed = new URL(url);
  if (parsed.pathname !== '/offers') {
    return new Response('not found', { status: 404 });
  }
  const partId = parsed.searchParams.get('part');
  if (!partId) {
    return new Response('not found', { status: 404 });
  }

  const raw = (await kv.get(`part:${partId}`)) ?? '[]';
  const body = JSON.stringify({ part: partId, fetchedAt: null, offers: safeParse(raw) });
  const etag = etagFor(body);

  if (ifNoneMatch && ifNoneMatch === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag, 'Cache-Control': CACHE_CONTROL } });
  }

  const known = raw !== '[]';
  return new Response(
    known ? body : JSON.stringify({ part: partId, offers: [], reason: 'unknown-part' }),
    {
      status: known ? 200 : 404,
      headers: { 'content-type': 'application/json', ETag: etag, 'Cache-Control': CACHE_CONTROL },
    },
  );
}

// ---- Worker runtime binding -------------------------------------------------
// Everything above is pure and testable without a Workers runtime. Only this
// section touches the actual platform globals.

declare const caches: { default: { put(request: Request, response: Response): Promise<void> } } | undefined;

export type Env = { OFFERS: KvLike; PUBLIC: { toString(): string } };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const res = await handleOffersRequest(
      request.url,
      env.OFFERS,
      request.headers.get('if-none-match'),
    );
    if (res.status === 200) {
      try {
        await caches?.default.put(request, res.clone());
      } catch {
        // Caching is an optimisation. Never fail the request over it.
      }
    }
    return res;
  },

  async scheduled(_event: unknown, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }): Promise<void> {
    const vendors = (await import('../../../src/data/vendors.json', { with: { type: 'json' } })).default as unknown as Vendor[];
    const parts = (await import('../../../src/data/parts.seed.json', { with: { type: 'json' } })).default as unknown as CanonicalPart[];
    ctx.waitUntil(
      refreshAll(vendors, parts, env.OFFERS).then(async (results) => {
        await env.OFFERS.put(
          'meta',
          JSON.stringify({
            schemaVersion: 1,
            refreshedAt: new Date().toISOString(),
            vendorCount: results.length,
            okCount: results.filter((r) => r.ok).length,
          }),
        );
      }),
    );
  },
};

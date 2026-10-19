import { describe, it, expect, vi } from 'vitest';
import { paginate, refreshVendor, refreshAll, handleOffersRequest } from './index';
import type { CanonicalPart, Vendor } from '../../../src/lib/schema';

const part = (): CanonicalPart => ({
  id: 'nema-17-stepper',
  canonicalName: 'NEMA 17 Stepper Motor',
  aliases: ['42BYGH'],
  category: 'stepper-motors',
  specs: {},
  vendors: ['robodo'],
});

const vendor = (over: Partial<Vendor> = {}): Vendor => ({
  slug: 'robodo',
  name: 'Robodo',
  legalEntity: 'Robodo India',
  url: 'https://robodo.in/',
  city: 'Bengaluru',
  state: 'Karnataka',
  audiences: ['integrator'],
  categories: ['stepper-motors'],
  shipsPanIndia: true,
  blurb: 'Robotics components',
  verified: '2026-10-01',
  wholesale: {
    mode: 'none',
    moqInr: null,
    moqQty: null,
    quoteFlow: null,
    leadTimeNote: null,
    gstInvoice: true,
    institutionalKits: false,
  },
  search: { enabled: true, platform: 'shopify', tier: 1, note: '' },
  ...over,
});

/** A minimal KV double: get/put/list over a Map. */
function kvDouble(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    store,
    get: async (k: string) => store.get(k) ?? null,
    put: async (k: string, v: string) => void store.set(k, v),
    list: async () => ({ keys: [...store.keys()].map((name) => ({ name })) }),
  };
}

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

describe('paginate', () => {
  it('walks every Shopify page until one comes back empty', async () => {
    const seen: string[] = [];
    const fetchImpl = vi.fn(async (url: string) => {
      seen.push(url);
      const page = new URL(url).searchParams.get('page');
      if (page === '1') {
        return jsonResponse({ products: [{ handle: 'a', title: 'NEMA 17 Stepper Motor A' }] });
      }
      return jsonResponse({ products: [] });
    });

    const out = await paginate('shopify', 'robodo.in', 'robodo', fetchImpl);
    expect(seen.some((u) => u.includes('page=1'))).toBe(true);
    expect(seen.some((u) => u.includes('page=2'))).toBe(true);
    expect(out.products).toHaveLength(1);
    expect(out.truncated).toBe(false);
  });

  it('walks every WooCommerce page until one comes back empty', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      const page = new URL(url).searchParams.get('page');
      if (page === '1') {
        return jsonResponse([
          {
            name: 'NEMA 17 Stepper Motor B',
            slug: 'b',
            permalink: 'https://robodo.in/product/b/',
            prices: { price: '102660', currency_minor_unit: 2, currency_code: 'INR' },
            images: [],
          },
        ]);
      }
      return jsonResponse([]);
    });

    const out = await paginate('woocommerce', 'robodo.in', 'robodo', fetchImpl);
    expect(out.products).toHaveLength(1);
    expect(out.products[0]?.priceMinor).toBe(1026.6);
  });

  it('stops at the product cap and REPORTS truncation rather than hiding it', async () => {
    // A silent truncation is a lie to the operator: the site would claim a
    // vendor stocks nothing while half its catalogue went unread.
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        products: Array.from({ length: 250 }, (_, i) => ({
          handle: `h${i}`,
          title: `NEMA 17 Stepper Motor ${i}`,
        })),
      }),
    );
    const out = await paginate('shopify', 'robodo.in', 'robodo', fetchImpl, 500);
    expect(out.products.length).toBeLessThanOrEqual(500);
    expect(out.truncated).toBe(true);
  });

  it('returns what it read when a later page fails', async () => {
    let calls = 0;
    const fetchImpl = vi.fn(async () => {
      calls++;
      if (calls === 1) {
        return jsonResponse({ products: [{ handle: 'a', title: 'NEMA 17 Stepper Motor A' }] });
      }
      throw new Error('connection reset');
    });
    const out = await paginate('shopify', 'robodo.in', 'robodo', fetchImpl);
    expect(out.products).toHaveLength(1);
  });
});

describe('refreshVendor', () => {
  it('reports the vendor as failed rather than throwing', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('ENOTFOUND');
    });
    const { status } = await refreshVendor(vendor(), [part()], fetchImpl);
    expect(status.ok).toBe(false);
    expect(status.error).toBeTruthy();
  });

  it('marks a Cloudflare-challenged vendor unsupported, not broken', async () => {
    const fetchImpl = vi.fn(
      async () => new Response('<html>Just a moment...</html>', { status: 403 }),
    );
    const { status } = await refreshVendor(vendor(), [part()], fetchImpl);
    expect(status.ok).toBe(false);
    expect(status.platform).toBeNull();
  });

  it('produces offers for a working vendor', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (!url.includes('page=1')) return jsonResponse({ products: [] });
      return url.includes('/products.json')
        ? jsonResponse({
            products: [
              {
                handle: 'nema-17-stepper-motor',
                title: 'NEMA 17 Stepper Motor 42BYGH',
                variants: [{ price: '450.00', available: true }],
                images: [{ src: 'https://cdn.shopify.com/s/files/x.jpg' }],
                tags: ['stepper'],
              },
            ],
          })
        : new Response('blocked', { status: 403 });
    });
    const { status } = await refreshVendor(vendor(), [part()], fetchImpl);
    expect(status.ok).toBe(true);
    expect(status.productCount).toBe(1);
  });
});

describe('refreshAll', () => {
  it('one failing vendor does not abort the others', async () => {
    const vendors = [
      vendor({ slug: 'broken', url: 'https://broken.in/' }),
      vendor({ slug: 'robodo' }),
    ];
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('broken.in')) throw new Error('down');
      if (!url.includes('page=1')) return jsonResponse({ products: [] });
      return jsonResponse({
        products: [
          {
            handle: 'nema-17-stepper-motor',
            title: 'NEMA 17 Stepper Motor 42BYGH',
            variants: [{ price: '450.00', available: true }],
            images: [{ src: 'https://cdn.shopify.com/s/files/x.jpg' }],
            tags: [],
          },
        ],
      });
    });

    const kv = kvDouble();
    const results = await refreshAll(vendors, [part()], kv, fetchImpl);
    expect(results.find((r) => r.slug === 'broken')?.ok).toBe(false);
    expect(results.find((r) => r.slug === 'robodo')?.ok).toBe(true);
  });

  it('keeps a failing vendor previous offers rather than deleting them', async () => {
    const kv = kvDouble({
      'part:nema-17-stepper': JSON.stringify([{ vendorSlug: 'robodo', url: 'https://old/' }]),
    });
    const kvImpl = {
      get: kv.get,
      put: kv.put,
      delete: async (k: string) => void kv.store.delete(k),
      list: kv.list,
    };
    const fetchImpl = vi.fn(async () => {
      throw new Error('down');
    });

    await refreshAll([vendor()], [part()], kvImpl, fetchImpl);
    // Still there: a transient outage degrades freshness, it does not delete data.
    expect(kv.store.has('part:nema-17-stepper')).toBe(true);
  });
});

describe('handleOffersRequest', () => {
  const kv = kvDouble({
    'part:nema-17-stepper': JSON.stringify([
      { vendorSlug: 'robodo', url: 'https://robodo.in/products/x', isDeepLink: true },
    ]),
  });

  it('serves cached offers for a known part', async () => {
    const res = await handleOffersRequest('https://worker.dev/offers?part=nema-17-stepper', kv);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { offers: unknown[] };
    expect(body.offers).toHaveLength(1);
  });

  it('returns an empty list for an unknown part, not an error payload', async () => {
    const res = await handleOffersRequest('https://worker.dev/offers?part=nope', kv);
    expect(res.status).toBe(404);
    const body = (await res.json()) as { offers: unknown[]; reason: string };
    expect(body.offers).toEqual([]);
    expect(body.reason).toBe('unknown-part');
  });

  it('404s any other path so the Worker exposes nothing else', async () => {
    expect((await handleOffersRequest('https://worker.dev/', kv)).status).toBe(404);
    expect((await handleOffersRequest('https://worker.dev/anything', kv)).status).toBe(404);
  });

  it('404s a request with no part parameter', async () => {
    expect((await handleOffersRequest('https://worker.dev/offers', kv)).status).toBe(404);
  });

  it('sets cache headers and an ETag', async () => {
    const res = await handleOffersRequest('https://worker.dev/offers?part=nema-17-stepper', kv);
    expect(res.headers.get('cache-control')).toBe('public, max-age=300');
    expect(res.headers.get('etag')).toBeTruthy();
  });

  it('serves 304 when the client ETag matches', async () => {
    const first = await handleOffersRequest('https://worker.dev/offers?part=nema-17-stepper', kv);
    const etag = first.headers.get('etag')!;
    const second = await handleOffersRequest(
      'https://worker.dev/offers?part=nema-17-stepper',
      kv,
      etag,
    );
    expect(second.status).toBe(304);
  });
});
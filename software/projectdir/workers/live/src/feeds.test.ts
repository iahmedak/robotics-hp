import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  MAX_PRODUCTS_PER_VENDOR,
  detectPlatform,
  normaliseShopify,
  normaliseWooCommerce,
  readShopifyFeed,
  readWooCommerceFeed,
  toMajorUnits,
} from './feeds';

/* ------------------------------------------------------------------ *
 * Fixtures — inline literals copied from the shapes verified live
 * (spec §5.2, ground-truth payloads). No network, no fixture files.
 * ------------------------------------------------------------------ */

const SHOPIFY_PRODUCT = {
  id: 8336295166152,
  title: 'RS-38 12V DC Geared Motor – 60RPM, Grade A for Pop Corn Machine',
  handle: 'rs-38-12v-dc-geared-motor-60rpm-grade-a',
  body_html: '<p>DC geared motor</p>',
  published_at: '2024-04-02T10:00:00+05:30',
  created_at: '2024-04-02T10:00:00+05:30',
  updated_at: '2026-01-11T09:12:00+05:30',
  vendor: '',
  product_type: 'Motors',
  tags: ['gear motor', 'rs38', '12v'],
  variants: [
    {
      id: 4600000000001,
      title: 'Default Title',
      sku: 'RS38-60',
      available: true,
      price: '1250.00',
      compare_at_price: null,
    },
  ],
  images: [
    {
      id: 1,
      src: 'https://cdn.shopify.com/s/files/1/x/rs38.jpg?v=123',
      width: 1280,
      height: 960,
    },
  ],
  options: [],
};

const WOO_PRODUCT = {
  id: 4211,
  name: 'Dream Polymer PETG Pro Sky Blue Filaments',
  slug: 'dream-polymer-petg-pro-sky-blue-filaments',
  permalink: 'https://zbotic.in/product/dream-polymer-petg-pro-sky-blue-filaments/',
  sku: 'PETG-SKY',
  prices: {
    price: '102660',
    regular_price: '102660',
    sale_price: '102660',
    price_range: null,
    currency_code: 'INR',
    currency_symbol: '₹',
    currency_minor_unit: 2,
    currency_decimal_separator: '.',
    currency_thousand_separator: ',',
    currency_prefix: '₹',
    currency_suffix: '',
  },
  images: [
    {
      id: 90,
      src: 'https://cdn.zbotic.in/wp-content/uploads/2025/01/petg.webp',
      thumbnail: 'https://cdn.zbotic.in/wp-content/uploads/2025/01/petg-300x300.webp',
      srcset: '',
      sizes: '',
      name: 'PETG',
      alt: '',
    },
  ],
  categories: [{ id: 7, name: '3D Printer Filaments' }],
  tags: [{ id: 8, name: 'filament', slug: 'filament' }],
  is_in_stock: false,
  is_purchasable: true,
  stock_availability: 'instock',
  attributes: [],
};

const CF_CHALLENGE_HTML =
  '<!DOCTYPE html><html><head><title>Just a moment...</title></head>' +
  '<body><script src="/cdn-cgi/challenge-platform/h/b/orchestrate"></script></body></html>';

const woo = (over: Record<string, unknown> = {}) => ({ ...WOO_PRODUCT, ...over });
const shopify = (over: Record<string, unknown> = {}) => ({ ...SHOPIFY_PRODUCT, ...over });

/* ------------------------------------------------------------------ *
 * fetch stubbing
 * ------------------------------------------------------------------ */

type Stub = { match: string; status?: number; body?: string; throws?: boolean };

/** Routes by URL substring. Anything unrouted 404s, which every probe tolerates. */
function routeFetch(stubs: Stub[]) {
  return vi.fn(async (input: unknown) => {
    const url = typeof input === 'string' ? input : String(input);
    const hit = stubs.find((s) => url.includes(s.match));
    if (!hit) return new Response('not found', { status: 404 });
    if (hit.throws) throw new TypeError('fetch failed');
    return new Response(hit.body ?? '', {
      status: hit.status ?? 200,
      headers: { 'content-type': 'text/html' },
    });
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

/* ------------------------------------------------------------------ *
 * toMajorUnits
 * ------------------------------------------------------------------ */

describe('toMajorUnits', () => {
  it('divides WooCommerce minor units by 10 ** currency_minor_unit', () => {
    expect(toMajorUnits(102660, 2)).toBe(1026.6);
  });

  it('leaves the amount untouched when the currency has no minor unit', () => {
    expect(toMajorUnits(102660, 0)).toBe(102660);
  });

  it('propagates null rather than inventing a zero', () => {
    expect(toMajorUnits(null, 2)).toBeNull();
    expect(toMajorUnits(null, 0)).toBeNull();
  });

  it('preserves a genuine zero as 0, not null', () => {
    expect(toMajorUnits(0, 2)).toBe(0);
    expect(toMajorUnits(0, 0)).toBe(0);
  });

  it('rejects amounts that are not finite numbers', () => {
    expect(toMajorUnits(Number.NaN, 2)).toBeNull();
    expect(toMajorUnits(Number.POSITIVE_INFINITY, 2)).toBeNull();
  });

  it('refuses to scale by a nonsensical minor unit instead of guessing', () => {
    expect(toMajorUnits(102660, -1)).toBeNull();
    expect(toMajorUnits(102660, 1.5)).toBeNull();
    expect(toMajorUnits(102660, Number.NaN)).toBeNull();
  });

  it('kills binary floating dust so two decimals survive exactly', () => {
    expect(toMajorUnits(102659, 2)).toBe(1026.59);
    expect(String(toMajorUnits(1, 2))).toBe('0.01');
  });
});

/* ------------------------------------------------------------------ *
 * WooCommerce normalisation
 * ------------------------------------------------------------------ */

describe('normaliseWooCommerce', () => {
  it('maps the verified WooCommerce shape onto RawProduct', () => {
    const [p] = normaliseWooCommerce('zbotic', [WOO_PRODUCT]);
    expect(p).toEqual({
      vendorSlug: 'zbotic',
      title: 'Dream Polymer PETG Pro Sky Blue Filaments',
      handle: 'dream-polymer-petg-pro-sky-blue-filaments',
      permalink: 'https://zbotic.in/product/dream-polymer-petg-pro-sky-blue-filaments/',
      image: 'https://cdn.zbotic.in/wp-content/uploads/2025/01/petg.webp',
      tagsText: '3D Printer Filaments filament',
      priceMinor: 1026.6,
      currency: 'INR',
      inStock: false,
    });
  });

  it('divides by 10 ** currency_minor_unit so 102660 is 1026.60, not 102660', () => {
    const [p] = normaliseWooCommerce('zbotic', [WOO_PRODUCT]);
    expect(p!.priceMinor).toBe(1026.6);
    expect(p!.priceMinor).not.toBe(102660);
  });

  it('passes the amount through unchanged when the currency has no minor unit', () => {
    const payload = [
      woo({ prices: { ...WOO_PRODUCT.prices, price: '102660', currency_minor_unit: 0 } }),
    ];
    expect(normaliseWooCommerce('zbotic', payload)[0]!.priceMinor).toBe(102660);
  });

  it('treats a non-numeric price as no price, never as 0', () => {
    const payload = [
      woo({ prices: { ...WOO_PRODUCT.prices, price: 'call for price' } }),
      woo({ id: 2, slug: 'no-price-at-all', prices: {} }),
    ];
    const out = normaliseWooCommerce('zbotic', payload);
    expect(out.map((p) => p.priceMinor)).toEqual([null, null]);
    expect(out.some((p) => p.priceMinor === 0)).toBe(false);
  });

  it('keeps a real zero price as 0', () => {
    const payload = [woo({ prices: { ...WOO_PRODUCT.prices, price: '0' } })];
    expect(normaliseWooCommerce('zbotic', payload)[0]!.priceMinor).toBe(0);
  });

  it('drops the price rather than guessing a scale when currency_minor_unit is absent', () => {
    const { currency_minor_unit, ...prices } = WOO_PRODUCT.prices;
    const payload = [woo({ prices: { ...prices, price: '102660' } })];
    expect(normaliseWooCommerce('zbotic', payload)[0]!.priceMinor).toBeNull();
  });

  it('keeps is_in_stock false as false — not null, not dropped', () => {
    const [p] = normaliseWooCommerce('zbotic', [woo({ is_in_stock: false })]);
    expect(p!.inStock).toBe(false);
  });

  it('keeps is_in_stock true as true', () => {
    const [p] = normaliseWooCommerce('zbotic', [woo({ is_in_stock: true })]);
    expect(p!.inStock).toBe(true);
  });

  it('reports stock as unknown when the feed simply omits it', () => {
    const { is_in_stock, ...rest } = WOO_PRODUCT;
    const [p] = normaliseWooCommerce('zbotic', [rest as Record<string, unknown>]);
    expect(p!.inStock).toBeNull();
  });

  it('joins category names and tag names into tagsText', () => {
    const payload = [
      woo({
        categories: [{ name: 'Motors' }, { name: 'Gearboxes' }],
        tags: [{ name: 'nema17' }, { name: 'stepper' }],
      }),
    ];
    expect(normaliseWooCommerce('zbotic', payload)[0]!.tagsText).toBe(
      'Motors Gearboxes nema17 stepper',
    );
  });

  it('accepts bare-string tags and categories as well as objects', () => {
    const payload = [woo({ categories: ['Motors'], tags: ['stepper'] })];
    expect(normaliseWooCommerce('zbotic', payload)[0]!.tagsText).toBe('Motors stepper');
  });

  it('uses the permalink verbatim and leaves a missing image null', () => {
    const payload = [woo({ images: [] })];
    const [p] = normaliseWooCommerce('zbotic', payload);
    expect(p!.permalink).toBe('https://zbotic.in/product/dream-polymer-petg-pro-sky-blue-filaments/');
    expect(p!.image).toBeNull();
  });

  it('skips entries with no permalink and keeps the rest', () => {
    const payload = [
      null,
      'not an object',
      { ...WOO_PRODUCT, id: 1 },
      woo({ id: 2, permalink: '', slug: 'broken' }),
      woo({ id: 3, permalink: 'https://zbotic.in/product/good/', slug: 'good' }),
    ];
    const out = normaliseWooCommerce('zbotic', payload);
    expect(out).toHaveLength(2);
    expect(out.map((p) => p.handle)).toEqual([
      'dream-polymer-petg-pro-sky-blue-filaments',
      'good',
    ]);
  });

  it('returns an empty array for payloads that are not arrays', () => {
    expect(normaliseWooCommerce('zbotic', null)).toEqual([]);
    expect(normaliseWooCommerce('zbotic', { products: [] })).toEqual([]);
    expect(normaliseWooCommerce('zbotic', 'nope')).toEqual([]);
    expect(normaliseWooCommerce('zbotic', 42)).toEqual([]);
  });
});

/* ------------------------------------------------------------------ *
 * Shopify normalisation
 * ------------------------------------------------------------------ */

describe('normaliseShopify', () => {
  it('maps the verified Shopify shape onto RawProduct', () => {
    const [p] = normaliseShopify('robodo', 'robodo.in', { products: [SHOPIFY_PRODUCT] });
    expect(p).toEqual({
      vendorSlug: 'robodo',
      title: 'RS-38 12V DC Geared Motor – 60RPM, Grade A for Pop Corn Machine',
      handle: 'rs-38-12v-dc-geared-motor-60rpm-grade-a',
      permalink: 'https://robodo.in/products/rs-38-12v-dc-geared-motor-60rpm-grade-a',
      image: 'https://cdn.shopify.com/s/files/1/x/rs38.jpg?v=123',
      tagsText: 'gear motor rs38 12v Motors',
      priceMinor: 1250,
      currency: null,
      inStock: true,
    });
  });

  it('rebuilds the permalink from the handle, which the feed does not carry', () => {
    const [p] = normaliseShopify('robodo', 'robodo.in', { products: [SHOPIFY_PRODUCT] });
    expect(p!.permalink).toBe(
      'https://robodo.in/products/rs-38-12v-dc-geared-motor-60rpm-grade-a',
    );
  });

  it('builds the same permalink whether the host arrives bare or with a scheme', () => {
    for (const host of ['robodo.in', 'https://robodo.in', 'https://robodo.in/', 'robodo.in/']) {
      const [p] = normaliseShopify('robodo', host, { products: [SHOPIFY_PRODUCT] });
      expect(p!.permalink).toBe(
        'https://robodo.in/products/rs-38-12v-dc-geared-motor-60rpm-grade-a',
      );
    }
  });

  it('does NOT divide the Shopify price — variants[0].price is already major units', () => {
    const [p] = normaliseShopify('robodo', 'robodo.in', { products: [SHOPIFY_PRODUCT] });
    expect(p!.priceMinor).toBe(1250);
    expect(p!.priceMinor).not.toBe(1.25);
  });

  it('treats a non-numeric Shopify price as no price', () => {
    const payload = [
      shopify({ variants: [{ ...SHOPIFY_PRODUCT.variants[0], price: 'call for price' }] }),
    ];
    expect(normaliseShopify('robodo', 'robodo.in', { products: payload })[0]!.priceMinor)
      .toBeNull();
  });

  it('reports currency as null because the public Shopify feed carries none', () => {
    const [p] = normaliseShopify('robodo', 'robodo.in', { products: [SHOPIFY_PRODUCT] });
    expect(p!.currency).toBeNull();
  });

  it('joins tags and product_type into tagsText', () => {
    const payload = [shopify({ tags: ['a', 'b'], product_type: 'Servos' })];
    expect(normaliseShopify('robodo', 'robodo.in', { products: payload })[0]!.tagsText)
      .toBe('a b Servos');
  });

  it('keeps variant availability false as false and absence as null', () => {
    const outOfStock = shopify({ variants: [{ ...SHOPIFY_PRODUCT.variants[0], available: false }] });
    expect(normaliseShopify('robodo', 'robodo.in', { products: [outOfStock] })[0]!.inStock)
      .toBe(false);

    const noVariants = shopify({ variants: [] });
    expect(normaliseShopify('robodo', 'robodo.in', { products: [noVariants] })[0]!.inStock)
      .toBeNull();
  });

  it('leaves the image null when the product has none', () => {
    const [p] = normaliseShopify('robodo', 'robodo.in', {
      products: [shopify({ images: [] })],
    });
    expect(p!.image).toBeNull();
  });

  it('skips products with no handle and keeps the rest', () => {
    const payload = [
      null,
      123,
      {},
      shopify({ id: 1, handle: '' }),
      shopify({ id: 2, handle: '   ' }),
      shopify({ id: 3, handle: 'good-handle' }),
    ];
    const out = normaliseShopify('robodo', 'robodo.in', { products: payload });
    expect(out).toHaveLength(1);
    expect(out[0]!.handle).toBe('good-handle');
    expect(out[0]!.permalink).toBe('https://robodo.in/products/good-handle');
  });

  it('returns an empty array for payloads that are not product objects', () => {
    expect(normaliseShopify('robodo', 'robodo.in', null)).toEqual([]);
    expect(normaliseShopify('robodo', 'robodo.in', [])).toEqual([]);
    expect(normaliseShopify('robodo', 'robodo.in', { products: 'nope' })).toEqual([]);
    expect(normaliseShopify('robodo', 'robodo.in', 'nope')).toEqual([]);
  });
});

/* ------------------------------------------------------------------ *
 * Pagination cap
 * ------------------------------------------------------------------ */

describe('MAX_PRODUCTS_PER_VENDOR', () => {
  const many = (n: number) =>
    Array.from({ length: n }, (_, i) => shopify({ id: i, handle: `handle-${i}` }));

  it('is 5000', () => {
    expect(MAX_PRODUCTS_PER_VENDOR).toBe(5000);
  });

  it('truncates a 6000-product payload to 5000', () => {
    const out = normaliseShopify('robodo', 'robodo.in', { products: many(6000) });
    expect(out).toHaveLength(5000);
  });

  it('reports truncation alongside the capped list', () => {
    const over = readShopifyFeed('robodo', 'robodo.in', { products: many(6000) });
    expect(over.products).toHaveLength(5000);
    expect(over.truncated).toBe(true);

    const under = readShopifyFeed('robodo', 'robodo.in', { products: many(4999) });
    expect(under.products).toHaveLength(4999);
    expect(under.truncated).toBe(false);

    const exact = readShopifyFeed('robodo', 'robodo.in', { products: many(5000) });
    expect(exact.products).toHaveLength(5000);
    expect(exact.truncated).toBe(false);
  });

  it('caps WooCommerce the same way and reports truncation', () => {
    const rows = Array.from({ length: 6000 }, (_, i) =>
      woo({ id: i, slug: `slug-${i}`, permalink: `https://zbotic.in/product/slug-${i}/` }),
    );
    const out = readWooCommerceFeed('zbotic', rows);
    expect(out.products).toHaveLength(5000);
    expect(out.truncated).toBe(true);
  });

  it('keeps the first MAX entries, so a newest-first page is honoured', () => {
    const out = normaliseShopify('robodo', 'robodo.in', { products: many(6000) });
    expect(out[0]!.handle).toBe('handle-0');
    expect(out.at(-1)!.handle).toBe('handle-4999');
  });
});

/* ------------------------------------------------------------------ *
 * Platform detection
 * ------------------------------------------------------------------ */

describe('detectPlatform', () => {
  it('identifies Shopify from a /products.json envelope', async () => {
    vi.stubGlobal(
      'fetch',
      routeFetch([
        { match: '/products.json', body: JSON.stringify({ products: [SHOPIFY_PRODUCT] }) },
      ]),
    );
    await expect(detectPlatform('robodo.in')).resolves.toBe('shopify');
  });

  it('identifies WooCommerce from a bare array with a permalink', async () => {
    vi.stubGlobal('fetch', routeFetch([{ match: '/wp-json/', body: JSON.stringify([WOO_PRODUCT]) }]));
    await expect(detectPlatform('zbotic.in')).resolves.toBe('woocommerce');
  });

  it('resolves to shopify when a host answers both probes, without hitting WooCommerce', async () => {
    const fetchMock = routeFetch([
      { match: '/products.json', body: JSON.stringify({ products: [SHOPIFY_PRODUCT] }) },
      { match: '/wp-json/', body: JSON.stringify([WOO_PRODUCT]) },
    ]);
    vi.stubGlobal('fetch', fetchMock);

    await expect(detectPlatform('both.in')).resolves.toBe('shopify');
    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.includes('/products.json'))).toBe(true);
    expect(urls.some((u) => u.includes('/wp-json/'))).toBe(false);
  });

  it('returns null for a Cloudflare challenge page and does not throw', async () => {
    vi.stubGlobal('fetch', routeFetch([{ match: '', status: 403, body: CF_CHALLENGE_HTML }]));
    await expect(detectPlatform('robu.in')).resolves.toBeNull();
  });

  it('returns null for a 200 that is still an HTML challenge body', async () => {
    vi.stubGlobal('fetch', routeFetch([{ match: '', status: 200, body: CF_CHALLENGE_HTML }]));
    await expect(detectPlatform('robu.in')).resolves.toBeNull();
  });

  it('returns null when the network throws and does not throw itself', async () => {
    vi.stubGlobal('fetch', routeFetch([{ match: '', throws: true }]));
    await expect(detectPlatform('robolark.in')).resolves.toBeNull();
  });

  it('returns null for JSON that is neither a products envelope nor an array', async () => {
    vi.stubGlobal('fetch', routeFetch([{ match: '', body: JSON.stringify({ ok: true, data: 1 }) }]));
    await expect(detectPlatform('weird.in')).resolves.toBeNull();
  });

  it('returns null for an array of objects with no permalink', async () => {
    vi.stubGlobal('fetch', routeFetch([{ match: '', body: JSON.stringify([{ id: 1, name: 'x' }]) }]));
    await expect(detectPlatform('weird.in')).resolves.toBeNull();
  });

  it('returns null for a 404 on both endpoints', async () => {
    vi.stubGlobal('fetch', routeFetch([]));
    await expect(detectPlatform('gonescript.in')).resolves.toBeNull();
  });

  it('returns null when the response body is not JSON at all', async () => {
    vi.stubGlobal('fetch', routeFetch([{ match: '', body: '<!doctype html><title>hi</title>' }]));
    await expect(detectPlatform('generic.in')).resolves.toBeNull();
  });

  it('accepts a host given with a scheme', async () => {
    const fetchMock = routeFetch([
      { match: '/products.json', body: JSON.stringify({ products: [SHOPIFY_PRODUCT] }) },
    ]);
    vi.stubGlobal('fetch', fetchMock);
    await expect(detectPlatform('https://robodo.in/')).resolves.toBe('shopify');
    expect(String(fetchMock.mock.calls[0]![0])).toBe('https://robodo.in/products.json?limit=1');
  });

  it('passes caller headers through to every probe', async () => {
    const fetchMock = routeFetch([
      { match: '/products.json', body: JSON.stringify({ products: [] }) },
    ]);
    vi.stubGlobal('fetch', fetchMock);
    await detectPlatform('robodo.in', { headers: { 'x-probe': 'yes' } });
    const call = fetchMock.mock.calls[0] as unknown as [string, RequestInit | undefined];
    const init = (call[1] ?? {}) as RequestInit;
    expect(new Headers(init.headers).get('x-probe')).toBe('yes');
  });

  it('never rejects, whatever fetch does', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        throw new Error('boom');
      }),
    );
    await expect(detectPlatform('hostile.in')).resolves.toBeNull();
  });
});
// ---- Arena grafts: cases the base implementation got wrong. ----

describe('graft: a non-absolute URL is never trusted', () => {
  const woo = (over: Record<string, unknown> = {}) => [
    {
      id: 1,
      name: 'Absolute URL product',
      slug: 'abs',
      permalink: 'https://zbotic.in/product/abs/',
      prices: { price: '100000', currency_minor_unit: 2, currency_code: 'INR' },
      images: [{ src: 'https://cdn.zbotic.in/x.webp' }],
      ...over,
    },
  ];

  it('drops a WooCommerce product whose permalink is relative', () => {
    // Spec section 12 calls a wrong product link the worst failure here. A
    // relative path has no host, so it can only resolve against our own
    // domain - a link to nothing.
    expect(normaliseWooCommerce('zbotic', woo({ permalink: '/product/abs/' }))).toHaveLength(0);
  });

  it('keeps an absolute permalink', () => {
    expect(normaliseWooCommerce('zbotic', woo())).toHaveLength(1);
  });

  it('nulls a relative image rather than emitting it', () => {
    const out = normaliseWooCommerce('zbotic', woo({ images: [{ src: '/uploads/x.webp' }] }));
    expect(out[0]?.image).toBeNull();
  });

  it('keeps an absolute image', () => {
    expect(normaliseWooCommerce('zbotic', woo())[0]?.image).toBe('https://cdn.zbotic.in/x.webp');
  });
});

describe('graft: tagsText does not repeat a token', () => {
  it('de-duplicates repeated tag and category names', () => {
    // Matching later runs token overlap; a duplicated token distorts the
    // multiset and inflates similarity against an unrelated part.
    const out = normaliseWooCommerce('zbotic', [
      {
        id: 1,
        name: 'Tagged product',
        slug: 'tagged',
        permalink: 'https://zbotic.in/product/tagged/',
        prices: { price: '1000', currency_minor_unit: 2, currency_code: 'INR' },
        images: [],
        categories: [{ name: 'Servos' }, { name: 'servos' }],
        tags: [{ name: 'Robot' }, { name: 'ROBOT' }],
      },
    ]);
    const tokens = (out[0]?.tagsText ?? '').toLowerCase().split(/\s+/).filter(Boolean);
    expect(new Set(tokens).size).toBe(tokens.length);
  });
});
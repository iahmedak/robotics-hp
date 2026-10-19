# Live Offers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolve each canonical part to real supplier product pages and product images, fetched live and cached in a Cloudflare Worker, with graceful degradation to today's static links.

**Architecture:** A Cloudflare Worker refreshes nine suppliers' public product feeds on a 6-hour cron, matches products to canonical parts with the existing search engine, and writes offers to KV. The static Astro site reads `/offers?part=<id>` and merges the result with its existing static vendor list on the client. If the Worker is unreachable, the site behaves exactly as it does today.

**Tech Stack:** Cloudflare Workers + KV, TypeScript, Vitest, Astro 5, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-13-live-offers-design.md` — read it alongside this plan. The plan implements it; the spec argues why.

## Global Constraints

Copy these verbatim from the spec. Every task implicitly includes them.

- `DEEP_LINK_MIN = 0.85` — at or above this, emit a deep product link.
- `SEARCH_ONLY_MIN = 0.60` — below `DEEP_LINK_MIN` and at or above this, emit a vendor search URL instead of a deep link.
- `MAX_PRODUCTS_PER_VENDOR = 5000` per refresh; exceeding it sets `truncated: true` in vendor status.
- `MAX_OFFERS_PER_PART = 60`, ordered by confidence desc, then trust desc, then vendor name asc.
- `MAX_OFFERS_PER_VENDOR_PART = 5`, ordered by confidence desc, then price ascending.
- Worker refresh cron interval: every 6 hours.
- KV keys: `meta`, `vendor:<slug>:status`, `part:<canonicalId>`. Overwritten wholesale, never individually expired.
- `/offers` response carries `Cache-Control: public, max-age=300` and an `ETag`.
- Stale threshold: beyond 48 hours since `fetchedAt`, the UI shows an update notice.
- Images are **hotlinked from supplier CDNs**. No R2 caching, no copying.
- **The Worker never emits fallback/search-only entries.** The client merges live offers with the static vendor list and synthesises fallbacks. A partial response must degrade to the full static list, never a truncated one.
- Prices are attributed to the named supplier in the UI. **GST is never inferred or normalised.** No price ever renders as `₹0` when unknown — it renders as absent.
- WooCommerce prices are in **minor units**: divide by `10 ** prices.currency_minor_unit`.
- Shopify permalinks are not in the feed — construct as `https://{host}/products/{handle}`.
- Platform is auto-detected per refresh. Never read `search.platform` from `vendors.json`.
- Browser tests must stub the Worker via `page.route`. The suite must never hit live supplier networks.
- `npm run validate` must stay green throughout.
- Never add an AI attribution trailer to a commit message in this repository.

## Review Focus

The spec implies failure modes that no stated test covers. Most likely to bite a real user first:

1. **A supplier rewrites a product title** between refreshes (adding marketing words). Its deep link silently degrades to a search URL. A reasonable user expects the link to keep working, just less precisely — and expects to know why it changed.
2. **A hotlinked image returns 403** because a supplier CDN blocks hotlinking. A reasonable user expects a clean placeholder, never a broken-image glyph and never a layout hole.
3. **A price is absent or non-numeric** (some vendors quote "call for price"). A reasonable user expects no price shown at all, never `₹0` and never a stale one carried over.
4. **A product has variants at different prices** (MG995 9g vs 25g). A reasonable user expects the price to belong to the variant that matched, not to an arbitrary sibling variant.
5. **A matched product is out of stock.** A reasonable user expects it marked unavailable, not silently omitted and not presented as buyable.

Each line below gets its test inside the task that owns the code.

---

---

### Task 1: Shared offers contract

The Worker and the site both need the `Offer` shape, the thresholds, and search-URL construction. Putting them in `src/lib` means one definition, already importable by both — and unit-testable without a Worker runtime.

**Files:**
- Create: `src/lib/offers.ts`
- Test: `src/lib/__tests__/offers.test.ts`
- Modify: `vitest.config.ts` — `test.include` must become `['src/**/*.test.ts', 'workers/**/*.test.ts']`, or every later Worker test is silently skipped.

**Interfaces:**
- Consumes: `Vendor`, `Platform` from `src/lib/schema.ts`.
- Produces — consumed by Tasks 3, 4, 6, 7:
  - `export const DEEP_LINK_MIN = 0.85;`
  - `export const SEARCH_ONLY_MIN = 0.6;`
  - `export type OfferPrice = { amount: number; currency: string; formatted: string };`
  - `export type Offer = { vendorSlug: string; vendorName: string; url: string; isDeepLink: boolean; image: string | null; title: string; price: OfferPrice | null; inStock: boolean | null; confidence: number };`
  - `export function searchUrl(host: string, platform: Platform, query: string): string`
  - `export function vendorSearchQuery(part: CanonicalPart): string`

- [ ] **Step 1: Extend vitest include so Worker tests will run**

In `vitest.config.ts`, change `include: ['src/**/*.test.ts']` to `include: ['src/**/*.test.ts', 'workers/**/*.test.ts']`. Verify by running `npx vitest run` and confirming the existing 8 files still pass.

- [ ] **Step 2: Write the failing tests in `src/lib/__tests__/offers.test.ts`**

Cover exactly these, with these assertions:

```ts
import { describe, it, expect } from 'vitest';
import { DEEP_LINK_MIN, SEARCH_ONLY_MIN, searchUrl, vendorSearchQuery } from '../offers';
import type { CanonicalPart } from '../schema';

const part = (over: Partial<CanonicalPart> = {}): CanonicalPart => ({
  id: 'nema-17-stepper', canonicalName: 'NEMA 17 Stepper Motor',
  aliases: ['42BYGH'], category: 'stepper-motors',
  specs: { HoldingTorque: '1.2 Nm' }, vendors: ['robodo'], ...over,
});

describe('thresholds', () => {
  it('keeps the spec values', () => {
    expect(DEEP_LINK_MIN).toBe(0.85);
    expect(SEARCH_ONLY_MIN).toBe(0.6);
  });
});

describe('searchUrl', () => {
  it('uses /search?q= for shopify', () =>
    expect(searchUrl('robodo.in', 'shopify', 'nema 17'))
      .toBe('https://robodo.in/search?q=nema+17'));
  it('uses ?s=&post_type=product for woocommerce', () =>
    expect(searchUrl('zbotic.in', 'woocommerce', 'nema 17'))
      .toBe('https://zbotic.in/?s=nema+17&post_type=product'));
  it('falls back to the bare origin for magento/odoo/generic', () =>
    expect(searchUrl('robogears.in', 'odoo', 'nema 17'))
      .toBe('https://robogears.in'));
  it('percent-encodes a query with characters unsafe in a query string', () =>
    expect(searchUrl('robodo.in', 'shopify', 'mg996r & servo'))
      .toContain('q=mg996r%20%26%20servo'));
});

describe('vendorSearchQuery', () => {
  it('combines the canonical name with its most distinctive spec', () =>
    expect(vendorSearchQuery(part())).toContain('NEMA 17'));
  it('never returns an empty query', () =>
    expect(vendorSearchQuery(part({ canonicalName: '', specs: {} })).length).toBeGreaterThan(0));
});
```

- [ ] **Step 3: Run and confirm failure**

Run: `npx vitest run src/lib/__tests__/offers.test.ts`
Expected: FAIL — `Cannot find module '../offers'`.

- [ ] **Step 4: Implement `src/lib/offers.ts`**

Define `DEEP_LINK_MIN`, `SEARCH_ONLY_MIN`, `OfferPrice`, `Offer` exactly as in Interfaces.

`searchUrl(host: string, platform: Platform, query: string): string` — switch on platform, `encodeURIComponent(query)` in all branches, `https://` scheme, `magento | odoo | generic | none` return `https://{host}`.

`vendorSearchQuery(part: CanonicalPart): string` — take `part.canonicalName`; if blank, fall back to `part.category.replace(/-/g, ' ')`; append the first entry of `Object.entries(part.specs)[0]` when one exists; collapse whitespace; return the trimmed string. Never return empty.

Do not implement `mergeOffers` yet — Task 6 owns it, and it needs the Worker response shape to be settled first.

- [ ] **Step 5: Run and confirm pass**

Run: `npx vitest run src/lib/__tests__/offers.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/offers.ts src/lib/__tests__/offers.test.ts vitest.config.ts
git commit -m "feat(offers): shared Offer type, thresholds and search-URL builder"
```

---

### Task 2: Capture real feed fixtures

Matching tests are only worth writing against real payloads. Hand-written mocks encode assumptions about field names — which is precisely what needs verifying. This task captures genuine responses.

**Files:**
- Create: `scripts/capture-fixtures.mjs`
- Create: `workers/live/test/fixtures/shopify-products.json`
- Create: `workers/live/test/fixtures/woocommerce-products.json`
- Create: `workers/live/test/fixtures/cloudflare-challenge.html`
- Test: `workers/live/test/fixtures.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: three fixture files at the exact paths above. Tasks 3 and 4 read them by relative path. Record the capture date inside each JSON file under a `_capturedFrom` key.

- [ ] **Step 1: Write `scripts/capture-fixtures.mjs`**

A Node script that fetches and writes the three files. It must send a browser `User-Agent`, follow the spec's detection order, and **never throw on a bad response** — it records what it got, including a non-JSON body, so the blocked case is captured deliberately rather than by accident.

Usage: `node scripts/capture-fixtures.mjs`. It writes to `workers/live/test/fixtures/`.

Include a known robotics product in the Shopify fetch. `robodo.in` currently serves an RS-38 DC geared motor; prefer a NEMA or stepper product so the fixture exercises digit-bearing titles. If none is present on page 1, walk pages until one is found or 5 pages are exhausted, and record that in `_capturedNote`.

- [ ] **Step 2: Run it**

Run: `node scripts/capture-fixtures.mjs`
Expected: three files written, each non-empty. Print each vendor's status and product count.

- [ ] **Step 3: Write the failing fixture test `workers/live/test/fixtures.test.ts`**

This test guards the fixtures themselves, so a later refresh cannot quietly turn them into something unrepresentative.

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const read = (p: string) => readFileSync(fileURLToPath(new URL(p, import.meta.url)), 'utf8');

describe('captured fixtures', () => {
  it('shopify fixture has products, an image src and a reconstructable handle', () => {
    const j = JSON.parse(read('./shopify-products.json'));
    expect(Array.isArray(j.products)).toBe(true);
    expect(j.products.length).toBeGreaterThan(0);
    expect(j.products[0].handle).toBeTruthy();
    expect(j.products[0].images[0].src).toMatch(/^https:\/\//);
  });
  it('woocommerce fixture exposes permalink and a minor-unit price', () => {
    const j = JSON.parse(read('./woocommerce-products.json'));
    expect(Array.isArray(j)).toBe(true);
    expect(j[0].permalink).toMatch(/^https:\/\//);
    expect(j[0].prices.currency_minor_unit).toBe(2);
  });
  it('cloudflare fixture is the challenge page, not JSON', () => {
    expect(read('./cloudflare-challenge.html')).toMatch(/Just a moment|challenge|captcha/i);
  });
});
```

- [ ] **Step 4: Run and confirm pass**

Run: `npx vitest run workers/live/test/fixtures.test.ts`
Expected: PASS — this proves the fixtures are real and shaped as claimed.

- [ ] **Step 5: Commit**

```bash
git add scripts/capture-fixtures.mjs workers/live/test/
git commit -m "test(offers): capture real supplier feed fixtures"
```

---

### Task 3: Feed ingestion and normalisation

Turns two different vendor payloads into one `RawProduct`, including the minor-unit price divide that the spec flags as a 100× error waiting to happen.

**Files:**
- Create: `workers/live/src/feeds.ts`
- Test: `workers/live/src/feeds.test.ts`

**Interfaces:**
- Consumes: `Platform` from `src/lib/schema.ts`; fixtures from Task 2.
- Produces — consumed by Task 4:
  - `export type RawProduct = { vendorSlug: string; title: string; handle: string; permalink: string; image: string | null; tagsText: string; priceMinor: number | null; currency: string | null; inStock: boolean | null }`
  - `export type VendorStatus = { ok: boolean; platform: Platform | null; productCount: number; fetchedAt: string; truncated: boolean; error: string | null }`
  - `export function detectPlatform(host: string, init?: RequestInit): Promise<Platform | null>`
  - `export function normaliseShopify(slug: string, host: string, payload: unknown): RawProduct[]`
  - `export function normaliseWooCommerce(slug: string, payload: unknown): RawProduct[]`
  - `export const MAX_PRODUCTS_PER_VENDOR = 5000;`

- [ ] **Step 1: Write the failing tests**

Include every Review Focus line this task owns:

- **Price correctness (Review Focus 3)** — `prices.price === '102660'` with `currency_minor_unit: 2` yields `102660` in `priceMinor`, and a helper exposes the converted `1026.60`. A product whose price is `"call for price"` yields `priceMinor: null`, never `0`.
- **Out of stock (Review Focus 5)** — `is_in_stock: false` produces `inStock: false`, not `null` and not omission.
- **Cloudflare challenge** — `detectPlatform` against the challenge fixture returns `null` and does not throw.
- **Shopify permalink** — reconstructed as `https://{host}/products/{handle}`.
- **Platform precedence** — a host responding to both probes resolves to `shopify`.
- **Cap** — a synthetic payload of 6,000 products truncates to 5,000.

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run workers/live/src/feeds.test.ts`
Expected: FAIL — `Cannot find module './feeds'`.

- [ ] **Step 3: Implement `workers/live/src/feeds.ts`**

`detectPlatform` follows the spec order and treats any non-JSON or challenge body as `null`. Wrap each fetch in try/catch returning `null` — never reject.

`normaliseShopify` reads `products[]`; skips entries with no `handle`; rebuilds the permalink; takes `images[0].src` or `null`; joins `tags` with `product_type` into `tagsText`; reads `variants[0].price` as a decimal into `priceMinor` (already major units for Shopify — do **not** divide); `available` into `inStock`.

`normaliseWooCommerce` reads the array; `permalink` verbatim; `images[0].src` or `null`; `categories[].name` plus `tags[].name` into `tagsText`; `prices.price` into `priceMinor` **after dividing by `10 ** prices.currency_minor_unit`**; `is_in_stock` into `inStock`.

Both slice to `MAX_PRODUCTS_PER_VENDOR`.

Also export `export function toMajorUnits(minor: number | null, currencyMinorUnit: number): number | null` so Task 4 formats prices with one tested conversion rather than an inline divide.

- [ ] **Step 4: Run and confirm pass**

Run: `npx vitest run workers/live/src/feeds.test.ts`
Expected: PASS.

- [ ] **Step 5: Run the whole suite to confirm the vitest include change works**

Run: `npx vitest run`
Expected: all files pass, and the new Worker files appear in the run.

- [ ] **Step 6: Commit**

```bash
git add workers/live/src/
git commit -m "feat(offers): platform detection and feed normalisation"
```

---

### Task 4: Matching and the Worker endpoint

The matching decision and the HTTP surface. Matching reuses `matchScore` from `src/lib/search.ts` — no new matching logic.

**Files:**
- Create: `workers/live/src/index.ts`
- Create: `workers/live/wrangler.toml`
- Create: `workers/live/package.json`
- Create: `workers/live/tsconfig.json`
- Modify: `tsconfig.json` (root) — exclude `workers`
- Modify: `package.json` — add `check:worker` and include it in `validate`
- Test: `workers/live/src/match.test.ts`

**Interfaces:**
- Consumes: `matchScore(query, part)` from `src/lib/search.ts`; `normaliseShopify`, `normaliseWooCommerce`, `detectPlatform`, `toMajorUnits`, `MAX_PRODUCTS_PER_VENDOR`, `RawProduct`, `VendorStatus` from `workers/live/src/feeds.ts`; `Offer`, `OfferPrice`, `DEEP_LINK_MIN`, `SEARCH_ONLY_MIN` from `src/lib/offers.ts`; fixtures from Task 2.
- Produces:
  - `export function matchProduct(product: RawProduct, parts: CanonicalPart[]): { partId: string; confidence: number } | null` — returns the single best match, or `null` below `SEARCH_ONLY_MIN`.
  - `export function buildOffers(products: RawProduct[], vendor: Vendor, parts: CanonicalPart[]): Offer[]` — emits **only** deep links at or above `DEEP_LINK_MIN`, capped at `MAX_OFFERS_PER_VENDOR_PART`. It must **never** emit `isDeepLink: false`; fallback entries are the client's job per the spec.
  - `export default { fetch, scheduled }` — the Worker entry.

- [ ] **Step 1: Write the failing matching tests `workers/live/src/match.test.ts`**

Use the real fixtures. Required cases, matching the spec's §9.1:

- A NEMA 17 title in the Shopify fixture matches the `nema-17-stepper` part at or above `DEEP_LINK_MIN`.
- The alias `42bygh` alone resolves to the same part.
- **Digit veto**: a `NEMA 23` title never matches `nema-17-stepper`, even though the strings are highly similar.
- **Digit veto**: `MG995` never matches an `MG996R` part.
- A PETG filament title matches **no** motor part.
- `buildOffers` never returns an entry with `isDeepLink: false`.
- `buildOffers` caps at 5 offers per vendor per part.
- **Title drift (Review Focus 1)**: a product whose title is padded with marketing words still yields a confidence at or above `SEARCH_ONLY_MIN`, so the client falls back to a search link rather than losing the supplier entirely. Assert the confidence *decreases* relative to the clean title, proving drift is visible rather than invisible.

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run workers/live/src/match.test.ts`
Expected: FAIL — `Cannot find module './index'`.

- [ ] **Step 3: Implement `workers/live/src/index.ts`**

`matchProduct` scores each part with `matchScore(product.title + ' ' + product.tagsText, part)` and returns the argmax, or `null` when the best score is below `SEARCH_ONLY_MIN`. Round confidence to 2 decimals.

`buildOffers` maps matches to `Offer` objects: `url` from `product.permalink`, `isDeepLink: true`, `image` from `product.image`, `title` from `product.title`, `price` built via `toMajorUnits` (or `null`), `inStock` from the product. Sort by confidence desc then price ascending, slice to 5.

The `fetch` handler serves only `GET /offers?part=<id>`: reads `part:<id>` from KV, returns `404` with `{ offers: [], reason: 'unknown-part' }` for an unknown id, sets `Cache-Control: public, max-age=300` and an `ETag`. Any other path returns 404. It must **never** call a supplier.

The `scheduled` handler loops vendors: detect platform, fetch and paginate, normalise, build offers, `put` `part:<id>`, and `put` `vendor:<slug>:status`. A vendor that throws keeps its previous `part:*` keys and records `ok: false` with the error string. Wrap each vendor in try/catch so one failure cannot abort the run.

- [ ] **Step 4: Add `wrangler.toml`, `workers/live/package.json` and `workers/live/tsconfig.json`**

`wrangler.toml`: `name = "projectdir-offers"`, `main = "src/index.ts"`, `compatibility_date` set to a valid recent date, a `[[kv_namespaces]]` binding `OFFERS` with `id = "REPLACE_ME"`, and `[triggers] crons = ["17 */6 * * *"]`.

`workers/live/package.json`: depends on the root workspace for the shared `src/lib` code via a relative import path; devDependency `@cloudflare/workers-types`; scripts `typecheck` (`tsc --noEmit`).

**Why a separate tsconfig is required.** The root `tsconfig.json` extends `astro/tsconfigs/strict`, whose `include` is `**/*.ts` — so it would try to typecheck Worker sources against DOM lib and `types: ["vitest/globals"]`. Worker code legitimately references `KVNamespace`, `ScheduledController` and `ExecutionContext`, which do not exist in that environment. Mixing the two produces either a wall of unrelated errors or, worse, pressure to strip real types from correct code.

So: add `"workers"` to the root `tsconfig.json` `exclude`, and give `workers/live/tsconfig.json` its own config with `types: ["@cloudflare/workers-types"]`. The two runtimes genuinely have different globals and deserve different type environments.

- [ ] **Step 5: Wire worker typechecking into the gate**

Add to root `package.json` scripts: `"check:worker": "npm --prefix workers/live run typecheck"`, and insert `npm run check:worker` into `validate` immediately after `check:astro`.

Run: `npm run validate`
Expected: green, including `check:worker`.

- [ ] **Step 6: Run matching tests and confirm pass**

Run: `npx vitest run workers/live/src/match.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add workers/live/
git commit -m "feat(offers): matching, offers endpoint and 6-hourly refresh"
```

---

### Task 5: Placeholder and resilient image

Hotlinking was chosen knowing some supplier CDNs block it. Review Focus 2 lives here.

**Files:**
- Create: `src/lib/placeholder.ts`
- Test: `src/lib/__tests__/placeholder.test.ts`
- Create: `src/components/PartImage.astro`

**Interfaces:**
- Consumes: `CanonicalPart` from `src/lib/schema.ts`.
- Produces:
  - `export function placeholderSvg(part: CanonicalPart, size?: number): string` — deterministic for a given part: same input always yields byte-identical output. Derive any pseudo-randomness from a hash of `part.id`, never `Math.random()`.
  - `<PartImage src={string | null} part={CanonicalPart} alt={string} />` — renders `<img>` when `src` is present, with `onerror` swapping to `placeholderSvg(part)`. When `src` is null it renders the placeholder directly, so the placeholder never depends on JS.

- [ ] **Step 1: Write the failing tests `src/lib/__tests__/placeholder.test.ts`**

- Same `part.id` twice produces identical strings (determinism).
- Different `part.id`s produce different output.
- Output is valid standalone SVG beginning with `<svg` and containing no unescaped `<` from the part name.
- A part name containing `<script>` is escaped in any rendered text.

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run src/lib/__tests__/placeholder.test.ts`
Expected: FAIL — `Cannot find module '../placeholder'`.

- [ ] **Step 3: Implement `src/lib/placeholder.ts`**

A small schematic generator in the existing blueprint style: rounded dark tile, grid pattern, and a glyph chosen by `part.category`. Hash `part.id` with a simple string hash to vary hue/rotation deterministically. Escape all interpolated text with `escapeHtml` from `src/lib/html.ts`.

- [ ] **Step 4: Create `src/components/PartImage.astro`**

Render `<img>` when `src` is non-null, with `loading="lazy"`, `decoding="async"`, `referrerpolicy="no-referrer"` (prevents leaking the page URL to vendor CDNs), and an inline `onerror` that replaces `this.src` with the placeholder data URI exactly once — guard with a `dataset.fellback` flag so a placeholder that itself fails cannot loop.

Render the placeholder `<img>` directly when `src` is null.

Alt text: the part's canonical name. Never empty on a meaningful image.

- [ ] **Step 5: Run and confirm pass**

Run: `npx vitest run src/lib/__tests__/placeholder.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/placeholder.ts src/lib/__tests__/placeholder.test.ts src/components/PartImage.astro
git commit -m "feat(offers): deterministic part placeholder and resilient image"
```

---

### Task 6: Part page offer list

Replaces the flat "Visit \<vendor\>" links with live offer cards, and owns the client-side merge.

**Files:**
- Modify: `src/lib/offers.ts` — add `mergeOffers`
- Modify: `src/lib/__tests__/offers.test.ts` — extend
- Create: `src/components/OfferList.astro`
- Modify: `src/pages/part/[id].astro`

**Interfaces:**
- Consumes: `Offer`, `searchUrl`, `vendorSearchQuery` from `src/lib/offers.ts`; `PartImage` from Task 5.
- Produces:
  - `export function mergeOffers(live: Offer[], part: CanonicalPart, vendors: Map<string, Vendor>): { offer: Offer; isFallback: boolean }[]` — starts from `live`, then appends one `isFallback: true` entry for every vendor in `part.vendors` absent from `live`. Sorted: deep links first by confidence desc, fallbacks last by vendor name asc. **This is the only place fallback entries are created.**
  - `export const STALE_AFTER_HOURS = 48;`
  - `export function isStale(fetchedAt: string, now?: Date): boolean`
  - `<OfferList partId={string} />` — fetches `/offers` client-side, renders cards, falls back to the static vendor list on any failure.

- [ ] **Step 1: Write the failing merge tests**

- Live offers for two of three claimed vendors returns three entries; the third has `isFallback: true`.
- **Degradation (spec §7.1)**: `mergeOffers([], part, vendors)` returns **all** vendors as fallbacks, never an empty list. This is the assertion that proves a failed Worker cannot blank a part page.
- Fallback URLs are built per platform via `searchUrl` and `vendorSearchQuery`.
- No vendor appears twice when it already has a live offer.
- Ordering: deep links precede fallbacks.
- `isStale` is true at 49 hours and false at 47.

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run src/lib/__tests__/offers.test.ts`
Expected: FAIL — `mergeOffers` not exported.

- [ ] **Step 3: Implement `mergeOffers`, `STALE_AFTER_HOURS`, `isStale`**

Per the Interfaces block. Cap total merged entries at `MAX_OFFERS_PER_PART = 60`.

- [ ] **Step 4: Create `src/components/OfferList.astro`**

Per the earlier `define:vars` incident: **do not use `define:vars`.** It implies `is:inline` and leaks raw imports into the HTML. Read config from a `<script type="application/json">` tag or data attributes and use a plain `<script>`.

Behaviour:
- Read the Worker base URL from a build-time public env value; when it is absent or empty, render the static vendor list immediately and do not attempt a fetch.
- `fetch` with an `AbortController` and a 6-second timeout.
- On any failure — network, non-200, malformed JSON — render the static list. **No error banner.** The page must look exactly as it does today.
- Each card: `<PartImage>`, vendor name and city, price rendered as `₹1,026.60 as listed by Zbotic` when known, stock state when known, and the outbound link.
- Deep links and fallbacks are visually and textually distinct. A fallback reads `Search Zbotic for NEMA 17 Stepper Motor` and carries no price, because no product was matched.
- Every outbound link gets `target="_blank" rel="noopener noreferrer"` and an `sr-only` "(opens in a new tab)".
- **Never render a price of `₹0`** — a null price renders nothing at all.
- When `isStale(fetchedAt)`, show `Live prices last updated <date>`.

- [ ] **Step 5: Wire `<OfferList partId={part.id} />` into `src/pages/part/[id].astro`**, replacing the existing vendor link list.

- [ ] **Step 6: Run the full suite and the build**

Run: `npm run validate`
Expected: all green, including `check:bundle`, which will catch any leaked import introduced here.

- [ ] **Step 7: Commit**

```bash
git add src/lib/offers.ts src/lib/__tests__/offers.test.ts src/components/OfferList.astro "src/pages/part/[id].astro"
git commit -m "feat(offers): live offer cards with client-side fallback merge"
```

---

### Task 7: Search result thumbnails

**Files:**
- Modify: `src/components/SearchBox.astro`

**Interfaces:**
- Consumes: `placeholderSvg` from `src/lib/placeholder.ts`; `Offer` type from `src/lib/offers.ts`.
- Produces: no new exports. `SearchBox` renders a 56×56 thumbnail per result, loading offers **after** results are already readable.

- [ ] **Step 1: Write the failing test in `scripts/browser-smoke.mjs`**

Add an assertion that a search for `nema17` yields results whose `.result-thumb` element exists, and that its `src` is either a vendor CDN URL or a `data:` placeholder — never empty and never a bare `#`.

- [ ] **Step 2: Run and confirm failure**

Run: `node scripts/browser-smoke.mjs`
Expected: FAIL — `.result-thumb` not found.

- [ ] **Step 3: Implement thumbnails**

Render results immediately with the placeholder as `src`. Then, **after first paint**, fetch offers for the visible result ids and swap in the first available vendor image. Never block the result list on this fetch; a slow or failing offers request must leave results fully usable.

- [ ] **Step 4: Run and confirm pass**

Run: `node scripts/browser-smoke.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/SearchBox.astro scripts/browser-smoke.mjs
git commit -m "feat(offers): progressive thumbnails in search results"
```

---

### Task 8: Browser coverage for the offers layer

The stubbed-Worker tests that prove degradation actually degrades.

**Files:**
- Modify: `scripts/browser-smoke.mjs`

**Interfaces:**
- Consumes: `PartImage`, `OfferList`, `placeholderSvg` from Tasks 5–6.
- Produces: assertions only. Every Worker response is stubbed with `page.route`; the suite must never touch a supplier network.

- [ ] **Step 1: Write the failing assertions**

- `/offers` returning deep links renders a card with an image and a product URL.
- `/offers` returning `isDeepLink: false` renders a visibly labelled search link and **no** price.
- **Review Focus 2**: an image whose URL resolves 403 swaps to the placeholder, and the page has no element whose `naturalWidth` is 0.
- **Review Focus 5**: `inStock: false` renders as marked unavailable.
- **Review Focus 3**: an offer with `price: null` renders no price element at all — assert absence, not a zero.
- **Degradation**: `page.route` aborting `/offers` entirely leaves the static vendor links present and logs no console error.
- Partial response: two of three vendors returned still lists all three.

- [ ] **Step 2: Run and confirm failures**

Run: `node scripts/browser-smoke.mjs`
Expected: FAIL on the assertions whose markup does not exist yet.

- [ ] **Step 3: Fix whatever fails** — markup or component — until all pass.

- [ ] **Step 4: Run the full gate**

Run: `npm run validate`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add scripts/browser-smoke.mjs
git commit -m "test(offers): browser coverage for deep links, fallbacks and degradation"
```

---

### Task 9: Documentation and CI

**Files:**
- Create: `workers/live/README.md`
- Modify: `README.md` at repo root (create if absent)
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: the whole feature. Produces: deploy instructions and an automated gate.

- [ ] **Step 1: Write `workers/live/README.md`**

The exact commands from spec §10 — `npx wrangler login`, `npx wrangler kv namespace create OFFERS`, pasting the id into `wrangler.toml`, `npx wrangler deploy` — plus a "verifying" section with the `curl` against `/offers?part=nema-17-stepper`. State plainly that the Worker must be deployed by the repository owner, since deployment needs their Cloudflare account.

- [ ] **Step 2: Update the root README** with a short "Live offers" section: what is fetched, which vendors, the 6-hour refresh, and the fact that prices are supplier-stated and unattributed to us.

- [ ] **Step 3: Create `.github/workflows/ci.yml`**

Triggers on push to `main` and on pull requests. Job matrix on Node 22. Steps: `npm ci`, `npx playwright install --with-deps chromium`, `npm run validate`.

The Playwright browser install step is required — `test:browser` will fail without it, which is a confusing failure if nobody knows why.

- [ ] **Step 4: Commit**

```bash
git add workers/live/README.md README.md .github/workflows/ci.yml
git commit -m "docs(offers): deployment guide and CI gate"
```

---

## Execution order note

Tasks 1–5 are independent of one another once Task 1 lands and can be parallelised. Task 6 depends on Task 5's `PartImage` and Task 1's `mergeOffers` home. Tasks 7 and 8 depend on Task 6. Task 9 depends on nothing and can run any time after the feature exists.

Tasks 2 and 3 can be skipped in favour of Task 4 only at the cost of the matching tests running against mocks instead of real payloads, which the spec explicitly rejects.

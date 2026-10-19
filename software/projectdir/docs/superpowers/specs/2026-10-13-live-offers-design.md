# Live Offers — Design Spec

**Date:** 2026-10-13
**Status:** Draft for review
**Extends:** `2026-10-13-robotics-parts-directory-design.md` (rev 5)
**Status of parent spec:** shipped phases 1–3; this covers the deferred phase 4

---

## 1. Problem

Two gaps in the shipped site, both reported from the deployed build:

1. **Parts have no pictures.** Search results and part pages render text only. There is no image field anywhere in the schema, so there is nothing to render.
2. **Links go to the wrong place.** Part pages link to each supplier's *homepage*. A user searching for an MG996R must click through and search again on the vendor's own site.

Both are the same root cause: the data model records *which* suppliers stock a part (`vendors: string[]` — slugs only) but stores no product-level URL and no image. The `Vendor.url` field is a storefront root.

This spec adds a live offer layer that resolves a canonical part to real product pages and real product images, fetched from supplier feeds.

---

## 2. Verified supplier landscape

Platform labels in `vendors.json` were **not trusted**. Each vendor was probed live. Results:

### Fetchable (9) — public product feed, includes images

| Vendor | Platform | Endpoint | Probe result |
|---|---|---|---|
| robocraze | Shopify | `/products.json` | 5 products, 5 with images |
| robodo | Shopify | `/products.json` | 5 products, 5 with images |
| rees52 | Shopify | `/products.json` | 5 products, 5 with images |
| quartz-components | Shopify | `/products.json` | 5 products, 5 with images |
| kitsguru | Shopify | `/products.json` | 5 products, 5 with images |
| makerbazar | Shopify | `/products.json` | 5 products, 5 with images |
| majestronicz | Shopify | `/products.json` | 5 products, 5 with images |
| zbotic | WooCommerce | `/wp-json/wc/store/v1/products` | 5 products, 5 with images |
| roboticsdna | WooCommerce | `/wp-json/wc/store/v1/products` | 5 products, 5 with images |

**Correction:** `robocraze` is recorded as `woocommerce` but responds as **Shopify**. At least one platform label is wrong. Platform is therefore auto-detected at index time (§5.1) rather than read from the data file.

### Not fetchable (6)

| Vendor | Recorded | Observed blocker |
|---|---|---|
| robu | woocommerce | Cloudflare interstitial — HTTP 403 `Just a moment…` |
| flyrobo | magento | 403 / non-JSON |
| robotechminds | woocommerce | 403 / non-JSON |
| robokits | magento | 403 / non-JSON |
| robogears | odoo | 403 / non-JSON |
| robolark | woocommerce | connection failure |

These keep their curated static entry and get the search-URL fallback (§7.2). Robu is the notable loss — it is a high-traffic supplier — but a Worker cannot solve a Cloudflare challenge, so this needs either a supplier-granted API key or hand-curated data. Out of scope here (§11).

---

## 3. Architecture

A Cloudflare Worker with KV, deployed from `workers/live/`, versioned in the same repository as the site.

```
┌─ Pages (static) ──────────┐        ┌─ Worker ───────────────────┐
│  client-side search       │  GET   │  /offers?part=<id>         │
│  (local index, unchanged) │───────▶│    └─ read KV  ─────────────┼──▶ KV
│  part pages               │        │                             │
└───────────────────────────┘        │  cron: every 6h             │
                                     │    for each fetchable vendor │
                                     │      1. fetch feed           │
                                     │      2. detect platform      │
                                     │      3. normalise products   │
                                     │      4. match to canonical   │
                                     │      5. write KV             │
                                     └─────────────────────────────┘
```

**Why cron-and-cache rather than fetch-on-request.** A robotics storefront carries 1,000–5,000 products. Fetching that per user would be slow and would hammer supplier servers on every page view. Matching ~18,000 products against 46 canonical parts is trivial offline, so it happens once per refresh.

**Requests are pure KV reads.** No upstream latency on the user's critical path, and supplier rate limits are respected by construction.

**The static site is unchanged as a floor.** Live data is an enrichment layer. If the Worker is down, unconfigured, or returns nothing, the site behaves exactly as it does today.

### 3.1 Placement

`workers/live/` inside this repository, sharing the canonical data and the search engine with the site.

Rationale: the matching logic must be identical on both sides, and it is already written and tested in `src/lib/similarity.ts` and `src/lib/identity.ts`. A separate repository would duplicate it and let the two drift.

Deployment root directory is set to `workers/live` in the Pages/Workers project settings.

---

## 4. Data contracts

### 4.1 `Offer` — the public response shape

```ts
type Offer = {
  vendorSlug: string;
  vendorName: string;
  url: string;              // deep product link, or vendor search fallback
  isDeepLink: boolean;      // true only when confidence >= DEEP_LINK_MIN
  image: string | null;     // vendor CDN URL, hotlinked
  title: string;            // vendor's own product title
  price: { amount: number; currency: string; formatted: string } | null;
  inStock: boolean | null;
  confidence: number;       // 0..1, 2 decimal places
};
```

`formatted` is produced by the Worker using the supplier's own currency symbol and separators, not reconstructed client-side.

### 4.2 Endpoint

```
GET /offers?part=<canonicalId>
200 → { part: string, fetchedAt: string, offers: Offer[] }
404 → { part: string, offers: [], reason: "unknown-part" }
```

- `part` must be a known canonical id; unknown ids return an empty array rather than an error, so a stale client never breaks.
- Maximum 60 suppliers per part, ordered by `confidence` descending, then by `trust` descending, then by name.
- Response carries `Cache-Control: public, max-age=300` and `ETag`.

### 4.3 KV layout

| Key | Value | TTL |
|---|---|---|
| `meta` | `{ schemaVersion, refreshedAt, vendorCount, productCount }` | none |
| `vendor:<slug>:status` | `{ ok, platform, productCount, fetchedAt, error }` | none |
| `part:<canonicalId>` | `Offer[]` | none (overwritten on each refresh) |

Keys are overwritten wholesale on refresh rather than individually expired, so a refresh is atomic from the reader's perspective. A vendor that fails one refresh retains its previous successful offers and is flagged `ok: false`, so a transient outage degrades freshness rather than deleting data.

---

## 5. Ingestion

### 5.1 Platform detection

Probed per vendor on every refresh, in order:

1. `GET /products.json?limit=1` → parses as JSON with a `products` array ⇒ **Shopify**
2. `GET /wp-json/wc/store/v1/products?per_page=1` → parses as a JSON array with a `permalink` field ⇒ **WooCommerce**
3. Otherwise ⇒ **unsupported**

Detection result is written to `vendor:<slug>:status`. It is never persisted back into `vendors.json` — that file stays hand-curated, and a platform label that drifts out of date should not become load-bearing.

### 5.2 Normalisation

Both platforms are mapped to one internal `RawProduct`:

| Field | Shopify source | WooCommerce source |
|---|---|---|
| `title` | `title` | `name` |
| `handle` | `handle` | `slug` |
| `permalink` | `https://{host}/products/{handle}` | `permalink` |
| `image` | `images[0].src` | `images[0].src` |
| `tagsText` | `tags` joined, plus `product_type` | `categories[].name`, `tags[].name` |
| `priceMinor` | `variants[0].price` (decimal) | `prices.price` (string) |
| `inStock` | `variants[0].available` | `is_in_stock` |

### 5.3 Price handling

**WooCommerce returns prices in minor units.** The response carries `prices.currency_minor_unit`; `"102660"` with `minor_unit: 2` is ₹1026.60. Every WooCommerce price is divided by `10 ** currency_minor_unit` before use. Failing to do this inflates every WooCommerce price by 100×.

Shopify prices are decimal strings in the shop's display currency and are parsed as-is. Currency is carried through from the feed; nothing is converted to INR.

A product with no variant price, or a non-numeric price, yields `price: null` rather than a fabricated zero.

### 5.4 Pagination

Both feeds page. Shopify uses `?page=N&limit=250`, WooCommerce uses `?page=N&per_page=100`.

Hard cap of **5,000 products per vendor per refresh**, with products ordered by recency where the API allows. A vendor exceeding the cap is flagged in `vendor:<slug>:status` with `truncated: true` so the limitation is visible rather than silent.

---

## 6. Matching

Reuses the existing, already-tested engine — no new matching logic.

```
normalise(title + tagsText)
  → best canonical candidate by max(
       trigramJaccard(normalised),
       tokenOverlap(normalised),
       aliasExact(normalised)
     )
  → apply digit-signature veto
```

The digit-signature veto already in `similarity.ts` is load-bearing here: `nema 17` must never match `nema 23`, regardless of string similarity.

### 6.1 Thresholds

| Confidence | Result |
|---|---|
| `>= 0.85` (`DEEP_LINK_MIN`) | Deep link to the exact product, with image |
| `0.60 – 0.85` (`SEARCH_ONLY_MIN`) | Vendor search URL; no deep link, no image |
| `< 0.60` | Not an offer for this part |

The asymmetry is deliberate: a wrong deep link sends a buyer to the wrong product, which is materially worse than sending them to the supplier's own search box with the part name filled in. When a match is close to the line, we decline to guess.

Thresholds live in one exported constant so they can be tuned against real false-match reports without hunting through the code.

### 6.2 Multiple products per vendor

A vendor may legitimately stock several variants of one canonical part (different lengths, voltage, kit contents). All passing `DEEP_LINK_MIN` are kept, capped at 5 per vendor per part, ordered by confidence then price ascending. Variants give the user a real choice rather than hiding alternatives.

---

## 7. Degradation

The site must never show a broken state. Four distinct fallbacks, in order of preference:

### 7.1 Worker unavailable or erroring
The client catches the failure and renders the existing static offer list — the vendor homepage links that ship today. No error banner; the page is simply the site as it exists now.

### 7.2 No offer for a supplier
When a part's live offers do not include a vendor that `parts.seed.json` claims stocks it, that vendor is still listed, with `isDeepLink: false` and a constructed search URL:

- Shopify: `https://{host}/search?q={query}`
- WooCommerce: `https://{host}/?s={query}&post_type=product`
- Unknown platform: `https://{host}`

The query is the canonical part name plus the part's most distinctive spec, slugified. This is the path taken by the 6 unfetchable vendors, and it is labelled in the UI as a search link rather than a product link.

**Ownership: the merge happens on the client.** The Worker returns only real, matched offers. The client already holds `parts.seed.json` and the vendor list at build time, so it is the component that knows which vendors are *missing* from the response and synthesises fallback entries for them.

The Worker does not emit fallback entries. Keeping them client-side means a partial or failed response degrades to the full static list rather than to a truncated one, and it keeps the search-URL construction — which depends on platform — out of the hot path.

### 7.3 Missing or broken image
Images are hotlinked from supplier CDNs with an `onerror` fallback to a generated placeholder (§8.2). A missing image never shows a broken-image glyph.

### 7.4 Stale data
The client reads `fetchedAt`. Beyond 48 hours it shows a discreet "live prices last updated <date>" note and keeps the data. It never silently presents a week-old price as current.

---

## 8. User interface

### 8.1 Search results
Each result shows a 56×56 thumbnail, part name, and supplier count. Images come from the first offer that has one, so results without any image fall back cleanly to the placeholder.

Search itself stays entirely client-side over the local index. It does **not** wait on the Worker. Offer imagery loads progressively after results are already readable.

### 8.2 Placeholder
A deterministic SVG generated per canonical part from its category and key specs, in the existing blueprint style. No per-part artwork is hand-authored; the generator takes the category and emits a schematic.

Used when a part has no offer image, when an image 404s, and in search results before offers arrive.

### 8.3 Part pages
Replace the flat "Visit \<vendor\>" list with offer cards:

- Product image (hotlinked, placeholder on error)
- Vendor name and city
- Live price when known, rendered as `₹1,026.60 as listed by Zbotic` — the supplier is always named as the source
- Stock state when known
- Deep link, or a search link clearly labelled "Search \<vendor\> for \<part\>"
- Confidence is not shown to users; it is an internal routing decision

### 8.4 Price honesty
Prices are always attributed. GST is **not** inferred or normalised in this phase — determining per-part applicable GST rate is not possible from a feed, and guessing would misstate tax. Display the vendor's figure verbatim, attributed, and leave normalisation to a later phase with real tax data.

---

## 9. Testing

### 9.1 Matching
Unit tests over **captured real feed fixtures**, committed under `workers/live/test/fixtures/`. Real responses, not hand-written mocks — mocks encode assumptions about field names that are exactly what is being verified.

Required cases:
- `NEMA 17 stepper motor` matches `nema-17-stepper` at or above threshold
- Alias `42bygh` resolves to the same canonical part
- `NEMA 23` never matches `nema-17-stepper` (digit veto)
- `MG995` never matches `MG996R` (digit veto)
- An unrelated product (`PETG filament`) yields no offer for a motor
- A product below `DEEP_LINK_MIN` but above `SEARCH_ONLY_MIN` produces a search URL and `isDeepLink: false`
- WooCommerce `102660` with `currency_minor_unit: 2` parses to `1026.60`

### 9.2 Ingestion
- Platform detection picks Shopify over WooCommerce when both respond
- A Cloudflare-challenge response is detected as unsupported and does not throw
- A vendor failing mid-refresh retains its previous offers
- The 5,000-product cap truncates and sets `truncated: true`

### 9.3 Browser
Extends `scripts/browser-smoke.mjs`:
- A part page with a stubbed `/offers` response renders an image and a deep link
- A stubbed response with `isDeepLink: false` renders a labelled search link
- A 404-ing image swaps to the placeholder via `onerror`
- A failed `/offers` request leaves the static vendor list intact and logs no console error

Browser tests stub the Worker via `page.route`. The test suite must not depend on live supplier networks — they are slow, rate-limited, and change without notice.

### 9.4 Non-negotiable
`npm run validate` stays green. The new checks join it: fixture matching tests, plus the browser assertions.

---

## 10. Deployment

Performed by the repository owner; the agent cannot authenticate to their Cloudflare account.

```bash
cd workers/live
npm install
npx wrangler login
npx wrangler kv namespace create OFFERS     # note the returned id
# paste the id into wrangler.toml
npx wrangler deploy
```

Then set the Worker URL on the site as a build-time variable, e.g. `PUBLIC_LIVE_API=https://projectdir-offers.<subdomain>.workers.dev`, and redeploy Pages.

Verify with `curl "https://<worker>/offers?part=nema-17-stepper"`.

**Cost:** Workers Free tier covers this comfortably — a refresh of 9 vendors every 6 hours is 36 upstream requests/day, and KV reads scale with page views.

---

## 11. Non-goals

Explicitly out of scope:

- Robu's blocked feed. Needs a supplier API key or hand-curated data; a Worker cannot defeat a Cloudflare challenge, and attempting to would be both futile and a hostile act.
- GST normalisation and price history.
- Worker-side search. The client-side search over the local index already works and stays.
- Any admin or editing UI. Data changes remain pull requests to JSON.
- Image caching in R2. Hotlinking was chosen for now; the placeholder fallback bounds the damage.
- Support for Magento, Odoo, and generic storefronts beyond the search fallback.
- Real-time freshness. Six hours is the refresh interval; the UI states when data was last fetched.

---

## 12. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Hotlinked images blocked by a supplier CDN | Broken images | Placeholder on `onerror`; assess R2 later |
| Platform drift — a vendor migrates or changes theme | Vendor silently drops out | Auto-detection each refresh; `vendor:<slug>:status` surfaces it |
| False positive match sends a buyer to the wrong part | Trust damage, the worst failure here | Conservative 0.85 threshold; decline to guess near the line |
| Feed shape changes mid-run | Parse failures | Fixtures catch drift at test time; failed vendor keeps prior offers |
| Supplier rate-limits or blocks Workers IPs | Partial coverage | Per-vendor status; search fallback keeps the page useful |
| Stale prices presented as current | Buyer over- or under-pays | `fetchedAt` surfaced in UI beyond 48h |
| Worker cost if traffic grows | Billing | Free tier is ample at current scale; revisit with Workers Paid |

---

## 13. Success criteria

1. Every canonical part page renders at least one image, either a real product photo or the placeholder.
2. At least one supplier per part offers a deep link to the exact product, for parts stocked by the 9 fetchable vendors.
3. A search URL is shown, correctly labelled, where no deep link exists.
4. No page shows a broken image, a dead link, or an unpriced zero.
5. With the Worker entirely unreachable, every page renders exactly as it does today.
6. `npm run validate` passes, including matching fixtures and browser assertions.

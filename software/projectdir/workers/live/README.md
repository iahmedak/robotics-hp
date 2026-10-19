# projectdir-offers — live offers Worker

Fetches real product listings from Indian robotics suppliers and serves them as
offers, so a visitor searching for a part gets a link to **that part on that
supplier's site** rather than to a storefront homepage.

The Worker is a **separate deployable** from the site. The static Astro site
works exactly as it does without it; this only enriches part pages.

---

## What it does

On a **6-hourly cron** (`17 */6 * * *`):

1. Detects each vendor's platform by probing `/products.json`, then the
   WooCommerce Store API.
2. Walks the whole feed, up to 5,000 products per vendor.
3. Normalises both platforms into one `RawProduct`.
4. Matches products to canonical parts, and writes offers to KV.

At runtime it serves one endpoint. It **never** calls a supplier during a
visitor's request — every response is a KV read.

```
GET /offers?part=<canonicalId>
```

## Which vendors work

Verified live, not assumed:

| Platform | Vendors |
|---|---|
| Shopify (`/products.json`) | robocraze, robodo, rees52, quartzcomponents, kitsguru, makerbazar, majestronicz |
| WooCommerce (`/wp-json/wc/store/v1/products`) | zbotic, roboticsdna |

**Not fetchable (6):** robu (Cloudflare challenge — a Worker cannot solve it),
flyrobo, robotechminds, robokits, robogears, robolark.

For those, the client falls back to a link into the vendor's own search with the
part name filled in, clearly labelled as a search rather than a product link.

## Deploying

You need your own Cloudflare account for this — the agent that wrote the code
cannot deploy on your behalf.

```bash
cd workers/live
npm install

npx wrangler login                        # authenticate
npx wrangler kv namespace create OFFERS   # prints a namespace id
```

Paste the returned id into `wrangler.toml`, replacing `REPLACE_ME`:

```toml
[[kv_namespaces]]
binding = "OFFERS"
id = "<the id you just got>"
```

Then:

```bash
npx wrangler deploy
```

### Point the site at it

The site needs the Worker's URL. In **Cloudflare Pages → Settings → Environment
variables** add:

| Variable | Value |
|---|---|
| `PUBLIC_LIVE_API` | `https://projectdir-offers.<your-subdomain>.workers.dev` |

Redeploy Pages. Without it the site is unchanged and every vendor shows as a
search link.

### Verify

```bash
curl "https://projectdir-offers.<your-subdomain>.workers.dev/offers?part=nema-17-stepper"
```

A populated `offers` array means the whole pipeline works. An empty array with
`"reason": "unknown-part"` means the cron has not completed its first run — give
it a few minutes.

To force a refresh without waiting for the cron:

```bash
npx wrangler triggers deploy   # from workers/live
```

## How matching works

A product is matched to a canonical part by normalised title plus tags, scored
against the part's name **and its aliases**, so `42BYGH` resolves to the NEMA 17
entry.

Two thresholds, deliberately asymmetric:

| Confidence | Result |
|---|---|
| `>= 0.85` | deep link to the exact product, with its image and price |
| `0.60 – 0.85` | too close to call → the client links to the vendor's search |
| `< 0.60` | not an offer for that part |

A wrong deep link sends a buyer to the wrong part, which is far worse than
sending them to a search box with the part name filled in. When a match sits
near the line, we decline to guess.

**The digit gate.** `NEMA 23` must never match the `NEMA 17` part. String
similarity alone scores that pair at 0.95, because they differ only in two
characters. So every digit the canonical name states must actually appear in the
product's **title** — tags are related-item metadata and are deliberately not
allowed to override the supplier's own claim.

## Two traps worth knowing

**WooCommerce prices are in minor units.** `"102660"` with
`currency_minor_unit: 2` is ₹1026.60. Skipping the divide inflates every
WooCommerce price 100×.

**Shopify sends no permalink and no currency.** The permalink is reconstructed
from the handle; 7 of the 9 fetchable vendors are Shopify, so most prices render
without a currency symbol rather than guessing INR.

## Development

```bash
npm run typecheck     # from workers/live
```

Worker sources are typechecked against `@cloudflare/workers-types` and are
**excluded** from the root `tsconfig.json`. The root extends Astro's strict
config and would otherwise check these files against DOM lib, where `KVNamespace`
and `ExecutionContext` do not exist.

`check:worker` runs as part of the root `npm run validate`.

## Keeping the fixtures honest

`workers/live/test/fixtures/` holds **real captured responses**, refreshed with:

```bash
node scripts/capture-fixtures.mjs
```

A diff there means a supplier changed their feed shape. CI reports it as a
notice rather than a failure, because a vendor changing their theme is their
right and not our regression — but a silent mis-parse in production is exactly
what the fixtures exist to prevent.
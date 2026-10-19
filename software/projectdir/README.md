# PROJECTdir

A community-maintained directory of Indian suppliers for robotics parts.

It answers one question well: **if you know the part you need, which Indian
suppliers stock it?** You get a shareable page per part listing every supplier
found, and you buy from them directly.

## What this is not

PROJECTdir is a **directory, not a store**. It handles no money, holds no
stock, takes no affiliate commission and runs no ads. Every outbound link is
plain and attributed. Prices, availability and specifications change constantly —
confirm on the supplier's own page before buying.

## Data

| File | Holds |
|---|---|
| `src/data/categories.json` | 27 part categories across 6 groups |
| `src/data/vendors.json` | 24 suppliers: legal entity, location, wholesale terms, search platform |
| `src/data/parts.seed.json` | 46 canonical parts, each with aliases so `nema17`, `NEMA 17` and `42BYGH` all resolve to one entry |

Every file is validated at build time. An unknown category, a supplier with no
stated purchasing constraint, or a broken vendor reference fails the build rather
than shipping.

### Correcting a listing

Open a pull request against the relevant JSON. Changes that fail validation are
rejected automatically.

## Live offers

Part pages can show **real product links and prices**, fetched from supplier
stores by a Cloudflare Worker and refreshed every 6 hours.

This is an **optional enrichment**. The site is fully functional without it: if
the Worker is unreachable, unconfigured or slow, every part page simply shows
the supplier list it always did. Nothing breaks, and nothing is hidden — a
supplier with no matchable product gets a link into that supplier's own search,
labelled as a search rather than passed off as the exact item.

See [`workers/live/README.md`](workers/live/README.md) for which vendors are
fetchable, how matching decides between a product link and a search link, and how
to deploy it.

Prices are always the supplier's own figure, attributed by name. GST is not
inferred. Prices older than 48 hours are labelled with their date rather than
presented as current.

## Local inventory

`/inventory` keeps a shortlist of what you want and what you own, stored **in
your browser only** — no account, no server, nothing sent anywhere. Up to 500
items, exportable to JSON and printable as a checklist.

## Accessibility

Target is WCAG 2.1 AA, and it is enforced rather than aspirational:

- Colour contrast is asserted from the design tokens in **both** themes
- The search box implements the full combobox keyboard contract
- Every interactive target is at least 44×44 CSS pixels
- 320px reflow with no horizontal scroll
- Light and dark themes are both first-class — neither is a compromise of the other

## Development

```bash
npm install
npm run dev
```

### Validation

```bash
npm run validate
```

runs, in order: typecheck, Astro check, Worker typecheck, unit tests, build, the
bundle leak check, and the browser suite.

The browser suite drives the built site in headless Chromium, so the browser
needs installing once:

```bash
npx playwright install chromium
```

| Script | What it checks |
|---|---|
| `npm run check` | TypeScript |
| `npm run check:astro` | `.astro` files |
| `npm run check:worker` | Worker sources, against Cloudflare's runtime types |
| `npm test` | Unit tests |
| `npm run build` | Production build |
| `npm run check:bundle` | No unresolvable imports in the built HTML |
| `npm run test:browser` | Real browser behaviour, including degradation paths |

`check:bundle` earns its keep. Astro's `define:vars` implies `is:inline`, so a
script using it is not bundled and its `import` statements land in the HTML
pointing at source paths that do not exist in `dist/`. The build still succeeds,
every unit test still passes, and the feature is simply dead in the browser.
That check fails the build if it ever happens again.
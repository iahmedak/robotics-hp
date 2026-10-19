# PROJECTdir — Foundation, Vendors, Local Search, Inventory

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps
> use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static Astro site where someone types a robotics part, sees every Indian vendor
that stocks it grouped into one listing, and clicks through to buy — with a browser-local
inventory for keeping track of what they want and own.

**Architecture:** Static Astro + Tailwind v4, no server. All search runs client-side over
two version-controlled JSON files (`vendors.json`, `parts.seed.json`). The federated
Worker proxy that queries vendors live is **phase 4 and out of this plan** — phases 1–3
must be fully useful without it.

**Tech Stack:** Astro 5, TypeScript `strict: true`, Tailwind v4 (CSS-first `@theme`),
Vitest, `@playwright/test` + `@axe-core/playwright`, Node 22+, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-13-robotics-parts-directory-design.md`

## Global Constraints

- **No runtime backend.** No API routes, no database, no server. Static output only.
- **WCAG 2.1 AA** is a build constraint: ≥4.5:1 body text, ≥3:1 large text and UI
  boundaries, both themes. Measured from tokens, asserted in CI.
- **Never pure `#ffffff` for page background (light) or `#000000` (dark).** Light uses
  warm paper, dark uses elevated charcoal. Both fixed in Task 1.
- **Never drop a data record silently.** Missing spec value, unknown GST basis, unmatched
  canonical part — all surfaced or excluded by an explicit rule, never by omission.
- **Never present a partial result set as complete.** If any vendor is omitted for any
  reason, the UI says so.
- **Outbound links** carry `rel="noopener noreferrer"` and are programmatically marked as
  external.
- **Text normalisation, tokenisation, similarity, identity and ranking are exactly as
  specified** in spec §7.1–§7.4. Do not re-derive them; they have pinned constants.
- No prices are fetched or displayed in this plan (no vendor data is fetched at all).
  §6.4 GST normalisation is phase 4.

## Review Focus

The five input classes the spec implies but no obvious task pins down. Each has a test
added in the named task.

1. **A query that matches nothing at all** (e.g. `zzqqxx`) — must show an explicit
   "no results" state with a route to suggest the part, never a blank grid. *(Task 9)*
2. **A query with no space, or mixed case, or a typo** (`nema17`, `NEMA 17`, `servo motr`)
   — must still match, via §7.1–§7.3. *(Task 4)*
3. **Keyboard-only use of the async search** — type, arrow into results, Enter to select,
   Escape to dismiss, and focus must land somewhere sensible throughout. *(Task 9)*
4. **`localStorage` unavailable or full** (private mode, 5MB quota hit) — inventory must
   degrade to a clear error message, never silently discard saved parts. *(Task 11)*
5. **A canonical part with zero matching vendor results** — must still render its detail
   page, not 404, because the permalink is meant to be shareable. *(Task 10)*

---

### Task 1: Project scaffold, design tokens, dual theme, skip link

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `astro.config.mjs`
- Create: `src/styles/tokens.css`, `src/styles/global.css`
- Create: `src/layouts/Base.astro`
- Create: `src/pages/index.astro`
- Test: `src/lib/__tests__/tokens.test.ts`

**Interfaces:**
- Produces: CSS custom properties `--pd-bg`, `--pd-surface`, `--pd-fg`, `--pd-fg-muted`,
  `--pd-accent`, `--pd-border`, `--pd-focus`, and the attribute selector
  `[data-theme="light|dark"]` on `<html>`. Every later task consumes these and hardcodes
  no colours.

- [ ] **Step 1: Scaffold and install**

Run: `pnpm create astro@latest . -- --template minimal --no-install --no-git` then
`pnpm add -D astro typescript vitest tailwindcss @tailwindcss/vitest @playwright/test
@axe-core/playwright` and `pnpm add @tailwindcss/vite`

Set `tsconfig.json` `"strict": true`. Configure `astro.config.mjs` with
`output: 'static'`, the `@tailwindcss/vite` plugin, and
`build: { format: 'directory' }`.

- [ ] **Step 2: Write the failing contrast test**

```ts
// src/lib/__tests__/tokens.test.ts
import { contrast } from 'vitest';
// contrast() implemented in this file per WCAG 2.1 relative-luminance formula.
// Assert, for BOTH themes:
//   contrast(fg, bg)        >= 4.5
//   contrast(fg-muted, bg)  >= 4.5
//   contrast(accent, bg)    >= 4.5
//   contrast(border, bg)    >= 3.0
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `pnpm vitest run src/lib/__tests__/tokens.test.ts`
Expected: FAIL — tokens not defined.

- [ ] **Step 4: Define the tokens**

`src/styles/tokens.css` sets these exact values. Do not substitute.

```css
:root, [data-theme="light"] {
  --pd-bg:       #f5f4ef;
  --pd-surface:  #fbfaf7;
  --pd-fg:       #1a1d24;
  --pd-fg-muted: #54585f;
  --pd-accent:   #1f4fa3;
  --pd-border:   #9a9da6;
  --pd-focus:    #1f4fa3;
}
[data-theme="dark"] {
  --pd-bg:       #14161a;
  --pd-surface:  #1c1f24;
  --pd-fg:       #e6e8ec;
  --pd-fg-muted: #a0a3ac;
  --pd-accent:   #78c8ff;
  --pd-border:   #5a5d66;
  --pd-focus:    #78c8ff;
}
```

Add a visible `:focus-visible` rule using `--pd-focus` and a 2px outline. **Never**
`outline: none` without a replacement.

- [ ] **Step 5: `Base.astro` with skip link and theme defaulting to system**

`<html data-theme="system">`. A pre-paint inline script in `<head>` reads
`localStorage.getItem('projectdir.theme')` and sets `data-theme` to `system|light|dark`
before paint. The first focusable element in the document is
`<a class="skip-link" href="#main">Skip to main content</a>`, visually hidden until focused,
then visible. `<main id="main">` exists.

- [ ] **Step 6: Run the test to verify it passes**

Run: `pnpm vitest run src/lib/__tests__/tokens.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: scaffold Astro site with AA-verified dual theme tokens"
```

---

### Task 2: Taxonomy data and schema validation

**Files:**
- Create: `src/data/categories.json`
- Create: `src/lib/schema.ts`
- Create: `src/lib/__tests__/categories.test.ts`

**Interfaces:**
- Produces: `export const CATEGORIES: Category[]` and
  `export function validateCategories(c: unknown): Result<Category[], string[]>`

```ts
export type Category = {
  id: string; label: string; group: string; order: number; specKeys: string[];
};
```

- [ ] **Step 1: Write the failing test**

```ts
// Asserts:
//  - exactly 26 categories across exactly 6 groups
//  - ids are unique, kebab-case
//  - every category has >=1 specKey
//  - validateCategories({}) returns errors, does not throw
```

- [ ] **Step 2: Run — expect FAIL** (`pnpm vitest run src/lib/__tests__/categories.test.ts`)

- [ ] **Step 3: Create `categories.json`**

Transcribe all 26 rows of spec §6.1 **verbatim** — same ids, labels, groups, order values
and specKeys. The groups are `actuation`(7), `transmission`(5), `sensing`(5), `control`(3),
`power`(2), `structure`(4). Do not add, remove or rename categories.

- [ ] **Step 4: Implement `validateCategories`** — returns `{ ok, data, errors }`; collects
  all errors rather than throwing on the first.

- [ ] **Step 5: Run — expect PASS**

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add 26-category taxonomy with schema validation"
```

---

### Task 3: Vendor data and schema validation

**Files:**
- Create: `src/data/vendors.json`
- Modify: `src/lib/schema.ts`
- Test: `src/lib/__tests__/vendors.test.ts`

**Interfaces:**
- Produces: `export const VENDORS: Vendor[]`,
  `export function validateVendors(v: unknown, cats: Category[]): Result<Vendor[], string[]>`

```ts
export type Vendor = {
  slug: string; name: string; legalEntity: string; url: string; city: string;
  state: string;
  audiences: ('hobbyist'|'student'|'integrator')[];
  categories: string[];
  shipsPanIndia: boolean;
  blurb: string;
  verified: string;                    // ISO date
  wholesale: { mode: 'none'|'bulk-pricing'|'procurement';
               moqInr: number|null; moqQty: number|null };
  search: { enabled: boolean; platform: string; tier: number };
};
```

- [ ] **Step 1: Write the failing test**

```ts
// Asserts:
//  - 24 vendors, unique slugs
//  - every vendors[].categories value exists in CATEGORIES
//  - url starts with https://
//  - verified matches /^\d{4}-\d{2}-\d{2}$/
//  - wholesale.mode === 'procurement' implies moqInr !== null || moqQty !== null
//  - search.tier === 0 implies search.enabled === false   // "not searchable" vendors
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Create `vendors.json` with all 24 vendors**

From spec Appendix A. Every row: `legalEntity` — use the company name from Appendix A where
known (e.g. Robokits → "Dazzle Robotics Pvt. Ltd.", ElectroPi → "Circuit Pulse Pvt Ltd",
RoboGears → "RoboGears Pvt. Ltd."), otherwise the brand name. `search.tier`: 1 for
shopify/woocommerce/magento, 2 for `generic`, 0 for `dcrobo.in`.

Set `wholesale.mode`: `procurement` for robocraze (moqInr 50000, moqQty 100) and roboroot;
`bulk-pricing` for robu; `none` elsewhere. All others `search.tier` from Appendix A.

**Exclusions that must hold:** `store.zenix.lk` is absent (Sri Lanka).
`electropi.ai` is absent (unrelated consultancy). Only `electropi.in`.

- [ ] **Step 4: Implement `validateVendors`**, including the category-existence check
  against `CATEGORIES`.

- [ ] **Step 5: Run — expect PASS**

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add 24 verified Indian vendors with eligibility validation"
```

---

### Task 4: Normalisation, tokenisation, similarity

**Files:**
- Create: `src/lib/normalize.ts`, `src/lib/tokenize.ts`, `src/lib/similarity.ts`
- Test: `src/lib/__tests__/normalize.test.ts`, `.../tokenize.test.ts`,
  `.../similarity.test.ts`

**Interfaces:**
- Produces:
  - `export function normalize(s: string): string`
  - `export function tokenize(s: string): string[]`
  - `export function trigrams(s: string): string[]`      // multiset of contiguous 3-grams
  - `export function trigramJaccard(a: string, b: string): number`
  - `export function similarity(a: string, b: string): number`

- [ ] **Step 1: Write the failing tests**

Assert the spec §7.1–§7.3 constants exactly, including these cases:

```ts
expect(normalize("NEMA 17 Stepper (42BYGH)")).toBe("nema 17 stepper 42bygh");
expect(normalize(normalize(x))).toBe(normalize(x));          // idempotent, property test
expect(tokenize("motors")).toEqual(["motor"]);
expect(tokenize("CAN bus")).toEqual(["can", "bus"]);         // 'bus' is protected
expect(similarity("a","a")).toBe(1);
expect(trigramJaccard("", "")).toBe(1);                     // define, do not NaN
```

Generate 500 random strings for the idempotence property (Vitest `it.each` or a loop).

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `normalize`** — NFKC, lowercase, strip combining diacritics, every
  char outside `[a-z0-9.]` → space, collapse whitespace, trim. Exactly §7.1, five steps.

- [ ] **Step 4: Implement `tokenize`** — split on space, drop the stopword list
  (`for of the with and pack pcs piece free shipping sale`), strip a trailing `s` from
  tokens longer than 3 chars **unless** in the protected list
  (`bus gas lens ss abs rs232 rs485 can pwm fgps gps ips bms esc usb pins nuts bolts rails guides`).

- [ ] **Step 5: Implement `similarity`** — first-match ladder per §7.3:
  exact `1.00`; trigram Jaccard ≥ 0.72 → `0.85`; token-set containment → `0.80`; token
  overlap ≥ 0.60 → that ratio; else `0`. Assert the ladder order is honoured (an exact match
  returns 1.00 even when Jaccard is lower).

- [ ] **Step 6: Run — expect PASS**

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add normalize, tokenize and similarity per spec 7.1-7.3"
```

---

### Task 5: Canonical identity and ranking

**Files:**
- Create: `src/lib/identity.ts`, `src/lib/rank.ts`
- Test: `src/lib/__tests__/identity.test.ts`, `.../rank.test.ts`

**Interfaces:**
- Consumes: `similarity` from Task 4
- Produces:
  - `export function identity(resultName: string, canonical: CanonicalPart): number`
  - `export function groupResults(results: SearchResult[], parts: CanonicalPart[]):
     GroupedListing[]`
  - `export function rank(a: SearchResult, b: SearchResult, query: string): number`

```ts
export type CanonicalPart = {
  id: string; canonicalName: string; aliases: string[]; category: string;
  specs: Record<string, string|number>; vendors: string[];
};
export type SearchResult = {
  partId: string | null; name: string; vendor: string; category: string;
  specs: Record<string, string|number>; url: string;
};
export type GroupedListing = {
  canonical: CanonicalPart | null;   // null === ungrouped, MUST still be rendered
  results: SearchResult[];          // ordered trust -> freshness -> relevance
};
```

- [ ] **Step 1: Write the failing tests**

```ts
// identity: nameSim + catBonus(0.15 if category matches) + specBonus(0.10 if >=2 shared
//          key AND identical normalised value).  Assert max attainable is 1.25.
// grouping: identity >= 0.80 groups; < 0.80 lands in an ungrouped listing that is
//          STILL PRESENT in the output (assert output length === input length grouping-wise).
// ranking:  trust tier1=1.00 > tier2=0.90 > tier3=0.70; freshness <5min=1.00,
//          5-15min=0.90, near-cache=0.50.
//          Assert score = 0.60*relevance + 0.25*trust + 0.15*freshness exactly.
//          Assert sort is a total order (no two distinct results tie without a
//          deterministic tiebreak on vendor slug).
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `identity`** — max over `{canonicalName} ∪ aliases` of
  `similarity(normalize(resultName), normalize(s))`, plus the two bonuses, per §7.3.

- [ ] **Step 4: Implement `groupResults`** — assign to the highest-scoring canonical ≥ 0.80;
  otherwise `canonical: null`. Never drop. Within a group sort by trust, then freshness,
  then relevance, then vendor slug.

- [ ] **Step 5: Implement `rank`** — the exact weighted formula.

- [ ] **Step 6: Run — expect PASS**

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add canonical identity grouping and weighted ranking"
```

---

### Task 6: Canonical parts seed

**Files:**
- Create: `src/data/parts.seed.json`
- Test: `src/lib/__tests__/seed.test.ts`

**Interfaces:**
- Produces: `export const SEED_PARTS: CanonicalPart[]`

- [ ] **Step 1: Write the failing test**

```ts
// Asserts:
//  - every one of the 26 CATEGORIES ids appears in >=1 seed part   (category floor)
//  - ids unique, aliases non-empty
//  - every vendors[] value exists in VENDORS
//  - serialised JSON.stringify(SEED_PARTS).length <= 150 * 1024   (spec 6.8 budget)
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Write the seed**

Two-part construction, ~45 entries:

**From cross-vendor stocking frequency** (parts seen at 3+ of the 24 vendors in Appendix A):
`nema-17-stepper` (42BYGH / 42HS40 / JK42HS40-1704), `mg995-servo`, `sg90-servo`,
`mg90s-servo`, `mg996r-servo`, `28byj48-stepper` (+ ULN2003), `bo-gear-motor`,
`n20-gear-motor`, `l298n-driver`, `608zz-bearing`, `688zz-bearing`, `ds3218-servo`,
`ft5330m-servo`, `mecanum-wheel`, `4wd-chassis-kit`, `esp32-devboard`, `arduino-uno-r3`,
`raspberry-pi`, `hc-sr04-ultrasonic`, `mpu6050-imu`, `lipo-battery`, `sg90-bracket`,
`shaft-coupler`.

**Category floor** — add one minimal entry for each category not already covered:
`gearbox-planetary`, `bldc-motor`, `linear-actuator`, `pneumatic-cylinder`, `spur-gear`,
`gt2-belt`, `lead-screw-8mm`, `incremental-encoder`, `force-torque-sensor`,
`limit-switch`, `lidar-module`, `plc-io-module`, `smps-24v`, `aluminium-profile-2020`,
`linear-rail-mgn12`, `m3-screw-set`.

Each entry: realistic `aliases` covering the real-world spellings a person would type
(including the no-space forms), the §6.1 category id, the most useful 2–4 specs, and the
vendor slugs observed stocking it.

**Kits and assemblies count as canonical parts** — `4wd-chassis-kit` and
`servos` cover the beginner searches. A category with stocked products must not render
empty.

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: seed 45 canonical parts with full category coverage"
```

---

### Task 7: Layout, navigation, footer

**Files:**
- Create: `src/components/Header.astro`, `src/components/Footer.astro`,
  `src/components/ThemeToggle.astro`
- Modify: `src/layouts/Base.astro`, `src/pages/index.astro`

**Interfaces:**
- Consumes: tokens from Task 1, `VENDORS` from Task 3
- Produces: `<Header />` renders nav landmarks; `ThemeToggle` writes
  `localStorage['projectdir.theme']` with value `'system'|'light'|'dark'`.

- [ ] **Step 1: Write the a11y test** (Playwright)

```ts
// page.goto('/'); expect(page.locator('main')).toHaveCount(1);
// expect(page.getByRole('navigation')).toHaveCount(1);
// expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
// skip link is first focusable and becomes visible on focus
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Build Header** — `<header>` + `<nav>` with `aria-label="Primary"`. Links:
  Home, Suppliers. One `<h1>` on the page, not in the nav.

- [ ] **Step 4: Build `ThemeToggle`** — three real `<button>`s (System / Light / Dark)
  in a `role="group"` labelled "Colour theme", each with `aria-pressed`. On click write to
  `localStorage` and set `document.documentElement.dataset.theme`.

- [ ] **Step 5: Build Footer** — states plainly: not affiliated with any vendor, no
  affiliate links, no ads.

- [ ] **Step 6: Run — expect PASS**

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add layout, navigation and theme toggle"
```

---

### Task 8: Supplier directory with category filter

**Files:**
- Create: `src/pages/suppliers.astro`, `src/components/CategoryFilter.astro`,
  `src/components/VendorCard.astro`
- Test: `tests/e2e/suppliers.spec.ts`

**Interfaces:**
- Consumes: `VENDORS`, `CATEGORIES`
- Produces: `CategoryFilter` emits multi-select chips; selecting 2+ categories
  **intersects** (spec §2, keydir behaviour).

- [ ] **Step 1: Write the failing e2e test**

```ts
// - all 24 vendors render
// - each chip is a <button aria-pressed="false"> initially
// - selecting 'servos' + 'bearings' leaves only vendors stocking BOTH
// - selecting one chip leaves every vendor carrying it
// - "Clear all" restores 24
// - keyboard: Tab reaches every chip, Space toggles aria-pressed
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Build `CategoryFilter`** — chips from `CATEGORIES`, each
  `<button aria-pressed>`. Intersection semantics, not union. Result count in a
  `<p aria-live="polite">`: `"N suppliers match"`, debounced 300ms.

- [ ] **Step 4: Build `VendorCard`** — `<article>`, heading is the vendor name, city/state,
  audience tags, wholesale badge when `mode !== 'none'`. The outbound link text is
  `"Visit <name> — external link"` with `rel="noopener noreferrer"`.

- [ ] **Step 5: Handle the not-searchable vendor** — `dcrobo.in` has `tier: 0` and must
  render a clear "No online catalogue — visit in person" state instead of a broken search
  affordance.

- [ ] **Step 6: Run — expect PASS**

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: add supplier directory with intersecting category filter"
```

---

### Task 9: Search combobox

**Files:**
- Create: `src/components/SearchCombobox.astro`, `src/lib/search.ts`
- Test: `tests/e2e/search.spec.ts`, `src/lib/__tests__/search.test.ts`

**Interfaces:**
- Consumes: `SEED_PARTS`, `VENDORS`, and all of Tasks 4–5
- Produces: `export function search(query: string, parts: CanonicalPart[],
  results: SearchResult[]): GroupedListing[]`

- [ ] **Step 1: Write the failing unit test**

```ts
// search('nema17')      -> includes the nema-17-stepper group
// search('NEMA 17')     -> same group        (case + space normalisation)
// search('servo motr')  -> same group as 'servo motor'   (typo tolerance)
// search('zzqqxx')       -> [] and the caller renders the empty state
// empty query           -> all parts, capped at 50
// never returns a part with zero matching results in canonical:null form being dropped
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `search`** — exact/token match first via `similarity`; on weak
  exact results fall back to trigram. Cap at 50. No network call anywhere in this file.

- [ ] **Step 4: Write the failing e2e test** — APG combobox contract:

```ts
// input has role=combobox, aria-expanded, aria-controls, aria-autocomplete="list"
// ArrowDown from input moves focus into the listbox (aria-activedescendant)
// Enter selects the active option and focus returns to the input
// Escape closes the listbox and keeps focus in the input
// result count region has aria-live=polite and is NOT re-announced per keystroke
// focus is never stolen when results update
```

- [ ] **Step 5: Run — expect FAIL**

- [ ] **Step 6: Build `SearchCombobox`** — debounce 250ms before running `search`. Region
  marked `aria-busy` during the search. Debounce the live-region announcement to 500ms.

- [ ] **Step 7: Build the empty state** — for Review Focus #1: explicit
  "No parts match <query>" with a route to the suggest form. Never a blank container.

- [ ] **Step 8: Run — expect PASS**

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: add accessible search combobox with local typo tolerance"
```

---

### Task 10: Grouped listing and permalink pages

**Files:**
- Create: `src/components/ResultList.astro`, `src/components/PartResult.astro`,
  `src/pages/part/[id].astro`, `src/pages/part/[id].astro` getStaticPaths from SEED_PARTS
- Test: `tests/e2e/part-page.spec.ts`

**Interfaces:**
- Consumes: `search`, `groupResults`, `SEED_PARTS`
- Produces: `/part/[id]` static page per canonical part

- [ ] **Step 1: Write the failing e2e test**

```ts
// /part/nema-17-stepper renders 200, contains an <h1> with the canonical name
// every outbound link has rel="noopener noreferrer" and text containing 'external link'
// a canonical part with zero vendor results still renders 200   <-- Review Focus #5
// an unknown id returns 404
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Build `ResultList`** — one row per `GroupedListing`. Ungrouped listings
  render identically to grouped ones, minus the group heading. Within a group, seller rows
  ordered trust → freshness → relevance (price absent in this phase).

- [ ] **Step 4: Build `/part/[id]`** — canonical name as `<h1>`, aliases and specs shown,
  seller list, and a "Suggest a supplier for this part" link.

- [ ] **Step 5: Run — expect PASS**

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add grouped result listing and shareable part permalinks"
```

---

### Task 11: Browser-local inventory

**Files:**
- Create: `src/lib/inventory.ts`, `src/components/SaveButton.astro`,
  `src/pages/inventory.astro`
- Test: `src/lib/__tests__/inventory.test.ts`, `tests/e2e/inventory.spec.ts`

**Interfaces:**
- Produces:
  - `export const INVENTORY_KEY = 'projectdir.inventory.v1'`
  - `export type InventoryRecord = {
      partId: string; name: string; category: string;
      status: 'wanted'|'owned'; qty: number; notes: string;
      suggestedVendor: string|null; url: string|null;
      addedAt: string; updatedAt: string; }`
  - `export function loadInventory(): InventoryRecord[]`
  - `export function saveInventory(r: InventoryRecord[]): { ok: true } | { ok: false;
    reason: 'unavailable'|'quota'|'too-many'; count: number }`
  - `export const MAX_RECORDS = 500`

**No prices are stored** — the record shape has no price field, by design.

- [ ] **Step 1: Write the failing unit test**

```ts
// saveInventory refuses and returns reason 'too-many' at 501 records, WITHOUT mutating
//   what is already in localStorage        <-- Review Focus #4
// saveInventory catches QuotaExceededError -> reason 'quota'
// loadInventory returns [] when localStorage is absent or throws -> reason path
// records never contain a price-like key
```

- [ ] **Step 2: Run — expect FAIL**

- [ ] **Step 3: Implement `inventory.ts`** — read `localStorage[INVENTORY_KEY]`, parse with
  `try/catch`, return `[]` on any failure. `saveInventory` returns a discriminated result
  and **never throws**. Writes are atomic: write once, and if the write throws, the previous
  value is untouched.

- [ ] **Step 4: Write the failing e2e test**

```ts
// SaveButton has aria-pressed, accessible name contains the part name
// clicking saves; clicking again removes; aria-pressed flips
// inventory count in the nav updates
// /inventory renders a print-clean checklist (@media print hides chrome)
// clear-all requires an explicit confirmation step
```

- [ ] **Step 5: Run — expect FAIL**

- [ ] **Step 6: Build `SaveButton`**, **`/inventory`** — table with `<th scope>`, qty input,
  notes textarea, wanted/owned toggle, export JSON download, import file-picker, clear-all
  behind confirmation. Privacy statement: data is browser-local, never transmitted.

- [ ] **Step 7: Run — expect PASS**

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat: add browser-local inventory with wanted/owned tracking"
```

---

### Task 12: CI gates

**Files:**
- Create: `.github/workflows/validate.yml`, `tests/a11y/axe.spec.ts`,
  `tests/perf/budget.spec.ts`
- Modify: `package.json` (scripts)

**Interfaces:**
- Produces: `pnpm run validate` — the single CI entry point.

- [ ] **Step 1: Write the failing a11y test**

```ts
// Run axe-core on '/', '/suppliers', '/inventory' and every /part/[id]
// both themes (set data-theme before load)
// assert zero violations of ANY rule
```

- [ ] **Step 2: Run — expect FAIL** (violations exist)

- [ ] **Step 3: Fix violations until zero** — do not suppress. If a violation is genuinely
  unreachable, document it inline with the reason.

- [ ] **Step 4: Write the perf test**

```ts
// assert serialised parts.seed.json + vendors.json total <= 150 KB  (spec 6.8)
// assert largest JS bundle <= 120 KB gzipped
```

- [ ] **Step 5: Wire the workflow** — runs `pnpm run validate` = typecheck + vitest +
  playwright + axe + budget. Fails the build.

- [ ] **Step 6: Run the full suite — expect PASS**

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "ci: gate on types, tests, axe-core and payload budget"
```

---

## Out of Scope — next plans

Not built here. Each becomes its own spec-derived plan:

1. **Phase 4 — Cloudflare Worker.** `/api/search`, KV, fan-out, partial results, timeout and
   truncation, tier-1 platform adapters (Shopify / WooCommerce / Magento / Odoo).
2. **Phase 5 — Tiers 2–3.** HTML extraction config, Scrapling pre-warm off the request path.
3. **Phase 4b — §6.4 price comparison.** GST basis normalisation, `priceComparable`, the
   regression test that asserts the `unknown` case.
4. **Phase 6 — Wholesale.** `/bulk/` page, `bulk-pricing` facet, BOM CSV export.
5. **Phase 7 — Self-service.** Submit form, claim/verify, vendor feeds.
6. **§6.8 growth + instrumentation.** Proposal queue, promotion bar, search-with-zero-results
   telemetry, moderator handover trigger.
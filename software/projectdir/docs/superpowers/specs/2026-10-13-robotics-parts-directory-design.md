# India Robotics Parts Directory — Design Spec

Date: 2026-10-13
Status: Draft for review (rev 5 — search-core corrections found by test)
Project name: PROJECTdir

---

## 1. Problem and intent

Finding robotics parts in India is frustrating. You know the part you need — a 24V BLDC
with an encoder, a NEMA 17, a 608ZZ bearing, a CAN-bus servo — but you don't know which
Indian vendor stocks it, or whether it's in stock, or whether what you read is current.
You end up opening a dozen shopfronts and re-typing the same search, every time.

**This project exists to remove that friction.** Success is narrow and personal:
someone types the part once, sees which Indian vendors actually stock it, and reaches a
purchase page — without opening more than one vendor site.

Secondary goal, inherited from the keydir.in reference: a community-maintained, ad-free,
affiliate-free directory other people can contribute to.

### Non-goals

- No checkout, cart, payments, or order handling. The site never handles money.
- No affiliate links. Outbound links are plain and attributed.
- Not a global directory. India only, at launch.

---

## 2. Reference and what we take from it

Modeled on keydir.in: community-maintained supplier directory, category filters, live
search, contributor workflow, no ads.

| keydir | PROJECTdir |
| --- | --- |
| Directory of vendors | Directory of vendors **plus live federated parts search** |
| Vendor name + categories | Real part results across every vendor, queried on demand |
| Single dark terminal theme | Blueprint light + dark, both WCAG AA |
| Data entered by hand | Live vendor search, cached and revalidated |

---

## 3. Design direction

**Visual:** technical blueprint light. Paper-white surfaces, ink-blue linework, drafting
annotations, serif display headings with monospace utility labels. Reads as a datasheet you
browse rather than marketing you scroll. Highest legibility for the dense results this
site is built around.

**Not** the green terminal aesthetic. Rejected deliberately: fatiguing at length, poor on
dense tables, reads as novelty rather than engineering to the audience this serves.

**Both themes ship.** A significant share of visitors work in dark environments; a
light-only site is an accessibility regression, not a preference.

---

## 4. Accessibility contract

Accessibility is a build constraint, not a polish pass. Acceptance is defined here and
verified in CI (§12).

1. **Contrast** — WCAG 2.1 AA: ≥ 4.5:1 body, ≥ 3:1 large text and UI boundaries. Measured
   from design tokens. Both themes.
2. **Keyboard** — every interactive element reachable and operable. Skip link to main
   content. Focus always visible; `outline: none` banned unless replaced by an equally
   visible indicator. Logical focus order. No keyboard traps in search, results, mobile
   menu, or any dialog.
3. **Async results** — this is the most accessibility-sensitive surface in the product:
   results arrive from a network call *after* the user has typed. Therefore:
   - The combobox follows the APG pattern: `role="combobox"`, `aria-expanded`,
     `aria-controls`, associated listbox, arrow-key navigation, Enter to select, Escape to
     dismiss, Home/End.
   - Result count changes announced via a polite `aria-live` region, **debounced 500ms**
     so it does not fire per keystroke.
   - Region marked `aria-busy` while a fetch is in flight.
   - **Focus is never stolen.** Results update in place; focus stays in the input unless
     the user has arrowed into the listbox.
   - Every result is a real `<a>` whose accessible name is
     `"<part name> — sold by <vendor>, external link"`.
   - Loading shows a skeleton with `aria-busy`, never a bare spinner.
4. **Semantics** — `nav` / `main` / `article` / `footer` landmarks, one `h1` per page, no
   skipped heading levels, real `<button>` and `<a>` over clickable divs.
5. **Zoom and reflow** — usable at 200% zoom and 320px width without horizontal scrolling.
6. **Touch targets** — ≥ 44×44px.
7. **Motion** — `prefers-reduced-motion` honoured; animated stat counters resolve
   immediately to their final value.
8. **Outbound links** — visually and programmatically marked as leaving the site.

---

## 5. Architecture

```
robotics-parts-directory/
├─ src/                        # Astro — static site
│  ├─ data/
│  │  ├─ vendors.json          # suppliers + search adapter config (§6.2)
│  │  ├─ categories.json       # taxonomy (§6.1)
│  │  └─ parts.seed.json       # canonical parts + aliases (§6.7)
│  ├─ components/              # SearchCombobox, ResultList, PartResult,
│  │                           # VendorCard, FacetPanel, StatRow,
│  │                           # ThemeToggle, SkipLink, SkeletonRow
│  └─ layouts/  pages/  styles/
├─ worker/                     # Cloudflare Worker — TypeScript (the proxy)
│  ├─ search.ts                # /api/search orchestrator (§8.2)
│  ├─ normalize.ts             # text normalisation (§7.1)
│  ├─ identity.ts              # canonical part matching (§7.3)
│  ├─ rank.ts                  # result scoring (§7.4)
│  ├─ cache.ts                 # KV + Cache API (§8.3)
│  ├─ errors.ts                # error taxonomy (§7.5)
│  ├─ adapters/                # per-platform fetchers (§7.6)
│  └─ vendors.ts               # registry, loaded from KV at §8.1
├─ scraper/                    # Python — Tier 3 only, off the request path
│  ├─ adapters/  normalize.py  fixtures/
└─ .github/workflows/
   ├─ prewarm.yml              # Tier 3 pre-warm
   └─ validate.yml             # schema + a11y gates on every PR
```

**Three tiers, deliberately separated.** The site is static. The Worker is the only thing
on the request path. Python exists only for vendors unreachable any other way, and runs
off the request path.

---

## 6. Data model

### 6.1 Taxonomy

Six groups, twenty-seven leaf categories. This list is version-controlled; changing it
requires a migration, because `specKeys` are persisted in results.

| Group | Category id | Label | Spec keys |
| --- | --- | --- | --- |
| **actuation** | `servos` | Servos | torqueNm, voltage, interface, formFactor, feedback |
| | `gearmotors` | Gearmotors | torqueNm, rpm, voltage, gearboxRatio, encoder |
| | `stepper-motors` | Stepper Motors | frame, holdingTorqueNm, stepAngleDeg, shaftDiaMm, current |
| | `dc-motors` | DC Motors | rpm, voltage, torqueNm, shaftDiaMm |
| | `bldc-motors` | BLDC Motors | kv, voltage, torqueNm, encoder, current |
| | `linear-actuators` | Linear Actuators | strokeMm, forceN, voltage, speed |
| | `pneumatic` | Pneumatic | boreMm, pressureBar, strokeMm |
| **transmission** | `bearings` | Bearings | innerDiaMm, outerDiaMm, widthMm, type |
| | `gears` | Gears | teeth, module, boreDiaMm, material |
| | `gearboxes` | Gearboxes | ratio, maxTorqueNm, outputShaftDiaMm, backlashDeg |
| | `belts-couplings` | Belts & Couplings | profile, lengthMm, boreDiaMm |
| | `lead-screws` | Lead Screws | leadMm, lengthMm, shaftDiaMm |
| **sensing** | `encoders` | Encoders | resolution, shaftDiaMm, outputType, voltage |
| | `force-torque` | Force / Torque | range, interface, voltage |
| | `proximity-limits` | Proximity & Limits | type, rangeMm, outputType, voltage |
| | `imus` | IMUs | dof, interface, rateHz |
| | `cameras-lidar` | Cameras & Lidar | resolution, fps, rangeM, interface |
| | `sensors` | Sensor Modules | type, rangeMm, outputType, voltage, interface |
| **control** | `microcontrollers` | Microcontrollers | core, clockMhz, pins, interface |
| | `motor-drives` | Motor Drives | voltage, current, protocol, feedback |
| | `plc-io` | PLC & IO | channels, voltage, protocol |
| **power** | `power-supplies` | Power Supplies | wattage, inputVac, outputDc |
| | `batteries` | Batteries | chemistry, cells, voltage, capacityAh |
| **structure** | `aluminium-profile` | Aluminium Profile | size, lengthMm, slot |
| | `linear-guides` | Linear Guides | railSize, lengthMm, loadRating |
| | `fasteners` | Fasteners | thread, lengthMm, material, grade |
| | `brackets-plates` | Brackets & Plates | material, dimensions, thicknessMm |

Category count in the UI reflects the live count in this table, not a hard-coded constant.

### 6.2 vendors.json

```json
{
  "slug": "example-components",
  "name": "Example Components Pvt Ltd",
  "url": "https://example.in",
  "city": "Chennai",
  "state": "Tamil Nadu",
  "audiences": ["hobbyist", "student", "integrator"],
  "categories": ["servos", "gearmotors"],
  "shipsPanIndia": true,
  "blurb": "Distributor of industrial motion components.",
  "verified": "2026-10-01",
  "wholesale": {
    "mode": "bulk-pricing",
    "moqInr": null,
    "moqQty": null,
    "quoteFlow": null,
    "leadTimeNote": null,
    "gstInvoice": true,
    "institutionalKits": false
  },
  "search": {
    "enabled": true,
    "tier": 1,
    "platform": "shopify",
    "searchUrlTemplate": "https://example.in/search/suggest.json?q={query}&resources[type]=product",
    "extract": null
  }
}
```

**`wholesale.mode` is a three-value enum, and the distinction is load-bearing:**

| Mode | Meaning | Where it surfaces |
| --- | --- | --- |
| `none` | No wholesale programme | — |
| `bulk-pricing` | Same storefront, discount at quantity. RoboU's BOM tool. | **Badge + facet in the main directory.** Keydir-style. |
| `procurement` | Separate counterparty and funnel. MOQ in rupees, quote-based, often account-managed. RoboCraze, RoboRoot. | **Badge + facet in the main directory, *and* the `/bulk/` page.** |

**A `procurement` vendor is never hidden from normal search, and its MOQ is never hidden
either.** RoboCraze has a real storefront with real servos; excluding it would be wrong.
But surfacing it in a "servo" search *without* the ₹50,000 MOQ would be actively
misleading — someone adds one to a mental shortlist and discovers at checkout that they
cannot buy one. So `moqInr` renders inline on the offer in search results, not only on
`/bulk/`. This is the same rule as "never present a partial result set as complete": a
result missing its purchasing constraint is quietly wrong.

**Vendor eligibility.** A vendor is listed if and only if all five hold:

1. Registered in India, or ships from a warehouse in India.
2. Operates its own storefront with a working product catalogue (a working search is
   strongly preferred but not strictly required — a tier 2 or 3 adapter may qualify).
3. Serves pan-India, or states its regional limits explicitly on the listing.
4. Reachable: no authentication wall, no geo-block on India.
5. Has consented to being listed, and has not set `search.enabled: false`.

**Explicitly excluded:** marketplace-only resellers (Amazon, Flipkart, Robokits-on-Marketplace
listings). These get a separate, clearly-labelled "also available on marketplaces"
note on the vendor page, never a first-class search result — because marketplace listing
data is the least trustworthy and most volatile source, and mixing it in would poison the
index. The human partner explicitly requested this exclusion.

### 6.3 Listing model — one part, every seller

A result is **not** a product row. It is a *part* with one or more *seller offers*. This is
the Flash.co / Amazon comparison model the human partner asked for, and it is also the only
model that works with federated search: results from different vendors are grouped into a
single listing rather than shown as a flat list of near-duplicates.

```
GroupedListing
├─ canonical part identity (from §7.3 — may be ungrouped/unknown)
├─ bestSellerUrl          # the highest-trust offer, used as the permalink target
└─ offers[]
   ├─ vendor, url, priceInr?, priceBasis?, inStock?, restockExpected?, trust, freshness
   └─ sortable by: trust → freshness → price (price last: cheapest is not best)
```

**Permalinks.** Every grouped listing gets a stable `/part/[id]` page. Results link to
that page, not straight out to a vendor. This gives: a shareable URL for a specific part, a
place to attach community notes later, and one place to state "3 of 8 sellers checked in
the last 15 minutes". The *act of purchasing* still happens on the vendor's site, which is
where the money, the stock guarantee, and the returns policy actually live.

**Price ordering is deliberately last.** Cheapest-first is what makes comparison sites
annoying and untrustworthy — it rewards vendors who win on price alone and quietly buries
the one that actually has it in stock.

### 6.4 Price comparison and GST basis

Prices are shown. But they are **not directly comparable as scraped**, because Indian
vendors quote them inconsistently. Verified from research on 2026-10-13:

| Vendor | How it quotes |
| --- | --- |
| RoboticsDNA | Dual price: `₹692.00 (Inc. GST)` **and** `₹586.44 (+18% GST Extra)` |
| Robolark | `₹420 incl. GST` |
| Roboway | `₹162.00 (Excluding 18% GST)` |
| Quartz | `Rs. 251.00 Unit price / per` — basis unstated |

**A vendor quoting ex-GST appears ~18% cheaper when it is not.** Ranking on the raw number
produces confidently wrong output. So:

```json
"priceInr": 692.00,
"priceBasis": "inclusive",          // inclusive | exclusive | unknown
"priceGstRate": 0.18,
"priceComparable": 692.00           // normalised, see below
```

**Normalisation rule.**

```
priceComparable = priceBasis == "exclusive" ? priceInr × (1 + priceGstRate) : priceInr
priceBasis == "unknown"  → priceComparable = null  (never guessed)
```

Three behaviours follow, all mandatory:

- **Ordering and price deltas use `priceComparable`, never `priceInr`.**
- **`unknown` basis never contributes to price ordering.** It is still displayed, visibly
  marked "GST basis not stated". An unknown is not an assumption.
- **The basis is shown in the UI**, per offer. A user comparing two prices deserves to know
  one is ex-GST.

**Dual-price vendors.** Where both prices are published (RoboticsDNA), prefer the
GST-inclusive figure and record `priceBasis: "inclusive"`. Never present the lower
ex-GST number as the price — it is not the amount payable.

**This is the single most likely way the site misleads someone**, which makes it exactly
the kind of quiet wrongness the project exists to eliminate. It gets a dedicated
regression test (§12).

### 6.5 Personal inventory (browser-local)

A personal parts tracker. **Entirely client-side. No account, no server, no sync.** Nothing
in it ever leaves the browser.

Two states per part, because people need both lists:

- `wanted` — bookmarked to buy later
- `owned` — in the parts bin, with quantity and notes

```json
{
  "partId": "nema-17-42bygh",
  "name": "NEMA 17 Stepper Motor",
  "category": "stepper-motors",
  "status": "owned",
  "qty": 4,
  "notes": "2 for the CNC Z axis, 2 spare",
  "suggestedVendor": "robokits",
  "url": "https://robokits.co.in/…",
  "addedAt": "2026-10-13",
  "updatedAt": "2026-10-13"
}
```

**Storage.** `localStorage`, key `projectdir.inventory.v1`, plain JSON.

- Chosen over IndexedDB deliberately: at ~200 bytes/record, a 200-part inventory is ~40KB
  — three orders of magnitude inside the 5–10MB quota, and inspectable without tooling.
  IndexedDB is async and would add a failure mode for no benefit at this size.
- **Quota guard.** On write, catch `QuotaExceededError`. If the inventory exceeds 500
  records, refuse the write and tell the user to export and prune — never silently evict.
  Silently dropping someone's parts bin is unforgivable.
- **Never stores prices.** Prices are live and volatile; a price saved in March is worse
  than no price. Only identity, quantity, notes, and a link.

**Export / import / clear.** A JSON download, a file-picker import, and a clear-all behind
an explicit confirmation. Without export, clearing site data destroys real work — a
quantity list someone assembled over months. The inventory page also renders a
**print-clean checklist**, because the actual use case is standing at a counter with a list.

**Accessibility.** The save control is a toggle with `aria-pressed` and an accessible name
including the part name ("Save NEMA 17 Stepper Motor to inventory"). The inventory count in
the nav is announced. Status changes confirm via the polite live region.

**Privacy.** Stated plainly in the UI: this data is in your browser only, we never receive
it, clearing site data removes it. Export first.

### 6.6 Wholesale, bulk, and the BOM bridge

Bulk is two different markets wearing one name, and conflating them breaks search.

**The split.**

| | Bulk discount | Institutional procurement |
| --- | --- | --- |
| Example | Robu BOM tool | RoboCraze, RoboRoot |
| Seller | The storefront | A sales rep |
| Funnel | Search → cart | Search → quote request → reply |
| MOQ | None | ₹50,000 / 100+ qty (RoboCraze) |
| Surface | Badge + facet | Badge + facet **and** `/bulk/` page |

`audiences` (hobbyist / student / integrator) stays a plain facet, because an integrator
buying a ₹93,000 MyActuator is still searching for a part and buying it from the vendor's
site. Only the *transaction* differing is what earns a separate page.

**`/bulk/` page.** Reached from primary navigation. Two sections:

1. **Bulk pricing on normal orders** — vendors with `bulk-pricing`. Discount tiers, how to
   trigger them.
2. **Wholesale and procurement partners** — vendors with `procurement`. MOQ, lead time,
   quote flow, GST invoicing, whether they build institutional kit bundles, direct contact.

Each vendor row carries: legal entity, MOQ, quote flow, lead time, contact, and the
platform's trust/freshness state so a reader can see when the data was last confirmed.
Print styles are first-class here — people print MOQ comparisons and circulate them
internally.

**The BOM bridge — what makes `/bulk/` functional rather than a table of numbers.**

A `/bulk/` page with no path to action is a dead end. The path is already built: the §6.5
inventory. Export it as a Bill of Materials CSV and send that to a procurement vendor.

```
partId,name,category,qty,specs,lastKnownVendor,productUrl
nema-17-42bygh,NEMA 17 Stepper Motor,stepper-motors,4,"frame=NEMA 17; torque=1.4Nm",robokits,https://…
```

Rules, all of which are load-bearing:

- **No prices.** Same rule as §6.5. A stale price in a BOM makes the vendor's quote wrong
  before it is even sent, and it destroys the recipient's trust in every other line.
- **No vendor lock.** `lastKnownVendor` is a hint from where *you* last bought it, not a
  claim about who should supply it. Procurement vendors routinely beat a hobbyist price.
- **Column order is fixed and RFC 4180 quoting is mandatory** — `specs` contains commas and
  semicolons and will silently corrupt a naive CSV join.
- Export is generated client-side from local storage. The BOM never leaves the browser
  except by the user opening it and sending it themselves.

**Accessibility.** `/bulk/` uses standard content semantics; the MOQ comparison is a real
`<table>` with `<th scope>` so it is navigable by screen reader and sortable by assistive
tech. The export control is a real `<button>` with an accessible name naming the action
and the row count ("Export bill of materials CSV, 12 line items"). Export announces
success via the polite live region.

**First-party flag.** Robu runs first-party stock *and* a "Sell On Robu" marketplace. Offers
carry `firstParty: true|false`. Only first-party offers feed the comparison view and the
BOM's `lastKnownVendor`; third-party listings are shown separately and never ranked as if
they were the vendor's own stock.

### 6.7 parts.seed.json

```json
{
  "id": "nema-17-42bygh",
  "canonicalName": "NEMA 17 Stepper Motor",
  "aliases": ["nema17", "nema 17", "42bygh", "stepper motor 42", "nema17 stepper"],
  "category": "stepper-motors",
  "specs": { "frame": "NEMA 17", "holdingTorqueNm": 1.4, "stepAngleDeg": 1.8 },
  "vendors": ["robokits", "robootechminds"]
}
```

The seed has exactly two jobs:

1. **Cold start** — the very first search is never empty.
2. **Canonical identity** — teaching the matcher that "42BYGH", "NEMA 17" and "stepper
   motor 42" are one part, so results from different vendors group as one part with
   several sellers.

It is **not** an inventory. It is never exhaustive, and completeness is never its goal.
Growth is automatic — see §6.8.

### 6.8 Automatic canonical-part growth

When a query returns results but no canonical part matches at or above the §7.3 grouping
threshold (0.80), the system has just learned something: **the index has a gap.** Automatic
growth closes that gap without a human in the loop, for now.

**The safety boundary, stated once: the system may ADD canonical parts automatically. It may
never MODIFY an existing one.**

This is not a technicality. §7.3 weights aliases at 0.85 — the second-highest term in the
whole similarity function. A badly-chosen alias permanently misgroups every future query
that touches it, for every user, with no signal that anything is wrong. Adding a *new*
entry can only affect its own cluster; changing an existing one silently re-partitions
results people already saw. The asymmetry justifies the asymmetry in permission.

**The pipeline.**

```
query → no canonical match ≥0.80
  → build a Proposal:
       { proposedName, aliases[], category, confidence,
         evidenceUrls[], searchCount, firstSeen, lastSeen }
  → dedupe against pending Proposals AND live parts (§7.1–7.3)
  → append to pending queue. Nothing is written to parts.seed.json.
  → promotion, only when the bar below is cleared
```

**Promote on demand, not on first sighting.** A proposal is promoted to a live canonical
part when **both** hold:

1. `searchCount ≥ 5` — the gap has been hit repeatedly, so it is real and not one typo.
2. `evidenceUrls ≥ 2` — at least two distinct product URLs consistently back the cluster,
   so it is a part and not a single mis-parsed listing.

Threshold 5 is a starting value, to be tuned against observed search telemetry, not a
constant of nature.

**Deduplication is mandatory.** Proposals are merged using §7.1–7.3 before insertion.
Without this, `nema17` and `42bygh` arriving from two different queries become two
canonical parts for the same thing — and then `NEMA 17` fuzzy-matches both and the grouping
the whole design depends on quietly stops working.

**Hard bounds.**

- **No unbounded growth.** Every auto-added entry must attach to a category from §6.1. A
  proposal that cannot be categorised is held, not promoted. Free-text categories would
  fragment the taxonomy.
- **Audit trail.** Auto-promotions are recorded with their evidence URLs and search counts,
  and committed with a structured message naming the trigger query. If an entry turns out to
  be wrong, it is a revert, and the commit message says which query caused it.
- **Client payload budget.** `parts.seed.json` ships to the browser (§5). Automatic growth
  makes it grow without bound, which would silently violate the §12 performance budget. If
  the seed exceeds **150 KB serialised**, it stops being shipped whole: the client receives
  a category-scoped subset and full lookup moves behind a Worker endpoint. This threshold is
  a defined limit, not an aspiration.

**The handover to community moderators.** "Once it scales" needs to be measurable rather
than felt. The trigger, proposed:

> Sustained **> 50 pending proposals per week for 4 consecutive weeks** → introduce
> community moderation. Below that rate the promotion bar is doing the work and human
> review is a bottleneck, not a safeguard.

Until then, the human partner reviews promotions manually. The distinction that matters:
**promotion** (adding a new entry) becomes community-serviced; **merging or amending an
existing entry** stays restricted for the foreseeable future, because that is the operation
that can silently break grouping for existing users.

---

## 7. Definitions and decision rules

Every threshold, formula and procedure used anywhere in the system. Nothing below is
subjective; all of it is directly testable.

### 7.1 Text normalisation

Applied identically in the Worker, the client, and tests. Pure function `normalize(s)`.

1. Unicode NFKC.
2. Lowercase.
3. Strip combining diacritics (NFD first, so the marks exist as separate code points).
4. **Split letter↔digit boundaries into separate tokens** — `[a-z][0-9]` → `$1 $2` and
   `[0-9][a-z]` → `$1 $2`.
5. Replace any character not in `[a-z0-9.]` with a space.
6. Collapse runs of whitespace to a single space; trim.

**Revision (2026-10-13).** Step 4 did not exist in the original draft. Without it
`nema17` and `nema 17` are different strings, and the most-typed query in the catalogue
misses the part entirely — measured trigram overlap was 0.31, far below threshold. The split
also canonicalises `mg995`→`mg 995`, `sg90`→`sg 90`, `608zz`→`608 zz`, `24v`→`24 v`. Because
query and document pass through the same function the canonical form is irrelevant to
matching; it only has to be consistent.

Consequence worth knowing: model codes that fuse digits and letters (`42bygh` → `42 bygh`,
`M3` → `m 3`) normalise to a split form. This is harmless for matching and is not displayed.

`"NEMA 17 Stepper (42BYGH)"` → `"nema 17 stepper 42 bygh"`
`"B.L.D.C. 24V"` → `"b.l.d.c. 24 v"`

### 7.2 Tokenisation

`tokenize(s)` = `normalize(s).split(" ")`, then:

- Drop stopwords: `for, of, the, with, and, pack, pcs, piece, free, shipping, sale`
- Strip a trailing `s` from any token longer than 3 characters, **except** tokens in a
  protected list where the plural is part of the term: `bus, gas, lens, ss, abs, rs232,
  rs485, can, pwm, fgps, gps, ips, bms, esc, usb, pins, nuts, bolts, rails, guides`

`"motors"` → `motor`; `"bus"` → `bus`; `"robotics"` → `robotic`

Note `"robotics"` → `"robotic"` reads oddly but is safe: both sides of a comparison pass
through the same strip, so it broadens matching rather than breaking it.

### 7.3 Canonical part matching (grouping across vendors)

Given a live result `R` and canonical part `C`, compute `identity(R, C)`:

```
nameSim   = max over s in ({C.canonicalName} ∪ C.aliases) of similarity(normalize(R.name), normalize(s))
catBonus  = 0.15 if R.category == C.category else 0
specBonus = 0.10 if at least 2 of R.specs share the same key AND the same normalised value as C.specs
             else 0
identity  = nameSim + catBonus + specBonus
```

**`similarity(a, b)`**, first match in this ladder:

| # | Condition | Value |
| --- | --- | --- |
| 1 | `a == b` after normalisation | 1.00 |
| 2 | trigram Jaccard(`a`, `b`) ≥ 0.72 | 0.85 |
| 3 | token set of `a` ⊆ token set of `b`, or vice versa | 0.80 |
| 4 | `typoRatio(a, b)` ≥ 0.80 | 0.80 |
| 5 | token overlap = \|A∩B\| / \|A∪B\| ≥ 0.60 | that ratio |
| 6 | otherwise | 0 |

**trigram Jaccard.** Pad the normalised string with one space on each side, take all
contiguous 3-character substrings into a multiset, return `\|A∩B\| / \|A∪B\|`. **The union is
the sum of `max` per key, not the sum of both sides.** Summing both double-counts shared
grams and makes two identical strings score 0.5 — a real bug, caught in testing.

**`typoRatio(a, b)`.** `1 − levenshtein(a,b) / max(len)`, **vetoed to 0 whenever the digit
signatures of `a` and `b` differ.**

Both halves of that are corrections to the original draft, and both were found by tests
rather than by reading:

- *Why it was added.* Trigram Jaccard at 0.72 cannot catch a single-character typo on a short
  string: measured, `servo motor` vs `servo motr` scores 0.62 even with the union bug fixed,
  and `nema17` vs `nema 17` scored 0.44. The stated goal of this section — "typо tolerance is
  precisely the frustration being removed" — was not met by the stated constant.
- *Why the digit veto.* Plain edit distance is dangerously permissive for catalogue parts:
  `nema 17` vs `nema 23` scores 0.875 and would group two different frame sizes as one part.
  Digits carry the identity of a part, so a differing digit signature returns 0 regardless of
  how similar the remaining characters are. `mg 995` vs `mg 996` is likewise 0.

**Grouping rule.** `R` is grouped into `C` when `identity(R, C) ≥ 0.80`. If several `C`
qualify, the highest `identity` wins. **If no `C` qualifies, `R` is shown as an
ungrouped standalone result — never dropped.** Dropping unmatched results would silently
hide parts we simply have not seen before, which is the worst possible failure for a
search tool.

**Model codes are an alias problem, not a string-similarity problem.** No metric can know
that `42bygh` is a NEMA 17. That mapping lives in the canonical part's alias list, and a
query for `42bygh` matches at 1.00 by exact alias hit.

### 7.4 Result ranking

```
score = 0.60 × relevance + 0.25 × trust + 0.15 × freshness
```

- **`relevance`** ∈ [0,1] = `similarity(normalize(query), normalize(R.name))` if that
  yields a match; otherwise the token-overlap ratio of query tokens against
  `R.name ∪ R.aliases ∪ R.category ∪ vendor name`. Always defined, never null.
- **`trust`** — `1.00` tier 1 (native JSON API), `0.90` tier 2 (parsed HTML),
  `0.70` tier 3 (Scrapling pre-warmed). Rationale: a structured first-party API response
  is more reliable than a page parse, which is more reliable than a stealthed browser
  render.
- **`freshness`** — `1.00` if the underlying data is < 5 min old; `0.90` if 5–15 min;
  `0.50` if served from near-cache (stale-while-revalidate).

Within a group of results matching the same canonical part, they are ordered by `trust`
then `freshness` then `relevance`. Relevance is already equal by construction inside a
group, so it must not dominate the ordering of sellers.

### 7.5 Error taxonomy

Every vendor attempt resolves to exactly one state. This distinction matters: a vendor
that genuinely stocks nothing is **not** an error.

| State | Condition | Effect on response |
| --- | --- | --- |
| `ok` | Response received and parsed, ≥1 product | Results included |
| `no_results` | Response received, parsed, 0 products | Omitted **silently** — correct behaviour, not a fault |
| `timeout` | Exceeded 2500ms per-vendor budget | Omitted; counted in `partial` |
| `blocked` | HTTP 403/429, or a bot-challenge page detected | Omitted; counted in `partial`; vendor flagged for review |
| `error` | 5xx, malformed body, or unparseable JSON | Omitted; counted in `partial` |

**Flapping alert.** A vendor raises an alert when it records `timeout` or `error` on **3
consecutive runs**. `no_results` never contributes. `blocked` alerts immediately on
first occurrence, because it usually means something changed that a human needs to see.

### 7.6 Fetch tier assignment

Determined by a probe, not by judgement. Run on vendor onboarding and re-runnable:

```
probe(vendor):
  1. GET searchUrlTemplate with a known-good probe query ("servo")
  2. If 2xx and body parses as JSON containing ≥1 product-like key → tier 1
  3. Else GET the vendor's HTML search page for the same query
     - if it contains JSON-LD @type ItemList, or a recognised embedded state
       blob → tier 2
  4. Else → tier 3, and create a Python adapter
```

Tier is stored in `vendors.json` and **may be overridden by hand**. A downgrade
(1 → 3) is surfaced in the vendor record, because it means the vendor's site changed
and the listing is at risk.

### 7.7 Extraction config (tiers 2 and 3)

Per-vendor mapping. Tiers 1 and 2 use CSS selectors; tier 3 uses the same config in
Python so the two paths cannot drift.

```json
"extract": {
  "container": "li.product-item",
  "fields": {
    "name":     { "css": ".product-title", "transform": "text" },
    "priceInr": { "css": ".price",        "transform": "intFromText", "unit": "INR" },
    "url":      { "css": "a.link",        "transform": "attr:href",    "absolute": true },
    "inStock":  { "css": ".stock",        "transform": "stockFlag" },
    "restockExpected": { "css": ".restock",  "transform": "restockWindow" },
    "specs":    { "css": ".spec-row",     "transform": "specPairs" }
  },
  "specKeyMap": { "Torque": "torqueNm", "RPM": "rpm", "Frame": "frame" }
}
```

`specKeyMap` maps vendor-specific labels to taxonomy spec keys from §6.1. An unmapped
label is **dropped, not guessed** — a wrong spec value is worse than an absent one,
because a wrong value is trusted.

Available transforms: `text`, `intFromText`, `floatFromText`, `attr:<name>`,
`stockFlag`, `restockWindow`, `specPairs`. Exactly these seven. Adding one is a schema
change.

**`restockWindow`** was added after observing FlyRobo, which publishes
`"Out of Stock (Restock: 16-09-2026 to 20-09-2026)"` as a first-class field. A vendor
telling you *when* the part is back is the single most useful thing a parts directory
can surface for an out-of-stock item, and it must survive normalisation rather than being
discarded as noise. Returns `{ from, to }` ISO dates, or `null`.

### 7.8 Platform adapters — verified against real vendors

Research on 2026-10-13 confirmed the platform mix is real and machine-detectable. Platform
adapters handle the majority of Indian vendors before any per-vendor CSS is needed.

| Platform | Detection | Search endpoint | Stock signal | Seen on |
| --- | --- | --- | --- | --- |
| **Shopify** | `cdn.shopify.com` in source, or `/products.json` responds | `/search/suggest.json?q={query}&resources[type]=product` | `available: true/false`; `Notify me` ⇒ notify-only, not out-of-stock | majestronicz.in, robodo.in, rees52.com, kitsguru.com, quartzcomponents.com |
| **WooCommerce** | `/wp-json/wc/v3/products` responds, or `wp-content` in asset paths | see quirk below | `stock_status: instock`; "Out of Stock" text | zbotic.in, roboticsdna.in, robolark.com, robocraze.com, robotechminds.com, **robu.in** |
| **Magento** | `/rest/V1/products` responds, or `Product Compare` + layered nav present | `/rest/V1/products?searchCriteria[filter_groups][0][filters][0][value]=%25{query}%25` | `stock_item.status_codes`; **restock date strings** | robokits.co.in, **flyrobo.in** |
| **Odoo** | `Powered by Odoo` in footer | `/shop/search?q={query}` | `availability` on variant | **robogears.in** |
| **Generic HTML** | none of the above | page URL + CSS from §7.7 | per-vendor | roboway.in, robocomp.in, **electropi.in** (pending probe) |
| **Not searchable** | — | — | — | dcrobo.in (WhatsApp-only, "launching soon") |

**WooCommerce search quirk — Robu.** Robu's plain `?s=<query>` returns *blog* results, not
products, and several queries silently return "Showing 0 of 0". Product search requires
`?post_type=product&s=<query>&product_cat=0`. A naive adapter pointed at `?s=` will look
like it works and return empty forever. This is the clearest argument for keeping stored
response fixtures per vendor (§12): the bug is invisible without them.

**Restock dates are a first-class field, not noise.** FlyRobo publishes restock windows.
Anything parsing an out-of-stock state must check for a restock string before concluding
the part is simply unavailable, and surface the window.

**Detection is a probe, not an assumption.** The §7.6 probe runs the platform checks in
order and records which one won, so a vendor that migrates platforms shows up as a tier
change rather than silently returning nothing.

---

## 8. Federated search mechanics

### 8.1 Why there is a proxy

Vendor storefronts set CORS headers. A browser cannot call them directly. Aggregating
vendor searches therefore requires a server-side proxy. This is the only non-static
component.

`vendors.json` is **not** bundled into the Worker. It is uploaded to KV by a CI step on
every merge, read by the Worker at request time, and cached in the Worker isolate for
300s. A vendor can therefore be added, removed, or disabled without a deploy.

### 8.2 The request path

```
GET /api/search?q=<query>&cat=&vendor=

1. normalise query (§7.1). If empty → return seed results only, `partial:false`.
2. cache front layer (Cache API, 60s) keyed on full request URL. Hit → return.
3. select vendors: search.enabled AND (no category filter OR intersects vendor.categories)
4. for each selected vendor, in parallel, concurrency 6:
     a. KV lookup key `q:<sha256(normalise(query))>:<slug>:v<schemaVersion>`
        - hit, age < 15min          → ok, freshness 1.00
        - hit, age 5–15min          → ok, freshness 0.90
        - hit, age > 15min          → near-cache, freshness 0.50, schedule refresh
        - miss                      → live fetch (§7.6), timeout 2500ms
5. global budget 3000ms. At expiry, all unresolved vendors are abandoned and counted
   in `partial`.
6. classify each outcome (§7.5).
7. merge → group by canonical part (§7.3) → rank (§7.4) → top 50.
8. write fresh results back to KV at TTL 900s.
9. respond:
   { results, meta: { requested, responded, partial, cachedAt, slowestVendorMs } }
```

### 8.3 Limits — exact values

| Limit | Value |
| --- | --- |
| Per-vendor fetch timeout | 2500 ms |
| Global request budget | 3000 ms |
| Concurrency | 6 in-flight vendor fetches |
| Max vendors queried per request | 24 |
| Per-host concurrent requests | 1 |
| Per-host minimum gap between requests | 500 ms |
| KV TTL | 900 s |
| Cache API front-layer TTL | 60 s |
| Near-cache maximum age before a result is dropped entirely | 24 h |
| Max results returned | 50 |
| Client debounce before calling the Worker | 250 ms |

A query whose vendors exceed 24 is deterministically truncated by
`sorted(slug).slice(0, 24)` so the same query always queries the same vendors. Results
for the remainder are served from cache only, and `meta.truncated` is set true.

### 8.4 Scraping conduct

`robots.txt` respected per host. Rate-limited and sequential per host with the 500ms gap
and crawl-delay from §8.3. The crawler identifies itself in its user agent. Any vendor may
opt out via `search.enabled: false` at any time and that is respected without discussion.
Vendors who want to be listed but not searched are a normal, supported case.

---

## 9. Search behaviour

**Client.** Local search over `parts.seed.json` and the last response renders instantly.
The Worker call refines it. The user never waits on a spinner to see something.

**Shareable state.** Query and filters serialise to the URL (`?q=&cat=&vendor=`).

**Degraded mode.** If the Worker is unreachable, the client falls back to seed search and
states plainly that live search is unavailable. It never presents an empty page as a real
answer.

---

## 10. Theming

Three states: `system / light / dark`, default `system`, persisted in `localStorage`,
applied pre-paint to avoid a flash.

- **Light** — warm paper (`#f5f4ef` family). Never pure `#fff`; pure white on a bright
  display is a glare source.
- **Dark** — elevated charcoal (`#14161a` family). Never pure `#000`; reduces halation
  bloom on OLED.
- **Accent** — ink blue in light, a separately verified AA blue in dark. Every token pair
  contrast-checked.
- `color-scheme` set per theme so scrollbars, form controls, and caret match.

---

## 11. Edge states

| Situation | Behaviour |
| --- | --- |
| Some vendors fail | Partial results, labelled in the UI: "8 of 12 suppliers responded" |
| All vendors fail | Seed results plus "live search unavailable — showing curated matches" |
| Zero results | Explain which filters excluded what, offer one-click removal, route to "suggest this part" |
| A result matches no canonical part | Shown as an ungrouped standalone result. **Never dropped.** |
| Vendor `blocked` | Omitted, counted, and the vendor record is flagged for review |
| `meta.truncated` | Stated in the UI: "showing 24 of 31 suppliers" |
| Worker down | Seed search, visibly degraded state |
| Image unavailable | Typographic placeholder, never a broken-image icon |
| Cache entry > 24h | Dropped entirely. Never served. |
| Vendor has `wholesale.mode: procurement` | MOQ renders inline on the offer. Never suppressed. |
| Procurement vendor missing MOQ | **Unlistable.** Fails schema validation; cannot reach the site. |
| Offer is `firstParty: false` | Shown, but segregated and never ranked as the vendor's own stock |
| Inventory empty at BOM export | Disabled control with an explanatory message, not an empty CSV download |
| Inventory over 500 records | Write refused; prompt to export and prune |

**Never** present a partial, truncated, or degraded result set as if it were complete.

---

## 12. Testing

- **Worker unit** — `normalize`, `tokenize`, `similarity`, trigram Jaccard, `identity`,
  `rank`, merge/dedupe, per-vendor isolation, partial-result construction, deterministic
  truncation.
- **Cache** — TTL enforcement at each boundary, stale-while-revalidate path, near-cache
  fallback, 24h hard drop.
- **Property tests** — the properties below are asserted, not examples:
  - `normalize` is idempotent: `normalize(normalize(s)) == normalize(s)`
  - `similarity(s, s) == 1.00` for all `s`
  - `identity` never exceeds 1.25 (1.00 + both bonuses)
  - ranking is a total order: no two distinct results in the same group tie on
    `(trust, freshness, relevance)` without a deterministic tiebreak on vendor slug
- **Contract fixtures** — each adapter tested against stored real responses. A platform
  change that breaks parsing fails loudly instead of silently emptying a vendor.
- **Accessibility** — axe-core, zero violations, every page, both themes. Playwright
  keyboard walkthrough of the async path specifically: type → results arrive → arrow into
  listbox → select → focus correct → Escape dismisses without losing focus. Contrast
  asserted directly from tokens.
- **Latency** — local-first paint budget and Worker p95 asserted in CI.
- **Fan-out etiquette** — tests assert the per-host cap and the 500ms gap. These are
  correctness properties, not politeness.
- **Price comparison** — the §6.4 normalisation is asserted against the real observed
  quote styles: `inclusive` stays unchanged; `exclusive` multiplies by 1.18; `unknown`
  yields `priceComparable: null` and **must not** influence price ordering. A regression here
  silently understates ex-GST vendors by 18% while looking correct, so this test asserts the
  *null* case as hard as the numeric ones.
- **Canonical-part growth** — a proposal below the promotion bar never reaches
  `parts.seed.json`; one above it does; proposals for the same part arriving separately are
  merged, not duplicated; no auto-modification of an existing entry is possible (asserted by
  the absence of any code path that writes to a live entry); every promoted entry carries
  evidence URLs and a category.
- **Seed payload budget** — a CI check fails if `parts.seed.json` exceeds 150 KB
  serialised, before the §6.8 budget rule becomes a live degradation.
- **Wholesale and BOM**
  - `wholesale.mode` enum validated; `procurement` requires `moqInr` or `moqQty` to be set.
    A procurement vendor with no MOQ is unlistable, because we would not know whether to
    show the constraint.
  - `moqInr` renders inline on the offer in normal search results. Regression test asserts
    this, because hiding it is the specific failure that misleads a buyer.
  - **BOM CSV**: fixed column order asserted; RFC 4180 quoting asserted against a fixture
    whose `specs` field contains commas, quotes and semicolons. A naive join corrupts this
    silently and the corruption lands in a real quote request.
  - **BOM CSV contains no price column.** Asserted by header comparison, not by inspection.
  - `firstParty: false` offers never populate the BOM's `lastKnownVendor`.
  - `/bulk/` table renders with `<th scope>`; export button has an accessible name
    including the line-item count.

---

## 13. Phasing

1. **Foundation** — site shell, tokens, dual theming, a11y baseline, CI.
2. **Vendors** — vendor model, directory pages, curated vendor seed, facets.
3. **Local search** — normalisation, tokenisation, fuzzy, canonical identity, ranking, URL
   state, and the §6.8 automatic growth pipeline. Fully useful with no proxy and no
   scraping. Growth starts here because it is driven by *queries*, which exist before any
   Worker does.
4. **Worker** — Cloudflare Worker, KV, tier 1 adapters, fan-out, partial results, timeout
   and truncation logic. First live multi-vendor search.
5. **Tiers 2–3** — HTML adapters, then Scrapling pre-warm for vendors that fail the §7.6
   probe.
6. **Wholesale** — `wholesale.mode` fields, inline MOQ badges, the `bulk-pricing` facet,
   then `/bulk/` and the BOM CSV export.
7. **Self-service** — submit form, claim/verify flow, vendor feeds.

`wholesale.mode` is a plain data field, so it lands early with the vendor model in phase 2
and the badge renders from then. Only the `/bulk/` page and BOM export need to wait — they
are useful, but they are not what makes the search itself correct.

Phases 1–3 ship a genuinely useful product with no proxy and no scraping. Everything after
increases coverage and freshness. Nothing before phase 4 depends on a third party's server
being up.

---

## 14. Open questions

1. ~~Name.~~ RESOLVED: PROJECTdir. Open sub-question: domain casing (projectdir.in reads as a brand; PROJECTdir.in reads like a typo) and TLD.
2. **Seed size.** Proposed launch set per the §6.7 discussion: ~24 canonical parts derived
   from cross-vendor stocking frequency (parts stocked by 3+ of the 24 vendors), plus one
   entry per taxonomy category so no category renders empty, plus the human partner's own
   build list as a required input. Target ~40–50 total. **The human partner's build list is
   still outstanding** and is the one signal no automated method produces. Criterion is "no
   plausible first search returns empty", not a count.
3. ~~**Displaying prices.**~~ RESOLVED (2026-10-13): **yes**, per §6.4 — with mandatory GST
   basis normalisation, because Indian vendors quote inclusively and exclusively and an
   un-normalised comparison understates ex-GST vendors by 18% while looking correct.
4. **KV vs Cache API split.** §8.2 uses both. Confirm during phase 4 whether KV alone is
   sufficient at launch traffic, and drop the Cache API layer if so.
5. **Fan-out budget aggressiveness.** §8.3 starts deliberately conservative. Loosening it
   requires real traffic data, not intuition.
6. **Contributed canonical parts.** RESOLVED (2026-10-13): **automatic**, per §6.8, with the
   hard boundary that the system may add entries but never modify existing ones. Community
   moderators take over promotion once the measured trigger (>50 pending proposals/week
   sustained 4 weeks) is crossed. Merging or amending a live entry stays human-only
   indefinitely.
7. **Bulk / B2B mode.** Resolved: split per §6.6 — a `bulk-pricing` facet in the main
   directory plus a dedicated `/bulk/` page for `procurement` vendors, bridged by the BOM
   CSV export.
8. **Does the inventory sync anywhere?** v1 is deliberately local-only. If users ask for
   cross-device sync, that is an account system, which is a different product with real
   privacy obligations. Do not drift into it without deciding that deliberately.

---

## Appendix A — Research findings (2026-10-13)

Vendors verified to exist and to operate an online storefront. Platform column is inferred
from fetched page evidence, not assumed.

| Vendor | Domain | Platform | Segment | Notes |
| --- | --- | --- | --- | --- |
| Robu | robu.in | WooCommerce | both | Bengaluru. Widest catalogue; named in the r/india thread. **BOM tool** for bulk pricing. Hybrid retailer + marketplace ("Sell On Robu"). High-end: Luxonis OAK 1 PoE ₹48,999, BWSENSING RS485 inclinometers, EBYTE SBCs. ⚠️ Product search needs `?post_type=product&s=`; plain `?s=` returns blog results. |
| FlyRobo | flyrobo.in | Magento | hobbyist | **Private label** (own SKUs), drone/RC heavy. Publishes **restock windows**. About page states this project's thesis in the vendor's own words. Free shipping ₹499. |
| Quartz Components | quartzcomponents.com | Shopify | hobbyist | Jaipur. "5000+ components". 1206 semiconductors, 641 batteries, 483 tools. Notable robotics: FT5330M 35kg.cm steel-gear digital servo ₹1,585, DS3218 Pro, MG995/996R, S3003 Futaba-compatible. Est. 2017, distributor. ⚠️ See duplicate-domain flag below. |
| ElectroPi | electropi.in | generic | hobbyist | Operator: **Circuit Pulse Pvt Ltd**. Stock / design / **manufacture**. Rare + common parts, mechanical building blocks. Free shipping ₹499. ⚠️ Name-collision flag below. |
| RoboCraze | robocraze.com | WooCommerce | both | "India's First Robotics, AI & STEM Ecosystem". MOQ ₹50,000 / 100+ qty. 500+ companies. |
| RoboTechMinds | robotechminds.com | WooCommerce | integrator | Hyderabad. MyActuator HM-50 ₹28,400, CEM-45 ₹52,800, X8-60 ₹93,000; Feetech STS3250/STS3215 bus servos; RealSense D435; LeRobot kits. **Unique high-end stock.** |
| Robokits India | robokits.co.in | Magento | both | Dazzle Robotics, Gandhinagar GJ. The reference Indian robotics store. |
| Probots | probots.co.in | generic | hobbyist | Manufacturer + retailer, own-brand enclosures. |
| Robodo | robodo.in | Shopify | hobbyist | Bombay Electronics. Good NEMA 17 range. COD ₹300–3000. |
| REES52 | rees52.com | Shopify | hobbyist | Delhi. "India's Largest Online Robotics/DIY/Electronic Components Store". |
| Zbotic | zbotic.in | WooCommerce | hobbyist | Pune warehouse. 7,000+ products. Claims real-time inventory. |
| RoboticsDNA | roboticsdna.in | WooCommerce | hobbyist | Most NEMA 17 SKUs showed **out of stock** — the exact failure this project targets. |
| RoboGears | robogears.in | **Odoo** | hobbyist | Pimpri, physical + online, 4.9/5 from 800+ Google ratings. Startup India recognised. |
| RoboWay | roboway.in | generic | hobbyist | |
| RoboComp | robocomp.in | generic | hobbyist | "Motors & Actuators (15)" — small catalogue. |
| KitsGuru | kitsguru.com | Shopify | hobbyist | Chassis, wheels, gears, couplings. |
| MakerBazar | makerbazar.in | Shopify | hobbyist | Robotics kits + components. |
| Majestronicz | majestronicz.in | Shopify | hobbyist | Tamil Nadu. Footer states "Powered by Shopify". |
| RoboLark | robolark.com | WooCommerce | hobbyist | GST-inclusive pricing throughout. |
| Electro-Robo | electro-robo.com | generic | hobbyist | Wide kit range. |
| FlyingMachines | flyingmachines.in | generic | hobbyist | RC servos specifically. |
| Robo India | roboindia.com | WordPress | hobbyist | STEM education kits focus. |
| RoboRoot | roboroot.in | generic | integrator | B2B portal: CSV quote upload, overseas custom sourcing, lab kit bundling. |
| DC Robo | dcrobo.in | none | hobbyist | Chennai, West Tambaram. **"Launching Soon" — no catalogue.** WhatsApp-only. |

**Count: 24 verified vendors**, of which 4 are detected platform-confirmed new this pass.

### Data-integrity flags — must resolve before onboarding

| Flag | Detail | Action |
| --- | --- | --- |
| **ElectroPi name collision** | `electropi.ai` is an unrelated enterprise AI consultancy (ML, OCR, CV). `electropi.in` is Circuit Pulse Pvt Ltd's parts store. | Record the legal entity per vendor, not just the brand. Never match on brand name alone. |
| **Quartz duplicate domain** | `quartzcomponents.com` (Mahapura, Jaipur 302026) and `quartzcomponentssupply.shop` (Malviya Nagar, Jaipur 302017) both trade as "QuartzComponents". Two different addresses. | Confirm which is canonical before listing. Likely one entity that moved; listing both would double-count stock. |
| **Robu hybrid model** | Operates "Sell On Robu" marketplace alongside first-party stock. §6.2 excludes marketplace-*only* sellers, so Robu stays eligible — but its marketplace listings must not be mixed into first-party stock. | Add a `firstParty: true|false` flag at the offer level. |

The ElectroPi case is the general lesson: **brand name is not an identity.** Two unrelated
companies share "ElectroPi". `vendors.json` therefore keys on slug and carries the legal
entity name, and the submit form must not auto-fill entity data from a brand match.

**Excluded by §6.2:** `store.zenix.lk` — Sri Lankan store, surfaced by INR pricing.

### Community sources

- **r/india — "A guide for buying electronic components ONLINE from India" (Sep 2020).**
  Names Robu, Evelta and FabToLab as widest selection and cheapest shipping. A Probots
  employee commented. This thread is an unmaintained, unsorted, comment-nested precursor to
  this project — useful as a source of vendor names and as evidence the frustration is real
  and shared.
- **r/robotics — "Best place to get parts?" (2022) and "Where do people get their
  electronics and parts?" (2018).** Both US-centric (Digikey, Mouser, Pololu, Adafruit).
  Useful only as the global competitive set.
- **Quora — not reached.** No India-specific robotics parts discussion surfaced.

### Honest gaps in this research

- Community sources are thin for *robotics specifically* in India — most discussion is
  generic electronics. Robotics-specific buying pain appears in vendor stock levels
  (RoboticsDNA's out-of-stock NEMA 17s) rather than in forum threads.
- Platform column is inferred from fetched markup. It must be re-derived by the §7.6 probe
  before any adapter is written against it.
- No Quora research. If Quora has India-specific robotics threads, they would help prioritise
  §6.7's seed list.
- Vendor list is not exhaustive and was not verified for current trading status, GST
  registration, or shipping policy. Each entry still has to clear §6.2 on onboarding.
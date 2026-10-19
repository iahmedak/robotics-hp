# Vendor Profile Pages — Design Spec

**Date:** 2026-10-13
**Status:** Draft for review
**Depends on:** `2026-10-13-live-offers-design.md` — the parts grid on a vendor page consumes live offers. **Implement after the live-offers work ships.**
**Extends:** `2026-10-13-robotics-parts-directory-design.md` (rev 5)

---

## 1. Problem

A vendor is currently a name, a city and a link. Every supplier click leaves PROJECTdir entirely and lands on someone else's homepage. The result is that the site reads as a thin list rather than a place, and it earns none of the trust that a real profile would.

The reference is [dcrobo.in](https://dcrobo.in/) — a full supplier landing page: hero, trust strip, category grid with imagery, brand row, reasons-to-buy, and a complete contact block. Its own site is "Launching Soon" with no catalogue, so it is pure brochure. That shape works for every supplier, including the six whose feeds we cannot fetch.

## 2. Decision summary

| Decision | Choice | Why |
|---|---|---|
| Page type | **Hybrid** — brochure plus parts grid | Useful for every vendor; the grid fills in only where live offers exist |
| Contact data | Fetch and validate during the Worker refresh | Cannot go stale; nothing inferred or invented |
| Category imagery | Generated schematics, one per category | No licensing exposure, available for all 27 immediately |
| Sequencing | After live offers ships | The parts grid depends on the Worker |

## 3. Hard constraint: we must never trap a visitor

PROJECTdir is a **directory, not a storefront**. It holds no stock, takes no payment, earns no affiliate commission, and is not the supplier.

Every vendor page therefore carries a **prominent, visually dominant outbound path to the supplier's own site** — in the hero, not only in the footer. A visitor who clicks a vendor expecting to reach that vendor must reach it.

Interposing a profile between the click and the store is only acceptable because the profile adds something. If it ever becomes a dead end or a toll gate on the way to a shop, the site has stopped being honest. This is a design constraint, not a preference, and §9 tests it.

## 4. Data model change

`Vendor` gains **optional** contact fields. Optional is deliberate: a missing field renders as absent, never as a placeholder that looks like real data.

```ts
type VendorContact = {
  phone: string | null;        // E.164-ish, display as given
  whatsapp: string | null;     // wa.me link target, digits only
  email: string | null;
  address: string | null;      // free text, multi-line
  hours: string | null;        // free text, e.g. "Mon–Sat, 10:00 AM – 8:00 PM"
  mapsUrl: string | null;      // verified Google Maps link
  websiteNote: string | null;  // e.g. "Launching soon — order by phone"
};
```

`Vendor` gains `contact?: VendorContact`.

Additionally:

- `brands: string[]` — brand names sold, matched to Simple Icons slugs where one exists.
- `highlights: string[]` — up to 4 short reason phrases ("Same-day dispatch", "Genuine Arduino", "Bulk & B2B").

All are optional and additive, so `validateVendors` accepts both old and new records. Existing vendors without them render a shorter page, never a broken one.

### 4.1 Contact acquisition: fetch and validate

Contact details are **extracted from the supplier's own public site during the existing 6-hour Worker refresh**, not hand-transcribed. Transcription goes stale the moment it is written; a fetch cannot.

For each vendor the Worker additionally requests the homepage and, where present, `/contact`, then extracts candidates under these rules:

| Field | Accepted from | Rejected |
|---|---|---|
| `phone` | `tel:` links, or a number pattern adjacent to contact keywords | fax lines, support desks, numbers inside `<script>` |
| `whatsapp` | literal `wa.me` or `api.whatsapp.com` link | any other host, even when the path looks like a phone number |
| `email` | `mailto:` link, or an address-shaped string near contact keywords | `@example.*`, support placeholders |
| `address` | text inside an address or `itemprop="address"` region | free-text marketing prose |
| `hours` | text inside a `hours` / `itemprop` region | anything else |

**A vendor is only ever written with what survived validation.** Everything rejected stays `null` and renders as absent. Nothing inferred, nothing guessed, nothing carried forward from a previous run unless it re-validates.

Extraction reads the **supplier's own site only**. Aggregators, directories and third-party listings are never consulted.

`contactVerified` is set to the refresh timestamp whenever a value passes validation, so the page shows how fresh the data is.

**What cannot be fetched, and stays hand-written:**

- **Robu**, whose site sits behind a Cloudflare challenge and cannot be read at all. Its contact block is curated by hand, like every other unfetchable vendor.
- **`highlights` and `blurb`** — editorial phrasing. Scraped supplier marketing copy is both legally awkward and editorially worse than something written plainly.

An empty contact block is therefore the **correct** outcome for a vendor we cannot read or cannot verify, not a failure to fill.

## 5. Page structure

Route: `/vendor/<slug>/`, statically generated for all 24 vendors, consistent with the existing static build.

1. **Hero** — name, city, one-line blurb, audience tags, and the **outbound CTA to the supplier's site** as the visually dominant action. Contact actions (call / WhatsApp / email) render only when curated.
2. **Trust strip** — typographic rule-separated facts: ships across India, wholesale mode, verification date, live-catalogue state.
3. **Category tiles** — the categories this vendor stocks, each with a generated schematic, the category label, and an example-parts line. Links to `/suppliers?cat=<id>`.
4. **Brands row** — brand chips, using Simple Icons where a slug matches, otherwise a text chip.
5. **Why this vendor** — up to 4 highlight cards. Omitted entirely when empty.
6. **Parts grid** — live offers for this vendor, from `/offers`. Present only for the nine fetchable vendors.
7. **Contact** — address, phone, WhatsApp, email, hours, map link. Sections render only when populated.
8. **Footer** — legal entity and city, matching the existing pattern.

### 5.1 Parts grid degradation

For the six unfetchable vendors, section 6 is **omitted entirely** — not shown empty, not shown with a spinner that resolves to nothing. A visible "0 parts" reads as "this vendor stocks nothing", which is false and actively misleading.

For a fetchable vendor whose Worker call fails, the same rule applies: omit the section, leave the rest of the page intact.

### 5.2 Category schematics

The deterministic generator built for live offers generalises from part to category: `schematicFor(kind: 'part' | 'category', id: string): string`. Same blueprint aesthetic, same determinism guarantee, no per-image artwork to author, no rights to clear.

## 6. Navigation changes

- `/suppliers` cards link to `/vendor/<slug>/` instead of the supplier's site.
- Part pages' vendor links link to `/vendor/<slug>/`; the supplier's own site is reached from the vendor page.
- `/vendor/<slug>/` carries the outbound CTA. The two-step path is only acceptable while §3's hero CTA is unmistakable.

## 7. Honest copy

- Prices always attributed to the named supplier, never presented as PROJECTdir's.
- No affiliate framing, no "we recommend", no implication of affiliation.
- Verification dates shown, not hidden. A listing verified 8 months ago says so.
- `platform: none` and "no online catalogue" stated plainly rather than glossed.

## 8. Testing

- Every one of the 24 vendor routes builds and returns 200.
- Each vendor page contains exactly one visually dominant outbound link to the supplier's site, in the hero.
- No `contact` field ever renders a placeholder value — absent means the element is absent.
- Category schematics are deterministic and valid standalone SVG.
- The parts grid is omitted, not empty, for the six unfetchable vendors.
- A failed `/offers` request omits the grid and leaves the page otherwise identical.
- Keyboard: category tiles and brand chips are reachable and activatable; visible focus on all.
- Reflow at 320px with no horizontal scroll.
- Both themes meet 4.5:1 body contrast and 3:1 boundary contrast, asserted from tokens as elsewhere.

## 9. Non-goals

- Vendor self-service profile editing. Data changes remain pull requests to JSON.
- Reviews, ratings, or user submissions about vendors.
- Map embedding. A verified outbound Maps **link** only; no iframe, no third-party JS on a page a visitor is about to trust.
- Ordering, carts, quotes, or contact forms that transmit anything anywhere.
- Live chat or WhatsApp widgets. Those embed third-party scripts and trackers onto the one page where a visitor is about to trust us.
- Per-vendor domain or subdomain hosting. This is a directory; vendors keep their own sites.
- Scraping contact details from aggregators or directories.

## 10. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Contact details go stale — closed shop, changed number | Visitor calls a dead number | `contactVerified` date shown on the page; `null` when unverifiable |
| The two-step path to a supplier irritates visitors | Site feels obstructive | Hero CTA is the dominant action; §8 asserts its presence |
| Empty parts grid reads as "stocks nothing" | Actively misleading | Section omitted, never rendered empty (§5.1) |
| A supplier publishes a wrong or support number on their own site | Visitor contacts the wrong desk | Validation rejects support/fax lines; `contactVerified` shows freshness |
| Brand logos missing for most brands | Sparse row | Text chips fallback; row omitted when empty |

## 11. Success criteria

1. `/vendor/<slug>/` exists for all 24 vendors and every one carries an unmistakable link to that supplier's own site.
2. Every vendor page renders correctly when contact extraction finds nothing.
3. The nine fetchable vendors show a live parts grid; the other six show none, and the page does not imply otherwise.
4. Category tiles render with generated schematics and no broken imagery anywhere on the site.
5. `npm run validate` passes, including new browser assertions.

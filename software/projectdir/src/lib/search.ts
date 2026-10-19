import { normalize } from './normalize';
import { similarity, typoRatio } from './similarity';
import { groupResults, relevanceOf, scoreOf, type SearchResult, type GroupedListing } from './identity';
import type { CanonicalPart, Vendor } from './schema';

/**
 * The search entry point.
 *
 * Everything here is local and synchronous — no network call per keystroke.
 * The federated Worker proxy (spec §8) is phase 4 and layers ON TOP of this;
 * until then this file answers from the seed alone, which is the whole point of
 * phases 1-3 being useful on their own.
 */

export const SEARCH = {
  /** §8.3 — cap so the first paint never waits on an unbounded result set. */
  MAX_RESULTS: 50,
  /** Below this, a hit is too weak to show. */
  MIN_SCORE: 0.35,
} as const;

export type SearchOutcome = {
  listings: GroupedListing[];
  /** Canonical parts that matched but produced no vendor offers. */
  matchesWithoutOffers: CanonicalPart[];
  total: number;
};

type ResultSeed = {
  name: string;
  vendorSlug: string;
  category: string;
  specs?: Record<string, string | number>;
  /** Present only when a real vendor product URL is known. */
  url?: string;
};

/**
 * Expand the seed into per-vendor offers. Each canonical part names the vendors
 * observed stocking it; that relationship is the whole reason the seed exists.
 */
export function seedToResults(parts: CanonicalPart[], vendors: Vendor[]): SearchResult[] {
  const bySlug = new Map(vendors.map((v) => [v.slug, v]));
  const out: SearchResult[] = [];

  for (const p of parts) {
    for (const slug of p.vendors) {
      const v = bySlug.get(slug);
      if (!v) continue; // Referential integrity is enforced at build time too.
      // A vendor that is listed but has no online catalogue (tier 0) cannot be
      // a purchase destination, so it is excluded from offers.
      if (!v.search.enabled) continue;

      out.push({
        partId: p.id,
        name: p.canonicalName,
        vendor: v.name,
        category: p.category,
        specs: p.specs,
        url: v.url,
        tier: (v.search.tier === 1 ? 1 : v.search.tier === 2 ? 2 : 3) as 1 | 2 | 3,
        ageMs: null, // curated
        firstParty: true,
      });
    }
  }
  return out;
}

/**
 * Score a query against a canonical part, taking the best of its name, every
 * alias, and a typo-tolerant comparison.
 *
 * Alias matching is what lets "42bygh" find "NEMA 17 Stepper Motor" — no string
 * metric can know they are the same part, so that mapping is authored data.
 */
export function matchScore(query: string, part: CanonicalPart): number {
  const q = normalize(query);
  if (!q) return 0;

  const candidates = [part.canonicalName, ...part.aliases];
  let best = 0;
  for (const c of candidates) {
    const s = similarity(query, c);
    if (s > best) best = s;
    const t = typoRatio(q, normalize(c));
    if (t > best) best = t;
  }

  // A query that matches the category label ("servos") should surface parts in
  // that category even though no name matches.
  if (best < SEARCH.MIN_SCORE) {
    if (similarity(query, part.category.replace('-', ' ')) > 0.8) best = 0.5;
  }
  return best;
}

/**
 * Run a search.
 *
 * `results` is the current offer index. In phase 1-3 that is derived from the
 * seed; from phase 4 it will be whatever the Worker returned, and this function
 * stays exactly as it is.
 */
export function search(
  query: string,
  parts: CanonicalPart[],
  results: SearchResult[],
): SearchOutcome {
  const q = normalize(query);

  if (!q) {
    const listings = groupResults(results, parts);
    return {
      listings: listings.slice(0, SEARCH.MAX_RESULTS),
      matchesWithoutOffers: [],
      total: listings.length,
    };
  }

  const matched = parts
    .map((p) => ({ part: p, score: matchScore(query, p) }))
    .filter((m) => m.score >= SEARCH.MIN_SCORE);

  // Keep the best-matching offers only. Every offer of a matched part shares
  // that part's score, so this cannot drop a stronger seller of a kept part.
  const minKept = matched.length ? Math.min(...matched.map((m) => m.score)) : 0;
  const keptIds = new Set(matched.map((m) => m.part.id));

  const keptResults = results.filter((r) => {
    if (r.partId && keptIds.has(r.partId)) return true;
    // Ungrouped strays are judged on their own merits.
    if (!r.partId) return relevanceOf(r, query) >= minKept;
    return false;
  });

  // A canonical part can match while every seller offering it is unsearchable,
  // which is real information: the part exists, nobody lists it online.
  const withOffers = new Set(keptResults.map((r) => r.partId).filter(Boolean));
  const matchesWithoutOffers = matched
    .filter((m) => !withOffers.has(m.part.id))
    .map((m) => m.part);

  const listings = groupResults(keptResults, parts)
    .slice(0, SEARCH.MAX_RESULTS);

  // Order listings by their best match score so the closest match is first.
  const scoreOfListing = new Map(matched.map((m) => [m.part.id, m.score]));
  listings.sort((a, b) => {
    const ak = a.canonical ? scoreOfListing.get(a.canonical.id) ?? 0 : 0;
    const bk = b.canonical ? scoreOfListing.get(b.canonical.id) ?? 0 : 0;
    if (Math.abs(bk - ak) > 1e-9) return bk - ak;
    return 0;
  });

  return { listings, matchesWithoutOffers, total: listings.length };
}

/** Convenience for ranking a bare result without a query. */
export { scoreOf };
export type { ResultSeed };
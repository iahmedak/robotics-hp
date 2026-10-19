import { similarity } from './similarity';
import { normalize } from './normalize';
import type { CanonicalPart, Vendor } from './schema';

/**
 * Canonical-part identity and result ranking — spec §7.3 and §7.4.
 *
 * A search result is never a bare product row. It is a PART with one or more
 * seller offers, and the whole value of this site is that two people searching
 * for the same physical part arrive at one row instead of two near-duplicates.
 */

/** Bonuses on top of the best alias similarity. */
export const IDENTITY = {
  CATEGORY_BONUS: 0.15,
  SPEC_BONUS: 0.10,
  /** A result joins a canonical part at or above this. */
  GROUP_THRESHOLD: 0.80,
  /** nameSim + both bonuses — the ceiling, asserted in tests. */
  MAX: 1.25,
} as const;

/** Ranking weights — spec §7.4. */
export const RANK_WEIGHTS = {
  relevance: 0.60,
  trust: 0.25,
  freshness: 0.15,
} as const;

/**
 * Trust by fetch tier. A structured first-party API response is more reliable
 * than a parsed HTML page, which is more reliable than a stealthed browser
 * render. Spec §7.4.
 */
export const TRUST = {
  1: 1.0,
  2: 0.9,
  3: 0.7,
} as const;

/** Freshness relative to the data's age. Spec §7.4. */
export const FRESHNESS = {
  FRESH_MIN_MS: 5 * 60 * 1000,
  RECENT_MAX_MS: 15 * 60 * 1000,
  fresh: 1.0,
  recent: 0.9,
  stale: 0.5,
} as const;

export type SearchResult = {
  /** Set once grouping has assigned this result to a canonical part. */
  partId: string | null;
  name: string;
  vendor: string;
  category: string;
  specs: Record<string, string | number>;
  url: string;
  /** Fetch tier of the vendor this offer came from. */
  tier: 1 | 2 | 3;
  /** Age of the underlying data in ms, or null for curated records. */
  ageMs: number | null;
  /** False for marketplace listings on a hybrid vendor like Robu. */
  firstParty: boolean;
};

export type GroupedListing = {
  canonical: CanonicalPart | null;
  results: SearchResult[];
};

function specBonus(result: SearchResult, canonical: CanonicalPart): number {
  // Defensive on purpose: offers arrive over the wire from the Worker in
  // phase 4, and a partial record must degrade to "no bonus", never throw.
  const resultSpecs = result.specs ?? {};
  if (!resultSpecs || typeof resultSpecs !== 'object') return 0;

  const canonicalSpecs = canonical.specs ?? {};
  const shared = Object.entries(canonicalSpecs).filter(
    ([key, value]) =>
      key in resultSpecs &&
      normalize(String(resultSpecs[key])) === normalize(String(value)),
  );
  // Two agreeing key/value pairs is the bar: one shared value is often a
  // coincidence (every motor has a voltage).
  return shared.length >= 2 ? IDENTITY.SPEC_BONUS : 0;
}

/**
 * How strongly a result belongs to a canonical part.
 *
 * nameSim is the best score across the canonical name AND every alias.
 * Aliases matter enormously: they are how "42bygh" reaches "NEMA 17", since no
 * string metric can know they are the same part.
 */
export function identity(result: SearchResult, canonical: CanonicalPart): number {
  const candidates = [canonical.canonicalName, ...canonical.aliases];
  let nameSim = 0;
  for (const c of candidates) {
    const s = similarity(result.name, c);
    if (s > nameSim) nameSim = s;
  }
  const catBonus = result.category === canonical.category ? IDENTITY.CATEGORY_BONUS : 0;
  return nameSim + catBonus + specBonus(result, canonical);
}

/** Vendor slug -> vendor, for trust lookup. */
export function trustOf(tier: 1 | 2 | 3): number {
  return TRUST[tier];
}

export function freshnessOf(ageMs: number | null): number {
  if (ageMs === null) return FRESHNESS.fresh; // curated: no expiry
  if (ageMs <= FRESHNESS.FRESH_MIN_MS) return FRESHNESS.fresh;
  if (ageMs <= FRESHNESS.RECENT_MAX_MS) return FRESHNESS.recent;
  return FRESHNESS.stale;
}

/**
 * Relevance of a result to the query, always in [0,1].
 *
 * Tries the result name first, because that is what the user is matching
 * against. Falls back to the union of everything a person might have typed.
 */
export function relevanceOf(result: SearchResult, query: string): number {
  const byName = similarity(result.name, query);
  if (byName > 0) return byName;

  const haystack = [result.name, result.category, result.vendor].join(' ');
  return similarity(haystack, query);
}

export function scoreOf(result: SearchResult, query: string): number {
  return (
    RANK_WEIGHTS.relevance * relevanceOf(result, query) +
    RANK_WEIGHTS.trust * trustOf(result.tier) +
    RANK_WEIGHTS.freshness * freshnessOf(result.ageMs)
  );
}

/**
 * Deterministic total order. The vendor-slug tiebreak matters: without it two
 * results that tie on every visible field would swap order between renders,
 * which reads as a bug and breaks shareable URLs.
 */
export function compareResults(a: SearchResult, b: SearchResult, query: string): number {
  const d = scoreOf(b, query) - scoreOf(a, query);
  if (Math.abs(d) > 1e-9) return d;
  if (a.vendor !== b.vendor) return a.vendor < b.vendor ? -1 : 1;
  if (a.name !== b.name) return a.name < b.name ? -1 : 1;
  return 0;
}

/**
 * Assign results to canonical parts and order each group.
 *
 * A result matching nothing is KEPT as an ungrouped listing. Dropping it would
 * silently hide a part we simply have not seen before — the worst possible
 * failure for a search tool, and the one this project exists to prevent.
 */
export function groupResults(
  results: SearchResult[],
  canonicals: CanonicalPart[],
): GroupedListing[] {
  const groups = new Map<string, SearchResult[]>();
  const ungrouped: SearchResult[] = [];
  const canonicalById = new Map(canonicals.map((c) => [c.id, c]));

  for (const r of results) {
    let bestId: string | null = null;
    let bestScore = 0;
    for (const c of canonicals) {
      const s = identity(r, c);
      if (s > bestScore) {
        bestScore = s;
        bestId = c.id;
      }
    }
    if (bestId !== null && bestScore >= IDENTITY.GROUP_THRESHOLD) {
      const bucket = groups.get(bestId) ?? [];
      bucket.push({ ...r, partId: bestId });
      groups.set(bestId, bucket);
    } else {
      ungrouped.push({ ...r, partId: null });
    }
  }

  const listings: GroupedListing[] = [];
  for (const [id, bucket] of groups) {
    listings.push({ canonical: canonicalById.get(id) ?? null, results: bucket });
  }
  if (ungrouped.length) {
    listings.push({ canonical: null, results: ungrouped });
  }

  // Canonical parts are listed before ungrouped strays, then each group is
  // ordered internally. Listings themselves sort by their best score.
  const orderKey = (l: GroupedListing): number =>
    l.results.length ? Math.max(...l.results.map((r) => scoreOf(r, r.name))) : 0;

  listings.sort((a, b) => {
    if ((a.canonical === null) !== (b.canonical === null)) {
      return a.canonical === null ? 1 : -1;
    }
    const d = orderKey(b) - orderKey(a);
    if (Math.abs(d) > 1e-9) return d;
    const ai = a.canonical?.id ?? '';
    const bi = b.canonical?.id ?? '';
    return ai < bi ? -1 : ai > bi ? 1 : 0;
  });

  for (const l of listings) {
    // Within a group, trust and freshness decide — relevance is equal by
    // construction because every member matched the same canonical part.
    l.results.sort((x, y) => {
      if (x.tier !== y.tier) return x.tier - y.tier;
      const fx = freshnessOf(x.ageMs);
      const fy = freshnessOf(y.ageMs);
      if (fx !== fy) return fy - fx;
      return x.vendor < y.vendor ? -1 : x.vendor > y.vendor ? 1 : 0;
    });
  }

  return listings;
}

/** Convenience: vendor lookup for tiers and first-party flags. */
export function vendorIndex(vendors: Vendor[]): Map<string, Vendor> {
  return new Map(vendors.map((v) => [v.slug, v]));
}
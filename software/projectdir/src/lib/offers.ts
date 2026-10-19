import type { CanonicalPart, Platform, Vendor } from './schema';

/**
 * Live-offer contract, shared by the static site and the Cloudflare Worker.
 *
 * Both sides import these so the shape and the thresholds cannot drift apart.
 * A threshold disagreement between producer and consumer would silently turn
 * deep links into search links, which is exactly the failure the spec calls
 * out as worst.
 */

/**
 * At or above this, a matched product gets a deep link to the exact page.
 *
 * Deliberately conservative. A wrong deep link sends a buyer to the wrong
 * part, which is materially worse than sending them to the supplier's own
 * search box with the part name filled in.
 */
export const DEEP_LINK_MIN = 0.85;

/** Below DEEP_LINK_MIN but at or above this, the match is real but too close to call. */
export const SEARCH_ONLY_MIN = 0.6;

export type OfferPrice = {
  amount: number;
  /**
   * Null when the supplier's feed states no currency.
   *
   * Shopify's public products.json carries no currency field at all, and 7 of
   * the 9 fetchable vendors are Shopify. Defaulting to INR would misstate a
   * price the shop lists in another currency, so absence is preserved and the
   * UI renders a bare amount.
   */
  currency: string | null;
  formatted: string;
};

export type Offer = {
  vendorSlug: string;
  vendorName: string;
  url: string;
  /** True only when the match cleared DEEP_LINK_MIN. */
  isDeepLink: boolean;
  image: string | null;
  title: string;
  price: OfferPrice | null;
  inStock: boolean | null;
  /** 0..1, rounded to 2 places. Internal routing, never shown to users. */
  confidence: number;
};

/**
 * Spaces encode as %20, never '+'.
 *
 * A '+' only decodes to a space under application/x-www-form-urlencoded, and
 * these URLs are handed to storefronts and CDNs that do not all agree on that.
 * %20 is unambiguous on every target.
 */
const enc = (q: string): string => encodeURIComponent(q.trim()).replace(/\+/g, '%20');

/**
 * A link into a supplier's own search, for the case where no product page
 * could be matched confidently — including vendors whose feeds we cannot read.
 */
export function searchUrl(host: string, platform: Platform, query: string): string {
  const base = `https://${host}`;
  switch (platform) {
    case 'shopify':
      return `${base}/search?q=${enc(query)}`;
    case 'woocommerce':
      return `${base}/?s=${enc(query)}&post_type=product`;
    // No known search convention for these. Linking the storefront is still a
    // real destination, and it is honest about being one.
    default:
      return base;
  }
}

/**
 * The text to search that vendor for.
 *
 * A part's name alone is often too broad — "Stepper Motor" returns hundreds.
 * Pairing it with the most distinctive spec narrows it to the right product.
 * Falls back through name -> category so the result is never empty.
 */
export function vendorSearchQuery(part: CanonicalPart): string {
  const base =
    part.canonicalName.trim() || part.category.replace(/-/g, ' ').trim() || part.id;

  const firstSpec = Object.entries(part.specs ?? {})[0];
  const spec = firstSpec ? `${firstSpec[0]} ${String(firstSpec[1])}`.trim() : '';

  return [base, spec].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}
/** Hard cap on entries for one part, live and fallback combined. */
export const MAX_OFFERS_PER_PART = 60;

/** Beyond this, prices are described as last-updated rather than presented as current. */
export const STALE_AFTER_HOURS = 48;

export type MergedOffer = { offer: Offer; isFallback: boolean };

/**
 * Combine live offers with the vendors the static data says stock this part.
 *
 * This is the ONLY place fallback entries are created. The Worker emits real
 * matches only, because two sources of truth for one vendor is how you get
 * duplicate rows and contradictory prices.
 *
 * The failure mode this exists to prevent: an unreachable Worker returning
 * nothing must leave the full static list on screen. A partial response must
 * still list every vendor. So the static list is the floor, never a subset.
 */
export function mergeOffers(
  live: Offer[],
  part: CanonicalPart,
  vendors: Map<string, Vendor>,
): MergedOffer[] {
  const seen = new Set(live.map((o) => o.vendorSlug));
  const query = vendorSearchQuery(part);

  const merged: MergedOffer[] = live.map((offer) => ({ offer, isFallback: false }));

  for (const slug of part.vendors) {
    if (seen.has(slug)) continue;
    const vendor = vendors.get(slug);
    if (!vendor) continue;

    let host = slug;
    try {
      host = new URL(vendor.url).host;
    } catch {
      // A malformed URL in the data file still deserves a listed vendor.
    }

    merged.push({
      isFallback: true,
      offer: {
        vendorSlug: vendor.slug,
        vendorName: vendor.name,
        url: searchUrl(host, vendor.search.platform, query),
        isDeepLink: false,
        // No product matched, so there is no product image and no price to show.
        // An empty catalogue must not look like a priced one.
        image: null,
        title: part.canonicalName,
        price: null,
        inStock: null,
        confidence: 0,
      },
    });
  }

  const deep = merged.filter((e) => !e.isFallback);
  const fallbacks = merged
    .filter((e) => e.isFallback)
    .sort((a, b) => a.offer.vendorName.localeCompare(b.offer.vendorName));

  deep.sort((a, b) => b.offer.confidence - a.offer.confidence);
  return [...deep, ...fallbacks].slice(0, MAX_OFFERS_PER_PART);
}

export function isStale(fetchedAt: string, now: Date = new Date()): boolean {
  const t = Date.parse(fetchedAt);
  // Unparseable is treated as stale: better to warn when we cannot tell than to
  // present a week-old price as current.
  if (Number.isNaN(t)) return true;
  return now.getTime() - t > STALE_AFTER_HOURS * 3600_000;
}
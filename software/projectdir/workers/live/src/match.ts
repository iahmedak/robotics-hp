import type { CanonicalPart, Vendor } from '../../../src/lib/schema';
import { DEEP_LINK_MIN, SEARCH_ONLY_MIN, type Offer, type OfferPrice } from '../../../src/lib/offers';
import { normalize } from '../../../src/lib/normalize';
import { similarity } from '../../../src/lib/similarity';
import { MAX_PRODUCTS_PER_VENDOR, type RawProduct } from './feeds';

export { MAX_PRODUCTS_PER_VENDOR };
export type { RawProduct };

/** Variants allowed per vendor per part, so a buyer sees real choices. */
export const MAX_OFFERS_PER_VENDOR_PART = 5;

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Digit runs in a string: "42BYGH 1.8-degree" -> ["42", "1", "8"]. */
function digitGroups(raw: string): string[] {
  return normalize(raw).match(/\d+/g) ?? [];
}

/**
 * The hard safety gate, and the reason this matcher cannot just call
 * `similarity()`.
 *
 * `similarity()` returns a categorical score and never consults the digit
 * signature - only `typoRatio()` does. So "NEMA 23 Stepper Motor 1.2 Nm High
 * Torque" is, on trigram shape alone, a near-perfect match for the NEMA 17
 * part. Sending a buyer to a 23 where they asked for a 17 is the worst failure
 * this feature has.
 *
 * The gate is not "signatures must be equal" - a real vendor title carries
 * extra numbers ("1.8-degree", "42BYGH") that the canonical name lacks. It is
 * narrower and stricter: every digit the canonical name states must actually
 * appear in the product. 17 must be present; 23 instead of 17 is not enough.
 */
function digitsAgree(candidateRaw: string, productRaw: string): boolean {
  const wanted = digitGroups(candidateRaw);
  if (wanted.length === 0) return true;
  const present = new Set(digitGroups(productRaw));
  return wanted.every((d) => present.has(d));
}

/**
 * Score a vendor product against one canonical name or alias.
 *
 * Vendor titles are long and padded with marketing text; canonical names are
 * short and precise. Plain trigram similarity systematically under-scores that
 * pairing, because every extra word in the title shrinks the Jaccard union. So
 * containment is checked explicitly and scores near-certain.
 *
 * `title` and `query` are separate on purpose. The digit gate reads the TITLE
 * only, because the title is the supplier's claim about what the product is,
 * while tags are frequently "related items" metadata. A vendor tagging a NEMA
 * 23 with "42bygh" because they also sell it must not drag that product onto
 * the NEMA 17 part: the tags would otherwise override the title.
 */
function scoreAgainst(
  title: string,
  query: string,
  candidateRaw: string,
  isCanonicalName: boolean,
): number {
  if (!digitsAgree(candidateRaw, title)) return 0;

  const a = normalize(query);
  const b = normalize(candidateRaw);
  // Containment earns near-certain ONLY on the canonical name.
  //
  // An alias such as "nema 17" is contained inside "NEMA 17 stepper DRIVER
  // CONTROLLER", which is a different product. Awarding 0.95 there deep-linked
  // a controller as a motor - the exact wrong-part failure the digit gate
  // exists to prevent. Aliases still match, through similarity, just below the
  // deep-link threshold, which is the honest confidence for a weak signal.
  if (b !== '' && a.includes(b)) return isCanonicalName ? 0.95 : 0.8;

  return similarity(query, candidateRaw);
}

/**
 * Best canonical part for a product, or null when nothing clears
 * SEARCH_ONLY_MIN.
 *
 * Scores title plus tags together: many suppliers put the model number in a
 * tag and a marketing sentence in the title, and either alone is too thin.
 */
export function matchProduct(
  product: RawProduct,
  parts: CanonicalPart[],
): { partId: string; confidence: number } | null {
  let bestId: string | null = null;
  let best = 0;

  const query = `${product.title} ${product.tagsText}`.trim();

  for (const part of parts) {
    let score = 0;
    for (const candidate of [part.canonicalName, ...part.aliases]) {
      const s = scoreAgainst(
        product.title,
        query,
        candidate,
        part.canonicalName === candidate,
      );
      if (s > score) score = s;
    }
    if (score > best) {
      best = score;
      bestId = part.id;
    }
  }

  if (bestId === null || best < SEARCH_ONLY_MIN) return null;
  return { partId: bestId, confidence: round2(best) };
}

/**
 * A price, or null when we do not know one.
 *
 * Currency is carried straight through. Shopify's public feed sends none, and
 * inventing "INR" for a store that prices in USD would misstate the number, so
 * a missing currency renders as a bare amount.
 */
function toPrice(product: RawProduct): OfferPrice | null {
  if (product.priceMinor === null || !Number.isFinite(product.priceMinor)) return null;
  // 0 is a real price (a free sample, a bundle). Only null means unknown.
  const currency = product.currency?.trim().toUpperCase() || null;
  const amount = round2(product.priceMinor);
  const grouped = amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  // Only show a symbol we were actually given. A wrong symbol is worse than none.
  const prefix = currency === 'INR' ? '₹' : currency ? `${currency} ` : '';
  return { amount, currency, formatted: `${prefix}${grouped}` };
}

/**
 * Turn matched products into offers for one vendor.
 *
 * Emits deep links ONLY. Products that did not clear DEEP_LINK_MIN are simply
 * absent - the client reconstructs a search link for any vendor missing from
 * the response, so emitting one here would duplicate the client's job and risk
 * two sources of truth for the same vendor.
 */

function toOffer(product: RawProduct, vendor: Vendor, confidence: number): Offer {
  return {
    vendorSlug: vendor.slug,
    vendorName: vendor.name,
    url: product.permalink,
    isDeepLink: true,
    image: product.image,
    title: product.title,
    price: toPrice(product),
    inStock: product.inStock,
    confidence,
  };
}
export function buildOffers(
  products: RawProduct[],
  vendor: Vendor,
  parts: CanonicalPart[],
): Offer[] {
  const byPart = new Map<string, Offer[]>();

  for (const product of products) {
    const m = matchProduct(product, parts);
    if (!m || m.confidence < DEEP_LINK_MIN) continue;

    const offer = toOffer(product, vendor, m.confidence);

    const bucket = byPart.get(m.partId);
    if (!bucket) {
      byPart.set(m.partId, [offer]);
    } else if (bucket.length < MAX_OFFERS_PER_VENDOR_PART) {
      bucket.push(offer);
    }
  }

  const out: Offer[] = [];
  for (const bucket of byPart.values()) {
    // Best match first, then cheapest - a buyer comparing variants wants the
    // options in that order, not arbitrary insertion order.
    bucket.sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return (a.price?.amount ?? Infinity) - (b.price?.amount ?? Infinity);
    });
    out.push(...bucket);
  }
  return out;
}
/**
 * Offers grouped by the canonical part they actually matched.
 *
 * The flat `buildOffers` is for tests and single-part callers. The refresh
 * path needs the grouping, because re-deriving it afterwards by re-matching
 * collapsed every vendor's catalogue onto whichever part came first in the
 * seed array, silently discarding every other match.
 */
export function buildOffersByPart(
  products: RawProduct[],
  vendor: Vendor,
  parts: CanonicalPart[],
): Map<string, Offer[]> {
  const byPart = new Map<string, Offer[]>();

  for (const product of products) {
    const m = matchProduct(product, parts);
    if (!m || m.confidence < DEEP_LINK_MIN) continue;

    const existing = byPart.get(m.partId);
    if (!existing) {
      byPart.set(m.partId, [toOffer(product, vendor, m.confidence)]);
    } else if (existing.length < MAX_OFFERS_PER_VENDOR_PART) {
      existing.push(toOffer(product, vendor, m.confidence));
    }
  }

  for (const bucket of byPart.values()) {
    bucket.sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence;
      return (a.price?.amount ?? Infinity) - (b.price?.amount ?? Infinity);
    });
  }
  return byPart;
}
import type { Vendor } from './schema';

/**
 * Supplier filtering — spec §2 / the keydir "multi-select intersect" behaviour.
 *
 * This lives in lib rather than inline in the page so it is unit-testable.
 * The intersect semantics are the load-bearing part: selecting two categories
 * must return suppliers stocking BOTH, not either. Union semantics would be the
 * usual implementation and would quietly answer a different question.
 */

export type SupplierFilter = {
  /** Free text over name, city, state, blurb and category labels. */
  query: string;
  /** Selected category ids. Empty means "no category constraint". */
  categories: string[];
  /** When true, exclude suppliers that do not ship across India. */
  panIndiaOnly: boolean;
};

export const EMPTY_FILTER: SupplierFilter = {
  query: '',
  categories: [],
  panIndiaOnly: false,
};

/** Every query word must appear somewhere. This is AND across words. */
function matchesQuery(v: Vendor, query: string, catLabel: Record<string, string>): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = (
    v.name +
    ' ' +
    v.city +
    ' ' +
    v.state +
    ' ' +
    v.blurb +
    ' ' +
    v.categories.map((c) => catLabel[c] ?? c).join(' ')
  ).toLowerCase();
  return q.split(/\s+/).filter(Boolean).every((w) => hay.includes(w));
}

export function filterSuppliers(
  vendors: Vendor[],
  filter: SupplierFilter,
  catLabel: Record<string, string> = {},
): Vendor[] {
  return vendors
    .filter((v) => {
      if (filter.panIndiaOnly && !v.shipsPanIndia) return false;
      for (const id of filter.categories) {
        if (!v.categories.includes(id)) return false; // INTERSECT
      }
      return matchesQuery(v, filter.query, catLabel);
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Toggle a category id in the selection. */
export function toggleCategory(selected: string[], id: string): string[] {
  return selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
}

/**
 * The wholesale constraint a buyer must see. A procurement vendor with no
 * published figure must still say something — "MOQ on request" is a stated
 * constraint, silence is not.
 */
export function wholesaleLabel(v: Vendor): string | null {
  const w = v.wholesale;
  if (w.mode === 'none') return null;
  if (w.mode === 'bulk-pricing') return 'Bulk pricing';
  if (w.moqInr) return `Wholesale from ₹${w.moqInr.toLocaleString('en-IN')}`;
  if (w.moqQty) return `Wholesale from ${w.moqQty} units`;
  return 'Wholesale — MOQ on request';
}
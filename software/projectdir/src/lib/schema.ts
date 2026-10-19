/**
 * Runtime validation for the version-controlled data files.
 *
 * These are checked at build time, not just in tests: a bad PR to
 * vendors.json or parts.seed.json must fail CI rather than ship a broken or
 * misleading page. Spec §12 "Schema".
 *
 * Every validator collects ALL errors before returning. Throwing on the first
 * one makes a contributor fix one problem per CI run, which is a bad loop.
 */

export type Category = {
  id: string;
  label: string;
  group: string;
  order: number;
  specKeys: string[];
};

export type Audience = 'hobbyist' | 'student' | 'integrator';
export type WholesaleMode = 'none' | 'bulk-pricing' | 'procurement';
export type Platform = 'shopify' | 'woocommerce' | 'magento' | 'odoo' | 'generic' | 'none';

export type Vendor = {
  slug: string;
  name: string;
  legalEntity: string;
  url: string;
  city: string;
  state: string;
  audiences: Audience[];
  categories: string[];
  shipsPanIndia: boolean;
  blurb: string;
  verified: string;
  wholesale: {
    mode: WholesaleMode;
    moqInr: number | null;
    moqQty: number | null;
    quoteFlow: string | null;
    leadTimeNote: string | null;
    gstInvoice: boolean;
    institutionalKits: boolean;
  };
  search: {
    enabled: boolean;
    platform: Platform;
    tier: number;
    note: string | null;
  };
};

export type CanonicalPart = {
  id: string;
  canonicalName: string;
  aliases: string[];
  category: string;
  specs: Record<string, string | number>;
  vendors: string[];
};

export type Result<T> = { ok: true; data: T; errors: [] } | { ok: false; data: null; errors: string[] };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const GROUPS: readonly string[] = ['actuation', 'transmission', 'sensing', 'control', 'power', 'structure'];
const AUDIENCES: readonly string[] = ['hobbyist', 'student', 'integrator'];
const MODES: readonly string[] = ['none', 'bulk-pricing', 'procurement'];
const PLATFORMS: readonly string[] = ['shopify', 'woocommerce', 'magento', 'odoo', 'generic', 'none'];

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Returns null when valid, otherwise a message. */
function check(cond: unknown, msg: string, errors: string[]): void {
  if (!cond) errors.push(msg);
}

export function validateCategories(input: unknown): Result<Category[]> {
  const errors: string[] = [];
  check(Array.isArray(input), 'categories: expected an array', errors);
  if (errors.length) return { ok: false, data: null, errors };

  const rows = input as unknown[];
  check(rows.length === 27, `categories: expected 27 entries, got ${rows.length}`, errors);

  const seen = new Set<string>();
  for (const [i, raw] of rows.entries()) {
    if (!isObj(raw)) { errors.push(`categories[${i}]: expected an object`); continue; }
    const c = raw as Record<string, unknown>;
    const id = String(c.id ?? '');
    check(KEBAB.test(id), `categories[${i}].id "${id}": must be kebab-case`, errors);
    check(!seen.has(id), `categories[${i}].id "${id}": duplicate`, errors);
    seen.add(id);
    check(typeof c.label === 'string' && c.label.length > 0, `categories[${i}].label: required`, errors);
    check(GROUPS.includes(String(c.group)), `categories[${i}].group "${c.group}": not one of ${GROUPS.join(', ')}`, errors);
    check(Number.isInteger(c.order), `categories[${i}].order: must be an integer`, errors);
    check(
      Array.isArray(c.specKeys) && (c.specKeys as unknown[]).length > 0,
      `categories[${i}].specKeys: at least one required — specKeys drive facets and scraper normalisation`,
      errors,
    );
  }

  const groupsPresent = new Set(
    rows.filter(isObj).map((r) => String((r as Record<string, unknown>).group)),
  );
  for (const g of GROUPS) {
    check(groupsPresent.has(g), `categories: group "${g}" has no categories`, errors);
  }

  return errors.length
    ? { ok: false, data: null, errors }
    : { ok: true, data: rows as Category[], errors: [] };
}

export function validateVendors(input: unknown, categories: Category[]): Result<Vendor[]> {
  const errors: string[] = [];
  check(Array.isArray(input), 'vendors: expected an array', errors);
  if (errors.length) return { ok: false, data: null, errors };

  const rows = input as unknown[];
  const catIds = new Set(categories.map((c) => c.id));
  const seen = new Set<string>();

  for (const [i, raw] of rows.entries()) {
    if (!isObj(raw)) { errors.push(`vendors[${i}]: expected an object`); continue; }
    const v = raw as Record<string, unknown>;
    const slug = String(v.slug ?? '');

    check(KEBAB.test(slug), `vendors[${i}].slug "${slug}": must be kebab-case`, errors);
    check(!seen.has(slug), `vendors[${i}].slug "${slug}": duplicate`, errors);
    seen.add(slug);
    check(typeof v.name === 'string' && v.name.length > 0, `vendors[${i}].name: required`, errors);
    // Brand name is not an identity — electropi.in and electropi.ai are
    // different companies, so the legal entity is mandatory (spec Appendix A).
    check(typeof v.legalEntity === 'string' && v.legalEntity.length > 0, `vendors[${i}].legalEntity: required — brand name alone is not an identity`, errors);
    check(String(v.url ?? '').startsWith('https://'), `vendors[${i}].url: must be https`, errors);
    check(ISO_DATE.test(String(v.verified ?? '')), `vendors[${i}].verified: must be YYYY-MM-DD`, errors);

    check(Array.isArray(v.audiences) && (v.audiences as unknown[]).length > 0,
      `vendors[${i}].audiences: at least one required`, errors);
    for (const a of (v.audiences as unknown[]) ?? []) {
      check(AUDIENCES.includes(String(a)), `vendors[${i}].audiences: "${a}" not one of ${AUDIENCES.join(', ')}`, errors);
    }

    check(Array.isArray(v.categories) && (v.categories as unknown[]).length > 0,
      `vendors[${i}].categories: at least one required`, errors);
    for (const c of (v.categories as unknown[]) ?? []) {
      // Referential integrity: a category id that does not exist would render a
      // chip that filters to nothing.
      check(catIds.has(String(c)), `vendors[${i}].categories: "${c}" is not a known category id`, errors);
    }

    const w = v.wholesale as Record<string, unknown> | undefined;
    check(isObj(w), `vendors[${i}].wholesale: required`, errors);
    if (isObj(w)) {
      check(MODES.includes(String(w.mode)), `vendors[${i}].wholesale.mode: "${w.mode}" not one of ${MODES.join(', ')}`, errors);
      const hasMoq = typeof w.moqInr === 'number' || typeof w.moqQty === 'number';
      // Spec §6.6: never show a procurement vendor without stating its
      // purchasing constraint. A published figure is one form of that; a quote
      // flow ("MOQ on request", RoboRoot) is equally a stated constraint and is
      // how most Indian B2B vendors actually work. Only an entirely silent
      // procurement vendor is unlistable.
      check(w.mode !== 'procurement' || hasMoq || typeof w.quoteFlow === 'string',
        `vendors[${i}].wholesale: procurement requires moqInr, moqQty or a quoteFlow — a procurement vendor with no stated constraint would quietly mislead buyers`, errors);
    }

    const s = v.search as Record<string, unknown> | undefined;
    check(isObj(s), `vendors[${i}].search: required`, errors);
    if (isObj(s)) {
      check(PLATFORMS.includes(String(s.platform)), `vendors[${i}].search.platform: "${s.platform}" not one of ${PLATFORMS.join(', ')}`, errors);
      check(Number.isInteger(s.tier), `vendors[${i}].search.tier: must be an integer`, errors);
      // tier 0 means "listed but not searchable" — a real state (DC Robo has no
      // online catalogue), so it must be reachable but never fan out.
      check(!(s.enabled === false && s.tier !== 0),
        `vendors[${i}].search: disabled vendors must use tier 0`, errors);
    }
  }

  return errors.length
    ? { ok: false, data: null, errors }
    : { ok: true, data: rows as Vendor[], errors: [] };
}

export function validateSeed(input: unknown, categories: Category[], vendors: Vendor[]): Result<CanonicalPart[]> {
  const errors: string[] = [];
  check(Array.isArray(input), 'parts.seed: expected an array', errors);
  if (errors.length) return { ok: false, data: null, errors };

  const rows = input as unknown[];
  const catIds = new Set(categories.map((c) => c.id));
  const vendorSlugs = new Set(vendors.map((v) => v.slug));
  const covered = new Set<string>();
  const seen = new Set<string>();

  for (const [i, raw] of rows.entries()) {
    if (!isObj(raw)) { errors.push(`parts.seed[${i}]: expected an object`); continue; }
    const p = raw as Record<string, unknown>;
    const id = String(p.id ?? '');

    check(KEBAB.test(id), `parts.seed[${i}].id "${id}": must be kebab-case`, errors);
    check(!seen.has(id), `parts.seed[${i}].id "${id}": duplicate`, errors);
    seen.add(id);
    check(typeof p.canonicalName === 'string' && p.canonicalName.length > 0, `parts.seed[${i}].canonicalName: required`, errors);
    // Aliases carry 0.85 weight in §7.3 similarity — the second-highest term in
    // the whole function. An empty alias list makes a part unfindable.
    check(Array.isArray(p.aliases) && (p.aliases as unknown[]).length > 0,
      `parts.seed[${i}].aliases: at least one required — aliases drive grouping`, errors);
    check(isObj(p.specs), `parts.seed[${i}].specs: required object`, errors);

    const cat = String(p.category ?? '');
    check(catIds.has(cat), `parts.seed[${i}].category: "${cat}" is not a known category id`, errors);
    if (catIds.has(cat)) covered.add(cat);

    for (const v of (p.vendors as unknown[]) ?? []) {
      check(vendorSlugs.has(String(v)), `parts.seed[${i}].vendors: "${v}" is not a known vendor slug`, errors);
    }
  }

  // Category floor: a category with stocked products must never render empty.
  // spec §6.7 discussion — search returning nothing for a whole category reads
  // as "this site is broken", which is worse than being narrower.
  for (const c of categories) {
    check(covered.has(c.id), `parts.seed: category "${c.id}" has no canonical part — every category needs at least one seed entry`, errors);
  }

  // §6.8 payload budget: the seed ships to the browser.
  const bytes = JSON.stringify(rows).length;
  check(bytes <= 150 * 1024, `parts.seed: ${bytes} bytes exceeds the 150 KB client payload budget`, errors);

  return errors.length
    ? { ok: false, data: null, errors }
    : { ok: true, data: rows as CanonicalPart[], errors: [] };
}

/** Narrowing helper that throws at build time if the data is invalid. */
export function must<T extends { ok: boolean; errors: string[] }>(r: T, label: string): T & { data: T extends { data: infer D } ? D : never } {
  if (!r.ok) {
    throw new Error(`Invalid data in ${label}:\n  - ${r.errors.join('\n  - ')}`);
  }
  return r as never;
}
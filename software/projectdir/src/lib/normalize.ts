/**
 * Text normalisation — spec §7.1. Five steps, in order, no branching.
 *
 * Pure and idempotent: normalize(normalize(s)) === normalize(s). That property
 * is asserted with generated input, because it is what lets the same function
 * run on the client, in tests and (later) in the Worker without drift.
 */
export function normalize(input: string): string {
  return (
    input
      // 1. Unicode NFKC — folds fullwidth and compatibility forms so "ＮＥＭＡ"
      //    and "NEMA" collide before anything else looks at them.
      .normalize('NFKC')
      // 2. Lowercase.
      .toLowerCase()
      // 3. Strip combining diacritics: NFD first so combining marks exist as
      //    separate code points we can actually remove.
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // 4. Split letter↔digit boundaries into separate tokens, THEN keep
      //    [a-z0-9.] for the character filter.
      //
      //    Without this, "nema17" and "nema 17" are different strings and the
      //    most-typed query in the catalogue misses the part. Same for "mg995",
      //    "sg90", "608zz", "ft5330m". Applied after NFKC so fullwidth digits
      //    are already ASCII by the time this runs.
      .replace(/([a-z])([0-9])/g, '$1 $2')
      .replace(/([0-9])([a-z])/g, '$1 $2')
      // 4b. Anything outside [a-z0-9.] becomes a space. Keeping "." is what
      //     lets "2.5kg" survive as one token and "42.5mm" not split into
      //     "42 5mm".
      .replace(/[^a-z0-9.]+/g, ' ')
      // 5. Collapse runs of whitespace and trim.
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Stopwords dropped during tokenisation. Terms that carry no discriminating
 * power in a parts catalogue.
 */
export const STOPWORDS: ReadonlySet<string> = new Set([
  'for', 'of', 'the', 'with', 'and', 'pack', 'pcs', 'piece', 'free', 'shipping', 'sale',
]);

/**
 * Tokens where a trailing "s" is part of the term, so the plural strip must
 * not touch them. Every entry here ends in "s" or "ss" and would otherwise be
 * mangled: "bus" -> "bu", "gas" -> "ga", "abs" -> "ab".
 *
 * Note "pins", "nuts", "bolts", "rails", "guides" are here because their
 * SINGULAR is not a real catalogue word — stripping "s" would produce
 * "pin nut bolt rail guide", which no vendor part is called.
 */
export const PROTECTED: ReadonlySet<string> = new Set([
  'bus', 'gas', 'lens', 'ss', 'abs', 'rs232', 'rs485', 'can', 'pwm',
  'fgps', 'gps', 'ips', 'bms', 'esc', 'usb', 'pins', 'nuts', 'bolts',
  'rails', 'guides',
]);

/** Split a normalised string into searchable tokens — spec §7.2. */
export function tokenize(input: string): string[] {
  const raw = normalize(input).split(' ').filter(Boolean);
  const out: string[] = [];
  for (let t of raw) {
    if (STOPWORDS.has(t)) continue;
    // Strip a trailing "s" only when it cannot be meaningful.
    if (t.length > 3 && t.endsWith('s') && !PROTECTED.has(t)) {
      t = t.slice(0, -1);
    }
    if (t) out.push(t);
  }
  return out;
}
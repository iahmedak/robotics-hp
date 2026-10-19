import { normalize } from './normalize';

/**
 * Similarity — spec §7.3.
 *
 * This is the function the whole product rests on. `identity()` in
 * identity.ts adds category and spec bonuses on top of it, and §7.4 ranks by
 * its output. Two wrong constants here produce plausible-looking results that
 * silently group the wrong parts together, which is the exact failure mode
 * this project exists to avoid. Hence the pinned thresholds and the ladder
 * tests.
 */

/** Trigram threshold at which two strings are considered "the same shape". */
export const TRIGRAM_THRESHOLD = 0.72;
/** Token-overlap ratio above which containment is assumed. */
export const OVERLAP_THRESHOLD = 0.6;

export const SIMILARITY = {
  EXACT: 1.0,
  TRIGRAM: 0.85,
  CONTAINMENT: 0.8,
  /** A typo-tolerant match. Scored below TRIGRAM because a misspelling is
   *  weaker evidence than an independent phrasing that agrees on shape. */
  TYPO: 0.8,
} as const;

/**
 * All contiguous 3-character substrings, padded so short strings still produce
 * usable grams. Returns a multiset so repeated grams count.
 *
 * Padding matters: without it "sg90" yields grams "sg9", "g90" while "sg 90"
 * yields " sg", "sg ", "g 9", " 90". The padded forms overlap properly.
 */
export function trigrams(s: string): string[] {
  const padded = ` ${s} `;
  const out: string[] = [];
  for (let i = 0; i + 3 <= padded.length; i++) out.push(padded.slice(i, i + 3));
  return out;
}

/** Multiset Jaccard: |A ∩ B| / |A ∪ B|. Returns 1 for two empty strings
 *  rather than NaN, so "nothing matched" is a number, not a crash. */
export function trigramJaccard(a: string, b: string): number {
  const ga = trigrams(a);
  const gb = trigrams(b);
  if (ga.length === 0 && gb.length === 0) return 1;

  const count = (g: string[]) => {
    const m = new Map<string, number>();
    for (const x of g) m.set(x, (m.get(x) ?? 0) + 1);
    return m;
  };
  const ma = count(ga);
  const mb = count(gb);

  let intersection = 0;
  let union = 0;
  // Multiset union is sum of MAX per key, not sum(a)+sum(b). Summing both sides
  // double-counts shared grams and made two identical strings score 0.5.
  for (const [k, v] of ma) {
    const w = mb.get(k) ?? 0;
    intersection += Math.min(v, w);
    union += Math.max(v, w);
  }
  // Keys present only in b still contribute to the union.
  for (const [k, w] of mb) {
    if (!ma.has(k)) union += w;
  }

  return union === 0 ? 1 : intersection / union;
}

/** All digit characters, concatenated and order-preserving. */
export function digitSignature(s: string): string {
  return s.replace(/[^0-9]/g, '');
}

/** Levenshtein edit distance, two-row DP so the buffer stays O(min(m,n)). */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= b.length; j++) {
      const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        (curr[j - 1] ?? 0) + 1,          // insertion
        (prev[j] ?? 0) + 1,             // deletion
        (prev[j - 1] ?? 0) + cost,      // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length] ?? 0;
}

/** Threshold for accepting a single-character typo as the same part. */
export const TYPO_THRESHOLD = 0.8;

/**
 * Typo tolerance that is SAFE for part numbers.
 *
 * Plain edit distance is far too permissive here: "nema 17" vs "nema 23"
 * scores 0.875, which would happily group two completely different frame sizes
 * together. Digits carry the identity of a catalogue part, so a differing
 * digit signature vetoes the match outright regardless of how similar the rest
 * of the string looks.
 *
 * Returns 0 when the digit signatures differ.
 */
export function typoRatio(aRaw: string, bRaw: string): number {
  const a = normalize(aRaw);
  const b = normalize(bRaw);
  if (digitSignature(a) !== digitSignature(b)) return 0;
  const max = Math.max(a.length, b.length);
  if (max === 0) return 1;
  return 1 - levenshtein(a, b) / max;
}

/** Jaccard over token SETS: |A ∩ B| / |A ∪ B|. */
function tokenOverlap(a: string, b: string): number {
  const sa = new Set(a.split(' ').filter(Boolean));
  const sb = new Set(b.split(' ').filter(Boolean));
  if (sa.size === 0 && sb.size === 0) return 1;
  let inter = 0;
  for (const x of sa) if (sb.has(x)) inter += 1;
  const union = sa.size + sb.size - inter;
  return union === 0 ? 1 : inter / union;
}

function isContained(a: string, b: string): boolean {
  if (!a || !b) return false;
  const sa = a.split(' ').filter(Boolean);
  const sb = b.split(' ').filter(Boolean);
  if (sa.length === 0 || sb.length === 0) return false;
  const [short, long] = sa.length <= sb.length ? [sa, sb] : [sb, sa];
  const setLong = new Set(long);
  return short.every((t) => setLong.has(t));
}

/**
 * First-match ladder. Order is load-bearing: an exact match must win even when
 * its trigram score is lower, and containment must win over raw overlap.
 */
export function similarity(aRaw: string, bRaw: string): number {
  const a = normalize(aRaw);
  const b = normalize(bRaw);

  if (a === b && a.length > 0) return SIMILARITY.EXACT;

  // Trigram Jaccard handles phrasing variants ("42bygh stepper" vs
  // "stepper motor 42"), NOT typos — see typoRatio below for those.
  if (trigramJaccard(a, b) >= TRIGRAM_THRESHOLD) return SIMILARITY.TRIGRAM;

  if (isContained(a, b)) return SIMILARITY.CONTAINMENT;

  const typo = typoRatio(a, b);
  if (typo >= TYPO_THRESHOLD) return SIMILARITY.TYPO;

  const overlap = tokenOverlap(a, b);
  if (overlap >= OVERLAP_THRESHOLD) return overlap;

  return 0;
}
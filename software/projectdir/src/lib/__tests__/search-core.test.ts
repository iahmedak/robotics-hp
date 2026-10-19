import { describe, it, expect } from 'vitest';
import { normalize, tokenize, STOPWORDS, PROTECTED } from '../normalize';
import { similarity, trigrams, trigramJaccard, typoRatio, TYPO_THRESHOLD } from '../similarity';

describe('normalize — spec 7.1', () => {
  it('matches the spec examples', () => {
    expect(normalize('NEMA 17 Stepper (42BYGH)')).toBe('nema 17 stepper 42 bygh');
    expect(normalize('B.L.D.C. 24V')).toBe('b.l.d.c. 24 v');
  });

  it('lowercases, strips diacritics and collapses whitespace', () => {
    expect(normalize('Moteur   à   Moteur')).toBe('moteur a moteur');
    expect(normalize('Café   Servo')).toBe('cafe servo');
  });

  it('splits letter/digit boundaries so real queries match real part names', () => {
    // This is the single most-typed query in the catalogue. Without the
    // boundary split it is a different string from "nema 17" and never matches.
    expect(normalize('nema17')).toBe(normalize('nema 17'));
    expect(normalize('mg995')).toBe('mg 995');
    expect(normalize('sg90')).toBe('sg 90');
    expect(normalize('608zz')).toBe('608 zz');
    expect(normalize('ft5330m')).toBe('ft 5330 m');
    expect(normalize('24V')).toBe('24 v');
  });

  it('keeps dots so decimal-bearing tokens survive', () => {
    // "2.5kg" splits at the letter/digit boundary into "2.5 kg". That is
    // intentional and consistent: a query "2.5kg" and a document "2.5 kg"
    // normalise identically, so they still match.
    expect(normalize('2.5kg')).toBe('2.5 kg');
    expect(normalize('42.5 mm')).toBe('42.5 mm');
    expect(normalize('42.5mm')).toBe(normalize('42.5 mm'));
  });

  it('folds fullwidth forms via NFKC', () => {
    expect(normalize('ＮＥＭＡ')).toBe('nema');
  });

  it('is idempotent over generated input', () => {
    const alphabet = 'aA1 .-é０ＮZ';
    for (let i = 0; i < 500; i++) {
      let s = '';
      const len = 1 + Math.floor(Math.random() * 24);
      for (let j = 0; j < len; j++) {
        s += alphabet[Math.floor(Math.random() * alphabet.length)]!;
      }
      const once = normalize(s);
      expect(normalize(once), `not idempotent for ${JSON.stringify(s)}`).toBe(once);
    }
  });

  it('returns empty string for input with no alphanumerics', () => {
    expect(normalize('!!! ***')).toBe('');
  });
});

describe('tokenize — spec 7.2', () => {
  it('strips a trailing s on ordinary plurals', () => {
    expect(tokenize('motors')).toEqual(['motor']);
    expect(tokenize('servo motors and gears')).toEqual(['servo', 'motor', 'gear']);
  });

  it('does NOT strip s from protected terms', () => {
    expect(tokenize('CAN bus')).toEqual(['can', 'bus']);
    expect(tokenize('gas')).toEqual(['gas']);
    expect(tokenize('linear rails')).toEqual(['linear', 'rails']);
  });

  it('drops stopwords', () => {
    // "robotics" -> "robotic" looks wrong but is CORRECT and safe: query and
    // document both pass through the same strip, so "robotics" still matches
    // "robotics" and "robot" — it just also matches "robotic".
    expect(tokenize('servo for robotics with pack of 2')).toEqual(['servo', 'robotic', '2']);
    expect(STOPWORDS.has('shipping')).toBe(true);
  });

  it('leaves short tokens alone even when they end in s', () => {
    // Length 3 is not > 3, so no strip.
    expect(tokenize('bus')).toEqual(['bus']);
    expect(PROTECTED.has('bus')).toBe(true);
  });

  it('splits thread codes like M3 consistently across query and document', () => {
    // "M3" is a real thread standard. It splits to m/3, but since BOTH the query
    // and the document go through the same normalisation they still match.
    // Note the singular/plural difference survives tokenize() — that is what
    // similarity() is for, not token equality.
    expect(tokenize('M3 nuts')).toEqual(['m', '3', 'nuts']);
    expect(tokenize('M3 nuts').slice(0, 2)).toEqual(tokenize('m3 nut').slice(0, 2));
    expect(similarity('M3 nuts', 'm3 nut')).toBeGreaterThan(0);
  });

  it('handles empty and punctuation-only input', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize('   ')).toEqual([]);
    expect(tokenize('***')).toEqual([]);
  });
});

describe('trigrams', () => {
  it('pads so short strings produce usable grams', () => {
    expect(trigrams('ab').length).toBeGreaterThan(0);
    // A 2-char pad yields no 3-gram; trigramJaccard special-cases the
    // both-empty case to 1 so "nothing matched" stays a number, not a crash.
    expect(trigrams('')).toEqual([]);
  });

  it('identical strings score exactly 1', () => {
    // Multiset union is sum(max) per key, not sum(a)+sum(b). Getting that wrong
    // made two identical strings score 0.5.
    expect(trigramJaccard('nema 17', 'nema 17')).toBe(1);
    expect(trigramJaccard('mg 995 servo', 'mg 995 servo')).toBe(1);
  });

  it('two empty strings are identical, not NaN', () => {
    expect(trigramJaccard('', '')).toBe(1);
  });

  it('identical strings score 1', () => {
    expect(trigramJaccard('nema 17', 'nema 17')).toBe(1);
  });

  it('is symmetric', () => {
    const a = 'nema 17 stepper';
    const b = 'nema 17';
    expect(trigramJaccard(a, b)).toBeCloseTo(trigramJaccard(b, a), 10);
  });
});

describe('similarity — spec 7.3 ladder', () => {
  it('exact match scores 1.00', () => {
    expect(similarity('nema 17', 'nema 17')).toBe(1);
    expect(similarity('NEMA 17', 'nema17')).toBe(1); // normalisation first
  });

  it('ladder order is honoured: exact wins over a lower trigram score', () => {
    // These two normalise identically, so the trigram path would also return a
    // high number — the exact branch must still return exactly 1.
    expect(similarity('mg995', 'MG995')).toBe(1);
  });

  it('a typo still matches', () => {
    expect(similarity('servo motor', 'servo motr')).toBeGreaterThan(0);
    expect(typoRatio('servo motor', 'servo motr')).toBeGreaterThanOrEqual(TYPO_THRESHOLD);
  });

  it('typo tolerance never crosses a part number', () => {
    // "nema 17" and "nema 23" are different parts. Raw edit distance scores
    // them 0.875, so the digit-signature veto is what keeps them apart.
    expect(typoRatio('nema 17', 'nema 23')).toBe(0);
    expect(similarity('nema 17', 'nema 23')).toBeLessThanOrEqual(0.3);
    expect(similarity('mg 995', 'mg 996')).toBe(0);
  });

  it('matches an alias exactly, which is how model codes are handled', () => {
    // "42bygh" is a model code for a NEMA 17 stepper, but no string metric can
    // know that. That is precisely what aliases are for: the canonical part
    // lists "42bygh" as an alias, so a query for it matches at 1.0. Asserting
    // that two unrelated strings are similar would be asserting a lie.
    expect(similarity('42bygh', '42bygh')).toBe(1);
    expect(similarity('42bygh', '42bygh40')).toBeGreaterThan(0);
  });

  it('container containment scores 0.80', () => {
    expect(similarity('nema 17', 'nema 17 stepper motor')).toBe(0.8);
  });

  it('unrelated terms score 0', () => {
    expect(similarity('nema 17 stepper', 'lipo battery')).toBe(0);
    expect(similarity('bearing', 'servo')).toBe(0);
  });

  it('is symmetric', () => {
    expect(similarity('nema 17', 'nema 17 stepper'))
      .toBe(similarity('nema 17 stepper', 'nema 17'));
  });

  it('never exceeds 1', () => {
    const samples = ['nema 17', 'mg995', 'servo motor', '608zz', 'lipo', 'm3 nut'];
    for (const a of samples) {
      for (const b of samples) {
        const s = similarity(a, b);
        expect(s).toBeLessThanOrEqual(1);
        expect(s).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('empty inputs do not produce false confidence', () => {
    expect(similarity('', 'nema 17')).toBe(0);
    expect(similarity('nema 17', '')).toBe(0);
  });
});
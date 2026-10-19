import { describe, it, expect } from 'vitest';
import {
  identity, groupResults, relevanceOf, scoreOf, freshnessOf, trustOf,
  compareResults, IDENTITY, RANK_WEIGHTS, TRUST,
} from '../identity';
import type { SearchResult } from '../identity';
import type { CanonicalPart } from '../schema';

const nema: CanonicalPart = {
  id: 'nema-17-stepper',
  canonicalName: 'NEMA 17 Stepper Motor',
  aliases: ['nema17', 'nema 17', '42bygh', 'stepper motor 42'],
  category: 'stepper-motors',
  specs: { frame: 'NEMA 17', holdingTorqueNm: 1.4, stepAngleDeg: 1.8 },
  vendors: ['robodo', 'robokits'],
};

const mk = (over: Partial<SearchResult> = {}): SearchResult => ({
  partId: null,
  name: 'NEMA 17 Stepper Motor',
  vendor: 'robodo',
  category: 'stepper-motors',
  specs: { frame: 'NEMA 17', holdingTorqueNm: 1.4 },
  url: 'https://robodo.in/p/1',
  tier: 1,
  ageMs: 60_000,
  firstParty: true,
  ...over,
});

describe('identity — spec 7.3', () => {
  it('scores an exact canonical-name hit highly', () => {
    expect(identity(mk(), nema)).toBeGreaterThanOrEqual(IDENTITY.GROUP_THRESHOLD);
  });

  it('matches through an alias, which is how model codes are reached', () => {
    expect(identity(mk({ name: '42bygh' }), nema)).toBeGreaterThanOrEqual(IDENTITY.GROUP_THRESHOLD);
    expect(identity(mk({ name: 'nema17' }), nema)).toBeGreaterThanOrEqual(IDENTITY.GROUP_THRESHOLD);
  });

  it('adds the category bonus only on a category match', () => {
    const same = identity(mk(), nema);
    const diff = identity(mk({ category: 'servos' }), nema);
    expect(same - diff).toBeCloseTo(IDENTITY.CATEGORY_BONUS, 6);
  });

  it('adds the spec bonus only with TWO agreeing key/value pairs', () => {
    const two = identity(mk({ category: 'servos' }), nema);
    const one = identity(mk({ category: 'servos', specs: { frame: 'NEMA 17' } }), nema);
    expect(two - one).toBeCloseTo(IDENTITY.SPEC_BONUS, 6);
  });

  it('never exceeds the documented ceiling of 1.25', () => {
    const ceiling = identity(
      mk({ name: 'NEMA 17 Stepper Motor', specs: { frame: 'NEMA 17', holdingTorqueNm: 1.4 } }),
      nema,
    );
    expect(ceiling).toBeLessThanOrEqual(IDENTITY.MAX);
    expect(ceiling).toBeCloseTo(IDENTITY.MAX, 6);
  });

  it('does not group unrelated parts', () => {
    expect(identity(mk({ name: 'MG995 Servo Motor', category: 'servos' }), nema))
      .toBeLessThan(IDENTITY.GROUP_THRESHOLD);
  });

  it('degrades to no spec bonus on a partial record instead of throwing', () => {
    // Offers arrive over the wire from the Worker in phase 4. A record with no
    // specs must score, not crash — this is exactly what happened when the
    // client payload dropped the field and search died on `key in undefined`.
    const partial = mk({ name: 'NEMA 17 Stepper Motor', specs: undefined as never });
    expect(() => identity(partial, nema)).not.toThrow();
    expect(identity(partial, nema)).toBeGreaterThan(0);

    const alsoCanonical = { ...nema, specs: undefined as never };
    expect(() => identity(mk(), alsoCanonical)).not.toThrow();
  });
});

describe('freshness and trust — spec 7.4', () => {
  it('maps fetch tier to trust', () => {
    expect(trustOf(1)).toBe(TRUST[1]);
    expect(trustOf(2)).toBe(TRUST[2]);
    expect(trustOf(3)).toBe(TRUST[3]);
    expect(trustOf(1)).toBeGreaterThan(trustOf(2));
    expect(trustOf(2)).toBeGreaterThan(trustOf(3));
  });

  it('maps age to freshness, with curated treated as never stale', () => {
    expect(freshnessOf(null)).toBe(1.0);
    expect(freshnessOf(60_000)).toBe(1.0);
    expect(freshnessOf(10 * 60_000)).toBe(0.9);
    expect(freshnessOf(60 * 60_000)).toBe(0.5);
  });
});

describe('scoreOf — spec 7.4 formula', () => {
  it('is exactly the weighted sum', () => {
    const r = mk();
    const expected =
      RANK_WEIGHTS.relevance * relevanceOf(r, 'nema 17') +
      RANK_WEIGHTS.trust * trustOf(r.tier) +
      RANK_WEIGHTS.freshness * freshnessOf(r.ageMs);
    expect(scoreOf(r, 'nema 17')).toBeCloseTo(expected, 12);
  });

  it('weights sum to 1', () => {
    const sum = RANK_WEIGHTS.relevance + RANK_WEIGHTS.trust + RANK_WEIGHTS.freshness;
    expect(sum).toBeCloseTo(1, 12);
  });

  it('always returns a finite number', () => {
    expect(Number.isFinite(scoreOf(mk(), ''))).toBe(true);
    expect(Number.isFinite(scoreOf(mk(), '!!!"'))).toBe(true);
  });
});

describe('compareResults — deterministic total order', () => {
  it('breaks exact ties on vendor slug so ordering is stable', () => {
    const a = mk({ vendor: 'aaa' });
    const b = mk({ vendor: 'bbb' });
    expect(compareResults(a, b, 'nema 17')).toBeLessThan(0);
    expect(compareResults(b, a, 'nema 17')).toBeGreaterThan(0);
    // Antisymmetry — a total order, not a partial one.
    expect(Math.sign(compareResults(a, b, 'x'))).toBe(-Math.sign(compareResults(b, a, 'x')));
  });

  it('never reports 0 for two visibly different results', () => {
    const a = mk({ vendor: 'aaa', name: 'NEMA 17 Stepper Motor' });
    const b = mk({ vendor: 'bbb', name: 'NEMA 17 Stepper Motor' });
    expect(compareResults(a, b, 'nema 17')).not.toBe(0);
  });
});

describe('groupResults — spec 7.3', () => {
  it('groups results that match a canonical part', () => {
    const out = groupResults([mk(), mk({ vendor: 'robokits', url: 'https://robokits.co.in/p/2' })], [nema]);
    expect(out).toHaveLength(1);
    expect(out[0]!.canonical?.id).toBe('nema-17-stepper');
    expect(out[0]!.results).toHaveLength(2);
  });

  it('KEEPS unmatched results as ungrouped — never drops them', () => {
    const out = groupResults([mk({ name: 'MG996R Metal Gear Servo', category: 'servos' })], [nema]);
    const total = out.reduce((n, l) => n + l.results.length, 0);
    expect(total).toBe(1);
    expect(out.some((l) => l.canonical === null)).toBe(true);
  });

  it('never loses a single input result', () => {
    const input = [
      mk(),
      mk({ vendor: 'robokits', name: '42bygh' }),
      mk({ name: 'Totally Unrelated Widget', category: 'fasteners' }),
      mk({ name: 'MG996R Metal Gear Servo', category: 'servos' }),
    ];
    const out = groupResults(input, [nema]);
    expect(out.reduce((n, l) => n + l.results.length, 0)).toBe(input.length);
  });

  it('assigns partId on grouped results and null on ungrouped', () => {
    const out = groupResults([mk(), mk({ name: 'Unrelated Gizmo', category: 'fasteners' })], [nema]);
    const grouped = out.find((l) => l.canonical !== null)!;
    const stray = out.find((l) => l.canonical === null)!;
    expect(grouped.results[0]!.partId).toBe('nema-17-stepper');
    expect(stray.results[0]!.partId).toBeNull();
  });

  it('orders sellers within a group by trust, then freshness', () => {
    const out = groupResults([
      mk({ vendor: 'tier3', tier: 3, ageMs: 60_000 }),
      mk({ vendor: 'tier1', tier: 1, ageMs: 60_000 }),
      mk({ vendor: 'tier2', tier: 2, ageMs: 60_000 }),
    ], [nema]);
    expect(out[0]!.results.map((r) => r.tier)).toEqual([1, 2, 3]);
  });

  it('puts canonical parts before ungrouped strays', () => {
    const out = groupResults([mk(), mk({ name: 'Unrelated Gizmo', category: 'fasteners' })], [nema]);
    expect(out[0]!.canonical).not.toBeNull();
    expect(out[out.length - 1]!.canonical).toBeNull();
  });

  it('handles an empty result set and an empty canonical list', () => {
    expect(groupResults([], [nema])).toEqual([]);
    const out = groupResults([mk()], []);
    expect(out).toHaveLength(1);
    expect(out[0]!.canonical).toBeNull();
  });
});
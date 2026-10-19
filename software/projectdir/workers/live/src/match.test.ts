import { describe, it, expect } from 'vitest';
import { matchProduct, buildOffers } from './match';
import type { CanonicalPart, Vendor } from '../../../src/lib/schema';
import { DEEP_LINK_MIN, SEARCH_ONLY_MIN } from '../../../src/lib/offers';
import type { RawProduct } from './feeds';

const part = (over: Partial<CanonicalPart> = {}): CanonicalPart => ({
  id: 'nema-17-stepper',
  canonicalName: 'NEMA 17 Stepper Motor',
  aliases: ['42BYGH', 'NEMA17'],
  category: 'stepper-motors',
  specs: { HoldingTorque: '1.2 Nm' },
  vendors: ['robodo'],
  ...over,
});

const product = (over: Partial<RawProduct> = {}): RawProduct => ({
  vendorSlug: 'robodo',
  title: 'NEMA 17 Stepper Motor 42BYGH 1.8-degree',
  handle: 'nema-17-stepper-motor',
  permalink: 'https://robodo.in/products/nema-17-stepper-motor',
  image: 'https://cdn.shopify.com/s/files/x.jpg',
  tagsText: 'stepper motor 42bygh',
  priceMinor: 450,
  currency: 'INR',
  inStock: true,
  ...over,
});

const vendor: Vendor = {
  slug: 'robodo',
  name: 'Robodo',
  legalEntity: 'Robodo India',
  url: 'https://robodo.in/',
  city: 'Bengaluru',
  state: 'Karnataka',
  audiences: ['hobbyist', 'integrator'],
  categories: ['stepper-motors'],
  shipsPanIndia: true,
  blurb: 'Robotics components',
  verified: '2026-10-01',
  wholesale: {
    mode: 'none',
    moqInr: null,
    moqQty: null,
    quoteFlow: null,
    leadTimeNote: null,
    gstInvoice: true,
    institutionalKits: false,
  },
  search: {
    enabled: true,
    platform: 'shopify',
    tier: 1,
    note: '',
  },
};

describe('matchProduct', () => {
  it('matches an exact product title to its canonical part', () => {
    const m = matchProduct(product(), [part()]);
    expect(m?.partId).toBe('nema-17-stepper');
    expect(m?.confidence).toBeGreaterThanOrEqual(DEEP_LINK_MIN);
  });

  it('resolves via an alias when the title only carries the alias', () => {
    const m = matchProduct(product({ title: '42BYGH stepper motor' }), [part()]);
    expect(m?.partId).toBe('nema-17-stepper');
  });

  it('NEVER matches NEMA 23 to the NEMA 17 part', () => {
    // The digit signature is the identity. 17 and 23 are different motors and
    // sending a buyer to the wrong one is the worst failure this feature has.
    const m = matchProduct(product({ title: 'NEMA 23 Stepper Motor 1.2 Nm High Torque' }), [part()]);
    expect(m?.partId).not.toBe('nema-17-stepper');
  });

  it('ignores a contradicting alias in tags when the title disagrees', () => {
    // A vendor may tag a NEMA 23 with '42bygh' because they also stock it.
    // The title is the supplier's claim; tags must not override it.
    const m = matchProduct(
      product({ title: 'NEMA 23 Stepper Motor 1.2 Nm', tagsText: 'stepper motor 42bygh' }),
      [part()],
    );
    expect(m?.partId).not.toBe('nema-17-stepper');
  });

  it('NEVER matches MG995 to an MG996R part', () => {
    const mg996r = part({
      id: 'mg996r-servo',
      canonicalName: 'MG996R Metal Gear Servo',
      aliases: [],
      category: 'servos',
      specs: {},
      vendors: ['robodo'],
    });
    const m = matchProduct(product({ title: 'MG995 Metal Gear Servo 9g' }), [mg996r]);
    expect(m?.partId).not.toBe('mg996r-servo');
  });

  it('does not match an unrelated product to any part', () => {
    const m = matchProduct(
      product({ title: 'Dream Polymer PETG Filament 1.75mm Sky Blue', tagsText: '3d printing filament' }),
      [part()],
    );
    expect(m).toBeNull();
  });

  it('returns null when the part list is empty', () => {
    expect(matchProduct(product(), [])).toBeNull();
  });

  it('rounds confidence to 2 decimals', () => {
    const m = matchProduct(product(), [part()]);
    expect(m).not.toBeNull();
    expect(Number(m!.confidence.toFixed(2))).toBe(m!.confidence);
  });

  it('survives title drift: marketing padding still matches, with lower confidence', () => {
    // A supplier rewrites titles between refreshes. The offer must degrade to a
    // search link rather than disappear, and the drop must be visible.
    const clean = matchProduct(product(), [part()])!;
    const drifted = matchProduct(
      product({ title: 'BEST SELLER!!! NEMA 17 Stepper Motor 42BYGH 1.8-degree FREE SHIPPING' }),
      [part()],
    );
    expect(drifted?.partId).toBe('nema-17-stepper');
    expect(drifted!.confidence).toBeLessThanOrEqual(clean.confidence);
    expect(drifted!.confidence).toBeGreaterThanOrEqual(SEARCH_ONLY_MIN);
  });
});

describe('buildOffers', () => {
  it('never emits a fallback entry', () => {
    // The Worker emits only real matches. Fallbacks are the client's job.
    const offers = buildOffers([product()], vendor, [part()]);
    expect(offers.every((o) => o.isDeepLink === true)).toBe(true);
  });

  it('excludes products below the deep-link threshold', () => {
    const offers = buildOffers(
      [product({ title: 'Dream Polymer PETG Filament Sky Blue', tagsText: '3d printing filament' })],
      vendor,
      [part()],
    );
    expect(offers).toHaveLength(0);
  });

  it('carries the supplier name and slug onto every offer', () => {
    const [o] = buildOffers([product()], vendor, [part()]);
    expect(o?.vendorSlug).toBe('robodo');
    expect(o?.vendorName).toBe('Robodo');
  });

  it('caps at 5 offers for one vendor and one part', () => {
    const many = Array.from({ length: 12 }, (_, i) =>
      product({ title: `NEMA 17 Stepper Motor 42BYGH variant ${i}` }),
    );
    expect(buildOffers(many, vendor, [part()]).length).toBeLessThanOrEqual(5);
  });

  it('never renders a price of 0 when the feed gives none', () => {
    const [o] = buildOffers([product({ priceMinor: null, currency: null })], vendor, [part()]);
    expect(o?.price).toBeNull();
  });

  it('preserves a genuine zero price rather than nulling it', () => {
    const [o] = buildOffers([product({ priceMinor: 0, currency: 'INR' })], vendor, [part()]);
    expect(o?.price?.amount).toBe(0);
    expect(o?.price?.formatted).toBe('₹0.00');
  });

  it('marks an out-of-stock product rather than dropping it', () => {
    const [o] = buildOffers([product({ inStock: false })], vendor, [part()]);
    expect(o?.inStock).toBe(false);
  });

  it('formats an INR price with its symbol', () => {
    const [o] = buildOffers([product({ priceMinor: 1026.6, currency: 'INR' })], vendor, [part()]);
    expect(o?.price?.formatted).toContain('1,026.60');
  });

  it('omits the currency symbol when the feed supplies no currency', () => {
    // Shopify sends no currency at all, and 7 of 9 fetchable vendors are
    // Shopify. Guessing INR here would misstate a foreign price.
    const [o] = buildOffers([product({ priceMinor: 450, currency: null })], vendor, [part()]);
    expect(o?.price?.currency).toBeNull();
    expect(o?.price?.formatted).not.toContain('₹');
  });
});
describe('digit gate: the reviewed regression cases', () => {
  const nema = part();
  const rpi = part({
    id: 'raspberry-pi-5', canonicalName: 'Raspberry Pi 5', aliases: ['raspberry pi'],
    category: 'microcontrollers', specs: {}, vendors: ['robodo'],
  });

  it('does not deep-link a stepper DRIVER CONTROLLER as a stepper motor', () => {
    // Found by the final reviewer using this branch's own captured fixture.
    // The alias "nema 17" is a substring of this title, so a flat containment
    // bonus used to score it 0.95 and deep-link it as the motor.
    const m = matchProduct(
      product({ title: 'NEMA 17 Stepper Driver Controller Board', tagsText: 'driver controller' }),
      [nema],
    );
    expect(m === null || m.confidence < DEEP_LINK_MIN).toBe(true);
  });

  it('does not deep-link a ROCK Pi as a Raspberry Pi 5', () => {
    const m = matchProduct(product({ title: 'ROCK Pi S0 SBC Kit', tagsText: '' }), [rpi]);
    expect(m === null || m.partId !== 'raspberry-pi-5' || m.confidence < DEEP_LINK_MIN).toBe(true);
  });

  it('still deep-links the genuine motor', () => {
    const m = matchProduct(product({ title: 'NEMA 17 Stepper Motor 42BYGH 1.8deg' }), [nema]);
    expect(m?.confidence).toBeGreaterThanOrEqual(DEEP_LINK_MIN);
  });
});
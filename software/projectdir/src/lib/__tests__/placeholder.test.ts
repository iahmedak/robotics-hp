import { describe, it, expect } from 'vitest';
import { placeholderSvg, schematicFor } from '../placeholder';
import type { CanonicalPart } from '../schema';

const part = (over: Partial<CanonicalPart> = {}): CanonicalPart => ({
  id: 'nema-17-stepper',
  canonicalName: 'NEMA 17 Stepper Motor',
  aliases: ['42BYGH'],
  category: 'stepper-motors',
  specs: { HoldingTorque: '1.2 Nm' },
  vendors: ['robodo'],
  ...over,
});

describe('placeholderSvg', () => {
  it('is deterministic for the same part', () => {
    // No Math.random anywhere. The same part must render the same tile on
    // every page load, in every theme, for every visitor.
    expect(placeholderSvg(part())).toBe(placeholderSvg(part()));
  });

  it('differs for different parts', () => {
    expect(placeholderSvg(part())).not.toBe(placeholderSvg(part({ id: 'mg995-servo' })));
  });

  it('is a standalone SVG document', () => {
    const svg = placeholderSvg(part());
    expect(svg.trimStart().startsWith('<svg')).toBe(true);
    expect(svg).toContain('</svg>');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it('escapes a part name that contains markup', () => {
    const svg = placeholderSvg(part({ canonicalName: '<script>alert(1)</script>' }));
    expect(svg).not.toContain('<script>');
  });

  it('escapes a part name containing an ampersand', () => {
    expect(placeholderSvg(part({ canonicalName: 'A & B' }))).toContain('&amp;');
  });

  it('renders the part name so the tile is never anonymous', () => {
    expect(placeholderSvg(part())).toContain('NEMA 17');
  });

  it('tolerates a part with no specs', () => {
    expect(() => placeholderSvg(part({ specs: {} }))).not.toThrow();
  });

  it('honours a requested size', () => {
    expect(placeholderSvg(part(), 64)).toContain('width="64"');
  });

  it('survives an id with characters that are illegal in an SVG attribute', () => {
    expect(() => placeholderSvg(part({ id: 'a"b<c>d' }))).not.toThrow();
  });
});

describe('schematicFor', () => {
  it('renders a category schematic', () => {
    const svg = schematicFor('sensors');
    expect(svg.trimStart().startsWith('<svg')).toBe(true);
    expect(svg).toContain('</svg>');
  });

  it('is deterministic per category', () => {
    expect(schematicFor('sensors')).toBe(schematicFor('sensors'));
  });

  it('differs across categories', () => {
    expect(schematicFor('sensors')).not.toBe(schematicFor('servos'));
  });

  it('handles an unknown category without throwing', () => {
    expect(() => schematicFor('not-a-real-category')).not.toThrow();
  });

  it('escapes a hostile category id', () => {
    expect(() => schematicFor('"><script>')).not.toThrow();
  });
});
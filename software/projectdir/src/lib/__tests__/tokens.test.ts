import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * WCAG 2.1 relative luminance and contrast ratio (spec §4.1).
 * Parsed straight out of tokens.css so the test fails if a token is changed
 * without re-verifying it — the file is the contract, not a comment.
 */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.trim().replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrastRatio(a: string, b: string): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

const tokensCss = readFileSync(
  fileURLToPath(new URL('../../styles/tokens.css', import.meta.url)),
  'utf-8',
);

/** Read a token value out of a named block of tokens.css. */
function token(name: string, block: 'light' | 'dark'): string {
  const startMarker = block === 'light' ? ':root {' : ":root[data-theme='dark']";
  const start = tokensCss.indexOf(startMarker);
  if (start < 0) throw new Error(`could not locate the ${block} block in tokens.css`);
  const end = block === 'light'
    ? tokensCss.indexOf(":root[data-theme='dark']")
    : tokensCss.indexOf('@media');
  const scoped = tokensCss.slice(start, end < 0 ? undefined : end);
  const m = scoped.match(new RegExp(`${name}:\\s*(#[0-9A-Fa-f]{3,6})`));
  if (!m) throw new Error(`token --pd-${name} not found in ${block} block`);
  return m[1]!;
}

describe('design tokens — WCAG 2.1 AA', () => {
  for (const theme of ['light', 'dark'] as const) {
    describe(theme, () => {
      const bg = () => token('bg', theme);
      const surface = () => token('surface', theme);

      it('page background is never pure white or pure black', () => {
        const v = bg().toLowerCase();
        // Spec §Global Constraints: pure #fff glares, pure #000 blooms on OLED.
        expect(v).not.toBe('#ffffff');
        expect(v).not.toBe('#000000');
      });

      it('body text is at least 4.5:1 on the page background', () => {
        expect(contrastRatio(token('fg', theme), bg())).toBeGreaterThanOrEqual(4.5);
      });

      it('muted text is at least 4.5:1 on the page background', () => {
        expect(contrastRatio(token('fg-muted', theme), bg())).toBeGreaterThanOrEqual(4.5);
      });

      it('accent text is at least 4.5:1 on both backgrounds', () => {
        expect(contrastRatio(token('accent', theme), bg())).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(token('accent', theme), surface())).toBeGreaterThanOrEqual(4.5);
      });

      it('text on an accent fill is at least 4.5:1', () => {
        expect(contrastRatio(token('accent-ink', theme), token('accent', theme)))
          .toBeGreaterThanOrEqual(4.5);
      });

      it('warning text is at least 4.5:1 on the surface', () => {
        expect(contrastRatio(token('warn', theme), surface())).toBeGreaterThanOrEqual(4.5);
      });

      it('UI boundaries are at least 3:1 — WCAG 1.4.11', () => {
        // This is the check that caught the 1.26:1 card border in review.
        expect(contrastRatio(token('border', theme), bg())).toBeGreaterThanOrEqual(3);
        expect(contrastRatio(token('border', theme), surface())).toBeGreaterThanOrEqual(3);
      });
    });
  }

  it('light and dark actually differ', () => {
    expect(token('bg', 'light')).not.toBe(token('bg', 'dark'));
    expect(token('fg', 'light')).not.toBe(token('fg', 'dark'));
  });
});
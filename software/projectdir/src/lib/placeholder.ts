import { escapeHtml } from './html';
import type { CanonicalPart } from './schema';

/**
 * Generated schematics, not photographs.
 *
 * There is no licensed photograph of most of these parts, and hotlinking a
 * supplier's own photo is exactly the fragility the placeholder exists to
 * absorb. So a missing image gets a deliberate diagram instead of a broken
 * glyph, and nothing about it is a pretend picture.
 *
 * Everything here is deterministic. Math.random would give every visitor a
 * different tile on every load, which reads as a rendering bug.
 */

/** Stable 32-bit hash. Same input, same number, every time. */
function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const INK = '#0F1419';
const PAPER = '#F6F4EF';
const ACCENT = '#F2A03D';
const GRID = '#1B4D8F';

/** Glyphs chosen by category group, so tiles look related within a family. */
const GROUP_HUE: Record<string, string> = {
  actuation: '#E4572E',
  transmission: '#F2A03D',
  sensing: '#17BEBB',
  control: '#4A7DFF',
  power: '#B36BE3',
  structure: '#8C9BA8',
};


/** Category groups, keyed by the singular stem of a real category id. */
const CATEGORY_GROUP: Record<string, string> = {
  servo: 'actuation',
  stepper: 'actuation',
  'dc-motor': 'actuation',
  'bldc-motor': 'actuation',
  'linear-actuator': 'actuation',
  pneumatic: 'actuation',
  gearmotor: 'actuation',

  bearing: 'transmission',
  gear: 'transmission',
  gearbox: 'transmission',
  belt: 'transmission',
  coupler: 'transmission',
  'lead-screw': 'transmission',
  encoder: 'transmission',
  'force-torque': 'transmission',

  sensor: 'sensing',
  proximity: 'sensing',
  limit: 'sensing',
  imu: 'sensing',
  camera: 'sensing',
  lidar: 'sensing',

  microcontroller: 'control',
  'motor-drive': 'control',
  plc: 'control',

  'power-suppl': 'power',
  batter: 'power',

  aluminium: 'structure',
  'linear-guide': 'structure',
  fastener: 'structure',
  'bracket': 'structure',
  'plate': 'structure',
};

/**
 * Group for a category id.
 *
 * Matches a singular stem against the id so plurals and suffixes resolve
 * without enumerating all 27. An unknown id falls back to 'structure' rather
 * than throwing: a new category added later must still render a tile.
 */
const groupOf = (category: string): string => {
  for (const [stem, group] of Object.entries(CATEGORY_GROUP)) {
    if (category.startsWith(stem)) return group;
  }
  return 'structure';
};


const hueFor = (id: string, category: string): string =>
  GROUP_HUE[groupOf(category)] ?? '#F2A03D';

/**
 * A schematic glyph per category.
 *
 * Simple deterministic line art - a rotor, a gear, a chip, a sensor - rather
 * than an icon font, so nothing depends on a network request or a font load.
 */
function glyphFor(category: string): string {
  const group = groupOf(category);
  switch (group) {
    case 'actuation':
      return `<circle cx="50" cy="50" r="16" fill="none" stroke="currentColor" stroke-width="3"/>
        <circle cx="50" cy="50" r="5" fill="currentColor"/>
        <path d="M50 26v-9M50 74v9M26 50h-9M74 50h9" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`;
    case 'transmission':
      return `<circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="7 5"/>
        <circle cx="50" cy="50" r="8" fill="none" stroke="currentColor" stroke-width="3"/>`;
    case 'sensing':
      return `<path d="M32 58a18 18 0 0 1 36 0" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
        <circle cx="50" cy="66" r="4" fill="currentColor"/>
        <path d="M40 58a10 10 0 0 1 20 0" fill="none" stroke="currentColor" stroke-width="2" opacity="0.6"/>`;
    case 'control':
      return `<rect x="30" y="30" width="40" height="40" rx="4" fill="none" stroke="currentColor" stroke-width="3"/>
        <path d="M40 24v-6M50 24v-8M60 24v-6M40 76v6M50 84v6M60 76v6M24 40h-6M24 50h-8M24 60h-6M82 40h-6M82 50h-8M82 60h-6"
          stroke="currentColor" stroke-width="3" stroke-linecap="round"/>`;
    case 'power':
      return `<rect x="34" y="26" width="32" height="48" rx="4" fill="none" stroke="currentColor" stroke-width="3"/>
        <path d="M42 26v-6h16v6" fill="none" stroke="currentColor" stroke-width="3"/>
        <path d="M53 38l-8 14h9l-3 12 10-16h-9z" fill="currentColor"/>`;
    default:
      return `<rect x="30" y="34" width="40" height="32" rx="3" fill="none" stroke="currentColor" stroke-width="3"/>
        <path d="M30 46h-8M30 56h-8M78 46h8M78 56h8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
        <circle cx="42" cy="40" r="3" fill="currentColor"/>`;
  }
}

function frame(inner: string, size: number, hue: string, gridOpacity: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" role="img">
  <defs><pattern id="g" width="10" height="10" patternUnits="userSpaceOnUse">
    <path d="M10 0H0V10" fill="none" stroke="${GRID}" stroke-width="0.6" opacity="${gridOpacity}"/>
  </pattern></defs>
  <rect width="100" height="100" rx="8" fill="${INK}"/>
  <rect width="100" height="100" rx="8" fill="url(#g)"/>
  <g color="${hue}">${inner}</g>
</svg>`;
}

/** A schematic for a category id. Used by vendor-profile category tiles. */
export function schematicFor(category: string, size = 100): string {
  return frame(glyphFor(category), size, hueFor(category, category), 0.35);
}

/**
 * A schematic for one canonical part.
 *
 * The tile carries the part's name, so a search result with no photograph is
 * still identifiable rather than a blank square with a glyph in it.
 */
export function placeholderSvg(part: CanonicalPart, size = 100): string {
  const hue = hueFor(part.id, part.category);
  const label = escapeHtml(part.canonicalName);
  const id = escapeHtml(part.id);
  const variant = hash(part.id) % 3;

  // Rotation varies per part so a grid of placeholders does not look stamped
  // from one die, while staying identical for a given part.
  const rotation = variant * 15;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="${label}">
  <defs><pattern id="g" width="10" height="10" patternUnits="userSpaceOnUse">
    <path d="M10 0H0V10" fill="none" stroke="${GRID}" stroke-width="0.6" opacity="0.35"/>
  </pattern></defs>
  <rect width="100" height="100" rx="8" fill="${INK}"/>
  <rect width="100" height="100" rx="8" fill="url(#g)"/>
  <g transform="rotate(${rotation} 50 50)" color="${hue}">${glyphFor(part.category)}</g>
  <text x="50" y="92" font-family="ui-monospace, monospace" font-size="6" fill="${PAPER}"
        text-anchor="middle" opacity="0.75">${truncate(label, 22)}</text>
  <title>${label}</title>
  <desc data-part="${id}">No product photograph available.</desc>
</svg>`;
}

const truncate = (s: string, max: number): string => (s.length <= max ? s : `${s.slice(0, max - 1)}…`);

/** A data URI usable as an img src, for the no-JS fallback path. */
export function placeholderDataUri(part: CanonicalPart, size = 100): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(placeholderSvg(part, size))}`;
}
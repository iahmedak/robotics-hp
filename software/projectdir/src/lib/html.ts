/**
 * HTML escaping.
 *
 * Centralised because the same subtly-broken helper was copy-pasted into three
 * places: with `noUncheckedIndexedAccess` a bare `MAP[ch]` is `string | undefined`,
 * so `.replace(ch => MAP[ch])` fails typecheck. The `?? ch` fallback removes the
 * ambiguity — an unmapped char is by definition safe to pass through.
 */

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Escape for text nodes and double-quoted attribute values. */
export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ESCAPES[ch] ?? ch);
}

/** Escape a value destined for a JS string inside an inline <script>. */
export function escapeJson(value: unknown): string {
  return JSON.stringify(value ?? null)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
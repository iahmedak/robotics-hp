import { describe, it, expect } from 'vitest';
import { escapeHtml, escapeJson } from '../html';

describe('escapeHtml', () => {
  it('escapes every character that can break out of markup', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    expect(escapeHtml('a & b')).toBe('a &amp; b');
    expect(escapeHtml('say "hi"')).toBe('say &quot;hi&quot;');
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('neutralises an attribute break-out attempt', () => {
    const hostile = '" onerror="alert(1)';
    expect(escapeHtml(hostile)).not.toContain('"');
    expect(escapeHtml(hostile)).toBe('&quot; onerror=&quot;alert(1)');
  });

  it('neutralises an img onerror payload', () => {
    const out = escapeHtml('<img src=x onerror=alert(1)>');
    expect(out).not.toMatch(/<img/);
  });

  it('passes safe text through unchanged', () => {
    expect(escapeHtml('NEMA 17 Stepper Motor')).toBe('NEMA 17 Stepper Motor');
    expect(escapeHtml('42BYGH')).toBe('42BYGH');
  });

  it('handles null, undefined and non-strings without throwing', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
    expect(escapeHtml(42)).toBe('42');
  });

  it('is idempotent-safe: escaping twice does not corrupt', () => {
    const once = escapeHtml('a & b');
    expect(escapeHtml(once)).toBe('a &amp;amp; b'); // documented double-escape, not silent corruption
  });
});

describe('escapeJson', () => {
  it('produces parseable JSON for a plain object', () => {
    expect(JSON.parse(escapeJson({ a: 1 }))).toEqual({ a: 1 });
  });

  it('escapes angle brackets so a payload cannot close a script tag', () => {
    const out = escapeJson({ bio: '</script><script>alert(1)</script>' });
    expect(out).not.toContain('</script>');
    expect(JSON.parse(out).bio).toBe('</script><script>alert(1)</script>');
  });
});
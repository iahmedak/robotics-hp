/**
 * Permanent member-ID registry tests — no Discord connection required.
 *   node test/members.test.js
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { MemberRegistry, MEMBER_ID_PATTERN } from '../src/members.js';

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vic-members-'));
const fresh = () => path.join(tmpDir, `m${Math.random().toString(36).slice(2)}.json`);

console.log('\n— id format —');

test('issues zero-padded sequential ids', () => {
  const r = new MemberRegistry(fresh());
  assert.equal(r.issue('1'), 'VIC-MEM-001');
  assert.equal(r.issue('2'), 'VIC-MEM-002');
  assert.equal(r.issue('3'), 'VIC-MEM-003');
});

test('widens past 999 instead of truncating', () => {
  const r = new MemberRegistry(fresh());
  for (let i = 0; i < 1000; i++) r.issue(String(i));
  assert.equal(r.issue('1000'), 'VIC-MEM-1001');
});

test('every issued id matches the published pattern', () => {
  const r = new MemberRegistry(fresh());
  r.issue('a'); r.issue('b');
  for (const rec of r.all()) {
    assert.ok(MEMBER_ID_PATTERN.test(rec.memberId), `${rec.memberId} must match`);
  }
});

console.log('\n— never reused (the important one) —');

test('counter never rewinds after a revocation', () => {
  const r = new MemberRegistry(fresh());
  r.issue('1');
  r.issue('2');
  r.revoke('1');
  // If revoke() rewound the count this would be VIC-MEM-002 — two people
  // holding the same permanent id. That is the bug this test exists for.
  assert.equal(r.issue('3'), 'VIC-MEM-003');
});

test('counter never rewinds after revoking everyone', () => {
  const r = new MemberRegistry(fresh());
  r.issue('1'); r.issue('2'); r.issue('3');
  r.revoke('1'); r.revoke('2'); r.revoke('3');
  assert.equal(r.issue('4'), 'VIC-MEM-004');
});

test('revocation keeps the record, flagged revoked', () => {
  const r = new MemberRegistry(fresh());
  r.issue('9', { divisions: ['CIS'] });
  const gone = r.revoke('9');
  assert.ok(gone.revokedAt, 'revokedAt must be set');
  assert.equal(r.get('9').discordId, '9');
  assert.equal(r.get('9').memberId, gone.memberId, 'the id stays reserved');
});

console.log('\n— idempotency —');

test('issue is idempotent per discord id', () => {
  const r = new MemberRegistry(fresh());
  assert.equal(r.issue('7'), 'VIC-MEM-001');
  assert.equal(r.issue('7'), 'VIC-MEM-001');
  assert.equal(r.count(), 1);
});

test('meta is merged, not overwritten, on re-issue', () => {
  const r = new MemberRegistry(fresh());
  r.issue('7', { divisions: ['CIS'] });
  r.issue('7', { email: 'a@b.c' });
  assert.equal(r.get('7').divisions[0], 'CIS');
  assert.equal(r.get('7').email, 'a@b.c');
});

console.log('\n— persistence —');

test('survives a reload from disk', () => {
  const p = fresh();
  const a = new MemberRegistry(p);
  a.issue('1'); a.issue('2');
  const b = new MemberRegistry(p);
  assert.equal(b.count(), 2);
  assert.equal(b.issue('3'), 'VIC-MEM-003');
});

test('a corrupt file loads empty rather than throwing', () => {
  const p = fresh();
  fs.writeFileSync(p, '{ this is not json');
  const r = new MemberRegistry(p);
  assert.equal(r.count(), 0);
  assert.equal(r.issue('1'), 'VIC-MEM-001');
});

test('revoking an unknown id returns null', () => {
  const r = new MemberRegistry(fresh());
  assert.equal(r.revoke('nobody'), null);
});

fs.rmSync(tmpDir, { recursive: true, force: true });
console.log(`\n${passed} passed${process.exitCode ? ', with failures' : ''}\n`);
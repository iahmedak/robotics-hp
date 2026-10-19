/**
 * Role admin tests — no Discord connection required.
 *   node test/roleadmin.test.js
 */

import assert from 'node:assert/strict';
import {
  parseDuration, formatDuration, canGrantRole,
  TempRoleStore, MAX_TEMP_MS,
} from '../src/roleadmin.js';

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}

console.log('\n— duration parsing —');

test('parses m / h / d', () => {
  assert.equal(parseDuration('10m'), 600_000);
  assert.equal(parseDuration('2h'), 7_200_000);
  assert.equal(parseDuration('7d'), 604_800_000);
});

test('tolerates spaces and case', () => {
  assert.equal(parseDuration(' 30 M '), 1_800_000);
  assert.equal(parseDuration('2H'), 7_200_000);
});

test('rejects garbage and non-positive', () => {
  for (const bad of ['', 'soon', '10x', 'm', '0m', '-5m', null, undefined]) {
    assert.equal(parseDuration(bad), null, `"${bad}" should not parse`);
  }
});

test('formats durations readably', () => {
  assert.equal(formatDuration(600_000), '10m');
  assert.equal(formatDuration(7_200_000), '2h');
  assert.equal(formatDuration(604_800_000), '7d');
  assert.equal(formatDuration(90_000_000), '1d 1h');
});

console.log('\n— hierarchy guard —');

const role = (name, position, managed = false) => ({ name, position, managed });

test('allows granting a role below the bot', () => {
  assert.equal(canGrantRole(role('✅ Member', 6), 12).ok, true);
});

test('refuses a role at or above the bot', () => {
  // The bot's highest role is position 12 (its managed integration role).
  // Anything strictly below that is grantable — including Founder at 11.
  assert.equal(canGrantRole(role('⚡ Founder', 11), 12).ok, true, 'below the bot is grantable');
  const atSame = canGrantRole(role('🤖 Bot', 12), 12);
  assert.equal(atSame.ok, false);
  assert.match(atSame.reason, /at or above/i);
  const above = canGrantRole(role('Overlord', 13), 12);
  assert.equal(above.ok, false);
});

test('refuses @everyone and integration-managed roles', () => {
  assert.equal(canGrantRole(role('@everyone', 0), 12).ok, false);
  assert.equal(canGrantRole(role('vic-t1', 12, true), 12).ok, false);
});

test('missing role is refused', () => {
  assert.equal(canGrantRole(null, 12).ok, false);
});

console.log('\n— temp role store —');

test('adds, finds and removes an entry', () => {
  const s = new TempRoleStore();
  s.add({ userId: 'u1', roleId: 'r1', roleName: '⚙️ ERS', expiresAt: new Date(Date.now() + 60_000).toISOString() });
  assert.equal(s.pendingFor('u1').length, 1);
  assert.equal(s.remove('u1', 'r1').roleName, '⚙️ ERS');
  assert.equal(s.pendingFor('u1').length, 0);
});

test('same user + same role is idempotent', () => {
  const s = new TempRoleStore();
  const exp = new Date(Date.now() + 60_000).toISOString();
  s.add({ userId: 'u1', roleId: 'r1', roleName: 'A', expiresAt: exp });
  s.add({ userId: 'u1', roleId: 'r1', roleName: 'A', expiresAt: exp });
  assert.equal(s.entries.size, 1);
});

test('different roles for one user coexist', () => {
  const s = new TempRoleStore();
  const exp = new Date(Date.now() + 60_000).toISOString();
  s.add({ userId: 'u1', roleId: 'r1', roleName: 'A', expiresAt: exp });
  s.add({ userId: 'u1', roleId: 'r2', roleName: 'B', expiresAt: exp });
  assert.equal(s.pendingFor('u1').length, 2);
});

test('expired() only returns lapsed entries', () => {
  const s = new TempRoleStore();
  s.add({ userId: 'u1', roleId: 'r1', roleName: 'A', expiresAt: new Date(Date.now() - 1000).toISOString() });
  s.add({ userId: 'u2', roleId: 'r2', roleName: 'B', expiresAt: new Date(Date.now() + 60_000).toISOString() });
  assert.equal(s.expired().length, 1);
  assert.equal(s.expired()[0].userId, 'u1');
});

test('MAX_TEMP_MS is under 28 days', () => {
  assert.ok(MAX_TEMP_MS <= 28 * 86_400_000);
});

console.log(`\n${passed} passed${process.exitCode ? ', with failures' : ''}\n`);
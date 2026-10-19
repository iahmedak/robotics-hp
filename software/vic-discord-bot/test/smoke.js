/**
 * Runtime smoke test — no network, no Discord connection.
 * Proves the pure logic (config guard, card builder, rate limiter)
 * behaves correctly before you ever touch the real server.
 *
 *   node test/smoke.js
 */

import assert from 'node:assert/strict';
import { buildReviewCard, buildApprovedDM, buildRejectedDM } from '../src/card.js';
import { isRateLimited, recordAction } from '../src/logger.js';
import { config, describeConfig, normalizeRoleName } from '../src/config.js';

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}\n    ${err.message}`);
    process.exitCode = 1;
  }
}

console.log('\n— card.js —');

test('review card renders a pending application with VIC ID', () => {
  const card = buildReviewCard(
    {
      id: 'APP-2026-000123',
      full_name: 'Aarav Sharma',
      email: 'aarav@example.com',
      discord_username: 'aarav_dev',
      division_id: 'VIC-DIV-002',
      // Site stores these as JSON strings (JSON.stringify on submit).
      skills: '["Robotics", "Embedded C"]',
      interests: '["AI", "Drones"]',
      motivation: 'I want to build line-following robots and learn ROS.',
      experience: 'Arduino basics, one hackathon.',
    },
    'Computing & Intelligent Sciences'
  );
  assert.match(card.embeds[0].title, /Aarav Sharma/);
  const fieldText = card.embeds[0].fields.map((f) => `${f.name}:${f.value}`).join('\n');
  assert.match(fieldText, /APP-2026-000123/, 'VIC ID must appear');
  assert.match(fieldText, /Computing & Intelligent Sciences/, 'division must appear');
  assert.match(fieldText, /Robotics, Embedded C/, 'skills JSON string must be split');
  assert.match(fieldText, /line-following robots/, 'motivation must appear on the card');
  assert.match(fieldText, /Arduino basics/, 'experience must appear on the card');
});

test('review card omits motivation/experience when absent', () => {
  const card = buildReviewCard(
    { id: 'APP-9', full_name: 'Z', motivation: null, experience: '  ' },
    'D'
  );
  const names = card.embeds[0].fields.map((f) => f.name).join('\n');
  assert.doesNotMatch(names, /Why they want in/);
  assert.doesNotMatch(names, /Experience/);
});

test('review card clips a very long motivation', () => {
  const card = buildReviewCard(
    { id: 'APP-9', full_name: 'Z', motivation: 'x'.repeat(3000) },
    'D'
  );
  const field = card.embeds[0].fields.find((f) => /Why they want in/.test(f.name));
  assert.ok(field.value.length <= 1024, `field too long: ${field.value.length}`);
  assert.match(field.value, /…$/);
});

test('review card exposes exactly two buttons', () => {
  const card = buildReviewCard({ id: 'APP-1', full_name: 'X' }, 'Y');
  const buttons = card.components[0].components;
  assert.equal(buttons.length, 2);
  assert.equal(buttons[0].custom_id, 'vic:approve:APP-1');
  assert.equal(buttons[1].custom_id, 'vic:reject:APP-1');
});

test('missing skills/interests do not crash and show a fallback', () => {
  const card = buildReviewCard({ id: 'APP-2', full_name: 'Y', skills: null, interests: null }, null);
  const fieldText = card.embeds[0].fields.map((f) => f.value).join('\n');
  assert.match(fieldText, /none listed/);
});

test('approval DM contains name, VIC ID and division', () => {
  const dm = buildApprovedDM(
    { id: 'APP-2026-000999', full_name: 'Ishita Rao', skills: '{Python, ROS}' },
    'Computing & Intelligent Sciences',
    'APP-2026-000999'
  );
  const body = JSON.stringify(dm.embeds[0]);
  assert.match(body, /Ishita Rao/, 'applicant name must be in the DM');
  assert.match(body, /APP-2026-000999/, 'VIC ID must be in the DM');
  assert.match(body, /Computing & Intelligent Sciences/, 'division must be in the DM');
  assert.match(body, /approved/i);
});

test('rejection DM includes the reason', () => {
  const dm = buildRejectedDM({ id: 'APP-3', full_name: 'Karan' }, 'Selection is full this intake.');
  assert.match(JSON.stringify(dm.embeds[0]), /Selection is full this intake\./);
});

console.log('\n— logger.js (rate limiting) —');

test('5 actions allowed, 6th blocked inside the window', () => {
  const uid = 'user-rate-test';
  const limit = 5;
  const windowMs = 60_000;
  for (let i = 0; i < 5; i++) {
    assert.equal(isRateLimited(uid, { limit, windowMs }), false, `action ${i + 1} should pass`);
    recordAction(uid);
  }
  assert.equal(isRateLimited(uid, { limit, windowMs }), true, '6th action must be blocked');
});

test('rate limit is per-user, not global', () => {
  assert.equal(isRateLimited('someone-else', { limit: 5, windowMs: 60_000 }), false);
});

test('expired entries fall out of the window', async () => {
  const uid = 'user-window-test';
  recordAction(uid);
  // window of 1ms → previous entry is now stale
  await new Promise((r) => setTimeout(r, 20));
  assert.equal(isRateLimited(uid, { limit: 1, windowMs: 1 }), false);
});
console.log('\n- config role keys -');

test('exposes the five charter officer roles', () => {
  assert.equal(config.roles.executiveDirector, '🎖️ Executive Director');
  assert.equal(config.roles.operationsDirector, '⚙️ Director of Operations');
  assert.equal(config.roles.ersDirector, '📋 ERS Director');
  assert.equal(config.roles.cisDirector, '💻 CIS Director');
  assert.equal(config.roles.ewoDirector, '📣 EWO Director');
});

test('division ids are unchanged and OOA replaced OAD by name only', () => {
  const ids = Object.keys(config.roles.divisions).sort();
  assert.deepEqual(ids, ['VIC-DIV-001', 'VIC-DIV-002', 'VIC-DIV-003', 'VIC-DIV-004']);
  for (const id of ids) assert.match(id, /^VIC-DIV-\d{3}$/);
  assert.ok(!Object.values(config.roles.divisions).some((v) => v.includes('OAD')));
});

test('normalizeRoleName treats VS16 variants as one role', () => {
  assert.equal(normalizeRoleName('⚙️ Director of Operations'), normalizeRoleName('⚙ Director of Operations'));
  assert.equal(normalizeRoleName('⚡  Founder'), '⚡ Founder');
  assert.equal(normalizeRoleName(null), '');
});

test('describeConfig never leaks a secret value', () => {
  const out = describeConfig();
  assert.ok(!out.includes(config.discord.token));
  assert.ok(out.includes('Division role map'));
});

console.log(`\n${passed} passed${process.exitCode ? ', with failures' : ''}\n`);

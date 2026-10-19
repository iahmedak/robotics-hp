/**
 * Moderation logic tests — no Discord connection required.
 *   node test/mod.test.js
 */

import assert from 'node:assert/strict';
import { screenContent, isRaidBurst, pushJoin } from '../src/moderation.js';

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}

console.log('\n— content screening —');

test('blocks discord invite links', () => {
  assert.match(screenContent('join https://discord.gg/abc123'), /invite/i);
  assert.match(screenContent('discord.com/invite/xyz'), /invite/i);
});

test('allows clean messages', () => {
  assert.equal(screenContent('our robot just finished the line follower!'), null);
  assert.equal(screenContent('see @user for the docs'), null);
});

test('blocks mass mentions', () => {
  assert.match(screenContent('@everyone stand up'), /mass mention/i);
  assert.match(screenContent('@here listen'), /mass mention/i);
});

test('blocks banned words case-insensitively', () => {
  const opts = { bannedWords: ['spammer'] };
  assert.match(screenContent('what a SPAMMER', opts), /banned word/i);
  assert.equal(screenContent('what a legend', opts), null);
});

test('staff bypasses the filter', () => {
  const opts = { bannedWords: ['spammer'], isStaff: true };
  assert.equal(screenContent('@everyone @here join discord.gg/abc', opts), null);
});

test('regex lastIndex does not leak between calls', () => {
  // Global regexes are stateful; a leak would make later messages slip through.
  assert.match(screenContent('discord.gg/one', {}), /invite/i);
  assert.match(screenContent('discord.gg/two', {}), /invite/i);
  assert.match(screenContent('discord.gg/three', {}), /invite/i);
});

test('empty content is not screened', () => {
  assert.equal(screenContent('', { bannedWords: ['x'] }), null);
  assert.equal(screenContent(null, {}), null);
});

console.log('\n— raid guard —');

test('normal join rate does not trigger', () => {
  const now = Date.now();
  const j = pushJoin([], now);
  pushJoin(j, now);
  pushJoin(j, now);
  assert.equal(isRaidBurst(j, now, { maxJoins: 5, windowMs: 10_000 }), false);
});

test('join spike triggers the guard', () => {
  const now = Date.now();
  const j = [];
  for (let i = 0; i < 6; i++) pushJoin(j, now);
  assert.equal(isRaidBurst(j, now, { maxJoins: 5, windowMs: 10_000 }), true);
});

test('old joins fall out of the window', () => {
  const now = Date.now();
  const j = [];
  for (let i = 0; i < 6; i++) pushJoin(j, now - 60_000);
  assert.equal(isRaidBurst(j, now, { maxJoins: 5, windowMs: 10_000 }), false);
});

test('join buffer is capped', () => {
  const now = Date.now();
  const j = [];
  for (let i = 0; i < 1000; i++) pushJoin(j, now);
  assert.ok(j.length <= 200, `buffer grew to ${j.length}`);
});

console.log(`\n${passed} passed${process.exitCode ? ', with failures' : ''}\n`);
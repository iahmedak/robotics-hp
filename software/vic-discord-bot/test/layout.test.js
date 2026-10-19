/**
 * Layout manifest tests — pure data, no Discord connection.
 *   node test/layout.test.js
 */

import assert from 'node:assert/strict';
import {
  CATEGORIES, CHANNELS, DIVISIONS, RENAMES, CATEGORY_RENAMES, REHOME, NEW_ROLES,
  categoryNumber, accessOf, categoryOfChannel, allChannelNames,
} from '../src/layout.js';
import { BITS, allowFor, denyFor, allowForTier, accessLevel, has } from '../src/permissions.js';

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}

console.log('\n— 13 categories —');

test('exactly 13, numbered 1..13 with no gaps', () => {
  assert.equal(CATEGORIES.length, 13);
  assert.deepEqual(CATEGORIES.map((c) => c.n), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
});

test('category names are the agreed ones, in order', () => {
  const names = CATEGORIES.map((c) => c.name);
  assert.equal(names[0], '01 🚪 START HERE');
  assert.equal(names[2], '03 📄 INFORMATION');
  assert.equal(names[3], '04 💬 COMMUNITY');
  assert.equal(names[12], '13 🗂️ BOT & MODERATION LOGS');
});

test('every category number has a channel list', () => {
  for (const { n } of CATEGORIES) {
    assert.ok(Array.isArray(CHANNELS[n]), `category ${n} has no channel list`);
    assert.ok(CHANNELS[n].length > 0, `category ${n} is empty`);
  }
  assert.deepEqual(Object.keys(CHANNELS).map(Number).sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
});

console.log('\n— no channel claimed twice —');

test('a channel name appears in exactly one category', () => {
  const seen = new Map();
  for (const [n, list] of Object.entries(CHANNELS)) {
    for (const c of list) {
      assert.ok(!seen.has(c.name), `${c.name} is in both category ${seen.get(c.name)} and ${n}`);
      seen.set(c.name, n);
    }
  }
});

test('#mod-log lives only in the logs category', () => {
  assert.equal(categoryOfChannel('#mod-log'), 13);
});

console.log('\n— divisions —');

test('four divisions, top-level at 07-10', () => {
  assert.deepEqual(Object.keys(DIVISIONS).sort(), ['CIS', 'ERS', 'EWO', 'OOA']);
  assert.deepEqual(
    ['ERS', 'CIS', 'EWO', 'OOA'].map((d) => DIVISIONS[d].category),
    [7, 8, 9, 10],
  );
});

test('OOA has no Director role and is led by the Director of Operations', () => {
  assert.equal(DIVISIONS.OOA.directorRole, null);
  assert.equal(DIVISIONS.OOA.role, '📋 OOA (Ops & Admin)');
  assert.equal(CATEGORIES.find((c) => c.n === 10).gate, '⚙️ Director of Operations');
});

test('no OOA Director role exists anywhere', () => {
  assert.equal(NEW_ROLES.filter((r) => /OOA\s*Director/.test(r.name)).length, 0);
  for (const r of NEW_ROLES) assert.doesNotMatch(r.name, /OOA/);
});

test('each division category has a voice room named for the division', () => {
  for (const key of ['ERS', 'CIS', 'EWO', 'OOA']) {
    const n = DIVISIONS[key].category;
    assert.ok(CHANNELS[n].some((c) => c.name === `${key} Team Meeting` && c.kind === 'voice'), `${key} voice missing`);
  }
});

console.log('\n— the ruleset has one home —');

test('#rules-and-regulations is in START HERE exactly once', () => {
  const homes = Object.entries(CHANNELS).filter(([, l]) => l.some((c) => c.name === '#rules-and-regulations'));
  assert.equal(homes.length, 1);
  assert.equal(Number(homes[0][0]), 1);
});

test('START HERE is applicant-readable, so members can read it too', () => {
  assert.equal(CATEGORIES.find((c) => c.n === 1).gate, '@everyone');
  assert.equal(accessOf('#rules-and-regulations'), 'read');
});

console.log('\n— renames and re-homes resolve —');

test('every rename target is a channel that exists in the layout', () => {
  const names = new Set(allChannelNames());
  for (const [from, to] of Object.entries(RENAMES)) {
    if (to === null) continue;
    if (to === from) continue; // no-op alias
    assert.ok(names.has(to), `rename ${from} -> ${to} points at a channel not in the layout`);
  }
});

test('every REHOME target exists and actually moves categories', () => {
  for (const { name, to } of REHOME) {
    assert.ok(allChannelNames().includes(name), `REHOME source ${name} is not in the layout`);
    assert.ok(CHANNELS[to].some((c) => c.name === name), `${name} is not listed in category ${to}`);
    assert.ok(typeof to === 'number' && to >= 1 && to <= 13, `REHOME ${name} -> ${to} out of range`);
  }
});

test('every category rename resolves to a declared category', () => {
  const names = new Set(CATEGORIES.map((c) => c.name));
  for (const [from, to] of Object.entries(CATEGORY_RENAMES)) {
    if (to === null) continue;
    assert.ok(names.has(to), `category rename ${from} -> ${to} is not one of the 13`);
  }
});

test('a category rename target is never also a rename source', () => {
  const sources = new Set(Object.keys(CATEGORY_RENAMES));
  for (const to of Object.values(CATEGORY_RENAMES)) {
    if (to === null) continue;
    assert.ok(!sources.has(to), `${to} is both a rename target and a rename source`);
  }
});

test('RENAMES has no duplicate targets', () => {
  const targets = Object.values(RENAMES).filter(Boolean);
  assert.equal(new Set(targets).size, targets.length, 'two sources rename onto one target');
});

console.log('\n— lookups throw rather than guess —');

test('unknown category and channel both throw', () => {
  assert.throws(() => categoryNumber('99 NOPE'), /unknown category/);
  assert.throws(() => accessOf('#does-not-exist'), /unknown channel/);
  assert.throws(() => categoryOfChannel('#does-not-exist'), /unknown channel/);
});

test('every access key is one this codebase knows', () => {
  const known = new Set(['open', 'read', 'chat', 'director-post', 'staff', 'exec-read', 'voice']);
  for (const [n, list] of Object.entries(CHANNELS)) {
    for (const c of list) assert.ok(known.has(c.access), `category ${n} ${c.name} has unknown access "${c.access}"`);
  }
});

console.log('\n— charter officers —');

test('five new roles, no sixth', () => {
  assert.equal(NEW_ROLES.length, 5);
  const got = NEW_ROLES.map((r) => r.key).sort();
  const want = ['cisDirector', 'ersDirector', 'ewoDirector', 'executiveDirector', 'operationsDirector'].sort();
  assert.deepEqual(got, want);
});

test('exactly three officers are pending invite', () => {
  assert.equal(NEW_ROLES.filter((r) => !r.assignable).length, 3);
  assert.equal(NEW_ROLES.filter((r) => r.assignable).length, 2);
});

console.log('\n— permission truth table —');

test('read allows viewing and withholds sending', () => {
  assert.ok(has(allowFor('read', 'text'), BITS.VIEW_CHANNEL));
  assert.ok(has(allowFor('read', 'text'), BITS.READ_MESSAGE_HISTORY));
  assert.equal(has(allowFor('read', 'text'), BITS.SEND_MESSAGES), false);
  assert.ok(has(denyFor('read', 'text'), BITS.SEND_MESSAGES));
});

test('chat grants send, upload, react and embed', () => {
  for (const b of [BITS.SEND_MESSAGES, BITS.ATTACH_FILES, BITS.ADD_REACTIONS, BITS.EMBED_LINKS]) {
    assert.ok(has(allowFor('chat', 'text'), b), `chat must grant bit ${b}`);
  }
});

test('voice grants connect and speak, never send', () => {
  assert.ok(has(allowFor('voice', 'voice'), BITS.CONNECT));
  assert.ok(has(allowFor('voice', 'voice'), BITS.SPEAK));
  assert.equal(has(allowFor('voice', 'voice'), BITS.SEND_MESSAGES), false);
});

test('open denies nothing at the everyone tier', () => {
  assert.equal(denyFor('open', 'text'), 0n);
});

test('a member cannot post in a staff channel', () => {
  assert.equal(has(allowForTier('member', 'staff'), BITS.SEND_MESSAGES), false);
  assert.ok(has(allowForTier('staff', 'staff'), BITS.SEND_MESSAGES));
});

test('a member cannot post in an exec-read channel but exec can look', () => {
  assert.equal(has(allowForTier('member', 'exec-read'), BITS.SEND_MESSAGES), false);
  assert.ok(has(allowForTier('exec', 'exec-read'), BITS.VIEW_CHANNEL));
  assert.equal(has(allowForTier('exec', 'exec-read'), BITS.SEND_MESSAGES), false);
});

test('director-post is read-only to members', () => {
  assert.equal(has(allowForTier('member', 'director-post'), BITS.SEND_MESSAGES), false);
});

test('founder reaches every access key but never gets administrator', () => {
  for (const a of ['open', 'read', 'chat', 'director-post', 'staff', 'exec-read']) {
    assert.ok(has(allowForTier('founder', a), BITS.VIEW_CHANNEL), `founder needs ${a}`);
  }
  assert.equal(has(allowForTier('founder', 'staff'), BITS.ADMINISTRATOR), false);
  assert.equal(has(allowForTier('founder', 'staff'), BITS.MANAGE_ROLES), false);
});

test('the bot gets manage-roles and manage-channels so it can grant and gate', () => {
  assert.ok(has(allowForTier('bot', 'staff'), BITS.MANAGE_ROLES));
  assert.ok(has(allowForTier('bot', 'staff'), BITS.MANAGE_CHANNELS));
});

test('access levels order open above chat above read', () => {
  assert.ok(accessLevel('open') > accessLevel('chat'));
  assert.ok(accessLevel('chat') > accessLevel('read'));
  assert.ok(accessLevel('staff') > accessLevel('exec-read'));
});

test('an unknown access key throws rather than defaulting', () => {
  assert.throws(() => allowFor('nope', 'text'), /unknown access key/);
  assert.throws(() => allowForTier('nope', 'chat'), /unknown tier/);
});

console.log(`\n${passed} passed${process.exitCode ? ', with failures' : ''}\n`);
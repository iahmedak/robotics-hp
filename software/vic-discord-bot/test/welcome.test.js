/**
 * Welcomer tests — no Discord connection required.
 *   node test/welcome.test.js
 */

import assert from 'node:assert/strict';
import { shouldWelcome, buildWelcomeEmbed, buildJoinDM } from '../src/welcomer.js';

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}

console.log('\n— dedupe —');

test('first join welcomes', () => {
  assert.equal(shouldWelcome('user-a', 1_000), true);
});

test('rapid re-join is suppressed', () => {
  assert.equal(shouldWelcome('user-a', 2_000), false);
});

test('re-join after 24h welcomes again', () => {
  assert.equal(shouldWelcome('user-a', 1_000 + 24 * 60 * 60 * 1000 + 1), true);
});

test('dedupe is per-user', () => {
  assert.equal(shouldWelcome('user-b', 3_000), true);
});

console.log('\n— welcome embed —');

test('tags the new member and names the server', () => {
  const msg = buildWelcomeEmbed({ userId: '123', guildName: 'VIC' });
  const body = JSON.stringify(msg.embeds[0]);
  assert.match(body, /<@123>/);
  assert.match(body, /VIC/);
});

test('contains the three verification steps', () => {
  const msg = buildWelcomeEmbed({ userId: '123', guildName: 'VIC' });
  const body = JSON.stringify(msg.embeds[0]);
  assert.match(body, /#rules/);
  assert.match(body, /vic-official\.pages\.dev/);
  assert.match(body, /VIC ID/);
});

test('warns that the form username must match', () => {
  const msg = buildWelcomeEmbed({ userId: '123', guildName: 'VIC' });
  assert.match(JSON.stringify(msg.embeds[0]), /must match/);
});

test('contains no named mentors', () => {
  const msg = buildWelcomeEmbed({ userId: '123', guildName: 'VIC' });
  const body = JSON.stringify(msg.embeds[0]).toLowerCase();
  for (const n of ['nuhail', 'damudi', 'danish', 'gawai']) {
    assert.doesNotMatch(body, new RegExp(n), `leaked mentor name: ${n}`);
  }
  assert.match(body, /🎓 mentor/);
});

console.log('\n— join DM —');

test('DM explains the path without assuming approval', () => {
  const msg = buildJoinDM({ username: 'aarav' });
  const body = JSON.stringify(msg.embeds[0]);
  assert.match(body, /aarav/);
  assert.match(body, /vic-official\.pages\.dev/);
  assert.match(body, /APP-2026/);
  assert.doesNotMatch(body, /approved/i);
});

test('DM has no named mentors', () => {
  const body = JSON.stringify(buildJoinDM({ username: 'x' })).toLowerCase();
  for (const n of ['nuhail', 'damudi', 'danish', 'gawai']) {
    assert.doesNotMatch(body, new RegExp(n), `leaked mentor name: ${n}`);
  }
});

console.log('\n— auto applicant grant —');

test('attachWelcomer passes the applicant role through and grants it', async () => {
  const { attachWelcomer } = await import('../src/welcomer.js');
  // Fresh module registry so the dedupe map is empty for this member.
  const listeners = new Map();
  const fakeClient = {
    on: (ev, fn) => listeners.set(ev, fn),
  };
  const addRole = [];
  const member = {
    user: { bot: false, id: 'newcomer', username: 'newcomer' },
    guild: {
      id: 'guild1',
      name: 'VIC',
      channels: { cache: new Map() },
      roles: { add: (id, reason) => { addRole.push({ id, reason }); } },
    },
    roles: { add: (id, reason) => { addRole.push({ id, reason }); } },
    send: async () => {},
  };
  attachWelcomer(fakeClient, {
    guildId: 'guild1',
    applicantRoleId: 'R-APPLICANT',
  });
  await listeners.get('guildMemberAdd')(member);
  assert.equal(addRole.length, 1);
  assert.equal(addRole[0].id, 'R-APPLICANT');
});

test('bots are never granted the applicant role', async () => {
  const { attachWelcomer } = await import('../src/welcomer.js');
  const listeners = new Map();
  const fakeClient = { on: (ev, fn) => listeners.set(ev, fn) };
  const addRole = [];
  attachWelcomer(fakeClient, { guildId: 'guild1', applicantRoleId: 'R-APPLICANT' });
  await listeners.get('guildMemberAdd')({
    user: { bot: true, id: 'somebot', username: 'bot' },
    guild: { id: 'guild1', name: 'VIC', channels: { cache: new Map() } },
    roles: { add: (id) => addRole.push(id) },
    send: async () => {},
  });
  assert.equal(addRole.length, 0);
});

console.log(`\n${passed} passed${process.exitCode ? ', with failures' : ''}\n`);
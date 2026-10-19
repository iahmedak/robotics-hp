/**
 * Activity + member-stats tests — no Discord connection required.
 *   node test/activity.test.js
 */

import assert from 'node:assert/strict';
import {
  dayKey, rankCounts, computeMemberStats,
  ActivityTracker, buildRankEmbed, buildMemberCountEmbed,
} from '../src/activity.js';

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}

console.log('\n— ranking —');

test('ranks by total, desc, capped', () => {
  const entries = [
    { userId: 'a', ts: 100, count: 5 },
    { userId: 'b', ts: 100, count: 12 },
    { userId: 'c', ts: 100, count: 1 },
  ];
  const rows = rankCounts(entries, 0, 2);
  assert.deepEqual(rows.map((r) => r.userId), ['b', 'a']);
  assert.equal(rows[0].count, 12);
});

test('window filters out old buckets', () => {
  const entries = [
    { userId: 'a', ts: 100, count: 50 },
    { userId: 'b', ts: 900, count: 3 },
  ];
  const rows = rankCounts(entries, 500, 10);
  assert.deepEqual(rows.map((r) => r.userId), ['b']);
});

test('same user across days sums', () => {
  const entries = [
    { userId: 'a', ts: 100, count: 4 },
    { userId: 'a', ts: 200, count: 6 },
  ];
  assert.equal(rankCounts(entries, 0, 10)[0].count, 10);
});

test('empty window returns empty rows', () => {
  assert.deepEqual(rankCounts([], 0, 10), []);
});

console.log('\n— tracker —');

test('record buckets by UTC day and accumulates', () => {
  const t = new ActivityTracker();
  const ts = Date.parse('2026-10-14T10:00:00Z');
  t.record('u1', ts);
  t.record('u1', ts + 3_600_000);
  t.record('u1', ts + 86_400_000); // next day
  assert.equal(t.entries.length, 2);
  assert.equal(t.entries.find((e) => e.ts === Date.parse('2026-10-14T00:00:00Z')).count, 2);
});

test('since tracks the earliest timestamp', () => {
  const t = new ActivityTracker();
  t.record('u1', 5_000);
  t.record('u2', 1_000);
  assert.equal(t.since, 1_000);
});

test('dayKey is UTC yyyy-mm-dd', () => {
  assert.equal(dayKey(Date.parse('2026-10-14T23:30:00+05:30')), '2026-10-14');
});

console.log('\n— member census —');

const ROLES = {
  member: 'R-M', applicant: 'R-A',
  divisions: { 'VIC-DIV-001': 'R-ERS', 'VIC-DIV-002': 'R-CIS' },
  founder: 'R-F', admin: 'R-AD', moderator: 'R-MO', mentor: 'R-ME',
};

test('counts humans, bots, roles and divisions', () => {
  const members = [
    { id: '1', bot: false, roleIds: ['R-M', 'R-ERS', 'R-F'] },
    { id: '2', bot: false, roleIds: ['R-A'] },
    { id: '3', bot: false, roleIds: ['R-M', 'R-CIS', 'R-ME'] },
    { id: '9', bot: true, roleIds: [] },
  ];
  const s = computeMemberStats(members, ROLES);
  assert.equal(s.total, 4);
  assert.equal(s.humans, 3);
  assert.equal(s.bots, 1);
  assert.equal(s.member, 2);
  assert.equal(s.applicant, 1);
  assert.deepEqual(s.divisions, { 'VIC-DIV-001': 1, 'VIC-DIV-002': 1 });
  assert.deepEqual(s.staff, { founder: 1, admin: 0, moderator: 0, mentor: 1 });
});

test('bots excluded from role breakdown', () => {
  const s = computeMemberStats([{ id: '9', bot: true, roleIds: ['R-M'] }], ROLES);
  assert.equal(s.member, 0);
  assert.equal(s.bots, 1);
});

test('empty server does not crash', () => {
  const s = computeMemberStats([], ROLES);
  assert.equal(s.total, 0);
  assert.deepEqual(s.divisions, {});
});

console.log('\n— embeds —');

test('rank embed medals top three and handles empty', () => {
  const full = buildRankEmbed(
    [{ userId: 'a', count: 9 }, { userId: 'b', count: 4 }, { userId: 'c', count: 2 }, { userId: 'd', count: 1 }],
    { windowLabel: '7 days', since: 1_000 }
  );
  const body = JSON.stringify(full.embeds[0]);
  assert.match(body, /🥇.*<@a>/s);
  assert.match(body, /🥈.*<@b>/s);
  assert.match(body, /🥉.*<@c>/s);
  assert.match(body, /\*\*4\.\*\* <@d>/);
  const empty = buildRankEmbed([], { windowLabel: '7 days', since: null });
  assert.match(JSON.stringify(empty.embeds[0]), /No messages counted/);
});

test('membercount embed renders stats and division names', () => {
  const s = computeMemberStats(
    [{ id: '1', bot: false, roleIds: ['R-M', 'R-ERS'] }],
    ROLES
  );
  const msg = buildMemberCountEmbed(s, { 'VIC-DIV-001': '⚙️ ERS' });
  const body = JSON.stringify(msg.embeds[0]);
  assert.match(body, /VIC member count/);
  assert.match(body, /⚙️ ERS/);
  assert.match(body, /Verified members/);
});

console.log(`\n${passed} passed${process.exitCode ? ', with failures' : ''}\n`);
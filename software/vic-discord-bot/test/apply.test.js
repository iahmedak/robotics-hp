/**
 * Ticket intake + application store tests — no Discord connection required.
 *   node test/apply.test.js
 */

import assert from 'node:assert/strict';
import { makeVicId, ticketChannelName, ApplicationStore, buildTicketCard, OPEN, APPROVED } from '../src/applications.js';
import { formatMemberId, MEMBER_ID_PATTERN } from '../src/members.js';
import { validateApplyFields } from '../src/apply.js';

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
}

const DIVS = [{ id: 'VIC-DIV-001' }, { id: 'VIC-DIV-002' }];

console.log('\n— VIC ID —');

test('mints APP-YYYY-XXXXXX', () => {
  const id = makeVicId(2026);
  assert.match(id, /^APP-2026-[0-9A-Z]{6}$/);
});

test('skips a taken id', () => {
  let out = null;
  for (let i = 0; i < 200 && !out; i++) {
    const candidate = makeVicId(2026, new Set());
    if (candidate) { out = makeVicId(2026, new Set([candidate])); }
  }
  assert.ok(out === null || /^APP-2026-[0-9A-Z]{6}$/.test(out));
});

console.log('\n— channel name —');

test('sanitises a username to a legal channel name', () => {
  assert.equal(ticketChannelName('Aarav Sharma'), 'app-aaravsharma');
  assert.equal(ticketChannelName('bad!!name!!'), 'app-badname');
  assert.equal(ticketChannelName(''), 'app-member');
  assert.match(ticketChannelName('x'.repeat(200)), /^app-[a-z0-9\-_]{1,80}$/);
});

console.log('\n— modal validation —');

test('accepts a well-formed submission', () => {
  const r = validateApplyFields({
    fullName: 'Aarav Sharma', email: 'aarav@example.com',
    skills: 'Python, ROS', motivation: 'I want to build robots.',
    division: 'VIC-DIV-001', divisions: DIVS,
  });
  assert.equal(r.ok, true);
  assert.equal(r.data.divisionId, 'VIC-DIV-001');
});

test('rejects a bad email', () => {
  const r = validateApplyFields({
    fullName: 'A', email: 'nope', skills: 'x', motivation: 'long enough reason',
    division: 'VIC-DIV-001', divisions: DIVS,
  });
  assert.equal(r.ok, false);
  assert.match(r.errors.join(' '), /email/i);
});

test('rejects a too-short motivation', () => {
  const r = validateApplyFields({
    fullName: 'Aarav Sharma', email: 'a@b.co', skills: 'x', motivation: 'hi',
    division: 'VIC-DIV-001', divisions: DIVS,
  });
  assert.equal(r.ok, false);
  assert.match(r.errors.join(' '), /why you want to join/i);
});

test('rejects an unknown division', () => {
  const r = validateApplyFields({
    fullName: 'Aarav Sharma', email: 'a@b.co', skills: 'x',
    motivation: 'a real sentence here', division: 'VIC-DIV-999', divisions: DIVS,
  });
  assert.equal(r.ok, false);
  assert.match(r.errors.join(' '), /division/i);
});

test('accepts a lowercase division id', () => {
  const r = validateApplyFields({
    fullName: 'Aarav Sharma', email: 'a@b.co', skills: 'x',
    motivation: 'a real sentence here', division: 'vic-div-002', divisions: DIVS,
  });
  assert.equal(r.ok, true);
  assert.equal(r.data.divisionId, 'VIC-DIV-002');
});

test('accepts two comma-separated divisions', () => {
  const r = validateApplyFields({
    fullName: 'Aarav Sharma', email: 'a@b.co', skills: 'x',
    motivation: 'a real sentence here', division: 'VIC-DIV-001,VIC-DIV-002', divisions: DIVS,
  });
  assert.equal(r.ok, true);
  assert.deepEqual(r.data.divisionIds, ['VIC-DIV-001', 'VIC-DIV-002']);
  assert.equal(r.data.divisionId, 'VIC-DIV-001', 'primary is the first one');
});

test('accepts two divisions separated by a space or slash', () => {
  for (const sep of [' ', '/', ', ']) {
    const r = validateApplyFields({
      fullName: 'Aarav Sharma', email: 'a@b.co', skills: 'x',
      motivation: 'a real sentence here', division: `VIC-DIV-001${sep}VIC-DIV-002`, divisions: DIVS,
    });
    assert.equal(r.ok, true, `separator "${sep}" should work`);
    assert.equal(r.data.divisionIds.length, 2);
  }
});

test('rejects more than two divisions', () => {
  const many = [{ id: 'VIC-DIV-001' }, { id: 'VIC-DIV-002' }, { id: 'VIC-DIV-003' }];
  const r = validateApplyFields({
    fullName: 'Aarav Sharma', email: 'a@b.co', skills: 'x',
    motivation: 'a real sentence here', division: 'VIC-DIV-001,VIC-DIV-002,VIC-DIV-003', divisions: many,
  });
  assert.equal(r.ok, false);
  assert.match(r.errors.join(' '), /at most two/i);
});

test('de-duplicates a repeated division', () => {
  const r = validateApplyFields({
    fullName: 'Aarav Sharma', email: 'a@b.co', skills: 'x',
    motivation: 'a real sentence here', division: 'VIC-DIV-001,VIC-DIV-001', divisions: DIVS,
  });
  assert.equal(r.ok, true);
  assert.deepEqual(r.data.divisionIds, ['VIC-DIV-001']);
});

console.log('\n— store —');

test('tracks open application per user', () => {
  const s = new ApplicationStore();
  s.create({ discordUserId: 'u1', fullName: 'A' });
  assert.ok(s.openForUser('u1'));
  assert.equal(s.openForUser('u2'), null);
});

test('decide closes the open slot so they can re-apply', () => {
  const s = new ApplicationStore();
  const app = s.create({ discordUserId: 'u1', fullName: 'A' });
  s.decide(app.vicId, APPROVED, { decidedBy: 'mod' });
  assert.equal(s.openForUser('u1'), null);
  assert.equal(s.get(app.vicId).status, APPROVED);
});

test('cannot double-decide', () => {
  const s = new ApplicationStore();
  const app = s.create({ discordUserId: 'u1' });
  s.decide(app.vicId, APPROVED, { decidedBy: 'mod1' });
  s.decide(app.vicId, 'REJECTED', { decidedBy: 'mod2' });
  assert.equal(s.get(app.vicId).status, APPROVED, 'first decision must win');
});

test('stats tally each state', () => {
  const s = new ApplicationStore();
  const a = s.create({ discordUserId: 'u1' });
  s.create({ discordUserId: 'u2' });
  s.decide(a.vicId, APPROVED, { decidedBy: 'm' });
  const st = s.stats();
  assert.equal(st.total, 2);
  assert.equal(st.approved, 1);
  assert.equal(st.pending, 1);
});

console.log('\n— ticket card —');

test('card shows VIC ID, discord mention and buttons', () => {
  const s = new ApplicationStore();
  const app = s.create({ discordUserId: 'u42', username: 'aarav', fullName: 'Aarav', email: 'a@b.co', skills: 'Python', motivation: 'I love robots' });
  const card = buildTicketCard(app, '⚙️ ERS');
  const body = JSON.stringify(card.embeds[0]);
  assert.match(body, /APP-2026/);
  assert.match(body, /<@u42>/);
  assert.match(body, /I love robots/);
  const ids = card.components[0].components.map((c) => c.custom_id);
  assert.deepEqual(ids, [`vic:t:approve:${app.vicId}`, `vic:t:reject:${app.vicId}`]);
});

test('card shows both divisions when the member picked two', () => {
  const s = new ApplicationStore();
  const app = s.create({
    discordUserId: 'u7', username: 'dual', fullName: 'Dual Member', email: 'd@b.co',
    skills: 'x', motivation: 'y', divisionIds: ['VIC-DIV-001', 'VIC-DIV-002'], divisionId: 'VIC-DIV-001',
  });
  const card = buildTicketCard(app, '', { 'VIC-DIV-001': '⚙️ ERS', 'VIC-DIV-002': '💻 CIS' });
  assert.match(JSON.stringify(card.embeds[0]), /⚙️ ERS \+ 💻 CIS/);
});

console.log('\n— permanent member id —');

test('formats VIC-MEM-NNN', () => {
  assert.equal(formatMemberId(1), 'VIC-MEM-001');
  assert.equal(formatMemberId(42), 'VIC-MEM-042');
  assert.equal(formatMemberId(1234), 'VIC-MEM-1234');
  assert.ok(MEMBER_ID_PATTERN.test(formatMemberId(7)));
});

test('an open application carries no member id yet', () => {
  const s = new ApplicationStore();
  const app = s.create({ discordUserId: 'u1', username: 'a', fullName: 'A', email: 'a@b.co', skills: 'x', motivation: 'y' });
  assert.equal(app.memberId, null, 'the id is granted at approval, not at intake');
});

test('approval stamps the member id onto the record', () => {
  const s = new ApplicationStore();
  const app = s.create({ discordUserId: 'u2', username: 'b', fullName: 'B', email: 'b@b.co', skills: 'x', motivation: 'y' });
  s.decide(app.vicId, APPROVED, { decidedBy: 'staff', memberId: 'VIC-MEM-007' });
  assert.equal(s.get(app.vicId).memberId, 'VIC-MEM-007');
  assert.equal(s.get(app.vicId).status, APPROVED);
});

test('a member id is never overwritten on re-decision', () => {
  const s = new ApplicationStore();
  const app = s.create({ discordUserId: 'u3', username: 'c', fullName: 'C', email: 'c@b.co', skills: 'x', motivation: 'y' });
  s.decide(app.vicId, APPROVED, { decidedBy: 'staff', memberId: 'VIC-MEM-007' });
  s.reopen(app.vicId);
  s.decide(app.vicId, APPROVED, { decidedBy: 'other', memberId: 'VIC-MEM-999' });
  assert.equal(s.get(app.vicId).memberId, 'VIC-MEM-007', 'a permanent id must not change');
});

test('the application key stays APP- for audit continuity', () => {
  const s = new ApplicationStore();
  const app = s.create({ discordUserId: 'u4', username: 'd', fullName: 'D', email: 'd@b.co', skills: 'x', motivation: 'y' });
  s.decide(app.vicId, APPROVED, { decidedBy: 'staff', memberId: 'VIC-MEM-001' });
  assert.match(s.get(app.vicId).vicId, /^APP-\d{4}-[0-9A-Z]{6}$/);
});

console.log(`\n${passed} passed${process.exitCode ? ', with failures' : ''}\n`);
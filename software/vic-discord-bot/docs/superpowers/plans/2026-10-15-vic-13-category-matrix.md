# VIC 13-Category Matrix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the VIC Discord server onto a 13-category, 16-role governance matrix with charter-derived officers, a permanent `VIC-MEM-NNN` identity scheme, and a verified permission matrix.

**Architecture:** One pure data module (`src/layout.js`) holds every category, channel, rename, and role decision as testable data with no I/O. Three Discord-mutating scripts consume it: `phase5.js` applies the structure, `gate-tiers.js` writes permissions, `verify-tiers.js` proves them. A separate pure module owns member-ID issuance. Anything decidable without the Discord API is decided and tested before anything touches the server.

**Tech Stack:** Node ≥ 20, ESM (`"type": "module"`), `discord.js` ^14.16.3 via the REST API, plain `node:test`-style assertion scripts (no test framework in this repo).

**Spec:** `docs/superpowers/specs/2026-10-15-vic-12-category-matrix-design.md` — read it alongside this plan. The spec travels because several tasks copy exact channel names, role names, and gate rules from it.

## Global Constraints

- Guild `1559667956877893713`; bot `1559666838768459776` (`VIC-BOT#0647`); guild owner `iahmedak` = `751643959884775494`.
- **13 categories**, in this exact order: `01 🚪 START HERE`, `02 🌍 PUBLIC COMMUNITY`, `03 📄 INFORMATION`, `04 💬 COMMUNITY`, `05 🏛️ EXECUTIVE BOARD`, `06 ⚙️ OPERATIONS & ADMINISTRATION`, `07 📋 ERS — Electronics & Robotics`, `08 💻 CIS — Computing & Intelligent Sciences`, `09 📣 EWO — Events, Workshops & Outreach`, `10 📋 OOA (Ops & Admin)`, `11 🤝 PROJECTS & COLLABORATION`, `12 🔊 MEETINGS & LIVE COLLABORATION`, `13 🗂️ BOT & MODERATION LOGS`.
- **Discord does not support subcategories.** Any `parent_id` targeting a category throws `CHANNEL_PARENT_INVALID_PARENT`. Divisions are top-level siblings at 07–10. Never attempt nesting.
- **5 new roles, no `📋 OOA Director`.** `⚙️ Director of Operations` carries the OOA gate as well as category 06. `🎖️ Executive Director` (Omer Ruknuddin, VIC-FND-02), `⚙️ Director of Operations` (Abdullah Saami, VIC-FND-01), `📋 ERS Director` (Mohammad Zaid, VIC-FND-03), `💻 CIS Director` (Ahmed Irfan, VIC-FND-05), `📣 EWO Director` (Shamveel Bukhari, VIC-FND-04).
- **`🤖 VIC Bot` sits at position 24.** `vic-t1` (28), `⚡ Founder` (27), `🛡️ Admin` (26), `🧭 Moderator` (25) are above it and **cannot be edited by the bot**. New roles are created at the bottom and inserted above `🤖 VIC Bot`; never reorder the existing four.
- **Guild ownership is not a role.** No `👑 Owner` role is created. `⚡ Founder` grants all-channel access and no ultimate power.
- **Every Director role grants all-channel access.** (Saami's server rules §3.5 is rejected per spec §3.1.2.)
- **Division id `VIC-DIV-004` is unchanged.** Only the display name becomes `📋 OOA (Ops & Admin)`.
- **`VIC-MEM-NNN`**: zero-padded to 3, sequential, issued at **approval**, never reused, never changes on division change or founder-tag change. The `APP-YYYY-XXXXXX` scheme is retired.
- **No seeded message may name a mentor.** Generic `🎓 Mentor` only.
- **Channel mentions must use this guild's IDs.** Saami's server IDs (`1559958…`, `1559962…`) do not exist here and render as `@unknown-channel`. Resolve mentions from the live channel list at seed time, never hardcode.
- **Never log or echo a secret.** `config.js`'s `describeConfig()` reports presence, not values.
- Tests are plain node scripts. **A new test file is not run until it is added to the `test` chain in `package.json`.**

## Review Focus

Five failure modes the spec implies that no existing test exercises:

1. **Double-run duplicates.** `phase5.js` run twice must not create a second `📋 ERS — Electronics & Robotics` category or a second `#rules-and-regulations`. Resolve by name and skip when present. *(Pinned in Task 5 and Task 7.)*
2. **Channel orphaned by creation order.** Moving a channel into a category that does not exist yet silently detaches it. Categories must be created and ordered **before** any move. *(Task 7.)*
3. **Bot pushed below a role it must grant.** If `🤖 VIC Bot` ends up beneath `⚙️ Director of Operations` or any Director role, role grants fail at runtime with a permission error the tests will not catch. *(Task 6.)*
4. **Member ID reused after exit.** If revocation deletes the registry row, the next approval reissues the same number — violating "never reused." *(Task 1.)*
5. **A test file that never runs.** This repo has no CI. A test file not added to the `npm test` chain passes forever by never executing. *(Every task's commit step.)*

---

### Task 1: Permanent member-ID registry

**Files:**
- Create: `src/members.js`
- Modify: `package.json` (test chain)
- Test: `test/members.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `export const MEMBER_ID_PATTERN = /^VIC-MEM-\d{3,}$/`
  - `export class MemberRegistry { constructor(path = '.data/members.json'); all(): Record[]; get(discordId: string): Record | null; issue(discordId: string, meta?: Record): string; revoke(discordId: string): Record | null; count(): number }`
  - `issue()` returns the formatted id string and never returns the same value twice across the registry's lifetime, including after `revoke()`.

- [ ] **Step 1: Write the failing test**

Create `test/members.test.js` following the existing pattern in `test/roleadmin.test.js` (plain `node:assert`, `process.exit(1)` on failure, a `console.log` summary line, exit 0 on success). Cases with these exact assertions:

```js
// monotonic across revoke — the counter never rewinds
const r = new MemberRegistry(tmpPath);
assert.strictEqual(r.issue('1'), 'VIC-MEM-001');
assert.strictEqual(r.issue('2'), 'VIC-MEM-002');
r.revoke('1');
assert.strictEqual(r.issue('3'), 'VIC-MEM-003');   // NOT VIC-MEM-002

// zero-pad widens past 999, never truncates
const big = new MemberRegistry(tmpPath2);
for (let i = 0; i < 1000; i++) big.issue(String(i));
assert.strictEqual(big.issue('x'), 'VIC-MEM-1001');
assert.ok(MEMBER_ID_PATTERN.test(big.issue('y')));

// issue is idempotent per discordId
const d = new MemberRegistry(tmpPath3);
assert.strictEqual(d.issue('7'), 'VIC-MEM-001');
assert.strictEqual(d.issue('7'), 'VIC-MEM-001');
assert.strictEqual(d.count(), 1);

// revocation keeps the record visible with revokedAt set
const e = new MemberRegistry(tmpPath4);
e.issue('9', { divisions: ['CIS'] });
const gone = e.revoke('9');
assert.strictEqual(gone.revokedAt !== undefined, true);
assert.strictEqual(e.get('9').discordId, '9');
assert.strictEqual(e.issue('10'), 'VIC-MEM-002');

// every id issued parses
for (const rec of new MemberRegistry(tmpPath5).all()) {}
const f = new MemberRegistry(tmpPath6);
f.issue('a'); f.issue('b');
for (const rec of f.all()) assert.ok(MEMBER_ID_PATTERN.test(rec.memberId), rec.memberId);
```

Use `node:fs.mkdtempSync` under `os.tmpdir()` for each path — do not write into `.data/` during tests.

The first two blocks are Review Focus item 4: the counter must never rewind,
because a reused number means two different people hold the same permanent ID.

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/members.test.js`
Expected: FAIL — `Cannot find module '../src/members.js'`.

- [ ] **Step 3: Implement `src/members.js`**

```js
export const MEMBER_ID_PATTERN = /^VIC-MEM-\d{3,}$/;
export class MemberRegistry { /* per Interfaces */ }
```

`issue()` allocates `count() + 1` zero-padded to at least 3 digits and **skips any number already present in `all()`** — that guard is what makes a hand-edited or partially-written registry safe. `revoke()` sets `revokedAt` to an ISO timestamp and keeps the row; it never splices the array. Persist synchronously to `path` after every mutation. Corrupt or missing file loads as empty rather than throwing — a broken registry must not brick the bot.

- [ ] **Step 4: Run test to verify it passes**

Run: `node test/members.test.js`
Expected: PASS with a summary line and exit code 0.

- [ ] **Step 5: Commit**

```bash
git add src/members.js test/members.test.js package.json
git commit -m "feat(members): permanent VIC-MEM-NNN registry, never reused"
```

---

### Task 2: Retire `APP-` IDs, issue `VIC-MEM-NNN` at approval

**Files:**
- Modify: `src/applications.js` (`makeVicId` → re-export from `members.js`)
- Test: `test/apply.test.js` (extend existing)

**Interfaces:**
- Consumes: `MemberRegistry`, `MEMBER_ID_PATTERN` from Task 1.
- Produces: `export function makeVicId()` is **removed**; `export { MEMBER_ID_PATTERN } from './members.js';` and `export function formatMemberId(n: number): string` added. `ApplicationStore.approve(vicId, opts)` gains `opts.memberId` and writes it onto the record.

- [ ] **Step 1: Write the failing test**

Extend `test/apply.test.js`. Remove any assertion importing `makeVicId` and replace with:

```js
assert.strictEqual(formatMemberId(1), 'VIC-MEM-001');
assert.strictEqual(formatMemberId(42), 'VIC-MEM-042');
assert.strictEqual(formatMemberId(1234), 'VIC-MEM-1234');

// approval stamps the member id, and a re-approve cannot change it
const store = new ApplicationStore(tmp);
const app = store.create({ discordId: '5', username: 'u', email: 'e@x', skills: 's', motivation: 'm', divisions: ['VIC-DIV-002'] });
store.approve('APP-TEST-1', { memberId: 'VIC-MEM-007' });
assert.strictEqual(store.get('APP-TEST-1').memberId, 'VIC-MEM-007');
store.approve('APP-TEST-1', { memberId: 'VIC-MEM-999' });
assert.strictEqual(store.get('APP-TEST-1').memberId, 'VIC-MEM-007'); // never overwritten
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/apply.test.js`
Expected: FAIL — `formatMemberId is not a function` or `makeVicId is not exported`.

- [ ] **Step 3: Modify `src/applications.js`**

Delete the `makeVicId` function body and its `APP-${year}-${tail}` construction. Add:

```js
export { MEMBER_ID_PATTERN } from './members.js';
export function formatMemberId(n) {
  return `VIC-MEM-${String(n).padStart(3, '0')}`;
}
```

In `ApplicationStore.approve`, assign `record.memberId = opts.memberId ?? record.memberId` **after** the status write so a re-approve cannot overwrite an already-issued id.

- [ ] **Step 4: Run test to verify it passes**

Run: `node test/apply.test.js`
Expected: PASS, exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/applications.js test/apply.test.js
git commit -m "feat(applications): issue VIC-MEM-NNN at approval, retire APP- ids"
```

---

### Task 3: Charter role keys in config

**Files:**
- Modify: `src/config.js`
- Modify: `.env.example`
- Test: `test/smoke.test.js` (existing smoke chain file — confirm its actual name in `package.json`)

**Interfaces:**
- Consumes: nothing.
- Produces: `config.roles` gains `executiveDirector`, `operationsDirector`, `ersDirector`, `cisDirector`, `ewoDirector`, each defaulting to the exact emoji name in Global Constraints. `config.roles.divisions['VIC-DIV-004']` default changes from `🛠️ OAD` to `📋 OOA (Ops & Admin)`.

- [ ] **Step 1: Write the failing test**

```js
import { config } from '../src/config.js';
assert.strictEqual(config.roles.executiveDirector, '🎖️ Executive Director');
assert.strictEqual(config.roles.operationsDirector, '⚙️ Director of Operations');
assert.strictEqual(config.roles.ersDirector, '📋 ERS Director');
assert.strictEqual(config.roles.cisDirector, '💻 CIS Director');
assert.strictEqual(config.roles.ewoDirector, '📣 EWO Director');
// OAD -> OOA rename; the id is the contract and must not change
assert.strictEqual(config.roles.divisions['VIC-DIV-004'], '📋 OOA (Ops & Admin)');
for (const k of Object.keys(config.roles.divisions)) assert.ok(k.startsWith('VIC-DIV-'), k);
```

If `.env` already pins `DIVISION_ROLES` with the old OAD name, the test reads the env value and fails — update `.env` in the same commit.

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/smoke.test.js`
Expected: FAIL — the four Director keys are `undefined`.

- [ ] **Step 3: Modify `src/config.js` and `.env.example`**

Add the five `read('ROLE_EXECUTIVE_DIRECTOR') ?? '…'` entries after `bot`, following the existing pattern exactly. Change the `DIVISION_ROLES` documented value in `.env.example` so `VIC-DIV-004=📋 OOA (Ops & Admin)`, and update the `parseDivisionRoles` doc comment.

- [ ] **Step 4: Run test to verify it passes**

Run: `node test/smoke.test.js` then `npm test`
Expected: PASS, exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/config.js .env.example .env test/smoke.test.js
git commit -m "feat(config): charter officer role keys, OAD renamed to OOA (Ops & Admin)"
```

---

### Task 4: `src/layout.js` — the 13-category manifest

**Files:**
- Create: `src/layout.js`

**Interfaces:**
- Consumes: nothing.
- Produces (every export consumed by Tasks 5–11 — names are fixed):
  ```js
  export const CATEGORIES: ReadonlyArray<{ n: number; name: string; gate: string }>
  export const DIVISIONS: Readonly<Record<'ERS'|'CIS'|'EWO'|'OOA', { role: string; category: number; directorRole: string | null }>>
  export const CHANNELS: Readonly<Record<number, ReadonlyArray<{ name: string; kind: 'text'|'forum'|'voice'; access: AccessKey }>>>
  export const RENAMES: Readonly<Record<string, string | null>>
  export const REHOME: ReadonlyArray<{ name: string; to: number }>
  export const NEW_ROLES: ReadonlyArray<{ key: string; name: string; holder: string; charter: string; assignable: boolean }>
  export function categoryNumber(name: string): number   // throws on unknown
  export function accessOf(channelName: string): AccessKey // throws on unknown
  ```
  `AccessKey` ∈ `'open' | 'read' | 'member' | 'chat' | 'staff' | 'exec-read' | 'director-post' | 'voice'`.

- [ ] **Step 1: Write the manifest**

Transcribe the spec's §4 table into `CATEGORIES` with `gate` as the role name string. Transcribe §4.1 into `CHANNELS`, keyed by category number. `RENAMES` and `REHOME` come verbatim from §5.2 and §5.3. `DIVISIONS` records that `OOA.directorRole` is `null` because the role was merged into `⚙️ Director of Operations`.

Copy values from the spec exactly. Do not paraphrase channel names — `#rules-and-regulations` is not `#rules`.

- [ ] **Step 2: Verify the manifest loads and is self-consistent**

Run:
```bash
node -e "import('./src/layout.js').then(m=>{console.log(Object.keys(m).join(','));console.log('categories',m.CATEGORIES.length);console.log('renames',Object.keys(m.RENAMES).length);console.log('rehome',m.REHOME.length);console.log('newroles',m.NEW_ROLES.length);console.log('channels',Object.values(m.CHANNELS).reduce((a,b)=>a+b.length,0));})"
```
Expected: `categories 13`, `newroles 5`, and a channel total matching the spec (§5.4 lists 21 new channels; total inventory is larger).

- [ ] **Step 3: Check every `REHOME` and `RENAMES` target exists in the manifest**

Run:
```bash
node -e "import('./src/layout.js').then(m=>{const all=new Set(Object.values(m.CHANNELS).flat().map(c=>c.name));const bad=[];for(const r of m.REHOME){if(!all.has(r.name))bad.push('REHOME source '+r.name);if(!all.has(r.name))bad.push('REHOME target '+m.CHANNELS[r.to]?.map(c=>c.name).join('|'));}for(const[n,v]of Object.entries(m.RENAMES)){if(v&&!all.has(v))bad.push('rename target '+v);}console.log(bad.length?bad.join('\n'):'OK');process.exit(bad.length?1:0);})"
```
Expected: `OK`, exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/layout.js
git commit -m "feat(layout): 13-category manifest as pure, testable data"
```

---

### Task 5: Manifest validation test

**Files:**
- Create: `test/layout.test.js`
- Modify: `package.json` (test chain)

**Interfaces:**
- Consumes: every export of `src/layout.js` from Task 4.
- Produces: nothing consumed later; this is a gate.

- [ ] **Step 1: Write the failing test**

Assert the spec's invariants directly:

```js
assert.strictEqual(CATEGORIES.length, 13);
assert.deepStrictEqual(CATEGORIES.map(c => c.n), [1,2,3,4,5,6,7,8,9,10,11,12,13]);
assert.strictEqual(CATEGORIES[0].name, '01 🚪 START HERE');
assert.strictEqual(CATEGORIES[2].name, '03 📄 INFORMATION');

// 5 new roles, and NO OOA Director anywhere
assert.strictEqual(NEW_ROLES.length, 5);
assert.strictEqual(NEW_ROLES.filter(r => /OOA Director/.test(r.name)).length, 0);
assert.strictEqual(DIVISIONS.OOA.directorRole, null);
assert.strictEqual(DIVISIONS.OOA.gate ?? DIVISIONS.OOA.role, '⚙️ Director of Operations');

// divisions are 07-10, top-level siblings, never nested
assert.deepStrictEqual([DIVISIONS.ERS.category, DIVISIONS.CIS.category,
                        DIVISIONS.EWO.category, DIVISIONS.OOA.category], [7,8,9,10]);

// ruleset has exactly one home, reachable by both audiences
assert.strictEqual(CHANNELS[1].filter(c => c.name === '#rules-and-regulations').length, 1);
assert.strictEqual(CATEGORIES[0].gate, '@everyone');            // applicants can read it
assert.strictEqual(CHANNELS[1].find(c => c.name === '#rules-and-regulations').access, 'read');

// no channel is claimed by two categories
const seen = new Set();
for (const list of Object.values(CHANNELS)) for (const c of list) {
  assert.ok(!seen.has(c.name), 'duplicate channel ' + c.name); seen.add(c.name);
}

// every rename source and rehome target is a real channel
assert.strictEqual(RENAMES['#rules'], '#rules-and-regulations');
assert.ok(Object.values(RENAMES).filter(Boolean).every(v => seen.has(v)));
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/layout.test.js`
Expected: FAIL if Task 4 diverged from the spec in any asserted value. If it passes immediately, Task 4 is correct — record that and continue; do not weaken an assertion to force a red.

- [x] **Step 3: Add to the test chain**

Insert `node test/layout.test.js &&` into the `test` script in `package.json`.
This step exists because of Review Focus item 5: this repo has no CI, so a test
file absent from this chain never executes and fails silently forever. Adding
the file is not finished until it is chained.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS across all files, exit 0.

- [ ] **Step 5: Commit**

```bash
git add test/layout.test.js package.json
git commit -m "test(layout): pin 13 categories, merged OOA gate, single ruleset home"
```

---

### Task 6: Create and position the five charter roles

**Files:**
- Create: `src/phase5.js` (roles half only)

**Interfaces:**
- Consumes: `NEW_ROLES` from Task 4; `config.roles` from Task 3.
- Produces: `.data/role-ids.json` mapping `key -> snowflake`, so Tasks 7–12 never re-resolve by name. `phase5.js` exports `export async function ensureRoles()` for reuse, and prints a position table on completion.

- [ ] **Step 1: Snapshot current state before mutating**

Run:
```bash
node -e "import('dotenv/config').then(async()=>{const{REST}=await import('discord.js');const{config}=await import('./src/config.js');const r=new REST({version:'10'}).setToken(config.discord.token);const g=await r.get('/guilds/'+config.discord.guildId+'/roles');console.log(JSON.stringify(g.map(x=>({n:x.name,p:x.position})),null,0));})" > .data/roles-before.json
```
Expected: a one-line JSON array. This is the rollback reference.

- [ ] **Step 2: Implement `ensureRoles()` in `src/phase5.js`**

For each entry in `NEW_ROLES`: fetch `/guilds/:id/roles`, match by exact name, `POST` if absent. Then, working **top-down**, move each newly created role to its target position with `PATCH /guilds/:id/roles` carrying the full `position` array. Never PATCH a role whose current position is above the bot's own highest — guard with `if (role.position > botRole.position) throw` so the constraint fails loudly rather than silently.

Targets after insertion:

```
26 🎖️ Executive Director     23 💻 CIS Director
25 ⚙️ Director of Operations  22 📋 ERS Director
24 🤖 VIC Bot                 21 📣 EWO Director
```

**Verify explicitly**: after the move, assert `botRole.position` is still strictly greater than every Director role's position, and abort with a non-zero exit if not. This is Review Focus item 3.

- [ ] **Step 3: Assign to members present in the guild**

Fetch guild members, match `NEW_ROLES[].holder` to a Discord username. Saami (`saamisada`) and you (`iahmedak`) resolve; Omer, Zaid, and Shamveel do not. `assignable: false` in the manifest for those three. Write resolved ids to `.data/role-ids.json` and print a table with a `pending-invite` marker rather than a failure.

- [ ] **Step 4: Run and verify**

Run: `node src/phase5.js`
Expected: 5 roles created, position table printed, `🤖 VIC Bot` still at 24, exit 0.

Then re-run `node src/phase5.js` immediately.
Expected: **no** new roles created, no errors, no duplicates. This is Review Focus item 1.

- [ ] **Step 5: Commit**

```bash
git add src/phase5.js
git commit -m "feat(roles): create five charter officer roles above the bot"
```

---

### Task 7: Restructure categories and channels

**Files:**
- Modify: `src/phase5.js` (add the channel phase; roles phase must already be idempotent)

**Interfaces:**
- Consumes: `CATEGORIES`, `CHANNELS`, `RENAMES`, `REHOME`, `DIVISIONS` from Task 4.
- Produces: `.data/channel-ids.json` mapping channel name → snowflake, consumed by Tasks 8–11 so nothing re-resolves by name.

- [ ] **Step 1: Implement categories first**

For each entry in `CATEGORIES` in ascending `n`: resolve by exact name (honouring `RENAMES` as a rename table), create if absent, then set position to `n - 1`. **This block must complete before any move runs** — Review Focus item 2.

- [ ] **Step 2: Implement voice channels**

Create the 8 voice channels from `CHANNELS[12]` (`VIC General Meeting`, `Project Room 1`, `Project Room 2`) plus `Executive Meeting` in 05 and `<X> Team Meeting` in each division category. Rename `Lounge` → `VIC General Meeting` and `Meeting Room` → `Project Room 1` via `RENAMES`.

- [ ] **Step 3: Implement renames, then creations, then re-homing**

Apply `RENAMES` in a single pass. Create every channel in `CHANNELS` that is absent. Apply `REHOME`. **Order is load-bearing: categories → renames → creations → moves.** Moving before creation is what orphans channels.

- [ ] **Step 4: Implement cleanup**

Delete a category only when `children.length === 0` **after** all moves. Never gate deletion on a rename marker — an earlier draft of `phase4.js` did that and destroyed `🔊 Voice`. Print every deletion with its child count so the log is auditable.

- [ ] **Step 5: Run and verify**

Run: `node src/phase5.js`
Expected: 13 categories in positions 0–12, 15 old categories gone or renamed, 0 empty categories.

Verify:
```bash
node -e "import('dotenv/config').then(async()=>{const{REST}=await import('discord.js');const{config}=await import('./src/config.js');const r=new REST({version:'10'}).setToken(config.discord.token);const c=await r.get('/guilds/'+config.discord.guildId+'/channels');const cats=c.filter(x=>x.type===4).sort((a,b)=>a.position-b.position);cats.forEach(x=>{const k=c.filter(y=>y.parent_id===x.id).length;console.log(String(x.position).padStart(2),x.name,k?'':'  <-- EMPTY');});console.log('total categories',cats.length);})"
```
Expected: 13 lines, positions 0–12, no `<-- EMPTY`.

- [ ] **Step 6: Re-run for idempotency**

Run: `node src/phase5.js` twice more.
Expected: identical output, zero creations, zero deletions.

- [ ] **Step 7: Commit**

```bash
git add src/phase5.js
git commit -m "feat(channels): restructure to 13 categories, idempotent and ordered"
```

---

### Task 8: Rewrite `gate-tiers.js` for the 13-category matrix

**Files:**
- Create: `src/permissions.js`
- Modify: `src/gate-tiers.js`

**Interfaces:**
- Consumes: `CHANNELS`, `CATEGORIES`, `DIVISIONS`, `NEW_ROLES` from Task 4; `.data/role-ids.json` and `.data/channel-ids.json`.
- Produces:
  ```js
  // src/permissions.js
  export const BITS = { VIEW_CHANNEL, SEND_MESSAGES, READ_MESSAGE_HISTORY, ADD_REACTIONS,
                        ATTACH_FILES, EMBED_LINKS, USE_EXTERNAL_EMOJIS, CONNECT, SPEAK,
                        CREATE_INSTANT_INVITE, MANAGE_MESSAGES }   // all bigint
  export function allowFor(accessKey, kind): bigint
  export function denyFor(accessKey, kind): bigint
  export function accessLevel(accessKey): number   // ordering key; higher = broader
  ```
  `gate-tiers.js` keeps its `--dry` flag and its `put(channelId, roleId, allow, deny, reason)` shape.

- [ ] **Step 1: Write `src/permissions.js`**

Set the bits from the spec's §4.1 access tables. `'open'` → everyone may view and chat. `'read'` → view only, deny send. `'member'` → view only at `@everyone`, full at `✅ Member`. `'chat'` → view, send, react, embed, upload. `'staff'` → as chat, plus `CREATE_INSTANT_INVITE`. `'exec-read'` → staff gets chat; `🎖️ Executive Director` gets view only. `'director-post'` → member tier reads; Director role of that division sends. `'voice'` → `CONNECT | SPEAK` plus view.

- [ ] **Step 2: Add a permission truth-table test**

In `test/layout.test.js` add:

```js
assert.ok(allowFor('read','text') & BITS.VIEW_CHANNEL);
assert.strictEqual(Boolean(allowFor('read','text') & BITS.SEND_MESSAGES), false);
assert.ok(allowFor('chat','text') & BITS.SEND_MESSAGES);
assert.ok(allowFor('chat','text') & BITS.ATTACH_FILES);
assert.ok(allowFor('voice','voice') & BITS.CONNECT);
assert.ok(allowFor('voice','voice') & BITS.SPEAK);
assert.ok(accessLevel('open') > accessLevel('member'));
assert.ok(accessLevel('staff') > accessLevel('exec-read'));
```

Run: `node test/layout.test.js` → PASS.

- [ ] **Step 3: Rewrite `gate-tiers.js` to walk the manifest**

Delete the hardcoded `PUBLIC`, `MEMBER_CHANNELS`, `STAFF_CHANNELS`, `STAFF_CATEGORIES`, `DIVISION_SUBS` arrays. Iterate `CATEGORIES` and `CHANNELS`, resolving ids from the `.data/*.json` maps. Apply, in order: `@everyone` deny, `✅ Member` allow, division roles, Director roles, `⚡ Founder` **full access on every category** (spec §3.1.2 — no zero-power tag), `🛡️ Admin`, `⚙️ Director of Operations` (category 06 **and** the OOA division gate), `🎖️ Executive Director` (view-only on 13). Write `.data/channel-ids.json` reads, never name lookups inside the loop.

- [ ] **Step 4: Dry-run then apply**

Run: `node src/gate-tiers.js --dry` — review the printed diff for any category 01 or 02 losing access.
Then: `node src/gate-tiers.js`.

- [ ] **Step 5: Commit**

```bash
git add src/permissions.js src/gate-tiers.js test/layout.test.js
git commit -m "feat(gate): 13-category permission matrix from the manifest"
```

---

### Task 9: Rewrite `verify-tiers.js` as a matrix verifier

**Files:**
- Modify: `src/verify-tiers.js`

**Interfaces:**
- Consumes: `allowFor`, `denyFor`, `accessLevel` from Task 8; manifest from Task 4.
- Produces: exit 0 when every probe matches; exit 1 with a per-row diff otherwise. Prints a matrix with columns `role × category` and values `allow` / `deny` / `partial`.

- [ ] **Step 1: Implement the probe matrix**

Build one row per (role, channel) pair from `CATEGORIES` × `CHANNELS`, compute the expected bitmask, fetch the live `permission_overwrites`, and compare. Required rows, per spec §8:

```js
// @everyone: 01 and 02 open, 03-13 denied
// ✅ Member: 03, 04, 11, 12 allowed; 05, 06, 10, 13 denied
// each division role: own category allowed, sibling categories denied
// ✅ Member + 2 divisions: both visible, third denied
// ⚡ Founder: all 13 categories allow+send
// every Director role: all 13 categories allow+send
// ⚙️ Director of Operations: 06 and 13 allow+send, and 10 (merged OOA gate)
// 🎖️ Executive Director: 13 view but no send
```

`verify-tiers.js` cannot grant roles to probe multi-role combinations without mutating members. For the stacking rows, compute the **union** of the single-role overwrites and assert the union equals the expected set. Note this in the output as a computed result, not a live probe, so a reader does not mistake it for an observed one.

- [ ] **Step 2: Report pending-invite roles without failing**

For Director roles whose `holder` is not in the guild, print `pending-invite` and skip. The matrix must still report **0 wrong**, per spec §3.1.2.

- [ ] **Step 3: Run**

Run: `node src/verify-tiers.js`
Expected: `N ok, 0 wrong`, exit 0.

- [ ] **Step 4: Commit**

```bash
git add src/verify-tiers.js
git commit -m "feat(verify): full 13-category matrix verifier with stacking unions"
```

---

### Task 10: Seed the §1–12 ruleset

**Files:**
- Modify: `src/seed.js`
- Test: `test/seed.test.js` (new), added to the chain

**Interfaces:**
- Consumes: `.data/channel-ids.json`; Saami's rules text as supplied on 2026-10-15.
- Produces: `export function buildRuleset(channelIds: Record<string,string>): Array<{ name: string; content: string }>` — pure, so the mention resolution is testable without Discord.

- [ ] **Step 1: Write the failing test**

```js
const parts = buildRuleset({ 'mod-log': '1', 'apply-here': '2', 'membership-registry': '3',
                            'ers-documentation': '4', 'ooa-documentation': '5',
                            'project-proposals': '6', 'cross-division-collaboration': '7',
                            'meeting-agendas-and-minutes': '8', 'audit-log': '9',
                            'rules-and-regulations': '0' });
const all = parts.map(p => p.content).join('\n');

// every mention resolves to a channel we were given
const mentions = [...all.matchAll(/<#(\d+)>/g)].map(m => m[1]);
assert.ok(mentions.length >= 8, 'expected the ruleset to cross-reference channels');
for (const id of mentions) assert.ok(Object.values(args).includes(id), 'unresolved mention ' + id);

// Saami's server IDs must never appear
for (const bad of ['1559958635608809640','1559961989290135672','1559962054603972731',
                   '1559962207523967076','1559962210351190106','1559962213123493928',
                   '1559962086514360400','1559962155447615503','1559962170500976740',
                   '1559962175030829119','1559962045150142616'])
  assert.ok(!all.includes(bad), 'leaked foreign channel id ' + bad);

// no mentor is named anywhere
for (const n of ['Nuhail','Danish','Damudi','Gawai']) assert.ok(!all.includes(n), 'named ' + n);

// charter obligations appear in the rules
assert.ok(all.includes('caste'));                 // Art. IV non-discrimination
assert.ok(/VIC-MEM-\d{3}/.test(all));             // §2.1 id format
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/seed.test.js`
Expected: FAIL — `buildRuleset is not exported`.

- [ ] **Step 3: Implement `buildRuleset` in `src/seed.js`**

Transcribe §1–12. Resolve every `<#…>` from the passed map, using a `mention(name)` helper that **throws** on an unknown name so a typo fails the build instead of shipping `@unknown-channel`. Rewrite the three references that conflict with the charter and record the divergence inline: §3.4 (drop "there is NO OOA Director" — Operations Director leads it), §4.1 (Founder grants all-channel access, not zero), §12.1–12.2 (keep the Owner clause — spec §3.1.0).

Keep §3.5's text as "Director titles grant access to all channels; ultimate authority rests with the Server Owner."

- [ ] **Step 4: Run test to verify it passes**

Run: `node test/seed.test.js` → PASS. Then `npm test`.

- [ ] **Step 5: Seed the live channel**

Run: `node src/seed.js`
Expected: the ruleset posted to `#rules-and-regulations`. Re-read the posted messages and confirm no `@unknown-channel` pill appears.

- [ ] **Step 6: Commit**

```bash
git add src/seed.js test/seed.test.js package.json
git commit -m "feat(seed): publish the §1-12 ruleset with guild-resolved mentions"
```

---

### Task 11: Seed division rules and channel copy

**Files:**
- Modify: `src/seed.js`

**Interfaces:**
- Consumes: `DIVISIONS` from Task 4; `buildRuleset` from Task 10.
- Produces: `export function buildDivisionRules(division: string): { name: string; content: string }` — ERS/CIS/EWO/OOA text from §11, each mentioning its own `#x-documentation`.

- [ ] **Step 1: Write the failing test**

```js
const ers = buildDivisionRules('ERS');
assert.ok(ers.content.includes('voltage'));
assert.ok(/<#\d+>/.test(ers.content));
const cis = buildDivisionRules('CIS');
assert.ok(cis.content.includes('AI-generated'));
const ewo = buildDivisionRules('EWO');
assert.ok(ewo.content.toLowerCase().includes('consent'));
const ooa = buildDivisionRules('OOA');
assert.ok(ooa.content.includes('inventory'));
for (const d of ['ERS','CIS','EWO','OOA']) assert.doesNotThrow(() => buildDivisionRules(d));
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/seed.test.js` → FAIL, `buildDivisionRules is not exported`.

- [ ] **Step 3: Implement and seed**

Transcribe §11 per division into `buildDivisionRules`, resolving `#x-documentation` through the same `mention()` helper. Post each to its own division's documentation channel.

- [ ] **Step 4: Seed the 21 new channels**

Every channel created in Task 7 gets a short, real description — never an empty shell. A reviewer scrolling `#executive-board` should find something that explains what belongs there.

- [ ] **Step 5: Run and verify**

Run: `node src/seed.js`, then check no new channel is empty and no message shows `@unknown-channel`.

- [ ] **Step 6: Commit**

```bash
git add src/seed.js test/seed.test.js
git commit -m "feat(seed): division rules and copy for all new channels"
```

---

### Task 12: `/set-divisions`, `/register`, `/logs`

**Files:**
- Modify: `src/index.js`
- Modify: `src/roleadmin.js`
- Test: `test/roleadmin.test.js` (extend)

**Interfaces:**
- Consumes: `MemberRegistry` (Task 1), `formatMemberId` (Task 2), `config.roles` (Task 3).
- Produces: three `SlashCommandBuilder`s named `set-divisions`, `register`, `logs`.

- [ ] **Step 1: Write the failing test**

```js
// /set-divisions never touches ✅ Member or a permanent id
assert.deepStrictEqual(await applyDivisions({ discordId: '1' }, ['ERS','CIS'], {
  memberRoleId: 'M', vicId: 'VIC-MEM-004', divisionRoleIds: { ERS: 'E', CIS: 'C', EWO: 'W', OOA: 'O' },
}), { added: ['E','C'], removed: [], preserved: ['M'] });

// invalid division is rejected before any API call
await assert.rejects(() => applyDivisions({}, ['BAD'], {}), /unknown division/);

// /register is idempotent and refuses to re-issue
const reg = new MemberRegistry(tmp);
const first = registerMember(reg, 'discord-1', { divisions: ['CIS'] });
assert.strictEqual(first.memberId, 'VIC-MEM-001');
assert.strictEqual(registerMember(reg, 'discord-1', {}), first);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/roleadmin.test.js` → FAIL, `applyDivisions is not a function`.

- [ ] **Step 3: Implement `applyDivisions` and `registerMember` in `src/roleadmin.js`**

`applyDivisions(target, divisions, ctx)` computes the add/remove sets, returns `{ added, removed, preserved }`, and **never** touches `memberRoleId`. Validate every division name against the four known keys **before** the first API call so a typo cannot half-apply.

- [ ] **Step 4: Register the three commands in `src/index.js`**

Each handler must `deferReply()` on its first line — every slow handler in this bot already carries that fix and a new one without it will time out at 3s. `/set-divisions` and `/register` are gated to `⚙️ Director of Operations`; `/logs` to staff. `/register` posts the issued id to `#membership-registry`.

- [ ] **Step 5: Run and verify**

Run: `npm test`, then `pm2 restart vic-bot && pm2 logs vic-bot --lines 30`.
Expected: 18 commands registered at boot, no unhandled rejections.

- [ ] **Step 6: Commit**

```bash
git add src/index.js src/roleadmin.js test/roleadmin.test.js
git commit -m "feat(commands): /set-divisions, /register, /logs"
```

---

### Task 13: Documentation

**Files:**
- Modify: `docs/BOTS.md`
- Modify: `docs/UPGRADE-ROADMAP.md`

**Interfaces:**
- Consumes: everything above.
- Produces: docs only.

- [ ] **Step 1: Rewrite `docs/BOTS.md`**

Include the 13-category tree, the 16 governance roles with charter basis and holder, the 18 commands with their access tier, and the `VIC-MEM-NNN` lifecycle. State plainly that `📋 OOA Director` does not exist and why, and that `⚡ Founder` is not a zero-power tag — both contradict what a reader may assume.

- [ ] **Step 2: Update `docs/UPGRADE-ROADMAP.md`**

Close the division and director gaps. Add the open Charter items from spec §11.1 (Owner authority, Founder breadth, merged Operations/OOA role, Board-only approval) as amendments requiring Art. IX treatment.

- [ ] **Step 3: Commit**

```bash
git add docs/BOTS.md docs/UPGRADE-ROADMAP.md
git commit -m "docs: 13-category tree, 18 commands, charter amendment backlog"
```

---

## Final verification

- [ ] `npm test` — every file in the chain, exit 0
- [ ] `node src/doctor.js` — 0 fail
- [ ] `node src/verify-tiers.js` — 0 wrong
- [ ] `node src/phase5.js` twice more — no duplicates, no deletions
- [ ] Live check: a member sees 01, 02, 03, 04, 11, 12 and nothing else; adding a division role reveals exactly one more category
- [ ] Live check: `iahmedak` sees all 13 categories
- [ ] Live check: `#rules-and-regulations` renders every mention, none as `@unknown-channel`
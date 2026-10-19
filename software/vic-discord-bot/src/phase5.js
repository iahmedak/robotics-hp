/**
 * phase5 — apply the 13-category layout to the live guild.
 *
 * Two phases, in this order, and the order is load-bearing:
 *
 *   1. roles     — create the five charter offices, insert them above the bot
 *   2. channels  — categories, renames, creations, re-homes, cleanup
 *
 * Channel moves run only after every category exists. Moving a channel into
 * a category that does not exist yet silently detaches it, which is how a
 * previous phase dropped a voice category.
 *
 * Every step is idempotent: resolve by name, skip what already exists. Run it
 * twice and the second run is a no-op.
 *
 *   node src/phase5.js --dry     print the plan, mutate nothing
 *   node src/phase5.js           apply
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { REST } from 'discord.js';
import { config, normalizeRoleName } from './config.js';
import {
  CATEGORIES, CHANNELS, DIVISIONS, RENAMES, CATEGORY_RENAMES, REHOME, NEW_ROLES,
  allChannelNames, allChannels,
} from './layout.js';

const DRY = process.argv.includes('--dry');
const rest = new REST({ version: '10' }).setToken(config.discord.token);
const GID = config.discord.guildId;
const DATA_DIR = '.data';

const T = 0; const F = 15; const V = 2; const C = 4;

/**
 * Key for matching a channel name against the API.
 *
 * Discord stores channel names WITHOUT the leading '#' — the layout uses
 * '#general' for readability, the API returns 'general'. Matching the raw
 * string silently misses every rename, and phase5 then creates a duplicate
 * channel instead of renaming the existing one.
 */
function chKey(name) {
  return normalizeRoleName(String(name ?? '').replace(/^#/, ''));
}

/** Topics may not contain '#'. Build one from the channel name instead. */
function topicFor(name) {
  return `VIC — ${String(name).replace(/^#/, '').replace(/[-_]/g, ' ')}`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let created = 0;
let renamed = 0;
let moved = 0;
let deleted = 0;
let assigned = 0;
let skipped = 0;

function save(name, data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, name), JSON.stringify(data, null, 2));
}

async function getChannels() {
  return rest.get(`/guilds/${GID}/channels`);
}

async function getRoles() {
  return rest.get(`/guilds/${GID}/roles`);
}

/* ------------------------------------------------------------------ roles */

/**
 * Position targets, highest first. Everything above the bot is inserted
 * below; vic-t1, Founder, Admin and Moderator are already above it and are
 * never touched — Discord refuses role edits above the actor.
 */
/**
 * Target positions, highest first.
 *
 * Everything here is BELOW the bot. Discord will not let a bot insert a role
 * above its own highest role: doing so requires renumbering the roles already
 * above it (Founder, Admin, Moderator), and the bot is not allowed to move
 * those. A full-array PATCH containing them fails with "Missing Permissions";
 * a sparse PATCH is interpreted by array index and scatters the roles into
 * the member tier.
 *
 * Keeping the officers under the bot is also the safe arrangement: the bot
 * must sit above every role it grants or /set-divisions fails at runtime.
 * Since all Director roles carry full channel access anyway (spec §3.1.2),
 * nothing user-visible depends on them outranking the bot.
 */
const ROLE_TARGETS = [
  { key: 'executiveDirector', position: 28 },
  { key: 'operationsDirector', position: 27 },
  { key: 'cisDirector', position: 26 },
  { key: 'ersDirector', position: 25 },
  { key: 'ewoDirector', position: 24 },
];

export async function ensureRoles() {
  console.log('\n▸ roles');

  let roles = await getRoles();
  const byName = new Map(roles.map((r) => [normalizeRoleName(r.name), r]));
  const ids = {};

  // create what is missing
  for (const want of NEW_ROLES) {
    const found = byName.get(chKey(want.name));
    if (found) {
      ids[want.key] = found.id;
      console.log(`   = ${want.name}  (exists, position ${found.position})`);
      skipped++;
      continue;
    }
    if (DRY) {
      console.log(`   + ${want.name}  (would create)`);
      ids[want.key] = 'DRY';
      continue;
    }
    const made = await rest.post(`/guilds/${GID}/roles`, {
      body: { name: want.name, permissions: '0', color: 0, hoist: true },
    });
    ids[want.key] = made.id;
    created++;
    console.log(`   + ${made.name}  (created, position ${made.position})`);
    await sleep(250);
  }

  if (DRY) return ids;

  // Order: send the FULL array, because Discord derives position from array
  // index — a sparse payload scatters roles. A full payload is only accepted
  // if the roles already above the bot keep their relative order, so assert
  // that before sending rather than discovering it as a 403.
  roles = await getRoles();
  const botRole = roles.find((r) => normalizeRoleName(r.name) === normalizeRoleName(config.roles.bot));
  if (!botRole) throw new Error(`bot role "${config.roles.bot}" not found in guild`);

  const newIds = new Set(Object.values(ids).filter((id) => id && id !== 'DRY'));
  const untouched = roles
    .filter((r) => !newIds.has(r.id))
    .sort((a, b) => b.position - a.position);

  const aboveBefore = untouched.filter((r) => r.position > botRole.position).map((r) => r.id);

  const order = [...untouched];
  // insert new roles from the bottom up so an earlier insert cannot shift a
  // later one's target index.
  // `order` is highest-first, so array index 0 is the TOP role and Discord's
  // `position` counts from the BOTTOM. index = length - 1 - position.
  // Splicing at `position` directly drops the roles to the bottom, which is
  // exactly what the first run did.
  const finalLength = order.length + ROLE_TARGETS.length;
  for (const t of [...ROLE_TARGETS].sort((a, b) => b.position - a.position)) {
    const id = ids[t.key];
    if (!id || id === 'DRY') continue;
    const index = finalLength - 1 - t.position;
    if (index < 0 || index > order.length) throw new Error(`target position ${t.position} is out of range`);
    order.splice(index, 0, { id, name: t.key });
  }

  // The guard is about roles the bot never owned: moving a pre-existing role
  // above the bot is rejected by Discord. New roles are free to sit anywhere,
  // so they are excluded from the comparison.
  const aboveAfter = order
    .filter((r) => !newIds.has(r.id))
    .filter((r) => r.position > botRole.position)
    .map((r) => r.id);
  if (aboveBefore.join() !== aboveAfter.join()) {
    throw new Error('refusing to reorder roles above the bot: ' + aboveBefore.join() + ' -> ' + aboveAfter.join());
  }

  await rest.patch(`/guilds/${GID}/roles`, {
    body: order.map((r, i) => ({ id: r.id, position: order.length - 1 - i })),
  });
  await sleep(600);

  // The bot must stay strictly above every Director role, or role grants
  // fail at runtime and nothing in the test suite notices.
  roles = await getRoles();
  const pos = new Map(roles.map((r) => [r.id, r.position]));
  const botPos = pos.get(botRole.id);
  for (const t of ROLE_TARGETS) {
    const p = pos.get(ids[t.key]);
    if (p === undefined) continue;
    if (p >= botPos) {
      throw new Error(`refusing to continue: ${t.key} at ${p} is not below the bot at ${botPos}`);
    }
  }
  console.log(`   ✓ bot at ${botPos}, all officers below it`);

  // assign only where the holder is actually in the guild
  const members = await rest.get(`/guilds/${GID}/members?limit=1000`);
  const byUsername = new Map(members.map((m) => [normalizeRoleName(m.user.username), m.user.id]));
  const guild = await rest.get(`/guilds/${GID}`);

  for (const want of NEW_ROLES) {
    const userId = byUsername.get(normalizeRoleName(want.holder));
    if (!userId) {
      console.log(`   · ${want.name.padEnd(28)} pending-invite (${want.holder} is not in the guild)`);
      continue;
    }
    if (!DRY) {
      await rest.put(`/guilds/${GID}/members/${userId}/roles/${ids[want.key]}`, { body: {} });
      await sleep(250);
    }
    assigned++;
    const isOwner = userId === guild.owner_id ? '  (guild owner)' : '';
    console.log(`   ✓ ${want.name.padEnd(28)} → ${want.holder}${isOwner}`);
  }

  save('role-ids.json', ids);
  return ids;
}

/* --------------------------------------------------------------- channels */

async function ensureCategories() {
  console.log('\n▸ categories');
  let cats = (await getChannels()).filter((c) => c.type === C).sort((a, b) => a.position - b.position);
  const byName = new Map(cats.map((c) => [normalizeRoleName(c.name), c]));
  const ids = {};

// Rename existing categories first so they can be matched. In dry mode the
  // rename is applied to the in-memory model only — without this the dry run
  // reports every category as "would create" and tells you nothing.
  const virtualRename = new Map(Object.entries(CATEGORY_RENAMES));
  const virtualName = (n) => virtualRename.get(n) ?? n;

  if (!DRY) {
    for (const [from, to] of Object.entries(CATEGORY_RENAMES)) {
      if (to === null) continue;
      const c = byName.get(chKey(from));
      if (!c || normalizeRoleName(c.name) === normalizeRoleName(to)) continue;
      await rest.patch(`/channels/${c.id}`, { body: { name: to } });
      renamed++;
      console.log(`   ~ ${from} → ${to}`);
      await sleep(200);
      c.name = to;
      byName.set(normalizeRoleName(to), c);
    }
    cats = (await getChannels()).filter((c) => c.type === C).sort((a, b) => a.position - b.position);
    byName.clear();
    for (const c of cats) byName.set(normalizeRoleName(c.name), c);
  } else {
    // simulate: rebuild the index with renamed names
    const sim = new Map();
    for (const c of cats) sim.set(normalizeRoleName(virtualName(c.name)), { ...c, name: virtualName(c.name) });
    byName.clear();
    for (const [k, v] of sim) byName.set(k, v);
  }

  // create any category that still does not exist
  for (const { n, name } of CATEGORIES) {
    const found = byName.get(normalizeRoleName(name));
    if (found) {
      ids[n] = found.id;
      if (found.position !== n - 1) console.log(`   ~ ${name.padEnd(42)} move ${found.position} → ${n - 1}`);
      skipped++;
      continue;
    }
    if (DRY) {
      console.log(`   + ${name}  (would create at ${n - 1})`);
      ids[n] = 'DRY';
      continue;
    }
    const made = await rest.post(`/guilds/${GID}/channels`, {
      body: { name, type: C, position: n - 1 },
    });
    ids[n] = made.id;
    created++;
    console.log(`   + ${made.name}`);
    await sleep(250);
  }

  // set final positions
  if (!DRY) {
    for (const { n, name } of CATEGORIES) {
      const c = (await rest.get(`/channels/${ids[n]}`));
      if (c.position === n - 1) continue;
      await rest.patch(`/channels/${ids[n]}`, { body: { position: n - 1 } });
      await sleep(180);
      console.log(`   ✓ ${name.padEnd(42)} position ${c.position} → ${n - 1}`);
    }
  }

  save('category-ids.json', ids);
  return ids;
}

async function ensureChannels(categoryIds) {
  console.log('\n▸ channels');
  let chans = await getChannels();
  const byName = new Map(chans.map((c) => [chKey(c.name), c]));

  // 1. renames — every name must be final before anything is created
  if (!DRY) {
    for (const [from, to] of Object.entries(RENAMES)) {
      if (to === null || chKey(from) === chKey(to)) continue;
      const c = byName.get(chKey(from));
      if (!c) continue;
      await rest.patch(`/channels/${c.id}`, { body: { name: to } });
      renamed++;
      console.log(`   ~ ${from} → ${to}`);
      await sleep(200);
      byName.delete(chKey(from));
      byName.set(chKey(to), { ...c, name: to });
    }
    chans = await getChannels();
    byName.clear();
    for (const c of chans) byName.set(chKey(c.name), c);
  }

  // 1b. deletions — a RENAMES entry of `null` means the channel is retired.
  // It must be removed before the legacy category it sits in can be deleted,
  // or the category never empties and lingers as an empty shell.
  for (const from of Object.keys(RENAMES)) {
    if (RENAMES[from] !== null) continue;
    const c = byName.get(chKey(from));
    if (!c) continue;
    if (DRY) {
      console.log(`   - ${c.name}  (would delete, retired)`);
      continue;
    }
    await rest.delete(`/channels/${c.id}`);
    deleted++;
    console.log(`   - ${c.name}  (deleted, retired)`);
    byName.delete(chKey(from));
    await sleep(250);
  }

  // 2. creations
  const kindToType = { text: T, forum: F, voice: V };
  const ids = {};
  for (const [n, list] of Object.entries(CHANNELS)) {
    for (const want of list) {
      const found = byName.get(chKey(want.name));
      if (found) {
        ids[want.name] = found.id;
        skipped++;
        continue;
      }
      if (DRY) {
        console.log(`   + ${want.name}  (would create in category ${n})`);
        ids[want.name] = 'DRY';
        continue;
      }
      const body = {
        name: want.name,
        type: kindToType[want.kind],
        parent_id: categoryIds[n],
      };
      // Forums and voice channels reject some topic text that text channels
      // accept, and Discord reports the failure against whichever body field
      // trips its validator first. Set the topic only where it is safe.
      if (want.kind === 'text') body.topic = topicFor(want.name);

      let made;
      try {
        made = await rest.post(`/guilds/${GID}/channels`, { body });
      } catch (e) {
        throw new Error(
          `creating "${want.name}" (kind=${want.kind}) in category ${n} failed: ` +
          `${e.rawError?.message ?? e.message}`,
        );
      }
      ids[want.name] = made.id;
      created++;
      console.log(`   + ${made.name}`);
      await sleep(250);
    }
  }

  // 3. placement — DECLARATIVE. Every channel the layout names is moved to
  //    the category the layout gives it. An explicit REHOME list was
  //    incomplete and silently left six Build & Showcase channels behind in
  //    a legacy category; deriving placement from the layout cannot drift
  //    that way. REHOME is still honoured for anything it names first.
  const targetOf = new Map(REHOME.map((r) => [chKey(r.name), r.to]));
  for (const c of allChannels()) targetOf.set(chKey(c.name), c.category);

  for (const [name, to] of targetOf) {
    const id = byName.get(name)?.id;
    if (!id) continue;
    const cur = await rest.get(`/channels/${id}`);
    if (cur.parent_id === categoryIds[to]) continue;
    if (DRY) {
      console.log(`   > ${cur.name} → category ${to}`);
      continue;
    }
    await rest.patch(`/channels/${id}`, { body: { parent_id: categoryIds[to] } });
    moved++;
    console.log(`   > ${cur.name} → category ${to}`);
    await sleep(200);
  }

  save('channel-ids.json', ids);
  return ids;
}

async function cleanup() {
  console.log('\n▸ cleanup');
  const keep = new Set(CATEGORIES.map((c) => normalizeRoleName(c.name)));
  const chans = await getChannels();
  const cats = chans.filter((c) => c.type === C && !keep.has(normalizeRoleName(c.name)));

  for (const c of cats) {
    const children = chans.filter((x) => x.parent_id === c.id);
    if (children.length > 0) {
      console.log(`   ! ${c.name} still has ${children.length} channel(s) — left alone`);
      continue;
    }
    if (DRY) {
      console.log(`   - ${c.name}  (would delete, empty)`);
      continue;
    }
    await rest.delete(`/channels/${c.id}`);
    deleted++;
    console.log(`   - ${c.name}  (deleted, was empty)`);
    await sleep(250);
  }
}

async function main() {
  console.log(`\n${DRY ? 'DRY RUN — nothing will change' : 'APPLYING'}  guild ${GID}`);
  await ensureRoles();
  if (process.argv.includes('--roles-only')) return;
  const categoryIds = await ensureCategories();
  if (DRY) return;
  await ensureChannels(categoryIds);
  await cleanup();

  console.log('\n▸ summary');
  console.log(`   created ${created}   renamed ${renamed}   moved ${moved}`);
  console.log(`   deleted ${deleted}   assigned ${assigned}   already-correct ${skipped}`);
}

// Windows-safe "am I the entry point?" check. Comparing against a
// hand-built file:// string breaks on win32, where import.meta.url has a
// leading slash ("file:///C:/...") that process.argv[1] does not.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(`\n✗ phase5 failed: ${e.message}`);
    process.exit(1);
  });
}
/**
 * Adds the public-facing layer — the one thing VIC was missing.
 *
 * A non-member (or a pending applicant) can READ these channels and see
 * real work. That is the recruitment surface: someone evaluating VIC can
 * look before applying.
 *
 * But posting requires ✅ Member. Public write access on a small student
 * server is a spam magnet, and it would undercut the whole point of the
 * gated model — you would be visible but voiceless.
 *
 *   node src/add-public-layer.js
 */

import 'dotenv/config';
import { REST } from 'discord.js';
import { config } from './config.js';

const rest = new REST({ version: '10' }).setToken(config.discord.token);
const GID = config.discord.guildId;

const V = 1n << 10n, S = 1n << 11n, E = 1n << 14n, H = 1n << 16n;
const VIEW_ONLY = (V | H).toString();
const FULL = (V | S | E | H).toString();
const NO_SEND = (S).toString();

const SPEC = [
  {
    name: 'public-general',
    topic: 'Open to everyone, including non-members. Verified members can post.',
    body: {
      title: '🌍 Welcome — public floor',
      description:
        'This channel is open to **anyone**, including people who have not applied to VIC yet.\n\n' +
        'If you are here to see what we build, this is the place. Ask anything — if a member is ' +
        'around they will answer, and if not, your question stays visible for the next person.',
      color: 0x1f6feb,
    },
  },
  {
    name: 'open-source-public',
    topic: 'Open-source work from VIC. Visible to everyone.',
    body: {
      title: '📂 Open source, public',
      description:
        'Everything here is visible to **anyone** — no membership needed.\n\n' +
        'If we built something and released it, it belongs here: repositories, documentation, ' +
        'demos, write-ups. If you find something useful, use it, fork it, tell us what broke.',
      color: 0x2ecc71,
    },
  },
  {
    name: 'public-announcements',
    topic: 'Public-facing announcements — events, showcases, recruitment.',
    body: {
      title: '📣 Public announcements',
      description:
        'What VIC is doing, open to **everyone**.\n\n' +
        'Events, competition results, recruitment drives, and anything a prospective member would ' +
        'want to know before applying.',
      color: 0xe74c3c,
    },
  },
];

async function put(channelId, roleId, allow, deny) {
  await rest.put(`/channels/${channelId}/permissions/${roleId}`, {
    body: { allow, deny }, reason: 'VIC public layer',
  });
}

const roles = await rest.get(`/guilds/${GID}/roles`);
const byName = Object.fromEntries(roles.map((r) => [r.name, r.id]));
const memberR = byName[config.roles.member];
const mentorR = byName[config.roles.mentor];
const staff = [byName[config.roles.admin], byName[config.roles.moderator], byName[config.roles.founder]].filter(Boolean);
const botR = byName[config.roles.bot];

let chs = await rest.get(`/guilds/${GID}/channels`);

// ---- category ----
let cat = chs.find((c) => c.name === 'Public Community' && c.type === 4);
if (!cat) {
  cat = await rest.post(`/guilds/${GID}/channels`, {
    body: { name: 'Public Community', type: 4, reason: 'VIC public layer' },
  });
  console.log('+ category  Public Community');
} else {
  console.log('  category  Public Community (exists)');
}

// ---- channels ----
for (const spec of SPEC) {
  let ch = chs.find((c) => c.name === spec.name);
  if (!ch) {
    ch = await rest.post(`/guilds/${GID}/channels`, {
      body: { name: spec.name, type: 0, parent_id: cat.id, topic: spec.topic, reason: 'VIC public layer' },
    });
    console.log(`+ #${spec.name}`);
  } else {
    await rest.patch(`/channels/${ch.id}`, { body: { topic: spec.topic } });
    console.log(`  #${spec.name} (exists, topic updated)`);
  }

  // Everyone may VIEW. Nobody but a verified member may POST.
  await put(ch.id, GID, VIEW_ONLY, NO_SEND);
  for (const rid of [memberR, mentorR, ...staff, botR].filter(Boolean)) {
    await put(ch.id, rid, FULL, '0');
  }

  // Seed once.
  const msgs = await rest.get(`/channels/${ch.id}/messages?limit=1`);
  if (!msgs.length) {
    await rest.post(`/channels/${ch.id}/messages`, {
      body: {
        embeds: [{
          ...spec.body,
          footer: { text: 'VoltEdge Innovation Community · Team 007' },
        }],
      },
    });
    console.log(`    seeded #${spec.name}`);
  }
}

// ---- verify ----
chs = await rest.get(`/guilds/${GID}/channels`);
console.log('\n════ VERIFICATION ════');
const nameOf = Object.fromEntries(roles.map((r) => [r.id, r.name]));
let bad = 0;
for (const spec of SPEC) {
  const ch = chs.find((c) => c.name === spec.name);
  const ow = ch.permission_overwrites ?? [];
  const ev = ow.find((p) => p.id === GID);
  const canView = (BigInt(ev?.allow ?? '0') & V) !== 0n && (BigInt(ev?.deny ?? '0') & V) === 0n;
  const canSend = (BigInt(ev?.allow ?? '0') & S) !== 0n && (BigInt(ev?.deny ?? '0') & S) === 0n;
  const posters = ow.filter((p) => p.id !== GID && (BigInt(p.allow) & S) !== 0n).map((p) => nameOf[p.id]);
  const ok = canView && !canSend && posters.includes(config.roles.member);
  if (!ok) bad++;
  console.log(` ${ok ? 'ok  ' : 'FAIL'} #${spec.name.padEnd(20)} everyone-read=${canView} everyone-write=${canSend} posters=[${posters.join(', ')}]`);
}
console.log(bad === 0 ? '\n✅ Public layer correct: readable by all, postable by members.\n' : `\n⚠️ ${bad} wrong\n`);
process.exit(bad === 0 ? 0 : 1);
/**
 * Fill every channel the restructure created, and pin its purpose.
 *
 * A channel nobody wrote in reads as abandoned, and this server competes on
 * presentation. Every text and forum channel gets a real purpose post from
 * the bot, pinned so it sits at the top. Voice channels get a topic instead
 * — Discord does not allow messages there.
 *
 *   node src/seed-layout.js --dry     report only
 *   node src/seed-layout.js           post and pin
 */

import 'dotenv/config';
import { REST } from 'discord.js';
import { config, normalizeRoleName } from './config.js';

const DRY = process.argv.includes('--dry');
const rest = new REST({ version: '10' }).setToken(config.discord.token);
const GID = config.discord.guildId;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const C = 0x2b6d4; // brand cyan

/** channel name -> { title, body, fields }. Voice uses `topic`. */
const CONTENT = {
  // 01 START HERE
  'server-info': {
    title: '⚡ About VoltEdge Innovation Community',
    body: '**VIC** is the innovation community of **Team 007** — Bhatkal, Karnataka.\n\nWe are four divisions working across electronics, computing, events and operations.',
    fields: [
      ['⚙️ ERS', 'Electronics & Robotic Systems'],
      ['💻 CIS', 'Computing & Intelligent Sciences'],
      ['📣 EWO', 'Events, Workshops & Outreach'],
      ['📋 OOA (Ops & Admin)', 'Operations & Administration'],
      ['🏛️ Founded', '14 September 2026'],
    ],
  },

  // 02 PUBLIC COMMUNITY
  'public-general': {
    title: '🌍 Welcome, anyone',
    body: 'This channel is open to everyone — you do not need to be a member to talk here.\n\nAsk what VIC is, what we build, or how to apply. Someone will point you at `#membership-information`.',
    fields: [['Not a member yet?', 'Read <#membership-information>, then use <#verification-help>.']],
  },
  'open-source-public': {
    title: '🧑‍💻 Open source, in the open',
    body: 'Things we build in the open, and things we would like help with.\n\nIf you are not a VIC member, you can still read, ask questions and offer help.',
    fields: [['House rule', 'Credit the author and respect the licence of anything posted here.']],
  },
  'public-announcements': {
    title: '📣 Announcements',
    body: 'Read-only. Official VIC announcements are posted here.',
    fields: [['Looking to post?', 'Staff post in this channel.']],
  },

  // 03 INFORMATION
  'policy-updates': {
    title: '📋 Policy change log',
    body: 'Every amendment to <#rules-and-regulations> is recorded here with its date and who approved it.\n\nThe rules channel holds the **current** text. This log holds the **history**.',
    fields: [['How amendments work', 'Proposed 7 days ahead, two-thirds of founding members, recorded and signed.']],
  },
  'community-updates': {
    title: '🌱 What VIC has been doing',
    body: 'A running record of what the Community actually did — workshops held, projects shipped, competitions entered, people mentored.',
    fields: [['Cadence', 'Updated when something real happens, not on a schedule.']],
  },

  // 04 COMMUNITY
  'polls-and-feedback': {
    title: '📊 Polls & feedback',
    body: 'Shape what VIC does next. Propose a change, vote on an open question, or tell us what is missing.',
    fields: [['Good polls', 'One question, three or four options, a clear deadline.']],
  },
  'suggestions': {
    title: '💡 Suggestions',
    body: 'Anything that would make VIC better. Small or large.',
    fields: [['What helps', 'Say what problem you are trying to solve, not only the solution.']],
  },
  'opportunities-forum': {
    title: '💼 Opportunity board',
    body: 'Internships, hackathons, grants, competitions and calls for volunteers.\n\nPost the source link and the deadline. Members can claim an item in the thread.',
    fields: [['Rule', 'No self-promotion or paid placement. Genuine openings only.']],
  },
  'help-desk': {
    title: '❓ Help desk',
    body: 'Stuck on anything — a build, a tool, a concept, or how VIC works.\n\nSearch before you post; if it is division-specific it may belong in that division instead.',
    fields: [['Before you post', 'Include what you tried and what happened. It halves the time to an answer.']],
  },

  // 05 EXECUTIVE BOARD
  'executive-board': {
    title: '🏛️ Executive Board',
    body: 'The governing body of VIC. Community policy, project sanctioning, member discipline, division management and resource allocation.',
    fields: [
      ['Composition', 'Director of Operations, four Division Directors, Executive Director.'],
      ['Decisions', 'Final unless overturned by a two-thirds majority of founding members.'],
      ['Visibility', 'Officers only.'],
    ],
  },
  'leadership-coordination': {
    title: '🤝 Leadership coordination',
    body: 'Running the Community: division health, cross-division work, who needs what, and what is blocked.',
    fields: [['Standing item', 'Anything blocking a division is raised here, not in a division channel.']],
  },
  'executive-decisions': {
    title: '⚖️ Decision record',
    body: 'Read-only record of decisions the Board has taken, with the date, who decided, and the reasoning.',
    fields: [['Why read-only', 'A decision that cannot be edited after the fact is a decision that can be trusted.']],
  },
  'meeting-agendas-and-minutes': {
    title: '🗓️ Agendas & minutes',
    body: 'The agenda goes up before a Board meeting. The minutes go up after it.\n\nEveryone in #board-meeting-agendas can see that a meeting happened and what was decided, even if they cannot attend.',
    fields: [['Notice', 'Agendas are circulated at least seven days ahead for charter amendments.']],
  },

  // 06 OPERATIONS & ADMINISTRATION
  'operations-control': {
    title: '🎛️ Operations control',
    body: 'Day-to-day running of the Community: onboarding flow, role changes, incident response.',
    fields: [['Held by', '⚙️ Director of Operations.']],
  },
  'membership-registry': {
    title: '📒 Membership registry',
    body: 'Read-only. The authoritative list of members and their permanent IDs.',
    fields: [
      ['ID format', '`VIC-MEM-001`, `VIC-MEM-002`, … — permanent and never reused.'],
      ['Rule', 'Do not post here. Corrections go through the Director of Operations.'],
    ],
  },
  'member-role-assignments': {
    title: '🔁 Member role assignments',
    body: 'Every division assignment and Director appointment, with who authorised it and when.',
    fields: [['Audit', 'A division change never alters somebody\u2019s permanent ID.']],
  },
  'administrative-records': {
    title: '🗄️ Administrative records',
    body: 'Records the Community is obliged to keep: charter versions, amendment history, signed documents.',
    fields: [['Rule', 'Do not edit or delete anything in here.']],
  },
  'operations-meetings': {
    title: '🗓️ Operations meetings',
    body: 'Planning and handover for the Operations and Administration division.',
    fields: [['Held by', '📋 OOA — Operations & Administration.']],
  },
  'bot-commands': {
    title: '🤖 Bot commands',
    body: 'Bot command output and command discussion for staff.\n\nThe bot logs moderation events to #mod-log and keeps a fuller audit in #audit-log.',
    fields: [
      ['Available to', '⚙️ Director of Operations and moderators.'],
      ['Handled', '⚙️ Director of Operations for `/set-divisions` and `/register`.'],
    ],
  },

  // 07/08 division forums
  'hardware-help': {
    title: '🔧 Hardware help',
    body: 'Circuits, soldering, power, PCB layout, embedded debugging — anything physical that is blocking you.',
    fields: [['Safety', 'Mains voltage and lithium battery work goes through a mentor first. See #ers-documentation.']],
  },
  'code-help': {
    title: '💻 Code help',
    body: 'Stuck on code — a bug, an algorithm, an architecture choice, a build that will not pass.',
    fields: [['Good posts', 'Language, error text, what you already tried.']],
  },

  // 11 PROJECTS & COLLABORATION
  'project-proposals': {
    title: '📝 Project proposals',
    body: 'Pitch a project to the Executive Board. All projects are sanctioned by the Board before they start.',
    fields: [
      ['Include', 'Title, division(s), project lead, skills needed, timeline.'],
      ['On approval', 'A Project Lead, a Team Captain and a Guide or Mentor are designated.'],
    ],
  },
  'looking-for-team': {
    title: '🔍 Looking for team',
    body: 'Find people across divisions for a sanctioned project. Post the project, the roles you need, and the skills.',
    fields: [['Note', 'A non-founder can be a Director. Posts in #cross-division-collaboration reach every division.']],
  },
  'showcase': {
    title: '🏆 Showcase',
    body: 'Finished work. Demos, builds, write-ups, competition results.\n\nPost what you made, what it does, and a link to the repository or the demo.',
    fields: [['Credit', 'Credit everyone who worked on it.']],
  },

  // 13 LOGS
  'audit-log': {
    title: '📊 Audit log',
    body: 'The full operational audit trail — role grants, revocations, approvals, warnings, configuration changes.',
    fields: [
      ['Who can read', 'Staff. 🎖️ Executive Director has view-only access.'],
      ['Rule', 'Append-only. Nothing here is edited or deleted.'],
    ],
  },
};

const VOICE_TOPICS = {
  'VIC General Meeting': 'Open Community meeting. Everyone may join.',
  'Project Room 1': 'Working room for a sanctioned VIC project.',
  'Project Room 2': 'Working room for a sanctioned VIC project.',
  'Executive Meeting': 'Directors only. Do not enter unless invited.',
  'ERS Team Meeting': '📋 ERS — Electronics & Robotics. Mentor-led.',
  'CIS Team Meeting': '💻 CIS — Computing & Intelligent Sciences.',
  'EWO Team Meeting': '📣 EWO — Events, Workshops & Outreach.',
  'OOA Team Meeting': '📋 OOA — Operations & Administration.',
};

function embedFor(name, c) {
  return {
    embeds: [{
      title: c.title,
      description: c.body,
      color: C,
      fields: (c.fields ?? []).map(([n, v]) => ({ name: n, value: v, inline: false })),
      footer: { text: 'VoltEdge Innovation Community — Team 007, Bhatkal' },
      timestamp: new Date().toISOString(),
    }],
  };
}

async function main() {
  console.log(`\n${DRY ? 'DRY RUN' : 'SEEDING'} layout content — guild ${GID}`);
  const me = await rest.get('/users/@me');
  const chans = await rest.get(`/guilds/${GID}/channels`);
  const byName = new Map(chans.map((c) => [normalizeRoleName(c.name), c]));

  let posted = 0, pinned = 0, skipped = 0, topped = 0;

  for (const [name, content] of Object.entries(CONTENT)) {
    const ch = byName.get(normalizeRoleName(name));
    if (!ch) { console.log(`   ! ${name} not found`); continue; }

    const existing = await rest.get(`/channels/${ch.id}/messages?limit=50`);
    const mine = existing.filter((m) => m.author.id === me.id);
    const isForum = ch.type === 15;

    // A forum channel cannot receive a message. Its purpose post is a thread,
    // created with the content pre-filled so people can reply underneath it.
    const post = isForum
      ? () => rest.post(`/channels/${ch.id}/threads`, {
        body: {
          name: `${content.title.slice(0, 90)}`,
          message: embedFor(name, content),
          auto_archive_duration: 10080,
        },
      })
      : () => rest.post(`/channels/${ch.id}/messages`, { body: embedFor(name, content) });

    // Active AND archived, because searching only archived missed every live
  // thread and created a fresh duplicate on each run. The per-channel
  // /threads/active route 404s on some forums on this API version, so the
  // guild-level listing is used and filtered instead.
const activeThreads = async () => {
  const r = await rest.get(`/guilds/${GID}/threads/active?limit=100`);
  return r.threads ?? [];
};
let activeCache = null;
const findMine = isForum
      ? async () => {
        activeCache ??= await activeThreads();
        const inForum = activeCache.filter((t) => t.parent_id === ch.id && t.owner_id === me.id);
        if (inForum.length) return inForum[0];
        const archived = await rest.get(`/channels/${ch.id}/threads/archived/public?limit=50`);
        return (archived.threads ?? []).find((t) => t.owner_id === me.id) ?? null;
      }
      : async () => (await rest.get(`/channels/${ch.id}/messages?limit=50`))
        // type 6 is Discord's PIN_ADD system message, emitted whenever a pin
        // happens. It is authored by whoever pinned, so without the type
        // filter a previously-pinned bot message is found as "mine" and then
        // fails to pin with "cannot execute action on a system message".
        .find((m) => m.author.id === me.id && m.type === 0) ?? null;

    // Replace stale bot content so the rename corrections (OAD → OOA) land.
    for (const m of mine) {
      const text = JSON.stringify(m.embeds ?? []);
      const stale = name === 'server-info' ? /OAD/.test(text) : false;
      if (!stale) continue;
      if (DRY) { console.log(`   ~ ${name}  (would replace stale embed)`); continue; }
      await rest.delete(`/channels/${ch.id}/messages/${m.id}`);
      posted++;
      await sleep(150);
    }

    let existing0 = await findMine();
    if (name === 'server-info' && existing0) {
      // stale OAD embed: drop it so the corrected version is posted
      const text = JSON.stringify(existing0.embeds ?? []);
      if (/OAD/.test(text) && !DRY) {
        await rest.delete(`/channels/${ch.id}/messages/${existing0.id}`);
        existing0 = null;
        posted++;
        await sleep(150);
      }
    }

    let msgId = existing0?.id;
    if (!existing0) {
      if (DRY) { console.log(`   + ${name}  (would post + pin)`); continue; }
      let msg;
      try {
        msg = await post();
      } catch (e) {
        throw new Error(`posting to "${name}" (type ${ch.type}): ${e.rawError?.message ?? e.message}`);
      }
      if (!msg?.id) throw new Error(`posting to "${name}" returned no message id`);
      msgId = msg.id;
      posted++;
      await sleep(250);
    } else {
      skipped++;
    }

    const pins = await rest.get(`/channels/${ch.id}/pins?limit=100`);
    // Discord sometimes returns a pin entry with no `message` object, so a
    // bare `p.message.id` throws on an otherwise healthy channel.
    const pinnedIds = new Set(pins.map((p) => p?.message?.id).filter(Boolean));
    // A forum thread id is not a message id; the thread itself is the pin.
    if (msgId && !isForum && !pinnedIds.has(msgId)) {
      if (DRY) { console.log(`   @ ${name}  (would pin)`); continue; }
      try {
        await rest.put(`/channels/${ch.id}/pins/${msgId}`);
        pinned++;
      } catch (e) {
        // A system message cannot be pinned, and a forum thread id is not a
        // message id. Neither is worth aborting the whole seed for.
        console.log(`   ! could not pin in ${name}: ${e.rawError?.message ?? e.message}`);
      }
      await sleep(150);
    }
  }

  // voice channels: topic only.
  // This guild rejects a topic write on a voice channel for ANY string,
  // including "a" — CHANNEL_TOPIC_INVALID. It is not content filtering; the
  // write is simply refused. Best-effort, because the channel NAME already
  // states the purpose and nothing depends on the topic.
  let voiceTopicBlocked = false;
  for (const [name, topic] of Object.entries(VOICE_TOPICS)) {
    const ch = byName.get(normalizeRoleName(name));
    if (!ch) { console.log(`   ! ${name} not found`); continue; }
    if (ch.topic === topic) { skipped++; continue; }
    if (DRY) { console.log(`   ~ ${name}  (would set topic)`); continue; }
    if (voiceTopicBlocked) continue;
    try {
      await rest.patch(`/channels/${ch.id}`, { body: { topic } });
      topped++;
    } catch {
      voiceTopicBlocked = true;
      console.log('   ! voice topics are refused by this guild — skipped (names already carry the purpose)');
    }
    await sleep(120);
  }

  console.log(`\n   ${DRY ? 'would' : ''} post/replace ${posted}   pin ${pinned}   voice topics ${topped}   already present ${skipped}`);
}

main().catch((e) => {
  console.error(`\n✗ seed-layout failed: ${e.message}`);
  console.error(e.stack);
  process.exit(1);
});

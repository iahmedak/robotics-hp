/**
 * Content seeding — fills every channel so the server doesn't look like
 * an empty shell on first join.
 *
 * Idempotent: records what it posted in .data/seeds.json and skips
 * anything already seeded. Run with `--force` to repost everything.
 *
 *   node src/seed.js
 *   node src/seed.js --force
 */

import 'dotenv/config';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import { config } from './config.js';

const SEED_FILE = join(process.cwd(), '.data', 'seeds.json');
const FORCE = process.argv.includes('--force');

const VIC = 0x1f6feb;
const DIM = {
  ERS: 0x1f9cf0, CIS: 0x8e44ad, EWO: 0xe67e22, OAD: 0x16a085,
};

// -----------------------------------------------------------------
// Content
// -----------------------------------------------------------------
const CONTENT = {
  'welcome': {
    topic: 'Start here. Read this before anything else.',
    embed: {
      color: VIC,
      title: '⚡ Welcome to VoltEdge Innovation Community',
      description:
        "**VIC** is the innovation community of **Team 007**, Bhatkal — a student-led " +
        "collective building real hardware, real software, and real robots.\n\n" +
        "We came out of the **NRL 2025 National Robotics Finals** and we're taking " +
        "that energy further. This server is where the work actually happens.",
      fields: [
        { name: '🧭 New here?', value: 'Three steps:\n**1.** Read [`#rules`](https://discord.com/channels/PLACEHOLDER/rules)\n**2.** Apply at **vic-official.pages.dev**\n**3.** A moderator approves you and unlocks the division channels', inline: false },
        { name: '⚡ What you get when you\'re verified', value: 'Your division channels · `#project-rooms` · `#help-desk` · `#hardware-lab` · `#showcase`', inline: false },
        { name: '🧩 Our four divisions', value: '**⚙️ ERS** Electronics & Robotic Systems\n**💻 CIS** Computing & Intelligent Sciences\n**📣 EWO** Events, Workshops & Outreach\n**🛠️ OAD** Ops & Administration', inline: false },
      ],
      footer: { text: 'VoltEdge Innovation Community · Team 007 · Bhatkal' },
    },
  },

  'rules': {
    topic: 'Read this. No exceptions.',
    embed: {
      color: 0xe74c3c,
      title: '📜 Community Rules',
      description: 'This is a student community that takes its work seriously. Ten rules:',
      fields: [
        { name: '1 · Be decent', value: 'No harassment, slurs, or personal attacks. Disagree with the idea, not the person.', inline: false },
        { name: '2 · No spam', value: 'No self-promotion, no unsolicited DMs, no advertising your own channels here.', inline: false },
        { name: '3 · Stay on topic', value: 'Division channels are for division work. Put robotics in `#hardware-help`, code in `#code-help`.', inline: false },
        { name: '4 · Protect people\'s information', value: 'Never share another member\'s email, phone number, address, or personal photos without their consent.', inline: false },
        { name: '5 · Credit your people', value: 'Tag mentors and collaborators when you share work they helped with.', inline: false },
        { name: '6 · No NSFW content', value: 'None. Anywhere.', inline: false },
        { name: '7 · No piracy', value: 'No cracked software, no torrents, no cheats, no bypassed licences.', inline: false },
        { name: '8 · Don\'t fight the mods', value: 'If a moderator acts, you can ask why in DMs. Public arguments help nobody.', inline: false },
        { name: '9 · Use the forums', value: 'DMing a mentor for debugging wastes their time and yours. Post in `#help-desk`.', inline: false },
        { name: '10 · Be honest', value: 'Share what actually works and what actually broke. That\'s how the team learns.', inline: false },
      ],
      footer: { text: 'Breaking these rules can get you timed out or removed.' },
    },
  },

  'how-to-join': {
    topic: 'The exact steps to get verified.',
    embed: {
      color: 0x2ecc71,
      title: '🔐 How to join VIC',
      description: 'This server is gated. Here\'s the whole process:',
      fields: [
        { name: 'Step 1 — Apply', value: 'Go to **vic-official.pages.dev** and fill the application form. You need your real name, your Discord username, and the division you\'re applying to.', inline: false },
        { name: 'Step 2 — Wait for review', value: 'A moderator reviews your application in `#applications-review`. Most are answered within a day.', inline: false },
        { name: 'Step 3 — Get verified', value: 'On approval you get the `✅ Member` badge, your division role, and a DM with your **VIC ID** (format `APP-2026-XXXXXX`). Keep it — it\'s your permanent member code.', inline: false },
        { name: 'Step 4 — Say hello', value: 'Post in `#introductions`. Tell us what you\'re building.', inline: false },
      ],
      footer: { text: 'Your Discord username on the form must match your Discord account, or approval will fail.' },
    },
  },

  'server-info': {
    topic: 'About VIC — divisions, mentors, and what we do.',
    embed: {
      color: VIC,
      title: '⚡ About VoltEdge Innovation Community',
      description:
        '**VIC** is the innovation community of **Team 007** — the robotics team from ' +
        'Bhatkal, Karnataka that competed at the **NRL 2025 National Robotics Finals**.\n\n' +
        'This community exists because a robotics project is bigger than one person\'s ' +
        'free time. It\'s where the work continues between competitions.',
      fields: [
        { name: '⚙️ ERS — Electronics & Robotic Systems', value: 'Circuit design, embedded firmware, sensors, actuators, mechanical integration. `#ers`', inline: false },
        { name: '💻 CIS — Computing & Intelligent Sciences', value: 'Algorithms, computer vision, ROS, web and tooling, data pipelines. `#cis`', inline: false },
        { name: '📣 EWO — Events, Workshops & Outreach', value: 'Workshops, competitions, demos, community outreach, content. `#ewo`', inline: false },
        { name: '🛠️ OAD — Ops & Administration', value: 'Logistics, finance, sponsorship, documentation, recruitment, compliance. `#oad`', inline: false },
        { name: '🧭 Mentorship', value: 'Mentorship is assigned through the 🎓 **Mentor** role. Members holding it are active in the community and can help — ask in your division channel or reach out through a mentor.', inline: false },
        { name: '🌍 Where we are', value: 'Bhatkal, Karnataka, India · IST (UTC+5:30)', inline: true },
        { name: '🏆 Where we\'ve been', value: 'NRL 2025 — National Robotics Finals', inline: true },
      ],
      footer: { text: 'VoltEdge Innovation Community · Team 007' },
    },
  },

  'member-verification': {
    topic: 'Your application is with a moderator.',
    embed: {
      color: 0xf39c12,
      title: '⏳ Waiting for verification',
      description:
        'Thanks for applying. A moderator is reviewing your application now.\n\n' +
        '**While you wait:**\n' +
        '· Read [`#rules`](https://discord.com/channels/PLACEHOLDER/rules)\n' +
        '· Look around [`#welcome`](https://discord.com/channels/PLACEHOLDER/welcome)\n' +
        '· Make sure your Discord username on the application matches this account\n\n' +
        'You\'ll get a DM the moment you\'re approved.',
      footer: { text: 'Approvals usually happen within a day.' },
    },
  },

  'introductions': {
    topic: 'New members introduce themselves here.',
    embed: {
      color: 0x9b59b6,
      title: '👋 Introduce yourself',
      description: 'You\'re verified — you\'re one of us. Say hi.',
      fields: [
        { name: 'The template', value: '```\n👤 Name:\n🧭 Division:\n🔧 What I\'m working on:\n🎯 What I want to learn:\n```', inline: false },
        { name: 'Good intros mention', value: 'Something you\'re actually building, or a problem you\'re stuck on. "I like robots" doesn\'t help anyone.', inline: false },
      ],
      footer: { text: 'Mentors read this channel. Be genuine.' },
    },
  },

  'faq': {
    topic: 'Questions we get a lot. Check here first.',
    embed: {
      color: 0x3498db,
      title: '❓ Frequently Asked Questions',
      fields: [
        { name: 'Do I need to be a student?', value: 'No. VIC is open to anyone who wants to build — students, professionals, hobbyists. Apply through the site and a moderator will review it.', inline: false },
        { name: 'How long does approval take?', value: 'Usually within a day. If you\'ve waited longer, check your Discord username on your application matches your account exactly.', inline: false },
        { name: 'Can I change my division?', value: 'Yes. Ask a mentor in `#staff-chat` — it happens when someone discovers they hate soldering and love Python.', inline: false },
        { name: 'What is a VIC ID?', value: 'Your permanent member code, format `APP-2026-XXXXXX`. It\'s issued on approval and is how we identify you across applications and events.', inline: false },
        { name: 'Why can\'t I see the division channels?', value: 'Because you\'re not verified yet, or you haven\'t joined the server. Check `#member-verification`.', inline: false },
        { name: 'How do I get a role?', value: 'You get your division role automatically on approval. Skill and notification roles are self-service — look for the role picker, or ask a moderator.', inline: false },
        { name: 'What are these colour-coded roles?', value: 'Notifications (what you want pinged about), skills (what you work with), and pronouns. Self-selected, no stakes.', inline: false },
      ],
      footer: { text: 'Still stuck? Ask in #help-desk.' },
    },
  },

  // ---------------- Divisions ----------------
  'ers': {
    topic: 'Electronics & Robotic Systems — circuits, firmware, hardware.',
    embed: {
      color: DIM.ERS,
      title: '⚙️ ERS — Electronics & Robotic Systems',
      description: 'We make things that physically exist.',
      fields: [
        { name: 'What lives here', value: 'Circuit design · embedded firmware (C/C++) · sensors & actuators · motor control · PCB layout · mechanical integration · bench testing', inline: false },
        { name: 'Getting help', value: 'Circuit math, component choice, firmware bugs → post in [`#hardware-help`](https://discord.com/channels/PLACEHOLDER/hardware-help). One thread per problem.', inline: false },
        { name: 'Good questions include', value: 'The part number, what you\'ve already tried, and a photo of the board or a scope trace. "It doesn\'t work" gets "try a resistor" back.', inline: false },
      ],
      footer: { text: 'ERS · VoltEdge Innovation Community' },
    },
  },

  'cis': {
    topic: 'Computing & Intelligent Sciences — code, algorithms, vision.',
    embed: {
      color: DIM.CIS,
      title: '💻 CIS — Computing & Intelligent Sciences',
      description: 'We make things that think.',
      fields: [
        { name: 'What lives here', value: 'Algorithms · computer vision · ROS · embedded Linux · web & tooling · data pipelines · model deployment · simulation', inline: false },
        { name: 'Getting help', value: 'Code bugs, stack traces, algorithmic questions → post in [`#code-help`](https://discord.com/channels/PLACEHOLDER/code-help).', inline: false },
        { name: 'Good questions include', value: 'The code (in a code block), the full error, what you expected, and your environment — OS, language version, library versions. Pasted as text, not a screenshot.', inline: false },
      ],
      footer: { text: 'CIS · VoltEdge Innovation Community' },
    },
  },

  'ewo': {
    topic: 'Events, Workshops & Outreach — put the work in front of people.',
    embed: {
      color: DIM.EWO,
      title: '📣 EWO — Events, Workshops & Outreach',
      description: 'We make people understand what we build.',
      fields: [
        { name: 'What lives here', value: 'Workshop planning · competition logistics · demos · campus outreach · content & documentation · social media', inline: false },
        { name: 'Current focus', value: 'Turning NRL 2025 into a repeatable program — workshops that actually teach, and outreach that actually reaches students.', inline: false },
        { name: 'Get involved', value: 'There is always more outreach than capacity. If you can teach, photograph, edit, plan, or write, this is your division.', inline: false },
      ],
      footer: { text: 'EWO · VoltEdge Innovation Community' },
    },
  },

  'oad': {
    topic: 'Ops & Administration — the division that makes the rest possible.',
    embed: {
      color: DIM.OAD,
      title: '🛠️ OAD — Ops & Administration',
      description: 'We make sure the work can keep happening.',
      fields: [
        { name: 'What lives here', value: 'Logistics & procurement · finance & sponsorship · documentation · recruitment · compliance · event operations · asset tracking', inline: false },
        { name: 'Why it matters', value: 'Every robot that ever got built needed someone ordering the parts, tracking the budget, and writing down what worked. That someone is OAD.', inline: false },
        { name: 'Get involved', value: 'Good fit if you\'re organised, or if you want to learn how a student team actually runs — which most engineering curricula skip entirely.', inline: false },
      ],
      footer: { text: 'OAD · VoltEdge Innovation Community' },
    },
  },

  // ---------------- Build ----------------
  'project-rooms': {
    topic: 'One room per active project.',
    embed: {
      color: 0xe67e22,
      title: '🛠️ Project rooms',
      description: 'One channel per active project. Keep them focused — a channel is a project, not a dumping ground.',
      fields: [
        { name: 'Claiming a room', value: 'Ask a mentor in `#staff-chat`, or create the channel yourself if you hold the Mentor or Admin role. Name it after the project, not after yourself.', inline: false },
        { name: 'What belongs in a project room', value: 'Design decisions, build logs, blockers, test results, decisions made and why.', inline: false },
        { name: 'What does not', value: 'General chatter. That belongs in `#general` or your division channel.', inline: false },
      ],
      footer: { text: 'Unsure where something goes? Ask in #help-desk.' },
    },
  },

  'code-review': {
    topic: 'Share work, get feedback.',
    embed: {
      color: 0x2980b9,
      title: '💻 Code review',
      description: 'Get your code looked at by people who write code.',
      fields: [
        { name: 'How to ask well', value: '**What it does** (2 lines) · **What you want reviewed** · **Language & versions** · **The code** in a code block · **What you already tried**', inline: false },
        { name: 'Expect this', value: 'Honest feedback within a day or so, not instant. If nothing comes back in 3 days, nudge a mentor — it happens, people forget.', inline: false },
        { name: 'Also fine', value: 'Posting a small thing you just figured out. "How do I reverse a list in place" is a real question and deserves a real answer.', inline: false },
      ],
      footer: { text: 'Review others\' code too. It is the fastest way to learn.' },
    },
  },

  'hardware-lab': {
    topic: 'Robotics, electronics, bench work.',
    embed: {
      color: DIM.ERS,
      title: '⚡ Hardware lab',
      description: 'The channel for things that get hot, spark, or break.',
      fields: [
        { name: 'Lab safety — non-negotiable', value: '· Power off before rewiring. Every time.\n· Keep the bench tidy; label your parts.\n· No mains voltage without a mentor present.\n· Report damaged equipment immediately, do not hide it.\n· Eye protection near power tools.', inline: false },
        { name: 'Before you desolder', value: 'Post a photo and your plan in [`#hardware-help`](https://discord.com/channels/PLACEHOLDER/hardware-help). A second pair of eyes saves destroyed boards.', inline: false },
        { name: 'Post your results', value: 'Fixed it? Post what worked in `#build-logs` or `#project-rooms`. Next person will hit the same wall.', inline: false },
      ],
      footer: { text: 'A short workshop is better than a long argument.' },
    },
  },

  // ---------------- Community ----------------
  'general': {
    topic: 'Anything and everything.',
    embed: {
      color: 0x95a5a6,
      title: '💬 #general',
      description: 'The open channel. Questions, thoughts, what you\'re working on, what\'s annoyed you this week.',
      fields: [
        { name: 'A rule of thumb', value: 'If it\'s about a specific division, post in that division\'s channel. If it\'s about everyone, post here.', inline: false },
        { name: 'What makes a good channel', value: 'Someone joins, reads the last few messages, and learns something. Keep yours that useful.', inline: false },
      ],
      footer: { text: 'VoltEdge Innovation Community' },
    },
  },

  'announcements': {
    topic: 'Official announcements. Read-only for members.',
    embed: {
      color: 0xe74c3c,
      title: '📣 Announcements',
      description: 'Official VIC announcements. **Read-only** for members — only staff and mentors can post here.',
      fields: [
        { name: 'Stay in the loop', value: 'Grab the **📣 Announcements** role so you get pinged for things that actually matter.', inline: false },
        { name: 'What goes here', value: 'Events, deadlines, competition results, division changes, and anything members must act on.', inline: false },
      ],
      footer: { text: 'Pinned posts stay pinned. Scroll back for context.' },
    },
  },

  'resources': {
    topic: 'Shared links, docs, references.',
    embed: {
      color: 0x16a085,
      title: '📚 Resources',
      description: 'The things worth keeping: tutorials, datasheets, references, templates, past project write-ups.',
      fields: [
        { name: 'How to share', value: 'Post the link with **one line of what it is and why it\'s useful**. A bare link gets no clicks.', inline: false },
        { name: 'If you used it to build something', value: 'Say which project. Context is what makes a resource findable six months later.', inline: false },
      ],
      footer: { text: 'If it helped you, it will help someone else. Add it here.' },
    },
  },

  'events': {
    topic: 'Workshops, meetups, competition updates.',
    embed: {
      color: DIM.EWO,
      title: '📅 Events',
      description: 'Workshops, meetups, demos, and competition milestones.',
      fields: [
        { name: 'Get notified', value: 'Take the **🎓 Workshops** and **🏆 Competitions** roles so you actually see what\'s on.', inline: false },
        { name: 'Running something?', value: 'Post it here with: what, when, where, who it\'s for, and whether beginners can join.', inline: false },
      ],
      footer: { text: 'Past events and write-ups stay linked below.' },
    },
  },

  'opportunities': {
    topic: 'Internships, grants, competitions, fellowships.',
    embed: {
      color: 0x2ecc71,
      title: '💼 Opportunities',
      description: 'Internships, fellowships, grants, competitions, and calls that are worth the time.',
      fields: [
        { name: 'Posting something?', value: 'Include the deadline, the eligibility, and the link. Deadlines buried in a paragraph get missed.', inline: false },
        { name: 'Take the role', value: 'Grab **💼 Opportunities** so these reach you first.', inline: false },
      ],
      footer: { text: 'Most robotics funding deadlines are earlier than you think.' },
    },
  },

  'memes': {
    topic: 'Low-stakes fun.',
    embed: {
      color: 0xf1c40f,
      title: '🗿 #memes',
      description: 'Low-stakes territory. Robot memes, failed builds, wiring disasters, and the occasional joke.',
      fields: [
        { name: 'One rule', value: 'No memes at someone else\'s expense, and nothing that crosses into the `#rules` list. Punch up, not down.', inline: false },
      ],
      footer: { text: 'VoltEdge Innovation Community' },
    },
  },

  'off-topic': {
    topic: 'Everything else.',
    embed: {
      color: 0x7f8c8d,
      title: '🫠 #off-topic',
      description: 'Everything that isn\'t about robots, code, or events. Music, movies, campus life, food in Bhatkal, general chatter.',
      fields: [{ name: '', value: 'Keep it kind. Same rules, looser topic.', inline: false }],
      footer: { text: 'VoltEdge Innovation Community' },
    },
  },

  'meeting-plans': {
    topic: 'Scheduling the group up.',
    embed: {
      color: 0x3498db,
      title: '📅 Meeting plans',
      description: 'Coordinate when the team meets — lab sessions, build nights, competition prep.',
      fields: [
        { name: 'How to use it', value: 'Post a proposed time, get a 👍 from people who can make it, then confirm. "Can we all meet?" gets no replies; "Lab session Thursday 4pm, reply by Tuesday" gets results.', inline: false },
      ],
      footer: { text: 'IST · UTC+5:30' },
    },
  },

  'welcome-and-rules': {
    topic: 'Server entry point and rules.',
    embed: {
      color: VIC,
      title: '⚡ VoltEdge Innovation Community',
      description:
        '**VIC** is the innovation community of **Team 007** — the robotics team from ' +
        'Bhatkal, Karnataka that competed at the **NRL 2025 National Robotics Finals**.\n\n' +
        'This server is where the work continues between competitions.',
      fields: [
        { name: 'Start here', value: '1. Read the [rules](https://discord.com/channels/PLACEHOLDER/rules)\n2. Check [`#how-to-join`](https://discord.com/channels/PLACEHOLDER/how-to-join)\n3. Apply at **vic-official.pages.dev**\n4. Wait for a moderator to approve you', inline: false },
        { name: 'Our divisions', value: '⚙️ ERS · 💻 CIS · 📣 EWO · 🛠️ OAD', inline: true },
        { name: 'Mentorship', value: 'Assigned via the 🎓 Mentor role', inline: true },
      ],
      footer: { text: 'Bhatkal, Karnataka, India · IST' },
    },
  },

  // ---------------- Build logs / showcase ----------------
  'build-logs': {
    topic: 'Share progress on what you are working on.',
    embed: {
      color: 0xe67e22,
      title: '🔨 Build logs',
      description: 'Progress updates. What you tried, what worked, what broke.',
      fields: [
        { name: 'The format that works', value: '```\n🎯 Goal:\n🔧 What I did:\n✅ Result:\n❌ What broke:\n💡 Next:\n```', inline: false },
        { name: 'Why bother', value: 'The failures are the valuable part. Someone else will hit the same wall in six months — your write-up saves them a day.', inline: false },
      ],
      footer: { text: 'Wins and losses both. Especially losses.' },
    },
  },

  'media': {
    topic: 'Photos, clips, screenshots.',
    embed: {
      color: 0x9b59b6,
      title: '📸 #media',
      description: 'Photos from the lab, clips of things moving, screenshots that explain something.',
      fields: [
        { name: 'One rule', value: 'Ask before posting a photo with someone clearly identifiable in it. Ask in the channel, wait for a yes.', inline: false },
        { name: 'No watermarks', value: 'Strip the timestamp or the ugly logo. Take the extra two seconds.', inline: false },
      ],
      footer: { text: 'VoltEdge Innovation Community' },
    },
  },

  'workshops': {
    topic: 'Workshop announcements and materials.',
    embed: {
      color: DIM.EWO,
      title: '🎓 Workshops',
      description: 'Everything we teach, and everything we want to teach.',
      fields: [
        { name: 'Running a workshop?', value: 'Post: title, date, who it\'s for, what to bring, and what people will be able to do afterwards. That last one is the only reason anyone comes.', inline: false },
        { name: 'Attending?', value: 'Take the 🎓 Workshops role so you get pinged. Beginner-friendly workshops are the point — say so if it is.', inline: false },
      ],
      footer: { text: 'VoltEdge Innovation Community' },
    },
  },

  'competition-war-room': {
    topic: 'Live competition prep. NRL, hackathons, and similar.',
    embed: {
      color: 0xe74c3c,
      title: '🔥 Competition war room',
      description: 'When a competition is on, this is where the coordination happens.',
      fields: [
        { name: 'Format', value: '**UPDATES** pinned for schedule changes · tasks as to-do items with an owner · problems get their own thread, not a wall of messages', inline: false },
        { name: 'During a live event', value: 'Keep this channel readable. Short messages, explicit asks. Assume everyone\'s busy.', inline: false },
      ],
      footer: { text: 'NRL 2025 · National Robotics Finals' },
    },
  },

  // ---------------- Staff ----------------
  'staff-chat': {
    topic: 'Moderator coordination.',
    embed: {
      color: 0xe74c3c,
      title: '🛡️ Staff channel',
      description: 'Moderator and mentor coordination. Not visible to members.',
      fields: [
        { name: 'Keep it useful', value: 'Decisions, escalations, and questions about a member\'s status. Everything a moderator would need context on six months from now.', inline: false },
      ],
      footer: { text: 'VoltEdge Innovation Community · Staff' },
    },
  },

  'mod-log': {
    topic: 'Audit trail. Do not delete from here.',
    embed: {
      color: 0x95a5a6,
      title: '📝 Moderation log',
      description: 'Automatic audit trail. Every join, leave, deleted message, role change, warning, timeout and application decision lands here.',
      fields: [
        { name: 'Do not clean this up', value: 'This is the record. Deleting from here removes the only trace of what happened.', inline: false },
      ],
      footer: { text: 'Written by VIC Bot · do not delete' },
    },
  },

  'applications-review': {
    topic: 'Pending applications. Click to approve or reject.',
    embed: {
      color: 0xf39c12,
      title: '📋 Application review',
      description: 'Each card is a pending applicant. Click **Approve** or **Reject**.',
      fields: [
        { name: 'Before you approve', value: '1. Check the Discord username matches a real member who has joined the server\n2. Check the division matches what they described\n3. If something\'s off, reject with a reason rather than approving and fixing later', inline: false },
        { name: 'What approve does', value: 'Grants `✅ Member` + the division role, strips `⏳ Applicant`, DMs them their name, VIC ID and division, and logs it to `#mod-log`.', inline: false },
        { name: 'Rate limit', value: '5 decisions per 5 minutes. Deliberate — review, don\'t batch-approve.', inline: false },
      ],
      footer: { text: 'VoltEdge Innovation Community · Staff only' },
    },
  },
};

// -----------------------------------------------------------------
// Forum channel starters (posted as a thread)
// -----------------------------------------------------------------
const FORUM_POSTS = {
  'help-desk': {
    title: '📌 Read me first — how to get a good answer',
    content:
      '**Before posting:** check `#faq` and search the channel. Half of all questions have an existing thread.\n\n' +
      '**A good post includes:** what you\'re trying to do, what you already tried, and what happened. ' +
      'Someone can only help with what they can see.\n\n' +
      '**When it\'s solved:** the person who asked marks the thread solved so others can find the answer too.',
  },
  'code-help': {
    title: '📌 How to post a code question',
    content:
      'Include:\n' +
      '```\n1. What the code should do\n2. What it does instead\n3. The full error message (pasted, not screenshotted)\n4. Language + version, library + version\n5. What you already tried\n```\n\n' +
      'Past code as text in a code block so others can copy it. A screenshot of text is not copyable.',
  },
  'hardware-help': {
    title: '📌 Before you desolder — how to ask for hardware help',
    content:
      '**Always include a photo** of the board or circuit, and the part numbers of anything suspect.\n\n' +
      '**Say what you measured**, not just what you assume: voltages, continuity, what the LED actually does.\n\n' +
      '**Power off before posting** if you\'re mid-surgery. Ask first, then touch.',
  },
  'project-showcase': {
    title: '📌 Show us what you built',
    content:
      'Post your project here. Tell us:\n' +
      '· **What it is** — one sentence\n' +
      '· **What problem it solves** — or what it does for fun\n' +
      '· **How you built it** — the interesting part\n' +
      '· **What you\'d do differently** — always the most useful section\n\n' +
      'Half-finished counts. Especially half-finished.',
  },
  'suggestions': {
    title: '📌 Suggestions for the community',
    content:
      'Post an idea for how VIC could be better. Vote on others\' ideas by reacting with 👍.\n\n' +
      'Keep suggestions actionable — "we should do more events" is a vibe, "run a soldering workshop every month" is a suggestion.',
  },
  'opportunities-forum': {
    title: '📌 Post an opportunity',
    content:
      'Include the **deadline** prominently, who\'s eligible, and the link.\n\n' +
      'Reasonable things to post: internships, fellowships, grants, competitions, hackathons, paid research roles.',
  },
  'looking-for-team': {
    title: '📌 Need teammates?',
    content:
      'For events, competitions, or projects. Include:\n' +
      '· What you\'re building and for which event\n' +
      '· What roles you need (firmware, CV, mechanical, outreach)\n' +
      '· Time commitment\n' +
      '· Deadline to join',
  },
};

// -----------------------------------------------------------------
// Runner
// -----------------------------------------------------------------
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function loadSeeds() {
  try { return JSON.parse(await readFile(SEED_FILE, 'utf8')); } catch { return {}; }
}

client.once('clientReady', async () => {
  const guild = client.guilds.cache.get(config.discord.guildId);
  const channels = await guild.channels.fetch();
  const seeds = FORCE ? {} : await loadSeeds();
  const guildUrl = `https://discord.com/channels/${config.discord.guildId}`;

  let posted = 0, skipped = 0;

  for (const [name, def] of Object.entries(CONTENT)) {
    const ch = channels.find((c) => c.name === name);
    if (!ch) { console.log(`   · #${name} missing, skipped`); continue; }

    if (!FORCE && seeds[`t:${name}`] && seeds[`e:${name}`]) { skipped++; continue; }

    // Topic
    if (def.topic) {
      await ch.edit({ topic: def.topic }).catch(() => {});
    }

    // Text channel embed
    if (ch.isTextBased() && ch.type !== ChannelType.GuildForum) {
      const embed = JSON.parse(JSON.stringify(def.embed).split('PLACEHOLDER').join(guildUrl + '/'));
      embed.footer = embed.footer ? { ...embed.footer, text: embed.footer.text } : undefined;
      const msg = await ch.send({ embeds: [embed] }).catch((e) => {
        console.log(`   ! #${name} → ${e.message}`); return null;
      });
      if (msg) {
        seeds[`t:${name}`] = true;
        seeds[`e:${name}`] = msg.id;
        posted++;
        console.log(`   ✓ #${name}`);
      }
    }
  }

  // Forum starters
  for (const [name, post] of Object.entries(FORUM_POSTS)) {
    const ch = channels.find((c) => c.name === name);
    if (!ch || ch.type !== ChannelType.GuildForum) continue;
    if (!FORCE && seeds[`f:${name}`]) { skipped++; continue; }

    // Post a thread, then lock it so it stays at the top as a guide.
    // discord.js returns a plain object here, not a Thread instance, so we
    // call the REST endpoint directly rather than using .lock().
    const thread = await ch.threads.create({
      name: post.title,
      message: {
        content: post.content,
        embeds: [{
          color: VIC,
          footer: { text: 'VoltEdge Innovation Community · Team 007' },
        }],
      },
    }).catch((e) => { console.log(`   ! #${name} thread → ${e.message}`); return null; });

    if (thread?.id) {
      // discord.js v14 has no threads.edit() on the forum channel object,
      // so hit the REST endpoint directly to lock the guide thread.
      await client.rest
        .patch(`/channels/${thread.id}`, { body: { locked: true, archived: false } })
        .catch((e) => console.log(`     (lock failed: ${e.message})`));
      seeds[`f:${name}`] = thread.id;
      posted++;
      console.log(`   ✓ #${name} (starter thread)`);
    }
  }

  await mkdir(join(process.cwd(), '.data'), { recursive: true });
  await writeFile(SEED_FILE, JSON.stringify(seeds, null, 2), 'utf8');

  console.log(`\n   ${posted} posted, ${skipped} already present\n`);
  process.exit(0);
});

client.login(config.discord.token).catch((e) => {
  console.error('❌ login failed:', e.message);
  process.exit(1);
});
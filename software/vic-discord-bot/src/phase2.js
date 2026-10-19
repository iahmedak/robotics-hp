/**
 * Phase 2 — the things Discord's own onboarding and community tooling
 * require, plus the channels a robotics/tech community actually needs.
 *
 * Findings from Discord's official docs that drive this script:
 *
 *  - Community Onboarding cannot be enabled unless there are at least
 *    7 Default Channels AND at least 5 of them are readable AND writable
 *    by @everyone. The VIC server had 4 readable and 0 writable, which
 *    is why Onboarding was blocked.
 *
 *  - Rules Screening requires Community Mode, and is the only membership
 *    screening Discord offers today.
 *
 *  - Forum channels give per-thread organisation, which plain text
 *    channels cannot, and they are free and native (no bot required).
 *
 * This script:
 *   1. Opens the 5 public channels enough for Onboarding eligibility
 *   2. Adds Forum channels (help desk, showcase, opportunities)
 *   3. Adds the channels a build-oriented community needs
 *   4. Adds a Stage channel for demos/AMAs
 *   5. Creates notification + skill/interest roles for the role picker
 *   6. Re-verifies and prints an Onboarding readiness report
 */

import 'dotenv/config';
import {
  Client, GatewayIntentBits, PermissionFlagsBits, ChannelType,
} from 'discord.js';
import { config } from './config.js';

const VIEW = PermissionFlagsBits.ViewChannel;
const SEND = PermissionFlagsBits.SendMessages;
const EMBED = PermissionFlagsBits.EmbedLinks;
const READ = PermissionFlagsBits.ReadMessageHistory;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

/**
 * PUBLIC = readable AND writable by @everyone.
 * These are deliberately low-risk channels where an unverified member
 * can talk without touching anything gated. Five of them is the minimum
 * Discord requires before Onboarding can be switched on.
 */
const PUBLIC_SEND = [
  'welcome', 'rules', 'how-to-join', 'welcome-and-rules', 'introductions',
  'announcements', 'resources', 'general', 'off-topic', 'meeting-plans',
];

/** Extra channels that make a build community usable. */
const NEW_CHANNELS = [
  { cat: 'Start Here', name: 'server-info', type: 'text',
    topic: 'About VIC — divisions, mentors, and how the community works.' },
  { cat: 'Start Here', name: 'faq', type: 'text',
    topic: 'Answers to the questions we get most. Check here before asking.' },
  { cat: 'Start Here', name: 'rules-screening-help', type: 'text',
    topic: 'Stuck at the rules screen? Say so here.' },

  { cat: 'Help', name: 'help-desk', type: 'forum',
    topic: 'One thread per question. Get unstuck.' },
  { cat: 'Help', name: 'code-help', type: 'forum',
    topic: 'One thread per bug or code question.' },
  { cat: 'Help', name: 'hardware-help', type: 'forum',
    topic: 'One thread per electronics or robotics problem.' },

  { cat: 'Showcase', name: 'project-showcase', type: 'forum',
    topic: 'What are you building? Post it here.' },
  { cat: 'Showcase', name: 'build-logs', type: 'text',
    topic: 'Share progress on what you are working on.' },
  { cat: 'Showcase', name: 'media', type: 'text',
    topic: 'Photos, clips and screenshots from our work.' },

  { cat: 'Community', name: 'suggestions', type: 'forum',
    topic: 'Ideas for the community. Vote on the ones you like.' },
  { cat: 'Community', name: 'opportunities-forum', type: 'forum',
    topic: 'Internships, grants, competitions and fellowships.' },
  { cat: 'Community', name: 'looking-for-team', type: 'forum',
    topic: 'Find teammates for an event, competition or project.' },

  { cat: 'Events', name: 'workshops', type: 'text',
    topic: 'Workshop announcements and materials.' },
  { cat: 'Events', name: 'competition-war-room', type: 'text',
    topic: 'Live competition prep. NRL, hackathons, and similar.' },
  { cat: 'Events', name: 'demo-stage', type: 'stage',
    topic: 'Live demos, AMAs and mentor sessions.' },
];

/** Roles the picker should hand out. */
const NOTIFICATION_ROLES = [
  { name: '📣 Announcements', color: 0xe74c3c, position: 20 },
  { name: '🎓 Workshops', color: 0x3498db, position: 20 },
  { name: '🏆 Competitions', color: 0xf1c40f, position: 20 },
  { name: '💼 Opportunities', color: 0x2ecc71, position: 20 },
  { name: '🔔 All Events', color: 0x9b59b6, position: 19 },
];

const SKILL_ROLES = [
  { name: '🧠 AI / ML', color: 0x8e44ad, position: 18 },
  { name: '🤖 Robotics / ROS', color: 0x16a085, position: 18 },
  { name: '⚡ Embedded C/C++', color: 0xe67e22, position: 18 },
  { name: '🐍 Python', color: 0x2980b9, position: 18 },
  { name: '🌐 Web Dev', color: 0x27ae60, position: 18 },
  { name: '📐 CAD / 3D', color: 0x7f8c8d, position: 18 },
  { name: '⚙️ Electronics', color: 0xd35400, position: 18 },
];

const PRONOUN_ROLES = [
  { name: '🧑‍💻 He/Him', color: 0x3498db, position: 17 },
  { name: '👩‍💻 She/Her', color: 0xe91e63, position: 17 },
  { name: '🧑‍🎨 They/Them', color: 0x9b59b6, position: 17 },
];

client.once('clientReady', async () => {
  const guild = client.guilds.cache.get(config.discord.guildId);
  const everyone = guild.roles.everyone;
  const roles = await guild.roles.fetch();
  const byName = Object.fromEntries(roles.map((r) => [r.name, r.id]));

  const STAFF = [byName[config.roles.admin], byName[config.roles.moderator], byName[config.roles.founder]].filter(Boolean);
  const MEMBERS = [byName[config.roles.member], byName[config.roles.mentor], ...STAFF].filter(Boolean);
  const APPLICANTS = [byName[config.roles.applicant], ...MEMBERS].filter(Boolean);
  const BOT = guild.members.me.roles.cache.map((r) => r.id);

  // ---- 1. Roles -------------------------------------------------------
  console.log('▸ Creating picker roles…');
  for (const def of [...NOTIFICATION_ROLES, ...SKILL_ROLES, ...PRONOUN_ROLES]) {
    if (byName[def.name]) continue;
    await guild.roles.create({ name: def.name, color: def.color }, 'VIC phase 2');
    console.log(`   + ${def.name}`);
  }
  const fresh = await guild.roles.fetch();
  const byId = Object.fromEntries(fresh.map((r) => [r.name, r.id]));
  const PICKER = [...NOTIFICATION_ROLES, ...SKILL_ROLES, ...PRONOUN_ROLES].map((r) => byId[r.name]).filter(Boolean);
  const MEMBER_PICKER = PICKER.filter((id) => id !== byId['📣 Announcements']);

  // ---- 2. Categories ---------------------------------------------------
  console.log('\n▸ Creating categories…');
  const cats = ['Help', 'Showcase', 'Events'];
  const catMap = {};
  for (const name of cats) {
    let c = guild.channels.cache.find((x) => x.name === name && x.type === ChannelType.GuildCategory);
    if (!c) c = await guild.channels.create({ name, type: ChannelType.GuildCategory }, 'VIC phase 2');
    catMap[name] = c.id;
    console.log(`   ▸ ${name}`);
  }

  // ---- 3. Channels -----------------------------------------------------
  console.log('\n▸ Creating channels…');
  const TYPE = { text: ChannelType.GuildText, forum: ChannelType.GuildForum, stage: ChannelType.GuildStageVoice };
  for (const spec of NEW_CHANNELS) {
    if (guild.channels.cache.find((c) => c.name === spec.name)) continue;
    const parent = spec.cat === 'Community' || spec.cat === 'Start Here'
      ? guild.channels.cache.find((c) => c.name === spec.cat && c.type === ChannelType.GuildCategory)?.id
      : catMap[spec.cat];
    try {
      await guild.channels.create({
        name: spec.name, type: TYPE[spec.type], parent, topic: spec.topic, reason: 'VIC phase 2',
      }, 'VIC phase 2');
      console.log(`   + #${spec.name} (${spec.type})`);
    } catch (err) {
      // 50024 = stage channels need a higher server boost tier / Community mode.
      // That is a manual click, not something we can force. Do not abort the run.
      console.log(`   ! #${spec.name} could not be created (${err.code ?? err.message}) — create it manually`);
    }
  }
  await new Promise((r) => setTimeout(r, 1200));

  // ---- 4. Permissions --------------------------------------------------
  console.log('\n▸ Applying permissions…');
  const live = await guild.channels.fetch();

  // 4a. Public + sendable: this is what makes Onboarding eligible.
  for (const name of PUBLIC_SEND) {
    const ch = live.find((c) => c.name === name);
    if (!ch) continue;
    await ch.permissionOverwrites.edit(everyone,
      { ViewChannel: true, SendMessages: true, ReadMessageHistory: true }, 'VIC phase 2');
    // Staff can always delete/manage announcements & rules.
    for (const rid of STAFF) {
      await ch.permissionOverwrites.edit(rid,
        { ViewChannel: true, SendMessages: true, ManageMessages: true, EmbedLinks: true, ReadMessageHistory: true },
        'VIC phase 2').catch(() => {});
    }
  }
  console.log('   ✓ public channels opened for @everyone (Onboarding eligibility)');

  // 4b. New member-facing channels.
  const MEMBER_CH = NEW_CHANNELS.filter((s) => s.type !== 'stage').map((s) => s.name);
  for (const name of MEMBER_CH) {
    const ch = live.find((c) => c.name === name);
    if (!ch) continue;
    await ch.permissionOverwrites.edit(everyone,
      { ViewChannel: false, SendMessages: false, ReadMessageHistory: false }, 'VIC phase 2');
    for (const rid of [...MEMBERS, ...BOT]) {
      await ch.permissionOverwrites.edit(rid,
        { ViewChannel: true, SendMessages: true, EmbedLinks: true, ReadMessageHistory: true },
        'VIC phase 2').catch(() => {});
    }
  }
  console.log('   ✓ member channels gated to ✅ Member + staff');

  // 4c. Stage channel: members can connect, but only staff speak.
  const stage = live.find((c) => c.name === 'demo-stage');
  if (stage) {
    await stage.permissionOverwrites.edit(everyone, { ViewChannel: false }, 'VIC phase 2');
    for (const rid of MEMBERS) {
      await stage.permissionOverwrites.edit(rid,
        { ViewChannel: true, Connect: true, Speak: false, ReadMessageHistory: true }, 'VIC phase 2').catch(() => {});
    }
    for (const rid of [...STAFF, ...BOT]) {
      await stage.permissionOverwrites.edit(rid,
        { ViewChannel: true, Connect: true, Speak: true, ReadMessageHistory: true }, 'VIC phase 2').catch(() => {});
    }
    console.log('   ✓ #demo-stage: members attend, staff speak');
  }

  // 4d. Forum channels need explicit CreatePost permission for the roles
  //     that should be able to open a thread.
  for (const name of ['help-desk', 'code-help', 'hardware-help', 'project-showcase',
                      'suggestions', 'opportunities-forum', 'looking-for-team']) {
    const ch = live.find((c) => c.name === name);
    if (!ch) continue;
    for (const rid of [...MEMBERS, ...BOT]) {
      await ch.permissionOverwrites.edit(rid, {
        ViewChannel: true, SendMessages: true, CreatePublicThreads: true,
        EmbedLinks: true, ReadMessageHistory: true,
      }, 'VIC phase 2').catch(() => {});
    }
  }
  console.log('   ✓ forum channels can create threads');

  // ---- 5. Report -------------------------------------------------------
  await new Promise((r) => setTimeout(r, 1500));
  const final = await client.rest.get(`/guilds/${config.discord.guildId}/channels`);
  const gid = config.discord.guildId;
  const V = 1n << 10n, S = 1n << 11n;

  let readable = 0, sendable = 0;
  const sendableNames = [];
  for (const c of final.filter((x) => x.type === 0)) {
    const ev = (c.permission_overwrites || []).find((p) => p.id === gid);
    const a = BigInt(ev?.allow ?? '0'), d = BigInt(ev?.deny ?? '0');
    if ((a & V) && !(d & V)) {
      readable++;
      if ((a & S) && !(d & S)) { sendable++; sendableNames.push(c.name); }
    }
  }

  console.log('\n════ ONBOARDING READINESS ════');
  console.log(`  Default channels needed : 7`);
  console.log(`  Readable by @everyone   : ${readable}`);
  console.log(`  Sendable by @everyone   : ${sendable}  (need >= 5)`);
  console.log(`  Sendable channels       : ${sendableNames.join(', ')}`);
  const ready = readable >= 7 && sendable >= 5;
  console.log(ready
    ? '\n  ✅ READY — you can now enable Server Settings → Onboarding.\n'
    : '\n  ⚠️  Still short.\n');
  console.log(`  Total channels now: ${final.filter((c) => c.type === 0).length} text, ${final.filter((c) => c.type === 15).length} forum, ${final.filter((c) => c.type === 13).length} stage`);
  console.log(`  Picker roles created  : ${PICKER.length}`);
  console.log('════\n');

  process.exit(0);
});

client.login(config.discord.token).catch((e) => {
  console.error('❌ login failed:', e.message);
  process.exit(1);
});
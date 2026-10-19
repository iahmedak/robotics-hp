import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  ChannelType,
} from 'discord.js';
import { config, describeConfig } from './config.js';
import { ROLE_DEFS, divisionRoleDefs, P } from './roles.js';

/**
 * One-shot server provisioning.
 *
 *   npm run provision
 *
 * Creates roles, categories and channels, then applies the permission
 * matrix and writes every generated ID to .env.runtime so the bot and
 * you never have to copy IDs by hand.
 *
 * Safe to re-run: it reuses anything that already exists by name.
 */

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const P_ = (bits) => [
  {
    id: client.users.cache.get(client.user.id)?.id ?? client.user.id,
    allow: BigInt(bits),
  },
];

/** channel type -> who can view it */
const VIEW_OPEN = 'open';
const VIEW_MEMBER = 'member';
const VIEW_APPLICANT = 'applicant';
const VIEW_STAFF = 'staff';
const VIEW_BOT = 'bot';

const VIEW_RULES = {
  // Everyone, including unauthenticated visitors who can see the server.
  [VIEW_OPEN]: '@everyone',
  // Applicant role can also read (they need rules before approval).
  [VIEW_APPLICANT]: [config.roles.applicant, config.roles.member, config.roles.mentor,
                     config.roles.moderator, config.roles.admin, config.roles.founder],
  [VIEW_MEMBER]: [config.roles.member, config.roles.mentor, config.roles.moderator,
                  config.roles.admin, config.roles.founder],
  [VIEW_STAFF]: [config.roles.moderator, config.roles.admin, config.roles.founder],
  [VIEW_BOT]: [config.roles.bot],
};

const channelSpec = [
  // ── Onboarding / public ─────────────────────────────
  { cat: 'Start Here', name: 'welcome', view: VIEW_OPEN, topic: 'Welcome to VoltEdge Innovation Community.' },
  { cat: 'Start Here', name: 'rules', view: VIEW_OPEN, topic: 'Community rules. Read before posting.' },
  { cat: 'Start Here', name: 'how-to-join', view: VIEW_OPEN, topic: 'Apply at vic-official.pages.dev and get verified here.' },
  { cat: 'Start Here', name: 'member-verification', view: VIEW_APPLICANT, topic: 'Your application is being reviewed by a moderator.' },
  { cat: 'Start Here', name: 'introductions', view: VIEW_MEMBER, topic: 'Say hello. Name, division, what you are building.' },

  // ── Divisions ───────────────────────────────────────
  { cat: 'Divisions', name: 'ers', view: VIEW_MEMBER, topic: 'Electronics & Robotic Systems.' },
  { cat: 'Divisions', name: 'cis', view: VIEW_MEMBER, topic: 'Computing & Intelligent Sciences.' },
  { cat: 'Divisions', name: 'ewo', view: VIEW_MEMBER, topic: 'Events, Workshops & Outreach.' },
  { cat: 'Divisions', name: 'oad', view: VIEW_MEMBER, topic: 'Ops & Administration.' },

  // ── Projects & collaboration ────────────────────────
  { cat: 'Build', name: 'project-rooms', view: VIEW_MEMBER, topic: 'One room per active project.' },
  { cat: 'Build', name: 'code-review', view: VIEW_MEMBER, topic: 'Share work, get feedback.' },
  { cat: 'Build', name: 'hardware-lab', view: VIEW_MEMBER, topic: 'Robotics, electronics, bench work.' },

  // ── Community ───────────────────────────────────────
  { cat: 'Community', name: 'general', view: VIEW_MEMBER, topic: 'Anything and everything.' },
  { cat: 'Community', name: 'events', view: VIEW_MEMBER, topic: 'Workshops, meetups, NRL updates.' },
  { cat: 'Community', name: 'opportunities', view: VIEW_MEMBER, topic: 'Internships, grants, competitions.' },
  { cat: 'Community', name: 'memes', view: VIEW_MEMBER, topic: 'Low-stakes fun.' },

  // ── Staff ───────────────────────────────────────────
  { cat: 'Staff', name: 'applications-review', view: VIEW_STAFF, topic: 'Pending applications. Moderators click to approve or reject.', staffRead: true },
  { cat: 'Staff', name: 'mod-log', view: VIEW_STAFF, topic: 'Audit trail of every moderation action.' },
  { cat: 'Staff', name: 'staff-chat', view: VIEW_STAFF, topic: 'Moderator coordination.' },
];

client.once('ready', async () => {
  try {
    console.log(`✅ Provisioning as ${client.user.tag}\n`);
    console.log(describeConfig());

    const guild = client.guilds.cache.get(config.discord.guildId);
    if (!guild) throw new Error(`Bot is not in guild ${config.discord.guildId}`);

    // 1. Roles
    console.log('\n▸ Creating roles…');
    const roleMap = await ensureRoles(guild);

    // 2. Put the bot above everything it must grant.
    // Discord role positions count UPWARD: 0 is @everyone at the bottom,
    // higher numbers sit above. A bot cannot grant a role that sits at or
    // above its own highest role. The managed integration role (vic-t1)
    // Discord creates on invite is already the top role; we only need our
    // own VIC Bot role above Member/Applicant, which is where we put it.
    const botRoleId = roleMap[config.roles.bot];
    const memberRoleId = roleMap[config.roles.member];
    if (botRoleId && memberRoleId) {
      const memberRole = await guild.roles.fetch(memberRoleId);
      const targetPosition = (memberRole?.position ?? 1) + 1;
      await guild.roles.edit(botRoleId, { position: targetPosition }, 'VIC provisioning');
      console.log(`   ↳ ${config.roles.bot} → position ${targetPosition}`);
    }

    // 3. Categories + channels
    console.log('\n▸ Creating categories and channels…');
    const idMap = await ensureChannels(guild, roleMap);

    // 4. Write runtime env
    console.log('\n▸ Writing .env.runtime …');
    await writeRuntimeEnv(idMap, roleMap);

    console.log('\n🎉 Provisioning complete.');
    console.log('   Next: copy .env.runtime values into .env, then run `npm start`.');
  } catch (err) {
    console.error('\n❌ Provisioning failed:', err.message);
  } finally {
    process.exit(0);
  }
});

client.login(config.discord.token);

async function ensureRoles(guild) {
  const existing = new Map(guild.roles.cache.map((r) => [r.name, r]));
  const roleMap = {};

  for (const def of ROLE_DEFS) {
    const found = existing.get(def.name);
    if (found) {
      roleMap[def.name] = found.id;
      continue;
    }
    const created = await guild.roles.create({
      name: def.name,
      color: def.color,
      hoist: def.hoist,
      reason: 'VIC provisioning',
    });
    roleMap[def.name] = created.id;
    console.log(`   + ${def.name}`);
  }

  for (const def of divisionRoleDefs()) {
    const found = existing.get(def.name);
    if (found) {
      roleMap[def.name] = found.id;
      continue;
    }
    const created = await guild.roles.create({
      name: def.name,
      color: def.color,
      reason: 'VIC provisioning',
    });
    roleMap[def.name] = created.id;
    console.log(`   + ${def.name}`);
  }

  return roleMap;
}

async function ensureChannels(guild, roleMap) {
  const catMap = {};
  const cats = new Set(channelSpec.map((c) => c.cat));
  for (const catName of cats) {
    const found = guild.channels.cache.find((c) => c.name === catName && c.type === ChannelType.GuildCategory);
    if (found) { catMap[catName] = found.id; continue; }
    const created = await guild.channels.create({ name: catName, type: ChannelType.GuildCategory, reason: 'VIC provisioning' });
    catMap[catName] = created.id;
    console.log(`   ▸ [category] ${catName}`);
  }

  const idMap = {};
  for (const spec of channelSpec) {
    let ch = guild.channels.cache.find((c) => c.name === spec.name);
    if (!ch) {
      ch = await guild.channels.create({
        name: spec.name,
        type: ChannelType.GuildText,
        parent: catMap[spec.cat],
        topic: spec.topic,
        reason: 'VIC provisioning',
      });
      console.log(`   + #${spec.name}`);
    }
    idMap[spec.name] = ch.id;

    // Apply overwrites for each allowed role.
    const allowed = VIEW_RULES[spec.view] ?? VIEW_RULES[VIEW_OPEN];
    const roleIds = (Array.isArray(allowed) ? allowed : [allowed])
      .map((n) => (n === '@everyone' ? null : roleMap[n]))
      .filter(Boolean);

    // CRITICAL: Discord's @everyone role carries a base allow that includes
    // ViewChannel and SendMessages. Adding allow-overwrites for other roles
    // does NOT hide the channel — unless @everyone is explicitly DENIED
    // ViewChannel, the channel stays visible to every guild member.
    // So we always set the @everyone overwrite first: allow on public
    // channels, explicit deny on everything gated.
    if (spec.view === VIEW_OPEN) {
      await ch.permissionOverwrites.edit(
        guild.roles.everyone,
        { ViewChannel: true, ReadMessageHistory: true },
        'VIC provisioning'
      );
    } else {
      await ch.permissionOverwrites.edit(
        guild.roles.everyone,
        { ViewChannel: false, SendMessages: false, ReadMessageHistory: false },
        'VIC provisioning'
      );
    }

    // Then allow the specific roles.
    for (const rid of roleIds) {
      await ch.permissionOverwrites.edit(rid, {
        ViewChannel: true, SendMessages: true, EmbedLinks: true, ReadMessageHistory: true,
      }, 'VIC provisioning').catch(() => {});
    }
  }

  return idMap;
}

async function writeRuntimeEnv(idMap, roleMap) {
  const lines = [
    '# AUTO-GENERATED by npm run provision — do not edit by hand.',
    `# Generated ${new Date().toISOString()}`,
    '',
    '# Guild',
    `DISCORD_GUILD_ID=${config.discord.guildId}`,
    '',
    '# Channels',
    ...Object.entries(idMap).map(([name, id]) => `# ${name}\nCHANNEL_${name.toUpperCase().replace(/-/g, '_')}=${id}`),
    '',
    '# Roles (names for reference)',
    ...Object.entries(roleMap).map(([name, id]) => `ROLE_ID::${name}=${id}`),
  ];
  const fs = await import('node:fs/promises');
  await fs.writeFile('.env.runtime', lines.join('\n'), 'utf8');
}

client.on('error', (e) => console.error('client error:', e.message));
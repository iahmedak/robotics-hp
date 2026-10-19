import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  EmbedBuilder,
  SlashCommandBuilder,
  REST,
  Routes,
} from 'discord.js';
import { config, describeConfig, hasSupabase } from './config.js';
import { setModLogChannel, isRateLimited, recordAction, audit } from './logger.js';
import {
  buildApprovedDM, buildRejectedDM, buildReviewCard, buildAuditEntry,
} from './card.js';
import { Moderation } from './moderation.js';
import { attachWelcomer } from './welcomer.js';
import {
  ActivityTracker, computeMemberStats,
  buildRankEmbed, buildMemberCountEmbed,
} from './activity.js';
import {
  ApplicationStore, buildTicketCard, OPEN,
} from './applications.js';
import { showApplyModal, validateApplyFields, canApply } from './apply.js';
import {
  parseDuration, formatDuration, canGrantRole,
  TempRoleStore, sweepTempRoles, MAX_TEMP_MS,
} from './roleadmin.js';
import {
  fetchPendingApplications, getApplicationById,
  markApproved, markRejected, getDivisionName,
} from './supabase.js';

// ---------------------------------------------------------
// Client — needs member + content intents for moderation to work
// ---------------------------------------------------------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,   // join/leave audit + role grants
    GatewayIntentBits.GuildMessages,  // deleted/edited message audit
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent, // PRIVILEGED — must be on in the portal
  ],
});

const MOD_LOG = 'mod-log';
// Resolved from the layout, not hardcoded: the old literal
// 'applications-review' was renamed to 'membership-approvals' by the
// restructure, and a lookup that misses silently breaks /approve.
const REVIEW = 'membership-approvals';
const OPERATIONS_CATEGORY = '06 ⚙️ OPERATIONS & ADMINISTRATION';

/** Resolve by name or explain loudly. A silent miss hides a broken flow. */
function needChannel(guild, name, type, why) {
  const c = guild.channels.cache.find((x) => x.name === name && (!type || x.type === type));
  if (!c) {
    console.error(`   ✗ ${why}: channel "#${name}" not found — check it exists and the bot can see it`);
  }
  return c ?? null;
}

let mod = null;
let activity = null;
let apps = null;
let tempRoles = null;
let reviewChannelId = null;
const surfaced = new Set();

// ---------------------------------------------------------
// Slash commands
// ---------------------------------------------------------
const COMMANDS = [
  new SlashCommandBuilder()
    .setName('warn').setDescription('Warn a member and record it.')
    .addUserOption((o) => o.setName('user').setDescription('Member to warn').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Why?').setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('warnings').setDescription('Show a member\'s warning history.')
    .addUserOption((o) => o.setName('user').setDescription('Member to check').setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('timeout').setDescription('Time a member out.')
    .addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true))
    .addStringOption((o) => o.setName('duration').setDescription('e.g. 10m, 2h, 7d').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Why?').setRequired(false))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('paniclock').setDescription('Lock or unlock posting across the server.')
    .addStringOption((o) => o.setName('mode').setDescription('on or off').setRequired(true)
      .addChoices({ name: 'on — read-only', value: 'on' }, { name: 'off — allow posting', value: 'off' }))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('approve').setDescription('Approve a pending applicant by VIC ID.')
    .addStringOption((o) => o.setName('vic_id').setDescription('e.g. APP-2026-000123').setRequired(true))
    .addStringOption((o) => o.setName('note').setDescription('Optional note').setRequired(false))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('giverole').setDescription('Give a member a role.')
    .addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true))
    .addRoleOption((o) => o.setName('role').setDescription('Role to grant').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Why?').setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('temprole').setDescription('Give a member a role that expires automatically.')
    .addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true))
    .addRoleOption((o) => o.setName('role').setDescription('Role to grant temporarily').setRequired(true))
    .addStringOption((o) => o.setName('duration').setDescription('e.g. 10m, 2h, 7d').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Why?').setRequired(false))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('revokerole').setDescription('Remove a role from a member early.')
    .addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true))
    .addRoleOption((o) => o.setName('role').setDescription('Role to remove').setRequired(true))
    .addStringOption((o) => o.setName('reason').setDescription('Why?').setRequired(false))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('close').setDescription('Archive this ticket and freeze it.')
    .addStringOption((o) => o.setName('reason').setDescription('Closing note (optional)').setRequired(false))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('resolvewarn').setDescription('Mark a warning as resolved.')
    .addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true))
    .addIntegerOption((o) => o.setName('warn_id').setDescription('Warning ID from /warnings').setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('userinfo').setDescription('Show a member\'s roles, warnings and status.')
    .addUserOption((o) => o.setName('user').setDescription('Member').setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('lookup').setDescription('Show an application by VIC ID.')
    .addStringOption((o) => o.setName('vic_id').setDescription('e.g. APP-2026-000123').setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('apply').setDescription('Apply to join VIC (opens a form).')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('membercount').setDescription('Show the VIC member census.')
    .toJSON(),

  new SlashCommandBuilder()
    .setName('activerank').setDescription('Rank the most active members by messages.')
    .addStringOption((o) => o.setName('window').setDescription('Time window').setRequired(false)
      .addChoices(
        { name: 'Last 7 days', value: '7' },
        { name: 'Last 30 days', value: '30' },
        { name: 'All time', value: 'all' },
      ))
    .toJSON(),
];

/** parseDuration lives in roleadmin.js and is imported there. */

// ---------------------------------------------------------
// Boot
// ---------------------------------------------------------
client.once('clientReady', async () => {
  console.log(`✅ VIC Bot online — ${client.user.tag}`);
  console.log('─'.repeat(52));
  console.log(describeConfig());
  console.log('─'.repeat(52));

  const guild = client.guilds.cache.get(config.discord.guildId);
  if (!guild) {
    console.error('❌ Bot is not in the configured guild.');
    process.exit(1);
  }

  // Resolve channels by name.
  const all = await guild.channels.fetch();
  reviewChannelId = all.find((c) => c.name === REVIEW)?.id ?? null;
  const modLogId = all.find((c) => c.name === MOD_LOG)?.id ?? null;
  setModLogChannel(modLogId);

  // Staff = anyone who can manage messages, or holds a staff role.
  const roles = await guild.roles.fetch();
  const byName = Object.fromEntries(roles.map((r) => [r.name, r.id]));
  const staffRoleIds = [
    byName[config.roles.admin], byName[config.roles.moderator], byName[config.roles.founder],
  ].filter(Boolean);

  // ---- moderation ----
  mod = new Moderation(client, {
    guildId: config.discord.guildId,
    logChannelId: modLogId,
    staffRoleIds,
    bannedWords: (process.env.BANNED_WORDS ?? '')
      .split(',').map((w) => w.trim()).filter(Boolean),
  });
  mod.attach();
  console.log(`🛡️  moderation attached   log=#${MOD_LOG}${modLogId ? '' : ' (MISSING!)'}`);

  // ---- welcomer ----
  attachWelcomer(client, {
    guildId: config.discord.guildId,
    applicantRoleId: byName[config.roles.applicant] ?? null,
    isLocked: () => mod.panicLocked,
  });
  console.log(`👋 welcomer attached      #welcome + join DM${byName[config.roles.applicant] ? ' + auto ⏳ Applicant' : ' (⚠️ applicant role not found)'}`);

  // ---- activity tracking ----
  // Backfill reads recent channel history (GETs only, staff channels
  // excluded), then messageCreate keeps counting live. Wrapped so a
  // failure here can never take down the boot.
  activity = new ActivityTracker();
  await activity.load();
  activity.attach(client, config.discord.guildId);
  try {
    const { messages, users } = await activity.backfill(guild, { perChannelLimit: 500 });
    console.log(`📊 activity backfilled    ${messages} messages from ${users} users`);
  } catch (err) {
    console.error('⚠️  activity backfill failed (live counting still on):', err.message);
  }

  // ---- applications (Discord-native intake) ----
  apps = new ApplicationStore();
  await apps.load();
  const st = apps.stats();
  console.log(`🎟️  application store     ${st.total} total · ${st.pending} pending · ${st.approved} approved`);

  // ---- temporary roles ----
  tempRoles = new TempRoleStore();
  await tempRoles.load();
  const swept = await sweepTempRoles({ client, guildId: config.discord.guildId, store: tempRoles });
  if (swept.length) {
    console.log(`⏱️  temp roles            revoked ${swept.length} that lapsed while offline`);
    for (const e of swept) await mod.log(`⏱️ Temporary role expired: **${e.roleName}** removed from <@${e.userId}>`, 0x95a5a6);
  } else {
    console.log(`⏱️  temp roles            ${tempRoles.entries.size} active`);
  }
  setInterval(async () => {
    const done = await sweepTempRoles({ client, guildId: config.discord.guildId, store: tempRoles });
    for (const e of done) {
      await mod.log(`⏱️ Temporary role expired: **${e.roleName}** removed from <@${e.userId}>`, 0x95a5a6);
    }
  }, 60_000).unref();
  console.log(`📋 review channel       ${reviewChannelId ? '#' + REVIEW : 'MISSING — cards will not post'}`);

  // ---- register commands ----
  try {
    const rest = new REST({ version: '10' }).setToken(config.discord.token);
    await rest.put(Routes.applicationGuildCommands(client.user.id, config.discord.guildId), { body: COMMANDS });
    console.log(`⌨️  registered ${COMMANDS.length} slash commands`);
  } catch (err) {
    console.error('⚠️  slash command registration failed:', err.message);
  }

  // Discord-native intake is the live path. The Supabase poll stays
  // optional for anyone who also runs the website form — but it is no
  // longer required, and nothing here needs the service_role key.
  if (hasSupabase) {
    setInterval(pollApplications, config.runtime.pollIntervalMs);
    await pollApplications();
  }
});

client.login(config.discord.token).catch((e) => {
  console.error('❌ Login failed:', e.message);
  process.exit(1);
});

// ---------------------------------------------------------
// Verification poll
// ---------------------------------------------------------
async function pollApplications() {
  if (!hasSupabase || !reviewChannelId) return;
  try {
    const pending = await fetchPendingApplications([...surfaced]);
    if (!pending.length) return;
    const channel = await client.channels.fetch(reviewChannelId);

    for (const app of pending) {
      const divisionName = await getDivisionName(app.division_id);
      await channel.send(buildReviewCard(app, divisionName));
      surfaced.add(app.id);
      console.log(`📨 review card → ${app.id} (${app.full_name})`);
    }
  } catch (err) {
    console.error('pollApplications:', err.message);
  }
}

// ---------------------------------------------------------
// Buttons: approve / reject
// ---------------------------------------------------------
client.on('interactionCreate', async (i) => {
  // "Start application" button in #apply-here → open the modal.
  if (i.isButton() && i.customId === 'vic:apply:start') {
    if (!canApply(i.member)) {
      return i.reply({ content: '❌ Staff and bots cannot apply.', ephemeral: true });
    }
    if (apps.openForUser(i.user.id)) {
      return i.reply({ content: '⏳ You already have an application under review.', ephemeral: true });
    }
    return showApplyModal(i, { divisions: divisionChoices() });
  }
  // Ticket-card approve/reject (the Discord-native intake path).
  if (i.isButton() && i.customId.startsWith('vic:t:')) {
    const [, , action, vicId] = i.customId.split(':');
    if (action === 'approve' || action === 'reject') {
      return handleTicketDecision(i, action, vicId);
    }
    return;
  }
  // Modal submit from /apply.
  if (i.isModalSubmit() && i.customId === 'vic:apply') {
    return handleApplySubmit(i);
  }
  // Website-form cards (Supabase path), kept for compatibility.
  if (i.isButton() && i.customId.startsWith('vic:')) {
    if (i.customId.startsWith('vic:lock:')) return; // handled by Moderation
    const [, action, applicationId] = i.customId.split(':');
    if (action !== 'approve' && action !== 'reject') return;
    return handleDecision(i, action, applicationId);
  }
  if (i.isChatInputCommand()) return handleCommand(i);
});

// ---------------------------------------------------------
// Discord-native application intake
// ---------------------------------------------------------
async function handleApplySubmit(interaction) {
  if (!canApply(interaction.member)) {
    return interaction.reply({ content: '❌ Staff and bots cannot apply.', ephemeral: true });
  }
  if (apps.openForUser(interaction.user.id)) {
    return interaction.reply({
      content: '⏳ You already have an application under review. A moderator will get to it.',
      ephemeral: true,
    });
  }

  const check = validateApplyFields({
    fullName: interaction.fields.getTextInputValue('fullName'),
    email: interaction.fields.getTextInputValue('email'),
    skills: interaction.fields.getTextInputValue('skills'),
    motivation: interaction.fields.getTextInputValue('motivation'),
    division: interaction.fields.getTextInputValue('division'),
    divisions: divisionChoices(),
  });

  if (!check.ok) {
    return interaction.reply({
      content: '❌ Please fix and resubmit:\n• ' + check.errors.join('\n• '),
      ephemeral: true,
    });
  }

  // Acknowledge IMMEDIATELY. Creating the ticket channel plus its
  // permission overwrites is ~10 API calls, which blows Discord's 3-second
  // interaction budget and surfaces as "The application did not respond in
  // time." Defer first, then do the slow work, then editReply.
  await interaction.deferReply({ ephemeral: true });

  // The username comes from the account, never typed — no typos possible.
  const app = apps.create({
    discordUserId: interaction.user.id,
    username: interaction.user.username,
    ticket: interaction.user.username,
    ...check.data,
  });

  try {
    await createTicketChannel(interaction.guild, app);
    await apps.save();
  } catch (err) {
    console.error('ticket creation failed:', err.message);
    return interaction.editReply({ content: '❌ Could not open your ticket. Please try again.' });
  }

  return interaction.editReply({
    content:
      `✅ Application received. Your reference is **${app.vicId}**.\n` +
      'A moderator will review it — you will get a DM either way. Keep this ID safe.',
  });
}

/** Division id + display name pairs for the modal and card. */
function divisionChoices() {
  return Object.entries(config.roles.divisions ?? {}).map(([id, name]) => ({ id, name }));
}

async function createTicketChannel(guild, app) {
  const { ChannelType, PermissionFlagsBits: P } = await import('discord.js');
  const roles = await guild.roles.fetch();
  const byName = Object.fromEntries(roles.map((r) => [r.name, r.id]));
  const staffIds = [
    byName[config.roles.admin], byName[config.roles.moderator], byName[config.roles.founder],
  ].filter(Boolean);

  const { ticketChannelName } = await import('./applications.js');
  const parent = needChannel(guild, OPERATIONS_CATEGORY, ChannelType.GuildCategory,
    'application tickets would be created outside the permission matrix');

  const channel = await guild.channels.create({
    name: ticketChannelName(app.username),
    type: ChannelType.GuildText,
    parent: parent?.id,
    topic: `Application ${app.vicId} · ${app.fullName}`,
    reason: `VIC application ${app.vicId}`,
  });
  if (!parent) {
    console.error('   ✗ ticket created with NO parent — it is outside every permission overwrite in the matrix');
  }

  // Private: applicant + staff only.
  await channel.permissionOverwrites.edit(guild.roles.everyone, { ViewChannel: false }, 'intake');
  await channel.permissionOverwrites.edit(app.discordUserId, {
    ViewChannel: true, SendMessages: true, ReadMessageHistory: true,
  }, 'intake');
  for (const rid of staffIds) {
    await channel.permissionOverwrites.edit(rid, {
      ViewChannel: true, SendMessages: true, ManageMessages: true, ReadMessageHistory: true,
    }, 'intake').catch(() => {});
  }
  // Bots need explicit access to read/manage their own tickets.
  for (const rid of guild.members.me.roles.cache.map((r) => r.id)) {
    await channel.permissionOverwrites.edit(rid, {
      ViewChannel: true, SendMessages: true, ReadMessageHistory: true, ManageMessages: true,
    }, 'intake').catch(() => {});
  }
  void P;

  app.channelId = channel.id;
  const divisionName = divisionLabel(app);
  await channel.send(buildTicketCard(app, divisionName, config.roles.divisions));
  await apps.save();

  // Also drop a copy in the staff review queue so it isn't missed.
  const review = guild.channels.cache.find((c) => c.name === REVIEW);
  if (review) {
    await review.send({
      content:
        `🎟️ New application **${app.vicId}** from <@${app.discordUserId}> — ${divisionName}.\n` +
        `Review it here: ${channel}`,
    });
  }
  console.log(`🎟️  ticket created for ${app.username} (${app.vicId})`);
  return channel;
}

/** Approve or reject from the ticket card. */
async function handleTicketDecision(interaction, action, vicId) {
  if (!mod.isStaff(interaction.member)) {
    return interaction.reply({ content: '❌ Moderators only.', ephemeral: true });
  }
  const app = apps.get(vicId);
  if (!app) return interaction.reply({ content: `❌ No application \`${vicId}\`.`, ephemeral: true });
  if (app.status !== OPEN) {
    return interaction.reply({
      content: `⚠️ \`${vicId}\` is already **${app.status}** — no change made.`,
      ephemeral: true,
    });
  }

  await interaction.deferReply({ ephemeral: true });
  const divisionName = divisionLabel(app);
  const member = await interaction.guild.members.fetch(app.discordUserId).catch(() => null);

  if (action === 'approve') {
    if (!member) {
      return interaction.editReply('❌ That member is no longer in the server. Nothing changed.');
    }
    await grantRoles(interaction.guild, member, app.divisionIds ?? [app.divisionId]);
    apps.decide(vicId, 'APPROVED', { decidedBy: interaction.user.id, channelId: app.channelId });
    try {
      await member.send(buildApprovedDM(
        { id: vicId, full_name: app.fullName, skills: app.skills },
        divisionName,
        vicId
      ));
    } catch { /* DMs closed */ }
    await audit(client, buildAuditEntry({
      action: 'APPROVE',
      app: { id: vicId, full_name: app.fullName },
      moderator: interaction.user.id,
      divisionName,
    }));
    await interaction.update({ components: [] }).catch(() => {});
    await finishTicket(app, '✅ Approved — roles granted, applicant DM\'d.', 0x2ecc71);
    return interaction.editReply(`✅ Approved **${app.fullName}** (${vicId}).`);
  }

  apps.decide(vicId, 'REJECTED', { decidedBy: interaction.user.id, channelId: app.channelId });
  if (member) {
    try { await member.send(buildRejectedDM({ id: vicId, full_name: app.fullName }, null)); }
    catch { /* DMs closed */ }
  }
  await audit(client, buildAuditEntry({
    action: 'REJECT',
    app: { id: vicId, full_name: app.fullName },
    moderator: interaction.user.id,
    divisionName,
  }));
  await interaction.update({ components: [] }).catch(() => {});
  await finishTicket(app, '❌ Rejected — applicant notified.', 0xe74c3c);
  return interaction.editReply(`❌ Rejected **${app.fullName}** (${vicId}).`);
}

/** Lock the ticket so the thread of record stays readable but frozen. */
async function finishTicket(app, note, color) {
  await apps.save();
  if (!app.channelId) return;
  try {
    const ch = await client.channels.fetch(app.channelId);
    if (!ch?.isTextBased()) return;
    const { EmbedBuilder } = await import('discord.js');
    await ch.send({
      embeds: [new EmbedBuilder().setColor(color).setDescription(note)],
    });
    await ch.permissionOverwrites.edit(ch.guild.roles.everyone, { SendMessages: false }, 'decision');
    for (const rid of ch.guild.members.me.roles.cache.map((r) => r.id)) {
      await ch.permissionOverwrites.edit(rid, { SendMessages: false }, 'decision').catch(() => {});
    }
  } catch (err) {
    console.error('finishTicket:', err.message);
  }
}

async function handleDecision(interaction, action, applicationId) {
  if (!mod.isStaff(interaction.member)) {
    return interaction.reply({ content: '❌ Moderators only.', ephemeral: true });
  }
  if (isRateLimited(interaction.user.id, {
    limit: config.runtime.rateLimitActions,
    windowMs: config.runtime.rateLimitWindowMs,
  })) {
    return interaction.reply({ content: '⏳ You are reviewing too fast. Take a moment.', ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });
  recordAction(interaction.user.id);

  try {
    const app = await getApplicationById(applicationId);
    if (!app) return interaction.editReply(`❌ \`${applicationId}\` not found.`);
    if (app.status !== 'PENDING') {
      return interaction.editReply(`⚠️ Already **${app.status}** — no change made.`);
    }

    const guild = interaction.guild;
    const divisionName = await getDivisionName(app.division_id);

    if (action === 'approve') {
      // The site form marks Discord username OPTIONAL, so it is often null.
      // Refuse with guidance instead of failing on "null".
      if (!app.discord_username?.trim()) {
        return interaction.editReply(
          `❌ **${app.full_name}** gave no Discord username on their application, ` +
          `so there is nobody to grant roles to.\n` +
          `Ask them for it (or wait for \`/claim\`), then approve again — ` +
          `nothing was changed.`
        );
      }
      const member = await findApplicant(guild, app.discord_username);
      if (!member) {
        return interaction.editReply(
          `❌ No Discord member matches **${app.discord_username}**. ` +
          `They must join the server before approval — nothing was changed.`
        );
      }
      await grantRoles(guild, member, [app.division_id]);
      if (hasSupabase) await markApproved(applicationId, interaction.user.id);
      try {
        await member.send(buildApprovedDM(app, divisionName, applicationId));
      } catch { /* DMs closed */ }

      await audit(client, buildAuditEntry({ action: 'APPROVE', app, moderator: interaction.user.id, divisionName }));
      await interaction.update({ components: [] }).catch(() => {});
      return interaction.editReply(`✅ Approved **${app.full_name}** — roles granted, DM sent.`);
    }

    if (hasSupabase) await markRejected(applicationId, interaction.user.id, null);
    const member = await findApplicant(guild, app.discord_username);
    if (member) { try { await member.send(buildRejectedDM(app, null)); } catch { /* ignore */ } }

    await audit(client, buildAuditEntry({ action: 'REJECT', app, moderator: interaction.user.id, divisionName }));
    await interaction.update({ components: [] }).catch(() => {});
    return interaction.editReply(`❌ Rejected **${app.full_name}**.`);
  } catch (err) {
    console.error('handleDecision:', err.message);
    return interaction.editReply(`⚠️ ${err.message}`);
  }
}

// ---------------------------------------------------------
// Slash commands
// ---------------------------------------------------------
async function handleCommand(i) {
  const { commandName, options } = i;

  // Member-facing commands — everyone may use these.
  if (commandName === 'membercount' || commandName === 'activerank') {
    return handleMemberCommand(i);
  }

  if (commandName === 'apply') {
    if (!canApply(i.member)) {
      return i.reply({ content: '❌ Staff and bots cannot apply.', ephemeral: true });
    }
    if (apps.openForUser(i.user.id)) {
      return i.reply({ content: '⏳ You already have an application under review.', ephemeral: true });
    }
    return showApplyModal(i, { divisions: divisionChoices() });
  }

  if (!mod.isStaff(i.member)) {
    return i.reply({ content: '❌ Moderators only.', ephemeral: true });
  }

  if (commandName === 'warn') {
    const user = options.getUser('user', true);
    const reason = options.getString('reason', true);
    await i.deferReply({ ephemeral: true }); // DM + audit log follow
    const member = await i.guild.members.fetch(user.id).catch(() => null);
    if (!member) return i.editReply({ content: '❌ That member is not in this server.' });

    const warn = mod.warns.add(user.id, reason, i.user.id);
    try {
      await member.send(
        `You have been **warned** in the VoltEdge Innovation Community.\n` +
        `Reason: *${reason}*\nWarn ID: \`${warn.id}\`\n` +
        `Further violations may lead to a timeout or removal.`
      );
    } catch { /* DMs closed */ }

    await mod.log(`⚠️ Member warned: ${user.tag}`, 0xf39c12, [
      { name: 'Reason', value: reason, inline: false },
      { name: 'Moderator', value: `<@${i.user.id}>`, inline: true },
      { name: 'Total active warnings', value: String(mod.warns.activeCount(user.id)), inline: true },
    ]);
    return i.editReply({ content: `⚠️ Warned ${user.tag} (id \`${warn.id}\`).` });
  }

  if (commandName === 'warnings') {
    const user = options.getUser('user', true);
    const warns = mod.warns.list(user.id);
    if (!warns.length) return i.reply({ content: `✅ ${user.tag} has no warnings.`, ephemeral: true });
    const lines = warns.map((w) =>
      `\`#${w.id}\` ${w.active ? '🟠' : '✅'} <t:${Math.floor(new Date(w.at).getTime() / 1000)}:d> — ${w.reason}`
    );
    const embed = new EmbedBuilder()
      .setTitle(`Warnings for ${user.tag}`)
      .setColor(0xf39c12)
      .setDescription(lines.join('\n'))
      .setFooter({ text: `${warns.filter((w) => w.active).length} active of ${warns.length}` });
    return i.reply({ embeds: [embed], ephemeral: true });
  }

  if (commandName === 'timeout') {
    const user = options.getUser('user', true);
    const duration = options.getString('duration', true);
    const ms = parseDuration(duration);
    if (!ms) return i.reply({ content: '❌ Duration must look like `10m`, `2h` or `7d`.', ephemeral: true });
    if (ms > 28 * 86_400_000) return i.reply({ content: '❌ Discord caps timeouts at 28 days.', ephemeral: true });

    const reason = options.getString('reason') ?? 'No reason given';
    await i.deferReply({ ephemeral: true }); // timeout + DM + log follow
    const member = await i.guild.members.fetch(user.id).catch(() => null);
    if (!member) return i.editReply({ content: '❌ That member is not in this server.' });

    try {
      await member.timeout(ms, `${i.user.tag}: ${reason}`);
    } catch (err) {
      return i.editReply({ content: `❌ Timeout failed: ${err.message}` });
    }

    try {
      await member.send(`You have been timed out for **${duration}**.\nReason: *${reason}*`);
    } catch { /* ignore */ }

    await mod.log(`⏱️ Member timed out: ${user.tag}`, 0xe67e22, [
      { name: 'Duration', value: duration, inline: true },
      { name: 'Reason', value: reason, inline: false },
      { name: 'Moderator', value: `<@${i.user.id}>`, inline: true },
    ]);
    return i.editReply({ content: `⏱️ Timed out ${user.tag} for ${duration}.` });
  }

  if (commandName === 'paniclock') {
    const mode = options.getString('mode', true);
    await i.deferReply({ ephemeral: true }); // rewrites every channel
    await mod.panicLock(mode === 'on');
    return i.editReply({
      content: mode === 'on'
        ? '🔒 Server locked — members can read but not post.'
        : '🔓 Server unlocked — posting restored.',
    });
  }

  if (commandName === 'close' || commandName === 'resolvewarn' ||
      commandName === 'userinfo' || commandName === 'lookup') {
    return handleStaffTools(i, commandName, options);
  }

  if (commandName === 'giverole' || commandName === 'temprole' || commandName === 'revokerole') {
    return handleRoleCommand(i, commandName, options);
  }

  if (commandName === 'approve') {
    const vicId = options.getString('vic_id', true).trim();
    if (!hasSupabase) return i.reply({ content: '❌ Supabase not configured.', ephemeral: true });
    const app = await getApplicationById(vicId).catch(() => null);
    if (!app) return i.reply({ content: `❌ No application \`${vicId}\`.`, ephemeral: true });
    if (app.status !== 'PENDING') {
      return i.reply({ content: `⚠️ Already **${app.status}**.`, ephemeral: true });
    }
    return handleDecision(i, 'approve', vicId);
  }
}

// ---------------------------------------------------------
// Ticket lifecycle + member lookup
// ---------------------------------------------------------
async function handleStaffTools(i, commandName, options) {
  if (commandName === 'close') return closeTicket(i, options);
  if (commandName === 'resolvewarn') return resolveWarn(i, options);
  if (commandName === 'userinfo') return showUserInfo(i, options);
  if (commandName === 'lookup') return lookupApplication(i, options);
}

/**
 * Close a ticket: locks posting, archives it, and revokes the applicant's
 * access so a pile of dead tickets does not clutter their sidebar. The
 * record survives in the store and in #mod-log.
 */
async function closeTicket(i, options) {
  await i.deferReply({ ephemeral: true });
  const channel = i.channel;
  if (!channel?.isTextBased() || channel.parent?.name !== OPERATIONS_CATEGORY) {
    return i.editReply(`❌ Use \`/close\` inside a ticket channel (one inside **${OPERATIONS_CATEGORY}**).`);
  }

  const reason = options.getString('reason') ?? 'No reason given';
  const now = Date.now();
  const app = apps ? [...apps.byId.values()].find((a) => a.channelId === channel.id) : null;

  try {
    await channel.permissionOverwrites.edit(channel.guild.roles.everyone, {
      SendMessages: false,
    }, 'VIC ticket closed');
    // The applicant keeps read-only access to their own thread.
    if (app) {
      await channel.permissionOverwrites.edit(app.discordUserId, {
        SendMessages: false,
      }, 'VIC ticket closed').catch(() => {});
    }
    await channel.setArchived?.(true, 'VIC ticket closed');
  } catch (err) {
    console.error('closeTicket:', err.message);
    return i.editReply(`❌ Could not close the ticket: ${err.message}`);
  }

  if (app) {
    apps.decide(app.vicId, app.status === 'PENDING' ? 'REJECTED' : app.status, {
      decidedBy: i.user.id,
      reason,
      channelId: app.channelId,
    });
    if (app.status === 'PENDING') {
      // Never approved — tell them, so a closed thread is never mistaken
      // for a silent hold.
      try {
        const m = await i.guild.members.fetch(app.discordUserId).catch(() => null);
        await m?.send(buildRejectedDM({ id: app.vicId, full_name: app.fullName }, reason));
      } catch { /* DMs closed */ }
    }
    await apps.save();
  }

  await mod.log(`🔒 Ticket closed: #${channel.name}`, 0x95a5a6, [
    { name: 'Reason', value: reason, inline: false },
    { name: 'Moderator', value: `<@${i.user.id}>`, inline: true },
    ...(app ? [{ name: 'VIC ID', value: `\`${app.vicId}\``, inline: true }] : []),
  ]);

  return i.editReply({
    content:
      `🔒 Closed **#${channel.name}** and archived it.` +
      (app ? `\nApplicant keeps read-only access. Record saved as \`${app.vicId}\`.` : ''),
  });
}

/** Clear an active warning so the member's record is clean. */
async function resolveWarn(i, options) {
  await i.deferReply({ ephemeral: true });
  const user = options.getUser('user', true);
  const warnId = options.getInteger('warn_id', true);

  const warns = mod.warns.list(user.id);
  const target = warns.find((w) => w.id === warnId);
  if (!target) return i.editReply(`❌ No warning \`#${warnId}\` for ${user.tag}.`);
  if (!target.active) return i.editReply(`ℹ️ Warning \`#${warnId}\` was already resolved.`);

  mod.warns.resolve(warnId);
  await mod.log(`✅ Warning resolved: \`#${warnId}\` for ${user.tag}`, 0x2ecc71, [
    { name: 'Original reason', value: target.reason, inline: false },
    { name: 'Moderator', value: `<@${i.user.id}>`, inline: true },
  ]);
  return i.editReply(`✅ Warning \`#${warnId}\` resolved. ${mod.warns.activeCount(user.id)} still active.`);
}

/** One screen with everything a moderator usually needs about a member. */
async function showUserInfo(i, options) {
  await i.deferReply({ ephemeral: true });
  const user = options.getUser('user', true);
  const member = await i.guild.members.fetch(user.id).catch(() => null);
  if (!member) return i.editReply(`❌ ${user.tag} is not in this server.`);

  const roleNames = [...member.roles.cache].map((r) => r.name).filter((n) => n !== '@everyone');
  const warns = mod.warns.list(user.id);
  const app = apps?.openForUser(user.id);
  const temps = tempRoles?.pendingFor(user.id) ?? [];

  const { EmbedBuilder } = await import('discord.js');
  const embed = new EmbedBuilder()
    .setTitle(user.tag)
    .setColor(member.displayHexColor || 0x3498db)
    .addFields(
      { name: '🎖️ Roles', value: roleNames.length ? roleNames.join(', ') : '_none_', inline: false },
      {
        name: '⚠️ Warnings',
        value: warns.length
          ? warns.map((w) => `\`#${w.id}\` ${w.active ? '🟠 active' : '✅ resolved'} — ${w.reason}`).join('\n')
          : '_none_',
        inline: false,
      },
    )
    .setFooter({ text: `id ${user.id} · account created ${user.createdAt.toISOString().slice(0, 10)}` })
    .setTimestamp();

  if (app) embed.addFields({ name: '🎟️ Application', value: `\`${app.vicId}\` — ${app.status}`, inline: false });
  if (temps.length) {
    embed.addFields({
      name: '⏱️ Temp roles',
      value: temps.map((t) => `**${t.roleName}** — expires <t:${Math.floor(Date.parse(t.expiresAt) / 1000)}:R>`).join('\n'),
      inline: false,
    });
  }
  if (member.isCommunicationDisabled()) {
    embed.addFields({ name: '🔇 Timed out', value: `until <t:${Math.floor(Date.parse(member.communicationDisabledUntilTimestamp) / 1000)}:R>`, inline: false });
  }

  return i.editReply({ embeds: [embed] });
}

/** Find any application by VIC ID. */
async function lookupApplication(i, options) {
  await i.deferReply({ ephemeral: true });
  const vicId = options.getString('vic_id', true).trim().toUpperCase();
  const app = apps?.get(vicId);
  if (!app) return i.editReply(`❌ No application \`${vicId}\`.`);

  const { EmbedBuilder } = await import('discord.js');
  const divisions = (app.divisionIds?.length ? app.divisionIds : [app.divisionId])
    .map((d) => config.roles.divisions[d] ?? d).join(' + ');
  return i.editReply({
    embeds: [
      new EmbedBuilder()
        .setTitle(`${app.vicId} — ${app.fullName}`)
        .setColor(app.status === 'APPROVED' ? 0x2ecc71 : app.status === 'REJECTED' ? 0xe74c3c : 0xf39c12)
        .addFields(
          { name: 'Status', value: app.status, inline: true },
          { name: 'Division(s)', value: divisions || 'Unassigned', inline: true },
          { name: 'Discord', value: `<@${app.discordUserId}>`, inline: true },
          { name: 'Email', value: app.email || '—', inline: true },
          { name: 'Skills', value: (app.skills ?? '_none_').slice(0, 1000), inline: false },
          { name: 'Motivation', value: (app.motivation ?? '_none_').slice(0, 1000), inline: false },
          ...(app.reason ? [{ name: 'Closing reason', value: app.reason, inline: false }] : []),
        )
        .setTimestamp()
        .setFooter({ text: `applied <t:${Math.floor(Date.parse(app.createdAt) / 1000)}:R>` }),
    ],
  });
}

// ---------------------------------------------------------
// Role administration (staff only)
// ---------------------------------------------------------
async function handleRoleCommand(i, commandName, options) {
  // Acknowledge first: member fetch + role edit + audit log + DM all happen
  // before we could otherwise reply, which exceeds Discord's 3s budget.
  await i.deferReply({ ephemeral: true });

  const guild = i.guild;
  const user = options.getUser('user', true);
  const role = options.getRole('role', true);
  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return i.editReply({ content: '❌ That member is not in this server.' });

  // The bot cannot grant or strip roles at/above its own highest role.
  const botHighest = guild.members.me?.roles?.highest?.position ?? 0;
  const check = canGrantRole({ ...role, managed: role.managed ?? false }, botHighest);
  if (!check.ok) return i.editReply({ content: `❌ ${check.reason}` });

  if (commandName === 'giverole') {
    const reason = options.getString('reason', true);
    if (member.roles.cache.has(role.id)) {
      return i.editReply({ content: `ℹ️ ${user.tag} already has **${role.name}**.` });
    }
    await member.roles.add(role, `VIC grant: ${reason}`);
    await mod.log(`🎖️ Role granted: **${role.name}** → ${user.tag}`, 0x2ecc71, [
      { name: 'Reason', value: reason, inline: false },
      { name: 'Moderator', value: `<@${i.user.id}>`, inline: true },
    ]);
    try { await member.send(`You have been given the **${role.name}** role in VIC. Reason: *${reason}*`); }
    catch { /* DMs closed */ }
    return i.editReply({ content: `🎖️ Granted **${role.name}** to ${user.tag}.` });
  }

  if (commandName === 'temprole') {
    const duration = options.getString('duration', true);
    const ms = parseDuration(duration);
    if (!ms) return i.editReply({ content: '❌ Duration must look like `10m`, `2h` or `7d`.' });
    if (ms > MAX_TEMP_MS) {
      return i.editReply({ content: `❌ Too long — the cap is ${formatDuration(MAX_TEMP_MS)}.` });
    }
    const reason = options.getString('reason') ?? 'No reason given';
    if (!member.roles.cache.has(role.id)) await member.roles.add(role, `VIC temp role: ${reason}`);

    tempRoles.add({
      userId: user.id,
      roleId: role.id,
      roleName: role.name,
      username: user.username,
      grantedBy: i.user.id,
      reason,
      grantedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + ms).toISOString(),
    });
    await tempRoles.save();

    await mod.log(`⏱️ Temporary role: **${role.name}** → ${user.tag} for ${formatDuration(ms)}`, 0xf39c12, [
      { name: 'Reason', value: reason, inline: false },
      { name: 'Moderator', value: `<@${i.user.id}>`, inline: true },
      { name: 'Expires', value: `<t:${Math.floor((Date.now() + ms) / 1000)}:R>`, inline: true },
    ]);
    try { await member.send(`You have been given the **${role.name}** role for **${formatDuration(ms)}**. Reason: *${reason}*`); }
    catch { /* DMs closed */ }
    return i.editReply({ content: `⏱️ **${role.name}** → ${user.tag} for ${formatDuration(ms)}. Auto-removes.` });
  }

  if (commandName === 'revokerole') {
    const reason = options.getString('reason') ?? 'No reason given';
    const wasTemp = tempRoles.remove(user.id, role.id);
    await tempRoles.save();
    if (!member.roles.cache.has(role.id)) {
      return i.editReply({ content: `ℹ️ ${user.tag} does not have **${role.name}**.` });
    }
    await member.roles.remove(role, `VIC revoke: ${reason}`);
    await mod.log(`🚫 Role removed: **${role.name}** from ${user.tag}${wasTemp ? ' (temp, cancelled early)' : ''}`, 0xe67e22, [
      { name: 'Reason', value: reason, inline: false },
      { name: 'Moderator', value: `<@${i.user.id}>`, inline: true },
    ]);
    try { await member.send(`The **${role.name}** role was removed from your account. Reason: *${reason}*`); }
    catch { /* DMs closed */ }
    return i.editReply({ content: `🚫 Removed **${role.name}** from ${user.tag}.` });
  }
}

// ---------------------------------------------------------
// Member-facing commands (no staff gate)
// ---------------------------------------------------------
async function handleMemberCommand(i) {
  const { commandName, options } = i;
  const guild = i.guild;

  if (commandName === 'membercount') {
    await i.deferReply({ ephemeral: true });
    let members;
    try {
      members = await guild.members.fetch();
    } catch (err) {
      return i.editReply('❌ Could not fetch the member list. The bot may be missing the Server Members intent.');
    }
    const roles = await guild.roles.fetch().catch(() => null);
    const byName = roles ? Object.fromEntries(roles.map((r) => [r.name, r.id])) : {};
    const flat = [...members.values()].map((m) => ({
      id: m.id,
      bot: m.user.bot,
      roleIds: [...m.roles.cache.keys()],
    }));
    const stats = computeMemberStats(flat, {
      member: byName[config.roles.member],
      applicant: byName[config.roles.applicant],
      divisions: config.roles.divisions
        ? Object.fromEntries(Object.entries(config.roles.divisions).map(([divId, roleName]) => [divId, byName[roleName]]))
        : {},
      founder: byName[config.roles.founder],
      admin: byName[config.roles.admin],
      moderator: byName[config.roles.moderator],
      mentor: byName[config.roles.mentor],
    });
    // Division ids mean nothing to members — map them to role names.
    const divisionNames = {};
    for (const [divId, roleName] of Object.entries(config.roles.divisions ?? {})) {
      divisionNames[divId] = roleName;
    }
    return i.editReply(buildMemberCountEmbed(stats, divisionNames));
  }

  if (commandName === 'activerank') {
    if (!activity) {
      return i.reply({ content: '❌ Activity tracking is not running yet. Try again in a minute.', ephemeral: true });
    }
    const window = options.getString('window') ?? '7';
    const now = Date.now();
    const DAY = 86_400_000;
    const sinceMs = window === 'all' ? 0 : now - Number(window) * DAY;
    const label = window === 'all' ? 'all time' : `last ${window} days`;
    const rows = activity.rank(sinceMs, 10);
    return i.reply({ ...buildRankEmbed(rows, { windowLabel: label, since: activity.since }), ephemeral: true });
  }
}

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------
async function findApplicant(guild, discordUsername) {
  if (!guild || !discordUsername) return null;
  const target = String(discordUsername).replace(/^@/, '').toLowerCase();
  const members = await guild.members.fetch().catch(() => guild.members.cache);
  for (const m of members.values()) {
    if (m.user.username.toLowerCase() === target) return m;
    if (m.displayName?.toLowerCase() === target) return m;
  }
  return null;
}

/** Grant ✅ Member plus every division the applicant chose (up to two). */
async function grantRoles(guild, member, divisionIds) {
  const roles = await guild.roles.fetch();
  const byName = Object.fromEntries(roles.map((r) => [r.name, r.id]));
  const ids = (Array.isArray(divisionIds) ? divisionIds : [divisionIds]).filter(Boolean);
  const add = [
    byName[config.roles.member],
    ...ids.map((d) => byName[config.roles.divisions[d]]),
  ].filter(Boolean);
  if (add.length) await member.roles.add(add, 'VIC application approved');
  const applicant = byName[config.roles.applicant];
  if (applicant) await member.roles.remove(applicant, 'VIC application approved');
}

/** Human-readable division list for DMs and cards. */
function divisionLabel(app) {
  const ids = app.divisionIds?.length ? app.divisionIds : [app.divisionId];
  return ids.filter(Boolean).map((d) => config.roles.divisions[d] ?? d).join(' + ') || 'Unassigned';
}
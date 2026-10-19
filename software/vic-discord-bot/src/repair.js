/**
 * Repair pass — fixes issues found after the first provision run.
 *
 * 1. Re-homes the three pre-existing channels (#welcome-and-rules,
 *    #announcements, #resources, #meeting-plans, #off-topic) that the
 *    first run gated without granting anybody access, locking staff out.
 * 2. Moves the decorative "🤖 VIC Bot" role above Member/Applicant so it
 *    can always grant those roles even if the managed bot role moves.
 * 3. Guarantees the bot's own role can see #applications-review and
 *    #mod-log, without exposing them to members.
 *
 *   node src/repair.js
 */

import 'dotenv/config';
import { Client, GatewayIntentBits, PermissionFlagsBits, ChannelType } from 'discord.js';
import { config } from './config.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

const P = {
  VIEW: PermissionFlagsBits.ViewChannel,
  SEND: PermissionFlagsBits.SendMessages,
  EMBED: PermissionFlagsBits.EmbedLinks,
  READ: PermissionFlagsBits.ReadMessageHistory,
};

// Pre-existing channels from the original server, mapped to who should see them.
const LEGACY = {
  'welcome-and-rules': 'open',   // public entry point
  announcements: 'member',        // read-only for members
  resources: 'member',
  'meeting-plans': 'member',
  'off-topic': 'member',
};

client.once('clientReady', async () => {
  const guild = client.guilds.cache.get(config.discord.guildId);
  if (!guild) {
    console.error('❌ guild not found');
    process.exit(1);
  }

  const roles = await guild.roles.fetch();
  const byName = Object.fromEntries(roles.map((r) => [r.name, r.id]));
  const everyone = guild.roles.everyone;

  const STAFF = [byName[config.roles.admin], byName[config.roles.moderator], byName[config.roles.founder]].filter(Boolean);
  const MEMBERS = [
    byName[config.roles.member], byName[config.roles.mentor],
    ...STAFF,
  ].filter(Boolean);
  const APPLICANTS = [byName[config.roles.applicant], ...MEMBERS].filter(Boolean);

  console.log('▸ Repairing legacy channels…');
  for (const [name, level] of Object.entries(LEGACY)) {
    const ch = guild.channels.cache.find((c) => c.name === name);
    if (!ch) { console.log(`   · ${name} — not present, skipped`); continue; }

    if (level === 'open') {
      await ch.permissionOverwrites.edit(everyone, { ViewChannel: true }, 'VIC repair');
      for (const rid of [...STAFF, ...MEMBERS, ...APPLICANTS.filter((x) => !MEMBERS.includes(x))]) {
        await ch.permissionOverwrites.edit(rid, { ViewChannel: true, ReadMessageHistory: true }, 'VIC repair').catch(() => {});
      }
    } else {
      await ch.permissionOverwrites.edit(everyone, { ViewChannel: false }, 'VIC repair');
      for (const rid of MEMBERS) {
        await ch.permissionOverwrites.edit(rid, {
          ViewChannel: true, ReadMessageHistory: true, SendMessages: true, EmbedLinks: true,
        }, 'VIC repair').catch(() => {});
      }
    }
    console.log(`   ✓ #${name} → ${level}`);
  }

  console.log('\n▸ Fixing role hierarchy…');
  const botRole = roles.find((r) => r.name === config.roles.bot);
  if (botRole) {
    // Place it just under the bot's managed role but above Member/Applicant.
    const memberRole = roles.find((r) => r.name === config.roles.member);
    const targetPos = (memberRole?.position ?? 1) + 1;
    await guild.roles.edit(botRole, { position: targetPos }, 'VIC repair');
    console.log(`   ✓ ${botRole.name} → position ${targetPos}`);
  }

  console.log('\n▸ Guaranteing bot access to staff channels…');
  for (const name of ['applications-review', 'mod-log', 'staff-chat']) {
    const ch = guild.channels.cache.find((c) => c.name === name);
    if (!ch) { console.log(`   · ${name} — missing`); continue; }
    const botManaged = member_roles_of(guild);
    for (const rid of [...botManaged, ...STAFF]) {
      await ch.permissionOverwrites.edit(rid, {
        ViewChannel: true, SendMessages: true, EmbedLinks: true, ReadMessageHistory: true,
      }, 'VIC repair').catch(() => {});
    }
    console.log(`   ✓ #${name}`);
  }

  console.log('\n✅ Repair complete.\n');
  process.exit(0);
});

function member_roles_of(guild) {
  const me = guild.members.me;
  return me ? me.roles.cache.map((r) => r.id) : [];
}

client.login(config.discord.token).catch((e) => {
  console.error('❌ login failed:', e.message);
  process.exit(1);
});
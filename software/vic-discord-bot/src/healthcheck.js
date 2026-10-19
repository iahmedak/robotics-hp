/**
 * Health check: proves the token works and the bot is in the server.
 *   npm run healthcheck
 *
 * Prints guild names + IDs so you can copy DISCORD_GUILD_ID without
 * turning on Developer Mode.
 */

import 'dotenv/config';
import { Client, GatewayIntentBits, REST, Routes } from 'discord.js';
import { config } from '../src/config.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// The gateway returns partial guild objects unless we also ask REST.
// REST gives us the real name, member count and our own permissions.
const rest = new REST({ version: '10' }).setToken(config.discord.token);

try {
  await client.login(config.discord.token);
} catch (err) {
  console.error('❌ Token rejected by Discord:', err.message);
  console.error('   Re-check DISCORD_TOKEN in .env (it is read only, never echoed).');
  process.exit(1);
}

console.log(`✅ Authenticated as ${client.user.tag}  (id ${client.user.id})`);
console.log(`   Servers the bot is in: ${client.guilds.cache.size}\n`);

if (client.guilds.cache.size === 0) {
  console.log('⚠️  The bot is in ZERO servers — it cannot provision anything yet.');
  console.log('   Invite it:');
  console.log(`   https://discord.com/oauth2/authorize?client_id=${client.user.id}`);
  console.log('   &permissions=8&integration_type=0&scope=bot\n');
  process.exit(2);
}

for (const g of client.guilds.cache.values()) {
  let detail;
  try {
    detail = await rest.get(Routes.guild(g.id));
  } catch {
    detail = null;
  }
  console.log(`   • ${detail?.name ?? '(name unavailable)'}`);
  console.log(`     id: ${g.id}   members: ${detail?.member_count ?? 'n/a'}`);
  const me = detail?.permissions ?? '0';
  console.log(`     my perms: ${me === '8' ? 'Administrator' : me}`);
}
console.log('\n→ copy the id you want into DISCORD_GUILD_ID in .env\n');
process.exit(0);
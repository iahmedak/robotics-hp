import "dotenv/config";
import { REST } from "discord.js";
import { config } from "../src/config.js";
const rest = new REST({ version: "10" }).setToken(config.discord.token);
const roles = await rest.get(`/guilds/${config.discord.guildId}/roles`);
const nameOf = new Map(roles.map((r) => [r.id, r.name]));
const members = await rest.get(`/guilds/${config.discord.guildId}/members?limit=100`);
for (const m of members) {
  if (m.user.bot) continue;
  console.log(`\n${m.user.username} (${m.user.id})`);
  for (const r of m.roles) console.log("   " + (nameOf.get(r) ?? r));
}

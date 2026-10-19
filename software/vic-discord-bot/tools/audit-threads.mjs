import "dotenv/config";
import { REST } from "discord.js";
import { config } from "../src/config.js";
const rest = new REST({ version: "10" }).setToken(config.discord.token);
const chans = await rest.get(`/guilds/${config.discord.guildId}/channels`);
const forumName = new Map(chans.filter((c) => c.type === 15).map((c) => [c.id, c.name]));
const r = await rest.get(`/guilds/${config.discord.guildId}/threads/active?limit=100`);
console.log("active threads in guild:", r.threads.length);
for (const t of r.threads) console.log(`  [${forumName.get(t.parent_id) ?? "?"}] ${t.name}`);

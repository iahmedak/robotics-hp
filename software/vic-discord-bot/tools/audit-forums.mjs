import "dotenv/config";
import { REST } from "discord.js";
import { config } from "../src/config.js";
const rest = new REST({ version: "10" }).setToken(config.discord.token);
const chans = await rest.get(`/guilds/${config.discord.guildId}/channels`);
for (const c of chans.filter((x) => x.type === 15)) {
  let threads = [];
  try { threads = (await rest.get(`/channels/${c.id}/threads/archived/public?limit=50`)).threads; } catch {}
  console.log(`#${c.name.padEnd(24)} threads=${threads.length}  ${threads.map((t) => '"' + t.name + '"').join(", ")}`);
}
console.log("\nvoice (cannot hold messages): " + chans.filter((c) => c.type === 2).length);
console.log("forums: " + chans.filter((c) => c.type === 15).length);

import "dotenv/config";
import { REST } from "discord.js";
import { config } from "../src/config.js";
const rest = new REST({ version: "10" }).setToken(config.discord.token);
const me = await rest.get("/users/@me");
const chans = await rest.get(`/guilds/${config.discord.guildId}/channels`);
for (const n of ["server-info", "policy-updates", "suggestions"]) {
  const ch = chans.find((c) => c.name === n);
  const m = await rest.get(`/channels/${ch.id}/messages?limit=10`);
  console.log(`\n#${n}  type=${ch.type}`);
  for (const x of m) console.log(`   type=${x.type} author=${x.author.username} id=${x.id} content="${x.content}" embeds=${x.embeds.length}`);
}

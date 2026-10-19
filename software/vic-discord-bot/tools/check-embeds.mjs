import "dotenv/config";
import { REST } from "discord.js";
import { config } from "../src/config.js";
const rest = new REST({ version: "10" }).setToken(config.discord.token);
const chans = await rest.get(`/guilds/${config.discord.guildId}/channels`);
const start = chans.find((c) => c.type === 4 && c.name.includes("START HERE"));
for (const c of chans.filter((x) => x.parent_id === start.id).sort((a, b) => a.position - b.position)) {
  console.log(`\n##### #${c.name}`);
  const m = await rest.get(`/channels/${c.id}/messages?limit=10`);
  for (const x of m) {
    console.log(`  [${x.author.username}] embeds=${x.embeds.length} components=${x.components?.length ?? 0}`);
    for (const e of x.embeds) {
      console.log(`     title: ${e.title ?? "-"}`);
      console.log(`     desc : ${(e.description ?? "-").slice(0, 150).replace(/\n/g, " / ")}`);
      const fields = (e.fields ?? []).map((f) => f.name);
      if (fields.length) console.log(`     fields: ${fields.join(", ")}`);
    }
  }
}

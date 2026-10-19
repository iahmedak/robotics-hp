import "dotenv/config";
import { REST } from "discord.js";
import { config } from "../src/config.js";
import { CHANNELS, categoryOfChannel } from "../src/layout.js";
const rest = new REST({ version: "10" }).setToken(config.discord.token);
const chans = await rest.get(`/guilds/${config.discord.guildId}/channels`);
const cats = new Map(chans.filter((c) => c.type === 4).map((c) => [c.id, c.name]));
const declared = new Set(Object.values(CHANNELS).flat().map((c) => c.name.replace(/^#/, "")));
for (const c of chans.filter((x) => x.type !== 4)) {
  const cat = cats.get(c.parent_id) ?? "(none)";
  const known = declared.has(c.name) ? "declared" : "STRAY ";
  let want = "?";
  if (known === "declared") { try { want = "cat " + categoryOfChannel("#" + c.name); } catch {} }
  if (cat === "(none)" || known === "STRAY " || cat.split(" ").slice(-1)[0] !== String(want).slice(-1)) {
    console.log(`  ${known} ${c.name.padEnd(28)} in [${cat}]  want ${want}`);
  }
}

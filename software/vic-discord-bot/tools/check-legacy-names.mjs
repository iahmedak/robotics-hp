import "dotenv/config";
import { REST } from "discord.js";
import { config } from "../src/config.js";
import { CATEGORY_RENAMES } from "../src/layout.js";

const rest = new REST({ version: "10" }).setToken(config.discord.token);
const chans = await rest.get(`/guilds/${config.discord.guildId}/channels`);
const cats = chans.filter((c) => c.type === 4).sort((a, b) => a.position - b.position);
const strip = (s) => s.replace(/\uFE0F/g, "");
const keys = Object.keys(CATEGORY_RENAMES);

console.log("live categories vs CATEGORY_RENAMES keys:");
for (const c of cats) {
  const hit = keys.some((k) => strip(k) === strip(c.name));
  console.log(`  ${hit ? "ok  " : "MISS"}  ${c.name}`);
}

import "dotenv/config";
import { REST } from "discord.js";
import { config } from "../src/config.js";
const rest = new REST({ version: "10" }).setToken(config.discord.token);
const chans = await rest.get(`/guilds/${config.discord.guildId}/channels`);
const cats = chans.filter((c) => c.type === 4).sort((a, b) => a.position - b.position);
const nameOf = new Map(chans.map((c) => [c.id, c.name]));
console.log("=== TOP OF SERVER ===");
for (const c of cats) {
  const kids = chans.filter((x) => x.parent_id === c.id);
  console.log(String(c.position).padStart(2) + "  " + c.name);
  for (const k of kids.sort((a, b) => a.position - b.position)) {
    const t = k.type === 15 ? "[FORUM]" : k.type === 2 ? "[VOICE] " : k.type === 13 ? "[STAGE] " : "        ";
    console.log("        " + t + k.name + (kids.length ? "" : ""));
  }
  if (kids.length === 0) console.log("        <-- EMPTY");
}
console.log("\ncategories:", cats.length, " channels:", chans.length);

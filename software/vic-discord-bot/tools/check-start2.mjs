import "dotenv/config";
import { REST } from "discord.js";
import { config } from "../src/config.js";
const rest = new REST({ version: "10" }).setToken(config.discord.token);
const chans = await rest.get(`/guilds/${config.discord.guildId}/channels`);
const start = chans.find((c) => c.type === 4 && c.name.includes("START HERE"));
const kids = chans.filter((x) => x.parent_id === start.id);

console.log("=== messages in each START HERE channel ===");
for (const c of kids.sort((a, b) => a.position - b.position)) {
  const m = await rest.get(`/channels/${c.id}/messages?limit=10`);
  console.log(`  #${c.name}  (${m.length} msg)`);
  for (const x of m) {
    const dup = m.filter((y) => y.content === x.content && y.content.length > 0).length > 1 ? "  <-- DUPLICATE TEXT" : "";
    console.log(`      ${x.author.username}: ${x.content.slice(0, 64).replace(/\n/g, " ")}${dup}`);
  }
}

console.log("\n=== near-duplicate channel names (whole guild) ===");
const names = chans.filter((x) => x.type !== 4).map((x) => x.name);
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const groups = new Map();
for (const n of names) {
  const k = norm(n);
  if (!groups.has(k)) groups.set(k, new Set());
  groups.get(k).add(n);
}
for (const [k, set] of groups) {
  if (set.size > 1) console.log(`  ${k}  ->  ${[...set].join("  |  ")}`);
}

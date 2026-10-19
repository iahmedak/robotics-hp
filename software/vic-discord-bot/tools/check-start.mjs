import "dotenv/config";
import { REST } from "discord.js";
import { config } from "../src/config.js";
const rest = new REST({ version: "10" }).setToken(config.discord.token);
const chans = await rest.get(`/guilds/${config.discord.guildId}/channels`);
const cats = new Map(chans.filter((c) => c.type === 4).map((c) => [c.id, c.name]));
console.log("=== 01 START HERE, raw ===");
const start = chans.find((c) => c.type === 4 && c.name.includes("START HERE"));
for (const c of chans.filter((x) => x.parent_id === start.id).sort((a, b) => a.position - b.position)) {
  console.log(`  ${String(c.position).padStart(2)}  ${c.name}`);
}
console.log("\n=== ALL duplicate names, anywhere ===");
const byName = new Map();
for (const c of chans.filter((x) => x.type !== 4)) {
  if (!byName.has(c.name)) byName.set(c.name, []);
  byName.get(c.name).push(c);
}
let any = false;
for (const [n, list] of byName) {
  if (list.length < 2) continue;
  any = true;
  console.log(`  ${n} x${list.length}`);
  for (const c of list) console.log(`      id=${c.id}  in [${cats.get(c.parent_id)}]`);
}
if (!any) console.log("  (none)");

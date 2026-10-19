import "dotenv/config";
import { REST } from "discord.js";
import { config } from "../src/config.js";
const rest = new REST({ version: "10" }).setToken(config.discord.token);
const chans = await rest.get(`/guilds/${config.discord.guildId}/channels`);
const cats = chans.filter((c) => c.type === 4);
console.log("ALL categories (" + cats.length + "):");
const byName = new Map();
for (const c of cats.sort((a, b) => a.position - b.position)) {
  console.log(`  pos ${String(c.position).padStart(2)}  ${c.name}  id=${c.id}`);
  byName.set(c.name, (byName.get(c.name) ?? 0) + 1);
}
console.log("\nduplicate category names:");
let d = false;
for (const [n, k] of byName) if (k > 1) { console.log("  " + n + " x" + k); d = true; }
if (!d) console.log("  (none)");
console.log("\norphan channels (parent_id points at nothing):");
let o = false;
for (const c of chans.filter((x) => x.type !== 4)) {
  if (!c.parent_id) { console.log("  " + c.name + "  (no parent)"); o = true; continue; }
  if (!byName.has(cats.find((x) => x.id === c.parent_id)?.name ?? "@@")) {
    console.log("  " + c.name + " -> unknown parent " + c.parent_id); o = true;
  }
}
if (!o) console.log("  (none)");

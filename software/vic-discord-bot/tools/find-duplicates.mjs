import "dotenv/config";
import { REST } from "discord.js";
import { config } from "../src/config.js";
const rest = new REST({ version: "10" }).setToken(config.discord.token);
const chans = await rest.get(`/guilds/${config.discord.guildId}/channels`);
const cats = new Map(chans.filter((c) => c.type === 4).map((c) => [c.id, c.name]));
const items = chans.filter((c) => c.type !== 4);
const rows = [];
for (const c of items) {
  const m = await rest.get(`/channels/${c.id}/messages?limit=1`);
  rows.push({ name: c.name, msgs: m.length, cat: cats.get(c.parent_id) ?? "(none)" });
}
const byName = new Map();
for (const r of rows) {
  if (!byName.has(r.name)) byName.set(r.name, []);
  byName.get(r.name).push(r);
}
console.log("DUPLICATE channel names:");
for (const [n, list] of byName) {
  if (list.length > 1) console.log(`  ${n}  x${list.length}  ->  ` + list.map((r) => `${r.cat}[${r.msgs}msg]`).join("  |  "));
}
console.log("\ntotal non-category channels:", rows.length);
console.log("empty channels:", rows.filter((r) => r.msgs === 0).length);

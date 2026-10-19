import "dotenv/config";
import { REST } from "discord.js";
import { config } from "../src/config.js";

const DRY = process.argv.includes("--dry");
const rest = new REST({ version: "10" }).setToken(config.discord.token);
const chans = await rest.get(`/guilds/${config.discord.guildId}/channels`);
const items = chans.filter((c) => c.type !== 4);

// count messages per channel
const count = new Map();
for (const c of items) {
  let last = null, n = 0;
  for (;;) {
    const q = new URLSearchParams({ limit: "100" });
    if (last) q.set("after", last);
    const m = await rest.get(`/channels/${c.id}/messages?${q}`);
    n += m.length;
    if (m.length < 100) break;
    last = m[m.length - 1].id;
  }
  count.set(c.id, n);
}

// group by name
const groups = new Map();
for (const c of items) {
  if (!groups.has(c.name)) groups.set(c.name, []);
  groups.get(c.name).push(c);
}

let deleted = 0;
for (const [name, list] of groups) {
  if (list.length < 2) continue;
  // keep the richest; tie-break on oldest snowflake (created first)
  const sorted = [...list].sort((a, b) => (count.get(b.id) - count.get(a.id)) || (BigInt(a.id) < BigInt(b.id) ? -1 : 1));
  const keep = sorted[0];
  for (const dup of sorted.slice(1)) {
    const why = `empty` === "empty" && count.get(dup.id) === 0 ? "empty" : `has ${count.get(dup.id)} msg(s)`;
    if (count.get(dup.id) > 0 && count.get(keep.id) > 0) {
      console.log(`  SKIP ${name} — both copies have content, refusing`);
      continue;
    }
    console.log(`  ${DRY ? "would delete" : "delete"} ${name} (${why})  id=${dup.id}`);
    if (!DRY) {
      await rest.delete(`/channels/${dup.id}`);
      deleted++;
      await new Promise((r) => setTimeout(r, 300));
    }
  }
}
console.log(`\n${DRY ? "would delete" : "deleted"} ${deleted} duplicate channel(s)`);

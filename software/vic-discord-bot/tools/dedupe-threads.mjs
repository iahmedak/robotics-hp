import "dotenv/config";
import { REST } from "discord.js";
import { config } from "../src/config.js";
const DRY = process.argv.includes("--dry");
const rest = new REST({ version: "10" }).setToken(config.discord.token);

const GENERATED = [
  "❓ Help desk", "💼 Opportunity board", "💡 Suggestions",
  "🔧 Hardware help", "💻 Code help", "🔍 Looking for team", "🏆 Showcase",
];

const chans = await rest.get(`/guilds/${config.discord.guildId}/channels`);
const forums = chans.filter((x) => x.type === 15);
const forumName = new Map(forums.map((c) => [c.id, c.name]));

// Guild-level listing is the reliable one here; the per-channel /threads/active
// route 404s on at least one forum on this API version.
const active = await rest.get(`/guilds/${config.discord.guildId}/threads/active?limit=100`);
let deleted = 0;
const per = new Map();
for (const t of active.threads) {
  if (!GENERATED.includes(t.name)) continue;
  if (!per.has(t.parent_id)) per.set(t.parent_id, []);
  per.get(t.parent_id).push(t);
}
for (const c of forums) {
  const dupes = per.get(c.id) ?? [];
  console.log(`#${c.name.padEnd(24)} ${dupes.length ? dupes.length + " duplicate(s)" : "clean"}`);
  for (const t of dupes) {
    if (DRY) continue;
    await rest.delete(`/channels/${t.id}`);
    deleted++;
    await new Promise((r) => setTimeout(r, 250));
  }
}
console.log(`\n${DRY ? "would delete" : "deleted"} ${deleted} duplicate thread(s)`);

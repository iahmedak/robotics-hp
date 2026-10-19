import "dotenv/config";
import { REST } from "discord.js";
import { config } from "../src/config.js";
const rest = new REST({ version: "10" }).setToken(config.discord.token);
const me = await rest.get("/users/@me");
const chans = await rest.get(`/guilds/${config.discord.guildId}/channels`);
const cats = new Map(chans.filter((c) => c.type === 4).map((c) => [c.id, c.name]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rows = [];
for (const c of chans.filter((x) => x.type !== 4).sort((a, b) => (cats.get(a.parent_id) ?? "").localeCompare(cats.get(b.parent_id) ?? "") || a.name.localeCompare(b.name))) {
  let last = null, total = 0, bot = 0;
  for (;;) {
    const q = new URLSearchParams({ limit: "100" });
    if (last) q.set("after", last);
    const m = await rest.get(`/channels/${c.id}/messages?${q}`);
    total += m.length;
    bot += m.filter((x) => x.author.id === me.id).length;
    if (m.length < 100) break;
    last = m[m.length - 1].id;
  }
  const pins = await rest.get(`/channels/${c.id}/pins?limit=100`);
  rows.push({ cat: cats.get(c.parent_id) ?? "?", name: c.name, total, bot, pins: pins.length });
  await sleep(60);
}

let noBot = 0, noPin = 0;
console.log("CATEGORY / CHANNEL — bot msgs / total / pins");
let lastCat = "";
for (const r of rows) {
  if (r.cat !== lastCat) { console.log(`\n  ${r.cat}`); lastCat = r.cat; }
  const flag = r.bot === 0 ? " NO-BOT" : "";
  const pin = r.pins === 0 ? " UNPINNED" : "";
  if (r.bot === 0) noBot++;
  if (r.pins === 0) noPin++;
  console.log(`     ${r.name.padEnd(30)} bot=${String(r.bot).padStart(3)} total=${String(r.total).padStart(4)} pins=${r.pins}${flag}${pin}`);
}
console.log(`\nSUMMARY: ${rows.length} channels | no bot message: ${noBot} | unpinned: ${noPin}`);

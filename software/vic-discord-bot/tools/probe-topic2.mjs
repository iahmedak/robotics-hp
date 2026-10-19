import "dotenv/config";
import { REST } from "discord.js";
import { config } from "../src/config.js";
const rest = new REST({ version: "10" }).setToken(config.discord.token);
const chans = await rest.get(`/guilds/${config.discord.guildId}/channels`);
const ch = chans.find((c) => c.name === "VIC General Meeting");
for (const t of ["a", "Meeting", "Open Community meeting.", "Everyone may join", "VIC — general"]) {
  try { await rest.patch(`/channels/${ch.id}`, { body: { topic: t } }); console.log(`ok   "${t}"`); }
  catch (e) { console.log(`FAIL "${t}" -> ${e.rawError?.errors?.topic?._errors?.[0]?.message ?? e.message}`); }
}
console.log("\n-- automod rules --");
try {
  const r = await rest.get(`/guilds/${config.discord.guildId}/auto-moderation/rules`);
  for (const x of r) console.log(`  rule ${x.id}  enabled=${x.enabled}  trigger=${x.triggerType}  action=${x.actionType}`);
  if (!r.length) console.log("  (no automod rules)");
} catch (e) { console.log("  cannot read: " + e.message); }

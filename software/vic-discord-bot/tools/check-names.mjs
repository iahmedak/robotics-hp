import "dotenv/config";
import { REST } from "discord.js";
import { config } from "../src/config.js";
const rest = new REST({ version: "10" }).setToken(config.discord.token);
const chans = await rest.get(`/guilds/${config.discord.guildId}/channels`);
const live = new Set(chans.map((c) => c.name));
const wanted = ["mod-log", "applications-review", "Applications", "welcome", "audit-log", "membership-approvals", "bot-commands", "general-discussion"];
for (const n of wanted) console.log(`  ${live.has(n) ? "ok  " : "DEAD"}  #${n}`);

import "dotenv/config";
import { REST } from "discord.js";
import { config } from "../src/config.js";
const rest = new REST({ version: "10" }).setToken(config.discord.token);
const chans = await rest.get(`/guilds/${config.discord.guildId}/channels`);
for (const c of chans.filter((x) => /approv|regist/i.test(x.name))) {
  console.log(`name="${c.name}"`);
  console.log("  codepoints:", [...c.name].map((ch) => ch.codePointAt(0).toString(16).padStart(4, "0")).join(" "));
}
const target = "membership-approvals";
const hit = chans.find((x) => x.name === target);
console.log(`\nexact match "${target}":`, hit ? "FOUND id=" + hit.id : "NOT FOUND");

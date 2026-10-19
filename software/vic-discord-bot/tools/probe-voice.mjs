import "dotenv/config";
import { REST } from "discord.js";
import { config } from "../src/config.js";
const rest = new REST({ version: "10" }).setToken(config.discord.token);
const chans = await rest.get(`/guilds/${config.discord.guildId}/channels`);
for (const n of ["VIC General Meeting", "Executive Meeting", "ERS Team Meeting"]) {
  const ch = chans.find((c) => c.name === n);
  console.log(`${n}  type=${ch.type}`);
  for (const body of [{ topic: "Open Community meeting." }, { name: ch.name, topic: "Open Community meeting." }]) {
    try {
      const r = await rest.patch(`/channels/${ch.id}`, { body });
      console.log(`   ok   keys=${Object.keys(body).join("+")}  topic="${r.topic}"`);
    } catch (e) { console.log(`   FAIL keys=${Object.keys(body).join("+")} -> ${JSON.stringify(e.rawError ?? e.message)}`); }
  }
}

import "dotenv/config";
import { REST } from "discord.js";
import { config } from "../src/config.js";
const rest = new REST({ version: "10" }).setToken(config.discord.token);
const cats = await rest.get(`/guilds/${config.discord.guildId}/channels`);
const target = cats.find((c) => c.type === 4 && c.name.includes("COMMUNITY"));
const candidates = ["VIC — welcome", "VIC - welcome", "VIC welcome", "welcome"];
for (const topic of candidates) {
  try {
    const c = await rest.post(`/guilds/${config.discord.guildId}/channels`, {
      body: { name: "_probe", type: 0, parent_id: target.id, topic },
    });
    console.log(`ok    topic=${JSON.stringify(topic)}`);
    await rest.delete(`/channels/${c.id}`);
  } catch (e) {
    console.log(`FAIL  topic=${JSON.stringify(topic)}  -> ${e.rawError?.message ?? e.message}`);
  }
}

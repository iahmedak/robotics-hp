import "dotenv/config";
import { REST } from "discord.js";
import { config } from "../src/config.js";
const rest = new REST({ version: "10" }).setToken(config.discord.token);
const chans = await rest.get(`/guilds/${config.discord.guildId}/channels`);
const forum = chans.find((c) => c.type === 15);
console.log("forum:", forum.name, forum.id);
try {
  const t = await rest.post(`/channels/${forum.id}/threads`, {
    body: { name: "probe thread", auto_archive_duration: 10080 },
  });
  console.log("created thread ok:", t.id);
  await rest.delete(`/channels/${t.id}`);
} catch (e) { console.log("FAIL plain:", JSON.stringify(e.rawError ?? e.message)); }

try {
  const t = await rest.post(`/channels/${forum.id}/threads`, {
    body: {
      name: "probe thread 2",
      auto_archive_duration: 10080,
      message: { embeds: [{ title: "T", description: "D", color: 177328 }] },
    },
  });
  console.log("created thread with message ok:", t.id);
  await rest.delete(`/channels/${t.id}`);
} catch (e) { console.log("FAIL with message:", JSON.stringify(e.rawError ?? e.message)); }

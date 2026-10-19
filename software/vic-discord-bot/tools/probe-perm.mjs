import "dotenv/config";
import { REST } from "discord.js";
import { config } from "../src/config.js";
const rest = new REST({ version: "10" }).setToken(config.discord.token);
const chans = await rest.get(`/guilds/${config.discord.guildId}/channels`);
const w = chans.find((c) => c.name === "welcome");
const roles = await rest.get(`/guilds/${config.discord.guildId}/roles`);
const every = config.discord.guildId;
const member = roles.find((r) => r.name === config.roles.member);

console.log("channel:", w.id, "type", w.type, "name", w.name);
console.log("existing overwrites:", w.permission_overwrites.length);

try {
  await rest.put(`/channels/${w.id}/permissions`, { body: [{ id: every, type: 0, allow: "1024", deny: "0" }] });
  console.log("BULK PUT /channels/:id/permissions   -> ok");
} catch (e) { console.log("BULK PUT -> FAIL", e.rawError?.message ?? e.message); }

try {
  await rest.put(`/channels/${w.id}/permissions/${every}`, { body: { type: 0, allow: "1024", deny: "0" } });
  console.log("SINGLE PUT /channels/:id/permissions/:id -> ok");
} catch (e) { console.log("SINGLE PUT -> FAIL", e.rawError?.message ?? e.message); }

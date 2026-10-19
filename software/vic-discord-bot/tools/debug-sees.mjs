import "dotenv/config";
import { REST } from "discord.js";
import { config } from "../src/config.js";
const rest = new REST({ version: "10" }).setToken(config.discord.token);
const roles = await rest.get(`/guilds/${config.discord.guildId}/roles`);
const chans = await rest.get(`/guilds/${config.discord.guildId}/channels`);
const members = await rest.get(`/guilds/${config.discord.guildId}/members?limit=100`);
const VIEW = 1024n;
const saami = members.find((m) => m.user.username === "saamisada");
const opsRole = roles.find((r) => r.name.includes("Director of Operations"));
console.log("saami roles:", saami.roles);
console.log("ops role id:", opsRole.id, "permissions:", opsRole.permissions);
console.log("ops is admin?:", (BigInt(opsRole.permissions) & 8n) !== 0n);

const ch = chans.find((c) => c.name === "operations-control");
console.log("\n#operations-control overwrites:");
for (const o of ch.permission_overwrites) {
  console.log(`  id=${o.id} type=${o.id === config.discord.guildId ? "EVERYONE" : "role"} allow=${o.allow} deny=${o.deny}`);
  console.log(`     member has this role? ${saami.roles.includes(o.id)}   VIEW in allow? ${(BigInt(o.allow) & VIEW) === VIEW}`);
}
let allow = 0n, deny = 0n;
const ev = ch.permission_overwrites.find((o) => o.id === config.discord.guildId);
if (ev) { allow |= BigInt(ev.allow); deny |= BigInt(ev.deny); }
for (const o of ch.permission_overwrites) {
  if (o.id === config.discord.guildId) continue;
  if (!saami.roles.includes(o.id)) continue;
  allow |= BigInt(o.allow); deny &= ~BigInt(o.deny);
}
console.log("\ncomputed allow:", allow.toString(), "deny:", deny.toString());
console.log("VIEW granted?", (allow & VIEW) === VIEW, " VIEW denied?", (deny & VIEW) === VIEW);

import "dotenv/config";
import { REST } from "discord.js";
import { config } from "../src/config.js";
const rest = new REST({ version: "10" }).setToken(config.discord.token);
const roles = await rest.get(`/guilds/${config.discord.guildId}/roles`);
const nameOf = new Map(roles.map((r) => [r.id, r.name]));
const chans = await rest.get(`/guilds/${config.discord.guildId}/channels`);
for (const n of ["operations-control", "cis", "welcome"]) {
  const ch = chans.find((c) => c.name === n);
  console.log(`\n#${n}  (${ch.permission_overwrites.length} overwrites)`);
  for (const o of ch.permission_overwrites) {
    const who = String(o.id) === config.discord.guildId ? "@everyone" : (nameOf.get(o.id) ?? o.id);
    console.log(`   ${String(who).padEnd(28)} allow=${o.allow.padStart(12)} deny=${o.deny}`);
  }
}
console.log("\nVIEW bit =", (1n << 10n).toString(), " STAFF allow would include it");

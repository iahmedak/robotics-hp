import "dotenv/config";
import { REST } from "discord.js";
import { config } from "../src/config.js";
const rest = new REST({ version: "10" }).setToken(config.discord.token);
const roles = await rest.get(`/guilds/${GID(config)}/roles`);
function GID(c) { return c.discord.guildId; }
const chans = await rest.get(`/guilds/${config.discord.guildId}/channels`);
const members = await rest.get(`/guilds/${config.discord.guildId}/members?limit=100`);
const cats = new Map(chans.filter((c) => c.type === 4).map((c) => [c.id, c.name]));
const posOf = new Map(roles.map((r) => [r.id, r.position]));
const VIEW = 1024n;
const adminRoles = roles.filter((r) => (BigInt(r.permissions) & 8n) !== 0n).map((r) => r.id);

// Discord resolution: start from @everyone, then apply each role the member
// holds in ASCENDING position, `&= ~deny; |= allow`. A role ALLOW therefore
// overrides an earlier DENY — which is why requiring the deny bit to be
// clear reports a member as unable to see a channel they can.
function sees(memberRoles, ch) {
  let p = 0n;
  const ovs = [...(ch.permission_overwrites ?? [])]
    .filter((o) => String(o.id) === config.discord.guildId || memberRoles.includes(o.id))
    .sort((a, b) => (posOf.get(a.id) ?? 0) - (posOf.get(b.id) ?? 0));
  for (const o of ovs) {
    p &= ~BigInt(o.deny);
    p |= BigInt(o.allow);
  }
  return (p & VIEW) === VIEW;
}

for (const m of members) {
  if (m.user.bot) continue;
  const isAdmin = m.roles.some((r) => adminRoles.includes(r));
  console.log(`\n${m.user.username}${isAdmin ? "  [Administrator role — bypasses overwrites]" : ""}`);
  if (isAdmin) { console.log("   sees everything by privilege, not by overwrite"); continue; }
  const seen = new Map();
  for (const c of chans.filter((x) => x.type !== 4)) {
    if (!sees(m.roles, c)) continue;
    const cat = cats.get(c.parent_id) ?? "?";
    seen.set(cat, (seen.get(cat) ?? 0) + 1);
  }
  console.log(`   sees ${seen.size} categories:`);
  for (const [cat, n] of seen) console.log(`     ${String(n).padStart(2)} ch  ${cat}`);
}

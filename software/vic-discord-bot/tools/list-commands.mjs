import "dotenv/config";
import { REST } from "discord.js";
import { config } from "../src/config.js";
const rest = new REST({ version: "10" }).setToken(config.discord.token);
const global = await rest.get(`/applications/${config.discord.clientId}/commands`);
const guild = await rest.get(`/applications/${config.discord.clientId}/guilds/${config.discord.guildId}/commands`);
console.log(`global commands: ${global.length}`);
console.log(`guild commands  : ${guild.length}`);
console.log(guild.map((c) => "  /" + c.name).sort().join("\n"));

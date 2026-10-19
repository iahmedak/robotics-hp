/**
 * Removes named mentors from the seeded embeds and replaces them with
 * role-based language, so the community still knows mentors exist without
 * publishing individuals' names publicly.
 *
 *   node src/redact-mentors.js
 *
 * Idempotent — safe to re-run. Also edits the source in seed.js so a
 * future reseed does not reintroduce the names.
 */

import 'dotenv/config';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Client, GatewayIntentBits } from 'discord.js';
import { config } from './config.js';

const NEEDLES = ['nuhail', 'damudi', 'danish gawai', 'danish'];

/** What replaces a name listing. */
const MENTORSHIP_ROLE_TEXT =
  'Mentorship is assigned through the 🎓 **Mentor** role. ' +
  'Members holding it are active in the community and can help — ' +
  'ask in your division channel or reach out through a mentor.';

const MENTORSHIPS_FIELD = {
  name: '🧭 Mentorship',
  value: MENTORSHIP_ROLE_TEXT,
  inline: false,
};

const MENTORS_FIELD = {
  name: 'Mentorship',
  value: 'Assigned via the 🎓 Mentor role',
  inline: true,
};

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

function scrub(text) {
  if (!text) return text;
  let out = text;
  out = out.replace(/\*\*Mr\.?\s*Nuhail\s*Damudi\*\*\s*[—–-]\s*Founding Mentor/gi, '');
  out = out.replace(/\*\*Danish\s*Gawai\s*Sir?\*\*\s*[—–-]\s*Technical Mentor/gi, '');
  out = out.replace(/Mr\.?\s*Nuhail\s*Damudi\s*[·•]\s*Danish\s*Gawai\s*Sir?/gi, '');
  out = out.replace(/Mr\.?\s*Nuhail\s*Damudi/gi, 'the founding mentor');
  out = out.replace(/Danish\s*Gawai\s*Sir?/gi, 'the technical mentor');
  out = out.replace(/\n{3,}/g, '\n\n');
  return out.trim();
}

client.once('clientReady', async () => {
  const guild = client.guilds.cache.get(config.discord.guildId);
  const channels = await guild.channels.fetch();

  let edited = 0, checked = 0;

  for (const ch of channels.values()) {
    if (ch.type !== 0 && ch.type !== 15) continue;
    let msgs;
    try { msgs = await ch.messages.fetch({ limit: 100 }); } catch { continue; }

    for (const m of msgs.values()) {
      const embeds = m.embeds ?? [];
      const rawHay = [m.content ?? '', ...embeds.map((e) => JSON.stringify(e.data ?? e))].join(' ');
      if (!NEEDLES.some((n) => rawHay.toLowerCase().includes(n))) continue;

      checked++;
      const newEmbeds = (m.embeds.length ? m.embeds.map((e) => JSON.parse(JSON.stringify(e.data ?? e))) : []);
      for (const e of newEmbeds) {
        e.title = scrub(e.title);
        e.description = scrub(e.description);
        if (e.fields?.length) {
          e.fields = e.fields.map((f) => {
            const v = scrub(f.value);
            // Swap name-based mentor fields for role-based ones.
            if (/nuhail|damudi|danish|gawai/i.test(f.value ?? '')) {
              return f.name.includes('Mentorship')
                ? MENTORSHIP_ROLE_TEXT.includes('') ? MENTORSHIPS_FIELD : MENTORSHIPS_FIELD
                : MENTORS_FIELD;
            }
            return { ...f, value: v };
          });
        }
        if (e.footer?.text) e.footer.text = scrub(e.footer.text);
      }

      await m.edit({ embeds: newEmbeds, content: m.content || undefined }).catch((err) => {
        console.log(`   ! #${ch.name} → ${err.message}`);
      });
      edited++;
      console.log(`   ✓ #${ch.name} — mentor names removed`);
    }
  }

  // Purge the names from the seed source so a reseed can't bring them back.
  const seedPath = join(process.cwd(), 'src', 'seed.js');
  try {
    let src = await readFile(seedPath, 'utf8');
    const before = src;
    src = src.replace(
      /\{ name: '🧭 Mentorship', value: '[^']*', inline: false \}/,
      `{ name: '🧭 Mentorship', value: '${MENTORSHIP_ROLE_TEXT.replace(/'/g, "\\'")}', inline: false }`
    );
    src = src.replace(
      /\{ name: 'Mentors', value: '[^']*', inline: true \}/,
      `{ name: 'Mentorship', value: 'Assigned via the 🎓 Mentor role', inline: true }`
    );
    if (src !== before) {
      await writeFile(seedPath, src, 'utf8');
      console.log('   ✓ src/seed.js updated — reseeds will not reintroduce the names');
    }
  } catch (err) {
    console.log('   ! could not update seed.js:', err.message);
  }

  console.log(`\n   ${edited} message(s) edited, ${checked} matched\n`);
  client.destroy();
  process.exit(0);
});

client.login(config.discord.token).catch((e) => {
  console.error('❌ login failed:', e.message);
  process.exit(1);
});
/**
 * Welcomer — greets new members in #welcome and DMs them the verification path.
 *
 * Fires on guildMemberAdd. Skipped for bots, for re-joins within 24h, and
 * while the server is panic-locked (a raid is not the moment for greetings).
 *
 * Builders are pure (plain data in, embed JSON out) so they are unit tested
 * without a Discord connection. See test/welcome.test.js.
 */

const VIC = 0x1f6feb;
const WELCOME_CHANNEL = 'welcome';
const DEDUPE_WINDOW_MS = 24 * 60 * 60 * 1000;

// userId -> timestamp of last welcome. In-memory by design: a restart may
// re-welcome someone, which is harmless; persistence would be over-engineering.
const welcomed = new Map();

/** True the first time a user joins (or after 24h), false on rapid re-join. */
export function shouldWelcome(userId, now = Date.now()) {
  const last = welcomed.get(userId);
  if (last !== undefined && now - last < DEDUPE_WINDOW_MS) return false;
  welcomed.set(userId, now);
  return true;
}

/** Public greeting posted in #welcome. Tags the new member. */
export function buildWelcomeEmbed({ userId, guildName }) {
  return {
    embeds: [
      {
        color: VIC,
        title: `👋 Welcome to ${guildName}, <@${userId}>!`,
        description:
          '**VIC** is the innovation community of **Team 007** — students building ' +
          'real hardware, real software, and real robots out of Bhatkal.\n\n' +
          "You're not verified yet. Three steps and you're in:",
        fields: [
          {
            name: '1 · Read the rules',
            value: 'Start with `#rules`. Ten rules, all short, all enforced.',
            inline: false,
          },
          {
            name: '2 · Apply',
            value:
              'Fill the form at **vic-official.pages.dev**.\n' +
              '⚠️ The Discord username on your form must match this account exactly, ' +
              'or approval will fail.',
            inline: false,
          },
          {
            name: '3 · Wait for a moderator',
            value:
              'A moderator reviews your application, usually within a day. ' +
              "On approval you get the `✅ Member` badge, your division role, and a DM " +
              'with your permanent **VIC ID**.',
            inline: false,
          },
          {
            name: '🧩 Our divisions',
            value: '⚙️ ERS · 💻 CIS · 📣 EWO · 🛠️ OAD',
            inline: true,
          },
          {
            name: '🧭 Mentors',
            value: 'Members with the 🎓 Mentor role. Ask in your division channel.',
            inline: true,
          },
        ],
        footer: { text: 'VoltEdge Innovation Community · Team 007' },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/** Private DM — the verification path, since they can't see much yet. */
export function buildJoinDM({ username }) {
  return {
    embeds: [
      {
        color: VIC,
        title: `👋 Hi ${username ?? 'there'} — welcome to VIC`,
        description:
          'You just joined the **VoltEdge Innovation Community** server. ' +
          "Here's your path to full access:",
        fields: [
          {
            name: 'Apply',
            value: 'vic-official.pages.dev — use this exact Discord username on the form.',
            inline: false,
          },
          {
            name: 'Wait',
            value: 'A moderator reviews it, usually within a day.',
            inline: false,
          },
          {
            name: 'Get verified',
            value: 'Approval unlocks every channel and sends you your **VIC ID** (`APP-2026-XXXXXX`). Keep it — it\'s permanent.',
            inline: false,
          },
        ],
        footer: { text: 'Questions? Reply here — a moderator reads these.' },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Wire the listener. Call once the client is ready.
 * @param {object} opts
 * @param {string} opts.guildId
 * @param {string} [opts.applicantRoleId] — auto-granted on join so every
 *   new joiner can read #member-verification and wears a visible badge
 * @param {() => boolean} [opts.isLocked] — skip welcomes while locked
 */
export function attachWelcomer(client, { guildId, applicantRoleId = null, isLocked = () => false }) {
  client.on('guildMemberAdd', async (member) => {
    try {
      if (member.guild.id !== guildId) return;
      if (member.user.bot) return; // bots get no greeting
      if (isLocked()) return; // raid in progress — stay quiet
      if (!shouldWelcome(member.id)) return; // rapid re-join

      const guild = member.guild;

      // Grant ⏳ Applicant first so the gated #member-verification channel
      // is readable even if the rest of the send fails.
      if (applicantRoleId) {
        try {
          await member.roles.add(applicantRoleId, 'auto-granted on join');
        } catch (err) {
          console.error('[welcomer] could not grant applicant role:', err.message);
        }
      }

      const channel = guild.channels.cache.find((c) => c.name === WELCOME_CHANNEL);
      if (channel?.isTextBased()) {
        await channel.send(buildWelcomeEmbed({ userId: member.id, guildName: guild.name }));
      }

      try {
        await member.send(buildJoinDM({ username: member.user.username }));
      } catch {
        /* DMs closed — the public greeting still landed */
      }
    } catch (err) {
      console.error('[welcomer]', err.message);
    }
  });
}
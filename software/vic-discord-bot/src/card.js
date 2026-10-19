/**
 * Builds the Discord embeds for the review card and the applicant DM.
 * Pure functions — no Discord client, no Supabase. Easy to unit test.
 */

const EMOJI = {
  pending: '⏳',
  approved: '✅',
  rejected: '❌',
  id: '🆔',
  division: '🧭',
  discord: '👤',
  email: '📧',
  skills: '🛠️',
  interests: '💡',
  when: '🕒',
};

const COLORS = {
  pending: 0xf39c12,
  approved: 0x2ecc71,
  rejected: 0xe74c3c,
};

/** Normalise a Supabase value into a clean display list. */
function toList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (typeof value === 'string') {
    // Handles Postgres array literal "{a,b}" and JSON-ish "[a,b]".
    const trimmed = value.trim().replace(/^[[{]/, '').replace(/[\]}]$/, '');
    if (!trimmed) return [];
    return trimmed
      .split(/[,;]/)
      .map((s) => s.trim().replace(/^"|"$/g, ''))
      .filter(Boolean);
  }
  return [String(value)];
}

/** The card staff see in #applications-review. */
export function buildReviewCard(app, divisionName) {
  const skills = toList(app.skills);
  const interests = toList(app.interests);
  // Discord caps a field value at 1024 chars; motivation essays run long.
  const clip = (s, n = 900) => {
    const t = String(s ?? '').trim();
    return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
  };

  const fields = [
    { name: `${EMOJI.id} VIC ID`, value: `\`${app.id ?? 'unknown'}\``, inline: true },
    { name: `${EMOJI.division} Division`, value: divisionName || 'Unassigned', inline: true },
    { name: `${EMOJI.discord} Discord`, value: app.discord_username || '_not supplied_', inline: true },
    { name: `${EMOJI.email} Email`, value: app.email || '_not supplied_', inline: true },
    {
      name: `${EMOJI.skills} Skills`,
      value: skills.length ? skills.join(', ') : '_none listed_',
      inline: false,
    },
    {
      name: `${EMOJI.interests} Interests`,
      value: interests.length ? interests.join(', ') : '_none listed_',
      inline: false,
    },
    // Motivation + experience are the actual review signal — the form
    // collects them as free text (ApplicationWizard), so show them.
    ...(app.motivation?.trim()
      ? [{ name: '💬 Why they want in', value: clip(app.motivation), inline: false }]
      : []),
    ...(app.experience?.trim()
      ? [{ name: '🧰 Experience', value: clip(app.experience, 500), inline: false }]
      : []),
  ];

  return {
    embeds: [
      {
        title: `${EMOJI.pending} New application — ${app.full_name ?? 'Unnamed applicant'}`,
        description:
          'A moderator must approve or reject this. ' +
          'Approving grants `✅ Member` plus the correct divisional role.',
        color: COLORS.pending,
        fields,
        footer: { text: `VIC · Application ${app.id ?? '?'}` },
        timestamp: new Date().toISOString(),
      },
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 2, // green
            label: 'Approve',
            custom_id: `vic:approve:${app.id}`,
          },
          {
            type: 2,
            style: 4, // red
            label: 'Reject',
            custom_id: `vic:reject:${app.id}`,
          },
        ],
      },
    ],
  };
}

/** The confirmation DM the applicant receives on approval. */
export function buildApprovedDM(app, divisionName, memberCode) {
  const skills = toList(app.skills);

  return {
    embeds: [
      {
        title: `${EMOJI.approved} Welcome to VoltEdge Innovation Community, ${app.full_name ?? 'friend'}!`,
        description:
          `Your application has been **approved** by a moderator.\n\n` +
          `You now have access to all member and divisional channels.`,
        color: COLORS.approved,
        fields: [
          { name: `${EMOJI.id} Your VIC ID`, value: `\`${memberCode ?? app.id ?? '—'}\``, inline: true },
          { name: `${EMOJI.division} Your division`, value: divisionName || 'Unassigned', inline: true },
          {
            name: 'What you just unlocked',
            value:
              '✅ Verified member badge\n' +
              '🧭 Your divisional channels\n' +
              '🗣️ #introductions — say hi\n' +
              '📅 #events — workshops and meetups',
            inline: false,
          },
          ...(skills.length
            ? [{ name: `${EMOJI.skills} Skills on your profile`, value: skills.join(', '), inline: false }]
            : []),
        ],
        footer: { text: 'VIC · VoltEdge Innovation Community · Team 007' },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/** The DM the applicant receives on rejection. */
export function buildRejectedDM(app, reason) {
  return {
    embeds: [
      {
        title: `${EMOJI.rejected} Update on your VIC application`,
        description:
          `Hi ${app.full_name ?? 'there'},\n\n` +
          `Thank you for applying to the VoltEdge Innovation Community. ` +
          `After review, we are unable to approve your application at this time.`,
        color: COLORS.rejected,
        fields: [
          { name: `${EMOJI.id} Your VIC ID`, value: `\`${app.id ?? '—'}\``, inline: true },
          {
            name: 'Reason',
            value: reason || 'No specific reason was provided.',
            inline: false,
          },
          {
            name: 'What now',
            value:
              'You are welcome to reapply in a future intake. ' +
              'Keep an eye on https://vic-official.pages.dev/ for the next round.',
            inline: false,
          },
        ],
        footer: { text: 'VIC · VoltEdge Innovation Community · Team 007' },
        timestamp: new Date().toISOString(),
      },
    ],
  };
}

/** Audit line written to #mod-log. */
export function buildAuditEntry({ action, app, moderator, divisionName, extra }) {
  const icon = action === 'APPROVE' ? EMOJI.approved : EMOJI.rejected;
  const parts = [
    `**${icon} ${action}**`,
    `**Applicant:** ${app.full_name ?? '—'}`,
    `**VIC ID:** \`${app.id ?? '—'}\``,
    `**Division:** ${divisionName || 'Unassigned'}`,
    `**Moderator:** <@${moderator}>`,
  ];
  if (extra) parts.push(`**Notes:** ${extra}`);
  return `${parts.join('  ·  ')}`;
}
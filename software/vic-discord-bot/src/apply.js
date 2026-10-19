/**
 * Ticket intake — the application modal a member fills.
 *
 * Runs entirely in Discord. No Supabase, no website round-trip. The
 * applicant's Discord username is taken from their account object, never
 * typed, so the identity-binding problem the Supabase flow had simply
 * does not exist here.
 */

import {
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
} from 'discord.js';

/** Show the application modal. Input limits mirror the public site. */
export function showApplyModal(interaction, { divisions }) {
  const modal = new ModalBuilder()
    .setCustomId('vic:apply')
    .setTitle('VoltEdge Innovation Community — Application');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('fullName')
        .setLabel('Full name')
        .setPlaceholder('As it should appear on your VIC ID')
        .setStyle(TextInputStyle.Short)
        .setMaxLength(100)
        .setRequired(true)
    )
  );

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('email')
        .setLabel('Email')
        .setPlaceholder('you@example.com')
        .setStyle(TextInputStyle.Email)
        .setMaxLength(120)
        .setRequired(true)
    )
  );

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('skills')
        .setLabel('Skills')
        .setPlaceholder('Python, ROS, soldering, CAD…')
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(1000)
        .setRequired(true)
    )
  );

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('motivation')
        .setLabel('Why do you want to join?')
        .setStyle(TextInputStyle.Paragraph)
        .setMaxLength(1500)
        .setRequired(true)
    )
  );

// One select per modal is allowed; divisions are the only true enum.
  // Free text rather than a select so a member can enter TWO codes at once.
  const divisionInput = new TextInputBuilder()
    .setCustomId('division')
    .setLabel('Division(s)')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(40)
    .setRequired(true);
  modal.addComponents(new ActionRowBuilder().addComponents(divisionInput));

  return interaction.showModal(modal);
}

/** Pure validator for a submitted modal. Returns { ok, data } or { ok:false, errors }. */
export function validateApplyFields({ fullName, email, skills, motivation, division, divisions }) {
  const errors = [];
  const clean = (v) => String(v ?? '').trim();

  const name = clean(fullName);
  if (name.length < 2) errors.push('name must be at least 2 characters');
  if (name.length > 100) errors.push('name is too long');

  const mail = clean(email);
  // Deliberately permissive: the real test is a DM later.
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(mail)) errors.push('that email does not look valid');

  const sk = clean(skills);
  if (!sk) errors.push('skills cannot be empty');

  const mot = clean(motivation);
  if (mot.length < 10) errors.push('please write at least a sentence about why you want to join');

  let div = clean(division);
  // Members may sit in up to two divisions (their choice is honoured and both
  // roles are granted), so accept a comma-separated list of division codes.
  let divisionIds = [];
  if (div) {
    const parts = div.split(/[,/\s]+/).map((s) => s.trim().toUpperCase()).filter(Boolean);
    for (const part of parts) {
      const match = divisions.find((d) => d.id.toUpperCase() === part);
      if (!match) { errors.push(`"${part}" is not a valid division — use e.g. VIC-DIV-002`); continue; }
      if (!divisionIds.includes(match.id)) divisionIds.push(match.id);
    }
    if (divisionIds.length > 2) errors.push('pick at most two divisions (comma-separated)');
    if (parts.length > 2) errors.push('pick at most two divisions (comma-separated)');
  }
  if (divisions.length && !divisionIds.length && !errors.length) {
    errors.push('please pick a division — use e.g. VIC-DIV-002');
  }

  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      fullName: name, email: mail, skills: sk, motivation: mot,
      divisionIds,
      divisionId: divisionIds[0], // primary, kept for backwards compatibility
    },
  };
}

/** Members may apply; staff and bots may not. */
export function canApply(member) {
  if (!member || member.user?.bot) return false;
  if (member.permissions?.has(PermissionFlagsBits.Administrator)) return false;
  if (member.permissions?.has(PermissionFlagsBits.ManageMessages)) return false;
  return true;
}
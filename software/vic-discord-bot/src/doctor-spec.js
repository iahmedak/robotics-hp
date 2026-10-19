/**
 * Channel list mirrored from provision.js, used by doctor.js so the
 * diagnostic knows which channels are "core". Kept deliberately small —
 * it lists names, not permissions.
 */
export const CHANNEL_SPEC_FOR_DOCTOR = [
  'welcome', 'rules', 'how-to-join', 'server-info', 'faq',
  'rules-screening-help', 'introductions',
  'ers', 'cis', 'ewo', 'oad',
  'project-rooms', 'code-review', 'hardware-lab',
  'general', 'events', 'opportunities', 'memes',
  'build-logs', 'media', 'workshops', 'competition-war-room',
  'help-desk', 'code-help', 'hardware-help',
  'project-showcase', 'suggestions', 'opportunities-forum', 'looking-for-team',
];
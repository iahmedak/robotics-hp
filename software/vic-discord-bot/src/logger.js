/**
 * Audit log to #mod-log + in-memory moderation action tracker.
 * Everything a moderator does lands here permanently.
 */

const actionLog = []; // { userId, ts }
let modLogChannelId = null;

export function setModLogChannel(id) {
  modLogChannelId = id;
}

/**
 * Rate limit: cap how many approve/reject actions one user may take
 * in a sliding window. Prevents a compromised or bored moderator
 * from mass-approving in seconds.
 */
export function isRateLimited(userId, { limit, windowMs }) {
  const now = Date.now();
  // Drop entries outside the window.
  while (actionLog.length && now - actionLog[0].ts > windowMs) actionLog.shift();

  const mine = actionLog.filter((e) => e.userId === userId).length;
  return mine >= limit;
}

export function recordAction(userId) {
  actionLog.push({ userId, ts: Date.now() });
}

/** Post a line to the audit channel, swallowing errors. */
export async function audit(client, message) {
  if (!modLogChannelId) return;
  try {
    const ch = await client.channels.fetch(modLogChannelId);
    if (ch && ch.isTextBased()) {
      await ch.send({ content: message });
    }
  } catch (err) {
    console.error('[audit] failed to write mod-log:', err.message);
  }
}
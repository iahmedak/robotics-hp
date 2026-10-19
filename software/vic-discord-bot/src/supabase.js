import { createClient } from '@supabase/supabase-js';
import { config, hasSupabase } from './config.js';

/**
 * Supabase access layer.
 *
 * Security boundary: we use the service_role key ONLY here, server-side.
 * It bypasses RLS, so every query is written defensively:
 *   - `.select()` never runs without an explicit column list, so we can
 *     not leak columns we did not intend to touch.
 *   - status transitions are explicit, never derived from client input.
 */

let client = null;

function getClient() {
  if (!hasSupabase) {
    throw new Error(
      'Supabase is not configured.\n' +
      '  Add to vic-discord-bot/.env:\n' +
      '    SUPABASE_URL=https://xfxowxclixfpkqgqaeyw.supabase.co\n' +
      '    SUPABASE_SERVICE_ROLE_KEY=<the service_role key>\n' +
      '  Find the key at Supabase -> Project Settings -> API -> service_role.\n' +
      '  Run sql/001_hardening.sql BEFORE using it.'
    );
  }
  if (!client) {
    client = createClient(config.supabase.url, config.supabase.serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

/**
 * Column inventory — ground truth from the VIC site source
 * (vic-public-portal/src/backend/vicSupabase.ts :: submitVicApplication
 *  and contexts/AppContext.tsx :: submitApplicationToD1, both of which
 *  insert the identical column set). Only these columns are guaranteed
 *  to exist. In particular there is NO submitted_at / reviewed_at /
 *  reviewed_by / rejection_reason in the site's insert set — selecting or
 *  updating them unconditionally would 400 the moment the table lacks
 *  them, so reads use this list and writes fall back to status-only.
 */
const APPLICATION_COLUMNS =
  'id, full_name, email, phone, whatsapp, division_id, education, ' +
  'skills, experience, motivation, additional_info, institution, course, ' +
  'year_semester, city, gender, portfolio_url, github_url, linkedin_url, ' +
  'discord_username, interests, status';

/** True when a PostgREST error means "that column does not exist". */
function isMissingColumn(error) {
  if (!error) return false;
  // 42703 undefined_column, PGRST204 embedded-column-missing
  return error.code === '42703' || error.code === 'PGRST204' ||
    /column .* does not exist/i.test(error.message ?? '');
}

/**
 * Run an update, first with audit fields then — if the table lacks them —
 * with status only. The status flip is the load-bearing write; the audit
 * fields are nice-to-have (the real audit trail is #mod-log).
 */
async function resilientUpdate(id, status, audit) {
  const sb = getClient();
  const full = { status, ...audit };
  const attempt = async (body) =>
    sb.from('applications').update(body).eq('id', id).eq('status', PENDING_STATUS);

  let { error } = await attempt(full);
  if (error && isMissingColumn(error)) {
    console.warn(`[supabase] audit columns absent, falling back to status-only update for ${id}`);
    ({ error } = await attempt({ status }));
  }
  if (error) throw new Error(`Failed to set ${id} → ${status}: ${error.message}`);
  return true;
}

/** Statuses we treat as "needs a moderator decision". */
export const PENDING_STATUS = 'PENDING';

/**
 * Fetch applications awaiting review that we have not surfaced yet.
 * `excludeIds` prevents re-posting a card after a restart.
 */
export async function fetchPendingApplications(excludeIds = []) {
  const sb = getClient();

  let query = sb
    .from('applications')
    .select(APPLICATION_COLUMNS)
    .eq('status', PENDING_STATUS)
    .order('id', { ascending: true }) // ref ids are time-ordered; no submitted_at column exists
    .limit(25);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch pending applications: ${error.message}`);

  const excluded = new Set(excludeIds);
  return (data ?? []).filter((row) => !excluded.has(row.id));
}

/** Fetch a single application by its VIC reference id. */
export async function getApplicationById(id) {
  const sb = getClient();
  const { data, error } = await sb
    .from('applications')
    .select(APPLICATION_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(`Failed to read application ${id}: ${error.message}`);
  return data ?? null;
}

/**
 * Mark an application APPROVED.
 * Only `service_role` may perform this; anon must NOT be able to.
 */
export async function markApproved(id, reviewerDiscordId) {
  return resilientUpdate(id, 'APPROVED', {
    reviewed_at: new Date().toISOString(),
    reviewed_by: reviewerDiscordId,
    rejection_reason: null,
  });
}

/** Mark an application REJECTED with a reason shown to the applicant. */
export async function markRejected(id, reviewerDiscordId, reason) {
  return resilientUpdate(id, 'REJECTED', {
    reviewed_at: new Date().toISOString(),
    reviewed_by: reviewerDiscordId,
    rejection_reason: reason ?? null,
  });
}

/** Resolve a division id to a human-readable name from the divisions table. */
export async function getDivisionName(divisionId) {
  if (!divisionId) return 'Unassigned';
  const sb = getClient();
  const { data, error } = await sb
    .from('divisions')
    .select('name')
    .eq('id', divisionId)
    .maybeSingle();

  if (error) return 'Unassigned';
  return data?.name ?? 'Unassigned';
}

export const supabaseConfigured = hasSupabase;
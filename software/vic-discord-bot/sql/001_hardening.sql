-- ============================================================
-- VIC — Supabase RLS hardening
-- Project: xfxowxclixfpkqgqaeyw
--
-- WHY THIS EXISTS
--   The VIC site is a static React SPA. Its VITE_SUPABASE_ANON_KEY
--   ships inside the public JS bundle. That means *anyone* can read
--   the anon key from view-source and use it against the REST API.
--
--   RLS is therefore the ONLY thing standing between the public and
--   your applications table. If anon has UPDATE on `applications`,
--   anyone can set their own row to status='APPROVED' and walk
--   straight into the member channels.
--
--   This script locks `applications` down to:
--     anon        -> INSERT only (submit an application)
--     service_role-> full control (our bot reads + transitions)
--     authenticated -> nothing (there are no user accounts today)
--
-- HOW TO RUN
--   Supabase Dashboard -> SQL Editor -> New query -> paste -> Run.
--   Run it once. It is idempotent.
-- ============================================================

begin;

-- ---------------------------------------------------------
-- 1. Make sure RLS is on (it may already be).
-- ---------------------------------------------------------
alter table public.applications enable row level security;
alter table public.divisions    enable row level security;
alter table public.app_settings enable row level security;

-- Force RLS even for the table owner, so nobody can "helpfully"
-- bypass it by connecting as a different role.
alter table public.applications force row level security;

-- ---------------------------------------------------------
-- 2. Drop every existing policy on applications.
--    We rebuild from scratch so we know exactly what exists.
-- ---------------------------------------------------------
do $$
declare
  p record;
begin
  for p in select policyname from pg_policies
            where schemaname = 'public' and tablename = 'applications'
  loop
    execute format('drop policy if exists %I on public.applications', p.policyname);
  end loop;
end $$;

-- ---------------------------------------------------------
-- 3. The only rule the public gets: submit an application.
--    No SELECT. No UPDATE. No DELETE. Ever.
-- ---------------------------------------------------------
create policy "anon may submit applications"
  on public.applications
  for insert
  to anon
  with check (
    -- A submission must start life as PENDING. A visitor cannot
    -- smuggle in a pre-approved row.
    status = 'PENDING'
    -- And it must actually carry an applicant.
    and full_name is not null
    and length(btrim(full_name)) > 0
    and email is not null
    and length(btrim(email)) > 0
  );

-- ---------------------------------------------------------
-- 4. Divisions is public reference data (names, ids, blurbs).
--    Reading it is harmless and the site needs it to render.
-- ---------------------------------------------------------
do $$
declare
  p record;
begin
  for p in select policyname from pg_policies
            where schemaname = 'public' and tablename = 'divisions'
  loop
    execute format('drop policy if exists %I on public.divisions', p.policyname);
  end loop;
end $$;

create policy "anon may read divisions"
  on public.divisions
  for select
  to anon
  using (true);

-- ---------------------------------------------------------
-- 5. app_settings: public reads only if you intend the site to
--    read it. Flip to false if it holds anything private.
-- ---------------------------------------------------------
do $$
declare
  p record;
begin
  for p in select policyname from pg_policies
            where schemaname = 'public' and tablename = 'app_settings'
  loop
    execute format('drop policy if exists %I on public.app_settings', p.policyname);
  end loop;
end $$;

create policy "anon may read app_settings"
  on public.app_settings
  for select
  to anon
  using (true);

commit;

-- ============================================================
-- 6. VERIFY (run these after, as a read-only check)
-- ============================================================

-- Expected: exactly one row, policy "anon may submit applications",
-- cmd 'INSERT'. Anything with cmd UPDATE or DELETE is a hole.
--
-- select policyname, cmd, roles, qual, with_check
--   from pg_policies
--  where schemaname = 'public' and tablename = 'applications';


-- ============================================================
-- 7. CLOSING THE SPLIT-READ PROBLEM
--
--    RLS does not block the *anon* key from INSERTing a row and then
--    reading it back, because Postgres returns the inserted row to the
--    writer. That is normal and fine.
--
--    The real risk is SELECT on *other people's* rows. The policy above
--    grants no SELECT to anon at all, so the endpoint returns empty
--    for any anon read. If your site's "my application status" lookup
--    breaks as a result, do NOT add a blanket SELECT policy. Instead
--    add a narrowly-scoped policy keyed on a per-applicant token:
--
--      create policy "applicant may read own application"
--        on public.applications
--        for select
--        to anon
--        using (public_token = current_setting('request.headers')::json->>'x-vic-token');
--
--    ...but only if `public_token` exists and is unguessable. If you
--    do not have that column, leave reads disabled and have the bot
--    DM status instead.
-- ============================================================
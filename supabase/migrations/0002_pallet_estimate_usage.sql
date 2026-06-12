-- SceneBox - pallet estimate / step 3 abuse-prevention migration
-- PRD: docs/scenebox_pallet_feature_PRD.md section 4 (daily call gate before Gemini)
--
-- Run manually in the Supabase Dashboard SQL Editor (no Supabase CLI in this project).
-- All reads/writes go through server routes with the service-role key (bypasses RLS),
-- so RLS is enabled but no public policy is added. (Same convention as 0001.)

-- 1) Table: pallet_estimate_usage  (call count per identity x day)
--    identity examples: user:<uuid> (login) / uid:<cookie> (anon) / ip:<sha256> (backstop)
--    day is the KST (UTC+9) date computed by the server.
create table if not exists public.pallet_estimate_usage (
  identity text not null,
  day      date not null,
  count    int  not null default 0,
  primary key (identity, day)
);

-- 2) Atomic increment + limit gate function.
--    Single statement (insert .. on conflict .. where) so concurrent calls are race-free.
--      - new identity      -> returns 1            (allowed)
--      - under the limit    -> returns new count    (allowed)
--      - at the limit       -> where is false, no update, no row returned (blocked)
--    Caller rule: a row returned = allowed, NULL/none = blocked.
create or replace function public.increment_pallet_usage(
  p_identity text,
  p_day      date,
  p_limit    int
)
returns int
language sql
security definer
set search_path = public
as $$
  insert into public.pallet_estimate_usage as u (identity, day, count)
  values (p_identity, p_day, 1)
  on conflict (identity, day)
  do update set count = u.count + 1
  where u.count < p_limit
  returning u.count;
$$;

-- 3) RLS: enabled with no public policy -> not reachable with anon/authenticated keys.
--    All access is via the service-role server routes only.
alter table public.pallet_estimate_usage enable row level security;

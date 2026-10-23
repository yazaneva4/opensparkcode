-- OpenSparkcode account sync. Run only in a dedicated OpenSparkcode Supabase project.
-- Client-facing tables contain session history and non-secret preferences only.
create table if not exists public.opensparkcode_sessions (
  user_id uuid not null references auth.users(id) on delete cascade,
  session_id text not null check (char_length(session_id) between 1 and 128),
  session_data jsonb not null check (jsonb_typeof(session_data) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (user_id, session_id)
);
create table if not exists public.opensparkcode_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferences jsonb not null default '{}'::jsonb check (jsonb_typeof(preferences) = 'object'),
  updated_at timestamptz not null default now()
);
alter table public.opensparkcode_sessions enable row level security;
alter table public.opensparkcode_preferences enable row level security;
revoke all on table public.opensparkcode_sessions from public, anon;
revoke all on table public.opensparkcode_preferences from public, anon;
grant select, insert, update, delete on table public.opensparkcode_sessions to authenticated;
grant select, insert, update, delete on table public.opensparkcode_preferences to authenticated;

drop policy if exists "OpenSparkcode users read their sessions" on public.opensparkcode_sessions;
create policy "OpenSparkcode users read their sessions" on public.opensparkcode_sessions
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "OpenSparkcode users insert their sessions" on public.opensparkcode_sessions;
create policy "OpenSparkcode users insert their sessions" on public.opensparkcode_sessions
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "OpenSparkcode users update their sessions" on public.opensparkcode_sessions;
create policy "OpenSparkcode users update their sessions" on public.opensparkcode_sessions
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "OpenSparkcode users delete their sessions" on public.opensparkcode_sessions;
create policy "OpenSparkcode users delete their sessions" on public.opensparkcode_sessions
  for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "OpenSparkcode users read their preferences" on public.opensparkcode_preferences;
create policy "OpenSparkcode users read their preferences" on public.opensparkcode_preferences
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "OpenSparkcode users insert their preferences" on public.opensparkcode_preferences;
create policy "OpenSparkcode users insert their preferences" on public.opensparkcode_preferences
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "OpenSparkcode users update their preferences" on public.opensparkcode_preferences;
create policy "OpenSparkcode users update their preferences" on public.opensparkcode_preferences
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "OpenSparkcode users delete their preferences" on public.opensparkcode_preferences;
create policy "OpenSparkcode users delete their preferences" on public.opensparkcode_preferences
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Phase 1 Track 3: RLS + ownership enforcement
-- Scope: users, runs, observatory_summaries, prompt_state, subscription_state

-- Track 3 additions for migration/idempotency helpers on runs.
alter table public.runs add column if not exists migration_fingerprint text;
alter table public.runs add column if not exists client_run_id text;
alter table public.runs add column if not exists word_count integer;
alter table public.runs add column if not exists migration_source text;
alter table public.runs add column if not exists migrated_at timestamptz;
alter table public.runs add column if not exists migration_batch_id text;

create index if not exists runs_user_id_migration_fingerprint_idx
  on public.runs(user_id, migration_fingerprint)
  where migration_fingerprint is not null;

-- Enable RLS on all user-owned tables.
alter table public.users enable row level security;
alter table public.runs enable row level security;
alter table public.observatory_summaries enable row level security;
alter table public.prompt_state enable row level security;
alter table public.subscription_state enable row level security;

-- USERS policies (id maps to auth.users.id)
drop policy if exists users_select_own on public.users;
create policy users_select_own
  on public.users
  for select
  using (id = auth.uid());

drop policy if exists users_insert_own on public.users;
create policy users_insert_own
  on public.users
  for insert
  with check (id = auth.uid());

drop policy if exists users_update_own on public.users;
create policy users_update_own
  on public.users
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists users_delete_own on public.users;
create policy users_delete_own
  on public.users
  for delete
  using (id = auth.uid());

-- RUNS policies
drop policy if exists runs_select_own on public.runs;
create policy runs_select_own
  on public.runs
  for select
  using (user_id = auth.uid());

drop policy if exists runs_insert_own on public.runs;
create policy runs_insert_own
  on public.runs
  for insert
  with check (user_id = auth.uid());

drop policy if exists runs_update_own on public.runs;
create policy runs_update_own
  on public.runs
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists runs_delete_own on public.runs;
create policy runs_delete_own
  on public.runs
  for delete
  using (user_id = auth.uid());

-- OBSERVATORY_SUMMARIES policies
drop policy if exists observatory_summaries_select_own on public.observatory_summaries;
create policy observatory_summaries_select_own
  on public.observatory_summaries
  for select
  using (user_id = auth.uid());

drop policy if exists observatory_summaries_insert_own on public.observatory_summaries;
create policy observatory_summaries_insert_own
  on public.observatory_summaries
  for insert
  with check (user_id = auth.uid());

drop policy if exists observatory_summaries_update_own on public.observatory_summaries;
create policy observatory_summaries_update_own
  on public.observatory_summaries
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists observatory_summaries_delete_own on public.observatory_summaries;
create policy observatory_summaries_delete_own
  on public.observatory_summaries
  for delete
  using (user_id = auth.uid());

-- PROMPT_STATE policies
drop policy if exists prompt_state_select_own on public.prompt_state;
create policy prompt_state_select_own
  on public.prompt_state
  for select
  using (user_id = auth.uid());

drop policy if exists prompt_state_insert_own on public.prompt_state;
create policy prompt_state_insert_own
  on public.prompt_state
  for insert
  with check (user_id = auth.uid());

drop policy if exists prompt_state_update_own on public.prompt_state;
create policy prompt_state_update_own
  on public.prompt_state
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists prompt_state_delete_own on public.prompt_state;
create policy prompt_state_delete_own
  on public.prompt_state
  for delete
  using (user_id = auth.uid());

-- SUBSCRIPTION_STATE policies
drop policy if exists subscription_state_select_own on public.subscription_state;
create policy subscription_state_select_own
  on public.subscription_state
  for select
  using (user_id = auth.uid());

drop policy if exists subscription_state_insert_own on public.subscription_state;
create policy subscription_state_insert_own
  on public.subscription_state
  for insert
  with check (user_id = auth.uid());

drop policy if exists subscription_state_update_own on public.subscription_state;
create policy subscription_state_update_own
  on public.subscription_state
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists subscription_state_delete_own on public.subscription_state;
create policy subscription_state_delete_own
  on public.subscription_state
  for delete
  using (user_id = auth.uid());

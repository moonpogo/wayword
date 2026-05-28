create or replace function public.wayword_jsonb_has_only_keys(payload jsonb, allowed_keys text[])
returns boolean
language sql
immutable
as $$
  select coalesce(
    (
      select bool_and(key = any(allowed_keys))
      from jsonb_object_keys(coalesce(payload, '{}'::jsonb)) as key
    ),
    true
  );
$$;

create or replace function public.wayword_retention_payload_valid(event_name text, payload jsonb)
returns boolean
language sql
immutable
as $$
  select
    jsonb_typeof(coalesce(payload, '{}'::jsonb)) = 'object'
    and not (coalesce(payload, '{}'::jsonb) ?| array['writing_text', 'text', 'body', 'content', 'draft', 'mirror_payload'])
    and case
      when event_name = 'onboarding_completed' then public.wayword_jsonb_has_only_keys(coalesce(payload, '{}'::jsonb), array['source'])
      when event_name = 'run_saved' then
        public.wayword_jsonb_has_only_keys(coalesce(payload, '{}'::jsonb), array['sync_status', 'is_authenticated'])
        and coalesce(payload ->> 'sync_status', '') in ('server_synced', 'local_only_no_session', 'local_only_sync_failed')
      when event_name = 'meaningful_session_completed' then public.wayword_jsonb_has_only_keys(coalesce(payload, '{}'::jsonb), array[]::text[])
      when event_name = 'observatory_revisited' then public.wayword_jsonb_has_only_keys(coalesce(payload, '{}'::jsonb), array['surface_name', 'available', 'sparse_state'])
      when event_name = 'return_session_detected' then
        public.wayword_jsonb_has_only_keys(coalesce(payload, '{}'::jsonb), array['threshold_hours', 'elapsed_hours'])
        and jsonb_typeof(coalesce(payload, '{}'::jsonb) -> 'threshold_hours') = 'number'
        and jsonb_typeof(coalesce(payload, '{}'::jsonb) -> 'elapsed_hours') = 'number'
      when event_name = 'migration_previewed' then public.wayword_jsonb_has_only_keys(coalesce(payload, '{}'::jsonb), array[]::text[])
      when event_name = 'migration_completed' then public.wayword_jsonb_has_only_keys(coalesce(payload, '{}'::jsonb), array[]::text[])
      when event_name = 'migration_failed' then public.wayword_jsonb_has_only_keys(coalesce(payload, '{}'::jsonb), array['reason'])
      when event_name = 'migration_skipped_unverified_rls' then public.wayword_jsonb_has_only_keys(coalesce(payload, '{}'::jsonb), array[]::text[])
      else false
    end;
$$;

create table if not exists public.retention_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  event text not null,
  payload jsonb not null default '{}'::jsonb,
  "timestamp" timestamp with time zone not null default timezone('utc'::text, now()),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  constraint retention_events_event_check check (
    event in (
      'onboarding_completed',
      'run_saved',
      'meaningful_session_completed',
      'observatory_revisited',
      'return_session_detected',
      'migration_previewed',
      'migration_completed',
      'migration_failed',
      'migration_skipped_unverified_rls'
    )
  ),
  constraint retention_events_payload_valid_check check (
    public.wayword_retention_payload_valid(event, payload)
  )
);

create index if not exists retention_events_created_at_idx
  on public.retention_events (created_at desc);

create index if not exists retention_events_user_id_created_at_idx
  on public.retention_events (user_id, created_at desc);

create index if not exists retention_events_event_created_at_idx
  on public.retention_events (event, created_at desc);

alter table public.retention_events enable row level security;

drop policy if exists "retention_events_insert_own" on public.retention_events;
create policy "retention_events_insert_own"
on public.retention_events
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "retention_events_select_own" on public.retention_events;
create policy "retention_events_select_own"
on public.retention_events
for select
to authenticated
using (auth.uid() = user_id);

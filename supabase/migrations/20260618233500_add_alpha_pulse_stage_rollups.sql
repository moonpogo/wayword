create schema if not exists private;

create table if not exists public.alpha_pulse_stage_daily_totals (
  day date not null,
  stage_id text not null,
  event_count integer not null default 0 check (event_count >= 0),
  first_event_at timestamp with time zone not null,
  last_event_at timestamp with time zone not null,
  primary key (day, stage_id),
  constraint alpha_pulse_stage_daily_totals_stage_check check (
    stage_id in (
      'landed',
      'started_writing',
      'submitted',
      'saved',
      'returned',
      'opened_recent_runs',
      'opened_patterns',
      'errors'
    )
  )
);

create index if not exists alpha_pulse_stage_daily_totals_stage_day_idx
  on public.alpha_pulse_stage_daily_totals (stage_id, day desc);

alter table public.alpha_pulse_stage_daily_totals enable row level security;

grant select on public.alpha_pulse_stage_daily_totals to anon, authenticated;

drop policy if exists "alpha_pulse_stage_daily_totals_select_all" on public.alpha_pulse_stage_daily_totals;
create policy "alpha_pulse_stage_daily_totals_select_all"
on public.alpha_pulse_stage_daily_totals
for select
to anon, authenticated
using (true);

create or replace function public.wayword_alpha_pulse_stage_rows(
  event_name text,
  payload jsonb,
  occurred_at timestamp with time zone
)
returns table (
  day date,
  stage_id text,
  event_at timestamp with time zone
)
language sql
immutable
set search_path = public, pg_temp
as $$
  select
    timezone('utc'::text, occurred_at)::date as day,
    mapped.stage_id,
    occurred_at as event_at
  from (
    select 'landed'::text as stage_id
    where event_name = 'landing_viewed'

    union all

    select 'started_writing'::text as stage_id
    where event_name = 'writing_started'

    union all

    select 'submitted'::text as stage_id
    where event_name = 'run_submitted'

    union all

    select 'saved'::text as stage_id
    where event_name = 'run_saved'

    union all

    select 'returned'::text as stage_id
    where event_name = 'return_session_detected'

    union all

    select 'opened_recent_runs'::text as stage_id
    where event_name = 'recent_runs_opened'

    union all

    select 'opened_patterns'::text as stage_id
    where event_name = 'observatory_revisited'
      and coalesce(payload ->> 'surface_name', '') in ('', 'patterns')

    union all

    select 'errors'::text as stage_id
    where event_name = 'migration_failed'

    union all

    select 'errors'::text as stage_id
    where event_name = 'run_saved'
      and coalesce(payload ->> 'sync_status', '') = 'local_only_sync_failed'
  ) as mapped;
$$;

create or replace function private.refresh_alpha_pulse_stage_daily_totals()
returns trigger
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  insert into public.alpha_pulse_stage_daily_totals (
    day,
    stage_id,
    event_count,
    first_event_at,
    last_event_at
  )
  select
    mapped.day,
    mapped.stage_id,
    1,
    mapped.event_at,
    mapped.event_at
  from public.wayword_alpha_pulse_stage_rows(
    new.event,
    coalesce(new.payload, '{}'::jsonb),
    coalesce(new."timestamp", new.created_at)
  ) as mapped
  on conflict (day, stage_id) do update
  set
    event_count = public.alpha_pulse_stage_daily_totals.event_count + 1,
    first_event_at = least(public.alpha_pulse_stage_daily_totals.first_event_at, excluded.first_event_at),
    last_event_at = greatest(public.alpha_pulse_stage_daily_totals.last_event_at, excluded.last_event_at);

  return new;
end;
$$;

drop trigger if exists retention_events_alpha_pulse_rollup_trigger on public.retention_events;
create trigger retention_events_alpha_pulse_rollup_trigger
after insert on public.retention_events
for each row
execute function private.refresh_alpha_pulse_stage_daily_totals();

insert into public.alpha_pulse_stage_daily_totals (
  day,
  stage_id,
  event_count,
  first_event_at,
  last_event_at
)
select
  mapped.day,
  mapped.stage_id,
  count(*)::integer as event_count,
  min(mapped.event_at) as first_event_at,
  max(mapped.event_at) as last_event_at
from (
  select *
  from public.retention_events events,
  lateral public.wayword_alpha_pulse_stage_rows(
    events.event,
    coalesce(events.payload, '{}'::jsonb),
    coalesce(events."timestamp", events.created_at)
  )
) as mapped
group by mapped.day, mapped.stage_id
on conflict (day, stage_id) do update
set
  event_count = excluded.event_count,
  first_event_at = excluded.first_event_at,
  last_event_at = excluded.last_event_at;

create or replace function public.wayword_retention_payload_valid(event_name text, payload jsonb)
returns boolean
language sql
immutable
as $$
  select
    jsonb_typeof(coalesce(payload, '{}'::jsonb)) = 'object'
    and not (coalesce(payload, '{}'::jsonb) ?| array['writing_text', 'text', 'body', 'content', 'draft', 'mirror_payload'])
    and case
      when event_name = 'landing_viewed' then public.wayword_jsonb_has_only_keys(coalesce(payload, '{}'::jsonb), array['source'])
      when event_name = 'writing_started' then public.wayword_jsonb_has_only_keys(coalesce(payload, '{}'::jsonb), array['source'])
      when event_name = 'run_submitted' then public.wayword_jsonb_has_only_keys(coalesce(payload, '{}'::jsonb), array[]::text[])
      when event_name = 'recent_runs_opened' then public.wayword_jsonb_has_only_keys(coalesce(payload, '{}'::jsonb), array['surface_name'])
      when event_name = 'alpha_pulse_feedback' then
        public.wayword_jsonb_has_only_keys(coalesce(payload, '{}'::jsonb), array['response'])
        and coalesce(payload ->> 'response', '') <> ''
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

alter table public.retention_events
  drop constraint if exists retention_events_event_check;

alter table public.retention_events
  add constraint retention_events_event_check check (
    event in (
      'landing_viewed',
      'writing_started',
      'run_submitted',
      'recent_runs_opened',
      'alpha_pulse_feedback',
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
  );

alter table public.retention_events
  drop constraint if exists retention_events_payload_valid_check;

alter table public.retention_events
  add constraint retention_events_payload_valid_check check (
    public.wayword_retention_payload_valid(event, payload)
  );

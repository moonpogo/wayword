# Schema Draft (Alpha Scope)

## Entities

1. users
- id (uuid, pk)
- created_at
- updated_at
- email
- profile_status

2. runs
- id (uuid, pk)
- user_id (fk -> users.id)
- created_at
- updated_at
- writing_text
- started_at
- ended_at
- save_source (local/migrated/authenticated)

3. observatory_summaries
- id (uuid, pk)
- user_id (fk)
- run_id (nullable fk)
- instrument_key (season_wheel|trace_field|pulse|drift_atlas)
- summary_payload (jsonb)
- generated_at

4. prompt_state
- id (uuid, pk)
- user_id (fk)
- current_prompt_id
- strata_state (jsonb)
- updated_at

5. subscription_state
- id (uuid, pk)
- user_id (fk)
- provider (stripe)
- status
- current_period_end
- updated_at

## Schema Constraints

- all user-owned tables require user_id ownership
- timestamp completeness required for continuity and observatory dependencies
- naming remains doctrine-neutral and non-diagnostic
- no speculative entities for deferred features

# Migration Executor Notes (Track 4)

## Migration States

Implemented states:
- not_started
- preview_ready
- in_progress
- completed
- partial_failure
- skipped_unverified_rls
- failed

State is persisted in local storage key:
- `wayword-migration-status`

## Preview Behavior

`previewMigration(...)` reports:
- local run count
- server run count
- exact duplicates
- local-only runs
- server-only runs
- conflicts
- estimated upload count

Preview is non-mutating.

## Executor Behavior

`executeMigration(...)`:
- requires authenticated user
- requires `SUPABASE_RLS_VERIFIED=true` gate
- uploads only local-only runs
- skips fingerprint duplicates
- preserves local history regardless of server result
- records migration batch id and status

## Metadata Used

Runs carry migration metadata for idempotency and traceability:
- migration_fingerprint
- client_run_id
- migration_source
- migrated_at
- migration_batch_id

## Conflict Handling

- fingerprint match => duplicate skip
- same client_run_id + different fingerprint => conflict (preserve both; no overwrite)
- ambiguous overlap never silently merged

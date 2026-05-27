# Delete Execution Implementation Notes (Risk-Closure Sprint)

## Scope

Bounded implementation wiring for account-owned run deletion.

## Implemented

- Added `waywordPersistenceRuntime.deleteOwnedRun(runId)`.
- Added `waywordPersistenceRuntime.deleteAllOwnedRuns()`.
- Added `waywordSupabaseRunStore.deleteRunForUser(...)` and `deleteAllRunsForUser(...)`.
- Deletion is ownership-scoped with `.eq("user_id", authUserId)`.

## Safety Rules Preserved

- local continuity is not deleted by account deletion wiring
- local fallback remains separate and explicit (`localDataDeleted: false`)
- no silent local cleanup introduced
- no migration cleanup side effect introduced

## Failure Behavior

- unauthenticated calls fail safely
- supabase-not-configured calls fail safely
- missing run id fails safely

## Not Added

- no bulk-delete UX
- no automatic account wipe behavior
- no observatory expansion behavior

# Export Execution Implementation Notes (Risk-Closure Sprint)

## Scope

Bounded implementation wiring for account-owned run export.

## Implemented

- Added `waywordPersistenceRuntime.exportOwnedRuns()`.
- Added `waywordSupabaseRunStore.exportRunsForUser(...)` query path.
- Export requires authenticated session user id.
- Export query is ownership-scoped with `.eq("user_id", authUserId)`.
- Export format baseline is JSON envelope (`wayword-export-v1`).

## Export Envelope

Current envelope includes:

- `schemaVersion`
- `exportedAt`
- `ownerUserId`
- `runCount`
- `runs[]` with continuity-safe metadata and writing text

## Safety Properties

- unauthenticated calls fail safely
- supabase-not-configured calls fail safely
- no cross-user query path exists in runtime wiring
- relies on RLS for final server-side enforcement

## Not Added

- no new telemetry events
- no UI redesign
- no auto-download flow
- no local data deletion side effect

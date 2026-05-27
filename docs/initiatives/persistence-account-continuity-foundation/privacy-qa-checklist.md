# Privacy QA Checklist (Track 6)

## Pass/Fail Checks

1. Local-only continuity works when account continuity is unavailable.
2. Server sync failure does not block writing continuity.
3. Migration does not delete local history.
4. Unknown telemetry events are rejected.
5. Telemetry payloads reject prohibited content keys.
6. Save telemetry excludes writing content.
7. Migration telemetry excludes writing content.
8. Telemetry registry matches the approved Track 6 allowlist.
9. RLS verification status is explicit and current.
10. Auth/session failures preserve draft snapshots.

## Automatic Fail Conditions

- any telemetry event includes writing content
- any telemetry event captures keystroke streams
- unknown event names are accepted silently
- migration flow performs local destructive cleanup in this phase
- trust copy claims completed controls that are still pending
- RLS status is omitted while migration path is active

## Verification Notes (This Pass)

- Track 6 runtime is allowlist-only and schema-limited
- unknown events are rejected
- prohibited payload keys are rejected

# Unresolved Risks (Updated - Final Trust Verification Pass)

## Risk Register

1. Live Supabase RLS verification remains pending.
- Severity: High
- Impact: final trust closure and pre-GO authorization
- Current control: migration executor gate (`SUPABASE_RLS_VERIFIED`)
- Current blocker: no live dual-user verification environment/session configured in this workspace
- Required action: execute and record live dual-user RLS verification

2. Export/delete user-facing invocation remains minimal/internal.
- Severity: Medium
- Impact: operational accessibility of trust controls
- Current control: runtime wiring and ownership tests complete
- Required action: bounded invocation surface validation for alpha operators/users

3. Migration race-condition / large-corpus validation remains partial.
- Severity: Medium
- Impact: continuity confidence at larger cohort sizes
- Current control: deterministic fingerprint + conservative conflict classification
- Required action: targeted stress fixtures and sequence/race test scenarios

## Resolved In This Pass

- Season Wheel pre-existing baseline failure resolved
- logic suite baseline restored (`npm run test:logic` passes)
- export/delete ownership-scoped wiring remains verified
- telemetry scope remained unchanged

## Non-Negotiable Risk Rules

- do not claim live RLS verification completion before real execution evidence exists
- do not relax migration non-destructive posture
- do not expand telemetry scope without founder approval

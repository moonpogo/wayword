# Trust + Privacy Baseline (Track 5)

## Purpose

Define the first user-legible trust baseline for account continuity without expanding product claims.

## Plain Trust Posture

Wayword continuity currently follows these rules:

- writing continuity remains available locally when account continuity is unavailable
- signed-in users may sync saved runs to account storage
- local fallback is preserved during sync failure
- migration does not delete local history in this phase
- export and delete capabilities are part of the required continuity path
- telemetry is minimal and not used for manipulative engagement loops

## What Is Saved

- saved writing runs
- run timestamps and continuity metadata
- limited migration status metadata

Not saved as telemetry:

- draft content streams
- keystrokes
- behavior-scoring signals

## Where Data Lives (Current Baseline)

- local continuity path: local storage fallback remains active
- account continuity path: authenticated server storage via Supabase (gated by RLS verification status)
- migration path: preview + idempotent executor; no destructive cleanup in this phase

## What Is Pending

- live RLS verification completion record
- full export path implementation wiring
- full account-data deletion workflow execution wiring

## Tone and Claim Constraints

Do:

- use direct, plain wording
- state pending controls explicitly
- avoid certainty claims not backed by implementation status

Do not:

- promise completed controls that remain pending
- use inflated security language
- imply data handling invisibility or “magic” protection

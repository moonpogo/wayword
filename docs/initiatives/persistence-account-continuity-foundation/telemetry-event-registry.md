# Telemetry Event Registry (Track 6 Enforced)

## Purpose

Lock and enforce telemetry minimum boundaries for retention learning.

## Enforced Allowlist

- `onboarding_completed`
- `run_saved`
- `meaningful_session_completed`
- `observatory_revisited`
- `return_session_detected`
- `migration_previewed`
- `migration_completed`
- `migration_failed`
- `migration_skipped_unverified_rls`

No other events are authorized in this phase.

## Prohibited Payload Classes

- writing content (`text`, `writing_text`, `draft_text`, response body fields)
- keystroke/cursor traces
- localStorage dumps
- psychological/personality labels
- engagement or productivity scores

## Payload Posture

Allowed payload values are intentionally narrow:

- timestamps
- bounded status strings
- boolean flags
- coarse counts
- observatory surface name

Unknown payload keys are dropped.
Prohibited payload keys are rejected.

## Expansion Rule

Any net-new event requires founder approval plus privacy review.

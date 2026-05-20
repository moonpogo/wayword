# Wayword System Coherence Checklist

Purpose: guardrail for architecture and CI review to prevent reintroduction of intervention layers or multi-mode behavioral systems.

## 1) Core System Invariant (Critical)

Wayword must always behave as:

1. `preEntry` (Entry initiation + optional `entryDelayHint`)
2. `writing` (silence)
3. `idle` (session ended/reset)

Any deviation is a critical regression.

## 2) Forbidden Patterns (Fail Immediately)

Reject any change that introduces:

- post-entry nudges
- stall recovery prompts
- multi-stage intervention timing chains
- escalation systems
- “keep going” / “continue writing” / “resume writing” helpers
- persistent guidance surfaces during writing
- any UI layer that competes with editor content after first token

If any of the above appears in runtime code, tests, or UI, fail validation.

## 3) Entry-Only Intervention Rule

Only one intervention mechanism is allowed: `entryDelayHint`.

It must:

- run only before first token
- deactivate immediately on first input
- never re-trigger mid-session
- remain decoupled from writing-state behavior

No other intervention mechanism is permitted.

## 4) Runtime State Simplicity Rule

Allowed runtime states:

- `preEntry`
- `writing`
- `idle`

Any additional behavioral “phase/mode/stage” is regression risk and must be rejected unless architecture is explicitly re-approved.

## 5) Strata Safety Rule

Strata Engine must:

- influence prompt selection only
- never trigger UI behavior directly
- never emit user-facing intervention messaging
- never own timing-based interaction logic

Strata is decision logic, not interaction logic.

## 6) UI Purity Rule

After first token:

- no overlays
- no persistent system messaging
- no assistant-like presence in editor space
- no competing guidance layers

Editor surface is user-owned.

## 7) Required Tests

Test suite must explicitly assert:

- no intervention appears after first token
- `entryDelayHint` appears only in `preEntry`
- writing state remains silent
- no legacy nudge references exist
- no calibration references exist
- no multi-stage intervention timing chains exist

## 8) Regression Checks (Human + CI)

Run before merge:

1. Exactly one intervention mechanism exists (`entryDelayHint`).
2. Writing flow is uninterrupted after first token.
3. No UI element appears mid-writing except user-authored content.
4. No additional behavioral state machine layers were added.

### Suggested CI grep checks

Fail if any of these return results:

```bash
rg -n "calibration|Calibration|CALIBRATION" src script.js index.html style.css tests
rg -n "latent|stall|escalat|keep going|resume writing|continue writing" src script.js index.html style.css tests
rg -n "nudge" src/features/writing src/app script.js
```

Allowlist exception:

- `entryDelayHint` naming and related tests.
- Mirror “next pass” copy paths are not writing-phase interventions and should not mutate editor behavior.

## 9) Definition of Failure

System is broken if it:

- speaks during writing
- attempts to help continuation mid-writing
- competes with active text
- introduces behavioral states beyond `preEntry`, `writing`, `idle`

## 10) Architectural Goal

Keep Wayword:

- initiation-aware
- post-initiation silent
- structurally minimal
- behaviorally non-intrusive


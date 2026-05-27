# Export + Delete Baseline (Track 5)

## Scope

Define minimum behavior now, before broader alpha expansion.

## Export Baseline

Current requirement:

- user must be able to export saved runs from account continuity storage
- initial portable format: JSON
- markdown/plain-text export may be deferred

Baseline export payload should include:

- run id
- user id linkage (or account-safe owner reference)
- prompt id/state references where applicable
- run body/content
- created/updated timestamps
- migration metadata fields where present

## Delete Baseline

Current requirement:

- user must be able to delete account-owned runs
- account-data deletion path must be definable and auditable
- local data deletion must be explicit and separate
- no silent local cleanup during migration phase

Deletion parity expectation in this phase:

- deletion workflow must not leave “hidden account continuity remnants” in normal storage paths
- local fallback data remains user-controlled and explicit

## Current Status

- behavior defined: YES
- full UI flow implemented: NO (deferred)
- destructive cleanup in migration: PROHIBITED

## Guardrails

- any delete/export expansion must preserve local fallback trust
- no deletion flow may auto-remove local continuity without explicit user intent
- no export/delete claim should exceed implemented behavior

# Gate 2 Deletion Verification Plan

Initiative: Encrypted Local-First Observatory Architecture  
Continuation: Gate 2 Deletion Integrity Model Packet  
Scope: Docs-only QA/Safety verification planning

## Purpose

Define verification requirements that prove deletion integrity for the full parity set under local, sync, offline, and conflict conditions.

## Verification Targets

- source writing deletion
- derived observatory artifact deletion
- index/cache deletion
- encrypted blob deletion
- conflict artifact deletion
- tombstone lifecycle artifact handling
- offline reconciliation behavior
- sync conflict delete precedence
- export-related managed artifact deletion
- deterministic observatory regeneration after deletion

## State Verification Matrix

`ACTIVE`
- verify content present only in expected local/sync encrypted surfaces

`PENDING_DELETION`
- verify deletion intent record includes full parity set

`LOCALLY_DELETED`
- verify source + derived + index/cache local removal completed

`SYNC_DELETION_PENDING`
- verify remote/peer pending status is explicit and auditable

`DELETION_TOMBSTONED`
- verify tombstone propagation and delete precedence behavior

`DELETION_CONFIRMED`
- verify full parity set deletion acknowledgment across known replicas

`UNRECONCILED_OFFLINE_REPLICA_RISK`
- verify risk state is raised and finality claims are withheld

## Required Test Scenario Families (Future)

1. Single-device local deletion
- delete source and confirm all local derived/index/cache members removed

2. Multi-device online deletion
- delete from one device, confirm parity deletion on peers and sync storage

3. Offline replica reconciliation
- delete while peer offline, reconnect later, ensure tombstone-first reconciliation and no resurrection

4. Conflict stress cases
- concurrent edits + deletion events, confirm delete precedence and no stale rehydration

5. Tombstone lifecycle expiry
- ensure tombstones persist long enough for convergence, then expire safely

6. Export boundary validation
- confirm managed export caches are deleted
- confirm user-exported external copy boundary is explicitly documented (not silently implied)

7. Regeneration correctness
- recompute observatory artifacts post-deletion and confirm deleted-source traces do not return

## Evidence Requirements

For each scenario:
- input fixture description
- expected state transitions
- parity set deletion checklist
- reconciliation outcome record
- finality claim status

Evidence must be reproducible and deterministic for same fixtures/config.

## Fail Conditions (Automatic NO-GO)

- any parity-set artifact persists after deletion confirmation
- conflict handling resurrects deleted content or derived artifacts
- offline reconciliation can bypass tombstone precedence
- deletion claims issued while unreconciled offline risk exists
- regeneration reintroduces deleted-source observatory traces
- any step requires server-readable writing
- metadata profiling is introduced to validate deletion

## Safety Review Hooks

Safety must confirm:
- deletion parity is preserved
- no doctrine-violating retention behavior exists
- no server-readable fallback is used during reconciliation

## Founder Decision Inputs (Gate 2)

Founder decisions needed from this plan:
- acceptable finality language when offline risk remains unresolved
- tombstone retention policy target for safe reconciliation window
- threshold for declaring `DELETION_CONFIRMED` in multi-device environments

## Gate 2 Recommendation

- GO to founder review with this verification plan and deletion model pair
- NO-GO for implementation until founder approves finality policy and retention boundaries

# Gate 2 Deletion Integrity Model

Initiative: Encrypted Local-First Observatory Architecture  
Continuation: Gate 2 Deletion Integrity Model Packet  
Scope: Docs-only lifecycle model (no implementation)

## Purpose

Define a doctrine-aligned deletion integrity model that preserves:
- no server-readable writing
- deletion parity across source and derived surfaces
- sync safety under offline/conflict conditions

## Deletion Scope (Parity Set)

Deletion parity must apply to all of the following:
- source writing
- derived observatory artifacts
- indexes
- caches
- encrypted blobs
- conflict artifacts
- tombstone lifecycle artifacts

Any deletion model that omits a member of this set is NO-GO.

## Deletion States

1. `ACTIVE`
- content is present and readable on authorized local device
- encrypted counterparts may exist in sync storage

2. `PENDING_DELETION`
- deletion intent recorded locally
- deletion job queued for source + full parity set

3. `LOCALLY_DELETED`
- local source + derived + indexes/caches removed
- local tombstone emitted for reconciliation

4. `SYNC_DELETION_PENDING`
- local deletion complete
- remote encrypted artifacts or peer replicas not yet confirmed deleted

5. `DELETION_TOMBSTONED`
- reconciliation-safe tombstone active across sync domain
- conflict merge rules enforce delete precedence

6. `DELETION_CONFIRMED`
- parity set deletion acknowledged across known replicas/sync surfaces
- tombstone expiration countdown may begin

7. `UNRECONCILED_OFFLINE_REPLICA_RISK`
- known risk state for long-offline replica not yet reconciled
- no claim of global finality until reconciliation completes

## Transition Model

`ACTIVE -> PENDING_DELETION`
- trigger: explicit user deletion action
- requirement: create deletion intent record spanning parity set

`PENDING_DELETION -> LOCALLY_DELETED`
- trigger: local deletion transaction success
- requirement: all local parity set members removed atomically or rolled back

`LOCALLY_DELETED -> SYNC_DELETION_PENDING`
- trigger: local deletion done, remote/peer acknowledgments pending
- requirement: emit tombstone/event payload (opaque, non-semantic)

`SYNC_DELETION_PENDING -> DELETION_TOMBSTONED`
- trigger: tombstone distributed for conflict-safe delete precedence
- requirement: conflict merge cannot resurrect deleted content

`DELETION_TOMBSTONED -> DELETION_CONFIRMED`
- trigger: parity acknowledgments complete for known sync domain
- requirement: source + derived + blob/index/cache/conflict artifacts confirmed removed

`ANY -> UNRECONCILED_OFFLINE_REPLICA_RISK`
- trigger: known offline replica cannot yet confirm deletion reconciliation
- requirement: system must not overclaim final deletion state beyond known domain

`UNRECONCILED_OFFLINE_REPLICA_RISK -> DELETION_CONFIRMED`
- trigger: offline replica reconciles and confirms delete parity

## Sync Conflict Deletion Behavior

Hard rules:
- delete precedence wins over conflicting stale content writes
- conflict artifacts must not rehydrate deleted source/derived artifacts
- tombstones remain active until safe convergence window closes
- no semantic observatory data may travel as conflict payload content

## Offline Device Reconciliation

Rules:
- offline replicas must ingest tombstones before applying stale content mutations
- on reconnect, deletion reconciliation runs before normal content merge
- if ambiguity remains, maintain risk state `UNRECONCILED_OFFLINE_REPLICA_RISK`
- do not declare full deletion finality while unresolved offline replica risk exists

## Export Artifact Deletion Expectations

- exports are user-controlled copies outside runtime deletion domain once exported
- product deletion guarantees apply to managed storage/sync surfaces, not external unmanaged copies
- export UX language must be explicit about this boundary
- managed export cache/temp artifacts inside product domain must be included in parity deletion

## Deterministic Observatory Regeneration After Deletion

Rules:
- regeneration after deletion must not recreate removed content-derived artifacts
- regenerated observatory state must reflect only surviving source corpus
- deletion parity must invalidate stale derived caches before regeneration runs

## Safety and Doctrine Constraints

- server-readable writing remains prohibited
- metadata profiling remains prohibited
- no language or behavior that implies hidden retained semantic traces after deletion
- deletion claims must map to verifiable state transitions and evidence

## Operational Unknowns (Docs-Phase)

- tombstone retention duration needed for safe multi-device convergence
- handling of replicas lost beyond retention horizon
- finality wording when unreconciled offline risk persists

## Gate 2 Recommendation

- model is suitable for founder review as deletion-integrity baseline
- proceed to founder decision on finality policy and unresolved offline risk handling
- no implementation authorization implied

# Metadata Boundary Options

Initiative: Encrypted Local-First Observatory Architecture  
Continuation: Key Recovery + Metadata Boundary Decision Packet  
Scope: Docs-only boundary definition for Gate 1

## Hard Boundary Rules

- server must never receive readable writing
- semantic observatory artifacts default local-only unless separately approved
- derived artifacts inherit deletion guarantees
- metadata must not become behavioral profiling

## Boundary Classes

- Allowed server metadata
- Allowed only if encrypted or opaque
- Local-only
- Prohibited

## Category Matrix

### 1) Account identity

Boundary class:
- Allowed server metadata (minimal)

Operational need:
- authentication and account continuity

Privacy risk:
- identity linkage over time

Doctrine risk:
- trust drift if identity appears coupled to observatory interpretation

Minimization strategy:
- strict separation from observatory semantic data
- store only minimal identity attributes required for auth

Deletion implication:
- account deletion workflow must not leave linked derived traces

Recommendation:
- allow minimal identity metadata with strict separation controls

### 2) Billing identity

Boundary class:
- Allowed server metadata (minimal and segregated)

Operational need:
- payment operations (future-only readiness)

Privacy risk:
- cross-link risk between billing and writing behavior

Doctrine risk:
- product may drift toward extraction if identity linkage is expanded

Minimization strategy:
- separate billing domain from observatory data domain
- no semantic observatory fields in billing context

Deletion implication:
- billing retention policy must not preserve observatory semantic artifacts

Recommendation:
- allow only if fully segregated and dormant until founder authorizes payments phase

### 3) Sync timestamps

Boundary class:
- Allowed server metadata (coarse where possible)

Operational need:
- sync coordination and conflict ordering

Privacy risk:
- temporal behavior inference risk

Doctrine risk:
- could become behavioral profiling if granularity is excessive

Minimization strategy:
- reduce precision where operationally feasible
- retain only minimal retention window

Deletion implication:
- remove timestamp trails tied to deleted content lifecycle events

Recommendation:
- allow with coarse precision and retention limits

### 4) Device identifiers

Boundary class:
- Allowed only if encrypted or opaque

Operational need:
- trusted device management and revocation

Privacy risk:
- persistent device tracking

Doctrine risk:
- surveillance posture drift

Minimization strategy:
- rotating opaque device IDs
- no device fingerprint enrichment

Deletion implication:
- revoke and purge device-link records during account/content teardown

Recommendation:
- allow only opaque identifiers with rotation policy

### 5) Encrypted blob size

Boundary class:
- Allowed server metadata (bounded)

Operational need:
- transport/storage operations

Privacy risk:
- coarse inference from size patterns

Doctrine risk:
- size analytics may drift toward behavior profiling

Minimization strategy:
- bucketize sizes where possible
- avoid longitudinal analytics use

Deletion implication:
- remove blob references on deletion cascade

Recommendation:
- allow bounded operational use only

### 6) Run counts

Boundary class:
- Allowed only if encrypted or opaque (aggregated), otherwise local-only

Operational need:
- continuity metrics and sync integrity checks

Privacy risk:
- behavioral cadence inference

Doctrine risk:
- can become productivity/engagement proxy

Minimization strategy:
- keep canonical run counts local
- if server-side needed, store coarse encrypted aggregates only

Deletion implication:
- aggregate counters must decrement or reset on deletion where relevant

Recommendation:
- default local-only; allow coarse encrypted aggregate only with explicit founder approval

### 7) Observatory artifact counts

Boundary class:
- Local-only by default

Operational need:
- local observatory rendering and diagnostics

Privacy risk:
- semantic intensity inference

Doctrine risk:
- profiling drift and interpretive overreach

Minimization strategy:
- keep counts local
- no server analytics pipeline for artifact totals

Deletion implication:
- local counts must fully recalculate after deletion

Recommendation:
- keep local-only unless separately approved by founder + safety

### 8) Deletion tombstones

Boundary class:
- Allowed only if encrypted or opaque

Operational need:
- delete propagation and conflict-safe reconciliation

Privacy risk:
- content existence timeline inference

Doctrine risk:
- weak deletion semantics if tombstones are mishandled

Minimization strategy:
- opaque tombstone IDs
- bounded retention just long enough for sync convergence

Deletion implication:
- tombstone lifecycle must be auditable and expires after safe convergence

Recommendation:
- allow opaque tombstones with explicit expiration policy

### 9) Conflict markers

Boundary class:
- Allowed only if encrypted or opaque

Operational need:
- sync conflict resolution safety

Privacy risk:
- reconstructable behavior sequences

Doctrine risk:
- can undermine deletion guarantees if conflict markers revive deleted artifacts

Minimization strategy:
- minimal marker schema
- no semantic payload

Deletion implication:
- markers involving deleted content must prefer delete precedence

Recommendation:
- allow opaque markers with delete-precedence rules

### 10) Prompt IDs

Boundary class:
- Allowed only if encrypted or opaque; otherwise local-only

Operational need:
- prompt continuity/debugging across devices

Privacy risk:
- prompt history can reveal behavior patterns

Doctrine risk:
- behavioral modeling risk if joined with timestamps/run counts

Minimization strategy:
- hash/opaque prompt references
- prevent long-horizon analytics joins

Deletion implication:
- prompt-link metadata must be removed when associated content is deleted

Recommendation:
- default local-only; if synced, use opaque IDs only with strict retention limits

### 11) Local-only semantic/trace data

Boundary class:
- Local-only

Operational need:
- observatory rendering and recurrence traces

Privacy risk:
- highest semantic sensitivity

Doctrine risk:
- direct risk of hidden inference/profiling if exposed

Minimization strategy:
- never transmit readable semantic traces to server

Deletion implication:
- must be included in derived artifact deletion parity

Recommendation:
- hard local-only; server prohibited

## Prohibited Metadata Uses

- server-side behavioral profiling from metadata joins
- metadata repurposing for engagement optimization
- metadata enrichment that infers emotional/psychological state
- any metadata pathway that enables readable writing reconstruction

## Gate 1 Recommendation

Recommended maximum metadata exposure boundary:
1. allow only minimal operational metadata required for auth/sync/deletion reconciliation
2. keep semantic observatory traces and artifact-level semantics local-only
3. require opaque/encrypted treatment for device IDs, conflict markers, and deletion tombstones
4. prohibit metadata analytics that model user behavior or interpretation

## Founder Decision Targets

- approve per-category boundary classes above
- approve coarse timestamp precision policy
- approve whether run counts and prompt IDs remain strict local-only or allow narrow opaque sync form

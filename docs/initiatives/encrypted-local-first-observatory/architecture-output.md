# Architecture Output

Initiative: Encrypted Local-First Observatory Architecture  
Lane: Architecture  
Scope: v0 options memo under Safety constraints (docs-only)

## Preconditions From Safety

Architecture must honor:
- no server-readable writing
- derived artifacts inherit deletion guarantees
- privacy posture cannot weaken for accounts/payments readiness

No architecture is finalized here. This is option mapping only.

## Option A: Local-Only Baseline

Data location:
- source writing: device-local encrypted store
- derived observatory artifacts: device-local encrypted store
- sync state: none

Key-handling assumptions:
- device-held keys only
- no remote key custody

Deletion/export implications:
- deletion fully local and immediate
- export requires explicit user action and local packaging of source + selected derived artifacts

Risks/unknowns:
- no native cross-device continuity
- device loss risk without user-managed backups

## Option B: Encrypted Cloud Backup/Sync

Data location:
- source writing: local plaintext in app memory + encrypted at rest, encrypted before sync transport
- derived artifacts: encrypted client-side before sync
- cloud: ciphertext blobs + minimal metadata

Key-handling assumptions:
- keys generated and held client-side
- server never receives plaintext keys
- recovery flow must avoid server-readable fallback

Deletion/export implications:
- deletion must propagate local + cloud ciphertext + synced derived artifacts
- offline deletes require reconciliation queue with verifiable completion
- export should reconstruct from local plus synced encrypted payloads under user control

Risks/unknowns:
- key recovery and lost-device flow complexity
- metadata minimization pressure
- conflict resolution could resurrect stale derived artifacts if not guarded

## Option C: Account-Linked Encrypted Observatory Archive

Data location:
- source and derived artifacts encrypted client-side and linked to account identity envelope
- archive layer stores only ciphertext payloads and integrity metadata

Key-handling assumptions:
- account identity does not imply server decryption ability
- account and billing systems remain separated from decryption capability

Deletion/export implications:
- account deletion and content deletion flows must both cascade to derived artifacts
- export must remain user-initiated and complete enough for observatory continuity checks

Risks/unknowns:
- account recovery and key continuity tension
- increased lifecycle complexity across archive/history layers
- policy clarity needed for retention windows and deletion confirmations

## Cross-Option Comparison

- strongest privacy certainty: Option A
- strongest continuity potential: Option C
- practical middle path for staged v0 exploration: Option B, only if Safety red lines remain intact

## Blockers and Unknowns

- no approved key recovery pattern yet
- no finalized metadata minimization contract yet
- no deletion SLA for derived artifact cascade yet

## Architecture Status

Conditional GO for next docs phase only:
- architecture exploration may continue with Option A + Option B framing
- Option C requires stricter founder review before progression
- implementation is NO-GO until deletion and key-handling unknowns are resolved

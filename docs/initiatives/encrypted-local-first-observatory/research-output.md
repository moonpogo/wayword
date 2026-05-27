# Research Output

Initiative: Encrypted Local-First Observatory Architecture  
Lane: Research  
Scope: Docs-only precedent and tradeoff mapping

## Objective

Survey precedent patterns for local-first encrypted writing systems and map tradeoffs relevant to Wayword doctrine.

## Precedent Categories

1. Local-first note architecture
- Primary source of truth on device
- Optional sync transport for backup/continuity
- Tradeoff: strong ownership posture vs multi-device complexity

2. End-to-end encrypted sync models
- Client-side encryption before transport
- Server stores ciphertext and metadata only
- Tradeoff: trust posture improves, but key recovery and device migration become harder

3. Encrypted storage layering
- Source writing encrypted at rest
- Derived artifacts encrypted separately but linked to source lifecycle
- Tradeoff: clear boundary control, but more deletion orchestration burden

4. Account models
- Accountless local-only
- Account + encrypted sync
- Account + archival continuity
- Tradeoff: convenience and continuity increase account complexity and trust burden

5. Deletion guarantee patterns
- Tombstone + queue + reconciliation model
- Delete-source implies delete-derived cascade
- Tradeoff: stronger guarantees require explicit index/cache invalidation logic

6. Derived artifact risk patterns
- Indexes, caches, vector-like summaries, and recurrence tables may outlive source by accident
- Tradeoff: performance and convenience vs residual privacy risk

## Tradeoffs Summary

Local-only baseline:
- Pros: strongest privacy posture, minimal server trust assumptions, clean doctrine alignment
- Cons: no passive continuity across devices without explicit export/import or backup model

Encrypted cloud backup/sync:
- Pros: continuity without plaintext server visibility
- Cons: key management and conflict semantics become critical risk areas

Account-linked encrypted archive:
- Pros: durability and recoverability across device loss
- Cons: expanded metadata and recovery surfaces may pressure privacy promises

## Account + Payment Readiness Lens

Research posture:
- account/payment readiness should be separated from semantic observatory inference
- billing identity and observatory data should remain logically segregated
- account capabilities should not weaken local-first and deletion guarantees

## Deletion Guarantee Lens

Research conclusion:
- derived observatory artifacts are part of the same trust surface as source writing
- if source deletion is guaranteed, derived-artifact deletion must be part of that guarantee

## Risks To Carry Forward

- key recovery patterns can silently weaken threat model
- metadata leakage can create inference risk even when content is encrypted
- sync conflict handling can create stale or resurrected derived artifacts
- continuity pressure can drive unsafe server-readable fallbacks

## Open Questions (Research Lane)

- what minimum metadata is unavoidable for encrypted sync routing?
- what recovery model can preserve user agency without server-readable content?
- how should offline deletion queues be reconciled after long disconnection windows?

## Lane Recommendation

Proceed to Safety and Architecture constrainting with a default assumption:
- local-first as baseline
- encrypted sync only if plaintext server exposure is never required
- deletion cascades must include derived artifacts

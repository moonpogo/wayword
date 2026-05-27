# Founder Decision

Initiative: Encrypted Local-First Observatory Architecture  
Status: GO for next-phase architecture planning (docs-only)

## Gate 1 Founder Decision

Gate 1 status: APPROVED.

Accepted rulings:

1. Path A is approved as the immediate trust-model baseline:
- recovery phrase support
- device keychain support
- server-blind by design

2. Path B remains exploratory only:
- account-assisted recovery may be researched only if server-blind
- no implementation authorization

3. Server-readable recovery pathways are permanently prohibited.

4. Metadata-driven behavioral profiling is permanently prohibited.

5. Run counts and prompt IDs remain local-only by default unless a later opaque sync need is proven and founder-approved.

6. Deletion parity applies to:
- source writing
- derived observatory artifacts
- indexes
- caches
- conflict artifacts
- tombstone lifecycle artifacts

Gate 2 authorization:
- GO for docs-only Deletion Integrity Model Packet.

Still not authorized:
- implementation
- production UI
- deploys
- payments
- product-claim expansion
- LLM or embedding inference

## Decision Summary

This founder decision preserves Wayword's privacy doctrine and observational constraints while authorizing continued exploration of encrypted observatory persistence.

The initiative is approved for next-phase docs-only architecture planning and internal technical exploration, with explicit non-authorizations retained.

## Accepted Founder Rulings

1. Local-first observatory behavior is the non-negotiable floor.
2. Server-readable user writing is prohibited.
3. Derived observatory artifacts must inherit deletion guarantees.
4. Encrypted sync may be explored as a staged path.
5. Account-linked observatory persistence remains exploratory until:
- key recovery philosophy
- metadata exposure boundaries
- deletion guarantees
are explicitly resolved.

## Accepted Residual Risks

The following residual risks are accepted for this phase (planning only):
- key recovery model remains unresolved
- minimum sync metadata boundary remains unresolved
- deletion verification across offline/sync windows remains unresolved
- conflict reconciliation semantics may affect deletion integrity if unspecified
- account-linked persistence trust implications remain unresolved

Risk acceptance boundary:
- accepted only for docs and planning exploration
- not accepted for implementation or production surfacing

## Unresolved Decisions

1. Key recovery philosophy
- what recovery model preserves user agency without creating server-readable pathways?

2. Metadata exposure boundaries
- what sync/account metadata is operationally necessary and still doctrine-aligned?

3. Deletion guarantees operationalization
- how are source + derived artifacts deletion guarantees verified across local, sync, cache, and archive surfaces?

4. Account-linked persistence constraints
- what account architecture can support continuity without weakening privacy posture?

## Authorized Next-Phase Scope

Authorized:
- docs-only and architecture-planning continuation
- internal technical exploration
- verification planning
- sync/deletion modeling
- threat-model analysis

Not authorized:
- production implementation
- production UI
- deploys
- payment systems
- product-claim expansion
- embeddings or LLM observatory inference

## Implementation Blockers

Implementation remains blocked until all of the following are resolved and approved:
- key recovery philosophy approved by founder
- metadata exposure boundaries explicitly defined
- deletion guarantees (including derived artifacts) mapped to verifiable QA plan
- architecture option selected that preserves no server-readable writing posture
- Safety and QA signoff on doctrine compliance for proposed implementation path

## Next Founder Decision Gates

Gate 1: Trust model gate
- decide approved key recovery philosophy
- decide maximum allowed metadata exposure boundary

Gate 2: Deletion integrity gate
- approve deletion guarantee model for source + derived artifacts across sync states
- approve verification requirements as implementation precondition

Gate 3: Architecture direction gate
- choose staged path:
  - local-only baseline maintenance requirements
  - encrypted sync exploration boundary
  - account-linked persistence hold/release criteria

Gate 4: Implementation authorization gate
- confirm whether implementation phase may begin
- if authorized, define explicit implementation scope and exclusions

## Decision Effect

This ruling keeps Wayword aligned with:
- observational doctrine
- privacy-first trust posture
- bounded scope discipline

It authorizes deeper architecture planning without authorizing production change.

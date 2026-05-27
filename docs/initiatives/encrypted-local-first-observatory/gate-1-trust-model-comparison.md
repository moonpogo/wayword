# Gate 1 Trust Model Comparison Memo

Initiative: Encrypted Local-First Observatory Architecture  
Continuation: Gate 1 Trust Model Comparison Memo  
Scope: Docs-only founder decision packet

## 1) Recommended Gate 1 Decision

Recommended decision:
- Approve **Path A now** as the active trust-model baseline.
- Keep **Path B exploratory only** (not implementation-authorized) until additional founder gates are resolved.

Rationale:
- Path A satisfies founder non-negotiables with lower complexity and lower trust-surface expansion.
- Path B can improve continuity options later, but currently carries higher metadata and recovery-policy risk.

## 2) Path Comparison

### Path A: Recovery Phrase + Device Keychain Support

Definition:
- Phrase-first user-controlled recovery baseline.
- Device keychain support as convenience layer, not authoritative trust override.

Strengths:
- strong alignment with local-first floor
- no server-readable writing required
- lower architectural and operational complexity than account-assisted models

Risks:
- phrase handling burden and user error risk
- platform-specific keychain behavior variance

Best-fit use now:
- immediate baseline for trust posture and planning continuity

### Path B: Path A + Deferred Account-Assisted Server-Blind Recovery

Definition:
- retain Path A baseline
- explore account-assisted recovery where server remains unable to read user writing/content

Strengths:
- potential continuity improvements for account-linked scenarios
- potential reduction in catastrophic data-loss cases if designed safely

Risks:
- metadata linkage pressure
- account recovery attack surface increase
- higher support and policy complexity

Use constraint:
- exploratory planning only; no implementation authorization in Gate 1

## 3) Metadata Boundary Recommendation

Recommended boundary posture for Gate 1 approval:
- run counts default local-only unless narrow opaque sync need is later proven
- prompt IDs default local-only unless narrow opaque sync need is later proven
- server-readable writing pathways remain permanently prohibited
- metadata-driven behavioral profiling remains permanently prohibited
- semantic observatory/trace artifacts remain local-only by default
- deletion parity applies to all derived artifacts, including conflict-marker/tombstone cases

## 4) Explicit Founder Rulings To Approve

1. Approve Path A as immediate baseline trust model.
2. Approve Path B as exploratory only (no implementation).
3. Confirm permanent prohibition of server-readable recovery pathways.
4. Confirm permanent prohibition of metadata-driven behavioral profiling.
5. Confirm run counts and prompt IDs default local-only unless opaque sync need is proven and separately approved.
6. Confirm deletion parity for all derived artifacts, including conflict and tombstone lifecycle artifacts.

## 5) Residual Risks Accepted (Gate 1)

Accepted for planning phase:
- phrase-handling UX/support risk
- device keychain platform variance risk
- unresolved future account-assisted recovery policy complexity
- unresolved coarse metadata precision policy details

Acceptance boundary:
- accepted only for docs/planning progression
- not accepted as implementation clearance

## 6) Risks Not Accepted

Not accepted under any Gate 1 path:
- server-readable recovery pathways
- metadata profiling of behavior, cadence, or interpretation
- weakening deletion parity for derived observatory artifacts
- widening claims beyond architecture-backed guarantees

## 7) Safety/Privacy Recommendation

Safety recommendation:
- approve Path A under current red lines
- permit Path B exploration only with strict server-blind and metadata-minimization constraints
- keep Safety signoff mandatory before any shift from exploratory to implementable posture

## 8) Architecture Recommendation

Architecture recommendation:
- proceed with Path A as architecture floor
- continue modeling Path B as optional future branch
- defer any account-assisted implementation modeling that presumes unresolved key recovery or metadata decisions

## 9) QA Implications

QA implications for post-Gate-1 planning:
- define verification matrix for phrase recovery failure/revocation scenarios
- define keychain behavior parity checks by platform class
- define metadata-boundary conformance checks (local-only vs opaque sync)
- define deletion parity tests covering tombstones/conflict markers and regeneration safety

## 10) Conductor Recommendation

Conductor recommendation:
- **CONTINUE (bounded)**

Reason:
- continuation remains decision-oriented
- no scope drift into implementation
- no duplicate governance artifact explosion

Next continuation should remain single-target:
- Gate 2 deletion integrity model packet

## 11) GO/NO-GO For Gate 2

Recommendation:
- **GO for Gate 2 (Deletion Integrity)** under docs-only constraints.
- **NO-GO** for implementation, production surfacing, claim expansion, or account/payout system work.

Gate 2 should focus on:
- deletion lifecycle model for source + derived artifacts
- conflict/tombstone retention expiration rules
- QA verification preconditions for deletion finality claims

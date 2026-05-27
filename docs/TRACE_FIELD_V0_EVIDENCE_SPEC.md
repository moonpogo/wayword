# TRACE FIELD V0 EVIDENCE SPEC

Status: Pre-implementation constraint spec  
Scope: Deterministic recurrence evidence rules for Trace Field v0 prototype only.

Implementation note:
- The `trace-field-v0` harness is an internal research tool only.
- Harness outputs are non-user-facing inspection artifacts and are not approved for production surfacing.

## 1) Purpose

This spec defines the exact recurrence primitives and evidence requirements allowed in Trace Field v0.

Core constraint:
Wayword observes language behavior. It does not diagnose the user.

Trace Field v0 must surface recurrence only. It must not infer hidden user state.

## 2) Allowed Recurrence Primitives

Only the following primitives are allowed in v0.

### 2.1 Exact token recurrence
- Same token string reappears across entries/runs.
- Example: `harbor` appears in 5 runs.

### 2.2 Normalized token recurrence
- Same token after deterministic normalization (case-folding, punctuation stripping, optional singular/plural normalization by fixed rule table).
- Example: `river` / `River` / `river.` counted together.

### 2.3 Phrase recurrence
- Exact or normalized n-gram recurrence (fixed n range, deterministic tokenization).
- Example: `at the edge` appears in 3 distinct runs.

### 2.4 Co-occurrence recurrence
- Two terms/phrases reappear together within a fixed unit (entry, paragraph, or window).
- Example: `fog` and `bridge` co-occur in 4 runs.

### 2.5 Structural recurrence
- Repeated formal structures detected by deterministic pattern rules.
- Example: recurring contrast form like `X, but Y`.

### 2.6 Proximity recurrence
- Terms repeatedly appear within a fixed token distance window.
- Example: `night` appears within +/-8 tokens of `water` in 6 entries.

## 3) Explicitly Excluded Primitives

The following are out of scope and prohibited for v0:
- emotional inference
- personality inference
- hidden-state inference
- predictive modeling about user behavior/state
- psychological classification
- diagnosis-like mapping
- therapeutic interpretation
- engagement/optimization scoring

If a primitive requires assumptions about internal user state, it is excluded.

## 4) Threshold Rules

### 4.1 Minimum recurrence counts
- Token or phrase recurrence must appear at least `N_min_count` times.
- Default v0 baseline: `N_min_count = 3`.

### 4.2 Minimum dispersion across runs
- Recurrence must appear across at least `R_min_runs` distinct runs/entries.
- Default v0 baseline: `R_min_runs = 2`.

### 4.3 Suppression rules for weak signals
Suppress signals when any of the following are true:
- count < `N_min_count`
- distinct runs < `R_min_runs`
- concentration is single-entry dominant beyond fixed cap
- signal comes primarily from stopword-like or boilerplate tokens

### 4.4 Anti-noise rules
- maintain explicit stopword/symbol exclusion list
- suppress ultra-short high-frequency tokens unless whitelisted
- deduplicate near-identical repeated pasted text in same run
- suppress recurrence from metadata/system text
- require deterministic tie-break ordering to avoid display churn

Note:
Threshold values are provisional research defaults and must be versioned in prototype docs/fixtures.

## 5) Evidence-Link Requirements

Every surfaced recurrence must satisfy all requirements below:

1. Source mapping
- map to exact source run/entry identifiers
- map to token offsets or excerpt spans

2. Inspectability
- supporting traces are viewable in an internal inspection mode/log artifact
- transformation steps (tokenization, normalization, filtering) are explicit

3. Reproducibility
- same input corpus + same config + same version => same output
- deterministic ordering for equal-score items

4. Supporting trace bundle
Each surfaced item must include:
- recurrence primitive type
- count and run dispersion
- supporting excerpt list
- normalization flags used
- suppression checks passed

No surfaced item may exist without an evidence trace.

## 6) Confidence Ceilings

Trace Field v0 must not overstate certainty.

Rules:
- use descriptive recurrence language only (`appears`, `recurs`, `co-occurs`, `returns`, `clusters`)
- prohibit causal/identity verbs (`reveals`, `proves`, `means`, `diagnoses`)
- do not display confidence percentages for personal-state claims (none allowed)
- avoid deterministic personal conclusions from probabilistic textual signals
- when signal strength is marginal, either suppress or use weaker qualifier

Ceiling principle:
Strength of language may never exceed strength of evidence.

## 7) Prototype Restrictions

Trace Field v0 prototype restrictions:
- deterministic processing only
- no embeddings required
- no LLM interpretation
- no generated summaries
- no advice
- no emotional labels
- no psychological summaries
- no user-state predictions

Allowed output class:
- recurrence/appearance observations only, with evidence links.

## 8) Testability Requirements

Before prototype acceptance, provide:
- fixed fixture corpus for recurrence validation
- golden outputs for deterministic comparison
- threshold edge-case fixtures (just below/at/above cutoffs)
- suppression fixtures for noise/boilerplate cases
- reproducibility rerun checks

## 9) Open Technical Questions

Embeddings:
- Should embeddings remain fully out of v0 and only enter post-v0 research?
- If introduced later, what guardrails prevent semantic overreach?

Local processing:
- What must run locally by default to preserve trust and data minimization?
- What is the explicit policy for optional cloud compute?

Deletion guarantees:
- How are derived artifacts (indexes/cache tables/feature stores) deleted with source deletions?
- What deletion SLA applies to primary and derived stores?

Scaling concerns:
- How does deterministic recurrence processing scale across large longitudinal corpora?
- What batching/index strategy preserves determinism and evidence traceability at scale?

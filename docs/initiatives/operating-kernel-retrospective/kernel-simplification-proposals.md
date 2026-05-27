# Kernel Simplification Proposals

Initiative: Operating Kernel Retrospective  
Continuation: Kernel Simplification Packet  
Scope: Docs-only operating-kernel simplification proposals

## Simplification Objective

Reduce governance drag while preserving:
- bounded continuation quality
- closure discipline
- anti-drift behavior

## 1) Compact Morning-Report Mode Proposal

Proposal:
- add compact mode for continuations where lane states, hard constraints, and risk profile are unchanged.
- compact mode includes: state delta, files changed, one leverage delta, one risk delta, Conductor recommendation.

Why:
- cuts repeated low-value prose.

Guardrail:
- full mode required when state changes, new risk class appears, or founder decision target changes.

## 2) Net-New Decision Delta Continuation Rule

Proposal:
- every continuation must declare one explicit net-new decision delta before work starts.
- if no net-new decision delta exists, continuation is paused or moved to founder decision.

Why:
- blocks continuation-by-default behavior.

Guardrail:
- prevents doctrine expansion for its own sake.

## 3) Earlier Conductor Prune-Trigger Proposal

Proposal:
- trigger Conductor prune/escalate recommendation after two consecutive low-leverage continuations.
- low-leverage = no net-new decision delta and no new enforceable gate.

Why:
- shifts prune action earlier, before doc sprawl accelerates.

Guardrail:
- preserve one override path when safety-critical clarification is genuinely needed.

## 4) Doctrine Consolidation-Before-Closure Proposal

Proposal:
- before closure, run one consolidation pass if doctrine doc count is high and overlap is material.
- consolidate overlapping late-stage doctrine docs into operator-ready artifacts.

Why:
- improves practical recall and reduces maintenance burden.

Guardrail:
- consolidation must not soften constraints or remove fail conditions.

## 5) Founder Decision Batching Proposal

Proposal:
- batch medium-granularity decisions when dependencies are already explicit and risk class is shared.
- keep high-risk safety/privacy gates unbatched when ambiguity remains.

Why:
- lowers founder decision-interruption frequency.

Guardrail:
- batching cannot blur unresolved blocker ownership.

## 6) Simplified Late-Stage Continuation Rules

Proposal:
- once enforcement artifacts exist (matrix/checklist or equivalent), allow only:
  - unresolved gate resolution, or
  - consolidation for closure-readiness.

Why:
- prevents late-stage symbolic expansion.

Guardrail:
- prohibits “one more doctrine packet” without explicit decision necessity.

## 7) Reduced Repeated Constraint Restatement Proposal

Proposal:
- replace repeated full hard-constraint blocks with a stable baseline reference + delta-only restatement.

Why:
- reduces noise while preserving safety posture.

Guardrail:
- full hard-constraint restatement required when constraints actually change.

## 8) Night Shift Differentiation Observations

Observation:
- normal bounded continuation and Night Shift outputs currently look too similar in artifact form.

Simplification proposal:
- keep same core guardrails, but require Night Shift reports to include one explicit additional field: “offline-risk handling decision.”

Why:
- clarifies Night Shift operational distinction without adding layers.

## 9) Keep / Tighten / Simplify / Remove Matrix

Keep:
- initiative state model
- founder-decision artifact requirement
- continuation budgets
- Conductor preflight + closure checks

Tighten:
- decision-delta requirement
- early prune triggers
- late-stage continuation eligibility

Simplify:
- compact report mode
- constraint restatement by delta
- consolidation-before-closure

Remove:
- repeated unchanged lane-state narrative blocks
- repeated unchanged non-authorization prose in every continuation

## 10) Expected Leverage Gains

- lower reporting overhead with same decision clarity
- faster founder review due to tighter packet density
- earlier termination of low-yield continuation chains
- improved closure quality via consolidated operator artifacts

## 11) Expected Tradeoffs

- less narrative context in compact mode may reduce onboarding ease for new reviewers
- early prune triggers may occasionally pause useful but subtle clarifications
- consolidation pass adds one explicit final editing step before closure

## 12) Risks Of Oversimplification

- critical risk nuance could be compressed too aggressively
- delta-only constraint references could hide context for first-time readers
- batching decisions could obscure unresolved sub-dependencies if poorly scoped

Mitigation:
- force full mode on state/risk/decision-target changes
- require dependency map check before decision batching

## 13) Founder Decision Targets

1. Approve compact morning-report mode with full-mode fallback criteria.
2. Approve net-new decision delta rule as continuation precondition.
3. Approve two-low-leverage Conductor prune trigger.
4. Approve consolidation-before-closure requirement for high-overlap initiatives.
5. Approve decision batching policy with safety/privacy exception rule.
6. Approve late-stage continuation restriction to unresolved gates + consolidation only.

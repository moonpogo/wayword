# Initiative Runtime Model

Status: Constrained initiative state model for bounded recursive continuation  
Scope: Extends domain workflow and Night Shift protocols

## 1) Purpose

Initiatives are first-class operational objects.

Continuity must come from initiative state, not from isolated prompts.
This runtime does not authorize general autonomy or endless self-directed work.

## 2) Initiative States

- `PROPOSED`
- `ACTIVE`
- `BLOCKED`
- `ESCALATED`
- `PAUSED`
- `PRUNED`
- `READY_FOR_FOUNDER_DECISION`
- `CLOSED`

## 3) State Transitions

- `PROPOSED -> ACTIVE` only with founder intent
- `ACTIVE -> BLOCKED` if required lane dependency is missing
- `ACTIVE -> ESCALATED` if unresolved cross-lane conflict appears
- `ACTIVE -> READY_FOR_FOUNDER_DECISION` when enough evidence exists
- `READY_FOR_FOUNDER_DECISION -> CLOSED` only after founder decision
- `ANY -> PRUNED` if Conductor finds redundancy or low-value continuation
- `BLOCKED -> ACTIVE` only after blocker resolution within approved scope
- `ESCALATED -> ACTIVE` only after founder conflict resolution

## 4) Continuation Rules

An initiative may continue without a fresh founder prompt only if all conditions are true:
- founder intent exists
- current state is `ACTIVE`
- next lane tasks are implied by existing blockers/open questions
- work remains within authorized scope
- stop conditions are not triggered
- Conductor does not pause/prune it

## 5) Lane Wake/Sleep Rules

### Wake Rules

- Research wakes on unresolved conceptual or precedent questions
- Safety wakes on trust, privacy, or inference ambiguity
- Architecture wakes after Safety constraints exist
- QA wakes when verification or reproducibility needs exist
- Editorial wakes when language/framing constraints are needed
- Brand wakes only after doctrine permits internal positioning work
- Conductor wakes whenever initiative complexity increases, docs multiply, or Night Shift is requested

### Sleep Rules

- lanes sleep when current deliverable is complete
- lanes sleep when dependency-blocked
- sleeping lanes may be reactivated only by valid dependency resolution or founder escalation output

## 6) Dependency Rules

- Architecture cannot finalize privacy-sensitive designs before Safety output
- Brand cannot widen product claims
- UI cannot appear before evidence/spec constraints
- implementation cannot begin before founder gate
- Conductor may stop continuation if dependency order is violated

## 7) Continuation Budget

Every recursive continuation must declare:
- max docs to create
- max files to modify
- max scope boundary
- stop conditions
- expected founder decision target

If budget is exceeded without decision value, Conductor should pause or prune.

## 8) Morning/Continuation Report

Every continuation report must include:
- initiative state
- active lanes
- sleeping lanes
- blocked lanes
- open questions
- next implied tasks
- Conductor prune/continue recommendation
- founder decisions needed

## 9) Anti-Patterns

Reject:
- "continue everything"
- hidden implementation drift
- creating more docs because possible
- agents inventing new initiatives
- recursive plans about plans
- volume mistaken for progress

## 10) Reference Example

Initiative: `encrypted-local-first-observatory`

State guidance:
- current state is `READY_FOR_FOUNDER_DECISION` when awaiting founder gate decisions
- returns to `ACTIVE` after founder authorizes next bounded planning phase

Known unresolved gates:
- key recovery philosophy
- metadata exposure boundary
- deletion integrity model
- architecture path selection

Next valid continuation:
- key recovery and metadata boundary research/planning within authorized docs-only scope

Invalid continuation:
- auth implementation
- sync implementation
- public privacy claims

## Runtime Guardrail

This runtime enables bounded recursive continuation only under founder-approved scope.
It does not authorize broad autonomous operation.

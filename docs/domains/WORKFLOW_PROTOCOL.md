# Wayword Domain-Lane Workflow Protocol

Status: Canonical operating protocol for domain-lane work  
Applies to: All observatory and doctrine-sensitive initiatives

## 1) Purpose Of The Domain-Lane System

This protocol defines how Wayword moves work from idea to founder decision using bounded lanes.

It exists to:
- preserve doctrine integrity
- prevent conceptual drift
- keep responsibilities explicit
- force safety and evidence before production surfacing
- make founder decisions based on auditable artifacts

Core principle:
Constrained lane collaboration produces better outcomes than generalized, unbounded AI behavior.

## 2) Standard Lane Sequence

1. Founder intent
- Founder defines the product intent, scope, and decision target.

2. Research brief
- Research lane produces a research-only brief that defines instrument purpose, boundaries, and open questions.

3. Safety doctrine and gates
- Safety lane defines safety ceilings, prohibited claims, and release gate conditions.

4. Evidence/spec constraints
- Architecture + Observatory define deterministic primitives, suppression rules, and evidence-link requirements.

5. Internal prototype
- Architecture + Observatory build non-UI or tightly scoped prototype systems under doctrine constraints.

6. QA hardening
- QA lane validates deterministic behavior, regression coverage, and doctrine compliance.

7. Founder go/no-go
- Founder integrates findings and issues go/no-go (or scoped retry) decision.

## 3) Lane Responsibilities At Each Stage

Founder:
- declare intent and success criteria
- resolve cross-lane tensions
- make final go/no-go decision

Research:
- frame conceptual territory
- define instrument boundaries and non-goals
- identify unresolved questions and risks

Safety & Privacy:
- define interpretive ceilings
- prohibit unsafe claim classes
- enforce privacy and longitudinal risk constraints

Architecture:
- define deterministic system boundaries
- implement evidence-linked internal prototypes
- keep logic modular and auditable

Observatory:
- define instrument-specific observation primitives
- maintain instrument differentiation
- avoid dashboard collapse and overclaim aesthetics

Editorial Doctrine:
- define approved language and prohibited framing
- preserve restrained, non-therapeutic tone

QA Regression:
- convert doctrine/spec into pass/fail checks
- verify deterministic reproducibility
- block progression when required artifacts are missing

Brand & Marketing:
- stay downstream of approved doctrine
- do not redefine claims or widen interpretive scope

Conductor (Pruner / Systems Steward):
- evaluate initiative coherence and duplication risk
- recommend continue/pause/merge/prune/escalate actions
- stop process expansion that lacks execution value

## 4) Required Artifacts Per Stage

Stage 1 - Founder intent:
- scoped intent note with explicit decision question

Stage 2 - Research brief:
- research brief document
- instrument boundary comparison
- open-questions list

Stage 3 - Safety gates:
- safety doctrine artifact
- prohibited claims list
- review checklist and no-go triggers

Stage 4 - Evidence/spec constraints:
- evidence spec with allowed primitives
- threshold and suppression rules
- evidence-link and confidence-ceiling requirements

Stage 5 - Internal prototype:
- internal harness/prototype module
- fixture corpus
- inspection output format

Stage 6 - QA hardening:
- pass/fail test suite
- edge-case fixtures
- deterministic rerun proof
- doctrine compliance report

Stage 7 - Founder decision:
- consolidated decision memo
- go/no-go status
- required follow-up actions

## 5) Branch Naming Conventions

Use isolated lane-scoped branches:
- `architecture/<scope>`
- `observatory/<scope>`
- `safety/<scope>`
- `editorial/<scope>`
- `qa/<scope>`
- `research/<scope>`
- `brand/<scope>`

Cross-lane integration branch (optional, founder-directed):
- `integration/<initiative>-decision-pass`

Rules:
- one clear lane owner per branch
- no mixed-lane hidden scope
- include initiative and phase in branch slug when possible

## 6) Report Format For Codex Outputs

Each Codex completion for lane work should report:
1. Files changed
2. Stage outcome
3. Safety/doctrine status
4. Tests or verification run
5. Open risks/questions
6. Go/no-go recommendation

When applicable, include:
- exact constraints honored
- what was explicitly not implemented
- evidence of deterministic behavior

## 7) Go/No-Go Decision Rules

Automatic NO-GO if any are true:
- safety doctrine is missing or not applied
- hidden-state/diagnosis/personality/emotional-scoring claims appear
- evidence traceability fails for surfaced observations
- deterministic reproducibility fails
- UI/production surfacing occurs before QA and safety gates
- language drifts into therapy, optimization, or manipulation framing

GO requires all of the following:
- required stage artifacts complete
- Safety and QA pass status
- bounded scope maintained
- founder accepts residual risk profile

## 8) Overnight Work Rules

Overnight or unattended work must:
- stay inside previously approved lane scope
- avoid production-facing changes unless explicitly authorized
- produce audit-friendly artifacts (diffs, test outputs, reports)
- stop and mark NO-GO if a safety gate fails
- defer unresolved doctrine conflicts to founder decision
- include Conductor review before Night Shift or recursive continuation

Overnight work must not:
- invent new product philosophy
- silently widen claim scope
- bypass safety/QA checks for speed

## 9) Anti-Patterns To Reject

- fake AI coworker theater
- recursive agent swarm orchestration
- overbuilt management systems that do not improve truth quality
- skipping safety before semantic prototypes
- UI before evidence constraints
- production surfacing before QA hardening
- collapsing lane boundaries under "general intelligence" convenience

Conductor enforcement rule:
- if governance/doc structure expands without execution value, Conductor may pause or prune continuation

## 10) Trace Field Reference Example

Trace Field v0 is the reference loop for this protocol.

Sequence completed:
1. Research brief created (`docs/TRACE_FIELD_RESEARCH_BRIEF.md`)
2. Safety doctrine established (`docs/OBSERVATORY_SAFETY_DOCTRINE.md`)
3. Evidence constraints defined (`docs/TRACE_FIELD_V0_EVIDENCE_SPEC.md`)
4. QA gate/checklist created (`docs/TRACE_FIELD_SAFETY_QA_CHECKLIST.md`)
5. Language policy created (`docs/trace-field-approved-language.md`)
6. Internal deterministic harness built with evidence traces
7. QA hardening added with edge-case fixtures and deterministic rerun checks
8. Founder receives GO/NO-GO recommendation

Protocol lesson:
Wayword should move from conceptual clarity to enforceable constraints before any production interpretation surface is allowed.

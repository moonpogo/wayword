# Wayword Night Shift Protocol

Status: Canonical protocol for unattended multi-lane work  
Scope: Extends `WORKFLOW_PROTOCOL.md` for bounded overnight/autonomous continuation only.

## 1) Purpose

Night Shift exists to continue already-scoped work safely when the founder is offline.

Night Shift is:
- bounded autonomous continuation
- lane-scoped execution under doctrine
- artifact-first progress for next-day founder integration

Night Shift is not:
- general autonomy
- agent roleplay
- permission to invent product direction
- permission to widen doctrine or claims

## 2) When Night Shift Is Allowed

Night Shift is allowed only if all conditions are true:
- founder has defined a clear initiative
- lane scopes are explicit
- stop conditions are defined
- production-facing changes are prohibited or explicitly authorized
- morning report is required and pre-specified
- Conductor preflight recommends continue (not pause/prune)

If any condition is missing, Night Shift is NO-GO.

## 3) Initiative Brief Format

Each Night Shift initiative must include:
- initiative name
- founder intent
- decision question
- lanes involved
- scope boundaries
- shared docs/context
- deliverables
- allowed files/areas
- prohibited files/areas
- stop conditions
- expected morning report

Minimum brief standard:
- exact docs to use as authority
- explicit non-goals
- explicit production authorization status

## 4) Lane Assignment Format

For each lane, define:
- task
- authority
- dependencies
- deliverables
- no-go conditions
- report requirements

Assignment rule:
- no lane may self-expand beyond assignment without founder authorization.

## 5) Dependency Rules

Dependency rules are mandatory hard gates.

Examples:
- Architecture may not finalize privacy-sensitive designs before Safety outputs exist.
- Brand may not create claims beyond approved doctrine.
- UI may not be prototyped before evidence/spec constraints exist.
- Production surfacing may not occur before QA and Safety gates.
- Editorial may not approve language that bypasses Safety ceilings.
- QA may mark NO-GO even when implementation is complete.

If a required dependency is missing, the lane must stop and report NO-GO.

## 6) Stop Conditions

Night Shift must stop and report NO-GO if any condition appears:
- doctrine conflict appears
- safety contradiction appears
- scope expands beyond brief
- production-facing changes become necessary without authorization
- hidden-state or user-diagnosis language appears
- tests fail and cannot be resolved safely
- lane dependency is missing
- context is insufficient for a safe decision

Stop behavior:
- halt further expansion
- record exact blocking condition
- prepare founder escalation report

## 7) Escalation Rules

Unresolved conflicts must be deferred to founder decision.
Do not invent doctrine to resolve conflicts.

Conflict routing:
- Safety vs Observatory => Founder
- Brand vs Doctrine => Founder
- Architecture ambiguity => Architecture report + Founder
- Research uncertainty => Research report, no implementation leap
- QA failure => NO-GO until resolved

Escalation output must include:
- conflict summary
- options considered
- risks per option
- recommended founder decision point

## 8) Overnight Work Rules

Night Shift may:
- create docs
- create research briefs
- create internal harnesses
- create tests
- create non-production prototypes if explicitly allowed
- produce reports

Night Shift may not:
- auto-merge
- deploy
- alter production-facing user claims
- add payments
- change privacy posture
- introduce LLM or embedding inference
- widen product philosophy
- bypass QA or safety

Default mode:
- internal-only artifacts unless explicitly authorized otherwise.

## 9) Morning Report Format

Morning report must include:
- initiative name
- lanes activated
- files changed
- completed work
- blocked work
- safety status
- QA status
- doctrine conflicts
- open questions
- go/no-go recommendation
- recommended founder decision
- Conductor prune/continue recommendation

Report quality rule:
- prefer concise, verifiable facts over narrative volume.

## 10) Anti-Patterns

Reject the following:
- fake coworker theater
- agent swarms
- recursive management docs with no execution value
- unattended philosophy invention
- shipping while founder absent
- "while we were there, we also..." scope expansion
- high-volume low-judgment output

If Night Shift creates many docs but no decision value:
- classify as `PAUSE` or `PRUNE` via Conductor recommendation

Anti-pattern response:
- stop work
- classify as NO-GO
- return control to founder.

## 11) First Example Initiative (Template)

Example initiative name:
`Encrypted Local-First Observatory Architecture`

This example is a template, not an active execution order.

Founder intent:
- design a local-first encryption-ready observatory architecture path that preserves doctrine and privacy constraints.

Decision question:
- is there a viable v0 architecture path for encrypted local-first observatory storage and processing without changing product claims?

Lanes and template tasks:

Research:
- task: gather local-first encryption architecture precedents and summarize tradeoffs
- deliverable: research brief + reference matrix
- no-go: recommends implementation beyond approved scope

Safety/Privacy:
- task: define privacy/inference red lines for encrypted observatory data paths
- deliverable: safety constraints addendum
- no-go: unresolved deletion/inference contradiction

Architecture:
- task: draft modular storage/processing design options consistent with safety constraints
- deliverable: architecture options memo + dependency map
- no-go: design requires claim or privacy posture changes not approved by founder

QA:
- task: define verification plan for deterministic behavior and privacy guarantees
- deliverable: QA checklist + initial fixture plan
- no-go: unverifiable guarantees or missing reproducibility path

Editorial Doctrine:
- task: review technical framing language for doctrine consistency
- deliverable: approved wording guidance for internal docs
- no-go: language implies diagnosis, therapy, or certainty inflation

Brand/Marketing:
- task: prepare placeholder non-claim framing for future communication (internal only)
- deliverable: internal messaging constraints note
- no-go: claim expansion beyond approved doctrine

Founder morning decision target:
- GO to scoped internal prototype planning, or NO-GO pending unresolved safety/architecture conflicts.

## 12) Relationship To Workflow Protocol

This document extends `WORKFLOW_PROTOCOL.md`.
It does not replace the standard lane sequence, artifact requirements, or founder integration authority.

Canonical workspace location for initiative execution memory:
- `docs/initiatives/<initiative-name>/`
- Night Shift deliverables, morning reports, and founder decisions should be stored in the active initiative folder.

When conflicts exist between speed and doctrine:
- doctrine wins
- safety gates win
- founder decision is final

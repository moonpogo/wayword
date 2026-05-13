# Doctrine Audit V1

## 1. Document Inventory

| File | Current Purpose | Status | Major Concepts Owned |
| --- | --- | --- | --- |
| `docs/PROMPT_ARCHITECTURE_V1.md` | Canonical prompt doctrine for layered model and anti-patterns | **Canonical** | Entry/Torsion/Resonance, creative latency, progressive architecture, seasonal overlay, measurement boundaries |
| `docs/PROMPT_SYSTEM_V1_IMPLEMENTATION_PLAN.md` | Execution status for V1 prompt rollout | Supporting | V1 scaffold scope, local flag policy, V0 default, integration staging |
| `docs/PROMPT_SYSTEM_V1_1.md` | Current V0 prompt runtime family contract | Implementation-only (active runtime) | Scene/Relation/Pressure/Constraint/Calibration families, selection/reroll windows |
| `docs/PROMPT_TAXONOMY_AUDIT_V1.md` | Extraction and classification of existing runtime prompts | Supporting | Prompt inventory, Layer fit assessment, reject list |
| `docs/PROMPT_EDITORIAL_ANALYSIS_V1.md` | Editorial synthesis of taxonomy findings | Supporting | Failure modes, mechanical strengths, tonal drift, salvage analysis |
| `docs/EDITORIAL_DOCTRINE.md` | High-level editorial posture | **Canonical** | Encounter instrument, recognition over help, anti-therapy/productivity/guru voice |
| `docs/MIRROR_V1_DOCTRINE.md` | Mirror generation/selection doctrine | **Canonical** (Mirror domain) | Reflection scope/categories, suppression, non-diagnostic language rules |
| `docs/MIRROR_EVAL_SPEC.md` | Mirror evaluation protocol | Supporting | Pass/fail criteria, low-signal restraint, category evaluation |
| `docs/MIRROR_V1_EVAL_CORPUS.md` | Mirror test corpus with expected output behavior | Supporting | Case-based reflection expectations |
| `docs/WAYWORD_EVALUATION_CORPUS.md` | Broader mirror-centric evaluation corpus spec | Candidate for consolidation | Reflection quality and failure tags; overlaps Mirror eval docs |
| `docs/PATTERNS_OBSERVATORY_BRIEF.md` | Doctrine for Patterns as observatory/almanac | **Canonical** (Patterns philosophy) | Observatory framing, anti-dashboard stance, seasonality model |
| `docs/V1_PRODUCT_SPEC.md` | V1 user-facing product contract | **Canonical** | Surface-level behavior contract (Prompt, Mirror, Recent Runs, Patterns), non-goals |
| `docs/V1_ARCHITECTURE_SNAPSHOT.md` | Runtime architecture snapshot and seam map | Canonical for current implementation state, partially outdated in prompt section | Boot/load order, runtime seams, persistence, known fragility |
| `docs/STATE_FLOW.md` | Surface/state transition map | Supporting | Lifecycle transitions, gating behavior, panel coordination |
| `docs/STATE_CONTRACT_BASELINE.md` | Baseline contract for state flags and phase names | Implementation-only | State invariants, calibration flags, storage keys |
| `docs/BASELINE_BEHAVIOR.md` | Golden-path baseline behavior for seam migration | Supporting | Behavioral regression targets |
| `docs/SAVED_RUNS_PERSISTENCE.md` | Canonical persistence contract | **Canonical** (persistence) | Canonical vs legacy stores, read/write precedence |
| `docs/QA_REGRESSION_CHECKLIST.md` | Release hardening checklist | **Canonical** (QA gate) | Required checks, manual sanity flows |
| `docs/SEAM_REGRESSION_CHECKLIST.md` | Focused seam-specific regression checklist | Supporting | Post-submit/calibration/panel seam checks |
| `docs/BOOT_DEPENDENCY_MAP.md` | Script load-order dependency map | Supporting | Boot contracts, global dependencies |
| `docs/SYSTEM_OWNERSHIP.md` | Ownership map for major systems | Supporting, partially historical | Prompt/mirror/patterns ownership boundaries |
| `docs/STRUCTURAL_AUDIT.md` | Maintainability risk analysis | Supporting, partially historical | Coupling risks, script.js monolith risk, cleanup plan |
| `docs/V1_CHANGE_GUARDRAILS.md` | Pre-change risk guardrails | Supporting | Do-not-touch seams, verification requirements |
| `docs/V1_LAUNCH_CHECKLIST.md` | Manual launch readiness checklist | Supporting | Final pre-launch UX and trust checks |
| `docs/BUILD_LOG.md` | Chronological implementation log | Historical | Decisions, passes, regressions, structural changes |
| `README.md` | External-facing repo and product summary | Supporting | Public framing, architecture summary |

## 2. Canonical Doctrine Hierarchy

Recommended canonical set by domain:

- Product philosophy: `docs/V1_PRODUCT_SPEC.md` + `docs/EDITORIAL_DOCTRINE.md`
- Editorial voice: `docs/EDITORIAL_DOCTRINE.md`
- Prompt architecture: `docs/PROMPT_ARCHITECTURE_V1.md`
- Prompt implementation (current runtime reality):
  - default runtime: `docs/PROMPT_SYSTEM_V1_1.md`
  - rollout state: `docs/PROMPT_SYSTEM_V1_IMPLEMENTATION_PLAN.md`
- Mirror/reflection behavior: `docs/MIRROR_V1_DOCTRINE.md` + `docs/V1_PRODUCT_SPEC.md` (visible surface contract)
- Patterns/observatory: `docs/PATTERNS_OBSERVATORY_BRIEF.md` + `docs/V1_PRODUCT_SPEC.md`
- QA/runtime architecture:
  - architecture: `docs/V1_ARCHITECTURE_SNAPSHOT.md`
  - state transitions: `docs/STATE_FLOW.md`
  - persistence: `docs/SAVED_RUNS_PERSISTENCE.md`
  - QA gate: `docs/QA_REGRESSION_CHECKLIST.md`

## 3. Terminology Map

- `Entry`: prompt architecture doctrine (`PROMPT_ARCHITECTURE_V1`), V1 implementation plan; weakly reflected elsewhere.
- `Torsion`: only in prompt architecture + implementation plan (not in runtime docs).
- `Resonance`: only in prompt architecture + implementation plan (not in runtime docs).
- `creative latency`: explicit in prompt architecture; appears in prompt audit/analysis.
- `non-extractive`: explicit in prompt editorial analysis and implied by editorial doctrine.
- `reflection`: dominant in mirror doctrine/eval docs and product spec.
- `Mirror`: central in product spec, architecture, QA, structural docs.
- `Patterns`: central in observatory brief, product spec, architecture/state docs.
- `Observatory`: mostly in `PATTERNS_OBSERVATORY_BRIEF`; lightly referenced in prompt architecture.
- `residue`: appears in old prompt family language (`PROMPT_SYSTEM_V1_1`) and editorial doctrine; mixed meaning (aesthetic motif vs specific prompt wording).
- `prompt layers`: concept present in `PROMPT_ARCHITECTURE_V1`; mostly absent from runtime docs.
- `calibration`: deeply present in implementation/runtime state docs.
- `seasonal overlay`: only explicit in `PROMPT_ARCHITECTURE_V1`.

Terminology drift/conflicts:

- Prompt runtime docs still describe V0 family taxonomy (Scene/Relation/Pressure/Constraint), while prompt doctrine is now layer-based (Entry/Torsion/Resonance).
- `residue` is used as both editorial motif and rejected prompt-style signal, creating ambiguity.
- Mirror doctrine and prompt doctrine share non-diagnostic posture, but there is no shared term set linking “entry/torsion/resonance” to reflection behavior.

## 4. Redundancy / Conflict Analysis

Major redundancies:

- Mirror evaluation has overlapping docs: `MIRROR_EVAL_SPEC.md`, `MIRROR_V1_EVAL_CORPUS.md`, and `WAYWORD_EVALUATION_CORPUS.md`.
- Multiple architecture/ownership docs overlap (`V1_ARCHITECTURE_SNAPSHOT`, `SYSTEM_OWNERSHIP`, `STRUCTURAL_AUDIT`, `BOOT_DEPENDENCY_MAP`).
- Multiple regression docs overlap (`QA_REGRESSION_CHECKLIST`, `SEAM_REGRESSION_CHECKLIST`, `V1_LAUNCH_CHECKLIST`).

Major conflicts/drift:

- `V1_ARCHITECTURE_SNAPSHOT.md` prompt section still lists old families (`Observation`, `Relation`, `Tension`, `Possibility`, `Constraint`), which no longer matches current runtime docs (`PROMPT_SYSTEM_V1_1`) nor Prompt Architecture V1.
- `PROMPT_SYSTEM_V1_1.md` is accurate for default runtime behavior but conceptually conflicts with the new layered doctrine if treated as strategy rather than implementation snapshot.
- Prompt doctrine explicitly bans therapy/extraction tone; older prompt corpus analyses show many legacy prompts that violate this stance (expected historically, but needs explicit “legacy” labeling).
- Seasonal overlay is doctrinally defined but not integrated into implementation architecture docs as a tracked concept.

Docs that should be updated later:

- `V1_ARCHITECTURE_SNAPSHOT.md` (prompt family section and terminology alignment).
- `SYSTEM_OWNERSHIP.md` prompt subsection to distinguish V0 runtime vs V1 doctrine.
- `STATE_CONTRACT_BASELINE.md` prompt section terminology.

## 5. Consolidation Recommendations

Preserve unchanged (canonical anchors):

- `docs/V1_PRODUCT_SPEC.md`
- `docs/EDITORIAL_DOCTRINE.md`
- `docs/PROMPT_ARCHITECTURE_V1.md`
- `docs/MIRROR_V1_DOCTRINE.md`
- `docs/PATTERNS_OBSERVATORY_BRIEF.md`
- `docs/SAVED_RUNS_PERSISTENCE.md`

Update (not merge yet):

- `docs/V1_ARCHITECTURE_SNAPSHOT.md` (prompt terminology correction).
- `docs/PROMPT_SYSTEM_V1_IMPLEMENTATION_PLAN.md` (keep as active migration ledger).
- `docs/STATE_FLOW.md` and `docs/STATE_CONTRACT_BASELINE.md` (explicit prompt-mode notes: V0 default, V1 local flag).

Merge candidates:

- Mirror eval set: merge `MIRROR_EVAL_SPEC.md` + `WAYWORD_EVALUATION_CORPUS.md` structure into one evaluation protocol and keep `MIRROR_V1_EVAL_CORPUS.md` as concrete cases.
- Architecture ownership set: fold `BOOT_DEPENDENCY_MAP.md` key tables into `V1_ARCHITECTURE_SNAPSHOT.md`, keep one primary architecture doc and one maintainability audit appendix.

Mark deprecated (after replacement docs exist):

- `docs/WAYWORD_EVALUATION_CORPUS.md` (if Mirror eval protocol supersedes it).
- Sections in `docs/STRUCTURAL_AUDIT.md` and `docs/SYSTEM_OWNERSHIP.md` that duplicate corrected architecture snapshot.

Historical-only (retain, clearly labeled):

- `docs/BUILD_LOG.md`
- prior prompt taxonomy/editorial audit snapshots once migration is complete (`PROMPT_TAXONOMY_AUDIT_V1.md`, `PROMPT_EDITORIAL_ANALYSIS_V1.md`)

## 6. Reflection System Gap

Current Mirror doctrine is strong on restraint and non-diagnostic language, but behind the new prompt architecture in these ways:

- No explicit model for `Entry`, `Torsion`, `Resonance` as reflection contexts.
- No reflection-layer mapping for “language acts” or “movement from hesitation into language.”
- `residue` exists stylistically but not as a formal reflective analytic construct tied to prompt layers.
- Mirror docs avoid personality/therapy inference well, but mostly evaluate lexical/structural features rather than trajectory of linguistic movement.
- Non-extractive interpretation is present normatively, but not linked to layer-aware mirror outputs (for example, when to stay minimal in Entry vs when to hold impasse in Resonance).

Conclusion: Mirror doctrine is internally coherent for V1 surface behavior, but not yet architecturally coupled to Prompt Architecture V1’s layered model.

## 7. Next Documentation Moves

Recommended sequence before further prompt runtime expansion:

1. Add canonical cross-links and “scope labels” at top of key docs (`canonical`, `implementation snapshot`, `historical`).
2. Correct prompt terminology drift in `V1_ARCHITECTURE_SNAPSHOT.md` and `SYSTEM_OWNERSHIP.md`.
3. Add deprecation markers where overlap is known (do not delete yet).
4. Create `docs/REFLECTION_ARCHITECTURE_V1_BRIEF.md` linking Mirror doctrine to Entry/Torsion/Resonance and non-extractive movement observation.
5. Update `PROMPT_SYSTEM_V1_IMPLEMENTATION_PLAN.md` with doc-governance prerequisites for switching default from V0.
6. Keep runtime unchanged until doctrine hierarchy and terminology alignment are clean.

---

## Audit Scope

Inspected docs:

- `README.md`
- `docs/BASELINE_BEHAVIOR.md`
- `docs/BOOT_DEPENDENCY_MAP.md`
- `docs/BUILD_LOG.md`
- `docs/EDITORIAL_DOCTRINE.md`
- `docs/MIRROR_EVAL_SPEC.md`
- `docs/MIRROR_V1_DOCTRINE.md`
- `docs/MIRROR_V1_EVAL_CORPUS.md`
- `docs/PATTERNS_OBSERVATORY_BRIEF.md`
- `docs/PROMPT_ARCHITECTURE_V1.md`
- `docs/PROMPT_EDITORIAL_ANALYSIS_V1.md`
- `docs/PROMPT_SYSTEM_V1_1.md`
- `docs/PROMPT_SYSTEM_V1_IMPLEMENTATION_PLAN.md`
- `docs/PROMPT_TAXONOMY_AUDIT_V1.md`
- `docs/QA_REGRESSION_CHECKLIST.md`
- `docs/RITUAL_LOOP_V1_SPEC.md`
- `docs/SAVED_RUNS_PERSISTENCE.md`
- `docs/SEAM_REGRESSION_CHECKLIST.md`
- `docs/STATE_CONTRACT_BASELINE.md`
- `docs/STATE_FLOW.md`
- `docs/STRUCTURAL_AUDIT.md`
- `docs/SYSTEM_OWNERSHIP.md`
- `docs/V1_ARCHITECTURE_SNAPSHOT.md`
- `docs/V1_CHANGE_GUARDRAILS.md`
- `docs/V1_LAUNCH_CHECKLIST.md`
- `docs/V1_PRODUCT_SPEC.md`
- `docs/WAYWORD_EVALUATION_CORPUS.md`
- `src/app/README.md`

# Wayword V1 Architecture Snapshot

This document is a read-only snapshot of the current Wayword V1 architecture. Its purpose is to constrain pre-V1 changes to the real app shape that exists in the repo now.

Use this alongside:

- `docs/V1_PRODUCT_SPEC.md` for the visible V1 product contract
- `docs/V1_CHANGE_GUARDRAILS.md` for the pre-change checklist
- `docs/SAVED_RUNS_PERSISTENCE.md` for the canonical persistence contract
- `docs/QA_REGRESSION_CHECKLIST.md` for merge-time verification

## 1. Boot / Load Order

Wayword still depends on explicit script order in `index.html`.

Current high-level load sequence:

1. Inline boot script sets `data-theme` from local storage before first paint.
2. `mirror-engine.iife.js` loads first among app scripts so `globalThis.WaywordMirror` exists before app orchestration uses it.
3. `mirror-dom.js` loads before `script.js` to provide statement-only Mirror HTML helpers.
4. Mirror/controller, DOM, config, storage, app-state, app runtime helpers, run-document, writing-feature, and UI helper scripts load next.
5. `script.js` loads last and acts as the main runtime orchestrator.

Important implications:

- `index.html` is not passive markup; it is part of the app contract.
- `mirror-engine.iife.js` is a committed build artifact, not the source of truth.
- `runDocumentInit.js` attaches the canonical run-document repo and performs boot migration from legacy history into canonical storage.

Current app runtime helper layer in `src/app/`:

- `analysis-runtime.js` handles scoring and submit-time analysis helpers
- `app-boot-runtime.js` handles boot observer binding and initial render sequencing
- `app-events-runtime.js` handles primary event wiring
- `prompt-runtime.js` handles prompt-state orchestration and reroll flow
- `progression-runtime.js` handles progression-level state transitions
- `run-controller-runtime.js` handles run-controller dependency assembly and registration

Important constraint:

- these helpers are extraction seams, not independent feature owners yet
- `analysis-runtime.js`, `app-boot-runtime.js`, `app-events-runtime.js`, `prompt-runtime.js`, `progression-runtime.js`, and `run-controller-runtime.js` now own their behavior directly
- some event-specific helpers outside `src/app/` still retain local fallback paths in `script.js`

Current boot contract:

- boot observer binding and initial render sequencing now routes through `src/app/app-boot-runtime.js`
- `script.js` still owns later startup hooks that follow the initial render

Current event contract:

- editor input binding, document Escape/pointerdown handling, primary controls, and panel control wiring now route through `src/app/app-events-runtime.js`
- `script.js` still owns nearby non-runtime helper calls such as options-surface guards and feature-specific interaction seams

## 2. Core User Flow

The current user loop is:

1. Landing renders first.
2. `Begin` exits landing and enters the writing shell.
3. `startWriting()` initializes a new run.
4. A prompt is generated.
5. The user writes in the editor.
6. The user submits.
7. Mirror runs on the submitted draft.
8. Successful saved runs refresh Recent Runs and feed Patterns.
9. The user starts the next run from the same shell.

`startWriting()` is a protected seam. It resets run state, clears editor/post-run state, regenerates the prompt, resets rerolls, closes options/banned/patterns surfaces, and returns the editor to writable mode.

## 3. Mirror Pipeline

Mirror logic is deterministic TypeScript exposed through the browser IIFE bundle.

Primary pipeline:

- `analyzeText`
- `buildReflectionCandidates`
- `rankReflections`
- `dedupeReflections`
- `selectFinalReflections`

Primary source:

- `src/features/mirror/pipeline/runMirrorPipeline.ts`

Integration path:

- `mirror-engine.iife.js` exposes `globalThis.WaywordMirror`
- `src/features/mirror/mirror-controller.js` feature-detects bundle APIs
- `script.js` coordinates submit-time Mirror execution and post-run rendering

Current V1 Mirror contract:

- visible output is statement-only
- no visible evidence toggles or debug panels
- low-signal input can produce a restrained fallback
- saved runs may carry `mirrorPipelineResult` and `mirrorSessionDigest`

Current submit-time analysis / scoring contract:

- analysis and scoring orchestration now routes through `src/app/analysis-runtime.js`
- `script.js` still owns the surrounding write-doc and UI integration
- submit-time scoring and semantic flagging must stay aligned with the same analysis output shape

## 4. Prompt / Reroll System

Prompt content currently lives in `script.js`. Eligibility and selection rules live in `src/features/writing/prompt-selection.js`. Prompt-state orchestration now routes through `src/app/prompt-runtime.js`, which is the current source of truth for prompt generation and reroll behavior.

Current rules:

- 5 prompt families: `Observation`, `Relation`, `Tension`, `Possibility`, `Constraint`
- run start uses family spacing plus recent prompt suppression and near-duplicate suppression
- reroll is allowed only when the run is active, unsubmitted, the editor is still empty, and reroll budget remains
- reroll prefers in-family replacement first, then cross-family fallback

Protected invariants:

- reroll must not remain available after the user starts typing
- reroll and normal prompt generation must respect recent-id and near-duplicate suppression rules

## 4A. Progression System

Progression-level orchestration now routes through `src/app/progression-runtime.js`, which is the current source of truth for:

- stored progression-level reads
- inactivity easing on stale return
- post-run progression advancement and fallback
- applying active target words and timer state

Protected invariant:

- progression changes must continue to read from saved runs, not transient UI-only state

## 5. Recent Runs System

Recent Runs is one feature with two UI surfaces:

- mobile drawer
- desktop rail

Current data path:

- `readSavedRunsNewestFirst()` for drawer/rail rendering
- canonical read helper preferred when available
- fallback to in-memory legacy history only when the canonical read helper is absent

Current behavior shape:

- one shared view model is prepared
- both drawer and rail are rendered from that model
- row expansion behavior is synchronized conceptually across both surfaces

Protected invariant:

- drawer and rail must stay behaviorally aligned even though they are different DOM surfaces

## 6. Patterns System

Patterns is cross-run and digest-driven.

Current input source:

- saved `mirrorSessionDigest` records collected from saved runs

Current pipeline shape:

- `collectMirrorSessionDigestsFromHistory()` in `script.js`
- `getPatternsProfileFromDigests()` in `src/features/mirror/recent/getPatternsProfileFromDigests.ts`
- digest-only pattern selection in `src/features/mirror/patterns/runPatternsFromDigests.ts`

Current promoted pattern families:

- recurring signal
- shift over time
- consistency vs variation

Important contract:

- Patterns V1 is based on saved digests, not ad hoc UI state
- when the modern Patterns Mirror API is unavailable, the UI can still fall back to older aggregate callouts

## 7. Persistence System

Wayword V1 uses two local-first stores in parallel.

Canonical store:

- `wayword-run-documents-v1`

Legacy compatibility stores:

- `wayword-history`
- `wayword-runids`

Current write order:

1. assemble canonical document when helpers are available
2. project to a legacy-shaped row when possible
3. attempt canonical upsert first
4. always sync legacy history and run ids

Current read rule:

- Recent Runs, Patterns, and progression prefer canonical reads when `waywordSavedRunsRead` is present
- they do not merge legacy rows when canonical reads return empty

Boot repair behavior:

- `runDocumentInit.js` creates the repo
- migration backfills canonical docs from legacy history when needed

For the normative contract, use `docs/SAVED_RUNS_PERSISTENCE.md`.

## 8. Current Test Coverage

Automated coverage currently spans both logic and browser smoke checks.

Logic coverage:

- `tests/app-logic.test.cjs`
  - prompt selection and reroll gating
  - prompt runtime state updates and reroll behavior
  - analysis/scoring runtime behavior
  - progression runtime behavior
  - run-controller runtime dependency registration
  - app boot runtime behavior
  - app events runtime behavior
  - Recent Runs prep and interaction seams
  - Patterns transition seam
  - canonical persistence and legacy sync behavior
  - corrupt canonical envelope handling
  - legacy-to-canonical migration behavior
- `tests/mirror-pipeline.test.cjs`
  - determinism
  - dominant-category expectations
  - low-signal fallback
  - observational-language guardrails
- `tests/patterns-aggregation.test.cjs`
  - digest aggregation fixture expectations
  - qualifying-run count stability

Browser smoke coverage:

- `tests/browser-smoke.test.cjs`
  - begin -> write -> submit
  - Mirror visible after submit
  - no visible evidence controls
  - Recent Runs drawer/rail behavior
  - Patterns open after enough saved runs

## 9. Known Risks

The main known risks before V1 are architectural coupling risks, not feature gaps.

Highest-risk areas:

- `script.js` remains the main orchestration monolith
- `index.html` load order is part of runtime behavior
- feature-specific event helpers outside `src/app/` still keep some local fallback paths in `script.js`
- Mirror generation/ranking still has exact-string coupling risk across modules
- committed `mirror-engine.iife.js` can drift from TypeScript source if not verified
- Recent Runs has dual-surface synchronization risk
- canonical/legacy persistence can temporarily diverge if canonical upsert fails before later migration repair
- mobile focus mode, drawer, options, and Patterns coordination remains timing-sensitive

## 10. Do-Not-Touch-Casually Areas Before V1

Do not casually change any of the following without running the full pre-V1 checks:

- `index.html` script order or boot assumptions
- `Begin` entry path or `startWriting()` lifecycle behavior
- reroll eligibility or prompt suppression rules
- Mirror statement-only V1 output contract
- canonical-first plus legacy-sync persistence order
- Recent Runs drawer/rail synchronization rules
- Patterns digest qualification and aggregation path
- mobile/desktop panel coordination across options, Recent Runs, Patterns, and focus mode

## Maintenance Note

Update this snapshot when any of the following changes materially:

- boot/load ordering
- submit or save flow
- Mirror visible contract
- prompt/reroll rules
- persistence precedence or migration rules
- Recent Runs / Patterns coordination
- automated verification commands

# Current State

Snapshot of how this repo works today, written for future Codex work.
Use this as the default orientation before making changes.

For the consolidated operator manual, see [`WAYWORD_OPERATOR_MANUAL.md`](./WAYWORD_OPERATOR_MANUAL.md).

## Repository Shape

- `index.html` defines the load order and is part of the runtime contract.
- `script.js` is still the main runtime orchestrator.
- `mirror-engine.iife.js` is a committed build artifact, not the source of truth.
- `src/app/` holds thin runtime seams extracted from `script.js`.
- `src/features/` holds feature modules for writing, mirror, prompts, and UI coordination.
- `src/data/` owns canonical run-document persistence and migration helpers.
- `tests/` contains Node logic tests and Playwright smoke coverage.
- `docs/` already contains the V1 architecture, persistence, guardrail, and QA docs this layer should align with.

## Runtime Contract

- Boot order still matters. `index.html` loads the mirror bundle and helper scripts before `script.js`.
- `Begin` still enters the writing shell and calls `startWriting()`.
- Prompt reroll is only valid when the run is active, unsubmitted, and the editor is still empty.
- Mirror output is statement-only. There is no visible evidence UI in the current contract.
- Saved runs remain local-first and use canonical plus legacy storage together.
- Recent Runs is one feature with two surfaces: mobile drawer and desktop rail.
- Patterns is digest-driven and depends on saved mirror digests, not transient UI state.

## Current Source Files

- `src/app/app-boot-runtime.js` handles boot observer binding and initial render sequencing.
- `src/app/app-events-runtime.js` handles primary event wiring.
- `src/app/analysis-runtime.js` handles submit-time analysis and scoring helpers.
- `src/app/prompt-runtime.js` handles prompt-state orchestration and reroll flow.
- `src/app/progression-runtime.js` handles progression-level state transitions.
- `src/app/run-controller-runtime.js` handles run-controller dependency assembly.
- `src/features/mirror/pipeline/runMirrorPipeline.ts` is the deterministic Mirror pipeline source.
- `src/features/writing/prompt-selection.js` owns prompt eligibility and selection rules.
- `src/data/runs/savedRunPersistence.js` owns the successful save write path.
- `src/data/runs/savedRunsCanonicalRead.js` owns canonical saved-run reads.
- `src/data/runs/runDocumentInit.js` and `src/data/runs/migrateLegacyRunDocuments.js` handle boot repair and backfill.

## Test And Verification Surface

- `npm test` runs the logic suite.
- `npm run verify:merge` is the default non-Playwright gate for merge-sensitive work.
- `npm run test:smoke` runs browser smoke checks when Chromium is available.
- `npm run test:smoke:cross-browser` runs the same smoke coverage in Chromium, Firefox, and WebKit.
- `npm run verify:alpha` combines the merge gate with smoke coverage.
- `tests/app-logic.test.cjs` is the main seam coverage file for runtime helpers, persistence, and logic contracts.
- `tests/mirror-pipeline.test.cjs` covers the deterministic pipeline.
- `tests/patterns-aggregation.test.cjs` covers digest aggregation behavior.
- `tests/persistence-migration.test.cjs` covers storage and migration resilience.
- `tests/browser-smoke.test.cjs` covers the end-to-end visible flow.

## Current Working Conventions

- Keep changes narrow and path-scoped.
- Prefer tests and docs before runtime refactors when the task is diagnostic or operational.
- Do not assume legacy storage and canonical storage are interchangeable.
- Treat `index.html` script order as behavior, not styling.
- Treat `mirror-engine.iife.js` drift as a real issue whenever mirror logic changes.
- Keep wording plain and observational. Avoid hype and avoid adding new product claims.

## Useful References

- `docs/V1_ARCHITECTURE_SNAPSHOT.md`
- `docs/V1_CHANGE_GUARDRAILS.md`
- `docs/SAVED_RUNS_PERSISTENCE.md`
- `docs/QA_REGRESSION_CHECKLIST.md`
- `docs/STATE_FLOW.md`
- `src/app/README.md`

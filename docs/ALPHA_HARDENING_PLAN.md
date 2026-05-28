# ALPHA Hardening Plan

## Purpose
Wayword is now public enough that trust, durability, and coherence matter more than new features. This plan defines a near-term hardening path focused on reliability of saved runs, clear failure behavior, and release discipline in the current local-first architecture.

## Priority Order
1. Run persistence integrity
2. Storage/migration resilience
3. Failure-state language
4. Mobile writing-surface hardening
5. Release gate tightening

## Current Known Risk
Rapid back-to-back writing runs may be collapsing into one saved run or one observed run in Patterns/Season surfaces.

## Phase 1: Run Persistence Integrity
- Branch name: `hardening/run-persistence-integrity`
- Goal: Ensure each submit action produces one distinct saved run record and one distinct observable run across run history, Patterns, and Season surfaces.
- Files likely involved:
  - `src/data/runs/savedRunPersistence.js`
  - `src/data/storage.js`
  - `src/ui/render-patterns.js`
  - `script.js`
  - `tests/app-logic.test.cjs`
  - `tests/persistence-migration.test.cjs`
- Explicit non-goals:
  - No visual redesign of Patterns or Season surfaces
  - No prompt-system or doctrine copy changes
  - No schema/database expansion work
- Acceptance criteria:
  - Two fast consecutive submissions produce two distinct saved runs with distinct timestamps/identifiers
  - Patterns and Season surfaces reflect both runs without collapse
  - Refresh after submit preserves both runs
- Test commands:
  - `npm test`
  - `npm run verify:merge`

## Phase 2: Storage/Migration Resilience
- Branch name: `hardening/storage-migration-resilience`
- Goal: Harden run-document persistence and legacy migration paths so upgrades and partial data states do not lose runs or silently corrupt ordering.
- Files likely involved:
  - `src/data/storage.js`
  - `src/data/runs/`
  - `src/data/migrations/` (if present)
  - `tests/persistence-migration.test.cjs`
  - `tests/app-logic.test.cjs`
- Explicit non-goals:
  - No account/auth feature expansion
  - No telemetry expansion
  - No broad data model refactor
- Acceptance criteria:
  - Existing stored runs survive migration paths intact
  - Corrupt/partial legacy states fail safely with recoverable behavior
  - Run ordering remains stable after migration and refresh
- Test commands:
  - `npm test`
  - `npm run verify:merge`

## Phase 3: Failure-State Language
- Branch name: `hardening/failure-state-language`
- Goal: Make failure states explicit, calm, and actionable for signed-in/signed-out and sync-unavailable paths without doctrine drift.
- Files likely involved:
  - `src/ui/render-post-run.js`
  - `src/ui/render-patterns.js`
  - `src/infrastructure/auth/auth-session-runtime.js`
  - `script.js`
  - `tests/app-logic.test.cjs`
  - `tests/auth-session-runtime.test.cjs`
- Explicit non-goals:
  - No marketing copy rewrite
  - No net-new UI components
  - No change to core submission/persistence mechanics
- Acceptance criteria:
  - Failure states remain accurate for current runtime conditions
  - Signed-in and signed-out messaging stays coherent across surfaces
  - Tests pin critical failure-state strings and branches
- Test commands:
  - `npm test`
  - `npm run verify:merge`

## Phase 4: Mobile Writing-Surface Hardening
- Branch name: `hardening/mobile-writing-surface`
- Goal: Stabilize mobile writing behavior (especially Safari) so typing, submit behavior, and post-submit continuity remain reliable under real alpha usage.
- Files likely involved:
  - `src/app/app-events-runtime.js`
  - `src/features/writing/`
  - `style.css`
  - `tests/app-logic.test.cjs`
  - `tests/smoke/` (if present)
- Explicit non-goals:
  - No desktop interaction redesign
  - No typography/theme redesign
  - No broad editor architecture rewrite
- Acceptance criteria:
  - Mobile Enter/newline behavior matches intended submit model
  - No accidental submit or input loss during fast writing
  - Post-submit state remains stable on mobile refresh/re-entry
- Test commands:
  - `npm test`
  - `npm run verify:merge`

## Phase 5: Release Gate Tightening
- Branch name: `hardening/release-gate-tightening`
- Goal: Enforce a stricter pre-merge/pre-release gate so known-risk seams are always exercised before shipping.
- Files likely involved:
  - `package.json`
  - `tests/`
  - `docs/` (gate/checklist docs)
  - automation/sentinel config (if maintained in repo)
- Explicit non-goals:
  - No new product features
  - No runtime behavior change unrelated to testability
  - No CI platform migration
- Acceptance criteria:
  - Gate includes `npm test`, `npm run verify:merge`, and `npm run test:smoke` as non-optional alpha/public checks
  - Known-risk regressions (rapid consecutive runs, sparse Patterns state, mobile writing behavior) are covered by tests or explicit manual checklist steps
  - Release summaries include gate pass/fail evidence
- Test commands:
  - `npm run verify:alpha`

## Codex Operating Rules
- One branch, one risk.
- No visual redesign unless requested.
- No doctrine/copy drift.
- No broad refactors during bug fixes.
- Update tests before or alongside fixes.
- Run `npm test` and `npm run verify:merge` before final summary.

## Manual QA Checklist (Alpha Readiness)
- New run: First run saves and appears in post-run surfaces.
- Rapid consecutive runs: Two or more quick submissions remain distinct across history, Patterns, and Season.
- Refresh after submit: Reload preserves the latest saved run set and observed state.
- Mobile Safari writing: Typing/newline/submit behavior is stable and no text is lost.
- Patterns unlock/sparse state: Early-run states are coherent and non-contradictory.
- Account signed-in/signed-out copy: State language matches real auth/runtime status.
- Offline or sync-unavailable state (if testable): Local continuity remains clear and non-destructive.

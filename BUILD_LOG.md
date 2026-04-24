# Build Log

## 2026-04-24: Options coordination extraction

- Added new module `src/features/ui/options-coordination.js`.
- Extracted narrow Options wrapper/choreography from `script.js`:
  - `setOptionsOpen` wrapper logic
  - post-close focus recovery
  - Options panel pointer/click propagation guards
  - Options open/close control binding
  - Escape-to-close wrapper
- The new UI coordinator composes the existing lower-level Options helpers:
  - `src/features/writing/options-panel-transition-coordinator.js`
  - `src/features/writing/options-panel-interactions.js`
- `index.html` gained one required helper include before `script.js` so the extracted Options coordination global is available at boot.
- `script.js` shrank from 5621 lines to 5502 lines in this pass.
- Validation passed:
  - `npm test`
  - `npm run test:smoke`
  - `npm run verify:patterns-surface`
  - `npm run verify:mirror-bundle`
- Runtime behavior was intended to remain unchanged; this was a structural extraction only.

## 2026-04-24: Recent Runs coordination extraction

- Added new module `src/features/ui/recent-runs-coordination.js`.
- `script.js` now delegates Recent Runs coordination wrappers through that helper module instead of owning the wrapper layer inline.
- `index.html` gained one required helper include before `script.js` so the extracted Recent Runs coordination global is available at boot.
- Rendering, data shaping, persistence, and row HTML were intentionally not moved in this pass.
- Validation passed:
  - `npm test`
  - `npm run test:smoke`
  - `npm run verify:patterns-surface`
  - `npm run verify:mirror-bundle`
- During extraction, an init-order bug was found: `renderHistory()` could run before the new coordinator existed via the dev reset path. Coordinator initialization was moved earlier to fix that timing issue.
- Runtime behavior was intended to remain unchanged; this was a structural extraction only.

## 2026-04-24: UI panel coordination extraction

- Added new module `src/features/ui/panel-coordination.js`.
- Extracted narrow UI coordination helpers:
  - `closePanelsForAppEntry`
  - `closePanelsForFreshRun`
  - `armMobilePatternsToggleGuard`
  - `togglePatternsPanelFromStyleTab`
- Files touched by the extraction:
  - `index.html`
  - `script.js`
  - `src/features/writing/run-controller.js`
  - `src/features/ui/panel-coordination.js`
- `index.html` received one required helper script include before `script.js` so the extracted coordination global is available at boot.
- Validation passed:
  - `npm test`
  - `npm run verify:mirror-bundle`
  - `npm run verify:patterns-surface`
  - `npm run test:smoke`
- Runtime behavior was intended to remain unchanged; this was a structural extraction only.

## 2026-04-23: V1 architecture snapshot + guardrails

- Added `docs/V1_ARCHITECTURE_SNAPSHOT.md` to document the current V1 architecture as it exists in the repo now: boot/load order, core user flow, Mirror pipeline, prompt/reroll behavior, Recent Runs, Patterns, persistence, current test coverage, known risks, and pre-V1 do-not-touch areas.
- Added `docs/V1_CHANGE_GUARDRAILS.md` as a concise pre-change checklist for future Codex/Cursor work on V1-sensitive areas.
- Updated `docs/QA_REGRESSION_CHECKLIST.md` with a `Must run before V1-sensitive merge` section covering the current automated commands plus the remaining manual sanity passes that matter most before V1.
- No runtime behavior was intentionally changed in this pass.

## Current Pass: Visual polish — Recent Runs scrollbar + Patterns challenge CTA

- **`style.css`:** Recent Runs scrollbars: tail-of-file `#recentDrawerList` / `#writeView .recent-rail-list-clip #recentRailList` rules (`scrollbar-color` + WebKit + `color-scheme`) so WebKit does not repaint back to the default bright thumb after later overflow/history CSS loads.
- **`style.css`:** Patterns “Begin challenge” (`.patterns-challenge-block .exercise-btn`) — compact pill sizing + `margin-top` for spacing above the CTA; `.exercise-dot` scaled to match.

## Current Pass: Saved-run persistence contract

- Added **`docs/SAVED_RUNS_PERSISTENCE.md`**: single normative description of dual stores (canonical `wayword-run-documents-v1` vs legacy `wayword-history`), fixed write order in `waywordSavedRunPersistence`, read precedence via `waywordSavedRunsRead` vs `script.js` fallback when the read module is absent, boot migration (`mergeLegacyHistoryMissingIntoCanonicalStore`), corrupt envelope handling, and the explicit same-session gap when canonical upsert fails but legacy sync succeeds.
- **`docs/STATE_FLOW.md`** and **`docs/V1_PRODUCT_SPEC.md`**: cross-linked / clarified read fallback semantics (module missing ≠ “canonical list empty”).
- **`script.js`**: `readSavedRunsChronological` / `readSavedRunsNewestFirst` comments now point at the contract doc and state that an empty canonical list does not merge legacy rows when the read module is present.
- **`savedRunPersistence.js`**, **`savedRunsCanonicalRead.js`**: contract pointers in module headers.
- **`successful-submit-coordinator.js`**: when `persistSuccessfulSavedRun` is missing but `syncLegacySavedRunState` exists, delegate to the same legacy sync helper instead of duplicating push/id/persist ordering.
- **`tests/app-logic.test.cjs`**: strengthened canonical-failure test (full stack + inner repo length + read length); added corrupt JSON / unknown envelope-version tests; added legacy migration idempotency test; added `loadRunMigrationContext` helper.

## Current Pass: Patterns / mobile transition ownership seam

- **`showProfile`:** `script.js` no longer carries a second copy of open/close, mobile resolver, reduced-motion, and desktop `profile-view--recede` token logic. Single owner remains `window.waywordPatternsTransitionCoordinator` (`patterns-transition-coordinator.js`); close motion token stays module-private there.
- **Mobile editor focus:** `script.js` no longer duplicates `handleEditorBlur` / `handleDocumentPointerDown` when `waywordMobileEditorFocusGuard` is missing; boot always loads `mobile-editor-focus-guard.js` before `script.js`.
- **Tests:** added `node:test` coverage for mobile Patterns close via the transition coordinator (profile hidden, `patterns-open` / `keyboard-open` / `focus-mode-layout-snap` cleared, `state.isExpandedField` reset).
- **Unchanged:** `waywordViewController.syncPatternsLayoutMode` (rail vs app placement + body `patterns-open` for mobile layout mode), `render-patterns.js` / `render-post-run.js` copy and structure, style tab listeners in `script.js`.

## Current Pass: Recent Runs ownership seam

- **Row expansion + list interactions:** single owner `window.waywordRecentRunsInteraction` (`recent-runs-interaction.js`). Removed duplicate `toggleRecentEntry` implementation and export from `view-controller.js`.
- **`script.js`:** `bindRecentRunsSurfaceInteractions` no longer carries a second copy of click/key listeners when the interaction module is absent; production boot always loads `recent-runs-interaction.js` before `script.js`.
- **Tests:** exported `createClassList` from `tests/helpers/browser-context.cjs` for reuse; added `node:test` coverage for `toggleRecentEntry` accordion behavior (one open row, `aria-expanded`, expanded body `hidden`).
- **Unchanged by design:** `waywordRecentRunsViewPrep` (view-model prep), `waywordRecentRunsRenderCoordinator` (DOM list paint), `waywordRecentRunsTransition` (drawer/rail expanded chrome + Escape), `waywordHistoryRenderer` (row HTML), `applyRecentDrawerDomState` on `waywordViewController`, and the `renderHistory` fallback path when the render coordinator global is missing.

## Current Pass: V1 Browser Smoke Layer

- Added a zero-dependency Safari WebDriver smoke harness under `tests/browser-smoke.test.cjs`.
- Added `npm run test:smoke` for real browser checks of the V1 loop: begin, write, submit, Mirror render, no visible evidence controls, Recent Runs drawer behavior, and Patterns open after five saved runs.
- The smoke layer is opt-in and skips with an explicit prerequisite message when Safari WebDriver automation is not available on the machine running it.

## Current Repo State

- **Branch:** `main`
- **Base HEAD:** `a16bc93` — `Extract writing banned panel presentation`
- **Last commit time (author):** `2026-04-23T14:28:01-07:00`
- **Tracking:** `origin/main`
- **Working tree during this pass:** intentionally dirty with uncommitted V1 stabilization edits listed below

## Current Pass: Minimal V1 Regression Safety Net

- Added a zero-dependency `node:test` logic suite wired through `npm test`.
- New automated coverage now checks Mirror pipeline determinism and guardrails, Patterns aggregation fixtures, prompt selection suppression, Recent Runs view prep, and canonical saved-run seams.
- Browser smoke was not added in this pass because the repo does not currently include a lightweight browser automation dependency.

## Current Pass: Mirror Bundle Sync

- Rebuilt `mirror-engine.iife.js` with `npm run build:mirror`.
- `npm run verify:mirror-bundle` now passes.
- `npm run verify:patterns-surface` passes after the bundle sync.

## Current Pass: V1 Source-of-Truth Stabilization

This pass is a working-tree stabilization pass, not a released commit.

- **V1 evidence decision:** Mirror evidence remains internal in V1.
- **Visible V1 Mirror contract:** user-facing Mirror cards render the refined observational statement only.
- **Not part of V1 UX:** no visible evidence toggle, accordion, context panel, or `Context` / `Hide` control.

### What this pass updates

- Fills `docs/V1_PRODUCT_SPEC.md` as the current V1 product source of truth.
- Reconciles `MIRROR_V1_DOCTRINE.md`, `docs/STATE_FLOW.md`, and `docs/QA_REGRESSION_CHECKLIST.md` to the same evidence contract.
- Adds source-of-truth notes to historical / partially stale engineering docs.
- Removes dead runtime evidence-toggle wiring that no longer corresponds to rendered DOM.

### Files changed in this pass

- `BUILD_LOG.md`
- `MIRROR_V1_DOCTRINE.md`
- `README.md`
- `STRUCTURAL_AUDIT.md`
- `SYSTEM_OWNERSHIP.md`
- `docs/QA_REGRESSION_CHECKLIST.md`
- `docs/STATE_FLOW.md`
- `docs/V1_PRODUCT_SPEC.md`
- `mirror-dom.js`
- `script.js`
- `src/features/mirror/types/mirrorTypes.ts`
- `src/features/writing/recent-runs-interaction.js`
- `src/features/writing/recent-runs-render-coordinator.js`
- `src/ui/render-patterns.js`
- `src/ui/render-post-run.js`
- `src/ui/view-controller.js`

### Runtime cleanup completed

- Removed stale post-run / recent-runs / patterns evidence-toggle wiring from `script.js`.
- Simplified `mirror-dom.js` and `src/ui/render-patterns.js` so visible cards no longer pass unused evidence-panel ids.
- Removed recent-runs interaction plumbing whose only job was collapsing nonexistent evidence panels.
- Updated comments and type docs to match the statement-only V1 Mirror surface.

### Intentionally not changed in this pass

- Prompt selection logic
- Mirror scoring / ranking / selection logic
- Recent Runs behavior outside dead evidence wiring
- Patterns behavior outside stale evidence references
- Mobile layout behavior
- Mirror bundle artifact contents

## Validation

- `npm run verify:patterns-surface` — **passed**
- `npm run verify:mirror-bundle` — **failed**
  - Result: committed `mirror-engine.iife.js` is still out of sync with `src/features/mirror/**`
  - Note: this is a preexisting bundle-drift issue; this pass did not rebuild or commit the bundle artifact

## Follow-up Risks Left Open

- `mirror-engine.iife.js` still needs a separate bundle-sync pass.
- Dead evidence CSS selectors remain in `style.css`; they are no longer wired in the active runtime, but the stylesheet cleanup was left out of this narrow pass.
- Broader ownership issues in `script.js`, persistence ambiguity, and browser smoke-test coverage remain out of scope for this change.

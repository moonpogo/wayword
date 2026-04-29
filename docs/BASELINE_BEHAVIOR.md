# Baseline Behavior

Phase 0 snapshot for Wayword V1 structural stabilization. This records current behavior to preserve during seam migration. Product source of truth remains `docs/V1_PRODUCT_SPEC.md`.

## Golden Path

| Flow | Current behavior | Primary owners |
| --- | --- | --- |
| Landing -> Begin | App boots into `#landingView`; `#appView` is aria-hidden. `Begin` exits landing, enters app shell, and calls `startWriting({ deferEditorFocus: true })`. | `index.html`, `src/ui/view-controller.js`, `src/app/app-events-runtime.js`, `src/features/writing/run-controller.js` |
| Writing prompt appears | `startWriting()` clears run/post-submit state, applies progression, generates a prompt, empties editor, closes panels, and renders writable editor state. | `script.js`, `src/app/prompt-runtime.js`, `src/features/writing/run-controller.js` |
| Reroll before typing | Prompt reroll is available only while active, unsubmitted, editor text is empty, and reroll budget remains. It prefers same-family replacement, then cross-family fallback. | `script.js`, `src/app/prompt-runtime.js`, `src/features/writing/prompt-selection.js` |
| Typing locks reroll | Editor input flushes into `state.writeDoc`, starts timer on first meaningful input, updates prompt card and submit visibility; reroll becomes unavailable once editor text is non-empty. | `src/app/app-events-runtime.js`, `script.js` |
| Submit | Submit requires an active run. It flushes editor text, analyzes draft, locks submitted state, computes score/run payload, runs Mirror, decides save eligibility, persists qualifying runs, and refreshes post-run surfaces. | `src/features/writing/run-controller.js`, submit coordinators, `script.js` |
| Calibration run 1 post-submit | Early calibration submits use in-editor calibration overlay/post-run baseline behavior. Below-editor Mirror card is suppressed while calibration baseline post-submit owns the reflection surface. | `script.js`, `src/ui/render-post-run.js`, `src/features/writing/completion-aftermath-helper.js` |
| Calibration run 5 handoff | When the saved run crosses `CALIBRATION_THRESHOLD` and handoff is not acknowledged, `state.calibrationHandoffVisible` is set and the handoff section is shown. Normal completed restart shortcuts are blocked while handoff is visible. | `script.js`, `src/features/writing/successful-submit-coordinator.js`, `src/features/writing/completed-ui-restart-interactions.js` |
| Handoff Continue | Acknowledges `wayword-calibration-handoff-ack`, hides handoff, and starts a fresh run with caret at start. | `script.js` |
| Handoff View Patterns | Acknowledges handoff, hides handoff, opens Patterns, syncs writing/post-run UI, and queues viewport sync. | `script.js`, `src/features/writing/patterns-transition-coordinator.js` |
| Normal post-calibration Mirror submit | Post-calibration submit renders statement-only Mirror output when available, optional recent-trends block, and next-pass nudge. No visible evidence toggles are part of V1. | `mirror-engine.iife.js`, `mirror-dom.js`, `src/ui/render-post-run.js`, `script.js` |
| Recent Runs drawer/rail | Saved runs are read newest-first. Mobile uses drawer; desktop uses rail. Drawer/rail render from one view model with different caps and shared row behavior. | `src/features/writing/recent-runs-view-prep.js`, `src/features/writing/recent-runs-render-coordinator.js`, `src/ui/render-history.js`, `script.js` |
| Patterns open/close | Patterns unlocks after enough saved runs. Desktop places `#profileView` in side column; mobile opens a patterns surface and exits focus mode if needed. Closing restores writing layout. | `script.js`, `src/ui/view-controller.js`, `src/features/writing/patterns-transition-coordinator.js` |
| Clear saved runs | Patterns footer opens confirmation modal. Confirm resets calibration/saved-run state, clears canonical run docs when repo exists, persists empty legacy history/run ids, and returns app to fresh calibration posture. | `script.js`, `src/data/storage.js`, `src/data/runs/runDocumentRepository.js` |

## Needs Browser Verification

- Exact DOM/class snapshots for calibration run 1 overlay, calibration run 5 handoff, and low-signal Mirror.
- Mobile keyboard/focus behavior on Safari-specific `visualViewport` timing.
- Same-session UI after canonical upsert failure with legacy fallback persistence.

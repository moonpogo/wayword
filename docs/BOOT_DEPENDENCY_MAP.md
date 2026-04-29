# Boot Dependency Map

Current `index.html` script order is part of the runtime contract. `script.js` loads last and consumes globals created by earlier scripts.

## Load Order Before `script.js`

| Order | Script | Major globals / contract |
| ---: | --- | --- |
| 1 | `mirror-engine.iife.js` | `globalThis.WaywordMirror` deterministic Mirror API |
| 2 | `mirror-dom.js` | `globalThis.WaywordMirrorDom` statement-only Mirror HTML helpers |
| 3 | `src/features/mirror/mirror-controller.js` | `window.waywordMirrorController` |
| 4 | `src/dom/elements.js` | `window.waywordDomElements` |
| 5 | `src/config/constants.js` | `window.waywordConfig` |
| 6 | `src/data/storage.js` | `window.waywordStorage` |
| 7 | `src/app/app-state.js` | `window.waywordAppState` |
| 8 | `src/app/analysis-runtime.js` | `window.waywordAnalysisRuntime` |
| 9 | `src/app/app-boot-runtime.js` | `window.waywordAppBootRuntime` |
| 10 | `src/features/writing/mobile-editor-caret-reveal.js` | `window.waywordMobileEditorCaretReveal` |
| 11 | `src/app/app-events-runtime.js` | `window.waywordAppEventsRuntime` |
| 12 | `src/app/prompt-runtime.js` | `window.waywordPromptRuntime` |
| 13 | `src/app/progression-runtime.js` | `window.waywordProgressionRuntime` |
| 14 | `src/app/run-controller-runtime.js` | `window.waywordRunControllerRuntime` |
| 15 | `src/data/run-model.js` | `window.waywordRunModel` |
| 16-24 | `src/data/runs/*` | schema constants, run document utils/model/markdown/repo/migration/init/read/persist globals |
| 25-27 | Prompt/semantic writing helpers | prompt selection/interactions and semantic picker globals |
| 28 | `src/features/writing/post-submit-phase.js` | `window.waywordPostSubmitPhase`; pure post-submit phase derivation and restart/render policy helpers |
| 29 | `src/features/writing/completed-ui-restart-interactions.js` | `window.waywordCompletedUiRestartInteractions`; consumes `waywordPostSubmitPhase` |
| 30-56 | Remaining `src/features/writing/*` helpers | editor, focus, viewport, submit, completion, options, patterns, and run-controller globals |
| 57 | `src/ui/render-history.js` | `window.waywordHistoryRenderer` |
| 58-60 | Recent Runs helpers | view prep, render coordinator, interaction/transition globals |
| 61-63 | `src/features/ui/*` | panel, recent-runs, options coordination globals |
| 64 | `src/ui/render-patterns.js` | `window.waywordPatternsRenderer` |
| 65 | `src/ui/patterns-repeat-lexical-gate.js` | `window.waywordPatternsLexicalGate` |
| 66 | `src/ui/render-post-run.js` | `window.waywordPostRunRenderer` |
| 67 | `src/ui/view-controller.js` | `window.waywordViewController` |
| 68 | `script.js` | Main orchestrator; consumes all above |

## `script.js` Consumes

- Mirror: `WaywordMirror`, `WaywordMirrorDom`, `waywordMirrorController`.
- DOM/config/state: `waywordDomElements`, `waywordConfig`, `waywordStorage`, `waywordAppState`.
- Runtime seams: `waywordAnalysisRuntime`, `waywordAppBootRuntime`, `waywordAppEventsRuntime`, `waywordPromptRuntime`, `waywordProgressionRuntime`, `waywordRunControllerRuntime`.
- Run persistence: `waywordRunModel`, `waywordRunDocumentRepo`, `waywordSavedRunsRead`, `waywordSavedRunPersistence`.
- Writing helpers: `waywordPostSubmitPhase`, `waywordCompletedUiRestartInteractions`, run controller, submit prep, submit Mirror analysis, completion decision/aftermath, successful submit, post-submit reconciler, prompt interactions, focus/viewport/options/patterns coordinators.
- UI renderers: `waywordHistoryRenderer`, `waywordRecentRunsViewPrep`, `waywordRecentRunsRenderCoordinator`, `waywordPatternsRenderer`, `waywordPostRunRenderer`, `waywordViewController`.

## Bundle Freshness

- `mirror-engine.iife.js` is a committed bundle generated from `src/features/mirror/entry-iife.ts`.
- Rebuild with `npm run build:mirror` after Mirror TypeScript changes.
- Verify with `npm run verify:mirror-bundle`.
- `index.html` comment requires bumping cache tokens when changing `mirror-engine.iife.js`, `script.js`, or cached Patterns UI scripts.

## Needs Browser Verification

- Exact failure mode if one intermediate helper script fails to load.
- Whether Vercel Insights deferred script affects any boot timing in deployed environments.

# App Runtime Seams

`src/app/` holds thin runtime helpers extracted from `script.js`.

These files do not replace `script.js` yet.
They exist to isolate dense orchestration seams while progressively moving behavior ownership out of `script.js`.

Current helpers:

- `app-state.js`
  Initializes the shared browser app state object.
- `analysis-runtime.js`
  Scoring and submit-time analysis helpers.
  This is now the source of truth for analysis/scoring orchestration.
- `app-boot-runtime.js`
  Boot-time observer wiring and initial render sequencing.
  This is now the source of truth for boot sequencing orchestration.
- `app-events-runtime.js`
  Primary editor, document, and panel event binding.
  This is now the source of truth for app event wiring orchestration.
- `prompt-runtime.js`
  Prompt generation history updates and reroll coordination.
  This is now the source of truth for prompt-state orchestration.
- `progression-runtime.js`
  Progression-level load, recompute, persist, and state application.
  This is now the source of truth for progression-state orchestration.
- `run-controller-runtime.js`
  Run-controller dependency assembly and registration.
  This is now the source of truth for run-controller dependency registration.

Working rule:

- If a runtime helper changes, `script.js` remains the behavioral fallback until the helper is trusted.
- `analysis-runtime.js`, `app-boot-runtime.js`, `app-events-runtime.js`, `prompt-runtime.js`, `progression-runtime.js`, and `run-controller-runtime.js` are the current exceptions: `script.js` delegates to them directly.
- Remaining event-specific fallback protection now lives in feature helpers outside this directory, such as editor-shell and inline-banned interactions.

This directory is intended to make the orchestration seams easier to test and eventually easier to bundle.

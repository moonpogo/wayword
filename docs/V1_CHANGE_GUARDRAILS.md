# Wayword V1 Change Guardrails

Use this checklist before making any V1-sensitive change.

## Hard Warnings

- Do not change `index.html` script order casually. It defines runtime boot sequencing.
- Do not change the `Begin` -> `startWriting()` flow casually. It is the core run lifecycle seam.
- Do not change reroll eligibility casually. V1 depends on reroll being limited to active, unsubmitted, empty-editor state.
- Do not change prompt suppression rules casually. Recent-id and near-duplicate suppression are part of current behavior.
- Do not change the Mirror statement-only contract casually. V1 does not show evidence controls or debug UI.
- Do not change canonical-plus-legacy persistence order casually. Canonical upsert attempt before legacy sync is intentional.
- Do not change Recent Runs drawer/rail synchronization casually. One feature is rendered through two coordinated surfaces.
- Do not change Patterns digest qualification casually. Patterns V1 is digest-driven and deterministic.
- Do not change mobile/desktop panel coordination casually. Options, focus mode, Recent Runs, and Patterns already share fragile layout state.

## Pre-Change Checklist

- Read `docs/V1_ARCHITECTURE_SNAPSHOT.md`.
- Read `docs/V1_PRODUCT_SPEC.md`.
- Read `docs/SAVED_RUNS_PERSISTENCE.md` if the change touches save/load behavior.
- Identify whether the change touches boot order, run lifecycle, Mirror, prompts, Recent Runs, Patterns, or persistence.
- Confirm whether the change affects both mobile and desktop paths.
- Confirm whether the change affects both drawer and rail Recent Runs surfaces.
- Confirm whether the change affects both canonical and legacy storage behavior.
- Confirm whether the change affects committed bundle expectations for `mirror-engine.iife.js`.

## Required Verification For V1-Sensitive Work

- Run **`npm run verify:merge`** as the default bundled gate (runs `npm test`, `node --check script.js`, `verify:mirror-bundle`, and `verify:patterns-surface`; no Playwright).
- Run **`npm run test:regression`** when Playwright is available (adds browser smoke on top of the same logic + syntax checks).
- Run the manual sanity items in `docs/QA_REGRESSION_CHECKLIST.md` for any risk not fully covered by automation.

## Escalate Before Merging If The Change Touches

- `index.html`
- `script.js` run lifecycle or submit flow
- `src/features/writing/prompt-selection.js`
- `src/data/runs/*`
- `src/features/mirror/pipeline/*`
- `src/features/mirror/recent/*`
- Recent Runs drawer/rail rendering or interaction seams
- focus mode, patterns transitions, or viewport coordination

## Non-Goals For Guardrail Passes

- no runtime refactors
- no product-copy rewrites
- no CSS cleanup
- no bundle rebuild unless explicitly required by the intended change

If a change needs to cross one of these guardrails, document the reason in `docs/BUILD_LOG.md` and call out the risk explicitly in the PR or task summary.

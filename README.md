# Wayword

Wayword is a local-first writing practice for noticing language patterns across short, bounded runs.

Live app: https://wayword.me/

Most writing tools try to improve your writing. Wayword helps you notice how you write.

It is not a notes app, document editor, writing coach, diagnostic tool, or AI writing assistant. It is a browser-based space for observation: write from a prompt, submit the run, then review restrained reflections about visible patterns in the draft and across saved runs.

## Core Loop

1. Begin a run.
2. Receive a prompt.
3. Write without interruption.
4. Submit the draft.
5. Review Mirror observations.
6. Return through Recent Runs and Patterns over time.

## Current Product

- Prompted writing runs designed for reflection.
- Submit-time Mirror observations over the current draft.
- Recent Runs for reviewing saved local history.
- Patterns for cross-run signals when enough saved runs qualify.
- Browser-local persistence through `localStorage`.
- Desktop and mobile writing surfaces.

Wayword keeps its visible feedback observational. It does not grade, diagnose, rewrite, infer identity, or tell the writer what to do next.

## Tech Stack

- HTML, CSS, and JavaScript for the browser app.
- TypeScript for the deterministic Mirror and Patterns pipelines.
- esbuild for the committed browser IIFE bundle.
- Playwright and Node's built-in test runner for smoke and logic coverage.
- No frontend framework and no backend service.

## Architecture

Wayword is currently a static browser app with explicit script ordering in `index.html`. The main runtime still flows through `script.js`, with dense orchestration being extracted into smaller helpers under `src/app/` and feature modules under `src/features/`.

The Mirror pipeline is deterministic TypeScript compiled into `mirror-engine.iife.js`, then consumed by browser runtime controllers. Submit-time analysis produces statement-only Mirror output for the current draft and stores digest data for later cross-run Patterns.

Saved runs are local-first. The app writes a canonical run-document store (`wayword-run-documents-v1`) while maintaining legacy history keys for compatibility and migration repair.

Key docs:

- `docs/V1_PRODUCT_SPEC.md`
- `docs/V1_ARCHITECTURE_SNAPSHOT.md`
- `docs/SAVED_RUNS_PERSISTENCE.md`
- `docs/QA_REGRESSION_CHECKLIST.md`
- `src/app/README.md`

## Run Locally

```sh
npm install
npm run preview:live
```

`preview:live` is the canonical local preview command. It kills stale preview processes, starts a fresh server on `127.0.0.1:3001`, health-checks `/__health`, and only reports success when the app is actually reachable.

The preview server serves the static app locally. The production app is deployed at https://wayword.me/.

## Verification

```sh
npm test
npm run test:smoke
npm run verify:merge
npm run test:regression
```

Additional evaluation commands:

```sh
npm run eval:mirror
npm run eval:patterns
```

Bundle and surface checks:

```sh
npm run build:mirror
npm run verify:mirror-bundle
npm run verify:brand-lock
npm run verify:patterns-surface
```

Brand lock: `assets/brand/wayword-logo.svg` is hash-locked to the canonical logo asset. Redraw/replacement must be explicitly approved and intentionally updated.

Social asset generation (dev-only):

```sh
npm run generate:social-assets
```

Each run writes a dated batch:

- `artifacts/social/YYYY-MM-DD/pinterest/`
- `artifacts/social/YYYY-MM-DD/square/`
- `artifacts/social/YYYY-MM-DD/raw-screenshots/`
- `artifacts/social/YYYY-MM-DD/metadata/`

Profiles (deterministic fixtures):

- `sparse_user`
- `steady_user`
- `intense_user`
- `clustered_user`
- `nocturnal_user`
- `calibration_user`
- `returning_user`

Every exported image has matching metadata JSON in `metadata/`, and all rows are aggregated in `metadata/pinterest-assets.csv` for upload workflows.

Useful flags:

```sh
node scripts/generate-social-assets.js --profile=intense_user --state=seasonal-wheel --count=20 --seed=1234 --fresh
```

- `--profile=<name>` chooses one fixture profile.
- `--state=<state>` chooses one app state.
- `--count=<n>` sets scenario batch size (default weekly batch is 20–40 assets depending on states/compositions).
- `--seed=<value>` keeps output deterministic.
- `--fresh` recreates the current dated folder from scratch.

The CSV includes:

- filename
- board recommendation
- title
- description
- alt text
- source app state
- fixture profile
- suggested tags

All fixtures are dev-only generation data. They are injected only during asset capture and do not change production behavior or user data.

## Status

Wayword is in active V1 development. The current focus is preserving the core writing loop while reducing orchestration risk, keeping Mirror output restrained, and improving the reliability of local saved-run flows.

Known constraints are documented in `docs/V1_ARCHITECTURE_SNAPSHOT.md`, including the remaining `script.js` monolith, explicit load-order dependency, committed Mirror bundle, dual Recent Runs surfaces, and local persistence migration path.

## AI-Assisted Development

Wayword has been built with AI-assisted development in Cursor and Codex. The assistance is part of the working process: implementation support, refactoring, review, and documentation drafting. Product direction, taste, verification, and final responsibility remain human-owned.

The project is intentionally positioned as software built with AI assistance, not as an AI writing assistant for users.

# Known Risks

This repo has a few durable risk areas that matter for future Codex tasks.
Use this list to keep work scoped and verification honest.

## Boot And Load Order

- `index.html` script order is part of runtime behavior.
- The app still relies on `mirror-engine.iife.js` being loaded before `script.js`.
- Any change to startup sequencing can fail in ways that look like harmless markup edits.

## Main Runtime Monolith

- `script.js` still owns a large portion of orchestration.
- Neighboring helpers in `src/app/` are extraction seams, not fully independent owners yet.
- A small change in one seam can still affect downstream flow in `script.js`.

## Persistence Split

- Saved runs use canonical documents and legacy history at the same time.
- Canonical reads and legacy in-memory fallback are not interchangeable.
- Migration and repair behavior can make same-session reads differ from a full reload.

## Mirror Bundle Drift

- `mirror-engine.iife.js` is committed and can drift from TypeScript source.
- Mirror logic changes may require a bundle rebuild even when source tests pass.
- Surface checks exist because the committed artifact is part of the runtime contract.

## Recent Runs And Patterns

- Recent Runs is rendered through both a mobile drawer and a desktop rail.
- Patterns depends on saved digests and cross-run aggregation.
- Changes that improve one surface can break the other if they are not checked together.

## Prompt Flow

- Reroll is intentionally narrow.
- Prompt suppression and near-duplicate suppression are part of the current behavior.
- A change that sounds like copy cleanup can still alter eligibility or selection behavior.

## Mobile And Browser Coverage

- Browser smoke requires Chromium and a working local test environment.
- Some mobile layout or typing issues are still easier to catch by smoke than by logic tests.
- A passing logic suite does not guarantee the visible flow is healthy.

## Operational Risk

- The repo is often dirty when work starts.
- Existing unrelated edits should be preserved unless the user asks otherwise.
- Verification should be interpreted against the current checkout, not an assumed clean state.


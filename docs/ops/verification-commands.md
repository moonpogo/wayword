# Verification Commands

Run the smallest command set that matches the change.
Prefer non-runtime checks first when the task is docs-only or test-only.

## Baseline Gates

- `npm test`
  - Main Node logic suite.
  - Use when the change touches runtime seams, persistence, prompts, mirror logic, or shared helpers.
- `npm run verify:merge`
  - Default non-Playwright merge gate.
  - Runs `npm test`, `node --check script.js`, `npm run verify:mirror-bundle`, `npm run verify:brand-lock`, and `npm run verify:patterns-surface`.
- `npm run test:smoke`
  - Browser smoke checks.
  - Use when the visible flow, mobile behavior, or interaction surfaces changed and Chromium is available.
- `npm run verify:alpha`
  - Strongest shipped-flow gate in package scripts.
  - Use when both merge safety and browser smoke matter.

## Narrow Checks

- `node --check script.js`
  - Syntax check for the frozen runtime bundle.
- `npm run verify:mirror-bundle`
  - Checks committed Mirror bundle consistency.
- `npm run verify:brand-lock`
  - Confirms the locked brand asset still matches the canonical asset.
- `npm run verify:patterns-surface`
  - Checks committed patterns surface strings.
- `npm run test:browser:run-parity`
  - Narrow browser parity check for the back-to-back submit path.
- `npm run test:logic`
  - Direct logic suite when you want the full Node coverage without the wrapper script.

## When To Use What

- Docs-only change: usually no runtime verification is needed, but run a doc review pass and confirm no source files changed.
- Test-only change: run the targeted test file or the relevant package script, then `npm test` if the change spans shared seams.
- `script.js` or `index.html` change: run `npm run verify:merge` at minimum.
- Visible UI change: run `npm run verify:merge` and `npm run test:smoke` if Chromium is available.
- Persistence change: run `npm test` and the migration-related tests before anything broader.
- Mirror pipeline change: run `npm test` and `npm run verify:mirror-bundle`.

## Evidence To Record

- Exact command list.
- Pass or fail for each command.
- Any missing prerequisite, such as Chromium, Playwright install, or a dirty checkout limitation.
- Any command skipped and the reason it was skipped.


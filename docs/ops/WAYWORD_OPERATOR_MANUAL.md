Read this before making any Wayword code changes.

# Wayword Operator Manual

## Purpose

This manual is the durable, repo-owned starting point for Wayword work.
It consolidates the current ops docs so future ChatGPT and Codex sessions can begin from the same workflow without depending on chat history.

Use this file as the first read when starting a new task.
Treat the repository, GitHub, and the docs in `docs/ops/` as the source of truth.
Use chat as support for strategy, architecture, review, and product ownership, not as the record of truth.
Use Codex as the implementation contractor that works from a scoped work order before editing code.

## Default Workflow

1. Read this manual first.
2. Read the task-specific ops docs if the work is narrow or risky.
3. Confirm the scope in a work order before changing files.
4. Keep the change path-scoped and preserve unrelated local work.
5. Use the smallest verification set that matches the task.
6. Report exactly what changed, what was verified, and any uncertainty.

## Current Repo State

- `index.html` defines load order and is part of runtime behavior.
- `script.js` remains the main orchestration surface.
- `mirror-engine.iife.js` is a committed artifact and can drift from the TypeScript source.
- Mirror output is statement-only.
- Saved runs use canonical and legacy storage together.
- Recent Runs is a dual-surface feature: mobile drawer and desktop rail.
- Patterns is digest-driven.
- `npm run verify:merge` is the default non-Playwright merge gate.

## Do Not Touch

These areas are high-risk or intentionally stable and should not change unless the task explicitly calls for it.

- `index.html` script order.
- The `Begin` to `startWriting()` flow.
- Prompt reroll eligibility.
- The statement-only Mirror surface.
- Canonical plus legacy persistence order.
- Recent Runs drawer and rail synchronization.
- Patterns digest qualification behavior.

Files to treat as locked unless the task needs them:

- `script.js`
- `index.html`
- `mirror-engine.iife.js`
- `src/data/runs/savedRunPersistence.js`
- `src/data/runs/savedRunsCanonicalRead.js`
- `src/data/runs/runDocumentInit.js`
- `src/data/runs/migrateLegacyRunDocuments.js`
- `src/features/mirror/pipeline/runMirrorPipeline.ts`
- `src/features/mirror/recent/`
- `src/features/writing/prompt-selection.js`

Edits that need extra care:

- Prompt wording or prompt-family logic.
- Saved-run shape, storage keys, or migration flow.
- Mirror headline copy or selection thresholds.
- Mobile layout or viewport coordination.
- Recent Runs or Patterns panel coordination.
- Any edit that requires rebuilding committed artifacts.

## Known Risks

- `index.html` script order is runtime behavior, not styling.
- `script.js` still owns a large portion of orchestration, so a small change can affect downstream flow.
- Saved runs use canonical documents and legacy history together, and those reads are not interchangeable.
- `mirror-engine.iife.js` is committed and can drift from source, so mirror changes may require a bundle rebuild even when source tests pass.
- Recent Runs is rendered through both a mobile drawer and a desktop rail, and Patterns depends on saved digests and cross-run aggregation.
- Reroll is intentionally narrow, so copy-adjacent changes can still alter eligibility or selection behavior.
- Browser smoke requires Chromium and a working local test environment.
- The repo is often dirty when work starts, so unrelated local edits should be preserved.

## Verification Commands

Run the smallest command set that matches the change.
Prefer non-runtime checks first when the task is docs-only or test-only.

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

Narrow checks:

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

When to use what:

- Docs-only change: usually no runtime verification is needed, but run a doc review pass and confirm no source files changed.
- Test-only change: run the targeted test file or the relevant package script, then `npm test` if the change spans shared seams.
- `script.js` or `index.html` change: run `npm run verify:merge` at minimum.
- Visible UI change: run `npm run verify:merge` and `npm run test:smoke` if Chromium is available.
- Persistence change: run `npm test` and the migration-related tests before anything broader.
- Mirror pipeline change: run `npm test` and `npm run verify:mirror-bundle`.

Evidence to record:

- Exact command list.
- Pass or fail for each command.
- Any missing prerequisite, such as Chromium, Playwright install, or a dirty checkout limitation.
- Any command skipped and the reason it was skipped.

## Codex Work Order Template

Use a scoped work order before implementation.
Do not start editing code until the task has a concrete goal, scope, and verification plan.

**Goal**
- State the single outcome the task should achieve.

**Scope**
- List the files or directories that may change.
- State what is out of scope.

**Implementation Requirements**
- State the behavior or documentation requirements that must be preserved.
- Call out repo-specific rules that matter for the change.

**Verification**
- Name the exact commands to run.
- Prefer the smallest command set that proves the change.

**Review Notes**
- Summarize any risk, uncertainty, or follow-up that a reviewer should know.

## Review Checklist

Use this when reviewing a Codex change in this repo.

- Confirm the change matches the stated goal.
- Confirm every modified file is inside the declared scope.
- Confirm unrelated local work was not overwritten.
- Confirm runtime behavior was not changed unless the task explicitly asked for it.
- If `index.html` changed, confirm load order and script sequencing still match the architecture snapshot.
- If `script.js` changed, confirm the main runtime path still matches the current flow.
- If `src/app/` changed, confirm the helper still behaves like a seam and not a new owner.
- If `src/data/runs/` changed, confirm canonical and legacy persistence are still aligned.
- If `src/features/mirror/` changed, confirm the statement-only output contract still holds.
- If `src/features/writing/` changed, confirm prompt reroll and run-start behavior still match the documented rules.
- Confirm the right command set was run for the scope.
- Confirm `npm run verify:merge` was run for merge-sensitive changes.
- Confirm `npm run test:smoke` was run when browser coverage mattered and Chromium was available.
- Confirm any skipped command is explained with a concrete reason.
- Confirm the result was interpreted correctly, especially if the environment was incomplete.
- Confirm the change is documented if it touches a durable repo convention.
- Confirm the final summary names the files changed.
- Confirm the final summary names any uncertainty.
- Confirm the final summary names the next recommended use or follow-up.

Fast rejects:

- Runtime behavior changed without explicit intent.
- A broad refactor was used where a narrow edit would work.
- A docs-only request pulled in runtime edits.
- A test-only request changed production logic.
- A change touched persistence, prompts, mirror, or boot order without calling out the corresponding contract.

## Operating Principle

Repo docs are more reliable than chat history.
ChatGPT can act as strategist, architect, reviewer, and product owner.
Codex should act as the implementation contractor.
GitHub and the repository docs are the source of truth.
New tasks should begin by reading this operator manual.
Code edits should be scoped through a work order before implementation.

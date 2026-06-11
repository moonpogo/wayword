# Review Checklist

Use this when reviewing a Codex change in this repo.

## Scope Check

- Confirm the change matches the stated goal.
- Confirm every modified file is inside the declared scope.
- Confirm unrelated local work was not overwritten.
- Confirm runtime behavior was not changed unless the task explicitly asked for it.

## Repo Contract Check

- If `index.html` changed, confirm load order and script sequencing still match the architecture snapshot.
- If `script.js` changed, confirm the main runtime path still matches the current flow.
- If `src/app/` changed, confirm the helper still behaves like a seam and not a new owner.
- If `src/data/runs/` changed, confirm canonical and legacy persistence are still aligned.
- If `src/features/mirror/` changed, confirm the statement-only output contract still holds.
- If `src/features/writing/` changed, confirm prompt reroll and run-start behavior still match the documented rules.

## Verification Check

- Confirm the right command set was run for the scope.
- Confirm `npm run verify:merge` was run for merge-sensitive changes.
- Confirm `npm run test:smoke` was run when browser coverage mattered and Chromium was available.
- Confirm any skipped command is explained with a concrete reason.
- Confirm the result was interpreted correctly, especially if the environment was incomplete.

## Output Quality Check

- Confirm the change is documented if it touches a durable repo convention.
- Confirm the final summary names the files changed.
- Confirm the final summary names any uncertainty.
- Confirm the final summary names the next recommended use or follow-up.

## Fast Rejects

- Runtime behavior changed without explicit intent.
- A broad refactor was used where a narrow edit would work.
- A docs-only request pulled in runtime edits.
- A test-only request changed production logic.
- A change touched persistence, prompts, mirror, or boot order without calling out the corresponding contract.


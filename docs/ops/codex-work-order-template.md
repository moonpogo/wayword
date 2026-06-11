# Codex Work Order

**Goal**
- Read the ops docs, then fill this work-order file for the current docs-only task so future Codex work starts from a concrete scope instead of a blank template.

**Scope**
- Read-only review of:
  - `docs/ops/current-state.md`
  - `docs/ops/do-not-touch.md`
  - `docs/ops/known-risks.md`
  - `docs/ops/verification-commands.md`
- Update `docs/ops/codex-work-order-template.md` with a task-specific work order.
- Do not change runtime code, app behavior, scripts, or committed artifacts.

**Out of scope**
- Any edits outside `docs/ops/codex-work-order-template.md`.
- Any runtime or test changes.
- Any cleanup of unrelated dirty-tree files.

**Why this is safe**
- This is a documentation-only pass.
- The work is bounded to the ops layer and does not touch the runtime contract.
- The docs being read already define the repo’s risky areas and verification expectations.

**Current context**
- `index.html` and `script.js` still define the runtime contract and must stay untouched for this task.
- Saved runs, Mirror output, prompt reroll rules, and Recent Runs / Patterns coordination are explicitly protected areas.
- The repo is often dirty, so unrelated local edits should be preserved.
- `verify:merge` is the default non-Playwright gate for merge-sensitive work, but this task does not require runtime verification.

**Implementation plan**
1. Read the four ops docs first.
2. Translate the repo conventions into a concrete work order for this task.
3. Keep the result narrow, explicit, and reusable.
4. Leave all runtime files unchanged.

**Verification**
- `git diff --check -- docs/ops`
- Confirm `docs/ops/codex-work-order-template.md` is the only modified file for this task.

**Review notes**
- This task is intentionally docs-only.
- The main risk is drifting back into a generic template instead of a concrete work order.
- If a later task needs runtime changes, it should start from this work order and then name the exact files and verification gates.


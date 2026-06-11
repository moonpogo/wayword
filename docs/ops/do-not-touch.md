# Do Not Touch

These areas are high-risk or intentionally stable.
Do not change them unless the task explicitly says to and the risk is called out.

## Runtime Contract

- `index.html` script order.
- The `Begin` -> `startWriting()` flow.
- Prompt reroll eligibility.
- The statement-only Mirror surface.
- Canonical plus legacy persistence order.
- Recent Runs drawer and rail synchronization.
- Patterns digest qualification behavior.

## Files To Treat As Locked Unless Needed

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

## Edits That Need Extra Care

- Changes to prompt wording or prompt-family logic.
- Changes to saved-run shape, storage keys, or migration flow.
- Changes to mirror headline copy or selection thresholds.
- Changes to mobile layout or viewport coordination.
- Changes to recent-runs or patterns panel coordination.
- Any edit that requires rebuilding committed artifacts.

## Review Discipline

- Preserve unrelated local work.
- Avoid broad refactors when the task is narrow.
- Avoid cleanup that is not required by the task.
- Avoid adding new product claims or changing voice unless the task is specifically about copy.


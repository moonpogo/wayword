# Run Fidelity, Session Boundary, and Observatory Counting Audit

Date: 2026-05-29
Repo: Wayword (`/Users/andrewrodriguez/Desktop/wayword`)
Scope: Diagnostic only (no runtime behavior changes)

## 1. Executive Summary

Verdict: **Partially trustworthy with specific high-risk seams**.

- Strong: submit-time run ID uniqueness has explicit collision guards (`src/features/writing/submit-run-preparation.js`), canonical read dedupes deterministically (`src/data/runs/savedRunsCanonicalRead.js`), and recent tests target back-to-back submits.
- Risk: there is an acknowledged split-brain path where a run can be written to legacy history but missing from canonical documents when canonical upsert fails (`src/data/runs/savedRunPersistence.js`, test: `tests/app-logic.test.cjs` "saved-run persistence keeps legacy sync alive when canonical upsert fails"). Most observatories read canonical only, so this can look like a merged/lost run.

Most likely cause of the reported "back-to-back runs appear merged or as one":
1. Canonical write failure + legacy fallback creates in-memory visibility but canonical-read invisibility after refresh.
2. Season Wheel visual clustering (`SEASON_WHEEL_CLUSTER_GAP_MINUTES = 5`) can collapse multiple rapid runs into one cluster glyph while totals still count multiple runs.

## 2. Run Lifecycle Map

### Where a run begins
- `startWriting()` in `src/features/writing/run-controller.js`.
- Sets boundary state: `active=true`, `submitted=false`, `completedUiActive=false`, new prompt, clears editor text.

### Where a draft begins
- Same `startWriting()` call initializes empty editor content via `setEditorText("")`.
- `state.writeDoc` exists in `src/app/app-state.js` as current draft model.

### Where text state lives during writing
- Primary mutable UI text comes from editor surface (`getEditorText()`, editor DOM) and write-doc sync callbacks (`flushEditorSurfaceIntoWriteDocOnce`, `captureEditorSurfaceIntoWriteDocForSubmit`) wired in `src/app/run-controller-runtime.js`.

### What happens on submit
- `submitWriting()` in `src/features/writing/run-controller.js`:
1. Capture/flush editor text.
2. Analyze text.
3. Prepare run payload via `waywordSubmitRunPreparation.prepareSubmitRun`.
4. Compute mirror artifacts.
5. Route save decision (`waywordCompletionDecisionCoordinator.coordinateSubmitCompletion`).
6. Persist successful run via `waywordSuccessfulSubmitCoordinator.coordinateSuccessfulSavedRunSubmit`.

### When a run becomes permanent
- Locally durable when `persistSuccessfulSavedRun()` executes canonical upsert + legacy sync (`src/data/runs/savedRunPersistence.js`).
- Canonical path: `waywordRunDocumentRepo.upsertDocument` (`src/data/runs/runDocumentRepository.js`).
- Legacy path: push row into `state.history` + add to `state.savedRunIds` + `persist()` writes `localStorage`.

### When local storage is written
- Legacy keys written via `window.waywordStorage.saveHistoryAndRunIds` in `script.js::persist()` and `src/data/storage.js`:
- `wayword-history`
- `wayword-runids`
- Canonical envelope written by repo key `WAYWORD_RUN_DOCUMENTS_STORAGE_KEY` (`wayword-run-documents-v1` in `src/data/runs/schemaVersion.js`).

### When Supabase is written (if sync active)
- Best effort async after local persistence in `src/data/runs/savedRunPersistence.js` via `waywordPersistenceRuntime.syncSavedRun`.
- Actual remote insert occurs in `src/infrastructure/persistence/supabase-run-store.js::upsertRun` (currently insert-only into `runs`, no use of local `runId` as remote key).

### When UI state resets
- Submit sets `submitted=true`, `completedUiActive=true`.
- Next run reset happens when restart path calls `runPostSubmitAutoNewRunNow()` -> `startWriting()` (`src/features/writing/run-controller.js`, `src/features/writing/completed-ui-restart-interactions.js`).

### When next run begins
- Explicit restart triggers:
- Editor interaction/Enter in completed state (`completed-ui-restart-interactions.js`).
- Direct call to `startWriting()` from restart flows.

## 3. Run Identifier Audit

Creation + transforms:
- Primary generator: `script.js::makeRunId()` -> `waywordRunDocumentUtils.generateRunId()`.
- Submit uniqueness guard: `generateUniqueRunId()` in `src/features/writing/submit-run-preparation.js` checks collisions against:
- `state.savedRunIds`
- `state.history`
- canonical read (`readSavedRunsChronological`)
- Run object receives ID in `src/data/run-model.js::createSubmittedRun`.
- Canonical storage upserts by `runId` (`src/data/runs/runDocumentRepository.js::upsertDocument`).
- Canonical reads dedupe duplicate IDs and keep newest timestamp winner (`src/data/runs/savedRunsCanonicalRead.js`).

Answers:
- Is every submitted run guaranteed unique immutable ID?
- **Mostly yes on submit path**, due to `generateUniqueRunId`; immutable after creation unless overwrite by same `runId` at persistence layer.
- Can IDs regenerate after save?
- **Not in normal flow**. But a later write with same `runId` would replace canonical row (`upsert` semantics).
- Can two runs share timestamp-derived ID?
- Timestamp is part of ID seed but ID includes random suffix; collision possible but guarded by uniqueness checks.
- Are observatories using timestamp/date as identity instead of run ID?
- **Yes for grouping/positioning surfaces** (Season Wheel day/time placement uses timestamp fields), though run arrays are still run-row based.
- Are IDs stable across local and remote persistence?
- **No strict parity**. Supabase store does not persist local `runId` field in remote columns; remote uses server `id` (`src/infrastructure/persistence/supabase-run-store.js`).

## 4. Session Boundary Audit

What ends a run:
- Successful submit path sets `submitted=true` and `completedUiActive=true` inside submit prep.

What starts next run:
- `runPostSubmitAutoNewRunNow()` -> `startWriting()`.

Is there a clean boundary after submit:
- **Mostly yes**: restart resets prompt rerolls, timer flags, mirror state, editor text.

Can draft/editor/prompt/session state survive submit:
- Yes intentionally until restart: post-submit phase keeps completed UI visible; editor remains in completed posture until explicit restart.
- Prompt carries until new run generation.

Can new prompt inherit stale state:
- `startWriting()` regenerates prompt and resets text. Low risk for text carryover; moderate risk for stale in-memory history if canonical write failed.

Can saved run and current draft combine accidentally:
- No direct combine path found.
- Biggest seam is not combine, but **visibility divergence** between legacy and canonical stores.

Any async/debounce/timing that can collapse two submissions into one entry:
- High-risk timing: canonical store uses `upsert` by `runId`; if duplicate ID somehow bypassed guard, second submit would overwrite first.
- Current guard reduces likelihood.
- Additional visibility timing risk: async remote sync is non-blocking and does not feed current observatory reads.

Variables requested:
- `currentEntry`, `activeRun`, `currentRun`, `session` are not primary state keys in current runtime.
- Active boundary keys are `state.active`, `state.submitted`, `state.completedUiActive`, `state.history`, `state.savedRunIds`, `state.prompt`, write-doc/editor text seams.

## 5. Persistence Source-of-Truth Audit

Saved-run sources:
- In-memory:
- `state.history` (legacy rows)
- `state.savedRunIds` (Set)
- Local storage:
- `wayword-history`
- `wayword-runids`
- `wayword-run-documents-v1` (canonical envelope)
- `wayword-migration-status`
- Canonical repository:
- `waywordRunDocumentRepo` (`src/data/runs/runDocumentRepository.js`)
- Supabase adapters:
- `waywordPersistenceRuntime.syncSavedRun`
- `waywordSupabaseRunStore` insert/select/delete for table `runs`
- Migration:
- `src/data/runs/migrateLegacyRunDocuments.js` (legacy->canonical local)
- `src/infrastructure/persistence/persistence-runtime.js` + `run-migration-utils.js` (local->remote)

Answers:
- Canonical saved-run source?
- For observatories in this client: **canonical run document repo via `readSavedRunsChronological/NewestFirst`**.
- Do local and signed-in use same shape?
- Local canonical/legacy rows keep rich run analytics shape.
- Remote `runs` rows currently store reduced payload (`writing_text`, prompt metadata, local_created_at) and omit local `runId` field.
- Does sync merge local/remote safely?
- Local runtime does not consume remote runs into observatory reads; sync is one-way best effort in this pass.
- Can migration duplicate/overwrite/collapse runs?
- Local->canonical merge skips existing runId once (`mergeLegacyHistoryMissingIntoCanonicalStore`).
- Local->remote migration dedupe/conflict logic uses fingerprints + run-id collision classifier; minute-bucket fingerprint may over/under-match edge cases.
- Are incomplete drafts persisted as completed runs?
- Submit blocks zero-word runs; no direct evidence of draft autosave as completed run.
- Are completed runs overwritten by later runs?
- Canonical repo upsert can overwrite if same `runId` repeats.

## 6. Observatory Counting Map

| Surface | File(s) | Source collection | Filters | Sort order | Counts complete runs only? | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| Recent Runs | `script.js`, `src/features/writing/recent-runs-view-prep.js`, `src/ui/render-history.js` | `readSavedRunsNewestFirst()` (canonical-first) | none besides UI caps/expand | newest -> oldest | No explicit completion filter; shows saved rows | Medium (if canonical missing, list shrinks) |
| Patterns | `script.js` (`collectMirrorSessionDigestsFromHistory`, `aggregateProfile`), `src/ui/render-patterns.js`, mirror pipeline files | `readSavedRunsChronological()` and digest extraction | qualifying digest logic inside mirror modules | chronological input; internal deterministic ranking | Effectively yes if only submitted runs have digests | Medium |
| Season Wheel | `script.js` (`seasonalRunsForCalendarWindow`, `buildSeasonWheelInstrumentModel`, cluster builder) | `readSavedRunsChronological()` | season window + timestamp parse | sorted by day/start/time | No explicit completion-only gate; integrity derived per row | High visual-collapse risk |
| Mirror history (run cards) | `src/ui/render-history.js` | recent run rows | row-level checks for mirror payload | list order from recent runs | N/A | Low-Medium |
| Stats/count UI (profile summaries) | `script.js::aggregateProfile`, `computePatternUnlockProgress` | `readSavedRunsChronological()` | unlock qualification heuristics for pattern gate | source order not critical | No explicit completion-only filter | Medium |

Observatory consistency checks:
- Saved runs only? Yes, all major surfaces call `readSavedRuns...` canonical-first helpers.
- Includes current draft? No direct draft inclusion in observatory counting paths.
- Different date filters? Yes (Season Wheel applies season date windows).
- Calendar day grouping that hides same-day multiples? Yes, Season Wheel clusters runs within 5-minute gaps into one visual cluster.
- Grouping by date/timestamp instead of runId? Yes for Season Wheel visualization and some trend logic.
- Collapse consecutive runs into one visual event? Yes, Season Wheel cluster layer can.
- Sort keys vary? Yes: recent uses savedAt/timestamp newest-first; profiles mostly aggregate totals; season uses timestamp/day math.

## 7. Specific Investigation: Back-to-Back Runs

Scenario trace:
1. Run A submit -> unique ID generated, save attempted canonical then legacy.
2. Run B immediate submit -> another unique ID generated (collision guard checks set/history/canonical).
3. Recent Runs/Patterns/Season Wheel read via canonical-first helper.

Most plausible failure modes (ranked):
1. **Canonical upsert failure on either run** (high)
- Code path continues writing legacy history and UI updates, but canonical read remains missing that run after reload or in canonical-only readers.
- Evidence: explicit warning + test proving canonical empty while legacy has row.
2. **Visual clustering in Season Wheel** (medium)
- Two quick runs in same day/time cluster may render as one cluster mark, perceived as merge though cluster carries `runCount` internally.
3. **Run ID collision overwrite in canonical repo** (low-medium)
- If ID uniqueness guard is bypassed or unavailable in some path, upsert by `runId` overwrites prior row.
- Current submit-prep tests mitigate this risk.

## 8. Test Coverage Audit

Existing protections:
- Back-to-back unique IDs: `tests/app-logic.test.cjs` (submit run prep collision tests).
- Canonical read preserves rapid consecutive runs with same prompt: `tests/app-logic.test.cjs`.
- Aggregation retention for consecutive runs in profile + season selection: `tests/app-logic.test.cjs`.
- Canonical dedupe/winner behavior, malformed record tolerance, migration idempotence: `tests/app-logic.test.cjs`.
- Persistence migration and ownership scoping: `tests/persistence-migration.test.cjs`.

Missing or shallow areas:
- No end-to-end assertion that **all observatories** (Recent Runs + Patterns + Season Wheel) show two immediate submits as distinct user-visible events.
- No explicit test that Season Wheel cluster UI still communicates multiple runs clearly.
- No test for canonical-failure degraded mode ensuring observatory parity/alerts.
- No strong local+remote round-trip identity parity test (local runId vs remote row identity).

Regression test that would have caught reported bug:
- A browser or integration test submitting Run A then Run B within seconds, then asserting:
- recent list has two distinct run IDs/text excerpts
- patterns digest count increased by 2 where qualifying
- season wheel total run count increments by 2, and tooltip/legend reflects both even if clustered visually

## 9. Recommended Repair Order

1. **Safe to patch automatically**
- Add hard regression tests for two rapid submits across observatories.
- Add explicit health check assertions for canonical vs legacy count mismatch detection in diagnostics/tests.

2. **Needs founder review**
- Decide canonical/legacy divergence behavior when canonical upsert fails (current behavior preserves continuity but hides runs from canonical-read observatories).
- Decide whether Season Wheel should visually separate rapid same-day runs or preserve cluster while improving disclosure.

3. **Risky architecture change**
- Unify to single authoritative persisted shape and eliminate dual-store ambiguity.
- Align remote persistence identity with local `runId` (schema/adapter change).

Priority rationale:
1. preserve existing user data
2. prevent merged/hidden runs
3. enforce one canonical read path
4. add regression coverage
5. postpone copy/visual polish

## 10. Proposed Regression Tests (Not Implemented)

1. Two back-to-back submits create two unique saved runs (`runId` distinct, both persisted).
2. Two same-day runs appear as two runs in Recent Runs list.
3. Two runs with different prompts do not merge in canonical store.
4. Season Wheel totals and details reflect both same-day runs.
5. Recent Runs shows both same-day runs in newest-first order.
6. Patterns reads saved completed runs only and counts both qualifying runs.
7. Current draft is excluded from all observatory calculations pre-submit.
8. Local-to-remote migration preserves per-run distinctness and no collisions.
9. Sync failure does not overwrite or collapse existing local runs.
10. Submit-to-restart boundary clears editor/draft state before next run starts.
11. Canonical-upsert-fail mode surfaces explicit mismatch signal (or deterministic fallback read) rather than silent observatory drop.

## 11. Final Verdict

A. Most likely root cause
- Canonical/legacy divergence on save failure, plus Season Wheel rapid-run visual clustering that can read as merge.

B. Confidence level
- **Moderate-high** on divergence risk; **moderate** on Season Wheel perception effect as user-facing merge report.

C. Files most likely needing repair
- `src/data/runs/savedRunPersistence.js`
- `src/data/runs/savedRunsCanonicalRead.js`
- `script.js` (Season Wheel clustering + observatory read parity seams)
- `src/features/writing/submit-run-preparation.js` (keep as guardrail)

D. Tests most likely needing addition
- `tests/browser-smoke.test.cjs` (end-to-end two rapid submits)
- `tests/app-logic.test.cjs` (cross-observatory parity assertions)
- Optional dedicated observatory parity test file.

E. Safe next Codex patch prompt
- "Implement regression tests (no runtime behavior changes) that submit two back-to-back runs and assert Recent Runs, Patterns digest inputs, and Season Wheel totals all preserve two distinct runs, including same-day timestamps."

## Evidence Gaps / Uncertainty

- Remote read-back into observatories is not currently wired in this client runtime; this audit treats local canonical reads as the practical source for those surfaces.
- If there are external deployments using older bundles, behavior can differ from this repository snapshot.

# Build Log

## Current Repo State

- **Branch:** `main`
- **HEAD:** `fc158c8` — *Refine mirror output: tighten headline copy, remove weak abstractions, and enforce ranking so directional reflections lead*
- **Last commit time (author):** 2026-04-17 11:20:07 -0700
- **Tracking:** `main` even with local `origin/main` at the same commit (per `git status -sb` when this log was refreshed).
- **Note:** This workspace may show untracked root markdown (`BUILD_LOG.md`, `SYSTEM_OWNERSHIP.md`) until you commit or ignore them.

## Branches and Git Status

- **Local branches:** `main` (current), `feature/mirror-engine`
- **Remote branches:** `origin/main`, `origin/feature/mirror-engine` (`origin/HEAD` → `origin/main`)
- **`feature/mirror-engine`:** tip `7facfde` is an **ancestor** of `main`; `git log main..feature/mirror-engine` is empty (no commits on that branch that are not on `main`).

## Recent Structural Changes

- Single-sourced session mirror headlines into `src/features/mirror/constants/mirrorSessionHeadlines.ts` so generation, ranking, and specificity now reference one canonical source for runtime session headline copy.
- Verified post-refactor that ranking and specificity still cover the full canonical session headline set with no intended behavior change.
- Extracted pure mirror card/stack presentation helpers from `script.js` into `mirror-dom.js`, leaving orchestration, state, and event wiring in `script.js`.
- Extracted pure recent-trends mirror HTML assembly from `script.js` into `mirror-dom.js`, keeping history access, pipeline invocation, and empty/error handling in `script.js`.
- Added a mirror bundle verification so step so changes in'src/features/mirror**' cannot drift silently from the committed 'mirror-engine.iife.js' artifact. 
- Extracted Review Runs row HTML into a single helper inside `script.js`, keeping `renderHistory` as the orchestrator for drawer/rail differences and empty-state rules.
- Extracted saved-run persistence coordination from the submit write path into `src/data/runs/savedRunPersistence.js`, keeping canonical-write-before-legacy-sync ordering explicit.
- Extracted submit-path orchestration seams from `src/features/writing/run-controller.js` into narrow helpers:
  - `submit-run-preparation.js`
  - `submit-mirror-analysis.js`
  - `completion-aftermath-helper.js`
  - `completion-decision-coordinator.js`
  - `successful-submit-coordinator.js`
  - `post-submit-ui-reconciler.js`
- Extracted Review Runs surface coordination outside the submit path into:
  - `recent-runs-render-coordinator.js` for drawer/rail render application
  - `recent-runs-interaction.js` for row expand/collapse and shared surface interaction wiring
- Extracted writing-shell runtime coordinators from `script.js` into narrow feature helpers:
  - `patterns-transition-coordinator.js`
  - `options-panel-transition-coordinator.js`
  - `options-panel-interactions.js`
  - `prompt-interactions.js`
  - `focus-mode-transition-coordinator.js`
  - `viewport-sync-coordinator.js`
  - `mobile-editor-focus-guard.js`
  - `semantic-picker-interactions.js`
  - `completed-ui-restart-interactions.js`
  - `editor-shell-interactions.js`

## Decomposition Checkpoint

This extraction phase is complete for now. The writing shell/runtime has been carved down along the highest-confidence orchestration seams without intentionally redesigning behavior.

**Major seams now extracted**

- **Saved-run persistence:** canonical-write / legacy-sync coordination lives in `src/data/runs/savedRunPersistence.js`.
- **Submit path:** `src/features/writing/run-controller.js` now delegates major success-path orchestration to focused submit helpers instead of carrying the full completed-run flow inline.
- **Review Runs:** drawer/rail render application and row interaction wiring now live outside `script.js`.
- **Patterns transition:** `showProfile(...)` transition orchestration now lives in `patterns-transition-coordinator.js`.
- **Settings / options:** panel transition behavior and trigger/backdrop/close-button interaction wiring now live outside `script.js`.
- **Prompts:** prompt reroll / prompt-control interaction binding now lives outside `script.js`.
- **Viewport + mobile shell:** focus-mode transitions, viewport-sync sequencing, and mobile focus-exit guarding now have narrow coordinators.
- **Editor interactions:** semantic-picker / annotation interaction wiring, completed-UI restart interaction wiring, and editor-shell surface interaction wiring now live outside the main runtime file.

**What still remains intentionally inline**

- Leaf rendering and analysis helpers still live close to the runtime state that owns them.
- Fallback inline behavior remains in many `script.js` entry points so the app does not take on a hard script-load dependency while these helpers are still plain browser globals.
- The large `script.js` file still owns substantial state, rendering, and leaf helper logic even though most of the high-risk orchestration seams have been extracted.

## Recent Changes (Last 72 Hours)

Window: commits **after** `2026-04-14 11:20:07 -0700` (72 hours before `fc158c8` author time). **About 44 commits** on `main` in that window.

Newest first (sample):

- `fc158c8` — Refine mirror output (headlines, abstractions, ranking)
- `9b97a86` — Header hierarchy / tagline
- `22516d4` … `2ab4638` — Review Runs drawer hierarchy, scroll cap
- `0fd0e8d`, `e5bc0dd` — Recent drawer / patterns UI; mirror voice
- `e929998` — fix: preserve live annotated layout on submit
- `70516b1` / `0bb9f58` / `eb7a5c1` — Merges and product clarity pass around mirror v1.1
- `7facfde` — Mirror engine v1.1 checkpoint (ancestor of current `main`)
- Earlier in window: mirror pipeline + README + layout/mobile/focus work (`git log --since='2026-04-14 11:20:07 -0700' --oneline` for the full list)
- Structural: single-sourced session mirror headlines into canonical constants module to remove cross-file literal duplication in generation, ranking, and specificity layers.

## Canonical run document store (saved-run architecture) — implementation note

**What was added**

- **Canonical run document model** (`WaywordRunDocument`): JSDoc-defined shape in `src/data/runs/runDocumentModel.js` — run id, timestamps, `body`, prompt, scoring/analysis fields, optional mirror pipeline result / digest / load-failed flags, `characterCount`, etc.
- **Schema / version constants:** `window.WAYWORD_RUN_DOCUMENT_SCHEMA_VERSION` and `window.WAYWORD_RUN_DOCUMENTS_STORAGE_KEY` in `src/data/runs/schemaVersion.js`.
- **Markdown serialization:** `window.waywordRunDocumentMarkdown` — `serializeRunDocumentToMarkdown` / `deserializeRunDocumentFromMarkdown`; front block is JSON (YAML 1.2–compatible) with `{ kind, schemaVersion, record }`, trailing section is raw draft body.
- **Utilities:** `window.waywordRunDocumentUtils` — `generateRunId`, `computeWordCount`, `computeCharacterCount`, `sortRunsNewestFirst` (`src/data/runs/runDocumentUtils.js`).
- **Run repository:** `window.waywordRunDocumentRepository.createLocalStorageRunDocumentRepository()` — `listDocumentsParsed`, `getDocumentByRunId`, `upsertDocument`, `upsertFromLegacyRun`, `clearAllDocuments` (`src/data/runs/runDocumentRepository.js`).
- **Bootstrap + migration:** `runDocumentInit.js` creates `window.waywordRunDocumentRepo` and runs `waywordRunMigration.mergeLegacyHistoryMissingIntoCanonicalStore` (read-only merge from legacy history into the repo; `LEGACY_RUN_STORAGE_KEYS_READ` documents reads).
- **Submit / validation helpers (same model module):** `assembleRunDocumentForSuccessfulSave`, `validateRunDocumentForPersist`, `legacyHistoryRowFromCanonicalDocument` on `window.waywordRunDocumentsModel`.
- **Shared canonical read path for UI/analysis:** `window.waywordSavedRunsRead` — `listSavedRunsChronological` (oldest → newest), `listSavedRunsNewestFirst` (newest first), `toLegacyHistoryRow` (`src/data/runs/savedRunsCanonicalRead.js`); `script.js` exposes `readSavedRunsChronological` / `readSavedRunsNewestFirst` with fallback to `state.history` only if that module is absent.

**What changed**

- **Reads:** Major saved-run consumers in `script.js` use the canonical repo via `readSavedRuns*` / `waywordSavedRunsRead` instead of `state.history` — same ordering semantics as before (chronological vs newest-first preserved).
- **Writes:** On successful save, `assembleRunDocumentForSuccessfulSave` builds and validates the document from submit + mirror inputs; **`waywordRunDocumentRepo.upsertDocument` runs before** `state.history.push` + `persist()`.
- **Legacy row:** `state.history` / `wayword-history` receive **`legacyHistoryRowFromCanonicalDocument`** (legacy shape uses `text`, not `body`); fallback to `{ ...run }` if assembly/projection throws (logged).
- **`src/ui/render-history.js`:** Draft display uses `text` or `body` (`body || text` style) for compatibility.
- **`waywordDevResetCalibrationForTesting`:** Calls `waywordRunDocumentRepo.clearAllDocuments()` after clearing legacy persistence so stores stay aligned.

**Files added** (under `src/data/runs/`)

- `schemaVersion.js`, `runDocumentUtils.js`, `runDocumentModel.js`, `runDocumentMarkdown.js`, `runDocumentRepository.js`, `migrateLegacyRunDocuments.js`, `runDocumentInit.js`, `savedRunsCanonicalRead.js`

**Files modified** (for this architecture)

- `index.html` — script tags for the `src/data/runs/*` chain before `run-controller.js`
- `script.js` — canonical read helpers; consumers above; `makeRunId` delegates to `waywordRunDocumentUtils.generateRunId` when present; dev reset clears canonical store
- `src/features/writing/run-controller.js` — submit persistence order (canonical upsert, then legacy sync)
- `src/ui/render-history.js` — `body` / `text` fallback for saved draft display
- `src/data/runs/runDocumentModel.js`, `src/data/runs/runDocumentRepository.js` — evolve with validation, assembly, `clearAllDocuments`, guarded migration upserts

**New storage key**

- `wayword-run-documents-v1` (`WAYWORD_RUN_DOCUMENTS_STORAGE_KEY`) — JSON envelope `{ storeEnvelopeVersion: 1, items: string[] }` of markdown documents.

**Legacy keys still in use**

- `wayword-history`, `wayword-runids` — still read/written via `src/data/storage.js` and `state.history` / `persist()`; not removed.

**Major consumers now reading from the canonical repo**

- `renderHistory`, `collectMirrorSessionDigestsFromHistory`, `collectRecentMirrorFamilyKeys`, `aggregateProfile`, `completedRuns`, `getRecentEntries`, `recomputeProgressionLevel` (all through `readSavedRunsChronological` / `readSavedRunsNewestFirst` in `script.js`).

**Legacy compatibility that remains**

- In-memory `state.history` and `waywordStorage.saveHistoryAndRunIds` unchanged as the compatibility/dual-write path.
- `savedRunIds` / calibration dedupe behavior unchanged.
- `waywordRunModel.createSubmittedRun` still builds the pre-mirror `run` object for pipeline/digest attachment before canonical assembly.

**Follow-up / risks**

- **Dual-store drift:** If `upsertDocument` throws (e.g. quota), legacy history may still update while the console warns — repo can lag until repaired.
- **Persistence unification:** Eventually a single write path (e.g. derive `wayword-history` from repo or drop duplicate state) and tighter failure policy.
- **Remove fallbacks:** `readSavedRuns*` fallback to `state.history` when `waywordSavedRunsRead` is missing; assembly fallback to raw `{ ...run }` — can be removed once load order and error handling are guaranteed.

## Remaining Risks After Extraction Phase

- **Intentional fallback duplication still exists:** many extracted helpers are called through `window.*` guards with inline fallback logic still present in `script.js`. This is deliberate load-order insurance, but it means some behavior is still duplicated until a later deliberate cleanup pass is justified.
- **Human-smoke validation was the main runtime proof for UI seams:** the extracted submit path, Review Runs seams, Patterns transition seam, Settings/options seams, Prompts interaction seam, viewport-sync seam, mobile focus-exit seam, semantic-picker seam, completed-UI restart seam, and editor-shell interaction seam were validated by targeted human/manual smoke passes rather than automated browser coverage.
- **Real-device mobile caveats remain:** true phone keyboard-overlay / visual-viewport edge cases were not fully verified on physical devices even after the focus-mode and viewport-sync extractions. Browser-visible behavior passed smoke testing, but real-phone `keyboard-open` / touch/focus quirks still deserve caution.
- **Large runtime file still exists:** `script.js` is less fragile at the orchestration layer now, but it still remains the owner of broad state and many leaf behaviors. “Smaller than before” does not mean “small.”

## When To Reopen Extraction

- Reopen extraction only if a new concrete orchestration knot is identified during maintenance, review, or bug fixing.
- Reopen extraction when a remaining inline path is causing real confusion, regressions, or duplicated edits across more than one caller.
- Reopen extraction when fallback duplication itself becomes the primary maintenance risk and there is enough confidence to replace it with a stricter load-order contract.

## When Not To Reopen Extraction

- Do not reopen extraction just because `script.js` is still large.
- Do not extract wrappers around already-extracted helpers simply to keep momentum.
- Do not continue carving when the remaining logic is mostly leaf behavior, rendering detail, or tightly state-coupled code without a clear seam.
- Prefer stabilization, bug fixing, and documentation over more structural change unless a concrete seam or bug shows up.


## What Appears Merged on Main

- Work described in merge commits **`70516b1`** (`feature/mirror-engine-v1.1`) and related **`feature/product-clarity-v1`** / **`eb7a5c1`** line is **reachable from current `main`** in this clone.
- **`feature/mirror-engine` branch tip** is **fully contained** in `main` (stale pointer, not a second line of development).

## What Appears Local / Unmerged

- **No commits on `main` that are not already “on main.”** The audited checkout is `main`.
- **No unique commits** on `feature/mirror-engine` versus `main` (see above).
- **Cannot verify** other people’s unpushed branches or GitHub-only state from this clone alone.

## Implemented Systems

- **Writing shell:** `index.html`, `style.css`, `category-colors.css`, large monolith **`script.js`** (prompts, timer/word targets, calibration, focus mode, patterns view, post-run UI, settings).
- **Writing shell note:** `script.js` still owns broad runtime state and many leaf behaviors, but major orchestration seams now delegate into `src/features/writing/*.js` helper modules loaded before it.
- **Review runs UI:** drawer + desktop rail, list rendering and caps in **`script.js`** + matching markup in **`index.html`**.
- **Mirror engine (TypeScript):** `src/features/mirror/` — analysis, candidate generation, ranking/dedupe/selection, session digests, recent trends / patterns-from-digests.
- **Browser bundle:** `npm run build:mirror` → **`mirror-engine.iife.js`**; **`index.html`** loads it; **`script.js`** calls `globalThis.WaywordMirror` (`runMirrorPipeline`, digests, trends, patterns helpers).
- **Build:** `esbuild` via **`package.json`**; **`tsconfig.json`** for TS. **`package.json` `test`** is a placeholder (exits with error by design).

## File Ownership Map

| System | Primary files | Role |
|--------|----------------|------|
| Prompts | `script.js` (`promptFamilies`, reroll state), `index.html` (prompt card) | Choose and display prompts; reroll limits |
| Settings / options | `script.js` (`state`, `setOptionsOpen`, `localStorage`), `index.html` (`#editorOptionsPanel`) | Theme, targets, timer, banned words, sheet open/close |
| Recent / Review runs | `script.js` (drawer + rail lists, caps), `index.html`, `style.css` | Saved runs UI (mobile drawer vs desktop rail) |
| Mirror pipeline | `runMirrorPipeline.ts`, `analyzeText.ts` + `extract*.ts`, `script.js`, `mirror-engine.iife.js` | End-to-end reflection generation + app integration |
| Candidates | `buildReflectionCandidates.ts`, `generationThresholds.ts`, `thresholds.ts` | Build reflection cards from features |
| Ranking / specificity | `rankReflections.ts`, `statementSpecificity.ts`, `dedupeReflections.ts`, `selectFinalReflections.ts`, `selectionThresholds.ts` | Order, dedupe, select final set |
| Reflection copy rules (doc) | `reflectionTemplates.ts` | Comment-block rules + `MIRROR_REFLECTION_TEMPLATE_RULES_DOC` (not string generation) |
| Styling | `style.css`, `category-colors.css`, `index.html` | Layout, themes, components; JS sets some CSS variables |

**Split ownership (factual):** Mirror headline **strings** are built in **`buildReflectionCandidates.ts`**; **`rankReflections.ts`** and **`statementSpecificity.ts`** match many of the same strings for ordering — they must stay aligned. Settings UI uses both **`editorOptions*`** IDs and **`settings-*`** classes.

## Open Questions / Human Verification Needed

1. **Remote:** Confirm `git fetch origin` on your network; this environment could not refresh `origin` earlier. Local `origin/main` matched `main` at `fc158c8` when checked.
2. **Built bundle:** After TS edits, confirm **`mirror-engine.iife.js`** is rebuilt before you treat the site as shipping new mirror logic.
3. **Branch hygiene:** Delete or update **`feature/mirror-engine`** if the stale name confuses contributors.
4. **Untracked docs:** Decide whether **`BUILD_LOG.md`** / **`SYSTEM_OWNERSHIP.md`** should be committed or gitignored.

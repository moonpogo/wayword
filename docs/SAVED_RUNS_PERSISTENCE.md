# Saved runs persistence contract

Normative reference for how Wayword V1 stores and reads saved runs. Product behavior is local-first (`localStorage`); this document describes **two complementary stores** and how the app keeps them aligned.

## Stores

| Store | Key / location | Role |
|--------|------------------|------|
| **Canonical run documents** | `wayword-run-documents-v1` (see `WAYWORD_RUN_DOCUMENTS_STORAGE_KEY`) | JSON envelope of markdown-serialized run documents. Source of truth for **read** paths used by Recent Runs, Patterns digests, and progression when `waywordSavedRunsRead` is present. |
| **Legacy history** | `wayword-history` (and related `waywordStorage` helpers) | Array-shaped run rows + `savedRunIds` set. **Still written on every successful save** for backward compatibility, refresh rehydration, and migration. |

Legacy rows are **not** deleted when canonical writes succeed. Both stores are intentionally maintained until a future version explicitly migrates users off legacy-only reads.

## Write path (successful save)

Implemented by `waywordSavedRunPersistence.persistSuccessfulSavedRun` (`src/data/runs/savedRunPersistence.js`). Order is fixed:

1. Assemble a canonical document from the save payload (`assembleRunDocumentForSuccessfulSave`), or skip if model/helpers are unavailable.
2. Project that document to a **legacy-shaped row** for `state.history` when possible (`legacyHistoryRowFromCanonicalDocument`); otherwise clone the in-memory run row.
3. **Attempt** `waywordRunDocumentRepo.upsertDocument(canonicalDoc)` before legacy sync. On failure, log and set `canonicalPersisted: false`; **legacy sync still runs** (see below).
4. `syncLegacySavedRunState`: append legacy row to `state.history`, add `runId` to `savedRunIds`, clear inactivity-ease marker when configured, then call `persist()` → `waywordStorage.saveHistoryAndRunIds`.

`waywordSuccessfulSubmitCoordinator` delegates to step 1–4 when `persistSuccessfulSavedRun` exists; if that entry point is missing but `syncLegacySavedRunState` exists, it calls the same legacy sync helper so push/remove/persist order stays identical.

## Read path (UI + analysis)

- **`waywordSavedRunsRead`** (`src/data/runs/savedRunsCanonicalRead.js`): lists runs by parsing the **canonical** envelope only. Rows are adapted to the legacy shape (`text` filled from `body`) so renderers stay unchanged.
- **`readSavedRunsChronological` / `readSavedRunsNewestFirst`** in `script.js`: if `waywordSavedRunsRead` is **missing** (failed script load), fall back to **`state.history`** in memory. They do **not** merge legacy when the module is present but the canonical list is empty.

**Chronological** = oldest → newest (progression, digests walk order). **Newest-first** = drawer/rail and mirror family recency.

## Boot / reload

1. `waywordStorage.loadHistory()` (and related) rehydrates `state.history` and `savedRunIds` from legacy keys.
2. `runDocumentInit` creates `waywordRunDocumentRepo` and runs **`mergeLegacyHistoryMissingIntoCanonicalStore`**: for each legacy row whose `runId` is absent from the canonical store, `upsertFromLegacyRun` backfills the canonical envelope. Legacy `wayword-history` is **read-only** for migration; it is not cleared here.

After a normal save, both stores match. After a **canonical upsert failure**, legacy still receives the new row on disk on next `persist()`, but the canonical envelope lacks that run until a later successful write or migration backfill—**same-session `waywordSavedRunsRead` can therefore return fewer runs than `state.history`**. Full reload runs migration and usually heals gaps for rows that exist only in legacy.

## Malformed canonical storage

`readEnvelope` in `runDocumentRepository.js`: invalid JSON, wrong `storeEnvelopeVersion`, or non-array `items` → treat as **empty envelope** (no throw). `listDocumentsParsed` skips individual items that fail markdown deserialize. Empty or partial lists are valid outcomes.

## Consumers

- **Recent Runs** (`renderHistory`): `readSavedRunsNewestFirst()` → view prep caps/slices.
- **Patterns**: chronological reads for aggregates / digests (`readSavedRunsChronological` and helpers).
- **Calibration / progression**: chronological length and baselines.

## Related files

- `src/data/runs/savedRunPersistence.js` — write seam  
- `src/data/runs/savedRunsCanonicalRead.js` — canonical read seam  
- `src/data/runs/runDocumentRepository.js` — envelope + upsert/list  
- `src/data/runs/migrateLegacyRunDocuments.js` — boot merge from legacy  
- `src/data/runs/runDocumentInit.js` — attaches repo + runs migration  
- `script.js` — `readSavedRuns*`, `persist()`, `waywordDevResetCalibrationForTesting` clears both stores when repo `clearAllDocuments` exists  

When changing persistence, update this document and `tests/app-logic.test.cjs` coverage for the seams above.

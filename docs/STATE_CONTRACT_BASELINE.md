# State Contract Baseline

Phase 0 snapshot of current state contracts before selected-seam migration.

## Post-Submit Flags

| State / field | Current meaning |
| --- | --- |
| `state.active` | A writing session shell is active. |
| `state.submitted` | Current run has been submitted; editor should no longer be writable. |
| `state.completedUiActive` | Post-submit/completed UI is active. |
| `state.lastMirrorPipelineResult` | Last submit's Mirror pipeline result, or `null` before submit/new run. |
| `state.lastMirrorLoadFailed` | Last submit could not use Mirror bundle/API. |
| `state.mirrorEmptyFallbackSeed` | Seed for empty/low-signal Mirror fallback copy. |
| `state.pendingNudgeLine` | Under-prompt nudge carried into the next active run after saved submit, except handoff clears it. |
| `state.pendingRecentDrawerExpand` | Recent Runs drawer focus/expansion intent after save. |

## Derived Post-Submit Phase Vocabulary

Phase 1 added a read-only derived vocabulary in `src/features/writing/post-submit-phase.js`.
Phase 2 routes only narrow post-submit render flags and completed-restart gating through it.

| Phase | Derived from current flags |
| --- | --- |
| `idle` | No active writing session. |
| `drafting` | Active session is not in completed post-submit UI. |
| `submitted_calibration_baseline` | Submitted/completed state has a non-insufficient `calibrationPostRun`. |
| `submitted_calibration_insufficient` | Submitted/completed state has `calibrationPostRun.insufficient`. |
| `submitted_calibration_handoff` | `calibrationHandoffVisible` is true; this takes precedence over baseline payload. |
| `submitted_mirror_low_signal` | Mirror result is low-signal, or caller supplies the current renderer's low-signal predicate result. |
| `submitted_mirror_ready` | Submitted/completed state reaches normal Mirror rendering. |
| `submitted_mirror_unavailable` | Last Mirror load/API call failed. |

Invariant: `submitted=true` plus `completedUiActive=true` plus `active=false` is invalid-by-design for post-submit UI. Current phase derivation treats it as `idle`, and completed-restart handlers must not restart from it.

## Calibration Flags

| State / key | Current meaning |
| --- | --- |
| `CALIBRATION_THRESHOLD` | `5`; Patterns unlock and handoff logic key off saved run count. |
| `state.calibrationPostRun` | Calibration post-submit overlay payload: `{ step, observation, insufficient }`, or `null`. |
| `state.calibrationHandoffVisible` | Threshold handoff owns post-submit surface and blocks normal restart shortcuts. |
| `state.lastSubmitCalibrationShortMirror` | Last calibration submit was short/low-signal and uses micro-reflection copy. |
| `wayword-calibration-handoff-ack` | localStorage ack that suppresses repeat threshold handoff. |

## Saved-Run Storage Keys

| Key | Role |
| --- | --- |
| `wayword-run-documents-v1` | Canonical run-document envelope of markdown-serialized docs. Preferred read source when `waywordSavedRunsRead` exists. |
| `wayword-history` | Legacy saved-run rows; still written on every successful save. |
| `wayword-runids` | Legacy saved run id set; still written on every successful save. |
| `wayword-progression-level` | Stored progression level. |
| `wayword-inactivity-eased-for-run` | Marker for inactivity easing. |
| `wayword-completed-challenges` | Completed challenge word set. |
| `wayword-pattern-selected-words` | Selected repeated words for Patterns challenge. |
| `wayword-exercise-words` / `wayword-exercise-word` | Active exercise/challenge words; cleared on normal fresh run/reset paths. |
| `wayword-theme` | Light/dark theme; read before first paint. |

## Body / HTML Classes

| Class | Element | Current contract |
| --- | --- | --- |
| `focus-mode` | `body` | Mobile focused writing layout is active. |
| `expanded-field` | `body` | Mobile writing field chrome is expanded. |
| `keyboard-open` | `body` | Mobile software keyboard compaction state while in focus mode. |
| `patterns-open` | `body` | Mobile Patterns surface is open. |
| `recent-drawer-open` | `body` | Recent Runs drawer is open. |
| `recent-drawer-runs-expanded` | `body` | Recent Runs drawer is showing expanded/full history body. |
| `recent-rail-expanded` | `body` | Desktop Recent Runs rail expanded chrome is active. |
| `settings-open` | `body` | Editor options/settings overlay is open. |
| `clear-saved-runs-confirm-open` | `body` | Clear Saved Runs confirmation modal is open. |
| `focus-mode-layout-snap` | `html` | Temporary layout snap during focus-mode transitions. |

## Prompt Families

Current runtime main prompt families in `src/features/prompts/prompt-library.js`:

- `Scene`
- `Relation`
- `Pressure`
- `Constraint`

Current calibration family:

- `Calibration`

## Canonical + Legacy Persistence

- Successful save attempts canonical document assembly and `waywordRunDocumentRepo.upsertDocument()` first.
- Legacy state sync still runs afterward and writes `wayword-history` plus `wayword-runids`.
- `readSavedRunsChronological()` and `readSavedRunsNewestFirst()` prefer `waywordSavedRunsRead` canonical reads when present.
- If canonical read helper exists but canonical storage is empty, reads do not merge legacy rows.
- Boot migration backfills canonical docs from legacy `wayword-history` rows missing from canonical.
- Malformed canonical envelope is treated as empty; invalid individual docs are skipped.

## Needs Browser Verification

- Exact class combinations during mobile keyboard open/close across Safari visual viewport timing.
- Whether any body/html class remains stale after interrupted transitions.

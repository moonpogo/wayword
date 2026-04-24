# State Flow

## Purpose
This document maps Wayword's visible app surfaces and major state transitions so behavior remains explicit during future changes, especially where UI flow and persisted state are coupled.

## Core surfaces

### landing
- **Visible when:** app boot finishes and `enterLandingState()` runs.
- **Open action:** automatic on initial load.
- **Close/replace action:** `Begin` click transitions to app shell and starts a writing run.

### prompt
- **Visible when:** writing shell is active; prompt text is set during run start or reroll.
- **Open action:** `Begin` (first run), plus subsequent new runs after submit.
- **Close/replace action:** replaced by reroll (same prompt slot), or replaced by next run prompt after submit.

### editor
- **Visible when:** app view is active (post-landing). Editable only when `state.active && !state.submitted`.
- **Open action:** `Begin` enters app and `startWriting()` enables editing.
- **Close/replace action:** submit locks editing and shifts to post-run state; starting next run re-enables editing.

### mirror
- **Visible when:** post-submit and completed UI is active, and mirror panel parts exist (or empty-state body is rendered).
- **Open action:** submit computes mirror output and render pass mounts reflection/recent-trends panel.
- **Close/replace action:** next run (`startWriting`) clears last mirror result and hides panel until next submit.

### recent runs
- **Visible when:** drawer is opened (`recent-drawer-open`), plus desktop rail rendering in write layout.
- **Open action:** review-runs trigger opens drawer; desktop rail can expand/collapse older runs.
- **Close/replace action:** drawer close/backdrop/Escape closes drawer; opening patterns can replace side-column rail content on desktop.

### patterns
- **Visible when:** `showProfile(true)` removes hidden state from `profileView`.
- **Open action:** style tab toggle (Enter/Space/click), available after calibration threshold is reached.
- **Close/replace action:** style tab toggle off, mobile close path, or beginning a new run (`startWriting`) which calls `showProfile(false)`.

## Core transitions

### App load
- First paint boots the app view internals (meta/editor/history/profile render), then explicitly enters landing state.
- Rehydrated from local persistence on init:
  - theme
  - legacy history array
  - saved run IDs set
  - completed challenges set
  - pattern-selected words
  - progression level
- Canonical saved-run reads use `waywordSavedRunsRead` when that module loaded; `script.js` falls back to in-memory `state.history` only if the read module is absent (not when the canonical list is merely empty). See `docs/SAVED_RUNS_PERSISTENCE.md`.
- Should not happen: auto-start writing, auto-submit, or skipping landing without user action.

### Begin
- `Begin` runs `enterAppState(...)` and `startWriting({ deferEditorFocus: true })`.
- Changes applied:
  - landing DOM is dismissed
  - `state.active=true`, `submitted=false`, `completedUiActive=false`
  - prompt is generated, editor text reset
  - prompt reroll count reset
  - mirror/post-run state cleared
  - options/banned/patterns surfaces closed
- Visible result: prompt + writable editor become active; landing is removed.
- Prompt/editor init: empty editor, fresh prompt, timer armed for first meaningful input if timed mode is configured.

### Prompt generation
- First prompt load occurs during `startWriting()`.
- Selection avoids repeats/near-duplicates using:
  - `state.recentPromptIds` window
  - near-duplicate groups from recent prompt tail
  - family recency weighting via `state.recentFamilyKeys`
- On success: prompt text, prompt ID/family, bias tags, and recent prompt/family windows are updated.
- Should not happen: duplicate prompt churn inside recent suppression windows unless all strict/relaxed candidate pools are exhausted (then fallback paths apply).

### Prompt reroll
- Reroll only allowed when active, not submitted, editor is still empty, and reroll budget remains.
- Reroll behavior prefers in-family replacement (forced current family key), then cross-family fallback if needed.
- Recent suppression continues to apply through the same recent ID/family and near-duplicate filters.
- Stable UI during reroll: editor content (empty), active run state, and layout remain unchanged; only prompt state and reroll count/button state update.

### Typing/editing
- On editor input (and composition end), current surface text is flushed into `writeDoc`.
- Live updates during typing:
  - timer first-input arming
  - highlight/sidebar recompute
  - word progress and submit-button visibility
  - semantic picker scheduling
- Should remain stable while editing: surface/layout mode, open panel intent, run identity, and prompt content (unless user explicitly rerolls while still empty).

### Submit
- Submit requires active run; empty text short-circuits (timer expiry with no text starts a fresh run boundary).
- Successful submit transitions:
  - `submitted=true`, `completedUiActive=true`
  - editor locks, scoring + run payload computed
  - mirror pipeline and optional mirror digest computed
  - post-run reflection/mirror panel rendered
- When run qualifies for save, local persistence updates:
  - canonical run document repo upsert (if available)
  - legacy history + run ID set persisted to local storage
  - progression recalculated and rendered
- Visible after submit: post-run mirror/reflection surfaces, recent runs refreshed, prompt continuation nudge can appear.
- Should not happen: writable editor staying active in submitted mode, or unsaved/no-signal calibration runs being treated as fully saved history entries.

### Mirror interaction
- Primary/supporting reflections render from post-run mirror parts (`v1Body` + recent trends), or fallback/low-signal copy when applicable.
- V1 cards render as statement-only observations.
- No visible evidence toggles, `Context` / `Hide` controls, or evidence panels are part of the current user-facing flow.
- Internal evidence may still travel in pipeline results, saved run snapshots, or digests, but it is not exposed in the UI.
- Mirror state is tied to current submitted run via `lastMirrorPipelineResult`, `lastMirrorLoadFailed`, and current run seed/session IDs; saved runs keep snapshot/digest on persisted run records.

### Recent runs open/close
- Opening recent runs sets drawer open classes/ARIA, blurs editor if needed, optionally exits mobile focus mode, and renders synced drawer/rail rows.
- Selected row expansion restores per-run detail/mirror glance from saved run data; one row stays open at a time.
- Closing recent runs clears expanded-history mode, hides metric popover, re-renders compact history state, and returns focus to trigger.
- Mobile vs desktop (high level):
  - mobile uses drawer-first interaction with backdrop dismissal guards
  - desktop also supports an expanded side rail mode with measured height constraints

### Patterns open/close
- Opening patterns runs `showProfile(true)`, syncs layout mode, and renders profile/pattern data.
- Data source is aggregated saved-run history plus mirror session digests (`collectMirrorSessionDigestsFromHistory()`), with mirror patterns pipeline when available and legacy callouts fallback otherwise.
- Difference vs recent runs:
  - recent runs = per-run inspection (row-level saved drafts)
  - patterns = cross-run aggregation and promoted recurring signals
- Closing patterns uses `showProfile(false)` path (mobile and desktop-specific close handling).
- Should not happen: patterns toggle mutating run history or changing active draft text.

### Refresh / reload
- Should persist across refresh:
  - theme
  - saved history/run IDs
  - completed challenges
  - selected pattern challenge words
  - progression level
- Should rehydrate cleanly: history/profile/pattern summaries, recent runs surfaces, and calibration gating state.
- Should not reset unexpectedly: saved runs corpus, prompt-family suppression history for current session should only reset via new runtime session/init paths, not arbitrary UI rerenders.

### Reset
- Current explicit reset path is dev/testing-only (`waywordDevResetCalibrationForTesting`, optionally via `?resetCalibration=1`).
- Cleared state includes:
  - run history + run IDs (including canonical run docs clear when repo is present)
  - calibration/post-run feedback/mirror-derived state
  - pending prompt/mirror bias/session markers tied to prior runs
  - progression level reset to baseline
- User-visible result: history/pattern outputs empty/locked again, post-run UI cleared, and app returns to baseline writing/calibration posture.
- After reset, app should look like a fresh calibration session, not partially mixed with prior saved-run artifacts.

## State dependencies
- Prompt generation depends on prompt-history windows (`recentPromptIds`, `recentFamilyKeys`) and near-duplicate grouping.
- Mirror display depends on both current-run mirror result and persisted run snapshots/digests used by recent/patterns surfaces.
- Patterns depends on aggregated saved-run digests/history, plus mirror bundle availability for promoted cross-run cards.
- Panel/surface behavior depends on shared global flags (`optionsOpen`, `recentRunsHistoryExpanded`, `patterns-open`, focus-mode classes).
- Layout behavior branches by viewport checks (mobile vs desktop patterns/recent rail paths) and affects DOM placement of profile surface.

## Known fragility points
- Boot/init ordering (rehydration + first render + explicit landing entry).
- Prompt reroll eligibility and in-family fallback logic under recent suppression windows.
- Drawer/panel layering and dismissal guards (options, recent drawer, focus mode, keyboard state).
- Coordination between recent runs and patterns surfaces in shared side-column/mobile contexts.
- Scroll/viewport sync timing (`visualViewport`, resize observers, focus-mode class transitions).
- Persistence rehydration and canonical/legacy run-store coordination.

## Guardrails for future changes
- Do not change boot flow without testing `Begin` from landing.
- Do not change prompt logic without reroll-focused sanity checks (including empty-editor gating).
- Do not change panel behavior without testing recent runs and patterns together.
- Do not change layout behavior without mobile and desktop verification.
- Do not change persistence logic without refresh and reset-path testing.

## Maintenance note
Update this document whenever:
- a new major surface is added
- a major transition changes
- persistence behavior changes
- panel coordination changes materially

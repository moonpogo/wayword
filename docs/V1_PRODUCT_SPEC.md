# Wayword V1 Product Spec

This document is the current source of truth for Wayword's V1 user-facing product contract.

## Product purpose

Wayword is a browser-based writing environment for noticing visible patterns in a draft and across saved runs.

Wayword V1 is not:

- a notes app
- a general-purpose document editor
- a writing coach
- a diagnostic tool
- a personality reader

## Core user loop

1. The user lands on the opening screen.
2. `Begin` transitions into the writing shell and starts a new run.
3. A prompt is shown.
4. The user writes in the editor.
5. The user submits the run.
6. Wayword renders post-run Mirror output for that draft.
7. Saved runs become available through Recent Runs.
8. Patterns aggregates across saved runs when enough qualifying runs exist.
9. The user begins the next run and repeats the loop.

## Core surfaces

### Landing

- Landing is the first user-visible surface on load.
- The app does not auto-begin writing or auto-submit a run.

### Prompt

- A prompt is generated when a run starts.
- Reroll is limited and only available while the current editor is still empty.

### Editor

- The editor is the primary writing surface.
- While writing, Wayword may update live annotation and scoring-adjacent UI around the draft.
- Submitting locks the draft and shifts the app into post-run mode.

### Mirror

- Mirror runs after submit.
- Mirror reflects visible language patterns in the submitted draft.
- Mirror may show a strongest line and additional supporting lines when eligible.
- Mirror may also contribute recent-trends text across saved runs where supported.

### Recent Runs

- Recent Runs is the saved-run inspection surface.
- It shows prior saved drafts and their stored post-run output.

### Patterns

- Patterns is the cross-run aggregation surface.
- It uses saved-run history and stored mirror digests to summarize recurring signals across qualifying runs.

## Mirror contract

Mirror V1 is a restrained observational layer over the submitted text.

Mirror V1 does:

- describe visible patterns in the current draft
- surface repetition, structural variation, shifts, and other deterministic language signals already encoded by the current pipeline
- keep the user-facing card copy short and observational

Mirror V1 does not:

- give advice
- diagnose the writer
- make personality claims
- infer identity, motive, intent, or emotional state
- grade the writer as good or bad
- expose its internal evidence, scoring, counts, ratios, or debug state in the visible card UI

### Evidence visibility

- Evidence may remain in internal pipeline results, saved artifacts, QA output, tests, or future advanced/debug modes.
- V1 user-facing Mirror cards show the refined observational statement only.
- No visible evidence toggle, accordion, context panel, or `Context` / `Hide` control is part of the V1 product.

## Persistence

Wayword V1 is local-first and browser-local only.

- Saved runs persist in browser `localStorage`.
- Theme, progression state, selected pattern words, and related local settings also persist in `localStorage`.
- V1 does not include accounts, cloud sync, or remote storage.

## Desktop and mobile expectations

### Shared expectations

- Landing, begin, prompt, editor, submit, Mirror, Recent Runs, and Patterns all work without requiring a backend service.
- The primary writing loop remains available on both desktop and mobile.
- Mirror output remains readable and statement-only on both desktop and mobile.

### Desktop expectations

- Recent Runs can appear in the desktop rail layout.
- Patterns can occupy the side-column desktop layout.

### Mobile expectations

- The editor supports the mobile focus-mode flow already present in the app.
- Recent Runs opens as a drawer-style surface.
- Patterns uses the mobile open/close path already present in the app.

## V1 non-goals

Wayword V1 does not aim to provide:

- collaborative editing
- multi-document workspace management
- cloud accounts or sync
- export workflows
- writing advice or rewriting assistance
- visible evidence inspection UI for Mirror cards
- diagnosis, therapy, coaching, or personality inference

## Source-of-truth note

If another document disagrees with this spec about current V1 behavior, this file wins for product-surface decisions. Mirror implementation details may continue to evolve as long as they preserve this visible contract.

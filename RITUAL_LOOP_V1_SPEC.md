# Ritual Loop V1

## 1. Goal

Shift Wayword from a reflection tool into a repeatable writing ritual by adding a lightweight follow-up loop after each run. The product should reward completion with a gentle “what next” invitation, not with evaluation or curriculum.

## 2. Product change

**Current loop:** prompt → write → one reflection (mirror line in post-run UI).

**New loop:** prompt → write → one reflection → one follow-up nudge → next run.

The nudge is not a second reflection. It is a single optional sub-line shown with the *next* prompt, carrying continuity from the last completed run without reopening the last run’s critique.

## 3. Core principles

- No gamification.
- No scores, streaks, or progress metrics surfaced for this loop (existing run scoring stays internal where it already is; do not wire it into nudge copy).
- No writing-class language in user-facing nudge text.
- Nudges must read as invitations, not corrections.
- The system should feel responsive, not instructional.
- The next run should feel more tempting, not more demanding.

## 4. User-facing behavior

- **First session / cold start:** user sees the prompt only; no nudge line.
- **After submit:** behavior unchanged at a high level — one mirror reflection line remains the post-run artifact (existing mirror panel / reflection rendering).
- **Next run:** when a new prompt is shown (`startWriting` path, including auto “new run” after submit if applicable), the prompt card shows:
  - Primary prompt text (unchanged role: invite a mode of writing).
  - **One** optional sub-line directly beneath the prompt body (new slot), visually secondary (smaller / quieter), not inside the reflection area.
- Nudge copy is derived from the **previous run’s** selected reflection text and/or **internal** metadata about the previous prompt (including non-visible bias tags). It must not echo raw mirror diagnostics or internal category names.
- **At most one** nudge visible at a time; rerolling the prompt may replace the prompt string but **nudge carryover rules** are defined in §7 (e.g. clear vs keep — pick one behavior and document it in implementation notes).
- Nudge must be understandable on first read to someone who has never studied writing craft.

## 5. Nudge design rules

- **One line only** (hard cap for V1).
- Plain language, short clause or sentence.
- **Forbidden vocabulary** in user-facing nudge strings includes but is not limited to: “abstract,” “cadence,” “tone,” “voice,” “arc,” “stakes,” “theme,” and other workshop jargon. (Internal code may still use richer terms; the **output filter** is the contract.)
- No prescriptive “improve this” or “fix your …” framing.
- No implication that the prior run was wrong, weak, or failed.
- Prefer invitations toward **variation**, **constraint**, or **contrast** (e.g. time scale, distance, specificity, shape of attention) without naming craft concepts.

**Examples (illustrative only — not canonical copy):**

- “Next time, stay closer to one small moment.”
- “If that was inward, try something that faces outward.”
- “Write the same kind of starting place, but half the length.”

## 6. Prompt system requirements

- Prompts may carry **internal bias tags** (e.g. family + optional fine-grained tags) alongside the visible string. Today the app already distinguishes families in code (`promptFamilies`, `state.promptFamily`); V1 extends that idea explicitly as **structured, non-visible metadata** attached to the chosen prompt.
- Tags are **never** rendered in the prompt card, history cards, or export unless this spec is revised.
- Tags **inform** nudge generation with weighted hints; they do **not** deterministically pick a single template every time (avoid robotic repetition across sessions).
- Prompt body continues to **invite** a mode of writing; bias tags tune nudge suggestions only, not a rubric shown to the user.

## 7. System behavior

- **Reflection:** remains a **single** user-visible mirror line in the post-run experience (do not split the mirror line into reflection + nudge in post-run).
- **Nudge:** separate artifact, computed after run completion (or lazily on next `startWriting`), stored for the **next** prompt render only.
- **Placement:** nudge renders under the **next** prompt in `#promptCard` / `#promptText` neighborhood in `index.html` — implement as a dedicated element (e.g. `#promptNudge`) rather than concatenating strings into the prompt paragraph.
- **Weak or missing reflection:** if ranking yields no strong selected line, still allow a **soft** nudge from prompt bias tags + minimal safe defaults (e.g. contrast vs previous bias family). Do not block the next run.
- **Analysis depth:** nudge generation must **not** require a new heavy analysis layer. Acceptable inputs:
  - Final selected mirror reflection string (already produced by `runMirrorPipeline` / ranking path).
  - Previous prompt visible string + bias tags.
  - Lightweight derived flags if already available on the run object (optional); **do not** add a second full text-mining pass for V1.

**Carryover state (conceptual):**

- On successful mirror attach / reflection resolve, persist enough for the next boot: at minimum `{ lastReflectionLine, lastPromptBiasTags, lastPromptKey or family }` alongside existing run persistence (`persist` / history), namespaced so old clients ignore unknown fields safely.

## 8. Technical scope

| Area | Requirement |
|------|-------------|
| Prompt bias tags | Extend prompt data model: visible string + internal `biasTags: string[]` (or small typed union) chosen when `generatePrompt()` samples from `promptFamilies`. |
| Nudge generation | New small module or pure helper (e.g. `buildRitualNudge.ts` or colocated helper in `script.js` if staying bundle-simple) that maps `(reflectionLine?, biasTags, priorFamily?)` → `nudgeLine \| null`. |
| UI | Add optional sub-line under `#promptText` in the prompt card; style in `style.css` as de-emphasized meta, not a second headline. |
| State / persistence | Thread “pending nudge for next run” through `state` and `persist()` / hydrate path so reload does not lose the loop. |
| Integration | Keep **current mirror pipeline** (`src/features/mirror/**`, `WaywordMirror` IIFE usage) intact; only consume its **output** reflection line (+ existing run metadata). |
| Reroll | Define whether `rerollPrompt()` clears nudge, keeps nudge, or regenerates nudge; default recommendation: **keep** nudge until the user submits again (continuity), unless reroll explicitly documents “fresh invitation.” |

**Touch surfaces (expected):** `script.js` (`generatePrompt`, `startWriting`, submit path / `handleRunCompleted` neighborhood, `renderMeta` or prompt render helper), `index.html` (prompt card markup), `style.css` (nudge slot), optional small TypeScript module if the build already compiles TS for this path.

## 9. Out of scope

- Scores, streaks, achievements, badges.
- User profiles, social, or comparative leaderboards.
- Adaptive personalization beyond **single-run carryover** (prompt + reflection + tags).
- Broad rewrite of the prompt library or prompt families taxonomy.
- Recent trends / patterns drawer redesign.
- Multiple nudges, nudge history UI, or editable nudges.
- LLM-generated nudges (V1 is deterministic / template + light variation only unless explicitly replanned).

## 10. Success criteria

- A completed run **naturally suggests** another run without mentioning obligation.
- Nudges are **clear**, **non-technical**, and **non-evaluative** under spot checks (internal copy review + corpus spot test).
- The loop feels **lighter** than adding a second coaching layer; users should not describe it as “homework.”
- The app reads more like a **ritual** (bounded moment → gentle door to the next moment) and less like a **tool** (diagnose → fix).

**Engineering acceptance checks:**

- First run after cold load: no nudge element or empty with no reserved awkward gap.
- After submit with mirror success: next `startWriting` shows nudge under new prompt.
- After submit with mirror failure / empty reflection: next run still usable; nudge may be generic-soft, not broken UI.
- Persist + refresh page: nudge intent survives until consumed by starting the next run (define “consumed” as first character typed or first prompt render after hydrate — pick one and test).

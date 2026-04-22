# System ownership map

Plain map of where behavior lives today. No code changes implied.

---

## Prompt system

**Primary files**

- `script.js` — `promptFamilies`, `generatePrompt()`, reroll limits, `state.prompt` / `state.promptFamily` / `state.promptRerollsUsed`, reprompt vs field-toggle handlers (`promptRerollBtn`, field expand), sync of prompt text into the DOM.
- `index.html` — `#promptCard`, `#promptText`, `#promptFamilyLabel`, `#promptRerollBtn`, field-expand control in the prompt meta row.

**Responsibility**

- Chooses a family and random prompt string, tracks rerolls, renders the prompt card, and wires mobile/desktop interaction so reroll is not confused with other controls.

**Duplication / ambiguity / split ownership**

- Prompt **strings** live only in `script.js` (`promptFamilies`). **Layout and chrome** for the same UX are split between `index.html` (structure) and `style.css` (`.prompt-*`). No separate prompt module.

---

## Settings state

**Primary files**

- `script.js` — central `state` object (`theme`, `targetWords`, `timerSeconds`, `banned`, `optionsOpen`, `bannedEditorOpen`, `repeatLimit`, `progressionLevel`, etc.), `setOptionsOpen()` / `settings-open` on `document.body`, theme persistence (`localStorage` `wayword-theme`), run history and ids in `localStorage`, pattern word persistence, `setExerciseWords` / `setPatternSelectedWords`.
- `index.html` — `#editorOptionsPanel` / backdrop: theme toggle, word/time mode segments, banned-word textarea, shuffle control.

**Responsibility**

- Single global `state` plus explicit persistence keys; opening/closing the settings sheet and syncing panel controls to state.

**Duplication / ambiguity / split ownership**

- **Naming split:** UI is “editor options” in IDs/classes (`editorOptions*`) while behavior is often described as “settings” (`settings-open`, `settings-modal`). Same surface, two vocabularies.
- **Theme tokens:** `state.theme` and `html[data-theme]` (set elsewhere in `script.js`) interact with CSS; accent colors are documented as canonical in `category-colors.css` with JS reading CSS variables (`getCategoryAccentColor` in `script.js`).

---

## Drawer / recent writing (“Review runs”) system

**Primary files**

- `script.js` — `recent-drawer-open` on `body`, `recentDrawerList` / `recentRailList` rendering, caps (`recentRunsPreviewCapDrawer`, `recentRunsPreviewCapRail`), open/close/backdrop, click delegation, “View older runs” footers, shared list row HTML paths, `state.history` / saved runs integration, metric explainer binding (`bindMetricExplainerDelegation`).
- `index.html` — `#recentDrawer`, `#recentDrawerBackdrop`, `#recentDrawerList`, `#recentWritingTrigger`, desktop `#recentRailList` / footer (parallel rail vs overlay drawer).

**Responsibility**

- Surfaces saved runs in two layouts (mobile drawer vs desktop rail), keeps preview lists in sync, and gates interactions with other overlays (settings, focus).

**Duplication / ambiguity / split ownership**

- **Dual surfaces:** one logical “recent runs” feature is implemented twice in markup (`recentDrawer*` vs `recentRail*`) with shared class names (`recent-drawer-list`, etc.) and shared rendering logic branching on list id in `script.js`.
- **Mirror-adjacent, not same module:** digest/trend **data** for mirror lives under `src/features/mirror/recent/`; **presentation** of runs and mirror snippets in the drawer/rail is still owned by `script.js` + HTML/CSS.

---

## Mirror engine pipeline

**Primary files**

- `src/features/mirror/pipeline/runMirrorPipeline.ts` — orchestrates `analyzeText` → `buildReflectionCandidates` → `rankReflections` → `dedupeReflections` → `selectFinalReflections`.
- `src/features/mirror/analysis/analyzeText.ts` (and `extract*.ts`, `constants/*` thresholds) — feature extraction feeding the pipeline.
- `src/features/mirror/entry-iife.ts` — minimal browser bundle exports used by the page.
- `package.json` — `build:mirror` esbuild script → `mirror-engine.iife.js`.
- `mirror-engine.iife.js` — built IIFE consumed by the app (regenerate via `npm run build:mirror`).
- `index.html` — loads `mirror-engine.iife.js` before `script.js`.
- `script.js` — feature detection (`mirrorPipelineAvailable`, etc.), calls `WaywordMirror.runMirrorPipeline`, stores `state.lastMirrorPipelineResult`, digest/trends helpers (`buildMirrorSessionDigest`, `runMirrorRecentTrendsPipeline`, `getPatternsProfileFromDigests`), HTML assembly for post-run and patterns surfaces.

**Responsibility**

- TS side: deterministic pipeline from session text to selected reflections. JS side: integration, fallbacks when bundle missing, and all DOM for showing results.

**Duplication / ambiguity / split ownership**

- **Two languages / two trees:** pipeline **logic** is TypeScript under `src/features/mirror/`; **product wiring and UI** for mirror output is `script.js`. The IIFE is the seam.
- **Artifact vs source:** behavior can drift if `mirror-engine.iife.js` is not rebuilt after TS edits.
- **Patterns cache:** `index.html` appends `?v=` to `mirror-engine.iife.js`, `render-patterns.js`, `patterns-repeat-lexical-gate.js`, and `script.js`; bump the token when any of those change so browsers do not keep stale Patterns copy or lexical filters. `npm run verify:patterns-surface` rejects retired internal pattern strings in the committed bundle.

---

## Reflection candidate generation

**Primary files**

- `src/features/mirror/generation/buildReflectionCandidates.ts` — builds `MirrorReflectionCandidate` objects (statements, evidence, initial `rankScore`) from `MirrorFeatures` + normalized text.
- `src/features/mirror/generation/generateReflections.ts` — re-exports `buildReflectionCandidates` only (alias entry point; pipeline imports `buildReflectionCandidates` directly).
- `src/features/mirror/constants/generationThresholds.ts`, `thresholds.ts` — gates and numeric rules used during candidate construction.
- `src/features/mirror/types/mirrorTypes.ts` — candidate/result shapes.

**Responsibility**

- Turn extractions into concrete headline + evidence cards subject to generation thresholds.

**Duplication / ambiguity / split ownership**

- **Copy ownership is split** with ranking/specificity: exact headline strings are **literal** in `buildReflectionCandidates.ts`, while `reflectionTemplates.ts` documents voice/rules but does not generate strings. **`rankReflections.ts` and `statementSpecificity.ts` also encode many of the same headlines** as string literals for ordering/tie-breaks — changing a headline in one file can desync the others.

---

## Ranking / specificity logic

**Primary files**

- `src/features/mirror/ranking/rankReflections.ts` — ordering layer; uses statement string matching plus `mirrorStatementSpecificity` tie-breaks; documents that it does not change extraction thresholds.
- `src/features/mirror/ranking/statementSpecificity.ts` — numeric specificity tiers for tie-breaks; maintains a set of “generic fallback” statements.
- `src/features/mirror/ranking/dedupeReflections.ts` — deduplication pass.
- `src/features/mirror/ranking/selectFinalReflections.ts` — final selection of main + supporting reflections.
- `src/features/mirror/constants/selectionThresholds.js` — selection/rank score floors exported from `index.ts`.

**Responsibility**

- Reorder and filter candidates after generation; break ties toward more grounded headlines where configured.

**Duplication / ambiguity / split ownership**

- **Tight coupling to candidate copy:** `rankReflections.ts` and `statementSpecificity.ts` both match **normalized exact statement text** (and phrases) that originate in `buildReflectionCandidates.ts`. This is intentional for ordering but is **split ownership of the same prose constants** across three modules.
- **Initial `rankScore` on candidates** is set in generation; **final presentation order** is further shaped by ranking/dedupe/select — two stages touching “rank” semantics.

---

## Reflection templates

**Primary files**

- `src/features/mirror/generation/reflectionTemplates.ts` — long module comment describing categories, voice, and headline rules; exports `MIRROR_REFLECTION_TEMPLATE_RULES_DOC` (string token for tooling/search). **No template functions or string tables in this file.**

**Responsibility**

- Human-readable spec / guardrails for rule-based mirror copy (documentation-as-code adjacent to the generator).

**Duplication / ambiguity / split ownership**

- **“Templates” name vs contents:** the file is **rules documentation**, not the executable template source. Executable headlines and evidence patterns live in **`buildReflectionCandidates.ts`** (and indirectly must stay aligned with **`rankReflections.ts`** / **`statementSpecificity.ts`** as noted above).

---

## Styling / layout ownership

**Primary files**

- `style.css` — main application layout, components, themes, focus mode, keyboard-open compaction, prompt/recent/settings/zen/patterns/editor chrome, imports category tokens.
- `category-colors.css` — `:root` custom properties for category accents; referenced as canonical for color tokens (`script.js` comment: JS must not hardcode hex; reads vars via `getComputedStyle`).
- `index.html` — semantic structure, regions, IDs used by `script.js`, landing vs app views, link to `style.css`.

**Responsibility**

- Visual system and responsive behavior; dark theme variants; drawer/rail/prompt/settings layout.

**Duplication / ambiguity / split ownership**

- **Inline vs stylesheet:** `script.js` builds substantial HTML strings for mirror and patterns UI; those strings include **classes** owned by `style.css`, so presentation logic is split between **string templates in JS** and **rules in CSS**.
- **Viewport / motion:** `script.js` sets CSS custom properties (`--vvh`, visual viewport helpers) that `style.css` consumes — layout split between runtime JS and static CSS.
- **Third-party:** `index.html` includes Vercel Insights script; not app-owned styling but affects load order.

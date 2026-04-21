# Structural audit (maintainability)

Scope: `main` as source of truth. Focus is seams, coupling, and regression risk — not new product ideas. Observations below are tied to files that were opened or searched in this audit (`script.js`, `index.html`, `style.css`, `src/features/mirror/**`, `package.json`).

---
 
## 1) System-by-system structure

### Prompt system

- **Where it lives:** `script.js` (`promptFamilies`, `generatePrompt`, reroll state, DOM sync, gesture guards for reroll vs field expand). Markup hooks in `index.html` (`#promptCard`, `#promptText`, `#promptRerollBtn`, etc.). Presentation in `style.css` (`.prompt-*`).
- **Shape:** Logic and copy are colocated in one monolith file; HTML/CSS are separate. No second implementation of prompt picking was found.

### Settings state

- **Where it lives:** `script.js` — single `state` object (theme, targets, timer, banned words, `optionsOpen`, history, ids, pattern words, progression, etc.), `setOptionsOpen`, `localStorage` reads/writes. Markup: `index.html` `#editorOptionsPanel` / backdrop.
- **Shape:** Persistence keys (`wayword-theme`, `wayword-history`, …) are string literals scattered through `script.js` (grep shows reads near initial state and writes in save paths). UI vocabulary mixes **`editorOptions*`** IDs with **`settings-*`** / `body.settings-open` classes.

### Review runs / recent drawer

- **Where it lives:** `script.js` — `renderHistory`, drawer open class `recent-drawer-open`, caps (`recentRunsPreviewCapDrawer` / `recentRunsPreviewCapRail`), dual lists, footers, keynav, metric explainer delegation. `index.html` — `#recentDrawer*` overlay and `#recentRail*` desktop rail, `#recentWritingTrigger`. `style.css` — `.recent-drawer-*`, `.recent-rail-*`, related layout.
- **Shape:** One feature, **two DOM targets** (`recentDrawerList` vs `recentRailList`) with branching (`list.id === "recentDrawerList"`) and duplicated listener wiring (`addEventListener` on both lists; `bindMetricExplainerDelegation` called for both IDs at file end per grep).

### Mirror engine pipeline

- **Where it lives:** `src/features/mirror/pipeline/runMirrorPipeline.ts` wires `analyzeText` → `buildReflectionCandidates` → `rankReflections` → `dedupeReflections` → `selectFinalReflections`. Browser surface: `entry-iife.ts` exports a small API; `npm run build:mirror` → `mirror-engine.iife.js`; `index.html` loads the bundle before `script.js`.
- **Shape:** Clear internal pipeline in TS. **Integration** is `globalThis.WaywordMirror` in `script.js` with per-function `typeof … === "function"` guards.

### Reflection candidate generation

- **Where it lives:** `src/features/mirror/generation/buildReflectionCandidates.ts` (headlines + evidence + initial `rankScore`). Thresholds in `constants/generationThresholds.ts` and `constants/thresholds.ts`. `generateReflections.ts` only re-exports `buildReflectionCandidates` (thin indirection). `reflectionTemplates.ts` holds **comment-only** rules plus `MIRROR_REFLECTION_TEMPLATE_RULES_DOC` — no executable templates.

### Ranking / specificity / selection

- **Where it lives:** `rankReflections.ts` (ordering weights + `compareRanked`), `statementSpecificity.ts` (tie-break scores + generic fallback set), `dedupeReflections.ts` (per-category winner, then **dedupe by normalized statement string**, then re-sort), `selectFinalReflections.ts` (floors from `selectionThresholds.ts`, main vs supporting). Pipeline order is fixed in `runMirrorPipeline.ts`.

### Styling / layout

- **Where it lives:** `style.css` (~5508 lines) imports `category-colors.css`. `script.js` sets CSS variables (`--vvh`, viewport-related) and reads category colors via `getComputedStyle` / documented CSS var names. Large blocks of HTML for mirror/post-run/patterns are **assembled as strings in `script.js`** using class names defined in `style.css`.

---

## 2) Issues (title, risk, files, severity, cleanup direction, timing)

### A. Headline string triple-coupling (generation ↔ ranking ↔ specificity)

- **Why risky:** `rankReflections.ts` and `statementSpecificity.ts` branch on **normalized full headline text** that must match strings emitted in `buildReflectionCandidates.ts`. A typo, punctuation change, or apostrophe normalization in one file silently breaks ordering, tie-breaks, or dedupe behavior. `dedupeReflections.ts` also keys duplicates by normalized `statement` text.
- **Files:** `src/features/mirror/generation/buildReflectionCandidates.ts`, `src/features/mirror/ranking/rankReflections.ts`, `src/features/mirror/ranking/statementSpecificity.ts`, `src/features/mirror/ranking/dedupeReflections.ts`
- **Severity:** **High**
- **Cleanup direction:** Introduce a single shared source for canonical headline strings (or stable **variant IDs** on candidates used only for rank/dedupe, with strings derived once). Add a cheap check (script or test) that generator headlines ⊆ ranker/specificity keys.
- **Timing:** **Can start safely now** with small, mechanical refactors (extract `const` map or shared module) without touching `script.js`.

### B. Doc-only “templates” vs implemented copy

- **Why risky:** `reflectionTemplates.ts` documents voice and rules, but **all** enforceable strings live in `buildReflectionCandidates.ts`. Editors can follow the comment file while changing code elsewhere, or drift from `rankReflections` / `statementSpecificity` expectations.
- **Files:** `src/features/mirror/generation/reflectionTemplates.ts`, `buildReflectionCandidates.ts`, `rankReflections.ts`, `statementSpecificity.ts`
- **Severity:** **Medium**
- **Cleanup direction:** Either move rules next to the generator as code comments only, or generate headlines from data structures declared beside the ranker keys — same physical module or explicit imports.
- **Timing:** **Wait** until (A) is decided; otherwise you shuffle documentation twice.

### C. Parallel copy families for “recent” mirror strings

- **Why risky:** Session-level headlines in `buildReflectionCandidates.ts` differ from recent-trend / profile phrasing in `buildReflectiveProfile.ts`, `buildRecentTrendCandidates.ts`, and literals in `getPatternsProfileFromDigests.ts` (grep shows distinct sentences such as “Across recent drafts…” vs per-run lines). That is not automatically wrong, but it is **another place** mirror-like English can diverge from product voice or from each other.
- **Files:** `src/features/mirror/generation/buildReflectionCandidates.ts`, `src/features/mirror/recent/buildReflectiveProfile.ts`, `src/features/mirror/recent/buildRecentTrendCandidates.ts`, `src/features/mirror/recent/getPatternsProfileFromDigests.ts`
- **Severity:** **Medium**
- **Cleanup direction:** Treat “session headline”, “recent trend headline”, and “patterns hero copy” as three explicit namespaces (constants or small tables), documented in one short internal README or module header — not necessarily one string pool.
- **Timing:** **Can do now** as organization-only (move strings to named constants); avoid behavior changes in the same pass.

### D. Monolithic `script.js` (~5964 lines)

- **Why risky:** Prompts, settings, persistence, focus mode, patterns, mirror HTML assembly, recent drawer/rail, calibration, and keyboard/viewport logic share one file. Any edit risks unrelated regressions; diffs are hard to review; there is no import graph to enforce boundaries.
- **Files:** `script.js` (primary); touches `index.html`, `style.css` for IDs/classes
- **Severity:** **High** (for long-term change velocity)
- **Cleanup direction:** Extract **one** vertical slice at a time (e.g. mirror DOM helpers only, or recent runs only) into ES modules behind the same bundle story — not a full rewrite.
- **Timing:** **Wait** for a dedicated milestone; first step is optional **file-internal** section banners / table of contents comments (zero behavior change) if that helps navigation.

### E. HTML string templates coupled to CSS class contracts

- **Why risky:** `script.js` builds mirror and patterns markup as string concatenation (`mirrorReflectionCardHtml`, `renderPatternsMirrorHeroHtml`, `buildMirrorRecentTrendsBlockHtml`, `renderHistory` templates). Class names (`mirror-stack`, `patterns-mirror-hero`, etc.) must stay in lockstep with `style.css`. Renaming a class in CSS without updating every string path breaks layout with no type error.
- **Files:** `script.js`, `style.css`
- **Severity:** **Medium**
- **Cleanup direction:** Centralize class name fragments in `const` objects at top of a future module, or add a short “class contract” comment listing mirror-related classes both files must honor.
- **Timing:** **Quick win** possible now (constants only); larger moves wait with (D).

### F. TypeScript mirror ↔ `script.js` integration seam

- **Why risky:** Runtime is a global `WaywordMirror` object; `script.js` feature-detects each method. Stale `mirror-engine.iife.js` relative to `src/features/mirror` yields **partial** APIs (some functions exist, others not) — behavior depends on which code paths run. `collectMirrorSessionDigestsFromHistory` assumes digest shape `d.v === 1` (`script.js`).
- **Files:** `src/features/mirror/entry-iife.ts`, `mirror-engine.iife.js` (artifact), `index.html` (script order), `script.js` (guards, calls, `cloneMirrorPipelineResultForStorage`, digest `v` check)
- **Severity:** **High** for deployment discipline; **medium** for day-to-day coding if build is always run
- **Cleanup direction:** CI or pre-commit: verify `mirror-engine.iife.js` is newer than TS inputs, or stop committing the bundle and generate at deploy time (policy choice, not inspected here).
- **Timing:** **Can do now** as process/CI; **wait** on large bundler changes until you pick a build policy.

### G. Dual recent UI surfaces (drawer + rail)

- **Why risky:** Same `renderHistory` path must satisfy two caps, two footers, empty-state rules that differ by `list.id`, and duplicate event binding. Fixes for one layout can miss the other.
- **Files:** `script.js`, `index.html`, `style.css`
- **Severity:** **Medium**
- **Cleanup direction:** Extract `renderRecentEntryRow(item, listKey)` and shared “which list gets empty state” policy into named helpers with explicit parameters instead of inline `isDrawer` branches.
- **Timing:** **Can do incrementally now** in small extractions; avoid big DOM rewrites in the same change as mirror work.

### H. Settings naming split (`editorOptions` vs `settings`)

- **Why risky:** Onboarding and searchability suffer; easy to wire the wrong element when adding controls.
- **Files:** `script.js`, `index.html`, `style.css` (`settings-open`, `settings-modal`, …)
- **Severity:** **Low**
- **Cleanup direction:** Document the mapping in `SYSTEM_OWNERSHIP.md` / one comment block, or rename IDs in a focused PR (risky for saved bookmarks/tests — only if you have them).
- **Timing:** **Quick win** = documentation only; **rename** = schedule when you can regression-test UI.

### I. `generateReflections.ts` as a misleading entry point

- **Why risky:** Filename suggests a generator; file only re-exports `buildReflectionCandidates`. Pipeline imports `buildReflectionCandidates` directly (`runMirrorPipeline.ts`).
- **Files:** `src/features/mirror/generation/generateReflections.ts`, `src/features/mirror/pipeline/runMirrorPipeline.ts`, `src/features/mirror/index.ts` (exports)
- **Severity:** **Low**
- **Cleanup direction:** Deprecate export name in comments, delete file if nothing external imports it (verify before removal).
- **Timing:** **Safe now** after a repo-wide grep for `generateReflections` / `generateReflectionCandidates` consumers.

### J. Large `style.css` without modular split

- **Why risky:** Merge conflicts and hard-to-find rules; coupling already exists via `script.js` string HTML.
- **Files:** `style.css`, `category-colors.css`
- **Severity:** **Low** (operational pain, not immediate correctness)
- **Cleanup direction:** Optional split by feature folder mirroring `src` (only if team agrees on import discipline).
- **Timing:** **Leave alone** until mirror/HTML seam (E) is stable.

---

## 3) Prioritized cleanup plan

### Quick wins (low blast radius)

1. Add a **build / artifact** check so `mirror-engine.iife.js` cannot lag TS silently (issue **F**).
2. Extract **mirror CSS class name** fragments or a short comment manifest next to `mirrorReflectionCardHtml` (issue **E**).
3. Grep-driven cleanup: **`generateReflections.ts`** usage and either document or remove (issue **I**).
4. Document **`editorOptions` ↔ `settings`** naming in existing ownership docs (issue **H**).

### Important structural fixes (plan explicitly; avoid drive-by)

1. **Unify headline identity** across generator, ranker, specificity, and dedupe (issue **A**) — highest leverage for mirror correctness.
2. **Namespace recent vs session copy** into explicit constants tables (issue **C**) after (A) pattern is chosen.
3. **Extract recent-rail/drawer** shared rendering from `renderHistory` into testable helpers (issue **G**).

### Leave alone for now

1. **Full modularization of `script.js`** (issue **D**) — schedule, not incremental drive-by.
2. ** wholesale `style.css` split** (issue **J**) until there is a clear module story.
3. **Renaming every `editorOptions` ID** (issue **H**) without a dedicated QA pass.

---

## 4) Explicit non-findings (this pass did not inspect)

- Runtime performance, accessibility audits, security review of third-party scripts (`index.html` loads Vercel Insights).
- Whether any external package consumes `src/features/mirror/index.ts` exports beyond this repo.
- Full line-by-line read of every helper in `script.js` outside the grep windows used for mirror, recent, settings, and prompts.

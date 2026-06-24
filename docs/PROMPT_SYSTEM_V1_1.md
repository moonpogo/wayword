# Prompt system v1.1

Editorial doctrine (private): `docs/EDITORIAL_DOCTRINE.md`.

## Runtime Truth

The current alpha runtime is **Entry / Torsion first**.

| Layer / family | Runtime status | Posture |
|--------|---------|---------|
| **Entry** | Active default | Low-stakes initiation: nearby perception, concrete footholds, first-language motion. |
| **Torsion** | Active, conservatively weighted after readiness | Constraint/variation: contrast, relation, re-description, productive pressure. |
| **Resonance** | Data scaffold only; zero runtime weight | Paradox/depth prompts exist in the corpus but are not selected by the alpha runtime. |
| **Scene / Relation / Pressure / Constraint** | Legacy fallback only | Older prompt families remain loaded so the app has a safe fallback if the layered prompt catalog is unavailable. |

Source of truth:

- Active layered prompt corpus: `src/features/prompts/layered-prompts.js`
- Layer routing / runtime catalog builder: `src/features/prompts/prompt-system-mode.js`
- Selection / reroll mechanics: `src/features/writing/prompt-selection.js` and `src/app/prompt-runtime.js`
- Legacy fallback corpus: `src/features/prompts/prompt-library.js`

There is no separate `calibration-prompts.js` runtime source. The early first-session entry flow uses the Entry layer, restricted by `FIRST_SESSION_ENTRY_PROMPT_IDS` in `src/features/prompts/prompt-system-mode.js`.

## History (compact)

- `recentPromptIds`: last `PROMPT_RECENT_ID_WINDOW` picked prompt ids (no repeat while id remains in window).
- `recentFamilyKeys`: last `PROMPT_RECENT_FAMILY_WINDOW` picks for soft family spacing (not a ranker).
- `PROMPT_NEAR_DUPLICATE_WINDOW`: suppress picking a prompt whose `nearDuplicateGroup` matches any of the last N picks.

## Selection

- Default: weighted family pick among families with eligible prompts, then uniform random among eligible in that family.
- Reroll: **in-family first** (`familyKey: state.promptFamily`); relax near-duplicate; then **one** cross-family sweep if still empty.
- First run / first-session entry: prompt generation is forced to **Entry** and narrowed to `FIRST_SESSION_ENTRY_PROMPT_IDS`.
- Readiness routing: `entry_support` and `entry_stable` expose only Entry; `torsion_ready` and `resonance_candidate` include Torsion with conservative weighting. Resonance remains unweighted.

## Constants

See `src/config/constants.js`: `PROMPT_RECENT_ID_WINDOW`, `PROMPT_NEAR_DUPLICATE_WINDOW`, `PROMPT_RECENT_FAMILY_WINDOW`, `PROMPT_REROLL_LIMIT`.

## Non-goals

No prompt generation, ranking engine, personalization, user-facing layer chooser, or extra prompt surface variants.

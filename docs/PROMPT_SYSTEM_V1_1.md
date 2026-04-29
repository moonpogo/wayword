# Prompt system v1.1

Editorial doctrine (private): `docs/EDITORIAL_DOCTRINE.md`.

## Families

| Family | Posture |
|--------|---------|
| **Scene** | Outward notice: place, residue, concrete scene, objects, and physical staging. |
| **Relation** | Between people: unsaid, kindness, avoidance, trace. |
| **Pressure** | Pressure, withholding, edge, cost, forks, and near-misses. |
| **Constraint** | Explicit rule on the sentence (withholding channels/categories). |
| **Calibration** | Separate onboarding/calibration prompt family; not part of main random family order. |

Source of truth:

- Main family order and prompt corpus: `src/features/prompts/prompt-library.js`
- Calibration family and prompt corpus: `src/features/prompts/calibration-prompts.js`

Removed as runtime families: **Indirection**, **Social**, **Object**, **Observation**, **Tension**, **Possibility** (material redistributed).

## History (compact)

- `recentPromptIds`: last `PROMPT_RECENT_ID_WINDOW` picked prompt ids (no repeat while id remains in window).
- `recentFamilyKeys`: last `PROMPT_RECENT_FAMILY_WINDOW` picks for soft family spacing (not a ranker).
- `PROMPT_NEAR_DUPLICATE_WINDOW`: suppress picking a prompt whose `nearDuplicateGroup` matches any of the last N picks.

## Selection

- Default: weighted family pick among families with eligible prompts, then uniform random among eligible in that family.
- Reroll: **in-family first** (`familyKey: state.promptFamily`); relax near-duplicate; then **one** cross-family sweep if still empty.
- Calibration: while saved runs are below the calibration threshold, prompt generation uses the separate **Calibration** pool instead of the main family order.

## Constants

See `src/config/constants.js`: `PROMPT_RECENT_ID_WINDOW`, `PROMPT_NEAR_DUPLICATE_WINDOW`, `PROMPT_RECENT_FAMILY_WINDOW`, `PROMPT_REROLL_LIMIT`.

## Non-goals

No ranking engine, personalization, or extra prompt surface variants.

# Prompt system v1.1

## Families (source of truth: `script.js` → `promptLibrary`)

| Family | Posture |
|--------|---------|
| **Observation** | Outward notice: place, residue, concrete scene (includes former **Object** prompts). |
| **Relation** | Between people: unsaid, kindness, avoidance, trace. |
| **Tension** | Pressure, withholding, edge, cost. |
| **Possibility** | Forks and near-misses—kept intentionally small. |
| **Constraint** | Explicit rule on the sentence (withholding channels/categories). |

Removed as families: **Indirection**, **Social**, **Object** (material redistributed).

## History (compact)

- `recentPromptIds` — last `PROMPT_RECENT_ID_WINDOW` picked prompt ids (no repeat while id remains in window).
- `recentFamilyKeys` — last `PROMPT_RECENT_FAMILY_WINDOW` picks for soft family spacing (not a ranker).
- `PROMPT_NEAR_DUPLICATE_WINDOW` — suppress picking a prompt whose `nearDuplicateGroup` matches any of the last N picks.

## Selection

- Default: weighted family pick among families with eligible prompts, then uniform random among eligible in that family.
- Reroll: **in-family first** (`familyKey: state.promptFamily`); relax near-duplicate; then **one** cross-family sweep if still empty.

## Constants

See `src/config/constants.js`: `PROMPT_RECENT_ID_WINDOW`, `PROMPT_NEAR_DUPLICATE_WINDOW`, `PROMPT_RECENT_FAMILY_WINDOW`, `PROMPT_REROLL_LIMIT`.

## Non-goals

No ranking engine, personalization, or extra prompt surface variants.

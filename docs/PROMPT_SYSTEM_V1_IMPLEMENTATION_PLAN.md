# Prompt System V1 Implementation Plan

## Current Status
This file is historical. It records the scaffold plan that introduced layered prompt data.

The current alpha runtime now loads the layered prompt catalog by default through `script.js`, `src/features/prompts/layered-prompts.js`, and `src/features/prompts/prompt-system-mode.js`.

For current runtime truth, use `docs/PROMPT_SYSTEM_V1_1.md`.

## Original Scope Of This Pass
This pass added Prompt System V1 scaffold data only.

Included now:
- a V1 layered prompt data module
- all three foundation prompt layers encoded as structured prompt entries
- integrity tests for schema and counts

Not included now:
- runtime prompt replacement
- calibration behavior changes
- reroll behavior changes
- UI changes
- adaptive layer routing

## Runtime Status
This section is superseded.

V0 Scene / Relation / Pressure / Constraint prompts remain in `src/features/prompts/prompt-library.js`, but they are legacy fallback material rather than the normal alpha prompt source.

The active alpha path builds an Entry / Torsion catalog from `src/features/prompts/layered-prompts.js`. Resonance prompts are scaffolded but not selected because `src/features/prompts/prompt-system-mode.js` assigns Resonance zero runtime weight.

## Layer Roadmap
Prompt System V1 scaffold now contains all three foundation layers:

- Entry: 30 prompts
- Torsion: 25 prompts
- Resonance: 25 prompts

V1 runtime currently means Entry-first with conservative Torsion exposure after readiness signals. Resonance is data-scaffolded but not routed.

## Integration Strategy
Runtime integration has already happened. Future changes should avoid broad replacement and instead adjust the narrow seams below.

Recommended integration stages:
1. keep `layered-prompts.js` as the prompt corpus source for active alpha prompts
2. adjust readiness weights in `prompt-system-mode.js` only when alpha evidence supports it
3. keep Resonance at zero runtime weight until the founder explicitly decides to expose paradox/depth prompts
4. leave `prompt-library.js` as fallback until a dedicated deletion/archive pass removes it safely

There is no public UI toggle for prompt-system mode at this stage.

## Canonical Doctrine
`docs/PROMPT_ARCHITECTURE_V1.md` is the canonical doctrine for Prompt System V1.

Architecture decisions, anti-pattern boundaries, and progressive layering rules should remain aligned to that document.

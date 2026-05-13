# Prompt System V1 Implementation Plan

## Scope Of This Pass
This pass adds Prompt System V1 scaffold data only.

Included now:
- a V1 layered prompt data module
- the approved Layer 1 foundation set encoded as structured prompt entries
- integrity tests for schema and counts

Not included now:
- runtime prompt replacement
- calibration behavior changes
- reroll behavior changes
- UI changes
- Layer 2 / Torsion implementation
- Layer 3 / Resonance implementation

## Runtime Status
V0 prompt runtime remains active in production paths.

This pass does not change live prompt selection, family weighting, calibration routing, reroll logic, or render behavior.

## Layer Roadmap
Layer 1 is scaffolded in data form.

Layer 2 and Layer 3 are intentionally deferred. The next conceptual specification pass should define Resonance before Torsion, then stage implementation sequencing after validation.

## Integration Strategy
Future runtime integration should be introduced behind a safe switch or development flag before replacing V0 behavior.

Recommended integration stages:
1. load V1 data in parallel with V0
2. add non-default gated selection path for V1
3. run integrity and regression checks against both paths
4. switch default only after behavior and quality signoff

## Canonical Doctrine
`docs/PROMPT_ARCHITECTURE_V1.md` is the canonical doctrine for Prompt System V1.

Architecture decisions, anti-pattern boundaries, and progressive layering rules should remain aligned to that document.

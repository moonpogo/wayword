# Spacing System Notes (Prompt + Controls + Header)

## Objective

Establish one compositional rhythm system so modules feel authored into the same field, not independently dropped.

## Key System Changes

1. Prompt and controls now share one layout container
- `#promptCard` now uses a two-column grid:
  - text lane: `minmax(0, 1fr)`
  - utility lane: fixed `30px` (regression correction to prevent icon clipping)
- control spine moved from absolute positioning to in-flow positioning.

2. Unified prompt inset logic
- prompt vertical inset tightened to `--prompt-row-inset-y: 8px`.
- prompt control gap tightened to `1px`.
- prompt bottom padding aligned with same inset token.

3. Header activation spacing normalization
- Patterns activation remains label-only with a top-edge indicator model.
- hover/focus now previews a faint top-line; active state keeps a firm top-line.
- visual blockiness reduced without returning to tab chrome.

4. Utility scale normalization
- control stack visual mass reduced while preserving glyph integrity (controls restored to stable visible size).
- glyph scale reduced so controls align with prompt text cadence, not sidebar dominance.

5. Tool-family opacity cadence
- shared rest/hover/active opacity rhythm now governs infrastructural tools as one family.
- removes mixed icon loudness across header/prompt/editor utility surfaces.
- shared tool color token now normalizes passive gray tone across icon families.

6. Account control cadence
- account icon remains in top rail cadence with quiet, shadowless linework.

7. Right rail alignment
- account icon and PATTERNS now share one optical right-rail offset.

8. Regression corrections
- reroll/pencil clipping resolved by widening control lane and re-centering badge inset.
- fold/unfold quiet rest state restored (subdued gray opacity, stronger only on interaction).
- utility lane now retains compactness without over-compression or glyph clipping at 1/2/3-line prompts.

9. Right rail + logo tone correction
- right-side rail offset adjusted so PATTERNS terminal edge aligns to the main rule edge.
- account icon optical alignment corrected by shifting glyph position within the control hitbox.
- logo now follows theme-aware tonal tokens (light and dark) instead of raw asset black.

## Spatial Effects

- reduced dead space between prompt text and utility stack
- reduced detached floating-control feel
- clearer shared relationship to horizontal rules
- stronger authored tension between header activation and prompt field

## Functional Guarantees

- auth functionality preserved
- Patterns functionality preserved
- responsive behavior preserved by keeping existing breakpoint structure intact

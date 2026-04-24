# QA Regression Checklist

## Core entry
- [ ] Landing page renders correctly (desktop + mobile)
- [ ] Begin opens the app correctly (desktop + mobile)
- [ ] No blank state after Begin
- [ ] No console-breaking runtime behavior visible in normal use

## Prompt flow
- [ ] Prompt appears on first entry
- [ ] Normal reroll works
- [ ] In-family reroll works when eligible prompts exist
- [ ] Cross-family reroll happens only after in-family exhaustion
- [ ] Near-duplicate suppression holds until strict options are exhausted
- [ ] Recent prompt suppression still behaves correctly
- [ ] Prompt text renders cleanly on mobile and desktop

## Editor
- [ ] Editor is visible immediately after entry
- [ ] No unwanted horizontal page scroll (desktop + mobile)
- [ ] No broken vertical body scroll behavior (desktop + mobile)
- [ ] Text area/layout fits correctly on common mobile viewport
- [ ] Desktop layout does not clip or overflow
- [ ] Live annotation/dot behavior does not visibly break layout
- [ ] Typing feels normal
- [ ] Focus behavior is normal

## Submit + mirror
- [ ] Submit works on a normal draft
- [ ] Mirror panel appears correctly
- [ ] No blank mirror state
- [ ] Primary reflection renders
- [ ] Supporting reflections render when applicable
- [ ] Mirror cards render without visible evidence controls
- [ ] No stale `Context` / `Hide` buttons or evidence toggles appear
- [ ] Internal evidence/scoring behavior is not exposed in the UI
- [ ] Mirror copy is visually contained and not clipped

## Recent runs
- [ ] New run is saved correctly
- [ ] Recent runs opens
- [ ] Recent runs closes
- [ ] Selecting a recent run restores the correct content/output
- [ ] Recent runs layout does not overflow viewport
- [ ] Desktop rail/drawer behavior does not visually break
- [ ] Mobile drawer spacing and top offset feel correct

## Patterns
- [ ] Patterns opens correctly
- [ ] Patterns closes correctly
- [ ] No panel layering bug
- [ ] No overflow/bleed beyond container
- [ ] Cross-run copy renders cleanly
- [ ] No duplicated or obviously broken card behavior

## Persistence / reset
- [ ] Refresh preserves expected local data
- [ ] Saved runs remain accessible after refresh
- [ ] Patterns still work after refresh
- [ ] Reset clears expected state
- [ ] App can begin cleanly again after reset

## Visual / layout sanity
- [ ] No obvious overlapping panels
- [ ] No clipped buttons or unreadable text
- [ ] No double-drawer feeling or conflicting surface behavior
- [ ] No regressions in spacing around major controls
- [ ] App still feels like a single coherent window rather than a broken scroll stack

## Final pre-push check
- [ ] Run one full end-to-end flow from landing to saved run
- [ ] Run one reroll-specific sanity pass
- [ ] Check mobile viewport once
- [ ] Check desktop viewport once

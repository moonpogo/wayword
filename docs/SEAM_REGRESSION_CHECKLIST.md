# Seam Regression Checklist

Use this compact checklist before and after any selected-seam migration. It supplements `docs/QA_REGRESSION_CHECKLIST.md`.

## Post-Submit / Calibration

- [ ] Submit locks editor and sets post-submit UI active.
- [ ] Calibration baseline runs suppress below-editor Mirror card.
- [ ] Insufficient calibration submit does not count as a full saved run.
- [ ] Threshold handoff appears once when expected.
- [ ] Handoff blocks completed-run restart shortcuts.
- [ ] Continue starts a fresh run.
- [ ] View Patterns opens Patterns and acknowledges handoff.
- [ ] Normal post-calibration submit shows statement-only Mirror.
- [ ] Next-pass nudge starts a fresh run and clears post-submit surfaces.

## Prompt / Reroll

- [ ] Prompt appears after Begin.
- [ ] Reroll works while editor is empty.
- [ ] Reroll locks after typing.
- [ ] Reroll remains unavailable after submit.
- [ ] Same-family reroll is preferred before cross-family fallback.
- [ ] Recent-id and near-duplicate suppression still apply.
- [ ] Calibration prompts remain separate from main prompt history.

## Recent Runs

- [ ] Successful saved run appears in drawer and desktop rail.
- [ ] Drawer opens/closes with correct ARIA/body class state.
- [ ] Desktop rail expands without increasing document height.
- [ ] Drawer/rail row expansion behavior stays aligned.
- [ ] Recent Runs does not show Mirror evidence controls.

## Patterns

- [ ] Locked state appears before calibration threshold.
- [ ] Patterns opens after enough saved runs.
- [ ] Desktop Patterns uses side-column layout.
- [ ] Mobile Patterns exits focus mode and sets `patterns-open`.
- [ ] Closing Patterns restores writing layout/classes.
- [ ] Clear Saved Runs modal opens, cancels, confirms, and resets visible state.

## Focus / Viewport

- [ ] Mobile editor focus enters focus mode.
- [ ] Focus exit clears stale `keyboard-open`.
- [ ] Recent Runs and Patterns open paths exit focus mode cleanly.
- [ ] Breakpoint resize does not leave stale `recent-rail-expanded` or `patterns-open`.
- [ ] No unwanted document horizontal scroll.

## Persistence / Reset

- [ ] Canonical run documents are written before legacy sync attempt completes.
- [ ] Legacy `wayword-history` and `wayword-runids` are still written.
- [ ] Refresh restores saved runs through canonical read path.
- [ ] Reset/clear saved runs clears canonical docs and legacy saved-run keys.
- [ ] Progression recalculates from saved runs, not transient UI state.

## Script Load Order

- [ ] `mirror-engine.iife.js` loads before Mirror controller and `script.js`.
- [ ] `mirror-dom.js` loads before post-run render paths.
- [ ] App/runtime/helper globals exist before `script.js`.
- [ ] `npm run verify:mirror-bundle` passes after Mirror TypeScript edits.
- [ ] Cache query tokens are bumped when committed browser artifacts or cached UI scripts change.

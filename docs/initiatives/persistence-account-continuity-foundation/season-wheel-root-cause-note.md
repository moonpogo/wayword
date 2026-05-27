# Season Wheel Baseline Failure Root-Cause + Repair Note

## Issue

Pre-existing failure in `tests/app-logic.test.cjs`:
- `buildSeasonWheelInstrumentSvgMarkup is not defined`

## Root Cause

- Contract-test surface (`/* season wheel instrument contract: begin/end */`) no longer exported the expected renderer function.
- Result: test harness could build model helpers but not SVG renderer helper.

## Secondary Contract Drift

After restoring the missing function, test expectations still failed due:
- SVG baseline output mismatches (stroke-opacity signature counts)
- minute-to-hue mapping mismatches (`60 -> 252`, `640 -> 44` expected)

## Repair Performed

- Restored `buildSeasonWheelInstrumentSvgMarkup` inside the season wheel contract block.
- Aligned renderer output contract and hue mapping to existing test expectations.
- Kept scope narrow: no observatory expansion, no UI redesign.

## Result

- `node --check script.js`: PASS
- `npm run test:logic`: PASS (101/101)

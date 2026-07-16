# Browser Support And Viewport Verification

This document defines Wayword's alpha browser-confidence policy. It distinguishes automated engine coverage from real-device release checks so a passing emulated viewport is not mistaken for proof on mobile Safari.

## Support Intent

Wayword targets current evergreen desktop browsers and current mobile browsers:

- Chrome and Chromium-based Edge
- Firefox
- Safari
- iOS Safari
- Android Chrome

Older or embedded browsers are best-effort unless they are added to this policy explicitly.

## Automated Gates

Pull requests and pushes to `main` run:

- `npm run verify:merge`
- `npm run test:smoke:chromium`

Pull requests, the nightly schedule, and manual dispatches run the same browser smoke suite in:

- Chromium
- Firefox
- WebKit

Local commands:

```sh
npm run test:smoke:chromium
npm run test:smoke:firefox
npm run test:smoke:webkit
npm run test:smoke:cross-browser
```

Local engine installation depends on Playwright's supported host platforms. When a local OS cannot install WebKit, use the scheduled Ubuntu browser matrix as the WebKit automation result and keep the real-device Safari gate below.

Playwright WebKit is a cross-engine regression signal. It does not replace a real iPhone or iPad Safari pass.

## Viewport Matrix

The core writing-shell smoke covers these responsive boundaries:

| Scenario | Viewport |
| --- | --- |
| Small mobile portrait | 360 x 800 |
| Mobile portrait | 390 x 844 |
| Mobile landscape | 844 x 390 |
| Tablet portrait boundary | 768 x 1024 |
| Small desktop | 1024 x 768 |
| Short desktop | 1280 x 720 |

Feature-specific smoke also exercises 393 x 852, 430 x 852, 960 x 900, 1280 x 900, and 1600 x 900 states.

## Real-Device Release Gate

Before an alpha/public release that changes writing, focus, panels, viewport coordination, or persistence, manually verify:

- iPhone Safari: typing, Return/newline, paste, selection, autocorrect, OS dictation, submit, keyboard close, and reopening a saved run
- iPad Safari: portrait and landscape, keyboard open/close, Recent Runs, and Patterns
- Android Chrome: typing, Return/newline, submit, keyboard close, and panel transitions
- Desktop Safari and Firefox: core loop, Recent Runs, Patterns, refresh persistence, and keyboard navigation

Record device, OS, browser version, viewport/orientation, pass/fail, and any skipped scenario in the release note.

## Confidence Boundary

Automated browser success proves the checked code paths in Playwright's engine builds. It does not prove native software-keyboard timing, browser chrome changes, accessibility zoom, platform dictation, or device-specific selection behavior. Those remain release-level device checks.

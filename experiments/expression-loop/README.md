# Expression Loop Prototype

This is an isolated V2 prototype. It does not change the V1 app runtime, production persistence, Mirror, Recent Runs, Patterns, telemetry, or saved-run schemas.

## Run

From the repo root:

```sh
node scripts/preview-bg.js
```

Open:

```text
http://127.0.0.1:3001/experiments/expression-loop/
```

## Interaction Paths

- Supported path: opener plus first expression by typing or browser speech recognition -> encounter and line selection -> movement from the selected line -> second expression by typing or speech -> reflection and final artifact.
- Fallback path: if browser speech recognition is unavailable or fails, type directly or use operating-system dictation in the text field.
- Local fallback check: append `?speech=off` to the experiment URL to force the unsupported-speech copy without changing browser permissions.
- The prototype includes a developer-only session selector for `certainty-memory-01`, `attention-sounds-01`, and `question-threshold-01`.
- Changing the selected session resets all in-memory text, selected material, modality path, and visible surface state.
- The visible UX has three surfaces, while the controller still tracks more detailed conceptual states in memory.

## Sessions

- Certainty tests an epistemic hinge: choose the sentence you trust least, then write or speak from what could be wrong about it.
- Attention tests a perceptual hinge: wait in silence for ten seconds, name five sounds, choose the sound noticed last, then describe where it seems to come from.
- Question tests a structural hinge: speak or type until a question appears, choose a question detected by local punctuation, then answer it in writing without trying to resolve it.

The attention prelude is a prototype-only timed silence field. The blob starts the silence, but the microphone does not start automatically when the silence ends.

Selection currently uses two local granularities: `sentence` and `item`. All three sessions use selection for `movement-source`; selected lines do not train or personalize the system.

## Privacy Behavior

- Wayword does not intentionally record, upload, retain, or play back audio in this prototype.
- Browser speech recognition may temporarily process audio through the browser, operating system, or speech provider.
- Prototype text, selected lines, modality path, and session state stay in memory only.
- Reloading the page or ending the session discards prototype state.

## Known Browser Limitations

- Browser speech recognition availability varies by browser and platform.
- Some browsers do not expose `SpeechRecognition` or `webkitSpeechRecognition`.
- Some browsers may require microphone permission before speech can start.
- Speech results and permission behavior are controlled by the browser speech stack, not by Wayword.
- Question selection is punctuation-only. If no segment ends in `?`, the prototype offers all local sentence segments with fallback copy.
- Item selection for attention is deterministic and simple: lines and commas are preferred, then sentence-like segments.

## Preview Testing

Use an HTTPS Vercel preview to test browser permission behavior and mobile browser differences. The route pattern is:

```text
https://<preview-host>/experiments/expression-loop/
```

Do not assume HTTPS guarantees browser speech support. Operating-system dictation and browser `SpeechRecognition` are separate paths:

- OS dictation enters text through the system keyboard or dictation UI and should work like typing in the text fields.
- Blob-controlled speech uses the browser speech-recognition API when the browser exposes it and permission is granted.

Prototype-only speech diagnostics appear in the developer notes area. They report local lifecycle and browser error states such as API unavailable, microphone permission denied, microphone unavailable, recognition startup failure, recognition started, recognition ended, no speech detected, audio capture error, network or speech-service failure, aborted recognition, and unsupported language or service errors when surfaced by the browser.

Recommended matrix:

- macOS Safari: system dictation, blob speech, permission prompt, start/stop, fallback, all three sessions.
- macOS Chrome: system dictation, blob speech, permission prompt, start/stop, fallback, all three sessions.
- iPhone Safari: keyboard dictation, blob speech, permission prompt, mobile layout, all three sessions.
- iPhone Add to Home Screen: keyboard dictation, blob speech, whether `SpeechRecognition` is exposed, permission behavior, return-to-app state, all three sessions where possible.
- Android Chrome: test only when a device is readily available.

Preview access may be public depending on the Vercel project settings. Use non-sensitive speech and writing on any unprotected preview.

## Intended To Test

- Whether a three-surface interaction can hold the opener, expression, encounter, movement, and artifact without feeling over-stepped.
- Whether selecting a line creates an immediate enough hinge into the movement.
- Whether the same selection hinge works across certainty, attention, and question mechanics.
- Whether speech-first or mixed-mode expression feels like Wayword rather than a dictation utility.
- Whether the privacy boundary is understandable without dominating the experience.

## Does Not Prove

- Production saved-run shape.
- Mirror behavior for V2 runs.
- Recent Runs or Patterns representation.
- Speech availability across all target devices.
- Transcription accuracy.
- Long-term retention or analytics value.
- Whether selected lines should train or personalize any future system.
- Production content strategy, personalization, or saved-run architecture.

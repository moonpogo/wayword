# Mobile Expression Loop Prototype Findings

## Prototype Purpose

The Expression Loop mobile prototype tested whether Wayword V2 can begin with a voice-forward opener, move through a user's own language, and end in a small artifact without touching production runtime behavior or persistence.

The prototype is a mobile-first interaction reference. It is not a production saved-run implementation and is not the canonical desktop interface.

## Tested Sessions

- `certainty-memory-01`: tell a memory as if certain, choose the sentence trusted least, then describe what could be wrong about it.
- `attention-sounds-01`: wait in silence, name five sounds, choose the sound noticed last, then describe where it seems to come from.
- `question-threshold-01`: speak or type until a question appears, choose the question, then answer it without trying to resolve it.

## Three Visible Surfaces

- Initiation and expression: opener, optional silence prelude, blob speech control, and text field.
- Encounter, selection, movement, and shaping: first expression visible as selectable material, selected line or item, movement instruction, and second expression field.
- Reflection and final artifact: selected material, shaped response, and final artifact copy.

The controller keeps more detailed conceptual states in memory, but the mobile UI compresses them into these three visible surfaces.

## Blob Lifecycle States

- Unavailable: browser speech recognition is absent, forced off, or not allowed for the active step.
- Idle: speech is available and waiting for the user.
- Receiving: recognition has started and the prototype is receiving interim or final transcript text.
- Stopped: recognition ended, failed, or was stopped by the user.
- Prelude: the Attention session uses the blob to start timed silence before expression.

## What Worked

- The opener, expression, encounter, selection, movement, second expression, and artifact sequence held together as a small complete practice.
- Selection worked as the hinge between first expression and movement across Certainty, Attention, and Question mechanics.
- The developer session selector made it easy to compare mechanics without adding production navigation.
- The memory-only boundary stayed clear: reloads discard prototype state, and no audio or text is intentionally persisted by Wayword code.
- Typing and operating-system dictation remained viable fallbacks when browser speech was missing or awkward.

## What Failed Or Remained Fragile

- Browser speech availability was inconsistent enough that the blob could not be treated as dependable infrastructure.
- Permission prompts and browser-specific speech behavior interrupted the ritual quality of the interaction.
- Mobile browser speech could fail even when the rest of the mobile UI worked.
- Question detection was punctuation-only and should not be treated as durable language understanding.
- The three-surface flow is helpful on mobile, but it should not define the desktop model.

## Browser Speech And OS Dictation Findings

Operating-system dictation behaves like text entry. It can fill the fields without Wayword controlling the speech lifecycle.

Browser `SpeechRecognition` gives Wayword more ritual control over start, stop, status, and receiving states, but its availability and permission behavior vary by browser and platform. Browser speech may also involve temporary processing by the browser, operating system, or speech provider.

Wayword should not claim that browser speech is private in the same way as local text entry. The product boundary remains: Wayword prototype code does not intentionally record, upload, retain, or play back audio.

## Desktop Browser Permission Friction

Desktop browsers can expose speech recognition, but permission prompts, blocked speech services, and startup failures introduce repeated friction. OS dictation is a better desktop input assumption because it enters text through the system and does not require Wayword to manage microphone permissions.

## Mobile Browser Blob-Speech Failure

Mobile browsers cannot be assumed to expose a reliable blob-controlled speech path. The mobile layout and interaction can still work through typing and OS keyboard dictation, but first-class mobile voice likely requires native iOS and Android speech spikes.

## Carry Forward

- opener
- expression
- encounter
- selection as hinge
- movement
- artifact

## Do Not Universalize

- mobile card or surface flow
- blob-centered input
- browser `SpeechRecognition`
- touch-specific selection

## Screenshots

Representative screenshots captured in this preservation pass:

- `docs/product/reference/mobile-expression-loop/screenshots/initiation-expression.png`
- `docs/product/reference/mobile-expression-loop/screenshots/encounter-selection.png`
- `docs/product/reference/mobile-expression-loop/screenshots/reflection-artifact.png`
- `docs/product/reference/mobile-expression-loop/screenshots/attention-silent-prelude.png`
- `docs/product/reference/mobile-expression-loop/screenshots/developer-session-selector.png`
- `docs/product/reference/mobile-expression-loop/screenshots/speech-unavailable-diagnostic.png`

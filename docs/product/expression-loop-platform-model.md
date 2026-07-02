# Expression Loop Platform Model

## Purpose

Wayword V2 uses one shared Expression Loop grammar with platform-specific renderers. The language loop is the product constant; each platform may choose the interaction model that fits its physical and cognitive strengths.

## Shared Expression Loop Grammar

Canonical across platforms:

```text
opener
-> expression
-> encounter
-> selection
-> movement
-> second expression
-> artifact
```

Shared assets and semantics:

- product thesis
- opener library
- movement library
- closure and artifact logic
- selection purpose
- privacy doctrine
- evaluation principles
- eventual run representation
- session fixture and content definitions

The shared grammar is not a screen layout. It defines the practice shape that mobile, desktop, and future clients render in platform-specific ways.

## Mobile Interpretation

Mobile may be:

- voice-forward
- sequential
- single-focus
- shaped around a native speech lifecycle
- organized around the blob as ritual control
- touch-based for selection
- shorter or timed in session shape
- typed when needed, with typing available but secondary

Complete sessions must remain possible on mobile without desktop. Browser speech is not reliable enough to define the mobile architecture, so native mobile speech spikes are likely required for first-class mobile voice.

## Desktop Interpretation

Desktop should be:

- text-forward
- spatial and continuous
- designed so the first expression remains visible
- built around inline selectable sentences
- clear through hover and keyboard-focus affordances
- explicit that the selected sentence remains bolded in context
- willing to repeat the selected sentence at the point of action
- careful that existing flags buffer remains a separate semantic channel
- progressive, with the movement rolling out below the selection
- progressive, with the second writing field appearing after commitment
- stable enough to keep both expressions visible
- compatible with OS dictation as text input
- free of any browser speech dependency

The current Wayword desktop design canon remains the visual authority for desktop V2 experiments.

## Platform Rule

Wayword is one practice with platform-specific renderers. Platform UX may diverge, but session definitions, selection semantics, artifacts, and eventual saved-run compatibility must not.

## Rejected Model

Wayword is not adopting:

- mobile as a separate voice-journaling product
- desktop as a legacy writing-prompt product
- one identical responsive interface across every device

## File Ownership

Shared:

- `docs/product/wayword-v2-expression-model.md`
- `docs/product/expression-session-grammar.md`
- `docs/product/expression-loop-prototype-sessions.json`
- `docs/product/expression-loop-platform-model.md`

Mobile-specific:

- `experiments/expression-loop/`
- `docs/product/reference/mobile-expression-loop/`

Desktop-specific:

- `experiments/expression-loop-desktop/`

The shared fixture should not be duplicated into separate mobile and desktop copies.

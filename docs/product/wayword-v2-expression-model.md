# Wayword V2 Expression Model

## Purpose

This document defines the first product contract for Wayword's V2 expression-loop track.

V2 should be built beside the current V1 app until the new loop is proven. V1 remains the stable shipped expression: prompt, writing field, submit, Mirror, Recent Runs, and Patterns.

## Product Thesis

Wayword gives people brief practices for beginning language, encountering what they express, and moving it somewhere new.

The user supplies the primary material. Wayword supplies the opening, the movement, and the conditions for returning to the language without grading it.

## Why V1 Is Not Enough

V1 treats the prompt as the main generative event and the draft as the primary artifact. That model works, but it compresses too much of the experience into a single writing field:

- the prompt starts the run
- the user produces one response
- reflection happens after submission

The V2 direction separates the session into smaller acts. A run can begin through speech or typing, then use the user's own language as material for a later movement.

## Core Loop

The canonical V2 loop is:

```text
invitation -> expression -> encounter -> movement -> closure
```

Not every session needs every phase, but the first prototype should test the complete sequence.

## Principles

### Modality

Speaking and typing are equal paths into language. A session may support speech, typing, or both. Speech is not an accessibility fallback, and typing is not a lesser substitute.

### Content

Prompts are openers, not the whole experience. Movements act on language after it appears. Closures end the encounter deliberately.

### Privacy

Wayword should not intentionally record, upload, retain, or play back voice audio. Audio should exist only as temporarily as required to produce text in the current session.

Browser speech recognition may involve temporary processing by the browser, operating system, or speech provider. The product must not claim full control over those platform-level speech-recognition paths.

The first prototype must not intentionally record audio, upload audio from Wayword code, store audio, play audio back, analyze voice, classify emotion, or infer speaker traits. Prototype text and state remain memory-only and disappear when the session ends or the page reloads.

### Evaluation

Wayword does not grade fluency, eloquence, correctness, vulnerability, confidence, productivity, or speaking performance.

### Play

Language play is worthwhile without professional, educational, therapeutic, or computational justification.

## Terms

- **Opener**: an instruction that begins expression.
- **Expression**: language produced by the user through speech, typing, or a mixture of both.
- **Encounter**: the moment the user sees, hears, selects, or otherwise faces what was expressed.
- **Movement**: an operation applied to existing expression.
- **Closure**: a deliberate end state for the run.

## Prototype Contract

The first prototype should prove one complete run without changing production behavior:

```text
opener -> expression -> transcript reveal -> movement -> second expression -> line selection -> closure
```

The prototype should be isolated under `experiments/expression-loop/` and should not write to local storage, Supabase, canonical run documents, legacy history, Mirror digests, Recent Runs, Patterns, or telemetry.

## Future Architecture Direction

If the prototype proves the loop, the production run model should evolve additively. V1 runs remain valid V1 runs. V2 runs should eventually carry an `experienceVersion` and a sequence of typed steps rather than introducing separate typing-run and voice-run models.

Historical V1 runs should not be backfilled with invented movements.

## Non-Goals

- replacing the V1 flow in the first implementation
- redesigning the main app shell
- adding server-side transcription
- saving voice recordings
- building AI-generated movements
- adding voice analysis
- changing Mirror behavior
- changing Recent Runs or Patterns
- migrating saved data
- making speech mandatory

## Unresolved Questions

- Should intermediate expressions be session-only, user-selectable, always retained, or reduced into a final artifact?
- Should transcript correction happen immediately or after the first encounter?
- Should speech-first sessions hide the transcript while receiving language?
- Which movement families create a meaningful second act without feeling like homework?
- When a V2 run becomes persistent, should Mirror reflect the final artifact, the trajectory, or both?
- How should Patterns observe modality and movement without turning them into performance metrics?

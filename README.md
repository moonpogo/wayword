# Wayword

Current V1 product contract source of truth: `docs/V1_PRODUCT_SPEC.md`.

A writing tool that shows you how you think.

Write. See what emerges.

Wayword is a minimal writing environment that lets you write, submit, and see restrained observations about visible patterns in the draft.

It is not a notes app.
It is not a document editor.

It is a space for observation.

---

## What it does

- Surfaces patterns in a submitted draft
- Highlights repetition, structure, variation, and drift
- Shows recurring signals across saved runs
- Returns simple observational feedback after each run
- Stores runs locally in the browser

The goal is not to optimize writing.

The goal is to make you aware of how you think, through what you write.

---

## Core loop

1. Receive a prompt
2. Write without interruption
3. Submit
4. See what emerges
5. Press Enter to begin again

---

## Design principles

- Minimal interface, no clutter
- Feedback over instruction
- Observation over judgment
- Behavior over theory

Everything in the app exists to support the writing loop.

---

## Features

- Submit-time Mirror reflections
- Pattern and structure highlighting
- Session feedback (score, variation, sentence shape)
- Prompt system across multiple modes
- Keyboard-driven interaction (Enter to restart)
- Lightweight recent-runs and patterns views over time

---

## Philosophy

Wayword treats writing as a system you can observe.

Not something to perfect.
Something to notice.

Patterns reveal themselves through repetition.
Clarity comes from seeing structure and recurrence.

---

## Status

Active development.

This is an evolving system. Features are added carefully to preserve the core experience.

---

## Contributor docs

For any V1-sensitive change, start here before editing code:

- `docs/V1_ARCHITECTURE_SNAPSHOT.md` — current architecture, protected seams, and known risks
- `docs/V1_CHANGE_GUARDRAILS.md` — pre-change checklist for V1-sensitive work
- `docs/QA_REGRESSION_CHECKLIST.md` — merge-time verification and manual sanity checks

---

## Tech

- HTML / CSS / JavaScript
- No frameworks
- Designed for speed and simplicity

---

## Usage

Open the app and begin writing.

Press Enter to submit a run.
Press Enter again to begin a new one.

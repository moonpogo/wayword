# OBSERVATORY SAFETY DOCTRINE

Status: Foundational v1  
Scope: Pre-instrument deepening baseline (before Trace Field, Drift Atlas, Pulse, accounts, and payments)

## 1) Purpose

This document defines the safety model for Wayword's observatory layer before system depth increases.

It exists to:
- preserve trust as capabilities expand
- prevent interpretive overreach
- keep product language and behavior inside doctrine
- give engineering and editorial teams clear safety boundaries

Core rule:
Wayword observes language behavior. It does not diagnose the user.

## 2) Scope Of Observation

Wayword may observe patterns in writing artifacts and writing activity over time, including:
- recurrence of words, phrases, images, and symbols
- shifts in language structure and abstraction
- cadence patterns (bursts, pauses, spacing over time)
- temporal occupancy (return, continuity, silence intervals)

Wayword may describe these as observable patterns in text and time.
Wayword may not convert these observations into claims about identity, mental state, or clinical condition.

## 3) Allowed Inference Model

Wayword is allowed to infer only low-claim, text-bounded, uncertainty-preserving conclusions.

Allowed inference classes:
- pattern presence: "this pattern appears repeatedly"
- pattern movement: "this language becomes more/less frequent"
- pattern relation: "these motifs often co-occur"
- temporal behavior: "activity clusters in specific periods"

Inference requirements:
- inference must be traceable to observable text/time evidence
- inference must remain probabilistic and restrained
- inference must avoid intention, motive, or diagnosis claims
- inference must preserve ambiguity rather than collapsing it

## 4) Never-Infer Boundaries

Wayword must never infer:
- psychological or psychiatric condition
- emotional state certainty (current or persistent)
- personality type or trait diagnosis
- trauma history or life-event certainty
- relational status or social role certainty
- moral character judgments
- productivity potential or performance capacity
- readiness for intervention, treatment, or coaching

If a claim requires hidden-state assumptions about the person, it is out of bounds.

## 5) Prohibited Claim Classes

The following claim classes are prohibited in product copy, UI labels, outputs, onboarding, and marketing:
- diagnosis claims: "you are depressed," "you have anxiety"
- therapeutic claims: "this heals," "this treats," "this provides therapy"
- emotional scoring: "your sadness is 72%," "mood score"
- personality typing: "you are avoidant," "you are type X"
- intimacy simulation: "I understand you better than others"
- surveillance framing: "we know what you are going through"
- productivity optimization framing: "optimize your output," "increase efficiency"
- engagement manipulation framing: compulsion loops, streak-pressure claims, FOMO prompts
- certainty language without warrant: "this proves," "this means you are"

## 6) Interpretive Ceilings

Interpretive ceiling = maximum allowed strength of product interpretation.

Wayword ceilings:
- describe what appears, not what the person is
- describe possibility, not certainty
- describe movement in language, not causes behind language
- describe temporal pattern, not psychological origin

Safe sentence frame examples:
- "This phrase appears more often in recent entries."
- "A cluster of related imagery is visible in this period."
- "Writing cadence shifts across these weeks."

Unsafe sentence frame examples:
- "You are becoming emotionally unstable."
- "This proves unresolved trauma."
- "You are avoiding intimacy."

## 7) Privacy Principles

1. User ownership first
- user writing belongs to the user
- users control access, retention, and deletion

2. Data minimization
- collect only data required for observatory functions
- avoid speculative metadata collection

3. Purpose limitation
- observatory data must not be repurposed for manipulation, targeting, or profiling

4. Separation of concerns
- analytics, billing, and observatory semantics must remain logically separated

5. Protective defaults
- conservative defaults for retention, sharing, and visibility

6. Plain-language disclosure
- users should understand what is observed and why, in restrained language

7. Verifiable deletion posture
- deletion behavior must be explicit, testable, and documented

## 8) Longitudinal Data Risks

As timelines lengthen, risk compounds. Key risks:
- false narrative lock-in from repeated weak signals
- retrospective overfitting (forcing a story onto noisy history)
- sensitivity amplification (minor patterns becoming overinterpreted)
- identity hardening through repeated labels
- re-identification risk from dense personal language traces
- breach impact growth due to deeper historical records

Required mitigations:
- time-windowed interpretation limits
- uncertainty language requirements
- strict claim ceilings over long horizons
- retention and deletion controls with clear user agency

## 9) Semantic Observatory Risks

Semantic observatory systems (Trace Field, Drift Atlas, future instruments) carry specific risks:
- metaphor literalization (treating symbolic language as factual confession)
- category collapse (flattening complex language into single labels)
- confidence laundering (visual polish implying false certainty)
- pattern essentialism (equating recurring motifs with fixed identity)
- cross-instrument overclaiming (combining weak signals into strong personal claims)

Mitigation rules:
- require evidence-linked outputs
- ban essentialist identity language
- display ambiguity where evidence is mixed
- prevent high-certainty UI treatment of low-certainty signals

## 10) Copy Examples (Allowed vs Prohibited)

Allowed:
- "This image appears across multiple entries."
- "These terms cluster in this period."
- "A shift in writing rhythm appears between these weeks."
- "This view shows language recurrence over time."

Prohibited:
- "You are anxious right now."
- "Wayword understands what you feel."
- "Your personality type is changing."
- "Your emotional health score dropped."
- "Use this to maximize daily output."
- "Don't break your streak."

Allowed style characteristics:
- restrained
- plain
- non-clinical
- non-prescriptive
- ambiguity-preserving

## 11) Engineering Implications

Safety doctrine must become system behavior, not only policy text.

Engineering requirements:
- inference-boundary layer: central guardrails for generated/descriptive claims
- claim-class linting: reject prohibited terms and phrase patterns in UI/copy pipelines
- confidence discipline: avoid numeric emotional/identity scoring structures
- evidence linkage: any interpretation-like output must map to observable artifacts
- deletion guarantees: tested end-to-end deletion across primary and derived stores
- retention controls: explicit retention boundaries and defaults
- audit logging: track major inference/output class decisions for internal review
- feature gating: no new observatory feature ships without Safety + QA signoff

Out-of-scope behavior to reject during implementation:
- hidden user profiling features
- engagement loop tuning based on semantic vulnerability
- cross-context ad-targeting style segmentation

## 12) Review Checklist For New Observatory Features

Use this checklist before approving any new observatory feature, instrument view, or copy surface.

Inference and claim safety:
- Does the feature stay within observable language/time patterns?
- Does it avoid diagnosis, therapy, emotional scoring, and personality typing?
- Does it avoid "AI understands you" framing?
- Does it preserve ambiguity and avoid certainty inflation?

Privacy and data boundaries:
- Is data collection minimal and purpose-bound?
- Are retention and deletion behaviors explicit and testable?
- Is longitudinal risk considered and mitigated?

UI/copy safety:
- Are labels and outputs restrained and plain?
- Are prohibited claim classes absent from all surfaces?
- Does the feature avoid productivity optimization and engagement manipulation framing?

Engineering readiness:
- Are inference guardrails implemented in shared logic (not ad hoc)?
- Are regression tests present for prohibited claim prevention?
- Has Safety lane signed off?
- Has QA lane validated doctrine compliance?

Release rule:
If any checklist item fails, feature is no-go until corrected.

## 13) Decision Rule For Current Roadmap

Before deepening Trace Field, Drift Atlas, Pulse, accounts, or payments:
- this doctrine is required baseline
- Safety lane reviews must be mandatory gates
- copy and UI systems must adopt prohibited-claim screening

No observatory deepening should ship without this doctrine translated into enforceable product and engineering controls.

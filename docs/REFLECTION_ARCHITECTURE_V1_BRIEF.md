# Reflection Architecture V1 Brief

## 1. Purpose
This brief defines the conceptual bridge between Prompt Architecture V1 and Wayword's existing Mirror/reflection system.

Prompt Architecture V1 introduces layered writing contexts. Mirror does not yet model those contexts. This document names the direction for future reflection work without changing runtime behavior.

## 2. Reflection Principle
Mirror should reflect movement in language, not identity, personality, mood, mental health, or hidden truth.

Reflection should stay with what the text visibly does. It should not infer what the writer is, wants, needs, fears, or secretly means.

## 3. Existing Mirror Baseline
Current Mirror doctrine is a strong foundation.

Mirror already:
- avoids diagnosis
- stays restrained
- observes visible language features
- avoids advice and coaching
- suppresses weak or low-signal output
- remains deterministic and local-first

This baseline should be preserved. Future layer-aware reflection should extend restraint, not loosen it.

## 4. Gap Created By Prompt Architecture V1
Prompt Architecture V1 defines three writing contexts:

- Entry: getting language started
- Torsion: adding relation, pressure, contrast, address, or refusal
- Resonance: holding paradox, silence, contradiction, translation, absence, or unresolved return

Current Mirror doctrine does not yet model:
- prompt layer context
- language acts
- entry movement
- torsion or relational pressure
- resonance or unresolvedness
- residue as an analytic construct

This gap is conceptual, not a runtime defect.

## 5. Layer-Aware Reflection Direction

### Entry
Mirror should privilege signs of initiation:
- first movement
- naming
- description
- local attention
- concrete footholds
- continuation after hesitation

Entry reflection should avoid overinterpreting short, plain, or simple writing. In Entry, a small beginning may be the whole signal.

### Torsion
Mirror should privilege signs of relation and pressure:
- contrast
- address
- refusal
- reply
- before/after structures
- tension between descriptions
- shifts in stance

Torsion reflection should not call pressure emotional truth, conflict diagnosis, or proof of hidden motive.

### Resonance
Mirror should privilege signs of sustained ambiguity:
- paradox
- contradiction
- silence
- absence
- translation
- unresolved return
- symbolic pressure

Resonance reflection should avoid fake profundity, mysticism, and psychological interpretation. It may notice unresolvedness without explaining it away.

## 6. Reflection Anti-Patterns
Wayword reflection must avoid:

- personality inference
- therapy interpretation
- mood diagnosis
- "you are the kind of person who..."
- hidden-truth language
- self-help advice
- moral judgment
- overpraising
- fake-literary criticism
- making short writing sound more meaningful than it is

The mirror should not flatter the draft into importance or convert a linguistic pattern into a claim about the writer.

## 7. Future Analytic Vocabulary
The following are candidate terms for future reflection architecture. They are not implemented categories.

- initiation
- foothold
- turn
- pressure
- countervoice
- residue
- return
- silence
- compression
- drift
- recurrence
- fracture
- translation
- withheld relation

These terms should remain provisional until evaluated against real writing and current Mirror constraints.

## 8. Relationship To Existing Mirror Categories
Current Mirror categories may support future movement-oriented reflection, but only conceptually at this stage.

- repetition -> recurrence / return
- cadence -> movement / compression / release
- abstraction_concrete -> foothold / drift
- hesitation_qualification -> uncertainty / withheld stance

This mapping is conceptual only. It does not change category names, thresholds, ranking, selection, rendering, or saved data.

## 9. Implementation Boundaries
This brief implies no runtime change.

Future implementation must be incremental. Deterministic and local-first behavior remain preferred.

Any LLM-assisted reflection would require separate privacy review, doctrine review, and product review before implementation.

Reflection should never become:
- therapist
- coach
- judge
- personality profiler

Mirror remains an observational instrument.

## 10. Next Steps
Recommended next moves:

1. Keep current Mirror runtime unchanged for now.
2. Design a Mirror V1.1 or V2 evaluation corpus around movement, torsion, and resonance.
3. Update Mirror doctrine later only after this brief is reviewed.
4. Do not implement layer-aware reflection until prompt layers are stable.

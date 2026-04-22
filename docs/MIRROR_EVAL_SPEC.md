# Mirror Eval Spec

## Purpose
This document defines the evaluation standard for Wayword's deterministic mirror v1 so output quality is checked consistently across revisions rather than judged by intuition alone.

## Scope
This spec applies to current mirror v1 behavior and evaluation for:
- repetition
- abstraction vs concrete detail
- cadence
- hesitation / qualification

Experimental, provisional, or future categories are out of scope unless explicitly added to this document.

## Evaluation goals
- reward specificity
- punish fake depth
- punish unsupported claims
- punish weak-signal overreach
- preserve restraint
- prefer silence over fabricated insight
- ensure outputs are grounded in text evidence
- ensure supporting reflections add distinct value

## Global pass criteria
A mirror output passes only when all of the following hold:
- primary reflection is credible
- reflection matches the strongest meaningful signal in the text
- supporting reflections are distinct and justified
- no duplication between primary and supporting reflections
- no personality claims
- no advice
- no therapy language
- no inflated interpretation
- language is observational and bounded

The output contract is:
- what the mirror should say: bounded observations supported by clear text evidence, prioritizing the strongest meaningful signal
- what the mirror may say: carefully qualified secondary observations when evidence is sufficient and distinct
- what the mirror must not say: unsupported claims, personality judgments, advice, therapy framing, or fabricated significance

## Global failure modes
- generic fake-deep wording that could apply to almost any draft
- unsupported certainty or overconfident phrasing
- choosing a weak primary signal over a stronger available one
- repeating the same idea in both primary and supporting reflections
- forcing output when signal is thin
- saying something technically true but too vague to be useful
- category firing without meaningful textual support
- evidence snippets that do not actually match the reflection claim

## Corpus design
The evaluation corpus should include:
- strong repetition cases
- abstraction-heavy cases
- concrete-heavy cases
- cadence-heavy cases
- hesitation-heavy cases
- mixed cases
- edge cases
- very short drafts
- low-signal drafts
- weird/disruptive drafts
- cases where the correct behavior is minimal output

## Per-case structure
Each test case must include:
- case ID
- title
- input text
- expected primary category
- allowed supporting categories
- disallowed categories
- required constraints
- unacceptable outputs
- notes

## Category expectations

### Repetition
Meaningful repetition is recurrence of a salient phrase, framing move, or claim pattern that indicates emphasis, fixation, or thematic return. Repetition should be evaluated for semantic weight, not raw token duplication.

Meaningful signals include:
- repeated substantive terms tied to the same concern
- repeated contrast structures used to negotiate the same tension
- repeated claim forms that narrow toward one point

Weak signals that should not be inflated:
- filler words and discourse tics
- accidental lexical reuse in short drafts
- repetitive but content-empty phrasing

Trivial or dull repetition must not generate inflated reflections.

### Abstraction vs concrete detail
Abstract language includes generalized concepts, labels, and framing detached from specific sensory, temporal, or situational anchors. Concrete language includes specific actors, actions, objects, times, places, and observable particulars.

Acceptable mirror statements:
- identifies a clear lean toward abstract framing when concrete anchors are sparse
- identifies a clear lean toward concrete detail when specifics dominate
- notes balance only when both modes are materially present

Unacceptable statements:
- claiming "balance" from weak evidence
- interpreting abstraction as sophistication by default
- interpreting concreteness as limitation by default

### Cadence
Cadence observations are allowed only when sentence-length or rhythmic structure is meaningfully patterned.

Allowed cadence observations require:
- clear variation or consistency that affects reading flow
- pattern persistence across multiple sentences or clauses
- language that remains descriptive rather than interpretive

Not allowed:
- noise-level comments based on one incidental long or short sentence
- overreading punctuation quirks without broader structure
- poetic claims unsupported by measurable rhythm pattern

### Hesitation / qualification
Meaningful hesitation/qualification includes softening, revision, hedging, and self-correction patterns that materially shape claims.

Meaningful examples include:
- recurring hedges that weaken commitment
- explicit revisions that retract or narrow prior statements
- layered qualifiers that repeatedly defer conclusion

Weak cases that should not be overstated:
- one-off hedge words in otherwise direct prose
- polite wording conventions without revision behavior
- isolated uncertainty markers with no pattern support

## Low-signal behavior
When a draft is too short, too flat, too noisy, or too weakly patterned, expected behavior is:
- fewer reflections
- weaker claims
- possibly no meaningful mirror statement beyond minimal fallback
- never manufacture significance

In low-signal cases, restraint is correct behavior.

## Supporting reflection rules
Supporting reflections must:
- add something distinct from the primary reflection
- clear their own credibility bar with direct evidence
- not exist just because a category barely triggered
- not crowd the mirror when evidence is limited

If distinct, credible support is unavailable, omit support.

## Evidence rules
Evidence must:
- support the statement directly
- be legible
- not overload the UI
- not imply more certainty than exists

Evidence should be sufficient to justify the claim while remaining narrow and interpretable.

## Evaluation workflow
For each mirror change:
1. run corpus
2. inspect outputs case by case
3. compare against expected primary and supporting allowances
4. log pass / partial / fail per case
5. note regressions introduced by threshold, template, or ranking changes

## Output verdicts
- pass
- partial
- fail

Definitions:
- pass = output is credible and within spec
- partial = somewhat acceptable but misses an important expectation
- fail = breaks spec in a meaningful way

## Maintenance rules
This document should be updated only when:
- product rules change
- a category is added or removed
- corpus expectations are sharpened after review
- user testing reveals a mistaken assumption

The evaluation bar must not be lowered merely to make more cases pass.

# TRACE FIELD SAFETY QA CHECKLIST

Status: Mandatory pass/fail gate for Trace Field v0 prototype review  
Scope: Safety, doctrine, evidence, and regression acceptance criteria.

## 1) How To Use This Checklist

- Each item is PASS or FAIL.
- Any FAIL in a mandatory item is overall NO-GO.
- Safety lane and QA lane must both sign off.

## 2) Prohibited Interpretation Checks (PASS/FAIL)

PASS if all are true:
- No diagnosis, therapy, or treatment framing.
- No emotional scoring.
- No personality typing.
- No hidden-state claims about motives, identity, or mental condition.
- No "AI understands you" language.
- No productivity optimization or engagement manipulation framing.

FAIL examples:
- "your writing suggests loneliness"
- "themes of depression emerge"
- "you avoid intimacy"

PASS examples:
- "certain phrases recur across multiple runs"
- "specific image language appears repeatedly"

## 3) Evidence Traceability Checks (PASS/FAIL)

PASS if all are true:
- Every surfaced observation maps to source text.
- Source excerpts/offsets are inspectable.
- Counts and dispersion are reproducible on rerun.
- Primitive type and thresholds used are recorded.
- No surfaced item lacks supporting trace.

FAIL if any are true:
- Observation shown without source mapping.
- Count cannot be reproduced.
- Transformation steps are opaque.

## 4) Ambiguity Preservation Checks (PASS/FAIL)

PASS if all are true:
- Language describes appearance/recurrence, not user identity/state.
- Wording remains probabilistic or descriptive where needed.
- No claim collapses ambiguity into certainty.

FAIL if any are true:
- Statements imply definitive personal truth from weak signals.
- Output language asserts causes for language patterns.

## 5) Visual Overclaim Checks (PASS/FAIL)

PASS if all are true:
- Visual direction avoids dashboard aesthetics.
- Signal strength is not visually overstated.
- Precision shown matches actual evidence granularity.
- Highlighting is informative, not manipulative.

Prevent the following:
- certainty theater
- over-precision
- manipulative highlighting
- KPI/performance dashboard cues

FAIL if any are present.

## 6) Copy Restraint Checks (PASS/FAIL)

PASS if all are true:
- Language matches approved template bank.
- Verbs stay within approved recurrence verbs.
- Tone is restrained, plain, non-mystical.
- No faux-profound, clinical, or optimization phrasing.

FAIL if any are true:
- prohibited verbs or framing appears
- identity claims appear
- therapeutic language appears

## 7) Regression Review Requirements

Required artifacts:
- screenshot set for reviewed prototype states
- fixture test run output
- deterministic rerun diff (no unexpected drift)
- doctrine verification notes against safety doctrine sections

Required checks:
- fixture stability across reruns
- threshold edge-case behavior matches spec
- suppression rules behave as expected

Any missing artifact is FAIL.

## 8) Go/No-Go Review Matrix

Automatic NO-GO if any condition is true:
- any hidden-state implication exists
- evidence cannot be surfaced for any claim
- uncertainty disappears into certainty language
- observatory framing drifts into therapy or productivity framing
- prohibited interpretation class appears in UI/copy/output
- deterministic reproducibility fails

GO only if all mandatory sections pass.

## 9) Review Signoff Block

- Safety Reviewer: ____________________  Date: __________
- QA Reviewer: ________________________  Date: __________
- Founder Integrator: __________________  Date: __________
- Final Decision: GO / NO-GO

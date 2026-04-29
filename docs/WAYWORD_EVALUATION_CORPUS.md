WAYWORD EVALUATION CORPUS SPEC
Version: v1
Purpose: To evaluate whether Wayword’s deterministic mirror output is sharp, grounded, stable, and useful across a controlled set of writing samples.

---

1. OBJECTIVE

This corpus exists to pressure-test the core Wayword loop.

It is not for checking whether the app "works" in a shallow sense.
It is for checking whether the reflections are:

- observably true
- specific enough to feel earned
- restrained enough to avoid fake depth
- stable across runs
- resistant to obvious edge-case failures

The corpus should help answer:

- When does the mirror feel genuinely perceptive?
- When does it become vague, decorative, or misleading?
- Which categories fire too often?
- Which categories fail to fire when they should?
- Which inputs should produce no strong reflection at all?

---

2. EVALUATION PRINCIPLES

All reflection evaluation should follow these rules:

A. Observational only
The mirror should describe textual behavior, not infer motives, psychology, identity, intention, or emotional diagnosis.

B. No fake profundity
A line may be elegant, but it must still be accountable to the text.

C. Headline must earn its weight
The primary reflection should feel like the strongest available observation in the draft, not just the most lyrical one.

D. Weak signal should stay quiet
If a draft is too short, too flat, too mixed, or too noisy to support a meaningful observation, the mirror should say less rather than pretend.

E. Edge cases matter
A product like this dies by false confidence on weird or thin inputs.

---

3. WHAT IS BEING EVALUATED

Current core reflection categories:

- repetition
- abstraction_concrete
- cadence
- hesitation_qualification

Current adjacent behaviors to evaluate:

- primary reflection ranking
- supporting reflection selection
- evidence relevance
- short-input handling
- nudge behavior
- post-run UI stability
- recent/history persistence consistency

This corpus focuses primarily on mirror output quality, but should also be used to catch regressions in presentation and persistence.

---

4. REQUIRED OUTPUT FORMAT FOR EACH TEST CASE

Each corpus entry should contain:

- Case ID
- Case Name
- Target Category or Categories
- Input Text
- Intended Signal
- Expected Acceptable Reflection Types
- Forbidden Reflection Types
- Nudge Expectation
- Notes

Template:

Case ID:
Case Name:
Target Category:
Input Text:
Intended Signal:
Expected Acceptable Reflection Types:
Forbidden Reflection Types:
Nudge Expectation:
Notes:

---

5. ACCEPTANCE CRITERIA

A case passes when:

- the primary reflection matches one of the expected acceptable reflection types
- no forbidden reflection type appears as primary
- no obviously false supporting reflection appears
- the output tone remains observational and restrained
- the evidence, if shown, actually supports the claim
- the output does not overstate weak evidence

A case partially passes when:

- the primary reflection is plausible but weaker than expected
- the correct category appears only as supporting
- wording is technically defensible but not the strongest available reading

A case fails when:

- the primary reflection is clearly wrong
- a forbidden reflection appears
- the output feels generic, decorative, or unearned
- the mirror confidently states a pattern that is not meaningfully present
- the system fails to suppress weak/noisy inputs

---

6. FAILURE TAGS

Use these tags when reviewing outputs:

- FALSE_POSITIVE
- MISSED_SIGNAL
- TOO_VAGUE
- TOO_STRONG
- FAKE_DEEP
- WRONG_PRIORITY
- BAD_EDGE_CASE
- EVIDENCE_MISMATCH
- OVERFIRES_ON_SHORT_INPUT
- UNDERFIRES_ON_CLEAR_INPUT
- NUDGE_MISMATCH
- UI_REGRESSION
- PERSISTENCE_REGRESSION

These tags should be attached to each failing case so patterns can be tracked over time.

---

7. CORPUS BUCKETS

The corpus should be divided into the following buckets:

A. Clean single-signal cases
Used to verify that the engine clearly detects the intended category.

B. Mixed-signal cases
Used to verify ranking and prioritization.

C. Weak-signal cases
Used to verify restraint.

D. Edge-case inputs
Used to verify suppression, stability, and non-embarrassing behavior.

E. Adversarial / fake-poetic cases
Used to verify that the system does not mistake empty stylization for depth.

F. Realistic everyday writing cases
Used to verify that the product still works on ordinary human writing, not just crafted test samples.

---

8. INITIAL CORPUS CASES

====================
BUCKET A: CLEAN SINGLE-SIGNAL CASES
====================

Case ID: REP-01
Case Name: Single dominant repeated word
Target Category: repetition
Input Text:
I kept thinking about the window. The window in the kitchen. The window above the sink. Even later, walking home, it was still the window I saw.
Intended Signal:
A clearly repeated lexical return to one concrete word.
Expected Acceptable Reflection Types:
- repetition as primary
- wording centered on a single recurring word
Forbidden Reflection Types:
- cadence as primary
- abstraction/concrete balance as primary
- hesitation as primary
Nudge Expectation:
No special nudge required.
Notes:
This should be easy. If repetition does not win here, ranking is broken.

Case ID: REP-02
Case Name: Repetition across dispersed phrasing
Target Category: repetition
Input Text:
Every version of the day seemed to bend back toward the same question. At breakfast the question was there. On the train the question was there. By night, it still felt like the question had been waiting for me.
Intended Signal:
Repeated return to one noun, but less mechanically than REP-01.
Expected Acceptable Reflection Types:
- repetition primary
Forbidden Reflection Types:
- hesitation primary
Nudge Expectation:
None
Notes:
Useful for checking whether repetition detection is too literal or too narrow.

Case ID: ABS-01
Case Name: Strongly abstract language
Target Category: abstraction_concrete
Input Text:
Meaning kept dissolving into interpretation. Everything felt mediated by distance, structure, and idea rather than event. I could describe the shape of the thought, but not the room it happened in.
Intended Signal:
Heavy abstract/conceptual lean.
Expected Acceptable Reflection Types:
- ideas dominate over concrete detail
- later passages lean conceptual
Forbidden Reflection Types:
- concrete detail outweighs abstraction
- cadence primary
Nudge Expectation:
None
Notes:
Should clearly identify conceptual language without sounding diagnostic.

Case ID: CON-01
Case Name: Strongly concrete imagery
Target Category: abstraction_concrete
Input Text:
The spoon hit the side of the mug. Rain clung to the window screen. My shoes left dark marks across the tile. The whole room smelled like wet cardboard and coffee.
Intended Signal:
Strong concrete/image-based language.
Expected Acceptable Reflection Types:
- concrete detail outweighs abstraction
- image-heavy or scene-based reading
Forbidden Reflection Types:
- ideas dominate over concrete detail
Nudge Expectation:
None
Notes:
Tests whether concrete lexicon is actually being recognized.

Case ID: CAD-01
Case Name: Ending tightens
Target Category: cadence
Input Text:
I kept trying to explain it in full sentences, adding context, qualifications, and side routes as if precision might make the memory easier to hold. It didn’t. By the end there was only this: it happened. I stayed.
Intended Signal:
Noticeable shortening and tightening near the end.
Expected Acceptable Reflection Types:
- ending tightens noticeably
Forbidden Reflection Types:
- repetition primary
- hesitation primary
Nudge Expectation:
None
Notes:
This is the canonical cadence success case.

Case ID: CAD-02
Case Name: Lines lengthen near the end
Target Category: cadence
Input Text:
I left. I came back. I waited. Then I began explaining, slowly at first and then with more detail, until the explanation turned into something larger, heavier, and harder to stop once it had gathered its own shape.
Intended Signal:
Clear movement from short to longer sentence pattern.
Expected Acceptable Reflection Types:
- lines lengthen near the end
Forbidden Reflection Types:
- ending tightens
Nudge Expectation:
None
Notes:
Used to distinguish opposite cadence patterns.

Case ID: HES-01
Case Name: Immediate softening after assertion
Target Category: hesitation_qualification
Input Text:
It was the right decision, I think. I knew what I was doing, or at least I mostly did. The plan was clear, more or less, until it wasn’t.
Intended Signal:
Frequent qualification immediately after statements.
Expected Acceptable Reflection Types:
- statements are often qualified just after they’re made
- assertions are often followed by softening
Forbidden Reflection Types:
- repetition primary
- cadence primary
Nudge Expectation:
None
Notes:
One of the cleanest hesitation cases.

Case ID: HES-02
Case Name: Revised and softened statements
Target Category: hesitation_qualification
Input Text:
I wanted to leave. That’s not exactly right. I wanted the version of myself who stayed to disappear, which is maybe different.
Intended Signal:
Self-revision and softening.
Expected Acceptable Reflection Types:
- statements are often revised or softened
Forbidden Reflection Types:
- abstraction/concrete primary unless very strongly supported
Nudge Expectation:
None
Notes:
Good for checking revision language.

====================
BUCKET B: MIXED-SIGNAL CASES
====================

Case ID: MIX-01
Case Name: Repetition plus hesitation
Target Category: repetition + hesitation_qualification
Input Text:
I kept saying fine. Fine, probably. Fine, in a way. The word kept returning even as it kept changing shape.
Intended Signal:
Both repetition and qualification are present.
Expected Acceptable Reflection Types:
- repetition primary, hesitation supporting
OR
- hesitation primary, repetition supporting
depending on actual scoring thresholds
Forbidden Reflection Types:
- cadence primary
Nudge Expectation:
None
Notes:
Useful ranking case. Need to decide what should win under current weights.

Case ID: MIX-02
Case Name: Concrete opening, abstract back half
Target Category: abstraction_concrete
Input Text:
The table was sticky. A fork leaned off the plate. Someone had left a glass ring in the wood. But after that, the room stopped feeling like a room and became a theory about leaving, distance, and the way memory edits what it cannot hold.
Intended Signal:
Shift from concrete scene into conceptual language.
Expected Acceptable Reflection Types:
- back half leans more conceptual than scene-based
Forbidden Reflection Types:
- concrete outweighs abstraction as primary
Nudge Expectation:
None
Notes:
Important because this is richer than a blunt overall ratio.

Case ID: MIX-03
Case Name: Cadence plus hesitation
Target Category: cadence + hesitation_qualification
Input Text:
I knew it was over, I think, though maybe I only knew that afterward when the whole scene began arranging itself into a story I could survive. At the time it was simpler. Quieter. Almost nothing.
Intended Signal:
Both qualification and end-tightening are present.
Expected Acceptable Reflection Types:
- cadence primary with hesitation supporting
OR
- hesitation primary with cadence supporting
Forbidden Reflection Types:
- repetition primary
Nudge Expectation:
None
Notes:
Another ranking stress test.

====================
BUCKET C: WEAK-SIGNAL CASES
====================

Case ID: WEAK-01
Case Name: Ordinary neutral prose
Target Category: none dominant
Input Text:
I woke up late, made coffee, answered a few emails, and took the bus downtown. The meeting went fine. After that I came home and cleaned the kitchen.
Intended Signal:
No especially strong stylistic feature.
Expected Acceptable Reflection Types:
- restrained generic-but-true observation
- possibly no strong reflection
Forbidden Reflection Types:
- any highly dramatic or uncanny claim
- fake-deep cadence or abstraction claims
Nudge Expectation:
None
Notes:
The system must not hallucinate significance here.

Case ID: WEAK-02
Case Name: Short but normal
Target Category: none dominant
Input Text:
Today felt off, but I got through it.
Intended Signal:
Too little signal for a strong mirror.
Expected Acceptable Reflection Types:
- subdued output
- possibly fallback
Forbidden Reflection Types:
- repetition
- cadence
- abstraction/concrete claims
- elaborate nudge
Nudge Expectation:
Short-input-sensitive behavior only
Notes:
Critical anti-bullshit case.

Case ID: WEAK-03
Case Name: One-word entry
Target Category: none
Input Text:
Tired.
Intended Signal:
No meaningful category should fire.
Expected Acceptable Reflection Types:
- minimal fallback only
Forbidden Reflection Types:
- any stylometric claim
- any line implying structure over time
- any nudge that sounds fake-serious
Nudge Expectation:
Special suppression behavior
Notes:
This absolutely must not produce fake wisdom.

Case ID: WEAK-04
Case Name: Two-word entry
Target Category: none
Input Text:
Still here.
Intended Signal:
Minimal signal only.
Expected Acceptable Reflection Types:
- minimal fallback only
Forbidden Reflection Types:
- cadence
- repetition
- abstraction/concrete
Nudge Expectation:
Suppressed or extremely restrained
Notes:
Another must-pass edge case.

====================
BUCKET D: EDGE-CASE INPUTS
====================

Case ID: EDGE-01
Case Name: List-like input
Target Category: none or weak concrete
Input Text:
Milk
Bananas
Notebook
Tape
Dish soap
Socks
Intended Signal:
This is a list, not developed prose.
Expected Acceptable Reflection Types:
- subdued handling
- maybe concrete-heavy only if phrased carefully
Forbidden Reflection Types:
- cadence
- hesitation
- anything implying narrative structure
Nudge Expectation:
None
Notes:
Tests whether raw nouns trick the system into saying too much.

Case ID: EDGE-02
Case Name: Dialogue fragment
Target Category: weak or mixed
Input Text:
“Are you coming back?”
“I don’t know.”
“That’s not an answer.”
“I know.”
Intended Signal:
Sparse dramatic exchange, but not much lexical depth.
Expected Acceptable Reflection Types:
- restrained output
Forbidden Reflection Types:
- abstraction-heavy claim
- false cadence confidence
Nudge Expectation:
None
Notes:
Useful because many users may paste fragments.

Case ID: EDGE-03
Case Name: Long single sentence
Target Category: possibly hesitation or abstraction
Input Text:
I kept trying to explain why I stayed in terms that sounded principled and coherent and maybe even generous, although really what I had was a blur of motives, half-reasons, and delays that I only later arranged into something like an account.
Intended Signal:
Hesitation and abstraction are present, but sentence segmentation is limited.
Expected Acceptable Reflection Types:
- hesitation possible
- abstraction possible
Forbidden Reflection Types:
- cadence claims dependent on multi-sentence structure
Nudge Expectation:
None
Notes:
Tests sentence-count gating.

Case ID: EDGE-04
Case Name: Repeated filler / low-value repetition
Target Category: none or suppressed repetition
Input Text:
Like, I was just, like, going to the store and, like, I don’t know, like, it was whatever.
Intended Signal:
Repetition exists, but it is dull filler and should not necessarily generate a strong lexical reflection.
Expected Acceptable Reflection Types:
- hesitation/softening possible
- repetition should be suppressed or deprioritized if filler-filter works
Forbidden Reflection Types:
- triumphant repetition line about a boring filler word
Nudge Expectation:
None
Notes:
This specifically checks dull-word filtering.

====================
BUCKET E: ADVERSARIAL / FAKE-POETIC CASES
====================

Case ID: ADV-01
Case Name: Empty pseudo-profundity
Target Category: none or weak abstraction
Input Text:
The shape of the silence became a mirror for the invisible architecture of everything I could not name.
Intended Signal:
It sounds profound but contains almost no accountable structure beyond abstraction.
Expected Acceptable Reflection Types:
- very restrained abstraction reading at most
Forbidden Reflection Types:
- strong confident headline acting like this is rich evidence
Nudge Expectation:
None
Notes:
The system must not reward decorative vagueness too eagerly.

Case ID: ADV-02
Case Name: Generated-sounding mystical prose
Target Category: none dominant
Input Text:
I wandered through the threshold of becoming, where memory folded into a sacred geometry of return and forgetting.
Intended Signal:
Another bullshit detector case.
Expected Acceptable Reflection Types:
- restrained abstraction at most
Forbidden Reflection Types:
- fake-deep celebration
- any line that sounds impressed with the text
Nudge Expectation:
None
Notes:
If Wayword flatters this, it starts to look gullible.

====================
BUCKET F: REALISTIC EVERYDAY WRITING
====================

Case ID: REAL-01
Case Name: Everyday journal entry
Target Category: mild mixed signal
Input Text:
I didn’t want to go, but once I got there it was fine. I talked more than I expected. On the walk back I kept replaying one part of the conversation and wondering whether I had said too much.
Intended Signal:
Natural writing with mild hesitation and a repeated return to one concern.
Expected Acceptable Reflection Types:
- hesitation likely
- repetition possible as supporting
Forbidden Reflection Types:
- overly literary cadence claim unless clearly justified
Nudge Expectation:
Normal behavior
Notes:
This is closer to actual product usage than the crafted cases.

Case ID: REAL-02
Case Name: Practical reflective note
Target Category: mild abstraction/concrete mix
Input Text:
I need a better system for mornings. The problem isn’t just discipline. It’s that every small decision seems to cost more than it should the moment I wake up, before coffee, before light, before I’ve fully entered the day.
Intended Signal:
Blend of practical reasoning and concrete anchors.
Expected Acceptable Reflection Types:
- balanced abstraction/concrete
- maybe back-half shift if supported
Forbidden Reflection Types:
- false repetition
Nudge Expectation:
Normal
Notes:
A realistic test of mixed ordinary writing.

---

9. NUDGE EVALUATION RULES

Nudges should be evaluated separately from mirror reflections.

The nudge should:

- feel lightweight, not therapeutic
- match the actual text length and richness
- avoid sounding ceremonial when the input is tiny
- avoid generic self-help tone
- avoid pretending the draft reveals more than it does

For each corpus case, log:

- Did a nudge appear?
- Was it proportionate?
- Was it tonally aligned?
- Did it become embarrassing on short or thin input?

Special scrutiny cases:
- WEAK-02
- WEAK-03
- WEAK-04
- EDGE-01
- ADV-01
- ADV-02

---

10. SCORING RUBRIC

Each case can be scored on a 0–2 scale per dimension:

A. Truthfulness
0 = wrong
1 = plausible but weak
2 = clearly grounded

B. Specificity
0 = vague
1 = somewhat specific
2 = sharp and text-bound

C. Restraint
0 = overstated
1 = borderline
2 = properly restrained

D. Priority
0 = wrong category won
1 = acceptable but not ideal
2 = best category won

E. Edge-case discipline
0 = embarrassing
1 = somewhat rough
2 = handled cleanly

Suggested total per case: /10

This lets you compare builds over time.

---

11. REVIEW PROCEDURE

For each major mirror change:

1. Run the full corpus
2. Record primary reflection
3. Record supporting reflections
4. Record evidence summary
5. Record nudge behavior
6. Mark pass / partial / fail
7. Attach failure tags
8. Note whether the regression is:
   - copy-level
   - threshold-level
   - ranking-level
   - extraction-level
   - UI-level

Do not rely on one or two cherry-picked examples.

---

12. MINIMUM SUCCESS BAR FOR V1

Wayword v1 should not be considered stable until:

- all short-input cases avoid fake-deep output
- clean single-signal cases reliably detect the intended category
- mixed-signal cases produce defensible ranking
- adversarial fake-poetic cases do not get over-rewarded
- ordinary realistic writing produces useful but restrained reflections
- no major UI or persistence regressions occur during corpus runs

---

13. WHAT TO ADD NEXT

After the initial corpus is in place, expand it with:

- very long drafts
- all-caps / fragmented writing
- intentional surrealism
- highly narrative prose
- persuasive / argumentative prose
- poetry-like line breaks
- screenwriting / dialogue-heavy text
- rant / stream-of-consciousness entries
- drafts from actual trusted beta users, anonymized

These should only be added after the first corpus is passing cleanly.

---

14. FINAL RULE

If a case creates disagreement, prefer restraint.

A mirror that occasionally says slightly less than possible is survivable.
A mirror that confidently says false or decorative things is poison.
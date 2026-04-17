# Mirror V1 — Internal evaluation corpus

**Purpose:** Regression and acceptance checks so we can see whether session output **matches** `MIRROR_V1_DOCTRINE.md` and the intended Mirror V1 product contract.

**How to use:** Run the Mirror V1 pipeline on each **input text** (session body only). Compare results to **expected categories**, **expected output shape**, and **acceptable / unacceptable** language. Mismatches are either engine drift or corpus expectations that need tightening—record which.

**Note:** This corpus states **product-level** expectations (what should be reflected, what should be suppressed, how the stack should behave). It does not name internal constants.

---

## Case 1 — Clear named recurrence

**Input text**

> The team debated whether the algorithm should run before merge or after. One engineer argued the algorithm was already stable; another wanted the algorithm profiled again. In the end they agreed to ship the algorithm unchanged and revisit tuning next week.

**Expected category/categories**

- `repetition` (primary signal for this case)

**Expected output shape**

- **Main or supporting** that includes a repetition card is acceptable; **supporting-only** is acceptable if nothing clears the dominant bar.
- At least **one card** is expected if the material floor is met and recurrence is strong enough; otherwise **no cards** is acceptable only if the engine legitimately treats the signal as below threshold.

**Acceptable reflection direction**

- Names a **specific recurring lemma** the draft returns to often enough to matter, with **counts or snippets** in evidence—not a vague “you repeat yourself.”

**Unacceptable outputs**

- A repetition card built on **filler or ultra-generic** lemmas presented as insight.
- **Diagnosis** (“you’re stuck on this word”) or **advice** (“vary your vocabulary”).
- **Two** repetition cards or duplicate headline text.

**Rationale**

- Exercises the doctrine’s **repetition** category and **named recurrence** rule without judging the writer.

---

## Case 2 — Idea-leaning vocabulary dominates

**Input text**

> Freedom and justice are not abstract slogans here; they structure every argument about truth, meaning, and hope. The essay keeps returning to power, fear, and identity as if no concrete scene could carry the same weight. Tomorrow and yesterday blur because the writer cares more about memory, thought, and becoming than about any single image.

**Expected category/categories**

- `abstraction_concrete` with an **ideas-first / idea-dominant** line (density), not a shift headline unless the draft also clearly shifts by half.

**Expected output shape**

- **Main + supporting** or **supporting-only**; must not contradict suppression (no filler stack).

**Acceptable reflection direction**

- States that **idea-leaning language outweighs** image-leaning language for this draft, with **ratio or hit counts** in evidence.

**Unacceptable outputs**

- Claims about **writer motivation**, **intelligence**, or **skill**.
- **Theme interpretation** beyond vocabulary balance (“what you’re really saying is…”).
- A **cadence** or **hesitation** card invented without support in the text.

**Rationale**

- Locks **abstraction dominance** to observable lexicon balance, per doctrine.

---

## Case 3 — Image-leaning vocabulary dominates

**Input text**

> The table wobbled on the stone floor near the wall. Rain hit the window above the door while she set the knife beside a cup on the metal tray. Outside, the road curved past a tree under a gray sky; the car’s glass reflected water on the paper map spread on the chair.

**Expected category/categories**

- `abstraction_concrete` with a **concrete-outweighs-abstraction** line.

**Expected output shape**

- **Main or supporting** with that abstraction card is the primary expectation; **no cards** only if the run is below material thresholds.

**Acceptable reflection direction**

- Observation that **concrete, image-ready nouns** carry more of the draft than idea-words, backed by evidence.

**Unacceptable outputs**

- **Praise** (“vivid writer”) or **critique** (“too literal”) framed as judgment.
- **Invented objects** not present in the string.
- **Personality** (“you think in objects”).

**Rationale**

- Validates the **concrete dominance** branch and language constraints.

---

## Case 4 — Late turn toward conceptual language

**Input text**

> She closed the door and sat at the table. Rain streaked the window. The knife lay beside the cup on the stone floor. Later the draft changes: freedom, justice, truth, meaning, hope, and fear crowd the same paragraph, and power, identity, memory, and thought replace the room until tomorrow and yesterday matter more than the chair.

**Expected category/categories**

- `abstraction_concrete` with a **second-half / back-half conceptual** direction (shift), not merely “ideas dominate” if the engine distinguishes shift from density.

**Expected output shape**

- At least **one** abstraction card expected when material is sufficient; **supporting-only** acceptable if dominance bar not met.

**Acceptable reflection direction**

- Describes **movement** from more scene-bound wording toward **more idea-leaning** wording across the draft, with evidence tied to **position** (e.g., half-session or comparable).

**Unacceptable outputs**

- **Narrative projection** (“she escapes into philosophy”) without textual proof.
- **Balanced / both-frequent** headline as the **only** abstraction output if a clear **directional shift** is also eligible at similar strength (doctrine: directional should not lose to balanced when similarly strong).

**Rationale**

- Targets **abstraction shift** (conceptual later) as a directional product behavior.

---

## Case 5 — Late turn toward concrete detail

**Input text**

> The argument stayed abstract for pages: freedom, justice, truth, meaning, hope, fear, power, identity, memory, thought, becoming, and change without a chair or a door in sight. Then the draft lands: table, chair, door, window, floor, wall, hand, stone, water, metal, glass, paper, knife, cup, road, car, tree, sky, rain in one long sentence that finally sticks to the room.

**Expected category/categories**

- `abstraction_concrete` with a **later / concrete-heavy** directional line.

**Expected output shape**

- **Main or supporting** with that card; **no cards** only if thresholds not met.

**Acceptable reflection direction**

- Describes **concrete detail carrying more of the later portion** than earlier, with evidence.

**Unacceptable outputs**

- **Psychological** explanation (“you finally calmed down”).
- **Balanced** line as sole abstraction result if **directional concrete-later** is clearly supported at comparable strength.

**Rationale**

- Exercises **concrete shift** as the mirror opposite of Case 4.

---

## Case 6 — Ending tightens (shorter sentences late)

**Input text**

> This paragraph opens with a long winding sentence that accumulates detail after detail about the committee meeting and the budget projections and the arguments that stretched late into the evening without resolving anything important. Another long sentence follows, heaping clauses about stakeholders, emails, and revised timelines that nobody trusted. A third long sentence continues the pattern, describing corridors, elevators, and coffee cups left on tables near forgotten printouts. Then things change. Short lines now. Staccato beats. The door shuts. Silence.

**Expected category/categories**

- `cadence` with an **ending tightens / shortens** observation (or, if thresholds differ, **alternation**—then note engine vs doctrine gap).

**Expected output shape**

- At least **one cadence** card when sentence material is sufficient; otherwise document as suppression.

**Acceptable reflection direction**

- States that **sentence length behaves differently toward the end**, with **means, ratios, or counts** in evidence—not “pacing feels faster.”

**Unacceptable outputs**

- **Dramatic** or **emotional** claims (“tension builds”) without measurable cadence support.
- **Advice** (“use more fragments”).

**Rationale**

- Validates **cadence tightening** as structural, not tonal, reflection.

---

## Case 7 — Lines lengthen toward the end

**Input text**

> Short opener. Brief note. Quick aside. Early sentences stay small. Then the draft relaxes into a much longer sentence that carries more clauses and more breathing room as it describes the corridor, the light, the sound of rain, and the way the meeting notes curled at the edge where coffee had dried. Another long sentence follows, gathering detail about the window, the road, the tree, and the sky until the final stretch reads like a single sustained breath that refuses to stop even when the reader expects a period.

**Expected category/categories**

- `cadence` with a **lines lengthen / expand toward the end** observation (or alternation if that fires instead—flag for review).

**Expected output shape**

- **Main or supporting** with cadence expected when thresholds met.

**Acceptable reflection direction**

- Clear **end-weighted lengthening** claim backed by quarter or comparable evidence.

**Unacceptable outputs**

- **Quality judgment** (“better writing at the end”).
- **Vague** “flow” commentary without numbers.

**Rationale**

- Pairs with Case 6 for **cadence lengthening** coverage.

---

## Case 8 — Heavy qualification and revision cues

**Input text**

> Maybe the proposal was basically sound, though perhaps it seemed somewhat unfinished. However, the numbers could still work, although several sections might need revision. Probably the timeline was roughly accurate, yet stakeholders appeared unconvinced; nevertheless, the team would still proceed, though possibly with a smaller scope. Generally the risk seemed fairly high, but maybe that was only partially true until further review.

**Expected category/categories**

- `hesitation_qualification` (possibly alongside another category if legitimately supported).

**Expected output shape**

- **Supporting or main** is fine; **no cards** only if hesitation is structurally treated as noise (then reconcile with doctrine).

**Acceptable reflection direction**

- Summarizes **softening, qualification, or revision-style** wording frequency with **bucket tallies** in evidence.

**Unacceptable outputs**

- **Diagnosis** of anxiety or honesty.
- **Moral** judgment (“evasive writer”).
- **Advice** (“be more decisive”).

**Rationale**

- Covers **hesitation / qualification** as a measurable lexical pattern, not mind-reading.

---

## Case 9 — Thin draft, no durable signal

**Input text**

> Short note here.

**Expected category/categories**

- None (no category should force a card).

**Expected output shape**

- **No cards** (empty stack). Per doctrine, **returning nothing is correct**.

**Acceptable reflection direction**

- N/A (no output).

**Unacceptable outputs**

- Any card **invented** to fill space.
- **Generic** mirror copy not tied to evidenced patterns.

**Rationale**

- Enforces **suppression to zero** and the **no padding** invariant.

---

## Case 10 — Short draft, concentrated idea language (abstraction-only exception)

**Input text**

> freedom truth justice hope meaning thought wonder concept notion sense idea tomorrow yesterday waiting change future past memory dream self becoming identity love fear death power good evil

**Expected category/categories**

- `abstraction_concrete` **only** (other categories should not appear solely to satisfy length).

**Expected output shape**

- **Supporting-only or main** acceptable; **no cards** fails the case unless the exception is intentionally retired in product.

**Acceptable reflection direction**

- **Idea-heavy concentration** in a **short** draft, evidenced by counts/ratios, without pretending the draft is “long enough” for other families.

**Unacceptable outputs**

- **Repetition** card that strains a lemma not credibly “returning” in meaning.
- **Cadence** claims from **too few** sentences to be credible.

**Rationale**

- Tests the doctrine’s **narrow short-form abstraction** exception and **honest suppression** elsewhere.

---

## Case 11 — Chaotic surface, fragile signals

**Input text**

> OK!!! so—uh—WAIT. fragment. FRAGMENT. then,,, maybe??? idk. table chair door BUT ALSO freedom??? however although although although. short. LONG SENTENCE THAT DRAGS ON AND ON AND ON WITH CLAUSES AND MORE CLAUSES UNTIL THE READER FORGETS THE START. tiny. HUGE HUGE HUGE LINE AGAIN FOR NO CLEAR REASON. maybe perhaps sort of.

**Expected category/categories**

- **Unspecified**—zero, one, or more categories may qualify; the case tests **stability**, not a single headline.

**Expected output shape**

- **No cards** or **a small stack (≤5)** with **no duplicate categories** and **no duplicate headlines**. **Supporting-only** is acceptable.

**Acceptable reflection direction**

- Any emitted card must still be **evidence-backed**, **non-diagnostic**, and **non-personality**.
- Suppression is acceptable if signals are **ambiguous or below threshold**.

**Unacceptable outputs**

- **Confident** claims that exceed what the noisy string supports.
- **Writer insult** or **competence** framing.
- **More than five** cards or **duplicate** categories/headlines.

**Rationale**

- Stress-tests **chaotic input** against doctrine: **humility**, **caps**, and **dedupe** behavior without prescribing a single “correct” card.

---

## Case 12 — Near-tie: directional signal should not lose to balanced when similarly strong

**Input text**

> The pattern held across chapters: the pattern returned in the margins, and editors circled the pattern until the pattern felt unavoidable. Freedom, truth, justice, hope, meaning, thought, memory, dream, self, power, fear, love, death, life, time, change, future, past, tomorrow, yesterday sit alongside table, chair, door, window, floor, wall, hand, stone, water, metal, glass, paper, knife, cup, road, car, tree, sky, rain in the same long paragraph, so ideas and images crowd each other without one side winning cleanly.

**Expected category/categories**

- `repetition` **and** `abstraction_concrete` (mixed-density or “both frequent” style abstraction is plausible here).

**Expected output shape**

- **Multiple cards** expected when material clears floors; order matters for this case.

**Acceptable reflection direction**

- If both **named recurrence** and an **abstraction** card appear and internal strength is **close**, the **stack order** should **not** place a **balanced / neutral** abstraction observation **above** a **clearly directional** observation of **similar strength** (per doctrine ordering). **Named repetition** should remain **near the front** when present.
- Exact headline strings are engine-defined; judge by **family** (directional vs balanced vs repetition).

**Unacceptable outputs**

- **Balanced-only** stack that **suppresses** a valid **named recurrence** card without threshold justification.
- **Vague** “everything happens” headline with **no** counts.

**Rationale**

- Targets **cross-category ordering** and the **directional vs balanced** product rule when signals compete.

---

## Corpus maintenance

- When the engine or doctrine changes, **update expected shapes** or retire cases—do not silently widen “acceptable” to hide regressions.
- Prefer **recording actual outputs** next to expectations in QA runs (spreadsheet or ticket), not editing this file with ad-hoc loosening.

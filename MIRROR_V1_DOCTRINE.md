# Mirror V1 — Internal product doctrine

## 1. Mirror V1 purpose

**Mirror V1** turns the **current session draft** into a **small set of short, evidence-backed observations** about **surface-visible patterns** in the text: how words recur, how abstract vs concrete vocabulary shows up (including whether that balance **shifts** across the draft), how sentence length behaves, and how often qualification-style wording appears.

Mirror is a **mirror**, not a coach: it names **what the draft is doing on the page**, not what the writer should do, think, or become.

---

## 2. Categories in scope

Mirror V1 may surface **at most one observation per category** per run. The categories are:

| Category | What it reflects (product meaning) |
|----------|-----------------------------------|
| **Repetition** | A **specific word** the draft returns to often enough to be worth naming, with optional proof snippets. |
| **Abstraction / concrete** | Whether **idea-leaning** vs **image-leaning** vocabulary dominates, stays mixed, or **shifts** between the first and second half of the draft. |
| **Cadence** | Whether sentences **shorten or lengthen** toward the end in a clear way, or the draft **alternates** clearly short and long lines. |
| **Hesitation / qualification** | How often the draft uses **softening and revision-style** wording (qualifiers, pivots, uncertainty, contradiction markers), summarized as a single pattern line. |

Anything outside these four buckets is **out of scope** for V1 cards.

---

## 3. Output rules

### Shape

- **Categories:** exactly the four above; each card is tagged with one of them.
- **Max cards:** **up to five** in total: **at most one main** and **up to four supporting**.
- **At most one card per category** in the final stack (no duplicate categories in the output).

A "card" is a single headline statement paired with optional supporting evidence (counts, ratios, or text snippets).

### Main vs supporting

- **Main** is the **single strongest** eligible card when it clears a **high** internal strength bar. If nothing clears that bar, **main is omitted**.
- **Supporting** cards are additional eligible observations, each from a **different category**, each clearing a **moderate** strength bar.
- **Supporting without main is allowed:** if the top observation is not strong enough to be “main,” weaker-but-clear signals can still appear as supporting only.

A main card represents a clearly dominant observation. Supporting cards represent secondary but still meaningful signals. If no observation is strong enough to qualify as dominant, the system may return supporting cards only.

### Evidence

- The **headline** states one observation in **plain, restrained** language.
- **Counts, ratios, means, and short text snippets** live in **evidence**, not in the headline.

---

## 4. Selection and suppression rules

### What “suppression” means in product terms

- Mirror **does not pad** the stack. **Weak or thin signals do not become cards.**

If no category produces a signal that clearly meets the system's internal thresholds, Mirror returns no cards. Returning nothing is considered a correct outcome.

- There is a **material floor** on how much text is needed before **most** categories are even considered (short drafts mostly produce **nothing** rather than noise).
- **One narrow exception** exists for **abstraction-only**: very short drafts can still get an abstraction card **only** when idea-leaning vocabulary is **unusually concentrated** by the product’s definition.

### Ordering (product contract)

- When two observations are close in strength, the system favors directional statements (clear dominance or shift) over balanced or neutral statements. Balanced statements may still appear when they are the strongest available signal, but should not displace a clearly directional observation of similar strength.
- **Named repetition** stays **near the front** of the ordering when it appears.
- When two candidates are **effectively tied** in strength, the product prefers the line that reads **more specific and less boilerplate**.

### Deduping (product contract)

- The user never sees **two cards in the same category**.
- The user never sees **two cards with the same headline text**; one wins.

---

## 5. Language rules

Headlines and evidence must obey all of the following:

1. **No diagnosis** — Do not label the writer, their mental state, skill level, or “problem.”
2. **No personality inference** — Do not imply traits, identity, habits outside the text, or motivation.
3. **No vague or narrative projection** — Do not invent a scene, audience, stakes, or “what you’re really saying.” Stick to **measurable or quotable** support.
4. **Observation-first** — One clear observation per headline; **no advice**, no “you should,” no prescriptive rewrite guidance.
5. **Restrained certainty** — Do not claim to know intent; describe **patterns visible in this draft**.

**Voice:** plain, direct, slightly formal; **no** filler subjects like “this piece” or “the writing” unless truly necessary (style target for copy, not a runtime linter).

---

## 6. Non-goals (what Mirror V1 does **not** reflect)

Mirror V1 **does not**:

- Judge **quality**, **good/bad writing**, morals, or appropriateness.
- Edit, score grammar, or enforce style guides.
- Infer **goals**, **genre**, **audience**, or **theme** beyond what the four categories measure.
- Describe **voice**, **personality**, or **authenticity**.
- Promise **complete** coverage of everything interesting in a draft—only **up to four pattern families** plus optional main, when signals clear the bar.
- Replace human judgment; it is a **narrow instrument** for a few draft mechanics.

**In scope for “reflection”:** lexical and structural signals defined by the four categories **on this session’s text**.

**Out of scope:** anything that requires mind-reading, world-modeling outside the string, or a broader writing coach.

---

## 7. Implementation notes

*(Not promises to users; engineering / QA context.)*

- Signals are derived from a **deterministic tokenizer** and **fixed lexicon lists** (abstract/concrete words, hesitation families, repetition dulling/stopword filters).
- **Numeric floors** gate emission (word count, sentence count, repetition strength, variance thresholds, hesitation density). Exact numbers live in `generationThresholds` / `thresholds` / `selectionThresholds` and may be tuned without changing category names.
- **Ordering** uses a **statement-based weighting layer** on top of an internal score; **threshold checks for main vs supporting use the raw internal score**, not the weighted sort value—so “order” and “eligibility” are intentionally decoupled in code.
- **Abstraction** cards share an internal **minimum score clamp** so marginal-but-valid abstraction signals can still compete for supporting slots.
- **Repetition** only names lemmas that pass **strength and dull-word / ultra-short-word filters**; high counts on filtered words do not produce a repetition card.
- **Cadence “ending tightens / lengthens”** depends on **enough sentences** for stable quarter comparisons; **alternation** is a separate branch with its own gates.
- **Hesitation** applies **small structural rules** (e.g. pivots without softening) before density gates, to avoid “connective noise” cards.

---

## 8. Open questions

1. **Product stance on “main absent, supporting present”:** Is that an intentional UX pattern (honest humility) or something to hide/minimize in the client?
2. **Whether `rankScore` (or any internal strength) should ever be user-visible** — today it is part of the pipeline result for transparency/tuning; product may prefer it stay internal.
3. **How Mirror V1 relates to “recent trends” or other mirror surfaces** (if shipped separately): this doctrine describes **per-session** pipeline behavior only; cross-session product rules should be documented separately if they are part of the same “Mirror” brand.
4. **Localization:** headlines and evidence are **English-shaped** today; any non-English product needs an explicit stance (suppress, translate, or re-build signals).

---

*This document encodes the **intended product contract** implied by Mirror V1 as implemented. It is internal; it does not supersede legal, accessibility, or editorial policies elsewhere.*

# TRACE FIELD RESEARCH BRIEF

Status: Research-only doctrine brief (pre-production)  
Scope: Conceptual and prototype constraints only. No production implementation, no UI build, no clustering implementation.

## 1) Core Definition

### What Trace Field Is

Trace Field is Wayword's semantic recurrence instrument.

It is a restrained observatory view that surfaces recurring language structures over time, including:
- repeated words
- repeated phrases
- recurring images
- recurring concrete nouns
- metaphor-like clusters
- repeated structural patterns

It is designed to show recurrence and relation in language artifacts, not to explain the person behind them.

### What Trace Field Is Not

Trace Field is not:
- a word cloud
- a topic-model dashboard
- therapy
- personality analysis
- emotional scoring
- "AI understands you"

It must not present optimization, diagnosis, or identity claims.

### What Question It Answers

Primary question:
- "What language patterns recur across this body of writing, and how do they reappear over time?"

Secondary question:
- "Which motifs show persistence, clustering, or return without forcing a single interpretation?"

## 2) Instrument Boundaries

Trace Field must remain distinct from other observatory instruments.

### Trace Field vs Season Wheel

- Season Wheel: temporal occupancy (when writing activity happens and how it clusters)
- Trace Field: semantic recurrence (what language patterns recur)

Boundary rule:
Trace Field may reference time context, but it must not become a temporal occupancy instrument.

### Trace Field vs Drift Atlas

- Drift Atlas: transformation and migration of language over longer horizons
- Trace Field: recurrence and co-occurrence in observed language structures

Boundary rule:
Trace Field may show recurrence across periods, but it must not become an evolution/narrative-change instrument.

### Trace Field vs Pulse

- Pulse: cadence and rhythm of writing behavior
- Trace Field: semantic residue in textual artifacts

Boundary rule:
Trace Field may align with cadence windows for context, but it must not become a rhythm/behavioral pacing instrument.

## 3) Allowed Observations

Allowed observations are strictly text-evidenced and low-claim.

Examples:
- repeated words across entries
- repeated short phrases
- recurring concrete nouns (place, object, body, weather terms)
- recurring image language and motifs
- metaphor-like clusters that appear repeatedly
- repeated structural patterns (for example, recurring contrast structures or parallel phrasing)
- co-occurrence patterns (terms that repeatedly appear together)

Allowed statement style:
- "appears"
- "recurs"
- "clusters"
- "co-occurs"
- "returns"

## 4) Prohibited Interpretations

Trace Field must not output or imply hidden-state conclusions about the user.

Prohibited examples:
- "you are anxious"
- "you are avoidant"
- "this means grief"
- "you fear intimacy"
- "your writing reveals depression"

Also prohibited:
- therapeutic framing
- personality typing
- emotional certainty claims
- productivity coaching language
- engagement pressure language

## 5) Evidence Standards

Every surfaced observation must be traceable to visible textual evidence.

Required standards:
- each recurrence claim maps to concrete source excerpts or token-level references
- recurrence counts are reproducible from the same input set
- transformations from source text to displayed signal are inspectable
- no hidden interpretive layer that outputs personal conclusions
- no claim is shown if evidence cannot be surfaced

Doctrine rule:
No hidden interpretive magic.

## 6) Visual Grammar Direction (Research)

Trace Field visual direction should avoid dashboard aesthetics and preserve restraint.

Research directions:
- field
- constellation
- magnetic filings
- residue
- semantic weather
- linguistic gravity
- cartographic restraint
- astronomical restraint

Guardrails for visual research:
- avoid generic KPI chart language
- avoid precision theater (visual certainty stronger than evidence)
- avoid visual density that implies total knowledge
- maintain ambiguity and legibility

## 7) Prototype Constraints (v0 Research Prototype)

The first Trace Field prototype must be deterministic where possible.

Constraints:
- no LLM interpretation layer
- no emotional labels
- no psychological summaries
- no user-facing claims beyond recurrence/appearance
- no generated advice or behavioral prescriptions
- deterministic recurrence logic with documented thresholds
- reproducible outputs for fixed input and settings

Operational framing:
- prototype is for internal evaluation and doctrine validation
- not a production feature
- not a public claim system

## 8) Safety Risks And Mitigations

Governing constraint: `docs/OBSERVATORY_SAFETY_DOCTRINE.md`.

Trace Field-specific risks:
- metaphor literalization risk: symbolic language read as literal personal fact
- narrative lock-in risk: repeated motifs treated as fixed identity
- confidence laundering risk: polished visuals imply high certainty
- category collapse risk: distinct language patterns flattened into one label
- overreach risk: recurrence signal translated into diagnosis-like meaning

Mitigations:
- hard claim ceilings: recurrence only, no identity/state conclusions
- evidence-first outputs: every claim linked to textual trace
- uncertainty-preserving language templates
- prohibited phrase/class blocking in prototype copy surfaces
- safety review gates before any expansion beyond internal prototype usage

## 9) Open Questions

Embeddings:
- Should v0 avoid embeddings entirely and start with lexical/phrase recurrence only?
- If embeddings are later introduced, what similarity thresholds are acceptable without semantic overreach?

Local vs cloud processing:
- What processing must remain local by default for trust and data minimization?
- Under what conditions, if any, can cloud processing be allowed?

Derived artifact deletion:
- What is the deletion contract for derived traces (indices, vectors, caches)?
- Must derived artifacts be deleted on the same timeline as source text deletion?

Recurrence thresholds:
- What minimum frequency and dispersion thresholds are required before surfacing a pattern?
- How should low-support patterns be suppressed to avoid false narrative emergence?

User-facing language:
- Which sentence templates are approved for recurrence-only reporting?
- What review process owns additions to this language set?

Uncertainty wording:
- Should uncertainty be explicit on every surfaced observation or only when evidence is weak?
- What default qualifiers maintain clarity without clutter?

## 10) Go/No-Go Recommendation

Recommendation: **Go for a constrained v0 prototype**, with strict doctrine gates.

Go conditions:
- recurrence-only scope is enforced
- deterministic and evidence-traceable logic is used
- prohibited interpretation classes are blocked
- no LLM interpretation is present
- Safety and QA lanes approve prototype outputs before any broader exposure

No-go triggers:
- any diagnosis/personality/emotional-scoring implication
- any non-traceable claim
- any shift toward productivity or engagement manipulation framing
- any visual or copy system that overstates certainty

Decision:
Proceed to v0 prototype research only, under the constraints above. No production rollout until safety controls are implemented and validated.

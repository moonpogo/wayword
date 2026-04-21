/**
 * Structured Wayword mirror evaluation corpus (review harness).
 * Spec: WAYWORD_EVALUATION_CORPUS.md (initial cases, section 8).
 *
 * @typedef {Object} WaywordEvaluationCase
 * @property {string} id
 * @property {string} name
 * @property {string} bucket
 * @property {string} input
 * @property {string[]} targetCategories — engine category ids where applicable, e.g. "repetition"; empty = no dominant target
 * @property {string[]} acceptablePrimary — human-readable expectations for manual review (not asserted)
 * @property {string[]} forbiddenPrimary — types that should not win as primary
 * @property {string} nudgeExpectation
 * @property {string} notes
 */

/** @type {WaywordEvaluationCase[]} */
export const waywordEvaluationCorpus = [
  // --- Bucket A ---
  {
    id: "REP-01",
    name: "Single dominant repeated word",
    bucket: "A_clean_single_signal",
    input:
      "I kept thinking about the window. The window in the kitchen. The window above the sink. Even later, walking home, it was still the window I saw.",
    targetCategories: ["repetition"],
    acceptablePrimary: [
      "repetition as primary",
      "wording centered on a single recurring word"
    ],
    forbiddenPrimary: [
      "cadence as primary",
      "abstraction/concrete balance as primary",
      "hesitation as primary"
    ],
    nudgeExpectation: "No special nudge required.",
    notes: "This should be easy. If repetition does not win here, ranking is broken."
  },
  {
    id: "REP-02",
    name: "Repetition across dispersed phrasing",
    bucket: "A_clean_single_signal",
    input:
      "Every version of the day seemed to bend back toward the same question. At breakfast the question was there. On the train the question was there. By night, it still felt like the question had been waiting for me.",
    targetCategories: ["repetition"],
    acceptablePrimary: ["repetition primary"],
    forbiddenPrimary: ["hesitation primary"],
    nudgeExpectation: "None",
    notes: "Useful for checking whether repetition detection is too literal or too narrow."
  },
  {
    id: "ABS-01",
    name: "Strongly abstract language",
    bucket: "A_clean_single_signal",
    input:
      "Meaning kept dissolving into interpretation. Everything felt mediated by distance, structure, and idea rather than event. I could describe the shape of the thought, but not the room it happened in.",
    targetCategories: ["abstraction_concrete"],
    acceptablePrimary: [
      "ideas dominate over concrete detail",
      "later passages lean conceptual"
    ],
    forbiddenPrimary: [
      "concrete detail outweighs abstraction",
      "cadence primary"
    ],
    nudgeExpectation: "None",
    notes: "Should clearly identify conceptual language without sounding diagnostic."
  },
  {
    id: "CON-01",
    name: "Strongly concrete imagery",
    bucket: "A_clean_single_signal",
    input:
      "The spoon hit the side of the mug. Rain clung to the window screen. My shoes left dark marks across the tile. The whole room smelled like wet cardboard and coffee.",
    targetCategories: ["abstraction_concrete"],
    acceptablePrimary: ["concrete detail outweighs abstraction", "image-heavy or scene-based reading"],
    forbiddenPrimary: ["ideas dominate over concrete detail"],
    nudgeExpectation: "None",
    notes: "Tests whether concrete lexicon is actually being recognized."
  },
  {
    id: "CAD-01",
    name: "Ending tightens",
    bucket: "A_clean_single_signal",
    input:
      "I kept trying to explain it in full sentences, adding context, qualifications, and side routes as if precision might make the memory easier to hold. It didn’t. By the end there was only this: it happened. I stayed.",
    targetCategories: ["cadence"],
    acceptablePrimary: ["ending tightens noticeably"],
    forbiddenPrimary: ["repetition primary", "hesitation primary"],
    nudgeExpectation: "None",
    notes: "This is the canonical cadence success case."
  },
  {
    id: "CAD-02",
    name: "Lines lengthen near the end",
    bucket: "A_clean_single_signal",
    input:
      "I left. I came back. I waited. Then I began explaining, slowly at first and then with more detail, until the explanation turned into something larger, heavier, and harder to stop once it had gathered its own shape.",
    targetCategories: ["cadence"],
    acceptablePrimary: ["lines lengthen near the end"],
    forbiddenPrimary: ["ending tightens"],
    nudgeExpectation: "None",
    notes: "Used to distinguish opposite cadence patterns."
  },
  {
    id: "HES-01",
    name: "Immediate softening after assertion",
    bucket: "A_clean_single_signal",
    input:
      "It was the right decision, I think. I knew what I was doing, or at least I mostly did. The plan was clear, more or less, until it wasn’t.",
    targetCategories: ["hesitation_qualification"],
    acceptablePrimary: [
      "statements are often qualified just after they’re made",
      "assertions are often followed by softening"
    ],
    forbiddenPrimary: ["repetition primary", "cadence primary"],
    nudgeExpectation: "None",
    notes: "One of the cleanest hesitation cases."
  },
  {
    id: "HES-02",
    name: "Revised and softened statements",
    bucket: "A_clean_single_signal",
    input:
      "I wanted to leave. That’s not exactly right. I wanted the version of myself who stayed to disappear, which is maybe different.",
    targetCategories: ["hesitation_qualification"],
    acceptablePrimary: ["statements are often revised or softened"],
    forbiddenPrimary: ["abstraction/concrete primary unless very strongly supported"],
    nudgeExpectation: "None",
    notes: "Good for checking revision language."
  },
  // --- Bucket B ---
  {
    id: "MIX-01",
    name: "Repetition plus hesitation",
    bucket: "B_mixed_signal",
    input:
      "I kept saying fine. Fine, probably. Fine, in a way. The word kept returning even as it kept changing shape.",
    targetCategories: ["repetition", "hesitation_qualification"],
    acceptablePrimary: [
      "repetition primary, hesitation supporting",
      "hesitation primary, repetition supporting (threshold-dependent)"
    ],
    forbiddenPrimary: ["cadence primary"],
    nudgeExpectation: "None",
    notes: "Useful ranking case. Need to decide what should win under current weights."
  },
  {
    id: "MIX-02",
    name: "Concrete opening, abstract back half",
    bucket: "B_mixed_signal",
    input:
      "The table was sticky. A fork leaned off the plate. Someone had left a glass ring in the wood. But after that, the room stopped feeling like a room and became a theory about leaving, distance, and the way memory edits what it cannot hold.",
    targetCategories: ["abstraction_concrete"],
    acceptablePrimary: ["back half leans more conceptual than scene-based"],
    forbiddenPrimary: ["concrete outweighs abstraction as primary"],
    nudgeExpectation: "None",
    notes: "Important because this is richer than a blunt overall ratio."
  },
  {
    id: "MIX-03",
    name: "Cadence plus hesitation",
    bucket: "B_mixed_signal",
    input:
      "I knew it was over, I think, though maybe I only knew that afterward when the whole scene began arranging itself into a story I could survive. At the time it was simpler. Quieter. Almost nothing.",
    targetCategories: ["cadence", "hesitation_qualification"],
    acceptablePrimary: [
      "cadence primary with hesitation supporting",
      "hesitation primary with cadence supporting"
    ],
    forbiddenPrimary: ["repetition primary"],
    nudgeExpectation: "None",
    notes: "Another ranking stress test."
  },
  // --- Bucket C ---
  {
    id: "WEAK-01",
    name: "Ordinary neutral prose",
    bucket: "C_weak_signal",
    input:
      "I woke up late, made coffee, answered a few emails, and took the bus downtown. The meeting went fine. After that I came home and cleaned the kitchen.",
    targetCategories: [],
    acceptablePrimary: ["restrained generic-but-true observation", "possibly no strong reflection"],
    forbiddenPrimary: ["any highly dramatic or uncanny claim", "fake-deep cadence or abstraction claims"],
    nudgeExpectation: "None",
    notes: "The system must not hallucinate significance here."
  },
  {
    id: "WEAK-02",
    name: "Short but normal",
    bucket: "C_weak_signal",
    input: "Today felt off, but I got through it.",
    targetCategories: [],
    acceptablePrimary: ["subdued output", "possibly fallback"],
    forbiddenPrimary: [
      "repetition",
      "cadence",
      "abstraction/concrete claims",
      "elaborate nudge"
    ],
    nudgeExpectation: "Short-input-sensitive behavior only",
    notes: "Critical anti-bullshit case."
  },
  {
    id: "WEAK-03",
    name: "One-word entry",
    bucket: "C_weak_signal",
    input: "Tired.",
    targetCategories: [],
    acceptablePrimary: ["minimal fallback only"],
    forbiddenPrimary: [
      "any stylometric claim",
      "any line implying structure over time",
      "any nudge that sounds fake-serious"
    ],
    nudgeExpectation: "Special suppression behavior",
    notes: "This absolutely must not produce fake wisdom."
  },
  {
    id: "WEAK-04",
    name: "Two-word entry",
    bucket: "C_weak_signal",
    input: "Still here.",
    targetCategories: [],
    acceptablePrimary: ["minimal fallback only"],
    forbiddenPrimary: ["cadence", "repetition", "abstraction/concrete"],
    nudgeExpectation: "Suppressed or extremely restrained",
    notes: "Another must-pass edge case."
  },
  // --- Bucket D ---
  {
    id: "EDGE-01",
    name: "List-like input",
    bucket: "D_edge_case",
    input: "Milk\nBananas\nNotebook\nTape\nDish soap\nSocks",
    targetCategories: [],
    acceptablePrimary: ["subdued handling", "maybe concrete-heavy only if phrased carefully"],
    forbiddenPrimary: ["cadence", "hesitation", "anything implying narrative structure"],
    nudgeExpectation: "None",
    notes: "Tests whether raw nouns trick the system into saying too much."
  },
  {
    id: "EDGE-02",
    name: "Dialogue fragment",
    bucket: "D_edge_case",
    input: "“Are you coming back?”\n“I don’t know.”\n“That’s not an answer.”\n“I know.”",
    targetCategories: [],
    acceptablePrimary: ["restrained output"],
    forbiddenPrimary: ["abstraction-heavy claim", "false cadence confidence"],
    nudgeExpectation: "None",
    notes: "Useful because many users may paste fragments."
  },
  {
    id: "EDGE-03",
    name: "Long single sentence",
    bucket: "D_edge_case",
    input:
      "I kept trying to explain why I stayed in terms that sounded principled and coherent and maybe even generous, although really what I had was a blur of motives, half-reasons, and delays that I only later arranged into something like an account.",
    targetCategories: [],
    acceptablePrimary: ["hesitation possible", "abstraction possible"],
    forbiddenPrimary: ["cadence claims dependent on multi-sentence structure"],
    nudgeExpectation: "None",
    notes: "Tests sentence-count gating."
  },
  {
    id: "EDGE-04",
    name: "Repeated filler / low-value repetition",
    bucket: "D_edge_case",
    input:
      "Like, I was just, like, going to the store and, like, I don’t know, like, it was whatever.",
    targetCategories: [],
    acceptablePrimary: [
      "hesitation/softening possible",
      "repetition suppressed or deprioritized if filler-filter works"
    ],
    forbiddenPrimary: ["triumphant repetition line about a boring filler word"],
    nudgeExpectation: "None",
    notes: "This specifically checks dull-word filtering."
  },
  // --- Bucket E ---
  {
    id: "ADV-01",
    name: "Empty pseudo-profundity",
    bucket: "E_adversarial",
    input:
      "The shape of the silence became a mirror for the invisible architecture of everything I could not name.",
    targetCategories: [],
    acceptablePrimary: ["very restrained abstraction reading at most"],
    forbiddenPrimary: ["strong confident headline acting like this is rich evidence"],
    nudgeExpectation: "None",
    notes: "The system must not reward decorative vagueness too eagerly."
  },
  {
    id: "ADV-02",
    name: "Generated-sounding mystical prose",
    bucket: "E_adversarial",
    input:
      "I wandered through the threshold of becoming, where memory folded into a sacred geometry of return and forgetting.",
    targetCategories: [],
    acceptablePrimary: ["restrained abstraction at most"],
    forbiddenPrimary: ["fake-deep celebration", "any line that sounds impressed with the text"],
    nudgeExpectation: "None",
    notes: "If Wayword flatters this, it starts to look gullible."
  },
  // --- Bucket F ---
  {
    id: "REAL-01",
    name: "Everyday journal entry",
    bucket: "F_realistic",
    input:
      "I didn’t want to go, but once I got there it was fine. I talked more than I expected. On the walk back I kept replaying one part of the conversation and wondering whether I had said too much.",
    targetCategories: [],
    acceptablePrimary: ["hesitation likely", "repetition possible as supporting"],
    forbiddenPrimary: ["overly literary cadence claim unless clearly justified"],
    nudgeExpectation: "Normal behavior",
    notes: "This is closer to actual product usage than the crafted cases."
  },
  {
    id: "REAL-02",
    name: "Practical reflective note",
    bucket: "F_realistic",
    input:
      "I need a better system for mornings. The problem isn’t just discipline. It’s that every small decision seems to cost more than it should the moment I wake up, before coffee, before light, before I’ve fully entered the day.",
    targetCategories: [],
    acceptablePrimary: ["balanced abstraction/concrete", "maybe back-half shift if supported"],
    forbiddenPrimary: ["false repetition"],
    nudgeExpectation: "Normal",
    notes: "A realistic test of mixed ordinary writing."
  }
];

"use strict";
var WaywordMirror = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/features/mirror/entry-iife.ts
  var entry_iife_exports = {};
  __export(entry_iife_exports, {
    MIRROR_NEXT_PASS_FALLBACK_INSTRUCTION: () => MIRROR_NEXT_PASS_FALLBACK_INSTRUCTION,
    MIRROR_NEXT_PASS_LOW_SIGNAL_FALLBACK: () => MIRROR_NEXT_PASS_LOW_SIGNAL_FALLBACK,
    buildMirrorSessionDigest: () => buildMirrorSessionDigest,
    buildReflectiveProfile: () => buildReflectiveProfile,
    getPatternsProfileFromDigests: () => getPatternsProfileFromDigests,
    mirrorReflectionFamilyKey: () => mirrorReflectionFamilyKey,
    nextPassInstructionFromMirrorPipelineResult: () => nextPassInstructionFromMirrorPipelineResult,
    runMirrorPipeline: () => runMirrorPipeline,
    runMirrorRecentTrendsPipeline: () => runMirrorRecentTrendsPipeline,
    tokenizeText: () => tokenizeText
  });

  // src/features/mirror/utils/normalizeText.ts
  function normalizeText(text) {
    return String(text || "").replace(/\r\n?/g, "\n").replace(/[\u2018\u2019\u201A\u2032\u2035]/g, "'").replace(/[\u201C\u201D\u201E\u2033]/g, '"').replace(/\s+/g, " ").trim();
  }

  // src/features/mirror/utils/mirrorSessionId.ts
  function fnv1a32Hex(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16).padStart(8, "0");
  }
  function resolveMirrorSessionId(input) {
    const explicit = input.sessionId?.trim();
    if (explicit) return explicit;
    const basis = `${normalizeText(input.text)}|${input.startedAt ?? ""}|${input.endedAt ?? ""}`;
    return `mirror-${fnv1a32Hex(basis)}`;
  }

  // src/features/mirror/constants/abstractWords.ts
  var MIRROR_ABSTRACT_WORDS = [
    "idea",
    "concept",
    "notion",
    "sense",
    "structure",
    "feeling",
    "truth",
    "meaning",
    "justice",
    "freedom",
    "hope",
    "fear",
    "becoming",
    "identity",
    "love",
    "time",
    "life",
    "death",
    "power",
    "beauty",
    "good",
    "evil",
    "tomorrow",
    "today",
    "yesterday",
    "waiting",
    "wait",
    "change",
    "future",
    "past",
    "thought",
    "wonder",
    "self",
    "remember",
    "memory",
    "dream"
  ];

  // src/features/mirror/constants/concreteWords.ts
  var MIRROR_CONCRETE_WORDS = [
    "table",
    "chair",
    "door",
    "window",
    "floor",
    "wall",
    "hand",
    "foot",
    "stone",
    "water",
    "metal",
    "glass",
    "paper",
    "knife",
    "cup",
    "road",
    "car",
    "tree",
    "sky",
    "rain"
  ];

  // src/features/mirror/constants/thresholds.ts
  var MIRROR_MIN_TOKEN_LENGTH = 3;
  var MIRROR_REPETITION_TOP_N = 8;
  var MIRROR_REPETITION_MIN_COUNT = 2;
  var MIRROR_SHORT_SENTENCE_MAX_WORDS = 7;
  var MIRROR_LONG_SENTENCE_MIN_WORDS = 18;
  var MIRROR_CADENCE_MIN_SENTENCES_FOR_END_SHAPE = 6;
  var MIRROR_END_COMPRESSION_RATIO = 0.68;
  var MIRROR_END_EXPANSION_RATIO = 1.34;
  var MIRROR_ABSTRACTION_SHIFT_RATIO = 1.32;
  var MIRROR_ABSTRACTION_SHIFT_MIN_RATE_DELTA = 0.015;

  // src/features/mirror/utils/tokenizeText.ts
  function tokenizeText(text) {
    const normalized = normalizeText(text).toLowerCase();
    if (!normalized) return [];
    return normalized.match(/\p{L}+(?:'\p{L}+)?/gu) ?? [];
  }

  // src/features/mirror/analysis/extractAbstraction.ts
  var ABSTRACT = new Set(MIRROR_ABSTRACT_WORDS.map((w) => w.toLowerCase()));
  var CONCRETE = new Set(MIRROR_CONCRETE_WORDS.map((w) => w.toLowerCase()));
  function extractAbstraction(input) {
    const tokens = tokenizeText(input.text).map((t) => t.toLowerCase());
    const contentTokenCount = tokens.length;
    let abstractCount = 0;
    let concreteCount = 0;
    const firstHalfEnd = Math.ceil(contentTokenCount / 2);
    let firstHalfAbstractMatchCount = 0;
    let secondHalfAbstractMatchCount = 0;
    let firstHalfConcreteMatchCount = 0;
    let secondHalfConcreteMatchCount = 0;
    for (let i = 0; i < tokens.length; i += 1) {
      const w = tokens[i];
      const inFirst = i < firstHalfEnd;
      if (ABSTRACT.has(w)) {
        abstractCount += 1;
        if (inFirst) firstHalfAbstractMatchCount += 1;
        else secondHalfAbstractMatchCount += 1;
      }
      if (CONCRETE.has(w)) {
        concreteCount += 1;
        if (inFirst) firstHalfConcreteMatchCount += 1;
        else secondHalfConcreteMatchCount += 1;
      }
    }
    const abstractConcreteRatio = abstractCount / Math.max(concreteCount, 1);
    const firstTokens = firstHalfEnd;
    const secondTokens = contentTokenCount - firstHalfEnd;
    const d1a = firstHalfAbstractMatchCount / Math.max(1, firstTokens);
    const d2a = secondHalfAbstractMatchCount / Math.max(1, secondTokens);
    const d1c = firstHalfConcreteMatchCount / Math.max(1, firstTokens);
    const d2c = secondHalfConcreteMatchCount / Math.max(1, secondTokens);
    let shiftsTowardAbstract = false;
    let shiftsTowardConcrete = false;
    if (contentTokenCount >= 2 && firstTokens >= 1 && secondTokens >= 1) {
      shiftsTowardAbstract = d2a > d1a * MIRROR_ABSTRACTION_SHIFT_RATIO && d2a - d1a >= MIRROR_ABSTRACTION_SHIFT_MIN_RATE_DELTA;
      shiftsTowardConcrete = d2c > d1c * MIRROR_ABSTRACTION_SHIFT_RATIO && d2c - d1c >= MIRROR_ABSTRACTION_SHIFT_MIN_RATE_DELTA;
    }
    return {
      abstractCount,
      concreteCount,
      abstractConcreteRatio,
      shiftsTowardConcrete,
      shiftsTowardAbstract,
      contentTokenCount,
      firstHalfAbstractMatchCount,
      secondHalfAbstractMatchCount,
      firstHalfConcreteMatchCount,
      secondHalfConcreteMatchCount
    };
  }

  // src/features/mirror/utils/splitSentences.ts
  function splitSentences(text) {
    const body = normalizeText(text);
    if (!body) return [];
    const parts = body.split(/(?<=[.!?])(?:\s+|$)/g);
    const out = [];
    for (const part of parts) {
      const s = part.trim();
      if (s) out.push(s);
    }
    return out;
  }

  // src/features/mirror/analysis/extractCadence.ts
  function populationVariance(values) {
    const n = values.length;
    if (n === 0) return 0;
    const mean3 = values.reduce((a, b) => a + b, 0) / n;
    return values.reduce((acc, v) => acc + (v - mean3) ** 2, 0) / n;
  }
  function mean(values) {
    const n = values.length;
    if (n === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / n;
  }
  function extractCadence(input) {
    const sentences = splitSentences(input.text);
    const sentenceCount = sentences.length;
    const lengths = sentences.map((s) => tokenizeText(s).length);
    const averageSentenceLengthWords = sentenceCount === 0 ? 0 : lengths.reduce((a, b) => a + b, 0) / sentenceCount;
    const sentenceLengthVariance = populationVariance(lengths);
    let shortSentenceCount = 0;
    let longSentenceCount = 0;
    for (const len of lengths) {
      if (len <= MIRROR_SHORT_SENTENCE_MAX_WORDS && len > 0) shortSentenceCount += 1;
      if (len >= MIRROR_LONG_SENTENCE_MIN_WORDS) longSentenceCount += 1;
    }
    let meanSentenceLengthFirstQuarterWords = null;
    let meanSentenceLengthLastQuarterWords = null;
    let endCompression = false;
    let endExpansion = false;
    if (sentenceCount >= MIRROR_CADENCE_MIN_SENTENCES_FOR_END_SHAPE) {
      const q = Math.max(1, Math.ceil(sentenceCount / 4));
      const firstLens = lengths.slice(0, q);
      const lastLens = lengths.slice(-q);
      meanSentenceLengthFirstQuarterWords = mean(firstLens);
      meanSentenceLengthLastQuarterWords = mean(lastLens);
      if (meanSentenceLengthFirstQuarterWords > 0) {
        const ratio = meanSentenceLengthLastQuarterWords / meanSentenceLengthFirstQuarterWords;
        endCompression = ratio <= MIRROR_END_COMPRESSION_RATIO;
        endExpansion = ratio >= MIRROR_END_EXPANSION_RATIO;
      }
    } else if (sentenceCount === 4) {
      const firstPairMean = mean(lengths.slice(0, 2));
      const lastPairMean = mean(lengths.slice(2, 4));
      meanSentenceLengthFirstQuarterWords = firstPairMean;
      meanSentenceLengthLastQuarterWords = lastPairMean;
      if (firstPairMean > 0) {
        const ratio = lastPairMean / firstPairMean;
        endCompression = ratio <= MIRROR_END_COMPRESSION_RATIO;
        endExpansion = ratio >= MIRROR_END_EXPANSION_RATIO;
      }
    }
    return {
      sentenceCount,
      averageSentenceLengthWords,
      sentenceLengthVariance,
      shortSentenceCount,
      longSentenceCount,
      endCompression,
      endExpansion,
      meanSentenceLengthFirstQuarterWords,
      meanSentenceLengthLastQuarterWords
    };
  }

  // src/features/mirror/constants/hesitationWords.ts
  var MIRROR_QUALIFIER_WORDS = [
    "almost",
    "basically",
    "maybe",
    "fairly",
    "generally",
    "kind",
    "largely",
    "mostly",
    "nearly",
    "partially",
    "perhaps",
    "possibly",
    "probably",
    "quite",
    "rather",
    "relatively",
    "roughly",
    "seems",
    "appears",
    "somewhat",
    "sort",
    "usually",
    "might",
    "could",
    "would"
  ];
  var MIRROR_PIVOT_WORDS = [
    "although",
    "besides",
    "conversely",
    "furthermore",
    "hence",
    "however",
    "meanwhile",
    "moreover",
    "nevertheless",
    "nonetheless",
    "otherwise",
    "still",
    "therefore",
    "though",
    "thus",
    "yet"
  ];
  var MIRROR_CONTRADICTION_MARKER_WORDS = [
    "cannot",
    "contrary",
    "couldn't",
    "despite",
    "didn't",
    "doesn't",
    "instead",
    "neither",
    "never",
    "nor",
    "unlikely",
    "unlike",
    "wasn't",
    "weren't"
  ];
  var MIRROR_UNCERTAINTY_WORDS = [
    "arguably",
    "guess",
    "guessing",
    "presumably",
    "seemingly",
    "supposedly",
    "unclear",
    "uncertain",
    "unknown",
    "unsure"
  ];

  // src/features/mirror/analysis/extractHesitation.ts
  var QUALIFIERS = new Set(MIRROR_QUALIFIER_WORDS.map((w) => w.toLowerCase()));
  var PIVOTS = new Set(MIRROR_PIVOT_WORDS.map((w) => w.toLowerCase()));
  var CONTRADICTIONS = new Set(MIRROR_CONTRADICTION_MARKER_WORDS.map((w) => w.toLowerCase()));
  var UNCERTAINTY = new Set(MIRROR_UNCERTAINTY_WORDS.map((w) => w.toLowerCase()));
  function extractHesitation(input) {
    const tokens = tokenizeText(input.text).map((t) => t.toLowerCase());
    const contentTokenCount = tokens.length;
    let qualifierLexiconMatchCount = 0;
    let pivotLexiconMatchCount = 0;
    let contradictionLexiconMatchCount = 0;
    let uncertaintyLexiconMatchCount = 0;
    for (const w of tokens) {
      if (QUALIFIERS.has(w)) qualifierLexiconMatchCount += 1;
      if (PIVOTS.has(w)) pivotLexiconMatchCount += 1;
      if (CONTRADICTIONS.has(w)) contradictionLexiconMatchCount += 1;
      if (UNCERTAINTY.has(w)) uncertaintyLexiconMatchCount += 1;
    }
    return {
      contentTokenCount,
      qualifierLexiconMatchCount,
      pivotLexiconMatchCount,
      contradictionLexiconMatchCount,
      uncertaintyLexiconMatchCount
    };
  }

  // src/features/mirror/constants/stopwords.ts
  var MIRROR_STOPWORDS = /* @__PURE__ */ new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "as",
    "by",
    "with",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "it",
    "its",
    "this",
    "that",
    "these",
    "those",
    "about",
    "above",
    "across",
    "after",
    "against",
    "again",
    "all",
    "also",
    "among",
    "another",
    "any",
    "around",
    "because",
    "before",
    "below",
    "between",
    "both",
    "down",
    "during",
    "each",
    "even",
    "ever",
    "every",
    "few",
    "from",
    "further",
    "here",
    "how",
    "into",
    "just",
    "like",
    "more",
    "most",
    "much",
    "nor",
    "not",
    "off",
    "once",
    "only",
    "onto",
    "other",
    "out",
    "over",
    "own",
    "same",
    "some",
    "such",
    "than",
    "then",
    "there",
    "through",
    "too",
    "under",
    "until",
    "up",
    "upon",
    "very",
    "what",
    "when",
    "where",
    "which",
    "while",
    "who",
    "whom",
    "whose",
    "why",
    "without",
    "within"
  ]);

  // src/features/mirror/analysis/extractRepetition.ts
  function isEligibleRepetitionToken(word) {
    if (word.length < MIRROR_MIN_TOKEN_LENGTH) return false;
    if (MIRROR_STOPWORDS.has(word)) return false;
    return true;
  }
  function extractRepetition(input) {
    const tokens = tokenizeText(input.text);
    const totalTokenCount = tokens.length;
    const counts = /* @__PURE__ */ new Map();
    let eligibleTokenCount = 0;
    for (const raw of tokens) {
      const w = raw.toLowerCase();
      if (!isEligibleRepetitionToken(w)) continue;
      eligibleTokenCount += 1;
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
    const distinctEligibleTokenCount = counts.size;
    const topRepeatedWords = [...counts.entries()].filter(([, c]) => c >= MIRROR_REPETITION_MIN_COUNT).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, MIRROR_REPETITION_TOP_N).map(([word, count]) => ({ word, count }));
    return {
      totalTokenCount,
      eligibleTokenCount,
      distinctEligibleTokenCount,
      topRepeatedWords
    };
  }

  // src/features/mirror/analysis/analyzeText.ts
  function analyzeText(input) {
    const repetition = extractRepetition(input);
    const cadence = extractCadence(input);
    const abstraction = extractAbstraction(input);
    const hesitation = extractHesitation(input);
    return {
      sessionId: resolveMirrorSessionId(input),
      wordCount: repetition.totalTokenCount,
      sentenceCount: cadence.sentenceCount,
      topRepeatedWords: [...repetition.topRepeatedWords],
      repetitionStats: {
        eligibleTokenCount: repetition.eligibleTokenCount,
        distinctEligibleTokenCount: repetition.distinctEligibleTokenCount
      },
      cadenceProfile: {
        avgSentenceLength: cadence.averageSentenceLengthWords,
        varianceSentenceLength: cadence.sentenceLengthVariance,
        shortSentenceCount: cadence.shortSentenceCount,
        longSentenceCount: cadence.longSentenceCount,
        endCompression: cadence.endCompression,
        endExpansion: cadence.endExpansion,
        meanSentenceLengthFirstQuarterWords: cadence.meanSentenceLengthFirstQuarterWords,
        meanSentenceLengthLastQuarterWords: cadence.meanSentenceLengthLastQuarterWords
      },
      abstractionProfile: {
        abstractCount: abstraction.abstractCount,
        concreteCount: abstraction.concreteCount,
        abstractConcreteRatio: abstraction.abstractConcreteRatio,
        shiftsTowardConcrete: abstraction.shiftsTowardConcrete,
        shiftsTowardAbstract: abstraction.shiftsTowardAbstract
      },
      hesitationProfile: {
        qualifierCount: hesitation.qualifierLexiconMatchCount,
        pivotCount: hesitation.pivotLexiconMatchCount,
        contradictionMarkers: hesitation.contradictionLexiconMatchCount,
        uncertaintyMarkers: hesitation.uncertaintyLexiconMatchCount
      }
    };
  }

  // src/features/mirror/constants/selectionThresholds.ts
  var MIRROR_SELECTION_MIN_RANK_SCORE_FOR_SUPPORT = 34;
  var MIRROR_SELECTION_RANK_SCORE_NEAR_DELTA = 5;
  var MIRROR_SELECTION_MAX_SUPPORTING = 4;

  // src/features/mirror/constants/generationThresholds.ts
  var MIRROR_LOW_SIGNAL_MAX_WORDS_EXCLUSIVE = 8;
  var MIRROR_LOW_SIGNAL_STRUCTURE_MIN_WORDS = 24;
  var MIRROR_GEN_MIN_WORDS_FOR_ANY = 32;
  var MIRROR_GEN_REPETITION_SHORT_OVERRIDE_MIN_WORDS = 20;
  var MIRROR_GEN_REPETITION_SHORT_OVERRIDE_MIN_SENTENCES = 3;
  var MIRROR_GEN_REPETITION_SHORT_OVERRIDE_MIN_SHARE = 0.11;
  var MIRROR_GEN_REPETITION_SHORT_OVERRIDE_NAMED_MIN_COUNT = 3;
  var MIRROR_GEN_HESITATION_SHORT_OVERRIDE_MIN_WORDS = 22;
  var MIRROR_GEN_HESITATION_SHORT_OVERRIDE_MIN_SENTENCES = 2;
  var MIRROR_GEN_HESITATION_SHORT_OVERRIDE_MIN_PHRASE_HITS = 2;
  var MIRROR_GEN_HESITATION_SHORT_OVERRIDE_MIN_TOTAL = 5;
  var MIRROR_GEN_HESITATION_SHORT_OVERRIDE_MIN_PER100 = 2;
  var MIRROR_GEN_HESITATION_PHRASE_AUGMENT_MAX_TOTAL_LEX = 3;
  var MIRROR_GEN_HESITATION_PHRASE_AUGMENT_MIN_PHRASE_HITS = 2;
  var MIRROR_GEN_CADENCE_FOUR_SENTENCE_MIN_VARIANCE = 32;
  var MIRROR_GEN_CONCRETE_SCENE_MIN_WORDS = 30;
  var MIRROR_GEN_CONCRETE_SCENE_MAX_WORDS = 42;
  var MIRROR_GEN_CONCRETE_SCENE_MIN_SENTENCES = 3;
  var MIRROR_GEN_CONCRETE_SCENE_MIN_LEX = 2;
  var MIRROR_GEN_CONCRETE_SCENE_MIN_PER_SENTENCE = 2;
  var MIRROR_GEN_REPETITION_TOP_MIN_COUNT = 4;
  var MIRROR_GEN_REPETITION_SHORT_WORD_MAX_LEN = 4;
  var MIRROR_GEN_REPETITION_SHORT_WORD_MIN_COUNT = 6;
  var MIRROR_GEN_REPETITION_DULL_WORDS = /* @__PURE__ */ new Set([
    "thing",
    "things",
    "stuff",
    /** Filler / discourse marker; avoid named-repetition wins on casual “like” stacks (EDGE-04). */
    "like",
    "something",
    "anything",
    "nothing",
    "way",
    "ways",
    "kind",
    "sort",
    "time",
    "life",
    "world",
    "people",
    "person",
    "moment",
    "day",
    "night",
    "hand",
    "back",
    "place",
    "room",
    "door"
  ]);
  var MIRROR_GEN_CADENCE_MIN_SENTENCES = 5;
  var MIRROR_GEN_OPENING_MIN_SENTENCES = 6;
  var MIRROR_GEN_OPENING_LONG_FIRST_Q = 14;
  var MIRROR_GEN_OPENING_MOMENT_RATIO = 1.18;
  var MIRROR_GEN_OPENING_MIN_VARIANCE_LOOSE = 24;
  var MIRROR_GEN_OPENING_LOOSE_RATIO = 1.08;
  var MIRROR_GEN_OPENING_LOOSE_FIRSTQ_MIN = 10;
  var MIRROR_GEN_OPENING_DIRECT_MAX_FIRST_Q = 10;
  var MIRROR_GEN_OPENING_DIRECT_LAST_RATIO = 1.05;
  var MIRROR_GEN_SHIFT_MIN_LEX = 4;
  var MIRROR_GEN_CADENCE_ALTERNATION_MIN_SHORT = 3;
  var MIRROR_GEN_CADENCE_ALTERNATION_MIN_LONG = 2;
  var MIRROR_GEN_CADENCE_ALTERNATION_MIN_VARIANCE = 20;
  var MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL = 4;
  var MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_WORDS = 26;
  var MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_ABSTRACT = 4;
  var MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_RATIO = 2.25;
  var MIRROR_GEN_ABSTRACTION_SHORTFORM_MAX_CONCRETE = 1;
  var MIRROR_GEN_ABSTRACTION_MIN_FOR_SHIFT = 6;
  var MIRROR_GEN_ABSTRACTION_MIN_SIDE_FOR_SHIFT = 5;
  var MIRROR_GEN_ABSTRACTION_BACK_HALF_WEAKSHIFT_MIN_LEX = 4;
  var MIRROR_GEN_ABSTRACTION_BACK_HALF_WEAKSHIFT_MIN_ABSTRACT = 2;
  var MIRROR_GEN_ABSTRACTION_BACK_HALF_WEAKSHIFT_MIN_RATIO = 0.85;
  var MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO = 1.35;
  var MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO = 1.35;
  var MIRROR_GEN_ABSTRACTION_SOFT_IDEA_LEAN_RATIO = 1.12;
  var MIRROR_GEN_HESITATION_MIN_TOTAL = 8;
  var MIRROR_GEN_HESITATION_MIN_HITS_PER_100_WORDS = 2;

  // src/features/mirror/constants/mirrorSessionHeadlines.ts
  function normMirrorReflectionHeadline(s) {
    return s.trim().toLowerCase().replace(/\s+/g, " ");
  }
  var MIRROR_HEADLINE_REPETITION_CONTAINS_MARKER = "returns several times on the page";
  var MIRROR_HEADLINE_FALLBACK_SOFT_SINGLE_SENTENCE_VARIANTS = [
    "It stays on one line the whole way through.",
    "One sentence carries the whole span here."
  ];
  var MIRROR_HEADLINE_FALLBACK_SOFT_MULTI_SENTENCE_VARIANTS = [
    "No single pattern reads clearly enough to name here yet.",
    "Nothing here grabs the mirror as one decisive habit yet.",
    "The piece doesn't narrow to one obvious angle yet."
  ];
  var MIRROR_HEADLINE_FALLBACK_SOFT_LEGACY_VARIANTS = [
    "The shape stays steady from start to finish.",
    "Line length stays even the whole way through.",
    "It holds a single, even line across the piece.",
    "Sentence length barely shifts from line to line."
  ];
  var MIRROR_HEADLINE_FALLBACK_SOFT_VARIANTS = [
    ...MIRROR_HEADLINE_FALLBACK_SOFT_SINGLE_SENTENCE_VARIANTS,
    ...MIRROR_HEADLINE_FALLBACK_SOFT_MULTI_SENTENCE_VARIANTS,
    ...MIRROR_HEADLINE_FALLBACK_SOFT_LEGACY_VARIANTS
  ];
  var MIRROR_HEADLINE_FALLBACK_SOFT = MIRROR_HEADLINE_FALLBACK_SOFT_SINGLE_SENTENCE_VARIANTS[0];
  function hashSessionSalt(sessionId, salt) {
    const s = `${sessionId}|${salt}`;
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i) >>> 0;
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }
  function pickMirrorFallbackSoftStatement(sessionId, sentenceCount) {
    const sc = typeof sentenceCount === "number" && Number.isFinite(sentenceCount) ? sentenceCount : 2;
    if (sc <= 1) {
      const pool2 = MIRROR_HEADLINE_FALLBACK_SOFT_SINGLE_SENTENCE_VARIANTS;
      const idx2 = hashSessionSalt(sessionId, "mirrorFallbackSoft|single") % pool2.length;
      return pool2[idx2];
    }
    const pool = MIRROR_HEADLINE_FALLBACK_SOFT_MULTI_SENTENCE_VARIANTS;
    const idx = hashSessionSalt(sessionId, "mirrorFallbackSoft|multi") % pool.length;
    return pool[idx];
  }
  var FALLBACK_SOFT_NORM_SET = new Set(
    MIRROR_HEADLINE_FALLBACK_SOFT_VARIANTS.map((line) => normMirrorReflectionHeadline(line))
  );
  function isMirrorFallbackSoftStatement(statement) {
    return FALLBACK_SOFT_NORM_SET.has(normMirrorReflectionHeadline(statement));
  }
  var MIRROR_HEADLINE_LOW_SIGNAL = "Not enough here to notice a pattern yet.";
  function mirrorHeadlineRepetitionNamed(word) {
    return `\u201C${word}\u201D ${MIRROR_HEADLINE_REPETITION_CONTAINS_MARKER}.`;
  }
  var MIRROR_HEADLINE_CADENCE_ENDING_TIGHTENS = "The ending tightens noticeably.";
  var MIRROR_HEADLINE_CADENCE_LINES_LENGTHEN = "Lines lengthen near the end.";
  var MIRROR_HEADLINE_CADENCE_ALTERNATION = "Short and long lines trade places.";
  var MIRROR_HEADLINE_OPENING_DIRECT = "It opens directly.";
  var MIRROR_HEADLINE_OPENING_MOMENT = "The opening takes a moment before anything lands.";
  var MIRROR_HEADLINE_OPENING_LOOSE = "It starts loose before settling.";
  var MIRROR_HEADLINE_SHIFT_TURNS = "It turns partway through.";
  var MIRROR_HEADLINE_SHIFT_HOLDS = "The direction shifts once, then holds.";
  var MIRROR_HEADLINE_SHIFT_LEANS_ANOTHER = "It starts one way, then leans another.";
  var MIRROR_HEADLINE_ABSTRACTION_BALANCE_VARIANTS = [
    "Ideas and concrete detail stay in balance.",
    "Abstract language and concrete detail hold about the same weight."
  ];
  var MIRROR_HEADLINE_ABSTRACTION_BALANCE = MIRROR_HEADLINE_ABSTRACTION_BALANCE_VARIANTS[0];
  function pickMirrorAbstractionBalanceStatement(sessionId) {
    const idx = hashSessionSalt(sessionId, "abstractionBalance") % MIRROR_HEADLINE_ABSTRACTION_BALANCE_VARIANTS.length;
    return MIRROR_HEADLINE_ABSTRACTION_BALANCE_VARIANTS[idx];
  }
  var ABSTRACTION_BALANCE_NORM_SET = new Set(
    MIRROR_HEADLINE_ABSTRACTION_BALANCE_VARIANTS.map((line) => normMirrorReflectionHeadline(line))
  );
  function isMirrorAbstractionBalanceStatement(statement) {
    return ABSTRACTION_BALANCE_NORM_SET.has(normMirrorReflectionHeadline(statement));
  }
  var MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT_VARIANTS = [
    "Both idea-words and image-words appear frequently.",
    "Idea language and image language both show up often."
  ];
  var MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT = MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT_VARIANTS[0];
  function pickMirrorAbstractionBothFrequentStatement(sessionId) {
    const idx = hashSessionSalt(sessionId, "abstractionBothFrequent") % MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT_VARIANTS.length;
    return MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT_VARIANTS[idx];
  }
  var ABSTRACTION_BOTH_FREQUENT_NORM_SET = new Set(
    MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT_VARIANTS.map((line) => normMirrorReflectionHeadline(line))
  );
  function isMirrorAbstractionBothFrequentStatement(statement) {
    return ABSTRACTION_BOTH_FREQUENT_NORM_SET.has(normMirrorReflectionHeadline(statement));
  }
  var MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL = "The back half leans more conceptual than scene-based.";
  var MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER = "Concrete detail carries more of the later passages.";
  var MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE = "It leans more on ideas than on what can be seen.";
  var MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS = "Concrete detail carries more than the ideas here.";
  var MIRROR_HEADLINE_HESITATION_QUALIFIED_AFTER_VARIANTS = [
    "A statement appears, then softens right after.",
    "Something is stated, then almost immediately hedged.",
    "The sentence makes its move, then tempers the landing."
  ];
  var MIRROR_HEADLINE_HESITATION_QUALIFIED_AFTER = MIRROR_HEADLINE_HESITATION_QUALIFIED_AFTER_VARIANTS[0];
  function pickMirrorHesitationQualifiedAfterStatement(sessionId, fingerprint = "") {
    const pool = MIRROR_HEADLINE_HESITATION_QUALIFIED_AFTER_VARIANTS;
    const key = fingerprint ? `${sessionId}|${fingerprint}` : sessionId;
    const idx = hashSessionSalt(key, "hesitationQualifiedAfter") % pool.length;
    return pool[idx];
  }
  var HESITATION_QUALIFIED_AFTER_NORM_SET = new Set(
    MIRROR_HEADLINE_HESITATION_QUALIFIED_AFTER_VARIANTS.map((line) => normMirrorReflectionHeadline(line))
  );
  function isMirrorHesitationQualifiedAfterStatement(statement) {
    return HESITATION_QUALIFIED_AFTER_NORM_SET.has(normMirrorReflectionHeadline(statement));
  }
  var MIRROR_HEADLINE_HESITATION_ASSERTIONS_SOFTENING = "Assertions are often followed by softening.";
  var MIRROR_HEADLINE_HESITATION_REVISED_VARIANTS = [
    "Statements are often revised or softened.",
    "What lands on the page keeps revising its own emphasis.",
    "The voice circles back to adjust what it just said."
  ];
  var MIRROR_HEADLINE_HESITATION_REVISED = MIRROR_HEADLINE_HESITATION_REVISED_VARIANTS[0];
  function pickMirrorHesitationRevisedGeneralStatement(sessionId, fingerprint = "") {
    const pool = MIRROR_HEADLINE_HESITATION_REVISED_VARIANTS;
    const key = fingerprint ? `${sessionId}|${fingerprint}` : sessionId;
    const idx = hashSessionSalt(key, "hesitationRevisedGeneral") % pool.length;
    return pool[idx];
  }
  var HESITATION_REVISED_FAMILY_NORM_SET = new Set(
    MIRROR_HEADLINE_HESITATION_REVISED_VARIANTS.map((line) => normMirrorReflectionHeadline(line))
  );
  function isMirrorHesitationRevisedFamilyStatement(statement) {
    return HESITATION_REVISED_FAMILY_NORM_SET.has(normMirrorReflectionHeadline(statement));
  }
  function isMirrorHesitationStandardNudgeStatement(statement) {
    const n = normMirrorReflectionHeadline(statement);
    return HESITATION_QUALIFIED_AFTER_NORM_SET.has(n) || HESITATION_REVISED_FAMILY_NORM_SET.has(n) || n === normMirrorReflectionHeadline(MIRROR_HEADLINE_HESITATION_ASSERTIONS_SOFTENING);
  }
  var MIRROR_HEADLINE_GENERIC_FALLBACK_SET_MEMBERS = [
    ...MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT_VARIANTS,
    ...MIRROR_HEADLINE_ABSTRACTION_BALANCE_VARIANTS,
    ...MIRROR_HEADLINE_HESITATION_REVISED_VARIANTS
  ];

  // src/features/mirror/generation/buildReflectionCandidates.ts
  var CONCRETE_LEX_SET = new Set(MIRROR_CONCRETE_WORDS.map((w) => w.toLowerCase()));
  function candidate(category, sessionId, statement, evidence, rankScore, supportsPrimary = false) {
    const base = {
      id: `${category}:${sessionId}`,
      category,
      statement,
      evidence,
      rankScore
    };
    if (supportsPrimary) base.supportsPrimary = true;
    return base;
  }
  function abstractionCandidate(sessionId, statement, rankScore, supportsPrimary = false) {
    return candidate(
      "abstraction_concrete",
      sessionId,
      statement,
      [],
      Math.max(rankScore, 38),
      supportsPrimary
    );
  }
  function repetitionWordIsLowSignal(word) {
    const w = word.toLowerCase();
    if (MIRROR_GEN_REPETITION_DULL_WORDS.has(w)) return true;
    if (w.length <= MIRROR_GEN_REPETITION_SHORT_WORD_MAX_LEN) return true;
    return false;
  }
  function repetitionMeetsCountGate(word, count) {
    if (repetitionWordIsLowSignal(word)) return count >= MIRROR_GEN_REPETITION_SHORT_WORD_MIN_COUNT;
    return count >= MIRROR_GEN_REPETITION_TOP_MIN_COUNT;
  }
  function repetitionShortTextOverrideEligible(features) {
    if (features.wordCount >= MIRROR_GEN_MIN_WORDS_FOR_ANY) return false;
    if (features.wordCount < MIRROR_GEN_REPETITION_SHORT_OVERRIDE_MIN_WORDS) return false;
    if (features.sentenceCount < MIRROR_GEN_REPETITION_SHORT_OVERRIDE_MIN_SENTENCES) return false;
    return true;
  }
  function repetitionShortBeatPageStrong(list, wordCount) {
    const floor = MIRROR_GEN_REPETITION_SHORT_OVERRIDE_MIN_SHARE;
    const eligibleShort = list.filter((e) => {
      const w = e.word.toLowerCase();
      if (MIRROR_GEN_REPETITION_DULL_WORDS.has(w)) return false;
      if (e.word.length > MIRROR_GEN_REPETITION_SHORT_WORD_MAX_LEN) return false;
      if (e.count < MIRROR_GEN_REPETITION_SHORT_OVERRIDE_NAMED_MIN_COUNT) return false;
      return e.count / Math.max(wordCount, 1) >= floor;
    });
    if (eligibleShort.length >= 2) return true;
    if (eligibleShort.some((h) => h.count >= MIRROR_GEN_REPETITION_TOP_MIN_COUNT)) return true;
    return false;
  }
  function repetitionLemmaEligibleForNamedHeadline(word, count, features, shortOverride, list) {
    const w = word.toLowerCase();
    if (MIRROR_GEN_REPETITION_DULL_WORDS.has(w)) return false;
    if (shortOverride && repetitionShortBeatPageStrong(list, features.wordCount) && word.length <= MIRROR_GEN_REPETITION_SHORT_WORD_MAX_LEN && count >= MIRROR_GEN_REPETITION_SHORT_OVERRIDE_NAMED_MIN_COUNT && count / Math.max(features.wordCount, 1) >= MIRROR_GEN_REPETITION_SHORT_OVERRIDE_MIN_SHARE) {
      return true;
    }
    return repetitionMeetsCountGate(word, count) && !repetitionWordIsLowSignal(word);
  }
  function maxConcreteLexHitsInOneSentence(normalizedText) {
    let maxH = 0;
    for (const sent of splitSentences(normalizedText)) {
      let h = 0;
      for (const raw of tokenizeText(sent)) {
        if (CONCRETE_LEX_SET.has(raw.toLowerCase())) h += 1;
      }
      maxH = Math.max(maxH, h);
    }
    return maxH;
  }
  function hesitationPhraseSoftHitCount(normalizedText) {
    const t = normalizedText.toLowerCase();
    const patterns = [
      /\bi think\b/g,
      /\bi guess\b/g,
      /\bi suppose\b/g,
      /\bmore or less\b/g,
      /\bnot exactly\b/g,
      /\b(?:or\s+)?at least\b/g,
      /\bwhich is maybe\b/g,
      /\bwondering whether\b/g,
      /\bmore than i expected\b/g,
      // REAL-02-style evaluative softening; phrase augment still requires sparse lex + min phrase hits.
      /\bseems to\b/g,
      /\bmore than it should\b/g
    ];
    let n = 0;
    for (const re of patterns) {
      const m = t.match(re);
      if (m) n += m.length;
    }
    return n;
  }
  function pickVariantIndex(sessionId, salt) {
    const s = `${sessionId}|${salt}`;
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i) >>> 0;
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }
  function cadenceStrongAlternation(features) {
    const c = features.cadenceProfile;
    return features.sentenceCount >= MIRROR_GEN_CADENCE_MIN_SENTENCES && c.shortSentenceCount >= MIRROR_GEN_CADENCE_ALTERNATION_MIN_SHORT && c.longSentenceCount >= MIRROR_GEN_CADENCE_ALTERNATION_MIN_LONG && c.varianceSentenceLength >= MIRROR_GEN_CADENCE_ALTERNATION_MIN_VARIANCE;
  }
  function tryRepetition(features) {
    const shortOverride = repetitionShortTextOverrideEligible(features);
    if (features.wordCount < MIRROR_GEN_MIN_WORDS_FOR_ANY && !shortOverride) return null;
    const list = features.topRepeatedWords;
    const picked = list.find(
      (e) => repetitionLemmaEligibleForNamedHeadline(e.word, e.count, features, shortOverride, list)
    );
    if (!picked) return null;
    if (shortOverride) {
      const share = picked.count / Math.max(features.wordCount, 1);
      if (share < MIRROR_GEN_REPETITION_SHORT_OVERRIDE_MIN_SHARE) return null;
      const minNamedHits = repetitionWordIsLowSignal(picked.word) ? MIRROR_GEN_REPETITION_SHORT_OVERRIDE_NAMED_MIN_COUNT : MIRROR_GEN_REPETITION_TOP_MIN_COUNT;
      if (picked.count < minNamedHits) return null;
    }
    const statement = mirrorHeadlineRepetitionNamed(picked.word);
    const multiNamed = list.filter(
      (e) => repetitionLemmaEligibleForNamedHeadline(e.word, e.count, features, shortOverride, list)
    ).length;
    const rankScore = Math.min(100, picked.count * 14 + (multiNamed > 1 ? 5 : 0));
    return candidate("repetition", features.sessionId, statement, [], rankScore);
  }
  function tryCadence(features) {
    const c = features.cadenceProfile;
    if (features.wordCount < MIRROR_GEN_MIN_WORDS_FOR_ANY) return null;
    const fourSentenceEndShape = features.sentenceCount === 4 && c.varianceSentenceLength >= MIRROR_GEN_CADENCE_FOUR_SENTENCE_MIN_VARIANCE;
    if (features.sentenceCount < MIRROR_GEN_CADENCE_MIN_SENTENCES) {
      if (!fourSentenceEndShape) return null;
    }
    const firstQ = c.meanSentenceLengthFirstQuarterWords;
    const lastQ = c.meanSentenceLengthLastQuarterWords;
    const quarterRatio = firstQ != null && lastQ != null && firstQ > 0 ? lastQ / firstQ : null;
    if (c.endCompression && quarterRatio != null && firstQ != null && lastQ != null) {
      const statement = MIRROR_HEADLINE_CADENCE_ENDING_TIGHTENS;
      let rankScore = 54 + Math.min(18, c.varianceSentenceLength * 0.55);
      if (fourSentenceEndShape) rankScore -= 4;
      return candidate("cadence", features.sessionId, statement, [], rankScore);
    }
    if (c.endExpansion && quarterRatio != null && firstQ != null && lastQ != null) {
      const statement = MIRROR_HEADLINE_CADENCE_LINES_LENGTHEN;
      let rankScore = 54 + Math.min(18, c.varianceSentenceLength * 0.55);
      if (fourSentenceEndShape) rankScore -= 4;
      return candidate("cadence", features.sessionId, statement, [], rankScore);
    }
    if (cadenceStrongAlternation(features)) {
      const statement = MIRROR_HEADLINE_CADENCE_ALTERNATION;
      const rankScore = 44 + Math.min(16, c.shortSentenceCount + c.longSentenceCount);
      return candidate("cadence", features.sessionId, statement, [], rankScore);
    }
    return null;
  }
  function tryOpening(features) {
    if (features.wordCount < MIRROR_GEN_MIN_WORDS_FOR_ANY) return null;
    if (features.sentenceCount < MIRROR_GEN_OPENING_MIN_SENTENCES) return null;
    const c = features.cadenceProfile;
    const firstQ = c.meanSentenceLengthFirstQuarterWords;
    const lastQ = c.meanSentenceLengthLastQuarterWords;
    if (firstQ == null || lastQ == null || firstQ <= 0) return null;
    if (c.endCompression || c.endExpansion) return null;
    if (cadenceStrongAlternation(features)) return null;
    const eligible = [];
    if (firstQ >= MIRROR_GEN_OPENING_LONG_FIRST_Q && firstQ >= lastQ * MIRROR_GEN_OPENING_MOMENT_RATIO) {
      eligible.push({ key: "moment", statement: MIRROR_HEADLINE_OPENING_MOMENT });
    }
    if (c.varianceSentenceLength >= MIRROR_GEN_OPENING_MIN_VARIANCE_LOOSE && firstQ > lastQ * MIRROR_GEN_OPENING_LOOSE_RATIO && firstQ > MIRROR_GEN_OPENING_LOOSE_FIRSTQ_MIN) {
      eligible.push({ key: "loose", statement: MIRROR_HEADLINE_OPENING_LOOSE });
    }
    if (firstQ <= MIRROR_GEN_OPENING_DIRECT_MAX_FIRST_Q && firstQ <= lastQ * MIRROR_GEN_OPENING_DIRECT_LAST_RATIO) {
      eligible.push({ key: "direct", statement: MIRROR_HEADLINE_OPENING_DIRECT });
    }
    if (!eligible.length) return null;
    const order = ["moment", "loose", "direct"];
    const ordered = order.map((k) => eligible.find((e) => e.key === k)).filter((e) => Boolean(e));
    const pick = ordered[pickVariantIndex(features.sessionId, "opening") % ordered.length];
    const rankScore = 46 + Math.min(10, (firstQ + lastQ) * 0.8);
    return candidate("opening", features.sessionId, pick.statement, [], rankScore);
  }
  function tryShift(features) {
    const a = features.abstractionProfile;
    if (features.wordCount < MIRROR_GEN_MIN_WORDS_FOR_ANY) return null;
    const soleHalfShift = a.shiftsTowardAbstract !== a.shiftsTowardConcrete;
    if (!soleHalfShift) return null;
    const lex = a.abstractCount + a.concreteCount;
    if (lex < MIRROR_GEN_SHIFT_MIN_LEX) return null;
    const strongAbstractMove = a.shiftsTowardAbstract && lex >= MIRROR_GEN_ABSTRACTION_MIN_FOR_SHIFT && a.abstractCount >= MIRROR_GEN_ABSTRACTION_MIN_SIDE_FOR_SHIFT;
    const strongConcreteMove = a.shiftsTowardConcrete && lex >= MIRROR_GEN_ABSTRACTION_MIN_FOR_SHIFT && a.concreteCount >= MIRROR_GEN_ABSTRACTION_MIN_SIDE_FOR_SHIFT;
    if (strongAbstractMove || strongConcreteMove) return null;
    const statements = [
      MIRROR_HEADLINE_SHIFT_TURNS,
      MIRROR_HEADLINE_SHIFT_HOLDS,
      MIRROR_HEADLINE_SHIFT_LEANS_ANOTHER
    ];
    const statement = statements[pickVariantIndex(features.sessionId, "shift") % statements.length];
    const rankScore = 44 + Math.min(12, lex * 1.2);
    return candidate("shift", features.sessionId, statement, [], rankScore);
  }
  function tryAbstraction(features, sourceNorm) {
    const a = features.abstractionProfile;
    const lex = a.abstractCount + a.concreteCount;
    const shortFormAbstractionEligible = features.wordCount >= MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_WORDS && a.abstractCount >= MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_ABSTRACT && a.abstractConcreteRatio >= MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_RATIO && a.concreteCount <= MIRROR_GEN_ABSTRACTION_SHORTFORM_MAX_CONCRETE;
    const concreteSceneBandEligible = Boolean(sourceNorm) && features.wordCount >= MIRROR_GEN_CONCRETE_SCENE_MIN_WORDS && features.wordCount <= MIRROR_GEN_CONCRETE_SCENE_MAX_WORDS && features.sentenceCount >= MIRROR_GEN_CONCRETE_SCENE_MIN_SENTENCES;
    if (features.wordCount < MIRROR_GEN_MIN_WORDS_FOR_ANY && !shortFormAbstractionEligible && !concreteSceneBandEligible) {
      return null;
    }
    if (a.shiftsTowardAbstract && a.shiftsTowardConcrete) {
      if (lex < MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL) return null;
      const statement = pickMirrorAbstractionBalanceStatement(features.sessionId);
      const rankScore = 40 + Math.min(22, lex * 1.6);
      return abstractionCandidate(features.sessionId, statement, rankScore);
    }
    if (a.shiftsTowardAbstract && lex >= MIRROR_GEN_ABSTRACTION_MIN_FOR_SHIFT && a.abstractCount >= MIRROR_GEN_ABSTRACTION_MIN_SIDE_FOR_SHIFT) {
      const statement = MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL;
      const rankScore = 80 + Math.min(20, a.abstractCount * 2.4);
      return abstractionCandidate(features.sessionId, statement, rankScore);
    }
    if (a.shiftsTowardAbstract && !a.shiftsTowardConcrete && lex >= MIRROR_GEN_ABSTRACTION_BACK_HALF_WEAKSHIFT_MIN_LEX && a.abstractCount >= MIRROR_GEN_ABSTRACTION_BACK_HALF_WEAKSHIFT_MIN_ABSTRACT && a.abstractCount < MIRROR_GEN_ABSTRACTION_MIN_SIDE_FOR_SHIFT && a.abstractConcreteRatio >= MIRROR_GEN_ABSTRACTION_BACK_HALF_WEAKSHIFT_MIN_RATIO) {
      const statement = MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL;
      const rankScore = 74 + Math.min(14, lex * 2.2);
      return abstractionCandidate(features.sessionId, statement, rankScore);
    }
    if (a.shiftsTowardConcrete && lex >= MIRROR_GEN_ABSTRACTION_MIN_FOR_SHIFT && a.concreteCount >= MIRROR_GEN_ABSTRACTION_MIN_SIDE_FOR_SHIFT) {
      const statement = MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER;
      const rankScore = 80 + Math.min(20, a.concreteCount * 2.4);
      return abstractionCandidate(features.sessionId, statement, rankScore);
    }
    if (lex >= MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL) {
      const ratioOkIdeas = a.abstractConcreteRatio >= MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO && a.abstractCount >= 2;
      const ratioOkIdeasSoft = !ratioOkIdeas && a.abstractCount >= 3 && a.abstractConcreteRatio >= MIRROR_GEN_ABSTRACTION_SOFT_IDEA_LEAN_RATIO;
      const ratioOkConcrete = a.concreteCount >= MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO * Math.max(a.abstractCount, 1) && a.concreteCount >= 2;
      if (ratioOkIdeas && !ratioOkConcrete) {
        const statement2 = MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE;
        const rankScore2 = 68 + Math.min(16, lex * 1.8);
        return abstractionCandidate(features.sessionId, statement2, rankScore2);
      }
      if (ratioOkIdeasSoft && !ratioOkConcrete) {
        const statement2 = MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE;
        const rankScore2 = 64 + Math.min(14, lex * 1.8);
        return abstractionCandidate(features.sessionId, statement2, rankScore2);
      }
      if (ratioOkConcrete && !ratioOkIdeas) {
        const statement2 = MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS;
        const rankScore2 = 68 + Math.min(16, lex * 1.8);
        return abstractionCandidate(features.sessionId, statement2, rankScore2);
      }
      const statement = pickMirrorAbstractionBothFrequentStatement(features.sessionId);
      const rankScore = 34 + Math.min(14, lex * 1.5);
      return abstractionCandidate(features.sessionId, statement, rankScore);
    }
    if (sourceNorm && concreteSceneBandEligible && a.abstractCount === 0 && a.concreteCount >= MIRROR_GEN_CONCRETE_SCENE_MIN_LEX && lex >= MIRROR_GEN_CONCRETE_SCENE_MIN_LEX && lex < MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL && !(a.shiftsTowardAbstract && a.shiftsTowardConcrete) && maxConcreteLexHitsInOneSentence(sourceNorm) >= MIRROR_GEN_CONCRETE_SCENE_MIN_PER_SENTENCE) {
      const statement = MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS;
      const rankScore = 56 + Math.min(12, lex * 3);
      return abstractionCandidate(features.sessionId, statement, rankScore);
    }
    return null;
  }
  function tryHesitation(features, sourceNorm) {
    const h = features.hesitationProfile;
    const phraseHits = sourceNorm ? hesitationPhraseSoftHitCount(sourceNorm) : 0;
    const shortOverride = features.wordCount < MIRROR_GEN_MIN_WORDS_FOR_ANY && features.wordCount >= MIRROR_GEN_HESITATION_SHORT_OVERRIDE_MIN_WORDS && features.sentenceCount >= MIRROR_GEN_HESITATION_SHORT_OVERRIDE_MIN_SENTENCES && Boolean(sourceNorm) && phraseHits >= MIRROR_GEN_HESITATION_SHORT_OVERRIDE_MIN_PHRASE_HITS;
    if (features.wordCount < MIRROR_GEN_MIN_WORDS_FOR_ANY && !shortOverride) return null;
    const totalLex = h.qualifierCount + h.pivotCount + h.contradictionMarkers + h.uncertaintyMarkers;
    const softLex = h.qualifierCount + h.uncertaintyMarkers;
    const turnLex = h.pivotCount + h.contradictionMarkers;
    const phraseAugmentLong = !shortOverride && features.wordCount >= MIRROR_GEN_MIN_WORDS_FOR_ANY && Boolean(sourceNorm) && totalLex <= MIRROR_GEN_HESITATION_PHRASE_AUGMENT_MAX_TOTAL_LEX && phraseHits >= MIRROR_GEN_HESITATION_PHRASE_AUGMENT_MIN_PHRASE_HITS;
    const phraseAugment = shortOverride || phraseAugmentLong;
    const soft = phraseAugment ? softLex + phraseHits : softLex;
    const turn = turnLex;
    const total = phraseAugment ? totalLex + phraseHits : totalLex;
    const per100 = total / Math.max(features.wordCount, 1) * 100;
    const softFloorNoTurn = shortOverride ? 3 : phraseAugmentLong ? 3 : 4;
    if (turn === 0) {
      if (soft < softFloorNoTurn) return null;
    } else {
      if (soft < 2 && (total < 10 || turn < 4)) return null;
      if (soft < 3 && turn > soft && total < 8) return null;
    }
    const minTotal = shortOverride ? MIRROR_GEN_HESITATION_SHORT_OVERRIDE_MIN_TOTAL : MIRROR_GEN_HESITATION_MIN_TOTAL;
    const minPer100 = shortOverride ? MIRROR_GEN_HESITATION_SHORT_OVERRIDE_MIN_PER100 : MIRROR_GEN_HESITATION_MIN_HITS_PER_100_WORDS;
    if (total < minTotal && per100 < minPer100) {
      return null;
    }
    const qualifiedAfter = soft >= turn && (h.qualifierCount >= 2 || phraseAugment && phraseHits >= 1 && h.qualifierCount >= 1 || phraseAugmentLong && phraseHits >= 2 && turn >= 1 && soft >= 2);
    const headlineFingerprint = `${turn}|${phraseHits}|${h.qualifierCount}|${softLex}|${totalLex}`;
    let statement;
    if (qualifiedAfter) {
      statement = pickMirrorHesitationQualifiedAfterStatement(features.sessionId, headlineFingerprint);
    } else if (turn >= soft && turn >= 2 && soft >= 2) {
      statement = MIRROR_HEADLINE_HESITATION_ASSERTIONS_SOFTENING;
    } else {
      statement = pickMirrorHesitationRevisedGeneralStatement(features.sessionId, headlineFingerprint);
    }
    let rankScore = Math.min(54, 24 + total * 2.2 + per100 * 0.7);
    if (soft < 3 && turn >= 2 && !phraseAugmentLong) rankScore -= 10;
    if (shortOverride) rankScore = Math.min(54, rankScore + 4);
    if (phraseAugmentLong) rankScore = Math.min(54, rankScore + 6);
    const eligibleAsSupporting = rankScore >= MIRROR_SELECTION_MIN_RANK_SCORE_FOR_SUPPORT;
    return candidate(
      "hesitation_qualification",
      features.sessionId,
      statement,
      [],
      rankScore,
      eligibleAsSupporting
    );
  }
  function buildReflectionCandidates(features, _sourceText) {
    const out = [];
    const rep = tryRepetition(features);
    if (rep) out.push(rep);
    const abs = tryAbstraction(features, _sourceText);
    if (abs) out.push(abs);
    const cad = tryCadence(features);
    if (cad) out.push(cad);
    const opn = tryOpening(features);
    if (opn) out.push(opn);
    const shf = tryShift(features);
    if (shf) out.push(shf);
    const hes = tryHesitation(features, _sourceText);
    if (hes) out.push(hes);
    return out;
  }

  // src/features/mirror/ranking/statementSpecificity.ts
  var GENERIC_FALLBACK_STATEMENTS = new Set(
    MIRROR_HEADLINE_GENERIC_FALLBACK_SET_MEMBERS.map((h) => normMirrorReflectionHeadline(h))
  );
  function norm(s) {
    return normMirrorReflectionHeadline(s);
  }
  function mirrorStatementSpecificity(statement) {
    const n = norm(statement);
    if (isMirrorFallbackSoftStatement(statement)) return 5;
    if (n === norm(MIRROR_HEADLINE_LOW_SIGNAL)) return 6;
    if (GENERIC_FALLBACK_STATEMENTS.has(n)) return 20;
    if (n.includes(MIRROR_HEADLINE_REPETITION_CONTAINS_MARKER)) return 100;
    if (n === norm(MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL) || n === norm(MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER)) {
      return 110;
    }
    if (n === norm(MIRROR_HEADLINE_CADENCE_ENDING_TIGHTENS) || n === norm(MIRROR_HEADLINE_CADENCE_LINES_LENGTHEN)) {
      return 90;
    }
    if (n === norm(MIRROR_HEADLINE_CADENCE_ALTERNATION)) return 84;
    if (n === norm(MIRROR_HEADLINE_OPENING_DIRECT) || n === norm(MIRROR_HEADLINE_OPENING_MOMENT) || n === norm(MIRROR_HEADLINE_OPENING_LOOSE)) {
      return 86;
    }
    if (n === norm(MIRROR_HEADLINE_SHIFT_TURNS) || n === norm(MIRROR_HEADLINE_SHIFT_HOLDS) || n === norm(MIRROR_HEADLINE_SHIFT_LEANS_ANOTHER)) {
      return 86;
    }
    if (n === norm(MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE) || n === norm(MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS)) {
      return 82;
    }
    if (isMirrorHesitationQualifiedAfterStatement(statement)) return 58;
    if (n === norm(MIRROR_HEADLINE_HESITATION_ASSERTIONS_SOFTENING)) return 56;
    if (isMirrorHesitationRevisedFamilyStatement(statement)) return 40;
    return 40;
  }

  // src/features/mirror/ranking/rankReflections.ts
  function norm2(s) {
    return normMirrorReflectionHeadline(s);
  }
  function rankingWeight(candidate2) {
    const s = norm2(candidate2.statement);
    if (candidate2.category === "fallback" || candidate2.category === "low_signal" || isMirrorFallbackSoftStatement(candidate2.statement)) {
      return -58;
    }
    if (isMirrorAbstractionBalanceStatement(candidate2.statement) || isMirrorAbstractionBothFrequentStatement(candidate2.statement)) {
      return -38;
    }
    if (s === norm2(MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL) || s === norm2(MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER) || s === norm2(MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE) || s === norm2(MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS)) {
      return 34;
    }
    if (s.includes(MIRROR_HEADLINE_REPETITION_CONTAINS_MARKER)) {
      return 30;
    }
    if (s === norm2(MIRROR_HEADLINE_CADENCE_ENDING_TIGHTENS) || s === norm2(MIRROR_HEADLINE_CADENCE_LINES_LENGTHEN) || s === norm2(MIRROR_HEADLINE_CADENCE_ALTERNATION) || s === norm2(MIRROR_HEADLINE_OPENING_DIRECT) || s === norm2(MIRROR_HEADLINE_OPENING_MOMENT) || s === norm2(MIRROR_HEADLINE_OPENING_LOOSE) || s === norm2(MIRROR_HEADLINE_SHIFT_TURNS) || s === norm2(MIRROR_HEADLINE_SHIFT_HOLDS) || s === norm2(MIRROR_HEADLINE_SHIFT_LEANS_ANOTHER)) {
      return 18;
    }
    if (isMirrorHesitationQualifiedAfterStatement(candidate2.statement) || s === norm2(MIRROR_HEADLINE_HESITATION_ASSERTIONS_SOFTENING) || isMirrorHesitationRevisedFamilyStatement(candidate2.statement)) {
      return 10;
    }
    return 0;
  }
  function categoryTiePreference(category) {
    if (category === "abstraction_concrete") return 4;
    if (category === "repetition") return 3;
    if (category === "cadence" || category === "opening" || category === "shift") return 2;
    if (category === "hesitation_qualification") return 1;
    if (category === "fallback" || category === "low_signal") return 0;
    return 1;
  }
  function compareRanked(a, b) {
    const weightedA = a.rankScore + rankingWeight(a) + mirrorStatementSpecificity(a.statement) * 0.06;
    const weightedB = b.rankScore + rankingWeight(b) + mirrorStatementSpecificity(b.statement) * 0.06;
    const d = weightedB - weightedA;
    if (Math.abs(d) <= MIRROR_SELECTION_RANK_SCORE_NEAR_DELTA) {
      const sp = mirrorStatementSpecificity(b.statement) - mirrorStatementSpecificity(a.statement);
      if (sp !== 0) return sp;
      const pref = categoryTiePreference(b.category) - categoryTiePreference(a.category);
      if (pref !== 0) return pref;
    } else if (d !== 0) {
      return d;
    }
    return 0;
  }
  function rankReflections(candidates) {
    return [...candidates].map((c, inputIndex) => ({ c, inputIndex })).sort((a, b) => {
      const cmp = compareRanked(a.c, b.c);
      if (cmp !== 0) return cmp;
      return a.inputIndex - b.inputIndex;
    }).map(({ c }) => c);
  }

  // src/features/mirror/ranking/dedupeReflections.ts
  function dedupeReflections(candidates) {
    const byCategory = /* @__PURE__ */ new Map();
    for (const c of candidates) {
      const prev = byCategory.get(c.category);
      if (!prev || compareRanked(c, prev) < 0) byCategory.set(c.category, c);
    }
    const byStatement = /* @__PURE__ */ new Map();
    for (const c of byCategory.values()) {
      const key = c.statement.trim().toLowerCase().replace(/\s+/g, " ");
      const prev = byStatement.get(key);
      if (!prev || compareRanked(c, prev) < 0) byStatement.set(key, c);
    }
    return rankReflections([...byStatement.values()]);
  }

  // src/features/mirror/ranking/reflectionFamilyKey.ts
  function norm3(s) {
    return normMirrorReflectionHeadline(s);
  }
  var NORM_TO_FAMILY = {
    [norm3(MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL)]: "abstraction:back_half_conceptual",
    [norm3(MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER)]: "abstraction:concrete_later",
    [norm3(MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE)]: "abstraction:ideas_dominate",
    [norm3(MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS)]: "abstraction:concrete_outweighs",
    [norm3(MIRROR_HEADLINE_CADENCE_ENDING_TIGHTENS)]: "cadence:ending_tightens",
    [norm3(MIRROR_HEADLINE_CADENCE_LINES_LENGTHEN)]: "cadence:lines_lengthen",
    [norm3(MIRROR_HEADLINE_CADENCE_ALTERNATION)]: "cadence:alternation",
    [norm3(MIRROR_HEADLINE_OPENING_DIRECT)]: "opening:direct",
    [norm3(MIRROR_HEADLINE_OPENING_MOMENT)]: "opening:moment",
    [norm3(MIRROR_HEADLINE_OPENING_LOOSE)]: "opening:loose",
    [norm3(MIRROR_HEADLINE_SHIFT_TURNS)]: "shift:turns",
    [norm3(MIRROR_HEADLINE_SHIFT_HOLDS)]: "shift:holds",
    [norm3(MIRROR_HEADLINE_SHIFT_LEANS_ANOTHER)]: "shift:leans_another",
    [norm3(MIRROR_HEADLINE_HESITATION_ASSERTIONS_SOFTENING)]: "hesitation:assertions_softening"
  };
  for (const line of MIRROR_HEADLINE_HESITATION_QUALIFIED_AFTER_VARIANTS) {
    NORM_TO_FAMILY[norm3(line)] = "hesitation:qualified_after";
  }
  for (const line of MIRROR_HEADLINE_HESITATION_REVISED_VARIANTS) {
    NORM_TO_FAMILY[norm3(line)] = "hesitation:revised";
  }
  for (const line of MIRROR_HEADLINE_ABSTRACTION_BALANCE_VARIANTS) {
    NORM_TO_FAMILY[norm3(line)] = "abstraction:balance";
  }
  for (const line of MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT_VARIANTS) {
    NORM_TO_FAMILY[norm3(line)] = "abstraction:both_frequent";
  }
  function mirrorReflectionFamilyKey(reflection) {
    const n = norm3(reflection.statement);
    if (reflection.category === "fallback") {
      return "fallback:steady_line";
    }
    if (reflection.category === "low_signal") {
      return "low_signal";
    }
    if (reflection.category === "repetition") {
      const m = reflection.statement.match(/\u201c([^\u201d]+)\u201d/i);
      const w = m ? norm3(m[1] ?? "") : "";
      return w ? `repetition:named:${w}` : "repetition:named";
    }
    const mapped = NORM_TO_FAMILY[n];
    if (mapped) return mapped;
    return `${reflection.category}:${n}`;
  }
  function mirrorCandidateFamilyKey(candidate2) {
    return mirrorReflectionFamilyKey(candidate2);
  }

  // src/features/mirror/ranking/selectFinalReflections.ts
  function asSelected(c, role) {
    return {
      id: c.id,
      category: c.category,
      statement: c.statement,
      evidence: [...c.evidence],
      role,
      rankScore: c.rankScore
    };
  }
  function norm4(s) {
    return normMirrorReflectionHeadline(s);
  }
  function interpretiveStrengthTier(c) {
    if (c.category === "fallback" || c.category === "low_signal") {
      return 99;
    }
    const n = norm4(c.statement);
    if (n === norm4(MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL) || n === norm4(MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER)) {
      return 0;
    }
    if (n === norm4(MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE) || n === norm4(MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS)) {
      return 1;
    }
    if (c.category === "repetition" || n.includes(MIRROR_HEADLINE_REPETITION_CONTAINS_MARKER)) {
      return 2;
    }
    if (c.category === "cadence" || c.category === "opening" || c.category === "shift") {
      return 3;
    }
    if (c.category === "hesitation_qualification") {
      return 4;
    }
    if (isMirrorAbstractionBalanceStatement(c.statement) || isMirrorAbstractionBothFrequentStatement(c.statement)) {
      return 5;
    }
    return 6;
  }
  function categoryTieOrder(cat) {
    if (cat === "abstraction_concrete") return 0;
    if (cat === "repetition") return 1;
    if (cat === "cadence") return 2;
    if (cat === "opening") return 3;
    if (cat === "shift") return 4;
    if (cat === "hesitation_qualification") return 5;
    if (cat === "fallback") return 6;
    if (cat === "low_signal") return 7;
    return 8;
  }
  var REFLECTION_RECENCY_PENALTY_BY_INDEX = [88, 64, 42, 24];
  function effectivePrimaryRank(c, recentKeys, pool) {
    const base = c.rankScore;
    if (!recentKeys?.length) return base;
    const fam = mirrorCandidateFamilyKey(c);
    const idx = recentKeys.indexOf(fam);
    if (idx < 0) return base;
    let penalty = REFLECTION_RECENCY_PENALTY_BY_INDEX[idx] ?? 14;
    const sortedByRaw = [...pool].sort((a, b) => b.rankScore - a.rankScore);
    const top = sortedByRaw[0];
    if (top && top.id === c.id && c.rankScore >= 85) {
      const second = sortedByRaw.find((x) => x.id !== c.id);
      if (!second || c.rankScore - second.rankScore >= 28) {
        penalty = Math.floor(penalty * 0.18);
      }
    }
    return base - penalty;
  }
  function buildCompareInterpretivePrimaryOrder(recentKeys, pool) {
    return (a, b) => {
      const ta = interpretiveStrengthTier(a);
      const tb = interpretiveStrengthTier(b);
      if (ta !== tb) return ta - tb;
      const eb = effectivePrimaryRank(b, recentKeys, pool);
      const ea = effectivePrimaryRank(a, recentKeys, pool);
      if (eb !== ea) return eb - ea;
      if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
      return categoryTieOrder(a.category) - categoryTieOrder(b.category);
    };
  }
  function buildFallbackCandidate(sessionId, sentenceCount) {
    return {
      id: `fallback:${sessionId}`,
      category: "fallback",
      statement: pickMirrorFallbackSoftStatement(sessionId, sentenceCount),
      evidence: [],
      rankScore: 0
    };
  }
  function selectFinalReflections(rankedDeduped, sessionId, options) {
    const sentenceCountForFallback = options?.sentenceCountForFallback;
    if (rankedDeduped.length === 0) {
      return {
        main: asSelected(buildFallbackCandidate(sessionId, sentenceCountForFallback), "main"),
        supporting: []
      };
    }
    const recentKeys = options?.recentReflectionFamilyKeys;
    const pool = rankedDeduped;
    const ordered = [...pool].sort(buildCompareInterpretivePrimaryOrder(recentKeys, pool));
    const primary = ordered.find(
      (c) => effectivePrimaryRank(c, recentKeys, pool) >= MIRROR_SELECTION_MIN_RANK_SCORE_FOR_SUPPORT
    ) ?? null;
    const chosen = primary ?? buildFallbackCandidate(sessionId, sentenceCountForFallback);
    const main = asSelected(chosen, "main");
    const supporting = [];
    const used = /* @__PURE__ */ new Set([chosen.category]);
    for (const c of ordered) {
      if (supporting.length >= MIRROR_SELECTION_MAX_SUPPORTING) break;
      if (c === chosen) continue;
      if (used.has(c.category)) continue;
      if (!c.supportsPrimary) continue;
      if (c.rankScore < MIRROR_SELECTION_MIN_RANK_SCORE_FOR_SUPPORT) continue;
      supporting.push(asSelected(c, "support"));
      used.add(c.category);
    }
    return { main, supporting };
  }

  // src/features/mirror/pipeline/mirrorLowSignalGuard.ts
  function mirrorFeaturesAreLowSignal(features) {
    if (features.wordCount < MIRROR_LOW_SIGNAL_MAX_WORDS_EXCLUSIVE) return true;
    if (features.sentenceCount < 2 && features.wordCount < MIRROR_LOW_SIGNAL_STRUCTURE_MIN_WORDS) {
      return true;
    }
    return false;
  }
  function buildLowSignalMirrorPipelineResult(sessionId) {
    const main = {
      id: `low_signal:${sessionId}`,
      category: "low_signal",
      statement: MIRROR_HEADLINE_LOW_SIGNAL,
      evidence: [],
      role: "main",
      rankScore: 0
    };
    return { main, supporting: [] };
  }

  // src/features/mirror/pipeline/runMirrorPipeline.ts
  function runMirrorPipeline(input) {
    const features = analyzeText(input);
    if (mirrorFeaturesAreLowSignal(features)) {
      return buildLowSignalMirrorPipelineResult(features.sessionId);
    }
    const raw = buildReflectionCandidates(features, normalizeText(input.text));
    const ranked = rankReflections(raw);
    const deduped = dedupeReflections(ranked);
    return selectFinalReflections(deduped, features.sessionId, {
      recentReflectionFamilyKeys: input.recentReflectionFamilyKeys,
      sentenceCountForFallback: features.sentenceCount
    });
  }

  // src/features/mirror/recent/buildMirrorSessionDigest.ts
  var DIGEST_TOP_REPEATED_WORDS_MAX = 5;
  function digestTimestampMs(input) {
    if (typeof input.endedAt === "number" && Number.isFinite(input.endedAt)) {
      return input.endedAt;
    }
    if (typeof input.startedAt === "number" && Number.isFinite(input.startedAt)) {
      return input.startedAt;
    }
    return Date.now();
  }
  function buildMirrorSessionDigest(input) {
    const features = analyzeText(input);
    const qualifiesForRecent = features.wordCount >= MIRROR_GEN_MIN_WORDS_FOR_ANY;
    return {
      v: 1,
      sessionId: features.sessionId,
      timestamp: digestTimestampMs(input),
      qualifiesForRecent,
      wordCount: features.wordCount,
      topRepeatedWords: features.topRepeatedWords.slice(0, DIGEST_TOP_REPEATED_WORDS_MAX).map((e) => ({
        word: e.word,
        count: e.count
      })),
      abstraction: {
        abstractCount: features.abstractionProfile.abstractCount,
        concreteCount: features.abstractionProfile.concreteCount,
        abstractConcreteRatio: features.abstractionProfile.abstractConcreteRatio,
        shiftsTowardConcrete: features.abstractionProfile.shiftsTowardConcrete,
        shiftsTowardAbstract: features.abstractionProfile.shiftsTowardAbstract
      },
      hesitation: {
        qualifierCount: features.hesitationProfile.qualifierCount,
        pivotCount: features.hesitationProfile.pivotCount,
        contradictionMarkers: features.hesitationProfile.contradictionMarkers,
        uncertaintyMarkers: features.hesitationProfile.uncertaintyMarkers
      },
      cadence: {
        sentenceCount: features.sentenceCount,
        avgSentenceLength: features.cadenceProfile.avgSentenceLength,
        varianceSentenceLength: features.cadenceProfile.varianceSentenceLength,
        shortSentenceCount: features.cadenceProfile.shortSentenceCount,
        longSentenceCount: features.cadenceProfile.longSentenceCount,
        endCompression: features.cadenceProfile.endCompression,
        endExpansion: features.cadenceProfile.endExpansion
      },
      repetition: {
        eligibleTokenCount: features.repetitionStats.eligibleTokenCount,
        distinctEligibleTokenCount: features.repetitionStats.distinctEligibleTokenCount
      }
    };
  }

  // src/features/mirror/recent/buildReflectiveProfile.ts
  var LEXICAL_ID_PREFIX = "recent_lexical_anchor:";
  function extractLexicalWord(id) {
    if (typeof id !== "string" || !id.startsWith(LEXICAL_ID_PREFIX)) {
      return null;
    }
    const w = id.slice(LEXICAL_ID_PREFIX.length).trim();
    return w.length > 0 ? w : null;
  }
  function lowerFirst(s) {
    if (!s) return s;
    return s.charAt(0).toLowerCase() + s.slice(1);
  }
  function headlineClauseBody(pattern) {
    const s = String(pattern.statement || "").trim();
    if (!s) return null;
    return s.endsWith(".") ? s.slice(0, -1) : s;
  }
  function clauseFor(pattern) {
    switch (pattern.category) {
      case "recent_lexical_anchor": {
        const word = extractLexicalWord(pattern.id);
        if (!word) return null;
        return `\u201C${word}\u201D recurs across drafts`;
      }
      case "recent_abstraction_lean":
        return "Language leans toward ideas over scenes";
      case "recent_hesitation_qualification":
        return "Statements are often qualified just after they\u2019re made";
      case "pattern_recurring_signal":
      case "pattern_shift_over_time":
      case "pattern_consistency_vs_variation":
        return headlineClauseBody(pattern);
      default:
        return null;
    }
  }
  function standaloneSentence(pattern) {
    switch (pattern.category) {
      case "recent_lexical_anchor": {
        const word = extractLexicalWord(pattern.id);
        if (!word) return null;
        return `\u201C${word}\u201D recurs across drafts.`;
      }
      case "recent_abstraction_lean":
        return "Language leans toward ideas over scenes.";
      case "recent_hesitation_qualification":
        return "Statements are often qualified just after they\u2019re made.";
      case "pattern_recurring_signal":
      case "pattern_shift_over_time":
      case "pattern_consistency_vs_variation": {
        const body = headlineClauseBody(pattern);
        return body ? `${body}.` : null;
      }
      default:
        return null;
    }
  }
  function buildReflectiveProfile(patterns) {
    if (!patterns || patterns.length === 0) {
      return null;
    }
    const top = patterns.slice(0, 3);
    const valid = top.filter((p) => clauseFor(p) != null);
    if (valid.length === 0) {
      return null;
    }
    if (valid.length === 1) {
      return standaloneSentence(valid[0]);
    }
    if (valid.length === 2) {
      const a = clauseFor(valid[0]);
      const b = clauseFor(valid[1]);
      return `${a} and ${lowerFirst(b)}.`;
    }
    const s1 = standaloneSentence(valid[0]);
    const c2 = clauseFor(valid[1]);
    const c3 = clauseFor(valid[2]);
    return `${s1} ${c2}, and ${lowerFirst(c3)}.`;
  }

  // src/features/mirror/patterns/analysis/consistencyVariation.ts
  function populationStd(values) {
    const n = values.length;
    if (n < 2) return 0;
    const mean3 = values.reduce((a, b) => a + b, 0) / n;
    const v = values.reduce((acc, x) => acc + (x - mean3) ** 2, 0) / n;
    return Math.sqrt(v);
  }
  function minMax(values) {
    if (values.length === 0) return null;
    let min = values[0];
    let max = values[0];
    for (const x of values) {
      if (x < min) min = x;
      if (x > max) max = x;
    }
    return { min, max };
  }
  function detectConsistencyVariationCandidates(sorted) {
    const n = sorted.length;
    if (n < 3) return [];
    const out = [];
    const cadMeans = sorted.filter((d) => d.cadence.sentenceCount >= 4).map((d) => d.cadence.avgSentenceLength);
    const mm = minMax(cadMeans);
    if (mm && cadMeans.length >= 3) {
      const span = mm.max - mm.min;
      if (span >= 0.45 && span <= 2.4) {
        out.push({
          family: "consistency_vs_variation",
          id: "pattern_consistency_vs_variation:sentence_length_tight",
          dedupeKey: "consistency:sentence_length_band",
          rankScore: Math.round(200 - span * 40) + cadMeans.length * 5,
          statement: "Sentence length settles into a steady band across saved runs with enough lines to compare.",
          evidence: [
            {
              text: `Across ${cadMeans.length} saved drafts with enough sentences to read shape, averages stayed between ${mm.min.toFixed(
                1
              )} and ${mm.max.toFixed(1)} words per sentence.`
            }
          ]
        });
      } else if (span >= 7.5 && cadMeans.length >= 3) {
        out.push({
          family: "consistency_vs_variation",
          id: "pattern_consistency_vs_variation:sentence_length_wide",
          dedupeKey: "variation:sentence_length_band",
          rankScore: Math.round(span * 25) + cadMeans.length * 4,
          statement: "Sentence length swings more widely across saved runs with enough lines to compare.",
          evidence: [
            {
              text: `Across ${cadMeans.length} saved drafts with enough sentences to read shape, averages ranged from ${mm.min.toFixed(
                1
              )} to ${mm.max.toFixed(1)} words per sentence.`
            }
          ]
        });
      }
    }
    const ratios = sorted.filter((d) => d.abstraction.abstractCount + d.abstraction.concreteCount >= MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL).map((d) => d.abstraction.abstractConcreteRatio);
    if (ratios.length >= 3) {
      const std = populationStd(ratios);
      if (std <= 0.17 && std >= 1e-6) {
        out.push({
          family: "consistency_vs_variation",
          id: "pattern_consistency_vs_variation:abstraction_ratio_tight",
          dedupeKey: "consistency:abstraction_ratio_std",
          rankScore: Math.round(160 - std * 500) + ratios.length * 6,
          statement: "Abstract and concrete wording settle into a similar mix run after run.",
          evidence: [
            {
              text: `Across ${ratios.length} saved drafts with enough material on both sides to compare, that mix stayed tight from run to run.`
            }
          ]
        });
      } else if (std >= 1.22) {
        out.push({
          family: "consistency_vs_variation",
          id: "pattern_consistency_vs_variation:abstraction_ratio_loose",
          dedupeKey: "variation:abstraction_ratio_std",
          rankScore: Math.round(std * 420) + ratios.length * 5,
          statement: "The balance between abstraction and detail shifts across runs.",
          evidence: [
            {
              text: `Across ${ratios.length} saved drafts with enough material on both sides to compare, that balance still moved meaningfully from run to run.`
            }
          ]
        });
      }
    }
    return out;
  }

  // src/features/mirror/patterns/analysis/normalizeDigest.ts
  function normalizeMirrorSessionDigest(d) {
    const cadence = d.cadence ?? {
      sentenceCount: 0,
      avgSentenceLength: 0,
      varianceSentenceLength: 0,
      shortSentenceCount: 0,
      longSentenceCount: 0,
      endCompression: false,
      endExpansion: false
    };
    const repetition = d.repetition ?? {
      eligibleTokenCount: 0,
      distinctEligibleTokenCount: 0
    };
    const abstractionBase = d.abstraction;
    const abstraction = {
      abstractCount: abstractionBase.abstractCount,
      concreteCount: abstractionBase.concreteCount,
      abstractConcreteRatio: abstractionBase.abstractConcreteRatio,
      shiftsTowardConcrete: abstractionBase.shiftsTowardConcrete ?? false,
      shiftsTowardAbstract: abstractionBase.shiftsTowardAbstract ?? false
    };
    return {
      ...d,
      cadence,
      repetition,
      abstraction
    };
  }

  // src/features/mirror/patterns/generation/templates.ts
  function recurringLexicalEvidence(displayWord, hitSessions, includedDrafts) {
    return [
      {
        text: `\u201C${displayWord}\u201D showed up again in ${hitSessions} of ${includedDrafts} saved drafts counted here.`
      }
    ];
  }
  function recurringQualificationEvidence(hitSessions, includedDrafts) {
    return [
      {
        text: `Softening markers sat heavier in ${hitSessions} of ${includedDrafts} saved drafts counted here.`
      }
    ];
  }

  // src/features/mirror/patterns/analysis/sessionFlags.ts
  function sessionAbstractIdeaLean(d) {
    const a = d.abstraction;
    const lex = a.abstractCount + a.concreteCount;
    if (lex < MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL) return false;
    if (a.abstractCount < 2) return false;
    if (a.abstractConcreteRatio < MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO) return false;
    const concreteDominant = a.concreteCount >= MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO * Math.max(a.abstractCount, 1) && a.concreteCount >= 2;
    return !concreteDominant;
  }
  function sessionAbstractConcreteLean(d) {
    const a = d.abstraction;
    const lex = a.abstractCount + a.concreteCount;
    if (lex < MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL) return false;
    if (a.concreteCount < 2) return false;
    const ideaLean = a.abstractConcreteRatio >= MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO && a.abstractCount >= 2;
    if (ideaLean) return false;
    return a.concreteCount >= MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO * Math.max(a.abstractCount, 1);
  }
  function sessionQualifierDensityPattern(d) {
    const q = d.hesitation.qualifierCount;
    const w = Math.max(d.wordCount, 1);
    const per100 = q / w * 100;
    if (q < 2) return false;
    if (q >= 3 && per100 >= 1) return true;
    return q >= 2 && per100 >= 1.5;
  }

  // src/features/mirror/patterns/analysis/recurringSignal.ts
  function repetitionWordIsLowSignal2(word) {
    const w = word.toLowerCase();
    if (MIRROR_GEN_REPETITION_DULL_WORDS.has(w)) return true;
    if (w.length <= MIRROR_GEN_REPETITION_SHORT_WORD_MAX_LEN) return true;
    return false;
  }
  function repetitionMeetsCountGate2(word, count) {
    if (repetitionWordIsLowSignal2(word)) return count >= MIRROR_GEN_REPETITION_SHORT_WORD_MIN_COUNT;
    return count >= MIRROR_GEN_REPETITION_TOP_MIN_COUNT;
  }
  function lexicalWordCountsForSession(word, count) {
    return repetitionMeetsCountGate2(word, count) && !repetitionWordIsLowSignal2(word);
  }
  function minSessionsRecurring(n) {
    return Math.max(2, Math.ceil(0.55 * n));
  }
  function aggregateLexical(window) {
    const byKey = /* @__PURE__ */ new Map();
    for (const d of window) {
      const seenInDigest = /* @__PURE__ */ new Set();
      for (const row of d.topRepeatedWords) {
        const key = row.word.toLowerCase();
        if (seenInDigest.has(key)) continue;
        seenInDigest.add(key);
        if (!lexicalWordCountsForSession(row.word, row.count)) continue;
        let g = byKey.get(key);
        if (!g) {
          g = { displayWord: row.word, sessions: 0, totalCount: 0 };
          byKey.set(key, g);
        }
        g.sessions += 1;
        g.totalCount += row.count;
      }
    }
    return byKey;
  }
  function pickBestLexical(byKey, minSessions) {
    let best = null;
    for (const g of byKey.values()) {
      if (g.sessions < minSessions) continue;
      if (!best || g.sessions > best.sessions || g.sessions === best.sessions && g.totalCount > best.totalCount || g.sessions === best.sessions && g.totalCount === best.totalCount && g.displayWord.localeCompare(best.displayWord) < 0) {
        best = g;
      }
    }
    return best;
  }
  function detectRecurringSignalCandidates(window) {
    const n = window.length;
    if (n < 2) return [];
    const minSessions = minSessionsRecurring(n);
    const out = [];
    const lexicalMap = aggregateLexical(window);
    const bestLex = pickBestLexical(lexicalMap, minSessions);
    if (bestLex) {
      const w = bestLex.displayWord;
      const score = bestLex.sessions * 1e3 + bestLex.totalCount;
      out.push({
        family: "recurring_signal",
        id: `pattern_recurring_signal:lexical:${w.toLowerCase()}`,
        dedupeKey: "recurring:lexical",
        rankScore: score,
        statement: "One surface word keeps returning across saved drafts.",
        evidence: recurringLexicalEvidence(w, bestLex.sessions, n)
      });
    }
    let idea = 0;
    let concrete = 0;
    for (const d of window) {
      if (sessionAbstractIdeaLean(d)) idea += 1;
      else if (sessionAbstractConcreteLean(d)) concrete += 1;
    }
    if (idea >= minSessions && idea > concrete) {
      out.push({
        family: "recurring_signal",
        id: "pattern_recurring_signal:abstraction:idea_lean",
        dedupeKey: "recurring:abstraction_idea",
        rankScore: idea * 100 + (idea - concrete) * 10,
        statement: "Writing tilts toward ideas more often than concrete detail across saved drafts.",
        evidence: [
          {
            text: `That tilt showed in ${idea} of ${n} saved drafts counted here, compared with ${concrete} drafts leaning the other way.`
          }
        ]
      });
    } else if (concrete >= minSessions && concrete > idea) {
      out.push({
        family: "recurring_signal",
        id: "pattern_recurring_signal:abstraction:concrete_lean",
        dedupeKey: "recurring:abstraction_concrete",
        rankScore: concrete * 100 + (concrete - idea) * 10,
        statement: "Writing tilts toward concrete detail more often than abstract wording across saved drafts.",
        evidence: [
          {
            text: `That tilt showed in ${concrete} of ${n} saved drafts counted here, compared with ${idea} drafts leaning the other way.`
          }
        ]
      });
    }
    let qual = 0;
    for (const d of window) {
      if (sessionQualifierDensityPattern(d)) qual += 1;
    }
    if (qual >= minSessions) {
      out.push({
        family: "recurring_signal",
        id: "pattern_recurring_signal:hesitation:density",
        dedupeKey: "recurring:qualification_density",
        rankScore: qual * 95,
        statement: "Softening markers show up again and again across saved drafts.",
        evidence: recurringQualificationEvidence(qual, n)
      });
    }
    return out;
  }

  // src/features/mirror/patterns/analysis/qualifyingDigests.ts
  var MIRROR_PROMOTION_WINDOW_QUALIFYING = 8;
  function sortQualifyingMirrorDigestsChronological(digests) {
    return digests.filter((d) => d.v === 1 && d.qualifiesForRecent).sort((a, b) => a.timestamp - b.timestamp);
  }
  function sliceLastQualifyingMirrorDigests(digests) {
    const qualifying = sortQualifyingMirrorDigestsChronological(digests);
    if (qualifying.length === 0) return [];
    const n = qualifying.length;
    const start = Math.max(0, n - MIRROR_PROMOTION_WINDOW_QUALIFYING);
    return qualifying.slice(start);
  }

  // src/features/mirror/patterns/analysis/shiftOverTime.ts
  function mean2(values) {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  function earlyLateSplit(sorted) {
    const n = sorted.length;
    if (n < 4) return null;
    const span = Math.max(2, Math.ceil(n * 0.4));
    const early = [...sorted.slice(0, span)];
    const late = [...sorted.slice(n - span)];
    if (early.length < 2 || late.length < 2) return null;
    return { early, late };
  }
  function qualifiersPer100(d) {
    const w = Math.max(d.wordCount, 1);
    return d.hesitation.qualifierCount / w * 100;
  }
  function detectShiftOverTimeCandidates(sorted) {
    const split = earlyLateSplit(sorted);
    if (!split) return [];
    const { early, late } = split;
    const out = [];
    const earlyAbsRatios = early.filter((d) => d.abstraction.abstractCount + d.abstraction.concreteCount >= MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL).map((d) => d.abstraction.abstractConcreteRatio);
    const lateAbsRatios = late.filter((d) => d.abstraction.abstractCount + d.abstraction.concreteCount >= MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL).map((d) => d.abstraction.abstractConcreteRatio);
    if (earlyAbsRatios.length >= 2 && lateAbsRatios.length >= 2) {
      const e = mean2(earlyAbsRatios);
      const l = mean2(lateAbsRatios);
      const delta = l - e;
      if (Math.abs(delta) >= 0.48) {
        const toward = delta > 0 ? "recent" : "earlier";
        out.push({
          family: "shift_over_time",
          id: `pattern_shift_over_time:abstraction_ratio:${toward}`,
          dedupeKey: "shift:abstraction_ratio",
          rankScore: Math.round(Math.abs(delta) * 200) + earlyAbsRatios.length + lateAbsRatios.length,
          statement: "The balance between ideas and detail shifts across saved runs.",
          evidence: [
            {
              text: `Earlier saved runs grouped toward one side of that balance; more recent ones grouped toward the other (each window spans ${earlyAbsRatios.length} and ${lateAbsRatios.length} drafts).`
            }
          ]
        });
      }
    }
    const earlyCad = early.filter((d) => d.cadence.sentenceCount >= 4).map((d) => d.cadence.avgSentenceLength);
    const lateCad = late.filter((d) => d.cadence.sentenceCount >= 4).map((d) => d.cadence.avgSentenceLength);
    if (earlyCad.length >= 2 && lateCad.length >= 2) {
      const e = mean2(earlyCad);
      const l = mean2(lateCad);
      const delta = l - e;
      if (Math.abs(delta) >= 2.35) {
        const toward = delta > 0 ? "recent" : "earlier";
        out.push({
          family: "shift_over_time",
          id: `pattern_shift_over_time:sentence_length:${toward}`,
          dedupeKey: "shift:sentence_length_mean",
          rankScore: Math.round(Math.abs(delta) * 40) + earlyCad.length + lateCad.length,
          statement: "Sentence length moves between earlier and more recent saved runs.",
          evidence: [
            {
              text: `Across comparable stretches of saved work, the average drifted from about ${e.toFixed(1)} to about ${l.toFixed(
                1
              )} words per sentence.`
            }
          ]
        });
      }
    }
    const earlyQ = early.map((d) => qualifiersPer100(d));
    const lateQ = late.map((d) => qualifiersPer100(d));
    if (earlyQ.length >= 2 && lateQ.length >= 2) {
      const e = mean2(earlyQ);
      const l = mean2(lateQ);
      const delta = l - e;
      if (Math.abs(delta) >= 0.95) {
        const toward = delta > 0 ? "recent" : "earlier";
        out.push({
          family: "shift_over_time",
          id: `pattern_shift_over_time:qualifier_rate:${toward}`,
          dedupeKey: "shift:qualifier_per100",
          rankScore: Math.round(Math.abs(delta) * 80) + earlyQ.length + lateQ.length,
          statement: "Hedging lands thicker in one stretch of saved runs than in another.",
          evidence: [
            {
              text: `One stretch of saved runs carried more softening markers than the other when those windows are compared.`
            }
          ]
        });
      }
    }
    return out;
  }

  // src/features/mirror/patterns/ranking/rankAndSelect.ts
  function maxCardsForRunCount(n) {
    if (n <= 2) return 0;
    if (n <= 4) return 1;
    if (n <= 7) return 2;
    return 3;
  }
  function rankFloor(n) {
    if (n <= 4) return 118;
    if (n <= 7) return 92;
    return 72;
  }
  function dedupeByKey(candidates) {
    const best = /* @__PURE__ */ new Map();
    for (const c of candidates) {
      const prev = best.get(c.dedupeKey);
      if (!prev || c.rankScore > prev.rankScore || c.rankScore === prev.rankScore && c.id.localeCompare(prev.id) < 0) {
        best.set(c.dedupeKey, c);
      }
    }
    return [...best.values()];
  }
  function sortCandidates(a, b) {
    if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
    return a.id.localeCompare(b.id);
  }
  function rankAndSelectPatternCards(qualifyingRunCount, candidates) {
    if (qualifyingRunCount <= 2) {
      return {
        qualifyingRunCount,
        cards: [],
        emptyState: "insufficient_runs"
      };
    }
    const cap = maxCardsForRunCount(qualifyingRunCount);
    const floor = rankFloor(qualifyingRunCount);
    const filtered = dedupeByKey(candidates).filter((c) => c.rankScore >= floor).sort(sortCandidates);
    const picked = [];
    const usedFamilies = /* @__PURE__ */ new Set();
    for (const c of filtered) {
      if (picked.length >= cap) break;
      if (usedFamilies.has(c.family)) continue;
      if (picked.length > 0 && c.rankScore < 0.38 * picked[0].rankScore) {
        break;
      }
      usedFamilies.add(c.family);
      picked.push(c);
    }
    if (picked.length === 0) {
      return {
        qualifyingRunCount,
        cards: [],
        emptyState: "no_strong_pattern"
      };
    }
    return {
      qualifyingRunCount,
      cards: picked,
      emptyState: null
    };
  }

  // src/features/mirror/patterns/runPatternsFromDigests.ts
  function runPatternsFromDigests(digests) {
    const qualifying = sortQualifyingMirrorDigestsChronological(digests).map(normalizeMirrorSessionDigest);
    const n = qualifying.length;
    if (n <= 2) {
      return rankAndSelectPatternCards(n, []);
    }
    const recurring = detectRecurringSignalCandidates(qualifying);
    const shift = detectShiftOverTimeCandidates(qualifying);
    const consistency = detectConsistencyVariationCandidates(qualifying);
    const merged = [...recurring, ...shift, ...consistency];
    return rankAndSelectPatternCards(n, merged);
  }

  // src/features/mirror/recent/getPatternsProfileFromDigests.ts
  function candidateToMirrorRecentTrend(c) {
    const category = c.family === "recurring_signal" ? "pattern_recurring_signal" : c.family === "shift_over_time" ? "pattern_shift_over_time" : "pattern_consistency_vs_variation";
    return {
      id: c.id,
      category,
      statement: c.statement,
      evidence: [...c.evidence]
    };
  }
  function getPatternsProfileFromDigests(digests) {
    const selection = runPatternsFromDigests(digests);
    const promotedPatterns = selection.cards.map(candidateToMirrorRecentTrend);
    const profile = promotedPatterns.length > 1 ? buildReflectiveProfile([...promotedPatterns]) : null;
    return {
      promotedPatterns,
      profile,
      qualifyingRunCount: selection.qualifyingRunCount,
      patternsEmptyState: selection.emptyState
    };
  }

  // src/features/mirror/recent/aggregateRecentDigests.ts
  function sortedSessionIds(map) {
    return [...map.keys()].sort((a, b) => a.localeCompare(b));
  }
  function perSessionCountsFromMap(map) {
    return sortedSessionIds(map).map((sessionId) => ({ sessionId, count: map.get(sessionId) ?? 0 }));
  }
  function aggregateRecentDigests(qualifyingDigests) {
    const ordered = [...qualifyingDigests].sort((a, b) => a.timestamp - b.timestamp);
    const n = ordered.length;
    const earliestTimestamp = n > 0 ? ordered[0].timestamp : 0;
    const latestTimestamp = n > 0 ? ordered[n - 1].timestamp : 0;
    const lexicalMap = /* @__PURE__ */ new Map();
    const abstractionSessions = ordered.map((d) => ({
      sessionId: d.sessionId,
      timestamp: d.timestamp,
      abstractCount: d.abstraction.abstractCount,
      concreteCount: d.abstraction.concreteCount,
      abstractConcreteRatio: d.abstraction.abstractConcreteRatio,
      wordCount: d.wordCount
    }));
    const hesitationSessions = ordered.map((d) => {
      const w = Math.max(d.wordCount, 1);
      return {
        sessionId: d.sessionId,
        timestamp: d.timestamp,
        qualifierCount: d.hesitation.qualifierCount,
        qualifiersPer100Words: d.hesitation.qualifierCount / w * 100,
        wordCount: d.wordCount
      };
    });
    for (const d of ordered) {
      for (const row of d.topRepeatedWords) {
        const key = row.word.toLowerCase();
        let entry = lexicalMap.get(key);
        if (!entry) {
          entry = { displayWord: row.word, bySession: /* @__PURE__ */ new Map() };
          lexicalMap.set(key, entry);
        }
        const prev = entry.bySession.get(d.sessionId) ?? 0;
        if (row.count > prev) {
          entry.bySession.set(d.sessionId, row.count);
        }
      }
    }
    const lexicalWords = [];
    for (const [, { displayWord, bySession }] of lexicalMap) {
      const perSession = perSessionCountsFromMap(bySession);
      const totalTopListCount = perSession.reduce((s, r) => s + r.count, 0);
      lexicalWords.push({
        word: displayWord,
        sessionIds: sortedSessionIds(bySession),
        perSessionCounts: perSession,
        distinctSessionCount: bySession.size,
        totalTopListCount
      });
    }
    lexicalWords.sort((a, b) => {
      if (b.distinctSessionCount !== a.distinctSessionCount) {
        return b.distinctSessionCount - a.distinctSessionCount;
      }
      if (b.totalTopListCount !== a.totalTopListCount) {
        return b.totalTopListCount - a.totalTopListCount;
      }
      return a.word.toLowerCase().localeCompare(b.word.toLowerCase());
    });
    return {
      qualifyingSessionCount: n,
      earliestTimestamp,
      latestTimestamp,
      lexicalWords,
      abstractionSessions,
      hesitationSessions
    };
  }

  // src/features/mirror/recent/buildRecentTrendCandidates.ts
  var MIN_SESSIONS_FOR_LEXICAL_RECURRENCE = 3;
  var MIN_SESSIONS_FOR_CROSS_SESSION_PATTERN = 3;
  function repetitionWordIsLowSignal3(word) {
    const w = word.toLowerCase();
    if (MIRROR_GEN_REPETITION_DULL_WORDS.has(w)) return true;
    if (w.length <= MIRROR_GEN_REPETITION_SHORT_WORD_MAX_LEN) return true;
    return false;
  }
  function repetitionMeetsCountGate3(word, count) {
    if (repetitionWordIsLowSignal3(word)) return count >= MIRROR_GEN_REPETITION_SHORT_WORD_MIN_COUNT;
    return count >= MIRROR_GEN_REPETITION_TOP_MIN_COUNT;
  }
  function lexicalWordCountsForSession2(word, count) {
    return repetitionMeetsCountGate3(word, count) && !repetitionWordIsLowSignal3(word);
  }
  function sessionAbstractIdeaLean2(a) {
    const lex = a.abstractCount + a.concreteCount;
    if (lex < MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL) return false;
    if (a.abstractCount < 2) return false;
    if (a.abstractConcreteRatio < MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO) return false;
    const concreteDominant = a.concreteCount >= MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO * Math.max(a.abstractCount, 1) && a.concreteCount >= 2;
    return !concreteDominant;
  }
  function sessionAbstractConcreteLean2(a) {
    const lex = a.abstractCount + a.concreteCount;
    if (lex < MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL) return false;
    if (a.concreteCount < 2) return false;
    const ideaLean = a.abstractConcreteRatio >= MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO && a.abstractCount >= 2;
    if (ideaLean) return false;
    return a.concreteCount >= MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO * Math.max(a.abstractCount, 1);
  }
  function sessionQualifierPattern(h) {
    const q = h.qualifierCount;
    const per100 = h.qualifiersPer100Words;
    if (q < 2) return false;
    if (q >= 3 && per100 >= 1) return true;
    return q >= 2 && per100 >= 1.5;
  }
  function tryLexicalCandidate(aggregate) {
    const gated = aggregate.lexicalWords.map((row) => {
      const hits = row.perSessionCounts.filter((p) => lexicalWordCountsForSession2(row.word, p.count));
      const sessionIds = hits.map((h) => h.sessionId).sort((a, b) => a.localeCompare(b));
      const totalTopListCount = hits.reduce((s, h) => s + h.count, 0);
      return {
        word: row.word,
        sessionIds,
        perSessionCounts: hits,
        distinctSessionCount: hits.length,
        totalTopListCount
      };
    }).filter((row) => row.distinctSessionCount >= MIN_SESSIONS_FOR_LEXICAL_RECURRENCE);
    if (gated.length === 0) return null;
    gated.sort((a, b) => {
      if (b.distinctSessionCount !== a.distinctSessionCount) return b.distinctSessionCount - a.distinctSessionCount;
      if (b.totalTopListCount !== a.totalTopListCount) return b.totalTopListCount - a.totalTopListCount;
      return a.word.localeCompare(b.word);
    });
    const best = gated[0];
    const n = aggregate.qualifyingSessionCount;
    const rankScore = 42 + best.distinctSessionCount * 14 + Math.min(18, best.totalTopListCount);
    const statement = `\u201C${best.word}\u201D recurs across recent drafts.`;
    return {
      id: `recent_lexical_anchor:${best.word}`,
      category: "recent_lexical_anchor",
      statement,
      evidence: [],
      rankScore
    };
  }
  function tryAbstractionCandidate(aggregate) {
    const sessions = aggregate.abstractionSessions;
    let ideaLean = 0;
    let concreteLean = 0;
    for (const s of sessions) {
      if (sessionAbstractIdeaLean2(s)) ideaLean += 1;
      else if (sessionAbstractConcreteLean2(s)) concreteLean += 1;
    }
    if (ideaLean < MIN_SESSIONS_FOR_CROSS_SESSION_PATTERN) return null;
    if (ideaLean <= concreteLean) return null;
    const ratios = sessions.map((s) => s.abstractConcreteRatio);
    const meanRatio = ratios.reduce((a, b) => a + b, 0) / Math.max(ratios.length, 1);
    const rankScore = 48 + ideaLean * 11 + Math.min(14, meanRatio * 4);
    const statement = "Across recent drafts, language leans toward ideas over scenes.";
    return {
      id: "recent_abstraction_lean:aggregate",
      category: "recent_abstraction_lean",
      statement,
      evidence: [],
      rankScore
    };
  }
  function tryHesitationCandidate(aggregate) {
    const sessions = aggregate.hesitationSessions;
    let qualPattern = 0;
    for (const s of sessions) {
      if (sessionQualifierPattern(s)) qualPattern += 1;
    }
    if (qualPattern < MIN_SESSIONS_FOR_CROSS_SESSION_PATTERN) return null;
    const rankScore = 46 + qualPattern * 10;
    const statement = "Across recent drafts, statements are often qualified just after they appear.";
    return {
      id: "recent_hesitation_qualification:aggregate",
      category: "recent_hesitation_qualification",
      statement,
      evidence: [],
      rankScore
    };
  }
  function buildRecentTrendCandidates(aggregate) {
    const out = [];
    const lex = tryLexicalCandidate(aggregate);
    if (lex) out.push(lex);
    const abs = tryAbstractionCandidate(aggregate);
    if (abs) out.push(abs);
    const hes = tryHesitationCandidate(aggregate);
    if (hes) out.push(hes);
    return out;
  }

  // src/features/mirror/recent/types.ts
  var MIRROR_RECENT_MAX_TRENDS_TOTAL = 3;

  // src/features/mirror/recent/selectRecentTrends.ts
  function candidateToTrend(c) {
    return {
      id: c.id,
      category: c.category,
      statement: c.statement,
      evidence: c.evidence
    };
  }
  function categorySpecificityTieOrder(category) {
    switch (category) {
      case "recent_lexical_anchor":
        return 0;
      case "recent_hesitation_qualification":
        return 1;
      case "recent_abstraction_lean":
        return 2;
      default:
        return 9;
    }
  }
  function selectRecentTrends(candidates) {
    if (candidates.length === 0) return { trends: [] };
    const sorted = [...candidates].map((c, inputIndex) => ({ c, inputIndex })).sort((a, b) => {
      const d = b.c.rankScore - a.c.rankScore;
      if (Math.abs(d) <= MIRROR_SELECTION_RANK_SCORE_NEAR_DELTA) {
        const spec = categorySpecificityTieOrder(a.c.category) - categorySpecificityTieOrder(b.c.category);
        if (spec !== 0) return spec;
      }
      if (d !== 0) return d;
      const cat = a.c.category.localeCompare(b.c.category);
      if (cat !== 0) return cat;
      return a.inputIndex - b.inputIndex;
    }).map(({ c }) => c);
    const seen = /* @__PURE__ */ new Set();
    const trends = [];
    for (const c of sorted) {
      if (seen.has(c.category)) continue;
      seen.add(c.category);
      trends.push(candidateToTrend(c));
      if (trends.length >= MIRROR_RECENT_MAX_TRENDS_TOTAL) break;
    }
    return { trends };
  }

  // src/features/mirror/recent/runMirrorRecentTrendsPipeline.ts
  var MIN_QUALIFYING_SESSIONS = 4;
  function runMirrorRecentTrendsPipeline(digests) {
    const qualifying = sliceLastQualifyingMirrorDigests(digests);
    if (qualifying.length < MIN_QUALIFYING_SESSIONS) {
      return { trends: [] };
    }
    const aggregate = aggregateRecentDigests(qualifying);
    const candidates = buildRecentTrendCandidates(aggregate);
    return selectRecentTrends(candidates);
  }

  // src/features/mirror/nudges/nextPassInstruction.ts
  var PROMPT_FAMILIES = /* @__PURE__ */ new Set([
    "Observation",
    "Relation",
    "Tension",
    "Possibility",
    "Constraint"
  ]);
  var MIRROR_NEXT_PASS_LOW_SIGNAL_FALLBACK = "With a little more language on the page, patterns get easier to notice.";
  var MIRROR_NEXT_PASS_FALLBACK_INSTRUCTION = "What stands out in the draft you just wrote?";
  function normStatement(s) {
    return normMirrorReflectionHeadline(s);
  }
  function pickIndex(seed, modulus) {
    const s = String(seed ?? "");
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return modulus <= 0 ? 0 : h % modulus;
  }
  function pickLine(seedKey, lines) {
    if (!lines.length) return MIRROR_NEXT_PASS_FALLBACK_INSTRUCTION;
    return lines[pickIndex(seedKey, lines.length)] ?? MIRROR_NEXT_PASS_FALLBACK_INSTRUCTION;
  }
  function normPromptFamily(f) {
    const t = String(f ?? "").trim();
    return PROMPT_FAMILIES.has(t) ? t : null;
  }
  function seedWithFamily(base, family) {
    return family ? `${base}|fam:${family}` : `${base}|fam:na`;
  }
  var MIRROR_NUDGE_AMBIGUOUS_MIN_WORDS = 28;
  function pickDriverReflection(result) {
    const main = result.main;
    if (main && String(main.statement || "").trim()) {
      return main;
    }
    const supporting = Array.isArray(result.supporting) ? result.supporting : [];
    const first = supporting.find((c) => c && String(c.statement || "").trim());
    return first ?? null;
  }
  var NUDGE_LOW_SIGNAL = [
    MIRROR_NEXT_PASS_LOW_SIGNAL_FALLBACK,
    "A fuller stretch of writing usually gives the mirror more to work with.",
    "What becomes a little easier to see with a few more sentences on the page?",
    "When the page has more on it, small echoes are easier to hear."
  ];
  var NUDGE_GENERIC = [
    MIRROR_NEXT_PASS_FALLBACK_INSTRUCTION,
    "Where does the thread invite another glance?",
    "What detail keeps catching your attention?",
    "What remains unattended in what you wrote?"
  ];
  var NUDGE_FALLBACK_AMBIGUOUS = [
    "What still feels open (not wrong, just unsettled) in what you wrote?",
    "Where would you trust your own read more than a slick echo?",
    "If the mirror stays this quiet, what one thread do you still want to follow?"
  ];
  var NUDGE_REPETITION = [
    "What shifts if the same pressure shows up somewhere else?",
    "Where does the return feel different when you look again?",
    "What happens if that insistence loosens without vanishing?",
    "What opens if another word carries a slice of that weight?"
  ];
  var NUDGE_CADENCE_TIGHTENS = [
    "What if a later stretch lets the breath lengthen again?",
    "Where could the motion redistribute after that late tightening?",
    "What changes if one paragraph lets the line run a little longer?"
  ];
  var NUDGE_CADENCE_LENGTHEN = [
    "What happens if a middle passage holds a shorter beat for a moment?",
    "Where does a tighter line change the glide of what follows?",
    "What shifts if length gathers earlier instead of at the edge?"
  ];
  var NUDGE_CADENCE_ALTERNATION = [
    "What happens if one section holds a steadier stride?",
    "Where does the alternation want a softer hand in what follows?",
    "What remains if the swing between long and short quiets for a beat?"
  ];
  var NUDGE_CADENCE_DEFAULT = [
    "Where would you redistribute the motion?",
    "What changes if the pulse of the lines shifts mid-piece?",
    "What shows up if you follow the cadence into a neighboring texture?"
  ];
  var NUDGE_ABSTRACT_LEANS = [
    "What becomes touchable if the ideas rest in one place a little longer?",
    "Where does a single image want to carry more of the thinking?",
    "What surfaces if the abstractions lean toward one scene-stain?"
  ];
  var NUDGE_CONCRETE_LEANS = [
    "Where does the idea begin to surface behind the detail?",
    "What shifts if the objects fall away for a breath (not erased, just quieter)?",
    "What remains if the scene quiets further and something else hums?"
  ];
  var NUDGE_ABSTRACTION_BALANCED = [
    "What interests you if idea and image keep trading places?",
    "Where does one kind of attention want a little more room?",
    "What would you watch for in the handoff between scene and thought?"
  ];
  var NUDGE_HESITATION = [
    "What changes when the cushioning thins, without forcing a harder voice?",
    "Where does a line want to stand without the immediate softener?",
    "What clarity appears if the qualification arrives a beat later?",
    "What shifts if you let one assertion stay unaccompanied for a line?"
  ];
  function nextPassInstructionFromMirrorPipelineResult(result, loadFailed, opts) {
    const seed = String(opts?.seed ?? "").trim() || "wayword";
    const family = normPromptFamily(opts?.promptFamily);
    const lowSignal = Boolean(opts?.lowSignal);
    if (loadFailed || !result || typeof result !== "object") {
      return pickLine(seedWithFamily(`${seed}|load-fail`, family), NUDGE_GENERIC);
    }
    if (lowSignal) {
      return pickLine(seedWithFamily(`${seed}|low-signal`, family), NUDGE_LOW_SIGNAL);
    }
    const driver = pickDriverReflection(result);
    if (!driver) {
      return pickLine(seedWithFamily(`${seed}|no-driver`, family), NUDGE_GENERIC);
    }
    const cat = driver.category;
    const n = normStatement(driver.statement);
    if (cat === "low_signal") {
      return pickLine(seedWithFamily(`${seed}|mirror-low-signal`, family), NUDGE_LOW_SIGNAL);
    }
    if (cat === "fallback" || isMirrorFallbackSoftStatement(driver.statement)) {
      const wcRaw = opts?.submissionWordCount;
      const wc = typeof wcRaw === "number" && Number.isFinite(wcRaw) && wcRaw >= 0 ? Math.floor(wcRaw) : 0;
      if (wc >= MIRROR_NUDGE_AMBIGUOUS_MIN_WORDS) {
        return pickLine(seedWithFamily(`${seed}|fallback-ambiguous`, family), NUDGE_FALLBACK_AMBIGUOUS);
      }
      return pickLine(seedWithFamily(`${seed}|fallback-soft`, family), NUDGE_GENERIC);
    }
    let line = "";
    if (cat === "repetition") {
      line = pickLine(seedWithFamily(`${seed}|repetition`, family), NUDGE_REPETITION);
    } else if (cat === "cadence") {
      if (n === normStatement(MIRROR_HEADLINE_CADENCE_ENDING_TIGHTENS)) {
        line = pickLine(seedWithFamily(`${seed}|cadence-tightens`, family), NUDGE_CADENCE_TIGHTENS);
      } else if (n === normStatement(MIRROR_HEADLINE_CADENCE_LINES_LENGTHEN)) {
        line = pickLine(seedWithFamily(`${seed}|cadence-lengthen`, family), NUDGE_CADENCE_LENGTHEN);
      } else if (n === normStatement(MIRROR_HEADLINE_CADENCE_ALTERNATION)) {
        line = pickLine(seedWithFamily(`${seed}|cadence-alt`, family), NUDGE_CADENCE_ALTERNATION);
      } else {
        line = pickLine(seedWithFamily(`${seed}|cadence`, family), NUDGE_CADENCE_DEFAULT);
      }
    } else if (cat === "opening" || cat === "shift") {
      if (n === normStatement(MIRROR_HEADLINE_OPENING_DIRECT) || n === normStatement(MIRROR_HEADLINE_OPENING_MOMENT) || n === normStatement(MIRROR_HEADLINE_OPENING_LOOSE) || n === normStatement(MIRROR_HEADLINE_SHIFT_TURNS) || n === normStatement(MIRROR_HEADLINE_SHIFT_HOLDS) || n === normStatement(MIRROR_HEADLINE_SHIFT_LEANS_ANOTHER)) {
        line = pickLine(seedWithFamily(`${seed}|shape-${cat}`, family), NUDGE_CADENCE_DEFAULT);
      } else {
        line = pickLine(seedWithFamily(`${seed}|shape-unknown`, family), NUDGE_GENERIC);
      }
    } else if (cat === "hesitation_qualification") {
      if (isMirrorHesitationStandardNudgeStatement(driver.statement)) {
        line = pickLine(seedWithFamily(`${seed}|hesitation`, family), NUDGE_HESITATION);
      } else {
        line = pickLine(seedWithFamily(`${seed}|hesitation-unknown`, family), NUDGE_GENERIC);
      }
    } else if (cat === "abstraction_concrete") {
      if (n === normStatement(MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE) || n === normStatement(MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL)) {
        line = pickLine(seedWithFamily(`${seed}|abstraction-ideas`, family), NUDGE_ABSTRACT_LEANS);
      } else if (n === normStatement(MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS) || n === normStatement(MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER)) {
        line = pickLine(seedWithFamily(`${seed}|abstraction-concrete`, family), NUDGE_CONCRETE_LEANS);
      } else if (isMirrorAbstractionBalanceStatement(driver.statement) || isMirrorAbstractionBothFrequentStatement(driver.statement)) {
        line = pickLine(seedWithFamily(`${seed}|abstraction-balance`, family), NUDGE_ABSTRACTION_BALANCED);
      } else {
        line = pickLine(seedWithFamily(`${seed}|abstraction-other`, family), NUDGE_GENERIC);
      }
    } else {
      line = pickLine(seedWithFamily(`${seed}|unknown-cat`, family), NUDGE_GENERIC);
    }
    return String(line || "").trim() || MIRROR_NEXT_PASS_FALLBACK_INSTRUCTION;
  }
  return __toCommonJS(entry_iife_exports);
})();

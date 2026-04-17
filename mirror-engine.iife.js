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
    buildMirrorSessionDigest: () => buildMirrorSessionDigest,
    buildReflectiveProfile: () => buildReflectiveProfile,
    getPatternsProfileFromDigests: () => getPatternsProfileFromDigests,
    runMirrorPipeline: () => runMirrorPipeline,
    runMirrorRecentTrendsPipeline: () => runMirrorRecentTrendsPipeline
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
  var MIRROR_END_COMPRESSION_RATIO = 0.72;
  var MIRROR_END_EXPANSION_RATIO = 1.28;
  var MIRROR_ABSTRACTION_SHIFT_RATIO = 1.1;

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
      shiftsTowardAbstract = d2a > d1a * MIRROR_ABSTRACTION_SHIFT_RATIO;
      shiftsTowardConcrete = d2c > d1c * MIRROR_ABSTRACTION_SHIFT_RATIO;
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
    const mean2 = values.reduce((a, b) => a + b, 0) / n;
    return values.reduce((acc, v) => acc + (v - mean2) ** 2, 0) / n;
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
    "those"
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

  // src/features/mirror/constants/generationThresholds.ts
  var MIRROR_GEN_MIN_WORDS_FOR_ANY = 28;
  var MIRROR_GEN_REPETITION_TOP_MIN_COUNT = 3;
  var MIRROR_GEN_REPETITION_SHORT_WORD_MAX_LEN = 4;
  var MIRROR_GEN_REPETITION_SHORT_WORD_MIN_COUNT = 5;
  var MIRROR_GEN_REPETITION_DULL_WORDS = /* @__PURE__ */ new Set([
    "thing",
    "things",
    "stuff",
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
  var MIRROR_GEN_CADENCE_ALTERNATION_MIN_SHORT = 3;
  var MIRROR_GEN_CADENCE_ALTERNATION_MIN_LONG = 2;
  var MIRROR_GEN_CADENCE_ALTERNATION_MIN_VARIANCE = 16;
  var MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL = 3;
  var MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_WORDS = 24;
  var MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_ABSTRACT = 3;
  var MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_RATIO = 2;
  var MIRROR_GEN_ABSTRACTION_SHORTFORM_MAX_CONCRETE = 1;
  var MIRROR_GEN_ABSTRACTION_MIN_FOR_SHIFT = 3;
  var MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO = 1.28;
  var MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO = 1.28;
  var MIRROR_GEN_HESITATION_MIN_TOTAL = 6;
  var MIRROR_GEN_HESITATION_MIN_HITS_PER_100_WORDS = 1.5;

  // src/features/mirror/constants/mirrorSessionHeadlines.ts
  function normMirrorReflectionHeadline(s) {
    return s.trim().toLowerCase().replace(/\s+/g, " ");
  }
  var MIRROR_HEADLINE_REPETITION_CONTAINS_MARKER = "returns several times in this draft";
  function mirrorHeadlineRepetitionNamed(word) {
    return `\u201C${word}\u201D ${MIRROR_HEADLINE_REPETITION_CONTAINS_MARKER}.`;
  }
  var MIRROR_HEADLINE_CADENCE_ENDING_TIGHTENS = "The ending tightens noticeably.";
  var MIRROR_HEADLINE_CADENCE_LINES_LENGTHEN = "Lines lengthen near the end.";
  var MIRROR_HEADLINE_CADENCE_ALTERNATION = "The cadence alternates between short and long lines.";
  var MIRROR_HEADLINE_ABSTRACTION_BALANCE = "Ideas and concrete detail stay in balance.";
  var MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL = "The back half leans more conceptual than scene-based.";
  var MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER = "Concrete detail carries more of the later passages.";
  var MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE = "Ideas dominate over concrete detail.";
  var MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS = "Concrete detail outweighs abstraction.";
  var MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT = "Both idea-words and image-words appear frequently.";
  var MIRROR_HEADLINE_HESITATION_QUALIFIED_AFTER = "Statements are often qualified just after they\u2019re made.";
  var MIRROR_HEADLINE_HESITATION_ASSERTIONS_SOFTENING = "Assertions are often followed by softening.";
  var MIRROR_HEADLINE_HESITATION_REVISED = "Statements are often revised or softened.";
  var MIRROR_HEADLINE_GENERIC_FALLBACK_SET_MEMBERS = [
    MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT,
    MIRROR_HEADLINE_ABSTRACTION_BALANCE,
    MIRROR_HEADLINE_HESITATION_REVISED
  ];

  // src/features/mirror/generation/buildReflectionCandidates.ts
  function snippetAround(text, needle, radius = 36) {
    const t = text;
    const lower = t.toLowerCase();
    const n = needle.toLowerCase();
    const idx = lower.indexOf(n);
    if (idx < 0) {
      return { text: needle };
    }
    const a = Math.max(0, idx - radius);
    const b = Math.min(t.length, idx + needle.length + radius);
    const slice = t.slice(a, b).trim();
    return { text: slice, start: a, end: b };
  }
  function candidate(category, sessionId, statement, evidence, rankScore) {
    return {
      id: `${category}:${sessionId}`,
      category,
      statement,
      evidence,
      rankScore
    };
  }
  function abstractionCandidate(sessionId, statement, evidence, rankScore) {
    return candidate(
      "abstraction_concrete",
      sessionId,
      statement,
      evidence,
      Math.max(rankScore, 38)
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
  function repetitionTopCountsEvidence(features, depth = 4) {
    const parts = features.topRepeatedWords.slice(0, depth).map((e) => `"${e.word}" \xD7${e.count}`);
    return { text: `Repeated lemmas (tokenizer): ${parts.join("; ")}.` };
  }
  function tryRepetition(features, sourceText) {
    if (features.wordCount < MIRROR_GEN_MIN_WORDS_FOR_ANY) return null;
    const list = features.topRepeatedWords;
    const picked = list.find(
      (e) => repetitionMeetsCountGate(e.word, e.count) && !repetitionWordIsLowSignal(e.word)
    );
    if (!picked) return null;
    const namedEv = [snippetAround(sourceText, picked.word)];
    const tie = list.find(
      (e) => e.word !== picked.word && e.count === picked.count && repetitionMeetsCountGate(e.word, e.count) && !repetitionWordIsLowSignal(e.word)
    );
    if (tie) namedEv.push(snippetAround(sourceText, tie.word));
    namedEv.push(repetitionTopCountsEvidence(features));
    const statement = mirrorHeadlineRepetitionNamed(picked.word);
    const multiNamed = list.filter(
      (e) => repetitionMeetsCountGate(e.word, e.count) && !repetitionWordIsLowSignal(e.word)
    ).length;
    const rankScore = Math.min(100, picked.count * 14 + (multiNamed > 1 ? 5 : 0));
    return candidate("repetition", features.sessionId, statement, namedEv, rankScore);
  }
  function tryCadence(features) {
    const c = features.cadenceProfile;
    if (features.wordCount < MIRROR_GEN_MIN_WORDS_FOR_ANY) return null;
    if (features.sentenceCount < MIRROR_GEN_CADENCE_MIN_SENTENCES) return null;
    const firstQ = c.meanSentenceLengthFirstQuarterWords;
    const lastQ = c.meanSentenceLengthLastQuarterWords;
    const quarterRatio = firstQ != null && lastQ != null && firstQ > 0 ? lastQ / firstQ : null;
    if (c.endCompression && quarterRatio != null && firstQ != null && lastQ != null) {
      const statement = MIRROR_HEADLINE_CADENCE_ENDING_TIGHTENS;
      const ev = [
        {
          text: `Opening-quarter mean sentence length ${firstQ.toFixed(1)} words; closing-quarter mean ${lastQ.toFixed(1)} words; closing/opening mean ratio ${quarterRatio.toFixed(2)}; ${features.sentenceCount} sentences.`
        }
      ];
      const rankScore = 54 + Math.min(18, c.varianceSentenceLength * 0.55);
      return candidate("cadence", features.sessionId, statement, ev, rankScore);
    }
    if (c.endExpansion && quarterRatio != null && firstQ != null && lastQ != null) {
      const statement = MIRROR_HEADLINE_CADENCE_LINES_LENGTHEN;
      const ev = [
        {
          text: `Opening-quarter mean ${firstQ.toFixed(1)} words per sentence; closing-quarter mean ${lastQ.toFixed(1)} words; closing/opening mean ratio ${quarterRatio.toFixed(2)}; ${features.sentenceCount} sentences.`
        }
      ];
      const rankScore = 54 + Math.min(18, c.varianceSentenceLength * 0.55);
      return candidate("cadence", features.sessionId, statement, ev, rankScore);
    }
    const strongAlternation = features.sentenceCount >= MIRROR_GEN_CADENCE_MIN_SENTENCES && c.shortSentenceCount >= MIRROR_GEN_CADENCE_ALTERNATION_MIN_SHORT && c.longSentenceCount >= MIRROR_GEN_CADENCE_ALTERNATION_MIN_LONG && c.varianceSentenceLength >= MIRROR_GEN_CADENCE_ALTERNATION_MIN_VARIANCE;
    if (strongAlternation) {
      const statement = MIRROR_HEADLINE_CADENCE_ALTERNATION;
      const ev = [
        {
          text: `Short sentences (\u2264${MIRROR_SHORT_SENTENCE_MAX_WORDS} words): ${c.shortSentenceCount}; long (\u2265${MIRROR_LONG_SENTENCE_MIN_WORDS} words): ${c.longSentenceCount}; average sentence length ${c.avgSentenceLength.toFixed(1)} words; spread (population variance of sentence word counts) ${c.varianceSentenceLength.toFixed(2)}.`
        }
      ];
      const rankScore = 44 + Math.min(16, c.shortSentenceCount + c.longSentenceCount);
      return candidate("cadence", features.sessionId, statement, ev, rankScore);
    }
    return null;
  }
  function tryAbstraction(features) {
    const a = features.abstractionProfile;
    const lex = a.abstractCount + a.concreteCount;
    const shortFormAbstractionEligible = features.wordCount >= MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_WORDS && a.abstractCount >= MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_ABSTRACT && a.abstractConcreteRatio >= MIRROR_GEN_ABSTRACTION_SHORTFORM_MIN_RATIO && a.concreteCount <= MIRROR_GEN_ABSTRACTION_SHORTFORM_MAX_CONCRETE;
    if (features.wordCount < MIRROR_GEN_MIN_WORDS_FOR_ANY && !shortFormAbstractionEligible) {
      return null;
    }
    const metrics = `Abstract lexicon hits ${a.abstractCount}; concrete ${a.concreteCount}; ratio ${a.abstractConcreteRatio.toFixed(2)}.`;
    if (a.shiftsTowardAbstract && a.shiftsTowardConcrete) {
      if (lex < MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL) return null;
      const statement = MIRROR_HEADLINE_ABSTRACTION_BALANCE;
      const ev = [{ text: `${metrics} Both half-session rates rise for abstract and concrete lexicon matches (ambiguous direction).` }];
      const rankScore = 40 + Math.min(22, lex * 1.6);
      return abstractionCandidate(features.sessionId, statement, ev, rankScore);
    }
    if (a.shiftsTowardAbstract && lex >= MIRROR_GEN_ABSTRACTION_MIN_FOR_SHIFT) {
      const statement = MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL;
      const ev = [{ text: `${metrics} Abstract-lexicon matches pick up in the second half of tokens.` }];
      const rankScore = 80 + Math.min(20, a.abstractCount * 2.4);
      return abstractionCandidate(features.sessionId, statement, ev, rankScore);
    }
    if (a.shiftsTowardConcrete && lex >= MIRROR_GEN_ABSTRACTION_MIN_FOR_SHIFT) {
      const statement = MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER;
      const ev = [{ text: `${metrics} Concrete-lexicon matches pick up in the second half of tokens.` }];
      const rankScore = 80 + Math.min(20, a.concreteCount * 2.4);
      return abstractionCandidate(features.sessionId, statement, ev, rankScore);
    }
    if (lex >= MIRROR_GEN_ABSTRACTION_MIN_LEXICON_TOTAL) {
      const ratioOkIdeas = a.abstractConcreteRatio >= MIRROR_GEN_ABSTRACTION_IDEA_LEAN_RATIO && a.abstractCount >= 2;
      const ratioOkIdeasSoft = !ratioOkIdeas && a.abstractCount >= 3 && a.abstractConcreteRatio >= 1.06;
      const ratioOkConcrete = a.concreteCount >= MIRROR_GEN_ABSTRACTION_CONCRETE_LEAN_RATIO * Math.max(a.abstractCount, 1) && a.concreteCount >= 2;
      if (ratioOkIdeas && !ratioOkConcrete) {
        const statement2 = MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE;
        const ev2 = [{ text: metrics }];
        const rankScore2 = 68 + Math.min(16, lex * 1.8);
        return abstractionCandidate(features.sessionId, statement2, ev2, rankScore2);
      }
      if (ratioOkIdeasSoft && !ratioOkConcrete) {
        const statement2 = MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE;
        const ev2 = [{ text: `${metrics} Idea-leaning lexicon signal is present but below the stricter ratio gate.` }];
        const rankScore2 = 64 + Math.min(14, lex * 1.8);
        return abstractionCandidate(features.sessionId, statement2, ev2, rankScore2);
      }
      if (ratioOkConcrete && !ratioOkIdeas) {
        const statement2 = MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS;
        const ev2 = [{ text: metrics }];
        const rankScore2 = 68 + Math.min(16, lex * 1.8);
        return abstractionCandidate(features.sessionId, statement2, ev2, rankScore2);
      }
      const statement = MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT;
      const ev = [{ text: metrics }];
      const rankScore = 34 + Math.min(14, lex * 1.5);
      return abstractionCandidate(features.sessionId, statement, ev, rankScore);
    }
    return null;
  }
  function tryHesitation(features) {
    const h = features.hesitationProfile;
    const total = h.qualifierCount + h.pivotCount + h.contradictionMarkers + h.uncertaintyMarkers;
    const per100 = total / Math.max(features.wordCount, 1) * 100;
    if (features.wordCount < MIRROR_GEN_MIN_WORDS_FOR_ANY) return null;
    const soft = h.qualifierCount + h.uncertaintyMarkers;
    const turn = h.pivotCount + h.contradictionMarkers;
    if (turn === 0) {
      if (soft < 4) return null;
    } else {
      if (soft < 2 && (total < 10 || turn < 4)) return null;
      if (soft < 3 && turn > soft && total < 8) return null;
    }
    if (total < MIRROR_GEN_HESITATION_MIN_TOTAL && per100 < MIRROR_GEN_HESITATION_MIN_HITS_PER_100_WORDS) {
      return null;
    }
    const tallies = `Qualifiers ${h.qualifierCount}; pivots ${h.pivotCount}; contradiction markers ${h.contradictionMarkers}; uncertainty markers ${h.uncertaintyMarkers}; total ${total}; about ${per100.toFixed(1)} per 100 tokenizer words.`;
    let statement;
    if (soft >= turn && h.qualifierCount >= 2) {
      statement = MIRROR_HEADLINE_HESITATION_QUALIFIED_AFTER;
    } else if (turn >= soft && turn >= 2 && soft >= 2) {
      statement = MIRROR_HEADLINE_HESITATION_ASSERTIONS_SOFTENING;
    } else {
      statement = MIRROR_HEADLINE_HESITATION_REVISED;
    }
    const ev = [{ text: tallies }];
    let rankScore = Math.min(54, 24 + total * 2.2 + per100 * 0.7);
    if (soft < 3 && turn >= 2) rankScore -= 10;
    return candidate("hesitation_qualification", features.sessionId, statement, ev, rankScore);
  }
  function buildReflectionCandidates(features, sourceText) {
    const text = normalizeText(sourceText);
    const out = [];
    const rep = tryRepetition(features, text);
    if (rep) out.push(rep);
    const abs = tryAbstraction(features);
    if (abs) out.push(abs);
    const cad = tryCadence(features);
    if (cad) out.push(cad);
    const hes = tryHesitation(features);
    if (hes) out.push(hes);
    return out;
  }

  // src/features/mirror/constants/selectionThresholds.ts
  var MIRROR_SELECTION_MIN_RANK_SCORE_FOR_MAIN = 40;
  var MIRROR_SELECTION_MIN_RANK_SCORE_FOR_SUPPORT = 34;
  var MIRROR_SELECTION_RANK_SCORE_NEAR_DELTA = 5;
  var MIRROR_SELECTION_MAX_SUPPORTING = 4;

  // src/features/mirror/ranking/statementSpecificity.ts
  var GENERIC_FALLBACK_STATEMENTS = new Set(
    MIRROR_HEADLINE_GENERIC_FALLBACK_SET_MEMBERS.map((h) => normMirrorReflectionHeadline(h))
  );
  function norm(s) {
    return normMirrorReflectionHeadline(s);
  }
  function mirrorStatementSpecificity(statement) {
    const n = norm(statement);
    if (GENERIC_FALLBACK_STATEMENTS.has(n)) return 20;
    if (n.includes(MIRROR_HEADLINE_REPETITION_CONTAINS_MARKER)) return 100;
    if (n === norm(MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL) || n === norm(MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER)) {
      return 110;
    }
    if (n === norm(MIRROR_HEADLINE_CADENCE_ENDING_TIGHTENS) || n === norm(MIRROR_HEADLINE_CADENCE_LINES_LENGTHEN)) {
      return 90;
    }
    if (n === norm(MIRROR_HEADLINE_CADENCE_ALTERNATION)) return 84;
    if (n === norm(MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE) || n === norm(MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS)) {
      return 82;
    }
    if (n === norm(MIRROR_HEADLINE_HESITATION_QUALIFIED_AFTER)) return 58;
    if (n === norm(MIRROR_HEADLINE_HESITATION_ASSERTIONS_SOFTENING)) return 56;
    return 40;
  }

  // src/features/mirror/ranking/rankReflections.ts
  function norm2(s) {
    return normMirrorReflectionHeadline(s);
  }
  function rankingWeight(candidate2) {
    const s = norm2(candidate2.statement);
    if (s === norm2(MIRROR_HEADLINE_ABSTRACTION_BALANCE) || s === norm2(MIRROR_HEADLINE_ABSTRACTION_BOTH_FREQUENT)) {
      return -28;
    }
    if (s === norm2(MIRROR_HEADLINE_ABSTRACTION_BACK_HALF_CONCEPTUAL) || s === norm2(MIRROR_HEADLINE_ABSTRACTION_CONCRETE_LATER) || s === norm2(MIRROR_HEADLINE_ABSTRACTION_IDEAS_DOMINATE) || s === norm2(MIRROR_HEADLINE_ABSTRACTION_CONCRETE_OUTWEIGHS)) {
      return 34;
    }
    if (s.includes(MIRROR_HEADLINE_REPETITION_CONTAINS_MARKER)) {
      return 30;
    }
    if (s === norm2(MIRROR_HEADLINE_CADENCE_ENDING_TIGHTENS) || s === norm2(MIRROR_HEADLINE_CADENCE_LINES_LENGTHEN) || s === norm2(MIRROR_HEADLINE_CADENCE_ALTERNATION)) {
      return 18;
    }
    if (s === norm2(MIRROR_HEADLINE_HESITATION_QUALIFIED_AFTER) || s === norm2(MIRROR_HEADLINE_HESITATION_ASSERTIONS_SOFTENING) || s === norm2(MIRROR_HEADLINE_HESITATION_REVISED)) {
      return 10;
    }
    return 0;
  }
  function categoryTiePreference(category) {
    if (category === "abstraction_concrete") return 4;
    if (category === "repetition") return 3;
    if (category === "cadence") return 2;
    if (category === "hesitation_qualification") return 1;
    return 1;
  }
  function compareRanked(a, b) {
    const weightedA = a.rankScore + rankingWeight(a);
    const weightedB = b.rankScore + rankingWeight(b);
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
  function selectFinalReflections(rankedDeduped) {
    if (rankedDeduped.length === 0) {
      return { main: null, supporting: [] };
    }
    const supportEligible = rankedDeduped.filter(
      (c) => c.rankScore >= MIRROR_SELECTION_MIN_RANK_SCORE_FOR_SUPPORT
    );
    if (supportEligible.length === 0) {
      return { main: null, supporting: [] };
    }
    const best = rankedDeduped[0];
    const supporting = [];
    const used = /* @__PURE__ */ new Set();
    if (best.rankScore >= MIRROR_SELECTION_MIN_RANK_SCORE_FOR_MAIN) {
      const main = asSelected(best, "main");
      used.add(best.category);
      for (const c of rankedDeduped.slice(1)) {
        if (supporting.length >= MIRROR_SELECTION_MAX_SUPPORTING) break;
        if (used.has(c.category)) continue;
        if (c.rankScore < MIRROR_SELECTION_MIN_RANK_SCORE_FOR_SUPPORT) continue;
        supporting.push(asSelected(c, "support"));
        used.add(c.category);
      }
      return { main, supporting };
    }
    for (const c of supportEligible) {
      if (supporting.length >= MIRROR_SELECTION_MAX_SUPPORTING) break;
      if (used.has(c.category)) continue;
      supporting.push(asSelected(c, "support"));
      used.add(c.category);
    }
    return { main: null, supporting };
  }

  // src/features/mirror/pipeline/runMirrorPipeline.ts
  function runMirrorPipeline(input) {
    const features = analyzeText(input);
    const raw = buildReflectionCandidates(features, normalizeText(input.text));
    const ranked = rankReflections(raw);
    const deduped = dedupeReflections(ranked);
    return selectFinalReflections(deduped);
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
        abstractConcreteRatio: features.abstractionProfile.abstractConcreteRatio
      },
      hesitation: {
        qualifierCount: features.hesitationProfile.qualifierCount,
        pivotCount: features.hesitationProfile.pivotCount,
        contradictionMarkers: features.hesitationProfile.contradictionMarkers,
        uncertaintyMarkers: features.hesitationProfile.uncertaintyMarkers
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

  // src/features/mirror/recent/getPatternsProfileFromDigests.ts
  var MIRROR_PROMOTION_WINDOW_QUALIFYING = 8;
  var MIRROR_PROMOTION_THRESHOLD_HITS = 5;
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
  function sessionQualifierPattern(d) {
    const q = d.hesitation.qualifierCount;
    const w = Math.max(d.wordCount, 1);
    const per100 = q / w * 100;
    if (q < 2) return false;
    if (q >= 3 && per100 >= 1) return true;
    return q >= 2 && per100 >= 1.5;
  }
  function promotedEvidence() {
    return [{ text: "Recurrent across recent qualifying drafts." }];
  }
  function sliceLastQualifyingMirrorDigests(digests) {
    const qualifying = digests.filter((d) => d.v === 1 && d.qualifiesForRecent).sort((a, b) => a.timestamp - b.timestamp);
    if (qualifying.length === 0) return [];
    const n = qualifying.length;
    const start = Math.max(0, n - MIRROR_PROMOTION_WINDOW_QUALIFYING);
    return qualifying.slice(start);
  }
  function promoteLexicalFromWindow(window) {
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
    let best = null;
    for (const g of byKey.values()) {
      if (g.sessions < MIRROR_PROMOTION_THRESHOLD_HITS) continue;
      if (!best || g.sessions > best.sessions || g.sessions === best.sessions && g.totalCount > best.totalCount || g.sessions === best.sessions && g.totalCount === best.totalCount && g.displayWord.localeCompare(best.displayWord) < 0) {
        best = g;
      }
    }
    if (!best) return null;
    const w = best.displayWord;
    return {
      id: `recent_lexical_anchor:${w}`,
      category: "recent_lexical_anchor",
      statement: `\u201C${w}\u201D recurs across recent drafts.`,
      evidence: promotedEvidence()
    };
  }
  function promoteAbstractionFromWindow(window) {
    let idea = 0;
    let concrete = 0;
    for (const d of window) {
      if (sessionAbstractIdeaLean(d)) idea += 1;
      else if (sessionAbstractConcreteLean(d)) concrete += 1;
    }
    if (idea < MIRROR_PROMOTION_THRESHOLD_HITS || idea <= concrete) return null;
    return {
      id: "recent_abstraction_lean:promoted",
      category: "recent_abstraction_lean",
      statement: "Across recent drafts, language leans toward ideas over scenes.",
      evidence: promotedEvidence()
    };
  }
  function promoteHesitationFromWindow(window) {
    let n = 0;
    for (const d of window) {
      if (sessionQualifierPattern(d)) n += 1;
    }
    if (n < MIRROR_PROMOTION_THRESHOLD_HITS) return null;
    return {
      id: "recent_hesitation_qualification:promoted",
      category: "recent_hesitation_qualification",
      statement: "Across recent drafts, statements are often qualified just after they appear.",
      evidence: promotedEvidence()
    };
  }
  function promoteRecentTrendsToPatternsFromWindow(window) {
    const out = [];
    const lex = promoteLexicalFromWindow(window);
    if (lex) out.push(lex);
    const abs = promoteAbstractionFromWindow(window);
    if (abs) out.push(abs);
    const hes = promoteHesitationFromWindow(window);
    if (hes) out.push(hes);
    return out;
  }
  function getPatternsProfileFromDigests(digests) {
    const window = sliceLastQualifyingMirrorDigests(digests);
    const promotedPatterns = promoteRecentTrendsToPatternsFromWindow(window);
    const profile = promotedPatterns.length > 0 ? buildReflectiveProfile([...promotedPatterns]) : null;
    return { promotedPatterns, profile };
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
  function sessionQualifierPattern2(h) {
    const q = h.qualifierCount;
    const per100 = h.qualifiersPer100Words;
    if (q < 2) return false;
    if (q >= 3 && per100 >= 1) return true;
    return q >= 2 && per100 >= 1.5;
  }
  function evidenceLines(...lines) {
    return lines.map((text) => ({ text }));
  }
  function sessionChronoIndex(aggregate) {
    const m = /* @__PURE__ */ new Map();
    aggregate.abstractionSessions.forEach((s, i) => m.set(s.sessionId, i));
    return m;
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
    const chrono = sessionChronoIndex(aggregate);
    const ordered = [...best.perSessionCounts].sort(
      (a, b) => (chrono.get(a.sessionId) ?? 0) - (chrono.get(b.sessionId) ?? 0)
    );
    const parts = ordered.map((p) => `${p.count}\xD7`).join(", ");
    const ev = evidenceLines(
      `Seen in ${best.distinctSessionCount} of the last ${n} qualifying drafts.`,
      `Recent counts: ${parts}.`
    );
    return {
      id: `recent_lexical_anchor:${best.word}`,
      category: "recent_lexical_anchor",
      statement,
      evidence: ev,
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
    const n = aggregate.qualifyingSessionCount;
    const ratios = sessions.map((s) => s.abstractConcreteRatio);
    const meanRatio = ratios.reduce((a, b) => a + b, 0) / Math.max(ratios.length, 1);
    const rankScore = 48 + ideaLean * 11 + Math.min(14, meanRatio * 4);
    const statement = "Across recent drafts, language leans toward ideas over scenes.";
    const ev = evidenceLines(`Ideas over scenes in ${ideaLean} of the last ${n} qualifying drafts.`);
    return {
      id: "recent_abstraction_lean:aggregate",
      category: "recent_abstraction_lean",
      statement,
      evidence: ev,
      rankScore
    };
  }
  function tryHesitationCandidate(aggregate) {
    const sessions = aggregate.hesitationSessions;
    let qualPattern = 0;
    for (const s of sessions) {
      if (sessionQualifierPattern2(s)) qualPattern += 1;
    }
    if (qualPattern < MIN_SESSIONS_FOR_CROSS_SESSION_PATTERN) return null;
    const n = aggregate.qualifyingSessionCount;
    const rankScore = 46 + qualPattern * 10;
    const statement = "Across recent drafts, statements are often qualified just after they appear.";
    const chrono = sessionChronoIndex(aggregate);
    const ordered = sessions.filter((s) => sessionQualifierPattern2(s)).sort((a, b) => (chrono.get(a.sessionId) ?? 0) - (chrono.get(b.sessionId) ?? 0));
    const counts = ordered.map((s) => String(s.qualifierCount)).join(", ");
    const ev = evidenceLines(
      `Qualifier-heavy in ${qualPattern} of the last ${n} qualifying drafts.`,
      `Recent drafts: ${counts} qualifiers.`
    );
    return {
      id: "recent_hesitation_qualification:aggregate",
      category: "recent_hesitation_qualification",
      statement,
      evidence: ev,
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
  return __toCommonJS(entry_iife_exports);
})();

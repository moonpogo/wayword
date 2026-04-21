(function () {
  /**
   * @typedef {Object} WaywordRunDocument
   * @property {number} schemaVersion
   * @property {string} runId
   * @property {number} savedAt
   * @property {number} timestamp
   * @property {string} body
   * @property {string} prompt
   * @property {Array<[string, number]>} repeatedWords
   * @property {{ word: string, count: number, isExercise?: boolean }[]} bannedHits
   * @property {Array<[string, number]>} repeatedStarters
   * @property {number} score
   * @property {number} runScore
   * @property {Object} scoreBreakdown
   * @property {boolean} challengeActive
   * @property {boolean} challengeCompleted
   * @property {string[]} challengeWords
   * @property {boolean} wasSuccessful
   * @property {number} activeTargetWords
   * @property {number|null} activeTimerSeconds
   * @property {boolean} finishedWithinTime
   * @property {number|null} timeRemaining
   * @property {number} wordCount
   * @property {number} characterCount
   * @property {number} repeatLimitAtRun
   * @property {number} words
   * @property {number} unique
   * @property {number} uniqueRatio
   * @property {number} avgSentenceLength
   * @property {number} repeatedCount
   * @property {number} fillerCount
   * @property {Object<string, number>} wordFreq
   * @property {Object<string, number>} starterFreq
   * @property {Object<string, string>} starterExamples
   * @property {Object} punctuation
   * @property {Object} perspective
   * @property {boolean} [mirrorLoadFailed]
   * @property {Object|null} [mirrorPipelineResult]
   * @property {Object} [mirrorSessionDigest]
   */

  var utils = function () {
    return window.waywordRunDocumentUtils;
  };

  /**
   * Assembles a canonical document at submit time from the same inputs used for a legacy run row.
   * Prefer `createRunDocumentFromLegacyRun` when a full run object already exists.
   *
   * @param {Object} input
   * @param {string} input.runId
   * @param {number} input.savedAt
   * @param {number} input.timestamp
   * @param {string} input.body
   * @param {string} input.prompt
   * @param {Object} input.analysis Result of `analyze()` in the editor
   * @param {number} input.runScore
   * @param {Object} input.scoreBreakdown
   * @param {boolean} input.challengeActive
   * @param {boolean} input.challengeCompleted
   * @param {string[]} input.challengeWordsSnapshot
   * @param {boolean} input.wasSuccessful
   * @param {number} input.activeTargetWords
   * @param {number|null} input.activeTimerSecondsForRun
   * @param {boolean} input.finishedWithinTime
   * @param {number|null} input.timeRemainingSnapshot
   * @param {boolean} input.timerConfigured
   * @param {number} input.repeatLimitAtRun
   * @param {boolean} [input.mirrorLoadFailed]
   * @param {Object|null} [input.mirrorPipelineResult]
   * @param {Object} [input.mirrorSessionDigest]
   * @returns {WaywordRunDocument}
   */
  function createRunDocument(input) {
    var U = utils();
    var analysis = input.analysis || {};
    var body = String(input.body == null ? "" : input.body);
    var starterExamplesMap = {};
    var starterExampleList = Array.isArray(analysis.starterExampleList) ? analysis.starterExampleList : [];
    starterExampleList.forEach(function (item) {
      if (item && item.starter && !starterExamplesMap[item.starter]) starterExamplesMap[item.starter] = item.excerpt;
    });

    var wc =
      typeof analysis.totalWords === "number"
        ? analysis.totalWords
        : U && typeof U.computeWordCount === "function"
          ? U.computeWordCount(body)
          : 0;

    /** @type {WaywordRunDocument} */
    var doc = {
      schemaVersion: window.WAYWORD_RUN_DOCUMENT_SCHEMA_VERSION,
      runId: String(input.runId || ""),
      savedAt: typeof input.savedAt === "number" ? input.savedAt : Date.now(),
      timestamp: typeof input.timestamp === "number" ? input.timestamp : typeof input.savedAt === "number" ? input.savedAt : Date.now(),
      body: body,
      prompt: String(input.prompt || ""),
      repeatedWords: analysis.repeated || [],
      bannedHits: analysis.bannedHits || [],
      repeatedStarters: analysis.repeatedStarters || [],
      score: typeof input.runScore === "number" ? input.runScore : 0,
      runScore: typeof input.runScore === "number" ? input.runScore : 0,
      scoreBreakdown: input.scoreBreakdown && typeof input.scoreBreakdown === "object" ? input.scoreBreakdown : {},
      challengeActive: Boolean(input.challengeActive),
      challengeCompleted: Boolean(input.challengeCompleted),
      challengeWords: Array.isArray(input.challengeWordsSnapshot) ? input.challengeWordsSnapshot.slice() : [],
      wasSuccessful: Boolean(input.wasSuccessful),
      activeTargetWords: typeof input.activeTargetWords === "number" ? input.activeTargetWords : 0,
      activeTimerSeconds:
        input.activeTimerSecondsForRun === null || input.activeTimerSecondsForRun === undefined
          ? null
          : Number(input.activeTimerSecondsForRun),
      finishedWithinTime: Boolean(input.finishedWithinTime),
      timeRemaining: input.timerConfigured ? (typeof input.timeRemainingSnapshot === "number" ? input.timeRemainingSnapshot : null) : null,
      wordCount: wc,
      characterCount: U && typeof U.computeCharacterCount === "function" ? U.computeCharacterCount(body) : body.length,
      repeatLimitAtRun: typeof input.repeatLimitAtRun === "number" ? input.repeatLimitAtRun : 2,
      words: wc,
      unique: typeof analysis.uniqueCount === "number" ? analysis.uniqueCount : 0,
      uniqueRatio: typeof analysis.uniqueRatio === "number" ? analysis.uniqueRatio : 0,
      avgSentenceLength: typeof analysis.avgSentenceLength === "number" ? analysis.avgSentenceLength : 0,
      repeatedCount: Array.isArray(analysis.repeated) ? analysis.repeated.length : 0,
      fillerCount: Array.isArray(analysis.bannedHits)
        ? analysis.bannedHits.reduce(function (sum, item) {
            return sum + (item && typeof item.count === "number" ? item.count : 0);
          }, 0)
        : 0,
      wordFreq: analysis.counts && typeof analysis.counts === "object" ? analysis.counts : {},
      starterFreq: analysis.starterCounts && typeof analysis.starterCounts === "object" ? analysis.starterCounts : {},
      starterExamples: starterExamplesMap,
      punctuation: analysis.punctuation && typeof analysis.punctuation === "object" ? analysis.punctuation : {},
      perspective: analysis.perspective && typeof analysis.perspective === "object" ? analysis.perspective : {},
    };

    if (input.mirrorLoadFailed) {
      doc.mirrorLoadFailed = true;
      doc.mirrorPipelineResult = null;
    } else if (input.mirrorPipelineResult !== undefined) {
      doc.mirrorLoadFailed = false;
      doc.mirrorPipelineResult = input.mirrorPipelineResult;
    }
    if (input.mirrorSessionDigest !== undefined) doc.mirrorSessionDigest = input.mirrorSessionDigest;

    return doc;
  }

  /**
   * Converts a persisted legacy history row (`wayword-history` shape) into a canonical document.
   * @param {Object} run
   * @returns {WaywordRunDocument}
   */
  function createRunDocumentFromLegacyRun(run) {
    if (!run || typeof run !== "object") throw new Error("createRunDocumentFromLegacyRun: expected run object");
    var U = utils();
    var body = String(run.text == null ? "" : run.text);
    var wc = typeof run.wordCount === "number" ? run.wordCount : typeof run.words === "number" ? run.words : U ? U.computeWordCount(body) : 0;
    /** @type {WaywordRunDocument} */
    var doc = {
      schemaVersion: window.WAYWORD_RUN_DOCUMENT_SCHEMA_VERSION,
      runId: String(run.runId || ""),
      savedAt: typeof run.savedAt === "number" ? run.savedAt : typeof run.timestamp === "number" ? run.timestamp : 0,
      timestamp: typeof run.timestamp === "number" ? run.timestamp : typeof run.savedAt === "number" ? run.savedAt : 0,
      body: body,
      prompt: String(run.prompt || ""),
      repeatedWords: Array.isArray(run.repeatedWords) ? run.repeatedWords : [],
      bannedHits: Array.isArray(run.bannedHits) ? run.bannedHits : [],
      repeatedStarters: Array.isArray(run.repeatedStarters) ? run.repeatedStarters : [],
      score: typeof run.score === "number" ? run.score : typeof run.runScore === "number" ? run.runScore : 0,
      runScore: typeof run.runScore === "number" ? run.runScore : typeof run.score === "number" ? run.score : 0,
      scoreBreakdown: run.scoreBreakdown && typeof run.scoreBreakdown === "object" ? run.scoreBreakdown : {},
      challengeActive: Boolean(run.challengeActive),
      challengeCompleted: Boolean(run.challengeCompleted),
      challengeWords: Array.isArray(run.challengeWords) ? run.challengeWords.slice() : [],
      wasSuccessful: Boolean(run.wasSuccessful),
      activeTargetWords: typeof run.activeTargetWords === "number" ? run.activeTargetWords : 0,
      activeTimerSeconds: run.activeTimerSeconds === undefined ? null : run.activeTimerSeconds,
      finishedWithinTime: Boolean(run.finishedWithinTime),
      timeRemaining: run.timeRemaining === undefined ? null : run.timeRemaining,
      wordCount: wc,
      characterCount:
        typeof run.characterCount === "number"
          ? run.characterCount
          : U && typeof U.computeCharacterCount === "function"
            ? U.computeCharacterCount(body)
            : body.length,
      repeatLimitAtRun: typeof run.repeatLimitAtRun === "number" ? run.repeatLimitAtRun : 2,
      words: typeof run.words === "number" ? run.words : wc,
      unique: typeof run.unique === "number" ? run.unique : 0,
      uniqueRatio: typeof run.uniqueRatio === "number" ? run.uniqueRatio : 0,
      avgSentenceLength: typeof run.avgSentenceLength === "number" ? run.avgSentenceLength : 0,
      repeatedCount: typeof run.repeatedCount === "number" ? run.repeatedCount : 0,
      fillerCount: typeof run.fillerCount === "number" ? run.fillerCount : 0,
      wordFreq: run.wordFreq && typeof run.wordFreq === "object" ? run.wordFreq : {},
      starterFreq: run.starterFreq && typeof run.starterFreq === "object" ? run.starterFreq : {},
      starterExamples: run.starterExamples && typeof run.starterExamples === "object" ? run.starterExamples : {},
      punctuation: run.punctuation && typeof run.punctuation === "object" ? run.punctuation : {},
      perspective: run.perspective && typeof run.perspective === "object" ? run.perspective : {},
    };
    if (run.mirrorLoadFailed) {
      doc.mirrorLoadFailed = true;
      doc.mirrorPipelineResult = null;
    } else if (run.mirrorPipelineResult !== undefined) {
      doc.mirrorLoadFailed = Boolean(run.mirrorLoadFailed);
      doc.mirrorPipelineResult = run.mirrorPipelineResult;
    }
    if (run.mirrorSessionDigest !== undefined) doc.mirrorSessionDigest = run.mirrorSessionDigest;
    return doc;
  }

  window.waywordRunDocumentsModel = {
    createRunDocument: createRunDocument,
    createRunDocumentFromLegacyRun: createRunDocumentFromLegacyRun,
  };
})();

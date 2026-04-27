(function () {
  function scoreDeductionFromIncidentCount(n) {
    var c = Math.max(0, Math.floor(Number(n)) || 0);
    if (c <= 0) return 25;
    if (c === 1) return 22;
    if (c === 2) return 19;
    if (c === 3) return 16;
    if (c === 4) return 13;
    return 10;
  }

  function scoreCompletionFromTargetRatio(totalWords, activeTargetWords) {
    var words = Math.max(0, Number(totalWords) || 0);
    var target = Math.max(1, Number(activeTargetWords) || 1);
    var ratio = words / target;
    if (ratio >= 1) return { completion: 25, completionMultiplier: 1.0 };
    if (ratio >= 0.75) return { completion: 20, completionMultiplier: 0.85 };
    if (ratio >= 0.5) return { completion: 15, completionMultiplier: 0.6 };
    if (ratio >= 0.25) return { completion: 10, completionMultiplier: 0.35 };
    return { completion: 5, completionMultiplier: 0.1 };
  }

  function runScoreSampleCapFromWordCount(totalWords) {
    var words = Math.max(0, Math.floor(Number(totalWords) || 0));
    if (words <= 4) return 5;
    if (words <= 9) return 10;
    if (words <= 14) return 15;
    return 100;
  }

  function computeRunScoreV1(input, analysis, repeatLimit, activeTargetWords) {
    var limit = Math.max(1, Number(repeatLimit) || 1);
    var targetForScore = Math.max(1, Number(activeTargetWords) || 1);

    var fillerIncidents = analysis.bannedHits
      .filter(function (item) {
        return !item.isExercise;
      })
      .reduce(function (sum, item) {
        return sum + item.count;
      }, 0);
    var repetitionIncidents = analysis.repeated.reduce(function (sum, entry) {
      return sum + Math.max(0, entry[1] - limit);
    }, 0);
    var openingsIncidents = analysis.repeatedStarters.reduce(function (sum, entry) {
      return sum + Math.max(0, entry[1] - 1);
    }, 0);

    var completionResult = scoreCompletionFromTargetRatio(analysis.totalWords, targetForScore);
    var completion = completionResult.completion;
    var completionMultiplier = completionResult.completionMultiplier;
    var filler = scoreDeductionFromIncidentCount(fillerIncidents);
    var repetition = scoreDeductionFromIncidentCount(repetitionIncidents);
    var openings = scoreDeductionFromIncidentCount(openingsIncidents);
    var constraintRaw = filler + repetition + openings;
    var runScorePreCap = Math.min(100, completion + Math.round(completionMultiplier * constraintRaw));
    var runScore = Math.min(runScorePreCap, runScoreSampleCapFromWordCount(analysis.totalWords));
    var scoreBreakdown = {
      completion: completion,
      filler: filler,
      repetition: repetition,
      openings: openings,
      completionMultiplier: completionMultiplier
    };
    return { runScore: runScore, scoreBreakdown: scoreBreakdown };
  }

  function analyze(input, text) {
    var tokens = input.tokenize(text);
    var counts = input.countWords(tokens);
    var totalWords = tokens.length;
    var uniqueCount = Object.keys(counts).length;

    var repeated = Object.entries(counts)
      .filter(function (entry) {
        return !input.exemptWords.has(entry[0]) && entry[1] > input.repeatLimit;
      })
      .sort(function (a, b) {
        return b[1] - a[1];
      });

    var exerciseWordsSet = new Set(input.exerciseWords);
    var effectiveBanned = Array.from(new Set([].concat(input.banned, input.exerciseWords)));

    var bannedHits = effectiveBanned
      .map(function (word) {
        return { word: word, count: counts[word] || 0, isExercise: exerciseWordsSet.has(word) };
      })
      .filter(function (item) {
        return item.count > 0;
      });

    var starters = input.sentenceStarters(text);
    var starterCounts = input.countWords(starters);
    var repeatedStarters = Object.entries(starterCounts)
      .filter(function (entry) {
        return entry[1] > 1;
      })
      .sort(function (a, b) {
        return b[1] - a[1];
      });

    var targetDelta = input.targetWords ? totalWords - input.targetWords : totalWords;
    var uniqueRatio = totalWords ? uniqueCount / totalWords : 0;
    var sentences = String(text || "")
      .split(/[.!?]+/)
      .map(function (sentence) {
        return sentence.trim();
      })
      .filter(Boolean);
    var avgSentenceLength = sentences.length ? totalWords / sentences.length : 0;
    var perspective = input.countPerspective(tokens);
    var punctuation = input.countPunctuation(text);
    var starterExampleList = input.sentenceStarterExamples(text);

    return {
      tokens: tokens,
      counts: counts,
      totalWords: totalWords,
      uniqueCount: uniqueCount,
      repeated: repeated,
      bannedHits: bannedHits,
      repeatedStarters: repeatedStarters,
      targetDelta: targetDelta,
      starterCounts: starterCounts,
      uniqueRatio: uniqueRatio,
      avgSentenceLength: avgSentenceLength,
      perspective: perspective,
      punctuation: punctuation,
      starterExampleList: starterExampleList
    };
  }

  window.waywordAnalysisRuntime = {
    scoreDeductionFromIncidentCount: scoreDeductionFromIncidentCount,
    scoreCompletionFromTargetRatio: scoreCompletionFromTargetRatio,
    runScoreSampleCapFromWordCount: runScoreSampleCapFromWordCount,
    computeRunScoreV1: computeRunScoreV1,
    analyze: analyze
  };
})();

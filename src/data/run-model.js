(function () {
  function cloneMirrorPipelineResultForStorage(src) {
    if (src == null || typeof src !== "object") return null;
    try {
      return JSON.parse(JSON.stringify(src));
    } catch (_) {
      return null;
    }
  }

  window.waywordRunModel = {
    cloneMirrorPipelineResultForStorage,

    attachMirrorSnapshotToRun(run, pipelineResult, loadFailed) {
      if (loadFailed) {
        run.mirrorLoadFailed = true;
        run.mirrorPipelineResult = null;
        return;
      }
      run.mirrorLoadFailed = false;
      run.mirrorPipelineResult = cloneMirrorPipelineResultForStorage(pipelineResult);
    },

    createSubmittedRun(args) {
      const {
        makeRunId,
        now,
        currentText,
        prompt,
        analysis,
        runScore,
        scoreBreakdown,
        challengeActive,
        challengeCompleted,
        challengeWordsSnapshot,
        wasSuccessful,
        activeTargetWords,
        activeTimerSecondsForRun,
        finishedWithinTime,
        timeRemainingSnapshot,
        timerConfigured,
        repeatLimitAtRun,
      } = args;

      const starterExamplesMap = {};
      analysis.starterExampleList.forEach((item) => {
        if (!starterExamplesMap[item.starter]) starterExamplesMap[item.starter] = item.excerpt;
      });

      return {
        runId: makeRunId(),
        savedAt: now,
        timestamp: now,
        text: currentText,
        prompt,
        repeatedWords: analysis.repeated,
        bannedHits: analysis.bannedHits,
        repeatedStarters: analysis.repeatedStarters,
        score: runScore,
        runScore,
        scoreBreakdown,
        challengeActive,
        challengeCompleted,
        challengeWords: challengeWordsSnapshot,
        wasSuccessful,
        activeTargetWords,
        activeTimerSeconds: activeTimerSecondsForRun,
        finishedWithinTime,
        timeRemaining: timerConfigured ? timeRemainingSnapshot : null,
        wordCount: analysis.totalWords,
        repeatLimitAtRun,
        words: analysis.totalWords,
        unique: analysis.uniqueCount,
        uniqueRatio: analysis.uniqueRatio,
        avgSentenceLength: analysis.avgSentenceLength,
        repeatedCount: analysis.repeated.length,
        fillerCount: analysis.bannedHits.reduce((sum, item) => sum + item.count, 0),
        wordFreq: analysis.counts,
        starterFreq: analysis.starterCounts,
        starterExamples: starterExamplesMap,
        punctuation: analysis.punctuation,
        perspective: analysis.perspective,
      };
    },
  };
})();

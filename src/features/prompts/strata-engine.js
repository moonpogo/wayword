(function initWaywordStrataEngine(global) {
  "use strict";

  var STRATA_ENGINE_STORAGE_KEY = "waywordStrataEngineV1";
  var DEFAULT_RECENT_RUN_LIMIT = 30;
  var DEFAULT_LAST_SERVED_LAYER_LIMIT = 12;
  var READINESS_SIGNAL_WINDOW = 20;
  var READINESS_COMPLETED_WINDOW = 16;
  var DEFAULT_STRATUM = "entry_only";
  var KNOWN_LAYERS = Object.freeze(["entry", "torsion", "resonance"]);
  var STRATA_READINESS_BANDS = Object.freeze([
    "entry_support",
    "entry_stable",
    "torsion_ready",
    "resonance_candidate",
  ]);

  function isPlainObject(value) {
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
  }

  function getStorageRef(storageLike) {
    var ref = storageLike || global.localStorage;
    if (!ref) return null;
    if (typeof ref.getItem !== "function") return null;
    if (typeof ref.setItem !== "function") return null;
    if (typeof ref.removeItem !== "function") return null;
    return ref;
  }

  function normalizeString(value) {
    return String(value == null ? "" : value).trim();
  }

  function normalizeLayer(value) {
    return normalizeString(value).toLowerCase() || "unknown";
  }

  function isSafeObjectKey(value) {
    return value !== "__proto__" && value !== "prototype" && value !== "constructor";
  }

  function finiteNumber(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function nonNegativeInteger(value, fallback) {
    var n = Math.floor(finiteNumber(value, fallback));
    return n >= 0 ? n : fallback;
  }

  function finiteRatio(value, fallback) {
    var n = finiteNumber(value, fallback);
    if (n < 0) return 0;
    if (n > 1) return 1;
    return n;
  }

  function uniqueStrings(values) {
    var out = [];
    var seen = new Set();
    if (!Array.isArray(values)) return out;
    for (var i = 0; i < values.length; i++) {
      var key = normalizeString(values[i]);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(key);
    }
    return out;
  }

  function countWords(text) {
    var value = normalizeString(text);
    if (!value) return 0;
    var matches = value.match(/[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g);
    return matches ? matches.length : 0;
  }

  function countSentences(text) {
    var value = normalizeString(text);
    if (!value || countWords(value) === 0) return 0;
    var terminalMatches = value.match(/[^.!?\n]+[.!?]+(?=\s|$)/g);
    if (terminalMatches && terminalMatches.length) return terminalMatches.length;
    var lineSentences = value
      .split(/\n+/)
      .map(function trimLine(line) {
        return line.trim();
      })
      .filter(Boolean);
    return Math.max(1, lineSentences.length);
  }

  function normalizeStrataRunSummary(summary) {
    var input = isPlainObject(summary) ? summary : {};
    var text = normalizeString(input.text);
    var promptLayer = normalizeLayer(input.promptLayer);
    var promptId = normalizeString(input.promptId);
    var completedAt = nonNegativeInteger(input.completedAt, 0);
    var id = normalizeString(input.id) || String(completedAt || "");

    return {
      id: id,
      completedAt: completedAt,
      promptLayer: promptLayer,
      promptId: promptId,
      wordsWritten: nonNegativeInteger(input.wordsWritten, countWords(text)),
      sentenceCount: nonNegativeInteger(input.sentenceCount, countSentences(text)),
      timeToFirstTokenMs: nonNegativeInteger(input.timeToFirstTokenMs, 0),
      postStartPauseCount: nonNegativeInteger(input.postStartPauseCount, 0),
      longestPostStartPauseMs: nonNegativeInteger(input.longestPostStartPauseMs, 0),
      typingContinuity: finiteRatio(input.typingContinuity, 0),
      rerollsUsedBeforeRun: nonNegativeInteger(input.rerollsUsedBeforeRun, 0),
      totalSessionDurationMs: nonNegativeInteger(input.totalSessionDurationMs, 0),
      abandoned: Boolean(input.abandoned),
      completed: Boolean(input.completed),
    };
  }

  function createStrataRunSummary(input) {
    return normalizeStrataRunSummary(input);
  }

  function emptyCounts() {
    return {
      entry: 0,
      torsion: 0,
      resonance: 0,
    };
  }

  function emptySeenPromptIds() {
    return {
      entry: [],
      torsion: [],
      resonance: [],
    };
  }

  function createInitialStrataState() {
    return {
      version: 1,
      recentRuns: [],
      completedCountsByLayer: emptyCounts(),
      seenPromptIds: emptySeenPromptIds(),
      recentLatencyStats: {
        medianTimeToFirstTokenMs: null,
        trend: "unknown",
      },
      recentStallStats: {
        postStartStallRate: 0,
        repeatedShortRunRate: 0,
      },
      recentRerollStats: {
        rerollRate: 0,
        excessiveRerollRate: 0,
      },
      currentStratum: DEFAULT_STRATUM,
      lastServedLayers: [],
    };
  }

  function ensureLayerBucket(target, layer, fallback) {
    if (!isSafeObjectKey(layer)) return fallback;
    if (!Array.isArray(target[layer])) target[layer] = [];
    return target[layer];
  }

  function rebuildCompletedCountsFromRuns(recentRuns) {
    var counts = emptyCounts();
    for (var i = 0; i < recentRuns.length; i++) {
      var run = recentRuns[i];
      var layer = normalizeLayer(run.promptLayer);
      if (!isSafeObjectKey(layer)) continue;
      if (typeof counts[layer] !== "number") counts[layer] = 0;
      if (run.completed) counts[layer] += 1;
    }
    return counts;
  }

  function normalizeCompletedCounts(existingCounts, recentRuns) {
    var counts = emptyCounts();
    var hasUsableCount = false;
    if (isPlainObject(existingCounts)) {
      var layers = Object.keys(existingCounts);
      for (var i = 0; i < layers.length; i++) {
        var layer = normalizeLayer(layers[i]);
        if (!isSafeObjectKey(layer)) continue;
        var value = nonNegativeInteger(existingCounts[layers[i]], 0);
        counts[layer] = value;
        hasUsableCount = hasUsableCount || value > 0;
      }
    }
    return hasUsableCount ? counts : rebuildCompletedCountsFromRuns(recentRuns);
  }

  function normalizeSeenPromptIds(existingSeenPromptIds, recentRuns) {
    var seen = emptySeenPromptIds();
    if (isPlainObject(existingSeenPromptIds)) {
      var existingLayers = Object.keys(existingSeenPromptIds);
      for (var i = 0; i < existingLayers.length; i++) {
        var existingLayer = normalizeLayer(existingLayers[i]);
        if (!isSafeObjectKey(existingLayer)) continue;
        seen[existingLayer] = uniqueStrings(existingSeenPromptIds[existingLayers[i]]);
      }
    }

    for (var j = 0; j < recentRuns.length; j++) {
      var run = recentRuns[j];
      var layer = normalizeLayer(run.promptLayer);
      if (!isSafeObjectKey(layer)) continue;
      if (run.promptId) {
        var bucket = ensureLayerBucket(seen, layer, []);
        if (bucket.indexOf(run.promptId) === -1) bucket.push(run.promptId);
      }
    }

    return seen;
  }

  function normalizeStatsObject(value, fallback) {
    var input = isPlainObject(value) ? value : {};
    var out = {};
    var keys = Object.keys(fallback);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var fallbackValue = fallback[key];
      if (typeof fallbackValue === "number") {
        out[key] = finiteNumber(input[key], fallbackValue);
      } else if (fallbackValue === null) {
        out[key] = Number.isFinite(Number(input[key])) ? Number(input[key]) : null;
      } else {
        out[key] = normalizeString(input[key]) || fallbackValue;
      }
    }
    return out;
  }

  function normalizeStrataState(state) {
    var initial = createInitialStrataState();
    var input = isPlainObject(state) ? state : {};
    var recentRuns = Array.isArray(input.recentRuns)
      ? input.recentRuns.map(normalizeStrataRunSummary)
      : [];
    var completedCountsByLayer = normalizeCompletedCounts(input.completedCountsByLayer, recentRuns);
    var seenPromptIds = normalizeSeenPromptIds(input.seenPromptIds, recentRuns);

    return {
      version: 1,
      recentRuns: recentRuns,
      completedCountsByLayer: completedCountsByLayer,
      seenPromptIds: seenPromptIds,
      recentLatencyStats: normalizeStatsObject(
        input.recentLatencyStats,
        initial.recentLatencyStats
      ),
      recentStallStats: normalizeStatsObject(input.recentStallStats, initial.recentStallStats),
      recentRerollStats: normalizeStatsObject(input.recentRerollStats, initial.recentRerollStats),
      currentStratum: normalizeString(input.currentStratum) || DEFAULT_STRATUM,
      lastServedLayers: uniqueStrings(input.lastServedLayers).map(normalizeLayer),
    };
  }

  function appendStrataRunSummary(state, summary, options) {
    var opts = isPlainObject(options) ? options : {};
    var limit = nonNegativeInteger(opts.recentRunLimit, DEFAULT_RECENT_RUN_LIMIT);
    var normalizedState = normalizeStrataState(state);
    var normalizedSummary = normalizeStrataRunSummary(summary);
    var recentRuns = normalizedState.recentRuns.concat([normalizedSummary]);
    var cap = limit || DEFAULT_RECENT_RUN_LIMIT;
    if (recentRuns.length > cap) {
      recentRuns = recentRuns.slice(recentRuns.length - cap);
    }
    normalizedState.recentRuns = recentRuns;

    var lastLayerLimit = nonNegativeInteger(
      opts.lastServedLayerLimit,
      DEFAULT_LAST_SERVED_LAYER_LIMIT
    );
    normalizedState.lastServedLayers = normalizedState.lastServedLayers.concat([
      normalizedSummary.promptLayer,
    ]);
    if (normalizedState.lastServedLayers.length > lastLayerLimit) {
      normalizedState.lastServedLayers = normalizedState.lastServedLayers.slice(
        normalizedState.lastServedLayers.length - lastLayerLimit
      );
    }

    var layer = normalizedSummary.promptLayer;
    if (isSafeObjectKey(layer) && normalizedSummary.completed) {
      if (typeof normalizedState.completedCountsByLayer[layer] !== "number") {
        normalizedState.completedCountsByLayer[layer] = 0;
      }
      normalizedState.completedCountsByLayer[layer] += 1;
    }
    normalizedState.seenPromptIds = normalizeSeenPromptIds(
      normalizedState.seenPromptIds,
      [normalizedSummary]
    );
    return normalizedState;
  }

  function getStrataLayerCounts(state) {
    return normalizeStrataState(state).completedCountsByLayer;
  }

  function medianNonNegative(values) {
    var list = Array.isArray(values)
      ? values.filter(function keep(v) {
          return Number.isFinite(v) && v >= 0;
        })
      : [];
    if (!list.length) return null;
    list.sort(function (a, b) {
      return a - b;
    });
    var mid = Math.floor(list.length / 2);
    if (list.length % 2) return list[mid];
    return Math.round((list[mid - 1] + list[mid]) / 2);
  }

  function averageNonNegative(values) {
    var list = Array.isArray(values)
      ? values.filter(function keep(v) {
          return Number.isFinite(v) && v >= 0;
        })
      : [];
    if (!list.length) return 0;
    var total = 0;
    for (var i = 0; i < list.length; i++) total += list[i];
    return total / list.length;
  }

  function tail(arr, limit) {
    var n = nonNegativeInteger(limit, 0);
    if (!Array.isArray(arr) || !arr.length || n <= 0) return [];
    return arr.slice(Math.max(0, arr.length - n));
  }

  function getRecentCompletedRuns(state) {
    var normalized = normalizeStrataState(state);
    return tail(normalized.recentRuns, READINESS_COMPLETED_WINDOW).filter(function (run) {
      return Boolean(run && run.completed && !run.abandoned);
    });
  }

  function calculateStrataSignals(state) {
    var normalized = normalizeStrataState(state);
    var recentRuns = tail(normalized.recentRuns, READINESS_SIGNAL_WINDOW);
    var completedRuns = recentRuns.filter(function (run) {
      return Boolean(run && run.completed && !run.abandoned);
    });
    var abandonedRuns = recentRuns.filter(function (run) {
      return Boolean(run && run.abandoned);
    });
    var completionRate = recentRuns.length ? completedRuns.length / recentRuns.length : 0;
    var abandonmentRate = recentRuns.length ? abandonedRuns.length / recentRuns.length : 0;

    var successfulCompletions = completedRuns.filter(function (run) {
      return run.wordsWritten >= 8 && run.sentenceCount >= 1;
    }).length;
    var hesitationCount = completedRuns.filter(function (run) {
      return run.timeToFirstTokenMs > 12000;
    }).length;
    var hesitationRate = completedRuns.length ? hesitationCount / completedRuns.length : 0;
    var consistencyWindow = tail(recentRuns, 5);
    var consistencyCompleted = consistencyWindow.filter(function (run) {
      return Boolean(run && run.completed && !run.abandoned);
    }).length;
    var consistencyRate = consistencyWindow.length
      ? consistencyCompleted / consistencyWindow.length
      : 0;

    var entryBreadth = uniqueStrings(normalized.seenPromptIds.entry).length;
    var words = completedRuns.map(function (run) {
      return run.wordsWritten;
    });
    var sentences = completedRuns.map(function (run) {
      return run.sentenceCount;
    });
    var durations = completedRuns.map(function (run) {
      return run.totalSessionDurationMs;
    });
    var pauses = completedRuns.map(function (run) {
      return run.postStartPauseCount;
    });
    var ttfTokens = completedRuns
      .map(function (run) {
        return run.timeToFirstTokenMs;
      })
      .filter(function (value) {
        return Number.isFinite(value) && value > 0;
      });
    var midpoint = Math.floor(ttfTokens.length / 2);
    var earlier = midpoint > 0 ? medianNonNegative(ttfTokens.slice(0, midpoint)) : null;
    var later = midpoint > 0 ? medianNonNegative(ttfTokens.slice(midpoint)) : null;
    var hesitationTrend = "unknown";
    if (earlier != null && later != null) {
      hesitationTrend = later <= earlier ? "improving_or_stable" : "worsening";
    }

    return {
      recentRunCount: recentRuns.length,
      completedRunCount: completedRuns.length,
      completionRate: completionRate,
      abandonmentRate: abandonmentRate,
      successfulCompletions: successfulCompletions,
      hesitationRate: hesitationRate,
      hesitationTrend: hesitationTrend,
      entryPromptBreadth: entryBreadth,
      consistencyStreak: consistencyCompleted,
      consistencyRate: consistencyRate,
      medianTimeToFirstTokenMs: medianNonNegative(ttfTokens),
      averageWordsWritten: averageNonNegative(words),
      averageSentenceCount: averageNonNegative(sentences),
      averageSessionDurationMs: averageNonNegative(durations),
      averagePauseCount: averageNonNegative(pauses),
    };
  }

  function calculateStrataReadinessBand(state) {
    var signals = calculateStrataSignals(state);
    if (!signals.completedRunCount) return "entry_support";

    if (
      signals.completionRate < 0.45 ||
      signals.abandonmentRate > 0.45 ||
      (signals.hesitationRate > 0.5 && signals.completionRate < 0.7)
    ) {
      return "entry_support";
    }

    if (
      signals.completedRunCount >= 16 &&
      signals.completionRate >= 0.88 &&
      signals.abandonmentRate <= 0.12 &&
      signals.successfulCompletions >= 12 &&
      signals.entryPromptBreadth >= 14 &&
      signals.hesitationRate <= 0.2 &&
      signals.consistencyRate >= 0.7 &&
      signals.averageSessionDurationMs >= 45000 &&
      signals.averageSentenceCount >= 2
    ) {
      return "resonance_candidate";
    }

    if (
      signals.completedRunCount >= 8 &&
      signals.completionRate >= 0.72 &&
      signals.abandonmentRate <= 0.25 &&
      signals.successfulCompletions >= 5 &&
      signals.entryPromptBreadth >= 7 &&
      signals.hesitationRate <= 0.35 &&
      signals.consistencyRate >= 0.45
    ) {
      return "torsion_ready";
    }

    if (
      signals.completedRunCount >= 4 &&
      signals.completionRate >= 0.58 &&
      signals.abandonmentRate <= 0.4 &&
      signals.successfulCompletions >= 2
    ) {
      return "entry_stable";
    }

    return "entry_support";
  }

  function loadStrataState(storageLike) {
    var storage = getStorageRef(storageLike);
    if (!storage) return createInitialStrataState();
    try {
      var raw = storage.getItem(STRATA_ENGINE_STORAGE_KEY);
      if (!raw) return createInitialStrataState();
      var parsed = JSON.parse(raw);
      return normalizeStrataState(parsed);
    } catch (_) {
      return createInitialStrataState();
    }
  }

  function saveStrataState(state, storageLike) {
    var normalized = normalizeStrataState(state);
    var storage = getStorageRef(storageLike);
    if (!storage) return normalized;
    try {
      storage.setItem(STRATA_ENGINE_STORAGE_KEY, JSON.stringify(normalized));
    } catch (_) {
      /* no-op */
    }
    return normalized;
  }

  function clearStrataState(storageLike) {
    var storage = getStorageRef(storageLike);
    if (!storage) return false;
    try {
      storage.removeItem(STRATA_ENGINE_STORAGE_KEY);
      return true;
    } catch (_) {
      return false;
    }
  }

  function persistStrataRunSummary(summary, options) {
    if (!isPlainObject(summary)) return loadStrataState(options && options.storage);
    var normalizedSummary = normalizeStrataRunSummary(summary);
    if (!normalizedSummary.promptId || !normalizedSummary.promptLayer) {
      return loadStrataState(options && options.storage);
    }
    var opts = isPlainObject(options) ? options : {};
    var current = loadStrataState(opts.storage);
    var next = appendStrataRunSummary(current, normalizedSummary, {
      recentRunLimit: opts.recentRunLimit,
      lastServedLayerLimit: opts.lastServedLayerLimit,
    });
    return saveStrataState(next, opts.storage);
  }

  global.waywordStrataEngine = {
    STRATA_ENGINE_STORAGE_KEY: STRATA_ENGINE_STORAGE_KEY,
    KNOWN_LAYERS: KNOWN_LAYERS,
    STRATA_READINESS_BANDS: STRATA_READINESS_BANDS,
    createStrataRunSummary: createStrataRunSummary,
    countWords: countWords,
    countSentences: countSentences,
    normalizeStrataRunSummary: normalizeStrataRunSummary,
    createInitialStrataState: createInitialStrataState,
    normalizeStrataState: normalizeStrataState,
    appendStrataRunSummary: appendStrataRunSummary,
    getStrataLayerCounts: getStrataLayerCounts,
    loadStrataState: loadStrataState,
    saveStrataState: saveStrataState,
    clearStrataState: clearStrataState,
    persistStrataRunSummary: persistStrataRunSummary,
    getRecentCompletedRuns: getRecentCompletedRuns,
    calculateStrataSignals: calculateStrataSignals,
    calculateStrataReadinessBand: calculateStrataReadinessBand,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);

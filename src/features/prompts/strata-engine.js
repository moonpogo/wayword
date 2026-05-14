(function initWaywordStrataEngine(global) {
  "use strict";

  var STRATA_ENGINE_STORAGE_KEY = "waywordStrataEngineV1";
  var DEFAULT_RECENT_RUN_LIMIT = 30;
  var DEFAULT_LAST_SERVED_LAYER_LIMIT = 12;
  var DEFAULT_STRATUM = "entry_only";
  var KNOWN_LAYERS = Object.freeze(["entry", "torsion", "resonance"]);

  function isPlainObject(value) {
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
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

  global.waywordStrataEngine = {
    STRATA_ENGINE_STORAGE_KEY: STRATA_ENGINE_STORAGE_KEY,
    KNOWN_LAYERS: KNOWN_LAYERS,
    createStrataRunSummary: createStrataRunSummary,
    countWords: countWords,
    countSentences: countSentences,
    normalizeStrataRunSummary: normalizeStrataRunSummary,
    createInitialStrataState: createInitialStrataState,
    normalizeStrataState: normalizeStrataState,
    appendStrataRunSummary: appendStrataRunSummary,
    getStrataLayerCounts: getStrataLayerCounts,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);

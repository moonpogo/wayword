(function initWaywordBehavioralInterpretation(global) {
  "use strict";

  var TELEMETRY_STORAGE_KEY = "waywordBehavioralTelemetryV1";

  function toFiniteNumber(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function toNonNegative(value, fallback) {
    var n = toFiniteNumber(value, fallback);
    return n >= 0 ? n : fallback;
  }

  function normalizeString(value) {
    return String(value == null ? "" : value).trim();
  }

  function emptyInterpretation(sessionId, timestamp) {
    return {
      sessionId: normalizeString(sessionId) || "unknown",
      interpretationTimestamp: new Date(toNonNegative(timestamp, Date.now())).toISOString(),
      entryBehaviorSummary: {
        firstTokenLatencyMs: { count: 0, min: null, max: null, median: null, p90: null },
        hesitationCluster: "none",
      },
      writingFlowSummary: {
        runDurationMs: { count: 0, min: null, max: null, median: null, p90: null },
        pauseDurationMs: { count: 0, min: null, max: null, median: null, p90: null, total: 0 },
        wordCountPerRun: { count: 0, min: null, max: null, median: null },
        sentenceCountPerRun: { count: 0, min: null, max: null, median: null },
        continuationStability: "stable",
      },
      strataDistributionSummary: {
        promptLayerExposure: { entry: 0, torsion: 0, resonance: 0, unknown: 0 },
        readinessBandDistribution: {},
        layerWeightDistributionSnapshotAverages: { entry: 0, torsion: 0, resonance: 0 },
      },
      frictionSignals: {
        zeroTokenRuns: 0,
        highHesitationRuns: 0,
        earlyDropoffRuns: 0,
        repeatedEarlyAbandonmentPattern: false,
      },
      continuitySignals: {
        numberOfRunsInSession: 0,
        sessionReentryCount: 0,
        multiRunEngagement: false,
        returnToSessionBehavior: "none",
      },
      systemHealthSignals: {
        overuseEntryOnlyPrompts: false,
        underexposureToTorsionLayer: false,
        stalledSessionCluster: false,
        abnormalPromptSelectionSkew: false,
      },
    };
  }

  function quantile(values, ratio) {
    if (!Array.isArray(values) || !values.length) return null;
    var sorted = values
      .map(function (v) {
        return toNonNegative(v, 0);
      })
      .sort(function (a, b) {
        return a - b;
      });
    var idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1));
    return sorted[idx];
  }

  function metricSummary(values) {
    var list = Array.isArray(values)
      ? values
          .map(function (v) {
            return toNonNegative(v, 0);
          })
          .filter(function (v) {
            return Number.isFinite(v);
          })
      : [];
    if (!list.length) {
      return { count: 0, min: null, max: null, median: null, p90: null };
    }
    return {
      count: list.length,
      min: Math.min.apply(null, list),
      max: Math.max.apply(null, list),
      median: quantile(list, 0.5),
      p90: quantile(list, 0.9),
    };
  }

  function metricSummaryNoP90(values) {
    var base = metricSummary(values);
    return {
      count: base.count,
      min: base.min,
      max: base.max,
      median: base.median,
    };
  }

  function readTelemetryEventsFromStorage(storageRef) {
    var storage = storageRef || global.localStorage;
    if (!storage || typeof storage.getItem !== "function") return [];
    try {
      var raw = storage.getItem(TELEMETRY_STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }

  function eventValueNumber(event) {
    return toNonNegative(event && event.value, 0);
  }

  function buildSessionGroups(events) {
    var map = new Map();
    var list = Array.isArray(events) ? events : [];
    for (var i = 0; i < list.length; i++) {
      var event = list[i];
      var sessionId = normalizeString(event && event.sessionId) || "unknown";
      if (!map.has(sessionId)) map.set(sessionId, []);
      map.get(sessionId).push(event);
    }
    return map;
  }

  function countByEvent(events, name) {
    var n = 0;
    for (var i = 0; i < events.length; i++) {
      if (normalizeString(events[i].event) === name) n += 1;
    }
    return n;
  }

  function uniqueRuns(events) {
    var set = new Set();
    for (var i = 0; i < events.length; i++) {
      var runIndex = toNonNegative(events[i].runIndex, -1);
      if (runIndex >= 0) set.add(runIndex);
    }
    return set.size;
  }

  function averageLayerWeights(weightEvents) {
    if (!weightEvents.length) return { entry: 0, torsion: 0, resonance: 0 };
    var total = { entry: 0, torsion: 0, resonance: 0 };
    for (var i = 0; i < weightEvents.length; i++) {
      var row = weightEvents[i] && typeof weightEvents[i].value === "object" ? weightEvents[i].value : {};
      total.entry += toNonNegative(row.entry, 0);
      total.torsion += toNonNegative(row.torsion, 0);
      total.resonance += toNonNegative(row.resonance, 0);
    }
    return {
      entry: Math.round(total.entry / weightEvents.length),
      torsion: Math.round(total.torsion / weightEvents.length),
      resonance: Math.round(total.resonance / weightEvents.length),
    };
  }

  function interpretationForSession(sessionId, events, nowMs) {
    var out = emptyInterpretation(sessionId, nowMs);
    var firstTokenLatencies = events
      .filter(function (e) {
        return normalizeString(e.event) === "time_to_first_token_ms";
      })
      .map(eventValueNumber);
    out.entryBehaviorSummary.firstTokenLatencyMs = metricSummary(firstTokenLatencies);
    if (firstTokenLatencies.length) {
      var p90Latency = quantile(firstTokenLatencies, 0.9);
      out.entryBehaviorSummary.hesitationCluster =
        p90Latency >= 12000 ? "high" : p90Latency >= 5000 ? "moderate" : "low";
    }

    var runDurations = events
      .filter(function (e) {
        return normalizeString(e.event) === "time_spent_writing_ms";
      })
      .map(eventValueNumber);
    var pauses = events
      .filter(function (e) {
        return normalizeString(e.event) === "pause_duration_ms";
      })
      .map(eventValueNumber);
    var wordCounts = events
      .filter(function (e) {
        return normalizeString(e.event) === "run_word_count";
      })
      .map(eventValueNumber);
    var sentenceCounts = events
      .filter(function (e) {
        return normalizeString(e.event) === "run_sentence_count";
      })
      .map(eventValueNumber);

    out.writingFlowSummary.runDurationMs = metricSummary(runDurations);
    out.writingFlowSummary.pauseDurationMs = {
      count: metricSummary(pauses).count,
      min: metricSummary(pauses).min,
      max: metricSummary(pauses).max,
      median: metricSummary(pauses).median,
      p90: metricSummary(pauses).p90,
      total: pauses.reduce(function (sum, n) {
        return sum + n;
      }, 0),
    };
    out.writingFlowSummary.wordCountPerRun = metricSummaryNoP90(wordCounts);
    out.writingFlowSummary.sentenceCountPerRun = metricSummaryNoP90(sentenceCounts);
    var continuationScore = runDurations.length ? out.writingFlowSummary.pauseDurationMs.total / runDurations.length : 0;
    out.writingFlowSummary.continuationStability = continuationScore > 12000 ? "stop_start" : "stable";

    var layers = events.filter(function (e) {
      return normalizeString(e.event) === "prompt_layer_used";
    });
    for (var i = 0; i < layers.length; i++) {
      var key = normalizeString(layers[i].value).toLowerCase();
      if (key !== "entry" && key !== "torsion" && key !== "resonance") key = "unknown";
      out.strataDistributionSummary.promptLayerExposure[key] += 1;
    }
    var readiness = events.filter(function (e) {
      return normalizeString(e.event) === "readiness_band_at_start";
    });
    for (var j = 0; j < readiness.length; j++) {
      var band = normalizeString(readiness[j].value) || "unknown";
      out.strataDistributionSummary.readinessBandDistribution[band] =
        (out.strataDistributionSummary.readinessBandDistribution[band] || 0) + 1;
    }
    out.strataDistributionSummary.layerWeightDistributionSnapshotAverages = averageLayerWeights(
      events.filter(function (e) {
        return normalizeString(e.event) === "layer_weight_distribution_snapshot";
      })
    );

    out.frictionSignals.zeroTokenRuns = Math.max(0, uniqueRuns(events) - firstTokenLatencies.length);
    out.frictionSignals.highHesitationRuns = firstTokenLatencies.filter(function (ms) {
      return ms >= 12000;
    }).length;
    out.frictionSignals.earlyDropoffRuns = runDurations.filter(function (ms) {
      return ms > 0 && ms <= 5000;
    }).length;
    out.frictionSignals.repeatedEarlyAbandonmentPattern = out.frictionSignals.zeroTokenRuns >= 2;

    var numberOfRunsEvents = events.filter(function (e) {
      return normalizeString(e.event) === "number_of_runs_in_session";
    });
    var reentryEvents = events.filter(function (e) {
      return normalizeString(e.event) === "session_reentry_count";
    });
    out.continuitySignals.numberOfRunsInSession = numberOfRunsEvents.length
      ? eventValueNumber(numberOfRunsEvents[numberOfRunsEvents.length - 1])
      : uniqueRuns(events);
    out.continuitySignals.sessionReentryCount = reentryEvents.length
      ? eventValueNumber(reentryEvents[reentryEvents.length - 1])
      : 0;
    out.continuitySignals.multiRunEngagement = out.continuitySignals.numberOfRunsInSession > 1;
    out.continuitySignals.returnToSessionBehavior =
      out.continuitySignals.sessionReentryCount > 0 ? "present" : "none";

    var layerExposure = out.strataDistributionSummary.promptLayerExposure;
    out.systemHealthSignals.overuseEntryOnlyPrompts =
      layerExposure.entry > 0 && layerExposure.torsion === 0 && layerExposure.resonance === 0;
    out.systemHealthSignals.underexposureToTorsionLayer =
      layerExposure.entry >= 5 && layerExposure.torsion === 0;
    out.systemHealthSignals.stalledSessionCluster =
      out.frictionSignals.zeroTokenRuns >= 2 || out.frictionSignals.highHesitationRuns >= 3;
    var totalKnownLayers = layerExposure.entry + layerExposure.torsion + layerExposure.resonance;
    var entryShare = totalKnownLayers ? layerExposure.entry / totalKnownLayers : 0;
    out.systemHealthSignals.abnormalPromptSelectionSkew = totalKnownLayers >= 4 && entryShare >= 0.95;

    return out;
  }

  function interpretTelemetryEvents(events, options) {
    var opts = options && typeof options === "object" ? options : {};
    var now = toNonNegative(opts.nowMs, Date.now());
    var bySession = buildSessionGroups(events);
    var interpretations = [];
    bySession.forEach(function (sessionEvents, sessionId) {
      interpretations.push(interpretationForSession(sessionId, sessionEvents, now));
    });
    interpretations.sort(function (a, b) {
      return a.sessionId.localeCompare(b.sessionId);
    });

    return {
      interpretationVersion: 1,
      generatedAt: new Date(now).toISOString(),
      sourceEventCount: Array.isArray(events) ? events.length : 0,
      sessionCount: interpretations.length,
      sessions: interpretations,
    };
  }

  function interpretFromLocalStorage(storageRef, options) {
    var events = readTelemetryEventsFromStorage(storageRef);
    return interpretTelemetryEvents(events, options);
  }

  global.waywordBehavioralInterpretation = {
    TELEMETRY_STORAGE_KEY: TELEMETRY_STORAGE_KEY,
    readTelemetryEventsFromStorage: readTelemetryEventsFromStorage,
    interpretTelemetryEvents: interpretTelemetryEvents,
    interpretFromLocalStorage: interpretFromLocalStorage,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);

(function initWaywordBehavioralTelemetry(global) {
  "use strict";

  var STORAGE_KEY = "waywordBehavioralTelemetryV1";
  var MAX_EVENTS = 2000;

  function nowMs() {
    return Date.now();
  }

  function toFiniteNumber(value, fallback) {
    var n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function toNonNegativeInteger(value, fallback) {
    var n = Math.floor(toFiniteNumber(value, fallback));
    return n >= 0 ? n : fallback;
  }

  function normalizeString(value) {
    return String(value == null ? "" : value).trim();
  }

  function countSentences(text) {
    var value = normalizeString(text);
    if (!value) return 0;
    var terminalMatches = value.match(/[^.!?\n]+[.!?]+(?=\s|$)/g);
    if (terminalMatches && terminalMatches.length) return terminalMatches.length;
    var lines = value
      .split(/\n+/)
      .map(function trimLine(line) {
        return line.trim();
      })
      .filter(Boolean);
    return lines.length ? lines.length : 0;
  }

  function getStorageRef() {
    var ref = global.localStorage;
    if (!ref) return null;
    if (typeof ref.getItem !== "function") return null;
    if (typeof ref.setItem !== "function") return null;
    return ref;
  }

  function loadEvents() {
    var storage = getStorageRef();
    if (!storage) return [];
    try {
      var raw = storage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }

  function saveEvents(events) {
    var storage = getStorageRef();
    if (!storage) return;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
    } catch (_error) {}
  }

  function createSessionId(now) {
    var stamp = toNonNegativeInteger(now, nowMs());
    var suffix = Math.random().toString(36).slice(2, 8) || "session";
    return "sess_" + String(stamp) + "_" + suffix;
  }

  function create() {
    var current = null;

    function appendEvent(event, value, extra) {
      if (!current) return;
      var payload = extra && typeof extra === "object" ? extra : {};
      var events = loadEvents();
      events.push({
        event: normalizeString(event),
        value: value,
        sessionId: current.sessionId,
        timestamp: toNonNegativeInteger(payload.timestamp, nowMs()),
        runIndex: current.runCount,
      });
      saveEvents(events);
    }

    function ensureSession(input) {
      if (current) return current;
      var opts = input && typeof input === "object" ? input : {};
      var startedAt = toNonNegativeInteger(opts.now, nowMs());
      current = {
        sessionId: createSessionId(startedAt),
        startedAt: startedAt,
        runCount: 0,
        sessionReentryCount: 0,
        firstTokenAt: 0,
        lastInputAt: 0,
        totalPauseMs: 0,
        ended: false,
      };
      appendEvent("session_start", 1, { timestamp: startedAt });
      return current;
    }

    function startRun(input) {
      var opts = input && typeof input === "object" ? input : {};
      var session = ensureSession(opts);
      if (session.ended) return;
      var runStartAt = toNonNegativeInteger(opts.now, nowMs());
      session.runCount += 1;
      if (session.runCount > 1) session.sessionReentryCount += 1;
      session.firstTokenAt = 0;
      session.lastInputAt = 0;
      session.totalPauseMs = 0;
      session.runStartAt = runStartAt;

      appendEvent("prompt_id_shown_at_start", normalizeString(opts.promptId), { timestamp: runStartAt });
      appendEvent("readiness_band_at_start", normalizeString(opts.readinessBand), { timestamp: runStartAt });
      appendEvent("layer_weight_distribution_snapshot", opts.layerWeightDistributionSnapshot || null, {
        timestamp: runStartAt,
      });
      appendEvent("prompt_layer_used", normalizeString(opts.promptLayer), { timestamp: runStartAt });
    }

    function noteInput(input) {
      var opts = input && typeof input === "object" ? input : {};
      if (!current || current.ended) return;
      if (!opts.hasText) return;
      var at = toNonNegativeInteger(opts.now, nowMs());
      if (!current.firstTokenAt) {
        current.firstTokenAt = at;
        var fromStart = Math.max(0, at - toNonNegativeInteger(current.runStartAt, current.startedAt));
        appendEvent("first_token_time_ms", fromStart, { timestamp: at });
        appendEvent("time_to_first_token_ms", fromStart, { timestamp: at });
      }
      if (current.lastInputAt) {
        var pause = Math.max(0, at - current.lastInputAt);
        current.totalPauseMs += pause;
        appendEvent("pause_duration_ms", pause, { timestamp: at });
      }
      current.lastInputAt = at;
    }

    function submitRun(input) {
      var opts = input && typeof input === "object" ? input : {};
      if (!current || current.ended) return;
      var at = toNonNegativeInteger(opts.now, nowMs());
      var text = normalizeString(opts.text);
      appendEvent("run_word_count", toNonNegativeInteger(opts.wordCount, 0), { timestamp: at });
      appendEvent("run_sentence_count", toNonNegativeInteger(opts.sentenceCount, countSentences(text)), {
        timestamp: at,
      });
      appendEvent("time_spent_writing_ms", Math.max(0, at - toNonNegativeInteger(current.runStartAt, at)), {
        timestamp: at,
      });
      appendEvent("number_of_runs_in_session", current.runCount, { timestamp: at });
      appendEvent("session_reentry_count", current.sessionReentryCount, { timestamp: at });
    }

    function endSession(input) {
      var opts = input && typeof input === "object" ? input : {};
      if (!current || current.ended) return;
      var at = toNonNegativeInteger(opts.now, nowMs());
      appendEvent("session_end", 1, { timestamp: at });
      current.ended = true;
      current = null;
    }

    function getEvents() {
      return loadEvents();
    }

    function clearEvents() {
      saveEvents([]);
    }

    return {
      startRun: startRun,
      noteInput: noteInput,
      submitRun: submitRun,
      endSession: endSession,
      getEvents: getEvents,
      clearEvents: clearEvents,
    };
  }

  global.waywordBehavioralTelemetry = create();
})(typeof globalThis !== "undefined" ? globalThis : window);

(function () {
  var STORAGE_KEY = "waywordRetentionTelemetryV1";
  var LAST_SEEN_KEY = "wayword-retention-last-seen-at";
  var MAX_EVENTS = 1500;

  function safeString(value) {
    return String(value == null ? "" : value).trim();
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function readStorage() {
    try {
      return window.localStorage || null;
    } catch (_) {
      return null;
    }
  }

  function loadEvents(storage) {
    if (!storage) return [];
    try {
      var raw = storage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveEvents(storage, events) {
    if (!storage) return;
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
    } catch (_) {
      /* ignore */
    }
  }

  function buildRuntime() {
    var storage = readStorage();

    function track(eventName, payload) {
      var registry = window.waywordTelemetryEventRegistry;
      if (!registry || typeof registry.sanitizePayload !== "function") {
        return { ok: false, reason: "registry_missing" };
      }

      var normalizedEvent = safeString(eventName);
      var sanitized = registry.sanitizePayload(normalizedEvent, payload || {});
      if (!sanitized.ok) return { ok: false, reason: sanitized.reason || "invalid_payload" };

      var eventRow = {
        event: normalizedEvent,
        timestamp: nowIso(),
        payload: sanitized.payload || {},
      };

      var events = loadEvents(storage);
      events.push(eventRow);
      saveEvents(storage, events);

      try {
        if (
          window.waywordRetentionEvents &&
          typeof window.waywordRetentionEvents.persistTelemetryEvent === "function"
        ) {
          Promise.resolve(window.waywordRetentionEvents.persistTelemetryEvent(normalizedEvent, eventRow.payload)).catch(
            function () {
              /* ignore */
            }
          );
        }
      } catch (_) {
        /* ignore */
      }

      return { ok: true, event: eventRow };
    }

    function detectReturnSession(options) {
      var thresholdHours = Number(options && options.thresholdHours);
      if (!Number.isFinite(thresholdHours) || thresholdHours <= 0) thresholdHours = 12;

      var now = Date.now();
      var prior = 0;
      if (storage) {
        try {
          prior = Number(storage.getItem(LAST_SEEN_KEY)) || 0;
        } catch (_) {
          prior = 0;
        }
      }

      if (storage) {
        try {
          storage.setItem(LAST_SEEN_KEY, String(now));
        } catch (_) {
          /* ignore */
        }
      }

      if (!prior) {
        return { ok: true, emitted: false, reason: "no_prior_session" };
      }

      var elapsedMs = Math.max(0, now - prior);
      var thresholdMs = thresholdHours * 60 * 60 * 1000;
      if (elapsedMs < thresholdMs) {
        return { ok: true, emitted: false, reason: "below_threshold" };
      }

      var elapsedHours = Number((elapsedMs / (60 * 60 * 1000)).toFixed(2));
      var result = track("return_session_detected", {
        threshold_hours: thresholdHours,
        elapsed_hours: elapsedHours,
      });
      return Object.assign({ emitted: Boolean(result && result.ok), elapsedHours: elapsedHours }, result || {});
    }

    return {
      track: track,
      detectReturnSession: detectReturnSession,
      getEvents: function () {
        return loadEvents(storage);
      },
      clearEvents: function () {
        saveEvents(storage, []);
      },
    };
  }

  window.waywordTelemetryRuntime = buildRuntime();
})();

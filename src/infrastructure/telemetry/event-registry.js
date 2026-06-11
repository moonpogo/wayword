(function () {
  var PROHIBITED_KEYS = {
    writing_text: true,
    text: true,
    body: true,
    content: true,
    draft: true,
    mirror_payload: true,
  };

  var RUN_SYNC_STATUSES = {
    server_synced: true,
    local_only_no_session: true,
    local_only_sync_failed: true,
  };

  function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
  }

  function safeString(value) {
    return String(value == null ? "" : value).trim();
  }

  function safeBoolean(value) {
    return Boolean(value);
  }

  function safeFiniteNumber(value) {
    var number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function sanitizeObject(payload) {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return {};
    return payload;
  }

  function rejectUnknownKeys(payload, allowedKeys) {
    var allowedMap = {};
    allowedKeys.forEach(function (key) {
      allowedMap[key] = true;
    });

    var keys = Object.keys(payload);
    for (var idx = 0; idx < keys.length; idx += 1) {
      var key = keys[idx];
      if (PROHIBITED_KEYS[key]) return { ok: false, reason: "prohibited_key" };
      if (!allowedMap[key]) return { ok: false, reason: "unexpected_key" };
    }

    return { ok: true };
  }

  function sanitizeOnboardingCompleted(payload) {
    var clean = sanitizeObject(payload);
    var keyCheck = rejectUnknownKeys(clean, ["source"]);
    if (!keyCheck.ok) return keyCheck;
    var source = safeString(clean.source);
    return { ok: true, payload: source ? { source: source } : {} };
  }

  function sanitizeLandingViewed(payload) {
    var clean = sanitizeObject(payload);
    var keyCheck = rejectUnknownKeys(clean, ["source"]);
    if (!keyCheck.ok) return keyCheck;
    var source = safeString(clean.source);
    return { ok: true, payload: source ? { source: source } : {} };
  }

  function sanitizeWritingStarted(payload) {
    var clean = sanitizeObject(payload);
    var keyCheck = rejectUnknownKeys(clean, ["source"]);
    if (!keyCheck.ok) return keyCheck;
    var source = safeString(clean.source);
    return { ok: true, payload: source ? { source: source } : {} };
  }

  function sanitizeRunSaved(payload) {
    var clean = sanitizeObject(payload);
    var keyCheck = rejectUnknownKeys(clean, ["sync_status", "is_authenticated"]);
    if (!keyCheck.ok) return keyCheck;
    var syncStatus = safeString(clean.sync_status);
    if (!RUN_SYNC_STATUSES[syncStatus]) return { ok: false, reason: "invalid_sync_status" };
    return {
      ok: true,
      payload: {
        sync_status: syncStatus,
        is_authenticated: safeBoolean(clean.is_authenticated),
      },
    };
  }

  function sanitizeMeaningfulSessionCompleted(payload) {
    var clean = sanitizeObject(payload);
    var keyCheck = rejectUnknownKeys(clean, []);
    if (!keyCheck.ok) return keyCheck;
    return { ok: true, payload: {} };
  }

  function sanitizeObservatoryRevisited(payload) {
    var clean = sanitizeObject(payload);
    var keyCheck = rejectUnknownKeys(clean, ["surface_name", "available", "sparse_state"]);
    if (!keyCheck.ok) return keyCheck;
    var surfaceName = safeString(clean.surface_name);
    return {
      ok: true,
      payload: {
        surface_name: surfaceName || "patterns",
        available: safeBoolean(clean.available),
        sparse_state: safeBoolean(clean.sparse_state),
      },
    };
  }

  function sanitizeReturnSessionDetected(payload) {
    var clean = sanitizeObject(payload);
    var keyCheck = rejectUnknownKeys(clean, ["threshold_hours", "elapsed_hours"]);
    if (!keyCheck.ok) return keyCheck;
    var thresholdHours = safeFiniteNumber(clean.threshold_hours);
    var elapsedHours = safeFiniteNumber(clean.elapsed_hours);
    if (thresholdHours == null || elapsedHours == null) return { ok: false, reason: "invalid_numeric_payload" };
    return {
      ok: true,
      payload: {
        threshold_hours: thresholdHours,
        elapsed_hours: elapsedHours,
      },
    };
  }

  function sanitizeMigrationFailed(payload) {
    var clean = sanitizeObject(payload);
    var keyCheck = rejectUnknownKeys(clean, ["reason"]);
    if (!keyCheck.ok) return keyCheck;
    var reason = safeString(clean.reason);
    return { ok: true, payload: reason ? { reason: reason } : {} };
  }

  function sanitizeRecentRunsOpened(payload) {
    var clean = sanitizeObject(payload);
    var keyCheck = rejectUnknownKeys(clean, ["surface_name"]);
    if (!keyCheck.ok) return keyCheck;
    var surfaceName = safeString(clean.surface_name);
    return { ok: true, payload: surfaceName ? { surface_name: surfaceName } : {} };
  }

  function sanitizeAlphaPulseFeedback(payload) {
    var clean = sanitizeObject(payload);
    var keyCheck = rejectUnknownKeys(clean, ["response"]);
    if (!keyCheck.ok) return keyCheck;
    var response = safeString(clean.response);
    if (!response) return { ok: false, reason: "missing_response" };
    return { ok: true, payload: { response: response } };
  }

  function sanitizeEmptyPayloadEvent(payload) {
    var clean = sanitizeObject(payload);
    var keyCheck = rejectUnknownKeys(clean, []);
    if (!keyCheck.ok) return keyCheck;
    return { ok: true, payload: {} };
  }

  var SANITIZERS = {
    landing_viewed: sanitizeLandingViewed,
    writing_started: sanitizeWritingStarted,
    run_submitted: sanitizeEmptyPayloadEvent,
    recent_runs_opened: sanitizeRecentRunsOpened,
    alpha_pulse_feedback: sanitizeAlphaPulseFeedback,
    onboarding_completed: sanitizeOnboardingCompleted,
    run_saved: sanitizeRunSaved,
    meaningful_session_completed: sanitizeMeaningfulSessionCompleted,
    observatory_revisited: sanitizeObservatoryRevisited,
    return_session_detected: sanitizeReturnSessionDetected,
    migration_previewed: sanitizeEmptyPayloadEvent,
    migration_completed: sanitizeEmptyPayloadEvent,
    migration_failed: sanitizeMigrationFailed,
    migration_skipped_unverified_rls: sanitizeEmptyPayloadEvent,
  };

  function sanitizePayload(eventName, payload) {
    var normalizedEvent = safeString(eventName);
    var sanitizer = hasOwn(SANITIZERS, normalizedEvent) ? SANITIZERS[normalizedEvent] : null;
    if (!sanitizer) return { ok: false, reason: "unknown_event" };
    return sanitizer(payload);
  }

  window.waywordTelemetryEventRegistry = {
    sanitizePayload: sanitizePayload,
    getAllowedEvents: function () {
      return Object.keys(SANITIZERS).slice();
    },
  };
})();

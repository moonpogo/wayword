(function () {
  var ALLOWED_EVENTS = Object.freeze([
    "onboarding_completed",
    "run_saved",
    "meaningful_session_completed",
    "observatory_revisited",
    "return_session_detected",
    "migration_previewed",
    "migration_completed",
    "migration_failed",
    "migration_skipped_unverified_rls",
  ]);

  var PROHIBITED_PAYLOAD_KEYS = Object.freeze([
    "text",
    "writing_text",
    "prompt_response_text",
    "draft",
    "draft_text",
    "content",
    "body",
    "local_storage_dump",
    "keystrokes",
    "cursor_path",
    "personality",
    "emotion",
  ]);

  var EVENT_SCHEMAS = Object.freeze({
    onboarding_completed: ["timestamp", "source"],
    run_saved: ["timestamp", "sync_status", "is_authenticated"],
    meaningful_session_completed: [
      "timestamp",
      "status",
      "has_save",
      "has_observatory_revisit",
      "session_elapsed_ms",
    ],
    observatory_revisited: ["timestamp", "surface_name", "available", "sparse_state"],
    return_session_detected: ["timestamp", "elapsed_hours", "threshold_hours"],
    migration_previewed: [
      "timestamp",
      "local_count",
      "server_count",
      "duplicate_count",
      "local_only_count",
      "conflict_count",
      "upload_count",
      "status",
    ],
    migration_completed: [
      "timestamp",
      "local_count",
      "server_count",
      "duplicate_count",
      "local_only_count",
      "conflict_count",
      "upload_count",
      "status",
    ],
    migration_failed: ["timestamp", "status", "reason"],
    migration_skipped_unverified_rls: ["timestamp", "status"],
  });

  function safeString(value) {
    return String(value == null ? "" : value).trim();
  }

  function isAllowedEvent(eventName) {
    return ALLOWED_EVENTS.indexOf(safeString(eventName)) !== -1;
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function hasProhibitedPayloadKey(payload) {
    if (!isPlainObject(payload)) return false;
    var keys = Object.keys(payload);
    for (var i = 0; i < keys.length; i += 1) {
      var key = safeString(keys[i]).toLowerCase();
      if (PROHIBITED_PAYLOAD_KEYS.indexOf(key) !== -1) return true;
    }
    return false;
  }

  function normalizeValue(value) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") return safeString(value).slice(0, 120);
    return null;
  }

  function sanitizePayload(eventName, payload) {
    if (!isAllowedEvent(eventName)) {
      return { ok: false, reason: "unknown_event", payload: null };
    }

    if (!isPlainObject(payload)) {
      return { ok: true, payload: {} };
    }

    if (hasProhibitedPayloadKey(payload)) {
      return { ok: false, reason: "prohibited_payload_key", payload: null };
    }

    var allowedKeys = EVENT_SCHEMAS[eventName] || [];
    var out = {};
    for (var i = 0; i < allowedKeys.length; i += 1) {
      var key = allowedKeys[i];
      if (!Object.prototype.hasOwnProperty.call(payload, key)) continue;
      var normalized = normalizeValue(payload[key]);
      if (normalized == null) continue;
      out[key] = normalized;
    }

    return { ok: true, payload: out };
  }

  window.waywordTelemetryEventRegistry = {
    ALLOWED_EVENTS: ALLOWED_EVENTS,
    PROHIBITED_PAYLOAD_KEYS: PROHIBITED_PAYLOAD_KEYS,
    EVENT_SCHEMAS: EVENT_SCHEMAS,
    isAllowedEvent: isAllowedEvent,
    sanitizePayload: sanitizePayload,
  };
})();

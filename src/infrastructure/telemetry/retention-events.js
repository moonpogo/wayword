(function () {
  var PENDING_KEY = "waywordRetentionEventQueueV1";

  function nowIso() {
    return new Date().toISOString();
  }

  function safeString(value) {
    return String(value == null ? "" : value).trim();
  }

  function readStorage() {
    try {
      return window.localStorage || null;
    } catch (_) {
      return null;
    }
  }

  function loadPendingEvents() {
    var storage = readStorage();
    if (!storage) return [];
    try {
      var raw = storage.getItem(PENDING_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function savePendingEvents(events) {
    var storage = readStorage();
    if (!storage) return;
    try {
      storage.setItem(PENDING_KEY, JSON.stringify(Array.isArray(events) ? events : []));
    } catch (_) {
      /* ignore */
    }
  }

  function queueEvent(eventName, payload) {
    var pending = loadPendingEvents();
    pending.push({
      event: safeString(eventName),
      payload: payload || {},
      queued_at: nowIso(),
    });
    savePendingEvents(pending);
  }

  function getSupabaseClient() {
    return window.waywordSupabaseClient && typeof window.waywordSupabaseClient.getClient === "function"
      ? window.waywordSupabaseClient.getClient()
      : null;
  }

  function getCurrentUserId() {
    try {
      var session = window.waywordAuthSessionRuntime &&
        typeof window.waywordAuthSessionRuntime.getCurrentSession === "function"
        ? window.waywordAuthSessionRuntime.getCurrentSession()
        : null;
      return session && session.user && session.user.id ? String(session.user.id) : "";
    } catch (_) {
      return "";
    }
  }

  function buildInsertRow(userId, eventName, payload) {
    return {
      user_id: userId,
      event: safeString(eventName),
      payload: payload || {},
      timestamp: nowIso(),
    };
  }

  async function insertRows(rows) {
    var supabase = getSupabaseClient();
    if (!supabase) return { ok: false, reason: "supabase_not_configured" };
    var result = await supabase.from("retention_events").insert(rows);
    if (result && result.error) return { ok: false, reason: safeString(result.error.message) || "insert_failed" };
    return { ok: true, count: Array.isArray(rows) ? rows.length : 0 };
  }

  async function flushPending() {
    var userId = getCurrentUserId();
    if (!userId) return { ok: false, reason: "no_authenticated_session" };
    var pending = loadPendingEvents();
    if (!pending.length) return { ok: true, count: 0 };
    var rows = pending.map(function (entry) {
      return buildInsertRow(userId, entry.event, entry.payload);
    });
    var result = await insertRows(rows);
    if (result.ok) savePendingEvents([]);
    return result;
  }

  async function persistEvent(eventName, payload) {
    var registry = window.waywordTelemetryEventRegistry;
    if (!registry || typeof registry.sanitizePayload !== "function") {
      return { ok: false, reason: "registry_missing" };
    }

    var normalizedEvent = safeString(eventName);
    var sanitized = registry.sanitizePayload(normalizedEvent, payload || {});
    if (!sanitized.ok) return sanitized;

    var userId = getCurrentUserId();
    if (!userId) {
      queueEvent(normalizedEvent, sanitized.payload);
      return { ok: false, reason: "no_authenticated_session" };
    }

    var pendingResult = await flushPending();
    if (!pendingResult.ok && pendingResult.reason !== "no_authenticated_session") {
      queueEvent(normalizedEvent, sanitized.payload);
      return pendingResult;
    }

    var insertResult = await insertRows([buildInsertRow(userId, normalizedEvent, sanitized.payload)]);
    if (!insertResult.ok) {
      queueEvent(normalizedEvent, sanitized.payload);
    }
    return insertResult;
  }

  function fireAndForget(eventName, payload) {
    try {
      Promise.resolve(persistEvent(eventName, payload)).catch(function () {
        queueEvent(eventName, payload || {});
      });
    } catch (_) {
      queueEvent(eventName, payload || {});
    }
  }

  function normalizeRunSavedPayload(payload) {
    var clean = payload && typeof payload === "object" ? payload : {};
    var syncStatus = safeString(clean.sync_status);
    if (syncStatus === "local_only_fallback") {
      syncStatus = clean.is_authenticated ? "local_only_sync_failed" : "local_only_no_session";
    }
    if (!syncStatus) {
      syncStatus = clean.is_authenticated ? "local_only_sync_failed" : "local_only_no_session";
    }
    return {
      sync_status: syncStatus,
      is_authenticated: Boolean(clean.is_authenticated),
    };
  }

  window.waywordRetentionEvents = {
    beginSession: function () {
      return Promise.resolve(flushPending()).catch(function () {
        return { ok: false, reason: "flush_failed" };
      });
    },
    flushPending: flushPending,
    persistTelemetryEvent: persistEvent,
    markLandingViewed: function (payload) {
      fireAndForget("landing_viewed", payload || {});
    },
    markWritingStarted: function (payload) {
      fireAndForget("writing_started", payload || {});
    },
    markRunSubmitted: function () {
      fireAndForget("run_submitted", {});
    },
    markRecentRunsOpened: function (payload) {
      fireAndForget("recent_runs_opened", payload || {});
    },
    markAlphaPulseFeedback: function (payload) {
      fireAndForget("alpha_pulse_feedback", payload || {});
    },
    markOnboardingCompleted: function (payload) {
      fireAndForget("onboarding_completed", payload || {});
    },
    markRunSaved: function (payload) {
      fireAndForget("run_saved", normalizeRunSavedPayload(payload));
    },
    markMeaningfulSessionCompleted: function () {
      fireAndForget("meaningful_session_completed", {});
    },
    markObservatoryRevisited: function (payload) {
      fireAndForget("observatory_revisited", payload || {});
    },
    markMigrationPreviewed: function () {
      fireAndForget("migration_previewed", {});
    },
    markMigrationCompleted: function () {
      fireAndForget("migration_completed", {});
    },
    markMigrationFailed: function (payload) {
      fireAndForget("migration_failed", payload || {});
    },
    markMigrationSkippedUnverifiedRls: function () {
      fireAndForget("migration_skipped_unverified_rls", {});
    },
  };
})();

(function () {
  var ONBOARDING_MARKER_KEY = "wayword-onboarding-completed-v1";

  function nowIso() {
    return new Date().toISOString();
  }

  function hasStorageFlag(key) {
    try {
      return window.localStorage.getItem(key) === "1";
    } catch (_) {
      return false;
    }
  }

  function setStorageFlag(key) {
    try {
      window.localStorage.setItem(key, "1");
    } catch (_) {
      /* ignore */
    }
  }

  function getRuntime() {
    return window.waywordTelemetryRuntime;
  }

  function buildSessionTracker() {
    return {
      startedAt: Date.now(),
      hasSave: false,
      hasObservatoryRevisit: false,
      meaningfulEmitted: false,
    };
  }

  var currentSession = buildSessionTracker();

  function emitMeaningfulIfEligible() {
    if (currentSession.meaningfulEmitted) return { ok: true, emitted: false, reason: "already_emitted" };
    if (!currentSession.hasSave && !currentSession.hasObservatoryRevisit) {
      return { ok: true, emitted: false, reason: "insufficient_signal" };
    }

    var status = currentSession.hasSave && currentSession.hasObservatoryRevisit ? "completed" : "candidate";
    var runtime = getRuntime();
    if (!runtime || typeof runtime.track !== "function") return { ok: false, reason: "runtime_missing" };

    var result = runtime.track("meaningful_session_completed", {
      timestamp: nowIso(),
      status: status,
      has_save: currentSession.hasSave,
      has_observatory_revisit: currentSession.hasObservatoryRevisit,
      session_elapsed_ms: Math.max(0, Date.now() - currentSession.startedAt),
    });

    if (result && result.ok) currentSession.meaningfulEmitted = true;
    return result;
  }

  window.waywordRetentionEvents = {
    beginSession: function () {
      currentSession = buildSessionTracker();
      return { ok: true };
    },
    markOnboardingCompleted: function (payload) {
      if (hasStorageFlag(ONBOARDING_MARKER_KEY)) {
        return { ok: true, emitted: false, reason: "already_marked" };
      }
      var runtime = getRuntime();
      if (!runtime || typeof runtime.track !== "function") return { ok: false, reason: "runtime_missing" };
      var result = runtime.track("onboarding_completed", {
        timestamp: nowIso(),
        source: payload && payload.source ? String(payload.source) : "begin_button",
      });
      if (result && result.ok) setStorageFlag(ONBOARDING_MARKER_KEY);
      return result;
    },
    markRunSaved: function (payload) {
      currentSession.hasSave = true;
      var runtime = getRuntime();
      if (!runtime || typeof runtime.track !== "function") return { ok: false, reason: "runtime_missing" };
      var result = runtime.track("run_saved", {
        timestamp: nowIso(),
        sync_status: payload && payload.sync_status ? String(payload.sync_status) : "local_only_fallback",
        is_authenticated: Boolean(payload && payload.is_authenticated),
      });
      emitMeaningfulIfEligible();
      return result;
    },
    markObservatoryRevisited: function (payload) {
      currentSession.hasObservatoryRevisit = true;
      var runtime = getRuntime();
      if (!runtime || typeof runtime.track !== "function") return { ok: false, reason: "runtime_missing" };
      var result = runtime.track("observatory_revisited", {
        timestamp: nowIso(),
        surface_name: payload && payload.surface_name ? String(payload.surface_name) : "patterns",
        available: Boolean(payload && payload.available),
        sparse_state: Boolean(payload && payload.sparse_state),
      });
      emitMeaningfulIfEligible();
      return result;
    },
    markMigrationPreviewed: function (payload) {
      var runtime = getRuntime();
      if (!runtime || typeof runtime.track !== "function") return { ok: false, reason: "runtime_missing" };
      return runtime.track("migration_previewed", Object.assign({ timestamp: nowIso() }, payload || {}));
    },
    markMigrationCompleted: function (payload) {
      var runtime = getRuntime();
      if (!runtime || typeof runtime.track !== "function") return { ok: false, reason: "runtime_missing" };
      return runtime.track("migration_completed", Object.assign({ timestamp: nowIso() }, payload || {}));
    },
    markMigrationFailed: function (payload) {
      var runtime = getRuntime();
      if (!runtime || typeof runtime.track !== "function") return { ok: false, reason: "runtime_missing" };
      return runtime.track("migration_failed", Object.assign({ timestamp: nowIso() }, payload || {}));
    },
    markMigrationSkippedUnverifiedRls: function () {
      var runtime = getRuntime();
      if (!runtime || typeof runtime.track !== "function") return { ok: false, reason: "runtime_missing" };
      return runtime.track("migration_skipped_unverified_rls", { timestamp: nowIso(), status: "skipped_unverified_rls" });
    },
  };
})();

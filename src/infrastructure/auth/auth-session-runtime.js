(function () {
  var DRAFT_SNAPSHOT_KEY = "wayword-auth-draft-snapshot";
  var initialized = false;
  var currentSession = null;

  function safeCall(fn, fallback) {
    try {
      return fn();
    } catch (_) {
      return fallback;
    }
  }

  function writeDraftSnapshot(getDraftText) {
    if (typeof getDraftText !== "function") return;
    var text = String(getDraftText() || "");
    if (!text.trim()) return;
    safeCall(function () {
      localStorage.setItem(DRAFT_SNAPSHOT_KEY, text);
    });
  }

  function consumeDraftSnapshot() {
    var snapshot = safeCall(function () {
      return localStorage.getItem(DRAFT_SNAPSHOT_KEY) || "";
    }, "");
    safeCall(function () {
      localStorage.removeItem(DRAFT_SNAPSHOT_KEY);
    });
    return String(snapshot || "");
  }

  function buildMeaningfulSessionEvent(session) {
    return {
      kind: "auth_session",
      userId: session && session.user ? session.user.id || "" : "",
      occurredAt: new Date().toISOString(),
    };
  }

  function readHashParams() {
    var rawHash = String(window.location && window.location.hash ? window.location.hash : "");
    if (!rawHash || rawHash === "#") return null;
    var hash = rawHash.charAt(0) === "#" ? rawHash.slice(1) : rawHash;
    if (!hash.trim()) return null;
    return new URLSearchParams(hash);
  }

  function hasMagicLinkHashTokens() {
    var params = readHashParams();
    if (!params) return false;
    return Boolean(params.get("access_token") && params.get("refresh_token"));
  }

  function clearSensitiveAuthHash() {
    try {
      var path = String(window.location.pathname || "/");
      var search = String(window.location.search || "");
      if (window.history && typeof window.history.replaceState === "function") {
        window.history.replaceState({}, document.title, path + search);
        return;
      }
      window.location.hash = "";
    } catch (_) {
      // Ignore URL cleanup failures.
    }
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function isLocalHostName(hostname) {
    var safeHost = String(hostname || "").toLowerCase();
    return safeHost === "localhost" || safeHost === "127.0.0.1";
  }

  function buildEmailRedirectTo() {
    var locationObj = window.location || {};
    var origin = String(locationObj.origin || "").trim();
    var pathname = String(locationObj.pathname || "/");
    if (!pathname) pathname = "/";

    if (origin) {
      var hostname = String(locationObj.hostname || "").trim();
      if (isLocalHostName(hostname)) {
        return origin + pathname;
      }
      if (origin.indexOf("http://") === 0 || origin.indexOf("https://") === 0) {
        return origin + pathname;
      }
    }

    return "https://wayword.me" + pathname;
  }

  async function readSessionWithRetry(supabase, attempts, delayMs) {
    var lastResult = null;
    for (var idx = 0; idx < attempts; idx += 1) {
      var result = await supabase.auth.getSession();
      lastResult = result;
      if (result && result.data && result.data.session) return result;
      if (idx < attempts - 1) await wait(delayMs);
    }
    return lastResult;
  }

  function init(input) {
    if (initialized) return;
    initialized = true;

    var supabase = window.waywordSupabaseClient && window.waywordSupabaseClient.getClient
      ? window.waywordSupabaseClient.getClient()
      : null;
    if (!supabase) {
      if (typeof input.onStatus === "function") {
        input.onStatus({ mode: "local-only", reason: "supabase_not_configured" });
      }
      return;
    }

    var getDraftText = input.getDraftText;
    var setDraftText = input.setDraftText;

    function handleAuthError(err) {
      if (!err) return;
      writeDraftSnapshot(getDraftText);
      console.warn("wayword: auth runtime encountered an error", err);
      if (typeof input.onAuthError === "function") input.onAuthError(err);
    }

    var needsHashProcessing = hasMagicLinkHashTokens();
    var initialSessionPromise = needsHashProcessing
      ? readSessionWithRetry(supabase, 5, 200).finally(function () {
          clearSensitiveAuthHash();
        })
      : supabase.auth.getSession();

    initialSessionPromise.then(function (result) {
      if (result && result.error) {
        handleAuthError(result.error);
        return;
      }
      currentSession = result && result.data ? result.data.session || null : null;
      if (typeof input.onStatus === "function") {
        input.onStatus({ mode: "supabase", hasSession: Boolean(currentSession) });
      }
    });

    supabase.auth.onAuthStateChange(function (event, session) {
      currentSession = session || null;

      if (event === "SIGNED_OUT") {
        writeDraftSnapshot(getDraftText);
      }

      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && typeof setDraftText === "function") {
        var snapshot = consumeDraftSnapshot();
        if (snapshot.trim()) {
          setDraftText(snapshot);
        }
      }

      if (typeof input.onAuthStateChange === "function") {
        input.onAuthStateChange({ event: event, hasSession: Boolean(currentSession) });
      }

      if (typeof input.onRetentionHook === "function" && currentSession) {
        input.onRetentionHook(buildMeaningfulSessionEvent(currentSession));
      }
    });

    safeCall(function () {
      window.addEventListener("beforeunload", function () {
        writeDraftSnapshot(getDraftText);
      });
    });
  }

  function signInWithMagicLink(email) {
    var supabase = window.waywordSupabaseClient && window.waywordSupabaseClient.getClient
      ? window.waywordSupabaseClient.getClient()
      : null;
    if (!supabase) {
      return Promise.resolve({ error: new Error("Supabase auth is not configured") });
    }
    var safeEmail = String(email || "").trim();
    var emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail);
    var redirectTo = buildEmailRedirectTo();

    try {
      console.info("[wayword-auth] signInWithMagicLink:start", {
        hasEmail: Boolean(safeEmail),
        emailLooksValid: emailLooksValid,
        hasRedirectTo: Boolean(redirectTo),
      });
    } catch (_) {
      // Ignore diagnostics failures.
    }

    return supabase.auth
      .signInWithOtp({
        email: safeEmail,
        options: {
          emailRedirectTo: redirectTo,
        },
      })
      .then(function (result) {
        var err = result && result.error ? result.error : null;
        try {
          console.info("[wayword-auth] signInWithMagicLink:result", {
            ok: !err,
            errorCode: err ? err.code || "" : "",
            errorStatus: err ? err.status || "" : "",
            errorMessage: err ? err.message || "" : "",
          });
        } catch (_) {
          // Ignore diagnostics failures.
        }
        return result;
      });
  }

  function signOut() {
    var supabase = window.waywordSupabaseClient && window.waywordSupabaseClient.getClient
      ? window.waywordSupabaseClient.getClient()
      : null;
    if (!supabase) {
      return Promise.resolve({ error: null });
    }
    return supabase.auth.signOut();
  }

  window.waywordAuthSessionRuntime = {
    init: init,
    signInWithMagicLink: signInWithMagicLink,
    signOut: signOut,
    getCurrentSession: function () {
      return currentSession;
    },
  };
})();

(function () {
  function pickString(value) {
    return typeof value === "string" && value.trim() ? value.trim() : "";
  }

  function readEnvSource() {
    var source = window.__WAYWORD_ENV;
    if (!source || typeof source !== "object") return {};
    return source;
  }

  var source = readEnvSource();
  var supabaseUrl = pickString(source.SUPABASE_URL);
  var supabaseAnonKey = pickString(source.SUPABASE_ANON_KEY);
  var supabaseRlsVerified = source.SUPABASE_RLS_VERIFIED;

  window.waywordEnv = Object.freeze({
    SUPABASE_URL: supabaseUrl,
    SUPABASE_ANON_KEY: supabaseAnonKey,
    SUPABASE_RLS_VERIFIED: supabaseRlsVerified,
    isSupabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey),
  });

  // Temporary runtime diagnostics: boolean-only, no secret values.
  try {
    console.info("[wayword-env] Runtime env check", {
      hasSupabaseUrl: Boolean(supabaseUrl),
      hasSupabaseAnonKey: Boolean(supabaseAnonKey),
      isSupabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey),
      hasWaywordEnvSource: Boolean(source && typeof source === "object"),
    });
  } catch (_) {
    // Ignore diagnostics failures.
  }
})();

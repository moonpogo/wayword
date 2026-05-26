(function () {
  var clientSingleton = null;

  function getCreateClient() {
    if (!window.supabase || typeof window.supabase.createClient !== "function") return null;
    return window.supabase.createClient;
  }

  function createClientIfConfigured() {
    if (clientSingleton) return clientSingleton;

    var env = window.waywordEnv || {};
    try {
      console.info("[wayword-auth] Supabase configuration gate", {
        hasSupabaseUrl: Boolean(env.SUPABASE_URL),
        hasSupabaseAnonKey: Boolean(env.SUPABASE_ANON_KEY),
        isSupabaseConfigured: Boolean(env.isSupabaseConfigured),
      });
    } catch (_) {
      // Ignore diagnostics failures.
    }
    if (!env.isSupabaseConfigured) return null;

    var createClient = getCreateClient();
    if (!createClient) {
      console.warn("wayword: supabase-js runtime is unavailable; auth scaffold remains disabled");
      return null;
    }

    clientSingleton = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });

    return clientSingleton;
  }

  window.waywordSupabaseClient = {
    getClient: createClientIfConfigured,
  };
})();

(function () {
  function safeString(value) {
    return String(value == null ? "" : value).trim();
  }

  function pickIsoFromRun(run) {
    var savedAtMs = Number(run && run.savedAt);
    if (Number.isFinite(savedAtMs) && savedAtMs > 0) return new Date(savedAtMs).toISOString();

    var timestampMs = Number(run && run.timestamp);
    if (Number.isFinite(timestampMs) && timestampMs > 0) return new Date(timestampMs).toISOString();

    var startedAtMs = Number(run && run.startedAt);
    if (Number.isFinite(startedAtMs) && startedAtMs > 0) return new Date(startedAtMs).toISOString();

    return new Date().toISOString();
  }

  function mapRunToInsert(run, userId) {
    return {
      user_id: userId,
      writing_text: String(run && (run.originalText || run.text || "")),
      prompt_id: safeString(run && run.promptId) || null,
      prompt_family: safeString(run && run.promptFamily) || null,
      mirror_payload: null,
      local_created_at: pickIsoFromRun(run),
    };
  }

  async function upsertRun(supabase, run, userId) {
    var payload = mapRunToInsert(run, userId);
    return supabase.from("runs").insert(payload).select("id").single();
  }

  async function listServerRunsForUser(supabase, userId) {
    return supabase
      .from("runs")
      .select("id,user_id,prompt_id,prompt_family,writing_text,local_created_at,created_at,updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
  }

  async function exportRunsForUser(supabase, userId) {
    return supabase
      .from("runs")
      .select("id,user_id,prompt_id,prompt_family,writing_text,local_created_at,created_at,updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
  }

  async function deleteRunForUser(supabase, userId, runId) {
    var id = safeString(runId);
    if (!id) return { data: null, error: new Error("missing_run_id") };
    return supabase
      .from("runs")
      .delete()
      .eq("user_id", userId)
      .eq("id", id);
  }

  async function deleteAllRunsForUser(supabase, userId) {
    return supabase
      .from("runs")
      .delete()
      .eq("user_id", userId);
  }

  window.waywordSupabaseRunStore = {
    upsertRun: upsertRun,
    listServerRunsForUser: listServerRunsForUser,
    exportRunsForUser: exportRunsForUser,
    deleteRunForUser: deleteRunForUser,
    deleteAllRunsForUser: deleteAllRunsForUser,
  };
})();

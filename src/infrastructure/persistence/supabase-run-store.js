(function () {
  function mapRunToInsert(run, userId) {
    var timestampMs = Number(run && run.timestamp);
    var savedAtMs = Number(run && run.savedAt);
    var startedAtMs = Number(run && (run.startedAt || 0));

    var startedAtIso = Number.isFinite(startedAtMs) && startedAtMs > 0
      ? new Date(startedAtMs).toISOString()
      : (Number.isFinite(timestampMs) && timestampMs > 0 ? new Date(timestampMs).toISOString() : null);

    var endedAtIso = Number.isFinite(savedAtMs) && savedAtMs > 0 ? new Date(savedAtMs).toISOString() : null;
    var savedAtIso = endedAtIso || (Number.isFinite(timestampMs) && timestampMs > 0 ? new Date(timestampMs).toISOString() : new Date().toISOString());

    var fingerprint = window.waywordRunMigrationUtils && typeof window.waywordRunMigrationUtils.buildRunFingerprint === "function"
      ? window.waywordRunMigrationUtils.buildRunFingerprint(run)
      : "";

    var migratedAtIso = new Date().toISOString();

    return {
      user_id: userId,
      writing_text: String(run && (run.originalText || run.text || "")),
      prompt_id: String(run && run.promptId ? run.promptId : "") || null,
      prompt_family: String(run && run.promptFamily ? run.promptFamily : "") || null,
      started_at: startedAtIso,
      ended_at: endedAtIso,
      saved_at: savedAtIso,
      save_source: "authenticated",
      continuity_state: "active",
      migration_fingerprint: fingerprint || null,
      client_run_id: String(run && run.runId ? run.runId : "") || null,
      migration_source: "local_storage",
      migrated_at: migratedAtIso,
      migration_batch_id: String(run && run.migrationBatchId ? run.migrationBatchId : "") || null,
      word_count: Number.isFinite(Number(run && run.wordCount)) ? Number(run.wordCount) : null,
    };
  }

  async function upsertRun(supabase, run, userId) {
    var payload = mapRunToInsert(run, userId);
    var query = supabase.from("runs").insert(payload).select("id").single();
    var result = await query;
    return result;
  }

  async function listServerRunsForUser(supabase, userId) {
    var query = supabase
      .from("runs")
      .select("id,user_id,client_run_id,migration_fingerprint,writing_text,saved_at,word_count")
      .eq("user_id", userId)
      .order("saved_at", { ascending: false });
    var result = await query;
    return result;
  }

  async function exportRunsForUser(supabase, userId) {
    var query = supabase
      .from("runs")
      .select("id,user_id,client_run_id,migration_fingerprint,prompt_id,prompt_family,writing_text,saved_at,word_count,created_at,updated_at,migration_source,migrated_at,migration_batch_id,continuity_state")
      .eq("user_id", userId)
      .order("saved_at", { ascending: true });
    return query;
  }

  async function deleteRunForUser(supabase, userId, runId) {
    var id = String(runId == null ? "" : runId).trim();
    if (!id) return { data: null, error: new Error("missing_run_id") };
    var query = supabase
      .from("runs")
      .delete()
      .eq("user_id", userId)
      .eq("id", id);
    return query;
  }

  async function deleteAllRunsForUser(supabase, userId) {
    var query = supabase
      .from("runs")
      .delete()
      .eq("user_id", userId);
    return query;
  }

  window.waywordSupabaseRunStore = {
    upsertRun: upsertRun,
    listServerRunsForUser: listServerRunsForUser,
    exportRunsForUser: exportRunsForUser,
    deleteRunForUser: deleteRunForUser,
    deleteAllRunsForUser: deleteAllRunsForUser,
  };
})();

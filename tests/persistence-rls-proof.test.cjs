const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

const migrationPath = path.join(
  process.cwd(),
  "supabase/migrations/20260611224500_harden_runs_rls.sql"
);

test("runs RLS proof migration is checked in with owner-only policies", () => {
  const sql = fs.readFileSync(migrationPath, "utf8");

  assert.match(sql, /alter table if exists public\.runs enable row level security;/);
  assert.match(sql, /create policy "runs_select_own"/);
  assert.match(sql, /create policy "runs_insert_own"/);
  assert.match(sql, /create policy "runs_update_own"/);
  assert.match(sql, /create policy "runs_delete_own"/);
  assert.match(sql, /auth\.uid\(\) = user_id/);
});

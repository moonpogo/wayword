#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(ROOT, "env.runtime.js");

function pick(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function buildPayload() {
  const payload = {};
  const supabaseUrl = pick("SUPABASE_URL");
  const supabaseAnonKey = pick("SUPABASE_ANON_KEY");
  const supabaseRlsVerified = pick("SUPABASE_RLS_VERIFIED");

  if (supabaseUrl) payload.SUPABASE_URL = supabaseUrl;
  if (supabaseAnonKey) payload.SUPABASE_ANON_KEY = supabaseAnonKey;
  if (supabaseRlsVerified) payload.SUPABASE_RLS_VERIFIED = supabaseRlsVerified;

  return payload;
}

function buildScript(payload) {
  return [
    "// Generated at build/deploy time. Do not put service-role or private keys in browser env.",
    "(function () {",
    "  var payload = " + JSON.stringify(payload) + ";",
    "  var current = window.__WAYWORD_ENV && typeof window.__WAYWORD_ENV === 'object' ? window.__WAYWORD_ENV : {};",
    "  window.__WAYWORD_ENV = Object.assign({}, current, payload);",
    "})();",
    "",
  ].join("\n");
}

const payload = buildPayload();
fs.writeFileSync(OUT_PATH, buildScript(payload), "utf8");

const masked = {
  hasSupabaseUrl: Boolean(payload.SUPABASE_URL),
  hasSupabaseAnonKey: Boolean(payload.SUPABASE_ANON_KEY),
  hasSupabaseRlsVerified: Object.prototype.hasOwnProperty.call(payload, "SUPABASE_RLS_VERIFIED"),
};

console.log("Generated env.runtime.js", masked);

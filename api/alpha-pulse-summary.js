"use strict";

const { loadAlphaPulseDashboardSummary } = require("../scripts/alpha-pulse-summary.js");

function readHeader(req, name) {
  const headers = req && req.headers && typeof req.headers === "object" ? req.headers : {};
  const direct = headers[name];
  if (typeof direct === "string") return direct;
  const lower = headers[String(name || "").toLowerCase()];
  return typeof lower === "string" ? lower : "";
}

function readBearerToken(req) {
  const authorization = readHeader(req, "authorization").trim();
  if (!authorization) return "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? String(match[1] || "").trim() : "";
}

function isAuthorizedRequest(req, env = process.env) {
  const expected = String(env.WAYWORD_ALPHA_PULSE_TOKEN || "").trim();
  if (!expected) return false;
  const bearer = readBearerToken(req);
  return Boolean(bearer) && bearer === expected;
}

function writeJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function createAlphaPulseSummaryHandler(options = {}) {
  const loadSummary =
    typeof options.loadAlphaPulseDashboardSummary === "function"
      ? options.loadAlphaPulseDashboardSummary
      : loadAlphaPulseDashboardSummary;
  const env = options.env || process.env;

  return async function handler(req, res) {
    if (req.method && req.method !== "GET") {
      writeJson(res, 405, { ok: false, error: "method_not_allowed" });
      return;
    }

    if (!isAuthorizedRequest(req, env)) {
      writeJson(res, 404, { ok: false, error: "not_found" });
      return;
    }

    try {
      const rawDays = req.query && Object.prototype.hasOwnProperty.call(req.query, "days")
        ? req.query.days
        : undefined;
      const days = rawDays == null ? 7 : rawDays;
      const summary = await loadSummary({ days });
      writeJson(res, 200, summary);
    } catch (_) {
      writeJson(res, 500, {
        ok: false,
        error: "alpha_pulse_summary_unavailable",
      });
    }
  }
}

const handler = createAlphaPulseSummaryHandler();

module.exports = handler;
module.exports.createAlphaPulseSummaryHandler = createAlphaPulseSummaryHandler;
module.exports.isAuthorizedRequest = isAuthorizedRequest;

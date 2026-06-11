"use strict";

const { loadAlphaPulseDashboardSummary } = require("../scripts/alpha-pulse-summary.js");

module.exports = async function handler(req, res) {
  if (req.method && req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ ok: false, error: "method_not_allowed" }));
    return;
  }

  try {
    const rawDays = req.query && Object.prototype.hasOwnProperty.call(req.query, "days")
      ? req.query.days
      : undefined;
    const days = rawDays == null ? 7 : rawDays;
    const summary = await loadAlphaPulseDashboardSummary({ days });
    res.statusCode = 200;
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(summary));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        ok: false,
        error: error && error.message ? String(error.message) : "alpha_pulse_summary_failed",
      })
    );
  }
};

const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");

const { createServer } = require("../scripts/preview-server.js");

function requestJson(port, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path,
        method: "GET",
        headers,
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body,
          });
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

test("preview server alpha pulse route fails closed without bearer token", async () => {
  const server = createServer({
    env: { WAYWORD_ALPHA_PULSE_TOKEN: "expected-token" },
    alphaPulseSummaryHandler: async (req, res) => {
      const { createAlphaPulseSummaryHandler } = require("../api/alpha-pulse-summary.js");
      return createAlphaPulseSummaryHandler({
        env: { WAYWORD_ALPHA_PULSE_TOKEN: "expected-token" },
        loadAlphaPulseDashboardSummary: async () => ({ ok: true }),
      })(req, res);
    },
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;

  try {
    const response = await requestJson(port, "/api/alpha-pulse-summary");
    assert.equal(response.statusCode, 404);
    assert.deepEqual(JSON.parse(response.body), { ok: false, error: "not_found" });
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

test("preview server alpha pulse route keeps internal errors generic", async () => {
  const server = createServer({
    env: { WAYWORD_ALPHA_PULSE_TOKEN: "expected-token" },
    alphaPulseSummaryHandler: async (req, res) => {
      const { createAlphaPulseSummaryHandler } = require("../api/alpha-pulse-summary.js");
      return createAlphaPulseSummaryHandler({
        env: { WAYWORD_ALPHA_PULSE_TOKEN: "expected-token" },
        loadAlphaPulseDashboardSummary: async () => {
          throw new Error("sensitive detail");
        },
      })(req, res);
    },
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;

  try {
    const response = await requestJson(port, "/api/alpha-pulse-summary", {
      authorization: "Bearer expected-token",
    });
    assert.equal(response.statusCode, 500);
    assert.deepEqual(JSON.parse(response.body), {
      ok: false,
      error: "alpha_pulse_summary_unavailable",
    });
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});

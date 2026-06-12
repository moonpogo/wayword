const assert = require("node:assert/strict");
const test = require("node:test");

const {
  createAlphaPulseSummaryHandler,
  isAuthorizedRequest,
} = require("../api/alpha-pulse-summary.js");

function createResponseRecorder() {
  return {
    statusCode: 0,
    headers: {},
    body: "",
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(body) {
      this.body = typeof body === "string" ? body : "";
    },
  };
}

test("alpha pulse route rejects requests without the internal bearer token", async () => {
  const handler = createAlphaPulseSummaryHandler({
    env: { WAYWORD_ALPHA_PULSE_TOKEN: "expected-token" },
    loadAlphaPulseDashboardSummary: async () => ({ ok: true }),
  });
  const res = createResponseRecorder();

  await handler({ method: "GET", headers: {}, query: {} }, res);

  assert.equal(res.statusCode, 404);
  assert.deepEqual(JSON.parse(res.body), { ok: false, error: "not_found" });
});

test("alpha pulse route accepts matching internal bearer token", async () => {
  const handler = createAlphaPulseSummaryHandler({
    env: { WAYWORD_ALPHA_PULSE_TOKEN: "expected-token" },
    loadAlphaPulseDashboardSummary: async ({ days }) => ({ ok: true, days }),
  });
  const res = createResponseRecorder();

  await handler(
    {
      method: "GET",
      headers: { authorization: "Bearer expected-token" },
      query: { days: "14" },
    },
    res
  );

  assert.equal(res.statusCode, 200);
  assert.deepEqual(JSON.parse(res.body), { ok: true, days: "14" });
});

test("alpha pulse auth helper only accepts exact bearer token matches", () => {
  assert.equal(
    isAuthorizedRequest(
      { headers: { authorization: "Bearer expected-token" } },
      { WAYWORD_ALPHA_PULSE_TOKEN: "expected-token" }
    ),
    true
  );
  assert.equal(
    isAuthorizedRequest(
      { headers: { authorization: "Bearer wrong-token" } },
      { WAYWORD_ALPHA_PULSE_TOKEN: "expected-token" }
    ),
    false
  );
  assert.equal(isAuthorizedRequest({ headers: {} }, { WAYWORD_ALPHA_PULSE_TOKEN: "" }), false);
});

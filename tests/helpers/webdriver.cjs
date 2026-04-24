const { spawn } = require("child_process");
const http = require("http");
const net = require("net");

const ELEMENT_KEY = "element-6066-11e4-a52e-4f735466cecf";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestJson(method, targetUrl, body) {
  const url = new URL(targetUrl);
  const payload = body == null ? null : JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: `${url.pathname}${url.search}`,
        method,
        headers: {
          Accept: "application/json",
          ...(payload
            ? {
                "Content-Length": Buffer.byteLength(payload),
                "Content-Type": "application/json; charset=utf-8",
              }
            : {}),
        },
      },
      (res) => {
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          let parsed = raw;
          if (raw) {
            try {
              parsed = JSON.parse(raw);
            } catch (_) {}
          }

          const statusCode = Number(res.statusCode) || 0;
          if (statusCode >= 400) {
            const err = new Error(webdriverErrorMessage(parsed) || raw || `${method} ${targetUrl} failed`);
            err.statusCode = statusCode;
            err.response = parsed;
            reject(err);
            return;
          }

          resolve(parsed);
        });
      }
    );

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function webdriverValue(payload) {
  if (payload && typeof payload === "object" && Object.prototype.hasOwnProperty.call(payload, "value")) {
    return payload.value;
  }
  return payload;
}

function webdriverErrorMessage(payload) {
  const value = webdriverValue(payload);
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && typeof value.message === "string") return value.message;
  return "";
}

function classifySafariSkip(message) {
  const text = String(message || "").trim();
  if (!text) return "";
  if (/Operation not permitted/i.test(text)) {
    return "Safari WebDriver could not start on this machine (`Operation not permitted`).";
  }
  if (/Allow Remote Automation/i.test(text) || /remote automation/i.test(text)) {
    return "Safari WebDriver requires Safari Develop > Allow Remote Automation to be enabled.";
  }
  if (/not found|ENOENT|No such file/i.test(text)) {
    return "Safari WebDriver is unavailable because `safaridriver` is not installed.";
  }
  return "";
}

async function reservePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = address && typeof address === "object" ? address.port : 0;
      server.close((closeErr) => {
        if (closeErr) {
          reject(closeErr);
          return;
        }
        resolve(port);
      });
    });
  });
}

async function waitForDriverReady(baseUrl, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const payload = await requestJson("GET", `${baseUrl}/status`);
      const value = webdriverValue(payload);
      if (value && (value.ready === true || typeof value.message === "string")) {
        return;
      }
    } catch (_) {}
    await delay(100);
  }
  throw new Error(`Timed out waiting for WebDriver at ${baseUrl}`);
}

class WebDriverSession {
  constructor(baseUrl, sessionId) {
    this.baseUrl = baseUrl;
    this.sessionId = sessionId;
  }

  async command(method, route, body) {
    return await requestJson(method, `${this.baseUrl}${route}`, body);
  }

  async setWindowRect(rect) {
    await this.command("POST", `/session/${this.sessionId}/window/rect`, rect);
  }

  async navigate(url) {
    await this.command("POST", `/session/${this.sessionId}/url`, { url });
  }

  async execute(script, args = []) {
    const payload = await this.command("POST", `/session/${this.sessionId}/execute/sync`, {
      args,
      script,
    });
    return webdriverValue(payload);
  }

  async findElement(selector) {
    const payload = await this.command("POST", `/session/${this.sessionId}/element`, {
      using: "css selector",
      value: selector,
    });
    const value = webdriverValue(payload);
    const elementId = value && typeof value === "object" ? value[ELEMENT_KEY] || value.ELEMENT : null;
    if (!elementId) {
      throw new Error(`WebDriver element lookup returned no element id for selector: ${selector}`);
    }
    return elementId;
  }

  async click(selector) {
    const elementId = await this.findElement(selector);
    await this.command("POST", `/session/${this.sessionId}/element/${elementId}/click`, {});
  }

  async waitFor(label, predicate, options = {}) {
    const timeoutMs = Number(options.timeoutMs) || 10000;
    const intervalMs = Number(options.intervalMs) || 100;
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      const value = await predicate();
      if (value) return value;
      await delay(intervalMs);
    }

    throw new Error(`Timed out waiting for ${label}`);
  }

  async close() {
    try {
      await this.command("DELETE", `/session/${this.sessionId}`);
    } catch (_) {}
  }
}

async function startSafariWebDriver(options = {}) {
  const host = options.host || "127.0.0.1";
  const port = options.port || (await reservePort());
  const baseUrl = `http://${host}:${port}`;
  const startupTimeoutMs = Number(options.startupTimeoutMs) || 6000;

  let stdout = "";
  let stderr = "";

  const child = spawn("safaridriver", ["-p", String(port)], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => {
    stdout += String(chunk);
  });
  child.stderr.on("data", (chunk) => {
    stderr += String(chunk);
  });

  const exitPromise = new Promise((resolve) => {
    child.once("exit", (code, signal) => {
      resolve({ code, signal });
    });
  });

  try {
    await waitForDriverReady(baseUrl, startupTimeoutMs);
  } catch (readyErr) {
    const exit = await Promise.race([exitPromise, delay(200).then(() => null)]);
    const combined = [stderr.trim(), stdout.trim(), exit ? `exit ${exit.code}` : "", readyErr.message]
      .filter(Boolean)
      .join(" ");
    const skipReason =
      classifySafariSkip(combined) || `Safari WebDriver failed to start cleanly: ${combined}`;

    if (!child.killed) {
      child.kill("SIGTERM");
      await Promise.race([exitPromise, delay(1000)]);
    }

    return {
      baseUrl,
      close: async () => {},
      logs: () => ({ stderr, stdout }),
      newSession: async () => ({ close: async () => {}, session: null, skipReason }),
      skipReason,
    };
  }

  return {
    baseUrl,
    skipReason: "",
    logs() {
      return { stderr, stdout };
    },
    async newSession() {
      try {
        const payload = await requestJson("POST", `${baseUrl}/session`, {
          capabilities: {
            alwaysMatch: {
              browserName: "safari",
            },
          },
        });
        const value = webdriverValue(payload);
        const sessionId =
          (value && typeof value === "object" && typeof value.sessionId === "string" && value.sessionId) ||
          (payload && typeof payload.sessionId === "string" && payload.sessionId) ||
          "";

        if (!sessionId) {
          throw new Error("WebDriver session response did not include a session id");
        }

        const session = new WebDriverSession(baseUrl, sessionId);
        return {
          close: async () => {
            await session.close();
          },
          session,
          skipReason: "",
        };
      } catch (sessionErr) {
        const message =
          webdriverErrorMessage(sessionErr.response) || sessionErr.message || "Unable to create Safari session";
        return {
          close: async () => {},
          session: null,
          skipReason:
            classifySafariSkip(message) || `Unable to create a Safari WebDriver session: ${message}`,
        };
      }
    },
    async close() {
      if (!child.killed) {
        child.kill("SIGTERM");
      }
      await Promise.race([exitPromise, delay(1500)]);
      if (!child.killed) {
        child.kill("SIGKILL");
      }
    },
  };
}

module.exports = {
  classifySafariSkip,
  startSafariWebDriver,
};

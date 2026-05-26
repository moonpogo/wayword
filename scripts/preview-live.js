#!/usr/bin/env node
const { spawn, spawnSync } = require("child_process");
const http = require("http");
const path = require("path");

const HOST = "127.0.0.1";
const PORT = 3001;
const HEALTH_PATH = "/__health";
const START_TIMEOUT_MS = 8000;
const POLL_INTERVAL_MS = 150;

function killExistingPreview() {
  spawnSync("pkill", ["-f", "node scripts/preview-server.js"], { stdio: "ignore" });
}

function checkHealth() {
  return new Promise((resolve) => {
    const req = http.get(
      {
        hostname: HOST,
        port: PORT,
        path: HEALTH_PATH,
        timeout: 1200,
      },
      (res) => {
        res.resume();
        resolve(res.statusCode === 200);
      }
    );
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.on("error", () => resolve(false));
  });
}

async function waitForHealth() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < START_TIMEOUT_MS) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await checkHealth();
    if (ok) return true;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return false;
}

async function main() {
  killExistingPreview();

  const child = spawn("node", [path.join("scripts", "preview-server.js")], {
    stdio: "inherit",
  });

  const shutdown = (signal) => {
    if (!child.killed) child.kill(signal);
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  child.on("exit", (code) => {
    process.exit(code || 0);
  });

  const healthy = await waitForHealth();
  if (!healthy) {
    console.error("Preview failed health check on http://127.0.0.1:3001/__health");
    if (!child.killed) child.kill("SIGTERM");
    process.exit(1);
  }

  console.log("Wayword preview confirmed at http://127.0.0.1:3001/index.html");
}

main().catch((err) => {
  console.error(err && err.message ? err.message : String(err));
  process.exit(1);
});

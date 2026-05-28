#!/usr/bin/env node
const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const http = require("http");
const path = require("path");

const HOST = "127.0.0.1";
const PORT = 3001;
const HEALTH_PATH = "/__health";
const INDEX_PATH = "/index.html";
const START_TIMEOUT_MS = 12000;
const POLL_INTERVAL_MS = 200;
const LOG_PATH = "/tmp/wayword-preview.log";

function probe(pathname) {
  return new Promise((resolve) => {
    const req = http.get(
      {
        hostname: HOST,
        port: PORT,
        path: pathname,
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

async function isReady() {
  const [healthOk, indexOk] = await Promise.all([probe(HEALTH_PATH), probe(INDEX_PATH)]);
  return healthOk && indexOk;
}

function killExistingPreview() {
  spawnSync("pkill", ["-f", "node scripts/preview-server.js"], { stdio: "ignore" });
}

function startDetachedPreview() {
  fs.closeSync(fs.openSync(LOG_PATH, "a"));
  const out = fs.openSync(LOG_PATH, "a");
  const child = spawn("node", [path.join("scripts", "preview-server.js")], {
    detached: true,
    stdio: ["ignore", out, out],
  });
  child.unref();
}

async function waitUntilReady(timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    // eslint-disable-next-line no-await-in-loop
    const ready = await isReady();
    if (ready) return true;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  return false;
}

async function main() {
  if (await isReady()) {
    console.log(`Wayword preview ready at http://${HOST}:${PORT}${INDEX_PATH}`);
    return;
  }

  killExistingPreview();
  startDetachedPreview();

  const ready = await waitUntilReady(START_TIMEOUT_MS);
  if (!ready) {
    console.error(`Preview failed readiness checks (${HEALTH_PATH} + ${INDEX_PATH}).`);
    console.error(`See logs: ${LOG_PATH}`);
    process.exit(1);
  }

  console.log(`Wayword preview ready at http://${HOST}:${PORT}${INDEX_PATH}`);
}

main().catch((error) => {
  console.error(error && error.message ? error.message : String(error));
  process.exit(1);
});

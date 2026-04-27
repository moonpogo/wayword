#!/usr/bin/env node
const fs = require("fs");
const http = require("http");
const path = require("path");

const HOST = "127.0.0.1";
const ROOT = path.resolve(__dirname, "..");
const DEFAULT_PORT = Number(process.env.PORT) || 3001;
const MAX_PORT_ATTEMPTS = 10;

const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

function resolveRequestPath(urlPathname) {
  const decoded = decodeURIComponent(urlPathname.split("?")[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  let targetPath = path.join(ROOT, normalized);
  if (targetPath.endsWith(path.sep)) {
    targetPath = path.join(targetPath, "index.html");
  }
  return targetPath;
}

function sendResponse(res, statusCode, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(statusCode, { "Content-Type": contentType });
  res.end(body);
}

function createServer() {
  return http.createServer((req, res) => {
    const requestUrl = new URL(req.url || "/", `http://${HOST}`);
    let targetPath = resolveRequestPath(requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname);

    if (!targetPath.startsWith(ROOT)) {
      sendResponse(res, 403, "Forbidden");
      return;
    }

    fs.stat(targetPath, (statError, stats) => {
      if (!statError && stats.isDirectory()) {
        targetPath = path.join(targetPath, "index.html");
      }

      fs.readFile(targetPath, (readError, data) => {
        if (readError) {
          if (readError.code === "ENOENT") {
            sendResponse(res, 404, "Not found");
            return;
          }
          sendResponse(res, 500, "Server error");
          return;
        }

        const ext = path.extname(targetPath).toLowerCase();
        sendResponse(res, 200, data, CONTENT_TYPES[ext] || "application/octet-stream");
      });
    });
  });
}

function listenWithFallback(startPort, attemptsRemaining) {
  const server = createServer();
  server.on("error", (error) => {
    if (error && error.code === "EADDRINUSE" && attemptsRemaining > 1) {
      listenWithFallback(startPort + 1, attemptsRemaining - 1);
      return;
    }

    console.error(error && error.message ? error.message : String(error));
    process.exit(1);
  });

  server.listen(startPort, HOST, () => {
    console.log(`Wayword preview running at http://${HOST}:${startPort}/index.html`);
  });
}

listenWithFallback(DEFAULT_PORT, MAX_PORT_ATTEMPTS);

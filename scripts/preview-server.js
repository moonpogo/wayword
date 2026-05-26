#!/usr/bin/env node
const fs = require("fs");
const http = require("http");
const path = require("path");

const HOST = process.env.HOST || "127.0.0.1";
const ROOT = path.resolve(__dirname, "..");
const ENV_PATH = path.join(ROOT, ".env");
const DEFAULT_PORT = Number(process.env.PORT) || 3001;

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
  res.writeHead(statusCode, {
    "Content-Type": contentType,
    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    Pragma: "no-cache",
    Expires: "0",
  });
  res.end(body);
}

function parseDotEnvFile(filePath) {
  try {
    var raw = fs.readFileSync(filePath, "utf8");
    var lines = raw.split(/\r?\n/);
    var out = {};
    for (var i = 0; i < lines.length; i += 1) {
      var line = lines[i];
      if (!line || /^\s*#/.test(line)) continue;
      var idx = line.indexOf("=");
      if (idx <= 0) continue;
      var key = line.slice(0, idx).trim();
      var value = line.slice(idx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      out[key] = value;
    }
    return out;
  } catch (_) {
    return {};
  }
}

function getBrowserEnvPayload() {
  var fromFile = parseDotEnvFile(ENV_PATH);
  function pick(name) {
    var processValue = process.env[name];
    if (typeof processValue === "string" && processValue.trim()) return processValue.trim();
    var fileValue = fromFile[name];
    if (typeof fileValue === "string" && fileValue.trim()) return fileValue.trim();
    return "";
  }

  return {
    SUPABASE_URL: pick("SUPABASE_URL"),
    SUPABASE_ANON_KEY: pick("SUPABASE_ANON_KEY"),
    SUPABASE_RLS_VERIFIED: pick("SUPABASE_RLS_VERIFIED"),
  };
}

function injectRuntimeEnvHtml(htmlText) {
  var payload = getBrowserEnvPayload();
  var injection =
    "\n<script>(function(){var payload=" +
    JSON.stringify(payload) +
    ";var current=window.__WAYWORD_ENV&&typeof window.__WAYWORD_ENV==='object'?window.__WAYWORD_ENV:{};window.__WAYWORD_ENV=Object.assign({}, current, payload);})();</script>\n";
  if (htmlText.includes("window.__WAYWORD_ENV")) return htmlText;
  if (htmlText.includes("</head>")) return htmlText.replace("</head>", injection + "</head>");
  return injection + htmlText;
}

function createServer() {
  return http.createServer((req, res) => {
    const requestUrl = new URL(req.url || "/", `http://${HOST}`);
    if (requestUrl.pathname === "/__health") {
      sendResponse(res, 200, "ok");
      return;
    }
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
        if (ext === ".html") {
          var html = data.toString("utf8");
          sendResponse(res, 200, injectRuntimeEnvHtml(html), CONTENT_TYPES[ext] || "text/html; charset=utf-8");
          return;
        }
        sendResponse(res, 200, data, CONTENT_TYPES[ext] || "application/octet-stream");
      });
    });
  });
}

function startServer(startPort) {
  const server = createServer();
  server.on("error", (error) => {
    if (error && error.code === "EADDRINUSE") {
      console.error(`Port ${startPort} is already in use. Stop the existing preview process and retry.`);
      process.exit(1);
    }

    console.error(error && error.message ? error.message : String(error));
    process.exit(1);
  });

  server.listen(startPort, HOST, () => {
    console.log(`Wayword preview running at http://${HOST}:${startPort}/index.html`);
  });
}

startServer(DEFAULT_PORT);

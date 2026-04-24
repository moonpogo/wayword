const fs = require("fs");
const http = require("http");
const path = require("path");
const { ROOT } = require("./bundle-require.cjs");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
};

function toContentType(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function resolveSafePath(rootDir, pathname) {
  const decoded = decodeURIComponent(pathname || "/");
  const requestPath = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  const absPath = path.resolve(rootDir, requestPath);
  const rel = path.relative(rootDir, absPath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return null;
  }
  return absPath;
}

async function startStaticServer(options = {}) {
  const rootDir = path.resolve(options.rootDir || ROOT);
  const host = options.host || "127.0.0.1";
  const port = Number.isFinite(Number(options.port)) ? Number(options.port) : 0;

  const server = http.createServer((req, res) => {
    const requestUrl = new URL(req.url || "/", `http://${host}`);
    const absPath = resolveSafePath(rootDir, requestUrl.pathname);
    if (!absPath) {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Forbidden");
      return;
    }

    fs.stat(absPath, (statErr, stats) => {
      if (statErr || !stats.isFile()) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not found");
        return;
      }

      res.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type": toContentType(absPath),
      });
      fs.createReadStream(absPath).pipe(res);
    });
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen({ host, port }, () => resolve());
  });

  const address = server.address();
  const actualPort = address && typeof address === "object" ? address.port : port;

  return {
    host,
    origin: `http://${host}:${actualPort}`,
    port: actualPort,
    close() {
      return new Promise((resolve, reject) => {
        server.close((closeErr) => {
          if (closeErr) {
            reject(closeErr);
            return;
          }
          resolve();
        });
      });
    },
  };
}

module.exports = {
  startStaticServer,
};

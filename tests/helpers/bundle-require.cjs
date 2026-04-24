const crypto = require("crypto");
const esbuild = require("esbuild");
const fs = require("fs");
const os = require("os");
const path = require("path");

const ROOT = path.resolve(__dirname, "..", "..");
const bundleCache = new Map();

function bundleRequire(entryRelativePath) {
  const entryAbs = path.join(ROOT, entryRelativePath);
  if (bundleCache.has(entryAbs)) {
    return bundleCache.get(entryAbs);
  }

  const hash = crypto.createHash("sha1").update(entryAbs).digest("hex").slice(0, 10);
  const outdir = fs.mkdtempSync(path.join(os.tmpdir(), "wayword-test-bundle-"));
  const outfile = path.join(outdir, `${hash}.cjs`);

  esbuild.buildSync({
    absWorkingDir: ROOT,
    entryPoints: [entryAbs],
    bundle: true,
    platform: "node",
    format: "cjs",
    outfile,
    logLevel: "warning",
  });

  const mod = require(outfile);
  bundleCache.set(entryAbs, mod);
  return mod;
}

module.exports = {
  ROOT,
  bundleRequire,
};

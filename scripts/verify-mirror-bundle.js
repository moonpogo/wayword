#!/usr/bin/env node
/**
 * Fails if `npm run build:mirror` would change the committed `mirror-engine.iife.js`.
 * Restores the original bundle on failure so the working tree is not left dirty.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const bundlePath = path.join(root, "mirror-engine.iife.js");
const backupPath = bundlePath + ".verify-mirror-bundle.bak";

function restoreBackup() {
  try {
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, bundlePath);
      fs.unlinkSync(backupPath);
    }
  } catch (_) {
    /* best-effort */
  }
}

if (!fs.existsSync(bundlePath)) {
  console.error("verify-mirror-bundle: missing mirror-engine.iife.js");
  process.exit(1);
}

fs.copyFileSync(bundlePath, backupPath);

try {
  execSync("npm run build:mirror", { cwd: root, stdio: "inherit" });
} catch (e) {
  restoreBackup();
  console.error("verify-mirror-bundle: build:mirror failed");
  process.exit(1);
}

const before = fs.readFileSync(backupPath);
const after = fs.readFileSync(bundlePath);

if (!before.equals(after)) {
  restoreBackup();
  console.error(
    "verify-mirror-bundle: mirror-engine.iife.js is out of sync with src/features/mirror.\n" +
      "Run: npm run build:mirror\n" +
      "Then commit the updated mirror-engine.iife.js."
  );
  process.exit(1);
}

fs.unlinkSync(backupPath);
console.log("verify-mirror-bundle: mirror-engine.iife.js matches rebuild output.");

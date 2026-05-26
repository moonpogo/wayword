#!/usr/bin/env node
const fs = require("fs");
const crypto = require("crypto");

const LOGO_PATH = "assets/brand/wayword-logo.svg";
const EXPECTED_SHA256 = "ac0a5da72e5eaf113b148e4f2a22c69d5eba3d6547b574fe5228232026a3e946";

function sha256File(path) {
  const data = fs.readFileSync(path);
  return crypto.createHash("sha256").update(data).digest("hex");
}

try {
  const actual = sha256File(LOGO_PATH);
  if (actual !== EXPECTED_SHA256) {
    console.error("[brand-lock] FAILED");
    console.error(`[brand-lock] ${LOGO_PATH} hash mismatch.`);
    console.error(`[brand-lock] expected: ${EXPECTED_SHA256}`);
    console.error(`[brand-lock] actual:   ${actual}`);
    console.error(
      "[brand-lock] Canonical logo is locked. Do not redraw or alter this asset unless explicitly approved."
    );
    process.exit(1);
  }
  console.log("[brand-lock] OK");
} catch (error) {
  console.error("[brand-lock] FAILED");
  console.error(error && error.message ? error.message : String(error));
  process.exit(1);
}

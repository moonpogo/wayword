#!/usr/bin/env node
/**
 * Regression guard: forbidden Patterns V1 copy must not ship in the browser bundle.
 * Run: node scripts/verify-patterns-surface-strings.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const bundle = path.join(root, "mirror-engine.iife.js");
const forbidden = [
  "lexicon totals clear the floor",
  "label ratio drifts",
  "abstract-to-concrete label ratio drifts",
  "The abstract-to-concrete label ratio drifts"
];

const s = fs.readFileSync(bundle, "utf8");
const hits = forbidden.filter((frag) => s.includes(frag));
if (hits.length) {
  console.error("verify-patterns-surface-strings: forbidden fragments found in mirror-engine.iife.js:");
  for (const h of hits) console.error("  -", JSON.stringify(h));
  process.exit(1);
}
console.log("verify-patterns-surface-strings: mirror-engine.iife.js copy guard passed.");

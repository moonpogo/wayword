#!/usr/bin/env node
/**
 * Review harness: bundles mirror + nudge TypeScript with esbuild, then runs in Node.
 * Corpus: tests/fixtures/wayword-evaluation-corpus.js
 */
const esbuild = require("esbuild");
const path = require("path");

const root = path.join(__dirname, "..");
const entry = path.join(__dirname, "wayword-eval-entry.ts");
const outfile = path.join(__dirname, ".wayword-eval.cjs");

esbuild.buildSync({
  absWorkingDir: root,
  entryPoints: [entry],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile,
  logLevel: "warning"
});

require(outfile);

#!/usr/bin/env node
/**
 * Patterns V1 harness: bundles `runPatternsFromDigests` with esbuild, then runs in Node.
 */
const esbuild = require("esbuild");
const path = require("path");

const root = path.join(__dirname, "..");
const entry = path.join(__dirname, "patterns-eval-entry.ts");
const outfile = path.join(__dirname, ".patterns-eval.cjs");

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

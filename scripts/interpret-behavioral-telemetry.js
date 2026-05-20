#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = process.cwd();
const RUNTIME_PATH = path.join(ROOT, "src/app/behavioral-interpretation-runtime.js");

function parseArgs(argv) {
  const args = { input: "", output: "" };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--input" || token === "-i") {
      args.input = String(argv[i + 1] || "");
      i += 1;
      continue;
    }
    if (token === "--output" || token === "-o") {
      args.output = String(argv[i + 1] || "");
      i += 1;
    }
  }
  return args;
}

function loadRuntimeApi() {
  const src = fs.readFileSync(RUNTIME_PATH, "utf8");
  const context = {
    console,
    Date,
    Math,
    JSON,
    setTimeout,
    clearTimeout,
  };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);
  vm.runInContext(src, context, { filename: "behavioral-interpretation-runtime.js" });
  if (!context.waywordBehavioralInterpretation) {
    throw new Error("behavioral interpretation runtime failed to initialize");
  }
  return context.waywordBehavioralInterpretation;
}

function readInputEvents(inputPath) {
  if (!inputPath) {
    throw new Error("missing --input path (expects telemetry events JSON array)");
  }
  const abs = path.resolve(ROOT, inputPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`input file not found: ${inputPath}`);
  }
  const raw = fs.readFileSync(abs, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`input is not valid JSON: ${error.message}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error("input JSON must be an array of telemetry events");
  }
  return parsed;
}

function writeOutput(outputPath, interpretation) {
  const rendered = JSON.stringify(interpretation, null, 2);
  if (!outputPath) {
    console.log(rendered);
    return;
  }
  const abs = path.resolve(ROOT, outputPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, rendered + "\n", "utf8");
  console.log(`Behavioral interpretation written: ${path.relative(ROOT, abs)}`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const events = readInputEvents(args.input);
  const api = loadRuntimeApi();
  const interpretation = api.interpretTelemetryEvents(events);
  writeOutput(args.output, interpretation);
}

try {
  main();
} catch (error) {
  console.error(`interpret-behavioral-telemetry failed: ${error.message}`);
  process.exit(1);
}

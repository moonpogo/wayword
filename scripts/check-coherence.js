#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

const CONFIG = {
  scanRoots: ["src", "tests", "script.js", "index.html", "style.css"],
  extensions: new Set([".js", ".cjs", ".mjs", ".ts", ".tsx", ".css", ".html"]),
  ignoredPaths: [
    /src[\/\\]features[\/\\]mirror[\/\\]/i,
    /src[\/\\]features[\/\\]prompts[\/\\]layered-prompts\.js$/i,
    /src[\/\\]ui[\/\\]render-post-run\.js$/i,
    /style\.css$/i,
    /tests[\/\\]fixtures[\/\\]/i,
    /tests[\/\\]browser-smoke\.test\.cjs$/i,
  ],
  forbiddenPatterns: [
    { type: "forbidden-pattern", label: "nudge", re: /\bnudge\b/i },
    { type: "forbidden-pattern", label: "calibration", re: /\bcalibration\b/i },
    { type: "forbidden-pattern", label: "stall recovery", re: /\bstall\s+recovery\b/i },
    { type: "forbidden-pattern", label: "keep going", re: /\bkeep\s+going\b/i },
    { type: "forbidden-pattern", label: "resume writing", re: /\bresume\s+writing\b/i },
    { type: "forbidden-pattern", label: "prompt intervention", re: /\bprompt\s+intervention\b/i },
  ],
  allowedCommentMatches: [
    /mirror-next-pass-nudge/i,
    /src\/features\/mirror\//i,
  ],
  allowedInterventionController: /src[\/\\]features[\/\\]writing[\/\\]entry-delay-hint-controller\.js$/,
  allowedRuntimeStates: new Set(["preEntry", "writing", "idle"]),
};

function walk(fileOrDir, out) {
  const stat = fs.statSync(fileOrDir);
  if (stat.isFile()) {
    out.push(fileOrDir);
    return;
  }
  const entries = fs.readdirSync(fileOrDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    walk(path.join(fileOrDir, entry.name), out);
  }
}

function readLines(p) {
  return fs.readFileSync(p, "utf8").split(/\r?\n/);
}

function isCommentLine(line) {
  const trimmed = line.trim();
  return (
    trimmed.startsWith("//") ||
    trimmed.startsWith("/*") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("<!--")
  );
}

function commentMatchAllowed(p, line) {
  const key = `${p}::${line}`;
  return CONFIG.allowedCommentMatches.some((re) => re.test(key));
}

function collectFiles() {
  const files = [];
  for (const root of CONFIG.scanRoots) {
    const abs = path.join(ROOT, root);
    if (!fs.existsSync(abs)) continue;
    walk(abs, files);
  }
  return files.filter((p) => {
    if (!CONFIG.extensions.has(path.extname(p))) return false;
    const rel = path.relative(ROOT, p);
    return !CONFIG.ignoredPaths.some((re) => re.test(rel));
  });
}

function findForbiddenPatterns(files, violations) {
  for (const p of files) {
    const rel = path.relative(ROOT, p);
    const lines = readLines(p);
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      for (const rule of CONFIG.forbiddenPatterns) {
        if (!rule.re.test(line)) continue;
        if (isCommentLine(line) && commentMatchAllowed(rel, line)) continue;
        violations.push({
          type: rule.type,
          detail: rule.label,
          file: rel,
          line: i + 1,
          text: line.trim(),
        });
      }
    }
  }
}

function findStateModelViolations(files, violations) {
  for (const p of files) {
    const rel = path.relative(ROOT, p);
    if (!/post-submit-phase|phase|mode|stage|state/i.test(rel)) continue;
    const lines = readLines(p);
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (!/(PHASES|phase|mode|stage)/.test(line)) continue;
      const literals = line.match(/["']([A-Za-z][A-Za-z0-9_-]*)["']/g) || [];
      for (const lit of literals) {
        const value = lit.slice(1, -1);
        if (CONFIG.allowedRuntimeStates.has(value)) continue;
        if (/^(true|false|null|undefined)$/.test(value)) continue;
        if (/^(aria|data|role|button|dialog)$/.test(value)) continue;
        if (/^(idle|writing|preEntry)$/.test(value)) continue;
        if (/(focus-mode|keyboard-open|patterns-open)/.test(value)) continue;
        if (/^(none|early|mid|late|done)$/.test(value)) continue;
        if (/^(submitted_mirror_low_signal|submitted_mirror_ready|submitted_mirror_unavailable|drafting)$/.test(value)) {
          violations.push({
            type: "state-model-violation",
            detail: `disallowed runtime state '${value}'`,
            file: rel,
            line: i + 1,
            text: line.trim(),
          });
          continue;
        }
      }
    }
  }
}

function findInterventionSystemViolations(files, violations) {
  const interventionControllerCandidates = [];
  for (const p of files) {
    const rel = path.relative(ROOT, p);
    if (/controller/i.test(path.basename(rel)) && /(hint|nudge|intervention|stall|permission)/i.test(rel)) {
      interventionControllerCandidates.push(rel);
    }
  }

  const disallowedControllers = interventionControllerCandidates.filter(
    (rel) => !CONFIG.allowedInterventionController.test(rel)
  );

  if (disallowedControllers.length > 0) {
    for (const rel of disallowedControllers) {
      violations.push({
        type: "intervention-system-count",
        detail: "disallowed intervention controller",
        file: rel,
        line: 1,
        text: rel,
      });
    }
  }
}

function printViolations(violations) {
  console.error("Coherence check failed:");
  for (const v of violations) {
    console.error(`- [${v.type}] ${v.file}:${v.line} ${v.detail}`);
    console.error(`  ${v.text}`);
  }
}

function main() {
  const files = collectFiles();
  const violations = [];
  findForbiddenPatterns(files, violations);
  findStateModelViolations(files, violations);
  findInterventionSystemViolations(files, violations);

  if (violations.length > 0) {
    printViolations(violations);
    process.exit(1);
  }

  console.log("Coherence check passed");
}

main();

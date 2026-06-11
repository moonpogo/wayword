#!/usr/bin/env node
/*
 * Reporting-only maintenance scout for low-risk repository hygiene.
 *
 * This command is intentionally non-blocking. It prints findings and exits 0 so
 * the repo can build a stable maintenance baseline before any checks become
 * merge gates.
 */
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const root = path.join(__dirname, "..");
const selfPath = "scripts/check-maintenance.js";

const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  ".vercel",
  "dist",
  "build",
  "coverage",
  "playwright-report",
  "test-results"
]);

const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".sql",
  ".ts",
  ".txt"
]);

const TODO_PATTERNS = ["TODO", "FIXME", "HACK", "XXX"];
const TEMP_FILE_PATTERNS = [/\.bak$/i, /\.tmp$/i, /\.temp$/i, /~$/, /\.orig$/i, /\.rej$/i];

const BANNED_COPY_FRAGMENTS = [
  "lexicon totals clear the floor",
  "label ratio drifts",
  "abstract-to-concrete label ratio drifts",
  "The abstract-to-concrete label ratio drifts"
];

const STYLE_FRAGMENTS = [{ label: "em dash", fragment: "—" }];
const DEPRECATED_EXPORT_PATTERNS = [/@deprecated/, /MIRROR_HESITATION_WORDS/];
const BANNED_COPY_IGNORE_PREFIXES = ["scripts/verify-patterns-surface-strings.js"];
const STYLE_IGNORE_PREFIXES = ["docs/", "scripts/", "tests/"];
const DEAD_CSS_IGNORE_PREFIXES = [
  "annotation-dot--",
  "annotation-slot--",
  "dot-",
  "editor-token-dot--",
  "recent-entry-meter--"
];

function hasAnyPrefix(value, prefixes) {
  return prefixes.some((prefix) => value.startsWith(prefix));
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function relative(filePath) {
  return path.relative(root, filePath).split(path.sep).join("/");
}

function isTextFile(filePath) {
  return TEXT_EXTENSIONS.has(path.extname(filePath));
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isCommentOnlyLine(line) {
  const trimmed = line.trim();
  return (
    trimmed.startsWith("//") ||
    trimmed.startsWith("/*") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("<!--")
  );
}

function lineHits(filePath, matcher) {
  const hits = [];
  const lines = readText(filePath).split(/\r?\n/);

  lines.forEach((line, index) => {
    if (matcher(line)) {
      hits.push({ file: relative(filePath), line: index + 1, text: line.trim() });
    }
  });

  return hits;
}

function printSection(title, hits, formatter, limit = 50) {
  console.log(`\n${title}`);
  console.log("-".repeat(title.length));

  if (!hits.length) {
    console.log("No findings.");
    return;
  }

  hits.slice(0, limit).forEach((hit) => console.log(formatter(hit)));

  if (hits.length > limit) {
    console.log(`... ${hits.length - limit} more finding(s) omitted.`);
  }
}

function findBundleSize() {
  const bundlePath = path.join(root, "mirror-engine.iife.js");
  if (!fs.existsSync(bundlePath)) return null;

  const data = fs.readFileSync(bundlePath);
  return {
    file: "mirror-engine.iife.js",
    bytes: data.length,
    gzipBytes: zlib.gzipSync(data).length
  };
}

function findDocumentationCommandDrift() {
  const packagePath = path.join(root, "package.json");
  const readmePath = path.join(root, "README.md");

  if (!fs.existsSync(packagePath) || !fs.existsSync(readmePath)) return [];

  const pkg = JSON.parse(readText(packagePath));
  const scripts = pkg.scripts || {};
  const readme = readText(readmePath);

  const commandMatches = [...readme.matchAll(/npm run ([A-Za-z0-9:_-]+)/g)].map((match) => match[1]);
  const missing = [...new Set(commandMatches)].filter((name) => !scripts[name]);

  const hits = missing.map((name) => `README references missing package script: npm run ${name}`);

  if (readme.includes("npm test") && !scripts.test) {
    hits.push("README references missing package script: npm test");
  }

  return hits;
}

function findDuplicateFunctionNameCandidates(files) {
  const byName = new Map();
  const codeFiles = files.filter((filePath) => {
    const rel = relative(filePath);
    const ext = path.extname(filePath);
    return (
      [".js", ".cjs", ".mjs", ".ts"].includes(ext) &&
      rel !== selfPath &&
      rel !== "mirror-engine.iife.js" &&
      (rel === "script.js" || rel.startsWith("src/"))
    );
  });

  const patterns = [
    /\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g,
    /\bconst\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g
  ];

  for (const filePath of codeFiles) {
    const rel = relative(filePath);
    const text = readText(filePath);

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text))) {
        const name = match[1];
        if (!byName.has(name)) byName.set(name, new Set());
        byName.get(name).add(rel);
      }
    }
  }

  return [...byName.entries()]
    .filter(([, fileSet]) => fileSet.size > 1)
    .filter(([, fileSet]) => {
      const fileList = [...fileSet];
      return !fileList.includes("script.js");
    })
    .map(([name, fileSet]) => ({ name, files: [...fileSet].sort() }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function findDeadCssSelectorCandidates(files) {
  const cssFiles = files.filter((filePath) => path.extname(filePath) === ".css");
  const usageFiles = files.filter((filePath) => {
    const rel = relative(filePath);
    return isTextFile(filePath) && path.extname(filePath) !== ".css" && rel !== selfPath;
  });

  const usageText = usageFiles.map(readText).join("\n");
  const selectors = new Map();
  const skipNames = new Set(["css", "html", "js", "svg", "png", "ico"]);

  for (const filePath of cssFiles) {
    const rel = relative(filePath);
    const text = readText(filePath);
    const pattern = /\.([A-Za-z_][A-Za-z0-9_-]*)/g;
    let match;

    while ((match = pattern.exec(text))) {
      const className = match[1];
      if (skipNames.has(className)) continue;
      if (!selectors.has(className)) selectors.set(className, new Set());
      selectors.get(className).add(rel);
    }
  }

  return [...selectors.entries()]
    .filter(([className]) => !DEAD_CSS_IGNORE_PREFIXES.some((prefix) => className.startsWith(prefix)))
    .filter(([className]) => !new RegExp(`\\b${escapeRegExp(className)}\\b`).test(usageText))
    .map(([className, fileSet]) => ({ selector: `.${className}`, files: [...fileSet].sort() }))
    .sort((a, b) => a.selector.localeCompare(b.selector));
}

const allFiles = walk(root);
const textFiles = allFiles.filter(isTextFile);
const sourceTextFiles = textFiles.filter((filePath) => {
  const rel = relative(filePath);
  return rel !== selfPath && rel !== "mirror-engine.iife.js";
});
const shippedTextFiles = textFiles.filter((filePath) => relative(filePath) !== selfPath);

const todoHits = sourceTextFiles.flatMap((filePath) =>
  lineHits(filePath, (line) => TODO_PATTERNS.some((pattern) => line.includes(pattern)))
);

const tempArtifactHits = allFiles
  .map(relative)
  .filter((filePath) => TEMP_FILE_PATTERNS.some((pattern) => pattern.test(filePath)));

const deprecatedHits = sourceTextFiles.flatMap((filePath) =>
  lineHits(filePath, (line) => DEPRECATED_EXPORT_PATTERNS.some((pattern) => pattern.test(line)))
);

const bannedCopyHits = shippedTextFiles.flatMap((filePath) =>
  hasAnyPrefix(relative(filePath), BANNED_COPY_IGNORE_PREFIXES)
    ? []
    : lineHits(filePath, (line) => BANNED_COPY_FRAGMENTS.some((fragment) => line.includes(fragment)))
);

const styleHits = sourceTextFiles.flatMap((filePath) =>
  hasAnyPrefix(relative(filePath), STYLE_IGNORE_PREFIXES)
    ? []
    : lineHits(
        filePath,
        (line) =>
          !isCommentOnlyLine(line) &&
          STYLE_FRAGMENTS.some(({ fragment }) => line.includes(fragment))
      )
);

const consoleLogHits = sourceTextFiles
  .filter((filePath) => {
    const rel = relative(filePath);
    return !rel.startsWith("scripts/") && !rel.startsWith("tests/");
  })
  .flatMap((filePath) => lineHits(filePath, (line) => line.includes("console.log")));

const documentationCommandDriftHits = findDocumentationCommandDrift();
const duplicateFunctionNameCandidates = findDuplicateFunctionNameCandidates(sourceTextFiles);
const deadCssSelectorCandidates = findDeadCssSelectorCandidates(sourceTextFiles);
const bundleSize = findBundleSize();

const ciWorkflowHits = fs.existsSync(path.join(root, ".github", "workflows"))
  ? []
  : ["No .github/workflows directory found."];

console.log("Wayword maintenance scout");
console.log("Reporting-only. This command does not fail CI yet.");

printSection("TODO/FIXME/HACK/XXX", todoHits, (hit) => `${hit.file}:${hit.line} ${hit.text}`);
printSection("Temporary artifact candidates", tempArtifactHits, (filePath) => filePath);
printSection("Deprecated export candidates", deprecatedHits, (hit) => `${hit.file}:${hit.line} ${hit.text}`);
printSection("Forbidden Patterns copy fragments", bannedCopyHits, (hit) => `${hit.file}:${hit.line} ${hit.text}`);
printSection("Style doctrine report-only fragments", styleHits, (hit) => `${hit.file}:${hit.line} ${hit.text}`);
printSection("Runtime console.log candidates", consoleLogHits, (hit) => `${hit.file}:${hit.line} ${hit.text}`);
printSection("Documentation command drift", documentationCommandDriftHits, (hit) => hit);
printSection("CI workflow visibility", ciWorkflowHits, (hit) => hit);
printSection(
  "Duplicate helper name candidates",
  duplicateFunctionNameCandidates,
  (hit) => `${hit.name}: ${hit.files.join(", ")}`
);
printSection(
  "Dead CSS selector candidates",
  deadCssSelectorCandidates,
  (hit) => `${hit.selector}: ${hit.files.join(", ")}`
);

console.log("\nBundle size report");
console.log("------------------");
if (!bundleSize) {
  console.log("mirror-engine.iife.js not found.");
} else {
  console.log(`${bundleSize.file}: ${bundleSize.bytes} bytes, ${bundleSize.gzipBytes} gzip bytes`);
}

console.log("\nMaintenance scout complete. Findings above are informational only.");
process.exit(0);

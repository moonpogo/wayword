"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require("playwright");
const { buildPromptResponse, hashString, mulberry32 } = require("./helpers/social-state-seeds");

const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.resolve(ROOT, "exports", "visual-assets");

const PRESETS = {
  mobile: { viewport: { width: 500, height: 900 }, deviceScaleFactor: 4, isMobile: true },
  desktop: { viewport: { width: 1600, height: 2400 }, deviceScaleFactor: 2, isMobile: false },
};

const DIRS = [
  "mobile/light/full", "mobile/light/detail",
  "mobile/dark/full", "mobile/dark/detail",
  "desktop/light/full", "desktop/light/detail",
  "desktop/dark/full", "desktop/dark/detail",
];

function contentType(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".svg")) return "image/svg+xml";
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".ico")) return "image/x-icon";
  return "application/octet-stream";
}

function makeServer(rootDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const parsed = new URL(req.url || "/", "http://localhost");
        const rel = decodeURIComponent(parsed.pathname === "/" ? "/index.html" : parsed.pathname);
        const full = path.resolve(rootDir, "." + rel);
        if (!full.startsWith(rootDir)) {
          res.writeHead(403); res.end("Forbidden"); return;
        }
        const body = await fs.readFile(full);
        res.writeHead(200, { "content-type": contentType(full), "cache-control": "no-store" });
        res.end(body);
      } catch (_) {
        res.writeHead(404); res.end("Not Found");
      }
    });
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      resolve({ origin: `http://127.0.0.1:${addr.port}`, close: () => new Promise((done) => server.close(() => done())) });
    });
    server.on("error", reject);
  });
}

async function ensureOutputDir() {
  await fs.rm(OUT_DIR, { recursive: true, force: true });
  await fs.mkdir(OUT_DIR, { recursive: true });
  for (const d of DIRS) await fs.mkdir(path.join(OUT_DIR, d), { recursive: true });
}

function genRuns(seed, count) {
  const rng = mulberry32(hashString(`runs|${seed}|${count}`));
  const now = Date.UTC(2026, 4, 21, 0, 0, 0, 0);
  const runs = [];
  for (let i = 0; i < count; i += 1) {
    const ts = now - (count - i) * 3 * 3600000;
    const prompt = "Write toward one repeated phrase until a concrete detail appears.";
    const text = buildPromptResponse(prompt, { profile: "steady_user", completion: i % 3 === 0 ? "full" : "near", hour: 15, rng });
    runs.push({
      runId: `shot-run-${seed}-${String(i + 1).padStart(4, "0")}`,
      savedAt: ts,
      timestamp: ts,
      text,
      prompt,
      score: 80,
      runScore: 80,
      scoreBreakdown: { completion: 20, filler: 20, repetition: 20, openings: 20 },
      repeatedWords: [{ word: "detail", count: 3 }],
      bannedHits: [],
      repeatedStarters: [{ starter: "i", count: 2 }],
      challengeActive: false,
      challengeCompleted: false,
      challengeWords: [],
      wasSuccessful: true,
      activeTargetWords: 120,
      activeTimerSeconds: 240,
      finishedWithinTime: true,
      timeRemaining: 22,
      wordCount: text.split(/\s+/).length,
      words: text.split(/\s+/).length,
      unique: 30,
      uniqueRatio: 0.72,
      avgSentenceLength: 15,
      repeatedCount: 1,
      fillerCount: 0,
      wordFreq: { detail: 3 },
      starterFreq: { i: 2 },
      starterExamples: { i: "I revised toward one concrete line." },
      punctuation: { commas: 3, periods: 4, exclamations: 0, parentheses: 0, quotes: 0 },
      perspective: { first: 9, second: 0, third: 0 },
      mirrorLoadFailed: false,
      mirrorPipelineResult: null,
    });
  }
  return runs;
}

async function installRuns(page, runs) {
  await page.evaluate((inputRuns) => {
    const canonical = Array.isArray(inputRuns) ? inputRuns.slice() : [];
    if (!window.waywordSavedRunsRead) window.waywordSavedRunsRead = {};
    window.waywordSavedRunsRead.listSavedRunsChronological = () => canonical.slice();
    window.waywordSavedRunsRead.listSavedRunsNewestFirst = () => canonical.slice().reverse();
  }, runs);
}

async function boot(page) {
  await page.waitForFunction(() => Boolean(document.getElementById("beginBtn") && document.getElementById("editorInput")), { timeout: 20000 });
  await page.evaluate(() => document.fonts.ready);
}

async function begin(page) {
  await page.click("#beginBtn");
  await page.waitForFunction(() => {
    const app = document.getElementById("appView");
    return Boolean(app && app.getAttribute("aria-hidden") !== "true");
  }, { timeout: 15000 });
}

async function setEditor(page, text) {
  await page.evaluate((value) => {
    const e = document.getElementById("editorInput");
    if (!e) return;
    e.focus(); e.textContent = value; e.dispatchEvent(new Event("input", { bubbles: true }));
  }, text);
}

async function submit(page) {
  await page.waitForFunction(() => {
    const b = document.getElementById("enterSubmitBtn");
    return Boolean(b && !b.classList.contains("hidden"));
  }, { timeout: 12000 });
  await page.click("#enterSubmitBtn");
  await page.waitForTimeout(600);
}

async function openPatterns(page) {
  await page.click("#styleTab").catch(() => {});
  await page.waitForSelector("#profileView:not(.hidden)", { timeout: 12000 }).catch(() => {});
}

async function openRecentDrawer(page) {
  const drawerOpened = await page.evaluate(() => {
    const t = document.getElementById("recentWritingTrigger");
    if (!t) return false;
    const visible = getComputedStyle(t).display !== "none" && !t.classList.contains("hidden");
    if (!visible) return false;
    t.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    return true;
  });
  if (drawerOpened) {
    await page.waitForSelector("#recentDrawer[aria-hidden='false']", { timeout: 10000 }).catch(() => {});
    return "drawer";
  }
  return "rail";
}

async function expandRecentEntry(page, surface) {
  const selector = surface === "drawer" ? "#recentDrawerList .recent-entry" : "#recentRailList .recent-entry";
  await page.waitForFunction((sel) => document.querySelectorAll(sel).length > 0, selector, { timeout: 12000 }).catch(() => {});
  await page.evaluate((sel) => {
    const row = document.querySelector(sel);
    if (row) row.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }, selector);
  await page.waitForTimeout(500);
}

async function showPills(page) {
  await page.evaluate(() => {
    const bar = document.getElementById("editorSemanticStatusBar");
    if (bar) bar.classList.remove("hidden");
    const ids = ["legendPillFiller", "legendPillRepetition", "legendPillOpening"];
    const vals = ["5", "3", "2"];
    ids.forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove("hidden", "legend-pill--inactive");
      const c = el.querySelector(".legend-count");
      if (c) c.textContent = vals[i];
    });
  });
}

async function clipFromSelectors(page, selectors, pad) {
  const boxes = [];
  for (const s of selectors) {
    const b = await page.locator(s).first().boundingBox().catch(() => null);
    if (b) boxes.push(b);
  }
  if (!boxes.length) return null;
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const b of boxes) {
    x1 = Math.min(x1, b.x); y1 = Math.min(y1, b.y);
    x2 = Math.max(x2, b.x + b.width); y2 = Math.max(y2, b.y + b.height);
  }
  const p = pad || 0;
  const vp = page.viewportSize();
  return {
    x: Math.max(0, Math.floor(x1 - p)),
    y: Math.max(0, Math.floor(y1 - p)),
    width: Math.min(vp.width, Math.ceil(x2 - x1 + p * 2)),
    height: Math.min(vp.height, Math.ceil(y2 - y1 + p * 2)),
  };
}

async function shot(page, outPath, clip) {
  if (clip) await page.screenshot({ path: outPath, type: "png", clip });
  else await page.screenshot({ path: outPath, type: "png" });
}

async function captureScenario(browser, server, cfg, theme, outFiles) {
  const preset = PRESETS[cfg.device];
  const context = await browser.newContext({
    viewport: preset.viewport,
    deviceScaleFactor: preset.deviceScaleFactor,
    isMobile: preset.isMobile,
    colorScheme: theme === "dark" ? "dark" : "light",
  });
  const page = await context.newPage();
  const baseDir = path.join(OUT_DIR, cfg.device, theme);

  try {
    await page.addInitScript((t) => localStorage.setItem("wayword-theme", t), theme);
    const params = new URLSearchParams({ visualExport: "1", fixture: cfg.id });
    if (cfg.seasonFixture) params.set("seasonFixture", cfg.seasonFixture);
    await page.goto(`${server.origin}/index.html?${params.toString()}`, { waitUntil: "domcontentloaded", timeout: 120000 });
    await boot(page);

    if (cfg.landing) {
      const p = path.join(baseDir, "detail", `${cfg.id}--${theme}--landing.png`);
      await page.locator("#landingView").screenshot({ path: p, type: "png" });
      outFiles.push(p);
      return;
    }

    await begin(page);
    await installRuns(page, cfg.runs || genRuns(cfg.id, 14));

    const prompt = await page.evaluate(() => String(document.getElementById("promptText")?.textContent || ""));
    const rng = mulberry32(hashString(`${cfg.id}|${theme}`));
    const textHalf = buildPromptResponse(prompt, { profile: "steady_user", completion: "half", hour: 14, rng });
    const textNear = buildPromptResponse(prompt, { profile: "steady_user", completion: "near", hour: 14, rng });
    const textFull = buildPromptResponse(prompt, { profile: "intense_user", completion: "full", hour: 14, rng });

    if (cfg.state === "activeHalf") await setEditor(page, textHalf);
    if (cfg.state === "activeNear") await setEditor(page, textNear);
    if (cfg.state === "submitted") { await setEditor(page, textFull); await submit(page); }
    if (cfg.state === "settings") { await setEditor(page, textNear); await page.click("#optionsTrigger"); await page.waitForTimeout(400); }
    if (cfg.state === "pills") { await setEditor(page, textNear); await showPills(page); }
    if (cfg.state === "recentOpen") { await openRecentDrawer(page); }
    if (cfg.state === "recentExpanded") { const surface = await openRecentDrawer(page); await expandRecentEntry(page, surface); }
    if (cfg.state === "patterns") await openPatterns(page);
    if (cfg.state === "season") { await openPatterns(page); await page.waitForSelector("#currentSeasonPanel:not(.hidden)", { timeout: 12000 }).catch(() => {}); }

    await page.waitForTimeout(300);

    const fullPath = path.join(baseDir, "full", `${cfg.id}--${theme}--full.png`);
    const appClip = await clipFromSelectors(page, ["#appView .app-write-surface"], 8);
    await shot(page, fullPath, appClip);
    outFiles.push(fullPath);

    const detailSelectors = cfg.detailSelectors || ["#promptCard", ".editor-shell"];
    const detailClip = await clipFromSelectors(page, detailSelectors, cfg.detailPad || 20);
    if (detailClip) {
      const dPath = path.join(baseDir, "detail", `${cfg.id}--${theme}--detail.png`);
      await shot(page, dPath, detailClip);
      outFiles.push(dPath);
    }
  } finally {
    await context.close();
  }
}

function pngDimensions(buffer) {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function report(files) {
  const unique = Array.from(new Set(files));
  console.log(`\nExported ${unique.length} PNG files to ${path.relative(ROOT, OUT_DIR)}`);
  for (const file of unique) {
    const d = pngDimensions(await fs.readFile(file));
    console.log(`${path.relative(ROOT, file)}  ${d.width}x${d.height}`);
  }
}

async function main() {
  await ensureOutputDir();
  const server = await makeServer(ROOT);
  const browser = await chromium.launch({ headless: true });
  const out = [];

  const runsRecent = genRuns("recent", 18);
  const runsPatterns = genRuns("patterns", 28);
  const runsSeasonLight = genRuns("season-light", 40);
  const runsSeasonMed = genRuns("season-med", 120);
  const runsSeasonHeavy = genRuns("season-heavy", 260);
  const runsSeasonExtreme = genRuns("season-extreme", 420);

  const scenarios = [
    { id: "landing-mobile", device: "mobile", landing: true },
    { id: "landing-desktop", device: "desktop", landing: true },

    { id: "mobile-settings", device: "mobile", state: "settings", runs: runsPatterns, detailSelectors: ["#editorOptionsPanel"] },
    { id: "mobile-pills-active", device: "mobile", state: "pills", runs: runsPatterns, detailSelectors: [".editor-shell", "#editorSemanticStatusBar"] },
    { id: "mobile-active-half", device: "mobile", state: "activeHalf", runs: runsPatterns, detailSelectors: [".editor-shell", "#promptCard"] },
    { id: "mobile-active-near", device: "mobile", state: "activeNear", runs: runsPatterns, detailSelectors: [".editor-shell", "#promptCard"] },
    { id: "mobile-submitted", device: "mobile", state: "submitted", runs: runsPatterns, detailSelectors: ["#mirrorReflectionSection", "#feedbackBox", ".editor-shell"] },

    { id: "mobile-recent-closed", device: "mobile", state: "activeNear", runs: runsRecent, detailSelectors: ["#recentWritingTrigger", ".editor-shell"] },
    { id: "mobile-recent-open", device: "mobile", state: "recentOpen", runs: runsRecent, detailSelectors: ["#recentDrawer"] },
    { id: "mobile-recent-expanded", device: "mobile", state: "recentExpanded", runs: runsRecent, detailSelectors: ["#recentDrawer", "#recentDrawerList .recent-entry-expanded"] },

    { id: "mobile-patterns", device: "mobile", state: "patterns", runs: runsPatterns, detailSelectors: ["#profileView"] },

    { id: "mobile-season-blank", device: "mobile", state: "season", runs: runsSeasonLight, seasonFixture: "sparse", detailSelectors: ["#currentSeasonRoot"] },
    { id: "mobile-season-light", device: "mobile", state: "season", runs: runsSeasonLight, seasonFixture: "moderate", detailSelectors: ["#currentSeasonRoot"] },
    { id: "mobile-season-medium", device: "mobile", state: "season", runs: runsSeasonMed, seasonFixture: "steady", detailSelectors: ["#currentSeasonRoot"] },
    { id: "mobile-season-heavy", device: "mobile", state: "season", runs: runsSeasonHeavy, seasonFixture: "heavy", detailSelectors: ["#currentSeasonRoot"] },
    { id: "mobile-season-extreme", device: "mobile", state: "season", runs: runsSeasonExtreme, seasonFixture: "extreme", detailSelectors: ["#currentSeasonRoot"], detailPad: 8 },

    { id: "desktop-patterns", device: "desktop", state: "patterns", runs: runsPatterns, detailSelectors: ["#profileView"] },
    { id: "desktop-season-extreme", device: "desktop", state: "season", runs: runsSeasonExtreme, seasonFixture: "extreme", detailSelectors: ["#currentSeasonRoot"], detailPad: 8 },
  ];

  try {
    for (const theme of ["light", "dark"]) {
      for (const s of scenarios) {
        await captureScenario(browser, server, s, theme, out);
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }

  await report(out);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

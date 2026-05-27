"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const http = require("node:http");
const { chromium } = require("playwright");
const {
  PROFILE_NAMES,
  TAGS_BY_PROFILE,
  KEYWORDS_BY_STATE,
  generateProfileRuns,
  buildPromptResponse,
  hashString,
  mulberry32,
} = require("./helpers/social-state-seeds");

const ROOT = path.resolve(__dirname, "..");
const SOCIAL_ROOT = path.resolve(ROOT, "artifacts", "social");

const ALL_STATES = [
  "empty-writing-surface",
  "active-entry-half",
  "active-entry-near-complete",
  "submitted-mirror-reflection",
  "recent-runs-open",
  "patterns-unlocked",
  "seasonal-wheel",
  "calibration-run",
  "prompt-reroll-state",
  "focus-mode",
];

const COMPOSITIONS = [
  { id: "full", crop: "contain", position: "50% 50%", pinterest: true, square: true },
  { id: "close", crop: "cover", position: "50% 35%", pinterest: true, square: true },
  { id: "abstract", crop: "cover", position: "78% 32%", pinterest: true, square: false },
  { id: "detail", crop: "cover", position: "52% 58%", pinterest: true, square: true },
];

function parseArgs(argv) {
  const out = {
    profile: null,
    state: null,
    count: 32,
    seed: "wayword-social-v3",
    fresh: false,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--fresh") out.fresh = true;
    else if (a.startsWith("--profile=")) out.profile = a.slice(10).trim();
    else if (a.startsWith("--state=")) out.state = a.slice(8).trim();
    else if (a.startsWith("--count=")) out.count = Math.max(1, Number(a.slice(8)) || out.count);
    else if (a.startsWith("--seed=")) out.seed = a.slice(7).trim() || out.seed;
  }
  return out;
}

function dateStampLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function csvEscape(v) {
  const s = String(v == null ? "" : v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function ensureDirs(base, fresh) {
  if (fresh) {
    await fs.rm(base, { recursive: true, force: true });
  }
  await fs.mkdir(path.join(base, "pinterest"), { recursive: true });
  await fs.mkdir(path.join(base, "square"), { recursive: true });
  await fs.mkdir(path.join(base, "raw-screenshots"), { recursive: true });
  await fs.mkdir(path.join(base, "metadata"), { recursive: true });
}

function buildScenarioList(opts) {
  const profiles = opts.profile ? [opts.profile] : PROFILE_NAMES.slice();
  const states = opts.state ? [opts.state] : ALL_STATES.slice();
  if (opts.profile && !PROFILE_NAMES.includes(opts.profile)) {
    throw new Error(`Unknown profile: ${opts.profile}`);
  }
  if (opts.state && !ALL_STATES.includes(opts.state)) {
    throw new Error(`Unknown state: ${opts.state}`);
  }
  const scenarios = [];
  for (const p of profiles) {
    for (const s of states) scenarios.push({ profile: p, state: s });
  }

  const seedRng = mulberry32(hashString(`${opts.seed}|scenario-order`));
  scenarios.sort(() => seedRng() - 0.5);
  return scenarios;
}

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
          res.writeHead(403);
          res.end("Forbidden");
          return;
        }
        const body = await fs.readFile(full);
        res.writeHead(200, { "content-type": contentType(full), "cache-control": "no-store" });
        res.end(body);
      } catch (_) {
        res.writeHead(404);
        res.end("Not Found");
      }
    });
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      resolve({
        origin: `http://127.0.0.1:${addr.port}`,
        close: () => new Promise((done) => server.close(() => done())),
      });
    });
    server.on("error", reject);
  });
}

async function waitForBoot(page) {
  await page.waitForFunction(() => Boolean(document.getElementById("beginBtn") && document.getElementById("editorInput")), {
    timeout: 20000,
  });
}

async function begin(page) {
  await page.click("#beginBtn");
  await page.waitForFunction(() => {
    const app = document.getElementById("appView");
    return Boolean(app && app.getAttribute("aria-hidden") !== "true");
  }, { timeout: 15000 });
}

async function installFixtureRuns(page, runs) {
  await page.evaluate((inputRuns) => {
    const canonical = Array.isArray(inputRuns)
      ? inputRuns.slice().sort((a, b) => Number(a.savedAt || a.timestamp || 0) - Number(b.savedAt || b.timestamp || 0))
      : [];
    window.__WAYWORD_SOCIAL_FIXTURE_RUNS__ = canonical;
    if (!window.waywordSavedRunsRead) window.waywordSavedRunsRead = {};
    window.waywordSavedRunsRead.listSavedRunsChronological = () => canonical.slice();
    window.waywordSavedRunsRead.listSavedRunsNewestFirst = () => canonical.slice().reverse();
  }, runs);
}

async function readPromptText(page) {
  return page.evaluate(() => String(document.getElementById("promptText")?.textContent || "").trim());
}

async function setEditor(page, text) {
  await page.evaluate((value) => {
    const editor = document.getElementById("editorInput");
    if (!editor) return;
    editor.focus();
    editor.textContent = value;
    editor.dispatchEvent(new Event("input", { bubbles: true }));
  }, text);
}

async function ensureSubmitReady(page, preferredText) {
  await setEditor(page, preferredText);
  let visible = await page.evaluate(() => {
    const btn = document.getElementById("enterSubmitBtn");
    return Boolean(btn && !btn.classList.contains("hidden"));
  });
  if (visible) return;
  const fallback = `${preferredText} I stayed with the line until one concrete detail remained in place.`;
  await setEditor(page, fallback);
  await page.waitForFunction(() => {
    const btn = document.getElementById("enterSubmitBtn");
    return Boolean(btn && !btn.classList.contains("hidden"));
  }, { timeout: 10000 });
}

async function waitPostSubmit(page) {
  await page.waitForFunction(() => {
    const overlay = document.getElementById("editorOverlay");
    const firstSession = overlay && !overlay.classList.contains("hidden");
    const mirror = document.getElementById("mirrorReflectionSection");
    const mirrorVisible = mirror && !mirror.classList.contains("hidden");
    const handoff = document.getElementById("firstSessionEntryHandoffSection");
    const handoffVisible = handoff && !handoff.classList.contains("hidden");
    const feedback = document.getElementById("feedbackBox");
    const feedbackRendered =
      feedback &&
      !feedback.classList.contains("empty") &&
      String(feedback.textContent || "").trim().length > 0;
    return Boolean(firstSession || mirrorVisible || handoffVisible || feedbackRendered);
  }, { timeout: 20000 });
}

async function prepareState(page, state, profile, rng) {
  const prompt = await readPromptText(page);
  const hour = Number(await page.evaluate(() => new Date().getHours()));

  try {
    if (state === "empty-writing-surface") return { prompt, sourceState: state };

    if (state === "active-entry-half") {
      const text = buildPromptResponse(prompt, { profile, completion: "half", hour, rng });
      await setEditor(page, text);
      return { prompt, sourceState: state };
    }

    if (state === "active-entry-near-complete") {
      const text = buildPromptResponse(prompt, { profile, completion: "near", hour, rng });
      await setEditor(page, text);
      return { prompt, sourceState: state };
    }

    if (state === "submitted-mirror-reflection") {
      const text = buildPromptResponse(prompt, { profile, completion: "full", hour, rng });
      await ensureSubmitReady(page, text);
      await page.click("#enterSubmitBtn");
      try {
        await waitPostSubmit(page);
      } catch (_) {
        return { prompt, sourceState: "submitted-mirror-reflection-pending" };
      }
      await page.waitForTimeout(450);
      return { prompt, sourceState: state };
    }

    if (state === "recent-runs-open") {
      await page.waitForFunction(() => document.querySelectorAll("#recentRailList .recent-entry").length > 0, { timeout: 20000 });
      await page.evaluate(() => {
        const first = document.querySelector("#recentRailList .recent-entry");
        if (first) first.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
      await page.waitForSelector("#recentRailList .recent-entry-expanded:not([hidden])", { timeout: 10000 });
      return { prompt, sourceState: state };
    }

    if (state === "patterns-unlocked") {
      await page.click("#styleTab");
      await page.waitForSelector("#profileView:not(.hidden)", { timeout: 10000 });
      return { prompt, sourceState: state };
    }

    if (state === "seasonal-wheel") {
      await page.click("#styleTab");
      await page.waitForSelector("#profileView:not(.hidden)", { timeout: 10000 });
      await page.waitForSelector("#currentSeasonPanel:not(.hidden)", { timeout: 12000 });
      return { prompt, sourceState: state };
    }

    if (state === "calibration-run") {
      const text = buildPromptResponse(prompt, { profile: "calibration_user", completion: "short", hour, rng });
      await ensureSubmitReady(page, text);
      await page.click("#enterSubmitBtn");
      try {
        await waitPostSubmit(page);
      } catch (_) {
        return { prompt, sourceState: "calibration-run-pending" };
      }
      return { prompt, sourceState: state };
    }

    if (state === "prompt-reroll-state") {
      await page.click("#promptRerollBtn");
      await page.waitForTimeout(300);
      const rerollPrompt = await readPromptText(page);
      const text = buildPromptResponse(rerollPrompt, { profile, completion: "half", hour, rng });
      await setEditor(page, text);
      return { prompt: rerollPrompt, sourceState: state };
    }

    if (state === "focus-mode") {
      await page.click("#fieldExpandedToggle");
      await page.waitForTimeout(350);
      const focused = await page.evaluate(() => document.body.classList.contains("focus-mode"));
      if (!focused) return { prompt, sourceState: "focus-mode-unavailable" };
      const text = buildPromptResponse(prompt, { profile, completion: "near", hour, rng });
      await setEditor(page, text);
      return { prompt, sourceState: state };
    }
  } catch (_) {
    return { prompt, sourceState: `${state}-fallback` };
  }

  return { prompt, sourceState: state };
}

async function captureRaw(page, outPath) {
  await page.addStyleTag({
    content: `
      *,*::before,*::after{animation:none !important;transition:none !important;caret-color:transparent !important;}
      body{background:#f8f8f5 !important;}
    `,
  });
  const clip = await page.evaluate(() => {
    const node = document.querySelector("#appView .app-write-surface") || document.querySelector("#appView");
    if (!node) return null;
    const r = node.getBoundingClientRect();
    return { x: Math.max(0, Math.floor(r.left)), y: Math.max(0, Math.floor(r.top)), width: Math.ceil(r.width), height: Math.ceil(r.height) };
  });
  if (!clip || !clip.width || !clip.height) {
    await page.screenshot({ path: outPath, fullPage: true });
    return;
  }
  await page.screenshot({ path: outPath, clip });
}

async function frameImage(browser, inputPath, outputPath, width, height, composition) {
  const b64 = (await fs.readFile(inputPath)).toString("base64");
  const pg = await browser.newPage({ viewport: { width, height } });
  const fit = composition.crop === "cover" ? "cover" : "contain";
  const pos = composition.position || "50% 50%";
  const html = `<!doctype html><html><head><meta charset="utf-8"/><style>
  html,body{margin:0;width:100%;height:100%;background:#f3efe7}
  .stage{position:relative;width:100%;height:100%;background:#f3efe7}
  .guide{position:absolute;inset:5% 6.5%;border:1px solid #ebe4d8;box-sizing:border-box}
  .card{position:absolute;inset:11%;padding:3.3%;box-sizing:border-box;background:#fff;border:1px solid #ddd6ca;border-radius:6px;box-shadow:0 10px 16px rgba(0,0,0,.11)}
  img{width:100%;height:100%;object-fit:${fit};object-position:${pos};display:block;filter:grayscale(0.06) contrast(1.01)}
  </style></head><body><div class="stage"><div class="guide"></div><div class="card"><img src="data:image/png;base64,${b64}" alt="Wayword"/></div></div></body></html>`;
  await pg.setContent(html, { waitUntil: "domcontentloaded" });
  await pg.screenshot({ path: outputPath });
  await pg.close();
}

function boardRecommendation(state, profile) {
  if (state === "seasonal-wheel") return "Writing Rhythm & Seasonality";
  if (state === "patterns-unlocked") return "Language Patterns";
  if (state === "submitted-mirror-reflection") return "Post-Run Reflection";
  if (profile === "calibration_user") return "Onboarding & Calibration";
  return "Wayword Writing Surfaces";
}

function assetCopy(meta) {
  const stateLabel = meta.state.replace(/-/g, " ");
  const title = `Wayword — ${stateLabel.charAt(0).toUpperCase()}${stateLabel.slice(1)}`;
  const description = `A restrained Wayword view showing ${stateLabel} with simulated ${meta.profile.replace(/_/g, " ")} behavior and reflective writing cadence.`;
  const alt = `Monochrome Wayword interface capture: ${stateLabel}, profile ${meta.profile.replace(/_/g, " ")}.`;
  return { title, description, alt };
}

async function writeMetadataFiles(baseDir, rows) {
  const metadataDir = path.join(baseDir, "metadata");
  const csvPath = path.join(metadataDir, "pinterest-assets.csv");
  const header = [
    "filename",
    "board_recommendation",
    "title",
    "description",
    "alt_text",
    "source_app_state",
    "fixture_profile",
    "suggested_tags",
  ];
  const lines = [header.join(",")];

  for (const row of rows) {
    const jsonPath = path.join(metadataDir, `${row.assetId}.json`);
    await fs.writeFile(jsonPath, JSON.stringify(row, null, 2) + "\n", "utf8");
    lines.push([
      row.filename,
      row.boardRecommendation,
      row.title,
      row.description,
      row.altText,
      row.sourceAppState,
      row.fixtureProfile,
      row.suggestedTags.join("; "),
    ].map(csvEscape).join(","));
  }

  await fs.writeFile(csvPath, lines.join("\n") + "\n", "utf8");
}

async function run() {
  const opts = parseArgs(process.argv);
  const stamp = dateStampLocal();
  const outBase = path.join(SOCIAL_ROOT, stamp);
  await ensureDirs(outBase, opts.fresh);

  const scenarios = buildScenarioList(opts);
  const server = await makeServer(ROOT);
  const browser = await chromium.launch({ headless: true });
  const metadataRows = [];
  let pinterestCount = 0;

  try {
    for (let i = 0; i < scenarios.length; i += 1) {
      if (pinterestCount >= opts.count) break;
      const scenario = scenarios[i];
      const localSeed = `${opts.seed}|${scenario.profile}|${scenario.state}|${i}`;
      const rng = mulberry32(hashString(localSeed));
      const runs = generateProfileRuns(scenario.profile, opts.seed);

      const context = await browser.newContext({ viewport: { width: 1600, height: 1100 }, colorScheme: "light" });
      const page = await context.newPage();
      await page.goto(`${server.origin}/index.html`, { waitUntil: "domcontentloaded", timeout: 120000 });
      await waitForBoot(page);
      await begin(page);
      await installFixtureRuns(page, runs);

      const prepared = await prepareState(page, scenario.state, scenario.profile, rng);
      await page.waitForTimeout(250);

      const rawName = `${String(i + 1).padStart(3, "0")}-${scenario.profile}-${scenario.state}.png`;
      const rawPath = path.join(outBase, "raw-screenshots", rawName);
      await captureRaw(page, rawPath);

      for (const comp of COMPOSITIONS) {
        if (pinterestCount >= opts.count && comp.pinterest) continue;
        if (comp.pinterest) {
          const pName = rawName.replace(/\.png$/, `--${comp.id}--pinterest-1080x1620.png`);
          const pPath = path.join(outBase, "pinterest", pName);
          await frameImage(browser, rawPath, pPath, 1080, 1620, comp);

          const tags = Array.from(new Set([...(TAGS_BY_PROFILE[scenario.profile] || []), ...(KEYWORDS_BY_STATE[scenario.state] || [])]));
          const copy = assetCopy({ state: scenario.state, profile: scenario.profile });
          const assetId = pName.replace(/\.png$/, "");
          metadataRows.push({
            assetId,
            filename: path.relative(outBase, pPath),
            boardRecommendation: boardRecommendation(scenario.state, scenario.profile),
            title: copy.title,
            description: copy.description,
            altText: copy.alt,
            sourceAppState: prepared.sourceState,
            fixtureProfile: scenario.profile,
            suggestedTags: tags,
            prompt: prepared.prompt,
            composition: comp.id,
            seed: localSeed,
            generatedAt: new Date().toISOString(),
          });
          pinterestCount += 1;
        }

        if (comp.square) {
          const sName = rawName.replace(/\.png$/, `--${comp.id}--square-1080.png`);
          const sPath = path.join(outBase, "square", sName);
          await frameImage(browser, rawPath, sPath, 1080, 1080, comp);

          const tags = Array.from(new Set([...(TAGS_BY_PROFILE[scenario.profile] || []), ...(KEYWORDS_BY_STATE[scenario.state] || [])]));
          const copy = assetCopy({ state: scenario.state, profile: scenario.profile });
          const assetId = sName.replace(/\.png$/, "");
          metadataRows.push({
            assetId,
            filename: path.relative(outBase, sPath),
            boardRecommendation: boardRecommendation(scenario.state, scenario.profile),
            title: copy.title,
            description: copy.description,
            altText: copy.alt,
            sourceAppState: prepared.sourceState,
            fixtureProfile: scenario.profile,
            suggestedTags: tags,
            prompt: prepared.prompt,
            composition: comp.id,
            seed: localSeed,
            generatedAt: new Date().toISOString(),
          });
        }
      }

      await context.close();
      console.log(`captured ${scenario.profile} / ${scenario.state}`);
    }
  } finally {
    await browser.close();
    await server.close();
  }

  await writeMetadataFiles(outBase, metadataRows);

  console.log(`\nExport root: ${outBase}`);
  console.log(`Scenarios: ${scenarios.length}`);
  console.log(`Assets: ${metadataRows.length}`);
  console.log(`Seed: ${opts.seed}`);
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

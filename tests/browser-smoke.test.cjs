const assert = require("node:assert/strict");
const test = require("node:test");
const { ROOT } = require("./helpers/bundle-require.cjs");
const { startStaticServer } = require("./helpers/static-server.cjs");
const { startPlaywrightChromium } = require("./helpers/playwright-browser.cjs");

const SMOKE_RUN_TEXTS = [
  "I kept returning to the window and the same streetlight, trying to explain why the room felt narrower after I spoke. I started with a careful sentence, backed away from it, then softened it again. The draft keeps circling the safer words before it reaches the sharper one.",
  "I kept returning to the hallway and the same bright square on the floor, trying to describe why the conversation felt smaller after it ended. I opened with a polite sentence, revised it in place, then padded it again. The draft moves forward, doubles back, and tests the same edge twice.",
  "I kept returning to the doorway and the same patch of cold light, trying to say why the room changed after one short answer. I began with a gentle line, interrupted it with caution, then added another cushion. The paragraph keeps pressing forward and retreating in the same breath.",
  "I kept returning to the glass and the same reflection beside it, trying to name why the air felt tighter after I spoke. I led with a measured line, trimmed it, then softened it again. The writing repeats its entry point, then circles back before choosing a firmer word.",
  "I kept returning to the lamp and the same pale outline on the wall, trying to explain why the exchange felt narrower once it was over. I opened with a mild sentence, revised it, then buffered it again. The draft repeats its approach and tests the same idea from a safer distance.",
];

const DESKTOP_REFLECTION_STRESS_TEXT =
  "I kept returning to the hallway and the same square of light on the floor, trying to explain why the conversation felt smaller after it ended. I started with a careful sentence, then revised it in place, then backed away from it again. The draft keeps circling the safer words before it reaches the sharper one, and every time it gets close it adds another softer phrase. Maybe that is why the paragraph keeps widening and narrowing in the same breath. I keep saying maybe, almost, still, just, as if the sentence needs another layer before it can hold. In the first half I stay abstract and polite, talking about pressure, distance, pattern, change, feeling, and shape. Later the language gets more concrete: hallway, glass, sleeve, throat, table, light, window, hand. The sentences start longer, then shorten, then tighten again near the end. I return to the same opening several times. I keep beginning with I kept, I started, I keep, as though the draft needs to announce its hesitation before it says anything clear. By the end the wording is more direct, but it still circles the same point and repeats the same narrow image.";

/** Diverse vocabulary / cadence so post-submit semantic legend pills stay hidden (no banned hits, no 4+ char repeats, no opening streak). */
const DESKTOP_REFLECTION_NO_SEM_PILL_TEXT =
  "Cedar boughs brushed frost from jade ledges before dawn. Vapor loosened along each cliff trace until ridgelines cleared. Mica glinted under pale ice by the creek bend. Fox trails crossed frozen gravel toward pine shade without doubling back.";

let smokeHarness = null;

test.before(async () => {
  const server = await startStaticServer({ rootDir: ROOT });
  const driver = await startPlaywrightChromium({ headless: true });
  smokeHarness = { driver, server };
});

test.after(async () => {
  if (!smokeHarness) return;
  await smokeHarness.driver.close();
  await smokeHarness.server.close();
});

async function withSmokeSession(_t, callback) {
  if (!smokeHarness) {
    throw new Error("Browser smoke harness was not initialized");
  }

  const sessionState = await smokeHarness.driver.newSession();
  const { session, close } = sessionState;
  try {
    await session.setWindowRect({ height: 900, width: 960, x: 0, y: 0 });
    await callback(session);
  } finally {
    await close();
  }
}

function smokeUrl() {
  return `${smokeHarness.server.origin}/index.html?smoke=${Date.now()}`;
}

async function waitForAppBoot(session) {
  await session.waitFor(
    "Wayword app boot",
    async () =>
      await session.execute(`
        return Boolean(
          document.getElementById("beginBtn") &&
          document.getElementById("editorInput") &&
          typeof window.waywordDevResetCalibration === "function"
        );
      `),
    { timeoutMs: 15000 }
  );
}

async function installErrorTrap(session) {
  await session.execute(`
    window.__waywordSmokeErrors = [];
    window.addEventListener("error", function (event) {
      var filename = String(event.filename || "");
      if (filename && !filename.startsWith(window.location.origin)) return;
      window.__waywordSmokeErrors.push({
        filename: filename,
        message: String(event.message || "error"),
        type: "error"
      });
    });
    window.addEventListener("unhandledrejection", function (event) {
      var reason = event && event.reason;
      var message = reason && reason.message ? reason.message : String(reason || "unhandled rejection");
      window.__waywordSmokeErrors.push({
        message: String(message),
        type: "unhandledrejection"
      });
    });
    return true;
  `);
}

async function loadFreshApp(session) {
  await session.navigate(smokeUrl());
  await waitForAppBoot(session);

  await session.execute(`
    try {
      localStorage.clear();
    } catch (_) {}
    try {
      if (typeof window.waywordDevResetCalibration === "function") {
        window.waywordDevResetCalibration();
      }
    } catch (_) {}
    return true;
  `);

  await session.navigate(smokeUrl());
  await waitForAppBoot(session);
  await installErrorTrap(session);
}

async function waitForLandingGateVisible(session) {
  await session.waitFor(
    "landing gate visible before begin",
    async () =>
      await session.execute(`
        var landing = document.getElementById("landingView");
        var begin = document.getElementById("beginBtn");
        var app = document.getElementById("appView");
        return Boolean(
          landing &&
          !landing.classList.contains("hidden") &&
          begin &&
          app &&
          app.getAttribute("aria-hidden") === "true"
        );
      `),
    { timeoutMs: 10000 }
  );
}

async function beginRun(session) {
  await session.click("#beginBtn");
  await session.waitFor(
    "editor ready after begin",
    async () =>
      await session.execute(`
        var appView = document.getElementById("appView");
        var editor = document.getElementById("editorInput");
        var appHidden = appView && appView.getAttribute("aria-hidden") === "true";
        return Boolean(
          appView &&
          !appHidden &&
          editor &&
          editor.getAttribute("contenteditable") === "true"
        );
      `),
    { timeoutMs: 10000 }
  );
}

async function fillEditor(session, text) {
  const resultLength = await session.execute(
    `
      var editor = document.getElementById("editorInput");
      if (!editor) return 0;
      editor.focus();
      editor.textContent = __p0;
      editor.dispatchEvent(new Event("input", { bubbles: true }));
      return String(editor.textContent || "").trim().length;
    `,
    [text]
  );
  assert.ok(resultLength > 0, "expected editor to contain smoke text");

  await session.waitFor(
    "submit button to appear",
    async () =>
      await session.execute(`
        var btn = document.getElementById("enterSubmitBtn");
        return Boolean(btn && !btn.classList.contains("hidden"));
      `),
    { timeoutMs: 5000 }
  );
}

async function submitCurrentRun(session) {
  await session.click("#enterSubmitBtn");

  await session.waitFor(
    "Mirror reflection cards",
    async () =>
      await session.execute(`
        var section = document.getElementById("mirrorReflectionSection");
        var root = document.getElementById("mirrorReflectionRoot");
        return Boolean(
          section &&
          !section.classList.contains("hidden") &&
          root &&
          root.querySelectorAll(".mirror-card").length > 0
        );
      `),
    { timeoutMs: 20000 }
  );

  await session.waitFor(
    "saved run to appear in recent runs rail",
    async () =>
      await session.execute(`
        return document.querySelectorAll("#recentRailList .recent-entry").length;
      `),
    { timeoutMs: 10000 }
  );
}

async function restartIntoNextRun(session) {
  const restarted = await session.execute(`
    if (typeof window.runPostSubmitAutoNewRunNow === "function") {
      window.runPostSubmitAutoNewRunNow();
      return true;
    }
    var nudge = document.querySelector("[data-mirror-next-pass]");
    if (nudge) {
      nudge.click();
      return true;
    }
    return false;
  `);

  assert.equal(restarted, true, "expected a post-submit restart path");

  await session.waitFor(
    "next run editor reset",
    async () =>
      await session.execute(`
        var editor = document.getElementById("editorInput");
        var submit = document.getElementById("enterSubmitBtn");
        return Boolean(
          editor &&
          editor.getAttribute("contenteditable") === "true" &&
          String(editor.textContent || "").trim() === "" &&
          submit &&
          submit.classList.contains("hidden")
        );
      `),
    { timeoutMs: 15000 }
  );
}

async function unlockPatternsTab(session) {
  await beginRun(session);

  for (let index = 0; index < SMOKE_RUN_TEXTS.length; index += 1) {
    await fillEditor(session, SMOKE_RUN_TEXTS[index]);
    await submitCurrentRun(session);
    if (index < SMOKE_RUN_TEXTS.length - 1) {
      await restartIntoNextRun(session);
    }
  }

  await session.waitFor(
    "Patterns tab to unlock",
    async () =>
      await session.execute(`
        var tab = document.getElementById("styleTab");
        return Boolean(tab && !tab.classList.contains("hidden"));
      `),
    { timeoutMs: 15000 }
  );
}

async function readSmokeErrors(session) {
  return await session.execute(`
    return Array.isArray(window.__waywordSmokeErrors) ? window.__waywordSmokeErrors.slice() : [];
  `);
}

async function readDesktopWritingColumnLayoutSnapshot(session) {
  return await session.execute(`
    var header = document.querySelector(".app-write-surface > .header");
    var writeView = document.getElementById("writeView");
    var main = document.querySelector(".main-column");
    var rail = document.querySelector("#writeView .side-column");
    var editor = document.querySelector(".editor-shell");
    var pc = document.getElementById("promptCard");
    var pt = document.getElementById("promptText");
    var topline = document.getElementById("promptFamilyLabel");
    var nudge = document.getElementById("promptNudge");
    function top(el) {
      return el ? Math.round(el.getBoundingClientRect().top) : null;
    }
    function bottom(el) {
      return el ? Math.round(el.getBoundingClientRect().bottom) : null;
    }
    var band = document.querySelector(".editor-pill-band");
    var hb = header ? Math.round(header.getBoundingClientRect().bottom) : null;
    var pct = top(pc);
    return {
      mainColumnScrollTop: main != null ? Math.round(main.scrollTop) : null,
      headerBottom: hb,
      writeViewTop: writeView ? Math.round(writeView.getBoundingClientRect().top) : null,
      railTop: rail ? Math.round(rail.getBoundingClientRect().top) : null,
      editorPillBandBottom: bottom(band),
      editorShellTop: top(editor),
      promptCardTop: pct,
      promptTextTop: top(pt),
      promptFamilyTop: top(topline),
      promptNudgeTop: nudge && !nudge.classList.contains("hidden") ? top(nudge) : null,
      gapPromptCardBelowHeader: hb != null && pct != null ? Math.round(pct - hb) : null,
      gapPromptFamilyBelowHeader:
        hb != null && topline ? Math.round(top(topline) - hb) : null
    };
  `);
}

async function readReflectionGapBelowPillMetaRow(session) {
  return await session.execute(`
    var band = document.querySelector(".editor-pill-band");
    var profile = document.getElementById("profileSummarySection");
    var section = document.getElementById("mirrorReflectionSection");
    if (!band || !section || section.classList.contains("hidden")) return null;
    var bandB = band.getBoundingClientRect().bottom;
    var profB =
      profile && !profile.classList.contains("hidden")
        ? profile.getBoundingClientRect().bottom
        : bandB;
    var metaBottom = Math.max(bandB, profB);
    var secT = section.getBoundingClientRect().top;
    return {
      gapPx: Math.round(secT - metaBottom),
      metaBottom: Math.round(metaBottom),
      sectionTop: Math.round(secT),
      pillBandBottom: Math.round(bandB)
    };
  `);
}

function assertLayoutTopDidNotShiftUp(label, beforeTop, afterTop, tolerancePx) {
  if (beforeTop == null || afterTop == null) return;
  assert.ok(
    afterTop >= beforeTop - tolerancePx,
    "expected " +
      label +
      " not to move upward vs pre-submit (before=" +
      beforeTop +
      ", after=" +
      afterTop +
      ")"
  );
}

async function verifyDesktopReflectionPostSubmit(session, layoutBefore, expectSemanticPillsVisible) {
  const barState = await session.execute(`
    var bar = document.getElementById("editorSemanticStatusBar");
    if (!bar) return { missing: true };
    return {
      semanticBarHidden: bar.classList.contains("hidden"),
      visiblePillCount: document.querySelectorAll("#editorSemanticStatusBar .legend-pill:not(.hidden)").length
    };
  `);
  assert.ok(!barState.missing, "expected #editorSemanticStatusBar");
  assert.equal(
    barState.semanticBarHidden,
    !expectSemanticPillsVisible,
    expectSemanticPillsVisible
      ? `expected semantic pill row visible (hidden=${barState.semanticBarHidden}, pills=${barState.visiblePillCount})`
      : `expected semantic pill row hidden (hidden=${barState.semanticBarHidden}, pills=${barState.visiblePillCount})`
  );

  await session.waitFor(
    "desktop Reflection card comfortably visible in viewport",
    async () =>
      await session.execute(`
        var card = document.querySelector("#mirrorReflectionRoot .mirror-card");
        if (!card) return false;
        var cardRect = card.getBoundingClientRect();
        var viewportHeight = window.innerHeight;
        return Boolean(
          cardRect.height > 0 &&
          cardRect.top >= 0 &&
          cardRect.bottom <= viewportHeight - 72
        );
      `),
    { timeoutMs: 15000 }
  );

  const cardViewportBox = await readElementViewportBox(session, "#mirrorReflectionRoot .mirror-card", {
    topMargin: 0,
    bottomMargin: 72
  });

  const reflectionSnapshot = await session.execute(`
    var section = document.getElementById("mirrorReflectionSection");
    var mainColumn = document.querySelector(".main-column");
    var card = document.querySelector("#mirrorReflectionRoot .mirror-card");
    var sectionRect = section ? section.getBoundingClientRect() : null;
    var containerRect = mainColumn ? mainColumn.getBoundingClientRect() : null;
    var cardRect = card ? card.getBoundingClientRect() : null;
    var visibleTop = 0;
    var visibleBottom = window.innerHeight - 72;
    var cardVisibleHeight =
      cardRect
        ? Math.min(cardRect.bottom, visibleBottom) -
          Math.max(cardRect.top, visibleTop)
        : 0;
    return {
      sectionHidden: section?.classList.contains("hidden"),
      mainColumnScrollTop: mainColumn?.scrollTop || 0,
      cardCount: document.querySelectorAll("#mirrorReflectionRoot .mirror-card").length,
      cardVisibleHeight: Math.max(0, Math.round(cardVisibleHeight)),
      cardHeight: cardRect ? Math.round(cardRect.height) : 0,
      sectionTop: sectionRect ? Math.round(sectionRect.top) : -1,
      sectionBottom: sectionRect ? Math.round(sectionRect.bottom) : -1,
      cardTop: cardRect ? Math.round(cardRect.top) : -1,
      cardBottom: cardRect ? Math.round(cardRect.bottom) : -1,
      containerTop: containerRect ? Math.round(containerRect.top) : -1,
      containerBottom: containerRect ? Math.round(containerRect.bottom) : -1,
      cardVisible: Boolean(
        cardRect &&
          cardRect.top < visibleBottom &&
          cardRect.bottom > visibleTop
      ),
      viewportHeight: Math.round(window.innerHeight)
    };
  `);

  assert.equal(reflectionSnapshot.sectionHidden, false, "expected Reflection section to stay visible");
  assert.ok(reflectionSnapshot.cardCount >= 1, "expected at least one Reflection card");
  assert.equal(reflectionSnapshot.cardVisible, true, "expected a Reflection card to be visible in the desktop write column");
  assert.ok(cardViewportBox, "expected viewport box for the Reflection card");
  assert.equal(
    cardViewportBox.comfortablyVisible,
    true,
    `expected Reflection card to sit comfortably in viewport, received top=${cardViewportBox?.top} bottom=${cardViewportBox?.bottom} vh=${cardViewportBox?.viewportHeight}`
  );
  assert.ok(
    reflectionSnapshot.cardVisibleHeight >= Math.min(reflectionSnapshot.cardHeight, 120),
    `expected the Reflection card body to be meaningfully visible, received ${reflectionSnapshot.cardVisibleHeight} of ${reflectionSnapshot.cardHeight}`
  );

  const layoutAfter = await readDesktopWritingColumnLayoutSnapshot(session);
  assert.ok(layoutAfter, "expected desktop writing-column layout snapshot after submit");
  assert.ok(
    layoutAfter.gapPromptCardBelowHeader != null && layoutAfter.gapPromptCardBelowHeader >= 8,
    `expected prompt card below header chrome after submit, gap=${layoutAfter.gapPromptCardBelowHeader}`
  );
  assert.ok(
    layoutAfter.gapPromptFamilyBelowHeader == null || layoutAfter.gapPromptFamilyBelowHeader >= 8,
    `expected prompt family label below header chrome after submit, gap=${layoutAfter.gapPromptFamilyBelowHeader}`
  );

  const tolPx = 2;
  assertLayoutTopDidNotShiftUp("#writeView top", layoutBefore.writeViewTop, layoutAfter.writeViewTop, tolPx);
  assertLayoutTopDidNotShiftUp("Recent Runs rail top", layoutBefore.railTop, layoutAfter.railTop, tolPx);
  assertLayoutTopDidNotShiftUp(".editor-shell top", layoutBefore.editorShellTop, layoutAfter.editorShellTop, tolPx);
  assertLayoutTopDidNotShiftUp("#promptCard top", layoutBefore.promptCardTop, layoutAfter.promptCardTop, tolPx);
  assertLayoutTopDidNotShiftUp("#promptText top", layoutBefore.promptTextTop, layoutAfter.promptTextTop, tolPx);
  assertLayoutTopDidNotShiftUp("#promptFamilyLabel top", layoutBefore.promptFamilyTop, layoutAfter.promptFamilyTop, tolPx);
  if (layoutBefore.promptNudgeTop != null && layoutAfter.promptNudgeTop != null) {
    assertLayoutTopDidNotShiftUp("#promptNudge top", layoutBefore.promptNudgeTop, layoutAfter.promptNudgeTop, tolPx);
  }
  assertLayoutTopDidNotShiftUp("header bottom rule", layoutBefore.headerBottom, layoutAfter.headerBottom, tolPx);
  assert.equal(
    layoutAfter.mainColumnScrollTop,
    layoutBefore.mainColumnScrollTop,
    "expected main column scroll position unchanged (Reflection must not scroll the writing stack)"
  );

  assert.ok(
    layoutBefore.editorPillBandBottom != null && layoutAfter.editorPillBandBottom != null,
    "expected editor pill band geometry for invariance checks"
  );
  assert.ok(
    Math.abs(layoutAfter.editorPillBandBottom - layoutBefore.editorPillBandBottom) <= 3,
    `expected editor pill / annotation band not to shift vertically (before=${layoutBefore.editorPillBandBottom}, after=${layoutAfter.editorPillBandBottom})`
  );

  const reflectionGap = await readReflectionGapBelowPillMetaRow(session);
  assert.ok(reflectionGap, "expected Reflection gap below pill/meta row");
  assert.ok(
    reflectionGap.gapPx >= 2 && reflectionGap.gapPx <= 48,
    `expected modest desktop gap between pill/meta row and Reflection top, got gapPx=${reflectionGap.gapPx} (pillBandBottom=${reflectionGap.pillBandBottom}, sectionTop=${reflectionGap.sectionTop})`
  );
  if (expectSemanticPillsVisible) {
    assert.ok(
      reflectionGap.gapPx <= 30,
      `expected tight pill/meta → Reflection gap when semantic legend is visible, gapPx=${reflectionGap.gapPx}`
    );
  }

  const errors = await readSmokeErrors(session);
  assert.equal(errors.length, 0, `expected no local browser errors, received: ${JSON.stringify(errors)}`);
}

async function readElementViewportBox(session, selector, options = {}) {
  const topMargin = Number(options.topMargin ?? 0);
  const bottomMargin = Number(options.bottomMargin ?? 0);
  return await session.execute(
    `
      var el = document.querySelector(__p0);
      if (!el) return null;
      var rect = el.getBoundingClientRect();
      var viewportHeight = window.innerHeight;
      return {
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        height: Math.round(rect.height),
        viewportHeight: Math.round(viewportHeight),
        comfortablyVisible:
          rect.height > 0 &&
          rect.top >= __p1 &&
          rect.bottom <= viewportHeight - __p2
      };
    `,
    [selector, topMargin, bottomMargin]
  );
}

test("browser smoke: landing -> begin leaves writing surface ready", async (t) => {
  await withSmokeSession(t, async (session) => {
    await loadFreshApp(session);
    await waitForLandingGateVisible(session);

    const landingSnapshot = await session.execute(`
      var shell = document.querySelector(".app-shell");
      return {
        beginVisible: Boolean(
          document.getElementById("beginBtn") &&
          document.getElementById("beginBtn").offsetParent !== null
        ),
        appHidden: document.getElementById("appView")?.getAttribute("aria-hidden") === "true",
        landingShell: shell ? shell.classList.contains("app-shell--landing") : false
      };
    `);

    assert.equal(landingSnapshot.appHidden, true, "expected app chrome hidden on landing");
    assert.equal(landingSnapshot.beginVisible, true, "expected Begin control visible on landing");
    assert.equal(landingSnapshot.landingShell, true, "expected landing shell state before Begin");

    await beginRun(session);

    const writingSnapshot = await session.execute(`
      var app = document.getElementById("appView");
      var write = document.getElementById("writeView");
      var editor = document.getElementById("editorInput");
      var prompt = document.getElementById("promptText");
      return {
        appHidden: app?.getAttribute("aria-hidden") === "true",
        writeHidden: write?.classList.contains("hidden"),
        editorEditable: editor?.getAttribute("contenteditable") === "true",
        promptLen: String(prompt?.textContent || "").trim().length
      };
    `);

    assert.equal(writingSnapshot.appHidden, false, "expected app chrome visible after Begin");
    assert.equal(writingSnapshot.writeHidden, false, "expected write surface visible after Begin");
    assert.equal(writingSnapshot.editorEditable, true, "expected editor to be editable after Begin");
    assert.ok(writingSnapshot.promptLen > 0, "expected a prompt to render on the writing surface");

    const errors = await readSmokeErrors(session);
    assert.equal(errors.length, 0, `expected no local browser errors, received: ${JSON.stringify(errors)}`);
  });
});

test("browser smoke: begin -> write -> submit renders Mirror without visible evidence controls", async (t) => {
  await withSmokeSession(t, async (session) => {
    await loadFreshApp(session);
    await beginRun(session);
    await fillEditor(session, SMOKE_RUN_TEXTS[0]);
    await submitCurrentRun(session);

    const snapshot = await session.execute(`
      return {
        evidenceControlCount: document.querySelectorAll(
          "#mirrorReflectionRoot .mirror-card__evidence-toggle, #mirrorReflectionRoot [data-mirror-evidence], #mirrorReflectionRoot [aria-controls*='evidence']"
        ).length,
        mirrorCardCount: document.querySelectorAll("#mirrorReflectionRoot .mirror-card").length,
        recentRailCount: document.querySelectorAll("#recentRailList .recent-entry").length
      };
    `);

    assert.ok(snapshot.mirrorCardCount >= 1, "expected at least one Mirror card after submit");
    assert.equal(snapshot.evidenceControlCount, 0, "V1 Mirror cards should not render visible evidence controls");
    assert.ok(snapshot.recentRailCount >= 1, "expected the saved run to appear in Recent Runs");

    const errors = await readSmokeErrors(session);
    assert.equal(errors.length, 0, `expected no local browser errors, received: ${JSON.stringify(errors)}`);
  });
});

test("browser smoke: prompt reroll works with empty editor and locks once the editor has text", async (t) => {
  await withSmokeSession(t, async (session) => {
    await loadFreshApp(session);
    await beginRun(session);

    await session.waitFor(
      "prompt reroll control ready",
      async () =>
        await session.execute(`
          var btn = document.getElementById("promptRerollBtn");
          var pt = document.getElementById("promptText");
          return Boolean(
            btn &&
            !btn.classList.contains("hidden") &&
            btn.disabled === false &&
            btn.dataset.rerolls === "2" &&
            pt &&
            String(pt.textContent || "").trim().length > 0
          );
        `),
      { timeoutMs: 10000 }
    );

    const before = await session.execute(`
      var pt = document.getElementById("promptText");
      return {
        prompt: String(pt.textContent || "").trim(),
        rerolls: document.getElementById("promptRerollBtn")?.dataset.rerolls || ""
      };
    `);

    await session.click("#promptRerollBtn");

    await session.waitFor(
      "prompt reroll consumed one credit",
      async () =>
        await session.execute(`
          var btn = document.getElementById("promptRerollBtn");
          return Boolean(btn && btn.dataset.rerolls === "1");
        `),
      { timeoutMs: 10000 }
    );

    const afterReroll = await session.execute(`
      var pt = document.getElementById("promptText");
      return String(pt.textContent || "").trim();
    `);

    assert.notEqual(
      afterReroll,
      before.prompt,
      "expected a different prompt string after reroll while the editor was empty"
    );

    await fillEditor(session, "smoke reroll guard draft");

    await session.waitFor(
      "prompt reroll disabled when editor has text",
      async () =>
        await session.execute(`
          var btn = document.getElementById("promptRerollBtn");
          return Boolean(btn && btn.disabled === true && btn.classList.contains("locked"));
        `),
      { timeoutMs: 10000 }
    );

    const promptWithDraft = await session.execute(`
      return String(document.getElementById("promptText")?.textContent || "").trim();
    `);

    assert.equal(
      promptWithDraft,
      afterReroll,
      "expected prompt copy to stay stable once the draft is present (reroll is empty-only)"
    );

    const rerollSnapshot = await session.execute(`
      var btn = document.getElementById("promptRerollBtn");
      return {
        rerolls: btn ? btn.dataset.rerolls : "",
        disabled: Boolean(btn && btn.disabled)
      };
    `);

    assert.equal(rerollSnapshot.rerolls, "1", "expected first reroll to consume exactly one credit");
    assert.equal(rerollSnapshot.disabled, true, "expected reroll control to stay disabled while the editor holds text");

    const errors = await readSmokeErrors(session);
    assert.equal(errors.length, 0, `expected no local browser errors, received: ${JSON.stringify(errors)}`);
  });
});

test("browser smoke: desktop Reflection readable when semantic pill row is hidden", async (t) => {
  await withSmokeSession(t, async (session) => {
    await session.setWindowRect({ height: 900, width: 1600, x: 0, y: 0 });
    await loadFreshApp(session);
    await beginRun(session);
    await fillEditor(session, DESKTOP_REFLECTION_NO_SEM_PILL_TEXT);

    const layoutBefore = await readDesktopWritingColumnLayoutSnapshot(session);
    assert.ok(layoutBefore, "expected desktop writing-column layout snapshot before submit");
    assert.ok(
      layoutBefore.gapPromptCardBelowHeader != null && layoutBefore.gapPromptCardBelowHeader >= 8,
      `expected prompt card below header chrome before submit, gap=${layoutBefore.gapPromptCardBelowHeader}`
    );
    assert.ok(
      layoutBefore.gapPromptFamilyBelowHeader == null || layoutBefore.gapPromptFamilyBelowHeader >= 8,
      `expected prompt family label below header chrome before submit, gap=${layoutBefore.gapPromptFamilyBelowHeader}`
    );

    await submitCurrentRun(session);
    await verifyDesktopReflectionPostSubmit(session, layoutBefore, false);
  });
});

test("browser smoke: desktop Reflection readable when semantic pill row is visible", async (t) => {
  await withSmokeSession(t, async (session) => {
    await session.setWindowRect({ height: 900, width: 1600, x: 0, y: 0 });
    await loadFreshApp(session);
    await beginRun(session);
    await fillEditor(session, DESKTOP_REFLECTION_STRESS_TEXT);

    const layoutBefore = await readDesktopWritingColumnLayoutSnapshot(session);
    assert.ok(layoutBefore, "expected desktop writing-column layout snapshot before submit");
    assert.ok(
      layoutBefore.gapPromptCardBelowHeader != null && layoutBefore.gapPromptCardBelowHeader >= 8,
      `expected prompt card below header chrome before submit, gap=${layoutBefore.gapPromptCardBelowHeader}`
    );
    assert.ok(
      layoutBefore.gapPromptFamilyBelowHeader == null || layoutBefore.gapPromptFamilyBelowHeader >= 8,
      `expected prompt family label below header chrome before submit, gap=${layoutBefore.gapPromptFamilyBelowHeader}`
    );

    await submitCurrentRun(session);
    await verifyDesktopReflectionPostSubmit(session, layoutBefore, true);
  });
});


test("browser smoke: desktop rail — expanding a Recent Run does not grow the document", async (t) => {
  await withSmokeSession(t, async (session) => {
    await session.setWindowRect({ height: 900, width: 1280, x: 0, y: 0 });
    await loadFreshApp(session);
    await beginRun(session);

    for (let index = 0; index < SMOKE_RUN_TEXTS.length; index += 1) {
      await fillEditor(session, SMOKE_RUN_TEXTS[index]);
      await submitCurrentRun(session);
      if (index < SMOKE_RUN_TEXTS.length - 1) {
        await restartIntoNextRun(session);
      }
    }

    const before = await session.execute(`
      var el = document.documentElement;
      var rail = document.getElementById("recentRailList");
      return {
        sh: el.scrollHeight,
        ih: window.innerHeight,
        ch: el.clientHeight,
        rail: rail ? { ch: rail.clientHeight, sh: rail.scrollHeight, oy: window.getComputedStyle(rail).overflowY } : null
      };
    `);

    await session.execute(`
      var e = document.querySelector("#recentRailList .recent-entry");
      if (e) e.click();
    `);

    await session.waitFor(
      "recent rail entry expanded",
      async () =>
        await session.execute(`
          var e = document.querySelector("#recentRailList .recent-entry");
          return Boolean(e && e.getAttribute("aria-expanded") === "true");
        `),
      { timeoutMs: 10000 }
    );

    const after = await session.execute(`
      var el = document.documentElement;
      var rail = document.getElementById("recentRailList");
      var expanded = document.querySelector("#recentRailList .recent-entry-expanded");
      var expandedHeight = 0;
      if (expanded && !expanded.hidden) {
        expandedHeight = expanded.getBoundingClientRect().height;
      }
      return {
        sh: el.scrollHeight,
        ih: window.innerHeight,
        ch: el.clientHeight,
        expandedHeight: expandedHeight,
        rail: rail ? { ch: rail.clientHeight, sh: rail.scrollHeight, oy: window.getComputedStyle(rail).overflowY } : null
      };
    `);

    assert.ok(after.expandedHeight > 80, "expected expanded Recent Runs panel to render with meaningful height");

    const band = Math.max(after.ih, after.ch) + 32;
    assert.ok(
      after.sh <= band,
      `document scrollHeight should stay within viewport band after expand (sh=${after.sh} band=${band})`
    );
    assert.ok(
      after.sh <= before.sh + 32,
      `expand should not materially grow document height (before=${before.sh} after=${after.sh})`
    );

    if (after.rail && after.rail.sh > after.rail.ch + 2) {
      assert.ok(
        after.rail.oy === "auto" || after.rail.oy === "scroll",
        "when rail list overflows, it should remain scrollable"
      );
      const railScrolled = await session.execute(`
        var rail = document.getElementById("recentRailList");
        if (!rail) return false;
        var start = rail.scrollTop;
        rail.scrollTop = start + 120;
        return rail.scrollTop > start;
      `);
      assert.equal(railScrolled, true, "expected Recent Runs rail list to scroll");
    }

    const errors = await readSmokeErrors(session);
    assert.equal(errors.length, 0, `expected no local browser errors, received: ${JSON.stringify(errors)}`);
  });
});

test("browser smoke: Recent Runs drawer opens and closes around a saved run", async (t) => {
  await withSmokeSession(t, async (session) => {
    await loadFreshApp(session);
    await beginRun(session);
    await fillEditor(session, SMOKE_RUN_TEXTS[1]);
    await submitCurrentRun(session);

    await session.click("#recentWritingTrigger");
    await session.waitFor(
      "Recent Runs drawer open",
      async () =>
        await session.execute(`
          var drawer = document.getElementById("recentDrawer");
          return Boolean(drawer && drawer.getAttribute("aria-hidden") === "false");
        `),
      { timeoutMs: 10000 }
    );

    const drawerSnapshot = await session.execute(`
      return {
        drawerEntryCount: document.querySelectorAll("#recentDrawerList .recent-entry").length,
        evidenceControlCount: document.querySelectorAll("#recentDrawerList .mirror-card__evidence-toggle").length,
        triggerExpanded: document.getElementById("recentWritingTrigger")?.getAttribute("aria-expanded") || ""
      };
    `);

    assert.ok(drawerSnapshot.drawerEntryCount >= 1, "expected a saved run in the Recent Runs drawer");
    assert.equal(drawerSnapshot.evidenceControlCount, 0, "Recent Runs should not resurrect stale Mirror evidence controls");
    assert.equal(drawerSnapshot.triggerExpanded, "true");

    await session.click("#recentDrawerCloseBtn");
    await session.waitFor(
      "Recent Runs drawer close",
      async () =>
        await session.execute(`
          var drawer = document.getElementById("recentDrawer");
          return Boolean(drawer && drawer.getAttribute("aria-hidden") === "true");
        `),
      { timeoutMs: 10000 }
    );

    const errors = await readSmokeErrors(session);
    assert.equal(errors.length, 0, `expected no local browser errors, received: ${JSON.stringify(errors)}`);
  });
});

test("browser smoke: mobile Recent Runs drawer opens and closes after a saved run", async (t) => {
  await withSmokeSession(t, async (session) => {
    await session.setWindowRect({ height: 844, width: 390, x: 0, y: 0 });
    await loadFreshApp(session);
    await beginRun(session);
    await fillEditor(session, SMOKE_RUN_TEXTS[2]);
    await submitCurrentRun(session);

    const opened = await session.execute(`
      var t = document.getElementById("recentWritingTrigger");
      if (!t) return false;
      t.scrollIntoView({ block: "center", inline: "nearest" });
      t.click();
      return true;
    `);
    assert.equal(opened, true, "expected Recent Runs trigger to exist after submit on mobile");
    await session.waitFor(
      "mobile Recent Runs drawer open",
      async () =>
        await session.execute(`
          var drawer = document.getElementById("recentDrawer");
          return Boolean(drawer && drawer.getAttribute("aria-hidden") === "false");
        `),
      { timeoutMs: 10000 }
    );

    await session.click("#recentDrawerCloseBtn");
    await session.waitFor(
      "mobile Recent Runs drawer close",
      async () =>
        await session.execute(`
          var drawer = document.getElementById("recentDrawer");
          return Boolean(drawer && drawer.getAttribute("aria-hidden") === "true");
        `),
      { timeoutMs: 10000 }
    );

    const errors = await readSmokeErrors(session);
    assert.equal(errors.length, 0, `expected no local browser errors, received: ${JSON.stringify(errors)}`);
  });
});

test("browser smoke: Patterns view opens after five saved runs", async (t) => {
  await withSmokeSession(t, async (session) => {
    await loadFreshApp(session);
    await unlockPatternsTab(session);

    await session.click("#styleTab");
    await session.waitFor(
      "Patterns view open",
      async () =>
        await session.execute(`
          var profileView = document.getElementById("profileView");
          var callouts = document.getElementById("patternCallouts");
          return Boolean(
            profileView &&
            !profileView.classList.contains("hidden") &&
            callouts &&
            String(callouts.textContent || "").trim().length > 0
          );
        `),
      { timeoutMs: 15000 }
    );

    const profileSnapshot = await session.execute(`
      return {
        evidenceControlCount: document.querySelectorAll("#profileView .mirror-card__evidence-toggle").length,
        profileHidden: document.getElementById("profileView")?.classList.contains("hidden"),
        text: String(document.getElementById("patternCallouts")?.textContent || "").trim()
      };
    `);

    assert.equal(profileSnapshot.profileHidden, false, "expected Patterns view to be visible");
    assert.ok(profileSnapshot.text.length > 0, "expected Patterns view to render visible copy");
    assert.equal(profileSnapshot.evidenceControlCount, 0, "Patterns view should not render stale evidence controls");

    const errors = await readSmokeErrors(session);
    assert.equal(errors.length, 0, `expected no local browser errors, received: ${JSON.stringify(errors)}`);
  });
});

test("browser smoke: desktop Patterns closes on narrow breakpoint resize and returns to writing", async (t) => {
  await withSmokeSession(t, async (session) => {
    await session.setWindowRect({ height: 900, width: 1280, x: 0, y: 0 });
    await loadFreshApp(session);
    await unlockPatternsTab(session);
    await restartIntoNextRun(session);

    await session.click("#styleTab");
    await session.waitFor(
      "desktop Patterns view open before resize",
      async () =>
        await session.execute(`
          var profileView = document.getElementById("profileView");
          var writeView = document.getElementById("writeView");
          return Boolean(
            profileView &&
            !profileView.classList.contains("hidden") &&
            writeView &&
            !writeView.classList.contains("hidden")
          );
        `),
      { timeoutMs: 15000 }
    );

    await session.setWindowRect({ height: 844, width: 390, x: 0, y: 0 });

    await session.waitFor(
      "desktop Patterns closes after narrow resize",
      async () =>
        await session.execute(`
          var profileView = document.getElementById("profileView");
          var writeView = document.getElementById("writeView");
          var editor = document.getElementById("editorInput");
          return Boolean(
            profileView &&
            profileView.classList.contains("hidden") &&
            writeView &&
            !writeView.classList.contains("hidden") &&
            editor &&
            editor.getAttribute("contenteditable") === "true"
          );
        `),
      { timeoutMs: 15000 }
    );

    const resizeSnapshot = await session.execute(`
      var editor = document.getElementById("editorInput");
      var rect = editor ? editor.getBoundingClientRect() : null;
      return {
        profileHidden: document.getElementById("profileView")?.classList.contains("hidden"),
        patternsOpen: document.body.classList.contains("patterns-open"),
        writeViewHidden: document.getElementById("writeView")?.classList.contains("hidden"),
        styleExpanded: document.getElementById("styleTab")?.getAttribute("aria-expanded") || "",
        editorEditable: editor?.getAttribute("contenteditable") || "",
        editorVisible: Boolean(rect && rect.width > 0 && rect.height > 0)
      };
    `);

    assert.equal(resizeSnapshot.profileHidden, true, "expected breakpoint resize to close Patterns");
    assert.equal(resizeSnapshot.patternsOpen, false, "expected no stranded mobile Patterns body state");
    assert.equal(resizeSnapshot.writeViewHidden, false, "expected writing surface to remain visible");
    assert.equal(resizeSnapshot.styleExpanded, "false");
    assert.equal(resizeSnapshot.editorEditable, "true");
    assert.equal(resizeSnapshot.editorVisible, true, "expected editor to stay visible after resize");

    const errors = await readSmokeErrors(session);
    assert.equal(errors.length, 0, `expected no local browser errors, received: ${JSON.stringify(errors)}`);
  });
});

test("browser smoke: Patterns style tab toggles by keyboard after unlock", async (t) => {
  await withSmokeSession(t, async (session) => {
    await loadFreshApp(session);
    await unlockPatternsTab(session);

    const keyboardToggleSupported = await session.execute(`
      return Boolean(
        document.getElementById("styleTab") &&
        document.getElementById("styleTab").getAttribute("tabindex") === "0"
      );
    `);
    assert.equal(keyboardToggleSupported, true, "expected style tab keyboard support to remain available");

    await session.execute(`
      var tab = document.getElementById("styleTab");
      tab.focus();
      tab.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      return true;
    `);

    await session.waitFor(
      "Patterns view open by keyboard",
      async () =>
        await session.execute(`
          var profileView = document.getElementById("profileView");
          return Boolean(profileView && !profileView.classList.contains("hidden"));
        `),
      { timeoutMs: 15000 }
    );

    await session.execute(`
      var tab = document.getElementById("styleTab");
      tab.focus();
      tab.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      return true;
    `);

    await session.waitFor(
      "Patterns view close by keyboard",
      async () =>
        await session.execute(`
          var profileView = document.getElementById("profileView");
          return Boolean(profileView && profileView.classList.contains("hidden"));
        `),
      { timeoutMs: 15000 }
    );

    const snapshot = await session.execute(`
      return {
        profileHidden: document.getElementById("profileView")?.classList.contains("hidden"),
        styleExpanded: document.getElementById("styleTab")?.getAttribute("aria-expanded") || ""
      };
    `);

    assert.equal(snapshot.profileHidden, true, "expected Patterns view to close on second keyboard toggle");
    assert.equal(snapshot.styleExpanded, "false");

    const errors = await readSmokeErrors(session);
    assert.equal(errors.length, 0, `expected no local browser errors, received: ${JSON.stringify(errors)}`);
  });
});

test("browser smoke: mobile Patterns toggle guard opens and returns to writing cleanly", async (t) => {
  await withSmokeSession(t, async (session) => {
    await session.setWindowRect({ height: 844, width: 390, x: 0, y: 0 });
    await loadFreshApp(session);
    await unlockPatternsTab(session);
    await restartIntoNextRun(session);

    await session.click("#editorInput");
    await session.waitFor(
      "mobile focus mode active",
      async () =>
        await session.execute(`
          return document.body.classList.contains("focus-mode");
        `),
      { timeoutMs: 10000 }
    );

    await session.execute(`
      var tab = document.getElementById("styleTab");
      tab.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      tab.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      return true;
    `);

    await session.waitFor(
      "mobile Patterns view open",
      async () =>
        await session.execute(`
          var profileView = document.getElementById("profileView");
          return Boolean(
            profileView &&
            !profileView.classList.contains("hidden") &&
            document.body.classList.contains("patterns-open")
          );
        `),
      { timeoutMs: 15000 }
    );

    const openSnapshot = await session.execute(`
      return {
        profileVisible: !document.getElementById("profileView")?.classList.contains("hidden"),
        patternsOpen: document.body.classList.contains("patterns-open"),
        focusModeCleared: !document.body.classList.contains("focus-mode")
      };
    `);

    assert.equal(openSnapshot.profileVisible, true, "expected mobile Patterns view to become visible");
    assert.equal(openSnapshot.patternsOpen, true, "expected mobile body patterns-open state");
    assert.equal(openSnapshot.focusModeCleared, true, "expected focus mode to clear when mobile Patterns opens");

    await session.execute(`
      var tab = document.getElementById("styleTab");
      tab.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      return true;
    `);
    await session.waitFor(
      "mobile Patterns view close",
      async () =>
        await session.execute(`
          var profileView = document.getElementById("profileView");
          return Boolean(
            profileView &&
            profileView.classList.contains("hidden") &&
            !document.body.classList.contains("patterns-open")
          );
        `),
      { timeoutMs: 15000 }
    );

    await session.click("#editorInput");
    await session.waitFor(
      "editor usable after mobile Patterns close",
      async () =>
        await session.execute(`
          var editor = document.getElementById("editorInput");
          return Boolean(
            editor &&
            editor.getAttribute("contenteditable") === "true" &&
            document.body.classList.contains("focus-mode")
          );
        `),
      { timeoutMs: 10000 }
    );

    const errors = await readSmokeErrors(session);
    assert.equal(errors.length, 0, `expected no local browser errors, received: ${JSON.stringify(errors)}`);
  });
});

test("browser smoke: fresh run resets Options and Patterns surfaces after unlock", async (t) => {
  await withSmokeSession(t, async (session) => {
    await loadFreshApp(session);
    await unlockPatternsTab(session);
    await restartIntoNextRun(session);

    await session.click("#optionsTrigger");
    await session.waitFor(
      "Options open before fresh run reset",
      async () =>
        await session.execute(`
          return document.body.classList.contains("settings-open");
        `),
      { timeoutMs: 10000 }
    );

    await session.click("#editorOptionsCloseBtn");
    await session.waitFor(
      "Options close before opening Patterns",
      async () =>
        await session.execute(`
          return !document.body.classList.contains("settings-open");
        `),
      { timeoutMs: 10000 }
    );

    await session.click("#styleTab");
    await session.waitFor(
      "Patterns open before fresh run reset",
      async () =>
        await session.execute(`
          var profileView = document.getElementById("profileView");
          return Boolean(profileView && !profileView.classList.contains("hidden"));
        `),
      { timeoutMs: 15000 }
    );

    await session.execute(`
      window.waywordRunController.startWriting({ deferEditorFocus: true });
      return true;
    `);

    await session.waitFor(
      "fresh run closes Patterns and leaves Options closed",
      async () =>
        await session.execute(`
          var profileView = document.getElementById("profileView");
          var backdrop = document.getElementById("editorOptionsBackdrop");
          return Boolean(
            profileView &&
            profileView.classList.contains("hidden") &&
            !document.body.classList.contains("settings-open") &&
            backdrop &&
            backdrop.getAttribute("aria-hidden") === "true"
          );
        `),
      { timeoutMs: 10000 }
    );

    const resetSnapshot = await session.execute(`
      return {
        profileHidden: document.getElementById("profileView")?.classList.contains("hidden"),
        settingsClosed: !document.body.classList.contains("settings-open"),
        backdropHidden: document.getElementById("editorOptionsBackdrop")?.getAttribute("aria-hidden") || "",
        editorEditable: document.getElementById("editorInput")?.getAttribute("contenteditable") || ""
      };
    `);

    assert.equal(resetSnapshot.profileHidden, true, "expected fresh run to hide Patterns");
    assert.equal(resetSnapshot.settingsClosed, true, "expected fresh run to leave Options closed");
    assert.equal(resetSnapshot.backdropHidden, "true");
    assert.equal(resetSnapshot.editorEditable, "true");

    const errors = await readSmokeErrors(session);
    assert.equal(errors.length, 0, `expected no local browser errors, received: ${JSON.stringify(errors)}`);
  });
});

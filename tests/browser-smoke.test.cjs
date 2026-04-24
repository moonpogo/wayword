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

async function readSmokeErrors(session) {
  return await session.execute(`
    return Array.isArray(window.__waywordSmokeErrors) ? window.__waywordSmokeErrors.slice() : [];
  `);
}

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

test("browser smoke: Patterns view opens after five saved runs", async (t) => {
  await withSmokeSession(t, async (session) => {
    await loadFreshApp(session);
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

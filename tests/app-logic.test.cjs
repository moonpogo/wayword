const assert = require("node:assert/strict");
const test = require("node:test");
const {
  createClassList,
  createMemoryStorage,
  loadBrowserScripts,
  silentConsole,
} = require("./helpers/browser-context.cjs");

function buildPromptLibrary() {
  const promptLibrary = {
    Observation: [
      { id: "obs-1", text: "Prompt 1", nearDuplicateGroup: "obs-a", active: true },
      { id: "obs-2", text: "Prompt 2", nearDuplicateGroup: "obs-a", active: true },
      { id: "obs-3", text: "Prompt 3", nearDuplicateGroup: "obs-b", active: true },
    ],
    Relation: [
      { id: "rel-1", text: "Prompt 4", nearDuplicateGroup: "rel-a", active: true },
    ],
  };
  const promptEntryById = new Map(
    Object.values(promptLibrary)
      .flat()
      .map((entry) => [entry.id, entry])
  );
  return { promptLibrary, promptEntryById };
}

function loadPromptSelectionContext() {
  return loadBrowserScripts(["src/features/writing/prompt-selection.js"], {
    console: silentConsole(),
  });
}

function loadRecentRunsPrepContext() {
  return loadBrowserScripts(["src/features/writing/recent-runs-view-prep.js"], {
    console: silentConsole(),
  });
}

function loadRecentRunsInteractionContext(documentStub) {
  return loadBrowserScripts(["src/features/writing/recent-runs-interaction.js"], {
    console: silentConsole(),
    document: documentStub,
  });
}

function loadSavedRunsContext(overrides = {}) {
  return loadBrowserScripts(
    [
      "src/data/runs/schemaVersion.js",
      "src/data/runs/runDocumentUtils.js",
      "src/data/runs/runDocumentMarkdown.js",
      "src/data/runs/runDocumentModel.js",
      "src/data/runs/runDocumentRepository.js",
      "src/data/runs/savedRunsCanonicalRead.js",
      "src/data/runs/savedRunPersistence.js",
    ],
    {
      console: silentConsole(),
      localStorage: createMemoryStorage(),
      waywordRunModel: {
        cloneMirrorPipelineResultForStorage(value) {
          return JSON.parse(JSON.stringify(value));
        },
      },
      ...overrides,
    }
  );
}

function makeCanonicalSaveInput(overrides = {}) {
  return {
    runId: "run-default",
    savedAt: 100,
    timestamp: 100,
    body: "alpha draft",
    prompt: "Prompt",
    analysis: {
      totalWords: 2,
      repeated: [],
      bannedHits: [],
      repeatedStarters: [],
      uniqueCount: 2,
      uniqueRatio: 1,
      avgSentenceLength: 2,
      counts: {},
      starterCounts: {},
      starterExampleList: [],
      punctuation: {},
      perspective: {},
    },
    runScore: 12,
    scoreBreakdown: { completion: 12 },
    challengeActive: false,
    challengeCompleted: false,
    challengeWordsSnapshot: [],
    wasSuccessful: true,
    activeTargetWords: 60,
    activeTimerSecondsForRun: null,
    finishedWithinTime: true,
    timeRemainingSnapshot: null,
    timerConfigured: false,
    repeatLimitAtRun: 2,
    mirrorLoadFailed: true,
    ...overrides,
  };
}

test("prompt selection avoids immediate repeat ids and near-duplicate groups when eligible", () => {
  const context = loadPromptSelectionContext();
  const { promptLibrary, promptEntryById } = buildPromptLibrary();

  const chosen = context.waywordPromptSelection.choosePromptFamilyAndEntry({
    forcedFamilyKey: "Observation",
    recentPromptIds: ["obs-1"],
    recentFamilyKeys: ["Observation"],
    promptFamiliesOrder: ["Observation", "Relation"],
    promptLibrary,
    promptEntryById,
    recentIdWindow: 8,
    nearDuplicateWindow: 3,
    recentFamilyWindow: 4,
    rng: () => 0,
  });

  assert.equal(chosen.family, "Observation");
  assert.equal(chosen.entry.id, "obs-3");
  assert.notEqual(chosen.entry.nearDuplicateGroup, "obs-a");
});

test("prompt selection falls across families when the forced family is exhausted", () => {
  const context = loadPromptSelectionContext();
  const { promptLibrary, promptEntryById } = buildPromptLibrary();

  const chosen = context.waywordPromptSelection.choosePromptFamilyAndEntry({
    forcedFamilyKey: "Observation",
    recentPromptIds: ["obs-1", "obs-2", "obs-3"],
    recentFamilyKeys: ["Observation", "Observation"],
    promptFamiliesOrder: ["Observation", "Relation"],
    promptLibrary,
    promptEntryById,
    recentIdWindow: 8,
    nearDuplicateWindow: 3,
    recentFamilyWindow: 4,
    rng: () => 0,
  });

  assert.equal(chosen.family, "Relation");
  assert.equal(chosen.entry.id, "rel-1");
});

test("reroll gating stays tied to active, unsubmitted, empty-editor state", () => {
  const context = loadPromptSelectionContext();

  assert.equal(
    context.waywordPromptSelection.canRerollPromptCore({
      active: true,
      submitted: false,
      editorTextEmpty: true,
      promptRerollsUsed: 0,
      rerollLimit: 2,
    }),
    true
  );

  assert.equal(
    context.waywordPromptSelection.canRerollPromptCore({
      active: true,
      submitted: false,
      editorTextEmpty: false,
      promptRerollsUsed: 0,
      rerollLimit: 2,
    }),
    false
  );
});

test("recent runs view prep returns expected empty and expanded states", () => {
  const context = loadRecentRunsPrepContext();
  const prep = context.waywordRecentRunsViewPrep.prepareRecentRunsViewModel;

  const empty = prep({
    runsNewestFirst: [],
    historyExpanded: false,
    capDrawer: 3,
    capRail: 2,
  });
  assert.equal(empty.isEmpty, true);
  assert.equal(empty.clearExpandedHistory, true);

  const filled = prep({
    runsNewestFirst: [{ runId: "run-3" }, { runId: "run-2" }, { runId: "run-1" }],
    historyExpanded: false,
    capDrawer: 2,
    capRail: 1,
  });
  assert.equal(filled.isEmpty, false);
  assert.equal(filled.totalCount, 3);
  assert.deepEqual(filled.drawerSlice.map((run) => run.runId), ["run-3", "run-2"]);
  assert.deepEqual(filled.railSlice.map((run) => run.runId), ["run-3"]);

  const expanded = prep({
    runsNewestFirst: [{ runId: "run-2" }, { runId: "run-1" }],
    historyExpanded: true,
    capDrawer: 1,
    capRail: 1,
  });
  assert.equal(expanded.expanded, true);
  assert.equal(expanded.drawerRunsExpandedBody, true);
  assert.deepEqual(expanded.drawerSlice.map((run) => run.runId), ["run-2", "run-1"]);
  assert.deepEqual(expanded.railSlice.map((run) => run.runId), ["run-2", "run-1"]);
});

test("recent runs row expansion keeps a single open entry and toggles aria-expanded", () => {
  function makeRecentEntry() {
    const expanded = { hidden: true };
    const classList = createClassList();
    return {
      classList,
      querySelector(sel) {
        return sel === ".recent-entry-expanded" ? expanded : null;
      },
      setAttribute(name, value) {
        this._attrs = this._attrs || new Map();
        this._attrs.set(name, value);
      },
      getAttribute(name) {
        return this._attrs?.get(name) ?? null;
      },
      expanded,
    };
  }

  const entryA = makeRecentEntry();
  const entryB = makeRecentEntry();
  const allEntries = [entryA, entryB];

  const documentStub = {
    querySelectorAll(sel) {
      if (sel !== ".recent-entry.is-open") return [];
      return allEntries.filter((el) => el.classList.contains("is-open"));
    },
  };

  const context = loadRecentRunsInteractionContext(documentStub);
  const { toggleRecentEntry } = context.waywordRecentRunsInteraction;

  toggleRecentEntry(entryA);
  assert.equal(entryA.classList.contains("is-open"), true);
  assert.equal(entryA.expanded.hidden, false);
  assert.equal(entryA.getAttribute("aria-expanded"), "true");

  toggleRecentEntry(entryB);
  assert.equal(entryA.classList.contains("is-open"), false);
  assert.equal(entryA.expanded.hidden, true);
  assert.equal(entryA.getAttribute("aria-expanded"), "false");
  assert.equal(entryB.classList.contains("is-open"), true);
  assert.equal(entryB.expanded.hidden, false);

  toggleRecentEntry(entryB);
  assert.equal(entryB.classList.contains("is-open"), false);
  assert.equal(entryB.expanded.hidden, true);
});

test("saved-run persistence writes canonical documents and reads them back in both orders", () => {
  const removedMarkers = [];
  const context = loadSavedRunsContext();
  context.waywordStorage = {
    removeInactivityEaseRun(key) {
      removedMarkers.push(key);
    },
  };
  context.waywordRunDocumentRepo =
    context.waywordRunDocumentRepository.createLocalStorageRunDocumentRepository({
      storage: context.localStorage,
    });

  const history = [];
  const savedRunIds = new Set();
  let persistCalls = 0;

  const first = context.waywordSavedRunPersistence.persistSuccessfulSavedRun({
    run: { runId: "run-1" },
    canonicalSaveInput: makeCanonicalSaveInput({
      runId: "run-1",
      savedAt: 100,
      timestamp: 100,
      body: "alpha draft",
    }),
    history,
    savedRunIds,
    inactivityEaseRunKey: "ease-key",
    persist() {
      persistCalls += 1;
    },
  });

  const second = context.waywordSavedRunPersistence.persistSuccessfulSavedRun({
    run: { runId: "run-2" },
    canonicalSaveInput: makeCanonicalSaveInput({
      runId: "run-2",
      savedAt: 200,
      timestamp: 200,
      body: "beta draft",
    }),
    history,
    savedRunIds,
    inactivityEaseRunKey: "ease-key",
    persist() {
      persistCalls += 1;
    },
  });

  assert.equal(first.canonicalPersisted, true);
  assert.equal(second.canonicalPersisted, true);
  assert.equal(persistCalls, 2);
  assert.deepEqual(removedMarkers, ["ease-key", "ease-key"]);
  assert.deepEqual(history.map((row) => row.runId), ["run-1", "run-2"]);
  assert.ok(savedRunIds.has("run-1"));
  assert.ok(savedRunIds.has("run-2"));
  assert.ok(context.localStorage.getItem(context.WAYWORD_RUN_DOCUMENTS_STORAGE_KEY));

  const chronological = context.waywordSavedRunsRead.listSavedRunsChronological();
  const newestFirst = context.waywordSavedRunsRead.listSavedRunsNewestFirst();

  assert.deepEqual(Array.from(chronological, (row) => row.runId), ["run-1", "run-2"]);
  assert.deepEqual(Array.from(newestFirst, (row) => row.runId), ["run-2", "run-1"]);
  assert.equal(newestFirst[0].text, "beta draft");
  assert.equal(chronological[0].text, "alpha draft");
});

test("saved-run persistence keeps legacy sync alive when canonical upsert fails", () => {
  const removedMarkers = [];
  const context = loadBrowserScripts(["src/data/runs/savedRunPersistence.js"], {
    console: silentConsole(),
  });
  context.waywordRunDocumentsModel = {
    assembleRunDocumentForSuccessfulSave() {
      return { runId: "run-fail" };
    },
    legacyHistoryRowFromCanonicalDocument() {
      return { runId: "run-fail", text: "projected row" };
    },
  };
  context.waywordRunDocumentRepo = {
    upsertDocument() {
      throw new Error("quota");
    },
  };
  context.waywordStorage = {
    removeInactivityEaseRun(key) {
      removedMarkers.push(key);
    },
  };

  const history = [];
  const savedRunIds = new Set();
  let persistCalls = 0;

  const result = context.waywordSavedRunPersistence.persistSuccessfulSavedRun({
    run: { runId: "run-fail" },
    canonicalSaveInput: { runId: "run-fail" },
    history,
    savedRunIds,
    inactivityEaseRunKey: "ease-key",
    persist() {
      persistCalls += 1;
    },
  });

  assert.equal(result.canonicalPersisted, false);
  assert.equal(result.legacyPersisted, true);
  assert.equal(history.length, 1);
  assert.equal(history[0].runId, "run-fail");
  assert.equal(history[0].text, "projected row");
  assert.ok(savedRunIds.has("run-fail"));
  assert.equal(persistCalls, 1);
  assert.deepEqual(removedMarkers, ["ease-key"]);
});

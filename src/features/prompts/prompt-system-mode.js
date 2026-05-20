(function initWaywordPromptSystemMode(global) {
  "use strict";

  var V1_ENTRY_FAMILY = "Entry";
  var V1_TORSION_FAMILY = "Torsion";
  var FIRST_SESSION_ENTRY_PROMPT_IDS = Object.freeze([
    "entry-001",
    "entry-002",
    "entry-005",
    "entry-009",
    "entry-011",
    "entry-016",
    "entry-019",
    "entry-026",
  ]);
  var DEFAULT_STRATA_READINESS_BAND = "entry_support";
  var READINESS_LAYER_WEIGHTS = Object.freeze({
    entry_support: Object.freeze({ entry: 100, torsion: 0 }),
    entry_stable: Object.freeze({ entry: 100, torsion: 0 }),
    torsion_ready: Object.freeze({ entry: 90, torsion: 10 }),
    resonance_candidate: Object.freeze({ entry: 70, torsion: 30 }),
  });

  function normalizeReadinessBand(value) {
    var band = String(value == null ? "" : value).trim().toLowerCase();
    return READINESS_LAYER_WEIGHTS[band] ? band : DEFAULT_STRATA_READINESS_BAND;
  }

  function getLayerWeightsForReadinessBand(readinessBand) {
    var band = normalizeReadinessBand(readinessBand);
    var row = READINESS_LAYER_WEIGHTS[band];
    return {
      entry: Number(row.entry) || 0,
      torsion: Number(row.torsion) || 0,
      resonance: 0,
    };
  }

  function selectEligiblePromptLayers(input) {
    var params = input && typeof input === "object" ? input : {};
    var weights = getLayerWeightsForReadinessBand(params.readinessBand);
    var entryCount = Array.isArray(params.entryPrompts) ? params.entryPrompts.length : 0;
    var torsionCount = Array.isArray(params.torsionPrompts) ? params.torsionPrompts.length : 0;
    var layers = [];
    if (entryCount > 0 && weights.entry > 0) layers.push("entry");
    if (torsionCount > 0 && weights.torsion > 0) layers.push("torsion");
    return layers;
  }

  function buildFamilyOrderFromWeights(layers, weights) {
    var order = [];
    if (!Array.isArray(layers) || !layers.length) return [V1_ENTRY_FAMILY];
    var entryWeight = Number(weights.entry) || 0;
    var torsionWeight = Number(weights.torsion) || 0;
    var entrySlots = 0;
    var torsionSlots = 0;

    if (layers.indexOf("entry") !== -1 && layers.indexOf("torsion") !== -1) {
      entrySlots = Math.max(1, Math.round(entryWeight / 10));
      torsionSlots = Math.max(1, Math.round(torsionWeight / 10));
    } else if (layers.indexOf("entry") !== -1) {
      entrySlots = 1;
    } else if (layers.indexOf("torsion") !== -1) {
      torsionSlots = 1;
    }

    for (var i = 0; i < entrySlots; i++) order.push(V1_ENTRY_FAMILY);
    for (var j = 0; j < torsionSlots; j++) order.push(V1_TORSION_FAMILY);
    return order.length ? order : [V1_ENTRY_FAMILY];
  }

  function mapLayerPromptsToRuntimeRows(source, structure) {
    var list = Array.isArray(source) ? source : [];
    return list.map(function mapRow(row) {
      return {
        id: row.id,
        text: row.text,
        nearDuplicateGroup: row.id,
        intensity: structure === "torsion" ? 2 : 1,
        structure: structure,
        active: true,
      };
    });
  }

  function buildPromptEntryByIdFromLibrary(promptLibrary) {
    var byId = new Map();
    var families = Object.keys(promptLibrary || {});
    for (var i = 0; i < families.length; i++) {
      var family = families[i];
      var rows = promptLibrary[family] || [];
      for (var j = 0; j < rows.length; j++) {
        var row = rows[j];
        byId.set(row.id, {
          id: row.id,
          nearDuplicateGroup: row.nearDuplicateGroup,
          family: family,
        });
      }
    }
    return byId;
  }

  function buildStrataWeightedPromptCatalog(input) {
    var params = input && typeof input === "object" ? input : {};
    var isFirstSession = Boolean(params.isFirstSession);
    var entrySource = Array.isArray(params.entryPrompts) ? params.entryPrompts : [];
    var entryPrompts = isFirstSession
      ? entrySource.filter(function onlyFirstSessionEntryPrompt(prompt) {
          return FIRST_SESSION_ENTRY_PROMPT_IDS.indexOf(String(prompt && prompt.id)) !== -1;
        })
      : entrySource;
    var torsionPrompts = Array.isArray(params.torsionPrompts) ? params.torsionPrompts : [];
    var readinessBand = isFirstSession ? "entry_support" : normalizeReadinessBand(params.readinessBand);
    var weights = getLayerWeightsForReadinessBand(readinessBand);
    var eligibleLayers = selectEligiblePromptLayers({
      readinessBand: readinessBand,
      entryPrompts: entryPrompts,
      torsionPrompts: torsionPrompts,
    });
    var familyOrder = buildFamilyOrderFromWeights(eligibleLayers, weights);

    var promptLibrary = {};
    if (familyOrder.indexOf(V1_ENTRY_FAMILY) !== -1) {
      promptLibrary[V1_ENTRY_FAMILY] = mapLayerPromptsToRuntimeRows(entryPrompts, "entry");
    }
    if (familyOrder.indexOf(V1_TORSION_FAMILY) !== -1) {
      promptLibrary[V1_TORSION_FAMILY] = mapLayerPromptsToRuntimeRows(torsionPrompts, "torsion");
    }
    if (!promptLibrary[V1_ENTRY_FAMILY]) {
      promptLibrary[V1_ENTRY_FAMILY] = mapLayerPromptsToRuntimeRows(entryPrompts, "entry");
    }

    return {
      promptFamiliesOrder: familyOrder,
      promptLibrary: promptLibrary,
      promptEntryById: buildPromptEntryByIdFromLibrary(promptLibrary),
      readinessBand: readinessBand,
      layerWeights: weights,
    };
  }

  global.waywordPromptSystemMode = {
    V1_ENTRY_FAMILY: V1_ENTRY_FAMILY,
    V1_TORSION_FAMILY: V1_TORSION_FAMILY,
    FIRST_SESSION_ENTRY_PROMPT_IDS: FIRST_SESSION_ENTRY_PROMPT_IDS,
    getLayerWeightsForReadinessBand: getLayerWeightsForReadinessBand,
    selectEligiblePromptLayers: selectEligiblePromptLayers,
    buildStrataWeightedPromptCatalog: buildStrataWeightedPromptCatalog,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);

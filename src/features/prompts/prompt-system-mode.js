(function initWaywordPromptSystemMode(global) {
  "use strict";

  var PROMPT_SYSTEM_MODES = Object.freeze({
    V0: "v0",
    V1: "v1",
  });

  var V1_ENTRY_FAMILY = "Entry";
  var V1_TORSION_FAMILY = "Torsion";
  var PROMPT_SYSTEM_STORAGE_KEY = "waywordPromptSystem";
  var DEFAULT_STRATA_READINESS_BAND = "entry_support";
  var READINESS_LAYER_WEIGHTS = Object.freeze({
    entry_support: Object.freeze({ entry: 100, torsion: 0 }),
    entry_stable: Object.freeze({ entry: 100, torsion: 0 }),
    torsion_ready: Object.freeze({ entry: 90, torsion: 10 }),
    resonance_candidate: Object.freeze({ entry: 70, torsion: 30 }),
  });

  function isLocalDevContext(locationLike) {
    var locationRef = locationLike || {};
    var protocol = String(locationRef.protocol || "").toLowerCase();
    var hostname = String(locationRef.hostname || "").toLowerCase();
    return protocol === "file:" || hostname === "localhost" || hostname === "127.0.0.1";
  }

  function readPromptSystemOverride(locationLike, storageLike) {
    var queryMode = null;
    try {
      var search = String((locationLike && locationLike.search) || "");
      var match = search.match(/[?&]promptSystem=([^&]+)/i);
      var fromQuery = String(match && match[1] ? decodeURIComponent(match[1]) : "")
        .toLowerCase()
        .trim();
      if (fromQuery === PROMPT_SYSTEM_MODES.V0 || fromQuery === PROMPT_SYSTEM_MODES.V1) {
        queryMode = fromQuery;
      }
    } catch (_) {
      queryMode = null;
    }
    if (queryMode) return queryMode;

    try {
      var fromStorage = String(storageLike.getItem(PROMPT_SYSTEM_STORAGE_KEY) || "")
        .toLowerCase()
        .trim();
      if (fromStorage === PROMPT_SYSTEM_MODES.V0 || fromStorage === PROMPT_SYSTEM_MODES.V1) {
        return fromStorage;
      }
    } catch (_) {
      return null;
    }
    return null;
  }

  function resolvePromptSystemMode(input) {
    var env = input && typeof input === "object" ? input : {};
    var locationRef = env.location || global.location || {};
    var storageRef = env.localStorage || global.localStorage;
    if (!isLocalDevContext(locationRef)) return PROMPT_SYSTEM_MODES.V0;
    var override = readPromptSystemOverride(locationRef, storageRef);
    return override === PROMPT_SYSTEM_MODES.V1 ? PROMPT_SYSTEM_MODES.V1 : PROMPT_SYSTEM_MODES.V0;
  }

  function buildV1EntryPromptCatalog(entryPrompts) {
    var source = Array.isArray(entryPrompts) ? entryPrompts : [];
    var familyList = [V1_ENTRY_FAMILY];
    var promptRows = source.map(function mapEntryPrompt(row) {
      return {
        id: row.id,
        text: row.text,
        nearDuplicateGroup: row.id,
        intensity: 1,
        structure: "entry",
        active: true,
      };
    });
    var library = {};
    library[V1_ENTRY_FAMILY] = promptRows;
    var byId = new Map();
    for (var i = 0; i < promptRows.length; i++) {
      var row = promptRows[i];
      byId.set(row.id, {
        id: row.id,
        nearDuplicateGroup: row.nearDuplicateGroup,
        family: V1_ENTRY_FAMILY,
      });
    }
    return {
      promptFamiliesOrder: familyList,
      promptLibrary: library,
      promptEntryById: byId,
      family: V1_ENTRY_FAMILY,
    };
  }

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
    var entryPrompts = Array.isArray(params.entryPrompts) ? params.entryPrompts : [];
    var torsionPrompts = Array.isArray(params.torsionPrompts) ? params.torsionPrompts : [];
    var readinessBand = normalizeReadinessBand(params.readinessBand);
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
    PROMPT_SYSTEM_MODES: PROMPT_SYSTEM_MODES,
    V1_ENTRY_FAMILY: V1_ENTRY_FAMILY,
    V1_TORSION_FAMILY: V1_TORSION_FAMILY,
    PROMPT_SYSTEM_STORAGE_KEY: PROMPT_SYSTEM_STORAGE_KEY,
    isLocalDevContext: isLocalDevContext,
    readPromptSystemOverride: readPromptSystemOverride,
    resolvePromptSystemMode: resolvePromptSystemMode,
    buildV1EntryPromptCatalog: buildV1EntryPromptCatalog,
    getLayerWeightsForReadinessBand: getLayerWeightsForReadinessBand,
    selectEligiblePromptLayers: selectEligiblePromptLayers,
    buildStrataWeightedPromptCatalog: buildStrataWeightedPromptCatalog,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);

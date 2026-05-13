(function initWaywordPromptSystemMode(global) {
  "use strict";

  var PROMPT_SYSTEM_MODES = Object.freeze({
    V0: "v0",
    V1: "v1",
  });

  var V1_ENTRY_FAMILY = "Entry";
  var PROMPT_SYSTEM_STORAGE_KEY = "waywordPromptSystem";

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

  global.waywordPromptSystemMode = {
    PROMPT_SYSTEM_MODES: PROMPT_SYSTEM_MODES,
    V1_ENTRY_FAMILY: V1_ENTRY_FAMILY,
    PROMPT_SYSTEM_STORAGE_KEY: PROMPT_SYSTEM_STORAGE_KEY,
    isLocalDevContext: isLocalDevContext,
    readPromptSystemOverride: readPromptSystemOverride,
    resolvePromptSystemMode: resolvePromptSystemMode,
    buildV1EntryPromptCatalog: buildV1EntryPromptCatalog,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);

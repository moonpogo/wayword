/**
 * Pure prompt eligibility / selection for v1.1 prompt families.
 * No DOM, no app state mutation — callers pass recent windows and catalog refs.
 */
(function initWaywordPromptSelection(global) {
  "use strict";

  /**
   * @param {unknown[]} arr
   * @param {() => number} [rng]
   */
  function pickRandomFromArray(arr, rng) {
    if (!arr.length) return null;
    const random = typeof rng === "function" ? rng : Math.random;
    return arr[Math.floor(random() * arr.length)];
  }

  /**
   * @param {string[]} recentPromptIds
   * @param {number} nearDuplicateWindow
   * @param {Map<string, { nearDuplicateGroup: string }>} promptEntryById
   */
  function nearDuplicateGroupsFromRecentTail(recentPromptIds, nearDuplicateWindow, promptEntryById) {
    const tail = recentPromptIds.slice(-nearDuplicateWindow);
    const groups = new Set();
    for (const id of tail) {
      const row = promptEntryById.get(id);
      if (row) groups.add(row.nearDuplicateGroup);
    }
    return groups;
  }

  /**
   * @param {string} familyKey
   * @param {boolean} skipNearDuplicate
   * @param {{
   *   recentPromptIds: string[],
   *   recentIdWindow: number,
   *   nearDuplicateWindow: number,
   *   promptLibrary: Record<string, Array<{ id: string, active: boolean, nearDuplicateGroup: string }>>,
   *   promptEntryById: Map<string, { nearDuplicateGroup: string }>,
   * }} ctx
   */
  function getEligiblePromptsInFamily(familyKey, skipNearDuplicate, ctx) {
    const list = ctx.promptLibrary[familyKey] || [];
    const recentIdSet = new Set(ctx.recentPromptIds.slice(-ctx.recentIdWindow));
    const blockedGroups = skipNearDuplicate
      ? nearDuplicateGroupsFromRecentTail(
          ctx.recentPromptIds,
          ctx.nearDuplicateWindow,
          ctx.promptEntryById
        )
      : new Set();
    return list.filter((e) => {
      if (!e.active) return false;
      if (recentIdSet.has(e.id)) return false;
      if (skipNearDuplicate && blockedGroups.has(e.nearDuplicateGroup)) return false;
      return true;
    });
  }

  function countFamilyInRecentWindow(familyKey, recentFamilyKeys, recentFamilyWindow) {
    const tail = recentFamilyKeys.slice(-recentFamilyWindow);
    let n = 0;
    for (const f of tail) {
      if (f === familyKey) n += 1;
    }
    return n;
  }

  /**
   * @param {{
   *   promptFamiliesOrder: string[],
   *   promptLibrary: Record<string, unknown[]>,
   *   promptEntryById: Map<string, { nearDuplicateGroup: string }>,
   *   recentPromptIds: string[],
   *   recentFamilyKeys: string[],
   *   recentIdWindow: number,
   *   nearDuplicateWindow: number,
   *   recentFamilyWindow: number,
   *   rng?: () => number,
   * }} ctx
   */
  function pickFamilyKeyForNewPrompt(ctx) {
    const baseCtx = {
      recentPromptIds: ctx.recentPromptIds,
      recentIdWindow: ctx.recentIdWindow,
      nearDuplicateWindow: ctx.nearDuplicateWindow,
      promptLibrary: ctx.promptLibrary,
      promptEntryById: ctx.promptEntryById,
    };
    let candidates = ctx.promptFamiliesOrder.filter(
      (f) => getEligiblePromptsInFamily(f, true, baseCtx).length > 0
    );
    if (!candidates.length) {
      candidates = ctx.promptFamiliesOrder.filter((f) => getEligiblePromptsInFamily(f, false, baseCtx).length > 0);
    }
    if (!candidates.length) return null;
    const weights = candidates.map((f) => 1 / (1 + countFamilyInRecentWindow(f, ctx.recentFamilyKeys, ctx.recentFamilyWindow)));
    const sum = weights.reduce((a, b) => a + b, 0);
    const random = typeof ctx.rng === "function" ? ctx.rng : Math.random;
    let r = random() * sum;
    for (let i = 0; i < candidates.length; i++) {
      r -= weights[i];
      if (r <= 0) return candidates[i];
    }
    return candidates[candidates.length - 1];
  }

  function tryPickInFamily(familyKey, preferNearDuplicateFilter, ctx) {
    const baseCtx = {
      recentPromptIds: ctx.recentPromptIds,
      recentIdWindow: ctx.recentIdWindow,
      nearDuplicateWindow: ctx.nearDuplicateWindow,
      promptLibrary: ctx.promptLibrary,
      promptEntryById: ctx.promptEntryById,
    };
    let eligible = getEligiblePromptsInFamily(familyKey, preferNearDuplicateFilter, baseCtx);
    if (eligible.length) {
      return { family: familyKey, entry: pickRandomFromArray(eligible, ctx.rng) };
    }
    if (preferNearDuplicateFilter) {
      eligible = getEligiblePromptsInFamily(familyKey, false, baseCtx);
      if (eligible.length) {
        return { family: familyKey, entry: pickRandomFromArray(eligible, ctx.rng) };
      }
    }
    return null;
  }

  function pickAcrossFamiliesSkipping(skipFamilyKey, ctx) {
    const baseCtx = {
      recentPromptIds: ctx.recentPromptIds,
      recentIdWindow: ctx.recentIdWindow,
      nearDuplicateWindow: ctx.nearDuplicateWindow,
      promptLibrary: ctx.promptLibrary,
      promptEntryById: ctx.promptEntryById,
    };
    for (const fam of ctx.promptFamiliesOrder) {
      if (skipFamilyKey && fam === skipFamilyKey) continue;
      const strict = getEligiblePromptsInFamily(fam, true, baseCtx);
      if (strict.length) return { family: fam, entry: pickRandomFromArray(strict, ctx.rng) };
    }
    for (const fam of ctx.promptFamiliesOrder) {
      if (skipFamilyKey && fam === skipFamilyKey) continue;
      const relaxed = getEligiblePromptsInFamily(fam, false, baseCtx);
      if (relaxed.length) return { family: fam, entry: pickRandomFromArray(relaxed, ctx.rng) };
    }
    return null;
  }

  function pickPromptEntryBruteFallback(ctx) {
    const all = ctx.promptFamiliesOrder.flatMap((f) => (ctx.promptLibrary[f] || []).filter((e) => e.active));
    const entry = pickRandomFromArray(all, ctx.rng);
    if (!entry) {
      return {
        family: "Observation",
        entry: {
          id: "fallback_write_stretch",
          text: "Write for one uninterrupted stretch.",
          nearDuplicateGroup: "fallback",
          intensity: 1,
          structure: "describe_scene",
          active: true,
        },
      };
    }
    const fam =
      ctx.promptFamiliesOrder.find((f) => (ctx.promptLibrary[f] || []).some((e) => e.id === entry.id)) ||
      "Observation";
    return { family: fam, entry };
  }

  /**
   * Chooses `{ family, entry }` using the same order as legacy `generatePrompt` (forced in-family path,
   * weighted family pick, cross-family, brute fallback).
   *
   * @param {{
   *   forcedFamilyKey: string | null,
   *   recentPromptIds: string[],
   *   recentFamilyKeys: string[],
   *   promptFamiliesOrder: string[],
   *   promptLibrary: Record<string, unknown[]>,
   *   promptEntryById: Map<string, { nearDuplicateGroup: string }>,
   *   recentIdWindow: number,
   *   nearDuplicateWindow: number,
   *   recentFamilyWindow: number,
   *   rng?: () => number,
   * }} args
   * @returns {{ family: string, entry: { id: string, text: string, nearDuplicateGroup: string, intensity: number, structure: string, active: boolean } }}
   */
  function choosePromptFamilyAndEntry(args) {
    const ctx = {
      promptFamiliesOrder: args.promptFamiliesOrder,
      promptLibrary: args.promptLibrary,
      promptEntryById: args.promptEntryById,
      recentPromptIds: args.recentPromptIds,
      recentFamilyKeys: args.recentFamilyKeys,
      recentIdWindow: args.recentIdWindow,
      nearDuplicateWindow: args.nearDuplicateWindow,
      recentFamilyWindow: args.recentFamilyWindow,
      rng: args.rng,
    };

    let chosen = null;
    if (args.forcedFamilyKey) {
      const forced = args.forcedFamilyKey;
      chosen =
        tryPickInFamily(forced, true, ctx) ||
        tryPickInFamily(forced, false, ctx) ||
        pickAcrossFamiliesSkipping(forced, ctx);
    } else {
      const fam = pickFamilyKeyForNewPrompt(ctx);
      if (fam) {
        chosen = tryPickInFamily(fam, true, ctx) || tryPickInFamily(fam, false, ctx);
      }
      if (!chosen) {
        chosen = pickAcrossFamiliesSkipping(null, ctx);
      }
    }
    if (!chosen) {
      chosen = pickPromptEntryBruteFallback(ctx);
    }
    return chosen;
  }

  /**
   * Same boolean as legacy `canRerollPrompt` when passed the same inputs.
   * @param {{ active: boolean, submitted: boolean, editorTextEmpty: boolean, promptRerollsUsed: number, rerollLimit: number }} p
   */
  function canRerollPromptCore(p) {
    return (
      p.active &&
      !p.submitted &&
      p.editorTextEmpty &&
      p.promptRerollsUsed < p.rerollLimit
    );
  }

  global.waywordPromptSelection = {
    choosePromptFamilyAndEntry,
    canRerollPromptCore,
  };
})(typeof globalThis !== "undefined" ? globalThis : window);

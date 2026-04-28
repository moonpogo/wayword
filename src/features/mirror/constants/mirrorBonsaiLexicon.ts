/**
 * Runtime experimental headline mode (reversible):
 *   globalThis.__WAYWORD_MIRROR_BONSAI_HEADLINES__ = true
 * or localStorage key `wayword-mirror-bonsai-headlines` = '1' (mirror-controller boot sync).
 *
 * Thin-refusal experiment (default off):
 *   globalThis.__WAYWORD_MIRROR_REFUSAL_EXPERIMENT__ = true
 * or localStorage `wayword-mirror-refusal-experiment` = '1'
 */

function readLocalStorageFlag(key: string): boolean {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(key) === "1";
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function mirrorBonsaiHeadlinesActive(): boolean {
  if (
    typeof globalThis !== "undefined" &&
    Boolean((globalThis as unknown as { __WAYWORD_MIRROR_BONSAI_HEADLINES__?: boolean }).__WAYWORD_MIRROR_BONSAI_HEADLINES__)
  ) {
    return true;
  }
  return readLocalStorageFlag("wayword-mirror-bonsai-headlines");
}

export function mirrorThinRefusalExperimentActive(): boolean {
  if (
    typeof globalThis !== "undefined" &&
    Boolean((globalThis as unknown as { __WAYWORD_MIRROR_REFUSAL_EXPERIMENT__?: boolean }).__WAYWORD_MIRROR_REFUSAL_EXPERIMENT__)
  ) {
    return true;
  }
  return readLocalStorageFlag("wayword-mirror-refusal-experiment");
}

/** Post-submit ritual prompt prototype (default off). */
export function mirrorExperimentalTheCutActive(): boolean {
  if (
    typeof globalThis !== "undefined" &&
    Boolean((globalThis as unknown as { __WAYWORD_EXPERIMENTAL_THE_CUT__?: boolean }).__WAYWORD_EXPERIMENTAL_THE_CUT__)
  ) {
    return true;
  }
  return readLocalStorageFlag("wayword-experimental-the-cut");
}

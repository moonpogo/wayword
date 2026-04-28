import { mirrorBonsaiHeadlinesActive, mirrorThinRefusalExperimentActive } from "../constants/mirrorBonsaiLexicon.js";
import {
  hashSessionSalt,
  isMirrorFallbackSoftStatement,
  MIRROR_HEADLINE_LOW_SIGNAL_CONTINUE,
  MIRROR_HEADLINE_LOW_SIGNAL_SURFACE
} from "../constants/mirrorSessionHeadlines.js";
import type { MirrorPipelineResult, MirrorSessionInput, MirrorSelectedReflection } from "../types/mirrorTypes.js";

/**
 * ~2% of eligible soft-fallback primaries: only the thin-signal line, no supporting, no stack.
 * Never when calibration is still completing. Off unless `__WAYWORD_MIRROR_REFUSAL_EXPERIMENT__`.
 */
export function applyThinRefusalExperiment(
  input: MirrorSessionInput,
  result: MirrorPipelineResult
): MirrorPipelineResult {
  if (!mirrorThinRefusalExperimentActive()) return result;
  if (input.calibrationIncomplete) return result;
  const main = result.main;
  if (!main) return result;
  if (main.category === "low_signal") return result;

  const isSoft =
    main.category === "fallback" || (main.statement && isMirrorFallbackSoftStatement(main.statement));
  if (!isSoft) return result;

  const sessionId = String(input.sessionId ?? "wayword");
  const h = hashSessionSalt(sessionId, "mirrorThinRefusal");
  if (h % 100 >= 2) return result;

  const thinLine = mirrorBonsaiHeadlinesActive()
    ? MIRROR_HEADLINE_LOW_SIGNAL_CONTINUE
    : MIRROR_HEADLINE_LOW_SIGNAL_SURFACE;

  const refusalMain: MirrorSelectedReflection = {
    ...main,
    id: `low_signal_refusal:${sessionId}`,
    category: "low_signal",
    statement: thinLine,
    evidence: [],
    rankScore: 0,
    role: "main"
  };

  return { main: refusalMain, supporting: [] };
}

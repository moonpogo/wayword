import { mockSignals } from "./mockSignals.js";

const canvas = document.getElementById("railCanvas");
const railShell = canvas?.closest(".rail-shell");
const textColumn = document.getElementById("textColumn");
const paragraphNodes = Array.from(document.querySelectorAll(".prose-paragraph"));

if (!canvas || !railShell || !textColumn || paragraphNodes.length === 0) {
  throw new Error("Field Rail V1 failed to initialize.");
}

const ctx = canvas.getContext("2d");
if (!ctx) throw new Error("Canvas context unavailable.");

const paragraphByIndex = new Map();
for (const node of paragraphNodes) {
  const i = Number(node.getAttribute("data-index"));
  if (Number.isFinite(i)) paragraphByIndex.set(i, node);
}

const GLYPH = {
  ink: "rgba(236, 210, 168, 0.88)",
  sub: "rgba(220, 187, 138, 0.34)",
  fracture: "rgba(244, 226, 198, 0.84)",
  glow: "rgba(248, 231, 200, 0.22)"
};

const FIELD = {
  pressure: new Map(),
  hesitation: new Map(),
  orbit: new Map(),
  cadence: new Map(),
  fragment: new Map(),
  decay: 0.965
};

const LANE_BUCKETS = 24;
const glyphLedger = new Map();
const glyphOrder = [];
const hitRegions = [];
const perceptualHistory = [];

const threadState = {
  links: [],
  lastLaneKey: null,
  recurrence: new Map()
};

const COMPOSITION = {
  maxGlyphs: 72,
  maxPerBand: 1,
  minLaneBucketGap: 1,
  overwriteDelta: 0.1,
  mergeDelta: 0.1,
  minMsBetweenRelated: 220,
  linkThreshold: 0.58,
  minLinkLaneDistance: 2,
  priority: {
    orbit: 5,
    hesitation: 4,
    pressure: 3,
    cadence: 2,
    fragment: 1
  }
};

const PERCEPTUAL_GATE = {
  localWindowMs: 2300,
  localSoftCap: 2,
  neighborhoodBuckets: 2,
  neighborhoodCompetitionCap: 1,
  salienceMin: 1.02,
  isolationMaxRecent: 1,
  dominantWindowMs: 4200,
  faintResidueBump: 0.04
};

const TEMPORAL_COMPOSITION = {
  sameFamilyCooldownMs: 1500,
  sameFamilyDampen: 0.56,
  complementBoost: 1.18,
  echoDelayMinMs: 800,
  echoDelayMaxMs: 2500,
  echoChance: 0.2,
  echoStrengthScale: 0.64,
  silenceClusterCount: 3,
  silenceWindowMs: 1100,
  silenceBypassIntensity: 1.85,
  strongThreshold: 1.12
};

const temporalPhraseState = {
  lastStrongAtByKind: new Map(),
  recentKinds: [],
  pendingEchoes: [],
  quietUntilMs: 0
};

const SESSION_STATE = {
  startedAt: performance.now(),
  timeInSession: 0,
  activityHistory: [],
  densityCurve: 0,
  silenceAccumulation: 0,
  momentumBias: 0
};

const SEMANTICS = {
  subtype: {
    orbit: new Map(),
    pressure: new Map(),
    hesitation: new Map(),
    cadence: new Map(),
    fragment: new Map()
  },
  confidence: {
    orbit: new Map(),
    pressure: new Map(),
    hesitation: new Map(),
    cadence: new Map(),
    fragment: new Map()
  }
};

const observerCfg = {
  burstWindowMs: 900,
  burstThreshold: 7,
  pauseMs: 1300,
  deleteWindowMs: 1100,
  deleteThreshold: 4,
  cooldownMs: 650,
  deleteZoneTtlMs: 7000,
  cadenceWindowMs: 4200
};

const QUALITY_TUNING = {
  activity: {
    emitScalar: 0.9,
    minVisiblePerSweepChance: 0.34,
    ambientSeedChance: 0.55,
    ambientPulseMinMs: 2400,
    ambientPulseJitterMs: 2200
  },
  confidenceFloor: {
    orbit: 0.56,
    pressure: 0.52,
    hesitation: 0.52,
    cadence: 0.5,
    fragment: 0.6
  },
  singleParagraph: {
    burstThresholdDelta: -2,
    pauseMsDelta: -220,
    cadenceVarianceFloor: 0.16,
    emitBoost: 1.15
  },
  suppression: {
    fragmentNeeds: { hesitation: 0.28, pressure: 0.22 },
    orbitNeedsRecurrence: 1,
    cadenceNeedsVarianceConfidence: 0.52
  }
};

const ONTOLOGY = {
  orbit: {
    map: "orbit",
    emit: { base: 0.04, gain: 0.12 },
    minStrength: 0.2,
    strength: (f) => f.orbit + f.pressure * 0.3,
    variants: [
      { id: "compressed", when: (f) => f.pressure > 1.2 },
      { id: "broken", when: (f) => f.hesitation > 1.0 },
      { id: "clean", when: () => true }
    ],
    context: (variant, s) => {
      if (variant === "clean") return `Return path detected with clear continuity (${s.toFixed(2)}).`;
      if (variant === "compressed") return `Return path detected under compressive pressure (${s.toFixed(2)}).`;
      return `Return path detected with interrupted continuity (${s.toFixed(2)}).`;
    }
  },
  pressure: {
    map: "pressure",
    emit: { base: 0.05, gain: 0.14 },
    minStrength: 0.2,
    strength: (f) => f.pressure + f.hesitation * 0.2,
    variants: [
      { id: "column", when: (f) => f.pressure > 1.4 },
      { id: "haze", when: () => true }
    ],
    context: (variant) =>
      variant === "column"
        ? "Pressure concentration detected in a narrow channel."
        : "Pressure accumulation detected in the local region."
  },
  hesitation: {
    map: "hesitation",
    emit: { base: 0.06, gain: 0.15 },
    minStrength: 0.2,
    strength: (f) => f.hesitation + f.pressure * 0.22,
    variants: [
      { id: "fracture", when: (f) => f.pressure > 0.9 },
      { id: "break", when: () => true }
    ],
    context: (variant) =>
      variant === "fracture"
        ? "Fracture event detected in local flow."
        : "Pause detected in local field region."
  },
  cadence: {
    map: "cadence",
    emit: { base: 0.04, gain: 0.12 },
    minStrength: 0.2,
    strength: (f) => f.cadence,
    variants: [
      { id: "surge", when: (f) => f.cadence > 1.3 },
      { id: "steady", when: () => true }
    ],
    context: (variant) =>
      variant === "surge"
        ? "Cadence surge detected in local rhythm."
        : "Cadence stability detected in local rhythm."
  },
  fragment: {
    map: "fragment",
    emit: { base: 0.03, gain: 0.1 },
    minStrength: 0.2,
    strength: (f) => f.fragment + f.hesitation * 0.1,
    variants: [
      { id: "split", when: () => true }
    ],
    context: () => "Fragment split detected in local revision flow."
  }
};

const GLYPH_GEOMETRY = {
  orbit: {
    alphaBase: 0.34,
    alphaGain: 0.32,
    bendBase: 24,
    lineWidth: 0.82,
    subLineWidth: 0.62,
    hitbox: { xPad: 4, yPad: 10, wPad: 16 }
  },
  pressure: {
    alphaBase: 0.26,
    alphaGain: 0.3,
    hazeRadiusDense: 17,
    hazeRadiusSoft: 12,
    particlesDense: 10,
    particlesSoft: 7,
    hitbox: { w: 38, h: 44 }
  },
  hesitation: {
    alphaBase: 0.3,
    alphaGain: 0.3,
    lineWidth: 0.92,
    hitbox: { w: 28, h: 28 }
  },
  cadence: {
    alphaBase: 0.24,
    alphaGain: 0.24,
    hitbox: { w: 24, h: 20 }
  },
  fragment: {
    alphaBase: 0.2,
    alphaGain: 0.28,
    lineWidth: 0.8,
    hitbox: { w: 20, h: 22 }
  }
};

const VARIANT_GEOMETRY = {
  orbit: {
    clean: { bendMul: 1, subAlpha: 0.34, cadence: false },
    compressed: { bendMul: 0.84, subAlpha: 0.42, cadence: "dense" },
    broken: { bendMul: 1.08, subAlpha: 0.3, cadence: "light" }
  },
  pressure: {
    haze: { radiusMul: 1, particlesMul: 1, cadence: "light" },
    column: { radiusMul: 1.12, particlesMul: 1.35, cadence: "dense" }
  },
  hesitation: {
    break: { extraFracture: false, cadence: "light" },
    fracture: { extraFracture: true, cadence: "dense" }
  },
  cadence: {
    steady: { dense: false },
    surge: { dense: true }
  },
  fragment: {
    split: { dash: [1, 3] }
  }
};

const GLYPH_SHEET = {
  scaffold: {
    x: 0.405,
    ghostOffset: -8,
    topPad: 30,
    bottomPad: 28,
    ghostTop: 44,
    ghostBottom: 38,
    spineWidth: 0.6,
    ghostWidth: 0.48,
    ghostDash: [1, 7]
  },
  orbit: {
    hookLift: 0.04,
    hookRelease: 0.16,
    tensionIn: 0.2,
    tensionOut: 0.72,
    settle: 0.09
  },
  pressure: {
    stemHalf: 12,
    hazeAlpha: 0.12
  },
  hesitation: {
    diagA: [-6.1, -5.1, -2.4, -1.5],
    diagB: [0.4, 0.7, 4.7, 4.9],
    fractureA: [-5.8, 4.2, -1.7, -0.6],
    fractureB: [-1.0, 5.7, 2.4, 1.6]
  },
  cadence: {
    denseCount: 5,
    softCount: 3,
    spacing: 1.82,
    width: 0.58,
    denseBase: 4.3,
    softBase: 3.2,
    denseAlt: 0.76,
    softAlt: 0.5
  },
  fragment: {
    bars: [
      [3.8, -8, 13.2, -8],
      [4.8, -2, 12.4, -2],
      [5.5, 4.4, 9.6, 4.4]
    ]
  }
};

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const smoothstep = (t) => t * t * (3 - 2 * t);

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h >>> 0);
}

function seededUnit(seed, i) {
  const x = Math.sin(seed * 0.00173 + i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const overlay = document.createElement("div");
overlay.style.position = "fixed";
overlay.style.pointerEvents = "none";
overlay.style.zIndex = "999";
overlay.style.maxWidth = "min(760px, calc(100vw - 48px))";
overlay.style.padding = "10px 14px";
overlay.style.border = "1px solid rgba(228, 196, 146, 0.35)";
overlay.style.borderRadius = "10px";
overlay.style.background = "rgba(11, 13, 18, 0.86)";
overlay.style.color = "rgba(244, 227, 197, 0.95)";
overlay.style.font = "13px/1.4 Georgia, serif";
overlay.style.letterSpacing = "0.02em";
overlay.style.display = "none";
overlay.style.boxShadow = "0 10px 34px rgba(0, 0, 0, 0.34)";
document.body.appendChild(overlay);
let pinnedGlyphId = null;
const focusedNodes = new Set();
const TOKEN_HIGHLIGHT_ATTR = "data-signal-token-focus";
const focusRectNodes = [];
const focusGuideNodes = [];
const FEEDBACK_POLICY = {
  hesitationSilenceMs: 7000
};
const OBSERVER_STATE = {
  lastInputAt: performance.now()
};

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(railShell.clientWidth * dpr);
  canvas.height = Math.floor(railShell.clientHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function nodeByIndex(index) {
  return paragraphByIndex.get(index) ?? paragraphNodes[index] ?? null;
}

function laneKey(index, ratio) {
  const bucket = clamp(Math.floor(ratio * LANE_BUCKETS), 0, LANE_BUCKETS - 1);
  return `${index}:${bucket}`;
}

function laneMetaFromKey(key) {
  const [rawIndex, rawBucket] = key.split(":");
  const index = Number(rawIndex);
  const bucket = Number(rawBucket);
  const ratio = (bucket + 0.5) / LANE_BUCKETS;
  return { index, bucket, ratio };
}

function laneY(key) {
  const { index, ratio } = laneMetaFromKey(key);
  const node = nodeByIndex(index);
  if (!node) return 0;
  const pr = node.getBoundingClientRect();
  const rr = railShell.getBoundingClientRect();
  const y = pr.top + pr.height * ratio - rr.top;
  return clamp(y, 12, rr.height - 12);
}

function draftProfile() {
  const paras = paragraphNodes.filter((p) => (p.textContent ?? "").trim().length > 0);
  const fullText = (textColumn.textContent ?? "").trim();
  const words = fullText ? fullText.split(/\s+/).length : 0;
  return {
    nonEmptyParagraphs: paras.length,
    words,
    singleParagraph: paras.length <= 1
  };
}

function selectionOffsetAndParagraph(lastIndex) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return { index: lastIndex, offset: 0, length: 1 };
  const range = sel.getRangeAt(0);
  const node = range.startContainer;
  const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  const p = el?.closest(".prose-paragraph");
  if (!p) return { index: lastIndex, offset: 0, length: 1 };

  const parsed = Number(p.getAttribute("data-index"));
  const index = Number.isFinite(parsed) ? parsed : Math.max(0, paragraphNodes.indexOf(p));

  const pre = range.cloneRange();
  pre.selectNodeContents(p);
  pre.setEnd(range.startContainer, range.startOffset);
  const offset = pre.toString().length;
  const length = Math.max(1, p.textContent?.length ?? 1);

  return { index, offset, length };
}

function laneFromSelection(lastIndex) {
  const { index, offset, length } = selectionOffsetAndParagraph(lastIndex);
  const ratio = clamp(offset / length, 0.02, 0.98);
  return { key: laneKey(index, ratio), index, ratio };
}

function fieldBump(map, key, amount) {
  const p = FIELD.pressure.get(key) ?? 0;
  const h = FIELD.hesitation.get(key) ?? 0;
  let next = amount;
  if (map === FIELD.hesitation) next *= 1 / (1 + p * 0.42);
  if (map === FIELD.pressure) next *= 1 / (1 + h * 0.5);
  map.set(key, (map.get(key) ?? 0) + next);
}

function decayFieldMap(map, decayFactor = 1) {
  const d = clamp(FIELD.decay * decayFactor, 0.9, 0.995);
  map.forEach((v, k) => {
    const n = v * d;
    if (n < 0.04) map.delete(k);
    else map.set(k, n);
  });
}

function normalizeField() {
  for (const map of [FIELD.pressure, FIELD.hesitation, FIELD.orbit, FIELD.cadence, FIELD.fragment]) {
    let max = 0;
    map.forEach((v) => {
      if (v > max) max = v;
    });
    if (max <= 3.2) continue;
    const s = 3.2 / max;
    map.forEach((v, k) => map.set(k, v * s));
  }
}

function laneFieldSnapshot(laneKeyValue) {
  return {
    pressure: FIELD.pressure.get(laneKeyValue) ?? 0,
    hesitation: FIELD.hesitation.get(laneKeyValue) ?? 0,
    orbit: FIELD.orbit.get(laneKeyValue) ?? 0,
    cadence: FIELD.cadence.get(laneKeyValue) ?? 0,
    fragment: FIELD.fragment.get(laneKeyValue) ?? 0
  };
}

function contextLabel(kind, variant, strength) {
  const spec = ONTOLOGY[kind];
  if (!spec) return "Signal detected";
  return spec.context(variant, strength);
}

function subtypeNote(kind, subtype) {
  const notes = {
    orbit: {
      "near-return": "Return source is proximal",
      "far-return": "Return source is distal"
    },
    pressure: {
      "burst-pressure": "Rapid pressure buildup observed",
      "sustained-pressure": "Sustained pressure buildup observed"
    },
    hesitation: {
      "pause-hesitation": "Pause-linked hesitation observed",
      "delete-hesitation": "Revision-linked hesitation observed"
    },
    cadence: {
      steady: "Cadence remains even",
      mid: "Cadence transitioning",
      surge: "Cadence spike observed"
    },
    fragment: {
      "local-fragment": "Fragment remains local",
      "cascading-fragment": "Fragment propagation observed"
    }
  };
  return notes[kind]?.[subtype] ?? "";
}

function glyphVariant(kind, laneKeyValue) {
  const spec = ONTOLOGY[kind];
  if (!spec) return "default";
  const f = laneFieldSnapshot(laneKeyValue);
  for (const variant of spec.variants) {
    if (variant.when(f)) return variant.id;
  }
  return spec.variants[spec.variants.length - 1]?.id ?? "default";
}

function glyphStrength(kind, laneKeyValue) {
  const spec = ONTOLOGY[kind];
  if (!spec) return 0;
  return spec.strength(laneFieldSnapshot(laneKeyValue));
}

function semanticSubtype(kind, laneKeyValue) {
  return SEMANTICS.subtype[kind]?.get(laneKeyValue) ?? "default";
}

function semanticConfidence(kind, laneKeyValue) {
  return SEMANTICS.confidence[kind]?.get(laneKeyValue) ?? 0.5;
}

function stampSemantic(kind, laneKeyValue, subtype, confidence) {
  if (!SEMANTICS.subtype[kind] || !SEMANTICS.confidence[kind]) return;
  SEMANTICS.subtype[kind].set(laneKeyValue, subtype);
  SEMANTICS.confidence[kind].set(laneKeyValue, clamp(confidence, 0, 1));
}

function laneDistance(aKey, bKey) {
  const a = laneMetaFromKey(aKey);
  const b = laneMetaFromKey(bKey);
  if (!Number.isFinite(a.index) || !Number.isFinite(b.index)) return Infinity;
  if (a.index !== b.index) return Infinity;
  return Math.abs(a.bucket - b.bucket);
}

function glyphsInBand(laneKeyValue) {
  let count = 0;
  for (const g of glyphOrder) {
    if (laneDistance(g.laneKey, laneKeyValue) <= COMPOSITION.minLaneBucketGap) count += 1;
  }
  return count;
}

function findBandNeighbor(laneKeyValue) {
  for (let i = glyphOrder.length - 1; i >= 0; i -= 1) {
    const g = glyphOrder[i];
    if (laneDistance(g.laneKey, laneKeyValue) <= COMPOSITION.minLaneBucketGap) return g;
  }
  return null;
}

function prunePerceptualHistory(now) {
  for (let i = perceptualHistory.length - 1; i >= 0; i -= 1) {
    if (now - perceptualHistory[i].t > PERCEPTUAL_GATE.dominantWindowMs) perceptualHistory.splice(i, 1);
  }
}

function recentLocalVisibleCount(now, laneKeyValue) {
  let count = 0;
  for (let i = perceptualHistory.length - 1; i >= 0; i -= 1) {
    const r = perceptualHistory[i];
    if (now - r.t > PERCEPTUAL_GATE.localWindowMs) break;
    if (laneDistance(r.laneKey, laneKeyValue) <= PERCEPTUAL_GATE.neighborhoodBuckets) count += 1;
  }
  return count;
}

function dominantRecentKind(now) {
  const counts = new Map();
  for (let i = perceptualHistory.length - 1; i >= 0; i -= 1) {
    const r = perceptualHistory[i];
    if (now - r.t > PERCEPTUAL_GATE.dominantWindowMs) break;
    counts.set(r.kind, (counts.get(r.kind) ?? 0) + 1);
  }
  let topKind = null;
  let top = 0;
  counts.forEach((v, k) => {
    if (v > top) {
      top = v;
      topKind = k;
    }
  });
  return topKind;
}

function shouldRenderSignal(signal, fieldState, localContext) {
  const laneSnapshot = laneFieldSnapshot(signal.laneKeyValue);
  const localIntensity = laneSnapshot.pressure + laneSnapshot.hesitation + laneSnapshot.orbit + laneSnapshot.cadence + laneSnapshot.fragment;
  const competition = glyphsInBand(signal.laneKeyValue) + localContext.recentLocalVisible;
  const lowCompetition = competition <= PERCEPTUAL_GATE.neighborhoodCompetitionCap;
  const salienceThreshold = localIntensity >= PERCEPTUAL_GATE.salienceMin && lowCompetition;

  const isolationWindow = localContext.recentVisibleGlobal <= PERCEPTUAL_GATE.isolationMaxRecent;
  const contrastMoment = Boolean(localContext.dominantKind) && localContext.dominantKind !== signal.kind;

  return salienceThreshold || isolationWindow || contrastMoment;
}

function complementaryKinds(kind) {
  if (kind === "pressure") return ["hesitation"];
  if (kind === "orbit") return ["hesitation", "pressure"];
  if (kind === "hesitation") return ["orbit", "pressure"];
  return [];
}

function pruneTemporalPhraseState(now) {
  temporalPhraseState.recentKinds = temporalPhraseState.recentKinds.filter((x) => now - x.t <= 4800);
  temporalPhraseState.pendingEchoes = temporalPhraseState.pendingEchoes.filter((x) => now - x.dueAt <= 2400);
}

function transitionBias(kind, now) {
  const recent = temporalPhraseState.recentKinds[temporalPhraseState.recentKinds.length - 1];
  if (!recent) return 1;
  if (complementaryKinds(recent.kind).includes(kind) && now - recent.t <= 2600) return 1.2;
  return 1;
}

function sameFamilyCooldownBias(kind, now) {
  const last = temporalPhraseState.lastStrongAtByKind.get(kind);
  if (!last) return 1;
  if (now - last < TEMPORAL_COMPOSITION.sameFamilyCooldownMs) return TEMPORAL_COMPOSITION.sameFamilyDampen;
  return 1;
}

function clamp01(v) {
  return clamp(v, 0, 1);
}

function sessionPhaseWeights() {
  const t = clamp01(SESSION_STATE.timeInSession / (12 * 60 * 1000));
  const emergence = clamp01(1 - t * 2.2);
  const exploration = clamp01(1 - Math.abs(t - 0.32) / 0.28);
  const compression = clamp01(1 - Math.abs(t - 0.62) / 0.26);
  const stabilization = clamp01((t - 0.62) / 0.38);
  const sum = emergence + exploration + compression + stabilization || 1;
  return {
    emergence: emergence / sum,
    exploration: exploration / sum,
    compression: compression / sum,
    stabilization: stabilization / sum
  };
}

function sessionSignalBias(kind) {
  const w = sessionPhaseWeights();
  if (kind === "hesitation") return 1 + w.emergence * 0.32 - w.compression * 0.14;
  if (kind === "orbit") return 1 + w.emergence * 0.28 - w.compression * 0.08;
  if (kind === "pressure") return 1 + w.compression * 0.34 - w.emergence * 0.12;
  if (kind === "cadence") return 1 + w.exploration * 0.18;
  if (kind === "fragment") return 1 + w.compression * 0.12;
  return 1;
}

function sessionEchoScale() {
  const w = sessionPhaseWeights();
  return 0.9 + w.exploration * 0.12 + w.stabilization * 0.16;
}

function sessionDecayFactor() {
  const w = sessionPhaseWeights();
  // late session holds traces longer by reducing effective decay loss.
  return 1 + w.stabilization * 0.035 - w.emergence * 0.012;
}

function sessionSilenceWindowMs() {
  const w = sessionPhaseWeights();
  const weighted = TEMPORAL_COMPOSITION.silenceWindowMs * (0.9 + w.stabilization * 0.7);
  return Math.round(weighted + SESSION_STATE.silenceAccumulation * 180);
}

function sessionSilenceClusterThreshold() {
  const w = sessionPhaseWeights();
  return Math.max(2, Math.round(TEMPORAL_COMPOSITION.silenceClusterCount - w.stabilization * 1 + w.exploration * 0.4));
}

function updateSessionState(emittedCount, now) {
  SESSION_STATE.timeInSession = now - SESSION_STATE.startedAt;
  SESSION_STATE.activityHistory.push({ t: now, count: emittedCount });
  SESSION_STATE.activityHistory = SESSION_STATE.activityHistory.filter((x) => now - x.t <= 60 * 1000);
  const avg = SESSION_STATE.activityHistory.length
    ? SESSION_STATE.activityHistory.reduce((s, x) => s + x.count, 0) / SESSION_STATE.activityHistory.length
    : 0;
  SESSION_STATE.densityCurve = SESSION_STATE.densityCurve * 0.84 + avg * 0.16;
  if (emittedCount === 0) SESSION_STATE.silenceAccumulation = clamp(SESSION_STATE.silenceAccumulation + 0.08, 0, 1.8);
  else SESSION_STATE.silenceAccumulation = clamp(SESSION_STATE.silenceAccumulation * 0.82, 0, 1.8);
  const w = sessionPhaseWeights();
  SESSION_STATE.momentumBias = clamp((w.compression - w.emergence) * 0.9 + SESSION_STATE.densityCurve * 0.06, -1.2, 1.2);
}

function upsertGlyph({ kind, laneKeyValue, targetLaneKey = null, source = "field", strengthScale = 1, ttlMs = null }) {
  const spec = ONTOLOGY[kind];
  if (!spec) return;
  const now = performance.now();
  prunePerceptualHistory(now);
  const localContext = {
    recentLocalVisible: recentLocalVisibleCount(now, laneKeyValue),
    recentVisibleGlobal: perceptualHistory.filter((r) => now - r.t <= PERCEPTUAL_GATE.localWindowMs).length,
    dominantKind: dominantRecentKind(now)
  };
  if (localContext.recentLocalVisible >= PERCEPTUAL_GATE.localSoftCap) {
    FIELD[spec.map].set(laneKeyValue, (FIELD[spec.map].get(laneKeyValue) ?? 0) + PERCEPTUAL_GATE.faintResidueBump);
    return;
  }
  if (!shouldRenderSignal({ kind, laneKeyValue }, FIELD, localContext)) {
    FIELD[spec.map].set(laneKeyValue, (FIELD[spec.map].get(laneKeyValue) ?? 0) + PERCEPTUAL_GATE.faintResidueBump);
    return;
  }
  const strength = glyphStrength(kind, laneKeyValue) * strengthScale;
  if (strength < spec.minStrength) return;
  const variant = glyphVariant(kind, laneKeyValue);
  const subtype = semanticSubtype(kind, laneKeyValue);
  const confidence = semanticConfidence(kind, laneKeyValue);
  const floor = QUALITY_TUNING.confidenceFloor[kind] ?? 0.55;
  if (confidence < floor) return;
  const id = `${kind}:${laneKeyValue}`;

  const existing = glyphLedger.get(id);
  if (existing) {
    const weightedNow = strength * (0.55 + confidence * 0.45);
    const weightedExisting = existing.strength * (0.55 + (existing.confidence ?? 0.5) * 0.45);
    if (weightedNow > weightedExisting + COMPOSITION.overwriteDelta) {
      existing.variant = variant;
      existing.strength = strength;
      existing.subtype = subtype;
      existing.confidence = confidence;
      existing.updatedAt = performance.now();
      existing.targetLaneKey = targetLaneKey ?? existing.targetLaneKey;
      const note = subtypeNote(kind, subtype);
      existing.context = note ? `${contextLabel(kind, variant, strength)}. ${note}.` : contextLabel(kind, variant, strength);
      existing.shapeShift = clamp((existing.shapeShift ?? 0) + (Math.random() - 0.5) * 5, -18, 18);
    }
    return;
  }

  const neighbor = findBandNeighbor(laneKeyValue);
  if (neighbor && neighbor.id !== id) {
    const myPriority = COMPOSITION.priority[kind] ?? 0;
    const neighborPriority = COMPOSITION.priority[neighbor.kind] ?? 0;
    const now = performance.now();
    const msSinceNeighbor = now - (neighbor.updatedAt ?? neighbor.createdAt ?? now);

    const weightedNow = strength * (0.55 + confidence * 0.45);
    const weightedNeighbor = neighbor.strength * (0.55 + (neighbor.confidence ?? 0.5) * 0.45);
    if (myPriority < neighborPriority && weightedNow <= weightedNeighbor + COMPOSITION.mergeDelta) return;

    if (myPriority >= neighborPriority && weightedNow > weightedNeighbor + COMPOSITION.overwriteDelta && msSinceNeighbor >= COMPOSITION.minMsBetweenRelated) {
      glyphLedger.delete(neighbor.id);
      const idx = glyphOrder.findIndex((x) => x.id === neighbor.id);
      if (idx >= 0) glyphOrder.splice(idx, 1);
    } else if (neighbor.kind === kind && strength <= neighbor.strength + COMPOSITION.mergeDelta) {
      neighbor.strength = clamp((neighbor.strength + strength) * 0.5, 0, 4);
      neighbor.updatedAt = now;
      neighbor.context = contextLabel(kind, neighbor.variant, neighbor.strength);
      return;
    }
  }

  if (glyphsInBand(laneKeyValue) >= COMPOSITION.maxPerBand) return;

  if (glyphOrder.length > COMPOSITION.maxGlyphs) {
    const evict = glyphOrder.shift();
    if (evict) glyphLedger.delete(evict.id);
  }

  const glyph = {
    id,
    kind,
    laneKey: laneKeyValue,
    targetLaneKey,
    variant,
    strength,
    subtype,
    confidence,
    source,
    ttlMs,
    createdAt: now,
    updatedAt: now,
    shapeShift: 0,
    context: (() => {
      const note = subtypeNote(kind, subtype);
      return note ? `${contextLabel(kind, variant, strength)}. ${note}.` : contextLabel(kind, variant, strength);
    })()
  };
  glyphLedger.set(id, glyph);
  glyphOrder.push(glyph);
  perceptualHistory.push({ t: now, kind, laneKey: laneKeyValue });

  const rec = threadState.recurrence.get(laneKeyValue) ?? 0;
  threadState.recurrence.set(laneKeyValue, rec + 1);
  if (threadState.lastLaneKey && threadState.lastLaneKey !== laneKeyValue) {
    const laneGap = laneDistance(threadState.lastLaneKey, laneKeyValue);
    if (laneGap < COMPOSITION.minLinkLaneDistance) {
      threadState.lastLaneKey = laneKeyValue;
      return;
    }
    const linkStrength = 0.5 + strength * 0.2;
    if (linkStrength >= COMPOSITION.linkThreshold) {
      threadState.links.push({ from: threadState.lastLaneKey, to: laneKeyValue, createdAt: performance.now(), strength: linkStrength });
      if (threadState.links.length > 18) threadState.links.shift();
    }
  }
  threadState.lastLaneKey = laneKeyValue;
}

function fieldEmit() {
  const now = performance.now();
  pruneTemporalPhraseState(now);
  let emittedThisSweep = 0;
  const emitMap = (kind, map, base, gain) => {
    const profile = draftProfile();
    map.forEach((value, key) => {
      const p = FIELD.pressure.get(key) ?? 0;
      const h = FIELD.hesitation.get(key) ?? 0;
      const o = FIELD.orbit.get(key) ?? 0;
      const c = FIELD.cadence.get(key) ?? 0;
      const confidence = semanticConfidence(kind, key);
      const tension = p + h + o + c;
      const localIntensity = p + h + o + c + (FIELD.fragment.get(key) ?? 0);

      if (now < temporalPhraseState.quietUntilMs && localIntensity < TEMPORAL_COMPOSITION.silenceBypassIntensity) return;

      if (kind === "fragment") {
        const needs = QUALITY_TUNING.suppression.fragmentNeeds;
        if (h < needs.hesitation || p < needs.pressure) return;
      }
      if (kind === "orbit") {
        const rec = threadState.recurrence.get(key) ?? 0;
        if (rec < QUALITY_TUNING.suppression.orbitNeedsRecurrence) return;
      }
      if (kind === "cadence" && confidence < QUALITY_TUNING.suppression.cadenceNeedsVarianceConfidence) return;

      let prob = (base + value * gain) * clamp(1 - tension * 0.14, 0.45, 1);
      prob *= 0.7 + confidence * 0.3;
      prob *= sameFamilyCooldownBias(kind, now);
      prob *= transitionBias(kind, now);
      prob *= sessionSignalBias(kind);
      if (profile.singleParagraph) prob *= QUALITY_TUNING.singleParagraph.emitBoost;
      prob = clamp(prob * QUALITY_TUNING.activity.emitScalar, 0, 0.74);
      if (Math.random() >= prob) return;

      if (kind === "orbit") {
        const { index, bucket } = laneMetaFromKey(key);
        let targetKey = key;
        if (paragraphNodes.length <= 1) {
          const bucketOffset = Math.random() < 0.5 ? -2 : 2;
          const targetBucket = clamp(bucket + bucketOffset, 0, LANE_BUCKETS - 1);
          targetKey = `${index}:${targetBucket}`;
        } else {
          const offset = Math.random() < 0.5 ? -1 : 1;
          const targetIndex = clamp(index + offset, 0, paragraphNodes.length - 1);
          targetKey = `${targetIndex}:${bucket}`;
        }
        upsertGlyph({ kind: "orbit", laneKeyValue: key, targetLaneKey: targetKey });
        temporalPhraseState.recentKinds.push({ kind: "orbit", t: now });
        if (localIntensity >= TEMPORAL_COMPOSITION.strongThreshold) {
          temporalPhraseState.lastStrongAtByKind.set("orbit", now);
          temporalPhraseState.pendingEchoes.push({
            kind: "orbit",
            laneKeyValue: key,
            targetLaneKey: targetKey,
            dueAt: now + TEMPORAL_COMPOSITION.echoDelayMinMs + Math.random() * (TEMPORAL_COMPOSITION.echoDelayMaxMs - TEMPORAL_COMPOSITION.echoDelayMinMs)
          });
        }
        emittedThisSweep += 1;
        return;
      }

      upsertGlyph({ kind, laneKeyValue: key });
      temporalPhraseState.recentKinds.push({ kind, t: now });
      if ((kind === "pressure" || kind === "orbit") && localIntensity >= TEMPORAL_COMPOSITION.strongThreshold) {
        temporalPhraseState.lastStrongAtByKind.set(kind, now);
        temporalPhraseState.pendingEchoes.push({
          kind,
          laneKeyValue: key,
          dueAt: now + TEMPORAL_COMPOSITION.echoDelayMinMs + Math.random() * (TEMPORAL_COMPOSITION.echoDelayMaxMs - TEMPORAL_COMPOSITION.echoDelayMinMs)
        });
      }
      emittedThisSweep += 1;
    });
  };

  Object.entries(ONTOLOGY).forEach(([kind, spec]) => {
    emitMap(kind, FIELD[spec.map], spec.emit.base, spec.emit.gain);
  });

  if (emittedThisSweep === 0 && Math.random() < QUALITY_TUNING.activity.minVisiblePerSweepChance) {
    const keys = [
      ...FIELD.pressure.keys(),
      ...FIELD.hesitation.keys(),
      ...FIELD.orbit.keys(),
      ...FIELD.cadence.keys(),
      ...FIELD.fragment.keys()
    ];
    if (keys.length) {
      const laneKeyValue = keys[Math.floor(Math.random() * keys.length)];
      const kindChoices = ["pressure", "hesitation", "cadence"];
      const kind = kindChoices[Math.floor(Math.random() * kindChoices.length)];
      upsertGlyph({ kind, laneKeyValue });
    }
  }

  // Reverberation: delayed weakened re-appearance after strong moments.
  for (let i = temporalPhraseState.pendingEchoes.length - 1; i >= 0; i -= 1) {
    const e = temporalPhraseState.pendingEchoes[i];
    if (now < e.dueAt) continue;
    temporalPhraseState.pendingEchoes.splice(i, 1);
    if (Math.random() > TEMPORAL_COMPOSITION.echoChance) continue;
    upsertGlyph({
      kind: e.kind,
      laneKeyValue: e.laneKeyValue,
      targetLaneKey: e.targetLaneKey ?? null,
      source: "echo",
      strengthScale: TEMPORAL_COMPOSITION.echoStrengthScale * sessionEchoScale(),
      ttlMs: 5000 + Math.random() * 1800
    });
    temporalPhraseState.recentKinds.push({ kind: e.kind, t: now });
  }

  if (emittedThisSweep >= sessionSilenceClusterThreshold()) {
    temporalPhraseState.quietUntilMs = now + sessionSilenceWindowMs();
  }

  updateSessionState(emittedThisSweep, now);
}

function fieldTick() {
  const decayFactor = sessionDecayFactor();
  decayFieldMap(FIELD.pressure, decayFactor);
  decayFieldMap(FIELD.hesitation, decayFactor);
  decayFieldMap(FIELD.orbit, decayFactor);
  decayFieldMap(FIELD.cadence, decayFactor);
  decayFieldMap(FIELD.fragment, decayFactor);
  normalizeField();
  const now = performance.now();
  for (let i = glyphOrder.length - 1; i >= 0; i -= 1) {
    const g = glyphOrder[i];
    if (!g.ttlMs) continue;
    if (now - g.createdAt <= g.ttlMs) continue;
    glyphOrder.splice(i, 1);
    glyphLedger.delete(g.id);
  }
  fieldEmit();
}

function startFieldLoop() {
  const tick = () => {
    fieldTick();
    setTimeout(tick, 520 + Math.random() * 420);
  };
  tick();
}

function startObserver() {
  textColumn.setAttribute("contenteditable", "true");
  textColumn.setAttribute("spellcheck", "false");
  textColumn.setAttribute("autocapitalize", "off");

  const typing = [];
  const deleting = [];
  const rhythm = [];
  const zones = [];
  const lastSignal = { pressure: -Infinity, hesitation: -Infinity, orbit: -Infinity, cadence: -Infinity, fragment: -Infinity };

  let lastInputAt = performance.now();
  OBSERVER_STATE.lastInputAt = lastInputAt;
  let pauseTimer = null;
  let lastIndex = 0;
  let lastDeleteLane = null;

  const now = () => performance.now();
  const prune = (arr, win, t) => { while (arr.length && t - arr[0] > win) arr.shift(); };
  const can = (k, t) => t - lastSignal[k] >= observerCfg.cooldownMs;
  const mark = (k, t) => { lastSignal[k] = t; };

  function cadenceVariance(t) {
    prune(rhythm, observerCfg.cadenceWindowMs, t);
    if (rhythm.length < 4) return 0;
    const deltas = [];
    for (let i = 1; i < rhythm.length; i += 1) deltas.push(rhythm[i] - rhythm[i - 1]);
    const mean = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    const variance = deltas.reduce((a, b) => a + (b - mean) * (b - mean), 0) / deltas.length;
    return clamp(variance / 14000, 0, 2.1);
  }

  function refreshPause() {
    if (pauseTimer) clearTimeout(pauseTimer);
    const profile = draftProfile();
    const pauseMs = profile.singleParagraph
      ? Math.max(700, observerCfg.pauseMs + QUALITY_TUNING.singleParagraph.pauseMsDelta)
      : observerCfg.pauseMs;
    pauseTimer = setTimeout(() => {
      const t = now();
      if (t - lastInputAt < pauseMs) return;
      if (!can("hesitation", t)) return;
      const lane = laneFromSelection(lastIndex);
      fieldBump(FIELD.hesitation, lane.key, 0.95);
      stampSemantic("hesitation", lane.key, "pause-hesitation", 0.72);
      mark("hesitation", t);
    }, pauseMs + 20);
  }

  function pushZone(lane, start, end) {
    const t = now();
    zones.push({ laneKey: lane.key, index: lane.index, start: Math.max(0, Math.min(start, end)), end: Math.max(start, end), expiresAt: t + observerCfg.deleteZoneTtlMs });
    for (let i = zones.length - 1; i >= 0; i -= 1) if (zones[i].expiresAt <= t) zones.splice(i, 1);
  }

  function detectRetyping(lane, offset) {
    const t = now();
    for (let i = zones.length - 1; i >= 0; i -= 1) {
      const z = zones[i];
      if (z.expiresAt <= t) { zones.splice(i, 1); continue; }
      if (z.index !== lane.index) continue;
      if (offset < z.start - 2 || offset > z.end + 2) continue;
      if (!can("orbit", t)) return;
      fieldBump(FIELD.orbit, lane.key, 1.03);
      if (lastDeleteLane) fieldBump(FIELD.orbit, lastDeleteLane, 0.42);
      const prevBucket = laneMetaFromKey(lastDeleteLane ?? lane.key).bucket;
      const nowBucket = laneMetaFromKey(lane.key).bucket;
      const distance = Math.abs(nowBucket - prevBucket);
      stampSemantic("orbit", lane.key, distance >= 2 ? "far-return" : "near-return", distance >= 2 ? 0.82 : 0.7);
      mark("orbit", t);
      zones.splice(i, 1);
      return;
    }
  }

  textColumn.addEventListener("beforeinput", (event) => {
    const type = event.inputType || "";
    if (!type.startsWith("delete")) return;
    const lane = laneFromSelection(lastIndex);
    lastIndex = lane.index;
    lastDeleteLane = lane.key;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const s = selectionOffsetAndParagraph(lastIndex);
    if (!range.collapsed) {
      pushZone(lane, s.offset, s.offset + range.toString().length);
      return;
    }
    pushZone(lane, Math.max(0, s.offset - 1), s.offset + 1);
  });

  textColumn.addEventListener("input", (event) => {
    const t = now();
    lastInputAt = t;
    OBSERVER_STATE.lastInputAt = t;
    const lane = laneFromSelection(lastIndex);
    lastIndex = lane.index;
    const type = event.inputType || "";

    rhythm.push(t);
    const variance = cadenceVariance(t);
    const profile = draftProfile();
    const cadenceFloor = profile.singleParagraph
      ? QUALITY_TUNING.singleParagraph.cadenceVarianceFloor
      : 0.2;
    if (variance > cadenceFloor && can("cadence", t)) {
      fieldBump(FIELD.cadence, lane.key, 0.45 + variance * 0.45);
      const subtype = variance > 0.9 ? "surge" : variance > 0.45 ? "mid" : "steady";
      stampSemantic("cadence", lane.key, subtype, clamp(0.55 + variance * 0.2, 0.55, 0.9));
      mark("cadence", t);
    }

    if (type.startsWith("insert")) {
      typing.push(t);
      prune(typing, observerCfg.burstWindowMs, t);
      const burstThreshold = profile.singleParagraph
        ? Math.max(4, observerCfg.burstThreshold + QUALITY_TUNING.singleParagraph.burstThresholdDelta)
        : observerCfg.burstThreshold;
      if (typing.length >= burstThreshold && can("pressure", t)) {
        fieldBump(FIELD.pressure, lane.key, 1.0);
        const subtype = typing.length >= burstThreshold + 4 ? "sustained-pressure" : "burst-pressure";
        stampSemantic("pressure", lane.key, subtype, subtype === "sustained-pressure" ? 0.86 : 0.7);
        mark("pressure", t);
      }
      const s = selectionOffsetAndParagraph(lastIndex);
      detectRetyping(lane, s.offset);
    }

    if (type.startsWith("delete")) {
      deleting.push(t);
      prune(deleting, observerCfg.deleteWindowMs, t);
      if (deleting.length >= observerCfg.deleteThreshold) {
        if (can("hesitation", t)) {
          fieldBump(FIELD.hesitation, lane.key, 0.86);
          stampSemantic("hesitation", lane.key, "delete-hesitation", 0.79);
          mark("hesitation", t);
        }
        if (can("pressure", t)) {
          fieldBump(FIELD.pressure, lane.key, 0.66);
          stampSemantic("pressure", lane.key, "burst-pressure", 0.66);
          mark("pressure", t);
        }
        if (can("fragment", t)) {
          const confidence = deleting.length >= observerCfg.deleteThreshold + 2 ? 0.8 : 0.62;
          if (confidence >= 0.62) {
            fieldBump(FIELD.fragment, lane.key, 0.76);
            stampSemantic("fragment", lane.key, confidence > 0.72 ? "cascading-fragment" : "local-fragment", confidence);
            mark("fragment", t);
          }
        }
      }
    }

    refreshPause();
  });

  textColumn.addEventListener("keydown", (event) => {
    if (event.key === "Enter") event.preventDefault();
  });

  refreshPause();
}

function drawScaffold() {
  const sheet = GLYPH_SHEET.scaffold;
  const h = canvas.clientHeight;
  const x = canvas.clientWidth * sheet.x;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = "rgba(237, 208, 161, 0.23)";
  ctx.lineWidth = sheet.spineWidth;
  ctx.beginPath();
  ctx.moveTo(x, sheet.topPad);
  ctx.lineTo(x, h - sheet.bottomPad);
  ctx.stroke();

  ctx.strokeStyle = "rgba(226, 194, 142, 0.13)";
  ctx.setLineDash(sheet.ghostDash);
  ctx.lineWidth = sheet.ghostWidth;
  ctx.beginPath();
  ctx.moveTo(x + sheet.ghostOffset, sheet.ghostTop);
  ctx.lineTo(x + sheet.ghostOffset, h - sheet.ghostBottom);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawGlow(x, y, alpha, radius = 14) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, `rgba(248, 231, 200, ${alpha})`);
  g.addColorStop(1, "rgba(248, 231, 200, 0)");
  ctx.save();
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawMasterStroke(pathBuilder, opts = {}) {
  const {
    alpha = 0.5,
    width = 1,
    color = GLYPH.ink,
    echo = true,
    cap = "round"
  } = opts;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = cap;

  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  pathBuilder(ctx, 0);
  ctx.stroke();

  if (echo) {
    ctx.globalAlpha = alpha * 0.33;
    ctx.strokeStyle = GLYPH.sub;
    ctx.lineWidth = Math.max(0.6, width * 0.72);
    ctx.beginPath();
    pathBuilder(ctx, 1.4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSignalStroke(pathBuilder, opts = {}) {
  const {
    alpha = 0.28,
    width = 0.8,
    continuity = 1,
    layers = 1,
    profile = "smooth",
    seed = 1,
    now = performance.now()
  } = opts;

  const makeFractureDash = () => {
    const arr = [];
    for (let i = 0; i < 6; i += 1) {
      const on = 1.2 + seededUnit(seed, 40 + i) * 3.3;
      const off = 2.6 + seededUnit(seed, 60 + i) * 6.2;
      arr.push(on, off);
    }
    return arr;
  };

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (profile === "fracture") {
    ctx.setLineDash(makeFractureDash());
    ctx.lineDashOffset = -((now * 0.0027 + seed * 0.031) % 18);
  } else if (continuity < 0.98) {
    const gap = 3 + (1 - continuity) * 8;
    const seg = Math.max(1.2, continuity * 8);
    ctx.setLineDash([seg, gap]);
    ctx.lineDashOffset = -((now * 0.0018 + seed * 0.02) % 12);
  } else {
    ctx.setLineDash([]);
  }

  for (let i = 0; i < layers; i += 1) {
    let w = width + i * 0.22;
    let a = alpha * (i === 0 ? 1 : 0.55 / (i + 0.2));

    if (profile === "elastic") {
      const recoil = 1 + Math.sin(now * 0.0011 + seed * 0.002 + i * 0.7) * 0.06;
      w *= recoil;
      a *= 1.02 + recoil * 0.08;
    }
    if (profile === "viscous") {
      // Simulates medium lag and local thickening along path segments.
      const thickPulse = 1 + Math.sin(now * 0.0009 + seed * 0.004 + i * 0.9) * 0.12;
      w *= thickPulse;
      a *= 0.96;
    }
    if (profile === "fracture") {
      a *= 0.9;
      w *= 0.94 + Math.sin(now * 0.0013 + seed * 0.005 + i) * 0.04;
    }

    ctx.globalAlpha = a;
    ctx.strokeStyle = i === 0 ? GLYPH.ink : "rgba(214, 182, 136, 0.32)";
    ctx.lineWidth = w;
    ctx.beginPath();
    pathBuilder(ctx, i);
    ctx.stroke();
  }
  ctx.restore();
}

function drawInkKernel(x, y, radius, alpha, seedKey) {
  const seed = hashSeed(seedKey);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, `rgba(245, 227, 195, ${alpha})`);
  g.addColorStop(1, "rgba(245, 227, 195, 0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(241, 224, 190, 0.9)";
  for (let i = 0; i < 22; i += 1) {
    const a = seededUnit(seed, i) * Math.PI * 2;
    const r = radius * (0.12 + seededUnit(seed, i + 50) * 0.85);
    const px = x + Math.cos(a) * r * 0.75;
    const py = y + Math.sin(a) * r;
    const pr = 0.16 + seededUnit(seed, i + 100) * 0.55;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCadence(x, y, alpha, dense = false) {
  const sheet = GLYPH_SHEET.cadence;
  const count = dense ? sheet.denseCount : sheet.softCount;
  const center = (count - 1) * 0.5;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = GLYPH.ink;
  ctx.lineWidth = dense ? sheet.width * 1.45 : sheet.width * 1.2;
  ctx.lineCap = "round";
  for (let i = 0; i < count; i += 1) {
    const xx = x + i * sheet.spacing;
    const dist = Math.abs(i - center);
    const radial = 1 - clamp(dist / Math.max(1, center + 0.01), 0, 1);
    const profile = 0.42 + smoothstep(radial) * 0.88;
    const h =
      (dense ? sheet.denseBase : sheet.softBase) * profile +
      (i % 2) * (dense ? sheet.denseAlt : sheet.softAlt);
    const localAlpha = alpha * (0.72 + radial * 0.42);

    // soft bloom pass
    ctx.globalAlpha = localAlpha * 0.32;
    ctx.strokeStyle = GLYPH.sub;
    ctx.lineWidth = (dense ? sheet.width * 2.7 : sheet.width * 2.3);
    ctx.beginPath();
    ctx.moveTo(xx, y - h * 0.5);
    ctx.lineTo(xx, y + h * 0.5);
    ctx.stroke();

    // core pill stroke
    ctx.globalAlpha = localAlpha;
    ctx.strokeStyle = GLYPH.ink;
    ctx.lineWidth = dense ? sheet.width * 1.45 : sheet.width * 1.2;
    ctx.beginPath();
    ctx.moveTo(xx, y - h * 0.5);
    ctx.lineTo(xx, y + h * 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

function registerHit(glyph, x, y, w, h) {
  hitRegions.push({ glyph, x, y, w, h });
}

function glyphTemporalEnvelope(g, now) {
  const bornAt = g.createdAt ?? now;
  const age = Math.max(0, now - bornAt);
  const rampIn = clamp(age / 980, 0, 1);
  const settle = 0.78 + smoothstep(rampIn) * 0.28;
  return { age, rampIn, alpha: smoothstep(rampIn) * settle };
}

function nearbyBlendInfluence(g, now) {
  let influence = 0;
  for (let i = glyphOrder.length - 1; i >= 0; i -= 1) {
    const n = glyphOrder[i];
    if (n.id === g.id) continue;
    const age = now - (n.updatedAt ?? n.createdAt ?? now);
    if (age > 8200) continue;
    if (laneDistance(n.laneKey, g.laneKey) > 2) continue;
    const w = 1 - clamp(age / 8200, 0, 1);
    influence += (n.strength ?? 0.4) * 0.043 * w;
  }
  return clamp(influence, 0, 0.22);
}

function residualAlpha(g, now, base) {
  const age = now - (g.updatedAt ?? g.createdAt ?? now);
  const tail = clamp(1 - age / 19800, 0, 1);
  return base * 0.12 * tail;
}

function breathe(now, seed, amp = 0.06, hz = 0.00045) {
  return 1 + Math.sin(now * hz + seed * 0.00073) * amp;
}

function drawAmbientField() {
  const x = canvas.clientWidth * GLYPH_SHEET.scaffold.x;
  const h = canvas.clientHeight;
  ctx.save();
  const g = ctx.createLinearGradient(x - 26, 0, x + 30, 0);
  g.addColorStop(0, "rgba(236, 207, 158, 0)");
  g.addColorStop(0.38, "rgba(236, 207, 158, 0.018)");
  g.addColorStop(0.62, "rgba(236, 207, 158, 0.014)");
  g.addColorStop(1, "rgba(236, 207, 158, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(x - 26, 0, 56, h);
  ctx.restore();
}

function drawThreadLinks(now) {
  const x = canvas.clientWidth * GLYPH_SHEET.scaffold.x - 5.5;
  for (let i = threadState.links.length - 1; i >= 0; i -= 1) {
    const link = threadState.links[i];
    const age = now - link.createdAt;
    if (age > 12000) {
      threadState.links.splice(i, 1);
      continue;
    }
    const yA = laneY(link.from);
    const yB = laneY(link.to);
    if (Math.abs(yB - yA) < 42) continue;
    const fade = 1 - clamp(age / 12000, 0, 1);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = fade * 0.11 * link.strength;
    ctx.strokeStyle = "rgba(229, 199, 149, 0.72)";
    ctx.setLineDash([1.2, 7.2]);
    ctx.lineWidth = 0.42;
    ctx.beginPath();
    ctx.moveTo(x, yA);
    ctx.bezierCurveTo(
      x + 6.8,
      yA + (yB - yA) * 0.2,
      x + 12.6,
      yA + (yB - yA) * 0.78,
      x,
      yB
    );
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}

function drawOrbit(g, now) {
  const spec = GLYPH_GEOMETRY.orbit;
  const variantSpec = VARIANT_GEOMETRY.orbit[g.variant] ?? VARIANT_GEOMETRY.orbit.clean;
  const yA = laneY(g.laneKey);
  const yB = laneY(g.targetLaneKey ?? g.laneKey);
  const x = canvas.clientWidth * GLYPH_SHEET.scaffold.x;
  const sheet = GLYPH_SHEET.orbit;
  const seed = hashSeed(g.id);
  const temporal = glyphTemporalEnvelope(g, now);
  const blend = nearbyBlendInfluence(g, now);
  const pulse = breathe(now, seed, 0.055, 0.00038);
  const finalAlpha = clamp(((spec.alphaBase + g.strength * spec.alphaGain) * temporal.alpha + blend) * pulse, 0.14, 0.74);
  const tailAlpha = residualAlpha(g, now, spec.alphaBase + g.strength * spec.alphaGain);
  const drift = Math.sin(now * 0.00026 + seed * 0.00091) * 0.9;
  const bend = (spec.bendBase - 3.8) * variantSpec.bendMul + (g.shapeShift ?? 0) * 0.48 + drift;
  const path = (p) => {
    const span = yB - yA;
    const absSpan = Math.max(24, Math.abs(span));
    const spanSign = span >= 0 ? 1 : -1;
    const ease = smoothstep(clamp(absSpan / 280, 0, 1));
    const skew = (seededUnit(seed, 7) - 0.5) * 0.18;
    const entryY = yA + span * (sheet.hookLift + skew * 0.16);
    const midY = (yA + yB) * 0.5 + spanSign * (2.1 + ease * 3.2);
    const settleY = yB - span * (sheet.settle + 0.03 * ease);
    const overshoot = bend * (0.06 + ease * 0.08);
    p.moveTo(x, yA);
    p.bezierCurveTo(
      x + bend * (sheet.tensionIn + 0.05),
      entryY,
      x + bend * (sheet.tensionOut + 0.04),
      midY + span * sheet.hookRelease,
      x + bend * (sheet.hookRelease + 0.08) + overshoot,
      settleY
    );
    const tipSkew = (seededUnit(seed, 91) - 0.5) * 1.6;
    p.quadraticCurveTo(x + bend * sheet.hookRelease * 0.62 + overshoot * 0.3, yB + spanSign * 0.35, x + bend * 0.12 + tipSkew, yB + spanSign * 0.18);
  };
  drawSignalStroke(path, {
    alpha: finalAlpha,
    width: 1.06,
    continuity: 1,
    layers: 1,
    profile: "elastic",
    seed,
    now
  });
  if (tailAlpha > 0.005) {
    drawSignalStroke(path, {
      alpha: tailAlpha,
      width: 0.62,
      continuity: 1,
      layers: 1,
      profile: "elastic",
      seed: seed + 17,
      now
    });
  }

  registerHit(
    g,
    x - spec.hitbox.xPad,
    Math.min(yA, yB) - spec.hitbox.yPad,
    bend + spec.hitbox.wPad + 4,
    Math.abs(yB - yA) + spec.hitbox.yPad * 2
  );
}

function drawPressure(g, now) {
  const spec = GLYPH_GEOMETRY.pressure;
  const variantSpec = VARIANT_GEOMETRY.pressure[g.variant] ?? VARIANT_GEOMETRY.pressure.haze;
  const y = laneY(g.laneKey);
  const x = canvas.clientWidth * GLYPH_SHEET.scaffold.x;
  const dense = g.variant === "column";
  const seed = hashSeed(g.id);
  const temporal = glyphTemporalEnvelope(g, now);
  const blend = nearbyBlendInfluence(g, now);
  const pulse = breathe(now, seed, 0.045, 0.00034);
  const finalAlpha = clamp(((spec.alphaBase + g.strength * spec.alphaGain) * temporal.alpha + blend) * pulse, 0.1, 0.54);
  const tailAlpha = residualAlpha(g, now, spec.alphaBase + g.strength * spec.alphaGain);
  const sheet = GLYPH_SHEET.pressure;
  const lag = 1 - temporal.rampIn;
  const driftX = Math.sin(now * 0.00016 + seed * 0.00081) * (0.45 + lag * 0.35);
  const driftY = Math.cos(now * 0.00017 + seed * 0.00103) * 0.45;
  const path = (p, layer) => {
    const half = sheet.stemHalf + layer * 2.2;
    const curve = (dense ? 4.2 : 2.4) + lag * 1.1;
    p.moveTo(x + driftX * 0.4, y - half + driftY);
    const lagTail = (seededUnit(seed, 33 + layer) - 0.5) * 0.9;
    p.quadraticCurveTo(x + curve + driftX, y + driftY * 0.2, x + driftX * 0.95 + lagTail, y + half + driftY * 0.6);
  };
  drawSignalStroke(path, {
    alpha: finalAlpha * 0.64,
    width: 0.72,
    continuity: 0.94,
    layers: dense ? 3 : 2,
    profile: "viscous",
    seed,
    now
  });
  if (tailAlpha > 0.004) {
    drawSignalStroke(path, {
      alpha: tailAlpha * 0.6,
      width: 0.48,
      continuity: 0.9,
      layers: 1,
      profile: "viscous",
      seed: seed + 23,
      now
    });
  }
  registerHit(g, x - spec.hitbox.w / 2, y - spec.hitbox.h / 2, spec.hitbox.w, spec.hitbox.h);
}

function drawHesitation(g, now) {
  const spec = GLYPH_GEOMETRY.hesitation;
  const variantSpec = VARIANT_GEOMETRY.hesitation[g.variant] ?? VARIANT_GEOMETRY.hesitation.break;
  const y = laneY(g.laneKey);
  const x = canvas.clientWidth * GLYPH_SHEET.scaffold.x;
  const seed = hashSeed(g.id);
  const temporal = glyphTemporalEnvelope(g, now);
  const blend = nearbyBlendInfluence(g, now);
  const pulse = breathe(now, seed, 0.035, 0.00031);
  const finalAlpha = clamp(((spec.alphaBase + g.strength * spec.alphaGain) * temporal.alpha + blend) * pulse, 0.08, 0.46);
  const tailAlpha = residualAlpha(g, now, spec.alphaBase + g.strength * spec.alphaGain);
  const path = (p) => {
    const k = variantSpec.extraFracture ? 1.65 : 1.2;
    p.moveTo(x - 6.4, y - 4.2);
    p.quadraticCurveTo(x - 1.7, y - 0.8, x + 3.4, y + 2.9);
    p.moveTo(x - 3.5, y + 4.2);
    const cut = (seededUnit(seed, 71) - 0.5) * 1.2;
    p.quadraticCurveTo(x - 0.3, y + 1.2, x + 4.6 + cut, y - 2.4 * k * 0.35);
  };
  drawSignalStroke(path, {
    alpha: finalAlpha,
    width: 0.5,
    continuity: variantSpec.extraFracture ? 0.52 : 0.62,
    layers: 1,
    profile: "fracture",
    seed,
    now
  });
  if (tailAlpha > 0.004) {
    drawSignalStroke(path, {
      alpha: tailAlpha * 0.8,
      width: 0.38,
      continuity: 0.46,
      layers: 1,
      profile: "fracture",
      seed: seed + 31,
      now
    });
  }
  registerHit(g, x - spec.hitbox.w / 2, y - spec.hitbox.h / 2, spec.hitbox.w, spec.hitbox.h);
}

function drawCadenceGlyph(g, now) {
  const spec = GLYPH_GEOMETRY.cadence;
  const variantSpec = VARIANT_GEOMETRY.cadence[g.variant] ?? VARIANT_GEOMETRY.cadence.steady;
  const y = laneY(g.laneKey);
  const x = canvas.clientWidth * GLYPH_SHEET.scaffold.x + 5.4;
  const seed = hashSeed(g.id);
  const temporal = glyphTemporalEnvelope(g, now);
  const blend = nearbyBlendInfluence(g, now);
  const finalAlpha = clamp(((spec.alphaBase + g.strength * spec.alphaGain) * temporal.alpha + blend) * breathe(now, seed, 0.04, 0.00036), 0.09, 0.6);
  const path = (p, layer) => {
    const h = variantSpec.dense ? 8.8 + layer * 1.6 : 6.4 + layer * 1.2;
    p.moveTo(x, y - h * 0.5);
    const tail = (seededUnit(seed, 21 + layer) - 0.5) * 0.7;
    p.quadraticCurveTo(x + 2.8, y, x + tail, y + h * 0.5);
  };
  drawSignalStroke(path, {
    alpha: finalAlpha * 0.52,
    width: 0.56,
    continuity: variantSpec.dense ? 0.9 : 0.96,
    layers: variantSpec.dense ? 2 : 1
  });
  registerHit(g, x - spec.hitbox.w / 2, y - spec.hitbox.h / 2, spec.hitbox.w, spec.hitbox.h);
}

function drawFragment(g, now) {
  const spec = GLYPH_GEOMETRY.fragment;
  const variantSpec = VARIANT_GEOMETRY.fragment[g.variant] ?? VARIANT_GEOMETRY.fragment.split;
  const y = laneY(g.laneKey);
  const x = canvas.clientWidth * GLYPH_SHEET.scaffold.x;
  const seed = hashSeed(g.id);
  const temporal = glyphTemporalEnvelope(g, now);
  const blend = nearbyBlendInfluence(g, now);
  const finalAlpha = clamp(((spec.alphaBase + g.strength * spec.alphaGain) * temporal.alpha + blend) * breathe(now, seed, 0.03, 0.0003), 0.07, 0.44);
  const path = (p) => {
    p.moveTo(x + 3.6, y - 8);
    p.quadraticCurveTo(x + 10, y - 7, x + 13.2, y - 8);
    p.moveTo(x + 4.8, y - 2);
    p.quadraticCurveTo(x + 8.4, y - 1.2, x + 12.4, y - 2);
    p.moveTo(x + 5.5, y + 4.4);
    p.quadraticCurveTo(x + 7.6, y + 5.2, x + 9.6, y + 4.4);
  };
  drawSignalStroke(path, {
    alpha: finalAlpha * 0.5,
    width: 0.46,
    continuity: 0.56,
    layers: 1
  });
  registerHit(g, x + 1, y - spec.hitbox.h / 2, spec.hitbox.w, spec.hitbox.h);
}

function render(now) {
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  hitRegions.length = 0;
  drawScaffold();
  drawThreadLinks(now);
  drawAmbientField();

  for (const g of glyphOrder) {
    if (g.kind === "orbit") drawOrbit(g, now);
    if (g.kind === "pressure") drawPressure(g, now);
    if (g.kind === "hesitation") drawHesitation(g, now);
    if (g.kind === "cadence") drawCadenceGlyph(g, now);
    if (g.kind === "fragment") drawFragment(g, now);
  }

  requestAnimationFrame(render);
}

function hitAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  let nearest = null;
  let nearestDist = Infinity;
  for (let i = hitRegions.length - 1; i >= 0; i -= 1) {
    const h = hitRegions[i];
    if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) return h.glyph;
    const cx = h.x + h.w * 0.5;
    const cy = h.y + h.h * 0.5;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearest = h.glyph;
    }
  }
  return nearestDist <= 26 ? nearest : null;
}

function showOverlay(glyph, clientX, clientY) {
  if (!glyph || !glyph.context) return;
  if (glyph.kind === "hesitation") {
    const msSinceInput = performance.now() - OBSERVER_STATE.lastInputAt;
    if (msSinceInput < FEEDBACK_POLICY.hesitationSilenceMs) {
      overlay.style.display = "none";
      clearTextFocus();
      return;
    }
  }
  overlay.textContent = glyph.context;
  overlay.style.display = "block";
  const textRect = textColumn.getBoundingClientRect();
  const maxX = Math.max(16, window.innerWidth - Math.min(760, window.innerWidth - 48) - 16);
  const targetX = clamp(textRect.left, 16, maxX);
  overlay.style.left = `${targetX}px`;
  overlay.style.top = "auto";
  overlay.style.bottom = "18px";
  applyTextFocus(glyph);
}

function hideOverlay() {
  if (pinnedGlyphId) return;
  overlay.style.display = "none";
  clearTextFocus();
}

function clearTextFocus() {
  while (focusRectNodes.length) {
    const node = focusRectNodes.pop();
    node?.remove();
  }
  while (focusGuideNodes.length) {
    const node = focusGuideNodes.pop();
    node?.remove();
  }

  focusedNodes.forEach((node) => {
    node.classList.remove("signal-focus");
    node.style.background = "";
    node.style.boxShadow = "";
    node.style.borderRadius = "";
  });
  focusedNodes.clear();
}

function collectTextNodes(root) {
  const nodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
}

function drawFocusRectsFromRange(range) {
  const rects = Array.from(range.getClientRects());
  const drawnRects = [];
  for (const r of rects) {
    if (r.width < 1 || r.height < 1) continue;
    const box = document.createElement("div");
    box.setAttribute(TOKEN_HIGHLIGHT_ATTR, "1");
    box.style.position = "fixed";
    box.style.left = `${r.left - 1}px`;
    box.style.top = `${r.top + 1}px`;
    box.style.width = `${r.width + 2}px`;
    box.style.height = `${Math.max(2, r.height - 2)}px`;
    box.style.background = "rgba(241, 215, 163, 0.28)";
    box.style.borderBottom = "1px solid rgba(241, 215, 163, 0.78)";
    box.style.borderRadius = "2px";
    box.style.pointerEvents = "none";
    box.style.zIndex = "998";
    document.body.appendChild(box);
    focusRectNodes.push(box);
    drawnRects.push(r);
  }
  return drawnRects;
}

function tokenizeWords(text) {
  const words = [];
  const re = /[A-Za-z0-9'’-]+/g;
  let m = re.exec(text);
  while (m) {
    words.push({ start: m.index, end: m.index + m[0].length });
    m = re.exec(text);
  }
  return words;
}

function drawFocusGuide(laneKeyValue, rects) {
  if (!rects.length) return;
  const railRect = railShell.getBoundingClientRect();
  const avgX = rects.reduce((sum, r) => sum + r.left + r.width * 0.5, 0) / rects.length;
  const avgY = rects.reduce((sum, r) => sum + r.top + r.height * 0.5, 0) / rects.length;
  const x1 = railRect.left + railRect.width * GLYPH_SHEET.scaffold.x + 1;
  const y1 = railRect.top + laneY(laneKeyValue);
  const x2 = avgX - 7;
  const y2 = avgY;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 12) return;

  const guide = document.createElement("div");
  guide.style.position = "fixed";
  guide.style.left = `${x1}px`;
  guide.style.top = `${y1}px`;
  guide.style.width = `${len}px`;
  guide.style.height = "1px";
  guide.style.transformOrigin = "0 0";
  guide.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
  guide.style.background = "linear-gradient(90deg, rgba(236,206,156,0.42), rgba(236,206,156,0.08) 70%, rgba(236,206,156,0))";
  guide.style.pointerEvents = "none";
  guide.style.zIndex = "997";
  document.body.appendChild(guide);
  focusGuideNodes.push(guide);
}

function highlightTokenWindow(paragraph, ratio, laneKeyValue, windowWords = 1) {
  const text = paragraph.textContent ?? "";
  if (!text.trim()) return;
  const words = tokenizeWords(text);
  if (!words.length) return;
  const targetWord = clamp(Math.floor(words.length * ratio), 0, words.length - 1);
  const startWord = clamp(targetWord - windowWords, 0, words.length - 1);
  const endWord = clamp(targetWord + windowWords, 0, words.length - 1);
  const startChar = words[startWord].start;
  const endChar = words[endWord].end;

  const nodes = collectTextNodes(paragraph);
  if (!nodes.length) return;

  const charToPoint = (target) => {
    let acc = 0;
    for (const node of nodes) {
      const len = node.textContent?.length ?? 0;
      if (target <= acc + len) {
        return { node, offset: clamp(target - acc, 0, len) };
      }
      acc += len;
    }
    const last = nodes[nodes.length - 1];
    const len = last.textContent?.length ?? 0;
    return { node: last, offset: len };
  };

  const startPoint = charToPoint(startChar);
  const endPoint = charToPoint(endChar);
  if (!startPoint.node || !endPoint.node) return;

  try {
    const range = document.createRange();
    range.setStart(startPoint.node, startPoint.offset);
    range.setEnd(endPoint.node, endPoint.offset);
    const rects = drawFocusRectsFromRange(range);
    drawFocusGuide(laneKeyValue, rects);
  } catch {
    // no-op
  }
}

function applyTextFocus(glyph) {
  clearTextFocus();
  if (!glyph?.laneKey) return;
  const windowByKind = {
    orbit: 2,
    pressure: 2,
    hesitation: 1,
    cadence: 1,
    fragment: 2
  };
  const primaryWindow = windowByKind[glyph.kind] ?? 1;
  const primaryMeta = laneMetaFromKey(glyph.laneKey);
  if (!Number.isFinite(primaryMeta.index)) return;
  const primary = primaryMeta.index;
  const primaryNode = nodeByIndex(primary);
  if (primaryNode) {
    highlightTokenWindow(primaryNode, primaryMeta.ratio, glyph.laneKey, primaryWindow);
  }

  if (glyph.kind === "orbit" && glyph.targetLaneKey) {
    const secondaryMeta = laneMetaFromKey(glyph.targetLaneKey);
    if (!Number.isFinite(secondaryMeta.index)) return;
    const secondary = secondaryMeta.index;
    const secondaryNode = nodeByIndex(secondary);
    if (secondaryNode) {
      highlightTokenWindow(secondaryNode, secondaryMeta.ratio, glyph.targetLaneKey, 2);
    }
  }
}

function focusGlyph(glyph, clientX, clientY, pin = false) {
  if (!glyph) return;
  if (pin) pinnedGlyphId = glyph.id;
  showOverlay(glyph, clientX, clientY);
}

function clearPinnedFocus() {
  pinnedGlyphId = null;
  overlay.style.display = "none";
  clearTextFocus();
}

canvas.addEventListener("mousemove", (e) => {
  if (pinnedGlyphId) return;
  const g = hitAt(e.clientX, e.clientY);
  if (!g) {
    hideOverlay();
    return;
  }
  focusGlyph(g, e.clientX, e.clientY, false);
});

canvas.addEventListener("mouseleave", () => {
  if (pinnedGlyphId) return;
  hideOverlay();
});
canvas.addEventListener("pointerdown", (e) => {
  const g = hitAt(e.clientX, e.clientY);
  if (!g) {
    clearPinnedFocus();
    return;
  }
  if (pinnedGlyphId && pinnedGlyphId === g.id) {
    clearPinnedFocus();
    return;
  }
  focusGlyph(g, e.clientX, e.clientY, true);
});

function scheduleMockSignals() {
  for (const s of mockSignals) {
    const jitter = 1 + (Math.random() * 0.8 - 0.4);
    const delay = Math.max(0, Math.round(s.delay * jitter));
    setTimeout(() => {
      const index = s.anchorIndex;
      const key = laneKey(index, 0.5);
      if (s.type === "pressure") fieldBump(FIELD.pressure, key, 0.95);
      if (s.type === "hesitation") fieldBump(FIELD.hesitation, key, 0.9);
      if (s.type === "return") fieldBump(FIELD.orbit, key, 1.0);
    }, delay);
  }
}

function startAmbientSeeding() {
  const pulse = () => {
    if (Math.random() < QUALITY_TUNING.activity.ambientSeedChance) {
      const nonEmpty = paragraphNodes.filter((p) => (p.textContent ?? "").trim().length > 0);
      if (nonEmpty.length) {
        const node = nonEmpty[Math.floor(Math.random() * nonEmpty.length)];
        const index = Number(node.getAttribute("data-index")) || 0;
        const ratio = 0.2 + Math.random() * 0.6;
        const key = laneKey(index, ratio);
        const roll = Math.random();
        if (roll < 0.44) {
          fieldBump(FIELD.pressure, key, 0.64 + Math.random() * 0.36);
          stampSemantic("pressure", key, "sustained-pressure", 0.66);
        } else if (roll < 0.78) {
          fieldBump(FIELD.hesitation, key, 0.58 + Math.random() * 0.32);
          stampSemantic("hesitation", key, "pause-hesitation", 0.64);
        } else {
          fieldBump(FIELD.cadence, key, 0.44 + Math.random() * 0.3);
          stampSemantic("cadence", key, "mid", 0.62);
        }
      }
    }
    const nextMs = QUALITY_TUNING.activity.ambientPulseMinMs + Math.random() * QUALITY_TUNING.activity.ambientPulseJitterMs;
    setTimeout(pulse, nextMs);
  };
  pulse();
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);
window.addEventListener("scroll", resizeCanvas, { passive: true });

resizeCanvas();
scheduleMockSignals();
startObserver();
startFieldLoop();
startAmbientSeeding();
requestAnimationFrame(render);

"use strict";
// Research-only internal harness for Trace Field v0.
// This module is non-UI, non-production, deterministic, and evidence-trace focused.

const DEFAULT_STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "if", "in", "into",
  "is", "it", "its", "of", "on", "or", "that", "the", "then", "this", "to", "was", "were", "with",
]);

const DEFAULT_CONFIG = Object.freeze({
  minCount: 3,
  minRuns: 2,
  phraseMinN: 2,
  phraseMaxN: 3,
  coOccurrenceWindow: 24,
  proximityWindow: 8,
  minTokenLength: 3,
  maxSingleRunShare: 0.8,
  maxRepeatedExcerptShare: 0.6,
  includeStructuralPatterns: true,
});

const STRUCTURAL_PATTERNS = Object.freeze([
  { key: "contrast_x_but_y", regex: /\b\w+\b\s*,?\s*but\s+\b\w+\b/gi },
  { key: "if_then", regex: /\bif\b[\s\S]{0,120}?\bthen\b/gi },
  { key: "not_but", regex: /\bnot\b[\s\S]{0,80}?\bbut\b/gi },
]);

function buildTraceFieldV0Report(runs, userConfig = {}) {
  const config = { ...DEFAULT_CONFIG, ...userConfig };
  validateRuns(runs);

  const preparedRuns = runs.map((run, runIndex) => prepareRun(run, runIndex, config));

  const signalMaps = {
    exact_token: collectExactTokenRecurrence(preparedRuns),
    normalized_token: collectNormalizedTokenRecurrence(preparedRuns),
    phrase: collectPhraseRecurrence(preparedRuns, config),
    co_occurrence: collectCoOccurrenceRecurrence(preparedRuns, config),
    structural: config.includeStructuralPatterns ? collectStructuralRecurrence(preparedRuns) : new Map(),
    proximity: collectProximityRecurrence(preparedRuns, config),
  };

  const surfaced = [];
  const suppressed = [];
  const primitives = Object.keys(signalMaps).sort();

  for (const primitive of primitives) {
    const entries = Array.from(signalMaps[primitive].values()).sort(compareSignalEntries);
    for (const entry of entries) {
      const checks = evaluateSuppression(entry, primitive, config);
      const bundle = toEvidenceBundle(primitive, entry, checks, config);
      if (checks.passed) {
        surfaced.push(bundle);
      } else {
        suppressed.push(bundle);
      }
    }
  }

  surfaced.sort(compareEvidenceBundles);
  suppressed.sort(compareEvidenceBundles);

  return {
    meta: {
      runCount: preparedRuns.length,
      config,
      generatedAt: "deterministic-v0",
      deterministic: true,
      llmInterpretationUsed: false,
      embeddingsUsed: false,
      audience: "internal",
      productionSurfacingAllowed: false,
      outputClass: "internal_primitive_labels_only",
      languageConstraint: "no_user_facing_claims",
      internalHarnessNotice: "INTERNAL_ONLY_NON_USER_FACING_RESEARCH_OUTPUT",
    },
    surfaced,
    suppressed,
  };
}

function validateRuns(runs) {
  if (!Array.isArray(runs) || runs.length === 0) {
    throw new Error("runs must be a non-empty array");
  }
  for (const run of runs) {
    if (!run || typeof run.id !== "string" || typeof run.text !== "string") {
      throw new Error("each run must include string id and text");
    }
  }
}

function prepareRun(run, runIndex, config) {
  const segments = tokenizeWithOffsets(run.text, config.minTokenLength);
  const sentences = splitSentencesWithOffsets(run.text);
  return {
    id: run.id,
    runIndex,
    text: run.text,
    segments,
    sentences,
  };
}

function tokenizeWithOffsets(text, minTokenLength) {
  const regex = /[A-Za-z][A-Za-z'-]*/g;
  const segments = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const token = match[0];
    const start = match.index;
    const end = start + token.length;
    const normalized = normalizeToken(token);
    if (!normalized || normalized.length < minTokenLength) {
      continue;
    }
    segments.push({ token, normalized, start, end });
  }
  return segments;
}

function splitSentencesWithOffsets(text) {
  const sentences = [];
  const regex = /[^.!?]+[.!?]?/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const raw = match[0].trim();
    if (!raw) continue;
    const start = match.index;
    const end = start + match[0].length;
    sentences.push({ text: raw, start, end });
  }
  return sentences;
}

function normalizeToken(token) {
  let normalized = String(token).toLowerCase().replace(/^'+|'+$/g, "");
  normalized = normalized.replace(/[^a-z'-]/g, "");
  if (normalized.endsWith("s") && normalized.length > 4) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

function collectExactTokenRecurrence(preparedRuns) {
  const map = new Map();
  for (const run of preparedRuns) {
    for (const segment of run.segments) {
      const key = segment.token.toLowerCase();
      upsertSignal(map, key, run, segment.start, segment.end, segment.token, {
        normalization: "exact",
      });
    }
  }
  return map;
}

function collectNormalizedTokenRecurrence(preparedRuns) {
  const map = new Map();
  for (const run of preparedRuns) {
    for (const segment of run.segments) {
      if (DEFAULT_STOPWORDS.has(segment.normalized)) continue;
      upsertSignal(map, segment.normalized, run, segment.start, segment.end, segment.token, {
        normalization: "normalized",
      });
    }
  }
  return map;
}

function collectPhraseRecurrence(preparedRuns, config) {
  const map = new Map();
  for (const run of preparedRuns) {
    const tokens = run.segments;
    for (let i = 0; i < tokens.length; i += 1) {
      for (let n = config.phraseMinN; n <= config.phraseMaxN; n += 1) {
        const slice = tokens.slice(i, i + n);
        if (slice.length !== n) continue;
        const norms = slice.map((item) => item.normalized);
        if (norms.some((value) => DEFAULT_STOPWORDS.has(value))) continue;
        const key = norms.join(" ");
        upsertSignal(map, key, run, slice[0].start, slice[slice.length - 1].end, slice.map((s) => s.token).join(" "), {
          normalization: "normalized_phrase",
          n,
        });
      }
    }
  }
  return map;
}

function collectCoOccurrenceRecurrence(preparedRuns, config) {
  const map = new Map();
  for (const run of preparedRuns) {
    const segments = run.segments.filter((segment) => !DEFAULT_STOPWORDS.has(segment.normalized));
    for (let i = 0; i < segments.length; i += 1) {
      for (let j = i + 1; j < segments.length; j += 1) {
        const distance = j - i;
        if (distance > config.coOccurrenceWindow) break;
        const a = segments[i].normalized;
        const b = segments[j].normalized;
        if (a === b) continue;
        const key = [a, b].sort().join(" :: ");
        upsertSignal(map, key, run, segments[i].start, segments[j].end, `${segments[i].token} / ${segments[j].token}`, {
          window: config.coOccurrenceWindow,
        });
      }
    }
  }
  return map;
}

function collectStructuralRecurrence(preparedRuns) {
  const map = new Map();
  for (const run of preparedRuns) {
    for (const sentence of run.sentences) {
      for (const pattern of STRUCTURAL_PATTERNS) {
        pattern.regex.lastIndex = 0;
        const local = sentence.text;
        const match = pattern.regex.exec(local);
        if (!match) continue;
        const start = sentence.start + match.index;
        const end = start + match[0].length;
        upsertSignal(map, pattern.key, run, start, end, match[0], {
          pattern: pattern.key,
        });
      }
    }
  }
  return map;
}

function collectProximityRecurrence(preparedRuns, config) {
  const map = new Map();
  for (const run of preparedRuns) {
    const segments = run.segments.filter((segment) => !DEFAULT_STOPWORDS.has(segment.normalized));
    for (let i = 0; i < segments.length; i += 1) {
      for (let j = i + 1; j < segments.length; j += 1) {
        const distance = j - i;
        if (distance > config.proximityWindow) break;
        const key = `${segments[i].normalized} ~ ${segments[j].normalized}`;
        upsertSignal(map, key, run, segments[i].start, segments[j].end, `${segments[i].token} ... ${segments[j].token}`, {
          window: config.proximityWindow,
          distance,
        });
      }
    }
  }
  return map;
}

function upsertSignal(map, key, run, start, end, excerpt, flags = {}) {
  if (!map.has(key)) {
    map.set(key, {
      key,
      count: 0,
      runs: new Map(),
      excerpts: [],
      flags,
    });
  }
  const signal = map.get(key);
  signal.count += 1;
  if (!signal.runs.has(run.id)) {
    signal.runs.set(run.id, 0);
  }
  signal.runs.set(run.id, signal.runs.get(run.id) + 1);
  signal.excerpts.push({ runId: run.id, start, end, excerpt });
}

function evaluateSuppression(entry, primitive, config) {
  const runCount = entry.runs.size;
  const maxRunCount = Math.max(...entry.runs.values());
  const singleRunShare = entry.count > 0 ? maxRunCount / entry.count : 1;
  const repeatedExcerptShare = computeRepeatedExcerptShare(entry.excerpts);
  const isStopwordToken = primitive === "exact_token" && DEFAULT_STOPWORDS.has(String(entry.key || "").toLowerCase());
  const checks = {
    minCount: entry.count >= config.minCount,
    minRuns: runCount >= config.minRuns,
    singleRunShare: singleRunShare <= config.maxSingleRunShare,
    repeatedExcerptShare: repeatedExcerptShare <= config.maxRepeatedExcerptShare,
    boilerplateStopword: !isStopwordToken,
  };
  return {
    passed: Object.values(checks).every(Boolean),
    checks,
    metrics: {
      count: entry.count,
      runCount,
      singleRunShare,
      repeatedExcerptShare,
    },
  };
}

function computeRepeatedExcerptShare(excerpts) {
  if (!Array.isArray(excerpts) || excerpts.length === 0) return 0;
  const counts = new Map();
  for (const item of excerpts) {
    const normalized = String(item.excerpt || "").trim().toLowerCase().replace(/\s+/g, " ");
    const key = `${item.runId}::${normalized}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  let max = 0;
  for (const value of counts.values()) {
    if (value > max) max = value;
  }
  return max / excerpts.length;
}

function toEvidenceBundle(primitive, entry, suppression, config) {
  const runs = Array.from(entry.runs.entries())
    .map(([runId, count]) => ({ runId, count }))
    .sort((a, b) => a.runId.localeCompare(b.runId));

  const excerpts = entry.excerpts
    .slice()
    .sort((a, b) => a.runId.localeCompare(b.runId) || a.start - b.start)
    .slice(0, 12);

  return {
    primitive,
    key: entry.key,
    count: entry.count,
    runCount: entry.runs.size,
    suppressionChecksPassed: suppression.passed,
    suppressionChecks: suppression.checks,
    suppressionMetrics: suppression.metrics,
    normalizationFlags: entry.flags,
    thresholds: {
      minCount: config.minCount,
      minRuns: config.minRuns,
      maxSingleRunShare: config.maxSingleRunShare,
    },
    supportingTraces: {
      runs,
      excerpts,
    },
  };
}

function compareSignalEntries(a, b) {
  return b.count - a.count || b.runs.size - a.runs.size || a.key.localeCompare(b.key);
}

function compareEvidenceBundles(a, b) {
  return a.primitive.localeCompare(b.primitive) || b.count - a.count || b.runCount - a.runCount || a.key.localeCompare(b.key);
}

module.exports = {
  buildTraceFieldV0Report,
  DEFAULT_CONFIG,
};

"use strict";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function hashString(input) {
  let h = 2166136261;
  const s = String(input || "");
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return function rng() {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function ri(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick(rng, arr) {
  return arr[ri(rng, 0, arr.length - 1)];
}

function bool(rng, p) {
  return rng() < p;
}

const PROFILE_NAMES = [
  "sparse_user",
  "steady_user",
  "intense_user",
  "clustered_user",
  "nocturnal_user",
  "calibration_user",
  "returning_user",
];

const OPENERS = [
  "I began with a careful sentence",
  "I returned to the same opening twice",
  "I stayed plain in the first pass",
  "I cut back the first line and rewrote it",
  "I kept circling one phrase",
  "I started broad and then narrowed",
  "I wrote around the edge before naming it",
  "I let one sentence hold longer than usual",
];

const CONCRETES = [
  "the hallway light at the door seam",
  "a cold cup on the table corner",
  "rain marks on the window latch",
  "my sleeve catching on the chair arm",
  "the mirror edge by the sink",
  "a bus stop pole in wet air",
  "the stair rail against my hand",
  "the breath pause before a short answer",
];

const ABSTRACTS = [
  "so the tone would not hide behind polite language",
  "while the paragraph kept choosing safer verbs",
  "and the draft repeated its hesitation in rhythm",
  "so the line could carry detail instead of summary",
  "while I moved from interpretation toward what happened",
  "and the wording stopped apologizing for itself",
];

const NIGHT_TINT = [
  "Late at night the language turns narrower and quieter",
  "Near midnight the syntax gets shorter and more exact",
  "After midnight I write in tighter loops before committing",
];

const TAGS_BY_PROFILE = {
  sparse_user: ["minimal history", "early patterns", "quiet cadence"],
  steady_user: ["daily writing", "consistent reflection", "season continuity"],
  intense_user: ["high frequency", "dense season wheel", "cross-run signals"],
  clustered_user: ["burst writing", "silence contrast", "uneven rhythm"],
  nocturnal_user: ["late-night sessions", "night cadence", "time-color behavior"],
  calibration_user: ["onboarding", "short drafts", "calibration"],
  returning_user: ["comeback sessions", "renewed cadence", "re-entry"],
};

const KEYWORDS_BY_STATE = {
  "empty-writing-surface": ["writing surface", "quiet interface", "prompted draft"],
  "active-entry-half": ["draft in progress", "mid-thought", "live writing"],
  "active-entry-near-complete": ["near completion", "focused drafting", "sentence rhythm"],
  "submitted-mirror-reflection": ["mirror reflection", "post-submit", "language observation"],
  "recent-runs-open": ["recent runs", "writing history", "review surface"],
  "patterns-unlocked": ["patterns", "cross-run", "recurring language"],
  "seasonal-wheel": ["season wheel", "usage density", "writing cadence"],
  "calibration-run": ["calibration", "early-stage run", "low-signal reflection"],
  "prompt-reroll-state": ["prompt reroll", "prompt variation", "writing start"],
  "focus-mode": ["focus mode", "minimal UI", "concentrated drafting"],
};

function promptKeyTerms(prompt) {
  const words = String(prompt || "")
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((w) => w.length >= 4);
  const stop = new Set(["write", "about", "with", "from", "that", "this", "what", "where", "when", "your", "into", "through"]);
  const filtered = [];
  const seen = new Set();
  for (const w of words) {
    if (stop.has(w) || seen.has(w)) continue;
    seen.add(w);
    filtered.push(w);
    if (filtered.length >= 3) break;
  }
  return filtered;
}

function buildPromptResponse(prompt, options) {
  const opts = options || {};
  const profile = String(opts.profile || "steady_user");
  const completion = String(opts.completion || "near"); // half | near | full | short
  const hour = Number.isFinite(opts.hour) ? Number(opts.hour) : 14;
  const rng = opts.rng || mulberry32(123);
  const terms = promptKeyTerms(prompt);
  const concrete = pick(rng, CONCRETES);
  const abstract = pick(rng, ABSTRACTS);
  const opener = pick(rng, OPENERS);
  const termLine = terms.length ? `I kept returning to ${terms.join(", ")} while revising.` : "I kept returning to one phrase while revising.";
  const nightLine = (profile === "nocturnal_user" || hour >= 23 || hour <= 3) ? ` ${pick(rng, NIGHT_TINT)}.` : "";

  if (completion === "short") {
    return `${opener}, then paused before the detail surfaced.${nightLine}`.trim();
  }

  const s1 = `${opener}, working from ${concrete} ${abstract}.`;
  const s2 = `${termLine} I trimmed qualifiers and left one concrete sentence in place.`;
  const s3 = `The cadence shifted from broad summary to specific observation, and the ending held without extra explanation.`;

  if (completion === "half") {
    return `${s1} ${termLine} I was about to anchor it in`;
  }
  if (completion === "near") {
    return `${s1} ${s2}${nightLine}`.trim();
  }
  return `${s1} ${s2} ${s3}${nightLine}`.trim();
}

function tokenStats(text) {
  const words = String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const freq = {};
  const starters = {};
  const seen = new Set();
  let unique = 0;
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1;
    if (!seen.has(w)) {
      seen.add(w);
      unique += 1;
    }
  }
  const sentenceStarts = String(text || "")
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => (s.match(/[A-Za-z0-9']+/) || [""])[0].toLowerCase())
    .filter(Boolean);
  for (const s of sentenceStarts) starters[s] = (starters[s] || 0) + 1;

  return {
    words,
    wordCount: words.length,
    unique,
    uniqueRatio: words.length ? Number((unique / words.length).toFixed(2)) : 0,
    freq,
    starters,
    repeatedWords: Object.entries(freq)
      .filter(([, n]) => n >= 3)
      .slice(0, 4)
      .map(([word, count]) => ({ word, count })),
    repeatedStarters: Object.entries(starters)
      .filter(([, n]) => n >= 2)
      .map(([starter, count]) => ({ starter, count })),
  };
}

function makeRun(index, timestampMs, prompt, text, rng) {
  const stats = tokenStats(text);
  const completion = ri(rng, 16, 25);
  const filler = ri(rng, 13, 24);
  const repetition = ri(rng, 12, 24);
  const openings = ri(rng, 14, 24);
  return {
    runId: `fixture-run-${String(index).padStart(6, "0")}`,
    savedAt: timestampMs,
    timestamp: timestampMs,
    text,
    prompt,
    score: completion + filler + repetition + openings,
    runScore: completion + filler + repetition + openings,
    scoreBreakdown: { completion, filler, repetition, openings },
    repeatedWords: stats.repeatedWords,
    bannedHits: [],
    repeatedStarters: stats.repeatedStarters,
    challengeActive: false,
    challengeCompleted: false,
    challengeWords: [],
    wasSuccessful: bool(rng, 0.82),
    activeTargetWords: pick(rng, [60, 120, 240]),
    activeTimerSeconds: pick(rng, [120, 240, 360]),
    finishedWithinTime: bool(rng, 0.78),
    timeRemaining: ri(rng, 0, 90),
    wordCount: stats.wordCount,
    words: stats.wordCount,
    unique: stats.unique,
    uniqueRatio: stats.uniqueRatio,
    avgSentenceLength: ri(rng, 10, 20),
    repeatedCount: stats.repeatedWords.length,
    fillerCount: 0,
    wordFreq: stats.freq,
    starterFreq: stats.starters,
    starterExamples: { i: "I tightened the opening and kept one concrete detail." },
    punctuation: { commas: ri(rng, 1, 6), periods: ri(rng, 2, 7), exclamations: 0, parentheses: 0, quotes: 0 },
    perspective: { first: ri(rng, 4, 14), second: ri(rng, 0, 2), third: ri(rng, 0, 2) },
    mirrorLoadFailed: false,
    mirrorPipelineResult: null,
  };
}

function dayStartUtc(seasonStart, d) {
  return seasonStart + d * DAY_MS;
}

function samplePrompt(rng) {
  const prompts = [
    "Write about a moment you softened a direct statement.",
    "Describe a room detail that changed the tone of a conversation.",
    "Write from a sentence you almost deleted, then keep it.",
    "Follow one repeated word until it reveals what you are avoiding.",
    "Describe the shift between what you meant and what you said.",
  ];
  return pick(rng, prompts);
}

function profileSchedule(profile, rng, seasonStart) {
  const out = [];
  const days = 90;
  const addRuns = (day, n, hourMin, hourMax) => {
    const base = dayStartUtc(seasonStart, day);
    for (let i = 0; i < n; i += 1) {
      const hour = ri(rng, hourMin, hourMax);
      const minute = ri(rng, 0, 59);
      out.push(base + hour * HOUR_MS + minute * 60 * 1000);
    }
  };

  if (profile === "sparse_user") {
    let d = 0;
    while (d < days) {
      d += ri(rng, 2, 8);
      if (d >= days) break;
      addRuns(d, bool(rng, 0.45) ? 2 : 1, 8, 22);
    }
    return out;
  }

  if (profile === "steady_user") {
    for (let d = 0; d < days; d += 1) addRuns(d, ri(rng, 2, 4), 7, 22);
    return out;
  }

  if (profile === "intense_user") {
    for (let d = 0; d < days; d += 1) addRuns(d, ri(rng, 20, 30), 6, 23);
    return out;
  }

  if (profile === "clustered_user") {
    let d = 0;
    while (d < days) {
      d += ri(rng, 6, 16);
      if (d >= days) break;
      const burst = ri(rng, 3, 8);
      for (let b = 0; b < burst && d + b < days; b += 1) addRuns(d + b, ri(rng, 8, 14), 8, 23);
      d += burst;
    }
    return out;
  }

  if (profile === "nocturnal_user") {
    for (let d = 0; d < days; d += 1) {
      const n = ri(rng, 4, 10);
      for (let i = 0; i < n; i += 1) {
        const base = dayStartUtc(seasonStart, d);
        const night = bool(rng, 0.86);
        const hour = night ? (bool(rng, 0.55) ? 23 : ri(rng, 0, 3)) : ri(rng, 10, 20);
        out.push(base + hour * HOUR_MS + ri(rng, 0, 59) * 60 * 1000);
      }
    }
    return out;
  }

  if (profile === "calibration_user") {
    for (let d = 70; d < 90; d += ri(rng, 2, 4)) addRuns(d, ri(rng, 1, 2), 10, 22);
    return out;
  }

  if (profile === "returning_user") {
    for (let d = 0; d < 25; d += ri(rng, 4, 8)) addRuns(d, 1, 9, 21);
    for (let d = 55; d < 90; d += 1) addRuns(d, ri(rng, 2, 5), 8, 23);
    return out;
  }

  return out;
}

function generateProfileRuns(profile, seed) {
  const name = String(profile || "steady_user");
  const rng = mulberry32(hashString(`${name}|${seed || "wayword-social-v3"}`));
  const seasonEnd = Date.UTC(2026, 4, 20, 23, 59, 0, 0);
  const seasonStart = seasonEnd - 89 * DAY_MS;
  const schedule = profileSchedule(name, rng, seasonStart).sort((a, b) => a - b);

  const runs = [];
  for (let i = 0; i < schedule.length; i += 1) {
    const ts = schedule[i];
    const hour = new Date(ts).getUTCHours();
    const prompt = samplePrompt(rng);
    const completion = name === "calibration_user" ? (bool(rng, 0.65) ? "short" : "half") : (bool(rng, 0.22) ? "near" : "full");
    const text = buildPromptResponse(prompt, { profile: name, completion, hour, rng });
    runs.push(makeRun(i + 1, ts, prompt, text, rng));
  }
  return runs;
}

module.exports = {
  PROFILE_NAMES,
  TAGS_BY_PROFILE,
  KEYWORDS_BY_STATE,
  generateProfileRuns,
  buildPromptResponse,
  hashString,
  mulberry32,
};

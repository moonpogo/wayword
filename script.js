const promptFamilies = {
  Observation: [
    "Describe a room without mentioning doors or windows.",
    "Describe a city rooftop at dusk without using cliché language.",
    "Describe a kitchen after everyone has left.",
    "Describe a cheap object with absolute seriousness.",
    "Describe a neighborhood corner as if it had a private life.",
    "Describe an empty bus as if it were full."
  ],
  Indirection: [
    "Write about hunger without naming food.",
    "Write about shame without naming any emotion.",
    "Write about a body indirectly, through strain, weight, and gesture.",
    "Write about a person through the things they leave behind.",
    "Write about a meal that felt heavier than the food itself.",
    "Write about relief that arrives too late."
  ],
  Social: [
    "Write a scene where someone lies kindly and the other person knows it.",
    "Write about a conversation that never quite happened.",
    "Write about a phone call that changed nothing and everything.",
    "Write about a friend you have already started losing.",
    "Write a scene in which someone is kind for the wrong reason.",
    "Write a note to someone you avoid, but never send it."
  ],
  Object: [
    "Write about a cracked cup without using the word broken.",
    "Describe an old phone as if it were an organ.",
    "Describe a storm drain as if it were a mouth.",
    "Describe a public park bench as if it were a witness.",
    "Describe a hallway as if it remembers everyone who passed through it.",
    "Describe a waiting room as if it were sacred."
  ],
  Tension: [
    "Write a confession that avoids the actual wrongdoing.",
    "Write a small story where the only violence is in the tone.",
    "Write about envy without admitting it.",
    "Write about forgiveness as if it were a household chore.",
    "Describe grief using only physical details.",
    "Write about love as if it were civic infrastructure."
  ]
};

const bannedSets = [
  ["like","just","really","very","thing","stuff","something","maybe","kind","sort"],
  ["very","really","just","quite","perhaps","somehow"],
  ["thing","things","stuff","something","anything","nothing"],
  ["maybe","perhaps","kind","sort","almost","basically"]
];

const exemptWords = new Set([
  "a","an","the","to","of","in","on","at","by","with","as","is","be","am","are","was","were","and","or","but","for"
]);

const firstPersonWords = new Set(["i","me","my","mine","we","us","our","ours"]);
const secondPersonWords = new Set(["you","your","yours"]);
const thirdPersonWords = new Set(["he","him","his","she","her","hers","they","them","their","theirs","it","its"]);

const punctuationMarks = {
  commas: { regex: /,/g, label: "," },
  periods: { regex: /\./g, label: "." },
  semicolons: { regex: /;/g, label: ";" },
  colons: { regex: /:/g, label: ":" },
  hyphens: { regex: /-/g, label: "-" },
  apostrophes: { regex: /'/g, label: "'" },
  questions: { regex: /\?/g, label: "?" },
  exclamations: { regex: /!/g, label: "!" },
  parentheses: { regex: /[()]/g, label: "()" },
  quotes: { regex: /["“”]/g, label: "“”" }
};

const WORD_PRESETS = [60, 75, 90];
const TIME_PRESETS = [0, 60, 180, 300];
const CALIBRATION_THRESHOLD = 5;
const PROMPT_REROLL_LIMIT = 2;

const $ = (id) => document.getElementById(id);

const state = {
  active: false,
  submitted: false,
  targetWords: 60,
  repeatLimit: 2,
  timerSeconds: 0,
  timeRemaining: 0,
  timerId: null,
  banned: [...bannedSets[0]],
  prompt: "",
  promptFamily: "",
  lastPromptKey: "",
  theme: localStorage.getItem("wayword-theme") || "light",
  toastTimeout: null,
  history: JSON.parse(localStorage.getItem("wayword-history") || "[]"),
  savedRunIds: new Set(JSON.parse(localStorage.getItem("wayword-runids") || "[]")),
  exerciseWord: localStorage.getItem("wayword-exercise-word") || "",
  completedChallenges: new Set(
  JSON.parse(localStorage.getItem("wayword-completed-challenges") || "[]")
),
  bannedEditorOpen: false,
  optionsOpen: false,
  pendingTargetWords: 60,
  pendingTimerSeconds: 0,
  promptRerollsUsed: 0,
};

const input = document.querySelector('.editor-input');

const editorInput = $("editorInput");
const highlightLayer = $("highlightLayer");
const wordmark = $("wordmark");
const statusToast = $("statusToast");

let liftCurrent = 0;
let liftTarget = 0;
let liftVelocity = 0;
let lastTypingTs = 0;
let animFrame = null;
let completionTimer = null;
let settleTimer = null;

/* -----------------------------
   landing/app state
----------------------------- */

function enterLandingState() {
  $("landingView")?.classList.remove("hidden");
  $("appView")?.classList.add("hidden");
}

function enterAppState() {
  $("landingView")?.classList.add("hidden");
  $("appView")?.classList.remove("hidden");
  showProfile(false);
  setOptionsOpen(false);
}

/* -----------------------------
   wordmark motion
----------------------------- */

function setWordmarkVars() {
  if (!wordmark) return;
  wordmark.style.setProperty("--lift", String(liftCurrent));
}

function ensureWordmarkLoop() {
  if (animFrame !== null) return;

  const tick = () => {
    const now = performance.now();
    const sinceType = now - lastTypingTs;

    if (sinceType > 180) {
      const decay = sinceType > 420 ? 0.045 : 0.018;
      liftTarget = Math.max(0, liftTarget - decay);
    }

    const spring = 0.09;
    const damping = 0.82;

    liftVelocity += (liftTarget - liftCurrent) * spring;
    liftVelocity *= damping;
    liftCurrent += liftVelocity;

    if (Math.abs(liftTarget - liftCurrent) < 0.0015 && Math.abs(liftVelocity) < 0.0015 && liftTarget <= 0.001) {
      liftCurrent = 0;
      liftTarget = 0;
      liftVelocity = 0;
      setWordmarkVars();
      animFrame = null;
      return;
    }

    setWordmarkVars();
    animFrame = requestAnimationFrame(tick);
  };

  animFrame = requestAnimationFrame(tick);
}

function pulseWordmark() {
  if (!wordmark) return;

  clearTimeout(completionTimer);
  clearTimeout(settleTimer);

  wordmark.style.setProperty("--complete-tilt", "0deg");
  wordmark.style.setProperty("--complete-drop", "0em");
  wordmark.style.setProperty("--complete-scale", "1");

  lastTypingTs = performance.now();
  liftTarget = Math.min(1.35, liftTarget + 0.28);
  ensureWordmarkLoop();
}

function completeWordmark() {
  if (!wordmark) return;

  clearTimeout(completionTimer);
  clearTimeout(settleTimer);

  liftTarget = 0;
  ensureWordmarkLoop();

  wordmark.style.setProperty("--complete-tilt", "34deg");
  wordmark.style.setProperty("--complete-drop", "0.12em");
  wordmark.style.setProperty("--complete-scale", "1");

  completionTimer = setTimeout(() => {
    wordmark.style.setProperty("--complete-tilt", "-8deg");
    wordmark.style.setProperty("--complete-drop", "-0.02em");

    settleTimer = setTimeout(() => {
      wordmark.style.setProperty("--complete-tilt", "0deg");
      wordmark.style.setProperty("--complete-drop", "0em");
      wordmark.style.setProperty("--complete-scale", "1");
    }, 220);
  }, 240);
}

/* -----------------------------
   helpers
----------------------------- */

function setOptionsOpen(open) {
  state.optionsOpen = open;

  const panel = $("editorOptionsPanel");
  const backdrop = $("editorOptionsBackdrop");
  if (!panel) return;

  if (open) {
    state.pendingTargetWords = state.targetWords;
    state.pendingTimerSeconds = state.timerSeconds;

    setActiveModeButton("wordModesPanel", "words", state.pendingTargetWords);
    setActiveModeButton("timeModesPanel", "time", state.pendingTimerSeconds);

    const input = $("bannedInlineInputPanel");
    if (input) input.value = state.banned.join(", ");
  }

  panel.classList.toggle("hidden", !open);
  if (backdrop) {
    backdrop.classList.toggle("hidden", !open);
  }
}
function showToast(message, ms = 1400) {
  if (!statusToast) return;
  clearTimeout(state.toastTimeout);
  statusToast.textContent = message;
  statusToast.classList.remove("hidden");
  state.toastTimeout = setTimeout(() => {
    statusToast.classList.add("hidden");
  }, ms);
}

function applyTheme(theme) {
  state.theme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("wayword-theme", theme);
}

function toggleTheme() {
  applyTheme(state.theme === "light" ? "dark" : "light");
  showToast(state.theme === "dark" ? "Dark mode" : "Light mode", 900);
}

function completedRuns() {
  return state.history.length;
}

function hasProfileSignal() {
  return completedRuns() >= CALIBRATION_THRESHOLD;
}

function persist() {
  localStorage.setItem("wayword-history", JSON.stringify(state.history));
  localStorage.setItem("wayword-runids", JSON.stringify(Array.from(state.savedRunIds)));
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function normalizeWord(word) {
  return String(word || "")
    .toLowerCase()
    .replace(/[“”‘’]/g, "")
    .replace(/^[^a-z0-9']+|[^a-z0-9']+$/gi, "");
}

function tokenize(text) {
  return String(text || "")
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean);
}

function countWords(tokens) {
  const counts = {};
  for (const token of tokens) counts[token] = (counts[token] || 0) + 1;
  return counts;
}

function sentenceStarters(text) {
  return String(text || "")
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => normalizeWord((s.match(/[A-Za-z0-9']+/) || [""])[0]))
    .filter(Boolean);
}

function sentenceStarterExamples(text) {
  return String(text || "")
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => {
      const match = s.match(/[A-Za-z0-9']+/);
      return {
        starter: normalizeWord(match ? match[0] : ""),
        excerpt: s.length > 42 ? s.slice(0, 42) + "…" : s
      };
    })
    .filter(item => item.starter);
}

function countPerspective(tokens) {
  const result = { first: 0, second: 0, third: 0 };
  tokens.forEach(token => {
    if (firstPersonWords.has(token)) result.first++;
    if (secondPersonWords.has(token)) result.second++;
    if (thirdPersonWords.has(token)) result.third++;
  });
  return result;
}

function countPunctuation(text) {
  const result = {};
  Object.entries(punctuationMarks).forEach(([key, meta]) => {
    const matches = String(text || "").match(meta.regex);
    result[key] = matches ? matches.length : 0;
  });
  return result;
}

function generatePrompt() {
  const families = Object.keys(promptFamilies);
  let family = families[Math.floor(Math.random() * families.length)];
  let options = promptFamilies[family];
  let prompt = options[Math.floor(Math.random() * options.length)];
  let key = `${family}::${prompt}`;

  while (key === state.lastPromptKey && families.length > 1) {
    family = families[Math.floor(Math.random() * families.length)];
    options = promptFamilies[family];
    prompt = options[Math.floor(Math.random() * options.length)];
    key = `${family}::${prompt}`;
  }

  state.lastPromptKey = key;
  state.promptFamily = family;
  return prompt;
}

function makeRunId() {
  return "run_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

function updateEnterButtonVisibility() {
  const btn = $("enterSubmitBtn");
  if (!btn || !editorInput) return;

  const hasText = editorInput.value.trim().length > 0;
  const canShow = state.active && !state.submitted;

  btn.classList.toggle("hidden", !(hasText && canShow));
}

function canRerollPrompt() {
  return (
    state.active &&
    !state.submitted &&
    !editorInput?.value.trim() &&
    state.promptRerollsUsed < PROMPT_REROLL_LIMIT
  );
}

function rerollPrompt() {
  if (!canRerollPrompt()) return;

  state.prompt = generatePrompt();
  state.promptRerollsUsed += 1;

  renderMeta();

  const remaining = PROMPT_REROLL_LIMIT - state.promptRerollsUsed;
  showToast(remaining > 0 ? `New prompt · ${remaining} left` : "Prompt locked", 900);
}

function ensurePromptRerollButton() {
  const promptCard = $("promptCard");
  let btn = $("promptRerollBtn");

  if (!promptCard) return;

  promptCard.classList.add("has-reroll");

  if (!btn) {
    btn = document.createElement("button");
    btn.type = "button";
    btn.id = "promptRerollBtn";
    btn.className = "prompt-reroll-btn";
    btn.setAttribute("aria-label", "Get a different prompt");
    btn.innerHTML = `
      <span class="prompt-reroll-icon">↻</span>
      <span id="promptRerollBadge" class="prompt-reroll-badge">2</span>
    `;
    promptCard.appendChild(btn);
  }

  if (!btn.dataset.bound) {
    btn.addEventListener("click", rerollPrompt);
    btn.dataset.bound = "true";
  }
}

/* -----------------------------
   progress + timer UI
----------------------------- */

function renderTimer() {
  const timerEl = $("editorTimer");
  if (!timerEl) return;

  if (!state.active || !state.timerSeconds || state.submitted) {
    timerEl.classList.add("hidden");
    timerEl.textContent = "";
    return;
  }

  timerEl.classList.remove("hidden");

  if (state.timeRemaining >= 60) {
    const mins = Math.floor(state.timeRemaining / 60);
    const secs = state.timeRemaining % 60;
    timerEl.textContent = secs ? `${mins}:${String(secs).padStart(2, "0")}` : `${mins}m`;
  } else {
    timerEl.textContent = `${state.timeRemaining}s`;
  }
}
function updateWordProgress() {
  const fill = $("editorProgressFill");
  const markers = $("editorProgressMarkers");
  if (!fill) return;

  const words = state.active ? tokenize(editorInput?.value || "").length : 0;
  const target = state.targetWords || 1;

  const progress = Math.min(words / target, 1);
  const over = words > target;

  const clampedPercent = Math.min((words / target) * 100, 100);
  fill.style.width = `calc(${clampedPercent}% - 6px)`;
  const atTarget = words >= target;

fill.style.background = atTarget ? "var(--success)" : "var(--ink)";

  // === build 15-word markers ===
  if (!markers) return;

  const step = 15;
  let html = "";

  for (let i = step; i < target; i += step) {
      const percent = (i / target) * 100;
      const isFilled = words >= i;

      html += `<div class="progress-marker ${isFilled ? "filled" : ""}" style="left:${percent}%"></div>`;
}
  markers.innerHTML = html;
}
function updateTimeFill() {
  const fill = $("editorTimeFill");
  if (!fill) return;

  if (!state.active || !state.timerSeconds || state.submitted) {
    fill.style.height = "0%";
    return;
  }

  const elapsed = state.timerSeconds - state.timeRemaining;
  const progress = Math.min(Math.max(elapsed / state.timerSeconds, 0), 1);
  fill.style.height = `${progress * 100}%`;
}

function stopTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function startTimer() {
  stopTimer();

  if (!state.timerSeconds) {
    state.timeRemaining = 0;
    renderTimer();
    updateTimeFill();
    return;
  }

  state.timeRemaining = state.timerSeconds;
  renderTimer();
  updateTimeFill();

  state.timerId = setInterval(() => {
    state.timeRemaining -= 1;
    renderTimer();
    updateTimeFill();

    if (state.timeRemaining <= 0) {
      stopTimer();
      if (state.active && !state.submitted) submitWriting(true);
    }
  }, 1000);
}

/* -----------------------------
   analysis
----------------------------- */

function analyze(text) {
  const tokens = tokenize(text);
  const counts = countWords(tokens);
  const totalWords = tokens.length;
  const uniqueCount = Object.keys(counts).length;

  const repeated = Object.entries(counts)
    .filter(([word, count]) => !exemptWords.has(word) && count > state.repeatLimit)
    .sort((a, b) => b[1] - a[1]);

  const effectiveBanned = state.exerciseWord
    ? [...new Set([...state.banned, state.exerciseWord])]
    : [...state.banned];

  const bannedHits = effectiveBanned
    .map(word => ({ word, count: counts[word] || 0, isExercise: word === state.exerciseWord }))
    .filter(item => item.count > 0);

  const starters = sentenceStarters(text);
  const starterCounts = countWords(starters);
  const repeatedStarters = Object.entries(starterCounts)
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);

  const targetDelta = totalWords - state.targetWords;
  const underPenalty = targetDelta < 0 ? Math.ceil(Math.abs(targetDelta) * 0.6) : 0;
  const overPenalty = targetDelta > 0 ? Math.ceil(targetDelta * 1.6) : 0;

  const bannedPenalty = bannedHits.reduce((sum, item) => sum + item.count * 6, 0);
  const repeatPenalty = repeated.reduce((sum, [, count]) => sum + (count - state.repeatLimit) * 4, 0);
  const starterPenalty = repeatedStarters.reduce((sum, [, count]) => sum + (count - 1) * 2, 0);
  const score = Math.max(0, 100 - bannedPenalty - repeatPenalty - starterPenalty - underPenalty - overPenalty);

  const uniqueRatio = totalWords ? uniqueCount / totalWords : 0;
  const sentences = String(text || "").split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const avgSentenceLength = sentences.length ? totalWords / sentences.length : 0;
  const perspective = countPerspective(tokens);
  const punctuation = countPunctuation(text);
  const starterExampleList = sentenceStarterExamples(text);

  return {
    tokens,
    counts,
    totalWords,
    uniqueCount,
    repeated,
    bannedHits,
    repeatedStarters,
    targetDelta,
    score,
    starterCounts,
    uniqueRatio,
    avgSentenceLength,
    perspective,
    punctuation,
    starterExampleList
  };
}

function buildStarterIndexSet(text) {
  const sentenceParts = String(text || "").match(/[^.!?]+[.!?]?\s*/g) || [];
  const startersSeen = {};
  let globalWordIndex = 0;
  const repeatedStarterWordIndices = new Set();

  sentenceParts.forEach(sentence => {
    const words = sentence.match(/[^\s]+/g) || [];
    if (!words.length) return;

    const starter = normalizeWord(words[0]);
    if (starter) {
      startersSeen[starter] = (startersSeen[starter] || 0) + 1;
      if (startersSeen[starter] > 1) repeatedStarterWordIndices.add(globalWordIndex);
    }

    globalWordIndex += words.length;
  });

  return repeatedStarterWordIndices;
}

/* -----------------------------
   editor rendering
----------------------------- */

function syncScroll() {
  if (!highlightLayer || !editorInput) return;
  highlightLayer.scrollTop = editorInput.scrollTop;
  highlightLayer.scrollLeft = editorInput.scrollLeft;
}

function renderHighlight() {
  if (!highlightLayer || !editorInput) return;

  const text = editorInput.value || "";
  const counts = countWords(tokenize(text));
  const pieces = text.match(/[^\s]+|\s+/g) || [];
  const repeatedStarterIndices = buildStarterIndexSet(text);

  let wordIndex = 0;

  const html = pieces.map(piece => {
    if (/^\s+$/.test(piece)) {
      return escapeHtml(piece);
    }

    const norm = normalizeWord(piece);
    const dots = [];

    const isExercise = !!(norm && state.exerciseWord && norm === state.exerciseWord);
    const isBanned = !!(norm && state.banned.includes(norm) && !isExercise);
    const isRepeat = !!(norm && !exemptWords.has(norm) && (counts[norm] || 0) > state.repeatLimit);
    const isStarterRepeat = repeatedStarterIndices.has(wordIndex);

    if (isExercise) dots.push("dot-blue");
    else if (isBanned) dots.push("dot-red");

    if (isRepeat) dots.push("dot-yellow");
    if (isStarterRepeat) dots.push("dot-purple");

    wordIndex += 1;

    const dotsHtml = dots.length
      ? `<span class="token-dots">${dots.map(cls => `<span class="dot ${cls}"></span>`).join("")}</span>`
      : "";

    return `<span class="token"><span class="token-text">${escapeHtml(piece)}</span>${dotsHtml}</span>`;
  }).join("");

  highlightLayer.innerHTML = html;
  syncScroll();
}

function showEditorOverlay(message = "Submitted", persist = false) {
  const overlay = $("editorOverlay");
  const card = $("editorOverlayCard");
  if (!overlay || !card) return;

  card.textContent = message;
  overlay.classList.remove("hidden");

  if (!persist) {
    setTimeout(() => {
      overlay.classList.add("hidden");
    }, 900);
  }
}

function setActiveModeButton(containerId, attribute, value) {
  const container = $(containerId);
  if (!container) return;
  Array.from(container.querySelectorAll(".mode-btn")).forEach(btn => {
    btn.classList.toggle("active", Number(btn.dataset[attribute]) === value);
  });
}

function setBannedEditorOpen(open) {
  state.bannedEditorOpen = open;
  $("metaEditorRow")?.classList.toggle("hidden", !open);
  if (open) {
    const input = $("bannedInlineInput");
    if (input) {
      input.value = state.banned.join(", ");
      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      });
    }
  }
}

/* -----------------------------
   meta + layout rendering
----------------------------- */

function renderExerciseBanner() {
  const bannedPill = $("bannedPill");
  const exercisePill = $("exerciseLegendPill");
  if (!bannedPill) return;

  const bannedText = state.banned.length ? state.banned.join(", ") : "none";
  bannedPill.textContent = `avoid: ${bannedText}`;

  if (exercisePill) {
    if (state.exerciseWord) {
      exercisePill.classList.remove("hidden");
      $("legendBlueCount").textContent = "0";
    } else {
      exercisePill.classList.add("hidden");
    }
  }
}

function updateSubmitButtonState() {
  updateEnterButtonVisibility();
}
function renderMeta() {
  const promptCard = $("promptCard");
  const promptText = $("promptText");
  const promptFamily = $("promptFamilyLabel");
  const bannedPill = $("bannedPill");
  const bannedInlineInputPanel = $("bannedInlineInputPanel");

  if (promptCard) promptCard.classList.toggle("hidden", !state.active);
  if (promptText) promptText.textContent = state.prompt || "";
  if (promptFamily) promptFamily.textContent = state.promptFamily || "Prompt";

  if (bannedPill) {
    const bannedText = state.banned.length ? state.banned.join(", ") : "none";
    bannedPill.textContent = `avoid: ${bannedText}`;
  }

  if (bannedInlineInputPanel && document.activeElement !== bannedInlineInputPanel) {
    bannedInlineInputPanel.value = state.banned.join(", ");
  }

  renderExerciseBanner();

  setActiveModeButton("wordModes", "words", state.targetWords);
  setActiveModeButton("timeModes", "time", state.timerSeconds);
  setActiveModeButton("wordModesPanel", "words", state.targetWords);
  setActiveModeButton("timeModesPanel", "time", state.timerSeconds);

  renderTimer();
  updateWordProgress();
  updateTimeFill();
  updateEnterButtonVisibility();

  const rerollBtn = $("promptRerollBtn");
  const rerollBadge = $("promptRerollBadge");

  if (rerollBtn && rerollBadge) {
    const remaining = Math.max(0, PROMPT_REROLL_LIMIT - state.promptRerollsUsed);
    const locked = !canRerollPrompt();

    rerollBtn.disabled = locked;
    rerollBtn.classList.toggle("locked", locked);
    rerollBtn.classList.toggle("hidden", remaining === 0);

    rerollBadge.textContent = String(remaining);
    rerollBadge.classList.toggle("hidden", remaining === 0);
  }
}

function renderCalibration() {
  const runs = completedRuns();
  const progress = Math.min(runs, CALIBRATION_THRESHOLD);
  const pct = (progress / CALIBRATION_THRESHOLD) * 100;

  if ($("calibrationCount")) $("calibrationCount").textContent = `${progress} / ${CALIBRATION_THRESHOLD}`;
  if ($("calibrationFill")) $("calibrationFill").style.width = `${pct}%`;

  const statusCard = $("profileStatusCard");
  if (!statusCard) return;

  if (runs < CALIBRATION_THRESHOLD) {
    statusCard.classList.remove("hidden");

    if (runs === 0) {
      $("calibrationLabel").textContent = "Profile forming";
      $("calibrationNote").textContent = "Complete 5 rounds for your first reliable read.";
    } else if (runs < 3) {
      $("calibrationLabel").textContent = "Profile forming";
      $("calibrationNote").textContent = "A few more rounds will make your profile clearer.";
    } else {
      $("calibrationLabel").textContent = "Almost ready";
      $("calibrationNote").textContent = "You are close to unlocking your writing profile.";
    }
  } else {
    statusCard.classList.add("hidden");
  }
  const profileBtn = $("profileBtn");
  if (profileBtn) {
    profileBtn.classList.add("hidden");
  }

  const styleTab = $("styleTab");
  if (styleTab) {
    styleTab.classList.toggle("hidden", runs < CALIBRATION_THRESHOLD);
  }
}

function renderWritingState() {
  if (!editorInput) return;

  const isLocked = !state.active || state.submitted;
  editorInput.readOnly = isLocked;
  editorInput.placeholder = state.active && !state.submitted && !editorInput.value.trim()
    ? "Start typing here..."
    : "";

  updateSubmitButtonState();
  renderTimer();
  updateWordProgress();
  updateTimeFill();
}
function renderLegend(analysis) {
  const bluePill = $("exerciseLegendPill");

  if (!state.active || !analysis) {
    if ($("legendRedCount")) $("legendRedCount").textContent = "0";
    if ($("legendYellowCount")) $("legendYellowCount").textContent = "0";
    if ($("legendPurpleCount")) $("legendPurpleCount").textContent = "0";
    if ($("legendBlueCount")) $("legendBlueCount").textContent = "0";
    if (bluePill && !state.exerciseWord) bluePill.classList.add("hidden");
    return;
  }

  const redCount = analysis.bannedHits.filter(i => !i.isExercise).reduce((sum, item) => sum + item.count, 0);
  const targetPressure = Math.abs(analysis.targetDelta);
  const repeatedWordCount = analysis.repeated.reduce((sum, [, count]) => {
  return sum + (count - state.repeatLimit);
}, 0);
  const purpleCount = analysis.repeatedStarters.reduce((sum, [, count]) => sum + (count - 1), 0);
  const blueCount = analysis.bannedHits.filter(i => i.isExercise).reduce((sum, item) => sum + item.count, 0);

  if ($("legendRedCount")) $("legendRedCount").textContent = redCount;
if ($("legendYellowCount")) $("legendYellowCount").textContent = repeatedWordCount;
  if ($("legendPurpleCount")) $("legendPurpleCount").textContent = purpleCount;
  if ($("legendBlueCount")) $("legendBlueCount").textContent = blueCount;

  if (bluePill) {
    if (state.exerciseWord) bluePill.classList.remove("hidden");
    else bluePill.classList.add("hidden");
  }
}

function renderSidebar() {
  const thisRunCard = $("thisRunCard");

  if (!state.active || !state.submitted) {
    if (thisRunCard) thisRunCard.classList.add("hidden");
    renderLegend(state.active ? analyze(editorInput.value) : null);
    return;
  }

  if (thisRunCard) thisRunCard.classList.remove("hidden");

  const analysis = analyze(editorInput.value);

  if ($("repeatedWordsList")) {
    $("repeatedWordsList").innerHTML = analysis.repeated.length
      ? analysis.repeated.map(([w, c]) => `<span class="chip warn">${escapeHtml(w)} ${c} times</span>`).join("")
      : '<span class="chip">none</span>';
  }

  if ($("bannedWordsList")) {
    $("bannedWordsList").innerHTML = analysis.bannedHits.length
      ? analysis.bannedHits.map(item => {
          const cls = item.isExercise ? "exercise-chip" : "chip bad";
          const prefix = item.isExercise ? '<span class="exercise-dot"></span>' : '';
          return `<span class="${cls}">${prefix}${escapeHtml(item.word)} ${item.count} times</span>`;
        }).join("")
      : '<span class="chip">none</span>';
  }

  if ($("starterWarningsList")) {
    $("starterWarningsList").innerHTML = analysis.repeatedStarters.length
      ? analysis.repeatedStarters.map(([w, c]) => `<span class="chip purple">${escapeHtml(w)} ${c} times</span>`).join("")
      : '<span class="chip">none</span>';
  }

  renderLegend(analysis);
}

function renderHistory() {
  const historyEl = $("history");
  if (!historyEl) return;

const section = $("recentWritingSection");

if (!state.history.length) {
  section?.classList.add("hidden");
  historyEl.innerHTML = "";
  return;
}

section?.classList.remove("hidden");
  historyEl.innerHTML = state.history.slice().reverse().slice(0, 5).map(item => `
    <div class="history-item">
      <strong>${item.score}</strong> · ${item.words}w
      <div class="kicker" style="margin-top:4px;">${escapeHtml(item.prompt)}</div>
    </div>
  `).join("");
}

function aggregateProfile() {
  const agg = {
    totalRuns: state.history.length,
    totalWords: 0,
    totalUniqueRatio: 0,
    avgSentenceLength: 0,
    repetitionPressure: 0,
    fillerHits: 0,
    wordFreq: {},
    starterFreq: {},
    starterExamples: {},
    punctuation: Object.fromEntries(Object.keys(punctuationMarks).map(k => [k, 0])),
    perspective: { first: 0, second: 0, third: 0 }
  };

  state.history.forEach(run => {
    agg.totalWords += run.words;
    agg.totalUniqueRatio += run.uniqueRatio || 0;
    agg.avgSentenceLength += run.avgSentenceLength || 0;
    agg.repetitionPressure += run.repeatedCount || 0;
    agg.fillerHits += run.fillerCount || 0;

    Object.entries(run.wordFreq || {}).forEach(([w, c]) => {
      agg.wordFreq[w] = (agg.wordFreq[w] || 0) + c;
    });

    Object.entries(run.starterFreq || {}).forEach(([w, c]) => {
      agg.starterFreq[w] = (agg.starterFreq[w] || 0) + c;
    });

    Object.entries(run.starterExamples || {}).forEach(([w, ex]) => {
      if (!agg.starterExamples[w]) agg.starterExamples[w] = ex;
    });

    Object.entries(run.punctuation || {}).forEach(([k, c]) => {
      agg.punctuation[k] = (agg.punctuation[k] || 0) + c;
    });

    Object.entries(run.perspective || {}).forEach(([k, c]) => {
      agg.perspective[k] = (agg.perspective[k] || 0) + c;
    });
  });

  return agg;
}

function renderProfileLocked() {
  const runs = completedRuns();
  const remaining = Math.max(0, CALIBRATION_THRESHOLD - runs);

  const lockedHtml = `
    <div class="profile-locked">
      <div class="profile-locked-title">Profile forming.</div>
      <div class="profile-locked-copy">You need ${remaining} more ${remaining === 1 ? "round" : "rounds"} before your first reliable read.</div>
      <div class="profile-locked-copy">${runs} of ${CALIBRATION_THRESHOLD} completed.</div>
    </div>
  `;

  ["topWordsProfile","startersProfile","punctuationProfile","perspectiveProfile","patternCallouts"]
    .forEach(id => {
      const el = $(id);
      if (el) el.innerHTML = lockedHtml;
    });

  if ($("profileHeroSummary")) $("profileHeroSummary").innerHTML = lockedHtml;
  if ($("profileActionArea")) $("profileActionArea").innerHTML = "";
}

function buildPatternCallouts(agg, avgUniqueRatio, avgFiller, topWords, topStarters) {
  if (
    topWords[0] &&
    topWords[0][1] >= 4 &&
    !state.completedChallenges.has(topWords[0][0])
  ) {
    return {
      headline: "Repetition is one of your clearest signatures.",
      support: `Your most repeated word so far is "${topWords[0][0]}".`,
      direction: "",
      exerciseWord: topWords[0][0]
    };
}

  if (topStarters[0] && topStarters[0][1] >= 3) {
    return {
      headline: "Your sentences tend to enter the same way.",
      support: `You most often begin with "${topStarters[0][0]}".`,
      direction: "Try changing how you start sentences before you change their content.",
      exerciseWord: ""
    };
  }

  if (avgFiller > 2) {
    return {
      headline: "You use filler to keep movement going.",
      support: "The writing moves, but some of that movement is padded by softening words.",
      direction: "Try a stricter run and let silence force a cleaner next word.",
      exerciseWord: ""
    };
  }

  if (avgUniqueRatio > 0.72) {
    return {
      headline: "Your vocabulary spread stays relatively open.",
      support: "You are not writing with a tiny palette.",
      direction: "Watch whether variety sharpens precision or hides repetition.",
      exerciseWord: ""
    };
  }

  return {
    headline: "Your pattern is still forming.",
    support: "There is enough structure to continue, but not enough yet for a sharper read.",
    direction: "Do a few more runs under pressure and the profile will start to speak more clearly.",
    exerciseWord: ""
  };
}

function renderPunctuationChart(punctuationData) {
  const el = $("punctuationProfile");
  if (!el) return;

  const entries = Object.entries(punctuationMarks).map(([key, meta], idx) => ({
    key,
    label: meta.label,
    value: punctuationData[key] || 0,
    patternClass: `punct-pattern-${idx % 10}`
  }));

  const maxValue = Math.max(1, ...entries.map(e => e.value));

  el.innerHTML = `
    <div class="punctuation-chart">
      ${entries.map(entry => {
        const heightPct = Math.min(100, Math.max(4, (entry.value / maxValue) * 100));
        return `
          <div class="punct-col">
            <div class="punct-bar-wrap">
              <div class="punct-bar ${entry.patternClass}" style="height:${heightPct}%"></div>
            </div>
            <div class="punct-label">${escapeHtml(entry.label)}</div>
            <div class="punct-value">${entry.value}</div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderProfileSummaryStrip() {
  const el = $("profileSummary");
  if (!el) return;

  const section = $("profileSummarySection");
  
const runs = completedRuns();

if (!runs) {
  section?.classList.add("hidden");
  el.innerHTML = "";
  return;
}

section?.classList.remove("hidden");
  const agg = aggregateProfile();
  const avgUniqueRatio = agg.totalUniqueRatio / runs;
  const avgSentenceLength = agg.avgSentenceLength / runs;

  el.innerHTML = `
    <div class="snapshot-tile">
      <div class="snapshot-label">Runs</div>
      <div class="snapshot-value">${agg.totalRuns}</div>
    </div>
    <div class="snapshot-tile">
      <div class="snapshot-label">Words</div>
      <div class="snapshot-value">${agg.totalWords}</div>
    </div>
    <div class="snapshot-tile">
      <div class="snapshot-label">Unique</div>
      <div class="snapshot-value">${(avgUniqueRatio * 100).toFixed(0)}%</div>
    </div>
    <div class="snapshot-tile">
      <div class="snapshot-label">Avg sentence</div>
      <div class="snapshot-value">${avgSentenceLength.toFixed(1)}</div>
    </div>
  `;
}

function renderProfile() {
  if (!hasProfileSignal()) {
    renderProfileLocked();
    return;
  }

  const agg = aggregateProfile();
  const runs = Math.max(agg.totalRuns, 1);
  const avgUniqueRatio = agg.totalUniqueRatio / runs;
  const avgSentenceLength = agg.avgSentenceLength / runs;
  const avgFiller = agg.fillerHits / runs;

  if ($("profileHeroSummary")) {
    $("profileHeroSummary").innerHTML = `
      <div class="snapshot-tile">
        <div class="snapshot-label">Runs</div>
        <div class="snapshot-value">${agg.totalRuns}</div>
      </div>
      <div class="snapshot-tile">
        <div class="snapshot-label">Words</div>
        <div class="snapshot-value">${agg.totalWords}</div>
      </div>
      <div class="snapshot-tile">
        <div class="snapshot-label">Unique ratio</div>
        <div class="snapshot-value">${(avgUniqueRatio * 100).toFixed(0)}%</div>
      </div>
      <div class="snapshot-tile">
        <div class="snapshot-label">Sentence length</div>
        <div class="snapshot-value">${avgSentenceLength.toFixed(1)}</div>
      </div>
    `;
  }

  const topWords = Object.entries(agg.wordFreq)
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  if ($("topWordsProfile")) {
    $("topWordsProfile").innerHTML = topWords.length
      ? `<div class="word-cloud">
          ${topWords.map(([w, c]) => `<div class="word-bubble" style="font-size:${12 + Math.min(c * 2, 18)}px">${escapeHtml(w)}</div>`).join("")}
         </div>`
      : '<div class="history-item">No repeated words yet.</div>';
  }

  const topStarters = Object.entries(agg.starterFreq)
    .filter(([, c]) => c > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  if ($("startersProfile")) {
    $("startersProfile").innerHTML = topStarters.length
      ? topStarters.map(([w, c]) => {
          const example = agg.starterExamples[w] || `Sentence opening seen ${c} times so far`;
          return `
            <div class="opening-row">
              <div class="opening-word">${escapeHtml(w)}</div>
              <div class="opening-example">${escapeHtml(example)}</div>
              <div class="opening-count">${c} times</div>
            </div>
          `;
        }).join("")
      : '<div class="history-item">No repeated starters yet.</div>';
  }

  renderPunctuationChart(agg.punctuation);

  const perspectiveTotal = agg.perspective.first + agg.perspective.second + agg.perspective.third;
  if ($("perspectiveProfile")) {
    $("perspectiveProfile").innerHTML = perspectiveTotal
      ? `
        <div class="perspective-grid">
          <div class="perspective-tile">
            <div class="perspective-label">First person</div>
            <div class="perspective-value">${agg.perspective.first}</div>
          </div>
          <div class="perspective-tile">
            <div class="perspective-label">Second person</div>
            <div class="perspective-value">${agg.perspective.second}</div>
          </div>
          <div class="perspective-tile">
            <div class="perspective-label">Third person</div>
            <div class="perspective-value">${agg.perspective.third}</div>
          </div>
        </div>
      `
      : '<div class="history-item">No stance data yet.</div>';
  }

  const callouts = buildPatternCallouts(agg, avgUniqueRatio, avgFiller, topWords, topStarters);

  if ($("patternCallouts")) {
    $("patternCallouts").innerHTML = `
      <div class="history-item"><strong>${callouts.headline}</strong></div>
      <div class="history-item">${callouts.support}</div>
      ${callouts.direction ? `<div class="history-item">${callouts.direction}</div>` : ""}
    `;
  }

  if ($("profileActionArea")) {
    $("profileActionArea").innerHTML = callouts.exerciseWord
      ? `
        <div class="exercise-card">
          <div class="challenge-title">Suggested challenge</div>
          <div class="challenge-copy">
            Start one run without using the word <strong>${escapeHtml(callouts.exerciseWord)}</strong>.
          </div>
          <button id="startExerciseBtn" class="exercise-btn" type="button">
            <span class="exercise-dot"></span>
            Begin challenge
          </button>
        </div>
      `
      : "";

    const btn = $("startExerciseBtn");
    if (btn) btn.addEventListener("click", () => startExerciseRun(callouts.exerciseWord));
  }
}

/* -----------------------------
   actions
----------------------------- */

function cycleRepeatLimit() {
  const next = state.repeatLimit >= 4 ? 1 : state.repeatLimit + 1;
  state.repeatLimit = next;
  renderMeta();
  renderHighlight();
  renderSidebar();
  showToast(`Repeat limit ${next}`);
}

function restartRunWithCurrentSettings() {
  if (!state.active) return;

  state.submitted = false;
  state.promptRerollsUsed = 0;
  state.prompt = generatePrompt();
  editorInput.value = "";

  const fb = $("feedbackBox");
  if (fb) {
    fb.className = "result-card empty";
    fb.innerHTML = "";
  }

  stopTimer();
  startTimer();
  setOptionsOpen(false);

  renderMeta();
  renderWritingState();
  renderHighlight();
  renderSidebar();
  updateEnterButtonVisibility();

  requestAnimationFrame(() => {
    editorInput.focus();
    editorInput.setSelectionRange(0, 0);
  });

  showToast("New prompt loaded");
}

function saveBannedInline() {
  const input = $("bannedInlineInput");
  if (!input) return;

  state.banned = input.value
    .split(",")
    .map(normalizeWord)
    .filter(Boolean);

  setBannedEditorOpen(false);
  renderMeta();
  renderHighlight();
  renderSidebar();
  showToast("Words to avoid updated");
}

function triggerShuffle() {
  state.targetWords = WORD_PRESETS[Math.floor(Math.random() * WORD_PRESETS.length)];
  state.timerSeconds = TIME_PRESETS[Math.floor(Math.random() * TIME_PRESETS.length)];
  state.banned = [...bannedSets[Math.floor(Math.random() * bannedSets.length)]];
  stopTimer();
  renderMeta();
  renderHighlight();
  renderSidebar();

  if (state.active && !state.submitted) {
    startTimer();
    renderWritingState();
  }

  showToast(`Shuffled · ${state.targetWords} words · ${state.timerSeconds ? state.timerSeconds / 60 + "m" : "off"}`);
}

function startExerciseRun(word) {
  if (!word) return;
  state.exerciseWord = word;
  localStorage.setItem("wayword-exercise-word", word);
  startWriting();
  renderMeta();
  renderHighlight();
  renderSidebar();
  showToast(`Challenge: avoid "${word}"`);
}

function clearExerciseIfCompleted(text) {
  if (!state.exerciseWord) return;

  const tokens = tokenize(text);

  if (tokens.includes(state.exerciseWord)) return;

  state.completedChallenges.add(state.exerciseWord);
  localStorage.setItem(
    "wayword-completed-challenges",
    JSON.stringify(Array.from(state.completedChallenges))
  );

  localStorage.removeItem("wayword-exercise-word");
  state.exerciseWord = "";
}

function startWriting() {
  state.active = true;
  state.submitted = false;
  state.promptRerollsUsed = 0;
  $("editorOverlay")?.classList.add("hidden");
  state.prompt = generatePrompt();
  editorInput.value = "";

  const fb = $("feedbackBox");
  if (fb) {
    fb.className = "result-card empty";
    fb.innerHTML = "";
  }

  setBannedEditorOpen(false);
  setOptionsOpen(false);
  showProfile(false);
  renderMeta();
  renderWritingState();
  renderHighlight();
  renderSidebar();
  startTimer();
  updateEnterButtonVisibility();
  showToast("Writing");

  requestAnimationFrame(() => {
    editorInput.focus();
    editorInput.setSelectionRange(editorInput.value.length, editorInput.value.length);
  });
}

function buildRunResult(analysis, fromTimer) {
  const strongestRepeat = analysis.repeated[0];
  const strongestStarter = analysis.repeatedStarters[0];
  const strongestBanned = [...analysis.bannedHits].sort((a, b) => b.count - a.count)[0];

  if (strongestBanned) {
    return {
      headline: fromTimer ? "Time exposed your filler habits." : "You relied on a prohibited word.",
      direction: "Try another run with cleaner substitutions."
    };
  }

  if (analysis.targetDelta > 6) {
    return {
      headline: "You ran past the target.",
      direction: "Try stopping closer to the mark next round."
    };
  }

  if (analysis.targetDelta < -6) {
    return {
      headline: "You stopped short of the target.",
      direction: "Push further next round and feel the constraint tighten."
    };
  }

  if (strongestStarter) {
    return {
      headline: "Your sentences enter through the same door.",
      direction: "Change how you begin sentences before you change their content."
    };
  }

  if (strongestRepeat) {
    return {
      headline: "You repeat more than you think.",
      direction: "Try one tighter pass next."
    };
  }

  return {
    headline: "The writing stayed relatively controlled.",
    direction: "Try another pass under different pressure and compare what shifts."
  };
}

function submitWriting(fromTimer = false) {
  if (!state.active) return;

  if (state.submitted) {
    startWriting();
    return;
  }

  const analysis = analyze(editorInput.value);
  clearExerciseIfCompleted(editorInput.value);

  if (analysis.totalWords === 0) return;

  state.submitted = true;
  updateEnterButtonVisibility();
  stopTimer();
  completeWordmark();
  showEditorOverlay("Submitted");

  setTimeout(() => {
    if (state.submitted) {
      showEditorOverlay("Begin again", true);
    }
  }, 950);

  const starterExamplesMap = {};
  analysis.starterExampleList.forEach(item => {
    if (!starterExamplesMap[item.starter]) starterExamplesMap[item.starter] = item.excerpt;
  });

  const run = {
    runId: makeRunId(),
    prompt: state.prompt,
    score: analysis.score,
    words: analysis.totalWords,
    unique: analysis.uniqueCount,
    uniqueRatio: analysis.uniqueRatio,
    avgSentenceLength: analysis.avgSentenceLength,
    repeatedCount: analysis.repeated.length,
    fillerCount: analysis.bannedHits.reduce((sum, item) => sum + item.count, 0),
    wordFreq: analysis.counts,
    starterFreq: analysis.starterCounts,
    starterExamples: starterExamplesMap,
    punctuation: analysis.punctuation,
    perspective: analysis.perspective
  };

  if (!state.savedRunIds.has(run.runId)) {
    state.history.push({ ...run });
    state.savedRunIds.add(run.runId);
    persist();
    renderHistory();
    renderProfile();
    renderCalibration();
    renderProfileSummaryStrip();
  }

  renderWritingState();
  renderMeta();
  renderSidebar();

  const result = buildRunResult(analysis, fromTimer);
  const fb = $("feedbackBox");
  if (fb) {
  fb.className = "result-card";
  fb.innerHTML = `
  <div class="result-headline">${result.headline}</div>
  <div class="result-support">
    <div>score ${analysis.score}</div>
    <div>${analysis.totalWords} words</div>
    <div>${analysis.uniqueCount} unique</div>
    <div>${Math.round(analysis.uniqueRatio * 100)}% variety</div>
    <div>${analysis.avgSentenceLength.toFixed(1)} avg length</div>
  </div>
  <div class="result-direction">${result.direction} Press Enter to begin a new run.</div>
  `;
  }  if (!hasProfileSignal()) {
    const remaining = CALIBRATION_THRESHOLD - completedRuns();
    showToast(`${remaining} ${remaining === 1 ? "round" : "rounds"} to profile`);
  } else {
    showToast("Saved");
  }
  setTimeout(() => {
  if (input) {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
}, 0);
}

function showProfile(show = true) {
  $("writeView")?.classList.toggle("hidden", show);
  $("profileView")?.classList.toggle("hidden", !show);
  renderProfile();
}

/* -----------------------------
   zen hooks
----------------------------- */

function initZenGarden() {
  const overlay = $("zenGarden");
  const closeBtn = $("zenCloseBtn");
  const wordmarkEl = $("wordmark");
  if (!overlay || !closeBtn || !wordmarkEl) return;

  function openGarden() {
    overlay.classList.remove("hidden");
  }

  function closeGarden() {
    overlay.classList.add("hidden");
  }

  wordmarkEl.addEventListener("click", () => {
    if (overlay.classList.contains("hidden")) openGarden();
    else closeGarden();
  });

  closeBtn.addEventListener("click", closeGarden);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeGarden();
  });

  $("editorOverlay")?.addEventListener("click", () => {
  if (state.submitted) {
    startWriting();
  }
});
  
  $("zenClearBtn")?.addEventListener("click", () => showToast("Zen garden actions remain on your current build."));
  $("zenRandomBtn")?.addEventListener("click", () => showToast("Zen garden actions remain on your current build."));
  $("zenSaveBtn")?.addEventListener("click", () => showToast("Zen garden actions remain on your current build."));
  $("zenUndoBtn")?.addEventListener("click", () => showToast("Zen garden actions remain on your current build."));
}

/* -----------------------------
   events
----------------------------- */

if (editorInput) {
  editorInput.addEventListener("input", () => {
    if (!state.active || state.submitted) return;
    pulseWordmark();
    renderHighlight();
    renderSidebar();
    updateWordProgress();
    updateEnterButtonVisibility();
  });

  editorInput.addEventListener("scroll", syncScroll);

  editorInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (editorInput.value.trim().length === 0) return;
      submitWriting(false);
    }
  });
}

$("beginBtn")?.addEventListener("click", enterAppState);
$("themeToggleInPanel")?.addEventListener("click", toggleTheme);
$("beginBtn")?.addEventListener("click", () => {
  enterAppState();
  startWriting();
});
$("styleTab")?.addEventListener("click", () => {
  const profileView = $("profileView");
  const isShowingProfile = profileView && !profileView.classList.contains("hidden");
  showProfile(!isShowingProfile);
});
$("shuffleBtn")?.addEventListener("click", triggerShuffle);
$("repeatLimitPill")?.addEventListener("click", cycleRepeatLimit);
$("enterSubmitBtn")?.addEventListener("click", () => {
  if (!editorInput || editorInput.value.trim().length === 0) return;
  submitWriting(false);
});

$("bannedPill")?.addEventListener("click", () => {
  setBannedEditorOpen(!state.bannedEditorOpen);
});

$("saveBannedBtn")?.addEventListener("click", saveBannedInline);

$("bannedInlineInput")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    saveBannedInline();
  }
  if (e.key === "Escape") {
    setBannedEditorOpen(false);
  }
});

$("editorOptionsBackdrop")?.addEventListener("click", () => {
  setOptionsOpen(false);
});

$("optionsTrigger")?.addEventListener("click", (e) => {
  e.stopPropagation();
  setOptionsOpen(!state.optionsOpen);
});

document.addEventListener("click", (e) => {
  const panel = $("editorOptionsPanel");
  const trigger = $("optionsTrigger");
  const editor = $("metaEditorRow");
  const pill = $("bannedPill");

  if (panel && trigger && state.optionsOpen) {
    const insidePanel = panel.contains(e.target);
    const clickedTrigger = trigger.contains(e.target);
    if (!insidePanel && !clickedTrigger) {
      setOptionsOpen(false);
    }
  }

  if (!editor || !pill) return;

  const clickedInside = editor.contains(e.target);
  const clickedPill = pill.contains(e.target);

  if (!clickedInside && !clickedPill) {
    setBannedEditorOpen(false);
  }
});

/* -----------------------------
   panel control wiring
----------------------------- */

document.querySelectorAll("#wordModesPanel .mode-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    state.pendingTargetWords = Number(btn.dataset.words);
    setActiveModeButton("wordModesPanel", "words", state.pendingTargetWords);
    showToast(`Word target ${state.pendingTargetWords}`, 700);
  });
});
document.querySelectorAll("#timeModesPanel .mode-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    state.pendingTimerSeconds = Number(btn.dataset.time);
    setActiveModeButton("timeModesPanel", "time", state.pendingTimerSeconds);
    showToast(`Timer ${state.pendingTimerSeconds ? state.pendingTimerSeconds / 60 + "m" : "off"}`, 700);
  });
});
$("shuffleBtnPanel")?.addEventListener("click", triggerShuffle);

$("saveBannedBtnPanel")?.addEventListener("click", () => {
  const input = $("bannedInlineInputPanel");
  if (!input) return;

  state.banned = input.value
    .split(",")
    .map(normalizeWord)
    .filter(Boolean);

  state.targetWords = state.pendingTargetWords;
  state.timerSeconds = state.pendingTimerSeconds;

  if (state.active && !state.submitted) {
    restartRunWithCurrentSettings();
  } else {
    renderMeta();
    renderHighlight();
    renderSidebar();
    setOptionsOpen(false);
    showToast("Settings updated");
  }
});
/* -----------------------------
   boot
----------------------------- */

applyTheme(state.theme);
ensurePromptRerollButton();
renderMeta();
renderWritingState();
renderHighlight();
renderSidebar();
renderHistory();
renderProfile();
renderCalibration();
renderProfileSummaryStrip();
updateEnterButtonVisibility();
if (statusToast) statusToast.classList.add("hidden");

enterLandingState();
initZenGarden();

state.pendingTargetWords = state.targetWords;
state.pendingTimerSeconds = state.timerSeconds;

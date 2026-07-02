(function () {
  "use strict";

  var fixturePath = "/docs/product/expression-loop-prototype-sessions.json";
  var forceSpeechUnavailable = /(?:\?|&)speech=off(?:&|$)/.test(window.location.search);
  var SpeechRecognition = forceSpeechUnavailable ? null : window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var recognition = null;
  var activeStepId = "first-expression";
  var activeInput = null;
  var activeBlob = null;
  var activeBlobLabel = null;
  var activeReceivingState = null;
  var activeStatus = null;
  var currentUtterance = "";
  var finalTranscript = "";
  var isListening = false;
  var speechStartFailed = false;
  var sessions = [];
  var eventsBound = false;
  var preludeTimer = null;

  var state = {
    session: null,
    currentStepId: "invitation",
    outputsByStepId: {},
    modalityPath: [],
    selectedLine: "",
    selectedIndex: -1,
    transientStatus: "idle",
    conceptualState: "invitation",
    visibleSurface: "expression",
    preludeStatus: "none",
    speechDiagnostic: {
      state: "not-checked",
      error: "",
      message: "",
    },
  };

  var els = {
    openerText: document.getElementById("openerText"),
    openerEcho: document.getElementById("openerEcho"),
    firstInstruction: document.getElementById("firstInstruction"),
    preludePanel: document.getElementById("preludePanel"),
    preludeStatus: document.getElementById("preludeStatus"),
    preludeMeterFill: document.getElementById("preludeMeterFill"),
    primaryBlobBtn: document.getElementById("primaryBlobBtn"),
    primaryBlobLabel: document.getElementById("primaryBlobLabel"),
    firstExpressionInput: document.getElementById("firstExpressionInput"),
    firstContinueBtn: document.getElementById("firstContinueBtn"),
    statusText: document.getElementById("statusText"),
    receivingState: document.getElementById("receivingState"),
    encounterInstruction: document.getElementById("encounterInstruction"),
    firstExpressionOutput: document.getElementById("firstExpressionOutput"),
    lineChoices: document.getElementById("lineChoices"),
    movementBlock: document.getElementById("movementBlock"),
    selectedLineText: document.getElementById("selectedLineText"),
    movementInstruction: document.getElementById("movementInstruction"),
    secondaryBlobBtn: document.getElementById("secondaryBlobBtn"),
    secondaryBlobLabel: document.getElementById("secondaryBlobLabel"),
    secondExpressionInput: document.getElementById("secondExpressionInput"),
    secondReceivingState: document.getElementById("secondReceivingState"),
    secondStatusText: document.getElementById("secondStatusText"),
    finishBtn: document.getElementById("finishBtn"),
    reflectionSelectedLine: document.getElementById("reflectionSelectedLine"),
    reflectionResponse: document.getElementById("reflectionResponse"),
    finalArtifact: document.getElementById("finalArtifact"),
    restartBtn: document.getElementById("restartBtn"),
    sessionTitle: document.getElementById("sessionTitle"),
    modalityPath: document.getElementById("modalityPath"),
    speechDiagnostic: document.getElementById("speechDiagnostic"),
    sessionSelector: document.getElementById("sessionSelector"),
  };

  function surface(name) {
    return document.querySelector('[data-surface="' + name + '"]');
  }

  function setVisibleSurface(name) {
    state.visibleSurface = name;
    ["expression", "shaping", "reflection"].forEach(function (surfaceName) {
      var node = surface(surfaceName);
      if (node) node.classList.toggle("hidden", surfaceName !== name);
    });
    updateSurfaceTrack(name);
  }

  function updateSurfaceTrack(name) {
    ["expression", "shaping", "reflection"].forEach(function (key) {
      var dot = document.querySelector('[data-surface-dot="' + key + '"]');
      if (!dot) return;
      var isActive = key === name;
      dot.classList.toggle("is-active", isActive);
      if (isActive) dot.setAttribute("aria-current", "step");
      else dot.removeAttribute("aria-current");
    });
  }

  function setConceptualState(name) {
    state.conceptualState = name;
    state.currentStepId = name;
  }

  function setStatus(target, message) {
    if (!target) return;
    state.transientStatus = message || "idle";
    target.textContent = message || "";
  }

  function describeSpeechError(error) {
    var labels = {
      "not-allowed": "microphone permission denied",
      "service-not-allowed": "speech service blocked",
      "audio-capture": "microphone unavailable",
      network: "network or speech-service failure",
      "no-speech": "no speech detected",
      aborted: "aborted recognition",
      "language-not-supported": "unsupported language or service error",
    };
    return labels[error] || "recognition startup failure";
  }

  function setSpeechDiagnostic(nextState, error, message) {
    state.speechDiagnostic = {
      state: nextState,
      error: error || "",
      message: message || "",
    };
    if (!els.speechDiagnostic) return;
    var text = nextState;
    if (error) text += " (" + error + ")";
    if (message) text += ": " + message;
    els.speechDiagnostic.textContent = text;
  }

  function updatePath() {
    els.modalityPath.textContent = state.modalityPath.length ? state.modalityPath.join(" -> ") : "Not started";
  }

  function getStep(stepId) {
    if (!state.session || !Array.isArray(state.session.steps)) return null;
    return (
      state.session.steps.find(function (step) {
        return step.id === stepId;
      }) || null
    );
  }

  function getSelectionStep() {
    if (!state.session || !Array.isArray(state.session.steps)) return null;
    return (
      state.session.steps.find(function (step) {
        return step.type === "selection";
      }) || null
    );
  }

  function getMovementStep() {
    if (!state.session || !Array.isArray(state.session.steps)) return null;
    return (
      state.session.steps.find(function (step) {
        return step.type === "movement";
      }) || null
    );
  }

  function stepAllowsSpeech(stepId) {
    var step = getStep(stepId);
    return !!(step && Array.isArray(step.allowedModalities) && step.allowedModalities.indexOf("speech") !== -1);
  }

  function segmentSentences(text) {
    var source = String(text || "");
    var matches = source.match(/[^.!?\n]+[.!?]+(?:["')\]]+)?|[^.!?\n]+$/g) || [];
    return matches
      .map(function (item) {
        return item.trim();
      })
      .filter(Boolean);
  }

  function segmentItems(text) {
    var source = String(text || "");
    var primary = source
      .split(/\n|,/)
      .map(function (item) {
        return item.trim();
      })
      .filter(Boolean);
    if (primary.length > 1) return primary;
    return segmentSentences(source);
  }

  function buildSelectionCandidates(session, text) {
    var selection = null;
    if (session && Array.isArray(session.steps)) {
      selection = session.steps.find(function (step) {
        return step.type === "selection";
      });
    }
    var granularity = selection && selection.selectionGranularity === "item" ? "item" : "sentence";
    var candidates = granularity === "item" ? segmentItems(text) : segmentSentences(text);
    var fallbackMessage = "";

    if (selection && selection.questionOnly) {
      var questionCandidates = candidates.filter(function (item) {
        return /\?\s*$/.test(item);
      });
      if (questionCandidates.length) {
        candidates = questionCandidates;
      } else {
        fallbackMessage =
          selection.fallbackInstruction ||
          "No question mark was detected, so choose the segment that carries the question.";
      }
    }

    return {
      candidates: candidates.slice(0, 10),
      fallbackMessage: fallbackMessage,
      granularity: granularity,
      purpose: selection ? selection.selectionPurpose : "movement-source",
    };
  }

  function configureActiveSpeechTarget(stepId) {
    activeStepId = stepId;
    if (stepId === "second-expression") {
      activeInput = els.secondExpressionInput;
      activeBlob = els.secondaryBlobBtn;
      activeBlobLabel = els.secondaryBlobLabel;
      activeReceivingState = els.secondReceivingState;
      activeStatus = els.secondStatusText;
    } else {
      activeInput = els.firstExpressionInput;
      activeBlob = els.primaryBlobBtn;
      activeBlobLabel = els.primaryBlobLabel;
      activeReceivingState = els.receivingState;
      activeStatus = els.statusText;
    }
    updateSpeechControlVisibility(stepId);
    setBlobControlState(SpeechRecognition ? "idle" : "unavailable");
    if (!SpeechRecognition) setSpeechDiagnostic("API unavailable", forceSpeechUnavailable ? "forced-off" : "", "");
  }

  function updateSpeechControlVisibility(stepId) {
    var allowsSpeech = stepAllowsSpeech(stepId);
    var control = activeBlob ? activeBlob.closest(".blob-control") : null;
    if (control) control.classList.toggle("hidden", !allowsSpeech);
    if (!allowsSpeech && activeBlobLabel) {
      activeBlobLabel.textContent = "Write in the text field. System dictation may still work.";
    }
  }

  function setBlobControlState(mode) {
    if (!activeBlob || !activeBlobLabel) return;
    var isReceiving = mode === "receiving";
    var isPrelude = mode === "prelude";
    activeBlob.classList.toggle("is-receiving", isReceiving || isPrelude);
    activeBlob.classList.toggle("is-stopped", mode === "stopped");
    activeBlob.classList.toggle("is-unavailable", mode === "unavailable");
    activeBlob.setAttribute("aria-pressed", isReceiving || isPrelude ? "true" : "false");
    if (mode === "prelude") {
      activeBlob.setAttribute("aria-label", "Silence in progress");
      activeBlobLabel.textContent = "Silence is in progress. The microphone has not started.";
    } else if (mode === "receiving") {
      activeBlob.setAttribute("aria-label", "Stop speech input");
      activeBlobLabel.textContent = "Receiving language. Tap the blob to stop.";
    } else if (mode === "unavailable") {
      activeBlob.setAttribute("aria-label", "Speech unavailable; type or use system dictation");
      activeBlobLabel.textContent = "Speech is not available here. Type or use system dictation.";
    } else if (mode === "stopped") {
      activeBlob.setAttribute("aria-label", "Start speech input");
      activeBlobLabel.textContent = "Speech stopped. Tap the blob to speak again.";
    } else if (activeStepId === "second-expression") {
      activeBlob.setAttribute("aria-label", "Start speech input");
      activeBlobLabel.textContent = "Shape the selected line by speaking or typing.";
    } else if (state.session && state.session.prelude && state.preludeStatus === "ready") {
      activeBlob.setAttribute("aria-label", "Begin the silence");
      activeBlobLabel.textContent = "Tap the blob to begin the silence.";
    } else {
      activeBlob.setAttribute("aria-label", "Start speech input");
      activeBlobLabel.textContent = "Tap the blob to speak. Type below anytime.";
    }
  }

  function stopListening() {
    if (recognition) {
      try {
        recognition.stop();
      } catch (_) {}
    }
    isListening = false;
    [els.receivingState, els.secondReceivingState].forEach(function (node) {
      if (!node) return;
      node.classList.remove("is-active");
      node.setAttribute("aria-hidden", "true");
    });
    if (activeBlob && activeBlob.closest(".blob-control") && !activeBlob.closest(".blob-control").classList.contains("hidden")) {
      setBlobControlState(SpeechRecognition ? "stopped" : "unavailable");
    }
  }

  function startListening() {
    if (!activeInput || !stepAllowsSpeech(activeStepId)) return;
    if (!SpeechRecognition) {
      setStatus(activeStatus, "Speech recognition is not available here. Typing and system dictation still work.");
      setSpeechDiagnostic("API unavailable", forceSpeechUnavailable ? "forced-off" : "", "");
      setBlobControlState("unavailable");
      return;
    }

    stopListening();
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    currentUtterance = "";
    finalTranscript = "";
    speechStartFailed = false;

    recognition.onstart = function () {
      isListening = true;
      setSpeechDiagnostic("recognition started", "", "");
      state.modalityPath.push(activeStepId === "second-expression" ? "speech-shaping" : "speech");
      updatePath();
      if (activeReceivingState) {
        activeReceivingState.classList.add("is-active");
        activeReceivingState.setAttribute("aria-hidden", "false");
      }
      setBlobControlState("receiving");
      activeInput.value = "";
      activeInput.placeholder = "Listening. The transcript stays veiled while you speak.";
      setStatus(activeStatus, "Speak freely. The transcript will appear after speech ends.");
    };

    recognition.onresult = function (event) {
      var interimTranscript = "";
      var i;
      for (i = event.resultIndex; i < event.results.length; i += 1) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      currentUtterance = (finalTranscript + interimTranscript).trim();
    };

    recognition.onerror = function (event) {
      speechStartFailed = true;
      setSpeechDiagnostic(describeSpeechError(event && event.error), event && event.error, event && event.message);
      setStatus(activeStatus, "Speech could not start here. Typing and system dictation still work.");
      stopListening();
      setBlobControlState("unavailable");
    };

    recognition.onend = function () {
      isListening = false;
      if (activeReceivingState) {
        activeReceivingState.classList.remove("is-active");
        activeReceivingState.setAttribute("aria-hidden", "true");
      }
      setBlobControlState(speechStartFailed || !SpeechRecognition ? "unavailable" : "stopped");
      activeInput.placeholder =
        activeStepId === "second-expression" ? "Begin from the selected line." : "Type here, or use system dictation.";
      if (currentUtterance) {
        activeInput.value = currentUtterance;
        setStatus(activeStatus, "Speech received. You can make a narrow transcript correction before moving on.");
        setSpeechDiagnostic("recognition ended", "", "");
      } else if (!speechStartFailed) {
        setSpeechDiagnostic("no speech detected", "", "");
      }
    };

    try {
      recognition.start();
    } catch (_) {
      speechStartFailed = true;
      setSpeechDiagnostic("recognition startup failure", "", "");
      setStatus(activeStatus, "Speech could not start here. Typing and system dictation still work.");
      stopListening();
      setBlobControlState("unavailable");
    }
  }

  function saveCurrentText(stepId, input, statusEl) {
    var text = input.value.trim();
    if (!text) {
      setStatus(statusEl, "Put down a little language before moving on.");
      return false;
    }
    state.outputsByStepId[stepId] = text;
    var speechMode = stepId === "second-expression" ? "speech-shaping" : "speech";
    var typingMode = stepId === "second-expression" ? "typing-shaping" : "typing";
    var lastMode = state.modalityPath[state.modalityPath.length - 1];
    if (lastMode !== speechMode || currentUtterance.trim() !== text) {
      if (lastMode !== typingMode) state.modalityPath.push(typingMode);
      updatePath();
    }
    return true;
  }

  function setSession(session) {
    state.session = session;
    els.sessionTitle.textContent = session.title;
    if (els.sessionSelector && els.sessionSelector.value !== session.id) {
      els.sessionSelector.value = session.id;
    }
    resetSessionState();
  }

  function setExpressionPromptForSession() {
    var firstStep = getStep("first-expression");
    if (state.session && state.session.prelude && state.preludeStatus !== "complete") {
      els.openerText.textContent = state.session.prelude.condition;
      els.firstInstruction.textContent = "The first response will begin after the silence.";
      return;
    }
    els.openerText.textContent = state.session.opener.text;
    if (state.session && state.session.prelude && state.preludeStatus === "complete") {
      els.openerText.textContent = state.session.prelude.afterInstruction;
    }
    els.firstInstruction.textContent = firstStep && firstStep.instruction ? firstStep.instruction : "Speak or type the first version.";
  }

  function preparePreludeIfNeeded() {
    window.clearTimeout(preludeTimer);
    els.preludeMeterFill.style.transition = "";
    els.preludeMeterFill.style.width = "0%";
    els.preludePanel.classList.add("hidden");
    els.firstExpressionInput.disabled = false;
    els.firstContinueBtn.disabled = false;
    els.primaryBlobBtn.disabled = false;
    state.preludeStatus = "none";

    if (!state.session || !state.session.prelude) return;

    state.preludeStatus = "ready";
    els.preludePanel.classList.remove("hidden");
    els.preludeStatus.textContent = "Tap the blob to begin the silence.";
    els.firstExpressionInput.disabled = true;
    els.firstContinueBtn.disabled = true;
    els.primaryBlobBtn.disabled = false;
    setBlobControlState("idle");
  }

  function startPrelude() {
    if (!state.session || !state.session.prelude || state.preludeStatus !== "ready") return;
    var duration = Number(state.session.prelude.durationSeconds || 10);
    state.preludeStatus = "running";
    setConceptualState("invitation");
    els.preludeStatus.textContent = prefersReducedMotion
      ? "Silence is in progress."
      : "Silence is in progress. The line will open when it is complete.";
    els.firstExpressionInput.disabled = true;
    els.firstContinueBtn.disabled = true;
    setBlobControlState("prelude");
    if (!prefersReducedMotion) {
      window.requestAnimationFrame(function () {
        els.preludeMeterFill.style.transition = "width " + duration + "s linear";
        els.preludeMeterFill.style.width = "100%";
      });
    }
    preludeTimer = window.setTimeout(finishPrelude, duration * 1000);
  }

  function finishPrelude() {
    if (!state.session || !state.session.prelude) return;
    window.clearTimeout(preludeTimer);
    state.preludeStatus = "complete";
    els.preludeStatus.textContent = "Silence complete. Name what you noticed.";
    els.preludeMeterFill.style.transition = "";
    els.preludeMeterFill.style.width = "100%";
    els.firstExpressionInput.disabled = false;
    els.firstContinueBtn.disabled = false;
    els.primaryBlobBtn.disabled = false;
    configureActiveSpeechTarget("first-expression");
    setExpressionPromptForSession();
    setStatus(els.statusText, "The microphone has not started. Speak, type, or use system dictation when ready.");
    window.setTimeout(function () {
      els.firstExpressionInput.focus();
    }, 40);
  }

  function showShapingSurface() {
    stopListening();
    setConceptualState("encounter");
    setVisibleSurface("shaping");
    configureActiveSpeechTarget("second-expression");
    var firstText = state.outputsByStepId["first-expression"] || "";
    var selection = getSelectionStep();
    var movement = getMovementStep();
    var selectionBundle = buildSelectionCandidates(state.session, firstText);
    els.openerEcho.textContent = state.session.opener.text;
    if (state.session.prelude && state.session.prelude.afterInstruction) {
      els.openerEcho.textContent = state.session.prelude.condition + " Then: " + state.session.prelude.afterInstruction;
    }
    els.encounterInstruction.textContent = selection ? selection.instruction : "Choose a line.";
    els.movementInstruction.textContent = movement ? movement.instruction : "Begin from the selected line.";
    els.firstExpressionOutput.textContent = firstText;
    renderSelectionChoices(selectionBundle);
    els.movementBlock.classList.add("hidden");
    els.secondExpressionInput.value = "";
    els.secondExpressionInput.placeholder = stepAllowsSpeech("second-expression")
      ? "Begin from the selected line."
      : "Write from the selected line.";
    els.secondStatusText.textContent = "";
    window.setTimeout(function () {
      var firstChoice = els.lineChoices.querySelector(".line-choice");
      if (firstChoice) firstChoice.focus();
    }, 40);
  }

  function renderSelectionChoices(selectionBundle) {
    els.lineChoices.innerHTML = "";
    if (selectionBundle.fallbackMessage) {
      var note = document.createElement("p");
      note.className = "quiet-note";
      note.textContent = selectionBundle.fallbackMessage;
      els.lineChoices.appendChild(note);
    }
    if (!selectionBundle.candidates.length) {
      var empty = document.createElement("p");
      empty.className = "quiet-note";
      empty.textContent = "No selectable material appeared yet.";
      els.lineChoices.appendChild(empty);
      return;
    }
    selectionBundle.candidates.forEach(function (line, index) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "line-choice";
      button.textContent = line;
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", function () {
        selectLine(line, index, button);
      });
      button.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectLine(line, index, button);
        }
      });
      els.lineChoices.appendChild(button);
    });
  }

  function selectLine(line, index, button) {
    setConceptualState("selection");
    Array.prototype.forEach.call(els.lineChoices.querySelectorAll(".line-choice"), function (item) {
      item.classList.remove("is-selected");
      item.setAttribute("aria-pressed", "false");
    });
    button.classList.add("is-selected");
    button.setAttribute("aria-pressed", "true");
    state.selectedLine = line;
    state.selectedIndex = index;
    els.selectedLineText.textContent = line;
    els.movementBlock.classList.remove("hidden");
    configureActiveSpeechTarget("second-expression");
    setConceptualState("movement");
    window.setTimeout(function () {
      els.secondExpressionInput.focus();
    }, 40);
  }

  function buildFinalArtifact(shaped) {
    var result = (state.session.finalArtifact && state.session.finalArtifact.result) || "The selected material became the source for the second response.";
    return 'You selected\n\n"' + state.selectedLine + '"\n\nWhat followed\n\n"' + shaped + '"\n\nSession result\n' + result;
  }

  function showReflectionSurface() {
    if (!state.selectedLine) {
      setStatus(els.secondStatusText, "Choose from the first expression before finishing the run.");
      return;
    }
    if (!saveCurrentText("second-expression", els.secondExpressionInput, els.secondStatusText)) return;
    stopListening();
    setConceptualState("reflection");
    setVisibleSurface("reflection");
    var shaped = state.outputsByStepId["second-expression"] || "";
    els.reflectionSelectedLine.textContent = state.selectedLine;
    els.reflectionResponse.textContent = shaped;
    els.finalArtifact.textContent = buildFinalArtifact(shaped);
    window.setTimeout(function () {
      els.restartBtn.focus();
    }, 40);
  }

  function resetSessionState() {
    stopListening();
    window.clearTimeout(preludeTimer);
    var selection = getSelectionStep();
    var movement = getMovementStep();
    state.outputsByStepId = {};
    state.modalityPath = [];
    state.selectedLine = "";
    state.selectedIndex = -1;
    state.transientStatus = "idle";
    state.preludeStatus = "none";
    state.speechDiagnostic = {
      state: SpeechRecognition ? "not-checked" : "API unavailable",
      error: SpeechRecognition ? "" : forceSpeechUnavailable ? "forced-off" : "",
      message: "",
    };
    currentUtterance = "";
    finalTranscript = "";
    updatePath();
    setConceptualState("invitation");
    setVisibleSurface("expression");
    els.openerEcho.textContent = state.session.opener.text;
    els.firstExpressionInput.value = "";
    els.secondExpressionInput.value = "";
    els.firstExpressionOutput.textContent = "";
    els.lineChoices.innerHTML = "";
    els.selectedLineText.textContent = "";
    els.reflectionSelectedLine.textContent = "";
    els.reflectionResponse.textContent = "";
    els.finalArtifact.textContent = "";
    els.encounterInstruction.textContent = selection ? selection.instruction : "Choose a line.";
    els.movementInstruction.textContent = movement ? movement.instruction : "Begin from the selected line.";
    els.statusText.textContent = SpeechRecognition ? "" : "Speech recognition is not available here. Typing and system dictation still work.";
    setSpeechDiagnostic(state.speechDiagnostic.state, state.speechDiagnostic.error, state.speechDiagnostic.message);
    els.secondStatusText.textContent = "";
    els.movementBlock.classList.add("hidden");
    configureActiveSpeechTarget("first-expression");
    preparePreludeIfNeeded();
    setExpressionPromptForSession();
    if (state.preludeStatus === "none") {
      els.firstExpressionInput.disabled = false;
      els.firstContinueBtn.disabled = false;
      els.primaryBlobBtn.disabled = false;
    }
    window.setTimeout(function () {
      if (state.preludeStatus === "ready") els.primaryBlobBtn.focus();
      else els.firstExpressionInput.focus();
    }, 40);
  }

  function bindEvents() {
    if (eventsBound) return;
    eventsBound = true;

    els.primaryBlobBtn.addEventListener("click", function () {
      configureActiveSpeechTarget("first-expression");
      if (state.session && state.session.prelude && state.preludeStatus === "ready") {
        startPrelude();
        return;
      }
      if (state.session && state.session.prelude && state.preludeStatus === "running") return;
      setConceptualState("expression");
      if (isListening) stopListening();
      else startListening();
    });

    els.secondaryBlobBtn.addEventListener("click", function () {
      configureActiveSpeechTarget("second-expression");
      setConceptualState("shaping");
      if (isListening) stopListening();
      else startListening();
    });

    els.firstExpressionInput.addEventListener("input", function () {
      setConceptualState("expression");
      if (els.statusText.textContent && els.firstExpressionInput.value.trim()) setStatus(els.statusText, "");
    });

    els.secondExpressionInput.addEventListener("input", function () {
      setConceptualState("shaping");
      if (els.secondStatusText.textContent && els.secondExpressionInput.value.trim()) setStatus(els.secondStatusText, "");
    });

    els.firstContinueBtn.addEventListener("click", function () {
      configureActiveSpeechTarget("first-expression");
      if (saveCurrentText("first-expression", els.firstExpressionInput, els.statusText)) showShapingSurface();
    });

    els.finishBtn.addEventListener("click", showReflectionSurface);
    els.restartBtn.addEventListener("click", resetSessionState);

    els.sessionSelector.addEventListener("change", function () {
      var nextSession = sessions.find(function (item) {
        return item.id === els.sessionSelector.value;
      });
      if (nextSession) setSession(nextSession);
    });
  }

  function populateSelector() {
    els.sessionSelector.innerHTML = "";
    sessions.forEach(function (session) {
      var option = document.createElement("option");
      option.value = session.id;
      option.textContent = session.title + " (" + session.mechanic + ")";
      els.sessionSelector.appendChild(option);
    });
  }

  function fallbackSession() {
    return {
      id: "certainty-memory-01",
      title: "Certainty",
      mechanic: "epistemic",
      opener: { text: "Tell a memory as if you are certain.", supportedModalities: ["speech", "typing"] },
      steps: [
        { id: "first-expression", type: "expression", instruction: "Speak or type the first version.", allowedModalities: ["speech", "typing"] },
        {
          id: "selected-line",
          type: "selection",
          instruction: "Choose the sentence you trust least.",
          allowedModalities: ["typing"],
          sourceStepId: "first-expression",
          selectionGranularity: "sentence",
          selectionPurpose: "movement-source",
        },
        {
          id: "selected-line-movement",
          type: "movement",
          instruction: "Begin from that sentence. Describe what could be wrong about it.",
          allowedModalities: ["speech", "typing"],
          sourceStepId: "selected-line",
        },
        { id: "second-expression", type: "expression", instruction: "Shape the selected sentence.", allowedModalities: ["speech", "typing"] },
      ],
      closure: { instruction: "Let the shaped response stand as the session result." },
      finalArtifact: { result: "The selected sentence became the source for the second response." },
    };
  }

  function loadSession() {
    fetch(fixturePath, { cache: "no-store" })
      .then(function (response) {
        if (!response.ok) throw new Error("Could not load prototype sessions.");
        return response.json();
      })
      .then(function (loadedSessions) {
        sessions = Array.isArray(loadedSessions) ? loadedSessions : [];
        if (!sessions.length) throw new Error("No prototype sessions found.");
        populateSelector();
        bindEvents();
        setSession(
          sessions.find(function (item) {
            return item.id === "certainty-memory-01";
          }) || sessions[0]
        );
      })
      .catch(function () {
        sessions = [fallbackSession()];
        populateSelector();
        bindEvents();
        setSession(sessions[0]);
      });
  }

  window.waywordExpressionLoopPrototype = {
    segmentSentences: segmentSentences,
    segmentItems: segmentItems,
    buildSelectionCandidates: buildSelectionCandidates,
    finishPreludeForTesting: finishPrelude,
    getState: function () {
      return JSON.parse(JSON.stringify(state));
    },
  };

  loadSession();
})();

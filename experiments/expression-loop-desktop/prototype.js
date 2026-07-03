(function () {
  "use strict";

  var fixturePath = "/docs/product/expression-loop-prototype-sessions.json";

  var state = {
    session: null,
    phase: "loading",
    firstExpression: "",
    secondExpression: "",
    segments: [],
    selectedIndex: -1,
    selectedSentence: "",
    secondStarted: false,
  };

  var els = {
    openerText: document.getElementById("openerText"),
    firstWritingBlock: document.getElementById("firstWritingBlock"),
    firstExpressionInput: document.getElementById("firstExpressionInput"),
    settleExpressionBtn: document.getElementById("settleExpressionBtn"),
    firstExpressionError: document.getElementById("firstExpressionError"),
    settledExpressionBlock: document.getElementById("settledExpressionBlock"),
    encounterInstruction: document.getElementById("encounterInstruction"),
    selectionStatus: document.getElementById("selectionStatus"),
    firstExpressionPassage: document.getElementById("firstExpressionPassage"),
    flagsBuffer: document.getElementById("flagsBuffer"),
    reshapeArea: document.getElementById("reshapeArea"),
    chosenSentenceText: document.getElementById("chosenSentenceText"),
    movementInstruction: document.getElementById("movementInstruction"),
    secondExpressionInput: document.getElementById("secondExpressionInput"),
    secondExpressionError: document.getElementById("secondExpressionError"),
    finishSessionBtn: document.getElementById("finishSessionBtn"),
    artifactBlock: document.getElementById("artifactBlock"),
    artifactSelected: document.getElementById("artifactSelected"),
    artifactFollowed: document.getElementById("artifactFollowed"),
    artifactResult: document.getElementById("artifactResult"),
    restartBtn: document.getElementById("restartBtn"),
    fixtureStatus: document.getElementById("fixtureStatus"),
  };

  function findStep(type) {
    if (!state.session || !Array.isArray(state.session.steps)) return null;
    return (
      state.session.steps.find(function (step) {
        return step.type === type;
      }) || null
    );
  }

  // Adapted from the mobile experiment's deterministic sentence split, but kept
  // renderer-neutral here: no speech lifecycle, controller, or surface assumptions.
  function segmentSentencesExact(text) {
    var source = String(text || "");
    var segments = [];
    var start = -1;
    var i = 0;

    function pushRange(end) {
      var trimmedEnd = end;
      while (trimmedEnd > start && /\s/.test(source.charAt(trimmedEnd - 1))) {
        trimmedEnd -= 1;
      }
      if (trimmedEnd > start) {
        segments.push({
          start: start,
          end: trimmedEnd,
          text: source.slice(start, trimmedEnd),
        });
      }
      start = -1;
    }

    while (i < source.length) {
      var character = source.charAt(i);
      if (start === -1 && !/\s/.test(character)) {
        start = i;
      }

      if (start !== -1 && /[.!?]/.test(character)) {
        var end = i + 1;
        while (end < source.length && /["')\]\}”’]/.test(source.charAt(end))) {
          end += 1;
        }
        pushRange(end);
        i = end - 1;
      }
      i += 1;
    }

    if (start !== -1) {
      pushRange(source.length);
    }

    return segments;
  }

  function setPhase(phase) {
    state.phase = phase;
    document.body.setAttribute("data-phase", phase);
  }

  function setError(node, message) {
    if (!node) return;
    node.textContent = message || "";
  }

  function setFixtureStatus(message) {
    if (els.fixtureStatus) els.fixtureStatus.textContent = message;
  }

  function show(node, shouldShow) {
    if (!node) return;
    node.hidden = !shouldShow;
  }

  function resetSession() {
    state.phase = "writing-first";
    state.firstExpression = "";
    state.secondExpression = "";
    state.segments = [];
    state.selectedIndex = -1;
    state.selectedSentence = "";
    state.secondStarted = false;

    els.firstExpressionInput.value = "";
    els.secondExpressionInput.value = "";
    els.firstExpressionPassage.replaceChildren();
    els.chosenSentenceText.textContent = "";
    els.artifactSelected.textContent = "";
    els.artifactFollowed.textContent = "";
    els.artifactResult.textContent = "";
    setError(els.firstExpressionError, "");
    setError(els.secondExpressionError, "");
    els.selectionStatus.textContent = "Sentences are now selectable in the original passage.";

    show(els.firstWritingBlock, true);
    show(els.settledExpressionBlock, false);
    show(els.flagsBuffer, false);
    show(els.reshapeArea, false);
    show(els.artifactBlock, false);
    setPhase("writing-first");
    els.firstExpressionInput.focus();
  }

  function applySession(session) {
    state.session = session;
    var selectionStep = findStep("selection");
    var movementStep = findStep("movement");

    if (els.openerText && session.opener && session.opener.text) {
      els.openerText.textContent = session.opener.text;
    }
    if (els.encounterInstruction && selectionStep && selectionStep.instruction) {
      els.encounterInstruction.textContent = selectionStep.instruction;
    }
    if (els.movementInstruction && movementStep && movementStep.instruction) {
      els.movementInstruction.textContent = movementStep.instruction;
    }
    setFixtureStatus("Loaded " + session.id + " from the shared platform-neutral fixture.");
    resetSession();
  }

  function sentenceLabel(segment, index) {
    var prefix = state.selectedIndex === index ? "Selected sentence: " : "Select sentence: ";
    return prefix + segment.text;
  }

  function renderPassage() {
    var source = state.firstExpression;
    var passage = els.firstExpressionPassage;
    var cursor = 0;
    passage.replaceChildren();

    state.segments.forEach(function (segment, index) {
      if (segment.start > cursor) {
        passage.appendChild(document.createTextNode(source.slice(cursor, segment.start)));
      }

      var button = document.createElement("button");
      button.type = "button";
      button.className = "sentence-choice";
      button.textContent = segment.text;
      button.dataset.index = String(index);
      button.setAttribute("aria-pressed", state.selectedIndex === index ? "true" : "false");
      button.setAttribute("aria-label", sentenceLabel(segment, index));
      if (state.selectedIndex === index) {
        button.dataset.selected = "true";
      }
      if (state.secondStarted) {
        button.setAttribute("aria-disabled", "true");
      }
      passage.appendChild(button);
      cursor = segment.end;
    });

    if (cursor < source.length) {
      passage.appendChild(document.createTextNode(source.slice(cursor)));
    }
  }

  function settleFirstExpression() {
    var value = els.firstExpressionInput.value;
    if (!value.trim()) {
      setError(els.firstExpressionError, "Write a first expression before settling it.");
      els.firstExpressionInput.focus();
      return;
    }

    state.firstExpression = value;
    state.segments = segmentSentencesExact(value);
    if (!state.segments.length) {
      setError(els.firstExpressionError, "Write at least one sentence or phrase before continuing.");
      els.firstExpressionInput.focus();
      return;
    }

    setError(els.firstExpressionError, "");
    show(els.firstWritingBlock, false);
    show(els.settledExpressionBlock, true);
    show(els.flagsBuffer, true);
    setPhase("selecting");
    renderPassage();

    var firstSentence = els.firstExpressionPassage.querySelector(".sentence-choice");
    if (firstSentence) firstSentence.focus();
  }

  function commitSelection(index) {
    if (state.secondStarted) {
      els.selectionStatus.textContent = "Selection is held while the second expression is underway.";
      return;
    }

    var segment = state.segments[index];
    if (!segment) return;

    state.selectedIndex = index;
    state.selectedSentence = segment.text;
    els.chosenSentenceText.textContent = segment.text;
    els.selectionStatus.textContent = "Selected sentence committed in context.";
    show(els.reshapeArea, true);
    setPhase("shaping");
    renderPassage();
    els.secondExpressionInput.focus();
  }

  function finishSession() {
    var value = els.secondExpressionInput.value;
    if (!value.trim()) {
      setError(els.secondExpressionError, "Write what followed before finishing the session.");
      els.secondExpressionInput.focus();
      return;
    }

    state.secondExpression = value;
    setError(els.secondExpressionError, "");
    els.artifactSelected.textContent = state.selectedSentence;
    els.artifactFollowed.textContent = value;
    els.artifactResult.textContent = "The selected sentence became the source for the second response.";
    show(els.artifactBlock, true);
    setPhase("artifact");
    els.artifactBlock.focus && els.artifactBlock.focus();
  }

  function bindEvents() {
    els.settleExpressionBtn.addEventListener("click", settleFirstExpression);
    els.firstExpressionInput.addEventListener("input", function () {
      if (els.firstExpressionInput.value.trim()) setError(els.firstExpressionError, "");
    });

    els.firstExpressionPassage.addEventListener("click", function (event) {
      var target = event.target.closest(".sentence-choice");
      if (!target) return;
      commitSelection(Number(target.dataset.index));
    });

    els.firstExpressionPassage.addEventListener("keydown", function (event) {
      var target = event.target.closest(".sentence-choice");
      if (!target) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        commitSelection(Number(target.dataset.index));
      }
    });

    els.secondExpressionInput.addEventListener("input", function () {
      var hasText = !!els.secondExpressionInput.value.trim();
      if (hasText && !state.secondStarted) {
        state.secondStarted = true;
        renderPassage();
      }
      if (hasText) setError(els.secondExpressionError, "");
    });

    els.finishSessionBtn.addEventListener("click", finishSession);
    els.restartBtn.addEventListener("click", resetSession);
  }

  bindEvents();
  setPhase("loading");

  fetch(fixturePath)
    .then(function (response) {
      if (!response.ok) throw new Error("Unable to load shared fixture.");
      return response.json();
    })
    .then(function (sessions) {
      var certaintySession = Array.isArray(sessions)
        ? sessions.find(function (session) {
            return session.id === "certainty-memory-01";
          })
        : null;
      if (!certaintySession) throw new Error("Certainty session missing.");
      applySession(certaintySession);
    })
    .catch(function () {
      setFixtureStatus("Shared fixture could not be loaded in this preview.");
      setPhase("unavailable");
    });
})();

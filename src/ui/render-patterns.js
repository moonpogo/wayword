(function () {
  function patternsMirrorHeroEmptyHtml() {
    return (
      '<div class="patterns-mirror-hero patterns-mirror-hero--empty">' +
      '<p class="patterns-mirror-empty">No cross-run pattern has surfaced yet.</p>' +
      "</div>"
    );
  }

  function patternsMirrorHeroInsufficientRunsHtml() {
    return (
      '<div class="patterns-mirror-hero patterns-mirror-hero--empty patterns-mirror-hero--empty-insufficient">' +
      '<p class="patterns-mirror-empty">Three qualifying saved drafts are needed before patterns can surface.</p>' +
      "</div>"
    );
  }

  function patternsMirrorHeroNoStrongPatternHtml() {
    return (
      '<div class="patterns-mirror-hero patterns-mirror-hero--empty patterns-mirror-hero--empty-no-strong">' +
      '<p class="patterns-mirror-empty">Enough drafts are saved, but no pattern has repeated clearly.</p>' +
      "</div>"
    );
  }

  /**
   * Patterns hero: digest-backed profile line + promoted reflection cards, or a quiet empty state.
   * Returns `null` only when the mirror bundle does not expose `getPatternsProfileFromDigests` (legacy builds).
   */
  function buildPatternsMirrorHeroHtml(digests) {
    if (!window.waywordMirrorController.mirrorPatternsProfileAvailable()) {
      return null;
    }
    let result;
    try {
      result = window.waywordMirrorController.getPatternsProfileFromDigests(digests);
    } catch (_) {
      return patternsMirrorHeroEmptyHtml();
    }
    if (!result || typeof result !== "object") {
      return patternsMirrorHeroEmptyHtml();
    }

    const promoted = Array.isArray(result.promotedPatterns) ? result.promotedPatterns : [];
    const profile = result.profile != null ? String(result.profile).trim() : "";
    const emptyState = result.patternsEmptyState != null ? String(result.patternsEmptyState) : "";

    if (promoted.length > 0) {
      const parts = ['<div class="patterns-mirror-hero">'];
      if (profile) {
        parts.push(`<p class="patterns-mirror-profile">${escapeHtml(profile)}</p>`);
      }
      parts.push('<div class="mirror-stack mirror-stack--patterns-promoted mirror-stack--support-only">');
      promoted.slice(0, 3).forEach((card, i) => {
        if (!card || !String(card.statement || "").trim()) return;
        parts.push(
          mirrorReflectionCardHtml(
            { statement: card.statement },
            {
              role: "support",
              firstSupportInSupportOnlyStack: i === 0,
            }
          )
        );
      });
      parts.push("</div></div>");
      return parts.join("");
    }

    if (emptyState === "insufficient_runs") {
      return patternsMirrorHeroInsufficientRunsHtml();
    }
    if (emptyState === "no_strong_pattern") {
      return patternsMirrorHeroNoStrongPatternHtml();
    }

    return patternsMirrorHeroEmptyHtml();
  }

  function buildChallengeCopy(words) {
    if (!words.length) return "";
    if (words.length === 1) {
      return `Start one run without using the word <strong>${escapeHtml(words[0])}</strong>.`;
    }
    const wordsText = words.map((word) => `<strong>${escapeHtml(word)}</strong>`).join(", ");
    return `Start one run without using these words: ${wordsText}.`;
  }

  function buildPatternCallouts(agg, avgUniqueRatio, avgFiller, topWords, topStarters, completedChallenges) {
    if (
      topWords[0] &&
      topWords[0][1] >= 4 &&
      !completedChallenges.has(topWords[0][0])
    ) {
      return {
        headline: "Repetition reads as one of the clearest signals here.",
        support: `Most repeated word across saved drafts: "${topWords[0][0]}".`,
        direction: "",
        suggestedExerciseWord: topWords[0][0],
      };
    }

    if (topStarters[0] && topStarters[0][1] >= 3) {
      return {
        headline: "Sentence openings cluster on the same start.",
        support: `Most common opening across saved drafts: "${topStarters[0][0]}".`,
        direction: "Shift how sentences open before rewriting what they carry.",
        suggestedExerciseWord: "",
      };
    }

    if (avgFiller > 2) {
      return {
        headline: "Filler pads the motion.",
        support: "Movement shows on the page, but softeners carry part of it.",
        direction: "Try a tighter run and let pause surface the next word.",
        suggestedExerciseWord: "",
      };
    }

    if (avgUniqueRatio > 0.72) {
      return {
        headline: "Vocabulary spread stays wide.",
        support: "The palette runs broad.",
        direction: "Watch whether variety sharpens or hides repetition.",
        suggestedExerciseWord: "",
      };
    }

    return {
      headline: "Not much to echo back yet.",
      support: "Enough to continue—little saved material for a sharp cross-run read.",
      direction: "More saved drafts deepen cross-run reflection.",
      suggestedExerciseWord: "",
    };
  }

  function buildProfileLockedPanelInnerHtml(remaining, runs) {
    return `
    <div class="profile-locked">
      <div class="profile-locked-title">Almost there</div>
      <div class="profile-locked-copy">Save ${remaining} more ${remaining === 1 ? "run" : "runs"} to open reflection across saved drafts here.</div>
      <div class="profile-locked-copy">${runs} of ${window.waywordConfig.CALIBRATION_THRESHOLD} saved.</div>
    </div>
  `;
  }

  function buildPatternCalloutsLegacySectionHtml(calloutsWithStarters) {
    return `
      <div class="history-item"><strong>${calloutsWithStarters.headline}</strong></div>
      <div class="history-item">${calloutsWithStarters.support}</div>
      ${calloutsWithStarters.direction ? `<div class="history-item">${calloutsWithStarters.direction}</div>` : ""}
    `;
  }

  function patternsSanitizeWordPairs(topWords) {
    const g = window.waywordPatternsLexicalGate;
    if (!g || typeof g.lexemeOk !== "function") return [];
    return topWords.filter((pair) => g.lexemeOk(pair[0]));
  }

  function patternsSanitizeChallengeWords(draftChallengeWords, wordPairs) {
    const shownWords = new Set(wordPairs.map((p) => p[0]));
    return draftChallengeWords.filter((w) => shownWords.has(w));
  }

  function buildPatternsRepeatedChallengeRootInnerHtml({ topWords, selectedChallengeSet, draftChallengeWords }) {
    const gatedPairs = patternsSanitizeWordPairs(Array.isArray(topWords) ? topWords : []);
    const countBy = new Map(gatedPairs.map((p) => [p[0], p[1]]));
    const safeDraft = patternsSanitizeChallengeWords(
      Array.isArray(draftChallengeWords) ? draftChallengeWords : [],
      gatedPairs
    );

    const wordsHtml = gatedPairs.length
      ? `<div class="patterns-word-map">
          ${gatedPairs
            .map(([w, c]) => {
              const sel = selectedChallengeSet.has(w);
              const fs = (12.25 + Math.min(c * 0.42, 3.25)).toFixed(2);
              return `
            <button
              type="button"
              class="patterns-word-chip ${sel ? "is-selected" : ""}"
              data-challenge-word="${escapeHtml(w)}"
              aria-pressed="${sel ? "true" : "false"}"
              style="font-size:${fs}px"
            >${escapeHtml(w)}</button>`;
            })
            .join("")}
         </div>`
      : `<p class="patterns-repeated-empty">No strong repeat targets across saved runs yet.</p>`;

    const challengeHtml = safeDraft.length
      ? `<div class="patterns-challenge-block">
          <div class="patterns-challenge-label">Challenge from your repeats</div>
          <div class="challenge-copy">${buildChallengeCopy(safeDraft)}</div>
          <button id="startExerciseBtn" class="exercise-btn" type="button">
            <span class="exercise-dot"></span>
            Begin challenge
          </button>
        </div>`
      : gatedPairs.length
        ? `<p class="patterns-challenge-hint">Tap a word above to try leaving it out for one run.</p>`
        : "";

    return `
      <div class="section-title card-section-title patterns-repeated-challenge__title">Repeated words</div>
      <p class="patterns-repeated-tool-note">Saved-run word counts — for choosing a practice challenge below.</p>
      ${wordsHtml}
      ${challengeHtml}
    `;
  }

  window.waywordPatternsRenderer = {
    patternsMirrorHeroEmptyHtml,
    patternsMirrorHeroInsufficientRunsHtml,
    patternsMirrorHeroNoStrongPatternHtml,
    buildPatternsMirrorHeroHtml,
    buildChallengeCopy,
    buildPatternCallouts,
    buildProfileLockedPanelInnerHtml,
    buildPatternCalloutsLegacySectionHtml,
    buildPatternsRepeatedChallengeRootInnerHtml,
  };
})();

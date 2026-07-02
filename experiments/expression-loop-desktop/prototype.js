(function () {
  "use strict";

  var fixturePath = "/docs/product/expression-loop-prototype-sessions.json";
  var fixtureStatus = document.getElementById("fixtureStatus");
  var openerText = document.getElementById("openerText");
  var movementText = document.getElementById("movementText");

  function findStep(session, type) {
    if (!session || !Array.isArray(session.steps)) return null;
    return session.steps.find(function (step) {
      return step.type === type;
    }) || null;
  }

  function applySession(session) {
    if (!session) return;
    if (openerText && session.opener && session.opener.text) {
      openerText.textContent = session.opener.text;
    }

    var movement = findStep(session, "movement");
    if (movementText && movement && movement.instruction) {
      movementText.textContent = movement.instruction;
    }

    if (fixtureStatus) {
      fixtureStatus.textContent = "Loaded " + session.id + " from the shared platform-neutral fixture.";
    }
  }

  fetch(fixturePath)
    .then(function (response) {
      if (!response.ok) throw new Error("Unable to load shared fixture.");
      return response.json();
    })
    .then(function (sessions) {
      applySession(Array.isArray(sessions) ? sessions[0] : null);
    })
    .catch(function () {
      if (fixtureStatus) {
        fixtureStatus.textContent = "Shared fixture could not be loaded in this preview.";
      }
    });
})();

(function () {
  function toggleRecentEntry(entry) {
    var expanded = entry.querySelector(".recent-entry-expanded");
    if (!expanded) return;

    var isOpen = entry.classList.contains("is-open");
    document.querySelectorAll(".recent-entry.is-open").forEach(function (el) {
      if (el === entry) return;
      el.classList.remove("is-open");
      el.classList.remove("recent-entry--active");
      el.setAttribute("aria-expanded", "false");
      var other = el.querySelector(".recent-entry-expanded");
      if (other) other.hidden = true;
    });

    entry.classList.toggle("is-open", !isOpen);
    entry.classList.toggle("recent-entry--active", !isOpen);
    expanded.hidden = isOpen;
    entry.setAttribute("aria-expanded", String(!isOpen));
  }

  function bindRecentRunsSurfaceInteractions(input) {
    if (!input || !input.list) return;
    var list = input.list;
    if (list.dataset.recentEntryInteractionsBound === "1") return;
    list.dataset.recentEntryInteractionsBound = "1";

    list.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var activeEl = document.activeElement;
      if (!activeEl || !activeEl.classList.contains("recent-entry") || !list.contains(activeEl)) return;
      e.preventDefault();
      toggleRecentEntry(activeEl);
    });

    list.addEventListener("click", function (e) {
      var origin = input.domEventTargetElement ? input.domEventTargetElement(e) : e.target;
      if (!origin || !origin.closest) return;
      var entry = origin.closest(".recent-entry");
      if (!entry) return;
      if (origin.closest("button, a")) return;
      toggleRecentEntry(entry);
    });
  }

  window.waywordRecentRunsInteraction = {
    toggleRecentEntry: toggleRecentEntry,
    bindRecentRunsSurfaceInteractions: bindRecentRunsSurfaceInteractions,
  };
})();

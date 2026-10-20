// Descubrir tabs: one section at a time, keyboard friendly.
const TABS = ["foryou", "moods", "duo", "zone"];
let ready = false;

export function activateDiscoverTab(name) {
  const active = TABS.includes(name) ? name : "foryou";
  document.querySelectorAll("[data-discover-tab]").forEach((button) => {
    const selected = button.dataset.discoverTab === active;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  document.querySelectorAll("[data-discover-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.discoverPanel !== active;
  });
  return active;
}

export function initializeDiscoverTabs() {
  if (ready) return;
  const buttons = [...document.querySelectorAll("[data-discover-tab]")];
  if (!buttons.length) return;
  ready = true;
  buttons.forEach((button, index) => {
    button.addEventListener("click", () => activateDiscoverTab(button.dataset.discoverTab));
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const step = event.key === "ArrowRight" ? 1 : -1;
      const target = buttons[(index + step + buttons.length) % buttons.length];
      activateDiscoverTab(target.dataset.discoverTab);
      target.focus();
    });
  });
  activateDiscoverTab("foryou");
}

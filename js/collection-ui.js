const STORAGE_KEY = "heartagram:collection-tab";
const VALID_TABS = new Set(["interested", "owned"]);

export function normalizeCollectionTab(value) {
  return VALID_TABS.has(value) ? value : "interested";
}

export function readCollectionTab(storage = window.localStorage) {
  try {
    return normalizeCollectionTab(storage.getItem(STORAGE_KEY));
  } catch {
    return "interested";
  }
}

export function writeCollectionTab(value, storage = window.localStorage) {
  const normalized = normalizeCollectionTab(value);
  try {
    storage.setItem(STORAGE_KEY, normalized);
  } catch {
    // The segmented view still works when storage is unavailable.
  }
  return normalized;
}

export function countCollectionItems({
  interestedCuratedGames = [],
  interestedCatalogGames = [],
  ownedCuratedGames = [],
  ownedCatalogGames = [],
} = {}) {
  return {
    interested: interestedCuratedGames.length + interestedCatalogGames.length,
    owned: ownedCuratedGames.length + ownedCatalogGames.length,
  };
}

export function applyCollectionTab(value) {
  const active = normalizeCollectionTab(value);

  document.querySelectorAll("[data-collection-tab]").forEach((button) => {
    const selected = button.dataset.collectionTab === active;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });

  document.querySelectorAll("[data-collection-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.collectionPanel !== active;
  });

  return active;
}

export function initializeCollectionUI() {
  const buttons = [...document.querySelectorAll("[data-collection-tab]")];
  if (!buttons.length) return;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const active = writeCollectionTab(button.dataset.collectionTab);
      applyCollectionTab(active);
    });
  });

  window.addEventListener("heartagram:collection-rendered", (event) => {
    const counts = event.detail?.counts ?? { interested: 0, owned: 0 };
    const interestedCount = document.getElementById("collection-interested-count");
    const ownedCount = document.getElementById("collection-owned-count");

    if (interestedCount) interestedCount.textContent = String(counts.interested);
    if (ownedCount) ownedCount.textContent = String(counts.owned);

    applyCollectionTab(readCollectionTab());
  });

  applyCollectionTab(readCollectionTab());
}

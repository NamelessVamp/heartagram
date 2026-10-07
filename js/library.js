// Manages Adri's owned-game library in localStorage.
// IDs may belong to curated games or use the igdb:<id> format.

const STORAGE_KEY = "heartagram:library";

function normalizeIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value.filter((id) => typeof id === "string" && id.trim().length > 0),
    ),
  ];
}

function readLibrary() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");

    return normalizeIds(stored);
  } catch {
    return [];
  }
}

function writeLibrary(ids) {
  const normalized = normalizeIds(ids);

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));

  return normalized;
}

function notifyLibraryChanged(ids, changedId) {
  window.dispatchEvent(
    new CustomEvent("heartagram:library-changed", {
      detail: {
        ids,
        changedId,
      },
    }),
  );
}

export function getOwnedGameIds() {
  return readLibrary();
}

export function isOwnedGame(gameId) {
  return readLibrary().includes(gameId);
}

export function setOwnedGame(gameId, owned) {
  if (typeof gameId !== "string" || !gameId.trim()) {
    return false;
  }

  const library = readLibrary();

  const next = owned
    ? [...library, gameId]
    : library.filter((id) => id !== gameId);

  const saved = writeLibrary(next);

  notifyLibraryChanged(saved, gameId);

  return saved.includes(gameId);
}

export function toggleOwnedGame(gameId) {
  return setOwnedGame(gameId, !isOwnedGame(gameId));
}

export function clearLibrary() {
  const saved = writeLibrary([]);

  notifyLibraryChanged(saved, null);
}

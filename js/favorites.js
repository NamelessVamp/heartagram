// Manages Adri's wishlist in localStorage.
// The data remains on the device and is never sent anywhere.

const STORAGE_KEY = "heartagram:favorites";

// Keeps the session working when storage is full or blocked (private mode).
let memoryFavorites = null;

function readFavorites() {
  if (memoryFavorites) return memoryFavorites;

  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");

    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function writeFavorites(ids) {
  const unique = [...new Set(ids)];

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
    memoryFavorites = null;
  } catch {
    memoryFavorites = unique;
  }
}

export function getFavoriteIds() {
  return readFavorites();
}

export function isFavorite(gameId) {
  return readFavorites().includes(gameId);
}

export function toggleFavorite(gameId) {
  const favorites = readFavorites();

  const next = favorites.includes(gameId)
    ? favorites.filter((id) => id !== gameId)
    : [...favorites, gameId];

  writeFavorites(next);

  window.dispatchEvent(
    new CustomEvent("heartagram:favorites-changed", {
      detail: {
        ids: next,
        changedId: gameId,
      },
    }),
  );

  return next.includes(gameId);
}

export function clearFavorites() {
  writeFavorites([]);

  window.dispatchEvent(
    new CustomEvent("heartagram:favorites-changed", {
      detail: {
        ids: [],
        changedId: null,
      },
    }),
  );
}

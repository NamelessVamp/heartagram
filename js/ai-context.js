// Builds the minimum local context required by HEARTAGRAM AI.
// This module does not call external services or read localStorage directly.

const MAX_MESSAGE_LENGTH = 600;

function normalizeIds(value) {
  if (!Array.isArray(value)) return [];

  return [
    ...new Set(
      value
        .filter((id) => typeof id === "string")
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ];
}

function sanitizeMessage(value) {
  if (typeof value !== "string") return "";

  return value.trim().slice(0, MAX_MESSAGE_LENGTH);
}

function sanitizeProfile(profile) {
  if (!profile || typeof profile !== "object") return null;

  const archetypes = profile.archetypes;

  if (!archetypes || typeof archetypes !== "object") return null;

  return {
    primary:
      typeof archetypes.primary === "string" ? archetypes.primary : null,
    secondary:
      typeof archetypes.secondary === "string" ? archetypes.secondary : null,
    horrorTolerance:
      Number.isFinite(profile.horrorTolerance)
        ? profile.horrorTolerance
        : null,
    couplePreference:
      typeof profile.couplePref === "string" ? profile.couplePref : null,
    vector:
      profile.vector && typeof profile.vector === "object"
        ? { ...profile.vector }
        : {},
  };
}

function intiLibraryIds(games) {
  if (!Array.isArray(games)) return [];

  return games
    .filter(
      (game) =>
        typeof game?.id === "string" &&
        Array.isArray(game.couple) &&
        game.couple.includes("INTI_LIBRARY_MATCH"),
    )
    .map((game) => game.id);
}

export function buildAIContext({
  profile = null,
  favoriteIds = [],
  ownedIds = [],
  games = [],
  message = "",
} = {}) {
  const normalizedOwnedIds = normalizeIds(ownedIds);
  const ownedSet = new Set(normalizedOwnedIds);

  const interestedGameIds = normalizeIds(favoriteIds).filter(
    (id) => !ownedSet.has(id),
  );

  return {
    schemaVersion: 1,
    profile: sanitizeProfile(profile),
    interestedGameIds,
    ownedGameIds: normalizedOwnedIds,
    intiLibraryGameIds: intiLibraryIds(games),
    message: sanitizeMessage(message),
  };
}

export { MAX_MESSAGE_LENGTH };

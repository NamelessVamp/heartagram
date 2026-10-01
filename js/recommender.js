// Ranks verified games against a player profile.
// Pure functions only: no DOM access.

import { DIMENSIONS } from "./profile.js";

const WEIGHTS = {
  ARCHETYPE_PRIMARY_BONUS: 0.10,
  ARCHETYPE_SECONDARY_BONUS: 0.05,
  VIBES_BONUS: 0.10,
  VIBES_BONUS_CAP: 0.20,
  HORROR_PENALTY_PER_LEVEL: 0.25,
  COUPLE_PREF_BONUS: 0.05,
};

const SECTION_LIMITS = { FOR_YOU: 3, MIGHT_HOOK: 7 };

// Social is half-weighted here because co-op has its own section (buildDuo).
// Without this, liking multiplayer pushes great solo games out of the top 3.
const DIMENSION_WEIGHTS = { social: 0.5 };

function toArray(vector) {
  return DIMENSIONS.map((d) => (vector[d] ?? 0) * (DIMENSION_WEIGHTS[d] ?? 1));
}

function cosine(a, b) {
  const dot = a.reduce((sum, value, i) => sum + value * b[i], 0);
  const normA = Math.hypot(...a);
  const normB = Math.hypot(...b);
  return normA === 0 || normB === 0 ? 0 : dot / (normA * normB);
}

export function scoreGame(profile, game) {
  let score = cosine(toArray(profile.vector), toArray(game.vector));

  if (game.personality.includes(profile.archetypes.primary)) score += WEIGHTS.ARCHETYPE_PRIMARY_BONUS;
  if (game.personality.includes(profile.archetypes.secondary)) score += WEIGHTS.ARCHETYPE_SECONDARY_BONUS;

  const sharedVibes = game.vibes.filter((v) => profile.vibes.includes(v)).length;
  score += Math.min(sharedVibes * WEIGHTS.VIBES_BONUS, WEIGHTS.VIBES_BONUS_CAP);

  // Penalized, not removed: a curious player can still discover it further down.
  const excessHorror = game.horror_level - profile.horrorTolerance;
  if (excessHorror > 0) score -= excessHorror * WEIGHTS.HORROR_PENALTY_PER_LEVEL;

  return score;
}

export function rankGames(profile, games) {
  return games
    .filter((game) => game.status === "VERIFICADO")
    .map((game) => ({ game, score: scoreGame(profile, game) }))
    .sort((a, b) => b.score - a.score);
}

/** Picks a strong game from the opposite side of the user's mood axis. */
function pickOutOfZone(profile, ranked, excludedIds) {
  const userMood = profile.vector.mood || ranked[0]?.game.vector.mood || 0;
  const opposite = (game) => Math.sign(game.vector.mood) === -Math.sign(userMood) && userMood !== 0;
  return ranked.find(({ game }) => !excludedIds.has(game.id) && opposite(game)) ?? null;
}

export function buildSections(profile, ranked) {
  const forYou = ranked.slice(0, SECTION_LIMITS.FOR_YOU);
  const mightHook = ranked.slice(SECTION_LIMITS.FOR_YOU, SECTION_LIMITS.MIGHT_HOOK);
  const shown = new Set([...forYou, ...mightHook].map(({ game }) => game.id));
  return { forYou, mightHook, outOfZone: pickOutOfZone(profile, ranked, shown) };
}

export function duoBadges(game) {
  const m = game.multiplayer;
  const badges = [];
  if (m.online_coop === true || m.online_versus === true) badges.push("ONLINE");
  if (m.local_wireless === true) badges.push("MISMO CUARTO");
  if (m.same_console === true) badges.push("UNA CONSOLA");
  return badges;
}

/**
 * Games for playing together. Order: Inti already owns it, then games that
 * work both remotely and in person, then profile score.
 */
export function buildDuo(profile, ranked) {
  return ranked
    .map(({ game, score }) => {
      const badges = duoBadges(game);
      const bonus = game.couple.includes(profile.couplePref) ? WEIGHTS.COUPLE_PREF_BONUS : 0;
      return { game, score: score + bonus, badges };
    })
    .filter(({ badges }) => badges.length > 0)
    .sort((a, b) => {
      const owned = Number(b.game.couple.includes("INTI_LIBRARY_MATCH")) - Number(a.game.couple.includes("INTI_LIBRARY_MATCH"));
      const bothWays = (x) => Number(x.badges.includes("ONLINE") && x.badges.length > 1);
      return owned || bothWays(b) - bothWays(a) || b.score - a.score;
    });
}

// Scores a game against a player profile. recommend-v2.js builds the
// sections on top of these helpers. Pure functions only: no DOM access.

import { DIMENSIONS } from "./profile.js";

const WEIGHTS = {
  ARCHETYPE_PRIMARY_BONUS: 0.10,
  ARCHETYPE_SECONDARY_BONUS: 0.05,
  VIBES_BONUS: 0.10,
  VIBES_BONUS_CAP: 0.20,
  HORROR_PENALTY_PER_LEVEL: 0.25,
};

// Social is half-weighted here because co-op has its own section (the duo).
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

export function duoBadges(game) {
  const m = game.multiplayer;
  const badges = [];
  if (m.online_coop === true || m.online_versus === true) badges.push("ONLINE");
  if (m.local_wireless === true) badges.push("MISMO CUARTO");
  if (m.same_console === true) badges.push("UNA CONSOLA");
  return badges;
}

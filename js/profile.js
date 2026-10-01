// Turns quiz answers into a player profile: a 6-dimension vector,
// ranked archetypes and the special fields used by the recommender.

export const DIMENSIONS = ["pace", "social", "structure", "session", "mood", "challenge"];

const ARCHETYPE_ORDER = [
  "EXPLORER", "COMPETITOR", "COLLECTOR", "CREATOR",
  "SURVIVOR", "STRATEGIST", "STORY_SEEKER", "HORROR_FAN",
];

const DEFAULT_HORROR_TOLERANCE = 1;

/**
 * Per-dimension bounds reachable through the quiz.
 * Needed so every dimension normalizes to the same -2..+2 scale,
 * regardless of how many questions touch it.
 */
function dimensionBounds(questions) {
  const bounds = Object.fromEntries(DIMENSIONS.map((d) => [d, { max: 0, min: 0 }]));
  for (const question of questions) {
    for (const dim of DIMENSIONS) {
      const values = question.options.map((o) => o.dims[dim] ?? 0);
      bounds[dim].max += Math.max(0, ...values);
      bounds[dim].min += Math.min(0, ...values);
    }
  }
  return bounds;
}

function normalize(sum, bound) {
  if (sum >= 0) return bound.max === 0 ? 0 : (2 * sum) / bound.max;
  return bound.min === 0 ? 0 : (2 * sum) / Math.abs(bound.min);
}

function rankArchetypes(scores, support) {
  return ARCHETYPE_ORDER
    .map((id) => ({ id, score: scores[id] ?? 0, support: support[id] ?? 0 }))
    .sort((a, b) => b.score - a.score || b.support - a.support);
}

/**
 * @param {Array} questions  parsed questions.json
 * @param {Object} answers   { q1: "a", q2: "c", ... }
 */
export function computeProfile(questions, answers) {
  const sums = Object.fromEntries(DIMENSIONS.map((d) => [d, 0]));
  const archScores = {};
  const archSupport = {};
  const vibes = new Set();
  let horrorTolerance = DEFAULT_HORROR_TOLERANCE;
  let couplePref = null;

  for (const question of questions) {
    const option = question.options.find((o) => o.id === answers[question.id]);
    if (!option) throw new Error(`Missing answer for ${question.id}`);

    for (const [dim, value] of Object.entries(option.dims)) sums[dim] += value;
    for (const [arch, value] of Object.entries(option.arch)) {
      archScores[arch] = (archScores[arch] ?? 0) + value;
      archSupport[arch] = (archSupport[arch] ?? 0) + 1;
    }
    option.vibes.forEach((v) => vibes.add(v));

    if (question.special === "horror_tolerance") horrorTolerance = option.value;
    if (question.special === "couple_pref") couplePref = option.couple;
  }

  const bounds = dimensionBounds(questions);
  const vector = Object.fromEntries(DIMENSIONS.map((d) => [d, normalize(sums[d], bounds[d])]));

  const ranking = rankArchetypes(archScores, archSupport);
  const [first, second] = ranking;
  const tiedPrimary = first.score === second.score && first.support === second.support;

  return {
    vector,
    archetypes: { primary: first.id, secondary: second.id, tiedPrimary, ranking },
    horrorTolerance,
    couplePref,
    vibes: [...vibes],
  };
}

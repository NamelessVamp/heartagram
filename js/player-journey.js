// HEARTAGRAM Player Journey helpers.
export const PLAYER_DIMENSIONS = ["pace", "social", "structure", "session", "mood", "challenge"];

export const PLAYER_DIMENSION_LABELS = {
  pace: "Ritmo",
  social: "Social",
  structure: "Libertad",
  session: "Sesiones",
  mood: "Oscuridad",
  challenge: "Reto",
};

export function normalizedTraitPercent(value) {
  const safe = Math.max(-2, Math.min(2, Number(value) || 0));
  return Math.round(((safe + 2) / 4) * 100);
}

export function traitSignal(value) {
  const score = Number(value) || 0;
  if (score >= 0.45) return "ALTO";
  if (score <= -0.45) return "BAJO";
  return "MEDIO";
}

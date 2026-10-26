// Shared catalog labels. No DOM dependencies.

// Nintendo Store genres and ways to play already arrive in Spanish; only the
// product types need a label.
const CATALOG_LABELS_ES = {
  game: "Juego",
  bundle: "Paquete",
  dlc: "Contenido descargable",
  demo: "Demo",
  upgrade_pack: "Paquete de mejora",
};

export function catalogLabel(value) {
  return CATALOG_LABELS_ES[value] ?? value;
}

// Curated games use tags like OPEN_WORLD; this turns them into readable Spanish.
const CURATED_GENRES_ES = {
  ACTION: "Acción", ADVENTURE: "Aventura", CARD: "Cartas", COZY: "Tranquilo",
  CREATIVE: "Creativo", FIGHTING: "Lucha", HORROR: "Terror", LIFE_SIM: "Simulación de vida",
  METROIDVANIA: "Metroidvania", MYSTERY: "Misterio", NARRATIVE: "Narrativo",
  OPEN_WORLD: "Mundo abierto", PARTY: "Fiesta", PLATFORMER: "Plataformas",
  PUZZLE: "Puzles", RACING: "Carreras", RHYTHM: "Ritmo", ROGUELIKE: "Roguelike",
  RPG: "Rol", SANDBOX: "Sandbox", SHOOTER: "Disparos", SIMULATION: "Simulación",
  SPORTS: "Deportes", STEALTH: "Sigilo", STRATEGY: "Estrategia", SURVIVAL: "Supervivencia",
  TACTICS: "Táctica",
};

export function curatedGenreLabel(value) {
  const key = String(value ?? "").trim().toUpperCase();
  if (!key) return "";
  if (CURATED_GENRES_ES[key]) return CURATED_GENRES_ES[key];
  const words = key.replace(/_/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

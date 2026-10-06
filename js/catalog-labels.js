// Shared catalog labels and date formatting. No DOM dependencies.

const CATALOG_LABELS_ES = {
  // Genres.
  "Point-and-click": "Apuntar y hacer clic",
  Fighting: "Lucha",
  Shooter: "Disparos",
  Music: "Música",
  Platform: "Plataformas",
  Puzzle: "Rompecabezas",
  Racing: "Carreras",
  "Real Time Strategy (RTS)": "Estrategia en tiempo real",
  "Role-playing (RPG)": "Rol",
  Simulator: "Simulación",
  Sport: "Deportes",
  Strategy: "Estrategia",
  "Turn-based strategy (TBS)": "Estrategia por turnos",
  Tactical: "Táctico",
  "Hack and slash/Beat 'em up": "Combate y acción",
  Quiz: "Preguntas",
  "Quiz/Trivia": "Preguntas",
  Pinball: "Pinball",
  Adventure: "Aventura",
  Indie: "Independiente",
  Arcade: "Arcade",
  "Visual Novel": "Novela visual",
  "Card & Board Game": "Cartas y juegos de mesa",
  MOBA: "MOBA",

  // Game modes.
  "Single player": "Un jugador",
  Multiplayer: "Multijugador",
  "Co-operative": "Cooperativo",
  "Split screen": "Pantalla dividida",
  "Massively Multiplayer Online (MMO)": "Multijugador masivo en línea",
  "Battle Royale": "Battle royale",

  // Game types.
  "Main Game": "Juego principal",
  "Standalone Expansion": "Expansión independiente",
  "Expanded Game": "Edición ampliada",
  Remake: "Remake",
  Remaster: "Remasterización",
  Port: "Adaptación",
};

export function catalogLabel(value) {
  return CATALOG_LABELS_ES[value] ?? value;
}

export function formatCatalogDate(value) {
  if (typeof value !== "string" || !value.trim()) {
    return "Por confirmar";
  }

  const raw = value.trim();

  // Preserve year-only dates without inventing a month or day.
  if (/^\d{4}$/.test(raw)) {
    return raw;
  }

  // Only format complete ISO calendar dates.
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);

  if (!match) {
    return raw;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);

  // Reject invalid dates instead of silently rolling them forward.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return raw;
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}


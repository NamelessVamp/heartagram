// Local fallback for HEARTAGRAM AI.
// No network calls are made here. Responses use only the supplied context.

function gameMap(games) {
  return new Map(
    (Array.isArray(games) ? games : [])
      .filter((game) => typeof game?.id === "string")
      .map((game) => [game.id, game]),
  );
}

function titlesFor(ids, gamesById, limit = 3) {
  return ids
    .map((id) => gamesById.get(id)?.title ?? null)
    .filter(Boolean)
    .slice(0, limit);
}

function sentenceList(values) {
  if (values.length === 0) return "";
  if (values.length === 1) return values[0];
  return `${values.slice(0, -1).join(", ")} y ${values.at(-1)}`;
}

export function generateLocalAssistantResponse(context, games = []) {
  const message = context?.message?.toLocaleLowerCase("es-MX") ?? "";
  const gamesById = gameMap(games);
  const interested = titlesFor(
    context?.interestedGameIds ?? [],
    gamesById,
  );
  const owned = titlesFor(context?.ownedGameIds ?? [], gamesById);
  const withInti = titlesFor(
    context?.intiLibraryGameIds ?? [],
    gamesById,
  );

  if (!message) {
    return "Escribe qué te gustaría jugar y usaré tu perfil, Mi lista y Mi biblioteca para orientarte.";
  }

  if (message.includes("inti") || message.includes("juntos")) {
    if (withInti.length > 0) {
      return `Para jugar con Inti, empezaría por ${sentenceList(withInti)}. Ya aparecen como opciones compatibles dentro de HEARTAGRAM.`;
    }

    return "Todavía no encuentro una coincidencia local para jugar con Inti. Revisa la sección Para jugar con Inti o prueba otra consulta.";
  }

  if (
    message.includes("biblioteca") ||
    message.includes("tengo") ||
    message.includes("empezar") ||
    message.includes("primero")
  ) {
    if (owned.length > 0) {
      return `De Mi biblioteca, empezaría por ${sentenceList(owned)}. Elige según el tipo de sesión que quieras tener hoy.`;
    }

    if (interested.length > 0) {
      return `Aún no hay juegos en Mi biblioteca. De Me interesa, revisaría primero ${sentenceList(interested)}.`;
    }
  }

  if (message.includes("lista") || message.includes("interesa")) {
    if (interested.length > 0) {
      return `En Me interesa tienes ${sentenceList(interested)}. Puedo ayudarte a escoger entre esas opciones.`;
    }

    return "Tu lista todavía está vacía. Guarda algunos juegos desde Recomendaciones o Explorar y vuelve a preguntarme.";
  }

  if (message.includes("oscuro") || message.includes("horror")) {
    const darkGames = games
      .filter((game) => Number(game?.vector?.mood) >= 1)
      .slice(0, 3)
      .map((game) => game.title);

    if (darkGames.length > 0) {
      return `Para algo oscuro, revisaría ${sentenceList(darkGames)}. Esta respuesta usa el catálogo local; la versión conectada podrá explicar mejor las diferencias.`;
    }
  }

  if (message.includes("lol") || message.includes("diferente")) {
    return "Si quieres salir de LoL, prueba una experiencia con progreso claro, exploración o cooperación. Revisa Sal de tu zona y guarda las opciones que te llamen la atención.";
  }

  if (interested.length > 0) {
    return `Tomando como base Me interesa, comenzaría comparando ${sentenceList(interested)}. Dime si buscas algo oscuro, corto, competitivo o para jugar con Inti.`;
  }

  return "Puedo orientarte con consultas sobre Mi lista, Mi biblioteca, juegos oscuros o títulos para jugar con Inti. Este es el modo local; todavía no usa Gemini.";
}

// HEARTAGRAM · Recommendation engine v2.
// Pure functions, no DOM. Mixes the curated games with the Nintendo Store
// Mexico catalog, adds daily rotation, diversity and owned-game exclusion.
import { scoreGame, duoBadges } from "./recommender.js";

const CURATED_BONUS = 0.04;
const JITTER = 0.16;
const FAVORITE_GENRE_BONUS = 0.04;
const FAVORITE_GENRE_CAP = 0.08;
const COUPLE_PREF_BONUS = 0.05;
const LIMITS = { FOR_YOU: 3, MIGHT_HOOK: 6, DUO: 3, SHORTLIST: 60, PER_GENRE: 2 };
const STOP_WORDS = new Set([
  "the", "of", "a", "la", "el", "los", "las", "de", "del", "y", "and", "new", "super",
  "nintendo", "switch", "leyendas", "paquete", "edicion", "edition",
]);

const has = (list, value) => Array.isArray(list) && list.includes(value);
const clamp = (value) => Math.max(-2, Math.min(2, value));

function plain(value) {
  return String(value ?? "")
    .replace(/[™®©]/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function normalizeTitle(value) {
  return plain(value)
    .replace(/[–—-]\s*nintendo switch.*$/, "")
    .replace(/[^a-z0-9]/g, "");
}

export function familyKey(game) {
  const words = plain(game?.title ?? game?.name)
    .split(/[^a-z0-9]+/)
    .filter((word) => word && !STOP_WORDS.has(word));
  return words[0] ?? normalizeTitle(game?.title ?? game?.name);
}

function hash01(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 100000) / 100000;
}

/** Maps a Nintendo Store product to the curated game contract. */
export function nintendoToCandidate(game) {
  const genres = Array.isArray(game?.genres) ? game.genres : [];
  const features = Array.isArray(game?.features) ? game.features : [];
  const ways = Array.isArray(game?.ways_to_play) ? game.ways_to_play : [];
  const solo = game?.player_count === "Un jugador";
  const rating = game?.content_rating?.code ?? "";
  const g = (value) => has(genres, value);
  const f = (value) => has(features, value);
  const w = (value) => has(ways, value);

  const vector = {
    pace: clamp(
      (g("Acción") ? 1 : 0) + (g("Disparos") ? 1 : 0) + (g("Carreras") ? 1 : 0) +
      (g("Deportes") ? 0.5 : 0) + (f("Decisiones relámpago") ? 0.5 : 0) -
      (g("Simulación") ? 1 : 0) - (g("Rompecabezas") ? 0.5 : 0) - (g("Aventura narrativa") ? 0.5 : 0),
    ),
    social: clamp(
      (g("Fiesta") ? 1.5 : 0) + (ways.length ? 0.5 : 0) + (w("Cooperativo en línea") ? 0.5 : 0) +
      (w("Juntos en una consola") ? 0.5 : 0) + (game?.player_count === "4+" ? 0.5 : 0) - (solo ? 1 : 0),
    ),
    structure: clamp(
      (f("Libertad de movimiento") ? 1 : 0) + (f("Exploración") ? 1 : 0) + (f("Crea y juega") ? 1 : 0) +
      (g("Simulación") ? 0.5 : 0) + (f("Elige tu propio camino") ? 0.5 : 0) -
      (f("Plataformas") ? 0.5 : 0) - (g("Rompecabezas") ? 0.5 : 0),
    ),
    session: clamp(
      (g("Juego de rol") ? 1.5 : 0) + (f("Mejora tus atributos") ? 0.5 : 0) + (g("Estrategia") ? 0.5 : 0) +
      (g("Aventura") ? 0.5 : 0) - (g("Fiesta") ? 1 : 0) - (f("Minijuegos") ? 0.5 : 0) - (f("Rompe récords") ? 0.5 : 0),
    ),
    mood: clamp(
      (rating === "c" ? 1.5 : rating === "b15" ? 0.75 : rating === "a" ? -0.75 : 0) +
      (f("Supervivencia") ? 0.5 : 0) - (g("Fiesta") ? 0.5 : 0),
    ),
    challenge: clamp(
      (f("Rompe récords de tiempo") ? 0.5 : 0) + (f("Recomenzar de cero tras las derrotas") ? 1 : 0) +
      (f("Clasificación en línea") ? 0.5 : 0) + (w("Compite en línea") ? 0.5 : 0) + (g("Lucha") ? 0.5 : 0) -
      (f("Elige el nivel de dificultad") ? 0.3 : 0) - (g("Simulación") ? 0.5 : 0),
    ),
  };

  const horrorLevel = rating === "c" && f("Supervivencia") ? 3 : rating === "c" ? 2
    : rating === "b15" && f("Supervivencia") ? 1 : 0;

  const personality = [];
  if (vector.structure >= 0.75 || f("Exploración")) personality.push("EXPLORER");
  if (w("Compite en línea") || f("Clasificación en línea") || g("Lucha") || g("Deportes") || g("Carreras")) personality.push("COMPETITOR");
  if (f("Mejora tus atributos")) personality.push("COLLECTOR");
  if (f("Crea y juega") || f("Personajes personalizables") || g("Simulación")) personality.push("CREATOR");
  if (f("Supervivencia") || f("Recomenzar de cero tras las derrotas")) personality.push("SURVIVOR");
  if (g("Estrategia") || g("Juegos de mesa") || g("Rompecabezas") || f("Acertijos y deducción")) personality.push("STRATEGIST");
  if (g("Aventura narrativa") || f("Elige tu propio camino") || f("Romance") || (f("Personajes con voz") && g("Juego de rol"))) personality.push("STORY_SEEKER");
  if (horrorLevel >= 2) personality.push("HORROR_FAN");

  return {
    id: game?.catalog_id ?? `nintendo:MX:${game?.nsuid}`,
    source: "nintendo",
    status: "VERIFICADO",
    title: game?.name ?? game?.title ?? "",
    cover_url: game?.cover || null,
    genres,
    features,
    ways_to_play: ways,
    vector,
    personality,
    vibes: [],
    horror_level: horrorLevel,
    rating,
    platforms: Array.isArray(game?.platforms) ? game.platforms : [],
    player_count: game?.player_count ?? null,
    couple: [],
    multiplayer: {
      online_coop: w("Cooperativo en línea") || w("Juega en línea con amigos"),
      online_versus: w("Compite en línea"),
      local_wireless: w("Juntos en varias consolas"),
      same_console: w("Juntos en una consola"),
    },
    why: null,
  };
}

function isPlayableProduct(game) {
  const title = String(game?.name ?? game?.title ?? "");
  if (/^paquete/i.test(title)) return false;
  if (/bundle|dlc|demo|app/i.test(String(game?.game_type ?? ""))) return false;
  return !has(game?.genres, "Aplicaciones");
}

/** Curated games first; Nintendo products only when they add something new. */
export function buildPool(curated = [], catalog = []) {
  const seenTitles = new Set(curated.map((game) => normalizeTitle(game.title)));
  const seenCovers = new Set(curated.map((game) => game.cover_url).filter(Boolean));
  const pool = [...curated];
  for (const product of catalog) {
    if (!isPlayableProduct(product)) continue;
    const title = normalizeTitle(product.name ?? product.title);
    if (!title || seenTitles.has(title) || (product.cover && seenCovers.has(product.cover))) continue;
    seenTitles.add(title);
    pool.push(nintendoToCandidate(product));
  }
  return pool;
}

// Every reason states something the Nintendo Store data confirms. The profile only
// decides which one is shown first, so no line claims more than the catalog says.
const REASONS = [
  { dim: "social", sign: 1, weight: 1.2, when: (g) => has(g.ways_to_play, "Cooperativo en línea"), text: "Tiene modo cooperativo en línea." },
  { dim: "social", sign: 1, weight: 1.1, when: (g) => has(g.ways_to_play, "Juntos en una consola"), text: "Se puede jugar entre varios en la misma consola." },
  { dim: "social", sign: 1, weight: 1, when: (g) => has(g.ways_to_play, "Juega en línea con amigos"), text: "Puedes jugarlo en línea con amigos." },
  { dim: "social", sign: 1, weight: 1, when: (g) => (g.ways_to_play ?? []).some((way) => way.startsWith("GameShare")), text: "Con GameShare puedes jugarlo sin que la otra persona lo tenga." },
  { dim: "social", sign: 1, weight: 1, when: (g) => has(g.genres, "Fiesta"), text: "Es un juego de fiesta, con minijuegos para varios." },
  { dim: "social", sign: -1, weight: 1, when: (g) => g.player_count === "Un jugador", text: "Se juega en solitario." },
  { dim: "structure", sign: 1, weight: 1.2, when: (g) => has(g.features, "Exploración") || has(g.features, "Libertad de movimiento"), text: "Tiene exploración libre." },
  { dim: "structure", sign: 1, weight: 1.1, when: (g) => has(g.features, "Crea y juega"), text: "Te deja construir y crear." },
  { dim: "structure", sign: 1, weight: 1, when: (g) => has(g.features, "Personajes personalizables"), text: "Puedes personalizar a tu personaje." },
  { dim: "structure", sign: 1, weight: 1, when: (g) => has(g.features, "Elige tu propio camino"), text: "Tus decisiones cambian cómo sigue la historia." },
  { dim: "session", sign: 1, weight: 1, when: (g) => has(g.features, "Mejora tus atributos"), text: "Tu personaje mejora conforme avanzas." },
  { dim: "session", sign: 1, weight: 0.8, when: (g) => has(g.genres, "Aventura narrativa"), text: "Es una aventura narrativa, centrada en la historia." },
  { dim: "session", sign: 1, weight: 0.7, when: (g) => has(g.genres, "Juego de rol"), text: "Es un juego de rol." },
  { dim: "session", sign: 1, weight: 0.7, when: (g) => has(g.genres, "Estrategia"), text: "Es un juego de estrategia." },
  { dim: "session", sign: -1, weight: 1, when: (g) => has(g.features, "Minijuegos"), text: "Se juega en minijuegos cortos." },
  { dim: "mood", sign: 1, weight: 1.2, when: (g) => g.horror_level > 0, text: "Tiene un tono oscuro y de miedo." },
  { dim: "mood", sign: 1, weight: 1, when: (g) => has(g.features, "Supervivencia"), text: "Es un juego de supervivencia." },
  { dim: "mood", sign: -1, weight: 1, when: (g) => g.rating === "a", text: "Es apto para todo público." },
  { dim: "challenge", sign: 1, weight: 1.2, when: (g) => has(g.features, "Recomenzar de cero tras las derrotas"), text: "Cada derrota te manda al inicio, así que se juega por intentos." },
  { dim: "challenge", sign: 1, weight: 1, when: (g) => has(g.features, "Clasificación en línea"), text: "Tiene clasificación en línea para medirte con otros." },
  { dim: "challenge", sign: 1, weight: 1, when: (g) => has(g.ways_to_play, "Compite en línea"), text: "Tiene partidas competitivas en línea." },
  { dim: "challenge", sign: 1, weight: 0.8, when: (g) => has(g.genres, "Lucha"), text: "Es un juego de lucha." },
  { dim: "challenge", sign: -1, weight: 1, when: (g) => has(g.features, "Elige el nivel de dificultad"), text: "Puedes elegir la dificultad." },
  { dim: "pace", sign: 1, weight: 0.7, when: (g) => has(g.genres, "Acción"), text: "Es un juego de acción." },
  { dim: "pace", sign: 1, weight: 0.7, when: (g) => has(g.genres, "Carreras"), text: "Es un juego de carreras." },
  { dim: "pace", sign: 1, weight: 0.7, when: (g) => has(g.genres, "Disparos"), text: "Es un juego de disparos." },
  { dim: "pace", sign: -1, weight: 0.7, when: (g) => has(g.genres, "Simulación"), text: "Es una simulación." },
  { dim: "pace", sign: -1, weight: 0.7, when: (g) => has(g.genres, "Rompecabezas"), text: "Es un juego de rompecabezas." },
];

function genreFallback(game) {
  const names = (game.genres ?? []).slice(0, 2).map((genre) => genre.toLowerCase().replace(/^juego de /, ""));
  if (names.length) return `Es un juego de ${names.join(" y ")}.`;
  return has(game.platforms, "SWITCH_2") ? "Para Nintendo Switch 2." : "Para Nintendo Switch.";
}

export function reasonFor(game, profile, used = new Set()) {
  if (game.why) return game.why;
  const vector = profile?.vector ?? {};
  const options = REASONS
    .filter(({ when }) => when(game))
    .map((reason) => ({ reason, fit: (vector[reason.dim] ?? 0) * reason.sign * reason.weight }))
    .filter(({ fit }) => fit >= 0)
    .sort((a, b) => b.fit - a.fit);
  const pick = options.find(({ reason }) => !used.has(reason.text)) ?? options[0];
  const text = pick?.reason.text ?? genreFallback(game);
  used.add(text);
  return text;
}

function withWhy(entry, profile, used) {
  if (!entry || entry.game.why) return entry;
  return { ...entry, game: { ...entry.game, why: reasonFor(entry.game, profile, used) } };
}

function diversePick(ranked, count, used) {
  const picked = [];
  const genres = {};
  const shortlist = ranked.slice(0, Math.max(LIMITS.SHORTLIST, count * 4));
  for (const strict of [true, false]) {
    for (const entry of strict ? shortlist : ranked) {
      if (picked.length >= count) break;
      const { game } = entry;
      const family = familyKey(game);
      if (used.ids.has(game.id) || used.families.has(family)) continue;
      const genre = game.genres?.[0] ?? "";
      if (strict && (genres[genre] ?? 0) >= LIMITS.PER_GENRE) continue;
      picked.push(entry);
      used.ids.add(game.id);
      used.families.add(family);
      genres[genre] = (genres[genre] ?? 0) + 1;
    }
  }
  return picked;
}

function pickOutOfZone(profile, ranked, used) {
  const userMood = profile?.vector?.mood || ranked[0]?.game.vector.mood || 0;
  if (!userMood) return null;
  return ranked.find(({ game }) =>
    !used.ids.has(game.id) &&
    !used.families.has(familyKey(game)) &&
    Math.sign(game.vector.mood) === -Math.sign(userMood)) ?? null;
}

/** The same game can be saved under a curated id or a Nintendo id, so compare by title too. */
function titleKeys(ids, curated, catalog) {
  const titles = new Map();
  curated.forEach((game) => titles.set(game.id, game.title));
  catalog.forEach((game) => titles.set(game.catalog_id, game.name ?? game.title));
  return new Set([...ids].map((id) => titles.get(id)).filter(Boolean).map(normalizeTitle));
}

export function buildRecommendations(profile, {
  curated = [], catalog = [], ownedIds = [], favoriteIds = [], seed = "0",
} = {}) {
  const owned = new Set(ownedIds);
  const favorites = new Set(favoriteIds);
  const ownedKeys = titleKeys(owned, curated, catalog);
  const favoriteKeys = titleKeys(favorites, curated, catalog);
  const pool = buildPool(curated, catalog);
  const isFavorite = (game) => favorites.has(game.id) || favoriteKeys.has(normalizeTitle(game.title));
  const isOwned = (game) => owned.has(game.id) || ownedKeys.has(normalizeTitle(game.title));
  const favoriteGenres = new Set(pool.filter(isFavorite).flatMap((game) => game.genres ?? []));

  const ranked = pool
    .filter((game) => game.status === "VERIFICADO" && !isOwned(game))
    .map((game) => {
      let score = scoreGame(profile, game);
      if (game.source !== "nintendo") score += CURATED_BONUS;
      const shared = (game.genres ?? []).filter((genre) => favoriteGenres.has(genre)).length;
      score += Math.min(shared * FAVORITE_GENRE_BONUS, FAVORITE_GENRE_CAP);
      score += (hash01(`${seed}|${game.id}`) - 0.5) * JITTER;
      return { game, score };
    })
    .sort((a, b) => b.score - a.score);

  const reasons = new Set();
  const used = { ids: new Set(), families: new Set() };
  const forYou = diversePick(ranked, LIMITS.FOR_YOU, used).map((entry) => withWhy(entry, profile, reasons));
  const mightHook = diversePick(ranked, LIMITS.MIGHT_HOOK, used).map((entry) => withWhy(entry, profile, reasons));
  const outOfZone = withWhy(pickOutOfZone(profile, ranked, used), profile, reasons);

  const duoRanked = ranked
    .map((entry) => ({
      ...entry,
      badges: duoBadges(entry.game),
      score: entry.score + (has(entry.game.couple, profile?.couplePref) ? COUPLE_PREF_BONUS : 0),
    }))
    .filter(({ badges }) => badges.length > 0)
    .sort((a, b) =>
      Number(has(b.game.couple, "INTI_LIBRARY_MATCH")) - Number(has(a.game.couple, "INTI_LIBRARY_MATCH")) ||
      b.score - a.score);
  const duo = diversePick(duoRanked, LIMITS.DUO, { ids: new Set(), families: new Set() })
    .map((entry) => withWhy(entry, profile, reasons));

  return { ranked, sections: { forYou, mightHook, outOfZone }, duo, pool };
}

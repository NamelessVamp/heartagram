const DATA_VERSION = "130";
import { NINTENDO_INDEX_PATH, adaptNintendoCatalog } from "./nintendo-catalog.js?v=v111";

// Nintendo-only catalog runtime for the public static build.
const DEFAULT_PAGE_SIZE = 24;
let catalogPromise = null;

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX")
    .trim();
}

async function fetchJson(path) {
  const response = await fetch(`${path}?v=${DATA_VERSION}`);
  if (!response.ok) throw new Error(`No se pudo cargar ${path} (${response.status})`);
  return response.json();
}

function validateCatalog(payload) {
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.games) || !payload.meta) {
    throw new TypeError("El catalogo Nintendo no tiene una estructura valida.");
  }
  return payload;
}

export function loadCatalog() {
  if (!catalogPromise) {
    catalogPromise = fetchJson(NINTENDO_INDEX_PATH)
      .then(adaptNintendoCatalog)
      .then(validateCatalog)
      .catch((error) => { catalogPromise = null; throw error; });
  }
  return catalogPromise;
}

export function clearCatalogCache() { catalogPromise = null; }

export function catalogImageUrl(value) {
  if (typeof value !== "string") return "";
  const source = value.trim();
  if (!source) return "";
  return source.startsWith("//") ? `https:${source}` : source;
}

export function favoriteIdForCatalogGame(gameOrId) {
  if (gameOrId && typeof gameOrId === "object") {
    if (typeof gameOrId.catalog_id === "string") return gameOrId.catalog_id;
    if (gameOrId.nsuid) return `nintendo:MX:${String(gameOrId.nsuid)}`;
  }
  const raw = String(gameOrId ?? "").trim();
  if (raw.startsWith("nintendo:MX:")) return raw;
  return raw ? `nintendo:MX:${raw}` : "";
}

export function isCatalogFavoriteId(value) {
  return typeof value === "string" && /^nintendo:MX:\d{10,20}$/.test(value);
}

export function catalogIdFromFavoriteId(value) {
  return isCatalogFavoriteId(value) ? value.slice("nintendo:MX:".length) : null;
}

export function splitFavoriteIds(values = []) {
  const curatedIds = [];
  const catalogIds = [];
  for (const value of values) {
    const catalogId = catalogIdFromFavoriteId(value);
    if (catalogId === null) curatedIds.push(value);
    else catalogIds.push(catalogId);
  }
  return { curatedIds, catalogIds };
}

export function findCatalogGamesByIds(catalog, catalogIds) {
  if (!catalog || !Array.isArray(catalog.games) || !Array.isArray(catalogIds)) return [];
  const byId = new Map(catalog.games.map((game) => [String(game.nsuid), game]));
  return catalogIds.map((id) => byId.get(String(id))).filter(Boolean);
}

export async function resolveCatalogFavorites(values) {
  const { catalogIds } = splitFavoriteIds(values);
  if (!catalogIds.length) return [];
  return findCatalogGamesByIds(await loadCatalog(), catalogIds);
}

export function getCatalogFacets(catalog) {
  const genres = new Set(), modes = new Set(), platforms = new Set(), types = new Set();
  for (const game of catalog.games) {
    game.genres?.forEach((value) => genres.add(value));
    // Nintendo Store only publishes ways to play; game_modes stays empty.
    game.ways_to_play?.forEach((value) => modes.add(value));
    game.platforms?.forEach((value) => platforms.add(value));
    if (game.game_type) types.add(game.game_type);
  }
  const sort = (values) => [...values].sort((a, b) => a.localeCompare(b, "es-MX", { sensitivity: "base" }));
  return { genres: sort(genres), modes: sort(modes), platforms: sort(platforms), types: sort(types) };
}

function matchesValue(values, selected) {
  return !selected || selected === "ALL" || (Array.isArray(values) && values.includes(selected));
}

function compareGames(left, right, sort) {
  if (sort === "NEWEST") {
    const difference = (right.release_year ?? -1) - (left.release_year ?? -1);
    if (difference) return difference;
  }
  return left.name.localeCompare(right.name, "es-MX", { sensitivity: "base", numeric: true });
}

export function queryCatalog(catalog, {
  query = "", platform = "ALL", genre = "ALL", mode = "ALL",
  gameType = "ALL", sort = "NAME", page = 1, pageSize = DEFAULT_PAGE_SIZE,
} = {}) {
  const safePageSize = Math.max(1, Number(pageSize) || DEFAULT_PAGE_SIZE);
  const normalizedQuery = normalizeText(query);
  const filtered = catalog.games
    .filter((game) => !normalizedQuery || normalizeText(game.name).includes(normalizedQuery))
    .filter((game) => matchesValue(game.platforms, platform))
    .filter((game) => matchesValue(game.genres, genre))
    .filter((game) => matchesValue(game.ways_to_play, mode))
    .filter((game) => !gameType || gameType === "ALL" || game.game_type === gameType)
    .sort((left, right) => compareGames(left, right, sort));
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(Math.max(1, Number(page) || 1), pages);
  const start = (safePage - 1) * safePageSize;
  return {
    games: filtered.slice(start, start + safePageSize), total, page: safePage,
    pages, pageSize: safePageSize, hasPrevious: safePage > 1, hasNext: safePage < pages,
  };
}

export async function loadGameDetails(_catalog, game) {
  if (!game || game.catalog_source !== "nintendo") {
    throw new TypeError("El producto no pertenece al catalogo Nintendo.");
  }
  return { ...game, cover: game.cover_detail, platforms: game.platform_details };
}

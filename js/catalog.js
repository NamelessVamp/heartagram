// Loads and queries the broad IGDB catalog used by HEARTAGRAM's explorer.
// The compact index is loaded once. Detail shards are loaded only when needed.

const INDEX_PATH = "data/catalog_igdb.json";
const DEFAULT_PAGE_SIZE = 24;

let catalogPromise = null;
const shardCache = new Map();

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX")
    .trim();
}

async function fetchJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`No se pudo cargar ${path} (${response.status})`);
  }

  return response.json();
}

function validateCatalog(payload) {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !Array.isArray(payload.games) ||
    typeof payload.meta !== "object" ||
    payload.meta === null
  ) {
    throw new TypeError("El índice IGDB no tiene una estructura válida.");
  }

  return payload;
}

export function loadCatalog() {
  if (!catalogPromise) {
    catalogPromise = fetchJson(INDEX_PATH)
      .then(validateCatalog)
      .catch((error) => {
        catalogPromise = null;
        throw error;
      });
  }

  return catalogPromise;
}

export function clearCatalogCache() {
  catalogPromise = null;
  shardCache.clear();
}

export function favoriteIdForCatalogGame(gameOrId) {
  const id =
    typeof gameOrId === "object" && gameOrId !== null
      ? gameOrId.igdb_id
      : gameOrId;

  return `igdb:${id}`;
}

export function getCatalogFacets(catalog) {
  const genres = new Set();
  const modes = new Set();
  const platforms = new Set();
  const types = new Set();

  for (const game of catalog.games) {
    game.genres?.forEach((genre) => genres.add(genre));
    game.game_modes?.forEach((mode) => modes.add(mode));
    game.platforms?.forEach((platform) => platforms.add(platform));

    if (game.game_type) {
      types.add(game.game_type);
    }
  }

  const sortValues = (values) =>
    [...values].sort((left, right) =>
      left.localeCompare(right, "es-MX", { sensitivity: "base" }),
    );

  return {
    genres: sortValues(genres),
    modes: sortValues(modes),
    platforms: sortValues(platforms),
    types: sortValues(types),
  };
}

function matchesSearch(game, normalizedQuery) {
  if (!normalizedQuery) return true;

  return normalizeText(game.name).includes(normalizedQuery);
}

function matchesValue(values, selected) {
  if (!selected || selected === "ALL") return true;
  return Array.isArray(values) && values.includes(selected);
}

function compareGames(left, right, sort) {
  if (sort === "RATING") {
    const ratingDifference = (right.rating ?? -1) - (left.rating ?? -1);
    if (ratingDifference !== 0) return ratingDifference;

    const countDifference =
      (right.rating_count ?? 0) - (left.rating_count ?? 0);
    if (countDifference !== 0) return countDifference;
  }

  if (sort === "NEWEST") {
    const yearDifference =
      (right.release_year ?? -1) - (left.release_year ?? -1);
    if (yearDifference !== 0) return yearDifference;
  }

  return left.name.localeCompare(right.name, "es-MX", {
    sensitivity: "base",
    numeric: true,
  });
}

export function queryCatalog(
  catalog,
  {
    query = "",
    platform = "ALL",
    genre = "ALL",
    mode = "ALL",
    gameType = "ALL",
    sort = "NAME",
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  } = {},
) {
  const safePageSize = Math.max(1, Number(pageSize) || DEFAULT_PAGE_SIZE);
  const normalizedQuery = normalizeText(query);

  const filtered = catalog.games
    .filter((game) => matchesSearch(game, normalizedQuery))
    .filter((game) => matchesValue(game.platforms, platform))
    .filter((game) => matchesValue(game.genres, genre))
    .filter((game) => matchesValue(game.game_modes, mode))
    .filter(
      (game) => !gameType || gameType === "ALL" || game.game_type === gameType,
    )
    .sort((left, right) => compareGames(left, right, sort));

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / safePageSize));
  const safePage = Math.min(Math.max(1, Number(page) || 1), pages);
  const start = (safePage - 1) * safePageSize;

  return {
    games: filtered.slice(start, start + safePageSize),
    total,
    page: safePage,
    pages,
    pageSize: safePageSize,
    hasPrevious: safePage > 1,
    hasNext: safePage < pages,
  };
}

function shardPath(catalog, shardNumber) {
  const manifestEntry = catalog.meta.shards?.find(
    (entry) => entry.shard === shardNumber,
  );

  if (manifestEntry?.file) {
    return manifestEntry.file;
  }

  return `data/catalog_igdb_details/shard-${String(shardNumber).padStart(3, "0")}.json`;
}

export async function loadShard(catalog, shardNumber) {
  if (!Number.isInteger(shardNumber) || shardNumber < 0) {
    throw new TypeError("El número de shard no es válido.");
  }

  if (!shardCache.has(shardNumber)) {
    const request = fetchJson(shardPath(catalog, shardNumber)).catch(
      (error) => {
        shardCache.delete(shardNumber);
        throw error;
      },
    );

    shardCache.set(shardNumber, request);
  }

  return shardCache.get(shardNumber);
}

export async function loadGameDetails(catalog, game) {
  if (!game || !Number.isInteger(game.igdb_id)) {
    throw new TypeError("El juego no contiene un IGDB ID válido.");
  }

  if (!Number.isInteger(game.shard)) {
    throw new TypeError("El juego no contiene un shard válido.");
  }

  const payload = await loadShard(catalog, game.shard);

  if (!Array.isArray(payload.games)) {
    throw new TypeError("El shard no contiene una lista de juegos válida.");
  }

  const details = payload.games.find(
    (candidate) => candidate.igdb_id === game.igdb_id,
  );

  if (!details) {
    throw new Error(`No se encontraron detalles para ${game.name}.`);
  }

  return details;
}

export function isCatalogFavoriteId(favoriteId) {
  return typeof favoriteId === "string" && favoriteId.startsWith("igdb:");
}

export function catalogIdFromFavoriteId(favoriteId) {
  if (!isCatalogFavoriteId(favoriteId)) {
    return null;
  }

  const rawId = favoriteId.slice("igdb:".length);

  const parsedId = Number(rawId);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return null;
  }

  return parsedId;
}

export function splitFavoriteIds(favoriteIds) {
  const curatedIds = [];
  const catalogIds = [];

  for (const favoriteId of favoriteIds) {
    const catalogId = catalogIdFromFavoriteId(favoriteId);

    if (catalogId === null) {
      curatedIds.push(favoriteId);
      continue;
    }

    catalogIds.push(catalogId);
  }

  return {
    curatedIds,
    catalogIds,
  };
}

export function findCatalogGamesByIds(catalog, catalogIds) {
  if (!catalog || !Array.isArray(catalog.games) || !Array.isArray(catalogIds)) {
    return [];
  }

  const wantedIds = new Set(catalogIds);

  return catalog.games.filter((game) => wantedIds.has(game.igdb_id));
}

export async function resolveCatalogFavorites(favoriteIds) {
  const { catalogIds } = splitFavoriteIds(favoriteIds);

  if (catalogIds.length === 0) {
    return [];
  }

  const catalog = await loadCatalog();

  return findCatalogGamesByIds(catalog, catalogIds);
}

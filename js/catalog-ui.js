import { catalogLabel, formatCatalogDate } from "./catalog-labels.js";

// Renders the Nintendo Store Mexico catalog explorer.

import {
  favoriteIdForCatalogGame,
  getCatalogFacets,
  catalogImageUrl,
  loadCatalog,
  loadGameDetails,
  queryCatalog,
} from "./catalog.js";

import { isFavorite, toggleFavorite } from "./favorites.js";
import { isOwnedGame, setOwnedGame } from "./library.js";

import { isNintendoDetail, renderNintendoProductDetail } from "./nintendo-product-detail.js?v=np5";
const PAGE_SIZE = 24;

const state = {
  catalog: null,
  facets: null,
  query: "",
  platform: "ALL",
  genre: "ALL",
  mode: "ALL",
  sort: "NAME",
  page: 1,
  selectedGame: null,
};

const elements = {};
let initialized = false;
let dialogReturnFocus = null;

function byId(id) {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Falta el elemento #${id}`);
  }

  return element;
}

function cacheElements() {
  elements.loading = byId("catalog-loading");
  elements.statusLabel = byId("catalog-status-label");
  elements.retry = byId("catalog-retry");
  elements.content = byId("catalog-content");
  elements.query = byId("catalog-query");
  elements.platform = byId("catalog-platform");
  elements.genre = byId("catalog-genre");
  elements.mode = byId("catalog-mode");
  elements.sort = byId("catalog-sort");
  elements.count = byId("catalog-count");
  elements.activeFilters = byId("catalog-active-filters");
  elements.clear = byId("catalog-clear");
  elements.grid = byId("catalog-grid");
  elements.previous = byId("catalog-previous");
  elements.page = byId("catalog-page");
  elements.next = byId("catalog-next");

  elements.dialog = byId("catalog-dialog");
  elements.dialogClose = byId("catalog-dialog-close");
  elements.dialogLoading = byId("catalog-dialog-loading");
  elements.dialogBody = byId("catalog-dialog-body");
  elements.dialogPlatforms = byId("catalog-dialog-platforms");
  elements.dialogTitle = byId("catalog-dialog-title");
  elements.dialogBadges = byId("catalog-dialog-badges");
  elements.dialogFavorite = byId("catalog-dialog-favorite");
  elements.dialogOwned = byId("catalog-dialog-owned");
  elements.dialogSummary = byId("catalog-dialog-summary");
  elements.dialogStorySection = byId("catalog-dialog-story-section");
  elements.dialogStory = byId("catalog-dialog-story");
  elements.dialogRelease = byId("catalog-dialog-release");
  elements.dialogDevelopers = byId("catalog-dialog-developers");
  elements.dialogPublishers = byId("catalog-dialog-publishers");
  elements.dialogModes = byId("catalog-dialog-modes");
  elements.dialogGallery = byId("catalog-dialog-gallery");
  elements.nintendoProductDetail = byId("nintendo-product-detail");
  elements.dialogNintendo = byId("catalog-dialog-nintendo");
  elements.dialogPrice = byId("catalog-dialog-price");
  elements.dialogSale = byId("catalog-dialog-sale");
  elements.dialogRating = byId("catalog-dialog-rating");
  elements.dialogPlayers = byId("catalog-dialog-players");
  elements.dialogWays = byId("catalog-dialog-ways");
  elements.dialogAvailability = byId("catalog-dialog-availability");
  elements.dialogContentDescriptors = byId("catalog-dialog-content-descriptors");
  elements.dialogContentDescriptorList = byId("catalog-dialog-content-descriptor-list");
  elements.dialogFeatures = byId("catalog-dialog-features");
  elements.dialogFeatureList = byId("catalog-dialog-feature-list");
  elements.dialogDemo = byId("catalog-dialog-demo");
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

function fillSelect(select, values, allLabel) {
  select.replaceChildren();
  select.append(new Option(allLabel, "ALL"));

  values.forEach((value) => {
    select.append(new Option(catalogLabel(value), value));
  });
}

function platformLabel(value) {
  if (value === "SWITCH_2") return "Switch 2";
  if (value === "SWITCH") return "Switch";
  return value;
}

function favoriteLabel(game) {
  return isFavorite(favoriteIdForCatalogGame(game))
    ? "♥ En mi lista"
    : "♡ Me interesa";
}

function updateFavoriteButton(button, game) {
  const favoriteId = favoriteIdForCatalogGame(game);
  const selected = isFavorite(favoriteId);

  button.textContent = selected ? "♥ En mi lista" : "♡ Me interesa";
  button.setAttribute("aria-pressed", String(selected));
  button.setAttribute(
    "aria-label",
    selected
      ? `Quitar ${game.name} de mi lista`
      : `Agregar ${game.name} a mi lista`,
  );
}

function toggleCatalogFavorite(game, button) {
  toggleFavorite(favoriteIdForCatalogGame(game));
  updateFavoriteButton(button, game);
}

function updateOwnedButton(button, game) {
  const gameId = favoriteIdForCatalogGame(game);
  const owned = isOwnedGame(gameId);

  button.textContent = owned ? "✓ En Mi biblioteca" : "Ya lo tengo";
  button.setAttribute("aria-pressed", String(owned));
  button.setAttribute(
    "aria-label",
    owned
      ? `Quitar ${game.name} de Mi biblioteca`
      : `Agregar ${game.name} a Mi biblioteca`,
  );
}

function toggleCatalogOwned(game, favoriteButton, ownedButton) {
  const gameId = favoriteIdForCatalogGame(game);
  const nextOwned = !isOwnedGame(gameId);

  if (nextOwned && isFavorite(gameId)) {
    toggleFavorite(gameId);
  }

  setOwnedGame(gameId, nextOwned);
  updateFavoriteButton(favoriteButton, game);
  updateOwnedButton(ownedButton, game);
}

function createBadges(game) {
  const container = createElement("div", "card-badges");

  const labels = [
    ...(game.platforms ?? []).map(platformLabel),
    ...(game.genres ?? []).slice(0, 2).map(catalogLabel),
  ];

  labels.forEach((label) => {
    container.append(createElement("span", "badge", label));
  });

  return container;
}

// HEARTAGRAM_EXPLORE_P14
function hasActiveFilters() {
  return Boolean(
    state.query.trim() ||
    state.platform !== "ALL" ||
    state.genre !== "ALL" ||
    state.mode !== "ALL" ||
    state.sort !== "NAME"
  );
}

function renderActiveFilters() {
  const filters = [
    state.query.trim() ? ["query", `Buscar: ${state.query.trim()}`] : null,
    state.platform !== "ALL" ? ["platform", platformLabel(state.platform)] : null,
    state.genre !== "ALL" ? ["genre", catalogLabel(state.genre)] : null,
    state.mode !== "ALL" ? ["mode", catalogLabel(state.mode)] : null,
    state.sort !== "NAME"
      ? ["sort", state.sort === "RATING" ? "Mejor calificados" : "Más recientes"]
      : null,
  ].filter(Boolean);

  elements.activeFilters.replaceChildren();
  filters.forEach(([key, label]) => {
    const chip = createElement("button", "catalog-filter-chip", label);
    chip.type = "button";
    chip.dataset.clearCatalogFilter = key;
    chip.setAttribute("aria-label", `Quitar filtro ${label}`);
    chip.addEventListener("click", () => clearSingleFilter(key));
    elements.activeFilters.append(chip);
  });
  elements.clear.hidden = filters.length === 0;
}

function clearSingleFilter(key) {
  if (key === "query") {
    state.query = "";
    elements.query.value = "";
  } else if (key === "sort") {
    state.sort = "NAME";
    elements.sort.value = "NAME";
  } else if (["platform", "genre", "mode"].includes(key)) {
    state[key] = "ALL";
    elements[key].value = "ALL";
  }
  state.page = 1;
  renderResults();
}

function createCatalogEmptyState() {
  const panel = createElement("section", "catalog-empty-state");
  const mark = createElement("span", "catalog-empty-mark", "◇");
  mark.setAttribute("aria-hidden", "true");
  panel.append(
    mark,
    createElement("h3", "catalog-empty-title", "Sin resultados con esos filtros"),
    createElement("p", "catalog-empty-copy", "Prueba otra búsqueda o vuelve al catálogo completo."),
  );
  const reset = createElement("button", "btn btn-ghost", "Limpiar filtros");
  reset.type = "button";
  reset.addEventListener("click", resetFilters);
  panel.append(reset);
  return panel;
}

function renderCatalogSkeletons(count = 8) {
  elements.grid.replaceChildren();
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < count; index += 1) {
    const card = createElement("article", "catalog-card catalog-card-skeleton");
    card.setAttribute("aria-hidden", "true");
    card.append(
      createElement("div", "catalog-skeleton-media"),
      createElement("div", "catalog-skeleton-line catalog-skeleton-title"),
      createElement("div", "catalog-skeleton-line"),
      createElement("div", "catalog-skeleton-line catalog-skeleton-short"),
    );
    fragment.append(card);
  }
  elements.grid.append(fragment);
}

function createCatalogCard(game) {
  const card = createElement("article", "catalog-card");

  const openButton = createElement("button", "catalog-card-open");

  openButton.type = "button";
  openButton.dataset.catalogId = String(game.nsuid);

  openButton.setAttribute("aria-label", `Ver detalles de ${game.name}`);

  const media = createElement("div", "catalog-card-media");

  const image = document.createElement("img");

  image.src = catalogImageUrl(game.cover, "cover_big");

  image.alt = `Portada de ${game.name}`;
  image.loading = "lazy";
  image.decoding = "async";

  image.addEventListener(
    "error",
    () => {
      image.remove();

      if (media.querySelector(".catalog-card-cover-fallback")) {
        return;
      }

      const fallback = createElement("div", "catalog-card-cover-fallback", "H");

      fallback.setAttribute("aria-hidden", "true");

      media.append(fallback);
    },
    {
      once: true,
    },
  );

  media.append(image);

  const body = createElement("div", "catalog-card-body");

  body.append(createElement("h3", "catalog-card-title", game.name));

  const metadata = [game.release_year, game.price_label, catalogLabel(game.game_type)].filter(
    Boolean,
  );

  if (metadata.length) {
    body.append(createElement("p", "catalog-card-meta", metadata.join(" · ")));
  }

  body.append(createBadges(game));

  openButton.append(media, body);

  const favoriteButton = createElement(
    "button",
    "favorite-button catalog-card-favorite",
    favoriteLabel(game),
  );

  favoriteButton.type = "button";
  favoriteButton.dataset.catalogFavorite = String(game.nsuid);

  updateFavoriteButton(favoriteButton, game);

  favoriteButton.addEventListener("click", () => {
    toggleCatalogFavorite(game, favoriteButton);
  });

  const ownedButton = createElement(
    "button",
    "library-button catalog-card-owned",
    "Ya lo tengo",
  );

  ownedButton.type = "button";
  ownedButton.dataset.catalogOwned = String(game.nsuid);
  updateOwnedButton(ownedButton, game);

  ownedButton.addEventListener("click", () => {
    toggleCatalogOwned(game, favoriteButton, ownedButton);
  });

  const actions = createElement("div", "catalog-card-actions");
  actions.append(favoriteButton, ownedButton);

  openButton.addEventListener("click", () => {
    openDetails(game);
  });

  card.append(openButton, actions);

  return card;
}

function renderResults() {
  const result = queryCatalog(state.catalog, {
    query: state.query,
    platform: state.platform,
    genre: state.genre,
    mode: state.mode,
    sort: state.sort,
    page: state.page,
    pageSize: PAGE_SIZE,
  });

  state.page = result.page;
  elements.grid.replaceChildren();

  if (result.total === 0) {
    elements.grid.append(createCatalogEmptyState());
  } else {
    const fragment = document.createDocumentFragment();

    result.games.forEach((game) => {
      fragment.append(createCatalogCard(game));
    });

    elements.grid.append(fragment);
  }

  renderActiveFilters();

  elements.count.textContent =
    result.total === 1
      ? "1 juego encontrado"
      : `${result.total.toLocaleString("es-MX")} juegos encontrados`;

  elements.page.textContent = `Página ${result.page} de ${result.pages}`;
  elements.previous.disabled = !result.hasPrevious;
  elements.next.disabled = !result.hasNext;
}

function resetFilters() {
  state.query = "";
  state.platform = "ALL";
  state.genre = "ALL";
  state.mode = "ALL";
  state.sort = "NAME";
  state.page = 1;

  elements.query.value = "";
  elements.platform.value = "ALL";
  elements.genre.value = "ALL";
  elements.mode.value = "ALL";
  elements.sort.value = "NAME";

  renderResults();
}

function renderDialogBadges(details) {
  elements.dialogBadges.replaceChildren();

  const platforms = (details.platforms ?? [])
    .map((platform) => platform.abbreviation || platform.name)
    .filter(Boolean);

  const labels = [
    ...platforms,
    ...(details.genres ?? []).slice(0, 3).map(catalogLabel),
  ];

  labels.forEach((label) => {
    elements.dialogBadges.append(createElement("span", "badge", label));
  });
}

function renderGallery(details) {
  const gallery = elements.dialogGallery;
  gallery.replaceChildren();

  const sources = [
    details.cover?.url_2x,
    ...(details.screenshots ?? []),
    ...(details.artworks ?? []),
  ]
    .filter((source) => typeof source === "string" && source.trim().length > 0)
    .map((source) => catalogImageUrl(source, "screenshot_big"))
    .filter(Boolean)
    .slice(0, 6);

  const message = createElement(
    "p",
    "catalog-gallery-status",
    sources.length
      ? "Cargando imágenes..."
      : "No hay imágenes disponibles para este juego.",
  );

  message.setAttribute("role", "status");
  gallery.append(message);

  if (sources.length === 0) {
    return;
  }

  let pending = sources.length;
  let loaded = 0;

  function updateStatus() {
    pending -= 1;

    if (loaded > 0) {
      message.remove();
    } else if (pending === 0) {
      message.textContent =
        "No se pudieron cargar las imágenes. Los detalles del juego siguen disponibles.";
    }
  }

  sources.forEach((source, index) => {
    const image = document.createElement("img");

    image.alt = `Imagen ${index + 1} de ${details.name}`;
    image.decoding = "async";
    image.hidden = true;

    image.addEventListener(
      "load",
      () => {
        loaded += 1;
        image.hidden = false;
        updateStatus();
      },
      { once: true },
    );

    image.addEventListener(
      "error",
      () => {
        image.remove();
        updateStatus();
      },
      { once: true },
    );

    gallery.append(image);
    image.src = source;
  });
}

function priceAmount(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
function formatPrice(value, currency = "MXN") {
  const amount = priceAmount(value);
  if (amount === null) return "Precio no disponible";
  return new Intl.NumberFormat("es-MX", { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}
function fillDetailChips(container, section, values = []) {
  container.replaceChildren();
  const safeValues = [...new Set(values.filter(Boolean))];
  section.hidden = safeValues.length === 0;
  safeValues.forEach((value) => container.append(createElement("span", "catalog-detail-chip", value)));
}
function renderNintendoDetails(details) {
  const isNintendo = details.catalog_source === "nintendo";
  elements.dialogNintendo.hidden = !isNintendo;
  if (!isNintendo) return;
  const currency = details.price_currency || "MXN";
  const regular = priceAmount(details.regular_price);
  const sale = priceAmount(details.sale_price);
  elements.dialogPrice.textContent = formatPrice(sale ?? regular, currency);
  const hasSale = sale !== null && regular !== null && sale < regular;
  elements.dialogSale.hidden = !hasSale;
  elements.dialogSale.textContent = hasSale ? `Antes ${formatPrice(regular, currency)} · ${details.percent_off || 0}% de descuento` : "";
  elements.dialogRating.textContent = details.content_rating?.label || "No disponible";
  elements.dialogPlayers.textContent = details.player_count || "No disponible";
  elements.dialogWays.textContent = textOrFallback(details.ways_to_play);
  elements.dialogAvailability.textContent = textOrFallback(details.availability);
  fillDetailChips(elements.dialogContentDescriptorList, elements.dialogContentDescriptors, details.content_descriptors);
  fillDetailChips(elements.dialogFeatureList, elements.dialogFeatures, [...(details.features ?? []), ...(details.nso_features ?? [])]);
  elements.dialogDemo.hidden = !details.demo_nsuid;
}
function textOrFallback(values, fallback = "No disponible") {
  if (Array.isArray(values)) {
    return values.length ? values.join(", ") : fallback;
  }

  return values || fallback;
}

function renderDetails(indexGame, details) {
  state.selectedGame = indexGame;
  const useNintendoDetail = isNintendoDetail(details, indexGame);
  const legacyCopy = elements.dialogBody.querySelector(".catalog-dialog-copy");
  elements.nintendoProductDetail.hidden = !useNintendoDetail;
  if (legacyCopy) legacyCopy.hidden = useNintendoDetail;
  elements.dialogGallery.hidden = useNintendoDetail;
  if (elements.dialogNintendo) elements.dialogNintendo.hidden = true;
  if (useNintendoDetail) {
    renderNintendoProductDetail(elements.nintendoProductDetail, details, indexGame);
    return;
  }

  state.selectedGame = indexGame;

  const platforms = (details.platforms ?? [])
    .map((platform) => typeof platform === "string" ? platformLabel(platform) : platform.name)
    .filter(Boolean);

  elements.dialogPlatforms.textContent = textOrFallback(platforms);
  elements.dialogTitle.textContent = details.name;
  elements.dialogSummary.textContent =
    details.summary || "Nintendo Store Mexico no tiene una descripcion disponible.";

  const hasStory = Boolean(details.storyline);
  elements.dialogStorySection.hidden = !hasStory;
  elements.dialogStory.textContent = details.storyline || "";

  elements.dialogRelease.textContent = formatCatalogDate(details.release_date);
  elements.dialogDevelopers.textContent = textOrFallback(details.developers);
  elements.dialogPublishers.textContent = textOrFallback(details.publishers);
  elements.dialogModes.textContent = textOrFallback(
    (details.game_modes ?? []).map(catalogLabel),
  );


  renderDialogBadges(details);
  renderGallery(details);
  updateFavoriteButton(elements.dialogFavorite, indexGame);
  updateOwnedButton(elements.dialogOwned, indexGame);
}

async function openDetails(game) {
  dialogReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  elements.dialogLoading.hidden = false;
  elements.dialogLoading.textContent = "Cargando detalles...";
  elements.dialogBody.hidden = true;

  if (!elements.dialog.open) {
    elements.dialog.showModal();
  }

  try {
    const details = await loadGameDetails(state.catalog, game);
    renderDetails(game, details);
    elements.dialogLoading.hidden = true;
    elements.dialogBody.hidden = false;
  } catch (error) {
    elements.dialogLoading.textContent =
      "No se pudieron cargar los detalles de este juego.";
    console.error(error);
  }
}

function closeDialog() {
  if (elements.dialog.open) {
    elements.dialog.close();
  }
}

function restoreDialogFocus() {
  if (dialogReturnFocus?.isConnected) {
    dialogReturnFocus.focus({ preventScroll: true });
  }
  dialogReturnFocus = null;
}

function bindEvents() {
  elements.query.addEventListener("input", () => {
    state.query = elements.query.value;
    state.page = 1;
    renderResults();
  });

  elements.platform.addEventListener("change", () => {
    state.platform = elements.platform.value;
    state.page = 1;
    renderResults();
  });

  elements.genre.addEventListener("change", () => {
    state.genre = elements.genre.value;
    state.page = 1;
    renderResults();
  });

  elements.mode.addEventListener("change", () => {
    state.mode = elements.mode.value;
    state.page = 1;
    renderResults();
  });

  elements.sort.addEventListener("change", () => {
    state.sort = elements.sort.value;
    state.page = 1;
    renderResults();
  });

  elements.clear.addEventListener("click", resetFilters);
  elements.retry.addEventListener("click", () => {
    initialized = false;
    void initializeCatalogExplorer();
  });

  elements.previous.addEventListener("click", () => {
    if (state.page <= 1) return;
    state.page -= 1;
    renderResults();
    elements.grid.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  });

  elements.next.addEventListener("click", () => {
    state.page += 1;
    renderResults();
    elements.grid.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  });

  elements.dialogClose.addEventListener("click", closeDialog);
  elements.dialog.addEventListener("close", restoreDialogFocus);

  elements.dialog.addEventListener("click", (event) => {
    if (event.target === elements.dialog) {
      closeDialog();
    }
  });

  elements.dialogFavorite.addEventListener("click", () => {
    if (!state.selectedGame) return;
    toggleCatalogFavorite(state.selectedGame, elements.dialogFavorite);
    renderResults();
  });

  elements.dialogOwned.addEventListener("click", () => {
    if (!state.selectedGame) return;
    toggleCatalogOwned(
      state.selectedGame,
      elements.dialogFavorite,
      elements.dialogOwned,
    );
    renderResults();
  });

  window.addEventListener("heartagram:favorites-changed", () => {
    if (state.catalog) {
      renderResults();
    }
  });

  window.addEventListener("heartagram:library-changed", () => {
    if (state.catalog) {
      renderResults();
    }
  });
}

export async function initializeCatalogExplorer() {
  if (initialized) return state.catalog;

  cacheElements();
  bindEvents();

  elements.loading.hidden = false;
  elements.statusLabel.textContent = "Cargando catálogo...";
  elements.retry.hidden = true;
  elements.content.hidden = true;

  try {
    state.catalog = await loadCatalog();
    state.facets = getCatalogFacets(state.catalog);

    fillSelect(elements.genre, state.facets.genres, "Todos");
    fillSelect(elements.mode, state.facets.modes, "Todos");

    elements.content.hidden = false;
    renderCatalogSkeletons();
    requestAnimationFrame(renderResults);

    elements.loading.hidden = true;
    initialized = true;

    return state.catalog;
  } catch (error) {
    elements.statusLabel.textContent =
      "No se pudo abrir el catálogo. La colección local sigue disponible.";
    elements.retry.hidden = false;
    console.error(error);
    throw error;
  }
}

export function isCatalogInitialized() {
  return initialized;
}

export async function openCatalogGameDetails(game) {
  await initializeCatalogExplorer();
  await openDetails(game);
}

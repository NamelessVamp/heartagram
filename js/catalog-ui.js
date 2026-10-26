import { catalogLabel, formatPricedAt, formatSaleEnd } from "./catalog-labels.js?v=v135";

// Renders the Nintendo Store Mexico catalog explorer.

import {
  countOnSale,
  favoriteIdForCatalogGame,
  getCatalogFacets,
  catalogImageUrl,
  loadCatalog,
  loadGameDetails,
  queryCatalog,
} from "./catalog.js?v=v135";

import { isFavorite, toggleFavorite } from "./favorites.js";
import { isOwnedGame, setOwnedGame } from "./library.js";

import { renderNintendoProductDetail } from "./nintendo-product-detail.js?v=v135";

const PAGE_SIZE = 24;
// The dialog is labelled by the product title once the detail is rendered.
const DIALOG_TITLE_ID = "catalog-dialog-title";

const state = {
  catalog: null,
  facets: null,
  query: "",
  platform: "ALL",
  genre: "ALL",
  mode: "ALL",
  onSale: false,
  sort: "NAME",
  page: 1,
};

const elements = {};
// One in-flight load, and listeners bound once, however often Explorar is opened.
let initPromise = null;
let eventsBound = false;
const renderedGames = new Map();
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
  elements.sale = byId("catalog-sale");
  elements.saleLabel = byId("catalog-sale-label");
  elements.priceNote = byId("catalog-price-note");
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
  elements.nintendoProductDetail = byId("nintendo-product-detail");
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

function renderActiveFilters() {
  const filters = [
    state.query.trim() ? ["query", `Buscar: ${state.query.trim()}`] : null,
    state.platform !== "ALL" ? ["platform", platformLabel(state.platform)] : null,
    state.genre !== "ALL" ? ["genre", catalogLabel(state.genre)] : null,
    state.mode !== "ALL" ? ["mode", catalogLabel(state.mode)] : null,
    state.onSale ? ["onSale", "En oferta"] : null,
    state.sort !== "NAME" ? ["sort", state.sort === "DISCOUNT" ? "Mayor descuento" : "Más recientes"] : null,
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
  } else if (key === "onSale") {
    state.onSale = false;
    elements.sale.checked = false;
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

  if (game.sale_price !== null && game.percent_off > 0) {
    media.append(createElement("span", "catalog-card-sale", `−${Math.round(game.percent_off)} %`));
    const until = game.sale_end ? ` · hasta el ${formatSaleEnd(game.sale_end)}` : "";
    body.append(createElement("p", "catalog-card-sale-note", `Antes ${game.regular_price_label}${until}`));
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
    onSale: state.onSale,
    sort: state.sort,
    page: state.page,
    pageSize: PAGE_SIZE,
  });

  state.page = result.page;
  renderedGames.clear();
  result.games.forEach((game) => renderedGames.set(String(game.nsuid), game));
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
  state.onSale = false;
  state.sort = "NAME";
  state.page = 1;

  elements.query.value = "";
  elements.sale.checked = false;
  elements.platform.value = "ALL";
  elements.genre.value = "ALL";
  elements.mode.value = "ALL";
  elements.sort.value = "NAME";

  renderResults();
}

function renderDetails(game, details) {
  renderNintendoProductDetail(elements.nintendoProductDetail, details, game);
  elements.nintendoProductDetail.querySelector(".npd-title")?.setAttribute("id", DIALOG_TITLE_ID);
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

  elements.sale.addEventListener("change", () => {
    state.onSale = elements.sale.checked;
    state.page = 1;
    renderResults();
  });

  elements.clear.addEventListener("click", resetFilters);
  elements.retry.addEventListener("click", () => {
    void initializeCatalogExplorer().catch(() => {});
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

  // Update buttons in place: rebuilding the grid would drop keyboard focus.
  window.addEventListener("heartagram:favorites-changed", refreshCardButtons);
  window.addEventListener("heartagram:library-changed", refreshCardButtons);
}

function refreshCardButtons() {
  elements.grid.querySelectorAll("[data-catalog-favorite]").forEach((button) => {
    const game = renderedGames.get(button.dataset.catalogFavorite);
    if (game) updateFavoriteButton(button, game);
  });
  elements.grid.querySelectorAll("[data-catalog-owned]").forEach((button) => {
    const game = renderedGames.get(button.dataset.catalogOwned);
    if (game) updateOwnedButton(button, game);
  });
}

export function initializeCatalogExplorer() {
  initPromise ??= loadExplorer().catch((error) => {
    initPromise = null;
    throw error;
  });
  return initPromise;
}

async function loadExplorer() {
  if (!eventsBound) {
    cacheElements();
    bindEvents();
    eventsBound = true;
  }

  elements.loading.hidden = false;
  elements.statusLabel.textContent = "Cargando catálogo...";
  elements.retry.hidden = true;
  elements.content.hidden = true;

  try {
    state.catalog = await loadCatalog();
    state.facets = getCatalogFacets(state.catalog);

    fillSelect(elements.genre, state.facets.genres, "Todos");
    fillSelect(elements.mode, state.facets.modes, "Todos");

    const onSale = countOnSale(state.catalog);
    elements.saleLabel.textContent = `Solo en oferta (${onSale})`;
    elements.sale.disabled = onSale === 0;
    const pricedAt = formatPricedAt(state.catalog.meta?.priced_at);
    elements.priceNote.textContent = pricedAt
      ? `Precios y ofertas de Nintendo Store México al ${pricedAt}. Pueden haber cambiado: confírmalos en la eShop antes de comprar.`
      : "";

    elements.content.hidden = false;
    renderCatalogSkeletons();
    requestAnimationFrame(renderResults);

    elements.loading.hidden = true;

    return state.catalog;
  } catch (error) {
    elements.statusLabel.textContent =
      "No se pudo abrir el catálogo. La colección local sigue disponible.";
    elements.retry.hidden = false;
    console.error(error);
    throw error;
  }
}

export async function openCatalogGameDetails(game) {
  await initializeCatalogExplorer();
  await openDetails(game);
}

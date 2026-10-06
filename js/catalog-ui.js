// Renders HEARTAGRAM's broad IGDB catalog explorer.

import {
  favoriteIdForCatalogGame,
  getCatalogFacets,
  loadCatalog,
  loadGameDetails,
  queryCatalog,
} from "./catalog.js";

import { isFavorite, toggleFavorite } from "./favorites.js";

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

function byId(id) {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Falta el elemento #${id}`);
  }

  return element;
}

function cacheElements() {
  elements.loading = byId("catalog-loading");
  elements.content = byId("catalog-content");
  elements.query = byId("catalog-query");
  elements.platform = byId("catalog-platform");
  elements.genre = byId("catalog-genre");
  elements.mode = byId("catalog-mode");
  elements.sort = byId("catalog-sort");
  elements.count = byId("catalog-count");
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
  elements.dialogSummary = byId("catalog-dialog-summary");
  elements.dialogStorySection = byId("catalog-dialog-story-section");
  elements.dialogStory = byId("catalog-dialog-story");
  elements.dialogRelease = byId("catalog-dialog-release");
  elements.dialogDevelopers = byId("catalog-dialog-developers");
  elements.dialogPublishers = byId("catalog-dialog-publishers");
  elements.dialogModes = byId("catalog-dialog-modes");
  elements.dialogGallery = byId("catalog-dialog-gallery");
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
    select.append(new Option(value, value));
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

function createBadges(game) {
  const container = createElement("div", "card-badges");
  const labels = [
    ...(game.platforms ?? []).map(platformLabel),
    ...(game.genres ?? []).slice(0, 2),
  ];

  labels.forEach((label) => {
    container.append(createElement("span", "badge", label));
  });

  return container;
}

function createCatalogCard(game) {
  const card = createElement("article", "catalog-card");

  const openButton = createElement("button", "catalog-card-open");

  openButton.type = "button";
  openButton.dataset.igdbId = String(game.igdb_id);

  openButton.setAttribute("aria-label", `Ver detalles de ${game.name}`);

  const media = createElement("div", "catalog-card-media");

  const image = document.createElement("img");

  image.src = game.cover;
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

      const fallback = createElement(
        "div",
        "catalog-card-cover-fallback",
        "PORTADA NO DISPONIBLE",
      );

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

  const metadata = [game.release_year, game.game_type].filter(Boolean);

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
  favoriteButton.dataset.catalogFavorite = String(game.igdb_id);

  updateFavoriteButton(favoriteButton, game);

  favoriteButton.addEventListener("click", () => {
    toggleCatalogFavorite(game, favoriteButton);
  });

  openButton.addEventListener("click", () => {
    openDetails(game);
  });

  card.append(openButton, favoriteButton);

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
    elements.grid.append(
      createElement(
        "p",
        "empty catalog-empty",
        "No encontramos juegos con esos filtros.",
      ),
    );
  } else {
    const fragment = document.createDocumentFragment();

    result.games.forEach((game) => {
      fragment.append(createCatalogCard(game));
    });

    elements.grid.append(fragment);
  }

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

  const labels = [...platforms, ...(details.genres ?? []).slice(0, 3)];

  labels.forEach((label) => {
    elements.dialogBadges.append(createElement("span", "badge", label));
  });
}

function renderGallery(details) {
  elements.dialogGallery.replaceChildren();

  const images = [
    details.cover?.url_2x,
    ...(details.screenshots ?? []),
    ...(details.artworks ?? []),
  ].filter(Boolean);

  images.slice(0, 6).forEach((source, index) => {
    const image = document.createElement("img");
    image.src = source;
    image.alt =
      index === 0
        ? `Portada de ${details.name}`
        : `Imagen ${index + 1} de ${details.name}`;
    image.loading = "lazy";
    image.decoding = "async";
    elements.dialogGallery.append(image);
  });
}

function textOrFallback(values, fallback = "No disponible") {
  if (Array.isArray(values)) {
    return values.length ? values.join(", ") : fallback;
  }

  return values || fallback;
}

function renderDetails(indexGame, details) {
  state.selectedGame = indexGame;

  const platforms = (details.platforms ?? [])
    .map((platform) => platform.name)
    .filter(Boolean);

  elements.dialogPlatforms.textContent = textOrFallback(platforms);
  elements.dialogTitle.textContent = details.name;
  elements.dialogSummary.textContent =
    details.summary || "IGDB todavía no tiene una descripción para este juego.";

  const hasStory = Boolean(details.storyline);
  elements.dialogStorySection.hidden = !hasStory;
  elements.dialogStory.textContent = details.storyline || "";

  elements.dialogRelease.textContent = details.release_date || "Por confirmar";
  elements.dialogDevelopers.textContent = textOrFallback(details.developers);
  elements.dialogPublishers.textContent = textOrFallback(details.publishers);
  elements.dialogModes.textContent = textOrFallback(details.game_modes);

  renderDialogBadges(details);
  renderGallery(details);
  updateFavoriteButton(elements.dialogFavorite, indexGame);
}

async function openDetails(game) {
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

  elements.previous.addEventListener("click", () => {
    if (state.page <= 1) return;
    state.page -= 1;
    renderResults();
    elements.grid.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  elements.next.addEventListener("click", () => {
    state.page += 1;
    renderResults();
    elements.grid.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  elements.dialogClose.addEventListener("click", closeDialog);

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

  window.addEventListener("heartagram:favorites-changed", () => {
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
  elements.loading.textContent = "Cargando catálogo...";
  elements.content.hidden = true;

  try {
    state.catalog = await loadCatalog();
    state.facets = getCatalogFacets(state.catalog);

    fillSelect(elements.genre, state.facets.genres, "Todos");
    fillSelect(elements.mode, state.facets.modes, "Todos");

    renderResults();

    elements.loading.hidden = true;
    elements.content.hidden = false;
    initialized = true;

    return state.catalog;
  } catch (error) {
    elements.loading.textContent =
      "El catálogo todavía no está disponible en esta versión.";
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

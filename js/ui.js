import { PLAYER_DIMENSIONS, PLAYER_DIMENSION_LABELS, normalizedTraitPercent, traitSignal } from "./player-journey.js?v=p2";
import { catalogLabel, curatedGenreLabel } from "./catalog-labels.js";
import { catalogImageUrl } from "./catalog.js?v=v131";

// All DOM rendering lives here. Logic modules never touch the DOM.

import { DIMENSIONS } from "./profile.js";
import { duoBadges } from "./recommender.js";
import { isFavorite, toggleFavorite } from "./favorites.js";

const DIMENSION_LABELS = {
  pace: "Ritmo",
  social: "Social",
  structure: "Libertad",
  session: "Sesiones",
  mood: "Oscuridad",
  challenge: "Reto",
};

const RADAR = { SIZE: 320, RADIUS: 110, RINGS: 4 };

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}


/* ---------- Quiz ---------- */

export function renderQuestion(question, index, total, selectedId, onSelect) {
  const current = index + 1;
  document.getElementById("quiz-counter").textContent =
    `Pregunta ${current} de ${total}`;
  document.getElementById("quiz-question").textContent = question.text;

  const bar = document.getElementById("quiz-progress-bar");
  bar.style.width = `${(current / total) * 100}%`;
  bar.parentElement.setAttribute("aria-valuenow", String(current));
  bar.parentElement.setAttribute("aria-valuetext", `Pregunta ${current} de ${total}`);

  const container = document.getElementById("quiz-options");
  container.replaceChildren();

  question.options.forEach((option, optionIndex) => {
    const button = el("button", "quiz-option");
    button.type = "button";
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", String(option.id === selectedId));
    button.tabIndex = option.id === selectedId || (!selectedId && optionIndex === 0) ? 0 : -1;

    const number = el("span", "quiz-option-index", String(optionIndex + 1).padStart(2, "0"));
    number.setAttribute("aria-hidden", "true");
    const copy = el("span", "quiz-option-copy", option.text);
    button.append(number, copy);

    button.addEventListener("click", () => {
      container.querySelectorAll(".quiz-option").forEach((candidate) => {
        candidate.setAttribute("aria-checked", "false");
        candidate.tabIndex = -1;
      });
      button.setAttribute("aria-checked", "true");
      button.tabIndex = 0;
      onSelect(option.id);
    });
    container.append(button);
  });

  container.onkeydown = (event) => {
    if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].includes(event.key)) return;
    event.preventDefault();
    const options = [...container.querySelectorAll(".quiz-option")];
    const activeIndex = Math.max(0, options.indexOf(document.activeElement));
    const direction = ["ArrowDown", "ArrowRight"].includes(event.key) ? 1 : -1;
    const target = options[(activeIndex + direction + options.length) % options.length];
    options.forEach((option) => { option.tabIndex = -1; });
    target.tabIndex = 0;
    target.focus();
  };
}

/* ---------- Profile ---------- */

function findProfileCombo(combos, primaryId, secondaryId) {
  return (
    combos[`${primaryId}|${secondaryId}`] ??
    combos[`${secondaryId}|${primaryId}`] ??
    null
  );
}

/**
 * Builds the profile copy for any archetype pair.
 * Hand-written combos win; otherwise the primary archetype leads
 * and the secondary adds one closing line.
 */
function buildProfileCopy(primary, secondary, combo) {
  if (combo) return combo;
  return {
    summary: primary.hook,
    body: `${primary.body} ${secondary.also}`,
  };
}

export function renderProfile(
  profile,
  archetypes,
  profileTexts,
  profileCombos,
) {
  const primaryId = profile.archetypes.primary;
  const secondaryId = profile.archetypes.secondary;
  const primary = profileTexts[primaryId];
  const secondary = profileTexts[secondaryId];

  const copy = buildProfileCopy(
    primary,
    secondary,
    findProfileCombo(profileCombos, primaryId, secondaryId),
  );

  document.getElementById("profile-title").textContent = primary.title;
  document.getElementById("profile-subtitle").textContent =
    `${primary.subtitle} · También: ${secondary.title}`;
  document.getElementById("profile-summary").textContent = copy.summary;
  document.getElementById("profile-body").textContent = copy.body;

  const traits = document.getElementById("profile-traits");
  traits.replaceChildren();
  PLAYER_DIMENSIONS.forEach((dimension) => {
    const value = profile.vector[dimension] ?? 0;
    const card = el("article", "profile-trait");
    const head = el("div", "profile-trait-head");
    head.append(
      el("span", "profile-trait-label", PLAYER_DIMENSION_LABELS[dimension]),
      el("span", "profile-trait-value", traitSignal(value)),
    );
    const track = el("div", "profile-trait-track");
    const fill = el("div", "profile-trait-fill");
    fill.style.width = `${normalizedTraitPercent(value)}%`;
    track.append(fill);
    card.append(head, track);
    traits.append(card);
  });

  drawRadar(document.getElementById("profile-radar"), profile.vector);
}

function drawRadar(canvas, vector) {
  const styles = getComputedStyle(document.documentElement);
  const color = (name) => styles.getPropertyValue(name).trim();
  const ratio = window.devicePixelRatio || 1;

  canvas.width = RADAR.SIZE * ratio;
  canvas.height = RADAR.SIZE * ratio;
  const ctx = canvas.getContext("2d");
  ctx.scale(ratio, ratio);

  const center = RADAR.SIZE / 2;
  const angle = (i) => (Math.PI * 2 * i) / DIMENSIONS.length - Math.PI / 2;
  const point = (i, r) => [
    center + Math.cos(angle(i)) * r,
    center + Math.sin(angle(i)) * r,
  ];

  ctx.strokeStyle = color("--color-border");
  ctx.lineWidth = 1;
  for (let ring = 1; ring <= RADAR.RINGS; ring++) {
    ctx.beginPath();
    DIMENSIONS.forEach((_, i) =>
      ctx.lineTo(...point(i, (RADAR.RADIUS * ring) / RADAR.RINGS)),
    );
    ctx.closePath();
    ctx.stroke();
  }

  ctx.fillStyle = color("--color-text-muted");
  ctx.font = "12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  DIMENSIONS.forEach((dim, i) =>
    ctx.fillText(DIMENSION_LABELS[dim], ...point(i, RADAR.RADIUS + 22)),
  );

  // Vector values are -2..+2; map to 0..1 of the radius.
  ctx.beginPath();
  DIMENSIONS.forEach((dim, i) =>
    ctx.lineTo(...point(i, (((vector[dim] ?? 0) + 2) / 4) * RADAR.RADIUS)),
  );
  ctx.closePath();
  ctx.fillStyle = "rgba(224, 98, 122, 0.25)";
  ctx.strokeStyle = color("--color-accent-strong");
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
}

/* ---------- Game cards ---------- */

function favoriteLabel(gameId) {
  return isFavorite(gameId) ? "♥ En mi lista" : "♡ Me interesa";
}

function favoriteAriaLabel(game) {
  return isFavorite(game.id)
    ? `Quitar ${game.title} de mi lista`
    : `Agregar ${game.title} a mi lista`;
}

export function gameCard(game, options = {}) {
  const {
    showBadges = false,
    showFavorite = true,
    onMoveToLibrary = null,
    onRemoveFromLibrary = null,
    libraryMode = false,
    variant = "default",
    sequence = null,
  } = options;

  const card = el("article", `card card-${variant}`);
  card.dataset.gameId = game.id;
  card.dataset.cardVariant = variant;

  if (sequence != null) {
    card.append(el("p", "card-sequence", `MATCH ${String(sequence).padStart(2, "0")}`));
  }

  const art = el("div", "card-signal-art");
  art.setAttribute("aria-hidden", "true");
  if (game.cover_url) {
    const cover = document.createElement("img");
    cover.className = "card-signal-cover";
    cover.src = game.cover_url;
    cover.alt = "";
    cover.loading = "lazy";
    cover.decoding = "async";
    cover.addEventListener("error", () => {
      art.classList.remove("has-cover");
      cover.replaceWith(el("span", "card-signal-fallback", game.title));
    }, { once: true });
    art.classList.add("has-cover");
    art.append(cover);
  } else {
    art.append(el("span", "card-signal-fallback", game.title));
  }
  card.append(art, el("h4", "card-title", game.title));

  const safeGenres = Array.isArray(game.genres) ? game.genres.slice(0, 3) : [];
  if (safeGenres.length) {
    const meta = el("p", "card-signal-meta", safeGenres.map(curatedGenreLabel).join(" · "));
    card.append(meta);
  }

  if (game.why) card.append(el("p", "card-why", game.why));
  if (game.couple.includes("INTI_LIBRARY_MATCH")) {
    card.append(el("p", "card-owned", "Inti ya lo tiene"));
  }

  if (showBadges) {
    const badges = el("div", "card-badges");
    duoBadges(game).forEach((label) => badges.append(el("span", "badge", label)));
    card.append(badges);
  }

  const actions = el("div", "library-card-actions");

  if (showFavorite && !libraryMode) {
    const favoriteButton = el("button", "favorite-button", favoriteLabel(game.id));
    favoriteButton.type = "button";
    favoriteButton.dataset.favoriteId = game.id;
    favoriteButton.dataset.gameTitle = game.title;
    favoriteButton.setAttribute("aria-label", favoriteAriaLabel(game));
    favoriteButton.setAttribute("aria-pressed", String(isFavorite(game.id)));
    favoriteButton.addEventListener("click", () => {
      const selected = toggleFavorite(game.id);
      favoriteButton.textContent = selected ? "♥ En mi lista" : "♡ Me interesa";
      favoriteButton.setAttribute("aria-pressed", String(selected));
      favoriteButton.setAttribute("aria-label", favoriteAriaLabel(game));
    });
    actions.append(favoriteButton);
  }

  if (!libraryMode && typeof onMoveToLibrary === "function") {
    const ownedButton = el("button", "library-button", "Ya lo tengo");
    ownedButton.type = "button";
    ownedButton.setAttribute("aria-label", `Mover ${game.title} a Mi biblioteca`);
    ownedButton.addEventListener("click", () => onMoveToLibrary(game));
    actions.append(ownedButton);
  }

  if (libraryMode && typeof onRemoveFromLibrary === "function") {
    const removeButton = el(
      "button",
      "library-button library-button-remove",
      "Quitar de mi biblioteca",
    );
    removeButton.type = "button";
    removeButton.setAttribute("aria-label", `Quitar ${game.title} de Mi biblioteca`);
    removeButton.addEventListener("click", () => onRemoveFromLibrary(game));
    actions.append(removeButton);
  }

  if (actions.children.length > 0) card.append(actions);
  return card;
}

function renderList(
  containerTarget,
  games,
  options,
  emptyText = "Nada por aquí todavía.",
) {
  const container =
    typeof containerTarget === "string"
      ? document.getElementById(containerTarget)
      : containerTarget;
  container.replaceChildren();
  if (games.length === 0) {
    container.append(el("p", "empty", emptyText));
    return;
  }
  games.forEach((game) => container.append(gameCard(game, options)));
}

export function renderResults(sections) {
  const forYou = document.getElementById("list-for-you");
  const matches = sections.forYou.slice(0, 3).map(({ game }) => game);
  forYou.replaceChildren();

  if (!matches.length) {
    forYou.append(el("p", "empty", "Por ahora no hay juegos para mostrar con tu perfil."));
  } else {
    forYou.append(gameCard(matches[0], { variant: "hero", sequence: 1 }));
    if (matches.length > 1) {
      const support = el("div", "discover-support-grid");
      matches.slice(1).forEach((game, index) => {
        support.append(gameCard(game, { variant: "support", sequence: index + 2 }));
      });
      forYou.append(support);
    }
  }

  renderList(
    "list-might-hook",
    sections.mightHook.slice(0, 6).map(({ game }) => game),
    { variant: "archive" },
  );
  renderList(
    "list-out-of-zone",
    sections.outOfZone ? [sections.outOfZone.game] : [],
    { variant: "wildcard", sequence: "X" },
  );
}

export function renderDuo(duo) {
  renderList(
    "list-duo",
    duo.slice(0, 3).map(({ game }) => game),
    { variant: "duo" },
  );
}

function createWishlistHeading(title, description) {
  const heading = el("header", "wishlist-section-heading");

  heading.append(
    el("h3", "wishlist-section-title", title),
    el("p", "wishlist-section-description", description),
  );

  return heading;
}

function createCatalogWishlistCard(game, options) {
  const {
    onOpenCatalogGame,
    onRemoveCatalogGame,
    onMoveToLibrary,
    onRemoveFromLibrary,
    libraryMode = false,
  } = options;

  const card = el("article", "catalog-wishlist-card");
  const media = el("div", "catalog-wishlist-media");
  const image = document.createElement("img");
  image.src = catalogImageUrl(game.cover, "cover_big");
  image.alt = `Portada de ${game.name}`;
  image.loading = "lazy";
  image.decoding = "async";
  image.addEventListener("error", () => {
    image.remove();
    if (media.querySelector(".catalog-card-cover-fallback")) return;
    const fallback = el("div", "catalog-card-cover-fallback", "H");
    fallback.setAttribute("aria-hidden", "true");
    media.append(fallback);
  }, { once: true });
  media.append(image);

  const copy = el("div", "catalog-wishlist-copy");
  copy.append(el("h4", "catalog-wishlist-title", game.name));
  const metadata = [
    game.release_year,
    ...(game.platforms ?? []).map((platform) =>
      platform === "SWITCH_2" ? "Switch 2" : "Switch"),
  ].filter(Boolean);
  if (metadata.length) {
    copy.append(el("p", "catalog-wishlist-meta", metadata.join(" · ")));
  }

  const badges = el("div", "card-badges");
  (game.genres ?? []).slice(0, 3).forEach((genre) =>
    badges.append(el("span", "badge", catalogLabel(genre))));
  copy.append(badges);

  const actions = el("div", "catalog-wishlist-actions");
  const detailsButton = el("button", "btn btn-ghost", "Ver detalles");
  detailsButton.type = "button";
  detailsButton.addEventListener("click", () => onOpenCatalogGame?.(game));
  actions.append(detailsButton);

  if (!libraryMode) {
    const removeButton = el("button", "favorite-button", "♥ En mi lista");
    removeButton.type = "button";
    removeButton.setAttribute("aria-pressed", "true");
    removeButton.setAttribute("aria-label", `Quitar ${game.name} de mi lista`);
    removeButton.addEventListener("click", () => onRemoveCatalogGame?.(game));

    const ownedButton = el("button", "library-button", "Ya lo tengo");
    ownedButton.type = "button";
    ownedButton.setAttribute("aria-label", `Mover ${game.name} a Mi biblioteca`);
    ownedButton.addEventListener("click", () => onMoveToLibrary?.(game));
    actions.append(removeButton, ownedButton);
  } else {
    const removeButton = el(
      "button",
      "library-button library-button-remove",
      "Quitar de mi biblioteca",
    );
    removeButton.type = "button";
    removeButton.setAttribute("aria-label", `Quitar ${game.name} de Mi biblioteca`);
    removeButton.addEventListener("click", () => onRemoveFromLibrary?.(game));
    actions.append(removeButton);
  }

  copy.append(actions);
  card.append(media, copy);
  return card;
}

export function renderWishlist(options = {}) {
  const {
    interestedCuratedGames = [],
    interestedCatalogGames = [],
    ownedCuratedGames = [],
    ownedCatalogGames = [],
    catalogLoading = false,
    catalogError = false,
    onOpenCatalogGame,
    onRemoveCatalogGame,
    onMoveCuratedToLibrary,
    onRemoveCuratedFromLibrary,
    onMoveCatalogToLibrary,
    onRemoveCatalogFromLibrary,
  } = options;

  const container = document.getElementById("list-wishlist");
  container.replaceChildren();
  const hasInterested = interestedCuratedGames.length > 0 || interestedCatalogGames.length > 0;
  const hasOwned = ownedCuratedGames.length > 0 || ownedCatalogGames.length > 0;

  const interestedSection = el("section", "wishlist-section");
  interestedSection.id = "collection-panel-interested";
  interestedSection.dataset.collectionPanel = "interested";
  interestedSection.setAttribute("role", "tabpanel");
  interestedSection.setAttribute("aria-labelledby", "collection-tab-interested");
  const interestedContent = el("div", "wishlist-group");
  interestedSection.append(
    createWishlistHeading("Me interesa", "Juegos guardados para revisar, comparar o comprar después."),
    interestedContent,
  );

  if (interestedCuratedGames.length > 0) {
    const list = el("div", "wishlist-curated-list");
    interestedContent.append(
      createWishlistHeading("Elegidos para ti", "Juegos guardados desde tus recomendaciones personalizadas."),
      list,
    );
    renderList(list, interestedCuratedGames, {
      showBadges: true,
      showFavorite: true,
      onMoveToLibrary: onMoveCuratedToLibrary,
    }, "");
  }

  const catalogList = el("div", "catalog-wishlist-list");
  interestedContent.append(
    createWishlistHeading("Descubiertos en Explorar", "Juegos guardados mientras navegabas por el catálogo."),
    catalogList,
  );

  if (catalogLoading && interestedCatalogGames.length === 0) {
    catalogList.append(el("p", "catalog-status", "Cargando juegos guardados..."));
  } else if (catalogError && interestedCatalogGames.length === 0) {
    catalogList.append(el("p", "catalog-status", "No se pudieron cargar algunos juegos del catálogo."));
  } else if (interestedCatalogGames.length === 0) {
    catalogList.append(el("p", "empty", "Todavía no has guardado juegos desde Explorar."));
  } else {
    const fragment = document.createDocumentFragment();
    interestedCatalogGames.forEach((game) => fragment.append(
      createCatalogWishlistCard(game, {
        onOpenCatalogGame,
        onRemoveCatalogGame,
        onMoveToLibrary: onMoveCatalogToLibrary,
        libraryMode: false,
      }),
    ));
    catalogList.append(fragment);
  }
  container.append(interestedSection);

  const librarySection = el("section", "wishlist-section library-section");
  librarySection.id = "collection-panel-owned";
  librarySection.dataset.collectionPanel = "owned";
  librarySection.setAttribute("role", "tabpanel");
  librarySection.setAttribute("aria-labelledby", "collection-tab-owned");
  const libraryContent = el("div", "wishlist-group");
  librarySection.append(
    createWishlistHeading(
      "Mi biblioteca",
      "Juegos que ya tienes. Esta sección seguirá aquí después de usar el regalo.",
    ),
    libraryContent,
  );

  if (!hasOwned && !catalogLoading) {
    libraryContent.append(el(
      "p",
      "empty",
      "Cuando ya tengas un juego, usa el botón ‘Ya lo tengo’ para moverlo aquí.",
    ));
  }

  if (ownedCuratedGames.length > 0) {
    const list = el("div", "wishlist-curated-list");
    libraryContent.append(list);
    renderList(list, ownedCuratedGames, {
      showBadges: true,
      showFavorite: false,
      libraryMode: true,
      onRemoveFromLibrary: onRemoveCuratedFromLibrary,
    }, "");
  }

  if (ownedCatalogGames.length > 0) {
    const list = el("div", "catalog-wishlist-list");
    const fragment = document.createDocumentFragment();
    ownedCatalogGames.forEach((game) => fragment.append(
      createCatalogWishlistCard(game, {
        onOpenCatalogGame,
        onRemoveFromLibrary: onRemoveCatalogFromLibrary,
        libraryMode: true,
      }),
    ));
    list.append(fragment);
    libraryContent.append(list);
  } else if (catalogLoading && ownedCuratedGames.length === 0) {
    libraryContent.append(el("p", "catalog-status", "Cargando Mi biblioteca..."));
  }

  container.append(librarySection);

  const counts = {
    interested: interestedCuratedGames.length + interestedCatalogGames.length,
    owned: ownedCuratedGames.length + ownedCatalogGames.length,
  };

  window.dispatchEvent(
    new CustomEvent("heartagram:collection-rendered", {
      detail: { counts },
    }),
  );
}


function decorateCollectionPanel(panel, type) {
  if (!panel) return;
  panel.classList.toggle("collection-panel-interested", type === "interested");
  panel.classList.toggle("collection-panel-owned", type === "owned");

  panel.querySelectorAll(".card, .catalog-wishlist-card").forEach((card) => {
    card.dataset.collectionType = type;
    if (type === "owned" && !card.querySelector(".collection-owned-seal")) {
      const seal = document.createElement("span");
      seal.className = "collection-owned-seal";
      seal.textContent = "EN TU BIBLIOTECA";
      card.prepend(seal);
    }
  });

  // The full empty state only makes sense when the panel has no cards at all.
  if (panel.querySelector(".card, .catalog-wishlist-card")) return;

  const empty = panel.querySelector(".empty");
  if (!empty || empty.dataset.collectionEnhanced === "true") return;
  empty.dataset.collectionEnhanced = "true";
  empty.classList.add("collection-empty-state");
  empty.replaceChildren();

  const mark = document.createElement("span");
  mark.className = "collection-empty-mark";
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = type === "owned" ? "◇" : "♡";

  const title = document.createElement("h3");
  title.className = "collection-empty-title";
  title.textContent = type === "owned" ? "Aquí irán los juegos que ya tienes" : "Todavía no has apartado ningún juego";

  const copy = document.createElement("p");
  copy.className = "collection-empty-copy";
  copy.textContent = type === "owned"
    ? "Marca Ya lo tengo desde Explorar o mueve aquí un juego de Me interesa."
    : "Explora el catálogo y guarda juegos para revisarlos después.";

  const action = document.createElement("button");
  action.type = "button";
  action.className = "btn btn-primary";
  action.dataset.action = "to-catalog";
  action.textContent = "Explorar juegos";

  empty.append(mark, title, copy, action);
}

// Cards are drawn once, so a change made elsewhere (Mi lista, another card) must
// reach every favorite button that is already on screen.
function syncFavoriteButtons() {
  document.querySelectorAll(".favorite-button[data-favorite-id]").forEach((button) => {
    const selected = isFavorite(button.dataset.favoriteId);
    button.textContent = selected ? "♥ En mi lista" : "♡ Me interesa";
    button.setAttribute("aria-pressed", String(selected));
    if (button.dataset.gameTitle) {
      button.setAttribute("aria-label", favoriteAriaLabel({ id: button.dataset.favoriteId, title: button.dataset.gameTitle }));
    }
  });
}

window.addEventListener("heartagram:favorites-changed", syncFavoriteButtons);

window.addEventListener("heartagram:collection-rendered", () => {
  decorateCollectionPanel(document.getElementById("collection-panel-interested"), "interested");
  decorateCollectionPanel(document.getElementById("collection-panel-owned"), "owned");
});

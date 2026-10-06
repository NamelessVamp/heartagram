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

export function formatPrice(game) {
  if (game.free_to_play) return "Gratis";
  if (Number.isInteger(game.price_mxn))
    return `$${game.price_mxn.toLocaleString("es-MX")} MXN`;
  return "Precio por confirmar";
}

/* ---------- Quiz ---------- */

export function renderQuestion(question, index, total, selectedId, onSelect) {
  document.getElementById("quiz-counter").textContent =
    `Pregunta ${index + 1} de ${total}`;
  document.getElementById("quiz-question").textContent = question.text;

  const bar = document.getElementById("quiz-progress-bar");
  bar.style.width = `${(index / total) * 100}%`;
  bar.parentElement.setAttribute("aria-valuenow", String(index));

  const container = document.getElementById("quiz-options");
  container.replaceChildren();

  for (const option of question.options) {
    const button = el("button", "quiz-option", option.text);
    button.type = "button";
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", String(option.id === selectedId));
    button.addEventListener("click", () => {
      container
        .querySelectorAll(".quiz-option")
        .forEach((b) => b.setAttribute("aria-checked", "false"));
      button.setAttribute("aria-checked", "true");
      onSelect(option.id);
    });
    container.append(button);
  }
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

  document.getElementById("profile-title").textContent =
    `${primary.title} · ${secondary.title}`;
  document.getElementById("profile-subtitle").textContent =
    `${primary.subtitle} · ${secondary.subtitle}`;
  document.getElementById("profile-summary").textContent = copy.summary;
  document.getElementById("profile-body").textContent = copy.body;

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

function gameCard(game, { showBadges = false, showFavorite = true } = {}) {
  const card = el("article", "card");
  card.dataset.gameId = game.id;

  card.append(
    el("h4", "card-title", game.title),
    el("p", "card-price", formatPrice(game)),
  );

  if (game.why) {
    card.append(el("p", "card-why", game.why));
  }

  if (game.couple.includes("INTI_LIBRARY_MATCH")) {
    card.append(el("p", "card-owned", "Inti ya lo tiene"));
  }

  if (showBadges) {
    const badges = el("div", "card-badges");

    duoBadges(game).forEach((label) => {
      badges.append(el("span", "badge", label));
    });

    card.append(badges);
  }

  if (showFavorite) {
    const favoriteButton = el(
      "button",
      "favorite-button",
      favoriteLabel(game.id),
    );

    favoriteButton.type = "button";
    favoriteButton.dataset.favoriteId = game.id;
    favoriteButton.setAttribute("aria-label", favoriteAriaLabel(game));
    favoriteButton.setAttribute("aria-pressed", String(isFavorite(game.id)));

    favoriteButton.addEventListener("click", () => {
      const selected = toggleFavorite(game.id);

      favoriteButton.textContent = selected ? "♥ En mi lista" : "♡ Me interesa";

      favoriteButton.setAttribute("aria-pressed", String(selected));

      favoriteButton.setAttribute("aria-label", favoriteAriaLabel(game));
    });

    card.append(favoriteButton);
  }

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
  renderList(
    "list-for-you",
    sections.forYou.map(({ game }) => game),
  );
  renderList(
    "list-might-hook",
    sections.mightHook.map(({ game }) => game),
  );
  renderList(
    "list-out-of-zone",
    sections.outOfZone ? [sections.outOfZone.game] : [],
  );
}

export function renderDuo(duo) {
  renderList(
    "list-duo",
    duo.map(({ game }) => game),
    { showBadges: true },
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

function createCatalogWishlistCard(
  game,
  { onOpenCatalogGame, onRemoveCatalogGame },
) {
  const card = el("article", "catalog-wishlist-card");

  const media = el("div", "catalog-wishlist-media");

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

      const fallback = el("div", "catalog-card-cover-fallback", "SIN PORTADA");

      fallback.setAttribute("aria-hidden", "true");

      media.append(fallback);
    },
    {
      once: true,
    },
  );

  media.append(image);

  const copy = el("div", "catalog-wishlist-copy");

  copy.append(el("h4", "catalog-wishlist-title", game.name));

  const metadata = [
    game.release_year,
    ...(game.platforms ?? []).map((platform) =>
      platform === "SWITCH_2" ? "Switch 2" : "Switch",
    ),
  ].filter(Boolean);

  if (metadata.length) {
    copy.append(el("p", "catalog-wishlist-meta", metadata.join(" · ")));
  }

  const badges = el("div", "card-badges");

  (game.genres ?? []).slice(0, 3).forEach((genre) => {
    badges.append(el("span", "badge", genre));
  });

  copy.append(badges);

  const actions = el("div", "catalog-wishlist-actions");

  const detailsButton = el("button", "btn btn-ghost", "Ver detalles");

  detailsButton.type = "button";

  detailsButton.addEventListener("click", () => {
    onOpenCatalogGame?.(game);
  });

  const removeButton = el("button", "favorite-button", "♥ En mi lista");

  removeButton.type = "button";
  removeButton.setAttribute("aria-pressed", "true");

  removeButton.setAttribute("aria-label", `Quitar ${game.name} de mi lista`);

  removeButton.addEventListener("click", () => {
    onRemoveCatalogGame?.(game);
  });

  actions.append(detailsButton, removeButton);

  copy.append(actions);

  card.append(media, copy);

  return card;
}

export function renderWishlist({
  curatedGames = [],
  catalogGames = [],
  catalogLoading = false,
  catalogError = false,
  onOpenCatalogGame,
  onRemoveCatalogGame,
} = {}) {
  const container = document.getElementById("list-wishlist");

  container.replaceChildren();

  const hasCuratedGames = curatedGames.length > 0;

  const hasCatalogGames = catalogGames.length > 0;

  if (
    !hasCuratedGames &&
    !hasCatalogGames &&
    !catalogLoading &&
    !catalogError
  ) {
    container.append(
      el(
        "p",
        "empty",
        "Todavía no has guardado ningún juego. Explora tus recomendaciones o el catálogo y marca ♡ Me interesa.",
      ),
    );

    return;
  }

  if (hasCuratedGames) {
    const curatedSection = el("section", "wishlist-section");

    const curatedList = el("div", "wishlist-curated-list");

    curatedSection.append(
      createWishlistHeading(
        "Elegidos para ti",
        "Juegos guardados desde tus recomendaciones personalizadas.",
      ),
      curatedList,
    );

    container.append(curatedSection);

    renderList(
      curatedList,
      curatedGames,
      {
        showBadges: true,
        showFavorite: true,
      },
      "",
    );
  }

  const catalogSection = el("section", "wishlist-section");

  const catalogList = el("div", "catalog-wishlist-list");

  catalogSection.append(
    createWishlistHeading(
      "Descubiertos en Explorar",
      "Juegos guardados mientras navegabas por el catálogo.",
    ),
    catalogList,
  );

  if (catalogLoading) {
    catalogList.append(
      el("p", "catalog-status", "Cargando juegos guardados..."),
    );
  } else if (catalogError) {
    catalogList.append(
      el("p", "empty", "No se pudieron cargar algunos juegos del catálogo."),
    );
  } else if (!hasCatalogGames) {
    catalogList.append(
      el("p", "empty", "Todavía no has guardado juegos desde Explorar."),
    );
  } else {
    const fragment = document.createDocumentFragment();

    catalogGames.forEach((game) => {
      fragment.append(
        createCatalogWishlistCard(game, {
          onOpenCatalogGame,
          onRemoveCatalogGame,
        }),
      );
    });

    catalogList.append(fragment);
  }

  container.append(catalogSection);
}

/* ---------- Carts ---------- */

export function renderCarts(carts) {
  const container = document.getElementById("list-carts");
  container.replaceChildren();

  if (carts.length === 0) {
    container.append(el("p", "empty", "Los precios se están confirmando."));
    return;
  }

  for (const cart of carts) {
    const box = el("article", "cart");
    const items = el("ul", "cart-items");
    cart.items.forEach(({ game }) => {
      const row = el("li");
      row.append(
        el("span", null, game.title),
        el("span", null, formatPrice(game)),
      );
      items.append(row);
    });

    const total = el("div", "cart-total");
    total.append(
      el("span", null, `Total $${cart.total.toLocaleString("es-MX")}`),
      el("span", null, `Te quedan $${cart.remaining.toLocaleString("es-MX")}`),
    );

    box.append(el("h4", "cart-name", cart.name), items, total);
    container.append(box);
  }
}

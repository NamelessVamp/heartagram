// All DOM rendering lives here. Logic modules never touch the DOM.

import { DIMENSIONS } from "./profile.js";
import { duoBadges } from "./recommender.js";

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
  const directKey = `${primaryId}|${secondaryId}`;
  const reverseKey = `${secondaryId}|${primaryId}`;

  return combos[directKey] ?? combos[reverseKey] ?? null;
}

function buildFallbackProfileCopy(primaryText, secondaryText) {
  return {
    summary: "Tu forma de jugar no cabe en una sola categoría.",
    body: `${primaryText.description} ${secondaryText.description}`,
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

  const findArchetype = (id) =>
    archetypes.find((archetype) => archetype.id === id);

  const primaryArchetype = findArchetype(primaryId);
  const secondaryArchetype = findArchetype(secondaryId);

  const primaryText = profileTexts[primaryId] ?? primaryArchetype;
  const secondaryText = profileTexts[secondaryId] ?? secondaryArchetype;

  const combo =
    findProfileCombo(profileCombos, primaryId, secondaryId) ??
    buildFallbackProfileCopy(primaryText, secondaryText);

  document.getElementById("profile-title").textContent =
    `${primaryText.title} · ${secondaryText.title}`;

  document.getElementById("profile-summary").textContent = combo.summary;

  document.getElementById("profile-body").textContent = combo.body;

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

function gameCard(game, { showBadges = false } = {}) {
  const card = el("article", "card");
  card.append(
    el("h4", "card-title", game.title),
    el("p", "card-price", formatPrice(game)),
  );

  if (game.why) card.append(el("p", "card-why", game.why));
  if (game.couple.includes("INTI_LIBRARY_MATCH"))
    card.append(el("p", "card-owned", "Inti ya lo tiene"));

  if (showBadges) {
    const badges = el("div", "card-badges");
    duoBadges(game).forEach((label) =>
      badges.append(el("span", "badge", label)),
    );
    card.append(badges);
  }
  return card;
}

function renderList(
  containerId,
  games,
  options,
  emptyText = "Nada por aquí todavía.",
) {
  const container = document.getElementById(containerId);
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

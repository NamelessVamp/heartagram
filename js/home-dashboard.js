import { getFavoriteIds } from "./favorites.js";
import {
  GETTING_STARTED_STEPS,
  normalizeGettingStartedProgress,
  readGettingStartedProgress,
} from "./getting-started.js";
import { getOwnedGameIds } from "./library.js";

function archetypeName(archetypes, id) {
  return archetypes.find((item) => item.id === id)?.name ?? id ?? "Sin definir";
}

export function deriveHomeModel({
  profile = null,
  archetypes = [],
  sections = null,
  favoriteIds = [],
  ownedIds = [],
  guideSteps = [],
} = {}) {
  const recommendation = sections?.forYou?.[0]?.game ?? null;
  const total = GETTING_STARTED_STEPS.length;
  const done = normalizeGettingStartedProgress(guideSteps).length;

  return {
    hasProfile: Boolean(profile),
    primaryName: profile
      ? archetypeName(archetypes, profile.archetypes?.primary)
      : null,
    secondaryName: profile
      ? archetypeName(archetypes, profile.archetypes?.secondary)
      : null,
    recommendation,
    // Mi lista shows owned games under Mi biblioteca only, so Inicio counts them once.
    favoriteCount: new Set(favoriteIds.filter((id) => !ownedIds.includes(id))).size,
    ownedCount: new Set(ownedIds).size,
    guide: { done, total, started: done > 0, complete: done >= total },
  };
}

function guideLabel({ done, total, started }) {
  return started ? `Inicia aquí · ${done} de ${total}` : "Inicia aquí";
}

// The setup guide is the main action until it is finished; then the profile takes over.
function renderHomeActions(model) {
  const guideButton = byId("home-action-guide");
  const profileButton = byId("home-action-profile");
  if (!guideButton || !profileButton) return;

  guideButton.hidden = model.guide.complete;
  guideButton.textContent = guideLabel(model.guide);

  profileButton.dataset.action = model.hasProfile ? "to-results" : "start";
  profileButton.textContent = model.hasProfile ? "Ir a Descubrir" : "Descubrir mi perfil";
  profileButton.classList.toggle("btn-primary", model.guide.complete);
  profileButton.classList.toggle("btn-ghost", !model.guide.complete);
}

function byId(id) {
  return document.getElementById(id);
}

export function renderHomeDashboard({
  profile = null,
  archetypes = [],
  sections = null,
} = {}) {
  const model = deriveHomeModel({
    profile,
    archetypes,
    sections,
    favoriteIds: getFavoriteIds(),
    ownedIds: getOwnedGameIds(),
    guideSteps: readGettingStartedProgress(),
  });

  const newState = byId("home-new-state");
  const returningState = byId("home-returning-state");

  if (!newState || !returningState) return model;

  renderHomeActions(model);

  newState.hidden = model.hasProfile;
  returningState.hidden = !model.hasProfile;

  if (!model.hasProfile) return model;

  renderHomeCovers(sections);

  byId("home-profile-primary").textContent = model.primaryName;
  byId("home-profile-secondary").textContent = model.secondaryName;
  showCounts(
    resolvedCounts?.interested ?? model.favoriteCount,
    resolvedCounts?.owned ?? model.ownedCount,
  );

  const recommendationTitle = byId("home-recommendation-title");
  const recommendationCopy = byId("home-recommendation-copy");

  if (model.recommendation) {
    recommendationTitle.textContent = model.recommendation.title;
    recommendationCopy.textContent = model.recommendation.why ?? "";
  } else {
    recommendationTitle.textContent = "Todavía no hay una recomendación";
    recommendationCopy.textContent = "Abre Descubrir para ver las de hoy.";
  }

  return model;
}

const HOME_COVER_LIMIT = 4;

// Mi lista counts only games it can show, so Inicio uses its numbers once they are known.
let resolvedCounts = null;

export function initializeHomeCounts() {
  window.addEventListener("heartagram:collection-rendered", (event) => {
    const { counts, loading, error } = event.detail ?? {};
    // While loading, or after a failed load, the numbers would leave out saved Explorar games.
    if (loading || error || !counts) return;
    resolvedCounts = counts;
    showCounts(counts.interested, counts.owned);
  });
}

function showCounts(favorites, owned) {
  const favoriteNode = byId("home-favorite-count");
  const ownedNode = byId("home-owned-count");
  if (favoriteNode) favoriteNode.textContent = String(favorites);
  if (ownedNode) ownedNode.textContent = String(owned);
}

export function homeCoverGames(sections, limit = HOME_COVER_LIMIT) {
  const pool = [...(sections?.forYou ?? []), ...(sections?.mightHook ?? [])]
    .map((entry) => entry?.game ?? entry);
  const seen = new Set();
  return pool
    .filter((game) => game?.cover_url && !seen.has(game.id) && seen.add(game.id))
    .slice(0, limit);
}

function renderHomeCovers(sections) {
  const strip = document.getElementById("home-cover-strip");
  if (!strip) return;
  const games = homeCoverGames(sections);
  strip.replaceChildren();
  games.forEach((game) => {
    const image = document.createElement("img");
    image.src = game.cover_url;
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => {
      image.remove();
      strip.hidden = strip.childElementCount === 0;
    }, { once: true });
    strip.append(image);
  });
  strip.hidden = games.length === 0;
}

import { getFavoriteIds } from "./favorites.js";
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
} = {}) {
  const recommendation = sections?.forYou?.[0]?.game ?? null;

  return {
    hasProfile: Boolean(profile),
    primaryName: profile
      ? archetypeName(archetypes, profile.archetypes?.primary)
      : null,
    secondaryName: profile
      ? archetypeName(archetypes, profile.archetypes?.secondary)
      : null,
    recommendation,
    favoriteCount: new Set(favoriteIds).size,
    ownedCount: new Set(ownedIds).size,
  };
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
  });

  const newState = byId("home-new-state");
  const returningState = byId("home-returning-state");

  if (!newState || !returningState) return model;

  newState.hidden = model.hasProfile;
  returningState.hidden = !model.hasProfile;

  if (!model.hasProfile) return model;

  byId("home-profile-primary").textContent = model.primaryName;
  byId("home-profile-secondary").textContent = model.secondaryName;
  byId("home-favorite-count").textContent = String(model.favoriteCount);
  byId("home-owned-count").textContent = String(model.ownedCount);

  const recommendationTitle = byId("home-recommendation-title");
  const recommendationCopy = byId("home-recommendation-copy");

  if (model.recommendation) {
    recommendationTitle.textContent = model.recommendation.title;
    recommendationCopy.textContent =
      model.recommendation.why ||
      "Una recomendación construida alrededor de tu perfil actual.";
  } else {
    recommendationTitle.textContent = "Explora tu siguiente juego";
    recommendationCopy.textContent =
      "Abre Descubrir para revisar recomendaciones construidas alrededor de tu perfil.";
  }

  return model;
}

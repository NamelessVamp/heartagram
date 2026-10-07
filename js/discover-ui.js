import { isFavorite, toggleFavorite } from "./favorites.js";

let profileProvider = () => null;
let archetypesProvider = () => [];

const MOOD_CONFIG = {
  DARK: {
    label: "Oscuro",
    score: (game) => Number(game?.vector?.mood ?? 0) + Number(game?.horror_level ?? 0),
  },
  RELAXED: {
    label: "Relajado",
    score: (game) => -Number(game?.vector?.challenge ?? 0) - Number(game?.vector?.pace ?? 0),
  },
  COMPETITIVE: {
    label: "Competitivo",
    score: (game) =>
      Number(game?.vector?.challenge ?? 0) +
      Number(game?.personality?.includes?.("COMPETITOR") ?? false) * 2,
  },
  EXPLORE: {
    label: "Explorar",
    score: (game) =>
      Number(game?.vector?.freedom ?? 0) + Number(game?.vector?.story ?? 0),
  },
};

export function selectMoodGames(games, mood, limit = 3) {
  const config = MOOD_CONFIG[mood] ?? MOOD_CONFIG.DARK;

  return [...(Array.isArray(games) ? games : [])]
    .filter((game) => game?.status === "VERIFICADO")
    .sort((a, b) => config.score(b) - config.score(a))
    .slice(0, limit);
}

export function discoverProfileNames(profile, archetypes = []) {
  const findName = (id) => archetypes.find((item) => item.id === id)?.name ?? id ?? "";

  return {
    primary: findName(profile?.archetypes?.primary),
    secondary: findName(profile?.archetypes?.secondary),
  };
}

function createMoodCard(game) {
  const card = document.createElement("article");
  card.className = "discover-mood-card";

  const title = document.createElement("h4");
  title.textContent = game.title;

  const copy = document.createElement("p");
  copy.textContent =
    game.why || "Una opción del catálogo curado que encaja con este mood.";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "favorite-button";
  button.dataset.favoriteId = game.id;

  const updateButton = () => {
    const selected = isFavorite(game.id);
    button.textContent = selected ? "♥ En mi lista" : "♡ Me interesa";
    button.setAttribute("aria-pressed", String(selected));
  };

  updateButton();
  button.addEventListener("click", () => {
    toggleFavorite(game.id);
    updateButton();
  });

  card.append(title, copy, button);
  return card;
}

export function refreshDiscoverProfile() {
  const names = discoverProfileNames(profileProvider(), archetypesProvider());
  const title = document.getElementById("discover-profile-title");
  const subtitle = document.getElementById("discover-profile-subtitle");
  if (title) title.textContent = names.primary;
  if (subtitle) subtitle.textContent = names.secondary;
}

export function initializeDiscoverUI({ getGames, getProfile, getArchetypes }) {
  profileProvider = getProfile;
  archetypesProvider = getArchetypes;

  const buttons = [...document.querySelectorAll("[data-discover-mood]")];
  const container = document.getElementById("discover-mood-results");

  if (!buttons.length || !container) return;

  const renderMood = (mood) => {
    buttons.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.discoverMood === mood),
      );
    });

    container.replaceChildren(
      ...selectMoodGames(getGames(), mood).map(createMoodCard),
    );
  };

  buttons.forEach((button) => {
    button.addEventListener("click", () => renderMood(button.dataset.discoverMood));
  });

  refreshDiscoverProfile();
  renderMood("DARK");
}

export { MOOD_CONFIG };

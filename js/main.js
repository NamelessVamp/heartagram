// App entry: loads data, keeps quiz state and switches screens.

import { computeProfile } from "./profile.js";
import { rankGames, buildSections, buildDuo } from "./recommender.js";
import { buildCarts } from "./carts.js";

import * as ui from "./ui.js";

import { clearFavorites, getFavoriteIds, toggleFavorite } from "./favorites.js";

import {
  clearSavedProfile,
  getSavedProfile,
  saveProfile,
} from "./profile-storage.js";

import {
  initializeCatalogExplorer,
  openCatalogGameDetails,
} from "./catalog-ui.js";

import { resolveCatalogFavorites, splitFavoriteIds } from "./catalog.js";

// ?preview shows unverified games during development.
const PREVIEW = new URLSearchParams(window.location.search).has("preview");

const NEXT_QUESTION_DELAY_MS = 250;

const state = {
  questions: [],
  archetypes: [],
  profileTexts: {},
  profileCombos: {},
  games: [],

  profile: null,
  ranked: [],
  sections: null,
  duo: [],
  carts: [],

  index: 0,
  answers: {},
  advancing: false,
};

async function loadJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`No se pudo cargar ${path}`);
  }

  return response.json();
}

/**
 * Preview only:
 * treats seed multiplayer hypotheses as verified data.
 * This transformation is never used in production.
 */
function toPreviewGame(game) {
  const duo = game._hypothesis?.duo ?? "";

  const online = duo.includes("ON");
  const local = duo.includes("LOC");

  return {
    ...game,
    status: "VERIFICADO",

    multiplayer: {
      ...game.multiplayer,
      online_coop: online,
      online_versus: online,
      local_wireless: local,
      same_console: local,
    },
  };
}

function ensureAppNavigation() {
  if (document.getElementById("app-navigation")) {
    return;
  }

  const navigation = document.createElement("nav");
  navigation.id = "app-navigation";
  navigation.className = "app-navigation";
  navigation.setAttribute("aria-label", "Navegación principal");

  const items = [
    { label: "Inicio", screen: "intro", action: "restart" },
    {
      label: "Perfil",
      screen: "profile",
      action: "continue-profile",
      requiresProfile: true,
    },
    {
      label: "Recomendaciones",
      screen: "results",
      action: "to-results",
      requiresProfile: true,
    },
    { label: "Explorar", screen: "catalog", action: "to-catalog" },
    { label: "Mi lista", screen: "wishlist", action: "to-wishlist" },
  ];

  for (const item of items) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "app-navigation-button";
    button.textContent = item.label;
    button.dataset.mobileLabel =
      item.screen === "results" ? "Juegos" : item.label;
    button.dataset.action = item.action;
    button.dataset.navScreen = item.screen;

    if (item.requiresProfile) {
      button.dataset.requiresProfile = "true";
    }

    navigation.append(button);
  }

  document.body.append(navigation);
}

function updateAppNavigation(screenName) {
  ensureAppNavigation();

  const navigation = document.getElementById("app-navigation");
  const isQuiz = screenName === "quiz";

  navigation.hidden = isQuiz;
  document.body.classList.toggle("has-app-navigation", !isQuiz);

  for (const button of navigation.querySelectorAll("button")) {
    const requiresProfile = button.dataset.requiresProfile === "true";
    button.disabled = requiresProfile && !state.profile;

    if (button.dataset.navScreen === screenName) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  }
}

function showScreen(name) {
  document.body.dataset.screen = name;

  document.querySelectorAll(".screen").forEach((screen) => {
    screen.hidden = screen.dataset.screen !== name;
  });

  updateAppNavigation(name);

  window.scrollTo({
    top: 0,
    behavior: "instant",
  });

  const heading = document.querySelector(
    `.screen[data-screen="${name}"] h1, ` + `.screen[data-screen="${name}"] h2`,
  );

  if (heading) {
    heading.tabIndex = -1;
    heading.focus({
      preventScroll: true,
    });
  }
}

function renderCurrentQuestion() {
  const question = state.questions[state.index];

  ui.renderQuestion(
    question,
    state.index,
    state.questions.length,
    state.answers[question.id],

    (optionId) => {
      // Prevents a double tap from skipping questions.
      if (state.advancing) return;

      state.advancing = true;
      state.answers[question.id] = optionId;

      window.setTimeout(() => {
        state.advancing = false;

        const isLastQuestion = state.index >= state.questions.length - 1;

        if (isLastQuestion) {
          finishQuiz();
          return;
        }

        state.index += 1;
        renderCurrentQuestion();
      }, NEXT_QUESTION_DELAY_MS);
    },
  );
}

/**
 * Calculates and renders everything derived from a profile.
 *
 * Important:
 * This function must never call itself.
 */
function applyProfile(profile) {
  const ranked = rankGames(profile, state.games);

  const sections = buildSections(profile, ranked);

  const duo = buildDuo(profile, ranked);

  state.profile = profile;
  state.ranked = ranked;
  state.sections = sections;
  state.duo = duo;

  const carts = buildCarts(ranked, duo, sections.outOfZone);

  ui.renderProfile(
    profile,
    state.archetypes,
    state.profileTexts,
    state.profileCombos,
  );

  ui.renderResults(sections);
  ui.renderDuo(duo);

  ui.renderCarts(carts);

  void refreshWishlist();
}

function finishQuiz() {
  const profile = computeProfile(state.questions, state.answers);

  saveProfile(profile);
  applyProfile(profile);
  renderHomeState();

  showScreen("profile");
}

function getCuratedFavoriteGames(favoriteIds = getFavoriteIds()) {
  const { curatedIds } = splitFavoriteIds(favoriteIds);

  const wantedIds = new Set(curatedIds);

  return state.games.filter((game) => wantedIds.has(game.id));
}

async function refreshWishlist() {
  const favoriteIds = getFavoriteIds();

  const { catalogIds } = splitFavoriteIds(favoriteIds);

  const curatedGames = getCuratedFavoriteGames(favoriteIds);

  ui.renderWishlist({
    curatedGames,
    catalogGames: [],
    catalogLoading: catalogIds.length > 0,
    catalogError: false,
    onOpenCatalogGame: openCatalogGameDetails,
    onRemoveCatalogGame: removeCatalogFavorite,
  });

  if (catalogIds.length === 0) {
    return;
  }

  try {
    const catalogGames = await resolveCatalogFavorites(favoriteIds);

    ui.renderWishlist({
      curatedGames,
      catalogGames,
      catalogLoading: false,
      catalogError: false,
      onOpenCatalogGame: openCatalogGameDetails,
      onRemoveCatalogGame: removeCatalogFavorite,
    });
  } catch (error) {
    ui.renderWishlist({
      curatedGames,
      catalogGames: [],
      catalogLoading: false,
      catalogError: true,
      onOpenCatalogGame: openCatalogGameDetails,
      onRemoveCatalogGame: removeCatalogFavorite,
    });

    console.error("No se pudieron cargar los favoritos de IGDB.", error);
  }
}

function removeCatalogFavorite(game) {
  toggleFavorite(`igdb:${game.igdb_id}`);
}

function renderHomeState() {
  const hasProfile = state.profile !== null;

  const newProfileActions = document.getElementById("new-profile-actions");

  const returningProfileActions = document.getElementById(
    "returning-profile-actions",
  );

  const introLead = document.getElementById("intro-lead");

  const introHint = document.getElementById("intro-hint");

  if (newProfileActions) {
    newProfileActions.hidden = hasProfile;
  }

  if (returningProfileActions) {
    returningProfileActions.hidden = !hasProfile;
  }

  if (introLead) {
    introLead.textContent = hasProfile
      ? "Tu perfil, tus juegos y tu lista siguen aquí."
      : "Tu Nintendo Switch ya es tuya. Antes de elegir qué jugar, descubre qué tipo de jugadora eres.";
  }

  if (introHint) {
    introHint.textContent = hasProfile
      ? "Continúa donde lo dejaste."
      : "12 preguntas · menos de 3 minutos";
  }
}

const ACTIONS = {
  start: () => {
    state.index = 0;
    state.answers = {};
    state.advancing = false;

    renderCurrentQuestion();
    showScreen("quiz");
  },

  back: () => {
    if (state.advancing) return;

    if (state.index === 0) {
      renderHomeState();
      showScreen("intro");
      return;
    }

    state.index -= 1;
    renderCurrentQuestion();
  },

  "continue-profile": () => {
    if (!state.profile) return;

    ui.renderProfile(
      state.profile,
      state.archetypes,
      state.profileTexts,
      state.profileCombos,
    );

    showScreen("profile");
  },

  "reset-profile": () => {
    const shouldReset = window.confirm(
      "¿Quieres borrar tu perfil y volver a hacer el test? Tu lista de favoritos se conservará.",
    );

    if (!shouldReset) return;

    clearSavedProfile();

    state.profile = null;
    state.carts = [];
    state.ranked = [];
    state.sections = null;
    state.duo = [];
    state.answers = {};
    state.index = 0;
    state.advancing = false;

    renderHomeState();
    showScreen("intro");
  },

  "to-results": () => {
    if (!state.profile) {
      showScreen("intro");
      return;
    }

    showScreen("results");
  },

  "to-catalog": async () => {
    showScreen("catalog");

    try {
      await initializeCatalogExplorer();
    } catch (error) {
      console.error("No se pudo iniciar el explorador de juegos.", error);
    }
  },

  "to-duo": () => {
    if (!state.profile) {
      showScreen("intro");
      return;
    }

    showScreen("duo");
  },

  "to-wishlist": () => {
    showScreen("wishlist");
    void refreshWishlist();
  },

  "to-carts": () => {
    if (!state.profile) {
      showScreen("intro");
      return;
    }

    ui.renderCarts(state.carts);

    showScreen("carts");
  },

  "clear-wishlist": () => {
    const shouldClear = window.confirm(
      "¿Quieres quitar todos los juegos de tu lista?",
    );

    if (!shouldClear) return;

    clearFavorites();
    void refreshWishlist();
  },

  "to-gift": () => {
    showScreen("gift");
  },

  "to-family": () => {
    showScreen("family");
  },

  restart: () => {
    renderHomeState();
    showScreen("intro");
  },
};

function bindActions() {
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-action]");

    if (!trigger) return;

    const action = trigger.dataset.action;

    ACTIONS[action]?.();
  });
}

async function init() {
  bindActions();

  window.addEventListener("heartagram:favorites-changed", () => {
    void refreshWishlist();
  });

  try {
    const [questions, archetypes, profileTexts, profileCombos, games] =
      await Promise.all([
        loadJson("data/questions.json"),
        loadJson("data/archetypes.json"),
        loadJson("data/profile_texts.json"),
        loadJson("data/profile_combos.json"),
        loadJson("data/games.json"),
      ]);

    state.questions = questions;
    state.archetypes = archetypes;
    state.profileTexts = profileTexts;
    state.profileCombos = profileCombos;

    state.games = PREVIEW ? games.map(toPreviewGame) : games;

    // Restore the profile only once, after all data is loaded.
    const savedProfile = getSavedProfile();

    if (savedProfile) {
      applyProfile(savedProfile);
    } else {
      void refreshWishlist();
    }

    renderHomeState();
    showScreen("intro");
  } catch (error) {
    const introLead =
      document.getElementById("intro-lead") ??
      document.querySelector('[data-screen="intro"] .lead');

    if (introLead) {
      introLead.textContent =
        "No se pudieron cargar los datos. Abre la página con un servidor local.";
    }

    const startButton = document.querySelector('[data-action="start"]');

    if (startButton) {
      startButton.hidden = true;
    }

    console.error(error);
  }
}

init();

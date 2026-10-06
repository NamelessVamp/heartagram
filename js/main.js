// App entry: loads data, keeps quiz state and switches screens.

import { computeProfile } from "./profile.js";
import { rankGames, buildSections, buildDuo } from "./recommender.js";

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

function showScreen(name) {
  document.querySelectorAll(".screen").forEach((screen) => {
    screen.hidden = screen.dataset.screen !== name;
  });

  window.scrollTo({
    top: 0,
    behavior: "instant",
  });

  const heading = document.querySelector(
    `[data-screen="${name}"] h1, ` + `[data-screen="${name}"] h2`,
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

  ui.renderProfile(
    profile,
    state.archetypes,
    state.profileTexts,
    state.profileCombos,
  );

  ui.renderResults(sections);
  ui.renderDuo(duo);

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

const DATA_VERSION = "135";
// App entry: loads data, keeps quiz state and switches screens.

import { computeProfile } from "./profile.js";
import { updateAppShellNavigation } from "./app-shell.js";
import { initializeHomeCounts, renderHomeDashboard } from "./home-dashboard.js?v=v136";
import { initializeDiscoverUI, refreshDiscoverProfile } from "./discover-ui.js?v=v136";
import { initializeCollectionUI } from "./collection-ui.js?v=v136";
import { buildRecommendations, omitOwned } from "./recommend-v2.js?v=v136";
import { activateDiscoverTab, initializeDiscoverTabs } from "./discover-tabs.js?v=v136";

import * as ui from "./ui.js?v=v136";

import { clearFavorites, getFavoriteIds, toggleFavorite } from "./favorites.js";

import {
  clearSavedProfile,
  getSavedProfile,
  saveProfile,
} from "./profile-storage.js";

import {
  initializeCatalogExplorer,
  openCatalogGameDetails,
} from "./catalog-ui.js?v=v136";

import {
  favoriteIdForCatalogGame,
  loadCatalog,
  resolveCatalogFavorites,
  splitFavoriteIds,
} from "./catalog.js?v=v136";
import { getOwnedGameIds, setOwnedGame } from "./library.js";
import { initializeGettingStarted } from "./getting-started.js";

const NEXT_QUESTION_DELAY_MS = 250;

// The pending "next question" step, so leaving the quiz can cancel it.
let questionTimer = null;

function cancelPendingQuestion() {
  window.clearTimeout(questionTimer);
  questionTimer = null;
  state.advancing = false;
}

const state = {
  questions: [],
  archetypes: [],
  profileTexts: {},
  profileCombos: {},
  games: [],
  pool: [],
  catalogGames: null,
  reroll: 0,

  profile: null,
  ranked: [],
  sections: null,
  duo: [],

  index: 0,
  answers: {},
  advancing: false,
};

async function loadJson(path) {
  const response = await fetch(`${path}?v=${DATA_VERSION}`);

  if (!response.ok) {
    throw new Error(`No se pudo cargar ${path}`);
  }

  return response.json();
}

function updateAppNavigation(screenName) {
  updateAppShellNavigation(screenName, {
    hasProfile: Boolean(state.profile),
  });
}

function showScreen(name) {
  document.body.dataset.screen = name;

  document.querySelectorAll(".screen").forEach((screen) => {
    screen.hidden = screen.dataset.screen !== name;
  });

  updateAppNavigation(name);

  // Leaving the quiz in the 250 ms between answers must not jump back into it.
  if (name !== "quiz") cancelPendingQuestion();

  if (name !== "results" && rerankPending && state.profile) applyProfile(state.profile);

  // Guide progress can change on another screen, so refresh the home actions on return.
  if (name === "intro") {
    renderHomeDashboard({
      profile: state.profile,
      archetypes: state.archetypes,
      sections: state.sections,
    });
  }

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

      questionTimer = window.setTimeout(() => {
        questionTimer = null;
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
// Local date, so the daily rotation turns over at local midnight, not at 18:00 in Mexico.
function todayKey() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function recommendationInputs() {
  return {
    curated: state.games,
    catalog: state.catalogGames ?? [],
    ownedIds: getOwnedGameIds(),
    favoriteIds: getFavoriteIds(),
    seed: `${todayKey()}|${state.reroll}`,
  };
}

let catalogPoolRequested = false;

// Set when the catalog arrives while Descubrir is open: re-ranking then would
// reshuffle cards the user is about to tap, so it waits for the next screen change.
let rerankPending = false;

// Loads the Nintendo catalog once and refreshes the recommendations with it.
function ensureCatalogPool() {
  if (catalogPoolRequested || state.catalogGames) return;
  catalogPoolRequested = true;
  loadCatalog()
    .then((catalog) => {
      state.catalogGames = catalog.games;
      if (!state.profile) return;
      if (document.body.dataset.screen === "results") rerankPending = true;
      else applyProfile(state.profile);
    })
    .catch((error) => {
      catalogPoolRequested = false;
      console.error("Recomendaciones sin catálogo Nintendo.", error);
    });
}

function applyProfile(profile) {
  rerankPending = false;
  const { ranked, sections, duo, pool } = buildRecommendations(profile, recommendationInputs());
  state.pool = pool;
  ensureCatalogPool();

  state.profile = profile;
  state.ranked = ranked;
  state.sections = sections;
  state.duo = duo;

  refreshDiscoverProfile();

  ui.renderProfile(
    profile,
    state.archetypes,
    state.profileTexts,
    state.profileCombos,
  );

  ui.renderResults(sections);
  ui.renderDuo(duo);

  renderHomeDashboard({
    profile: state.profile,
    archetypes: state.archetypes,
    sections: state.sections,
  });

  void refreshWishlist();
}

function finishQuiz() {
  const profile = computeProfile(state.questions, state.answers);

  saveProfile(profile);
  applyProfile(profile);
  renderHomeState();

  showScreen("profile");
}

function getCuratedGamesByIds(ids) {
  const { curatedIds } = splitFavoriteIds(ids);
  const wantedIds = new Set(curatedIds);

  return state.games.filter((game) => wantedIds.has(game.id));
}

function moveGameToLibrary(gameId) {
  if (getFavoriteIds().includes(gameId)) {
    toggleFavorite(gameId);
  }

  setOwnedGame(gameId, true);
}

function removeGameFromLibrary(gameId) {
  setOwnedGame(gameId, false);
}

function moveCatalogGameToLibrary(game) {
  moveGameToLibrary(favoriteIdForCatalogGame(game));
}

function removeCatalogGameFromLibrary(game) {
  removeGameFromLibrary(favoriteIdForCatalogGame(game));
}

async function refreshWishlist() {
  const favoriteIds = getFavoriteIds();
  const ownedIds = getOwnedGameIds();

  const favoriteSet = new Set(favoriteIds);

  const ownedSet = new Set(ownedIds);

  const interestedCuratedGames = getCuratedGamesByIds(favoriteIds).filter(
    (game) => !ownedSet.has(game.id),
  );

  const ownedCuratedGames = getCuratedGamesByIds(ownedIds);

  const requestedIds = [...new Set([...favoriteIds, ...ownedIds])];

  const { catalogIds } = splitFavoriteIds(requestedIds);

  const render = ({
    catalogGames = [],
    catalogLoading = false,
    catalogError = false,
  } = {}) => {
    const interestedCatalogGames = catalogGames.filter((game) => {
      const gameId = favoriteIdForCatalogGame(game);

      return favoriteSet.has(gameId) && !ownedSet.has(gameId);
    });

    const ownedCatalogGames = catalogGames.filter((game) =>
      ownedSet.has(favoriteIdForCatalogGame(game)),
    );

    ui.renderWishlist({
      interestedCuratedGames,
      interestedCatalogGames,
      ownedCuratedGames,
      ownedCatalogGames,
      catalogLoading,
      catalogError,

      onOpenCatalogGame: openCatalogGameDetails,

      onRemoveCatalogGame: removeCatalogFavorite,

      onMoveCuratedToLibrary: (game) => moveGameToLibrary(game.id),

      onRemoveCuratedFromLibrary: (game) => removeGameFromLibrary(game.id),

      onMoveCatalogToLibrary: moveCatalogGameToLibrary,

      onRemoveCatalogFromLibrary: removeCatalogGameFromLibrary,
    });
  };

  render({
    catalogLoading: catalogIds.length > 0,
  });

  if (catalogIds.length === 0) {
    return;
  }

  try {
    const catalogGames = await resolveCatalogFavorites(requestedIds);

    render({
      catalogGames,
    });
  } catch (error) {
    render({
      catalogError: true,
    });

    console.error("No se pudieron cargar los juegos del catalogo activo.", error);
  }
}

function removeCatalogFavorite(game) {
  toggleFavorite(favoriteIdForCatalogGame(game));
}

function renderHomeState() {
  const hasProfile = state.profile !== null;

  const newProfileActions = document.getElementById("new-profile-actions");

  const returningProfileActions = document.getElementById(
    "returning-profile-actions",
  );

  if (newProfileActions) {
    newProfileActions.hidden = hasProfile;
  }

  if (returningProfileActions) {
    returningProfileActions.hidden = !hasProfile;
  }

}

const ACTIONS = {
  start: () => {
    cancelPendingQuestion();
    state.index = 0;
    state.answers = {};

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

    showScreen("results");
    activateDiscoverTab("duo");
    document.getElementById("discover-duo")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
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

  "to-getting-started": () => { initializeGettingStarted(); showScreen("getting-started"); },

  "reroll-recommendations": () => {
    if (!state.profile) return;
    state.reroll += 1;
    applyProfile(state.profile);
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
  initializeHomeCounts();

  window.addEventListener("heartagram:favorites-changed", () => {
    renderHomeDashboard({
      profile: state.profile,
      archetypes: state.archetypes,
      sections: state.sections,
    });
    void refreshWishlist();
  });

  window.addEventListener("heartagram:library-changed", () => {
    renderHomeDashboard({
      profile: state.profile,
      archetypes: state.archetypes,
      sections: state.sections,
    });
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

    state.games = games;

    initializeDiscoverUI({
      getGames: () => omitOwned(state.pool.length ? state.pool : state.games, {
        ownedIds: getOwnedGameIds(),
        curated: state.games,
        catalog: state.catalogGames ?? [],
      }),
      getProfile: () => state.profile,
      getArchetypes: () => state.archetypes,
    });

    initializeCollectionUI();
    initializeDiscoverTabs();
    initializeGettingStarted();

    // Restore the profile only once, after all data is loaded.
    const savedProfile = getSavedProfile();
    let restored = false;

    if (savedProfile) {
      try {
        applyProfile(savedProfile);
        restored = true;
      } catch (error) {
        // A profile the app cannot render must not block the start screen.
        console.error("Se descartó un perfil guardado que no se pudo usar.", error);
        clearSavedProfile();
        state.profile = null;
        state.sections = null;
      }
    }

    if (!restored) {
      renderHomeDashboard({
        profile: null,
        archetypes: state.archetypes,
        sections: null,
      });
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

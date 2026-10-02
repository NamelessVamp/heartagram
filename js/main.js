// App entry: loads data, keeps quiz state and switches screens.

import { computeProfile } from "./profile.js";
import { rankGames, buildSections, buildDuo } from "./recommender.js";
import { buildCarts } from "./carts.js";
import * as ui from "./ui.js";
import { clearFavorites, getFavoriteIds } from "./favorites.js";

// ?preview shows unverified games so Inti can test before Phase 1 is done.
const PREVIEW = new URLSearchParams(window.location.search).has("preview");
const NEXT_QUESTION_DELAY_MS = 250;

const state = {
  questions: [],
  archetypes: [],
  profileTexts: {},
  profileCombos: {},
  games: [],
  index: 0,
  answers: {},
  advancing: false,
};

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`No se pudo cargar ${path}`);
  return response.json();
}

/** Preview only: treats seed hypotheses as data. Never used in production. */
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
  window.scrollTo({ top: 0 });

  const heading = document.querySelector(
    `[data-screen="${name}"] h1, [data-screen="${name}"] h2`,
  );
  if (heading) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
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
      // Ignore extra taps while the next question is loading: a double tap
      // used to advance twice and skip a question.
      if (state.advancing) return;
      state.advancing = true;
      state.answers[question.id] = optionId;

      setTimeout(() => {
        state.advancing = false;
        if (state.index < state.questions.length - 1) {
          state.index++;
          renderCurrentQuestion();
        } else {
          finishQuiz();
        }
      }, NEXT_QUESTION_DELAY_MS);
    },
  );
}

function finishQuiz() {
  const profile = computeProfile(state.questions, state.answers);
  const ranked = rankGames(profile, state.games);
  const sections = buildSections(profile, ranked);
  const duo = buildDuo(profile, ranked);
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
  showScreen("profile");
}

function getFavoriteGames() {
  const favoriteIds = getFavoriteIds();

  return favoriteIds
    .map((id) => state.games.find((game) => game.id === id))
    .filter(Boolean);
}

function refreshWishlist() {
  ui.renderWishlist(getFavoriteGames());
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
      showScreen("intro");
      return;
    }
    state.index--;
    renderCurrentQuestion();
  },
  "to-results": () => showScreen("results"),
  "to-duo": () => showScreen("duo"),
  "to-wishlist": () => {
    refreshWishlist();
    showScreen("wishlist");
  },

  "clear-wishlist": () => {
    const shouldClear = window.confirm(
      "¿Quieres quitar todos los juegos de tu lista?",
    );

    if (!shouldClear) return;

    clearFavorites();
    refreshWishlist();
  },
  "to-gift": () => showScreen("gift"),
  "to-family": () => showScreen("family"),
  restart: () => showScreen("intro"),
};

function bindActions() {
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-action]");
    if (trigger) ACTIONS[trigger.dataset.action]?.();
  });
}

async function init() {
  bindActions();
  window.addEventListener("heartagram:favorites-changed", refreshWishlist);
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
  } catch (error) {
    document.querySelector('[data-screen="intro"] .lead').textContent =
      "No se pudieron cargar los datos. Abre la página con un servidor local.";
    document.querySelector('[data-action="start"]').hidden = true;
    console.error(error);
  }
}

init();

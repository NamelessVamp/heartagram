import { buildAIContext, MAX_MESSAGE_LENGTH } from "./ai-context.js";
import { generateLocalAssistantResponse } from "./ai-local.js";
import { getFavoriteIds } from "./favorites.js";
import { getOwnedGameIds } from "./library.js";

let initialized = false;
let profileProvider = () => null;
let gamesProvider = () => [];

function byId(id) {
  return document.getElementById(id);
}

function respond(message) {
  const context = buildAIContext({
    profile: profileProvider(),
    favoriteIds: getFavoriteIds(),
    ownedIds: getOwnedGameIds(),
    games: gamesProvider(),
    message,
  });

  byId("assistant-response").textContent = generateLocalAssistantResponse(
    context,
    gamesProvider(),
  );
}

export function initializeLocalAssistant({ getProfile, getGames }) {
  profileProvider = getProfile;
  gamesProvider = getGames;

  if (initialized) return;

  const form = byId("assistant-form");
  const input = byId("assistant-input");

  input.maxLength = MAX_MESSAGE_LENGTH;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    respond(input.value);
  });

  document.querySelectorAll("[data-assistant-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
      input.value = button.dataset.assistantPrompt;
      respond(input.value);
    });
  });

  respond("");
  initialized = true;
}

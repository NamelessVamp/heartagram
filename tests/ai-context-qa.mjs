import assert from "node:assert/strict";

import {
  buildAIContext,
  MAX_MESSAGE_LENGTH,
} from "../js/ai-context.js";

function check(description, assertion) {
  assertion();
  console.log(`[OK] ${description}`);
}

const profile = {
  archetypes: {
    primary: "EXPLORER",
    secondary: "COMPETITOR",
  },
  horrorTolerance: 2,
  couplePref: "COMPETITIVE_COUPLE",
  vector: {
    pace: 1,
    mood: 1,
  },
  privateField: "must-not-leave-browser",
};

const games = [
  {
    id: "mario-kart-world",
    couple: ["INTI_LIBRARY_MATCH", "ONLINE"],
  },
  {
    id: "dredge",
    couple: [],
  },
];

check("construye un perfil minimo", () => {
  const context = buildAIContext({ profile });

  assert.deepEqual(context.profile, {
    primary: "EXPLORER",
    secondary: "COMPETITOR",
    horrorTolerance: 2,
    couplePreference: "COMPETITIVE_COUPLE",
    vector: {
      pace: 1,
      mood: 1,
    },
  });

  assert.equal("privateField" in context.profile, false);
});

check("acepta IDs curados e IGDB", () => {
  const context = buildAIContext({
    favoriteIds: ["dredge", "igdb:72"],
  });

  assert.deepEqual(context.interestedGameIds, ["dredge", "igdb:72"]);
});

check("elimina duplicados y espacios", () => {
  const context = buildAIContext({
    favoriteIds: [" dredge ", "dredge", ""],
    ownedIds: [" igdb:72 ", "igdb:72"],
  });

  assert.deepEqual(context.interestedGameIds, ["dredge"]);
  assert.deepEqual(context.ownedGameIds, ["igdb:72"]);
});

check("excluye de Me interesa los juegos propios", () => {
  const context = buildAIContext({
    favoriteIds: ["dredge", "igdb:72"],
    ownedIds: ["igdb:72"],
  });

  assert.deepEqual(context.interestedGameIds, ["dredge"]);
  assert.deepEqual(context.ownedGameIds, ["igdb:72"]);
});

check("detecta juegos que Inti ya tiene", () => {
  const context = buildAIContext({ games });

  assert.deepEqual(context.intiLibraryGameIds, ["mario-kart-world"]);
});

check("funciona sin perfil", () => {
  const context = buildAIContext();

  assert.equal(context.profile, null);
  assert.deepEqual(context.interestedGameIds, []);
  assert.deepEqual(context.ownedGameIds, []);
});

check("limita y limpia el mensaje", () => {
  const context = buildAIContext({
    message: `  ${"x".repeat(MAX_MESSAGE_LENGTH + 100)}  `,
  });

  assert.equal(context.message.length, MAX_MESSAGE_LENGTH);
});

check("no incluye codigos ni localStorage completo", () => {
  const context = buildAIContext({
    profile,
    favoriteIds: ["dredge"],
    ownedIds: ["igdb:72"],
    games,
    message: "Quiero algo oscuro",
  });

  const serialized = JSON.stringify(context);

  assert.equal(serialized.includes("XXXX-XXXX"), false);
  assert.equal(serialized.includes("heartagram:profile"), false);
  assert.equal(serialized.includes("must-not-leave-browser"), false);
});

console.log("\n[OK] QA de contexto IA completo");

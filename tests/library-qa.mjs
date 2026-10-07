import assert from "node:assert/strict";

const storage = new Map();

globalThis.window = {
  localStorage: {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },

    setItem(key, value) {
      storage.set(key, String(value));
    },
  },

  dispatchEvent() {
    return true;
  },
};

globalThis.CustomEvent = class CustomEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail;
  }
};

const {
  clearLibrary,
  getOwnedGameIds,
  isOwnedGame,
  setOwnedGame,
  toggleOwnedGame,
} = await import("../js/library.js");

function check(description, assertion) {
  assertion();
  console.log(`[OK] ${description}`);
}

check("inicia con biblioteca vacía", () => {
  assert.deepEqual(getOwnedGameIds(), []);
});

check("agrega un juego curado", () => {
  assert.equal(setOwnedGame("persona-5-royal", true), true);

  assert.equal(isOwnedGame("persona-5-royal"), true);
});

check("agrega un juego IGDB", () => {
  assert.equal(setOwnedGame("igdb:72", true), true);

  assert.equal(isOwnedGame("igdb:72"), true);
});

check("no duplica juegos", () => {
  setOwnedGame("igdb:72", true);

  assert.deepEqual(getOwnedGameIds(), ["persona-5-royal", "igdb:72"]);
});

check("toggle elimina un juego existente", () => {
  assert.equal(toggleOwnedGame("persona-5-royal"), false);

  assert.deepEqual(getOwnedGameIds(), ["igdb:72"]);
});

check("toggle agrega un juego ausente", () => {
  assert.equal(toggleOwnedGame("zelda-botw"), true);
});

check("ignora identificadores inválidos", () => {
  assert.equal(setOwnedGame("", true), false);

  assert.equal(setOwnedGame(null, true), false);
});

check("tolera localStorage corrupto", () => {
  storage.set("heartagram:library", "{invalid-json");

  assert.deepEqual(getOwnedGameIds(), []);
});

check("limpia la biblioteca", () => {
  setOwnedGame("igdb:72", true);

  clearLibrary();

  assert.deepEqual(getOwnedGameIds(), []);
});

console.log("\n[OK] QA de biblioteca completo");

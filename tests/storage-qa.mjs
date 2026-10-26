import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Minimal browser stand-ins so the storage modules run under Node.
const store = new Map();
let failWrites = false;
globalThis.window = {
  localStorage: {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      if (failWrites) throw new Error("QuotaExceededError");
      store.set(key, value);
    },
    removeItem: (key) => store.delete(key),
  },
  dispatchEvent: () => true,
};
globalThis.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init?.detail; } };

const { computeProfile } = await import("../js/profile.js");
const { clearSavedProfile, getSavedProfile, isValidProfile, saveProfile } = await import("../js/profile-storage.js");
const { getFavoriteIds, toggleFavorite } = await import("../js/favorites.js");
const { getOwnedGameIds, setOwnedGame } = await import("../js/library.js");

const questions = JSON.parse(readFileSync("data/questions.json", "utf8"));
const profile = computeProfile(questions, Object.fromEntries(questions.map((q) => [q.id, q.options[0].id])));

saveProfile(profile);
assert.deepEqual(getSavedProfile(), profile);
assert.equal(isValidProfile(profile), true);
console.log("[OK] un perfil completo se guarda y se lee igual");

const broken = [
  ["sin vibes", { ...profile, vibes: undefined }],
  ["sin tolerancia al horror", { ...profile, horrorTolerance: undefined }],
  ["vector incompleto", { ...profile, vector: { pace: 1 } }],
  ["sin arquetipo secundario", { ...profile, archetypes: { primary: "EXPLORER" } }],
  ["vector vacío", { vector: {}, archetypes: { primary: "EXPLORER", secondary: "CREATOR" } }],
];
for (const [name, value] of broken) {
  store.set("heartagram:profile", JSON.stringify(value));
  assert.equal(getSavedProfile(), null, `perfil ${name} debe descartarse`);
}
store.set("heartagram:profile", "no es json");
assert.equal(getSavedProfile(), null);
console.log("[OK] un perfil viejo o dañado se descarta en vez de romper el arranque");

clearSavedProfile();
failWrites = true;
assert.doesNotThrow(() => saveProfile(profile));
assert.deepEqual(getSavedProfile(), profile);
assert.equal(toggleFavorite("dredge"), true);
assert.deepEqual(getFavoriteIds(), ["dredge"]);
assert.equal(toggleFavorite("hades"), true);
assert.deepEqual(getFavoriteIds(), ["dredge", "hades"]);
assert.equal(setOwnedGame("hades", true), true);
assert.deepEqual(getOwnedGameIds(), ["hades"]);
console.log("[OK] con el almacenamiento bloqueado la sesión sigue funcionando");

failWrites = false;
assert.equal(toggleFavorite("signalis"), true);
assert.deepEqual(JSON.parse(store.get("heartagram:favorites")), ["dredge", "hades", "signalis"]);
assert.deepEqual(getFavoriteIds(), ["dredge", "hades", "signalis"]);
console.log("[OK] al volver el almacenamiento se guarda todo lo acumulado");

console.log("\n[OK] QA de almacenamiento completo");

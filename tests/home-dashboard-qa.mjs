import assert from "node:assert/strict";
import { deriveHomeModel } from "../js/home-dashboard.js";

const profile = {
  archetypes: {
    primary: "EXPLORER",
    secondary: "COMPETITOR",
  },
};

const archetypes = [
  { id: "EXPLORER", name: "La Errante" },
  { id: "COMPETITOR", name: "La de la Grieta" },
];

const sections = {
  forYou: [
    {
      game: {
        id: "dredge",
        title: "Dredge",
        why: "Exploración oscura y sesiones manejables.",
      },
    },
  ],
};

const returning = deriveHomeModel({
  profile,
  archetypes,
  sections,
  favoriteIds: ["dredge", "dredge", "darkwood"],
  ownedIds: ["mario-kart-world"],
});

assert.equal(returning.hasProfile, true);
assert.equal(returning.primaryName, "La Errante");
assert.equal(returning.secondaryName, "La de la Grieta");
assert.equal(returning.recommendation.title, "Dredge");
assert.equal(returning.favoriteCount, 2);
assert.equal(returning.ownedCount, 1);
console.log("[OK] construye Inicio para un perfil existente");

const firstVisit = deriveHomeModel();
assert.equal(firstVisit.hasProfile, false);
assert.equal(firstVisit.recommendation, null);
assert.equal(firstVisit.favoriteCount, 0);
assert.equal(firstVisit.ownedCount, 0);
console.log("[OK] construye Inicio sin perfil");

console.log("\n[OK] QA de Inicio completo");

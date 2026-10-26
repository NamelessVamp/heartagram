import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { GETTING_STARTED_STEPS } from "../js/getting-started.js";
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

const overlap = deriveHomeModel({ favoriteIds: ["dredge", "hades"], ownedIds: ["hades"] });
assert.equal(overlap.favoriteCount, 1);
assert.equal(overlap.ownedCount, 1);
console.log("[OK] un juego en la biblioteca no se cuenta también en Me interesa");

const total = GETTING_STARTED_STEPS.length;
assert.deepEqual(firstVisit.guide, { done: 0, total, started: false, complete: false });
const midGuide = deriveHomeModel({ guideSteps: [GETTING_STARTED_STEPS[0], GETTING_STARTED_STEPS[1], "paso-inventado"] });
assert.deepEqual(midGuide.guide, { done: 2, total, started: true, complete: false });
const doneGuide = deriveHomeModel({ guideSteps: GETTING_STARTED_STEPS });
assert.equal(doneGuide.guide.complete, true);
console.log("[OK] el progreso de la guía ignora pasos desconocidos y detecta que terminó");

const html = readFileSync("index.html", "utf8");
const heroStart = html.indexOf('<header class="home-header">');
const hero = html.slice(heroStart, html.indexOf("</header>", heroStart));
const guideButton = hero.match(/<button[^>]*id="home-action-guide"[^>]*>/s)?.[0] ?? "";
assert.ok(guideButton.includes('data-action="to-getting-started"'), "Falta Inicia aquí en el hero");
assert.ok(guideButton.includes('class="btn btn-primary"'), "Inicia aquí debe ser el botón principal");
assert.ok(hero.indexOf("home-action-guide") < hero.indexOf("home-action-profile"), "Inicia aquí va antes del perfil");
console.log("[OK] Inicia aquí es la acción principal del hero");

console.log("\n[OK] QA de Inicio completo");

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { computeProfile, DIMENSIONS } from "../js/profile.js";
import { adaptNintendoCatalog } from "../js/nintendo-catalog.js";
import { buildRecommendations, nintendoToCandidate, familyKey } from "../js/recommend-v2.js";

const questions = JSON.parse(readFileSync("data/questions.json", "utf8"));
const curated = JSON.parse(readFileSync("data/games.json", "utf8"));
const catalog = adaptNintendoCatalog(JSON.parse(readFileSync("data/nintendo_catalog.json", "utf8"))).games;

const profileFor = (pick) => computeProfile(questions, Object.fromEntries(
  questions.map((question) => [question.id, question.options[pick % question.options.length].id]),
));
const shownOf = (result) => [...result.sections.forYou, ...result.sections.mightHook];
const idsOf = (result) => shownOf(result).map(({ game }) => game.id).join("|");
const base = { curated, catalog, ownedIds: [], favoriteIds: [] };
const profile = profileFor(0);

const candidate = nintendoToCandidate(catalog[0]);
DIMENSIONS.forEach((dimension) => assert.ok(Number.isFinite(candidate.vector[dimension]), dimension));
assert.ok(candidate.id.startsWith("nintendo:MX:"));
console.log("[OK] Productos Nintendo traducidos a las 6 dimensiones del perfil");

const today = buildRecommendations(profile, { ...base, seed: "2026-10-20|0" });
assert.ok(today.pool.length > curated.length + 100, `Pool con ${today.pool.length} juegos`);
assert.equal(today.sections.forYou.length, 3);
assert.ok(today.sections.mightHook.length >= 6, "Sigue explorando con menos de 6");
assert.ok(today.duo.length >= 3, "Jugar con Inti con menos de 3");
shownOf(today).forEach(({ game }) => assert.ok(game.why, `${game.title} sin explicación`));
console.log(`[OK] Pool de ${today.pool.length} juegos: curados + Nintendo Store México`);

const seeds = ["2026-10-20|0", "2026-10-21|0", "2026-10-22|0", "2026-10-20|1", "2026-10-20|2"];
const variants = new Set(seeds.map((seed) => idsOf(buildRecommendations(profile, { ...base, seed }))));
assert.ok(variants.size >= 3, `Solo ${variants.size} variantes con 5 semillas`);
assert.equal(idsOf(buildRecommendations(profile, { ...base, seed: "x" })), idsOf(buildRecommendations(profile, { ...base, seed: "x" })));
console.log(`[OK] Rotación diaria y "Otras opciones": ${variants.size} variantes, mismo día estable`);

const mixed = [0, 1, 2, 3].some((pick) => shownOf(buildRecommendations(profileFor(pick), { ...base, seed: "2026-10-20|0" }))
  .some(({ game }) => game.source === "nintendo"));
assert.ok(mixed, "Ningún perfil recibe juegos del catálogo Nintendo");
console.log("[OK] Las recomendaciones incluyen juegos del catálogo completo");

const ownedId = today.sections.forYou[0].game.id;
const owned = buildRecommendations(profile, { ...base, ownedIds: [ownedId], seed: "2026-10-20|0" });
assert.equal([...shownOf(owned), ...owned.duo].some(({ game }) => game.id === ownedId), false);
console.log("[OK] Lo que ya está en Mi biblioteca no se vuelve a recomendar");

const families = shownOf(today).map(({ game }) => familyKey(game));
assert.equal(new Set(families).size, families.length, `Sagas repetidas: ${families.join(", ")}`);
const genres = {};
shownOf(today).forEach(({ game }) => { const key = game.genres?.[0] ?? ""; genres[key] = (genres[key] ?? 0) + 1; });
assert.ok(Math.max(...Object.values(genres)) <= 4, `Género repetido: ${JSON.stringify(genres)}`);
console.log("[OK] Variedad: sin sagas repetidas y máximo 4 juegos del mismo género");

console.log("\n[OK] QA del motor de recomendaciones v2 completo");

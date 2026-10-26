import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { computeProfile, DIMENSIONS } from "../js/profile.js";
import { adaptNintendoCatalog } from "../js/nintendo-catalog.js";
import { buildRecommendations, nintendoToCandidate, familyKey, reasonFor, omitOwned, normalizeTitle } from "../js/recommend-v2.js";

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

// The same game saved under a Nintendo id must not come back as its curated twin.
// The catalog is refreshed weekly, so the twin is found by title instead of being a fixed game.
const twin = catalog.find((game) => curated.some((entry) => normalizeTitle(entry.title) === normalizeTitle(game.name)));
assert.ok(twin, "Debe haber al menos un juego curado que también esté en el catálogo de Nintendo");
const twinCurated = curated.find((entry) => normalizeTitle(entry.title) === normalizeTitle(twin.name));
const twinStoreId = twin.catalog_id;
const ownedViaStore = buildRecommendations(profile, { ...base, ownedIds: [twinStoreId], seed: "t" });
assert.equal(ownedViaStore.ranked.some(({ game }) => game.id === twinCurated.id), false);
const favoriteViaStore = buildRecommendations(profile, { ...base, favoriteIds: [twinStoreId], seed: "t" });
assert.ok(favoriteViaStore.ranked.length > 0);
console.log("[OK] Un juego guardado con id de Nintendo tampoco se recomienda en su versión curada");

const otherCurated = curated.find((entry) => entry.id !== twinCurated.id && normalizeTitle(entry.title) !== normalizeTitle(twin.name));
const poolWithoutOwned = omitOwned(today.pool, { ownedIds: [twinStoreId, otherCurated.id], curated, catalog });
assert.equal(poolWithoutOwned.some((game) => game.id === twinCurated.id || game.id === otherCurated.id), false);
assert.equal(poolWithoutOwned.length, today.pool.length - 2);
assert.equal(omitOwned(today.pool, { curated, catalog }).length, today.pool.length);
console.log("[OK] omitOwned quita los juegos propios por id o por título y no toca el resto");

// Reasons must be facts the catalog confirms, never filler.
const GENERIC = /alrededor de tu|se quedan contigo|sin presión|desde el primer minuto|perderte en ella|que encaja con este mood|pega fuerte|mucho estilo|ideal para|adictiv|experiencia|rehecho/i;
curated.forEach((game) => assert.doesNotMatch(game.why, GENERIC, `${game.id}: frase genérica "${game.why}"`));

const FACTS = [
  [/cooperativo en línea/i, (c) => c.ways_to_play.includes("Cooperativo en línea")],
  [/misma consola/i, (c) => c.ways_to_play.includes("Juntos en una consola")],
  [/en línea con amigos/i, (c) => c.ways_to_play.includes("Juega en línea con amigos")],
  [/GameShare/i, (c) => c.ways_to_play.some((way) => way.startsWith("GameShare"))],
  [/exploración libre/i, (c) => c.features.includes("Exploración") || c.features.includes("Libertad de movimiento")],
  [/construir y crear/i, (c) => c.features.includes("Crea y juega")],
  [/supervivencia/i, (c) => c.features.includes("Supervivencia")],
  [/tono oscuro y de miedo/i, (c) => c.horror_level > 0],
  [/todo público/i, (c) => c.rating === "a"],
  [/se juega en solitario/i, (c) => c.player_count === "Un jugador"],
  [/derrota te manda al inicio/i, (c) => c.features.includes("Recomenzar de cero tras las derrotas")],
  [/elegir la dificultad/i, (c) => c.features.includes("Elige el nivel de dificultad")],
];
const reasonProfiles = [0, 1, 2, 3].map(profileFor);
let checked = 0;
for (const product of catalog) {
  const candidate = nintendoToCandidate(product);
  for (const reasonProfile of reasonProfiles) {
    const text = reasonFor(candidate, reasonProfile, new Set());
    assert.ok(text.length > 8, `${product.name}: razón vacía`);
    assert.doesNotMatch(text, GENERIC, `${product.name}: frase genérica "${text}"`);
    for (const [pattern, holds] of FACTS) {
      if (pattern.test(text)) assert.ok(holds(candidate), `${product.name}: "${text}" no está respaldado por los datos`);
    }
    checked += 1;
  }
}
console.log(`[OK] ${checked} razones de recomendación: ninguna genérica y todas respaldadas por los datos`);

console.log("\n[OK] QA del motor de recomendaciones v2 completo");

import assert from "node:assert/strict";
import {
  catalogIdFromFavoriteId, favoriteIdForCatalogGame, findCatalogGamesByIds,
  isCatalogFavoriteId, splitFavoriteIds,
} from "../js/catalog.js";

const check = (description, assertion) => { assertion(); console.log(`  [OK] ${description}`); };
console.log("\n⟦ Nintendo favorites QA ⟧");
check("identifica un favorito Nintendo", () => assert.equal(isCatalogFavoriteId("nintendo:MX:70010000000123"), true));
check("no confunde un ID curado", () => assert.equal(isCatalogFavoriteId("persona-5-royal"), false));
check("extrae el NSUID", () => assert.equal(catalogIdFromFavoriteId("nintendo:MX:70010000000123"), "70010000000123"));
check("rechaza IDs heredados o invalidos", () => {
  assert.equal(catalogIdFromFavoriteId("legacy:72"), null);
  assert.equal(catalogIdFromFavoriteId("nintendo:MX:no-valido"), null);
});
check("genera un ID estable", () => {
  assert.equal(favoriteIdForCatalogGame({ nsuid: "70010000000123" }), "nintendo:MX:70010000000123");
  assert.equal(favoriteIdForCatalogGame("70010000000456"), "nintendo:MX:70010000000456");
});
check("separa juegos curados y Nintendo", () => {
  const result = splitFavoriteIds(["persona-5-royal", "nintendo:MX:70010000000123"]);
  assert.deepEqual(result.curatedIds, ["persona-5-royal"]);
  assert.deepEqual(result.catalogIds, ["70010000000123"]);
});
check("resuelve productos conservando el orden", () => {
  const catalog = { games: [
    { nsuid: "70010000000456", name: "Segundo" },
    { nsuid: "70010000000123", name: "Primero" },
  ] };
  assert.deepEqual(findCatalogGamesByIds(catalog, ["70010000000123", "70010000000456"]).map((game) => game.nsuid), ["70010000000123", "70010000000456"]);
});
console.log("\n[OK] QA de favoritos Nintendo completo");

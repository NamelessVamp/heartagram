import assert from "node:assert/strict";

import {
  catalogIdFromFavoriteId,
  favoriteIdForCatalogGame,
  findCatalogGamesByIds,
  isCatalogFavoriteId,
  splitFavoriteIds,
} from "../js/catalog.js";

function check(description, assertion) {
  assertion();

  console.log(`  [OK] ${description}`);
}

console.log("\n⟦ Catalog favorites QA ⟧");

check("identifica un favorito IGDB", () => {
  assert.equal(isCatalogFavoriteId("igdb:72"), true);
});

check("no confunde un ID curado con IGDB", () => {
  assert.equal(isCatalogFavoriteId("persona-5-royal"), false);
});

check("extrae el ID numérico de IGDB", () => {
  assert.equal(catalogIdFromFavoriteId("igdb:7346"), 7346);
});

check("rechaza un ID IGDB inválido", () => {
  assert.equal(catalogIdFromFavoriteId("igdb:no-valido"), null);
});

check("rechaza un ID IGDB vacío", () => {
  assert.equal(catalogIdFromFavoriteId("igdb:"), null);
});

check("rechaza un ID IGDB negativo", () => {
  assert.equal(catalogIdFromFavoriteId("igdb:-72"), null);
});

check("genera un ID de favorito estable", () => {
  assert.equal(
    favoriteIdForCatalogGame({
      igdb_id: 72,
    }),
    "igdb:72",
  );

  assert.equal(favoriteIdForCatalogGame(7346), "igdb:7346");
});

check("separa favoritos curados e IGDB", () => {
  const result = splitFavoriteIds([
    "persona-5-royal",
    "igdb:72",
    "zelda-botw",
    "igdb:7346",
  ]);

  assert.deepEqual(result.curatedIds, ["persona-5-royal", "zelda-botw"]);

  assert.deepEqual(result.catalogIds, [72, 7346]);
});

check("los IDs inválidos permanecen fuera del catálogo IGDB", () => {
  const result = splitFavoriteIds(["igdb:no-valido", "portal-2"]);

  assert.deepEqual(result.curatedIds, ["igdb:no-valido", "portal-2"]);

  assert.deepEqual(result.catalogIds, []);
});

check("resuelve juegos IGDB conservando el orden de favoritos", () => {
  const catalog = {
    games: [
      {
        igdb_id: 7346,
        name: "The Legend of Zelda: Breath of the Wild",
      },
      {
        igdb_id: 72,
        name: "Portal 2",
      },
      {
        igdb_id: 1942,
        name: "The Witcher 3: Wild Hunt",
      },
    ],
  };

  const result = findCatalogGamesByIds(catalog, [72, 1942, 7346]);

  assert.deepEqual(
    result.map((game) => game.igdb_id),
    [72, 1942, 7346],
  );
});

check("ignora juegos que ya no existen en el índice", () => {
  const catalog = {
    games: [
      {
        igdb_id: 72,
        name: "Portal 2",
      },
    ],
  };

  const result = findCatalogGamesByIds(catalog, [72, 999999]);

  assert.deepEqual(
    result.map((game) => game.igdb_id),
    [72],
  );
});

check("tolera entradas inválidas", () => {
  assert.deepEqual(findCatalogGamesByIds(null, [72]), []);

  assert.deepEqual(
    findCatalogGamesByIds(
      {
        games: [],
      },
      null,
    ),
    [],
  );
});

console.log("\n[OK] QA de favoritos mixtos completo");

import assert from "node:assert/strict";
import {
  countCollectionItems,
  normalizeCollectionTab,
  readCollectionTab,
  writeCollectionTab,
} from "../js/collection-ui.js";

assert.equal(normalizeCollectionTab("interested"), "interested");
assert.equal(normalizeCollectionTab("owned"), "owned");
assert.equal(normalizeCollectionTab("other"), "interested");
console.log("[OK] normaliza el segmento activo");

const counts = countCollectionItems({
  interestedCuratedGames: [{}, {}],
  interestedCatalogGames: [{}],
  ownedCuratedGames: [{}],
  ownedCatalogGames: [{}, {}],
});
assert.deepEqual(counts, { interested: 3, owned: 3 });
console.log("[OK] cuenta juegos curados e IGDB por segmento");

const data = new Map();
const storage = {
  getItem(key) {
    return data.get(key) ?? null;
  },
  setItem(key, value) {
    data.set(key, value);
  },
};

assert.equal(readCollectionTab(storage), "interested");
writeCollectionTab("owned", storage);
assert.equal(readCollectionTab(storage), "owned");
console.log("[OK] persiste el segmento activo");

console.log("\n[OK] QA de Mi lista completo");

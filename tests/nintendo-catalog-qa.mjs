import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { adaptNintendoCatalog } from "../js/nintendo-catalog.js";
const payload = JSON.parse(await readFile(new URL("../data/nintendo_catalog.json", import.meta.url), "utf-8"));
const catalog = adaptNintendoCatalog(payload);
assert.equal(catalog.games.length, 318);
assert.ok(catalog.games.every((game) => game.catalog_id.startsWith("nintendo:MX:")));
assert.ok(catalog.games.every((game) => game.cover && game.release_date));
console.log("[OK] Nintendo preview adapter maps 318 official products");

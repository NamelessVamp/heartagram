import assert from "node:assert/strict";
import { catalogModeFromSearch } from "../js/catalog.js";

assert.equal(catalogModeFromSearch(""), "nintendo");
assert.equal(catalogModeFromSearch("?catalog=nintendo"), "nintendo");
assert.equal(catalogModeFromSearch("?catalog=igdb"), "igdb");
assert.equal(catalogModeFromSearch("?catalog=unexpected"), "nintendo");
assert.equal(catalogModeFromSearch("?preview=1"), "nintendo");

console.log("[OK] Nintendo is the default browser catalog and IGDB remains an explicit rollback");

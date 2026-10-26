import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const games = JSON.parse(readFileSync("data/games.json", "utf8"));
const raw = JSON.parse(readFileSync("data/nintendo_catalog.json", "utf8"));
const products = raw.games || raw.products || raw;
const covers = new Set(products.map((product) => product.cover_url).filter(Boolean));

const withCover = games.filter((game) => game.cover_url);
assert.ok(withCover.length >= 29, `Solo ${withCover.length} juegos con portada`);
for (const game of withCover) assert.ok(game.cover_url.startsWith("https://"), `${game.id}: cover_url no es https`);
// The catalog is refreshed weekly: a few covers may drop out of the snapshot without being broken.
const missing = withCover.filter((game) => !covers.has(game.cover_url)).map((game) => game.id);
assert.ok(missing.length <= 3, `${missing.length} portadas curadas ya no están en el catálogo: ${missing.join(", ")}`);
console.log(`[OK] ${withCover.length}/${games.length} juegos curados con portada oficial (${missing.length} fuera del catálogo actual)`);

const ui = readFileSync("js/ui.js", "utf8");
assert.ok(ui.includes("card-signal-fallback"), "gameCard no tiene respaldo de título");
assert.equal(ui.includes('"card-signal-initials", initials'), false, "gameCard aún pinta iniciales");
console.log("[OK] gameCard usa portada o título completo, sin iniciales");

console.log("\n[OK] QA de portadas completo");

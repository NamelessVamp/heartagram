import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { curatedGenreLabel } from "../js/catalog-labels.js";
import { homeCoverGames } from "../js/home-dashboard.js";

assert.equal(curatedGenreLabel("OPEN_WORLD"), "Mundo abierto");
assert.equal(curatedGenreLabel("SURVIVAL"), "Supervivencia");
assert.equal(curatedGenreLabel("SOMETHING_NEW"), "Something new");
assert.equal(curatedGenreLabel(""), "");
console.log("[OK] Géneros curados legibles en español");

const game = (id, cover) => ({ id, cover_url: cover });
const sections = {
  forYou: [{ game: game("a", "https://x/a") }, { game: game("b", null) }],
  mightHook: [{ game: game("a", "https://x/a") }, { game: game("c", "https://x/c") },
    { game: game("d", "https://x/d") }, { game: game("e", "https://x/e") }, { game: game("f", "https://x/f") }],
};
assert.deepEqual(homeCoverGames(sections).map((g) => g.id), ["a", "c", "d", "e"]);
assert.deepEqual(homeCoverGames(null), []);
console.log("[OK] Tira de Inicio: sin duplicados, sin juegos sin portada, máximo 4");

for (const path of ["js/ui.js", "js/catalog-ui.js"]) {
  assert.equal(readFileSync(path, "utf8").includes("initials"), false, `${path} aún usa iniciales`);
}
assert.equal(readFileSync("js/ui.js", "utf8").includes('" // "'), false, "Géneros aún unidos con //");
assert.ok(readFileSync("index.html", "utf8").includes('id="home-cover-strip"'), "Falta la tira de portadas");
console.log("[OK] Sin iniciales ni separadores // en las cards");

console.log("\n[OK] QA del lavado de cara completo");

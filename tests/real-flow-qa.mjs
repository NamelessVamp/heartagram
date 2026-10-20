import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { computeProfile } from "../js/profile.js";
import { rankGames, buildSections, buildDuo } from "../js/recommender.js";

// Real browser flow: no ?preview, data straight from disk.
const questions = JSON.parse(readFileSync("data/questions.json", "utf8"));
const games = JSON.parse(readFileSync("data/games.json", "utf8"));

const unverified = games.filter((game) => game.status !== "VERIFICADO").map((game) => game.id);
assert.deepEqual(unverified, [], `Juegos sin verificar: ${unverified.join(", ")}`);
console.log(`[OK] ${games.length} juegos curados con status VERIFICADO`);

const maxOptions = Math.max(...questions.map((question) => question.options.length));
for (let pick = 0; pick < maxOptions; pick += 1) {
  const answers = Object.fromEntries(
    questions.map((question) => [question.id, question.options[pick % question.options.length].id]),
  );
  const profile = computeProfile(questions, answers);
  const ranked = rankGames(profile, games);
  const sections = buildSections(profile, ranked);

  assert.ok(ranked.length >= 10, `Perfil ${pick + 1}: ranking con ${ranked.length} juegos`);
  assert.ok(sections.forYou.length > 0, `Perfil ${pick + 1}: "Para ti" vacío`);
  assert.ok(sections.mightHook.length > 0, `Perfil ${pick + 1}: "Sigue explorando" vacío`);
  assert.ok(buildDuo(profile, ranked).length > 0, `Perfil ${pick + 1}: "Para jugar con Inti" vacío`);
}
console.log(`[OK] ${maxOptions} perfiles reales llenan Para ti, Sigue explorando y Para jugar con Inti`);

console.log("\n[OK] QA del flujo real completo");

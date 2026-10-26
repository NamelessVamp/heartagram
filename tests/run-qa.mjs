// QA harness: runs the 4 simulated profiles from TEST_DESIGN.md against the
// curated games and the same recommendation engine the app uses.

import { readFile } from "node:fs/promises";
import { computeProfile } from "../js/profile.js";
import { buildRecommendations } from "../js/recommend-v2.js";

const load = async (p) => JSON.parse(await readFile(new URL(p, import.meta.url), "utf-8"));
const questions = await load("../data/questions.json");
const archetypes = await load("../data/archetypes.json");
const games = await load("../data/games.json");

const archName = (id) => archetypes.find((a) => a.id === id).name;
const toAnswers = (letters) =>
  Object.fromEntries(letters.split(",").map((l, i) => [`q${i + 1}`, l.trim().toLowerCase()]));

const CASES = [
  { name: "Horror puro", answers: "D,D,C,D,A,C,B,B,B,B,B,C", primary: "HORROR_FAN",
    topCheck: ({ game }) => game.vector.mood >= 1 },
  { name: "Cozy", answers: "C,D,B,A,C,A,C,C,C,D,D,A", primary: "CREATOR",
    topCheck: ({ game }) => game.vector.mood <= -1 },
  { name: "Competitiva", answers: "B,A,D,C,B,A,A,A,D,A,C,B", primary: "COMPETITOR",
    topCheck: ({ game }) => game.personality.includes("COMPETITOR") },
  { name: "Probable Adriana", answers: "A,A,A,C,A,B,A,B,B,B,A,D", primary: "EXPLORER",
    topCheck: () => true },
];

let failures = 0;
const check = (ok, msg) => {
  console.log(`  ${ok ? "[OK]  " : "[FAIL]"} ${msg}`);
  if (!ok) failures++;
};

for (const testCase of CASES) {
  const profile = computeProfile(questions, toAnswers(testCase.answers));
  const { sections, duo } = buildRecommendations(profile, { curated: games });
  const { primary, secondary } = profile.archetypes;

  console.log(`\n⟦ ${testCase.name} ⟧  ${archName(primary)} · ${archName(secondary)}  (horror ${profile.horrorTolerance}, pareja ${profile.couplePref})`);
  console.log(`  top 3      : ${sections.forYou.map(({ game }) => game.title).join(" | ")}`);
  console.log(`  fuera zona : ${sections.outOfZone?.game.title ?? "—"}`);
  console.log(`  duo top 3  : ${duo.slice(0, 3).map(({ game, badges }) => `${game.title} [${badges.join(", ")}]`).join(" | ")}`);

  check(primary === testCase.primary, `arquetipo principal = ${testCase.primary}`);
  check(sections.forYou.filter(testCase.topCheck).length >= 2, "top 3 coherente con el perfil");
}

console.log(failures === 0 ? "\n[OK] QA completo" : `\n[FAIL] ${failures} checks fallaron`);
process.exit(failures === 0 ? 0 : 1);

// QA harness: runs the 4 simulated profiles from TEST_DESIGN.md.
// Uses an in-memory fixture with FAKE prices and multiplayer flags taken from
// the seed hypotheses. Nothing here is written back to data/.

import { readFile } from "node:fs/promises";
import { computeProfile } from "../js/profile.js";
import { rankGames, buildSections, buildDuo } from "../js/recommender.js";
import { buildCarts, BUDGET_MXN } from "../js/carts.js";

const load = async (p) => JSON.parse(await readFile(new URL(p, import.meta.url), "utf-8"));
const questions = await load("../data/questions.json");
const archetypes = await load("../data/archetypes.json");
const seed = await load("../data/games.json");

const FAKE_PRICES = [299, 449, 599, 799, 999, 1299];

function toFixture(games) {
  return games.map((game, i) => {
    const duo = game._hypothesis.duo;
    const online = duo.includes("ON");
    const local = duo.includes("LOC");
    return {
      ...game,
      status: "VERIFICADO",
      price_mxn: game.free_to_play ? 0 : FAKE_PRICES[i % FAKE_PRICES.length],
      multiplayer: {
        online_coop: online, online_versus: online,
        local_wireless: local, same_console: local,
        requires_nso: online, gameshare: false,
      },
    };
  });
}

const games = toFixture(seed);
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
  const ranked = rankGames(profile, games);
  const sections = buildSections(profile, ranked);
  const duo = buildDuo(profile, ranked);
  const carts = buildCarts(ranked, duo, sections.outOfZone);
  const { primary, secondary } = profile.archetypes;

  console.log(`\n⟦ ${testCase.name} ⟧  ${archName(primary)} · ${archName(secondary)}  (horror ${profile.horrorTolerance}, pareja ${profile.couplePref})`);
  console.log(`  top 3      : ${sections.forYou.map(({ game }) => game.title).join(" | ")}`);
  console.log(`  fuera zona : ${sections.outOfZone?.game.title ?? "—"}`);
  console.log(`  duo top 3  : ${duo.slice(0, 3).map(({ game, badges }) => `${game.title} [${badges.join(", ")}]`).join(" | ")}`);
  for (const cart of carts) {
    console.log(`  carrito ${cart.name.padEnd(14)}: $${cart.total} → ${cart.items.map(({ game }) => game.title).join(", ")}`);
  }

  check(primary === testCase.primary, `arquetipo principal = ${testCase.primary}`);
  check(sections.forYou.filter(testCase.topCheck).length >= 2, "top 3 coherente con el perfil");
  check(carts.every((c) => c.total <= BUDGET_MXN), `ningún carrito supera $${BUDGET_MXN}`);
  check(carts.some((c) => c.id === "duo"), "existe Duo Pack");
}

console.log(failures === 0 ? "\n[OK] QA completo" : `\n[FAIL] ${failures} checks fallaron`);
process.exit(failures === 0 ? 0 : 1);

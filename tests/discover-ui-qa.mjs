import assert from "node:assert/strict";
import {
  discoverProfileNames,
  selectMoodGames,
} from "../js/discover-ui.js";

const games = [
  {
    id: "dark",
    title: "Dark",
    status: "VERIFICADO",
    horror_level: 3,
    vector: { mood: 2, challenge: 1, pace: 0, freedom: 0, story: 1 },
    personality: [],
  },
  {
    id: "cozy",
    title: "Cozy",
    status: "VERIFICADO",
    horror_level: 0,
    vector: { mood: -2, challenge: -2, pace: -2, freedom: 1, story: 0 },
    personality: [],
  },
  {
    id: "competitive",
    title: "Competitive",
    status: "VERIFICADO",
    horror_level: 0,
    vector: { mood: 0, challenge: 2, pace: 2, freedom: 0, story: 0 },
    personality: ["COMPETITOR"],
  },
  {
    id: "explore",
    title: "Explore",
    status: "VERIFICADO",
    horror_level: 0,
    vector: { mood: 0, challenge: 0, pace: 0, freedom: 2, story: 2 },
    personality: [],
  },
];

assert.equal(selectMoodGames(games, "DARK", 1)[0].id, "dark");
assert.equal(selectMoodGames(games, "RELAXED", 1)[0].id, "cozy");
assert.equal(selectMoodGames(games, "COMPETITIVE", 1)[0].id, "competitive");
assert.equal(selectMoodGames(games, "EXPLORE", 1)[0].id, "explore");
console.log("[OK] selecciona juegos por mood sin mutar el perfil");

const names = discoverProfileNames(
  { archetypes: { primary: "A", secondary: "B" } },
  [
    { id: "A", name: "Principal" },
    { id: "B", name: "Secundario" },
  ],
);
assert.deepEqual(names, { primary: "Principal", secondary: "Secundario" });
console.log("[OK] resuelve los nombres del perfil para Descubrir");

console.log("\n[OK] QA de Descubrir completo");

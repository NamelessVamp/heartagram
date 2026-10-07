import assert from "node:assert/strict";

import { buildCarts } from "../js/carts.js";

const freeGame = {
  game: {
    id: "free-game",
    title: "Free Game",
    free_to_play: true,
    price_mxn: 0,
  },
  score: 100,
};

const pendingGame = {
  game: {
    id: "pending-game",
    title: "Pending Game",
    free_to_play: false,
    price_mxn: null,
  },
  score: 90,
};

const carts = buildCarts([freeGame, pendingGame], [freeGame], pendingGame);

assert.deepEqual(
  carts,
  [],
  "No debe construir carritos sin juegos con precio confirmado.",
);

console.log("[OK] El presupuesto no crea combinaciones falsas de $0");

// Tests shared labels and date formatting without browser dependencies.
import assert from "node:assert/strict";

import { catalogLabel, formatCatalogDate } from "../js/catalog-labels.js";

function check(description, assertion) {
  assertion();
  console.log(`[OK] ${description}`);
}

check("traduce géneros", () => {
  assert.equal(catalogLabel("Adventure"), "Aventura");
  assert.equal(catalogLabel("Platform"), "Plataformas");
});

check("traduce modos y tipos", () => {
  assert.equal(catalogLabel("Single player"), "Un jugador");
  assert.equal(catalogLabel("Co-operative"), "Cooperativo");
  assert.equal(catalogLabel("Main Game"), "Juego principal");
});

check("conserva etiquetas desconocidas", () => {
  assert.equal(catalogLabel("Unknown genre"), "Unknown genre");
});

check("conserva valores ausentes", () => {
  assert.equal(catalogLabel(undefined), undefined);
  assert.equal(catalogLabel(null), null);
});

check("formatea una fecha completa", () => {
  assert.equal(formatCatalogDate("2021-04-10"), "10 de abril de 2021");
});

check("conserva fechas incompletas", () => {
  assert.equal(formatCatalogDate("2026"), "2026");
  assert.equal(formatCatalogDate("2026-04"), "2026-04");
});

check("maneja fechas ausentes", () => {
  for (const value of [null, undefined, "", "   "]) {
    assert.equal(formatCatalogDate(value), "Por confirmar");
  }
});

check("no convierte fechas inválidas en otra fecha", () => {
  for (const value of [
    "2025-02-29",
    "2026-02-30",
    "2026-13-01",
    "2026-00-10",
    "2026-04-00",
  ]) {
    assert.equal(formatCatalogDate(value), value);
  }
});

check("acepta un día bisiesto válido", () => {
  assert.equal(formatCatalogDate("2024-02-29"), "29 de febrero de 2024");
});

check("elimina espacios exteriores", () => {
  assert.equal(formatCatalogDate(" 2021-04-10 "), "10 de abril de 2021");
});

console.log("\n[OK] QA de etiquetas y fechas completo");

// Tests shared catalog labels without browser dependencies.
import assert from "node:assert/strict";

import { catalogLabel, formatPricedAt, formatSaleEnd } from "../js/catalog-labels.js";

function check(description, assertion) {
  assertion();
  console.log(`[OK] ${description}`);
}

check("traduce los tipos de producto de Nintendo", () => {
  assert.equal(catalogLabel("game"), "Juego");
  assert.equal(catalogLabel("bundle"), "Paquete");
  assert.equal(catalogLabel("upgrade_pack"), "Paquete de mejora");
});

check("conserva etiquetas que ya vienen en español", () => {
  assert.equal(catalogLabel("Aventura"), "Aventura");
  assert.equal(catalogLabel("Juntos en una consola"), "Juntos en una consola");
});

check("conserva valores ausentes", () => {
  assert.equal(catalogLabel(undefined), undefined);
  assert.equal(catalogLabel(null), null);
});

check("formatea fechas de oferta en hora de Ciudad de México", () => {
  assert.equal(formatSaleEnd("2026-10-29T23:59:59Z"), "29 de octubre");
  assert.equal(formatSaleEnd("2026-10-16T06:59:59Z"), "16 de octubre");
  assert.equal(formatPricedAt("2026-10-09T18:08:40+00:00"), "9 de octubre de 2026");
  assert.equal(formatSaleEnd(null), "");
  assert.equal(formatPricedAt("no es fecha"), "");
});

console.log("\n[OK] QA de etiquetas completo");

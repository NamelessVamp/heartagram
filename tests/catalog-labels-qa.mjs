// Tests shared catalog labels without browser dependencies.
import assert from "node:assert/strict";

import { catalogLabel } from "../js/catalog-labels.js";

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

console.log("\n[OK] QA de etiquetas completo");

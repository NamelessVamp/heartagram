import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf-8");
const css = await readFile(
  new URL("../css/screens/catalog.css", import.meta.url),
  "utf-8",
);

const requiredIds = [
  "catalog-loading",
  "catalog-content",
  "catalog-query",
  "catalog-platform",
  "catalog-genre",
  "catalog-mode",
  "catalog-sort",
  "catalog-sale",
  "catalog-price-note",
  "catalog-count",
  "catalog-clear",
  "catalog-grid",
  "catalog-previous",
  "catalog-page",
  "catalog-next",
  "catalog-dialog",
];

for (const id of requiredIds) {
  assert.match(html, new RegExp(`id=["']${id}["']`));
}
console.log("[OK] conserva todos los puntos de montaje del catalogo");

assert.match(html, /class="screen catalog-screen"/);
assert.match(html, /css\/screens\/catalog\.css/);
console.log("[OK] conecta el markup y los estilos del nuevo Explorar");

assert.match(css, /repeat\(4, minmax\(0, 1fr\)\)/);
assert.match(css, /repeat\(3, minmax\(0, 1fr\)\)/);
assert.match(css, /repeat\(2, minmax\(0, 1fr\)\)/);
assert.match(css, /grid-template-columns: 1fr;/);
console.log("[OK] define grid responsive de cuatro a una columna");

console.log("\n[OK] QA del layout de Explorar completo");

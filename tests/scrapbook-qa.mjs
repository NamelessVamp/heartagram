import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const css = readFileSync("css/theme-scrapbook.css", "utf8");

assert.ok(html.includes('href="css/theme-scrapbook.css?v=ui11"'), "Falta theme-scrapbook.css");
assert.ok(html.indexOf("theme-scrapbook.css") > html.indexOf("theme-bouquet.css"), "Scrapbook debe cargar después de Midnight Bouquet");
assert.ok(html.includes("family=Special+Elite"), "Falta la fuente de máquina de escribir");
console.log("[OK] Scrapbook cargado al final de la cascada con su tipografía");

for (const piece of ["--paper", "--tape", "--rose-pressed", ".home-cover-strip img", ".catalog-wishlist-card", ".collection-owned-seal"]) {
  assert.ok(css.includes(piece), `Falta la pieza ${piece}`);
}
console.log("[OK] Papel, cinta, polaroids, flores prensadas y sellos");

assert.equal(/\.catalog-card\b|\.npd|\.guide-|\.nso/.test(css), false, "Explorar, detalle y guías deben quedar tranquilos");
console.log("[OK] Explorar, detalle, Inicia aquí y guía Online sin decoración extra");

console.log("\n[OK] QA de Scrapbook fase 1 completo");

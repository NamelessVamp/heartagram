import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const css = readFileSync("css/theme-scrapbook.css", "utf8");

assert.ok(html.includes('href="css/theme-scrapbook.css?v=ui18"'), "Falta theme-scrapbook.css con ui18");
assert.ok(html.indexOf("theme-scrapbook.css") > html.indexOf("theme-bouquet.css"), "Scrapbook debe cargar después de Midnight Bouquet");
assert.ok(html.includes("family=Special+Elite"), "Falta la fuente de máquina de escribir");
console.log("[OK] Scrapbook cargado al final de la cascada con su tipografía");

for (const piece of ["--paper", "--tape", "--rose-pressed", ".home-cover-strip img", ".catalog-wishlist-card", ".collection-owned-seal"]) {
  assert.ok(css.includes(piece), `Fase 1: falta ${piece}`);
}
console.log("[OK] Fase 1: Inicio y Mi lista");

for (const piece of [".bq-tarot", ".profile-copy", ".profile-trait-fill"]) {
  assert.ok(css.includes(piece), `Fase 2: falta ${piece}`);
}
console.log("[OK] Fase 2: Perfil como carta de tarot");

for (const piece of [".card-hero", ".discover-profile", ".gift-slot", ".gift-code-card", ".collection-empty-state"]) {
  assert.ok(css.includes(piece), `Fase 3: falta ${piece}`);
}
console.log("[OK] Fase 3: Descubrir, Mi regalo y estados vacíos");

for (const piece of ["Ajustes de pulido", ".gift-screen > .eyebrow::first-letter", ".collection-header .collection-kicker"]) {
  assert.ok(css.includes(piece), `Pulido: falta ${piece}`);
}
console.log("[OK] Pulido: botones sobre papel, listón, kicker de Mi lista y cinta");

assert.equal(/\.catalog-card\b|\.npd|\.guide-|\.nso/.test(css), false, "Explorar, detalle y guías deben quedar tranquilos");
console.log("[OK] Explorar, detalle, Inicia aquí y guía Online sin decoración extra");

console.log("\n[OK] QA de Scrapbook completo");

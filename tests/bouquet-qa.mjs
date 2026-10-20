import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const css = readFileSync("css/theme-bouquet.css", "utf8");
const js = readFileSync("js/bouquet.js", "utf8");

assert.ok(html.includes('href="css/theme-bouquet.css?v=ui7"'), "index.html no carga theme-bouquet.css");
assert.ok(html.includes('src="js/bouquet.js?v=v122"'), "index.html no carga bouquet.js");
assert.ok(html.indexOf("theme-bouquet.css") > html.indexOf("screens/profile.css"), "theme-bouquet.css debe cargar al final");
console.log("[OK] Midnight Bouquet cargado al final de la cascada");

for (const token of ["--font-hand", "--emily", "--violet", "#e86fa6"]) {
  assert.ok(css.includes(token), `Falta ${token} en la paleta`);
}
assert.ok(css.includes("@layer theme"), "Las decoraciones deben vivir en @layer theme");
console.log("[OK] Paleta Midnight Bouquet y capa theme");

assert.equal(/url\(\s*["']?https?:/i.test(css) || /<img/i.test(js), false, "Sin imágenes externas de personajes");
for (const need of ["prefers-reduced-motion", "ArrowUp", "heartagram:favorites-changed", "heartagram:library-changed"]) {
  assert.ok(js.includes(need), `bouquet.js no incluye ${need}`);
}
console.log("[OK] Decoraciones propias, movimiento reducido, guardado y easter egg");

console.log("\n[OK] QA de Midnight Bouquet completo");

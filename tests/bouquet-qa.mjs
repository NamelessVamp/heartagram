import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const css = readFileSync("css/theme-bouquet.css", "utf8");
const js = readFileSync("js/bouquet.js", "utf8");

assert.ok(html.includes('href="css/theme-bouquet.css?v=ui17"'), "index.html no carga theme-bouquet.css");
assert.ok(html.includes('src="js/bouquet.js?v=v134"'), "index.html no carga bouquet.js");
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

// Emojis add life, but a screen reader should not read them out.
const bare = html.replace(/<span[^>]*aria-hidden="true"[^>]*>[^<]*<\/span>/g, "").replace(/<script[\s\S]*?<\/script>/g, "");
const loose = bare.match(/\p{Emoji_Presentation}/gu) ?? [];
assert.deepEqual(loose, [], `Emojis fuera de aria-hidden en index.html: ${loose.join(" ")}`);
assert.ok((html.match(/<span[^>]*aria-hidden="true"[^>]*>\p{Emoji_Presentation}/gu) ?? []).length >= 10, "Faltan emojis en pestañas y cifras");
console.log("[OK] Los emojis del HTML están ocultos para lectores de pantalla");

// The saved-game emoji and the guide celebration must respect reduced motion and page load.
assert.match(js, /function floatEmoji[\s\S]*?if \(reduceMotion\) return;/, "floatEmoji debe respetar movimiento reducido");
assert.match(css, /@media \(prefers-reduced-motion: reduce\) {\s*\.bq-float/, "Falta el CSS de movimiento reducido para .bq-float");
assert.match(js, /document.body.dataset.screen === "getting-started"/, "La celebración solo debe ocurrir en la guía");
console.log("[OK] Animaciones de guardado y celebración respetan movimiento reducido");

// All visible text is Spanish.
const ENGLISH = /PLAYER TWO|UNLOCKED|SAVING|SAVED TO|MOOD MATCH|Good games|happier me/;
for (const [name, text] of [["index.html", html], ["js/bouquet.js", js], ["js/discover-ui.js", readFileSync("js/discover-ui.js", "utf8")]]) {
  assert.doesNotMatch(text, ENGLISH, `Texto en inglés en ${name}`);
}
console.log("[OK] Sin frases en inglés en la interfaz");

console.log("\n[OK] QA de Midnight Bouquet completo");

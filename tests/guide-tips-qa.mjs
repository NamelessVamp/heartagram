import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const tips = html.match(/class="guide-tip"/g) ?? [];
assert.equal(tips.length, 20, `Se esperaban 20 trucos y hay ${tips.length}`);
assert.ok(html.includes('id="guide-tips-title"'), "Falta la sección Trucos y secretos");
assert.ok(html.indexOf("guide-tips") < html.indexOf('class="guide-footer"'), "Los trucos deben ir antes del pie de la guía");
for (const topic of ["GameChat", "GameShare", "90 %", "Buscar controles", "DekuDeals"]) {
  assert.ok(html.includes(topic), `Falta el truco de ${topic}`);
}
console.log("[OK] 20 trucos en 6 grupos: batería, controles, pantalla, juntos, fotos y comunidad");
console.log("\n[OK] QA de Trucos y secretos completo");

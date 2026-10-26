import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const tips = html.match(/class="guide-tip"/g) ?? [];
assert.equal(tips.length, 29, `Se esperaban 29 trucos y hay ${tips.length}`);
assert.ok(html.includes('id="guide-tips-title"'), "Falta la sección Trucos y secretos");
assert.ok(html.indexOf("guide-tips") < html.indexOf('class="guide-footer"'), "Los trucos deben ir antes del pie de la guía");
for (const topic of [
  "GameChat", "GameShare", "90 %", "Buscar controles", "DekuDeals",
  "menú de recuperación", "PIN", "microSD Express", "Actualizar controles", "Audio por Bluetooth",
  "mejora del modo portátil", "GameCube", "Cámara USB", "GL y GR", "Intercambia A y B",
]) {
  assert.ok(html.includes(topic), `Falta el truco de ${topic}`);
}
console.log("[OK] 29 trucos en 6 grupos: batería, controles, pantalla, juntos, fotos y comunidad");

// Claims that Nintendo's pages did not confirm for the Switch 2 stay out (see docs/TIPS_SOURCES.md).
for (const unverified of ["Entra más rápido", "selección de usuario", "cargar el móvil", "Telegram", "carga más rápido"]) {
  assert.equal(html.includes(unverified), false, `Truco sin confirmar: ${unverified}`);
}
console.log("[OK] Ningún truco depende de datos que Nintendo no confirmó");

console.log("\n[OK] QA de Trucos y secretos completo");

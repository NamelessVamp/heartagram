import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const start = html.indexOf('id="nso-title"');
assert.ok(start >= 0, "Falta la guia Nintendo Switch Online");
const section = html.slice(start, html.indexOf("</section>", start));

assert.ok(section.includes("Familiar + Paquete de expansión"), "Falta el plan Expansión");
for (const benefit of [
  "Juego en línea",
  "guardado de partidas en la nube",
  "GameCube",
  "Nintendo 64",
  "Game Boy Advance",
  "Virtual Boy",
  "SEGA Genesis",
  "Mario Kart 8 Deluxe",
  "Happy Home Paradise",
  "Octo Expansion",
  "Breath of the Wild",
  "Tears of the Kingdom",
]) {
  assert.ok(section.includes(benefit), `Falta el beneficio: ${benefit}`);
}

for (const removed of [
  "Nintendo Switch Online</h4>",
  "Por qué familiar si somos dos",
  "No existe un plan para dos",
  "Precio al año",
  "Todo lo del plan normal",
  "$1,029",
  "$1,649",
  "$2,058",
  "Precios de referencia",
]) {
  assert.equal(section.includes(removed), false, `Contenido que debia eliminarse: ${removed}`);
}

assert.equal((section.match(/<article class="nso-plan/g) ?? []).length, 1, "Debe quedar un solo plan");
console.log("[OK] NSO muestra solo Familiar + Paquete de expansion, sin precios ni comparaciones");
console.log("\n[OK] QA de Nintendo Switch Online simplificado completo");

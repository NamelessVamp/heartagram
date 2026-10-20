import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const family = html.slice(html.indexOf('data-screen="family"'));
assert.ok(family.includes('id="nso-title"'), "La sección Online debe estar en la pantalla del grupo familiar");
for (const topic of ["Paquete de expansión", "GameCube", "hasta 8 cuentas", "No existe un plan para dos", "$1,649", "renovación automática"]) {
  assert.ok(html.includes(topic), `Falta: ${topic}`);
}
assert.equal((html.match(/<article class="nso-plan/g) ?? []).length, 2, "Deben compararse dos planes");
console.log("[OK] Sección Nintendo Switch Online: planes, precios, grupo familiar y GameCube");
console.log("\n[OK] QA de Nintendo Switch Online completo");

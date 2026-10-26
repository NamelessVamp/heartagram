import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const tips = html.match(/class="guide-tip"/g) ?? [];
assert.equal(tips.length, 38, `Se esperaban 38 trucos y hay ${tips.length}`);
assert.ok(html.includes('id="guide-tips-title"'), "Falta la sección Trucos y secretos");
assert.ok(html.indexOf("guide-tips") < html.indexOf('class="guide-footer"'), "Los trucos deben ir antes del pie de la guía");
for (const topic of [
  "GameChat", "GameShare", "90 %", "Buscar controles", "DekuDeals",
  "menú de recuperación", "PIN", "microSD Express", "Actualizar controles", "Audio por Bluetooth",
  "mejora del modo portátil", "GameCube", "Cámara USB", "GL y GR", "Intercambia A y B",
  "película de la pantalla", "Qué cargador sirve", "Calibrar palancas", "Tarjetas Game-Key", "Lista de deseos de la eShop",
  "Juegos y tienda", "Wind Waker", "Un piano escondido", "rango RGB",
]) {
  assert.ok(html.includes(topic), `Falta el truco de ${topic}`);
}
console.log("[OK] 38 trucos en 7 grupos: batería, controles, pantalla, juntos, fotos, juegos y tienda, comunidad");

// Each tip must sit in the group a reader would look for it in.
const groupBlocks = html.split('<details class="guide-chapter guide-tip-group">').slice(1).map((block) => block.slice(0, block.indexOf("</details>")));
const groups = new Map(groupBlocks.map((block) => [block.split("<h3>")[1].split("<")[0], block]));
assert.equal(groups.size, 7, `Se esperaban 7 grupos y hay ${groups.size}`);
for (const [group, topics] of Object.entries({
  "Batería y cuidado": ["menú de recuperación", "PIN", "microSD Express", "película de la pantalla", "Qué cargador sirve"],
  "Controles": ["Calibrar palancas", "Audio por Bluetooth", "Intercambia A y B", "Actualizar controles"],
  "Pantalla y TV": ["mejora del modo portátil", "rango RGB"],
  "Jugar con Inti": ["GameChat", "GameShare", "Cámara USB"],
  "Juegos y tienda": ["Tarjetas Game-Key", "Lista de deseos de la eShop", "DekuDeals"],
  "Secretos de la comunidad": ["GameCube", "Wind Waker", "Un piano escondido"],
})) {
  for (const topic of topics) assert.ok(groups.get(group)?.includes(topic), `«${topic}» debe estar en «${group}»`);
}
console.log("[OK] Cada truco está en el grupo donde se buscaría");

// Claims that Nintendo's pages did not confirm for the Switch 2 stay out (see docs/TIPS_SOURCES.md).
for (const unverified of ["Entra más rápido", "selección de usuario", "cargar el móvil", "Telegram", "carga más rápido"]) {
  assert.equal(html.includes(unverified), false, `Truco sin confirmar: ${unverified}`);
}
console.log("[OK] Ningún truco depende de datos que Nintendo no confirmó");

console.log("\n[OK] QA de Trucos y secretos completo");

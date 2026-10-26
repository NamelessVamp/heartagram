import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildReport } from "../scripts/catalog_refresh_report.mjs";

const oldPayload = JSON.parse(readFileSync("tests/fixtures/nintendo_catalog_sample.json", "utf8"));
const NOW = Date.parse("2026-10-26T12:00:00Z");
const games = [{ id: "con-portada-vieja", cover_url: "https://example.com/ya-no-existe.png" }];

// A realistic refresh: one product removed, one added, one repriced.
const removed = oldPayload.products[5];
const repriced = oldPayload.products[7];
const newPayload = {
  ...oldPayload,
  generated_at: "2026-11-02T14:00:00+00:00",
  products: [
    ...oldPayload.products.filter((product) => product !== removed).map((product) =>
      (product === repriced ? { ...product, regular_price: Number(product.regular_price) + 100 } : product)),
    { ...oldPayload.products[0], nsuid: "70010000999999", title: "Juego Nuevo de Prueba", sale_price: null, percent_off: 0 },
  ],
};

const report = buildReport(oldPayload, newPayload, { games, now: NOW });
assert.equal(report.dropped, false);
assert.deepEqual(report.counts, { before: 24, after: 24, sales: 3 });
assert.ok(report.markdown.includes("Productos: 24 → 24 (+1 / −1)"), report.markdown);
assert.ok(report.markdown.includes("Juego Nuevo de Prueba"), "Falta el producto nuevo");
assert.ok(report.markdown.includes(removed.title), "Falta el producto que salió");
assert.ok(report.markdown.includes(`${repriced.title}: $${repriced.regular_price} → $${Number(repriced.regular_price) + 100}`), "Falta el cambio de precio");
assert.ok(report.markdown.includes("### Ofertas vigentes (3)"));
assert.ok(report.markdown.includes("−40 %") && report.markdown.includes("hasta el 29 de octubre"));
assert.ok(report.markdown.includes("con-portada-vieja"), "Falta la portada curada que ya no está");
assert.ok(report.markdown.includes("2 de noviembre de 2026"), "Falta la fecha de los precios");
assert.equal(report.changed, true);
console.log("[OK] El resumen lista productos nuevos, retirados, cambios de precio, ofertas vigentes y portadas perdidas");

// Only download timestamps moved: nothing real changed, so no pull request should be opened.
const onlyTimestamps = {
  ...oldPayload,
  generated_at: "2026-11-02T14:00:00+00:00",
  products: oldPayload.products.map((product) => ({ ...product, fetched_at: "2026-11-02T14:00:00+00:00" })),
};
assert.equal(buildReport(oldPayload, onlyTimestamps, { now: NOW }).changed, false);
assert.equal(buildReport(oldPayload, { ...onlyTimestamps, products: onlyTimestamps.products.slice(1) }, { now: NOW }).changed, true);
console.log("[OK] Solo cambiar la hora de descarga no cuenta como actualización");

// A broken refresh (the store page changed and most games vanished) must be refused.
const broken = { ...oldPayload, products: oldPayload.products.slice(0, 5) };
const refused = buildReport(oldPayload, broken, { games, now: NOW });
assert.equal(refused.dropped, true);
assert.ok(refused.markdown.includes("Atención"));
assert.equal(buildReport(oldPayload, { ...oldPayload, products: [] }, { now: NOW }).dropped, true);
assert.equal(buildReport({ products: [] }, oldPayload, { now: NOW }).dropped, false, "Sin catálogo previo no hay caída");
console.log("[OK] Un catálogo que se encoge más de 20 % se rechaza");

console.log("\n[OK] QA del resumen de actualización completo");

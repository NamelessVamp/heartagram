import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { adaptNintendoCatalog, adaptNintendoProduct, displayTitle } from "../js/nintendo-catalog.js";
import { countOnSale, queryCatalog } from "../js/catalog.js";
const payload = JSON.parse(await readFile(new URL("../data/nintendo_catalog.json", import.meta.url), "utf-8"));
const catalog = adaptNintendoCatalog(payload);
assert.equal(catalog.games.length, 318);
assert.ok(catalog.games.every((game) => game.catalog_id.startsWith("nintendo:MX:")));
assert.ok(catalog.games.every((game) => game.cover && game.release_date));
console.log("[OK] Nintendo preview adapter maps 318 official products");
const enriched = catalog.games.find((game) => game.nsuid === "70010000078415");
assert.ok(enriched, "Ace Attorney sample must exist");
assert.ok(enriched.publishers.length > 0);
assert.ok(enriched.developers.length > 0);
assert.ok(enriched.genres.length > 0);
assert.ok(enriched.screenshots.length > 0);
assert.ok(enriched.content_rating?.label);
assert.equal(typeof enriched.regular_price, "number");
console.log("[OK] Nintendo enriched metadata maps to the modal contract");

assert.equal(displayTitle("Pokémon™ Scarlet"), "Pokémon Scarlet");
assert.equal(displayTitle("Rocket League®"), "Rocket League");
assert.equal(displayTitle("Edición Estándar WWE 2K25"), "WWE 2K25");
assert.equal(displayTitle("Animal Crossing™: New Horizons – Nintendo Switch™ 2 Edition"), "Animal Crossing: New Horizons – Nintendo Switch 2 Edition");
assert.equal(displayTitle("Edición dorada de Star Wars Outlaws"), "Edición dorada de Star Wars Outlaws");
assert.equal(displayTitle(null), "");
const dirty = catalog.games.filter((game) => /[™®©]/.test(game.name) || /^Edici[oó]n Est[aá]ndar/i.test(game.name));
assert.deepEqual(dirty.map((game) => game.name), [], "Títulos con símbolos o prefijo redundante");
console.log("[OK] Los títulos del catálogo salen sin ™ ® © ni prefijos redundantes");

// A sale past its end date is over; the snapshot must not show its price as current.
const among = payload.products.find((product) => product.title === "Among Us");
assert.ok(among?.sale_price && among.sale_end, "Among Us debe traer una oferta en el catálogo");
const during = adaptNintendoCatalog(payload, Date.parse(among.sale_end) - 86_400_000).games.find((game) => game.name === "Among Us");
const after = adaptNintendoCatalog(payload, Date.parse(among.sale_end) + 86_400_000).games.find((game) => game.name === "Among Us");
assert.equal(during.sale_price, among.sale_price);
assert.equal(during.percent_off, 40);
assert.equal(during.price_label, "$58.20");
assert.equal(after.sale_price, null);
assert.equal(after.percent_off, 0);
assert.equal(after.sale_end, null);
assert.equal(after.price_label, "$97.00");
const onSaleNow = adaptNintendoCatalog(payload, Date.parse("2026-10-26T12:00:00Z")).games.filter((game) => game.sale_price !== null);
assert.equal(onSaleNow.length, 3, "El 26 de octubre solo siguen vigentes 3 ofertas");
console.log("[OK] Una oferta vencida deja de mostrarse y la vigente conserva su precio y descuento");

// Filter, count and sort by discount, with the clock fixed so the result does not drift.
const snapshot = adaptNintendoCatalog(payload, Date.parse("2026-10-26T12:00:00Z"));
assert.equal(countOnSale(snapshot), 3);
const sales = queryCatalog(snapshot, { onSale: true, sort: "DISCOUNT" });
assert.equal(sales.total, 3);
assert.ok(sales.games.every((game) => game.sale_price !== null && game.percent_off > 0));
assert.ok(sales.games.every((game, index, list) => index === 0 || list[index - 1].percent_off >= game.percent_off), "Orden por descuento");
assert.equal(queryCatalog(snapshot, {}).total, 318, "Sin filtro se ven todos");
const sample = snapshot.games.find((game) => game.name === "Among Us");
assert.equal(sample.regular_price_label, "$97.00");
assert.equal(snapshot.meta.priced_at, payload.generated_at);
assert.equal(sample.priced_at, payload.generated_at);
console.log("[OK] Explorar puede filtrar y ordenar por oferta, y cada juego conoce la fecha de sus precios");

// Edge cases of a sale the snapshot does not currently contain.
const edge = (patch, now) => adaptNintendoProduct({ ...among, ...patch }, now);
const midSale = Date.parse(among.sale_end) - 5 * 86_400_000;
assert.equal(edge({ regular_price: null }, midSale).sale_price, null, "Sin precio regular no hay descuento");
assert.equal(edge({ regular_price: null }, midSale).regular_price_label, null);
assert.equal(edge({ sale_price: among.regular_price }, midSale).sale_price, null, "Precio igual al regular no es oferta");
assert.equal(edge({ percent_off: 0 }, midSale).percent_off, 40, "El descuento se deduce de los precios si falta");
assert.equal(edge({ sale_end: "2026-10-29" }, Date.parse("2026-10-30T04:00:00Z")).sale_price, among.sale_price, "Una fecha sin hora dura hasta el final del día en México");
assert.equal(edge({ sale_end: "2026-10-29" }, Date.parse("2026-10-30T07:00:00Z")).sale_price, null);
assert.equal(edge({ sale_end: null }, midSale).sale_price, among.sale_price, "Sin fecha de fin la oferta sigue vigente");
console.log("[OK] Casos límite de ofertas: sin precio regular, igual al regular, sin porcentaje y fechas sin hora");

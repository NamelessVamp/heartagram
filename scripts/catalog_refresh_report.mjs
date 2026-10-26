#!/usr/bin/env node
// Summarizes what a catalog refresh changed (for the pull request body) and refuses a
// refresh that looks broken, for example when the store page changed and games vanished.
//
// Usage: node scripts/catalog_refresh_report.mjs old.json new.json [--games data/games.json] [--max-drop 0.2]
// Prints Markdown. Exit code 2 when the new catalog shrank by more than --max-drop.

import { appendFileSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { formatPricedAt, formatSaleEnd } from "../js/catalog-labels.js";
import { adaptNintendoCatalog } from "../js/nintendo-catalog.js";

const LIST_LIMIT = 15;
// Every download stamps products with fetched_at, so it must not count as a change.
const stable = (payload) => JSON.stringify((payload?.products ?? []).map(({ fetched_at: _ignored, ...rest }) => rest));
const byNsuid = (payload) => new Map((payload?.products ?? []).map((product) => [String(product.nsuid), product]));
const list = (items) => items.slice(0, LIST_LIMIT).map((item) => `- ${item}`).join("\n")
  + (items.length > LIST_LIMIT ? `\n- ... y ${items.length - LIST_LIMIT} más` : "");

export function buildReport(oldPayload, newPayload, { games = [], now = Date.now(), maxDrop = 0.2 } = {}) {
  const before = byNsuid(oldPayload);
  const after = byNsuid(newPayload);
  const added = [...after].filter(([id]) => !before.has(id)).map(([, product]) => product.title);
  const removed = [...before].filter(([id]) => !after.has(id)).map(([, product]) => product.title);
  const repriced = [...after]
    .filter(([id, product]) => before.has(id) && Number(before.get(id).regular_price) !== Number(product.regular_price))
    .map(([id, product]) => `${product.title}: $${before.get(id).regular_price} → $${product.regular_price}`);

  const sales = adaptNintendoCatalog(newPayload, now).games
    .filter((game) => game.sale_price !== null)
    .sort((a, b) => b.percent_off - a.percent_off)
    .map((game) => `${game.name}: −${Math.round(game.percent_off)} % (${game.regular_price_label} → ${game.price_label})`
      + (game.sale_end ? `, hasta el ${formatSaleEnd(game.sale_end)}` : ""));

  const covers = new Set([...after.values()].map((product) => product.cover_url).filter(Boolean));
  const staleCovers = games.filter((game) => game.cover_url && !covers.has(game.cover_url)).map((game) => game.id);
  const dropped = before.size > 0 && after.size < before.size * (1 - maxDrop);
  const changed = stable(oldPayload) !== stable(newPayload);

  const sections = [
    "## Actualización del catálogo de Nintendo Store México",
    `Precios tomados el ${formatPricedAt(newPayload?.generated_at) || "(fecha desconocida)"}. `
      + `Productos: ${before.size} → ${after.size} (+${added.length} / −${removed.length}).`,
  ];
  if (dropped) {
    sections.push(`**Atención:** el catálogo bajó más de ${Math.round(maxDrop * 100)} %. Probablemente cambió la página de la tienda; no lo publiques sin revisar.`);
  }
  sections.push(`### Ofertas vigentes (${sales.length})`, sales.length ? list(sales) : "Ninguna.");
  if (added.length) sections.push(`### Productos nuevos (${added.length})`, list(added));
  if (removed.length) sections.push(`### Productos que ya no están (${removed.length})`, list(removed));
  if (repriced.length) sections.push(`### Cambios de precio regular (${repriced.length})`, list(repriced));
  if (staleCovers.length) {
    sections.push(`### Portadas de juegos curados que ya no están en el catálogo (${staleCovers.length})`, staleCovers.join(", "));
  }
  return { markdown: `${sections.join("\n\n")}\n`, dropped, changed, counts: { before: before.size, after: after.size, sales: sales.length } };
}

function main() {
  const args = process.argv.slice(2);
  const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
  const [oldPath, newPath] = args.filter((arg, index) => !arg.startsWith("--") && !args[index - 1]?.startsWith("--"));
  if (!oldPath || !newPath) {
    console.error("Uso: node scripts/catalog_refresh_report.mjs old.json new.json [--games data/games.json] [--max-drop 0.2]");
    process.exit(1);
  }
  const read = (path) => JSON.parse(readFileSync(path, "utf8"));
  const gamesPath = option("--games", null);
  const { markdown, dropped, changed } = buildReport(read(oldPath), read(newPath), {
    games: gamesPath ? read(gamesPath) : [],
    maxDrop: Number(option("--max-drop", 0.2)),
  });
  process.stdout.write(markdown);
  // GitHub Actions: lets later steps skip everything when only timestamps moved.
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
  if (dropped) process.exit(2);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();

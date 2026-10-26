import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const VERSION = "ui20";
const EXPECTED = [
  "css/tokens.css",
  "css/base.css",
  "css/layout.css",
  "css/components.css",
  "css/screens/home.css",
  "css/screens/quiz.css",
  "css/screens/discover.css",
  "css/screens/catalog.css",
  "css/screens/nintendo-product-detail.css",
  "css/screens/collection.css",
  "css/screens/getting-started.css",
  "css/screens/secondary.css",
  "css/screens/profile.css",
  "css/theme-bouquet.css",
  "css/theme-scrapbook.css",
];

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});
const strip = (text) => text.replace(/\/\*[\s\S]*?\*\//g, "");
const html = readFileSync("index.html", "utf8");

const links = [...html.matchAll(/<link rel="stylesheet" href="([^"?]+)\?v=([^"]+)"/g)];
assert.deepEqual(links.map(([, path]) => path), EXPECTED, "Orden de hojas CSS inesperado");
links.forEach(([, path, version]) => {
  assert.equal(existsSync(path), true, `${path} no existe`);
  assert.equal(version, VERSION, `${path} no usa ?v=${VERSION}`);
});
console.log(`[OK] ${links.length} hojas CSS en orden y con ?v=${VERSION}`);

const onDisk = walk("css").filter((path) => path.endsWith(".css")).map((path) => path.replaceAll("\\", "/"));
const orphans = onDisk.filter((path) => !EXPECTED.includes(path));
assert.deepEqual(orphans, [], `Hojas CSS sin cargar: ${orphans.join(", ")}`);
console.log("[OK] Sin hojas CSS huérfanas");

const files = EXPECTED.map((path) => strip(readFileSync(path, "utf8")));
const css = files.join("\n");
assert.match(files[0], /^\s*@layer base, layout, components, screens, theme;/, "tokens.css debe declarar las capas primero");
console.log("[OK] Capas de cascada declaradas en tokens.css");

const defined = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
const used = new Set([...css.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]));
const undefinedVars = [...used].filter((name) => !defined.has(name));
assert.deepEqual(undefinedVars, [], `Variables sin definir: ${undefinedVars.join(", ")}`);
for (const token of ["--text", "--accent-hover"]) {
  assert.ok(defined.has(token), `${token} lo usa el radar de js/ui.js`);
}
console.log("[OK] Variables definidas, incluidas las del radar");

assert.equal((css.match(/!important/g) || []).length, 0, "El sistema v2 no usa !important");
console.log("[OK] 0 !important");

for (const legacy of [".app-navigation", ".assistant-", "has-app-navigation", ".grain"]) {
  assert.equal(css.includes(legacy), false, `Selector heredado: ${legacy}`);
}
assert.equal(/\.visual-(?!icon)/.test(css), false, "Selector heredado: .visual-*");
assert.equal(html.includes("visual-system"), false, "index.html aún carga visual-system");
assert.equal(existsSync("js/visual-system.js"), false, "js/visual-system.js debe eliminarse");
console.log("[OK] Sin capas visuales heredadas");

console.log("\n[OK] QA de higiene CSS completo");

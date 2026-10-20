import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const path = join(dir, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});
const strip = (text) => text.replace(/\/\*[\s\S]*?\*\//g, "");
const cssFiles = walk("css").filter((path) => path.endsWith(".css"));
const css = cssFiles.map((path) => strip(readFileSync(path, "utf8"))).join("\n");
const html = readFileSync("index.html", "utf8");

const links = [...html.matchAll(/href="(css\/[^"?]+)\?v=([^"]+)"/g)];
assert.ok(links.length > 0, "index.html no carga hojas CSS");
links.forEach(([, path, version]) => {
  assert.equal(existsSync(path), true, `${path} no existe`);
  assert.equal(version, "v120", `${path} no usa ?v=v120`);
});
console.log(`[OK] ${links.length} hojas CSS existen y usan ?v=v120`);

const defined = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
const used = new Set([...css.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1]));
const undefinedVars = [...used].filter((name) => !defined.has(name));
assert.deepEqual(undefinedVars, [], `Variables sin definir: ${undefinedVars.join(", ")}`);
console.log("[OK] Todas las variables CSS usadas están definidas");

for (const dead of [".app-navigation", ".assistant-", "has-app-navigation"]) {
  assert.equal(css.includes(dead), false, `CSS muerto detectado: ${dead}`);
}
assert.equal(/(^|\n)\.cart\s*\{/.test(css), false, "CSS muerto detectado: .cart");
assert.equal(readFileSync("js/visual-system.js", "utf8").includes("chat-empty"), false);
console.log("[OK] Sin navegación antigua, asistente, carritos ni chat");

const IMPORTANT_BUDGET = 82;
const important = (css.match(/!important/g) || []).length;
assert.ok(important <= IMPORTANT_BUDGET, `!important subió a ${important} (máximo ${IMPORTANT_BUDGET})`);
console.log(`[OK] !important dentro del presupuesto (${important}/${IMPORTANT_BUDGET})`);

console.log("\n[OK] QA de higiene CSS completo");

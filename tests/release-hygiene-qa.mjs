import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
assert.ok(html.includes('<meta name="theme-color" content="#0a0a18" />'), "theme-color desactualizado");
for (const [tab, target] of [["foryou", "list-for-you list-might-hook"], ["moods", "discover-mood-results"], ["duo", "discover-duo"], ["zone", "list-out-of-zone"]]) {
  assert.ok(html.includes(`data-discover-tab="${tab}" aria-controls="${target}"`), `Pestaña ${tab} sin aria-controls`);
}
assert.equal((html.match(/role="tabpanel" data-discover-panel=/g) ?? []).length, 5, "Paneles sin role=tabpanel");
console.log("[OK] theme-color y pestañas accesibles");

const workflow = readFileSync(".github/workflows/pages.yml", "utf8");
assert.ok(workflow.includes("needs: test") && workflow.includes("npm test"), "El deploy debe depender de npm test");
console.log("[OK] Pages solo publica si npm test pasa");

const roadmap = readFileSync("docs/ROADMAP.md", "utf8");
assert.equal(/NFC/i.test(roadmap), false, "El ROADMAP aún menciona NFC");
assert.ok(roadmap.includes("v1.2.3"), "ROADMAP sin v1.2.3");
console.log("[OK] ROADMAP al día");

console.log("\n[OK] QA de higiene de release completo");

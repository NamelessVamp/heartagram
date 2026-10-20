"""HEARTAGRAM v1.2 · Fase 1 · Limpieza CSS sin cambio visual.

Elimina únicamente código muerto verificado en ui_audit_v12.txt:
- Navegación flotante antigua (.app-navigation), reemplazada por el app shell.
- Estilos del asistente local (.assistant-*), eliminado en v1.1.1.
- Carritos heredados (.cart*), sin markup en index.html.
- decorateChatEmpty() en visual-system.js (#chat-empty ya no existe).
- Tokens definidos y nunca usados.
Además sube el cache-busting de CSS a v120 y agrega un QA de higiene CSS.
Nada se escribe hasta que todas las validaciones pasan.
"""
from pathlib import Path
from datetime import datetime, timezone
import json, re, shutil

ROOT = Path(__file__).resolve().parent
STAMP = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
BACKUP = ROOT / "data" / "ui_phase1_backups" / f"phase1-{STAMP}"
FILES = ["index.html", "css/base.css", "css/theme.css", "css/theme-romance.css",
         "css/shell.css", "css/visual-system.css", "css/screens/quiz.css",
         "js/visual-system.js", "package.json", ".gitignore"]

def stop(msg): raise SystemExit(f"[FAIL] {msg}")

def read(rel):
    p = ROOT / rel
    if not p.is_file(): stop(f"No se encontró {rel}")
    return p.read_text(encoding="utf-8-sig").replace("\r\n", "\n")

def remove_once(text, pattern, label, flags=re.M):
    new, n = re.subn(pattern, "", text, flags=flags)
    if n != 1: stop(f"{label}: se esperaba 1 coincidencia y hubo {n}")
    return new

# ---------- theme-romance.css: quitar secciones muertas completas ----------
DEAD_ROMANCE_SECTIONS = [
    "Persistent navigation",
    "Compact mobile navigation labels",
    "Final navigation clearance",
    "Desktop navigation surface",
    "Local AI assistant",
]

def drop_sections(text, names):
    header = re.compile(r"^/\* ---------- (.+?) ---------- \*/\s*$", re.M)
    marks = list(header.finditer(text))
    found = [m.group(1) for m in marks]
    for name in names:
        if found.count(name) != 1: stop(f"theme-romance.css: sección '{name}' aparece {found.count(name)} veces")
    out, cursor = [], 0
    for i, m in enumerate(marks):
        end = marks[i + 1].start() if i + 1 < len(marks) else len(text)
        if m.group(1) in names:
            out.append(text[cursor:m.start()])
            cursor = end
    out.append(text[cursor:])
    return "".join(out)

def plan():
    c = {rel: read(rel) for rel in FILES}

    r = drop_sections(c["css/theme-romance.css"], DEAD_ROMANCE_SECTIONS)
    # La sección Motion sigue viva; solo se retira el selector antiguo de sus listas.
    for selector in (".app-navigation-button", ".app-navigation-button:active:not(:disabled)"):
        r, n = re.subn(r",\n[ \t]*" + re.escape(selector) + r" \{", " {", r)
        if n != 1: stop(f"theme-romance.css Motion: {selector} aparece {n} veces")
    c["css/theme-romance.css"] = r

    # theme.css: carritos heredados (de ".cart {" hasta el banner RESPONSIVE)
    t = c["css/theme.css"]
    start = t.find("\n.cart {\n")
    banner = t.find("/* =============================================================\n   RESPONSIVE")
    if start < 0 or banner < 0 or banner < start: stop("theme.css: no se ubicó el bloque .cart")
    block = t[start:banner]
    if not all(s in block for s in (".cart-name", ".cart-items li", ".cart-total")):
        stop("theme.css: el bloque .cart no tiene la forma esperada")
    c["css/theme.css"] = t[:start] + "\n\n" + t[banner:]

    c["css/shell.css"] = remove_once(
        c["css/shell.css"], r"^body\.has-app-shell \.app-navigation \{\n  display: none !important;\n\}\n\n?",
        "shell.css .app-navigation")

    for token in ("--space-1", "--color-danger", "--radius-pill"):
        c["css/base.css"] = remove_once(c["css/base.css"], rf"^[ \t]*{re.escape(token)}:[^;\n]*;[^\n]*\n", f"base.css {token}")
    c["css/visual-system.css"] = remove_once(c["css/visual-system.css"], r"^[ \t]*--visual-panel:[^\n]*\n", "visual-system.css --visual-panel")
    c["css/screens/quiz.css"] = remove_once(c["css/screens/quiz.css"], r"^[ \t]*--signal-progress:[^\n]*\n", "quiz.css --signal-progress")

    js = c["js/visual-system.js"]
    js = remove_once(js, r"^function decorateChatEmpty\(\) \{\n.*?\n\}\n\n?", "visual-system.js decorateChatEmpty", re.M | re.S)
    js = remove_once(js, r"^[ \t]*decorateChatEmpty\(\);\n", "visual-system.js llamada decorateChatEmpty")
    c["js/visual-system.js"] = js

    h = c["index.html"]
    n_css = len(re.findall(r'href="css/[^"]+\?v=v110"', h))
    if n_css != 16: stop(f"index.html: se esperaban 16 hojas CSS con ?v=v110 y hay {n_css}")
    h = re.sub(r'(href="css/[^"]+)\?v=v110"', r'\1?v=v120"', h)
    if h.count('src="js/visual-system.js"') != 1: stop("index.html: referencia a visual-system.js no encontrada")
    c["index.html"] = h.replace('src="js/visual-system.js"', 'src="js/visual-system.js?v=v120"')

    pkg = json.loads(c["package.json"])
    cmd = "node tests/css-hygiene-qa.mjs"
    if cmd not in pkg["scripts"]["test"]: pkg["scripts"]["test"] += " && " + cmd
    c["package.json"] = json.dumps(pkg, ensure_ascii=False, indent=2) + "\n"

    gi = c[".gitignore"]
    if "data/ui_phase1_backups/" not in gi: gi = gi.rstrip("\n") + "\ndata/ui_phase1_backups/\n"
    c[".gitignore"] = gi

    # Validación final antes de escribir
    css_all = "\n".join(v for k, v in c.items() if k.endswith(".css"))
    for dead in (".app-navigation", ".assistant-", "\n.cart {", "has-app-navigation"):
        if dead in css_all: stop(f"Quedó código muerto: {dead}")
    if "chat-empty" in c["js/visual-system.js"]: stop("Quedó referencia a chat-empty")
    return c

QA = r'''import assert from "node:assert/strict";
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
'''

def main():
    new = plan()
    BACKUP.mkdir(parents=True, exist_ok=True)
    for rel in FILES:
        target = BACKUP / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(ROOT / rel, target)
    for rel, text in new.items():
        (ROOT / rel).write_text(text, encoding="utf-8", newline="\n")
    (ROOT / "tests" / "css-hygiene-qa.mjs").write_text(QA, encoding="utf-8", newline="\n")
    print("[OK] Navegación antigua, asistente y carritos eliminados del CSS")
    print("[OK] decorateChatEmpty eliminado de visual-system.js")
    print("[OK] 5 tokens sin uso eliminados")
    print("[OK] Cache-busting CSS y visual-system.js -> v120")
    print("[OK] tests/css-hygiene-qa.mjs agregado a npm test")
    print(f"[SAFE] Backup: {BACKUP.relative_to(ROOT)}")

if __name__ == "__main__":
    main()

"""Read-only UI/UX audit bundle for HEARTAGRAM. Modifies nothing."""
from pathlib import Path
from collections import Counter, defaultdict
import re

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "ui_audit_v12.txt"

html_path = ROOT / "index.html"
html = html_path.read_text(encoding="utf-8-sig")
css_files = sorted((ROOT / "css").rglob("*.css"))
js_files = sorted((ROOT / "js").glob("*.js"))

def rel(p): return p.relative_to(ROOT).as_posix()
def strip_comments(t): return re.sub(r"/\*.*?\*/", "", t, flags=re.S)

lines = ["HEARTAGRAM UI/UX AUDIT BUNDLE v1.2", "=" * 72, ""]

# --- CSS load order
lines.append("## CSS LOAD ORDER (index.html)")
for i, href in enumerate(re.findall(r'<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"', html), 1):
    lines.append(f"{i:02d}. {href}")
lines.append("")

# --- CSS metrics
defined, used = Counter(), Counter()
hexes, zidx, fonts, important = Counter(), Counter(), Counter(), Counter()
media = defaultdict(set)
selector_files = defaultdict(set)
lines.append("## CSS FILE METRICS")
lines.append("file | lines | bytes | !important | @media")
for f in css_files:
    raw = f.read_text(encoding="utf-8-sig")
    t = strip_comments(raw)
    name = rel(f)
    imp = t.count("!important")
    important[name] = imp
    mq = re.findall(r"@media\s*([^{]+)\{", t)
    for m in mq: media[" ".join(m.split())].add(name)
    for v in re.findall(r"(--[\w-]+)\s*:", t): defined[v] += 1
    for v in re.findall(r"var\(\s*(--[\w-]+)", t): used[v] += 1
    for h in re.findall(r"#[0-9a-fA-F]{3,8}\b", t): hexes[h.lower()] += 1
    for z in re.findall(r"z-index\s*:\s*(-?\d+)", t): zidx[z] += 1
    for ff in re.findall(r"font-family\s*:\s*([^;}]+)", t): fonts[" ".join(ff.split())] += 1
    flat = re.sub(r"@media[^{]+\{", "", t)
    for sel in re.findall(r"([^{}@;]+)\{", flat):
        for s in sel.split(","):
            s = " ".join(s.split())
            if s and not s.startswith(("from", "to")) and not re.fullmatch(r"\d+%", s):
                selector_files[s].add(name)
    lines.append(f"{name} | {raw.count(chr(10))+1} | {len(raw.encode())} | {imp} | {len(mq)}")
lines.append("")

lines.append("## UNDEFINED CUSTOM PROPERTIES (used, never defined)")
lines += [f"- {v} ({used[v]}x)" for v in sorted(set(used) - set(defined))] or ["- none"]
lines.append("")
lines.append("## UNUSED CUSTOM PROPERTIES (defined, never used)")
lines += [f"- {v}" for v in sorted(set(defined) - set(used))] or ["- none"]
lines.append("")
lines.append("## CUSTOM PROPERTIES DEFINED MORE THAN ONCE")
lines += [f"- {v} ({n}x)" for v, n in sorted(defined.items()) if n > 1] or ["- none"]
lines.append("")
lines.append(f"## HARDCODED HEX COLORS ({len(hexes)} unique)")
lines += [f"- {h}: {n}x" for h, n in hexes.most_common()]
lines.append("")
lines.append("## Z-INDEX VALUES")
lines += [f"- {z}: {n}x" for z, n in sorted(zidx.items(), key=lambda x: int(x[0]))] or ["- none"]
lines.append("")
lines.append("## FONT-FAMILY DECLARATIONS")
lines += [f"- {f}: {n}x" for f, n in fonts.most_common()]
lines.append("")
lines.append("## MEDIA QUERIES (query -> files)")
lines += [f"- {q} -> {', '.join(sorted(fs))}" for q, fs in sorted(media.items())]
lines.append("")
lines.append("## SELECTORS DECLARED IN MORE THAN ONE FILE")
dups = sorted((s, fs) for s, fs in selector_files.items() if len(fs) > 1)
lines += [f"- {s} -> {', '.join(sorted(fs))}" for s, fs in dups] or ["- none"]
lines.append("")

# --- HTML checks
ids = re.findall(r'\sid="([^"]+)"', html)
lines.append("## HTML CHECKS")
lines.append("Duplicate ids: " + (", ".join(sorted(i for i, n in Counter(ids).items() if n > 1)) or "none"))
lines.append(f"<button> without type: {len(re.findall(r'<button(?![^>]*type=)', html))}")
lines.append(f"<img> without alt: {len(re.findall(r'<img(?![^>]*alt=)', html))}")
lines.append("Headings: " + " | ".join(f"h{l}:{' '.join(re.sub(r'<[^>]+>', '', t).split())[:40]}"
                                     for l, t in re.findall(r"<h([1-6])[^>]*>(.*?)</h\1>", html, flags=re.S)))
lines.append("")

# --- JS -> HTML id contract
lines.append("## JS ID REFERENCES MISSING FROM index.html (may be created dynamically)")
html_ids = set(ids)
missing = []
for f in js_files:
    t = f.read_text(encoding="utf-8-sig")
    for i in set(re.findall(r'getElementById\(\s*["\']([^"\']+)["\']', t)):
        if i not in html_ids: missing.append(f"- {i} ({rel(f)})")
lines += sorted(missing) or ["- none"]
lines.append("")

# --- Full sources
lines.append("=" * 72)
lines.append("## FULL SOURCES")
for f in [html_path, *css_files, *js_files]:
    lines.append(f"\n{'=' * 72}\nFILE: {rel(f)}\n{'=' * 72}")
    lines.append(f.read_text(encoding="utf-8-sig"))

OUT.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
print(f"[OK] Audit: {OUT.name}")
print(f"[OK] CSS files: {len(css_files)} | JS files: {len(js_files)}")
print(f"[OK] Unique hex colors: {len(hexes)} | !important: {sum(important.values())}")
print(f"[OK] Selectors in multiple files: {len(dups)}")
print("[SAFE] Read-only. No data/*.json payloads included.")

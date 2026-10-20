#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CATALOG = ROOT / "js/catalog.js"
MAIN = ROOT / "js/main.js"
HTML = ROOT / "index.html"
PACKAGE = ROOT / "package.json"
TEST = ROOT / "tests/catalog-source-qa.mjs"
MARKER = "HEARTAGRAM_CATALOG_SOURCE_V110"

OLD_BLOCK = '''const SEARCH_PARAMS =
  typeof window !== "undefined"
    ? new URLSearchParams(window.location.search)
    : new URLSearchParams();

const USE_NINTENDO = SEARCH_PARAMS.get("catalog") === "nintendo";'''

NEW_BLOCK = '''// HEARTAGRAM_CATALOG_SOURCE_V110
export function catalogModeFromSearch(search = "") {
  const requested = new URLSearchParams(search).get("catalog");
  return requested === "igdb" ? "igdb" : "nintendo";
}

const CATALOG_MODE =
  typeof window === "undefined"
    ? "igdb"
    : catalogModeFromSearch(window.location.search);

const USE_NINTENDO = CATALOG_MODE === "nintendo";'''

TEST_CONTENT = '''import assert from "node:assert/strict";
import { catalogModeFromSearch } from "../js/catalog.js";

assert.equal(catalogModeFromSearch(""), "nintendo");
assert.equal(catalogModeFromSearch("?catalog=nintendo"), "nintendo");
assert.equal(catalogModeFromSearch("?catalog=igdb"), "igdb");
assert.equal(catalogModeFromSearch("?catalog=unexpected"), "nintendo");
assert.equal(catalogModeFromSearch("?preview=1"), "nintendo");

console.log("[OK] Nintendo is the default browser catalog and IGDB remains an explicit rollback");
'''


def read(path: Path) -> str:
    if not path.exists():
        raise SystemExit(f"[FAIL] Missing {path.relative_to(ROOT)}")
    return path.read_text(encoding="utf-8-sig")


def write(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text.rstrip() + "\n", encoding="utf-8", newline="\n")


def bump(text: str) -> str:
    text = re.sub(
        r'((?:src|href)=["\'][^"\']+\.(?:js|css))\?v=[A-Za-z0-9._-]+',
        r'\1?v=v110',
        text,
    )
    return re.sub(
        r'(from\s+["\'][^"\']+\.js)\?v=[A-Za-z0-9._-]+',
        r'\1?v=v110',
        text,
    )


def main() -> None:
    catalog = read(CATALOG)
    main_js = read(MAIN)
    html = read(HTML)
    package = json.loads(read(PACKAGE))

    if MARKER not in catalog:
        if OLD_BLOCK not in catalog:
            raise SystemExit("[FAIL] Exact SEARCH_PARAMS selector not found. No files changed.")
        catalog = catalog.replace(OLD_BLOCK, NEW_BLOCK, 1)

    command = package.get("scripts", {}).get("test", "")
    source_test = "node tests/catalog-source-qa.mjs"
    if source_test not in command:
        package.setdefault("scripts", {})["test"] = command + " && " + source_test

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup = ROOT / "data/nintendo_catalog_backups" / f"nintendo-primary-{stamp}"
    for source in (CATALOG, MAIN, HTML, PACKAGE, TEST):
        if source.exists():
            target = backup / source.relative_to(ROOT)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)

    write(CATALOG, bump(catalog))
    write(MAIN, bump(main_js))
    write(HTML, bump(html))
    write(PACKAGE, json.dumps(package, ensure_ascii=False, indent=2))
    write(TEST, TEST_CONTENT)

    print("[OK] Nintendo Store Mexico is now the default browser catalog")
    print("[OK] ?catalog=igdb remains the explicit rollback")
    print("[OK] Node keeps IGDB as the legacy test runtime")
    print("[OK] tests/catalog-source-qa.mjs created and added to npm test")
    print(f"[SAFE] Backup: {backup.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

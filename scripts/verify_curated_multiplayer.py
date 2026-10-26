#!/usr/bin/env python3
"""Verify unresolved curated multiplayer fields against Nintendo Store MX pages.

Reads data/games.json, finds curated games whose multiplayer fields are still
"VERIFICAR", downloads their official product pages and reads the
ways-to-play labels. Without --apply it only writes a report; with --apply it
also updates data/games.json after saving a backup.

Needs internet access to www.nintendo.com. Run from the repository root:
    python scripts/verify_curated_multiplayer.py           # report only
    python scripts/verify_curated_multiplayer.py --apply   # report + update
    python scripts/verify_curated_multiplayer.py --url dont-starve-together=<url_key or URL>
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
GAMES = ROOT / "data" / "games.json"
PROBE = ROOT / "data" / "nintendo_probe"
REPORT = PROBE / "curated_multiplayer_check.json"
PAGES_DIR = PROBE / "curated_pages"
BACKUPS = ROOT / "data" / "games_backups"
PRODUCT_URL = "https://www.nintendo.com/es-mx/store/products/{}/"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36"
PAUSE_SECONDS = 0.5

# Product pages to try per curated game, in order. url_key values come from
# data/nintendo_catalog*.json; Don't Starve Together is not in that snapshot,
# so its slugs are guesses and can be replaced with --url.
CANDIDATES: dict[str, list[str]] = {
    "animal-crossing-nh": [
        "animal-crossing-new-horizons-switch",
        "animal-crossing-new-horizons-nintendo-switch-2-edition-switch-2",
    ],
    "stardew-valley": [
        "stardew-valley-switch",
        "stardew-valley-nintendo-switch-2-edition-switch-2",
    ],
    "it-takes-two": ["it-takes-two-70010000049281-switch"],
    "monster-hunter-rise": ["monster-hunter-rise-switch"],
    "dont-starve-together": [
        "dont-starve-together-console-edition-switch",
        "dont-starve-together-switch",
    ],
}

WAYS_KEYS = ("waysToPlayLabels", "waysToPlay")
ID_KEYS = ("urlKey", "nsuid")
ONLINE_LABELS = ("Cooperativo en línea", "Compite en línea", "Juega en línea con amigos")


def fetch(url: str) -> str:
    request = Request(url, headers={"User-Agent": UA, "Accept-Language": "es-MX,es;q=0.9"})
    with urlopen(request, timeout=25) as response:
        body = response.read().decode("utf-8", "replace")
    time.sleep(PAUSE_SECONDS)
    return body


def json_payloads(html: str) -> list[Any]:
    payloads: list[Any] = []
    pattern = re.compile(r'<script[^>]+(?:id=["\']__NEXT_DATA__["\']|type=["\']application/json["\'])[^>]*>(.*?)</script>', re.I | re.S)
    for match in pattern.finditer(html):
        try:
            payloads.append(json.loads(match.group(1)))
        except json.JSONDecodeError:
            continue
    return payloads


def labels(values: Any) -> list[str]:
    if not isinstance(values, list):
        return []
    result = []
    for value in values:
        if isinstance(value, str) and value.strip():
            result.append(value.strip())
        elif isinstance(value, dict):
            label = value.get("label") or value.get("name")
            if isinstance(label, str) and label.strip():
                result.append(label.strip())
    return list(dict.fromkeys(result))


def ways_entries(node: Any, found: list[dict[str, Any]]) -> None:
    """Collects every ways-to-play list together with the ids in the same object."""
    if isinstance(node, dict):
        tags = node.get("tags") if isinstance(node.get("tags"), dict) else {}
        for source in (node, tags):
            for key in WAYS_KEYS:
                values = labels(source.get(key))
                if values:
                    ids = {k: str(node[k]) for k in ID_KEYS if node.get(k)}
                    found.append({"ways": values, "ids": ids})
        for value in node.values():
            ways_entries(value, found)
    elif isinstance(node, list):
        for value in node:
            ways_entries(value, found)


def matching_keys(node: Any, path: str, out: set[str]) -> None:
    """Lists key paths that look related, so a failed parse can be adapted."""
    if isinstance(node, dict):
        for key, value in node.items():
            here = f"{path}.{key}"
            if re.search(r"way|share|nso|player|multi", key, re.I):
                out.add(re.sub(r"\.\d+", "[]", here))
            matching_keys(value, here, out)
    elif isinstance(node, list):
        for index, value in enumerate(node[:50]):
            matching_keys(value, f"{path}.{index}", out)


def read_page(game_id: str, url_key: str) -> dict[str, Any]:
    url = url_key if url_key.startswith("http") else PRODUCT_URL.format(url_key)
    result: dict[str, Any] = {"url": url}
    try:
        html = fetch(url)
    except HTTPError as exc:
        result["error"] = f"HTTP {exc.code}"
        return result
    except (URLError, TimeoutError) as exc:
        result["error"] = f"Sin conexión: {exc}"
        return result

    PAGES_DIR.mkdir(parents=True, exist_ok=True)
    (PAGES_DIR / f"{game_id}.html").write_text(html, encoding="utf-8")

    entries: list[dict[str, Any]] = []
    keys: set[str] = set()
    for payload in json_payloads(html):
        ways_entries(payload, entries)
        matching_keys(payload, "$", keys)
    result["entries"] = entries
    result["related_keys"] = sorted(keys)[:80]

    slug = url.rstrip("/").rsplit("/", 1)[-1]
    own = [e for e in entries if e["ids"].get("urlKey") == slug]
    if not own:
        distinct = {tuple(e["ways"]) for e in entries if not e["ids"]}
        own = [{"ways": list(next(iter(distinct)))}] if len(distinct) == 1 else []
    if own:
        result["ways_to_play"] = own[0]["ways"]
    return result


def decide(game: dict[str, Any], ways: list[str]) -> dict[str, bool]:
    multiplayer = game["multiplayer"]
    decided: dict[str, bool] = {}
    if multiplayer.get("gameshare") == "VERIFICAR":
        decided["gameshare"] = any(label.startswith("GameShare") for label in ways)
    if multiplayer.get("requires_nso") == "VERIFICAR":
        online = any(label in ONLINE_LABELS for label in ways)
        decided["requires_nso"] = online and game.get("free_to_play") is not True
    return decided


def parse_overrides(values: list[str]) -> dict[str, str]:
    overrides: dict[str, str] = {}
    for value in values:
        game_id, sep, target = value.partition("=")
        if not sep or not target.strip():
            raise SystemExit(f"[FAIL] --url debe ser id=url_key, no '{value}'")
        overrides[game_id.strip()] = target.strip()
    return overrides


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--apply", action="store_true", help="update data/games.json with the verified values")
    parser.add_argument("--url", action="append", default=[], help="id=url_key or full product URL")
    args = parser.parse_args()
    overrides = parse_overrides(args.url)

    games = json.loads(GAMES.read_text(encoding="utf-8"))
    pending = [g for g in games if any(v == "VERIFICAR" for v in g["multiplayer"].values())]
    if not pending:
        print("[OK] No hay campos de multijugador pendientes.")
        return 0

    report: dict[str, Any] = {"generated_at": datetime.now(timezone.utc).isoformat(), "games": {}}
    updates: dict[str, dict[str, bool]] = {}
    for game in pending:
        game_id = game["id"]
        candidates = [overrides[game_id]] if game_id in overrides else CANDIDATES.get(game_id, [])
        pages = [read_page(game_id, key) for key in candidates]
        report["games"][game_id] = {"title": game["title"], "pages": pages}

        # Every candidate page must agree; editions may differ (Switch vs Switch 2).
        found = [p["ways_to_play"] for p in pages if "ways_to_play" in p]
        decisions = [decide(game, ways) for ways in found]
        if not candidates:
            print(f"[WARN] {game_id}: sin URL candidata; usa --url {game_id}=<url_key>")
        elif not decisions:
            reasons = "; ".join(p.get("error", "sin formas de juego en la página") for p in pages)
            print(f"[WARN] {game_id}: no se pudo leer ({reasons})")
        elif any(d != decisions[0] for d in decisions):
            print(f"[WARN] {game_id}: las ediciones no coinciden {decisions}; revisar a mano")
        else:
            updates[game_id] = decisions[0]
            print(f"[OK] {game_id}: {decisions[0]} desde {found[0]}")
        report["games"][game_id]["decision"] = updates.get(game_id)

    PROBE.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"\n[OK] Reporte: {REPORT.relative_to(ROOT)}")

    if args.apply and updates:
        BACKUPS.mkdir(parents=True, exist_ok=True)
        stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        shutil.copy2(GAMES, BACKUPS / f"games-{stamp}.json")
        for game in games:
            game["multiplayer"].update(updates.get(game["id"], {}))
        GAMES.write_text(json.dumps(games, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"[OK] data/games.json actualizado ({len(updates)} juegos). Backup en {BACKUPS.relative_to(ROOT)}")
        print("[NEXT] python scripts/validate_catalog.py --strict && npm test")
    elif updates:
        print("[NEXT] Revisa el reporte y vuelve a correr con --apply.")

    unresolved = len(pending) - len(updates)
    if unresolved:
        print(f"[FAIL] {unresolved} juegos sin resolver. Manda {REPORT.relative_to(ROOT)} y {PAGES_DIR.relative_to(ROOT)}/")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

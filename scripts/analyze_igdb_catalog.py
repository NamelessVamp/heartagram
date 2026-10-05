"""Analyze the local IGDB master catalog before publishing it.

Reads data/catalog_igdb.full.json and reports likely DLC, bundles, seasons,
cosmetics, editions, and records that lack enough metadata for discovery.
It never modifies the catalog.
"""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "catalog_igdb.full.json"

SUSPICIOUS_PATTERNS: dict[str, re.Pattern[str]] = {
    "dlc_expansion": re.compile(
        r"\b(dlc|expansion|chapter|episode pack|season pass|story pack|character pack)\b",
        re.IGNORECASE,
    ),
    "season_content": re.compile(
        r"\bseason\s+\d+\b|\bseason\s+pass\b",
        re.IGNORECASE,
    ),
    "cosmetic_content": re.compile(
        r"\b(outfit|costume|skin|care set|starter pack|item pack|weapon pack)\b",
        re.IGNORECASE,
    ),
    "edition_bundle": re.compile(
        r"\b(bundle|edition|collection|pack)\b",
        re.IGNORECASE,
    ),
    "demo_prologue": re.compile(
        r"\b(demo|prologue|trial)\b",
        re.IGNORECASE,
    ),
}


def load_games() -> list[dict[str, Any]]:
    if not SOURCE.exists():
        raise FileNotFoundError("No existe data/catalog_igdb.full.json")

    payload = json.loads(SOURCE.read_text(encoding="utf-8"))
    games = payload.get("games") if isinstance(payload, dict) else None

    if not isinstance(games, list):
        raise TypeError("El catálogo maestro no contiene una lista games")

    return [game for game in games if isinstance(game, dict)]


def main() -> int:
    try:
        games = load_games()
    except (FileNotFoundError, TypeError, json.JSONDecodeError) as error:
        print(f"[FAIL] {error}")
        return 1

    category_counts = Counter(str(game.get("category")) for game in games)
    status_counts = Counter(str(game.get("status")) for game in games)
    platform_counts = Counter(
        platform.get("name", "Sin plataforma")
        for game in games
        for platform in game.get("platforms", [])
        if isinstance(platform, dict)
    )

    suspicious: dict[str, list[str]] = {key: [] for key in SUSPICIOUS_PATTERNS}

    for game in games:
        name = str(game.get("name") or "")
        for label, pattern in SUSPICIOUS_PATTERNS.items():
            if pattern.search(name):
                suspicious[label].append(name)

    missing_summary = sum(not game.get("summary") for game in games)
    missing_modes = sum(not game.get("game_modes") for game in games)
    missing_genres = sum(not game.get("genres") for game in games)
    unrated = sum(not game.get("rating_count") for game in games)

    print(f"[INIT] Registros analizados: {len(games)}")
    print(f"[CHECK] Plataformas: {dict(platform_counts)}")
    print(f"[CHECK] Categorías: {dict(category_counts)}")
    print(f"[CHECK] Estados: {dict(status_counts)}")
    print(f"[CHECK] Sin summary: {missing_summary}")
    print(f"[CHECK] Sin game_modes: {missing_modes}")
    print(f"[CHECK] Sin genres: {missing_genres}")
    print(f"[CHECK] Sin rating_count: {unrated}")

    for label, names in suspicious.items():
        print(f"[CHECK] {label}: {len(names)}")
        for name in names[:12]:
            print(f"  - {name}")
        if len(names) > 12:
            print(f"  ... y {len(names) - 12} más")

    return 0


if __name__ == "__main__":
    sys.exit(main())

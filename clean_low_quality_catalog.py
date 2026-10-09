"""Filtra registros de baja calidad del catálogo público de HEARTAGRAM.

No intenta detectar IA. Evalúa únicamente calidad/completitud del registro.
No toca el catálogo maestro ni los shards de detalle.

Uso:
    python clean_low_quality_catalog.py --dry-run
    python clean_low_quality_catalog.py
"""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
INDEX = DATA / "catalog_igdb.json"
BACKUP = DATA / "catalog_igdb.before_quality_filter.json"
EXCLUSIONS = DATA / "catalog_quality_exclusions.json"

GENERIC_WORDS = {
    "cat", "dog", "milk", "game", "games", "simulator", "puzzle",
    "runner", "racing", "adventure", "quest", "world", "hero"
}


def as_text(value: Any) -> str:
    return value.strip() if isinstance(value, str) else ""


def as_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def as_number(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def record_id(game: dict[str, Any]) -> str:
    value = game.get("igdb_id") or game.get("id") or ""
    result = str(value).strip()
    if result.startswith("igdb:"):
        result = result.split(":", 1)[1]
    return result


def title_of(game: dict[str, Any]) -> str:
    return as_text(game.get("name")) or as_text(game.get("title")) or "Sin título"


def has_company(game: dict[str, Any]) -> bool:
    return bool(as_list(game.get("involved_companies")) or as_list(game.get("companies")))


def media_count(game: dict[str, Any]) -> int:
    return sum(len(as_list(game.get(field))) for field in ("screenshots", "artworks", "videos"))


def engagement(game: dict[str, Any]) -> float:
    return max(
        as_number(game.get("total_rating_count")),
        as_number(game.get("rating_count")),
        as_number(game.get("aggregated_rating_count")),
        as_number(game.get("follows")),
        as_number(game.get("hypes")),
    )


def evaluate(game: dict[str, Any]) -> dict[str, Any]:
    title = title_of(game)
    words = [part.lower() for part in title.replace(".", " ").replace("-", " ").split() if part]
    description = max(len(as_text(game.get("summary"))), len(as_text(game.get("storyline"))))
    cover = bool(game.get("cover"))
    company = has_company(game)
    media = media_count(game)
    activity = engagement(game)
    release = bool(game.get("release_date") or game.get("first_release_date") or as_list(game.get("release_dates")))
    genres = bool(as_list(game.get("genres")))

    signals: list[str] = []
    score = 0

    if cover:
        score += 20
    else:
        signals.append("missing_cover")

    if company:
        score += 20
    else:
        signals.append("missing_company")

    if description >= 100:
        score += 20
    elif description >= 35:
        score += 10
    else:
        signals.append("sparse_description")

    if media >= 2:
        score += 15
    elif media == 1:
        score += 7
    else:
        signals.append("missing_supporting_media")

    if activity >= 10:
        score += 15
    elif activity > 0:
        score += 6
    else:
        signals.append("no_engagement_signal")

    if release:
        score += 5
    else:
        signals.append("missing_release_date")

    if genres:
        score += 5
    else:
        signals.append("missing_genres")

    if title and not title[0].isalnum():
        score -= 5
        signals.append("title_starts_with_symbol")

    if len(title) <= 4:
        score -= 5
        signals.append("very_short_title")

    if words and len(words) <= 3 and all(word in GENERIC_WORDS or word.isdigit() for word in words):
        score -= 8
        signals.append("generic_title")

    score = max(0, min(100, score))

    severely_sparse = (
        not company
        and description < 35
        and media == 0
        and activity == 0
        and (not cover or score <= 20)
    )

    hide = severely_sparse or score <= 15

    return {
        "igdb_id": record_id(game),
        "name": title,
        "quality_score": score,
        "signals": sorted(set(signals)),
        "hide_by_default": hide,
    }


def load_index() -> tuple[Any, list[dict[str, Any]], bool]:
    if not INDEX.is_file():
        raise SystemExit("[FAIL] Falta data/catalog_igdb.json")

    payload = json.loads(INDEX.read_text(encoding="utf-8-sig"))
    if isinstance(payload, dict) and isinstance(payload.get("games"), list):
        return payload, payload["games"], True
    if isinstance(payload, list):
        return payload, payload, False
    raise SystemExit("[FAIL] catalog_igdb.json no contiene una lista de juegos")


def main() -> int:
    parser = argparse.ArgumentParser(description="Separa registros públicos de baja calidad")
    parser.add_argument("--dry-run", action="store_true", help="No modifica archivos")
    args = parser.parse_args()

    payload, games, wrapped = load_index()
    kept: list[dict[str, Any]] = []
    removed: list[dict[str, Any]] = []

    for game in games:
        if not isinstance(game, dict):
            kept.append(game)
            continue
        result = evaluate(game)
        if result["hide_by_default"]:
            removed.append(result)
        else:
            kept.append(game)

    print(f"[CHECK] Juegos antes: {len(games)}")
    print(f"[CHECK] Registros de baja calidad: {len(removed)}")
    print(f"[CHECK] Juegos después: {len(kept)}")

    for item in removed[:20]:
        joined = ", ".join(item["signals"])
        print(f"[REVIEW] {item['igdb_id']} | {item['name']} | score {item['quality_score']} | {joined}")

    if args.dry_run:
        print("[OK] Simulación completada. No se modificaron archivos.")
        return 0

    if not removed:
        print("[OK] No había registros que separar. No se modificó el índice.")
        return 0

    shutil.copy2(INDEX, BACKUP)

    if wrapped:
        payload["games"] = kept
        output = payload
    else:
        output = kept

    INDEX.write_text(
        json.dumps(output, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )

    exclusion_payload = {
        "policy": "low_quality_records_only",
        "removed_from_public_index": len(removed),
        "games": removed,
    }
    EXCLUSIONS.write_text(
        json.dumps(exclusion_payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"[OK] Índice filtrado: {INDEX.relative_to(ROOT)}")
    print(f"[OK] Respaldo: {BACKUP.relative_to(ROOT)}")
    print(f"[OK] Exclusiones: {EXCLUSIONS.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

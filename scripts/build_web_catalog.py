"""Build a browser-friendly IGDB catalog for HEARTAGRAM.

Source (local, ignored by Git):
    data/catalog_igdb.full.json

Outputs (safe to publish):
    data/catalog_igdb.json
    data/catalog_igdb_details/shard-000.json
    data/catalog_igdb_details/shard-001.json
    ...

The public catalog keeps standalone, playable releases and excludes secondary
content such as DLC, bundles, updates, seasons, mods, and add-on packs.
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
SOURCE_FILE = ROOT / "data" / "catalog_igdb.full.json"
INDEX_FILE = ROOT / "data" / "catalog_igdb.json"
DETAILS_DIR = ROOT / "data" / "catalog_igdb_details"

DEFAULT_SHARD_SIZE = 500
SUMMARY_LIMIT = 320

ALLOWED_GAME_TYPES = frozenset(
    {
        "Main Game",
        "Port",
        "Remaster",
        "Remake",
        "Expanded Game",
        "Standalone Expansion",
    }
)

EXCLUDED_GAME_TYPES = frozenset(
    {
        "Bundle",
        "DLC",
        "Pack / Addon",
        "Update",
        "Season",
        "Expansion",
        "Mod",
        "Episode",
        "Fork",
    }
)


def load_source() -> dict[str, Any]:
    """Load and validate the local full catalog."""

    if not SOURCE_FILE.exists():
        raise FileNotFoundError(
            "No existe data/catalog_igdb.full.json. "
            "Ejecuta primero sync_igdb_catalog.py."
        )

    payload = json.loads(SOURCE_FILE.read_text(encoding="utf-8"))

    if not isinstance(payload, dict) or not isinstance(payload.get("games"), list):
        raise TypeError("El catálogo maestro no tiene una lista games válida")

    return payload


def clean_text(value: Any) -> str | None:
    """Collapse whitespace in optional text."""

    if not isinstance(value, str):
        return None

    cleaned = " ".join(value.split())
    return cleaned or None


def truncate(value: str | None, limit: int) -> str | None:
    """Shorten text without splitting the final word when possible."""

    if not value or len(value) <= limit:
        return value

    shortened = value[: limit + 1].rsplit(" ", 1)[0].rstrip(" ,.;:")
    return f"{shortened}…"


def platform_codes(platforms: Any) -> list[str]:
    """Convert IGDB platform objects into stable HEARTAGRAM codes."""

    if not isinstance(platforms, list):
        return []

    codes: list[str] = []

    for platform in platforms:
        if not isinstance(platform, dict):
            continue

        platform_id = platform.get("id")

        if platform_id == 130:
            codes.append("SWITCH")
        elif platform_id == 508:
            codes.append("SWITCH_2")

    return sorted(set(codes))


def string_list(value: Any) -> list[str]:
    """Return a sorted, unique list of non-empty strings."""

    if not isinstance(value, list):
        return []

    return sorted(
        {item.strip() for item in value if isinstance(item, str) and item.strip()},
        key=str.casefold,
    )


def release_year(release_date: Any) -> int | None:
    """Extract a numeric year from YYYY-MM-DD."""

    if not isinstance(release_date, str) or len(release_date) < 4:
        return None

    try:
        return int(release_date[:4])
    except ValueError:
        return None


def game_type_value(game: dict[str, Any]) -> str | None:
    """Return the expanded IGDB game-type label."""

    game_type = game.get("game_type")
    if not isinstance(game_type, dict):
        return None

    return clean_text(game_type.get("type"))


def parent_game_value(game: dict[str, Any]) -> dict[str, Any] | None:
    """Return a compact parent-game relationship when IGDB provides one."""

    parent = game.get("parent_game")
    if not isinstance(parent, dict):
        return None

    parent_id = parent.get("id")
    parent_name = clean_text(parent.get("name"))

    if parent_id is None and parent_name is None:
        return None

    return {"id": parent_id, "name": parent_name}


def compact_game(game: dict[str, Any], shard: int) -> dict[str, Any]:
    """Create an index record used by browser search and filters."""

    cover = game.get("cover") if isinstance(game.get("cover"), dict) else {}

    return {
        "igdb_id": game.get("igdb_id"),
        "name": clean_text(game.get("name")) or "Sin título",
        "slug": game.get("slug") or "",
        "summary": truncate(clean_text(game.get("summary")), SUMMARY_LIMIT),
        "cover": cover.get("url"),
        "cover_2x": cover.get("url_2x"),
        "platforms": platform_codes(game.get("platforms")),
        "genres": string_list(game.get("genres")),
        "themes": string_list(game.get("themes")),
        "game_modes": string_list(game.get("game_modes")),
        "release_date": game.get("release_date"),
        "release_year": release_year(game.get("release_date")),
        "rating": game.get("rating"),
        "rating_count": game.get("rating_count", 0),
        "game_type": game_type_value(game),
        "parent_game": parent_game_value(game),
        "shard": shard,
    }


def detail_game(game: dict[str, Any]) -> dict[str, Any]:
    """Create a richer record loaded only when a game is opened."""

    return {
        "igdb_id": game.get("igdb_id"),
        "name": clean_text(game.get("name")) or "Sin título",
        "slug": game.get("slug") or "",
        "summary": clean_text(game.get("summary")),
        "storyline": clean_text(game.get("storyline")),
        "platforms": game.get("platforms", []),
        "genres": string_list(game.get("genres")),
        "themes": string_list(game.get("themes")),
        "keywords": string_list(game.get("keywords")),
        "game_modes": string_list(game.get("game_modes")),
        "player_perspectives": string_list(game.get("player_perspectives")),
        "franchises": string_list(game.get("franchises")),
        "collections": string_list(game.get("collections")),
        "developers": string_list(game.get("developers")),
        "publishers": string_list(game.get("publishers")),
        "cover": game.get("cover", {}),
        "artworks": game.get("artworks", []),
        "screenshots": game.get("screenshots", []),
        "release_date": game.get("release_date"),
        "rating": game.get("rating"),
        "rating_count": game.get("rating_count", 0),
        "hypes": game.get("hypes", 0),
        "game_type": game_type_value(game),
        "parent_game": parent_game_value(game),
        "status": game.get("status"),
        "igdb_url": game.get("igdb_url"),
    }


def exclusion_reason(game: Any) -> str | None:
    """Return why a source record should not enter the public explorer."""

    if not isinstance(game, dict):
        return "invalid_record"

    if not game.get("igdb_id"):
        return "missing_id"

    if not clean_text(game.get("name")):
        return "missing_name"

    if not platform_codes(game.get("platforms")):
        return "unsupported_platform"

    cover = game.get("cover")
    if not isinstance(cover, dict) or not cover.get("url"):
        return "missing_cover"

    game_type = game_type_value(game)
    if game_type is None:
        return "missing_game_type"

    if game_type in EXCLUDED_GAME_TYPES:
        return f"excluded_type:{game_type}"

    if game_type not in ALLOWED_GAME_TYPES:
        return f"unknown_type:{game_type}"

    return None


def write_json(path: Path, value: Any, *, pretty: bool) -> None:
    """Write UTF-8 JSON with deterministic compact separators."""

    path.parent.mkdir(parents=True, exist_ok=True)

    if pretty:
        text = json.dumps(value, ensure_ascii=False, indent=2)
    else:
        text = json.dumps(value, ensure_ascii=False, separators=(",", ":"))

    path.write_text(text, encoding="utf-8")


def file_size_mb(path: Path) -> float:
    """Return file size in MiB."""

    return path.stat().st_size / (1024 * 1024)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Construye el catálogo web compacto de HEARTAGRAM."
    )
    parser.add_argument(
        "--shard-size",
        type=int,
        default=DEFAULT_SHARD_SIZE,
        help=f"Juegos por shard de detalle (default: {DEFAULT_SHARD_SIZE}).",
    )
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Genera JSON indentado. Útil para depuración, más pesado para la web.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    if args.shard_size <= 0:
        print("[FAIL] --shard-size debe ser mayor que cero")
        return 1

    print("[INIT] Construyendo catálogo web")

    try:
        source = load_source()
        raw_games = source["games"]

        exclusion_counts: Counter[str] = Counter()
        games: list[dict[str, Any]] = []

        for game in raw_games:
            reason = exclusion_reason(game)
            if reason is None:
                games.append(game)
            else:
                exclusion_counts[reason] += 1

        games.sort(
            key=lambda game: (
                (clean_text(game.get("name")) or "").casefold(),
                int(game.get("igdb_id", 0)),
            )
        )

        dropped = sum(exclusion_counts.values())
        included_type_counts = Counter(game_type_value(game) for game in games)

        print(f"[CHECK] Maestro: {len(raw_games)} registros")
        print(f"[CHECK] Publicables: {len(games)} registros")
        print(f"[CHECK] Excluidos: {dropped} registros")
        print(f"[CHECK] Tipos incluidos: {dict(included_type_counts)}")
        for reason, count in sorted(exclusion_counts.items()):
            print(f"[CHECK] {reason}: {count}")

        if DETAILS_DIR.exists():
            shutil.rmtree(DETAILS_DIR)
        DETAILS_DIR.mkdir(parents=True, exist_ok=True)

        index_games: list[dict[str, Any]] = []
        shard_manifest: list[dict[str, Any]] = []

        for start in range(0, len(games), args.shard_size):
            shard_number = start // args.shard_size
            shard_games = games[start : start + args.shard_size]
            shard_name = f"shard-{shard_number:03d}.json"
            shard_path = DETAILS_DIR / shard_name

            details = {
                "meta": {"shard": shard_number, "count": len(shard_games)},
                "games": [detail_game(game) for game in shard_games],
            }
            write_json(shard_path, details, pretty=args.pretty)

            for game in shard_games:
                index_games.append(compact_game(game, shard_number))

            shard_manifest.append(
                {
                    "shard": shard_number,
                    "file": f"data/catalog_igdb_details/{shard_name}",
                    "count": len(shard_games),
                    "first_name": clean_text(shard_games[0].get("name")),
                    "last_name": clean_text(shard_games[-1].get("name")),
                }
            )

            print(
                f"[BUILD] {shard_name}: {len(shard_games):>3} juegos "
                f"({file_size_mb(shard_path):.2f} MB)"
            )

        platform_counts = Counter(
            code for game in index_games for code in game["platforms"]
        )
        genre_counts = Counter(
            genre for game in index_games for genre in game["genres"]
        )
        mode_counts = Counter(
            mode for game in index_games for mode in game["game_modes"]
        )
        game_type_counts = Counter(game["game_type"] for game in index_games)

        payload = {
            "meta": {
                "source": "IGDB",
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "source_generated_at": source.get("meta", {}).get("generated_at"),
                "count": len(index_games),
                "excluded": dropped,
                "excluded_by_reason": dict(sorted(exclusion_counts.items())),
                "allowed_game_types": sorted(ALLOWED_GAME_TYPES),
                "game_type_counts": dict(sorted(game_type_counts.items())),
                "shard_size": args.shard_size,
                "shard_count": len(shard_manifest),
                "platform_counts": dict(sorted(platform_counts.items())),
                "top_genres": dict(genre_counts.most_common(30)),
                "game_mode_counts": dict(mode_counts.most_common()),
                "shards": shard_manifest,
            },
            "games": index_games,
        }

        write_json(INDEX_FILE, payload, pretty=args.pretty)

        total_shards_mb = sum(
            file_size_mb(path) for path in DETAILS_DIR.glob("shard-*.json")
        )

        print(f"[OK] Índice: {INDEX_FILE}")
        print(f"[OK] Index size: {file_size_mb(INDEX_FILE):.2f} MB")
        print(f"[OK] Detail shards: {len(shard_manifest)}")
        print(f"[OK] Detail size: {total_shards_mb:.2f} MB")
        return 0

    except (FileNotFoundError, TypeError, ValueError, json.JSONDecodeError) as error:
        print(f"[FAIL] {error}")
        return 1


if __name__ == "__main__":
    sys.exit(main())

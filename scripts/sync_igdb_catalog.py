"""Synchronize the broad Nintendo Switch catalog from IGDB.

The script keeps the broad IGDB catalog separate from data/games.json,
which remains HEARTAGRAM's curated recommendation pool.

Input:
    .env with TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET

Output:
    data/catalog_igdb.full.json

Usage:
    python scripts/sync_igdb_catalog.py
    python scripts/sync_igdb_catalog.py --limit 1000
    python scripts/sync_igdb_catalog.py --platform switch2
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / ".env"
OUTPUT_FILE = ROOT / "data" / "catalog_igdb.full.json"

TOKEN_URL = "https://id.twitch.tv/oauth2/token"
IGDB_BASE_URL = "https://api.igdb.com/v4"

PLATFORMS = {
    "switch": 130,
    "switch2": 508,
}

BATCH_SIZE = 500
REQUEST_DELAY_SECONDS = 0.35


def load_env() -> dict[str, str]:
    """Load key-value pairs from the project .env file."""

    if not ENV_FILE.exists():
        raise FileNotFoundError("No existe .env en la raÃ­z del proyecto")

    values: dict[str, str] = {}

    for raw_line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()

        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")

    return values


def require_credentials(env: dict[str, str]) -> tuple[str, str]:
    """Return the Twitch credentials required by IGDB."""

    client_id = env.get("TWITCH_CLIENT_ID", "")
    client_secret = env.get("TWITCH_CLIENT_SECRET", "")

    if not client_id:
        raise KeyError("TWITCH_CLIENT_ID")

    if not client_secret:
        raise KeyError("TWITCH_CLIENT_SECRET")

    return client_id, client_secret


def get_access_token(client_id: str, client_secret: str) -> str:
    """Obtain an application access token from Twitch."""

    parameters = urllib.parse.urlencode(
        {
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "client_credentials",
        }
    )

    request = urllib.request.Request(
        f"{TOKEN_URL}?{parameters}",
        method="POST",
        headers={"User-Agent": "heartagram-igdb-sync"},
    )

    with urllib.request.urlopen(request, timeout=30) as response:
        payload = json.loads(response.read().decode("utf-8"))

    token = payload.get("access_token")

    if not token:
        raise RuntimeError("Twitch no devolviÃ³ un access_token")

    return str(token)


def igdb_request(
    client_id: str,
    access_token: str,
    endpoint: str,
    query: str,
) -> Any:
    """Send one POST query to IGDB."""

    request = urllib.request.Request(
        f"{IGDB_BASE_URL}/{endpoint}",
        data=query.encode("utf-8"),
        method="POST",
        headers={
            "Client-ID": client_id,
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
            "Content-Type": "text/plain",
            "User-Agent": "heartagram-igdb-sync",
        },
    )

    with urllib.request.urlopen(request, timeout=60) as response:
        return json.loads(response.read().decode("utf-8"))


def platform_ids(selection: str) -> list[int]:
    """Resolve a CLI platform selection to IGDB platform IDs."""

    if selection == "all":
        return list(PLATFORMS.values())

    return [PLATFORMS[selection]]


def build_query(ids: list[int], offset: int, limit: int) -> str:
    """Build one paginated IGDB games query."""

    joined_ids = ",".join(str(platform_id) for platform_id in ids)

    return (
        "fields "
        "id,"
        "name,"
        "slug,"
        "summary,"
        "storyline,"
        "category,"
        "game_type.id,"
        "game_type.type,"
        "parent_game.id,"
        "parent_game.name,"
        "status,"
        "first_release_date,"
        "genres.id,genres.name,"
        "themes.id,themes.name,"
        "keywords.id,keywords.name,"
        "game_modes.id,game_modes.name,"
        "player_perspectives.id,player_perspectives.name,"
        "platforms.id,platforms.name,platforms.abbreviation,"
        "cover.image_id,"
        "artworks.image_id,"
        "screenshots.image_id,"
        "franchises.id,franchises.name,"
        "collections.id,collections.name,"
        "involved_companies.developer,"
        "involved_companies.publisher,"
        "involved_companies.company.id,"
        "involved_companies.company.name,"
        "total_rating,"
        "total_rating_count,"
        "hypes,"
        "url,"
        "updated_at; "
        f"where platforms = ({joined_ids}) "
        "& name != null "
        "& cover != null; "
        "sort id asc; "
        f"limit {limit}; "
        f"offset {offset};"
    )


def image_url(image_id: str | None, size: str = "cover_big") -> str | None:
    """Build an IGDB image URL from an image ID."""

    if not image_id:
        return None

    return f"https://images.igdb.com/igdb/image/upload/t_{size}/{image_id}.jpg"


def unix_date(value: int | None) -> str | None:
    """Convert a Unix timestamp to YYYY-MM-DD in UTC."""

    if not value:
        return None

    return datetime.fromtimestamp(value, tz=timezone.utc).date().isoformat()


def names(items: Any) -> list[str]:
    """Extract unique names from an IGDB nested list."""

    if not isinstance(items, list):
        return []

    values = {
        str(item["name"]).strip()
        for item in items
        if isinstance(item, dict) and item.get("name")
    }

    return sorted(values, key=str.casefold)


def companies(game: dict[str, Any], role: str) -> list[str]:
    """Extract developer or publisher names."""

    values: set[str] = set()

    for relation in game.get("involved_companies", []):
        if not isinstance(relation, dict) or not relation.get(role):
            continue

        company = relation.get("company")

        if isinstance(company, dict) and company.get("name"):
            values.add(str(company["name"]).strip())

    return sorted(values, key=str.casefold)


def normalize_game(game: dict[str, Any]) -> dict[str, Any]:
    """Normalize one IGDB record for the browser catalog."""

    cover = game.get("cover") if isinstance(game.get("cover"), dict) else {}
    cover_id = cover.get("image_id")

    artwork_ids = [
        item.get("image_id")
        for item in game.get("artworks", [])
        if isinstance(item, dict) and item.get("image_id")
    ]

    screenshot_ids = [
        item.get("image_id")
        for item in game.get("screenshots", [])
        if isinstance(item, dict) and item.get("image_id")
    ]

    switch_platforms = [
        platform
        for platform in game.get("platforms", [])
        if isinstance(platform, dict) and platform.get("id") in PLATFORMS.values()
    ]

    return {
        "igdb_id": game["id"],
        "name": game.get("name", ""),
        "slug": game.get("slug", ""),
        "summary": game.get("summary"),
        "storyline": game.get("storyline"),
        "category": game.get("category"),
        "game_type": (
            {
                "id": game["game_type"].get("id"),
                "type": game["game_type"].get("type"),
            }
            if isinstance(game.get("game_type"), dict)
            else None
        ),
        "parent_game": (
            {
                "id": game["parent_game"].get("id"),
                "name": game["parent_game"].get("name"),
            }
            if isinstance(game.get("parent_game"), dict)
            else None
        ),
        "status": game.get("status"),
        "release_date": unix_date(game.get("first_release_date")),
        "platforms": [
            {
                "id": platform.get("id"),
                "name": platform.get("name"),
                "abbreviation": platform.get("abbreviation"),
            }
            for platform in switch_platforms
        ],
        "genres": names(game.get("genres")),
        "themes": names(game.get("themes")),
        "keywords": names(game.get("keywords")),
        "game_modes": names(game.get("game_modes")),
        "player_perspectives": names(game.get("player_perspectives")),
        "franchises": names(game.get("franchises")),
        "collections": names(game.get("collections")),
        "developers": companies(game, "developer"),
        "publishers": companies(game, "publisher"),
        "cover": {
            "image_id": cover_id,
            "url": image_url(cover_id),
            "url_2x": image_url(cover_id, "cover_big_2x"),
        },
        "artworks": [image_url(image_id, "720p") for image_id in artwork_ids[:3]],
        "screenshots": [
            image_url(image_id, "screenshot_big") for image_id in screenshot_ids[:5]
        ],
        "rating": round(float(game["total_rating"]), 2)
        if game.get("total_rating") is not None
        else None,
        "rating_count": game.get("total_rating_count", 0),
        "hypes": game.get("hypes", 0),
        "igdb_url": game.get("url"),
        "updated_at": unix_date(game.get("updated_at")),
    }


def fetch_all_games(
    client_id: str,
    access_token: str,
    ids: list[int],
    maximum: int | None,
) -> list[dict[str, Any]]:
    """Download and normalize all matching games in batches."""

    records: dict[int, dict[str, Any]] = {}
    offset = 0

    while True:
        if maximum is not None:
            remaining = maximum - len(records)

            if remaining <= 0:
                break

            page_size = min(BATCH_SIZE, remaining)
        else:
            page_size = BATCH_SIZE

        query = build_query(ids, offset, page_size)
        page = igdb_request(client_id, access_token, "games", query)

        if not isinstance(page, list):
            raise TypeError("IGDB no devolviÃ³ una lista de juegos")

        if not page:
            break

        for raw_game in page:
            if not isinstance(raw_game, dict) or "id" not in raw_game:
                continue

            normalized = normalize_game(raw_game)
            records[int(normalized["igdb_id"])] = normalized

        offset += len(page)

        print(f"[SYNCING] {len(records):>6} juegos normalizados (offset {offset})")

        if len(page) < page_size:
            break

        time.sleep(REQUEST_DELAY_SECONDS)

    return sorted(
        records.values(),
        key=lambda game: (
            game["name"].casefold(),
            game["igdb_id"],
        ),
    )


def parse_args() -> argparse.Namespace:
    """Parse command-line options."""

    parser = argparse.ArgumentParser(
        description="Sincroniza el catÃ¡logo amplio de Switch desde IGDB."
    )

    parser.add_argument(
        "--platform",
        choices=("all", "switch", "switch2"),
        default="all",
        help="Plataforma a sincronizar (default: all).",
    )

    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="LÃ­mite opcional para pruebas.",
    )

    return parser.parse_args()


def main() -> int:
    """Run the complete IGDB catalog synchronization."""

    args = parse_args()

    if args.limit is not None and args.limit <= 0:
        print("[FAIL] --limit debe ser mayor que cero")
        return 1

    print("[INIT] Iniciando sincronizaciÃ³n de IGDB")
    print(f"[CHECK] Plataforma seleccionada: {args.platform}")

    try:
        env = load_env()
        client_id, client_secret = require_credentials(env)
        access_token = get_access_token(client_id, client_secret)

        print("[OK] Token de Twitch obtenido")

        ids = platform_ids(args.platform)
        games = fetch_all_games(
            client_id,
            access_token,
            ids,
            args.limit,
        )

        payload = {
            "meta": {
                "source": "IGDB",
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "platform_selection": args.platform,
                "platform_ids": ids,
                "count": len(games),
            },
            "games": games,
        }

        OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
        OUTPUT_FILE.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

        print(f"[OK] {len(games)} juegos guardados")
        print(f"[OK] Archivo: {OUTPUT_FILE}")
        return 0

    except FileNotFoundError as error:
        print(f"[FAIL] {error}")
        return 1

    except KeyError as error:
        print(f"[FAIL] Falta {error.args[0]} en .env")
        return 1

    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        print(f"[FAIL] HTTP {error.code}: {error.reason}")

        if body:
            print(body)

        return 1

    except urllib.error.URLError as error:
        print(f"[FAIL] Error de conexiÃ³n: {error.reason}")
        return 1

    except (
        json.JSONDecodeError,
        RuntimeError,
        TypeError,
        ValueError,
    ) as error:
        print(f"[FAIL] {error}")
        return 1


if __name__ == "__main__":
    sys.exit(main())


"""Tests the IGDB connection and previews Nintendo Switch games.

This script:
1. Loads Twitch credentials from .env.
2. Obtains an OAuth access token.
3. Finds Nintendo Switch platforms in IGDB.
4. Counts associated games.
5. Prints a sample of five games.

It does not modify project data.
"""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / ".env"

TWITCH_HOST = "id.twitch.tv"
IGDB_HOST = "api.igdb.com"

TOKEN_URL = f"https://{TWITCH_HOST}/oauth2/token"
IGDB_BASE_URL = f"https://{IGDB_HOST}/v4"


def load_env() -> dict[str, str]:
    """Loads key-value pairs from the project .env file."""

    if not ENV_FILE.exists():
        raise FileNotFoundError("No existe .env en la raíz del proyecto")

    values: dict[str, str] = {}

    for raw_line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()

        if not line or line.startswith("#"):
            continue

        if "=" not in line:
            continue

        key, value = line.split("=", 1)

        values[key.strip()] = value.strip().strip('"').strip("'")

    return values


def require_credentials(
    env: dict[str, str],
) -> tuple[str, str]:
    """Returns the required Twitch credentials."""

    client_id = env.get(
        "TWITCH_CLIENT_ID",
        "",
    )

    client_secret = env.get(
        "TWITCH_CLIENT_SECRET",
        "",
    )

    if not client_id:
        raise KeyError("TWITCH_CLIENT_ID")

    if not client_secret:
        raise KeyError("TWITCH_CLIENT_SECRET")

    return client_id, client_secret


def get_access_token(
    client_id: str,
    client_secret: str,
) -> str:
    """Obtains an application access token from Twitch."""

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
        headers={
            "User-Agent": "heartagram-igdb-probe",
        },
    )

    with urllib.request.urlopen(
        request,
        timeout=30,
    ) as response:
        payload = json.loads(response.read().decode("utf-8"))

    token = payload.get("access_token")

    if not token:
        raise RuntimeError("Twitch no devolvió un access_token")

    return str(token)


def igdb_request(
    client_id: str,
    access_token: str,
    endpoint: str,
    query: str,
) -> Any:
    """Sends a POST query to one IGDB endpoint."""

    request = urllib.request.Request(
        f"{IGDB_BASE_URL}/{endpoint}",
        data=query.encode("utf-8"),
        method="POST",
        headers={
            "Client-ID": client_id,
            "Authorization": (f"Bearer {access_token}"),
            "Accept": "application/json",
            "Content-Type": "text/plain",
            "User-Agent": "heartagram-igdb-probe",
        },
    )

    with urllib.request.urlopen(
        request,
        timeout=30,
    ) as response:
        return json.loads(response.read().decode("utf-8"))


def find_switch_platforms(
    client_id: str,
    access_token: str,
) -> list[dict[str, Any]]:
    """Finds platforms whose names contain Switch."""

    query = (
        "fields "
        "id,"
        "name,"
        "abbreviation,"
        "alternative_name; "
        'where name ~ *"Switch"*; '
        "sort id asc; "
        "limit 50;"
    )

    result = igdb_request(
        client_id,
        access_token,
        "platforms",
        query,
    )

    if not isinstance(result, list):
        raise TypeError("IGDB no devolvió una lista de plataformas")

    return result


def count_games(
    client_id: str,
    access_token: str,
    platform_ids: list[int],
) -> int:
    """Counts games assigned to the selected platforms."""

    joined_ids = ",".join(str(platform_id) for platform_id in platform_ids)

    query = f"where platforms = ({joined_ids});"

    result = igdb_request(
        client_id,
        access_token,
        "games/count",
        query,
    )

    if not isinstance(result, dict):
        raise TypeError("IGDB no devolvió un objeto de conteo")

    return int(result.get("count", 0))


def load_sample_games(
    client_id: str,
    access_token: str,
    platform_ids: list[int],
) -> list[dict[str, Any]]:
    """Loads five popular games for field inspection."""

    joined_ids = ",".join(str(platform_id) for platform_id in platform_ids)

    query = (
        "fields "
        "id,"
        "name,"
        "slug,"
        "summary,"
        "genres.name,"
        "themes.name,"
        "game_modes.name,"
        "platforms.name,"
        "cover.image_id,"
        "first_release_date,"
        "total_rating,"
        "total_rating_count; "
        f"where platforms = ({joined_ids}) "
        "& version_parent = null "
        "& total_rating_count > 0; "
        "sort total_rating_count desc; "
        "limit 5;"
    )

    result = igdb_request(
        client_id,
        access_token,
        "games",
        query,
    )

    if not isinstance(result, list):
        raise TypeError("IGDB no devolvió una lista de juegos")

    return result


def main() -> int:
    """Runs the IGDB connection probe."""

    print("[INIT] Iniciando prueba de IGDB")

    try:
        env = load_env()

        client_id, client_secret = require_credentials(env)

        print("[CHECK] Credenciales encontradas")

        token = get_access_token(
            client_id,
            client_secret,
        )

        print("[OK] Token de Twitch obtenido")

        platforms = find_switch_platforms(
            client_id,
            token,
        )

        if not platforms:
            print("[FAIL] IGDB no encontró plataformas con Switch en el nombre")
            return 1

        print("[OK] Plataformas encontradas:")

        for platform in platforms:
            platform_id = platform.get("id")
            platform_name = platform.get(
                "name",
                "Sin nombre",
            )
            abbreviation = platform.get(
                "abbreviation",
                "",
            )

            print(f"  {platform_id!s:>5}  {platform_name}  [{abbreviation}]")

        platform_ids = [
            int(platform["id"])
            for platform in platforms
            if platform.get("id") is not None
        ]

        total = count_games(
            client_id,
            token,
            platform_ids,
        )

        print(f"[OK] Juegos asociados: {total}")

        sample_games = load_sample_games(
            client_id,
            token,
            platform_ids,
        )

        print("[OK] Muestra de juegos:")

        for game in sample_games:
            print("── ⋆⋅✦⋅⋆ ──")

            print(
                json.dumps(
                    game,
                    ensure_ascii=False,
                    indent=2,
                )
            )

        return 0

    except FileNotFoundError as error:
        print(f"[FAIL] {error}")
        return 1

    except KeyError as error:
        print(f"[FAIL] Falta {error.args[0]} en el archivo .env")
        return 1

    except urllib.error.HTTPError as error:
        response_body = error.read().decode(
            "utf-8",
            errors="replace",
        )

        print(f"[FAIL] HTTP {error.code}: {error.reason}")

        if response_body:
            print(response_body)

        return 1

    except urllib.error.URLError as error:
        print(f"[FAIL] Error de conexión: {error.reason}")
        return 1

    except (
        json.JSONDecodeError,
        TypeError,
        RuntimeError,
        ValueError,
    ) as error:
        print(f"[FAIL] {error}")
        return 1


if __name__ == "__main__":
    sys.exit(main())

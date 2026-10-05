"""Inspect IGDB game types and verify game_type expansion on Switch records.

Reads TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET from .env.
Does not modify project data.
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
TOKEN_URL = "https://id.twitch.tv/oauth2/token"
IGDB_BASE_URL = "https://api.igdb.com/v4"


def load_env() -> dict[str, str]:
    if not ENV_FILE.exists():
        raise FileNotFoundError("No existe .env en la raíz del proyecto")

    values: dict[str, str] = {}
    for raw_line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def get_token(client_id: str, client_secret: str) -> str:
    params = urllib.parse.urlencode(
        {
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "client_credentials",
        }
    )
    request = urllib.request.Request(f"{TOKEN_URL}?{params}", method="POST")
    with urllib.request.urlopen(request, timeout=30) as response:
        payload = json.loads(response.read().decode("utf-8"))
    return str(payload["access_token"])


def igdb(client_id: str, token: str, endpoint: str, query: str) -> Any:
    request = urllib.request.Request(
        f"{IGDB_BASE_URL}/{endpoint}",
        data=query.encode("utf-8"),
        method="POST",
        headers={
            "Client-ID": client_id,
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
            "Content-Type": "text/plain",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def main() -> int:
    try:
        env = load_env()
        client_id = env["TWITCH_CLIENT_ID"]
        client_secret = env["TWITCH_CLIENT_SECRET"]
        token = get_token(client_id, client_secret)

        print("[OK] Token obtenido")

        game_types = igdb(
            client_id,
            token,
            "game_types",
            "fields id,type; sort id asc; limit 100;",
        )
        print("[OK] game_types:")
        print(json.dumps(game_types, ensure_ascii=False, indent=2))

        samples = igdb(
            client_id,
            token,
            "games",
            "fields id,name,game_type.id,game_type.type,parent_game.name; "
            "where platforms = (130,508) & cover != null; "
            "sort id asc; limit 20;",
        )
        print("[OK] Muestra de juegos con game_type:")
        print(json.dumps(samples, ensure_ascii=False, indent=2))
        return 0

    except KeyError as error:
        print(f"[FAIL] Falta {error.args[0]} en .env")
        return 1
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        print(f"[FAIL] HTTP {error.code}: {error.reason}")
        if body:
            print(body)
        return 1
    except (FileNotFoundError, urllib.error.URLError, json.JSONDecodeError) as error:
        print(f"[FAIL] {error}")
        return 1


if __name__ == "__main__":
    sys.exit(main())

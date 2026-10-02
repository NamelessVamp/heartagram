"""Validates data/*.json before publishing.

Usage:
    python scripts/validate_catalog.py            # report, VERIFICAR = warning
    python scripts/validate_catalog.py --strict   # pre-publish, VERIFICAR = failure
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"

DIMENSIONS = {"pace", "social", "structure", "session", "mood", "challenge"}
ARCHETYPES = {
    "EXPLORER",
    "COMPETITOR",
    "COLLECTOR",
    "CREATOR",
    "SURVIVOR",
    "STRATEGIST",
    "STORY_SEEKER",
    "HORROR_FAN",
}
TAGS = {
    "genres": {
        "ACTION",
        "ADVENTURE",
        "RPG",
        "SHOOTER",
        "PLATFORMER",
        "PUZZLE",
        "SURVIVAL",
        "HORROR",
        "COZY",
        "FARMING",
        "VISUAL_NOVEL",
        "RACING",
        "FIGHTING",
        "PARTY",
        "SANDBOX",
        "OPEN_WORLD",
        "ROGUELIKE",
        "METROIDVANIA",
        "MOBA",
        "STRATEGY",
        "RHYTHM",
    },
    "mood": {
        "LIGHTHEARTED",
        "WHOLESOME",
        "RELAXING",
        "MELANCHOLIC",
        "DARK",
        "GOTHIC",
        "CREEPY",
        "CHAOTIC",
        "MYSTERIOUS",
        "STYLISH",
        "EPIC",
        "DARK_GOTHIC",
    },
    "vibes": {
        "LOL_VIBES",
        "COD_VIBES",
        "GENSHIN_VIBES",
        "FNAF_VIBES",
        "CRY_OF_FEAR_VIBES",
        "GOTH_VIBES",
    },
    "personality": ARCHETYPES,
    "couple": {
        "INTI_LIBRARY_MATCH",
        "COUPLE_FRIENDLY",
        "COMPETITIVE_COUPLE",
        "COOP_HEAVY",
        "DATE_NIGHT",
    },
}
MULTIPLAYER_KEYS = {
    "online_coop",
    "online_versus",
    "local_wireless",
    "same_console",
    "requires_nso",
    "gameshare",
}
REQUIRED = {
    "id",
    "title",
    "genres",
    "multiplayer",
    "mood",
    "vibes",
    "personality",
    "couple",
    "vector",
    "horror_level",
    "free_to_play",
    "price_mxn",
    "price_checked",
    "status",
}
ID_PATTERN = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class Report:
    def __init__(self) -> None:
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def fail(self, msg: str) -> None:
        self.errors.append(msg)

    def warn(self, msg: str) -> None:
        self.warnings.append(msg)


def load(name: str) -> list:
    """Loads a JSON file whose root is a list (games, questions)."""
    data = json.loads((DATA / name).read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise TypeError(f"{name}: se esperaba una lista")
    return data


def load_map(name: str) -> dict:
    """Loads a JSON file whose root is an object (profile texts, combos)."""
    data = json.loads((DATA / name).read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise TypeError(f"{name}: se esperaba un objeto")
    return data


def check_game(game: dict, report: Report, strict: bool) -> None:
    gid = game.get("id", "<sin id>")
    missing = REQUIRED - game.keys()
    if missing:
        report.fail(f"{gid}: faltan campos {sorted(missing)}")
        return

    if not ID_PATTERN.match(gid):
        report.fail(f"{gid}: id no es kebab-case")

    for layer, allowed in TAGS.items():
        unknown = set(game[layer]) - allowed
        if unknown:
            report.fail(f"{gid}: tags desconocidos en {layer}: {sorted(unknown)}")

    vector = game["vector"]
    if set(vector) != DIMENSIONS:
        report.fail(f"{gid}: el vector debe tener exactamente {sorted(DIMENSIONS)}")
    elif any(not isinstance(v, int) or not -2 <= v <= 2 for v in vector.values()):
        report.fail(f"{gid}: valores del vector fuera de -2..2")

    if game["horror_level"] not in range(4):
        report.fail(f"{gid}: horror_level debe ser 0..3")

    if set(game["multiplayer"]) != MULTIPLAYER_KEYS:
        report.fail(f"{gid}: multiplayer debe tener {sorted(MULTIPLAYER_KEYS)}")

    status = game["status"]
    if status == "VERIFICAR":
        (report.fail if strict else report.warn)(f"{gid}: status VERIFICAR")
        return
    if status != "VERIFICADO":
        report.fail(f"{gid}: status inválido '{status}'")
        return

    price = game["price_mxn"]
    if not isinstance(price, int) or price < 0:
        report.fail(f"{gid}: price_mxn debe ser entero >= 0")
    if game["free_to_play"] and price != 0:
        report.fail(f"{gid}: free_to_play con precio distinto de 0")
    if not isinstance(game["price_checked"], str) or not DATE_PATTERN.match(
        game["price_checked"]
    ):
        report.fail(f"{gid}: price_checked debe ser YYYY-MM-DD")
    unresolved = [k for k, v in game["multiplayer"].items() if not isinstance(v, bool)]
    if unresolved:
        report.fail(f"{gid}: multiplayer sin verificar: {unresolved}")
    if not game.get("why"):
        report.warn(f"{gid}: falta 'why'")


def check_questions(questions: list[dict], report: Report) -> None:
    for q in questions:
        if len(q["options"]) != 4:
            report.fail(f"{q['id']}: debe tener 4 opciones")
        for o in q["options"]:
            ref = f"{q['id']}{o['id']}"
            if set(o["dims"]) - DIMENSIONS:
                report.fail(f"{ref}: dimensión desconocida")
            if set(o["arch"]) - ARCHETYPES:
                report.fail(f"{ref}: arquetipo desconocido")
            if set(o.get("vibes", [])) - TAGS["vibes"]:
                report.fail(f"{ref}: vibe desconocido")


def check_profile_texts(
    profile_texts: dict, profile_combos: dict, report: Report
) -> None:
    missing = ARCHETYPES - profile_texts.keys()
    extra = profile_texts.keys() - ARCHETYPES
    if missing:
        report.fail(f"profile_texts: faltan arquetipos {sorted(missing)}")
    if extra:
        report.fail(f"profile_texts: arquetipos desconocidos {sorted(extra)}")

    required_fields = ("title", "subtitle", "hook", "body", "also")
    for archetype_id, text in profile_texts.items():
        for field in required_fields:
            if not text.get(field):
                report.fail(f"profile_texts.{archetype_id}: falta {field}")

    for combo_key, combo in profile_combos.items():
        parts = combo_key.split("|")
        if len(parts) != 2:
            report.fail(f"profile_combos: clave inválida '{combo_key}'")
            continue
        unknown = set(parts) - ARCHETYPES
        if unknown:
            report.fail(
                f"profile_combos.{combo_key}: arquetipos desconocidos {sorted(unknown)}"
            )
        for field in ("summary", "body"):
            if not combo.get(field):
                report.fail(f"profile_combos.{combo_key}: falta {field}")


def main() -> int:
    strict = "--strict" in sys.argv
    report = Report()

    games = load("games.json")
    ids = [g.get("id") for g in games]
    for dup in {i for i in ids if ids.count(i) > 1}:
        report.fail(f"id duplicado: {dup}")
    for game in games:
        check_game(game, report, strict)
    check_questions(load("questions.json"), report)

    check_profile_texts(
        load_map("profile_texts.json"),
        load_map("profile_combos.json"),
        report,
    )

    verified = sum(g.get("status") == "VERIFICADO" for g in games)
    print(
        f"[INIT] {len(games)} juegos · {verified} verificados · modo {'strict' if strict else 'reporte'}"
    )
    pending = [w for w in report.warnings if "VERIFICAR" in w]
    other = [w for w in report.warnings if "VERIFICAR" not in w]
    if pending:
        print(f"[WARN] {len(pending)} juegos con status VERIFICAR (pendiente Fase 1)")
    for w in other:
        print(f"[WARN] {w}")
    for e in report.errors:
        print(f"[FAIL] {e}")
    print(
        "[OK] catálogo válido"
        if not report.errors
        else f"[FAIL] {len(report.errors)} errores"
    )
    return 1 if report.errors else 0


if __name__ == "__main__":
    sys.exit(main())

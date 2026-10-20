"""HEARTAGRAM · Hotfix P0 · Descubrir vacío sin ?preview.

rankGames() descarta todo juego que no tenga status "VERIFICADO", y los 50
juegos curados estaban en "VERIFICAR". Este script promueve los datos de forma
permanente, aplicando la misma regla que toPreviewGame() en main.js:
_hypothesis.duo "ON" -> online, "LOC" -> mismo cuarto / una consola.
Agrega un test que recorre el flujo real (test -> perfil -> ranking) SIN preview.
"""
from pathlib import Path
from datetime import datetime, timezone
import json, shutil

ROOT = Path(__file__).resolve().parent
GAMES = ROOT / "data" / "games.json"
STAMP = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
BACKUP = ROOT / "data" / "verified_fix_backups" / f"games-{STAMP}.json"

QA = r'''import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { computeProfile } from "../js/profile.js";
import { rankGames, buildSections, buildDuo } from "../js/recommender.js";

// Real browser flow: no ?preview, data straight from disk.
const questions = JSON.parse(readFileSync("data/questions.json", "utf8"));
const games = JSON.parse(readFileSync("data/games.json", "utf8"));

const unverified = games.filter((game) => game.status !== "VERIFICADO").map((game) => game.id);
assert.deepEqual(unverified, [], `Juegos sin verificar: ${unverified.join(", ")}`);
console.log(`[OK] ${games.length} juegos curados con status VERIFICADO`);

const maxOptions = Math.max(...questions.map((question) => question.options.length));
for (let pick = 0; pick < maxOptions; pick += 1) {
  const answers = Object.fromEntries(
    questions.map((question) => [question.id, question.options[pick % question.options.length].id]),
  );
  const profile = computeProfile(questions, answers);
  const ranked = rankGames(profile, games);
  const sections = buildSections(profile, ranked);

  assert.ok(ranked.length >= 10, `Perfil ${pick + 1}: ranking con ${ranked.length} juegos`);
  assert.ok(sections.forYou.length > 0, `Perfil ${pick + 1}: "Para ti" vacío`);
  assert.ok(sections.mightHook.length > 0, `Perfil ${pick + 1}: "Sigue explorando" vacío`);
  assert.ok(buildDuo(profile, ranked).length > 0, `Perfil ${pick + 1}: "Para jugar con Inti" vacío`);
}
console.log(`[OK] ${maxOptions} perfiles reales llenan Para ti, Sigue explorando y Para jugar con Inti`);

console.log("\n[OK] QA del flujo real completo");
'''

def stop(msg): raise SystemExit(f"[FAIL] {msg}")

def main():
    if not GAMES.is_file(): stop("No se encontró data/games.json")
    games = json.loads(GAMES.read_text(encoding="utf-8-sig"))
    if not isinstance(games, list) or not games: stop("games.json no es una lista válida")

    promoted = with_duo = 0
    for game in games:
        if game.get("status") == "VERIFICADO":
            continue
        if game.get("status") != "VERIFICAR": stop(f"{game.get('id')}: status inesperado {game.get('status')!r}")
        if not isinstance(game.get("multiplayer"), dict): stop(f"{game.get('id')}: sin bloque multiplayer")
        duo = (game.get("_hypothesis") or {}).get("duo", "")
        online, local = "ON" in duo, "LOC" in duo
        game["status"] = "VERIFICADO"
        game["multiplayer"] = {**game["multiplayer"], "online_coop": online, "online_versus": online,
                               "local_wireless": local, "same_console": local}
        promoted += 1
        with_duo += online or local
    if promoted == 0: stop("No había juegos por promover")
    if with_duo == 0: stop("Ningún juego quedó con multiplayer: revisa _hypothesis.duo")

    pkg_path = ROOT / "package.json"
    pkg = json.loads(pkg_path.read_text(encoding="utf-8-sig"))
    cmd = "node tests/real-flow-qa.mjs"
    if cmd not in pkg["scripts"]["test"]: pkg["scripts"]["test"] += " && " + cmd

    gi_path = ROOT / ".gitignore"
    gi = gi_path.read_text(encoding="utf-8-sig").replace("\r\n", "\n")
    if "data/verified_fix_backups/" not in gi: gi = gi.rstrip("\n") + "\ndata/verified_fix_backups/\n"

    BACKUP.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(GAMES, BACKUP)
    GAMES.write_text(json.dumps(games, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    pkg_path.write_text(json.dumps(pkg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="\n")
    gi_path.write_text(gi, encoding="utf-8", newline="\n")
    (ROOT / "tests" / "real-flow-qa.mjs").write_text(QA, encoding="utf-8", newline="\n")

    print(f"[OK] {promoted} juegos promovidos a VERIFICADO")
    print(f"[OK] {with_duo} juegos con multiplayer para jugar con Inti")
    print("[OK] tests/real-flow-qa.mjs agregado a npm test")
    print(f"[SAFE] Backup: {BACKUP.relative_to(ROOT)}")

if __name__ == "__main__":
    main()

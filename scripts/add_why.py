"""One-off: fills the 'why' field of every seed game. Safe to re-run."""
import json
from pathlib import Path

GAMES = Path(__file__).resolve().parents[1] / "data" / "games.json"

WHY = {
    # Horror / oscuro
    "luigis-mansion-3": "Sustos con humor: la tensión de FNAF, pero sin traumas.",
    "little-nightmares": "Corto, inquietante y precioso. Pura atmósfera de pesadilla.",
    "little-nightmares-2": "La secuela: más grande, más oscura y más perturbadora.",
    "fnaf-security-breach": "Freddy en una plaza enorme, de noche. Ya sabes cómo va esto.",
    "fnaf-help-wanted": "Los turnos de noche clásicos de FNAF, reunidos en un solo juego.",
    "signalis": "Horror de supervivencia con una historia triste que no se olvida.",
    "darkwood": "Un bosque, recursos escasos y noches que se sienten eternas.",
    "dredge": "Pescas de día. De noche, el mar se vuelve algo más.",
    "inscryption": "Un juego de cartas que no es lo que parece. Mejor no saber más.",
    "blasphemous": "Gótico, brutal y hermoso. Difícil a propósito.",
    "cult-of-the-lamb": "Tierno por fuera, oscuro por dentro: tú diriges la secta.",
    "hollow-knight": "Un reino subterráneo enorme, melancólico y lleno de secretos.",
    "hollow-knight-silksong": "La secuela de Hollow Knight: más rápida y todavía más difícil.",
    "resident-evil-tbd": "El clásico del survival horror. Pasillos, recursos y tensión.",

    # Exploración
    "zelda-botw": "Si te gustaba explorar Teyvat, este es el mundo abierto que lo inspiró.",
    "zelda-totk": "Hyrule otra vez, ahora con islas en el cielo y cosas para construir.",
    "zelda-oot-2026": "El clásico de Zelda, rehecho para tu consola.",
    "zelda-echoes-of-wisdom": "Zelda como protagonista: resuelves todo con creatividad.",
    "pokemon-legends-za": "Pokémon en una ciudad: explorar, capturar y coleccionar.",
    "pokemon-scarlet-violet": "Mundo abierto de Pokémon para recorrer, solo o con alguien.",
    "no-mans-sky": "Un universo infinito para explorar, y Inti ya está ahí.",
    "metroid-dread": "Huye de algo que te persigue en una estación hostil.",
    "metroid-prime-4": "Exploración en primera persona en planetas misteriosos.",
    "xenoblade-3": "Un RPG épico con una historia que pega fuerte.",

    # Competitivo
    "pokemon-unite": "Es un MOBA, como LoL, pero con Pokémon. Y es gratis.",
    "fortnite": "Battle royale gratis. Si te gustaba CoD Mobile, aquí hay adrenalina.",
    "splatoon-3": "Shooter por equipos, pero con tinta. Rápido y con mucho estilo.",
    "mario-kart-world": "El clásico para retar a Inti. Ya lo tiene, así que pueden jugar hoy.",
    "smash-ultimate": "Peleas caóticas entre personajes de Nintendo y muchos más.",
    "overwatch-2": "Héroes con roles, como en LoL, pero en shooter. Gratis.",
    "rocket-league": "Futbol con coches. Suena raro y es adictivo. Gratis.",
    "fall-guys": "Carreras de obstáculos caóticas para reírse. Gratis.",
    "splatoon-raiders": "Splatoon en modo aventura, con más acción.",

    # Historia / RPG
    "persona-5-royal": "Estilo, ladrones fantasma y una historia enorme. Inti lo está jugando.",
    "persona-3-reload": "Una torre, una hora oculta a medianoche y una historia que te marca.",
    "fire-emblem-three-houses": "Estrategia por turnos y decisiones que pesan.",
    "hades": "Escapar del inframundo: cada intento es distinto y muy adictivo.",
    "hades-2": "La secuela de Hades: más rápida, más oscura y con más magia.",
    "cyberpunk-2077": "Night City de noche. Una historia adulta y oscura.",

    # Cozy / crear
    "animal-crossing-nh": "Tu propia isla, a tu ritmo. Ideal para desconectarte.",
    "stardew-valley": "Granja, pueblo y misterios, y se puede jugar en pareja.",
    "pokopia": "Construye un lugar acogedor rodeado de Pokémon.",
    "minecraft": "Construir, sobrevivir y explorar, sola o juntos.",
    "tomodachi-life": "Una isla con tus amigos convertidos en Miis. Puro caos tierno.",
    "unpacking": "Desempacar cajas y descubrir una vida a través de sus cosas.",

    # Co-op / pareja
    "it-takes-two": "Hecho para dos: solo se puede jugar en equipo.",
    "overcooked-2": "Cocinar juntos bajo presión. Prueba de fuego para la relación.",
    "dont-starve-together": "Sobrevivir juntos en un mundo extraño y gótico.",
    "monster-hunter-rise": "Cazar monstruos enormes en equipo.",
    "mario-party-jamboree": "Tablero, minijuegos y traiciones amistosas.",
}

games = json.loads(GAMES.read_text(encoding="utf-8"))
missing = [g["id"] for g in games if g["id"] not in WHY]
for game in games:
    if game["id"] in WHY:
        game["why"] = WHY[game["id"]]

GAMES.write_text(json.dumps(games, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"[OK] {len(games) - len(missing)} textos escritos")
if missing:
    print(f"[WARN] sin texto: {missing}")
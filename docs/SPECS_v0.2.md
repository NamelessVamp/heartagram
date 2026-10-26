# H.E.A.R.T.A.G.R.A.M. — SPECS.md v0.2

```
╔══════════════════════════════════════════════════════════════╗
║  H.E.A.R.T.A.G.R.A.M.                                                  ║
║  Hyrule Experience & Adventure Recommendation Tool · A Gamer's Road Atlas & Map           ║
║  ─────────────────────────────────────────────────────────── ║
║  tipo      : regalo / onboarding interactivo                 ║
║  usuaria   : Adriana                                         ║
║  autor/QA  : Inti                                            ║
║  target    : Nintendo Switch 2 (consola de regalo)           ║
║  idioma    : español (términos en inglés se respetan)        ║
║  deadline  : antes del 29 oct 2026                           ║
║  status    : [SYNCING] SPECS v0.2                            ║
╚══════════════════════════════════════════════════════════════╝
```

── ⋆⋅✦⋅⋆ ──

## ⟦ 0. CHANGELOG ⟧

| Versión | Cambios |
|---|---|
| v0.1 | Concepto, test, catálogo, códigos, tutorial del grupo familiar |
| v0.2 | Modo dúo, 6 capas de tags, catálogo en dos capas, roles (Adriana contesta el test, Inti construye y prueba), Inti es administrador del grupo familiar, entrega de $1,500 queda como placeholder |

── ⋆⋅✦⋅⋆ ──

## ⟦ 1. PROPÓSITO ⟧

Onboarding de Adriana al ecosistema Nintendo. La página la lleva de "no sé qué jugar" a "ya tengo mis juegos, el online activo y sé qué jugar con Inti".

**Restricción real:** viene de PC y móvil (LoL, Genshin Impact, CoD Mobile) y le gusta el horror (Cry of Fear, FNAF). El catálogo de Switch es enorme y, sin guía, compraría lo más popular en vez de lo que le gusta.

**Flujo:**

```
[INTRO] → [TEST] → [PERFIL] → [RECOMENDACIONES] → [DUO: jugar con Inti]
                                                        │
                                   [REGALO $1,500 (placeholder)] → [TUTORIAL grupo familiar]
```

── ⋆⋅✦⋅⋆ ──

## ⟦ 2. ROLES ⟧

| Rol | Persona | Responsabilidad |
|---|---|---|
| Usuaria | Adriana | Contesta el test y recibe las recomendaciones |
| Autor | Inti | Diseño, código, catálogo y tags |
| QA | Inti | Pruebas con perfiles simulados antes de la entrega |

**Sorpresa:** Adriana no ve nada hasta el día del regalo. Todo el desarrollo y las pruebas los hace Inti.

── ⋆⋅✦⋅⋆ ──

## ⟦ 3. PERFIL DE LA USUARIA ⟧

| Dato | Valor | Implicación |
|---|---|---|
| Juego actual | League of Legends (laptop) | Competitivo, social, partidas cortas |
| Interés previo | Genshin Impact | Mundo abierto, exploración, estética anime |
| Historial móvil | Call of Duty Mobile | Shooter, acción rápida |
| Afinidad | Cry of Fear, FNAF | Horror, atmósfera, tensión |
| Estética | Goth / oscuro | UI oscura |

**Hipótesis inicial:** COMPETITOR + EXPLORER + HORROR_FAN. El test debe poder contradecirla (por ejemplo, si sus respuestas apuntan a cozy).

── ⋆⋅✦⋅⋆ ──

## ⟦ 4. TEST ⟧

### 4.1 Reglas

- Lo contesta **Adriana**, desde el celular.
- 10–12 preguntas, < 3 minutos.
- Preguntas **situacionales** y basadas en juegos que ya conoce; nunca "¿qué género te gusta?".
- 4 opciones por pregunta, con imagen.
- Cada opción suma puntos a dimensiones y a arquetipos de personalidad.
- Al menos 1 pregunta sobre jugar en pareja.
- Al menos 1 pregunta que mida su tolerancia al horror (para no recomendarle algo demasiado intenso).

### 4.2 Dimensiones (−2 a +2)

| ID | Dimensión | Polo − | Polo + |
|---|---|---|---|
| `pace` | Ritmo | Relajado | Acción |
| `social` | Social | Sola | Multijugador |
| `structure` | Estructura | Historia guiada | Sandbox |
| `session` | Sesiones | Ratos cortos | Maratones |
| `mood` | Atmósfera | Luminosa | Oscura / horror |
| `challenge` | Reto | Sin presión | Desafiante |

### 4.3 Resultado

- Vector de 6 dimensiones + top 2–3 arquetipos de personalidad.
- Arquetipo con nombre y descripción.
- Gráfica radar.

── ⋆⋅✦⋅⋆ ──

## ⟦ 5. SISTEMA DE TAGS (6 capas) ⟧

**Regla:** el catálogo no se limita a Nintendo. Entra cualquier juego disponible en la eShop de México: first-party, third-party, indie y free-to-play.

### Capa 1 — Género (objetivo)

`ACTION` `ADVENTURE` `RPG` `SHOOTER` `PLATFORMER` `PUZZLE` `SURVIVAL` `HORROR` `COZY` `FARMING` `VISUAL_NOVEL` `RACING` `FIGHTING` `PARTY` `SANDBOX` `OPEN_WORLD` `ROGUELIKE` `METROIDVANIA` `MOBA` `STRATEGY` `RHYTHM`

### Capa 2 — Multiplayer (objetivo)

| Tag | Significado |
|---|---|
| `ONLINE_COOP` / `ONLINE_VERSUS` | Cada quien desde su casa |
| `LOCAL_WIRELESS` | Mismo cuarto, cada uno con su consola |
| `SAME_CONSOLE` | Una consola, pantalla compartida |
| `REQUIRES_NSO` | Necesita Nintendo Switch Online |
| `GAMESHARE` | Compatible con GameShare (VERIFICAR por título) |

### Capa 3 — Mood (curado)

`LIGHTHEARTED` `WHOLESOME` `RELAXING` `MELANCHOLIC` `DARK` `GOTHIC` `CREEPY` `CHAOTIC` `MYSTERIOUS` `STYLISH` `EPIC`

### Capa 4 — Vibes (curado, el diferenciador)

| Tag | Puente desde | Ejemplos semilla |
|---|---|---|
| `LOL_VIBES` | League of Legends | Pokémon Unite |
| `COD_VIBES` | CoD Mobile | Fortnite, Splatoon 3 |
| `GENSHIN_VIBES` | Genshin Impact | Zelda BOTW / TOTK, Pokémon Legends: Z-A |
| `FNAF_VIBES` | FNAF | Títulos de FNAF disponibles, Luigi's Mansion 3 |
| `CRY_OF_FEAR_VIBES` | Cry of Fear | Little Nightmares, Signalis, Darkwood |
| `GOTH_VIBES` | Estética | Cult of the Lamb, Hollow Knight |

### Capa 5 — Personalidad (curado)

`EXPLORER` `COMPETITOR` `COLLECTOR` `CREATOR` `SURVIVOR` `STRATEGIST` `STORY_SEEKER` `HORROR_FAN`

### Capa 6 — Pareja (curado)

| Tag | Significado |
|---|---|
| `INTI_LIBRARY_MATCH` | Inti ya lo tiene: pueden jugar juntos desde el día 1 |
| `COUPLE_FRIENDLY` | Accesible y divertido en pareja |
| `COMPETITIVE_COUPLE` | Rivalidad sana |
| `COOP_HEAVY` | Diseñado para cooperar |
| `DATE_NIGHT` | Sesión especial juntos |

**Pendiente:** biblioteca de Inti para poblar `INTI_LIBRARY_MATCH`.

── ⋆⋅✦⋅⋆ ──

## ⟦ 6. CATÁLOGO (dos capas) ⟧

### 6.1 Capa A — Curated Pool (fuente de verdad)

- 150–300 juegos con tags de las capas 3–6 hechos a mano.
- Solo estos juegos se recomiendan (evita shovelware).

### 6.2 Capa B — Datos vivos (v2)

- Precio MXN, descuento, portada, fecha.
- Fuente por definir: candidatos Nintendo eShop, DekuDeals, IGDB, RAWG. **Pendiente investigar disponibilidad de MXN y términos de uso desde PC personal.**
- Si no hay fuente confiable, v1 usa precios capturados a mano con `price_checked`.

### 6.3 Esquema (`games.json`)

```json
{
  "id": "pokemon-unite",
  "title": "Pokémon UNITE",
  "publisher": "The Pokémon Company",
  "first_party": false,
  "genres": ["MOBA"],
  "multiplayer": {
    "online_coop": true,
    "online_versus": true,
    "local_wireless": true,
    "same_console": false,
    "requires_nso": "VERIFICAR",
    "gameshare": "VERIFICAR"
  },
  "mood": ["LIGHTHEARTED"],
  "vibes": ["LOL_VIBES"],
  "personality": ["COMPETITOR", "STRATEGIST"],
  "couple": ["COMPETITIVE_COUPLE"],
  "vector": { "pace": 1, "social": 2, "structure": 0, "session": -1, "mood": -1, "challenge": 1 },
  "price_mxn": 0,
  "free_to_play": true,
  "price_checked": null,
  "why": "Si te gusta LoL, este es el MOBA de Pokémon.",
  "status": "VERIFICAR"
}
```

── ⋆⋅✦⋅⋆ ──

## ⟦ 7. ALGORITMO (v1, sin IA) ⟧

1. Similitud coseno entre su vector y el de cada juego.
2. Bonus por arquetipo de personalidad coincidente.
3. Bonus por `vibes` ligados a su historial.
4. Penalización si `mood` supera su tolerancia al horror.

**Salida:**

| Bloque | Contenido |
|---|---|
| Para empezar | Top 3 |
| Te podrían atrapar | 4–7 |
| Sal de tu zona | 1 pick con `mood` opuesto |
| Para jugar con Inti | Ordenado: online + local > solo uno; `INTI_LIBRARY_MATCH` primero |
| Carritos | 3 combinaciones ≤ $1,500 (al menos 1 Duo Pack); F2P suman $0 |

Cada tarjeta muestra por qué se recomienda e insignias `ONLINE` · `MISMO CUARTO` · `UNA CONSOLA`.

── ⋆⋅✦⋅⋆ ──

## ⟦ 8. REGALO $1,500 MXN ⟧ [OPEN]

- Saldo de la eShop de México; método de entrega por decidir.
- La página reserva una sección para esto.
- **[BLOCKER permanente]:** ningún código vive en el repo ni en el HTML.

── ⋆⋅✦⋅⋆ ──

## ⟦ 9. TUTORIAL: GRUPO FAMILIAR NSO ⟧

**Administrador: Inti.**

1. Adriana crea su cuenta Nintendo (región México) y la vincula a la consola.
2. Inti entra a `accounts.nintendo.com` → Grupo familiar → Añadir un miembro → Invitar, con el correo de ella.
3. Adriana acepta la invitación desde su correo.
4. Verificación: su cuenta aparece en el grupo.

Máximo 8 cuentas; solo el administrador añade miembros.

── ⋆⋅✦⋅⋆ ──

## ⟦ 10. TRASPASO DE LA CONSOLA ⟧ [CHECK]

- [ ] Respaldar partidas en la nube.
- [ ] Desvincular la cuenta de Inti.
- [ ] Revisar qué juegos digitales dejan de estar disponibles.
- [ ] Decidir si se inicializa la consola.
- [ ] Decidir el destino de la microSD Express.
- [ ] Decidir qué cartuchos físicos acompañan el regalo.

── ⋆⋅✦⋅⋆ ──

## ⟦ 11. UI ⟧

- Goth / horror atmosférico a su gusto (FNAF, Cry of Fear): oscuro, grano, luz tenue. Sin jumpscares.
- Mobile-first, contraste AA, texto ≥ 16 px.
- Emojis relevantes y símbolos con moderación, sin saturar.

── ⋆⋅✦⋅⋆ ──

## ⟦ 12. STACK ⟧

| Capa | v1 | v2 | v3 |
|---|---|---|---|
| Frontend | HTML/CSS/JS vanilla en GitHub Pages | Igual | Igual |
| Datos | `games.json`, `questions.json` | + datos vivos vía Cloudflare Worker | Igual |
| IA | Ninguna | Ninguna | Fuera del alcance de la versión pública |
| Entorno | Cuenta GitHub personal, PC personal | Igual | Igual |

**Privacidad del repo:** GitHub Pages en plan gratuito requiere repo público. Mientras sea sorpresa, no compartir el enlace; los códigos de eShop nunca entran al repo.

**Evaluación stack IA:** LangGraph/LangChain no aportan valor para un agente único; Ollama no aplica (ella usa móvil). Proyecto personal, fuera de governance Emerson.

── ⋆⋅✦⋅⋆ ──

## ⟦ 13. QA ⟧

Inti valida con 4 perfiles simulados antes de la entrega:

| Perfil simulado | Top 3 esperado |
|---|---|
| Horror puro | Dominado por `HORROR` / `CREEPY` |
| Cozy | Dominado por `COZY` / `WHOLESOME` |
| Competitiva | Dominado por `COMPETITOR` / `LOL_VIBES` |
| Perfil real hipotético de Adriana | Mezcla explorer + horror + competitivo |

── ⋆⋅✦⋅⋆ ──

## ⟦ 14. ACCEPTANCE CRITERIA (v1) ⟧

- [ ] Adriana completa el test en < 3 min desde el celular.
- [ ] Los 4 perfiles de QA producen el top 3 esperado.
- [ ] 100% de los juegos mostrados están `VERIFICADO` con precio y fecha.
- [ ] Ningún carrito supera $1,500 MXN.
- [ ] La sección "Para jugar con Inti" separa online de local.
- [ ] Ningún código eShop en el repo ni en el HTML.
- [ ] El tutorial del grupo familiar se sigue sin ayuda.
- [ ] Funciona sin APIs externas.

── ⋆⋅✦⋅⋆ ──

## ⟦ 15. FUERA DE ALCANCE (v1) ⟧

- Precios en vivo (v2).
- Agente conversacional (v3).
- Login / cuentas.
- Versión en inglés.

```
[SYNCING] SPECS v0.2 :: siguiente → ROADMAP.md + diseño del test
```

# H.E.A.R.T.A.G.R.A.M. — TEST_DESIGN.md

```
╔══════════════════════════════════════════════════════════════╗
║  H.E.A.R.T.A.G.R.A.M. :: TEST DESIGN v0.2                              ║
║  ─────────────────────────────────────────────────────────── ║
║  preguntas : 12                                              ║
║  opciones  : 4 por pregunta (con imagen)                     ║
║  duración  : < 3 min                                         ║
║  modo      : Adriana sola o con Inti (mismo texto)           ║
║  status    : [OPEN] pendiente revisión de Inti               ║
╚══════════════════════════════════════════════════════════════╝
```

── ⋆⋅✦⋅⋆ ──

## ⟦ 1. REGLAS ⟧

- Segunda persona, dirigido a ella. Ninguna pregunta depende de que Inti responda.
- Situaciones y juegos que ya conoce; nunca "¿qué género te gusta?".
- Cada opción suma a **dimensiones** (−2…+2) y a **arquetipos** (+1/+2).
- 3 campos especiales: `horror_tolerance` (Q4), `couple_pref` (Q7), y anclas de historial (Q2 LoL, Q3 Genshin, Q10 CoD).
- Ninguna opción es "incorrecta": todas llevan a algún juego.

**Notación:** `pace` `social` `structure` `session` `mood` `challenge` · arquetipos en MAYÚSCULAS.

── ⋆⋅✦⋅⋆ ──

## ⟦ 2. PREGUNTAS ⟧

### Q1 — Domingo lluvioso, tarde libre. ¿Qué se te antoja?
| | Opción | Dimensiones | Arquetipos |
|---|---|---|---|
| A | Perderme horas en un mundo enorme | structure +1 · session +2 · pace −1 | EXPLORER +2 |
| B | Unas partidas rápidas para ganar algo | social +1 · session −1 · pace +1 · challenge +1 | COMPETITOR +2 |
| C | Algo tranquilo: decorar, cultivar, ordenar | pace −2 · mood −1 · challenge −1 | CREATOR +1 · COLLECTOR +1 |
| D | Luces apagadas y algo que me ponga nerviosa | mood +2 · pace +1 | HORROR_FAN +2 |

*Imagen:* ventana con lluvia, cuatro escenas distintas.

### Q2 — En LoL, ¿qué es lo que te mantiene jugando?
| | Opción | Dimensiones | Arquetipos |
|---|---|---|---|
| A | Ganar y subir de rank | challenge +2 · social +1 | COMPETITOR +2 |
| B | Jugar con amigos (o con Inti) | social +2 | COMPETITOR +1 |
| C | Dominar a mi main y sus mecánicas | challenge +1 | STRATEGIST +2 |
| D | Las skins y el lore | — | COLLECTOR +1 · STORY_SEEKER +1 |

### Q3 — ¿Qué era lo mejor de Genshin Impact?
| | Opción | Dimensiones | Arquetipos |
|---|---|---|---|
| A | Explorar y encontrar lugares escondidos | structure +1 · session +1 | EXPLORER +2 |
| B | Conseguir personajes y armas | session +1 | COLLECTOR +2 |
| C | La historia y los personajes | structure −1 | STORY_SEEKER +2 |
| D | Nunca me terminó de enganchar | pace +1 · structure −1 | — |

### Q4 — Noche de película de terror. ¿Cuál eliges? `horror_tolerance`
| | Opción | Dimensiones | Arquetipos | Tolerancia |
|---|---|---|---|---|
| A | Paso, mejor otra cosa | mood −2 | — | 0 |
| B | Algo raro y misterioso, sin sustos | mood +1 | STORY_SEEKER +1 | 1 |
| C | Sustos y tensión nivel FNAF | mood +2 | HORROR_FAN +1 | 2 |
| D | Lo más perturbador que exista | mood +2 | HORROR_FAN +2 · SURVIVOR +1 | 3 |

*Regla:* juegos con `mood` intenso por encima de su tolerancia se penalizan, no se eliminan.

### Q5 — Un juego se pone difícil. ¿Qué haces?
| | Opción | Dimensiones | Arquetipos |
|---|---|---|---|
| A | Lo intento hasta romperlo | challenge +2 | SURVIVOR +1 |
| B | Busco una estrategia o una guía | challenge +1 | STRATEGIST +2 |
| C | Le bajo la dificultad, vine a pasarla bien | challenge −2 | — |
| D | Lo dejo un rato y juego otra cosa | challenge −1 · session −1 | — |

### Q6 — ¿Cuánto tiempo juegas normalmente de un jalón?
| | Opción | Dimensiones |
|---|---|---|
| A | 15–20 min entre cosas | session −2 |
| B | Una o dos horas | session 0 |
| C | Maratón de fin de semana | session +2 |
| D | Depende, voy y vengo | session −1 · structure +1 |

### Q7 — Jugando con Inti, ¿qué prefieres? `couple_pref`
| | Opción | Dimensiones | Arquetipos | couple_pref |
|---|---|---|---|---|
| A | Competir y presumirle que le gané | social +2 | COMPETITOR +1 | COMPETITIVE_COUPLE |
| B | Equipo contra todo | social +2 | SURVIVOR +1 | COOP_HEAVY |
| C | Cada quien lo suyo en el mismo mundo | social +1 | CREATOR +1 | COUPLE_FRIENDLY |
| D | Turnarnos o ver la historia juntos | social +1 | STORY_SEEKER +1 | DATE_NIGHT |

### Q8 — ¿Qué lugar te gustaría visitar?
| | Opción | Dimensiones | Arquetipos |
|---|---|---|---|
| A | Ciudad de neón de noche | mood +1 · pace +1 | COMPETITOR +1 |
| B | Bosque oscuro con niebla | mood +2 | HORROR_FAN +1 · EXPLORER +1 |
| C | Un pueblito con casas bonitas | mood −2 | CREATOR +1 |
| D | Ruinas antiguas llenas de secretos | — | EXPLORER +2 · STORY_SEEKER +1 |

*Imagen:* las cuatro escenas en estilo ilustración oscura.

### Q9 — Empiezas un juego nuevo. ¿Qué quieres?
| | Opción | Dimensiones | Arquetipos |
|---|---|---|---|
| A | Que me cuente una historia paso a paso | structure −2 | STORY_SEEKER +2 |
| B | Que me suelte y descubra sola | structure +2 | EXPLORER +1 |
| C | Construir mi propio lugar | structure +2 | CREATOR +2 |
| D | Objetivos claros y retos | structure −1 · challenge +1 | STRATEGIST +1 |

### Q10 — ¿Qué tenían los shooters como CoD Mobile?
| | Opción | Dimensiones | Arquetipos |
|---|---|---|---|
| A | La adrenalina | pace +2 | COMPETITOR +1 |
| B | Jugar en escuadra | social +2 | SURVIVOR +1 |
| C | Mejorar mi puntería | challenge +1 | COMPETITOR +1 · STRATEGIST +1 |
| D | No eran lo mío | pace −1 | — |

### Q11 — Tu inventario ideal es…
| | Opción | Dimensiones | Arquetipos |
|---|---|---|---|
| A | Lleno: todo coleccionado | session +1 | COLLECTOR +2 |
| B | Lo mínimo para sobrevivir | mood +1 · challenge +1 | SURVIVOR +2 |
| C | Solo lo necesario y a lo que sigue | pace +1 | — |
| D | Cosas para decorar y crear | pace −1 | CREATOR +2 |

### Q12 — Un juego es perfecto si al terminar…
| | Opción | Dimensiones | Arquetipos |
|---|---|---|---|
| A | Me quedé pensando en la historia | — | STORY_SEEKER +2 |
| B | Gané | — | COMPETITOR +2 |
| C | Sigo con miedo | mood +2 | HORROR_FAN +2 |
| D | Quiero volver a explorar | — | EXPLORER +2 |

── ⋆⋅✦⋅⋆ ──

## ⟦ 3. COBERTURA ⟧

| Dimensión | Preguntas |
|---|---|
| pace | Q1, Q8, Q10, Q11 |
| social | Q1, Q2, Q7, Q10 |
| structure | Q1, Q3, Q6, Q9 |
| session | Q1, Q3, Q5, Q6, Q11 |
| mood | Q1, Q4, Q8, Q11, Q12 |
| challenge | Q1, Q2, Q5, Q9, Q11 |

Todos los arquetipos aparecen en ≥ 4 opciones.

── ⋆⋅✦⋅⋆ ──

## ⟦ 4. ARQUETIPOS ⟧

Nombres con guiños discretos a Ethel Cain y a su historial gamer. Sin "track" ni elementos religiosos en la página.

| ID | Nombre | Descripción | Guiño |
|---|---|---|---|
| EXPLORER | **La Errante** | Va a donde el mapa no dice | Genshin / *Thoroughfare* |
| COMPETITOR | **La de la Grieta** | Juega para ganar, y para que se note | LoL / *American Teenager* |
| COLLECTOR | **La Edad Dorada** | Nada brillante se queda sin conseguir | Gacha / *Golden Age* |
| CREATOR | **La Casa en Nebraska** | Si no existe, lo construye | *A House in Nebraska* |
| SURVIVOR | **Tiempos Difíciles** | Pocos recursos, mucha voluntad | CoD Mobile / *Hard Times* |
| STRATEGIST | **El Árbol Familiar** | Cada movimiento conecta con otro | LoL macro / *Family Tree* |
| STORY_SEEKER | **La Hija del Predicador** | Juega por lo que se cuenta | *Preacher's Daughter* |
| HORROR_FAN | **La Guardia Nocturna** | La que se queda en el turno de noche | FNAF |

**Resultado mostrado:** solo arquetipo principal y secundario, con su descripción.

```text
✦ TU PERFIL
LA ERRANTE · LA GUARDIA NOCTURNA
```

**Nuevo mood (Capa 3):** `DARK_GOTHIC` — juegos con iconografía religiosa oscura o fe corrompida. Se usa para recomendar, nunca en la UI.

**UI:** base horror (FNAF / Cry of Fear) + textura Ethel Cain (grano de película, sepia apagado, polaroids, carretera de noche). Sin iconografía religiosa.

*Juegos semilla = referencia de diseño; todos pendientes de verificación en eShop MX.*

── ⋆⋅✦⋅⋆ ──

## ⟦ 5. CÁLCULO ⟧

1. **Dimensiones:** suma por dimensión ÷ máximo posible de esa dimensión → normalizado a −2…+2.
2. **Arquetipos:** suma de puntos; resultado = primario + secundario (ej. *La Errante · La Guardia Nocturna*).
3. **Empates:** gana el arquetipo con más respuestas distintas a favor; si sigue empatado, se muestran ambos como primarios.
4. **Especiales:** `horror_tolerance` (0–3) y `couple_pref` se guardan aparte y alimentan el algoritmo (SPECS §7).

── ⋆⋅✦⋅⋆ ──

## ⟦ 6. FORMATO `questions.json` ⟧

```json
{
  "id": "q4",
  "text": "Noche de película de terror. ¿Cuál eliges?",
  "special": "horror_tolerance",
  "options": [
    { "id": "a", "text": "Paso, mejor otra cosa", "img": "q4a.webp",
      "dims": { "mood": -2 }, "arch": {}, "value": 0 },
    { "id": "d", "text": "Lo más perturbador que exista", "img": "q4d.webp",
      "dims": { "mood": 2 }, "arch": { "HORROR_FAN": 2, "SURVIVOR": 1 }, "value": 3 }
  ]
}
```

── ⋆⋅✦⋅⋆ ──

## ⟦ 7. QA ⟧

| Perfil simulado | Respuestas | Arquetipo esperado |
|---|---|---|
| Horror puro | D, D, C, D, A, C, B, B, B, B, B, C | La Guardia Nocturna |
| Cozy | C, D, B, A, C, A, C, C, C, D, D, A | La Casa en Nebraska |
| Competitiva | B, A, D, C, B, A, A, A, D, A, C, B | La de la Grieta |
| Probable Adriana | A, A, A, C, A, B, A, B, B, B, A, D | La Errante · La de la Grieta (con Guardia Nocturna cerca) |

```
[OPEN] TEST v0.1 :: revisión de Inti → luego lista semilla de 50 juegos
```

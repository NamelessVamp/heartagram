# H.E.A.R.T.A.G.R.A.M.

```
╔══════════════════════════════════════════════════════════════╗
║  H.E.A.R.T.A.G.R.A.M.                                                  ║
║  Hyrule Experience & Adventure Recommendation Tool · A Gamer's Road Atlas & Map           ║
║  ─────────────────────────────────────────────────────────── ║
║  tipo      : regalo / onboarding interactivo Nintendo Switch ║
║  stack     : HTML + CSS + JS vanilla · GitHub Pages          ║
║  versión   : v1 (en construcción)                            ║
║  status    : [INIT]                                          ║
╚══════════════════════════════════════════════════════════════╝
```

> Restricción: el catálogo de Switch es enorme. · Autoría: Inti, para Adriana. · Setup: abre `index.html`. · Extensión: agrega juegos en `data/games.json`.

── ⋆⋅✦⋅⋆ ──

## ⟦ QUÉ ES ⟧

H.E.A.R.T.A.G.R.A.M. es la bienvenida de Adriana a su Nintendo Switch. Contesta un test de 12 preguntas, descubre su perfil gamer y recibe recomendaciones del catálogo de Switch (Nintendo, third-party, indies y free-to-play) pensadas para ella y para jugar en pareja.

**Flujo:**

```
Intro → Test → Perfil → Recomendaciones → Para jugar con Inti → Regalo → Grupo familiar
```

## ⟦ EL NOMBRE ⟧

| Letra | Significado |
|---|---|
| **H** | Hyrule — la consola llega con Zelda |
| **E** | Experience — no es una tienda, es una bienvenida |
| **A** | Adventure — lo que viene después |
| **R** | Recommendation — el motor |
| **T** | Tool — algo que se sigue usando después del regalo |

*Nombre provisional hasta encontrar uno mejor.*

── ⋆⋅✦⋅⋆ ──

## ⟦ FEATURES (v1) ⟧

- **Test de perfil:** 12 preguntas situacionales, menos de 3 minutos, desde el celular.
- **8 arquetipos:** La Errante, La de la Grieta, La Edad Dorada, La Casa en Nebraska, Tiempos Difíciles, El Árbol Familiar, La Hija del Predicador y La Guardia Nocturna.
- **Recomendaciones explicadas:** cada juego dice por qué se recomienda.
- **Tolerancia al horror:** los juegos demasiado intensos para ella bajan en el ranking.
- **Para jugar con Inti:** insignias ONLINE · MISMO CUARTO · UNA CONSOLA. Primero los que Inti ya tiene.
- **Carritos de $1,500 MXN:** tres combinaciones dentro del presupuesto, mínimo un Duo Pack.
- **Tutorial del grupo familiar** de Nintendo Switch Online.
- **Funciona sin APIs externas.**

── ⋆⋅✦⋅⋆ ──

## ⟦ ESTRUCTURA ⟧

```
heartagram/
├── index.html
├── css/
│   ├── base.css          # variables, reset, tipografía
│   └── theme.css         # estética horror + textura de película
├── js/
│   ├── main.js           # flujo entre pantallas
│   ├── quiz.js           # motor del test
│   ├── profile.js        # cálculo de vector y arquetipos
│   ├── recommender.js    # similitud, bonus y penalizaciones
│   ├── carts.js          # combinaciones ≤ $1,500
│   └── ui.js             # render de tarjetas e insignias
├── data/
│   ├── games.json
│   ├── questions.json
│   └── archetypes.json
├── assets/
│   ├── img/
│   └── fonts/
├── scripts/
│   └── validate_catalog.py   # valida games.json antes de publicar
├── docs/
│   ├── SPECS.md
│   ├── ROADMAP.md
│   ├── TEST_DESIGN.md
│   └── SEED_CATALOG.md
├── CODESTYLE.md
└── README.md
```

── ⋆⋅✦⋅⋆ ──

## ⟦ INSTALACIÓN ⟧

El sitio es estático. El entorno virtual solo se usa para los scripts de validación.

```bash
git clone https://github.com/<usuario>/heartagram.git
cd heartagram

python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate
```

## ⟦ USO LOCAL ⟧

```bash
python -m http.server 8000
```

Abrir `http://localhost:8000`. No abrir `index.html` con doble clic: el navegador bloquea la carga de los JSON.

## ⟦ VALIDAR EL CATÁLOGO ⟧

```bash
python scripts/validate_catalog.py
```

Revisa que cada juego tenga los campos obligatorios, que los tags existan y que ningún juego mostrado tenga `status: VERIFICAR`.

## ⟦ AGREGAR UN JUEGO ⟧

1. Agregar el objeto en `data/games.json` siguiendo el esquema de `docs/SPECS.md`.
2. Llenar tags de las 6 capas y el vector de 6 dimensiones.
3. Verificar precio en la eShop de México y escribir la fecha en `price_checked`.
4. Cambiar `status` a `VERIFICADO`.
5. Correr `validate_catalog.py`.

## ⟦ PUBLICAR ⟧

GitHub Pages desde la rama `main`, carpeta raíz.

**[WARN]** En el plan gratuito el repo es público. Mientras sea sorpresa, no compartir el enlace. **Ningún código eShop entra al repo.**

── ⋆⋅✦⋅⋆ ──

## ⟦ ROADMAP ⟧ (vivo)

### Fase 0 — Diseño
- [x] SPECS v0.2
- [x] ROADMAP
- [x] Diseño del test y arquetipos
- [x] Lista semilla de 50 juegos
- [x] README.md
- [x] CODESTYLE.md

### Fase 1 — Catálogo (8–14 oct)
- [ ] Biblioteca de Inti → `INTI_LIBRARY_MATCH`
- [ ] Verificar precios, disponibilidad y multiplayer en eShop MX
- [ ] `games.json`, `questions.json`, `archetypes.json`

### Fase 2 — Build v1 (15–21 oct)
- [ ] Motor del test, perfil y recomendaciones
- [ ] Sección dúo, carritos y tutorial

### Fase 3 — UI + QA (22–27 oct)
- [ ] Estética horror + textura de película
- [ ] QA con 4 perfiles simulados

### Fase 4 — Entrega (28–29 oct)
- [ ] Código de $1,500 (reveal cifrado u otro método)
- [ ] Sticker NFC
- [ ] Traspaso de la consola

### Post-entrega
- [ ] v2: precios en vivo vía Cloudflare Worker
- [ ] v3: agente con Gemini

── ⋆⋅✦⋅⋆ ──

## ⟦ DECISIONES ⟧

| Decisión | Por qué |
|---|---|
| JS vanilla, sin framework | Sitio pequeño, sin build, fácil de mantener |
| Sin IA en v1 | Recomendaciones predecibles y verificables antes del regalo |
| Catálogo curado a mano | Ninguna API sabe qué tiene "FNAF vibes" |
| Precios manuales con fecha | No hay fuente MXN confirmada todavía |
| Repo personal, PC personal | Proyecto personal, fuera de Emerson |

```
// H.E.A.R.T.A.G.R.A.M. :: hecho para alguien en específico
```

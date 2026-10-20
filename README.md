# H.E.A.R.T.A.G.R.A.M.

```text
╔══════════════════════════════════════════════════════════════╗
║  H.E.A.R.T.A.G.R.A.M.                                       ║
║  Hyrule Experience & Adventure Recommendation Tool           ║
║  A Gamer's Road Atlas & Map                                  ║
║  ──────────────────────────────────────────────────────────  ║
║  tipo      : regalo y companion de Nintendo Switch 2         ║
║  stack     : HTML + CSS + JavaScript vanilla                 ║
║  versión   : v1.1.0 release candidate                        ║
║  estado    : [READY FOR MAIN]                                ║
╚══════════════════════════════════════════════════════════════╝
```

> Restricción: descubrir juegos de Nintendo puede ser abrumador para alguien que empieza desde cero. · Autoría: Inti, para Adri. · Setup: servidor HTTP local. · Extensión: catálogo Nintendo, recomendaciones, colección y chat.

H.E.A.R.T.A.G.R.A.M. es una experiencia personal para acompañar la llegada de una Nintendo Switch 2 restaurada y preparada para Adri. Combina onboarding beginner-first, descubrimiento de juegos, perfil, recomendaciones, colección y asistencia conversacional.

**Flujo actual:**

```text
Inicio → Inicia aquí → Test → Perfil → Descubrir → Explorar → Mi lista → Chat → Mi regalo
```

## ⟦ EL NOMBRE ⟧

| Letra | Significado |
| --- | --- |
| **H** | Hyrule — la consola llega alrededor de Zelda |
| **E** | Experience — no es una tienda, es una bienvenida |
| **A** | Adventure — lo que viene después |
| **R** | Recommendation — el motor de afinidad |
| **T** | Tool — una experiencia que sigue siendo útil después del regalo |

El nombre del proyecto se conserva como H.E.A.R.T.A.G.R.A.M.; la interfaz presenta títulos funcionales como **Inicio** e **Inicia aquí**.

── ⋆⋅✦⋅⋆ ──

## ⟦ FEATURES · v1.1 ⟧

- **Inicia aquí:** guía beginner-first con 17 pasos, cuatro capítulos y progreso persistente en `localStorage`.
- **Test de perfil:** 12 preguntas situacionales y ocho arquetipos.
- **Recomendaciones explicadas:** afinidad, tolerancia al horror, moods y una opción fuera de la zona habitual.
- **Para jugar con Inti:** prioriza juegos compatibles con juego online, en el mismo cuarto o en una consola cuando los datos están disponibles.
- **Explorar:** Nintendo Store México es la fuente principal visible del navegador.
- **318 productos oficiales adaptados:** el catálogo Nintendo se normaliza al contrato interno de la aplicación.
- **Rollback explícito:** `?catalog=igdb` conserva IGDB como fuente heredada para comprobación y recuperación.
- **Detalle editorial Nintendo:** portada, descripción, precio, lanzamiento, jugadores, publisher, developer, demo y características cuando existen en los datos.
- **Mi lista:** separa **Me interesa** de **Mi biblioteca** y persiste el estado en el dispositivo.
- **Chat:** asistente con Gemini, historial local y contexto limitado al perfil y la colección; la clave permanece fuera del cliente.
- **Mi regalo:** acceso a la guía de canje y al grupo familiar sin almacenar códigos reales en Git.
- **App shell responsive:** navegación lateral en escritorio y cinco destinos principales en móvil.

## ⟦ FUENTES Y PRIVACIDAD ⟧

- Nintendo Store México es el catálogo predeterminado del navegador.
- IGDB permanece disponible únicamente mediante `?catalog=igdb` como rollback explícito.
- El test, el progreso de **Inicia aquí**, Me interesa, Mi biblioteca y el historial del chat se guardan localmente en el navegador.
- Al enviar un mensaje al chat, se comparte con Gemini el contexto de juegos necesario y el historial reciente.
- Ningún código de Nintendo eShop debe almacenarse en el repositorio, HTML, JavaScript, datos de prueba o documentación.

## ⟦ ESTRUCTURA ACTUAL ⟧

```text
heartagram/
├── index.html
├── css/
│   ├── base.css
│   ├── shell.css
│   ├── theme.css
│   ├── theme-romance.css
│   ├── tokens.css
│   ├── visual-system.css
│   └── screens/
│       ├── catalog.css
│       ├── collection.css
│       ├── getting-started.css
│       ├── home.css
│       └── nintendo-product-detail.css
├── js/
│   ├── main.js
│   ├── app-shell.js
│   ├── catalog.js
│   ├── nintendo-catalog.js
│   ├── nintendo-product-detail.js
│   ├── getting-started.js
│   ├── recommender.js
│   ├── library.js
│   └── ai-assistant-ui.js
├── data/
│   ├── games.json
│   ├── questions.json
│   ├── archetypes.json
│   ├── nintendo_catalog.json
│   ├── nintendo_catalog_meta.json
│   └── nintendo_catalog_extras.json
├── scripts/
├── tests/
├── docs/
│   ├── SPECS_v0.2.md
│   ├── ROADMAP.md
│   ├── TEST_DESIGN.md
│   ├── NINTENDO_PRODUCT_SCHEMA.md
│   └── HEARTAGRAM_VISUAL_PROTOCOL.md
├── CODESTYLE.md
├── package.json
└── README.md
```

## ⟦ INSTALACIÓN LOCAL ⟧

```powershell
git clone https://github.com/NamelessVamp/heartagram.git
cd heartagram
python -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
```

El entorno virtual se usa para scripts auxiliares. La aplicación principal es web estática.

## ⟦ USO LOCAL ⟧

```powershell
python -m http.server 8000
```

Después abre `http://localhost:8000/`. No abras `index.html` con doble clic porque el navegador puede bloquear la carga de archivos JSON mediante `fetch`.

Para comprobar el rollback heredado:

```text
http://localhost:8000/?catalog=igdb
```

## ⟦ VALIDACIÓN ⟧

Ejecuta la suite completa antes de cada release:

```powershell
npm test
git diff --check
```

Validaciones específicas disponibles:

```powershell
node .\tests\catalog-source-qa.mjs
node .\tests\nintendo-catalog-qa.mjs
node .\tests\nintendo-product-detail-qa.mjs
node .\tests\getting-started-qa.mjs
node .\tests\app-shell-qa.mjs
```

La suite cubre perfiles simulados, favoritos, biblioteca, contexto de IA, navegación, Inicio, Descubrir, Explorar, Mi lista, chat, catálogo Nintendo, detalle editorial, fuente principal y **Inicia aquí**.

## ⟦ MANTENIMIENTO DEL CATÁLOGO ⟧

- `data/games.json` conserva el catálogo curado usado por el motor de recomendaciones.
- `data/nintendo_catalog.json` alimenta la experiencia oficial visible de Explorar.
- Los scripts de `scripts/` inspeccionan, publican, sincronizan y validan el snapshot Nintendo.
- Las modificaciones al contrato Nintendo deben mantenerse alineadas con `docs/NINTENDO_PRODUCT_SCHEMA.md` y sus pruebas.
- No añadas precios, descripciones o capacidades inventadas cuando la fuente no incluya esos datos.

## ⟦ PUBLICACIÓN ⟧

La publicación objetivo usa GitHub Pages desde `main`, carpeta raíz. La rama actual de preparación es `release/v1.1-nintendo-primary`.

Antes de integrar en `main`:

```powershell
npm test
git diff --check
git status
```

Los códigos Nintendo eShop reales se entregan por separado y nunca deben formar parte del repositorio público.

## ⟦ ESTADO DE RELEASE ⟧

### Completado en v1.1

- [x] Nintendo Store México como catálogo principal.
- [x] IGDB como rollback explícito.
- [x] Detalle editorial Nintendo.
- [x] Me interesa y Mi biblioteca.
- [x] App shell responsive.
- [x] Chat con Gemini e historial local.
- [x] Inicia aquí con 17 pasos y progreso persistente.
- [x] QA automatizado completo.
- [x] Validación visual en escritorio.

### Pendiente para la entrega

- [ ] Integrar los códigos eShop finales sin exponerlos en Git.
- [ ] Confirmar la URL pública definitiva.
- [ ] Probar la release final desde móvil.
- [ ] Grabar el sticker NFC con la URL final.
- [ ] Restaurar y preparar físicamente la Nintendo Switch 2.
- [ ] Entregar el regalo.

## ⟦ DECISIONES ⟧

| Decisión | Motivo |
| --- | --- |
| JavaScript vanilla | Sitio pequeño, sin build obligatorio y fácil de mantener |
| Nintendo principal | La experiencia visible utiliza el catálogo oficial procesado para México |
| IGDB como rollback | Conserva una ruta de recuperación y pruebas heredadas sin dominar la experiencia |
| Dos catálogos | El catálogo curado alimenta afinidad; Nintendo alimenta Explorar y el detalle comercial |
| IA limitada al chat | Las recomendaciones principales siguen siendo deterministas y verificables |
| Progreso local | La guía y la colección funcionan sin crear una cuenta dentro de HEARTAGRAM |
| Repo personal | Proyecto personal, fuera de Emerson |

```text
// H.E.A.R.T.A.G.R.A.M. :: hecho para alguien en específico
```

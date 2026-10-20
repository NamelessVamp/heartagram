from pathlib import Path
from datetime import datetime, timezone
import shutil

ROOT = Path(__file__).resolve().parent
STAMP = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
BACKUP = ROOT / 'data' / 'release_docs_backups' / f'v110-docs-{STAMP}'

README = r'''# H.E.A.R.T.A.G.R.A.M.

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
'''

ROADMAP = r'''# H.E.A.R.T.A.G.R.A.M. — ROADMAP

```text
╔══════════════════════════════════════════════════════════════╗
║  H.E.A.R.T.A.G.R.A.M. :: ROADMAP                            ║
║  ──────────────────────────────────────────────────────────  ║
║  baseline  : SPECS v0.2                                     ║
║  release   : v1.1.0                                         ║
║  objetivo  : 29 oct 2026                                    ║
║  estado    : [RELEASE CANDIDATE]                            ║
╚══════════════════════════════════════════════════════════════╝
```

La release v1.1 convierte HEARTAGRAM en un companion beginner-first para una Nintendo Switch 2 restaurada y preparada para Adri. El código de la rama `release/v1.1-nintendo-primary` está validado; quedan actividades de entrega, publicación e integración en `main`.

## ⟦ DECISIONES CERRADAS ⟧

| Tema | Decisión |
| --- | --- |
| Nombre del proyecto | H.E.A.R.T.A.G.R.A.M. |
| Nombre de onboarding | Inicia aquí |
| Consola | Nintendo Switch 2 restaurada y preparada para Adri |
| Grupo familiar | Inti administra la invitación |
| Códigos eShop | Se entregan por separado; nunca en claro dentro del repositorio |
| Catálogo visible | Nintendo Store México |
| Rollback | IGDB mediante `?catalog=igdb` |
| Colección | Me interesa y Mi biblioteca son estados separados |
| Chat | Gemini con clave fuera del cliente e historial local |
| Navegación móvil | Cinco destinos principales; Inicia aquí permanece accesible desde Inicio, sidebar y Mi regalo |

## ⟦ FASE 0 — DISEÑO Y BASE TÉCNICA ⟧

- [x] SPECS v0.2.
- [x] ROADMAP inicial.
- [x] CODESTYLE.
- [x] Diseño de 12 preguntas.
- [x] Ocho arquetipos.
- [x] Catálogo curado inicial.
- [x] Repositorio y estructura web estática.

## ⟦ FASE 1 — EXPERIENCIA PRINCIPAL ⟧

- [x] Intro e Inicio.
- [x] Motor del test.
- [x] Cálculo de perfil y gráfica radar.
- [x] Motor de recomendaciones.
- [x] Afinidad, tolerancia al horror y salida de zona.
- [x] Recomendaciones para jugar con Inti.
- [x] App shell responsive.
- [x] Navegación Inicio, Descubrir, Explorar, Mi lista y Chat.
- [x] Mi perfil y Mi regalo como destinos secundarios.

## ⟦ FASE 2 — COLECCIÓN Y ASISTENTE ⟧

- [x] Favoritos persistentes.
- [x] Mi lista dividida entre Me interesa y Mi biblioteca.
- [x] Exclusión de juegos propios desde Me interesa.
- [x] Chat con Gemini.
- [x] Historial de conversaciones en el navegador.
- [x] Contexto de IA limitado al perfil y la colección.
- [x] Clave de Gemini fuera del cliente.

## ⟦ FASE 3 — NINTENDO STORE MÉXICO ⟧

- [x] Probar y extraer información de Nintendo Store México.
- [x] Construir snapshot combinado.
- [x] Normalizar y enriquecer productos.
- [x] Adaptar 318 productos oficiales al contrato del catálogo.
- [x] Crear `NINTENDO_PRODUCT_SCHEMA.md`.
- [x] Crear vista editorial dedicada para productos Nintendo.
- [x] Validar metadata enriquecida contra el contrato del modal.
- [x] Convertir Nintendo en la fuente predeterminada del navegador.
- [x] Conservar IGDB mediante `?catalog=igdb`.
- [x] Mantener IGDB como runtime heredado de pruebas Node.
- [x] Añadir QA de fuente principal y rollback.

## ⟦ FASE 4 — INICIA AQUÍ ⟧

- [x] Diseñar experiencia beginner-first.
- [x] Reflejar el regalo real: consola restaurada, mica, funda, Joy-Con 2, dock y cables originales.
- [x] Explicar que no incluye microSD Express.
- [x] Crear cuatro capítulos y 17 pasos marcables.
- [x] Configuración inicial, cuenta Nintendo, actualizaciones y cuidados.
- [x] Nintendo Switch Online familiar y canje seguro.
- [x] Persistir progreso en `localStorage`.
- [x] Añadir acceso desde sidebar y Mi regalo.
- [x] Mantener cinco destinos principales en navegación móvil.
- [x] Añadir QA automatizado.
- [x] Validar visualmente progreso, acordeones y responsive.

## ⟦ FASE 5 — QA Y RELEASE v1.1 ⟧

- [x] QA con perfiles horror, cozy, competitivo y probable Adri.
- [x] QA de favoritos mixtos.
- [x] QA de biblioteca.
- [x] QA de contexto IA.
- [x] QA del app shell.
- [x] QA de Inicio, Descubrir, Explorar y Mi lista.
- [x] QA del catálogo Nintendo y detalle editorial.
- [x] QA de Nintendo como fuente principal.
- [x] QA de Inicia aquí.
- [x] `npm test` completo.
- [x] `git diff --check` limpio.
- [x] Backups locales excluidos mediante `.gitignore`.
- [x] Rama `release/v1.1-nintendo-primary` sincronizada con origin.
- [ ] Actualizar README y ROADMAP para v1.1.
- [ ] Integrar la rama de release en `main`.
- [ ] Crear tag `v1.1.0`.
- [ ] Publicar y probar la versión final desde `main`.

## ⟦ FASE 6 — PREPARACIÓN FÍSICA Y ENTREGA ⟧

- [ ] Restaurar la Nintendo Switch 2 a configuración de fábrica antes de entregarla.
- [ ] Limpiar consola, Joy-Con 2, dock y cables.
- [ ] Revisar la mica y colocar todo dentro de la funda o empaque acordado.
- [ ] Confirmar que no se entrega una microSD Express.
- [ ] Obtener los códigos Nintendo eShop definitivos.
- [ ] Entregar los códigos por separado sin almacenarlos en Git.
- [ ] Confirmar la URL pública final.
- [ ] Grabar el sticker NFC con la URL final.
- [ ] Probar la experiencia completa desde el móvil que usará Adri.
- [ ] Verificar invitación al grupo familiar de Nintendo Switch Online.
- [ ] Entregar el regalo.

## ⟦ POST-ENTREGA ⟧

### v1.1.x — mantenimiento

- [ ] Corregir defectos observados durante la configuración real.
- [ ] Revisar productos Nintendo incompletos o sin metadata enriquecida.
- [ ] Añadir favicon y metadatos de publicación.
- [ ] Revisar accesibilidad con teclado y lector de pantalla.

### v1.2 — experiencia viva

- [ ] Sincronización controlada de nuevos snapshots Nintendo.
- [ ] Mejorar filtros y ordenamiento con campos Nintendo confirmados.
- [ ] Añadir feedback explícito a recomendaciones sin convertirlo en scoring opaco.
- [ ] Evaluar alertas de descuento compatibles con privacidad y términos de la fuente.

## ⟦ RIESGOS ACTIVOS ⟧

| Riesgo | Mitigación |
| --- | --- |
| Código eShop expuesto | Entregar códigos por separado y mantenerlos fuera de Git, HTML y JavaScript |
| Estado local perdido | Explicar que perfil, colección, guía e historial viven en el navegador actual |
| Producto Nintendo incompleto | Mostrar únicamente campos presentes; no inventar precio, modo o disponibilidad |
| Regresión al integrar en main | Ejecutar `npm test`, `git diff --check` y smoke test desde `main` |
| Experiencia móvil no representativa | Probar la URL final en el dispositivo que usará Adri |
| Sorpresa publicada antes de tiempo | No compartir la URL pública hasta decidir la entrega |

```text
[RELEASE CANDIDATE] v1.1 :: siguiente → documentación, merge, tag y smoke test final
```
'''

for relative in ('README.md', 'docs/ROADMAP.md'):
    source = ROOT / relative
    if not source.exists():
        raise SystemExit(f'[FAIL] No se encontró {relative}')
    target = BACKUP / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)

(ROOT / 'README.md').write_text(README, encoding='utf-8', newline='\n')
(ROOT / 'docs' / 'ROADMAP.md').write_text(ROADMAP, encoding='utf-8', newline='\n')

print('[OK] README.md actualizado para v1.1.0')
print('[OK] docs/ROADMAP.md actualizado al estado release candidate')
print(f'[SAFE] Backup local: {BACKUP.relative_to(ROOT)}')
print('[NEXT] Excluye data/release_docs_backups/ en .gitignore antes del commit')

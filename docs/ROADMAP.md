# H.E.A.R.T.A.G.R.A.M. — ROADMAP

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
| Navegación móvil | Cinco destinos principales; Inicia aquí se abre desde el sidebar en escritorio y desde Mi regalo en móvil |

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
- [x] Actualizar README y ROADMAP para v1.1.
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

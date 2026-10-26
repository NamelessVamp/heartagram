# H.E.A.R.T.A.G.R.A.M. — CODESTYLE.md

```
╔══════════════════════════════════════════════════════════════╗
║  H.E.A.R.T.A.G.R.A.M. :: CODESTYLE                                     ║
║  ─────────────────────────────────────────────────────────── ║
║  aplica a  : HTML · CSS · JS · JSON · Python (scripts)       ║
║  idioma    : código en inglés · contenido visible en español ║
║  status    : [OK] v1                                         ║
╚══════════════════════════════════════════════════════════════╝
```

── ⋆⋅✦⋅⋆ ──

## ⟦ 1. REGLAS GENERALES ⟧

- **Código en inglés:** variables, funciones, archivos, commits y comentarios técnicos.
- **Contenido en español:** todo lo que ve Adriana. Los términos de juegos en inglés se respetan (*co-op*, *roguelike*, *F2P*).
- **Production-ready:** nada de código muerto, `console.log` de prueba ni TODOs sin dueño.
- **Depurable:** funciones cortas, una responsabilidad, nombres que expliquen.
- **Comentarios solo cuando hagan falta:** explican el *por qué*, no el *qué*.
- **Emojis con moderación en la UI:** emojis relevantes, símbolos (`✦ ♡ ◈ →`) y micro-ASCII le dan vida a la interfaz sin saturarla. Sin emojis en código ni commits.

── ⋆⋅✦⋅⋆ ──

## ⟦ 2. SEGURIDAD ⟧ [BLOCKER]

- **Ningún código eShop en el repo, HTML, JS ni JSON.** Ni de prueba.
- **Sin credenciales en el runtime.** La versión pública es completamente estática.
- Datos de Adriana solo en `localStorage`. Nada se envía a terceros en v1.
- `.gitignore` incluye `.venv/`, `.env`, `*.secret`, `secrets/`.

── ⋆⋅✦⋅⋆ ──

## ⟦ 3. JAVASCRIPT ⟧

- ES modules (`import` / `export`). Sin frameworks ni dependencias en v1.
- `const` por defecto; `let` solo si se reasigna; nunca `var`.
- Nombres:
  - variables y funciones: `camelCase`
  - constantes: `UPPER_SNAKE_CASE`
  - archivos: `kebab-case.js`
- Funciones puras en la lógica (`profile.js`, `recommender.js`, `recommend-v2.js`, `catalog.js`, `nintendo-catalog.js`): reciben datos y regresan datos, sin tocar el DOM.
- El DOM se manipula en `main.js`, `ui.js` y los módulos de cada pantalla (`*-ui.js`, `home-dashboard.js`, `bouquet.js`, etc.).
- Sin números mágicos: pesos y umbrales en un objeto de configuración.

```js
// recommender.js

const WEIGHTS = {
  ARCHETYPE_BONUS: 0.10,
  VIBES_BONUS: 0.10,
  HORROR_PENALTY: 0.25,
};

/**
 * Ranks games by similarity to the user profile.
 * Horror above the user's tolerance is penalized, not removed,
 * so curious users can still discover it.
 */
export function rankGames(profile, games) {
  return games
    .filter((game) => game.status === "VERIFICADO")
    .map((game) => ({ game, score: scoreGame(profile, game) }))
    .sort((a, b) => b.score - a.score);
}
```

── ⋆⋅✦⋅⋆ ──

## ⟦ 4. CSS ⟧

- Variables en `:root` para colores, espacios y tipografía. Nunca hex sueltos.
- Mobile-first: estilos base para celular, `@media (min-width: ...)` para pantallas grandes.
- Clases en `kebab-case`, con prefijo por bloque (`card-`, `badge-`, `quiz-`).
- Contraste AA mínimo. Texto base ≥ 16 px.
- Respetar `prefers-reduced-motion`: sin grano animado ni transiciones fuertes si está activo.
- **Sin iconografía religiosa** en la UI.

```css
:root {
  --color-bg: #0d0b0a;
  --color-text: #e8e0d4;
  --color-accent: #8c6a4a;   /* sepia apagado */
  --grain-opacity: 0.06;
}
```

── ⋆⋅✦⋅⋆ ──

## ⟦ 5. HTML ⟧

- Semántico: `<main>`, `<section>`, `<button>`; nunca `<div>` con `onclick`.
- Toda imagen con `alt` en español.
- Opciones del test navegables con teclado.
- `lang="es"` en `<html>`.

── ⋆⋅✦⋅⋆ ──

## ⟦ 6. JSON ⟧

- Claves en `snake_case`, en inglés.
- Tags en `UPPER_SNAKE_CASE`, solo los definidos en `SPECS.md`.
- `id` en `kebab-case`, único.
- Campos no confirmados = `"VERIFICAR"` o `null`, nunca un valor inventado.
- Precios en MXN como número entero, siempre con `price_checked` (`YYYY-MM-DD`).

── ⋆⋅✦⋅⋆ ──

## ⟦ 7. PYTHON (scripts) ⟧

- Siempre dentro de `.venv`.
- PEP 8, type hints, `pathlib` para rutas (sin rutas hardcodeadas).
- Mensajes de salida con micro-etiquetas: `[OK]`, `[WARN]`, `[FAIL]`.
- Código de salida distinto de 0 si la validación falla.

── ⋆⋅✦⋅⋆ ──

## ⟦ 8. GIT ⟧

- Rama principal: `main`. Features en `feat/<nombre>`.
- Commits en inglés, imperativo, con prefijo:
  - `feat:` nueva funcionalidad
  - `fix:` corrección
  - `data:` cambios en el catálogo
  - `style:` UI / CSS
  - `docs:` documentación
- Ejemplo: `data: add 12 horror games with verified MXN prices`
- Antes de cada push: correr `validate_catalog.py`.

── ⋆⋅✦⋅⋆ ──

## ⟦ 9. CHECKLIST ANTES DE PUBLICAR ⟧

- [ ] `validate_catalog.py` en `[OK]`
- [ ] Ningún juego mostrado con `status: VERIFICAR`
- [ ] Búsqueda en el repo de códigos o keys: sin resultados
- [ ] Prueba completa desde el celular
- [ ] 4 perfiles de QA con el resultado esperado

```
[OK] CODESTYLE v1
```

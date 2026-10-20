# H.E.A.R.T.A.G.R.A.M.

HEARTAGRAM es una experiencia estática de Nintendo Switch 2 creada para Adri. Ayuda a comenzar desde cero, descubrir juegos, guardar intereses y separar la colección propia.

## Funciones

- **Inicia aquí:** guía beginner-first de 17 pasos con progreso local.
- **Perfil:** 12 preguntas y ocho arquetipos.
- **Descubrir:** recomendaciones deterministas desde `data/games.json`.
- **Explorar:** catálogo Nintendo Store México procesado en `data/nintendo_catalog.json`.
- **Mi lista:** Me interesa y Mi biblioteca, guardadas en `localStorage`.
- **Mi regalo:** instrucciones de canje y acceso al grupo familiar.

La aplicación no utiliza IA, backend propio, credenciales ni catálogo heredado. Los códigos Nintendo eShop reales nunca se guardan en Git.

## Ejecución local

```powershell
python -m http.server 8000
```

Abre `http://localhost:8000/`.

## Validación

```powershell
npm test
git diff --check
```

## Publicación

El sitio está preparado para GitHub Pages desde la raíz de `main`. El repositorio debe ser público para usar Pages con GitHub Free.

## Datos

- `data/games.json`: catálogo curado para recomendaciones.
- `data/nintendo_catalog.json`: catálogo visible en Explorar.
- `data/nintendo_catalog_meta.json` y `data/nintendo_catalog_extras.json`: soporte del pipeline Nintendo.

## Privacidad

El perfil, el progreso y las colecciones permanecen en el navegador. No se envían a un servidor de HEARTAGRAM.

# H.E.A.R.T.A.G.R.A.M.

HEARTAGRAM es una experiencia web estática para la primera Nintendo Switch 2 de Adri. Le ayuda a empezar desde cero, conocer su perfil de jugadora, descubrir juegos y llevar su colección.

**Sitio:** https://namelessvamp.github.io/heartagram/

## Funciones

- **Inicia aquí:** guía de 17 pasos para configurar la consola, con progreso guardado.
- **Test y perfil:** 12 preguntas, 8 arquetipos y una carta coleccionable con radar y rasgos.
- **Descubrir:** recomendaciones por pestañas (Para ti, Moods, Jugar con Inti y Sal de tu zona), con rotación diaria y el botón "Otras opciones".
- **Explorar:** catálogo de Nintendo Store México con búsqueda, filtros y detalle de cada juego.
- **Mi lista:** Me interesa y Mi biblioteca, guardadas en el navegador.
- **Mi regalo:** instrucciones de canje y del grupo familiar.

## Motor de recomendaciones

No usa IA ni servidor. Combina el catálogo curado (`data/games.json`) con los productos de Nintendo Store México, traducidos a las seis dimensiones del perfil. Agrega variedad por saga y género, rotación diaria, excluye lo que ya está en Mi biblioteca y toma en cuenta lo que está en Me interesa.

## Estilo visual: Midnight Bouquet

Noche azul medianoche, luna, mariposas, flores, cristales y una ventana con gato. Los motivos (zorro, pluma, flor espiritual, murciélago, gema, rosa, luna, estrella y nota) son formas propias inspiradas en los personajes favoritos de Adri. No usa arte oficial de ningún personaje.

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

## Estructura

- `css/tokens.css` → `base` → `layout` → `components` → `screens/*` → `theme-bouquet.css`, ordenados con `@layer` y sin `!important`.
- `js/main.js`: estado y navegación.
- `js/recommend-v2.js`: motor de recomendaciones.
- `js/bouquet.js`: decoraciones visuales.
- `data/`: catálogo curado, catálogo Nintendo, preguntas y arquetipos.

## Privacidad

El perfil, el progreso y las listas se quedan en el navegador. Los códigos de Nintendo eShop nunca se guardan en el repositorio.

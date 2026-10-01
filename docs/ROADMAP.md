# H.E.A.R.T.A.G.R.A.M. — ROADMAP.md

```
╔══════════════════════════════════════════════════════════════╗
║  H.E.A.R.T.A.G.R.A.M. :: ROADMAP                                       ║
║  ─────────────────────────────────────────────────────────── ║
║  fuente    : SPECS v0.2                                      ║
║  deadline  : 29 oct 2026 (llegada de la Switch 2 nueva)      ║
║  status    : [INIT]                                          ║
╚══════════════════════════════════════════════════════════════╝
```

── ⋆⋅✦⋅⋆ ──

## ⟦ DECISIONES CERRADAS ⟧

| Tema | Decisión |
|---|---|
| Nombre | H.E.A.R.T.A.G.R.A.M. (provisional hasta que haya uno mejor) |
| Grupo familiar | Inti es el administrador |
| Regalo | $1,500 MXN en código eShop; integración en la página por definir |
| Test | Adriana lo puede hacer sola o con Inti |
| NFC | Sí, sticker en la caja; se hace al final |

**Implicación del test:** las preguntas se escriben en segunda persona dirigidas a ella y deben funcionar igual si Inti está presente o no. Sin preguntas que requieran que Inti responda.

**Implicación del código:** si se muestra en la página, solo con reveal cifrado (frase-clave → descifrado en el navegador). Nunca en claro en el repo ni en el HTML.

── ⋆⋅✦⋅⋆ ──

## ⟦ FASE 0 — DISEÑO ⟧ (sem 1 · 1–7 oct) · se puede hacer desde la laptop de Emerson

- [x] SPECS v0.2
- [x] ROADMAP
- [ ] Diseño del test: 10–12 preguntas, opciones y pesos por dimensión y arquetipo
- [ ] Definir los arquetipos finales (nombre + descripción + estética)
- [ ] Lista semilla del catálogo: 50 juegos (sin precios aún)
- [ ] README.md
- [ ] CODESTYLE.md

## ⟦ FASE 1 — CATÁLOGO ⟧ (sem 2 · 8–14 oct) · PC personal

- [ ] Inti comparte su biblioteca → poblar `INTI_LIBRARY_MATCH`
- [ ] Verificar en eShop MX: disponibilidad + precio + fecha (`status: VERIFICADO`)
- [ ] Verificar multiplayer por juego: online / local inalámbrico / misma consola / NSO
- [ ] Verificar GameShare en los juegos candidatos a Duo Pack
- [ ] Tags capas 3–6 para los 50 juegos
- [ ] `games.json` y `questions.json` v1
- [ ] Ampliar a 100+ juegos si el tiempo alcanza

## ⟦ FASE 2 — BUILD v1 ⟧ (sem 3 · 15–21 oct) · PC personal

- [ ] Repo en GitHub personal + `.venv` no aplica (proyecto web estático)
- [ ] Estructura: `index.html`, `/css`, `/js`, `/data`
- [ ] Intro
- [ ] Motor del test (lee `questions.json`, calcula vector + arquetipos)
- [ ] Pantalla de perfil + gráfica radar
- [ ] Motor de recomendación (coseno + bonus + penalización por horror)
- [ ] Bloques: Para empezar / Te podrían atrapar / Sal de tu zona
- [ ] Sección "Para jugar con Inti" con insignias ONLINE · MISMO CUARTO · UNA CONSOLA
- [ ] 3 carritos ≤ $1,500 (mínimo 1 Duo Pack)
- [ ] Tutorial del grupo familiar
- [ ] Placeholder de la sección del regalo
- [ ] Publicar en GitHub Pages (sin compartir el enlace)

## ⟦ FASE 3 — UI + QA ⟧ (sem 4 · 22–27 oct)

- [ ] Estética goth / horror atmosférico (sin jumpscares)
- [ ] Mobile-first, contraste AA
- [ ] QA con 4 perfiles simulados (horror, cozy, competitiva, perfil probable de Adriana)
- [ ] Revisar que ningún carrito pase de $1,500
- [ ] Revisar que no haya códigos en el repo ni en el HTML
- [ ] Prueba completa desde el celular

## ⟦ FASE 4 — ENTREGA ⟧ (28–29 oct)

- [ ] Integrar el código de $1,500 (reveal cifrado u otro método elegido)
- [ ] Grabar el sticker NFC con la URL
- [ ] Checklist de traspaso de la consola (SPECS §10)
- [ ] Revalidar precios de los juegos recomendados
- [ ] Entrega

── ⋆⋅✦⋅⋆ ──

## ⟦ POST-ENTREGA ⟧

### v2 — Datos vivos
- [ ] Investigar fuente de precios MXN (eShop / DekuDeals / IGDB / RAWG) y sus términos de uso
- [ ] Cloudflare Worker para precios, descuentos y portadas
- [ ] Alertas de descuento en juegos de su lista

### v3 — Agente
- [ ] Agente Gemini vía Worker (API key fuera del cliente)
- [ ] Solo recomienda del catálogo verificado
- [ ] Feedback me gustó / no me gustó en `localStorage`

── ⋆⋅✦⋅⋆ ──

## ⟦ RIESGOS ⟧

| Riesgo | Mitigación |
|---|---|
| Sin fuente de precios MXN | v1 con precios manuales + fecha de verificación |
| Poco tiempo para 150+ juegos | v1 sale con 50 bien curados; se amplía después |
| Repo público rompe la sorpresa | No compartir el enlace; nada sensible en el repo |
| Bloqueo de sitios de juegos en la laptop de Emerson | Fases 1–4 solo en PC personal |

```
[INIT] ROADMAP v1 :: siguiente → diseño del test
```

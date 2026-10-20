from pathlib import Path
from datetime import datetime, timezone
import json, shutil

ROOT = Path(__file__).resolve().parent
STAMP = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
BACKUP = ROOT / 'data' / 'getting_started_backups' / f'getting-started-{STAMP}'


def stop(msg):
    raise SystemExit(f'[FAIL] {msg}')


def read(name):
    path = ROOT / name
    if not path.exists(): stop(f'No se encontro {name}')
    return path.read_text(encoding='utf-8')


def write(name, text):
    path = ROOT / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding='utf-8', newline='\n')


def once(text, old, new, label):
    count = text.count(old)
    if count != 1: stop(f'{label}: se esperaba 1 coincidencia y se encontraron {count}')
    return text.replace(old, new, 1)

for name in ['index.html','js/main.js','js/app-shell.js','tests/app-shell-qa.mjs','package.json']:
    source = ROOT / name
    if not source.exists(): stop(f'No se encontro {name}')
    target = BACKUP / name
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)

js = '''const STORAGE_KEY = "heartagram:getting-started-progress:v1";
export const GETTING_STARTED_STEPS = ["check-console","place-console","connect-power","choose-language","connect-wifi","create-user","link-account","update-console","update-controllers","adjust-display","adjust-sleep","join-family","learn-home","open-eshop","redeem-code","download-game","protect-console"];
export function normalizeGettingStartedProgress(value) { if (!Array.isArray(value)) return []; const valid = new Set(GETTING_STARTED_STEPS); return [...new Set(value.filter((step) => valid.has(step)))]; }
export function readGettingStartedProgress(storage = window.localStorage) { try { return normalizeGettingStartedProgress(JSON.parse(storage.getItem(STORAGE_KEY) ?? "[]")); } catch { return []; } }
export function writeGettingStartedProgress(steps, storage = window.localStorage) { const clean = normalizeGettingStartedProgress(steps); try { storage.setItem(STORAGE_KEY, JSON.stringify(clean)); } catch {} return clean; }
function renderProgress(root, completed) { const count = completed.size; const total = GETTING_STARTED_STEPS.length; const bar = root.querySelector("[data-guide-bar]"); const label = root.querySelector("[data-guide-label]"); if (bar) { bar.style.width = `${Math.round(count / total * 100)}%`; bar.parentElement?.setAttribute("aria-valuenow", String(count)); } if (label) label.textContent = count === total ? "Todo listo. Ya puedes empezar a jugar." : `${count} de ${total} pasos completados`; root.classList.toggle("is-complete", count === total); }
export function initializeGettingStarted() { const root = document.querySelector('[data-screen="getting-started"]'); if (!root || root.dataset.initialized === "true") return; const completed = new Set(readGettingStartedProgress()); const checks = [...root.querySelectorAll("[data-guide-step]")]; checks.forEach((check) => { check.checked = completed.has(check.dataset.guideStep); check.addEventListener("change", () => { check.checked ? completed.add(check.dataset.guideStep) : completed.delete(check.dataset.guideStep); writeGettingStartedProgress([...completed]); renderProgress(root, completed); }); }); root.querySelector("[data-guide-reset]")?.addEventListener("click", () => { if (!window.confirm("¿Quieres desmarcar todos los pasos?")) return; completed.clear(); checks.forEach((check) => { check.checked = false; }); writeGettingStartedProgress([]); renderProgress(root, completed); }); renderProgress(root, completed); root.dataset.initialized = "true"; }
'''

css = '''.getting-started-screen{display:grid;gap:clamp(1.5rem,4vw,3rem)}.guide-hero{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(17rem,.8fr);gap:2rem;align-items:end;padding:clamp(1.5rem,4vw,3.4rem);border:1px solid var(--shell-border-strong);border-radius:1.5rem;background:radial-gradient(circle at 85% 15%,rgb(210 47 121/.2),transparent 34%),linear-gradient(145deg,rgb(25 16 23/.98),rgb(8 6 8/.98))}.guide-kicker,.guide-number{color:var(--shell-accent-soft);font:700 .72rem ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase}.guide-title{max-width:9ch;margin:.35rem 0 .8rem;color:var(--shell-text);font:400 clamp(3rem,8vw,7rem)/.88 Georgia,serif}.guide-lead,.guide-progress p,.guide-card span,.guide-step p{color:var(--shell-text-muted);line-height:1.6}.guide-progress,.guide-card,.guide-note{padding:1.15rem;border:1px solid var(--shell-border);border-radius:1rem;background:rgb(255 255 255/.025)}.guide-track{height:.45rem;margin:.8rem 0;overflow:hidden;border-radius:999px;background:rgb(255 255 255/.08)}.guide-bar{width:0;height:100%;background:linear-gradient(90deg,#d22f79,#ff9fc9);transition:width .18s ease}.guide-inventory{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem}.guide-card strong{display:block;margin-bottom:.35rem;color:var(--shell-text)}.guide-chapters{display:grid;gap:1rem}.guide-chapter{overflow:hidden;border:1px solid var(--shell-border);border-radius:1.25rem;background:rgb(10 7 10/.82)}.guide-chapter>summary{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:1rem;align-items:center;padding:1.25rem;cursor:pointer;list-style:none}.guide-chapter>summary::-webkit-details-marker{display:none}.guide-chapter>summary:after{content:"+";color:var(--shell-accent-soft);font-size:1.5rem}.guide-chapter[open]>summary:after{content:"−"}.guide-chapter h3{margin:0;color:var(--shell-text);font:400 clamp(1.3rem,3vw,2rem) Georgia,serif}.guide-chapter summary p{margin:.3rem 0 0;color:var(--shell-text-muted)}.guide-body{padding:0 1.25rem 1.25rem}.guide-step{display:grid;grid-template-columns:auto minmax(0,1fr);gap:.85rem;padding:1rem 0;border-top:1px solid rgb(210 47 121/.34)}.guide-step input{width:1.15rem;height:1.15rem;margin-top:.2rem;accent-color:#d22f79}.guide-step strong{color:var(--shell-text)}.guide-step p{margin:.3rem 0 0}.guide-warning{margin-top:.65rem;padding:.8rem 1rem;border-left:2px solid #e2b84b;background:rgb(226 184 75/.08);color:var(--shell-text-muted)}.guide-footer{display:flex;justify-content:space-between;gap:1rem;align-items:center}.is-complete .guide-progress{border-color:#ff9fc9}@media(max-width:48rem){.guide-hero{grid-template-columns:1fr}.guide-inventory{grid-template-columns:1fr}.guide-chapter>summary{grid-template-columns:1fr auto}.guide-number{grid-column:1/-1}.guide-footer{align-items:stretch;flex-direction:column}}'''

steps = [
('01','Prepara tu consola','Revisa las piezas, colócala bien y enciéndela.',[
('check-console','Comprueba lo que viene en el regalo','Localiza la consola, los dos Joy-Con 2, la funda, el dock, el cargador y los cables. La mica ya protege la pantalla.'),
('place-console','Elige dónde configurarla','Usa una mesa estable y deja libres las rejillas de ventilación. Evita cama, sofá o cobijas mientras esté encendida.'),
('connect-power','Conecta el cargador y enciéndela','Conecta la corriente a la consola o al dock y pulsa una vez el botón POWER de la parte superior.')]),
('02','Hazla tuya','Idioma, internet, usuario y cuenta Nintendo.',[
('choose-language','Elige idioma, región y zona horaria','Selecciona Español, México y la zona horaria correspondiente.'),
('connect-wifi','Conéctala a Wi-Fi','Elige el nombre de tu red, escribe la contraseña y espera la confirmación.'),
('create-user','Crea tu usuario','Elige un icono y el nombre que quieras ver en HOME.'),
('link-account','Crea o vincula tu cuenta Nintendo','Usa tu propio correo y guarda la contraseña. Antes de comprar o canjear, comprueba que la eShop muestra tu usuario.')]),
('03','Déjala lista','Actualizaciones, pantalla, descanso y juego online.',[
('update-console','Actualiza la consola','Desde Configuración de la consola, entra en Consola y busca la actualización. Déjala conectada a internet y corriente.'),
('update-controllers','Actualiza los Joy-Con 2','En Configuración, abre Controles y sensores y busca la actualización de controles.'),
('adjust-display','Ajusta brillo y volumen','Mantén pulsado HOME para abrir ajustes rápidos. Empieza con brillo automático y volumen cómodo.'),
('adjust-sleep','Configura el modo de espera','Revisa Modo de espera para que la pantalla se apague cuando no uses la consola.'),
('join-family','Únete al grupo familiar de Inti','Cuando tu cuenta esté lista, pasa a Inti el correo usado y acepta la invitación que recibas.')]),
('04','Empieza a jugar','HOME, eShop, códigos, descargas y cuidados.',[
('learn-home','Conoce el menú HOME','Desde HOME abres juegos, Álbum, Nintendo eShop, Configuración y tu usuario.'),
('open-eshop','Abre Nintendo eShop','Selecciona el icono de la bolsa en HOME y elige tu usuario.'),
('redeem-code','Canjea un código cuando estés lista','En eShop, elige ingresar código, escribe los 16 caracteres y revisa el contenido antes de confirmar.'),
('download-game','Descarga tu primer juego','Después de comprar o canjear, vuelve a HOME y revisa el progreso de descarga.'),
('protect-console','Cuida la consola','Guárdala en la funda al transportarla, evita líquidos y calor, y límpiala con un paño suave y seco.')])]

chapters = ''
for number,title,copy,items in steps:
    body=''.join(f'<label class="guide-step"><input type="checkbox" data-guide-step="{sid}"><span><strong>{name}</strong><p>{desc}</p></span></label>' for sid,name,desc in items)
    chapters += f'<details class="guide-chapter"{" open" if number=="01" else ""}><summary><span class="guide-number">{number}</span><span><h3>{title}</h3><p>{copy}</p></span></summary><div class="guide-body">{body}</div></details>'

html = f'''      <!-- INICIA AQUI -->
      <section class="screen getting-started-screen" data-screen="getting-started" aria-labelledby="getting-started-title" hidden>
        <header class="guide-hero"><div><p class="guide-kicker">Tu Nintendo Switch 2 · desde cero</p><h2 id="getting-started-title" class="guide-title">Inicia aquí</h2><p class="guide-lead">Esta consola fue restaurada y preparada para ti. Sigue la guía a tu ritmo: no necesitas saber nada de Nintendo antes de empezar.</p></div><aside class="guide-progress"><p class="guide-kicker">Tu progreso</p><div class="guide-track" role="progressbar" aria-valuemin="0" aria-valuemax="17" aria-valuenow="0"><div class="guide-bar" data-guide-bar></div></div><p data-guide-label>0 de 17 pasos completados</p></aside></header>
        <section><p class="guide-kicker">Antes de encenderla</p><h3>Lo que recibiste</h3><div class="guide-inventory"><article class="guide-card"><strong>La consola</strong><span>Nintendo Switch 2 restaurada, con mica instalada y lista para una configuración nueva.</span></article><article class="guide-card"><strong>Para jugar</strong><span>Joy-Con 2 y funda para proteger la consola.</span></article><article class="guide-card"><strong>Para la televisión</strong><span>Dock, cargador y cables originales.</span></article></div><p class="guide-note"><strong>No incluye microSD Express.</strong> Puedes empezar con el almacenamiento interno y decidir después si necesitas más espacio.</p></section>
        <div class="guide-chapters">{chapters}</div>
        <footer class="guide-footer"><button type="button" class="btn btn-text" data-guide-reset>Reiniciar progreso</button><div><button type="button" class="btn btn-ghost" data-action="to-gift">Ver mi regalo</button> <button type="button" class="btn btn-primary" data-action="to-catalog">Elegir mi primer juego</button></div></footer>
      </section>

'''

qa = '''import assert from "node:assert/strict";\nimport { GETTING_STARTED_STEPS, normalizeGettingStartedProgress, readGettingStartedProgress, writeGettingStartedProgress } from "../js/getting-started.js";\nassert.equal(GETTING_STARTED_STEPS.length,17); assert.equal(new Set(GETTING_STARTED_STEPS).size,17); console.log("[OK] define 17 pasos unicos");\nassert.deepEqual(normalizeGettingStartedProgress(["check-console","invalid","check-console"]),["check-console"]); console.log("[OK] limpia pasos invalidos y duplicados");\nconst data=new Map(); const storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)}; writeGettingStartedProgress(["check-console","connect-wifi"],storage); assert.deepEqual(readGettingStartedProgress(storage),["check-console","connect-wifi"]); console.log("[OK] persiste el progreso");\ndata.set("heartagram:getting-started-progress:v1","bad-json"); assert.deepEqual(readGettingStartedProgress(storage),[]); console.log("[OK] tolera almacenamiento corrupto");\nconsole.log("\\n[OK] QA de Inicia aqui completo");\n'''

index = read('index.html')
if 'data-screen="getting-started"' in index: stop('Inicia aqui ya existe en index.html')
css_link = '    <link rel="stylesheet" href="css/screens/getting-started.css?v=v110" />'
if css_link not in index:
    head_end = '</head>'
    if index.count(head_end) != 1: stop(f'CSS: no se encontro un cierre head unico')
    index = index.replace(head_end, css_link + '\n' + head_end, 1)
index = once(index,'      <!-- TEST -->',html+'      <!-- TEST -->','pantalla')
index = once(index,'          <button type="button" class="btn btn-ghost" data-action="to-wishlist">\n            Volver a Mi lista\n          </button>','          <button type="button" class="btn btn-ghost" data-action="to-getting-started">\n            Abrir Inicia aquí\n          </button>','boton de regalo')
write('index.html',index)

main=read('js/main.js')
main=once(main,'import { initializeLocalAssistant } from "./ai-assistant-ui.js";','import { initializeLocalAssistant } from "./ai-assistant-ui.js";\nimport { initializeGettingStarted } from "./getting-started.js";','import')
main=once(main,'  "to-gift": () => {\n    showScreen("gift");\n  },','  "to-getting-started": () => { initializeGettingStarted(); showScreen("getting-started"); },\n\n  "to-gift": () => {\n    showScreen("gift");\n  },','accion')
main=once(main,'    initializeCollectionUI();','    initializeCollectionUI();\n    initializeGettingStarted();','init')
write('js/main.js',main)

shell=read('js/app-shell.js')
shell=once(shell,'  profile: \'<circle cx="12" cy="8" r="3.2"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>\',','  start: \'<circle cx="12" cy="12" r="8.5"/><path d="M10 8.5 15.5 12 10 15.5z"/>\',\n  profile: \'<circle cx="12" cy="8" r="3.2"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>\',','icono')
shell=once(shell,'export const SECONDARY_NAV_ITEMS = [','export const SECONDARY_NAV_ITEMS = [\n  { label: "Inicia aquí", icon: "start", screen: "getting-started", action: "to-getting-started" },','navegacion')
write('js/app-shell.js',shell)

shellqa=read('tests/app-shell-qa.mjs')
shellqa=once(shellqa,'["Mi perfil", "Mi regalo"],','["Inicia aquí", "Mi perfil", "Mi regalo"],','QA shell')
write('tests/app-shell-qa.mjs',shellqa)

package=json.loads(read('package.json'))
cmd='node tests/getting-started-qa.mjs'
if cmd not in package['scripts']['test']: package['scripts']['test'] += ' && '+cmd
write('package.json',json.dumps(package,ensure_ascii=False,indent=2)+'\n')
write('js/getting-started.js',js); write('css/screens/getting-started.css',css); write('tests/getting-started-qa.mjs',qa)
print('[OK] Inicia aqui instalado')
print('[OK] 17 pasos y progreso local agregados')
print('[OK] Navegacion secundaria y acceso desde Mi regalo conectados')
print('[OK] QA agregado a npm test')
print(f'[SAFE] Backup: {BACKUP.relative_to(ROOT)}')

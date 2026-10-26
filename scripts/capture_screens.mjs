#!/usr/bin/env node
// Screenshots of every screen at phone and desktop width, for design review.
// Serves the repo root itself and drives headless Chrome or Edge over the
// DevTools protocol, so it needs no packages (Node 22+ for the global WebSocket).
//
// Run it from the repo root on a network that can reach assets.nintendo.com,
// so the game covers load:
//     node scripts/capture_screens.mjs
//     node scripts/capture_screens.mjs --out screens --chrome "C:\path\to\chrome.exe"
//     node scripts/capture_screens.mjs --only mobile   (or desktop)
// Images go to screens/ (gitignored).

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { createServer as createNetServer } from "node:net";
import { tmpdir } from "node:os";
import { extname, join, normalize, resolve, sep } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const OUT = resolve(ROOT, option("--out", "screens"));
const VIEWPORTS = [
  { label: "mobile", width: 390, height: 844, mobile: true },
  { label: "desktop", width: 1440, height: 900, mobile: false },
].filter(({ label }) => !option("--only", null) || label === option("--only", null));
const MAX_PAGE_HEIGHT = 12000;
const MAX_SEGMENT_PIXELS = 2_500_000;
const QUIZ_PICKS = [0, 1, 0, 2, 0, 1, 0, 1, 1, 1, 0, 3];
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".txt": "text/plain; charset=utf-8",
};

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

function findBrowser() {
  const candidates = [
    option("--chrome", null), process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  ].filter(Boolean);
  return candidates.find((path) => existsSync(path));
}

function startServer() {
  const server = createServer((request, response) => {
    const path = normalize(decodeURIComponent(new URL(request.url, "http://x").pathname)).replace(/^([/\\])+/, "");
    const file = join(ROOT, path === "" ? "index.html" : path);
    if (!file.startsWith(ROOT + sep) || !existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { "Content-Type": MIME[extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
  });
  return new Promise((done) => server.listen(0, "127.0.0.1", () => done(server)));
}

// Asks the OS for a free port so two runs (or other tools) never collide.
function freePort() {
  return new Promise((done, fail) => {
    const probe = createNetServer();
    probe.once("error", fail);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close(() => done(port));
    });
  });
}

async function stopBrowser(chrome, profile) {
  if (chrome.exitCode === null && chrome.signalCode === null) {
    await new Promise((done) => {
      chrome.once("exit", done);
      chrome.kill();
      setTimeout(done, 5000);
    });
  }
  // Best effort: on Windows the browser can hold profile files for a moment longer.
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { /* temp folder, harmless */ }
}

// Whatever happens while driving the page, the browser and its profile are always cleaned up.
async function capture(spec, browser, baseUrl) {
  const port = await freePort();
  const profile = join(tmpdir(), `heartagram-capture-${spec.label}-${Date.now()}`);
  const chrome = spawn(browser, [
    "--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    "--no-first-run", "--disable-gpu", "--hide-scrollbars", "about:blank",
    // Ubuntu runners restrict the browser sandbox; CI is set by GitHub Actions.
    ...(process.env.CI ? ["--no-sandbox"] : []),
  ], { stdio: "ignore" });
  const launchFailed = new Promise((_, reject) => {
    chrome.once("error", (error) => reject(new Error(`[FAIL] No pude abrir el navegador: ${error.message}`)));
  });
  try {
    return await Promise.race([drive(spec, port, baseUrl), launchFailed]);
  } finally {
    await stopBrowser(chrome, profile);
  }
}

async function drive({ label, width, height, mobile }, port, baseUrl) {
  let target;
  for (let attempt = 0; attempt < 60 && !target; attempt += 1) {
    try { target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page"); }
    catch { await sleep(250); }
  }
  if (!target) throw new Error("[FAIL] El navegador no arrancó");

  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((done) => socket.addEventListener("open", done, { once: true }));
  let nextId = 1;
  const pending = new Map();
  const failed = new Map();
  const errors = [];
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id); }
    if (message.method === "Runtime.exceptionThrown") errors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
    if (message.method === "Network.requestWillBeSent") failed.set(message.params.requestId, { url: message.params.request.url, error: null });
    if (message.method === "Network.loadingFailed" && failed.has(message.params.requestId)) failed.get(message.params.requestId).error = message.params.errorText;
  });
  const send = (method, params = {}) => {
    const answer = new Promise((done) => {
      const id = nextId++;
      pending.set(id, done);
      socket.send(JSON.stringify({ id, method, params }));
    });
    const timeout = sleep(30000).then(() => { throw new Error(`[FAIL] ${method} no respondió en 30 s`); });
    return Promise.race([answer, timeout]);
  };
  const run = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const click = (selector) => run(`document.querySelector(${JSON.stringify(selector)})?.click()`);
  const viewport = (h) => send("Emulation.setDeviceMetricsOverride", { width, height: h, deviceScaleFactor: 1, mobile });

  await Promise.all(["Page.enable", "Runtime.enable", "Network.enable"].map((method) => send(method)));
  await viewport(height);

  let index = 0;
  // Resizing the viewport to the page height gives a true image, with fixed backgrounds
  // and bars drawn once. Very large areas can freeze the browser without a GPU, so a
  // tall page is captured in several segments instead of one huge image.
  async function shot(name) {
    await sleep(900);
    const pageHeight = Math.min(await run("document.documentElement.scrollHeight"), MAX_PAGE_HEIGHT);
    const segmentHeight = Math.max(height, Math.floor(MAX_SEGMENT_PIXELS / width));
    const segments = Math.max(1, Math.ceil(pageHeight / segmentHeight));
    console.log(`[..] ${label} ${name}: página de ${pageHeight}px en ${segments} ${segments === 1 ? "imagen" : "imágenes"}`);
    index += 1;
    for (let part = 0; part < segments; part += 1) {
      const top = part * segmentHeight;
      await viewport(Math.max(height, Math.min(segmentHeight, pageHeight - top)));
      await run(`window.scrollTo(0, ${top})`);
      await sleep(400);
      const image = await send("Page.captureScreenshot", { format: "png" });
      const suffix = segments === 1 ? "" : `-${part + 1}de${segments}`;
      const file = `${label}-${String(index).padStart(2, "0")}-${name}${suffix}.png`;
      writeFileSync(join(OUT, file), Buffer.from(image.result.data, "base64"));
      console.log(`[OK] ${file}`);
    }
    await viewport(height);
    await run("window.scrollTo(0, 0)");
  }

  await send("Page.navigate", { url: `${baseUrl}/index.html` });
  await sleep(4000);
  await shot("inicio");
  await click('[data-action="start"]');
  await sleep(600);
  await shot("test");
  for (const pick of QUIZ_PICKS) {
    await run(`document.querySelectorAll(".quiz-option")[${pick}]?.click()`);
    await sleep(500);
  }
  await sleep(1800);
  await shot("perfil");
  await click('[data-action="to-results"]');
  await sleep(3500);
  await shot("descubrir");
  for (const [tab, name] of [["moods", "descubrir-moods"], ["duo", "descubrir-con-inti"], ["zone", "descubrir-sal-de-tu-zona"]]) {
    await click(`[data-discover-tab="${tab}"]`);
    await sleep(500);
    await shot(name);
  }
  await click('[data-action="to-catalog"]');
  await sleep(5000);
  await shot("explorar");
  await run(`document.querySelectorAll(".catalog-card-favorite").forEach((button, i) => { if (i < 3) button.click(); })`);
  await run(`document.querySelectorAll(".catalog-card-owned")[3]?.click()`);
  await sleep(600);
  await click(".catalog-card-open");
  await sleep(2000);
  await shot("detalle-de-juego");
  await run(`document.getElementById("catalog-dialog-close")?.click()`);
  await click('[data-action="to-wishlist"]');
  await sleep(3000);
  await shot("mi-lista");
  await click('[data-collection-tab="owned"]');
  await sleep(500);
  await shot("mi-biblioteca");
  await click('[data-action="restart"]');
  await sleep(2500);
  await shot("inicio-con-perfil");
  for (const [action, name] of [["to-getting-started", "inicia-aqui"], ["to-gift", "mi-regalo"], ["to-family", "grupo-familiar"]]) {
    await click(`[data-action="${action}"]`);
    await sleep(1200);
    await shot(name);
  }

  const hosts = {};
  for (const { url, error } of failed.values()) {
    if (!error) continue;
    try { const host = new URL(url).host; hosts[host] = (hosts[host] ?? 0) + 1; } catch { /* data: URLs */ }
  }
  socket.close();
  return { label, errors, hosts };
}

const requested = option("--chrome", null);
if (requested && !existsSync(requested)) {
  console.error(`[FAIL] No existe el navegador indicado con --chrome: ${requested}`);
  process.exit(1);
}
const browser = findBrowser();
if (!browser) {
  console.error("[FAIL] No encontré Chrome ni Edge. Usa --chrome <ruta> o la variable CHROME_PATH.");
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });
const server = await startServer();
const baseUrl = `http://127.0.0.1:${server.address().port}`;
console.log(`[OK] Sitio local en ${baseUrl}; navegador: ${browser}`);

let problems = 0;
for (const viewportSpec of VIEWPORTS) {
  const { label, errors, hosts } = await capture(viewportSpec, browser, baseUrl);
  for (const error of errors) { console.log(`[WARN] ${label}: error de JavaScript: ${error}`); problems += 1; }
  for (const [host, count] of Object.entries(hosts)) console.log(`[WARN] ${label}: ${count} peticiones fallidas a ${host}`);
}
server.close();
console.log(`\n[${problems === 0 ? "OK" : "WARN"}] Capturas en ${OUT}`);
process.exit(problems === 0 ? 0 : 1);

#!/usr/bin/env node
// Screenshots of every screen at phone and desktop width, for design review.
// Serves the repo root itself and drives headless Chrome or Edge over the
// DevTools protocol, so it needs no packages (Node 22+ for the global WebSocket).
//
// Run it from the repo root on a network that can reach assets.nintendo.com,
// so the game covers load:
//     node scripts/capture_screens.mjs
//     node scripts/capture_screens.mjs --out screens --chrome "C:\path\to\chrome.exe"
// Images go to screens/ (gitignored).

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, normalize, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const OUT = resolve(ROOT, option("--out", "screens"));
const VIEWPORTS = [
  { label: "mobile", width: 390, height: 844, mobile: true },
  { label: "desktop", width: 1440, height: 900, mobile: false },
];
const MAX_PAGE_HEIGHT = 6000;
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
    if (!file.startsWith(ROOT) || !existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { "Content-Type": MIME[extname(file)] ?? "application/octet-stream" }).end(readFileSync(file));
  });
  return new Promise((done) => server.listen(0, "127.0.0.1", () => done(server)));
}

async function capture({ label, width, height, mobile }, browser, baseUrl) {
  const port = 9300 + Math.floor(Math.random() * 500);
  const profile = join(tmpdir(), `heartagram-capture-${label}-${Date.now()}`);
  const chrome = spawn(browser, [
    "--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    "--no-first-run", "--disable-gpu", "--hide-scrollbars", "about:blank",
  ], { stdio: "ignore" });

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
  const send = (method, params = {}) => new Promise((done) => {
    const id = nextId++;
    pending.set(id, done);
    socket.send(JSON.stringify({ id, method, params }));
  });
  const run = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;
  const click = (selector) => run(`document.querySelector(${JSON.stringify(selector)})?.click()`);
  const viewport = (h) => send("Emulation.setDeviceMetricsOverride", { width, height: h, deviceScaleFactor: 1, mobile });

  await Promise.all(["Page.enable", "Runtime.enable", "Network.enable"].map((method) => send(method)));
  await viewport(height);

  let index = 0;
  // Resizing the viewport to the page height gives a true full-page image, with fixed
  // backgrounds and bars drawn once instead of cut off.
  async function shot(name) {
    await sleep(900);
    const pageHeight = Math.min(await run("document.documentElement.scrollHeight"), MAX_PAGE_HEIGHT);
    await viewport(Math.max(height, pageHeight));
    await sleep(300);
    const image = await send("Page.captureScreenshot", { format: "png" });
    await viewport(height);
    index += 1;
    const file = `${label}-${String(index).padStart(2, "0")}-${name}.png`;
    writeFileSync(join(OUT, file), Buffer.from(image.result.data, "base64"));
    console.log(`[OK] ${file}`);
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
  await new Promise((done) => {
    chrome.once("exit", done);
    chrome.kill();
  });
  // Best effort: on Windows the browser can hold profile files for a moment longer.
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { /* temp folder, harmless */ }
  return { label, errors, hosts };
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

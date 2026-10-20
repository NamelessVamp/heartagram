// HEARTAGRAM · Midnight Bouquet decorations.
// Purely visual: it never changes app state, data or navigation.

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const BUTTERFLY = `<svg viewBox="0 0 64 48" aria-hidden="true">
  <path fill="currentColor" d="M32 24C27 8 11 1 5 7s1 19 14 19C8 30 7 40 14 44s14-5 18-20z"/>
  <path fill="currentColor" d="M32 24c5-16 21-23 27-17s-1 19-14 19c11 4 12 14 5 18s-14-5-18-20z"/>
  <path d="M32 13v24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;

const FLOWER = `<svg viewBox="0 0 40 40" aria-hidden="true"><g fill="currentColor">${
  [0, 72, 144, 216, 288]
    .map((angle) => `<ellipse cx="20" cy="10" rx="6" ry="10" transform="rotate(${angle} 20 20)"/>`)
    .join("")
}</g><circle cx="20" cy="20" r="4" fill="#f6d98a"/></svg>`;

const CRYSTAL = `<svg viewBox="0 0 40 80" aria-hidden="true">
  <path fill="currentColor" d="M20 0 36 22 28 80H12L4 22z" opacity=".85"/>
  <path d="M20 0v80M4 22h32" stroke="#fff" stroke-opacity=".35"/>
</svg>`;

const NOTES = [
  [".discover-header", "What do we play today? ♡"],
  [".catalog-screen-header", "More games, more magic ♡"],
  [".collection-header", "A collection of what makes me happy ♡"],
  [".guide-hero > div:first-child", "Lista para tu primera aventura ♡"],
  [".profile-copy", "Un poco de caos también es una forma de amor ♡"],
];

function make(tag, className, html = "") {
  const node = document.createElement(tag);
  node.className = className;
  if (html) node.innerHTML = html;
  return node;
}

function note(text) {
  const node = make("p", "bq-note");
  node.textContent = text;
  node.setAttribute("aria-hidden", "true");
  return node;
}

const butterfly = (className = "bq-butterfly") => make("span", className, BUTTERFLY);

function whenReady(selector, callback) {
  const found = document.querySelector(selector);
  if (found) {
    callback(found);
    return;
  }
  const observer = new MutationObserver(() => {
    const node = document.querySelector(selector);
    if (!node) return;
    observer.disconnect();
    callback(node);
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function decorateSky() {
  if (document.querySelector(".bq-sky")) return;
  const sky = make("div", "bq-sky");
  sky.setAttribute("aria-hidden", "true");
  for (let index = 0; index < 5; index += 1) sky.append(butterfly());
  document.body.prepend(sky);
}

function decorateHero() {
  const header = document.querySelector(".home-header");
  if (!header || header.querySelector(".bq-hero-art")) return;
  const art = make("div", "bq-hero-art");
  art.setAttribute("aria-hidden", "true");
  art.append(make("span", "bq-moon"));
  for (let index = 0; index < 5; index += 1) art.append(make("span", "bq-flower", FLOWER));
  for (let index = 0; index < 3; index += 1) art.append(butterfly());
  header.prepend(art);
}

function decorateNotes() {
  for (const [selector, text] of NOTES) {
    const target = document.querySelector(selector);
    if (target && !target.querySelector(":scope > .bq-note")) target.append(note(text));
  }
  const giftTitle = document.getElementById("gift-title");
  if (giftTitle && !giftTitle.parentElement.querySelector(":scope > .bq-note")) {
    giftTitle.after(note("Para ti, Player Two ♡"));
  }
}

function decorateSidebar() {
  whenReady(".app-sidebar-secondary", (secondary) => {
    if (secondary.parentElement.querySelector(".bq-sidebar-note")) return;
    const text = make("p", "bq-sidebar-note");
    text.textContent = "Player Two, Always ♡";
    text.setAttribute("aria-hidden", "true");
    secondary.before(text);
  });
}

function decorateQuiz() {
  const track = document.querySelector(".quiz-progress");
  const bar = document.getElementById("quiz-progress-bar");
  if (!track || !bar || track.querySelector(".bq-progress-wing")) return;
  const wing = butterfly("bq-butterfly bq-progress-wing");
  track.append(wing);
  const sync = () => {
    wing.style.left = bar.style.width || "0%";
  };
  sync();
  new MutationObserver(sync).observe(bar, { attributes: true, attributeFilter: ["style"] });
}

function decorateProfile() {
  const screen = document.querySelector('.screen[data-screen="profile"]');
  if (!screen || screen.querySelector(".bq-tarot")) return;
  const card = make("div", "bq-tarot");
  card.setAttribute("aria-hidden", "true");
  const art = make("div", "bq-tarot-art");
  art.append(make("span", "bq-moon"), butterfly(), butterfly(), make("span", "bq-tarot-stars", "✦ ✧ ✦"));
  const name = make("p", "bq-tarot-name");
  const meta = make("p", "bq-tarot-meta");
  meta.textContent = "PLAYER TWO · ✦✦✦";
  card.append(art, name, meta);
  screen.insertBefore(card, screen.querySelector(".profile-copy"));

  const title = document.getElementById("profile-title");
  const sync = () => {
    name.textContent = title?.textContent.trim() || "Player Two";
  };
  sync();
  if (title) new MutationObserver(sync).observe(title, { childList: true, characterData: true, subtree: true });
}

function decorateCollection() {
  const header = document.querySelector(".collection-header");
  if (!header || header.querySelector(".bq-crystals")) return;
  const crystals = make("div", "bq-crystals", CRYSTAL + CRYSTAL + CRYSTAL);
  crystals.setAttribute("aria-hidden", "true");
  header.append(crystals);
}

let toast;
let toastTimer;

function showToast(text) {
  if (!toast) {
    toast = make("div", "bq-toast");
    toast.setAttribute("role", "status");
    document.body.append(toast);
  }
  toast.textContent = text;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1600);
}

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
let konamiIndex = 0;

function burst() {
  showToast("✦ PLAYER TWO UNLOCKED ✦");
  if (reduceMotion) return;
  const layer = make("div", "bq-burst");
  layer.setAttribute("aria-hidden", "true");
  for (let index = 0; index < 24; index += 1) {
    const wing = butterfly();
    wing.style.left = `${Math.random() * 100}vw`;
    wing.style.animationDelay = `${(Math.random() * 1.2).toFixed(2)}s`;
    wing.style.setProperty("--bq-x", `${((Math.random() - 0.5) * 30).toFixed(1)}vw`);
    wing.style.color = index % 2 ? "var(--accent-hover)" : "var(--emily)";
    layer.append(wing);
  }
  document.body.append(layer);
  setTimeout(() => layer.remove(), 5200);
}

function listen() {
  window.addEventListener("heartagram:favorites-changed", () => showToast("♡ SAVING… [OK]"));
  window.addEventListener("heartagram:library-changed", () => showToast("◆ SAVED TO LIBRARY [OK]"));
  window.addEventListener("keydown", (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    konamiIndex = key === KONAMI[konamiIndex] ? konamiIndex + 1 : Number(key === KONAMI[0]);
    if (konamiIndex === KONAMI.length) {
      konamiIndex = 0;
      burst();
    }
  });
}

decorateSky();
decorateHero();
decorateQuiz();
decorateProfile();
decorateCollection();
listen();

// ---------- v1.2.1 · Motifs inspired by Adri's favorites ----------
// Fox spirit, rebel feather, midnight bat, chaos gem, blue rose, crescent,
// stage star and music note. Original shapes, no character artwork.
const MOTIF_PATHS = {
  fox: '<path d="M10 8 24 26h16L54 8l-2 26c-3 12-10 18-20 22-10-4-17-10-20-22z"/><path d="M24 36h4M36 36h4" stroke="#0a0a18" stroke-width="3" stroke-linecap="round"/><path d="M6 50c-6-10-2-22 8-26M58 50c6-10 2-22-8-26" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
  feather: '<path d="M52 6C30 10 14 28 12 54l6-2c4-16 16-30 34-46z"/><path d="M12 60 42 18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>',
  bat: '<path d="M32 22c-4-4-6-2-6 2-6-6-16-6-22 0 6 2 8 8 8 12 4-4 10-4 14 0 2 4 4 6 6 8 2-2 4-4 6-8 4-4 10-4 14 0 0-4 2-10 8-12-6-6-16-6-22 0 0-4-2-6-6-2z"/>',
  gem: '<path d="M20 8h24l14 18-26 32L6 26z"/><path d="M6 26h52M20 8l6 18 6 32 6-32 6-18" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2"/>',
  rose: '<circle cx="32" cy="24" r="15"/><path d="M24 22c6-10 12-10 16 0-6 6-10 6-16 0z" fill="#0a0a18" fill-opacity=".3"/><path d="M32 39v21" fill="none" stroke="currentColor" stroke-width="3"/><path d="M32 50c-6-6-12-4-14 0 6 4 10 4 14 0z"/>',
  crescent: '<path d="M40 6a27 27 0 1 0 18 40A21 21 0 1 1 40 6z"/>',
  star: '<path d="M32 4l6 22 22 6-22 6-6 22-6-22L4 32l22-6z"/>',
  note: '<path d="M24 46V14l26-6v32" fill="none" stroke="currentColor" stroke-width="4"/><ellipse cx="17" cy="46" rx="8" ry="6"/><ellipse cx="43" cy="40" rx="8" ry="6"/>',
  blossom: '<path d="M32 10c6 8 6 16 0 22-6-6-6-14 0-22zM54 32c-8 6-16 6-22 0 6-6 14-6 22 0zM32 54c-6-8-6-16 0-22 6 6 6 14 0 22zM10 32c8-6 16-6 22 0-6 6-14 6-22 0z"/><circle cx="32" cy="32" r="5" fill="#fff" fill-opacity=".7"/><g fill="currentColor" fill-opacity=".8"><circle cx="32" cy="3" r="2.5"/><circle cx="61" cy="32" r="2.5"/><circle cx="32" cy="61" r="2.5"/><circle cx="3" cy="32" r="2.5"/><circle cx="52.5" cy="11.5" r="2"/><circle cx="52.5" cy="52.5" r="2"/><circle cx="11.5" cy="52.5" r="2"/><circle cx="11.5" cy="11.5" r="2"/></g>',
  heart: '<path d="M32 56C8 40 4 26 12 16c8-8 18-4 20 4 2-8 12-12 20-4 8 10 4 24-20 40z"/>',
};

function motif(name, className = "") {
  const svg = `<svg viewBox="0 0 64 64" fill="currentColor" aria-hidden="true">${MOTIF_PATHS[name] ?? MOTIF_PATHS.star}</svg>`;
  const node = make("span", `bq-motif bq-motif-${name} ${className}`.trim(), svg);
  node.setAttribute("aria-hidden", "true");
  return node;
}

const ARCHETYPE_MOTIFS = {
  EXPLORER: ["fox", "ESPÍRITU ZORRO"],
  COMPETITOR: ["feather", "PLUMA REBELDE"],
  COLLECTOR: ["gem", "GEMA DEL CAOS"],
  CREATOR: ["note", "VOZ DE ESTRELLA"],
  SURVIVOR: ["blossom", "FE INQUEBRANTABLE"],
  STRATEGIST: ["crescent", "LUNA ESTRATEGA"],
  STORY_SEEKER: ["rose", "ROSA AZUL"],
  HORROR_FAN: ["bat", "ROSA DE MEDIANOCHE"],
};

function savedPrimaryArchetype() {
  try {
    return JSON.parse(localStorage.getItem("heartagram:profile") ?? "null")?.archetypes?.primary ?? null;
  } catch {
    return null;
  }
}

const WINDOW_SCENE = `<svg viewBox="0 0 200 260" aria-hidden="true">
  <path d="M0 0h200v14C150 30 50 30 0 14z" fill="#3a1f5c"/>
  <path d="M4 10c26 54 6 144 32 240H4z" fill="#3a1f5c"/>
  <path d="M196 10c-26 54-6 144-32 240h32z" fill="#3a1f5c"/>
  <path d="M28 250V104a72 72 0 0 1 144 0v146" fill="none" stroke="rgb(190 170 255 / .45)" stroke-width="5"/>
  <path d="M100 32v218M28 156h144" stroke="rgb(190 170 255 / .3)" stroke-width="3"/>
  <rect x="14" y="246" width="172" height="10" rx="3" fill="#2a1f55"/>
  <g fill="#07061a"><ellipse cx="140" cy="228" rx="22" ry="20"/><circle cx="140" cy="200" r="13"/>
  <path d="M129 193l2-15 7 11zM151 193l-2-15-7 11z"/></g>
  <path d="M160 240c18-4 22-18 12-26" fill="none" stroke="#07061a" stroke-width="6" stroke-linecap="round"/>
</svg>`;

function decorateHeroScene() {
  const header = document.querySelector(".home-header");
  const art = header?.querySelector(".bq-hero-art");
  if (!header || !art || art.querySelector(".bq-window")) return;
  art.append(make("span", "bq-window", WINDOW_SCENE));

  const actions = make("div", "bq-hero-actions");
  const primary = make("button", "btn btn-primary");
  const explore = make("button", "btn btn-ghost");
  primary.type = explore.type = "button";
  explore.dataset.action = "to-catalog";
  explore.textContent = "Explorar juegos";
  actions.append(primary, explore);
  header.append(actions);

  const strip = document.getElementById("home-cover-strip");
  if (strip) header.append(strip);

  const returning = document.getElementById("home-returning-state");
  const sync = () => {
    const hasProfile = returning ? !returning.hidden : false;
    primary.dataset.action = hasProfile ? "to-results" : "start";
    primary.textContent = hasProfile ? "Ir a Descubrir" : "Descubrir mi perfil";
  };
  sync();
  if (returning) new MutationObserver(sync).observe(returning, { attributes: true, attributeFilter: ["hidden"] });
}

function decorateHeaderMotifs() {
  const groups = [
    [".discover-header", ["feather", "butterfly", "star"]],
    [".catalog-screen-header", ["star", "note", "butterfly"]],
    [".guide-hero > div:first-child", ["fox", "blossom", "crescent"]],
    ["#app > .gift-screen", ["rose", "gem"]],
  ];
  for (const [selector, names] of groups) {
    const target = document.querySelector(selector);
    if (!target || target.querySelector(":scope > .bq-header-motifs")) continue;
    const cluster = make("div", "bq-header-motifs");
    cluster.setAttribute("aria-hidden", "true");
    names.forEach((name) => cluster.append(name === "butterfly" ? butterfly() : motif(name)));
    target.append(cluster);
  }

  const collection = document.querySelector(".collection-header");
  if (collection && !collection.querySelector(".bq-big-heart")) {
    collection.append(motif("heart", "bq-big-heart"));
    const crystals = collection.querySelector(".bq-crystals");
    if (crystals) crystals.replaceChildren(motif("gem"), motif("gem"), motif("gem"));
  }

  const actions = document.querySelector(".collection-actions");
  if (actions && !document.querySelector(".bq-quote")) {
    const quote = make("figure", "bq-quote");
    quote.setAttribute("aria-hidden", "true");
    const text = make("p", "bq-quote-text");
    text.textContent = "“Good games, good company, a happier me.”";
    const sign = make("figcaption", "bq-quote-sign");
    sign.textContent = "— Heartagram";
    quote.append(motif("bat", "bq-quote-bat"), text, sign);
    actions.after(quote);
  }
}

const OPTION_MOTIFS = ["fox", "feather", "heart", "crescent", "gem", "rose", "star", "bat", "blossom"];

function decorateQuizOptions() {
  const container = document.getElementById("quiz-options");
  const counter = document.getElementById("quiz-counter");
  if (!container) return;
  const paint = () => {
    const question = Number(counter?.textContent.match(/\d+/)?.[0] ?? 1);
    container.querySelectorAll(".quiz-option").forEach((option, index) => {
      if (option.querySelector(".bq-opt-icon")) return;
      const name = OPTION_MOTIFS[(question * 3 + index) % OPTION_MOTIFS.length];
      const icon = motif(name, "bq-opt-icon");
      option.insertBefore(icon, option.querySelector(".quiz-option-copy"));
    });
  };
  paint();
  new MutationObserver(paint).observe(container, { childList: true });
}

function decorateTarotMotif() {
  const card = document.querySelector(".bq-tarot");
  const art = card?.querySelector(".bq-tarot-art");
  const meta = card?.querySelector(".bq-tarot-meta");
  const title = document.getElementById("profile-title");
  if (!card || !art || !meta) return;
  const sync = () => {
    const [name, label] = ARCHETYPE_MOTIFS[savedPrimaryArchetype()] ?? ["butterfly", "PLAYER TWO"];
    art.querySelector(".bq-tarot-motif")?.remove();
    art.append(name === "butterfly" ? butterfly("bq-butterfly bq-tarot-motif") : motif(name, "bq-tarot-motif"));
    meta.textContent = `${label} · ✦✦✦`;
  };
  sync();
  if (title) new MutationObserver(sync).observe(title, { childList: true, characterData: true, subtree: true });
}

const HEART_ICON = '<svg viewBox="0 0 64 64" fill="currentColor" aria-hidden="true"><path d="M32 56C8 40 4 26 12 16c8-8 18-4 20 4 2-8 12-12 20-4 8 10 4 24-20 40z"/></svg>';

function decorateCatalogHearts() {
  const grid = document.getElementById("catalog-grid");
  if (!grid) return;
  const paint = () => {
    grid.querySelectorAll(".catalog-card:not(.catalog-card-skeleton)").forEach((card) => {
      const favorite = card.querySelector(".catalog-card-favorite");
      if (!favorite || card.querySelector(".bq-cover-heart")) return;
      const heart = make("button", "bq-cover-heart", HEART_ICON);
      heart.type = "button";
      heart.tabIndex = -1;
      heart.setAttribute("aria-hidden", "true");
      const sync = () => { heart.dataset.on = favorite.getAttribute("aria-pressed") ?? "false"; };
      sync();
      new MutationObserver(sync).observe(favorite, { attributes: true, attributeFilter: ["aria-pressed"] });
      heart.addEventListener("click", () => favorite.click());
      card.append(heart);
    });
  };
  paint();
  new MutationObserver(paint).observe(grid, { childList: true });
}

decorateHeroScene();
decorateHeaderMotifs();
decorateQuizOptions();
decorateTarotMotif();
decorateCatalogHearts();

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
  art.append(note("Good games, brighter days, together ♡"));
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
decorateNotes();
decorateSidebar();
decorateQuiz();
decorateProfile();
decorateCollection();
listen();

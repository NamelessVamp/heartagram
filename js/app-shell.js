const STORAGE_KEY = "heartagram:sidebar-collapsed";
const NAV_ICON_MARKUP = {
  home: '<path d="M3 11.5 12 4l9 7.5v8a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  discover: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="m19 16 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  explore: '<circle cx="12" cy="12" r="8.5"/><path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9z"/>',
  list: '<path d="M12 20.2 4.6 13A4.8 4.8 0 0 1 11.4 6L12 6.7l.6-.7a4.8 4.8 0 0 1 6.8 7z"/>',
  start: '<circle cx="12" cy="12" r="8.5"/><path d="M10 8.5 15.5 12 10 15.5z"/>',
  profile: '<circle cx="12" cy="8" r="3.2"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>',
  gift: '<path d="M4 10h16v10H4zM3 7h18v3H3zM12 7v13"/><path d="M12 7C9 7 7 6.2 7 4.7 7 3.6 7.8 3 8.9 3 10.8 3 12 7 12 7Zm0 0c3 0 5-.8 5-2.3C17 3.6 16.2 3 15.1 3 13.2 3 12 7 12 7Z"/>',
  collapse: '<path d="m14.5 6-6 6 6 6"/>',
  expand: '<path d="m9.5 6 6 6-6 6"/>',
};

function visualIcon(name) {
  return `<svg class="visual-icon" viewBox="0 0 24 24" aria-hidden="true">${NAV_ICON_MARKUP[name] ?? ""}</svg>`;
}


export const PRIMARY_NAV_ITEMS = [
  { label: "Inicio", icon: "home", screen: "intro", action: "restart" },
  {
    label: "Descubrir",
    icon: "discover",
    screen: "results",
    action: "to-results",
    requiresProfile: true,
  },
  { label: "Explorar", icon: "explore", screen: "catalog", action: "to-catalog" },
  { label: "Mi lista", icon: "list", screen: "wishlist", action: "to-wishlist" },
];

export const SECONDARY_NAV_ITEMS = [
  { label: "Inicia aquí", icon: "start", screen: "getting-started", action: "to-getting-started" },
  {
    label: "Mi perfil",
    icon: "profile",
    screen: "profile",
    action: "continue-profile",
    requiresProfile: true,
  },
  { label: "Mi regalo", icon: "gift", screen: "gift", action: "to-gift" },
];

const SCREEN_GROUPS = {
  duo: "results",
  family: "gift",
};

export function navigationScreenFor(screenName) {
  return SCREEN_GROUPS[screenName] ?? screenName;
}

export function readSidebarCollapsed(storage = window.localStorage) {
  try {
    return storage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function writeSidebarCollapsed(collapsed, storage = window.localStorage) {
  try {
    storage.setItem(STORAGE_KEY, String(Boolean(collapsed)));
  } catch {
    // Layout still works when storage is unavailable.
  }
}

function createNavigationButton(item, mobile = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = mobile ? "mobile-nav-button" : "shell-nav-button";
  button.dataset.action = item.action;
  button.dataset.navScreen = item.screen;
  button.title = item.label;
  button.setAttribute("aria-label", item.label);
  button.dataset.tooltip = item.label;

  if (item.requiresProfile) {
    button.dataset.requiresProfile = "true";
  }

  const icon = document.createElement("span");
  icon.className = mobile ? "mobile-nav-icon" : "shell-nav-icon";
  icon.innerHTML = visualIcon(item.icon);
  icon.setAttribute("aria-hidden", "true");

  const label = document.createElement("span");
  label.className = mobile ? "mobile-nav-label" : "shell-nav-label";
  label.textContent = item.label;

  button.append(icon, label);
  return button;
}

function createSidebar() {
  const sidebar = document.createElement("aside");
  sidebar.id = "app-sidebar";
  sidebar.className = "app-sidebar";
  sidebar.setAttribute("aria-label", "Navegación de HEARTAGRAM");

  const brand = document.createElement("div");
  brand.className = "app-sidebar-brand";

  const mark = document.createElement("span");
  mark.className = "app-sidebar-brand-mark";
  mark.textContent = "H";
  mark.setAttribute("aria-hidden", "true");

  const subtitle = document.createElement("span");
  subtitle.className = "app-sidebar-brand-subtitle";
  subtitle.textContent = "Heartagram";

  brand.append(mark, subtitle);

  const primary = document.createElement("nav");
  primary.className = "app-sidebar-nav";
  primary.setAttribute("aria-label", "Secciones principales");
  PRIMARY_NAV_ITEMS.forEach((item) => {
    primary.append(createNavigationButton(item));
  });

  const secondary = document.createElement("nav");
  secondary.className = "app-sidebar-secondary";
  secondary.setAttribute("aria-label", "Secciones secundarias");
  SECONDARY_NAV_ITEMS.forEach((item) => {
    secondary.append(createNavigationButton(item));
  });

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "sidebar-toggle";
  toggle.setAttribute("aria-controls", "app-sidebar");

  const toggleIcon = document.createElement("span");
  toggleIcon.className = "shell-nav-icon";
  toggleIcon.setAttribute("aria-hidden", "true");
  toggleIcon.dataset.visualToggleIcon = "collapse";
  toggleIcon.innerHTML = visualIcon("collapse");

  const toggleLabel = document.createElement("span");
  toggleLabel.className = "sidebar-toggle-label";
  toggleLabel.textContent = "Contraer";

  toggle.append(toggleIcon, toggleLabel);
  toggle.addEventListener("click", () => {
    const collapsed = !document.body.classList.contains("sidebar-collapsed");
    applySidebarCollapsed(collapsed);
    writeSidebarCollapsed(collapsed);
  });

  sidebar.append(brand, primary, secondary, toggle);
  return sidebar;
}

function createMobileNavigation() {
  const navigation = document.createElement("nav");
  navigation.id = "mobile-navigation";
  navigation.className = "mobile-navigation";
  navigation.setAttribute("aria-label", "Navegación principal móvil");
  PRIMARY_NAV_ITEMS.forEach((item) => {
    navigation.append(createNavigationButton(item, true));
  });
  return navigation;
}

function applySidebarCollapsed(collapsed) {
  document.body.classList.toggle("sidebar-collapsed", collapsed);
  const toggle = document.querySelector(".sidebar-toggle");
  if (!toggle) return;

  toggle.setAttribute("aria-expanded", String(!collapsed));
  toggle.setAttribute(
    "aria-label",
    collapsed ? "Expandir navegación" : "Contraer navegación",
  );

  const icon = toggle.querySelector(".shell-nav-icon");
  const label = toggle.querySelector(".sidebar-toggle-label");
  if (icon) {
    const name = collapsed ? "expand" : "collapse";
    icon.dataset.visualToggleIcon = name;
    icon.innerHTML = visualIcon(name);
  }
  if (label) label.textContent = collapsed ? "Expandir" : "Contraer";
}

export function ensureAppShell() {
  if (document.querySelector(".app-shell")) return;

  const app = document.getElementById("app");
  if (!app) throw new Error("No se encontró #app");

  const shell = document.createElement("div");
  shell.className = "app-shell";
  app.before(shell);
  shell.append(createSidebar(), app, createMobileNavigation());

  document.body.classList.add("has-app-shell");
  applySidebarCollapsed(readSidebarCollapsed());
}

export function updateAppShellNavigation(screenName, { hasProfile = false } = {}) {
  ensureAppShell();

  const navigationScreen = navigationScreenFor(screenName);
  const isQuiz = screenName === "quiz";
  document.body.classList.toggle("shell-focus-mode", isQuiz);

  for (const button of document.querySelectorAll("[data-nav-screen]")) {
    const requiresProfile = button.dataset.requiresProfile === "true";
    button.disabled = requiresProfile && !hasProfile;

    if (button.dataset.navScreen === navigationScreen) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  }
}

const STORAGE_KEY = "heartagram:sidebar-collapsed";

export const PRIMARY_NAV_ITEMS = [
  { label: "Inicio", short: "IN", screen: "intro", action: "restart" },
  {
    label: "Descubrir",
    short: "DS",
    screen: "results",
    action: "to-results",
    requiresProfile: true,
  },
  { label: "Explorar", short: "EX", screen: "catalog", action: "to-catalog" },
  { label: "Mi lista", short: "ML", screen: "wishlist", action: "to-wishlist" },
  { label: "Chat", short: "CH", screen: "assistant", action: "to-assistant" },
];

export const SECONDARY_NAV_ITEMS = [
  {
    label: "Mi perfil",
    short: "PF",
    screen: "profile",
    action: "continue-profile",
    requiresProfile: true,
  },
  { label: "Mi regalo", short: "RG", screen: "gift", action: "to-gift" },
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

  if (item.requiresProfile) {
    button.dataset.requiresProfile = "true";
  }

  const icon = document.createElement("span");
  icon.className = mobile ? "mobile-nav-icon" : "shell-nav-icon";
  icon.textContent = item.short;
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
  toggleIcon.textContent = "<<";
  toggleIcon.setAttribute("aria-hidden", "true");

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
  if (icon) icon.textContent = collapsed ? ">>" : "<<";
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

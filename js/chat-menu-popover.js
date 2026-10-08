// Portal thread menus outside the scrolling sidebar so they cannot be clipped.
let activeMenu = null;

function restoreMenu() {
  if (!activeMenu) return;
  const { details, actions, marker } = activeMenu;
  if (marker.parentNode) marker.after(actions);
  marker.remove();
  actions.classList.remove("chat-thread-actions-portaled");
  actions.removeAttribute("style");
  details.open = false;
  activeMenu = null;
}

function openMenu(details) {
  restoreMenu();
  const summary = details.querySelector(":scope > summary");
  const actions = details.querySelector(":scope > .chat-thread-actions");
  if (!summary || !actions) return;
  const marker = document.createComment("thread-menu-home");
  actions.before(marker);
  document.body.append(actions);
  actions.classList.add("chat-thread-actions-portaled");
  const rect = summary.getBoundingClientRect();
  const width = 190;
  const left = Math.min(rect.right + 8, window.innerWidth - width - 12);
  const top = Math.min(rect.top, window.innerHeight - 160);
  actions.style.left = `${Math.max(12, left)}px`;
  actions.style.top = `${Math.max(12, top)}px`;
  actions.style.width = `${width}px`;
  activeMenu = { details, actions, marker };
}

document.addEventListener("click", (event) => {
  const summary = event.target.closest(".chat-thread-menu > summary");
  if (summary) {
    event.preventDefault();
    const details = summary.parentElement;
    if (activeMenu?.details === details) restoreMenu();
    else {
      details.open = true;
      openMenu(details);
    }
    return;
  }
  if (activeMenu && !event.target.closest(".chat-thread-actions-portaled")) {
    restoreMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") restoreMenu();
});

window.addEventListener("resize", restoreMenu);
document.addEventListener("scroll", restoreMenu, true);

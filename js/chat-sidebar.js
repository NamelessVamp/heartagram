// Move existing chat controls into the app sidebar; preserve IDs and handlers.
let mounted = false;
function mountChatSidebar() {
  if (mounted) return;
  const sidebar = document.getElementById("app-sidebar");
  const threads = document.getElementById("chat-threads");
  const newChat = document.getElementById("chat-new");
  const deleteChat = document.getElementById("chat-delete");
  if (!sidebar || !threads || !newChat || !deleteChat) return;
  const oldPanel = threads.closest("details");
  if (!oldPanel) return;
  mounted = true;
  const placeholder = document.createComment("chat-history-original-location");
  oldPanel.before(placeholder);
  const originalNewParent = newChat.parentNode;
  const newPlaceholder = document.createComment("new-chat-original-location");
  newChat.before(newPlaceholder);
  const heading = document.createElement("p");
  heading.className = "shell-chat-heading";
  heading.textContent = "Recientes";
  oldPanel.querySelector("summary")?.after(heading);
  oldPanel.classList.add("shell-chat-history");
  newChat.classList.add("shell-new-chat");
  const media = window.matchMedia("(min-width: 1025px)");
  function sync() {
    const inChat = document.body.dataset.screen === "assistant";
    const collapsed = document.body.classList.contains("sidebar-collapsed");
    const integrate = media.matches && inChat && !collapsed;
    if (integrate) {
      const primary = sidebar.querySelector(".app-sidebar-nav");
      primary.before(newChat);
      primary.after(oldPanel);
      oldPanel.open = true;
      oldPanel.dataset.integrated = "true";
    } else {
      if (newPlaceholder.parentNode) newPlaceholder.after(newChat);
      else originalNewParent.append(newChat);
      if (placeholder.parentNode) placeholder.after(oldPanel);
      delete oldPanel.dataset.integrated;
    }
  }
  media.addEventListener("change", sync);
  new MutationObserver(sync).observe(document.body, {attributes: true, attributeFilter: ["class", "data-screen"]});
  sync();
}
const observer = new MutationObserver(() => {
  mountChatSidebar();
  if (mounted) observer.disconnect();
});
observer.observe(document.documentElement, {childList: true, subtree: true});
mountChatSidebar();

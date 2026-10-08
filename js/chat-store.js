// Bounded conversation storage. No network access or preference inference.
export const CHAT_KEY = "heartagram:chat-threads";
export function normalizeThreads(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(t => t && typeof t.id === "string" && Array.isArray(t.messages))
    .slice(-20).map(t => ({id:t.id, title:String(t.title || "Nueva conversación").slice(0,60),
      messages:t.messages.filter(m => m && ["user","assistant"].includes(m.role) && typeof m.content === "string")
        .slice(-40).map(m => ({role:m.role,content:m.content.slice(0,4000)}))}));
}
export function loadThreads(storage) {
  try { return normalizeThreads(JSON.parse(storage.getItem(CHAT_KEY) || "[]")); } catch { return []; }
}
export function saveThreads(threads, storage) {
  try { storage.setItem(CHAT_KEY,JSON.stringify(normalizeThreads(threads))); return true; } catch { return false; }
}
export function shouldSend(event) {
  return event.key === "Enter" && !event.shiftKey && !event.isComposing;
}

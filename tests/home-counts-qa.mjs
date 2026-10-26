import assert from "node:assert/strict";

// A minimal DOM: just enough for renderHomeDashboard and the counts listener.
const nodes = new Map();
const node = (id) => {
  if (!nodes.has(id)) {
    nodes.set(id, { id, textContent: "", hidden: false, dataset: {}, classList: { toggle() {} }, replaceChildren() {} });
  }
  return nodes.get(id);
};
const listeners = new Map();
globalThis.document = { getElementById: node };
globalThis.window = {
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  addEventListener: (type, handler) => listeners.set(type, [...(listeners.get(type) ?? []), handler]),
};
const emit = (detail) => (listeners.get("heartagram:collection-rendered") ?? []).forEach((handler) => handler({ detail }));

const { initializeHomeCounts, renderHomeDashboard } = await import("../js/home-dashboard.js");
initializeHomeCounts();

const shown = () => [node("home-favorite-count").textContent, node("home-owned-count").textContent];

emit({ counts: { interested: 2, owned: 1 }, loading: false, error: false });
assert.deepEqual(shown(), ["2", "1"]);
console.log("[OK] Inicio toma los conteos que Mi lista ya resolvió");

emit({ counts: { interested: 0, owned: 0 }, loading: true, error: false });
assert.deepEqual(shown(), ["2", "1"], "Mientras Mi lista carga no debe pisar los números");
console.log("[OK] Mientras Mi lista carga, Inicio conserva sus números");

emit({ counts: { interested: 0, owned: 0 }, loading: false, error: true });
assert.deepEqual(shown(), ["2", "1"], "Una carga fallida dejaría fuera los juegos de Explorar");
console.log("[OK] Si el catálogo falla al cargar, Inicio no se queda con un conteo incompleto");

const profile = { archetypes: { primary: "EXPLORER", secondary: "CREATOR" } };
renderHomeDashboard({ profile, archetypes: [], sections: null });
assert.deepEqual(shown(), ["2", "1"], "Volver a pintar Inicio mantiene los conteos resueltos");
emit({ counts: { interested: 5, owned: 3 }, loading: false, error: false });
renderHomeDashboard({ profile, archetypes: [], sections: null });
assert.deepEqual(shown(), ["5", "3"]);
console.log("[OK] Inicio conserva los conteos resueltos al volver a pintarse");

console.log("\n[OK] QA de conteos de Inicio completo");

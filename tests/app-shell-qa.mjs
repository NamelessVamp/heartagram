import assert from "node:assert/strict";
import {
  PRIMARY_NAV_ITEMS,
  SECONDARY_NAV_ITEMS,
  navigationScreenFor,
  readSidebarCollapsed,
  writeSidebarCollapsed,
} from "../js/app-shell.js";

assert.deepEqual(
  PRIMARY_NAV_ITEMS.map(({ label }) => label),
  ["Inicio", "Descubrir", "Explorar", "Mi lista", "Chat"],
);
console.log("[OK] conserva cinco destinos principales");

assert.deepEqual(
  SECONDARY_NAV_ITEMS.map(({ label }) => label),
  ["Inicia aquí", "Mi perfil", "Mi regalo"],
);
console.log("[OK] separa los destinos secundarios");

assert.equal(navigationScreenFor("duo"), "results");
assert.equal(navigationScreenFor("family"), "gift");
assert.equal(navigationScreenFor("catalog"), "catalog");
console.log("[OK] agrupa pantallas heredadas en el destino correcto");

const data = new Map();
const storage = {
  getItem(key) {
    return data.get(key) ?? null;
  },
  setItem(key, value) {
    data.set(key, value);
  },
};

assert.equal(readSidebarCollapsed(storage), false);
writeSidebarCollapsed(true, storage);
assert.equal(readSidebarCollapsed(storage), true);
writeSidebarCollapsed(false, storage);
assert.equal(readSidebarCollapsed(storage), false);
console.log("[OK] persiste el estado colapsado");

console.log("\n[OK] QA del app shell completo");

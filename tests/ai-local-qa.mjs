import assert from "node:assert/strict";
import { buildAIContext } from "../js/ai-context.js";
import { generateLocalAssistantResponse } from "../js/ai-local.js";

const games = [
  {
    id: "darkwood",
    title: "Darkwood",
    vector: { mood: 2 },
    couple: [],
  },
  {
    id: "mario-kart-world",
    title: "Mario Kart World",
    vector: { mood: -1 },
    couple: ["INTI_LIBRARY_MATCH"],
  },
];

function reply(message, values = {}) {
  const context = buildAIContext({
    games,
    message,
    ...values,
  });

  return generateLocalAssistantResponse(context, games);
}

assert.match(reply("Quiero algo oscuro"), /Darkwood/);
console.log("[OK] recomienda una opción oscura local");

assert.match(reply("¿Qué puedo jugar con Inti?"), /Mario Kart World/);
console.log("[OK] usa las coincidencias de la biblioteca de Inti");

assert.match(
  reply("¿Qué debería jugar primero?", { ownedIds: ["darkwood"] }),
  /Darkwood/,
);
console.log("[OK] prioriza Mi biblioteca cuando se pregunta qué jugar");

assert.match(
  reply("¿Qué hay en Mi lista?", { favoriteIds: ["darkwood"] }),
  /Darkwood/,
);
console.log("[OK] utiliza Me interesa");

assert.doesNotMatch(reply("Hola"), /XXXX-XXXX|api[_ -]?key/i);
console.log("[OK] no expone códigos ni claves");

console.log("\n[OK] QA del asistente local completo");

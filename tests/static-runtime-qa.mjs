import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const removed = [
  "heartagram_server.py", "chat_stream_backend.py", "js/ai-assistant-ui.js",
  "js/ai-context.js", "js/chat-store.js", "prompts/heartagram-system.txt",
  "scripts/sync_igdb_catalog.py", "data/catalog_igdb.before_quality_filter.json",
];
removed.forEach((path) => assert.equal(existsSync(path), false, `${path} debe estar eliminado`));
const runtime = ["index.html", "js/main.js", "js/app-shell.js", "js/catalog.js", "js/catalog-ui.js", "js/ui.js", "package.json"]
  .map((path) => readFileSync(path, "utf8")).join("\n");
assert.equal(/gemini|api\/chat|ai-assistant|chat-(?:menu-popover|sidebar)|catalog=igdb|images\.igdb|igdb:|igdbImageUrl/i.test(runtime), false);
assert.equal(existsSync("data/nintendo_catalog.json"), true);
console.log("[OK] Runtime estatico sin IA, backend ni catalogo heredado");

import assert from "node:assert/strict";
import { GETTING_STARTED_STEPS, normalizeGettingStartedProgress, readGettingStartedProgress, writeGettingStartedProgress } from "../js/getting-started.js";
assert.equal(GETTING_STARTED_STEPS.length,17); assert.equal(new Set(GETTING_STARTED_STEPS).size,17); console.log("[OK] define 17 pasos unicos");
assert.deepEqual(normalizeGettingStartedProgress(["check-console","invalid","check-console"]),["check-console"]); console.log("[OK] limpia pasos invalidos y duplicados");
const data=new Map(); const storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)}; writeGettingStartedProgress(["check-console","connect-wifi"],storage); assert.deepEqual(readGettingStartedProgress(storage),["check-console","connect-wifi"]); console.log("[OK] persiste el progreso");
data.set("heartagram:getting-started-progress:v1","bad-json"); assert.deepEqual(readGettingStartedProgress(storage),[]); console.log("[OK] tolera almacenamiento corrupto");
console.log("\n[OK] QA de Inicia aqui completo");

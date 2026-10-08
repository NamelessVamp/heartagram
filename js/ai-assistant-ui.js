// Chat presentation with a rule-based response adapter. History is not semantic memory.
import { buildAIContext, MAX_MESSAGE_LENGTH } from "./ai-context.js";
import { generateLocalAssistantResponse } from "./ai-local.js";
import { getFavoriteIds } from "./favorites.js";
import { getOwnedGameIds } from "./library.js";
import { loadThreads, saveThreads, shouldSend } from "./chat-store.js";
let initialized=false;
export function initializeLocalAssistant({getProfile,getGames}) {
  if(initialized) return;
  const byId=id=>document.getElementById(id);
  const form=byId("assistant-form"), input=byId("assistant-input");
  if(!form || !input) return;
  initialized=true;
  let storage;
  try { storage=window.localStorage; } catch { storage=null; }
  let threads=loadThreads(storage), active=threads.at(-1)?.id;
  const current=()=>threads.find(t=>t.id===active);
  const persist=()=>{
    if(!saveThreads(threads,storage)) byId("chat-status").textContent="No se pudo guardar el historial en este navegador.";
  };
  function newThread() {
    const thread={id:crypto.randomUUID(),title:"Nueva conversación",messages:[]};
    threads.push(thread); threads=threads.slice(-20); active=thread.id;
    persist(); render(); input.focus();
  }
  function render() {
    const thread=current();
    const history=byId("chat-threads"); history.replaceChildren();
    [...threads].reverse().forEach(t=>{
      const b=document.createElement("button"); b.type="button"; b.textContent=t.title;
      b.setAttribute("aria-pressed",String(t.id===active));
      b.onclick=()=>{active=t.id;render();}; history.append(b);
    });
    const log=byId("chat-messages"); log.replaceChildren();
    for(const message of thread?.messages || []) {
      const article=document.createElement("article"); article.className=`chat-message chat-${message.role}`;
      const label=document.createElement("strong"); label.textContent=message.role==="user"?"Tú":"HEARTAGRAM";
      const p=document.createElement("p"); p.textContent=message.content; article.append(label,p);log.append(article);
    }
    byId("chat-starters").hidden=Boolean(thread?.messages.length);
    document.querySelector(".chat-screen").classList.toggle("chat-is-empty", !thread?.messages.length);
    byId("chat-empty").hidden=Boolean(thread?.messages.length);
    requestAnimationFrame(()=>{const body=document.querySelector(".chat-body"); if(body) body.scrollTop=body.scrollHeight;});
  }
  function send() {
    const message=input.value.trim().slice(0,MAX_MESSAGE_LENGTH);
    if(!message) return;
    if(!current()) newThread();
    const thread=current();
    if(!thread.messages.length) thread.title=message.slice(0,50);
    thread.messages.push({role:"user",content:message});
    try {
      const context=buildAIContext({profile:getProfile(),games:getGames(),favoriteIds:getFavoriteIds(),ownedIds:getOwnedGameIds(),message});
      thread.messages.push({role:"assistant",content:generateLocalAssistantResponse(context,getGames())});
    } catch {
      thread.messages.push({role:"assistant",content:"No pude preparar la respuesta. Intenta de nuevo."});
    }
    thread.messages=thread.messages.slice(-40); input.value="";persist();render();input.focus();
  }
  input.maxLength=MAX_MESSAGE_LENGTH;
  const sendButton=form.querySelector('[type="submit"]');
  sendButton.textContent="↑";
  function resizeComposer() {
    input.style.height="44px";
    input.style.height=Math.min(input.scrollHeight,160)+"px";
    sendButton.disabled=!input.value.trim();
  }
  input.addEventListener("input",resizeComposer);
  form.addEventListener("submit",()=>requestAnimationFrame(resizeComposer));
  input.addEventListener("keydown",()=>requestAnimationFrame(resizeComposer));
  document.querySelectorAll("[data-assistant-prompt]").forEach(b=>b.addEventListener("click",()=>requestAnimationFrame(resizeComposer)));
  resizeComposer();

  form.addEventListener("submit",e=>{e.preventDefault();send();});
  input.addEventListener("keydown",e=>{if(shouldSend(e)){e.preventDefault();send();}});
  byId("chat-new").onclick=newThread;
  byId("chat-delete").onclick=()=>{
    if(!current() || !window.confirm("¿Eliminar esta conversación de este navegador?"))return;
    threads=threads.filter(t=>t.id!==active);active=threads.at(-1)?.id;persist();render();
  };
  document.querySelectorAll("[data-assistant-prompt]").forEach(b=>{
    b.onclick=()=>{input.value=b.dataset.assistantPrompt;send();};
  });
  render();
}

import {showWebSources} from './chat-web-sources.js';
// Chat UX V2: streamed responses; no local answer generator.
import {buildAIContext,MAX_MESSAGE_LENGTH} from './ai-context.js';
import {getFavoriteIds} from './favorites.js';
import {getOwnedGameIds} from './library.js';
import {loadThreads,saveThreads,shouldSend} from './chat-store.js';
import {renderMarkdown} from './chat-markdown.js';
let initialized=false;
export function initializeLocalAssistant({getProfile,getGames}){
 if(initialized)return;const $=id=>document.getElementById(id),form=$('assistant-form'),input=$('assistant-input');if(!form||!input)return;initialized=true;
 let storage;try{storage=localStorage;}catch{storage=null;}
 let threads=loadThreads(storage),active=threads.at(-1)?.id,busy=false,pending=null,controller=null,live=null;
 const status=$('chat-status'),sendButton=form.querySelector('[type="submit"]'),body=document.querySelector('.chat-body');
 const current=()=>threads.find(t=>t.id===active);
 const persist=()=>{if(!saveThreads(threads,storage)){status.hidden=false;status.textContent='No se pudo guardar el historial.';}};
 function resize(){input.style.height='48px';input.style.height=Math.min(input.scrollHeight,160)+'px';input.style.overflowY=input.scrollHeight>160?'auto':'hidden';sendButton.textContent=busy?'■':'↑';sendButton.setAttribute('aria-label',busy?'Detener recepción':'Enviar mensaje');sendButton.disabled=!busy&&!input.value.trim();}
 function follow(update){const near=body.scrollHeight-body.scrollTop-body.clientHeight<100;update();if(near)requestAnimationFrame(()=>body.scrollTop=body.scrollHeight);}
 function bubble(message){const article=document.createElement('article');article.className='chat-message chat-'+message.role;const label=document.createElement('strong');label.textContent=message.role==='user'?'Tú':'HEARTAGRAM';const content=document.createElement('div');content.className='chat-rich';if(message.role==='assistant')renderMarkdown(content,message.content);else content.textContent=message.content;article.append(label,content);
 if(message.role==='assistant'){const copy=document.createElement('button');copy.type='button';copy.className='chat-small-action';copy.textContent='Copiar';copy.onclick=async()=>{try{await navigator.clipboard.writeText(message.content);copy.textContent='Copiado';}catch{copy.textContent='No se pudo copiar';}};article.append(copy);}return article;}
 /* HEARTAGRAM_CHAT_HISTORY_V2 */
 function getPinnedIds(){try{return new Set(JSON.parse(storage?.getItem('heartagram:pinned-threads')||'[]'));}catch{return new Set();}}
 function savePinnedIds(ids){try{storage?.setItem('heartagram:pinned-threads',JSON.stringify([...ids]));}catch{}}
 function deleteThread(id){threads=threads.filter(thread=>thread.id!==id);const pins=getPinnedIds();pins.delete(id);savePinnedIds(pins);if(active===id)active=threads.at(-1)?.id;pending=null;live=null;persist();render();}
 function renameThread(thread){const value=prompt('Cambiar nombre de la conversación',thread.title||'Sin título');if(value===null)return;const title=value.trim().slice(0,60);if(!title)return;thread.title=title;persist();render();}
 function createThreadRow(thread,pinned){
  const row=document.createElement('div');row.className='chat-thread-row';
  const select=document.createElement('button');select.type='button';select.className='chat-thread-select';select.disabled=busy;select.title=thread.title;select.setAttribute('aria-pressed',String(thread.id===active));
  const pin=document.createElement('span');pin.className='chat-thread-pin';pin.textContent=pinned?'✦':'';pin.setAttribute('aria-hidden','true');
  const title=document.createElement('span');title.className='chat-thread-title';title.textContent=thread.title||'Sin título';select.append(pin,title);
  select.onclick=()=>{active=thread.id;pending=null;live=null;render();};
  const menu=document.createElement('details');menu.className='chat-thread-menu';
  const summary=document.createElement('summary');summary.setAttribute('aria-label','Opciones para '+(thread.title||'conversación'));summary.textContent='⋯';
  const actions=document.createElement('div');actions.className='chat-thread-actions';
  const pinButton=document.createElement('button');pinButton.type='button';pinButton.textContent=pinned?'Quitar de fijados':'Fijar';pinButton.onclick=()=>{const pins=getPinnedIds();pinned?pins.delete(thread.id):pins.add(thread.id);savePinnedIds(pins);render();};
  const renameButton=document.createElement('button');renameButton.type='button';renameButton.textContent='Cambiar nombre';renameButton.onclick=()=>renameThread(thread);
  const deleteButton=document.createElement('button');deleteButton.type='button';deleteButton.textContent='Borrar';deleteButton.className='chat-thread-delete';deleteButton.onclick=()=>{if(confirm('¿Eliminar esta conversación?'))deleteThread(thread.id);};
  actions.append(pinButton,renameButton,deleteButton);menu.append(summary,actions);row.append(select,menu);return row;
 }
 function render(){const t=current(),history=$('chat-threads'),log=$('chat-messages');history.replaceChildren();const pins=getPinnedIds();const visible=threads.filter(thread=>thread.messages?.length).sort((a,b)=>Number(pins.has(b.id))-Number(pins.has(a.id)));visible.forEach(thread=>history.append(createThreadRow(thread,pins.has(thread.id))));log.replaceChildren();(t?.messages||[]).forEach(m=>log.append(bubble(m)));if(live)log.append(live.article);$('chat-starters').hidden=Boolean(t?.messages.length);$('chat-empty').hidden=Boolean(t?.messages.length);document.querySelector('.chat-screen').classList.toggle('chat-is-empty',!t?.messages.length);$('chat-new').disabled=busy;$('chat-delete').hidden=true;resize();}
 function newThread(){if(busy)return;const t={id:crypto.randomUUID(),title:'Nueva conversación',messages:[]};threads.push(t);threads=threads.slice(-20);active=t.id;pending=null;live=null;persist();render();}
 function makeLive(){const article=bubble({role:'assistant',content:''});article.querySelector('.chat-small-action')?.remove();const rich=article.querySelector('.chat-rich');const indicator=document.createElement('div');indicator.className='chat-thinking';indicator.setAttribute('role','status');const star=document.createElement('span');star.className='chat-thinking-mark';star.textContent='H';star.setAttribute('aria-hidden','true');const label=document.createElement('span');label.textContent='Preparando respuesta…';indicator.append(star,label);const details=document.createElement('details');details.className='chat-thought-summary';details.hidden=true;const summary=document.createElement('summary');summary.textContent='Resumen del proceso';const summaryText=document.createElement('div');details.append(summary,summaryText);article.insertBefore(indicator,rich);article.insertBefore(details,rich);return{article,rich,indicator,label,details,summaryText,text:'',summary:'',error:null};}
 function friendlyChatError(error){
  const raw=String(error?.message||'').trim();
  const status=Number(error?.status||0);
  if(error?.name==='AbortError')return{code:'STOPPED',title:'Recepción detenida',message:'La respuesta se detuvo. Puedes reintentar sin volver a escribir tu mensaje.'};
  if(status===429||/429|cuota|límite de solicitudes/i.test(raw))return{code:'BUSY',title:'Demasiadas solicitudes',message:'Gemini está ocupado o alcanzó temporalmente su límite. Intenta nuevamente desde esta conversación.'};
  if(status===503||/503|temporalmente no disponible|high demand|unavailable/i.test(raw))return{code:'UNAVAILABLE',title:'Señal temporalmente interrumpida',message:'Gemini está recibiendo alta demanda. Tu conversación sigue guardada y puedes reintentar.'};
  if(/timeout|tiempo de espera/i.test(raw))return{code:'TIMEOUT',title:'La respuesta tardó demasiado',message:'La conexión agotó el tiempo de espera. Puedes intentarlo nuevamente.'};
  if(/failed to fetch|network|conexión interrumpida|no se pudo conectar/i.test(raw))return{code:'OFFLINE',title:'Sin conexión con Gemini',message:'No fue posible completar la conexión. Revisa tu red y reintenta.'};
  return{code:'ERROR',title:'No se pudo completar la respuesta',message:raw||'Ocurrió un error inesperado. Puedes reintentar.'};
 }
 function chatRequestError(message,status=0){const error=new Error(message);error.status=status;return error;}
 async function requestResponse(){if(busy||!pending)return;busy=true;live=makeLive();controller=new AbortController();render();requestAnimationFrame(()=>body.scrollTop=body.scrollHeight);let completed=false;
 const timeout=setTimeout(()=>controller.abort(),180000);
 try{const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pending.payload),signal:controller.signal});if(!response.ok){let value={};try{value=await response.json();}catch{}throw chatRequestError(value.error||'Solicitud rechazada.',response.status);}if(!response.headers.get('content-type')?.includes('application/x-ndjson'))throw Error('Reinicia el backend actualizado.');
 const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='';
 function event(e){follow(()=>{if(e.type==='status')live.label.textContent=e.text;if(e.type==='grounding')showWebSources(live.article,e.metadata);if(e.type==='summary'){live.summary+=e.text;live.details.hidden=false;live.summaryText.textContent=live.summary;live.label.textContent='Preparando respuesta…';}if(e.type==='delta'){live.text+=e.text;live.label.textContent='Generando respuesta…';renderMarkdown(live.rich,live.text);}if(e.type==='error')throw Error(e.text);if(e.type==='done')completed=true;});}
 while(true){const {value,done}=await reader.read();if(done){buffer+=decoder.decode();break;}buffer+=decoder.decode(value,{stream:true});let i;while((i=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,i);buffer=buffer.slice(i+1);if(line.trim())event(JSON.parse(line));}}
 if(buffer.trim())event(JSON.parse(buffer));if(!completed)throw Error('La respuesta se interrumpió.');
 const t=current();t.messages.push({role:'assistant',content:live.text});t.messages=t.messages.slice(-40);persist();pending=null;live.indicator.remove();const copy=document.createElement('button');copy.type='button';copy.className='chat-small-action';copy.textContent='Copiar';const text=live.text;copy.onclick=()=>navigator.clipboard.writeText(text).catch(()=>{copy.textContent='No se pudo copiar';});live.article.append(copy);live=null;
 }catch(error){live.indicator.remove();const detail=friendlyChatError(error);const panel=document.createElement('section');panel.className='chat-error-panel';panel.dataset.errorCode=detail.code;panel.setAttribute('role','alert');const eyebrow=document.createElement('span');eyebrow.className='chat-error-eyebrow';eyebrow.textContent='⟦ SIGNAL INTERRUPTED ⟧';const title=document.createElement('strong');title.className='chat-error-title';title.textContent=detail.title;const notice=document.createElement('p');notice.className='chat-inline-error';notice.textContent=detail.message;panel.append(eyebrow,title,notice);live.article.append(panel);if(live.text){current().messages.push({role:'assistant',content:live.text+'\n\n[Respuesta incompleta]'});persist();}const retry=document.createElement('button');retry.type='button';retry.className='chat-small-action chat-retry-action';retry.textContent='Reintentar';retry.onclick=()=>{if(!busy){live=null;requestResponse();}};panel.append(retry);
 }finally{clearTimeout(timeout);busy=false;controller=null;resize();$('chat-new').disabled=false;$('chat-delete').disabled=!current();document.querySelectorAll('#chat-threads button').forEach(b=>b.disabled=false);}
 }
 function send(){if(busy){controller?.abort();return;}const message=input.value.trim().slice(0,MAX_MESSAGE_LENGTH);if(!message)return;if(!current())newThread();const t=current(),history=t.messages.slice(-16);if(!t.messages.length){const clean=message.replace(/\s+/g,' ').trim();t.title=/^(hola|hello|hey|buenas)[.!? ]*$/i.test(clean)?'Conversación nueva':clean.slice(0,42);}t.messages.push({role:'user',content:message});pending={payload:{context:buildAIContext({profile:getProfile(),games:getGames(),favoriteIds:getFavoriteIds(),ownedIds:getOwnedGameIds(),message}),history}};input.value='';persist();requestResponse();}
 input.maxLength=MAX_MESSAGE_LENGTH;input.addEventListener('input',resize);form.addEventListener('submit',e=>{e.preventDefault();send();});input.addEventListener('keydown',e=>{if(shouldSend(e)){e.preventDefault();if(!busy)send();}});$('chat-new').onclick=newThread;$('chat-delete').onclick=()=>{if(busy||!current()||!confirm('¿Eliminar esta conversación?'))return;threads=threads.filter(t=>t.id!==active);active=threads.at(-1)?.id;live=null;pending=null;persist();render();};document.querySelectorAll('[data-assistant-prompt]').forEach(b=>b.onclick=()=>{if(busy)return;input.value=b.dataset.assistantPrompt;send();});status.textContent='';status.hidden=true;render();
}

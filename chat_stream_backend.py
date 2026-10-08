"""Streaming transport for the existing loopback-only development server."""
import json,os,re,time,random
from urllib.request import Request,urlopen
from urllib.error import HTTPError,URLError

def iter_sse(lines):
    data=[]
    for raw in lines:
        line=raw.decode('utf-8').rstrip('\r\n')
        if not line:
            if data:
                value='\n'.join(data);data=[]
                if value!='[DONE]':yield json.loads(value)
        elif line.startswith('data:'):data.append(line[5:].lstrip())
    if data and '\n'.join(data)!='[DONE]':yield json.loads('\n'.join(data))

def model_chain():
    raw=os.getenv('GEMINI_MODELS') or os.getenv('GEMINI_MODEL','')
    names=list(dict.fromkeys(x.strip().removeprefix('models/') for x in raw.split(',') if x.strip()))
    if len(names)>3 or any(not re.fullmatch(r'[a-zA-Z0-9._-]+',x) for x in names):return []
    return names

def install_streaming(Handler,build_payload,GATE):
    def do_POST(self):
        if not self.allowed_host() or self.path!='/api/chat':self.reply(403,{'error':'Solicitud no permitida'});return
        if self.headers.get('Origin') not in ('http://127.0.0.1:8000','http://localhost:8000'):self.reply(403,{'error':'Origen no permitido'});return
        key=os.getenv('GEMINI_API_KEY','');models=model_chain();model=models[0] if models else ''
        if not key or not models:self.reply(503,{'error':'Falta configurar clave o modelo en .env'});return
        if not GATE.acquire(blocking=False):self.reply(429,{'error':'Otra solicitud sigue activa. Reintenta al terminar.'});return
        started=False
        def emit(kind,**values):
            self.wfile.write((json.dumps({'type':kind,**values},ensure_ascii=False)+'\n').encode());self.wfile.flush()
        try:
            length=int(self.headers.get('Content-Length','0'))
            if not 0<length<=100000:raise ValueError()
            payload=build_payload(json.loads(self.rfile.read(length)),self.server.games)
            generation_config = payload.setdefault("generationConfig", {})
            generation_config["maxOutputTokens"] = 8192
            if os.getenv('GEMINI_WEB_SEARCH','false').lower()=='true':
                payload['tools']=[{'google_search':{}}]
            if os.getenv('GEMINI_THOUGHT_SUMMARIES','true').lower()=='true':
                generation_config.setdefault("thinkingConfig", {})["includeThoughts"] = True
            self.send_response(200);self.send_header('Content-Type','application/x-ndjson; charset=utf-8');self.send_header('Cache-Control','no-store');self.send_header('Connection','close');self.end_headers();started=True;self.close_connection=True
            emit('status',text='Preparando respuesta…')
            response=None
            for attempt,model in enumerate(models):
                try:
                    req=Request('https://generativelanguage.googleapis.com/v1beta/models/'+model+':streamGenerateContent?alt=sse',data=json.dumps(payload).encode(),headers={'Content-Type':'application/json','x-goog-api-key':key},method='POST')
                    response=urlopen(req,timeout=60);break
                except HTTPError as error:
                    detail = error.read().decode("utf-8", errors="replace")
                    print(f"[API ERROR] model={model} status={error.code}", flush=True)
                    print(detail.replace(key, "[REDACTED]"), flush=True)
                    if error.code in (408,500,502,503,504) and attempt<len(models)-1:
                        emit('status',text='La conexión está ocupada. Probando otra opción…');time.sleep(2**attempt+random.random());continue
                    messages={503:'Gemini está temporalmente no disponible.',429:'Límite de solicitudes o cuota alcanzado.',401:'Revisa la clave del servidor.',403:'La clave o el proyecto no tienen permiso.',400:'El modelo no acepta la configuración. Revisa modelo y resúmenes.',404:'El modelo configurado no está disponible.'}
                    emit('error',text=messages.get(error.code,'No se pudo completar la solicitud.')+f' (HTTP {error.code})');return
            text_seen=False;finish=None
            with response:
                for chunk in iter_sse(response):
                    for candidate in chunk.get('candidates',[]):
                        if candidate.get('groundingMetadata'):emit('grounding',metadata=candidate['groundingMetadata'])
                        finish=candidate.get('finishReason',finish)
                        for part in (candidate.get('content') or {}).get('parts',[]):
                            text=part.get('text')
                            if not isinstance(text,str) or not text:continue
                            if part.get('thought'):emit('summary',text=text)
                            else:text_seen=True;emit('delta',text=text)
            if not text_seen:emit('error',text='Gemini no devolvió una respuesta visible. Reintenta.');return
            if finish!='STOP':emit('error',text='Respuesta incompleta o interrumpida por el proveedor.');return
            emit('done')
        except (BrokenPipeError,ConnectionResetError):pass
        except (ValueError,TypeError):
            if started:emit('error',text='No se pudo interpretar la respuesta.')
            else:self.reply(400,{'error':'Solicitud inválida.'})
        except (URLError,TimeoutError,OSError):
            if started:
                try:emit('error',text='Conexión interrumpida. Puedes reintentar.')
                except OSError:pass
            else:self.reply(502,{'error':'No se pudo conectar.'})
        finally:GATE.release()
    Handler.do_POST=do_POST

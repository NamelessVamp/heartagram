// Render provider metadata separately; never insert provider HTML into the main DOM.
export function showWebSources(article,metadata){
 article.querySelector('.chat-web-sources')?.remove();
 const box=document.createElement('section');box.className='chat-web-sources';
 const title=document.createElement('h4');title.textContent='Fuentes consultadas';box.append(title);
 for(const chunk of metadata.groundingChunks||[]){const web=chunk.web;let url;try{url=new URL(web?.uri);}catch{continue;}if(url.protocol!=='https:')continue;
 const link=document.createElement('a');link.href=url.href;link.textContent=web.title||url.hostname;link.target='_blank';link.rel='noopener noreferrer';box.append(link,document.createTextNode(' · '));}
 if(metadata.searchEntryPoint?.renderedContent){const frame=document.createElement('iframe');frame.title='Sugerencias de Google Search';frame.setAttribute('sandbox','allow-popups allow-popups-to-escape-sandbox');frame.srcdoc=metadata.searchEntryPoint.renderedContent;frame.style.cssText='display:block;width:100%;height:180px;border:0;';box.append(frame);}
 article.append(box);
}

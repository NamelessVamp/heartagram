// Small Markdown subset rendered with DOM nodes, never raw HTML.
export function inlineNodes(text,doc=document){
 const fragment=doc.createDocumentFragment();
 const pattern=/\*\*([^*]+)\*\*|(?<!\*)\*([^*]+)\*(?!\*)|`([^`]+)`/g;let start=0;
 for(const match of text.matchAll(pattern)){
  fragment.append(doc.createTextNode(text.slice(start,match.index)));
  const node=doc.createElement(match[1]?'strong':match[2]?'em':'code');node.textContent=match[1]||match[2]||match[3];fragment.append(node);start=match.index+match[0].length;
 }
 fragment.append(doc.createTextNode(text.slice(start)));return fragment;
}
export function renderMarkdown(target,text){
 target.replaceChildren();let list=null,code=null;
 for(const line of text.split('\n')){
  if(line.startsWith('```')){if(code){code=null;}else{const pre=document.createElement('pre');code=document.createElement('code');pre.append(code);target.append(pre);}list=null;continue;}
  if(code){code.textContent+=line+'\n';continue;}
  const item=line.match(/^\s*(?:([-*])|\d+\.)\s+(.+)$/);
  if(item){const tag=item[1]?'ul':'ol';if(!list||list.tagName.toLowerCase()!==tag){list=document.createElement(tag);target.append(list);}const li=document.createElement('li');li.append(inlineNodes(item[2]));list.append(li);continue;}
  list=null;if(!line.trim())continue;if(/^---+$/.test(line.trim())){target.append(document.createElement('hr'));continue;}const quote=line.match(/^>\s?(.+)$/);if(quote){const block=document.createElement('blockquote');block.append(inlineNodes(quote[1]));target.append(block);continue;}
  const numbered=line.match(/^\d{1,2}\s*\/\/\s*.+$/);const heading=line.match(/^#{1,3}\s+(.+)$/);const p=document.createElement(heading||numbered?'h3':'p');p.append(inlineNodes(heading?heading[1]:line));target.append(p);
 }
}

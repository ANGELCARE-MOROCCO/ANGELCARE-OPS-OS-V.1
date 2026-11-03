/** Trusted, preview-only instrumentation. Not included in public released HTML. */
export const KIDFLIX_PREVIEW_STUDIO_SCRIPT=String.raw`
(()=>{
 const params=new URLSearchParams(location.hash.slice(1)), channel=params.get('kfchannel')||'';
 if(!/^[a-f0-9-]{36}$/i.test(channel)||window===window.parent)return;
 const origin=__KIDFLIX_PARENT_ORIGIN__;
 let active=false,selected=null,previous='';
 const send=(action,data={})=>window.parent.postMessage({contract:'kidflix.interactive.bridge.1',channel,action,data},origin);
 const stable=(el)=>{const edit=el.getAttribute('data-kf-edit');if(edit&&/^[a-zA-Z0-9_-]{1,80}$/.test(edit))return '[data-kf-edit="'+edit+'"]';const id=el.getAttribute('id');if(id&&/^[a-zA-Z_][\w-]{0,80}$/.test(id))return '#'+id;return ''};
 const outline=(el)=>{if(selected&&selected!==el)selected.style.outline=previous;selected=el;previous=el.style.outline;el.style.outline='3px solid #08b6a2';};
 const info=(el)=>{const style=getComputedStyle(el),rect=el.getBoundingClientRect();return {
  selector:stable(el),tag:el.tagName.toLowerCase(),label:(el.getAttribute('aria-label')||el.textContent||'').trim().slice(0,100),
  width:Math.round(rect.width),height:Math.round(rect.height),
  styles:{color:style.color,backgroundColor:style.backgroundColor,fontSize:style.fontSize,borderRadius:style.borderRadius,padding:style.padding}
 }};
 document.addEventListener('click',e=>{
  if(!active)return;
  const el=e.target instanceof Element?e.target.closest('[data-kf-edit], [id]'):null;
  if(!el||el.closest('#kidflix-host-authenticity'))return;
  e.preventDefault();e.stopImmediatePropagation();outline(el);send('studio.select',info(el));
 },true);
 window.addEventListener('message',e=>{
  if(e.source!==parent||e.origin!==origin||e.data?.contract!=='kidflix.interactive.bridge.1'||e.data?.channel!==channel)return;
  const action=e.data.action,d=e.data.data||{};
  if(action==='studio.inspect.set'){
   active=d.enabled===true;if(!active&&selected){selected.style.outline=previous;selected=null}
   send('studio.inspect.status',{enabled:active});
  }
  if(action==='studio.inspect.apply'&&active){
   const allowed=new Set(['color','backgroundColor','fontSize','borderRadius','padding']);
   const property=String(d.property||''),value=String(d.value||'').slice(0,100),selector=String(d.selector||'');
   if(!allowed.has(property)||!selector||!selected||stable(selected)!==selector||/url\(|expression\(|[{};<>]/i.test(value))return;
   selected.style[property]=value;send('studio.select',info(selected));
  }
 });
 window.addEventListener('error',e=>{
  const target=e.target;if(target&&target!==window){send('studio.assetError',{source:String(target.src||target.href||'').slice(0,190)});return}
  send('studio.runtimeError',{message:String(e.message||'JavaScript error').slice(0,300),file:String(e.filename||'').slice(0,160),line:Number(e.lineno)||0});
 },true);
 window.addEventListener('unhandledrejection',e=>send('studio.runtimeError',{message:String(e.reason?.message||e.reason||'Unhandled rejection').slice(0,300)}));
 send('studio.inspect.available',{elements:document.querySelectorAll('[data-kf-edit], [id]').length});
})();
`;
export function previewStudioScript(parentOrigin:string){
 const u=new URL(parentOrigin);if(u.protocol!=='https:')throw Error('INVALID_PARENT_ORIGIN');
 return KIDFLIX_PREVIEW_STUDIO_SCRIPT.replace('__KIDFLIX_PARENT_ORIGIN__',JSON.stringify(u.origin));
}

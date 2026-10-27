'use client';

import {useEffect,useRef,useState} from 'react';
import {usePathname,useRouter,useSearchParams} from 'next/navigation';
import type {Locale} from '../contracts';
import {JOBKIX_NAV_CANCEL,JOBKIX_NAV_START} from './navigation-buffer-events';
import s from './navigation-buffer.module.css';

type Phase = 'idle'|'waiting'|'slow';
type Labels = {opening:string;slow:string;retry:string;dismiss:string;role:string};
const COPY:Record<Locale,Labels>={
 en:{opening:'Opening…',slow:'Still loading…',retry:'Retry',dismiss:'Dismiss',role:'JOBKIX navigation'},
 fr:{opening:'Ouverture…',slow:'Chargement en cours…',retry:'Réessayer',dismiss:'Fermer',role:'Navigation JOBKIX'},
 es:{opening:'Abriendo…',slow:'Sigue cargando…',retry:'Reintentar',dismiss:'Cerrar',role:'Navegación JOBKIX'},
 hi:{opening:'खुल रहा है…',slow:'अभी लोड हो रहा है…',retry:'फिर कोशिश करें',dismiss:'बंद करें',role:'JOBKIX नेविगेशन'},
 tl:{opening:'Binubuksan…',slow:'Naglo-load pa…',retry:'Subukan muli',dismiss:'Isara',role:'JOBKIX navigation'},
 id:{opening:'Membuka…',slow:'Masih memuat…',retry:'Coba lagi',dismiss:'Tutup',role:'Navigasi JOBKIX'},
 ar:{opening:'جارٍ الفتح…',slow:'ما زال التحميل جارياً…',retry:'إعادة المحاولة',dismiss:'إغلاق',role:'التنقل في JOBKIX'}
};
const SHOW_AFTER_MS=110;
const ACTIONS_AFTER_MS=5800;
const ROUTE_PREFIX='/jobkix/';
function routeLocation(){return window.location.pathname+window.location.search;}
function eligibleAnchor(event:MouseEvent):string|null{
 if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return null;
 if(!(event.target instanceof Element))return null;
 const link=event.target.closest('a[href]');
 if(!(link instanceof HTMLAnchorElement)||link.hasAttribute('download')||link.getAttribute('aria-disabled')==='true')return null;
 if(link.target&&link.target!=='_self')return null;
 if(link.rel.split(/\s+/).includes('external'))return null;
 let target:URL;
 try{target=new URL(link.href,window.location.href)}catch{return null;}
 if(target.origin!==window.location.origin||!target.pathname.startsWith(ROUTE_PREFIX))return null;
 if(target.pathname+target.search===routeLocation())return null; // Same route/fragment isn't a page load.
 return target.pathname+target.search+target.hash;
}

/**
 * Native JOBKIX navigation feedback. It never blocks or replaces Next's navigation:
 * App Router retains the old screen until its destination is committed.
 * Cancel/Dismiss only hides feedback; it cannot cancel a Next.js in-flight request.
 */
export function NavigationBuffer({locale}:{locale:Locale}){
 const router=useRouter(),pathname=usePathname(),search=useSearchParams();
 const [phase,setPhase]=useState<Phase>('idle');
 const destination=useRef<string|null>(null);
 const clocks=useRef<{show?:ReturnType<typeof setTimeout>;slow?:ReturnType<typeof setTimeout>}>({});
 const suppressed=useRef<string|null>(null);
 const retryable=useRef(true);
 const ticket=useRef(0);
 const previousRoute=useRef<string|null>(null);
 const locationKey=(pathname||'')+(search?.toString()?'?'+search.toString():'');
 const copy=COPY[locale]||COPY.en;

 // Clear only feedback timers, not Next's native page transition.
 function stopTimers(){if(clocks.current.show)clearTimeout(clocks.current.show);if(clocks.current.slow)clearTimeout(clocks.current.slow);clocks.current={};}
 function reset(){ticket.current++;stopTimers();destination.current=null;setPhase('idle');}
 function begin(raw:string,fromHistory=false,canRetry=true){
  let parsed:URL;
  try{parsed=new URL(raw,window.location.href)}catch{return;}
  if(parsed.origin!==window.location.origin||!parsed.pathname.startsWith(ROUTE_PREFIX))return;
  const normalized=parsed.pathname+parsed.search;
  if(!fromHistory&&normalized===routeLocation())return;
  if(suppressed.current===normalized)return;
  if(destination.current===normalized)return;
  ticket.current++;const id=ticket.current;
  stopTimers();destination.current=normalized;retryable.current=canRetry;
  // Avoid flickering for instantaneous transitions, without making slow ones invisible.
  setPhase('idle');
  clocks.current.show=setTimeout(()=>{if(id===ticket.current)setPhase('waiting');},SHOW_AFTER_MS);
  clocks.current.slow=setTimeout(()=>{if(id===ticket.current)setPhase('slow');},ACTIONS_AFTER_MS);
 }

 // Complete on the committed pathname AND search-params change (incl. filter navigation).
 useEffect(()=>{
  const prior=previousRoute.current;
  previousRoute.current=locationKey;
  if(prior!==null&&prior!==locationKey){suppressed.current=null;reset();}
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[locationKey]);

 useEffect(()=>{
  function onClick(event:MouseEvent){
   const target=eligibleAnchor(event);
   if(!target)return;
   // Next Link deliberately calls preventDefault() during bubbling to perform client navigation.
   // Begin in capture; checking event.defaultPrevented after bubbling would skip every Next Link.
   begin(target);
  }
  function onStart(event:Event){const detail=(event as CustomEvent<{destination?:string;retryable?:boolean}>).detail;if(typeof detail?.destination==='string')begin(detail.destination,false,detail.retryable!==false);}
  function onCancel(){reset();}
  function onPopState(){
   // Browser history changes location before React commits the new screen.
   if(routeLocation()!==previousRoute.current)begin(routeLocation(),true);
  }
  function onPageHide(){reset();}
  document.addEventListener('click',onClick,true);
  window.addEventListener(JOBKIX_NAV_START,onStart);
  window.addEventListener(JOBKIX_NAV_CANCEL,onCancel);
  window.addEventListener('popstate',onPopState);
  window.addEventListener('pagehide',onPageHide);
  return ()=>{
   document.removeEventListener('click',onClick,true);
   window.removeEventListener(JOBKIX_NAV_START,onStart);
   window.removeEventListener(JOBKIX_NAV_CANCEL,onCancel);
   window.removeEventListener('popstate',onPopState);
   window.removeEventListener('pagehide',onPageHide);
   ticket.current++;stopTimers();
  };
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);

 function retry(){
  const target=destination.current;if(!target)return;
  suppressed.current=null;
  reset();
  begin(target);
  router.push(target);
  router.refresh();
 }
 function dismiss(){
  suppressed.current=destination.current;
  reset();
 }
 if(phase==='idle')return null;
 return <div className={s.overlay} data-jobkix-navigation-buffer aria-live="polite" aria-atomic="true">
  <section className={s.buffer} role="status" aria-label={copy.role} dir="ltr">
   <i className={`${s.rim} ${s.top}`} aria-hidden="true"/>
   <i className={`${s.rim} ${s.right}`} aria-hidden="true"/>
   <i className={`${s.rim} ${s.bottom}`} aria-hidden="true"/>
   <i className={`${s.rim} ${s.left}`} aria-hidden="true"/>
   <div className={s.logoWindow} aria-label="JOBKIX">
    <img src="/jobkix/brand/jobkix-logo-color.png" width="1349" height="518" alt="" className={s.logo} draggable={false}/>
    <span className={s.logoGleam} aria-hidden="true"/>
   </div>
   <span className={s.caption}>{phase==='slow'?copy.slow:copy.opening}</span>
   {phase==='slow'?<div className={s.actions}>
    {retryable.current?<><button onClick={retry} type="button">{copy.retry}</button><span aria-hidden="true"/></>:null}
    <button onClick={dismiss} type="button">{copy.dismiss}</button>
   </div>:null}
  </section>
 </div>;
}

"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { type Locale } from "./catalogue";
import { navigationEvent, navigateKidFlix } from "./navigation-events";
import { NavigationToast } from "./NavigationToast";
function Lifecycle({locale}:{locale:Locale}) {
  const pathname=usePathname(),search=useSearchParams(),key=pathname+"?"+search.toString(),router=useRouter(),routerRef=useRef(router);
  routerRef.current=router;
  const [state,setState]=useState<"idle"|"pending"|"slow"|"error">("idle"), target=useRef(""), delay=useRef<ReturnType<typeof setTimeout>|undefined>(undefined), slow=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  function clear(){clearTimeout(delay.current);clearTimeout(slow.current);setState("idle");}
  useEffect(()=>{clear();},[key]);
  useEffect(()=>{
    function start(href:string){clear();target.current=href;delay.current=setTimeout(()=>setState("pending"),180);slow.current=setTimeout(()=>setState("slow"),10000);}
    function event(e:Event){const detail=(e as CustomEvent<{phase:string;href:string}>).detail;if(detail?.phase==="navigate"){if(e.defaultPrevented)return;e.preventDefault();start(detail.href);try{const url=new URL(detail.href);routerRef.current.push(url.pathname+url.search+url.hash);}catch{clear();setState("error");}}else if(detail?.phase==="start")start(detail.href);else if(detail?.phase==="error"){clear();target.current=detail.href;setState("error");}}
    function click(e:MouseEvent){
      if(e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||!(e.target instanceof Element))return;
      const a=e.target.closest<HTMLAnchorElement>("[data-kidflix-shell] a");
      if(!a||a.hasAttribute("download")||(a.target&&a.target!=="_self"))return;
      const u=new URL(a.href,location.href);
      if(u.origin!==location.origin||!/^\/kidflix\/(en|fr|ar)(\/|$)/.test(u.pathname)||(u.pathname===location.pathname&&u.search===location.search))return;
      start(u.href);
    }
    const pop=()=>start(location.href);
    document.addEventListener("click",click,true);window.addEventListener(navigationEvent,event);window.addEventListener("popstate",pop);window.addEventListener("pageshow",clear);window.addEventListener("pagehide",clear);
    return()=>{clearTimeout(delay.current);clearTimeout(slow.current);document.removeEventListener("click",click,true);window.removeEventListener(navigationEvent,event);window.removeEventListener("popstate",pop);window.removeEventListener("pageshow",clear);window.removeEventListener("pagehide",clear);};
  },[]);
  if(state==="idle")return null;
  return <NavigationToast locale={locale} state={state} onRetry={()=>navigateKidFlix(target.current)} onDismiss={clear}/>;
}
export function Navigation({locale}:{locale:Locale}){return <Suspense fallback={null}><Lifecycle locale={locale}/></Suspense>;}

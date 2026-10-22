'use client';
import { createContext,useContext,useEffect,useState,type ReactNode } from 'react';
const Clock=createContext(0),Interactive=createContext<boolean|null>(null);
/** One server-provided instant makes deadline UI deterministic during hydration.
 * Current server command guards remain authoritative. Hidden tabs use no timer. */
export function RuntimeClock({initialNow,children}:{initialNow:number;children:ReactNode}){
 const [now,setNow]=useState(initialNow),[interactive,setInteractive]=useState(false);
 useEffect(()=>{const began=performance.now();let timer:ReturnType<typeof setInterval>|undefined;function update(){setNow(initialNow+performance.now()-began);}function visibility(){if(timer)clearInterval(timer);timer=undefined;update();if(!document.hidden)timer=setInterval(update,1000);}visibility();setInteractive(true);document.addEventListener('visibilitychange',visibility);return()=>{if(timer)clearInterval(timer);document.removeEventListener('visibilitychange',visibility);};},[initialNow]);
 return <Interactive.Provider value={interactive}><Clock.Provider value={now}>{children}</Clock.Provider></Interactive.Provider>;
}
export function useCurrentTime(){return useContext(Clock);}
/** Native admin extensions also work outside the public world's clock provider. */
export function useInteractive(){const inherited=useContext(Interactive),[mounted,setMounted]=useState(false);useEffect(()=>{setMounted(true);},[]);return mounted&&inherited!==false;}

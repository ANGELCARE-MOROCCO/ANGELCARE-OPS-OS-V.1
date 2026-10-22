'use client';
import { useEffect,useRef,type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
export function NativeMenu({label,summary,children,className}:{label:string;summary:ReactNode;children:ReactNode;className:string}){
 const menu=useRef<HTMLDetailsElement>(null),trigger=useRef<HTMLElement>(null),pathname=usePathname();
 useEffect(()=>{if(menu.current)menu.current.open=false;},[pathname]);
 useEffect(()=>{const outside=(event:PointerEvent)=>{if(menu.current?.open&&event.target instanceof Node&&!menu.current.contains(event.target))menu.current.open=false;};document.addEventListener('pointerdown',outside);return()=>document.removeEventListener('pointerdown',outside);},[]);
 return <details className={className} ref={menu} onKeyDown={event=>{if(event.key==='Escape'&&menu.current?.open){event.preventDefault();menu.current.open=false;trigger.current?.focus();}}}><summary ref={trigger} aria-label={label}>{summary}</summary><nav aria-label={label} onClick={event=>{if(event.target instanceof Element&&event.target.closest('a')&&menu.current)menu.current.open=false;}}>{children}</nav></details>;
}

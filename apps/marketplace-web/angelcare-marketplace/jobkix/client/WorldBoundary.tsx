'use client';
import { useEffect,useRef,type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { jobkixPathLocale } from '../presentation-context';
import { direction } from '../i18n';
/** View isolation only; never an authentication/authorization authority.
 * Root layouts can persist across client navigation, so server-only pathname
 * branches cannot own document language or unrelated runtime bridges. */
export function WorldBoundary({children}:{children:ReactNode}){
 const pathname=usePathname(),locale=jobkixPathLocale(pathname),initialRender=useRef(true),owned=useRef<{lang:string;dir:string}|null>(null),previous=useRef<{lang:string|null;dir:string|null}>({lang:'en',dir:null});
 useEffect(()=>{
  const html=document.documentElement;
  if(locale){
   if(!owned.current&&(!initialRender.current||html.lang!==locale))previous.current={lang:html.getAttribute('lang'),dir:html.getAttribute('dir')};
   html.lang=locale;html.dir=direction(locale);owned.current={lang:locale,dir:direction(locale)};
  }else if(owned.current){
   const last=owned.current,prior=previous.current;
   if(html.getAttribute('lang')===last.lang){if(prior.lang===null)html.removeAttribute('lang');else html.setAttribute('lang',prior.lang);}
   if(html.getAttribute('dir')===last.dir){if(prior.dir===null)html.removeAttribute('dir');else html.setAttribute('dir',prior.dir);}
   owned.current=null;
  }
  initialRender.current=false;
 },[locale]);
 return locale?null:children;
}

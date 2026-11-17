"use client";
import {useEffect,useState,type ReactNode} from "react";

/** R11.1: English/Arabic Équipements use the canonical commercial renderer.
 * Existing Conseil legacy and protected Partner OS stay separately selectable.
 * The route follows hash changes without duplicating any commerce implementation.
 */
export function PartnerLocaleEntry({
 modern,legacy,partner
}:{modern:ReactNode;legacy:ReactNode;partner:ReactNode}){
 const [chapter,setChapter]=useState<"modern"|"legacy"|"partner">("modern");
 useEffect(()=>{
  const read=()=>{
   const hash=decodeURIComponent(window.location.hash).toLowerCase();
   const chosen=hash.startsWith("#partner-os")?"partner":hash.startsWith("#conseil")?"legacy":"modern";
   setChapter(chosen);
  };
  read();
  window.addEventListener("hashchange",read);
  window.addEventListener("popstate",read);
  return()=>{window.removeEventListener("hashchange",read);window.removeEventListener("popstate",read)};
 },[]);
 return chapter==="partner"?partner:chapter==="legacy"?legacy:modern;
}

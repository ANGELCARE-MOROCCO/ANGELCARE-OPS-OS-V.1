import React from'react';export function useSearchParams(){return new URLSearchParams(location.search)};export default function Link({href,children,...p}:any){return <a {...p} href={href}>{children}</a>}

export function useRouter(){return {push:(url:string)=>{history.pushState(null,'',url)},replace:(url:string)=>{history.replaceState(null,'',url)},refresh:()=>{}}}
export function usePathname(){return location.pathname}

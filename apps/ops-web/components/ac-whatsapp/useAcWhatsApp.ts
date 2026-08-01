"use client"
import { useCallback, useEffect, useRef, useState } from 'react'
import type { AcWhatsAppBootstrap } from '@/lib/ac-whatsapp/types'

export async function acApi<T>(url:string,init?:RequestInit):Promise<T>{
 const response=await fetch(url,{...init,cache:'no-store',headers:{'Content-Type':'application/json',...(init?.headers||{})}})
 const payload=await response.json().catch(()=>null)
 if(!response.ok||!payload?.ok)throw new Error(payload?.error||`HTTP_${response.status}`)
 return payload.data as T
}

export function useAcWhatsApp(intervalMs=6000){
 const [data,setData]=useState<AcWhatsAppBootstrap|null>(null);const [loading,setLoading]=useState(true);const [error,setError]=useState<string|null>(null);const mounted=useRef(true)
 const refresh=useCallback(async(silent=false)=>{if(!silent)setLoading(true);try{const next=await acApi<AcWhatsAppBootstrap>('/api/ac-whatsapp/bootstrap');if(mounted.current){setData(next);setError(null)}}catch(cause){if(mounted.current)setError(cause instanceof Error?cause.message:'LOAD_FAILED')}finally{if(mounted.current)setLoading(false)}},[])
 useEffect(()=>{mounted.current=true;void refresh();const timer=setInterval(()=>void refresh(true),intervalMs);return()=>{mounted.current=false;clearInterval(timer)}},[intervalMs,refresh])
 return{data,loading,error,refresh,setData}
}

export function formatRelative(value?:string|null){if(!value)return'Jamais';const n=new Date(value).getTime();if(!Number.isFinite(n))return'—';const d=Date.now()-n;if(d<60000)return'À l’instant';if(d<3600000)return`Il y a ${Math.max(1,Math.floor(d/60000))} min`;if(d<86400000)return`Il y a ${Math.floor(d/3600000)} h`;if(d<604800000)return`Il y a ${Math.floor(d/86400000)} j`;return new Date(value).toLocaleDateString('fr-FR')}
export function initials(value?:string|null){return String(value||'?').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()||'?'}

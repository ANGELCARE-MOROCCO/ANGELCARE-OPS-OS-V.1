'use client'
import { fetchRevenueOsJson } from '@/lib/revenue-command-os/client-http'
import { useEffect, useState } from 'react'
type Health={available?:boolean;provider?:string;model?:string;message?:string}
type Usage={requests?:number}
export function AiRuntimePanel(){
  const [health,setHealth]=useState<Health|null>(null)
  const [usage,setUsage]=useState<Usage|null>(null)
  const [error,setError]=useState('')
  useEffect(()=>{
    let cancelled=false
    Promise.all([
      fetchRevenueOsJson<Health>('/api/revenue-command-os/ai/health',{cache:'no-store'},{timeoutMs:12000,fallbackMessage:'État du moteur IA indisponible.'}),
      fetchRevenueOsJson<Usage>('/api/revenue-command-os/ai/usage',{cache:'no-store'},{timeoutMs:12000,fallbackMessage:'Usage du moteur IA indisponible.'}),
    ]).then(([h,u])=>{if(!cancelled){setHealth(h.data||null);setUsage(u.data||null)}}).catch((caught)=>{if(!cancelled)setError(caught instanceof Error?caught.message:'État du moteur IA indisponible.')})
    return()=>{cancelled=true}
  },[])
  return <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.2em] text-blue-700">Moteur d’intelligence stratégique</p><h2 className="mt-2 text-xl font-semibold">Gemini · passerelle fournisseur neutre</h2><p className="mt-1 text-sm text-slate-500">Clé serveur, sorties structurées, quotas, repli et audit. Actions externes désactivées.</p></div><span className={`rounded-full px-4 py-2 text-sm font-semibold ${health?.available?'bg-emerald-50 text-emerald-800':'bg-amber-50 text-amber-800'}`}>{health?.available?'Disponible':'Vérification requise'}</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><Cell label="Fournisseur" value={health?.provider||'gemini'}/><Cell label="Modèle" value={health?.model||'configuré via environnement'}/><Cell label="Mode" value="Shadow"/><Cell label="Quota du jour" value={usage?`${usage.requests||0} requêtes`:'—'}/><Cell label="Actions externes" value="0"/></div><p className={`mt-4 text-xs ${error?'text-amber-700':'text-slate-500'}`}>{error||health?.message||'Le panneau ne déclenche pas automatiquement de requête Gemini live.'}</p></section>
}
function Cell({label,value}:{label:string;value:string}){return <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 truncate text-sm font-semibold text-slate-900">{value}</p></div>}

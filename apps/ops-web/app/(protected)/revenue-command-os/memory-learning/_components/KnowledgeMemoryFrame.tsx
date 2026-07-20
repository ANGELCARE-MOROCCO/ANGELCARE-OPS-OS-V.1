'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AlertTriangle, BrainCircuit, CheckCircle2, DatabaseZap, Loader2, RefreshCcw, ScanSearch, ShieldCheck } from 'lucide-react'
import RevenueOsIcon from '../../_components/RevenueOsIcon'
import { useKnowledgeMemory } from './KnowledgeMemoryContext'

function readinessTone(score:number){if(score>=90)return'bg-emerald-50 text-emerald-700 ring-emerald-200';if(score>=75)return'bg-blue-50 text-blue-700 ring-blue-200';if(score>=55)return'bg-amber-50 text-amber-700 ring-amber-200';return'bg-rose-50 text-rose-700 ring-rose-200'}

export default function KnowledgeMemoryFrame({children}:{children:React.ReactNode}){
  const pathname=usePathname(); const {knowledge,busy,error,refresh,runValidation}=useKnowledgeMemory()
  return <div className="space-y-5">
    <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,.055)]">
      <div className="relative border-b border-slate-100 px-5 py-5 sm:px-7 lg:px-8">
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[48%] bg-[radial-gradient(circle_at_82%_38%,rgba(16,185,129,.12),transparent_58%)] lg:block"/>
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4"><span className="grid h-13 w-13 shrink-0 place-items-center rounded-[18px] bg-slate-950 text-white shadow-lg shadow-slate-900/15"><BrainCircuit size={25}/></span><div>
            <div className="flex flex-wrap items-center gap-2"><p className="text-[10px] font-black uppercase tracking-[.19em] text-emerald-700">Revenue Doctrine & Institutional Memory</p><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] text-emerald-700 ring-1 ring-emerald-200">Mega ZIP 3</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] text-slate-600">{knowledge.storageMode==='supabase'?'Supabase live':'Contract seed'}</span></div>
            <h1 className="mt-2 text-2xl font-black tracking-[-.035em] text-slate-950 sm:text-3xl">Doctrine, preuves & mémoire gouvernée</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">La couche d’autorité qui décide ce que le futur Strategy Brain peut considérer comme vrai, applicable, approuvé, confidentiel ou interdit.</p>
          </div></div>
          <div className="flex flex-wrap items-center gap-3"><div className={`rounded-2xl px-4 py-3 ring-1 ${readinessTone(knowledge.readiness.overall)}`}><p className="text-[9px] font-black uppercase tracking-[.14em] opacity-75">Readiness institutionnelle</p><p className="mt-1 text-2xl font-black">{knowledge.readiness.overall}%</p></div><button onClick={refresh} disabled={busy} className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">{busy?<Loader2 size={16} className="animate-spin"/>:<RefreshCcw size={16}/>} Actualiser</button><button onClick={runValidation} disabled={busy} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-xs font-black text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800 disabled:opacity-60"><ScanSearch size={17}/> Auditer la mémoire</button></div>
        </div>
      </div>
      <div className="grid gap-4 px-5 py-4 sm:px-7 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
        <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Navigation Doctrine & mémoire">{knowledge.sections.map(section=>{const active=section.href==='/revenue-command-os/memory-learning'?pathname===section.href:pathname.startsWith(section.href);return <Link key={section.key} href={section.href} className={`group flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-[11px] font-black transition ${active?'bg-slate-950 text-white shadow-md':'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`}><RevenueOsIcon name={section.icon} size={15}/>{section.label}{section.status==='needs-attention'?<span className={`h-2 w-2 rounded-full ${active?'bg-amber-300':'bg-amber-500'}`}/>:null}</Link>})}</nav>
        <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500"><span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-600"/>{knowledge.counters.effectiveDoctrines} effectives</span><span className="inline-flex items-center gap-1.5"><AlertTriangle size={14} className="text-amber-600"/>{knowledge.counters.openConflicts} conflits</span><span className="inline-flex items-center gap-1.5"><DatabaseZap size={14} className="text-blue-600"/>{knowledge.counters.indexedAssets} indexés</span><span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-blue-600"/>Shadow</span></div>
      </div>
    </section>
    {error?<div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>:null}
    {children}
  </div>
}

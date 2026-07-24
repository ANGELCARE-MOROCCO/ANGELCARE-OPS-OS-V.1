'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AlertTriangle, BookMarked, CheckCircle2, DatabaseZap, LibraryBig, Loader2, RefreshCcw, ScanSearch, ShieldCheck, Sparkles } from 'lucide-react'
import RevenueOsIcon from '../../_components/RevenueOsIcon'
import { SChip, SDataTruth, SIcon } from '../../_components/visual-sovereignty/SovereignPrimitives'
import { useKnowledgeMemory } from './KnowledgeMemoryContext'

export default function KnowledgeMemoryFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { knowledge, busy, error, refresh, runValidation } = useKnowledgeMemory()
  return <div className="min-h-screen bg-[#f7f6f2] text-slate-950" data-memory-program="MZ27-SOVEREIGN-KNOWLEDGE-DOCTRINE">
    <header className="border-b border-[#ded8cc] bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1760px] flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4"><SIcon icon={LibraryBig} tone="navy" className="h-12 w-12 rounded-2xl"/><div><div className="flex flex-wrap items-center gap-2"><SChip tone="emerald"><BookMarked size={11}/> Mémoire institutionnelle</SChip><SChip tone="violet"><ShieldCheck size={11}/> Vérité gouvernée</SChip></div><p className="mt-2 text-lg font-black tracking-[-.025em] text-slate-950">Doctrine, preuves, versions et apprentissage opérationnel</p><p className="mt-1 text-[11px] font-semibold text-slate-600">Chaque actif conserve son autorité, sa provenance, son statut et son cycle de décision.</p></div></div>
        <div className="flex flex-wrap items-center gap-3"><SDataTruth mode={knowledge.storageMode} warnings={error ? [error] : []} freshness={knowledge.generatedAt}/><div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-right"><p className="text-[8px] font-black uppercase tracking-[.14em] text-slate-500">Readiness institutionnelle</p><p className="mt-1 text-2xl font-black text-slate-950">{knowledge.readiness.overall}%</p></div><button type="button" onClick={() => void refresh()} disabled={busy} className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-45" aria-label="Actualiser la mémoire">{busy ? <Loader2 size={18} className="animate-spin"/> : <RefreshCcw size={18}/>}</button><button type="button" onClick={() => void runValidation()} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-[10px] font-black text-white shadow-lg disabled:opacity-45"><ScanSearch size={16}/> Certifier la mémoire</button></div>
      </div>
    </header>

    <div className="border-b border-[#ded8cc] bg-white px-3 py-3">
      <nav className="mx-auto flex max-w-[1760px] gap-2 overflow-x-auto" aria-label="Routes de la mémoire institutionnelle">
        {knowledge.sections.map((section, index) => {
          const active = section.href === '/revenue-command-os/memory-learning' ? pathname === section.href : pathname.startsWith(section.href)
          return <Link key={section.key} href={section.href} aria-current={active ? 'page' : undefined} className={`group flex shrink-0 items-center gap-3 rounded-[18px] border px-3 py-2.5 text-[10px] font-black transition ${active ? 'border-slate-950 bg-slate-950 text-white shadow-lg' : 'border-slate-200 bg-[#fbfaf7] text-slate-700 hover:border-slate-300 hover:bg-white'}`}><span className={`grid h-8 w-8 place-items-center rounded-xl ${active ? 'bg-emerald-400 text-slate-950' : 'bg-white text-slate-600 shadow-sm'}`}><RevenueOsIcon name={section.icon} size={15}/></span><span><span className={`block text-[8px] ${active ? 'text-slate-300' : 'text-slate-500'}`}>AILE {String(index + 1).padStart(2, '0')}</span>{section.label}</span>{section.status === 'needs-attention' ? <AlertTriangle size={13} className="text-amber-500"/> : null}</Link>
        })}
      </nav>
    </div>

    <div className="mx-auto grid max-w-[1760px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_250px] lg:px-8">
      <main>{error ? <div role="alert" className="mb-5 rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm font-black text-rose-900">{error}</div> : null}{children}</main>
      <aside className="h-fit space-y-4 lg:sticky lg:top-5">
        <section className="rounded-[28px] bg-slate-950 p-5 text-white shadow-[0_22px_65px_rgba(15,23,42,.18)]"><SIcon icon={LibraryBig} tone="emerald"/><p className="mt-5 text-[9px] font-black uppercase tracking-[.15em] text-slate-300">Pouls institutionnel</p><div className="mt-4 space-y-3"><PulseFact icon={CheckCircle2} label="Doctrines effectives" value={knowledge.counters.effectiveDoctrines} tone="text-emerald-300"/><PulseFact icon={AlertTriangle} label="Conflits ouverts" value={knowledge.counters.openConflicts} tone="text-amber-300"/><PulseFact icon={DatabaseZap} label="Actifs indexés" value={knowledge.counters.indexedAssets} tone="text-blue-300"/></div></section>
        <section className="rounded-[28px] border border-violet-200 bg-violet-50 p-5"><div className="flex items-center gap-3"><Sparkles size={19} className="text-violet-700"/><h2 className="text-xs font-black text-violet-950">Souveraineté du savoir</h2></div><p className="mt-3 text-[10px] font-semibold leading-5 text-violet-900">Doctrine, preuve, approbation, conflit, provenance et indexation conservent des compositions et des responsabilités distinctes.</p></section>
      </aside>
    </div>
  </div>
}

function PulseFact({ icon: Icon, label, value, tone }: { icon: typeof CheckCircle2; label: string; value: number; tone: string }) { return <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.07] p-3"><Icon size={15} className={tone}/><div className="min-w-0 flex-1"><p className="truncate text-[9px] text-slate-300">{label}</p><p className="mt-0.5 text-lg font-black text-white">{value}</p></div></div> }

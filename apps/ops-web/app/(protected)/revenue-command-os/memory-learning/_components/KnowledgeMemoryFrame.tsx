'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  AlertTriangle, BookMarked, BookOpenCheck, CheckCircle2, DatabaseZap, LibraryBig,
  Loader2, RefreshCcw, ScanSearch, ShieldCheck, Sparkles,
} from 'lucide-react'
import RevenueOsIcon from '../../_components/RevenueOsIcon'
import { useKnowledgeMemory } from './KnowledgeMemoryContext'
import { SChip, SDataTruth, SIcon } from '../../_components/visual-sovereignty/SovereignPrimitives'
import sovereigntyStyles from '../../_components/visual-sovereignty/Sovereignty.module.css'

export default function KnowledgeMemoryFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { knowledge, busy, error, refresh, runValidation } = useKnowledgeMemory()

  return (
    <div className="min-h-screen bg-[#f7f5f0] text-slate-950">
      <section className="relative overflow-hidden border-b border-[#dfd8cb] bg-[#fbfaf7] px-5 py-7 sm:px-7 lg:px-9">
        <div className={`absolute inset-0 opacity-25 ${sovereigntyStyles.dotField}`} />
        <div className="relative mx-auto grid max-w-[1760px] gap-7 xl:grid-cols-[1fr_auto] xl:items-end">
          <div className="flex items-start gap-5"><SIcon icon={LibraryBig} tone="navy" className="h-16 w-16 rounded-[22px]" /><div><div className="flex flex-wrap items-center gap-2"><SChip tone="emerald"><BookMarked size={11} /> Institutional Intelligence Library</SChip><SChip tone="violet"><ShieldCheck size={11} /> Governed truth</SChip></div><h1 className="mt-4 text-4xl font-black tracking-[-.055em] sm:text-5xl">Doctrine, evidence and organizational memory.</h1><p className="mt-3 max-w-4xl text-sm leading-7 text-slate-600">Une bibliothèque institutionnelle où la vérité commerciale est versionnée, sourcée, approuvée, confidentielle et prête à être utilisée par les décisions Revenue OS.</p></div></div>
          <div className="flex flex-wrap items-center gap-3"><SDataTruth mode={knowledge.storageMode} warnings={error ? [error] : []} /><div className="rounded-[22px] border border-[#d9d1c5] bg-white px-5 py-3 text-right shadow-sm"><p className="text-[8px] font-black uppercase tracking-[.15em] text-slate-400">Institutional readiness</p><p className="mt-1 text-3xl font-black">{knowledge.readiness.overall}%</p></div><button onClick={() => void refresh()} disabled={busy} className="grid h-12 w-12 place-items-center rounded-2xl border border-[#d9d1c5] bg-white text-slate-700 transition hover:bg-[#f2eee7] disabled:opacity-50" aria-label="Actualiser la mémoire">{busy ? <Loader2 size={18} className="animate-spin" /> : <RefreshCcw size={18} />}</button><button onClick={() => void runValidation()} disabled={busy} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-slate-950 px-5 text-xs font-black text-white shadow-lg disabled:opacity-50"><ScanSearch size={17} /> Certifier la mémoire</button></div>
        </div>
      </section>

      <div className="border-b border-[#dfd8cb] bg-white/90 px-3 py-3 backdrop-blur">
        <nav className="mx-auto flex max-w-[1760px] gap-2 overflow-x-auto" aria-label="Ailes de la mémoire institutionnelle">
          {knowledge.sections.map((section, index) => {
            const active = section.href === '/revenue-command-os/memory-learning' ? pathname === section.href : pathname.startsWith(section.href)
            return <Link key={section.key} href={section.href} className={`group relative flex shrink-0 items-center gap-3 overflow-hidden rounded-[20px] border px-4 py-3 text-[10px] font-black transition ${active ? 'border-slate-950 bg-slate-950 text-white shadow-lg' : 'border-[#e5ded2] bg-[#fbfaf7] text-slate-600 hover:border-slate-300 hover:bg-white'}`}><span className={`grid h-8 w-8 place-items-center rounded-xl ${active ? 'bg-emerald-400 text-slate-950' : 'bg-white text-slate-500 shadow-sm'}`}><RevenueOsIcon name={section.icon} size={15} /></span><span><span className="block text-[8px] opacity-50">WING {String(index + 1).padStart(2, '0')}</span>{section.label}</span>{section.status === 'needs-attention' ? <AlertTriangle size={13} className="text-amber-500" /> : null}</Link>
          })}
        </nav>
      </div>

      <div className="mx-auto grid max-w-[1760px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_260px] lg:px-8">
        <main>{error ? <div className="mb-5 rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">{error}</div> : null}{children}</main>
        <aside className="h-fit space-y-4 lg:sticky lg:top-5">
          <section className="rounded-[30px] bg-slate-950 p-5 text-white shadow-[0_22px_65px_rgba(15,23,42,.18)]"><SIcon icon={BookOpenCheck} tone="emerald" /><p className="mt-5 text-[9px] font-black uppercase tracking-[.15em] text-slate-400">Library pulse</p><div className="mt-4 space-y-3"><PulseFact icon={CheckCircle2} label="Doctrines effectives" value={knowledge.counters.effectiveDoctrines} tone="text-emerald-300" /><PulseFact icon={AlertTriangle} label="Conflits ouverts" value={knowledge.counters.openConflicts} tone="text-amber-300" /><PulseFact icon={DatabaseZap} label="Assets indexés" value={knowledge.counters.indexedAssets} tone="text-blue-300" /></div></section>
          <section className="rounded-[30px] border border-violet-200 bg-violet-50 p-5"><div className="flex items-center gap-3"><Sparkles size={19} className="text-violet-700" /><h2 className="text-xs font-black text-violet-950">Knowledge sovereignty</h2></div><p className="mt-3 text-[10px] leading-5 text-violet-800">Chaque aile conserve sa composition propre: constitution, musée de preuves, codebook, théâtre de conversations, galerie de cas, manuels, arbitrage et certification.</p></section>
        </aside>
      </div>
    </div>
  )
}

function PulseFact({ icon: Icon, label, value, tone }: { icon: typeof CheckCircle2; label: string; value: number; tone: string }) { return <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/7 p-3"><Icon size={15} className={tone} /><div className="min-w-0 flex-1"><p className="truncate text-[9px] text-slate-400">{label}</p><p className="mt-0.5 text-lg font-black">{value}</p></div></div> }

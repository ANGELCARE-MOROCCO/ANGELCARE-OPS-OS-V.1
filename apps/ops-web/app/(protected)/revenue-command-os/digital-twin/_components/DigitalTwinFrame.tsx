'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AlertTriangle, CheckCircle2, ChevronRight, Loader2, Network, RefreshCcw, ScanSearch, ShieldCheck } from 'lucide-react'
import RevenueOsIcon from '../../_components/RevenueOsIcon'
import { SChip, SDataTruth, sovereigntyStyles } from '../../_components/visual-sovereignty/SovereignPrimitives'
import { useDigitalTwin } from './DigitalTwinContext'

export default function DigitalTwinFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { twin, busy, error, refresh, runValidation } = useDigitalTwin()
  const current = twin.sections.find((section) => section.href === '/revenue-command-os/digital-twin' ? pathname === section.href : pathname.startsWith(section.href)) || twin.sections[0]

  return <div className={`${sovereigntyStyles.canvas} min-h-screen px-4 py-6 sm:px-7 lg:px-9 xl:px-11`} data-mz25-family="sovereign-commercial-twin">
    <div className="mx-auto max-w-[1780px]">
      <header className="mb-5 overflow-hidden rounded-[32px] border border-cyan-200 bg-white/90 shadow-[0_22px_70px_rgba(8,145,178,.09)] backdrop-blur-xl">
        <div className="grid gap-4 border-b border-slate-200 p-4 xl:grid-cols-[auto_1fr_auto] xl:items-center">
          <Link href="/revenue-command-os/digital-twin" className="flex min-w-0 items-center gap-3"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white shadow-lg"><Network size={21}/></span><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[.17em] text-cyan-700">AngelCare · Commercial World Model</p><p className="truncate text-sm font-black text-slate-950">Jumeau commercial souverain</p></div></Link>
          <div className="min-w-0 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3"><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.12em] text-slate-600"><span>Route active</span><ChevronRight size={12}/><span className="text-cyan-800">{current.label}</span></div><p className="mt-1 truncate text-[11px] font-semibold text-slate-700">{current.description}</p></div>
          <div className="flex shrink-0 items-center gap-2"><button type="button" onClick={refresh} disabled={busy} title="Actualiser le jumeau" className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-cyan-300 hover:text-cyan-800 disabled:opacity-45">{busy ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}</button><button type="button" onClick={runValidation} disabled={busy} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-[10px] font-black uppercase tracking-[.1em] text-white disabled:opacity-45"><ScanSearch size={15} /> Certifier</button></div>
        </div>
        <nav className="flex gap-1.5 overflow-x-auto p-3" aria-label="Navigation du jumeau commercial">
          {twin.sections.map((section, index) => {
            const active = section.href === '/revenue-command-os/digital-twin' ? pathname === section.href : pathname.startsWith(section.href)
            return <Link key={section.key} href={section.href} title={section.description} aria-current={active ? 'page' : undefined} className={`group flex min-h-11 shrink-0 items-center gap-2 rounded-2xl px-3 py-2 text-[10px] font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200 ${active ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'border border-transparent bg-slate-50 text-slate-700 hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-900'}`}><span className={`grid h-6 w-6 place-items-center rounded-lg text-[8px] ${active ? 'bg-white/20 text-white' : 'bg-white text-slate-500 shadow-sm'}`}>{String(index + 1).padStart(2, '0')}</span><RevenueOsIcon name={section.icon} size={13} /><span>{section.label}</span>{section.status === 'needs-attention' ? <span className={`h-2 w-2 rounded-full ${active ? 'bg-amber-300' : 'bg-amber-500'}`} aria-label="Attention requise" /> : null}</Link>
          })}
        </nav>
      </header>

      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-center"><SDataTruth mode={twin.storageMode} warnings={error ? [error] : []} freshness={twin.generatedAt} /><div className="flex flex-wrap items-center gap-2"><SChip tone="emerald"><CheckCircle2 size={11} /> {twin.counters.activeOffers} offres actives</SChip><SChip tone="amber"><AlertTriangle size={11} /> {twin.counters.openValidationIssues} écarts</SChip><SChip tone="blue"><ShieldCheck size={11} /> Shadow</SChip></div></div>
      {children}
    </div>
  </div>
}

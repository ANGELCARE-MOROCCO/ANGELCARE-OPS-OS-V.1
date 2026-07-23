'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AlertTriangle, CheckCircle2, Loader2, Network, RefreshCcw, ScanSearch, ShieldCheck } from 'lucide-react'
import RevenueOsIcon from '../../_components/RevenueOsIcon'
import { SChip, SDataTruth, sovereigntyStyles } from '../../_components/visual-sovereignty/SovereignPrimitives'
import { useDigitalTwin } from './DigitalTwinContext'

export default function DigitalTwinFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { twin, busy, error, refresh, runValidation } = useDigitalTwin()

  return <div className={`${sovereigntyStyles.canvas} min-h-screen px-4 py-6 sm:px-7 lg:px-9 xl:px-11`}>
    <div className="mx-auto max-w-[1780px]">
      <div className="mb-5 flex flex-col gap-4 rounded-[30px] border border-cyan-200 bg-white/86 p-4 shadow-[0_18px_55px_rgba(8,145,178,.07)] backdrop-blur-xl xl:flex-row xl:items-center">
        <div className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white"><Network size={20} /></span><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[.17em] text-cyan-700">Commercial World Model</p><p className="truncate text-sm font-black text-slate-950">Jumeau commercial AngelCare</p></div></div>
        <nav className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto xl:justify-center" aria-label="Navigation du jumeau commercial">
          {twin.sections.map((section, index) => {
            const active = section.href === '/revenue-command-os/digital-twin' ? pathname === section.href : pathname.startsWith(section.href)
            return <Link key={section.key} href={section.href} title={section.description} className={`group flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 text-[10px] font-black transition ${active ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'bg-slate-50 text-slate-600 hover:bg-cyan-50 hover:text-cyan-800'}`}><span className={`grid h-5 w-5 place-items-center rounded-lg text-[8px] ${active ? 'bg-white/20' : 'bg-white text-slate-400'}`}>{String(index + 1).padStart(2, '0')}</span><RevenueOsIcon name={section.icon} size={13} />{section.label}{section.status === 'needs-attention' ? <span className={`h-2 w-2 rounded-full ${active ? 'bg-amber-300' : 'bg-amber-500'}`} /> : null}</Link>
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-2"><button onClick={refresh} disabled={busy} className="grid h-10 w-10 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:text-cyan-700">{busy ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}</button><button onClick={runValidation} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-[10px] font-black uppercase tracking-[.1em] text-white"><ScanSearch size={15} /> Certifier</button></div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-center"><SDataTruth mode={twin.storageMode} warnings={error ? [error] : []} /><div className="flex flex-wrap items-center gap-2"><SChip tone="emerald"><CheckCircle2 size={11} /> {twin.counters.activeOffers} offres actives</SChip><SChip tone="amber"><AlertTriangle size={11} /> {twin.counters.openValidationIssues} écarts</SChip><SChip tone="blue"><ShieldCheck size={11} /> Shadow</SChip></div></div>
      {children}
    </div>
  </div>
}

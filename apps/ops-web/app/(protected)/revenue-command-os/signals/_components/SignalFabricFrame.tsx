'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AlertTriangle, Loader2, RadioTower, RefreshCcw, ScanLine, ShieldCheck } from 'lucide-react'
import RevenueOsIcon from '../../_components/RevenueOsIcon'
import { SChip, SDataTruth, sovereigntyStyles } from '../../_components/visual-sovereignty/SovereignPrimitives'
import { useSignalFabric } from './SignalFabricContext'

export default function SignalFabricFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { fabric, warnings, busy, error, refresh, runValidation, runAllScans } = useSignalFabric()
  return <div className={`${sovereigntyStyles.canvas} min-h-screen px-4 py-6 sm:px-7 lg:px-9 xl:px-11`}>
    <div className="mx-auto max-w-[1780px]">
      <div className="mb-5 overflow-hidden rounded-[32px] border border-cyan-200 bg-slate-950 text-white shadow-[0_24px_70px_rgba(15,23,42,.2)]">
        <div className="relative flex flex-col gap-4 p-4 xl:flex-row xl:items-center"><div className={`absolute inset-0 opacity-25 ${sovereigntyStyles.dotField}`} />
          <div className="relative flex min-w-0 items-center gap-3"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-500 text-slate-950 ${sovereigntyStyles.pulse}`}><RadioTower size={20} /></span><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-300">Revenue Nervous System</p><p className="text-sm font-black">Signal Fabric · observation gouvernée</p></div></div>
          <nav className="relative flex min-w-0 flex-1 gap-1.5 overflow-x-auto xl:justify-center" aria-label="Navigation Signal Fabric">{fabric.sections.map((section, index) => { const active = section.href === '/revenue-command-os/signals' ? pathname === section.href : pathname.startsWith(section.href); return <Link key={section.key} href={section.href} className={`flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 text-[10px] font-black transition ${active ? 'bg-cyan-400 text-slate-950 shadow-lg' : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'}`}><span className={`grid h-5 w-5 place-items-center rounded-lg text-[8px] ${active ? 'bg-slate-950/10' : 'bg-white/5'}`}>{String(index + 1).padStart(2, '0')}</span><RevenueOsIcon name={section.icon} size={13} />{section.label}</Link> })}</nav>
          <div className="relative flex shrink-0 items-center gap-2"><button onClick={runAllScans} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-2xl bg-cyan-400 px-4 text-[10px] font-black uppercase tracking-[.08em] text-slate-950"><ScanLine size={15} /> Scanner</button><button onClick={refresh} disabled={busy} className="grid h-10 w-10 place-items-center rounded-2xl border border-white/15 bg-white/5 text-white">{busy ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}</button><button onClick={runValidation} disabled={busy} className="grid h-10 w-10 place-items-center rounded-2xl border border-white/15 bg-white/5 text-white"><ShieldCheck size={16} /></button></div>
        </div>
      </div>
      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-center"><SDataTruth mode={fabric.storageMode} warnings={[...warnings, ...(error ? [error] : [])]} /><div className="flex flex-wrap items-center gap-2"><SChip tone="emerald">{fabric.counters.sourcesHealthy}/{fabric.counters.sourcesEnabled} sources saines</SChip><SChip tone="amber"><AlertTriangle size={11} /> {fabric.counters.unacknowledgedSignals} à qualifier</SChip></div></div>
      {children}
    </div>
  </div>
}

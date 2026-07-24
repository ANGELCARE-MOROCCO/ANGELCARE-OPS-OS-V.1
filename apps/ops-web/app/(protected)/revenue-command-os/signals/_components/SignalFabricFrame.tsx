'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AlertTriangle, Loader2, RadioTower, RefreshCcw, ScanLine, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import RevenueOsIcon from '../../_components/RevenueOsIcon'
import { SChip } from '../../_components/visual-sovereignty/SovereignPrimitives'
import { useSignalFabric } from './SignalFabricContext'
import styles from './sovereign-signal-experience/SovereignSignalExperience.module.css'

export default function SignalFabricFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { fabric, busy, error, refresh, runValidation, runAllScans } = useSignalFabric()
  const active = fabric.sections.find((section) => section.href === '/revenue-command-os/signals' ? pathname === section.href : pathname.startsWith(section.href))

  return <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_36%,#f8fafc_100%)] px-4 py-6 sm:px-7 lg:px-9 xl:px-11">
    <div className="mx-auto max-w-[1780px]">
      <header className="mb-5 overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,.08)]">
        <div className="grid gap-4 border-b border-slate-200 bg-slate-950 p-4 text-white xl:grid-cols-[1fr_auto] xl:items-center">
          <div className="flex min-w-0 items-center gap-3"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-400 text-slate-950 ${styles.pulse}`}><RadioTower size={20}/></span><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-300">AngelCare · Revenue Nervous System</p><p className="text-sm font-black text-white">Signal Fabric · observation, qualification et gouvernance</p><p className="mt-1 text-[10px] font-semibold text-slate-300">Section active : {active?.label || 'Vue d’ensemble'}</p></div></div>
          <div className="flex flex-wrap items-center gap-2"><SChip tone={fabric.counters.staleSources ? 'amber' : 'emerald'}>{fabric.counters.sourcesHealthy}/{fabric.counters.sourcesEnabled} sources saines</SChip>{fabric.counters.unacknowledgedSignals ? <SChip tone="amber"><AlertTriangle size={11}/>{fabric.counters.unacknowledgedSignals} à qualifier</SChip> : null}<button type="button" onClick={runAllScans} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-2xl bg-cyan-400 px-4 text-[10px] font-black uppercase tracking-[.08em] text-slate-950 disabled:opacity-50"><ScanLine size={15}/>Scanner</button><button type="button" onClick={refresh} disabled={busy} aria-label="Actualiser Signal Fabric" className="grid h-10 w-10 place-items-center rounded-2xl border border-white/15 bg-white/5 text-white">{busy ? <Loader2 size={16} className="animate-spin"/> : <RefreshCcw size={16}/>}</button><button type="button" onClick={runValidation} disabled={busy} aria-label="Valider Signal Fabric" className="grid h-10 w-10 place-items-center rounded-2xl border border-white/15 bg-white/5 text-white"><ShieldCheck size={16}/></button></div>
        </div>
        <nav className={`${styles.rail} flex gap-2 overflow-x-auto p-3`} aria-label="Navigation Signal Fabric">{fabric.sections.map((section,index) => { const selected = section.href === '/revenue-command-os/signals' ? pathname === section.href : pathname.startsWith(section.href); return <Link key={section.key} href={section.href} aria-current={selected ? 'page' : undefined} className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2.5 text-[10px] font-black transition ${selected ? 'border-cyan-300 bg-cyan-50 text-cyan-950 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-200 hover:bg-cyan-50/50'}`}><span className={`grid h-6 w-6 place-items-center rounded-lg text-[8px] ${selected ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{String(index+1).padStart(2,'0')}</span><RevenueOsIcon name={section.icon} size={13}/>{section.label}</Link> })}</nav>
        {error ? <div role="alert" className="border-t border-rose-200 bg-rose-50 px-4 py-3 text-xs font-black text-rose-900">{error}</div> : null}
      </header>
      {children}
    </div>
  </div>
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, Boxes, ChevronRight, Fingerprint, RefreshCw, ShieldCheck } from 'lucide-react'
import { REVENUE_COMMAND_KERNEL_SECTIONS } from '@/lib/revenue-command-os/command-kernel/constants'
import { useCommandKernel } from './CommandKernelContext'
import { SChip, SDataTruth } from '../../_components/visual-sovereignty/SovereignPrimitives'
import styles from './sovereign-command-experience/SovereignCommandExperience.module.css'

export default function CommandKernelFrame({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const { data, warnings, loading, error, refresh } = useCommandKernel()
  const current = REVENUE_COMMAND_KERNEL_SECTIONS.find((section) => section.href === path) || REVENUE_COMMAND_KERNEL_SECTIONS[0]

  return <div className={`${styles.routeShell} min-h-[calc(100vh-24px)] bg-[#f6f8fc] text-slate-950`}>
    <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6" data-command-kernel-family-header="MZ24-COMMAND-FAMILY">
      <div className="mx-auto flex max-w-[1760px] flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-slate-950 text-white shadow-[0_14px_34px_rgba(15,23,42,.18)]"><Boxes size={21} /></span>
          <div><div className="flex flex-wrap items-center gap-2"><SChip tone="violet"><Fingerprint size={11} /> AngelCare Command Kernel</SChip><SChip tone="cyan"><ShieldCheck size={11} /> Shadow sécurisé</SChip></div><div className="mt-2 flex flex-wrap items-center gap-2 text-sm"><Link href="/revenue-command-os/command-kernel" className="font-black text-slate-950 hover:text-violet-700">Commandes</Link><ChevronRight size={14} className="text-slate-400" /><span className="font-bold text-slate-600">{current.label}</span></div></div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SDataTruth mode={error ? 'degraded' : loading && !data ? 'initializing' : data?.dataMode || 'unavailable'} warnings={warnings} freshness={data?.generatedAt} />
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-right"><p className="text-[8px] font-black uppercase tracking-[.14em] text-slate-500">Intégrité canonique</p><p className="mt-1 text-lg font-black text-slate-950">{data ? `${data.expectedCount - data.missingCount}/${data.expectedCount}` : '—'}</p></div>
          <button type="button" onClick={() => void refresh()} disabled={loading} className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-violet-300 hover:text-violet-700 disabled:opacity-45 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100" aria-label="Actualiser le noyau"><RefreshCw size={17} className={loading ? 'animate-spin' : ''} /></button>
        </div>
      </div>
    </header>

    <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-3 py-2 shadow-[0_8px_28px_rgba(15,23,42,.05)] backdrop-blur" aria-label="Navigation du Command Kernel">
      <div className={`${styles.commandRail} mx-auto flex max-w-[1760px] gap-1 overflow-x-auto`}>
        {REVENUE_COMMAND_KERNEL_SECTIONS.map((section, index) => {
          const active = path === section.href
          return <Link key={section.key} href={section.href} aria-current={active ? 'page' : undefined} className={`group flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100 ${active ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`}><span className={`grid h-5 w-5 place-items-center rounded-md text-[8px] ${active ? 'bg-violet-400 text-slate-950' : 'bg-slate-100 text-slate-500 group-hover:bg-white'}`}>{String(index + 1).padStart(2, '0')}</span>{section.label}</Link>
        })}
      </div>
    </nav>

    <main className="mx-auto max-w-[1760px] px-4 py-6 sm:px-6 lg:px-8">
      {warnings.length ? <div className="mb-5 flex items-start gap-3 rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-amber-950"><Activity size={18} className="mt-0.5 shrink-0" /><div><p className="text-xs font-black">Le noyau reste consultable avec réserve.</p><p className="mt-1 text-[10px] font-semibold leading-5">{warnings.join(' · ')}</p></div></div> : null}
      {error ? <div className="mb-5 rounded-[22px] border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-900">{error}</div> : null}
      {children}
    </main>
  </div>
}

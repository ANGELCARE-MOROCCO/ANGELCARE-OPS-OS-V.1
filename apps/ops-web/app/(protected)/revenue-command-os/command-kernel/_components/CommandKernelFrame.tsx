'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Activity, Boxes, Fingerprint, RefreshCw, ShieldCheck } from 'lucide-react'
import { REVENUE_COMMAND_KERNEL_SECTIONS } from '@/lib/revenue-command-os/command-kernel/constants'
import { useCommandKernel } from './CommandKernelContext'
import { SChip, SDataTruth, SIcon } from '../../_components/visual-sovereignty/SovereignPrimitives'
import sovereigntyStyles from '../../_components/visual-sovereignty/Sovereignty.module.css'

export default function CommandKernelFrame({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const { data, warnings, loading, error, refresh } = useCommandKernel()

  return (
    <div className="min-h-[calc(100vh-24px)] bg-[#f6f8fc] text-slate-950">
      <section className="relative overflow-hidden border-b border-slate-200 bg-slate-950 px-5 py-5 text-white sm:px-7">
        <div className={`absolute inset-0 opacity-20 ${sovereigntyStyles.gridFine}`} />
        <div className="relative mx-auto flex max-w-[1760px] flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <SIcon icon={Boxes} tone="violet" className="h-14 w-14 rounded-[20px]" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <SChip tone="violet"><Fingerprint size={11} /> Command Vault</SChip>
                <SChip tone="emerald"><ShieldCheck size={11} /> Shadow sécurisé</SChip>
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-[-.045em] sm:text-3xl">Commands 3000 · Institutional Kernel</h1>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-300">Une bibliothèque canonique, versionnée et gouvernée où chaque décision expose sa preuve, son autorité, sa sécurité et sa trajectoire d’exécution.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SDataTruth mode={data?.dataMode || 'unavailable'} warnings={warnings.length} freshness={data?.generatedAt} />
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-right">
              <p className="text-[8px] font-black uppercase tracking-[.16em] text-slate-400">Intégrité canonique</p>
              <p className="mt-1 text-xl font-black">{data ? `${data.expectedCount - data.missingCount}/${data.expectedCount}` : '—'}</p>
            </div>
            <button onClick={() => void refresh()} disabled={loading} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-white/10 text-white transition hover:bg-white/15 disabled:opacity-50" aria-label="Actualiser le noyau">
              <RefreshCw size={17} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </section>

      <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-3 py-2 shadow-[0_8px_28px_rgba(15,23,42,.05)] backdrop-blur" aria-label="Ateliers Commands 3000">
        <div className="mx-auto flex max-w-[1760px] gap-1 overflow-x-auto">
          {REVENUE_COMMAND_KERNEL_SECTIONS.map((section, index) => {
            const active = path === section.href
            return (
              <Link key={section.key} href={section.href} className={`group flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-black transition ${active ? 'bg-slate-950 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-950'}`}>
                <span className={`grid h-5 w-5 place-items-center rounded-md text-[8px] ${active ? 'bg-violet-400 text-slate-950' : 'bg-slate-100 text-slate-400 group-hover:bg-white'}`}>{String(index + 1).padStart(2, '0')}</span>
                {section.label}
              </Link>
            )
          })}
        </div>
      </nav>

      <main className="mx-auto max-w-[1760px] px-4 py-6 sm:px-6 lg:px-8">
        {warnings.length ? (
          <div className="mb-5 flex items-start gap-3 rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <Activity size={18} className="mt-0.5 shrink-0" />
            <div><p className="text-xs font-black">Le noyau reste utilisable avec réserve.</p><p className="mt-1 text-[10px] leading-5">{warnings.join(' · ')}</p></div>
          </div>
        ) : null}
        {error ? <div className="mb-5 rounded-[22px] border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">{error}</div> : null}
        {children}
      </main>
    </div>
  )
}

'use client'

import type { ElementType, ReactNode } from 'react'
import { AlertTriangle, Check, ChevronRight, Circle, Database, Eye, LoaderCircle, LockKeyhole, Radio, ShieldCheck, WifiOff } from 'lucide-react'
import styles from './Sovereignty.module.css'

export type SovereignTone = 'navy' | 'blue' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate'

const toneMap: Record<SovereignTone, { chip: string; icon: string; border: string; wash: string; solid: string }> = {
  navy: { chip: 'bg-slate-950 text-white', icon: 'bg-slate-950 text-white', border: 'border-slate-300', wash: 'bg-slate-50', solid: 'bg-slate-950' },
  blue: { chip: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200', icon: 'bg-blue-600 text-white', border: 'border-blue-200', wash: 'bg-blue-50/70', solid: 'bg-blue-600' },
  cyan: { chip: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200', icon: 'bg-cyan-600 text-white', border: 'border-cyan-200', wash: 'bg-cyan-50/70', solid: 'bg-cyan-500' },
  emerald: { chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', icon: 'bg-emerald-600 text-white', border: 'border-emerald-200', wash: 'bg-emerald-50/70', solid: 'bg-emerald-500' },
  amber: { chip: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200', icon: 'bg-amber-500 text-white', border: 'border-amber-200', wash: 'bg-amber-50/75', solid: 'bg-amber-500' },
  rose: { chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200', icon: 'bg-rose-600 text-white', border: 'border-rose-200', wash: 'bg-rose-50/70', solid: 'bg-rose-500' },
  violet: { chip: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200', icon: 'bg-violet-600 text-white', border: 'border-violet-200', wash: 'bg-violet-50/70', solid: 'bg-violet-500' },
  slate: { chip: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200', icon: 'bg-slate-700 text-white', border: 'border-slate-200', wash: 'bg-slate-50', solid: 'bg-slate-500' },
}

export function SIcon({ icon: Icon, tone = 'navy', className = '' }: { icon: ElementType; tone?: SovereignTone; className?: string }) {
  return <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl shadow-sm ${toneMap[tone].icon} ${className}`}><Icon size={19} /></span>
}

export function SChip({ children, tone = 'slate', className = '' }: { children: ReactNode; tone?: SovereignTone; className?: string }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] ${toneMap[tone].chip} ${className}`}>{children}</span>
}

export function SMetric({ label, value, note, icon, tone = 'blue', progress }: { label: string; value: ReactNode; note?: string; icon?: ElementType; tone?: SovereignTone; progress?: number }) {
  const Icon = icon
  return <div className={`rounded-[24px] border bg-white/90 p-4 ${toneMap[tone].border} ${styles.softGlass}`}>
    <div className="flex items-start justify-between gap-3">
      <div>{Icon ? <SIcon icon={Icon} tone={tone} className="h-9 w-9 rounded-xl" /> : null}</div>
      <div className="text-right text-2xl font-black tracking-[-.04em] text-slate-950">{value}</div>
    </div>
    <p className="mt-3 text-[11px] font-black uppercase tracking-[.12em] text-slate-600">{label}</p>
    {note ? <p className="mt-1 text-[11px] leading-5 text-slate-500">{note}</p> : null}
    {typeof progress === 'number' ? <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${toneMap[tone].solid}`} style={{ width: `${Math.max(2, Math.min(100, progress))}%` }} /></div> : null}
  </div>
}

export function SDataTruth({ mode, warnings = [], traceId, freshness }: { mode?: string; warnings?: string[] | number; traceId?: string; freshness?: string }) {
  const warningList = Array.isArray(warnings) ? warnings : warnings > 0 ? [`${warnings} avertissement(s)`] : []
  const normalized = String(mode || 'live').toLowerCase()
  const is = (...parts: string[]) => parts.some((part) => normalized.includes(part))

  const state = is('initial', 'loading')
    ? { tone: 'blue' as SovereignTone, icon: LoaderCircle, label: 'Initialisation', spin: true }
    : is('locked', 'forbidden', 'permission')
      ? { tone: 'amber' as SovereignTone, icon: LockKeyhole, label: 'Accès verrouillé', spin: false }
      : is('offline', 'unavailable')
        ? { tone: 'rose' as SovereignTone, icon: WifiOff, label: 'Source indisponible', spin: false }
        : warningList.length > 0 || is('degrad', 'stale')
          ? { tone: 'amber' as SovereignTone, icon: AlertTriangle, label: 'Source dégradée', spin: false }
          : is('preview', 'seed', 'contract', 'foundation', 'fallback')
            ? { tone: 'violet' as SovereignTone, icon: Eye, label: 'Aperçu contractuel', spin: false }
            : is('shadow')
              ? { tone: 'cyan' as SovereignTone, icon: ShieldCheck, label: 'Données live · mode Shadow', spin: false }
              : is('empty')
                ? { tone: 'blue' as SovereignTone, icon: Circle, label: 'Source saine · aucun enregistrement', spin: false }
                : { tone: 'emerald' as SovereignTone, icon: Radio, label: 'Données live', spin: false }

  const Icon = state.icon
  return <div className={`rounded-2xl border px-3.5 py-3 ${toneMap[state.tone].border} ${toneMap[state.tone].wash}`}>
    <div className="flex items-center gap-2"><Icon size={15} className={`${state.spin ? 'animate-spin ' : ''}${state.tone === 'amber' ? 'text-amber-700' : state.tone === 'violet' ? 'text-violet-700' : state.tone === 'rose' ? 'text-rose-700' : state.tone === 'cyan' ? 'text-cyan-700' : state.tone === 'blue' ? 'text-blue-700' : 'text-emerald-700'}`} /><span className="text-[10px] font-black uppercase tracking-[.13em] text-slate-700">{state.label}</span>{traceId ? <span className="ml-auto font-mono text-[9px] text-slate-400">{traceId}</span> : null}</div>
    {freshness ? <p className="mt-1.5 text-[9px] text-slate-500">{Number.isNaN(new Date(freshness).getTime()) ? freshness : `Actualisé ${new Date(freshness).toLocaleString('fr-FR')}`}</p> : null}
    {warningList.length ? <p className="mt-1.5 text-[10px] leading-4 text-slate-600">{warningList.slice(0, 2).join(' · ')}</p> : null}
  </div>
}

export function SSectionNav({ items, active, onChange, tone = 'navy' }: { items: readonly string[]; active: string; onChange: (item: string) => void; tone?: SovereignTone }) {
  return <div className="flex gap-1.5 overflow-x-auto rounded-[22px] border border-slate-200 bg-white/80 p-2 shadow-[0_12px_34px_rgba(15,23,42,.045)] backdrop-blur-xl">
    {items.map((item, index) => <button key={item} onClick={() => onChange(item)} className={`group flex shrink-0 items-center gap-2 rounded-2xl px-3.5 py-2.5 text-[11px] font-black transition ${active === item ? `${toneMap[tone].chip} shadow-sm` : 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'}`}><span className={`grid h-5 w-5 place-items-center rounded-lg text-[9px] ${active === item ? 'bg-white/18' : 'bg-slate-100 text-slate-400'}`}>{String(index + 1).padStart(2, '0')}</span>{item}</button>)}
  </div>
}

export function SEmpty({ title, description, mode = 'empty', action, icon }: { title: string; description: string; mode?: 'empty' | 'locked' | 'unavailable'; action?: ReactNode; icon?: ElementType }) {
  const Icon = icon || (mode === 'locked' ? LockKeyhole : mode === 'unavailable' ? WifiOff : Circle)
  const tone: SovereignTone = mode === 'locked' ? 'amber' : mode === 'unavailable' ? 'rose' : 'blue'
  return <div className={`relative overflow-hidden rounded-[28px] border p-8 text-center ${toneMap[tone].border} ${toneMap[tone].wash} ${styles.dotField}`}>
    <SIcon icon={Icon} tone={tone} className="mx-auto" />
    <h3 className="mt-4 text-lg font-black tracking-tight text-slate-950">{title}</h3>
    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
    {action ? <div className="mt-5">{action}</div> : null}
  </div>
}

export function STraceLink({ traceId = '—', label = 'Ouvrir la trace', compact = false }: { traceId?: string; label?: string; compact?: boolean }) {
  return <span className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white text-[10px] font-black uppercase tracking-[.1em] text-slate-600 ${compact ? 'px-2.5 py-1.5' : 'px-3 py-2'}`}><ShieldCheck size={14} /><span className="font-mono normal-case tracking-normal">{traceId}</span><ChevronRight size={13} />{label}</span>
}

export function SCheckLine({ label, ok = true, detail }: { label: string; ok?: boolean; detail?: string }) {
  return <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white/80 p-3"><span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{ok ? <Check size={12} strokeWidth={3} /> : <AlertTriangle size={12} />}</span><div><p className="text-xs font-black text-slate-800">{label}</p>{detail ? <p className="mt-1 text-[10px] leading-4 text-slate-500">{detail}</p> : null}</div></div>
}

export { styles as sovereigntyStyles }

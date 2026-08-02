import type { ReactNode } from 'react'
import { ArrowRight, Check, CircleAlert, Clock3, Loader2, Sparkles } from 'lucide-react'

export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ')

export function FactoryHero({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return <section className="relative overflow-hidden rounded-[34px] border border-slate-800 bg-slate-950 px-6 py-7 text-white shadow-[0_30px_90px_rgba(15,23,42,.28)] sm:px-8 sm:py-9">
    <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full border-[48px] border-blue-500/10" />
    <div className="absolute inset-y-0 left-0 w-1.5 bg-blue-500" />
    <div className="relative flex flex-wrap items-start justify-between gap-6"><div className="max-w-5xl"><p className="text-[10px] font-black uppercase tracking-[.32em] text-blue-300">{eyebrow}</p><h1 className="mt-3 text-4xl font-black tracking-[-.055em] sm:text-5xl">{title}</h1><p className="mt-4 max-w-4xl text-sm font-semibold leading-6 text-slate-300">{description}</p></div>{actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}</div>
  </section>
}

export function FactorySurface({ title, subtitle, children, action, className }: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode; className?: string }) {
  return <section className={cx('rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_44px_rgba(15,23,42,.055)]', className)}><header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6"><div><h2 className="text-lg font-black tracking-[-.035em] text-slate-950">{title}</h2>{subtitle ? <p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-slate-500">{subtitle}</p> : null}</div>{action}</header><div className="p-5 sm:p-6">{children}</div></section>
}

export function PrimaryButton({ children, onClick, disabled, tone = 'blue', type = 'button' }: { children: ReactNode; onClick?: () => void; disabled?: boolean; tone?: 'blue' | 'emerald' | 'slate' | 'rose'; type?: 'button' | 'submit' }) {
  const style = tone === 'emerald' ? 'bg-emerald-600 text-white' : tone === 'rose' ? 'bg-rose-600 text-white' : tone === 'slate' ? 'border border-slate-200 bg-white text-slate-700' : 'bg-blue-600 text-white'
  return <button type={type} onClick={onClick} disabled={disabled} className={cx('inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-45', style)}>{disabled ? <Loader2 size={15} className="animate-spin" /> : null}{children}</button>
}

export function ChoiceChip({ selected, children, onClick }: { selected: boolean; children: ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cx('rounded-full border px-3 py-2 text-[11px] font-black transition', selected ? 'border-blue-600 bg-blue-600 text-white shadow-md' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700')}>{children}</button>
}

export function Signal({ tone, title, detail }: { tone: 'blue' | 'emerald' | 'amber' | 'rose'; title: string; detail: string }) {
  const classes = tone === 'emerald' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : tone === 'amber' ? 'border-amber-200 bg-amber-50 text-amber-900' : tone === 'rose' ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-blue-200 bg-blue-50 text-blue-900'
  return <div className={cx('flex items-start gap-3 rounded-2xl border p-4', classes)}>{tone === 'emerald' ? <Check className="mt-0.5 shrink-0" size={17} /> : tone === 'amber' || tone === 'rose' ? <CircleAlert className="mt-0.5 shrink-0" size={17} /> : <Sparkles className="mt-0.5 shrink-0" size={17} />}<div><p className="text-xs font-black">{title}</p><p className="mt-1 text-xs font-semibold leading-5 opacity-80">{detail}</p></div></div>
}

export function TimelineBlock({ start, end, label, source, objective }: { start: string; end: string; label: string; source: string; objective: string }) {
  return <article className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 md:grid-cols-[105px_1fr] md:items-start"><div className="flex items-center gap-2 text-xs font-black text-slate-950"><Clock3 size={14} className="text-blue-600" />{start}–{end}</div><div><div className="flex flex-wrap items-center gap-2"><h4 className="text-sm font-black text-slate-900">{label}</h4><span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-black uppercase tracking-[.12em] text-slate-500">{source}</span></div><p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{objective}</p></div></article>
}

export function ArrowLabel({ children }: { children: ReactNode }) { return <span className="inline-flex items-center gap-1 text-xs font-black text-blue-700">{children}<ArrowRight size={13} /></span> }

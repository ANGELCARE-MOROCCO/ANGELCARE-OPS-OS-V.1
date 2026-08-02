import type { ReactNode } from 'react'
import { ArrowRight, Check, CircleAlert, Clock3, Loader2, Sparkles } from 'lucide-react'
import { StudioHero, StudioSurface, sd2030 } from '../studio2030'

export const cx = sd2030

export function FactoryHero({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return <StudioHero eyebrow={eyebrow} title={title} description={description} actions={actions} chips={<><span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.14em] text-blue-200">Category-first</span><span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.14em] text-cyan-200">95% contrôlé</span><span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[.14em] text-emerald-200">Catalogue souverain</span></>} />
}

export function FactorySurface({ title, subtitle, children, action, className }: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode; className?: string }) {
  return <StudioSurface title={title} subtitle={subtitle} action={action} className={className}>{children}</StudioSurface>
}

export function PrimaryButton({ children, onClick, disabled, tone = 'blue', type = 'button' }: { children: ReactNode; onClick?: () => void; disabled?: boolean; tone?: 'blue' | 'emerald' | 'slate' | 'rose'; type?: 'button' | 'submit' }) {
  const style = tone === 'emerald' ? 'bg-emerald-600 text-white shadow-[0_12px_28px_rgba(5,150,105,.22)]' : tone === 'rose' ? 'bg-rose-600 text-white' : tone === 'slate' ? 'border border-slate-200 bg-white text-slate-700 shadow-sm' : 'bg-blue-600 text-white shadow-[0_12px_28px_rgba(37,99,235,.22)]'
  return <button type={type} onClick={onClick} disabled={disabled} className={cx('inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0', style)}>{disabled ? <Loader2 size={15} className="animate-spin" /> : null}{children}</button>
}

export function ChoiceChip({ selected, children, onClick }: { selected: boolean; children: ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cx('rounded-full border px-3 py-2 text-[11px] font-black transition hover:-translate-y-0.5', selected ? 'border-blue-600 bg-blue-600 text-white shadow-[0_8px_20px_rgba(37,99,235,.20)]' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700')}>{children}</button>
}

export function Signal({ tone, title, detail }: { tone: 'blue' | 'emerald' | 'amber' | 'rose'; title: string; detail: string }) {
  const classes = tone === 'emerald' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : tone === 'amber' ? 'border-amber-200 bg-amber-50 text-amber-900' : tone === 'rose' ? 'border-rose-200 bg-rose-50 text-rose-900' : 'border-blue-200 bg-blue-50 text-blue-900'
  return <div className={cx('flex items-start gap-3 rounded-[22px] border p-4', classes)}>{tone === 'emerald' ? <Check className="mt-0.5 shrink-0" size={17} /> : tone === 'amber' || tone === 'rose' ? <CircleAlert className="mt-0.5 shrink-0" size={17} /> : <Sparkles className="mt-0.5 shrink-0" size={17} />}<div><p className="text-xs font-black">{title}</p><p className="mt-1 text-xs font-semibold leading-5 opacity-80">{detail}</p></div></div>
}

export function TimelineBlock({ start, end, label, source, objective }: { start: string; end: string; label: string; source: string; objective: string }) {
  return <article className="group grid gap-3 rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm transition hover:border-blue-200 hover:shadow-md md:grid-cols-[112px_1fr] md:items-start"><div className="flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white"><Clock3 size={14} className="text-cyan-300" />{start}–{end}</div><div><div className="flex flex-wrap items-center gap-2"><h4 className="text-sm font-black text-slate-900">{label}</h4><span className="rounded-full bg-blue-50 px-2 py-1 text-[9px] font-black uppercase tracking-[.12em] text-blue-600">{source}</span></div><p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{objective}</p></div></article>
}

export function ArrowLabel({ children }: { children: ReactNode }) { return <span className="inline-flex items-center gap-1 text-xs font-black text-blue-700">{children}<ArrowRight size={13} /></span> }

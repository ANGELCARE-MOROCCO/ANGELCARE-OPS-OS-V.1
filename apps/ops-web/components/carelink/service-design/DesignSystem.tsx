import type { ReactNode } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CircleDot,
  Clock3,
  LockKeyhole,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'

export type Tone = 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate' | 'navy'

const toneMap: Record<Tone, { badge: string; soft: string; line: string; text: string; icon: string; glow: string }> = {
  blue: { badge: 'border-blue-200 bg-blue-50 text-blue-700', soft: 'border-blue-100 bg-blue-50/70', line: 'from-blue-600 to-cyan-400', text: 'text-blue-700', icon: 'bg-blue-100 text-blue-700', glow: 'shadow-[0_18px_44px_rgba(37,99,235,.12)]' },
  emerald: { badge: 'border-emerald-200 bg-emerald-50 text-emerald-700', soft: 'border-emerald-100 bg-emerald-50/70', line: 'from-emerald-600 to-teal-400', text: 'text-emerald-700', icon: 'bg-emerald-100 text-emerald-700', glow: 'shadow-[0_18px_44px_rgba(5,150,105,.11)]' },
  amber: { badge: 'border-amber-200 bg-amber-50 text-amber-800', soft: 'border-amber-100 bg-amber-50/70', line: 'from-amber-500 to-orange-400', text: 'text-amber-700', icon: 'bg-amber-100 text-amber-700', glow: 'shadow-[0_18px_44px_rgba(245,158,11,.12)]' },
  rose: { badge: 'border-rose-200 bg-rose-50 text-rose-700', soft: 'border-rose-100 bg-rose-50/70', line: 'from-rose-600 to-pink-400', text: 'text-rose-700', icon: 'bg-rose-100 text-rose-700', glow: 'shadow-[0_18px_44px_rgba(225,29,72,.11)]' },
  violet: { badge: 'border-violet-200 bg-violet-50 text-violet-700', soft: 'border-violet-100 bg-violet-50/70', line: 'from-violet-600 to-fuchsia-400', text: 'text-violet-700', icon: 'bg-violet-100 text-violet-700', glow: 'shadow-[0_18px_44px_rgba(124,58,237,.11)]' },
  slate: { badge: 'border-slate-200 bg-slate-50 text-slate-700', soft: 'border-slate-200 bg-slate-50/80', line: 'from-slate-600 to-slate-400', text: 'text-slate-700', icon: 'bg-slate-100 text-slate-700', glow: 'shadow-[0_18px_44px_rgba(15,23,42,.08)]' },
  navy: { badge: 'border-white/15 bg-white/10 text-white', soft: 'border-slate-800 bg-slate-950 text-white', line: 'from-blue-500 via-cyan-400 to-emerald-400', text: 'text-white', icon: 'bg-white/10 text-white', glow: 'shadow-[0_28px_88px_rgba(15,23,42,.26)]' },
}

export function cx(...values: Array<string | false | null | undefined>) { return values.filter(Boolean).join(' ') }

export function Badge({ children, tone = 'slate', icon }: { children: ReactNode; tone?: Tone; icon?: ReactNode }) {
  return <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[.16em]', toneMap[tone].badge)}>{icon}{children}</span>
}

export function WorkspaceTitle({ eyebrow, title, description, actions, tone = 'navy' }: { eyebrow: string; title: string; description: string; actions?: ReactNode; tone?: Tone }) {
  const dark = tone === 'navy'
  return (
    <section className={cx('group relative isolate overflow-hidden rounded-[36px] border px-6 py-7 sm:px-8 sm:py-9', dark ? 'border-slate-800 bg-[linear-gradient(135deg,#06132a_0%,#0d2446_58%,#123f72_100%)] text-white shadow-[0_30px_95px_rgba(15,23,42,.26)]' : cx('border-slate-200 bg-white', toneMap[tone].glow))}>
      <div className={cx('absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r', toneMap[tone].line)} />
      <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border-[52px] border-white/5" />
      <div className="pointer-events-none absolute bottom-0 right-[28%] h-40 w-40 rounded-full bg-cyan-400/5 blur-3xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-7">
        <div className="max-w-5xl">
          <div className="flex flex-wrap items-center gap-3"><span className={cx('grid h-8 w-8 place-items-center rounded-xl', dark ? 'bg-white/10 text-cyan-300' : toneMap[tone].icon)}><Sparkles size={14} /></span><p className={cx('text-[9px] font-black uppercase tracking-[.32em]', dark ? 'text-cyan-300' : toneMap[tone].text)}>{eyebrow}</p></div>
          <h1 className="mt-4 max-w-5xl text-3xl font-black tracking-[-.055em] sm:text-5xl">{title}</h1>
          <p className={cx('mt-4 max-w-4xl text-sm font-semibold leading-6', dark ? 'text-slate-300' : 'text-slate-600')}>{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  )
}

export function MetricCard({ label, value, detail, tone = 'blue', icon }: { label: string; value: ReactNode; detail: string; tone?: Tone; icon?: ReactNode }) {
  return (
    <article className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,.055)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_24px_60px_rgba(37,99,235,.10)]">
      <div className={cx('absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-75', toneMap[tone].line)} />
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-[9px] font-black uppercase tracking-[.2em] text-slate-400">{label}</p><div className="mt-2 text-3xl font-black tracking-[-.05em] text-slate-950">{value}</div></div>
        <div className={cx('grid h-11 w-11 place-items-center rounded-[18px]', toneMap[tone].icon)}>{icon || <CircleDot size={18} />}</div>
      </div>
      <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{detail}</p>
    </article>
  )
}

export function Panel({ title, subtitle, action, children, className }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx('overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_16px_48px_rgba(15,23,42,.065)]', className)}>
      <header className="relative flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="absolute bottom-0 left-6 h-px w-20 bg-gradient-to-r from-blue-600 to-cyan-400" />
        <div><h2 className="text-lg font-black tracking-[-.035em] text-slate-950">{title}</h2>{subtitle ? <p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-slate-500">{subtitle}</p> : null}</div>
        {action}
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  )
}

export function ProgressBar({ value, tone = 'blue', label }: { value: number; tone?: Tone; label?: string }) {
  const safe = Math.max(0, Math.min(100, Math.round(value || 0)))
  return <div><div className="mb-2 flex items-center justify-between gap-3 text-[9px] font-black uppercase tracking-[.15em] text-slate-400"><span>{label || 'Préparation'}</span><span>{safe}%</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={cx('h-full rounded-full bg-gradient-to-r transition-all duration-500', toneMap[tone].line)} style={{ width: `${safe}%` }} /></div></div>
}

export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return <div className="relative overflow-hidden rounded-[26px] border border-dashed border-slate-200 bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_100%)] px-6 py-10 text-center"><div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-blue-100/60 blur-3xl" /><div className="relative mx-auto grid h-13 w-13 place-items-center rounded-[20px] border border-slate-200 bg-white text-slate-400 shadow-sm"><CircleDot size={20} /></div><h3 className="relative mt-4 font-black text-slate-900">{title}</h3><p className="relative mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-500">{detail}</p>{action ? <div className="relative mt-5">{action}</div> : null}</div>
}

export function WarningBanner({ title, detail, blocking = false }: { title: string; detail: string; blocking?: boolean }) {
  return <div className={cx('flex items-start gap-3 rounded-[22px] border p-4', blocking ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50')}><div className={cx('mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[14px]', blocking ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700')}>{blocking ? <ShieldAlert size={17} /> : <AlertTriangle size={17} />}</div><div><p className={cx('text-sm font-black', blocking ? 'text-rose-950' : 'text-amber-950')}>{title}</p><p className={cx('mt-1 text-xs font-semibold leading-5', blocking ? 'text-rose-700' : 'text-amber-700')}>{detail}</p></div></div>
}

export function DecisionButton({ children, tone = 'blue', disabled, type = 'button', onClick }: { children: ReactNode; tone?: Tone; disabled?: boolean; type?: 'button' | 'submit'; onClick?: () => void }) {
  return <button type={type} disabled={disabled} onClick={onClick} className={cx('inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black transition duration-200 disabled:cursor-not-allowed disabled:opacity-50', tone === 'navy' ? 'bg-slate-950 text-white shadow-[0_12px_28px_rgba(15,23,42,.18)] hover:bg-slate-800' : tone === 'emerald' ? 'bg-emerald-600 text-white shadow-[0_12px_28px_rgba(5,150,105,.18)] hover:bg-emerald-700' : tone === 'rose' ? 'bg-rose-600 text-white hover:bg-rose-700' : tone === 'amber' ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : 'bg-blue-600 text-white shadow-[0_12px_28px_rgba(37,99,235,.18)] hover:bg-blue-700')}>{children}</button>
}

export function OutlineButton({ children, href }: { children: ReactNode; href?: string }) {
  const className = 'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
  return href ? <a href={href} className={className}>{children}<ArrowUpRight size={14} /></a> : <button className={className}>{children}</button>
}

export function StatusIcon({ status }: { status: string }) {
  if (['approved', 'active', 'committed'].includes(status)) return <CheckCircle2 size={16} className="text-emerald-600" />
  if (['blocked', 'rejected', 'failed'].includes(status)) return <ShieldAlert size={16} className="text-rose-600" />
  if (['review', 'pending', 'validated', 'partially_valid'].includes(status)) return <Clock3 size={16} className="text-amber-600" />
  return <LockKeyhole size={16} className="text-slate-400" />
}

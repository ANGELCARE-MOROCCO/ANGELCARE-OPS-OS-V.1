import type { ReactNode } from 'react'
import { AlertTriangle, ArrowUpRight, CheckCircle2, CircleDot, Clock3, LockKeyhole, ShieldAlert } from 'lucide-react'

export type Tone = 'blue' | 'emerald' | 'amber' | 'rose' | 'violet' | 'slate' | 'navy'

const toneMap: Record<Tone, { badge: string; soft: string; line: string; text: string; icon: string }> = {
  blue: { badge: 'border-blue-200 bg-blue-50 text-blue-700', soft: 'border-blue-100 bg-blue-50/70', line: 'bg-blue-500', text: 'text-blue-700', icon: 'bg-blue-100 text-blue-700' },
  emerald: { badge: 'border-emerald-200 bg-emerald-50 text-emerald-700', soft: 'border-emerald-100 bg-emerald-50/70', line: 'bg-emerald-500', text: 'text-emerald-700', icon: 'bg-emerald-100 text-emerald-700' },
  amber: { badge: 'border-amber-200 bg-amber-50 text-amber-800', soft: 'border-amber-100 bg-amber-50/70', line: 'bg-amber-500', text: 'text-amber-700', icon: 'bg-amber-100 text-amber-700' },
  rose: { badge: 'border-rose-200 bg-rose-50 text-rose-700', soft: 'border-rose-100 bg-rose-50/70', line: 'bg-rose-500', text: 'text-rose-700', icon: 'bg-rose-100 text-rose-700' },
  violet: { badge: 'border-violet-200 bg-violet-50 text-violet-700', soft: 'border-violet-100 bg-violet-50/70', line: 'bg-violet-500', text: 'text-violet-700', icon: 'bg-violet-100 text-violet-700' },
  slate: { badge: 'border-slate-200 bg-slate-50 text-slate-700', soft: 'border-slate-200 bg-slate-50/80', line: 'bg-slate-400', text: 'text-slate-700', icon: 'bg-slate-100 text-slate-700' },
  navy: { badge: 'border-slate-700 bg-slate-950 text-white', soft: 'border-slate-800 bg-slate-950 text-white', line: 'bg-white', text: 'text-white', icon: 'bg-white/10 text-white' },
}

export function cx(...values: Array<string | false | null | undefined>) { return values.filter(Boolean).join(' ') }

export function Badge({ children, tone = 'slate', icon }: { children: ReactNode; tone?: Tone; icon?: ReactNode }) {
  return <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]', toneMap[tone].badge)}>{icon}{children}</span>
}

export function WorkspaceTitle({ eyebrow, title, description, actions, tone = 'blue' }: { eyebrow: string; title: string; description: string; actions?: ReactNode; tone?: Tone }) {
  return (
    <section className={cx('relative overflow-hidden rounded-[32px] border p-7 shadow-[0_18px_52px_rgba(15,23,42,0.08)]', tone === 'navy' ? 'border-slate-800 bg-slate-950 text-white' : 'border-slate-200 bg-white')}>
      <div className={cx('absolute inset-y-0 left-0 w-1.5', toneMap[tone].line)} />
      <div className="relative flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-5xl">
          <p className={cx('text-[10px] font-black uppercase tracking-[0.34em]', tone === 'navy' ? 'text-blue-300' : toneMap[tone].text)}>{eyebrow}</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-0.05em] sm:text-5xl">{title}</h1>
          <p className={cx('mt-4 max-w-4xl text-sm font-semibold leading-6', tone === 'navy' ? 'text-slate-300' : 'text-slate-600')}>{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </section>
  )
}

export function MetricCard({ label, value, detail, tone = 'blue', icon }: { label: string; value: ReactNode; detail: string; tone?: Tone; icon?: ReactNode }) {
  return (
    <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
          <div className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950">{value}</div>
        </div>
        <div className={cx('grid h-10 w-10 place-items-center rounded-2xl', toneMap[tone].icon)}>{icon || <CircleDot size={18} />}</div>
      </div>
      <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{detail}</p>
    </article>
  )
}

export function Panel({ title, subtitle, action, children, className }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx('rounded-[30px] border border-slate-200 bg-white shadow-[0_16px_44px_rgba(15,23,42,0.07)]', className)}>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
        <div>
          <h2 className="text-lg font-black tracking-[-0.03em] text-slate-950">{title}</h2>
          {subtitle ? <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{subtitle}</p> : null}
        </div>
        {action}
      </header>
      <div className="p-6">{children}</div>
    </section>
  )
}

export function ProgressBar({ value, tone = 'blue', label }: { value: number; tone?: Tone; label?: string }) {
  const safe = Math.max(0, Math.min(100, Math.round(value || 0)))
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400"><span>{label || 'Préparation'}</span><span>{safe}%</span></div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className={cx('h-full rounded-full transition-all', toneMap[tone].line)} style={{ width: `${safe}%` }} /></div>
    </div>
  )
}

export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center"><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm"><CircleDot size={20} /></div><h3 className="mt-4 font-black text-slate-800">{title}</h3><p className="mx-auto mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-500">{detail}</p>{action ? <div className="mt-5">{action}</div> : null}</div>
}

export function WarningBanner({ title, detail, blocking = false }: { title: string; detail: string; blocking?: boolean }) {
  return <div className={cx('flex items-start gap-3 rounded-2xl border p-4', blocking ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50')}><div className={cx('mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl', blocking ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700')}>{blocking ? <ShieldAlert size={17} /> : <AlertTriangle size={17} />}</div><div><p className={cx('text-sm font-black', blocking ? 'text-rose-900' : 'text-amber-900')}>{title}</p><p className={cx('mt-1 text-xs font-semibold leading-5', blocking ? 'text-rose-700' : 'text-amber-700')}>{detail}</p></div></div>
}

export function DecisionButton({ children, tone = 'blue', disabled, type = 'button', onClick }: { children: ReactNode; tone?: Tone; disabled?: boolean; type?: 'button' | 'submit'; onClick?: () => void }) {
  return <button type={type} disabled={disabled} onClick={onClick} className={cx('inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50', tone === 'navy' ? 'bg-slate-950 text-white hover:bg-slate-800' : tone === 'emerald' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : tone === 'rose' ? 'bg-rose-600 text-white hover:bg-rose-700' : tone === 'amber' ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : 'bg-blue-600 text-white hover:bg-blue-700')}>{children}</button>
}

export function OutlineButton({ children, href }: { children: ReactNode; href?: string }) {
  const className = 'inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
  return href ? <a href={href} className={className}>{children}<ArrowUpRight size={14} /></a> : <button className={className}>{children}</button>
}

export function StatusIcon({ status }: { status: string }) {
  if (['approved', 'active', 'committed'].includes(status)) return <CheckCircle2 size={16} className="text-emerald-600" />
  if (['blocked', 'rejected', 'failed'].includes(status)) return <ShieldAlert size={16} className="text-rose-600" />
  if (['review', 'pending', 'validated', 'partially_valid'].includes(status)) return <Clock3 size={16} className="text-amber-600" />
  return <LockKeyhole size={16} className="text-slate-400" />
}

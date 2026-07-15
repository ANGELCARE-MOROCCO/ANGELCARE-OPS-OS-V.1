import Link from 'next/link'
import type { ReactNode } from 'react'

export function WorkforceOpsShell({ children }: { children: ReactNode }) {
  return <div className="space-y-6">{children}</div>
}

export function WorkforceOpsHero({ title, subtitle, score, actions }: { title: string; subtitle: string; score?: number; actions?: ReactNode }) {
  return (
    <section className="relative overflow-hidden rounded-[36px] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,.28),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,.22),transparent_34%)]" />
      <div className="relative z-10 flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-5xl space-y-4">
          <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[.28em] text-slate-200">AngelCare Workforce OS</div>
          <h1 className="text-4xl font-black tracking-tight md:text-5xl">{title}</h1>
          <p className="max-w-4xl text-sm leading-7 text-slate-300 md:text-base">{subtitle}</p>
          {actions ? <div className="flex flex-wrap gap-2 pt-2">{actions}</div> : null}
        </div>
        {typeof score === 'number' ? (
          <div className="min-w-[240px] rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
            <div className="text-xs font-black uppercase tracking-[.22em] text-slate-300">Operational score</div>
            <div className="mt-2 text-4xl font-black">{score}%</div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-white" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} /></div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export function WorkforceButton({ href, children, variant = 'dark' }: { href: string; children: ReactNode; variant?: 'dark' | 'light' | 'danger' }) {
  const cls = variant === 'dark' ? 'bg-slate-950 text-white hover:bg-slate-800' : variant === 'danger' ? 'bg-rose-600 text-white hover:bg-rose-700' : 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50'
  return <Link href={href} className={`rounded-full px-4 py-2 text-xs font-black shadow-sm transition ${cls}`}>{children}</Link>
}

export function WorkforceMetric({ title, value, detail }: { title: string; value: ReactNode; detail?: string }) {
  return <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><div className="text-xs font-black uppercase tracking-[.2em] text-slate-400">{title}</div><div className="mt-3 text-3xl font-black text-slate-950">{value}</div>{detail ? <div className="mt-2 text-xs font-semibold text-slate-500">{detail}</div> : null}</div>
}

export function WorkforcePanel({ title, subtitle, children, action }: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode }) {
  return <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><h2 className="text-xl font-black text-slate-950">{title}</h2>{subtitle ? <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p> : null}</div>{action}</div>{children}</section>
}

export function WorkforceBadge({ value }: { value?: string | null }) {
  const v = String(value || 'pending').toLowerCase()
  const cls = v.includes('valid') || v.includes('complete') || v.includes('covered') || v.includes('approved') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : v.includes('late') || v.includes('missing') || v.includes('conflict') || v.includes('risk') || v.includes('review') ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${cls}`}>{value || 'pending'}</span>
}

export function WorkforceTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return <div className="overflow-hidden rounded-2xl border border-slate-200"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs font-black uppercase tracking-[.16em] text-slate-500"><tr>{headers.map(h => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.length ? rows.map((row, i) => <tr key={i} className="bg-white hover:bg-slate-50">{row.map((cell, j) => <td key={j} className="px-4 py-3 align-top text-slate-700">{cell}</td>)}</tr>) : <tr><td colSpan={headers.length} className="px-4 py-8 text-center text-sm font-semibold text-slate-400">No records found</td></tr>}</tbody></table></div>
}

export function ShiftVisualBlock({ title, time, status, meta }: { title: string; time: string; status?: string; meta?: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3 shadow-sm"><div className="flex items-start justify-between gap-2"><div><div className="text-sm font-black text-slate-950">{title}</div><div className="mt-1 text-xs font-bold text-slate-500">{time}</div>{meta ? <div className="mt-2 text-xs font-semibold text-slate-500">{meta}</div> : null}</div><WorkforceBadge value={status} /></div></div>
}

import Link from 'next/link'
import type { ReactNode } from 'react'

export function RosterShell({ children }: { children: ReactNode }) {
  return <div className="space-y-6">{children}</div>
}

export function RosterHero({ title, subtitle, actions, score }: { title: string; subtitle?: string; actions?: ReactNode; score?: number }) {
  return (
    <section className="relative overflow-hidden rounded-[34px] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,.24),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,.2),transparent_34%)]" />
      <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl space-y-3">
          <div className="text-xs font-black uppercase tracking-[.28em] text-slate-300">AngelCare Roster OS</div>
          <h1 className="text-3xl font-black tracking-tight md:text-5xl">{title}</h1>
          {subtitle ? <p className="max-w-3xl text-sm leading-7 text-slate-300 md:text-base">{subtitle}</p> : null}
          {actions ? <div className="flex flex-wrap gap-2 pt-2">{actions}</div> : null}
        </div>
        {typeof score === 'number' ? (
          <div className="min-w-[230px] rounded-[28px] border border-white/15 bg-white/10 p-5 backdrop-blur">
            <div className="text-xs font-black uppercase tracking-[.22em] text-slate-300">Coverage</div>
            <div className="mt-2 text-4xl font-black">{score}%</div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-white" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export function RosterButton({ href, children, variant = 'dark' }: { href: string; children: ReactNode; variant?: 'dark' | 'light' | 'danger' }) {
  const cls = variant === 'dark' ? 'bg-slate-950 text-white hover:bg-slate-800' : variant === 'danger' ? 'bg-rose-600 text-white hover:bg-rose-700' : 'border border-slate-200 bg-white text-slate-900 hover:bg-slate-50'
  return <Link href={href} className={`rounded-full px-4 py-2 text-xs font-black shadow-sm transition ${cls}`}>{children}</Link>
}

export function RosterMetric({ title, value, detail }: { title: string; value: ReactNode; detail?: string }) {
  return <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"><div className="text-xs font-black uppercase tracking-[.2em] text-slate-400">{title}</div><div className="mt-3 text-3xl font-black text-slate-950">{value}</div>{detail ? <div className="mt-2 text-xs font-semibold text-slate-500">{detail}</div> : null}</div>
}

export function RosterPanel({ title, subtitle, children, action }: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode }) {
  return <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><h2 className="text-xl font-black text-slate-950">{title}</h2>{subtitle ? <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p> : null}</div>{action}</div>{children}</section>
}

export function RosterStatus({ value }: { value?: string | null }) {
  const v = String(value || 'planned').toLowerCase()
  const cls = v.includes('confirmed') || v.includes('covered') || v.includes('approved') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : v.includes('conflict') || v.includes('missing') || v.includes('uncovered') || v.includes('risk') ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200'
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black ${cls}`}>{value || 'planned'}</span>
}

export function RosterTable({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return <div className="overflow-hidden rounded-2xl border border-slate-200"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs font-black uppercase tracking-[.16em] text-slate-500"><tr>{headers.map(h => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.length ? rows.map((row, i) => <tr key={i} className="bg-white hover:bg-slate-50">{row.map((cell, j) => <td key={j} className="px-4 py-3 align-top text-slate-700">{cell}</td>)}</tr>) : <tr><td className="px-4 py-6 text-center text-sm font-semibold text-slate-400" colSpan={headers.length}>No roster records yet</td></tr>}</tbody></table></div>
}

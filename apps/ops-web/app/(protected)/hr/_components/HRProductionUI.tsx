import Link from 'next/link'
import React from 'react'

export function HRCard({ title, value, subtitle }: { title: string; value: React.ReactNode; subtitle?: string }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="text-xs font-black uppercase tracking-[0.22em] text-slate-500">{title}</div>
    <div className="mt-2 text-3xl font-black text-slate-950">{value}</div>
    {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
  </div>
}

export function HRSection({ title, subtitle, children, action }: { title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-xl font-black text-slate-950">{title}</h2>{subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}</div>
      {action}
    </div>
    {children}
  </section>
}

export function HRAction({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="rounded-2xl border border-slate-200 bg-slate-950 px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-slate-800">{children}</Link>
}

export function HRLightAction({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-800 shadow-sm hover:bg-slate-50">{children}</Link>
}

export function HRTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return <div className="overflow-hidden rounded-3xl border border-slate-200">
    <table className="w-full text-left text-sm">
      <thead className="bg-slate-50 text-xs uppercase tracking-[0.16em] text-slate-500"><tr>{headers.map((h) => <th key={h} className="px-4 py-3 font-black">{h}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-100">{rows.map((r, i) => <tr key={i} className="bg-white align-top">{r.map((c, j) => <td key={j} className="px-4 py-3 text-slate-700">{c}</td>)}</tr>)}</tbody>
    </table>
  </div>
}

export function HRStatusPill({ value }: { value?: string | null }) {
  return <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-700">{value || 'pending'}</span>
}

import Link from 'next/link'
import type { ReactNode } from 'react'

type ControlPage = 'quality' | 'handover' | 'escalations' | 'audit' | 'review' | 'standards'

const pages = [
  { key: 'quality', label: 'Quality Control', href: '/hr/quality-control' },
  { key: 'handover', label: 'Shift Handover', href: '/hr/shift-handover' },
  { key: 'escalations', label: 'Escalations', href: '/hr/escalations' },
  { key: 'audit', label: 'Audit Center', href: '/hr/audit-center' },
  { key: 'review', label: 'Manager Review', href: '/hr/manager-review' },
  { key: 'standards', label: 'Service Standards', href: '/hr/service-standards' },
]

const stats = [
  ['Open escalations', '07', '2 critical'],
  ['Quality checks', '42', 'this week'],
  ['Handovers pending', '05', 'needs review'],
  ['Audit trail events', '318', 'last 7 days'],
]

export default function OperationalControlShell({ active, children }: { active: ControlPage; children: ReactNode }) {
  const pageTitle: Record<ControlPage, string> = {
    quality: 'Quality Control Board',
    handover: 'Shift Handover Console',
    escalations: 'Escalation Control Tower',
    audit: 'HR Audit Center',
    review: 'Manager Review Desk',
    standards: 'Service Standards Library',
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,#1e40af55,transparent_35%),linear-gradient(135deg,#020617,#0f172a_55%,#111827)] px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.35em] text-cyan-300">AngelCare HR V2 · Operational Control</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight lg:text-5xl">{pageTitle[active]}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                Human-first execution layer for supervisors and HR officers: control quality, review handovers, escalate issues, audit actions, and keep staff execution aligned with AngelCare standards.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/hr" className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20">Back to HR</Link>
              <Link href="/hr/human-engine" className="rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-cyan-300">Human Engine</Link>
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {stats.map(([label, value, note]) => (
              <div key={label} className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
                <p className="text-xs uppercase tracking-widest text-slate-400">{label}</p>
                <p className="mt-2 text-3xl font-black">{value}</p>
                <p className="mt-1 text-xs text-cyan-200">{note}</p>
              </div>
            ))}
          </div>
          <nav className="mt-6 flex gap-2 overflow-x-auto rounded-3xl border border-white/10 bg-black/20 p-2">
            {pages.map((p) => (
              <Link key={p.key} href={p.href} className={`whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-bold transition ${active === p.key ? 'bg-white text-slate-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>{p.label}</Link>
            ))}
          </nav>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-8">{children}</section>
    </main>
  )
}

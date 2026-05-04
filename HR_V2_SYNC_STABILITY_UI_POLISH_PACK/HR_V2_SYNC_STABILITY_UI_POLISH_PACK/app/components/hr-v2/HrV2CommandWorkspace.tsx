'use client'

import { useMemo, useState } from 'react'

type Kpi = { label: string; value: string; note?: string }
type Action = { label: string; href?: string; tone?: 'primary' | 'neutral' | 'danger' }

type WorkspaceProps = {
  title: string
  subtitle: string
  module: string
  kpis: Kpi[]
  primaryActions: Action[]
  rows: Array<Record<string, string>>
  panels?: { title: string; body: string; action?: string }[]
}

const baseRows = [
  { staff: 'Caregiver pool', status: 'Active', owner: 'Roster Planner', priority: 'High', target: 'Coverage today' },
  { staff: 'Office team', status: 'Pending review', owner: 'HR Officer', priority: 'Medium', target: 'Documents' },
  { staff: 'Field supervisors', status: 'Controlled', owner: 'Operations Manager', priority: 'High', target: 'Incidents' },
]

export default function HrV2CommandWorkspace({ title, subtitle, module, kpis, primaryActions, rows, panels = [] }: WorkspaceProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const data = rows.length ? rows : baseRows

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return data
    return data.filter((row) => Object.values(row).join(' ').toLowerCase().includes(q))
  }, [query, data])

  function toggle(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">AngelCare HR V2 · {module}</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">{title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{subtitle}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {primaryActions.map((action) => (
                <a key={action.label} href={action.href || '#'} className={`rounded-2xl px-4 py-3 text-sm font-bold shadow-lg transition hover:-translate-y-0.5 ${action.tone === 'primary' ? 'bg-cyan-400 text-slate-950' : action.tone === 'danger' ? 'bg-rose-500 text-white' : 'bg-white/10 text-white ring-1 ring-white/15'}`}>{action.label}</a>
              ))}
            </div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
                <p className="text-xs uppercase tracking-widest text-slate-400">{kpi.label}</p>
                <p className="mt-3 text-3xl font-black">{kpi.value}</p>
                <p className="mt-2 text-xs text-slate-400">{kpi.note || 'Live operational signal'}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl">
            <div className="grid gap-3 md:grid-cols-[1fr_170px_170px_170px]">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search staff, department, status, owner..." className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none ring-cyan-400/40 focus:ring-2" />
              <select className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"><option>All departments</option><option>Care Operations</option><option>Core Office Staff</option><option>Revenue / Sales</option></select>
              <select className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"><option>All statuses</option><option>Active</option><option>Pending</option><option>At risk</option></select>
              <button className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold ring-1 ring-white/15">Export View</button>
            </div>
            {selected.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 p-3 text-sm">
                <strong>{selected.length} selected</strong>
                <button className="rounded-xl bg-cyan-400 px-3 py-2 font-bold text-slate-950">Assign</button>
                <button className="rounded-xl bg-white/10 px-3 py-2 font-bold">Send memo</button>
                <button className="rounded-xl bg-white/10 px-3 py-2 font-bold">Change status</button>
                <button className="rounded-xl bg-rose-500 px-3 py-2 font-bold text-white">Escalate</button>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-2xl">
            <div className="border-b border-white/10 p-5">
              <h2 className="text-xl font-black">Operational Control Grid</h2>
              <p className="mt-1 text-sm text-slate-400">Manual execution surface with selection, row actions, routing, tracking, and control readiness.</p>
            </div>
            <div className="divide-y divide-white/10">
              {filtered.map((row, index) => {
                const id = `${module}-${index}`
                return (
                  <div key={id} className="grid gap-4 p-5 transition hover:bg-white/[0.04] md:grid-cols-[40px_1.2fr_1fr_1fr_1fr_220px] md:items-center">
                    <input type="checkbox" checked={selected.includes(id)} onChange={() => toggle(id)} className="h-5 w-5" />
                    <div><p className="font-black">{row.staff || row.name || row.item || 'Operational row'}</p><p className="text-xs text-slate-400">Target: {row.target || 'Daily execution'}</p></div>
                    <p className="text-sm"><span className="rounded-full bg-emerald-400/15 px-3 py-1 text-emerald-200">{row.status || 'Active'}</span></p>
                    <p className="text-sm text-slate-300">{row.owner || 'HR Manager'}</p>
                    <p className="text-sm text-slate-300">Priority: {row.priority || 'Medium'}</p>
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold">View</button>
                      <button className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold">Edit</button>
                      <button className="rounded-xl bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950">Execute</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl">
            <h3 className="text-lg font-black">Command Panel</h3>
            <div className="mt-4 grid gap-2">
              <button className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950">Create record</button>
              <button className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold">Bulk operation</button>
              <button className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold">Sync check</button>
              <button className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold">Open audit trail</button>
            </div>
          </div>
          {(panels.length ? panels : [
            { title: 'Stability guard', body: 'Safe fallbacks enabled. Missing optional tables should not crash the page.' },
            { title: 'Execution rule', body: 'Every row must be viewable, editable, assignable, trackable and export-ready.' },
            { title: 'Sync focus', body: 'HR links staff, roster, leave, documents, attendance, tasks and mission signals.' },
          ]).map((panel) => (
            <div key={panel.title} className="rounded-3xl border border-white/10 bg-white/[0.05] p-5">
              <h4 className="font-black">{panel.title}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-300">{panel.body}</p>
              {panel.action && <button className="mt-4 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold">{panel.action}</button>}
            </div>
          ))}
        </aside>
      </section>
    </main>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'

type AnyRecord = Record<string, any>
type DrawerKey =
  | 'missions'
  | 'activeMissions'
  | 'pendingValidation'
  | 'unassigned'
  | 'highRisk'
  | 'routeGaps'
  | 'dispatchAssignments'
  | 'scheduleItems'
  | 'queuedNotifications'
  | 'workflows'
  | 'caregivers'

function text(value: unknown, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

function number(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function pct(value: unknown) {
  return `${Math.max(0, Math.min(100, number(value)))}%`
}

function toneClasses(tone: string) {
  if (tone === 'rose') return 'border-rose-200 bg-rose-50 text-rose-700'
  if (tone === 'amber') return 'border-amber-200 bg-amber-50 text-amber-700'
  if (tone === 'emerald') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (tone === 'blue') return 'border-blue-200 bg-blue-50 text-blue-700'
  return 'border-slate-200 bg-white text-slate-700'
}

const DRAWER_META: Record<DrawerKey, { title: string; subtitle: string; href: string }> = {
  missions: { title: 'All missions', subtitle: 'Canonical public.missions records.', href: '/carelink-ops/missions' },
  activeMissions: { title: 'Active missions', subtitle: 'Started, dispatched, assigned or in-progress missions.', href: '/carelink-ops/missions' },
  pendingValidation: { title: 'Pending validation', subtitle: 'Missions requiring validation, readiness or review.', href: '/carelink-ops/missions' },
  unassigned: { title: 'Unassigned missions', subtitle: 'Missions missing primary caregiver assignment.', href: '/carelink-ops/dispatch' },
  highRisk: { title: 'High risk / SLA pressure', subtitle: 'Risk, urgency and SLA watchlist.', href: '/carelink-ops/missions' },
  routeGaps: { title: 'Route gaps', subtitle: 'Missions missing route or transport configuration.', href: '/carelink-ops/dispatch' },
  dispatchAssignments: { title: 'Dispatch assignments', subtitle: 'Persistent dispatch assignment overlay.', href: '/carelink-ops/dispatch' },
  scheduleItems: { title: 'Schedule items', subtitle: 'Manual schedule blocks and schedule workflow states.', href: '/carelink-ops/schedule' },
  queuedNotifications: { title: 'Queued notifications', subtitle: 'Admin, supervisor, mobile and module notifications waiting for action.', href: '/carelink-ops/notifications' },
  workflows: { title: 'Action stream', subtitle: 'Mission, dispatch and schedule action logs.', href: '/carelink-ops/audit' },
  caregivers: { title: 'Caregivers / agents', subtitle: 'Caregiver source and mobile readiness.', href: '/carelink-ops/agents' },
}

export default function CareLinkOpsOverviewExecutiveCommandCenter() {
  const [payload, setPayload] = useState<any>({ summary: {}, records: {} })
  const [loading, setLoading] = useState(true)
  const [drawer, setDrawer] = useState<DrawerKey | null>(null)
  const [query, setQuery] = useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/carelink/ops/overview-command', { cache: 'no-store' })
      const json = await res.json()
      setPayload(json || { summary: {}, records: {} })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const timer = window.setInterval(load, 45000)
    return () => window.clearInterval(timer)
  }, [])

  const summary = payload.summary || {}
  const records = payload.records || {}
  const selectedRows = drawer ? (Array.isArray(records[drawer]) ? records[drawer] : []) : []
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return selectedRows
    return selectedRows.filter((row: AnyRecord) => JSON.stringify(row).toLowerCase().includes(q))
  }, [query, selectedRows])

  const health = number(summary.healthScore)

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#dbeafe_0,transparent_28%),radial-gradient(circle_at_top_right,#dcfce7_0,transparent_25%),linear-gradient(180deg,#f8fafc_0%,#eef4ff_50%,#f8fafc_100%)] px-6 py-6">
      <div className="pointer-events-none fixed -left-32 -top-32 h-96 w-96 rounded-full bg-blue-300/30 blur-3xl" />
      <div className="pointer-events-none fixed -right-32 bottom-0 h-96 w-96 rounded-full bg-emerald-300/25 blur-3xl" />

      <header className="relative overflow-hidden rounded-[46px] border border-white/80 bg-white/95 p-6 shadow-[0_30px_100px_rgba(15,23,42,0.14)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-100/80 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.3em] text-blue-700">
              CareLink Ops · Executive Overview
            </div>
            <h1 className="mt-4 max-w-7xl text-5xl font-black tracking-[-0.075em] text-slate-950">
              Live command center for missions, dispatch, schedule and agents
            </h1>
            <p className="mt-3 max-w-6xl text-sm font-semibold leading-6 text-slate-500">
              Reads directly from hardened modules: public.missions, dispatch assignments, schedule workflow, agent readiness, notifications and action logs. No duplicate fake state.
            </p>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-slate-950 p-5 text-white shadow-2xl">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">Operating health</div>
            <div className="mt-2 text-6xl font-black tracking-[-0.08em]">{health}%</div>
            <div className="mt-4 h-2 w-56 rounded-full bg-white/10">
              <div className="h-2 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-300 to-blue-400" style={{ width: pct(health) }} />
            </div>
            <div className="mt-3 text-xs font-bold text-white/55">{loading ? 'Syncing live sources...' : `Updated ${text(payload.generatedAt)}`}</div>
          </div>
        </div>

        <div className="relative mt-6 grid gap-3 md:grid-cols-4 xl:grid-cols-8">
          <Kpi label="Missions" value={summary.missions} detail="public.missions" tone="blue" open={() => setDrawer('missions')} />
          <Kpi label="Active" value={summary.activeMissions} detail="live / assigned" tone="emerald" open={() => setDrawer('activeMissions')} />
          <Kpi label="Validation" value={summary.pendingValidation} detail="needs review" tone="amber" open={() => setDrawer('pendingValidation')} />
          <Kpi label="Unassigned" value={summary.unassigned} detail="needs dispatch" tone="rose" open={() => setDrawer('unassigned')} />
          <Kpi label="Risk / SLA" value={summary.highRisk} detail="watchlist" tone="rose" open={() => setDrawer('highRisk')} />
          <Kpi label="Route gaps" value={summary.routeGaps} detail="transport missing" tone="amber" open={() => setDrawer('routeGaps')} />
          <Kpi label="Notifications" value={summary.queuedNotifications} detail="queued" tone="blue" open={() => setDrawer('queuedNotifications')} />
          <Kpi label="Agents" value={`${summary.mobileReady || 0}/${summary.caregivers || 0}`} detail="mobile ready" tone="emerald" open={() => setDrawer('caregivers')} />
        </div>
      </header>

      <section className="relative z-10 mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[40px] border border-slate-200 bg-white/95 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-700">Mission lifecycle pressure</div>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-950">Canonical mission health</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">Directly summarized from public.missions and mission workflow layers.</p>
            </div>
            <a href="/carelink-ops/missions" className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Open Missions</a>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Signal title="Completed" value={summary.completedMissions} total={summary.missions} tone="emerald" />
            <Signal title="Cancelled" value={summary.cancelledMissions} total={summary.missions} tone="rose" />
            <Signal title="Pending validation" value={summary.pendingValidation} total={summary.missions} tone="amber" />
            <Signal title="Unassigned" value={summary.unassigned} total={summary.missions} tone="rose" />
            <Signal title="Route gaps" value={summary.routeGaps} total={summary.missions} tone="amber" />
            <Signal title="High risk" value={summary.highRisk} total={summary.missions} tone="rose" />
          </div>
        </div>

        <div className="grid gap-4">
          <CommandLink title="Dispatch pressure" value={summary.dispatchAssignments} detail="Persistent assignment records and bridge attempts." href="/carelink-ops/dispatch" open={() => setDrawer('dispatchAssignments')} />
          <CommandLink title="Schedule load" value={summary.scheduleItems} detail="Schedule blocks and workflow states." href="/carelink-ops/schedule" open={() => setDrawer('scheduleItems')} />
          <CommandLink title="Action stream" value={summary.workflows} detail="Mission, dispatch and schedule logs." href="/carelink-ops/audit" open={() => setDrawer('workflows')} />
        </div>
      </section>

      <section className="relative z-10 mt-5 grid gap-4 lg:grid-cols-3">
        <StreamCard title="Mission risk queue" rows={records.highRisk || []} open={() => setDrawer('highRisk')} />
        <StreamCard title="Unassigned dispatch queue" rows={records.unassigned || []} open={() => setDrawer('unassigned')} />
        <StreamCard title="Notifications queue" rows={records.queuedNotifications || []} open={() => setDrawer('queuedNotifications')} />
      </section>

      {drawer ? (
        <div className="fixed inset-0 z-[7000] bg-slate-950/45 p-5 backdrop-blur-sm">
          <div className="ml-auto flex max-h-[calc(100vh-40px)] max-w-6xl flex-col overflow-hidden rounded-[38px] border border-white bg-white shadow-[0_40px_100px_rgba(2,6,23,0.35)]">
            <div className="border-b border-slate-200 p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.28em] text-blue-700">Live drill-down</div>
                  <h3 className="mt-2 text-4xl font-black tracking-[-0.06em] text-slate-950">{DRAWER_META[drawer].title}</h3>
                  <p className="mt-2 text-sm font-semibold text-slate-500">{DRAWER_META[drawer].subtitle}</p>
                </div>
                <div className="flex gap-2">
                  <a href={DRAWER_META[drawer].href} className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white">Open module</a>
                  <button onClick={() => setDrawer(null)} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700">Close</button>
                </div>
              </div>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search inside this live drill-down..." className="mt-5 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none" />
            </div>

            <div className="grid flex-1 gap-3 overflow-y-auto p-6">
              {filteredRows.slice(0, 120).map((row: AnyRecord, index: number) => (
                <RecordRow key={`${drawer}-${row.id || index}`} row={row} />
              ))}
              {!filteredRows.length ? <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-sm font-black text-slate-400">No related records loaded.</div> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Kpi({ label, value, detail, tone, open }: { label: string; value: any; detail: string; tone: string; open: () => void }) {
  return (
    <button onClick={open} className={`rounded-[28px] border p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${toneClasses(tone)}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.24em] opacity-70">{label}</div>
      <div className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950">{text(value, '0')}</div>
      <div className="mt-2 text-xs font-bold text-slate-500">{detail}</div>
    </button>
  )
}

function Signal({ title, value, total, tone }: { title: string; value: any; total: any; tone: string }) {
  const count = number(value)
  const all = Math.max(number(total), 1)
  const width = Math.round((count / all) * 100)
  return (
    <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-black text-slate-950">{title}</div>
        <div className="text-2xl font-black text-slate-950">{count}</div>
      </div>
      <div className="mt-4 h-2 rounded-full bg-white">
        <div className={`h-2 rounded-full ${tone === 'rose' ? 'bg-rose-500' : tone === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, width)}%` }} />
      </div>
      <div className="mt-2 text-xs font-bold text-slate-500">{width}% of missions</div>
    </div>
  )
}

function CommandLink({ title, value, detail, href, open }: { title: string; value: any; detail: string; href: string; open: () => void }) {
  return (
    <div className="rounded-[34px] border border-slate-200 bg-white/95 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">Command bridge</div>
          <h3 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">{title}</h3>
          <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{detail}</p>
        </div>
        <div className="text-4xl font-black tracking-[-0.06em] text-slate-950">{text(value, '0')}</div>
      </div>
      <div className="mt-5 flex gap-2">
        <button onClick={open} className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-black text-blue-700">Drill down</button>
        <a href={href} className="rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white">Open page</a>
      </div>
    </div>
  )
}

function StreamCard({ title, rows, open }: { title: string; rows: AnyRecord[]; open: () => void }) {
  return (
    <button onClick={open} className="rounded-[34px] border border-slate-200 bg-white/95 p-5 text-left shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl transition hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-black tracking-[-0.04em] text-slate-950">{title}</h3>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">{rows.length}</span>
      </div>
      <div className="mt-4 grid gap-2">
        {rows.slice(0, 5).map((row, index) => (
          <div key={row.id || index} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-sm font-black text-slate-950">{text(row.mission_code || row.title || row.action || row.service_type || row.id)}</div>
            <div className="mt-1 text-xs font-bold text-slate-500">{text(row.city || row.audience_type || row.status || row.dispatch_status || row.validation_status)}</div>
          </div>
        ))}
        {!rows.length ? <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-xs font-black text-slate-400">No pressure records</div> : null}
      </div>
    </button>
  )
}

function RecordRow({ row }: { row: AnyRecord }) {
  return (
    <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-sm font-black text-slate-950">{text(row.mission_code || row.title || row.action || row.action_type || row.id)}</div>
          <div className="mt-1 text-xs font-bold text-slate-500">
            {text(row.city || row.source || row.audience_type || row.status)} · {text(row.zone || row.dispatch_status || row.validation_status || row.delivery_status)}
          </div>
        </div>
        <div className="rounded-full bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">
          {text(row.risk_level || row.priority || row.bridge || row.status)}
        </div>
      </div>
      <pre className="mt-3 max-h-32 overflow-auto rounded-2xl bg-slate-950 p-3 text-[10px] font-bold text-slate-100">
        {JSON.stringify(row.raw || row, null, 2).slice(0, 1800)}
      </pre>
    </div>
  )
}

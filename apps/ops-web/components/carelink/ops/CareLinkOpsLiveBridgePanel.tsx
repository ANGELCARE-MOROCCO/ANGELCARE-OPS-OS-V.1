'use client'
import { shouldStartAutoRefresh, safeRefreshInterval } from '@/lib/runtime/client-live-governor'

import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, Layers3, UserCheck, AlertTriangle, ClipboardCheck, Radio, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { resolvedMissionCode } from '@/lib/missions/mission-codes'

type AnyRecord = Record<string, any>

function text(value: unknown, fallback = '—') {
  return value === null || value === undefined || value === '' ? fallback : String(value)
}

function statusOf(row: AnyRecord) {
  return text(row.status || row.lifecycleStage || row.lifecycle_stage || row.dispatchStatus || row.dispatch_status || 'created').toLowerCase()
}

function codeOf(row: AnyRecord) {
  return resolvedMissionCode(row)
}

function clientOf(row: AnyRecord) {
  return text(row.familyName || row.clientName || row.client_name || `Family #${row.family_id || '—'}`)
}

function agentOf(row: AnyRecord) {
  return text(row.agentName || row.caregiverName || row.agent_name || (row.caregiver_id ? `Agent #${row.caregiver_id}` : 'Unassigned'))
}

function serviceOf(row: AnyRecord) {
  return text(row.serviceType || row.service_type || row.title || 'Mission dossier')
}

function Metric({ label, value, helper, tone }: { label: string; value: number; helper: string; tone: string }) {
  const cls: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    rose: 'border-rose-200 bg-rose-50 text-rose-800',
    violet: 'border-violet-200 bg-violet-50 text-violet-800',
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  }

  return (
    <div className={`rounded-[1.4rem] border p-4 shadow-sm ${cls[tone] || cls.blue}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.26em] opacity-70">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
      <p className="mt-1 text-xs font-bold opacity-75">{helper}</p>
    </div>
  )
}

export function CareLinkOpsLiveBridgePanel({ mode = 'overview' }: { mode?: 'overview' | 'dispatch' }) {
  const [missions, setMissions] = useState<AnyRecord[]>([])
  const [summary, setSummary] = useState<AnyRecord>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/carelink/ops/live-missions', { cache: 'no-store' })
      const json = await res.json()
      setMissions(Array.isArray(json.missions) ? json.missions : [])
      setSummary(json.summary || {})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Live bridge failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    if (!shouldStartAutoRefresh()) return
    const timer = setInterval(load, safeRefreshInterval(15000))
    return () => clearInterval(timer)
  }, [])

  const lanes = useMemo(() => {
    const keys = [
      ['created', 'Created'],
      ['assigned', 'Assigned'],
      ['accepted', 'Accepted'],
      ['en_route', 'En route'],
      ['in_progress', 'In progress'],
      ['report_pending', 'Report pending'],
      ['validation', 'Validation'],
      ['at_risk', 'At risk'],
      ['completed', 'Completed'],
    ]

    return keys.map(([key, label]) => ({
      key,
      label,
      items: missions.filter((mission) => statusOf(mission) === key),
    }))
  }, [missions])

  return (
    <section className="mb-5 rounded-[2rem] border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.32em] text-blue-600">Live Mission Bridge</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">
            {mode === 'dispatch' ? 'Dispatch live missions connected' : 'Overview live missions connected'}
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Direct feed from public.missions. This confirms the page is now reacting to created dossiers.
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={load} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh live
          </button>
          <Link href="/carelink-ops/missions" className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white">
            Open missions
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {error ? <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-black text-rose-700">{error}</div> : null}

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        <Metric label="Total" value={missions.length} helper="Live missions" tone="blue" />
        <Metric label="Today" value={Number(summary.missionsToday || 0)} helper="Scheduled today" tone="cyan" />
        <Metric label="Assigned" value={Number(summary.assigned || 0)} helper="Agent linked" tone="violet" />
        <Metric label="Active" value={Number(summary.active || 0)} helper="Ops active" tone="green" />
        <Metric label="In progress" value={Number(summary.inProgress || 0)} helper="Route / service" tone="green" />
        <Metric label="At risk" value={Number(summary.atRisk || 0)} helper="Escalation" tone="rose" />
        <Metric label="Reports" value={Number(summary.reportsPending || 0)} helper="Validation" tone="amber" />
        <Metric label="Unassigned" value={Number(summary.unassigned || 0)} helper="Queue" tone="violet" />
      </div>

      <div className="mt-5 overflow-x-auto">
        <div className="grid min-w-[1450px] grid-cols-9 gap-3">
          {lanes.map((lane) => (
            <div key={lane.key} className="rounded-[1.3rem] border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-black text-slate-700">{lane.label}</p>
                <span className="rounded-full bg-white px-2 py-1 text-xs font-black">{lane.items.length}</span>
              </div>

              <div className="space-y-2">
                {lane.items.slice(0, mode === 'dispatch' ? 8 : 4).map((mission) => (
                  <div key={`${lane.key}-${mission.id}`} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <p className="text-xs font-black text-slate-950">{codeOf(mission)}</p>
                    <p className="mt-1 line-clamp-2 text-xs font-bold text-slate-600">{serviceOf(mission)}</p>
                    <p className="mt-2 text-[11px] font-semibold text-slate-400">{clientOf(mission)} · {agentOf(mission)}</p>
                  </div>
                ))}

                {!lane.items.length ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-center text-xs font-black text-slate-400">
                    No live items
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'

type AnyRecord = Record<string, any>

function text(value: unknown, fallback = '—') {
  if (value === null || value === undefined || value === '') return fallback
  return String(value)
}

function MiniCard({ label, value, detail, tone = 'blue' }: { label: string; value: string | number; detail: string; tone?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate' }) {
  const cls = {
    blue: 'border-blue-100 bg-blue-50 text-blue-700',
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    rose: 'border-rose-100 bg-rose-50 text-rose-700',
    slate: 'border-slate-200 bg-white text-slate-700',
  }[tone]

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${cls}`}>
      <div className="text-[10px] font-black uppercase tracking-[0.22em] opacity-70">{label}</div>
      <div className="mt-2 text-2xl font-black tracking-[-0.05em] text-slate-950">{value}</div>
      <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{detail}</p>
    </div>
  )
}

export function CareLinkMissionsProductionHardeningBanner() {
  const [audit, setAudit] = useState<AnyRecord | null>(null)
  const [command, setCommand] = useState<AnyRecord | null>(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [auditRes, commandRes] = await Promise.all([
        fetch('/api/carelink/ops/missions-audit', { cache: 'no-store' }),
        fetch('/api/carelink/ops/mission-command', { cache: 'no-store' }),
      ])

      setAudit(await auditRes.json().catch(() => null))
      setCommand(await commandRes.json().catch(() => null))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const activeSources = Array.isArray(audit?.sourceOfTruthCandidates) ? audit.sourceOfTruthCandidates : []
  const primaryDossiers = Array.isArray(audit?.recommendation?.primaryDossiers) ? audit.recommendation.primaryDossiers : []
  const missionRecords = Array.isArray(audit?.recommendation?.missionRecords) ? audit.recommendation.missionRecords : []
  const workflowStates = Number(command?.summary?.workflowStates || 0)
  const notifications = Number(command?.summary?.notifications || 0)

  const health = useMemo(() => {
    let score = 0
    if (primaryDossiers.length) score += 30
    if (missionRecords.length) score += 25
    if (workflowStates) score += 20
    if (notifications) score += 10
    if (activeSources.length >= 4) score += 15
    return Math.min(100, score)
  }, [primaryDossiers.length, missionRecords.length, workflowStates, notifications, activeSources.length])

  return (
    <section className="mb-6 overflow-hidden rounded-[34px] border border-slate-200 bg-white p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <div className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-blue-700">
            Mission canonical production layer
          </div>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-slate-950">
            Mission source-of-truth, lifecycle bridge and notifications
          </h2>
          <p className="mt-2 max-w-5xl text-sm font-semibold leading-6 text-slate-500">
            This layer audits mission/dossier sources, exposes the canonical mission command API, persists lifecycle overlays, logs actions, and queues notifications for admin, supervisor, dispatch and mobile caregivers.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <a href="/api/carelink/ops/missions-audit" target="_blank" className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-black text-blue-700">
            Open audit JSON
          </a>
          <button onClick={load} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white">
            {loading ? 'Refreshing...' : 'Refresh layer'}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-5">
        <MiniCard label="Canonical health" value={`${health}%`} detail="Dossier + mission + workflow readiness" tone={health >= 70 ? 'emerald' : health >= 45 ? 'amber' : 'rose'} />
        <MiniCard label="Active sources" value={activeSources.length} detail="Tables with data detected" tone="blue" />
        <MiniCard label="Dossier sources" value={primaryDossiers.length} detail="Primary dossier candidates" tone="emerald" />
        <MiniCard label="Workflow states" value={workflowStates} detail="Mission lifecycle overlays" tone="amber" />
        <MiniCard label="Notifications" value={notifications} detail="Queued mission notifications" tone="slate" />
      </div>

      {activeSources.length ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {activeSources.slice(0, 8).map((source: AnyRecord) => (
            <span key={source.table} className="rounded-full bg-slate-50 px-3 py-1 text-xs font-black text-slate-600">
              {text(source.table)} · {text(source.count, '0')}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  )
}

export default CareLinkMissionsProductionHardeningBanner

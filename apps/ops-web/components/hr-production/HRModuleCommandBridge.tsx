'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { Activity, AlertTriangle, CheckCircle2, ClipboardCheck, DatabaseZap, Download, FileText, Gauge, RefreshCw, ShieldCheck, Sparkles, X } from 'lucide-react'

type BridgePayload = Record<string, any>
type PanelMode = 'snapshot' | 'diagnostics' | 'audit' | 'blocked' | null

function badgeTone(status: string) {
  const s = String(status || '').toLowerCase()
  if (s.includes('critical') || s.includes('failed') || s.includes('blocked')) return 'border-rose-200 bg-rose-50 text-rose-700'
  if (s.includes('warning') || s.includes('attention') || s.includes('fallback') || s.includes('partial')) return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-emerald-200 bg-emerald-50 text-emerald-700'
}

function Metric({ label, value, detail }: { label: string; value: any; detail?: string }) {
  return <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</div>
    <div className="mt-2 text-2xl font-black text-slate-950">{value ?? '—'}</div>
    {detail ? <div className="mt-1 text-xs font-bold text-slate-500">{detail}</div> : null}
  </div>
}

function downloadJSON(filename: string, payload: BridgePayload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function downloadCSV(filename: string, rows: any[]) {
  const safeRows = Array.isArray(rows) ? rows : []
  const headers = Array.from(new Set(safeRows.flatMap((row) => Object.keys(row || {})))).slice(0, 40)
  const csv = [headers.join(','), ...safeRows.map((row) => headers.map((h) => JSON.stringify(row?.[h] ?? '')).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function HRModuleCommandBridge({ context = 'HR module', compact = false }: { context?: string; compact?: boolean }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [panel, setPanel] = useState<PanelMode>(null)
  const [payload, setPayload] = useState<BridgePayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async (mode: Exclude<PanelMode, null>) => {
    setLoading(mode)
    setError(null)
    try {
      const endpoint = mode === 'diagnostics' ? '/api/hr/diagnostics' : mode === 'audit' ? '/api/hr/audit/recent?limit=80' : '/api/hr/live-snapshot'
      const response = await fetch(endpoint, { method: mode === 'snapshot' ? 'POST' : 'GET', headers: { 'Accept': 'application/json' } })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data?.error || `HR ${mode} failed`)
      setPayload(data)
      setPanel(mode)
    } catch (err: any) {
      setError(err?.message || 'HR command action failed.')
      setPanel(mode)
    } finally {
      setLoading(null)
    }
  }, [])

  const blockUnsafe = useCallback(async () => {
    setLoading('blocked')
    setError(null)
    try {
      const response = await fetch('/api/hr/action', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify({ action: 'silent_repair_requested_from_bridge', reason: 'Safe mode requires confirmation and a dedicated repair endpoint before mutating HR data.', payload: { context } }) })
      const data = await response.json().catch(() => ({}))
      setPayload(data)
      setPanel('blocked')
    } catch (err: any) {
      setError(err?.message || 'Unable to record safe-mode action.')
      setPanel('blocked')
    } finally {
      setLoading(null)
    }
  }, [context])

  const snapshotMetrics = useMemo(() => payload?.totals || payload?.metrics || {}, [payload])

  return <>
    <section className={`rounded-[30px] border border-white/80 bg-white/90 ${compact ? 'p-4' : 'p-5'} shadow-xl shadow-slate-200/60 ring-1 ring-slate-100 backdrop-blur`}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-700">Production bridge</span>
            <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{context}</span>
          </div>
          <h2 className="mt-2 text-xl font-black text-slate-950">HR operational action center</h2>
          <p className="mt-1 max-w-4xl text-sm font-semibold leading-6 text-slate-500">Live snapshot, diagnostics, audit export and safe-mode gates are wired to HR APIs. Unsafe mutations are blocked and audited instead of silently changing data.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={!!loading} onClick={() => run('snapshot')} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-sm disabled:opacity-50"><RefreshCw className="mr-2 inline h-4 w-4" />{loading === 'snapshot' ? 'Refreshing…' : 'Refresh live'}</button>
          <button type="button" disabled={!!loading} onClick={() => run('diagnostics')} className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-black text-violet-700 disabled:opacity-50"><Gauge className="mr-2 inline h-4 w-4" />Diagnostics</button>
          <button type="button" disabled={!!loading} onClick={() => run('audit')} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 disabled:opacity-50"><Activity className="mr-2 inline h-4 w-4" />Audit</button>
          <button type="button" disabled={!payload} onClick={() => downloadJSON(`angelcare-hr-${panel || 'snapshot'}-${new Date().toISOString().slice(0,10)}.json`, payload || {})} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 disabled:opacity-40"><Download className="mr-2 inline h-4 w-4" />Export JSON</button>
          <button type="button" disabled={!!loading} onClick={blockUnsafe} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-700 disabled:opacity-50"><ShieldCheck className="mr-2 inline h-4 w-4" />Safe repair gate</button>
        </div>
      </div>
      {error ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</div> : null}
    </section>

    {panel ? <div className="fixed inset-x-0 bottom-0 top-[112px] z-[140] overflow-y-auto bg-slate-950/50 p-5 backdrop-blur-md">
      <button aria-label="Close HR operational panel" className="absolute inset-0 cursor-default" onClick={() => setPanel(null)} />
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[36px] border border-white/70 bg-white shadow-[0_35px_120px_rgba(15,23,42,.35)]">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-white via-violet-50 to-cyan-50 p-7 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.35em] text-violet-500">AngelCare HR cockpit</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">{panel === 'diagnostics' ? 'Structured HR diagnostics' : panel === 'audit' ? 'Recent HR audit activity' : panel === 'blocked' ? 'Safe-mode action gate' : 'Live HR snapshot'}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Endpoint: {payload?.endpoint || (panel === 'blocked' ? '/api/hr/action' : '—')} · Source confidence: <span className={`rounded-full border px-2 py-0.5 text-xs font-black ${badgeTone(payload?.sourceConfidence || payload?.status || '')}`}>{payload?.sourceConfidence || payload?.status || 'unknown'}</span></p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => payload && downloadJSON(`angelcare-hr-${panel}-${new Date().toISOString().slice(0,10)}.json`, payload)} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"><Download className="mr-2 inline h-4 w-4" />Download JSON</button>
            {panel === 'audit' ? <button type="button" onClick={() => downloadCSV(`angelcare-hr-audit-${new Date().toISOString().slice(0,10)}.csv`, payload?.audit || [])} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700"><FileText className="mr-2 inline h-4 w-4" />Audit CSV</button> : null}
            <button type="button" onClick={() => setPanel(null)} className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50"><X className="h-5 w-5" /></button>
          </div>
        </div>
        <div className="space-y-6 p-7">
          {error ? <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 font-bold text-rose-700">{error}</div> : null}

          {panel === 'snapshot' ? <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              <Metric label="Employees" value={snapshotMetrics.employees ?? payload?.metrics?.totalStaff} detail="Total records" />
              <Metric label="Active" value={snapshotMetrics.activeEmployees ?? payload?.metrics?.activeStaff} detail="Operational workforce" />
              <Metric label="Attendance risks" value={snapshotMetrics.attendanceExceptions ?? payload?.metrics?.attendanceExceptions} detail="Missing/late/exception" />
              <Metric label="Roster conflicts" value={snapshotMetrics.rosterConflicts ?? payload?.metrics?.rosterConflicts} detail="Coverage issues" />
              <Metric label="Approvals" value={snapshotMetrics.pendingApprovals ?? payload?.metrics?.pendingApprovals} detail="Pending validation" />
              <Metric label="Score" value={`${payload?.score ?? '—'}%`} detail={payload?.status || 'Readiness'} />
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-5"><h3 className="font-black text-slate-950">Generated recommendations</h3><div className="mt-3 grid gap-2 md:grid-cols-2">{(payload?.recommendations || []).map((item: string, i: number) => <div key={`${item}-${i}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700"><Sparkles className="mr-2 inline h-4 w-4 text-violet-500" />{item}</div>)}</div></div>
          </> : null}

          {panel === 'diagnostics' ? <>
            <div className="grid gap-3 md:grid-cols-3"><Metric label="Passed" value={payload?.summary?.passed || 0} /><Metric label="Warnings" value={payload?.summary?.warnings || 0} /><Metric label="Failed" value={payload?.summary?.failed || 0} /></div>
            <div className="overflow-hidden rounded-[28px] border border-slate-200"><table className="w-full min-w-[920px] text-left text-sm"><thead className="bg-slate-950 text-xs font-black uppercase tracking-[0.16em] text-white"><tr>{['Check','Status','Owner','Context','Recommended action','Auto-remediate'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 bg-white">{(payload?.checks || []).map((c: any) => <tr key={c.id}><td className="px-4 py-3 font-black text-slate-950">{c.label}</td><td className="px-4 py-3"><span className={`rounded-full border px-2.5 py-1 text-xs font-black ${badgeTone(c.status)}`}>{c.status}</span></td><td className="px-4 py-3 font-bold text-slate-600">{c.owner}</td><td className="px-4 py-3 text-slate-600">{c.context}</td><td className="px-4 py-3 text-slate-600">{c.recommendedAction}</td><td className="px-4 py-3 font-black text-slate-700">{c.safeToAutoRemediate ? 'Yes' : 'No — gated'}</td></tr>)}</tbody></table></div>
          </> : null}

          {panel === 'audit' ? <div className="overflow-hidden rounded-[28px] border border-slate-200"><table className="w-full min-w-[820px] text-left text-sm"><thead className="bg-slate-950 text-xs font-black uppercase tracking-[0.16em] text-white"><tr>{['Time','Action','Status','Source','Detail'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100 bg-white">{(payload?.audit || []).length ? (payload?.audit || []).map((row: any, i: number) => <tr key={row.id || `${row.action}-${i}`}><td className="px-4 py-3 font-bold text-slate-600">{String(row.created_at || row.timestamp || '—').slice(0, 19).replace('T', ' ')}</td><td className="px-4 py-3 font-black text-slate-950">{row.action || row.event_name || row.type || 'HR activity'}</td><td className="px-4 py-3"><span className={`rounded-full border px-2.5 py-1 text-xs font-black ${badgeTone(row.status || row.severity || '')}`}>{row.status || row.severity || 'recorded'}</span></td><td className="px-4 py-3 font-bold text-slate-600">{row.source || row.module || 'hr'}</td><td className="px-4 py-3 text-slate-600">{row.reason || row.description || row.entity_type || row.record_id || '—'}</td></tr>) : <tr><td colSpan={5} className="px-4 py-10 text-center font-bold text-slate-500">No HR audit rows were found. This is an honest empty state; new bridge actions will attempt to write HR audit events.</td></tr>}</tbody></table></div> : null}

          {panel === 'blocked' ? <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5"><div className="flex items-start gap-3"><AlertTriangle className="mt-1 h-5 w-5 text-amber-600" /><div><h3 className="font-black text-amber-900">{payload?.message || 'Unsafe action was safely gated.'}</h3><p className="mt-2 text-sm font-bold text-amber-800">This bridge does not silently repair, purge, delete, or generate payroll. It records the request, explains the impact, and requires a dedicated confirmation-gated endpoint before mutation.</p><div className="mt-4 flex flex-wrap gap-2"><Link href="/hr/sync-center" className="rounded-2xl bg-amber-600 px-4 py-3 text-sm font-black text-white">Open Sync Center</Link><Link href="/hr/system-health" className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-black text-amber-800">System Health</Link></div></div></div></div> : null}

          <details className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <summary className="cursor-pointer text-sm font-black text-slate-700"><ClipboardCheck className="mr-2 inline h-4 w-4" />Technical payload</summary>
            <pre className="mt-3 max-h-80 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(payload || { error }, null, 2)}</pre>
          </details>
        </div>
      </div>
    </div> : null}
  </>
}

'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Activity, AlertTriangle, CheckCircle2, ClipboardList, Download, RefreshCw, ShieldCheck, Wifi, X } from 'lucide-react'

type Domain = 'attendance' | 'rosters' | 'work-schedules' | 'leave' | 'approvals' | 'documents' | 'contracts' | 'compliance' | 'training' | 'recruitment' | 'onboarding' | 'payroll' | 'reports' | 'employees' | 'staff' | 'hr'

type Props = {
  domain: Domain | string
  title?: string
  compact?: boolean
}

function badgeTone(value: string) {
  const v = String(value || '').toLowerCase()
  if (['live', 'synced', 'healthy', 'passed', 'ready', 'active', 'approved'].some((x) => v.includes(x))) return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (['warning', 'partial', 'pending', 'gated', 'attention', 'review'].some((x) => v.includes(x))) return 'border-amber-200 bg-amber-50 text-amber-700'
  if (['failed', 'critical', 'blocked', 'error', 'missing'].some((x) => v.includes(x))) return 'border-rose-200 bg-rose-50 text-rose-700'
  return 'border-slate-200 bg-slate-50 text-slate-600'
}

function downloadJSON(filename: string, payload: any) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function Metric({ label, value, detail }: { label: string; value: ReactNode; detail?: ReactNode }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-black text-slate-950">{value ?? '—'}</p>
    {detail ? <p className="mt-1 text-xs font-bold text-slate-500">{detail}</p> : null}
  </div>
}

export default function HRRealtimeSyncPanel({ domain, title, compact = true }: Props) {
  const [payload, setPayload] = useState<any>(null)
  const [panel, setPanel] = useState<'sync' | 'actions' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [auto, setAuto] = useState(false)

  const endpoint = useMemo(() => `/api/hr/realtime/state?domain=${encodeURIComponent(domain)}`, [domain])

  async function load(open = false) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(endpoint, { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.ok === false) throw new Error(json?.error || `HTTP ${res.status}`)
      setPayload(json)
      if (open) setPanel('sync')
    } catch (err: any) {
      setError(err?.message || 'Unable to load HR realtime state.')
    } finally {
      setLoading(false)
    }
  }

  async function runSafeAction(action: string) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/hr/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, domain, reason: 'Triggered from HR realtime sync panel; unsafe mutations are confirmation-gated.' }),
      })
      const json = await res.json().catch(() => ({}))
      setPayload({ ...(payload || {}), lastAction: json })
      setPanel('actions')
      await load(false)
    } catch (err: any) {
      setError(err?.message || 'Unable to run HR action gate.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(false) }, [endpoint])
  useEffect(() => {
    if (!auto) return
    const id = window.setInterval(() => load(false), 15000)
    return () => window.clearInterval(id)
  }, [auto, endpoint])

  const summary = payload?.summary || {}
  const risks = payload?.risks || []
  const actions = payload?.actions || []

  return <>
    <section className={`rounded-[30px] border border-cyan-100 bg-gradient-to-br from-white via-cyan-50 to-violet-50 shadow-xl shadow-cyan-100/40 ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-cyan-600">Live sync layer</p>
          <h2 className={`${compact ? 'text-xl' : 'text-3xl'} mt-1 font-black text-slate-950`}>{title || `HR ${domain} realtime control`}</h2>
          <p className="mt-1 text-xs font-bold text-slate-500">Refresh-synced now; auto-refresh available every 15 seconds. Source confidence: <span className={`rounded-full border px-2 py-0.5 ${badgeTone(payload?.sourceConfidence || '')}`}>{payload?.sourceConfidence || 'loading'}</span></p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => load(true)} disabled={loading} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white disabled:opacity-50"><RefreshCw className="mr-2 inline h-4 w-4" />{loading ? 'Syncing…' : 'Open sync'}</button>
          <button type="button" onClick={() => setAuto((x) => !x)} className={`rounded-2xl border px-4 py-3 text-sm font-black ${auto ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700'}`}><Wifi className="mr-2 inline h-4 w-4" />{auto ? 'Auto on' : 'Auto refresh'}</button>
          <button type="button" onClick={() => downloadJSON(`angelcare-hr-${domain}-sync-${new Date().toISOString().slice(0,10)}.json`, payload || {})} disabled={!payload} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 disabled:opacity-40"><Download className="mr-2 inline h-4 w-4" />Export</button>
        </div>
      </div>
      {error ? <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</div> : null}
    </section>

    {panel ? <div className="fixed inset-x-0 bottom-0 top-[104px] z-[150] overflow-y-auto bg-slate-950/50 p-5 backdrop-blur-md">
      <button aria-label="Close HR realtime panel" className="absolute inset-0 cursor-default" onClick={() => setPanel(null)} />
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[36px] border border-white/70 bg-white shadow-[0_35px_120px_rgba(15,23,42,.35)]">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-gradient-to-r from-white via-cyan-50 to-violet-50 p-7 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[.35em] text-cyan-600">AngelCare HR realtime workspace</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">{String(domain).replace('-', ' ')} live sync details</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Endpoint: {payload?.endpoint || endpoint} · Last sync: {payload?.generatedAt || '—'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => runSafeAction(`${domain}.safe_review`)} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-700"><ShieldCheck className="mr-2 inline h-4 w-4" />Safe review</button>
            <button type="button" onClick={() => downloadJSON(`angelcare-hr-${domain}-workspace.json`, payload || {})} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"><Download className="mr-2 inline h-4 w-4" />Download</button>
            <button type="button" onClick={() => setPanel(null)} className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50"><X className="h-5 w-5" /></button>
          </div>
        </div>
        <div className="space-y-6 p-7">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <Metric label="Records" value={summary.records ?? 0} detail="Loaded records" />
            <Metric label="Active" value={summary.active ?? 0} detail="Active/open" />
            <Metric label="Warnings" value={summary.warnings ?? 0} detail="Needs review" />
            <Metric label="Blocked" value={summary.blocked ?? 0} detail="Critical blockers" />
            <Metric label="Audit" value={summary.auditEvents ?? 0} detail="Recent events" />
            <Metric label="Status" value={payload?.status || '—'} detail={payload?.sourceConfidence || 'source'} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <h3 className="font-black text-slate-950"><AlertTriangle className="mr-2 inline h-4 w-4 text-amber-500" />Detected risks</h3>
              <div className="mt-3 space-y-2">{risks.length ? risks.map((risk: any, i: number) => <div key={risk.id || i} className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-black text-slate-900">{risk.title || risk.label || 'HR risk'}</p><span className={`rounded-full border px-2.5 py-1 text-xs font-black ${badgeTone(risk.severity || risk.status)}`}>{risk.severity || risk.status || 'warning'}</span></div><p className="mt-1 text-sm font-semibold text-slate-500">{risk.detail || risk.context || 'Requires HR review.'}</p></div>) : <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-bold text-emerald-700"><CheckCircle2 className="mr-2 inline h-4 w-4" />No domain-specific risk marker was detected in the current dataset.</div>}</div>
            </div>
            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <h3 className="font-black text-slate-950"><ClipboardList className="mr-2 inline h-4 w-4 text-violet-500" />Operational actions</h3>
              <div className="mt-3 space-y-2">{actions.length ? actions.map((action: any, i: number) => <button key={action.id || i} type="button" onClick={() => runSafeAction(action.id || `${domain}.action`)} className="block w-full rounded-2xl border border-slate-200 bg-white p-3 text-left hover:bg-slate-50"><div className="flex items-center justify-between gap-2"><span className="font-black text-slate-900">{action.label || action.title}</span><span className={`rounded-full border px-2 py-0.5 text-xs font-black ${badgeTone(action.mode || '')}`}>{action.mode || 'gated'}</span></div><p className="mt-1 text-xs font-bold text-slate-500">{action.detail || 'Action is routed through the HR safe action gate.'}</p></button>) : <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-500">No runnable domain action is exposed. Unsafe mutations remain disabled with audit trail.</div>}</div>
            </div>
          </div>

          {payload?.lastAction ? <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5"><h3 className="font-black text-amber-900"><Activity className="mr-2 inline h-4 w-4" />Last gated action result</h3><p className="mt-2 text-sm font-bold text-amber-800">{payload.lastAction.message || payload.lastAction.reason || 'Action was recorded/gated.'}</p></div> : null}

          <details className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <summary className="cursor-pointer text-sm font-black text-slate-700">Technical payload</summary>
            <pre className="mt-3 max-h-80 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{JSON.stringify(payload || {}, null, 2)}</pre>
          </details>
        </div>
      </div>
    </div> : null}
  </>
}

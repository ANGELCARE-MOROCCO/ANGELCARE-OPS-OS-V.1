'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { executeMarketAction, fetchMarketOSCore } from '@/lib/market-os/client-actions'

type CoreData = {
  records: any[]
  agents: any[]
  kpis: any[]
  actions: any[]
  audit: any[]
  sessions: any[]
}

const emptyData: CoreData = { records: [], agents: [], kpis: [], actions: [], audit: [], sessions: [] }

const navItems = [
  { href: '/market-os/campaign-lifecycle', label: 'Campaign Lifecycle', engine: 'Acquisition' },
  { href: '/market-os/content-brand-governance', label: 'Content & Brand Governance', engine: 'Content' },
  { href: '/market-os/lead-intake-control', label: 'Lead Intake Control', engine: 'Conversion' },
  { href: '/market-os/risk-signals-ai', label: 'Risk Signals AI', engine: 'Data' },
  { href: '/market-os/marketing-calendar-execution', label: 'Marketing Calendar', engine: 'Content' },
  { href: '/market-os/seo-authority-growth', label: 'SEO Authority Growth', engine: 'SEO' },
  { href: '/market-os/partnership-referral-growth', label: 'Partnership Referral Growth', engine: 'Network' },
  { href: '/market-os/workforce-capacity-command', label: 'Workforce Capacity', engine: 'Workforce' },
  { href: '/market-os/approval-sla-escalation', label: 'Approval & SLA', engine: 'Control' },
  { href: '/market-os/marketing-board-reporting', label: 'Board Reporting', engine: 'Reporting' },
  { href: '/market-os/automation-control-panel', label: 'Automation Control', engine: 'Automation' },
  { href: '/market-os/ai-execution-advisor', label: 'AI Execution Advisor', engine: 'Execution' },
]

const quickActions = [
  { label: 'Create Campaign Task', action: 'create_campaign', engine: 'acquisition', recordType: 'campaign', title: 'New campaign execution task' },
  { label: 'Create Content Task', action: 'create_content_task', engine: 'content', recordType: 'content_task', title: 'New content production task' },
  { label: 'Create Lead Follow-up', action: 'create_lead', engine: 'conversion', recordType: 'lead', title: 'New lead follow-up task' },
  { label: 'Flag Optimization Task', action: 'trigger_optimization_task', engine: 'data', recordType: 'optimization_task', title: 'New optimization task' },
]

function badgeClass(status: string) {
  if (['published', 'converted', 'approved', 'completed', 'performing', 'on_target'].includes(status)) return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (['risk', 'paused', 'rejected', 'blocked', 'cancelled', 'urgent', 'under_target'].includes(status)) return 'border-red-200 bg-red-50 text-red-700'
  if (['review', 'queued', 'draft', 'active', 'assigned', 'new'].includes(status)) return 'border-blue-200 bg-blue-50 text-blue-700'
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function safeDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

export default function MarketOSIndexCommandCenter() {
  const [data, setData] = useState<CoreData>(emptyData)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function load() {
    try {
      setLoading(true)
      setError(null)
      const json = await fetchMarketOSCore()
      setData({
        records: json.records || [],
        agents: json.agents || [],
        kpis: json.kpis || [],
        actions: json.actions || [],
        audit: json.audit || [],
        sessions: json.sessions || [],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load Market-OS index')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    function refreshAfterAction() {
      load()
    }
    window.addEventListener('market-os-action-executed', refreshAfterAction)
    return () => window.removeEventListener('market-os-action-executed', refreshAfterAction)
  }, [])

  const openRecords = useMemo(() => data.records.filter((r) => !['completed', 'cancelled', 'archived'].includes(r.status)).length, [data.records])
  const riskRecords = useMemo(() => data.records.filter((r) => r.status === 'risk' || r.priority === 'urgent' || r.priority === 'critical').length, [data.records])
  const closedRecords = useMemo(() => data.records.filter((r) => ['completed', 'published', 'converted', 'approved'].includes(r.status)).length, [data.records])

  async function runQuickAction(item: (typeof quickActions)[number]) {
    try {
      setSaving(item.action)
      setError(null)
      setSuccess(null)
      const result = await executeMarketAction({
        action: item.action,
        engine: item.engine as any,
        recordType: item.recordType,
        title: item.title,
        description: 'Created from Market-OS index command center.',
        actorName: 'Market-OS Operator',
        priority: item.action.includes('optimization') ? 'urgent' : 'normal',
        status: item.action.includes('optimization') ? 'risk' : 'active',
        payload: { moduleKey: 'market-os-index', source: 'Market-OS Index Command Center' },
      })
      setSuccess(`${item.label} executed${result?.recordId ? ` · ${String(result.recordId).slice(0, 8)}` : ''}`)
      window.dispatchEvent(new CustomEvent('market-os-action-executed', { detail: result }))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setSaving(null)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-950 md:p-6">
      <section className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-pink-600">AngelCare Market-OS</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">Market-OS Command Center</h1>
              <p className="mt-3 max-w-4xl text-sm font-semibold text-slate-600">Live control tower: quick actions, navigation, recent records, KPI status, action history, and audit visibility.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={load} disabled={loading} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black hover:bg-slate-100 disabled:opacity-50">{loading ? 'Refreshing...' : 'Refresh'}</button>
              <a href="/api/market-os/health" target="_blank" className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white hover:bg-slate-800">Health</a>
            </div>
          </div>
        </header>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-700">{error}</div>}
        {success && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-black text-emerald-700">{success}</div>}

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-500">Records</p><p className="mt-2 text-3xl font-black">{data.records.length}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-500">Open Work</p><p className="mt-2 text-3xl font-black">{openRecords}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-500">Risk / Critical</p><p className="mt-2 text-3xl font-black">{riskRecords}</p></div>
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase text-slate-500">Closed Output</p><p className="mt-2 text-3xl font-black">{closedRecords}</p></div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">Quick Execution</p>
              <div className="mt-4 space-y-3">
                {quickActions.map((item) => (
                  <button key={item.action} type="button" onClick={() => runQuickAction(item)} disabled={Boolean(saving)} className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-left text-sm font-black text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                    {saving === item.action ? 'Executing...' : item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">Agents</p>
              <div className="mt-4 space-y-3">
                {data.agents.length === 0 && <p className="text-sm font-bold text-slate-500">No agents loaded.</p>}
                {data.agents.map((agent) => (
                  <div key={agent.id || agent.agent_key} className="rounded-2xl border border-slate-200 p-3">
                    <p className="font-black">{agent.name}</p>
                    <p className="text-xs font-bold text-slate-500">{agent.role}</p>
                    <p className="mt-1 text-xs text-slate-600">{agent.mission}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          <section className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div><p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">Operational navigation</p><h2 className="text-xl font-black">Execution pages</h2></div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black">{navItems.length} routes</span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-950 hover:bg-white">
                    <p className="font-black">{item.label}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{item.engine}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Recent records">
                {loading && <p className="text-sm font-bold text-slate-500">Loading...</p>}
                {!loading && data.records.length === 0 && <p className="text-sm font-bold text-slate-500">No records yet.</p>}
                {data.records.slice(0, 12).map((record) => (
                  <div key={record.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div><p className="font-black">{record.title || 'Untitled'}</p><p className="text-xs font-bold text-slate-500">{record.engine || 'system'} · {record.record_type || record.kind || 'task'} · {record.owner_agent || record.owner || 'unassigned'}</p></div>
                      <span className={`rounded-full border px-2 py-1 text-xs font-black ${badgeClass(record.status)}`}>{record.status || 'active'}</span>
                    </div>
                    {record.description && <p className="mt-2 text-sm text-slate-600">{record.description}</p>}
                    <p className="mt-3 text-xs font-bold text-slate-400">Updated: {safeDate(record.updated_at || record.created_at)}</p>
                  </div>
                ))}
              </Panel>

              <Panel title="KPI control">
                {data.kpis.length === 0 && <p className="text-sm font-bold text-slate-500">No KPIs loaded.</p>}
                {data.kpis.map((kpi) => (
                  <div key={kpi.id || kpi.kpi_key} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div><p className="text-xs font-black uppercase text-slate-500">{kpi.label || kpi.kpi_key}</p><p className="mt-1 text-2xl font-black">{Number(kpi.current_value || 0).toLocaleString()} <span className="text-sm text-slate-500">{kpi.unit}</span></p></div>
                      <span className={`rounded-full border px-2 py-1 text-xs font-black ${badgeClass(kpi.status)}`}>{kpi.status || 'empty'}</span>
                    </div>
                    <p className="mt-2 text-xs font-bold text-slate-500">Target: {Number(kpi.target_value || 0).toLocaleString()}</p>
                  </div>
                ))}
              </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <Panel title="Recent actions">
                {data.actions.length === 0 && <p className="text-sm font-bold text-slate-500">No actions yet.</p>}
                {data.actions.slice(0, 12).map((action) => (
                  <div key={action.id} className="rounded-2xl bg-slate-50 p-3"><p className="font-black">{action.action_label || action.action_key}</p><p className="text-xs font-bold text-slate-500">{action.engine || 'system'} · {action.actor_name || 'operator'} · {safeDate(action.created_at)}</p></div>
                ))}
              </Panel>

              <Panel title="Audit log">
                {data.audit.length === 0 && <p className="text-sm font-bold text-slate-500">No audit events yet.</p>}
                {data.audit.slice(0, 12).map((event) => (
                  <div key={event.id} className="rounded-2xl bg-slate-50 p-3"><p className="font-black">{event.title || event.action_key}</p><p className="text-xs font-bold text-slate-500">{event.summary || 'Audit event'} · {safeDate(event.created_at)}</p></div>
                ))}
              </Panel>
            </div>
          </section>
        </section>
      </section>
    </main>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">{title}</p>
      <div className="mt-4 max-h-[520px] space-y-3 overflow-auto pr-1">{children}</div>
    </div>
  )
}

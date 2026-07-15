'use client'

import React, { useEffect, useMemo, useState } from 'react'

type RecordRow = {
  id: string
  module_key?: string | null
  page_key?: string | null
  record_type?: string | null
  title: string
  description?: string | null
  owner_name?: string | null
  department?: string | null
  status?: string | null
  priority?: string | null
  risk_level?: string | null
  value_mad?: number | null
  due_at?: string | null
  archived_at?: string | null
  deleted_at?: string | null
  metadata?: Record<string, any> | null
  created_at?: string | null
  updated_at?: string | null
}

type Pulse = {
  total: number
  open: number
  active: number
  done: number
  archived: number
  escalated: number
  highRisk: number
  overdue: number
  totalValue: number
  weightedValue: number
  approvalPending?: number
  byModule: Record<string, number>
  byOwner: Record<string, number>
  byStatus: Record<string, number>
  byRisk?: Record<string, number>
  recentActivity: any[]
}

type Approval = {
  id: string
  source_record_id?: string | null
  approval_key?: string | null
  title: string
  requested_by?: string | null
  approver_name?: string | null
  status?: string | null
  decision_note?: string | null
  created_at?: string | null
  decided_at?: string | null
  payload?: any
}

type Playbook = { key: string; title: string; description: string; actions: string[] }
type SlaState = { breaches: RecordRow[]; danger: RecordRow[]; unassigned: RecordRow[]; breach_count: number; danger_count: number; unassigned_count: number }

const API = '/api/revenue-command-center/v12'
const terminal = ['done', 'won', 'lost', 'archived']
const emptyPulse: Pulse = { total: 0, open: 0, active: 0, done: 0, archived: 0, escalated: 0, highRisk: 0, overdue: 0, totalValue: 0, weightedValue: 0, byModule: {}, byOwner: {}, byStatus: {}, byRisk: {}, recentActivity: [] }
const emptySla: SlaState = { breaches: [], danger: [], unassigned: [], breach_count: 0, danger_count: 0, unassigned_count: 0 }

const modules = [
  { key: 'all', label: 'All revenue', route: '/revenue-command-center', icon: '◆' },
  { key: 'tasks', label: 'Tasks', route: '/revenue-command-center/tasks', icon: '✓' },
  { key: 'prospects', label: 'Prospects', route: '/revenue-command-center/prospects', icon: '◇' },
  { key: 'appointments', label: 'Appointments', route: '/revenue-command-center/appointments', icon: '◷' },
  { key: 'follow_ups', label: 'Follow-ups', route: '/revenue-command-center/follow-ups', icon: '↻' },
  { key: 'campaigns', label: 'Campaigns', route: '/revenue-command-center/campaigns', icon: '◉' },
  { key: 'automation', label: 'Automation', route: '/revenue-command-center/automation', icon: '⚙' },
  { key: 'control_tower', label: 'Control Tower', route: '/revenue-command-center/control-tower', icon: '▲' },
  { key: 'management', label: 'Management', route: '/revenue-command-center/management', icon: '▦' },
  { key: 'ai_scoring', label: 'AI Scoring', route: '/revenue-command-center/ai-scoring', icon: '✦' },
]

const quickPresets = [
  { label: 'Task', module_key: 'tasks', record_type: 'task', priority: 'medium', risk_level: 'low', title: 'New execution task' },
  { label: 'Prospect', module_key: 'prospects', record_type: 'prospect', priority: 'high', risk_level: 'medium', title: 'New qualified prospect' },
  { label: 'Follow-up', module_key: 'follow_ups', record_type: 'follow_up', priority: 'high', risk_level: 'high', title: 'New commercial follow-up' },
  { label: 'Appointment', module_key: 'appointments', record_type: 'appointment', priority: 'medium', risk_level: 'medium', title: 'New appointment confirmation' },
  { label: 'Campaign control', module_key: 'campaigns', record_type: 'campaign_control', priority: 'high', risk_level: 'medium', title: 'New campaign control action' },
]

function norm(value?: string | null) { return String(value || '').toLowerCase().replace(/\s+/g, '_') }
function money(value?: number | null) { return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(Number(value || 0)) }
function dateLabel(value?: string | null) { if (!value) return 'No due date'; try { return new Intl.DateTimeFormat('fr-MA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) } catch { return value } }
function isOverdue(r: RecordRow) { return Boolean(r.due_at && !terminal.includes(norm(r.status)) && new Date(r.due_at).getTime() < Date.now()) }
function weight(r: RecordRow) { const st = norm(r.status); const risk = norm(r.risk_level); let factor = 0.45; if (['active','qualified','in_progress'].includes(st)) factor = 0.65; if (st === 'won') factor = 1; if (['lost','archived'].includes(st)) factor = 0; if (risk === 'critical') factor -= 0.15; return Math.max(0, Math.round(Number(r.value_mad || 0) * factor)) }
function statusTone(status?: string | null) { const s = norm(status); if (['done','won'].includes(s)) return 'bg-emerald-50 text-emerald-900 border-emerald-200'; if (['active','qualified','in_progress'].includes(s)) return 'bg-blue-50 text-blue-900 border-blue-200'; if (['escalated','blocked'].includes(s)) return 'bg-rose-50 text-rose-900 border-rose-200'; if (['lost','archived'].includes(s)) return 'bg-slate-100 text-slate-700 border-slate-200'; return 'bg-amber-50 text-amber-900 border-amber-200' }
function priorityTone(priority?: string | null) { const p = norm(priority); if (p === 'critical') return 'bg-rose-700 text-white border-rose-800'; if (p === 'high') return 'bg-orange-100 text-orange-950 border-orange-200'; if (p === 'medium') return 'bg-indigo-50 text-indigo-900 border-indigo-200'; return 'bg-slate-50 text-slate-700 border-slate-200' }
function riskTone(risk?: string | null) { const r = norm(risk); if (r === 'critical') return 'bg-rose-950 text-white border-rose-950'; if (r === 'high') return 'bg-rose-50 text-rose-900 border-rose-200'; if (r === 'medium') return 'bg-amber-50 text-amber-900 border-amber-200'; return 'bg-emerald-50 text-emerald-900 border-emerald-200' }

function Badge({ children, tone = '' }: { children: React.ReactNode; tone?: string }) { return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-black ${tone}`}>{children}</span> }
function Section({ title, subtitle, children, action }: { title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) { return <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><h2 className="text-lg font-black text-slate-950">{title}</h2>{subtitle ? <p className="mt-1 max-w-3xl text-sm font-semibold text-slate-600">{subtitle}</p> : null}</div>{action}</div>{children}</section> }
function Button({ children, onClick, disabled, tone = 'dark', title }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; tone?: 'dark' | 'light' | 'danger' | 'success' | 'warning' | 'blue'; title?: string }) { const tones = { dark: 'bg-slate-950 text-white hover:bg-slate-800 border-slate-950', light: 'bg-white text-slate-900 hover:bg-slate-50 border-slate-200', danger: 'bg-rose-600 text-white hover:bg-rose-700 border-rose-700', success: 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700', warning: 'bg-amber-400 text-slate-950 hover:bg-amber-300 border-amber-500', blue: 'bg-blue-600 text-white hover:bg-blue-700 border-blue-700' }; return <button title={title} disabled={disabled} onClick={onClick} className={`rounded-2xl border px-4 py-2 text-sm font-black shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]}`}>{children}</button> }

export default function RevenueCommandHQExecutionDepthWorkspace() {
  const [records, setRecords] = useState<RecordRow[]>([])
  const [pulse, setPulse] = useState<Pulse>(emptyPulse)
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [playbooks, setPlaybooks] = useState<Playbook[]>([])
  const [sla, setSla] = useState<SlaState>(emptySla)
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState('Ready for command execution')
  const [query, setQuery] = useState('')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<string[]>([])
  const [chainKey, setChainKey] = useState('sla_rescue')
  const [owner, setOwner] = useState('Revenue Manager')
  const [form, setForm] = useState({ title: '', description: '', module_key: 'tasks', record_type: 'task', owner_name: '', status: 'open', priority: 'medium', risk_level: 'low', value_mad: 0, due_at: '' })
  const [editing, setEditing] = useState<RecordRow | null>(null)

  async function api(path: string, options?: RequestInit) {
    const res = await fetch(`${API}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) } })
    const text = await res.text()
    let json: any
    try { json = text ? JSON.parse(text) : {} } catch { throw new Error(`API returned non-JSON at ${API}${path}. Status ${res.status}. Check missing route or server error.`) }
    if (!res.ok || json?.ok === false) throw new Error(json?.error || `Request failed: ${res.status}`)
    return json
  }

  async function refresh() {
    setLoading(true); setError(null)
    try {
      const [recordsJson, pulseJson, approvalsJson, chainsJson, slaJson, timelineJson] = await Promise.all([
        api('/records'), api('/pulse'), api('/approvals'), api('/chains'), api('/sla'), api('/timeline'),
      ])
      setRecords(recordsJson.records || [])
      setPulse(pulseJson.pulse || emptyPulse)
      setApprovals(approvalsJson.approvals || [])
      setPlaybooks(chainsJson.playbooks || [])
      setSla(slaJson.sla || emptySla)
      setLogs(timelineJson.logs || [])
      setNotice('Synced with Revenue Command database')
    } catch (e: any) { setError(e?.message || 'Revenue Command sync failed'); setNotice('Sync failed') }
    finally { setLoading(false) }
  }

  useEffect(() => { refresh() }, [])

  const filtered = useMemo(() => records.filter((r) => {
    if (r.deleted_at) return false
    if (moduleFilter !== 'all' && norm(r.module_key) !== moduleFilter) return false
    if (statusFilter !== 'all' && norm(r.status) !== statusFilter) return false
    if (!query.trim()) return true
    const hay = [r.title, r.description, r.owner_name, r.module_key, r.record_type, r.status, r.priority, r.risk_level].join(' ').toLowerCase()
    return hay.includes(query.toLowerCase())
  }), [records, moduleFilter, statusFilter, query])

  const selectedRows = useMemo(() => records.filter((r) => selected.includes(r.id)), [records, selected])
  const executionQueue = useMemo(() => records.filter((r) => !terminal.includes(norm(r.status))).sort((a, b) => {
    const overdueScore = Number(isOverdue(b)) - Number(isOverdue(a))
    if (overdueScore) return overdueScore
    const priorityMap: any = { critical: 4, high: 3, medium: 2, low: 1 }
    return (priorityMap[norm(b.priority)] || 0) - (priorityMap[norm(a.priority)] || 0)
  }).slice(0, 10), [records])
  const pipelineRows = records.filter((r) => norm(r.module_key) === 'prospects')
  const approvalPending = approvals.filter((a) => norm(a.status) === 'pending')

  function toggle(id: string) { setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]) }
  function setPreset(p: any) { setForm((f) => ({ ...f, ...p, description: `${p.label} created from HQ command desk. Add owner, due date, value, and next execution detail.` })) }

  async function createRecord() {
    if (!form.title.trim()) { setError('Title is required before creating a command record'); return }
    try { await api('/records', { method: 'POST', body: JSON.stringify(form) }); setForm({ title: '', description: '', module_key: 'tasks', record_type: 'task', owner_name: '', status: 'open', priority: 'medium', risk_level: 'low', value_mad: 0, due_at: '' }); setNotice('Record created and synced'); await refresh() } catch (e: any) { setError(e.message) }
  }

  async function updateRecord() {
    if (!editing) return
    try { await api('/records', { method: 'POST', body: JSON.stringify({ ...editing, mode: 'update' }) }); setEditing(null); setNotice('Record updated'); await refresh() } catch (e: any) { setError(e.message) }
  }

  async function recordAction(id: string, action_key: string, payload: any = {}) {
    try { await api('/records', { method: 'POST', body: JSON.stringify({ id, mode: 'action', action_key, owner_name: owner, ...payload }) }); setNotice(`${action_key} executed`); await refresh() } catch (e: any) { setError(e.message) }
  }

  async function deleteRecord(id: string) {
    if (!confirm('Soft-delete this revenue command record?')) return
    try { await api('/records', { method: 'POST', body: JSON.stringify({ id, mode: 'delete' }) }); setSelected((s) => s.filter((x) => x !== id)); setNotice('Record soft-deleted'); await refresh() } catch (e: any) { setError(e.message) }
  }

  async function bulk(action_key: string) {
    if (!selected.length) { setError('Select records first'); return }
    try { await api('/bulk', { method: 'POST', body: JSON.stringify({ ids: selected, action_key, owner_name: owner }) }); setNotice(`Bulk ${action_key} applied to ${selected.length} record(s)`); setSelected([]); await refresh() } catch (e: any) { setError(e.message) }
  }

  async function runChain(id?: string, key = chainKey) {
    const target = id || selected[0]
    if (!target) { setError('Select one record or use a row action before running a chain'); return }
    try { const json = await api('/chains', { method: 'POST', body: JSON.stringify({ id: target, chain_key: key, requested_by: 'Revenue Command HQ', approver_name: owner }) }); setNotice(`${key} executed: ${json.created_count || 0} linked records created`); setSelected([]); await refresh() } catch (e: any) { setError(e.message) }
  }

  async function approvalDecision(id: string, status: 'approved' | 'rejected') {
    try { await api('/approvals', { method: 'POST', body: JSON.stringify({ id, status, mode: 'decision', decision_note: `${status} from HQ page` }) }); setNotice(`Approval ${status}`); await refresh() } catch (e: any) { setError(e.message) }
  }

  async function enforceSla() {
    try { const json = await api('/sla', { method: 'POST' }); setNotice(`SLA enforcement escalated ${json.escalated_count || 0} record(s)`); await refresh() } catch (e: any) { setError(e.message) }
  }

  async function seed() { try { const json = await api('/seed', { method: 'POST' }); setNotice(`Seeded ${json.count || 0} realistic records`); await refresh() } catch (e: any) { setError(e.message) } }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex max-w-[1800px] flex-col gap-6 px-4 py-6 lg:px-8">
        <section className="overflow-hidden rounded-[36px] border border-slate-800 bg-slate-950 shadow-2xl">
          <div className="grid gap-0 lg:grid-cols-[1.3fr_.7fr]">
            <div className="p-6 text-white lg:p-8">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <Badge tone="border-white/20 bg-white/10 text-white">Revenue Command HQ</Badge>
                <Badge tone="border-emerald-400/30 bg-emerald-400/10 text-emerald-100">Execution depth V12</Badge>
                <Badge tone="border-blue-400/30 bg-blue-400/10 text-blue-100">{loading ? 'Syncing...' : 'Database synced'}</Badge>
              </div>
              <h1 className="max-w-5xl text-3xl font-black tracking-tight md:text-5xl">Revenue command operating room with synced execution chains.</h1>
              <p className="mt-4 max-w-4xl text-base font-semibold leading-7 text-slate-200">This HQ layer controls records, bulk operations, SLA enforcement, playbook chains, approvals, ownership, risk, and audit flow from one page. The goal is not a demo dashboard: every visible command updates the backend and refreshes the workspace.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button tone="success" onClick={seed}>Seed realistic records</Button>
                <Button tone="blue" onClick={refresh}>Refresh sync</Button>
                <Button tone="warning" onClick={enforceSla}>Enforce SLA now</Button>
                <Button tone="light" onClick={() => selected[0] ? runChain(selected[0], chainKey) : setError('Select one record first')}>Run selected chain</Button>
              </div>
              <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-bold text-slate-200">State: {notice}</div>
              {error ? <div className="mt-3 rounded-2xl border border-rose-400/40 bg-rose-500/15 p-4 text-sm font-black text-rose-50">{error}</div> : null}
            </div>
            <div className="border-t border-white/10 bg-white/5 p-6 lg:border-l lg:border-t-0 lg:p-8">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-3xl bg-white p-4"><div className="text-xs font-black uppercase text-slate-500">Total records</div><div className="mt-2 text-3xl font-black text-slate-950">{pulse.total}</div></div>
                <div className="rounded-3xl bg-white p-4"><div className="text-xs font-black uppercase text-slate-500">Weighted value</div><div className="mt-2 text-2xl font-black text-slate-950">{money(pulse.weightedValue)}</div></div>
                <div className="rounded-3xl bg-white p-4"><div className="text-xs font-black uppercase text-slate-500">SLA breaches</div><div className="mt-2 text-3xl font-black text-rose-700">{sla.breach_count}</div></div>
                <div className="rounded-3xl bg-white p-4"><div className="text-xs font-black uppercase text-slate-500">Approvals</div><div className="mt-2 text-3xl font-black text-amber-700">{approvalPending.length}</div></div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-4">
          <Section title="Open" subtitle="Non-terminal command records"><div className="text-4xl font-black">{pulse.open}</div></Section>
          <Section title="Active" subtitle="Running or qualified execution"><div className="text-4xl font-black text-blue-700">{pulse.active}</div></Section>
          <Section title="High risk" subtitle="High and critical records"><div className="text-4xl font-black text-rose-700">{pulse.highRisk}</div></Section>
          <Section title="Total value" subtitle="Source value under command"><div className="text-3xl font-black">{money(pulse.totalValue)}</div></Section>
        </div>

        <Section title="Revenue module navigation" subtitle="HQ is first; submodules will be upgraded one by one after this base is validated.">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {modules.filter((m) => m.key !== 'all').map((m) => <a key={m.key} href={m.route} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-400 hover:bg-white"><div className="text-2xl">{m.icon}</div><div className="mt-2 text-sm font-black text-slate-950">{m.label}</div><div className="mt-1 text-xs font-bold text-slate-500">{pulse.byModule?.[m.key] || 0} records</div></a>)}
          </div>
        </Section>

        <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
          <Section title="Create command record" subtitle="Create real HQ records that feed KPIs, queue, SLA, chains, and audit logs." action={<div className="flex flex-wrap gap-2">{quickPresets.map((p) => <Button key={p.label} tone="light" onClick={() => setPreset(p)}>{p.label}</Button>)}</div>}>
            <div className="grid gap-3 md:grid-cols-2">
              <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" placeholder="Owner" value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
              <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" value={form.module_key} onChange={(e) => setForm({ ...form, module_key: e.target.value })}>{modules.filter((m) => m.key !== 'all').map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}</select>
              <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" placeholder="Record type" value={form.record_type} onChange={(e) => setForm({ ...form, record_type: e.target.value })} />
              <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option>low</option><option>medium</option><option>high</option><option>critical</option></select>
              <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" value={form.risk_level} onChange={(e) => setForm({ ...form, risk_level: e.target.value })}><option>low</option><option>medium</option><option>high</option><option>critical</option></select>
              <input type="number" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" placeholder="Value MAD" value={form.value_mad} onChange={(e) => setForm({ ...form, value_mad: Number(e.target.value) })} />
              <input type="datetime-local" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
              <textarea className="min-h-[110px] rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold md:col-span-2" placeholder="Description / business context" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <div className="md:col-span-2"><Button tone="dark" onClick={createRecord}>Create synced record</Button></div>
            </div>
          </Section>

          <Section title="Execution control panel" subtitle="Bulk operations, owner assignment, chain execution, and filter controls. These commands modify database rows and refresh the HQ." action={<Button tone="light" onClick={() => setSelected(filtered.map((r) => r.id))}>Select visible</Button>}>
            <div className="grid gap-3 lg:grid-cols-4">
              <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold lg:col-span-2" placeholder="Search records, owners, status, risk..." value={query} onChange={(e) => setQuery(e.target.value)} />
              <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}>{modules.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}</select>
              <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All status</option><option value="open">Open</option><option value="active">Active</option><option value="qualified">Qualified</option><option value="escalated">Escalated</option><option value="done">Done</option><option value="won">Won</option><option value="lost">Lost</option><option value="archived">Archived</option></select>
              <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold lg:col-span-2" placeholder="Owner for assign actions" value={owner} onChange={(e) => setOwner(e.target.value)} />
              <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold lg:col-span-2" value={chainKey} onChange={(e) => setChainKey(e.target.value)}>{playbooks.map((p) => <option key={p.key} value={p.key}>{p.title}</option>)}</select>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button tone="blue" onClick={() => bulk('assign')}>Bulk assign</Button>
              <Button tone="success" onClick={() => bulk('start')}>Bulk start</Button>
              <Button tone="success" onClick={() => bulk('complete')}>Bulk complete</Button>
              <Button tone="warning" onClick={() => bulk('escalate')}>Bulk escalate</Button>
              <Button tone="light" onClick={() => bulk('defer_24h')}>Defer 24h</Button>
              <Button tone="danger" onClick={() => bulk('archive')}>Bulk archive</Button>
              <Button tone="dark" onClick={() => selected[0] && runChain(selected[0], chainKey)}>Run chain on first selected</Button>
              <Button tone="light" onClick={() => setSelected([])}>Clear selection ({selected.length})</Button>
            </div>
          </Section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
          <Section title="Live command records" subtitle="Every row action is connected to v12 APIs. Select rows for bulk commands or run chains from each row.">
            <div className="overflow-x-auto rounded-3xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-100 text-xs font-black uppercase text-slate-600"><tr><th className="p-3">Select</th><th className="p-3">Record</th><th className="p-3">Owner</th><th className="p-3">State</th><th className="p-3">Value</th><th className="p-3">Due</th><th className="p-3">Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filtered.map((r) => <tr key={r.id} className={selected.includes(r.id) ? 'bg-blue-50' : ''}>
                    <td className="p-3"><input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} /></td>
                    <td className="max-w-[360px] p-3"><div className="font-black text-slate-950">{r.title}</div><div className="mt-1 text-xs font-bold text-slate-500">{r.module_key} · {r.record_type}</div><div className="mt-2 line-clamp-2 text-xs font-semibold text-slate-600">{r.description}</div></td>
                    <td className="p-3"><div className="font-black">{r.owner_name || 'Unassigned'}</div></td>
                    <td className="p-3"><div className="flex flex-col gap-1"><Badge tone={statusTone(r.status)}>{r.status || 'open'}</Badge><Badge tone={priorityTone(r.priority)}>{r.priority || 'medium'}</Badge><Badge tone={riskTone(r.risk_level)}>{r.risk_level || 'low'}</Badge></div></td>
                    <td className="p-3"><div className="font-black">{money(r.value_mad)}</div><div className="text-xs font-bold text-slate-500">weighted {money(weight(r))}</div></td>
                    <td className="p-3"><div className={`text-xs font-black ${isOverdue(r) ? 'text-rose-700' : 'text-slate-600'}`}>{dateLabel(r.due_at)}</div></td>
                    <td className="p-3"><div className="flex min-w-[360px] flex-wrap gap-2"><Button tone="light" onClick={() => setEditing(r)}>Edit</Button><Button tone="success" onClick={() => recordAction(r.id, 'start')}>Start</Button><Button tone="success" onClick={() => recordAction(r.id, 'complete')}>Done</Button><Button tone="warning" onClick={() => recordAction(r.id, 'escalate')}>Escalate</Button><Button tone="blue" onClick={() => recordAction(r.id, 'assign')}>Assign</Button><Button tone="dark" onClick={() => runChain(r.id, chainKey)}>Chain</Button><Button tone="danger" onClick={() => deleteRecord(r.id)}>Delete</Button></div></td>
                  </tr>)}
                  {!filtered.length ? <tr><td colSpan={7} className="p-8 text-center font-black text-slate-500">No records found. Seed records or create one from the command panel.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </Section>

          <div className="flex flex-col gap-6">
            <Section title="SLA war room" subtitle="Real SLA calculations from records due dates, risk, and ownership." action={<Button tone="warning" onClick={enforceSla}>Escalate breaches</Button>}>
              <div className="grid gap-3"><div className="rounded-3xl bg-rose-50 p-4"><div className="text-sm font-black text-rose-900">Breaches</div><div className="text-3xl font-black text-rose-700">{sla.breach_count}</div></div><div className="rounded-3xl bg-amber-50 p-4"><div className="text-sm font-black text-amber-900">Danger records</div><div className="text-3xl font-black text-amber-700">{sla.danger_count}</div></div><div className="rounded-3xl bg-slate-100 p-4"><div className="text-sm font-black text-slate-700">Unassigned</div><div className="text-3xl font-black text-slate-950">{sla.unassigned_count}</div></div></div>
            </Section>
            <Section title="Priority execution queue" subtitle="Sorted by overdue state and priority.">
              <div className="space-y-3">{executionQueue.map((r) => <div key={r.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4"><div className="font-black">{r.title}</div><div className="mt-2 flex flex-wrap gap-2"><Badge tone={priorityTone(r.priority)}>{r.priority}</Badge><Badge tone={riskTone(r.risk_level)}>{r.risk_level}</Badge>{isOverdue(r) ? <Badge tone="border-rose-200 bg-rose-100 text-rose-900">Overdue</Badge> : null}</div><div className="mt-3 flex gap-2"><Button tone="warning" onClick={() => recordAction(r.id, 'escalate')}>Escalate</Button><Button tone="dark" onClick={() => runChain(r.id, 'sla_rescue')}>Rescue</Button></div></div>)}</div>
            </Section>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Section title="Execution playbooks" subtitle="Chains create linked work, approvals, and source record updates.">
            <div className="space-y-3">{playbooks.map((p) => <div key={p.key} className="rounded-3xl border border-slate-200 bg-slate-50 p-4"><div className="font-black text-slate-950">{p.title}</div><p className="mt-1 text-sm font-semibold text-slate-600">{p.description}</p><div className="mt-3 flex flex-wrap gap-1">{p.actions.map((a) => <Badge key={a} tone="border-slate-200 bg-white text-slate-700">{a}</Badge>)}</div><div className="mt-3"><Button tone={chainKey === p.key ? 'dark' : 'light'} onClick={() => setChainKey(p.key)}>{chainKey === p.key ? 'Selected' : 'Use playbook'}</Button></div></div>)}</div>
          </Section>
          <Section title="Approval desk" subtitle="Approvals are no longer visual only; approve/reject writes to DB.">
            <div className="space-y-3">{approvalPending.slice(0, 8).map((a) => <div key={a.id} className="rounded-3xl border border-amber-200 bg-amber-50 p-4"><div className="font-black text-slate-950">{a.title}</div><div className="mt-1 text-xs font-bold text-slate-600">Approver: {a.approver_name || 'Manager'}</div><div className="mt-3 flex gap-2"><Button tone="success" onClick={() => approvalDecision(a.id, 'approved')}>Approve</Button><Button tone="danger" onClick={() => approvalDecision(a.id, 'rejected')}>Reject</Button></div></div>)}{!approvalPending.length ? <div className="rounded-3xl bg-slate-100 p-5 text-sm font-black text-slate-500">No pending approvals.</div> : null}</div>
          </Section>
          <Section title="Audit timeline" subtitle="Recent backend actions, bulk commands, chains, SLA enforcement, approvals.">
            <div className="max-h-[720px] space-y-3 overflow-auto pr-1">{logs.slice(0, 25).map((l) => <div key={l.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4"><div className="font-black text-slate-950">{l.action_key}</div><div className="mt-1 text-xs font-bold text-slate-500">{dateLabel(l.created_at)} · {l.status || 'logged'}</div><div className="mt-2 line-clamp-2 text-xs font-semibold text-slate-600">{JSON.stringify(l.payload || {}).slice(0, 180)}</div></div>)}{!logs.length ? <div className="rounded-3xl bg-slate-100 p-5 text-sm font-black text-slate-500">No activity yet.</div> : null}</div>
          </Section>
        </div>

        <Section title="Pipeline and ownership sync" subtitle="HQ summary generated from the same live record set, not separate fake cards.">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4"><h3 className="font-black">Pipeline records</h3><div className="mt-3 text-4xl font-black">{pipelineRows.length}</div><div className="mt-2 text-sm font-bold text-slate-600">{money(pipelineRows.reduce((s, r) => s + Number(r.value_mad || 0), 0))} prospect value</div></div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4"><h3 className="font-black">By owner</h3><div className="mt-3 space-y-2">{Object.entries(pulse.byOwner || {}).slice(0, 8).map(([k, v]) => <div key={k} className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-sm font-black"><span>{k}</span><span>{v}</span></div>)}</div></div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4"><h3 className="font-black">By status</h3><div className="mt-3 space-y-2">{Object.entries(pulse.byStatus || {}).map(([k, v]) => <div key={k} className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-sm font-black"><span>{k}</span><span>{v}</span></div>)}</div></div>
          </div>
        </Section>
      </div>

      {editing ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4"><div className="w-full max-w-3xl rounded-[32px] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl font-black">Edit command record</h2><p className="mt-1 text-sm font-bold text-slate-600">Updates write to the real records table.</p></div><Button tone="light" onClick={() => setEditing(null)}>Close</Button></div><div className="mt-5 grid gap-3 md:grid-cols-2"><input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /><input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" value={editing.owner_name || ''} onChange={(e) => setEditing({ ...editing, owner_name: e.target.value })} /><select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" value={editing.status || 'open'} onChange={(e) => setEditing({ ...editing, status: e.target.value })}><option>open</option><option>active</option><option>qualified</option><option>escalated</option><option>done</option><option>won</option><option>lost</option><option>archived</option></select><select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" value={editing.priority || 'medium'} onChange={(e) => setEditing({ ...editing, priority: e.target.value })}><option>low</option><option>medium</option><option>high</option><option>critical</option></select><select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" value={editing.risk_level || 'low'} onChange={(e) => setEditing({ ...editing, risk_level: e.target.value })}><option>low</option><option>medium</option><option>high</option><option>critical</option></select><input type="number" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" value={editing.value_mad || 0} onChange={(e) => setEditing({ ...editing, value_mad: Number(e.target.value) })} /><textarea className="min-h-[150px] rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold md:col-span-2" value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div><div className="mt-5 flex flex-wrap gap-3"><Button tone="success" onClick={updateRecord}>Save update</Button><Button tone="warning" onClick={() => recordAction(editing.id, 'escalate')}>Escalate</Button><Button tone="dark" onClick={() => runChain(editing.id, chainKey)}>Run chain</Button><Button tone="danger" onClick={() => deleteRecord(editing.id)}>Delete</Button></div></div></div> : null}
    </main>
  )
}

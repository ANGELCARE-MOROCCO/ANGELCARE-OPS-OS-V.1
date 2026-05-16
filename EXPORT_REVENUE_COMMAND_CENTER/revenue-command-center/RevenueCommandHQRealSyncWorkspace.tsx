'use client'

import React, { useEffect, useMemo, useState } from 'react'

type CommandStatus = 'open' | 'active' | 'in_progress' | 'done' | 'blocked' | 'escalated' | 'archived' | 'lost' | 'won'
type CommandPriority = 'low' | 'medium' | 'high' | 'critical'
type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

type RevenueRecord = {
  id: string
  module_key?: string | null
  page_key?: string | null
  record_type?: string | null
  title: string
  description?: string | null
  owner_name?: string | null
  department?: string | null
  status?: CommandStatus | string | null
  priority?: CommandPriority | string | null
  risk_level?: RiskLevel | string | null
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
  byModule: Record<string, number>
  byOwner: Record<string, number>
  byStatus: Record<string, number>
  recentActivity: Array<{ id: string; action_key: string; title?: string; created_at?: string; status?: string; payload?: any }>
}

type ApiState = 'idle' | 'loading' | 'ok' | 'error'

const API_BASE = '/api/revenue-command-center/v11'

const moduleBlueprints = [
  { key: 'hq', label: 'HQ Command', route: '/revenue-command-center', intent: 'Executive control room', icon: '◆' },
  { key: 'tasks', label: 'Tasks', route: '/revenue-command-center/tasks', intent: 'Execution ownership', icon: '✓' },
  { key: 'prospects', label: 'Prospects', route: '/revenue-command-center/prospects', intent: 'Pipeline qualification', icon: '◇' },
  { key: 'appointments', label: 'Appointments', route: '/revenue-command-center/appointments', intent: 'Conversion agenda', icon: '◷' },
  { key: 'follow_ups', label: 'Follow-ups', route: '/revenue-command-center/follow-ups', intent: 'Next action discipline', icon: '↻' },
  { key: 'campaigns', label: 'Campaigns', route: '/revenue-command-center/campaigns', intent: 'Revenue initiatives', icon: '◉' },
  { key: 'automation', label: 'Automation', route: '/revenue-command-center/automation', intent: 'Rules and triggers', icon: '⚙' },
  { key: 'control_tower', label: 'Control Tower', route: '/revenue-command-center/control-tower', intent: 'Risk and intervention', icon: '▲' },
  { key: 'management', label: 'Management', route: '/revenue-command-center/management', intent: 'Team workload', icon: '▦' },
  { key: 'ai_scoring', label: 'AI Scoring', route: '/revenue-command-center/ai-scoring', intent: 'Priority intelligence', icon: '✦' },
]

const scenarioPresets = [
  { title: 'High-value prospect needs owner', module_key: 'prospects', record_type: 'prospect', priority: 'critical', risk_level: 'high', value_mad: 85000, owner_name: 'BD Lead', description: 'Qualify decision makers, confirm need, schedule commercial conversation, and protect next action.' },
  { title: 'Overdue follow-up recovery', module_key: 'follow_ups', record_type: 'follow_up', priority: 'high', risk_level: 'critical', value_mad: 22000, owner_name: 'SDR Team', description: 'Recover stale contact, call today, update stage, and create next touchpoint.' },
  { title: 'Campaign conversion inspection', module_key: 'campaigns', record_type: 'campaign_control', priority: 'high', risk_level: 'medium', value_mad: 45000, owner_name: 'Growth Manager', description: 'Review lead quality, broken handoffs, action backlog, and channel ROI.' },
  { title: 'Team workload overload', module_key: 'management', record_type: 'workload', priority: 'critical', risk_level: 'critical', value_mad: 0, owner_name: 'Revenue Manager', description: 'Rebalance workload, protect critical deals, and move low-impact tasks.' },
  { title: 'Appointment confirmation desk', module_key: 'appointments', record_type: 'appointment', priority: 'medium', risk_level: 'medium', value_mad: 15000, owner_name: 'Sales Coordinator', description: 'Confirm attendance, agenda, decision participants, and next-step readiness.' },
]

const emptyPulse: Pulse = {
  total: 0,
  open: 0,
  active: 0,
  done: 0,
  archived: 0,
  escalated: 0,
  highRisk: 0,
  overdue: 0,
  totalValue: 0,
  weightedValue: 0,
  byModule: {},
  byOwner: {},
  byStatus: {},
  recentActivity: [],
}

function money(value?: number | null) {
  return new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(Number(value || 0))
}

function dateLabel(value?: string | null) {
  if (!value) return 'No date'
  try { return new Intl.DateTimeFormat('fr-MA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) } catch { return value }
}

function normalize(value?: string | null) {
  return String(value || '').toLowerCase().replace(/\s+/g, '_')
}

function isOverdue(record: RevenueRecord) {
  if (!record.due_at || ['done', 'archived', 'won', 'lost'].includes(normalize(record.status))) return false
  return new Date(record.due_at).getTime() < Date.now()
}

function statusClass(status?: string | null) {
  const s = normalize(status)
  if (s === 'done' || s === 'won') return 'bg-emerald-50 text-emerald-800 border-emerald-200'
  if (s === 'active' || s === 'in_progress') return 'bg-blue-50 text-blue-800 border-blue-200'
  if (s === 'escalated' || s === 'blocked') return 'bg-rose-50 text-rose-800 border-rose-200'
  if (s === 'archived' || s === 'lost') return 'bg-slate-100 text-slate-700 border-slate-200'
  return 'bg-amber-50 text-amber-800 border-amber-200'
}

function priorityClass(priority?: string | null) {
  const p = normalize(priority)
  if (p === 'critical') return 'bg-rose-600 text-white border-rose-700'
  if (p === 'high') return 'bg-orange-100 text-orange-900 border-orange-200'
  if (p === 'medium') return 'bg-indigo-50 text-indigo-800 border-indigo-200'
  return 'bg-slate-50 text-slate-700 border-slate-200'
}

function riskClass(risk?: string | null) {
  const r = normalize(risk)
  if (r === 'critical') return 'bg-rose-900 text-white border-rose-950'
  if (r === 'high') return 'bg-rose-50 text-rose-800 border-rose-200'
  if (r === 'medium') return 'bg-amber-50 text-amber-800 border-amber-200'
  return 'bg-emerald-50 text-emerald-800 border-emerald-200'
}

function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${className}`}>{children}</span>
}

function Section({ title, subtitle, children, action }: { title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm font-medium text-slate-600">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function Button({ children, onClick, disabled, tone = 'dark', title }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; tone?: 'dark' | 'light' | 'danger' | 'success' | 'warning'; title?: string }) {
  const tones = {
    dark: 'bg-slate-950 text-white hover:bg-slate-800 border-slate-950',
    light: 'bg-white text-slate-900 hover:bg-slate-50 border-slate-200',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 border-rose-700',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700',
    warning: 'bg-amber-500 text-slate-950 hover:bg-amber-400 border-amber-500',
  }
  return (
    <button title={title} onClick={onClick} disabled={disabled} className={`rounded-2xl border px-4 py-2 text-sm font-black shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]}`}>
      {children}
    </button>
  )
}

export default function RevenueCommandHQRealSyncWorkspace() {
  const [records, setRecords] = useState<RevenueRecord[]>([])
  const [pulse, setPulse] = useState<Pulse>(emptyPulse)
  const [apiState, setApiState] = useState<ApiState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState<string[]>([])
  const [editing, setEditing] = useState<RevenueRecord | null>(null)
  const [quick, setQuick] = useState({
    title: '', module_key: 'tasks', record_type: 'task', owner_name: '', description: '', priority: 'medium', risk_level: 'low', value_mad: 0, due_at: ''
  })
  const [lastAction, setLastAction] = useState<string>('No action yet')

  async function api(path: string, options?: RequestInit) {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    })
    const text = await res.text()
    let json: any = null
    try { json = text ? JSON.parse(text) : {} } catch {
      throw new Error(`API returned non-JSON at ${API_BASE}${path}. Status ${res.status}. This usually means missing route, auth redirect, or server error.`)
    }
    if (!res.ok || json?.ok === false) throw new Error(json?.error || `Request failed: ${res.status}`)
    return json
  }

  async function refresh() {
    setApiState('loading')
    setError(null)
    try {
      const [recordsJson, pulseJson] = await Promise.all([api('/records'), api('/pulse')])
      setRecords(recordsJson.records || [])
      setPulse(pulseJson.pulse || emptyPulse)
      setApiState('ok')
    } catch (e: any) {
      setApiState('error')
      setError(e?.message || 'Revenue Command API failed')
    }
  }

  useEffect(() => { refresh() }, [])

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (r.deleted_at) return false
      if (moduleFilter !== 'all' && normalize(r.module_key) !== moduleFilter) return false
      if (statusFilter !== 'all' && normalize(r.status) !== statusFilter) return false
      if (!query.trim()) return true
      const hay = [r.title, r.description, r.owner_name, r.module_key, r.status, r.priority, r.risk_level].join(' ').toLowerCase()
      return hay.includes(query.toLowerCase())
    })
  }, [records, query, moduleFilter, statusFilter])

  const urgentQueue = useMemo(() => filtered.filter((r) => ['critical', 'high'].includes(normalize(r.priority)) || ['critical', 'high'].includes(normalize(r.risk_level)) || isOverdue(r)).slice(0, 12), [filtered])
  const todayAgenda = useMemo(() => filtered.filter((r) => ['appointment', 'follow_up', 'task'].includes(normalize(r.record_type)) && !['done', 'archived'].includes(normalize(r.status))).slice(0, 10), [filtered])
  const pipelineRecords = useMemo(() => filtered.filter((r) => ['prospect', 'lead', 'opportunity'].includes(normalize(r.record_type)) || normalize(r.module_key) === 'prospects'), [filtered])

  async function createRecord(payload?: Partial<RevenueRecord>) {
    const body = payload || quick
    if (!body.title?.trim()) { setError('Title is required before creating a command record.'); return }
    const json = await api('/records', { method: 'POST', body: JSON.stringify(body) })
    setRecords((prev) => [json.record, ...prev].filter(Boolean))
    setQuick({ title: '', module_key: 'tasks', record_type: 'task', owner_name: '', description: '', priority: 'medium', risk_level: 'low', value_mad: 0, due_at: '' })
    setLastAction(`Created: ${json.record?.title || body.title}`)
    await refresh()
  }

  async function updateRecord(id: string, updates: Partial<RevenueRecord>, label = 'Updated record') {
    const json = await api('/records', { method: 'PATCH', body: JSON.stringify({ id, ...updates }) })
    setRecords((prev) => prev.map((r) => r.id === id ? json.record : r))
    setLastAction(label)
    await refresh()
  }

  async function deleteRecord(id: string) {
    if (!confirm('Delete this Revenue Command record? This is a soft delete and can be audited.')) return
    await api('/records', { method: 'DELETE', body: JSON.stringify({ id }) })
    setRecords((prev) => prev.filter((r) => r.id !== id))
    setLastAction('Deleted record')
    await refresh()
  }

  async function runAction(action_key: string, record?: RevenueRecord, payload: any = {}) {
    const json = await api('/action', { method: 'POST', body: JSON.stringify({ action_key, record_id: record?.id, payload }) })
    if (json.record) setRecords((prev) => prev.map((r) => r.id === json.record.id ? json.record : r))
    setLastAction(json.message || action_key)
    await refresh()
  }

  async function bulk(action_key: string, updates: any = {}) {
    if (!selected.length) { setError('Select at least one record for bulk action.'); return }
    await api('/bulk', { method: 'POST', body: JSON.stringify({ ids: selected, action_key, updates }) })
    setSelected([])
    setLastAction(`Bulk action completed: ${action_key}`)
    await refresh()
  }

  async function seed() {
    const json = await api('/seed', { method: 'POST', body: JSON.stringify({}) })
    setLastAction(`Seeded ${json.count || 0} synchronized HQ records`)
    await refresh()
  }

  const selectedAll = filtered.length > 0 && filtered.every((r) => selected.includes(r.id))

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-950 md:p-8">
      <div className="mx-auto max-w-[1800px] space-y-6">
        <div className="overflow-hidden rounded-[36px] border border-slate-800 bg-slate-950 shadow-2xl">
          <div className="grid gap-6 p-6 md:grid-cols-[1.35fr_.65fr] md:p-8">
            <div>
              <div className="mb-5 flex flex-wrap gap-2">
                <Badge className="border-emerald-400 bg-emerald-400 text-slate-950">REAL SYNC HQ</Badge>
                <Badge className="border-white/20 bg-white/10 text-white">API {apiState.toUpperCase()}</Badge>
                <Badge className="border-white/20 bg-white/10 text-white">{filtered.length} visible records</Badge>
              </div>
              <h1 className="max-w-5xl text-4xl font-black leading-tight text-white md:text-6xl">Revenue Command Center — live execution HQ</h1>
              <p className="mt-4 max-w-4xl text-base font-semibold leading-7 text-slate-200 md:text-lg">
                This page is built as the source-of-truth operating room: tasks, prospects, appointments, follow-ups, campaigns, risks, ownership, value, and audit activity are synchronized through the V11 Revenue Command APIs.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={refresh} tone="light">Refresh live sync</Button>
                <Button onClick={seed} tone="warning">Seed real HQ records</Button>
                <Button onClick={() => createRecord({ title: 'Executive revenue intervention', module_key: 'control_tower', record_type: 'intervention', priority: 'critical', risk_level: 'critical', status: 'open', owner_name: 'Revenue Director', value_mad: 0, description: 'Immediate control tower intervention with owner, risk, next action, and audit trail.' })} tone="success">Open intervention</Button>
              </div>
            </div>
            <div className="rounded-[28px] border border-white/15 bg-white/10 p-5 text-white">
              <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-300">Last action</p>
              <p className="mt-3 text-2xl font-black">{lastAction}</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-3xl bg-white p-4 text-slate-950"><p className="text-xs font-black text-slate-500">Total value</p><p className="mt-1 text-2xl font-black">{money(pulse.totalValue)}</p></div>
                <div className="rounded-3xl bg-white p-4 text-slate-950"><p className="text-xs font-black text-slate-500">Risk items</p><p className="mt-1 text-2xl font-black">{pulse.highRisk}</p></div>
                <div className="rounded-3xl bg-white p-4 text-slate-950"><p className="text-xs font-black text-slate-500">Overdue</p><p className="mt-1 text-2xl font-black">{pulse.overdue}</p></div>
                <div className="rounded-3xl bg-white p-4 text-slate-950"><p className="text-xs font-black text-slate-500">Escalated</p><p className="mt-1 text-2xl font-black">{pulse.escalated}</p></div>
              </div>
            </div>
          </div>
        </div>

        {error ? <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">{error}</div> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {[
            ['Total records', pulse.total], ['Open', pulse.open], ['Active', pulse.active], ['Done', pulse.done], ['Archived', pulse.archived], ['Weighted value', money(pulse.weightedValue)],
          ].map(([label, value]) => <div key={String(label)} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-black uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p></div>)}
        </div>

        <Section title="Fast command creation" subtitle="Create real synchronized Revenue Command records. These appear immediately in the HQ widgets and tables." action={<Button onClick={() => createRecord()} tone="dark">Create command record</Button>}>
          <div className="grid gap-3 lg:grid-cols-12">
            <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none lg:col-span-3" placeholder="Title / command objective" value={quick.title} onChange={(e) => setQuick({ ...quick, title: e.target.value })} />
            <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold lg:col-span-2" value={quick.module_key} onChange={(e) => setQuick({ ...quick, module_key: e.target.value })}>{moduleBlueprints.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}</select>
            <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold lg:col-span-2" value={quick.record_type} onChange={(e) => setQuick({ ...quick, record_type: e.target.value })}>{['task','prospect','follow_up','appointment','campaign_control','intervention','workload','automation_rule'].map((x) => <option key={x}>{x}</option>)}</select>
            <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none lg:col-span-2" placeholder="Owner" value={quick.owner_name} onChange={(e) => setQuick({ ...quick, owner_name: e.target.value })} />
            <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" value={quick.priority} onChange={(e) => setQuick({ ...quick, priority: e.target.value })}>{['low','medium','high','critical'].map((x) => <option key={x}>{x}</option>)}</select>
            <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" value={quick.risk_level} onChange={(e) => setQuick({ ...quick, risk_level: e.target.value })}>{['low','medium','high','critical'].map((x) => <option key={x}>{x}</option>)}</select>
            <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none lg:col-span-2" type="number" placeholder="Value MAD" value={quick.value_mad} onChange={(e) => setQuick({ ...quick, value_mad: Number(e.target.value) })} />
            <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none lg:col-span-2" type="datetime-local" value={quick.due_at} onChange={(e) => setQuick({ ...quick, due_at: e.target.value })} />
            <textarea className="min-h-[94px] rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none lg:col-span-8" placeholder="Operational description, next action, dependencies, decision makers, risks..." value={quick.description} onChange={(e) => setQuick({ ...quick, description: e.target.value })} />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-5">
            {scenarioPresets.map((preset) => <button key={preset.title} onClick={() => createRecord({ ...preset, status: 'open' } as any)} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:bg-white hover:shadow-md"><p className="text-sm font-black text-slate-950">{preset.title}</p><p className="mt-2 text-xs font-bold text-slate-600">{preset.description}</p></button>)}
          </div>
        </Section>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
          <Section title="Urgent execution queue" subtitle="High priority, high risk, overdue, blocked, and escalated records that need direct command attention.">
            <div className="space-y-3">
              {urgentQueue.length ? urgentQueue.map((r) => <RecordMini key={r.id} record={r} onStart={() => runAction('start', r)} onDone={() => runAction('complete', r)} onEscalate={() => runAction('escalate', r)} onArchive={() => runAction('archive', r)} />) : <Empty text="No urgent records. Seed or create records to activate the queue." />}
            </div>
          </Section>
          <Section title="Module synchronization map" subtitle="Each card is derived from live records by module, not static decoration.">
            <div className="grid gap-3 md:grid-cols-2">
              {moduleBlueprints.map((m) => <a key={m.key} href={m.route} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:bg-white hover:shadow-md"><div className="flex items-center justify-between"><span className="text-2xl">{m.icon}</span><Badge className="border-slate-200 bg-white text-slate-800">{pulse.byModule[m.key] || 0}</Badge></div><p className="mt-3 text-sm font-black text-slate-950">{m.label}</p><p className="mt-1 text-xs font-bold text-slate-600">{m.intent}</p></a>)}
            </div>
          </Section>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <Section title="Pipeline value board" subtitle="Prospect/opportunity records and revenue value.">
            <div className="space-y-3">{pipelineRecords.slice(0, 10).map((r) => <PipelineRow key={r.id} record={r} onQualify={() => runAction('qualify_prospect', r)} onWon={() => runAction('mark_won', r)} onLost={() => runAction('mark_lost', r)} />)}{!pipelineRecords.length ? <Empty text="No prospect records found." /> : null}</div>
          </Section>
          <Section title="Today conversion agenda" subtitle="Appointments, follow-ups, and tasks needing discipline.">
            <div className="space-y-3">{todayAgenda.map((r) => <AgendaRow key={r.id} record={r} onNext={() => runAction('create_next_follow_up', r)} onDone={() => runAction('complete', r)} />)}{!todayAgenda.length ? <Empty text="No active agenda records found." /> : null}</div>
          </Section>
          <Section title="Recent audit stream" subtitle="Recent actions logged by the API layer.">
            <div className="space-y-3">{pulse.recentActivity?.length ? pulse.recentActivity.map((a) => <div key={a.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><p className="text-sm font-black text-slate-900">{a.action_key}</p><p className="mt-1 text-xs font-bold text-slate-500">{dateLabel(a.created_at)}</p></div>) : <Empty text="No audit activity yet." />}</div>
          </Section>
        </div>

        <Section title="Live command records table" subtitle="Real CRUD, bulk actions, filtering, edit, delete, archive, escalation, owner assignment, and status management." action={<div className="flex flex-wrap gap-2"><Button onClick={() => bulk('complete', { status: 'done' })} tone="success">Bulk done</Button><Button onClick={() => bulk('archive', { status: 'archived' })} tone="warning">Bulk archive</Button><Button onClick={() => bulk('escalate', { status: 'escalated', risk_level: 'critical' })} tone="danger">Bulk escalate</Button></div>}>
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" placeholder="Search title, owner, status..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)}><option value="all">All modules</option>{moduleBlueprints.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}</select>
            <select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All statuses</option>{['open','active','in_progress','done','blocked','escalated','archived','won','lost'].map((x) => <option key={x}>{x}</option>)}</select>
            <Button onClick={refresh} tone="light">Refresh table</Button>
          </div>
          <div className="overflow-x-auto rounded-3xl border border-slate-200">
            <table className="min-w-[1200px] w-full divide-y divide-slate-200 text-left">
              <thead className="bg-slate-950 text-white"><tr><th className="p-4"><input type="checkbox" checked={selectedAll} onChange={(e) => setSelected(e.target.checked ? filtered.map((r) => r.id) : [])} /></th>{['Command','Module','Owner','Status','Priority','Risk','Value','Due','Actions'].map((h) => <th key={h} className="p-4 text-xs font-black uppercase tracking-wider">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filtered.map((r) => <tr key={r.id} className={isOverdue(r) ? 'bg-rose-50/60' : ''}>
                  <td className="p-4"><input type="checkbox" checked={selected.includes(r.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, r.id] : selected.filter((id) => id !== r.id))} /></td>
                  <td className="p-4"><p className="max-w-sm text-sm font-black text-slate-950">{r.title}</p><p className="mt-1 max-w-sm truncate text-xs font-semibold text-slate-500">{r.description || 'No description'}</p></td>
                  <td className="p-4"><Badge className="border-slate-200 bg-slate-50 text-slate-800">{r.module_key || 'hq'}</Badge></td>
                  <td className="p-4 text-sm font-bold text-slate-700">{r.owner_name || 'Unassigned'}</td>
                  <td className="p-4"><Badge className={statusClass(r.status)}>{r.status || 'open'}</Badge></td>
                  <td className="p-4"><Badge className={priorityClass(r.priority)}>{r.priority || 'medium'}</Badge></td>
                  <td className="p-4"><Badge className={riskClass(r.risk_level)}>{r.risk_level || 'low'}</Badge></td>
                  <td className="p-4 text-sm font-black">{money(r.value_mad)}</td>
                  <td className="p-4 text-xs font-bold text-slate-600">{dateLabel(r.due_at)}</td>
                  <td className="p-4"><div className="flex flex-wrap gap-2"><Button onClick={() => setEditing(r)} tone="light">Edit</Button><Button onClick={() => runAction('start', r)} tone="light">Start</Button><Button onClick={() => runAction('complete', r)} tone="success">Done</Button><Button onClick={() => runAction('escalate', r)} tone="danger">Escalate</Button><Button onClick={() => runAction('archive', r)} tone="warning">Archive</Button><Button onClick={() => deleteRecord(r.id)} tone="danger">Delete</Button></div></td>
                </tr>)}
                {!filtered.length ? <tr><td colSpan={9} className="p-8"><Empty text="No records match filters. Create or seed records to activate the HQ." /></td></tr> : null}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      {editing ? <EditDrawer record={editing} onClose={() => setEditing(null)} onSave={async (updates) => { await updateRecord(editing.id, updates, 'Edited record'); setEditing(null) }} /> : null}
    </main>
  )
}

function Empty({ text }: { text: string }) { return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-bold text-slate-500">{text}</div> }

function RecordMini({ record, onStart, onDone, onEscalate, onArchive }: { record: RevenueRecord; onStart: () => void; onDone: () => void; onEscalate: () => void; onArchive: () => void }) {
  return <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><p className="text-sm font-black text-slate-950">{record.title}</p><p className="mt-1 text-xs font-bold text-slate-600">{record.owner_name || 'Unassigned'} · {record.module_key || 'hq'} · {money(record.value_mad)}</p><div className="mt-2 flex flex-wrap gap-2"><Badge className={statusClass(record.status)}>{record.status || 'open'}</Badge><Badge className={priorityClass(record.priority)}>{record.priority || 'medium'}</Badge><Badge className={riskClass(record.risk_level)}>{record.risk_level || 'low'}</Badge>{isOverdue(record) ? <Badge className="border-rose-300 bg-rose-100 text-rose-900">overdue</Badge> : null}</div></div><div className="flex flex-wrap gap-2"><Button onClick={onStart} tone="light">Start</Button><Button onClick={onDone} tone="success">Done</Button><Button onClick={onEscalate} tone="danger">Escalate</Button><Button onClick={onArchive} tone="warning">Archive</Button></div></div></div>
}

function PipelineRow({ record, onQualify, onWon, onLost }: { record: RevenueRecord; onQualify: () => void; onWon: () => void; onLost: () => void }) {
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-black text-slate-950">{record.title}</p><p className="mt-1 text-xs font-bold text-slate-500">{record.owner_name || 'No owner'} · {money(record.value_mad)}</p><div className="mt-3 flex flex-wrap gap-2"><Button onClick={onQualify} tone="light">Qualify</Button><Button onClick={onWon} tone="success">Won</Button><Button onClick={onLost} tone="danger">Lost</Button></div></div>
}

function AgendaRow({ record, onNext, onDone }: { record: RevenueRecord; onNext: () => void; onDone: () => void }) {
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-sm font-black text-slate-950">{record.title}</p><p className="mt-1 text-xs font-bold text-slate-500">Due: {dateLabel(record.due_at)} · {record.owner_name || 'No owner'}</p><div className="mt-3 flex flex-wrap gap-2"><Button onClick={onNext} tone="light">Next follow-up</Button><Button onClick={onDone} tone="success">Done</Button></div></div>
}

function EditDrawer({ record, onClose, onSave }: { record: RevenueRecord; onClose: () => void; onSave: (updates: Partial<RevenueRecord>) => void }) {
  const [draft, setDraft] = useState({ title: record.title || '', description: record.description || '', owner_name: record.owner_name || '', status: record.status || 'open', priority: record.priority || 'medium', risk_level: record.risk_level || 'low', value_mad: Number(record.value_mad || 0), due_at: record.due_at ? record.due_at.slice(0,16) : '' })
  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 p-4"><div className="h-full w-full max-w-xl overflow-y-auto rounded-[32px] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl font-black text-slate-950">Edit command record</h2><p className="mt-1 text-sm font-bold text-slate-500">Changes are saved through the V11 records API and refresh the live HQ.</p></div><Button onClick={onClose} tone="light">Close</Button></div><div className="mt-6 grid gap-3"><input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /><input className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" value={draft.owner_name} onChange={(e) => setDraft({ ...draft, owner_name: e.target.value })} placeholder="Owner" /><textarea className="min-h-[140px] rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /><select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" value={draft.status as string} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>{['open','active','in_progress','done','blocked','escalated','archived','won','lost'].map((x) => <option key={x}>{x}</option>)}</select><select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" value={draft.priority as string} onChange={(e) => setDraft({ ...draft, priority: e.target.value })}>{['low','medium','high','critical'].map((x) => <option key={x}>{x}</option>)}</select><select className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" value={draft.risk_level as string} onChange={(e) => setDraft({ ...draft, risk_level: e.target.value })}>{['low','medium','high','critical'].map((x) => <option key={x}>{x}</option>)}</select><input type="number" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" value={draft.value_mad} onChange={(e) => setDraft({ ...draft, value_mad: Number(e.target.value) })} /><input type="datetime-local" className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold" value={draft.due_at} onChange={(e) => setDraft({ ...draft, due_at: e.target.value })} /><Button onClick={() => onSave(draft as any)} tone="dark">Save real update</Button></div></div></div>
}

'use client'

import React, { useEffect, useMemo, useState } from 'react'

type Status = 'Open' | 'In progress' | 'Blocked' | 'Done' | 'Archived'
type Priority = 'low' | 'medium' | 'high' | 'urgent'
type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

type RevenueRecord = {
  id: string
  module_key?: string
  page_key?: string
  record_type?: string
  title: string
  description?: string | null
  owner_name?: string | null
  department?: string | null
  status?: Status | string
  priority?: Priority | string
  risk_level?: RiskLevel | string
  value_mad?: number | string | null
  due_date?: string | null
  metadata?: any
  created_at?: string
  updated_at?: string
}

type LogRecord = {
  id?: string
  action_key?: string
  selected_count?: number
  status?: string
  created_at?: string
  payload?: any
}

type Draft = {
  title: string
  description: string
  owner_name: string
  record_type: string
  status: Status
  priority: Priority
  risk_level: RiskLevel
  value_mad: string
  due_date: string
}

const API = '/api/revenue-command-center/v10'

const owners = ['Amina', 'Youssef', 'Sara', 'Nour', 'Karim', 'Ops Desk']
const statuses: Status[] = ['Open', 'In progress', 'Blocked', 'Done', 'Archived']
const priorities: Priority[] = ['low', 'medium', 'high', 'urgent']
const risks: RiskLevel[] = ['low', 'medium', 'high', 'critical']
const types = ['command_record', 'task', 'prospect', 'appointment', 'follow_up', 'campaign', 'risk', 'automation']

const emptyDraft: Draft = {
  title: '',
  description: '',
  owner_name: 'Amina',
  record_type: 'command_record',
  status: 'Open',
  priority: 'high',
  risk_level: 'medium',
  value_mad: '25000',
  due_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
}

const formatMad = (value: any) => {
  const n = Number(value || 0)
  return `MAD ${n.toLocaleString('en-US')}`
}

const normalize = (record: RevenueRecord): RevenueRecord => ({
  ...record,
  status: (record.status || 'Open') as Status,
  priority: (record.priority || 'medium') as Priority,
  risk_level: (record.risk_level || 'low') as RiskLevel,
  value_mad: Number(record.value_mad || 0),
})

const safeText = (value: any, fallback = '—') => {
  if (value === undefined || value === null || value === '') return fallback
  return String(value)
}

function statusClass(status?: string) {
  if (status === 'Done') return 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100'
  if (status === 'Blocked') return 'border-rose-400/40 bg-rose-500/15 text-rose-100'
  if (status === 'In progress') return 'border-cyan-400/40 bg-cyan-500/15 text-cyan-100'
  if (status === 'Archived') return 'border-slate-500/40 bg-slate-600/20 text-slate-300'
  return 'border-amber-400/40 bg-amber-500/15 text-amber-100'
}

function priorityClass(priority?: string) {
  if (priority === 'urgent') return 'border-red-400/50 bg-red-500/20 text-red-100'
  if (priority === 'high') return 'border-orange-400/50 bg-orange-500/20 text-orange-100'
  if (priority === 'medium') return 'border-yellow-400/40 bg-yellow-500/15 text-yellow-100'
  return 'border-slate-400/30 bg-slate-600/20 text-slate-200'
}

function riskClass(risk?: string) {
  if (risk === 'critical') return 'border-red-400/50 bg-red-500/20 text-red-100'
  if (risk === 'high') return 'border-rose-400/50 bg-rose-500/20 text-rose-100'
  if (risk === 'medium') return 'border-amber-400/40 bg-amber-500/15 text-amber-100'
  return 'border-emerald-400/40 bg-emerald-500/15 text-emerald-100'
}

function Button({ children, onClick, disabled, tone = 'default', title }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; tone?: 'default' | 'primary' | 'danger' | 'success' | 'ghost'; title?: string }) {
  const tones = {
    default: 'border-white/15 bg-white/10 text-white hover:bg-white/15',
    primary: 'border-cyan-300/40 bg-cyan-400/15 text-cyan-50 hover:bg-cyan-400/25',
    danger: 'border-rose-300/40 bg-rose-500/15 text-rose-50 hover:bg-rose-500/25',
    success: 'border-emerald-300/40 bg-emerald-500/15 text-emerald-50 hover:bg-emerald-500/25',
    ghost: 'border-transparent bg-transparent text-slate-200 hover:bg-white/10',
  }
  return (
    <button title={title} onClick={onClick} disabled={disabled} className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${tones[tone]} ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}>
      {children}
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
      {label}
      {children}
    </label>
  )
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 ${props.className || ''}`} />
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300/60 ${props.className || ''}`} />
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`min-h-[96px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 ${props.className || ''}`} />
}

export default function RevenueCommandHQWorkspace() {
  const [records, setRecords] = useState<RevenueRecord[]>([])
  const [logs, setLogs] = useState<LogRecord[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [editing, setEditing] = useState<RevenueRecord | null>(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('Ready. Revenue Command HQ is connected to V10 execution APIs.')
  const [error, setError] = useState('')

  async function parseJson(res: Response) {
    const text = await res.text()
    try {
      return JSON.parse(text)
    } catch {
      throw new Error(`API returned non-JSON response (${res.status}). First characters: ${text.slice(0, 80)}`)
    }
  }

  async function loadAll() {
    setBusy(true)
    setError('')
    try {
      const [recordsRes, logsRes] = await Promise.all([
        fetch(`${API}/records?page=/revenue-command-center`, { cache: 'no-store' }),
        fetch(`${API}/action`, { cache: 'no-store' }),
      ])
      const recordsJson = await parseJson(recordsRes)
      const logsJson = await parseJson(logsRes)
      if (!recordsJson.ok) throw new Error(recordsJson.error || 'Records API failed')
      setRecords((recordsJson.records || []).map(normalize))
      setLogs(logsJson.logs || [])
      setMessage(`Loaded ${(recordsJson.records || []).length} command records.`)
    } catch (e: any) {
      setError(e?.message || 'Failed to load Revenue Command HQ')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return records.filter((r) => {
      const matchesQuery = !q || [r.title, r.description, r.owner_name, r.record_type, r.department, r.status, r.priority, r.risk_level].some((x) => String(x || '').toLowerCase().includes(q))
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter
      const matchesType = typeFilter === 'all' || r.record_type === typeFilter
      return matchesQuery && matchesStatus && matchesType
    })
  }, [records, query, statusFilter, typeFilter])

  const stats = useMemo(() => {
    const active = records.filter((r) => r.status !== 'Archived')
    const totalValue = active.reduce((sum, r) => sum + Number(r.value_mad || 0), 0)
    const open = active.filter((r) => r.status === 'Open').length
    const progress = active.filter((r) => r.status === 'In progress').length
    const blocked = active.filter((r) => r.status === 'Blocked').length
    const done = active.filter((r) => r.status === 'Done').length
    const risk = active.filter((r) => ['high', 'critical'].includes(String(r.risk_level))).length
    const urgent = active.filter((r) => r.priority === 'urgent').length
    return { active: active.length, totalValue, open, progress, blocked, done, risk, urgent }
  }, [records])

  const grouped = useMemo(() => {
    const lanes: Record<string, RevenueRecord[]> = { Open: [], 'In progress': [], Blocked: [], Done: [] }
    filtered.forEach((r) => {
      const key = String(r.status || 'Open')
      if (lanes[key]) lanes[key].push(r)
    })
    return lanes
  }, [filtered])

  const selectedRecords = useMemo(() => records.filter((r) => selected.includes(r.id)), [records, selected])

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function selectAllVisible() {
    setSelected((prev) => (prev.length === filtered.length ? [] : filtered.map((r) => r.id)))
  }

  async function createRecord(kind?: string) {
    if (!draft.title.trim()) {
      setError('Title is required before creating a command record.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const payload = {
        ...draft,
        record_type: kind || draft.record_type,
        module_key: 'revenue_hq',
        page_key: '/revenue-command-center',
        value_mad: Number(draft.value_mad || 0),
        metadata: { source: 'RevenueCommandHQWorkspace', production_page: 'hq' },
      }
      const res = await fetch(`${API}/records`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await parseJson(res)
      if (!json.ok) throw new Error(json.error || 'Create failed')
      setRecords((prev) => [normalize(json.record), ...prev])
      setDraft(emptyDraft)
      setMessage(`Created ${payload.record_type}: ${payload.title}`)
    } catch (e: any) {
      setError(e?.message || 'Create failed')
    } finally {
      setBusy(false)
    }
  }

  async function updateRecord(id: string, updates: Partial<RevenueRecord>, label = 'record updated') {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`${API}/records`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) })
      const json = await parseJson(res)
      if (!json.ok) throw new Error(json.error || 'Update failed')
      setRecords((prev) => prev.map((r) => (r.id === id ? normalize(json.record) : r)))
      setMessage(label)
    } catch (e: any) {
      setError(e?.message || 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  async function deleteRecord(id: string) {
    if (!confirm('Delete this Revenue Command record permanently?')) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`${API}/records`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      const json = await parseJson(res)
      if (!json.ok) throw new Error(json.error || 'Delete failed')
      setRecords((prev) => prev.filter((r) => r.id !== id))
      setSelected((prev) => prev.filter((x) => x !== id))
      setMessage('Record deleted.')
    } catch (e: any) {
      setError(e?.message || 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  async function runAction(action: string, ids = selected, updates?: any) {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`${API}/action`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, module: 'revenue_hq', page: '/revenue-command-center', selected: ids, updates }) })
      const json = await parseJson(res)
      if (!json.ok) throw new Error(json.error || `${action} failed`)
      if (json.updated?.length) {
        const map = new Map(json.updated.map((r: RevenueRecord) => [r.id, normalize(r)]))
        setRecords((prev) => prev.map((r) => (map.has(r.id) ? (map.get(r.id) as RevenueRecord) : r)))
      }
      setMessage(`${action.replaceAll('_', ' ')} executed on ${json.selected_count || ids.length} record(s).`)
      fetch(`${API}/action`, { cache: 'no-store' }).then(parseJson).then((j) => setLogs(j.logs || [])).catch(() => {})
    } catch (e: any) {
      setError(e?.message || `${action} failed`)
    } finally {
      setBusy(false)
    }
  }

  async function bulkUpdate(updates: any, label: string) {
    if (!selected.length) {
      setError('Select at least one record before using bulk controls.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`${API}/bulk`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: selected, updates }) })
      const json = await parseJson(res)
      if (!json.ok) throw new Error(json.error || 'Bulk update failed')
      if (json.updated?.length) {
        const map = new Map(json.updated.map((r: RevenueRecord) => [r.id, normalize(r)]))
        setRecords((prev) => prev.map((r) => (map.has(r.id) ? (map.get(r.id) as RevenueRecord) : r)))
      }
      setMessage(`${label} applied to ${json.updated?.length || 0} record(s).`)
    } catch (e: any) {
      setError(e?.message || 'Bulk update failed')
    } finally {
      setBusy(false)
    }
  }

  async function seedRecords() {
    setBusy(true)
    setError('')
    try {
      const res = await fetch(`${API}/seed`, { method: 'POST' })
      const json = await parseJson(res)
      if (!json.ok) throw new Error(json.error || 'Seed failed')
      setMessage(`Seed complete. Inserted ${json.inserted || 0} command records.`)
      await loadAll()
    } catch (e: any) {
      setError(e?.message || 'Seed failed')
    } finally {
      setBusy(false)
    }
  }

  function startEdit(record: RevenueRecord) {
    setEditing(record)
    setDraft({
      title: record.title || '',
      description: record.description || '',
      owner_name: record.owner_name || 'Amina',
      record_type: record.record_type || 'command_record',
      status: (record.status as Status) || 'Open',
      priority: (record.priority as Priority) || 'medium',
      risk_level: (record.risk_level as RiskLevel) || 'low',
      value_mad: String(record.value_mad || 0),
      due_date: record.due_date || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function saveEdit() {
    if (!editing) return
    await updateRecord(editing.id, { ...draft, value_mad: Number(draft.value_mad || 0) }, `Edited ${draft.title}`)
    setEditing(null)
    setDraft(emptyDraft)
  }

  const quickActions = [
    { label: 'Create Task', kind: 'task', tone: 'primary' as const },
    { label: 'Create Prospect', kind: 'prospect', tone: 'success' as const },
    { label: 'Create Follow-up', kind: 'follow_up', tone: 'default' as const },
    { label: 'Schedule Appointment', kind: 'appointment', tone: 'default' as const },
    { label: 'Open Risk', kind: 'risk', tone: 'danger' as const },
  ]

  return (
    <main className="min-h-screen bg-[#070b16] px-4 py-6 text-white md:px-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-gradient-to-br from-slate-950 via-indigo-950/70 to-slate-950 p-6 shadow-2xl shadow-cyan-950/40 md:p-8">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute -bottom-24 left-24 h-80 w-80 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.32em] text-cyan-100">
              <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1">Revenue Command HQ</span>
              <span className="rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1">Execution-first</span>
              <span className="rounded-full border border-fuchsia-300/30 bg-fuchsia-400/10 px-3 py-1">V10 APIs</span>
            </div>
            <h1 className="max-w-5xl text-4xl font-black tracking-tight text-white md:text-6xl">Revenue Command Center</h1>
            <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-100">Main operating page for revenue execution: create work, control owners, move priorities, escalate risk, close follow-ups, and audit what happened without decorative buttons.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={() => createRecord()} disabled={busy} tone="primary">+ Create Command Record</Button>
              <Button onClick={seedRecords} disabled={busy}>Seed Records</Button>
              <Button onClick={loadAll} disabled={busy}>Refresh</Button>
              <Button onClick={() => bulkUpdate({ status: 'Done' }, 'Bulk complete')} disabled={busy || !selected.length} tone="success">Bulk Complete</Button>
              <Button onClick={() => bulkUpdate({ status: 'Archived' }, 'Bulk archive')} disabled={busy || !selected.length}>Bulk Archive</Button>
              <Button onClick={() => runAction('assign_am ina'.replace(' ', ''), selected)} disabled={busy || !selected.length}>Assign Amina</Button>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
            <div className="text-xs font-bold uppercase tracking-[0.28em] text-slate-300">Command state</div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-950/60 p-4"><div className="text-xs text-slate-400">Active</div><div className="text-3xl font-black text-white">{stats.active}</div></div>
              <div className="rounded-2xl bg-slate-950/60 p-4"><div className="text-xs text-slate-400">Value</div><div className="text-xl font-black text-white">{formatMad(stats.totalValue)}</div></div>
              <div className="rounded-2xl bg-slate-950/60 p-4"><div className="text-xs text-slate-400">Risk</div><div className="text-3xl font-black text-rose-100">{stats.risk}</div></div>
              <div className="rounded-2xl bg-slate-950/60 p-4"><div className="text-xs text-slate-400">Urgent</div><div className="text-3xl font-black text-orange-100">{stats.urgent}</div></div>
            </div>
          </div>
        </div>
      </section>

      {error ? <div className="mt-5 rounded-2xl border border-rose-300/30 bg-rose-500/15 px-5 py-4 text-rose-50">{error}</div> : null}
      {message ? <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 px-5 py-4 text-emerald-50">{message}</div> : null}

      <section className="mt-6 grid gap-4 md:grid-cols-4 xl:grid-cols-8">
        {[
          ['Open', stats.open], ['In Progress', stats.progress], ['Blocked', stats.blocked], ['Done', stats.done], ['High Risk', stats.risk], ['Urgent', stats.urgent], ['Selected', selected.length], ['Visible', filtered.length]
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/20">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{label}</div>
            <div className="mt-3 text-3xl font-black text-white">{value}</div>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
        <aside className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white">{editing ? 'Edit command record' : 'Create command action'}</h2>
              <p className="mt-1 text-sm text-slate-300">Every form button writes through V10 records API.</p>
            </div>
            {editing ? <Button tone="ghost" onClick={() => { setEditing(null); setDraft(emptyDraft) }}>Cancel</Button> : null}
          </div>
          <div className="mt-5 grid gap-4">
            <Field label="Title"><TextInput value={draft.title} placeholder="CEO prospect follow-up, campaign risk, blocked task..." onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
            <Field label="Execution note"><TextArea value={draft.description} placeholder="What must happen, why it matters, expected output..." onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Owner"><SelectInput value={draft.owner_name} onChange={(e) => setDraft({ ...draft, owner_name: e.target.value })}>{owners.map((x) => <option key={x}>{x}</option>)}</SelectInput></Field>
              <Field label="Type"><SelectInput value={draft.record_type} onChange={(e) => setDraft({ ...draft, record_type: e.target.value })}>{types.map((x) => <option key={x}>{x}</option>)}</SelectInput></Field>
              <Field label="Status"><SelectInput value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Status })}>{statuses.map((x) => <option key={x}>{x}</option>)}</SelectInput></Field>
              <Field label="Priority"><SelectInput value={draft.priority} onChange={(e) => setDraft({ ...draft, priority: e.target.value as Priority })}>{priorities.map((x) => <option key={x}>{x}</option>)}</SelectInput></Field>
              <Field label="Risk"><SelectInput value={draft.risk_level} onChange={(e) => setDraft({ ...draft, risk_level: e.target.value as RiskLevel })}>{risks.map((x) => <option key={x}>{x}</option>)}</SelectInput></Field>
              <Field label="Value"><TextInput type="number" value={draft.value_mad} onChange={(e) => setDraft({ ...draft, value_mad: e.target.value })} /></Field>
              <div className="col-span-2"><Field label="Due date"><TextInput type="date" value={draft.due_date} onChange={(e) => setDraft({ ...draft, due_date: e.target.value })} /></Field></div>
            </div>
            {editing ? <Button tone="success" disabled={busy} onClick={saveEdit}>Save Edit</Button> : <Button tone="primary" disabled={busy} onClick={() => createRecord()}>Create Record</Button>}
            {!editing ? <div className="grid grid-cols-2 gap-2">{quickActions.map((a) => <Button key={a.kind} tone={a.tone} disabled={busy} onClick={() => createRecord(a.kind)}>{a.label}</Button>)}</div> : null}
          </div>
        </aside>

        <section className="grid gap-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/20">
            <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
              <TextInput value={query} placeholder="Search record, owner, type, priority, risk..." onChange={(e) => setQuery(e.target.value)} />
              <SelectInput value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">All statuses</option>{statuses.map((x) => <option key={x}>{x}</option>)}</SelectInput>
              <SelectInput value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option value="all">All types</option>{types.map((x) => <option key={x}>{x}</option>)}</SelectInput>
              <Button onClick={selectAllVisible}>{selected.length === filtered.length && filtered.length ? 'Clear' : 'Select Visible'}</Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button disabled={!selected.length || busy} onClick={() => bulkUpdate({ owner_name: 'Amina' }, 'Assigned to Amina')}>Assign Amina</Button>
              <Button disabled={!selected.length || busy} onClick={() => bulkUpdate({ priority: 'urgent', risk_level: 'high' }, 'Escalated priority')} tone="danger">Escalate</Button>
              <Button disabled={!selected.length || busy} onClick={() => bulkUpdate({ status: 'In progress' }, 'Started')}>Start</Button>
              <Button disabled={!selected.length || busy} onClick={() => bulkUpdate({ status: 'Blocked', risk_level: 'high' }, 'Blocked')}>Block</Button>
              <Button disabled={!selected.length || busy} onClick={() => bulkUpdate({ status: 'Done' }, 'Completed')} tone="success">Complete</Button>
              <Button disabled={!selected.length || busy} onClick={() => bulkUpdate({ status: 'Archived' }, 'Archived')}>Archive</Button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            {Object.entries(grouped).map(([lane, laneRecords]) => (
              <div key={lane} className="rounded-[1.5rem] border border-white/10 bg-slate-900/55 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">{lane}</h3>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">{laneRecords.length}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${Math.min(100, laneRecords.length * 16)}%` }} /></div>
              </div>
            ))}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/20">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">Live command records</h2>
                <p className="mt-1 text-sm text-slate-300">Visible controls update database rows immediately.</p>
              </div>
              <div className="text-sm text-slate-300">{filtered.length} visible</div>
            </div>

            <div className="mt-5 grid gap-4">
              {filtered.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/15 bg-slate-950/50 p-8 text-center text-slate-300">
                  No records found. Create or seed command records to begin.
                </div>
              ) : filtered.map((record) => (
                <article key={record.id} className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 transition hover:border-cyan-300/30">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex gap-4">
                      <input type="checkbox" checked={selected.includes(record.id)} onChange={() => toggle(record.id)} className="mt-1 h-5 w-5 accent-cyan-400" />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-black text-white">{record.title}</h3>
                          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusClass(String(record.status))}`}>{safeText(record.status)}</span>
                          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${priorityClass(String(record.priority))}`}>{safeText(record.priority)}</span>
                          <span className={`rounded-full border px-3 py-1 text-xs font-bold ${riskClass(String(record.risk_level))}`}>{safeText(record.risk_level)}</span>
                        </div>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{safeText(record.description, 'No execution note yet.')}</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                          <span className="rounded-full bg-white/10 px-3 py-1">{safeText(record.record_type)}</span>
                          <span className="rounded-full bg-white/10 px-3 py-1">owner {safeText(record.owner_name)}</span>
                          <span className="rounded-full bg-white/10 px-3 py-1">{formatMad(record.value_mad)}</span>
                          <span className="rounded-full bg-white/10 px-3 py-1">due {safeText(record.due_date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[520px]">
                      <Button onClick={() => updateRecord(record.id, { status: 'In progress' }, 'Record started')} disabled={busy}>Start</Button>
                      <Button onClick={() => updateRecord(record.id, { status: 'Done' }, 'Record completed')} disabled={busy} tone="success">Complete</Button>
                      <Button onClick={() => updateRecord(record.id, { status: 'Blocked', risk_level: 'high' }, 'Record escalated')} disabled={busy} tone="danger">Escalate</Button>
                      <Button onClick={() => updateRecord(record.id, { owner_name: 'Amina' }, 'Assigned to Amina')} disabled={busy}>Assign</Button>
                      <Button onClick={() => startEdit(record)} disabled={busy}>Edit</Button>
                      <Button onClick={() => updateRecord(record.id, { status: 'Archived' }, 'Record archived')} disabled={busy}>Archive</Button>
                      <Button onClick={() => deleteRecord(record.id)} disabled={busy} tone="danger">Delete</Button>
                      <a href={`/revenue-command-center/tasks/${record.id}`} className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-white/15">Open</a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 xl:col-span-2">
          <h2 className="text-2xl font-black text-white">Priority and risk command panels</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-rose-300/20 bg-rose-500/10 p-5">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-rose-100">Escalation queue</div>
              <div className="mt-4 grid gap-3">{records.filter((r) => r.status === 'Blocked' || ['high', 'critical'].includes(String(r.risk_level))).slice(0, 4).map((r) => <button key={r.id} onClick={() => toggle(r.id)} className="rounded-2xl bg-slate-950/60 p-3 text-left text-sm text-white hover:bg-slate-900">{r.title}</button>)}</div>
            </div>
            <div className="rounded-3xl border border-cyan-300/20 bg-cyan-500/10 p-5">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">Today follow-ups</div>
              <div className="mt-4 grid gap-3">{records.filter((r) => String(r.record_type).includes('follow') || String(r.record_type).includes('appointment')).slice(0, 4).map((r) => <button key={r.id} onClick={() => updateRecord(r.id, { status: 'In progress' }, 'Follow-up opened')} className="rounded-2xl bg-slate-950/60 p-3 text-left text-sm text-white hover:bg-slate-900">{r.title}</button>)}</div>
            </div>
            <div className="rounded-3xl border border-emerald-300/20 bg-emerald-500/10 p-5">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">Value protection</div>
              <div className="mt-4 grid gap-3">{records.slice().sort((a,b)=>Number(b.value_mad||0)-Number(a.value_mad||0)).slice(0, 4).map((r) => <button key={r.id} onClick={() => updateRecord(r.id, { priority: 'urgent' }, 'Value record prioritized')} className="rounded-2xl bg-slate-950/60 p-3 text-left text-sm text-white hover:bg-slate-900"><span className="block font-bold">{formatMad(r.value_mad)}</span>{r.title}</button>)}</div>
            </div>
          </div>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5">
          <h2 className="text-2xl font-black text-white">Audit stream</h2>
          <div className="mt-5 grid max-h-[420px] gap-3 overflow-auto pr-1">
            {logs.length === 0 ? <div className="text-sm text-slate-400">No audit logs yet.</div> : logs.slice(0, 12).map((log, i) => (
              <div key={log.id || i} className="rounded-2xl border border-white/10 bg-slate-950/60 p-3">
                <div className="text-sm font-bold text-white">{safeText(log.action_key, 'action')}</div>
                <div className="mt-1 text-xs text-slate-400">{safeText(log.status)} • selected {log.selected_count || 0}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

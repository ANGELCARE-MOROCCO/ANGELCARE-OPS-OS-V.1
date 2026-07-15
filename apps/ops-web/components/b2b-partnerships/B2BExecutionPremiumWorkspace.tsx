'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from './B2BExecutionPremiumWorkspace.module.css'

type AnyRow = Record<string, any>
type ViewMode = 'command' | 'today' | 'pipeline' | 'risks' | 'board'
type ModalMode = 'create' | 'view' | 'edit' | null

function normalizeArray(payload: any): AnyRow[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.rows)) return payload.rows
  if (Array.isArray(payload?.tasks)) return payload.tasks
  if (Array.isArray(payload?.meetings)) return payload.meetings
  if (Array.isArray(payload?.prospects)) return payload.prospects
  return []
}

function normalizeDate(value: any) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function isToday(value: any) {
  const d = normalizeDate(value)
  if (!d) return false
  return startOfDay(d).getTime() === startOfDay(new Date()).getTime()
}

function isOverdue(value: any) {
  const d = normalizeDate(value)
  if (!d) return false
  return d < startOfDay(new Date())
}

function formatDate(value: any) {
  const d = normalizeDate(value)
  if (!d) return 'Date pending'
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).format(d)
}

function formatTime(value: any) {
  const d = normalizeDate(value)
  if (!d) return 'Time pending'
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(d)
}

function recordTitle(row: AnyRow) {
  return row.title || row.name || row.subject || row.prospect_name || row.company_name || 'Execution record'
}

function recordStatus(row: AnyRow) {
  return row.status || row.lifecycle || row.stage || 'active'
}

function recordOwner(row: AnyRow) {
  return row.owner_name || row.assignee_name || row.created_by_name || row.user_name || 'Owner pending'
}

function recordDue(row: AnyRow) {
  return row.due_at || row.due_date || row.scheduled_at || row.start_at || row.next_follow_up_at || row.created_at
}

function recordType(row: AnyRow) {
  return row.__type || row.type || 'execution'
}

async function fetchJson(path: string) {
  const response = await fetch(path, { cache: 'no-store' })
  const text = await response.text()
  let payload: any = null

  try {
    payload = text ? JSON.parse(text) : null
  } catch {
    throw new Error(`Non-JSON response from ${path}`)
  }

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.error || `Request failed: ${path}`)
  }

  return payload
}

const LANES = [
  { key: 'urgent', label: 'Urgent', icon: '🚨' },
  { key: 'today', label: 'Today', icon: '📅' },
  { key: 'active', label: 'Active', icon: '⚡' },
  { key: 'waiting', label: 'Waiting', icon: '⏳' },
  { key: 'completed', label: 'Completed', icon: '✅' },
]

export default function B2BExecutionPremiumWorkspace() {
  const [view, setView] = useState<ViewMode>('command')
  const [tasks, setTasks] = useState<AnyRow[]>([])
  const [meetings, setMeetings] = useState<AnyRow[]>([])
  const [prospects, setProspects] = useState<AnyRow[]>([])
  const [campaigns, setCampaigns] = useState<AnyRow[]>([])
  const [sequences, setSequences] = useState<AnyRow[]>([])
  const [selectedRecord, setSelectedRecord] = useState<AnyRow | null>(null)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [form, setForm] = useState<AnyRow>({
    title: '',
    type: 'task',
    status: 'active',
    owner_name: '',
    due_at: new Date().toISOString().slice(0, 16),
    objective: '',
    next_action: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')

    try {
      const results = await Promise.allSettled([
        fetchJson('/api/b2b-partnerships/tasks'),
        fetchJson('/api/b2b-partnerships/meetings'),
        fetchJson('/api/b2b-partnerships/prospects?limit=180'),
        fetchJson('/api/b2b-partnerships/campaigns'),
        fetchJson('/api/b2b-partnerships/sequences'),
      ])

      const [tasksPayload, meetingsPayload, prospectsPayload, campaignsPayload, sequencesPayload] = results

      if (tasksPayload.status === 'fulfilled') setTasks(normalizeArray(tasksPayload.value).map((row) => ({ ...row, __type: 'task' })))
      if (meetingsPayload.status === 'fulfilled') setMeetings(normalizeArray(meetingsPayload.value).map((row) => ({ ...row, __type: 'meeting' })))
      if (prospectsPayload.status === 'fulfilled') setProspects(normalizeArray(prospectsPayload.value).map((row) => ({ ...row, __type: 'prospect' })))
      if (campaignsPayload.status === 'fulfilled') setCampaigns(normalizeArray(campaignsPayload.value).map((row) => ({ ...row, __type: 'campaign' })))
      if (sequencesPayload.status === 'fulfilled') setSequences(normalizeArray(sequencesPayload.value).map((row) => ({ ...row, __type: 'sequence' })))

      const failures = results
        .filter((item) => item.status === 'rejected')
        .map((item: any) => item.reason?.message)
        .filter(Boolean)

      if (failures.length) setError(failures.slice(0, 3).join(' · '))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sync execution workspace.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const executionRecords = useMemo(() => {
    const prospectActions: AnyRow[] = prospects
      .filter((row: AnyRow) => row.next_follow_up_at || row.next_action || row.status || row.composite_score)
      .map((row: AnyRow): AnyRow => ({
        ...row,
        __type: 'prospect',
        title: row.name || row.prospect_name || row.company_name,
        due_at: row.next_follow_up_at || row.updated_at || row.created_at,
      }))

    const allRecords: AnyRow[] = [...tasks, ...meetings, ...campaigns, ...sequences, ...prospectActions]

    return allRecords.sort((a, b) => {
      const da = normalizeDate(recordDue(a))?.getTime() || 0
      const db = normalizeDate(recordDue(b))?.getTime() || 0
      return da - db
    })
  }, [tasks, meetings, prospects, campaigns, sequences])

  const todayRecords = executionRecords.filter((row) => isToday(recordDue(row)))
  const overdueRecords = executionRecords.filter((row) => isOverdue(recordDue(row)) && !String(recordStatus(row)).toLowerCase().includes('done') && !String(recordStatus(row)).toLowerCase().includes('completed'))
  const completedRecords = executionRecords.filter((row) => String(recordStatus(row)).toLowerCase().includes('done') || String(recordStatus(row)).toLowerCase().includes('completed'))
  const activeRecords = executionRecords.filter((row) => !completedRecords.includes(row))
  const highScoreProspects = prospects.filter((row) => Number(row.composite_score || 0) >= 70)

  const metrics = [
    { label: 'Execution records', value: executionRecords.length, helper: 'Tasks, meetings, campaigns and prospects', icon: '🧭' },
    { label: 'Today', value: todayRecords.length, helper: 'Due or scheduled today', icon: '📅' },
    { label: 'Overdue', value: overdueRecords.length, helper: 'Needs immediate escalation', icon: '🚨' },
    { label: 'Active', value: activeRecords.length, helper: 'Open production work', icon: '⚡' },
    { label: 'High score prospects', value: highScoreProspects.length, helper: 'Commercial priority radar', icon: '🎯' },
    { label: 'Completed', value: completedRecords.length, helper: 'Closed execution items', icon: '✅' },
  ]

  const visibleRecords =
    view === 'today' ? todayRecords :
    view === 'risks' ? overdueRecords :
    view === 'pipeline' ? [...campaigns, ...prospects] :
    executionRecords

  function openCreate() {
    setSelectedRecord(null)
    setForm({
      title: '',
      type: 'task',
      status: 'active',
      owner_name: '',
      due_at: new Date().toISOString().slice(0, 16),
      objective: '',
      next_action: '',
      notes: '',
    })
    setModalMode('create')
  }

  function openView(row: AnyRow) {
    setSelectedRecord(row)
    setForm({
      title: recordTitle(row),
      type: recordType(row),
      status: recordStatus(row),
      owner_name: recordOwner(row),
      due_at: normalizeDate(recordDue(row))?.toISOString().slice(0, 16) || '',
      objective: row.objective || row.description || row.notes || '',
      next_action: row.next_action || row.follow_up_notes || row.next_step || '',
      notes: row.notes || row.summary || '',
    })
    setModalMode('view')
  }

  function openEdit() {
    if (!selectedRecord) return
    setModalMode('edit')
  }

  async function mutateRecord(method: 'POST' | 'PATCH' | 'DELETE') {
    const type = String(form.type || selectedRecord?.__type || 'task')
    const id = selectedRecord?.id
    const normalizedType = type === 'meeting' ? 'meetings' : type === 'campaign' ? 'campaigns' : type === 'prospect' ? 'prospects' : 'tasks'
    const basePath = `/api/b2b-partnerships/${normalizedType}`
    const path = method === 'POST' ? basePath : `${basePath}/${id}`

    const payload = {
      ...form,
      due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
      title: form.title,
      name: form.title,
    }

    const response = await fetch(path, {
      method,
      headers: method === 'DELETE' ? undefined : { 'Content-Type': 'application/json' },
      body: method === 'DELETE' ? undefined : JSON.stringify(payload),
    })

    const text = await response.text()
    let json: any = null
    try { json = text ? JSON.parse(text) : null } catch { json = null }

    if (!response.ok || json?.ok === false) {
      throw new Error(json?.error || `Request failed: ${method} ${path}`)
    }
  }

  async function saveRecord() {
    setLoading(true)
    setError('')

    try {
      if (modalMode === 'create') await mutateRecord('POST')
      if (modalMode === 'edit' && selectedRecord?.id) await mutateRecord('PATCH')
      setModalMode(null)
      setSelectedRecord(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save execution record.')
    } finally {
      setLoading(false)
    }
  }

  async function deleteRecord() {
    if (!selectedRecord?.id) return
    if (!window.confirm('Delete this execution record?')) return

    setLoading(true)
    setError('')

    try {
      await mutateRecord('DELETE')
      setModalMode(null)
      setSelectedRecord(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to delete execution record.')
    } finally {
      setLoading(false)
    }
  }

  function laneRecords(lane: string) {
    if (lane === 'urgent') return overdueRecords
    if (lane === 'today') return todayRecords
    if (lane === 'completed') return completedRecords
    if (lane === 'waiting') return executionRecords.filter((row) => String(recordStatus(row)).toLowerCase().includes('waiting') || String(recordStatus(row)).toLowerCase().includes('pending'))
    return activeRecords
  }

  return (
    <main className={styles.workspace}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>B2B execution command center</span>
          <h1>Production execution, risks & follow-up cockpit</h1>
          <p>Unifiez tâches, rendez-vous, campagnes, séquences, prospects prioritaires et risques opérationnels dans un workspace premium, cliquable et actionnable.</p>
        </div>

        <aside className={styles.heroCommand}>
          <span>Execution sync</span>
          <strong>{loading ? 'Syncing…' : 'Live workspace'}</strong>
          <button type="button" onClick={load} disabled={loading}>{loading ? 'Syncing…' : 'Sync live data'}</button>
          <button type="button" className={styles.createButton} onClick={openCreate}>+ Create action</button>
        </aside>
      </section>

      {error && (
        <section className={styles.warning}>
          <strong>Execution sync warning</strong>
          <p>{error}</p>
        </section>
      )}

      <section className={styles.metrics}>
        {metrics.map((metric) => (
          <article key={metric.label}>
            <div>{metric.icon}</div>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <p>{metric.helper}</p>
          </article>
        ))}
      </section>

      <section className={styles.toolbar}>
        <div className={styles.viewSwitch}>
          {(['command', 'today', 'pipeline', 'risks', 'board'] as ViewMode[]).map((item) => (
            <button key={item} type="button" className={view === item ? styles.activeView : ''} onClick={() => setView(item)}>
              {item === 'command' ? 'Command' : item === 'today' ? 'Today' : item === 'pipeline' ? 'Pipeline' : item === 'risks' ? 'Risks' : 'Board'}
            </button>
          ))}
        </div>

        <div className={styles.quickActions}>
          <button type="button" onClick={openCreate}>New action</button>
          <button type="button" onClick={() => setView('risks')}>Show risks</button>
          <button type="button" onClick={() => setView('today')}>Today only</button>
        </div>
      </section>

      {view === 'board' && (
        <section className={styles.board}>
          {LANES.map((lane) => {
            const records = laneRecords(lane.key)
            return (
              <article key={lane.key} className={styles.boardLane}>
                <header>
                  <div>{lane.icon}</div>
                  <span>{lane.label}</span>
                  <strong>{records.length}</strong>
                </header>

                <div>
                  {records.slice(0, 12).map((record) => (
                    <button key={`${record.__type}-${record.id || recordTitle(record)}`} type="button" onClick={() => openView(record)}>
                      <strong>{recordTitle(record)}</strong>
                      <span>{recordType(record)} · {formatDate(recordDue(record))}</span>
                    </button>
                  ))}
                  {!records.length && <p>No record in this lane.</p>}
                </div>
              </article>
            )
          })}
        </section>
      )}

      <section className={styles.executionGrid}>
        <div className={styles.recordsPanel}>
          <div className={styles.panelHeader}>
            <div>
              <span>Execution command board</span>
              <h2>{view === 'today' ? 'Today execution' : view === 'risks' ? 'Risk & overdue records' : view === 'pipeline' ? 'Pipeline execution' : 'All execution records'}</h2>
              <p>Every card is clickable, viewable, editable and connected to production actions when the API route exists.</p>
            </div>
          </div>

          <div className={styles.recordCards}>
            {(view === 'board' ? executionRecords : visibleRecords).map((record) => {
              const overdue = isOverdue(recordDue(record)) && !String(recordStatus(record)).toLowerCase().includes('done')
              return (
                <article key={`${record.__type}-${record.id || recordTitle(record)}`} className={`${styles.recordCard} ${overdue ? styles.riskCard : ''}`} onClick={() => openView(record)}>
                  <div className={styles.recordTop}>
                    <div className={styles.recordIcon}>{recordType(record) === 'meeting' ? '🤝' : recordType(record) === 'prospect' ? '🎯' : recordType(record) === 'campaign' ? '📣' : recordType(record) === 'sequence' ? '🧭' : '✅'}</div>
                    <span>{recordStatus(record)}</span>
                  </div>

                  <h3>{recordTitle(record)}</h3>
                  <p>{record.prospect_name || record.company_name || record.segment || record.sector || 'Execution item'}</p>

                  <div className={styles.recordMeta}>
                    <span>🧩 {recordType(record)}</span>
                    <span>📅 {formatDate(recordDue(record))}</span>
                    <span>🕒 {formatTime(recordDue(record))}</span>
                    <span>👤 {recordOwner(record)}</span>
                  </div>

                  <div className={styles.recordFooter}>
                    <button type="button" onClick={(event) => { event.stopPropagation(); openView(record) }}>Open record</button>
                    <strong>{overdue ? 'Overdue risk' : record.next_action || 'Production ready'}</strong>
                  </div>
                </article>
              )
            })}

            {!visibleRecords.length && view !== 'board' && (
              <article className={styles.emptyState}>
                <div>📭</div>
                <h3>No execution records in this view</h3>
                <p>Sync data or create a new action to activate this production cockpit.</p>
              </article>
            )}
          </div>
        </div>

        <aside className={styles.commandPanel}>
          <div className={styles.panelHeader}>
            <div>
              <span>Manager command protocol</span>
              <h2>Production readiness</h2>
              <p>Execution is only real when ownership, next action, risk and reporting are clear.</p>
            </div>
          </div>

          <div className={styles.commandList}>
            <article><div>🎯</div><h3>Priority first</h3><p>Start with overdue, high-score prospects, proposal deadlines and active campaigns.</p></article>
            <article><div>🧭</div><h3>One next action</h3><p>Every record must have one clear next action and owner.</p></article>
            <article><div>🚨</div><h3>Risk escalation</h3><p>Blocked, late or unowned records must be visible to managers immediately.</p></article>
            <article><div>📊</div><h3>KPI ready</h3><p>Completed, delayed, converted and blocked execution should feed weekly reports.</p></article>
          </div>
        </aside>
      </section>

      {modalMode && (
        <div className={styles.modalBackdrop}>
          <section className={styles.executionModal}>
            <div className={styles.modalHeader}>
              <div>
                <span>{modalMode === 'create' ? 'Create execution action' : modalMode === 'edit' ? 'Edit execution action' : 'Execution command record'}</span>
                <h2>{modalMode === 'create' ? 'New production action' : form.title || 'Execution record'}</h2>
                <p>{form.type || selectedRecord?.__type || 'task'} · {form.status || 'active'}</p>
              </div>
              <button type="button" onClick={() => { setModalMode(null); setSelectedRecord(null) }}>×</button>
            </div>

            {modalMode === 'view' && selectedRecord ? (
              <>
                <div className={styles.modalMetrics}>
                  <article><span>Type</span><strong>{recordType(selectedRecord)}</strong></article>
                  <article><span>Status</span><strong>{recordStatus(selectedRecord)}</strong></article>
                  <article><span>Due</span><strong>{formatDate(recordDue(selectedRecord))} · {formatTime(recordDue(selectedRecord))}</strong></article>
                  <article><span>Owner</span><strong>{recordOwner(selectedRecord)}</strong></article>
                </div>

                <div className={styles.modalGrid}>
                  <article><h3>Objective</h3><p>{selectedRecord.objective || selectedRecord.description || selectedRecord.notes || 'No objective captured yet.'}</p></article>
                  <article><h3>Next action</h3><p>{selectedRecord.next_action || selectedRecord.next_step || selectedRecord.follow_up_notes || 'Define next action before closing this record.'}</p></article>
                  <article><h3>Production checklist</h3><p>Confirm owner, deadline, risk, decision maker, next step and reporting status.</p></article>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.secondaryButton} onClick={() => { setModalMode(null); setSelectedRecord(null) }}>Close</button>
                  <button type="button" onClick={openEdit}>Edit</button>
                  <button type="button" className={styles.deleteButton} onClick={deleteRecord}>Delete</button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.formGrid}>
                  <label>
                    Action title
                    <input value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Call, follow-up, proposal, manager escalation..." />
                  </label>

                  <label>
                    Type
                    <select value={form.type || 'task'} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      <option value="task">Task</option>
                      <option value="meeting">Meeting</option>
                      <option value="prospect">Prospect action</option>
                      <option value="campaign">Campaign</option>
                    </select>
                  </label>

                  <label>
                    Status
                    <select value={form.status || 'active'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="todo">Todo</option>
                      <option value="in_progress">In progress</option>
                      <option value="waiting">Waiting</option>
                      <option value="blocked">Blocked</option>
                      <option value="completed">Completed</option>
                    </select>
                  </label>

                  <label>
                    Owner
                    <input value={form.owner_name || ''} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} placeholder="Owner / assignee" />
                  </label>

                  <label className={styles.fullField}>
                    Due date & time
                    <input type="datetime-local" value={form.due_at || ''} onChange={(e) => setForm({ ...form, due_at: e.target.value })} />
                  </label>

                  <label className={styles.fullField}>
                    Objective
                    <textarea value={form.objective || ''} onChange={(e) => setForm({ ...form, objective: e.target.value })} placeholder="What must be achieved?" />
                  </label>

                  <label className={styles.fullField}>
                    Next action
                    <textarea value={form.next_action || ''} onChange={(e) => setForm({ ...form, next_action: e.target.value })} placeholder="What happens next?" />
                  </label>

                  <label className={styles.fullField}>
                    Notes
                    <textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Internal notes, blockers, escalation..." />
                  </label>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.secondaryButton} onClick={() => { setModalMode(null); setSelectedRecord(null) }}>Cancel</button>
                  <button type="button" disabled={loading} onClick={saveRecord}>{loading ? 'Saving…' : modalMode === 'create' ? 'Create action' : 'Save changes'}</button>
                  {modalMode === 'edit' && selectedRecord?.id && <button type="button" className={styles.deleteButton} onClick={deleteRecord}>Delete</button>}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  )
}

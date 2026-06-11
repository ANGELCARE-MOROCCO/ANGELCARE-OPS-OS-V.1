'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import styles from './B2BMeetingsTasksExecutionOS.module.css'

type Workspace = 'meetings' | 'tasks' | 'execution'

type Prospect = {
  id: string
  name: string
  sector?: string | null
  city?: string | null
  status?: string | null
  priority_score?: string | null
  assigned_owner_id?: string | null
  decision_maker_name?: string | null
  decision_maker_role?: string | null
  decision_maker_email?: string | null
  decision_maker_phone?: string | null
  potential_service_fit?: string | null
  pain_points?: string | null
  opportunity_description?: string | null
  next_action?: string | null
  next_follow_up_at?: string | null
}

type Meeting = {
  id: string
  prospect_id: string
  prospect?: { name?: string | null; city?: string | null; sector?: string | null } | null
  meeting_type?: string | null
  status?: string | null
  scheduled_at?: string | null
  location?: string | null
  video_link?: string | null
  agenda?: string | null
  notes?: string | null
  needs_identified?: string | null
  objections?: string | null
  decision_process?: string | null
  budget_discussion?: string | null
  next_step?: string | null
  follow_up_at?: string | null
  created_at?: string | null
}

type Task = {
  id: string
  title: string
  task_type?: string | null
  prospect_id?: string | null
  prospect?: { name?: string | null; city?: string | null; sector?: string | null } | null
  assigned_to?: string | null
  priority?: string | null
  due_date?: string | null
  status?: string | null
  description?: string | null
  completed_at?: string | null
  created_at?: string | null
}

type ModalState =
  | { type: null }
  | { type: 'scheduleMeeting'; prospect?: Prospect | null }
  | { type: 'completeMeeting'; meeting: Meeting }
  | { type: 'createTask'; prospect?: Prospect | null }
  | { type: 'completeTask'; task: Task }
  | { type: 'dailySummary' }

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string }

const MEETING_TYPES = [
  'Discovery meeting',
  'Partnership presentation',
  'Proposal review',
  'Negotiation meeting',
  'Pilot preparation',
  'Account review',
]

const TASK_TYPES = [
  'Research prospect',
  'Find decision maker',
  'Send first email',
  'Make call',
  'Send WhatsApp',
  'Connect on LinkedIn',
  'Book meeting',
  'Prepare proposal',
  'Send proposal',
  'Follow up proposal',
  'Update CRM',
  'Prepare report',
  'Visit prospect',
  'Internal validation',
]

const DAILY_START = [
  'Review overdue follow-ups and blocked tasks',
  'Prioritize Priority A hotel and pediatric clinic prospects',
  'Prepare call list and decision-maker questions',
  'Open outreach templates and personalize messages',
  'Confirm today\'s meetings and required materials',
]

const DAILY_END = [
  'Update all CRM statuses and owners',
  'Log all calls, outreach and meeting notes',
  'Set next follow-up dates for every warm prospect',
  'Complete tasks or mark blockers with reasons',
  'Prepare manager summary and support needed',
]

const HOTEL_DISCOVERY = [
  'Do you currently receive many families with children?',
  'Do you offer babysitting, kids club or children activities?',
  'What are the main challenges with family guests?',
  'Do you organize family events, weddings or private events?',
  'Who validates a family-experience partnership internally?',
]

const CLINIC_DISCOVERY = [
  'Do parents often ask for support after consultation?',
  'Do you work with child development specialists?',
  'Do you organize workshops or parent education sessions?',
  'Would a trusted family-support partner be useful?',
  'Who validates external partnerships in the clinic?',
]

function nowIsoLocal() {
  const date = new Date()
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

function inThreeDaysIsoLocal() {
  const date = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function isOverdue(value?: string | null) {
  if (!value) return false
  return new Date(value).getTime() < Date.now()
}

function isToday(value?: string | null) {
  if (!value) return false
  const d = new Date(value)
  const n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
}

function prospectName(prospects: Prospect[], id?: string | null) {
  return prospects.find((p) => p.id === id)?.name ?? 'Prospect non défini'
}

async function readJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' })
  const contentType = res.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    const text = await res.text()
    const preview = text.slice(0, 140).replace(/\s+/g, ' ')
    throw new Error(`Non-JSON response from ${url} · HTTP ${res.status} · ${preview}`)
  }

  const payload = await res.json()

  if (!res.ok || payload?.ok === false) {
    throw new Error(payload?.error || `Request failed: ${url}`)
  }

  return payload.data as T
}


async function sendJson<T>(url: string, method: 'POST' | 'PATCH', body: Record<string, unknown>): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = (await res.json()) as ApiResult<T>
  if (!json.ok) throw new Error(json.error || 'Request failed')
  return json.data
}

export default function B2BMeetingsTasksExecutionOS({ initialWorkspace = 'meetings' }: { initialWorkspace?: Workspace }) {
  const [workspace, setWorkspace] = useState<Workspace>(initialWorkspace)
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState<ModalState>({ type: null })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [target, setTarget] = useState({ prospects: 50, outreach: 80, calls: 40, meetings: 15 })

  async function load() {
    try {
      setError(null)
      const [p, m, t] = await Promise.all([
        readJson<Prospect[]>('/api/b2b-partnerships/prospects'),
        readJson<Meeting[]>('/api/b2b-partnerships/meetings'),
        readJson<Task[]>('/api/b2b-partnerships/tasks'),
      ])
      setProspects(p)
      setMeetings(m)
      setTasks(t)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load execution workspace.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setWorkspace(initialWorkspace)
  }, [initialWorkspace])

  useEffect(() => {
    load()
    const timer = window.setInterval(load, 30000)
    return () => window.clearInterval(timer)
  }, [])

  function notify(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(null), 3200)
  }

  const filteredProspects = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return prospects
    return prospects.filter((p) => [p.name, p.city, p.sector, p.status, p.decision_maker_name].join(' ').toLowerCase().includes(q))
  }, [query, prospects])

  const upcomingMeetings = useMemo(
    () => meetings.filter((m) => ['Scheduled', 'Rescheduled'].includes(String(m.status || ''))).sort((a, b) => new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime()),
    [meetings]
  )
  const completedMeetings = useMemo(() => meetings.filter((m) => m.status === 'Completed'), [meetings])
  const followUpRequired = useMemo(() => meetings.filter((m) => m.follow_up_at && isOverdue(m.follow_up_at) && m.status !== 'Cancelled'), [meetings])

  const todayTasks = useMemo(() => tasks.filter((t) => t.status !== 'Done' && isToday(t.due_date)), [tasks])
  const overdueTasks = useMemo(() => tasks.filter((t) => t.status !== 'Done' && t.status !== 'Cancelled' && isOverdue(t.due_date)), [tasks])
  const highPriorityTasks = useMemo(() => tasks.filter((t) => ['High', 'Urgent'].includes(String(t.priority || '')) && !['Done', 'Cancelled'].includes(String(t.status || ''))), [tasks])
  const openTasks = useMemo(() => tasks.filter((t) => !['Done', 'Cancelled'].includes(String(t.status || ''))), [tasks])

  const weeklyProgress = useMemo(() => {
    const prospectsAdded = prospects.filter((p) => new Date((p as any).created_at || Date.now()).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length
    const calls = tasks.filter((t) => String(t.task_type || '').toLowerCase().includes('call') && t.status === 'Done').length
    return {
      prospects: Math.min(100, Math.round((prospectsAdded / Math.max(1, target.prospects)) * 100)),
      calls: Math.min(100, Math.round((calls / Math.max(1, target.calls)) * 100)),
      meetings: Math.min(100, Math.round((completedMeetings.length / Math.max(1, target.meetings)) * 100)),
      execution: openTasks.length ? Math.max(0, Math.round(((tasks.length - openTasks.length) / Math.max(1, tasks.length)) * 100)) : 0,
    }
  }, [prospects, tasks, completedMeetings.length, openTasks.length, target])

  async function handleScheduleMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      const form = new FormData(event.currentTarget)
      await sendJson<Meeting>('/api/b2b-partnerships/meetings', 'POST', {
        prospect_id: String(form.get('prospect_id') || ''),
        meeting_type: String(form.get('meeting_type') || 'Discovery meeting'),
        status: 'Scheduled',
        scheduled_at: String(form.get('scheduled_at') || ''),
        location: String(form.get('location') || ''),
        video_link: String(form.get('video_link') || ''),
        agenda: String(form.get('agenda') || ''),
        needs_identified: String(form.get('needs_identified') || ''),
        decision_process: String(form.get('decision_process') || ''),
        budget_discussion: String(form.get('budget_discussion') || ''),
        next_step: String(form.get('next_step') || ''),
        follow_up_at: String(form.get('follow_up_at') || ''),
      })
      setModal({ type: null })
      notify('Réunion planifiée et synchronisée.')
      await load()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to schedule meeting.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCompleteMeeting(event: FormEvent<HTMLFormElement>, meeting: Meeting) {
    event.preventDefault()
    setSaving(true)
    try {
      const form = new FormData(event.currentTarget)
      await sendJson<Meeting>('/api/b2b-partnerships/meetings', 'PATCH', {
        id: meeting.id,
        status: String(form.get('status') || 'Completed'),
        notes: String(form.get('notes') || ''),
        needs_identified: String(form.get('needs_identified') || ''),
        objections: String(form.get('objections') || ''),
        decision_process: String(form.get('decision_process') || ''),
        budget_discussion: String(form.get('budget_discussion') || ''),
        next_step: String(form.get('next_step') || ''),
        follow_up_at: String(form.get('follow_up_at') || ''),
      })
      setModal({ type: null })
      notify('Réunion clôturée avec prochaines actions.')
      await load()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to complete meeting.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    try {
      const form = new FormData(event.currentTarget)
      await sendJson<Task>('/api/b2b-partnerships/tasks', 'POST', {
        title: String(form.get('title') || ''),
        task_type: String(form.get('task_type') || ''),
        prospect_id: String(form.get('prospect_id') || '') || null,
        priority: String(form.get('priority') || 'Medium'),
        status: 'To Do',
        due_date: String(form.get('due_date') || ''),
        description: String(form.get('description') || ''),
      })
      setModal({ type: null })
      notify('Tâche créée et assignée.')
      await load()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to create task.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCompleteTask(event: FormEvent<HTMLFormElement>, task: Task) {
    event.preventDefault()
    setSaving(true)
    try {
      const form = new FormData(event.currentTarget)
      await sendJson<Task>('/api/b2b-partnerships/tasks', 'PATCH', {
        id: task.id,
        status: String(form.get('status') || 'Done'),
        description: String(form.get('description') || task.description || ''),
      })
      setModal({ type: null })
      notify('Tâche mise à jour.')
      await load()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Unable to update task.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className={styles.shell}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>ANGELCARE B2B EXECUTION OS</span>
          <h1>Meetings, Tasks & Intern Execution Operating System</h1>
          <p>
            A white-background enterprise execution workspace for hotel and pediatric-clinic partnerships: meetings,
            follow-ups, tasks, daily intern rhythm, manager supervision and Friday reporting readiness.
          </p>
        </div>
        <div className={styles.heroActions}>
          <button className={styles.primaryBtn} onClick={() => setModal({ type: 'scheduleMeeting' })}>Planifier réunion</button>
          <button className={styles.secondaryBtn} onClick={() => setModal({ type: 'createTask' })}>Créer tâche</button>
          <button className={styles.secondaryBtn} onClick={() => setModal({ type: 'dailySummary' })}>Résumé quotidien</button>
          <button className={styles.ghostBtn} onClick={load}>Synchroniser</button>
        </div>
      </section>

      {error && (
        <section className={styles.diagnostic}>
          <div>
            <strong>Execution workspace not fully synced</strong>
            <p>{error}</p>
          </div>
          <button onClick={load}>Retry live sync</button>
        </section>
      )}

      <section className={styles.kpiGrid}>
        <article><span>Meetings upcoming</span><strong>{upcomingMeetings.length}</strong><small>Scheduled or rescheduled</small></article>
        <article><span>Follow-ups overdue</span><strong>{followUpRequired.length}</strong><small>Needs immediate action</small></article>
        <article><span>Tasks today</span><strong>{todayTasks.length}</strong><small>Execution focus</small></article>
        <article><span>Overdue tasks</span><strong>{overdueTasks.length}</strong><small>Manager attention</small></article>
        <article><span>High priority</span><strong>{highPriorityTasks.length}</strong><small>Urgent / High tasks</small></article>
        <article><span>Open execution</span><strong>{openTasks.length}</strong><small>Active workload</small></article>
      </section>

      <nav className={styles.workspaceTabs}>
        <button className={workspace === 'meetings' ? styles.activeTab : ''} onClick={() => setWorkspace('meetings')}>Meetings & Follow-ups</button>
        <button className={workspace === 'tasks' ? styles.activeTab : ''} onClick={() => setWorkspace('tasks')}>Tasks & Assignments</button>
        <button className={workspace === 'execution' ? styles.activeTab : ''} onClick={() => setWorkspace('execution')}>Intern Execution OS</button>
      </nav>

      <section className={styles.commandBar}>
        <label className={styles.searchBox}>
          <span>Search execution context</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Prospect, city, sector, owner, status..." />
        </label>
        <div className={styles.commandActions}>
          <button onClick={() => setModal({ type: 'scheduleMeeting' })}>+ Meeting</button>
          <button onClick={() => setModal({ type: 'createTask' })}>+ Task</button>
          <button onClick={() => setWorkspace('execution')}>Open daily OS</button>
        </div>
      </section>

      {loading ? <div className={styles.loading}>Loading execution workspace...</div> : null}
      {!loading && workspace === 'meetings' && renderMeetings()}
      {!loading && workspace === 'tasks' && renderTasks()}
      {!loading && workspace === 'execution' && renderExecutionOS()}

      {renderModal()}
      {toast && <div className={styles.toast}>{toast}</div>}
    </main>
  )

  function renderMeetings() {
    return (
      <section className={styles.meetingsLayout}>
        <aside className={styles.meetingPlanner}>
          <div className={styles.panelHeader}>
            <span>Meeting command</span>
            <button onClick={() => setModal({ type: 'scheduleMeeting' })}>Planifier</button>
          </div>
          <h2>Upcoming partner conversations</h2>
          <p>Prepare meetings around decision process, operational need, family service fit, budget, objections and next action.</p>
          <div className={styles.meetingStack}>
            {upcomingMeetings.slice(0, 6).map((m) => (
              <article key={m.id} className={styles.meetingCard}>
                <div><strong>{m.prospect?.name ?? prospectName(prospects, m.prospect_id)}</strong><small>{m.meeting_type} · {formatDateTime(m.scheduled_at)}</small></div>
                <button onClick={() => setModal({ type: 'completeMeeting', meeting: m })}>Complete</button>
              </article>
            ))}
            {!upcomingMeetings.length && <Empty title="No meetings scheduled" action="Planifier la première réunion" onClick={() => setModal({ type: 'scheduleMeeting' })} />}
          </div>
        </aside>

        <section className={styles.meetingMain}>
          <div className={styles.sectionTitle}><div><span>Follow-up control</span><h2>Meetings requiring execution discipline</h2></div><button onClick={load}>Refresh</button></div>
          <div className={styles.followupGrid}>
            <div className={styles.followupPanel}><h3>Overdue follow-ups</h3>{followUpRequired.slice(0, 5).map((m) => <MiniMeeting key={m.id} meeting={m} />)}{!followUpRequired.length && <p className={styles.softText}>No overdue meeting follow-ups.</p>}</div>
            <div className={styles.followupPanel}><h3>Completed meetings</h3>{completedMeetings.slice(0, 5).map((m) => <MiniMeeting key={m.id} meeting={m} />)}{!completedMeetings.length && <p className={styles.softText}>No completed meetings yet.</p>}</div>
          </div>
          <div className={styles.discoveryGrid}>
            <QuestionPanel title="Hotel discovery questions" items={HOTEL_DISCOVERY} />
            <QuestionPanel title="Pediatric clinic discovery questions" items={CLINIC_DISCOVERY} />
          </div>
        </section>

        <aside className={styles.meetingIntel}>
          <h3>Prospect meeting queue</h3>
          <p>Filtered prospects available for scheduling and follow-up planning.</p>
          {filteredProspects.slice(0, 9).map((p) => (
            <article className={styles.prospectLine} key={p.id}>
              <div><strong>{p.name}</strong><small>{p.sector || 'Sector'} · {p.city || 'City'} · Priority {p.priority_score || 'B'}</small></div>
              <button onClick={() => setModal({ type: 'scheduleMeeting', prospect: p })}>Book</button>
            </article>
          ))}
        </aside>
      </section>
    )
  }

  function renderTasks() {
    const lanes = [
      { title: 'Today', items: todayTasks, tone: 'blue' },
      { title: 'Overdue', items: overdueTasks, tone: 'red' },
      { title: 'High Priority', items: highPriorityTasks, tone: 'amber' },
      { title: 'All Open', items: openTasks, tone: 'green' },
    ]
    return (
      <section className={styles.tasksLayout}>
        <div className={styles.sectionTitle}><div><span>Execution board</span><h2>Tasks & assignments command</h2></div><button onClick={() => setModal({ type: 'createTask' })}>Create task</button></div>
        <div className={styles.taskLanes}>
          {lanes.map((lane) => (
            <section key={lane.title} className={`${styles.taskLane} ${styles[lane.tone as 'blue' | 'red' | 'amber' | 'green']}`}>
              <header><span>{lane.title}</span><strong>{lane.items.length}</strong></header>
              <div className={styles.taskStack}>
                {lane.items.slice(0, 10).map((task) => <TaskCard key={`${lane.title}-${task.id}`} task={task} />)}
                {!lane.items.length && <p className={styles.softText}>No tasks in this lane.</p>}
              </div>
            </section>
          ))}
        </div>
        <section className={styles.managerGrid}>
          <article className={styles.managerCard}><h3>Manager supervision</h3><p>Review overdue actions, high-priority blockers and prospect-linked execution gaps.</p><button onClick={() => setModal({ type: 'createTask' })}>Assign strategic task</button></article>
          <article className={styles.managerCard}><h3>Execution quality</h3><p>Every task must include owner, due date, linked prospect when possible, and completion evidence.</p><button onClick={() => setWorkspace('execution')}>Open intern OS</button></article>
        </section>
      </section>
    )
  }

  function renderExecutionOS() {
    return (
      <section className={styles.executionLayout}>
        <aside className={styles.dayRail}>
          <h2>Daily operating rhythm</h2>
          <Checklist title="Start of day" items={DAILY_START} />
          <Checklist title="End of day" items={DAILY_END} />
        </aside>
        <section className={styles.executionMain}>
          <div className={styles.sectionTitle}><div><span>Intern execution cockpit</span><h2>Business Developer daily mission control</h2></div><button onClick={() => setModal({ type: 'dailySummary' })}>Prepare daily summary</button></div>
          <div className={styles.progressGrid}>
            <Progress label="Prospecting quota" value={weeklyProgress.prospects} target={`${target.prospects} prospects`} />
            <Progress label="Call discipline" value={weeklyProgress.calls} target={`${target.calls} calls`} />
            <Progress label="Meeting completion" value={weeklyProgress.meetings} target={`${target.meetings} meetings`} />
            <Progress label="Task completion" value={weeklyProgress.execution} target="Execution hygiene" />
          </div>
          <div className={styles.blockGrid}>
            <ExecutionBlock title="Research Block" detail="Hotels, resorts, pediatric clinics, child development centers" action="Create research task" onClick={() => setModal({ type: 'createTask' })} />
            <ExecutionBlock title="Outreach Block" detail="Personalized email, WhatsApp, LinkedIn and follow-up sequences" action="Open outreach" href="/b2b-partnerships/outreach" />
            <ExecutionBlock title="Call Block" detail="Decision-maker routing, gatekeeper handling and call outcomes" action="Create call task" onClick={() => setModal({ type: 'createTask' })} />
            <ExecutionBlock title="CRM Hygiene Block" detail="Status, next action, owner, notes and follow-up date must be complete" action="Open prospects" href="/b2b-partnerships/prospects" />
          </div>
        </section>
        <aside className={styles.fridayPanel}>
          <h3>Friday report preparation</h3>
          <p>Keep the week measurable: prospects added, decision makers identified, outreach, calls, meetings, proposals and support needed.</p>
          <div className={styles.reportList}>
            <span>Prospects added</span><strong>{prospects.length}</strong>
            <span>Meetings completed</span><strong>{completedMeetings.length}</strong>
            <span>Open tasks</span><strong>{openTasks.length}</strong>
            <span>Overdue risks</span><strong>{overdueTasks.length + followUpRequired.length}</strong>
          </div>
          <button className={styles.primaryBtn} onClick={() => setModal({ type: 'dailySummary' })}>Generate manager brief</button>
        </aside>
      </section>
    )
  }

  function MiniMeeting({ meeting }: { meeting: Meeting }) {
    return (
      <article className={styles.miniMeeting}>
        <div><strong>{meeting.prospect?.name ?? prospectName(prospects, meeting.prospect_id)}</strong><small>{meeting.status} · {formatDateTime(meeting.follow_up_at || meeting.scheduled_at)}</small></div>
        <button onClick={() => setModal({ type: 'completeMeeting', meeting })}>Open</button>
      </article>
    )
  }

  function TaskCard({ task }: { task: Task }) {
    return (
      <article className={styles.taskCard}>
        <div className={styles.taskTop}><strong>{task.title}</strong><em>{task.priority || 'Medium'}</em></div>
        <p>{task.description || task.task_type || 'No task description.'}</p>
        <small>{task.prospect?.name ?? prospectName(prospects, task.prospect_id)} · Due {formatDateTime(task.due_date)}</small>
        <div className={styles.taskActions}><button onClick={() => setModal({ type: 'completeTask', task })}>Update</button></div>
      </article>
    )
  }

  function renderModal() {
    if (modal.type === null) return null
    return (
      <div className={styles.modalBackdrop} onMouseDown={(e) => { if (e.target === e.currentTarget) setModal({ type: null }) }}>
        {modal.type === 'scheduleMeeting' && <ScheduleMeetingModal prospect={modal.prospect} />}
        {modal.type === 'completeMeeting' && <CompleteMeetingModal meeting={modal.meeting} />}
        {modal.type === 'createTask' && <CreateTaskModal prospect={modal.prospect} />}
        {modal.type === 'completeTask' && <CompleteTaskModal task={modal.task} />}
        {modal.type === 'dailySummary' && <DailySummaryModal />}
      </div>
    )
  }

  function ScheduleMeetingModal({ prospect }: { prospect?: Prospect | null }) {
    return (
      <form className={styles.largeModal} onSubmit={handleScheduleMeeting}>
        <ModalHeader title="Planifier une réunion B2B" subtitle="Structure the meeting before it happens: agenda, discovery, decision process, budget and follow-up." />
        <div className={styles.modalGrid}>
          <label><span>Prospect</span><select name="prospect_id" defaultValue={prospect?.id || ''} required><option value="">Select prospect</option>{prospects.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.sector} — {p.city}</option>)}</select></label>
          <label><span>Meeting type</span><select name="meeting_type" defaultValue="Discovery meeting">{MEETING_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
          <label><span>Scheduled date/time</span><input name="scheduled_at" type="datetime-local" defaultValue={nowIsoLocal()} required /></label>
          <label><span>Follow-up date/time</span><input name="follow_up_at" type="datetime-local" defaultValue={inThreeDaysIsoLocal()} /></label>
          <label><span>Location</span><input name="location" placeholder="Hotel, clinic, office, city..." /></label>
          <label><span>Video link</span><input name="video_link" placeholder="Google Meet / Zoom / Teams" /></label>
          <label className={styles.full}><span>Agenda</span><textarea name="agenda" placeholder="Objective, attendees, questions, service angle and expected next step." /></label>
          <label className={styles.full}><span>Needs to validate</span><textarea name="needs_identified" placeholder="Family guest experience, parent support, pediatric continuity, kids club support..." /></label>
          <label><span>Decision process</span><textarea name="decision_process" placeholder="Who validates? GM, clinic director, owner, operations manager?" /></label>
          <label><span>Budget discussion</span><textarea name="budget_discussion" placeholder="Retainer, pilot package, per event, referral, revenue share..." /></label>
          <label className={styles.full}><span>Next step proposed</span><input name="next_step" placeholder="Send proposal, prepare pilot plan, schedule second meeting..." /></label>
        </div>
        <ModalFooter saving={saving} submit="Schedule meeting" />
      </form>
    )
  }

  function CompleteMeetingModal({ meeting }: { meeting: Meeting }) {
    return (
      <form className={styles.largeModal} onSubmit={(event) => handleCompleteMeeting(event, meeting)}>
        <ModalHeader title="Clôturer / mettre à jour la réunion" subtitle={meeting.prospect?.name ?? prospectName(prospects, meeting.prospect_id)} />
        <div className={styles.modalGrid}>
          <label><span>Status</span><select name="status" defaultValue={meeting.status || 'Completed'}><option>Completed</option><option>Cancelled</option><option>No-show</option><option>Rescheduled</option></select></label>
          <label><span>Follow-up date/time</span><input name="follow_up_at" type="datetime-local" defaultValue={meeting.follow_up_at ? meeting.follow_up_at.slice(0, 16) : inThreeDaysIsoLocal()} /></label>
          <label className={styles.full}><span>Meeting notes</span><textarea name="notes" defaultValue={meeting.notes || ''} placeholder="What happened? Who attended? What was confirmed?" /></label>
          <label><span>Needs identified</span><textarea name="needs_identified" defaultValue={meeting.needs_identified || ''} /></label>
          <label><span>Objections</span><textarea name="objections" defaultValue={meeting.objections || ''} /></label>
          <label><span>Decision process</span><textarea name="decision_process" defaultValue={meeting.decision_process || ''} /></label>
          <label><span>Budget discussion</span><textarea name="budget_discussion" defaultValue={meeting.budget_discussion || ''} /></label>
          <label className={styles.full}><span>Next step</span><input name="next_step" defaultValue={meeting.next_step || ''} placeholder="Proposal, pilot, internal validation, next meeting..." /></label>
        </div>
        <ModalFooter saving={saving} submit="Save meeting outcome" />
      </form>
    )
  }

  function CreateTaskModal({ prospect }: { prospect?: Prospect | null }) {
    return (
      <form className={styles.largeModal} onSubmit={handleCreateTask}>
        <ModalHeader title="Créer une tâche d’exécution" subtitle="Assign a concrete B2B action linked to prospecting, outreach, calls, meetings, proposals or CRM hygiene." />
        <div className={styles.modalGrid}>
          <label className={styles.full}><span>Task title</span><input name="title" required placeholder="Example: Call decision maker at hotel / Prepare pediatric clinic proposal" /></label>
          <label><span>Task type</span><select name="task_type">{TASK_TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
          <label><span>Linked prospect</span><select name="prospect_id" defaultValue={prospect?.id || ''}><option value="">No prospect</option>{prospects.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.sector}</option>)}</select></label>
          <label><span>Priority</span><select name="priority"><option>Low</option><option>Medium</option><option>High</option><option>Urgent</option></select></label>
          <label><span>Due date</span><input name="due_date" type="datetime-local" defaultValue={inThreeDaysIsoLocal()} /></label>
          <label className={styles.full}><span>Description / execution evidence expected</span><textarea name="description" placeholder="Define outcome, channel, contact person, target result and required proof after completion." /></label>
        </div>
        <ModalFooter saving={saving} submit="Create task" />
      </form>
    )
  }

  function CompleteTaskModal({ task }: { task: Task }) {
    return (
      <form className={styles.largeModal} onSubmit={(event) => handleCompleteTask(event, task)}>
        <ModalHeader title="Update task execution" subtitle={task.title} />
        <div className={styles.modalGrid}>
          <label><span>Status</span><select name="status" defaultValue={task.status || 'Done'}><option>To Do</option><option>In Progress</option><option>Blocked</option><option>Done</option><option>Overdue</option><option>Cancelled</option></select></label>
          <label><span>Linked prospect</span><input value={task.prospect?.name ?? prospectName(prospects, task.prospect_id)} readOnly /></label>
          <label className={styles.full}><span>Completion note / blocker</span><textarea name="description" defaultValue={task.description || ''} placeholder="Result achieved, reply received, blocker, next action required..." /></label>
        </div>
        <ModalFooter saving={saving} submit="Save task update" />
      </form>
    )
  }

  function DailySummaryModal() {
    return (
      <section className={styles.largeModal}>
        <ModalHeader title="Daily execution summary" subtitle="Copy-ready manager briefing based on the current execution state." />
        <div className={styles.summaryBox}>
          <h3>Manager brief</h3>
          <p>Today’s B2B execution status: {todayTasks.length} tasks due today, {overdueTasks.length} overdue tasks, {upcomingMeetings.length} upcoming meetings and {followUpRequired.length} meeting follow-ups requiring attention.</p>
          <p>Recommended priority: clear overdue follow-ups, schedule meetings for Priority A prospects, update CRM next actions and prepare Friday reporting evidence.</p>
        </div>
        <div className={styles.modalFooter}><button className={styles.secondaryBtn} onClick={() => setModal({ type: null })}>Close</button></div>
      </section>
    )
  }

  function ModalHeader({ title, subtitle }: { title: string; subtitle: string }) {
    return <header className={styles.modalHeader}><div><span>ANGELCARE B2B</span><h2>{title}</h2><p>{subtitle}</p></div><button type="button" onClick={() => setModal({ type: null })}>×</button></header>
  }

  function ModalFooter({ saving, submit }: { saving: boolean; submit: string }) {
    return <footer className={styles.modalFooter}><button className={styles.secondaryBtn} type="button" onClick={() => setModal({ type: null })}>Cancel</button><button className={styles.primaryBtn} disabled={saving}>{saving ? 'Saving...' : submit}</button></footer>
  }
}

function Empty({ title, action, onClick }: { title: string; action: string; onClick: () => void }) {
  return <div className={styles.empty}><strong>{title}</strong><p>Start the workflow with a clear next action.</p><button onClick={onClick}>{action}</button></div>
}

function QuestionPanel({ title, items }: { title: string; items: string[] }) {
  return <article className={styles.questionPanel}><h3>{title}</h3>{items.map((item) => <p key={item}>• {item}</p>)}</article>
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  return <section className={styles.checklist}><h3>{title}</h3>{items.map((item) => <label key={item}><input type="checkbox" /> <span>{item}</span></label>)}</section>
}

function Progress({ label, value, target }: { label: string; value: number; target: string }) {
  return <article className={styles.progressCard}><div><span>{label}</span><strong>{value}%</strong></div><div className={styles.progressTrack}><i style={{ width: `${value}%` }} /></div><small>{target}</small></article>
}

function ExecutionBlock({ title, detail, action, onClick, href }: { title: string; detail: string; action: string; onClick?: () => void; href?: string }) {
  return <article className={styles.executionBlock}><h3>{title}</h3><p>{detail}</p>{href ? <a href={href}>{action}</a> : <button onClick={onClick}>{action}</button>}</article>
}

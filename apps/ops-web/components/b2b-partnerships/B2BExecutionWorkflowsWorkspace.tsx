'use client'
import { shouldStartAutoRefresh, safeRefreshInterval } from '@/lib/runtime/client-live-governor'

import type { FormEvent, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import type {
  B2BApiResult,
  B2BCallLog,
  B2BContactLite,
  B2BMeeting,
  B2BOutreachLog,
  B2BProspectLite,
  B2BTask,
} from '@/lib/b2b-partnerships/execution-workflow-types'
import {
  CALL_RESULTS,
  CALL_TYPES,
  MEETING_STATUSES,
  MEETING_TYPES,
  OUTREACH_CHANNELS,
  OUTREACH_OUTCOMES,
  OUTREACH_TEMPLATES,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TASK_TYPES,
} from '@/lib/b2b-partnerships/execution-workflow-types'
import {
  formatDateTime,
  fromDateTimeLocal,
  isOverdue,
  sectorIcon,
  startOfTodayInput,
  toDateTimeLocal,
} from '@/lib/b2b-partnerships/execution-workflow-utils'
import styles from './B2BExecutionWorkflowsWorkspace.module.css'

type Mode = 'outreach' | 'meetings' | 'tasks'
type LoadState = 'idle' | 'loading' | 'ready' | 'error'

type Props = { defaultMode?: Mode }

type OutreachDraft = {
  prospect_id: string
  contact_id: string
  channel: string
  template_key: string
  subject: string
  message_body: string
  outcome: string
  sent_at: string
  next_follow_up_at: string
  next_action: string
}

type CallDraft = {
  prospect_id: string
  contact_id: string
  call_type: string
  call_result: string
  duration_minutes: number
  summary: string
  objections: string
  decision_maker_identified: boolean
  next_step: string
  next_follow_up_at: string
}

type MeetingDraft = {
  id?: string
  prospect_id: string
  meeting_type: string
  status: string
  scheduled_at: string
  location: string
  video_link: string
  agenda: string
  notes: string
  needs_identified: string
  objections: string
  decision_process: string
  budget_discussion: string
  next_step: string
  follow_up_at: string
}

type TaskDraft = {
  id?: string
  title: string
  task_type: string
  prospect_id: string
  assigned_to: string
  priority: string
  due_date: string
  status: string
  description: string
}

const blankOutreach = (): OutreachDraft => ({
  prospect_id: '',
  contact_id: '',
  channel: 'Email',
  template_key: '',
  subject: '',
  message_body: '',
  outcome: 'No response',
  sent_at: startOfTodayInput(),
  next_follow_up_at: '',
  next_action: '',
})

const blankCall = (): CallDraft => ({
  prospect_id: '',
  contact_id: '',
  call_type: 'First call',
  call_result: 'No answer',
  duration_minutes: 0,
  summary: '',
  objections: '',
  decision_maker_identified: false,
  next_step: '',
  next_follow_up_at: '',
})

const blankMeeting = (): MeetingDraft => ({
  prospect_id: '',
  meeting_type: 'Discovery meeting',
  status: 'Scheduled',
  scheduled_at: startOfTodayInput(),
  location: '',
  video_link: '',
  agenda: '',
  notes: '',
  needs_identified: '',
  objections: '',
  decision_process: '',
  budget_discussion: '',
  next_step: '',
  follow_up_at: '',
})

const blankTask = (): TaskDraft => ({
  title: '',
  task_type: 'Research prospect',
  prospect_id: '',
  assigned_to: '',
  priority: 'Medium',
  due_date: '',
  status: 'To Do',
  description: '',
})

async function readJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' })
  const payload = (await response.json()) as B2BApiResult<T>
  if (!response.ok || !payload.ok) throw new Error(payload.ok ? 'Unable to load data.' : payload.error)
  return payload.data
}

async function writeJson<T>(url: string, method: 'POST' | 'PATCH', body: unknown): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const payload = (await response.json()) as B2BApiResult<T>
  if (!response.ok || !payload.ok) throw new Error(payload.ok ? 'Unable to save data.' : payload.error)
  return payload.data
}

function statusTone(value?: string | null) {
  if (['Completed', 'Done', 'Meeting booked', 'Positive reply', 'Interested'].includes(value ?? '')) return styles.good
  if (['Overdue', 'No-show', 'Blocked', 'Negative reply', 'Not interested'].includes(value ?? '')) return styles.risk
  if (['Scheduled', 'In Progress', 'Asked for info', 'Follow up later'].includes(value ?? '')) return styles.active
  return styles.neutral
}

function prospectName(prospects: B2BProspectLite[], id?: string | null) {
  return prospects.find((p) => p.id === id)?.name ?? 'Prospect non lié'
}

export default function B2BExecutionWorkflowsWorkspace({ defaultMode = 'outreach' }: Props) {
  const [mode, setMode] = useState<Mode>(defaultMode)
  const [state, setState] = useState<LoadState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)

  const [prospects, setProspects] = useState<B2BProspectLite[]>([])
  const [contacts, setContacts] = useState<B2BContactLite[]>([])
  const [outreach, setOutreach] = useState<B2BOutreachLog[]>([])
  const [calls, setCalls] = useState<B2BCallLog[]>([])
  const [meetings, setMeetings] = useState<B2BMeeting[]>([])
  const [tasks, setTasks] = useState<B2BTask[]>([])

  const [query, setQuery] = useState('')
  const [prospectFilter, setProspectFilter] = useState('All')
  const [onlyToday, setOnlyToday] = useState(false)
  const [onlyOverdue, setOnlyOverdue] = useState(false)

  const [outreachOpen, setOutreachOpen] = useState(false)
  const [callOpen, setCallOpen] = useState(false)
  const [meetingOpen, setMeetingOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [outreachDraft, setOutreachDraft] = useState<OutreachDraft>(blankOutreach)
  const [callDraft, setCallDraft] = useState<CallDraft>(blankCall)
  const [meetingDraft, setMeetingDraft] = useState<MeetingDraft>(blankMeeting)
  const [taskDraft, setTaskDraft] = useState<TaskDraft>(blankTask)

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(null), 3200)
  }

  async function refresh() {
    setState((current) => (current === 'ready' ? 'ready' : 'loading'))
    setError(null)
    try {
      const [p, o, c, m, t] = await Promise.all([
        readJson<B2BProspectLite[]>('/api/b2b-partnerships/prospects'),
        readJson<B2BOutreachLog[]>('/api/b2b-partnerships/outreach'),
        readJson<B2BCallLog[]>('/api/b2b-partnerships/calls'),
        readJson<B2BMeeting[]>('/api/b2b-partnerships/meetings'),
        readJson<B2BTask[]>('/api/b2b-partnerships/tasks'),
      ])
      setProspects(p)
      setOutreach(o)
      setCalls(c)
      setMeetings(m)
      setTasks(t)
      const detailContacts = await Promise.all(
        p.slice(0, 100).map(async (prospect) => {
          try {
            const detail = await readJson<{ contacts: B2BContactLite[] }>(`/api/b2b-partnerships/prospects/${prospect.id}`)
            return detail.contacts ?? []
          } catch {
            return []
          }
        })
      )
      setContacts(detailContacts.flat())
      setLastSyncedAt(new Date())
      setState('ready')
    } catch (err) {
      setState('error')
      setError(err instanceof Error ? err.message : 'Unable to synchronize execution workspace.')
    }
  }

  useEffect(() => {
    void refresh()
    if (!shouldStartAutoRefresh()) return
    const interval = window.setInterval(() => void refresh(), safeRefreshInterval(30000))
    return () => window.clearInterval(interval)
  }, [])

  const filteredContacts = useMemo(
    () => contacts.filter((contact) => !outreachDraft.prospect_id || contact.prospect_id === outreachDraft.prospect_id),
    [contacts, outreachDraft.prospect_id]
  )

  const callContacts = useMemo(
    () => contacts.filter((contact) => !callDraft.prospect_id || contact.prospect_id === callDraft.prospect_id),
    [contacts, callDraft.prospect_id]
  )

  const today = new Date().toISOString().slice(0, 10)

  const filteredOutreach = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return outreach.filter((row) => {
      const p = row.prospect?.name ?? prospectName(prospects, row.prospect_id)
      const matchesText = [p, row.channel, row.outcome, row.subject, row.message_body].join(' ').toLowerCase().includes(needle)
      const matchesProspect = prospectFilter === 'All' || row.prospect_id === prospectFilter
      const matchesToday = !onlyToday || (row.sent_at ?? row.created_at ?? '').startsWith(today)
      return matchesText && matchesProspect && matchesToday
    })
  }, [outreach, query, prospectFilter, onlyToday, prospects, today])

  const filteredCalls = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return calls.filter((row) => {
      const p = row.prospect?.name ?? prospectName(prospects, row.prospect_id)
      const matchesText = [p, row.call_type, row.call_result, row.summary, row.objections, row.next_step].join(' ').toLowerCase().includes(needle)
      const matchesProspect = prospectFilter === 'All' || row.prospect_id === prospectFilter
      const matchesToday = !onlyToday || (row.created_at ?? '').startsWith(today)
      return matchesText && matchesProspect && matchesToday
    })
  }, [calls, query, prospectFilter, onlyToday, prospects, today])

  const filteredMeetings = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return meetings.filter((row) => {
      const p = row.prospect?.name ?? prospectName(prospects, row.prospect_id)
      const matchesText = [p, row.meeting_type, row.status, row.agenda, row.notes, row.next_step].join(' ').toLowerCase().includes(needle)
      const matchesProspect = prospectFilter === 'All' || row.prospect_id === prospectFilter
      const matchesToday = !onlyToday || (row.scheduled_at ?? '').startsWith(today)
      const matchesOverdue = !onlyOverdue || (row.status === 'Scheduled' && isOverdue(row.scheduled_at))
      return matchesText && matchesProspect && matchesToday && matchesOverdue
    })
  }, [meetings, query, prospectFilter, onlyToday, onlyOverdue, prospects, today])

  const filteredTasks = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return tasks.filter((row) => {
      const p = row.prospect?.name ?? prospectName(prospects, row.prospect_id)
      const matchesText = [p, row.title, row.task_type, row.status, row.priority, row.description].join(' ').toLowerCase().includes(needle)
      const matchesProspect = prospectFilter === 'All' || row.prospect_id === prospectFilter
      const matchesToday = !onlyToday || (row.due_date ?? '').startsWith(today)
      const matchesOverdue = !onlyOverdue || (row.status !== 'Done' && isOverdue(row.due_date))
      return matchesText && matchesProspect && matchesToday && matchesOverdue
    })
  }, [tasks, query, prospectFilter, onlyToday, onlyOverdue, prospects, today])

  const kpis = useMemo(() => {
    const overdueTasks = tasks.filter((task) => task.status !== 'Done' && isOverdue(task.due_date)).length
    const overdueMeetings = meetings.filter((meeting) => meeting.status === 'Scheduled' && isOverdue(meeting.scheduled_at)).length
    return {
      outreachToday: outreach.filter((row) => (row.sent_at ?? row.created_at ?? '').startsWith(today)).length,
      callsToday: calls.filter((row) => (row.created_at ?? '').startsWith(today)).length,
      meetingsToday: meetings.filter((row) => (row.scheduled_at ?? '').startsWith(today)).length,
      openTasks: tasks.filter((task) => !['Done', 'Cancelled'].includes(task.status)).length,
      overdue: overdueTasks + overdueMeetings,
      positiveReplies: outreach.filter((row) => ['Positive reply', 'Meeting booked'].includes(row.outcome)).length,
    }
  }, [outreach, calls, meetings, tasks, today])

  function applyTemplate(key: string) {
    const template = OUTREACH_TEMPLATES.find((item) => item.key === key)
    if (!template) return
    setOutreachDraft((draft) => ({ ...draft, template_key: key, subject: template.subject, message_body: template.body }))
  }

  async function submitOutreach(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      await writeJson('/api/b2b-partnerships/outreach', 'POST', {
        ...outreachDraft,
        sent_at: fromDateTimeLocal(outreachDraft.sent_at),
        next_follow_up_at: fromDateTimeLocal(outreachDraft.next_follow_up_at),
      })
      setOutreachOpen(false)
      setOutreachDraft(blankOutreach())
      showToast('Outreach logged and prospect timeline updated.')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to log outreach.')
    } finally {
      setSaving(false)
    }
  }

  async function submitCall(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      await writeJson('/api/b2b-partnerships/calls', 'POST', {
        ...callDraft,
        next_follow_up_at: fromDateTimeLocal(callDraft.next_follow_up_at),
      })
      setCallOpen(false)
      setCallDraft(blankCall())
      showToast('Call logged and follow-up intelligence updated.')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to log call.')
    } finally {
      setSaving(false)
    }
  }

  async function submitMeeting(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      const method = meetingDraft.id ? 'PATCH' : 'POST'
      await writeJson('/api/b2b-partnerships/meetings', method, {
        ...meetingDraft,
        scheduled_at: fromDateTimeLocal(meetingDraft.scheduled_at),
        follow_up_at: fromDateTimeLocal(meetingDraft.follow_up_at),
      })
      setMeetingOpen(false)
      setMeetingDraft(blankMeeting())
      showToast(method === 'PATCH' ? 'Meeting updated.' : 'Meeting scheduled.')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save meeting.')
    } finally {
      setSaving(false)
    }
  }

  async function submitTask(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      const method = taskDraft.id ? 'PATCH' : 'POST'
      await writeJson('/api/b2b-partnerships/tasks', method, {
        ...taskDraft,
        due_date: fromDateTimeLocal(taskDraft.due_date),
      })
      setTaskOpen(false)
      setTaskDraft(blankTask())
      showToast(method === 'PATCH' ? 'Task updated.' : 'Task created.')
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save task.')
    } finally {
      setSaving(false)
    }
  }

  function openMeetingEdit(meeting: B2BMeeting) {
    setMeetingDraft({
      id: meeting.id,
      prospect_id: meeting.prospect_id,
      meeting_type: meeting.meeting_type ?? 'Discovery meeting',
      status: meeting.status,
      scheduled_at: toDateTimeLocal(meeting.scheduled_at),
      location: meeting.location ?? '',
      video_link: meeting.video_link ?? '',
      agenda: meeting.agenda ?? '',
      notes: meeting.notes ?? '',
      needs_identified: meeting.needs_identified ?? '',
      objections: meeting.objections ?? '',
      decision_process: meeting.decision_process ?? '',
      budget_discussion: meeting.budget_discussion ?? '',
      next_step: meeting.next_step ?? '',
      follow_up_at: toDateTimeLocal(meeting.follow_up_at),
    })
    setMeetingOpen(true)
  }

  function openTaskEdit(task: B2BTask) {
    setTaskDraft({
      id: task.id,
      title: task.title,
      task_type: task.task_type ?? 'Update CRM',
      prospect_id: task.prospect_id ?? '',
      assigned_to: task.assigned_to ?? '',
      priority: task.priority,
      due_date: toDateTimeLocal(task.due_date),
      status: task.status,
      description: task.description ?? '',
    })
    setTaskOpen(true)
  }

  return (
    <main className={styles.shell}>
      {toast ? <div className={styles.toast}>{toast}</div> : null}

      <section className={styles.hero}>
        <div>
          <div className={styles.eyebrow}><span className={styles.liveDot} /> ZIP 4 · Live execution workflows · White enterprise UI</div>
          <h1>B2B Execution Center</h1>
          <p>
            Daily operating layer for ANGELCARE partnership teams: outreach, calls, meetings, follow-ups, and tasks connected to real prospects, audit trails, and live production data.
          </p>
          <div className={styles.heroActions}>
            <button className={styles.primaryButton} onClick={() => { setOutreachDraft(blankOutreach()); setOutreachOpen(true) }}>Log outreach</button>
            <button className={styles.secondaryButton} onClick={() => { setCallDraft(blankCall()); setCallOpen(true) }}>Log call</button>
            <button className={styles.secondaryButton} onClick={() => { setMeetingDraft(blankMeeting()); setMeetingOpen(true) }}>Schedule meeting</button>
            <button className={styles.secondaryButton} onClick={() => { setTaskDraft(blankTask()); setTaskOpen(true) }}>Create task</button>
          </div>
        </div>
        <aside className={styles.syncCard}>
          <span>Production sync</span>
          <strong>{state === 'loading' ? 'Synchronizing…' : 'Live-ready'}</strong>
          <small>Last sync: {lastSyncedAt ? formatDateTime(lastSyncedAt.toISOString()) : 'Pending'}</small>
          <button className={styles.tableAction} onClick={() => void refresh()}>Refresh now</button>
        </aside>
      </section>

      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      <section className={styles.kpiGrid}>
        <div className={styles.kpi}><span>Outreach today</span><strong>{kpis.outreachToday}</strong><small>Email · WhatsApp · LinkedIn · visits</small></div>
        <div className={styles.kpi}><span>Calls today</span><strong>{kpis.callsToday}</strong><small>Call discipline and notes</small></div>
        <div className={styles.kpi}><span>Meetings today</span><strong>{kpis.meetingsToday}</strong><small>Discovery · proposals · pilots</small></div>
        <div className={styles.kpi}><span>Open tasks</span><strong>{kpis.openTasks}</strong><small>Assigned execution queue</small></div>
        <div className={`${styles.kpi} ${kpis.overdue ? styles.kpiRisk : ''}`}><span>Overdue actions</span><strong>{kpis.overdue}</strong><small>Requires immediate attention</small></div>
        <div className={styles.kpi}><span>Positive replies</span><strong>{kpis.positiveReplies}</strong><small>Warm opportunities</small></div>
      </section>

      <section className={styles.modeBar}>
        {(['outreach', 'meetings', 'tasks'] as Mode[]).map((item) => (
          <button key={item} className={mode === item ? styles.modeActive : styles.modeButton} onClick={() => setMode(item)}>
            {item === 'outreach' ? 'Outreach & Calls' : item === 'meetings' ? 'Meetings & Follow-ups' : 'Tasks & Assignments'}
          </button>
        ))}
      </section>

      <section className={styles.filters}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search prospect, outcome, notes, agenda, task…" />
        <select value={prospectFilter} onChange={(event) => setProspectFilter(event.target.value)}>
          <option value="All">All prospects</option>
          {prospects.map((prospect) => <option key={prospect.id} value={prospect.id}>{prospect.name}</option>)}
        </select>
        <label><input type="checkbox" checked={onlyToday} onChange={(event) => setOnlyToday(event.target.checked)} /> Today only</label>
        <label><input type="checkbox" checked={onlyOverdue} onChange={(event) => setOnlyOverdue(event.target.checked)} /> Overdue only</label>
      </section>

      {mode === 'outreach' ? (
        <section className={styles.twoColumn}>
          <div className={styles.panel}>
            <div className={styles.panelHeader}><div><span>Outreach Center</span><h2>Communication activity</h2></div><button className={styles.primaryButton} onClick={() => setOutreachOpen(true)}>New outreach</button></div>
            <div className={styles.activityList}>{filteredOutreach.map((row) => <article key={row.id} className={styles.activityCard}><div className={styles.cardTop}><div><strong>{row.prospect?.name ?? prospectName(prospects, row.prospect_id)}</strong><span>{sectorIcon(row.prospect?.sector)} {row.channel} · {formatDateTime(row.sent_at ?? row.created_at)}</span></div><em className={statusTone(row.outcome)}>{row.outcome}</em></div><h3>{row.subject || 'Outreach without subject'}</h3><p>{row.message_body || 'No message body stored.'}</p><small>Next follow-up: {formatDateTime(row.next_follow_up_at)}</small></article>)}</div>
          </div>
          <div className={styles.panel}>
            <div className={styles.panelHeader}><div><span>Call command</span><h2>Call logs & objections</h2></div><button className={styles.secondaryButton} onClick={() => setCallOpen(true)}>Log call</button></div>
            <div className={styles.activityList}>{filteredCalls.map((row) => <article key={row.id} className={styles.activityCard}><div className={styles.cardTop}><div><strong>{row.prospect?.name ?? prospectName(prospects, row.prospect_id)}</strong><span>☎ {row.call_type} · {formatDateTime(row.created_at)}</span></div><em className={statusTone(row.call_result)}>{row.call_result || 'Call'}</em></div><p>{row.summary || 'No summary.'}</p>{row.objections ? <blockquote>{row.objections}</blockquote> : null}<small>Next step: {row.next_step || '—'} · Follow-up: {formatDateTime(row.next_follow_up_at)}</small></article>)}</div>
          </div>
        </section>
      ) : null}

      {mode === 'meetings' ? (
        <section className={styles.panel}>
          <div className={styles.panelHeader}><div><span>Meetings & follow-ups</span><h2>Calendar-quality partnership reviews</h2></div><button className={styles.primaryButton} onClick={() => setMeetingOpen(true)}>Schedule meeting</button></div>
          <div className={styles.tableWrap}><table><thead><tr><th>Prospect</th><th>Type</th><th>Status</th><th>Scheduled</th><th>Agenda</th><th>Follow-up</th><th /></tr></thead><tbody>{filteredMeetings.map((row) => <tr key={row.id}><td><strong>{row.prospect?.name ?? prospectName(prospects, row.prospect_id)}</strong><small>{row.prospect?.city || '—'}</small></td><td>{row.meeting_type}</td><td><em className={statusTone(row.status)}>{row.status}</em></td><td>{formatDateTime(row.scheduled_at)}</td><td>{row.agenda || row.next_step || '—'}</td><td className={isOverdue(row.follow_up_at) ? styles.overdueText : ''}>{formatDateTime(row.follow_up_at)}</td><td><button className={styles.tableAction} onClick={() => openMeetingEdit(row)}>Open</button></td></tr>)}</tbody></table></div>
        </section>
      ) : null}

      {mode === 'tasks' ? (
        <section className={styles.panel}>
          <div className={styles.panelHeader}><div><span>Tasks & assignments</span><h2>Execution queue</h2></div><button className={styles.primaryButton} onClick={() => setTaskOpen(true)}>Create task</button></div>
          <div className={styles.taskBoard}>{['To Do', 'In Progress', 'Blocked', 'Done'].map((status) => <div key={status} className={styles.taskLane}><h3>{status}</h3>{filteredTasks.filter((task) => task.status === status || (status === 'To Do' && task.status === 'Overdue')).map((task) => <article key={task.id} className={styles.taskCard}><div className={styles.cardTop}><strong>{task.title}</strong><em className={statusTone(task.status)}>{task.priority}</em></div><p>{task.description || task.task_type}</p><small>{prospectName(prospects, task.prospect_id)} · due {formatDateTime(task.due_date)}</small><button className={styles.tableAction} onClick={() => openTaskEdit(task)}>Manage</button></article>)}</div>)}</div>
        </section>
      ) : null}

      {outreachOpen ? <Modal title="Log outreach" onClose={() => setOutreachOpen(false)}><form onSubmit={submitOutreach} className={styles.form}><Select label="Prospect" value={outreachDraft.prospect_id} onChange={(v) => setOutreachDraft({ ...outreachDraft, prospect_id: v, contact_id: '' })} options={prospects.map((p) => [p.id, p.name])} required /><Select label="Contact" value={outreachDraft.contact_id} onChange={(v) => setOutreachDraft({ ...outreachDraft, contact_id: v })} options={filteredContacts.map((c) => [c.id, `${c.name} · ${c.role ?? 'contact'}`])} /><Select label="Channel" value={outreachDraft.channel} onChange={(v) => setOutreachDraft({ ...outreachDraft, channel: v })} options={OUTREACH_CHANNELS.map((v) => [v, v])} /><Select label="Template" value={outreachDraft.template_key} onChange={applyTemplate} options={[['', 'No template'], ...OUTREACH_TEMPLATES.map((t) => [t.key, t.label])]} /><Input label="Subject" value={outreachDraft.subject} onChange={(v) => setOutreachDraft({ ...outreachDraft, subject: v })} /><Select label="Outcome" value={outreachDraft.outcome} onChange={(v) => setOutreachDraft({ ...outreachDraft, outcome: v })} options={OUTREACH_OUTCOMES.map((v) => [v, v])} /><Input label="Sent at" type="datetime-local" value={outreachDraft.sent_at} onChange={(v) => setOutreachDraft({ ...outreachDraft, sent_at: v })} /><Input label="Next follow-up" type="datetime-local" value={outreachDraft.next_follow_up_at} onChange={(v) => setOutreachDraft({ ...outreachDraft, next_follow_up_at: v })} /><Textarea label="Message" value={outreachDraft.message_body} onChange={(v) => setOutreachDraft({ ...outreachDraft, message_body: v })} full /><Input label="Next action" value={outreachDraft.next_action} onChange={(v) => setOutreachDraft({ ...outreachDraft, next_action: v })} full /><Footer saving={saving} /></form></Modal> : null}
      {callOpen ? <Modal title="Log call" onClose={() => setCallOpen(false)}><form onSubmit={submitCall} className={styles.form}><Select label="Prospect" value={callDraft.prospect_id} onChange={(v) => setCallDraft({ ...callDraft, prospect_id: v, contact_id: '' })} options={prospects.map((p) => [p.id, p.name])} required /><Select label="Contact" value={callDraft.contact_id} onChange={(v) => setCallDraft({ ...callDraft, contact_id: v })} options={callContacts.map((c) => [c.id, `${c.name} · ${c.role ?? 'contact'}`])} /><Select label="Call type" value={callDraft.call_type} onChange={(v) => setCallDraft({ ...callDraft, call_type: v })} options={CALL_TYPES.map((v) => [v, v])} /><Select label="Result" value={callDraft.call_result} onChange={(v) => setCallDraft({ ...callDraft, call_result: v })} options={CALL_RESULTS.map((v) => [v, v])} /><Input label="Duration minutes" type="number" value={String(callDraft.duration_minutes)} onChange={(v) => setCallDraft({ ...callDraft, duration_minutes: Number(v) })} /><Input label="Next follow-up" type="datetime-local" value={callDraft.next_follow_up_at} onChange={(v) => setCallDraft({ ...callDraft, next_follow_up_at: v })} /><Textarea label="Summary" value={callDraft.summary} onChange={(v) => setCallDraft({ ...callDraft, summary: v })} full /><Textarea label="Objections" value={callDraft.objections} onChange={(v) => setCallDraft({ ...callDraft, objections: v })} full /><Input label="Next step" value={callDraft.next_step} onChange={(v) => setCallDraft({ ...callDraft, next_step: v })} full /><label className={styles.checkbox}><input type="checkbox" checked={callDraft.decision_maker_identified} onChange={(e) => setCallDraft({ ...callDraft, decision_maker_identified: e.target.checked })} /> Decision maker identified</label><Footer saving={saving} /></form></Modal> : null}
      {meetingOpen ? <Modal title={meetingDraft.id ? 'Update meeting' : 'Schedule meeting'} onClose={() => setMeetingOpen(false)}><form onSubmit={submitMeeting} className={styles.form}><Select label="Prospect" value={meetingDraft.prospect_id} onChange={(v) => setMeetingDraft({ ...meetingDraft, prospect_id: v })} options={prospects.map((p) => [p.id, p.name])} required /><Select label="Type" value={meetingDraft.meeting_type} onChange={(v) => setMeetingDraft({ ...meetingDraft, meeting_type: v })} options={MEETING_TYPES.map((v) => [v, v])} /><Select label="Status" value={meetingDraft.status} onChange={(v) => setMeetingDraft({ ...meetingDraft, status: v })} options={MEETING_STATUSES.map((v) => [v, v])} /><Input label="Scheduled at" type="datetime-local" value={meetingDraft.scheduled_at} onChange={(v) => setMeetingDraft({ ...meetingDraft, scheduled_at: v })} /><Input label="Location" value={meetingDraft.location} onChange={(v) => setMeetingDraft({ ...meetingDraft, location: v })} /><Input label="Video link" value={meetingDraft.video_link} onChange={(v) => setMeetingDraft({ ...meetingDraft, video_link: v })} /><Textarea label="Agenda" value={meetingDraft.agenda} onChange={(v) => setMeetingDraft({ ...meetingDraft, agenda: v })} full /><Textarea label="Notes / minutes" value={meetingDraft.notes} onChange={(v) => setMeetingDraft({ ...meetingDraft, notes: v })} full /><Textarea label="Needs identified" value={meetingDraft.needs_identified} onChange={(v) => setMeetingDraft({ ...meetingDraft, needs_identified: v })} /><Textarea label="Objections" value={meetingDraft.objections} onChange={(v) => setMeetingDraft({ ...meetingDraft, objections: v })} /><Input label="Decision process" value={meetingDraft.decision_process} onChange={(v) => setMeetingDraft({ ...meetingDraft, decision_process: v })} /><Input label="Budget discussion" value={meetingDraft.budget_discussion} onChange={(v) => setMeetingDraft({ ...meetingDraft, budget_discussion: v })} /><Input label="Next step" value={meetingDraft.next_step} onChange={(v) => setMeetingDraft({ ...meetingDraft, next_step: v })} /><Input label="Follow-up at" type="datetime-local" value={meetingDraft.follow_up_at} onChange={(v) => setMeetingDraft({ ...meetingDraft, follow_up_at: v })} /><Footer saving={saving} /></form></Modal> : null}
      {taskOpen ? <Modal title={taskDraft.id ? 'Manage task' : 'Create task'} onClose={() => setTaskOpen(false)}><form onSubmit={submitTask} className={styles.form}><Input label="Title" value={taskDraft.title} onChange={(v) => setTaskDraft({ ...taskDraft, title: v })} required /><Select label="Task type" value={taskDraft.task_type} onChange={(v) => setTaskDraft({ ...taskDraft, task_type: v })} options={TASK_TYPES.map((v) => [v, v])} /><Select label="Prospect" value={taskDraft.prospect_id} onChange={(v) => setTaskDraft({ ...taskDraft, prospect_id: v })} options={[['', 'No prospect'], ...prospects.map((p) => [p.id, p.name])]} /><Select label="Priority" value={taskDraft.priority} onChange={(v) => setTaskDraft({ ...taskDraft, priority: v })} options={TASK_PRIORITIES.map((v) => [v, v])} /><Select label="Status" value={taskDraft.status} onChange={(v) => setTaskDraft({ ...taskDraft, status: v })} options={TASK_STATUSES.map((v) => [v, v])} /><Input label="Assigned user id" value={taskDraft.assigned_to} onChange={(v) => setTaskDraft({ ...taskDraft, assigned_to: v })} /><Input label="Due date" type="datetime-local" value={taskDraft.due_date} onChange={(v) => setTaskDraft({ ...taskDraft, due_date: v })} /><Textarea label="Description" value={taskDraft.description} onChange={(v) => setTaskDraft({ ...taskDraft, description: v })} full /><Footer saving={saving} /></form></Modal> : null}
    </main>
  )
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className={styles.modalBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className={styles.modal}><header><div><span>ANGELCARE B2B</span><h2>{title}</h2></div><button onClick={onClose}>×</button></header>{children}</section></div>
}

function Input({ label, value, onChange, type = 'text', required = false, full = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean; full?: boolean }) {
  return <label className={full ? styles.full : ''}><span>{label}</span><input type={type} value={value} required={required} onChange={(event) => onChange(event.target.value)} /></label>
}

function Select({ label, value, onChange, options, required = false }: { label: string; value: string; onChange: (value: string) => void; options: ReadonlyArray<ReadonlyArray<string>>; required?: boolean }) {
  return <label><span>{label}</span><select value={value} required={required} onChange={(event) => onChange(event.target.value)}>{options.map((option) => { const id = option[0] ?? ''; const text = option[1] ?? id; return <option key={id || text} value={id}>{text}</option> })}</select></label>
}

function Textarea({ label, value, onChange, full = false }: { label: string; value: string; onChange: (value: string) => void; full?: boolean }) {
  return <label className={full ? styles.full : ''}><span>{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} /></label>
}

function Footer({ saving }: { saving: boolean }) {
  return <div className={styles.modalFooter}><small>Server-validated · database persisted · audit-ready.</small><button className={styles.primaryButton} disabled={saving}>{saving ? 'Saving…' : 'Save workflow'}</button></div>
}

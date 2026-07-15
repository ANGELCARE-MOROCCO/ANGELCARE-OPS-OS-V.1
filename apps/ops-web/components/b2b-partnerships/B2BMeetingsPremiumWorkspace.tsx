'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from './B2BMeetingsPremiumWorkspace.module.css'

type AnyRow = Record<string, any>
type ViewMode = 'day' | 'week' | 'month' | 'board'

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function normalizeDate(value: any) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDate(date: Date | null) {
  if (!date) return 'Date pending'
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function formatTime(date: Date | null) {
  if (!date) return 'Time pending'
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(date)
}

function normalizeArray(payload: any): AnyRow[] {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.meetings)) return payload.meetings
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.rows)) return payload.rows
  return []
}

function meetingStart(row: AnyRow) {
  return normalizeDate(row.start_at || row.scheduled_at || row.meeting_at || row.date || row.scheduled_start || row.starts_at)
}

function meetingEnd(row: AnyRow) {
  return normalizeDate(row.end_at || row.scheduled_end || row.ends_at)
}

function meetingTitle(row: AnyRow) {
  return row.title || row.name || row.subject || row.prospect_name || row.client_name || 'B2B partnership meeting'
}

function meetingProspect(row: AnyRow) {
  return row.prospect_name || row.company_name || row.partner_name || row.account_name || row.client_name || 'Prospect pending'
}

function meetingStatus(row: AnyRow) {
  return row.status || row.meeting_status || 'scheduled'
}

function meetingChannel(row: AnyRow) {
  return row.channel || row.location_type || row.type || 'Discovery'
}

function sameDay(a: Date | null, b: Date) {
  if (!a) return false
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

function weekDays(anchor: Date) {
  const day = anchor.getDay() || 7
  const monday = addDays(startOfDay(anchor), 1 - day)
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

function monthDays(anchor: Date) {
  const year = anchor.getFullYear()
  const month = anchor.getMonth()
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const start = addDays(first, -((first.getDay() || 7) - 1))
  const end = addDays(last, 7 - (last.getDay() || 7))
  const days: Date[] = []
  let cur = start
  while (cur <= end) {
    days.push(new Date(cur))
    cur = addDays(cur, 1)
  }
  return days
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

export default function B2BMeetingsPremiumWorkspace() {
  const [view, setView] = useState<ViewMode>('week')
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()))
  const [meetings, setMeetings] = useState<AnyRow[]>([])
  const [tasks, setTasks] = useState<AnyRow[]>([])
  const [prospects, setProspects] = useState<AnyRow[]>([])
  const [selectedMeeting, setSelectedMeeting] = useState<AnyRow | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'view' | 'edit' | null>(null)
  const [meetingForm, setMeetingForm] = useState<AnyRow>({
    title: '',
    prospect_name: '',
    company_name: '',
    status: 'scheduled',
    channel: 'Discovery',
    start_at: new Date().toISOString().slice(0, 16),
    end_at: '',
    location: '',
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
      const [meetingsPayload, tasksPayload, prospectsPayload] = await Promise.allSettled([
        fetchJson('/api/b2b-partnerships/meetings'),
        fetchJson('/api/b2b-partnerships/tasks'),
        fetchJson('/api/b2b-partnerships/prospects?limit=160'),
      ])

      if (meetingsPayload.status === 'fulfilled') setMeetings(normalizeArray(meetingsPayload.value))
      if (tasksPayload.status === 'fulfilled') setTasks(normalizeArray(tasksPayload.value))
      if (prospectsPayload.status === 'fulfilled') setProspects(normalizeArray(prospectsPayload.value))

      const failures = [meetingsPayload, tasksPayload, prospectsPayload]
        .filter((item) => item.status === 'rejected')
        .map((item: any) => item.reason?.message)
        .filter(Boolean)

      if (failures.length) {
        setError(failures.slice(0, 2).join(' · '))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sync meetings workspace.')
    } finally {
      setLoading(false)
    }
  }


  async function mutateMeeting(method: 'POST' | 'PATCH' | 'DELETE', payload?: AnyRow, id?: string) {
    const paths =
      method === 'POST'
        ? ['/api/b2b-partnerships/meetings']
        : [
            `/api/b2b-partnerships/meetings/${id}`,
            `/api/b2b-partnerships/meetings?id=${id}`,
          ]

    let lastError = ''

    for (const path of paths) {
      try {
        const response = await fetch(path, {
          method,
          headers: method === 'DELETE' ? undefined : { 'Content-Type': 'application/json' },
          body: method === 'DELETE' ? undefined : JSON.stringify(payload || {}),
        })

        const text = await response.text()
        let json: any = null
        try { json = text ? JSON.parse(text) : null } catch { json = null }

        if (response.ok && json?.ok !== false) return json
        lastError = json?.error || `Request failed: ${method} ${path}`
      } catch (e) {
        lastError = e instanceof Error ? e.message : `Request failed: ${method} ${path}`
      }
    }

    throw new Error(lastError || 'Unable to save meeting.')
  }

  function openCreateMeeting(day?: Date) {
    const d = day || selectedDate
    const start = new Date(d)
    start.setHours(10, 0, 0, 0)

    setMeetingForm({
      title: '',
      prospect_name: '',
      company_name: '',
      status: 'scheduled',
      channel: 'Discovery',
      start_at: start.toISOString().slice(0, 16),
      end_at: '',
      location: '',
      objective: '',
      next_action: '',
      notes: '',
    })
    setSelectedMeeting(null)
    setModalMode('create')
  }

  function openViewMeeting(meeting: AnyRow) {
    setSelectedMeeting(meeting)
    setMeetingForm({
      title: meetingTitle(meeting),
      prospect_name: meetingProspect(meeting),
      company_name: meeting.company_name || meeting.partner_name || '',
      status: meetingStatus(meeting),
      channel: meetingChannel(meeting),
      start_at: meetingStart(meeting)?.toISOString().slice(0, 16) || '',
      end_at: meetingEnd(meeting)?.toISOString().slice(0, 16) || '',
      location: meeting.location || meeting.city || '',
      objective: meeting.objective || meeting.description || meeting.notes || '',
      next_action: meeting.next_action || meeting.follow_up_notes || '',
      notes: meeting.notes || '',
    })
    setModalMode('view')
  }

  function openEditMeeting() {
    if (!selectedMeeting) return
    setModalMode('edit')
  }

  async function saveMeeting() {
    setLoading(true)
    setError('')

    try {
      const payload = {
        ...meetingForm,
        start_at: meetingForm.start_at ? new Date(meetingForm.start_at).toISOString() : null,
        end_at: meetingForm.end_at ? new Date(meetingForm.end_at).toISOString() : null,
      }

      if (modalMode === 'create') {
        await mutateMeeting('POST', payload)
      }

      if (modalMode === 'edit' && selectedMeeting?.id) {
        await mutateMeeting('PATCH', payload, selectedMeeting.id)
      }

      setModalMode(null)
      setSelectedMeeting(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save meeting.')
    } finally {
      setLoading(false)
    }
  }

  async function deleteMeeting() {
    if (!selectedMeeting?.id) return
    if (!window.confirm('Delete this appointment? This cannot be undone.')) return

    setLoading(true)
    setError('')

    try {
      await mutateMeeting('DELETE', undefined, selectedMeeting.id)
      setModalMode(null)
      setSelectedMeeting(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to delete meeting.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const sortedMeetings = useMemo(() => {
    return meetings.slice().sort((a, b) => {
      const da = meetingStart(a)?.getTime() || 0
      const db = meetingStart(b)?.getTime() || 0
      return da - db
    })
  }, [meetings])

  const dayMeetings = sortedMeetings.filter((meeting) => sameDay(meetingStart(meeting), selectedDate))
  const week = weekDays(selectedDate)
  const weekMeetings = sortedMeetings.filter((meeting) => week.some((day) => sameDay(meetingStart(meeting), day)))
  const month = monthDays(selectedDate)
  const monthMeetings = sortedMeetings.filter((meeting) => {
    const start = meetingStart(meeting)
    return start && start.getMonth() === selectedDate.getMonth() && start.getFullYear() === selectedDate.getFullYear()
  })

  const upcoming = sortedMeetings.filter((meeting) => {
    const start = meetingStart(meeting)
    return start && start >= startOfDay(new Date())
  })

  const overdueTasks = tasks.filter((task) => {
    const due = normalizeDate(task.due_at || task.due_date || task.end_at)
    return due && due < startOfDay(new Date()) && !String(task.status || '').toLowerCase().includes('done')
  })

  const metrics = [
    { label: 'Meetings today', value: dayMeetings.length, helper: 'Selected day schedule', icon: '📅' },
    { label: 'This week', value: weekMeetings.length, helper: 'Weekly calendar load', icon: '🗓️' },
    { label: 'Upcoming', value: upcoming.length, helper: 'Future meetings', icon: '🚀' },
    { label: 'Overdue tasks', value: overdueTasks.length, helper: 'Needs manager attention', icon: '⚠️' },
  ]

  const visibleMeetings =
    view === 'day' ? dayMeetings :
    view === 'week' ? weekMeetings :
    view === 'month' ? monthMeetings :
    sortedMeetings

  return (
    <main className={styles.workspace}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>B2B execution calendar</span>
          <h1>Meetings, follow-ups & live calendar command</h1>
          <p>Planifiez, inspectez et pilotez les rendez-vous B2B avec vues jour, semaine, mois, board, cartes modernes et synchronisation live.</p>
        </div>

        <aside className={styles.heroCommand}>
          <span>Selected date</span>
          <strong>{formatDate(selectedDate)}</strong>
          <input type="date" value={toInputDate(selectedDate)} onChange={(e) => setSelectedDate(startOfDay(new Date(e.target.value)))} />
          <button type="button" onClick={load} disabled={loading}>{loading ? 'Syncing…' : 'Sync live'}</button>
          <button type="button" className={styles.createAppointmentButton} onClick={() => openCreateMeeting()}>+ Create appointment</button>
        </aside>
      </section>

      {error && (
        <section className={styles.warning}>
          <strong>Workspace sync warning</strong>
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
          {(['day', 'week', 'month', 'board'] as ViewMode[]).map((item) => (
            <button key={item} type="button" className={view === item ? styles.activeView : ''} onClick={() => setView(item)}>
              {item === 'day' ? 'Day' : item === 'week' ? 'Week' : item === 'month' ? 'Month' : 'Board'}
            </button>
          ))}
        </div>

        <div className={styles.dateNav}>
          <button type="button" onClick={() => setSelectedDate(addDays(selectedDate, view === 'month' ? -30 : view === 'week' ? -7 : -1))}>← Previous</button>
          <button type="button" onClick={() => setSelectedDate(startOfDay(new Date()))}>Today</button>
          <button type="button" onClick={() => setSelectedDate(addDays(selectedDate, view === 'month' ? 30 : view === 'week' ? 7 : 1))}>Next →</button>
        </div>
      </section>

      {view === 'week' && (
        <section className={styles.weekCalendar}>
          {week.map((day) => {
            const items = sortedMeetings.filter((meeting) => sameDay(meetingStart(meeting), day))
            return (
              <article key={day.toISOString()} className={sameDay(day, selectedDate) ? styles.selectedDayColumn : ''}>
                <header>
                  <span>{new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(day)}</span>
                  <strong>{day.getDate()}</strong>
                </header>
                <div className={styles.dayMeetings}>
                  {items.slice(0, 4).map((meeting) => (
                    <button key={meeting.id || `${meetingTitle(meeting)}-${meetingStart(meeting)}`} type="button" onClick={() => openViewMeeting(meeting)}>
                      <strong>{formatTime(meetingStart(meeting))}</strong>
                      <span>{meetingProspect(meeting)}</span>
                    </button>
                  ))}
                  {!items.length && <p>No meeting</p>}
                </div>
              </article>
            )
          })}
        </section>
      )}

      {view === 'month' && (
        <section className={styles.monthShell}>
          <div className={styles.monthHeader}>
            <div>
              <span>Monthly calendar</span>
              <h2>{new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(selectedDate)}</h2>
              <p>Click any full day block to inspect the day or create an appointment directly inside that date.</p>
            </div>
            <button type="button" onClick={() => openCreateMeeting(selectedDate)}>+ Create appointment</button>
          </div>

          <div className={styles.weekdayHeader}>
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => <span key={day}>{day}</span>)}
          </div>

          <section className={styles.monthCalendar}>
            {month.map((day) => {
              const items = sortedMeetings.filter((meeting) => sameDay(meetingStart(meeting), day))
              const muted = day.getMonth() !== selectedDate.getMonth()
              const active = sameDay(day, selectedDate)

              return (
                <article
                  key={day.toISOString()}
                  className={`${muted ? styles.mutedMonthDay : ''} ${active ? styles.monthDaySelected : ''}`}
                  onClick={() => setSelectedDate(day)}
                >
                  <header>
                    <div>
                      <strong>{new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(day)}</strong>
                      <span>{day.getDate()}</span>
                    </div>
                    {items.length > 0 && <em>{items.length} meeting{items.length > 1 ? 's' : ''}</em>}
                  </header>

                  <div className={styles.monthDayContent}>
                    {items.slice(0, 3).map((meeting) => (
                      <button
                        key={meeting.id || `${meetingTitle(meeting)}-${meetingStart(meeting)}`}
                        type="button"
                        onClick={(event) => { event.stopPropagation(); openViewMeeting(meeting) }}
                      >
                        <strong>{formatTime(meetingStart(meeting))}</strong>
                        <span>{meetingProspect(meeting)}</span>
                      </button>
                    ))}

                    {!items.length && !muted && (
                      <button
                        type="button"
                        className={styles.monthCreateMini}
                        onClick={(event) => { event.stopPropagation(); openCreateMeeting(day) }}
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
          </section>
        </section>
      )}

      <section className={styles.executionGrid}>
        <div className={styles.meetingsPanel}>
          <div className={styles.panelHeader}>
            <div>
              <span>Live schedule board</span>
              <h2>{view === 'day' ? 'Daily meetings' : view === 'week' ? 'Weekly meetings' : view === 'month' ? 'Monthly meetings' : 'All meeting cards'}</h2>
              <p>Cards are clickable and open a production-ready meeting command record.</p>
            </div>
          </div>

          <div className={styles.meetingCards}>
            {visibleMeetings.map((meeting) => (
              <article key={meeting.id || `${meetingTitle(meeting)}-${meetingStart(meeting)}`} className={styles.meetingCard} onClick={() => openViewMeeting(meeting)}>
                <div className={styles.meetingCardTop}>
                  <div className={styles.meetingIcon}>🤝</div>
                  <span>{meetingStatus(meeting)}</span>
                </div>
                <h3>{meetingTitle(meeting)}</h3>
                <p>{meetingProspect(meeting)}</p>

                <div className={styles.meetingMeta}>
                  <span>📅 {formatDate(meetingStart(meeting))}</span>
                  <span>🕒 {formatTime(meetingStart(meeting))}{meetingEnd(meeting) ? ` → ${formatTime(meetingEnd(meeting))}` : ''}</span>
                  <span>📍 {meeting.location || meeting.city || meetingChannel(meeting)}</span>
                </div>

                <div className={styles.meetingFooter}>
                  <button type="button" onClick={(event) => { event.stopPropagation(); openViewMeeting(meeting) }}>Open meeting</button>
                  <strong>{meeting.priority || meeting.relationship_warmth || 'Execution'}</strong>
                </div>
              </article>
            ))}

            {!visibleMeetings.length && (
              <article className={styles.emptyState}>
                <div>📭</div>
                <h3>No meetings in this view</h3>
                <p>Create or sync meetings to activate the calendar. Use the date selector, weekly view or month view to inspect schedule coverage.</p>
              </article>
            )}
          </div>
        </div>

        <aside className={styles.commandPanel}>
          <div className={styles.panelHeader}>
            <div>
              <span>Execution readiness</span>
              <h2>Manager cockpit</h2>
              <p>Use this area to keep meetings tied to follow-ups, tasks, proposals and reporting discipline.</p>
            </div>
          </div>

          <div className={styles.commandList}>
            <article><div>✅</div><h3>Before meeting</h3><p>Confirm decision maker, objective, service fit and next action hypothesis.</p></article>
            <article><div>🧠</div><h3>During meeting</h3><p>Capture objections, family service opportunity, timeline and commercial temperature.</p></article>
            <article><div>🚀</div><h3>After meeting</h3><p>Create follow-up task, proposal draft or next call within 24 hours.</p></article>
            <article><div>📊</div><h3>Friday reporting</h3><p>Feed weekly KPIs with booked, completed, delayed and converted meetings.</p></article>
          </div>
        </aside>
      </section>

      {modalMode && (
        <div className={styles.modalBackdrop}>
          <section className={styles.meetingModal}>
            <div className={styles.modalHeader}>
              <div>
                <span>{modalMode === 'create' ? 'Create appointment' : modalMode === 'edit' ? 'Edit appointment' : 'Meeting command record'}</span>
                <h2>{modalMode === 'create' ? 'New B2B appointment' : meetingForm.title || 'B2B partnership meeting'}</h2>
                <p>{meetingForm.prospect_name || 'Prospect pending'} · {meetingForm.status || 'scheduled'}</p>
              </div>
              <button type="button" onClick={() => { setModalMode(null); setSelectedMeeting(null) }}>×</button>
            </div>

            {modalMode === 'view' && selectedMeeting ? (
              <>
                <div className={styles.modalMetrics}>
                  <article><span>Date</span><strong>{formatDate(meetingStart(selectedMeeting))}</strong></article>
                  <article><span>Start</span><strong>{formatTime(meetingStart(selectedMeeting))}</strong></article>
                  <article><span>Channel</span><strong>{meetingChannel(selectedMeeting)}</strong></article>
                  <article><span>Status</span><strong>{meetingStatus(selectedMeeting)}</strong></article>
                </div>

                <div className={styles.modalGrid}>
                  <article>
                    <h3>Objective</h3>
                    <p>{selectedMeeting.objective || selectedMeeting.notes || selectedMeeting.description || 'No objective captured yet.'}</p>
                  </article>
                  <article>
                    <h3>Next action</h3>
                    <p>{selectedMeeting.next_action || selectedMeeting.follow_up_notes || 'Define follow-up, task, proposal or next call.'}</p>
                  </article>
                  <article>
                    <h3>Production checklist</h3>
                    <p>Confirm owner, decision maker, timing, objections, proposal status and next deadline before closing the meeting record.</p>
                  </article>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.secondaryButton} onClick={() => { setModalMode(null); setSelectedMeeting(null) }}>Close</button>
                  <button type="button" onClick={openEditMeeting}>Edit appointment</button>
                  <button type="button" className={styles.deleteButton} onClick={deleteMeeting}>Delete</button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.meetingFormGrid}>
                  <label>
                    Appointment title
                    <input value={meetingForm.title || ''} onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })} placeholder="Discovery meeting, proposal review..." />
                  </label>

                  <label>
                    Prospect / account
                    <input value={meetingForm.prospect_name || ''} onChange={(e) => setMeetingForm({ ...meetingForm, prospect_name: e.target.value })} placeholder="Hotel, clinic, decision maker..." />
                  </label>

                  <label>
                    Status
                    <select value={meetingForm.status || 'scheduled'} onChange={(e) => setMeetingForm({ ...meetingForm, status: e.target.value })}>
                      <option value="scheduled">Scheduled</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="rescheduled">Rescheduled</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </label>

                  <label>
                    Channel
                    <select value={meetingForm.channel || 'Discovery'} onChange={(e) => setMeetingForm({ ...meetingForm, channel: e.target.value })}>
                      <option value="Discovery">Discovery</option>
                      <option value="Call">Call</option>
                      <option value="Google Meet">Google Meet</option>
                      <option value="In person">In person</option>
                      <option value="Proposal review">Proposal review</option>
                      <option value="Follow-up">Follow-up</option>
                    </select>
                  </label>

                  <label>
                    Start date & time
                    <input type="datetime-local" value={meetingForm.start_at || ''} onChange={(e) => setMeetingForm({ ...meetingForm, start_at: e.target.value })} />
                  </label>

                  <label>
                    End date & time
                    <input type="datetime-local" value={meetingForm.end_at || ''} onChange={(e) => setMeetingForm({ ...meetingForm, end_at: e.target.value })} />
                  </label>

                  <label className={styles.fullField}>
                    Location / link
                    <input value={meetingForm.location || ''} onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })} placeholder="Address, Google Meet, phone call..." />
                  </label>

                  <label className={styles.fullField}>
                    Objective
                    <textarea value={meetingForm.objective || ''} onChange={(e) => setMeetingForm({ ...meetingForm, objective: e.target.value })} placeholder="Commercial objective, context, expected decision..." />
                  </label>

                  <label className={styles.fullField}>
                    Next action
                    <textarea value={meetingForm.next_action || ''} onChange={(e) => setMeetingForm({ ...meetingForm, next_action: e.target.value })} placeholder="Follow-up, proposal, next call, internal task..." />
                  </label>

                  <label className={styles.fullField}>
                    Notes
                    <textarea value={meetingForm.notes || ''} onChange={(e) => setMeetingForm({ ...meetingForm, notes: e.target.value })} placeholder="Internal notes..." />
                  </label>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.secondaryButton} onClick={() => { setModalMode(null); setSelectedMeeting(null) }}>Cancel</button>
                  <button type="button" disabled={loading} onClick={saveMeeting}>{loading ? 'Saving…' : modalMode === 'create' ? 'Create appointment' : 'Save changes'}</button>
                  {modalMode === 'edit' && selectedMeeting?.id && <button type="button" className={styles.deleteButton} onClick={deleteMeeting}>Delete</button>}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from './B2BTasksPremiumWorkspace.module.css'

type AnyRow = Record<string, any>
type ViewMode = 'day' | 'week' | 'month' | 'board'
type ModalMode = 'create' | 'view' | 'edit' | null

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
  if (Array.isArray(payload?.tasks)) return payload.tasks
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.rows)) return payload.rows
  return []
}

function taskTitle(row: AnyRow) {
  return row.title || row.name || row.subject || row.task_name || 'B2B execution task'
}

function taskStatus(row: AnyRow) {
  return row.status || row.task_status || 'todo'
}

function taskPriority(row: AnyRow) {
  return row.priority || row.priority_score || row.urgency || 'normal'
}

function taskProspect(row: AnyRow) {
  return row.prospect_name || row.company_name || row.account_name || row.client_name || 'Prospect pending'
}

function taskOwner(row: AnyRow) {
  return row.owner_name || row.assignee_name || row.created_by_name || row.user_name || 'Owner pending'
}

function taskStart(row: AnyRow) {
  return normalizeDate(row.start_at || row.scheduled_start || row.starts_at || row.scheduled_at || row.date)
}

function taskDue(row: AnyRow) {
  return normalizeDate(row.due_at || row.due_date || row.end_at || row.scheduled_end || row.ends_at || row.scheduled_at || row.date)
}

function sameDay(a: Date | null, b: Date) {
  if (!a) return false
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

function weekDays(anchor: Date) {
  const day = anchor.getDay() || 7
  const monday = addDays(startOfDay(anchor), 1 - day)
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index))
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

const STATUS_LANES = [
  { key: 'todo', label: 'À faire', icon: '📌' },
  { key: 'planned', label: 'Planifiée', icon: '🗓️' },
  { key: 'in_progress', label: 'En cours', icon: '⚡' },
  { key: 'waiting', label: 'En attente', icon: '⏳' },
  { key: 'done', label: 'Terminée', icon: '✅' },
  { key: 'blocked', label: 'Bloquée', icon: '🚨' },
]

export default function B2BTasksPremiumWorkspace() {
  const [view, setView] = useState<ViewMode>('week')
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()))
  const [tasks, setTasks] = useState<AnyRow[]>([])
  const [prospects, setProspects] = useState<AnyRow[]>([])
  const [selectedTask, setSelectedTask] = useState<AnyRow | null>(null)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [taskForm, setTaskForm] = useState<AnyRow>({
    title: '',
    prospect_name: '',
    assignee_name: '',
    status: 'todo',
    priority: 'normal',
    start_at: new Date().toISOString().slice(0, 16),
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
      const [tasksPayload, prospectsPayload] = await Promise.allSettled([
        fetchJson('/api/b2b-partnerships/tasks'),
        fetchJson('/api/b2b-partnerships/prospects?limit=160'),
      ])

      if (tasksPayload.status === 'fulfilled') setTasks(normalizeArray(tasksPayload.value))
      if (prospectsPayload.status === 'fulfilled') setProspects(normalizeArray(prospectsPayload.value))

      const failures = [tasksPayload, prospectsPayload]
        .filter((item) => item.status === 'rejected')
        .map((item: any) => item.reason?.message)
        .filter(Boolean)

      if (failures.length) setError(failures.join(' · '))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sync tasks workspace.')
    } finally {
      setLoading(false)
    }
  }

  async function mutateTask(method: 'POST' | 'PATCH' | 'DELETE', payload?: AnyRow, id?: string) {
    const paths =
      method === 'POST'
        ? ['/api/b2b-partnerships/tasks']
        : [
            `/api/b2b-partnerships/tasks/${id}`,
            `/api/b2b-partnerships/tasks?id=${id}`,
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

    throw new Error(lastError || 'Unable to save task.')
  }

  useEffect(() => {
    load()
  }, [])

  const sortedTasks = useMemo(() => {
    return tasks.slice().sort((a, b) => {
      const da = taskDue(a)?.getTime() || 0
      const db = taskDue(b)?.getTime() || 0
      return da - db
    })
  }, [tasks])

  const week = weekDays(selectedDate)
  const month = monthDays(selectedDate)

  const dayTasks = sortedTasks.filter((task) => sameDay(taskDue(task), selectedDate))
  const weekTasks = sortedTasks.filter((task) => week.some((day) => sameDay(taskDue(task), day)))
  const monthTasks = sortedTasks.filter((task) => {
    const due = taskDue(task)
    return due && due.getMonth() === selectedDate.getMonth() && due.getFullYear() === selectedDate.getFullYear()
  })

  const overdueTasks = sortedTasks.filter((task) => {
    const due = taskDue(task)
    return due && due < startOfDay(new Date()) && !String(taskStatus(task)).toLowerCase().includes('done')
  })

  const doneTasks = sortedTasks.filter((task) => String(taskStatus(task)).toLowerCase().includes('done'))
  const activeTasks = sortedTasks.filter((task) => !String(taskStatus(task)).toLowerCase().includes('done'))

  const visibleTasks =
    view === 'day' ? dayTasks :
    view === 'week' ? weekTasks :
    view === 'month' ? monthTasks :
    sortedTasks

  const metrics = [
    { label: 'Tasks today', value: dayTasks.length, helper: 'Selected day execution', icon: '📌' },
    { label: 'This week', value: weekTasks.length, helper: 'Weekly task load', icon: '🗓️' },
    { label: 'Active', value: activeTasks.length, helper: 'Open execution items', icon: '⚡' },
    { label: 'Overdue', value: overdueTasks.length, helper: 'Manager attention', icon: '🚨' },
    { label: 'Completed', value: doneTasks.length, helper: 'Execution closed', icon: '✅' },
  ]

  function openCreateTask(day?: Date) {
    const d = day || selectedDate
    const start = new Date(d)
    start.setHours(9, 0, 0, 0)

    const due = new Date(d)
    due.setHours(17, 0, 0, 0)

    setSelectedTask(null)
    setTaskForm({
      title: '',
      prospect_name: '',
      assignee_name: '',
      status: 'todo',
      priority: 'normal',
      start_at: start.toISOString().slice(0, 16),
      due_at: due.toISOString().slice(0, 16),
      objective: '',
      next_action: '',
      notes: '',
    })
    setModalMode('create')
  }

  function openViewTask(task: AnyRow) {
    setSelectedTask(task)
    setTaskForm({
      title: taskTitle(task),
      prospect_name: taskProspect(task),
      assignee_name: taskOwner(task),
      status: taskStatus(task),
      priority: taskPriority(task),
      start_at: taskStart(task)?.toISOString().slice(0, 16) || '',
      due_at: taskDue(task)?.toISOString().slice(0, 16) || '',
      objective: task.objective || task.description || '',
      next_action: task.next_action || '',
      notes: task.notes || task.comment || '',
    })
    setModalMode('view')
  }

  function openEditTask() {
    if (!selectedTask) return
    setModalMode('edit')
  }

  async function saveTask() {
    setLoading(true)
    setError('')

    try {
      const payload = {
        ...taskForm,
        start_at: taskForm.start_at ? new Date(taskForm.start_at).toISOString() : null,
        due_at: taskForm.due_at ? new Date(taskForm.due_at).toISOString() : null,
      }

      if (modalMode === 'create') await mutateTask('POST', payload)
      if (modalMode === 'edit' && selectedTask?.id) await mutateTask('PATCH', payload, selectedTask.id)

      setModalMode(null)
      setSelectedTask(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to save task.')
    } finally {
      setLoading(false)
    }
  }

  async function deleteTask() {
    if (!selectedTask?.id) return
    if (!window.confirm('Delete this task? This cannot be undone.')) return

    setLoading(true)
    setError('')

    try {
      await mutateTask('DELETE', undefined, selectedTask.id)
      setModalMode(null)
      setSelectedTask(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to delete task.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={styles.workspace}>
      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>B2B task execution OS</span>
          <h1>Tasks, planning & execution calendar</h1>
          <p>Planifiez, ouvrez, modifiez et supprimez les tâches B2B avec vues jour, semaine, mois et board, synchronisées pour une exécution production-ready.</p>
        </div>

        <aside className={styles.heroCommand}>
          <span>Selected date</span>
          <strong>{formatDate(selectedDate)}</strong>
          <input type="date" value={toInputDate(selectedDate)} onChange={(e) => setSelectedDate(startOfDay(new Date(e.target.value)))} />
          <button type="button" onClick={load} disabled={loading}>{loading ? 'Syncing…' : 'Sync live'}</button>
          <button type="button" className={styles.createTaskButton} onClick={() => openCreateTask()}>+ Create task</button>
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
            const items = sortedTasks.filter((task) => sameDay(taskDue(task), day))
            return (
              <article key={day.toISOString()} className={sameDay(day, selectedDate) ? styles.selectedDayColumn : ''}>
                <header>
                  <span>{new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(day)}</span>
                  <strong>{day.getDate()}</strong>
                </header>
                <div className={styles.dayTasks}>
                  {items.slice(0, 5).map((task) => (
                    <button key={task.id || `${taskTitle(task)}-${taskDue(task)}`} type="button" onClick={() => openViewTask(task)}>
                      <strong>{formatTime(taskStart(task))} → {formatTime(taskDue(task))}</strong>
                      <span>{taskTitle(task)}</span>
                    </button>
                  ))}
                  {!items.length && <button type="button" className={styles.inlineCreate} onClick={() => openCreateTask(day)}>+ Add task</button>}
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
              <span>Monthly task calendar</span>
              <h2>{new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(selectedDate)}</h2>
              <p>Click any full day block to select it, inspect tasks or create a new execution task directly inside that date.</p>
            </div>
            <button type="button" onClick={() => openCreateTask(selectedDate)}>+ Create task</button>
          </div>

          <div className={styles.weekdayHeader}>
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => <span key={day}>{day}</span>)}
          </div>

          <section className={styles.monthCalendar}>
            {month.map((day) => {
              const items = sortedTasks.filter((task) => sameDay(taskDue(task), day))
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
                    {items.length > 0 && <em>{items.length} task{items.length > 1 ? 's' : ''}</em>}
                  </header>

                  <div className={styles.monthDayContent}>
                    {items.slice(0, 4).map((task) => (
                      <button
                        key={task.id || `${taskTitle(task)}-${taskDue(task)}`}
                        type="button"
                        onClick={(event) => { event.stopPropagation(); openViewTask(task) }}
                      >
                        <strong>{formatTime(taskStart(task))} → {formatTime(taskDue(task))}</strong>
                        <span>{taskTitle(task)}</span>
                      </button>
                    ))}

                    {!items.length && !muted && (
                      <button
                        type="button"
                        className={styles.monthCreateMini}
                        onClick={(event) => { event.stopPropagation(); openCreateTask(day) }}
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

      {view === 'board' && (
        <section className={styles.board}>
          {STATUS_LANES.map((lane) => {
            const laneTasks = sortedTasks.filter((task) => String(taskStatus(task)).toLowerCase() === lane.key)
            return (
              <article key={lane.key} className={styles.boardLane}>
                <header>
                  <div>{lane.icon}</div>
                  <span>{lane.label}</span>
                  <strong>{laneTasks.length}</strong>
                </header>
                <div>
                  {laneTasks.map((task) => (
                    <button key={task.id || taskTitle(task)} type="button" onClick={() => openViewTask(task)}>
                      <strong>{taskTitle(task)}</strong>
                      <span>{taskProspect(task)} · Starts {formatDate(taskStart(task))} · Due {formatDate(taskDue(task))}</span>
                    </button>
                  ))}
                  {!laneTasks.length && <p>No task in this lane.</p>}
                </div>
              </article>
            )
          })}
        </section>
      )}

      <section className={styles.executionGrid}>
        <div className={styles.tasksPanel}>
          <div className={styles.panelHeader}>
            <div>
              <span>Live task board</span>
              <h2>{view === 'day' ? 'Daily tasks' : view === 'week' ? 'Weekly tasks' : view === 'month' ? 'Monthly tasks' : 'All task cards'}</h2>
              <p>Every card is clickable and opens a production task command record.</p>
            </div>
          </div>

          <div className={styles.taskCards}>
            {visibleTasks.map((task) => (
              <article key={task.id || `${taskTitle(task)}-${taskDue(task)}`} className={styles.taskCard} onClick={() => openViewTask(task)}>
                <div className={styles.taskCardTop}>
                  <div className={styles.taskIcon}>✅</div>
                  <span>{taskStatus(task)}</span>
                </div>

                <h3>{taskTitle(task)}</h3>
                <p>{taskProspect(task)}</p>

                <div className={styles.taskMeta}>
                  <span>🚀 Starts {formatDate(taskStart(task))} · {formatTime(taskStart(task))}</span>
                  <span>⏳ Due {formatDate(taskDue(task))} · {formatTime(taskDue(task))}</span>
                  <span>👤 {taskOwner(task)}</span>
                  <span>🔥 {taskPriority(task)}</span>
                </div>

                <div className={styles.taskFooter}>
                  <button type="button" onClick={(event) => { event.stopPropagation(); openViewTask(task) }}>Open task</button>
                  <strong>{task.next_action || 'Execution follow-up'}</strong>
                </div>
              </article>
            ))}

            {!visibleTasks.length && (
              <article className={styles.emptyState}>
                <div>📭</div>
                <h3>No tasks in this view</h3>
                <p>Create or sync tasks to activate the board. Use the date selector, weekly view, monthly view or board lanes to manage execution.</p>
              </article>
            )}
          </div>
        </div>

        <aside className={styles.commandPanel}>
          <div className={styles.panelHeader}>
            <div>
              <span>Execution discipline</span>
              <h2>Manager cockpit</h2>
              <p>Production task management should protect follow-up, ownership, deadlines and weekly reporting.</p>
            </div>
          </div>

          <div className={styles.commandList}>
            <article><div>🎯</div><h3>Clear ownership</h3><p>Every task must have an owner, deadline, status and next action.</p></article>
            <article><div>🚨</div><h3>Overdue pressure</h3><p>Overdue tasks should be surfaced and closed by manager supervision.</p></article>
            <article><div>🤝</div><h3>Prospect linked</h3><p>Tasks should stay tied to prospects, meetings, proposals and outreach.</p></article>
            <article><div>📊</div><h3>Reporting ready</h3><p>Closed, blocked, delayed and active tasks feed weekly B2B KPIs.</p></article>
          </div>
        </aside>
      </section>

      {modalMode && (
        <div className={styles.modalBackdrop}>
          <section className={styles.taskModal}>
            <div className={styles.modalHeader}>
              <div>
                <span>{modalMode === 'create' ? 'Create task' : modalMode === 'edit' ? 'Edit task' : 'Task command record'}</span>
                <h2>{modalMode === 'create' ? 'New B2B execution task' : taskForm.title || 'B2B execution task'}</h2>
                <p>{taskForm.prospect_name || 'Prospect pending'} · {taskForm.status || 'todo'}</p>
              </div>
              <button type="button" onClick={() => { setModalMode(null); setSelectedTask(null) }}>×</button>
            </div>

            {modalMode === 'view' && selectedTask ? (
              <>
                <div className={styles.modalMetrics}>
                  <article><span>Start</span><strong>{formatDate(taskStart(selectedTask))} · {formatTime(taskStart(selectedTask))}</strong></article>
                  <article><span>Due</span><strong>{formatDate(taskDue(selectedTask))} · {formatTime(taskDue(selectedTask))}</strong></article>
                  <article><span>Owner</span><strong>{taskOwner(selectedTask)}</strong></article>
                  <article><span>Status</span><strong>{taskStatus(selectedTask)}</strong></article>
                </div>

                <div className={styles.modalGrid}>
                  <article>
                    <h3>Objective</h3>
                    <p>{selectedTask.objective || selectedTask.description || 'No objective captured yet.'}</p>
                  </article>
                  <article>
                    <h3>Next action</h3>
                    <p>{selectedTask.next_action || 'Define next action, follow-up, proposal or closing step.'}</p>
                  </article>
                  <article>
                    <h3>Production checklist</h3>
                    <p>Confirm owner, due date, status, prospect link, priority, blockers and closure notes before marking as done.</p>
                  </article>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.secondaryButton} onClick={() => { setModalMode(null); setSelectedTask(null) }}>Close</button>
                  <button type="button" onClick={openEditTask}>Edit task</button>
                  <button type="button" className={styles.deleteButton} onClick={deleteTask}>Delete</button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.taskFormGrid}>
                  <label>
                    Task title
                    <input value={taskForm.title || ''} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Call hotel, prepare proposal, follow-up..." />
                  </label>

                  <label>
                    Prospect / account
                    <input value={taskForm.prospect_name || ''} onChange={(e) => setTaskForm({ ...taskForm, prospect_name: e.target.value })} placeholder="Hotel, clinic, decision maker..." list="b2b-prospects" />
                    <datalist id="b2b-prospects">
                      {prospects.map((prospect) => <option key={prospect.id || prospect.name} value={prospect.name || prospect.prospect_name || prospect.company_name || ''} />)}
                    </datalist>
                  </label>

                  <label>
                    Owner / assignee
                    <input value={taskForm.assignee_name || ''} onChange={(e) => setTaskForm({ ...taskForm, assignee_name: e.target.value })} placeholder="Intern, manager, sales owner..." />
                  </label>

                  <label>
                    Status
                    <select value={taskForm.status || 'todo'} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}>
                      <option value="todo">À faire</option>
                      <option value="planned">Planifiée</option>
                      <option value="in_progress">En cours</option>
                      <option value="waiting">En attente</option>
                      <option value="done">Terminée</option>
                      <option value="blocked">Bloquée</option>
                    </select>
                  </label>

                  <label>
                    Priority
                    <select value={taskForm.priority || 'normal'} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </label>

                  <label>
                    Start date & time
                    <input type="datetime-local" value={taskForm.start_at || ''} onChange={(e) => setTaskForm({ ...taskForm, start_at: e.target.value })} />
                  </label>

                  <label>
                    Due date & time
                    <input type="datetime-local" value={taskForm.due_at || ''} onChange={(e) => setTaskForm({ ...taskForm, due_at: e.target.value })} />
                  </label>

                  <label className={styles.fullField}>
                    Objective
                    <textarea value={taskForm.objective || ''} onChange={(e) => setTaskForm({ ...taskForm, objective: e.target.value })} placeholder="Task goal, context and expected output..." />
                  </label>

                  <label className={styles.fullField}>
                    Next action
                    <textarea value={taskForm.next_action || ''} onChange={(e) => setTaskForm({ ...taskForm, next_action: e.target.value })} placeholder="What should happen after this task is completed?" />
                  </label>

                  <label className={styles.fullField}>
                    Notes
                    <textarea value={taskForm.notes || ''} onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })} placeholder="Internal notes, blockers, manager comments..." />
                  </label>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.secondaryButton} onClick={() => { setModalMode(null); setSelectedTask(null) }}>Cancel</button>
                  <button type="button" disabled={loading} onClick={saveTask}>{loading ? 'Saving…' : modalMode === 'create' ? 'Create task' : 'Save changes'}</button>
                  {modalMode === 'edit' && selectedTask?.id && <button type="button" className={styles.deleteButton} onClick={deleteTask}>Delete</button>}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  )
}

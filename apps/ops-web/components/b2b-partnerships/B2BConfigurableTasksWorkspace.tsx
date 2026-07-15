'use client'

import { useEffect, useMemo, useState } from 'react'
import styles from './B2BConfigurableTasksWorkspace.module.css'

type Prospect = { id: string; name: string; sector?: string | null; city?: string | null }
type Task = { id: string; title: string; description?: string | null; prospect_id?: string | null; prospect?: Prospect | null; assigned_to?: string | null; priority?: string | null; status?: string | null; start_at?: string | null; end_at?: string | null; due_date?: string | null; reminder_at?: string | null; task_type?: string | null; completion_notes?: string | null; next_action?: string | null }
type ConfigItem = { config_key: string; value: string[] | Record<string, unknown> }

type TaskForm = { id?: string; title: string; description: string; prospect_id: string; task_type: string; priority: string; status: string; start_date: string; start_time: string; end_date: string; end_time: string; reminder_date: string; reminder_time: string; next_action: string; completion_notes: string }

const emptyForm: TaskForm = { title: '', description: '', prospect_id: '', task_type: 'Commercial action', priority: 'Moyenne', status: 'À faire', start_date: '', start_time: '', end_date: '', end_time: '', reminder_date: '', reminder_time: '', next_action: '', completion_notes: '' }

async function readJson<T>(url: string): Promise<T> { const r = await fetch(url, { cache: 'no-store' }); const p = await r.json().catch(() => null); if (!r.ok || !p?.ok) throw new Error(p?.error || `Request failed: ${url}`); return p.data as T }
function listFromConfig(config: ConfigItem[], key: string, fallback: string[]) { const item = config.find((x) => x.config_key === key); return Array.isArray(item?.value) ? item.value.map(String) : fallback }
function combine(date: string, time: string) { if (!date) return null; return new Date(`${date}T${time || '09:00'}`).toISOString() }
function splitDate(value?: string | null) { if (!value) return ['', '']; const d = new Date(value); if (Number.isNaN(d.getTime())) return ['', '']; return [d.toISOString().slice(0,10), d.toTimeString().slice(0,5)] }
function fmt(value?: string | null) { if (!value) return '—'; return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) }

export default function B2BConfigurableTasksWorkspace() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [config, setConfig] = useState<ConfigItem[]>([])
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState<TaskForm | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function loadAll() {
    setError(null)
    try {
      const [taskRows, prospectRows, configRows] = await Promise.all([
        readJson<Task[]>('/api/b2b-partnerships/tasks'),
        readJson<Prospect[]>('/api/b2b-partnerships/prospects?limit=160'),
        readJson<ConfigItem[]>('/api/b2b-partnerships/config'),
      ])
      setTasks(taskRows)
      setProspects(prospectRows)
      setConfig(configRows)
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load tasks.') }
  }
  useEffect(() => { loadAll() }, [])

  const statuses = listFromConfig(config, 'task_statuses', ['À faire', 'Planifiée', 'En cours', 'En attente', 'Bloquée', 'Terminée', 'Annulée', 'Reportée'])
  const priorities = listFromConfig(config, 'task_priorities', ['Basse', 'Moyenne', 'Haute', 'Urgente'])

  const groups = useMemo(() => {
    const visible = tasks.filter((task) => filter === 'all' || task.status === filter)
    return statuses.map((status) => ({ status, rows: visible.filter((task) => (task.status || 'À faire') === status) }))
  }, [tasks, statuses, filter])

  const stats = { total: tasks.length, overdue: tasks.filter((t) => t.end_at && new Date(t.end_at) < new Date() && !['Done','Terminée','Cancelled','Annulée'].includes(String(t.status))).length, planned: tasks.filter((t) => t.start_at).length, completed: tasks.filter((t) => ['Done','Terminée'].includes(String(t.status))).length }

  function openEdit(task: Task) {
    const [sd, st] = splitDate(task.start_at); const [ed, et] = splitDate(task.end_at); const [rd, rt] = splitDate(task.reminder_at)
    setModal({ id: task.id, title: task.title, description: task.description || '', prospect_id: task.prospect_id || '', task_type: task.task_type || 'Commercial action', priority: task.priority || 'Moyenne', status: task.status || 'À faire', start_date: sd, start_time: st, end_date: ed, end_time: et, reminder_date: rd, reminder_time: rt, next_action: task.next_action || '', completion_notes: task.completion_notes || '' })
  }

  async function saveTask() {
    if (!modal) return
    setBusy(true)
    try {
      const payload = { id: modal.id, title: modal.title, description: modal.description, prospect_id: modal.prospect_id || null, task_type: modal.task_type, priority: modal.priority, status: modal.status, start_at: combine(modal.start_date, modal.start_time), end_at: combine(modal.end_date, modal.end_time), due_date: combine(modal.end_date, modal.end_time), reminder_at: combine(modal.reminder_date, modal.reminder_time), next_action: modal.next_action, completion_notes: modal.completion_notes }
      const response = await fetch('/api/b2b-partnerships/tasks/advanced', { method: modal.id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const result = await response.json()
      if (!response.ok || !result.ok) throw new Error(result.error || 'Unable to save task.')
      setModal(null)
      await loadAll()
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to save task.') } finally { setBusy(false) }
  }

  return <main className={styles.workspace}>
    <section className={styles.hero}><div><span className={styles.kicker}>Execution Scheduler</span><h1>Tâches configurables & planning commercial</h1><p>Planifiez chaque action avec début, fin, rappel, statut configurable, prospect lié, prochaine action et notes de clôture.</p><div className={styles.actions}><button onClick={() => setModal(emptyForm)}>Nouvelle tâche planifiée</button><button className={styles.secondary} onClick={loadAll}>Synchroniser</button></div></div><aside><strong>Planning discipline</strong><p>Chaque tâche doit avoir une fenêtre d’exécution claire, un statut et une prochaine action mesurable.</p></aside></section>
    {error && <section className={styles.error}>{error}<button onClick={loadAll}>Réessayer</button></section>}
    <section className={styles.stats}><Metric label="Total tâches" value={stats.total}/><Metric label="Planifiées" value={stats.planned}/><Metric label="En retard" value={stats.overdue}/><Metric label="Terminées" value={stats.completed}/></section>
    <section className={styles.toolbar}><select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">Tous statuts</option>{statuses.map((s) => <option key={s}>{s}</option>)}</select><button onClick={() => setModal(emptyForm)}>Créer tâche</button></section>
    <section className={styles.board}>{groups.map((group) => <article key={group.status} className={styles.lane}><header><strong>{group.status}</strong><span>{group.rows.length}</span></header><div>{group.rows.map((task) => <button key={task.id} className={styles.taskCard} onClick={() => openEdit(task)}><strong>{task.title}</strong><small>{task.prospect?.name || prospectName(prospects, task.prospect_id) || 'Sans prospect'}</small><span>{fmt(task.start_at)} → {fmt(task.end_at)}</span><em>{task.priority || 'Moyenne'}</em></button>)}</div></article>)}</section>
    {modal && <TaskModal form={modal} setForm={setModal} prospects={prospects} statuses={statuses} priorities={priorities} onSave={saveTask} onClose={() => setModal(null)} busy={busy}/>}  
  </main>
}
function Metric({ label, value }: { label: string; value: number }) { return <article className={styles.metric}><span>{label}</span><strong>{value}</strong></article> }
function prospectName(prospects: Prospect[], id?: string | null) { return prospects.find((p) => p.id === id)?.name }
function TaskModal({ form, setForm, prospects, statuses, priorities, onSave, onClose, busy }: any) { const set = (k: keyof TaskForm, v: string) => setForm((p: TaskForm) => ({ ...p, [k]: v })); return <div className={styles.modalBackdrop}><section className={styles.megaModal}><header><div><span className={styles.kicker}>Large execution modal</span><h2>{form.id ? 'Modifier tâche' : 'Nouvelle tâche B2B'}</h2><p>Définissez la fenêtre d’exécution, le statut, la priorité, le prospect lié et la clôture opérationnelle.</p></div><button onClick={onClose}>×</button></header><div className={styles.modalGrid}><label>Titre<input value={form.title} onChange={(e) => set('title', e.target.value)} /></label><label>Prospect<select value={form.prospect_id} onChange={(e) => set('prospect_id', e.target.value)}><option value="">Sans prospect</option>{prospects.map((p: Prospect) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Type<input value={form.task_type} onChange={(e) => set('task_type', e.target.value)} /></label><label>Statut<select value={form.status} onChange={(e) => set('status', e.target.value)}>{statuses.map((s: string) => <option key={s}>{s}</option>)}</select></label><label>Priorité<select value={form.priority} onChange={(e) => set('priority', e.target.value)}>{priorities.map((p: string) => <option key={p}>{p}</option>)}</select></label><label>Début date<input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} /></label><label>Début heure<input type="time" value={form.start_time} onChange={(e) => set('start_time', e.target.value)} /></label><label>Fin date<input type="date" value={form.end_date} onChange={(e) => set('end_date', e.target.value)} /></label><label>Fin heure<input type="time" value={form.end_time} onChange={(e) => set('end_time', e.target.value)} /></label><label>Rappel date<input type="date" value={form.reminder_date} onChange={(e) => set('reminder_date', e.target.value)} /></label><label>Rappel heure<input type="time" value={form.reminder_time} onChange={(e) => set('reminder_time', e.target.value)} /></label><label className={styles.wide}>Description<textarea value={form.description} onChange={(e) => set('description', e.target.value)} /></label><label className={styles.wide}>Prochaine action<textarea value={form.next_action} onChange={(e) => set('next_action', e.target.value)} /></label><label className={styles.wide}>Notes de clôture<textarea value={form.completion_notes} onChange={(e) => set('completion_notes', e.target.value)} /></label></div><footer><button className={styles.secondary} onClick={onClose}>Annuler</button><button onClick={onSave} disabled={busy}>{busy ? 'Enregistrement...' : 'Enregistrer'}</button></footer></section></div> }

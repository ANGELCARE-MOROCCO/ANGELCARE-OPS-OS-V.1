'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CalendarClock, CheckCircle2, History, MessageSquareText, Plus, RotateCcw, ShieldAlert, UserRoundCheck, X } from 'lucide-react'
import type { CrmCommunicationLog, CrmTask, CrmTaskPriority, CrmTaskStatus } from '../../customer-relationship-command/crm-activity'
import styles from '../enterprise-command.module.css'

type HistoryRecord = { id: string; action: string; object_id: string; actor_id: string | null; before_value: unknown; after_value: unknown; reason: string | null; created_at: string }
type Payload = { tasks: CrmTask[]; communications: CrmCommunicationLog[]; history: HistoryRecord[] }
type Envelope<T> = { data?: T; error?: { message?: string } }
type Mode = 'task' | 'communication' | null

const empty: Payload = { tasks: [], communications: [], history: [] }
const taskStatuses: CrmTaskStatus[] = ['open', 'in_progress', 'blocked', 'completed', 'cancelled']
const priorities: CrmTaskPriority[] = ['low', 'normal', 'high', 'critical']

function localInputDate(value?: string | null) {
  if (!value) return ''
  const date = new Date(value); if (Number.isNaN(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export function CustomerCrmActivityPanel({ customerId, canManageTasks, canLogCommunications }: { customerId: string; canManageTasks: boolean; canLogCommunications: boolean }) {
  const [data, setData] = useState<Payload>(empty)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<Mode>(null)
  const [editing, setEditing] = useState<CrmTask | null>(null)
  const [statusFilter, setStatusFilter] = useState('active')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [ownerFilter, setOwnerFilter] = useState('')
  const [communicationFilter, setCommunicationFilter] = useState('all')
  const [communicationActorFilter, setCommunicationActorFilter] = useState('')
  const [communicationDateFilter, setCommunicationDateFilter] = useState('')
  const [renderedAt] = useState(() => Date.now())
  const dialogRef = useRef<HTMLDialogElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  async function load() {
    setLoading(true); setError('')
    try {
      const response = await fetch(`/api/angelcare-marketplace/admin/customers/${customerId}/crm`, { cache: 'no-store' })
      const payload = await response.json() as Envelope<Payload>
      if (!response.ok || !payload.data) throw new Error(payload.error?.message || 'Activité CRM indisponible.')
      setData(payload.data)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Activité CRM indisponible.') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    let active = true
    void fetch(`/api/angelcare-marketplace/admin/customers/${customerId}/crm`, { cache: 'no-store' }).then(async (response) => {
      const payload = await response.json() as Envelope<Payload>
      if (!response.ok || !payload.data) throw new Error(payload.error?.message || 'Activité CRM indisponible.')
      if (active) setData(payload.data)
    }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : 'Activité CRM indisponible.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [customerId])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (mode && !dialog.open) dialog.showModal()
    if (!mode && dialog.open) dialog.close()
  }, [mode])

  const tasks = useMemo(() => data.tasks.filter((task) => {
    const statusOk = statusFilter === 'all' || (statusFilter === 'active' ? !['completed', 'cancelled'].includes(task.status) : statusFilter === 'overdue' ? Boolean(task.due_at && new Date(task.due_at).getTime() < renderedAt && !['completed', 'cancelled'].includes(task.status)) : task.status === statusFilter)
    const priorityOk = priorityFilter === 'all' || task.priority === priorityFilter
    const ownerOk = !ownerFilter.trim() || String(task.assignee_id || task.owner_id || '').toLowerCase().includes(ownerFilter.trim().toLowerCase())
    return statusOk && priorityOk && ownerOk
  }), [data.tasks, ownerFilter, priorityFilter, renderedAt, statusFilter])
  const communications = useMemo(() => data.communications.filter((item) => {
    const channelOk = communicationFilter === 'all' || item.channel === communicationFilter
    const actorOk = !communicationActorFilter.trim() || String(item.actor_id || '').toLowerCase().includes(communicationActorFilter.trim().toLowerCase())
    const dateOk = !communicationDateFilter || item.occurred_at.slice(0, 10) === communicationDateFilter
    return channelOk && actorOk && dateOk
  }), [communicationActorFilter, communicationDateFilter, communicationFilter, data.communications])

  async function mutateTask(taskId: string, patch: Record<string, unknown>, success: string) {
    if (!canManageTasks) return
    setBusy(true); setNotice('')
    try {
      const response = await fetch(`/api/angelcare-marketplace/admin/customers/${customerId}/crm/tasks/${taskId}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(patch) })
      const payload = await response.json() as Envelope<CrmTask>
      if (!response.ok) throw new Error(payload.error?.message || 'Mise à jour impossible.')
      setNotice(success); setEditing(null); setMode(null); await load()
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Mise à jour impossible.') }
    finally { setBusy(false) }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setNotice('')
    const form = new FormData(event.currentTarget)
    try {
      const isTask = mode === 'task'
      const endpoint = isTask ? `/api/angelcare-marketplace/admin/customers/${customerId}/crm/tasks` : `/api/angelcare-marketplace/admin/customers/${customerId}/crm/communications`
      const body = isTask ? {
        title: form.get('title'), description: form.get('description'), priority: form.get('priority'), assigneeId: form.get('assigneeId') || null,
        dueAt: form.get('dueAt') || null, nextAction: form.get('nextAction') || null,
      } : {
        channel: form.get('channel'), direction: form.get('direction'), occurredAt: form.get('occurredAt'), subject: form.get('subject'),
        summary: form.get('summary'), evidenceReference: form.get('evidenceReference') || null,
      }
      const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      const payload = await response.json() as Envelope<unknown>
      if (!response.ok) throw new Error(payload.error?.message || 'Enregistrement impossible.')
      setMode(null); setNotice(isTask ? 'Tâche CRM créée et auditée.' : 'Communication journalisée comme preuve CRM.'); await load()
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : 'Enregistrement impossible.') }
    finally { setBusy(false) }
  }

  return <section className={styles.crmOperatingSystem}>
    <header className={styles.crmOperatingHeader}><div><span>CRM TASK & COMMUNICATION AUTHORITY</span><h3>Planifier les suivis et conserver la preuve relationnelle.</h3><p>Les tâches sont opérables; les communications sont journalisées sans prétendre envoyer un message.</p></div><div className={styles.rowActions}><button className={styles.button} disabled={!canManageTasks} title={!canManageTasks ? 'Permission marketplace.crm.tasks.manage requise' : undefined} onClick={() => { setEditing(null); setMode('task') }}><Plus size={14}/>Créer une tâche</button><button className={styles.buttonSecondary} disabled={!canLogCommunications} title={!canLogCommunications ? 'Permission marketplace.crm.communications.log requise' : undefined} onClick={() => setMode('communication')}><MessageSquareText size={14}/>Journaliser un échange</button></div></header>
    {notice ? <div className={styles.notice}>{notice}</div> : null}
    {error ? <div className={styles.crmError}><ShieldAlert size={18}/><span>{error}</span><button className={styles.buttonSecondary} onClick={() => void load()}>Réessayer</button></div> : null}
    {loading ? <div className={styles.crmLoading}>Chargement des tâches, échanges et preuves…</div> : <div className={styles.crmOperatingGrid}>
      <section className={styles.panel}><div className={styles.panelTitle}><h3>Tâches & suivis</h3><span className={styles.chip}>{tasks.length}/{data.tasks.length}</span></div><div className={styles.crmFilters}><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="active">Actives</option><option value="overdue">En retard</option><option value="all">Tous statuts</option>{taskStatuses.map((status) => <option value={status} key={status}>{status}</option>)}</select><select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option value="all">Toutes priorités</option>{priorities.map((priority) => <option value={priority} key={priority}>{priority}</option>)}</select><input value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)} placeholder="Owner / assignee ID"/></div><div className={styles.crmTaskList}>{tasks.map((task) => <article key={task.id} data-priority={task.priority} data-status={task.status}><button className={styles.crmTaskMain} onClick={() => { setEditing(task); setMode('task') }}><div><span>{task.public_reference} · {task.priority}</span><strong>{task.title}</strong><small>{task.next_action || task.description || 'Aucune prochaine action précisée.'}</small></div><b>{task.status.replaceAll('_', ' ')}</b></button><footer><span><CalendarClock size={13}/>{task.due_at ? new Date(task.due_at).toLocaleString('fr-FR') : 'Sans échéance'}</span><span><UserRoundCheck size={13}/>{task.assignee_id || task.owner_id || 'Non assignée'}</span><div>{task.status !== 'completed' ? <button disabled={!canManageTasks || busy} onClick={() => void mutateTask(task.id, { status: 'completed' }, 'Tâche terminée et auditée.')}><CheckCircle2 size={13}/>Terminer</button> : <button disabled={!canManageTasks || busy} onClick={() => void mutateTask(task.id, { status: 'open' }, 'Tâche rouverte et auditée.')}><RotateCcw size={13}/>Rouvrir</button>}</div></footer></article>)}{!tasks.length ? <div className={styles.crmEmpty}>Aucune tâche dans cette file.</div> : null}</div></section>
      <section className={styles.panel}><div className={styles.panelTitle}><h3>Communications journalisées</h3><span className={styles.chip}>{communications.length}</span></div><div className={styles.crmFilters}><select value={communicationFilter} onChange={(event) => setCommunicationFilter(event.target.value)}><option value="all">Tous canaux</option>{['email','phone','whatsapp','meeting','visit','other'].map((channel) => <option value={channel} key={channel}>{channel}</option>)}</select><input type="date" aria-label="Date de communication" value={communicationDateFilter} onChange={(event) => setCommunicationDateFilter(event.target.value)}/><input value={communicationActorFilter} onChange={(event) => setCommunicationActorFilter(event.target.value)} placeholder="ID opérateur"/></div><div className={styles.crmCommunicationList}>{communications.map((item) => <article key={item.id}><span>{item.channel} · {item.direction}</span><strong>{item.subject || 'Communication sans objet'}</strong><p>{item.summary}</p><small>{new Date(item.occurred_at).toLocaleString('fr-FR')} · acteur {item.actor_id || 'système'}{item.evidence_reference ? ` · preuve ${item.evidence_reference}` : ''}</small></article>)}{!communications.length ? <div className={styles.crmEmpty}>Aucune communication journalisée pour ces filtres.</div> : null}</div></section>
      <section className={`${styles.panel} ${styles.crmHistoryPanel}`}><div className={styles.panelTitle}><h3><History size={15}/>Historique d’autorité</h3><span className={styles.chip}>{data.history.length}</span></div><div className={styles.crmHistoryList}>{data.history.slice(0, 40).map((item) => <div key={item.id}><i/><span><strong>{item.action.replaceAll('.', ' ')}</strong><small>{new Date(item.created_at).toLocaleString('fr-FR')} · {item.actor_id || 'système'} · {item.object_id}</small></span></div>)}{!data.history.length ? <div className={styles.crmEmpty}>Aucune transition auditée.</div> : null}</div></section>
    </div>}
    {mode ? <dialog ref={dialogRef} className={styles.governedModal} aria-labelledby="crm-action-title" onCancel={(event) => { event.preventDefault(); setMode(null); setEditing(null) }}><form ref={formRef} className={styles.governedModalBody} onSubmit={submit}><div className={styles.crmDialogTitle}><div><span>{mode === 'task' ? 'CRM TASK AUTHORITY' : 'IMMUTABLE COMMUNICATION LOG'}</span><h3 id="crm-action-title">{mode === 'task' ? editing ? 'Modifier la tâche' : 'Créer un suivi client' : 'Journaliser une communication'}</h3></div><button type="button" aria-label="Fermer" className={styles.buttonSecondary} onClick={() => { setMode(null); setEditing(null) }}><X size={15}/></button></div>{mode === 'task' ? <>
        <div className={styles.grid2}><label className={styles.field}><span>Titre</span><input name="title" defaultValue={editing?.title} required maxLength={180}/></label><label className={styles.field}><span>Priorité</span><select name="priority" defaultValue={editing?.priority || 'normal'}>{priorities.map((priority) => <option value={priority} key={priority}>{priority}</option>)}</select></label><label className={styles.field}><span>Assignée à (ID opérateur)</span><input name="assigneeId" defaultValue={editing?.assignee_id || ''}/></label><label className={styles.field}><span>Échéance</span><input name="dueAt" type="datetime-local" defaultValue={localInputDate(editing?.due_at)}/></label>{editing?<label className={styles.field}><span>Statut</span><select name="status" defaultValue={editing.status}>{taskStatuses.map((status)=><option value={status} key={status}>{status}</option>)}</select></label>:null}</div><label className={styles.field}><span>Prochaine action</span><input name="nextAction" defaultValue={editing?.next_action || ''} maxLength={500}/></label><label className={styles.field}><span>Description</span><textarea name="description" rows={4} defaultValue={editing?.description || ''}/></label>
      </> : <><div className={styles.grid2}><label className={styles.field}><span>Canal</span><select name="channel" defaultValue="phone">{['email','phone','whatsapp','meeting','visit','other'].map((channel) => <option value={channel} key={channel}>{channel}</option>)}</select></label><label className={styles.field}><span>Direction</span><select name="direction" defaultValue="internal"><option value="inbound">Entrante</option><option value="outbound">Sortante</option><option value="internal">Interne</option></select></label><label className={styles.field}><span>Date réelle</span><input name="occurredAt" type="datetime-local" required defaultValue={localInputDate(new Date().toISOString())}/></label><label className={styles.field}><span>Référence externe / preuve</span><input name="evidenceReference" maxLength={500}/></label></div><label className={styles.field}><span>Objet</span><input name="subject" maxLength={180}/></label><label className={styles.field}><span>Résumé factuel</span><textarea name="summary" rows={5} required maxLength={4000}/></label><div className={styles.crmDoctrine}><ShieldAlert size={16}/><span>Cette action consigne une interaction. Elle n’envoie aucun email, SMS ou message WhatsApp.</span></div></>}
      {editing ? <div className={styles.rowActions}><button type="button" className={styles.button} disabled={busy || !canManageTasks} onClick={() => { const form = formRef.current; if (!form) return; const values = new FormData(form); void mutateTask(editing.id, { title: values.get('title'), description: values.get('description'), priority: values.get('priority'), status: values.get('status'), assigneeId: values.get('assigneeId') || null, dueAt: values.get('dueAt') || null, nextAction: values.get('nextAction') || null }, 'Tâche mise à jour et auditée.') }}>{busy ? 'Enregistrement…' : 'Enregistrer'}</button><button type="button" className={styles.buttonSecondary} disabled={busy} onClick={() => { setMode(null); setEditing(null) }}>Annuler</button></div> : <div className={styles.rowActions}><button className={styles.button} disabled={busy || (mode === 'task' ? !canManageTasks : !canLogCommunications)}>{busy ? 'Enregistrement…' : mode === 'task' ? 'Créer la tâche' : 'Journaliser la preuve'}</button><button type="button" className={styles.buttonSecondary} disabled={busy} onClick={() => setMode(null)}>Annuler</button></div>}
    </form></dialog> : null}
  </section>
}

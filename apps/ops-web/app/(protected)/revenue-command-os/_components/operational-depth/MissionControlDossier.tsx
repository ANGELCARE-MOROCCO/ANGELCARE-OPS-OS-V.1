'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Activity, AlertTriangle, ArrowRight, BadgeDollarSign, CalendarClock, CheckCircle2,
  Circle, CirclePlay, ClipboardCheck, Clock3, FileCheck2, GitBranch, ListChecks,
  MessageSquareText, Pause, PlaneTakeoff, Plus, Save, ShieldAlert, UserRoundCheck, X,
} from 'lucide-react'
import LiveEntityActions from '../live-operations/LiveEntityActions'
import OperationalEntityDrawer from './OperationalEntityDrawer'
import {
  AuditFeed, BusyOverlay, DossierBackdrop, NoteComposer, NoteFeed, ProgressBar, RelationManager,
  StudioField, StudioMetric, StudioSelect, StudioTextArea, TonePill,
} from './SovereignDossierPrimitives'
import { useSovereignDossier } from './useSovereignDossier'
import {
  arrayOf, dateLabel, deadlineOf, money, numberOf, ownerOf, statusOf, textOf, titleOf,
} from './sovereign-workspace-utils'

type View = 'flight-plan' | 'tasks' | 'evidence' | 'timeline' | 'outcomes'

export default function MissionControlDossier({
  entityId,
  title,
  compact = false,
  onChanged,
}: {
  entityId: string
  title?: string
  compact?: boolean
  onChanged?: () => void | Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>('flight-plan')
  const { data, busy, message, mutate } = useSovereignDossier({
    entityType: 'mission',
    entityId,
    open,
    workspace: 'compiled-missions',
    onChanged,
  })
  const entity = data?.entity
  const [edit, setEdit] = useState({
    title: '',
    ownerLabel: '',
    status: 'active',
    startDate: '',
    deadline: '',
    nextAction: '',
    mandate: '',
    territories: '',
    accounts: '',
    kpis: '',
    revenueTargetDh: '',
  })
  const [task, setTask] = useState({ title: '', ownerLabel: '', deadline: '' })
  const [outcome, setOutcome] = useState({ revenueValueDh: '', marginValueDh: '', confidence: '1', summary: '' })

  useEffect(() => {
    if (!entity) return
    setEdit({
      title: titleOf(entity),
      ownerLabel: ownerOf(entity),
      status: statusOf(entity),
      startDate: textOf(entity, 'startDate'),
      deadline: String(deadlineOf(entity) || ''),
      nextAction: textOf(entity, 'nextAction'),
      mandate: textOf(entity, 'purpose', textOf(entity, 'mandate', textOf(entity, 'description'))),
      territories: arrayOf(entity, 'territories').join(' | '),
      accounts: arrayOf(entity, 'accounts').join(' | '),
      kpis: arrayOf(entity, 'kpis').join(' | '),
      revenueTargetDh: String(numberOf(entity, 'revenueTargetDh') || ''),
    })
  }, [entity])

  const notes = data?.notes || []
  const tasks = data?.children || []
  const relations = data?.relations || []
  const evidence = notes.filter((item) => item.note_kind === 'evidence')
  const checklists = notes.filter((item) => item.note_kind === 'checklist')
  const comments = notes.filter((item) => item.note_kind === 'comment')
  const recoveries = notes.filter((item) => item.note_kind === 'recovery')
  const results = notes.filter((item) => item.note_kind === 'result')
  const taskGroups = useMemo(() => ({
    active: tasks.filter((item) => !['running', 'paused', 'completed', 'closed', 'cancelled'].includes(statusOf(item))),
    running: tasks.filter((item) => statusOf(item) === 'running'),
    paused: tasks.filter((item) => statusOf(item) === 'paused' || textOf(item, 'blocked') === 'true'),
    completed: tasks.filter((item) => ['completed', 'closed'].includes(statusOf(item))),
  }), [tasks])
  const completion = tasks.length ? Math.round(taskGroups.completed.length / tasks.length * 100) : 0
  const readinessChecks = [
    ownerOf(entity) !== 'Non assigné',
    Boolean(deadlineOf(entity)),
    tasks.length > 0,
    arrayOf(entity, 'accounts').length > 0 || notes.some((item) => item.note_kind === 'account'),
    checklists.length > 0,
    evidence.length > 0,
  ]
  const readiness = Math.round(readinessChecks.filter(Boolean).length / readinessChecks.length * 100)
  const revenueInfluenced = results.reduce((sum, item) => sum + Number(item.value_numeric || 0), 0)
  const nextTask = [...taskGroups.active, ...taskGroups.running].sort((a, b) => String(deadlineOf(a) || '').localeCompare(String(deadlineOf(b) || '')))[0]

  async function save() {
    await mutate('update_fields', {
      ...edit,
      territories: edit.territories.split('|').map((item) => item.trim()).filter(Boolean),
      accounts: edit.accounts.split('|').map((item) => item.trim()).filter(Boolean),
      kpis: edit.kpis.split('|').map((item) => item.trim()).filter(Boolean),
      revenueTargetDh: edit.revenueTargetDh ? Number(edit.revenueTargetDh) : undefined,
    })
  }

  async function createTask() {
    await mutate('create_child', { ...task, status: 'active' })
    setTask({ title: '', ownerLabel: '', deadline: '' })
  }

  async function addOutcome() {
    await mutate('record_outcome', {
      outcomeType: 'mission_result',
      revenueValueDh: Number(outcome.revenueValueDh || 0),
      marginValueDh: Number(outcome.marginValueDh || 0),
      confidence: Number(outcome.confidence || 1),
      summary: outcome.summary,
    })
    setOutcome({ revenueValueDh: '', marginValueDh: '', confidence: '1', summary: '' })
  }

  const tabs: Array<{ key: View; label: string }> = [
    { key: 'flight-plan', label: 'Flight plan' },
    { key: 'tasks', label: `Execution board · ${tasks.length}` },
    { key: 'evidence', label: `Evidence · ${evidence.length}` },
    { key: 'timeline', label: 'Timeline & audit' },
    { key: 'outcomes', label: `Résultats · ${results.length}` },
  ]

  return <>
    <button type="button" onClick={() => setOpen(true)} className={`${compact ? 'px-3 py-2 text-[10px]' : 'px-4 py-2.5 text-xs'} inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white font-black text-indigo-800 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-400`}><PlaneTakeoff size={14} />Mission Control</button>
    {open ? <DossierBackdrop onClose={() => setOpen(false)} maxWidth="max-w-[1660px]">
      <header className="border-b border-indigo-100 bg-white px-5 py-4 sm:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-4"><span className="grid h-13 w-13 shrink-0 place-items-center rounded-[18px] bg-indigo-700 text-white shadow-lg"><PlaneTakeoff size={22} /></span><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[.18em] text-indigo-700">Commercial Mission Control & Execution Network</p><h2 className="mt-1 truncate text-2xl font-black tracking-[-.04em] text-slate-950 sm:text-3xl">{data?.title || title || 'Mission Revenue OS'}</h2><div className="mt-2 flex flex-wrap items-center gap-2"><TonePill value={statusOf(entity)} /><span className="text-[10px] font-bold text-slate-500">{ownerOf(entity)}</span><span className="text-[10px] font-bold text-slate-400">Échéance {dateLabel(deadlineOf(entity))}</span></div></div></div>
          <div className="flex flex-wrap items-center gap-2"><LiveEntityActions entityType="mission" entityId={entityId} compact /><button type="button" disabled={busy || !data} onClick={() => void save()} className="inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"><Save size={14} />Enregistrer</button><button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600"><X size={17} /></button></div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center"><nav className="flex gap-2 overflow-x-auto pb-1">{tabs.map((tab) => <button key={tab.key} type="button" onClick={() => setView(tab.key)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-[.08em] ${view === tab.key ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{tab.label}</button>)}</nav><div className="flex items-center gap-3 rounded-xl bg-indigo-50 px-4 py-2"><span className="text-[9px] font-black uppercase tracking-[.1em] text-indigo-700">Flight strip</span><span className="text-xs font-black text-slate-950">{ownerOf(entity)} → {dateLabel(deadlineOf(entity))} → {completion}% → {evidence.length} preuve(s)</span></div></div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        {busy ? <BusyOverlay label="Synchronisation de la mission…" /> : null}
        {message ? <p className={`mb-4 rounded-xl border p-3 text-xs font-bold ${message.includes('impossible') || message.includes('Échec') ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{message}</p> : null}

        {data && view === 'flight-plan' ? <div className="grid gap-5 2xl:grid-cols-[360px_minmax(0,1fr)_370px]">
          <aside className="space-y-4">
            <section className="rounded-[28px] border border-indigo-200 bg-indigo-950 p-5 text-white shadow-[0_24px_70px_rgba(67,56,202,.22)]"><p className="text-[9px] font-black uppercase tracking-[.16em] text-indigo-200">Mission readiness</p><div className="mt-3 flex items-end justify-between"><p className="text-5xl font-black tracking-[-.06em]">{readiness}%</p><ClipboardCheck size={24} className={readiness >= 80 ? 'text-emerald-300' : 'text-amber-300'} /></div><div className="mt-4"><ProgressBar value={readiness} tone={readiness >= 80 ? 'emerald' : 'amber'} /></div><p className="mt-4 text-xs leading-5 text-indigo-100">Le score utilise uniquement propriétaire, échéance, tâches, comptes, checklist et preuves réellement documentés.</p></section>
            <div className="grid grid-cols-2 gap-3"><StudioMetric icon={ListChecks} label="Tâches" value={tasks.length} detail={`${taskGroups.completed.length} terminées`} tone="indigo" /><StudioMetric icon={AlertTriangle} label="Bloquées" value={taskGroups.paused.length} detail="Pause ou blocage" tone={taskGroups.paused.length ? 'rose' : 'emerald'} /></div>
            <section className="rounded-[28px] border border-slate-200 bg-white p-5"><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">Prochaine action</p><p className="mt-3 text-sm font-black leading-6 text-slate-950">{textOf(nextTask, 'title', edit.nextAction || 'Aucune action ouverte.')}</p>{nextTask ? <p className="mt-2 text-[10px] text-slate-500">{ownerOf(nextTask)} · {dateLabel(deadlineOf(nextTask))}</p> : null}<button type="button" onClick={() => setView('tasks')} className="mt-4 inline-flex items-center gap-2 text-xs font-black text-indigo-700">Ouvrir le board<ArrowRight size={13} /></button></section>
          </aside>

          <section className="space-y-5">
            <section className="rounded-[30px] border border-indigo-200 bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-indigo-700">Mission Flight Plan</p><h3 className="mt-1 text-xl font-black text-slate-950">Purpose → comptes → actions → preuves → résultats</h3></div><PlaneTakeoff size={22} className="text-indigo-700" /></div>
              <div className="mt-6 grid gap-3 md:grid-cols-5"><FlightNode icon={TargetIcon} label="Purpose" value={edit.mandate || 'Non documenté'} ready={Boolean(edit.mandate)} /><FlightNode icon={UsersIcon} label="Comptes" value={`${arrayOf(entity, 'accounts').length} ciblé(s)`} ready={arrayOf(entity, 'accounts').length > 0} /><FlightNode icon={ListChecks} label="Actions" value={`${tasks.length} tâche(s)`} ready={tasks.length > 0} /><FlightNode icon={FileCheck2} label="Evidence" value={`${evidence.length} preuve(s)`} ready={evidence.length > 0} /><FlightNode icon={BadgeDollarSign} label="Outcome" value={money(revenueInfluenced)} ready={revenueInfluenced > 0} /></div>
            </section>

            <section className="rounded-[30px] border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-indigo-700">Mission brief</p><h3 className="mt-1 text-xl font-black text-slate-950">Responsabilité et exécution</h3></div><Activity size={22} className="text-indigo-700" /></div><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3"><StudioField label="Titre" value={edit.title} onChange={(value) => setEdit((current) => ({ ...current, title: value }))} /><StudioField label="Responsable" value={edit.ownerLabel} onChange={(value) => setEdit((current) => ({ ...current, ownerLabel: value }))} /><StudioSelect label="Statut" value={edit.status} onChange={(value) => setEdit((current) => ({ ...current, status: value }))} options={['active','running','paused','completed','cancelled','archived'].map((value) => ({ value, label: value }))} /><StudioField label="Début" value={edit.startDate} onChange={(value) => setEdit((current) => ({ ...current, startDate: value }))} type="date" /><StudioField label="Échéance" value={edit.deadline} onChange={(value) => setEdit((current) => ({ ...current, deadline: value }))} type="date" /><StudioField label="Cible influencée (Dh)" value={edit.revenueTargetDh} onChange={(value) => setEdit((current) => ({ ...current, revenueTargetDh: value }))} type="number" /><StudioField label="Prochaine action" value={edit.nextAction} onChange={(value) => setEdit((current) => ({ ...current, nextAction: value }))} /><StudioField label="Territoires · séparateur |" value={edit.territories} onChange={(value) => setEdit((current) => ({ ...current, territories: value }))} /><StudioField label="KPIs · séparateur |" value={edit.kpis} onChange={(value) => setEdit((current) => ({ ...current, kpis: value }))} /></div><div className="mt-4"><StudioTextArea label="Purpose et résultat attendu" value={edit.mandate} onChange={(value) => setEdit((current) => ({ ...current, mandate: value }))} rows={5} /></div><div className="mt-4"><StudioTextArea label="Comptes · séparateur |" value={edit.accounts} onChange={(value) => setEdit((current) => ({ ...current, accounts: value }))} rows={3} /></div></section>
          </section>

          <aside className="space-y-4">
            <section className="rounded-[28px] border border-indigo-200 bg-indigo-50 p-5"><p className="text-[9px] font-black uppercase tracking-[.15em] text-indigo-700">Execution pulse</p><div className="mt-4 space-y-4"><Pulse label="À faire" value={taskGroups.active.length} total={tasks.length} tone="blue" /><Pulse label="En cours" value={taskGroups.running.length} total={tasks.length} tone="indigo" /><Pulse label="Bloquées" value={taskGroups.paused.length} total={tasks.length} tone="rose" /><Pulse label="Terminées" value={taskGroups.completed.length} total={tasks.length} tone="emerald" /></div></section>
            <NoteComposer tone="indigo" defaultKind="checklist" title="Ajouter une checklist" busy={busy} onAdd={(payload) => mutate('add_note', payload)} />
            <NoteComposer tone="indigo" defaultKind="comment" title="Instruction opérationnelle" busy={busy} onAdd={(payload) => mutate('add_note', payload)} />
          </aside>
        </div> : null}

        {data && view === 'tasks' ? <div className="space-y-5">
          <section className="rounded-[28px] border border-indigo-200 bg-indigo-50 p-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-700 text-white"><Plus size={16} /></span><div><p className="text-[9px] font-black uppercase tracking-[.14em] text-indigo-700">Création immédiate</p><h3 className="text-lg font-black text-slate-950">Ajouter une tâche à la mission</h3></div></div><div className="mt-4 grid gap-3 lg:grid-cols-[1fr_230px_190px_auto]"><StudioField label="Titre" value={task.title} onChange={(value) => setTask((current) => ({ ...current, title: value }))} /><StudioField label="Responsable" value={task.ownerLabel} onChange={(value) => setTask((current) => ({ ...current, ownerLabel: value }))} /><StudioField label="Échéance" value={task.deadline} onChange={(value) => setTask((current) => ({ ...current, deadline: value }))} type="date" /><button type="button" disabled={!task.title.trim() || busy} onClick={() => void createTask()} className="mt-[22px] inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-700 px-4 text-xs font-black text-white disabled:opacity-40"><Plus size={14} />Ajouter</button></div></section>
          <div className="overflow-x-auto pb-3"><div className="flex min-w-max gap-4"><TaskLane title="À faire" icon={Circle} tone="blue" items={taskGroups.active} onChanged={onChanged} /><TaskLane title="En cours" icon={CirclePlay} tone="indigo" items={taskGroups.running} onChanged={onChanged} /><TaskLane title="Bloquées / pause" icon={Pause} tone="rose" items={taskGroups.paused} onChanged={onChanged} /><TaskLane title="Terminées" icon={CheckCircle2} tone="emerald" items={taskGroups.completed} onChanged={onChanged} /></div></div>
        </div> : null}

        {data && view === 'evidence' ? <div className="grid gap-5 xl:grid-cols-[1fr_390px]"><section className="space-y-5"><Panel title="Evidence command strip" count={evidence.length}><NoteFeed notes={evidence} empty="Aucune preuve reçue." onDelete={(noteId) => mutate('delete_note', { noteId })} /></Panel><Panel title="Checklists" count={checklists.length}><NoteFeed notes={checklists} empty="Aucune checklist." onDelete={(noteId) => mutate('delete_note', { noteId })} /></Panel><Panel title="Instructions & commentaires" count={comments.length}><NoteFeed notes={comments} empty="Aucune instruction." onDelete={(noteId) => mutate('delete_note', { noteId })} /></Panel></section><aside className="space-y-4"><NoteComposer tone="indigo" defaultKind="evidence" title="Ajouter une preuve" busy={busy} onAdd={(payload) => mutate('add_note', payload)} /><NoteComposer tone="indigo" defaultKind="checklist" title="Ajouter un contrôle" busy={busy} onAdd={(payload) => mutate('add_note', payload)} /><RelationManager relations={relations} tone="indigo" title="Relations mission" onLink={(payload) => mutate('link_entity', payload)} onUnlink={(relationId) => mutate('unlink_entity', { relationId })} /></aside></div> : null}

        {data && view === 'timeline' ? <div className="grid gap-5 xl:grid-cols-[1fr_390px]"><section className="rounded-[30px] border border-slate-200 bg-white p-5"><AuditFeed items={data.audit} /></section><aside className="space-y-4"><section className="rounded-[28px] border border-indigo-200 bg-indigo-50 p-5"><p className="text-[9px] font-black uppercase tracking-[.15em] text-indigo-700">Chronologie opérationnelle</p><div className="mt-4 space-y-3">{tasks.slice().sort((a, b) => String(deadlineOf(a) || '').localeCompare(String(deadlineOf(b) || ''))).map((item) => <article key={item.id} className="rounded-2xl bg-white p-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-black text-slate-950">{titleOf(item, 'Tâche')}</p><TonePill value={statusOf(item)} /></div><p className="mt-2 text-[10px] text-slate-500">{ownerOf(item)} · {dateLabel(deadlineOf(item))}</p></article>)}{!tasks.length ? <p className="text-xs text-slate-500">Aucune tâche à ordonner.</p> : null}</div></section><Panel title="Recovery notes" count={recoveries.length}><NoteFeed notes={recoveries} empty="Aucune action de récupération." onDelete={(noteId) => mutate('delete_note', { noteId })} /></Panel></aside></div> : null}

        {data && view === 'outcomes' ? <div className="grid gap-5 xl:grid-cols-[1fr_390px]"><section className="space-y-5"><div className="grid gap-4 md:grid-cols-3"><StudioMetric icon={BadgeDollarSign} label="Revenus influencés" value={money(revenueInfluenced)} detail="Résultats documentés" tone="indigo" /><StudioMetric icon={CheckCircle2} label="Tâches terminées" value={`${taskGroups.completed.length}/${tasks.length}`} detail={`${completion}% de complétion`} tone="emerald" /><StudioMetric icon={ShieldAlert} label="Recovery" value={recoveries.length} detail="Actions correctives" tone={recoveries.length ? 'amber' : 'emerald'} /></div><Panel title="Résultats mission" count={results.length}><NoteFeed notes={results} empty="Aucun résultat documenté." onDelete={(noteId) => mutate('delete_note', { noteId })} /></Panel></section><aside className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5"><p className="text-[9px] font-black uppercase tracking-[.15em] text-emerald-700">Enregistrer un résultat</p><div className="mt-4 space-y-3"><StudioField label="Revenus (Dh)" value={outcome.revenueValueDh} onChange={(value) => setOutcome((current) => ({ ...current, revenueValueDh: value }))} type="number" /><StudioField label="Marge (Dh)" value={outcome.marginValueDh} onChange={(value) => setOutcome((current) => ({ ...current, marginValueDh: value }))} type="number" /><StudioField label="Confiance 0–1" value={outcome.confidence} onChange={(value) => setOutcome((current) => ({ ...current, confidence: value }))} type="number" /><StudioTextArea label="Résumé" value={outcome.summary} onChange={(value) => setOutcome((current) => ({ ...current, summary: value }))} rows={4} /></div><button type="button" disabled={busy} onClick={() => void addOutcome()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white"><BadgeDollarSign size={14} />Enregistrer</button></aside></div> : null}
      </div>
    </DossierBackdrop> : null}
  </>
}

const TargetIcon = ListChecks
const UsersIcon = UserRoundCheck

function FlightNode({ icon: Icon, label, value, ready }: { icon: typeof ListChecks; label: string; value: string; ready: boolean }) {
  return <article className={`rounded-[22px] border p-4 ${ready ? 'border-indigo-200 bg-indigo-50' : 'border-amber-200 bg-amber-50'}`}><span className={`grid h-9 w-9 place-items-center rounded-xl ${ready ? 'bg-indigo-700 text-white' : 'bg-amber-500 text-white'}`}><Icon size={16} /></span><p className="mt-3 text-[9px] font-black uppercase tracking-[.12em] text-slate-500">{label}</p><p className="mt-1 line-clamp-2 text-xs font-black leading-5 text-slate-900">{value}</p></article>
}

function Pulse({ label, value, total, tone }: { label: string; value: number; total: number; tone: 'blue' | 'indigo' | 'rose' | 'emerald' }) {
  return <div><div className="flex items-center justify-between text-[10px] font-black text-slate-600"><span>{label}</span><span>{value}</span></div><div className="mt-2"><ProgressBar value={total ? value / total * 100 : 0} tone={tone} /></div></div>
}

function TaskLane({ title, icon: Icon, tone, items, onChanged }: { title: string; icon: typeof Circle; tone: 'blue' | 'indigo' | 'rose' | 'emerald'; items: Array<Record<string, any>>; onChanged?: () => void | Promise<void> }) {
  const header = { blue: 'text-blue-700', indigo: 'text-indigo-700', rose: 'text-rose-700', emerald: 'text-emerald-700' }[tone]
  return <section className="w-[330px] rounded-[28px] border border-slate-200 bg-slate-100/70 p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Icon size={15} className={header} /><h3 className="text-xs font-black uppercase tracking-[.1em] text-slate-700">{title}</h3></div><span className="rounded-full bg-white px-3 py-1 text-xs font-black">{items.length}</span></div><div className="mt-4 space-y-3">{items.map((task) => <article key={task.id} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm font-black text-slate-950">{titleOf(task, 'Tâche')}</p><div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500"><UserRoundCheck size={13} />{ownerOf(task)}</div><div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500"><CalendarClock size={13} />{dateLabel(deadlineOf(task))}</div><div className="mt-3 flex flex-wrap gap-2"><LiveEntityActions entityType="task" entityId={String(task.id)} compact /><OperationalEntityDrawer entityType="task" entityId={String(task.id)} title={titleOf(task)} compact onChanged={onChanged} /></div></article>)}{!items.length ? <p className="rounded-xl bg-white p-4 text-center text-[10px] font-bold text-slate-400">Aucune tâche</p> : null}</div></section>
}

function Panel({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return <section className="rounded-[28px] border border-slate-200 bg-[#f8fafc] p-5"><div className="mb-4 flex items-center justify-between"><h3 className="text-base font-black text-slate-950">{title}</h3><span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-slate-600">{count}</span></div>{children}</section>
}

'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Activity, AlertOctagon, ArrowRight, BadgeDollarSign, CalendarClock, CheckCircle2,
  CircleAlert, FileWarning, GitBranch, History, Plus, Radar, RefreshCw, Save,
  ShieldAlert, Siren, TimerReset, UserRoundCheck, Wrench, X,
} from 'lucide-react'
import LiveEntityActions from '../live-operations/LiveEntityActions'
import OperationalEntityDrawer from './OperationalEntityDrawer'
import {
  AuditFeed, BusyOverlay, DossierBackdrop, NoteComposer, NoteFeed, ProgressBar, RelationManager,
  StudioField, StudioMetric, StudioSelect, StudioTextArea, TonePill,
} from './SovereignDossierPrimitives'
import { useSovereignDossier } from './useSovereignDossier'
import {
  dateLabel, deadlineOf, daysRemaining, money, numberOf, ownerOf, statusOf, textOf,
  titleOf,
} from './sovereign-workspace-utils'

type View = 'incident' | 'recovery' | 'tasks' | 'evidence' | 'audit'

const stages = [
  { key: 'detected', label: 'Détectée' },
  { key: 'diagnosed', label: 'Diagnostiquée' },
  { key: 'planned', label: 'Plan de reprise' },
  { key: 'executing', label: 'Correction' },
  { key: 'verified', label: 'Vérification' },
  { key: 'closed', label: 'Clôture' },
] as const

export default function RevenueIncidentDossier({
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
  const [view, setView] = useState<View>('incident')
  const { data, busy, message, mutate } = useSovereignDossier({
    entityType: 'exception',
    entityId,
    open,
    workspace: 'exceptions',
    onChanged,
  })
  const entity = data?.entity
  const [edit, setEdit] = useState({
    title: '',
    status: 'active',
    severity: 'high',
    ownerId: '',
    dueAt: '',
    revenueImpactDh: '',
    rootCause: '',
    recoveryPlan: '',
    nextAction: '',
    description: '',
  })
  const [task, setTask] = useState({ title: '', ownerLabel: '', deadline: '' })
  const [outcome, setOutcome] = useState({ revenueValueDh: '', marginValueDh: '', confidence: '1', summary: '' })

  useEffect(() => {
    if (!entity) return
    setEdit({
      title: titleOf(entity),
      status: statusOf(entity),
      severity: textOf(entity, 'severity', 'high'),
      ownerId: textOf(entity, 'ownerId', textOf(entity, 'owner_id')),
      dueAt: String(deadlineOf(entity) || ''),
      revenueImpactDh: String(numberOf(entity, 'revenueImpactDh') || numberOf(entity, 'revenue_impact_dh') || ''),
      rootCause: textOf(entity, 'rootCause'),
      recoveryPlan: textOf(entity, 'recoveryPlan'),
      nextAction: textOf(entity, 'nextAction'),
      description: textOf(entity, 'description'),
    })
  }, [entity])

  const notes = data?.notes || []
  const recoveryTasks = data?.children || []
  const relations = data?.relations || []
  const recoveryNotes = notes.filter((item) => item.note_kind === 'recovery')
  const evidence = notes.filter((item) => item.note_kind === 'evidence')
  const checklists = notes.filter((item) => item.note_kind === 'checklist')
  const decisions = notes.filter((item) => item.note_kind === 'decision')
  const results = notes.filter((item) => item.note_kind === 'result')
  const revenueExposure = numberOf(entity, 'revenueImpactDh') || numberOf(entity, 'revenue_impact_dh')
  const recovered = results.reduce((sum, item) => sum + Number(item.value_numeric || 0), 0)
  const remainingExposure = Math.max(0, revenueExposure - recovered)
  const openTasks = recoveryTasks.filter((item) => !['completed', 'closed', 'cancelled'].includes(statusOf(item))).length
  const completedTasks = recoveryTasks.filter((item) => ['completed', 'closed'].includes(statusOf(item))).length
  const recoveryProgress = recoveryTasks.length ? Math.round(completedTasks / recoveryTasks.length * 100) : 0
  const days = daysRemaining(deadlineOf(entity))
  const stageIndex = useMemo(() => {
    const status = statusOf(entity)
    if (['closed', 'resolved', 'completed'].includes(status)) return 5
    if (results.length) return 4
    if (recoveryTasks.some((item) => statusOf(item) === 'running')) return 3
    if (recoveryTasks.length || recoveryNotes.length) return 2
    if (edit.rootCause) return 1
    return 0
  }, [edit.rootCause, entity, recoveryNotes.length, recoveryTasks, results.length])

  async function save() {
    await mutate('update_fields', {
      ...edit,
      revenueImpactDh: edit.revenueImpactDh ? Number(edit.revenueImpactDh) : 0,
    })
  }

  async function createRecoveryTask() {
    await mutate('create_child', { ...task, status: 'active', recoveryForException: entityId })
    setTask({ title: '', ownerLabel: '', deadline: '' })
  }

  async function addOutcome() {
    await mutate('record_outcome', {
      outcomeType: 'revenue_recovery',
      revenueValueDh: Number(outcome.revenueValueDh || 0),
      marginValueDh: Number(outcome.marginValueDh || 0),
      confidence: Number(outcome.confidence || 1),
      summary: outcome.summary,
    })
    setOutcome({ revenueValueDh: '', marginValueDh: '', confidence: '1', summary: '' })
  }

  const tabs: Array<{ key: View; label: string }> = [
    { key: 'incident', label: 'Incident command' },
    { key: 'recovery', label: `Recovery runway · ${recoveryNotes.length}` },
    { key: 'tasks', label: `Corrective tasks · ${recoveryTasks.length}` },
    { key: 'evidence', label: `Evidence · ${evidence.length}` },
    { key: 'audit', label: 'Trace & audit' },
  ]

  return <>
    <button type="button" onClick={() => setOpen(true)} className={`${compact ? 'px-3 py-2 text-[10px]' : 'px-4 py-2.5 text-xs'} inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-white font-black text-rose-800 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-400`}><Siren size={14} />Incident command</button>
    {open ? <DossierBackdrop onClose={() => setOpen(false)} maxWidth="max-w-[1580px]">
      <header className="border-b border-rose-100 bg-white px-5 py-4 sm:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-4"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-rose-700 text-white shadow-lg"><Siren size={22} /></span><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[.18em] text-rose-700">Revenue Incident Command & Recovery System</p><h2 className="mt-1 truncate text-2xl font-black tracking-[-.04em] text-slate-950 sm:text-3xl">{data?.title || title || 'Exception Revenue OS'}</h2><div className="mt-2 flex flex-wrap items-center gap-2"><TonePill value={textOf(entity, 'severity', 'high')} /><TonePill value={statusOf(entity)} /><span className="text-[10px] font-bold text-slate-500">{ownerOf(entity)}</span><span className="text-[10px] font-bold text-slate-400">Échéance {dateLabel(deadlineOf(entity))}</span></div></div></div>
          <div className="flex flex-wrap items-center gap-2"><LiveEntityActions entityType="exception" entityId={entityId} compact /><button type="button" disabled={busy || !data} onClick={() => void save()} className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"><Save size={14} />Enregistrer</button><button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600"><X size={17} /></button></div>
        </div>
        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">{tabs.map((tab) => <button key={tab.key} type="button" onClick={() => setView(tab.key)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-[.08em] ${view === tab.key ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{tab.label}</button>)}</nav>
      </header>

      <div className="relative min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        {busy ? <BusyOverlay label="Synchronisation de l’incident…" /> : null}
        {message ? <p className={`mb-4 rounded-xl border p-3 text-xs font-bold ${message.includes('impossible') || message.includes('Échec') ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{message}</p> : null}

        {data && view === 'incident' ? <div className="space-y-5">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><StudioMetric icon={BadgeDollarSign} label="Revenue exposé" value={money(revenueExposure)} detail="Impact du dossier" tone="rose" /><StudioMetric icon={RefreshCw} label="Revenue récupéré" value={money(recovered)} detail={`${results.length} résultat(s)`} tone="emerald" /><StudioMetric icon={AlertOctagon} label="Exposition restante" value={money(remainingExposure)} detail="À protéger" tone={remainingExposure ? 'rose' : 'emerald'} /><StudioMetric icon={TimerReset} label="Temps restant" value={days == null ? '—' : `${days} j`} detail={dateLabel(deadlineOf(entity))} tone={days != null && days < 0 ? 'rose' : 'amber'} /><StudioMetric icon={Wrench} label="Recovery" value={`${recoveryProgress}%`} detail={`${openTasks} tâche(s) ouverte(s)`} tone={recoveryProgress >= 70 ? 'emerald' : 'amber'} /></section>

          <section className="rounded-[32px] border border-rose-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-rose-700">Revenue blast-radius map</p><h3 className="mt-1 text-xl font-black text-slate-950">Ce que l’incident affecte réellement</h3></div><Radar size={23} className="text-rose-700" /></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><BlastNode label="Source" value={textOf(entity, 'sourceType', textOf(entity, 'source_type', 'Non renseignée'))} icon={FileWarning} /><BlastNode label="Objet source" value={textOf(entity, 'sourceId', textOf(entity, 'source_id', 'Non relié'))} icon={GitBranch} /><BlastNode label="Relations" value={`${relations.length} dossier(s)`} icon={Activity} /><BlastNode label="Revenue exposé" value={money(revenueExposure)} icon={BadgeDollarSign} /></div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">{relations.map((item) => <article key={item.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4"><p className="text-[9px] font-black uppercase tracking-[.1em] text-slate-400">{item.relation_kind}</p><p className="mt-2 text-xs font-black text-slate-900">{item.from_type}/{String(item.from_id).slice(0, 8)} → {item.to_type}/{String(item.to_id).slice(0, 8)}</p></article>)}{!relations.length ? <p className="col-span-full rounded-[22px] border border-dashed border-slate-300 p-6 text-center text-xs font-semibold text-slate-500">Aucune relation explicite. Le dossier conserve néanmoins son objet source.</p> : null}</div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1fr_390px]">
            <div className="rounded-[30px] border border-slate-200 bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-rose-700">Incident command dossier</p><h3 className="mt-1 text-xl font-black text-slate-950">Diagnostic, responsabilité et exposition</h3></div><ShieldAlert size={22} className="text-rose-700" /></div><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3"><StudioField label="Titre" value={edit.title} onChange={(value) => setEdit((current) => ({ ...current, title: value }))} /><StudioField label="Responsable" value={edit.ownerId} onChange={(value) => setEdit((current) => ({ ...current, ownerId: value }))} /><StudioSelect label="Statut" value={edit.status} onChange={(value) => setEdit((current) => ({ ...current, status: value }))} options={['active','running','paused','resolved','closed','cancelled','archived'].map((value) => ({ value, label: value }))} /><StudioSelect label="Sévérité" value={edit.severity} onChange={(value) => setEdit((current) => ({ ...current, severity: value }))} options={['critical','high','medium','low'].map((value) => ({ value, label: value }))} /><StudioField label="Échéance" value={edit.dueAt} onChange={(value) => setEdit((current) => ({ ...current, dueAt: value }))} type="datetime-local" /><StudioField label="Impact revenus (Dh)" value={edit.revenueImpactDh} onChange={(value) => setEdit((current) => ({ ...current, revenueImpactDh: value }))} type="number" /><StudioField label="Prochaine action" value={edit.nextAction} onChange={(value) => setEdit((current) => ({ ...current, nextAction: value }))} /></div><div className="mt-4 grid gap-4 lg:grid-cols-2"><StudioTextArea label="Cause racine" value={edit.rootCause} onChange={(value) => setEdit((current) => ({ ...current, rootCause: value }))} rows={5} /><StudioTextArea label="Plan de récupération" value={edit.recoveryPlan} onChange={(value) => setEdit((current) => ({ ...current, recoveryPlan: value }))} rows={5} /></div><div className="mt-4"><StudioTextArea label="Description de l’incident" value={edit.description} onChange={(value) => setEdit((current) => ({ ...current, description: value }))} rows={4} /></div></div>
            <aside className="space-y-4"><section className={`rounded-[28px] border p-5 ${textOf(entity, 'severity') === 'critical' ? 'border-rose-300 bg-rose-950 text-white' : 'border-amber-200 bg-amber-50'}`}><p className={`text-[9px] font-black uppercase tracking-[.15em] ${textOf(entity, 'severity') === 'critical' ? 'text-rose-200' : 'text-amber-800'}`}>Incident command mode</p><h3 className="mt-2 text-xl font-black">Priorité d’intervention</h3><p className={`mt-3 text-xs leading-5 ${textOf(entity, 'severity') === 'critical' ? 'text-rose-100' : 'text-slate-600'}`}>{remainingExposure > 0 ? `${money(remainingExposure)} restent exposés. ${openTasks} tâche(s) corrective(s) sont ouvertes.` : 'L’exposition financière documentée a été récupérée.'}</p><button type="button" onClick={() => setView('recovery')} className={`mt-4 inline-flex items-center gap-2 text-xs font-black ${textOf(entity, 'severity') === 'critical' ? 'text-white' : 'text-rose-800'}`}>Ouvrir le recovery runway<ArrowRight size={13} /></button></section><NoteComposer tone="rose" defaultKind="decision" title="Décision d’incident" busy={busy} onAdd={(payload) => mutate('add_note', payload)} /></aside>
          </section>
        </div> : null}

        {data && view === 'recovery' ? <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
          <section className="space-y-5"><section className="rounded-[30px] border border-rose-200 bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-rose-700">Recovery orchestration canvas</p><h3 className="mt-1 text-xl font-black text-slate-950">De la détection à la clôture vérifiée</h3></div><History size={22} className="text-rose-700" /></div><div className="mt-6 grid gap-3 md:grid-cols-6">{stages.map((stage, index) => <article key={stage.key} className={`rounded-[22px] border p-4 ${index <= stageIndex ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}><span className={`grid h-9 w-9 place-items-center rounded-xl ${index <= stageIndex ? 'bg-rose-700 text-white' : 'bg-slate-200 text-slate-500'}`}>{index < stageIndex ? <CheckCircle2 size={15} /> : <span className="text-xs font-black">{index + 1}</span>}</span><p className="mt-3 text-[9px] font-black uppercase tracking-[.1em] text-slate-600">{stage.label}</p></article>)}</div></section><Panel title="Actions de récupération" count={recoveryNotes.length}><NoteFeed notes={recoveryNotes} empty="Aucune action de récupération documentée." onDelete={(noteId) => mutate('delete_note', { noteId })} /></Panel><Panel title="Décisions" count={decisions.length}><NoteFeed notes={decisions} empty="Aucune décision documentée." onDelete={(noteId) => mutate('delete_note', { noteId })} /></Panel></section>
          <aside className="space-y-4"><NoteComposer tone="rose" defaultKind="recovery" title="Ajouter une action de récupération" busy={busy} onAdd={(payload) => mutate('add_note', payload)} /><NoteComposer tone="rose" defaultKind="checklist" title="Ajouter un contrôle de reprise" busy={busy} onAdd={(payload) => mutate('add_note', payload)} /><section className="rounded-[28px] border border-slate-200 bg-white p-5"><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">Actions immédiates</p><div className="mt-4"><LiveEntityActions entityType="exception" entityId={entityId} /></div></section></aside>
        </div> : null}

        {data && view === 'tasks' ? <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
          <section className="rounded-[30px] border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-rose-700">Corrective task network</p><h3 className="mt-1 text-xl font-black text-slate-950">Tâches de récupération</h3></div><span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-800">{recoveryTasks.length}</span></div><div className="mt-5 grid gap-4 lg:grid-cols-2">{recoveryTasks.map((item) => <article key={item.id} className="rounded-[24px] border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-base font-black text-slate-950">{titleOf(item, 'Tâche corrective')}</p><p className="mt-1 text-[10px] text-slate-500">{ownerOf(item)} · {dateLabel(deadlineOf(item))}</p></div><TonePill value={statusOf(item)} /></div><div className="mt-4 flex flex-wrap gap-2"><LiveEntityActions entityType="task" entityId={String(item.id)} compact /><OperationalEntityDrawer entityType="task" entityId={String(item.id)} title={titleOf(item)} compact onChanged={onChanged} /></div></article>)}{!recoveryTasks.length ? <p className="col-span-full rounded-[24px] border border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500">Aucune tâche corrective.</p> : null}</div></section>
          <aside className="rounded-[28px] border border-rose-200 bg-rose-50 p-5"><p className="text-[9px] font-black uppercase tracking-[.15em] text-rose-700">Créer une correction</p><div className="mt-4 space-y-3"><StudioField label="Titre" value={task.title} onChange={(value) => setTask((current) => ({ ...current, title: value }))} /><StudioField label="Responsable" value={task.ownerLabel} onChange={(value) => setTask((current) => ({ ...current, ownerLabel: value }))} /><StudioField label="Échéance" value={task.deadline} onChange={(value) => setTask((current) => ({ ...current, deadline: value }))} type="date" /></div><button type="button" disabled={!task.title.trim() || busy} onClick={() => void createRecoveryTask()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"><Plus size={14} />Créer la tâche</button></aside>
        </div> : null}

        {data && view === 'evidence' ? <div className="grid gap-5 xl:grid-cols-[1fr_390px]"><section className="space-y-5"><Panel title="Evidence de récupération" count={evidence.length}><NoteFeed notes={evidence} empty="Aucune preuve de récupération." onDelete={(noteId) => mutate('delete_note', { noteId })} /></Panel><Panel title="Contrôles" count={checklists.length}><NoteFeed notes={checklists} empty="Aucun contrôle documenté." onDelete={(noteId) => mutate('delete_note', { noteId })} /></Panel><Panel title="Résultats récupérés" count={results.length}><NoteFeed notes={results} empty="Aucun résultat de récupération." onDelete={(noteId) => mutate('delete_note', { noteId })} /></Panel></section><aside className="space-y-4"><NoteComposer tone="rose" defaultKind="evidence" title="Ajouter une preuve" busy={busy} onAdd={(payload) => mutate('add_note', payload)} /><section className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5"><p className="text-[9px] font-black uppercase tracking-[.15em] text-emerald-700">Enregistrer la récupération</p><div className="mt-4 space-y-3"><StudioField label="Revenue récupéré (Dh)" value={outcome.revenueValueDh} onChange={(value) => setOutcome((current) => ({ ...current, revenueValueDh: value }))} type="number" /><StudioField label="Marge récupérée (Dh)" value={outcome.marginValueDh} onChange={(value) => setOutcome((current) => ({ ...current, marginValueDh: value }))} type="number" /><StudioField label="Confiance 0–1" value={outcome.confidence} onChange={(value) => setOutcome((current) => ({ ...current, confidence: value }))} type="number" /><StudioTextArea label="Résumé" value={outcome.summary} onChange={(value) => setOutcome((current) => ({ ...current, summary: value }))} rows={4} /></div><button type="button" disabled={busy} onClick={() => void addOutcome()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white"><BadgeDollarSign size={14} />Enregistrer</button></section></aside></div> : null}

        {data && view === 'audit' ? <div className="grid gap-5 xl:grid-cols-[1fr_390px]"><section className="rounded-[30px] border border-slate-200 bg-white p-5"><AuditFeed items={data.audit} /></section><aside className="space-y-4"><section className="rounded-[28px] border border-slate-200 bg-white p-5"><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">Technical trace</p><div className="mt-4 space-y-3"><Trace label="Source" value={textOf(entity, 'sourceType', textOf(entity, 'source_type', '—'))} /><Trace label="Source ID" value={textOf(entity, 'sourceId', textOf(entity, 'source_id', '—'))} /><Trace label="Dernière action" value={textOf(entity, 'lastOperation', '—')} /><Trace label="Dernière erreur" value={textOf(entity, 'lastError', textOf(entity, 'error', '—'))} /></div></section><RelationManager relations={relations} tone="rose" title="Blast radius relationnel" onLink={(payload) => mutate('link_entity', payload)} onUnlink={(relationId) => mutate('unlink_entity', { relationId })} /><Panel title="Historique recovery" count={recoveryNotes.length}><NoteFeed notes={recoveryNotes} empty="Aucune action de récupération." /></Panel></aside></div> : null}
      </div>
    </DossierBackdrop> : null}
  </>
}

function BlastNode({ label, value, icon: Icon }: { label: string; value: string; icon: typeof FileWarning }) {
  return <article className="rounded-[24px] border border-rose-200 bg-rose-50 p-4"><span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-700 text-white"><Icon size={16} /></span><p className="mt-3 text-[9px] font-black uppercase tracking-[.12em] text-rose-700">{label}</p><p className="mt-1 break-words text-xs font-black leading-5 text-slate-900">{value}</p></article>
}

function Trace({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[8px] font-black uppercase tracking-[.1em] text-slate-400">{label}</p><p className="mt-1 break-all text-[10px] font-bold text-slate-800">{value}</p></div>
}

function Panel({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return <section className="rounded-[28px] border border-slate-200 bg-[#f8fafc] p-5"><div className="mb-4 flex items-center justify-between"><h3 className="text-base font-black text-slate-950">{title}</h3><span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-slate-600">{count}</span></div>{children}</section>
}

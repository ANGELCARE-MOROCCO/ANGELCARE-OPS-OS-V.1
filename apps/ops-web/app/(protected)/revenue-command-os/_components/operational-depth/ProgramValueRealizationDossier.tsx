'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Activity, AlertTriangle, ArrowRight, BadgeDollarSign, BriefcaseBusiness, CalendarRange,
  BarChart3, CheckCircle2, Gauge, Copy, GitBranch, Layers3, Plus,
  Save, Target, TrendingDown, TrendingUp, UsersRound, WalletCards, X,
} from 'lucide-react'
import LiveEntityActions from '../live-operations/LiveEntityActions'
import {
  AuditFeed, BusyOverlay, DossierBackdrop, NoteComposer, NoteFeed, ProgressBar, RelationManager,
  StudioField, StudioMetric, StudioSelect, StudioTextArea, TonePill,
} from './SovereignDossierPrimitives'
import { useSovereignDossier } from './useSovereignDossier'
import {
  arrayOf, clamp, dateLabel, deadlineOf, money, numberOf, ownerOf, safeRatio, statusOf,
  textOf, titleOf,
} from './sovereign-workspace-utils'

type View = 'value' | 'topology' | 'intervention' | 'outcomes' | 'audit'

export default function ProgramValueRealizationDossier({
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
  const [view, setView] = useState<View>('value')
  const { data, busy, message, mutate } = useSovereignDossier({
    entityType: 'program',
    entityId,
    open,
    workspace: 'active-programs',
    onChanged,
  })
  const entity = data?.entity
  const [edit, setEdit] = useState({
    title: '',
    ownerLabel: '',
    status: 'active',
    startDate: '',
    deadline: '',
    revenueTargetDh: '',
    marginTargetPercent: '',
    budgetDh: '',
    territories: '',
    accounts: '',
    kpis: '',
    nextAction: '',
    mandate: '',
  })
  const [missionTitle, setMissionTitle] = useState('')
  const [missionOwner, setMissionOwner] = useState('')
  const [outcome, setOutcome] = useState({ revenueValueDh: '', marginValueDh: '', confidence: '1', summary: '' })

  useEffect(() => {
    if (!entity) return
    setEdit({
      title: titleOf(entity),
      ownerLabel: ownerOf(entity),
      status: statusOf(entity),
      startDate: textOf(entity, 'startDate'),
      deadline: String(deadlineOf(entity) || ''),
      revenueTargetDh: String(numberOf(entity, 'revenueTargetDh') || ''),
      marginTargetPercent: String(numberOf(entity, 'marginTargetPercent') || ''),
      budgetDh: String(numberOf(entity, 'budgetDh') || numberOf(entity, 'budgetLimit') || ''),
      territories: arrayOf(entity, 'territories').join(' | '),
      accounts: arrayOf(entity, 'accounts').join(' | '),
      kpis: arrayOf(entity, 'kpis').join(' | '),
      nextAction: textOf(entity, 'nextAction'),
      mandate: textOf(entity, 'mandate', textOf(entity, 'description', textOf(entity, 'objective'))),
    })
  }, [entity])

  const notes = data?.notes || []
  const missions = data?.children || []
  const relations = data?.relations || []
  const milestones = notes.filter((item) => item.note_kind === 'milestone')
  const kpis = notes.filter((item) => item.note_kind === 'kpi')
  const accounts = notes.filter((item) => item.note_kind === 'account')
  const interventions = notes.filter((item) => item.note_kind === 'recovery' || item.note_kind === 'decision')
  const results = notes.filter((item) => item.note_kind === 'result')
  const target = numberOf(entity, 'revenueTargetDh')
  const actualFromEntity = numberOf(entity, 'actualRevenueDh')
  const actualFromNotes = results.reduce((sum, item) => sum + Number(item.value_numeric || 0), 0)
  const actual = Math.max(actualFromEntity, actualFromNotes)
  const budget = numberOf(entity, 'budgetDh') || numberOf(entity, 'budgetLimit')
  const programProgress = numberOf(entity, 'progress') || (missions.length ? missions.filter((item) => ['completed', 'closed'].includes(statusOf(item))).length / missions.length * 100 : 0)
  const activeMissions = missions.filter((item) => ['active', 'running', 'scheduled'].includes(statusOf(item))).length
  const pausedMissions = missions.filter((item) => statusOf(item) === 'paused').length
  const completedMissions = missions.filter((item) => ['completed', 'closed'].includes(statusOf(item))).length
  const atRisk = Math.max(0, target - actual) * (pausedMissions > 0 ? Math.min(0.75, pausedMissions / Math.max(1, missions.length)) : 0)
  const remaining = Math.max(0, target - actual)
  const realization = safeRatio(actual, target)
  const capacitySignal = missions.length ? clamp(activeMissions / missions.length * 100) : 0
  const health = useMemo(() => {
    const revenue = realization
    const velocity = clamp(programProgress)
    const milestonesScore = milestones.length ? clamp(milestones.filter((item) => item.status === 'completed').length / milestones.length * 100) : 50
    const riskPenalty = pausedMissions * 8
    return clamp((revenue * 0.4) + (velocity * 0.35) + (milestonesScore * 0.25) - riskPenalty)
  }, [milestones, pausedMissions, programProgress, realization])

  async function save() {
    await mutate('update_fields', {
      ...edit,
      revenueTargetDh: edit.revenueTargetDh ? Number(edit.revenueTargetDh) : undefined,
      marginTargetPercent: edit.marginTargetPercent ? Number(edit.marginTargetPercent) : undefined,
      budgetDh: edit.budgetDh ? Number(edit.budgetDh) : undefined,
      territories: edit.territories.split('|').map((item) => item.trim()).filter(Boolean),
      accounts: edit.accounts.split('|').map((item) => item.trim()).filter(Boolean),
      kpis: edit.kpis.split('|').map((item) => item.trim()).filter(Boolean),
    })
  }

  async function addOutcome() {
    await mutate('record_outcome', {
      outcomeType: 'program_value_realization',
      revenueValueDh: Number(outcome.revenueValueDh || 0),
      marginValueDh: Number(outcome.marginValueDh || 0),
      confidence: Number(outcome.confidence || 1),
      summary: outcome.summary,
    })
    setOutcome({ revenueValueDh: '', marginValueDh: '', confidence: '1', summary: '' })
  }

  const tabs: Array<{ key: View; label: string }> = [
    { key: 'value', label: 'Value realization' },
    { key: 'topology', label: `Topologie · ${missions.length}` },
    { key: 'intervention', label: `Interventions · ${interventions.length}` },
    { key: 'outcomes', label: `Résultats · ${results.length}` },
    { key: 'audit', label: 'Audit' },
  ]

  return <>
    <button type="button" onClick={() => setOpen(true)} className={`${compact ? 'px-3 py-2 text-[10px]' : 'px-4 py-2.5 text-xs'} inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white font-black text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400`}><BarChart3 size={14} />Value realization</button>
    {open ? <DossierBackdrop onClose={() => setOpen(false)} maxWidth="max-w-[1620px]">
      <header className="border-b border-emerald-100 bg-white px-5 py-4 sm:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-4"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-emerald-700 text-white shadow-lg"><Layers3 size={22} /></span><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-700">Revenue Portfolio Command & Value Realization Floor</p><h2 className="mt-1 truncate text-2xl font-black tracking-[-.04em] text-slate-950 sm:text-3xl">{data?.title || title || 'Programme Revenue OS'}</h2><div className="mt-2 flex flex-wrap items-center gap-2"><TonePill value={statusOf(entity)} /><span className="text-[10px] font-bold text-slate-500">{ownerOf(entity)}</span><span className="text-[10px] font-bold text-slate-400">Échéance {dateLabel(deadlineOf(entity))}</span></div></div></div>
          <div className="flex flex-wrap items-center gap-2"><LiveEntityActions entityType="program" entityId={entityId} compact /><button type="button" disabled={busy || !data} onClick={() => void save()} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"><Save size={14} />Enregistrer</button><button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600"><X size={17} /></button></div>
        </div>
        <nav className="mt-4 flex gap-2 overflow-x-auto pb-1">{tabs.map((tab) => <button key={tab.key} type="button" onClick={() => setView(tab.key)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-[9px] font-black uppercase tracking-[.08em] ${view === tab.key ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>{tab.label}</button>)}</nav>
      </header>

      <div className="relative min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
        {busy ? <BusyOverlay label="Synchronisation du programme…" /> : null}
        {message ? <p className={`mb-4 rounded-xl border p-3 text-xs font-bold ${message.includes('impossible') || message.includes('Échec') ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{message}</p> : null}

        {data && view === 'value' ? <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"><StudioMetric icon={Target} label="Cible" value={money(target)} detail="Objectif du programme" tone="emerald" /><StudioMetric icon={BadgeDollarSign} label="Réalisé" value={money(actual)} detail={`${realization.toFixed(0)}% de la cible`} tone="emerald" /><StudioMetric icon={TrendingDown} label="Valeur restante" value={money(remaining)} detail="Cible non réalisée" tone="amber" /><StudioMetric icon={AlertTriangle} label="Valeur exposée" value={money(atRisk)} detail={`${pausedMissions} mission(s) en pause`} tone="rose" /><StudioMetric icon={Gauge} label="Santé" value={`${Math.round(health)}%`} detail="Revenus · vélocité · jalons" tone={health >= 70 ? 'emerald' : health >= 45 ? 'amber' : 'rose'} /></div>

          <section className="rounded-[32px] border border-emerald-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-emerald-700">Value realization bridge</p><h3 className="mt-1 text-xl font-black text-slate-950">De la cible à la valeur effectivement produite</h3></div><button type="button" onClick={() => void mutate('duplicate')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-black text-slate-700"><Copy size={13} />Dupliquer</button></div>
            <div className="mt-6 grid gap-3 lg:grid-cols-4"><BridgeStep label="Cible initiale" value={target} tone="slate" detail="Engagement du programme" /><BridgeStep label="Valeur réalisée" value={actual} tone="emerald" detail={`${realization.toFixed(0)}% confirmé`} /><BridgeStep label="Valeur restante" value={remaining} tone="blue" detail="Travail encore requis" /><BridgeStep label="Exposition estimée" value={atRisk} tone="rose" detail="Selon les missions en pause" /></div>
            <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_340px]"><div><div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[.1em] text-slate-500"><span>Réalisation économique</span><span>{Math.round(realization)}%</span></div><div className="mt-2"><ProgressBar value={realization} tone="emerald" /></div><div className="mt-5 flex items-center justify-between text-[10px] font-black uppercase tracking-[.1em] text-slate-500"><span>Progression opérationnelle</span><span>{Math.round(programProgress)}%</span></div><div className="mt-2"><ProgressBar value={programProgress} tone="blue" /></div><div className="mt-5 flex items-center justify-between text-[10px] font-black uppercase tracking-[.1em] text-slate-500"><span>Capacité engagée</span><span>{Math.round(capacitySignal)}%</span></div><div className="mt-2"><ProgressBar value={capacitySignal} tone="amber" /></div></div><div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"><p className="text-[9px] font-black uppercase tracking-[.13em] text-slate-500">Économie du programme</p><div className="mt-4 grid grid-cols-2 gap-3"><ValueCell label="Budget" value={money(budget)} /><ValueCell label="Marge cible" value={`${numberOf(entity, 'marginTargetPercent') || 0}%`} /><ValueCell label="Comptes" value={arrayOf(entity, 'accounts').length + accounts.length} /><ValueCell label="Territoires" value={arrayOf(entity, 'territories').length} /></div></div></div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1fr_390px]">
            <div className="rounded-[30px] border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-emerald-700">Architecture financière & opérationnelle</p><h3 className="mt-1 text-xl font-black text-slate-950">Paramètres du programme</h3></div><WalletCards size={22} className="text-emerald-700" /></div><div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3"><StudioField label="Titre" value={edit.title} onChange={(value) => setEdit((current) => ({ ...current, title: value }))} /><StudioField label="Responsable" value={edit.ownerLabel} onChange={(value) => setEdit((current) => ({ ...current, ownerLabel: value }))} /><StudioSelect label="Statut" value={edit.status} onChange={(value) => setEdit((current) => ({ ...current, status: value }))} options={['active','running','paused','completed','closed','archived'].map((value) => ({ value, label: value }))} /><StudioField label="Début" value={edit.startDate} onChange={(value) => setEdit((current) => ({ ...current, startDate: value }))} type="date" /><StudioField label="Échéance" value={edit.deadline} onChange={(value) => setEdit((current) => ({ ...current, deadline: value }))} type="date" /><StudioField label="Prochaine action" value={edit.nextAction} onChange={(value) => setEdit((current) => ({ ...current, nextAction: value }))} /><StudioField label="Cible revenus (Dh)" value={edit.revenueTargetDh} onChange={(value) => setEdit((current) => ({ ...current, revenueTargetDh: value }))} type="number" /><StudioField label="Marge cible (%)" value={edit.marginTargetPercent} onChange={(value) => setEdit((current) => ({ ...current, marginTargetPercent: value }))} type="number" /><StudioField label="Budget (Dh)" value={edit.budgetDh} onChange={(value) => setEdit((current) => ({ ...current, budgetDh: value }))} type="number" /></div><div className="mt-4"><StudioTextArea label="Thèse du programme" value={edit.mandate} onChange={(value) => setEdit((current) => ({ ...current, mandate: value }))} rows={4} /></div><div className="mt-4 grid gap-4 md:grid-cols-3"><StudioTextArea label="Territoires · séparateur |" value={edit.territories} onChange={(value) => setEdit((current) => ({ ...current, territories: value }))} rows={3} /><StudioTextArea label="Comptes · séparateur |" value={edit.accounts} onChange={(value) => setEdit((current) => ({ ...current, accounts: value }))} rows={3} /><StudioTextArea label="KPIs · séparateur |" value={edit.kpis} onChange={(value) => setEdit((current) => ({ ...current, kpis: value }))} rows={3} /></div></div>
            <aside className="space-y-4"><section className={`rounded-[28px] border p-5 ${health >= 70 ? 'border-emerald-200 bg-emerald-50' : health >= 45 ? 'border-amber-200 bg-amber-50' : 'border-rose-200 bg-rose-50'}`}><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-600">Lecture dirigeante</p><h3 className="mt-2 text-xl font-black text-slate-950">{health >= 70 ? 'Programme sous contrôle' : health >= 45 ? 'Intervention recommandée' : 'Intervention immédiate'}</h3><p className="mt-3 text-xs leading-5 text-slate-600">{pausedMissions ? `${pausedMissions} mission(s) sont en pause et peuvent exposer ${money(atRisk)}.` : 'Aucune mission en pause ne dégrade actuellement la valeur.'}</p><button type="button" onClick={() => setView('intervention')} className="mt-4 inline-flex items-center gap-2 text-xs font-black text-slate-900">Ouvrir l’intervention<ArrowRight size={13} /></button></section><NoteComposer tone="emerald" defaultKind="decision" title="Décision de portefeuille" busy={busy} onAdd={(payload) => mutate('add_note', payload)} /></aside>
          </section>
        </div> : null}

        {data && view === 'topology' ? <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <section className="space-y-5"><section className="rounded-[30px] border border-emerald-200 bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-emerald-700">Program operating topology</p><h3 className="mt-1 text-xl font-black text-slate-950">Constellation des missions</h3></div><span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">{missions.length}</span></div><div className="mt-5 grid gap-4 lg:grid-cols-2">{missions.map((mission, index) => <article key={mission.id} className="rounded-[24px] border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><BriefcaseBusiness size={16} /></span><TonePill value={statusOf(mission)} /></div><h4 className="mt-3 text-base font-black text-slate-950">{titleOf(mission, `Mission ${index + 1}`)}</h4><p className="mt-1 text-xs text-slate-500">{ownerOf(mission)} · {dateLabel(deadlineOf(mission))}</p><div className="mt-4"><ProgressBar value={numberOf(mission, 'progress')} tone="emerald" /></div></article>)}{!missions.length ? <p className="col-span-full rounded-[24px] border border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500">Aucune mission. Créez la première mission du programme.</p> : null}</div></section><RelationManager relations={relations} tone="emerald" title="Relations de portefeuille" onLink={(payload) => mutate('link_entity', payload)} onUnlink={(relationId) => mutate('unlink_entity', { relationId })} /></section>
          <aside className="space-y-4"><section className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5"><p className="text-[9px] font-black uppercase tracking-[.15em] text-emerald-700">Créer dans le programme</p><div className="mt-4 space-y-3"><StudioField label="Mission" value={missionTitle} onChange={setMissionTitle} placeholder="Titre de la mission" /><StudioField label="Responsable" value={missionOwner} onChange={setMissionOwner} /></div><button type="button" disabled={!missionTitle.trim() || busy} onClick={async () => { await mutate('create_child', { title: missionTitle, ownerLabel: missionOwner || edit.ownerLabel, status: 'active' }); setMissionTitle(''); setMissionOwner('') }} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white disabled:opacity-40"><Plus size={14} />Créer la mission</button></section><div className="grid grid-cols-2 gap-3"><StudioMetric icon={Activity} label="Actives" value={activeMissions} detail="En exécution" tone="emerald" /><StudioMetric icon={CheckCircle2} label="Terminées" value={completedMissions} detail="Clôturées" tone="emerald" /></div></aside>
        </div> : null}

        {data && view === 'intervention' ? <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
          <section className="space-y-5"><section className="rounded-[30px] border border-amber-200 bg-amber-50 p-5"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-500 text-white"><AlertTriangle size={18} /></span><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-amber-800">Executive intervention mode</p><h3 className="text-xl font-black text-slate-950">Écarts et leviers de récupération</h3></div></div><div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4"><InterventionCell label="Écart revenus" value={money(remaining)} critical={remaining > 0} /><InterventionCell label="Missions en pause" value={String(pausedMissions)} critical={pausedMissions > 0} /><InterventionCell label="Jalons ouverts" value={String(milestones.filter((item) => item.status !== 'completed').length)} critical={milestones.some((item) => item.status !== 'completed')} /><InterventionCell label="Comptes documentés" value={String(arrayOf(entity, 'accounts').length + accounts.length)} critical={arrayOf(entity, 'accounts').length + accounts.length === 0} /></div></section><Panel title="Interventions persistées" count={interventions.length}><NoteFeed notes={interventions} empty="Aucune intervention documentée." onDelete={(noteId) => mutate('delete_note', { noteId })} /></Panel></section>
          <aside className="space-y-4"><NoteComposer tone="emerald" defaultKind="recovery" title="Créer une intervention" busy={busy} onAdd={(payload) => mutate('add_note', payload)} /><NoteComposer tone="emerald" defaultKind="milestone" title="Créer un jalon de récupération" busy={busy} onAdd={(payload) => mutate('add_note', payload)} /><section className="rounded-[28px] border border-slate-200 bg-white p-5"><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">Actions de programme</p><div className="mt-4"><LiveEntityActions entityType="program" entityId={entityId} /></div></section></aside>
        </div> : null}

        {data && view === 'outcomes' ? <div className="grid gap-5 xl:grid-cols-[1fr_390px]"><section className="space-y-5"><div className="grid gap-4 md:grid-cols-3"><StudioMetric icon={TrendingUp} label="Revenus" value={money(actual)} detail="Valeur documentée" tone="emerald" /><StudioMetric icon={Target} label="Réalisation" value={`${Math.round(realization)}%`} detail="Face à la cible" tone="emerald" /><StudioMetric icon={CalendarRange} label="Jalons" value={milestones.length} detail={`${milestones.filter((item) => item.status === 'completed').length} terminés`} tone="blue" /></div><Panel title="Résultats et valeur" count={results.length}><NoteFeed notes={results} empty="Aucun résultat documenté." onDelete={(noteId) => mutate('delete_note', { noteId })} /></Panel></section><aside className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5"><p className="text-[9px] font-black uppercase tracking-[.15em] text-emerald-700">Enregistrer la valeur</p><div className="mt-4 space-y-3"><StudioField label="Revenus (Dh)" value={outcome.revenueValueDh} onChange={(value) => setOutcome((current) => ({ ...current, revenueValueDh: value }))} type="number" /><StudioField label="Marge (Dh)" value={outcome.marginValueDh} onChange={(value) => setOutcome((current) => ({ ...current, marginValueDh: value }))} type="number" /><StudioField label="Confiance 0–1" value={outcome.confidence} onChange={(value) => setOutcome((current) => ({ ...current, confidence: value }))} type="number" /><StudioTextArea label="Résumé" value={outcome.summary} onChange={(value) => setOutcome((current) => ({ ...current, summary: value }))} rows={4} /></div><button type="button" disabled={busy} onClick={() => void addOutcome()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white"><BadgeDollarSign size={14} />Enregistrer</button></aside></div> : null}

        {data && view === 'audit' ? <section className="rounded-[30px] border border-slate-200 bg-white p-5"><AuditFeed items={data.audit} /></section> : null}
      </div>
    </DossierBackdrop> : null}
  </>
}

function BridgeStep({ label, value, detail, tone }: { label: string; value: number; detail: string; tone: 'slate' | 'emerald' | 'blue' | 'rose' }) {
  const styles = { slate: 'border-slate-200 bg-slate-50 text-slate-900', emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900', blue: 'border-blue-200 bg-blue-50 text-blue-900', rose: 'border-rose-200 bg-rose-50 text-rose-900' }[tone]
  return <article className={`rounded-[24px] border p-4 ${styles}`}><p className="text-[9px] font-black uppercase tracking-[.12em] opacity-70">{label}</p><p className="mt-2 text-2xl font-black tracking-[-.04em]">{money(value)}</p><p className="mt-1 text-[10px] opacity-70">{detail}</p></article>
}

function ValueCell({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl bg-white p-3"><p className="text-[8px] font-black uppercase tracking-[.1em] text-slate-400">{label}</p><p className="mt-1 truncate text-xs font-black text-slate-900">{value}</p></div>
}

function InterventionCell({ label, value, critical }: { label: string; value: string; critical: boolean }) {
  return <div className={`rounded-2xl border p-4 ${critical ? 'border-rose-200 bg-white' : 'border-emerald-200 bg-white'}`}><p className="text-[9px] font-black uppercase tracking-[.1em] text-slate-500">{label}</p><p className={`mt-2 text-xl font-black ${critical ? 'text-rose-700' : 'text-emerald-700'}`}>{value}</p></div>
}

function Panel({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  return <section className="rounded-[28px] border border-slate-200 bg-[#f8fafc] p-5"><div className="mb-4 flex items-center justify-between"><h3 className="text-base font-black text-slate-950">{title}</h3><span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-slate-600">{count}</span></div>{children}</section>
}

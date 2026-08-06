'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertOctagon, AlertTriangle, ArrowRight, BadgeDollarSign, CalendarClock,
  CheckCircle2, CircleAlert, Radar, Search, ShieldAlert, Siren, TimerReset,
  UserRoundCheck, Wrench,
} from 'lucide-react'
import CreateLiveEntityButton from './CreateLiveEntityButton'
import LiveEntityActions from '../live-operations/LiveEntityActions'
import RevenueIncidentDossier from './RevenueIncidentDossier'
import { useLiveEntities } from './useLiveEntities'
import {
  clamp, dateLabel, deadlineOf, daysRemaining, matches, money, numberOf, ownerOf,
  statusOf, textOf, titleOf,
} from './sovereign-workspace-utils'
import { ProgressBar, TonePill } from './SovereignDossierPrimitives'

type View = 'command' | 'priority' | 'recovery' | 'patterns'

export default function ExceptionsRecoveryWorkspace() {
  const exceptions = useLiveEntities('exception')
  const tasks = useLiveEntities('task')
  const programs = useLiveEntities('program')
  const missions = useLiveEntities('mission')
  const [query, setQuery] = useState('')
  const [severity, setSeverity] = useState('all')
  const [view, setView] = useState<View>('command')
  const [selectedId, setSelectedId] = useState('')

  const filtered = useMemo(() => exceptions.rows.filter((row) => matches(row, query, ['code','title','rootCause','description','ownerLabel','owner_id','sourceType']) && (severity === 'all' || textOf(row, 'severity') === severity)), [exceptions.rows, query, severity])
  useEffect(() => {
    if (!filtered.length) { setSelectedId(''); return }
    if (!filtered.some((row) => String(row.id) === selectedId)) setSelectedId(String(filtered[0].id))
  }, [filtered, selectedId])
  const selected = filtered.find((row) => String(row.id) === selectedId) || filtered[0]
  const selectedTasks = selected ? tasks.rows.filter((row) => textOf(row, 'exceptionId') === String(selected.id)) : []
  const selectedMission = selected ? missions.rows.find((row) => String(row.id) === textOf(selected, 'missionId', textOf(selected, 'sourceId', textOf(selected, 'source_id')))) : undefined
  const selectedProgram = selectedMission ? programs.rows.find((row) => String(row.id) === textOf(selectedMission, 'programId')) : undefined

  const active = exceptions.rows.filter((row) => !['closed','resolved','archived','cancelled'].includes(statusOf(row))).length
  const critical = exceptions.rows.filter((row) => textOf(row, 'severity') === 'critical' && !['closed','resolved'].includes(statusOf(row))).length
  const exposure = exceptions.rows.reduce((sum, row) => sum + numberOf(row, 'revenueImpactDh') + numberOf(row, 'revenue_impact_dh'), 0)
  const overdue = exceptions.rows.filter((row) => {
    const due = deadlineOf(row)
    return due && new Date(String(due)).getTime() < Date.now() && !['closed','resolved'].includes(statusOf(row))
  }).length
  const resolved = exceptions.rows.filter((row) => ['closed','resolved'].includes(statusOf(row))).length
  const recoverySuccess = exceptions.rows.length ? Math.round(resolved / exceptions.rows.length * 100) : 0

  const refreshAll = async () => {
    await Promise.all([exceptions.refresh(), tasks.refresh(), programs.refresh(), missions.refresh()])
  }
  const busy = exceptions.busy || tasks.busy || programs.busy || missions.busy
  const error = exceptions.error || tasks.error || programs.error || missions.error

  const patterns = useMemo(() => {
    const groups = new Map<string, Array<Record<string, any>>>()
    for (const row of filtered) {
      const cause = textOf(row, 'rootCause', 'Cause non documentée').trim() || 'Cause non documentée'
      const normalized = cause.length > 58 ? `${cause.slice(0, 58)}…` : cause
      groups.set(normalized, [...(groups.get(normalized) || []), row])
    }
    return [...groups.entries()].sort((a, b) => b[1].length - a[1].length)
  }, [filtered])

  return <main className="min-h-screen bg-[#fff5f5] px-4 py-6 sm:px-7 lg:px-10 xl:px-12">
    <section className="mx-auto max-w-[1840px]">
      <header className="overflow-hidden rounded-[34px] border border-rose-200 bg-white shadow-[0_28px_90px_rgba(190,24,93,.09)]">
        <div className="grid xl:grid-cols-[minmax(0,1fr)_620px]">
          <div className="relative overflow-hidden bg-[#3f0712] p-7 text-white sm:p-9"><div className="absolute -right-20 -top-20 h-80 w-80 rounded-full border border-rose-400/20" /><div className="absolute right-8 top-20 h-44 w-44 rounded-full bg-rose-600/20 blur-3xl" /><div className="relative"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-600"><Siren size={19} /></span><div><p className="text-[9px] font-black uppercase tracking-[.2em] text-rose-200">Revenue Incident Command & Recovery System</p><p className="mt-1 text-xs font-bold text-amber-200">Détecter → diagnostiquer → récupérer → vérifier</p></div></div><h1 className="mt-6 max-w-4xl text-4xl font-black tracking-[-.055em] sm:text-5xl">Protéger le revenu avec une intervention structurée.</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-rose-100">Chaque exception expose son blast radius, son revenu à risque, sa cause racine, ses tâches correctives, ses preuves, ses retries et son résultat de récupération.</p><div className="mt-7"><CreateLiveEntityButton entityType="exception" label="Déclarer un incident" onCreated={refreshAll} /></div></div></div>
          <div className="grid grid-cols-2 gap-px bg-slate-200 lg:grid-cols-3"><MetricBlock label="Actives" value={active} detail={`${exceptions.rows.length} dossiers`} icon={AlertTriangle} /><MetricBlock label="Critiques" value={critical} detail="Intervention immédiate" icon={AlertOctagon} /><MetricBlock label="Revenue exposé" value={money(exposure)} detail="Valeur totale" icon={BadgeDollarSign} /><MetricBlock label="Overdue" value={overdue} detail="Deadline dépassée" icon={TimerReset} /><MetricBlock label="Récupérées" value={resolved} detail="Dossiers résolus" icon={CheckCircle2} /><MetricBlock label="Recovery rate" value={`${recoverySuccess}%`} detail="Résolution historique" icon={Wrench} /></div>
        </div>
      </header>

      <section className="mt-5 grid gap-3 rounded-[26px] border border-slate-200 bg-white p-3 shadow-sm lg:grid-cols-[1fr_210px_auto_auto]"><label className="relative"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Incident, cause, source, owner…" className="h-12 w-full rounded-2xl border border-slate-200 pl-11 pr-4 text-sm font-semibold outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-100" /></label><select value={severity} onChange={(event) => setSeverity(event.target.value)} className="h-12 rounded-2xl border border-slate-200 px-4 text-sm font-bold"><option value="all">Toutes sévérités</option>{['critical','high','medium','low'].map((item) => <option key={item} value={item}>{item}</option>)}</select><div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">{(['command','priority','recovery','patterns'] as const).map((item) => <button type="button" key={item} onClick={() => setView(item)} className={`rounded-xl px-4 py-2 text-[9px] font-black uppercase ${view === item ? 'bg-slate-950 text-white' : 'text-slate-500'}`}>{item}</button>)}</div><button type="button" onClick={() => void refreshAll()} className="rounded-2xl border border-slate-200 px-4 text-xs font-black">Actualiser</button></section>

      {error ? <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">{error}</p> : null}
      {busy ? <div className="mt-6 grid min-h-80 place-items-center rounded-[30px] border border-slate-200 bg-white text-sm font-bold text-slate-500">Synchronisation du Revenue Incident Command…</div> : null}

      {!busy && view === 'command' ? <div className="mt-6 grid gap-5 2xl:grid-cols-[350px_minmax(0,1fr)_410px]">
        <aside className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between px-2"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-rose-700">Intervention queue</p><h2 className="mt-1 text-lg font-black text-slate-950">{filtered.length} incident(s)</h2></div><ShieldAlert size={19} className="text-rose-700" /></div>
          <div className="mt-4 max-h-[760px] space-y-2 overflow-y-auto pr-1">{filtered.slice().sort(prioritySort).map((row) => {
            const selectedRow = String(row.id) === String(selected?.id)
            const days = daysRemaining(deadlineOf(row))
            return <button key={row.id} type="button" onClick={() => setSelectedId(String(row.id))} className={`w-full rounded-[20px] border p-4 text-left transition ${selectedRow ? 'border-rose-300 bg-rose-50 shadow-sm' : 'border-slate-200 bg-white hover:border-rose-200'}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-[9px] font-black text-rose-700">{row.code}</p><h3 className="mt-1 line-clamp-2 text-sm font-black leading-5 text-slate-950">{titleOf(row)}</h3></div><TonePill value={textOf(row, 'severity', 'high')} /></div><div className="mt-3 grid grid-cols-2 gap-2"><MiniFact label="Exposure" value={money(numberOf(row, 'revenueImpactDh') + numberOf(row, 'revenue_impact_dh'))} /><MiniFact label="Deadline" value={days == null ? '—' : `${days} j`} /></div></button>
          })}{!filtered.length ? <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs font-semibold text-slate-500">Aucun incident correspondant.</p> : null}</div>
        </aside>

        <section className="min-w-0 space-y-5">
          {selected ? <>
            <section className="rounded-[32px] border border-rose-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,.06)] sm:p-6">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between"><div><p className="font-mono text-[10px] font-black text-rose-700">{selected.code}</p><h2 className="mt-2 text-3xl font-black tracking-[-.045em] text-slate-950">{titleOf(selected)}</h2><p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">{textOf(selected, 'rootCause', textOf(selected, 'description', 'Cause à diagnostiquer.'))}</p><div className="mt-3 flex flex-wrap gap-2"><TonePill value={textOf(selected, 'severity', 'high')} /><TonePill value={statusOf(selected)} /><span className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black text-slate-700">{ownerOf(selected)}</span></div></div><div className="flex flex-wrap gap-2"><LiveEntityActions entityType="exception" entityId={String(selected.id)} compact /><RevenueIncidentDossier entityId={String(selected.id)} title={titleOf(selected)} compact onChanged={refreshAll} /></div></div>
              <BlastRadius exception={selected} mission={selectedMission} program={selectedProgram} tasks={selectedTasks} />
            </section>

            <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
              <div className="rounded-[30px] border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-rose-700">Recovery orchestration</p><h3 className="mt-1 text-xl font-black text-slate-950">Plan et tâches correctives</h3></div><Wrench size={20} className="text-rose-700" /></div><RecoveryRunway exception={selected} tasks={selectedTasks} /><div className="mt-5 grid gap-3 lg:grid-cols-2">{selectedTasks.slice(0, 6).map((task) => <article key={task.id} className="rounded-[22px] border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-slate-950">{titleOf(task)}</p><p className="mt-1 text-[10px] text-slate-500">{ownerOf(task)} · {dateLabel(deadlineOf(task))}</p></div><TonePill value={statusOf(task)} /></div><div className="mt-3"><LiveEntityActions entityType="task" entityId={String(task.id)} compact /></div></article>)}{!selectedTasks.length ? <p className="col-span-full rounded-[22px] border border-dashed border-slate-300 p-6 text-center text-xs font-semibold text-slate-500">Aucune tâche corrective.</p> : null}</div></div>
              <aside className="space-y-4"><section className="rounded-[28px] border border-rose-200 bg-rose-950 p-5 text-white"><p className="text-[9px] font-black uppercase tracking-[.15em] text-rose-200">Revenue rescue clock</p><RescueClock exception={selected} tasks={selectedTasks} /></section><section className="rounded-[28px] border border-slate-200 bg-white p-5"><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">Next recovery action</p><p className="mt-3 text-sm font-black leading-6 text-slate-950">{textOf(selected, 'nextAction', textOf(selected, 'recoveryPlan', 'Ouvrez le dossier Incident Command pour créer le plan de récupération.'))}</p><button type="button" onClick={() => setView('recovery')} className="mt-4 inline-flex items-center gap-2 text-xs font-black text-rose-700">Ouvrir la récupération<ArrowRight size={13} /></button></section></aside>
            </section>
          </> : <EmptyState />}
        </section>

        <aside className="space-y-5">
          {selected ? <>
            <section className="rounded-[30px] border border-rose-200 bg-[#3f0712] p-5 text-white"><p className="text-[9px] font-black uppercase tracking-[.16em] text-rose-200">Intervention priority</p><PriorityScore exception={selected} tasks={selectedTasks} /></section>
            <section className="rounded-[30px] border border-slate-200 bg-white p-5"><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">Root-cause intelligence</p><h3 className="mt-2 text-lg font-black text-slate-950">{textOf(selected, 'rootCause', 'Cause non documentée')}</h3><p className="mt-3 text-xs leading-5 text-slate-600">{textOf(selected, 'recoveryPlan', 'Aucun plan de récupération documenté.')}</p></section>
          </> : <EmptyState />}
        </aside>
      </div> : null}

      {!busy && view === 'priority' ? <section className="mt-6 rounded-[32px] border border-rose-200 bg-white p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-rose-700">Intervention priority grid</p><h2 className="mt-1 text-xl font-black text-slate-950">Revenue exposure × urgence × recoverability</h2></div><Radar size={22} className="text-rose-700" /></div><PriorityGrid rows={filtered} selectedId={selectedId} onSelect={setSelectedId} /><div className="mt-6 grid gap-4 xl:grid-cols-2">{filtered.slice().sort(prioritySort).map((row) => <article key={row.id} className="rounded-[26px] border border-slate-200 p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[9px] font-black text-rose-700">{row.code}</p><h3 className="mt-1 text-lg font-black text-slate-950">{titleOf(row)}</h3></div><TonePill value={textOf(row, 'severity', 'high')} /></div><div className="mt-4 grid grid-cols-3 gap-3"><MiniFact label="Exposure" value={money(numberOf(row, 'revenueImpactDh') + numberOf(row, 'revenue_impact_dh'))} /><MiniFact label="Deadline" value={dateLabel(deadlineOf(row))} /><MiniFact label="Owner" value={ownerOf(row)} /></div><div className="mt-4 flex gap-2"><LiveEntityActions entityType="exception" entityId={String(row.id)} compact /><RevenueIncidentDossier entityId={String(row.id)} title={titleOf(row)} compact onChanged={refreshAll} /></div></article>)}</div></section> : null}

      {!busy && view === 'recovery' ? <section className="mt-6 grid gap-5 xl:grid-cols-2">{filtered.map((row) => {
        const rowTasks = tasks.rows.filter((task) => textOf(task, 'exceptionId') === String(row.id))
        const completed = rowTasks.filter((task) => ['completed','closed'].includes(statusOf(task))).length
        const progress = rowTasks.length ? completed / rowTasks.length * 100 : 0
        return <article key={row.id} className="rounded-[30px] border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-[9px] font-black uppercase tracking-[.12em] text-rose-700">Recovery case</p><h2 className="mt-2 text-xl font-black text-slate-950">{titleOf(row)}</h2></div><TonePill value={statusOf(row)} /></div><div className="mt-5"><div className="flex justify-between text-[10px] font-black text-slate-500"><span>Progression corrective</span><span>{Math.round(progress)}%</span></div><div className="mt-2"><ProgressBar value={progress} tone="rose" /></div></div><div className="mt-5 grid grid-cols-3 gap-3"><MiniFact label="Tâches" value={String(rowTasks.length)} /><MiniFact label="Terminées" value={String(completed)} /><MiniFact label="Exposure" value={money(numberOf(row, 'revenueImpactDh') + numberOf(row, 'revenue_impact_dh'))} /></div><div className="mt-5 flex gap-2"><LiveEntityActions entityType="exception" entityId={String(row.id)} compact /><RevenueIncidentDossier entityId={String(row.id)} title={titleOf(row)} compact onChanged={refreshAll} /></div></article>
      })}{!filtered.length ? <EmptyState /> : null}</section> : null}

      {!busy && view === 'patterns' ? <section className="mt-6 grid gap-5 xl:grid-cols-3">{patterns.map(([cause, rows]) => {
        const impact = rows.reduce((sum, row) => sum + numberOf(row, 'revenueImpactDh') + numberOf(row, 'revenue_impact_dh'), 0)
        return <article key={cause} className="rounded-[30px] border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-50 text-rose-700"><CircleAlert size={18} /></span><span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-800">{rows.length}</span></div><h2 className="mt-4 text-lg font-black leading-6 text-slate-950">{cause}</h2><p className="mt-3 text-sm font-black text-rose-700">{money(impact)} exposés</p><div className="mt-4 space-y-2">{rows.slice(0, 4).map((row) => <button key={row.id} type="button" onClick={() => { setSelectedId(String(row.id)); setView('command') }} className="flex w-full items-center justify-between rounded-xl bg-slate-50 p-3 text-left"><span className="truncate text-[10px] font-black text-slate-800">{titleOf(row)}</span><ArrowRight size={12} className="text-rose-700" /></button>)}</div></article>
      })}{!patterns.length ? <EmptyState /> : null}</section> : null}
    </section>
  </main>
}

function prioritySort(a: Record<string, any>, b: Record<string, any>) {
  const severityWeight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }
  const aScore = (severityWeight[textOf(a, 'severity', 'medium')] || 2) * 1_000_000 + numberOf(a, 'revenueImpactDh') + numberOf(a, 'revenue_impact_dh')
  const bScore = (severityWeight[textOf(b, 'severity', 'medium')] || 2) * 1_000_000 + numberOf(b, 'revenueImpactDh') + numberOf(b, 'revenue_impact_dh')
  return bScore - aScore
}
function BlastRadius({ exception, mission, program, tasks }: { exception: Record<string, any>; mission?: Record<string, any>; program?: Record<string, any>; tasks: Array<Record<string, any>> }) { return <div className="mt-6"><div className="grid gap-3 lg:grid-cols-6"><BlastNode label="Incident" value={titleOf(exception)} ready /><BlastNode label="Source" value={textOf(exception, 'sourceType', textOf(exception, 'source_type', 'Non reliée'))} ready={Boolean(textOf(exception, 'sourceType', textOf(exception, 'source_type')))} /><BlastNode label="Mission" value={mission ? titleOf(mission) : 'Non reliée'} ready={Boolean(mission)} /><BlastNode label="Programme" value={program ? titleOf(program) : 'Non relié'} ready={Boolean(program)} /><BlastNode label="Correctifs" value={`${tasks.length} tâche(s)`} ready={tasks.length > 0} /><BlastNode label="Exposure" value={money(numberOf(exception, 'revenueImpactDh') + numberOf(exception, 'revenue_impact_dh'))} ready={numberOf(exception, 'revenueImpactDh') + numberOf(exception, 'revenue_impact_dh') > 0} /></div></div> }
function BlastNode({ label, value, ready }: { label: string; value: string; ready: boolean }) { return <div className={`rounded-[20px] border p-4 ${ready ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}><p className="text-[8px] font-black uppercase tracking-[.1em] text-slate-500">{label}</p><p className="mt-2 line-clamp-2 text-[10px] font-black leading-4 text-slate-900">{value}</p></div> }
function RecoveryRunway({ exception, tasks }: { exception: Record<string, any>; tasks: Array<Record<string, any>> }) { const completed = tasks.filter((task) => ['completed','closed'].includes(statusOf(task))).length; const steps = [{ label:'Détection', done:true }, { label:'Diagnostic', done:Boolean(textOf(exception, 'rootCause')) }, { label:'Plan', done:Boolean(textOf(exception, 'recoveryPlan')) }, { label:'Correctifs', done:tasks.length > 0 }, { label:'Vérification', done:completed > 0 }, { label:'Clôture', done:['closed','resolved'].includes(statusOf(exception)) }]; return <div className="mt-5 grid gap-3 md:grid-cols-6">{steps.map((step, index) => <div key={step.label} className={`rounded-[20px] border p-4 ${step.done ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}><span className={`grid h-8 w-8 place-items-center rounded-xl text-[10px] font-black text-white ${step.done ? 'bg-rose-700' : 'bg-slate-300'}`}>{step.done ? <CheckCircle2 size={13} /> : index + 1}</span><p className="mt-3 text-[8px] font-black uppercase tracking-[.1em] text-slate-600">{step.label}</p></div>)}</div> }
function RescueClock({ exception, tasks }: { exception: Record<string, any>; tasks: Array<Record<string, any>> }) { const days = daysRemaining(deadlineOf(exception)); const open = tasks.filter((task) => !['completed','closed','cancelled'].includes(statusOf(task))).length; return <><div className="mt-3 flex items-end justify-between"><p className="text-5xl font-black tracking-[-.06em]">{days == null ? '—' : `${days}j`}</p><TimerReset size={25} className={days != null && days < 0 ? 'text-rose-300' : 'text-amber-300'} /></div><p className="mt-3 text-xs leading-5 text-rose-100">{money(numberOf(exception, 'revenueImpactDh') + numberOf(exception, 'revenue_impact_dh'))} exposés · {open} correction(s) ouverte(s).</p></> }
function PriorityScore({ exception, tasks }: { exception: Record<string, any>; tasks: Array<Record<string, any>> }) { const severity = { critical:100, high:75, medium:50, low:25 }[textOf(exception, 'severity', 'medium')] || 50; const exposure = Math.min(100, (numberOf(exception, 'revenueImpactDh') + numberOf(exception, 'revenue_impact_dh')) / 10_000); const days = daysRemaining(deadlineOf(exception)); const urgency = days == null ? 35 : days <= 0 ? 100 : Math.max(10, 100 - days * 10); const recoverability = tasks.length ? clamp(tasks.filter((task) => ['completed','closed'].includes(statusOf(task))).length / tasks.length * 100) : 20; const score = clamp(severity * .35 + exposure * .3 + urgency * .25 + (100 - recoverability) * .1); return <><div className="mt-3 flex items-end justify-between"><p className="text-5xl font-black tracking-[-.06em]">{Math.round(score)}</p><Radar size={25} className="text-rose-300" /></div><div className="mt-4"><ProgressBar value={score} tone="rose" /></div><div className="mt-5 space-y-3"><ScoreLine label="Sévérité" value={severity} /><ScoreLine label="Exposition" value={exposure} /><ScoreLine label="Urgence" value={urgency} /><ScoreLine label="Récupération" value={recoverability} /></div></> }
function ScoreLine({ label, value }: { label: string; value: number }) { return <div><div className="flex justify-between text-[9px] font-black uppercase tracking-[.1em] text-rose-100"><span>{label}</span><span>{Math.round(value)}</span></div><div className="mt-1"><ProgressBar value={value} tone="rose" /></div></div> }
function PriorityGrid({ rows, selectedId, onSelect }: { rows: Array<Record<string, any>>; selectedId: string; onSelect: (id: string) => void }) { const maxExposure = Math.max(...rows.map((row) => numberOf(row, 'revenueImpactDh') + numberOf(row, 'revenue_impact_dh')), 1); return <div className="relative mt-6 h-[480px] overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:25%_25%]"><div className="absolute inset-x-6 bottom-4 flex justify-between text-[9px] font-black uppercase tracking-[.1em] text-slate-400"><span>Faible urgence</span><span>Urgence maximale</span></div><div className="absolute bottom-10 left-3 top-5 flex flex-col justify-between text-[9px] font-black uppercase tracking-[.1em] text-slate-400"><span>Exposure élevée</span><span>Exposure faible</span></div>{rows.map((row) => { const exposure = numberOf(row, 'revenueImpactDh') + numberOf(row, 'revenue_impact_dh'); const days = daysRemaining(deadlineOf(row)); const urgency = days == null ? 35 : days <= 0 ? 100 : Math.max(10, 100 - days * 10); const left = 9 + urgency * .82; const top = 8 + (1 - exposure / maxExposure) * 72; const size = textOf(row, 'severity') === 'critical' ? 88 : textOf(row, 'severity') === 'high' ? 72 : 58; const selected = String(row.id) === selectedId; return <button key={row.id} type="button" onClick={() => onSelect(String(row.id))} className={`absolute grid place-items-center rounded-full border-4 text-center shadow-xl transition hover:scale-105 ${selected ? 'border-rose-800 bg-rose-100' : 'border-rose-300 bg-white'}`} style={{ left:`${left}%`, top:`${top}%`, width:size, height:size, transform:'translate(-50%, -50%)' }} title={`${titleOf(row)} · ${money(exposure)}`}><span className="line-clamp-2 px-2 text-[8px] font-black leading-3 text-rose-950">{row.code}</span></button>})}{!rows.length ? <div className="absolute inset-0 grid place-items-center text-sm font-semibold text-slate-500">Aucun incident à cartographier.</div> : null}</div> }
function MetricBlock({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail: string; icon: typeof AlertTriangle }) { return <div className="bg-white p-5"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-rose-50 text-rose-700"><Icon size={16} /></span><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-500">{label}</p></div><p className="mt-3 text-2xl font-black tracking-[-.04em] text-slate-950">{value}</p><p className="mt-1 text-[10px] text-slate-500">{detail}</p></div> }
function MiniFact({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[8px] font-black uppercase tracking-[.1em] text-slate-400">{label}</p><p className="mt-1 truncate text-[10px] font-black text-slate-900">{value}</p></div> }
function EmptyState() { return <div className="col-span-full grid min-h-72 place-items-center rounded-[30px] border border-dashed border-slate-300 bg-white text-center"><div><ShieldAlert size={28} className="mx-auto text-slate-300" /><h2 className="mt-4 text-xl font-black text-slate-950">Aucun incident</h2><p className="mt-2 text-sm text-slate-500">Les incidents opérationnels apparaîtront ici avec leur récupération.</p></div></div> }

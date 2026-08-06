'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, BadgeDollarSign, CalendarClock, CheckCircle2, Circle,
  CirclePlay, Clock3, ListChecks, Pause, PlaneTakeoff, Search, ShieldAlert,
  UserRoundCheck, UsersRound,
} from 'lucide-react'
import CreateLiveEntityButton from './CreateLiveEntityButton'
import LiveEntityActions from '../live-operations/LiveEntityActions'
import MissionControlDossier from './MissionControlDossier'
import { useLiveEntities } from './useLiveEntities'
import {
  dateLabel, deadlineOf, matches, money, numberOf, ownerOf, parentIdOf,
  statusOf, textOf, titleOf,
} from './sovereign-workspace-utils'
import { ProgressBar, TonePill } from './SovereignDossierPrimitives'

type View = 'control' | 'lanes' | 'workload' | 'timeline'

export default function MissionsOperationsWorkspace() {
  const missions = useLiveEntities('mission')
  const tasks = useLiveEntities('task')
  const programs = useLiveEntities('program')
  const exceptions = useLiveEntities('exception')
  const [query, setQuery] = useState('')
  const [view, setView] = useState<View>('control')
  const [selectedId, setSelectedId] = useState('')

  const filtered = useMemo(() => missions.rows.filter((row) => matches(row, query, ['code','title','purpose','description','ownerLabel','accounts','territories'])), [missions.rows, query])
  useEffect(() => {
    if (!filtered.length) { setSelectedId(''); return }
    if (!filtered.some((row) => String(row.id) === selectedId)) setSelectedId(String(filtered[0].id))
  }, [filtered, selectedId])
  const selected = filtered.find((row) => String(row.id) === selectedId) || filtered[0]
  const selectedTasks = selected ? tasks.rows.filter((row) => parentIdOf(row, 'mission') === String(selected.id)) : []
  const selectedProgram = selected ? programs.rows.find((row) => String(row.id) === parentIdOf(selected, 'program')) : undefined
  const selectedExceptions = selected ? exceptions.rows.filter((row) => textOf(row, 'missionId', textOf(row, 'sourceId', textOf(row, 'source_id'))) === String(selected.id)) : []

  const running = missions.rows.filter((row) => statusOf(row) === 'running').length
  const dueToday = missions.rows.filter((row) => {
    const deadline = deadlineOf(row)
    return deadline && new Date(String(deadline)).toDateString() === new Date().toDateString()
  }).length
  const blocked = tasks.rows.filter((row) => statusOf(row) === 'paused' || textOf(row, 'blocked') === 'true').length
  const completed = missions.rows.filter((row) => ['completed','closed'].includes(statusOf(row))).length
  const evidenceMissing = missions.rows.filter((row) => numberOf(row, 'evidenceCount') === 0 && ['active','running'].includes(statusOf(row))).length
  const owners = new Set(missions.rows.map(ownerOf).filter((owner) => owner !== 'Non assigné')).size
  const revenue = missions.rows.reduce((sum, row) => sum + numberOf(row, 'actualRevenueDh') + numberOf(row, 'revenueInfluencedDh'), 0)

  const refreshAll = async () => {
    await Promise.all([missions.refresh(), tasks.refresh(), programs.refresh(), exceptions.refresh()])
  }

  const busy = missions.busy || tasks.busy || programs.busy || exceptions.busy
  const error = missions.error || tasks.error || programs.error || exceptions.error

  const columns = useMemo(() => {
    const missionRows = filtered.map((row) => {
      const rowTasks = tasks.rows.filter((task) => parentIdOf(task, 'mission') === String(row.id))
      const rowBlocked = rowTasks.some((task) => statusOf(task) === 'paused' || textOf(task, 'blocked') === 'true')
      let lane = statusOf(row)
      if (rowBlocked && !['completed','closed'].includes(lane)) lane = 'blocked'
      if (!['planned','active','running','paused','blocked','completed','closed','cancelled'].includes(lane)) lane = 'active'
      return { row, lane, tasks: rowTasks }
    })
    return {
      planned: missionRows.filter((item) => ['draft','planned'].includes(item.lane)),
      ready: missionRows.filter((item) => item.lane === 'active'),
      running: missionRows.filter((item) => item.lane === 'running'),
      blocked: missionRows.filter((item) => item.lane === 'blocked'),
      paused: missionRows.filter((item) => item.lane === 'paused'),
      completed: missionRows.filter((item) => ['completed','closed'].includes(item.lane)),
    }
  }, [filtered, tasks.rows])

  return <main className="min-h-screen bg-[#f3f5fb] px-4 py-6 sm:px-7 lg:px-10 xl:px-12">
    <section className="mx-auto max-w-[1880px]">
      <header className="overflow-hidden rounded-[34px] border border-indigo-200 bg-white shadow-[0_28px_90px_rgba(79,70,229,.09)]">
        <div className="grid xl:grid-cols-[minmax(0,1fr)_620px]">
          <div className="relative overflow-hidden bg-indigo-950 p-7 text-white sm:p-9"><div className="absolute -right-20 -top-20 h-80 w-80 rounded-full border border-indigo-400/20" /><div className="absolute right-8 top-20 h-44 w-44 rounded-full bg-indigo-600/20 blur-3xl" /><div className="relative"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-600"><PlaneTakeoff size={19} /></span><div><p className="text-[9px] font-black uppercase tracking-[.2em] text-indigo-200">Commercial Mission Control & Execution Network</p><p className="mt-1 text-xs font-bold text-cyan-200">Flight plan → tâches → evidence → outcome</p></div></div><h1 className="mt-6 max-w-4xl text-4xl font-black tracking-[-.055em] sm:text-5xl">Contrôler l’exécution commerciale en temps réel.</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-indigo-100">Les missions sont pilotées par dépendances, responsabilités, tâches, échéances, preuves, communications, blocages et résultats—not par simples cartes statiques.</p><div className="mt-7 flex flex-wrap gap-3"><CreateLiveEntityButton entityType="mission" label="Créer une mission" onCreated={refreshAll} /><a href="/revenue-command-os/mission-compiler" className="rounded-2xl border border-indigo-400/40 bg-white/10 px-5 py-3 text-xs font-black text-white">Ouvrir le compilateur</a></div></div></div>
          <div className="grid grid-cols-2 gap-px bg-slate-200 lg:grid-cols-3"><MetricBlock label="En exécution" value={running} detail="Missions running" icon={CirclePlay} /><MetricBlock label="Due today" value={dueToday} detail="Échéance aujourd’hui" icon={CalendarClock} /><MetricBlock label="Tâches bloquées" value={blocked} detail="Pause ou blocage" icon={AlertTriangle} /><MetricBlock label="Evidence manquante" value={evidenceMissing} detail="Mission active sans preuve" icon={ShieldAlert} /><MetricBlock label="Responsables" value={owners} detail="Charge répartie" icon={UsersRound} /><MetricBlock label="Revenue influencé" value={money(revenue)} detail={`${completed} missions terminées`} icon={BadgeDollarSign} /></div>
        </div>
      </header>

      <section className="mt-5 grid gap-3 rounded-[26px] border border-slate-200 bg-white p-3 shadow-sm lg:grid-cols-[1fr_auto_auto]"><label className="relative"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mission, owner, programme, compte…" className="h-12 w-full rounded-2xl border border-slate-200 pl-11 pr-4 text-sm font-semibold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100" /></label><div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">{(['control','lanes','workload','timeline'] as const).map((item) => <button type="button" key={item} onClick={() => setView(item)} className={`rounded-xl px-4 py-2 text-[9px] font-black uppercase ${view === item ? 'bg-slate-950 text-white' : 'text-slate-500'}`}>{item}</button>)}</div><button type="button" onClick={() => void refreshAll()} className="rounded-2xl border border-slate-200 px-4 text-xs font-black">Actualiser</button></section>

      {error ? <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">{error}</p> : null}
      {busy ? <div className="mt-6 grid min-h-80 place-items-center rounded-[30px] border border-slate-200 bg-white text-sm font-bold text-slate-500">Synchronisation du Mission Control…</div> : null}

      {!busy && view === 'control' ? <div className="mt-6 grid gap-5 2xl:grid-cols-[350px_minmax(0,1fr)_410px]">
        <aside className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between px-2"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-indigo-700">Mission queue</p><h2 className="mt-1 text-lg font-black text-slate-950">{filtered.length} mission(s)</h2></div><ListChecks size={19} className="text-indigo-700" /></div>
          <div className="mt-4 max-h-[760px] space-y-2 overflow-y-auto pr-1">{filtered.map((row) => {
            const rowTasks = tasks.rows.filter((task) => parentIdOf(task, 'mission') === String(row.id))
            const completion = rowTasks.length ? rowTasks.filter((task) => ['completed','closed'].includes(statusOf(task))).length / rowTasks.length * 100 : 0
            const selectedRow = String(row.id) === String(selected?.id)
            return <button key={row.id} type="button" onClick={() => setSelectedId(String(row.id))} className={`w-full rounded-[20px] border p-4 text-left transition ${selectedRow ? 'border-indigo-300 bg-indigo-50 shadow-sm' : 'border-slate-200 bg-white hover:border-indigo-200'}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-[9px] font-black text-indigo-700">{row.code}</p><h3 className="mt-1 line-clamp-2 text-sm font-black leading-5 text-slate-950">{titleOf(row)}</h3></div><TonePill value={statusOf(row)} /></div><p className="mt-2 truncate text-[10px] text-slate-500">{ownerOf(row)} · {dateLabel(deadlineOf(row))}</p><div className="mt-3"><div className="flex justify-between text-[9px] font-black text-slate-400"><span>{rowTasks.length} tâches</span><span>{Math.round(completion)}%</span></div><div className="mt-1"><ProgressBar value={completion} tone="indigo" /></div></div></button>
          })}{!filtered.length ? <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs font-semibold text-slate-500">Aucune mission correspondante.</p> : null}</div>
        </aside>

        <section className="min-w-0 space-y-5">
          {selected ? <>
            <section className="rounded-[32px] border border-indigo-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,.06)] sm:p-6">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between"><div><p className="font-mono text-[10px] font-black text-indigo-700">{selected.code}</p><h2 className="mt-2 text-3xl font-black tracking-[-.045em] text-slate-950">{titleOf(selected)}</h2><p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">{textOf(selected, 'purpose', textOf(selected, 'description', 'Mission opérationnelle Revenue OS.'))}</p><div className="mt-3 flex flex-wrap gap-2"><TonePill value={statusOf(selected)} /><span className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black text-slate-700">{ownerOf(selected)}</span><span className="rounded-full bg-amber-50 px-3 py-1 text-[9px] font-black text-amber-800">{dateLabel(deadlineOf(selected))}</span>{selectedProgram ? <span className="rounded-full bg-indigo-50 px-3 py-1 text-[9px] font-black text-indigo-700">{titleOf(selectedProgram)}</span> : null}</div></div><div className="flex flex-wrap gap-2"><LiveEntityActions entityType="mission" entityId={String(selected.id)} compact /><MissionControlDossier entityId={String(selected.id)} title={titleOf(selected)} compact onChanged={refreshAll} /></div></div>
              <MissionNetwork mission={selected} tasks={selectedTasks} exceptions={selectedExceptions} />
            </section>

            <section className="grid gap-5 xl:grid-cols-[1fr_350px]">
              <div className="rounded-[30px] border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-indigo-700">Live execution timeline</p><h3 className="mt-1 text-xl font-black text-slate-950">Prochaines tâches et activité</h3></div><Activity size={20} className="text-indigo-700" /></div><div className="relative mt-5 space-y-3 before:absolute before:bottom-4 before:left-[17px] before:top-4 before:w-px before:bg-indigo-200">{selectedTasks.slice().sort((a, b) => String(deadlineOf(a) || '').localeCompare(String(deadlineOf(b) || ''))).slice(0, 8).map((task) => <article key={task.id} className="relative flex gap-4"><span className={`relative z-10 mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-white ${['completed','closed'].includes(statusOf(task)) ? 'bg-emerald-600' : statusOf(task) === 'paused' ? 'bg-rose-600' : 'bg-indigo-700'}`}>{['completed','closed'].includes(statusOf(task)) ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}</span><div className="min-w-0 flex-1 rounded-[20px] border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-black text-slate-950">{titleOf(task)}</p><p className="mt-1 text-[9px] text-slate-500">{ownerOf(task)} · {dateLabel(deadlineOf(task))}</p></div><TonePill value={statusOf(task)} /></div><div className="mt-3 flex gap-2"><LiveEntityActions entityType="task" entityId={String(task.id)} compact /></div></div></article>)}{!selectedTasks.length ? <p className="ml-12 rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs font-semibold text-slate-500">Aucune tâche liée.</p> : null}</div></div>
              <aside className="space-y-4"><DailyPulse tasks={selectedTasks} /><section className="rounded-[28px] border border-slate-200 bg-white p-5"><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">Next required action</p><p className="mt-3 text-sm font-black leading-6 text-slate-950">{textOf(selected, 'nextAction', selectedTasks.find((task) => !['completed','closed'].includes(statusOf(task))) ? titleOf(selectedTasks.find((task) => !['completed','closed'].includes(statusOf(task)))) : 'Aucune action ouverte.')}</p><button type="button" onClick={() => setView('lanes')} className="mt-4 inline-flex items-center gap-2 text-xs font-black text-indigo-700">Ouvrir les lanes<CirclePlay size={13} /></button></section></aside>
            </section>
          </> : <EmptyState />}
        </section>

        <aside className="space-y-5">
          {selected ? <>
            <section className="rounded-[30px] border border-indigo-200 bg-indigo-950 p-5 text-white"><p className="text-[9px] font-black uppercase tracking-[.16em] text-indigo-200">Mission readiness engine</p><MissionReadiness mission={selected} tasks={selectedTasks} exceptions={selectedExceptions} /></section>
            <section className="rounded-[30px] border border-slate-200 bg-white p-5"><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">Workload & evidence</p><div className="mt-4 space-y-3"><WorkloadLine label="Tâches ouvertes" value={selectedTasks.filter((task) => !['completed','closed','cancelled'].includes(statusOf(task))).length} /><WorkloadLine label="Bloquées" value={selectedTasks.filter((task) => statusOf(task) === 'paused' || textOf(task, 'blocked') === 'true').length} /><WorkloadLine label="Evidence" value={numberOf(selected, 'evidenceCount')} /><WorkloadLine label="Exceptions" value={selectedExceptions.length} /></div></section>
          </> : <EmptyState />}
        </aside>
      </div> : null}

      {!busy && view === 'lanes' ? <section className="mt-6 overflow-x-auto pb-4"><div className="flex min-w-max gap-4"><MissionLane title="Planned" tone="slate" items={columns.planned} onChanged={refreshAll} /><MissionLane title="Ready" tone="blue" items={columns.ready} onChanged={refreshAll} /><MissionLane title="In execution" tone="indigo" items={columns.running} onChanged={refreshAll} /><MissionLane title="Blocked" tone="rose" items={columns.blocked} onChanged={refreshAll} /><MissionLane title="Paused" tone="amber" items={columns.paused} onChanged={refreshAll} /><MissionLane title="Completed" tone="emerald" items={columns.completed} onChanged={refreshAll} /></div></section> : null}

      {!busy && view === 'workload' ? <section className="mt-6 grid gap-5 xl:grid-cols-3">{Object.entries(filtered.reduce<Record<string, Array<Record<string, any>>>>((acc, row) => { const owner = ownerOf(row); (acc[owner] ||= []).push(row); return acc }, {})).map(([owner, ownerMissions]) => {
        const ownerMissionIds = new Set(ownerMissions.map((row) => String(row.id)))
        const ownerTasks = tasks.rows.filter((task) => ownerMissionIds.has(parentIdOf(task, 'mission')))
        return <article key={owner} className="rounded-[30px] border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.12em] text-indigo-700">Owner workload</p><h2 className="mt-1 text-xl font-black text-slate-950">{owner}</h2></div><UserRoundCheck size={20} className="text-indigo-700" /></div><div className="mt-5 grid grid-cols-3 gap-3"><WorkloadCell label="Missions" value={ownerMissions.length} /><WorkloadCell label="Tâches" value={ownerTasks.length} /><WorkloadCell label="Bloquées" value={ownerTasks.filter((task) => statusOf(task) === 'paused').length} /></div><div className="mt-5 space-y-3">{ownerMissions.map((row) => <div key={row.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><p className="text-sm font-black text-slate-950">{titleOf(row)}</p><TonePill value={statusOf(row)} /></div><div className="mt-3"><MissionControlDossier entityId={String(row.id)} title={titleOf(row)} compact onChanged={refreshAll} /></div></div>)}</div></article>
      })}{!filtered.length ? <EmptyState /> : null}</section> : null}

      {!busy && view === 'timeline' ? <section className="mt-6 rounded-[30px] border border-slate-200 bg-white p-6"><div className="relative space-y-4 before:absolute before:bottom-4 before:left-[21px] before:top-4 before:w-px before:bg-indigo-200">{filtered.slice().sort((a, b) => String(deadlineOf(a) || '').localeCompare(String(deadlineOf(b) || ''))).map((row) => {
        const rowTasks = tasks.rows.filter((task) => parentIdOf(task, 'mission') === String(row.id))
        return <article key={row.id} className="relative flex gap-4"><span className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-700 text-white"><PlaneTakeoff size={16} /></span><div className="grid min-w-0 flex-1 gap-3 rounded-[22px] border border-slate-200 p-4 lg:grid-cols-[1fr_180px_140px_140px_auto] lg:items-center"><div><p className="text-sm font-black text-slate-950">{titleOf(row)}</p><p className="mt-1 text-[10px] text-slate-500">{ownerOf(row)}</p></div><p className="text-xs font-bold text-slate-600">{dateLabel(deadlineOf(row))}</p><p className="text-xs font-black text-slate-950">{rowTasks.length} tâche(s)</p><TonePill value={statusOf(row)} /><MissionControlDossier entityId={String(row.id)} title={titleOf(row)} compact onChanged={refreshAll} /></div></article>
      })}</div></section> : null}
    </section>
  </main>
}

function MissionNetwork({ mission, tasks, exceptions }: { mission: Record<string, any>; tasks: Array<Record<string, any>>; exceptions: Array<Record<string, any>> }) {
  const completion = tasks.length ? tasks.filter((task) => ['completed','closed'].includes(statusOf(task))).length / tasks.length * 100 : 0
  return <div className="mt-6"><div className="grid gap-3 lg:grid-cols-6"><NetworkNode label="Purpose" value={textOf(mission, 'purpose', 'À documenter')} ready={Boolean(textOf(mission, 'purpose'))} /><NetworkNode label="Owner" value={ownerOf(mission)} ready={ownerOf(mission) !== 'Non assigné'} /><NetworkNode label="Tasks" value={`${tasks.length} tâche(s)`} ready={tasks.length > 0} /><NetworkNode label="Blocked" value={`${tasks.filter((task) => statusOf(task) === 'paused').length}`} ready={!tasks.some((task) => statusOf(task) === 'paused')} /><NetworkNode label="Evidence" value={`${numberOf(mission, 'evidenceCount')} pièce(s)`} ready={numberOf(mission, 'evidenceCount') > 0} /><NetworkNode label="Exceptions" value={`${exceptions.length}`} ready={exceptions.length === 0} /></div><div className="mt-5"><div className="flex justify-between text-[10px] font-black text-slate-500"><span>Task velocity</span><span>{Math.round(completion)}%</span></div><div className="mt-2"><ProgressBar value={completion} tone="indigo" /></div></div></div>
}
function NetworkNode({ label, value, ready }: { label: string; value: string; ready: boolean }) { return <div className={`rounded-[20px] border p-4 ${ready ? 'border-indigo-200 bg-indigo-50' : 'border-amber-200 bg-amber-50'}`}><p className="text-[8px] font-black uppercase tracking-[.1em] text-slate-500">{label}</p><p className="mt-2 line-clamp-2 text-xs font-black leading-5 text-slate-900">{value}</p></div> }
function DailyPulse({ tasks }: { tasks: Array<Record<string, any>> }) { const open = tasks.filter((task) => !['completed','closed','cancelled'].includes(statusOf(task))); const overdue = open.filter((task) => deadlineOf(task) && new Date(String(deadlineOf(task))).getTime() < Date.now()).length; const due = open.filter((task) => deadlineOf(task) && new Date(String(deadlineOf(task))).toDateString() === new Date().toDateString()).length; return <section className="rounded-[28px] border border-indigo-200 bg-indigo-50 p-5"><p className="text-[9px] font-black uppercase tracking-[.15em] text-indigo-700">Daily execution pulse</p><div className="mt-4 grid grid-cols-3 gap-3"><WorkloadCell label="Ouvertes" value={open.length} /><WorkloadCell label="Aujourd’hui" value={due} /><WorkloadCell label="Retard" value={overdue} /></div></section> }
function MissionReadiness({ mission, tasks, exceptions }: { mission: Record<string, any>; tasks: Array<Record<string, any>>; exceptions: Array<Record<string, any>> }) { const checks = [ownerOf(mission) !== 'Non assigné', Boolean(deadlineOf(mission)), tasks.length > 0, tasks.some((task) => Boolean(ownerOf(task))), numberOf(mission, 'evidenceCount') > 0, exceptions.length === 0]; const readiness = Math.round(checks.filter(Boolean).length / checks.length * 100); return <><div className="mt-3 flex items-end justify-between"><p className="text-5xl font-black tracking-[-.06em]">{readiness}%</p><CheckCircle2 size={25} className={readiness >= 80 ? 'text-emerald-300' : 'text-amber-300'} /></div><div className="mt-4"><ProgressBar value={readiness} tone={readiness >= 80 ? 'emerald' : 'amber'} /></div><p className="mt-4 text-xs leading-5 text-indigo-100">Basé sur owner, échéance, tâches, attribution, evidence et absence d’exception.</p></> }
function MissionLane({ title, tone, items, onChanged }: { title: string; tone: 'slate'|'blue'|'indigo'|'rose'|'amber'|'emerald'; items: Array<{ row: Record<string, any>; tasks: Array<Record<string, any>> }>; onChanged: () => Promise<void> }) { const header = { slate:'text-slate-700', blue:'text-blue-700', indigo:'text-indigo-700', rose:'text-rose-700', amber:'text-amber-700', emerald:'text-emerald-700' }[tone]; return <section className="w-[350px] rounded-[28px] border border-slate-200 bg-slate-100/70 p-4"><div className="flex items-center justify-between"><h2 className={`text-xs font-black uppercase tracking-[.1em] ${header}`}>{title}</h2><span className="rounded-full bg-white px-3 py-1 text-xs font-black">{items.length}</span></div><div className="mt-4 space-y-3">{items.map(({ row, tasks }) => <article key={row.id} className="rounded-[22px] border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-black text-slate-950">{titleOf(row)}</p><p className="mt-1 text-[10px] text-slate-500">{ownerOf(row)} · {dateLabel(deadlineOf(row))}</p></div><TonePill value={statusOf(row)} /></div><div className="mt-3 flex justify-between text-[9px] font-black text-slate-400"><span>{tasks.length} tâches</span><span>{tasks.filter((task) => ['completed','closed'].includes(statusOf(task))).length} terminées</span></div><div className="mt-3 flex gap-2"><LiveEntityActions entityType="mission" entityId={String(row.id)} compact /><MissionControlDossier entityId={String(row.id)} title={titleOf(row)} compact onChanged={onChanged} /></div></article>)}{!items.length ? <p className="rounded-xl bg-white p-4 text-center text-[10px] font-bold text-slate-400">Aucune mission</p> : null}</div></section> }
function MetricBlock({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail: string; icon: typeof CirclePlay }) { return <div className="bg-white p-5"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-700"><Icon size={16} /></span><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-500">{label}</p></div><p className="mt-3 text-2xl font-black tracking-[-.04em] text-slate-950">{value}</p><p className="mt-1 text-[10px] text-slate-500">{detail}</p></div> }
function WorkloadLine({ label, value }: { label: string; value: number }) { return <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"><p className="text-xs font-black text-slate-900">{label}</p><p className="text-xl font-black text-indigo-700">{value}</p></div> }
function WorkloadCell({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl bg-white p-3 text-center"><p className="text-[8px] font-black uppercase tracking-[.1em] text-slate-400">{label}</p><p className="mt-1 text-lg font-black text-slate-950">{value}</p></div> }
function EmptyState() { return <div className="col-span-full grid min-h-72 place-items-center rounded-[30px] border border-dashed border-slate-300 bg-white text-center"><div><PlaneTakeoff size={28} className="mx-auto text-slate-300" /><h2 className="mt-4 text-xl font-black text-slate-950">Aucune mission</h2><p className="mt-2 text-sm text-slate-500">Créez ou compilez une mission pour ouvrir Mission Control.</p></div></div> }

'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowRight, BadgeDollarSign, BriefcaseBusiness, CalendarRange,
  BarChart3, CheckCircle2, Gauge, Layers3, Search, Target,
  TrendingDown, TrendingUp, UsersRound, WalletCards,
} from 'lucide-react'
import CreateLiveEntityButton from './CreateLiveEntityButton'
import LiveEntityActions from '../live-operations/LiveEntityActions'
import ProgramValueRealizationDossier from './ProgramValueRealizationDossier'
import { useLiveEntities } from './useLiveEntities'
import {
  arrayOf, clamp, dateLabel, deadlineOf, matches, money, numberOf, ownerOf,
  parentIdOf, safeRatio, statusOf, textOf, titleOf,
} from './sovereign-workspace-utils'
import { ProgressBar, TonePill } from './SovereignDossierPrimitives'

type View = 'frontier' | 'portfolio' | 'roadmap' | 'interventions'

export default function ProgramsPortfolioWorkspace() {
  const programs = useLiveEntities('program')
  const missions = useLiveEntities('mission')
  const tasks = useLiveEntities('task')
  const exceptions = useLiveEntities('exception')
  const [query, setQuery] = useState('')
  const [view, setView] = useState<View>('frontier')
  const [selectedId, setSelectedId] = useState('')

  const filtered = useMemo(() => programs.rows.filter((row) => matches(row, query, ['code','title','objective','ownerLabel','territories','accounts'])), [programs.rows, query])
  useEffect(() => {
    if (!filtered.length) { setSelectedId(''); return }
    if (!filtered.some((row) => String(row.id) === selectedId)) setSelectedId(String(filtered[0].id))
  }, [filtered, selectedId])
  const selected = filtered.find((row) => String(row.id) === selectedId) || filtered[0]
  const selectedMissions = selected ? missions.rows.filter((row) => parentIdOf(row, 'program') === String(selected.id)) : []
  const selectedMissionIds = new Set(selectedMissions.map((row) => String(row.id)))
  const selectedTasks = tasks.rows.filter((row) => selectedMissionIds.has(parentIdOf(row, 'mission')))
  const selectedExceptions = selected ? exceptions.rows.filter((row) => {
    const payloadProgram = textOf(row, 'programId', textOf(row, 'program_id'))
    const source = textOf(row, 'sourceId', textOf(row, 'source_id'))
    return payloadProgram === String(selected.id) || selectedMissionIds.has(source)
  }) : []

  const target = programs.rows.reduce((sum, row) => sum + numberOf(row, 'revenueTargetDh'), 0)
  const actual = programs.rows.reduce((sum, row) => sum + numberOf(row, 'actualRevenueDh'), 0)
  const budget = programs.rows.reduce((sum, row) => sum + numberOf(row, 'budgetDh') + numberOf(row, 'budgetLimit'), 0)
  const active = programs.rows.filter((row) => ['active','running'].includes(statusOf(row))).length
  const atRisk = programs.rows.filter((row) => {
    const programMissions = missions.rows.filter((mission) => parentIdOf(mission, 'program') === String(row.id))
    return programMissions.some((mission) => statusOf(mission) === 'paused')
  }).length
  const forecastVariance = target - actual

  const refreshAll = async () => {
    await Promise.all([programs.refresh(), missions.refresh(), tasks.refresh(), exceptions.refresh()])
  }

  const busy = programs.busy || missions.busy || tasks.busy || exceptions.busy
  const error = programs.error || missions.error || tasks.error || exceptions.error

  return <main className="min-h-screen bg-[#f2f7f4] px-4 py-6 sm:px-7 lg:px-10 xl:px-12">
    <section className="mx-auto max-w-[1840px]">
      <header className="overflow-hidden rounded-[34px] border border-emerald-200 bg-white shadow-[0_28px_90px_rgba(5,150,105,.09)]">
        <div className="grid xl:grid-cols-[minmax(0,1fr)_620px]">
          <div className="relative overflow-hidden bg-emerald-950 p-7 text-white sm:p-9"><div className="absolute -right-20 -top-20 h-80 w-80 rounded-full border border-emerald-400/20" /><div className="absolute right-8 top-20 h-44 w-44 rounded-full bg-emerald-600/20 blur-3xl" /><div className="relative"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-600"><Layers3 size={19} /></span><div><p className="text-[9px] font-black uppercase tracking-[.2em] text-emerald-200">Revenue Portfolio Command & Value Realization Floor</p><p className="mt-1 text-xs font-bold text-cyan-200">Investissement → missions → valeur → intervention</p></div></div><h1 className="mt-6 max-w-4xl text-4xl font-black tracking-[-.055em] sm:text-5xl">Piloter un portefeuille commercial comme un capital opérationnel.</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-emerald-100">Chaque programme expose sa valeur cible, sa réalisation, ses missions, sa capacité consommée, ses risques et les interventions nécessaires.</p><div className="mt-7 flex flex-wrap gap-3"><CreateLiveEntityButton entityType="program" label="Créer un programme" onCreated={refreshAll} /><a href="/revenue-command-os/mission-compiler" className="rounded-2xl border border-emerald-400/40 bg-white/10 px-5 py-3 text-xs font-black text-white">Créer depuis une stratégie</a></div></div></div>
          <div className="grid grid-cols-2 gap-px bg-slate-200 lg:grid-cols-3"><MetricBlock label="Cible" value={money(target)} detail="Portefeuille total" icon={Target} /><MetricBlock label="Réalisé" value={money(actual)} detail={`${Math.round(safeRatio(actual, target))}% réalisé`} icon={BadgeDollarSign} /><MetricBlock label="Variance" value={money(forecastVariance)} detail="Valeur restante" icon={TrendingDown} /><MetricBlock label="Budget" value={money(budget)} detail="Capacité engagée" icon={WalletCards} /><MetricBlock label="Actifs" value={active} detail={`${programs.rows.length} programmes`} icon={Activity} /><MetricBlock label="À risque" value={atRisk} detail="Mission en pause" icon={AlertTriangle} /></div>
        </div>
      </header>

      <section className="mt-5 grid gap-3 rounded-[26px] border border-slate-200 bg-white p-3 shadow-sm lg:grid-cols-[1fr_auto_auto]"><label className="relative"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Programme, owner, territoire, compte…" className="h-12 w-full rounded-2xl border border-slate-200 pl-11 pr-4 text-sm font-semibold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100" /></label><div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">{(['frontier','portfolio','roadmap','interventions'] as const).map((item) => <button type="button" key={item} onClick={() => setView(item)} className={`rounded-xl px-4 py-2 text-[9px] font-black uppercase ${view === item ? 'bg-slate-950 text-white' : 'text-slate-500'}`}>{item}</button>)}</div><button type="button" onClick={() => void refreshAll()} className="rounded-2xl border border-slate-200 px-4 text-xs font-black">Actualiser</button></section>

      {error ? <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">{error}</p> : null}
      {busy ? <div className="mt-6 grid min-h-80 place-items-center rounded-[30px] border border-slate-200 bg-white text-sm font-bold text-slate-500">Synchronisation du portefeuille de croissance…</div> : null}

      {!busy && view === 'frontier' ? <div className="mt-6 grid gap-5 2xl:grid-cols-[minmax(0,1fr)_430px]">
        <section className="space-y-5">
          <section className="rounded-[32px] border border-emerald-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,.06)] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-emerald-700">Portfolio value frontier</p><h2 className="mt-1 text-xl font-black text-slate-950">Progression × potentiel de revenus × exposition</h2></div><p className="text-[10px] font-bold text-slate-500">Chaque bulle = un programme réel</p></div>
            <ValueFrontier rows={filtered} missions={missions.rows} selectedId={String(selected?.id || '')} onSelect={setSelectedId} />
          </section>
          {selected ? <section className="rounded-[32px] border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between"><div><p className="font-mono text-[10px] font-black text-emerald-700">{selected.code}</p><h2 className="mt-2 text-3xl font-black tracking-[-.045em] text-slate-950">{titleOf(selected)}</h2><p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">{textOf(selected, 'mandate', textOf(selected, 'objective', 'Programme commercial Revenue OS.'))}</p><div className="mt-3 flex flex-wrap gap-2"><TonePill value={statusOf(selected)} /><span className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black text-slate-700">{ownerOf(selected)}</span>{arrayOf(selected, 'territories').map((item) => <span key={item} className="rounded-full bg-emerald-50 px-3 py-1 text-[9px] font-black text-emerald-700">{item}</span>)}</div></div><div className="flex flex-wrap gap-2"><LiveEntityActions entityType="program" entityId={String(selected.id)} compact /><ProgramValueRealizationDossier entityId={String(selected.id)} title={titleOf(selected)} compact onChanged={refreshAll} /></div></div>
            <ValueBridge program={selected} missions={selectedMissions} exceptions={selectedExceptions} />
          </section> : null}
        </section>

        <aside className="space-y-5">
          {selected ? <>
            <section className="rounded-[30px] border border-emerald-200 bg-emerald-950 p-5 text-white"><p className="text-[9px] font-black uppercase tracking-[.16em] text-emerald-200">Program health engine</p><ProgramHealth program={selected} missions={selectedMissions} tasks={selectedTasks} exceptions={selectedExceptions} /></section>
            <section className="rounded-[30px] border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">Operating topology</p><h3 className="mt-1 text-xl font-black text-slate-950">Program constellation</h3></div><BriefcaseBusiness size={20} className="text-emerald-700" /></div><div className="mt-5 space-y-3"><TopologyLine label="Missions" value={selectedMissions.length} detail={`${selectedMissions.filter((row) => ['active','running'].includes(statusOf(row))).length} actives`} /><TopologyLine label="Tâches" value={selectedTasks.length} detail={`${selectedTasks.filter((row) => ['completed','closed'].includes(statusOf(row))).length} terminées`} /><TopologyLine label="Exceptions" value={selectedExceptions.length} detail={`${selectedExceptions.filter((row) => !['closed','resolved','archived'].includes(statusOf(row))).length} ouvertes`} /><TopologyLine label="Comptes" value={arrayOf(selected, 'accounts').length} detail="Portefeuille ciblé" /></div></section>
            <section className="rounded-[30px] border border-slate-200 bg-white p-5"><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">Décision de portefeuille</p><p className="mt-3 text-sm font-black leading-6 text-slate-950">{textOf(selected, 'nextAction', 'Ouvrez le dossier de value realization pour recalibrer la cible, les missions et les interventions.')}</p><button type="button" onClick={() => setView('interventions')} className="mt-4 inline-flex items-center gap-2 text-xs font-black text-emerald-700">Ouvrir les interventions<ArrowRight size={13} /></button></section>
          </> : <EmptyState />}
        </aside>
      </div> : null}

      {!busy && view === 'portfolio' ? <section className="mt-6 overflow-hidden rounded-[30px] border border-slate-200 bg-white">
        <div className="grid grid-cols-[minmax(300px,1.7fr)_150px_145px_145px_120px_150px_190px] border-b border-slate-200 bg-slate-50 px-5 py-3 text-[9px] font-black uppercase tracking-[.12em] text-slate-500"><span>Programme</span><span>Responsable</span><span>Cible</span><span>Réalisé</span><span>Progression</span><span>Missions</span><span>Actions</span></div>
        <div className="divide-y divide-slate-100">{filtered.map((row) => {
          const rowMissions = missions.rows.filter((mission) => parentIdOf(mission, 'program') === String(row.id))
          const rowTarget = numberOf(row, 'revenueTargetDh')
          const rowActual = numberOf(row, 'actualRevenueDh')
          const progress = numberOf(row, 'progress') || safeRatio(rowMissions.filter((mission) => ['completed','closed'].includes(statusOf(mission))).length, rowMissions.length)
          return <article key={row.id} className="grid grid-cols-[minmax(300px,1.7fr)_150px_145px_145px_120px_150px_190px] items-center px-5 py-4"><div className="min-w-0"><p className="font-mono text-[9px] font-black text-emerald-700">{row.code}</p><p className="mt-1 truncate text-sm font-black text-slate-950">{titleOf(row)}</p><p className="mt-1 truncate text-[10px] text-slate-500">{arrayOf(row, 'territories').join(', ') || 'Territoire non défini'}</p></div><p className="truncate text-xs font-bold text-slate-700">{ownerOf(row)}</p><p className="text-xs font-black text-slate-950">{money(rowTarget)}</p><p className="text-xs font-black text-emerald-700">{money(rowActual)}</p><div><p className="text-xs font-black text-slate-900">{Math.round(progress)}%</p><ProgressBar value={progress} tone="emerald" /></div><p className="text-xs font-bold text-slate-700">{rowMissions.length} mission(s)</p><div className="flex gap-2"><LiveEntityActions entityType="program" entityId={String(row.id)} compact /><ProgramValueRealizationDossier entityId={String(row.id)} title={titleOf(row)} compact onChanged={refreshAll} /></div></article>
        })}{!filtered.length ? <EmptyState /> : null}</div>
      </section> : null}

      {!busy && view === 'roadmap' ? <section className="mt-6 rounded-[30px] border border-slate-200 bg-white p-6"><div className="space-y-5">{filtered.slice().sort((a, b) => String(deadlineOf(a) || '').localeCompare(String(deadlineOf(b) || ''))).map((row) => {
        const rowMissions = missions.rows.filter((mission) => parentIdOf(mission, 'program') === String(row.id))
        return <article key={row.id} className="grid gap-4 rounded-[26px] border border-slate-200 p-5 lg:grid-cols-[280px_1fr_170px_auto] lg:items-center"><div><p className="font-mono text-[9px] font-black text-emerald-700">{row.code}</p><h3 className="mt-1 text-base font-black text-slate-950">{titleOf(row)}</h3><p className="mt-1 text-[10px] text-slate-500">{dateLabel(deadlineOf(row))}</p></div><div className="grid grid-cols-3 gap-3"><RoadCell label="Actives" value={rowMissions.filter((mission) => ['active','running'].includes(statusOf(mission))).length} /><RoadCell label="Pause" value={rowMissions.filter((mission) => statusOf(mission) === 'paused').length} /><RoadCell label="Terminées" value={rowMissions.filter((mission) => ['completed','closed'].includes(statusOf(mission))).length} /></div><div><p className="text-[9px] font-black uppercase tracking-[.1em] text-slate-400">Value realization</p><p className="mt-1 text-xl font-black text-emerald-700">{Math.round(safeRatio(numberOf(row, 'actualRevenueDh'), numberOf(row, 'revenueTargetDh')))}%</p></div><ProgramValueRealizationDossier entityId={String(row.id)} title={titleOf(row)} compact onChanged={refreshAll} /></article>
      })}</div></section> : null}

      {!busy && view === 'interventions' ? <section className="mt-6 grid gap-5 xl:grid-cols-2">{filtered.map((row) => {
        const rowMissions = missions.rows.filter((mission) => parentIdOf(mission, 'program') === String(row.id))
        const paused = rowMissions.filter((mission) => statusOf(mission) === 'paused').length
        const remaining = Math.max(0, numberOf(row, 'revenueTargetDh') - numberOf(row, 'actualRevenueDh'))
        const needsIntervention = paused > 0 || remaining > 0
        return <article key={row.id} className={`rounded-[30px] border p-5 ${needsIntervention ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}><div className="flex items-start justify-between gap-4"><div><p className={`text-[9px] font-black uppercase tracking-[.12em] ${needsIntervention ? 'text-amber-800' : 'text-emerald-800'}`}>{needsIntervention ? 'Intervention recommandée' : 'Sous contrôle'}</p><h2 className="mt-2 text-xl font-black text-slate-950">{titleOf(row)}</h2></div>{needsIntervention ? <AlertTriangle size={20} className="text-amber-600" /> : <CheckCircle2 size={20} className="text-emerald-600" />}</div><div className="mt-5 grid grid-cols-3 gap-3"><RoadCell label="Écart revenus" value={money(remaining)} /><RoadCell label="Missions pause" value={paused} /><RoadCell label="Échéance" value={dateLabel(deadlineOf(row))} /></div><div className="mt-5 flex gap-2"><LiveEntityActions entityType="program" entityId={String(row.id)} compact /><ProgramValueRealizationDossier entityId={String(row.id)} title={titleOf(row)} compact onChanged={refreshAll} /></div></article>
      })}{!filtered.length ? <EmptyState /> : null}</section> : null}
    </section>
  </main>
}

function ValueFrontier({ rows, missions, selectedId, onSelect }: { rows: Array<Record<string, any>>; missions: Array<Record<string, any>>; selectedId: string; onSelect: (id: string) => void }) {
  return <div className="relative mt-6 h-[520px] overflow-hidden rounded-[28px] border border-slate-200 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:25%_25%]">
    <div className="absolute inset-x-6 bottom-5 flex items-center justify-between text-[9px] font-black uppercase tracking-[.12em] text-slate-400"><span>0% progression</span><span>100% progression</span></div><div className="absolute bottom-10 left-3 top-5 flex flex-col justify-between text-[9px] font-black uppercase tracking-[.12em] text-slate-400"><span>Potentiel élevé</span><span>Potentiel faible</span></div>
    {rows.map((row, index) => {
      const rowMissions = missions.filter((mission) => parentIdOf(mission, 'program') === String(row.id))
      const progress = numberOf(row, 'progress') || safeRatio(rowMissions.filter((mission) => ['completed','closed'].includes(statusOf(mission))).length, rowMissions.length)
      const target = numberOf(row, 'revenueTargetDh')
      const maxTarget = Math.max(...rows.map((item) => numberOf(item, 'revenueTargetDh')), 1)
      const budget = numberOf(row, 'budgetDh') || numberOf(row, 'budgetLimit')
      const maxBudget = Math.max(...rows.map((item) => numberOf(item, 'budgetDh') || numberOf(item, 'budgetLimit')), 1)
      const paused = rowMissions.some((mission) => statusOf(mission) === 'paused')
      const left = 9 + clamp(progress, 0, 100) * .82
      const top = 8 + (1 - Math.min(1, target / maxTarget)) * 72
      const size = 54 + Math.min(54, budget / maxBudget * 54)
      const selected = String(row.id) === selectedId
      return <button key={row.id} type="button" onClick={() => onSelect(String(row.id))} className={`absolute grid place-items-center rounded-full border-4 text-center shadow-xl transition hover:scale-105 ${paused ? 'border-amber-400 bg-amber-100 text-amber-950' : selected ? 'border-emerald-700 bg-emerald-100 text-emerald-950' : 'border-emerald-300 bg-white text-slate-900'}`} style={{ left: `${left}%`, top: `${top}%`, width: size, height: size, transform: 'translate(-50%, -50%)' }} title={`${titleOf(row)} · ${money(target)}`}><span className="line-clamp-2 px-2 text-[9px] font-black leading-3">{textOf(row, 'code', `P${index + 1}`)}</span></button>
    })}
    {!rows.length ? <div className="absolute inset-0 grid place-items-center text-sm font-semibold text-slate-500">Aucun programme à cartographier.</div> : null}
  </div>
}

function ValueBridge({ program, missions, exceptions }: { program: Record<string, any>; missions: Array<Record<string, any>>; exceptions: Array<Record<string, any>> }) {
  const target = numberOf(program, 'revenueTargetDh')
  const actual = numberOf(program, 'actualRevenueDh')
  const remaining = Math.max(0, target - actual)
  const exposed = exceptions.reduce((sum, row) => sum + numberOf(row, 'revenueImpactDh') + numberOf(row, 'revenue_impact_dh'), 0)
  return <div className="mt-6"><div className="grid gap-3 lg:grid-cols-4"><Bridge label="Cible initiale" value={money(target)} tone="slate" /><Bridge label="Revenue réalisé" value={money(actual)} tone="emerald" /><Bridge label="Valeur restante" value={money(remaining)} tone="blue" /><Bridge label="Revenue exposé" value={money(exposed)} tone="rose" /></div><div className="mt-5 grid gap-4 lg:grid-cols-[1fr_280px]"><div><div className="flex items-center justify-between text-[10px] font-black text-slate-500"><span>Réalisation économique</span><span>{Math.round(safeRatio(actual, target))}%</span></div><div className="mt-2"><ProgressBar value={safeRatio(actual, target)} tone="emerald" /></div></div><div className="grid grid-cols-3 gap-2"><RoadCell label="Missions" value={missions.length} /><RoadCell label="Actives" value={missions.filter((row) => ['active','running'].includes(statusOf(row))).length} /><RoadCell label="Pause" value={missions.filter((row) => statusOf(row) === 'paused').length} /></div></div></div>
}

function ProgramHealth({ program, missions, tasks, exceptions }: { program: Record<string, any>; missions: Array<Record<string, any>>; tasks: Array<Record<string, any>>; exceptions: Array<Record<string, any>> }) {
  const revenue = safeRatio(numberOf(program, 'actualRevenueDh'), numberOf(program, 'revenueTargetDh'))
  const missionVelocity = safeRatio(missions.filter((row) => ['completed','closed'].includes(statusOf(row))).length, missions.length)
  const taskVelocity = safeRatio(tasks.filter((row) => ['completed','closed'].includes(statusOf(row))).length, tasks.length)
  const riskPenalty = exceptions.filter((row) => !['closed','resolved','archived'].includes(statusOf(row))).length * 10
  const health = clamp(revenue * .45 + missionVelocity * .3 + taskVelocity * .25 - riskPenalty)
  return <><div className="mt-3 flex items-end justify-between"><p className="text-5xl font-black tracking-[-.06em]">{Math.round(health)}%</p><Gauge size={25} className={health >= 70 ? 'text-emerald-300' : health >= 45 ? 'text-amber-300' : 'text-rose-300'} /></div><div className="mt-4"><ProgressBar value={health} tone={health >= 70 ? 'emerald' : health >= 45 ? 'amber' : 'rose'} /></div><div className="mt-5 space-y-3"><HealthLine label="Revenue" value={revenue} /><HealthLine label="Missions" value={missionVelocity} /><HealthLine label="Tâches" value={taskVelocity} /></div><p className="mt-4 text-xs leading-5 text-emerald-100">{exceptions.length ? `${exceptions.length} exception(s) sont reliées au périmètre observé.` : 'Aucune exception reliée détectée.'}</p></>
}
function HealthLine({ label, value }: { label: string; value: number }) { return <div><div className="flex justify-between text-[9px] font-black uppercase tracking-[.1em] text-emerald-100"><span>{label}</span><span>{Math.round(value)}%</span></div><div className="mt-1"><ProgressBar value={value} tone="emerald" /></div></div> }
function TopologyLine({ label, value, detail }: { label: string; value: number; detail: string }) { return <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4"><div><p className="text-xs font-black text-slate-900">{label}</p><p className="mt-1 text-[9px] text-slate-500">{detail}</p></div><p className="text-2xl font-black text-emerald-700">{value}</p></div> }
function MetricBlock({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail: string; icon: typeof Target }) { return <div className="bg-white p-5"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon size={16} /></span><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-500">{label}</p></div><p className="mt-3 text-2xl font-black tracking-[-.04em] text-slate-950">{value}</p><p className="mt-1 text-[10px] text-slate-500">{detail}</p></div> }
function Bridge({ label, value, tone }: { label: string; value: string; tone: 'slate'|'emerald'|'blue'|'rose' }) { const styles = { slate:'border-slate-200 bg-slate-50 text-slate-900', emerald:'border-emerald-200 bg-emerald-50 text-emerald-900', blue:'border-blue-200 bg-blue-50 text-blue-900', rose:'border-rose-200 bg-rose-50 text-rose-900' }[tone]; return <div className={`rounded-[22px] border p-4 ${styles}`}><p className="text-[9px] font-black uppercase tracking-[.1em] opacity-70">{label}</p><p className="mt-2 text-xl font-black">{value}</p></div> }
function RoadCell({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[8px] font-black uppercase tracking-[.1em] text-slate-400">{label}</p><p className="mt-1 truncate text-xs font-black text-slate-900">{value}</p></div> }
function EmptyState() { return <div className="col-span-full grid min-h-72 place-items-center rounded-[30px] border border-dashed border-slate-300 bg-white text-center"><div><Layers3 size={28} className="mx-auto text-slate-300" /><h2 className="mt-4 text-xl font-black text-slate-950">Aucun programme</h2><p className="mt-2 text-sm text-slate-500">Créez un programme ou compilez une stratégie.</p></div></div> }

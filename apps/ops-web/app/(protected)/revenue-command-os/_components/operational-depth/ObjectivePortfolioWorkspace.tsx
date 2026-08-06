'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Activity, ArrowRight, BadgeDollarSign, CalendarDays, CheckCircle2, ChevronRight,
  CircleAlert, Download, Filter, GitBranch, Layers3, Network, Search, Sparkles,
  Target, UsersRound,
} from 'lucide-react'
import CanonicalCsvImportDock from '../imports/CanonicalCsvImportDock'
import CreateLiveEntityButton from './CreateLiveEntityButton'
import LiveEntityActions from '../live-operations/LiveEntityActions'
import MandateArchitectureDossier from './MandateArchitectureDossier'
import { useLiveEntities } from './useLiveEntities'
import {
  arrayOf, clamp, dateLabel, deadlineOf, daysRemaining, matches, money, numberOf,
  ownerOf, parentIdOf, safeRatio, statusOf, textOf, titleOf,
} from './sovereign-workspace-utils'
import { ProgressBar, TonePill } from './SovereignDossierPrimitives'

type View = 'architecture' | 'portfolio' | 'timeline' | 'owners'

export default function ObjectivePortfolioWorkspace() {
  const objectives = useLiveEntities('objective')
  const strategies = useLiveEntities('strategy')
  const programs = useLiveEntities('program')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [view, setView] = useState<View>('architecture')
  const [selectedId, setSelectedId] = useState('')

  const filtered = useMemo(() => objectives.rows.filter((row) => matches(row, query, ['code', 'title', 'mandate', 'ownerLabel', 'owner_label', 'targetMarket', 'target_market']) && (status === 'all' || statusOf(row) === status)), [objectives.rows, query, status])
  useEffect(() => {
    if (!filtered.length) { setSelectedId(''); return }
    if (!filtered.some((row) => String(row.id) === selectedId)) setSelectedId(String(filtered[0].id))
  }, [filtered, selectedId])
  const selected = filtered.find((row) => String(row.id) === selectedId) || filtered[0]
  const selectedStrategies = selected ? strategies.rows.filter((row) => parentIdOf(row, 'objective') === String(selected.id)) : []
  const selectedStrategyIds = new Set(selectedStrategies.map((row) => String(row.id)))
  const selectedPrograms = selected ? programs.rows.filter((row) => parentIdOf(row, 'objective') === String(selected.id) || selectedStrategyIds.has(parentIdOf(row, 'strategy'))) : []
  const target = objectives.rows.reduce((sum, row) => sum + numberOf(row, 'revenueTargetDh'), 0)
  const active = objectives.rows.filter((row) => ['active', 'running', 'scheduled'].includes(statusOf(row))).length
  const owners = new Set(objectives.rows.map(ownerOf).filter((owner) => owner !== 'Non assigné')).size
  const atRisk = objectives.rows.filter((row) => {
    const days = daysRemaining(deadlineOf(row))
    return days != null && days <= 3 && !['completed', 'archived'].includes(statusOf(row))
  }).length

  const refreshAll = async () => {
    await Promise.all([objectives.refresh(), strategies.refresh(), programs.refresh()])
  }

  function exportCsv() {
    const header = ['code', 'title', 'status', 'owner', 'market', 'horizon', 'priority', 'revenue_target_dh']
    const lines = [header.join(','), ...filtered.map((row) => [
      row.code, titleOf(row), statusOf(row), ownerOf(row), textOf(row, 'targetMarket', textOf(row, 'target_market')),
      textOf(row, 'horizon'), textOf(row, 'priority'), numberOf(row, 'revenueTargetDh'),
    ].map((value) => JSON.stringify(value ?? '')).join(','))]
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'revenue-os-objectifs.csv'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const busy = objectives.busy || strategies.busy || programs.busy
  const error = objectives.error || strategies.error || programs.error

  return <main className="min-h-screen bg-[#f3f6fb] px-4 py-6 sm:px-7 lg:px-10 xl:px-12">
    <section className="mx-auto max-w-[1840px]">
      <header className="overflow-hidden rounded-[34px] border border-blue-200 bg-white shadow-[0_28px_90px_rgba(30,64,175,.09)]">
        <div className="grid xl:grid-cols-[minmax(0,1fr)_520px]">
          <div className="relative overflow-hidden bg-blue-950 p-7 text-white sm:p-9"><div className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-blue-500/20" /><div className="absolute -right-8 top-16 h-40 w-40 rounded-full bg-blue-600/20 blur-3xl" /><div className="relative"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-600"><Target size={19} /></span><div><p className="text-[9px] font-black uppercase tracking-[.2em] text-blue-200">Strategic Mandate Architecture Room</p><p className="mt-1 text-xs font-bold text-emerald-300">Intention → architecture → exécution → résultat</p></div></div><h1 className="mt-6 max-w-4xl text-4xl font-black tracking-[-.055em] sm:text-5xl">Concevoir des mandats commercialement exécutables.</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-blue-100">Le portefeuille relie cibles, comptes, stratégies, programmes, responsables, échéances et résultats. Chaque manque structurel devient une action visible.</p><div className="mt-7 flex flex-wrap gap-3"><CreateLiveEntityButton entityType="objective" label="Créer un mandat" onCreated={refreshAll} /><button type="button" onClick={() => window.dispatchEvent(new CustomEvent('revenue-os:open-objective'))} className="rounded-2xl border border-blue-400/40 bg-white/10 px-5 py-3 text-xs font-black text-white backdrop-blur-sm">Formulaire stratégique complet</button><button type="button" onClick={exportCsv} className="inline-flex items-center gap-2 rounded-2xl border border-blue-400/40 bg-white/10 px-5 py-3 text-xs font-black text-white"><Download size={15} />Exporter</button></div></div></div>
          <div className="grid grid-cols-2 gap-px bg-slate-200"><ExecutiveMetric label="Mandats" value={objectives.rows.length} detail={`${active} actifs`} icon={Target} /><ExecutiveMetric label="Cible cumulée" value={money(target)} detail="Portefeuille documenté" icon={BadgeDollarSign} /><ExecutiveMetric label="Responsables" value={owners} detail="Mandats attribués" icon={UsersRound} /><ExecutiveMetric label="Exposition délai" value={atRisk} detail="Échéance ≤ 3 jours" icon={CalendarDays} /></div>
        </div>
      </header>

      <section className="mt-5 grid gap-3 rounded-[26px] border border-slate-200 bg-white p-3 shadow-sm lg:grid-cols-[1fr_190px_auto_auto]"><label className="relative"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mandat, marché, responsable, territoire…" className="h-12 w-full rounded-2xl border border-slate-200 pl-11 pr-4 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label><label className="relative"><Filter size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-12 w-full appearance-none rounded-2xl border border-slate-200 pl-11 pr-4 text-sm font-bold"><option value="all">Tous statuts</option>{['active','running','scheduled','paused','completed','archived'].map((item) => <option key={item} value={item}>{item}</option>)}</select></label><div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">{(['architecture','portfolio','timeline','owners'] as const).map((item) => <button key={item} type="button" onClick={() => setView(item)} className={`rounded-xl px-3 py-2 text-[9px] font-black uppercase ${view === item ? 'bg-slate-950 text-white' : 'text-slate-500'}`}>{item}</button>)}</div><button type="button" onClick={() => void refreshAll()} className="rounded-2xl border border-slate-200 px-4 text-xs font-black">Actualiser</button></section>

      {error ? <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">{error}</p> : null}
      {busy ? <div className="mt-6 grid min-h-80 place-items-center rounded-[30px] border border-slate-200 bg-white text-sm font-bold text-slate-500">Synchronisation du portefeuille stratégique…</div> : null}

      {!busy && view === 'architecture' ? <div className="mt-6 grid gap-5 2xl:grid-cols-[350px_minmax(0,1fr)_390px]">
        <aside className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between px-2"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-blue-700">Mandate portfolio</p><h2 className="mt-1 text-lg font-black text-slate-950">{filtered.length} mandat(s)</h2></div><Network size={19} className="text-blue-700" /></div>
          <div className="mt-4 max-h-[760px] space-y-2 overflow-y-auto pr-1">{filtered.map((row) => {
            const rowTarget = numberOf(row, 'revenueTargetDh')
            const days = daysRemaining(deadlineOf(row))
            const selectedRow = String(row.id) === String(selected?.id)
            return <button key={row.id} type="button" onClick={() => setSelectedId(String(row.id))} className={`w-full rounded-[20px] border p-4 text-left transition ${selectedRow ? 'border-blue-300 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-200'}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-mono text-[9px] font-black text-blue-700">{row.code}</p><h3 className="mt-1 line-clamp-2 text-sm font-black leading-5 text-slate-950">{titleOf(row)}</h3></div><TonePill value={statusOf(row)} /></div><div className="mt-3 grid grid-cols-2 gap-2"><MiniFact label="Cible" value={rowTarget ? money(rowTarget) : '—'} /><MiniFact label="Délai" value={days == null ? '—' : `${days} j`} /></div></button>
          })}{!filtered.length ? <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs font-semibold text-slate-500">Aucun mandat correspondant.</p> : null}</div>
        </aside>

        <section className="min-w-0 space-y-5">
          {selected ? <>
            <section className="rounded-[32px] border border-blue-200 bg-white p-5 shadow-[0_24px_70px_rgba(15,23,42,.06)] sm:p-6">
              <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><p className="font-mono text-[10px] font-black text-blue-700">{selected.code}</p><h2 className="mt-2 text-3xl font-black tracking-[-.045em] text-slate-950">{titleOf(selected)}</h2><p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">{textOf(selected, 'mandate', textOf(selected, 'description', 'Mandat sans description.'))}</p><div className="mt-3 flex flex-wrap gap-2"><TonePill value={statusOf(selected)} /><span className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black text-slate-700">{ownerOf(selected)}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black text-slate-700">{textOf(selected, 'targetMarket', textOf(selected, 'target_market', 'Marché non défini'))}</span></div></div><div className="flex flex-wrap gap-2"><LiveEntityActions entityType="objective" entityId={String(selected.id)} compact /><MandateArchitectureDossier entityId={String(selected.id)} title={titleOf(selected)} compact onChanged={refreshAll} /></div></div>
              <div className="mt-6 grid gap-3 lg:grid-cols-7"><ArchitectureStep index={1} label="Cible" value={numberOf(selected, 'revenueTargetDh') ? money(numberOf(selected, 'revenueTargetDh')) : 'À définir'} ready={numberOf(selected, 'revenueTargetDh') > 0} /><ArchitectureStep index={2} label="Territoire" value={arrayOf(selected, 'territories').join(', ') || textOf(selected, 'targetMarket', textOf(selected, 'target_market', 'À définir'))} ready={Boolean(arrayOf(selected, 'territories').length || textOf(selected, 'targetMarket', textOf(selected, 'target_market')))} /><ArchitectureStep index={3} label="Comptes" value={`${arrayOf(selected, 'accounts').length} ciblé(s)`} ready={arrayOf(selected, 'accounts').length > 0} /><ArchitectureStep index={4} label="Stratégies" value={`${selectedStrategies.length} générée(s)`} ready={selectedStrategies.length > 0} /><ArchitectureStep index={5} label="Programmes" value={`${selectedPrograms.length} créé(s)`} ready={selectedPrograms.length > 0} /><ArchitectureStep index={6} label="Owner" value={ownerOf(selected)} ready={ownerOf(selected) !== 'Non assigné'} /><ArchitectureStep index={7} label="Outcome" value={textOf(selected, 'lastOutcome', 'À documenter')} ready={Boolean(textOf(selected, 'lastOutcome'))} /></div>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
              <div className="rounded-[30px] border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-blue-700">Mandate decomposition</p><h3 className="mt-1 text-xl font-black text-slate-950">Architecture d’exécution</h3></div><GitBranch size={20} className="text-blue-700" /></div><div className="mt-5 grid gap-4 lg:grid-cols-2"><DecompositionBlock title="Stratégies" count={selectedStrategies.length} icon={Sparkles}>{selectedStrategies.slice(0, 4).map((row) => <LinkedItem key={row.id} title={titleOf(row)} status={statusOf(row)} />)}</DecompositionBlock><DecompositionBlock title="Programmes" count={selectedPrograms.length} icon={Layers3}>{selectedPrograms.slice(0, 4).map((row) => <LinkedItem key={row.id} title={titleOf(row)} status={statusOf(row)} />)}</DecompositionBlock></div></div>
              <aside className="rounded-[30px] border border-slate-200 bg-white p-5"><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">Pacing exécutif</p><h3 className="mt-1 text-xl font-black text-slate-950">Rythme requis</h3><div className="mt-5 space-y-4"><Pacing label="Cible totale" value={money(numberOf(selected, 'revenueTargetDh'))} /><Pacing label="Jours restants" value={daysRemaining(deadlineOf(selected)) == null ? '—' : `${daysRemaining(deadlineOf(selected))} jour(s)`} /><Pacing label="Cible quotidienne" value={daysRemaining(deadlineOf(selected)) && Number(daysRemaining(deadlineOf(selected))) > 0 ? money(numberOf(selected, 'revenueTargetDh') / Number(daysRemaining(deadlineOf(selected)))) : '—'} /><Pacing label="Prochaine action" value={textOf(selected, 'nextAction', 'À définir')} /></div></aside>
            </section>
          </> : <EmptyState title="Aucun mandat sélectionné" detail="Créez ou sélectionnez un mandat pour afficher son architecture." />}
        </section>

        <aside className="space-y-5">
          <section className="rounded-[30px] border border-blue-200 bg-blue-950 p-5 text-white"><p className="text-[9px] font-black uppercase tracking-[.16em] text-blue-200">Strategic integrity</p><h3 className="mt-2 text-xl font-black">Écarts structurels</h3>{selected ? <GapList objective={selected} strategies={selectedStrategies.length} programs={selectedPrograms.length} /> : null}</section>
          <section className="rounded-[30px] border border-slate-200 bg-white p-5"><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">Décision immédiate</p><h3 className="mt-1 text-xl font-black text-slate-950">Que doit-il se passer ensuite?</h3><p className="mt-3 text-sm leading-6 text-slate-600">{selected ? textOf(selected, 'nextAction', 'Ouvrez le dossier du mandat pour documenter la prochaine action, les preuves et les décisions.') : 'Sélectionnez un mandat.'}</p>{selected ? <button type="button" onClick={() => setView('portfolio')} className="mt-4 inline-flex items-center gap-2 text-xs font-black text-blue-700">Voir le portefeuille<ArrowRight size={13} /></button> : null}</section>
          <section className="rounded-[30px] border border-slate-200 bg-white p-5"><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">Readiness du portefeuille</p><div className="mt-4 space-y-4"><PortfolioReadiness label="Mandats attribués" value={safeRatio(objectives.rows.filter((row) => ownerOf(row) !== 'Non assigné').length, objectives.rows.length)} /><PortfolioReadiness label="Mandats chiffrés" value={safeRatio(objectives.rows.filter((row) => numberOf(row, 'revenueTargetDh') > 0).length, objectives.rows.length)} /><PortfolioReadiness label="Mandats datés" value={safeRatio(objectives.rows.filter((row) => Boolean(deadlineOf(row))).length, objectives.rows.length)} /></div></section>
        </aside>
      </div> : null}

      {!busy && view === 'portfolio' ? <section className="mt-6 overflow-hidden rounded-[30px] border border-slate-200 bg-white">
        <div className="grid grid-cols-[minmax(310px,1.8fr)_150px_140px_160px_130px_180px] border-b border-slate-200 bg-slate-50 px-5 py-3 text-[9px] font-black uppercase tracking-[.12em] text-slate-500"><span>Mandat</span><span>Responsable</span><span>Cible</span><span>Échéance</span><span>Architecture</span><span>Actions</span></div>
        <div className="divide-y divide-slate-100">{filtered.map((row) => {
          const linkedStrategies = strategies.rows.filter((item) => parentIdOf(item, 'objective') === String(row.id)).length
          const architecture = Math.round([
            numberOf(row, 'revenueTargetDh') > 0, ownerOf(row) !== 'Non assigné', Boolean(deadlineOf(row)),
            Boolean(textOf(row, 'targetMarket', textOf(row, 'target_market'))), linkedStrategies > 0,
          ].filter(Boolean).length / 5 * 100)
          return <article key={row.id} className="grid grid-cols-[minmax(310px,1.8fr)_150px_140px_160px_130px_180px] items-center px-5 py-4"><div className="min-w-0"><p className="font-mono text-[9px] font-black text-blue-700">{row.code}</p><p className="mt-1 truncate text-sm font-black text-slate-950">{titleOf(row)}</p><p className="mt-1 truncate text-[10px] text-slate-500">{textOf(row, 'targetMarket', textOf(row, 'target_market', 'Marché non défini'))}</p></div><p className="truncate text-xs font-bold text-slate-700">{ownerOf(row)}</p><p className="text-xs font-black text-slate-950">{money(numberOf(row, 'revenueTargetDh'))}</p><p className="text-xs font-bold text-slate-600">{dateLabel(deadlineOf(row))}</p><div><p className="text-xs font-black text-blue-700">{architecture}%</p><ProgressBar value={architecture} tone="blue" /></div><div className="flex gap-2"><LiveEntityActions entityType="objective" entityId={String(row.id)} compact /><MandateArchitectureDossier entityId={String(row.id)} title={titleOf(row)} compact onChanged={refreshAll} /></div></article>
        })}{!filtered.length ? <EmptyState title="Aucun mandat" detail="Créez un mandat ou modifiez vos filtres." /> : null}</div>
      </section> : null}

      {!busy && view === 'timeline' ? <section className="mt-6 rounded-[30px] border border-slate-200 bg-white p-6"><div className="relative space-y-4 before:absolute before:bottom-4 before:left-[21px] before:top-4 before:w-px before:bg-blue-200">{filtered.slice().sort((a, b) => String(deadlineOf(a) || '').localeCompare(String(deadlineOf(b) || ''))).map((row) => <article key={row.id} className="relative flex gap-4"><span className="relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-700 text-white"><CalendarDays size={16} /></span><div className="grid min-w-0 flex-1 gap-3 rounded-[22px] border border-slate-200 p-4 lg:grid-cols-[1fr_180px_160px_auto] lg:items-center"><div><p className="text-sm font-black text-slate-950">{titleOf(row)}</p><p className="mt-1 text-[10px] text-slate-500">{textOf(row, 'targetMarket', textOf(row, 'target_market', 'Marché non défini'))}</p></div><p className="text-xs font-bold text-slate-600">{dateLabel(deadlineOf(row))}</p><p className="text-xs font-black text-slate-950">{money(numberOf(row, 'revenueTargetDh'))}</p><MandateArchitectureDossier entityId={String(row.id)} title={titleOf(row)} compact onChanged={refreshAll} /></div></article>)}</div></section> : null}

      {!busy && view === 'owners' ? <section className="mt-6 grid gap-5 xl:grid-cols-3">{Object.entries(filtered.reduce<Record<string, Array<Record<string, any>>>>((acc, row) => { const owner = ownerOf(row); (acc[owner] ||= []).push(row); return acc }, {})).map(([owner, rows]) => <article key={owner} className="rounded-[30px] border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.12em] text-blue-700">Responsable</p><h2 className="mt-1 text-xl font-black text-slate-950">{owner}</h2></div><span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-800">{rows.length}</span></div><div className="mt-4 space-y-3">{rows.map((row) => <div key={row.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><p className="text-sm font-black text-slate-950">{titleOf(row)}</p><TonePill value={statusOf(row)} /></div><p className="mt-2 text-[10px] text-slate-500">{money(numberOf(row, 'revenueTargetDh'))} · {dateLabel(deadlineOf(row))}</p><div className="mt-3"><MandateArchitectureDossier entityId={String(row.id)} title={titleOf(row)} compact onChanged={refreshAll} /></div></div>)}</div></article>)}</section> : null}

      <div className="mt-6"><CanonicalCsvImportDock kind="mandates" /></div>
    </section>
  </main>
}

function ExecutiveMetric({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail: string; icon: typeof Target }) {
  return <div className="bg-white p-5"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-700"><Icon size={16} /></span><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-500">{label}</p></div><p className="mt-3 text-2xl font-black tracking-[-.04em] text-slate-950">{value}</p><p className="mt-1 text-[10px] text-slate-500">{detail}</p></div>
}
function MiniFact({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-white/80 p-2"><p className="text-[8px] font-black uppercase tracking-[.1em] text-slate-400">{label}</p><p className="mt-1 truncate text-[10px] font-black text-slate-800">{value}</p></div> }
function ArchitectureStep({ index, label, value, ready }: { index: number; label: string; value: string; ready: boolean }) { return <article className={`relative rounded-[20px] border p-4 ${ready ? 'border-blue-200 bg-blue-50' : 'border-amber-200 bg-amber-50'}`}><span className={`grid h-8 w-8 place-items-center rounded-xl text-[10px] font-black text-white ${ready ? 'bg-blue-700' : 'bg-amber-500'}`}>{index}</span><p className="mt-3 text-[8px] font-black uppercase tracking-[.12em] text-slate-500">{label}</p><p className="mt-1 line-clamp-2 text-[10px] font-black leading-4 text-slate-900">{value}</p></article> }
function DecompositionBlock({ title, count, icon: Icon, children }: { title: string; count: number; icon: typeof Sparkles; children: ReactNode }) { return <section className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Icon size={15} className="text-blue-700" /><h4 className="text-xs font-black uppercase tracking-[.1em] text-slate-700">{title}</h4></div><span className="rounded-full bg-white px-3 py-1 text-[10px] font-black">{count}</span></div><div className="mt-4 space-y-2">{children}{!count ? <p className="rounded-xl bg-white p-4 text-center text-[10px] font-semibold text-slate-500">Aucun objet lié.</p> : null}</div></section> }
function LinkedItem({ title, status }: { title: string; status: string }) { return <div className="flex items-center justify-between gap-3 rounded-xl bg-white p-3"><p className="truncate text-xs font-black text-slate-900">{title}</p><TonePill value={status} /></div> }
function Pacing({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3"><p className="text-[9px] font-black uppercase tracking-[.1em] text-slate-400">{label}</p><p className="max-w-[210px] text-right text-xs font-black text-slate-900">{value}</p></div> }
function PortfolioReadiness({ label, value }: { label: string; value: number }) { return <div><div className="flex items-center justify-between text-[10px] font-black text-slate-600"><span>{label}</span><span>{Math.round(value)}%</span></div><div className="mt-2"><ProgressBar value={value} tone="blue" /></div></div> }
function GapList({ objective, strategies, programs }: { objective: Record<string, any>; strategies: number; programs: number }) { const gaps = [numberOf(objective, 'revenueTargetDh') <= 0 ? 'Cible de revenus absente' : '', ownerOf(objective) === 'Non assigné' ? 'Responsable non attribué' : '', !deadlineOf(objective) ? 'Échéance absente' : '', !textOf(objective, 'targetMarket', textOf(objective, 'target_market')) ? 'Marché cible absent' : '', !arrayOf(objective, 'accounts').length ? 'Comptes non documentés' : '', strategies === 0 ? 'Aucune stratégie' : '', programs === 0 ? 'Aucun programme' : ''].filter(Boolean); return <div className="mt-4 space-y-2">{gaps.map((gap) => <div key={gap} className="flex items-start gap-3 rounded-xl bg-white/10 p-3 text-xs font-bold text-blue-50"><CircleAlert size={14} className="mt-0.5 shrink-0 text-amber-300" />{gap}</div>)}{!gaps.length ? <div className="flex items-center gap-3 rounded-xl bg-emerald-400/15 p-3 text-xs font-bold text-emerald-100"><CheckCircle2 size={14} />Architecture complète.</div> : null}</div> }
function EmptyState({ title, detail }: { title: string; detail: string }) { return <div className="col-span-full grid min-h-72 place-items-center rounded-[30px] border border-dashed border-slate-300 bg-white text-center"><div><Target size={28} className="mx-auto text-slate-300" /><h2 className="mt-4 text-xl font-black text-slate-950">{title}</h2><p className="mt-2 text-sm text-slate-500">{detail}</p></div></div> }

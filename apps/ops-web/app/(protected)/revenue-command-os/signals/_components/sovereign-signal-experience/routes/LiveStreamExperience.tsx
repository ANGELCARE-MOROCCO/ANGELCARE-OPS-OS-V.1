'use client'

import { useMemo, useState } from 'react'
import { Activity, ArrowUpRight, Filter, RadioTower, Search } from 'lucide-react'
import type { RevenueSignalSeverity } from '@/lib/revenue-command-os/types'
import { useSignalFabric } from '../../SignalFabricContext'
import { formatSignalDate, signalSeverityTone, signalTruthMode, sourceNameMap } from '../signal-data-mappers'
import { SignalEmpty, SignalLifecycle, SignalPanel, SignalRouteMasthead, SignalStat, SignalStatus, SignalTag, signalExperienceStyles } from '../SignalExperiencePrimitives'

export default function LiveStreamExperience() {
  const { fabric, warnings, error, setSelected } = useSignalFabric()
  const [query, setQuery] = useState('')
  const [severity, setSeverity] = useState<'all' | RevenueSignalSeverity>('all')
  const names = sourceNameMap(fabric)
  const signals = useMemo(() => fabric.signals.filter((signal) => (severity === 'all' || signal.severity === severity) && (!query || `${signal.title} ${signal.summary} ${signal.code} ${signal.sourceCode} ${signal.category}`.toLowerCase().includes(query.toLowerCase()))).sort((a,b) => b.priorityScore - a.priorityScore), [fabric.signals, query, severity])
  const unresolved = signals.filter((signal) => ['new','triaged','blocked'].includes(signal.status)).length

  return <div className={`${signalExperienceStyles.routeShell} space-y-5`} data-signal-route-id="MZ26-SIGNAL-LIVE-STREAM">
    <SignalRouteMasthead eyebrow="Flux en direct" title="Intelligence River" subtitle="Un flux opérationnel priorisé qui rend visibles la source, la fraîcheur, la qualification et la prochaine destination de chaque signal." concept="Live Signal Operations Stream" icon={Activity} tone="cyan" mode={signalTruthMode(fabric,warnings,error)} warnings={error ? [error,...warnings] : warnings} freshness={fabric.generatedAt} authority="Observation interne" secondary={{ label: 'Santé des sources', href: '/revenue-command-os/signals/source-health' }}>
      <SignalLifecycle current="intake" />
    </SignalRouteMasthead>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><SignalStat label="Résultats visibles" value={signals.length} note="Après filtres" tone="cyan"/><SignalStat label="Non résolus" value={unresolved} note="Nouveaux, triés ou bloqués" tone={unresolved ? 'amber' : 'emerald'}/><SignalStat label="Critiques" value={signals.filter((signal) => signal.severity === 'critical').length} note="Priorité maximale" tone="rose"/><SignalStat label="Contexte prêt" value={signals.filter((signal) => signal.status === 'context-ready').length} note="Snapshot disponible" tone="blue"/></section>

    <SignalPanel eyebrow="Operating stream" title="Signaux ordonnés par priorité" icon={RadioTower} tone="cyan" action={<span className="text-[10px] font-black text-slate-600">{signals.length} signal(s)</span>}>
      <div className="mb-5 flex flex-col gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block min-w-0 flex-1"><Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher titre, code, source, catégorie…" className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-950 outline-none focus:border-cyan-500"/></label>
        <div className="flex flex-wrap items-center gap-2"><Filter size={15} className="text-slate-500"/>{(['all','critical','high','medium','low','info'] as const).map((value) => <button key={value} type="button" onClick={() => setSeverity(value)} className={`rounded-xl px-3 py-2 text-[9px] font-black uppercase ${severity === value ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>{value}</button>)}</div>
      </div>
      <div className="space-y-3">
        {signals.map((signal) => <button key={signal.id} type="button" onClick={() => setSelected(signal)} className="grid w-full gap-4 rounded-[24px] border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-cyan-300 hover:shadow-md lg:grid-cols-[72px_1fr_auto] lg:items-center"><div className="grid h-14 place-items-center rounded-2xl bg-slate-950 text-white"><div className="text-center"><p className="text-xl font-black">{signal.priorityScore}</p><p className="text-[7px] font-black uppercase text-cyan-200">Priorité</p></div></div><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-black text-slate-950">{signal.title}</p><SignalStatus status={signal.severity}/><SignalStatus status={signal.status}/></div><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-700">{signal.summary}</p><div className="mt-3 flex flex-wrap gap-2"><SignalTag tone="slate">{names.get(signal.sourceCode) || signal.sourceCode}</SignalTag><SignalTag tone={signalSeverityTone(signal.severity) === 'rose' ? 'rose' : signalSeverityTone(signal.severity) === 'amber' ? 'amber' : 'blue'}>{signal.category}</SignalTag><SignalTag tone="cyan">Détecté {formatSignalDate(signal.detectedAt)}</SignalTag></div></div><div className="flex items-center gap-2 text-[10px] font-black text-cyan-800">Ouvrir le dossier <ArrowUpRight size={14}/></div></button>)}
        {!signals.length ? <SignalEmpty title="Aucun signal ne correspond aux filtres" description={fabric.signals.length ? 'La source est disponible, mais aucun signal ne satisfait la recherche ou la sévérité sélectionnée.' : 'La source est saine mais ne contient aucun signal dans la fenêtre courante.'}/> : null}
      </div>
    </SignalPanel>
  </div>
}

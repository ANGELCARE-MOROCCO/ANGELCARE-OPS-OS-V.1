'use client'

import { Activity, AlertTriangle, Clock3, Gauge, HeartPulse, WifiOff } from 'lucide-react'
import { useSignalFabric } from '../../SignalFabricContext'
import { formatSignalDate, signalTruthMode, sourceStatusTone } from '../signal-data-mappers'
import { SignalEmpty, SignalLifecycle, SignalPanel, SignalProgress, SignalRouteMasthead, SignalStat, SignalStatus, SignalTag, signalExperienceStyles } from '../SignalExperiencePrimitives'

export default function SourceHealthExperience() {
  const { fabric, warnings, error } = useSignalFabric()
  const sourceByCode = new Map(fabric.sources.map((source) => [source.code, source]))
  const degraded = fabric.sourceHealth.filter((health) => health.status !== 'healthy')
  const failures = fabric.sourceHealth.reduce((sum, health) => sum + health.failedEvents, 0)
  const avgLatency = fabric.sourceHealth.filter((health) => typeof health.latencyMs === 'number').length ? Math.round(fabric.sourceHealth.reduce((sum, health) => sum + (health.latencyMs || 0), 0) / fabric.sourceHealth.filter((health) => typeof health.latencyMs === 'number').length) : null

  return <div className={`${signalExperienceStyles.routeShell} space-y-5`} data-signal-route-id="MZ26-SIGNAL-SOURCE-HEALTH">
    <SignalRouteMasthead eyebrow="Santé des sources" title="Source Health Observatory" subtitle="Une lecture clinique de la disponibilité, de la fraîcheur, de la latence et des échecs de chaque capteur commercial." concept="Signal Source Health Observatory" icon={HeartPulse} tone={degraded.length ? 'amber' : 'emerald'} mode={signalTruthMode(fabric,warnings,error)} warnings={error ? [error,...warnings] : warnings} freshness={fabric.generatedAt} authority="Diagnostic sans faux uptime" secondary={{ label: 'Récupération stale', href: '/revenue-command-os/signals/stale-data' }}>
      <SignalLifecycle current="source" />
    </SignalRouteMasthead>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><SignalStat label="Checks disponibles" value={fabric.sourceHealth.length} note="Derniers diagnostics" tone="blue"/><SignalStat label="Dégradées" value={degraded.length} note="Stale, offline ou degraded" tone={degraded.length ? 'rose' : 'emerald'}/><SignalStat label="Événements échoués" value={failures} note="Fenêtre observée" tone={failures ? 'amber' : 'emerald'}/><SignalStat label="Latence moyenne" value={avgLatency === null ? 'Non calculé' : `${avgLatency} ms`} note={avgLatency === null ? 'Aucune latence mesurée' : 'Sources mesurées'} tone="cyan"/></section>

    <SignalPanel eyebrow="Clinical diagnostics" title="Matrice de santé" icon={Gauge} tone="blue">
      <div className="grid gap-4 lg:grid-cols-2">
        {fabric.sourceHealth.map((health) => { const source = sourceByCode.get(health.sourceCode); const freshnessLimit = source?.staleAfterMinutes || 0; const freshnessScore = typeof health.freshnessMinutes === 'number' && freshnessLimit ? Math.max(0, 100 - (health.freshnessMinutes / freshnessLimit) * 100) : 0; return <article key={health.id} className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><div className={`grid h-11 w-11 place-items-center rounded-2xl ${health.status === 'healthy' ? 'bg-emerald-100 text-emerald-700' : health.status === 'offline' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{health.status === 'offline' ? <WifiOff size={19}/> : health.status === 'healthy' ? <Activity size={19}/> : <AlertTriangle size={19}/>}</div><div><h3 className="text-sm font-black text-slate-950">{source?.name || health.sourceCode}</h3><p className="mt-1 text-[9px] font-semibold text-slate-600">Check : {formatSignalDate(health.checkedAt)}</p></div></div><SignalStatus status={health.status}/></div><p className="mt-4 text-[11px] font-semibold leading-5 text-slate-700">{health.diagnostic}</p><div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="Latence" value={health.latencyMs === undefined ? 'Indisponible' : `${health.latencyMs} ms`}/><Metric label="Fraîcheur" value={health.freshnessMinutes === undefined ? 'Indisponible' : `${health.freshnessMinutes} min`}/><Metric label="Normalisés" value={String(health.normalizedSignals)}/><Metric label="Échecs" value={String(health.failedEvents)}/></div><div className="mt-4"><SignalProgress value={freshnessScore} label="Autorité de fraîcheur" tone={freshnessScore >= 70 ? 'emerald' : freshnessScore >= 35 ? 'amber' : 'rose'}/></div>{health.lastError ? <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-[10px] font-black leading-5 text-rose-900">{health.lastError}</div> : null}<div className="mt-4 flex flex-wrap gap-2"><SignalTag tone={sourceStatusTone(health.status) === 'emerald' ? 'emerald' : sourceStatusTone(health.status) === 'amber' ? 'amber' : sourceStatusTone(health.status) === 'rose' ? 'rose' : 'slate'}>{health.status}</SignalTag><SignalTag tone="slate">{health.recordsObserved} observés</SignalTag><SignalTag tone="violet">{health.duplicateEvents} doublons</SignalTag></div></article> })}
        {!fabric.sourceHealth.length ? <SignalEmpty title="Aucun diagnostic disponible" description="Les sources sont déclarées mais aucun contrôle de santé n’a encore été enregistré."/> : null}
      </div>
    </SignalPanel>
  </div>
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[8px] font-black uppercase text-slate-600">{label}</p><p className="mt-1 text-xs font-black text-slate-950">{value}</p></div> }

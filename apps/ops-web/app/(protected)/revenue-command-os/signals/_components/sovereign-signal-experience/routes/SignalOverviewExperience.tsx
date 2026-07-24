'use client'

import Link from 'next/link'
import { Activity, AlertTriangle, ArrowUpRight, CopyCheck, Database, RadioTower, ScanLine, ShieldCheck, TimerOff, Waypoints } from 'lucide-react'
import SignalsHero from '../../../../_components/hero-sovereignty/heroes/SignalsHero'
import { useSignalFabric } from '../../SignalFabricContext'
import { formatSignalDate, signalSeverityTone, sourceStatusTone } from '../signal-data-mappers'
import { SignalPanel, SignalSafetyBanner, SignalStat, SignalStatus, SignalTag, signalExperienceStyles } from '../SignalExperiencePrimitives'

export default function SignalOverviewExperience() {
  const { fabric, warnings, error, busy, runAllScans, setSelected } = useSignalFabric()
  const active = fabric.signals.filter((signal) => !['resolved','dismissed'].includes(signal.status)).sort((a,b) => b.priorityScore - a.priorityScore)
  const degraded = fabric.sources.filter((source) => source.status !== 'healthy' && source.enabled)
  const unresolvedIssues = fabric.validationIssues.filter((issue) => issue.status === 'open' || issue.status === 'acknowledged')
  const state = error ? 'DEGRADED' : fabric.storageMode === 'contract-seed' ? 'PREVIEW' : degraded.length ? 'DEGRADED' : active.length ? 'LIVE' : 'EMPTY'

  return <div className={`${signalExperienceStyles.routeShell} space-y-5`} data-signal-route-id="MZ26-SIGNAL-ROOT">
    <SignalsHero
      state={state}
      posture={fabric.executionPosture}
      authority="Distribution interne · effets externes verrouillés"
      summary={active[0] ? `${active[0].title}: ${active[0].summary}` : 'Aucun signal actif n’est disponible. Le tissu reste prêt à observer, qualifier et distribuer de nouveaux événements.'}
      freshness={formatSignalDate(fabric.generatedAt)}
      metrics={[
        { label: 'Intake actif', value: active.length, note: 'Signaux non résolus', tone: 'cyan' },
        { label: 'Sources saines', value: `${fabric.counters.sourcesHealthy}/${fabric.counters.sourcesEnabled}`, note: 'Connecteurs activés', tone: degraded.length ? 'amber' : 'emerald' },
        { label: 'Contextes prêts', value: fabric.counters.contextReady, note: 'Snapshots minimisés', tone: 'blue' },
        { label: 'Écarts ouverts', value: unresolvedIssues.length, note: 'Validation du tissu', tone: unresolvedIssues.length ? 'rose' : 'emerald' },
      ]}
      actions={[{ label: busy ? 'Scan en cours…' : 'Scanner les sources', onClick: runAllScans, disabled: busy, reason: busy ? 'Un scan est déjà en cours.' : undefined, kind: 'primary', icon: ScanLine }]}
      warning={error || warnings[0] || (fabric.storageMode === 'contract-seed' ? 'PREVIEW — les données proviennent du contrat de référence et ne sont pas étiquetées LIVE.' : degraded.length ? `${degraded.length} source(s) activée(s) sont dégradées, stale ou hors ligne.` : undefined)}
    />

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <SignalStat label="Signaux 24h" value={fabric.counters.signals24h} note="Événements normalisés" tone="cyan" />
      <SignalStat label="Critiques" value={fabric.counters.criticalSignals} note="Intervention requise" tone={fabric.counters.criticalSignals ? 'rose' : 'emerald'} />
      <SignalStat label="À qualifier" value={fabric.counters.unacknowledgedSignals} note="Nouveaux ou triés" tone={fabric.counters.unacknowledgedSignals ? 'amber' : 'emerald'} />
      <SignalStat label="Doublons 24h" value={fabric.counters.duplicateEvents24h} note="Neutralisés par empreinte" tone="violet" />
      <SignalStat label="Scans à risque" value={fabric.counters.scansAtRisk} note="Échec ou retard" tone={fabric.counters.scansAtRisk ? 'rose' : 'emerald'} />
    </section>

    <div className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
      <SignalPanel eyebrow="Executive intake" title="Priorités qui remontent à la surface" icon={Activity} tone="cyan" action={<Link href="/revenue-command-os/signals/live-stream" className="inline-flex items-center gap-1 text-[10px] font-black text-cyan-800">Flux complet <ArrowUpRight size={13}/></Link>}>
        <div className="space-y-3">
          {active.slice(0,6).map((signal) => <button key={signal.id} type="button" onClick={() => setSelected(signal)} className="grid w-full gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-cyan-300 md:grid-cols-[auto_1fr_auto] md:items-center"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-sm font-black text-white">{signal.priorityScore}</div><div><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-black text-slate-950">{signal.title}</p><SignalStatus status={signal.severity}/></div><p className="mt-1 text-[11px] font-semibold leading-5 text-slate-700">{signal.summary}</p><p className="mt-2 text-[9px] font-black uppercase text-slate-600">{signal.sourceCode} · {formatSignalDate(signal.detectedAt)}</p></div><SignalTag tone={signalSeverityTone(signal.severity) === 'rose' ? 'rose' : signalSeverityTone(signal.severity) === 'amber' ? 'amber' : 'blue'}>{signal.category}</SignalTag></button>)}
          {!active.length ? <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-5 text-sm font-black text-emerald-900">Aucun signal actif dans la fenêtre actuelle.</div> : null}
        </div>
      </SignalPanel>

      <SignalPanel eyebrow="Source perimeter" title="Santé des capteurs commerciaux" icon={Database} tone="blue" action={<Link href="/revenue-command-os/signals/source-health" className="inline-flex items-center gap-1 text-[10px] font-black text-blue-800">Observatoire <ArrowUpRight size={13}/></Link>}>
        <div className="space-y-3">{fabric.sources.filter((source) => source.enabled).slice(0,7).map((source) => <div key={source.id} className="flex items-center justify-between gap-3 rounded-[20px] border border-slate-200 bg-white p-3"><div><p className="text-xs font-black text-slate-950">{source.name}</p><p className="mt-1 text-[9px] font-semibold text-slate-600">Dernier succès : {formatSignalDate(source.lastSuccessfulScanAt)}</p></div><SignalTag tone={sourceStatusTone(source.status) === 'emerald' ? 'emerald' : sourceStatusTone(source.status) === 'amber' ? 'amber' : sourceStatusTone(source.status) === 'rose' ? 'rose' : 'slate'}>{source.status}</SignalTag></div>)}</div>
      </SignalPanel>
    </div>

    <div className="grid gap-5 lg:grid-cols-4">
      <Link href="/revenue-command-os/signals/classification" className="rounded-[28px] border border-cyan-200 bg-cyan-50 p-5"><RadioTower size={20} className="text-cyan-700"/><p className="mt-5 text-sm font-black text-slate-950">Qualification</p><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-700">{fabric.rules.filter((rule) => rule.enabled).length} règle(s) actives structurent la classification.</p></Link>
      <Link href="/revenue-command-os/signals/deduplication" className="rounded-[28px] border border-violet-200 bg-violet-50 p-5"><CopyCheck size={20} className="text-violet-700"/><p className="mt-5 text-sm font-black text-slate-950">Intégrité</p><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-700">{fabric.counters.duplicateEvents24h} doublon(s) neutralisé(s) sur 24 heures.</p></Link>
      <Link href="/revenue-command-os/signals/stale-data" className="rounded-[28px] border border-amber-200 bg-amber-50 p-5"><TimerOff size={20} className="text-amber-700"/><p className="mt-5 text-sm font-black text-slate-950">Fraîcheur</p><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-700">{fabric.counters.staleSources} source(s) exigent une récupération ou une revue.</p></Link>
      <Link href="/revenue-command-os/signals/model-validation" className="rounded-[28px] border border-emerald-200 bg-emerald-50 p-5"><ShieldCheck size={20} className="text-emerald-700"/><p className="mt-5 text-sm font-black text-slate-950">Certification</p><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-700">Préparation globale : {fabric.readiness.overall}%.</p></Link>
    </div>

    <SignalSafetyBanner />
  </div>
}

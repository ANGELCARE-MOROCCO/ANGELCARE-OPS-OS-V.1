'use client'

import { Cable, Database, PauseCircle, PlayCircle, ScanLine, ShieldCheck } from 'lucide-react'
import { useSignalFabric } from '../../SignalFabricContext'
import { formatSignalDate, signalTruthMode, sourceStatusTone } from '../signal-data-mappers'
import { SignalEmpty, SignalLifecycle, SignalPanel, SignalRouteMasthead, SignalStat, SignalStatus, SignalTag, signalExperienceStyles } from '../SignalExperiencePrimitives'

export default function SourceControlExperience() {
  const { fabric, warnings, error, busy, runSourceScan, updateSourceStatus } = useSignalFabric()
  const enabled = fabric.sources.filter((source) => source.enabled)
  const sensitive = fabric.sources.filter((source) => source.containsSensitiveData)

  return <div className={`${signalExperienceStyles.routeShell} space-y-5`} data-signal-route-id="MZ26-SIGNAL-SOURCE-CONTROL">
    <SignalRouteMasthead eyebrow="Sources & connecteurs" title="Source Control Registry" subtitle="Le registre institutionnel des capteurs commerciaux, de leur périmètre autorisé et de leur capacité réelle à alimenter le tissu." concept="Source and Connector Registry" icon={Cable} tone="blue" mode={signalTruthMode(fabric,warnings,error)} warnings={error ? [error,...warnings] : warnings} freshness={fabric.generatedAt} authority="Allow-list · tenant lié" secondary={{ label: 'Observatoire santé', href: '/revenue-command-os/signals/source-health' }}>
      <SignalLifecycle current="source" />
    </SignalRouteMasthead>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><SignalStat label="Sources déclarées" value={fabric.sources.length} note="Registre complet" tone="blue"/><SignalStat label="Activées" value={enabled.length} note="Capteurs autorisés" tone="cyan"/><SignalStat label="Sensibles" value={sensitive.length} note="Minimisation requise" tone={sensitive.length ? 'amber' : 'emerald'}/><SignalStat label="Saines" value={fabric.counters.sourcesHealthy} note={`sur ${fabric.counters.sourcesEnabled} activées`} tone={fabric.counters.sourcesHealthy === fabric.counters.sourcesEnabled ? 'emerald' : 'amber'}/></section>

    <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
      <SignalPanel eyebrow="Governed connectors" title="Registre opérationnel" icon={Database} tone="blue">
        <div className="space-y-3">
          {fabric.sources.map((source) => <article key={source.id} className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"><div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-black text-slate-950">{source.name}</h3><SignalStatus status={source.status}/>{source.containsSensitiveData ? <SignalTag tone="amber">Données sensibles</SignalTag> : null}</div><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-700">{source.description}</p><div className="mt-3 flex flex-wrap gap-2"><SignalTag tone="blue">{source.sourceKind}</SignalTag><SignalTag tone="slate">Permission : {source.minimumPermission}</SignalTag><SignalTag tone="cyan">Scan {source.pollingMinutes} min</SignalTag><SignalTag tone="slate">{source.sourceTables.length} table(s)</SignalTag></div><p className="mt-3 text-[9px] font-black uppercase text-slate-600">Dernier succès : {formatSignalDate(source.lastSuccessfulScanAt)} · 24h : {source.recordCount24h} enregistrement(s), {source.errorCount24h} erreur(s)</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => runSourceScan(source.code)} disabled={busy || !source.enabled || source.status === 'offline'} title={!source.enabled ? 'Source désactivée.' : source.status === 'offline' ? 'Source hors ligne.' : undefined} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-950 px-3 text-[9px] font-black uppercase text-white disabled:cursor-not-allowed disabled:opacity-40"><ScanLine size={14}/>Scanner</button><button type="button" onClick={() => updateSourceStatus(source.id, source.status === 'paused' ? 'healthy' : 'paused')} disabled={busy || source.status === 'offline'} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[9px] font-black uppercase text-slate-800 disabled:opacity-40">{source.status === 'paused' ? <PlayCircle size={14}/> : <PauseCircle size={14}/>} {source.status === 'paused' ? 'Réactiver' : 'Pause'}</button></div></div></article>)}
          {!fabric.sources.length ? <SignalEmpty title="Aucune source configurée" description="Le registre ne contient aucun connecteur. La route est saine mais aucune source n’est encore autorisée."/> : null}
        </div>
      </SignalPanel>

      <SignalPanel eyebrow="Authority perimeter" title="Contrats de confiance" icon={ShieldCheck} tone="emerald">
        <div className="space-y-3">{fabric.sources.slice(0,8).map((source) => <div key={source.id} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-black text-slate-950">{source.code}</p><SignalTag tone={sourceStatusTone(source.status) === 'emerald' ? 'emerald' : sourceStatusTone(source.status) === 'amber' ? 'amber' : sourceStatusTone(source.status) === 'rose' ? 'rose' : 'slate'}>{source.status}</SignalTag></div><p className="mt-2 text-[10px] font-semibold leading-5 text-slate-700">Adapter : {source.adapterKey}</p><p className="mt-1 text-[9px] font-black uppercase text-slate-600">Unités : {source.businessUnitCodes.join(', ') || 'Toutes selon permission'}</p></div>)}</div>
      </SignalPanel>
    </div>
  </div>
}

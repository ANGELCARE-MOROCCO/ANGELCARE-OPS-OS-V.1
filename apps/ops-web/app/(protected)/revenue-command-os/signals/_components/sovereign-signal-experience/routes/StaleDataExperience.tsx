'use client'

import { ArrowUpRight, Clock3, RefreshCcw, TimerOff, WifiOff } from 'lucide-react'
import { useSignalFabric } from '../../SignalFabricContext'
import { formatSignalDate, signalTruthMode } from '../signal-data-mappers'
import { SignalEmpty, SignalLifecycle, SignalPanel, SignalRouteMasthead, SignalStat, SignalStatus, SignalTag, signalExperienceStyles } from '../SignalExperiencePrimitives'

export default function StaleDataExperience() {
  const { fabric, warnings, error, busy, runSourceScan, setSelected } = useSignalFabric()
  const now = Date.now()
  const staleSources = fabric.sources.filter((source) => ['stale','offline','degraded'].includes(source.status))
  const staleSignals = fabric.signals.filter((signal) => signal.expiresAt ? new Date(signal.expiresAt).getTime() < now : false)
  const oldSignals = fabric.signals.filter((signal) => now - new Date(signal.detectedAt).getTime() > 24 * 60 * 60 * 1000)

  return <div className={`${signalExperienceStyles.routeShell} space-y-5`} data-signal-route-id="MZ26-SIGNAL-STALE-DATA">
    <SignalRouteMasthead eyebrow="Données périmées" title="Stale Intelligence Recovery Desk" subtitle="La perte d’autorité temporelle est affichée explicitement avec son impact, son seuil et la seule récupération réellement éligible." concept="Stale Intelligence Recovery Desk" icon={TimerOff} tone={staleSources.length ? 'amber' : 'emerald'} mode={signalTruthMode(fabric,warnings,error)} warnings={error ? [error,...warnings] : warnings} freshness={fabric.generatedAt} authority="Aucune donnée stale présentée saine" secondary={{ label: 'Santé des sources', href: '/revenue-command-os/signals/source-health' }}>
      <SignalLifecycle current="source" />
    </SignalRouteMasthead>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><SignalStat label="Sources sous pression" value={staleSources.length} note="Stale, offline ou degraded" tone={staleSources.length ? 'rose' : 'emerald'}/><SignalStat label="Signaux expirés" value={staleSignals.length} note="expiresAt dépassé" tone={staleSignals.length ? 'amber' : 'emerald'}/><SignalStat label="Signaux > 24h" value={oldSignals.length} note="Âge observé" tone={oldSignals.length ? 'amber' : 'emerald'}/><SignalStat label="Seuils déclarés" value={fabric.sources.filter((source) => source.staleAfterMinutes > 0).length} note="Sources gouvernées" tone="blue"/></section>

    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <SignalPanel eyebrow="Source recovery" title="Sources à récupérer" icon={RefreshCcw} tone="amber">
        <div className="space-y-3">{staleSources.map((source) => <article key={source.id} className="rounded-[24px] border border-amber-200 bg-amber-50/70 p-4"><div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><div className={`grid h-10 w-10 place-items-center rounded-2xl ${source.status === 'offline' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{source.status === 'offline' ? <WifiOff size={18}/> : <Clock3 size={18}/>}</div><div><h3 className="text-sm font-black text-slate-950">{source.name}</h3><p className="mt-1 text-[9px] font-semibold text-slate-700">Dernière observation : {formatSignalDate(source.lastObservedAt)}</p></div></div><SignalStatus status={source.status}/></div><p className="mt-3 text-[10px] font-semibold leading-5 text-slate-700">Seuil de fraîcheur : {source.staleAfterMinutes} min. Dernier scan réussi : {formatSignalDate(source.lastSuccessfulScanAt)}.</p><button type="button" onClick={() => runSourceScan(source.code)} disabled={busy || source.status === 'offline' || !source.enabled} title={source.status === 'offline' ? 'La source est hors ligne.' : !source.enabled ? 'La source est désactivée.' : undefined} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-[9px] font-black uppercase text-white disabled:cursor-not-allowed disabled:opacity-40"><RefreshCcw size={13}/>Relancer le scan éligible</button></article>)}{!staleSources.length ? <SignalEmpty title="Aucune source périmée" description="Toutes les sources activées sont actuellement déclarées saines dans la fenêtre disponible."/> : null}</div>
      </SignalPanel>

      <SignalPanel eyebrow="Aging intelligence" title="Signaux ayant perdu de la fraîcheur" icon={TimerOff} tone="rose">
        <div className="space-y-3">{[...new Map([...staleSignals,...oldSignals].map((signal) => [signal.id,signal])).values()].sort((a,b) => new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime()).slice(0,10).map((signal) => <button key={signal.id} type="button" onClick={() => setSelected(signal)} className="grid w-full gap-3 rounded-[20px] border border-slate-200 bg-slate-50 p-4 text-left md:grid-cols-[1fr_auto] md:items-center"><div><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-black text-slate-950">{signal.title}</p><SignalStatus status={signal.status}/></div><p className="mt-1 text-[9px] font-semibold text-slate-700">Détecté : {formatSignalDate(signal.detectedAt)} · expiration : {formatSignalDate(signal.expiresAt)}</p></div><span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-rose-800">Inspecter <ArrowUpRight size={12}/></span></button>)}{!staleSignals.length && !oldSignals.length ? <SignalEmpty title="Aucun signal périmé" description="Aucun signal de la fenêtre actuelle n’a dépassé son expiration ou le seuil de 24 heures."/> : null}</div>
      </SignalPanel>
    </div>
  </div>
}

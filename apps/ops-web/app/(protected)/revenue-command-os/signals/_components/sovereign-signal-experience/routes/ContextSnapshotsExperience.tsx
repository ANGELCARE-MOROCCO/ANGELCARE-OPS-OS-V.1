'use client'

import { Archive, ArrowUpRight, Clock3, FileCheck2, Layers3, ShieldCheck } from 'lucide-react'
import { useSignalFabric } from '../../SignalFabricContext'
import { formatSignalDate, signalTruthMode } from '../signal-data-mappers'
import { SignalEmpty, SignalLifecycle, SignalPanel, SignalProgress, SignalRouteMasthead, SignalStat, SignalStatus, SignalTag, signalExperienceStyles } from '../SignalExperiencePrimitives'

export default function ContextSnapshotsExperience() {
  const { fabric, warnings, error, setSelected } = useSignalFabric()
  const ready = fabric.contextSnapshots.filter((snapshot) => snapshot.status === 'ready')
  const blocked = fabric.contextSnapshots.filter((snapshot) => snapshot.status === 'blocked')
  const avgCompleteness = fabric.contextSnapshots.length ? Math.round(fabric.contextSnapshots.reduce((sum,item) => sum + item.completenessScore,0) / fabric.contextSnapshots.length) : 0

  return <div className={`${signalExperienceStyles.routeShell} space-y-5`} data-signal-route-id="MZ26-SIGNAL-CONTEXT-SNAPSHOTS">
    <SignalRouteMasthead eyebrow="Snapshots de contexte" title="Commercial Context Archive" subtitle="Chaque capsule conserve les faits, hypothèses, contraintes, opportunités, risques et redactions nécessaires à une décision traçable." concept="Commercial Context Archive" icon={Archive} tone="cyan" mode={signalTruthMode(fabric,warnings,error)} warnings={error ? [error,...warnings] : warnings} freshness={fabric.generatedAt} authority="Contexte minimisé et expirable" secondary={{ label: 'Accès & confidentialité', href: '/revenue-command-os/signals/data-access' }}>
      <SignalLifecycle current="context" />
    </SignalRouteMasthead>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><SignalStat label="Snapshots" value={fabric.contextSnapshots.length} note="Capsules persistées" tone="cyan"/><SignalStat label="Prêts" value={ready.length} note="Disponibles à la décision" tone="emerald"/><SignalStat label="Bloqués" value={blocked.length} note="Contexte incomplet" tone={blocked.length ? 'rose' : 'emerald'}/><SignalStat label="Complétude moyenne" value={fabric.contextSnapshots.length ? `${avgCompleteness}%` : '—'} note={fabric.contextSnapshots.length ? 'Scores persistés' : 'Non calculée'} tone="blue"/></section>

    <div className="grid gap-5 xl:grid-cols-2">
      {fabric.contextSnapshots.map((snapshot) => { const signal = fabric.signals.find((item) => item.code === snapshot.signalCode); return <SignalPanel key={snapshot.id} eyebrow={snapshot.code} title={snapshot.purpose} icon={Layers3} tone={snapshot.status === 'ready' ? 'emerald' : snapshot.status === 'blocked' ? 'rose' : 'amber'} action={<SignalStatus status={snapshot.status}/>}>
        <div className="grid grid-cols-2 gap-3"><Fact label="Audience" value={snapshot.audienceRole}/><Fact label="Visibilité" value={snapshot.visibilityProfile}/><Fact label="Généré" value={formatSignalDate(snapshot.generatedAt)}/><Fact label="Expiration" value={formatSignalDate(snapshot.expiresAt)}/></div>
        <div className="mt-4 space-y-3"><SignalProgress value={snapshot.completenessScore} label="Complétude" tone={snapshot.completenessScore >= 80 ? 'emerald' : 'amber'}/><SignalProgress value={snapshot.freshnessScore} label="Fraîcheur" tone={snapshot.freshnessScore >= 80 ? 'cyan' : 'amber'}/></div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><Count icon={FileCheck2} label="Faits" value={snapshot.facts.length}/><Count icon={Clock3} label="Hypothèses" value={snapshot.hypotheses.length}/><Count icon={ShieldCheck} label="Redactions" value={snapshot.redactedFields.length}/><Count icon={Archive} label="Sources" value={snapshot.sources.length}/></div>
        <div className="mt-4 flex flex-wrap gap-2">{snapshot.sources.slice(0,5).map((source) => <SignalTag key={`${source.sourceType}-${source.sourceCode}`} tone={source.freshness === 'stale' ? 'amber' : source.authority === 'primary' ? 'emerald' : 'slate'}>{source.label} · {source.freshness}</SignalTag>)}</div>
        {signal ? <button type="button" onClick={() => setSelected(signal)} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-[9px] font-black uppercase text-white">Ouvrir le signal source <ArrowUpRight size={13}/></button> : <p className="mt-5 text-[10px] font-semibold text-slate-600">Signal source non disponible dans la fenêtre courante.</p>}
      </SignalPanel> })}
    </div>
    {!fabric.contextSnapshots.length ? <SignalEmpty title="Aucun snapshot de contexte" description="La route est saine mais aucun paquet de contexte n’a encore été construit."/> : null}
  </div>
}
function Fact({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 p-3"><p className="text-[8px] font-black uppercase text-slate-600">{label}</p><p className="mt-1 text-[10px] font-black text-slate-950">{value}</p></div> }
function Count({ icon: Icon, label, value }: { icon: typeof Archive; label: string; value: number }) { return <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center"><Icon size={14} className="mx-auto text-cyan-700"/><p className="mt-2 text-lg font-black text-slate-950">{value}</p><p className="text-[7px] font-black uppercase text-slate-600">{label}</p></div> }

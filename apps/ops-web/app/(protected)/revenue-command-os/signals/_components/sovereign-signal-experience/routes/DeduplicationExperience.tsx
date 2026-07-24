'use client'

import { CopyCheck, Fingerprint, GitMerge, ShieldCheck } from 'lucide-react'
import { useSignalFabric } from '../../SignalFabricContext'
import { formatSignalDate, signalTruthMode } from '../signal-data-mappers'
import { SignalEmpty, SignalLifecycle, SignalPanel, SignalProgress, SignalRouteMasthead, SignalStat, SignalStatus, SignalTag, signalExperienceStyles } from '../SignalExperiencePrimitives'

export default function DeduplicationExperience() {
  const { fabric, warnings, error } = useSignalFabric()
  const duplicates = fabric.rawEvents.filter((event) => event.processingStatus === 'duplicate' || Boolean(event.duplicateOfEventId))
  const failed = fabric.rawEvents.filter((event) => event.processingStatus === 'failed' || event.processingStatus === 'rejected')
  const fingerprints = new Map<string, typeof fabric.rawEvents>()
  fabric.rawEvents.forEach((event) => fingerprints.set(event.deduplicationKey, [...(fingerprints.get(event.deduplicationKey) || []), event]))
  const collisionGroups = [...fingerprints.entries()].filter(([,events]) => events.length > 1)

  return <div className={`${signalExperienceStyles.routeShell} space-y-5`} data-signal-route-id="MZ26-SIGNAL-DEDUPLICATION">
    <SignalRouteMasthead eyebrow="Déduplication" title="Integrity Reconciliation Desk" subtitle="Les empreintes, collisions et filiations de source sont rendues visibles sans inventer de fusion ou de suppression automatique." concept="Signal Integrity Reconciliation Desk" icon={CopyCheck} tone="emerald" mode={signalTruthMode(fabric,warnings,error)} warnings={error ? [error,...warnings] : warnings} freshness={fabric.generatedAt} authority="Idempotence protégée" secondary={{ label: 'Validation du tissu', href: '/revenue-command-os/signals/model-validation' }}>
      <SignalLifecycle current="qualification" />
    </SignalRouteMasthead>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><SignalStat label="Événements bruts" value={fabric.rawEvents.length} note="Fenêtre disponible" tone="blue"/><SignalStat label="Doublons identifiés" value={duplicates.length} note="Décision persistée" tone="violet"/><SignalStat label="Groupes de collision" value={collisionGroups.length} note="Empreinte partagée" tone={collisionGroups.length ? 'amber' : 'emerald'}/><SignalStat label="Rejetés ou échoués" value={failed.length} note="À inspecter" tone={failed.length ? 'rose' : 'emerald'}/></section>

    <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <SignalPanel eyebrow="Collision laboratory" title="Groupes d’empreintes" icon={Fingerprint} tone="violet">
        <div className="space-y-4">{collisionGroups.map(([key,events]) => <article key={key} className="rounded-[24px] border border-violet-200 bg-violet-50/60 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black text-slate-950">Empreinte {key}</p><p className="mt-1 text-[9px] font-semibold text-slate-600">{events.length} événements partagent la même clé de déduplication.</p></div><SignalTag tone="violet">Collision</SignalTag></div><div className="mt-4 grid gap-3 md:grid-cols-2">{events.map((event) => <div key={event.id} className="rounded-[18px] border border-white bg-white p-3"><div className="flex items-center justify-between gap-2"><p className="text-[10px] font-black text-slate-950">{event.eventId}</p><SignalStatus status={event.processingStatus}/></div><p className="mt-2 text-[9px] font-semibold text-slate-700">Source : {event.sourceCode} · type : {event.eventType}</p><p className="mt-1 text-[8px] font-black uppercase text-slate-500">Reçu {formatSignalDate(event.receivedAt)}</p>{event.duplicateOfEventId ? <p className="mt-2 text-[9px] font-black text-violet-800">Doublon de {event.duplicateOfEventId}</p> : null}</div>)}</div></article>)}{!collisionGroups.length ? <SignalEmpty title="Aucune collision d’empreinte" description="La fenêtre observée ne contient aucun groupe de plusieurs événements partageant la même clé."/> : null}</div>
      </SignalPanel>

      <SignalPanel eyebrow="Idempotency safety" title="Posture de protection" icon={ShieldCheck} tone="emerald">
        <SignalProgress value={fabric.readiness.deduplicationSafety} label="Sécurité de déduplication" tone={fabric.readiness.deduplicationSafety >= 80 ? 'emerald' : 'amber'}/>
        <div className="mt-5 space-y-3"><div className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-4"><GitMerge size={18} className="text-emerald-700"/><p className="mt-3 text-xs font-black text-emerald-950">Aucune fusion décorative</p><p className="mt-1 text-[10px] font-semibold leading-5 text-emerald-900">La page expose les décisions déjà persistées; elle n’invente ni merge, ni suppression.</p></div>{duplicates.slice(0,6).map((event) => <div key={event.id} className="rounded-[18px] border border-slate-200 bg-slate-50 p-3"><p className="text-[10px] font-black text-slate-950">{event.eventId}</p><p className="mt-1 text-[9px] font-semibold text-slate-700">{event.sourceCode} → {event.duplicateOfEventId || 'référence non déclarée'}</p></div>)}</div>
      </SignalPanel>
    </div>
  </div>
}

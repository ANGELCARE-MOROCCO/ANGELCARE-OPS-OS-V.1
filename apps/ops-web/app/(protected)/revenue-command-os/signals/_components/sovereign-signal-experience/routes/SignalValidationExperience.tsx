'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowUpRight, BadgeCheck, RefreshCcw, ShieldCheck } from 'lucide-react'
import { useSignalFabric } from '../../SignalFabricContext'
import { signalTruthMode } from '../signal-data-mappers'
import { SignalEmpty, SignalLifecycle, SignalPanel, SignalProgress, SignalRouteMasthead, SignalStat, SignalStatus, SignalTag, signalExperienceStyles } from '../SignalExperiencePrimitives'

const routeByCategory: Record<string,string> = { source: '/revenue-command-os/signals/source-control', freshness: '/revenue-command-os/signals/stale-data', deduplication: '/revenue-command-os/signals/deduplication', classification: '/revenue-command-os/signals/classification', privacy: '/revenue-command-os/signals/data-access', permission: '/revenue-command-os/signals/data-access', context: '/revenue-command-os/signals/context-snapshots', schedule: '/revenue-command-os/signals/scheduled-scans', coverage: '/revenue-command-os/signals/source-health', governance: '/revenue-command-os/signals' }

export default function SignalValidationExperience() {
  const { fabric, warnings, error, busy, runValidation, updateIssueStatus } = useSignalFabric()
  const open = fabric.validationIssues.filter((issue) => issue.status === 'open' || issue.status === 'acknowledged')
  const critical = open.filter((issue) => issue.severity === 'critical' || issue.severity === 'high')
  const scores = [
    ['Couverture sources', fabric.readiness.sourceCoverage], ['Santé sources', fabric.readiness.sourceHealth], ['Fraîcheur', fabric.readiness.freshness], ['Classification', fabric.readiness.classificationCoverage], ['Déduplication', fabric.readiness.deduplicationSafety], ['Contexte', fabric.readiness.contextReadiness], ['Confidentialité', fabric.readiness.privacySafety], ['Fiabilité scans', fabric.readiness.scheduleReliability],
  ] as const

  return <div className={`${signalExperienceStyles.routeShell} space-y-5`} data-signal-route-id="MZ26-SIGNAL-MODEL-VALIDATION">
    <SignalRouteMasthead eyebrow="Validation du tissu" title="Integrity Certification" subtitle="La couverture, la fraîcheur, la classification, la confidentialité et les scans sont certifiés sans réparation automatique ni faux état tout vert." concept="Signal Fabric Integrity Certification" icon={BadgeCheck} tone={critical.length ? 'rose' : open.length ? 'amber' : 'emerald'} mode={signalTruthMode(fabric,warnings,error)} warnings={error ? [error,...warnings] : warnings} freshness={fabric.generatedAt} authority="Certification avec preuve" primary={{ label: busy ? 'Validation en cours…' : 'Relancer la validation', onClick: runValidation, disabled: busy, reason: busy ? 'Une validation est déjà en cours.' : undefined }} secondary={{ label: 'Vue Signal Fabric', href: '/revenue-command-os/signals' }}>
      <SignalLifecycle current="governance" />
    </SignalRouteMasthead>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><SignalStat label="Préparation globale" value={`${fabric.readiness.overall}%`} note="Score persisté" tone={fabric.readiness.overall >= 80 ? 'emerald' : fabric.readiness.overall >= 60 ? 'amber' : 'rose'}/><SignalStat label="Écarts ouverts" value={open.length} note="Open ou acknowledged" tone={open.length ? 'amber' : 'emerald'}/><SignalStat label="Critiques/élevés" value={critical.length} note="À résoudre avant reliance" tone={critical.length ? 'rose' : 'emerald'}/><SignalStat label="Résolus" value={fabric.validationIssues.filter((issue) => issue.status === 'resolved').length} note="Traçabilité conservée" tone="blue"/></section>

    <div className="grid gap-5 xl:grid-cols-[430px_1fr]">
      <SignalPanel eyebrow="Certification core" title="Préparation du tissu" icon={ShieldCheck} tone="emerald">
        <div className="grid place-items-center rounded-[28px] bg-slate-950 p-7 text-white"><div className="grid h-64 w-64 place-items-center rounded-full border-[18px] border-emerald-400/20"><div className="text-center"><p className="text-6xl font-black tracking-[-.08em] text-white">{fabric.readiness.overall}%</p><p className="mt-2 text-[9px] font-black uppercase tracking-[.18em] text-emerald-300">Readiness persistée</p></div></div></div><div className="mt-5 space-y-4">{scores.map(([label,value]) => <SignalProgress key={label} value={value} label={label} tone={value >= 80 ? 'emerald' : value >= 60 ? 'amber' : 'rose'}/>)}</div>
      </SignalPanel>

      <SignalPanel eyebrow="Issue ledger" title="Écarts et preuves de correction" icon={AlertTriangle} tone={critical.length ? 'rose' : 'amber'} action={<button type="button" onClick={runValidation} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[9px] font-black uppercase text-slate-800 disabled:opacity-40"><RefreshCcw size={13}/>Rafraîchir</button>}>
        <div className="space-y-3">{fabric.validationIssues.map((issue) => <article key={issue.id} className="grid gap-4 rounded-[24px] border border-slate-200 bg-white p-4 md:grid-cols-[auto_1fr_auto] md:items-center"><div className={`grid h-11 w-11 place-items-center rounded-2xl ${issue.severity === 'critical' || issue.severity === 'high' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}><AlertTriangle size={18}/></div><div><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-black text-slate-950">{issue.title}</p><SignalStatus status={issue.severity}/><SignalStatus status={issue.status}/></div><p className="mt-2 text-[10px] font-semibold leading-5 text-slate-700">{issue.detail}</p><p className="mt-1 text-[9px] font-black text-emerald-800">{issue.recommendedAction}</p><div className="mt-2 flex flex-wrap gap-2"><SignalTag tone="slate">{issue.resourceType}</SignalTag><SignalTag tone="blue">{issue.resourceCode}</SignalTag><SignalTag tone="violet">{issue.category}</SignalTag></div></div><div className="flex flex-col gap-2"><Link href={routeByCategory[issue.category] || '/revenue-command-os/signals'} className="inline-flex min-h-9 items-center justify-center gap-1 rounded-xl bg-slate-950 px-3 text-[9px] font-black uppercase text-white">Ouvrir <ArrowUpRight size={12}/></Link><button type="button" onClick={() => updateIssueStatus(issue.id, issue.status === 'resolved' ? 'open' : 'acknowledged')} disabled={busy} className="min-h-9 rounded-xl border border-slate-200 bg-white px-3 text-[9px] font-black uppercase text-slate-800 disabled:opacity-40">{issue.status === 'resolved' ? 'Rouvrir' : 'Accuser réception'}</button></div></article>)}{!fabric.validationIssues.length ? <SignalEmpty title="Aucun écart de validation" description="La fenêtre actuelle ne contient aucun problème de certification. Aucun état vert n’est fabriqué : la liste est réellement vide."/> : null}</div>
      </SignalPanel>
    </div>
  </div>
}

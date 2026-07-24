'use client'

import { EyeOff, FileKey2, KeyRound, LockKeyhole, ShieldCheck, UserRoundCheck } from 'lucide-react'
import { useSignalFabric } from '../../SignalFabricContext'
import { signalTruthMode } from '../signal-data-mappers'
import { SignalEmpty, SignalLifecycle, SignalPanel, SignalRouteMasthead, SignalStat, SignalStatus, SignalTag, signalExperienceStyles } from '../SignalExperiencePrimitives'

export default function DataAccessExperience() {
  const { fabric, warnings, error } = useSignalFabric()
  const sensitive = fabric.sources.filter((source) => source.containsSensitiveData)
  const profiles = [...new Set(fabric.contextSnapshots.map((snapshot) => snapshot.visibilityProfile))]
  const redacted = fabric.contextSnapshots.reduce((sum,snapshot) => sum + snapshot.redactedFields.length,0)
  const privacyIssues = fabric.validationIssues.filter((issue) => issue.category === 'privacy' || issue.category === 'permission')

  return <div className={`${signalExperienceStyles.routeShell} space-y-5`} data-signal-route-id="MZ26-SIGNAL-DATA-ACCESS">
    <SignalRouteMasthead eyebrow="Accès & confidentialité" title="Intelligence Access Authority" subtitle="Les profils de visibilité, sources sensibles, redactions et permissions sont exposés comme une constitution d’accès, pas comme un décor cybersécurité." concept="Commercial Intelligence Access Authority" icon={FileKey2} tone="violet" mode={signalTruthMode(fabric,warnings,error)} warnings={error ? [error,...warnings] : warnings} freshness={fabric.generatedAt} authority="Minimisation · RLS · tenant" secondary={{ label: 'Snapshots de contexte', href: '/revenue-command-os/signals/context-snapshots' }}>
      <SignalLifecycle current="governance" />
    </SignalRouteMasthead>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><SignalStat label="Sources sensibles" value={sensitive.length} note="Minimisation requise" tone={sensitive.length ? 'amber' : 'emerald'}/><SignalStat label="Profils visibles" value={profiles.length} note="Snapshots déclarés" tone="violet"/><SignalStat label="Champs redacted" value={redacted} note="Somme des snapshots" tone="blue"/><SignalStat label="Écarts privacy" value={privacyIssues.filter((issue) => issue.status !== 'resolved').length} note="Ouverts ou reconnus" tone={privacyIssues.some((issue) => issue.status !== 'resolved') ? 'rose' : 'emerald'}/></section>

    <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
      <SignalPanel eyebrow="Visibility constitution" title="Profils d’accès observés" icon={UserRoundCheck} tone="violet">
        <div className="space-y-3">{profiles.map((profile) => { const snapshots = fabric.contextSnapshots.filter((snapshot) => snapshot.visibilityProfile === profile); return <div key={profile} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-black text-slate-950">{profile}</p><SignalTag tone="violet">{snapshots.length} snapshot(s)</SignalTag></div><p className="mt-2 text-[10px] font-semibold leading-5 text-slate-700">Audiences : {[...new Set(snapshots.map((snapshot) => snapshot.audienceRole))].join(', ') || '—'}</p><p className="mt-1 text-[9px] font-black uppercase text-slate-600">Redactions : {snapshots.reduce((sum,item) => sum + item.redactedFields.length,0)}</p></div> })}{!profiles.length ? <SignalEmpty title="Aucun profil observé" description="Aucun snapshot ne déclare encore de profil de visibilité."/> : null}</div>
      </SignalPanel>

      <SignalPanel eyebrow="Sensitive perimeter" title="Sources et permissions minimales" icon={LockKeyhole} tone="amber">
        <div className="space-y-3">{fabric.sources.map((source) => <article key={source.id} className={`rounded-[22px] border p-4 ${source.containsSensitiveData ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'}`}><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-black text-slate-950">{source.name}</p>{source.containsSensitiveData ? <SignalTag tone="amber">Sensible</SignalTag> : <SignalTag tone="emerald">Standard</SignalTag>}</div><p className="mt-2 text-[10px] font-semibold text-slate-700">Permission minimale : {source.minimumPermission}</p><p className="mt-1 text-[9px] font-black uppercase text-slate-600">Adapter {source.adapterKey}</p></div><KeyRound size={17} className={source.containsSensitiveData ? 'text-amber-700' : 'text-emerald-700'}/></div></article>)}</div>
      </SignalPanel>
    </div>

    <SignalPanel eyebrow="Privacy audit" title="Écarts de confidentialité et permission" icon={ShieldCheck} tone="rose">
      <div className="space-y-3">{privacyIssues.map((issue) => <div key={issue.id} className="grid gap-3 rounded-[22px] border border-slate-200 bg-white p-4 md:grid-cols-[auto_1fr_auto] md:items-center"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-50 text-rose-700"><EyeOff size={17}/></div><div><p className="text-xs font-black text-slate-950">{issue.title}</p><p className="mt-1 text-[10px] font-semibold leading-5 text-slate-700">{issue.detail}</p><p className="mt-1 text-[9px] font-black text-emerald-800">{issue.recommendedAction}</p></div><SignalStatus status={issue.status}/></div>)}{!privacyIssues.length ? <SignalEmpty title="Aucun écart privacy déclaré" description="Le registre de validation ne contient aucun écart de confidentialité ou permission dans la fenêtre actuelle."/> : null}</div>
    </SignalPanel>
  </div>
}

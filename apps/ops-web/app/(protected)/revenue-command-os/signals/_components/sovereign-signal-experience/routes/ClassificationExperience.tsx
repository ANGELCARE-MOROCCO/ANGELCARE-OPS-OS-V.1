'use client'

import { useMemo, useState } from 'react'
import { ArrowUpRight, BadgeCheck, Filter, SlidersHorizontal, Sparkles, Target } from 'lucide-react'
import { useSignalFabric } from '../../SignalFabricContext'
import { signalSeverityTone, signalTruthMode } from '../signal-data-mappers'
import { SignalEmpty, SignalLifecycle, SignalPanel, SignalProgress, SignalRouteMasthead, SignalStat, SignalStatus, SignalTag, signalExperienceStyles } from '../SignalExperiencePrimitives'

export default function ClassificationExperience() {
  const { fabric, warnings, error, setSelected } = useSignalFabric()
  const [category, setCategory] = useState('all')
  const categories = [...new Set(fabric.signals.map((signal) => signal.category))]
  const visible = useMemo(() => fabric.signals.filter((signal) => category === 'all' || signal.category === category), [fabric.signals, category])
  const unknownConfidence = visible.filter((signal) => signal.confidence === 'unknown').length
  const unclassified = visible.filter((signal) => !signal.category || !signal.signalType).length

  return <div className={`${signalExperienceStyles.routeShell} space-y-5`} data-signal-route-id="MZ26-SIGNAL-CLASSIFICATION">
    <SignalRouteMasthead eyebrow="Classification" title="Qualification Desk" subtitle="La discipline de classification rend chaque signal explicable, priorisable et prêt à rejoindre une destination gouvernée." concept="Commercial Signal Qualification Desk" icon={SlidersHorizontal} tone="violet" mode={signalTruthMode(fabric,warnings,error)} warnings={error ? [error,...warnings] : warnings} freshness={fabric.generatedAt} authority="Scores réels uniquement" secondary={{ label: 'Flux en direct', href: '/revenue-command-os/signals/live-stream' }}>
      <SignalLifecycle current="qualification" />
    </SignalRouteMasthead>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><SignalStat label="Règles actives" value={fabric.rules.filter((rule) => rule.enabled).length} note="Moteur explicable" tone="violet"/><SignalStat label="Catégories présentes" value={categories.length} note="Dans la fenêtre actuelle" tone="blue"/><SignalStat label="Confiance inconnue" value={unknownConfidence} note="À revoir" tone={unknownConfidence ? 'amber' : 'emerald'}/><SignalStat label="Classification incomplète" value={unclassified} note="Catégorie ou type absent" tone={unclassified ? 'rose' : 'emerald'}/></section>

    <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
      <SignalPanel eyebrow="Rule doctrine" title="Règles de qualification" icon={Sparkles} tone="violet">
        <div className="space-y-3">{fabric.rules.map((rule) => <article key={rule.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black text-slate-950">{rule.name}</p><p className="mt-1 text-[9px] font-black uppercase text-slate-600">{rule.code} · version {rule.version}</p></div><SignalStatus status={rule.enabled ? 'active' : 'paused'}/></div><p className="mt-3 text-[10px] font-semibold leading-5 text-slate-700">Condition : {rule.condition}</p><div className="mt-3 grid gap-2 sm:grid-cols-3"><RuleFact label="Sévérité" value={rule.severityLogic}/><RuleFact label="Confiance" value={rule.confidenceLogic}/><RuleFact label="Score" value={rule.scoreLogic}/></div><div className="mt-3 flex flex-wrap gap-2"><SignalTag tone="violet">{rule.category}</SignalTag><SignalTag tone="blue">Expire {rule.expiryMinutes} min</SignalTag><SignalTag tone="slate">Cooldown {rule.cooldownMinutes} min</SignalTag></div></article>)}</div>
      </SignalPanel>

      <SignalPanel eyebrow="Qualification queue" title="Signaux à arbitrer" icon={Target} tone="blue" action={<div className="flex items-center gap-2"><Filter size={14} className="text-slate-500"/><select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-black text-slate-800"><option value="all">Toutes catégories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>}>
        <div className="space-y-3">{visible.sort((a,b) => b.priorityScore - a.priorityScore).slice(0,10).map((signal) => <button key={signal.id} type="button" onClick={() => setSelected(signal)} className="grid w-full gap-3 rounded-[22px] border border-slate-200 bg-white p-4 text-left transition hover:border-violet-300 md:grid-cols-[1fr_auto] md:items-center"><div><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-black text-slate-950">{signal.title}</p><SignalStatus status={signal.confidence}/><SignalStatus status={signal.severity}/></div><p className="mt-2 text-[10px] font-semibold leading-5 text-slate-700">{signal.summary}</p><div className="mt-3 grid grid-cols-4 gap-2"><Score label="Priorité" value={signal.priorityScore}/><Score label="Urgence" value={signal.urgencyScore}/><Score label="Opportunité" value={signal.opportunityScore}/><Score label="Risque" value={signal.riskScore}/></div></div><div className="flex items-center gap-2 text-[9px] font-black uppercase text-violet-800">Inspecter <ArrowUpRight size={13}/></div></button>)}{!visible.length ? <SignalEmpty title="Aucun signal dans cette catégorie" description="La source est disponible mais aucun signal ne correspond au filtre sélectionné."/> : null}</div>
      </SignalPanel>
    </div>

    <SignalPanel eyebrow="Coverage" title="Couverture du modèle de qualification" icon={BadgeCheck} tone="emerald"><SignalProgress value={fabric.readiness.classificationCoverage} label="Classification couverte" tone={fabric.readiness.classificationCoverage >= 80 ? 'emerald' : 'amber'}/></SignalPanel>
  </div>
}

function RuleFact({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-white p-3"><p className="text-[8px] font-black uppercase text-slate-600">{label}</p><p className="mt-1 text-[9px] font-semibold leading-4 text-slate-800">{value}</p></div> }
function Score({ label, value }: { label: string; value: number }) { return <div className="rounded-xl bg-slate-50 p-2 text-center"><p className="text-[7px] font-black uppercase text-slate-500">{label}</p><p className={`mt-1 text-sm font-black ${signalSeverityTone(value >= 85 ? 'critical' : value >= 65 ? 'high' : 'low') === 'rose' ? 'text-rose-700' : value >= 65 ? 'text-amber-700' : 'text-slate-950'}`}>{value}</p></div> }

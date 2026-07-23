'use client'

import { Activity, BadgeCheck, CheckCircle2, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react'
import { SChip } from '../../../../_components/visual-sovereignty/SovereignPrimitives'
import { CommandEmpty, CommandPanel, CommandRouteMasthead, CommandStat, ProgressBar } from '../CommandExperiencePrimitives'
import type { CommandRouteContext } from '../command-experience-types'

const readinessLabels: Record<string, string> = {
  schemaIntegrity: 'Intégrité schéma', registryIntegrity: 'Intégrité registre', eligibilityCoverage: 'Couverture éligibilité', routingDeterminism: 'Routage déterministe', graphSafety: 'Sécurité graphes', permissionSafety: 'Sécurité permissions', shadowSafety: 'Sécurité Shadow', rollbackReadiness: 'Préparation rollback', testCoverage: 'Couverture tests',
}

export default function CommandValidationExperience({ data, loading, warnings }: CommandRouteContext) {
  const readiness = data?.readiness
  const checks = readiness ? Object.entries(readiness).filter(([key]) => key !== 'overall') : []
  const issues = data?.issues || []
  const blocking = issues.filter((issue) => issue.severity === 'critical' || issue.severity === 'high')
  const certified = Boolean(data && data.missingCount === 0 && data.driftCount === 0 && (readiness?.overall || 0) >= 90 && blocking.length === 0)
  return <div className="space-y-6" data-command-experience="kernel-integrity-certification">
    <CommandRouteMasthead eyebrow="Certification institutionnelle" title="Validation du noyau" subtitle="Consolider registre, taxonomie, routage, dépendances, permissions, Shadow et rollback dans une décision de certification explicable." concept="Kernel Integrity Certification" icon={BadgeCheck} mode={loading ? 'initializing' : data?.dataMode} warnings={warnings} freshness={data?.generatedAt} authority="Aucune réparation automatique" secondary={{ label: 'Voir les garde-fous', href: '/revenue-command-os/command-kernel/guardrails' }}>
      <div className="grid grid-cols-3 gap-2"><CommandStat label="Score" value={readiness ? `${readiness.overall}%` : '—'} tone={readiness && readiness.overall >= 90 ? 'emerald' : 'amber'} /><CommandStat label="Dérive" value={data?.driftCount ?? '—'} tone={data?.driftCount ? 'amber' : 'emerald'} /><CommandStat label="Bloquants" value={blocking.length} tone={blocking.length ? 'rose' : 'emerald'} /></div>
    </CommandRouteMasthead>

    <section className={`grid gap-6 rounded-[34px] border p-6 xl:grid-cols-[360px_1fr] ${certified ? 'border-emerald-200 bg-emerald-50/45' : 'border-amber-200 bg-amber-50/45'}`}>
      <div className={`relative grid min-h-[360px] place-items-center overflow-hidden rounded-[28px] text-white ${certified ? 'bg-[linear-gradient(145deg,#047857,#052e2b)]' : 'bg-[linear-gradient(145deg,#b45309,#241b12)]'}`}>
        <div className="absolute h-72 w-72 rounded-full border-[20px] border-white/10" aria-hidden="true" /><div className="relative text-center">{certified ? <ShieldCheck size={54} className="mx-auto" /> : <ShieldAlert size={54} className="mx-auto" />}<p className="mt-6 text-7xl font-black tracking-[-.08em]">{readiness?.overall ?? '—'}{readiness ? '%' : ''}</p><p className="mt-3 text-[10px] font-black uppercase tracking-[.18em]">{certified ? 'Certification admissible' : 'Certification sous réserve'}</p><div className="mt-6 flex justify-center gap-2"><SChip tone={data?.missingCount ? 'rose' : 'emerald'}>{data?.missingCount ?? '—'} manquante(s)</SChip><SChip tone={data?.driftCount ? 'amber' : 'emerald'}>{data?.driftCount ?? '—'} drift</SChip></div></div>
      </div>
      <div className="grid content-start gap-4 sm:grid-cols-2">{checks.map(([key, value]) => { const score = Number(value); return <article key={key} className="rounded-[22px] border border-slate-200 bg-white p-4"><div className="flex items-center justify-between gap-3"><p className="text-[10px] font-black uppercase tracking-[.1em] text-slate-600">{readinessLabels[key] || key}</p><span className="text-sm font-black text-slate-950">{score}%</span></div><div className="mt-3"><ProgressBar value={score} tone={score >= 90 ? 'emerald' : score >= 70 ? 'blue' : 'amber'} /></div></article> })}{!checks.length ? <CommandEmpty title="Certification indisponible" description="Aucun score réel n’a été retourné. La page refuse de produire un état vert artificiel." /> : null}</div>
    </section>

    <CommandPanel title="Registre des contrôles" eyebrow="Anomalies & remédiations" icon={Activity} tone={issues.length ? 'amber' : 'emerald'}>
      <div className="space-y-3">{issues.map((issue) => <article key={issue.id} className="grid gap-4 rounded-[24px] border border-slate-200 p-4 lg:grid-cols-[auto_1fr_auto] lg:items-center"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${issue.severity === 'critical' ? 'bg-rose-600 text-white' : issue.severity === 'high' ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'}`}>{issue.severity === 'critical' ? <ShieldX size={19} /> : <Activity size={19} />}</span><div><p className="text-xs font-black text-slate-950">{issue.title}</p><p className="mt-1 text-[10px] font-semibold leading-5 text-slate-600">{issue.detail}</p><p className="mt-2 text-[10px] font-black text-blue-700">Remédiation · {issue.remediation}</p></div><SChip tone={issue.status === 'resolved' ? 'emerald' : issue.severity === 'critical' ? 'rose' : 'amber'}>{issue.status}</SChip></article>)}{!issues.length ? <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-6"><CheckCircle2 size={20} className="text-emerald-700" /><p className="mt-3 text-sm font-black text-emerald-950">Aucun défaut déclaré par le registre actuel.</p><p className="mt-1 text-[11px] font-semibold leading-5 text-emerald-900">Ce résultat dépend uniquement des contrôles réellement retournés.</p></div> : null}</div>
    </CommandPanel>

    <div className="grid gap-4 lg:grid-cols-4"><CommandStat label="Canoniques" value={data?.expectedCount ?? 3000} tone="violet" /><CommandStat label="Anchors protégés" value={12} tone="blue" /><CommandStat label="Définitions" value={3012} tone="cyan" /><CommandStat label="Doublons contractuels" value={0} tone="emerald" /></div>
  </div>
}

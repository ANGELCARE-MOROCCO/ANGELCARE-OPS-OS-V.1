'use client'

import { AlertTriangle, GitCompareArrows, Scale, ShieldAlert } from 'lucide-react'
import type { RevenueKnowledgeConflictStatus } from '@/lib/revenue-command-os/types'
import { useKnowledgeMemory } from '../../KnowledgeMemoryContext'
import { MemoryEmpty, MemoryLifecycle, MemoryPanel, MemoryRouteMasthead, MemorySafetyBanner, MemoryStat, MemoryStatus, MemoryTag, memoryExperienceStyles } from '../MemoryExperiencePrimitives'
import { formatMemoryDate, memoryMode, memoryWarnings } from '../memory-data-mappers'

export default function ConflictResolverExperience() {
  const { knowledge, busy, error, resolveConflict } = useKnowledgeMemory()
  const open = knowledge.conflicts.filter((item) => item.status === 'open' || item.status === 'under-review')

  async function resolve(id: string, status: RevenueKnowledgeConflictStatus) {
    const resolution = window.prompt(`Motif d’arbitrage « ${status} »`)
    if (!resolution) return
    await resolveConflict(id, status, resolution)
  }

  return <div className={`${memoryExperienceStyles.routeShell} space-y-6`} data-memory-route-id="MZ27-MEMORY-CONFLICT-RESOLVER">
    <MemoryRouteMasthead eyebrow="Arbitrage doctrinal" title="Conflits, contradictions et autorité de résolution" subtitle="Comparer les sources, mesurer le risque, identifier l’autorité compétente et tracer chaque résolution sans déclarer un conflit clos avant décision réelle." concept="Doctrine Conflict Arbitration Chamber" icon={GitCompareArrows} mode={memoryMode(knowledge, error)} warnings={memoryWarnings(knowledge, error)} freshness={knowledge.generatedAt} authority={`${open.length} arbitrage(s) ouvert(s)`} secondary={{ label: 'Versions & provenance', href: '/revenue-command-os/memory-learning/versions-provenance' }}>
      <div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-white/[.07] p-4"><p className="text-[9px] font-black uppercase text-slate-200">Critiques</p><p className="mt-2 text-2xl font-black text-white">{open.filter((item) => item.severity === 'critical').length}</p></div><div className="rounded-2xl border border-white/10 bg-white/[.07] p-4"><p className="text-[9px] font-black uppercase text-slate-200">Résolus</p><p className="mt-2 text-2xl font-black text-white">{knowledge.conflicts.filter((item) => item.status === 'resolved').length}</p></div></div>
    </MemoryRouteMasthead>
    <MemoryLifecycle current="review" />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MemoryStat label="Conflits" value={knowledge.conflicts.length} note="Contradictions détectées" tone="rose"/><MemoryStat label="Ouverts" value={knowledge.counters.openConflicts} note="Arbitrages requis" tone={knowledge.counters.openConflicts ? 'rose' : 'emerald'}/><MemoryStat label="Sous revue" value={knowledge.conflicts.filter((item) => item.status === 'under-review').length} note="Autorité mobilisée" tone="amber"/><MemoryStat label="Sécurité conflits" value={`${knowledge.readiness.conflictSafety}%`} note="Mesure issue du modèle" tone={knowledge.readiness.conflictSafety >= 80 ? 'emerald' : 'amber'}/></div>

    {knowledge.conflicts.length ? <div className="space-y-5">{knowledge.conflicts.map((conflict) => <article key={conflict.id} className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,.055)] sm:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><MemoryTag tone={conflict.severity === 'critical' || conflict.severity === 'high' ? 'rose' : 'amber'}>{conflict.severity}</MemoryTag><MemoryStatus status={conflict.status}/><span className="text-[9px] font-black uppercase tracking-[.12em] text-slate-500">{conflict.code} · {conflict.conflictType}</span></div><h2 className="mt-3 text-xl font-black tracking-[-.025em] text-slate-950">{conflict.summary}</h2><p className="mt-2 text-[10px] font-semibold text-slate-600">Détecté : {formatMemoryDate(conflict.detectedAt)}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto_1fr]"><ResourceCard label="Source A" code={conflict.leftResourceCode}/><span className="grid h-12 w-12 place-items-center self-center rounded-2xl bg-rose-50 text-rose-800"><GitCompareArrows size={19}/></span><ResourceCard label="Source B" code={conflict.rightResourceCode}/></div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2"><div className="rounded-2xl border border-rose-200 bg-rose-50 p-4"><p className="text-[9px] font-black uppercase text-rose-800">Risque institutionnel</p><p className="mt-2 text-[11px] font-semibold leading-5 text-rose-950">{conflict.risk}</p></div><div className="rounded-2xl border border-blue-200 bg-blue-50 p-4"><p className="text-[9px] font-black uppercase text-blue-800">Résolution recommandée</p><p className="mt-2 text-[11px] font-semibold leading-5 text-blue-950">{conflict.recommendedResolution}</p></div></div>
        {conflict.resolution ? <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-[9px] font-black uppercase text-emerald-800">Décision enregistrée</p><p className="mt-2 text-[11px] font-semibold leading-5 text-emerald-950">{conflict.resolution}</p></div> : null}
      </div>
      {['open','under-review'].includes(conflict.status) ? <aside className="w-full rounded-[24px] border border-slate-200 bg-slate-50 p-4 xl:w-64"><div className="flex items-center gap-3"><Scale size={18} className="text-slate-700"/><p className="text-xs font-black text-slate-950">Décision traçable</p></div><p className="mt-2 text-[10px] font-semibold leading-5 text-slate-700">Chaque transition exige une motivation. Un risque accepté reste distinct d’un conflit résolu.</p><div className="mt-4 grid gap-2"><button type="button" disabled={busy} onClick={() => void resolve(conflict.id, 'under-review')} className="rounded-xl bg-amber-500 px-3 py-2.5 text-[9px] font-black text-white disabled:opacity-45">Prendre en revue</button><button type="button" disabled={busy} onClick={() => void resolve(conflict.id, 'resolved')} className="rounded-xl bg-emerald-700 px-3 py-2.5 text-[9px] font-black text-white disabled:opacity-45">Résoudre</button><button type="button" disabled={busy} onClick={() => void resolve(conflict.id, 'accepted-risk')} className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[9px] font-black text-slate-800 disabled:opacity-45">Accepter le risque</button></div></aside> : <aside className="w-full rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 xl:w-64"><ShieldAlert size={18} className="text-emerald-700"/><p className="mt-3 text-xs font-black text-emerald-950">Arbitrage fermé</p><p className="mt-2 text-[10px] font-semibold leading-5 text-emerald-900">Statut réel : {conflict.status}. Aucune action supplémentaire n’est proposée.</p></aside>}
      </div>
    </article>)}</div> : <MemoryEmpty title="Aucun conflit enregistré" description="Le registre ne contient aucune contradiction ouverte. Cette absence provient du modèle courant et non d’un état décoratif." />}

    <MemoryPanel title="Principe d’arbitrage" eyebrow="Autorité avant préférence" icon={AlertTriangle} tone="amber" dark><p className="text-sm font-semibold leading-6 text-slate-100">Une version plus récente ne prévaut pas automatiquement. L’autorité, la période d’effet, la provenance, le périmètre et la décision d’arbitrage restent déterminants.</p></MemoryPanel>
    <MemorySafetyBanner detail="Aucun conflit n’est marqué résolu sans mutation réelle et motivation. Le risque accepté reste explicitement visible comme tel." />
  </div>
}

function ResourceCard({ label, code }: { label: string; code: string }) { return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[8px] font-black uppercase text-slate-500">{label}</p><p className="mt-2 break-all text-sm font-black text-slate-950">{code}</p></div> }

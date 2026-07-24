'use client'

import { AlertTriangle, BookOpenCheck, FileCheck2, LibraryBig, RefreshCcw, ShieldCheck, Workflow } from 'lucide-react'
import type { RevenueDoctrine } from '@/lib/revenue-command-os/types'
import { MemoryHero } from '../../../../_components/hero-sovereignty/heroes'
import { useKnowledgeMemory } from '../../KnowledgeMemoryContext'
import { MemoryLifecycle, MemoryPanel, MemoryProgress, MemorySafetyBanner, MemoryStat, MemoryStatus, memoryExperienceStyles } from '../MemoryExperiencePrimitives'
import { memoryMode, memoryWarnings, readinessTone } from '../memory-data-mappers'

export default function MemoryOverviewExperience({ onOpenDoctrine }: { onOpenDoctrine: (doctrine: RevenueDoctrine) => void }) {
  const { knowledge, busy, error, refresh } = useKnowledgeMemory()
  const effective = knowledge.doctrines.filter((item) => item.status === 'effective').slice(0, 6)
  const openIssues = knowledge.validationIssues.filter((item) => item.status === 'open').slice(0, 5)
  const activePlaybooks = knowledge.playbooks.filter((item) => item.status === 'effective' || item.status === 'approved').length
  return <div className={`${memoryExperienceStyles.routeShell} space-y-6`} data-memory-route-id="MZ27-MEMORY-ROOT">
    <MemoryHero
      state={error ? 'DEGRADED' : knowledge.storageMode === 'supabase' ? 'LIVE' : 'PREVIEW'}
      posture={knowledge.storageMode === 'supabase' ? 'Mémoire institutionnelle persistée' : 'Référentiel contractuel'}
      authority="Cycle doctrinal gouverné"
      summary={error ? 'La mémoire institutionnelle signale une dégradation. Les actifs restent visibles sans masquer l’incertitude.' : `${knowledge.counters.effectiveDoctrines} doctrine(s) effective(s), ${knowledge.counters.indexedAssets} actif(s) indexé(s) et ${knowledge.counters.criticalIssues} risque(s) critique(s) structurent la confiance institutionnelle.`}
      metrics={[
        { label: 'Doctrine validée', value: knowledge.counters.effectiveDoctrines, note: 'Vérités effectives', tone: 'emerald' },
        { label: 'Preuves vérifiées', value: knowledge.counters.indexedAssets, note: 'Actifs indexés', tone: 'blue' },
        { label: 'Playbooks actifs', value: activePlaybooks, note: 'Cycle autorisé', tone: 'violet' },
        { label: 'Connaissance manquante', value: knowledge.validationIssues.filter((item) => item.status === 'open').length, note: 'Écarts ouverts', tone: knowledge.counters.criticalIssues > 0 ? 'rose' : 'amber' },
      ]}
      actions={[
        { label: busy ? 'Actualisation…' : 'Actualiser la mémoire', onClick: () => void refresh(), disabled: busy, reason: busy ? 'Actualisation déjà en cours.' : undefined, kind: 'primary', icon: RefreshCcw },
        { label: 'Bibliothèque doctrinale', href: '/revenue-command-os/memory-learning/doctrine-library', kind: 'secondary', icon: LibraryBig },
        { label: 'Validation du modèle', href: '/revenue-command-os/memory-learning/model-validation', kind: 'secondary', icon: ShieldCheck },
      ]}
      freshness={knowledge.generatedAt}
      warning={memoryWarnings(knowledge, error)[0]}
    />

    <MemoryLifecycle current="certification" />

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MemoryStat label="Doctrine effective" value={knowledge.counters.effectiveDoctrines} note="Autorité opérationnelle active" tone="emerald" />
      <MemoryStat label="Preuves indexées" value={knowledge.counters.indexedAssets} note="Actifs interrogeables" tone="blue" />
      <MemoryStat label="Approbations ouvertes" value={knowledge.counters.openApprovals} note="Décisions institutionnelles en attente" tone={knowledge.counters.openApprovals ? 'amber' : 'emerald'} />
      <MemoryStat label="Conflits ouverts" value={knowledge.counters.openConflicts} note="Contradictions à arbitrer" tone={knowledge.counters.openConflicts ? 'rose' : 'emerald'} />
    </div>

    <div className="grid gap-5 xl:grid-cols-[1.12fr_.88fr]">
      <MemoryPanel title="Doctrine que le moteur peut appliquer" eyebrow="Autorité active" icon={BookOpenCheck} tone="emerald">
        {effective.length ? <div className="space-y-3">{effective.map((doctrine) => <button key={doctrine.id} type="button" onClick={() => onOpenDoctrine(doctrine)} className="group flex w-full items-start gap-4 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50/35">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white"><BookOpenCheck size={18}/></span>
          <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="text-sm font-black text-slate-950">{doctrine.title}</span><MemoryStatus status={doctrine.status}/></span><span className="mt-1 block text-[11px] font-semibold leading-5 text-slate-700">{doctrine.summary}</span><span className="mt-2 block text-[9px] font-black uppercase tracking-[.1em] text-slate-500">{doctrine.code} · v{doctrine.version} · {doctrine.ownerRole}</span></span>
        </button>)}</div> : <p className="text-sm font-semibold text-slate-700">Aucune doctrine effective. La mémoire est saine mais aucune vérité institutionnelle n’est actuellement activée.</p>}
      </MemoryPanel>

      <MemoryPanel title="Ce qui bloque encore la confiance" eyebrow="Écarts institutionnels" icon={AlertTriangle} tone="amber" dark>
        {openIssues.length ? <div className="space-y-3">{openIssues.map((issue) => <article key={issue.id} className="rounded-2xl border border-white/10 bg-white/[.06] p-4">
          <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2 py-1 text-[8px] font-black uppercase text-amber-100">{issue.severity}</span><span className="text-[9px] font-black text-slate-300">{issue.resourceCode}</span></div>
          <h3 className="mt-2 text-sm font-black text-white">{issue.title}</h3><p className="mt-1 text-[11px] font-semibold leading-5 text-slate-200">{issue.recommendedAction}</p>
        </article>)}</div> : <p className="text-sm font-semibold leading-6 text-slate-200">Aucun écart ouvert. Cette absence est issue du registre de validation courant, pas d’une estimation visuelle.</p>}
      </MemoryPanel>
    </div>

    <div className="grid gap-5 xl:grid-cols-2">
      <MemoryPanel title="Qualité de la mémoire" eyebrow="Readiness institutionnelle" icon={ShieldCheck} tone={readinessTone(knowledge.readiness.overall)}>
        <div className="space-y-5">
          <MemoryProgress label="Couverture doctrinale" value={knowledge.readiness.approvedDoctrineCoverage} tone={readinessTone(knowledge.readiness.approvedDoctrineCoverage)} />
          <MemoryProgress label="Provenance" value={knowledge.readiness.provenanceCoverage} tone={readinessTone(knowledge.readiness.provenanceCoverage)} />
          <MemoryProgress label="Intégrité des versions" value={knowledge.readiness.versionIntegrity} tone={readinessTone(knowledge.readiness.versionIntegrity)} />
          <MemoryProgress label="Sécurité des conflits" value={knowledge.readiness.conflictSafety} tone={readinessTone(knowledge.readiness.conflictSafety)} />
          <MemoryProgress label="Préparation à l’indexation" value={knowledge.readiness.indexingReadiness} tone={readinessTone(knowledge.readiness.indexingReadiness)} />
        </div>
      </MemoryPanel>
      <MemoryPanel title="Pipeline de gouvernance" eyebrow="Cycle d’autorité" icon={Workflow} tone="violet">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{(['draft','in-review','approved','effective'] as const).map((status) => <div key={status} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><MemoryStatus status={status}/><p className="mt-3 text-2xl font-black text-slate-950">{knowledge.doctrines.filter((item) => item.status === status).length}</p><p className="mt-1 text-[10px] font-semibold text-slate-600">ressource(s)</p></div>)}</div>
        <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4"><div className="flex items-start gap-3"><FileCheck2 size={18} className="mt-0.5 text-blue-700"/><p className="text-[11px] font-semibold leading-5 text-blue-950">Une doctrine effective et dans sa période de validité prévaut sur une version approuvée, un brouillon ou un actif sans autorité déclarée.</p></div></div>
      </MemoryPanel>
    </div>

    <MemorySafetyBanner detail={`Mode ${memoryMode(knowledge, error)} : aucune doctrine, preuve, approbation ou décision n’est inventée par la présentation.`} />
  </div>
}

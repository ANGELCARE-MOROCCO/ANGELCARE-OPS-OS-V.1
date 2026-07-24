'use client'

import { Bot, Database, FileClock, ScanSearch, ShieldCheck } from 'lucide-react'
import { useKnowledgeMemory } from '../../KnowledgeMemoryContext'
import { MemoryEmpty, MemoryLifecycle, MemoryPanel, MemoryProgress, MemoryRouteMasthead, MemorySafetyBanner, MemoryStat, MemoryStatus, MemoryTag, memoryExperienceStyles } from '../MemoryExperiencePrimitives'
import { formatMemoryDate, memoryMode, memoryWarnings, readinessTone } from '../memory-data-mappers'

export default function IndexingReadinessExperience() {
  const { knowledge, busy, error, queueIndex } = useKnowledgeMemory()
  const indexed = knowledge.assets.filter((item) => item.indexStatus === 'indexed')
  const queued = knowledge.assets.filter((item) => item.indexStatus === 'queued' || item.indexStatus === 'processing')
  const pending = knowledge.assets.filter((item) => item.indexStatus === 'not-indexed')
  const blocked = knowledge.assets.filter((item) => item.indexStatus === 'blocked' || item.indexStatus === 'failed')
  return <div className={`${memoryExperienceStyles.routeShell} space-y-6`} data-memory-route-id="MZ27-MEMORY-INDEXING-READINESS">
    <MemoryRouteMasthead eyebrow="Laboratoire de préparation" title="Indexation, métadonnées et éligibilité" subtitle="Déterminer si chaque actif est suffisamment structuré, classifié, sourcé, versionné et autorisé avant toute indexation ou recherche sémantique future." concept="Knowledge Indexing Readiness Laboratory" icon={ScanSearch} mode={memoryMode(knowledge, error)} warnings={memoryWarnings(knowledge, error)} freshness={knowledge.generatedAt} authority={`${knowledge.readiness.indexingReadiness}% readiness`} secondary={{ label: 'Actifs & preuves', href: '/revenue-command-os/memory-learning/knowledge-assets' }}>
      <div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-white/[.07] p-4"><p className="text-[9px] font-black uppercase text-slate-200">Indexés</p><p className="mt-2 text-2xl font-black text-white">{indexed.length}</p></div><div className="rounded-2xl border border-white/10 bg-white/[.07] p-4"><p className="text-[9px] font-black uppercase text-slate-200">Bloqués / échecs</p><p className="mt-2 text-2xl font-black text-white">{blocked.length}</p></div></div>
    </MemoryRouteMasthead>
    <MemoryLifecycle current="indexing" />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MemoryStat label="Indexés" value={indexed.length} note="Chunks disponibles" tone="emerald"/><MemoryStat label="En file / traitement" value={queued.length} note="Jobs internes" tone="amber"/><MemoryStat label="À préparer" value={pending.length} note="Contrôles requis" tone="slate"/><MemoryStat label="Bloqués" value={blocked.length} note="Échecs ou confidentialité" tone={blocked.length ? 'rose' : 'emerald'}/></div>

    <div className="grid gap-5 xl:grid-cols-[.72fr_1.28fr]">
      <MemoryPanel title="Readiness institutionnelle" eyebrow="Pas un score décoratif" icon={ShieldCheck} tone={readinessTone(knowledge.readiness.indexingReadiness)}>
        <div className="space-y-5"><MemoryProgress label="Indexation" value={knowledge.readiness.indexingReadiness} tone={readinessTone(knowledge.readiness.indexingReadiness)}/><MemoryProgress label="Provenance" value={knowledge.readiness.provenanceCoverage} tone={readinessTone(knowledge.readiness.provenanceCoverage)}/><MemoryProgress label="Autorité" value={knowledge.readiness.authorityCoverage} tone={readinessTone(knowledge.readiness.authorityCoverage)}/><MemoryProgress label="Versions" value={knowledge.readiness.versionIntegrity} tone={readinessTone(knowledge.readiness.versionIntegrity)}/></div>
        <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4"><div className="flex items-start gap-3"><Bot size={18} className="mt-0.5 text-blue-700"/><p className="text-[11px] font-semibold leading-5 text-blue-950">Les jobs restent des objets internes. Aucun document n’est transmis à OpenAI ou à un fournisseur externe depuis cette interface.</p></div></div>
      </MemoryPanel>
      <MemoryPanel title="Registre d’éligibilité" eyebrow="Actif par actif" icon={Database} tone="blue">
        {knowledge.assets.length ? <div className="space-y-3">{knowledge.assets.map((asset) => {
          const eligible = asset.indexStatus === 'not-indexed' && ['approved','effective'].includes(asset.status) && asset.confidentiality !== 'restricted'
          const reason = asset.confidentiality === 'restricted' ? 'Confidentialité restreinte.' : !['approved','effective'].includes(asset.status) ? 'Actif non approuvé ou non effectif.' : asset.indexStatus !== 'not-indexed' ? `État actuel : ${asset.indexStatus}.` : undefined
          return <div key={asset.id} className="grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1fr_auto_170px] lg:items-center"><div><div className="flex flex-wrap items-center gap-2"><MemoryStatus status={asset.status}/><MemoryStatus status={asset.indexStatus}/><MemoryTag>{asset.confidentiality}</MemoryTag></div><h3 className="mt-3 text-sm font-black text-slate-950">{asset.title}</h3><p className="mt-1 text-[10px] font-semibold text-slate-600">{asset.code} · v{asset.version} · {asset.ownerRole}</p><p className="mt-2 text-[10px] font-semibold text-slate-700">{reason || 'Éligible à une mise en file interne.'}</p></div><div className="text-right"><p className="text-[8px] font-black uppercase text-slate-500">Chunks</p><p className="mt-1 text-xl font-black text-slate-950">{asset.chunkCount}</p></div><button type="button" disabled={busy || !eligible} title={!eligible ? reason : undefined} onClick={() => void queueIndex(asset.id)} className="rounded-xl bg-slate-950 px-3 py-2.5 text-[9px] font-black text-white disabled:cursor-not-allowed disabled:opacity-40">{eligible ? 'Mettre en file' : 'Action indisponible'}</button></div>
        })}</div> : <MemoryEmpty title="Aucun actif à évaluer" description="Aucun actif n’est disponible. La readiness reste non calculée à partir de données absentes." />}
      </MemoryPanel>
    </div>

    <MemoryPanel title="Journal des jobs" eyebrow="Traitement interne et traçable" icon={FileClock} tone="amber">
      {knowledge.indexJobs.length ? <div className="overflow-x-auto"><table className="min-w-full text-left"><thead><tr className="border-b border-slate-200 text-[9px] font-black uppercase tracking-[.1em] text-slate-600"><th className="px-3 py-3">Job</th><th className="px-3 py-3">Actif</th><th className="px-3 py-3">État</th><th className="px-3 py-3">Demandé</th><th className="px-3 py-3">Terminé</th><th className="px-3 py-3">Chunks</th></tr></thead><tbody>{knowledge.indexJobs.map((job) => <tr key={job.id} className="border-b border-slate-100 text-xs last:border-0"><td className="px-3 py-4 font-black text-slate-950">{job.code}</td><td className="px-3 py-4 font-semibold text-slate-700">{job.assetCode}</td><td className="px-3 py-4"><MemoryStatus status={job.status}/></td><td className="px-3 py-4 font-semibold text-slate-700">{formatMemoryDate(job.requestedAt)}</td><td className="px-3 py-4 font-semibold text-slate-700">{formatMemoryDate(job.completedAt)}</td><td className="px-3 py-4 font-black text-slate-950">{job.chunkCount}</td></tr>)}</tbody></table></div> : <MemoryEmpty title="Aucun job d’indexation" description="Aucun traitement interne n’a été demandé ou enregistré." />}
    </MemoryPanel>
    <MemorySafetyBanner detail="L’indexation reste contrôlée, auditable et interne. Une confidentialité restreinte ou une autorité insuffisante verrouille l’action avec une raison visible." />
  </div>
}

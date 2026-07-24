'use client'

import { useMemo, useState } from 'react'
import { Database, FileCheck2, Files, Fingerprint, Search } from 'lucide-react'
import { useKnowledgeMemory } from '../../KnowledgeMemoryContext'
import { MemoryEmpty, MemoryLifecycle, MemoryPanel, MemoryRouteMasthead, MemorySafetyBanner, MemoryStat, MemoryStatus, MemoryTag, memoryExperienceStyles } from '../MemoryExperiencePrimitives'
import { formatMemoryDate, memoryMode, memoryWarnings } from '../memory-data-mappers'

export default function KnowledgeAssetsExperience() {
  const { knowledge, busy, error, queueIndex } = useKnowledgeMemory()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const assets = useMemo(() => knowledge.assets.filter((asset) => (filter === 'all' || asset.indexStatus === filter) && `${asset.code} ${asset.title} ${asset.description} ${asset.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())), [knowledge.assets, query, filter])
  const verified = knowledge.assets.filter((asset) => asset.status === 'approved' || asset.status === 'effective').length
  const missingChecksum = knowledge.assets.filter((asset) => !asset.checksum).length

  return <div className={`${memoryExperienceStyles.routeShell} space-y-6`} data-memory-route-id="MZ27-MEMORY-KNOWLEDGE-ASSETS">
    <MemoryRouteMasthead eyebrow="Registre des preuves" title="Actifs, sources et pièces d’autorité" subtitle="Chaque ressource est classifiée, versionnée, reliée à ses doctrines et préparée pour une réutilisation institutionnelle contrôlée." concept="Evidence & Knowledge Asset Registry" icon={Files} mode={memoryMode(knowledge, error)} warnings={memoryWarnings(knowledge, error)} freshness={knowledge.generatedAt} authority={`${knowledge.assets.length} actif(s)`} secondary={{ label: 'Versions & provenance', href: '/revenue-command-os/memory-learning/versions-provenance' }}>
      <div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-white/[.07] p-4"><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-200">Approuvés / effectifs</p><p className="mt-2 text-2xl font-black text-white">{verified}</p></div><div className="rounded-2xl border border-white/10 bg-white/[.07] p-4"><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-200">Empreinte absente</p><p className="mt-2 text-2xl font-black text-white">{missingChecksum}</p></div></div>
    </MemoryRouteMasthead>
    <MemoryLifecycle current="evidence" />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MemoryStat label="Actifs totaux" value={knowledge.assets.length} note="Documents et preuves enregistrés" tone="blue"/><MemoryStat label="Indexés" value={knowledge.counters.indexedAssets} note="Chunks disponibles" tone="emerald"/><MemoryStat label="En file" value={knowledge.assets.filter((asset) => asset.indexStatus === 'queued').length} note="Traitement futur contrôlé" tone="amber"/><MemoryStat label="Provenance" value={`${knowledge.readiness.provenanceCoverage}%`} note="Source et propriétaire identifiés" tone={knowledge.readiness.provenanceCoverage >= 80 ? 'emerald' : 'amber'}/></div>

    <MemoryPanel title="Catalogue probatoire" eyebrow="Recherche, état et confidentialité" icon={Database} tone="blue">
      <div className="flex flex-col gap-3 lg:flex-row"><label className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><Search size={16} className="text-slate-500"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Code, titre, type, tag ou doctrine liée…" className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-500"/></label><div className="flex gap-2 overflow-x-auto">{['all','indexed','queued','processing','not-indexed','failed','blocked'].map((status) => <button key={status} onClick={() => setFilter(status)} type="button" className={`shrink-0 rounded-xl px-3 py-2 text-[9px] font-black uppercase ${filter === status ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>{status === 'all' ? 'Tous' : status}</button>)}</div></div>
    </MemoryPanel>

    {assets.length ? <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{assets.map((asset) => {
      const canQueue = asset.indexStatus === 'not-indexed' && ['approved','effective'].includes(asset.status) && asset.confidentiality !== 'restricted'
      return <article key={asset.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,.05)]">
        <div className="flex items-start justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-800"><FileCheck2 size={19}/></span><div className="flex flex-wrap justify-end gap-2"><MemoryStatus status={asset.status}/><MemoryStatus status={asset.indexStatus}/></div></div>
        <p className="mt-4 text-[9px] font-black uppercase tracking-[.13em] text-slate-600">{asset.code} · {asset.assetType}</p><h2 className="mt-2 text-lg font-black text-slate-950">{asset.title}</h2><p className="mt-2 text-xs font-semibold leading-5 text-slate-700">{asset.description}</p>
        <div className="mt-4 grid grid-cols-2 gap-2"><Info label="Version" value={asset.version}/><Info label="Confidentialité" value={asset.confidentiality}/><Info label="Propriétaire" value={asset.ownerRole}/><Info label="Mise à jour" value={formatMemoryDate(asset.updatedAt)}/></div>
        <div className="mt-4 flex flex-wrap gap-2">{asset.linkedDoctrineCodes.slice(0, 4).map((code) => <MemoryTag key={code} tone="emerald">{code}</MemoryTag>)}{asset.linkedDoctrineCodes.length === 0 ? <MemoryTag tone="amber">Doctrine non reliée</MemoryTag> : null}</div>
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><div><p className="text-[8px] font-black uppercase text-slate-500">Empreinte</p><p className="mt-1 font-mono text-[10px] font-bold text-slate-800">{asset.checksum ? `${asset.checksum.slice(0, 12)}…` : 'Indisponible'}</p></div>{canQueue ? <button type="button" onClick={() => void queueIndex(asset.id)} disabled={busy} className="rounded-xl bg-slate-950 px-3 py-2 text-[9px] font-black text-white disabled:opacity-45">Mettre en file</button> : <span title={asset.confidentiality === 'restricted' ? 'Confidentialité restreinte.' : 'Statut ou indexation non éligible.'} className="rounded-xl bg-slate-100 px-3 py-2 text-[9px] font-black text-slate-600">{asset.chunkCount} chunks</span>}</div>
      </article>
    })}</div> : <MemoryEmpty title="Aucun actif correspondant" description="Le registre reste disponible. Modifiez les filtres ou vérifiez si la source est encore en synchronisation." />}

    <MemoryPanel title="Contrôles d’intégrité" eyebrow="Preuve avant indexation" icon={Fingerprint} tone="violet">
      <div className="grid gap-3 md:grid-cols-3"><Control label="Autorité déclarée" value={`${knowledge.readiness.authorityCoverage}%`} ok={knowledge.readiness.authorityCoverage >= 80}/><Control label="Provenance couverte" value={`${knowledge.readiness.provenanceCoverage}%`} ok={knowledge.readiness.provenanceCoverage >= 80}/><Control label="Versions cohérentes" value={`${knowledge.readiness.versionIntegrity}%`} ok={knowledge.readiness.versionIntegrity >= 80}/></div>
    </MemoryPanel>
    <MemorySafetyBanner detail="Aucune preuve n’est marquée vérifiée par le design seul. Le statut, la provenance, l’empreinte et l’autorité restent issus du registre réel." />
  </div>
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-slate-50 p-3"><p className="text-[8px] font-black uppercase text-slate-500">{label}</p><p className="mt-1 break-words text-[10px] font-black text-slate-900">{value}</p></div> }
function Control({ label, value, ok }: { label: string; value: string; ok: boolean }) { return <div className={`rounded-2xl border p-4 ${ok ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}><p className="text-[9px] font-black uppercase text-slate-600">{label}</p><p className="mt-2 text-xl font-black text-slate-950">{value}</p></div> }

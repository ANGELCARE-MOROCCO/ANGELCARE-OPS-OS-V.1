'use client'

import { useMemo, useState } from 'react'
import { BookCopy, LibraryBig, Plus, Search, ShieldCheck } from 'lucide-react'
import type { RevenueDoctrine } from '@/lib/revenue-command-os/types'
import { REVENUE_KNOWLEDGE_TYPE_LABELS } from '@/lib/revenue-command-os/knowledge-memory/constants'
import { useKnowledgeMemory } from '../../KnowledgeMemoryContext'
import { MemoryEmpty, MemoryLifecycle, MemoryPanel, MemoryRouteMasthead, MemorySafetyBanner, MemoryStatus, MemoryTag, memoryExperienceStyles } from '../MemoryExperiencePrimitives'
import { memoryMode, memoryWarnings, statusLabel } from '../memory-data-mappers'

export default function DoctrineLibraryExperience({ onOpenDoctrine }: { onOpenDoctrine: (doctrine: RevenueDoctrine) => void }) {
  const { knowledge, busy, error, mutateDoctrine } = useKnowledgeMemory()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const rows = useMemo(() => knowledge.doctrines.filter((doctrine) => (filter === 'all' || doctrine.status === filter) && `${doctrine.code} ${doctrine.title} ${doctrine.summary} ${doctrine.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())), [knowledge.doctrines, query, filter])

  async function createDoctrine() {
    const title = window.prompt('Titre de la nouvelle doctrine')
    if (!title) return
    await mutateDoctrine({ operation: 'create', payload: { code: `REV-MANUAL-${Date.now()}`, title, summary: 'Nouvelle doctrine à compléter et soumettre à validation.', knowledgeType: 'commercial-doctrine', ownerRole: 'Revenue Knowledge Owner', department: 'Revenue Strategy', businessUnitCodes: [], confidentiality: 'internal', reviewCycleDays: 90, applicableCommandFamilies: [], applicableSegmentCodes: [], applicableOfferCodes: [], tags: ['manual'], sourceAuthority: 'À valider', contentBlocks: [], rules: [], evidenceRefs: [] } })
  }

  return <div className={`${memoryExperienceStyles.routeShell} space-y-6`} data-memory-route-id="MZ27-MEMORY-DOCTRINE-LIBRARY">
    <MemoryRouteMasthead eyebrow="Bibliothèque institutionnelle" title="Doctrines gouvernées" subtitle="Rechercher, inspecter, versionner et faire progresser chaque doctrine selon une autorité, une preuve et un cycle de vie explicites." concept="Institutional Doctrine Library" icon={LibraryBig} mode={memoryMode(knowledge, error)} warnings={memoryWarnings(knowledge, error)} freshness={knowledge.generatedAt} authority={`${knowledge.counters.effectiveDoctrines} effective(s)`} primary={{ label: busy ? 'Traitement…' : 'Nouvelle doctrine', onClick: () => void createDoctrine(), disabled: busy, reason: busy ? 'Une opération est déjà en cours.' : undefined }} secondary={{ label: 'Bureau d’approbation', href: '/revenue-command-os/memory-learning/approval-desk' }}>
      <div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-white/[.07] p-4"><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-200">Approuvées</p><p className="mt-2 text-2xl font-black text-white">{knowledge.counters.approvedDoctrines}</p></div><div className="rounded-2xl border border-white/10 bg-white/[.07] p-4"><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-200">Brouillons</p><p className="mt-2 text-2xl font-black text-white">{knowledge.counters.draftDoctrines}</p></div></div>
    </MemoryRouteMasthead>
    <MemoryLifecycle current="capture" />

    <MemoryPanel title="Registre canonique" eyebrow="Recherche et autorité" icon={BookCopy} tone="emerald">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><Search size={16} className="text-slate-500"/><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-500" placeholder="Code, titre, domaine, tag ou autorité…" /></label>
        <div className="flex gap-2 overflow-x-auto">{['all','draft','in-review','approved','effective','suspended','retired'].map((status) => <button key={status} type="button" onClick={() => setFilter(status)} className={`shrink-0 rounded-xl px-3 py-2 text-[9px] font-black uppercase ${filter === status ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>{status === 'all' ? 'Tous' : statusLabel(status)}</button>)}</div>
      </div>
    </MemoryPanel>

    {rows.length ? <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{rows.map((doctrine) => <button key={doctrine.id} type="button" onClick={() => onOpenDoctrine(doctrine)} className="group rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-[0_18px_55px_rgba(15,23,42,.055)] transition hover:-translate-y-0.5 hover:border-emerald-300">
      <div className="flex items-start justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-800"><BookCopy size={19}/></span><div className="flex flex-wrap justify-end gap-2"><MemoryStatus status={doctrine.status}/><MemoryTag>v{doctrine.version}</MemoryTag></div></div>
      <p className="mt-4 text-[9px] font-black uppercase tracking-[.14em] text-slate-600">{doctrine.code} · {REVENUE_KNOWLEDGE_TYPE_LABELS[doctrine.knowledgeType]}</p>
      <h2 className="mt-2 text-lg font-black tracking-[-.025em] text-slate-950">{doctrine.title}</h2><p className="mt-2 line-clamp-3 text-xs font-semibold leading-5 text-slate-700">{doctrine.summary}</p>
      <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[8px] font-black uppercase text-slate-500">Autorité</p><p className="mt-1 text-[10px] font-black text-slate-900">{doctrine.ownerRole}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[8px] font-black uppercase text-slate-500">Preuves</p><p className="mt-1 text-[10px] font-black text-slate-900">{doctrine.evidenceRefs.length || 'Aucune'}</p></div></div>
    </button>)}</div> : <MemoryEmpty title="Aucune doctrine correspondant aux filtres" description="Le registre reste sain. Retirez un filtre ou créez une doctrine si le workflow et vos permissions le permettent." />}

    <MemorySafetyBanner detail="Une doctrine n’acquiert aucune autorité par sa seule présence visuelle : son statut, sa version, ses preuves et sa période d’effet restent déterminants." />
  </div>
}

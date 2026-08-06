'use client'

import { useMemo, useState } from 'react'
import { Archive, BookOpenCheck, CheckCircle2, FileWarning, History, Rocket, Search } from 'lucide-react'
import { useKnowledgeMemory } from '../../KnowledgeMemoryContext'
import { MemoryEmpty, MemoryLifecycle, MemoryPanel, MemoryRouteMasthead, MemorySafetyBanner, MemoryStat, MemoryStatus, MemoryTag, memoryExperienceStyles } from '../MemoryExperiencePrimitives'
import { memoryMode, memoryWarnings } from '../memory-data-mappers'

export default function ApprovalDeskExperience() {
  const { knowledge, busy, error, mutateDoctrine } = useKnowledgeMemory()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const doctrines = useMemo(() => knowledge.doctrines.filter((item) => {
    const matchesQuery = !query.trim() || `${item.code} ${item.title} ${item.summary} ${item.ownerRole}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (filter === 'all' || item.status === filter)
  }), [knowledge.doctrines, query, filter])

  async function publish(id: string) {
    await mutateDoctrine({ operation: 'activate', id, payload: { advisoryOnly: true, requiredPublications: [], prohibitedActions: [], changeReason: 'Publication directe par opérateur Revenue OS' } })
  }

  async function archive(id: string) {
    await mutateDoctrine({ operation: 'retire', id, payload: { advisoryOnly: true, changeReason: 'Archivage direct par opérateur Revenue OS' } })
  }

  return <div className={`${memoryExperienceStyles.routeShell} space-y-6`} data-memory-route-id="MZ27-MEMORY-PUBLICATION-DESK">
    <MemoryRouteMasthead eyebrow="Publication doctrinale" title="Bureau de publication" subtitle="Publier, activer et archiver directement les doctrines. Les points de qualité restent visibles comme informations et ne désactivent aucune action." concept="Doctrine Publication Desk" icon={BookOpenCheck} mode={memoryMode(knowledge, error)} warnings={memoryWarnings(knowledge, error)} freshness={knowledge.generatedAt} authority={`${knowledge.doctrines.length} doctrine(s)`} secondary={{ label: 'Résoudre les conflits', href: '/revenue-command-os/memory-learning/conflict-resolver' }}>
      <div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-white/[.07] p-4"><p className="text-[9px] font-black uppercase text-slate-200">Publiées</p><p className="mt-2 text-2xl font-black text-white">{knowledge.doctrines.filter((item) => item.status === 'effective').length}</p></div><div className="rounded-2xl border border-white/10 bg-white/[.07] p-4"><p className="text-[9px] font-black uppercase text-slate-200">À travailler</p><p className="mt-2 text-2xl font-black text-white">{knowledge.doctrines.filter((item) => item.status === 'draft' || item.status === 'in-review').length}</p></div></div>
    </MemoryRouteMasthead>
    <MemoryLifecycle current="versioning" />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MemoryStat label="Brouillons" value={knowledge.doctrines.filter((item) => item.status === 'draft').length} note="Éditables et publiables" tone="slate"/><MemoryStat label="En préparation" value={knowledge.doctrines.filter((item) => item.status === 'in-review').length} note="Publication directe possible" tone="amber"/><MemoryStat label="Publiées" value={knowledge.doctrines.filter((item) => item.status === 'effective').length} note="Utilisables comme conseil" tone="emerald"/><MemoryStat label="Archivées" value={knowledge.doctrines.filter((item) => item.status === 'retired').length} note="Historique conservé" tone="violet"/></div>

    <MemoryPanel title="Portefeuille de publication" eyebrow="Action directe" icon={Rocket} tone="emerald" action={<div className="flex flex-wrap gap-2">{['all','draft','in-review','effective','retired'].map((status) => <button key={status} type="button" onClick={() => setFilter(status)} className={`rounded-xl px-3 py-2 text-[9px] font-black uppercase ${filter === status ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>{status === 'all' ? 'Toutes' : status}</button>)}</div>}>
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><Search size={16} className="text-slate-400"/><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none" placeholder="Rechercher une doctrine, un code, un propriétaire…"/></div>
      <p className="mt-3 text-xs font-semibold leading-5 text-slate-700">Les contrôles incomplets sont affichés comme avertissements documentaires. Un opérateur authentifié peut publier immédiatement et l’opération est automatiquement tracée.</p>
    </MemoryPanel>

    {doctrines.length ? <div className="grid gap-4 xl:grid-cols-2">{doctrines.map((doctrine) => {
      const relatedIssues = knowledge.validationIssues.filter((issue) => issue.resourceCode === doctrine.code && issue.status === 'open')
      return <article key={doctrine.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,.055)]">
        <div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><MemoryStatus status={doctrine.status}/><MemoryTag tone="blue">v{doctrine.version}</MemoryTag><MemoryTag>{doctrine.knowledgeType}</MemoryTag></div><p className="mt-4 text-[9px] font-black uppercase tracking-[.13em] text-emerald-700">{doctrine.code}</p><h2 className="mt-2 text-lg font-black text-slate-950">{doctrine.title}</h2><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-700">{doctrine.summary}</p></div><div className="rounded-2xl bg-slate-50 p-3 text-center"><History size={16} className="mx-auto text-slate-500"/><p className="mt-2 text-[9px] font-black text-slate-900">{doctrine.ownerRole}</p></div></div>
        {relatedIssues.length ? <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-center gap-2"><FileWarning size={16} className="text-amber-700"/><p className="text-[10px] font-black text-amber-950">{relatedIssues.length} point(s) de qualité à connaître</p></div><div className="mt-2 space-y-1">{relatedIssues.slice(0, 3).map((issue) => <p key={issue.id} className="text-[10px] font-semibold text-amber-900">• {issue.title}</p>)}</div><p className="mt-2 text-[9px] font-bold text-amber-800">Ces points n’empêchent pas la publication.</p></div> : <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-[10px] font-black text-emerald-800"><CheckCircle2 size={15}/>Aucun point de qualité ouvert.</div>}
        <div className="mt-5 flex flex-wrap gap-2">
          {doctrine.status !== 'effective' ? <button type="button" onClick={() => void publish(doctrine.id)} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-[10px] font-black text-white disabled:opacity-45"><Rocket size={14}/>Publier maintenant</button> : null}
          {doctrine.status !== 'retired' ? <button type="button" onClick={() => void archive(doctrine.id)} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-[10px] font-black text-slate-700 disabled:opacity-45"><Archive size={14}/>Archiver</button> : null}
        </div>
      </article>
    })}</div> : <MemoryEmpty title="Aucune doctrine dans cette vue" description="Changez le filtre ou créez une doctrine depuis la bibliothèque doctrinale." />}
    <MemorySafetyBanner detail="Publication directe en environnement LIVE. Les doctrines conseillent, documentent et expliquent sans interrompre les opérations Revenue OS." />
  </div>
}

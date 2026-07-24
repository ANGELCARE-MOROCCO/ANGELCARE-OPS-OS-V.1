'use client'

import { useMemo, useState } from 'react'
import { MessageCircleQuestion, MessagesSquare, Search, ShieldAlert } from 'lucide-react'
import { useKnowledgeMemory } from '../../KnowledgeMemoryContext'
import { MemoryEmpty, MemoryLifecycle, MemoryPanel, MemoryRouteMasthead, MemorySafetyBanner, MemoryStat, MemoryStatus, MemoryTag, memoryExperienceStyles } from '../MemoryExperiencePrimitives'
import { memoryMode, memoryWarnings } from '../memory-data-mappers'

export default function ScriptsObjectionsExperience() {
  const { knowledge, error } = useKnowledgeMemory()
  const [view, setView] = useState<'scripts' | 'objections'>('scripts')
  const [query, setQuery] = useState('')
  const scripts = useMemo(() => knowledge.scripts.filter((item) => `${item.code} ${item.name} ${item.objective} ${item.channel}`.toLowerCase().includes(query.toLowerCase())), [knowledge.scripts, query])
  const objections = useMemo(() => knowledge.objections.filter((item) => `${item.code} ${item.objection} ${item.category} ${item.responseFramework.join(' ')}`.toLowerCase().includes(query.toLowerCase())), [knowledge.objections, query])
  const approvedScripts = knowledge.scripts.filter((item) => item.status === 'approved' || item.status === 'effective').length
  const approvedObjections = knowledge.objections.filter((item) => item.status === 'approved' || item.status === 'effective').length

  return <div className={`${memoryExperienceStyles.routeShell} space-y-6`} data-memory-route-id="MZ27-MEMORY-SCRIPTS-OBJECTIONS">
    <MemoryRouteMasthead eyebrow="Doctrine conversationnelle" title="Scripts, objections et réponses autorisées" subtitle="Structurer les ouvertures, diagnostics, preuves, appels à l’action et réponses interdites sans transformer une suggestion en promesse non autorisée." concept="Commercial Response Doctrine Studio" icon={MessagesSquare} mode={memoryMode(knowledge, error)} warnings={memoryWarnings(knowledge, error)} freshness={knowledge.generatedAt} authority={`${approvedScripts} script(s) approuvé(s)`} secondary={{ label: 'Règles & restrictions', href: '/revenue-command-os/memory-learning/rules-restrictions' }}>
      <div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-white/[.07] p-4"><p className="text-[9px] font-black uppercase text-slate-200">Scripts utilisables</p><p className="mt-2 text-2xl font-black text-white">{approvedScripts}</p></div><div className="rounded-2xl border border-white/10 bg-white/[.07] p-4"><p className="text-[9px] font-black uppercase text-slate-200">Objections validées</p><p className="mt-2 text-2xl font-black text-white">{approvedObjections}</p></div></div>
    </MemoryRouteMasthead>
    <MemoryLifecycle current="review" />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MemoryStat label="Scripts" value={knowledge.scripts.length} note="Canaux et étapes couverts" tone="blue"/><MemoryStat label="Objections" value={knowledge.objections.length} note="Patterns de diagnostic" tone="violet"/><MemoryStat label="Promesses interdites" value={knowledge.scripts.reduce((sum, item) => sum + item.prohibitedClaims.length, 0)} note="Claims explicitement bloqués" tone="rose"/><MemoryStat label="Preuves liées" value={knowledge.objections.reduce((sum, item) => sum + item.evidenceRefs.length, 0)} note="Références probatoires" tone="emerald"/></div>

    <MemoryPanel title="Studio de réponse" eyebrow="Sélection et recherche" icon={MessageCircleQuestion} tone="violet">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center"><div className="flex gap-2"><button type="button" onClick={() => setView('scripts')} className={`rounded-xl px-4 py-2.5 text-[10px] font-black ${view === 'scripts' ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>Scripts approuvés</button><button type="button" onClick={() => setView('objections')} className={`rounded-xl px-4 py-2.5 text-[10px] font-black ${view === 'objections' ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>Objections & diagnostics</button></div><label className="flex flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><Search size={16} className="text-slate-500"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Code, canal, objectif, objection ou réponse…" className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-500"/></label></div>
    </MemoryPanel>

    {view === 'scripts' ? scripts.length ? <div className="grid gap-4 xl:grid-cols-2">{scripts.map((script) => <article key={script.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,.05)]">
      <div className="flex items-start justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-800"><MessagesSquare size={19}/></span><div className="flex flex-wrap justify-end gap-2"><MemoryStatus status={script.status}/><MemoryTag tone="blue">{script.channel}</MemoryTag><MemoryTag>{script.stage}</MemoryTag></div></div>
      <p className="mt-4 text-[9px] font-black uppercase tracking-[.13em] text-slate-600">{script.code} · v{script.version}</p><h2 className="mt-2 text-lg font-black text-slate-950">{script.name}</h2><p className="mt-2 text-xs font-semibold leading-5 text-slate-700">{script.objective}</p>
      <div className="mt-4 space-y-3"><ScriptBlock label="Ouverture" value={script.opening}/><ScriptBlock label="Corps gouverné" value={script.body}/><ScriptBlock label="Appel à l’action" value={script.callToAction}/><ScriptBlock label="Route de repli" value={script.fallback}/></div>
      <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4"><p className="text-[9px] font-black uppercase text-rose-800">Claims interdits</p>{script.prohibitedClaims.length ? <ul className="mt-2 space-y-1">{script.prohibitedClaims.map((claim) => <li key={claim} className="text-[11px] font-semibold leading-5 text-rose-950">• {claim}</li>)}</ul> : <p className="mt-2 text-[11px] font-semibold text-rose-900">Aucun claim interdit déclaré.</p>}</div>
    </article>)}</div> : <MemoryEmpty title="Aucun script correspondant" description="Le registre reste disponible. Ajustez la recherche ou vérifiez l’état de synchronisation." /> : objections.length ? <div className="grid gap-4 xl:grid-cols-2">{objections.map((objection) => <article key={objection.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,.05)]">
      <div className="flex items-start justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-50 text-violet-800"><MessageCircleQuestion size={19}/></span><div className="flex flex-wrap justify-end gap-2"><MemoryStatus status={objection.status}/><MemoryTag tone="violet">{objection.category}</MemoryTag></div></div>
      <p className="mt-4 text-[9px] font-black uppercase tracking-[.13em] text-slate-600">{objection.code}</p><h2 className="mt-2 text-lg font-black text-slate-950">{objection.objection}</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2"><ListBlock title="Questions de diagnostic" items={objection.diagnosticQuestions}/><ListBlock title="Cadre de réponse" items={objection.responseFramework}/></div>
      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4"><div className="flex items-start gap-3"><ShieldAlert size={17} className="mt-0.5 shrink-0 text-amber-700"/><div><p className="text-[9px] font-black uppercase text-amber-800">Escalade</p><p className="mt-1 text-[11px] font-semibold leading-5 text-amber-950">{objection.escalationTrigger}</p><p className="mt-3 text-[9px] font-black uppercase text-rose-800">Réponse interdite</p><p className="mt-1 text-[11px] font-semibold leading-5 text-rose-950">{objection.prohibitedResponse}</p></div></div></div>
    </article>)}</div> : <MemoryEmpty title="Aucune objection correspondante" description="Aucun pattern de diagnostic ne correspond à la recherche actuelle." />}

    <MemorySafetyBanner detail="Les scripts restent des actifs gouvernés. Aucun message, appel, proposition ou engagement externe n’est émis depuis cette page." />
  </div>
}

function ScriptBlock({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[9px] font-black uppercase text-slate-600">{label}</p><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-800">{value}</p></div> }
function ListBlock({ title, items }: { title: string; items: string[] }) { return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[9px] font-black uppercase text-slate-600">{title}</p><ul className="mt-3 space-y-2">{items.length ? items.map((item) => <li key={item} className="text-[11px] font-semibold leading-5 text-slate-800">• {item}</li>) : <li className="text-[11px] font-semibold text-slate-600">Non défini</li>}</ul></div> }

'use client'

import { useState } from 'react'
import { BookOpenCheck, FlaskConical, Network, Target } from 'lucide-react'
import { useKnowledgeMemory } from '../../KnowledgeMemoryContext'
import { MemoryEmpty, MemoryLifecycle, MemoryPanel, MemoryRouteMasthead, MemorySafetyBanner, MemoryStat, MemoryStatus, MemoryTag, memoryExperienceStyles } from '../MemoryExperiencePrimitives'
import { memoryMode, memoryWarnings } from '../memory-data-mappers'

export default function CasesPatternsExperience() {
  const { knowledge, error } = useKnowledgeMemory()
  const [view, setView] = useState<'cases' | 'patterns'>('cases')
  const reusable = knowledge.cases.filter((item) => item.status === 'approved' || item.status === 'effective').length
  const activePatterns = knowledge.campaignPatterns.filter((item) => item.status === 'approved' || item.status === 'effective').length
  return <div className={`${memoryExperienceStyles.routeShell} space-y-6`} data-memory-route-id="MZ27-MEMORY-CASES-PATTERNS">
    <MemoryRouteMasthead eyebrow="Intelligence de cas" title="Cas, résultats et patterns réutilisables" subtitle="Distinguer les faits observés, les leçons, les signaux mesurables et les patterns validés sans élever une simple corrélation au rang de doctrine." concept="Case Intelligence & Pattern Library" icon={BookOpenCheck} mode={memoryMode(knowledge, error)} warnings={memoryWarnings(knowledge, error)} freshness={knowledge.generatedAt} authority={`${reusable} cas validé(s)`} secondary={{ label: 'Bibliothèque doctrinale', href: '/revenue-command-os/memory-learning/doctrine-library' }}>
      <div className="grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-white/[.07] p-4"><p className="text-[9px] font-black uppercase text-slate-200">Cas réutilisables</p><p className="mt-2 text-2xl font-black text-white">{reusable}</p></div><div className="rounded-2xl border border-white/10 bg-white/[.07] p-4"><p className="text-[9px] font-black uppercase text-slate-200">Patterns actifs</p><p className="mt-2 text-2xl font-black text-white">{activePatterns}</p></div></div>
    </MemoryRouteMasthead>
    <MemoryLifecycle current="evidence" />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MemoryStat label="Études de cas" value={knowledge.cases.length} note="Succès, échecs, reprises, tests" tone="blue"/><MemoryStat label="Patterns campagne" value={knowledge.campaignPatterns.length} note="Séquences réutilisables" tone="violet"/><MemoryStat label="Preuves liées" value={knowledge.cases.reduce((sum, item) => sum + item.evidenceRefs.length, 0)} note="Références disponibles" tone="emerald"/><MemoryStat label="Non validés" value={knowledge.cases.filter((item) => !['approved','effective'].includes(item.status)).length} note="Ne pas traiter comme doctrine" tone="amber"/></div>

    <MemoryPanel title="Galerie d’apprentissage" eyebrow="Faits versus patterns" icon={Network} tone="blue" action={<div className="flex gap-2"><button type="button" onClick={() => setView('cases')} className={`rounded-xl px-3 py-2 text-[9px] font-black ${view === 'cases' ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>Cas</button><button type="button" onClick={() => setView('patterns')} className={`rounded-xl px-3 py-2 text-[9px] font-black ${view === 'patterns' ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>Patterns</button></div>}>
      <p className="text-xs font-semibold leading-5 text-slate-700">Chaque cas conserve son contexte, ses actions et son résultat. Un pattern reste une structure réutilisable, jamais une preuve universelle.</p>
    </MemoryPanel>

    {view === 'cases' ? knowledge.cases.length ? <div className="grid gap-4 xl:grid-cols-2">{knowledge.cases.map((item) => <article key={item.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,.05)]">
      <div className="flex items-start justify-between gap-3"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${item.caseType === 'success' ? 'bg-emerald-50 text-emerald-800' : item.caseType === 'failure' ? 'bg-rose-50 text-rose-800' : 'bg-blue-50 text-blue-800'}`}><FlaskConical size={19}/></span><div className="flex flex-wrap justify-end gap-2"><MemoryStatus status={item.status}/><MemoryTag tone={item.caseType === 'success' ? 'emerald' : item.caseType === 'failure' ? 'rose' : 'blue'}>{item.caseType}</MemoryTag><MemoryTag>{item.confidentiality}</MemoryTag></div></div>
      <p className="mt-4 text-[9px] font-black uppercase tracking-[.13em] text-slate-600">{item.code} · {item.businessUnitCode} · {item.marketCode}</p><h2 className="mt-2 text-lg font-black text-slate-950">{item.title}</h2>
      <div className="mt-4 grid gap-3"><CaseBlock label="Contexte" value={item.context}/><CaseBlock label="Problème" value={item.problem}/><CaseBlock label="Résultat" value={item.outcome}/></div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2"><ListBlock title="Actions observées" items={item.actions}/><ListBlock title="Leçons" items={item.lessons}/></div>
      <div className="mt-4 flex flex-wrap gap-2">{Object.entries(item.measurableSignals).map(([key, value]) => <MemoryTag key={key} tone="blue">{key}: {String(value)}</MemoryTag>)}</div>
    </article>)}</div> : <MemoryEmpty title="Aucun cas enregistré" description="La bibliothèque est vide. Aucun apprentissage n’est déduit ou inventé." /> : knowledge.campaignPatterns.length ? <div className="grid gap-4 xl:grid-cols-2">{knowledge.campaignPatterns.map((pattern) => <article key={pattern.id} className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,.05)]">
      <div className="flex items-start justify-between gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-violet-50 text-violet-800"><Target size={19}/></span><div className="flex flex-wrap justify-end gap-2"><MemoryStatus status={pattern.status}/><MemoryTag tone="violet">{pattern.patternType}</MemoryTag><MemoryTag>v{pattern.version}</MemoryTag></div></div>
      <p className="mt-4 text-[9px] font-black uppercase tracking-[.13em] text-slate-600">{pattern.code}</p><h2 className="mt-2 text-lg font-black text-slate-950">{pattern.name}</h2><p className="mt-2 text-xs font-semibold leading-5 text-slate-700">{pattern.objective}</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-2"><ListBlock title="Séquence" items={pattern.sequence}/><ListBlock title="Signaux requis" items={pattern.requiredSignals}/><ListBlock title="Conditions d’arrêt" items={pattern.stopConditions}/><ListBlock title="Contrôles de risque" items={pattern.riskControls}/></div>
    </article>)}</div> : <MemoryEmpty title="Aucun pattern enregistré" description="Aucune structure de campagne réutilisable n’est disponible dans le registre courant." />}
    <MemorySafetyBanner detail="Un cas ou un pattern ne devient doctrine qu’après validation réelle. Aucun résultat observé n’est généralisé automatiquement." />
  </div>
}

function CaseBlock({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[9px] font-black uppercase text-slate-600">{label}</p><p className="mt-2 text-[11px] font-semibold leading-5 text-slate-800">{value}</p></div> }
function ListBlock({ title, items }: { title: string; items: string[] }) { return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[9px] font-black uppercase text-slate-600">{title}</p><ul className="mt-3 space-y-2">{items.length ? items.map((item) => <li key={item} className="text-[11px] font-semibold leading-5 text-slate-800">• {item}</li>) : <li className="text-[11px] font-semibold text-slate-600">Non défini</li>}</ul></div> }

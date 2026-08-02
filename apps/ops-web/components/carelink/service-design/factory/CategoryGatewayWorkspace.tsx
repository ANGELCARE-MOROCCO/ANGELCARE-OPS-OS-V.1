'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, Boxes, BrainCircuit, BriefcaseBusiness, CalendarDays, CheckSquare2, CircleDollarSign, HeartHandshake, Layers3, PackageCheck, Route, Search, Sparkles } from 'lucide-react'
import type { FactoryCataloguePayload, FactoryMode } from '@/types/homeservice-factory'
import type { CategoryExperienceBlueprint } from '@/types/homeservice-category-experience'
import { FactoryHero, cx } from './FactoryUI'

const conceptIcons = { family_care: HeartHandshake, newborn_calm: Sparkles, adapted_precision: BrainCircuit, learning_studio: Layers3, event_control: CheckSquare2, hospitality_suite: BriefcaseBusiness, route_safety: Route, comfort_dignity: HeartHandshake, household_flow: Boxes, enterprise_deployment: CircleDollarSign } as const
const modeCards: Array<{ mode: FactoryMode; title: string; description: string; icon: typeof CalendarDays }> = [
  { mode: 'single_mission', title: 'Mission unique', description: 'Une date, un déroulé complet et une proposition directement exploitable.', icon: CalendarDays },
  { mode: 'multi_mission', title: 'Programme multi-missions', description: 'Plusieurs dates avec progression, routines et variations contrôlées.', icon: Sparkles },
  { mode: 'commercial_package', title: 'Package commercial', description: 'Service, options, prix, promesse et publication B2C/B2B.', icon: PackageCheck },
]

export function CategoryGatewayWorkspace({ catalogue, blueprints, initialMode = 'single_mission' }: { catalogue: FactoryCataloguePayload; blueprints: CategoryExperienceBlueprint[]; initialMode?: FactoryMode }) {
  const [mode, setMode] = useState<FactoryMode>(initialMode)
  const [search, setSearch] = useState('')
  const [concept, setConcept] = useState<string>('all')
  const map = useMemo(() => new Map(blueprints.map((item) => [item.categoryCode, item])), [blueprints])
  const categories = useMemo(() => catalogue.categories.filter((category) => {
    const blueprint = map.get(category.code)
    const query = search.trim().toLowerCase()
    return blueprint && (concept === 'all' || blueprint.concept === concept) && (!query || `${category.commercialName} ${category.familyName} ${category.code} ${blueprint.conceptTitle}`.toLowerCase().includes(query))
  }), [catalogue.categories, concept, map, search])
  const concepts = useMemo(() => Array.from(new Map(blueprints.map((item) => [item.concept, item.conceptTitle])).entries()), [blueprints])
  return <div className="space-y-6">
    <FactoryHero eyebrow="HomeService Category-First Factory" title="Choisissez d’abord la catégorie. Le bon studio s’ouvre ensuite." description="Chaque catégorie possède son propre concept visuel, ses scénarios complets, ses options, ses routines, ses risques et ses configurations préremplies. L’utilisateur ne rédige pas le service : il le sélectionne, ajuste quelques choix et renseigne les dates et horaires." actions={<Link href="/carelink-ops/service-design/factory/import" className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-xs font-black text-white">Importer une ressource précise</Link>} />

    <section className="grid gap-4 lg:grid-cols-3">{modeCards.map((item) => { const Icon = item.icon, active = mode === item.mode; return <button key={item.mode} type="button" onClick={() => setMode(item.mode)} className={cx('rounded-[26px] border p-5 text-left transition', active ? 'border-blue-600 bg-blue-600 text-white shadow-[0_20px_50px_rgba(37,99,235,.28)]' : 'border-slate-200 bg-white hover:border-blue-200')}><Icon size={21} /><h2 className="mt-4 text-lg font-black">{item.title}</h2><p className={cx('mt-2 text-xs font-semibold leading-5', active ? 'text-blue-100' : 'text-slate-500')}>{item.description}</p></button> })}</section>

    <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,.06)] sm:p-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.24em] text-blue-600">Étape 1</p><h2 className="mt-1 text-3xl font-black tracking-[-.045em] text-slate-950">Catégories de services</h2><p className="mt-2 max-w-3xl text-xs font-semibold leading-5 text-slate-500">Ouvrez le studio métier correspondant. Aucun questionnaire générique n’est présenté avant ce choix.</p></div><div className="relative min-w-[280px]"><Search className="absolute left-4 top-3.5 text-slate-400" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une catégorie…" className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 text-sm font-bold outline-none focus:border-blue-400" /></div></div>
      <div className="mt-5 flex flex-wrap gap-2"><button type="button" onClick={() => setConcept('all')} className={cx('rounded-full border px-3 py-2 text-[10px] font-black', concept === 'all' ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600')}>Toutes</button>{concepts.map(([code, label]) => <button key={code} type="button" onClick={() => setConcept(code)} className={cx('rounded-full border px-3 py-2 text-[10px] font-black', concept === code ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600')}>{label}</button>)}</div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{categories.map((category) => { const blueprint = map.get(category.code)!; const Icon = conceptIcons[blueprint.concept]; return <Link key={category.id} href={`/carelink-ops/service-design/factory/category/${encodeURIComponent(category.code)}?mode=${mode}`} className="group relative overflow-hidden rounded-[26px] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:border-blue-300 hover:bg-white hover:shadow-[0_22px_60px_rgba(15,23,42,.10)]"><div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-blue-50" /><div className="relative flex items-start justify-between gap-4"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-white"><Icon size={21} /></div><ArrowRight className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" size={18} /></div><p className="relative mt-5 text-[9px] font-black uppercase tracking-[.16em] text-blue-600">{blueprint.conceptTitle}</p><h3 className="relative mt-1 text-xl font-black tracking-[-.035em] text-slate-950">{category.commercialName}</h3><p className="relative mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{blueprint.heroStatement}</p><div className="relative mt-5 grid grid-cols-3 gap-2"><Metric value={blueprint.presets.length} label="Scénarios" /><Metric value={blueprint.sections.reduce((sum, section) => sum + section.fields.length, 0)} label="Champs contrôlés" /><Metric value={category.activities.length} label="Activités locales" /></div><div className="relative mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black text-slate-600">{category.familyName}</span><span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black text-slate-600">{blueprint.audience.toUpperCase()}</span><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black text-emerald-700">0 texte obligatoire</span></div></Link> })}</div>
      {!categories.length ? <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold text-amber-900">Aucune catégorie ne correspond aux filtres.</div> : null}
    </section>
  </div>
}

function Metric({ value, label }: { value: number; label: string }) { return <div className="rounded-xl border border-slate-200 bg-white p-2.5"><strong className="block text-lg font-black text-slate-950">{value}</strong><span className="block text-[8px] font-black uppercase tracking-[.1em] text-slate-400">{label}</span></div> }

'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ArrowRight,
  Boxes,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarDays,
  CheckSquare2,
  CircleDollarSign,
  Command,
  HeartHandshake,
  Layers3,
  PackageCheck,
  Route,
  Search,
  Sparkles,
  Star,
  Store,
  WandSparkles,
} from 'lucide-react'
import type { FactoryCataloguePayload, FactoryMode } from '@/types/homeservice-factory'
import type { CategoryExperienceBlueprint } from '@/types/homeservice-category-experience'
import { FactoryHero, cx } from './FactoryUI'
import { StudioAction, StudioChip, StudioMetric, StudioSurface } from '../studio2030'

const conceptIcons = { family_care: HeartHandshake, newborn_calm: Sparkles, adapted_precision: BrainCircuit, learning_studio: Layers3, event_control: CheckSquare2, hospitality_suite: BriefcaseBusiness, route_safety: Route, comfort_dignity: HeartHandshake, household_flow: Boxes, enterprise_deployment: CircleDollarSign } as const
const conceptTones: Record<string, string> = { family_care: 'from-rose-500 to-orange-400', newborn_calm: 'from-cyan-500 to-blue-400', adapted_precision: 'from-violet-600 to-fuchsia-400', learning_studio: 'from-indigo-600 to-blue-400', event_control: 'from-fuchsia-600 to-rose-400', hospitality_suite: 'from-sky-600 to-cyan-400', route_safety: 'from-amber-500 to-orange-400', comfort_dignity: 'from-emerald-600 to-teal-400', household_flow: 'from-teal-600 to-cyan-400', enterprise_deployment: 'from-blue-700 to-indigo-500' }

const modeCards: Array<{ mode: FactoryMode; title: string; kicker: string; description: string; icon: typeof CalendarDays; href: string }> = [
  { mode: 'single_mission', title: 'Créer une mission', kicker: 'Single mission', description: 'Une date, un déroulé complet et une proposition directement exploitable.', icon: CalendarDays, href: '/carelink-ops/service-design/factory?mode=single_mission' },
  { mode: 'multi_mission', title: 'Créer un programme', kicker: 'Multi-missions', description: 'Plusieurs dates avec progression, routines et variations contrôlées.', icon: Sparkles, href: '/carelink-ops/service-design/factory?mode=multi_mission' },
  { mode: 'commercial_package', title: 'Composer un package', kicker: 'Commercial product', description: 'Service, options, prix, promesse et publication B2C/B2B.', icon: PackageCheck, href: '/carelink-ops/service-design/factory?mode=commercial_package' },
]

export function CategoryGatewayWorkspace({ catalogue, blueprints, initialMode = 'single_mission' }: { catalogue: FactoryCataloguePayload; blueprints: CategoryExperienceBlueprint[]; initialMode?: FactoryMode }) {
  const [mode, setMode] = useState<FactoryMode>(initialMode)
  const [search, setSearch] = useState('')
  const [concept, setConcept] = useState<string>('all')
  const [pinned, setPinned] = useState<string[]>([])
  const map = useMemo(() => new Map(blueprints.map((item) => [item.categoryCode, item])), [blueprints])
  const categories = useMemo(() => catalogue.categories.filter((category) => {
    const blueprint = map.get(category.code)
    const query = search.trim().toLowerCase()
    return blueprint && (concept === 'all' || blueprint.concept === concept) && (!query || `${category.commercialName} ${category.familyName} ${category.code} ${blueprint.conceptTitle}`.toLowerCase().includes(query))
  }).sort((a, b) => Number(pinned.includes(b.code)) - Number(pinned.includes(a.code))), [catalogue.categories, concept, map, pinned, search])
  const concepts = useMemo(() => Array.from(new Map(blueprints.map((item) => [item.concept, item.conceptTitle])).entries()), [blueprints])
  const totalPresets = blueprints.reduce((sum, item) => sum + item.presets.length, 0)
  const totalActivities = catalogue.categories.reduce((sum, item) => sum + item.activities.length, 0)
  const commerciallyReady = catalogue.categories.filter((item) => item.priceEntries.length > 0).length

  return <div className="space-y-6">
    <FactoryHero eyebrow="ANGELCARE Service Intelligence Studio" title="Concevez une expérience de service avant de construire la mission." description="Choisissez le résultat attendu, puis la catégorie. Le studio métier charge automatiquement ses scénarios, profils, routines, activités, risques, options et configurations locales. Aucun questionnaire générique ne précède ce choix." actions={<><StudioAction href="/carelink-ops/service-design/factory/import" tone="navy" icon={<Command size={14} />}>Import ciblé</StudioAction><StudioAction href="/carelink-ops/service-design/catalogue/categories" tone="navy" icon={<Boxes size={14} />}>Portfolio</StudioAction></>} />

    <section className="grid gap-4 lg:grid-cols-3">{modeCards.map((item, index) => { const Icon = item.icon, active = mode === item.mode; return <button key={item.mode} type="button" onClick={() => setMode(item.mode)} className={cx('group relative overflow-hidden rounded-[30px] border p-5 text-left transition duration-200 hover:-translate-y-1', active ? 'border-blue-500 bg-slate-950 text-white shadow-[0_28px_70px_rgba(15,23,42,.24)]' : 'border-slate-200 bg-white text-slate-950 shadow-[0_14px_38px_rgba(15,23,42,.055)] hover:border-blue-200')}><div className={cx('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', index === 0 ? 'from-blue-600 to-cyan-400' : index === 1 ? 'from-violet-600 to-fuchsia-400' : 'from-emerald-600 to-teal-400')} /><div className="flex items-start justify-between"><div className={cx('grid h-12 w-12 place-items-center rounded-[20px]', active ? 'bg-white/10 text-cyan-300' : 'bg-slate-950 text-white')}><Icon size={20} /></div><span className={cx('rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[.13em]', active ? 'bg-white/10 text-blue-200' : 'bg-slate-100 text-slate-500')}>{item.kicker}</span></div><h2 className="mt-5 text-xl font-black tracking-[-.035em]">{item.title}</h2><p className={cx('mt-2 text-xs font-semibold leading-5', active ? 'text-slate-300' : 'text-slate-500')}>{item.description}</p><div className={cx('mt-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.12em]', active ? 'text-cyan-300' : 'text-blue-600')}>{active ? 'Mode actif' : 'Sélectionner'}<ArrowRight size={13} className="transition group-hover:translate-x-1" /></div></button> })}</section>

    <section className="grid gap-4 md:grid-cols-3">
      <StudioMetric label="Catégories actives" value={catalogue.categories.length} detail="Studios métier disponibles depuis le catalogue local." icon={<Boxes size={18} />} />
      <StudioMetric label="Scénarios préremplis" value={totalPresets} detail="Configurations prêtes à sélectionner puis ajuster." tone="violet" icon={<WandSparkles size={18} />} />
      <StudioMetric label="Prêtes commercialement" value={`${commerciallyReady}/${catalogue.categories.length}`} detail={`${totalActivities} activités locales alimentent la composition.`} tone="emerald" icon={<Store size={18} />} />
    </section>

    <StudioSurface title="Service Portfolio Landscape" subtitle="Explorez les expériences par famille, readiness et potentiel de création. La catégorie reste la première décision métier." action={<div className="relative min-w-[280px]"><Search className="absolute left-4 top-3.5 text-slate-400" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une catégorie…" className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 text-sm font-bold" /></div>}>
      <div className="flex gap-2 overflow-x-auto pb-2"><button type="button" onClick={() => setConcept('all')} className={cx('shrink-0 rounded-full border px-3 py-2 text-[10px] font-black', concept === 'all' ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-600')}>Toutes les expériences</button>{concepts.map(([code, label]) => <button key={code} type="button" onClick={() => setConcept(code)} className={cx('shrink-0 rounded-full border px-3 py-2 text-[10px] font-black', concept === code ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600')}>{label}</button>)}</div>

      <div className="mt-6 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">{categories.map((category) => { const blueprint = map.get(category.code)!; const Icon = conceptIcons[blueprint.concept]; const isPinned = pinned.includes(category.code); const pricingReady = category.priceEntries.length > 0; return <article key={category.id} className="group relative overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-[0_14px_40px_rgba(15,23,42,.055)] transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_26px_70px_rgba(37,99,235,.12)]"><div className={cx('h-1.5 bg-gradient-to-r', conceptTones[blueprint.concept])} /><div className="p-5"><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><div className={cx('grid h-12 w-12 shrink-0 place-items-center rounded-[20px] bg-gradient-to-br text-white shadow-lg', conceptTones[blueprint.concept])}><Icon size={20} /></div><div className="min-w-0"><p className="truncate text-[9px] font-black uppercase tracking-[.18em] text-blue-600">{blueprint.conceptTitle}</p><h3 className="mt-1 truncate text-lg font-black tracking-[-.035em] text-slate-950">{category.commercialName}</h3><p className="truncate text-[10px] font-semibold text-slate-400">{category.code} · {category.familyName}</p></div></div><button type="button" onClick={() => setPinned((value) => value.includes(category.code) ? value.filter((code) => code !== category.code) : [...value, category.code])} className={cx('grid h-9 w-9 place-items-center rounded-2xl border transition', isPinned ? 'border-amber-200 bg-amber-50 text-amber-600' : 'border-slate-200 bg-white text-slate-400 hover:text-amber-500')} aria-label={isPinned ? 'Retirer des favoris' : 'Ajouter aux favoris'}><Star size={15} fill={isPinned ? 'currentColor' : 'none'} /></button></div>
          <p className="mt-4 min-h-12 text-xs font-semibold leading-5 text-slate-500">{blueprint.heroStatement}</p>
          <div className="mt-4 grid grid-cols-3 gap-2"><MiniMetric label="Scénarios" value={blueprint.presets.length} /><MiniMetric label="Activités" value={category.activities.length} /><MiniMetric label="Prix" value={pricingReady ? 'Prêt' : 'Sur devis'} tone={pricingReady ? 'emerald' : 'amber'} /></div>
          <div className="mt-4 flex flex-wrap gap-2"><StudioChip tone={blueprint.audience === 'b2b' ? 'violet' : 'blue'}>{blueprint.audience.toUpperCase()}</StudioChip><StudioChip tone="slate">{blueprint.sections.length} chambres métier</StudioChip><StudioChip tone="emerald">Zéro texte requis</StudioChip></div>
          <Link href={`/carelink-ops/service-design/factory/category/${encodeURIComponent(category.code)}?mode=${mode}`} className="mt-5 flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white transition group-hover:bg-blue-600"><span>Ouvrir le studio {mode === 'single_mission' ? 'mission' : mode === 'multi_mission' ? 'programme' : 'package'}</span><ArrowRight size={15} /></Link>
        </div></article> })}</div>

      {!categories.length ? <div className="mt-6 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center"><Search className="mx-auto text-slate-300" /><h3 className="mt-3 font-black text-slate-900">Aucune catégorie dans cette vue</h3><p className="mt-2 text-sm font-semibold text-slate-500">Modifiez la famille d’expérience ou la recherche. Aucun résultat synthétique n’est ajouté.</p></div> : null}
    </StudioSurface>
  </div>
}

function MiniMetric({ label, value, tone = 'blue' }: { label: string; value: string | number; tone?: 'blue' | 'emerald' | 'amber' }) {
  return <div className={cx('rounded-2xl border p-3', tone === 'emerald' ? 'border-emerald-100 bg-emerald-50' : tone === 'amber' ? 'border-amber-100 bg-amber-50' : 'border-slate-100 bg-slate-50')}><p className="text-sm font-black text-slate-950">{value}</p><p className="mt-1 text-[8px] font-black uppercase tracking-[.12em] text-slate-400">{label}</p></div>
}

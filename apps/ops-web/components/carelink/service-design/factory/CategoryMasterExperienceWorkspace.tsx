'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowLeft, CheckSquare2, ChevronDown, ChevronUp, Database, PackageCheck, ShieldCheck, Sparkles, WandSparkles } from 'lucide-react'
import type { CategoryExperienceBlueprint, CategoryExperienceField, CategoryExperiencePreset } from '@/types/homeservice-category-experience'
import type { FactoryCategorySource, FactoryComposeInput, FactoryDateInput, FactoryMode, FactoryScenario } from '@/types/homeservice-factory'
import { DateTimeCommand } from './experience/DateTimeCommand'
import { ExperienceSectionCard } from './experience/ExperienceSectionCard'
import { PresetGallery } from './experience/PresetGallery'
import { CONCEPT_LAYOUTS } from './experience'
import { FactoryHero, PrimaryButton, Signal, TimelineBlock, cx } from './FactoryUI'

const today = new Date().toISOString().slice(0, 10)
const ageMap: Record<string, number> = { age_0_3m: 0.1, age_3_12m: 0.6, age_1_2: 1.5, age_2_3: 2.5, age_3_5: 4, age_6_8: 7, age_9_12: 10, age_13_plus: 14, adult: 35, senior: 70 }
const list = (value: unknown): string[] => Array.isArray(value) ? value.map(String) : value == null || value === '' ? [] : [String(value)]
const firstDate = (preset: CategoryExperiencePreset): FactoryDateInput => ({ serviceDate: today, startTime: preset.defaultStartTime, endTime: preset.defaultEndTime })
const addDate = (value: string, days: number) => { const date = new Date(`${value}T12:00:00`); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10) }
const createDates = (preset: CategoryExperiencePreset) => Array.from({ length: Math.max(1, preset.defaultDayCount) }, (_, index) => ({ serviceDate: addDate(today, index), startTime: preset.defaultStartTime, endTime: preset.defaultEndTime }))

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers || {}) } })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || !payload.ok) throw new Error(payload.error || 'Une erreur est survenue.')
  return payload.data as T
}

function defaultValues(blueprint: CategoryExperienceBlueprint) {
  const values: Record<string, unknown> = {}
  for (const section of blueprint.sections) for (const field of section.fields) if (field.defaultValue !== undefined) values[field.code] = field.defaultValue
  return values
}

function fieldsBySemantic(blueprint: CategoryExperienceBlueprint, semantic: CategoryExperienceField['semantic']) {
  return blueprint.sections.flatMap((section) => section.fields).filter((field) => field.semantic === semantic)
}

function semanticValues(blueprint: CategoryExperienceBlueprint, values: Record<string, unknown>, semantic: CategoryExperienceField['semantic']) {
  return Array.from(new Set(fieldsBySemantic(blueprint, semantic).flatMap((field) => list(values[field.code]))))
}

function boolValue(values: Record<string, unknown>, ...codes: string[]) { return codes.some((code) => Boolean(values[code])) }

export function CategoryMasterExperienceWorkspace({ category, blueprint, initialMode }: { category: FactoryCategorySource; blueprint: CategoryExperienceBlueprint; initialMode?: FactoryMode }) {
  const preferredPreset = blueprint.presets.find((preset) => preset.mode === initialMode) || blueprint.presets[0]
  const [presetCode, setPresetCode] = useState(preferredPreset?.code || '')
  const [values, setValues] = useState<Record<string, unknown>>(() => ({ ...defaultValues(blueprint), ...(preferredPreset?.fieldValues || {}) }))
  const [mode, setMode] = useState<FactoryMode>(preferredPreset?.mode || initialMode || 'single_mission')
  const [universe, setUniverse] = useState<'b2c' | 'b2b'>(preferredPreset?.universe || (blueprint.audience === 'b2b' ? 'b2b' : 'b2c'))
  const [dates, setDates] = useState<FactoryDateInput[]>(preferredPreset ? createDates(preferredPreset) : [{ serviceDate: today, startTime: '08:00', endTime: '16:00' }])
  const [scenarioCount, setScenarioCount] = useState(preferredPreset?.scenarioCount || 3)
  const [maxActivities, setMaxActivities] = useState(preferredPreset?.maxActivitiesPerDay || 6)
  const [maxOptions, setMaxOptions] = useState(preferredPreset?.maxOptions || 4)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [scenarios, setScenarios] = useState<FactoryScenario[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [expanded, setExpanded] = useState<string[]>([])

  const preset = blueprint.presets.find((item) => item.code === presetCode) || preferredPreset
  const Layout = CONCEPT_LAYOUTS[blueprint.concept]
  const configuredFields = blueprint.sections.reduce((sum, section) => sum + section.fields.filter((field) => values[field.code] !== undefined && values[field.code] !== '' && (!Array.isArray(values[field.code]) || (values[field.code] as unknown[]).length > 0)).length, 0)
  const totalFields = blueprint.sections.reduce((sum, section) => sum + section.fields.length, 0)
  const warnings = useMemo(() => {
    const list: string[] = []
    if (!category.activities.length) list.push('Aucune activité locale compatible n’est enregistrée: la génération restera bloquée pour protéger la vérité catalogue.')
    if (!category.doctrine.length) list.push('Doctrine incomplète: avertissement uniquement, pas de blocage du brouillon.')
    if (!category.capacity) list.push('Capacité non renseignée: avertissement visible dans les propositions.')
    if (!category.priceEntries.length) list.push('Tarification absente: résultat « Sur devis », jamais zéro.')
    return list
  }, [category])

  function selectPreset(next: CategoryExperiencePreset) {
    setPresetCode(next.code)
    setValues({ ...defaultValues(blueprint), ...next.fieldValues })
    setMode(next.mode)
    setUniverse(next.universe)
    setDates(createDates(next))
    setScenarioCount(next.scenarioCount)
    setMaxActivities(next.maxActivitiesPerDay)
    setMaxOptions(next.maxOptions)
    setScenarios([]); setSelected([]); setMessage(null); setError(null)
  }

  function composeInput(): FactoryComposeInput {
    const ageCode = semanticValues(blueprint, values, 'age')[0] || String(values.age_band || '')
    const objectiveCodes = semanticValues(blueprint, values, 'objective')
    const contextCodes = semanticValues(blueprint, values, 'context')
    const painPointCodes = semanticValues(blueprint, values, 'pain')
    const outcomeCodes = semanticValues(blueprint, values, 'outcome')
    return {
      blueprintCode: blueprint.code, blueprintVersion: blueprint.version, presetCode,
      structuredSelections: values,
      mode, universe, categoryId: category.id,
      customerSegment: String(values.customer_type || (universe === 'b2b' ? 'institution' : 'family')),
      ageYears: ageMap[ageCode] ?? 4,
      beneficiaryCount: Math.max(1, Number(values.beneficiary_count || 1)),
      objectiveCodes: objectiveCodes.length ? objectiveCodes : ['safe_supervision'],
      contextCodes, painPointCodes, outcomeCodes,
      dates,
      includeMeal: boolValue(values, 'meal', 'feeding'),
      includeSnack: boolValue(values, 'snack'),
      includeRest: boolValue(values, 'rest', 'nap', 'sleep', 'quiet_zone'),
      includeHygiene: boolValue(values, 'hygiene', 'diapering'),
      maxActivitiesPerDay: maxActivities,
      maxOptions,
      requestedScenarioCount: scenarioCount,
      notes,
    }
  }

  async function generate() {
    setBusy(true); setError(null); setMessage(null); setScenarios([]); setSelected([])
    try {
      const result = await api<{ scenarios: FactoryScenario[]; requestCode: string }>('/api/carelink-ops/service-design/factory/generate', { method: 'POST', body: JSON.stringify(composeInput()) })
      setScenarios(result.scenarios); setExpanded(result.scenarios.slice(0, 1).map((item) => item.id)); setMessage(`${result.scenarios.length} proposition(s) créées. Dossier ${result.requestCode}.`)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Échec de génération.') }
    finally { setBusy(false) }
  }

  async function publish() {
    if (!selected.length) return
    setPublishing(true); setError(null); setMessage(null)
    try {
      const result = await api<{ published: Array<{ id: string; code: string }> }>('/api/carelink-ops/service-design/factory/publish', { method: 'POST', body: JSON.stringify({ scenarioIds: selected, universe }) })
      setMessage(`${result.published.length} référence(s) publiée(s) dans la Vitrine ${universe.toUpperCase()}.`)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Échec de publication.') }
    finally { setPublishing(false) }
  }

  return <div className="space-y-6">
    <FactoryHero eyebrow={`${blueprint.conceptTitle} · Blueprint v${blueprint.version}`} title={blueprint.title} description={blueprint.heroStatement} actions={<><Link href="/carelink-ops/service-design/factory" className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-xs font-black text-white"><ArrowLeft size={15} />Changer de catégorie</Link><Link href={`/carelink-ops/service-design/factory/import?category=${encodeURIComponent(category.id)}`} className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 text-xs font-black text-slate-200"><Database size={15} />Importer pour cette catégorie</Link></>} />

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Scénarios prêts" value={blueprint.presets.length} /><Metric label="Sections métier" value={blueprint.sections.length} /><Metric label="Champs contrôlés" value={totalFields} /><Metric label="Activités locales" value={category.activities.length} /><Metric label="Options locales" value={category.options.length} /></section>

    <Signal tone="emerald" title="Promesse zéro friction" detail={blueprint.zeroTypingPromise} />
    {warnings.map((warning) => <Signal key={warning} tone={warning.includes('bloquée') ? 'rose' : 'amber'} title="État catalogue" detail={warning} />)}
    {error ? <Signal tone="rose" title="Action interrompue" detail={error} /> : null}
    {message ? <Signal tone="emerald" title="Action terminée" detail={message} /> : null}

    <PresetGallery blueprint={blueprint} selectedCode={presetCode} onSelect={selectPreset} />

    <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,.06)] sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-blue-600">Étape 2 · Ajuster si nécessaire</p><h2 className="mt-1 text-2xl font-black tracking-[-.04em] text-slate-950">Dossier prérempli à {Math.round(configuredFields / Math.max(1, totalFields) * 100)}%</h2><p className="mt-2 max-w-3xl text-xs font-semibold leading-5 text-slate-500">Le scénario a configuré le dossier. Chaque modification se fait par sélection, toggle ou stepper.</p></div><div className="flex flex-wrap gap-2"><span className="rounded-full bg-slate-950 px-3 py-2 text-[10px] font-black text-white">{preset?.name}</span>{blueprint.audience === 'both' ? <><button type="button" onClick={() => setUniverse('b2c')} className={cx('rounded-full border px-3 py-2 text-[10px] font-black', universe === 'b2c' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200')}>B2C</button><button type="button" onClick={() => setUniverse('b2b')} className={cx('rounded-full border px-3 py-2 text-[10px] font-black', universe === 'b2b' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200')}>B2B</button></> : null}</div></div></section>

    <Layout blueprint={blueprint} activeSection={blueprint.sections[0]?.code || ''} onSectionChange={() => undefined} renderSection={(section: typeof blueprint.sections[number]) => <ExperienceSectionCard section={section} values={values} onChange={(code, value) => setValues((current) => ({ ...current, [code]: value }))} accent={blueprint.accent} />} />

    <DateTimeCommand mode={mode} dates={dates} onChange={setDates} />

    <section className="grid gap-5 xl:grid-cols-[1fr_380px]"><div className="rounded-[30px] border border-slate-200 bg-white p-5 sm:p-6"><p className="text-[10px] font-black uppercase tracking-[.22em] text-blue-600">Étape 4 · Propositions</p><h2 className="mt-1 text-2xl font-black tracking-[-.04em] text-slate-950">Combien d’options intelligentes?</h2><div className="mt-5 flex flex-wrap gap-2">{[1, 3, 5, 8, 10].map((count) => <button key={count} type="button" onClick={() => setScenarioCount(count)} className={cx('grid h-12 min-w-14 place-items-center rounded-2xl border text-sm font-black', scenarioCount === count ? 'border-blue-600 bg-blue-600 text-white shadow-lg' : 'border-slate-200 bg-slate-50 text-slate-700')}>{count}</button>)}</div><details className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4"><summary className="cursor-pointer text-xs font-black text-slate-700">Instruction exceptionnelle facultative</summary><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Uniquement une exception impossible à sélectionner ci-dessus." className="mt-3 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold" /></details></div><div className="rounded-[30px] border border-blue-200 bg-blue-50 p-5 sm:p-6"><ShieldCheck className="text-blue-700" size={24} /><h3 className="mt-4 text-xl font-black text-blue-950">Prêt à composer</h3><p className="mt-2 text-xs font-semibold leading-5 text-blue-800">OpenRouter Free reçoit ce dossier structuré et uniquement les activités locales éligibles. Le serveur impose les horaires, vérifie les IDs et calcule les prix.</p><PrimaryButton disabled={busy || !category.activities.length || !dates.length} onClick={() => void generate()}><WandSparkles size={16} />{busy ? 'Composition…' : `Générer ${scenarioCount} proposition${scenarioCount > 1 ? 's' : ''}`}</PrimaryButton></div></section>

    {scenarios.length ? <section className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-blue-600">Étape 5 · Décision</p><h2 className="mt-1 text-3xl font-black tracking-[-.045em] text-slate-950">Comparer, sélectionner, publier</h2></div><div className="flex flex-wrap gap-2"><PrimaryButton tone="slate" onClick={() => setSelected(scenarios.map((item) => item.id))}><CheckSquare2 size={15} />Tout sélectionner</PrimaryButton><PrimaryButton tone="emerald" disabled={publishing || selected.length === 0} onClick={() => void publish()}><PackageCheck size={16} />Publier {selected.length || ''} en {universe.toUpperCase()}</PrimaryButton></div></div><div className="grid gap-5">{scenarios.map((scenario) => <ScenarioCard key={scenario.id} scenario={scenario} selected={selected.includes(scenario.id)} expanded={expanded.includes(scenario.id)} onSelect={() => setSelected((current) => current.includes(scenario.id) ? current.filter((id) => id !== scenario.id) : [...current, scenario.id])} onExpand={() => setExpanded((current) => current.includes(scenario.id) ? current.filter((id) => id !== scenario.id) : [...current, scenario.id])} />)}</div></section> : null}
  </div>
}

function ScenarioCard({ scenario, selected, expanded, onSelect, onExpand }: { scenario: FactoryScenario; selected: boolean; expanded: boolean; onSelect: () => void; onExpand: () => void }) {
  return <article className={cx('overflow-hidden rounded-[30px] border bg-white shadow-[0_14px_44px_rgba(15,23,42,.06)]', selected ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200')}><div className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-5"><div className="max-w-4xl"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-950 px-3 py-1 text-[9px] font-black uppercase tracking-[.16em] text-white">Option {scenario.scenarioNumber}</span><span className="rounded-full bg-blue-50 px-3 py-1 text-[9px] font-black uppercase text-blue-700">{scenario.categoryCode}</span><span className="rounded-full bg-violet-50 px-3 py-1 text-[9px] font-black text-violet-700">{scenario.actualModel || 'OpenRouter Free'}</span></div><h3 className="mt-4 text-2xl font-black tracking-[-.04em] text-slate-950">{scenario.name}</h3><p className="mt-2 text-sm font-bold leading-6 text-slate-600">{scenario.promise}</p><p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{scenario.rationale}</p></div><button type="button" onClick={onSelect} className={cx('inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black', selected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-700')}><CheckSquare2 size={15} />{selected ? 'Sélectionnée' : 'Sélectionner'}</button></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Jours" value={scenario.days.length} /><Metric label="Activités locales" value={scenario.selectedActivityIds.length} /><Metric label="Options" value={scenario.selectedOptionIds.length} /><Metric label="Prix" value={scenario.price.customerTotalDh == null ? 'Sur devis' : `${scenario.price.customerTotalDh.toLocaleString('fr-FR')} Dh`} /><Metric label="Marge" value={scenario.price.marginPercent == null ? '—' : `${scenario.price.marginPercent}%`} /></div>{scenario.warnings.length || scenario.price.warnings.length ? <div className="mt-4 space-y-2">{[...scenario.warnings, ...scenario.price.warnings].map((warning) => <div key={warning} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-900">{warning}</div>)}</div> : null}</div><button type="button" onClick={onExpand} className="flex w-full items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs font-black text-slate-700"><span>{expanded ? 'Masquer le déroulé' : 'Voir chaque journée et chaque horaire'}</span>{expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>{expanded ? <div className="space-y-5 border-t border-slate-100 p-5 sm:p-6">{scenario.days.map((day) => <section key={day.dayNumber} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-blue-600">Jour {day.dayNumber} · {day.serviceDate} · {day.progressionPhase}</p><h4 className="mt-1 text-lg font-black text-slate-950">{day.objective}</h4></div><span className="rounded-full bg-white px-3 py-2 text-xs font-black text-slate-700">{day.startTime}–{day.endTime}</span></div><div className="mt-4 space-y-2">{day.timeline.map((block) => <TimelineBlock key={block.id} start={block.startTime} end={block.endTime} label={block.label} source={block.sourceType === 'registered_activity' ? block.sourceCode : 'Routine système'} objective={block.objective} />)}</div></section>)}</div> : null}</article>
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><strong className="block text-xl font-black text-slate-950">{value}</strong><span className="mt-1 block text-[9px] font-black uppercase tracking-[.12em] text-slate-400">{label}</span></div> }

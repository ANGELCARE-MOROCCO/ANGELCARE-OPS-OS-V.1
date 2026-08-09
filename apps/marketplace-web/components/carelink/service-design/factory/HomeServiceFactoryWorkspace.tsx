'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Boxes, BriefcaseBusiness, CalendarDays, CheckSquare2, ChevronDown, ChevronUp, CircleDollarSign, Layers3, PackageCheck, Plus, Send, ShieldCheck, Sparkles, Trash2, WandSparkles } from 'lucide-react'
import type { FactoryCataloguePayload, FactoryComposeInput, FactoryDateInput, FactoryMode, FactoryScenario } from '@/types/homeservice-factory'
import { ChoiceChip, FactoryHero, FactorySurface, PrimaryButton, Signal, TimelineBlock, cx } from './FactoryUI'

const today = new Date().toISOString().slice(0, 10)
const objectivesDefault = ['safe_supervision', 'play_engagement']
const initialDate = (): FactoryDateInput => ({ serviceDate: today, startTime: '08:00', endTime: '16:00' })

const modeCards: Array<{ mode: FactoryMode; title: string; description: string; icon: typeof CalendarDays }> = [
  { mode: 'single_mission', title: 'Créer une mission', description: 'Une journée complète, structurée heure par heure, depuis une catégorie locale.', icon: CalendarDays },
  { mode: 'multi_mission', title: 'Créer un programme', description: 'Plusieurs dates, progression quotidienne et déroulés exacts.', icon: Layers3 },
  { mode: 'commercial_package', title: 'Composer un package', description: 'Mission ou programme + fonctions, top-ups, prix et promesse commerciale.', icon: BriefcaseBusiness },
]

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { 'content-type': 'application/json', ...(init?.headers || {}) } })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || !payload.ok) throw new Error(payload.error || 'Une erreur est survenue.')
  return payload.data as T
}

export function HomeServiceFactoryWorkspace({ catalogue, initialMode = 'single_mission' }: { catalogue: FactoryCataloguePayload; initialMode?: FactoryMode }) {
  const [mode, setMode] = useState<FactoryMode>(initialMode)
  const [universe, setUniverse] = useState<'b2c' | 'b2b'>('b2c')
  const [categoryId, setCategoryId] = useState(catalogue.categories[0]?.id || '')
  const [ageYears, setAgeYears] = useState(4)
  const [beneficiaryCount, setBeneficiaryCount] = useState(1)
  const [objectiveCodes, setObjectiveCodes] = useState<string[]>(objectivesDefault)
  const [contextCodes, setContextCodes] = useState<string[]>(['home_daytime'])
  const [painPointCodes, setPainPointCodes] = useState<string[]>(['lack_of_time'])
  const [outcomeCodes, setOutcomeCodes] = useState<string[]>(['safe_coverage_completed', 'beneficiary_engaged'])
  const [dates, setDates] = useState<FactoryDateInput[]>([initialDate()])
  const [includeMeal, setIncludeMeal] = useState(true)
  const [includeSnack, setIncludeSnack] = useState(true)
  const [includeRest, setIncludeRest] = useState(false)
  const [includeHygiene, setIncludeHygiene] = useState(true)
  const [scenarioCount, setScenarioCount] = useState(3)
  const [maxActivities, setMaxActivities] = useState(6)
  const [maxOptions, setMaxOptions] = useState(4)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [scenarios, setScenarios] = useState<FactoryScenario[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [expanded, setExpanded] = useState<string[]>([])

  const category = catalogue.categories.find((item) => item.id === categoryId)
  const compositionWarnings = useMemo(() => {
    if (!category) return ['Aucune catégorie disponible. Importez d’abord une catégorie.']
    const list: string[] = []
    if (!category.activities.length) list.push('Aucune activité locale éligible.')
    if (!category.doctrine.length) list.push('Doctrine vide: la création reste possible, mais le résultat portera un avertissement.')
    if (!category.capacity) list.push('Capacité non configurée: la création reste possible en brouillon.')
    if (!category.priceEntries.length) list.push('Prix absent: le package sera « Sur devis ».')
    return list
  }, [category])

  const toggle = (value: string, values: string[], setter: (values: string[]) => void) => setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value])
  function changeMode(next: FactoryMode) {
    setMode(next)
    if (next === 'single_mission') setDates((current) => current.slice(0, 1))
    if (next !== 'single_mission' && dates.length === 1) setDates([dates[0], { ...dates[0], serviceDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10) }])
  }
  function addDay() {
    const last = dates[dates.length - 1] || initialDate()
    const next = new Date(`${last.serviceDate}T12:00:00`)
    next.setDate(next.getDate() + 1)
    setDates([...dates, { ...last, serviceDate: next.toISOString().slice(0, 10) }])
  }
  function updateDate(index: number, patch: Partial<FactoryDateInput>) { setDates(dates.map((item, cursor) => cursor === index ? { ...item, ...patch } : item)) }
  async function generate() {
    setBusy(true); setError(null); setMessage(null); setScenarios([]); setSelected([])
    try {
      const input: FactoryComposeInput = { mode, universe, categoryId, customerSegment: universe === 'b2b' ? 'institution' : 'family', ageYears, beneficiaryCount, objectiveCodes, contextCodes, painPointCodes, outcomeCodes, dates, includeMeal, includeSnack, includeRest, includeHygiene, maxActivitiesPerDay: maxActivities, maxOptions, requestedScenarioCount: scenarioCount, notes }
      const result = await api<{ scenarios: FactoryScenario[]; requestCode: string }>('/api/carelink-ops/service-design/factory/generate', { method: 'POST', body: JSON.stringify(input) })
      setScenarios(result.scenarios)
      setExpanded(result.scenarios.slice(0, 1).map((item) => item.id))
      setMessage(`${result.scenarios.length} proposition(s) créées depuis les ressources locales. Demande ${result.requestCode}.`)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Échec de génération.') }
    finally { setBusy(false) }
  }
  async function publish() {
    if (!selected.length) return
    setPublishing(true); setError(null); setMessage(null)
    try {
      const result = await api<{ published: Array<{ id: string; code: string }> }>('/api/carelink-ops/service-design/factory/publish', { method: 'POST', body: JSON.stringify({ scenarioIds: selected, universe }) })
      setMessage(`${result.published.length} référence(s) publiée(s) directement dans la Vitrine ${universe.toUpperCase()}.`)
      setScenarios((current) => current.map((item) => selected.includes(item.id) ? { ...item } : item))
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Échec de publication.') }
    finally { setPublishing(false) }
  }

  return <div className="space-y-6">
    <FactoryHero eyebrow="HomeService Direct Factory" title="Créer d’abord. Gouverner seulement quand c’est nécessaire." description="Trois actions centrales, alimentées directement par vos catégories, activités, capacités, options et prix locaux. La création d’un brouillon n’est plus bloquée par des validations, boards ou readiness inutiles. Les seules barrières dures restent les données indispensables et la sécurité réelle." actions={<><Link href="/carelink-ops/service-design/factory/import" className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 text-xs font-black text-white"><Boxes size={15} /> Importer doctrine & ressources</Link><Link href="/carelink-ops/service-design/advanced" className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 text-xs font-black text-slate-300">Opérations avancées</Link></>} />

    <section className="grid gap-4 lg:grid-cols-3">{modeCards.map((item) => { const Icon = item.icon; const active = mode === item.mode; return <button key={item.mode} onClick={() => changeMode(item.mode)} className={cx('rounded-[26px] border p-5 text-left transition', active ? 'border-blue-600 bg-blue-600 text-white shadow-[0_18px_45px_rgba(37,99,235,.28)]' : 'border-slate-200 bg-white hover:border-blue-200')}><div className={cx('grid h-11 w-11 place-items-center rounded-2xl', active ? 'bg-white/15' : 'bg-blue-50 text-blue-700')}><Icon size={20} /></div><h2 className="mt-4 text-lg font-black">{item.title}</h2><p className={cx('mt-2 text-xs font-semibold leading-5', active ? 'text-blue-100' : 'text-slate-500')}>{item.description}</p></button> })}</section>

    {error ? <Signal tone="rose" title="Action interrompue" detail={error} /> : null}
    {message ? <Signal tone="emerald" title="Action terminée" detail={message} /> : null}

    <section className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
      <div className="space-y-6">
        <FactorySurface title="1. Source locale" subtitle="La catégorie et ses ressources enregistrées sont l’unique source de vérité.">
          <div className="grid gap-4 md:grid-cols-2"><label className="space-y-2"><span className="text-[10px] font-black uppercase tracking-[.16em] text-slate-400">Catégorie</span><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black"><option value="">Sélectionner</option>{catalogue.categories.map((item) => <option key={item.id} value={item.id}>{item.commercialName} · {item.status}</option>)}</select></label><label className="space-y-2"><span className="text-[10px] font-black uppercase tracking-[.16em] text-slate-400">Vitrine cible</span><div className="grid grid-cols-2 gap-2"><button onClick={() => setUniverse('b2c')} className={cx('rounded-2xl border px-4 py-3 text-sm font-black', universe === 'b2c' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200')}>B2C</button><button onClick={() => setUniverse('b2b')} className={cx('rounded-2xl border px-4 py-3 text-sm font-black', universe === 'b2b' ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-200')}>B2B</button></div></label></div>
          {category ? <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><div className="rounded-2xl bg-slate-50 p-4"><strong className="block text-2xl font-black">{category.activities.length}</strong><span className="text-[9px] font-black uppercase text-slate-400">Activités locales</span></div><div className="rounded-2xl bg-slate-50 p-4"><strong className="block text-2xl font-black">{category.doctrine.length}</strong><span className="text-[9px] font-black uppercase text-slate-400">Règles doctrine</span></div><div className="rounded-2xl bg-slate-50 p-4"><strong className="block text-2xl font-black">{category.options.length}</strong><span className="text-[9px] font-black uppercase text-slate-400">Options / upsells</span></div><div className="rounded-2xl bg-slate-50 p-4"><strong className="block text-2xl font-black">{category.priceEntries.length}</strong><span className="text-[9px] font-black uppercase text-slate-400">Prix locaux</span></div></div> : null}
          {compositionWarnings.length ? <div className="mt-4 space-y-2">{compositionWarnings.map((item) => <Signal key={item} tone={item.includes('Aucune activité') ? 'rose' : 'amber'} title={item.includes('Aucune activité') ? 'Donnée indispensable' : 'Avertissement non bloquant'} detail={item} />)}</div> : <div className="mt-4"><Signal tone="emerald" title="Source prête" detail="La catégorie contient les ressources nécessaires à la composition." /></div>}
        </FactorySurface>

        <FactorySurface title="2. Client, bénéficiaire et objectif" subtitle="Sélections structurées; presque aucun texte libre.">
          <div className="grid gap-4 md:grid-cols-2"><label className="space-y-2"><span className="text-[10px] font-black uppercase tracking-[.16em] text-slate-400">Âge</span><input type="number" min={0} max={100} value={ageYears} onChange={(event) => setAgeYears(Number(event.target.value))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black" /></label><label className="space-y-2"><span className="text-[10px] font-black uppercase tracking-[.16em] text-slate-400">Bénéficiaires</span><input type="number" min={1} max={50} value={beneficiaryCount} onChange={(event) => setBeneficiaryCount(Number(event.target.value))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black" /></label></div>
          <ChoiceGroup title="Objectifs" items={catalogue.objectives} values={objectiveCodes} setValues={setObjectiveCodes} />
          <ChoiceGroup title="Contexte d’usage" items={catalogue.contexts} values={contextCodes} setValues={setContextCodes} />
          <ChoiceGroup title="Pain points" items={catalogue.painPoints} values={painPointCodes} setValues={setPainPointCodes} />
          <ChoiceGroup title="Résultats attendus" items={catalogue.outcomes} values={outcomeCodes} setValues={setOutcomeCodes} />
        </FactorySurface>

        <FactorySurface title="3. Dates et durée" subtitle="Une date devient une journée de plan. Le moteur remplit exactement chaque fenêtre horaire." action={mode !== 'single_mission' ? <PrimaryButton tone="slate" onClick={addDay}><Plus size={14} /> Ajouter une journée</PrimaryButton> : undefined}>
          <div className="space-y-3">{dates.map((date, index) => <div key={`${date.serviceDate}-${index}`} className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[42px_1fr_1fr_1fr_auto] sm:items-end"><div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-xs font-black text-white">{index + 1}</div><label className="space-y-1"><span className="text-[9px] font-black uppercase text-slate-400">Date</span><input type="date" value={date.serviceDate} onChange={(event) => updateDate(index, { serviceDate: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black" /></label><label className="space-y-1"><span className="text-[9px] font-black uppercase text-slate-400">Début</span><input type="time" value={date.startTime} onChange={(event) => updateDate(index, { startTime: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black" /></label><label className="space-y-1"><span className="text-[9px] font-black uppercase text-slate-400">Fin</span><input type="time" value={date.endTime} onChange={(event) => updateDate(index, { endTime: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black" /></label>{mode !== 'single_mission' && dates.length > 1 ? <button onClick={() => setDates(dates.filter((_, cursor) => cursor !== index))} className="grid h-10 w-10 place-items-center rounded-xl border border-rose-200 bg-rose-50 text-rose-700"><Trash2 size={14} /></button> : <div />}</div>)}</div>
          <div className="mt-5 flex flex-wrap gap-2">{[{ key: 'meal', label: 'Repas', value: includeMeal, set: setIncludeMeal }, { key: 'snack', label: 'Collation', value: includeSnack, set: setIncludeSnack }, { key: 'rest', label: 'Repos / temps calme', value: includeRest, set: setIncludeRest }, { key: 'hygiene', label: 'Hygiène', value: includeHygiene, set: setIncludeHygiene }].map((item) => <ChoiceChip key={item.key} selected={item.value} onClick={() => item.set(!item.value)}>{item.label}</ChoiceChip>)}</div>
        </FactorySurface>
      </div>

      <div className="space-y-6">
        <FactorySurface title="4. Contrôles de composition" subtitle="Le système génère au maximum dix propositions. Aucun conseil d’administration n’est requis pour créer un brouillon.">
          <div className="grid gap-4 sm:grid-cols-3"><NumberField label="Propositions" value={scenarioCount} min={1} max={10} setValue={setScenarioCount} /><NumberField label="Activités / jour" value={maxActivities} min={1} max={12} setValue={setMaxActivities} /><NumberField label="Options max." value={maxOptions} min={0} max={12} setValue={setMaxOptions} /></div>
          <label className="mt-4 block space-y-2"><span className="text-[10px] font-black uppercase tracking-[.16em] text-slate-400">Instruction exceptionnelle facultative</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Uniquement ce qui ne peut pas être sélectionné dans les critères ci-dessus." className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold outline-none focus:border-blue-400" /></label>
          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs font-semibold leading-5 text-blue-900"><strong className="font-black">Autorité:</strong> OpenRouter Free choisit uniquement parmi les activités et options locales. Le serveur fixe les horaires, vérifie les IDs, remplit toute la journée et calcule le prix.</div>
          <div className="mt-5"><PrimaryButton disabled={busy || !categoryId || !category?.activities.length} onClick={() => void generate()}><WandSparkles size={16} />{busy ? 'Composition en cours…' : `Générer ${scenarioCount} proposition${scenarioCount > 1 ? 's' : ''}`}</PrimaryButton></div>
        </FactorySurface>

        <FactorySurface title="Ce qui ne bloque plus" subtitle="Les contrôles sont replacés au bon moment."><div className="space-y-3"><Signal tone="emerald" title="Création de brouillon" detail="Possible avec une catégorie et des activités locales, même si la doctrine, la capacité ou le prix sont encore incomplets." /><Signal tone="emerald" title="Comparaison et sélection" detail="Aucune approbation requise pour comparer, modifier et sélectionner des résultats." /><Signal tone="amber" title="Publication Vitrine" detail="Une seule action explicite, réservée aux utilisateurs disposant déjà du droit de publication." /><Signal tone="blue" title="CARELINK" detail="Le dossier opérationnel reste une action finale volontaire. Les boards, readiness et quality rooms ne sont plus sur le chemin principal." /></div></FactorySurface>
      </div>
    </section>

    {scenarios.length ? <section className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.25em] text-blue-600">Résultats locaux + OpenRouter Free</p><h2 className="mt-1 text-3xl font-black tracking-[-.045em] text-slate-950">Comparer, sélectionner, publier</h2></div><div className="flex gap-2"><PrimaryButton tone="slate" onClick={() => setSelected(scenarios.map((item) => item.id))}><CheckSquare2 size={15} /> Tout sélectionner</PrimaryButton><PrimaryButton tone="emerald" disabled={publishing || selected.length === 0} onClick={() => void publish()}><PackageCheck size={16} /> Publier {selected.length || ''} dans {universe.toUpperCase()}</PrimaryButton></div></div>
      <div className="grid gap-5">{scenarios.map((scenario) => { const open = expanded.includes(scenario.id); const isSelected = selected.includes(scenario.id); return <article key={scenario.id} className={cx('overflow-hidden rounded-[30px] border bg-white shadow-[0_14px_44px_rgba(15,23,42,.06)]', isSelected ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-slate-200')}><div className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-5"><div className="max-w-4xl"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-slate-950 px-3 py-1 text-[9px] font-black uppercase tracking-[.16em] text-white">Option {scenario.scenarioNumber}</span><span className="rounded-full bg-blue-50 px-3 py-1 text-[9px] font-black uppercase text-blue-700">{scenario.categoryCode}</span><span className="rounded-full bg-violet-50 px-3 py-1 text-[9px] font-black text-violet-700">{scenario.actualModel || 'OpenRouter Free'}</span></div><h3 className="mt-4 text-2xl font-black tracking-[-.04em] text-slate-950">{scenario.name}</h3><p className="mt-2 text-sm font-bold leading-6 text-slate-600">{scenario.promise}</p><p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{scenario.rationale}</p></div><button onClick={() => setSelected(isSelected ? selected.filter((id) => id !== scenario.id) : [...selected, scenario.id])} className={cx('inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black', isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-700')}><CheckSquare2 size={15} />{isSelected ? 'Sélectionnée' : 'Sélectionner'}</button></div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Jours" value={scenario.days.length} /><Metric label="Activités locales" value={scenario.selectedActivityIds.length} /><Metric label="Options" value={scenario.selectedOptionIds.length} /><Metric label="Prix" value={scenario.price.customerTotalDh == null ? 'Sur devis' : `${scenario.price.customerTotalDh.toLocaleString('fr-FR')} Dh`} /><Metric label="Marge" value={scenario.price.marginPercent == null ? '—' : `${scenario.price.marginPercent}%`} /></div>
        {scenario.warnings.length || scenario.price.warnings.length ? <div className="mt-4 space-y-2">{[...scenario.warnings, ...scenario.price.warnings].map((warning) => <div key={warning} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-900">{warning}</div>)}</div> : null}
        </div><button onClick={() => setExpanded(open ? expanded.filter((id) => id !== scenario.id) : [...expanded, scenario.id])} className="flex w-full items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3 text-xs font-black text-slate-700"><span>{open ? 'Masquer le déroulé' : 'Voir chaque journée et chaque horaire'}</span>{open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>{open ? <div className="space-y-5 border-t border-slate-100 p-5 sm:p-6">{scenario.days.map((day) => <section key={day.dayNumber} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-blue-600">Jour {day.dayNumber} · {day.serviceDate} · {day.progressionPhase}</p><h4 className="mt-1 text-lg font-black text-slate-950">{day.objective}</h4></div><span className="rounded-full bg-white px-3 py-2 text-xs font-black text-slate-700">{day.startTime}–{day.endTime}</span></div><div className="mt-4 space-y-2">{day.timeline.map((block) => <TimelineBlock key={block.id} start={block.startTime} end={block.endTime} label={block.label} source={block.sourceType === 'registered_activity' ? block.sourceCode : 'Routine système'} objective={block.objective} />)}</div></section>)}</div> : null}</article> })}</div></section> : null}
  </div>
}

function ChoiceGroup({ title, items, values, setValues }: { title: string; items: Array<{ code: string; label: string }>; values: string[]; setValues: (values: string[]) => void }) {
  return <div className="mt-5"><p className="mb-2 text-[10px] font-black uppercase tracking-[.16em] text-slate-400">{title}</p><div className="flex flex-wrap gap-2">{items.map((item) => <ChoiceChip key={item.code} selected={values.includes(item.code)} onClick={() => setValues(values.includes(item.code) ? values.filter((value) => value !== item.code) : [...values, item.code])}>{item.label}</ChoiceChip>)}</div></div>
}
function NumberField({ label, value, min, max, setValue }: { label: string; value: number; min: number; max: number; setValue: (value: number) => void }) { return <label className="space-y-2"><span className="text-[9px] font-black uppercase tracking-[.14em] text-slate-400">{label}</span><input type="number" min={min} max={max} value={value} onChange={(event) => setValue(Math.max(min, Math.min(max, Number(event.target.value))))} className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black" /></label> }
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-2xl bg-slate-50 p-4"><strong className="block text-xl font-black text-slate-950">{value}</strong><span className="mt-1 block text-[9px] font-black uppercase tracking-[.12em] text-slate-400">{label}</span></div> }

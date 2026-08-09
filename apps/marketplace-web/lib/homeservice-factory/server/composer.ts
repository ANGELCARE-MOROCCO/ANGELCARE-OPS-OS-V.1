import 'server-only'
import { createHash, randomUUID } from 'node:crypto'
import type { FactoryActivitySource, FactoryComposeInput, FactoryPriceTruth, FactoryScenario, FactoryScenarioDay, FactoryTimelineBlock } from '@/types/homeservice-factory'
import { composeFreePlan, providerConfigured } from '@/lib/homeservice-planning/server/openrouter-free'
import { FACTORY_MAX_DAYS, FACTORY_MAX_SCENARIOS } from '../constants'
import { loadCategoryAuthority } from './catalogue'
import { requireCategoryBlueprint } from './blueprints'

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))
const minutes = (time: string) => { const [h, m] = time.split(':').map(Number); return h * 60 + m }
const time = (value: number) => `${String(Math.floor((value % 1440) / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
const code = () => randomUUID()

export function validateFactoryInput(raw: unknown): FactoryComposeInput {
  const input = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const mode = ['single_mission', 'multi_mission', 'commercial_package'].includes(String(input.mode)) ? String(input.mode) as FactoryComposeInput['mode'] : 'single_mission'
  const dates = Array.isArray(input.dates) ? input.dates.slice(0, FACTORY_MAX_DAYS).map((date) => {
    const row = date as Record<string, unknown>
    return { serviceDate: String(row.serviceDate || ''), startTime: String(row.startTime || '08:00'), endTime: String(row.endTime || '16:00') }
  }) : []
  const result: FactoryComposeInput = {
    blueprintCode: input.blueprintCode ? String(input.blueprintCode) : undefined,
    blueprintVersion: input.blueprintVersion == null ? undefined : Math.max(1, Math.round(Number(input.blueprintVersion))),
    presetCode: input.presetCode ? String(input.presetCode) : undefined,
    structuredSelections: input.structuredSelections && typeof input.structuredSelections === 'object' && !Array.isArray(input.structuredSelections) ? input.structuredSelections as Record<string, unknown> : {},
    mode,
    universe: input.universe === 'b2b' ? 'b2b' : 'b2c',
    categoryId: String(input.categoryId || ''),
    customerSegment: String(input.customerSegment || (input.universe === 'b2b' ? 'institution' : 'family')),
    ageYears: clamp(Number(input.ageYears || 4), 0, 100),
    beneficiaryCount: clamp(Math.round(Number(input.beneficiaryCount || 1)), 1, 50),
    objectiveCodes: Array.isArray(input.objectiveCodes) ? input.objectiveCodes.map(String).slice(0, 12) : [],
    contextCodes: Array.isArray(input.contextCodes) ? input.contextCodes.map(String).slice(0, 12) : [],
    painPointCodes: Array.isArray(input.painPointCodes) ? input.painPointCodes.map(String).slice(0, 12) : [],
    outcomeCodes: Array.isArray(input.outcomeCodes) ? input.outcomeCodes.map(String).slice(0, 12) : [],
    dates,
    includeMeal: Boolean(input.includeMeal), includeSnack: Boolean(input.includeSnack), includeRest: Boolean(input.includeRest), includeHygiene: Boolean(input.includeHygiene),
    maxActivitiesPerDay: clamp(Math.round(Number(input.maxActivitiesPerDay || 6)), 1, 12),
    maxOptions: clamp(Math.round(Number(input.maxOptions || 4)), 0, 12),
    requestedScenarioCount: clamp(Math.round(Number(input.requestedScenarioCount || 3)), 1, FACTORY_MAX_SCENARIOS),
    notes: String(input.notes || '').slice(0, 1200),
  }
  if (!result.categoryId) throw Object.assign(new Error('Sélectionnez une catégorie locale.'), { status: 422, code: 'CATEGORY_REQUIRED' })
  if (!result.dates.length) throw Object.assign(new Error('Ajoutez au moins une date ou journée de mission.'), { status: 422, code: 'DATE_REQUIRED' })
  for (const [index, date] of result.dates.entries()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date.serviceDate)) throw Object.assign(new Error(`Date ${index + 1} invalide.`), { status: 422, code: 'INVALID_DATE' })
    const duration = minutes(date.endTime) - minutes(date.startTime)
    if (duration < 60 || duration > 16 * 60) throw Object.assign(new Error(`La journée ${index + 1} doit durer entre 1 h et 16 h.`), { status: 422, code: 'INVALID_TIME_WINDOW' })
  }
  return result
}

function eligibleActivities(input: FactoryComposeInput, activities: FactoryActivitySource[]) {
  const ageMonths = Math.round(input.ageYears * 12)
  const filtered = activities.filter((activity) => {
    if (activity.ageMinMonths != null && ageMonths < activity.ageMinMonths) return false
    if (activity.ageMaxMonths != null && ageMonths > activity.ageMaxMonths) return false
    return true
  })
  if (!filtered.length) throw Object.assign(new Error('Aucune activité locale compatible avec cet âge. Importez les activités de cette catégorie; la génération ne doit rien inventer.'), { status: 422, code: 'NO_ELIGIBLE_ACTIVITY' })
  return filtered
}

const systemBlocks = (input: FactoryComposeInput, total: number) => {
  const blocks: Array<{ code: string; label: string; minutes: number; objective: string }> = [
    { code: 'SYSTEM_ARRIVAL', label: 'Accueil, transmission et installation', minutes: 15, objective: 'Sécuriser la prise en charge et confirmer la routine.' },
    { code: 'SYSTEM_CLOSURE', label: 'Rangement, rapport et transmission finale', minutes: 15, objective: 'Clôturer la mission avec une transmission claire.' },
  ]
  if (input.includeSnack && total >= 240) blocks.splice(1, 0, { code: 'SYSTEM_SNACK', label: 'Collation et hygiène', minutes: 20, objective: 'Respecter la routine de collation et d’hygiène.' })
  if (input.includeMeal && total >= 360) blocks.splice(-1, 0, { code: 'SYSTEM_MEAL', label: 'Repas et transition calme', minutes: 60, objective: 'Assurer le repas et la transition associée.' })
  if (input.includeRest && total >= 360) blocks.splice(-1, 0, { code: 'SYSTEM_REST', label: 'Repos / temps calme', minutes: 45, objective: 'Préserver le rythme et la récupération.' })
  if (input.includeHygiene) blocks.splice(-1, 0, { code: 'SYSTEM_HYGIENE', label: 'Routine hygiène', minutes: 15, objective: 'Assurer la routine d’hygiène prévue.' })
  return blocks
}

function distributeDurations(activities: FactoryActivitySource[], usable: number) {
  if (!activities.length) return []
  const allocation = activities.map((activity) => ({ activity, duration: activity.minMinutes }))
  let remaining = usable - allocation.reduce((sum, item) => sum + item.duration, 0)
  if (remaining < 0) {
    const ratio = usable / Math.max(1, allocation.reduce((sum, item) => sum + item.duration, 0))
    allocation.forEach((item) => { item.duration = Math.max(10, Math.floor(item.duration * ratio / 5) * 5) })
    remaining = usable - allocation.reduce((sum, item) => sum + item.duration, 0)
  }
  let guard = 0
  while (remaining >= 5 && guard < 1000) {
    const target = allocation[guard % allocation.length]
    if (target.duration + 5 <= target.activity.maxMinutes) { target.duration += 5; remaining -= 5 }
    guard += 1
    if (allocation.every((item) => item.duration >= item.activity.maxMinutes)) break
  }
  if (remaining > 0) allocation[allocation.length - 1].duration += remaining
  return allocation
}

function buildDay(input: FactoryComposeInput, rawDay: any, dayIndex: number, activities: FactoryActivitySource[]): FactoryScenarioDay {
  const date = input.dates[dayIndex]
  const start = minutes(date.startTime)
  const end = minutes(date.endTime)
  const total = end - start
  const routines = systemBlocks(input, total)
  const routineMinutes = routines.reduce((sum, item) => sum + item.minutes, 0)
  const usable = total - routineMinutes
  if (usable < 30) throw Object.assign(new Error(`La journée ${dayIndex + 1} ne laisse pas assez de temps pour les activités.`), { status: 422, code: 'INSUFFICIENT_ACTIVITY_TIME' })
  const allowed = new Map(activities.map((activity) => [activity.id, activity]))
  const rawIds = Array.isArray(rawDay?.activityIds) ? rawDay.activityIds.map(String) : []
  const picked: FactoryActivitySource[] = []
  for (const id of rawIds) {
    const activity = allowed.get(id)
    if (activity && !picked.some((item) => item.id === id) && picked.length < input.maxActivitiesPerDay) picked.push(activity)
  }
  if (!picked.length) picked.push(...activities.slice(0, input.maxActivitiesPerDay))
  const allocations = distributeDurations(picked, usable)
  const preClosing = routines.filter((item) => item.code !== 'SYSTEM_CLOSURE')
  const closing = routines.find((item) => item.code === 'SYSTEM_CLOSURE')!
  const sequence: Array<{ type: 'system' | 'activity'; data: any; duration: number }> = []
  if (preClosing.length) sequence.push({ type: 'system', data: preClosing[0], duration: preClosing[0].minutes })
  let routineCursor = 1
  allocations.forEach((allocation, index) => {
    sequence.push({ type: 'activity', data: allocation.activity, duration: allocation.duration })
    if (routineCursor < preClosing.length && (index + 1) >= Math.ceil(allocations.length * routineCursor / preClosing.length)) {
      const routine = preClosing[routineCursor++]
      sequence.push({ type: 'system', data: routine, duration: routine.minutes })
    }
  })
  while (routineCursor < preClosing.length) {
    const routine = preClosing[routineCursor++]
    sequence.push({ type: 'system', data: routine, duration: routine.minutes })
  }
  sequence.push({ type: 'system', data: closing, duration: closing.minutes })
  let cursor = start
  const timeline: FactoryTimelineBlock[] = sequence.map((item) => {
    const blockStart = cursor
    const blockEnd = cursor + item.duration
    cursor = blockEnd
    if (item.type === 'system') return {
      id: code(), sourceType: 'system_routine', sourceId: null, sourceCode: item.data.code, label: item.data.label,
      startTime: time(blockStart), endTime: time(blockEnd), durationMinutes: item.duration, objective: item.data.objective,
      rationale: 'Routine déterministe ajoutée par le moteur selon la durée et les besoins sélectionnés.', materials: [], competencyCodes: [], riskCodes: [], evidenceCodes: [],
    }
    const activity = item.data as FactoryActivitySource
    return {
      id: code(), sourceType: 'registered_activity', sourceId: activity.id, sourceCode: activity.code, label: activity.name,
      startTime: time(blockStart), endTime: time(blockEnd), durationMinutes: item.duration,
      objective: String(rawDay?.objective || input.objectiveCodes[0] || 'Engagement et continuité de service'),
      rationale: String(rawDay?.rationale || `Activité locale ${activity.code} sélectionnée pour la catégorie et le profil.`),
      materials: activity.materials, competencyCodes: activity.competencyCodes, riskCodes: activity.riskCodes, evidenceCodes: activity.evidenceCodes,
    }
  })
  if (cursor !== end) {
    const diff = end - cursor
    timeline[timeline.length - 1].durationMinutes += diff
    timeline[timeline.length - 1].endTime = time(end)
  }
  return {
    dayNumber: dayIndex + 1, serviceDate: date.serviceDate, objective: String(rawDay?.objective || input.objectiveCodes[dayIndex % Math.max(1, input.objectiveCodes.length)] || 'Mission HomeService'),
    progressionPhase: String(rawDay?.progressionPhase || (input.mode === 'single_mission' ? 'Mission unique' : `Étape ${dayIndex + 1}`)),
    startTime: date.startTime, endTime: date.endTime, totalMinutes: total, timeline,
  }
}

function calculatePrice(input: FactoryComposeInput, category: Awaited<ReturnType<typeof loadCategoryAuthority>>, optionIds: string[]): FactoryPriceTruth {
  const now = new Date().toISOString().slice(0, 10)
  const prices = category.priceEntries.filter((entry: any) => {
    const start = String(entry.effective_from || '')
    const end = entry.effective_to ? String(entry.effective_to) : null
    const segment = String(entry.customer_segment || 'all')
    return (!start || start <= now) && (!end || end >= now) && (segment === 'all' || segment === input.customerSegment || segment === input.universe)
  }) as any[]
  const warnings: string[] = []
  const selected = prices[0]
  const selectedOptions = category.options.filter((option) => optionIds.includes(option.id)).slice(0, input.maxOptions)
  const totalMinutes = input.dates.reduce((sum, date) => sum + minutes(date.endTime) - minutes(date.startTime), 0)
  const totalHours = totalMinutes / 60
  let base: number | null = null
  let cost: number | null = null
  let basis: string | null = null
  let sourceCode: string | null = null
  if (selected) {
    basis = String(selected.pricing_basis)
    sourceCode = String(selected.code)
    const unitPrice = Number(selected.unit_price_dh || 0)
    const unitCost = Number(selected.cost_amount_dh || 0)
    const quantity = basis === 'per_hour' ? totalHours : basis === 'per_day' || basis === 'per_mission' ? input.dates.length : 1
    base = Math.round(unitPrice * quantity * 100) / 100
    cost = Math.round(unitCost * quantity * 100) / 100
  } else warnings.push('Aucune tarification locale applicable: le résultat reste « Sur devis » sans inventer de prix.')
  const optionsAmount = selectedOptions.reduce((sum, option) => sum + option.unitPriceDh, 0)
  const optionCost = selectedOptions.reduce((sum, option) => sum + option.costAmountDh, 0)
  const total = base == null ? null : Math.round((base + optionsAmount) * 100) / 100
  const knownCost = cost == null ? null : Math.round((cost + optionCost) * 100) / 100
  const margin = total == null || knownCost == null ? null : Math.round((total - knownCost) * 100) / 100
  const marginPercent = margin == null || !total ? null : Math.round((margin / total) * 10000) / 100
  return { priceStatus: total == null ? 'quote_required' : 'priced', pricingBasis: basis, baseAmountDh: base, optionsAmountDh: optionsAmount, customerTotalDh: total, knownCostDh: knownCost, grossMarginDh: margin, marginPercent, sourcePriceCode: sourceCode, warnings }
}

const schema = {
  type: 'object', additionalProperties: false, required: ['scenarios'], properties: {
    scenarios: { type: 'array', minItems: 1, maxItems: FACTORY_MAX_SCENARIOS, items: {
      type: 'object', additionalProperties: false, required: ['name', 'promise', 'positioning', 'rationale', 'days', 'optionIds'], properties: {
        name: { type: 'string' }, promise: { type: 'string' }, positioning: { type: 'string' }, rationale: { type: 'string' },
        optionIds: { type: 'array', items: { type: 'string' } },
        days: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['dayNumber', 'objective', 'progressionPhase', 'activityIds', 'rationale'], properties: {
          dayNumber: { type: 'integer' }, objective: { type: 'string' }, progressionPhase: { type: 'string' }, activityIds: { type: 'array', items: { type: 'string' } }, rationale: { type: 'string' },
        } } },
      },
    } },
  },
}

export async function composeFactoryScenarios(raw: unknown): Promise<{ requestId: string; scenarios: FactoryScenario[]; sourceHash: string }> {
  const input = validateFactoryInput(raw)
  const category = await loadCategoryAuthority(input.categoryId)
  const blueprint = await requireCategoryBlueprint(category.code)
  if (input.blueprintCode && input.blueprintCode !== blueprint.code) throw Object.assign(new Error('Le blueprint ne correspond pas à la catégorie sélectionnée.'), { status: 422, code: 'BLUEPRINT_CATEGORY_MISMATCH' })
  if (input.presetCode && !blueprint.presets.some((preset) => preset.code === input.presetCode)) throw Object.assign(new Error('Le scénario prérempli sélectionné n’appartient pas à cette catégorie.'), { status: 422, code: 'PRESET_NOT_AVAILABLE' })
  const activities = eligibleActivities(input, category.activities)
  const warnings: string[] = []
  if (!category.doctrine.length) warnings.push('Doctrine absente: la composition reste possible, mais la catégorie doit être enrichie.')
  if (!category.capacity) warnings.push('Capacité non renseignée: la composition reste possible; les limites ne sont pas encore normalisées.')
  const capacity = category.capacity as any
  if (capacity) {
    const minHours = Number(capacity.minimum_hours || 0)
    const maxHours = Number(capacity.maximum_hours || 24)
    for (const [index, date] of input.dates.entries()) {
      const hours = (minutes(date.endTime) - minutes(date.startTime)) / 60
      if (hours < minHours || hours > maxHours) warnings.push(`Journée ${index + 1}: ${hours} h hors plage configurée ${minHours}–${maxHours} h. Avertissement, pas blocage de brouillon.`)
    }
    const ratio = Number(capacity.max_beneficiaries_per_agent || 1)
    if (input.beneficiaryCount > ratio) warnings.push(`${input.beneficiaryCount} bénéficiaires dépassent le ratio ${ratio}/intervenant: staffing supplémentaire à prévoir.`)
  }
  if (!providerConfigured()) throw Object.assign(new Error('OpenRouter Free n’est pas configuré. Aucun faux résultat n’a été généré.'), { status: 503, code: 'OPENROUTER_NOT_CONFIGURED' })
  const source = {
    request: input,
    categoryExperience: { code: blueprint.code, version: blueprint.version, concept: blueprint.concept, presetCode: input.presetCode || null, structuredSelections: input.structuredSelections || {}, aiCompositionProfile: blueprint.aiCompositionProfile },
    category: { id: category.id, code: category.code, name: category.commercialName, version: category.versionNumber, doctrine: category.doctrine, capacity: category.capacity },
    eligibleActivities: activities.map((activity) => ({ id: activity.id, code: activity.code, name: activity.name, description: activity.description, objectives: activity.objectiveCodes, minMinutes: activity.minMinutes, maxMinutes: activity.maxMinutes, materials: activity.materials, competencies: activity.competencyCodes, risks: activity.riskCodes })),
    eligibleOptions: category.options.map((option) => ({ id: option.id, code: option.code, name: option.name, type: option.optionType, priceDh: option.unitPriceDh, costDh: option.costAmountDh })),
  }
  const sourceHash = createHash('sha256').update(JSON.stringify(source)).digest('hex')
  const result = await composeFreePlan({
    system: `Tu es le moteur de composition HomeService d'ANGELCARE. Le dossier CATEGORY EXPERIENCE est une configuration structurée et préremplie par catégorie. Respecte le preset, les choix, les limites et les priorités fournis. Utilise EXCLUSIVEMENT les activity IDs et option IDs fournis. Ne crée aucun service, activité, capacité, prix ou compétence. Retourne exactement le nombre de scénarios demandé. Les scénarios doivent être réellement différents. Pour chaque journée, sélectionne des activités locales adaptées aux objectifs, au contexte, à l'âge et à la progression. Le serveur calculera les horaires, routines et prix.`,
    input: source,
    schema,
  })
  const content = result.content as any
  if (!Array.isArray(content?.scenarios) || content.scenarios.length !== input.requestedScenarioCount) throw Object.assign(new Error(`OpenRouter Free a retourné ${content?.scenarios?.length || 0} scénario(s) au lieu de ${input.requestedScenarioCount}.`), { status: 502, code: 'SCENARIO_COUNT_MISMATCH' })
  const requestId = randomUUID()
  const allowedActivityIds = new Set(activities.map((activity) => activity.id))
  const allowedOptionIds = new Set(category.options.map((option) => option.id))
  const scenarios: FactoryScenario[] = content.scenarios.map((rawScenario: any, scenarioIndex: number) => {
    const optionIds = (Array.isArray(rawScenario.optionIds) ? rawScenario.optionIds.map(String) : []).filter((id: string) => allowedOptionIds.has(id)).slice(0, input.maxOptions)
    const rawDays = Array.isArray(rawScenario.days) ? rawScenario.days : []
    const normalizedDays = input.dates.map((_, dayIndex) => {
      const rawDay = rawDays.find((day: any) => Number(day.dayNumber) === dayIndex + 1) || rawDays[dayIndex] || {}
      const ids = Array.isArray(rawDay.activityIds) ? rawDay.activityIds.map(String) : []
      const invalid = ids.filter((id: string) => !allowedActivityIds.has(id))
      if (invalid.length) throw Object.assign(new Error(`Le scénario ${scenarioIndex + 1} contient des activités inexistantes: ${invalid.join(', ')}`), { status: 502, code: 'INVENTED_ACTIVITY' })
      return buildDay(input, rawDay, dayIndex, activities)
    })
    const selectedActivityIds = Array.from(new Set(normalizedDays.flatMap((day) => day.timeline.filter((block) => block.sourceId).map((block) => String(block.sourceId)))))
    return {
      blueprintCode: blueprint.code, blueprintVersion: blueprint.version, presetCode: input.presetCode, configurationSnapshot: input.structuredSelections || {},
      id: randomUUID(), requestId, scenarioNumber: scenarioIndex + 1, mode: input.mode, universe: input.universe,
      name: String(rawScenario.name), promise: String(rawScenario.promise), positioning: String(rawScenario.positioning), rationale: String(rawScenario.rationale),
      categoryId: category.id, categoryCode: category.code, categoryName: category.commercialName,
      selectedActivityIds, selectedOptionIds: optionIds, days: normalizedDays, price: calculatePrice(input, category, optionIds),
      warnings: [...warnings], providerRoute: 'openrouter/free', actualModel: result.actualModel, createdAt: new Date().toISOString(),
    }
  })
  return { requestId, scenarios, sourceHash }
}

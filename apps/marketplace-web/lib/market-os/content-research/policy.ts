import type { JsonRecord, ResearchAgent, ResearchProviderPolicy } from './types'

export function record(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : {}
}

export function stringValue(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

export function numberValue(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback
}

export function booleanValue(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

export function stringList(value: unknown, fallback: string[] = []) {
  return Array.isArray(value)
    ? value.map(String).map((item) => item.trim()).filter(Boolean)
    : fallback
}

export function mergePolicy(...values: unknown[]): JsonRecord {
  return values.reduce<JsonRecord>((accumulator, value) => ({
    ...accumulator,
    ...record(value),
  }), {})
}

export function effectiveTavilyPolicy(
  provider: ResearchProviderPolicy | undefined,
  agent: ResearchAgent,
  override: JsonRecord,
) {
  const providerConfig = record(provider?.configuration)
  const providerLimits = record(provider?.limits)
  const agentProvider = record(agent.provider_policy)
  const research = record(agent.research_policy)
  const oneTime = record(override)

  return {
    searchDepth: stringValue(oneTime.searchDepth, stringValue(research.searchDepth, stringValue(providerConfig.searchDepth, 'basic'))),
    maxResults: numberValue(oneTime.maxResults, numberValue(research.maxResults, numberValue(providerLimits.maxResultsPerCall, 10, 1, 20), 1, 20), 1, 20),
    includeAnswer: booleanValue(oneTime.includeAnswer, booleanValue(research.includeAnswer, false)),
    includeRawContent: booleanValue(oneTime.includeRawContent, booleanValue(research.includeRawContent, false)),
    topic: stringValue(oneTime.topic, stringValue(research.topic, 'general')),
    country: stringValue(oneTime.country, stringValue(research.country, 'morocco')),
    timeRange: stringValue(oneTime.timeRange, stringValue(research.timeRange, 'month')),
    includeDomains: stringList(oneTime.includeDomains, stringList(research.allowedDomains, [])),
    excludeDomains: stringList(oneTime.excludeDomains, stringList(research.blockedDomains, [])),
    maxCallsPerRun: numberValue(oneTime.maxCallsPerRun, numberValue(agentProvider.maxSearchCallsPerRun, 1, 1, 10), 1, 10),
  }
}

export function effectiveOpenRouterPolicy(
  provider: ResearchProviderPolicy | undefined,
  agent: ResearchAgent,
  override: JsonRecord,
) {
  const providerConfig = record(provider?.configuration)
  const providerLimits = record(provider?.limits)
  const analysis = record(agent.analysis_policy)
  const oneTime = record(override)

  return {
    model: stringValue(oneTime.model, stringValue(analysis.model, stringValue(providerConfig.model, 'openrouter/free'))),
    maxSources: numberValue(oneTime.maxSources, numberValue(analysis.maxSources, 10, 1, 30), 1, 30),
    maxSourceCharacters: numberValue(oneTime.maxSourceCharacters, numberValue(analysis.maxSourceCharacters, 6000, 500, 20000), 500, 20000),
    maxOutputTokens: numberValue(oneTime.maxOutputTokens, numberValue(analysis.maxOutputTokens, numberValue(providerLimits.maxOutputTokens, 5000, 512, 16000), 512, 16000), 512, 16000),
    schemaRepairAttempts: numberValue(oneTime.schemaRepairAttempts, numberValue(analysis.schemaRepairAttempts, 1, 0, 2), 0, 2),
    minimumEvidenceConfidence: numberValue(oneTime.minimumEvidenceConfidence, numberValue(analysis.minimumEvidenceConfidence, 65, 0, 100), 0, 100),
    minimumRelevance: numberValue(oneTime.minimumRelevance, numberValue(analysis.minimumRelevance, 70, 0, 100), 0, 100),
    minimumBusinessFit: numberValue(oneTime.minimumBusinessFit, numberValue(analysis.minimumBusinessFit, 70, 0, 100), 0, 100),
    minimumOpportunityScore: numberValue(oneTime.minimumOpportunityScore, numberValue(analysis.minimumOpportunityScore, 72, 0, 100), 0, 100),
  }
}

export function materializationPolicy(agent: ResearchAgent, override: JsonRecord) {
  const base = record(agent.materialization_policy)
  const oneTime = record(override.materialization)
  return {
    createCanonicalSources: booleanValue(oneTime.createCanonicalSources, booleanValue(base.createCanonicalSources, true)),
    createSignals: booleanValue(oneTime.createSignals, booleanValue(base.createSignals, true)),
    createContentOpportunities: booleanValue(oneTime.createContentOpportunities, booleanValue(base.createContentOpportunities, true)),
    createStrategicCandidates: booleanValue(oneTime.createStrategicCandidates, booleanValue(base.createStrategicCandidates, false)),
    createBriefEnrichment: booleanValue(oneTime.createBriefEnrichment, booleanValue(base.createBriefEnrichment, false)),
    createEditorialSuggestions: booleanValue(oneTime.createEditorialSuggestions, booleanValue(base.createEditorialSuggestions, false)),
    createInternalTasks: booleanValue(oneTime.createInternalTasks, booleanValue(base.createInternalTasks, true)),
    createEvidenceRequests: booleanValue(oneTime.createEvidenceRequests, booleanValue(base.createEvidenceRequests, false)),
    createReviewObservations: booleanValue(oneTime.createReviewObservations, booleanValue(base.createReviewObservations, false)),
    updateDossier360: booleanValue(oneTime.updateDossier360, booleanValue(base.updateDossier360, false)),
    alertCommandement: booleanValue(oneTime.alertCommandement, booleanValue(base.alertCommandement, true)),
  }
}


function zonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23', weekday: 'short',
  })
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]))
  const weekdayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return {
    year: Number(parts.year), month: Number(parts.month), day: Number(parts.day),
    hour: Number(parts.hour), minute: Number(parts.minute), second: Number(parts.second),
    weekday: weekdayMap[parts.weekday] ?? 0,
  }
}

function timeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = zonedParts(date, timeZone)
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - date.getTime()
}

function zonedLocalToUtc(input: { year: number; month: number; day: number; hour: number; minute: number }, timeZone: string) {
  const wallClock = Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute, 0)
  let candidate = new Date(wallClock)
  candidate = new Date(wallClock - timeZoneOffsetMs(candidate, timeZone))
  candidate = new Date(wallClock - timeZoneOffsetMs(candidate, timeZone))
  return candidate
}

function addLocalDays(input: { year: number; month: number; day: number }, days: number) {
  const date = new Date(Date.UTC(input.year, input.month - 1, input.day + days))
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() }
}

export function calculateNextRunAt(schedulePolicy: unknown, from = new Date()): string | null {
  const policy = record(schedulePolicy)
  const frequency = stringValue(policy.frequency, 'manual')
  if (frequency === 'manual') return null
  const timeZone = stringValue(policy.timezone, 'Africa/Casablanca')
  const hour = numberValue(policy.hour, 8, 0, 23)
  const minute = numberValue(policy.minute, 0, 0, 59)
  if (frequency === 'hourly') return new Date(from.getTime() + 60 * 60 * 1000).toISOString()
  if (frequency === 'custom') {
    const interval = numberValue(policy.intervalMinutes, 60, 60, 43200)
    return new Date(from.getTime() + interval * 60 * 1000).toISOString()
  }

  const localNow = zonedParts(from, timeZone)
  let localDate = { year: localNow.year, month: localNow.month, day: localNow.day }
  let candidate = zonedLocalToUtc({ ...localDate, hour, minute }, timeZone)
  if (candidate.getTime() <= from.getTime()) {
    localDate = addLocalDays(localDate, 1)
    candidate = zonedLocalToUtc({ ...localDate, hour, minute }, timeZone)
  }

  if (frequency === 'weekdays') {
    while ([0, 6].includes(zonedParts(candidate, timeZone).weekday)) {
      localDate = addLocalDays(localDate, 1)
      candidate = zonedLocalToUtc({ ...localDate, hour, minute }, timeZone)
    }
  } else if (frequency === 'weekly') {
    const targetDay = numberValue(policy.dayOfWeek, 1, 0, 6)
    while (zonedParts(candidate, timeZone).weekday !== targetDay) {
      localDate = addLocalDays(localDate, 1)
      candidate = zonedLocalToUtc({ ...localDate, hour, minute }, timeZone)
    }
  } else if (frequency === 'monthly') {
    const targetDay = numberValue(policy.dayOfMonth, 1, 1, 28)
    let year = localNow.year
    let month = localNow.month
    let monthly = zonedLocalToUtc({ year, month, day: targetDay, hour, minute }, timeZone)
    if (monthly.getTime() <= from.getTime()) {
      month += 1
      if (month > 12) { month = 1; year += 1 }
      monthly = zonedLocalToUtc({ year, month, day: targetDay, hour, minute }, timeZone)
    }
    candidate = monthly
  }
  return candidate.toISOString()
}

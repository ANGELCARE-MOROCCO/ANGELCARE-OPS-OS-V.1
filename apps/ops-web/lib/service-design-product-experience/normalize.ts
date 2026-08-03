import type { ProductExperienceScenario, ProductExperienceTimelineBlock, ProductExperienceTimelineDay } from '@/types/service-design-product-experience'

type Row = Record<string, unknown>
const text = (value: unknown, fallback = '') => String(value ?? fallback)
const num = (value: unknown): number | null => value == null || value === '' || Number.isNaN(Number(value)) ? null : Number(value)
const arr = (value: unknown): unknown[] => Array.isArray(value) ? value : []
const obj = (value: unknown): Row => value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {}

function firstArray(...values: unknown[]) { return values.find(Array.isArray) as unknown[] | undefined || [] }
function firstObject(...values: unknown[]) { return values.find((value) => value && typeof value === 'object' && !Array.isArray(value)) as Row | undefined || {} }

export function timeToMinute(value: unknown, fallback = 480) {
  const match = text(value).match(/^(\d{1,2}):(\d{2})/)
  return match ? Math.max(0, Math.min(1439, Number(match[1]) * 60 + Number(match[2]))) : fallback
}
export function minuteToTime(value: number) { const safe = Math.max(0, Math.min(1439, Math.round(value))); return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}` }

export function normalizeScenario(row: Row): ProductExperienceScenario {
  const output = firstObject(row.output, row.result, row.scenario, row.payload, row.composition)
  const price = firstObject(row.price, output.price, row.pricing, output.pricing)
  const days = firstArray(row.days, output.days, row.timeline_days, output.timelineDays).map((value) => obj(value))
  const activities = firstArray(row.selected_activity_ids, output.selectedActivityIds, row.activity_ids, output.activityIds).map(String)
  const options = firstArray(row.selected_option_ids, output.selectedOptionIds, row.option_ids, output.optionIds).map(String)
  return {
    id: text(row.id), requestId: row.request_id ? text(row.request_id) : row.factory_request_id ? text(row.factory_request_id) : null,
    name: text(row.name || output.name || row.title, 'Scénario Service Design'),
    promise: text(row.promise || output.promise || row.customer_promise), rationale: text(row.rationale || output.rationale || row.reasoning),
    categoryCode: text(row.category_code || output.categoryCode || row.category, 'SERVICE'), universe: text(row.universe || output.universe, 'b2c') === 'b2b' ? 'b2b' : 'b2c',
    source: row, days, selectedActivityIds: activities, selectedOptionIds: options,
    customerTotalDh: num(row.customer_total_dh ?? price.customerTotalDh ?? price.customer_total_dh ?? row.total_price),
    costTotalDh: num(row.cost_total_dh ?? price.costTotalDh ?? price.cost_total_dh), marginPercent: num(row.margin_percent ?? price.marginPercent ?? price.margin_percent),
    warnings: firstArray(row.warnings, output.warnings, price.warnings).map(String),
  }
}

export function timelineFromScenario(scenario: ProductExperienceScenario, draftId: string): ProductExperienceTimelineDay[] {
  const sourceDays = scenario.days.length ? scenario.days : [{ dayNumber: 1, serviceDate: null, startTime: '08:00', endTime: '16:00', objective: scenario.promise, timeline: [] }]
  return sourceDays.map((day, dayIndex) => {
    const blocksSource = firstArray(day.timeline, day.blocks, day.programme, day.items)
    const startMinute = timeToMinute(day.startTime ?? day.start_time, 480)
    const endMinute = timeToMinute(day.endTime ?? day.end_time, Math.max(startMinute + 60, 960))
    const blocks: ProductExperienceTimelineBlock[] = blocksSource.map((raw, index) => {
      const block = obj(raw)
      const start = timeToMinute(block.startTime ?? block.start_time, startMinute + index * 45)
      const end = timeToMinute(block.endTime ?? block.end_time, start + Number(block.durationMinutes || block.duration_minutes || 45))
      return { id: text(block.id, `source-block-${dayIndex}-${index}`), dayId: `source-day-${dayIndex}`, sourceActivityId: block.sourceActivityId ? text(block.sourceActivityId) : block.source_activity_id ? text(block.source_activity_id) : null, sourceCode: block.sourceCode ? text(block.sourceCode) : block.source_code ? text(block.source_code) : null, blockType: text(block.sourceType || block.block_type || block.type, 'activity') as ProductExperienceTimelineBlock['blockType'], label: text(block.label || block.name, `Bloc ${index + 1}`), objective: text(block.objective || block.detail), startMinute: start, durationMinutes: Math.max(5, end - start), locked: Boolean(block.locked), sortOrder: index * 100, metadata: block }
    })
    return { id: `source-day-${dayIndex}`, draftId, sourceDayId: day.id ? text(day.id) : null, serviceDate: day.serviceDate ? text(day.serviceDate) : day.service_date ? text(day.service_date) : null, label: text(day.label || day.objective || day.progressionPhase, `Jour ${dayIndex + 1}`), startMinute, endMinute, sortOrder: dayIndex * 100, metadata: day, blocks }
  })
}

export function diffScenarios(scenarios: ProductExperienceScenario[]) {
  const entries = [
    ['promise', 'Promesse client', (s: ProductExperienceScenario) => s.promise || '—'],
    ['days', 'Jours', (s: ProductExperienceScenario) => s.days.length],
    ['activities', 'Activités locales', (s: ProductExperienceScenario) => s.selectedActivityIds.length],
    ['options', 'Options', (s: ProductExperienceScenario) => s.selectedOptionIds.length],
    ['price', 'Prix client', (s: ProductExperienceScenario) => s.customerTotalDh == null ? 'Sur devis' : s.customerTotalDh],
    ['cost', 'Coût', (s: ProductExperienceScenario) => s.costTotalDh == null ? '—' : s.costTotalDh],
    ['margin', 'Marge %', (s: ProductExperienceScenario) => s.marginPercent == null ? '—' : s.marginPercent],
    ['warnings', 'Avertissements', (s: ProductExperienceScenario) => s.warnings.length],
  ] as const
  return entries.map(([key, label, getter]) => ({ key, label, values: Object.fromEntries(scenarios.map((scenario) => [scenario.id, getter(scenario)])) }))
}

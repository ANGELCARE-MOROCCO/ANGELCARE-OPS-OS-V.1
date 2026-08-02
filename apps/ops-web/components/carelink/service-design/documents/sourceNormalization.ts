import type { ServiceDocumentDay, ServiceDocumentPriceLine, ServiceDocumentSite, ServiceDocumentSource, ServiceDocumentSourceKind } from './types'

type UnknownRecord = Record<string, unknown>
const record = (value: unknown): UnknownRecord => value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : {}
const text = (...values: unknown[]) => values.find((value) => typeof value === 'string' && value.trim()) as string | undefined
const numberValue = (...values: unknown[]) => { const value = values.find((item) => typeof item === 'number' || (typeof item === 'string' && item.trim() !== '' && Number.isFinite(Number(item)))); return value === undefined ? null : Number(value) }
const stringArray = (...values: unknown[]) => {
  for (const value of values) {
    if (Array.isArray(value)) return value.map((item) => typeof item === 'string' ? item : text(record(item).label, record(item).name, record(item).title, record(item).code)).filter(Boolean) as string[]
    if (typeof value === 'string' && value.trim()) return value.split(/[|,;\n]+/).map((item) => item.trim()).filter(Boolean)
  }
  return []
}
const rows = (value: unknown) => Array.isArray(value) ? value.map(record) : []

function normalizeBlocks(input: unknown): ServiceDocumentDay[] {
  const dayRows = rows(input)
  if (!dayRows.length) return []
  if (dayRows.some((day) => Array.isArray(day.blocks) || Array.isArray(day.timeline) || Array.isArray(day.programme_lines))) {
    return dayRows.map((day, index) => ({
      id: text(day.id), date: text(day.date, day.mission_date, day.service_date), label: text(day.label, day.name, day.title) || `Jour ${index + 1}`, phase: text(day.phase, day.progression_phase), objective: text(day.objective, day.daily_objective), start: text(day.start, day.start_time), end: text(day.end, day.end_time),
      blocks: rows(day.blocks || day.timeline || day.programme_lines).map((block) => ({ id: text(block.id), start: text(block.start, block.start_time, block.begins_at), end: text(block.end, block.end_time, block.ends_at), title: text(block.title, block.label, block.name, block.activity_name, block.block_type) || 'Bloc opérationnel', detail: text(block.detail, block.description, block.objective), activityCode: text(block.activity_code, block.code), type: text(block.type, block.block_type), evidence: stringArray(block.evidence, block.required_evidence) })),
    }))
  }
  const grouped = new Map<string, ServiceDocumentDay>()
  dayRows.forEach((block, index) => {
    const key = text(block.date, block.mission_date, block.service_date, block.day_id, block.day_index) || 'day-1'
    if (!grouped.has(key)) grouped.set(key, { date: text(block.date, block.mission_date, block.service_date), label: text(block.day_label) || `Jour ${grouped.size + 1}`, objective: text(block.daily_objective), blocks: [] })
    grouped.get(key)!.blocks.push({ id: text(block.id), start: text(block.start, block.start_time), end: text(block.end, block.end_time), title: text(block.title, block.label, block.name, block.activity_name) || `Bloc ${index + 1}`, detail: text(block.detail, block.description), activityCode: text(block.activity_code, block.code), type: text(block.type, block.block_type) })
  })
  return Array.from(grouped.values())
}

function normalizePriceLines(input: unknown): ServiceDocumentPriceLine[] {
  return rows(input).map((line) => ({ id: text(line.id), label: text(line.label, line.name, line.title, line.description, line.code) || 'Ligne tarifaire', quantity: numberValue(line.quantity, line.qty) ?? undefined, unitPrice: numberValue(line.unit_price, line.unitPrice, line.price), total: numberValue(line.total, line.line_total, line.amount), taxRate: numberValue(line.tax_rate, line.taxRate), note: text(line.note, line.description) }))
}

function normalizeSites(input: unknown): ServiceDocumentSite[] {
  return rows(input).map((site) => ({ id: text(site.id), code: text(site.code), name: text(site.name, site.title, site.site_name) || 'Site', city: text(site.city, site.location), beneficiaries: numberValue(site.beneficiaries, site.beneficiary_count, site.capacity), serviceWindow: text(site.service_window, site.hours), staffing: text(site.staffing, site.staffing_model), status: text(site.status) }))
}

export function blankServiceDocumentSource(kind: ServiceDocumentSourceKind, id?: string): ServiceDocumentSource {
  return { sourceKind: kind, sourceId: id, title: id ? `Document source ${id}` : 'Nouveau document Service Design', objectives: [], outcomes: [], painPoints: [], contexts: [], routines: [], activities: [], materials: [], competencies: [], staffing: [], safeguards: [], risks: [], checklists: [], reporting: [], routes: [], days: [], priceLines: [], sites: [], metrics: [], lineage: id ? [{ label: 'Source ID', value: id }] : [], approvals: [], notes: [], warnings: id ? ['La source n’a pas encore été résolue. Aucun contenu opérationnel n’est inventé.'] : [] }
}

export function normalizeServiceDocumentSource(kind: ServiceDocumentSourceKind, id: string | undefined, rootInput: unknown, related: Record<string, unknown> = {}, sourceTable?: string): ServiceDocumentSource {
  const root = record(rootInput)
  const timelineInput = related.days || related.blocks || root.days || root.timeline || root.programme || root.programme_lines
  const priceInput = related.priceLines || related.prices || root.price_lines || root.pricing || root.lines
  const source = blankServiceDocumentSource(kind, id)
  return {
    ...source,
    sourceTable,
    code: text(root.code, root.number, root.reference),
    reference: text(root.reference, root.number, root.code, id),
    title: text(root.title, root.name, root.service_name, root.product_name, root.display_name) || source.title,
    subtitle: text(root.subtitle, root.description, root.summary),
    version: text(root.version, root.version_number, root.version_code),
    status: text(root.status, root.state, root.publication_status),
    category: text(root.category_name, root.category, root.service_category, root.category_code),
    family: text(root.family_name, root.family, root.service_family),
    universe: text(root.universe, root.audience, root.market) || 'both',
    customerName: text(root.customer_name, root.client_name, root.account_name, root.customer),
    customerType: text(root.customer_type, root.client_type, root.segment),
    beneficiaryName: text(root.beneficiary_name, root.learner_name),
    beneficiaryProfile: text(root.beneficiary_profile, root.profile, root.age_band, root.age),
    location: text(root.location, root.address, root.city, root.venue),
    dateFrom: text(root.date_from, root.start_date, root.mission_date, root.valid_from),
    dateTo: text(root.date_to, root.end_date, root.valid_to),
    generatedAt: text(root.generated_at, root.created_at, root.updated_at),
    owner: text(root.owner_name, root.created_by_name, root.assignee_name),
    approver: text(root.approver_name, root.approved_by_name),
    executiveSummary: text(root.executive_summary, root.summary, root.description),
    promise: text(root.promise, root.customer_promise, root.value_proposition),
    objectives: stringArray(root.objectives, root.objective_codes, root.objective_labels),
    outcomes: stringArray(root.outcomes, root.desired_outcomes, root.outcome_codes),
    painPoints: stringArray(root.pain_points, root.painPoints),
    contexts: stringArray(root.contexts, root.usage_contexts, root.situations),
    routines: stringArray(root.routines, root.daily_routines),
    activities: stringArray(root.activities, related.activities, root.activity_codes),
    materials: stringArray(root.materials, related.materials, root.material_requirements),
    competencies: stringArray(root.competencies, related.competencies, root.required_competencies),
    staffing: stringArray(root.staffing, related.staffing, root.staffing_requirements),
    safeguards: stringArray(root.safeguards, related.safeguards, root.preventive_controls),
    risks: stringArray(root.risks, related.risks, root.risk_controls),
    checklists: stringArray(root.checklists, related.checklists, root.checklist_items),
    reporting: stringArray(root.reporting, related.reporting, root.report_fields),
    routes: stringArray(root.routes, related.routes, root.transport_plan),
    days: normalizeBlocks(timelineInput),
    priceLines: normalizePriceLines(priceInput),
    currency: text(root.currency, root.currency_code) || 'Dh',
    subtotal: numberValue(root.subtotal, root.subtotal_amount),
    tax: numberValue(root.tax, root.tax_amount),
    total: numberValue(root.total, root.total_amount, root.customer_total),
    cost: numberValue(root.cost, root.total_cost),
    margin: numberValue(root.margin, root.margin_amount, root.margin_percent),
    sites: normalizeSites(related.sites || root.sites),
    metrics: rows(related.metrics || root.metrics).map((metric) => ({ label: text(metric.label, metric.name) || 'Indicateur', value: text(metric.value, metric.display_value) || String(metric.value ?? '—'), detail: text(metric.detail, metric.description) })),
    lineage: rows(related.lineage || root.lineage).map((item) => ({ label: text(item.label, item.type) || 'Référence', value: text(item.value, item.code, item.id) || '—' })).concat(sourceTable ? [{ label: 'Table source', value: sourceTable }] : []),
    approvals: rows(related.approvals || root.approvals).map((item) => ({ authority: text(item.authority, item.actor_name, item.approver_name), decision: text(item.decision, item.status), date: text(item.date, item.decided_at, item.created_at), note: text(item.note, item.reason) })),
    notes: stringArray(root.notes, related.notes, root.internal_notes),
    warnings: stringArray(root.warnings, related.warnings),
    raw: root,
  }
}

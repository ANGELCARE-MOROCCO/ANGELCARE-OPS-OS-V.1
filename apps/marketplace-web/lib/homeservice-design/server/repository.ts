import crypto from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { HSD_DOSSIER_SECTIONS, HSD_TENANT_ID } from '@/lib/homeservice-design/constants'
import type {
  ActivityBlock, ApprovalItem, AuditEvent, CapacityRule, CategoryDossier, Competency, ConfigurationImport,
  DoctrineRule, HsdDecision, RiskControl, SearchHit, ServiceCategory, ServiceDesignMetrics, ServiceDesignSnapshot,
  ServiceFamily,
} from '@/types/homeservice-design'
import { userId, userLabel, type HomeServiceUser } from './auth'
import { booleanValue, code, jsonObject, numberValue, objectInput, oneOf, stringArray, text, timeValue } from './validation'
import { validateCsv } from './csv'

const TENANT = HSD_TENANT_ID

type Row = Record<string, any>
type SupabaseClient = any

function arr(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string') {
    try { const parsed = JSON.parse(value); if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean) } catch {}
    return value.split(/[|,;]/).map((item) => item.trim()).filter(Boolean)
  }
  return []
}

function rec(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>
  return {}
}

function num(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function iso(value: unknown) {
  return value ? String(value) : null
}

function mapFamily(row: Row): ServiceFamily {
  return {
    id: String(row.id), tenantId: String(row.tenant_id || TENANT), code: String(row.code || ''), nameFr: String(row.name_fr || ''),
    descriptionFr: String(row.description_fr || ''), iconKey: String(row.icon_key || 'sparkles'), sortOrder: num(row.sort_order),
    status: 'draft', categoryCount: num(row.category_count), readinessScore: num(row.readiness_score),
  }
}

function mapCategory(row: Row): ServiceCategory {
  return {
    id: String(row.id), tenantId: String(row.tenant_id || TENANT), familyId: String(row.family_id || ''),
    familyCode: row.family_code ? String(row.family_code) : undefined, familyName: row.family_name ? String(row.family_name) : undefined,
    code: String(row.code || ''), commercialNameFr: String(row.commercial_name_fr || ''), operationalNameFr: String(row.operational_name_fr || ''),
    descriptionFr: String(row.description_fr || ''), carelinkServiceType: row.carelink_service_type ? String(row.carelink_service_type) : null,
    audience: row.audience || 'both', cities: arr(row.cities), languages: arr(row.languages), beneficiaryProfiles: arr(row.beneficiary_profiles),
    missionFormats: arr(row.mission_formats), status: 'draft', versionNumber: num(row.version_number || 1),
    doctrineReadiness: num(row.doctrine_readiness), capacityReadiness: num(row.capacity_readiness), activityReadiness: num(row.activity_readiness),
    staffingReadiness: num(row.staffing_readiness), safetyReadiness: num(row.safety_readiness), qualityReadiness: num(row.quality_readiness),
    commercialReadiness: num(row.commercial_readiness), overallReadiness: num(row.overall_readiness), blockers: arr(row.blockers),
    createdAt: iso(row.created_at), updatedAt: iso(row.updated_at),
  }
}

function mapDoctrine(row: Row): DoctrineRule {
  return {
    id: String(row.id), categoryId: String(row.category_id), categoryCode: row.category_code, categoryName: row.category_name,
    code: String(row.code || ''), kind: row.kind || 'mandatory', titleFr: String(row.title_fr || ''), descriptionFr: String(row.description_fr || ''),
    severity: row.severity || 'important', mandatory: Boolean(row.mandatory), blocking: Boolean(row.blocking), applicability: rec(row.applicability),
    requiredEvidence: arr(row.required_evidence), escalationRoute: row.escalation_route ? String(row.escalation_route) : null,
    status: 'draft', versionNumber: num(row.version_number || 1), effectiveFrom: iso(row.effective_from), effectiveTo: iso(row.effective_to),
    createdAt: iso(row.created_at), updatedAt: iso(row.updated_at),
  }
}

function mapCapacity(row: Row): CapacityRule {
  return {
    id: String(row.id), categoryId: String(row.category_id), categoryCode: row.category_code, categoryName: row.category_name,
    minimumHours: num(row.minimum_hours), maximumHours: num(row.maximum_hours), maximumConsecutiveDays: num(row.maximum_consecutive_days),
    maximumNonConsecutiveDays: num(row.maximum_non_consecutive_days), earliestStartTime: String(row.earliest_start_time || '06:00').slice(0, 5),
    latestEndTime: String(row.latest_end_time || '23:00').slice(0, 5), maxBeneficiariesPerAgent: num(row.max_beneficiaries_per_agent),
    minimumAgents: num(row.minimum_agents), backupRequired: Boolean(row.backup_required), supervisorRequired: Boolean(row.supervisor_required),
    leadTimeHours: num(row.lead_time_hours), nightAllowed: Boolean(row.night_allowed), weekendAllowed: Boolean(row.weekend_allowed),
    holidayAllowed: Boolean(row.holiday_allowed), allowedCities: arr(row.allowed_cities), conditions: rec(row.conditions),
    status: 'draft', updatedAt: iso(row.updated_at),
  }
}

function mapActivity(row: Row): ActivityBlock {
  return {
    id: String(row.id), code: String(row.code || ''), nameFr: String(row.name_fr || ''), descriptionFr: String(row.description_fr || ''),
    blockType: String(row.block_type || 'activity'), objectiveCodes: arr(row.objective_codes), categoryCodes: arr(row.category_codes),
    ageMinMonths: row.age_min_months === null || row.age_min_months === undefined ? null : num(row.age_min_months),
    ageMaxMonths: row.age_max_months === null || row.age_max_months === undefined ? null : num(row.age_max_months),
    minMinutes: num(row.min_minutes), maxMinutes: num(row.max_minutes), energyLevel: row.energy_level || 'moderate',
    locationType: row.location_type || 'indoor', materials: arr(row.materials), competencyCodes: arr(row.competency_codes),
    riskCodes: arr(row.risk_codes), evidenceCodes: arr(row.evidence_codes), repetitionLimitPerDay: num(row.repetition_limit_per_day || 1),
    status: 'draft', versionNumber: num(row.version_number || 1), updatedAt: iso(row.updated_at),
  }
}

function mapCompetency(row: Row): Competency {
  return {
    id: String(row.id), code: String(row.code || ''), nameFr: String(row.name_fr || ''), family: String(row.family || 'general'),
    descriptionFr: String(row.description_fr || ''), evidenceType: String(row.evidence_type || 'declaration'),
    renewalMonths: row.renewal_months === null || row.renewal_months === undefined ? null : num(row.renewal_months),
    status: 'draft', categoryCount: num(row.category_count),
  }
}

function mapRisk(row: Row): RiskControl {
  return {
    id: String(row.id), code: String(row.code || ''), nameFr: String(row.name_fr || ''), descriptionFr: String(row.description_fr || ''),
    severity: row.severity || 'important', triggerConditions: arr(row.trigger_conditions), preventiveControls: arr(row.preventive_controls),
    requiredEvidence: arr(row.required_evidence), stopWork: Boolean(row.stop_work), escalationRoute: String(row.escalation_route || ''),
    categoryCodes: arr(row.category_codes), status: 'draft',
  }
}

function mapImport(row: Row): ConfigurationImport {
  return {
    id: String(row.id), importType: String(row.import_type || ''), fileName: String(row.file_name || ''), checksum: String(row.checksum || ''),
    status: row.status || 'staged', totalRows: num(row.total_rows), validRows: num(row.valid_rows), invalidRows: num(row.invalid_rows),
    duplicateRows: num(row.duplicate_rows), committedRows: num(row.committed_rows), createdBy: String(row.created_by || ''), createdAt: iso(row.created_at), committedAt: iso(row.committed_at),
  }
}

function mapApproval(row: Row): ApprovalItem {
  return {
    id: String(row.id), entityType: String(row.entity_type || ''), entityId: String(row.entity_id || ''), entityLabel: String(row.entity_label || ''),
    approvalType: String(row.approval_type || ''), requestedBy: String(row.requested_by || ''), requestedAt: iso(row.requested_at),
    assignedRole: String(row.assigned_role || ''), status: row.status || 'pending', consequenceSummary: String(row.consequence_summary || ''),
    blockerSummary: arr(row.blocker_summary), evidenceCount: num(row.evidence_count),
  }
}

function mapAudit(row: Row): AuditEvent {
  return {
    id: String(row.id), actorId: String(row.actor_id || ''), actorLabel: String(row.actor_label || ''), action: String(row.action || ''),
    entityType: String(row.entity_type || ''), entityId: String(row.entity_id || ''), entityLabel: String(row.entity_label || ''),
    fromState: iso(row.from_state), toState: iso(row.to_state), reason: iso(row.reason), consequence: iso(row.consequence),
    correlationId: String(row.correlation_id || ''), createdAt: iso(row.created_at),
  }
}

async function client(): Promise<SupabaseClient> { return await createClient() as any }

async function rows(table: string, options: { limit?: number; order?: string; ascending?: boolean } = {}) {
  const supabase = await client()
  let query = supabase.from(table).select('*').eq('tenant_id', TENANT)
  if (options.order) query = query.order(options.order, { ascending: options.ascending ?? true })
  if (options.limit) query = query.limit(options.limit)
  const { data, error } = await query
  if (error) throw error
  return (data || []) as Row[]
}

function emptyMetrics(): ServiceDesignMetrics {
  return { families: 0, categories: 0, activeCategories: 0, categoriesReady: 0, categoriesBlocked: 0, averageReadiness: 0,
    doctrineRules: 0, blockingRules: 0, activityBlocks: 0, competencies: 0, risks: 0, safetyBlockers: 0,
    pendingApprovals: 0, importsRequiringDecision: 0, carelinkMappedCategories: 0 }
}

export async function getServiceDesignSnapshot(): Promise<ServiceDesignSnapshot> {
  try {
    const [familyRows, categoryRows, doctrineRows, capacityRows, activityRows, competencyRows, riskRows, importRows, approvalRows, auditRows] = await Promise.all([
      rows('hsd_v_service_families', { order: 'sort_order' }), rows('hsd_v_category_readiness', { order: 'family_sort_order' }),
      rows('hsd_v_doctrine_rules', { limit: 500, order: 'updated_at', ascending: false }), rows('hsd_v_capacity_rules', { limit: 300, order: 'updated_at', ascending: false }),
      rows('hsd_v_activity_library', { limit: 500, order: 'name_fr' }), rows('hsd_v_competencies', { limit: 300, order: 'name_fr' }),
      rows('hsd_v_risk_controls', { limit: 300, order: 'severity_rank' }), rows('hsd_configuration_imports', { limit: 100, order: 'created_at', ascending: false }),
      rows('hsd_approvals', { limit: 100, order: 'requested_at', ascending: false }), rows('hsd_audit_events', { limit: 100, order: 'created_at', ascending: false }),
    ])
    const families = familyRows.map(mapFamily)
    const categories = categoryRows.map(mapCategory)
    const doctrineRules = doctrineRows.map(mapDoctrine)
    const capacityRules = capacityRows.map(mapCapacity)
    const activities = activityRows.map(mapActivity)
    const competencies = competencyRows.map(mapCompetency)
    const risks = riskRows.map(mapRisk)
    const imports = importRows.map(mapImport)
    const approvals = approvalRows.map(mapApproval)
    const auditEvents = auditRows.map(mapAudit)
    const metrics: ServiceDesignMetrics = {
      families: families.length, categories: categories.length,
      activeCategories: categories.filter((item) => item.status === 'active' || item.status === 'approved').length,
      categoriesReady: categories.filter((item) => item.overallReadiness >= 85).length,
      categoriesBlocked: categories.filter((item) => item.blockers.length > 0 || item.status === 'blocked').length,
      averageReadiness: categories.length ? Math.round(categories.reduce((sum, item) => sum + item.overallReadiness, 0) / categories.length) : 0,
      doctrineRules: doctrineRules.length, blockingRules: doctrineRules.filter((item) => item.blocking).length,
      activityBlocks: activities.length, competencies: competencies.length, risks: risks.length,
      safetyBlockers: risks.filter((item) => item.stopWork || item.severity === 'blocking').length,
      pendingApprovals: approvals.filter((item) => item.status === 'pending').length,
      importsRequiringDecision: imports.filter((item) => ['staged', 'validated', 'partially_valid'].includes(item.status)).length,
      carelinkMappedCategories: categories.filter((item) => Boolean(item.carelinkServiceType)).length,
    }
    return { databaseReady: true, generatedAt: new Date().toISOString(), metrics, families, categories, doctrineRules, capacityRules,
      activities, competencies, risks, imports, approvals, auditEvents, warnings: [] }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Base de données HomeService Design indisponible.'
    return { databaseReady: false, generatedAt: new Date().toISOString(), metrics: emptyMetrics(), families: [], categories: [], doctrineRules: [],
      capacityRules: [], activities: [], competencies: [], risks: [], imports: [], approvals: [], auditEvents: [],
      warnings: [`La migration UMZ1 doit être appliquée ou la connexion doit être rétablie. Détail: ${message}`] }
  }
}

export async function getCategoryDossier(categoryId: string): Promise<CategoryDossier | null> {
  const supabase = await client()
  const { data: category, error } = await supabase.from('hsd_v_category_readiness').select('*').eq('tenant_id', TENANT).eq('id', categoryId).maybeSingle()
  if (error) throw error
  if (!category) return null
  const [{ data: sections }, { data: doctrines }, { data: capacity }, { data: activities }, { data: competencies }, { data: risks },
    { data: features }, { data: topups }, { data: upsells }, { data: materials }, { data: checklists }, { data: reports }, { data: prices }] = await Promise.all([
    supabase.from('hsd_dossier_sections').select('*').eq('tenant_id', TENANT).eq('category_id', categoryId).order('sort_order'),
    supabase.from('hsd_v_doctrine_rules').select('*').eq('tenant_id', TENANT).eq('category_id', categoryId).order('code'),
    supabase.from('hsd_v_capacity_rules').select('*').eq('tenant_id', TENANT).eq('category_id', categoryId).maybeSingle(),
    supabase.from('hsd_v_activity_library').select('*').eq('tenant_id', TENANT).order('name_fr'),
    supabase.from('hsd_v_competencies').select('*').contains('category_codes', [category.code]).order('name_fr'),
    supabase.from('hsd_v_risk_controls').select('*').eq('tenant_id', TENANT).order('severity_rank'),
    supabase.from('hsd_service_options').select('*').eq('tenant_id', TENANT).eq('category_id', categoryId).eq('option_type', 'feature').order('sort_order'),
    supabase.from('hsd_service_options').select('*').eq('tenant_id', TENANT).eq('category_id', categoryId).eq('option_type', 'topup').order('sort_order'),
    supabase.from('hsd_service_options').select('*').eq('tenant_id', TENANT).eq('category_id', categoryId).eq('option_type', 'upsell').order('sort_order'),
    supabase.from('hsd_v_category_materials').select('*').eq('tenant_id', TENANT).eq('category_id', categoryId).order('name_fr'),
    supabase.from('hsd_v_checklist_templates').select('*').eq('tenant_id', TENANT).eq('category_id', categoryId).order('name_fr'),
    supabase.from('hsd_v_report_templates').select('*').eq('tenant_id', TENANT).eq('category_id', categoryId).order('name_fr'),
    supabase.from('hsd_v_price_entries').select('*').eq('tenant_id', TENANT).eq('category_id', categoryId).order('effective_from', { ascending: false }),
  ])
  const mapped = mapCategory(category)
  return {
    ...mapped,
    sections: (sections || []).map((row: Row) => ({ id: String(row.id), categoryId: String(row.category_id), sectionCode: String(row.section_code),
      titleFr: String(row.title_fr), purposeFr: String(row.purpose_fr), status: 'draft', completionPercent: num(row.completion_percent),
      blockerCount: num(row.blocker_count), ownerRole: String(row.owner_role || ''), sortOrder: num(row.sort_order), approvedAt: iso(row.approved_at) })),
    doctrineRules: (doctrines || []).map(mapDoctrine), capacityRule: capacity ? mapCapacity(capacity) : null,
    activities: (activities || []).filter((row: Row) => !arr(row.category_codes).length || arr(row.category_codes).includes(String(category.code))).map(mapActivity), competencies: (competencies || []).map(mapCompetency), risks: (risks || []).filter((row: Row) => !arr(row.category_codes).length || arr(row.category_codes).includes(String(category.code))).map(mapRisk),
    features: features || [], topups: topups || [], upsells: upsells || [], materials: materials || [],
    checklistTemplates: checklists || [], reportTemplates: reports || [], priceEntries: prices || [],
  }
}

async function writeAudit(supabase: SupabaseClient, user: HomeServiceUser, input: { action: string; entityType: string; entityId: string; entityLabel: string; fromState?: string | null; toState?: string | null; reason?: string | null; consequence?: string | null; payload?: Record<string, unknown> }) {
  const correlationId = crypto.randomUUID()
  const event = { tenant_id: TENANT, actor_id: userId(user), actor_label: userLabel(user), action: input.action, entity_type: input.entityType,
    entity_id: input.entityId, entity_label: input.entityLabel, from_state: input.fromState || null, to_state: input.toState || null,
    reason: input.reason || null, consequence: input.consequence || null, payload: input.payload || {}, correlation_id: correlationId }
  const { error: auditError } = await supabase.from('hsd_audit_events').insert(event)
  if (auditError) throw auditError
  const { error: outboxError } = await supabase.from('hsd_outbox_events').insert({ tenant_id: TENANT, event_type: `homeservice_design.${input.action}`,
    aggregate_type: input.entityType, aggregate_id: input.entityId, payload: { ...event, correlation_id: correlationId }, correlation_id: correlationId })
  if (outboxError) throw outboxError
  return correlationId
}

export async function createServiceFamily(payload: unknown, user: HomeServiceUser) {
  const input = objectInput(payload)
  const body = { tenant_id: TENANT, code: code(input.code), name_fr: text(input.nameFr || input.name_fr, 'Nom de la famille', { min: 3, max: 120 }),
    description_fr: text(input.descriptionFr || input.description_fr, 'Description', { min: 10, max: 1200 }), icon_key: text(input.iconKey || 'sparkles', 'Icône', { max: 50 }),
    sort_order: numberValue(input.sortOrder ?? input.sort_order ?? 100, 'Ordre', { min: 0, max: 999, integer: true }), status: 'draft' }
  const supabase = await client()
  const { data, error } = await supabase.from('hsd_service_families').insert(body).select('*').single()
  if (error) throw error
  const correlationId = await writeAudit(supabase, user, { action: 'family_created', entityType: 'service_family', entityId: String(data.id), entityLabel: body.name_fr, toState: 'draft', consequence: 'Nouvelle famille de services disponible pour structuration.' })
  return { data: mapFamily(data), correlationId }
}

export async function createServiceCategory(payload: unknown, user: HomeServiceUser) {
  const input = objectInput(payload)
  const audience = oneOf(input.audience ?? 'both', 'Audience', ['b2c', 'b2b', 'both'] as const, 'both')
  const body = { tenant_id: TENANT, family_id: text(input.familyId || input.family_id, 'Famille'), code: code(input.code),
    commercial_name_fr: text(input.commercialNameFr || input.commercial_name_fr, 'Nom commercial', { min: 4, max: 180 }),
    operational_name_fr: text(input.operationalNameFr || input.operational_name_fr, 'Nom opérationnel', { min: 4, max: 180 }),
    description_fr: text(input.descriptionFr || input.description_fr, 'Description', { min: 20, max: 2000 }),
    carelink_service_type: text(input.carelinkServiceType || input.carelink_service_type || '', 'Type CARELINK', { optional: true, max: 250 }) || null,
    audience, cities: stringArray(input.cities), languages: stringArray(input.languages), beneficiary_profiles: stringArray(input.beneficiaryProfiles || input.beneficiary_profiles),
    mission_formats: stringArray(input.missionFormats || input.mission_formats), status: 'draft', version_number: 1,
    created_by: userId(user), updated_by: userId(user) }
  const supabase = await client()
  const { data, error } = await supabase.from('hsd_service_categories').insert(body).select('*').single()
  if (error) throw error
  const sectionRows = HSD_DOSSIER_SECTIONS.map(([sectionCode, titleFr, purposeFr], index) => ({ tenant_id: TENANT, category_id: data.id, section_code: sectionCode,
    title_fr: titleFr, purpose_fr: purposeFr, status: 'draft', completion_percent: 0, blocker_count: 0, owner_role: 'À affecter', sort_order: index + 1 }))
  const { error: sectionError } = await supabase.from('hsd_dossier_sections').insert(sectionRows)
  if (sectionError) throw sectionError
  const correlationId = await writeAudit(supabase, user, { action: 'category_created', entityType: 'service_category', entityId: String(data.id), entityLabel: body.commercial_name_fr, toState: 'draft', consequence: 'Un dossier complet de 18 sections a été ouvert.' })
  return { data: mapCategory(data), correlationId }
}

export async function updateServiceCategory(categoryId: string, payload: unknown, user: HomeServiceUser) {
  const input = objectInput(payload)
  const supabase = await client()
  const { data: before, error: beforeError } = await supabase.from('hsd_service_categories').select('*').eq('tenant_id', TENANT).eq('id', categoryId).single()
  if (beforeError) throw beforeError
  const patch: Row = { updated_by: userId(user), updated_at: new Date().toISOString() }
  if (input.commercialNameFr !== undefined) patch.commercial_name_fr = text(input.commercialNameFr, 'Nom commercial', { min: 4, max: 180 })
  if (input.operationalNameFr !== undefined) patch.operational_name_fr = text(input.operationalNameFr, 'Nom opérationnel', { min: 4, max: 180 })
  if (input.descriptionFr !== undefined) patch.description_fr = text(input.descriptionFr, 'Description', { min: 20, max: 2000 })
  if (input.status !== undefined) patch.status = oneOf(input.status, 'Statut', ['draft', 'active', 'review', 'approved', 'blocked', 'suspended', 'retired', 'archived'] as const)
  if (input.cities !== undefined) patch.cities = stringArray(input.cities)
  if (input.languages !== undefined) patch.languages = stringArray(input.languages)
  if (input.beneficiaryProfiles !== undefined) patch.beneficiary_profiles = stringArray(input.beneficiaryProfiles)
  if (input.missionFormats !== undefined) patch.mission_formats = stringArray(input.missionFormats)
  const { data, error } = await supabase.from('hsd_service_categories').update(patch).eq('tenant_id', TENANT).eq('id', categoryId).select('*').single()
  if (error) throw error
  const correlationId = await writeAudit(supabase, user, { action: 'category_updated', entityType: 'service_category', entityId: categoryId, entityLabel: String(data.commercial_name_fr), fromState: before.status, toState: data.status, reason: text(input.reason || 'Mise à jour structurée du dossier.', 'Motif', { max: 500 }), consequence: 'La préparation et les dépendances seront recalculées.' })
  return { data: mapCategory(data), correlationId }
}

export async function createDoctrineRule(payload: unknown, user: HomeServiceUser) {
  const input = objectInput(payload)
  const body = { tenant_id: TENANT, category_id: text(input.categoryId || input.category_id, 'Catégorie'), code: code(input.code),
    kind: oneOf(input.kind || 'mandatory', 'Type de règle', ['mandatory', 'recommended', 'conditional', 'prohibited', 'blocking', 'escalation'] as const, 'mandatory'),
    title_fr: text(input.titleFr || input.title_fr, 'Titre', { min: 4, max: 200 }), description_fr: text(input.descriptionFr || input.description_fr, 'Description', { min: 15, max: 3000 }),
    severity: oneOf(input.severity || 'important', 'Sévérité', ['information', 'attention', 'important', 'critical', 'blocking'] as const, 'important'),
    mandatory: booleanValue(input.mandatory ?? true), blocking: booleanValue(input.blocking), applicability: jsonObject(input.applicability),
    required_evidence: stringArray(input.requiredEvidence || input.required_evidence), escalation_route: text(input.escalationRoute || input.escalation_route || '', 'Escalade', { optional: true, max: 500 }) || null,
    status: 'draft', version_number: 1, created_by: userId(user), updated_by: userId(user) }
  const supabase = await client()
  const { data, error } = await supabase.from('hsd_doctrine_rules').insert(body).select('*').single()
  if (error) throw error
  const correlationId = await writeAudit(supabase, user, { action: 'doctrine_rule_created', entityType: 'doctrine_rule', entityId: String(data.id), entityLabel: body.title_fr, toState: 'draft', consequence: body.blocking ? 'Cette règle peut bloquer la validation technique.' : 'Cette règle rejoint le référentiel de doctrine.' })
  return { data: mapDoctrine(data), correlationId }
}

export async function upsertCapacityRule(payload: unknown, user: HomeServiceUser) {
  const input = objectInput(payload)
  const minimumHours = numberValue(input.minimumHours ?? input.minimum_hours, 'Durée minimale', { min: 0.5, max: 24 }) as number
  const maximumHours = numberValue(input.maximumHours ?? input.maximum_hours, 'Durée maximale', { min: minimumHours, max: 24 }) as number
  const body = { tenant_id: TENANT, category_id: text(input.categoryId || input.category_id, 'Catégorie'), minimum_hours: minimumHours,
    maximum_hours: maximumHours, maximum_consecutive_days: numberValue(input.maximumConsecutiveDays ?? input.maximum_consecutive_days ?? 14, 'Jours consécutifs', { min: 1, max: 365, integer: true }),
    maximum_non_consecutive_days: numberValue(input.maximumNonConsecutiveDays ?? input.maximum_non_consecutive_days ?? 60, 'Jours non consécutifs', { min: 1, max: 365, integer: true }),
    earliest_start_time: timeValue(input.earliestStartTime ?? input.earliest_start_time ?? '06:00', 'Heure la plus tôt'), latest_end_time: timeValue(input.latestEndTime ?? input.latest_end_time ?? '23:00', 'Heure la plus tard'),
    max_beneficiaries_per_agent: numberValue(input.maxBeneficiariesPerAgent ?? input.max_beneficiaries_per_agent ?? 1, 'Ratio bénéficiaires', { min: 1, max: 50, integer: true }),
    minimum_agents: numberValue(input.minimumAgents ?? input.minimum_agents ?? 1, 'Nombre minimum d’agents', { min: 1, max: 50, integer: true }),
    backup_required: booleanValue(input.backupRequired ?? input.backup_required), supervisor_required: booleanValue(input.supervisorRequired ?? input.supervisor_required),
    lead_time_hours: numberValue(input.leadTimeHours ?? input.lead_time_hours ?? 24, 'Préavis', { min: 0, max: 8760, integer: true }),
    night_allowed: booleanValue(input.nightAllowed ?? input.night_allowed), weekend_allowed: booleanValue(input.weekendAllowed ?? input.weekend_allowed ?? true),
    holiday_allowed: booleanValue(input.holidayAllowed ?? input.holiday_allowed ?? true), allowed_cities: stringArray(input.allowedCities || input.allowed_cities),
    conditions: jsonObject(input.conditions), status: 'draft', updated_by: userId(user) }
  const supabase = await client()
  const { data, error } = await supabase.from('hsd_capacity_rules').upsert(body, { onConflict: 'tenant_id,category_id' }).select('*').single()
  if (error) throw error
  const correlationId = await writeAudit(supabase, user, { action: 'capacity_rule_upserted', entityType: 'capacity_rule', entityId: String(data.id), entityLabel: `Capacité ${body.minimum_hours}–${body.maximum_hours}h`, toState: 'draft', consequence: 'Les futures demandes seront contrôlées contre cette enveloppe.' })
  return { data: mapCapacity(data), correlationId }
}

export async function createActivityBlock(payload: unknown, user: HomeServiceUser) {
  const input = objectInput(payload)
  const minMinutes = numberValue(input.minMinutes ?? input.min_minutes, 'Durée minimale', { min: 5, max: 1440, integer: true }) as number
  const maxMinutes = numberValue(input.maxMinutes ?? input.max_minutes, 'Durée maximale', { min: minMinutes, max: 1440, integer: true }) as number
  const body = { tenant_id: TENANT, code: code(input.code), name_fr: text(input.nameFr || input.name_fr, 'Nom de l’activité', { min: 3, max: 180 }),
    description_fr: text(input.descriptionFr || input.description_fr, 'Description', { min: 10, max: 2000 }), block_type: text(input.blockType || input.block_type || 'activity', 'Type', { max: 80 }),
    objective_codes: stringArray(input.objectiveCodes || input.objective_codes), category_codes: stringArray(input.categoryCodes || input.category_codes),
    age_min_months: numberValue(input.ageMinMonths ?? input.age_min_months, 'Âge minimum', { min: 0, max: 1200, integer: true, optional: true }),
    age_max_months: numberValue(input.ageMaxMonths ?? input.age_max_months, 'Âge maximum', { min: 0, max: 1200, integer: true, optional: true }),
    min_minutes: minMinutes, max_minutes: maxMinutes, energy_level: oneOf(input.energyLevel || input.energy_level || 'moderate', 'Énergie', ['low', 'moderate', 'high', 'variable'] as const, 'moderate'),
    location_type: oneOf(input.locationType || input.location_type || 'indoor', 'Lieu', ['indoor', 'outdoor', 'transport', 'hybrid'] as const, 'indoor'),
    materials: stringArray(input.materials), competency_codes: stringArray(input.competencyCodes || input.competency_codes), risk_codes: stringArray(input.riskCodes || input.risk_codes),
    evidence_codes: stringArray(input.evidenceCodes || input.evidence_codes), repetition_limit_per_day: numberValue(input.repetitionLimitPerDay ?? input.repetition_limit_per_day ?? 1, 'Limite de répétition', { min: 1, max: 24, integer: true }),
    status: 'draft', version_number: 1, created_by: userId(user), updated_by: userId(user) }
  const supabase = await client()
  const { data, error } = await supabase.from('hsd_activity_library').insert(body).select('*').single()
  if (error) throw error
  const correlationId = await writeAudit(supabase, user, { action: 'activity_created', entityType: 'activity_block', entityId: String(data.id), entityLabel: body.name_fr, toState: 'draft', consequence: 'Le bloc pourra être utilisé par le moteur de planification après validation.' })
  return { data: mapActivity(data), correlationId }
}

export async function createCompetency(payload: unknown, user: HomeServiceUser) {
  const input = objectInput(payload)
  const body = { tenant_id: TENANT, code: code(input.code), name_fr: text(input.nameFr || input.name_fr, 'Compétence', { min: 3, max: 180 }),
    family: text(input.family || 'general', 'Famille', { max: 80 }), description_fr: text(input.descriptionFr || input.description_fr, 'Description', { min: 10, max: 2000 }),
    evidence_type: text(input.evidenceType || input.evidence_type || 'validation_manageriale', 'Preuve', { max: 120 }),
    renewal_months: numberValue(input.renewalMonths ?? input.renewal_months, 'Renouvellement', { min: 1, max: 240, integer: true, optional: true }), status: 'draft', created_by: userId(user), updated_by: userId(user) }
  const supabase = await client()
  const { data, error } = await supabase.from('hsd_competencies').insert(body).select('*').single()
  if (error) throw error
  const correlationId = await writeAudit(supabase, user, { action: 'competency_created', entityType: 'competency', entityId: String(data.id), entityLabel: body.name_fr, toState: 'draft', consequence: 'La compétence peut maintenant être liée aux catégories et activités.' })
  return { data: mapCompetency(data), correlationId }
}

export async function createRiskControl(payload: unknown, user: HomeServiceUser) {
  const input = objectInput(payload)
  const body = { tenant_id: TENANT, code: code(input.code), name_fr: text(input.nameFr || input.name_fr, 'Risque', { min: 3, max: 180 }),
    description_fr: text(input.descriptionFr || input.description_fr, 'Description', { min: 10, max: 2000 }),
    severity: oneOf(input.severity || 'important', 'Sévérité', ['information', 'attention', 'important', 'critical', 'blocking'] as const, 'important'),
    trigger_conditions: stringArray(input.triggerConditions || input.trigger_conditions), preventive_controls: stringArray(input.preventiveControls || input.preventive_controls),
    required_evidence: stringArray(input.requiredEvidence || input.required_evidence), stop_work: booleanValue(input.stopWork ?? input.stop_work),
    escalation_route: text(input.escalationRoute || input.escalation_route || 'Supervision CARELINK', 'Escalade', { max: 500 }),
    category_codes: stringArray(input.categoryCodes || input.category_codes), status: 'draft', created_by: userId(user), updated_by: userId(user) }
  const supabase = await client()
  const { data, error } = await supabase.from('hsd_risk_controls').insert(body).select('*').single()
  if (error) throw error
  const correlationId = await writeAudit(supabase, user, { action: 'risk_created', entityType: 'risk_control', entityId: String(data.id), entityLabel: body.name_fr, toState: 'draft', consequence: body.stop_work ? 'Ce risque peut arrêter une préparation ou une mission.' : 'Ce risque rejoint le référentiel de prévention.' })
  return { data: mapRisk(data), correlationId }
}

export async function stageConfigurationImport(payload: unknown, user: HomeServiceUser) {
  const input = objectInput(payload)
  const importType = text(input.importType || input.import_type, 'Type d’import')
  const fileName = text(input.fileName || input.file_name, 'Nom du fichier', { max: 250 })
  const content = text(input.content, 'Contenu CSV', { min: 3, max: 10_000_000 })
  const result = validateCsv(importType, content)
  const supabase = await client()
  const status = result.invalidRows === 0 ? 'validated' : result.validRows > 0 ? 'partially_valid' : 'rejected'
  const { data: batch, error } = await supabase.from('hsd_configuration_imports').insert({ tenant_id: TENANT, import_type: importType,
    file_name: fileName, checksum: result.checksum, status, total_rows: result.rows.length, valid_rows: result.validRows,
    invalid_rows: result.invalidRows, duplicate_rows: result.duplicateRows, source_content: content, headers: result.headers, created_by: userId(user) }).select('*').single()
  if (error) throw error
  if (result.rows.length) {
    const invalidNumbers = new Set(result.issues.filter((item) => item.severity === 'error').map((item) => item.rowNumber))
    const rowPayload = result.rows.map((row, index) => ({ tenant_id: TENANT, import_id: batch.id, row_number: index + 2, raw_data: row,
      normalized_data: row, status: invalidNumbers.has(index + 2) ? 'invalid' : 'valid' }))
    const { error: rowError } = await supabase.from('hsd_configuration_import_rows').insert(rowPayload)
    if (rowError) throw rowError
  }
  if (result.issues.length) {
    const { error: issueError } = await supabase.from('hsd_configuration_import_issues').insert(result.issues.map((issue) => ({ tenant_id: TENANT,
      import_id: batch.id, row_number: issue.rowNumber, field_name: issue.field, issue_code: issue.code, message_fr: issue.message, severity: issue.severity })))
    if (issueError) throw issueError
  }
  const correlationId = await writeAudit(supabase, user, { action: 'configuration_import_staged', entityType: 'configuration_import', entityId: String(batch.id), entityLabel: fileName, toState: status, consequence: `${result.validRows} ligne(s) valide(s), ${result.invalidRows} invalide(s), ${result.duplicateRows} doublon(s).` })
  return { data: { batch: mapImport(batch), ...result }, correlationId }
}

async function categoryIdByCode(supabase: SupabaseClient, categoryCode: string) {
  const { data, error } = await supabase.from('hsd_service_categories').select('id').eq('tenant_id', TENANT).eq('code', categoryCode.toUpperCase()).maybeSingle()
  if (error) throw error
  return data?.id ? String(data.id) : null
}

async function familyIdByCode(supabase: SupabaseClient, familyCode: string) {
  const { data, error } = await supabase.from('hsd_service_families').select('id').eq('tenant_id', TENANT).eq('code', familyCode.toUpperCase()).maybeSingle()
  if (error) throw error
  return data?.id ? String(data.id) : null
}

function split(value: unknown) { return String(value || '').split(/[|;]/).map((item) => item.trim()).filter(Boolean) }

async function commitRow(supabase: SupabaseClient, importType: string, row: Row, user: HomeServiceUser) {
  if (importType === 'service_categories') {
    const familyId = await familyIdByCode(supabase, row.family_code)
    if (!familyId) throw new Error(`Famille inconnue: ${row.family_code}`)
    const { data: category, error } = await supabase.from('hsd_service_categories').upsert({ tenant_id: TENANT, family_id: familyId, code: code(row.category_code),
      commercial_name_fr: text(row.commercial_name, 'Nom commercial'), operational_name_fr: text(row.operational_name, 'Nom opérationnel'),
      description_fr: String(row.description || ''), audience: row.audience || (row.b2c_enabled === 'true' && row.b2b_enabled === 'true' ? 'both' : row.b2b_enabled === 'true' ? 'b2b' : 'b2c'),
      cities: split(row.cities), languages: split(row.languages), beneficiary_profiles: split(row.beneficiary_profiles), mission_formats: split(row.mission_formats),
      carelink_service_type: row.carelink_service_type || null, status: 'draft', version_number: 1, updated_by: userId(user) }, { onConflict: 'tenant_id,code' }).select('*').single()
    if (error) return { error }
    const sectionRows = HSD_DOSSIER_SECTIONS.map(([sectionCode, titleFr, purposeFr], index) => ({ tenant_id: TENANT, category_id: category.id, section_code: sectionCode,
      title_fr: titleFr, purpose_fr: purposeFr, status: 'draft', completion_percent: 0, blocker_count: 0, owner_role: 'À affecter', sort_order: index + 1 }))
    const { error: sectionError } = await supabase.from('hsd_dossier_sections').upsert(sectionRows, { onConflict: 'tenant_id,category_id,section_code' })
    return sectionError ? { error: sectionError } : { data: category }
  }
  if (importType === 'doctrine_rules') {
    const categoryId = await categoryIdByCode(supabase, row.category_code); if (!categoryId) throw new Error(`Catégorie inconnue: ${row.category_code}`)
    return await supabase.from('hsd_doctrine_rules').upsert({ tenant_id: TENANT, category_id: categoryId, code: code(row.rule_code), kind: row.rule_type || 'mandatory',
      title_fr: row.title, description_fr: row.description, severity: row.severity || 'important', mandatory: booleanValue(row.mandatory),
      blocking: booleanValue(row.blocking_if_failed || row.blocking), applicability: {}, required_evidence: split(row.required_evidence), escalation_route: row.escalation_route || null,
      status: 'draft', version_number: 1, updated_by: userId(user) }, { onConflict: 'tenant_id,category_id,code,version_number' })
  }
  if (importType === 'capacity_rules') {
    const categoryId = await categoryIdByCode(supabase, row.category_code); if (!categoryId) throw new Error(`Catégorie inconnue: ${row.category_code}`)
    return await supabase.from('hsd_capacity_rules').upsert({ tenant_id: TENANT, category_id: categoryId, minimum_hours: Number(row.minimum_hours), maximum_hours: Number(row.maximum_hours),
      maximum_consecutive_days: Number(row.maximum_consecutive_days || row.maximum_days || 14), maximum_non_consecutive_days: Number(row.maximum_non_consecutive_days || 60), earliest_start_time: row.earliest_start || '06:00',
      latest_end_time: row.latest_end || '23:00', max_beneficiaries_per_agent: Number(row.max_beneficiaries_per_agent), minimum_agents: Number(row.minimum_agents || 1),
      backup_required: booleanValue(row.backup_required), supervisor_required: booleanValue(row.supervisor_required), lead_time_hours: Number(row.lead_time_hours || 24),
      night_allowed: booleanValue(row.night_allowed), weekend_allowed: booleanValue(row.weekend_allowed), holiday_allowed: booleanValue(row.holiday_allowed),
      allowed_cities: split(row.allowed_cities), conditions: {}, status: 'draft', updated_by: userId(user) }, { onConflict: 'tenant_id,category_id' })
  }
  if (importType === 'activities') {
    return await supabase.from('hsd_activity_library').upsert({ tenant_id: TENANT, code: code(row.activity_code), name_fr: row.activity_name, description_fr: row.description || row.activity_name,
      block_type: row.block_type || 'activity', objective_codes: split(row.objective_codes), category_codes: split(row.category_code || row.category_codes), age_min_months: row.age_min_months ? Number(row.age_min_months) : row.age_min ? Number(row.age_min) * 12 : null,
      age_max_months: row.age_max_months ? Number(row.age_max_months) : row.age_max ? Number(row.age_max) * 12 : null, min_minutes: Number(row.min_minutes), max_minutes: Number(row.max_minutes), energy_level: row.energy_level || 'moderate',
      location_type: row.location_type || 'indoor', materials: split(row.materials || row.materials_codes), competency_codes: split(row.competency_codes), risk_codes: split(row.risk_codes),
      evidence_codes: split(row.evidence_codes), repetition_limit_per_day: Number(row.repetition_limit || 1), status: 'draft', version_number: 1, updated_by: userId(user) }, { onConflict: 'tenant_id,code,version_number' })
  }
  if (importType === 'competencies') {
    return await supabase.from('hsd_competencies').upsert({ tenant_id: TENANT, code: code(row.competency_code), name_fr: row.competency_name, family: row.family || 'general',
      description_fr: row.description || row.competency_name, evidence_type: row.certification_required === 'true' ? 'certification' : 'validation_manageriale',
      renewal_months: row.renewal_months ? Number(row.renewal_months) : null, status: 'draft', updated_by: userId(user) }, { onConflict: 'tenant_id,code' })
  }
  if (importType === 'risks') {
    return await supabase.from('hsd_risk_controls').upsert({ tenant_id: TENANT, code: code(row.risk_code), name_fr: row.risk_name, description_fr: row.description || row.risk_name,
      severity: row.risk_level || row.severity || 'important', trigger_conditions: split(row.trigger_conditions), preventive_controls: split(row.preventive_control || row.preventive_controls), required_evidence: split(row.required_evidence),
      stop_work: booleanValue(row.stop_work || row.blocking_if_failed), escalation_route: row.escalation_route || 'Supervision CARELINK', category_codes: split(row.category_code || row.category_codes),
      status: 'draft', updated_by: userId(user) }, { onConflict: 'tenant_id,code' })
  }
  const categoryId = await categoryIdByCode(supabase, row.category_code)
  if (!categoryId) throw new Error(`Catégorie inconnue: ${row.category_code}`)
  if (importType === 'features' || importType === 'topups' || importType === 'upsells') {
    const table = 'hsd_service_options'
    const record = { tenant_id: TENANT, category_id: categoryId, code: code(row.feature_code || row.item_code), name_fr: row.feature_name || row.item_name,
      option_type: importType === 'features' ? 'feature' : importType === 'topups' ? 'topup' : 'upsell', description_fr: row.description || '', included_by_default: booleanValue(row.included_by_default), pricing_basis: row.pricing_basis || 'per_mission',
      unit_price_dh: Number(row.unit_price || 0), cost_amount_dh: Number(row.cost_amount || 0), minimum_quantity: Number(row.minimum_quantity || 0), maximum_quantity: Number(row.maximum_quantity || 999),
      eligibility_rule: row.eligibility_rule || null, customer_visible: row.customer_visible !== 'false', sort_order: Number(row.sort_order || 100), status: 'draft', updated_by: userId(user) }
    return await supabase.from(table).upsert(record, { onConflict: 'tenant_id,category_id,code' })
  }
  if (importType === 'checklists') {
    const { data: template, error } = await supabase.from('hsd_checklist_templates').upsert({ tenant_id: TENANT, category_id: categoryId, code: code(row.template_code), name_fr: row.template_name || row.template_code,
      purpose_fr: row.template_purpose || 'Checklist opérationnelle catégorie', status: 'draft', version_number: 1, updated_by: userId(user) }, { onConflict: 'tenant_id,category_id,code,version_number' }).select('id').single()
    if (error) return { error }
    return await supabase.from('hsd_checklist_template_items').upsert({ tenant_id: TENANT, template_id: template.id, code: code(row.item_code), phase: row.phase, label_fr: row.item_label,
      item_type: row.item_type || 'boolean', mandatory: booleanValue(row.mandatory), evidence_required: booleanValue(row.evidence_required), blocking_if_failed: booleanValue(row.blocking_if_failed),
      sort_order: Number(row.sort_order || 100), status: 'draft' }, { onConflict: 'tenant_id,template_id,code' })
  }
  if (importType === 'report_fields') {
    const { data: template, error } = await supabase.from('hsd_report_templates').upsert({ tenant_id: TENANT, category_id: categoryId, code: code(row.template_code), name_fr: row.template_name || row.template_code,
      purpose_fr: row.template_purpose || 'Rapport opérationnel catégorie', status: 'draft', version_number: 1, updated_by: userId(user) }, { onConflict: 'tenant_id,category_id,code,version_number' }).select('id').single()
    if (error) return { error }
    return await supabase.from('hsd_report_template_fields').upsert({ tenant_id: TENANT, template_id: template.id, code: code(row.field_code), section_fr: row.section, label_fr: row.label,
      field_type: row.field_type, required: booleanValue(row.required), option_values: split(row.option_values), sort_order: Number(row.sort_order || 100), status: 'draft' }, { onConflict: 'tenant_id,template_id,code' })
  }
  if (importType === 'pricing') {
    return await supabase.from('hsd_price_entries').upsert({ tenant_id: TENANT, category_id: categoryId, code: code(row.price_code), customer_segment: row.customer_segment || 'all', pricing_basis: row.pricing_basis,
      minimum_quantity: Number(row.minimum_quantity || 1), unit_price_dh: Number(row.unit_price), cost_amount_dh: Number(row.cost_amount || 0), margin_floor_percent: Number(row.margin_floor || 0),
      effective_from: row.effective_from || new Date().toISOString().slice(0, 10), effective_to: row.effective_to || null, status: 'draft', updated_by: userId(user) }, { onConflict: 'tenant_id,category_id,code,effective_from' })
  }
  throw new Error(`Import non pris en charge: ${importType}`)
}


type ImportTargetSpec = { table: string; filters: Record<string, string | number>; key: string }

async function importTargetSpecs(supabase: SupabaseClient, importType: string, row: Row): Promise<ImportTargetSpec[]> {
  const specs: ImportTargetSpec[] = []
  if (importType === 'service_categories') return [{ table: 'hsd_service_categories', filters: { tenant_id: TENANT, code: code(row.category_code) }, key: `category:${code(row.category_code)}` }]
  if (importType === 'activities') return [{ table: 'hsd_activity_library', filters: { tenant_id: TENANT, code: code(row.activity_code), version_number: 1 }, key: `activity:${code(row.activity_code)}:1` }]
  if (importType === 'competencies') return [{ table: 'hsd_competencies', filters: { tenant_id: TENANT, code: code(row.competency_code) }, key: `competency:${code(row.competency_code)}` }]
  if (importType === 'risks') return [{ table: 'hsd_risk_controls', filters: { tenant_id: TENANT, code: code(row.risk_code) }, key: `risk:${code(row.risk_code)}` }]
  const categoryId = await categoryIdByCode(supabase, row.category_code)
  if (!categoryId) return []
  if (importType === 'doctrine_rules') return [{ table: 'hsd_doctrine_rules', filters: { tenant_id: TENANT, category_id: categoryId, code: code(row.rule_code), version_number: 1 }, key: `doctrine:${categoryId}:${code(row.rule_code)}:1` }]
  if (importType === 'capacity_rules') return [{ table: 'hsd_capacity_rules', filters: { tenant_id: TENANT, category_id: categoryId }, key: `capacity:${categoryId}` }]
  if (['features', 'topups', 'upsells'].includes(importType)) {
    const optionType = importType === 'features' ? 'feature' : importType === 'topups' ? 'topup' : 'upsell'
    const optionCode = code(row.feature_code || row.item_code)
    return [{ table: 'hsd_service_options', filters: { tenant_id: TENANT, category_id: categoryId, code: optionCode }, key: `${optionType}:${categoryId}:${optionCode}` }]
  }
  if (importType === 'pricing') return [{ table: 'hsd_price_entries', filters: { tenant_id: TENANT, category_id: categoryId, code: code(row.price_code), effective_from: row.effective_from || new Date().toISOString().slice(0, 10) }, key: `price:${categoryId}:${code(row.price_code)}:${row.effective_from || new Date().toISOString().slice(0, 10)}` }]
  if (importType === 'checklists') {
    const templateCode = code(row.template_code)
    const { data: template } = await supabase.from('hsd_checklist_templates').select('id').eq('tenant_id', TENANT).eq('category_id', categoryId).eq('code', templateCode).eq('version_number', 1).maybeSingle()
    specs.push({ table: 'hsd_checklist_templates', filters: { tenant_id: TENANT, category_id: categoryId, code: templateCode, version_number: 1 }, key: `checklist-template:${categoryId}:${templateCode}:1` })
    if (template?.id) specs.push({ table: 'hsd_checklist_template_items', filters: { tenant_id: TENANT, template_id: String(template.id), code: code(row.item_code) }, key: `checklist-item:${template.id}:${code(row.item_code)}` })
    return specs
  }
  if (importType === 'report_fields') {
    const templateCode = code(row.template_code)
    const { data: template } = await supabase.from('hsd_report_templates').select('id').eq('tenant_id', TENANT).eq('category_id', categoryId).eq('code', templateCode).eq('version_number', 1).maybeSingle()
    specs.push({ table: 'hsd_report_templates', filters: { tenant_id: TENANT, category_id: categoryId, code: templateCode, version_number: 1 }, key: `report-template:${categoryId}:${templateCode}:1` })
    if (template?.id) specs.push({ table: 'hsd_report_template_fields', filters: { tenant_id: TENANT, template_id: String(template.id), code: code(row.field_code) }, key: `report-field:${template.id}:${code(row.field_code)}` })
    return specs
  }
  return []
}

async function readImportTargets(supabase: SupabaseClient, specs: ImportTargetSpec[]) {
  const result: Array<ImportTargetSpec & { data: Row | null }> = []
  for (const spec of specs) {
    let query = supabase.from(spec.table).select('*')
    for (const [field, value] of Object.entries(spec.filters)) query = query.eq(field, value)
    const { data, error } = await query.maybeSingle()
    if (error) throw error
    result.push({ ...spec, data: data || null })
  }
  return result
}

async function recordImportChanges(supabase: SupabaseClient, importId: string, importRowId: string, rowNumber: number, before: Array<ImportTargetSpec & { data: Row | null }>, after: Array<ImportTargetSpec & { data: Row | null }>) {
  const beforeByKey = new Map(before.map((item) => [item.key, item]))
  for (const item of after) {
    if (!item.data?.id) continue
    const previous = beforeByKey.get(item.key)?.data || null
    const { error } = await supabase.from('hsd_configuration_import_changes').insert({ tenant_id: TENANT, import_id: importId, import_row_id: importRowId,
      row_number: rowNumber, table_name: item.table, record_id: String(item.data.id), record_key: item.key,
      operation: previous ? 'update' : 'insert', before_data: previous || null, after_data: item.data })
    if (error) throw error
  }
}

export async function rollbackConfigurationImport(importId: string, payload: unknown, user: HomeServiceUser) {
  const input = objectInput(payload || {})
  const reason = text(input.reason, 'Motif du rollback', { min: 8, max: 2000 })
  const supabase = await client()
  const { data: batch, error: batchError } = await supabase.from('hsd_configuration_imports').select('*').eq('tenant_id', TENANT).eq('id', importId).single()
  if (batchError) throw batchError
  if (!['committed', 'partially_valid'].includes(batch.status)) throw new Error('Ce lot ne peut pas être annulé dans son état actuel.')
  const { data: changes, error: changeError } = await supabase.from('hsd_configuration_import_changes').select('*').eq('tenant_id', TENANT).eq('import_id', importId).is('rolled_back_at', null).order('change_order', { ascending: false })
  if (changeError) throw changeError
  if (!(changes || []).length) throw new Error('Aucun changement commité n’est disponible pour rollback.')
  let restored = 0
  for (const change of changes || []) {
    if (change.operation === 'insert' || !change.before_data) {
      const { error } = await supabase.from(change.table_name).delete().eq('tenant_id', TENANT).eq('id', change.record_id)
      if (error) throw error
    } else {
      const before = { ...(change.before_data as Row) }
      delete before.id; delete before.tenant_id; delete before.created_at
      const { error } = await supabase.from(change.table_name).update(before).eq('tenant_id', TENANT).eq('id', change.record_id)
      if (error) throw error
    }
    const { error: markError } = await supabase.from('hsd_configuration_import_changes').update({ rolled_back_at: new Date().toISOString(), rolled_back_by: userId(user) }).eq('id', change.id)
    if (markError) throw markError
    restored += 1
  }
  const { error: updateError } = await supabase.from('hsd_configuration_imports').update({ status: 'rolled_back', rollback_reason: reason, rolled_back_by: userId(user), rolled_back_at: new Date().toISOString() }).eq('tenant_id', TENANT).eq('id', importId)
  if (updateError) throw updateError
  const correlationId = await writeAudit(supabase, user, { action: 'configuration_import_rolled_back', entityType: 'configuration_import', entityId: importId,
    entityLabel: batch.file_name, fromState: batch.status, toState: 'rolled_back', reason, consequence: `${restored} changement(s) restauré(s) ou supprimé(s).` })
  return { data: { restored, status: 'rolled_back' }, correlationId }
}

export async function commitConfigurationImport(importId: string, payload: unknown, user: HomeServiceUser) {
  const input = objectInput(payload || {})
  const supabase = await client()
  const { data: batch, error: batchError } = await supabase.from('hsd_configuration_imports').select('*').eq('tenant_id', TENANT).eq('id', importId).single()
  if (batchError) throw batchError
  if (!['validated', 'partially_valid'].includes(batch.status)) throw new Error('Ce lot ne peut pas être validé dans son état actuel.')
  const { data: importRows, error: rowError } = await supabase.from('hsd_configuration_import_rows').select('*').eq('tenant_id', TENANT).eq('import_id', importId).eq('status', 'valid').order('row_number')
  if (rowError) throw rowError
  let committed = 0
  const failures: Array<{ rowNumber: number; error: string }> = []
  for (const row of importRows || []) {
    try {
      const normalized = row.normalized_data || row.raw_data || {}
      const beforeSpecs = await importTargetSpecs(supabase, batch.import_type, normalized)
      const before = await readImportTargets(supabase, beforeSpecs)
      const result = await commitRow(supabase, batch.import_type, normalized, user)
      if (result?.error) throw result.error
      const afterSpecs = await importTargetSpecs(supabase, batch.import_type, normalized)
      const after = await readImportTargets(supabase, afterSpecs)
      await recordImportChanges(supabase, importId, String(row.id), Number(row.row_number), before, after)
      await supabase.from('hsd_configuration_import_rows').update({ status: 'committed', committed_at: new Date().toISOString() }).eq('id', row.id)
      committed += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Échec de ligne'
      failures.push({ rowNumber: row.row_number, error: message })
      await supabase.from('hsd_configuration_import_rows').update({ status: 'failed', commit_error: message }).eq('id', row.id)
    }
  }
  const finalStatus = failures.length ? (committed ? 'partially_valid' : 'rejected') : 'committed'
  await supabase.from('hsd_configuration_imports').update({ status: finalStatus, committed_at: finalStatus === 'committed' ? new Date().toISOString() : null,
    committed_rows: committed, commit_failures: failures, committed_by: userId(user), commit_reason: text(input.reason || 'Import approuvé après contrôle du lot.', 'Motif', { max: 1000 }) }).eq('id', importId)
  const correlationId = await writeAudit(supabase, user, { action: 'configuration_import_committed', entityType: 'configuration_import', entityId: importId, entityLabel: batch.file_name,
    fromState: batch.status, toState: finalStatus, reason: text(input.reason || 'Validation du lot', 'Motif', { max: 1000 }), consequence: `${committed} ligne(s) appliquée(s), ${failures.length} échec(s).`, payload: { committed, failures } })
  return { data: { committed, failures, status: finalStatus }, correlationId }
}


export async function requestApproval(payload: unknown, user: HomeServiceUser) {
  const input = objectInput(payload)
  const body = { tenant_id: TENANT, entity_type: text(input.entityType, 'Type d’objet', { max: 80 }), entity_id: text(input.entityId, 'Identifiant', { max: 120 }),
    entity_label: text(input.entityLabel, 'Libellé', { max: 250 }), approval_type: text(input.approvalType || 'technical_dossier', 'Circuit', { max: 100 }),
    requested_by: userId(user), assigned_role: text(input.assignedRole || 'Responsable technique HomeService', 'Rôle assigné', { max: 150 }), status: 'pending',
    consequence_summary: text(input.consequenceSummary || 'Validation requise avant progression du dossier.', 'Conséquence', { max: 1000 }),
    blocker_summary: stringArray(input.blockerSummary), evidence_count: numberValue(input.evidenceCount ?? 0, 'Nombre de preuves', { min: 0, max: 10000, integer: true }) }
  const supabase = await client()
  const { data: existing } = await supabase.from('hsd_approvals').select('id').eq('tenant_id', TENANT).eq('entity_type', body.entity_type).eq('entity_id', body.entity_id).eq('approval_type', body.approval_type).eq('status', 'pending').maybeSingle()
  if (existing?.id) throw Object.assign(new Error('Une validation est déjà en attente pour ce dossier et ce circuit.'), { status: 409, code: 'APPROVAL_ALREADY_PENDING' })
  const { data, error } = await supabase.from('hsd_approvals').insert(body).select('*').single()
  if (error) throw error
  const correlationId = await writeAudit(supabase, user, { action: 'approval_requested', entityType: body.entity_type, entityId: body.entity_id, entityLabel: body.entity_label,
    fromState: null, toState: 'pending', consequence: body.consequence_summary, payload: { approvalType: body.approval_type, assignedRole: body.assigned_role } })
  return { data: mapApproval(data), correlationId }
}

export async function decideApproval(approvalId: string, decision: HsdDecision, payload: unknown, user: HomeServiceUser) {
  const input = objectInput(payload || {})
  const supabase = await client()
  const { data: before, error: beforeError } = await supabase.from('hsd_approvals').select('*').eq('tenant_id', TENANT).eq('id', approvalId).single()
  if (beforeError) throw beforeError
  if (before.status !== 'pending') throw new Error('Cette décision a déjà été traitée.')
  const status = decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : decision === 'return' ? 'returned' : decision === 'suspend' ? 'cancelled' : 'returned'
  const reason = text(input.reason, 'Motif de décision', { min: 5, max: 2000 })
  const { data, error } = await supabase.from('hsd_approvals').update({ status, decision, decision_reason: reason, decided_by: userId(user), decided_at: new Date().toISOString() }).eq('id', approvalId).select('*').single()
  if (error) throw error
  const correlationId = await writeAudit(supabase, user, { action: 'approval_decided', entityType: before.entity_type, entityId: before.entity_id, entityLabel: before.entity_label,
    fromState: 'pending', toState: status, reason, consequence: `Décision ${decision} appliquée au circuit ${before.approval_type}.` })
  return { data: mapApproval(data), correlationId }
}

export async function searchServiceDesign(query: string): Promise<SearchHit[]> {
  const q = query.trim()
  if (q.length < 2) return []
  const supabase = await client()
  const escaped = q.replace(/[%_]/g, '')
  const [categories, activities, doctrines, competencies, risks] = await Promise.all([
    supabase.from('hsd_v_category_readiness').select('*').eq('tenant_id', TENANT).or(`code.ilike.%${escaped}%,commercial_name_fr.ilike.%${escaped}%,operational_name_fr.ilike.%${escaped}%`).limit(20),
    supabase.from('hsd_v_activity_library').select('*').eq('tenant_id', TENANT).or(`code.ilike.%${escaped}%,name_fr.ilike.%${escaped}%`).limit(20),
    supabase.from('hsd_v_doctrine_rules').select('*').eq('tenant_id', TENANT).or(`code.ilike.%${escaped}%,title_fr.ilike.%${escaped}%`).limit(20),
    supabase.from('hsd_v_competencies').select('*').eq('tenant_id', TENANT).or(`code.ilike.%${escaped}%,name_fr.ilike.%${escaped}%`).limit(20),
    supabase.from('hsd_v_risk_controls').select('*').eq('tenant_id', TENANT).or(`code.ilike.%${escaped}%,name_fr.ilike.%${escaped}%`).limit(20),
  ])
  return [
    ...(categories.data || []).map((row: Row) => ({ id: String(row.id), recordType: 'Catégorie', code: row.code, title: row.commercial_name_fr, subtitle: row.family_name || '', status: row.status,
      href: `/carelink-ops/service-design/catalogue/categories/${row.id}`, context: [`Préparation ${num(row.overall_readiness)}%`, row.carelink_service_type ? 'CARELINK mappé' : 'Mapping CARELINK requis'] })),
    ...(activities.data || []).map((row: Row) => ({ id: String(row.id), recordType: 'Bloc activité', code: row.code, title: row.name_fr, subtitle: `${row.min_minutes}–${row.max_minutes} min`, status: row.status,
      href: '/carelink-ops/service-design/standards/activities', context: arr(row.category_codes) })),
    ...(doctrines.data || []).map((row: Row) => ({ id: String(row.id), recordType: 'Règle doctrine', code: row.code, title: row.title_fr, subtitle: row.category_name || '', status: row.status,
      href: '/carelink-ops/service-design/standards/doctrine', context: [row.kind, row.severity] })),
    ...(competencies.data || []).map((row: Row) => ({ id: String(row.id), recordType: 'Compétence', code: row.code, title: row.name_fr, subtitle: row.family || '', status: row.status,
      href: '/carelink-ops/service-design/standards/staffing', context: [`${num(row.category_count)} catégorie(s)`] })),
    ...(risks.data || []).map((row: Row) => ({ id: String(row.id), recordType: 'Risque', code: row.code, title: row.name_fr, subtitle: row.escalation_route || '', status: row.status,
      href: '/carelink-ops/service-design/standards/safety', context: [row.severity, row.stop_work ? 'Arrêt obligatoire' : 'Prévention'] })),
  ].slice(0, 60)
}

import crypto from 'node:crypto'
import { createClient as createSupabaseAdmin } from '@/lib/supabase/contract-client'
import { createClient as createSessionClient } from '@/lib/supabase/server'
import { HSD_TENANT_ID } from '@/lib/homeservice-design/constants'
import { requireHomeServiceApi, userId, type HomeServiceUser } from '@/lib/homeservice-design/server/auth'

export type MasteryDomain =
  | 'planning_request'
  | 'planning_plan'
  | 'commercial_request'
  | 'commercial_scenario'
  | 'offer'
  | 'bundle'
  | 'sellable'
  | 'handoff'
  | 'handoff_amendment'
  | 'customer_case'
  | 'incident'
  | 'quality_signal'
  | 'improvement'

type Row = Record<string, any>
type SupabaseClient = any

type DomainConfig = {
  table: string
  tenantKind: 'text' | 'uuid'
  permission: string | string[]
  editable: string[]
  deletableStatuses: string[]
  label: string
}

export const MASTERY_DOMAINS: Record<MasteryDomain, DomainConfig> = {
  planning_request: {
    table: 'hsd_planning_requests', tenantKind: 'uuid', permission: ['homeservice_design.create_planning_requests', 'homeservice_design.manage_categories'],
    editable: ['title', 'status', 'universe', 'mission_format', 'customer_profile', 'objectives', 'outcomes', 'environment', 'constraints', 'requested_scenario_count'],
    deletableStatuses: ['draft', 'incomplete'], label: 'Demande de planification',
  },
  planning_plan: {
    table: 'hsd_technical_plans', tenantKind: 'uuid', permission: ['homeservice_design.create_planning_requests', 'homeservice_design.manage_categories'],
    editable: ['status', 'current_version'], deletableStatuses: ['draft'], label: 'Plan technique',
  },
  commercial_request: {
    table: 'hsd_commercial_requests', tenantKind: 'text', permission: ['homeservice_design.manage_pricing', 'homeservice_design.publish'],
    editable: ['title', 'status', 'universe', 'customer_segment', 'commercial_objective', 'scenario_count', 'constraints'], deletableStatuses: ['draft'], label: 'Demande commerciale',
  },
  commercial_scenario: {
    table: 'hsd_commercial_scenarios', tenantKind: 'text', permission: ['homeservice_design.manage_pricing', 'homeservice_design.publish'],
    editable: ['name', 'intent', 'promise', 'customer_fit', 'beneficiary_fit', 'status', 'included_features', 'optional_topups', 'recommended_upsells', 'commercial_risks', 'upgrade_path'],
    deletableStatuses: ['composed', 'draft', 'rejected'], label: 'Scénario commercial',
  },
  offer: {
    table: 'hsd_offer_drafts', tenantKind: 'text', permission: ['homeservice_design.manage_pricing', 'homeservice_design.publish'],
    editable: ['title', 'status', 'customer_segment', 'commercial_name', 'promise', 'validity_days'], deletableStatuses: ['draft', 'rejected'], label: 'Offre',
  },
  bundle: {
    table: 'hsd_bundles', tenantKind: 'text', permission: ['homeservice_design.manage_pricing', 'homeservice_design.publish'],
    editable: ['name', 'status', 'bundle_type', 'compatibility_status'], deletableStatuses: ['draft', 'rejected'], label: 'Bundle',
  },
  sellable: {
    table: 'hsd_sellables', tenantKind: 'text', permission: ['homeservice_design.publish', 'homeservice_design.manage_pricing'],
    editable: ['commercial_name', 'technical_name', 'status', 'promise', 'readiness'], deletableStatuses: ['draft'], label: 'Référence vendable',
  },
  handoff: {
    table: 'hsd_handoff_requests', tenantKind: 'text', permission: ['homeservice_design.create_carelink_handoff', 'homeservice_design.admin'],
    editable: ['status', 'customer_ref', 'beneficiary_refs', 'customer_snapshot', 'beneficiary_snapshot', 'operational_contacts', 'access_instructions', 'safety_blockers'],
    deletableStatuses: ['draft'], label: 'Handoff CARELINK',
  },
  handoff_amendment: {
    table: 'hsd_handoff_amendments', tenantKind: 'text', permission: ['homeservice_design.create_carelink_handoff', 'homeservice_design.admin'],
    editable: ['amendment_type', 'status', 'reason', 'requested_changes', 'applies_from_date'], deletableStatuses: ['draft'], label: 'Amendement CARELINK',
  },
  customer_case: {
    table: 'hsd_customer_experience_cases', tenantKind: 'text', permission: ['homeservice_design.manage_categories', 'homeservice_design.admin'],
    editable: ['case_type', 'severity', 'status', 'summary', 'customer_statement', 'customer_confirmed', 'owner_id', 'due_at'], deletableStatuses: ['draft', 'open'], label: 'Dossier expérience client',
  },
  incident: {
    table: 'hsd_system_incidents', tenantKind: 'text', permission: ['homeservice_design.manage_categories', 'homeservice_design.admin'],
    editable: ['incident_type', 'severity', 'status', 'title', 'summary', 'owner_id'], deletableStatuses: ['draft', 'detected'], label: 'Incident',
  },
  quality_signal: {
    table: 'hsd_quality_signals', tenantKind: 'text', permission: ['homeservice_design.manage_categories', 'homeservice_design.admin'],
    editable: ['signal_type', 'severity', 'status', 'title', 'summary', 'customer_impact', 'operational_impact', 'commercial_impact', 'owner_id', 'due_at'],
    deletableStatuses: ['draft', 'open'], label: 'Signal qualité',
  },
  improvement: {
    table: 'hsd_improvement_proposals', tenantKind: 'text', permission: ['homeservice_design.manage_categories', 'homeservice_design.admin'],
    editable: ['target_type', 'target_id', 'status', 'title', 'hypothesis', 'expected_benefit', 'risk_summary', 'safety_review_required', 'pilot_required'],
    deletableStatuses: ['draft'], label: 'Proposition d’amélioration',
  },
}

function env(name: string) { return String(process.env[name] || '').trim() }

async function sessionClient(): Promise<SupabaseClient> {
  return await createSessionClient() as any
}

export async function masteryClient(write = false): Promise<SupabaseClient> {
  const url = env('NEXT_PUBLIC_SUPABASE_URL') || env('SUPABASE_URL')
  const key = env('SUPABASE_SERVICE_ROLE_KEY') || env('SUPABASE_SERVICE_KEY')
  if (write && url && key) {
    return createSupabaseAdmin(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) as any
  }
  return sessionClient()
}

function domainConfig(domain: string): DomainConfig {
  const config = MASTERY_DOMAINS[domain as MasteryDomain]
  if (!config) throw Object.assign(new Error('Domaine Service Design inconnu.'), { status: 404, code: 'UNKNOWN_MASTERY_DOMAIN' })
  return config
}

function assertTenant(row: Row, actor: HomeServiceUser, config: DomainConfig) {
  const actorTenant = String((actor as Row).tenant_id || (actor as Row).tenantId || '').trim()
  const recordTenant = String(row.tenant_id || '').trim()
  if (config.tenantKind === 'text' && recordTenant && recordTenant !== HSD_TENANT_ID && actorTenant && actorTenant !== recordTenant) {
    throw Object.assign(new Error('Dossier introuvable dans votre espace.'), { status: 404, code: 'TENANT_SCOPE_MISMATCH' })
  }
}

async function byId(client: SupabaseClient, table: string, id: string, config?: DomainConfig) {
  let query = client.from(table).select('*').eq('id', id)
  if (config?.tenantKind === 'text') query = query.eq('tenant_id', HSD_TENANT_ID)
  const result = await query.maybeSingle()
  if (result.error) throw result.error
  return result.data as Row | null
}

async function related(client: SupabaseClient, table: string, column: string, id: string, order?: string) {
  let query = client.from(table).select('*').eq(column, id)
  if (order) query = query.order(order, { ascending: true })
  const result = await query
  if (result.error) throw result.error
  return (result.data || []) as Row[]
}

async function relationBundle(client: SupabaseClient, domain: MasteryDomain, record: Row) {
  if (domain === 'planning_request') {
    const [beneficiaries, dates, objectives, scenarios, feasibilityRuns] = await Promise.all([
      related(client, 'hsd_planning_request_beneficiaries', 'request_id', record.id, 'created_at'),
      related(client, 'hsd_planning_request_dates', 'request_id', record.id, 'service_date'),
      related(client, 'hsd_planning_request_objectives', 'request_id', record.id, 'priority'),
      related(client, 'hsd_plan_scenarios', 'request_id', record.id, 'created_at'),
      related(client, 'hsd_feasibility_runs', 'request_id', record.id, 'started_at'),
    ])
    const latestRun = feasibilityRuns.at(-1)
    const findings = latestRun ? await related(client, 'hsd_feasibility_findings', 'run_id', latestRun.id) : []
    const category = record.category_id ? await byId(client, 'hsd_service_categories', record.category_id) : null
    return { beneficiaries, dates, objectives, scenarios, feasibilityRuns, findings, category }
  }
  if (domain === 'planning_plan') {
    const versions = await related(client, 'hsd_technical_plan_versions', 'plan_id', record.id, 'version_number')
    const versionIds = versions.map((row) => row.id)
    let days: Row[] = []
    let blocks: Row[] = []
    if (versionIds.length) {
      const dayResult = await client.from('hsd_technical_plan_days').select('*').in('version_id', versionIds).order('day_number')
      if (dayResult.error) throw dayResult.error
      days = dayResult.data || []
      const dayIds = days.map((row) => row.id)
      if (dayIds.length) {
        const blockResult = await client.from('hsd_technical_plan_blocks').select('*').in('plan_day_id', dayIds).order('sort_order')
        if (blockResult.error) throw blockResult.error
        blocks = blockResult.data || []
      }
    }
    const validationRuns = await related(client, 'hsd_plan_validation_runs', 'plan_id', record.id, 'started_at')
    const findings = await related(client, 'hsd_plan_validation_findings', 'plan_id', record.id, 'created_at')
    return { versions, days, blocks, validationRuns, findings }
  }
  if (domain === 'commercial_request') {
    const scenarios = await related(client, 'hsd_commercial_scenarios', 'request_id', record.id, 'created_at')
    const plan = record.technical_plan_id ? await byId(client, 'hsd_technical_plans', record.technical_plan_id) : null
    return { scenarios, plan }
  }
  if (domain === 'commercial_scenario') {
    const [items, request] = await Promise.all([
      related(client, 'hsd_commercial_scenario_items', 'scenario_id', record.id, 'sort_order'),
      record.request_id ? byId(client, 'hsd_commercial_requests', record.request_id, MASTERY_DOMAINS.commercial_request) : Promise.resolve(null),
    ])
    return { items, request }
  }
  if (domain === 'offer') {
    const [versions, items, calculations, validations] = await Promise.all([
      related(client, 'hsd_offer_versions', 'offer_id', record.id, 'version_number'),
      related(client, 'hsd_offer_items', 'offer_id', record.id, 'sort_order'),
      related(client, 'hsd_offer_calculations', 'offer_id', record.id, 'calculation_version'),
      related(client, 'hsd_offer_validations', 'offer_id', record.id, 'created_at'),
    ])
    return { versions, items, calculations, validations }
  }
  if (domain === 'bundle') {
    const [versions, items, findings, calculations, availableOffers] = await Promise.all([
      related(client, 'hsd_bundle_versions', 'bundle_id', record.id, 'version_number'),
      related(client, 'hsd_bundle_items', 'bundle_id', record.id, 'sort_order'),
      related(client, 'hsd_bundle_findings', 'bundle_id', record.id, 'created_at'),
      related(client, 'hsd_bundle_calculations', 'bundle_id', record.id, 'version_number'),
      (async () => {
        const result = await client.from('hsd_offer_drafts').select('id,code,title,commercial_name,status,universe').eq('tenant_id', HSD_TENANT_ID).order('updated_at', { ascending: false }).limit(100)
        if (result.error) throw result.error
        return result.data || []
      })(),
    ])
    return { versions, items, findings, calculations, availableOffers }
  }
  if (domain === 'sellable') {
    const versions = await related(client, 'hsd_sellable_versions', 'sellable_id', record.id, 'version_number')
    const versionIds = versions.map((row) => row.id)
    let prices: Row[] = []
    if (versionIds.length) {
      const result = await client.from('hsd_sellable_prices').select('*').in('sellable_version_id', versionIds).order('created_at')
      if (result.error) throw result.error
      prices = result.data || []
    }
    const [publications, items] = await Promise.all([
      related(client, 'hsd_sellable_publications', 'sellable_id', record.id, 'created_at'),
      related(client, 'hsd_sellable_items', 'sellable_id', record.id, 'sort_order'),
    ])
    return { versions, prices, publications, items }
  }
  if (domain === 'handoff') {
    const [
      dates, customers, beneficiaries, sources, parentBlueprints, subMissions, programmes, checklists,
      reports, routes, allowances, mobileBriefs, preflightRuns, transmissions, transmissionRecords,
      links, events, failures, reconciliationRuns, amendments,
    ] = await Promise.all([
      related(client, 'hsd_handoff_request_dates', 'handoff_id', record.id, 'sequence'),
      related(client, 'hsd_handoff_customer_snapshots', 'handoff_id', record.id, 'created_at'),
      related(client, 'hsd_handoff_beneficiary_snapshots', 'handoff_id', record.id, 'created_at'),
      related(client, 'hsd_handoff_source_snapshots', 'handoff_id', record.id, 'created_at'),
      related(client, 'hsd_handoff_parent_blueprints', 'handoff_id', record.id, 'created_at'),
      related(client, 'hsd_handoff_sub_mission_blueprints', 'handoff_id', record.id, 'sequence'),
      related(client, 'hsd_handoff_programme_blueprints', 'handoff_id', record.id, 'created_at'),
      related(client, 'hsd_handoff_checklist_blueprints', 'handoff_id', record.id, 'created_at'),
      related(client, 'hsd_handoff_report_blueprints', 'handoff_id', record.id, 'created_at'),
      related(client, 'hsd_handoff_route_blueprints', 'handoff_id', record.id, 'created_at'),
      related(client, 'hsd_handoff_allowance_blueprints', 'handoff_id', record.id, 'created_at'),
      related(client, 'hsd_handoff_mobile_briefs', 'handoff_id', record.id, 'created_at'),
      related(client, 'hsd_handoff_preflight_runs', 'handoff_id', record.id, 'started_at'),
      related(client, 'hsd_handoff_transmissions', 'handoff_id', record.id, 'started_at'),
      related(client, 'hsd_handoff_transmission_records', 'handoff_id', record.id, 'created_at'),
      related(client, 'hsd_handoff_carelink_links', 'handoff_id', record.id, 'created_at'),
      related(client, 'hsd_handoff_events', 'handoff_id', record.id, 'created_at'),
      related(client, 'hsd_handoff_failures', 'handoff_id', record.id, 'created_at'),
      related(client, 'hsd_handoff_reconciliation_runs', 'handoff_id', record.id, 'started_at'),
      related(client, 'hsd_handoff_amendments', 'handoff_id', record.id, 'created_at'),
    ])
    const latestRun = preflightRuns.at(-1)
    const findings = latestRun ? await related(client, 'hsd_handoff_preflight_findings', 'preflight_run_id', latestRun.id, 'created_at') : []
    const latestReconciliation = reconciliationRuns.at(-1)
    const reconciliationFindings = latestReconciliation ? await related(client, 'hsd_handoff_reconciliation_findings', 'reconciliation_run_id', latestReconciliation.id, 'created_at') : []
    return {
      dates, customers, beneficiaries, sources, parentBlueprints, subMissions, programmes, checklists,
      reports, routes, allowances, mobileBriefs, preflightRuns, findings, transmissions, transmissionRecords,
      links, events, failures, reconciliationRuns, reconciliationFindings, amendments,
    }
  }
  if (domain === 'handoff_amendment') {
    const [impacts, handoff] = await Promise.all([
      related(client, 'hsd_handoff_amendment_impacts', 'amendment_id', record.id, 'created_at'),
      record.handoff_id ? byId(client, 'hsd_handoff_requests', record.handoff_id, MASTERY_DOMAINS.handoff) : Promise.resolve(null),
    ])
    return { impacts, handoff }
  }
  if (domain === 'customer_case') {
    const [events, recoveryActions, confirmations] = await Promise.all([
      related(client, 'hsd_customer_experience_events', 'case_id', record.id, 'created_at'),
      related(client, 'hsd_customer_recovery_actions', 'case_id', record.id, 'created_at'),
      related(client, 'hsd_customer_confirmation_records', 'case_id', record.id, 'created_at'),
    ])
    return { events, recoveryActions, confirmations }
  }
  if (domain === 'incident') {
    const [events, reviews] = await Promise.all([
      related(client, 'hsd_system_incident_events', 'incident_id', record.id, 'created_at'),
      related(client, 'hsd_system_incident_reviews', 'incident_id', record.id, 'created_at'),
    ])
    return { events, reviews }
  }
  if (domain === 'quality_signal') {
    const [sources, impacts, rootCauses, improvements] = await Promise.all([
      related(client, 'hsd_quality_signal_sources', 'signal_id', record.id, 'created_at'),
      related(client, 'hsd_quality_signal_impacts', 'signal_id', record.id, 'created_at'),
      related(client, 'hsd_root_cause_analyses', 'signal_id', record.id, 'created_at'),
      related(client, 'hsd_improvement_proposals', 'signal_id', record.id, 'created_at'),
    ])
    return { sources, impacts, rootCauses, improvements }
  }
  if (domain === 'improvement') {
    const [impacts, reviews, decisions, releases, signal] = await Promise.all([
      related(client, 'hsd_improvement_impacts', 'proposal_id', record.id, 'created_at'),
      related(client, 'hsd_improvement_reviews', 'proposal_id', record.id, 'reviewed_at'),
      related(client, 'hsd_improvement_decisions', 'proposal_id', record.id, 'decided_at'),
      related(client, 'hsd_improvement_releases', 'proposal_id', record.id, 'created_at'),
      record.signal_id ? byId(client, 'hsd_quality_signals', record.signal_id, MASTERY_DOMAINS.quality_signal) : Promise.resolve(null),
    ])
    return { impacts, reviews, decisions, releases, signal }
  }
  return {}
}

export async function getMasteryRecord(domainInput: string, id: string) {
  const domain = domainInput as MasteryDomain
  const config = domainConfig(domain)
  const actor = await requireHomeServiceApi('homeservice_design.view')
  const client = await masteryClient(false)
  const record = await byId(client, config.table, id, config)
  if (!record) throw Object.assign(new Error(`${config.label} introuvable.`), { status: 404, code: 'MASTERY_RECORD_NOT_FOUND' })
  assertTenant(record, actor, config)
  return { domain, label: config.label, record, related: await relationBundle(client, domain, record), editableFields: config.editable, deletableStatuses: config.deletableStatuses }
}

function normalizeValue(value: unknown) {
  if (typeof value === 'string') return value.trim()
  return value
}

export async function updateMasteryRecord(domainInput: string, id: string, input: Row) {
  const domain = domainInput as MasteryDomain
  const config = domainConfig(domain)
  const actor = await requireHomeServiceApi(config.permission)
  const client = await masteryClient(true)
  const current = await byId(client, config.table, id, config)
  if (!current) throw Object.assign(new Error(`${config.label} introuvable.`), { status: 404 })
  assertTenant(current, actor, config)
  const patch: Row = {}
  for (const field of config.editable) if (Object.prototype.hasOwnProperty.call(input, field)) patch[field] = normalizeValue(input[field])
  if (!Object.keys(patch).length) throw Object.assign(new Error('Aucune modification valide à enregistrer.'), { status: 400 })
  if ('updated_at' in current) patch.updated_at = new Date().toISOString()
  let query = client.from(config.table).update(patch).eq('id', id)
  if (config.tenantKind === 'text') query = query.eq('tenant_id', HSD_TENANT_ID)
  const result = await query.select('*').single()
  if (result.error) throw result.error
  return result.data as Row
}

async function dependencyCount(client: SupabaseClient, table: string, column: string, id: string) {
  const result = await client.from(table).select('id', { count: 'exact', head: true }).eq(column, id)
  if (result.error) throw result.error
  return result.count || 0
}

export async function deleteMasteryRecord(domainInput: string, id: string) {
  const domain = domainInput as MasteryDomain
  const config = domainConfig(domain)
  const actor = await requireHomeServiceApi(config.permission)
  const client = await masteryClient(true)
  const record = await byId(client, config.table, id, config)
  if (!record) throw Object.assign(new Error(`${config.label} introuvable.`), { status: 404 })
  assertTenant(record, actor, config)
  if (!config.deletableStatuses.includes(String(record.status || 'draft'))) {
    throw Object.assign(new Error(`Suppression impossible: le statut « ${record.status || 'inconnu'} » doit être conservé.`), { status: 409, code: 'DELETE_STATUS_PROTECTED' })
  }
  const dependencies: Array<{ label: string; count: number }> = []
  if (domain === 'planning_request') dependencies.push({ label: 'plans techniques', count: await dependencyCount(client, 'hsd_technical_plans', 'request_id', id) })
  if (domain === 'commercial_request') dependencies.push({ label: 'scénarios commerciaux', count: await dependencyCount(client, 'hsd_commercial_scenarios', 'request_id', id) })
  if (domain === 'offer') dependencies.push({ label: 'références vendables', count: await dependencyCount(client, 'hsd_sellables', 'offer_id', id) })
  if (domain === 'bundle') dependencies.push({ label: 'références vendables', count: await dependencyCount(client, 'hsd_sellables', 'bundle_id', id) })
  if (domain === 'sellable') dependencies.push({ label: 'handoffs CARELINK', count: await dependencyCount(client, 'hsd_handoff_requests', 'sellable_id', id) })
  const blockers = dependencies.filter((item) => item.count > 0)
  if (blockers.length) {
    throw Object.assign(new Error(`Suppression impossible: ${blockers.map((item) => `${item.count} ${item.label}`).join(', ')} utilisent ce dossier.`), { status: 409, code: 'DELETE_DEPENDENCY_PROTECTED' })
  }
  let query = client.from(config.table).delete().eq('id', id)
  if (config.tenantKind === 'text') query = query.eq('tenant_id', HSD_TENANT_ID)
  const result = await query.select('id')
  if (result.error) throw result.error
  return { deleted: result.data?.length || 0 }
}

function minutesBetween(start: string, end: string) {
  const [sh, sm] = String(start || '00:00').split(':').map(Number)
  const [eh, em] = String(end || '00:00').split(':').map(Number)
  return Math.max(0, (eh * 60 + em) - (sh * 60 + sm))
}

export async function runMasteryAction(domainInput: string, id: string, body: Row) {
  const domain = domainInput as MasteryDomain
  const config = domainConfig(domain)
  const actor = await requireHomeServiceApi(config.permission)
  const client = await masteryClient(true)
  const record = await byId(client, config.table, id, config)
  if (!record) throw Object.assign(new Error(`${config.label} introuvable.`), { status: 404 })
  assertTenant(record, actor, config)
  const action = String(body.action || '')

  if (domain === 'handoff' && action === 'add_handoff_date') {
    const serviceDate = String(body.serviceDate || '')
    const startTime = String(body.startTime || '09:00')
    const endTime = String(body.endTime || '17:00')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(serviceDate)) throw Object.assign(new Error('Date de mission valide requise.'), { status: 400 })
    const durationMinutes = minutesBetween(startTime, endTime)
    if (durationMinutes <= 0) throw Object.assign(new Error('L’heure de fin doit être postérieure à l’heure de début.'), { status: 400 })
    const currentDates = await related(client, 'hsd_handoff_request_dates', 'handoff_id', id, 'sequence')
    const result = await client.from('hsd_handoff_request_dates').insert({
      tenant_id: record.tenant_id, handoff_id: id, service_date: serviceDate, start_time: startTime, end_time: endTime,
      duration_minutes: durationMinutes, sequence: currentDates.length + 1, daily_objective: String(body.dailyObjective || ''), status: 'confirmed',
    }).select('*').single()
    if (result.error) throw result.error
    const allDates = [...currentDates, result.data]
    await client.from('hsd_handoff_requests').update({ mission_count: allDates.length, total_minutes: allDates.reduce((sum, item) => sum + Number(item.duration_minutes || 0), 0), updated_at: new Date().toISOString() }).eq('id', id)
    return { action, date: result.data }
  }

  if (domain === 'handoff' && action === 'remove_handoff_date') {
    const dateId = String(body.dateId || '')
    const deleted = await client.from('hsd_handoff_request_dates').delete().eq('id', dateId).eq('handoff_id', id).select('id')
    if (deleted.error) throw deleted.error
    const remaining = await related(client, 'hsd_handoff_request_dates', 'handoff_id', id, 'sequence')
    await client.from('hsd_handoff_requests').update({ mission_count: remaining.length, total_minutes: remaining.reduce((sum, item) => sum + Number(item.duration_minutes || 0), 0), updated_at: new Date().toISOString() }).eq('id', id)
    return { action, deleted: deleted.data?.length || 0 }
  }

  if (domain === 'handoff' && action === 'create_amendment') {
    const code = `HSD-AMD-${Date.now().toString(36).toUpperCase()}`
    const result = await client.from('hsd_handoff_amendments').insert({
      tenant_id: record.tenant_id, handoff_id: id, code, amendment_type: String(body.amendmentType || 'schedule'), status: 'draft',
      reason: String(body.reason || 'Modification demandée depuis le dossier opérationnel.'), requested_changes: body.requestedChanges && typeof body.requestedChanges === 'object' ? body.requestedChanges : {},
      applies_from_date: body.appliesFromDate || null, requested_by: userId(actor),
    }).select('*').single()
    if (result.error) throw result.error
    return { action, amendment: result.data }
  }

  if (domain === 'planning_request' && action === 'add_date') {
    const serviceDate = String(body.serviceDate || '')
    const startTime = String(body.startTime || '09:00')
    const endTime = String(body.endTime || '17:00')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(serviceDate)) throw Object.assign(new Error('Date de service valide requise.'), { status: 400 })
    const grossMinutes = minutesBetween(startTime, endTime)
    if (grossMinutes <= 0) throw Object.assign(new Error('L’heure de fin doit être postérieure à l’heure de début.'), { status: 400 })
    const handoverMinutes = Math.max(0, Number(body.handoverMinutes ?? 20))
    const reportMinutes = Math.max(0, Number(body.reportMinutes ?? 15))
    const careRoutineMinutes = Math.max(0, Number(body.careRoutineMinutes ?? 0))
    const travelMinutes = Math.max(0, Number(body.travelMinutes ?? 0))
    const usableMinutes = Math.max(0, grossMinutes - handoverMinutes - reportMinutes - careRoutineMinutes - travelMinutes)
    const result = await client.from('hsd_planning_request_dates').upsert({
      tenant_id: record.tenant_id, request_id: id, service_date: serviceDate, start_time: startTime, end_time: endTime,
      declared_minutes: grossMinutes, gross_minutes: grossMinutes, handover_minutes: handoverMinutes, report_minutes: reportMinutes,
      care_routine_minutes: careRoutineMinutes, travel_minutes: travelMinutes, usable_minutes: usableMinutes,
      status: usableMinutes >= 60 ? 'valid' : 'blocked', messages: usableMinutes >= 60 ? [] : ['Le temps utile est inférieur à 60 minutes.'],
    }, { onConflict: 'request_id,service_date' }).select('*').single()
    if (result.error) throw result.error
    return { action, date: result.data }
  }

  if (domain === 'planning_request' && action === 'remove_date') {
    const dateId = String(body.dateId || '')
    const result = await client.from('hsd_planning_request_dates').delete().eq('id', dateId).eq('request_id', id).select('id')
    if (result.error) throw result.error
    return { action, deleted: result.data?.length || 0 }
  }

  if (domain === 'planning_request' && action === 'add_beneficiary') {
    const displayName = String(body.displayName || '').trim()
    if (!displayName) throw Object.assign(new Error('Nom ou repère du bénéficiaire requis.'), { status: 400 })
    const profile = typeof body.profile === 'object' && body.profile ? body.profile : {}
    const result = await client.from('hsd_planning_request_beneficiaries').insert({
      tenant_id: record.tenant_id, request_id: id, display_name: displayName,
      age_years: body.ageYears === '' || body.ageYears == null ? null : Number(body.ageYears), age_band: String(body.ageBand || ''), profile,
      sensitive_profile: {},
    }).select('*').single()
    if (result.error) throw result.error
    return { action, beneficiary: result.data }
  }

  if (domain === 'planning_request' && action === 'run_feasibility') {
    const [datesResult, activitiesResult, capacityResult] = await Promise.all([
      client.from('hsd_planning_request_dates').select('*').eq('request_id', id),
      client.from('hsd_activity_library').select('id,code,name_fr,category_codes,status').contains('category_codes', [String(body.categoryCode || '')]),
      client.from('hsd_capacity_rules').select('*').eq('category_id', record.category_id).limit(1),
    ])
    if (datesResult.error) throw datesResult.error
    if (activitiesResult.error) throw activitiesResult.error
    if (capacityResult.error) throw capacityResult.error
    const findings: Array<{ code: string; severity: string; title: string; detail: string; recovery: string }> = []
    if (!(datesResult.data || []).length) findings.push({ code: 'NO_DATES', severity: 'blocking', title: 'Aucune date définie', detail: 'La demande ne contient aucune date réelle.', recovery: 'Ajoutez au moins une date et des heures.' })
    if (!(activitiesResult.data || []).length) findings.push({ code: 'NO_ACTIVITIES', severity: 'blocking', title: 'Aucune activité locale compatible', detail: 'La catégorie ne possède pas de bloc d’activité local utilisable.', recovery: 'Importez ou rattachez des activités à cette catégorie.' })
    for (const date of datesResult.data || []) if (Number(date.usable_minutes || 0) < 60) findings.push({ code: `TIME_${date.id}`, severity: 'major', title: 'Temps utile insuffisant', detail: `${date.service_date}: ${date.usable_minutes || 0} minutes utiles.`, recovery: 'Allongez la fenêtre ou réduisez les routines obligatoires.' })
    if (!(capacityResult.data || []).length) findings.push({ code: 'NO_CAPACITY', severity: 'warning', title: 'Capacité non configurée', detail: 'Le plan peut être composé, mais la faisabilité de capacité reste conditionnelle.', recovery: 'Configurez la capacité de la catégorie avant publication.' })
    const run = await client.from('hsd_feasibility_runs').insert({ tenant_id: record.tenant_id, request_id: id, status: findings.some((item) => item.severity === 'blocking') ? 'blocked' : findings.length ? 'conditional' : 'valid', rule_snapshot: { checkedAt: new Date().toISOString(), categoryId: record.category_id }, completed_at: new Date().toISOString() }).select('*').single()
    if (run.error) throw run.error
    if (findings.length) {
      const inserted = await client.from('hsd_feasibility_findings').insert(findings.map((item) => ({ tenant_id: record.tenant_id, run_id: run.data.id, ...item, status: 'open' })))
      if (inserted.error) throw inserted.error
    }
    return { action, run: run.data, findings }
  }

  if (domain === 'planning_request' && action === 'create_plan') {
    const scenarioId = String(body.scenarioId || '')
    const scenario = scenarioId ? await byId(client, 'hsd_plan_scenarios', scenarioId) : null
    if (!scenario || scenario.request_id !== id) throw Object.assign(new Error('Scénario de planification valide requis.'), { status: 400 })
    const planCode = `HSD-PLAN-${Date.now().toString(36).toUpperCase()}`
    const plan = await client.from('hsd_technical_plans').insert({ tenant_id: record.tenant_id, request_id: id, selected_scenario_id: scenarioId, code: planCode, status: 'draft', current_version: 1, created_by: userId(actor) }).select('*').single()
    if (plan.error) throw plan.error
    const version = await client.from('hsd_technical_plan_versions').insert({ tenant_id: record.tenant_id, plan_id: plan.data.id, version_number: 1, status: 'draft', snapshot: { scenario, request: record }, source_scenario_id: scenarioId }).select('*').single()
    if (version.error) throw version.error
    const scenarioDays = await related(client, 'hsd_plan_scenario_days', 'scenario_id', scenarioId, 'day_number')
    for (const day of scenarioDays) {
      const createdDay = await client.from('hsd_technical_plan_days').insert({ tenant_id: record.tenant_id, version_id: version.data.id, service_date: day.service_date, day_number: day.day_number, objective: day.objective, progression_phase: day.progression_phase, start_time: day.start_time, end_time: day.end_time, gross_minutes: day.gross_minutes, usable_minutes: day.usable_minutes }).select('*').single()
      if (createdDay.error) throw createdDay.error
      const scenarioBlocks = await related(client, 'hsd_plan_scenario_blocks', 'day_id', day.id, 'sort_order')
      if (scenarioBlocks.length) {
        const insertedBlocks = await client.from('hsd_technical_plan_blocks').insert(scenarioBlocks.map((block) => ({ tenant_id: record.tenant_id, plan_day_id: createdDay.data.id, activity_snapshot: { activityId: block.activity_id, activityCode: block.activity_code, label: block.label, kind: block.kind, objective: block.objective, materials: block.materials, competencies: block.competencies, safeguards: block.safeguards }, start_time: block.start_time, end_time: block.end_time, duration_minutes: block.duration_minutes, locked: block.locked, sort_order: block.sort_order })))
        if (insertedBlocks.error) throw insertedBlocks.error
      }
    }
    return { action, plan: plan.data, version: version.data }
  }

  if (domain === 'commercial_scenario' && action === 'create_offer') {
    const code = `HSD-OFF-${Date.now().toString(36).toUpperCase()}`
    const result = await client.from('hsd_offer_drafts').insert({
      tenant_id: record.tenant_id, code, title: String(body.title || record.name || 'Nouvelle offre'), universe: String(body.universe || 'b2c'),
      status: 'draft', technical_plan_version_id: record.technical_plan_version_id, scenario_id: record.id,
      customer_segment: String(body.customerSegment || ''), commercial_name: String(body.commercialName || record.name || ''), promise: String(body.promise || record.promise || ''), validity_days: Math.max(1, Number(body.validityDays || 30)), created_by: userId(actor),
    }).select('*').single()
    if (result.error) throw result.error
    return { action, offer: result.data }
  }

  if (domain === 'offer' && action === 'create_sellable') {
    const code = `HSD-SELL-${Date.now().toString(36).toUpperCase()}`
    const result = await client.from('hsd_sellables').insert({
      tenant_id: record.tenant_id, code, commercial_name: String(body.commercialName || record.commercial_name || record.title), technical_name: String(body.technicalName || record.title),
      universe: record.universe, status: 'draft', technical_plan_version_id: record.technical_plan_version_id, offer_id: record.id, bundle_id: null,
      active_version: 1, promise: String(body.promise || record.promise || ''), calculation_snapshot: record.calculation_snapshot || {}, readiness: 'conditional', created_by: userId(actor),
    }).select('*').single()
    if (result.error) throw result.error
    const version = await client.from('hsd_sellable_versions').insert({ tenant_id: record.tenant_id, sellable_id: result.data.id, version_number: 1, status: 'draft', snapshot: { offer: record }, technical_plan_version_id: record.technical_plan_version_id }).select('*').single()
    if (version.error) throw version.error
    return { action, sellable: result.data, version: version.data }
  }

  if (domain === 'bundle' && action === 'add_bundle_item') {
    const offerId = String(body.offerId || '')
    if (!offerId) throw Object.assign(new Error('Offre source requise.'), { status: 400 })
    const offer = await byId(client, 'hsd_offer_drafts', offerId, MASTERY_DOMAINS.offer)
    if (!offer) throw Object.assign(new Error('Offre source introuvable.'), { status: 404 })
    const currentItems = await related(client, 'hsd_bundle_items', 'bundle_id', id, 'sort_order')
    const row = await client.from('hsd_bundle_items').insert({ tenant_id: record.tenant_id, bundle_id: id, offer_id: offerId, sellable_id: null, item_type: 'offer', item_code: offer.code, label: offer.commercial_name || offer.title, quantity: Math.max(1, Number(body.quantity || 1)), configuration: {}, sort_order: currentItems.length }).select('*').single()
    if (row.error) throw row.error
    await client.from('hsd_bundles').update({ item_count: currentItems.length + 1, updated_at: new Date().toISOString() }).eq('id', id)
    return { action, item: row.data }
  }

  if (domain === 'bundle' && action === 'remove_bundle_item') {
    const itemId = String(body.itemId || '')
    const deleted = await client.from('hsd_bundle_items').delete().eq('id', itemId).eq('bundle_id', id).select('id')
    if (deleted.error) throw deleted.error
    const remaining = await dependencyCount(client, 'hsd_bundle_items', 'bundle_id', id)
    await client.from('hsd_bundles').update({ item_count: remaining, updated_at: new Date().toISOString() }).eq('id', id)
    return { action, deleted: deleted.data?.length || 0 }
  }

  if (domain === 'bundle' && action === 'create_sellable') {
    const items = await related(client, 'hsd_bundle_items', 'bundle_id', id, 'sort_order')
    const firstOffer = items.find((item) => item.offer_id)
    if (!firstOffer?.offer_id) throw Object.assign(new Error('Le bundle doit contenir au moins une offre source.'), { status: 400 })
    const offer = await byId(client, 'hsd_offer_drafts', firstOffer.offer_id, MASTERY_DOMAINS.offer)
    if (!offer) throw Object.assign(new Error('Offre source introuvable.'), { status: 400 })
    const code = `HSD-SELL-${Date.now().toString(36).toUpperCase()}`
    const result = await client.from('hsd_sellables').insert({ tenant_id: record.tenant_id, code, commercial_name: String(body.commercialName || record.name), technical_name: String(body.technicalName || record.name), universe: record.universe, status: 'draft', technical_plan_version_id: offer.technical_plan_version_id, offer_id: null, bundle_id: record.id, active_version: 1, promise: String(body.promise || ''), calculation_snapshot: record.calculation_snapshot || {}, readiness: String(record.compatibility_status || 'conditional'), created_by: userId(actor) }).select('*').single()
    if (result.error) throw result.error
    const version = await client.from('hsd_sellable_versions').insert({ tenant_id: record.tenant_id, sellable_id: result.data.id, version_number: 1, status: 'draft', snapshot: { bundle: record, items }, technical_plan_version_id: offer.technical_plan_version_id }).select('*').single()
    if (version.error) throw version.error
    return { action, sellable: result.data, version: version.data }
  }

  if (domain === 'quality_signal' && action === 'create_improvement') {
    const code = `HSD-IMP-${Date.now().toString(36).toUpperCase()}`
    const result = await client.from('hsd_improvement_proposals').insert({ tenant_id: record.tenant_id, code, signal_id: record.id, target_type: String(body.targetType || 'service_category'), target_id: String(body.targetId || record.id), status: 'draft', title: String(body.title || `Amélioration · ${record.title}`), hypothesis: String(body.hypothesis || record.summary || ''), expected_benefit: String(body.expectedBenefit || ''), risk_summary: String(body.riskSummary || ''), safety_review_required: Boolean(body.safetyReviewRequired ?? false), pilot_required: Boolean(body.pilotRequired ?? false), created_by: userId(actor) }).select('*').single()
    if (result.error) throw result.error
    return { action, improvement: result.data }
  }

  if (action === 'transition') {
    const status = String(body.status || '').trim()
    if (!status) throw Object.assign(new Error('Statut cible requis.'), { status: 400 })
    return { action, record: await updateMasteryRecord(domain, id, { status }) }
  }

  throw Object.assign(new Error(`Action « ${action || 'inconnue'} » non prise en charge pour ${config.label}.`), { status: 400, code: 'UNKNOWN_MASTERY_ACTION' })
}


export async function listMasteryRecords(domainInput: string) {
  const domain = domainInput as MasteryDomain
  const config = domainConfig(domain)
  await requireHomeServiceApi('homeservice_design.view')
  const client = await masteryClient(false)
  let query = client.from(config.table).select('*').order('updated_at', { ascending: false }).limit(150)
  if (config.tenantKind === 'text') query = query.eq('tenant_id', HSD_TENANT_ID)
  let result = await query
  if (result.error && /updated_at|column/i.test(String(result.error.message || ''))) {
    let retry = client.from(config.table).select('*').order('created_at', { ascending: false }).limit(150)
    if (config.tenantKind === 'text') retry = retry.eq('tenant_id', HSD_TENANT_ID)
    result = await retry
  }
  if (result.error) throw result.error
  return { domain, label: config.label, records: result.data || [] }
}

export async function createMasteryRecord(domainInput: string, input: Row) {
  const domain = domainInput as MasteryDomain
  const config = domainConfig(domain)
  const actor = await requireHomeServiceApi(config.permission)
  const client = await masteryClient(true)
  if (domain === 'commercial_request') {
    const planId = String(input.technicalPlanId || input.technical_plan_id || '')
    const planVersionId = String(input.technicalPlanVersionId || input.technical_plan_version_id || '')
    if (!planId || !planVersionId) throw Object.assign(new Error('Plan technique et version source requis.'), { status: 400 })
    const code = `HSD-COM-${Date.now().toString(36).toUpperCase()}`
    const row = await client.from(config.table).insert({ tenant_id: HSD_TENANT_ID, code, title: String(input.title || 'Nouvelle demande commerciale'), universe: input.universe === 'b2b' ? 'b2b' : 'b2c', status: 'draft', technical_plan_id: planId, technical_plan_version_id: planVersionId, category_id: input.categoryId || null, customer_segment: String(input.customerSegment || 'family'), commercial_objective: String(input.commercialObjective || 'Créer une offre claire et vendable'), scenario_count: Math.max(1, Math.min(10, Number(input.scenarioCount || 3))), constraints: input.constraints && typeof input.constraints === 'object' ? input.constraints : {}, created_by: userId(actor) }).select('*').single()
    if (row.error) throw row.error
    return row.data
  }
  if (domain === 'bundle') {
    const code = `HSD-BND-${Date.now().toString(36).toUpperCase()}`
    const row = await client.from(config.table).insert({ tenant_id: HSD_TENANT_ID, code, name: String(input.name || 'Nouveau bundle'), universe: input.universe === 'b2b' ? 'b2b' : 'b2c', status: 'draft', bundle_type: String(input.bundleType || 'service_bundle'), item_count: 0, compatibility_status: 'conditional', calculation_snapshot: {}, created_by: userId(actor) }).select('*').single()
    if (row.error) throw row.error
    return row.data
  }
  if (domain === 'handoff_amendment') {
    const handoffId = String(input.handoffId || '')
    if (!handoffId) throw Object.assign(new Error('Handoff source requis.'), { status: 400 })
    const row = await client.from(config.table).insert({ tenant_id: HSD_TENANT_ID, handoff_id: handoffId, amendment_type: String(input.amendmentType || 'schedule_change'), status: 'draft', reason: String(input.reason || 'Modification opérationnelle'), requested_changes: input.requestedChanges && typeof input.requestedChanges === 'object' ? input.requestedChanges : {}, applies_from_date: input.appliesFromDate || null, created_by: userId(actor) }).select('*').single()
    if (row.error) throw row.error
    return row.data
  }
  if (domain === 'quality_signal') {
    const code = `HSD-QS-${Date.now().toString(36).toUpperCase()}`
    const row = await client.from(config.table).insert({ tenant_id: HSD_TENANT_ID, code, signal_type: String(input.signalType || 'service_quality'), severity: String(input.severity || 'warning'), status: 'open', title: String(input.title || 'Nouveau signal qualité'), summary: String(input.summary || ''), customer_impact: String(input.customerImpact || ''), operational_impact: String(input.operationalImpact || ''), commercial_impact: String(input.commercialImpact || ''), source_count: 0, owner_id: userId(actor), created_by: userId(actor) }).select('*').single()
    if (row.error) throw row.error
    return row.data
  }
  throw Object.assign(new Error(`Création directe non disponible pour ${config.label}. Utilisez sa source métier.`), { status: 400, code: 'MASTERY_CREATE_NOT_SUPPORTED' })
}

export function errorPayload(error: unknown) {
  const value = error as { message?: string; status?: number; code?: string }
  return { status: Number(value?.status || 500), body: { ok: false, error: value?.message || 'Action Service Design impossible.', code: value?.code || 'MASTERY_ERROR', correlationId: crypto.randomUUID() } }
}

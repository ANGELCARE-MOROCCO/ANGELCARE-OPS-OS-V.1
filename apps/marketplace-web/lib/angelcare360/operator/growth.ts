import { requireAngelcare360OperatorPermission } from './access'
import { writeOperatorAuditLog } from './audit'
import { archiveOperatorClient, createOperatorClient, updateOperatorClient } from './clients'
import { createOperatorContract } from './contracts'
import { createOperatorSubscription } from './subscriptions'
import { getOperatorClient, asNumber, asString, asStringArray, toRecord } from './shared'
import { compileTenantEntitlements, loadProductKernelSnapshot } from './product-kernel'
import { provisionGrowthInstitutionSanilaSchool } from './institution-school-provisioning'
import type {
  GrowthAccountPlanRecord,
  GrowthApprovalRecord,
  GrowthChangeOrderRecord,
  GrowthEscalationRecord,
  GrowthForecastRecord,
  GrowthHealthModelRecord,
  GrowthRelationshipCoverageRecord,
  GrowthSuccessPlanRecord,
  GrowthSupportEntitlementRecord,
  GrowthCaseEventRecord,
  GrowthCommercialFindingRecord,
  GrowthContactRecord,
  GrowthCustomerCaseRecord,
  GrowthExpansionRecord,
  GrowthInstitutionRecord,
  GrowthInteractionRecord,
  GrowthInterventionRecord,
  GrowthMetric,
  GrowthNegotiationRecord,
  GrowthOfferRecord,
  GrowthOfferVersionRecord,
  GrowthOpportunityRecord,
  GrowthProductOption,
  GrowthProspectRecord,
  GrowthSourceReport,
  GrowthStakeholderRecord,
  GrowthWorkspaceSnapshot,
} from '@/types/angelcare360/operator/growth'

const TABLES = {
  prospect: 'angelcare360_operator_growth_prospects',
  contact: 'angelcare360_operator_growth_contacts',
  institution: 'angelcare360_operator_growth_institutions',
  opportunity: 'angelcare360_operator_growth_opportunities',
  stakeholder: 'angelcare360_operator_growth_stakeholders',
  offer: 'angelcare360_operator_growth_offers',
  offer_version: 'angelcare360_operator_growth_offer_versions',
  negotiation: 'angelcare360_operator_growth_negotiations',
  interaction: 'angelcare360_operator_growth_interactions',
  expansion: 'angelcare360_operator_growth_expansion',
  intervention: 'angelcare360_operator_growth_interventions',
  case: 'angelcare360_operator_customer_cases',
  case_event: 'angelcare360_operator_customer_case_events',
  finding: 'angelcare360_operator_commercial_findings',
  account_plan: 'angelcare360_operator_growth_account_plans',
  relationship_coverage: 'angelcare360_operator_growth_relationship_coverage',
  forecast: 'angelcare360_operator_growth_forecasts',
  approval: 'angelcare360_operator_growth_approvals',
  change_order: 'angelcare360_operator_growth_change_orders',
  success_plan: 'angelcare360_operator_growth_success_plans',
  health_model: 'angelcare360_operator_growth_health_models',
  support_entitlement: 'angelcare360_operator_growth_support_entitlements',
  escalation: 'angelcare360_operator_growth_escalations',
} as const

type GrowthEntity = keyof typeof TABLES
type Loaded<T> = { key: string; label: string; rows: T[]; state: 'complete' | 'unavailable'; message: string | null }

async function loadRows<T>(key: string, label: string, table: string, order = 'updated_at'): Promise<Loaded<T>> {
  const supabase = await getOperatorClient()
  const { data, error } = await supabase.from(table).select('*').order(order, { ascending: false })
  if (error) return { key, label, rows: [], state: 'unavailable', message: error.message }
  return { key, label, rows: (data || []) as T[], state: 'complete', message: null }
}

export async function loadGrowthWorkspaceSnapshot(): Promise<GrowthWorkspaceSnapshot> {
  await requireAngelcare360OperatorPermission('operator.clients.view')
  const [
    clients, tenants, subscriptions, plans, contracts, renewals, invoices, payments, tickets, incidents, onboarding,
    prospects, contacts, institutions, opportunities, stakeholders, offers, offerVersions, negotiations, interactions,
    expansion, interventions, cases, caseEvents, findings,
    accountPlans, relationshipCoverage, forecasts, approvals, changeOrders, successPlans, healthModels, supportEntitlements, escalations,
  ] = await Promise.all([
    loadRows<Record<string, unknown>>('clients', 'Clients', 'angelcare360_operator_clients'),
    loadRows<Record<string, unknown>>('tenants', 'Tenants', 'angelcare360_operator_tenants'),
    loadRows<Record<string, unknown>>('subscriptions', 'Abonnements', 'angelcare360_operator_subscriptions'),
    loadRows<Record<string, unknown>>('plans', 'Plans', 'angelcare360_operator_plans'),
    loadRows<Record<string, unknown>>('contracts', 'Contrats', 'angelcare360_operator_contracts'),
    loadRows<Record<string, unknown>>('renewals', 'Renouvellements', 'angelcare360_operator_renewals'),
    loadRows<Record<string, unknown>>('invoices', 'Factures', 'angelcare360_operator_invoices'),
    loadRows<Record<string, unknown>>('payments', 'Paiements', 'angelcare360_operator_payments'),
    loadRows<Record<string, unknown>>('tickets', 'Support', 'angelcare360_operator_support_tickets'),
    loadRows<Record<string, unknown>>('incidents', 'Incidents', 'angelcare360_operator_incidents'),
    loadRows<Record<string, unknown>>('onboarding', 'Onboarding', 'angelcare360_operator_onboarding_tasks'),
    loadRows<GrowthProspectRecord>('prospects', 'Prospects', TABLES.prospect),
    loadRows<GrowthContactRecord>('contacts', 'Contacts & influence', TABLES.contact),
    loadRows<GrowthInstitutionRecord>('institutions', 'Institutions', TABLES.institution),
    loadRows<GrowthOpportunityRecord>('opportunities', 'Opportunités', TABLES.opportunity),
    loadRows<GrowthStakeholderRecord>('stakeholders', 'Stakeholders', TABLES.stakeholder),
    loadRows<GrowthOfferRecord>('offers', 'Offres', TABLES.offer),
    loadRows<GrowthOfferVersionRecord>('offer_versions', 'Versions d’offre', TABLES.offer_version, 'created_at'),
    loadRows<GrowthNegotiationRecord>('negotiations', 'Négociations', TABLES.negotiation, 'occurred_at'),
    loadRows<GrowthInteractionRecord>('interactions', 'Interactions', TABLES.interaction, 'occurred_at'),
    loadRows<GrowthExpansionRecord>('expansion', 'Expansion', TABLES.expansion),
    loadRows<GrowthInterventionRecord>('interventions', 'Interventions', TABLES.intervention),
    loadRows<GrowthCustomerCaseRecord>('cases', 'Cas clients', TABLES.case),
    loadRows<GrowthCaseEventRecord>('case_events', 'Chronologie cas', TABLES.case_event, 'occurred_at'),
    loadRows<GrowthCommercialFindingRecord>('findings', 'Intelligence commerciale', TABLES.finding, 'detected_at'),
    loadRows<GrowthAccountPlanRecord>('account_plans', 'Plans de compte', TABLES.account_plan),
    loadRows<GrowthRelationshipCoverageRecord>('relationship_coverage', 'Couverture relationnelle', TABLES.relationship_coverage, 'assessed_at'),
    loadRows<GrowthForecastRecord>('forecasts', 'Forecast gouverné', TABLES.forecast, 'snapshot_at'),
    loadRows<GrowthApprovalRecord>('approvals', 'Approbations commerciales', TABLES.approval),
    loadRows<GrowthChangeOrderRecord>('change_orders', 'Change orders', TABLES.change_order),
    loadRows<GrowthSuccessPlanRecord>('success_plans', 'Customer success plans', TABLES.success_plan),
    loadRows<GrowthHealthModelRecord>('health_models', 'Modèles de santé', TABLES.health_model),
    loadRows<GrowthSupportEntitlementRecord>('support_entitlements', 'Entitlements support', TABLES.support_entitlement),
    loadRows<GrowthEscalationRecord>('escalations', 'Escalades comptes', TABLES.escalation),
  ])

  const loaded = [clients, tenants, subscriptions, plans, contracts, renewals, invoices, payments, tickets, incidents, onboarding, prospects, contacts, institutions, opportunities, stakeholders, offers, offerVersions, negotiations, interactions, expansion, interventions, cases, caseEvents, findings, accountPlans, relationshipCoverage, forecasts, approvals, changeOrders, successPlans, healthModels, supportEntitlements, escalations]
  const sources: GrowthSourceReport[] = loaded.map((item) => ({ key: item.key, label: item.label, state: item.state, count: item.rows.length, message: item.message }))
  const unavailable = sources.filter((source) => source.state === 'unavailable').length
  const sourceState = unavailable === 0 ? 'complete' : unavailable === sources.length ? 'unavailable' : 'partial'

  let products: GrowthProductOption[] = []
  try {
    const product = await loadProductKernelSnapshot()
    products = [
      ...product.packageVersions.filter((item) => item.status === 'published').map((item) => ({ id: item.id, type: 'package' as const, name: item.name, status: String(item.status), priceMad: asNumber(item.monthly_price, 0), detail: `${item.version_code} · ${item.support_tier}` })),
      ...product.modules.filter((item) => item.status === 'published').map((item) => ({ id: item.id, type: 'module' as const, name: item.name, status: String(item.status), priceMad: 0, detail: `${item.version} · ${item.sellability}` })),
      ...product.addons.filter((item) => item.status === 'published').map((item) => ({ id: item.id, type: 'addon' as const, name: item.name, status: String(item.status), priceMad: asNumber(item.list_price, 0), detail: `${item.billing_model} · ${item.addon_type}` })),
      ...product.meters.filter((item) => item.status === 'active' || item.status === 'published').map((item) => ({ id: item.id, type: 'meter' as const, name: item.name, status: String(item.status), priceMad: 0, detail: `${item.unit} · ${item.reset_cycle || 'sans cycle'}` })),
    ]
  } catch {
    products = []
  }

  const metrics = buildGrowthMetrics({
    clients: clients.rows, opportunities: opportunities.rows, offers: offers.rows, renewals: renewals.rows,
    subscriptions: subscriptions.rows, invoices: invoices.rows, expansion: expansion.rows, cases: cases.rows,
    tickets: tickets.rows, incidents: incidents.rows,
  })

  return {
    generatedAt: new Date().toISOString(), sourceState, sources, metrics,
    clients: clients.rows, prospects: prospects.rows, contacts: contacts.rows, institutions: institutions.rows,
    opportunities: opportunities.rows, stakeholders: stakeholders.rows, offers: offers.rows, offerVersions: offerVersions.rows,
    negotiations: negotiations.rows, interactions: interactions.rows, expansion: expansion.rows, interventions: interventions.rows,
    cases: cases.rows, caseEvents: caseEvents.rows, findings: findings.rows,
    accountPlans: accountPlans.rows, relationshipCoverage: relationshipCoverage.rows, forecasts: forecasts.rows,
    approvals: approvals.rows, changeOrders: changeOrders.rows, successPlans: successPlans.rows, healthModels: healthModels.rows,
    supportEntitlements: supportEntitlements.rows, escalations: escalations.rows,
    contracts: contracts.rows, renewals: renewals.rows,
    subscriptions: subscriptions.rows, plans: plans.rows, tenants: tenants.rows, invoices: invoices.rows, payments: payments.rows,
    tickets: tickets.rows, incidents: incidents.rows, onboarding: onboarding.rows, products,
  }
}

function buildGrowthMetrics(input: {
  clients: Array<Record<string, unknown>>
  opportunities: GrowthOpportunityRecord[]
  offers: GrowthOfferRecord[]
  renewals: Array<Record<string, unknown>>
  subscriptions: Array<Record<string, unknown>>
  invoices: Array<Record<string, unknown>>
  expansion: GrowthExpansionRecord[]
  cases: GrowthCustomerCaseRecord[]
  tickets: Array<Record<string, unknown>>
  incidents: Array<Record<string, unknown>>
}): GrowthMetric[] {
  const liveDeals = input.opportunities.filter((row) => !['won', 'lost', 'archived'].includes(String(row.status)))
  const pipeline = liveDeals.reduce((sum, row) => sum + asNumber(row.expected_arr_mad, 0), 0)
  const weighted = liveDeals.reduce((sum, row) => sum + asNumber(row.expected_arr_mad, 0) * (asNumber(row.probability, 0) / 100), 0)
  const activeMrr = input.subscriptions.filter((row) => String(row.status) === 'active').reduce((sum, row) => sum + asNumber(row.billing_amount_mad, 0), 0)
  const atRiskRenewals = input.renewals.filter((row) => ['at_risk', 'lost'].includes(String(row.status))).length
  const openCases = input.cases.filter((row) => !['resolved', 'closed', 'archived'].includes(row.status)).length
  const legacyPressure = input.tickets.filter((row) => !['resolved', 'closed', 'archived'].includes(String(row.status))).length + input.incidents.filter((row) => !['resolved', 'archived'].includes(String(row.status))).length
  const overdue = input.invoices.reduce((sum, row) => sum + asNumber(row.balance_due_mad, 0), 0)
  return [
    { key: 'pipeline', label: 'Pipeline brut', value: `${Math.round(pipeline).toLocaleString('fr-FR')} Dh`, detail: `${liveDeals.length} deal(s) actif(s)` },
    { key: 'weighted', label: 'Prévision pondérée', value: `${Math.round(weighted).toLocaleString('fr-FR')} Dh`, detail: 'Probabilité × ARR' },
    { key: 'mrr', label: 'MRR activé', value: `${Math.round(activeMrr).toLocaleString('fr-FR')} Dh`, detail: `${input.subscriptions.filter((row) => String(row.status) === 'active').length} abonnement(s)`, tone: 'good' },
    { key: 'contracts', label: 'Offres acceptées', value: String(input.offers.filter((row) => ['accepted', 'converted'].includes(row.status)).length), detail: 'Prêtes à contractualiser' },
    { key: 'renewals', label: 'Renouvellements exposés', value: String(atRiskRenewals), detail: `${input.renewals.length} dossier(s)`, tone: atRiskRenewals ? 'warning' : 'good' },
    { key: 'pressure', label: 'Pression client', value: String(openCases + legacyPressure), detail: 'Cas, tickets et incidents ouverts', tone: openCases + legacyPressure ? 'warning' : 'good' },
    { key: 'overdue', label: 'Exposition financière', value: `${Math.round(overdue).toLocaleString('fr-FR')} Dh`, detail: 'Solde restant dû', tone: overdue ? 'critical' : 'good' },
    { key: 'expansion', label: 'Expansion identifiée', value: `${input.expansion.reduce((sum, row) => sum + asNumber(row.expected_mrr_mad, 0), 0).toLocaleString('fr-FR')} Dh`, detail: `${input.expansion.length} opportunité(s)` },
  ]
}

const ENTITY_FIELDS: Record<GrowthEntity, string[]> = {
  prospect: ['prospect_code','organization_name','organization_type','status','qualification_stage','source','city','region','country','potential_mrr_mad','estimated_students','institution_count','current_solution','pain_points','product_fit','owner_id','next_action','next_action_at','converted_client_id','notes','archived_at'],
  contact: ['client_id','prospect_id','full_name','email','phone','role_type','job_title','institution_name','influence_level','decision_authority','relationship_strength','position','is_primary','communication_preferences','last_interaction_at','next_engagement_at','status','notes','archived_at'],
  institution: ['client_id','prospect_id','institution_code','name','institution_type','status','city','region','country','address','estimated_students','estimated_staff','tenant_id','primary_contact_id','onboarding_state','service_health','metadata','notes','archived_at'],
  opportunity: ['opportunity_code','client_id','prospect_id','name','objective','stage','status','owner_id','sponsor_id','expected_mrr_mad','expected_arr_mad','probability','expected_close_date','package_version_id','product_configuration','competition','risks','next_event','next_event_at','loss_reason','won_at','lost_at','archived_at'],
  stakeholder: ['opportunity_id','contact_id','stakeholder_role','influence_level','decision_position','engagement_state','required_for_close','notes'],
  offer: ['offer_code','opportunity_id','client_id','prospect_id','name','status','package_version_id','configuration_snapshot','price_book_id','monthly_price_mad','annual_price_mad','setup_fee_mad','discount_mad','contract_value_mad','contract_duration_months','payment_schedule','validity_date','approval_status','value_case','submitted_at','accepted_at','rejected_at','converted_contract_id','notes','archived_at'],
  offer_version: ['offer_id','version_number','status','configuration_snapshot','pricing_snapshot','value_case_snapshot','change_summary','created_by'],
  negotiation: ['opportunity_id','offer_id','client_id','event_type','occurred_at','customer_position','angelcare_position','objection','requested_concession','approved_boundary','financial_impact_mad','decision_due_at','next_meeting_at','outcome','notes','created_by'],
  interaction: ['client_id','prospect_id','opportunity_id','contact_id','interaction_type','subject','summary','occurred_at','outcome','next_action','next_action_at','created_by'],
  expansion: ['client_id','tenant_id','subscription_id','opportunity_type','title','status','expected_mrr_mad','evidence','recommended_package_version_id','owner_id','next_action','next_action_at','notes'],
  intervention: ['client_id','intervention_type','title','status','priority','diagnosis','business_risk','financial_exposure_mad','service_impact','owner_id','sponsor_id','action_plan','due_date','expected_outcome','outcome_status','notes'],
  case: ['case_reference','case_type','source_channel','client_id','institution_id','tenant_id','subscription_id','related_module_key','subject','description','status','severity','priority','business_impact','customer_sentiment','owner_id','team','sla_policy','due_at','escalated_at','root_cause','resolution_summary','customer_confirmation','outcome_status','source_ticket_id','source_incident_id','reopened_count','archived_at'],
  case_event: ['case_id','event_type','summary','visibility','actor_id','occurred_at','metadata'],
  finding: ['finding_type','severity','entity_type','entity_id','client_id','title','explanation','evidence','recommended_action','status','detected_at','resolved_at'],
  account_plan: ['client_id','title','status','horizon_months','ambition_mad','current_footprint','potential_footprint','strategic_priorities','whitespace_opportunities','competitive_position','stakeholder_strategy','milestones','owner_id','executive_sponsor_id','next_review_at','notes'],
  relationship_coverage: ['client_id','status','executive_sponsor_score','economic_buyer_score','contract_authority_score','operational_champion_score','relationship_recency_score','single_contact_dependency','missing_roles','risk_signals','evidence','assessed_at','assessed_by'],
  forecast: ['opportunity_id','owner_id','period_key','forecast_category','seller_amount_mad','manager_amount_mad','confidence','adjustment_reason','snapshot_at','locked_at'],
  approval: ['client_id','opportunity_id','offer_id','approval_type','status','requested_value','policy_limit','financial_impact_mad','required_authority','approver_id','decision_reason','due_at','decided_at','created_by'],
  change_order: ['client_id','contract_id','subscription_id','change_order_code','change_type','status','current_state','proposed_state','billing_effect','entitlement_effect','effective_at','approval_id','customer_communication_required','reason','created_by'],
  success_plan: ['client_id','title','status','objective','baseline_value','target_value','current_value','success_metrics','product_capabilities','milestones','customer_owner','angelcare_owner_id','next_review_at','outcome_status','evidence'],
  health_model: ['name','status','is_default','dimensions','thresholds','refresh_cadence','recovery_playbooks'],
  support_entitlement: ['client_id','contract_id','subscription_id','support_tier','status','covered_modules','covered_institutions','included_hours','consumed_hours','response_target_minutes','resolution_target_minutes','support_channels','escalation_level','business_calendar','out_of_scope_policy','effective_from','effective_to'],
  escalation: ['client_id','case_id','escalation_type','status','severity','title','revenue_exposure_mad','relationship_exposure','owner_id','executive_sponsor_id','command_team','review_cadence','exit_criteria','next_checkpoint_at','resolved_at'],
}

function normalize(entity: GrowthEntity, input: Record<string, unknown>) {
  const output: Record<string, unknown> = {}
  const numeric = new Set(['potential_mrr_mad','expected_mrr_mad','expected_arr_mad','probability','monthly_price_mad','annual_price_mad','setup_fee_mad','discount_mad','contract_value_mad','contract_duration_months','financial_exposure_mad','estimated_students','estimated_staff','institution_count','financial_impact_mad','version_number','reopened_count','horizon_months','ambition_mad','executive_sponsor_score','economic_buyer_score','contract_authority_score','operational_champion_score','relationship_recency_score','seller_amount_mad','manager_amount_mad','confidence','financial_impact_mad','included_hours','consumed_hours','response_target_minutes','resolution_target_minutes','revenue_exposure_mad'])
  const arrays = new Set(['pain_points','risks','strategic_priorities','whitespace_opportunities','missing_roles','risk_signals','product_capabilities','covered_modules','covered_institutions','support_channels','command_team','exit_criteria'])
  const objects = new Set(['product_fit','product_configuration','configuration_snapshot','pricing_snapshot','value_case_snapshot','value_case','communication_preferences','evidence','metadata','current_footprint','potential_footprint','stakeholder_strategy','requested_value','policy_limit','current_state','proposed_state','billing_effect','entitlement_effect','thresholds','recovery_playbooks','business_calendar'])
  for (const field of ENTITY_FIELDS[entity]) {
    if (!(field in input)) continue
    const value = input[field]
    if (numeric.has(field)) output[field] = value === '' || value === null ? null : asNumber(value, 0)
    else if (arrays.has(field)) output[field] = asStringArray(value)
    else if (objects.has(field)) output[field] = toRecord(value)
    else if (['action_plan','milestones','success_metrics','dimensions'].includes(field)) output[field] = Array.isArray(value) ? value : []
    else if (['is_primary','required_for_close','single_contact_dependency','customer_communication_required','is_default'].includes(field)) output[field] = Boolean(value)
    else output[field] = value === '' ? null : value
  }
  if (!['offer_version','case_event'].includes(entity)) output.updated_at = new Date().toISOString()
  return output
}

function entityClientId(record: Record<string, unknown> | null | undefined) {
  return asString(record?.client_id) || null
}

async function createGrowthEntity(entity: GrowthEntity, input: Record<string, unknown>) {
  const session = await requireAngelcare360OperatorPermission('operator.clients.create')
  const supabase = await getOperatorClient()
  const payload = normalize(entity, input)
  if (entity === 'prospect' && !payload.prospect_code) payload.prospect_code = `PRO-${Date.now().toString().slice(-8)}`
  if (entity === 'institution' && !payload.institution_code) payload.institution_code = `INS-${Date.now().toString().slice(-8)}`
  if (entity === 'opportunity' && !payload.opportunity_code) payload.opportunity_code = `OPP-${Date.now().toString().slice(-8)}`
  if (entity === 'offer' && !payload.offer_code) payload.offer_code = `OFF-${Date.now().toString().slice(-8)}`
  if (entity === 'case' && !payload.case_reference) payload.case_reference = `CASE-${Date.now().toString().slice(-10)}`
  if (entity === 'change_order' && !payload.change_order_code) payload.change_order_code = `CO-${Date.now().toString().slice(-9)}`
  if (['interaction','offer_version','negotiation','case_event','approval','change_order'].includes(entity)) payload.created_by = payload.created_by || session.user.id
  if (entity === 'case') await applyContractualSupportEntitlement(payload)
  const { data, error } = await supabase.from(TABLES[entity]).insert(payload).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({ module: 'growth', action: `${entity}.created`, entityType: TABLES[entity], entityId: String(data.id), clientId: entityClientId(data as Record<string, unknown>), severity: 'notice', afterData: payload, metadata: { operator_role: session.operatorRole } })
  if (entity === 'case') await createCaseEvent(String(data.id), 'created', 'Cas client créé et placé dans le flux de triage.', session.user.id)
  if (entity === 'offer') await snapshotOfferVersion(data as Record<string, unknown>, session.user.id, 'Version initiale')
  return { ok: true, record: data }
}

async function updateGrowthEntity(entity: GrowthEntity, input: Record<string, unknown>) {
  const session = await requireAngelcare360OperatorPermission('operator.clients.update')
  const id = asString(input.id)
  if (!id) return { ok: false, error: 'L’élément à modifier est requis.' }
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from(TABLES[entity]).select('*').eq('id', id).maybeSingle()
  const payload = normalize(entity, input)
  const { data, error } = await supabase.from(TABLES[entity]).update(payload).eq('id', id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({ module: 'growth', action: `${entity}.updated`, entityType: TABLES[entity], entityId: id, clientId: entityClientId(data as Record<string, unknown>), severity: 'notice', beforeData: toRecord(before), afterData: payload, metadata: { operator_role: session.operatorRole, reason: input.reason || null } })
  if (entity === 'case') await createCaseEvent(id, 'updated', asString(input.reason) || 'Le cas client a été mis à jour.', session.user.id)
  if (entity === 'offer') await snapshotOfferVersion(data as Record<string, unknown>, session.user.id, asString(input.change_summary) || 'Révision de l’offre')
  return { ok: true, record: data }
}

async function transitionGrowthEntity(entity: GrowthEntity, input: Record<string, unknown>) {
  const session = await requireAngelcare360OperatorPermission('operator.clients.update')
  const id = asString(input.id)
  const status = asString(input.status)
  if (!id || !status) return { ok: false, error: 'L’élément et son nouveau statut sont requis.' }
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from(TABLES[entity]).select('*').eq('id', id).maybeSingle()
  const payload: Record<string, unknown> = entity === 'opportunity' ? { stage: status, status: status === 'won' || status === 'lost' ? status : 'active', updated_at: new Date().toISOString() } : { status, updated_at: new Date().toISOString() }
  if (entity === 'opportunity' && status === 'won') payload.won_at = new Date().toISOString()
  if (entity === 'opportunity' && status === 'lost') payload.lost_at = new Date().toISOString()
  if (entity === 'offer' && status === 'submitted') payload.submitted_at = new Date().toISOString()
  if (entity === 'offer' && status === 'accepted') payload.accepted_at = new Date().toISOString()
  if (entity === 'offer' && status === 'rejected') payload.rejected_at = new Date().toISOString()
  if (entity === 'case' && status === 'escalated') payload.escalated_at = new Date().toISOString()
  if (entity === 'case' && status === 'reopened') payload.reopened_count = asNumber((before as Record<string, unknown> | null)?.reopened_count, 0) + 1
  if (entity === 'approval' && ['approved','rejected'].includes(status)) payload.decided_at = new Date().toISOString()
  if (entity === 'forecast' && status === 'locked') payload.locked_at = new Date().toISOString()
  if (entity === 'escalation' && ['resolved','closed'].includes(status)) payload.resolved_at = new Date().toISOString()
  const { data, error } = await supabase.from(TABLES[entity]).update(payload).eq('id', id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({ module: 'growth', action: `${entity}.status_changed`, entityType: TABLES[entity], entityId: id, clientId: entityClientId(data as Record<string, unknown>), severity: status === 'escalated' ? 'warning' : 'notice', beforeData: toRecord(before), afterData: payload, metadata: { operator_role: session.operatorRole, reason: input.reason || null } })
  if (entity === 'case') await createCaseEvent(id, 'status_changed', `Statut changé vers ${status}. ${asString(input.reason)}`.trim(), session.user.id)
  return { ok: true, record: data }
}

async function archiveGrowthEntity(entity: GrowthEntity, input: Record<string, unknown>) {
  const session = await requireAngelcare360OperatorPermission('operator.clients.archive')
  const id = asString(input.id)
  if (!id) return { ok: false, error: 'L’élément à archiver est requis.' }
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from(TABLES[entity]).select('*').eq('id', id).maybeSingle()
  const payload = { status: 'archived', archived_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  const { data, error } = await supabase.from(TABLES[entity]).update(payload).eq('id', id).select('*').single()
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({ module: 'growth', action: `${entity}.archived`, entityType: TABLES[entity], entityId: id, clientId: entityClientId(data as Record<string, unknown>), severity: 'warning', beforeData: toRecord(before), afterData: payload, metadata: { operator_role: session.operatorRole, reason: input.reason || null } })
  return { ok: true, record: data }
}

async function deleteGrowthEntity(entity: GrowthEntity, input: Record<string, unknown>) {
  const session = await requireAngelcare360OperatorPermission('operator.settings.manage')
  const id = asString(input.id)
  if (!id) return { ok: false, error: 'L’élément à supprimer est requis.' }
  const supabase = await getOperatorClient()
  const { data: before } = await supabase.from(TABLES[entity]).select('*').eq('id', id).maybeSingle()
  const { error } = await supabase.from(TABLES[entity]).delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({ module: 'growth', action: `${entity}.deleted`, entityType: TABLES[entity], entityId: id, clientId: entityClientId(before as Record<string, unknown> | null), severity: 'critical', beforeData: toRecord(before), metadata: { operator_role: session.operatorRole, reason: input.reason || null } })
  return { ok: true, deletedId: id }
}

async function applyContractualSupportEntitlement(payload: Record<string, unknown>) {
  const clientId = asString(payload.client_id)
  if (!clientId) return
  const supabase = await getOperatorClient()
  let query = supabase.from(TABLES.support_entitlement).select('*').eq('client_id', clientId).eq('status', 'active')
  const subscriptionId = asString(payload.subscription_id)
  if (subscriptionId) query = query.or(`subscription_id.eq.${subscriptionId},subscription_id.is.null`)
  const { data } = await query.order('effective_from', { ascending: false, nullsFirst: false }).limit(1).maybeSingle()
  if (!data) return
  const entitlement = data as Record<string, unknown>
  if (!payload.sla_policy) payload.sla_policy = `contract:${asString(entitlement.support_tier) || 'standard'}`
  if (!payload.team) payload.team = asString(entitlement.escalation_level) === 'critical' ? 'Executive Service Command' : 'Customer Service'
  if (!payload.due_at) {
    const minutes = Math.max(15, asNumber(entitlement.resolution_target_minutes, 1440))
    payload.due_at = new Date(Date.now() + minutes * 60_000).toISOString()
  }
}

async function createCaseEvent(caseId: string, eventType: string, summary: string, actorId?: string | null) {
  const supabase = await getOperatorClient()
  await supabase.from(TABLES.case_event).insert({ case_id: caseId, event_type: eventType, summary, visibility: 'internal', actor_id: actorId || null, occurred_at: new Date().toISOString(), metadata: {} })
}

async function snapshotOfferVersion(offer: Record<string, unknown>, actorId: string, changeSummary: string) {
  const supabase = await getOperatorClient()
  const { count } = await supabase.from(TABLES.offer_version).select('id', { count: 'exact', head: true }).eq('offer_id', asString(offer.id))
  await supabase.from(TABLES.offer_version).insert({
    offer_id: offer.id,
    version_number: (count || 0) + 1,
    status: offer.status || 'draft',
    configuration_snapshot: toRecord(offer.configuration_snapshot),
    pricing_snapshot: {
      monthly_price_mad: asNumber(offer.monthly_price_mad, 0), annual_price_mad: asNumber(offer.annual_price_mad, 0),
      setup_fee_mad: asNumber(offer.setup_fee_mad, 0), discount_mad: asNumber(offer.discount_mad, 0), contract_value_mad: asNumber(offer.contract_value_mad, 0),
    },
    value_case_snapshot: toRecord(offer.value_case), change_summary: changeSummary, created_by: actorId,
  })
}

async function convertProspect(input: Record<string, unknown>) {
  const id = asString(input.id)
  if (!id) return { ok: false, error: 'Le prospect à convertir est requis.' }
  const supabase = await getOperatorClient()
  const { data: prospect, error } = await supabase.from(TABLES.prospect).select('*').eq('id', id).maybeSingle()
  if (error || !prospect) return { ok: false, error: error?.message || 'Prospect introuvable.' }
  const row = prospect as Record<string, unknown>
  const result = await createOperatorClient({
    clientCode: asString(input.clientCode) || `CL-${Date.now().toString().slice(-8)}`,
    displayName: asString(row.organization_name), legalName: asString(input.legalName) || asString(row.organization_name),
    clientType: asString(row.organization_type) || 'school', city: asString(row.city) || null, country: asString(row.country) || 'Maroc',
    address: asString(input.address) || null, primaryContactName: asString(input.primaryContactName) || null,
    primaryContactEmail: asString(input.primaryContactEmail) || null, primaryContactPhone: asString(input.primaryContactPhone) || null,
    status: 'active', lifecycleStage: 'qualified', source: asString(row.source) || 'growth_workspace', healthStatus: 'new', riskLevel: 'low', notes: asString(row.notes) || null,
  })
  if (!result.ok || !result.record) return result
  await supabase.from(TABLES.prospect).update({ converted_client_id: result.record.id, status: 'converted', updated_at: new Date().toISOString() }).eq('id', id)
  return { ok: true, client: result.record }
}

async function convertOfferToContract(input: Record<string, unknown>) {
  const offerId = asString(input.id)
  const clientId = asString(input.clientId)
  if (!offerId || !clientId) return { ok: false, error: 'L’offre et le client sont requis.' }
  const supabase = await getOperatorClient()
  const { data: offer, error } = await supabase.from(TABLES.offer).select('*').eq('id', offerId).maybeSingle()
  if (error || !offer) return { ok: false, error: error?.message || 'Offre introuvable.' }
  const row = offer as Record<string, unknown>
  const result = await createOperatorContract({
    clientId, subscriptionId: asString(input.subscriptionId) || null, contractCode: asString(input.contractCode) || `CTR-${Date.now().toString().slice(-8)}`,
    status: 'draft', startDate: asString(input.startDate) || new Date().toISOString().slice(0, 10), endDate: asString(input.endDate) || null,
    renewalDate: asString(input.renewalDate) || null, signedAt: null, documentUrl: null,
    notes: `Créé depuis l’offre ${asString(row.offer_code)} · ${asString(row.name)} · Snapshot commercial préservé.`,
  })
  if (!result.ok || !result.record) return result
  await supabase.from(TABLES.offer).update({ converted_contract_id: result.record.id, status: 'converted', updated_at: new Date().toISOString() }).eq('id', offerId)
  return { ok: true, contract: result.record }
}

async function activateContract(input: Record<string, unknown>) {
  const contractId = asString(input.contractId)
  const clientId = asString(input.clientId)
  const planId = asString(input.planId)
  if (!contractId || !clientId || !planId) return { ok: false, error: 'Contrat, client et plan sont requis pour activer l’abonnement.' }
  const result = await createOperatorSubscription({
    clientId, tenantId: asString(input.tenantId) || null, planId,
    subscriptionCode: asString(input.subscriptionCode) || `SUB-${Date.now().toString().slice(-8)}`,
    status: asString(input.status) || 'active', startDate: asString(input.startDate) || new Date().toISOString().slice(0, 10),
    trialEndsAt: asString(input.trialEndsAt) || null, currentPeriodStart: asString(input.currentPeriodStart) || null,
    currentPeriodEnd: asString(input.currentPeriodEnd) || null, billingCycle: asString(input.billingCycle) || 'monthly',
    billingAmountMad: asNumber(input.billingAmountMad, 0), discountAmountMad: asNumber(input.discountAmountMad, 0),
    cancellationReason: null, suspendedReason: null,
  })
  if (!result.ok || !result.record) return result
  const supabase = await getOperatorClient()
  const packageVersionId = asString(input.packageVersionId) || null
  if (packageVersionId) {
    const { error: packageError } = await supabase
      .from('angelcare360_operator_subscriptions')
      .update({ package_version_id: packageVersionId, updated_at: new Date().toISOString() })
      .eq('id', result.record.id)
    if (packageError) return { ok: false, error: packageError.message }
  }
  await supabase.from('angelcare360_operator_contracts').update({ subscription_id: result.record.id, status: 'active', updated_at: new Date().toISOString() }).eq('id', contractId)
  const tenantId = asString(input.tenantId)
  const compilation = packageVersionId && tenantId
    ? await compileTenantEntitlements({ clientId, tenantId, subscriptionId: result.record.id, packageVersionId })
    : null
  return { ok: true, subscription: { ...result.record, package_version_id: packageVersionId }, compilation }
}

async function mergeProspects(input: Record<string, unknown>) {
  const session = await requireAngelcare360OperatorPermission('operator.settings.manage')
  const sourceId = asString(input.sourceId)
  const targetId = asString(input.targetId)
  if (!sourceId || !targetId || sourceId === targetId) return { ok: false, error: 'Deux prospects distincts sont requis.' }
  const supabase = await getOperatorClient()
  const related = [TABLES.contact, TABLES.institution, TABLES.opportunity, TABLES.offer, TABLES.interaction]
  for (const table of related) {
    const { error } = await supabase.from(table).update({ prospect_id: targetId, updated_at: new Date().toISOString() }).eq('prospect_id', sourceId)
    if (error) return { ok: false, error: error.message }
  }
  const { data: source } = await supabase.from(TABLES.prospect).select('*').eq('id', sourceId).maybeSingle()
  const { error } = await supabase.from(TABLES.prospect).update({ status: 'archived', archived_at: new Date().toISOString(), notes: `Fusionné dans ${targetId}. ${asString(input.reason)}`.trim(), updated_at: new Date().toISOString() }).eq('id', sourceId)
  if (error) return { ok: false, error: error.message }
  await writeOperatorAuditLog({ module: 'growth', action: 'prospect.merged', entityType: TABLES.prospect, entityId: sourceId, severity: 'warning', beforeData: toRecord(source), afterData: { target_id: targetId }, metadata: { operator_role: session.operatorRole, reason: input.reason || null } })
  return { ok: true, sourceId, targetId }
}

function clientPayload(input: Record<string, unknown>) {
  return {
    id: asString(input.id), clientCode: asString(input.client_code) || `CL-${Date.now().toString().slice(-8)}`,
    displayName: asString(input.display_name), legalName: asString(input.legal_name) || null, clientType: asString(input.client_type) || 'school',
    city: asString(input.city) || null, country: asString(input.country) || 'Maroc', address: asString(input.address) || null,
    primaryContactName: asString(input.primary_contact_name) || null, primaryContactEmail: asString(input.primary_contact_email) || null,
    primaryContactPhone: asString(input.primary_contact_phone) || null, status: asString(input.status) || 'active',
    lifecycleStage: asString(input.lifecycle_stage) || 'operational', source: asString(input.source) || 'growth_workspace',
    healthStatus: asString(input.health_status) || 'new', riskLevel: asString(input.risk_level) || 'low', notes: asString(input.notes) || null,
  }
}

async function executeClientOperation(verb: string, input: Record<string, unknown>) {
  if (verb === 'create') return createOperatorClient(clientPayload(input))
  if (verb === 'update') return updateOperatorClient(clientPayload(input))
  if (verb === 'archive') return archiveOperatorClient({ id: asString(input.id), reason: asString(input.reason) || 'Archivage depuis Revenue Relationship OS' })
  if (verb === 'delete') {
    const strategy = asString(input.removal_strategy) || 'archive'
    if (strategy === 'archive') return archiveOperatorClient({ id: asString(input.id), reason: asString(input.reason) || 'Archivage depuis Revenue Relationship OS' })
    const session = await requireAngelcare360OperatorPermission('operator.settings.manage')
    const id = asString(input.id)
    if (!id) return { ok: false, error: 'Le client à supprimer est requis.' }
    const supabase = await getOperatorClient()
    const relatedTables = ['angelcare360_operator_tenants','angelcare360_operator_subscriptions','angelcare360_operator_contracts','angelcare360_operator_invoices','angelcare360_operator_payments','angelcare360_operator_support_tickets','angelcare360_operator_renewals','angelcare360_operator_customer_cases']
    for (const table of relatedTables) {
      const { count, error } = await supabase.from(table).select('id', { count: 'exact', head: true }).eq('client_id', id)
      if (error) return { ok: false, error: error.message }
      if ((count || 0) > 0) return { ok: false, error: 'Suppression bloquée: ce client possède des relations actives. Archivez-le ou migrez les objets associés.' }
    }
    const { data: before } = await supabase.from('angelcare360_operator_clients').select('*').eq('id', id).maybeSingle()
    const { error } = await supabase.from('angelcare360_operator_clients').delete().eq('id', id)
    if (error) return { ok: false, error: error.message }
    await writeOperatorAuditLog({ module: 'growth', action: 'client.deleted', entityType: 'angelcare360_operator_clients', entityId: id, clientId: id, severity: 'critical', beforeData: toRecord(before), metadata: { operator_role: session.operatorRole, reason: input.reason || null } })
    return { ok: true, deletedId: id }
  }
  return { ok: false, error: 'Opération client inconnue.' }
}

export async function executeGrowthOperation(operation: string, input: Record<string, unknown>) {
  const [entityName, verb] = operation.split('.')
  if (entityName === 'client') return executeClientOperation(verb, input)
  if (entityName === 'prospect' && verb === 'convert') return convertProspect(input)
  if (entityName === 'prospect' && verb === 'merge') return mergeProspects(input)
  if (entityName === 'institution' && verb === 'provision_school') return provisionGrowthInstitutionSanilaSchool(input)
  if (entityName === 'offer' && verb === 'convert_contract') return convertOfferToContract(input)
  if (entityName === 'contract' && verb === 'activate') return activateContract(input)
  if (!(entityName in TABLES)) return { ok: false, error: 'Commande commerciale inconnue.' }
  const entity = entityName as GrowthEntity
  if (verb === 'create') return createGrowthEntity(entity, input)
  if (verb === 'update') return updateGrowthEntity(entity, input)
  if (verb === 'transition') return transitionGrowthEntity(entity, input)
  if (verb === 'archive') return archiveGrowthEntity(entity, input)
  if (verb === 'delete') return deleteGrowthEntity(entity, input)
  return { ok: false, error: 'Opération commerciale inconnue.' }
}

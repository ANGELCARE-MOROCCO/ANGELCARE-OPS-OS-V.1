import { cleanText } from '../b2b-intelligence/normalize'
import { assertTerritory, filterByOwnership } from '../b2b-intelligence/scope'
import { B2B_PARTNER_COMMAND_MAP } from './contract'

function now() { return new Date().toISOString() }
function fail(message: string, status = 400, details?: unknown) { return Object.assign(new Error(message), { status, details }) }
function dbFail(prefix: string, error: any): never { console.error(`[${prefix}]`, error); throw fail(prefix, 500, { message: error?.message, code: error?.code }) }
function text(value: unknown, max = 8000) { return cleanText(value, max) || null }
function num(value: unknown, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback }
function bool(value: unknown) { return value === true || value === 'true' || value === 1 || value === '1' }
function list(value: unknown) { return Array.isArray(value) ? value : [] }
function scopeRecord(access: any) { return Object.fromEntries((access?.scopes || []).map((row: any) => [row.scope_key, row.scope_value])) as Record<string, unknown> }
function actorCanApprove(actor: any, access: any, permission: string) {
  const level = String((access?.capabilities || []).find((row: any) => row.capability_key === permission)?.access_level || '').toUpperCase()
  const role = String(actor?.role || actor?.role_key || '').toLowerCase().replaceAll('-', '_').replaceAll(' ', '_')
  return ['APPROVE', 'ADMINISTER'].includes(level) || ['manager', 'sales_manager', 'operations_manager', 'managing_director', 'admin', 'super_admin', 'owner', 'founder', 'ceo'].includes(role)
}
async function selectOne(db: any, table: string, configure: (query: any) => any, code: string) {
  const { data, error } = await configure(db.from(table).select('*'))
  if (error) dbFail(code, error)
  return data || null
}
async function selectMany(db: any, table: string, configure: (query: any) => any, code: string) {
  const { data, error } = await configure(db.from(table).select('*'))
  if (error) dbFail(code, error)
  return data || []
}
async function insertOne(db: any, table: string, row: any, code: string) {
  const { data, error } = await db.from(table).insert(row).select('*').single()
  if (error) dbFail(code, error)
  return data
}
async function updateOne(db: any, table: string, id: string, row: any, code: string) {
  const { data, error } = await db.from(table).update({ ...row, updated_at: now() }).eq('id', id).select('*').single()
  if (error) dbFail(code, error)
  return data
}
async function timeline(db: any, actor: any, input: { prospectId?: string | null; opportunityId?: string | null; type: string; title: string; description?: string | null; metadata?: any }) {
  await db.from('browser_extension_b2b_timeline_events').insert({ prospect_id: input.prospectId || null, opportunity_id: input.opportunityId || null, user_id: actor.id, event_type: input.type, title: input.title, description: input.description || null, metadata: input.metadata || {}, occurred_at: now() })
}
async function loadOpportunity(db: any, actor: any, access: any, opportunityId: string) {
  const opportunity = await selectOne(db, 'browser_extension_b2b_opportunities', (q) => q.eq('id', opportunityId).maybeSingle(), 'PARTNER_OPPORTUNITY_LOAD_FAILED')
  if (!opportunity) throw fail('OPPORTUNITY_NOT_FOUND', 404)
  const prospect = await selectOne(db, 'b2b_prospects', (q) => q.eq('id', opportunity.prospect_id).maybeSingle(), 'PARTNER_PROSPECT_LOAD_FAILED')
  if (!prospect) throw fail('PROSPECT_NOT_FOUND', 404)
  assertTerritory(scopeRecord(access), prospect.city)
  if (!filterByOwnership([prospect], actor.id, scopeRecord(access)).length) throw fail('ACCOUNT_SCOPE_DENIED', 403)
  return { opportunity, prospect }
}
async function loadPartner(db: any, actor: any, access: any, payload: any) {
  const partnerId = text(payload.partnerId, 100)
  const prospectId = text(payload.prospectId, 100)
  let query = db.from('browser_extension_b2b_partners').select('*')
  query = partnerId ? query.eq('id', partnerId) : prospectId ? query.eq('prospect_id', prospectId) : query.eq('id', '00000000-0000-0000-0000-000000000000')
  const { data: partner, error } = await query.maybeSingle()
  if (error) dbFail('PARTNER_LOAD_FAILED', error)
  if (!partner) throw fail('PARTNER_NOT_FOUND', 404)
  const prospect = await selectOne(db, 'b2b_prospects', (q) => q.eq('id', partner.prospect_id).maybeSingle(), 'PARTNER_ACCOUNT_LOAD_FAILED')
  if (!prospect) throw fail('PARTNER_ACCOUNT_NOT_FOUND', 404)
  assertTerritory(scopeRecord(access), prospect.city)
  if (!filterByOwnership([prospect], actor.id, scopeRecord(access)).length) throw fail('PARTNER_SCOPE_DENIED', 403)
  return { partner, prospect }
}
async function loadHandoff(db: any, actor: any, access: any, payload: any) {
  let handoff = null
  if (payload.handoffId) handoff = await selectOne(db, 'browser_extension_b2b_handoffs', (q) => q.eq('id', payload.handoffId).maybeSingle(), 'HANDOFF_LOAD_FAILED')
  else if (payload.opportunityId) handoff = await selectOne(db, 'browser_extension_b2b_handoffs', (q) => q.eq('opportunity_id', payload.opportunityId).maybeSingle(), 'HANDOFF_LOAD_FAILED')
  if (!handoff) throw fail('HANDOFF_NOT_FOUND', 404)
  const source = await loadOpportunity(db, actor, access, handoff.opportunity_id)
  return { handoff, ...source }
}
async function latestForOpportunity(db: any, table: string, opportunityId: string, order = 'created_at') {
  return selectOne(db, table, (q) => q.eq('opportunity_id', opportunityId).order(order, { ascending: false }).limit(1).maybeSingle(), `${table.toUpperCase()}_LOAD_FAILED`)
}
async function latestForPartner(db: any, table: string, partnerId: string, order = 'created_at') {
  return selectOne(db, table, (q) => q.eq('partner_id', partnerId).order(order, { ascending: false }).limit(1).maybeSingle(), `${table.toUpperCase()}_LOAD_FAILED`)
}

async function generateHandoff(db: any, actor: any, access: any, payload: any) {
  if (!payload.opportunityId) throw fail('OPPORTUNITY_ID_REQUIRED')
  const { opportunity, prospect } = await loadOpportunity(db, actor, access, String(payload.opportunityId))
  const [proposal, pricing, offer, closingGate, paymentGate, contractRequirements, contacts, meetingOutcomes, negotiationEvents] = await Promise.all([
    latestForOpportunity(db, 'browser_extension_b2b_proposal_versions', opportunity.id, 'version_number'),
    latestForOpportunity(db, 'browser_extension_b2b_pricing_calculations', opportunity.id),
    latestForOpportunity(db, 'browser_extension_b2b_offer_configurations', opportunity.id),
    latestForOpportunity(db, 'browser_extension_b2b_closing_gates', opportunity.id),
    latestForOpportunity(db, 'browser_extension_b2b_payment_gates', opportunity.id),
    selectMany(db, 'browser_extension_b2b_contract_requirements', (q) => q.eq('opportunity_id', opportunity.id), 'HANDOFF_CONTRACT_LOAD_FAILED'),
    selectMany(db, 'b2b_contacts', (q) => q.eq('prospect_id', prospect.id).limit(100), 'HANDOFF_CONTACTS_LOAD_FAILED'),
    selectMany(db, 'browser_extension_b2b_meeting_outcomes', (q) => q.eq('opportunity_id', opportunity.id).order('created_at', { ascending: false }).limit(20), 'HANDOFF_MEETINGS_LOAD_FAILED'),
    selectMany(db, 'browser_extension_b2b_negotiation_events', (q) => q.eq('opportunity_id', opportunity.id).order('created_at', { ascending: false }).limit(50), 'HANDOFF_NEGOTIATION_LOAD_FAILED'),
  ])
  const blockers: string[] = []
  if (!proposal || !['approved', 'delivered', 'accepted'].includes(String(proposal.status))) blockers.push('approved_proposal_missing')
  if (!closingGate || closingGate.status !== 'passed') blockers.push('closing_gate_not_passed')
  if (!contractRequirements.length || contractRequirements.some((row: any) => row.required && row.status !== 'complete')) blockers.push('contract_requirements_incomplete')
  if (!paymentGate || paymentGate.status !== 'verified') blockers.push('payment_gate_not_verified')

  const existing = await selectOne(db, 'browser_extension_b2b_handoffs', (q) => q.eq('opportunity_id', opportunity.id).maybeSingle(), 'HANDOFF_EXISTING_LOAD_FAILED')
  const versionNumber = Number(existing?.current_version || 0) + 1
  const handoffRow = {
    prospect_id: prospect.id, opportunity_id: opportunity.id, status: blockers.length ? 'draft' : 'submitted', current_version: versionNumber,
    readiness_score: Math.max(0, 100 - blockers.length * 25), blocked: blockers.length > 0, blockers,
    sales_owner_id: opportunity.owner_id || prospect.assigned_owner_id || actor.id, operational_owner_id: payload.operationalOwnerId || null,
    requested_launch_at: payload.launchAt || offer?.launch_at || opportunity.launch_timing || null,
    submitted_by: blockers.length ? null : actor.id, submitted_at: blockers.length ? null : now(), created_by: existing?.created_by || actor.id, updated_by: actor.id,
  }
  let handoff: any
  if (existing) handoff = await updateOne(db, 'browser_extension_b2b_handoffs', existing.id, handoffRow, 'HANDOFF_UPDATE_FAILED')
  else handoff = await insertOne(db, 'browser_extension_b2b_handoffs', handoffRow, 'HANDOFF_CREATE_FAILED')

  const sourceSnapshot = { opportunity, proposal, pricing, offer, closingGate, paymentGate, contractRequirements }
  const version = await insertOne(db, 'browser_extension_b2b_handoff_versions', {
    handoff_id: handoff.id, version_number: versionNumber, source_snapshot: sourceSnapshot,
    legal_entity: payload.legalEntity || { name: prospect.name, address: prospect.address, city: prospect.city },
    scope: payload.scope || proposal?.scope || offer || {}, pricing: payload.pricing || pricing || {},
    billing: payload.billing || { frequency: offer?.billing_frequency || null }, payment_terms: payload.paymentTerms || paymentGate || {},
    sites: list(payload.sites).length ? payload.sites : list(offer?.locations), services: list(payload.services).length ? payload.services : [{ serviceLine: offer?.service_line, program: offer?.partner_program }].filter((x) => x.serviceLine),
    contacts: payload.contacts || contacts, obligations: payload.obligations || { partner: offer?.client_responsibilities || [], angelcare: offer?.angelcare_responsibilities || [] },
    exclusions: payload.exclusions || offer?.exclusions || [], reporting_requirements: payload.reportingRequirements || proposal?.kpis || [],
    service_levels: payload.serviceLevels || [], launch_requirements: payload.launchRequirements || { staffing: offer?.staffing_requirements || {}, materials: offer?.materials_requirements || {} },
    risks: payload.risks || proposal?.risk_controls || [], documents: payload.documents || [], change_summary: text(payload.changeSummary) || `Handoff version ${versionNumber}`,
    created_by: actor.id,
  }, 'HANDOFF_VERSION_CREATE_FAILED')

  const commitments: any[] = []
  for (const row of list(payload.commitments)) commitments.push(row)
  for (const outcome of meetingOutcomes) for (const statement of list(outcome.commitments)) commitments.push({ statement, sourceType: 'meeting', sourceReference: outcome.id, classification: 'commercial_commitment', impact: 'medium' })
  for (const event of negotiationEvents) if (event.requested_change) commitments.push({ statement: event.requested_change, sourceType: 'negotiation', sourceReference: event.id, classification: event.approval_required ? 'unapproved_promise' : 'commercial_commitment', impact: event.approval_required ? 'high' : 'medium' })
  const validCommitments = commitments.filter((row) => text(row.statement))
  if (validCommitments.length) {
    const rows = validCommitments.map((row) => ({
      handoff_id: handoff.id, handoff_version_id: version.id, source_type: text(row.sourceType, 80) || 'manual', source_reference: text(row.sourceReference, 200),
      statement: text(row.statement)!, classification: row.classification || 'commercial_commitment', impact: row.impact || 'medium', resolved: bool(row.resolved),
      resolution: text(row.resolution), owner_id: row.ownerId || actor.id, due_at: row.dueAt || null, evidence: row.evidence || {}, created_by: actor.id,
    }))
    const { error } = await db.from('browser_extension_b2b_handoff_commitments').insert(rows)
    if (error) dbFail('HANDOFF_COMMITMENTS_CREATE_FAILED', error)
  }
  const unresolvedHigh = validCommitments.filter((row) => row.classification === 'unapproved_promise' && row.impact === 'high' && !bool(row.resolved))
  if (unresolvedHigh.length) handoff = await updateOne(db, 'browser_extension_b2b_handoffs', handoff.id, { status: 'draft', blocked: true, blockers: [...new Set([...blockers, 'unresolved_high_impact_promises'])] }, 'HANDOFF_PROMISE_BLOCK_FAILED')
  await timeline(db, actor, { prospectId: prospect.id, opportunityId: opportunity.id, type: 'partner_handoff_generated', title: 'Handoff commercial-opérationnel généré', description: `Version ${versionNumber}`, metadata: { handoffId: handoff.id, blockers: handoff.blockers } })
  return { handoff, version, commitments: validCommitments, blockers: handoff.blockers, sourceSnapshot }
}

function handoffReadiness(version: any, commitments: any[]) {
  const checks = {
    legalEntity: Boolean(version?.legal_entity && Object.keys(version.legal_entity).length),
    scope: Boolean(version?.scope && Object.keys(version.scope).length),
    pricing: Boolean(version?.pricing && Object.keys(version.pricing).length),
    paymentTerms: Boolean(version?.payment_terms && Object.keys(version.payment_terms).length),
    sites: Array.isArray(version?.sites) && version.sites.length > 0,
    contacts: Array.isArray(version?.contacts) && version.contacts.length > 0,
    obligations: Boolean(version?.obligations && Object.keys(version.obligations).length),
    launchRequirements: Boolean(version?.launch_requirements && Object.keys(version.launch_requirements).length),
    promisesResolved: !commitments.some((row) => row.classification === 'unapproved_promise' && row.impact === 'high' && !row.resolved),
  }
  const entries = Object.entries(checks)
  const score = Math.round((entries.filter(([, value]) => value).length / entries.length) * 100)
  return { checks, score, missing: entries.filter(([, value]) => !value).map(([key]) => key) }
}

async function validateHandoff(db: any, actor: any, access: any, payload: any) {
  const { handoff, opportunity, prospect } = await loadHandoff(db, actor, access, payload)
  const version = await selectOne(db, 'browser_extension_b2b_handoff_versions', (q) => q.eq('handoff_id', handoff.id).order('version_number', { ascending: false }).limit(1).maybeSingle(), 'HANDOFF_VERSION_LOAD_FAILED')
  const commitments = await selectMany(db, 'browser_extension_b2b_handoff_commitments', (q) => q.eq('handoff_id', handoff.id), 'HANDOFF_COMMITMENT_LOAD_FAILED')
  const readiness = handoffReadiness(version, commitments)
  const decision = payload.decision || (readiness.missing.length ? 'request_correction' : 'ready_for_acceptance')
  const validation = await insertOne(db, 'browser_extension_b2b_handoff_validations', { handoff_id: handoff.id, handoff_version_id: version?.id || null, decision, readiness: readiness.checks, missing: readiness.missing, conditions: payload.conditions || [], notes: text(payload.notes), evidence: payload.evidence || {}, decided_by: actor.id }, 'HANDOFF_VALIDATION_FAILED')
  const status = decision === 'reject' ? 'rejected' : readiness.missing.length ? 'correction_requested' : 'under_review'
  const updated = await updateOne(db, 'browser_extension_b2b_handoffs', handoff.id, { status, readiness_score: readiness.score, blocked: readiness.missing.length > 0, blockers: readiness.missing, conditions: payload.conditions || [], updated_by: actor.id }, 'HANDOFF_VALIDATION_UPDATE_FAILED')
  await timeline(db, actor, { prospectId: prospect.id, opportunityId: opportunity.id, type: 'partner_handoff_validated', title: 'Handoff validé par les opérations', description: decision, metadata: { readiness } })
  return { handoff: updated, validation, readiness, version, commitments }
}

async function acceptHandoff(db: any, actor: any, access: any, payload: any) {
  if (!actorCanApprove(actor, access, 'extension.b2b.operational_handoff')) throw fail('HANDOFF_APPROVAL_ACCESS_REQUIRED', 403)
  const validated = await validateHandoff(db, actor, access, { ...payload, decision: payload.conditions?.length ? 'accept_with_conditions' : 'accept' })
  if (validated.readiness.missing.length) throw fail('HANDOFF_NOT_READY', 409, validated.readiness)
  const status = list(payload.conditions).length ? 'accepted_with_conditions' : 'accepted'
  const handoff = await updateOne(db, 'browser_extension_b2b_handoffs', validated.handoff.id, { status, blocked: false, blockers: [], conditions: payload.conditions || [], accepted_by: actor.id, accepted_at: now(), updated_by: actor.id }, 'HANDOFF_ACCEPT_FAILED')
  return { ...validated, handoff }
}

async function requestHandoffCorrection(db: any, actor: any, access: any, payload: any) {
  const { handoff, prospect, opportunity } = await loadHandoff(db, actor, access, payload)
  const reasons = list(payload.reasons).length ? payload.reasons : [text(payload.reason) || 'Correction opérationnelle requise']
  const validation = await insertOne(db, 'browser_extension_b2b_handoff_validations', { handoff_id: handoff.id, decision: 'request_correction', readiness: {}, missing: reasons, conditions: [], notes: text(payload.notes), evidence: payload.evidence || {}, decided_by: actor.id }, 'HANDOFF_CORRECTION_CREATE_FAILED')
  const updated = await updateOne(db, 'browser_extension_b2b_handoffs', handoff.id, { status: 'correction_requested', blocked: true, blockers: reasons, updated_by: actor.id }, 'HANDOFF_CORRECTION_UPDATE_FAILED')
  await timeline(db, actor, { prospectId: prospect.id, opportunityId: opportunity.id, type: 'partner_handoff_correction_requested', title: 'Correction du handoff requise', description: reasons.join(' · ') })
  return { handoff: updated, validation }
}

async function activatePartner(db: any, actor: any, access: any, payload: any) {
  if (!actorCanApprove(actor, access, 'extension.b2b.partner_activation')) throw fail('PARTNER_ACTIVATION_APPROVAL_REQUIRED', 403)
  const { handoff, prospect, opportunity } = await loadHandoff(db, actor, access, payload)
  if (!['accepted', 'accepted_with_conditions'].includes(handoff.status)) throw fail('HANDOFF_ACCEPTANCE_REQUIRED', 409, { status: handoff.status })
  const existing = await selectOne(db, 'browser_extension_b2b_partners', (q) => q.eq('prospect_id', prospect.id).maybeSingle(), 'PARTNER_EXISTING_LOAD_FAILED')
  const row = { prospect_id: prospect.id, source_opportunity_id: opportunity.id, legal_name: text(payload.legalName, 500) || prospect.name, commercial_name: text(payload.commercialName, 500) || prospect.name, status: 'onboarding', vertical: prospect.sector || prospect.vertical || null, city: prospect.city || null, territory: prospect.city || null, contract_reference: text(payload.contractReference, 300), contract_id: payload.contractId || null, contract_start_at: payload.contractStartAt || now(), contract_end_at: payload.contractEndAt || null, billing_status: payload.billingStatus || 'configured', payment_status: payload.paymentStatus || 'verified', sales_owner_id: handoff.sales_owner_id || prospect.assigned_owner_id || actor.id, operational_owner_id: payload.operationalOwnerId || handoff.operational_owner_id || actor.id, activation_status: 'not_started', metadata: payload.metadata || {}, created_by: existing?.created_by || actor.id, updated_by: actor.id }
  const partner = existing ? await updateOne(db, 'browser_extension_b2b_partners', existing.id, row, 'PARTNER_UPDATE_FAILED') : await insertOne(db, 'browser_extension_b2b_partners', row, 'PARTNER_CREATE_FAILED')
  await updateOne(db, 'browser_extension_b2b_handoffs', handoff.id, { partner_id: partner.id, updated_by: actor.id }, 'HANDOFF_PARTNER_LINK_FAILED')
  await db.from('b2b_prospects').update({ status: 'Partner', updated_by: actor.id, updated_at: now() }).eq('id', prospect.id)
  await timeline(db, actor, { prospectId: prospect.id, opportunityId: opportunity.id, type: 'partner_activated', title: 'Dossier partenaire activé', metadata: { partnerId: partner.id } })
  return { partner, handoff: { ...handoff, partner_id: partner.id }, prospect: { ...prospect, status: 'Partner' }, opportunity }
}

async function createOnboarding(db: any, actor: any, access: any, payload: any) {
  const { partner, prospect } = await loadPartner(db, actor, access, payload)
  let plan = await selectOne(db, 'browser_extension_b2b_onboarding_plans', (q) => q.eq('partner_id', partner.id).order('created_at', { ascending: false }).limit(1).maybeSingle(), 'ONBOARDING_LOAD_FAILED')
  if (!plan) plan = await insertOne(db, 'browser_extension_b2b_onboarding_plans', { partner_id: partner.id, handoff_id: payload.handoffId || null, status: 'in_progress', stage: 'information_collection', owner_id: payload.ownerId || partner.operational_owner_id || actor.id, target_launch_at: payload.targetLaunchAt || null, information_collection: payload.informationCollection || {}, operational_configuration: payload.operationalConfiguration || {}, training_briefing: payload.trainingBriefing || {}, partner_materials: payload.partnerMaterials || {}, technical_configuration: payload.technicalConfiguration || {}, created_by: actor.id, updated_by: actor.id }, 'ONBOARDING_CREATE_FAILED')
  const existingTasks = await selectMany(db, 'browser_extension_b2b_onboarding_tasks', (q) => q.eq('onboarding_plan_id', plan.id), 'ONBOARDING_TASKS_LOAD_FAILED')
  if (!existingTasks.length) {
    const defaults = list(payload.tasks).length ? payload.tasks : [
      ['information', 'Collecte des informations partenaire'], ['scope', 'Validation de la portée contractuelle'], ['contacts', 'Validation des contacts opérationnels et financiers'],
      ['sites', 'Configuration des sites'], ['services', 'Configuration des services'], ['staffing', 'Planification des ressources'], ['training', 'Briefing et formation'],
      ['materials', 'Préparation des matériels'], ['transport', 'Validation transport et accès'], ['billing', 'Configuration facturation'], ['communication', 'Assets et communication partenaire'], ['readiness', 'Revue de préparation au lancement'],
    ].map(([category, title]) => ({ category, title }))
    const rows = defaults.map((task: any, index: number) => ({ onboarding_plan_id: plan.id, partner_id: partner.id, category: task.category || 'general', title: task.title || `Tâche ${index + 1}`, description: text(task.description), required: task.required !== false, owner_id: task.ownerId || plan.owner_id, due_at: task.dueAt || null, status: 'open', created_by: actor.id }))
    const { error } = await db.from('browser_extension_b2b_onboarding_tasks').insert(rows)
    if (error) dbFail('ONBOARDING_TASKS_CREATE_FAILED', error)
  }
  await updateOne(db, 'browser_extension_b2b_partners', partner.id, { status: 'onboarding', activation_status: 'onboarding', updated_by: actor.id }, 'PARTNER_ONBOARDING_STATUS_FAILED')
  const tasks = await selectMany(db, 'browser_extension_b2b_onboarding_tasks', (q) => q.eq('onboarding_plan_id', plan.id).order('created_at'), 'ONBOARDING_TASKS_RELOAD_FAILED')
  await timeline(db, actor, { prospectId: prospect.id, opportunityId: partner.source_opportunity_id, type: 'partner_onboarding_created', title: 'Onboarding partenaire créé', metadata: { partnerId: partner.id, planId: plan.id } })
  return { partner: { ...partner, status: 'onboarding', activation_status: 'onboarding' }, onboarding: plan, tasks }
}

async function completeOnboardingTask(db: any, actor: any, access: any, payload: any) {
  if (!payload.taskId) throw fail('ONBOARDING_TASK_ID_REQUIRED')
  const task = await selectOne(db, 'browser_extension_b2b_onboarding_tasks', (q) => q.eq('id', payload.taskId).maybeSingle(), 'ONBOARDING_TASK_LOAD_FAILED')
  if (!task) throw fail('ONBOARDING_TASK_NOT_FOUND', 404)
  await loadPartner(db, actor, access, { partnerId: task.partner_id })
  const updatedTask = await updateOne(db, 'browser_extension_b2b_onboarding_tasks', task.id, { status: payload.status || 'completed', blocker_reason: text(payload.blockerReason), evidence: payload.evidence || task.evidence || {}, completed_by: actor.id, completed_at: now() }, 'ONBOARDING_TASK_COMPLETE_FAILED')
  const tasks = await selectMany(db, 'browser_extension_b2b_onboarding_tasks', (q) => q.eq('onboarding_plan_id', task.onboarding_plan_id), 'ONBOARDING_TASK_PROGRESS_FAILED')
  const completed = tasks.filter((row: any) => row.status === 'completed').length
  const percent = tasks.length ? Math.round((completed / tasks.length) * 100) : 0
  const plan = await updateOne(db, 'browser_extension_b2b_onboarding_plans', task.onboarding_plan_id, { completion_percent: percent, stage: percent === 100 ? 'readiness_review' : 'operational_configuration', status: percent === 100 ? 'completed' : 'in_progress', completed_at: percent === 100 ? now() : null, updated_by: actor.id }, 'ONBOARDING_PROGRESS_UPDATE_FAILED')
  return { task: updatedTask, onboarding: plan, tasks }
}

const ACTIVATION_GATES = ['contract', 'payment', 'handoff', 'staffing', 'training', 'materials', 'site', 'communication', 'safety', 'quality', 'support', 'reporting']
async function calculateActivationReadiness(db: any, actor: any, access: any, payload: any) {
  const { partner } = await loadPartner(db, actor, access, payload)
  const onboarding = await latestForPartner(db, 'browser_extension_b2b_onboarding_plans', partner.id)
  let plan = await latestForPartner(db, 'browser_extension_b2b_activation_plans', partner.id)
  if (!plan) plan = await insertOne(db, 'browser_extension_b2b_activation_plans', { partner_id: partner.id, onboarding_plan_id: onboarding?.id || null, status: 'planning', owner_id: payload.ownerId || partner.operational_owner_id || actor.id, launch_at: payload.launchAt || onboarding?.target_launch_at || null, staffing: payload.staffing || {}, availability: payload.availability || {}, training: payload.training || {}, materials: payload.materials || {}, transport: payload.transport || {}, communication: payload.communication || {}, support: payload.support || {}, safety: payload.safety || {}, quality: payload.quality || {}, escalation: payload.escalation || {}, created_by: actor.id, updated_by: actor.id }, 'ACTIVATION_PLAN_CREATE_FAILED')
  let gates = await selectMany(db, 'browser_extension_b2b_activation_gates', (q) => q.eq('activation_plan_id', plan.id), 'ACTIVATION_GATES_LOAD_FAILED')
  if (!gates.length) {
    const supplied = payload.gates || {}
    const rows = ACTIVATION_GATES.map((key) => ({ activation_plan_id: plan.id, partner_id: partner.id, gate_key: key, label: key.replaceAll('_', ' '), required: true, status: supplied[key] || ((key === 'handoff' && partner.status !== 'pending_handoff') || (key === 'contract' && partner.contract_reference) || (key === 'payment' && partner.payment_status === 'verified') ? 'passed' : 'pending'), owner_id: plan.owner_id, evidence: {}, created_by: actor.id }))
    const { error } = await db.from('browser_extension_b2b_activation_gates').insert(rows)
    if (error) dbFail('ACTIVATION_GATES_CREATE_FAILED', error)
    gates = await selectMany(db, 'browser_extension_b2b_activation_gates', (q) => q.eq('activation_plan_id', plan.id), 'ACTIVATION_GATES_RELOAD_FAILED')
  } else if (payload.gates && typeof payload.gates === 'object') {
    for (const gate of gates) if (payload.gates[gate.gate_key]) await updateOne(db, 'browser_extension_b2b_activation_gates', gate.id, { status: payload.gates[gate.gate_key], evidence: payload.gateEvidence?.[gate.gate_key] || gate.evidence, approved_by: payload.gates[gate.gate_key] === 'passed' ? actor.id : null, approved_at: payload.gates[gate.gate_key] === 'passed' ? now() : null }, 'ACTIVATION_GATE_UPDATE_FAILED')
    gates = await selectMany(db, 'browser_extension_b2b_activation_gates', (q) => q.eq('activation_plan_id', plan.id), 'ACTIVATION_GATES_RELOAD_FAILED')
  }
  const required = gates.filter((row: any) => row.required)
  const passed = required.filter((row: any) => row.status === 'passed').length
  const score = required.length ? Math.round((passed / required.length) * 100) : 0
  const blockers = required.filter((row: any) => row.status !== 'passed').map((row: any) => row.gate_key)
  plan = await updateOne(db, 'browser_extension_b2b_activation_plans', plan.id, { readiness_score: score, readiness_status: score === 100 ? 'ready' : score >= 75 ? 'conditional' : 'not_ready', blocked: blockers.length > 0, blockers, status: score === 100 ? 'ready_for_approval' : 'planning', updated_by: actor.id }, 'ACTIVATION_READINESS_UPDATE_FAILED')
  await updateOne(db, 'browser_extension_b2b_partners', partner.id, { activation_status: plan.readiness_status, status: score === 100 ? 'activation_ready' : partner.status, updated_by: actor.id }, 'PARTNER_READINESS_UPDATE_FAILED')
  return { partner: { ...partner, activation_status: plan.readiness_status }, activation: plan, gates, blockers }
}

async function approveActivation(db: any, actor: any, access: any, payload: any) {
  if (!actorCanApprove(actor, access, 'extension.b2b.partner_activation')) throw fail('LAUNCH_APPROVAL_ACCESS_REQUIRED', 403)
  const result = await calculateActivationReadiness(db, actor, access, payload)
  if (result.blockers.length) throw fail('ACTIVATION_GATES_INCOMPLETE', 409, { blockers: result.blockers, activation: result.activation })
  const activation = await updateOne(db, 'browser_extension_b2b_activation_plans', result.activation.id, { status: 'approved', readiness_status: 'approved', blocked: false, approved_by: actor.id, approved_at: now(), updated_by: actor.id }, 'ACTIVATION_APPROVE_FAILED')
  const partner = await updateOne(db, 'browser_extension_b2b_partners', result.partner.id, { status: 'active', activation_status: 'approved', activated_by: actor.id, activated_at: now(), updated_by: actor.id }, 'PARTNER_LAUNCH_FAILED')
  return { ...result, activation, partner }
}

async function prepareFirstService(db: any, actor: any, access: any, payload: any) {
  const { partner } = await loadPartner(db, actor, access, payload)
  const activation = await latestForPartner(db, 'browser_extension_b2b_activation_plans', partner.id)
  if (!activation || activation.status !== 'approved') throw fail('APPROVED_ACTIVATION_REQUIRED', 409)
  const service = await insertOne(db, 'browser_extension_b2b_first_services', { partner_id: partner.id, activation_plan_id: activation.id, site_id: payload.siteId || null, service_id: payload.serviceId || null, scheduled_at: payload.scheduledAt || activation.launch_at || null, status: 'prepared', brief: payload.brief || {}, staff: payload.staff || [], partner_contact: payload.partnerContact || {}, instructions: payload.instructions || [], materials: payload.materials || [], transport: payload.transport || {}, safety: payload.safety || {}, escalation: payload.escalation || {}, created_by: actor.id, updated_by: actor.id }, 'FIRST_SERVICE_CREATE_FAILED')
  return { partner, activation, firstService: service }
}

async function recordFirstServiceOutcome(db: any, actor: any, access: any, payload: any) {
  if (!payload.firstServiceId) throw fail('FIRST_SERVICE_ID_REQUIRED')
  const service = await selectOne(db, 'browser_extension_b2b_first_services', (q) => q.eq('id', payload.firstServiceId).maybeSingle(), 'FIRST_SERVICE_LOAD_FAILED')
  if (!service) throw fail('FIRST_SERVICE_NOT_FOUND', 404)
  const { partner } = await loadPartner(db, actor, access, { partnerId: service.partner_id })
  const deviations = list(payload.deviations)
  const updated = await updateOne(db, 'browser_extension_b2b_first_services', service.id, { status: payload.status || 'completed', report: payload.report || {}, outcome: text(payload.outcome), partner_feedback: payload.partnerFeedback || {}, staff_feedback: payload.staffFeedback || {}, deviations, corrective_actions: payload.correctiveActions || [], billing_consequence: payload.billingConsequence || {}, continued_service_ready: bool(payload.continuedServiceReady), partner_confirmed_by: text(payload.partnerConfirmedBy, 300), partner_confirmed_at: payload.partnerConfirmedBy ? now() : null, completed_at: now(), updated_by: actor.id }, 'FIRST_SERVICE_OUTCOME_FAILED')
  if (deviations.length && payload.createIssue !== false) await insertOne(db, 'browser_extension_b2b_partner_issues', { partner_id: partner.id, site_id: service.site_id, service_id: service.service_id, category: 'operational_failure', severity: payload.issueSeverity || 'medium', title: 'Écarts du premier service', description: deviations.join(' · '), partner_impact: text(payload.partnerImpact), revenue_impact: num(payload.revenueImpact), status: 'open', owner_id: payload.issueOwnerId || partner.operational_owner_id || actor.id, evidence: payload.evidence || {}, created_by: actor.id, updated_by: actor.id }, 'FIRST_SERVICE_ISSUE_FAILED')
  return { partner, firstService: updated }
}

async function createHypercare(db: any, actor: any, access: any, payload: any) {
  if (!payload.firstServiceId) throw fail('FIRST_SERVICE_ID_REQUIRED')
  const service = await selectOne(db, 'browser_extension_b2b_first_services', (q) => q.eq('id', payload.firstServiceId).maybeSingle(), 'HYPERCARE_SERVICE_LOAD_FAILED')
  if (!service) throw fail('FIRST_SERVICE_NOT_FOUND', 404)
  const { partner } = await loadPartner(db, actor, access, { partnerId: service.partner_id })
  const base = new Date(service.completed_at || service.scheduled_at || now()).getTime()
  const rows = [1, 3, 7, 14, 30].map((day) => ({ partner_id: partner.id, first_service_id: service.id, checkpoint_day: day, due_at: new Date(base + day * 86400000).toISOString(), status: 'scheduled', owner_id: payload.ownerId || partner.operational_owner_id || actor.id, created_by: actor.id }))
  const { data, error } = await db.from('browser_extension_b2b_hypercare_checkpoints').upsert(rows, { onConflict: 'first_service_id,checkpoint_day' }).select('*')
  if (error) dbFail('HYPERCARE_CREATE_FAILED', error)
  return { partner, firstService: service, hypercare: data || [] }
}

async function readPerformance(db: any, actor: any, access: any, payload: any) {
  const { partner } = await loadPartner(db, actor, access, payload)
  let snapshot = await latestForPartner(db, 'browser_extension_b2b_partner_performance_snapshots', partner.id)
  if (payload.metrics && payload.periodStart && payload.periodEnd) {
    const metrics = payload.metrics
    const fields = ['contractedRevenue', 'invoicedRevenue', 'collectedRevenue', 'usage', 'volume', 'utilization', 'siteCount', 'serviceSuccess', 'incidents', 'complaints', 'responseTimeHours', 'satisfaction', 'paymentDiscipline', 'growthPotential', 'renewalReadiness']
    const missing = fields.filter((field) => metrics[field] == null)
    const { data, error } = await db.from('browser_extension_b2b_partner_performance_snapshots').upsert({ partner_id: partner.id, period_start: payload.periodStart, period_end: payload.periodEnd, contracted_revenue: metrics.contractedRevenue ?? null, invoiced_revenue: metrics.invoicedRevenue ?? null, collected_revenue: metrics.collectedRevenue ?? null, usage: metrics.usage ?? null, volume: metrics.volume ?? null, utilization: metrics.utilization ?? null, site_count: metrics.siteCount ?? null, service_success: metrics.serviceSuccess ?? null, incidents: metrics.incidents ?? null, complaints: metrics.complaints ?? null, response_time_hours: metrics.responseTimeHours ?? null, satisfaction: metrics.satisfaction ?? null, payment_discipline: metrics.paymentDiscipline ?? null, growth_potential: metrics.growthPotential ?? null, renewal_readiness: metrics.renewalReadiness ?? null, missing_fields: missing, source_evidence: payload.evidence || {}, created_by: actor.id }, { onConflict: 'partner_id,period_start,period_end' }).select('*').single()
    if (error) dbFail('PARTNER_PERFORMANCE_SAVE_FAILED', error)
    snapshot = data
  }
  const issues = await selectMany(db, 'browser_extension_b2b_partner_issues', (q) => q.eq('partner_id', partner.id).order('created_at', { ascending: false }).limit(100), 'PARTNER_PERFORMANCE_ISSUES_FAILED')
  return { partner, performance: snapshot, issues, missingData: snapshot?.missing_fields || ['performance_snapshot'] }
}

async function calculatePartnerHealth(db: any, actor: any, access: any, payload: any) {
  const result = await readPerformance(db, actor, access, payload)
  const performance = result.performance || {}
  const openIssues = result.issues.filter((row: any) => row.status !== 'closed')
  const dimensions: Record<string, number | null> = {
    relationship: payload.relationship ?? performance.satisfaction ?? null,
    contractCompliance: payload.contractCompliance ?? performance.service_success ?? null,
    payment: payload.payment ?? performance.payment_discipline ?? null,
    usage: payload.usage ?? performance.utilization ?? null,
    quality: payload.quality ?? performance.service_success ?? null,
    issueBurden: openIssues.length ? Math.max(0, 100 - openIssues.length * 12) : 100,
    satisfaction: performance.satisfaction ?? null,
    engagement: payload.engagement ?? null,
    expansion: performance.growth_potential ?? null,
    renewal: performance.renewal_readiness ?? null,
  }
  const available = Object.values(dimensions).filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  const missingData = Object.entries(dimensions).filter(([, value]) => value == null).map(([key]) => key)
  let score = available.length ? Math.round(available.reduce((sum, value) => sum + value, 0) / available.length) : 0
  const criticalIssues = openIssues.filter((row: any) => ['critical', 'high'].includes(row.severity)).length
  score = Math.max(0, score - criticalIssues * 8)
  const level = available.length === 0 ? 'unknown' : score >= 80 ? 'healthy' : score >= 60 ? 'watch' : score >= 35 ? 'at_risk' : 'critical'
  const reasons = [...(criticalIssues ? [`${criticalIssues} issue(s) critique(s)`] : []), ...(missingData.length ? [`${missingData.length} dimension(s) manquante(s)`] : [])]
  const health = await insertOne(db, 'browser_extension_b2b_partner_health_snapshots', { partner_id: result.partner.id, performance_snapshot_id: performance.id || null, score, level, dimensions, reasons, missing_data: missingData, expansion_ready: score >= 70 && criticalIssues === 0, renewal_risk: score >= 75 ? 'low' : score >= 55 ? 'medium' : 'high', calculated_by: actor.id }, 'PARTNER_HEALTH_SAVE_FAILED')
  const partner = await updateOne(db, 'browser_extension_b2b_partners', result.partner.id, { health_status: level, health_score: score, status: score < 35 ? 'at_risk' : result.partner.status, updated_by: actor.id }, 'PARTNER_HEALTH_UPDATE_FAILED')
  return { ...result, partner, health }
}

async function createIssue(db: any, actor: any, access: any, payload: any) {
  const { partner } = await loadPartner(db, actor, access, payload)
  const issue = await insertOne(db, 'browser_extension_b2b_partner_issues', { partner_id: partner.id, site_id: payload.siteId || null, service_id: payload.serviceId || null, category: payload.category || 'partner_complaint', severity: payload.severity || 'medium', title: text(payload.title, 500) || 'Issue partenaire', description: text(payload.description), partner_impact: text(payload.partnerImpact), revenue_impact: num(payload.revenueImpact), status: 'open', owner_id: payload.ownerId || partner.operational_owner_id || actor.id, escalation_level: text(payload.escalationLevel, 80), partner_communication: payload.partnerCommunication || {}, evidence: payload.evidence || {}, created_by: actor.id, updated_by: actor.id }, 'PARTNER_ISSUE_CREATE_FAILED')
  return { partner, issue }
}

async function escalateIssue(db: any, actor: any, access: any, payload: any) {
  if (!payload.issueId) throw fail('ISSUE_ID_REQUIRED')
  const issue = await selectOne(db, 'browser_extension_b2b_partner_issues', (q) => q.eq('id', payload.issueId).maybeSingle(), 'PARTNER_ISSUE_LOAD_FAILED')
  if (!issue) throw fail('PARTNER_ISSUE_NOT_FOUND', 404)
  const { partner } = await loadPartner(db, actor, access, { partnerId: issue.partner_id })
  const updated = await updateOne(db, 'browser_extension_b2b_partner_issues', issue.id, { status: 'escalated', severity: payload.severity || issue.severity, escalation_level: payload.escalationLevel || 'executive', partner_communication: payload.partnerCommunication || issue.partner_communication, escalated_by: actor.id, escalated_at: now(), updated_by: actor.id }, 'PARTNER_ISSUE_ESCALATE_FAILED')
  return { partner, issue: updated }
}

async function createCorrectiveAction(db: any, actor: any, access: any, payload: any) {
  if (!payload.issueId) throw fail('ISSUE_ID_REQUIRED')
  const issue = await selectOne(db, 'browser_extension_b2b_partner_issues', (q) => q.eq('id', payload.issueId).maybeSingle(), 'CORRECTIVE_ISSUE_LOAD_FAILED')
  if (!issue) throw fail('PARTNER_ISSUE_NOT_FOUND', 404)
  const { partner } = await loadPartner(db, actor, access, { partnerId: issue.partner_id })
  const action = await insertOne(db, 'browser_extension_b2b_corrective_actions', { issue_id: issue.id, partner_id: partner.id, problem: text(payload.problem) || issue.description || issue.title, root_cause: text(payload.rootCause), containment: text(payload.containment), corrective_action: text(payload.correctiveAction) || 'Action corrective à définir', preventive_action: text(payload.preventiveAction), owner_id: payload.ownerId || issue.owner_id || actor.id, due_at: payload.dueAt || null, status: 'open', evidence: payload.evidence || {}, partner_communication: payload.partnerCommunication || {}, created_by: actor.id }, 'CORRECTIVE_ACTION_CREATE_FAILED')
  return { partner, issue, correctiveAction: action }
}

async function closeCorrectiveAction(db: any, actor: any, access: any, payload: any) {
  if (!payload.correctiveActionId) throw fail('CORRECTIVE_ACTION_ID_REQUIRED')
  const action = await selectOne(db, 'browser_extension_b2b_corrective_actions', (q) => q.eq('id', payload.correctiveActionId).maybeSingle(), 'CORRECTIVE_ACTION_LOAD_FAILED')
  if (!action) throw fail('CORRECTIVE_ACTION_NOT_FOUND', 404)
  const { partner } = await loadPartner(db, actor, access, { partnerId: action.partner_id })
  if (!payload.evidence || !Object.keys(payload.evidence).length) throw fail('CORRECTIVE_ACTION_EVIDENCE_REQUIRED', 409)
  const updated = await updateOne(db, 'browser_extension_b2b_corrective_actions', action.id, { status: 'closed', evidence: payload.evidence, validation: payload.validation || {}, closure_notes: text(payload.closureNotes), closed_by: actor.id, closed_at: now() }, 'CORRECTIVE_ACTION_CLOSE_FAILED')
  const remaining = await selectMany(db, 'browser_extension_b2b_corrective_actions', (q) => q.eq('issue_id', action.issue_id).neq('status', 'closed'), 'CORRECTIVE_REMAINING_LOAD_FAILED')
  if (!remaining.length) await updateOne(db, 'browser_extension_b2b_partner_issues', action.issue_id, { status: 'closed', closed_by: actor.id, closed_at: now(), updated_by: actor.id }, 'PARTNER_ISSUE_CLOSE_FAILED')
  return { partner, correctiveAction: updated, issueClosed: remaining.length === 0 }
}

async function prepareReview(db: any, actor: any, access: any, payload: any, reviewType = 'monthly_review') {
  const healthResult = await calculatePartnerHealth(db, actor, access, payload)
  const partner = healthResult.partner
  const growth = await selectMany(db, 'browser_extension_b2b_growth_opportunities', (q) => q.eq('partner_id', partner.id).order('created_at', { ascending: false }).limit(50), 'PARTNER_REVIEW_GROWTH_FAILED')
  const renewal = await latestForPartner(db, 'browser_extension_b2b_renewals', partner.id)
  const review = await insertOne(db, 'browser_extension_b2b_partner_reviews', { partner_id: partner.id, review_type: payload.reviewType || reviewType, period_start: payload.periodStart || null, period_end: payload.periodEnd || null, scheduled_at: payload.scheduledAt || null, status: 'prepared', prepared_by: actor.id, attendees: payload.attendees || [], contract_performance: payload.contractPerformance || {}, services: payload.services || {}, revenue: healthResult.performance || {}, satisfaction: { score: healthResult.performance?.satisfaction ?? null }, issues: healthResult.issues, growth_opportunities: growth, renewal_risk: renewal || { level: healthResult.health.renewal_risk }, decisions: payload.decisions || [], follow_up_actions: payload.followUpActions || [], evidence: payload.evidence || {} }, 'PARTNER_REVIEW_CREATE_FAILED')
  return { ...healthResult, review, growth, renewal }
}

async function detectGrowth(db: any, actor: any, access: any, payload: any, signalType: string) {
  const healthResult = await calculatePartnerHealth(db, actor, access, payload)
  if (!healthResult.health.expansion_ready) throw fail('PARTNER_NOT_HEALTHY_FOR_EXPANSION', 409, { health: healthResult.health })
  const signal = await insertOne(db, 'browser_extension_b2b_growth_signals', { partner_id: healthResult.partner.id, signal_type: signalType, source_type: payload.sourceType || 'partner_intelligence', source_reference: text(payload.sourceReference, 300), description: text(payload.description) || `${signalType} détecté pour ${healthResult.partner.commercial_name || healthResult.partner.legal_name}`, confidence: num(payload.confidence, 0.72), estimated_value: num(payload.estimatedValue), readiness: { healthScore: healthResult.health.score, payment: healthResult.performance?.payment_discipline ?? null, capacity: payload.capacity || null }, evidence: payload.evidence || {}, status: 'detected', detected_by: actor.id }, 'GROWTH_SIGNAL_CREATE_FAILED')
  return { ...healthResult, signal }
}

async function createGrowthOpportunity(db: any, actor: any, access: any, payload: any) {
  const { partner } = await loadPartner(db, actor, access, payload)
  const health = await latestForPartner(db, 'browser_extension_b2b_partner_health_snapshots', partner.id)
  if (!health?.expansion_ready) throw fail('PARTNER_NOT_HEALTHY_FOR_EXPANSION', 409, { health })
  const opportunity = await insertOne(db, 'browser_extension_b2b_growth_opportunities', { partner_id: partner.id, source_signal_id: payload.signalId || null, opportunity_type: payload.opportunityType || 'upsell', title: text(payload.title, 500) || 'Opportunité de croissance partenaire', description: text(payload.description), estimated_value: num(payload.estimatedValue), probability: num(payload.probability, 50), target_sites: payload.targetSites || [], readiness_score: health.score || 0, blockers: payload.blockers || [], owner_id: payload.ownerId || partner.sales_owner_id || actor.id, next_action: text(payload.nextAction), next_action_due_at: payload.nextActionDueAt || null, status: 'identified', created_by: actor.id, updated_by: actor.id }, 'GROWTH_OPPORTUNITY_CREATE_FAILED')
  return { partner, health, growthOpportunity: opportunity }
}

async function createExpansionPlan(db: any, actor: any, access: any, payload: any) {
  const { partner } = await loadPartner(db, actor, access, payload)
  const health = await latestForPartner(db, 'browser_extension_b2b_partner_health_snapshots', partner.id)
  if (!health?.expansion_ready) throw fail('EXPANSION_HEALTH_GATE_FAILED', 409, { health })
  const plan = await insertOne(db, 'browser_extension_b2b_expansion_plans', { partner_id: partner.id, growth_opportunity_id: payload.growthOpportunityId || null, expansion_type: payload.expansionType || 'multi_site', scope: payload.scope || {}, target_sites: payload.targetSites || [], commercial_model: payload.commercialModel || {}, operational_capacity: payload.operationalCapacity || {}, payment_health: payload.paymentHealth || { healthStatus: partner.health_status }, phases: payload.phases || [], risks: payload.risks || [], status: actorCanApprove(actor, access, 'extension.b2b.upsell_cross_sell') ? 'approved' : 'draft', owner_id: payload.ownerId || partner.sales_owner_id || actor.id, approved_by: actorCanApprove(actor, access, 'extension.b2b.upsell_cross_sell') ? actor.id : null, approved_at: actorCanApprove(actor, access, 'extension.b2b.upsell_cross_sell') ? now() : null, created_by: actor.id }, 'EXPANSION_PLAN_CREATE_FAILED')
  return { partner, health, expansionPlan: plan }
}

async function calculateRenewal(db: any, actor: any, access: any, payload: any) {
  const healthResult = await calculatePartnerHealth(db, actor, access, payload)
  const partner = healthResult.partner
  const contractEndAt = payload.contractEndAt || partner.contract_end_at
  if (!contractEndAt) throw fail('CONTRACT_END_DATE_REQUIRED')
  const risk = healthResult.health.renewal_risk
  const { data, error } = await db.from('browser_extension_b2b_renewals').upsert({ partner_id: partner.id, contract_reference: partner.contract_reference, contract_end_at: contractEndAt, status: 'intelligence', strategy: payload.strategy || (risk === 'high' ? 'executive_rescue' : 'straight_renewal'), readiness_score: healthResult.health.score, renewal_risk: risk, performance_summary: healthResult.performance || {}, stakeholder_review: payload.stakeholderReview || {}, commercial_strategy: payload.commercialStrategy || {}, owner_id: payload.ownerId || partner.sales_owner_id || actor.id, created_by: actor.id, updated_by: actor.id }, { onConflict: 'partner_id,contract_end_at' }).select('*').single()
  if (error) dbFail('RENEWAL_SAVE_FAILED', error)
  const renewal = data
  const end = new Date(contractEndAt).getTime()
  const milestones = [180, 120, 90, 60, 30].map((days) => ({ renewal_id: renewal.id, partner_id: partner.id, days_before: days, milestone_type: days === 180 ? 'renewal_intelligence' : days === 120 ? 'performance_stakeholder_review' : days === 90 ? 'renewal_strategy' : days === 60 ? 'renewal_proposal' : 'decision_signature_control', due_at: new Date(end - days * 86400000).toISOString(), status: 'scheduled', owner_id: renewal.owner_id, created_at: now() }))
  const milestoneResult = await db.from('browser_extension_b2b_renewal_milestones').upsert(milestones, { onConflict: 'renewal_id,days_before' }).select('*')
  if (milestoneResult.error) dbFail('RENEWAL_MILESTONE_SAVE_FAILED', milestoneResult.error)
  return { ...healthResult, renewal, milestones: milestoneResult.data || [] }
}

async function detectChurn(db: any, actor: any, access: any, payload: any) {
  const result = await calculateRenewal(db, actor, access, payload)
  const signals: string[] = []
  if (result.health.score < 60) signals.push('low_partner_health')
  if (num(result.performance?.usage) <= 0) signals.push('low_usage')
  if (num(result.performance?.complaints) > 2) signals.push('complaints')
  if (num(result.performance?.payment_discipline, 100) < 60) signals.push('payment_risk')
  if (result.issues.some((row: any) => row.status !== 'closed' && ['high', 'critical'].includes(row.severity))) signals.push('unresolved_critical_issue')
  const score = Math.min(100, signals.length * 20 + Math.max(0, 60 - result.health.score))
  const risk = await insertOne(db, 'browser_extension_b2b_churn_risks', { partner_id: result.partner.id, renewal_id: result.renewal.id, risk_level: score >= 70 ? 'critical' : score >= 45 ? 'high' : score >= 25 ? 'medium' : 'low', score, signals, reasons: payload.reasons || signals, revenue_at_risk: num(payload.revenueAtRisk, result.performance?.contracted_revenue), recommended_actions: payload.recommendedActions || (score >= 45 ? ['Executive relationship review', 'Correct service issues', 'Confirm renewal decision process'] : ['Maintain renewal cadence']), owner_id: payload.ownerId || result.renewal.owner_id, status: 'open', detected_by: actor.id }, 'CHURN_RISK_CREATE_FAILED')
  return { ...result, churnRisk: risk }
}

async function createTender(db: any, actor: any, access: any, payload: any) {
  let partner = null; let prospect = null
  if (payload.partnerId || payload.prospectId) {
    try { const loaded = await loadPartner(db, actor, access, payload); partner = loaded.partner; prospect = loaded.prospect } catch (error: any) { if (payload.partnerId) throw error }
  }
  if (!partner && payload.opportunityId) { const loaded = await loadOpportunity(db, actor, access, payload.opportunityId); prospect = loaded.prospect }
  const tender = await insertOne(db, 'browser_extension_b2b_tenders', { partner_id: partner?.id || null, prospect_id: prospect?.id || payload.prospectId || null, opportunity_id: payload.opportunityId || null, title: text(payload.title, 600) || 'Appel d’offres B2B', issuer: text(payload.issuer, 500), reference: text(payload.reference, 200), source_url: text(payload.sourceUrl, 2000), detected_at: payload.detectedAt || now(), submission_deadline: payload.submissionDeadline || null, estimated_value: num(payload.estimatedValue), status: 'detected', owner_id: payload.ownerId || partner?.sales_owner_id || actor.id, created_by: actor.id, updated_by: actor.id }, 'TENDER_CREATE_FAILED')
  return { partner, prospect, tender }
}

async function extractTenderRequirements(db: any, actor: any, access: any, payload: any) {
  if (!payload.tenderId) throw fail('TENDER_ID_REQUIRED')
  const tender = await selectOne(db, 'browser_extension_b2b_tenders', (q) => q.eq('id', payload.tenderId).maybeSingle(), 'TENDER_LOAD_FAILED')
  if (!tender) throw fail('TENDER_NOT_FOUND', 404)
  if (tender.partner_id) await loadPartner(db, actor, access, { partnerId: tender.partner_id })
  const requirements = list(payload.requirements)
  if (!requirements.length) throw fail('TENDER_REQUIREMENTS_REQUIRED')
  const rows = requirements.map((row: any, index: number) => ({ tender_id: tender.id, requirement_code: row.code || `REQ-${String(index + 1).padStart(3, '0')}`, category: row.category || 'general', requirement_text: text(row.text || row.requirement)!, mandatory: row.mandatory !== false, response: text(row.response), owner_id: row.ownerId || tender.owner_id, due_at: row.dueAt || tender.submission_deadline, status: row.status || 'open', evidence: row.evidence || {}, created_by: actor.id }))
  const { data, error } = await db.from('browser_extension_b2b_tender_requirements').insert(rows).select('*')
  if (error) dbFail('TENDER_REQUIREMENTS_CREATE_FAILED', error)
  const updated = await updateOne(db, 'browser_extension_b2b_tenders', tender.id, { status: 'requirements', updated_by: actor.id }, 'TENDER_REQUIREMENT_STATUS_FAILED')
  return { tender: updated, requirements: data || [] }
}

async function tenderBidDecision(db: any, actor: any, access: any, payload: any) {
  if (!payload.tenderId) throw fail('TENDER_ID_REQUIRED')
  if (!actorCanApprove(actor, access, 'extension.b2b.tender_rfp_intelligence')) throw fail('TENDER_BID_APPROVAL_REQUIRED', 403)
  const tender = await selectOne(db, 'browser_extension_b2b_tenders', (q) => q.eq('id', payload.tenderId).maybeSingle(), 'TENDER_LOAD_FAILED')
  if (!tender) throw fail('TENDER_NOT_FOUND', 404)
  if (tender.partner_id) await loadPartner(db, actor, access, { partnerId: tender.partner_id })
  const scores = [num(payload.strategicFit), num(payload.deliveryFeasibility), num(payload.expectedMargin), num(payload.documentationReadiness)]
  const decision = payload.decision || (scores.reduce((a, b) => a + b, 0) / scores.length >= 60 ? 'bid' : 'no_bid')
  const updated = await updateOne(db, 'browser_extension_b2b_tenders', tender.id, { status: decision === 'bid' ? 'bid_approved' : 'no_bid', bid_decision: decision, bid_rationale: text(payload.rationale), strategic_fit: scores[0], delivery_feasibility: scores[1], expected_margin: scores[2], payment_risk: text(payload.paymentRisk, 100), competition: payload.competition || [], documentation_readiness: scores[3], approval: { decidedBy: actor.id, decidedAt: now(), evidence: payload.evidence || {} }, updated_by: actor.id }, 'TENDER_BID_DECISION_FAILED')
  return { tender: updated }
}

async function updateTenderCompliance(db: any, actor: any, access: any, payload: any) {
  if (!payload.tenderId || !payload.requirementId) throw fail('TENDER_AND_REQUIREMENT_REQUIRED')
  const tender = await selectOne(db, 'browser_extension_b2b_tenders', (q) => q.eq('id', payload.tenderId).maybeSingle(), 'TENDER_LOAD_FAILED')
  if (!tender) throw fail('TENDER_NOT_FOUND', 404)
  if (tender.partner_id) await loadPartner(db, actor, access, { partnerId: tender.partner_id })
  const { data, error } = await db.from('browser_extension_b2b_tender_compliance').upsert({ tender_id: tender.id, requirement_id: payload.requirementId, compliance_status: payload.complianceStatus || 'compliant', response: text(payload.response), document_references: payload.documentReferences || [], owner_id: payload.ownerId || actor.id, validated_by: payload.validated ? actor.id : null, validated_at: payload.validated ? now() : null, updated_by: actor.id, updated_at: now() }, { onConflict: 'tender_id,requirement_id' }).select('*').single()
  if (error) dbFail('TENDER_COMPLIANCE_UPDATE_FAILED', error)
  return { tender, compliance: data }
}

async function submitTender(db: any, actor: any, access: any, payload: any) {
  if (!payload.tenderId) throw fail('TENDER_ID_REQUIRED')
  if (!actorCanApprove(actor, access, 'extension.b2b.tender_rfp_intelligence')) throw fail('TENDER_SUBMISSION_APPROVAL_REQUIRED', 403)
  const tender = await selectOne(db, 'browser_extension_b2b_tenders', (q) => q.eq('id', payload.tenderId).maybeSingle(), 'TENDER_LOAD_FAILED')
  if (!tender) throw fail('TENDER_NOT_FOUND', 404)
  if (tender.bid_decision !== 'bid') throw fail('BID_DECISION_REQUIRED', 409)
  const requirements = await selectMany(db, 'browser_extension_b2b_tender_requirements', (q) => q.eq('tender_id', tender.id), 'TENDER_REQUIREMENTS_LOAD_FAILED')
  const compliance = await selectMany(db, 'browser_extension_b2b_tender_compliance', (q) => q.eq('tender_id', tender.id), 'TENDER_COMPLIANCE_LOAD_FAILED')
  const incomplete = requirements.filter((row: any) => row.mandatory && !compliance.some((item: any) => item.requirement_id === row.id && item.compliance_status === 'compliant'))
  if (incomplete.length) throw fail('TENDER_COMPLIANCE_INCOMPLETE', 409, { requirementIds: incomplete.map((row: any) => row.id) })
  const updated = await updateOne(db, 'browser_extension_b2b_tenders', tender.id, { status: 'submitted', submission_evidence: payload.submissionEvidence || {}, submitted_by: actor.id, submitted_at: now(), updated_by: actor.id }, 'TENDER_SUBMIT_FAILED')
  return { tender: updated, requirements, compliance }
}

export async function executeB2BPartnerCommand(input: { db: any; actor: any; device: any; access: any; commandKey: string; payload: any }) {
  const { db, actor, access, commandKey } = input
  const payload = input.payload || {}
  if (!B2B_PARTNER_COMMAND_MAP.has(commandKey)) throw fail('UNREGISTERED_B2B_PARTNER_COMMAND')
  switch (commandKey) {
    case 'b2b.handoff.generate': return generateHandoff(db, actor, access, payload)
    case 'b2b.handoff.validate': return validateHandoff(db, actor, access, payload)
    case 'b2b.handoff.accept': return acceptHandoff(db, actor, access, payload)
    case 'b2b.handoff.request_correction': return requestHandoffCorrection(db, actor, access, payload)
    case 'b2b.partner.activate': return activatePartner(db, actor, access, payload)
    case 'b2b.partner.read': return loadPartner(db, actor, access, payload)
    case 'b2b.partner.update': { const loaded = await loadPartner(db, actor, access, payload); return { ...loaded, partner: await updateOne(db, 'browser_extension_b2b_partners', loaded.partner.id, { commercial_name: text(payload.commercialName, 500) || loaded.partner.commercial_name, operational_owner_id: payload.operationalOwnerId || loaded.partner.operational_owner_id, sales_owner_id: payload.salesOwnerId || loaded.partner.sales_owner_id, metadata: payload.metadata || loaded.partner.metadata, updated_by: actor.id }, 'PARTNER_PROFILE_UPDATE_FAILED') } }
    case 'b2b.partner.site_create': { const loaded = await loadPartner(db, actor, access, payload); const site = await insertOne(db, 'browser_extension_b2b_partner_sites', { partner_id: loaded.partner.id, parent_site_id: payload.parentSiteId || null, site_code: text(payload.siteCode, 100), name: text(payload.name, 500) || 'Site partenaire', site_type: payload.siteType || 'operating_site', city: text(payload.city, 200) || loaded.partner.city, address: text(payload.address, 1000), territory: text(payload.territory, 200) || loaded.partner.territory, operational_contact: payload.operationalContact || {}, schedule: payload.schedule || {}, capacity: payload.capacity || {}, status: payload.status || 'planned', launch_at: payload.launchAt || null, created_by: actor.id, updated_by: actor.id }, 'PARTNER_SITE_CREATE_FAILED'); return { ...loaded, site } }
    case 'b2b.partner.service_configure': { const loaded = await loadPartner(db, actor, access, payload); const service = await insertOne(db, 'browser_extension_b2b_partner_services', { partner_id: loaded.partner.id, site_id: payload.siteId || null, service_line: text(payload.serviceLine, 500) || 'ANGELCARE Service', program: text(payload.program, 500), configuration: payload.configuration || {}, volume: num(payload.volume), frequency: text(payload.frequency, 200), schedule: payload.schedule || {}, commercial_value: num(payload.commercialValue), billing_model: text(payload.billingModel, 200), status: payload.status || 'configured', start_at: payload.startAt || null, end_at: payload.endAt || null, created_by: actor.id, updated_by: actor.id }, 'PARTNER_SERVICE_CREATE_FAILED'); return { ...loaded, service } }
    case 'b2b.onboarding.create': return createOnboarding(db, actor, access, payload)
    case 'b2b.onboarding.task_complete': return completeOnboardingTask(db, actor, access, payload)
    case 'b2b.activation.readiness_calculate': return calculateActivationReadiness(db, actor, access, payload)
    case 'b2b.activation.approve': return approveActivation(db, actor, access, payload)
    case 'b2b.first_service.prepare': return prepareFirstService(db, actor, access, payload)
    case 'b2b.first_service.outcome_record': return recordFirstServiceOutcome(db, actor, access, payload)
    case 'b2b.hypercare.create': return createHypercare(db, actor, access, payload)
    case 'b2b.partner_performance.read': return readPerformance(db, actor, access, payload)
    case 'b2b.partner_health.calculate': return calculatePartnerHealth(db, actor, access, payload)
    case 'b2b.partner_issue.create': return createIssue(db, actor, access, payload)
    case 'b2b.partner_issue.escalate': return escalateIssue(db, actor, access, payload)
    case 'b2b.corrective_action.create': return createCorrectiveAction(db, actor, access, payload)
    case 'b2b.corrective_action.close': return closeCorrectiveAction(db, actor, access, payload)
    case 'b2b.partner_review.prepare': return prepareReview(db, actor, access, payload, payload.reviewType || 'monthly_review')
    case 'b2b.qbr.generate': return prepareReview(db, actor, access, payload, 'quarterly_business_review')
    case 'b2b.upsell.detect': return detectGrowth(db, actor, access, payload, 'upsell')
    case 'b2b.upsell.create': return createGrowthOpportunity(db, actor, access, { ...payload, opportunityType: payload.opportunityType || 'upsell' })
    case 'b2b.cross_sell.detect': return detectGrowth(db, actor, access, payload, 'cross_sell')
    case 'b2b.expansion.site_detect': return detectGrowth(db, actor, access, payload, 'site_expansion')
    case 'b2b.expansion.plan_create': return createExpansionPlan(db, actor, access, payload)
    case 'b2b.renewal.readiness_calculate': return calculateRenewal(db, actor, access, payload)
    case 'b2b.renewal.plan_create': { const result = await calculateRenewal(db, actor, access, payload); return { ...result, renewal: await updateOne(db, 'browser_extension_b2b_renewals', result.renewal.id, { status: 'strategy', strategy: payload.strategy || result.renewal.strategy, commercial_strategy: payload.commercialStrategy || result.renewal.commercial_strategy, updated_by: actor.id }, 'RENEWAL_PLAN_UPDATE_FAILED') } }
    case 'b2b.renewal.proposal_prepare': { const result = await calculateRenewal(db, actor, access, payload); if (!actorCanApprove(actor, access, 'extension.b2b.renewal_management')) throw fail('RENEWAL_APPROVAL_ACCESS_REQUIRED', 403); return { ...result, renewal: await updateOne(db, 'browser_extension_b2b_renewals', result.renewal.id, { status: 'proposal_prepared', proposal_reference: payload.proposalReference || {}, approver_id: actor.id, updated_by: actor.id }, 'RENEWAL_PROPOSAL_UPDATE_FAILED') } }
    case 'b2b.churn_risk.detect': return detectChurn(db, actor, access, payload)
    case 'b2b.partner_rescue.create': { const loaded = await loadPartner(db, actor, access, payload); const rescue = await insertOne(db, 'browser_extension_b2b_partner_rescue_cases', { partner_id: loaded.partner.id, renewal_id: payload.renewalId || null, issue_id: payload.issueId || null, rescue_type: payload.rescueType || 'renewal_rescue', reason: text(payload.reason) || 'Risque partenaire détecté', revenue_at_risk: num(payload.revenueAtRisk), recommended_intervention: text(payload.recommendedIntervention), prohibited_commitments: payload.prohibitedCommitments || [], owner_id: payload.ownerId || loaded.partner.sales_owner_id || actor.id, executive_owner_id: payload.executiveOwnerId || null, due_at: payload.dueAt || null, status: 'open', created_by: actor.id }, 'PARTNER_RESCUE_CREATE_FAILED'); return { ...loaded, partnerRescue: rescue } }
    case 'b2b.tender.create': return createTender(db, actor, access, payload)
    case 'b2b.tender.requirements_extract': return extractTenderRequirements(db, actor, access, payload)
    case 'b2b.tender.bid_decision': return tenderBidDecision(db, actor, access, payload)
    case 'b2b.tender.compliance_update': return updateTenderCompliance(db, actor, access, payload)
    case 'b2b.tender.submit': return submitTender(db, actor, access, payload)
    case 'b2b.tender.outcome_record': { if (!payload.tenderId) throw fail('TENDER_ID_REQUIRED'); const tender = await selectOne(db, 'browser_extension_b2b_tenders', (q) => q.eq('id', payload.tenderId).maybeSingle(), 'TENDER_LOAD_FAILED'); if (!tender) throw fail('TENDER_NOT_FOUND', 404); if (tender.partner_id) await loadPartner(db, actor, access, { partnerId: tender.partner_id }); return { tender: await updateOne(db, 'browser_extension_b2b_tenders', tender.id, { status: payload.outcome === 'awarded' ? 'awarded' : 'lost', outcome: payload.outcome || 'lost', updated_by: actor.id }, 'TENDER_OUTCOME_FAILED'), handoffRequired: payload.outcome === 'awarded' } }
    default: throw fail('UNHANDLED_B2B_PARTNER_COMMAND')
  }
}

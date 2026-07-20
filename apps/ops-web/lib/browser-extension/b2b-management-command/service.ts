import { cleanText } from '../b2b-intelligence/normalize'
import { assertTerritory, filterByOwnership } from '../b2b-intelligence/scope'
import { B2B_HIGH_RISK_ACTIONS, B2B_MANAGEMENT_COMMAND_MAP, B2B_SAFE_AUTOMATION_TYPES } from './contract'
import type { ForecastCategory, TruthClassification } from './types'

function now() { return new Date().toISOString() }
function fail(message: string, status = 400, details?: unknown) { return Object.assign(new Error(message), { status, details }) }
function dbFail(prefix: string, error: any): never { console.error(`[${prefix}]`, error); throw fail(prefix, 500, { message: error?.message, code: error?.code }) }
function text(value: unknown, max = 8000) { return cleanText(value, max) || null }
function num(value: unknown, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback }
function list(value: unknown) { return Array.isArray(value) ? value : [] }
function scopeRecord(access: any) { return Object.fromEntries((access?.scopes || []).map((row: any) => [row.scope_key, row.scope_value])) as Record<string, unknown> }
function actorCanApprove(actor: any, access: any, permission: string) { const role = String(actor?.role || actor?.role_key || '').toLowerCase(); const grant = (access?.capabilities || []).find((row: any) => row.capability_key === permission); return ['owner','admin','super_admin','manager','director','managing_director','executive'].some((key) => role.includes(key)) || ['APPROVE','ADMINISTER'].includes(String(grant?.access_level || '').toUpperCase()) }
function unique<T>(rows: T[]) { return [...new Set(rows)] }
function daysSince(value: unknown) { const ts = Date.parse(String(value || '')); return Number.isFinite(ts) ? Math.max(0, Math.floor((Date.now() - ts) / 86400000)) : 9999 }
function daysUntil(value: unknown) { const ts = Date.parse(String(value || '')); return Number.isFinite(ts) ? Math.ceil((ts - Date.now()) / 86400000) : 9999 }
function confidenceFromEvidence(count: number, missing: number) { return Math.max(.2, Math.min(.98, .45 + count * .07 - missing * .08)) }
function safeJson(value: unknown, fallback: any = {}) { return value && typeof value === 'object' ? value : fallback }

async function many(db: any, table: string, configure: (q: any) => any) {
  const { data, error } = await configure(db.from(table).select('*'))
  if (error) dbFail(`${table.toUpperCase()}_READ_FAILED`, error)
  return data || []
}
async function maybe(db: any, table: string, configure: (q: any) => any) {
  const { data, error } = await configure(db.from(table).select('*'))
  if (error) dbFail(`${table.toUpperCase()}_READ_FAILED`, error)
  return data || null
}
async function insertOne(db: any, table: string, row: any, label: string) {
  const { data, error } = await db.from(table).insert(row).select('*').single()
  if (error) dbFail(label, error)
  return data
}
async function updateOne(db: any, table: string, id: string, row: any, label: string) {
  const { data, error } = await db.from(table).update({ ...row, updated_at: now() }).eq('id', id).select('*').single()
  if (error) dbFail(label, error)
  return data
}

async function loadOpportunityBundle(db: any, actor: any, access: any, payload: any) {
  const opportunityId = text(payload.opportunityId, 100)
  const prospectId = text(payload.prospectId, 100)
  let opportunity = opportunityId ? await maybe(db, 'browser_extension_b2b_opportunities', (q) => q.eq('id', opportunityId).maybeSingle()) : null
  if (!opportunity && prospectId) opportunity = await maybe(db, 'browser_extension_b2b_opportunities', (q) => q.eq('prospect_id', prospectId).order('updated_at', { ascending: false }).limit(1).maybeSingle())
  if (!opportunity) throw fail('OPPORTUNITY_REQUIRED', 404)
  const account = await maybe(db, 'b2b_prospects', (q) => q.eq('id', opportunity.prospect_id).maybeSingle())
  if (!account) throw fail('ACCOUNT_NOT_FOUND', 404)
  if (!filterByOwnership([account], actor.id, scopeRecord(access)).length) throw fail('ACCOUNT_SCOPE_DENIED', 403)
  assertTerritory(scopeRecord(access), account.city || account.territory)
  const [contacts, committee, proposals, pricing, negotiations, closing, paymentPromises, actions, meetings] = await Promise.all([
    many(db, 'browser_extension_b2b_contacts', (q) => q.eq('prospect_id', account.id).limit(100)),
    many(db, 'browser_extension_b2b_buying_committee', (q) => q.eq('prospect_id', account.id).limit(100)),
    many(db, 'browser_extension_b2b_proposals', (q) => q.eq('opportunity_id', opportunity.id).order('created_at', { ascending: false }).limit(20)),
    many(db, 'browser_extension_b2b_pricing_models', (q) => q.eq('opportunity_id', opportunity.id).order('created_at', { ascending: false }).limit(20)),
    many(db, 'browser_extension_b2b_negotiation_rooms', (q) => q.eq('opportunity_id', opportunity.id).order('created_at', { ascending: false }).limit(10)),
    many(db, 'browser_extension_b2b_closing_readiness', (q) => q.eq('opportunity_id', opportunity.id).order('created_at', { ascending: false }).limit(10)),
    many(db, 'browser_extension_b2b_payment_promises', (q) => q.eq('opportunity_id', opportunity.id).order('created_at', { ascending: false }).limit(30)),
    many(db, 'browser_extension_b2b_next_actions', (q) => q.eq('opportunity_id', opportunity.id).order('due_at', { ascending: true }).limit(100)),
    many(db, 'browser_extension_b2b_meeting_outcomes', (q) => q.eq('opportunity_id', opportunity.id).order('created_at', { ascending: false }).limit(30)),
  ])
  return { account, opportunity, contacts, committee, proposals, pricing, negotiations, closing, paymentPromises, actions, meetings }
}

async function loadPartnerBundle(db: any, actor: any, access: any, payload: any) {
  const partnerId = text(payload.partnerId, 100)
  if (!partnerId) throw fail('PARTNER_REQUIRED')
  const partner = await maybe(db, 'browser_extension_b2b_partners', (q) => q.eq('id', partnerId).maybeSingle())
  if (!partner) throw fail('PARTNER_NOT_FOUND', 404)
  const account = await maybe(db, 'b2b_prospects', (q) => q.eq('id', partner.prospect_id).maybeSingle())
  if (!account || !filterByOwnership([account], actor.id, scopeRecord(access)).length) throw fail('PARTNER_SCOPE_DENIED', 403)
  assertTerritory(scopeRecord(access), partner.territory || partner.city || account.city)
  const [health, performance, issues, renewals, growth, handoffs] = await Promise.all([
    many(db, 'browser_extension_b2b_partner_health_snapshots', (q) => q.eq('partner_id', partner.id).order('created_at', { ascending: false }).limit(20)),
    many(db, 'browser_extension_b2b_partner_performance_snapshots', (q) => q.eq('partner_id', partner.id).order('created_at', { ascending: false }).limit(20)),
    many(db, 'browser_extension_b2b_partner_issues', (q) => q.eq('partner_id', partner.id).order('created_at', { ascending: false }).limit(100)),
    many(db, 'browser_extension_b2b_renewals', (q) => q.eq('partner_id', partner.id).order('contract_end_at', { ascending: true }).limit(20)),
    many(db, 'browser_extension_b2b_growth_opportunities', (q) => q.eq('partner_id', partner.id).order('created_at', { ascending: false }).limit(100)),
    many(db, 'browser_extension_b2b_handoffs', (q) => q.eq('partner_id', partner.id).order('updated_at', { ascending: false }).limit(20)),
  ])
  return { partner, account, health, performance, issues, renewals, growth, handoffs }
}

function assessOpportunity(bundle: any) {
  const { opportunity, committee, proposals, closing, paymentPromises, actions, meetings } = bundle
  const missing: string[] = []
  const evidence: Array<{ type: string; reference?: string; statement: string; classification: TruthClassification }> = []
  const economicBuyer = committee.find((row: any) => ['economic_buyer','financial_approver'].includes(String(row.role_key || row.decision_role || '').toLowerCase()) && row.status !== 'missing')
  if (economicBuyer) evidence.push({ type: 'buying_committee', reference: economicBuyer.id, statement: 'Economic or financial decision authority is identified.', classification: 'verified_fact' })
  else missing.push('economic_buyer')
  const approvedProposal = proposals.find((row: any) => ['approved','sent','accepted'].includes(String(row.status || '').toLowerCase()))
  if (approvedProposal) evidence.push({ type: 'proposal', reference: approvedProposal.id, statement: `Proposal status is ${approvedProposal.status}.`, classification: 'verified_fact' })
  else missing.push('approved_proposal')
  const latestMeeting = meetings[0]
  if (latestMeeting) evidence.push({ type: 'meeting', reference: latestMeeting.id, statement: 'A recorded meeting outcome exists.', classification: 'verified_fact' })
  else missing.push('meeting_outcome')
  const latestAction = actions.find((row: any) => !['completed','cancelled'].includes(String(row.status || '').toLowerCase()))
  if (latestAction) evidence.push({ type: 'next_action', reference: latestAction.id, statement: 'A current next action is assigned.', classification: 'verified_fact' })
  else missing.push('next_action')
  const latestClosing = closing[0]
  const paymentVerified = paymentPromises.find((row: any) => ['verified','paid','completed'].includes(String(row.status || row.verification_status || '').toLowerCase()))
  const staleDays = daysSince(opportunity.last_activity_at || opportunity.updated_at || opportunity.created_at)
  if (staleDays > 14) evidence.push({ type: 'activity_age', statement: `No recent opportunity update for ${staleDays} days.`, classification: 'evidence_backed_inference' })
  const reportedStage = String(opportunity.stage || 'new_target').toLowerCase()
  let recommendedStage = reportedStage
  if (['negotiation','commercial_agreement','contract_pending','payment_pending','won'].includes(reportedStage) && !approvedProposal) recommendedStage = 'discovery'
  else if (reportedStage === 'won' && !paymentVerified) recommendedStage = 'payment_pending'
  else if (approvedProposal && economicBuyer && ['research','qualified','initial_contact','discovery'].includes(reportedStage)) recommendedStage = 'proposal_sent'
  else if (staleDays > 30) recommendedStage = 'stale'
  const stageValid = recommendedStage === reportedStage
  let category: ForecastCategory = 'possible'
  if (reportedStage === 'won' && paymentVerified) category = 'committed'
  else if (['commercial_agreement','contract_pending','payment_pending'].includes(reportedStage) && approvedProposal && economicBuyer) category = 'probable'
  else if (staleDays > 30) category = 'stale'
  else if (!economicBuyer || !approvedProposal) category = 'at_risk'
  else if (['new_target','research'].includes(reportedStage)) category = 'unqualified'
  const confidence = confidenceFromEvidence(evidence.length, missing.length)
  return { reportedStage, recommendedStage, stageValid, category, confidence, missing, evidence, staleDays, latestClosing, approvedProposal, economicBuyer, paymentVerified }
}

async function persistRecommendation(db: any, actor: any, input: any) {
  const row = await insertOne(db, 'browser_extension_b2b_ai_recommendations', {
    subject_type: input.subjectType,
    subject_id: input.subjectId,
    prospect_id: input.prospectId || null,
    opportunity_id: input.opportunityId || null,
    partner_id: input.partnerId || null,
    recommendation_type: input.recommendationType,
    finding: text(input.finding),
    commercial_significance: text(input.commercialSignificance),
    recommended_action: text(input.recommendedAction),
    expected_outcome: text(input.expectedOutcome),
    revenue_impact: num(input.revenueImpact),
    risk_level: input.riskLevel || 'medium',
    confidence: num(input.confidence, .5),
    truth_classification: input.truthClassification || 'ai_recommendation',
    missing_evidence: list(input.missingEvidence),
    status: 'generated',
    model_key: 'angelcare-governed-revenue-director-v1',
    policy_version: 'mega6-v1',
    expires_at: input.expiresAt || new Date(Date.now() + 7 * 86400000).toISOString(),
    generated_by: actor.id,
    owner_id: input.ownerId || actor.id,
    deadline: input.deadline || null,
    approval_required: Boolean(input.approvalRequired),
    metadata: safeJson(input.metadata),
  }, 'AI_RECOMMENDATION_CREATE_FAILED')
  const evidence = list(input.evidence)
  if (evidence.length) {
    const rows = evidence.map((item: any) => ({ recommendation_id: row.id, evidence_type: item.type || 'record', evidence_reference: item.reference || null, statement: text(item.statement), truth_classification: item.classification || 'verified_fact', source_timestamp: item.sourceTimestamp || null, metadata: safeJson(item.metadata), created_by: actor.id }))
    const { error } = await db.from('browser_extension_b2b_ai_recommendation_evidence').insert(rows)
    if (error) dbFail('AI_RECOMMENDATION_EVIDENCE_FAILED', error)
  }
  return row
}

async function reviewAccount(db: any, actor: any, access: any, payload: any) {
  const bundle = await loadOpportunityBundle(db, actor, access, payload)
  const assessment = assessOpportunity(bundle)
  const findings: any[] = []
  if (!assessment.stageValid) findings.push({ type: 'pipeline_truth', finding: `Opportunity is positioned as ${assessment.reportedStage} but evidence supports ${assessment.recommendedStage}.`, action: `Move opportunity to ${assessment.recommendedStage} after manager review.`, risk: 'high' })
  if (assessment.missing.includes('economic_buyer')) findings.push({ type: 'stakeholder_coverage', finding: 'Economic buyer or financial approver is not evidenced.', action: 'Create a focused decision-maker research and access mission.', risk: 'high' })
  if (assessment.missing.includes('approved_proposal')) findings.push({ type: 'proposal_readiness', finding: 'No approved or delivered proposal supports the current commercial position.', action: 'Complete proposal and pricing approval before claiming negotiation readiness.', risk: 'high' })
  if (assessment.staleDays > 14) findings.push({ type: 'stale_opportunity', finding: `Opportunity has been inactive for ${assessment.staleDays} days.`, action: 'Assign a recovery action with a dated owner commitment.', risk: assessment.staleDays > 30 ? 'critical' : 'high' })
  if (!findings.length) findings.push({ type: 'account_health', finding: 'No critical evidence contradiction was found in the current account review.', action: 'Continue the documented next action and refresh evidence after the next interaction.', risk: 'low' })
  const recommendations = []
  for (const item of findings) recommendations.push(await persistRecommendation(db, actor, { subjectType: 'opportunity', subjectId: bundle.opportunity.id, prospectId: bundle.account.id, opportunityId: bundle.opportunity.id, recommendationType: item.type, finding: item.finding, commercialSignificance: item.risk === 'low' ? 'Maintain disciplined execution.' : 'Pipeline value and forecast reliability are exposed.', recommendedAction: item.action, expectedOutcome: 'Correct commercial position and improve forecast truth.', revenueImpact: num(bundle.opportunity.estimated_value || bundle.opportunity.estimated_annual_value), riskLevel: item.risk, confidence: assessment.confidence, missingEvidence: assessment.missing, evidence: assessment.evidence, ownerId: bundle.opportunity.owner_id || actor.id, deadline: new Date(Date.now() + 2 * 86400000).toISOString() }))
  return { account: bundle.account, opportunity: bundle.opportunity, assessment, recommendations }
}

async function reviewPipeline(db: any, actor: any, access: any, payload: any) {
  const rows = await many(db, 'browser_extension_b2b_opportunities', (q) => q.order('updated_at', { ascending: false }).limit(Math.min(500, num(payload.limit, 200))))
  const accounts = await many(db, 'b2b_prospects', (q) => q.in('id', unique(rows.map((r: any) => r.prospect_id).filter(Boolean))).limit(500))
  const allowed = new Set(filterByOwnership(accounts, actor.id, scopeRecord(access)).map((r: any) => r.id))
  const scoped = rows.filter((row: any) => allowed.has(row.prospect_id))
  const summary = { total: scoped.length, stale: 0, missingNextAction: 0, unsupportedAdvancedStage: 0, value: 0 }
  const reviewItems = []
  for (const row of scoped) {
    const stale = daysSince(row.last_activity_at || row.updated_at) > 30
    const advanced = ['negotiation','commercial_agreement','contract_pending','payment_pending','won'].includes(String(row.stage || '').toLowerCase())
    if (stale) summary.stale++
    if (!row.next_action && !row.next_action_title) summary.missingNextAction++
    if (advanced && !row.proposal_id && !row.approved_proposal_id) summary.unsupportedAdvancedStage++
    summary.value += num(row.estimated_value || row.estimated_annual_value)
    if (stale || advanced || (!row.next_action && !row.next_action_title)) reviewItems.push({ opportunityId: row.id, stage: row.stage, stale, advanced, missingNextAction: !row.next_action && !row.next_action_title, value: num(row.estimated_value || row.estimated_annual_value) })
  }
  const recommendation = await persistRecommendation(db, actor, { subjectType: 'pipeline', subjectId: actor.id, recommendationType: 'pipeline_review', finding: `${summary.stale} stale, ${summary.missingNextAction} without next action, ${summary.unsupportedAdvancedStage} advanced-stage opportunities require evidence review.`, commercialSignificance: 'Forecast quality and daily revenue execution depend on correcting these records.', recommendedAction: 'Prioritize the review queue and assign corrections before the next forecast snapshot.', expectedOutcome: 'Evidence-supported pipeline and reduced revenue leakage.', revenueImpact: summary.value, riskLevel: summary.stale || summary.unsupportedAdvancedStage ? 'high' : 'medium', confidence: .82, missingEvidence: [], evidence: [{ type: 'pipeline_query', statement: `${scoped.length} authorized opportunities reviewed.`, classification: 'verified_fact' }], metadata: { summary, reviewItems: reviewItems.slice(0, 100) } })
  return { summary, reviewItems, recommendation }
}

async function reviewPartner(db: any, actor: any, access: any, payload: any) {
  const bundle = await loadPartnerBundle(db, actor, access, payload)
  const latestHealth = bundle.health[0]
  const openIssues = bundle.issues.filter((row: any) => !['closed','resolved'].includes(String(row.status || '').toLowerCase()))
  const missing: string[] = []
  if (!latestHealth) missing.push('partner_health_snapshot')
  if (!bundle.performance[0]) missing.push('partner_performance_snapshot')
  const healthScore = num(latestHealth?.score, 0)
  const risk = openIssues.some((row: any) => ['critical','high'].includes(String(row.severity || '').toLowerCase())) || (latestHealth && healthScore < 50) ? 'high' : missing.length ? 'medium' : 'low'
  const recommendation = await persistRecommendation(db, actor, { subjectType: 'partner', subjectId: bundle.partner.id, prospectId: bundle.partner.prospect_id, partnerId: bundle.partner.id, recommendationType: 'partner_review', finding: `${openIssues.length} open issue(s); health ${latestHealth ? healthScore : 'missing'}.`, commercialSignificance: 'Partner health controls expansion, renewal and churn exposure.', recommendedAction: risk === 'high' ? 'Open Partner Health Rescue before any expansion action.' : missing.length ? 'Capture missing performance and health evidence.' : 'Continue QBR and renewal cadence.', expectedOutcome: 'Protect collected revenue and long-term partnership.', revenueImpact: num(bundle.performance[0]?.contracted_revenue || bundle.performance[0]?.invoiced_revenue), riskLevel: risk, confidence: confidenceFromEvidence(2 - missing.length, missing.length), missingEvidence: missing, evidence: [{ type: 'partner', reference: bundle.partner.id, statement: `Partner status is ${bundle.partner.status}.`, classification: 'verified_fact' }, ...openIssues.slice(0, 5).map((row: any) => ({ type: 'partner_issue', reference: row.id, statement: row.title || row.category, classification: 'verified_fact' }))], ownerId: bundle.partner.operational_owner_id || actor.id })
  return { partner: bundle.partner, latestHealth, openIssues, recommendation }
}

async function reviewRenewal(db: any, actor: any, access: any, payload: any) {
  const bundle = await loadPartnerBundle(db, actor, access, payload)
  const renewal = payload.renewalId ? bundle.renewals.find((row: any) => row.id === payload.renewalId) : bundle.renewals[0]
  if (!renewal) throw fail('RENEWAL_REQUIRED', 404)
  const remaining = daysUntil(renewal.contract_end_at)
  const risk = remaining <= 30 && !['renewed','approved'].includes(String(renewal.status || '').toLowerCase()) ? 'critical' : remaining <= 90 ? 'high' : 'medium'
  const recommendation = await persistRecommendation(db, actor, { subjectType: 'renewal', subjectId: renewal.id, prospectId: bundle.partner.prospect_id, partnerId: bundle.partner.id, recommendationType: 'renewal_review', finding: `${remaining} days remain before contract expiry; renewal status is ${renewal.status}.`, commercialSignificance: 'Delayed renewal exposes recurring revenue and partner continuity.', recommendedAction: remaining <= 60 ? 'Prepare and approve the renewal proposal immediately.' : 'Complete stakeholder and performance review.', expectedOutcome: 'Controlled renewal decision before expiry.', revenueImpact: num(bundle.performance[0]?.contracted_revenue), riskLevel: risk, confidence: .88, missingEvidence: [], evidence: [{ type: 'renewal', reference: renewal.id, statement: `Contract end date ${renewal.contract_end_at}.`, classification: 'verified_fact' }], ownerId: renewal.owner_id || actor.id, deadline: renewal.contract_end_at })
  return { partner: bundle.partner, renewal, remainingDays: remaining, recommendation }
}

async function recommendationDecision(db: any, actor: any, access: any, payload: any, status: 'accepted' | 'rejected') {
  const id = text(payload.recommendationId, 100)
  if (!id) throw fail('RECOMMENDATION_REQUIRED')
  if (status === 'accepted' && !actorCanApprove(actor, access, 'extension.b2b.manager_control')) throw fail('MANAGER_APPROVAL_REQUIRED', 403)
  const row = await updateOne(db, 'browser_extension_b2b_ai_recommendations', id, { status, disposition_reason: text(payload.reason), disposed_by: actor.id, disposed_at: now(), truth_classification: status === 'accepted' ? 'approved_management_decision' : 'ai_recommendation' }, 'RECOMMENDATION_DECISION_FAILED')
  return { recommendation: row }
}

async function pipelineTruthAssess(db: any, actor: any, access: any, payload: any) {
  const bundle = await loadOpportunityBundle(db, actor, access, payload)
  const assessment = assessOpportunity(bundle)
  const row = await insertOne(db, 'browser_extension_b2b_pipeline_truth_assessments', { opportunity_id: bundle.opportunity.id, prospect_id: bundle.account.id, reported_stage: assessment.reportedStage, recommended_stage: assessment.recommendedStage, stage_valid: assessment.stageValid, forecast_category: assessment.category, confidence: assessment.confidence, evidence: assessment.evidence, missing_evidence: assessment.missing, stale_days: assessment.staleDays, assessed_by: actor.id, ruleset_version: 'mega6-v1' }, 'PIPELINE_TRUTH_ASSESS_FAILED')
  return { assessment: row, details: assessment, opportunity: bundle.opportunity }
}

async function applyPipelineCorrection(db: any, actor: any, access: any, payload: any) {
  if (!actorCanApprove(actor, access, 'extension.b2b.manager_control')) throw fail('PIPELINE_CORRECTION_APPROVAL_REQUIRED', 403)
  const assessmentId = text(payload.assessmentId, 100)
  const assessment = assessmentId ? await maybe(db, 'browser_extension_b2b_pipeline_truth_assessments', (q) => q.eq('id', assessmentId).maybeSingle()) : null
  if (!assessment) throw fail('PIPELINE_ASSESSMENT_REQUIRED', 404)
  const opportunity = await updateOne(db, 'browser_extension_b2b_opportunities', assessment.opportunity_id, { stage: payload.stage || assessment.recommended_stage, stage_updated_by: actor.id, stage_updated_at: now() }, 'PIPELINE_CORRECTION_FAILED')
  await updateOne(db, 'browser_extension_b2b_pipeline_truth_assessments', assessment.id, { correction_applied: true, correction_applied_by: actor.id, correction_applied_at: now() }, 'PIPELINE_ASSESSMENT_UPDATE_FAILED')
  return { opportunity, assessment }
}

async function forecastCalculate(db: any, actor: any, access: any, payload: any, persist = true) {
  const opportunities = await many(db, 'browser_extension_b2b_opportunities', (q) => q.order('updated_at', { ascending: false }).limit(Math.min(1000, num(payload.limit, 500))))
  const accountIds = unique(opportunities.map((row: any) => row.prospect_id).filter(Boolean))
  const accounts = accountIds.length ? await many(db, 'b2b_prospects', (q) => q.in('id', accountIds).limit(1000)) : []
  const allowed = new Set(filterByOwnership(accounts, actor.id, scopeRecord(access)).map((row: any) => row.id))
  const scoped = opportunities.filter((row: any) => allowed.has(row.prospect_id))
  const latestAssessments = await many(db, 'browser_extension_b2b_pipeline_truth_assessments', (q) => q.in('opportunity_id', scoped.map((row: any) => row.id)).order('created_at', { ascending: false }).limit(2000))
  const byOpportunity = new Map<string, any>(); for (const row of latestAssessments) if (!byOpportunity.has(row.opportunity_id)) byOpportunity.set(row.opportunity_id, row)
  const weights: Record<ForecastCategory, number> = { committed: 1, probable: .7, possible: .4, at_risk: .2, unqualified: .05, stale: 0 }
  const categories: Record<string, { count: number; value: number; weighted: number }> = {}
  const items: Array<{ opportunityId: string; prospectId: string | null; stage: unknown; category: ForecastCategory; value: number; weighted: number; confidence: number; expectedClose: unknown }> = scoped.map((row: any) => { const assessment = byOpportunity.get(row.id); let category: ForecastCategory = assessment?.forecast_category || (daysSince(row.updated_at) > 30 ? 'stale' : ['won','payment_pending'].includes(String(row.stage || '').toLowerCase()) ? 'committed' : ['commercial_agreement','contract_pending','negotiation'].includes(String(row.stage || '').toLowerCase()) ? 'probable' : ['research','new_target'].includes(String(row.stage || '').toLowerCase()) ? 'unqualified' : 'possible'); const value = num(row.estimated_value || row.estimated_annual_value); const weighted = value * weights[category]; categories[category] ||= { count: 0, value: 0, weighted: 0 }; categories[category].count++; categories[category].value += value; categories[category].weighted += weighted; return { opportunityId: row.id, prospectId: row.prospect_id, stage: row.stage, category, value, weighted, confidence: num(assessment?.confidence, category === 'committed' ? .9 : .55), expectedClose: row.expected_close_at || row.expected_close_date || null } })
  const totalValue = items.reduce((sum: number, row) => sum + row.value, 0); const weightedValue = items.reduce((sum: number, row) => sum + row.weighted, 0)
  const snapshotPayload = { categories, items, totalValue, weightedValue, count: items.length, generatedAt: now() }
  if (!persist) return snapshotPayload
  const snapshot = await insertOne(db, 'browser_extension_b2b_forecast_snapshots', { scope_type: 'authorized_user_scope', scope_reference: actor.id, forecast_period_start: payload.periodStart || new Date().toISOString().slice(0, 10), forecast_period_end: payload.periodEnd || new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10), total_pipeline_value: totalValue, weighted_forecast_value: weightedValue, committed_value: categories.committed?.value || 0, probable_value: categories.probable?.value || 0, possible_value: categories.possible?.value || 0, at_risk_value: categories.at_risk?.value || 0, stale_value: categories.stale?.value || 0, confidence: items.length ? items.reduce((sum: number, row) => sum + row.confidence, 0) / items.length : 0, evidence: { categories, itemCount: items.length }, missing_data: items.filter((row) => row.confidence < .5).map((row) => row.opportunityId), generated_by: actor.id, status: 'generated', ruleset_version: 'mega6-v1' }, 'FORECAST_SNAPSHOT_FAILED')
  return { snapshot, ...snapshotPayload }
}

async function revenueRiskDetect(db: any, actor: any, access: any, payload: any) {
  const forecast = await forecastCalculate(db, actor, access, payload, false)
  const existing = await many(db, 'browser_extension_b2b_revenue_risks', (q) => q.in('status', ['open','assigned','escalated']).limit(1000))
  const existingKeys = new Set(existing.map((row: any) => `${row.risk_type}:${row.subject_id}`))
  const created: any[] = []
  for (const item of forecast.items.filter((row: any) => ['at_risk','stale'].includes(row.category)).slice(0, 100)) {
    const riskType = item.category === 'stale' ? 'forgotten_opportunity' : 'pipeline_truth_risk'; const key = `${riskType}:${item.opportunityId}`; if (existingKeys.has(key)) continue
    created.push(await insertOne(db, 'browser_extension_b2b_revenue_risks', { queue_key: riskType, risk_type: riskType, subject_type: 'opportunity', subject_id: item.opportunityId, prospect_id: item.prospectId, opportunity_id: item.opportunityId, reason: item.category === 'stale' ? 'Opportunity has no sufficiently recent evidence.' : 'Opportunity forecast is at risk based on evidence quality.', revenue_at_risk: item.value, deadline: new Date(Date.now() + 2 * 86400000).toISOString(), owner_id: actor.id, recommended_action: item.category === 'stale' ? 'Create a dated recovery action or close truthfully.' : 'Correct missing decision, proposal or next-action evidence.', escalation_path: 'manager_to_executive', evidence: { category: item.category, confidence: item.confidence }, status: 'open', detected_by: actor.id }, 'REVENUE_RISK_CREATE_FAILED'))
  }
  return { created, existing, summary: { detected: created.length, open: existing.length + created.length, revenueAtRisk: [...existing, ...created].reduce((sum, row) => sum + num(row.revenue_at_risk), 0) } }
}

async function createRisk(db: any, actor: any, payload: any, riskType: string) {
  const row = await insertOne(db, 'browser_extension_b2b_revenue_risks', { queue_key: riskType, risk_type: riskType, subject_type: payload.subjectType || (payload.partnerId ? 'partner' : payload.opportunityId ? 'opportunity' : 'account'), subject_id: payload.subjectId || payload.partnerId || payload.opportunityId || payload.prospectId, prospect_id: payload.prospectId || null, opportunity_id: payload.opportunityId || null, partner_id: payload.partnerId || null, renewal_id: payload.renewalId || null, reason: text(payload.reason) || `${riskType} requires intervention.`, revenue_at_risk: num(payload.revenueAtRisk), deadline: payload.deadline || new Date(Date.now() + 2 * 86400000).toISOString(), owner_id: payload.ownerId || actor.id, recommended_action: text(payload.recommendedAction) || 'Review evidence and execute a recovery action.', escalation_path: text(payload.escalationPath) || 'manager', evidence: safeJson(payload.evidence), status: 'open', detected_by: actor.id }, 'REVENUE_RISK_CREATE_FAILED')
  return { risk: row }
}

async function managementAction(db: any, actor: any, access: any, commandKey: string, payload: any) {
  if (['b2b.management.account_reassign','b2b.management.opportunity_reassign','b2b.management.action_freeze','b2b.management.intervention_close'].includes(commandKey) && !actorCanApprove(actor, access, 'extension.b2b.manager_control')) throw fail('MANAGER_APPROVAL_REQUIRED', 403)
  if (commandKey === 'b2b.management.account_reassign') return { account: await updateOne(db, 'b2b_prospects', text(payload.prospectId, 100)!, { owner_id: payload.ownerId, reassigned_by: actor.id }, 'ACCOUNT_REASSIGN_FAILED') }
  if (commandKey === 'b2b.management.opportunity_reassign') return { opportunity: await updateOne(db, 'browser_extension_b2b_opportunities', text(payload.opportunityId, 100)!, { owner_id: payload.ownerId, reassigned_by: actor.id }, 'OPPORTUNITY_REASSIGN_FAILED') }
  if (commandKey === 'b2b.management.priority_assign') {
    const targetType = payload.targetType || (payload.opportunityId ? 'opportunity' : 'prospect'); const table = targetType === 'opportunity' ? 'browser_extension_b2b_opportunities' : 'b2b_prospects'; const id = payload.targetId || payload.opportunityId || payload.prospectId
    return { target: await updateOne(db, table, id, { priority: payload.priority || 'high', priority_reason: text(payload.reason), priority_assigned_by: actor.id }, 'PRIORITY_ASSIGN_FAILED') }
  }
  if (commandKey === 'b2b.management.correction_request') return { intervention: await insertOne(db, 'browser_extension_b2b_management_interventions', { intervention_type: 'correction_request', subject_type: payload.subjectType || 'opportunity', subject_id: payload.subjectId || payload.opportunityId || payload.prospectId, prospect_id: payload.prospectId || null, opportunity_id: payload.opportunityId || null, partner_id: payload.partnerId || null, title: text(payload.title) || 'Correction required', blocker: text(payload.reason), recommended_intervention: text(payload.requiredCorrection), required_outcome: text(payload.expectedOutcome), prohibited_commitments: [], revenue_at_risk: num(payload.revenueAtRisk), owner_id: payload.ownerId || actor.id, executive_owner_id: payload.executiveOwnerId || null, deadline: payload.deadline || new Date(Date.now() + 2 * 86400000).toISOString(), status: 'open', created_by: actor.id }, 'CORRECTION_REQUEST_FAILED') }
  if (commandKey === 'b2b.management.action_freeze') return { intervention: await insertOne(db, 'browser_extension_b2b_management_interventions', { intervention_type: 'action_freeze', subject_type: payload.subjectType || 'command', subject_id: payload.subjectId || payload.commandId, title: text(payload.title) || 'Risky action frozen', blocker: text(payload.reason), recommended_intervention: text(payload.recommendedAction), required_outcome: 'Manager review before release.', prohibited_commitments: list(payload.prohibitedCommitments), revenue_at_risk: num(payload.revenueAtRisk), owner_id: payload.ownerId || actor.id, executive_owner_id: payload.executiveOwnerId || actor.id, deadline: payload.deadline || null, status: 'frozen', created_by: actor.id }, 'ACTION_FREEZE_FAILED') }
  if (commandKey === 'b2b.management.intervention_create') return { intervention: await insertOne(db, 'browser_extension_b2b_management_interventions', { intervention_type: payload.interventionType || 'executive_intervention', subject_type: payload.subjectType || 'opportunity', subject_id: payload.subjectId || payload.opportunityId || payload.partnerId, prospect_id: payload.prospectId || null, opportunity_id: payload.opportunityId || null, partner_id: payload.partnerId || null, renewal_id: payload.renewalId || null, title: text(payload.title) || 'Executive intervention', blocker: text(payload.blocker), recommended_intervention: text(payload.recommendedIntervention), required_outcome: text(payload.requiredOutcome), prohibited_commitments: list(payload.prohibitedCommitments), revenue_at_risk: num(payload.revenueAtRisk), owner_id: payload.ownerId || actor.id, executive_owner_id: payload.executiveOwnerId || null, deadline: payload.deadline || null, status: 'open', created_by: actor.id }, 'INTERVENTION_CREATE_FAILED') }
  if (commandKey === 'b2b.management.intervention_close') return { intervention: await updateOne(db, 'browser_extension_b2b_management_interventions', payload.interventionId, { status: 'closed', outcome: text(payload.outcome), closed_by: actor.id, closed_at: now() }, 'INTERVENTION_CLOSE_FAILED') }
  throw fail('UNSUPPORTED_MANAGEMENT_ACTION')
}

async function executionQualityAssess(db: any, actor: any, access: any, payload: any) {
  const staffId = text(payload.staffUserId, 100) || actor.id
  const rangeStart = payload.periodStart || new Date(Date.now() - 30 * 86400000).toISOString()
  const [actions, followups, meetings, proposals, discounts, handoffs, renewals] = await Promise.all([
    many(db, 'browser_extension_b2b_next_actions', (q) => q.eq('owner_id', staffId).gte('created_at', rangeStart).limit(1000)),
    many(db, 'browser_extension_b2b_followups', (q) => q.eq('owner_id', staffId).gte('created_at', rangeStart).limit(1000)),
    many(db, 'browser_extension_b2b_meeting_outcomes', (q) => q.eq('created_by', staffId).gte('created_at', rangeStart).limit(500)),
    many(db, 'browser_extension_b2b_proposals', (q) => q.eq('created_by', staffId).gte('created_at', rangeStart).limit(500)),
    many(db, 'browser_extension_b2b_discount_requests', (q) => q.eq('created_by', staffId).gte('created_at', rangeStart).limit(500)),
    many(db, 'browser_extension_b2b_handoffs', (q) => q.eq('sales_owner_id', staffId).gte('created_at', rangeStart).limit(500)),
    many(db, 'browser_extension_b2b_renewals', (q) => q.eq('owner_id', staffId).gte('created_at', rangeStart).limit(500)),
  ])
  const completedActions = actions.filter((row: any) => ['completed','done'].includes(String(row.status || '').toLowerCase())).length
  const overdueActions = actions.filter((row: any) => !['completed','done','cancelled'].includes(String(row.status || '').toLowerCase()) && Date.parse(row.due_at || '') < Date.now()).length
  const completedFollowups = followups.filter((row: any) => ['completed','done'].includes(String(row.status || '').toLowerCase())).length
  const dimensions = {
    followup_discipline: followups.length ? Math.round(100 * completedFollowups / followups.length) : null,
    action_discipline: actions.length ? Math.round(100 * completedActions / actions.length) : null,
    meeting_preparation: meetings.length ? Math.min(100, 55 + meetings.filter((row: any) => row.confirmed_needs || row.summary).length * 5) : null,
    proposal_follow_through: proposals.length ? Math.min(100, 50 + proposals.filter((row: any) => row.status && row.status !== 'draft').length * 8) : null,
    pricing_discipline: discounts.length ? Math.max(20, 100 - discounts.length * 8) : 100,
    handoff_quality: handoffs.length ? Math.round(handoffs.reduce((sum: number, row: any) => sum + num(row.readiness_score), 0) / handoffs.length) : null,
    renewal_discipline: renewals.length ? Math.round(renewals.reduce((sum: number, row: any) => sum + num(row.readiness_score), 0) / renewals.length) : null,
    data_completeness: Math.max(0, 100 - overdueActions * 5),
  }
  const scored = Object.values(dimensions).filter((value): value is number => typeof value === 'number')
  const overall = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : 0
  const missing = Object.entries(dimensions).filter(([, value]) => value == null).map(([key]) => key)
  const assessment = await insertOne(db, 'browser_extension_b2b_execution_quality_assessments', { staff_user_id: staffId, period_start: rangeStart, period_end: payload.periodEnd || now(), overall_score: overall, dimensions, missing_data: missing, evidence_summary: { actions: actions.length, overdueActions, followups: followups.length, meetings: meetings.length, proposals: proposals.length, discounts: discounts.length, handoffs: handoffs.length, renewals: renewals.length }, explanation: overall >= 80 ? 'Disciplined execution with limited corrective needs.' : overall >= 60 ? 'Mixed execution: targeted coaching is recommended.' : 'Material execution gaps require manager intervention.', assessed_by: actor.id, ruleset_version: 'mega6-v1' }, 'EXECUTION_QUALITY_ASSESS_FAILED')
  return { assessment, dimensions, missing }
}

async function detectPatterns(db: any, actor: any, payload: any) {
  const assessment = await maybe(db, 'browser_extension_b2b_execution_quality_assessments', (q) => q.eq('id', payload.assessmentId).maybeSingle())
  if (!assessment) throw fail('EXECUTION_QUALITY_ASSESSMENT_REQUIRED', 404)
  const dims = safeJson(assessment.dimensions)
  const patterns: Array<{ key: string; title: string; evidence: string; expected: string; severity: string }> = []
  if (num(dims.followup_discipline, 100) < 70) patterns.push({ key: 'weak_followup', title: 'Follow-up discipline requires correction', evidence: `Follow-up score ${dims.followup_discipline}.`, expected: 'Every commitment has an owner, deadline and documented result.', severity: 'high' })
  if (num(dims.meeting_preparation, 100) < 70) patterns.push({ key: 'weak_meeting_preparation', title: 'Meeting preparation is incomplete', evidence: `Meeting preparation score ${dims.meeting_preparation}.`, expected: 'Every meeting has objective, stakeholders, questions and required commitment.', severity: 'medium' })
  if (num(dims.pricing_discipline, 100) < 75) patterns.push({ key: 'margin_concession', title: 'Pricing discipline exposes margin', evidence: `Pricing discipline score ${dims.pricing_discipline}.`, expected: 'Use scope, term and payment alternatives before discount.', severity: 'high' })
  if (num(dims.handoff_quality, 100) < 70) patterns.push({ key: 'weak_handoff', title: 'Commercial handoff quality is weak', evidence: `Handoff quality score ${dims.handoff_quality}.`, expected: 'Resolve promises, ownership, scope and launch requirements before acceptance.', severity: 'high' })
  if (!patterns.length) patterns.push({ key: 'strong_execution', title: 'Execution pattern is currently healthy', evidence: `Overall score ${assessment.overall_score}.`, expected: 'Maintain discipline and review after the next period.', severity: 'low' })
  const rows = []
  for (const p of patterns) rows.push(await insertOne(db, 'browser_extension_b2b_execution_quality_patterns', { assessment_id: assessment.id, staff_user_id: assessment.staff_user_id, pattern_key: p.key, title: p.title, evidence: { statement: p.evidence }, expected_behavior: p.expected, severity: p.severity, status: 'open', detected_by: actor.id }, 'EXECUTION_PATTERN_CREATE_FAILED'))
  return { assessment, patterns: rows }
}

async function coachingCommand(db: any, actor: any, access: any, commandKey: string, payload: any) {
  if (['b2b.coaching.review'].includes(commandKey) && !actorCanApprove(actor, access, 'extension.b2b.staff_execution_quality')) throw fail('COACHING_REVIEW_APPROVAL_REQUIRED', 403)
  if (commandKey === 'b2b.coaching.create') return { coaching: await insertOne(db, 'browser_extension_b2b_coaching_missions', { staff_user_id: payload.staffUserId, manager_id: payload.managerId || actor.id, pattern_id: payload.patternId || null, skill_gap: text(payload.skillGap), evidence: safeJson(payload.evidence), business_consequence: text(payload.businessConsequence), expected_behavior: text(payload.expectedBehavior), required_action: text(payload.requiredAction), subject_type: payload.subjectType || null, subject_id: payload.subjectId || null, start_at: payload.startAt || now(), due_at: payload.dueAt, status: 'created', completion_proof: {}, commercial_outcome: {}, created_by: actor.id }, 'COACHING_CREATE_FAILED') }
  if (commandKey === 'b2b.coaching.assign') return { coaching: await updateOne(db, 'browser_extension_b2b_coaching_missions', payload.coachingId, { staff_user_id: payload.staffUserId, manager_id: payload.managerId || actor.id, status: 'assigned', assigned_at: now() }, 'COACHING_ASSIGN_FAILED') }
  if (commandKey === 'b2b.coaching.complete') return { coaching: await updateOne(db, 'browser_extension_b2b_coaching_missions', payload.coachingId, { status: 'completion_submitted', completion_proof: safeJson(payload.completionProof), completed_by: actor.id, completed_at: now() }, 'COACHING_COMPLETE_FAILED') }
  if (commandKey === 'b2b.coaching.review') return { coaching: await updateOne(db, 'browser_extension_b2b_coaching_missions', payload.coachingId, { status: payload.approved === false ? 'changes_requested' : 'reviewed', review_result: text(payload.reviewResult), reviewed_by: actor.id, reviewed_at: now() }, 'COACHING_REVIEW_FAILED') }
  if (commandKey === 'b2b.coaching.outcome_record') return { coaching: await updateOne(db, 'browser_extension_b2b_coaching_missions', payload.coachingId, { commercial_outcome: safeJson(payload.commercialOutcome), followup_at: payload.followupAt || null, status: 'outcome_recorded' }, 'COACHING_OUTCOME_FAILED') }
  throw fail('UNSUPPORTED_COACHING_COMMAND')
}

async function territoryCalculate(db: any, actor: any, access: any, payload: any) {
  const accounts = await many(db, 'b2b_prospects', (q) => q.limit(5000))
  const scoped = filterByOwnership(accounts, actor.id, scopeRecord(access))
  const allowedTerritories = safeJson(scopeRecord(access).territories, {}).values || []
  const filtered = allowedTerritories.length ? scoped.filter((row: any) => allowedTerritories.includes(row.city || row.territory)) : scoped
  const opportunities = filtered.length ? await many(db, 'browser_extension_b2b_opportunities', (q) => q.in('prospect_id', filtered.map((row: any) => row.id)).limit(5000)) : []
  const byCity: Record<string, any> = {}; const byVertical: Record<string, any> = {}
  for (const account of filtered) { const city = account.city || account.territory || 'Unknown'; const vertical = account.vertical || account.sector || 'Unknown'; byCity[city] ||= { accounts: 0, opportunities: 0, pipeline: 0, won: 0 }; byVertical[vertical] ||= { accounts: 0, opportunities: 0, pipeline: 0, won: 0 }; byCity[city].accounts++; byVertical[vertical].accounts++ }
  for (const opp of opportunities) { const account = filtered.find((row: any) => row.id === opp.prospect_id); if (!account) continue; const city = account.city || account.territory || 'Unknown'; const vertical = account.vertical || account.sector || 'Unknown'; const value = num(opp.estimated_value || opp.estimated_annual_value); byCity[city].opportunities++; byCity[city].pipeline += value; byVertical[vertical].opportunities++; byVertical[vertical].pipeline += value; if (String(opp.stage).toLowerCase() === 'won') { byCity[city].won++; byVertical[vertical].won++ } }
  const snapshot = await insertOne(db, 'browser_extension_b2b_territory_intelligence_snapshots', { scope_owner_id: actor.id, territory_scope: allowedTerritories, vertical_scope: safeJson(scopeRecord(access).verticals, {}).values || [], by_city: byCity, by_vertical: byVertical, account_count: filtered.length, opportunity_count: opportunities.length, pipeline_value: opportunities.reduce((sum: number, row: any) => sum + num(row.estimated_value || row.estimated_annual_value), 0), missing_data: filtered.filter((row: any) => !row.city || !(row.vertical || row.sector)).map((row: any) => row.id), calculated_by: actor.id, ruleset_version: 'mega6-v1' }, 'TERRITORY_INTELLIGENCE_FAILED')
  return { snapshot, byCity, byVertical }
}

async function territoryRead(db: any, actor: any, type: 'territory' | 'vertical') {
  const rows = await many(db, 'browser_extension_b2b_territory_intelligence_snapshots', (q) => q.eq('scope_owner_id', actor.id).order('created_at', { ascending: false }).limit(20))
  return { snapshots: rows, latest: rows[0] || null, lens: type }
}

async function generateReport(db: any, actor: any, access: any, commandKey: string, payload: any) {
  const reportType = commandKey.replace('b2b.report.', '').replace('_generate', '')
  const forecast = ['daily_revenue','weekly_commercial','pipeline_truth','margin_protection'].includes(reportType) ? await forecastCalculate(db, actor, access, payload, false) : null
  const risks = await many(db, 'browser_extension_b2b_revenue_risks', (q) => q.in('status', ['open','assigned','escalated']).order('created_at', { ascending: false }).limit(500))
  const interventions = await many(db, 'browser_extension_b2b_management_interventions', (q) => q.in('status', ['open','frozen']).order('created_at', { ascending: false }).limit(200))
  const coaching = reportType === 'staff_execution' ? await many(db, 'browser_extension_b2b_coaching_missions', (q) => q.order('created_at', { ascending: false }).limit(300)) : []
  const automation = reportType === 'automation' ? await many(db, 'browser_extension_b2b_automation_runs', (q) => q.order('created_at', { ascending: false }).limit(300)) : []
  const territory = reportType === 'territory' ? await territoryRead(db, actor, 'territory') : null
  const payloadData = { reportType, generatedAt: now(), forecast, risks, interventions, coaching, automation, territory, missingData: [] as string[] }
  if (forecast && !forecast.items.length) payloadData.missingData.push('pipeline_data')
  const report = await insertOne(db, 'browser_extension_b2b_executive_reports', { report_type: reportType, title: payload.title || reportType.replaceAll('_', ' '), period_start: payload.periodStart || null, period_end: payload.periodEnd || null, scope_owner_id: actor.id, report_payload: payloadData, missing_data: payloadData.missingData, status: 'generated', version_number: 1, generated_by: actor.id, evidence_count: (forecast?.items?.length || 0) + risks.length + interventions.length, export_format: payload.exportFormat || 'workspace' }, 'EXECUTIVE_REPORT_FAILED')
  return { report, payload: payloadData }
}

async function automationCommand(db: any, actor: any, access: any, commandKey: string, payload: any) {
  if (['b2b.automation.enable','b2b.automation.approval_decide','b2b.automation.kill'].includes(commandKey) && !actorCanApprove(actor, access, 'extension.b2b.controlled_automation')) throw fail('AUTOMATION_APPROVAL_REQUIRED', 403)
  if (commandKey === 'b2b.automation.create') {
    const type = text(payload.automationType, 100)
    if (!type || !B2B_SAFE_AUTOMATION_TYPES.has(type)) throw fail('UNSAFE_AUTOMATION_TYPE_BLOCKED', 403, { allowed: [...B2B_SAFE_AUTOMATION_TYPES] })
    if (B2B_HIGH_RISK_ACTIONS.has(String(payload.targetAction || ''))) throw fail('HIGH_RISK_ACTION_REQUIRES_HUMAN', 403)
    return { automation: await insertOne(db, 'browser_extension_b2b_automation_definitions', { name: text(payload.name) || type, automation_type: type, trigger_type: payload.triggerType || 'manual', trigger_config: safeJson(payload.triggerConfig), conditions: list(payload.conditions), data_scope: safeJson(payload.dataScope), territory_scope: safeJson(payload.territoryScope), account_scope: safeJson(payload.accountScope), autonomy_mode: payload.autonomyMode || 'SUGGEST_ONLY', approval_rule: safeJson(payload.approvalRule), max_frequency_minutes: Math.max(60, num(payload.maxFrequencyMinutes, 60)), deduplication_policy: payload.deduplicationPolicy || 'subject_and_window', execution_window: safeJson(payload.executionWindow), stop_conditions: list(payload.stopConditions), status: 'disabled', owner_id: payload.ownerId || actor.id, created_by: actor.id, version_number: 1 }, 'AUTOMATION_CREATE_FAILED') }
  }
  if (commandKey === 'b2b.automation.update') {
    const existing = await maybe(db, 'browser_extension_b2b_automation_definitions', (q) => q.eq('id', payload.automationId).maybeSingle()); if (!existing) throw fail('AUTOMATION_NOT_FOUND', 404)
    const nextType = payload.automationType || existing.automation_type; if (!B2B_SAFE_AUTOMATION_TYPES.has(nextType)) throw fail('UNSAFE_AUTOMATION_TYPE_BLOCKED', 403)
    return { automation: await updateOne(db, 'browser_extension_b2b_automation_definitions', existing.id, { name: text(payload.name) || existing.name, automation_type: nextType, trigger_config: payload.triggerConfig ? safeJson(payload.triggerConfig) : existing.trigger_config, conditions: payload.conditions ? list(payload.conditions) : existing.conditions, autonomy_mode: payload.autonomyMode || existing.autonomy_mode, max_frequency_minutes: payload.maxFrequencyMinutes ? Math.max(60, num(payload.maxFrequencyMinutes)) : existing.max_frequency_minutes, version_number: num(existing.version_number, 1) + 1, updated_by: actor.id }, 'AUTOMATION_UPDATE_FAILED') }
  }
  if (commandKey === 'b2b.automation.enable') return { automation: await updateOne(db, 'browser_extension_b2b_automation_definitions', payload.automationId, { status: 'enabled', enabled_by: actor.id, enabled_at: now() }, 'AUTOMATION_ENABLE_FAILED') }
  if (commandKey === 'b2b.automation.pause') return { automation: await updateOne(db, 'browser_extension_b2b_automation_definitions', payload.automationId, { status: 'paused', pause_reason: text(payload.reason), paused_by: actor.id, paused_at: now() }, 'AUTOMATION_PAUSE_FAILED') }
  if (commandKey === 'b2b.automation.approval_request') return { approval: await insertOne(db, 'browser_extension_b2b_automation_approvals', { automation_id: payload.automationId, requested_action: payload.requestedAction || 'enable', requested_payload: safeJson(payload.requestedPayload), reason: text(payload.reason), status: 'pending', requested_by: actor.id, approver_role: payload.approverRole || 'manager' }, 'AUTOMATION_APPROVAL_REQUEST_FAILED') }
  if (commandKey === 'b2b.automation.approval_decide') return { approval: await updateOne(db, 'browser_extension_b2b_automation_approvals', payload.approvalId, { status: payload.approved === false ? 'rejected' : 'approved', decision_reason: text(payload.reason), decided_by: actor.id, decided_at: now() }, 'AUTOMATION_APPROVAL_DECIDE_FAILED') }
  if (commandKey === 'b2b.automation.kill') {
    const kill = await insertOne(db, 'browser_extension_b2b_automation_kill_switches', { automation_id: payload.automationId || null, scope_type: payload.scopeType || (payload.automationId ? 'automation' : 'module'), scope_reference: payload.scopeReference || payload.automationId || 'revenue_b2b', reason: text(payload.reason) || 'Emergency stop', active: true, activated_by: actor.id, activated_at: now() }, 'AUTOMATION_KILL_SWITCH_FAILED')
    if (payload.automationId) await updateOne(db, 'browser_extension_b2b_automation_definitions', payload.automationId, { status: 'suspended', suspended_by: actor.id, suspended_at: now(), suspension_reason: text(payload.reason) }, 'AUTOMATION_SUSPEND_FAILED')
    return { killSwitch: kill }
  }
  if (commandKey === 'b2b.automation.audit_read') {
    const runs = await many(db, 'browser_extension_b2b_automation_runs', (q) => payload.automationId ? q.eq('automation_id', payload.automationId).order('created_at', { ascending: false }).limit(200) : q.order('created_at', { ascending: false }).limit(200))
    return { runs }
  }
  if (['b2b.automation.execute','b2b.automation.retry'].includes(commandKey)) {
    const automation = await maybe(db, 'browser_extension_b2b_automation_definitions', (q) => q.eq('id', payload.automationId).maybeSingle()); if (!automation) throw fail('AUTOMATION_NOT_FOUND', 404)
    if (!B2B_SAFE_AUTOMATION_TYPES.has(automation.automation_type)) throw fail('UNSAFE_AUTOMATION_TYPE_BLOCKED', 403)
    const kill = await maybe(db, 'browser_extension_b2b_automation_kill_switches', (q) => q.eq('active', true).or(`automation_id.eq.${automation.id},and(scope_type.eq.module,scope_reference.eq.revenue_b2b)`).limit(1).maybeSingle())
    if (kill) throw fail('AUTOMATION_KILL_SWITCH_ACTIVE', 423)
    if (!['enabled','safe_automation','suggest_only'].includes(String(automation.status || '').toLowerCase()) && commandKey !== 'b2b.automation.retry') throw fail('AUTOMATION_NOT_ENABLED', 409)
    const run = await insertOne(db, 'browser_extension_b2b_automation_runs', { automation_id: automation.id, trigger_type: payload.triggerType || 'manual', trigger_payload: safeJson(payload.triggerPayload), idempotency_key: payload.idempotencyKey || `${automation.id}:${payload.subjectId || 'manual'}:${new Date().toISOString().slice(0,13)}`, status: 'running', started_by: actor.id, started_at: now(), attempt_number: commandKey === 'b2b.automation.retry' ? num(payload.attemptNumber, 2) : 1 }, 'AUTOMATION_RUN_CREATE_FAILED')
    let result: any = { automationType: automation.automation_type, safe: true }
    try {
      if (automation.automation_type === 'risk_detection') result = await revenueRiskDetect(db, actor, access, payload.triggerPayload || {})
      else if (automation.automation_type === 'internal_report_generation') result = await generateReport(db, actor, access, 'b2b.report.daily_revenue_generate', payload.triggerPayload || {})
      else if (automation.automation_type === 'forecast_refresh') result = await forecastCalculate(db, actor, access, payload.triggerPayload || {}, true)
      else if (automation.automation_type === 'internal_task_creation') result = { task: await insertOne(db, 'browser_extension_b2b_next_actions', { prospect_id: payload.prospectId || null, opportunity_id: payload.opportunityId || null, title: text(payload.title) || 'Automation-created internal task', objective: text(payload.objective), owner_id: payload.ownerId || actor.id, due_at: payload.dueAt || new Date(Date.now() + 86400000).toISOString(), status: 'open', source: 'controlled_automation', created_by: actor.id }, 'AUTOMATION_TASK_CREATE_FAILED') }
      else result = { status: 'evaluated', message: 'Safe automation evaluated without external side effect.', payload: safeJson(payload.triggerPayload) }
      const completed = await updateOne(db, 'browser_extension_b2b_automation_runs', run.id, { status: 'completed', result_payload: result, completed_at: now() }, 'AUTOMATION_RUN_COMPLETE_FAILED')
      return { run: completed, result }
    } catch (error: any) {
      await updateOne(db, 'browser_extension_b2b_automation_runs', run.id, { status: 'failed', error_code: String(error?.message || 'AUTOMATION_FAILED'), error_details: safeJson(error?.details), completed_at: now() }, 'AUTOMATION_RUN_FAIL_RECORD_FAILED')
      throw error
    }
  }
  throw fail('UNSUPPORTED_AUTOMATION_COMMAND')
}

export async function executeB2BManagementCommand(input: { db: any; actor: any; device: any; access: any; commandKey: string; payload: any }) {
  const { db, actor, access, commandKey, payload } = input
  const definition = B2B_MANAGEMENT_COMMAND_MAP.get(commandKey)
  if (!definition) throw fail('UNSUPPORTED_MANAGEMENT_COMMAND')
  if (definition.highRisk && !actorCanApprove(actor, access, definition.capabilityPermission)) throw fail('HIGH_RISK_MANAGER_APPROVAL_REQUIRED', 403)
  switch (commandKey) {
    case 'b2b.ai_director.review_account': return reviewAccount(db, actor, access, payload)
    case 'b2b.ai_director.review_pipeline': return reviewPipeline(db, actor, access, payload)
    case 'b2b.ai_director.review_partner': return reviewPartner(db, actor, access, payload)
    case 'b2b.ai_director.review_renewal': return reviewRenewal(db, actor, access, payload)
    case 'b2b.ai_director.recommend_action': return reviewAccount(db, actor, access, payload)
    case 'b2b.ai_director.refresh_recommendation': {
      const current = await maybe(db, 'browser_extension_b2b_ai_recommendations', (q) => q.eq('id', payload.recommendationId).maybeSingle()); if (!current) throw fail('RECOMMENDATION_NOT_FOUND', 404)
      await updateOne(db, 'browser_extension_b2b_ai_recommendations', current.id, { status: 'superseded', superseded_at: now(), superseded_by: actor.id }, 'RECOMMENDATION_SUPERSEDE_FAILED')
      if (current.partner_id) return reviewPartner(db, actor, access, { partnerId: current.partner_id })
      return reviewAccount(db, actor, access, { prospectId: current.prospect_id, opportunityId: current.opportunity_id })
    }
    case 'b2b.ai_director.accept_recommendation': return recommendationDecision(db, actor, access, payload, 'accepted')
    case 'b2b.ai_director.reject_recommendation': return recommendationDecision(db, actor, access, payload, 'rejected')
    case 'b2b.pipeline_truth.assess':
    case 'b2b.pipeline_truth.stage_recommend': return pipelineTruthAssess(db, actor, access, payload)
    case 'b2b.pipeline_truth.correction_apply': return applyPipelineCorrection(db, actor, access, payload)
    case 'b2b.forecast.calculate':
    case 'b2b.forecast.snapshot_create': return forecastCalculate(db, actor, access, payload, true)
    case 'b2b.forecast.override_request': return { override: await insertOne(db, 'browser_extension_b2b_forecast_overrides', { forecast_snapshot_id: payload.forecastSnapshotId, opportunity_id: payload.opportunityId || null, requested_category: payload.requestedCategory, requested_value: payload.requestedValue == null ? null : num(payload.requestedValue), reason: text(payload.reason), evidence: safeJson(payload.evidence), status: 'pending', requested_by: actor.id }, 'FORECAST_OVERRIDE_REQUEST_FAILED') }
    case 'b2b.forecast.override_approve': {
      if (!actorCanApprove(actor, access, 'extension.b2b.manager_control')) throw fail('FORECAST_OVERRIDE_APPROVAL_REQUIRED', 403)
      return { override: await updateOne(db, 'browser_extension_b2b_forecast_overrides', payload.overrideId, { status: payload.approved === false ? 'rejected' : 'approved', decision_reason: text(payload.reason), decided_by: actor.id, decided_at: now() }, 'FORECAST_OVERRIDE_APPROVE_FAILED') }
    }
    case 'b2b.revenue_risk.detect': return revenueRiskDetect(db, actor, access, payload)
    case 'b2b.revenue_risk.assign': return { risk: await updateOne(db, 'browser_extension_b2b_revenue_risks', payload.riskId, { owner_id: payload.ownerId, status: 'assigned', assigned_by: actor.id, assigned_at: now() }, 'RISK_ASSIGN_FAILED') }
    case 'b2b.revenue_risk.escalate': return { risk: await updateOne(db, 'browser_extension_b2b_revenue_risks', payload.riskId, { status: 'escalated', escalation_path: text(payload.escalationPath) || 'executive', escalated_by: actor.id, escalated_at: now() }, 'RISK_ESCALATE_FAILED') }
    case 'b2b.revenue_risk.resolve': return { risk: await updateOne(db, 'browser_extension_b2b_revenue_risks', payload.riskId, { status: 'resolved', resolution: text(payload.resolution), resolved_by: actor.id, resolved_at: now() }, 'RISK_RESOLVE_FAILED') }
    case 'b2b.proposal_recovery.create': return createRisk(db, actor, payload, 'proposal_recovery')
    case 'b2b.payment_recovery.create': return createRisk(db, actor, payload, 'payment_recovery')
    case 'b2b.renewal_rescue.create': return createRisk(db, actor, payload, 'renewal_rescue')
    case 'b2b.partner_health_rescue.create': return createRisk(db, actor, payload, 'partner_health_rescue')
    case 'b2b.execution_quality.assess': return executionQualityAssess(db, actor, access, payload)
    case 'b2b.execution_quality.pattern_detect': return detectPatterns(db, actor, payload)
    case 'b2b.territory_intelligence.calculate': return territoryCalculate(db, actor, access, payload)
    case 'b2b.territory_intelligence.coverage_read': return territoryRead(db, actor, 'territory')
    case 'b2b.territory_intelligence.gap_detect': {
      const calculated = await territoryCalculate(db, actor, access, payload); const gaps = Object.entries(calculated.byCity).filter(([, value]: any) => value.accounts < num(payload.minimumAccounts, 5) || value.opportunities === 0).map(([city, value]) => ({ city, ...value, reason: value.opportunities === 0 ? 'No active opportunity' : 'Account coverage below threshold' }))
      return { ...calculated, gaps }
    }
    case 'b2b.vertical_intelligence.performance_read': return territoryRead(db, actor, 'vertical')
    default:
      if (commandKey.startsWith('b2b.management.')) return managementAction(db, actor, access, commandKey, payload)
      if (commandKey.startsWith('b2b.coaching.')) return coachingCommand(db, actor, access, commandKey, payload)
      if (commandKey.startsWith('b2b.report.')) return generateReport(db, actor, access, commandKey, payload)
      if (commandKey.startsWith('b2b.automation.')) return automationCommand(db, actor, access, commandKey, payload)
      throw fail('UNSUPPORTED_MANAGEMENT_COMMAND')
  }
}

import { filterByOwnership } from '../b2b-intelligence/scope'

type QueryResult<T = any> = { data: T; error: any }

function scopeRecord(access: any) {
  return Object.fromEntries((access?.scopes || []).map((row: any) => [row.scope_key, row.scope_value])) as Record<string, unknown>
}

async function safeMany(db: any, table: string, configure: (query: any) => any, diagnostics: Record<string, string>) {
  try {
    const result: QueryResult<any[]> = await configure(db.from(table).select('*'))
    if (result.error) {
      diagnostics[table] = String(result.error.message || result.error)
      return []
    }
    return result.data || []
  } catch (error: any) {
    diagnostics[table] = String(error?.message || error)
    return []
  }
}

async function safeOne(db: any, table: string, configure: (query: any) => any, diagnostics: Record<string, string>) {
  try {
    const result: QueryResult<any> = await configure(db.from(table).select('*'))
    if (result.error) {
      diagnostics[table] = String(result.error.message || result.error)
      return null
    }
    return result.data || null
  } catch (error: any) {
    diagnostics[table] = String(error?.message || error)
    return null
  }
}

function latest<T extends Record<string, any>>(rows: T[], fields = ['updated_at', 'created_at']) {
  return [...rows].sort((a, b) => {
    const aTime = fields.map((field) => Date.parse(String(a[field] || ''))).find(Number.isFinite) || 0
    const bTime = fields.map((field) => Date.parse(String(b[field] || ''))).find(Number.isFinite) || 0
    return bTime - aTime
  })[0] || null
}

function calculateDataQuality(account: any, committee: any[], contacts: any[]) {
  const checks = [
    ['website', account?.website],
    ['sector', account?.sector],
    ['city', account?.city],
    ['address', account?.address],
    ['phone', account?.phone],
    ['email', account?.email],
    ['owner', account?.assigned_owner_id],
    ['contact', contacts.length > 0],
    ['economic_buyer', committee.some((row) => row.role_key === 'economic_buyer' && row.status !== 'missing')],
    ['financial_approver', committee.some((row) => row.role_key === 'financial_approver' && row.status !== 'missing')],
  ] as Array<[string, unknown]>
  const completed = checks.filter(([, value]) => Boolean(value)).length
  return {
    score: Math.round((completed / checks.length) * 100),
    completed,
    total: checks.length,
    missing: checks.filter(([, value]) => !value).map(([key]) => key),
  }
}

function calculateCommercialHealth(opportunity: any, nextActions: any[], followups: any[], closingReadiness: any, paymentPromises: any[]) {
  let score = 100
  const reasons: string[] = []
  const now = Date.now()
  if (!opportunity) {
    score -= 35
    reasons.push('No active opportunity')
  }
  if (opportunity && !opportunity.next_action) {
    score -= 15
    reasons.push('No next action')
  }
  if (opportunity?.next_action_due_at && Date.parse(opportunity.next_action_due_at) < now) {
    score -= 18
    reasons.push('Next action overdue')
  }
  if (followups.some((row) => row.status === 'open' && Date.parse(row.due_at) < now)) {
    score -= 12
    reasons.push('Overdue follow-up')
  }
  if (nextActions.some((row) => row.status === 'open' && row.priority === 'critical')) {
    score -= 10
    reasons.push('Critical action open')
  }
  if (paymentPromises.some((row) => row.status === 'promised' && Date.parse(row.promised_at) < now)) {
    score -= 20
    reasons.push('Payment promise missed')
  }
  if (closingReadiness?.readiness_score != null && Number(closingReadiness.readiness_score) < 70) {
    score -= 8
    reasons.push('Closing readiness incomplete')
  }
  score = Math.max(0, Math.min(100, score))
  return {
    score,
    level: score >= 80 ? 'healthy' : score >= 60 ? 'watch' : score >= 35 ? 'at_risk' : 'critical',
    reasons,
  }
}

export async function hydrateB2BWorkspace(input: {
  db: any
  actor: any
  access: any
  prospectId: string
  opportunityId?: string | null
}) {
  const { db, actor, access, prospectId } = input
  const diagnostics: Record<string, string> = {}
  const account = await safeOne(db, 'b2b_prospects', (query) => query.eq('id', prospectId).maybeSingle(), diagnostics)
  if (!account) throw Object.assign(new Error('B2B_ACCOUNT_NOT_FOUND'), { status: 404 })
  const visible = filterByOwnership([account], actor.id, scopeRecord(access))
  if (!visible.length) throw Object.assign(new Error('B2B_ACCOUNT_SCOPE_DENIED'), { status: 403 })

  const [contacts, committee, opportunities, scores, plans, researchMissions, evidence, timeline, attribution, referrals] = await Promise.all([
    safeMany(db, 'b2b_contacts', (query) => query.eq('prospect_id', prospectId).order('created_at', { ascending: false }).limit(100), diagnostics),
    safeMany(db, 'browser_extension_b2b_buying_committee', (query) => query.eq('prospect_id', prospectId).order('updated_at', { ascending: false }).limit(100), diagnostics),
    safeMany(db, 'browser_extension_b2b_opportunities', (query) => query.eq('prospect_id', prospectId).order('updated_at', { ascending: false }).limit(100), diagnostics),
    safeMany(db, 'browser_extension_b2b_score_snapshots', (query) => query.eq('prospect_id', prospectId).order('created_at', { ascending: false }).limit(20), diagnostics),
    safeMany(db, 'browser_extension_b2b_account_plans', (query) => query.eq('prospect_id', prospectId).order('updated_at', { ascending: false }).limit(20), diagnostics),
    safeMany(db, 'browser_extension_b2b_research_missions', (query) => query.eq('prospect_id', prospectId).order('created_at', { ascending: false }).limit(100), diagnostics),
    safeMany(db, 'browser_extension_b2b_evidence', (query) => query.eq('prospect_id', prospectId).order('created_at', { ascending: false }).limit(150), diagnostics),
    safeMany(db, 'browser_extension_b2b_timeline_events', (query) => query.eq('prospect_id', prospectId).order('occurred_at', { ascending: false }).limit(150), diagnostics),
    safeMany(db, 'browser_extension_b2b_attribution', (query) => query.eq('prospect_id', prospectId).order('created_at', { ascending: false }).limit(50), diagnostics),
    safeMany(db, 'browser_extension_b2b_referral_sources', (query) => query.eq('prospect_id', prospectId).order('created_at', { ascending: false }).limit(50), diagnostics),
  ])

  const partnerSummary = await safeOne(db, 'browser_extension_b2b_partners', (query) => query.eq('prospect_id', prospectId).maybeSingle(), diagnostics)

  const activeOpportunity = input.opportunityId
    ? opportunities.find((row) => row.id === input.opportunityId) || null
    : opportunities.find((row) => row.status === 'active') || opportunities[0] || null
  const opportunityId = activeOpportunity?.id || null

  const byOpportunity = async (table: string, limit = 100) => opportunityId
    ? safeMany(db, table, (query) => query.eq('opportunity_id', opportunityId).order('created_at', { ascending: false }).limit(limit), diagnostics)
    : []

  const [
    stageHistory, nextActions, outreachStrategies, communicationContexts, communicationDrafts,
    callBriefs, fieldVisits, meetingBriefs, meetingNotes, meetingOutcomes, followups,
    sequenceEnrollments, offerConfigurations, pricingCalculations, marginSnapshots,
    proposalVersions, approvalRequests, discountRequests, negotiationRooms, negotiationEvents,
    counteroffers, objections, closingReadiness, closingGates, contractRequirements,
    paymentGates, paymentPromises, rescueCases, executiveInterventions,
  ] = await Promise.all([
    byOpportunity('browser_extension_b2b_opportunity_stage_history'),
    byOpportunity('browser_extension_b2b_next_best_actions'),
    byOpportunity('browser_extension_b2b_outreach_strategies'),
    byOpportunity('browser_extension_b2b_communication_contexts'),
    byOpportunity('browser_extension_b2b_communication_drafts'),
    byOpportunity('browser_extension_b2b_call_briefs'),
    byOpportunity('browser_extension_b2b_field_visits'),
    byOpportunity('browser_extension_b2b_meeting_briefs'),
    byOpportunity('browser_extension_b2b_meeting_live_notes'),
    byOpportunity('browser_extension_b2b_meeting_outcomes'),
    byOpportunity('browser_extension_b2b_followups'),
    byOpportunity('browser_extension_b2b_sequence_enrollments'),
    byOpportunity('browser_extension_b2b_offer_configurations'),
    byOpportunity('browser_extension_b2b_pricing_calculations'),
    byOpportunity('browser_extension_b2b_margin_snapshots'),
    byOpportunity('browser_extension_b2b_proposal_versions'),
    byOpportunity('browser_extension_b2b_approval_requests'),
    byOpportunity('browser_extension_b2b_discount_requests'),
    byOpportunity('browser_extension_b2b_negotiation_rooms'),
    byOpportunity('browser_extension_b2b_negotiation_events'),
    byOpportunity('browser_extension_b2b_counteroffers'),
    byOpportunity('browser_extension_b2b_objections'),
    byOpportunity('browser_extension_b2b_closing_readiness_snapshots'),
    byOpportunity('browser_extension_b2b_closing_gates'),
    byOpportunity('browser_extension_b2b_contract_requirements'),
    byOpportunity('browser_extension_b2b_payment_gates'),
    byOpportunity('browser_extension_b2b_payment_promises'),
    byOpportunity('browser_extension_b2b_revenue_rescue_cases'),
    byOpportunity('browser_extension_b2b_executive_interventions'),
  ])

  const owner = account.assigned_owner_id
    ? await safeOne(db, 'app_users', (query) => query.eq('id', account.assigned_owner_id).maybeSingle(), diagnostics)
    : null
  const dataQuality = calculateDataQuality(account, committee, contacts)
  const latestClosingReadiness = latest(closingReadiness)
  const commercialHealth = calculateCommercialHealth(activeOpportunity, nextActions, followups, latestClosingReadiness, paymentPromises)

  return {
    account,
    partnerSummary,
    owner,
    contacts,
    committee,
    opportunities,
    activeOpportunity,
    intelligence: {
      score: latest(scores),
      accountPlan: latest(plans),
      researchMissions,
      evidence,
      dataQuality,
      commercialHealth,
    },
    execution: {
      nextActions,
      followups,
      outreachStrategies,
      communicationContexts,
      communicationDrafts,
      callBriefs,
      fieldVisits,
      meetings: { briefs: meetingBriefs, notes: meetingNotes, outcomes: meetingOutcomes },
      sequenceEnrollments,
      stageHistory,
    },
    deal: {
      offerConfiguration: latest(offerConfigurations),
      pricing: latest(pricingCalculations),
      margin: latest(marginSnapshots),
      proposal: latest(proposalVersions),
      approvals: approvalRequests,
      discountRequests,
      negotiationRoom: latest(negotiationRooms),
      negotiationEvents,
      counteroffer: latest(counteroffers),
      objections,
      closingReadiness: latestClosingReadiness,
      closingGate: latest(closingGates),
      contractRequirements,
      paymentGate: latest(paymentGates),
      paymentPromises,
      rescueCases,
      executiveInterventions,
    },
    more: { timeline, evidence, attribution, referrals },
    diagnostics,
    refreshedAt: new Date().toISOString(),
  }
}

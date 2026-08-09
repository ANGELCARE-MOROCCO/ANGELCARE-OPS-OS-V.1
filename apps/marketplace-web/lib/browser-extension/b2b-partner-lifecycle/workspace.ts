import { filterByOwnership } from '../b2b-intelligence/scope'

type QueryResult<T = any> = { data: T; error: any }
function scopeRecord(access: any) { return Object.fromEntries((access?.scopes || []).map((row: any) => [row.scope_key, row.scope_value])) as Record<string, unknown> }
async function safeMany(db: any, table: string, configure: (query: any) => any, diagnostics: Record<string, string>) {
  try { const result: QueryResult<any[]> = await configure(db.from(table).select('*')); if (result.error) { diagnostics[table] = String(result.error.message || result.error); return [] }; return result.data || [] } catch (error: any) { diagnostics[table] = String(error?.message || error); return [] }
}
async function safeOne(db: any, table: string, configure: (query: any) => any, diagnostics: Record<string, string>) {
  try { const result: QueryResult<any> = await configure(db.from(table).select('*')); if (result.error) { diagnostics[table] = String(result.error.message || result.error); return null }; return result.data || null } catch (error: any) { diagnostics[table] = String(error?.message || error); return null }
}
function latest<T extends Record<string, any>>(rows: T[], fields = ['updated_at', 'created_at']) { return [...rows].sort((a, b) => { const at = fields.map((f) => Date.parse(String(a[f] || ''))).find(Number.isFinite) || 0; const bt = fields.map((f) => Date.parse(String(b[f] || ''))).find(Number.isFinite) || 0; return bt - at })[0] || null }

export async function hydrateB2BPartnerWorkspace(input: { db: any; actor: any; access: any; partnerId?: string | null; prospectId?: string | null; activeIds?: Record<string, string | null | undefined> }) {
  const { db, actor, access } = input
  const diagnostics: Record<string, string> = {}
  let partner = null
  if (input.partnerId) partner = await safeOne(db, 'browser_extension_b2b_partners', (q) => q.eq('id', input.partnerId).maybeSingle(), diagnostics)
  else if (input.prospectId) partner = await safeOne(db, 'browser_extension_b2b_partners', (q) => q.eq('prospect_id', input.prospectId).maybeSingle(), diagnostics)
  if (!partner && input.prospectId) {
    const account = await safeOne(db, 'b2b_prospects', (q) => q.eq('id', input.prospectId).maybeSingle(), diagnostics)
    if (!account) return { partner: null, account: null, diagnostics, refreshedAt: new Date().toISOString() }
    if (!filterByOwnership([account], actor.id, scopeRecord(access)).length) throw Object.assign(new Error('PARTNER_SCOPE_DENIED'), { status: 403 })
    const handoffs = await safeMany(db, 'browser_extension_b2b_handoffs', (q) => q.eq('prospect_id', input.prospectId).order('updated_at', { ascending: false }).limit(20), diagnostics)
    const activeHandoff = input.activeIds?.activeHandoffId ? handoffs.find((row: any) => row.id === input.activeIds?.activeHandoffId) || null : latest(handoffs)
    const opportunity = activeHandoff?.opportunity_id
      ? await safeOne(db, 'browser_extension_b2b_opportunities', (q) => q.eq('id', activeHandoff.opportunity_id).maybeSingle(), diagnostics)
      : await safeOne(db, 'browser_extension_b2b_opportunities', (q) => q.eq('prospect_id', input.prospectId).order('updated_at', { ascending: false }).limit(1).maybeSingle(), diagnostics)
    return {
      partner: null,
      account,
      opportunity,
      identity: { sites: [], services: [], contacts: [], documents: [] },
      operate: { handoffs, activeHandoff, onboardingPlans: [], onboardingTasks: [], activationPlans: [], activeActivation: null, activationGates: [], firstServices: [], hypercare: [], issues: [], activeIssue: null, correctiveActions: [], reviews: [] },
      growth: { signals: [], opportunities: [], activeOpportunity: null, expansionPlans: [], renewals: [], activeRenewal: null, renewalMilestones: [], churnRisks: [], rescueCases: [] },
      intelligence: { performance: [], latestPerformance: null, health: [], latestHealth: null, missingData: ['partner_activation'] },
      tenders: { tenders: [], requirements: [], compliance: [] },
      more: { timeline: [], documents: [], diagnostics },
      activeContext: { activePartnerId: null, activeContractId: null, activeSiteId: null, activeServiceId: null, activeActivationId: null, activeIssueId: null, activeGrowthOpportunityId: null, activeRenewalId: null },
      diagnostics,
      refreshedAt: new Date().toISOString(),
    }
  }
  if (!partner) return { partner: null, diagnostics, refreshedAt: new Date().toISOString() }
  const account = await safeOne(db, 'b2b_prospects', (q) => q.eq('id', partner.prospect_id).maybeSingle(), diagnostics)
  if (!account) throw Object.assign(new Error('PARTNER_ACCOUNT_NOT_FOUND'), { status: 404 })
  if (!filterByOwnership([account], actor.id, scopeRecord(access)).length) throw Object.assign(new Error('PARTNER_SCOPE_DENIED'), { status: 403 })
  const opportunity = partner.source_opportunity_id ? await safeOne(db, 'browser_extension_b2b_opportunities', (q) => q.eq('id', partner.source_opportunity_id).maybeSingle(), diagnostics) : null
  const [sites, services, contacts, handoffs, onboardingPlans, onboardingTasks, activationPlans, activationGates, firstServices, hypercare, performance, health, issues, correctiveActions, reviews, growthSignals, growthOpportunities, expansionPlans, renewals, renewalMilestones, churnRisks, rescueCases, tenders, tenderRequirements, tenderCompliance, documents, timeline] = await Promise.all([
    safeMany(db, 'browser_extension_b2b_partner_sites', (q) => q.eq('partner_id', partner.id).order('created_at', { ascending: false }).limit(200), diagnostics),
    safeMany(db, 'browser_extension_b2b_partner_services', (q) => q.eq('partner_id', partner.id).order('created_at', { ascending: false }).limit(200), diagnostics),
    safeMany(db, 'browser_extension_b2b_partner_contacts', (q) => q.eq('partner_id', partner.id).order('created_at', { ascending: false }).limit(200), diagnostics),
    safeMany(db, 'browser_extension_b2b_handoffs', (q) => q.eq('partner_id', partner.id).order('updated_at', { ascending: false }).limit(20), diagnostics),
    safeMany(db, 'browser_extension_b2b_onboarding_plans', (q) => q.eq('partner_id', partner.id).order('updated_at', { ascending: false }).limit(20), diagnostics),
    safeMany(db, 'browser_extension_b2b_onboarding_tasks', (q) => q.eq('partner_id', partner.id).order('created_at', { ascending: false }).limit(300), diagnostics),
    safeMany(db, 'browser_extension_b2b_activation_plans', (q) => q.eq('partner_id', partner.id).order('updated_at', { ascending: false }).limit(20), diagnostics),
    safeMany(db, 'browser_extension_b2b_activation_gates', (q) => q.eq('partner_id', partner.id).order('updated_at', { ascending: false }).limit(100), diagnostics),
    safeMany(db, 'browser_extension_b2b_first_services', (q) => q.eq('partner_id', partner.id).order('created_at', { ascending: false }).limit(50), diagnostics),
    safeMany(db, 'browser_extension_b2b_hypercare_checkpoints', (q) => q.eq('partner_id', partner.id).order('due_at', { ascending: true }).limit(100), diagnostics),
    safeMany(db, 'browser_extension_b2b_partner_performance_snapshots', (q) => q.eq('partner_id', partner.id).order('created_at', { ascending: false }).limit(50), diagnostics),
    safeMany(db, 'browser_extension_b2b_partner_health_snapshots', (q) => q.eq('partner_id', partner.id).order('created_at', { ascending: false }).limit(50), diagnostics),
    safeMany(db, 'browser_extension_b2b_partner_issues', (q) => q.eq('partner_id', partner.id).order('created_at', { ascending: false }).limit(200), diagnostics),
    safeMany(db, 'browser_extension_b2b_corrective_actions', (q) => q.eq('partner_id', partner.id).order('created_at', { ascending: false }).limit(200), diagnostics),
    safeMany(db, 'browser_extension_b2b_partner_reviews', (q) => q.eq('partner_id', partner.id).order('created_at', { ascending: false }).limit(100), diagnostics),
    safeMany(db, 'browser_extension_b2b_growth_signals', (q) => q.eq('partner_id', partner.id).order('created_at', { ascending: false }).limit(100), diagnostics),
    safeMany(db, 'browser_extension_b2b_growth_opportunities', (q) => q.eq('partner_id', partner.id).order('updated_at', { ascending: false }).limit(100), diagnostics),
    safeMany(db, 'browser_extension_b2b_expansion_plans', (q) => q.eq('partner_id', partner.id).order('updated_at', { ascending: false }).limit(100), diagnostics),
    safeMany(db, 'browser_extension_b2b_renewals', (q) => q.eq('partner_id', partner.id).order('contract_end_at', { ascending: true }).limit(50), diagnostics),
    safeMany(db, 'browser_extension_b2b_renewal_milestones', (q) => q.eq('partner_id', partner.id).order('due_at', { ascending: true }).limit(100), diagnostics),
    safeMany(db, 'browser_extension_b2b_churn_risks', (q) => q.eq('partner_id', partner.id).order('created_at', { ascending: false }).limit(50), diagnostics),
    safeMany(db, 'browser_extension_b2b_partner_rescue_cases', (q) => q.eq('partner_id', partner.id).order('created_at', { ascending: false }).limit(50), diagnostics),
    safeMany(db, 'browser_extension_b2b_tenders', (q) => q.eq('partner_id', partner.id).order('created_at', { ascending: false }).limit(100), diagnostics),
    Promise.resolve([]),
    Promise.resolve([]),
    safeMany(db, 'browser_extension_b2b_partner_documents', (q) => q.eq('partner_id', partner.id).order('created_at', { ascending: false }).limit(100), diagnostics),
    safeMany(db, 'browser_extension_b2b_timeline_events', (q) => q.eq('prospect_id', partner.prospect_id).order('occurred_at', { ascending: false }).limit(200), diagnostics),
  ])
  const tenderIds = tenders.map((row: any) => row.id)
  const requirements = tenderIds.length ? await safeMany(db, 'browser_extension_b2b_tender_requirements', (q) => q.in('tender_id', tenderIds).order('created_at', { ascending: false }).limit(500), diagnostics) : tenderRequirements
  const compliance = tenderIds.length ? await safeMany(db, 'browser_extension_b2b_tender_compliance', (q) => q.in('tender_id', tenderIds).order('updated_at', { ascending: false }).limit(500), diagnostics) : tenderCompliance
  const activeHandoff = input.activeIds?.activeHandoffId ? handoffs.find((row: any) => row.id === input.activeIds?.activeHandoffId) || null : latest(handoffs)
  const activeActivation = input.activeIds?.activeActivationId ? activationPlans.find((row: any) => row.id === input.activeIds?.activeActivationId) || null : latest(activationPlans)
  const activeIssue = input.activeIds?.activeIssueId ? issues.find((row: any) => row.id === input.activeIds?.activeIssueId) || null : issues.find((row: any) => row.status !== 'closed') || latest(issues)
  const activeGrowthOpportunity = input.activeIds?.activeGrowthOpportunityId ? growthOpportunities.find((row: any) => row.id === input.activeIds?.activeGrowthOpportunityId) || null : growthOpportunities.find((row: any) => row.status !== 'closed') || latest(growthOpportunities)
  const activeRenewal = input.activeIds?.activeRenewalId ? renewals.find((row: any) => row.id === input.activeIds?.activeRenewalId) || null : renewals.find((row: any) => !['renewed', 'expired'].includes(row.status)) || latest(renewals)
  const latestPerformance = latest(performance)
  const latestHealth = latest(health)
  const missingData = [...new Set([...(latestPerformance?.missing_fields || []), ...(latestHealth?.missing_data || []), ...(!latestPerformance ? ['performance_snapshot'] : []), ...(!latestHealth ? ['health_snapshot'] : [])])]
  return {
    partner, account, opportunity,
    identity: { sites, services, contacts, documents },
    operate: { handoffs, activeHandoff, onboardingPlans, onboardingTasks, activationPlans, activeActivation, activationGates, firstServices, hypercare, issues, activeIssue, correctiveActions, reviews },
    growth: { signals: growthSignals, opportunities: growthOpportunities, activeOpportunity: activeGrowthOpportunity, expansionPlans, renewals, activeRenewal, renewalMilestones, churnRisks, rescueCases },
    intelligence: { performance, latestPerformance, health, latestHealth, missingData },
    tenders: { tenders, requirements, compliance },
    more: { timeline, documents, diagnostics },
    activeContext: { activePartnerId: partner.id, activeContractId: partner.contract_id || null, activeSiteId: input.activeIds?.activeSiteId || sites[0]?.id || null, activeServiceId: input.activeIds?.activeServiceId || services[0]?.id || null, activeActivationId: activeActivation?.id || null, activeIssueId: activeIssue?.id || null, activeGrowthOpportunityId: activeGrowthOpportunity?.id || null, activeRenewalId: activeRenewal?.id || null },
    diagnostics,
    refreshedAt: new Date().toISOString(),
  }
}

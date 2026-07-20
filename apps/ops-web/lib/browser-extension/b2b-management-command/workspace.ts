import { filterByOwnership } from '../b2b-intelligence/scope'

type QueryResult<T = any> = { data: T; error: any }
function scopeRecord(access: any) { return Object.fromEntries((access?.scopes || []).map((row: any) => [row.scope_key, row.scope_value])) as Record<string, unknown> }
async function safeMany(db: any, table: string, configure: (query: any) => any, diagnostics: Record<string, string>) {
  try { const result: QueryResult<any[]> = await configure(db.from(table).select('*')); if (result.error) { diagnostics[table] = String(result.error.message || result.error); return [] }; return result.data || [] } catch (error: any) { diagnostics[table] = String(error?.message || error); return [] }
}
function latest<T extends Record<string, any>>(rows: T[], fields = ['updated_at', 'created_at']) { return [...rows].sort((a, b) => { const at = fields.map((f) => Date.parse(String(a[f] || ''))).find(Number.isFinite) || 0; const bt = fields.map((f) => Date.parse(String(b[f] || ''))).find(Number.isFinite) || 0; return bt - at })[0] || null }

export async function hydrateB2BManagementWorkspace(input: { db: any; actor: any; access: any; activeIds?: Record<string, string | null | undefined> }) {
  const { db, actor, access } = input
  const diagnostics: Record<string, string> = {}
  const accounts = await safeMany(db, 'b2b_prospects', (q) => q.order('updated_at', { ascending: false }).limit(1000), diagnostics)
  const authorizedAccounts = filterByOwnership(accounts, actor.id, scopeRecord(access))
  const accountIds = authorizedAccounts.map((row: any) => row.id)
  const opportunityRows = accountIds.length ? await safeMany(db, 'browser_extension_b2b_opportunities', (q) => q.in('prospect_id', accountIds).order('updated_at', { ascending: false }).limit(1000), diagnostics) : []
  const opportunityIds = opportunityRows.map((row: any) => row.id)
  const partnerRows = accountIds.length ? await safeMany(db, 'browser_extension_b2b_partners', (q) => q.in('prospect_id', accountIds).order('updated_at', { ascending: false }).limit(1000), diagnostics) : []
  const partnerIds = partnerRows.map((row: any) => row.id)
  const renewalRows = partnerIds.length ? await safeMany(db, 'browser_extension_b2b_renewals', (q) => q.in('partner_id', partnerIds).order('contract_end_at', { ascending: true }).limit(1000), diagnostics) : []
  const [recommendations, recommendationEvidence, truthAssessments, forecasts, forecastOverrides, risks, interventions, qualityAssessments, qualityPatterns, coachingMissions, territorySnapshots, reports, automations, automationApprovals, automationRuns, killSwitches] = await Promise.all([
    (accountIds.length || opportunityIds.length || partnerIds.length) ? safeMany(db, 'browser_extension_b2b_ai_recommendations', (q) => q.or([accountIds.length ? `prospect_id.in.(${accountIds.join(',')})` : '', opportunityIds.length ? `opportunity_id.in.(${opportunityIds.join(',')})` : '', partnerIds.length ? `partner_id.in.(${partnerIds.join(',')})` : ''].filter(Boolean).join(',')).order('created_at', { ascending: false }).limit(500), diagnostics) : Promise.resolve([]),
    safeMany(db, 'browser_extension_b2b_ai_recommendation_evidence', (q) => q.order('created_at', { ascending: false }).limit(1000), diagnostics),
    opportunityIds.length ? safeMany(db, 'browser_extension_b2b_pipeline_truth_assessments', (q) => q.in('opportunity_id', opportunityIds).order('created_at', { ascending: false }).limit(1000), diagnostics) : Promise.resolve([]),
    safeMany(db, 'browser_extension_b2b_forecast_snapshots', (q) => q.eq('scope_reference', actor.id).order('created_at', { ascending: false }).limit(100), diagnostics),
    safeMany(db, 'browser_extension_b2b_forecast_overrides', (q) => q.order('created_at', { ascending: false }).limit(200), diagnostics),
    (accountIds.length || opportunityIds.length || partnerIds.length) ? safeMany(db, 'browser_extension_b2b_revenue_risks', (q) => q.or([accountIds.length ? `prospect_id.in.(${accountIds.join(',')})` : '', opportunityIds.length ? `opportunity_id.in.(${opportunityIds.join(',')})` : '', partnerIds.length ? `partner_id.in.(${partnerIds.join(',')})` : ''].filter(Boolean).join(',')).order('created_at', { ascending: false }).limit(1000), diagnostics) : Promise.resolve([]),
    (accountIds.length || opportunityIds.length || partnerIds.length) ? safeMany(db, 'browser_extension_b2b_management_interventions', (q) => q.or([accountIds.length ? `prospect_id.in.(${accountIds.join(',')})` : '', opportunityIds.length ? `opportunity_id.in.(${opportunityIds.join(',')})` : '', partnerIds.length ? `partner_id.in.(${partnerIds.join(',')})` : ''].filter(Boolean).join(',')).order('created_at', { ascending: false }).limit(500), diagnostics) : Promise.resolve([]),
    safeMany(db, 'browser_extension_b2b_execution_quality_assessments', (q) => q.order('created_at', { ascending: false }).limit(500), diagnostics),
    safeMany(db, 'browser_extension_b2b_execution_quality_patterns', (q) => q.order('created_at', { ascending: false }).limit(500), diagnostics),
    safeMany(db, 'browser_extension_b2b_coaching_missions', (q) => q.order('created_at', { ascending: false }).limit(500), diagnostics),
    safeMany(db, 'browser_extension_b2b_territory_intelligence_snapshots', (q) => q.eq('scope_owner_id', actor.id).order('created_at', { ascending: false }).limit(100), diagnostics),
    safeMany(db, 'browser_extension_b2b_executive_reports', (q) => q.eq('scope_owner_id', actor.id).order('created_at', { ascending: false }).limit(200), diagnostics),
    safeMany(db, 'browser_extension_b2b_automation_definitions', (q) => q.order('created_at', { ascending: false }).limit(500), diagnostics),
    safeMany(db, 'browser_extension_b2b_automation_approvals', (q) => q.order('created_at', { ascending: false }).limit(500), diagnostics),
    safeMany(db, 'browser_extension_b2b_automation_runs', (q) => q.order('created_at', { ascending: false }).limit(1000), diagnostics),
    safeMany(db, 'browser_extension_b2b_automation_kill_switches', (q) => q.eq('active', true).order('activated_at', { ascending: false }).limit(100), diagnostics),
  ])
  const scopedRecommendationIds = new Set(recommendations.map((row: any) => row.id))
  const scopedEvidence = recommendationEvidence.filter((row: any) => scopedRecommendationIds.has(row.recommendation_id))
  const latestForecast = latest(forecasts)
  const openRisks = risks.filter((row: any) => !['resolved', 'closed'].includes(String(row.status || '').toLowerCase()))
  const openInterventions = interventions.filter((row: any) => !['resolved', 'closed'].includes(String(row.status || '').toLowerCase()))
  const activeRecommendation = input.activeIds?.activeRecommendationId ? recommendations.find((row: any) => row.id === input.activeIds?.activeRecommendationId) || null : recommendations.find((row: any) => ['generated', 'under_review'].includes(row.status)) || latest(recommendations)
  const activeRisk = input.activeIds?.activeRiskId ? risks.find((row: any) => row.id === input.activeIds?.activeRiskId) || null : openRisks[0] || latest(risks)
  const activeCoaching = input.activeIds?.activeCoachingId ? coachingMissions.find((row: any) => row.id === input.activeIds?.activeCoachingId) || null : coachingMissions.find((row: any) => !['outcome_recorded', 'closed'].includes(row.status)) || latest(coachingMissions)
  const activeAutomation = input.activeIds?.activeAutomationId ? automations.find((row: any) => row.id === input.activeIds?.activeAutomationId) || null : automations.find((row: any) => row.status === 'enabled') || latest(automations)
  const revenueAtRisk = openRisks.reduce((sum: number, row: any) => sum + Number(row.revenue_at_risk || 0), 0)
  return {
    command: {
      accounts: authorizedAccounts,
      opportunities: opportunityRows,
      partners: partnerRows,
      renewals: renewalRows,
      priorities: openRisks.slice(0, 25),
      revenueAtRisk,
      decisionQueue: [...recommendations.filter((row: any) => row.status === 'generated'), ...forecastOverrides.filter((row: any) => row.status === 'pending'), ...automationApprovals.filter((row: any) => row.status === 'pending')].slice(0, 50),
    },
    aiDirector: { recommendations, evidence: scopedEvidence, activeRecommendation, generated: recommendations.filter((row: any) => row.status === 'generated').length, accepted: recommendations.filter((row: any) => row.status === 'accepted').length },
    pipeline: { assessments: truthAssessments, latestForecast, forecasts, overrides: forecastOverrides, opportunities: opportunityRows },
    risks: { items: risks, open: openRisks, activeRisk, interventions, openInterventions, revenueAtRisk },
    team: { assessments: qualityAssessments, patterns: qualityPatterns, coachingMissions, activeCoaching },
    territory: { snapshots: territorySnapshots, latest: latest(territorySnapshots) },
    reports: { items: reports, latest: latest(reports) },
    automation: { definitions: automations, activeAutomation, approvals: automationApprovals, runs: automationRuns, killSwitches },
    activeContext: { activeRecommendationId: activeRecommendation?.id || null, activeRiskId: activeRisk?.id || null, activeCoachingId: activeCoaching?.id || null, activeAutomationId: activeAutomation?.id || null },
    diagnostics,
    refreshedAt: new Date().toISOString(),
  }
}

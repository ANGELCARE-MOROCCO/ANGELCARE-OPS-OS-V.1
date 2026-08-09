import { getContentResearchConfig } from './config'
import {
  claimDueResearchAgents,
  createResearchAlert,
  createResearchRun,
  getProviderPolicies,
  getResearchAgent,
  getUsageQuantity,
  markAgentRunCompleted,
  persistCanonicalSources,
  persistResearchFindings,
  recordRunEvent,
  recordUsage,
  updateResearchRun,
} from './repository'
import { calculateNextRunAt, effectiveOpenRouterPolicy, effectiveTavilyPolicy, materializationPolicy, numberValue, record, stringValue } from './policy'
import { analyzeWithOpenRouter } from './providers/openrouter'
import { searchTavily } from './providers/tavily'
import type { JsonRecord, ResearchAgent, ResearchProviderPolicy, ResearchRun } from './types'

function startOfDay() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()
}

function startOfMonth() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

function providerByKey(providers: ResearchProviderPolicy[], key: string) {
  return providers.find((provider) => provider.provider_key === key)
}


async function enforceQuota(input: {
  agent: ResearchAgent
  tavilyProvider: ResearchProviderPolicy
  openrouterProvider: ResearchProviderPolicy
}) {
  const agentQuota = record(input.agent.quota_policy)
  const tavilyLimits = record(input.tavilyProvider.limits)
  const openrouterLimits = record(input.openrouterProvider.limits)

  const agentSearchDay = await getUsageQuantity({ providerKey: 'tavily', agentId: input.agent.id, metricType: 'requests', since: startOfDay() })
  const agentSearchMonth = await getUsageQuantity({ providerKey: 'tavily', agentId: input.agent.id, metricType: 'requests', since: startOfMonth() })
  const globalSearchDay = await getUsageQuantity({ providerKey: 'tavily', metricType: 'requests', since: startOfDay() })
  const globalSearchMonth = await getUsageQuantity({ providerKey: 'tavily', metricType: 'requests', since: startOfMonth() })
  const agentAnalysisDay = await getUsageQuantity({ providerKey: 'openrouter', agentId: input.agent.id, metricType: 'requests', since: startOfDay() })
  const agentAnalysisMonth = await getUsageQuantity({ providerKey: 'openrouter', agentId: input.agent.id, metricType: 'requests', since: startOfMonth() })
  const globalAnalysisDay = await getUsageQuantity({ providerKey: 'openrouter', metricType: 'requests', since: startOfDay() })
  const globalAnalysisMonth = await getUsageQuantity({ providerKey: 'openrouter', metricType: 'requests', since: startOfMonth() })

  const gates = [
    { name: 'AGENT_TAVILY_DAILY_LIMIT_REACHED', used: agentSearchDay, limit: numberValue(agentQuota.maxSearchCallsPerDay, 8, 1, 1000) },
    { name: 'AGENT_TAVILY_MONTHLY_LIMIT_REACHED', used: agentSearchMonth, limit: numberValue(agentQuota.maxSearchCallsPerMonth, 120, 1, 10000) },
    { name: 'MARKET_OS_TAVILY_DAILY_LIMIT_REACHED', used: globalSearchDay, limit: numberValue(tavilyLimits.maxRequestsPerDay, 40, 1, 10000) },
    { name: 'MARKET_OS_TAVILY_MONTHLY_LIMIT_REACHED', used: globalSearchMonth, limit: numberValue(tavilyLimits.maxRequestsPerMonth, 800, 1, 100000) },
    { name: 'AGENT_OPENROUTER_DAILY_LIMIT_REACHED', used: agentAnalysisDay, limit: numberValue(agentQuota.maxAnalysesPerDay, 5, 1, 1000) },
    { name: 'AGENT_OPENROUTER_MONTHLY_LIMIT_REACHED', used: agentAnalysisMonth, limit: numberValue(agentQuota.maxAnalysesPerMonth, 80, 1, 10000) },
    { name: 'MARKET_OS_OPENROUTER_DAILY_LIMIT_REACHED', used: globalAnalysisDay, limit: numberValue(openrouterLimits.maxRequestsPerDay, 35, 1, 10000) },
    { name: 'MARKET_OS_OPENROUTER_MONTHLY_LIMIT_REACHED', used: globalAnalysisMonth, limit: numberValue(openrouterLimits.maxRequestsPerMonth, 700, 1, 100000) },
  ]
  const blocked = gates.find((gate) => gate.used >= gate.limit)
  if (blocked) throw Object.assign(new Error(blocked.name), { quota: blocked })
  return { gates }
}

async function failRun(run: ResearchRun, input: {
  status: ResearchRun['status']
  code: string
  message: string
  provider?: string
  agent?: ResearchAgent
  partial?: JsonRecord
}) {
  await updateResearchRun(run.id, {
    status: input.status,
    provider_stage: 'failed',
    error_code: input.code,
    error_message: input.message,
    materialization_result: input.partial || {},
    completed_at: new Date().toISOString(),
  })
  await recordRunEvent({ runId: run.id, eventType: 'run.failed', stage: 'failed', message: input.message, detail: { code: input.code, provider: input.provider || null } })
  await createResearchAlert({
    providerKey: input.provider || null,
    agentId: input.agent?.id || null,
    runId: run.id,
    alertType: input.code,
    severity: input.status === 'blocked_no_search_provider' ? 'critical' : 'high',
    title: input.provider ? `Défaillance ${input.provider}` : 'Recherche Content Command bloquée',
    message: input.message,
    detail: { errorCode: input.code, status: input.status },
  })
}

export async function runContentResearchAgent(input: {
  actorId: string
  actorName: string
  agentIdOrCode: string
  objective?: string
  query?: string
  priority?: string
  triggerType?: string
  overridePolicy?: JsonRecord
}) {
  const config = getContentResearchConfig()
  if (!config.enabled) throw new Error('CONTENT_RESEARCH_DISABLED')
  const agent = await getResearchAgent(input.agentIdOrCode)
  if (!agent) throw new Error('CONTENT_RESEARCH_AGENT_NOT_FOUND')
  if (agent.status !== 'active') throw new Error('CONTENT_RESEARCH_AGENT_NOT_ACTIVE')
  const providers = await getProviderPolicies()
  const tavilyProvider = providerByKey(providers, 'tavily')
  const openrouterProvider = providerByKey(providers, 'openrouter')
  if (!tavilyProvider || !tavilyProvider.enabled || tavilyProvider.status !== 'active') throw new Error('TAVILY_PROVIDER_PAUSED')
  if (!openrouterProvider || !openrouterProvider.enabled || openrouterProvider.status !== 'active') throw new Error('OPENROUTER_PROVIDER_PAUSED')
  if (!config.tavily.apiKey) throw new Error('TAVILY_API_KEY_MISSING')
  if (!config.openrouter.apiKey) throw new Error('OPENROUTER_API_KEY_MISSING')

  await enforceQuota({ agent, tavilyProvider, openrouterProvider })

  const override = record(input.overridePolicy)
  const objective = stringValue(input.objective, agent.purpose)
  const query = stringValue(input.query, stringValue(record(agent.research_policy).defaultQuery, objective))
  if (!query) throw new Error('RESEARCH_QUERY_REQUIRED')
  const run = await createResearchRun({
    actorId: input.actorId,
    actorName: input.actorName,
    agent,
    objective,
    query,
    priority: input.priority || agent.priority || 'normal',
    triggerType: input.triggerType || 'manual',
    overridePolicy: override,
  })
  const started = Date.now()
  const tavilyPolicy = effectiveTavilyPolicy(tavilyProvider, agent, override)
  const openrouterPolicy = effectiveOpenRouterPolicy(openrouterProvider, agent, override)
  const materialization = materializationPolicy(agent, override)

  try {
    await updateResearchRun(run.id, { status: 'searching_tavily', provider_stage: 'search', search_provider: 'tavily', started_at: new Date().toISOString() })
    await recordRunEvent({ runId: run.id, eventType: 'search.started', stage: 'searching_tavily', message: 'Recherche publique Tavily lancée.', detail: tavilyPolicy })

    let search
    try {
      search = await searchTavily({ query, ...tavilyPolicy })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'TAVILY_SEARCH_FAILED'
      if (!config.searxng.enabled || !config.searxng.baseUrl) {
        await failRun(run, { status: 'blocked_no_search_provider', code: 'TAVILY_UNAVAILABLE_SEARXNG_NOT_CONFIGURED', message: `${message}. SearXNG n’est pas encore configuré; aucune source n’a été fabriquée.`, provider: 'tavily', agent })
        throw Object.assign(new Error('TAVILY_UNAVAILABLE_SEARXNG_NOT_CONFIGURED'), { alreadyRecorded: true })
      }
      await failRun(run, { status: 'blocked_no_search_provider', code: 'SEARXNG_ADAPTER_PENDING', message: 'Tavily est indisponible et le fallback SearXNG est déclaré mais son adaptateur est volontairement non activé dans cette livraison.', provider: 'searxng', agent })
      throw Object.assign(new Error('SEARXNG_ADAPTER_PENDING'), { alreadyRecorded: true })
    }

    await recordUsage({ providerKey: 'tavily', agentId: agent.id, runId: run.id, metricType: 'requests', quantity: 1, unit: 'request', detail: { requestId: search.requestId, query } })
    await recordUsage({ providerKey: 'tavily', agentId: agent.id, runId: run.id, metricType: 'credits', quantity: search.credits, unit: 'credit', detail: { requestId: search.requestId, searchDepth: tavilyPolicy.searchDepth } })
    await updateResearchRun(run.id, { search_request_id: search.requestId, search_credits: search.credits, search_result_count: search.results.length, status: 'sources_normalized', provider_stage: 'source_normalization' })
    await recordRunEvent({ runId: run.id, eventType: 'search.completed', stage: 'sources_normalized', message: `${search.results.length} résultat(s) Tavily normalisé(s).`, detail: { requestId: search.requestId, credits: search.credits } })

    if (!search.results.length) {
      const completed = await updateResearchRun(run.id, { status: 'completed_without_opportunities', provider_stage: 'completed', result_summary: 'Tavily n’a retourné aucune source exploitable. Aucune analyse ou création interne n’a été simulée.', completed_at: new Date().toISOString(), latency_ms: Date.now() - started })
      await markAgentRunCompleted({ agentId: agent.id, nextRunAt: calculateNextRunAt(agent.schedule_policy) })
      return completed
    }

    await updateResearchRun(run.id, { status: 'sources_persisted', provider_stage: 'source_persistence' })
    let canonicalSources
    try {
      canonicalSources = await persistCanonicalSources({ runId: run.id, query, provider: 'tavily', sources: search.results.slice(0, config.resilience.maxSourcesPerRun) })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'SOURCE_PERSISTENCE_FAILED'
      await failRun(run, { status: 'failed_source_persistence', code: 'AC_CAPITAL_SOURCE_PERSISTENCE_FAILED', message, provider: 'ac_capital', agent })
      throw Object.assign(new Error('AC_CAPITAL_SOURCE_PERSISTENCE_FAILED'), { alreadyRecorded: true })
    }
    await updateResearchRun(run.id, { accepted_source_count: canonicalSources.length })
    await recordRunEvent({ runId: run.id, eventType: 'sources.persisted', stage: 'sources_persisted', message: `${canonicalSources.length} source(s) canonique(s) enregistrée(s) sous autorité AC Capital.`, detail: { sourceIds: canonicalSources.map((source) => source.id) } })

    await updateResearchRun(run.id, { status: 'analyzing_openrouter', provider_stage: 'analysis', analysis_provider: 'openrouter', requested_model: openrouterPolicy.model })
    await recordRunEvent({ runId: run.id, eventType: 'analysis.started', stage: 'analyzing_openrouter', message: 'Analyse structurée OpenRouter lancée sur les sources persistées.', detail: { requestedModel: openrouterPolicy.model, sourceCount: canonicalSources.length } })

    let analysis
    try {
      analysis = await analyzeWithOpenRouter({
        objective,
        agentName: agent.name,
        agentPurpose: agent.purpose,
        outputLanguage: agent.languages[0] || 'French',
        sources: search.results.slice(0, Math.min(openrouterPolicy.maxSources, canonicalSources.length)),
        model: openrouterPolicy.model,
        maxSourceCharacters: openrouterPolicy.maxSourceCharacters,
        maxOutputTokens: openrouterPolicy.maxOutputTokens,
        repairAttempts: openrouterPolicy.schemaRepairAttempts,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OPENROUTER_ANALYSIS_FAILED'
      await failRun(run, { status: 'failed_analysis_provider', code: 'OPENROUTER_ANALYSIS_FAILED', message, provider: 'openrouter', agent, partial: { canonicalSourceIds: canonicalSources.map((source) => source.id), sourcesPreserved: true } })
      throw Object.assign(new Error('OPENROUTER_ANALYSIS_FAILED'), { alreadyRecorded: true })
    }

    await recordUsage({ providerKey: 'openrouter', agentId: agent.id, runId: run.id, metricType: 'requests', quantity: 1, unit: 'request', detail: { requestedModel: analysis.requestedModel, resolvedModel: analysis.resolvedModel } })
    await recordUsage({ providerKey: 'openrouter', agentId: agent.id, runId: run.id, metricType: 'input_tokens', quantity: analysis.inputTokens, unit: 'token', detail: { resolvedModel: analysis.resolvedModel } })
    await recordUsage({ providerKey: 'openrouter', agentId: agent.id, runId: run.id, metricType: 'output_tokens', quantity: analysis.outputTokens, unit: 'token', detail: { resolvedModel: analysis.resolvedModel } })
    await updateResearchRun(run.id, { status: 'validating_findings', provider_stage: 'finding_validation', resolved_model: analysis.resolvedModel, input_tokens: analysis.inputTokens, output_tokens: analysis.outputTokens })
    await recordRunEvent({ runId: run.id, eventType: 'analysis.completed', stage: 'validating_findings', message: `${analysis.analysis.findings.length} constat(s) structuré(s) reçu(s) de ${analysis.resolvedModel}.`, detail: { rejectedHypotheses: analysis.analysis.rejectedHypotheses, missingInformation: analysis.analysis.missingInformation } })

    await updateResearchRun(run.id, { status: 'materializing_internal', provider_stage: 'internal_materialization' })
    const persisted = await persistResearchFindings({
      actorId: input.actorId,
      runId: run.id,
      agent,
      findings: analysis.analysis.findings.slice(0, config.resilience.maxOpportunitiesPerRun),
      sources: canonicalSources,
      minimumOpportunityScore: openrouterPolicy.minimumOpportunityScore,
      minimumEvidenceConfidence: openrouterPolicy.minimumEvidenceConfidence,
      minimumRelevance: openrouterPolicy.minimumRelevance,
      minimumBusinessFit: openrouterPolicy.minimumBusinessFit,
      materialization,
    })
    await recordRunEvent({ runId: run.id, eventType: 'materialization.completed', stage: 'materializing_internal', message: `${persisted.findings.length} constat(s), ${persisted.signalCount} signal(aux) et ${persisted.internalActionCount} action(s) interne(s) matérialisés.`, detail: { findingIds: persisted.findings.map((finding) => finding.id) } })

    const finalStatus = persisted.findings.length ? 'completed' : 'completed_without_opportunities'
    const completed = await updateResearchRun(run.id, {
      status: finalStatus,
      provider_stage: 'completed',
      finding_count: persisted.findings.length,
      signal_count: persisted.signalCount,
      internal_action_count: persisted.internalActionCount,
      result_summary: analysis.analysis.researchSummary || (persisted.findings.length ? 'Recherche Content Command terminée.' : 'Aucun constat suffisamment soutenu par les sources.'),
      materialization_result: {
        canonicalSourceIds: canonicalSources.map((source) => source.id),
        findingIds: persisted.findings.map((finding) => finding.id),
        externalActionsAllowed: false,
        humanApprovalBoundary: 'external_only',
      },
      latency_ms: Date.now() - started,
      completed_at: new Date().toISOString(),
    })
    await markAgentRunCompleted({ agentId: agent.id, nextRunAt: calculateNextRunAt(agent.schedule_policy) })
    await recordRunEvent({ runId: run.id, eventType: 'run.completed', stage: 'completed', message: 'Chaîne Tavily → AC Capital → OpenRouter → Content Command terminée.', detail: { status: finalStatus, externalActionsAllowed: false } })
    return completed
  } catch (error) {
    if (!(error as { alreadyRecorded?: boolean }).alreadyRecorded) {
      await failRun(run, { status: 'failed', code: error instanceof Error ? error.message : 'CONTENT_RESEARCH_FAILED', message: error instanceof Error ? error.message : 'CONTENT_RESEARCH_FAILED', agent })
    }
    throw error
  }
}


export async function runDueContentResearchAgents(input?: {
  actorId?: string
  actorName?: string
  limit?: number
}) {
  const config = getContentResearchConfig()
  const limit = Math.max(1, Math.min(12, input?.limit || config.maxDueRunsPerCycle))
  const agents = await claimDueResearchAgents(limit)
  const results: Array<{ agentId: string; agentCode: string; ok: boolean; runId?: string; status?: string; error?: string }> = []

  for (const agent of agents) {
    try {
      const run = await runContentResearchAgent({
        actorId: input?.actorId || 'system-cron',
        actorName: input?.actorName || 'SANILA Content Research Scheduler',
        agentIdOrCode: agent.id,
        objective: agent.purpose,
        query: stringValue(record(agent.research_policy).defaultQuery, agent.topics.join(' ')),
        priority: agent.priority,
        triggerType: 'scheduled',
      })
      results.push({ agentId: agent.id, agentCode: agent.code, ok: true, runId: run.id, status: run.status })
    } catch (error) {
      results.push({ agentId: agent.id, agentCode: agent.code, ok: false, error: error instanceof Error ? error.message : 'SCHEDULED_RESEARCH_FAILED' })
    }
  }

  return {
    ok: results.every((result) => result.ok),
    claimed: agents.length,
    completed: results.filter((result) => result.ok).length,
    failed: results.filter((result) => !result.ok).length,
    results,
    externalActionsAllowed: false,
  }
}

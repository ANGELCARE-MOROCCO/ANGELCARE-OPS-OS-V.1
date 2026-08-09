import crypto from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { contentResearchCredentialState, publicContentResearchDefaults } from './config'
import { calculateNextRunAt, record, stringList } from './policy'
import type {
  CanonicalPublicSource,
  JsonRecord,
  ResearchAgent,
  ResearchAlert,
  ResearchControlSnapshot,
  ResearchFinding,
  ResearchProviderPolicy,
  ResearchRun,
  ResearchRunEvent,
  ResearchUsageLedger,
  StructuredResearchFinding,
  TavilySearchResult,
} from './types'

const TABLES = {
  providers: 'market_content_research_provider_policies',
  agents: 'market_content_research_agents',
  versions: 'market_content_research_agent_versions',
  runs: 'market_content_research_runs',
  events: 'market_content_research_run_events',
  usage: 'market_content_research_usage_ledger',
  overrides: 'market_content_research_overrides',
  alerts: 'market_content_research_alerts',
  findings: 'market_content_research_findings',
  audit: 'market_content_research_audit',
  sources: 'ac_capital_public_source_registry',
} as const

function list<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : []
}

function missingTable(error: unknown) {
  const message = String((error as { message?: string })?.message || error || '').toLowerCase()
  return message.includes('market_content_research_') && (message.includes('does not exist') || message.includes('schema cache'))
}

function monthStartIso() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()
}

function periodKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

function normalizeUrl(value: string) {
  try {
    const url = new URL(value)
    url.hash = ''
    for (const key of Array.from(url.searchParams.keys())) {
      if (/^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$|ref$|source$)/i.test(key)) url.searchParams.delete(key)
    }
    url.hostname = url.hostname.toLowerCase().replace(/^www\./, '')
    url.pathname = url.pathname.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/'
    return url.toString()
  } catch {
    return value.trim()
  }
}

function hash(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

async function audit(input: { actorId: string; actorName: string; action: string; entityType: string; entityId?: string | null; before?: unknown; after?: unknown; reason?: string }) {
  const supabase = await createServiceClient() as any
  const result = await supabase.from(TABLES.audit).insert({
    actor_id: input.actorId || null,
    actor_name: input.actorName,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId || null,
    before_state: input.before || null,
    after_state: input.after || null,
    reason: input.reason || null,
  })
  if (result.error && !missingTable(result.error)) throw result.error
}

export async function getResearchControlSnapshot(): Promise<ResearchControlSnapshot> {
  const supabase = await createServiceClient() as any
  const generatedAt = new Date().toISOString()
  try {
    const [providers, agents, runs, events, usage, alerts, sources, findings] = await Promise.all([
      supabase.from(TABLES.providers).select('*').order('provider_role', { ascending: true }),
      supabase.from(TABLES.agents).select('*').order('priority', { ascending: true }).order('name', { ascending: true }),
      supabase.from(TABLES.runs).select('*').order('created_at', { ascending: false }).limit(120),
      supabase.from(TABLES.events).select('*').order('created_at', { ascending: false }).limit(250),
      supabase.from(TABLES.usage).select('*').gte('created_at', monthStartIso()).order('created_at', { ascending: false }).limit(500),
      supabase.from(TABLES.alerts).select('*').order('created_at', { ascending: false }).limit(120),
      supabase.from(TABLES.sources).select('*').order('last_seen_at', { ascending: false }).limit(120),
      supabase.from(TABLES.findings).select('*').order('created_at', { ascending: false }).limit(160),
    ])
    const errorResult = [providers, agents, runs, events, usage, alerts, sources, findings].find((result) => result.error)
    if (errorResult?.error) throw errorResult.error

    const agentRows = list<ResearchAgent>(agents.data)
    const runRows = list<ResearchRun>(runs.data)
    const usageRows = list<ResearchUsageLedger>(usage.data)
    const alertRows = list<ResearchAlert>(alerts.data)
    const findingRows = list<ResearchFinding>(findings.data)
    const thisMonthSources = list<CanonicalPublicSource>(sources.data).filter((item) => item.first_seen_at >= monthStartIso())
    const activeStatuses = new Set(['searching_tavily', 'searching_searxng_fallback', 'sources_normalized', 'sources_persisted', 'analyzing_openrouter', 'validating_findings', 'materializing_internal'])

    return {
      migrationReady: true,
      generatedAt,
      credentials: contentResearchCredentialState(),
      providers: list<ResearchProviderPolicy>(providers.data),
      agents: agentRows,
      runs: runRows,
      runEvents: list<ResearchRunEvent>(events.data),
      usage: usageRows,
      alerts: alertRows,
      sources: list<CanonicalPublicSource>(sources.data),
      findings: findingRows,
      rollups: {
        activeAgents: agentRows.filter((agent) => agent.status === 'active').length,
        pausedAgents: agentRows.filter((agent) => agent.status === 'paused').length,
        queuedRuns: runRows.filter((run) => run.status === 'queued').length,
        activeRuns: runRows.filter((run) => activeStatuses.has(run.status)).length,
        failedRuns: runRows.filter((run) => run.status.startsWith('failed') || run.status.startsWith('blocked')).length,
        sourcesThisMonth: thisMonthSources.length,
        opportunitiesThisMonth: findingRows.filter((finding) => finding.finding_type === 'content_opportunity' && finding.created_at >= monthStartIso()).length,
        tavilyCreditsThisMonth: usageRows.filter((row) => row.provider_key === 'tavily' && row.metric_type === 'credits').reduce((sum, row) => sum + Number(row.quantity || 0), 0),
        openrouterRequestsThisMonth: usageRows.filter((row) => row.provider_key === 'openrouter' && row.metric_type === 'requests').reduce((sum, row) => sum + Number(row.quantity || 0), 0),
        pendingAlerts: alertRows.filter((alert) => alert.status === 'open').length,
      },
    }
  } catch (error) {
    if (!missingTable(error)) throw error
    return {
      migrationReady: false,
      generatedAt,
      credentials: contentResearchCredentialState(),
      providers: [], agents: [], runs: [], runEvents: [], usage: [], alerts: [], sources: [], findings: [],
      rollups: { activeAgents: 0, pausedAgents: 0, queuedRuns: 0, activeRuns: 0, failedRuns: 0, sourcesThisMonth: 0, opportunitiesThisMonth: 0, tavilyCreditsThisMonth: 0, openrouterRequestsThisMonth: 0, pendingAlerts: 0 },
    }
  }
}

export async function getResearchAgent(agentIdOrCode: string) {
  const supabase = await createServiceClient() as any
  let query = supabase.from(TABLES.agents).select('*')
  query = agentIdOrCode.includes('-') ? query.eq('id', agentIdOrCode) : query.eq('code', agentIdOrCode)
  const result = await query.maybeSingle()
  if (result.error) throw result.error
  return result.data as ResearchAgent | null
}

export async function getProviderPolicies() {
  const supabase = await createServiceClient() as any
  const result = await supabase.from(TABLES.providers).select('*')
  if (result.error) throw result.error
  return list<ResearchProviderPolicy>(result.data)
}

export async function saveProviderPolicy(input: {
  actorId: string
  actorName: string
  providerKey: string
  status?: string
  enabled?: boolean
  configuration?: JsonRecord
  limits?: JsonRecord
  health?: JsonRecord
  tested?: boolean
}) {
  const supabase = await createServiceClient() as any
  const currentResult = await supabase.from(TABLES.providers).select('*').eq('provider_key', input.providerKey).maybeSingle()
  if (currentResult.error) throw currentResult.error
  const current = currentResult.data as ResearchProviderPolicy | null
  if (!current) throw new Error('RESEARCH_PROVIDER_POLICY_NOT_FOUND')
  const payload = {
    status: input.status ?? current.status,
    enabled: input.enabled ?? current.enabled,
    configuration: input.configuration ? { ...record(current.configuration), ...input.configuration } : current.configuration,
    limits: input.limits ? { ...record(current.limits), ...input.limits } : current.limits,
    health: input.health ? { ...record(current.health), ...input.health } : current.health,
    version_number: Number(current.version_number || 1) + 1,
    updated_by: input.actorId || null,
    updated_by_name: input.actorName,
    last_tested_at: input.tested ? new Date().toISOString() : current.last_tested_at,
    updated_at: new Date().toISOString(),
  }
  const result = await supabase.from(TABLES.providers).update(payload).eq('id', current.id).select('*').single()
  if (result.error) throw result.error
  await audit({ actorId: input.actorId, actorName: input.actorName, action: 'research.provider_policy_updated', entityType: 'research_provider_policy', entityId: current.id, before: current, after: result.data })
  return result.data as ResearchProviderPolicy
}

export async function saveResearchAgent(input: {
  actorId: string
  actorName: string
  agentId: string
  patch: JsonRecord
  reason?: string
}) {
  const supabase = await createServiceClient() as any
  const currentResult = await supabase.from(TABLES.agents).select('*').eq('id', input.agentId).single()
  if (currentResult.error) throw currentResult.error
  const current = currentResult.data as ResearchAgent
  const allowed = new Set([
    'name', 'purpose', 'owner_name', 'status', 'priority', 'workspace_scopes', 'content_families', 'services', 'audiences', 'cities', 'languages', 'topics', 'excluded_topics',
    'provider_policy', 'schedule_policy', 'quota_policy', 'research_policy', 'analysis_policy', 'materialization_policy', 'approval_boundary', 'next_run_at',
  ])
  const patch = Object.fromEntries(Object.entries(input.patch).filter(([key]) => allowed.has(key)))
  if ('schedule_policy' in patch) {
    patch.next_run_at = calculateNextRunAt(patch.schedule_policy)
  } else if (patch.status === 'active' && !current.next_run_at) {
    patch.next_run_at = calculateNextRunAt(current.schedule_policy)
  } else if (patch.status === 'paused' || patch.status === 'retired') {
    patch.next_run_at = null
  }
  const payload = {
    ...patch,
    policy_version: Number(current.policy_version || 1) + 1,
    updated_by: input.actorId || null,
    updated_by_name: input.actorName,
    updated_at: new Date().toISOString(),
  }
  const result = await supabase.from(TABLES.agents).update(payload).eq('id', input.agentId).select('*').single()
  if (result.error) throw result.error
  const versionInsert = await supabase.from(TABLES.versions).insert({
    agent_id: input.agentId,
    version_number: payload.policy_version,
    policy_snapshot: result.data,
    change_reason: input.reason || 'Configuration mise à jour depuis Contrôle Recherche IA.',
    created_by: input.actorId || null,
    created_by_name: input.actorName,
  })
  if (versionInsert.error) throw versionInsert.error
  await audit({ actorId: input.actorId, actorName: input.actorName, action: 'research.agent_policy_updated', entityType: 'research_agent', entityId: input.agentId, before: current, after: result.data, reason: input.reason })
  return result.data as ResearchAgent
}

export async function cloneResearchAgent(input: { actorId: string; actorName: string; agentId: string; code: string; name: string }) {
  const supabase = await createServiceClient() as any
  const currentResult = await supabase.from(TABLES.agents).select('*').eq('id', input.agentId).single()
  if (currentResult.error) throw currentResult.error
  const source = currentResult.data as ResearchAgent
  const { id: _id, created_at: _createdAt, updated_at: _updatedAt, ...copy } = source
  const result = await supabase.from(TABLES.agents).insert({
    ...copy,
    code: input.code,
    name: input.name,
    status: 'draft',
    policy_version: 1,
    last_run_at: null,
    next_run_at: null,
    created_by: input.actorId || null,
    created_by_name: input.actorName,
    updated_by: input.actorId || null,
    updated_by_name: input.actorName,
  }).select('*').single()
  if (result.error) throw result.error
  await supabase.from(TABLES.versions).insert({ agent_id: result.data.id, version_number: 1, policy_snapshot: result.data, change_reason: `Cloné depuis ${source.code}.`, created_by: input.actorId || null, created_by_name: input.actorName })
  await audit({ actorId: input.actorId, actorName: input.actorName, action: 'research.agent_cloned', entityType: 'research_agent', entityId: result.data.id, after: result.data })
  return result.data as ResearchAgent
}



export async function claimDueResearchAgents(limit = 4) {
  const supabase = await createServiceClient() as any
  const now = new Date().toISOString()
  const candidates = await supabase
    .from(TABLES.agents)
    .select('*')
    .eq('status', 'active')
    .not('next_run_at', 'is', null)
    .lte('next_run_at', now)
    .order('next_run_at', { ascending: true })
    .limit(Math.max(1, Math.min(12, limit * 2)))
  if (candidates.error) throw candidates.error

  const claimed: ResearchAgent[] = []
  for (const agent of list<ResearchAgent>(candidates.data)) {
    if (claimed.length >= limit || !agent.next_run_at) break
    const leaseUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    const result = await supabase
      .from(TABLES.agents)
      .update({ next_run_at: leaseUntil, updated_at: new Date().toISOString() })
      .eq('id', agent.id)
      .eq('status', 'active')
      .eq('next_run_at', agent.next_run_at)
      .select('*')
      .maybeSingle()
    if (result.error) throw result.error
    if (result.data) claimed.push(result.data as ResearchAgent)
  }
  return claimed
}

export async function createResearchRun(input: {
  actorId: string
  actorName: string
  agent: ResearchAgent
  objective: string
  query: string
  priority: string
  triggerType: string
  overridePolicy?: JsonRecord
}) {
  const supabase = await createServiceClient() as any
  const result = await supabase.from(TABLES.runs).insert({
    agent_id: input.agent.id,
    agent_code: input.agent.code,
    research_command: input.agent.name,
    objective: input.objective,
    query: input.query,
    status: 'queued',
    priority: input.priority,
    trigger_type: input.triggerType,
    provider_stage: 'queued',
    requested_by: input.actorId || null,
    requested_by_name: input.actorName,
    override_policy: input.overridePolicy || {},
  }).select('*').single()
  if (result.error) throw result.error
  await recordRunEvent({ runId: result.data.id, eventType: 'run.created', stage: 'queued', message: 'Commande de recherche enregistrée.', detail: { agentCode: input.agent.code, priority: input.priority } })
  return result.data as ResearchRun
}

export async function updateResearchRun(runId: string, patch: JsonRecord) {
  const supabase = await createServiceClient() as any
  const result = await supabase.from(TABLES.runs).update({ ...patch, updated_at: new Date().toISOString() }).eq('id', runId).select('*').single()
  if (result.error) throw result.error
  return result.data as ResearchRun
}

export async function recordRunEvent(input: { runId: string; eventType: string; stage: string; message: string; detail?: JsonRecord }) {
  const supabase = await createServiceClient() as any
  const result = await supabase.from(TABLES.events).insert({ run_id: input.runId, event_type: input.eventType, stage: input.stage, message: input.message, detail: input.detail || {} }).select('*').single()
  if (result.error) throw result.error
  return result.data as ResearchRunEvent
}

export async function recordUsage(input: { providerKey: string; agentId?: string | null; runId?: string | null; metricType: string; quantity: number; unit: string; detail?: JsonRecord }) {
  const supabase = await createServiceClient() as any
  const result = await supabase.from(TABLES.usage).insert({
    provider_key: input.providerKey,
    agent_id: input.agentId || null,
    run_id: input.runId || null,
    metric_type: input.metricType,
    quantity: input.quantity,
    unit: input.unit,
    period_key: periodKey(),
    detail: input.detail || {},
  })
  if (result.error) throw result.error
}

export async function getUsageQuantity(input: { providerKey: string; agentId?: string | null; metricType: string; since: string }) {
  const supabase = await createServiceClient() as any
  let query = supabase.from(TABLES.usage).select('quantity').eq('provider_key', input.providerKey).eq('metric_type', input.metricType).gte('created_at', input.since)
  if (input.agentId) query = query.eq('agent_id', input.agentId)
  const result = await query
  if (result.error) throw result.error
  return list<{ quantity: number }>(result.data).reduce((sum, row) => sum + Number(row.quantity || 0), 0)
}

export async function createResearchAlert(input: { providerKey?: string | null; agentId?: string | null; runId?: string | null; alertType: string; severity: string; title: string; message: string; detail?: JsonRecord }) {
  const supabase = await createServiceClient() as any
  const result = await supabase.from(TABLES.alerts).insert({
    provider_key: input.providerKey || null,
    agent_id: input.agentId || null,
    run_id: input.runId || null,
    alert_type: input.alertType,
    severity: input.severity,
    title: input.title,
    message: input.message,
    detail: input.detail || {},
    status: 'open',
  }).select('*').single()
  if (result.error) throw result.error
  return result.data as ResearchAlert
}

export async function acknowledgeResearchAlert(input: { actorId: string; actorName: string; alertId: string }) {
  const supabase = await createServiceClient() as any
  const result = await supabase.from(TABLES.alerts).update({ status: 'acknowledged', acknowledged_by: input.actorId || null, acknowledged_by_name: input.actorName, acknowledged_at: new Date().toISOString() }).eq('id', input.alertId).select('*').single()
  if (result.error) throw result.error
  await audit({ actorId: input.actorId, actorName: input.actorName, action: 'research.alert_acknowledged', entityType: 'research_alert', entityId: input.alertId, after: result.data })
  return result.data as ResearchAlert
}

export async function persistCanonicalSources(input: {
  runId: string
  query: string
  provider: string
  sources: TavilySearchResult[]
}) {
  const supabase = await createServiceClient() as any
  const persisted: CanonicalPublicSource[] = []
  for (let index = 0; index < input.sources.length; index += 1) {
    const source = input.sources[index]
    const normalizedUrl = normalizeUrl(source.url)
    const urlHash = hash(normalizedUrl)
    const contentExcerpt = (source.rawContent || source.content || '').slice(0, 24000)
    const contentHash = hash(contentExcerpt || `${source.title}:${normalizedUrl}`)
    const publisher = (() => {
      try { return new URL(normalizedUrl).hostname.replace(/^www\./, '') } catch { return null }
    })()
    const row = {
      canonical_url: source.url,
      normalized_url: normalizedUrl,
      title: source.title,
      publisher,
      retrieved_at: new Date().toISOString(),
      research_query: input.query,
      snippet: source.content.slice(0, 4000),
      content_excerpt: contentExcerpt,
      source_provider: input.provider,
      provider_rank: index + 1,
      origin_module: 'market_os_content_command',
      origin_workspace: 'ai_director_research_control',
      research_run_id: input.runId,
      url_hash: urlHash,
      content_hash: contentHash,
      language: null,
      country: 'MA',
      source_type: 'public_web',
      credibility_state: 'unreviewed',
      freshness_state: 'current_at_retrieval',
      rights_state: 'reference_only',
      raw_metadata: { searchScore: source.score, favicon: source.favicon },
      last_seen_at: new Date().toISOString(),
    }
    const result = await supabase.from(TABLES.sources).upsert(row, { onConflict: 'url_hash' }).select('*').single()
    if (result.error) throw result.error
    persisted.push(result.data as CanonicalPublicSource)
  }
  return persisted
}

function combinedScore(finding: StructuredResearchFinding) {
  return Math.round((finding.relevanceScore * 0.3) + (finding.businessFitScore * 0.3) + (finding.urgencyScore * 0.15) + (finding.evidenceConfidence * 0.25))
}

export async function persistResearchFindings(input: {
  actorId: string
  runId: string
  agent: ResearchAgent
  findings: StructuredResearchFinding[]
  sources: CanonicalPublicSource[]
  minimumOpportunityScore: number
  minimumEvidenceConfidence: number
  minimumRelevance: number
  minimumBusinessFit: number
  materialization: {
    createSignals: boolean
    createContentOpportunities: boolean
    createInternalTasks: boolean
    alertCommandement: boolean
  }
}) {
  const supabase = await createServiceClient() as any
  const createdFindings: ResearchFinding[] = []
  let signalCount = 0
  let internalActionCount = 0

  for (const finding of input.findings) {
    const sourceIds = finding.sourceIndexes.flatMap((index) => input.sources[index]?.id ? [input.sources[index].id] : [])
    if (!sourceIds.length) continue
    const score = combinedScore(finding)
    const evidenceBacked = finding.evidenceConfidence >= input.minimumEvidenceConfidence
      && finding.relevanceScore >= input.minimumRelevance
      && finding.businessFitScore >= input.minimumBusinessFit
    const insert = await supabase.from(TABLES.findings).insert({
      run_id: input.runId,
      agent_id: input.agent.id,
      finding_type: finding.findingType,
      title: finding.title,
      description: finding.description,
      evidence_summary: finding.evidenceSummary,
      source_ids: sourceIds,
      services: finding.services,
      audiences: finding.audiences,
      cities: finding.cities,
      channels: finding.channels,
      relevance_score: finding.relevanceScore,
      business_fit_score: finding.businessFitScore,
      urgency_score: finding.urgencyScore,
      evidence_confidence: finding.evidenceConfidence,
      combined_score: score,
      recommended_internal_action: finding.recommendedInternalAction,
      limitations: finding.limitations,
      unknowns: finding.unknowns,
      status: evidenceBacked ? 'evidence_backed' : 'detected',
    }).select('*').single()
    if (insert.error) throw insert.error
    let findingRow = insert.data as ResearchFinding

    const materializeAsSignal = input.materialization.createSignals
      && evidenceBacked
      && (finding.findingType === 'signal' || finding.findingType === 'communication_risk' || finding.findingType === 'editorial_window')
    const materializeAsOpportunity = input.materialization.createContentOpportunities
      && evidenceBacked
      && finding.findingType === 'content_opportunity'
      && score >= input.minimumOpportunityScore

    if (materializeAsSignal || materializeAsOpportunity) {
      const duplicate = await supabase.from('market_content_signals').select('id').eq('title', finding.title).gte('detected_at', new Date(Date.now() - 30 * 86400000).toISOString()).limit(1)
      if (duplicate.error) throw duplicate.error
      if (!Array.isArray(duplicate.data) || duplicate.data.length === 0) {
        const codeResult = await supabase.rpc('market_content_next_code', { p_prefix: materializeAsOpportunity ? 'OPP' : 'SIG' })
        if (codeResult.error) throw codeResult.error
        const source = input.sources[finding.sourceIndexes[0]]
        const signal = await supabase.from('market_content_signals').insert({
          code: String(codeResult.data),
          title: finding.title,
          summary: finding.description,
          source_type: 'tavily_openrouter_research',
          source_label: source?.publisher || source?.title || 'Source canonique AC Capital',
          source_url: source?.canonical_url || null,
          status: evidenceBacked ? 'qualified' : 'enriching',
          confidence: finding.evidenceConfidence,
          urgency: finding.urgencyScore,
          opportunity_score: score,
          freshness: 'current_at_retrieval',
          services: finding.services,
          audiences: finding.audiences,
          cities: finding.cities,
          evidence: sourceIds.map((sourceId) => ({ sourceId, authority: 'ac_capital_public_source_registry' })),
          ai_interpretation: finding.evidenceSummary,
          created_by: input.actorId || null,
        }).select('id').single()
        if (signal.error) throw signal.error
        const findingUpdate = await supabase.from(TABLES.findings).update({ materialized_signal_id: signal.data.id, status: materializeAsOpportunity ? 'qualified' : 'materialized' }).eq('id', findingRow.id).select('*').single()
        if (findingUpdate.error) throw findingUpdate.error
        findingRow = findingUpdate.data as ResearchFinding
        signalCount += 1
      }
    }

    if (input.materialization.createInternalTasks && finding.recommendedInternalAction) {
      const action = await supabase.from('market_ai_action_queue').insert({
        run_id: null,
        mission_id: null,
        command_code: `RESEARCH-${input.agent.code}`,
        action_type: finding.findingType === 'evidence_gap' ? 'request_review' : 'create_task_plan',
        title: finding.recommendedInternalAction,
        description: `${finding.title} — ${finding.description}`,
        requires_approval: false,
        payload: {
          researchRunId: input.runId,
          researchFindingId: findingRow.id,
          sourceIds,
          workspace: 'content_command',
          externalActionAllowed: false,
        },
        status: 'prepared',
        created_by: input.actorId || null,
      })
      if (action.error) throw action.error
      internalActionCount += 1
    }

    createdFindings.push(findingRow)
  }

  if (input.materialization.alertCommandement && createdFindings.some((finding) => finding.urgency_score >= 80 || finding.finding_type === 'communication_risk')) {
    await createResearchAlert({
      agentId: input.agent.id,
      runId: input.runId,
      alertType: 'content_intelligence_intervention',
      severity: 'high',
      title: 'Intervention Content Command requise',
      message: 'La recherche a produit au moins un risque de communication ou un constat à forte urgence.',
      detail: { findingIds: createdFindings.filter((finding) => finding.urgency_score >= 80 || finding.finding_type === 'communication_risk').map((finding) => finding.id) },
    })
  }

  return { findings: createdFindings, signalCount, internalActionCount }
}

export async function markAgentRunCompleted(input: { agentId: string; nextRunAt?: string | null }) {
  const supabase = await createServiceClient() as any
  const result = await supabase.from(TABLES.agents).update({ last_run_at: new Date().toISOString(), next_run_at: input.nextRunAt || null, updated_at: new Date().toISOString() }).eq('id', input.agentId)
  if (result.error) throw result.error
}

export async function getAuditTimeline(limit = 120) {
  const supabase = await createServiceClient() as any
  const result = await supabase.from(TABLES.audit).select('*').order('created_at', { ascending: false }).limit(limit)
  if (result.error) throw result.error
  return list<Record<string, unknown>>(result.data)
}

export function defaultProviderConfiguration() {
  return publicContentResearchDefaults()
}

export function normalizeAgentPatch(value: unknown): JsonRecord {
  const patch = record(value)
  for (const key of ['workspace_scopes', 'content_families', 'services', 'audiences', 'cities', 'languages', 'topics', 'excluded_topics']) {
    if (key in patch) patch[key] = stringList(patch[key])
  }
  return patch
}

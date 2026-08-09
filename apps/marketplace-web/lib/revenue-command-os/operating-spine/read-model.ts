import 'server-only'

import { createServiceClient } from '@/lib/supabase/server'
import { publicRevenueOsMessage } from '../errors'
import type {
  RevenueAiRunLedger,
  RevenueBoardBrief,
  RevenueCompilationLedger,
  RevenueCouncilLedger,
  RevenueDecisionLedger,
  RevenueExecutionLedger,
  RevenueOperatingObjective,
  RevenueOperatingSpineSnapshot,
  RevenueOperatingStage,
  RevenueOperatingStrategy,
  RevenueOutcomeLedger,
} from './types'

type Row = Record<string, any>

type SourceKey =
  | 'installations'
  | 'foundationObjectives'
  | 'strategyObjectives'
  | 'aiJobs'
  | 'aiAttempts'
  | 'assemblyRuns'
  | 'contextSnapshots'
  | 'commandSelections'
  | 'toolTraces'
  | 'modelRuns'
  | 'strategies'
  | 'comparisons'
  | 'councilRuns'
  | 'councilFindings'
  | 'councilContradictions'
  | 'councilClassifications'
  | 'approvalRequests'
  | 'approvalDecisions'
  | 'approvalConditions'
  | 'compilationRuns'
  | 'compilationConflicts'
  | 'propagationPackages'
  | 'programs'
  | 'campaigns'
  | 'waves'
  | 'missions'
  | 'tasks'
  | 'propagationRuns'
  | 'adapterRegistry'
  | 'adapterHealth'
  | 'executionActions'
  | 'executionResults'
  | 'deadLetters'
  | 'strategyOutcomes'
  | 'experiments'
  | 'attributionEvents'
  | 'outcomeFeedback'
  | 'winningPlayScaling'
  | 'cockpitExceptions'

interface QuerySpec {
  key: SourceKey
  table: string
  tenantScoped?: boolean
  order?: string
  limit?: number
}

const SPECS: QuerySpec[] = [
  { key: 'installations', table: 'revenue_os_installations', limit: 2, order: 'updated_at' },
  { key: 'foundationObjectives', table: 'revenue_os_objectives', limit: 30, order: 'updated_at' },
  { key: 'strategyObjectives', table: 'revenue_os_strategy_objectives', tenantScoped: true, limit: 30, order: 'updated_at' },
  { key: 'aiJobs', table: 'revenue_os_ai_jobs', tenantScoped: true, limit: 60, order: 'updated_at' },
  { key: 'aiAttempts', table: 'revenue_os_ai_run_attempts', tenantScoped: true, limit: 120, order: 'created_at' },
  { key: 'assemblyRuns', table: 'revenue_os_strategy_assembly_runs', tenantScoped: true, limit: 60, order: 'updated_at' },
  { key: 'contextSnapshots', table: 'revenue_os_strategy_context_snapshots', tenantScoped: true, limit: 60, order: 'updated_at' },
  { key: 'commandSelections', table: 'revenue_os_strategy_command_selections', tenantScoped: true, limit: 300, order: 'created_at' },
  { key: 'toolTraces', table: 'revenue_os_strategy_tool_traces', tenantScoped: true, limit: 120, order: 'created_at' },
  { key: 'modelRuns', table: 'revenue_os_strategy_model_runs', tenantScoped: true, limit: 80, order: 'updated_at' },
  { key: 'strategies', table: 'revenue_os_strategies', tenantScoped: true, limit: 80, order: 'updated_at' },
  { key: 'comparisons', table: 'revenue_os_strategy_comparisons', tenantScoped: true, limit: 40, order: 'created_at' },
  { key: 'councilRuns', table: 'revenue_os_council_runs', tenantScoped: true, limit: 60, order: 'updated_at' },
  { key: 'councilFindings', table: 'revenue_os_council_findings', tenantScoped: true, limit: 240, order: 'created_at' },
  { key: 'councilContradictions', table: 'revenue_os_council_contradictions', tenantScoped: true, limit: 120, order: 'created_at' },
  { key: 'councilClassifications', table: 'revenue_os_council_classifications', tenantScoped: true, limit: 80, order: 'updated_at' },
  { key: 'approvalRequests', table: 'revenue_os_approval_requests', tenantScoped: true, limit: 100, order: 'updated_at' },
  { key: 'approvalDecisions', table: 'revenue_os_approval_decisions', tenantScoped: true, limit: 100, order: 'created_at' },
  { key: 'approvalConditions', table: 'revenue_os_approval_conditions', tenantScoped: true, limit: 240, order: 'created_at' },
  { key: 'compilationRuns', table: 'revenue_os_compilation_runs', tenantScoped: true, limit: 60, order: 'updated_at' },
  { key: 'compilationConflicts', table: 'revenue_os_compilation_conflicts', tenantScoped: true, limit: 120, order: 'updated_at' },
  { key: 'propagationPackages', table: 'revenue_os_propagation_packages', tenantScoped: true, limit: 80, order: 'updated_at' },
  { key: 'programs', table: 'revenue_os_programs', tenantScoped: true, limit: 100, order: 'updated_at' },
  { key: 'campaigns', table: 'revenue_os_campaigns', tenantScoped: true, limit: 180, order: 'updated_at' },
  { key: 'waves', table: 'revenue_os_campaign_waves', tenantScoped: true, limit: 240, order: 'updated_at' },
  { key: 'missions', table: 'revenue_os_missions', tenantScoped: true, limit: 240, order: 'updated_at' },
  { key: 'tasks', table: 'revenue_os_mission_tasks', tenantScoped: true, limit: 500, order: 'updated_at' },
  { key: 'propagationRuns', table: 'revenue_os_propagation_runs', tenantScoped: true, limit: 100, order: 'updated_at' },
  { key: 'adapterRegistry', table: 'revenue_os_adapter_registry', limit: 80, order: 'updated_at' },
  { key: 'adapterHealth', table: 'revenue_os_adapter_health', tenantScoped: true, limit: 100, order: 'checked_at' },
  { key: 'executionActions', table: 'revenue_os_execution_actions', tenantScoped: true, limit: 300, order: 'updated_at' },
  { key: 'executionResults', table: 'revenue_os_execution_results', tenantScoped: true, limit: 180, order: 'created_at' },
  { key: 'deadLetters', table: 'revenue_os_execution_dead_letters', tenantScoped: true, limit: 80, order: 'created_at' },
  { key: 'strategyOutcomes', table: 'revenue_os_strategy_outcomes', tenantScoped: true, limit: 100, order: 'updated_at' },
  { key: 'experiments', table: 'revenue_os_experiments', tenantScoped: true, limit: 100, order: 'updated_at' },
  { key: 'attributionEvents', table: 'revenue_os_attribution_events', tenantScoped: true, limit: 160, order: 'created_at' },
  { key: 'outcomeFeedback', table: 'revenue_os_outcome_feedback', tenantScoped: true, limit: 120, order: 'created_at' },
  { key: 'winningPlayScaling', table: 'revenue_os_winning_play_scaling', tenantScoped: true, limit: 80, order: 'updated_at' },
  { key: 'cockpitExceptions', table: 'revenue_os_cockpit_exceptions', tenantScoped: true, limit: 120, order: 'updated_at' },
]

function payload(row?: Row | null): Record<string, any> {
  if (!row) return {}
  return row.payload && typeof row.payload === 'object' ? row.payload : row
}

function stringValue(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return ''
}

function numberValue(...values: unknown[]): number {
  for (const value of values) {
    const number = Number(value)
    if (Number.isFinite(number)) return number
  }
  return 0
}

function arrayValue(value: unknown): any[] {
  return Array.isArray(value) ? value : []
}

function stringArray(value: unknown): string[] {
  return arrayValue(value).map(String).map((item) => item.trim()).filter(Boolean)
}

function latestForObjective(rows: Row[], objectiveId?: string): Row | undefined {
  if (!objectiveId) return rows[0]
  return rows.find((row) => String(row.objective_id || payload(row).objectiveId || '') === objectiveId) || rows[0]
}

function latestForStrategy(rows: Row[], strategyId?: string): Row | undefined {
  if (!strategyId) return rows[0]
  return rows.find((row) => String(row.strategy_id || payload(row).strategyId || '') === strategyId) || rows[0]
}

async function loadSources(tenantId: string) {
  const client = await createServiceClient() as any
  const data: Record<SourceKey, Row[]> = {} as Record<SourceKey, Row[]>
  const sourceHealth: RevenueOperatingSpineSnapshot['sourceHealth'] = {}

  await Promise.all(SPECS.map(async (spec) => {
    try {
      let query = client.from(spec.table).select('*')
      if (spec.tenantScoped) query = query.eq('tenant_id', tenantId)
      if (spec.table === 'revenue_os_installations') query = query.eq('installation_key', 'revenue-command-os')
      if (spec.order) query = query.order(spec.order, { ascending: false })
      const response = await query.limit(spec.limit || 100)
      if (response.error) throw response.error
      data[spec.key] = response.data || []
      sourceHealth[spec.key] = { ok: true }
    } catch (error) {
      data[spec.key] = []
      sourceHealth[spec.key] = {
        ok: false,
        message: publicRevenueOsMessage(error instanceof Error ? error.message : String(error)),
      }
    }
  }))

  return { data, sourceHealth }
}

function objectiveOf(rows: Record<SourceKey, Row[]>): RevenueOperatingObjective | null {
  const strategyRow = rows.strategyObjectives[0]
  const strategyPayload = payload(strategyRow)
  if (strategyRow) {
    return {
      id: stringValue(strategyPayload.id, strategyRow.objective_id, strategyRow.id),
      title: stringValue(strategyPayload.title, 'Objectif revenu'),
      mandate: stringValue(strategyPayload.businessReason, strategyPayload.mandate, strategyPayload.title),
      businessUnit: stringArray(strategyPayload.businessUnits)[0] || 'AngelCare',
      targetMarket: stringArray(strategyPayload.targetMarkets)[0] || 'Marché cible',
      targetSegments: stringArray(strategyPayload.targetSegments),
      territories: stringArray(strategyPayload.territories),
      revenueTarget: strategyPayload.revenueTarget == null ? undefined : numberValue(strategyPayload.revenueTarget),
      marginTarget: strategyPayload.marginTarget == null ? undefined : numberValue(strategyPayload.marginTarget),
      horizon: stringValue(strategyPayload.timeHorizon, strategyPayload.horizon, 'Non renseigné'),
      priority: stringValue(strategyPayload.priority, 'normal'),
      status: stringValue(strategyPayload.status, strategyRow.status, 'draft'),
      owner: stringValue(strategyPayload.requestedBy, 'Direction Revenue'),
      updatedAt: stringValue(strategyRow.updated_at, strategyRow.created_at),
      raw: strategyPayload,
    }
  }

  const row = rows.foundationObjectives[0]
  if (!row) return null
  return {
    id: String(row.id),
    title: stringValue(row.title, 'Objectif revenu'),
    mandate: stringValue(row.mandate, row.title),
    businessUnit: stringValue(row.business_unit, 'AngelCare'),
    targetMarket: stringValue(row.target_market, 'Marché cible'),
    targetSegments: [],
    territories: [stringValue(row.target_market)].filter(Boolean),
    horizon: stringValue(row.horizon, 'Non renseigné'),
    priority: stringValue(row.priority, 'high'),
    status: stringValue(row.status, 'draft'),
    owner: stringValue(row.owner_label, row.owner_id, 'Direction Revenue'),
    updatedAt: stringValue(row.updated_at, row.created_at),
    raw: row,
  }
}

function strategiesOf(rows: Record<SourceKey, Row[]>, objectiveId?: string): RevenueOperatingStrategy[] {
  const relevant = objectiveId
    ? rows.strategies.filter((row) => String(row.objective_id || payload(row).objectiveId || '') === objectiveId)
    : rows.strategies
  const comparison = payload(latestForObjective(rows.comparisons, objectiveId))
  const recommendation = String(comparison.recommendation || '')

  return relevant.slice(0, 20).map((row, index) => {
    const value = payload(row)
    const status = stringValue(value.status, row.status, 'draft')
    const id = stringValue(value.id, row.strategy_id, row.id)
    const code = stringValue(value.code, `STRATEGY-${String(index + 1).padStart(2, '0')}`)
    const predictedResults = value.predictedResults && typeof value.predictedResults === 'object'
      ? value.predictedResults as Record<string, Record<string, number>>
      : {}
    return {
      id,
      code,
      title: stringValue(value.title, value.thesis, code),
      version: stringValue(value.version, row.version, '1'),
      status,
      thesis: stringValue(value.thesis, value.objective, 'Thèse non renseignée'),
      archetype: stringValue(value.archetype, 'Strategic option'),
      confidence: Math.round(numberValue(value.confidence) * (numberValue(value.confidence) <= 1 ? 100 : 1)),
      targetMarkets: stringArray(value.targetMarket || value.targetMarkets),
      targetSegments: stringArray(value.targetSegments),
      territories: stringArray(value.territories),
      valueProposition: stringValue(value.valueProposition, 'Non renseignée'),
      predictedResults,
      risks: arrayValue(value.risks),
      assumptions: arrayValue(value.assumptions),
      commandPortfolio: arrayValue(value.commandPortfolio),
      scenarios: arrayValue(value.scenarios),
      evidenceCount: arrayValue(value.trustEvidence).length,
      recommended: Boolean(value.recommended) || recommendation.includes(id) || recommendation.includes(code),
      councilEligible: ['ready_for_council', 'candidate', 'ready_for_comparison'].includes(status),
      approved: status.includes('approved') || status === 'selected',
      raw: value,
    }
  })
}

function aiRunsOf(rows: Record<SourceKey, Row[]>, objectiveId?: string): RevenueAiRunLedger[] {
  const jobs = objectiveId
    ? rows.aiJobs.filter((row) => String(row.objective_id || '') === objectiveId)
    : rows.aiJobs
  return jobs.slice(0, 20).map((job) => {
    const jobPayload = payload(job)
    const attempt = rows.aiAttempts.find((row) => String(row.run_id || '') === String(job.id))
    const attemptPayload = payload(attempt)
    const assembly = rows.assemblyRuns.find((row) => String(row.id) === String(job.id))
    const assemblyPayload = payload(assembly)
    const trace = rows.toolTraces.find((row) => String(payload(row).runId || row.objective_id || '') === String(job.id))
    const tracePayload = payload(trace)
    const selections = rows.commandSelections.filter((row) =>
      String(payload(row).runId || '') === String(job.id)
      || String(row.objective_id || '') === String(job.objective_id || ''),
    )
    const context = payload(latestForObjective(rows.contextSnapshots, String(job.objective_id || '')))
    const resources = stringArray(tracePayload.localResources || assemblyPayload.localResources)
    const startedAt = stringValue(job.created_at)
    const completedAt = stringValue(job.completed_at, job.updated_at)
    return {
      id: String(job.id),
      objectiveId: stringValue(job.objective_id),
      status: stringValue(job.status, 'unknown'),
      provider: stringValue(attempt?.provider, jobPayload.provider, assemblyPayload.provider, 'Gemini'),
      model: stringValue(attempt?.model, jobPayload.model, assemblyPayload.model, 'Non renseigné'),
      promptCode: stringValue(attempt?.prompt_code, assemblyPayload.promptCode),
      promptVersion: stringValue(attempt?.prompt_version, assemblyPayload.promptVersion),
      startedAt,
      completedAt,
      durationMs: numberValue(attempt?.latency_ms, assemblyPayload.latencyMs),
      inputTokens: numberValue(attempt?.input_tokens),
      outputTokens: numberValue(attempt?.output_tokens),
      fallbackUsed: Boolean(attempt?.fallback_used || assemblyPayload.fallbackUsed),
      error: stringValue(job.error_message, attempt?.error_message) || undefined,
      strategyCount: numberValue(jobPayload.strategyCount, assemblyPayload.strategyCount),
      selectedCommandCount: numberValue(assemblyPayload.selectedCommandCount, selections.length),
      contextFactCount: numberValue(assemblyPayload.contextFactCount, arrayValue(context.facts).length),
      hypothesisCount: numberValue(assemblyPayload.hypothesisCount, arrayValue(context.hypotheses).length),
      unknownCount: numberValue(assemblyPayload.unknownCount, arrayValue(context.unknowns).length),
      contradictionCount: numberValue(assemblyPayload.contradictionCount, arrayValue(context.contradictions).length),
      localResources: resources,
      providerNativeToolCalls: numberValue(tracePayload.providerNativeToolCalls, assemblyPayload.providerNativeToolCalls),
      externalActions: numberValue(attempt?.external_actions, jobPayload.externalActions),
    }
  })
}

function councilOf(rows: Record<SourceKey, Row[]>, strategyId?: string): RevenueCouncilLedger {
  const run = latestForStrategy(rows.councilRuns, strategyId)
  const value = payload(run)
  const resolvedStrategyId = stringValue(run?.strategy_id, value.strategyId, strategyId)
  const findings = rows.councilFindings.filter((row) => !resolvedStrategyId || String(row.strategy_id || payload(row).strategyId || '') === resolvedStrategyId)
  const contradictions = rows.councilContradictions.filter((row) => !resolvedStrategyId || String(row.strategy_id || payload(row).strategyId || '') === resolvedStrategyId)
  const classificationRow = latestForStrategy(rows.councilClassifications, resolvedStrategyId)
  const classification = payload(classificationRow)
  const topFindings = findings.slice(0, 5).map((row) => stringValue(payload(row).title, payload(row).finding, payload(row).summary, row.status)).filter(Boolean)
  const blocking = findings.filter((row) => {
    const item = payload(row)
    return Boolean(item.blocking) || ['critical', 'blocker', 'blocking'].includes(stringValue(item.severity, row.status).toLowerCase())
  }).length
  const status = stringValue(run?.status, value.status, 'not_started')
  return {
    runId: run ? String(run.id) : undefined,
    strategyId: resolvedStrategyId || undefined,
    status,
    classification: stringValue(classification.classification, classification.status, classificationRow?.status) || undefined,
    completedAgents: numberValue(value.completedAgents, value.completed_agents, arrayValue(value.reviews).length),
    findings: findings.length,
    blockingFindings: blocking,
    contradictions: contradictions.length,
    topFindings,
    readyForDecision: Boolean(classification.readyForExecutiveReview) || ['eligible', 'approved', 'ready_for_executive_review', 'conditional'].includes(stringValue(classification.classification, classification.status).toLowerCase()),
    updatedAt: stringValue(run?.updated_at, run?.created_at) || undefined,
  }
}

function decisionOf(rows: Record<SourceKey, Row[]>, strategyId?: string): RevenueDecisionLedger {
  const request = latestForStrategy(rows.approvalRequests, strategyId)
  const resolvedStrategyId = stringValue(request?.strategy_id, payload(request).strategyId, strategyId)
  const decision = latestForStrategy(rows.approvalDecisions, resolvedStrategyId)
  const decisionPayload = payload(decision)
  const conditions = rows.approvalConditions
    .filter((row) => !request || String(row.approval_request_id || payload(row).approvalRequestId || '') === String(request.id))
    .map((row) => stringValue(payload(row).label, payload(row).condition, row.status))
    .filter(Boolean)
  return {
    requestId: request ? String(request.id) : undefined,
    decisionId: decision ? String(decision.id) : undefined,
    strategyId: resolvedStrategyId || undefined,
    status: stringValue(decision?.status, decisionPayload.status, request?.status, 'not_requested'),
    approvalClass: stringValue(decisionPayload.approvalClass, payload(request).approvalClass) || undefined,
    conditions,
    reason: stringValue(decisionPayload.reason, decisionPayload.motive, decisionPayload.note) || undefined,
    decidedBy: stringValue(decisionPayload.decidedBy, decision?.actor_id) || undefined,
    decidedAt: stringValue(decision?.created_at, decisionPayload.decidedAt) || undefined,
  }
}

function compilationOf(rows: Record<SourceKey, Row[]>, strategyId?: string): RevenueCompilationLedger {
  const run = latestForStrategy(rows.compilationRuns, strategyId)
  const value = payload(run)
  const runId = run ? String(run.id) : undefined
  const packageRow = rows.propagationPackages.find((row) =>
    String(row.compilation_run_id || payload(row).compilationRunId || '') === String(runId || ''),
  ) || rows.propagationPackages[0]
  const packageValue = payload(packageRow)
  const relevant = (source: Row[]) => runId
    ? source.filter((row) => String(row.compilation_run_id || payload(row).compilationRunId || '') === runId)
    : source
  return {
    runId,
    strategyId: stringValue(run?.strategy_id, value.strategyId, strategyId) || undefined,
    status: stringValue(run?.status, value.status, 'not_started'),
    packageId: packageRow ? stringValue(packageValue.id, packageRow.id) : undefined,
    generatedObjects: numberValue(value.generatedObjects, value.generated_objects),
    conflicts: relevant(rows.compilationConflicts).length,
    programs: relevant(rows.programs).length,
    campaigns: relevant(rows.campaigns).length,
    waves: relevant(rows.waves).length,
    missions: relevant(rows.missions).length,
    tasks: relevant(rows.tasks).length,
    updatedAt: stringValue(run?.updated_at, run?.created_at) || undefined,
  }
}

function executionOf(rows: Record<SourceKey, Row[]>, compilation: RevenueCompilationLedger, executionMode: string): RevenueExecutionLedger {
  const run = rows.propagationRuns.find((row) =>
    String(row.package_id || payload(row).packageId || '') === String(compilation.packageId || ''),
  ) || rows.propagationRuns[0]
  const allActions = rows.executionActions
  const actions = run
    ? allActions.filter((row) => String(row.propagation_run_id || payload(row).propagationRunId || '') === String(run.id))
    : allActions
  const statusCount = (statuses: string[]) => actions.filter((row) => statuses.includes(stringValue(row.status, payload(row).status).toLowerCase())).length
  const healthyAdapters = rows.adapterHealth.filter((row) => ['healthy', 'available', 'ready', 'operational'].includes(stringValue(row.status, payload(row).status).toLowerCase())).length
  return {
    packageId: compilation.packageId,
    propagationRunId: run ? String(run.id) : undefined,
    status: stringValue(run?.status, payload(run).status, compilation.packageId ? 'package_ready' : 'not_started'),
    executionMode,
    adaptersDeclared: rows.adapterRegistry.length,
    adaptersHealthy: healthyAdapters,
    prepared: statusCount(['prepared']),
    awaitingApproval: statusCount(['awaiting_approval', 'approval_required', 'pending_approval']),
    queued: statusCount(['queued']),
    executing: statusCount(['executing', 'running']),
    succeeded: statusCount(['succeeded', 'completed', 'success']),
    failed: statusCount(['failed', 'error']),
    deadLetters: rows.deadLetters.length,
    externalActions: actions.filter((row) => Boolean(row.external_action || payload(row).externalAction)).length,
    latestActions: actions.slice(0, 12).map((row) => {
      const value = payload(row)
      return {
        id: String(row.id),
        type: stringValue(value.actionType, row.action_type, value.type, 'Action gouvernée'),
        status: stringValue(row.status, value.status, 'unknown'),
        adapter: stringValue(value.adapterCode, row.adapter_code, 'internal'),
        target: stringValue(value.targetLabel, value.targetType, row.target_type, 'Objet interne'),
        externalAction: Boolean(row.external_action ?? value.controls?.externalAction ?? value.externalAction),
        approvalRequired: Boolean(row.approval_required ?? value.controls?.approvalRequired ?? value.approval?.required),
        lastError: stringValue(row.last_error, value.lastError) || undefined,
        updatedAt: stringValue(row.updated_at, row.created_at) || undefined,
      }
    }),
  }
}

function outcomesOf(rows: Record<SourceKey, Row[]>): RevenueOutcomeLedger {
  const latestOutcome = payload(rows.strategyOutcomes[0])
  const latestFeedback = payload(rows.outcomeFeedback[0])
  return {
    outcomes: rows.strategyOutcomes.length,
    experiments: rows.experiments.length,
    attributionEvents: rows.attributionEvents.length,
    feedbackRecords: rows.outcomeFeedback.length,
    winningPlays: rows.winningPlayScaling.length,
    latestOutcome: stringValue(latestOutcome.outcome, latestOutcome.summary, latestOutcome.title) || undefined,
    latestLearning: stringValue(latestFeedback.learning, latestFeedback.summary, latestFeedback.recommendation) || undefined,
  }
}

function expectedBenefitOf(strategy?: RevenueOperatingStrategy): string {
  if (!strategy) return 'Aucun bénéfice calculable avant assemblage stratégique.'
  const scenarios = Object.entries(strategy.predictedResults)
  if (!scenarios.length) return `Confiance analytique ${strategy.confidence}%; résultats chiffrés non disponibles dans le dossier actuel.`
  const [scenario, metrics] = scenarios[0]
  const visible = Object.entries(metrics || {}).slice(0, 3).map(([key, value]) => `${key}: ${value}`).join(' · ')
  return `${scenario}: ${visible || 'résultats à confirmer'}`
}

function executiveText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map(executiveText).filter(Boolean).join(' · ')
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    for (const key of ['message', 'detail', 'title', 'summary', 'code']) {
      const resolved = executiveText(record[key])
      if (resolved) return resolved
    }
    return Object.entries(record).slice(0, 4).map(([key, entry]) => `${key}: ${executiveText(entry) || 'non renseigné'}`).join(' · ')
  }
  return String(value)
}

function boardBriefOf(input: {
  objective: RevenueOperatingObjective | null
  aiRuns: RevenueAiRunLedger[]
  strategies: RevenueOperatingStrategy[]
  council: RevenueCouncilLedger
  decision: RevenueDecisionLedger
  compilation: RevenueCompilationLedger
  execution: RevenueExecutionLedger
  outcomes: RevenueOutcomeLedger
  warnings: string[]
}): RevenueBoardBrief {
  const { objective, aiRuns, strategies, council, decision, compilation, execution, outcomes, warnings } = input
  const leader = strategies.find((strategy) => strategy.recommended) || strategies[0]
  const latestRun = aiRuns[0]
  const tryingToWin = objective
    ? `${objective.title} — ${objective.mandate}`
    : 'Aucun mandat revenu gouverné n’est encore actif.'
  const engineWork = latestRun
    ? `Run ${latestRun.id.slice(0, 8)} ${latestRun.status}; ${latestRun.strategyCount} stratégie(s), ${latestRun.selectedCommandCount} commande(s) et ${latestRun.contextFactCount} fait(s) de contexte.`
    : 'Aucun run Gemini gouverné n’est enregistré pour le mandat courant.'
  const recommendation = leader
    ? `${leader.code} — ${leader.thesis}`
    : 'Aucune recommandation stratégique persistée.'
  const evidencePosition = leader
    ? `${leader.evidenceCount} preuve(s), ${leader.assumptions.length} hypothèse(s), ${leader.risks.length} risque(s), confiance ${leader.confidence}%.`
    : 'La position de preuve sera calculée après l’assemblage.'
  const normalizedWarnings = warnings.map(executiveText).filter(Boolean)
  const blockedOrAtRisk = normalizedWarnings.length
    ? normalizedWarnings[0]
    : council.blockingFindings
      ? `${council.blockingFindings} constat(s) Conseil bloquent la décision.`
      : execution.failed
        ? `${execution.failed} action(s) d’exécution sont en échec.`
        : execution.adaptersDeclared && execution.adaptersHealthy < execution.adaptersDeclared
          ? `${execution.adaptersHealthy}/${execution.adaptersDeclared} adaptateur(s) déclarés sains.`
          : 'Aucun blocage critique n’est visible dans le périmètre chargé.'
  let decisionRequired = 'Créer et lancer un mandat revenu gouverné.'
  let nextAction = 'Lancer une opération revenu.'
  if (objective && !strategies.length) {
    decisionRequired = 'Autoriser l’assemblage stratégique Gemini pour ce mandat.'
    nextAction = 'Assembler les stratégies.'
  } else if (leader && !council.runId) {
    decisionRequired = `Soumettre ${leader.code} au Conseil indépendant.`
    nextAction = 'Lancer le Conseil.'
  } else if (council.runId && !decision.decisionId) {
    decisionRequired = 'Arbitrer le dossier après lecture des conclusions du Conseil.'
    nextAction = 'Documenter la décision exécutive.'
  } else if (decision.decisionId && !compilation.runId) {
    decisionRequired = 'Transformer la stratégie approuvée en travail exécutable.'
    nextAction = 'Compiler le dossier.'
  } else if (compilation.packageId && !execution.propagationRunId) {
    decisionRequired = 'Préparer la propagation interne sous approbation.'
    nextAction = 'Préparer l’exécution gouvernée.'
  } else if (execution.propagationRunId && !outcomes.outcomes) {
    decisionRequired = 'Superviser les actions, preuves et premiers résultats.'
    nextAction = 'Contrôler l’exécution et l’attribution.'
  } else if (outcomes.outcomes) {
    decisionRequired = 'Décider de renforcer, corriger, arrêter ou étendre la stratégie.'
    nextAction = 'Examiner les résultats et l’apprentissage.'
  }
  return {
    tryingToWin,
    engineWork,
    recommendation,
    expectedBenefit: expectedBenefitOf(leader),
    evidencePosition,
    blockedOrAtRisk,
    decisionRequired,
    nextAction,
  }
}

function stagesOf(input: {
  objective: RevenueOperatingObjective | null
  aiRuns: RevenueAiRunLedger[]
  strategies: RevenueOperatingStrategy[]
  council: RevenueCouncilLedger
  decision: RevenueDecisionLedger
  compilation: RevenueCompilationLedger
  execution: RevenueExecutionLedger
  outcomes: RevenueOutcomeLedger
}): RevenueOperatingStage[] {
  const { objective, aiRuns, strategies, council, decision, compilation, execution, outcomes } = input
  const latestRun = aiRuns[0]
  return [
    {
      key: 'objective',
      label: 'Mandat',
      state: objective ? 'completed' : 'active',
      summary: objective?.title || 'Créer un objectif revenu précis.',
      count: objective ? 1 : 0,
      href: '/revenue-command-os/revenue-objectives',
      nextAction: objective ? 'Mandat disponible' : 'Créer le mandat',
    },
    {
      key: 'intelligence',
      label: 'Gemini & ressources',
      state: !objective ? 'waiting' : latestRun?.status === 'failed' ? 'blocked' : latestRun ? (latestRun.status === 'completed' ? 'completed' : 'active') : 'ready',
      summary: latestRun ? `${latestRun.status} · ${latestRun.contextFactCount} faits · ${latestRun.selectedCommandCount} commandes` : 'Assembler le contexte et lancer Gemini.',
      count: aiRuns.length,
      href: '/revenue-command-os/strategy-engine',
      blocker: latestRun?.error,
    },
    {
      key: 'strategy',
      label: 'Stratégies',
      state: strategies.length ? 'completed' : objective ? 'ready' : 'waiting',
      summary: strategies.length ? `${strategies.length} alternative(s) persistée(s).` : 'Aucune stratégie assemblée.',
      count: strategies.length,
      href: '/revenue-command-os/strategy-engine',
      nextAction: strategies.length ? 'Comparer et sélectionner' : 'Lancer l’assemblage',
    },
    {
      key: 'council',
      label: 'Conseil',
      state: council.runId ? (council.blockingFindings ? 'blocked' : 'completed') : strategies.length ? 'ready' : 'waiting',
      summary: council.runId ? `${council.completedAgents} agent(s) · ${council.findings} constat(s).` : 'Aucun dossier délibéré.',
      count: council.runId ? 1 : 0,
      href: '/revenue-command-os/validation-council',
      blocker: council.blockingFindings ? `${council.blockingFindings} constat(s) bloquant(s)` : undefined,
    },
    {
      key: 'decision',
      label: 'Décision',
      state: decision.decisionId ? 'completed' : council.runId ? 'ready' : 'waiting',
      summary: decision.decisionId ? `Décision ${decision.status}.` : 'Décision exécutive non documentée.',
      count: decision.decisionId ? 1 : 0,
      href: '/revenue-command-os/strategy-studio',
    },
    {
      key: 'compilation',
      label: 'Compilation',
      state: compilation.runId ? (compilation.conflicts ? 'blocked' : 'completed') : decision.decisionId ? 'ready' : 'waiting',
      summary: compilation.runId ? `${compilation.generatedObjects} objet(s) · ${compilation.missions} mission(s).` : 'Aucun package opérationnel.',
      count: compilation.runId ? 1 : 0,
      href: '/revenue-command-os/mission-compiler',
      blocker: compilation.conflicts ? `${compilation.conflicts} conflit(s)` : undefined,
    },
    {
      key: 'execution',
      label: 'Exécution',
      state: execution.propagationRunId ? (execution.failed ? 'blocked' : 'active') : compilation.packageId ? 'ready' : 'waiting',
      summary: execution.propagationRunId ? `${execution.succeeded} réussie(s), ${execution.failed} échec(s), ${execution.awaitingApproval} approbation(s).` : 'Propagation non préparée.',
      count: execution.latestActions.length,
      href: '/revenue-command-os/execution-autopilot',
      blocker: execution.failed ? `${execution.failed} action(s) en échec` : undefined,
    },
    {
      key: 'learning',
      label: 'Résultats',
      state: outcomes.outcomes ? 'active' : execution.propagationRunId ? 'ready' : 'waiting',
      summary: `${outcomes.outcomes} résultat(s), ${outcomes.experiments} expérience(s), ${outcomes.attributionEvents} attribution(s).`,
      count: outcomes.outcomes,
      href: '/revenue-command-os/mega-production',
    },
  ]
}

export async function readRevenueOperatingSpine(tenantId: string): Promise<RevenueOperatingSpineSnapshot> {
  const { data, sourceHealth } = await loadSources(tenantId)
  const warnings = Object.entries(sourceHealth)
    .filter(([, health]) => !health.ok)
    .map(([source, health]) => `${source}: ${health.message || 'source indisponible'}`)
  const installation = data.installations[0]
  const installationPayload = payload(installation)
  const executionMode = 'live'
  const externalActionsEnabled = true

  const objective = objectiveOf(data)
  const strategies = strategiesOf(data, objective?.id)
  const selectedStrategy = strategies.find((strategy) => strategy.recommended) || strategies[0]
  const aiRuns = aiRunsOf(data, objective?.id)
  const contextRow = latestForObjective(data.contextSnapshots, objective?.id)
  const comparisonRow = latestForObjective(data.comparisons, objective?.id)
  const council = councilOf(data, selectedStrategy?.id)
  const decision = decisionOf(data, selectedStrategy?.id)
  const compilation = compilationOf(data, selectedStrategy?.id)
  const execution = executionOf(data, compilation, executionMode)
  const outcomes = outcomesOf(data)
  const boardBrief = boardBriefOf({ objective, aiRuns, strategies, council, decision, compilation, execution, outcomes, warnings })
  const stages = stagesOf({ objective, aiRuns, strategies, council, decision, compilation, execution, outcomes })

  const programs = data.programs.slice(0, 30).map((row) => ({ id: row.id, status: row.status, updatedAt: row.updated_at, ...payload(row) }))
  const missions = data.missions.slice(0, 50).map((row) => ({ id: row.id, status: row.status, updatedAt: row.updated_at, ...payload(row) }))
  const exceptions = data.cockpitExceptions.slice(0, 30).map((row) => {
    const value = payload(row)
    return {
      id: String(row.id),
      title: stringValue(value.title, row.exception_code, 'Exception Revenue OS'),
      severity: stringValue(value.severity, row.severity, 'medium'),
      status: stringValue(value.status, row.status, 'open'),
      impact: stringValue(value.businessImpact, value.summary, 'Impact à qualifier'),
      recommendedAction: stringValue(value.recommendedAction, 'Analyser et affecter cette exception.'),
      owner: stringValue(value.ownerLabel, row.owner_id) || undefined,
      dueAt: stringValue(value.dueAt, row.due_at) || undefined,
    }
  })

  return {
    generatedAt: new Date().toISOString(),
    tenantId,
    executionMode,
    externalActionsEnabled,
    boardBrief,
    stages,
    objective,
    aiRuns,
    strategies,
    context: contextRow ? payload(contextRow) : null,
    comparison: comparisonRow ? payload(comparisonRow) : null,
    council,
    decision,
    compilation,
    execution,
    outcomes,
    programs,
    missions,
    exceptions,
    sourceHealth,
    warnings,
  }
}

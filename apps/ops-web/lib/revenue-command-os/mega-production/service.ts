import 'server-only'
import { RevenueOsError } from '../errors'
import { modeForLevel } from './activation'
import { megaProductionConfig } from './config'
import { newId, redactDeep, stableHash } from './crypto'
import { validateExperiment } from './experiment-engine'
import { activationSafetyScore, queueStatus, workerStatus } from './observability'
import { buildMegaActionAvailability, buildMegaCapabilityHealth, buildMegaMetricAvailability } from './capability-health'
import { appendAudit, insertRow, loadMegaSources, probeMegaSources, updateRow } from './repository'
import {
  activationSchema,
  createExperimentSchema,
  emergencyStopSchema,
  evaluationRunSchema,
  experimentActionSchema,
  queueActionSchema,
  registryActionSchema,
  restoreSchema,
} from './schemas'
import {
  LEARNING_SCOPE,
  PRODUCTION_SCOPE,
  type MegaActor,
  type MegaProductionDashboard,
  type RevenueExperiment,
} from './types'

function mapOutcome(row: any) {
  return {
    id: String(row.id),
    tenantId: String(row.tenant_id),
    strategyId: String(row.strategy_id),
    strategyVersionId: String(row.strategy_version_id),
    objectiveId: String(row.objective_id),
    status: String(row.status),
    plannedRevenue: Number(row.planned_revenue ?? 0),
    actualRevenue: Number(row.actual_revenue ?? 0),
    plannedMargin: Number(row.planned_margin ?? 0),
    actualMargin: Number(row.actual_margin ?? 0),
    pipelineCreated: Number(row.pipeline_created ?? 0),
    meetings: Number(row.meetings ?? 0),
    proposals: Number(row.proposals ?? 0),
    conversions: Number(row.conversions ?? 0),
    executionCompleteness: Number(row.execution_completeness ?? 0),
    attributionConfidence: Number(row.attribution_confidence ?? 0),
    lessons: Array.isArray(row.lessons) ? row.lessons : [],
    observedAt: String(row.observed_at ?? row.created_at ?? new Date().toISOString()),
  }
}

async function requireMegaSources(tenantId: string, sourceKeys: string[], message: string) {
  const health = await probeMegaSources(tenantId, sourceKeys)
  const failed = health.filter((source) => !source.ok)
  if (!failed.length) return

  throw new RevenueOsError('REVENUE_OS_DEPENDENCY_UNAVAILABLE', message, {
    status: 503,
    recoverable: true,
    context: {
      sourceKeys: failed.map((source) => source.key),
      traceIds: failed.map((source) => source.traceId).filter(Boolean),
    },
  })
}

export async function megaProductionDashboard(tenantId: string): Promise<MegaProductionDashboard> {
  const config = megaProductionConfig()
  const { data: raw, sourceHealth } = await loadMegaSources(tenantId)
  const failedSources = sourceHealth.filter((source) => !source.ok)
  const dataMode = failedSources.length === 0 ? 'live' : failedSources.length === sourceHealth.length ? 'unavailable' : 'degraded'
  const capabilityHealth = buildMegaCapabilityHealth(sourceHealth)
  const actionAvailability = buildMegaActionAvailability(sourceHealth, config.externalActions)

  const queues = (raw.queues ?? [])
    .map((row: any) => ({
      queue: String(row.queue_name ?? row.queue),
      depth: Number(row.depth ?? 0),
      oldestJobAgeSeconds: Number(row.oldest_job_age_seconds ?? 0),
      leased: Number(row.leased ?? 0),
      retries: Number(row.retries ?? 0),
      deadLetters: Number(row.dead_letters ?? 0),
      throughputPerMinute: Number(row.throughput_per_minute ?? 0),
      successRate: Number(row.success_rate ?? 1),
      status: String(row.status ?? 'healthy') as any,
    }))
    .map((queue) => ({ ...queue, status: queueStatus(queue) }))

  const workers = (raw.workers ?? [])
    .map((row: any) => ({
      workerId: String(row.worker_id),
      domain: String(row.domain),
      status: String(row.status ?? 'healthy') as any,
      concurrency: Number(row.concurrency ?? 1),
      activeJobs: Number(row.active_jobs ?? 0),
      processedJobs: Number(row.processed_jobs ?? 0),
      failedJobs: Number(row.failed_jobs ?? 0),
      heartbeatAt: String(row.heartbeat_at ?? new Date().toISOString()),
      version: String(row.version ?? '16.0.0'),
    }))
    .map((worker) => ({ ...worker, status: workerStatus(worker) }))

  const anomalies = (raw.anomalies ?? []).map((row: any) => ({
    id: String(row.id),
    tenantId: String(row.tenant_id),
    anomalyClass: String(row.anomaly_class) as any,
    severity: String(row.severity) as any,
    title: String(row.title),
    description: String(row.description),
    baseline: Number(row.baseline ?? 0),
    observed: Number(row.observed ?? 0),
    deviation: Number(row.deviation ?? 0),
    confidence: Number(row.confidence ?? 0),
    affectedObjects: Array.isArray(row.affected_objects) ? row.affected_objects : [],
    businessImpact: String(row.business_impact ?? ''),
    recommendedAction: String(row.recommended_action ?? ''),
    status: String(row.status ?? 'open') as any,
    detectedAt: String(row.detected_at ?? new Date().toISOString()),
  }))

  const security = raw.securityReviews?.[0]
  const regressionFailures = (raw.evaluations ?? []).filter((row: any) => String(row.status) === 'failed').length
  const safety = activationSafetyScore({
    securityCritical: Number(security?.critical ?? 0),
    deadLetters: queues.reduce((sum, queue) => sum + queue.deadLetters, 0),
    queueCritical: queues.filter((queue) => queue.status === 'critical').length,
    openHighAnomalies: anomalies.filter(
      (anomaly) => anomaly.status === 'open' && ['critical', 'high'].includes(anomaly.severity),
    ).length,
    regressionFailures,
  })

  const budget = raw.costBudgets?.[0] ?? {}
  const usage = (raw.costUsage ?? []).reduce((sum: number, row: any) => sum + Number(row.total_cost ?? 0), 0)
  const outcomes = (raw.outcomes ?? []).map(mapOutcome)
  const calibrationErrors = (raw.calibrations ?? []).map((row: any) => {
    const result = row && typeof row.result === 'object' && row.result ? row.result : {}
    return Number(row.percentage_error ?? result.percentageError ?? result.percentage_error ?? 0)
  }).filter((value: number) => Number.isFinite(value))
  const configuredBudget = Number(budget.amount ?? config.costBudgetUsd)
  const conversions = outcomes.reduce((sum, outcome) => sum + outcome.conversions, 0)
  const metricAvailability = buildMegaMetricAvailability(sourceHealth, {
    hasSecurityReview: Boolean(security),
    hasForecastSamples: calibrationErrors.length > 0,
  })

  return {
    mode: config.mode,
    activationLevel: config.activationLevel,
    learningCoverage: Object.fromEntries(LEARNING_SCOPE.map((key) => [key, true])) as any,
    productionCoverage: Object.fromEntries(PRODUCTION_SCOPE.map((key) => [key, true])) as any,
    outcomes,
    commandPerformance: (raw.commandPerformance ?? []).map((row: any) => ({
      commandCode: String(row.command_code),
      segment: row.segment ?? undefined,
      territory: row.territory ?? undefined,
      selections: Number(row.selections ?? 0),
      executions: Number(row.executions ?? 0),
      successes: Number(row.successes ?? 0),
      revenueContribution: Number(row.revenue_contribution ?? 0),
      marginContribution: Number(row.margin_contribution ?? 0),
      successRate: Number(row.success_rate ?? 0),
      confidence: Number(row.confidence ?? 0),
      state: String(row.state ?? 'unproven') as any,
      updatedAt: String(row.updated_at ?? new Date().toISOString()),
    })),
    segmentLearning: (raw.segments ?? []).map((row: any) => ({
      segment: String(row.segment),
      territory: row.territory ?? undefined,
      sampleSize: Number(row.sample_size ?? 0),
      confidence: Number(row.confidence ?? 0),
      winningOffers: row.winning_offers ?? [],
      winningChannels: row.winning_channels ?? [],
      winningMessages: row.winning_messages ?? [],
      failedPatterns: row.failed_patterns ?? [],
      responseWindow: row.response_window ?? undefined,
      evidenceIds: row.evidence_ids ?? [],
      recalculatedAt: String(row.recalculated_at ?? new Date().toISOString()),
    })),
    experiments: (raw.experiments ?? []) as RevenueExperiment[],
    attributions: (raw.attributions ?? []) as any,
    calibrations: (raw.calibrations ?? []) as any,
    anomalies,
    queues,
    workers,
    locks: [],
    registries: (raw.registries ?? []) as any,
    evaluations: (raw.evaluations ?? []) as any,
    cost: {
      period: new Date().toISOString().slice(0, 10),
      aiCost: usage,
      executionCost: 0,
      totalCost: usage,
      budget: configuredBudget,
      utilizationPercent: configuredBudget ? (usage / configuredBudget) * 100 : 0,
      costPerStrategy: outcomes.length ? usage / outcomes.length : 0,
      costPerCouncil: 0,
      costPerConversion: conversions ? usage / conversions : 0,
      alerts: usage > configuredBudget ? ['budget_exceeded'] : [],
    },
    confidencePolicies: (raw.confidencePolicies ?? []) as any,
    emergencyStops: (raw.emergencyStops ?? []) as any,
    activation: (raw.activations ?? [])[0] as any,
    securityReview: security as any,
    disasterRecovery: (raw.drRuns ?? []) as any,
    metrics: {
      queueDepth: queues.reduce((sum, queue) => sum + queue.depth, 0),
      oldestJobAgeSeconds: Math.max(0, ...queues.map((queue) => queue.oldestJobAgeSeconds)),
      successRate: queues.length ? queues.reduce((sum, queue) => sum + queue.successRate, 0) / queues.length : 1,
      deadLetters: queues.reduce((sum, queue) => sum + queue.deadLetters, 0),
      openAnomalies: anomalies.filter((anomaly) => anomaly.status === 'open').length,
      activeExperiments: (raw.experiments ?? []).filter((experiment: any) => experiment.status === 'running').length,
      learningSamples: outcomes.length,
      forecastAccuracy: calibrationErrors.length
        ? Math.max(0, 100 - calibrationErrors.reduce((left, right) => left + right, 0) / calibrationErrors.length)
        : 100,
      activationSafetyScore: safety,
    },
    metricAvailability,
    generatedAt: new Date().toISOString(),
    dataMode,
    sourceHealth,
    capabilityHealth,
    actionAvailability,
    freshness: {
      state: dataMode === 'live' ? 'live' : dataMode,
      message:
        dataMode === 'live'
          ? `${sourceHealth.length}/${sourceHealth.length} sources de production disponibles`
          : dataMode === 'degraded'
            ? `${sourceHealth.length - failedSources.length}/${sourceHealth.length} sources disponibles. Les capacités indépendantes restent utilisables.`
            : 'Les sources de production sont indisponibles.',
    },
    externalActionsEnabled: dataMode === 'live' && config.externalActions,
    approvedExternalActionsEnabled: dataMode === 'live' && config.approvedExternalActions,
  }
}

export async function createExperiment(actor: MegaActor, input: unknown) {
  const parsed = createExperimentSchema.parse(input)
  const experimentId = newId()
  const experiment = {
    id: experimentId,
    tenantId: actor.tenantId,
    code: `EXP-${Date.now()}`,
    name: parsed.name,
    experimentType: parsed.experimentType,
    hypothesis: parsed.hypothesis,
    primaryMetric: parsed.primaryMetric,
    secondaryMetrics: parsed.secondaryMetrics,
    status: 'draft',
    eligiblePopulation: parsed.eligiblePopulation,
    variants: parsed.variants.map((variant) => ({ ...variant, id: newId() })),
    sampleSize: parsed.sampleSize,
    startAt: parsed.startAt,
    endAt: parsed.endAt,
    stopRules: parsed.stopRules,
    riskLimit: parsed.riskLimit,
    approvalClass: parsed.approvalClass,
    attributionWindowDays: parsed.attributionWindowDays,
  } as RevenueExperiment

  const issues = validateExperiment(experiment)
  if (issues.length) {
    throw new RevenueOsError('REVENUE_OS_INVALID_INPUT', `Expérience invalide: ${issues.join(', ')}`, {
      status: 422,
      recoverable: true,
    })
  }

  const row = await insertRow('revenue_os_experiments', {
    id: experimentId,
    tenant_id: actor.tenantId,
    code: experiment.code,
    name: experiment.name,
    experiment_type: experiment.experimentType,
    hypothesis: experiment.hypothesis,
    primary_metric: experiment.primaryMetric,
    secondary_metrics: experiment.secondaryMetrics,
    status: 'draft',
    eligible_population: experiment.eligiblePopulation,
    sample_size: experiment.sampleSize,
    start_at: experiment.startAt,
    end_at: experiment.endAt,
    stop_rules: experiment.stopRules,
    risk_limit: experiment.riskLimit,
    approval_class: experiment.approvalClass,
    attribution_window_days: experiment.attributionWindowDays,
    idempotency_key: parsed.idempotencyKey ?? stableHash([actor.tenantId, parsed]),
  })

  for (const variant of experiment.variants) {
    await insertRow('revenue_os_experiment_variants', {
      id: variant.id,
      tenant_id: actor.tenantId,
      experiment_id: experimentId,
      code: variant.code,
      label: variant.label,
      allocation_percent: variant.allocationPercent,
      payload: variant.payload,
      is_control: variant.control,
    })
  }

  await appendAudit(actor.tenantId, actor.id, 'experiment_created', 'experiment', experimentId, {
    input: redactDeep(parsed),
  })
  return row
}

export async function changeExperiment(actor: MegaActor, input: unknown, action: 'activate' | 'stop') {
  const parsed = experimentActionSchema.parse(input)
  const status = action === 'activate' ? 'running' : 'stopped'
  const row = await updateRow('revenue_os_experiments', parsed.experimentId, actor.tenantId, {
    status,
    updated_at: new Date().toISOString(),
  })
  await appendAudit(actor.tenantId, actor.id, `experiment_${action}`, 'experiment', parsed.experimentId, {
    reason: parsed.reason,
  })
  return row
}

export async function executeEmergencyStop(actor: MegaActor, input: unknown) {
  const parsed = emergencyStopSchema.parse(input)
  await requireMegaSources(
    actor.tenantId,
    ['emergencyStops'],
    'Le registre des arrêts d’urgence est indisponible. Consultez l’observabilité avant de réessayer.',
  )
  const id = newId()
  const row = await insertRow('revenue_os_emergency_stops', {
    id,
    tenant_id: actor.tenantId,
    scope: parsed.scope,
    scope_id: parsed.scopeId,
    state: parsed.state,
    reason: parsed.reason,
    activated_by: actor.id,
    activated_at: new Date().toISOString(),
    expires_at: parsed.expiresAt,
    idempotency_key: parsed.idempotencyKey ?? stableHash([actor.tenantId, parsed]),
  })
  await appendAudit(actor.tenantId, actor.id, 'emergency_stop_activated', 'emergency_stop', id, { ...parsed })
  return row
}

export async function restoreEmergencyStop(actor: MegaActor, input: unknown) {
  const parsed = restoreSchema.parse(input)
  await requireMegaSources(
    actor.tenantId,
    ['emergencyStops'],
    'Le registre des arrêts d’urgence est indisponible. La restauration ne peut pas être persistée.',
  )
  const row = await updateRow('revenue_os_emergency_stops', parsed.stopId, actor.tenantId, {
    state: 'normal',
    restored_by: actor.id,
    restored_at: new Date().toISOString(),
    restoration_reason: parsed.reason,
  })
  await appendAudit(actor.tenantId, actor.id, 'emergency_stop_restored', 'emergency_stop', parsed.stopId, {
    reason: parsed.reason,
  })
  return row
}

export async function requestActivation(actor: MegaActor, input: unknown) {
  const parsed = activationSchema.parse(input)
  await requireMegaSources(
    actor.tenantId,
    ['activations'],
    'Le registre d’activation est indisponible. Aucune demande ne peut être persistée.',
  )
  if (parsed.level > 4) {
    await requireMegaSources(
      actor.tenantId,
      ['securityReviews', 'evaluations', 'drRuns', 'emergencyStops'],
      'Les niveaux L5 et L6 exigent une sécurité, des évaluations, une reprise et des arrêts d’urgence entièrement disponibles.',
    )
  }
  const id = newId()
  const mode = modeForLevel(parsed.level as any)
  const row = await insertRow('revenue_os_production_activations', {
    id,
    tenant_id: actor.tenantId,
    level: parsed.level,
    mode,
    status: 'review',
    adapter_scope: parsed.adapterScope,
    action_scope: parsed.actionScope,
    risk_scope: parsed.riskScope,
    effective_at: parsed.effectiveAt,
    expires_at: parsed.expiresAt,
    requested_by: actor.id,
    request_reason: parsed.reason,
    idempotency_key: parsed.idempotencyKey ?? stableHash([actor.tenantId, parsed]),
  })
  await appendAudit(actor.tenantId, actor.id, 'production_activation_requested', 'activation', id, {
    level: parsed.level,
    mode,
    reason: parsed.reason,
  })
  return row
}

export async function manageRegistry(actor: MegaActor, input: unknown) {
  const parsed = registryActionSchema.parse(input)
  const status =
    parsed.action === 'approve'
      ? 'approved'
      : parsed.action === 'activate'
        ? 'active'
        : parsed.action === 'degrade'
          ? 'degraded'
          : parsed.action === 'rollback'
            ? 'rolled_back'
            : 'retired'
  const row = await updateRow('revenue_os_registry_entries', parsed.entryId, actor.tenantId, {
    status,
    updated_at: new Date().toISOString(),
  })
  await appendAudit(actor.tenantId, actor.id, `registry_${parsed.action}`, parsed.registry, parsed.entryId, {
    reason: parsed.reason,
  })
  return row
}

export async function runEvaluation(actor: MegaActor, input: unknown) {
  const parsed = evaluationRunSchema.parse(input)
  const id = newId()
  const row = await insertRow('revenue_os_evaluation_runs', {
    id,
    tenant_id: actor.tenantId,
    suite_code: parsed.suiteCode,
    status: 'queued',
    trigger: parsed.trigger,
    scope: parsed.scope,
    cases: 0,
    assertions: 0,
    failures: 0,
    started_at: new Date().toISOString(),
    idempotency_key: parsed.idempotencyKey ?? stableHash([actor.tenantId, parsed]),
  })
  await appendAudit(actor.tenantId, actor.id, 'evaluation_queued', 'evaluation', id, { ...parsed })
  return row
}

export async function queueAction(actor: MegaActor, input: unknown, action: 'retry' | 'cancel' | 'replay') {
  const parsed = queueActionSchema.parse(input)
  const status = action === 'cancel' ? 'cancelled' : 'queued'
  const row = await updateRow('revenue_os_durable_jobs', parsed.jobId, actor.tenantId, {
    status,
    last_error: null,
    scheduled_at: new Date().toISOString(),
    payload: parsed.repairPayload ?? undefined,
  })
  await appendAudit(actor.tenantId, actor.id, `job_${action}`, 'durable_job', parsed.jobId, {
    reason: parsed.reason,
  })
  return row
}

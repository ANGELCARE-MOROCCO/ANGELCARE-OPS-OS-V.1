import { cockpitConfig } from './config'
import { buildExecutiveBrief } from './executive-brief'
import { buildRevenueExceptions } from './exception-engine'
import { freshness } from './freshness'
import { booleanValue, clampPercent, countBy, firstPresent, isoDate, latestByDate, money, numberValue, objectArray, ratioPercent, recordValue, rowPayload, stringArray, text, unique } from './normalizers'
import type { RawCockpitSources } from './repository'
import type {
  ApprovalGovernanceSummary,
  CampaignWaveSummary,
  CockpitDashboard,
  CockpitExecutionMode,
  CockpitRoleView,
  CockpitSeverity,
  CockpitTimelineEvent,
  CockpitZoneHealth,
  CommandRunSummary,
  CompilerStatusSummary,
  CouncilSummary,
  ExecutionProgressSummary,
  ExperimentSummary,
  LearningMemorySummary,
  LiveSignalSummary,
  ObjectiveCommandSummary,
  RevenueProgramSummary,
  StrategyAssemblySummary,
} from './types'

export async function buildCockpitReadModel(tenantId: string, roleView: CockpitRoleView, sources: RawCockpitSources): Promise<CockpitDashboard> {
  const config = cockpitConfig()
  const objective = buildObjective(sources)
  const signals = buildSignals(sources).slice(0, config.maxSignals)
  const strategies = buildStrategies(sources)
  const council = buildCouncil(sources, strategies[0]?.id)
  const programs = buildPrograms(sources).slice(0, config.maxPrograms)
  const runs = buildRuns(sources).slice(0, 120)
  const waves = buildWaves(sources).slice(0, 160)
  const compiler = buildCompiler(sources)
  const execution = buildExecution(sources, config.executionMode)
  const approvals = buildApprovals(sources)
  const experiments = buildExperiments(sources, waves)
  const learning = buildLearning(sources, experiments)
  const exceptions = buildRevenueExceptions({ objective, council, programs, execution, sources }).slice(0, config.maxExceptions)
  const timeline = buildTimeline(sources, signals, runs, exceptions).slice(0, config.maxTimelineEvents)
  const executiveBrief = await buildExecutiveBrief({ objective, strategy: strategies[0] || null, council, programs, exceptions, approvals, execution, timelineCount: timeline.length })
  const zoneHealth = buildZoneHealth({ objective, signals, strategies, council, programs, runs, waves, compiler, execution, exceptions, experiments, learning, approvals }, sources)

  return {
    generatedAt: new Date().toISOString(),
    tenantId,
    roleView,
    executionMode: config.executionMode,
    objective,
    signals,
    strategies,
    council,
    programs,
    runs,
    waves,
    compiler,
    execution,
    exceptions,
    experiments,
    learning,
    approvals,
    timeline,
    executiveBrief,
    zoneHealth,
    counts: {
      revenueAtRisk: exceptions.filter((item) => item.status !== 'resolved' && item.status !== 'dismissed').reduce((sum, item) => sum + item.revenueAtRisk, 0),
      approvalsRequired: approvals.filter((item) => ['pending','requested','awaiting','awaiting_approval'].includes(item.status)).length,
      criticalExceptions: exceptions.filter((item) => item.priority === 'P0' || item.priority === 'P1').length,
      activePrograms: programs.filter((item) => ['active','compiled','ready','in_progress'].includes(item.status)).length,
      activeCampaigns: sources.campaigns.filter((row) => ['active','compiled','ready','in_progress'].includes(text(row.status, text(rowPayload(row).status)))).length,
      activeWaves: waves.filter((item) => ['active','ready','in_progress','compiled'].includes(item.status)).length,
      openMissions: sources.missions.filter((row) => !['completed','cancelled','rolled_back','superseded'].includes(text(row.status, text(rowPayload(row).status)))).length,
      externalActionsExecuted: execution.externalActionsExecuted,
    },
  }
}

function buildObjective(sources: RawCockpitSources): ObjectiveCommandSummary | null {
  const active = sources.objectives.find((row) => text(row.status) === 'active') || sources.objectives[0]
  const strategyObjective = sources.strategyObjectives.find((row) => String(row.objective_id || rowPayload(row).objectiveId || '') === String(active?.id || '')) || sources.strategyObjectives[0]
  if (!active && !strategyObjective) return null
  const base = active || strategyObjective
  const payload = { ...rowPayload(strategyObjective), ...recordValue(active?.metadata), ...rowPayload(active) }
  const revenueTarget = money(firstPresent(payload.revenueTarget, payload.revenue_target, payload.targetRevenue, payload.target_revenue, payload.target, 0))
  const pipelineTarget = money(firstPresent(payload.qualifiedPipelineTarget, payload.qualified_pipeline_target, payload.pipelineTarget, revenueTarget * 2.5))
  const actualRevenue = money(firstPresent(payload.actualRevenue, payload.actual_revenue, payload.realizedRevenue, payload.realized_revenue, 0))
  const qualifiedPipeline = money(firstPresent(payload.qualifiedPipeline, payload.qualified_pipeline, payload.pipeline, 0))
  const forecastRevenue = money(firstPresent(payload.forecastRevenue, payload.forecast_revenue, payload.weightedForecast, payload.weighted_forecast, qualifiedPipeline * 0.35 + actualRevenue))
  const marginTarget = numberValue(firstPresent(payload.marginTarget, payload.margin_target, payload.minimumMargin, 35), 35)
  const confidence = clampPercent(firstPresent(payload.confidence, payload.confidenceScore, payload.confidence_score, qualifiedPipeline > 0 ? 72 : 40))
  const id = String(base.id || payload.id || '')
  const observedAt = isoDate(base.updated_at || payload.updatedAt || base.created_at)
  return {
    id,
    code: text(base.code, text(payload.code, `OBJ-${id.slice(0, 8).toUpperCase()}`)),
    title: text(base.title, text(payload.title, 'Objectif revenu actif')),
    status: text(base.status, text(payload.status, 'active')),
    version: numberValue(firstPresent(base.version, payload.version), 1),
    revenueTarget,
    qualifiedPipelineTarget: pipelineTarget,
    marginTarget,
    actualRevenue,
    qualifiedPipeline,
    forecastRevenue,
    progressPercent: ratioPercent(actualRevenue, revenueTarget),
    forecastPercent: ratioPercent(forecastRevenue, revenueTarget),
    confidence,
    territories: unique([...stringArray(payload.territories), ...stringArray(payload.targetTerritories), ...stringArray(payload.target_market), ...stringArray(base.target_market)]),
    businessUnits: unique([...stringArray(payload.businessUnits), ...stringArray(payload.business_units), ...stringArray(base.business_unit)]),
    segments: unique([...stringArray(payload.segments), ...stringArray(payload.targetSegments), ...stringArray(payload.target_segments)]),
    horizonStart: isoDate(firstPresent(payload.horizonStart, payload.horizon_start, payload.startDate, payload.start_date)),
    horizonEnd: isoDate(firstPresent(payload.horizonEnd, payload.horizon_end, payload.deadline, payload.endDate, payload.end_date)),
    approvalStatus: text(payload.approvalStatus, text(payload.approval_status, 'governed')),
    currentBlockers: unique([...stringArray(payload.blockers), ...stringArray(payload.currentBlockers), ...stringArray(payload.blocking_reasons)]),
    nextMilestone: text(firstPresent(payload.nextMilestone, payload.next_milestone, payload.nextAction, payload.next_action)) || undefined,
    freshness: freshness('revenue_os_objectives', observedAt, 240),
  }
}

function buildSignals(sources: RawCockpitSources): LiveSignalSummary[] {
  return sources.signals.map((row) => {
    const payload = rowPayload(row)
    const entities = objectArray(row.entities || payload.entities)
    const accountLabels = entities.filter((item) => ['account','prospect','organization','partner'].includes(text(item.entity_type, text(item.type)))).map((item) => text(item.label, text(item.entity_code, text(item.entity_id)))).filter(Boolean)
    const occurredAt = isoDate(row.occurred_at || row.detected_at || row.created_at) || new Date().toISOString()
    return {
      id: String(row.id || payload.id || ''),
      code: text(row.code, text(payload.code, 'SIGNAL')),
      category: text(row.category, text(payload.category, 'business')),
      signalType: text(row.signal_type, text(payload.signalType, 'signal')),
      title: text(row.title, text(payload.title, 'Signal Revenue OS')),
      summary: text(row.summary, text(payload.summary, '')),
      severity: normalizeSeverity(text(row.severity, text(payload.severity, 'medium'))),
      confidence: text(row.confidence, text(payload.confidence, 'unknown')),
      priorityScore: clampPercent(firstPresent(row.priority_score, payload.priorityScore)),
      opportunityScore: clampPercent(firstPresent(row.opportunity_score, payload.opportunityScore)),
      riskScore: clampPercent(firstPresent(row.risk_score, payload.riskScore)),
      status: text(row.status, text(payload.status, 'new')),
      source: text(row.source_code, text(payload.source, 'Revenue OS')),
      occurredAt,
      affectedStrategyIds: unique([...stringArray(payload.strategyIds), ...stringArray(payload.affectedStrategyIds)]),
      affectedAccounts: unique([...accountLabels, ...stringArray(payload.affectedAccounts)]),
      recommendedActions: unique([...stringArray(row.recommended_next_actions), ...stringArray(payload.recommendedActions)]),
      acknowledged: Boolean(row.acknowledged_at || payload.acknowledgedAt || ['acknowledged','resolved','dismissed'].includes(text(row.status))),
      freshness: freshness(text(row.source_code, 'revenue_os_signals'), row.detected_at || row.occurred_at || row.updated_at, 90),
    }
  }).sort((a, b) => severityWeight(a.severity) - severityWeight(b.severity) || b.priorityScore - a.priorityScore)
}

function buildStrategies(sources: RawCockpitSources): StrategyAssemblySummary[] {
  const models = new Map<string, any>()
  for (const row of sources.strategyModelRuns) {
    const payload = rowPayload(row)
    const strategyId = text(row.strategy_id, text(payload.strategyId))
    if (strategyId && !models.has(strategyId)) models.set(strategyId, row)
  }
  return sources.strategies.map((row) => {
    const payload = rowPayload(row)
    const id = String(row.strategy_id || payload.id || row.id || '')
    const modelRow = models.get(id) || sources.strategyModelRuns[0]
    const modelPayload = rowPayload(modelRow)
    const assumptions = objectArray(payload.assumptions)
    const risks = objectArray(payload.risks)
    return {
      id,
      code: text(payload.code, `STRAT-${id.slice(0, 8).toUpperCase()}`),
      title: text(payload.title, text(payload.objective, text(payload.thesis, 'Stratégie Revenue OS'))),
      version: text(payload.version, String(row.version || '1.0.0')),
      status: text(row.status, text(payload.status, 'draft')),
      thesis: text(payload.thesis, text(payload.objective, 'Thèse stratégique non renseignée.')),
      archetype: text(payload.archetype, 'governed_strategy'),
      targetSegments: unique([...stringArray(payload.targetSegments), ...stringArray(payload.target_segments)]),
      territories: unique([...stringArray(payload.targetMarket), ...stringArray(payload.territories)]),
      offer: typeof payload.offer === 'string' ? payload.offer : text(recordValue(payload.offer).name, text(recordValue(payload.offer).title, 'Offre gouvernée')),
      valueProposition: text(payload.valueProposition, text(payload.value_proposition, '')),
      pricingPosture: typeof payload.pricingPosture === 'string' ? payload.pricingPosture : text(recordValue(payload.pricingPosture).label, text(recordValue(payload.pricingPosture).position, 'Protégée')),
      confidence: clampPercent(firstPresent(payload.confidence, payload.confidenceScore, 65)),
      assumptionsOpen: assumptions.filter((item) => !['validated','confirmed','resolved'].includes(text(item.status))).length,
      risksHigh: risks.filter((item) => ['critical','high'].includes(text(item.severity))).length,
      evidenceCount: objectArray(payload.trustEvidence).length + stringArray(payload.evidence).length,
      fallbacks: Array.isArray(payload.fallbackPlan) ? payload.fallbackPlan.length : payload.fallbackPlan ? 1 : 0,
      stopConditions: stringArray(payload.stopConditions).length + objectArray(payload.stopConditions).length,
      provider: text(modelPayload.provider, text(modelRow?.provider, 'gemini')),
      model: text(modelPayload.model, text(modelRow?.model, 'configured-model')),
      promptVersion: text(modelPayload.promptVersion, text(modelRow?.prompt_version, '10.1.0')),
      approved: ['approved','ready_for_mz13','ready_for_compilation'].includes(text(row.status, text(payload.status))),
      recommended: booleanValue(payload.recommended) || ['recommended_for_executive_review','ready_for_executive_review'].includes(text(payload.classification)),
      sourceObjectiveId: text(row.objective_id, text(payload.objectiveId)) || undefined,
      freshness: freshness('revenue_os_strategies', row.updated_at || row.created_at, 360),
    }
  }).sort((a, b) => Number(b.approved) - Number(a.approved) || Number(b.recommended) - Number(a.recommended) || b.confidence - a.confidence)
}

function buildCouncil(sources: RawCockpitSources, preferredStrategyId?: string): CouncilSummary | null {
  const selectedRun = sources.councilRuns.find((row) => String(row.strategy_id || rowPayload(row).strategyId || '') === String(preferredStrategyId || '')) || sources.councilRuns[0]
  if (!selectedRun) return null
  const runId = String(selectedRun.id || rowPayload(selectedRun).id || '')
  const reviews = sources.councilReviews.filter((row) => String(row.run_id || rowPayload(row).runId || '') === runId)
  const findings = sources.councilFindings.filter((row) => String(row.run_id || rowPayload(row).runId || '') === runId)
  const contradictions = sources.councilContradictions.filter((row) => String(row.run_id || rowPayload(row).runId || '') === runId)
  const disagreements = sources.councilDisagreements.filter((row) => String(row.run_id || rowPayload(row).runId || '') === runId)
  const attacks = sources.councilRedTeam.filter((row) => String(row.run_id || rowPayload(row).runId || '') === runId)
  const classificationRow = sources.councilClassifications.find((row) => String(row.run_id || rowPayload(row).runId || '') === runId)
  const classificationPayload = rowPayload(classificationRow)
  const scoresSource = recordValue(classificationPayload.scores || rowPayload(selectedRun).scores)
  const topFindings = findings.slice(0, 8).map((row) => text(rowPayload(row).title, text(rowPayload(row).finding, text(rowPayload(row).description, text(row.severity, 'Finding'))))).filter(Boolean)
  return {
    runId,
    strategyId: String(selectedRun.strategy_id || rowPayload(selectedRun).strategyId || ''),
    classification: text(classificationRow?.classification, text(classificationPayload.classification, text(rowPayload(selectedRun).classification, 'under_review'))),
    readyForExecutiveReview: booleanValue(classificationRow?.ready_for_mz12, booleanValue(classificationPayload.readyForMZ12)),
    reviewCount: reviews.length,
    completedAgents: reviews.filter((row) => ['completed','passed','supported','ready'].includes(text(row.status, text(rowPayload(row).status)))).length,
    criticalFindings: findings.filter((row) => ['critical','high'].includes(text(row.severity, text(rowPayload(row).severity)))).length,
    blockingFindings: findings.filter((row) => booleanValue(row.blocking, booleanValue(rowPayload(row).blocking))).length,
    contradictions: contradictions.length,
    disagreements: disagreements.filter((row) => !['resolved','closed'].includes(text(row.status, text(rowPayload(row).status)))).length,
    redTeamAttacks: attacks.length,
    survivedAttacks: attacks.filter((row) => booleanValue(row.survived, booleanValue(rowPayload(row).survived))).length,
    optimizedVersion: text(rowPayload(selectedRun).optimizedVersion, text(rowPayload(selectedRun).optimized_version)) || undefined,
    scores: {
      evidence: clampPercent(firstPresent(scoresSource.evidence, scoresSource.evidenceScore, 0)),
      opportunity: clampPercent(firstPresent(scoresSource.opportunity, scoresSource.opportunityScore, 0)),
      feasibility: clampPercent(firstPresent(scoresSource.feasibility, scoresSource.feasibilityScore, 0)),
      execution: clampPercent(firstPresent(scoresSource.execution, scoresSource.executionScore, 0)),
      capacity: clampPercent(firstPresent(scoresSource.capacity, scoresSource.capacityScore, 0)),
      profitability: clampPercent(firstPresent(scoresSource.profitability, scoresSource.profitabilityScore, 0)),
      risk: clampPercent(firstPresent(scoresSource.risk, scoresSource.riskScore, 0)),
      confidence: clampPercent(firstPresent(scoresSource.confidence, scoresSource.confidenceLevel, 0)),
    },
    topFindings,
    unresolvedAssumptions: stringArray(classificationPayload.unresolvedAssumptions || rowPayload(selectedRun).unresolvedAssumptions),
    auditStatus: text(classificationPayload.auditStatus, text(rowPayload(selectedRun).auditStatus, 'recorded')),
    freshness: freshness('revenue_os_council_runs', selectedRun.updated_at || selectedRun.completed_at || selectedRun.created_at, 360),
  }
}

function buildPrograms(sources: RawCockpitSources): RevenueProgramSummary[] {
  return sources.programs.map((row) => {
    const payload = rowPayload(row)
    const id = String(row.id || payload.id || '')
    const campaignRows = sources.campaigns.filter((campaign) => String(campaign.program_id || rowPayload(campaign).programId || '') === id)
    const campaignIds = new Set(campaignRows.map((campaign) => String(campaign.id || rowPayload(campaign).id || '')))
    const waveRows = sources.waves.filter((wave) => campaignIds.has(String(wave.campaign_id || rowPayload(wave).campaignId || '')))
    const missionRows = sources.missions.filter((mission) => String(mission.program_id || rowPayload(mission).programId || '') === id)
    const missionIds = new Set(missionRows.map((mission) => String(mission.id || rowPayload(mission).id || '')))
    const taskRows = sources.tasks.filter((task) => missionIds.has(String(task.mission_id || rowPayload(task).missionId || '')))
    const targetRevenue = money(firstPresent(payload.revenueTarget, payload.revenue_target, row.revenue_target, 0))
    const forecastRevenue = money(firstPresent(payload.forecastRevenue, payload.forecast_revenue, payload.pipelineContribution, targetRevenue * progressFromStatus(text(row.status, text(payload.status)))))
    const tasksCompleted = taskRows.filter((task) => ['completed','done','succeeded'].includes(text(rowPayload(task).taskStatus, text(task.status)))).length
    const tasksBlocked = taskRows.filter((task) => ['blocked','failed','dead_letter'].includes(text(rowPayload(task).taskStatus, text(task.status)))).length
    const capacity = recordValue(payload.capacityAllocation || payload.capacity_allocation)
    const capacityValues = Object.values(capacity).map(numberValue).filter((value) => value > 0)
    const capacityUtilization = clampPercent(firstPresent(payload.capacityUtilization, payload.capacity_utilization, capacityValues.length ? Math.max(...capacityValues) : 0))
    return {
      id,
      code: text(payload.code, text(row.code, `PROGRAM-${id.slice(0, 8).toUpperCase()}`)),
      title: text(payload.title, text(row.title, 'Programme revenu')),
      status: text(row.status, text(payload.status, 'compiled')),
      revenuePlay: text(payload.revenuePlay, text(payload.playId, text(row.play_id, 'Revenue Play'))),
      targetRevenue,
      forecastRevenue,
      pipelineContribution: money(firstPresent(payload.pipelineContribution, payload.pipeline_contribution, forecastRevenue)),
      marginTarget: numberValue(firstPresent(payload.marginTarget, payload.margin_target, row.margin_target, 35), 35),
      progressPercent: taskRows.length ? ratioPercent(tasksCompleted, taskRows.length) : clampPercent(firstPresent(payload.progressPercent, payload.progress, progressFromStatus(text(row.status, text(payload.status))) * 100)),
      activeCampaigns: campaignRows.filter((campaign) => !['cancelled','completed','rolled_back','superseded'].includes(text(campaign.status, text(rowPayload(campaign).status)))).length,
      activeWaves: waveRows.filter((wave) => !['cancelled','completed','rolled_back','superseded'].includes(text(wave.status, text(rowPayload(wave).status)))).length,
      accounts: waveRows.reduce((sum, wave) => sum + Math.max(numberValue(rowPayload(wave).accountLimit), stringArray(rowPayload(wave).accountIds).length), 0),
      missions: missionRows.length,
      tasksOpen: taskRows.filter((task) => !['completed','done','cancelled','rolled_back'].includes(text(rowPayload(task).taskStatus, text(task.status)))).length,
      tasksBlocked,
      capacityUtilization,
      owner: text(payload.programOwnerRole, text(payload.program_owner_role, text(row.program_owner_role, 'Direction Revenue'))),
      territories: unique([...stringArray(payload.territories), ...stringArray(row.territories)]),
      nextMilestone: text(firstPresent(payload.nextMilestone, payload.next_milestone, payload.nextAction)) || undefined,
      stopConditionTriggered: booleanValue(payload.stopConditionTriggered) || text(row.status) === 'blocked',
      sourceStrategyId: text(row.strategy_id, text(payload.strategyId)),
      freshness: freshness('revenue_os_programs', row.updated_at || row.created_at, 360),
    }
  }).sort((a, b) => b.pipelineContribution - a.pipelineContribution)
}

function buildRuns(sources: RawCockpitSources): CommandRunSummary[] {
  const rows: CommandRunSummary[] = []
  for (const row of sources.strategyModelRuns) rows.push(runSummary(row, 'gemini', 'Assemblage Gemini'))
  for (const row of sources.councilRuns) rows.push(runSummary(row, 'council', 'Conseil de validation'))
  for (const row of sources.compilationRuns) rows.push(runSummary(row, 'compilation', 'Compilation MZ13'))
  for (const row of sources.propagationRuns) rows.push(runSummary(row, 'propagation', 'Propagation MZ14'))
  for (const row of sources.executionActions.slice(0, 80)) rows.push(runSummary(row, 'adapter', text(row.action_type, text(rowPayload(row).actionType, 'Action adaptateur'))))
  for (const row of sources.businessEvents.slice(0, 50)) rows.push(runSummary(row, 'schedule', text(row.event_type, 'Événement système')))
  return rows.sort((a, b) => new Date(b.startedAt || b.scheduledAt || b.completedAt || 0).getTime() - new Date(a.startedAt || a.scheduledAt || a.completedAt || 0).getTime())
}

function runSummary(row: any, kind: CommandRunSummary['kind'], fallbackTitle: string): CommandRunSummary {
  const payload = rowPayload(row)
  const startedAt = isoDate(firstPresent(row.started_at, payload.startedAt, row.created_at))
  const completedAt = isoDate(firstPresent(row.completed_at, payload.completedAt, row.updated_at))
  return {
    id: String(row.id || payload.id || ''),
    kind,
    title: text(payload.title, text(payload.name, fallbackTitle)),
    status: text(row.status, text(payload.status, 'recorded')),
    startedAt,
    completedAt,
    scheduledAt: isoDate(firstPresent(row.scheduled_at, payload.scheduledAt, row.available_at)),
    durationMs: numberValue(firstPresent(row.latency_ms, payload.latencyMs, startedAt && completedAt ? new Date(completedAt).getTime() - new Date(startedAt).getTime() : 0)) || undefined,
    sourceId: text(firstPresent(row.strategy_id, row.compilation_run_id, row.action_id, payload.sourceId)) || undefined,
    owner: text(firstPresent(row.requested_by, row.actor_id, payload.owner, payload.requestedBy)) || undefined,
    attempts: numberValue(firstPresent(row.attempt_count, row.attempts, payload.attemptCount), 0),
    lastError: text(firstPresent(row.last_error, row.error_message, payload.lastError)) || undefined,
    nextAction: text(firstPresent(payload.nextAction, payload.next_action)) || undefined,
    externalAction: booleanValue(firstPresent(row.external_action, payload.controls && recordValue(payload.controls).externalAction, false)),
    freshness: freshness(`run:${kind}`, firstPresent(row.updated_at, row.completed_at, row.started_at, row.created_at) as string | undefined, 180),
  }
}

function buildWaves(sources: RawCockpitSources): CampaignWaveSummary[] {
  const campaigns = new Map<string, any>(sources.campaigns.map((row) => [String(row.id || rowPayload(row).id || ''), row]))
  return sources.waves.map((row) => {
    const payload = rowPayload(row)
    const campaignId = text(row.campaign_id, text(payload.campaignId))
    const campaign = campaigns.get(campaignId)
    const campaignPayload = rowPayload(campaign)
    const accountCount = Math.max(numberValue(payload.accountLimit), stringArray(payload.accountIds).length)
    const metrics = recordValue(payload.metrics || payload.performance)
    const contacted = numberValue(firstPresent(metrics.contacted, payload.contacted, 0))
    const positiveReplies = numberValue(firstPresent(metrics.positiveReplies, metrics.positive_replies, payload.positiveReplies, 0))
    const meetings = numberValue(firstPresent(metrics.meetings, payload.meetings, 0))
    const proposals = numberValue(firstPresent(metrics.proposals, payload.proposals, 0))
    const conversions = numberValue(firstPresent(metrics.conversions, payload.conversions, 0))
    return {
      id: String(row.id || payload.id || ''),
      campaignId,
      campaignTitle: text(campaignPayload.title, text(campaignPayload.purpose, text(campaign?.title, 'Campagne Revenue OS'))),
      waveCode: text(payload.code, text(row.code, `WAVE-${numberValue(payload.waveNumber, 1)}`)),
      waveNumber: numberValue(firstPresent(payload.waveNumber, payload.wave_number, row.wave_number), 1),
      status: text(row.status, text(payload.status, 'compiled')),
      territory: text(payload.territory, 'Territoire non défini'),
      segment: text(payload.segment, 'Segment non défini'),
      offer: typeof campaignPayload.offer === 'string' ? campaignPayload.offer : text(recordValue(campaignPayload.offer).name, 'Offre gouvernée'),
      accountCount,
      contacted,
      positiveReplies,
      meetings,
      proposals,
      conversions,
      stoppedAccounts: numberValue(firstPresent(metrics.stoppedAccounts, payload.stoppedAccounts, 0)),
      rescuedAccounts: numberValue(firstPresent(metrics.rescuedAccounts, payload.rescuedAccounts, 0)),
      conversionRate: ratioPercent(conversions, Math.max(1, contacted)),
      capacityReserved: Object.values(recordValue(payload.capacityReserved)).reduce<number>((sum, value) => sum + numberValue(value), 0),
      owner: text(payload.ownerRole, text(payload.owner_role, 'Revenue Operations')),
      startAt: isoDate(firstPresent(payload.startWindow, payload.start_window, row.start_window)),
      endAt: isoDate(firstPresent(payload.endWindow, payload.end_window, row.end_window)),
      sourceProgramId: text(campaign?.program_id, text(campaignPayload.programId)) || undefined,
      freshness: freshness('revenue_os_campaign_waves', row.updated_at || row.created_at, 240),
    }
  }).sort((a, b) => new Date(b.startAt || 0).getTime() - new Date(a.startAt || 0).getTime())
}

function buildCompiler(sources: RawCockpitSources): CompilerStatusSummary {
  const runs = sources.compilationRuns
  const conflicts = sources.compilationConflicts
  const latest = latestByDate(runs, (row) => row.updated_at || row.created_at)
  const latestPayload = rowPayload(latest)
  return {
    eligibleStrategies: sources.approvalRequests.filter((row) => ['approved','ready_for_mz13'].includes(text(row.status, text(rowPayload(row).status)))).length,
    compiling: countBy(runs, (row) => ['building_blueprint','checking_capacity','resolving_owners','building_dependencies','compiling'].includes(text(row.status, text(rowPayload(row).status)))),
    compiled: countBy(runs, (row) => ['compiled','ready_for_mz14'].includes(text(row.status, text(rowPayload(row).status)))),
    readyForPropagation: countBy(sources.compilationBlueprints, (row) => booleanValue(row.ready_for_mz14, booleanValue(rowPayload(row).readyForMZ14))),
    blockedByCapacity: countBy(conflicts, (row) => text(row.conflict_type, text(rowPayload(row).conflictType)).includes('capacity') && booleanValue(row.blocking, booleanValue(rowPayload(row).blocking))),
    blockedByAssignment: countBy(conflicts, (row) => ['assignment','owner','eligibility'].some((term) => text(row.conflict_type, text(rowPayload(row).conflictType)).includes(term)) && booleanValue(row.blocking, booleanValue(rowPayload(row).blocking))),
    blockingConflicts: countBy(conflicts, (row) => booleanValue(row.blocking, booleanValue(rowPayload(row).blocking)) && text(row.status, text(rowPayload(row).status, 'open')) === 'open'),
    superseded: countBy(runs, (row) => text(row.status, text(rowPayload(row).status)) === 'superseded'),
    rolledBack: countBy(runs, (row) => text(row.status, text(rowPayload(row).status)) === 'rolled_back'),
    latestRunId: latest ? String(latest.id || latestPayload.id || '') : undefined,
    latestVersion: numberValue(firstPresent(latestPayload.version, latest?.version), 0) || undefined,
    generatedObjects: sources.programs.length + sources.campaigns.length + sources.waves.length + sources.accountPlans.length + sources.missions.length + sources.tasks.length,
    freshness: freshness('revenue_os_compilation_runs', latest?.updated_at || latest?.created_at, 360),
  }
}

function buildExecution(sources: RawCockpitSources, executionMode: CockpitExecutionMode): ExecutionProgressSummary {
  const actions = sources.executionActions
  const adapters: Record<string, string> = {}
  for (const row of sources.adapterHealth) adapters[text(row.adapter_code, text(rowPayload(row).code, 'unknown'))] = text(row.status, text(rowPayload(row).status, 'unknown'))
  const deliveryStates: Record<string, number> = {}
  for (const row of actions) {
    const payload = rowPayload(row)
    const state = text(firstPresent(payload.deliveryState, payload.delivery_state, row.status), 'unknown')
    deliveryStates[state] = (deliveryStates[state] || 0) + 1
  }
  return {
    prepared: countBy(actions, (row) => ['draft','validated','prepared'].includes(text(row.status, text(rowPayload(row).status)))),
    awaitingApproval: countBy(actions, (row) => text(row.status, text(rowPayload(row).status)) === 'awaiting_approval'),
    queued: countBy(actions, (row) => ['queued','leased'].includes(text(row.status, text(rowPayload(row).status)))),
    executing: countBy(actions, (row) => text(row.status, text(rowPayload(row).status)) === 'executing'),
    succeeded: countBy(actions, (row) => text(row.status, text(rowPayload(row).status)) === 'succeeded'),
    failed: countBy(actions, (row) => text(row.status, text(rowPayload(row).status)) === 'failed'),
    retries: sources.executionRetries.length + countBy(actions, (row) => text(row.status, text(rowPayload(row).status)) === 'retry_scheduled'),
    deadLetters: sources.deadLetters.filter((row) => !['resolved','discarded'].includes(text(row.status, text(rowPayload(row).status)))).length,
    rolledBack: countBy(actions, (row) => text(row.status, text(rowPayload(row).status)) === 'rolled_back'),
    compensated: sources.compensations.length + countBy(actions, (row) => text(row.status, text(rowPayload(row).status)) === 'compensated'),
    externalActionsExecuted: countBy(actions, (row) => text(row.status, text(rowPayload(row).status)) === 'succeeded' && booleanValue(row.external_action, booleanValue(recordValue(rowPayload(row).controls).externalAction))),
    adapterHealth: adapters,
    deliveryStates,
    executionMode,
    freshness: freshness('revenue_os_execution_actions', sources.executionActions[0]?.updated_at || sources.executionActions[0]?.created_at, 60),
  }
}

function buildApprovals(sources: RawCockpitSources): ApprovalGovernanceSummary[] {
  const conditionsByRequest = new Map<string, string[]>()
  for (const row of sources.approvalConditions) {
    const payload = rowPayload(row)
    const requestId = text(row.approval_request_id, text(payload.approvalRequestId))
    const condition = text(payload.label, text(payload.type, text(row.condition_type, 'Condition')))
    if (!requestId) continue
    conditionsByRequest.set(requestId, [...(conditionsByRequest.get(requestId) || []), condition])
  }
  return sources.approvalRequests.map((row) => {
    const payload = rowPayload(row)
    const id = String(row.id || payload.id || '')
    return {
      id,
      approvalType: text(row.approval_class, text(payload.approvalClass, 'strategic_approval')),
      title: text(payload.title, text(payload.decisionRequested, 'Décision gouvernée requise')),
      status: text(row.status, text(payload.status, 'pending')),
      strategyId: text(row.strategy_id, text(payload.strategyId)) || undefined,
      actionId: text(payload.actionId) || undefined,
      requiredRole: text(payload.requiredRole, text(payload.required_role, 'Direction')),
      requestedBy: text(row.requested_by, text(payload.requestedBy, 'Revenue OS')),
      requestedAt: isoDate(row.created_at || payload.requestedAt) || new Date().toISOString(),
      expiresAt: isoDate(row.expires_at || payload.expiresAt),
      reversible: booleanValue(payload.reversible, true),
      businessConsequence: text(payload.businessConsequence, 'Le flux demeure bloqué jusqu’à la décision.'),
      rejectConsequence: text(payload.rejectConsequence, 'Le flux sera arrêté ou renvoyé pour correction.'),
      conditions: conditionsByRequest.get(id) || stringArray(payload.conditions),
      freshness: freshness('revenue_os_approval_requests', row.updated_at || row.created_at, 240),
    }
  }).sort((a, b) => approvalWeight(a.status) - approvalWeight(b.status) || new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
}

function buildExperiments(sources: RawCockpitSources, waves: CampaignWaveSummary[]): ExperimentSummary[] {
  const explicit: ExperimentSummary[] = sources.campaignPatterns.slice(0, 20).map((row) => {
    const payload = rowPayload(row)
    const baseline = numberValue(firstPresent(payload.baselineMetric, payload.baseline_metric, payload.baseline, 0))
    const challenger = numberValue(firstPresent(payload.challengerMetric, payload.challenger_metric, payload.result, 0))
    return {
      id: String(row.id || payload.id || row.code || ''),
      title: text(row.name, text(row.title, text(payload.title, 'Approche commerciale observée'))),
      dimension: normalizeExperimentDimension(text(firstPresent(payload.dimension, row.pattern_type, 'command-family'))),
      status: text(row.status, text(payload.status, 'observed')),
      baselineLabel: text(payload.baselineLabel, 'Référence'),
      challengerLabel: text(payload.challengerLabel, 'Variante'),
      baselineMetric: baseline,
      challengerMetric: challenger,
      liftPercent: baseline > 0 ? Math.round(((challenger - baseline) / baseline) * 100) : 0,
      sampleSize: numberValue(firstPresent(payload.sampleSize, payload.sample_size, row.usage_count, 0)),
      confidence: clampPercent(firstPresent(payload.confidence, payload.confidenceScore, 0)),
      winningVariant: challenger > baseline ? text(payload.challengerLabel, 'Variante') : baseline > challenger ? text(payload.baselineLabel, 'Référence') : undefined,
      sourceProgramId: text(payload.sourceProgramId) || undefined,
      evidenceStatus: text(payload.evidenceStatus, 'historical'),
      freshness: freshness('revenue_os_campaign_patterns', row.updated_at || row.created_at, 1440),
    }
  })
  const derived = waves.filter((wave) => wave.contacted >= 5).slice(0, 12).map((wave) => ({
    id: `wave-experiment-${wave.id}`,
    title: `${wave.campaignTitle} · ${wave.territory} / ${wave.segment}`,
    dimension: 'territory' as const,
    status: 'observed',
    baselineLabel: 'Contactés',
    challengerLabel: 'Conversions',
    baselineMetric: wave.contacted,
    challengerMetric: wave.conversions,
    liftPercent: wave.conversionRate,
    sampleSize: wave.contacted,
    confidence: clampPercent(Math.min(95, 35 + wave.contacted)),
    winningVariant: wave.conversionRate >= 12 ? `${wave.territory} · ${wave.segment}` : undefined,
    sourceProgramId: wave.sourceProgramId,
    evidenceStatus: wave.contacted >= 20 ? 'credible' : 'early',
    freshness: wave.freshness,
  }))
  return [...explicit, ...derived].sort((a, b) => b.liftPercent - a.liftPercent).slice(0, 30)
}

function buildLearning(sources: RawCockpitSources, experiments: ExperimentSummary[]): LearningMemorySummary[] {
  const entries: LearningMemorySummary[] = []
  for (const row of sources.caseStudies.slice(0, 30)) {
    const payload = rowPayload(row)
    entries.push({
      id: String(row.id || row.code || payload.id || ''),
      title: text(row.title, text(payload.title, 'Cas de référence')),
      memoryType: booleanValue(payload.success, true) ? 'winning-play' : 'failure-pattern',
      segment: text(firstPresent(payload.segment, row.segment_code)) || undefined,
      territory: text(firstPresent(payload.territory, row.territory_code)) || undefined,
      outcome: text(firstPresent(payload.outcome, payload.result, row.summary), 'Résultat documenté.'),
      confidence: clampPercent(firstPresent(payload.confidence, payload.evidenceScore, 70)),
      evidenceCount: stringArray(payload.evidenceRefs || row.evidence_refs).length,
      reusable: booleanValue(payload.reusable, true),
      sourceObjectIds: unique([String(row.id || ''), ...stringArray(payload.sourceObjectIds)]),
      lastObservedAt: isoDate(firstPresent(payload.lastObservedAt, row.updated_at, row.created_at)),
      freshness: freshness('revenue_os_case_studies', row.updated_at || row.created_at, 43200),
    })
  }
  for (const row of sources.objectionPatterns.slice(0, 20)) {
    const payload = rowPayload(row)
    entries.push({
      id: String(row.id || row.code || payload.id || ''),
      title: text(row.name, text(row.title, text(payload.title, 'Objection commerciale'))),
      memoryType: 'objection',
      segment: text(firstPresent(payload.segment, row.segment_code)) || undefined,
      territory: text(firstPresent(payload.territory, row.territory_code)) || undefined,
      outcome: text(firstPresent(payload.recommendedResponse, payload.response, row.response_guidance), 'Réponse institutionnelle disponible.'),
      confidence: clampPercent(firstPresent(payload.confidence, row.confidence_score, 65)),
      evidenceCount: stringArray(payload.evidenceRefs).length,
      reusable: true,
      sourceObjectIds: [String(row.id || '')],
      lastObservedAt: isoDate(row.updated_at || row.created_at),
      freshness: freshness('revenue_os_objection_patterns', row.updated_at || row.created_at, 43200),
    })
  }
  for (const experiment of experiments.filter((item) => Boolean(item.winningVariant)).slice(0, 10)) {
    entries.push({
      id: `learning-${experiment.id}`,
      title: `Approche gagnante · ${experiment.title}`,
      memoryType: 'winning-play',
      outcome: `${experiment.winningVariant} affiche un indicateur de ${experiment.challengerMetric} avec un lift de ${experiment.liftPercent}%.`,
      confidence: experiment.confidence,
      evidenceCount: experiment.sampleSize,
      reusable: experiment.confidence >= 70,
      sourceObjectIds: [experiment.id],
      lastObservedAt: experiment.freshness.observedAt,
      freshness: experiment.freshness,
    })
  }
  return entries.sort((a, b) => b.confidence - a.confidence).slice(0, 50)
}

function buildTimeline(sources: RawCockpitSources, signals: LiveSignalSummary[], runs: CommandRunSummary[], exceptions: Array<{ id: string; title: string; summary: string; createdAt: string; sourceZone: any; severity: CockpitSeverity }>): CockpitTimelineEvent[] {
  const events: CockpitTimelineEvent[] = []
  for (const signal of signals.slice(0, 30)) events.push({ id: `timeline-signal-${signal.id}`, eventType: 'signal.detected', title: signal.title, summary: signal.summary, occurredAt: signal.occurredAt, sourceZone: 'live-signals', sourceId: signal.id, consequence: signal.recommendedActions[0], severity: signal.severity })
  for (const run of runs.slice(0, 40)) events.push({ id: `timeline-run-${run.kind}-${run.id}`, eventType: `${run.kind}.${run.status}`, title: run.title, summary: run.lastError || `Statut ${run.status}`, occurredAt: run.completedAt || run.startedAt || run.scheduledAt || new Date().toISOString(), sourceZone: runZone(run.kind), sourceId: run.id, actor: run.owner, consequence: run.nextAction, severity: run.status === 'failed' || run.status === 'dead_letter' ? 'high' : 'info' })
  for (const exception of exceptions.slice(0, 30)) events.push({ id: `timeline-exception-${exception.id}`, eventType: 'exception.opened', title: exception.title, summary: exception.summary, occurredAt: exception.createdAt, sourceZone: exception.sourceZone, sourceId: exception.id, severity: exception.severity })
  for (const row of sources.approvalDecisions.slice(0, 20)) {
    const payload = rowPayload(row)
    events.push({ id: `timeline-approval-${row.id}`, eventType: 'approval.decided', title: text(payload.title, `Décision ${text(row.decision, text(payload.decision, 'recorded'))}`), summary: text(payload.reason, text(row.reason, 'Décision enregistrée.')), occurredAt: isoDate(row.created_at) || new Date().toISOString(), sourceZone: 'approvals-governance', sourceId: String(row.id || ''), actor: text(row.actor_id, text(payload.actor)), severity: text(row.decision, text(payload.decision)) === 'rejected' ? 'high' : 'info' })
  }
  return events.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
}

function buildZoneHealth(input: {
  objective: ObjectiveCommandSummary | null
  signals: LiveSignalSummary[]
  strategies: StrategyAssemblySummary[]
  council: CouncilSummary | null
  programs: RevenueProgramSummary[]
  runs: CommandRunSummary[]
  waves: CampaignWaveSummary[]
  compiler: CompilerStatusSummary
  execution: ExecutionProgressSummary
  exceptions: Array<{ priority: string; freshness: any }>
  experiments: ExperimentSummary[]
  learning: LearningMemorySummary[]
  approvals: ApprovalGovernanceSummary[]
}, sources: RawCockpitSources): CockpitZoneHealth[] {
  const unhealthySources = Object.values(sources.sourceHealth).filter((item) => !item.ok).length
  const generatedAt = new Date().toISOString()
  const health = (zone: CockpitZoneHealth['zone'], records: number, criticalItems: number, source: string, observedAt?: string, emptyMessage = 'Aucune donnée disponible.'): CockpitZoneHealth => {
    const fresh = freshness(source, observedAt, 360)
    const status: CockpitZoneHealth['status'] = criticalItems > 0 ? 'blocked' : records === 0 ? 'empty' : fresh.state === 'stale' ? 'stale' : unhealthySources > 8 ? 'degraded' : 'healthy'
    return { zone, status, records, criticalItems, freshness: fresh, message: records === 0 ? emptyMessage : status === 'healthy' ? 'Zone opérationnelle et traçable.' : status === 'blocked' ? `${criticalItems} élément(s) critique(s) requièrent une intervention.` : fresh.message }
  }
  return [
    health('objective-command', input.objective ? 1 : 0, input.objective && input.objective.forecastPercent < 50 ? 1 : 0, 'objective', input.objective?.freshness.observedAt, 'Aucun objectif actif.'),
    health('live-signals', input.signals.length, input.signals.filter((item) => item.severity === 'critical').length, 'signals', input.signals[0]?.occurredAt),
    health('strategy-assembly', input.strategies.length, input.strategies.filter((item) => item.risksHigh > 0 && !item.approved).length, 'strategies', input.strategies[0]?.freshness.observedAt),
    health('validation-council', input.council ? 1 : 0, input.council?.blockingFindings || 0, 'council', input.council?.freshness.observedAt),
    health('active-programs', input.programs.length, input.programs.filter((item) => item.stopConditionTriggered).length, 'programs', input.programs[0]?.freshness.observedAt),
    health('command-runs', input.runs.length, input.runs.filter((item) => ['failed','dead_letter'].includes(item.status)).length, 'runs', input.runs[0]?.freshness.observedAt),
    health('campaign-waves', input.waves.length, input.waves.filter((item) => item.status === 'blocked').length, 'waves', input.waves[0]?.freshness.observedAt),
    health('mission-compiler', input.compiler.generatedObjects, input.compiler.blockingConflicts, 'compiler', input.compiler.freshness.observedAt),
    health('execution-progress', Object.values(input.execution.deliveryStates).reduce((sum, value) => sum + value, 0), input.execution.failed + input.execution.deadLetters, 'execution', input.execution.freshness.observedAt),
    health('revenue-exceptions', input.exceptions.length, input.exceptions.filter((item) => item.priority === 'P0' || item.priority === 'P1').length, 'exceptions', input.exceptions[0]?.freshness?.observedAt),
    health('experiments-winning-plays', input.experiments.length, 0, 'experiments', input.experiments[0]?.freshness.observedAt),
    health('revenue-learning-memory', input.learning.length, 0, 'learning', input.learning[0]?.freshness.observedAt),
    health('approvals-governance', input.approvals.length, input.approvals.filter((item) => item.expiresAt && new Date(item.expiresAt).getTime() < Date.now() && !['approved','rejected'].includes(item.status)).length, 'approvals', input.approvals[0]?.freshness.observedAt),
  ].map((item) => ({ ...item, freshness: { ...item.freshness, refreshedAt: generatedAt } }))
}

function normalizeSeverity(value: string): CockpitSeverity {
  if (value === 'critical' || value === 'high' || value === 'low' || value === 'info') return value
  return 'medium'
}

function severityWeight(value: CockpitSeverity): number {
  return { critical: 0, high: 1, medium: 2, low: 3, info: 4 }[value]
}

function progressFromStatus(status: string): number {
  if (['completed','succeeded'].includes(status)) return 1
  if (['active','in_progress','executing'].includes(status)) return 0.55
  if (['ready','compiled'].includes(status)) return 0.25
  return 0
}

function approvalWeight(status: string): number {
  if (['pending','requested','awaiting','awaiting_approval'].includes(status)) return 0
  if (['approved','conditional_approval'].includes(status)) return 1
  if (['rejected','revoked','expired'].includes(status)) return 2
  return 3
}

function normalizeExperimentDimension(value: string): ExperimentSummary['dimension'] {
  if (value === 'message' || value === 'channel' || value === 'offer' || value === 'territory' || value === 'segment' || value === 'timing') return value
  return 'command-family'
}

function runZone(kind: CommandRunSummary['kind']): CockpitTimelineEvent['sourceZone'] {
  if (kind === 'gemini') return 'strategy-assembly'
  if (kind === 'council') return 'validation-council'
  if (kind === 'compilation') return 'mission-compiler'
  if (kind === 'propagation' || kind === 'adapter' || kind === 'webhook') return 'execution-progress'
  return 'command-runs'
}

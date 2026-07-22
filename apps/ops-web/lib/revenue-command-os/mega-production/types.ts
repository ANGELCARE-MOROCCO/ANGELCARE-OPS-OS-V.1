export const LEARNING_SCOPE = [
  'strategy_outcome_memory','command_ranking','segment_response_learning','message_experiments','channel_experiments',
  'control_groups','attribution','adaptive_scheduling','weak_strategy_suppression','winning_strategy_scaling',
  'forecast_calibration','anomaly_detection','outcome_feedback',
] as const
export const PRODUCTION_SCOPE = [
  'worker_scaling','durable_queues','retries','dead_letter_queues','distributed_locking','idempotency','observability',
  'trace_inspection','model_registry','prompt_registry','doctrine_registry','automated_evaluations','regression_testing',
  'cost_controls','confidence_thresholds','fallback_models','emergency_stop','rollback','disaster_recovery','security_review',
  'production_activation_controls',
] as const
export type LearningCapability=(typeof LEARNING_SCOPE)[number]
export type ProductionCapability=(typeof PRODUCTION_SCOPE)[number]
export type ActivationLevel=0|1|2|3|4|5|6
export type SystemMode='disabled'|'shadow'|'internal_only'|'draft_generation'|'approval_required'|'limited_autopilot'|'department_autonomy'|'suspended'|'emergency_stop'
export type JobStatus='scheduled'|'queued'|'leased'|'running'|'retry_scheduled'|'succeeded'|'failed'|'dead_letter'|'cancelled'
export type ExperimentStatus='draft'|'review'|'approved'|'running'|'paused'|'completed'|'stopped'|'invalid'
export type RegistryStatus='draft'|'testing'|'approved'|'active'|'degraded'|'rolled_back'|'retired'
export type AnomalyClass='commercial'|'operational'|'financial'|'ai_model'|'security'|'infrastructure'|'data_quality'
export type Severity='critical'|'high'|'medium'|'low'|'info'
export interface MegaActor{ id:string; tenantId:string; displayName:string; role:string; permissions:string[] }
export interface StrategyOutcome{ id:string; tenantId:string; strategyId:string; strategyVersionId:string; objectiveId:string; status:string; plannedRevenue:number; actualRevenue:number; plannedMargin:number; actualMargin:number; pipelineCreated:number; meetings:number; proposals:number; conversions:number; executionCompleteness:number; attributionConfidence:number; lessons:string[]; observedAt:string }
export interface CommandPerformance{ commandCode:string; segment?:string; territory?:string; selections:number; executions:number; successes:number; revenueContribution:number; marginContribution:number; successRate:number; confidence:number; state:'unproven'|'promising'|'validated'|'high_performing'|'context_specific'|'underperforming'|'suppressed'|'retired'|'review_required'; updatedAt:string }
export interface SegmentLearning{ segment:string; territory?:string; sampleSize:number; confidence:number; winningOffers:string[]; winningChannels:string[]; winningMessages:string[]; failedPatterns:string[]; responseWindow?:string; evidenceIds:string[]; recalculatedAt:string }
export interface ExperimentVariant{ id:string; code:string; label:string; allocationPercent:number; payload:Record<string,unknown>; control:boolean }
export interface RevenueExperiment{ id:string; tenantId:string; code:string; name:string; experimentType:string; hypothesis:string; primaryMetric:string; secondaryMetrics:string[]; status:ExperimentStatus; eligiblePopulation:Record<string,unknown>; variants:ExperimentVariant[]; sampleSize:number; startAt?:string; endAt?:string; stopRules:Record<string,unknown>[]; riskLimit:Record<string,unknown>; approvalClass:string; attributionWindowDays:number; result?:Record<string,unknown>; confidence?:number }
export interface AttributionResult{ id:string; outcomeId:string; method:'first_touch'|'last_touch'|'multi_touch'|'campaign'|'command'|'strategy'|'human_intervention'|'rescue'; contributions:Array<{sourceType:string;sourceId:string;weight:number;confidence:number}>; totalValue:number; confidence:number; uncertainty:string[]; calculatedAt:string }
export interface ForecastCalibration{ id:string; targetType:string; targetId:string; predicted:number; actual:number; absoluteError:number; percentageError:number; bias:'over'|'under'|'accurate'; model?:string; promptVersion?:string; segment?:string; territory?:string; calibratedAt:string }
export interface Anomaly{ id:string; tenantId:string; anomalyClass:AnomalyClass; severity:Severity; title:string; description:string; baseline:number; observed:number; deviation:number; confidence:number; affectedObjects:string[]; businessImpact:string; recommendedAction:string; status:'open'|'acknowledged'|'investigating'|'resolved'|'dismissed'; detectedAt:string }
export interface DurableJob{ id:string; tenantId:string; queue:string; jobType:string; priority:number; status:JobStatus; scheduledAt:string; leaseOwner?:string; leaseExpiresAt?:string; fencingToken?:number; attempts:number; maxAttempts:number; payloadHash:string; lastError?:string; traceId:string; createdAt:string; updatedAt:string }
export interface WorkerHealth{ workerId:string; domain:string; status:'starting'|'healthy'|'degraded'|'draining'|'stopped'|'failed'; concurrency:number; activeJobs:number; processedJobs:number; failedJobs:number; heartbeatAt:string; version:string }
export interface QueueHealth{ queue:string; depth:number; oldestJobAgeSeconds:number; leased:number; retries:number; deadLetters:number; throughputPerMinute:number; successRate:number; status:'healthy'|'degraded'|'critical'|'paused' }
export interface DistributedLock{ lockKey:string; owner:string; fencingToken:number; acquiredAt:string; expiresAt:string; heartbeatAt:string; status:'active'|'released'|'expired' }
export interface RegistryEntry{ id:string; registry:'model'|'prompt'|'doctrine'; code:string; version:string; status:RegistryStatus; purpose:string; contentHash:string; qualityScore?:number; costProfile?:Record<string,unknown>; activatedAt?:string; retiredAt?:string; metadata:Record<string,unknown> }
export interface EvaluationSummary{ id:string; suiteCode:string; status:'queued'|'running'|'passed'|'failed'|'cancelled'; cases:number; assertions:number; failures:number; trigger:string; startedAt:string; completedAt?:string; artifact?:string }
export interface CostSummary{ period:string; aiCost:number; executionCost:number; totalCost:number; budget:number; utilizationPercent:number; costPerStrategy:number; costPerCouncil:number; costPerConversion:number; alerts:string[] }
export interface ConfidencePolicy{ code:string; minimumConfidence:number; maxRiskClass:string; allowedMode:SystemMode; evidenceMinimum:number; councilAgreementMinimum:number; actionTypes:string[]; active:boolean }
export interface EmergencyStop{ id:string; scope:'global'|'tenant'|'provider'|'adapter'|'campaign'|'program'|'worker'|'queue'|'action_type'; scopeId?:string; state:'normal'|'degraded'|'internal_only'|'external_suspended'|'draining'|'stopped'; reason:string; activatedBy?:string; activatedAt?:string; expiresAt?:string; restoredBy?:string; restoredAt?:string }
export interface ProductionActivation{ id:string; tenantId:string; level:ActivationLevel; mode:SystemMode; adapterScope:string[]; actionScope:string[]; riskScope:string[]; status:'draft'|'review'|'approved'|'active'|'expired'|'revoked'|'rolled_back'; approvedBy:string[]; effectiveAt?:string; expiresAt?:string; rollbackActivationId?:string }
export interface SecurityReview{ id:string; code:string; status:'planned'|'running'|'passed'|'failed'|'conditional'; critical:number; high:number; medium:number; low:number; findings:Array<{code:string;severity:Severity;title:string;status:string;owner?:string}>; completedAt?:string }
export interface DisasterRecoverySummary{ id:string; scenario:string; status:'planned'|'running'|'passed'|'failed'; rpoMinutes:number; rtoMinutes:number; actualRecoveryMinutes?:number; evidence:string[]; runAt?:string }
export interface MegaProductionDashboard{
  mode:SystemMode; activationLevel:ActivationLevel; learningCoverage:Record<LearningCapability,boolean>; productionCoverage:Record<ProductionCapability,boolean>;
  outcomes:StrategyOutcome[]; commandPerformance:CommandPerformance[]; segmentLearning:SegmentLearning[]; experiments:RevenueExperiment[];
  attributions:AttributionResult[]; calibrations:ForecastCalibration[]; anomalies:Anomaly[]; queues:QueueHealth[]; workers:WorkerHealth[];
  locks:DistributedLock[]; registries:RegistryEntry[]; evaluations:EvaluationSummary[]; cost:CostSummary; confidencePolicies:ConfidencePolicy[];
  emergencyStops:EmergencyStop[]; activation?:ProductionActivation; securityReview?:SecurityReview; disasterRecovery:DisasterRecoverySummary[];
  metrics:{queueDepth:number; oldestJobAgeSeconds:number; successRate:number; deadLetters:number; openAnomalies:number; activeExperiments:number; learningSamples:number; forecastAccuracy:number; activationSafetyScore:number};
  generatedAt:string; freshness:{state:'live'|'fresh'|'aging'|'stale';message:string}; externalActionsEnabled:boolean; approvedExternalActionsEnabled:boolean
}

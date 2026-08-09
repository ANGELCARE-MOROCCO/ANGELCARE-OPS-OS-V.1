import type { ContextSnapshot, RevenueStrategy } from '../strategy-brain/types'

export const COUNCIL_AGENT_CODES = [
  'chief_revenue_intelligence',
  'market_intelligence',
  'offer_monetization',
  'sales_conversion',
  'capacity_delivery',
  'revenue_risk_margin',
  'brand_authority',
  'commercial_red_team',
  'executive_optimizer',
  'independent_auditor',
] as const

export type CouncilAgentCode = typeof COUNCIL_AGENT_CODES[number]
export type CouncilVerdict = 'supported'|'supported_with_reservations'|'correction_required'|'evidence_required'|'capacity_blocked'|'margin_blocked'|'authority_blocked'|'high_risk'|'downgrade_recommended'|'reject'|'ready_for_optimization'
export type CouncilFindingSeverity = 'info'|'watch'|'material'|'critical'
export type CouncilClassification = 'blocked'|'rejected'|'needs_evidence'|'needs_correction'|'needs_capacity_validation'|'needs_margin_approval'|'needs_authority_approval'|'conditionally_viable'|'ready_for_executive_review'|'recommended_for_executive_review'
export type EvidenceClassification = 'verified_fact'|'approved_doctrine'|'current_business_data'|'calculated_inference'|'unverified_assumption'|'contradicted_claim'|'missing_evidence'

export interface CouncilAgentDefinition {code:CouncilAgentCode;displayName:string;purpose:string;controls:string[];promptCode:string;promptVersion:string;order:number;independent:boolean;blockingDomains:string[]}
export interface CouncilEvidenceCheck {id:string;claim:string;classification:EvidenceClassification;sourceIds:string[];freshness:'fresh'|'aging'|'stale'|'unknown';confidence:number;requiredAction?:string;blocking:boolean}
export interface CouncilFinding {id:string;title:string;description:string;severity:CouncilFindingSeverity;domain:string;evidenceIds:string[];blocking:boolean;correction:string;owner:string}
export interface CouncilContradiction {id:string;leftClaim:string;rightClaim:string;sourceIds:string[];severity:CouncilFindingSeverity;resolutionRequired:boolean;recommendedResolution:string}
export interface CouncilScoreCard {evidenceScore:number;opportunityScore:number;feasibilityScore:number;executionScore:number;capacityScore:number;profitabilityScore:number;riskScore:number;confidence:number;explanations:Record<string,string>;blockingDimensions:string[]}
export interface CouncilReview {id:string;runId:string;tenantId:string;strategyId:string;strategyVersion:string;agentCode:CouncilAgentCode;verdict:CouncilVerdict;summary:string;findings:CouncilFinding[];evidenceChecks:CouncilEvidenceCheck[];contradictions:CouncilContradiction[];score:CouncilScoreCard;unsupportedClaims:string[];blockingIssues:string[];requiredCorrections:string[];recommendedImprovements:string[];unresolvedQuestions:string[];provider:'gemini'|'deterministic';model:string;promptVersion:string;requestHash:string;responseHash:string;inputTokens:number;outputTokens:number;latencyMs:number;fallbackUsed:boolean;externalActions:0;reviewedAt:string}
export interface CouncilDisagreement {id:string;runId:string;strategyId:string;agentCodes:CouncilAgentCode[];dimension:string;description:string;scoreSpread:number;severity:CouncilFindingSeverity;resolutionOptions:string[];status:'open'|'resolved'|'escalated';resolution?:string}
export interface RedTeamAttack {id:string;runId:string;strategyId:string;scenario:string;attackVector:string;failureMechanism:string;probability:number;impact:number;existingDefense:string;residualRisk:string;requiredCountermeasure:string;stopCondition:string;survived:boolean}
export interface StrategyCorrection {id:string;component:string;before:string;after:string;findingIds:string[];reason:string;impact:string}
export interface OptimizedStrategyPackage {id:string;runId:string;sourceStrategyId:string;sourceVersion:string;optimizedVersion:string;strategy:RevenueStrategy;corrections:StrategyCorrection[];scoreBefore:CouncilScoreCard;scoreAfter:CouncilScoreCard;remainingLimitations:string[];createdAt:string}
export interface CouncilAuditResult {complete:boolean;independentReviews:number;requiredAgents:number;missingAgents:CouncilAgentCode[];traceComplete:boolean;evidenceTraceComplete:boolean;externalActions:0;violations:string[];auditorVerdict:'pass'|'pass_with_reservations'|'fail'}
export interface CouncilRun {id:string;tenantId:string;objectiveId:string;strategyId:string;strategyVersion:string;contextSnapshotId:string;status:'queued'|'reviewing'|'cross_examining'|'optimizing'|'auditing'|'completed'|'blocked'|'failed'|'cancelled';idempotencyKey:string;requestedBy:string;startedAt:string;completedAt?:string;externalActions:0}
export interface CouncilClassificationResult {classification:CouncilClassification;reason:string;blockingIssues:string[];conditions:string[];score:CouncilScoreCard;readyForMZ12:boolean}
export interface CouncilRunResult {run:CouncilRun;strategy:RevenueStrategy;context:ContextSnapshot;reviews:CouncilReview[];disagreements:CouncilDisagreement[];redTeamAttacks:RedTeamAttack[];optimized?:OptimizedStrategyPackage;audit:CouncilAuditResult;classification:CouncilClassificationResult}
export interface CouncilAgentInput {run:CouncilRun;strategy:RevenueStrategy;context:ContextSnapshot;agent:CouncilAgentDefinition;priorReviews?:CouncilReview[];redTeamAttacks?:RedTeamAttack[]}

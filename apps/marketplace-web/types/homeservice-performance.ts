export type HealthState='healthy'|'degraded'|'attention'|'blocked'|'unavailable'|'unknown'
export type Severity='info'|'opportunity'|'warning'|'material'|'blocking'|'critical'
export type CaseStatus='open'|'acknowledged'|'investigating'|'resolution_proposed'|'awaiting_customer_confirmation'|'resolved'|'closed'
export type SignalStatus='open'|'under_review'|'root_cause_required'|'improvement_proposed'|'accepted'|'rejected'|'closed'
export type ImprovementStatus='draft'|'impact_review'|'technical_review'|'commercial_review'|'safety_review'|'approval_required'|'approved'|'rejected'|'pilot'|'released'
export interface PerformanceMetric{code:string;label:string;value:number|null;unit:string;status:HealthState;source:string;measuredAt:string|null}
export interface MissionVariance{id:string;missionId:number;subMissionId:number|null;domain:string;plannedValue:unknown;actualValue:unknown;variance:number|null;classification:string;severity:Severity;reason:string;status:string}
export interface CustomerFeedback{id:string;missionId:number|null;sellableVersionId:string|null;customerRef:string;rating:number|null;csat:number|null;nps:number|null;effortScore:number|null;outcomeScore:number|null;narrative:string;createdAt:string|null}
export interface CustomerExperienceCase{id:string;code:string;caseType:string;severity:Severity;status:CaseStatus;customerRef:string;missionId:number|null;sellableVersionId:string|null;summary:string;customerConfirmed:boolean;openedAt:string|null;dueAt:string|null;closedAt:string|null}
export interface QualitySignal{id:string;code:string;signalType:string;severity:Severity;status:SignalStatus;title:string;summary:string;sourceCount:number;customerImpact:string;operationalImpact:string;commercialImpact:string;createdAt:string|null}
export interface ImprovementProposal{id:string;code:string;targetType:string;targetId:string;status:ImprovementStatus;title:string;hypothesis:string;expectedBenefit:string;riskSummary:string;safetyReviewRequired:boolean;createdAt:string|null}
export interface HealthCheck{id:string;code:string;label:string;state:HealthState;verified:boolean;detail:string;checkedAt:string|null}
export interface AlertEvent{id:string;code:string;severity:Severity;status:string;title:string;sourceType:string;sourceId:string;ownerId:string|null;dueAt:string|null;createdAt:string|null}
export interface ReconciliationFinding{id:string;domain:string;severity:Severity;status:string;expectedValue:unknown;actualValue:unknown;detail:string;createdAt:string|null}
export interface ReadinessControl{id:string;code:string;label:string;status:'not_started'|'in_progress'|'passed'|'failed'|'blocked';blocking:boolean;evidenceCount:number;ownerId:string|null;verifiedAt:string|null}
export interface PilotProgramme{id:string;code:string;title:string;status:string;startDate:string|null;endDate:string|null;missionLimit:number;successCriteria:unknown;stopConditions:unknown}
export interface SystemIncident{id:string;code:string;incidentType:string;severity:Severity;status:string;title:string;summary:string;ownerId:string|null;detectedAt:string|null;resolvedAt:string|null}
export interface ExecutiveIntervention{id:string;sourceType:string;sourceId:string;severity:Severity;title:string;consequence:string;requiredAction:string;ownerId:string|null;dueAt:string|null}
export interface PerformanceDashboard{
  metrics:PerformanceMetric[]
  variances:MissionVariance[]
  feedback:CustomerFeedback[]
  cases:CustomerExperienceCase[]
  qualitySignals:QualitySignal[]
  improvements:ImprovementProposal[]
  healthChecks:HealthCheck[]
  alerts:AlertEvent[]
  reconciliationFindings:ReconciliationFinding[]
  readinessControls:ReadinessControl[]
  pilots:PilotProgramme[]
  incidents:SystemIncident[]
  interventions:ExecutiveIntervention[]
  provider:{route:'openrouter/free';configured:boolean;advisoryOnly:true;lastActualModel:string|null;lastFailure:string|null}
}

import type { ContextSnapshot, RevenueObjective, RevenueStrategy, StrategyComparison } from '../strategy-brain/types'
import type { CouncilReview, CouncilClassificationResult, RedTeamAttack, CouncilDisagreement } from '../validation-council/types'

export const STUDIO_WORKSPACES = [
  'executive_overview','revenue_objective','live_situation','strategy_assembly','strategy_comparison',
  'assumption_inspector','evidence_viewer','red_team_findings','capacity_simulation','constraint_simulation',
  'outcome_simulation','optimization_history','approval_center','version_timeline','executive_decision_memo','audit',
] as const
export type StudioWorkspace = typeof STUDIO_WORKSPACES[number]

export const STUDIO_ACTIONS = [
  'approve','reject','amend','combine','request_reanalysis','request_evidence','change_objective',
  'change_constraint','change_approval_class','archive','reopen','export_memo',
] as const
export type StudioAction = typeof STUDIO_ACTIONS[number]
export type ApprovalClass = 'standard'|'financial'|'capacity'|'managing_director'|'multi_director'|'conditional_pilot'|'high_risk_exception'
export type StudioStatus = 'awaiting_executive_review'|'under_review'|'evidence_requested'|'reanalysis_requested'|'amendment_requested'|'conditional_approval'|'approved'|'rejected'|'archived'|'reopened'|'approval_expired'|'approval_revoked'|'superseded'|'ready_for_mz13'
export type DecisionType = 'approved'|'conditionally_approved'|'rejected'|'returned_for_amendment'|'evidence_requested'|'reanalysis_requested'
export type ConditionType = 'territory'|'pilot_window'|'no_discount'|'capacity_confirmation'|'evidence_required'|'budget_ceiling'|'named_accounts'|'deadline'|'margin_floor'|'custom'

export interface StudioActor { id:string; displayName:string; role:string; permissions:string[] }
export interface ApprovalRequirement { id:string; strategyId:string; strategyVersion:string; approvalClass:ApprovalClass; requiredRoles:string[]; minimumDecisions:number; unanimous:boolean; expiresAt?:string; status:'pending'|'satisfied'|'expired'|'revoked' }
export interface ApprovalCondition { id:string; type:ConditionType; label:string; operator:'equals'|'in'|'not_in'|'gte'|'lte'|'before'|'after'|'confirmed'|'custom'; value:unknown; status:'pending'|'satisfied'|'failed'|'waived'; machineReadable:true; evidenceIds:string[] }
export interface ApprovalDecision { id:string; requestId:string; strategyId:string; strategyVersion:string; actor:StudioActor; decision:DecisionType; reason:string; conditions:ApprovalCondition[]; decidedAt:string; externalActions:0 }
export interface ApprovalRequest { id:string; tenantId:string; strategyId:string; strategyVersion:string; approvalClass:ApprovalClass; status:StudioStatus; requestedBy:string; requestedAt:string; requirements:ApprovalRequirement[]; decisions:ApprovalDecision[]; conditions:ApprovalCondition[]; expiresAt?:string; idempotencyKey:string; }

export interface EvidenceViewItem { id:string; claim:string; classification:string; sourceIds:string[]; freshness:string; confidence:number; blocking:boolean; provenance:string; }
export interface AssumptionViewItem { id:string; statement:string; source:string; confidence:number; impact:string; status:string; owner:string; validationRequired:boolean; affectedComponents:string[]; councilFindings:string[] }
export interface CapacitySimulationResult { scenario:string; available:number; required:number; utilization:number; feasible:boolean; overload:number; warnings:string[] }
export interface ConstraintSimulationInput { budgetMultiplier:number; deadlineShiftDays:number; marginFloor?:number; territoryCount?:number; staffAvailability:number; discountCeiling?:number }
export interface ConstraintSimulationResult { input:ConstraintSimulationInput; feasibility:number; expectedRevenueFactor:number; capacityFactor:number; riskFactor:number; blockers:string[]; recommendations:string[] }
export interface OutcomeBand { name:'conservative'|'base'|'upside'|'downside'|'capacity_constrained'|'delayed_conversion'; revenue:number; pipeline:number; meetings:number; proposals:number; grossMargin:number; confidence:number }
export interface OutcomeSimulationResult { bands:OutcomeBand[]; assumptions:string[]; generatedAt:string; simulationOnly:true }
export interface StrategyVersionEntry { id:string; strategyId:string; version:string; status:string; source:string; createdAt:string; actor?:string; summary:string; parentVersion?:string }
export interface CompilationPreview { revenuePlays:number; programs:number; campaigns:number; waves:number; accountPlans:number; missions:number; tasks:number; steps:number; scripts:number; approvalGates:number; kpis:number; risks:string[]; conditional:boolean }
export interface ExecutiveMemo { id:string; tenantId:string; strategyId:string; strategyVersion:string; memoVersion:string; title:string; decisionRequested:string; objective:string; recommendedStrategy:string; rejectedAlternatives:string[]; rationale:string[]; evidenceSummary:string[]; councilVerdict:string; scoreSummary:Record<string,number>; revenueAndMarginOutlook:Record<string,number>; capacityRequirements:string[]; assumptions:string[]; materialRisks:string[]; redTeamFindings:string[]; approvalConditions:ApprovalCondition[]; stopConditions:string[]; compilationPreview:CompilationPreview; decision?:DecisionType; decisionMakers:string[]; generatedAt:string; generatedBy:string; externalActions:0 }
export interface StudioAuditEvent { id:string; tenantId:string; strategyId:string; strategyVersion:string; action:StudioAction|'view'|'simulate'|'memo_generated'; actorId:string; previousStatus?:StudioStatus; newStatus?:StudioStatus; reason:string; payload:Record<string,unknown>; createdAt:string; externalActions:0 }
export interface StrategyStudioDossier { tenantId:string; objective:RevenueObjective; strategy:RevenueStrategy; context:ContextSnapshot; comparison?:StrategyComparison; council:{reviews:CouncilReview[];classification?:CouncilClassificationResult;redTeamAttacks:RedTeamAttack[];disagreements:CouncilDisagreement[]}; evidence:EvidenceViewItem[]; assumptions:AssumptionViewItem[]; approval?:ApprovalRequest; versions:StrategyVersionEntry[]; capacitySimulation:CapacitySimulationResult[]; outcomeSimulation:OutcomeSimulationResult; compilationPreview:CompilationPreview; status:StudioStatus; }
export interface StudioActionInput { tenantId:string; actor:StudioActor; action:StudioAction; strategyId:string; strategyVersion:string; reason:string; idempotencyKey:string; approvalClass?:ApprovalClass; conditions?:ApprovalCondition[]; sourceStrategyIds?:string[]; amendment?:Record<string,unknown>; objectiveChanges?:Record<string,unknown>; constraintChanges?:Record<string,unknown>; }
export interface StudioActionResult { action:StudioAction; strategyId:string; sourceVersion:string; resultingVersion?:string; previousStatus:StudioStatus; newStatus:StudioStatus; approval?:ApprovalRequest; memo?:ExecutiveMemo; requiresCouncilRevalidation:boolean; readyForMZ13:boolean; externalActions:0 }

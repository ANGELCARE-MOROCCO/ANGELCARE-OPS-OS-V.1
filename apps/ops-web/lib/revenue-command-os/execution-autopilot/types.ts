import type { CompilationBlueprint, CompiledTask } from '../mission-compiler/types'

export const ADAPTER_CODES=['b2b_partnerships','traininghub_commercial','email_os','gmail','whatsapp','calendar','opportunities','account_plans','campaigns','meetings','proposals','payments','trainer_planning','academy_delivery','reporting','internal_tasks'] as const
export type AdapterCode=typeof ADAPTER_CODES[number]
export const MANDATORY_ACTION_TYPES=['create_campaign','create_account_wave','assign_account','prepare_message','prepare_email','schedule_followup','propose_meeting','prepare_meeting_brief','draft_proposal','request_approval','update_stage','launch_rescue_mission','create_delivery_handoff','create_payment_followup','initiate_renewal'] as const
export type MandatoryActionType=typeof MANDATORY_ACTION_TYPES[number]
export const EXTENDED_ACTION_TYPES=['send_email','send_whatsapp','create_calendar_event','send_proposal'] as const
export type ExtendedActionType=typeof EXTENDED_ACTION_TYPES[number]
export type ExecutionActionType=MandatoryActionType|ExtendedActionType
export type ExecutionMode='shadow'|'internal_only'|'approval_required'|'limited_autopilot'|'suspended'|'emergency_stop'
export type AdapterStatus='configured'|'healthy'|'degraded'|'approval_only'|'credentials_missing'|'authentication_failed'|'rate_limited'|'temporarily_unavailable'|'suspended'|'emergency_stopped'
export type ActionStatus='draft'|'validated'|'awaiting_approval'|'approved'|'queued'|'leased'|'executing'|'succeeded'|'failed'|'retry_scheduled'|'dead_letter'|'rejected'|'cancelled'|'rolled_back'|'compensated'|'suppressed'
export type PropagationStatus='draft'|'validating'|'prepared'|'partially_ready'|'ready'|'activating'|'active'|'paused'|'completed'|'failed'|'cancelled'|'rolled_back'|'blocked'
export type Reversibility='reversible'|'compensatable'|'cancellable'|'irreversible'
export type TransportKind='internal_api'|'supabase_rpc'|'google_api'|'whatsapp_cloud'|'webhook'|'disabled'

export interface ExecutionActor { id:string; displayName:string; role:string; permissions:string[]; tenantId:string }
export interface ExecutionSource { objectiveId:string; strategyId:string; strategyVersion:string; approvalRequestId:string; approvalDecisionId:string; compilationId:string; programId?:string; campaignId?:string; waveId?:string; accountPlanId?:string; missionId?:string; taskId?:string }
export interface ExecutionTarget { module:string; entityType:string; entityId?:string; externalAddress?:string }
export interface ExecutionApproval { class:string; required:boolean; decisionId?:string; approvedBy?:string; approvedAt?:string; validUntil?:string; conditions:string[]; payloadHash?:string }
export interface ExecutionControls { idempotencyKey:string; executionMode:ExecutionMode; maximumAttempts:number; timeoutMs:number; rollbackPolicy:Reversibility; sensitive:boolean; externalAction:boolean; approvalRequired:boolean }
export interface ExecutionAction { id:string; tenantId:string; propagationRunId:string; packageId:string; adapterCode:AdapterCode; actionType:ExecutionActionType; source:ExecutionSource; target:ExecutionTarget; payload:Record<string,unknown>; approval:ExecutionApproval; controls:ExecutionControls; status:ActionStatus; priority:number; scheduledAt?:string; createdAt:string; updatedAt:string; lastError?:string; externalReference?:string; attemptCount:number; generation:number }
export interface ExecutionAttempt { id:string; actionId:string; tenantId:string; attemptNumber:number; status:'started'|'succeeded'|'failed'|'retryable'|'non_retryable'; startedAt:string; completedAt?:string; latencyMs?:number; errorCode?:string; errorMessage?:string; responseHash?:string; providerRequestId?:string }
export interface ExecutionResult { actionId:string; adapterCode:AdapterCode; status:'prepared'|'executed'|'simulated'|'failed'; externalReference?:string; reversible:Reversibility; payload:Record<string,unknown>; executedAt:string; externalAction:boolean }
export interface AdapterConfig { code:AdapterCode; label:string; transport:TransportKind; enabled:boolean; executionMode:ExecutionMode; allowInternal:boolean; allowApprovedExternal:boolean; endpointEnv?:string; credentialEnvNames:string[]; supportedActions:ExecutionActionType[]; timeoutMs:number; maximumAttempts:number; sensitive:boolean; metadata:Record<string,unknown> }
export interface AdapterHealth { code:AdapterCode; status:AdapterStatus; configured:boolean; enabled:boolean; executionMode:ExecutionMode; lastSuccessAt?:string; lastFailureAt?:string; failureRate:number; message:string; checkedAt:string; details:Record<string,unknown> }
export interface AdapterValidationResult { valid:boolean; blockers:string[]; warnings:string[]; approvalRequired:boolean; externalAction:boolean; payloadHash:string }
export interface PreparedAdapterAction { action:ExecutionAction; request:Record<string,unknown>; redactedPreview:Record<string,unknown>; reversible:Reversibility }
export interface AdapterExecutionResult { success:boolean; statusCode?:number; externalReference?:string; providerRequestId?:string; payload:Record<string,unknown>; retryable:boolean; errorCode?:string; errorMessage?:string; reversible:Reversibility }
export interface CompensationResult { success:boolean; actionId:string; kind:'rollback'|'cancel'|'compensation'|'suppression'; reference?:string; message:string; at:string }
export interface PropagationPackage { id:string; tenantId:string; compilationRunId:string; strategyId:string; strategyVersion:string; approvalDecisionId:string; status:'prepared_shadow'|'ready'|'activated'|'superseded'|'cancelled'; idempotencyKey:string; blueprintSummary:Record<string,number>; payload:Record<string,unknown>; createdAt:string; updatedAt:string }
export interface PropagationRun { id:string; tenantId:string; packageId:string; compilationRunId:string; status:PropagationStatus; executionMode:ExecutionMode; idempotencyKey:string; requestedBy:string; sourceHash:string; preparedActions:number; queuedActions:number; succeededActions:number; failedActions:number; externalActionsExecuted:number; startedAt:string; completedAt?:string; pausedAt?:string; cancelledAt?:string; lastError?:string }
export interface PropagationValidation { valid:boolean; status:'ready'|'partially_ready'|'blocked'; blockers:string[]; warnings:string[]; adapters:AdapterHealth[]; package:PropagationPackage; blueprint?:CompilationBlueprint }
export interface PropagationPreparation { run:PropagationRun; actions:ExecutionAction[]; counts:Record<AdapterCode,number>; approvalRequired:number; internalReady:number; externalPrepared:number; reusedExisting:boolean }
export interface ExecutionWebhookEvent { id:string; tenantId:string; adapterCode:AdapterCode; providerEventId:string; eventType:string; externalReference?:string; actionId?:string; payloadHash:string; payload:Record<string,unknown>; signatureValid:boolean; replayed:boolean; status:'received'|'processed'|'ignored'|'failed'; receivedAt:string; processedAt?:string }
export interface DeadLetter { id:string; tenantId:string; actionId:string; adapterCode:AdapterCode; reason:string; attempts:number; status:'open'|'retrying'|'resolved'|'discarded'; createdAt:string; resolvedAt?:string }
export interface ExecutionDashboard { packages:PropagationPackage[]; runs:PropagationRun[]; actions:ExecutionAction[]; adapters:AdapterHealth[]; counts:Record<string,number>; externalActionsExecuted:number; executionMode:ExecutionMode }
export interface ActionMappingContext { package:PropagationPackage; blueprint:CompilationBlueprint; task:CompiledTask; index:number }
export interface PreparePropagationInput { tenantId:string; actor:ExecutionActor; packageId:string; executionMode:ExecutionMode; idempotencyKey:string; dryRun:boolean }
export interface ActivatePropagationInput { tenantId:string; actor:ExecutionActor; runId:string; acknowledgeControls:true }

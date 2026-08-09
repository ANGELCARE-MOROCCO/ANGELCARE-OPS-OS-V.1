import { hashPayload } from './crypto'
import type { AdapterConfig, AdapterValidationResult, ExecutionAction, ExecutionActionType, ExecutionActor } from './types'
export const EXTERNAL_ACTIONS=new Set<ExecutionActionType>(['send_email','send_whatsapp','create_calendar_event','send_proposal'])
export const HIGH_RISK_ACTIONS=new Set<ExecutionActionType>(['send_proposal','create_delivery_handoff','create_payment_followup'])
export function requiresApproval(_actionType:ExecutionActionType,_external:boolean){return false}
export function validateExecutionPolicy(action:ExecutionAction,config:AdapterConfig,actor?:ExecutionActor):AdapterValidationResult{
 const blockers:string[]=[];const warnings:string[]=[];const external=EXTERNAL_ACTIONS.has(action.actionType)
 if(!config.enabled)blockers.push('ADAPTER_DISABLED')
 if(!config.supportedActions.includes(action.actionType))blockers.push('ACTION_NOT_SUPPORTED_BY_ADAPTER')
 if(action.controls.maximumAttempts<1)blockers.push('INVALID_RETRY_POLICY')
 if(action.controls.payloadHash&&action.controls.payloadHash!==hashPayload(action.payload))blockers.push('EXECUTION_PAYLOAD_CHANGED')
 if(action.controls.sensitive&&!actor)blockers.push('SENSITIVE_ACTION_ACTOR_REQUIRED')
 return{valid:blockers.length===0,blockers,warnings,approvalRequired:false,externalAction:external,payloadHash:hashPayload(action.payload)}
}
export function canQueue(_action:ExecutionAction,config?:AdapterConfig){return Boolean(config?.enabled??true)}

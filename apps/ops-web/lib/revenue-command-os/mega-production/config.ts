import type { ActivationLevel, SystemMode } from './types'
function bool(name:string,fallback:boolean){const value=process.env[name];return value===undefined?fallback:['1','true','yes','on'].includes(value.toLowerCase())}
function number(name:string,fallback:number){const value=Number(process.env[name]);return Number.isFinite(value)?value:fallback}
export interface MegaProductionConfig{enabled:boolean;mode:SystemMode;activationLevel:ActivationLevel;externalActions:boolean;approvedExternalActions:boolean;learningEnabled:boolean;experimentsEnabled:boolean;queueWorkerEnabled:boolean;maxConcurrency:number;leaseSeconds:number;maxAttempts:number;costBudgetUsd:number;minimumConfidence:number;emergencyStop:boolean}
export function megaProductionConfig():MegaProductionConfig{
 const emergencyStop=bool('REVENUE_OS_EMERGENCY_STOP',false)
 const configuredMode=(process.env.REVENUE_OS_EXECUTION_MODE||'approval_required') as SystemMode
 const level=Math.max(0,Math.min(6,number('REVENUE_OS_PRODUCTION_ACTIVATION_LEVEL',4))) as ActivationLevel
 return{enabled:bool('REVENUE_OS_MEGA_PRODUCTION_ENABLED',true),mode:emergencyStop?'emergency_stop':configuredMode,activationLevel:emergencyStop?0:level,externalActions:bool('REVENUE_OS_ALLOW_EXTERNAL_ACTIONS',false)&&level>=4&&!emergencyStop,approvedExternalActions:bool('REVENUE_OS_ALLOW_APPROVED_EXTERNAL_ACTIONS',false)&&level>=4&&!emergencyStop,learningEnabled:bool('REVENUE_OS_LEARNING_ENABLED',true),experimentsEnabled:bool('REVENUE_OS_EXPERIMENTS_ENABLED',true),queueWorkerEnabled:bool('REVENUE_OS_DURABLE_WORKERS_ENABLED',true),maxConcurrency:number('REVENUE_OS_WORKER_MAX_CONCURRENCY',8),leaseSeconds:number('REVENUE_OS_JOB_LEASE_SECONDS',120),maxAttempts:number('REVENUE_OS_JOB_MAX_ATTEMPTS',5),costBudgetUsd:number('REVENUE_OS_AI_DAILY_BUDGET_USD',20),minimumConfidence:number('REVENUE_OS_AUTONOMY_MIN_CONFIDENCE',0.85),emergencyStop}
}

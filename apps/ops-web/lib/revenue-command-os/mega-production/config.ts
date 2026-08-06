import type { ActivationLevel, SystemMode } from './types'
const bool=(name:string,fallback:boolean)=>{const value=process.env[name];return value===undefined?fallback:['1','true','yes','on'].includes(value.toLowerCase())}
const number=(name:string,fallback:number)=>{const value=Number(process.env[name]);return Number.isFinite(value)?value:fallback}
export interface MegaProductionConfig{enabled:boolean;mode:SystemMode;activationLevel:ActivationLevel;externalActions:boolean;approvedExternalActions:boolean;learningEnabled:boolean;experimentsEnabled:boolean;queueWorkerEnabled:boolean;maxConcurrency:number;leaseSeconds:number;maxAttempts:number;costBudgetUsd:number;minimumConfidence:number;emergencyStop:boolean}
export function megaProductionConfig():MegaProductionConfig{
 return{enabled:bool('REVENUE_OS_MEGA_PRODUCTION_ENABLED',true),mode:'live',activationLevel:6,externalActions:true,approvedExternalActions:true,learningEnabled:bool('REVENUE_OS_LEARNING_ENABLED',true),experimentsEnabled:bool('REVENUE_OS_EXPERIMENTS_ENABLED',true),queueWorkerEnabled:bool('REVENUE_OS_DURABLE_WORKERS_ENABLED',true),maxConcurrency:number('REVENUE_OS_WORKER_MAX_CONCURRENCY',8),leaseSeconds:number('REVENUE_OS_JOB_LEASE_SECONDS',120),maxAttempts:number('REVENUE_OS_JOB_MAX_ATTEMPTS',5),costBudgetUsd:number('REVENUE_OS_AI_DAILY_BUDGET_USD',20),minimumConfidence:0,emergencyStop:false}
}

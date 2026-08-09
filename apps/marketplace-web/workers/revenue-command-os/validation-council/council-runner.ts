import {runValidationCouncil} from '@/lib/revenue-command-os/validation-council/orchestrator'
export async function executeCouncilJob(payload:{tenantId:string;userId:string;strategyId:string;idempotencyKey:string}){return runValidationCouncil(payload)}

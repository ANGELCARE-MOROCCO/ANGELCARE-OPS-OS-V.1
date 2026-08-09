import { executionConfig } from './config'
import { effectiveRevenueOsAdapterConfig } from './channel-policy'
import { redactRecord } from './crypto'
import { validateExecutionPolicy } from './policies'
import type { AdapterConfig, AdapterExecutionResult, AdapterHealth, AdapterValidationResult, CompensationResult, ExecutionAction, PreparedAdapterAction, RevenueExecutionAdapter } from './adapter-contract'
export type { RevenueExecutionAdapter } from './adapter-contract'
export abstract class BaseExecutionAdapter implements RevenueExecutionAdapter{
 constructor(public readonly config:AdapterConfig){}
 async validate(action:ExecutionAction):Promise<AdapterValidationResult>{const effective=await effectiveRevenueOsAdapterConfig(action.tenantId,this.config);return validateExecutionPolicy(action,effective)}
 async prepare(action:ExecutionAction):Promise<PreparedAdapterAction>{return{action,request:action.payload,redactedPreview:redactRecord(action.payload),reversible:action.controls.rollbackPolicy}}
 abstract execute(prepared:PreparedAdapterAction):Promise<AdapterExecutionResult>
 async inspect(externalReference:string){return{found:Boolean(externalReference),status:'unknown',externalReference,payload:{}}}
 async compensate(action:ExecutionAction):Promise<CompensationResult>{return{success:false,actionId:action.id,kind:'compensation',message:'Adapter compensation is not supported for this action.',at:new Date().toISOString()}}
 async health():Promise<AdapterHealth>{const hardDisabled=this.config.code==='gmail'||this.config.code==='calendar';const config=hardDisabled?{...this.config,enabled:false}:this.config;const missing=config.credentialEnvNames.filter(key=>!process.env[key]);const configured=missing.length===0;return{code:config.code,status:!config.enabled?'suspended':configured?'healthy':'credentials_missing',configured,enabled:config.enabled,executionMode:config.executionMode,failureRate:0,message:configured?'Adapter configuration available.':`Missing: ${missing.join(', ')}`,checkedAt:new Date().toISOString(),details:{transport:config.transport,allowInternal:config.allowInternal,allowApprovedExternal:config.allowApprovedExternal,timeoutMs:config.timeoutMs,runtime:executionConfig().mode}}}
}

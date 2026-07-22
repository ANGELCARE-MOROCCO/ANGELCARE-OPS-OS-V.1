import { executionConfig } from './config'
import { redactRecord } from './crypto'
import { validateExecutionPolicy } from './policies'
import type { AdapterConfig, AdapterExecutionResult, AdapterHealth, AdapterValidationResult, CompensationResult, ExecutionAction, PreparedAdapterAction, RevenueExecutionAdapter } from './adapter-contract'
export type { RevenueExecutionAdapter } from './adapter-contract'
export abstract class BaseExecutionAdapter implements RevenueExecutionAdapter{
 constructor(public readonly config:AdapterConfig){}
 async validate(action:ExecutionAction):Promise<AdapterValidationResult>{return validateExecutionPolicy(action,this.config)}
 async prepare(action:ExecutionAction):Promise<PreparedAdapterAction>{const validation=await this.validate(action);if(!validation.valid)throw new Error(validation.blockers.join(','));return{action,request:action.payload,redactedPreview:redactRecord(action.payload),reversible:action.controls.rollbackPolicy}}
 abstract execute(prepared:PreparedAdapterAction):Promise<AdapterExecutionResult>
 async inspect(externalReference:string){return{found:Boolean(externalReference),status:'unknown',externalReference,payload:{}}}
 async compensate(action:ExecutionAction):Promise<CompensationResult>{return{success:false,actionId:action.id,kind:'compensation',message:'Adapter compensation is not supported for this action.',at:new Date().toISOString()}}
 async health():Promise<AdapterHealth>{const missing=this.config.credentialEnvNames.filter(key=>!process.env[key]);const configured=missing.length===0;return{code:this.config.code,status:!this.config.enabled?'suspended':configured?'healthy':'credentials_missing',configured,enabled:this.config.enabled,executionMode:this.config.executionMode,failureRate:0,message:configured?'Adapter configuration available.':`Missing: ${missing.join(', ')}`,checkedAt:new Date().toISOString(),details:{transport:this.config.transport,allowInternal:this.config.allowInternal,allowApprovedExternal:this.config.allowApprovedExternal,timeoutMs:this.config.timeoutMs,runtime:executionConfig().mode}}}
}

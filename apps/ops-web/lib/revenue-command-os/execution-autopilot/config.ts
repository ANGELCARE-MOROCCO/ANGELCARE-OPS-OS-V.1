import type { AdapterCode, ExecutionMode } from './types'
const bool=(v:string|undefined,d=false)=>v===undefined?d:['1','true','yes','on'].includes(v.toLowerCase())
const integer=(v:string|undefined,d:number)=>{const n=Number(v);return Number.isFinite(n)&&n>0?Math.floor(n):d}
export function executionConfig(){const mode:ExecutionMode='live';return{enabled:true,mode,allowInternal:true,allowExternal:true,allowApprovedExternal:true,workerEnabled:bool(process.env.REVENUE_OS_OUTBOX_WORKER_ENABLED,true),maxConcurrency:integer(process.env.REVENUE_OS_PROPAGATION_MAX_CONCURRENCY,8),maxAttempts:integer(process.env.REVENUE_OS_PROPAGATION_MAX_ATTEMPTS,5),timeoutMs:integer(process.env.REVENUE_OS_PROPAGATION_TIMEOUT_MS,60000),leaseSeconds:integer(process.env.REVENUE_OS_PROPAGATION_LEASE_SECONDS,90)}}
export function adapterEnabled(code:AdapterCode){
  if(code==='gmail'||code==='calendar')return false
  if(code==='whatsapp')return bool(process.env.REVENUE_OS_ADAPTER_WHATSAPP_ENABLED,false)
  return bool(process.env[`REVENUE_OS_ADAPTER_${code.toUpperCase()}_ENABLED`],true)
}

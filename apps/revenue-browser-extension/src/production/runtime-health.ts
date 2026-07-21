import { getSession } from '../storage.js'
import { normalizeError, onlineState, withRetry } from './reliability.js'

type HealthEvent = { component:string;status:'healthy'|'degraded'|'offline'|'blocked'|'unknown';eventType:string;latencyMs?:number;correlationId?:string;errorCode?:string;errorMessage?:string;metrics?:Record<string,unknown>;metadata?:Record<string,unknown>;occurredAt?:string }
type PerformanceSample = { metricKey:string;durationMs:number;sampleContext?:string;cacheState?:string;success?:boolean;metadata?:Record<string,unknown>;measuredAt?:string }
type AdapterSample = { adapterKey:string;selectorVersion?:string;status:'healthy'|'degraded'|'offline'|'blocked'|'unknown';success:boolean;errorCode?:string;errorMessage?:string;metadata?:Record<string,unknown> }
type Queue = { health:HealthEvent[];performance:PerformanceSample[];adapters:AdapterSample[] }
const QUEUE_KEY='angelcare.production.telemetry.queue'
const STATUS_KEY='angelcare.production.status.cache'
const MAX_QUEUE=200

async function getQueue():Promise<Queue>{ const row=await chrome.storage.local.get(QUEUE_KEY); return row[QUEUE_KEY]||{health:[],performance:[],adapters:[]} }
async function setQueue(queue:Queue){ await chrome.storage.local.set({[QUEUE_KEY]:{health:queue.health.slice(-MAX_QUEUE),performance:queue.performance.slice(-MAX_QUEUE),adapters:queue.adapters.slice(-MAX_QUEUE)}}) }
export async function recordHealth(event:HealthEvent){ const queue=await getQueue(); queue.health.push({...event,occurredAt:event.occurredAt||new Date().toISOString()}); await setQueue(queue) }
export async function recordPerformance(sample:PerformanceSample){ const queue=await getQueue(); queue.performance.push({...sample,measuredAt:sample.measuredAt||new Date().toISOString()}); await setQueue(queue) }
export async function recordAdapterHealth(sample:AdapterSample){ const queue=await getQueue(); queue.adapters.push(sample); await setQueue(queue) }
export async function measure<T>(metricKey:string,operation:()=>Promise<T>,context?:{component?:string;sampleContext?:string;cacheState?:string}):Promise<T>{
  const started=performance.now(); const correlationId=crypto.randomUUID()
  try{ const result=await operation(); const durationMs=performance.now()-started; await recordPerformance({metricKey,durationMs,sampleContext:context?.sampleContext,cacheState:context?.cacheState,success:true}); await recordHealth({component:context?.component||metricKey,status:'healthy',eventType:'operation_success',latencyMs:Math.round(durationMs),correlationId}); return result }
  catch(error){ const durationMs=performance.now()-started; const normalized=normalizeError(error); await recordPerformance({metricKey,durationMs,sampleContext:context?.sampleContext,cacheState:context?.cacheState,success:false}); await recordHealth({component:context?.component||metricKey,status:onlineState()?'degraded':'offline',eventType:'operation_failure',latencyMs:Math.round(durationMs),correlationId,errorCode:normalized.code,errorMessage:normalized.message}); throw error }
}
export async function flushProductionTelemetry(){
  const session=await getSession(); if(!session)return {ok:false,reason:'not_paired'}
  const queue=await getQueue(); if(!queue.health.length&&!queue.performance.length&&!queue.adapters.length)return {ok:true,empty:true}
  const manifest=chrome.runtime.getManifest()
  const payload={extensionVersion:manifest.version,releaseChannel:(await getProductionStatus(false))?.channel?.channel_key||'pilot',health:queue.health,performance:queue.performance,adapters:queue.adapters}
  try{
    await withRetry(async()=>{ const response=await fetch(`${session.apiBase}/api/browser-extension/v1/production/telemetry`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.accessToken}`,'X-AngelCare-Device-ID':session.deviceId},body:JSON.stringify(payload)}); if(!response.ok)throw new Error(`TELEMETRY_HTTP_${response.status}`); return response },{attempts:3,baseDelayMs:300})
    await setQueue({health:[],performance:[],adapters:[]}); return {ok:true,accepted:payload.health.length+payload.performance.length+payload.adapters.length}
  }catch(error){ return {ok:false,error:normalizeError(error)} }
}
export async function getProductionStatus(force=true):Promise<any>{
  const cached=(await chrome.storage.local.get(STATUS_KEY))[STATUS_KEY]
  if(!force&&cached&&Date.now()-Number(cached.cachedAt||0)<60000)return cached.data
  const session=await getSession(); if(!session)return null
  try{ const response=await fetch(`${session.apiBase}/api/browser-extension/v1/production/status`,{headers:{Authorization:`Bearer ${session.accessToken}`,'X-AngelCare-Device-ID':session.deviceId}}); if(!response.ok)throw new Error(`PRODUCTION_STATUS_HTTP_${response.status}`); const data=await response.json(); await chrome.storage.local.set({[STATUS_KEY]:{cachedAt:Date.now(),data}}); return data }
  catch(error){ await recordHealth({component:'release_update',status:onlineState()?'degraded':'offline',eventType:'production_status_failure',...normalizeError(error)} as any); return cached?.data||null }
}
export async function isProductionBlocked(scope='extension'){
  const status=await getProductionStatus(false); const switches=status?.killSwitches||[]
  return switches.find((row:any)=>row.active!==false&&(row.scope_type==='global'||row.scope_type===scope||row.scope_reference==='*'))||null
}

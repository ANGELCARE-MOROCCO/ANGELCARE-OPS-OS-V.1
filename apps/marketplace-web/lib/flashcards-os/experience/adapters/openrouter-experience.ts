import 'server-only'
import { createHash } from 'node:crypto'
import { extractJsonFromProviderText, openRouterFreeCompletion } from '@/lib/flashcards-os/intelligence/adapters/openrouter-free'
import { loadModelProfile } from '@/lib/flashcards-os/intelligence/server/repository'
const forbidden=['issue invoice','record payment','approve refund','confirm delivery','contact customer','close case autonomously']
const experienceSchema={type:'object',additionalProperties:false,properties:{summary:{type:'string'},findings:{type:'array',items:{type:'string'}},options:{type:'array',items:{type:'string'}},risks:{type:'array',items:{type:'string'}},recommendedHumanAction:{type:'string'},authorityReminder:{type:'string'}},required:['summary','findings','options','risks','recommendedHumanAction','authorityReminder']}
function sanitize(value:unknown):unknown{if(Array.isArray(value))return value.map(sanitize);if(value&&typeof value==='object'){return Object.fromEntries(Object.entries(value as Record<string,unknown>).filter(([key])=>!/(email|phone|birth|password|secret|token|address_line)/i.test(key)).map(([key,item])=>[key,sanitize(item)]))}return value}
export async function runExperienceAdvisory(task:'case_summary'|'root_cause'|'resolution_options'|'executive_brief'|'incident_brief',context:unknown){
  const profile=await loadModelProfile('experience_advisory')
  const system=`You are ANGELCARE Flashcards OS Customer Experience advisory intelligence. Human authority is absolute. You are advisory-only. Never approve, never issue, never contact customers, and never execute irreversible actions. Never calculate or alter authoritative financial values, quantities, eligibility, document status, delivery confirmation, refund approval, payment, or customer communication. Never ${forbidden.join(', ')}.`
  const payload={task,context:sanitize(context)}
  const result=await openRouterFreeCompletion({taskProfile:'experience_advisory',messages:[{role:'system',content:system},{role:'user',content:JSON.stringify(payload)}],temperature:profile.temperature,maxOutputTokens:profile.maxOutputTokens,timeoutMs:profile.timeoutMs,retryLimit:profile.retryLimit,jsonSchema:experienceSchema,metadata:{experience_task:task}})
  const parsed=extractJsonFromProviderText(result.rawContent) as any
  return{...parsed,task,modelRequested:result.requestedRoute,modelUsed:String(result.actualModel||'not-returned'),fallbackUsed:false,promptTokens:result.promptTokens,completionTokens:result.completionTokens,totalTokens:result.totalTokens,costUsd:result.providerReportedCostUsd,latencyMs:result.latencyMs,attemptCount:result.attemptCount,inputHash:createHash('sha256').update(JSON.stringify(payload)).digest('hex'),responseId:result.responseId,providerName:result.providerName}
}

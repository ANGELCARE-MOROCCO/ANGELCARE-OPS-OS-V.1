import 'server-only'

import { extractJsonFromProviderText, openRouterFreeCompletion } from '@/lib/flashcards-os/intelligence/adapters/openrouter-free'
import { loadModelProfile } from '@/lib/flashcards-os/intelligence/server/repository'

type CommercialIntelligenceTask = 'b2c_needs_summary' | 'b2c_solution_recommendation' | 'b2c_next_best_action' | 'b2b_account_summary' | 'b2b_stakeholder_analysis' | 'b2b_opportunity_strategy' | 'commercial_proposal_narrative' | 'objection_preparation' | 'negotiation_brief' | 'lost_opportunity_analysis' | 'renewal_risk_analysis' | 'receivable_followup_brief'
export type CommercialIntelligenceResult={task:CommercialIntelligenceTask;summary:string;recommendations:string[];risks:string[];nextActions:string[];modelRequested:string;modelUsed:string;fallbackUsed:boolean;promptTokens:number;completionTokens:number;totalTokens:number;costUsd:number;latencyMs:number;attemptCount:number;raw:unknown}
const schemas:Record<CommercialIntelligenceTask,Record<string,unknown>>={
 b2c_needs_summary:baseSchema(),b2c_solution_recommendation:baseSchema(),b2c_next_best_action:baseSchema(),b2b_account_summary:baseSchema(),b2b_stakeholder_analysis:baseSchema(),b2b_opportunity_strategy:baseSchema(),commercial_proposal_narrative:baseSchema(),objection_preparation:baseSchema(),negotiation_brief:baseSchema(),lost_opportunity_analysis:baseSchema(),renewal_risk_analysis:baseSchema(),receivable_followup_brief:baseSchema()
}
function baseSchema(){return{type:'object',additionalProperties:false,required:['summary','recommendations','risks','nextActions'],properties:{summary:{type:'string'},recommendations:{type:'array',items:{type:'string'},maxItems:8},risks:{type:'array',items:{type:'string'},maxItems:8},nextActions:{type:'array',items:{type:'string'},maxItems:8}}}}
function sanitise(value:unknown):unknown{if(Array.isArray(value))return value.map(sanitise);if(!value||typeof value!=='object')return value;const output:Record<string,unknown>={};for(const [key,item] of Object.entries(value as Record<string,unknown>)){if(/email|phone|mobile|dateofbirth|birth|identity|secret|token|password/i.test(key))continue;output[key]=sanitise(item)}return output}
export async function runCommercialIntelligence(task:CommercialIntelligenceTask,context:unknown):Promise<CommercialIntelligenceResult>{
 const profile=await loadModelProfile('commercial_intelligence')
 const result=await openRouterFreeCompletion({
  taskProfile:'commercial_intelligence',
  messages:[{role:'system',content:'You are ANGELCARE Flashcards OS commercial intelligence operating in advisory-only mode. Analyse only the supplied internal context. Never calculate, invent or alter authoritative prices, taxes, discounts, margins, quantities, balances or document states. Never confirm, issue, send, cancel, allocate, record, or contact a customer. Human authority and explicit approval remain mandatory for every commercial action.'},{role:'user',content:JSON.stringify({task,context:sanitise(context)})}],
  temperature:profile.temperature,
  maxOutputTokens:profile.maxOutputTokens,
  timeoutMs:profile.timeoutMs,
  retryLimit:profile.retryLimit,
  jsonSchema:schemas[task],
  metadata:{commercial_task:task},
 })
 const parsed=extractJsonFromProviderText(result.rawContent) as any
 return{task,summary:String(parsed?.summary||''),recommendations:Array.isArray(parsed?.recommendations)?parsed.recommendations.map(String):[],risks:Array.isArray(parsed?.risks)?parsed.risks.map(String):[],nextActions:Array.isArray(parsed?.nextActions)?parsed.nextActions.map(String):[],modelRequested:result.requestedRoute,modelUsed:String(result.actualModel||'not-returned'),fallbackUsed:false,promptTokens:result.promptTokens,completionTokens:result.completionTokens,totalTokens:result.totalTokens,costUsd:result.providerReportedCostUsd,latencyMs:result.latencyMs,attemptCount:result.attemptCount,raw:{responseId:result.responseId,providerName:result.providerName,actualModel:result.actualModel}}
}

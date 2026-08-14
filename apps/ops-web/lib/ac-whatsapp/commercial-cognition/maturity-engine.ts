import type { CognitionDecision, CognitionMaturityLevel, CognitionState } from './types'

function levelFor(samples:number,successRate:number,overrideRate:number,riskRate:number):CognitionMaturityLevel{
  if(samples<5)return 'L0';if(samples<15)return 'L1';if(samples<35)return 'L2';if(samples<75||overrideRate>.25)return 'L3';if(samples<150||successRate<.45||riskRate>.08)return 'L4';if(samples<350||successRate<.58||overrideRate>.1||riskRate>.04)return 'L5';return 'L6'
}
async function applyDimension(supabase:any,type:string,key:string,delta:{sample?:number;success?:number;failure?:number;override?:number;risk?:number}){
  if(!key)return null
  const current=await supabase.from('ac_whatsapp_cc_maturity_dimensions').select('*').eq('dimension_type',type).eq('dimension_key',key).maybeSingle();if(current.error&&current.error.code!=='42P01')throw current.error
  const row=current.data||{};const samples=Number(row.samples||0)+(delta.sample||0);const successes=Number(row.successes||0)+(delta.success||0);const failures=Number(row.failures||0)+(delta.failure||0);const overrides=Number(row.overrides||0)+(delta.override||0);const riskEvents=Number(row.risk_events||0)+(delta.risk||0)
  const successRate=successes/Math.max(1,successes+failures);const overrideRate=overrides/Math.max(1,samples);const riskRate=riskEvents/Math.max(1,samples);const level=levelFor(samples,successRate,overrideRate,riskRate);const score=Math.max(0,Math.min(1,successRate*.55+(1-overrideRate)*.25+(1-riskRate)*.2));const previous=Number(row.score||0)
  const payload={dimension_type:type,dimension_key:key,maturity_level:level,samples,successes,failures,overrides,risk_events:riskEvents,score,velocity:score-previous,last_evidence_at:new Date().toISOString(),updated_at:new Date().toISOString()}
  const saved=await supabase.from('ac_whatsapp_cc_maturity_dimensions').upsert(payload,{onConflict:'dimension_type,dimension_key'}).select('*').single();if(saved.error&&saved.error.code!=='42P01')throw saved.error;return saved.data||null
}
function dimensions(state:CognitionState,decision:CognitionDecision):[string,string][]{return [['customer_type',state.customerType],['service_line',state.serviceLine],['journey_stage',state.signals.journeyStage],['intent',state.signals.explicitIntent],['action',decision.action.type],...decision.doctrineNodeIds.slice(0,8).map(id=>['doctrine',id] as [string,string])]}
export async function updateMaturityDimensions(supabase:any,input:{state:CognitionState;decision:CognitionDecision;humanOverride?:boolean;riskEvent?:boolean}){const results=[];for(const [type,key] of dimensions(input.state,input.decision)){const row=await applyDimension(supabase,type,key,{sample:1,override:input.humanOverride?1:0,risk:input.riskEvent?1:0});if(row)results.push(row)}return results}
export async function recordOutcomeMaturity(supabase:any,conversationId:string,outcome:string,humanOverride=false){
  const cognition=await supabase.from('ac_whatsapp_cc_relationship_cognition').select('*').eq('conversation_id',conversationId).maybeSingle();if(cognition.error&&cognition.error.code!=='42P01')throw cognition.error;if(!cognition.data)return []
  const stateRaw=cognition.data.cognition_state||{};const signals=stateRaw.signals||{};const currentAction=String(cognition.data.current_action||'unknown');const nodeIds=Array.isArray(cognition.data.memory?.selectedDoctrineNodes)?cognition.data.memory.selectedDoctrineNodes.map((x:any)=>String(x.id||'')).filter(Boolean):[]
  const success=['qualified','meeting','proposal','booking','converted','retained','renewed','upsold','referred','recovered'].includes(String(outcome))
  const dims:[string,string][]=[['customer_type',String(cognition.data.customer_type||'unknown')],['service_line',String(cognition.data.service_line||'general')],['journey_stage',String(signals.journeyStage||'unknown')],['intent',String(signals.explicitIntent||'unknown')],['action',currentAction],...nodeIds.slice(0,8).map((id:string)=>['doctrine',id] as [string,string])]
  const results=[];for(const [type,key] of dims){const row=await applyDimension(supabase,type,key,{success:success?1:0,failure:success?0:1,override:humanOverride?1:0});if(row)results.push(row)}return results
}

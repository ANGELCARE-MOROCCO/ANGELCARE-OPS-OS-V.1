import { GoogleGenAI, ThinkingLevel } from '@google/genai'
import { createServiceClient } from '@/lib/supabase/server'
import { acquireGovernedProvider, failGovernedProvider, reconcileGovernedProvider } from '@/lib/ai-provider-control/governor'
import { auditContentHeadquarters } from './repository'
import type { AiDirectorProfile, JsonRecord, MarketSignal } from './types'

const SIGNAL_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['signals'], properties: {
    signals: { type: 'array', minItems: 0, maxItems: 8, items: { type: 'object', additionalProperties: false,
      required: ['title','summary','sourceLabel','sourceUrl','confidence','urgency','opportunityScore','freshness','services','audiences','cities','interpretation','evidence'],
      properties: {
        title:{type:'string'},summary:{type:'string'},sourceLabel:{type:'string'},sourceUrl:{type:'string'},confidence:{type:'integer',minimum:0,maximum:100},urgency:{type:'integer',minimum:0,maximum:100},opportunityScore:{type:'integer',minimum:0,maximum:100},freshness:{type:'string'},services:{type:'array',items:{type:'string'}},audiences:{type:'array',items:{type:'string'}},cities:{type:'array',items:{type:'string'}},interpretation:{type:'string'},evidence:{type:'array',items:{type:'object'}}
      }
    }}
  }
} as const

function nextRun(policy: JsonRecord) {
  const frequency=String(policy.frequency||'weekly').toLowerCase(); const date=new Date()
  if(frequency==='hourly')date.setHours(date.getHours()+1)
  else if(frequency==='daily')date.setDate(date.getDate()+1)
  else if(frequency==='biweekly')date.setDate(date.getDate()+14)
  else if(frequency==='monthly')date.setMonth(date.getMonth()+1)
  else if(frequency==='quarterly')date.setMonth(date.getMonth()+3)
  else date.setDate(date.getDate()+7)
  return date.toISOString()
}
function parse(text:string){return JSON.parse(text.trim().replace(/^```json\s*/i,'').replace(/```$/i,'').trim()) as {signals?:Array<Record<string,unknown>>}}

export async function runMarketIntelligenceScan(input:{actorId:string;actorName:string;directorId?:string;reason?:string}) {
  const supabase=await createServiceClient() as any
  let query=supabase.from('market_content_ai_directors').select('*').eq('director_type','market_intelligence').in('status',['active','approved'])
  if(input.directorId)query=query.eq('id',input.directorId)
  const directorResult=await query.order('updated_at',{ascending:false}).limit(1).maybeSingle()
  if(directorResult.error)throw directorResult.error
  const director=(directorResult.data||null) as AiDirectorProfile|null
  if(!director)throw new Error('ACTIVE_MARKET_INTELLIGENCE_DIRECTOR_NOT_FOUND')
  const requestedModel=director.preferred_model||String(process.env.MARKETING_AI_PRIMARY_MODEL||process.env.GEMINI_PRIMARY_MODEL||'gemini-3.5-flash')
  const acquisition=await acquireGovernedProvider({moduleKey:director.provider_module_key||'marketing_ai',capability:'market_signal_scan',requestedModel,estimatedRequests:1,estimatedOutputTokens:6000,actorId:input.actorId,commandCode:'CONTENT-MARKET-SCAN'})
  const apiKey=acquisition.apiKey||process.env.GEMINI_API_KEY||''
  if(!apiKey)throw new Error('GEMINI_API_KEY_MISSING')
  const ai=new GoogleGenAI({apiKey}); const started=Date.now()
  try{
    const response=await ai.models.generateContent({model:acquisition.model||requestedModel,contents:JSON.stringify({mission:'Detect current, evidence-backed market signals that can materially change ANGELCARE content strategy. Focus on Morocco and approved ANGELCARE service contexts. Do not invent statistics, URLs, trends or competitors. Omit any signal without a traceable source. Return no signal when there is no meaningful change.',director:{name:director.name,mandate:director.mandate,services:director.services,audiences:director.audiences,cities:director.cities,languages:director.languages,allowedSources:director.allowed_sources,excludedSources:director.excluded_sources},reason:input.reason||'scheduled_scan',outputLanguage:'French'}),config:{tools:director.grounding_enabled?[{googleSearch:{}}]:undefined,responseMimeType:'application/json',responseJsonSchema:SIGNAL_SCHEMA,maxOutputTokens:6000,thinkingConfig:{thinkingLevel:ThinkingLevel.MEDIUM}}})
    if(!response.text)throw new Error('MARKET_SCAN_EMPTY_OUTPUT')
    const parsed=parse(response.text); const created:MarketSignal[]=[]
    for(const row of parsed.signals||[]){
      const title=String(row.title||'').trim(); const sourceUrl=String(row.sourceUrl||'').trim(); if(!title||!sourceUrl)continue
      const existing=await supabase.from('market_content_signals').select('id').eq('title',title).gte('detected_at',new Date(Date.now()-30*86400000).toISOString()).limit(1)
      if(existing.error)throw existing.error
      if(Array.isArray(existing.data)&&existing.data.length)continue
      const codeResult=await supabase.rpc('market_content_next_code',{p_prefix:'SIG'});if(codeResult.error)throw codeResult.error
      const insert=await supabase.from('market_content_signals').insert({code:String(codeResult.data),title,summary:String(row.summary||''),source_type:'ai_grounded_scan',source_label:String(row.sourceLabel||sourceUrl),source_url:sourceUrl,status:'enriching',confidence:Number(row.confidence||0),urgency:Number(row.urgency||0),opportunity_score:Number(row.opportunityScore||0),freshness:String(row.freshness||'current'),services:Array.isArray(row.services)?row.services.map(String):[],audiences:Array.isArray(row.audiences)?row.audiences.map(String):[],cities:Array.isArray(row.cities)?row.cities.map(String):[],evidence:Array.isArray(row.evidence)?row.evidence:[],ai_interpretation:String(row.interpretation||''),created_by:input.actorId||null}).select('*').single()
      if(insert.error)throw insert.error;created.push(insert.data as MarketSignal)
    }
    const usage=(response as any).usageMetadata||{}
    await supabase.from('market_content_ai_directors').update({last_run_at:new Date().toISOString(),next_run_at:nextRun(director.schedule_policy),updated_at:new Date().toISOString()}).eq('id',director.id)
    await reconcileGovernedProvider(acquisition,{requestCount:1,inputTokens:Number(usage.promptTokenCount||0),outputTokens:Number(usage.candidatesTokenCount||0),latencyMs:Date.now()-started,httpStatus:200,outcome:'completed',actorId:input.actorId,commandCode:'CONTENT-MARKET-SCAN',metadata:{directorId:director.id,signalsCreated:created.length}})
    await auditContentHeadquarters({actorId:input.actorId,actorName:input.actorName,action:'market_scan.completed',entityType:'ai_director',entityId:director.id,detail:{signalsCreated:created.length,reason:input.reason||null}})
    return {directorId:director.id,signals:created,nextRunAt:nextRun(director.schedule_policy)}
  }catch(error){await failGovernedProvider(acquisition,error,{latencyMs:Date.now()-started,actorId:input.actorId,commandCode:'CONTENT-MARKET-SCAN'});throw error}
}

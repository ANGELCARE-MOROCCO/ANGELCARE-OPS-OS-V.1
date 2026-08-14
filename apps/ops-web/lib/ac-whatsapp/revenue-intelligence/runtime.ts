import { openwa } from '@/lib/ac-whatsapp/openwa-client'
import { buildRevenueContext } from './scoring'
import { decideRevenueAction } from './doctrine-engine'
import { eligibilityForDecision, enforceDecisionSafety } from './policy'
import { ensureConversationRevenueState, loadDoctrinePacks } from './repository'
import { recordMaturityEvent } from './maturity'

const nowIso = () => new Date().toISOString()

function localHour(timeZone = 'Africa/Casablanca') {
  const parts = new Intl.DateTimeFormat('en-GB',{timeZone,hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date())
  return Number(parts.find(part=>part.type==='hour')?.value || '12') + Number(parts.find(part=>part.type==='minute')?.value || '0') / 60
}

function afterHours(settings:any){
  const start=String(settings?.after_hours_start||'19:00').split(':').map(Number)
  const end=String(settings?.after_hours_end||'08:00').split(':').map(Number)
  const h=localHour(String(settings?.timezone||'Africa/Casablanca'))
  const s=(start[0]||19)+(start[1]||0)/60
  const e=(end[0]||8)+(end[1]||0)/60
  return s>e ? h>=s || h<e : h>=s && h<e
}

async function globalSettings(supabase:any, accountId:string){
  const account=await supabase.from('ac_whatsapp_ri_engine_settings').select('*').eq('scope_type','account').eq('scope_id',accountId).eq('enabled',true).order('updated_at',{ascending:false}).limit(1).maybeSingle()
  if(account.error)throw account.error
  if(account.data)return account.data
  const global=await supabase.from('ac_whatsapp_ri_engine_settings').select('*').eq('scope_type','global').is('scope_id',null).eq('enabled',true).order('updated_at',{ascending:false}).limit(1).maybeSingle()
  if(global.error)throw global.error
  return global.data||{autonomy_mode:'manual',min_autonomy_confidence:.82,min_assist_confidence:.55,commercial_intensity_cap:5,overflow_threshold:25,enabled:false}
}

async function consentAllowsAutomation(supabase:any, contact:any){
  if(!contact)return false
  const stopped=await supabase.from('ac_whatsapp_stop_list').select('id').eq('whatsapp_id',contact.whatsapp_id).eq('active',true).limit(1).maybeSingle()
  if(stopped.error)throw stopped.error
  if(stopped.data)return false
  const consent=await supabase.from('ac_whatsapp_consent_records').select('status').eq('contact_id',contact.id).eq('channel','whatsapp').order('effective_at',{ascending:false}).limit(1).maybeSingle()
  if(consent.error && consent.error.code!=='42P01')throw consent.error
  if(consent.data?.status==='blocked'||consent.data?.status==='withdrawn')return false
  return true
}

async function currentQueuePressure(supabase:any, queueId?:string|null){
  let q=supabase.from('ac_whatsapp_conversations').select('id',{count:'exact',head:true}).gt('unread_count',0).not('status','in','("resolved","closed","archived")')
  if(queueId)q=q.eq('queue_id',queueId)
  const result=await q
  if(result.error)throw result.error
  return Number(result.count||0)
}

async function determineFleetAutonomy(supabase:any, settings:any, conversation:any){
  const mode=String(settings?.autonomy_mode||'manual')
  if(mode==='full'||mode==='controlled')return true
  if(mode==='no_shift')return afterHours(settings)
  if(mode==='overflow')return (await currentQueuePressure(supabase,conversation.queue_id))>=Number(settings?.overflow_threshold||25)
  if(mode==='campaign')return Boolean(conversation?.metadata?.campaign_id || conversation?.metadata?.lead_source==='campaign')
  return false
}

async function loadConversationBundle(supabase:any, conversationId:string){
  const conversation=await supabase.from('ac_whatsapp_conversations').select('*,contact:ac_whatsapp_contacts(*),account:ac_whatsapp_accounts(*)').eq('id',conversationId).maybeSingle()
  if(conversation.error)throw conversation.error
  if(!conversation.data)throw new Error('CONVERSATION_NOT_FOUND')
  const messages=await supabase.from('ac_whatsapp_messages').select('*').eq('conversation_id',conversationId).order('created_at',{ascending:true}).limit(80)
  if(messages.error)throw messages.error
  return {conversation:conversation.data,contact:conversation.data.contact,account:conversation.data.account,messages:messages.data||[]}
}

async function inferCampaignSource(supabase:any, contactId:string){
  const recent=await supabase.from('ac_whatsapp_campaign_recipients').select('campaign_id,campaign:ac_whatsapp_campaigns(name,objective,department,automation_doctrine_pack_id)').eq('contact_id',contactId).order('created_at',{ascending:false}).limit(1).maybeSingle()
  if(recent.error)return {source:'whatsapp',packId:null,campaign:null}
  return recent.data?{source:`campaign:${recent.data.campaign?.name||recent.data.campaign_id}`,packId:recent.data.campaign?.automation_doctrine_pack_id||null,campaign:recent.data.campaign}:{source:'whatsapp',packId:null,campaign:null}
}

function relationshipEntityKeys(contact:any, customerType?:string|null){
  const keys:Array<{entity_type:'contact'|'organization'|'household';entity_key:string}> = []
  const contactId=String(contact?.id||'').trim()
  if(contactId)keys.push({entity_type:'contact',entity_key:`contact:${contactId}`})
  const organization=String(contact?.organization_name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ')
  if(organization)keys.push({entity_type:'organization',entity_key:`organization:${organization}`})
  const householdSeed=String(contact?.whatsapp_id||contact?.phone_number_e164||contact?.phone||contactId||'').trim().toLowerCase()
  if(String(customerType||'').toLowerCase()==='b2c'&&householdSeed)keys.push({entity_type:'household',entity_key:`household:${householdSeed}`})
  return keys
}

async function loadRelationshipMemory(supabase:any,contact:any,customerType?:string|null){
  const keys=relationshipEntityKeys(contact,customerType)
  if(!keys.length)return []
  const result=await supabase.from('ac_whatsapp_ri_relationship_memory').select('*').in('entity_key',keys.map(row=>row.entity_key))
  if(result.error){
    if(result.error.code==='42P01')return []
    throw result.error
  }
  return result.data||[]
}

function enrichContextWithRelationshipMemory(context:any,rows:any[]){
  if(!rows.length)return context
  const historicalCommitments=rows.flatMap(row=>Array.isArray(row.commitments)?row.commitments:[]).slice(-12)
  const historicalObjections=rows.flatMap(row=>Array.isArray(row.objections)?row.objections:[]).slice(-12)
  const priorMemory=Object.assign({},...rows.map(row=>row.memory||{}))
  const strongestOpportunity=rows.map(row=>row.opportunity||{}).sort((a,b)=>Number(b?.commercialPotential||0)-Number(a?.commercialPotential||0))[0]||{}
  return {
    ...context,
    opportunity:{...strongestOpportunity,...context.opportunity},
    memory:{
      ...priorMemory,
      ...context.memory,
      historicalCommitments,
      historicalObjections,
      relationshipMemory:rows.map(row=>({
        entityType:row.entity_type,
        entityKey:row.entity_key,
        lastGoal:row.last_goal||null,
        lastJourneyStage:row.last_journey_stage||null,
        lastIntentFamily:row.last_intent_family||null,
        successCount:Number(row.success_count||0),
        failureCount:Number(row.failure_count||0),
        humanOverrideCount:Number(row.human_override_count||0),
        lastInteractionAt:row.last_interaction_at||null,
      })),
    },
  }
}

function uniqueJson(items:any[]){
  const seen=new Set<string>()
  return items.filter(item=>{
    const key=JSON.stringify(item)
    if(seen.has(key))return false
    seen.add(key)
    return true
  })
}

async function persistRelationshipMemory(supabase:any,input:{context:any;decision:any;existing:any[]}){
  const context=input.context
  const contact=context.contact
  const keys=relationshipEntityKeys(contact,context.customerType)
  if(!keys.length)return
  const byKey=new Map((input.existing||[]).map(row=>[String(row.entity_key),row]))
  const currentCommitments=Array.isArray(context.memory?.commitments)?context.memory.commitments:[]
  const currentObjections=Array.isArray(context.memory?.objections)?context.memory.objections:[]
  const rows=keys.map(key=>{
    const previous=byKey.get(key.entity_key)||{}
    const serviceLines=Array.from(new Set([...(Array.isArray(previous.service_lines)?previous.service_lines:[]),String(context.serviceLine||'general')].filter(Boolean)))
    return {
      entity_type:key.entity_type,
      entity_key:key.entity_key,
      contact_id:contact?.id||null,
      organization_name:contact?.organization_name||null,
      customer_type:context.customerType||null,
      service_lines:serviceLines,
      memory:{...(previous.memory||{}),...(context.memory||{}),relationshipMemory:undefined,historicalCommitments:undefined,historicalObjections:undefined,lastDecisionReasoning:input.decision?.reasoning||{},lastSource:context.source},
      opportunity:{...(previous.opportunity||{}),...(context.opportunity||{})},
      commitments:uniqueJson([...(Array.isArray(previous.commitments)?previous.commitments:[]),...currentCommitments]).slice(-24),
      objections:uniqueJson([...(Array.isArray(previous.objections)?previous.objections:[]),...currentObjections]).slice(-24),
      last_goal:input.decision?.goal||null,
      last_journey_stage:context.journeyStage||null,
      last_intent_family:context.intentFamily||null,
      success_count:Number(previous.success_count||0),
      failure_count:Number(previous.failure_count||0),
      human_override_count:Number(previous.human_override_count||0),
      last_interaction_at:nowIso(),
      updated_at:nowIso(),
    }
  })
  const result=await supabase.from('ac_whatsapp_ri_relationship_memory').upsert(rows,{onConflict:'entity_type,entity_key'})
  if(result.error&&result.error.code!=='42P01')throw result.error
}

async function incrementRelationshipSuccess(supabase:any,conversationId:string){
  const conversation=await supabase.from('ac_whatsapp_conversations').select('contact_id,contact:ac_whatsapp_contacts(*)').eq('id',conversationId).maybeSingle()
  if(conversation.error||!conversation.data?.contact)return
  const contact=conversation.data.contact
  const customerType=contact?.organization_name?'b2b':'b2c'
  const rows=await loadRelationshipMemory(supabase,contact,customerType).catch(()=>[])
  for(const row of rows){
    await supabase.from('ac_whatsapp_ri_relationship_memory').update({success_count:Number(row.success_count||0)+1,last_interaction_at:nowIso(),updated_at:nowIso()}).eq('id',row.id).then(()=>null,()=>null)
  }
}

async function storeState(supabase:any,input:{state:any;context:any;decision:any}){
  const patch={
    current_goal:input.decision.goal,
    journey_stage:input.context.journeyStage,
    intent_family:input.context.intentFamily,
    relationship_temperature:input.context.relationshipTemperature,
    momentum:input.context.momentum,
    emotional_signals:input.context.emotionalSignals,
    scores:input.context.scores,
    opportunity:input.context.opportunity,
    memory:{...(input.state?.memory||{}),...(input.context.memory||{}),lastSource:input.context.source},
    maturity_level:input.state?.maturity_level||'L1',
    updated_at:nowIso(),
  }
  const update=await supabase.from('ac_whatsapp_ri_conversation_state').update(patch).eq('conversation_id',input.context.conversation.id)
  if(update.error)throw update.error
}

async function recordDecision(supabase:any,input:{conversationId:string;inputMessageId?:string|null;context:any;decision:any;status:string}){
  const inserted=await supabase.from('ac_whatsapp_ri_decisions').insert({
    conversation_id:input.conversationId,
    input_message_id:input.inputMessageId||null,
    trigger_type:'inbound_message',
    state_before:{journeyStage:input.context.journeyStage,intentFamily:input.context.intentFamily,relationshipTemperature:input.context.relationshipTemperature,momentum:input.context.momentum,scores:input.context.scores},
    doctrine_node_ids:input.decision.doctrineNodeIds||[],
    doctrine_pack_id:input.decision.packId||null,
    chosen_action:input.decision.action,
    response_text:input.decision.responseText||null,
    confidence:input.decision.confidence,
    commercial_intensity:input.decision.commercialIntensity,
    reasoning:input.decision.reasoning||{},
    risk:input.decision.risk||{},
    eligibility:input.decision.eligibility,
    status:input.status,
  }).select('*').single()
  if(inserted.error)throw inserted.error
  return inserted.data
}

async function queueAndSendAutomation(supabase:any,input:{conversation:any;contact:any;account:any;text:string;decision:any;decisionId:string}){
  if(!input.account?.openwa_session_id)throw new Error('ACCOUNT_SESSION_NOT_CONFIGURED')
  const clientMessageId=crypto.randomUUID()
  const now=nowIso()
  const message=await supabase.from('ac_whatsapp_messages').insert({
    account_id:input.conversation.account_id,
    conversation_id:input.conversation.id,
    contact_id:input.conversation.contact_id,
    client_message_id:clientMessageId,
    direction:'outbound',
    message_type:'text',
    body:input.text,
    status:'queued',
    sender_user_id:null,
    sender_display_name_snapshot:'ANGELCARE Revenue Intelligence',
    sender_role_snapshot:'Autonomous Commercial Executive',
    sender_type:'automation',
    message_origin:'sovereign_revenue_intelligence',
    automation_name_snapshot:'Sovereign Revenue Intelligence',
    recipient_whatsapp_id:input.conversation.remote_chat_id,
    created_at:now,
    raw_payload:{decision_id:input.decisionId,confidence:input.decision.confidence,goal:input.decision.goal,doctrine_nodes:input.decision.doctrineNodeIds},
  }).select('*').single()
  if(message.error)throw message.error
  const outbox=await supabase.from('ac_whatsapp_outbox').insert({
    client_message_id:clientMessageId,
    account_id:input.conversation.account_id,
    conversation_id:input.conversation.id,
    contact_id:input.conversation.contact_id,
    message_type:'text',chat_id:input.conversation.remote_chat_id,body:input.text,status:'processing',locked_by:'revenue-intelligence',locked_at:now,attempt_count:1,created_by:null,
  }).select('*').single()
  if(outbox.error)throw outbox.error
  try{
    const sent:any=await openwa.sendText(input.account.openwa_session_id,input.conversation.remote_chat_id,input.text)
    const external=String(sent?.id?._serialized||sent?.id||sent?.messageId||sent?.message_id||'')||null
    const sentAt=nowIso()
    await Promise.all([
      supabase.from('ac_whatsapp_messages').update({status:'sent',external_message_id:external,sent_at:sentAt}).eq('id',message.data.id),
      supabase.from('ac_whatsapp_outbox').update({status:'sent',external_message_id:external,locked_at:null,locked_by:null}).eq('id',outbox.data.id),
      supabase.from('ac_whatsapp_conversations').update({status:'waiting_customer',unread_count:0,message_count:Number(input.conversation.message_count||0)+1,last_message_preview:input.text.slice(0,240),last_message_direction:'outbound',last_message_at:sentAt,last_message_sender_display_name_snapshot:'ANGELCARE Revenue Intelligence',last_message_sender_type:'automation',automation_last_decision_at:sentAt}).eq('id',input.conversation.id),
      supabase.from('ac_whatsapp_ri_decisions').update({status:'executed',output_message_id:message.data.id,executed_at:sentAt}).eq('id',input.decisionId),
      supabase.from('ac_whatsapp_ri_conversation_state').update({last_decision_id:input.decisionId,last_automation_at:sentAt}).eq('conversation_id',input.conversation.id),
    ])
    return {messageId:message.data.id,status:'sent'}
  }catch(cause){
    const error=cause instanceof Error?cause.message:String(cause)
    await Promise.all([
      supabase.from('ac_whatsapp_messages').update({status:'queued',error_message:error}).eq('id',message.data.id),
      supabase.from('ac_whatsapp_outbox').update({status:'queued',last_error:error,locked_at:null,locked_by:null,available_at:new Date(Date.now()+15000).toISOString()}).eq('id',outbox.data.id),
      supabase.from('ac_whatsapp_ri_decisions').update({status:'queued',output_message_id:message.data.id,execution_error:error}).eq('id',input.decisionId),
    ])
    return {messageId:message.data.id,status:'queued',error}
  }
}

export async function evaluateRevenueConversation(supabase:any,input:{conversationId:string;inputMessageId?:string|null;forceMode?:string|null;dryRun?:boolean}){
  const bundle=await loadConversationBundle(supabase,input.conversationId)
  const source=await inferCampaignSource(supabase,bundle.contact.id)
  const settings=await globalSettings(supabase,bundle.account.id)
  const state=await ensureConversationRevenueState(supabase,{conversationId:input.conversationId,mode:bundle.conversation.automation_mode||'manual',packId:bundle.conversation.automation_doctrine_pack_id||source.packId})
  const packId=state.doctrine_pack_id||bundle.conversation.automation_doctrine_pack_id||source.packId||null
  const packs=await loadDoctrinePacks(supabase,packId)
  const baseContext=buildRevenueContext({...bundle,source:source.source})
  const relationshipMemory=await loadRelationshipMemory(supabase,bundle.contact,baseContext.customerType)
  const context=enrichContextWithRelationshipMemory(baseContext,relationshipMemory)
  let decision=decideRevenueAction({packs,context,commercialIntensityCap:Number(settings?.commercial_intensity_cap||5)})
  const consent=await consentAllowsAutomation(supabase,bundle.contact)
  const fleetEnabled=await determineFleetAutonomy(supabase,settings,bundle.conversation)
  const effectiveGlobal=fleetEnabled?String(settings?.autonomy_mode||'manual'):'manual'
  const mode=String(input.forceMode||state.mode||bundle.conversation.automation_mode||'manual')
  const eligible=eligibilityForDecision({confidence:decision.confidence,mode,globalMode:effectiveGlobal,threshold:Number(settings?.min_autonomy_confidence||.82),paused:Boolean(bundle.conversation.automation_paused),excluded:Boolean(bundle.conversation.automation_excluded||state.excluded)||!consent,risk:decision.risk as any,accountReady:bundle.account?.status==='connected'&&bundle.account?.outbound_enabled!==false})
  decision={...decision,eligibility:eligible.eligibility,reasoning:{...decision.reasoning,autonomyReason:eligible.reason,mode,globalMode:effectiveGlobal,consent}}
  decision=enforceDecisionSafety(decision,context)
  await storeState(supabase,{state,context,decision})
  await persistRelationshipMemory(supabase,{context,decision,existing:relationshipMemory})
  const decisionRow=await recordDecision(supabase,{conversationId:input.conversationId,inputMessageId:input.inputMessageId,context,decision,status:input.dryRun?'simulated':'planned'})
  if(input.dryRun)return {context,decision,decisionRow,executed:false}
  if(decision.eligibility!=='green'||!decision.responseText||['handoff','wait','protect'].includes(decision.action)){
    await supabase.from('ac_whatsapp_ri_decisions').update({status:decision.action==='handoff'?'handoff':'suggested'}).eq('id',decisionRow.id)
    return {context,decision,decisionRow,executed:false}
  }
  const delivery=await queueAndSendAutomation(supabase,{conversation:bundle.conversation,contact:bundle.contact,account:bundle.account,text:decision.responseText,decision,decisionId:decisionRow.id})
  for(const nodeId of decision.doctrineNodeIds||[])await recordMaturityEvent(supabase,{dimensionType:'doctrine_node',dimensionKey:nodeId,event:'sample',metadata:{decisionId:decisionRow.id,deliveryStatus:delivery.status}}).catch(()=>null)
  await supabase.from('ac_whatsapp_ri_runtime_events').insert({event_type:'automation.reply',severity:delivery.status==='sent'?'info':'warning',conversation_id:input.conversationId,doctrine_pack_id:decision.packId||null,decision_id:decisionRow.id,details:{delivery,goal:decision.goal,confidence:decision.confidence,eligibility:decision.eligibility}})
  return {context,decision,decisionRow,executed:true,delivery}
}

export async function recordInboundOutcomeForMaturity(supabase:any,conversationId:string){
  const prior=await supabase.from('ac_whatsapp_ri_decisions').select('*').eq('conversation_id',conversationId).eq('status','executed').order('executed_at',{ascending:false}).limit(1).maybeSingle()
  if(prior.error||!prior.data)return
  const executedAt=prior.data.executed_at?new Date(prior.data.executed_at).getTime():0
  if(!executedAt||Date.now()-executedAt>7*24*60*60*1000)return
  for(const nodeId of prior.data.doctrine_node_ids||[])await recordMaturityEvent(supabase,{dimensionType:'doctrine_node',dimensionKey:String(nodeId),event:'success',metadata:{reason:'customer_replied_after_automation',decisionId:prior.data.id}}).catch(()=>null)
  await incrementRelationshipSuccess(supabase,conversationId).catch(()=>null)
}

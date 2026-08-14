import { loadDoctrinePacks } from '@/lib/ac-whatsapp/revenue-intelligence/repository'
import { buildCommercialSignals } from './signal-engine'
import { planGoalStack } from './goal-planner'
import { inferStakeholders } from './stakeholder-engine'
import { extractCommitments } from './commitment-engine'
import { analyzeObjections } from './objection-engine'
import { analyzeNegotiation } from './negotiation-engine'
import { inferHouseholdContext } from './household-engine'
import { lifecycleObjective, lifecyclePosition } from './lifecycle-engine'
import { buildMultiTurnPlan } from './planning-engine'
import { buildOpportunityVector } from './opportunity-engine'
import { loadKnowledge, loadOffers } from './knowledge-store'
import { rankOffers } from './offer-engine'
import { fuseDoctrines } from './doctrine-fusion'
import { generateActions } from './action-engine'
import { judgeConfidence } from './confidence-judge'
import { composeResponse } from './response-composer'
import { validateCommercialTruth } from './truth-engine'
import { chooseFollowup } from './followup-engine'
import { loadCognitionPersistence, mergeMemory, persistCognitionState, persistCommitments, persistStakeholders } from './memory-store'
import { cognitionIdempotencyKey, claimIdempotency, finishIdempotency, auditCognition } from './reliability'
import { executeCognitionDecision } from './executor'
import { scheduleCognitionEvent } from './event-engine'
import { recordLearningEvidence } from './learning-engine'
import { updateMaturityDimensions } from './maturity-engine'
import type { CognitionDecision, CognitionEvent, CognitionState, CommercialIntensity } from './types'

async function conversationBundle(supabase:any,id:string){
  const conversation=await supabase.from('ac_whatsapp_conversations').select('*,contact:ac_whatsapp_contacts(*),account:ac_whatsapp_accounts(*)').eq('id',id).maybeSingle()
  if(conversation.error)throw conversation.error
  if(!conversation.data)throw new Error('CONVERSATION_NOT_FOUND')
  const messages=await supabase.from('ac_whatsapp_messages').select('*').eq('conversation_id',id).order('created_at',{ascending:true}).limit(220)
  if(messages.error)throw messages.error
  return {conversation:conversation.data,contact:conversation.data.contact,account:conversation.data.account,messages:messages.data||[]}
}

async function settings(supabase:any,accountId:string){
  const account=await supabase.from('ac_whatsapp_ri_engine_settings').select('*').eq('scope_type','account').eq('scope_id',accountId).eq('enabled',true).order('updated_at',{ascending:false}).limit(1).maybeSingle()
  if(account.error)throw account.error
  if(account.data)return account.data
  const global=await supabase.from('ac_whatsapp_ri_engine_settings').select('*').eq('scope_type','global').is('scope_id',null).eq('enabled',true).order('updated_at',{ascending:false}).limit(1).maybeSingle()
  if(global.error)throw global.error
  return global.data||{autonomy_mode:'manual',min_autonomy_confidence:.82,commercial_intensity_cap:5,enabled:false}
}

async function consent(supabase:any,contact:any){
  if(!contact)return false
  const stopped=await supabase.from('ac_whatsapp_stop_list').select('id').eq('whatsapp_id',contact.whatsapp_id).eq('active',true).limit(1).maybeSingle()
  if(stopped.error)throw stopped.error
  if(stopped.data)return false
  const c=await supabase.from('ac_whatsapp_consent_records').select('status').eq('contact_id',contact.id).eq('channel','whatsapp').order('effective_at',{ascending:false}).limit(1).maybeSingle()
  if(c.error&&c.error.code!=='42P01')throw c.error
  return !['blocked','withdrawn'].includes(String(c.data?.status||''))
}

function sourceOf(bundle:any){return String(bundle.conversation?.metadata?.lead_source||bundle.contact?.metadata?.lead_source||'whatsapp')}

function memoryFrom(bundle:any,previous:any){
  const inbound=[...bundle.messages].reverse().find((row:any)=>row.direction==='inbound')
  const recentOut=bundle.messages.filter((row:any)=>row.direction==='outbound').slice(-8).map((row:any)=>String(row.body||row.caption||''))
  return mergeMemory(previous?.memory||{}, {
    knownName:bundle.contact?.display_name||null,
    organization:bundle.contact?.organization_name||null,
    city:bundle.contact?.city||null,
    latestInbound:String(inbound?.body||inbound?.caption||bundle.conversation?.last_message_preview||''),
    lastInboundAt:inbound?.created_at||inbound?.received_at||null,
    recentOutboundTexts:recentOut,
    messageCount:Number(bundle.conversation?.message_count||bundle.messages.length),
    lastGoal:previous?.current_goal||null,
  })
}

function intensity(state:CognitionState,cap:number):CommercialIntensity{
  const s=state.signals
  let x=s.satisfactionRisk>.55?0:s.buyingReadiness==='decision_ready'?5:s.buyingReadiness==='high_intent'?4:s.buyingReadiness==='evaluating'?4:s.buyingReadiness==='exploring'?3:2
  if(s.emotional.reassuranceNeed>.65)x=Math.min(x,2)
  if(s.emotional.frustration>.55)x=0
  if(s.emotional.fatigue>.6)x=Math.min(x,1)
  return Math.max(0,Math.min(6,Math.min(cap,Math.round(x)))) as CommercialIntensity
}

export async function processCommercialCognitionEvent(supabase:any,event:CognitionEvent){
  const key=cognitionIdempotencyKey({conversationId:event.conversationId,eventType:event.type,inputMessageId:event.inputMessageId,eventId:event.eventId})
  const claim=await claimIdempotency(supabase,key,event.conversationId,event.type)
  if(!claim.claimed)return {duplicate:true,idempotencyKey:key,previous:claim.row}

  try{
    const bundle=await conversationBundle(supabase,event.conversationId)
    const cfg=await settings(supabase,bundle.account.id)
    const persisted=await loadCognitionPersistence(supabase,event.conversationId,bundle.contact)
    const memory=memoryFrom(bundle,persisted.state)
    const signals=buildCommercialSignals({...bundle,source:sourceOf(bundle)})
    const knowledge=await loadKnowledge(supabase,{customerType:signals.customerType,serviceLine:signals.serviceLine,intent:signals.explicitIntent})
    const offersRaw=await loadOffers(supabase)
    const offers=rankOffers(signals,offersRaw)
    const commitments=extractCommitments(bundle.messages,persisted.commitments)
    const stakeholders=inferStakeholders({contact:bundle.contact,messages:bundle.messages,signals,existing:persisted.stakeholders})
    const goals=planGoalStack(signals,memory)
    const objections=analyzeObjections(String(memory.latestInbound||''),signals)

    const state:CognitionState={
      conversationId:event.conversationId,contactId:bundle.contact?.id||null,accountId:bundle.account?.id||null,
      customerType:signals.customerType,serviceLine:signals.serviceLine,source:sourceOf(bundle),signals,goals,stakeholders,offers,objections,commitments,
      memory,maturity:{global:String(bundle.conversation?.automation_maturity_level||'L1')},doctrineNodeIds:[],doctrinePackIds:[],
      lastAction:persisted.state?.current_action||null,lastDecisionAt:persisted.state?.last_decision_at||null,
    }

    const negotiation=analyzeNegotiation(String(memory.latestInbound||''),signals)
    const household=inferHouseholdContext({messages:bundle.messages,signals})
    const lifecycle=lifecyclePosition(signals)
    const lifecycleGoal=lifecycleObjective(signals)
    const opportunity=buildOpportunityVector(state)
    const goal=goals[0]
    const plan=buildMultiTurnPlan(state,goal)

    const packs=await loadDoctrinePacks(supabase,bundle.conversation?.automation_doctrine_pack_id||null)
    const doctrine=fuseDoctrines(packs,state)
    state.doctrineNodeIds=doctrine.nodeIds
    state.doctrinePackIds=doctrine.packIds
    state.memory={...state.memory,selectedDoctrineNodes:doctrine.selected,doctrineConflicts:doctrine.conflicts,knowledgeEntities:knowledge.entities,negotiation,household,lifecycle,lifecycleGoal,opportunity,plan}

    const actions=generateActions(state,goal)
    const selected=actions[0]
    const accountReady=bundle.account?.status==='connected'&&bundle.account?.outbound_enabled!==false
    const allowed=await consent(supabase,bundle.contact)
    const conversationMode=String(bundle.conversation?.automation_mode||'manual')
    const paused=Boolean(bundle.conversation?.automation_paused)
    const excluded=Boolean(bundle.conversation?.automation_excluded)||!allowed
    const judgement=judgeConfidence({state,doctrineCoverage:doctrine.coverage,knowledgeCoverage:knowledge.coverage,actionScore:selected.score,accountReady,autonomyMode:String(cfg.autonomy_mode||'manual'),conversationMode,paused,excluded})
    const commercialIntensity=intensity(state,Number(cfg.commercial_intensity_cap||5))

    let action=selected
    let escalationReason:string|null=null
    if(judgement.eligibility==='red'){
      action={type:'handover',score:100,rationale:[...selected.rationale,...judgement.risk.reasons],requiresMessage:false}
      escalationReason=judgement.risk.reasons.join('|')||'AUTONOMOUS_JUDGE_ESCALATION'
    }else if(judgement.eligibility==='amber'&&selected.type!=='clarify'){
      action={type:'clarify',score:96,rationale:[...selected.rationale,'confidence_requires_clarification'],requiresMessage:true}
    }

    const followup=chooseFollowup(state)
    let responseText=action.requiresMessage?composeResponse({state,action:action.type,goal,commercialIntensity}):null
    const truth=validateCommercialTruth({responseText,knowledgeEntities:knowledge.entities,offer:offers[0]||null})
    let finalEligibility=judgement.eligibility
    if(!truth.ok){
      finalEligibility='red'
      action={type:'handover',score:100,rationale:[...action.rationale,...truth.violations],requiresMessage:false}
      responseText=null
      escalationReason=truth.violations.join('|')
    }

    const decision:CognitionDecision={
      idempotencyKey:key,action,responseText,goal,confidence:judgement.confidence,risk:judgement.risk,eligibility:finalEligibility,
      commercialIntensity,escalationReason,nextFollowupAt:followup.at,doctrineNodeIds:doctrine.nodeIds,doctrinePackIds:doctrine.packIds,
      knowledgeEntityIds:knowledge.entities.map((row:any)=>String(row.id)),
      reasoning:{source:state.source,signals,hiddenIntents:signals.hiddenIntents,goals,plan,stakeholders,household,lifecycle,lifecycleGoal,opportunity,offers,objections,negotiation,truth,
        doctrine:{coverage:doctrine.coverage,conflicts:doctrine.conflicts},knowledgeCoverage:knowledge.coverage,candidateActions:actions.slice(0,8),selectedAction:action,
        followup,conversationMode,fleetMode:cfg.autonomy_mode,consent:allowed}
    }

    await Promise.all([
      persistCognitionState(supabase,state,decision),
      persistStakeholders(supabase,bundle.contact?.organization_name,stakeholders),
      persistCommitments(supabase,event.conversationId,commitments),
    ])

    if(decision.eligibility==='red'){
      await supabase.from('ac_whatsapp_conversations').update({cognition_escalation_flag:true,cognition_escalation_reason:escalationReason,automation_paused:true}).eq('id',event.conversationId)
    }

    let delivery:any={executed:false,status:'dry_run'}
    if(!event.dryRun&&!event.shadow)delivery=await executeCognitionDecision(supabase,{...bundle,state,decision})
    if(event.shadow){
      await supabase.from('ac_whatsapp_cc_shadow_runs').insert({conversation_id:event.conversationId,idempotency_key:key,proposed_action:decision.action.type,proposed_response:decision.responseText,goal:goal.objective,confidence:decision.confidence.aggregate,risk:decision.risk,reasoning:decision.reasoning,status:'pending_comparison'})
    }
    if(decision.nextFollowupAt&&decision.action.type!=='silence'&&decision.eligibility!=='red'){
      await scheduleCognitionEvent(supabase,{conversationId:event.conversationId,eventType:'scheduled_followup',runAt:decision.nextFollowupAt,payload:{strategy:followup.strategy,origin:key},dedupeKey:`followup:${event.conversationId}:${decision.nextFollowupAt.slice(0,13)}`})
    }

    await Promise.all([
      recordLearningEvidence(supabase,{state,decision,eventType:event.type,metadata:{delivery,shadow:Boolean(event.shadow)}}).catch(()=>null),
      updateMaturityDimensions(supabase,{state,decision,riskEvent:decision.eligibility==='red'}).catch(()=>null),
      auditCognition(supabase,{conversationId:event.conversationId,eventType:event.type,actionType:decision.action.type,goal:goal.objective,eligibility:decision.eligibility,doctrineNodeIds:decision.doctrineNodeIds,knowledgeEntityIds:decision.knowledgeEntityIds,confidence:decision.confidence,risk:decision.risk,reasoning:decision.reasoning,result:delivery}),
    ])

    const result={duplicate:false,state,decision,delivery}
    await finishIdempotency(supabase,key,'done',{eligibility:decision.eligibility,action:decision.action.type,delivery})
    return result
  }catch(cause){
    const error=cause instanceof Error?cause.message:String(cause)
    await finishIdempotency(supabase,key,'failed',{error}).catch(()=>null)
    throw cause
  }
}

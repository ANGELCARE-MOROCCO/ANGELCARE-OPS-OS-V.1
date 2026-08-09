import { assertTerritory, filterByOwnership } from '../b2b-intelligence/scope'
import { cleanText, normalizeEmail } from '../b2b-intelligence/normalize'
import { computeNextBestAction } from './next-best-action'
import { buildOutreachStrategy } from './outreach-strategy'
import { B2B_EXECUTION_COMMAND_MAP } from './contract'
import { B2B_EXECUTION_STAGES, STAGE_ORDER, coreProspectStatus, validateStageChange } from './stage-rules'
import type { B2BExecutionStage, StageFacts } from './types'

function now(){return new Date().toISOString()}
function error(message:string,status=400,details?:unknown){return Object.assign(new Error(message),{status,details})}
function dbError(prefix:string,e:any){console.error(`[${prefix}]`,e);throw error(prefix,500,{message:e?.message,code:e?.code})}
function scopeRecord(access:any){return Object.fromEntries((access.scopes||[]).map((row:any)=>[row.scope_key,row.scope_value])) as Record<string,unknown>}
function string(value:unknown,max=4000){return cleanText(value,max)||null}
function number(value:unknown,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback}
function datePlus(hours:number){return new Date(Date.now()+hours*3600000).toISOString()}
function stageDefinition(stage:string){return B2B_EXECUTION_STAGES.find((row)=>row.key===stage)}

async function loadProspect(db:any,actor:any,access:any,prospectId:string){
  const {data,error:e}=await db.from('b2b_prospects').select('*').eq('id',prospectId).maybeSingle()
  if(e)dbError('B2B_EXECUTION_PROSPECT_LOAD_FAILED',e)
  if(!data)throw error('PROSPECT_NOT_FOUND',404)
  assertTerritory(scopeRecord(access),data.city)
  const visible=filterByOwnership([data],actor.id,scopeRecord(access))
  if(!visible.length)throw error('ACCOUNT_SCOPE_DENIED',403)
  return data
}

async function loadOpportunity(db:any,actor:any,access:any,payload:any){
  let query=db.from('browser_extension_b2b_opportunities').select('*')
  if(payload.opportunityId)query=query.eq('id',payload.opportunityId)
  else if(payload.prospectId)query=query.eq('prospect_id',payload.prospectId).eq('status','active').order('updated_at',{ascending:false}).limit(1)
  else throw error('OPPORTUNITY_OR_PROSPECT_REQUIRED')
  const {data,error:e}=payload.opportunityId?await query.maybeSingle():await query.maybeSingle()
  if(e)dbError('B2B_EXECUTION_OPPORTUNITY_LOAD_FAILED',e)
  if(!data)throw error('OPPORTUNITY_NOT_FOUND',404)
  const prospect=await loadProspect(db,actor,access,data.prospect_id)
  return {opportunity:data,prospect}
}

async function safeInsert(db:any,table:string,row:any){
  const {data,error:e}=await db.from(table).insert(row).select('*').single()
  if(e){console.error(`[${table}_INSERT_FAILED]`,e);return null}
  return data
}

async function timeline(db:any,actor:any,input:any){
  const row={prospect_id:input.prospectId||null,opportunity_id:input.opportunityId||null,contact_id:input.contactId||null,user_id:actor.id,event_type:input.eventType,title:input.title,description:input.description||null,outcome:input.outcome||null,source_adapter:input.sourceAdapter||null,source_url:input.sourceUrl||null,evidence:input.evidence||{},metadata:input.metadata||{},occurred_at:input.occurredAt||now()}
  const {data,error:e}=await db.from('browser_extension_b2b_timeline_events').insert(row).select('*').single()
  if(e)dbError('B2B_TIMELINE_EVENT_FAILED',e)
  await safeInsert(db,'b2b_activities',{prospect_id:row.prospect_id,actor_id:actor.id,activity_type:row.event_type,title:row.title,description:row.description,metadata:{source:'browser_os',opportunity_id:row.opportunity_id,contact_id:row.contact_id,source_adapter:row.source_adapter,source_url:row.source_url,evidence:row.evidence,outcome:row.outcome}})
  return data
}

async function createCoreTask(db:any,actor:any,input:any){
  return safeInsert(db,'b2b_tasks',{title:input.title,task_type:input.taskType||'Follow-up',prospect_id:input.prospectId||null,assigned_to:input.assignedTo||actor.id,priority:input.priority||'High',status:input.status||'To Do',due_date:input.dueAt||null,description:input.description||null,created_by:actor.id,completed_at:input.status==='Done'?now():null})
}

async function contactCounts(db:any,prospectId:string){
  const [contacts,committee]=await Promise.all([
    db.from('b2b_contacts').select('id',{count:'exact',head:true}).eq('prospect_id',prospectId),
    db.from('browser_extension_b2b_buying_committee').select('id',{count:'exact',head:true}).eq('prospect_id',prospectId).eq('status','identified'),
  ])
  return {contactCount:contacts.count||0,decisionMakerCount:committee.count||0}
}

async function opportunityFacts(db:any,prospectId:string,opportunity:any,payload:any={}):Promise<StageFacts>{
  const [contacts,committee,meetings,outcomes,proposals]=await Promise.all([
    db.from('b2b_contacts').select('id',{count:'exact',head:true}).eq('prospect_id',prospectId),
    db.from('browser_extension_b2b_buying_committee').select('id',{count:'exact',head:true}).eq('prospect_id',prospectId).eq('status','identified'),
    db.from('b2b_meetings').select('id',{count:'exact',head:true}).eq('prospect_id',prospectId),
    db.from('browser_extension_b2b_meeting_outcomes').select('id',{count:'exact',head:true}).eq('prospect_id',prospectId),
    db.from('b2b_proposals').select('id',{count:'exact',head:true}).eq('prospect_id',prospectId),
  ])
  const evidence=payload.evidence||{}
  return {hasContact:Boolean(contacts.count),hasDecisionMaker:Boolean(committee.count),hasNeed:Boolean(evidence.hasNeed||opportunity.need_confirmed),hasMeeting:Boolean(meetings.count),hasMeetingOutcome:Boolean(outcomes.count),hasScope:Boolean(evidence.hasScope||opportunity.scope_summary),hasProposal:Boolean(proposals.count||evidence.hasProposal),hasCommercialAgreement:Boolean(evidence.hasCommercialAgreement||opportunity.commercial_agreement_at),hasContract:Boolean(evidence.hasContract||opportunity.contract_status==='accepted'||opportunity.contract_status==='signed'),hasPayment:Boolean(evidence.hasPayment||opportunity.payment_status==='verified'),activationReady:Boolean(evidence.activationReady||opportunity.activation_readiness==='ready'),reason:string(payload.reason,2000)}
}

async function persistNextAction(db:any,actor:any,prospect:any,opportunity:any,action:any){
  await db.from('browser_extension_b2b_next_best_actions').update({status:'superseded',updated_at:now()}).eq('opportunity_id',opportunity.id).eq('status','open')
  const {data,error:e}=await db.from('browser_extension_b2b_next_best_actions').insert({prospect_id:prospect.id,opportunity_id:opportunity.id,user_id:actor.id,action_type:action.actionType,title:action.title,objective:action.objective,reasoning:action.reasoning||[],priority:action.priority||'high',due_at:action.dueAt,status:'open',source_version:'mega3-nba-v1'}).select('*').single()
  if(e)dbError('B2B_NEXT_ACTION_FAILED',e)
  await db.from('browser_extension_b2b_opportunities').update({next_action:action.title,next_action_due_at:action.dueAt,updated_at:now()}).eq('id',opportunity.id)
  await db.from('b2b_prospects').update({next_action:action.title,next_follow_up_at:action.dueAt,updated_by:actor.id}).eq('id',prospect.id)
  return data
}

async function refreshNextAction(db:any,actor:any,prospect:any,opportunity:any){
  const counts=await contactCounts(db,prospect.id)
  const {count:openFollowups}=await db.from('browser_extension_b2b_followups').select('id',{count:'exact',head:true}).eq('opportunity_id',opportunity.id).eq('status','open')
  const {count:overdue}=await db.from('browser_extension_b2b_followups').select('id',{count:'exact',head:true}).eq('opportunity_id',opportunity.id).eq('status','open').lt('due_at',now())
  const {count:meetings}=await db.from('b2b_meetings').select('id',{count:'exact',head:true}).eq('prospect_id',prospect.id)
  const {count:outcomes}=await db.from('browser_extension_b2b_meeting_outcomes').select('id',{count:'exact',head:true}).eq('prospect_id',prospect.id)
  const action=computeNextBestAction({stage:opportunity.stage,prospect,opportunity,...counts,openFollowups:openFollowups||0,overdueFollowups:overdue||0,hasMeeting:Boolean(meetings),hasMeetingOutcome:Boolean(outcomes),lastActivityAt:opportunity.last_activity_at})
  return persistNextAction(db,actor,prospect,opportunity,action)
}

async function createOpportunity(db:any,actor:any,device:any,access:any,payload:any){
  if(!payload.prospectId)throw error('PROSPECT_ID_REQUIRED')
  const prospect=await loadProspect(db,actor,access,payload.prospectId)
  const {data:existing}=await db.from('browser_extension_b2b_opportunities').select('*').eq('prospect_id',prospect.id).eq('status','active').maybeSingle()
  if(existing&&!payload.allowParallel)return {opportunity:existing,prospect,reused:true,nextBestAction:await refreshNextAction(db,actor,prospect,existing)}
  const stage=(payload.stage||'qualified') as B2BExecutionStage
  const def=stageDefinition(stage);if(!def)throw error('INVALID_PIPELINE_STAGE')
  const row={prospect_id:prospect.id,title:string(payload.title,240)||`${prospect.name} — Partnership opportunity`,opportunity_type:string(payload.opportunityType,120)||'strategic_partnership',stage,stage_order:def.order,status:'active',program_key:string(payload.programKey,120),estimated_monthly_value:number(payload.estimatedMonthlyValue,number(prospect.estimated_monthly_value)),estimated_annual_value:number(payload.estimatedAnnualValue,number(prospect.estimated_annual_value)),probability:number(payload.probability,stage==='qualified'?25:10),expected_close_at:payload.expectedCloseAt||null,launch_at:payload.launchAt||null,decision_process:string(payload.decisionProcess,4000),scope_summary:string(payload.scopeSummary,4000),source_context_id:payload.contextId||null,source_adapter:payload.sourceAdapter||null,source_url:payload.sourceUrl||null,owner_id:payload.ownerId||actor.id,next_action:null,next_action_due_at:null,risk_level:'medium',created_by:actor.id,updated_by:actor.id}
  const {data,error:e}=await db.from('browser_extension_b2b_opportunities').insert(row).select('*').single();if(e)dbError('B2B_OPPORTUNITY_CREATE_FAILED',e)
  await db.from('browser_extension_b2b_opportunity_stage_history').insert({opportunity_id:data.id,prospect_id:prospect.id,from_stage:null,to_stage:stage,reason:'Opportunity created from Browser OS',evidence:payload.evidence||{},changed_by:actor.id})
  await db.from('b2b_prospects').update({status:coreProspectStatus(stage),estimated_monthly_value:row.estimated_monthly_value,estimated_annual_value:row.estimated_annual_value,assigned_owner_id:row.owner_id,updated_by:actor.id}).eq('id',prospect.id)
  await timeline(db,actor,{prospectId:prospect.id,opportunityId:data.id,eventType:'opportunity_created',title:'Commercial opportunity created',description:row.title,sourceAdapter:payload.sourceAdapter,sourceUrl:payload.sourceUrl,metadata:{deviceId:device.id,stage}})
  const nextBestAction=await refreshNextAction(db,actor,prospect,data)
  return {opportunity:{...data,next_action:nextBestAction.title,next_action_due_at:nextBestAction.due_at},prospect,nextBestAction}
}

async function updateOpportunity(db:any,actor:any,_device:any,access:any,payload:any){
  const {opportunity,prospect}=await loadOpportunity(db,actor,access,payload)
  const allowed=['title','opportunity_type','program_key','estimated_monthly_value','estimated_annual_value','probability','expected_close_at','launch_at','decision_process','scope_summary','risk_level','contract_status','payment_status','activation_readiness']
  const patch:any={updated_by:actor.id,updated_at:now()};for(const key of allowed)if(payload.patch?.[key]!==undefined)patch[key]=payload.patch[key]
  const {data,error:e}=await db.from('browser_extension_b2b_opportunities').update(patch).eq('id',opportunity.id).select('*').single();if(e)dbError('B2B_OPPORTUNITY_UPDATE_FAILED',e)
  const nextBestAction=await refreshNextAction(db,actor,prospect,data)
  return {opportunity:data,prospect,nextBestAction}
}

async function recommendStage(db:any,actor:any,_device:any,access:any,payload:any){
  const {opportunity,prospect}=await loadOpportunity(db,actor,access,payload)
  const facts=await opportunityFacts(db,prospect.id,opportunity,payload)
  const currentIndex=B2B_EXECUTION_STAGES.findIndex((row)=>row.key===opportunity.stage)
  const candidates=B2B_EXECUTION_STAGES.slice(Math.max(0,currentIndex+1),Math.max(0,currentIndex+5))
  const recommended=candidates.find((row)=>validateStageChange(opportunity.stage,row.key,facts).ok)||B2B_EXECUTION_STAGES[currentIndex]
  const validation=validateStageChange(opportunity.stage,recommended.key,facts)
  return {opportunity,prospect,currentStage:stageDefinition(opportunity.stage),recommendedStage:recommended,ready:validation.ok,missing:validation.missing,facts}
}

async function changeStage(db:any,actor:any,_device:any,access:any,payload:any){
  const {opportunity,prospect}=await loadOpportunity(db,actor,access,payload)
  const target=String(payload.targetStage) as B2BExecutionStage
  const def=stageDefinition(target);if(!def)throw error('INVALID_PIPELINE_STAGE')
  const facts=await opportunityFacts(db,prospect.id,opportunity,payload)
  const validation=validateStageChange(opportunity.stage,target,facts)
  if(!validation.ok)throw error('PIPELINE_STAGE_REQUIREMENTS_MISSING',409,{currentStage:opportunity.stage,targetStage:target,missing:validation.missing})
  const status=target==='lost'?'lost':target==='won'?'won':target==='nurture'?'nurture':'active'
  const patch:any={stage:target,stage_order:def.order,status,updated_by:actor.id,updated_at:now(),last_activity_at:now()}
  if(target==='commercial_agreement')patch.commercial_agreement_at=now()
  const {data,error:e}=await db.from('browser_extension_b2b_opportunities').update(patch).eq('id',opportunity.id).select('*').single();if(e)dbError('B2B_STAGE_CHANGE_FAILED',e)
  await db.from('browser_extension_b2b_opportunity_stage_history').insert({opportunity_id:opportunity.id,prospect_id:prospect.id,from_stage:opportunity.stage,to_stage:target,reason:string(payload.reason,2000)||'Governed stage progression',evidence:payload.evidence||{},requirements_snapshot:facts,changed_by:actor.id})
  await db.from('b2b_prospects').update({status:coreProspectStatus(target),updated_by:actor.id,next_action:payload.nextAction||prospect.next_action}).eq('id',prospect.id)
  await timeline(db,actor,{prospectId:prospect.id,opportunityId:opportunity.id,eventType:'stage_changed',title:`Pipeline stage changed to ${def.label}`,description:string(payload.reason,2000),outcome:target,metadata:{from:opportunity.stage,to:target,facts}})
  const nextBestAction=status==='active'?await refreshNextAction(db,actor,prospect,data):null
  return {opportunity:data,prospect,nextBestAction,stage:def}
}

async function readPipeline(db:any,actor:any,_device:any,access:any,payload:any){
  const limit=Math.min(number(payload.limit,100),500)
  const {data,error:e}=await db.from('browser_extension_b2b_opportunities').select('*').order('stage_order',{ascending:true}).order('updated_at',{ascending:false}).limit(limit);if(e)dbError('B2B_PIPELINE_READ_FAILED',e)
  const prospectIds=Array.from(new Set((data||[]).map((row:any)=>row.prospect_id)))
  const {data:prospects}=prospectIds.length?await db.from('b2b_prospects').select('*').in('id',prospectIds):{data:[]}
  const visible=filterByOwnership(prospects||[],actor.id,scopeRecord(access));const allowed=new Set(visible.map((row:any)=>row.id));const rows=(data||[]).filter((row:any)=>allowed.has(row.prospect_id)).map((row:any)=>({...row,prospect:visible.find((p:any)=>p.id===row.prospect_id)}))
  return {opportunities:rows,stages:B2B_EXECUTION_STAGES,summary:B2B_EXECUTION_STAGES.map((stage)=>({stage:stage.key,label:stage.label,count:rows.filter((row:any)=>row.stage===stage.key).length,value:rows.filter((row:any)=>row.stage===stage.key).reduce((sum:number,row:any)=>sum+number(row.estimated_annual_value),0)}))}
}

async function detectRisks(db:any,actor:any,device:any,access:any,payload:any){
  const pipeline=await readPipeline(db,actor,device,access,payload);const risks=[] as any[]
  for(const row of pipeline.opportunities){const ageHours=(Date.now()-new Date(row.updated_at||row.created_at).getTime())/3600000;const items=[] as string[];if(!row.next_action)items.push('No next action');if(row.next_action_due_at&&new Date(row.next_action_due_at)<new Date())items.push('Next action overdue');if(ageHours>Number(row.stale_after_days||7)*24)items.push('Opportunity is stale');if(['proposal_sent','negotiation'].includes(row.stage)&&!row.expected_close_at)items.push('No expected decision date');if(items.length)risks.push({opportunityId:row.id,prospectId:row.prospect_id,accountName:row.prospect?.name,stage:row.stage,riskLevel:items.length>=3?'critical':items.length===2?'high':'medium',reasons:items})}
  return {risks,total:risks.length,critical:risks.filter((row)=>row.riskLevel==='critical').length}
}

async function readNextActions(db:any,actor:any,_device:any,access:any,payload:any){
  const pipeline=await readPipeline(db,actor,null,access,{limit:500});const ids=pipeline.opportunities.map((row:any)=>row.id);if(!ids.length)return{actions:[]}
  let query=db.from('browser_extension_b2b_next_best_actions').select('*').in('opportunity_id',ids).eq('status','open').order('due_at',{ascending:true});if(payload.overdueOnly)query=query.lt('due_at',now());const {data,error:e}=await query.limit(Math.min(number(payload.limit,100),500));if(e)dbError('B2B_NEXT_ACTION_READ_FAILED',e);return{actions:(data||[]).map((row:any)=>({...row,opportunity:pipeline.opportunities.find((opp:any)=>opp.id===row.opportunity_id)}))}
}

async function completeNextAction(db:any,actor:any,_device:any,access:any,payload:any){
  if(!payload.actionId)throw error('ACTION_ID_REQUIRED');const {data:action,error:e}=await db.from('browser_extension_b2b_next_best_actions').select('*').eq('id',payload.actionId).maybeSingle();if(e)dbError('B2B_NEXT_ACTION_LOAD_FAILED',e);if(!action)throw error('NEXT_ACTION_NOT_FOUND',404);const {opportunity,prospect}=await loadOpportunity(db,actor,access,{opportunityId:action.opportunity_id});const {data,error:ue}=await db.from('browser_extension_b2b_next_best_actions').update({status:'completed',completed_at:now(),completed_by:actor.id,outcome:string(payload.outcome,2000),updated_at:now()}).eq('id',action.id).select('*').single();if(ue)dbError('B2B_NEXT_ACTION_COMPLETE_FAILED',ue);await timeline(db,actor,{prospectId:prospect.id,opportunityId:opportunity.id,eventType:'next_action_completed',title:action.title,description:string(payload.outcome,2000),outcome:'completed'});const nextBestAction=await refreshNextAction(db,actor,prospect,opportunity);return{action:data,nextBestAction}
}

async function prepareOutreach(db:any,actor:any,_device:any,access:any,payload:any){
  const {opportunity,prospect}=await loadOpportunity(db,actor,access,payload);let contact=null;if(payload.contactId){const {data}=await db.from('b2b_contacts').select('*').eq('id',payload.contactId).eq('prospect_id',prospect.id).maybeSingle();contact=data}else{const {data}=await db.from('b2b_contacts').select('*').eq('prospect_id',prospect.id).order('is_decision_maker',{ascending:false}).order('is_primary',{ascending:false}).limit(1).maybeSingle();contact=data}
  const strategy=buildOutreachStrategy({prospect,contact,opportunity,channel:payload.channel,purpose:payload.purpose,context:payload.context});const {data,error:e}=await db.from('browser_extension_b2b_outreach_strategies').insert({prospect_id:prospect.id,opportunity_id:opportunity.id,contact_id:contact?.id||null,user_id:actor.id,channel:strategy.channel,purpose:strategy.purpose,vertical:strategy.vertical,subject:strategy.subject,body:strategy.body,call_opening:strategy.callOpening,discovery_questions:strategy.discoveryQuestions,reasoning:strategy.reasoning,status:'prepared'}).select('*').single();if(e)dbError('B2B_OUTREACH_STRATEGY_FAILED',e);return{strategy:{...data,discoveryQuestions:strategy.discoveryQuestions},prospect,opportunity,contact}
}

async function prepareCommunication(db:any,actor:any,device:any,access:any,payload:any){
  const prepared=await prepareOutreach(db,actor,device,access,payload);const channel=String(payload.channel||prepared.strategy.channel||'email').toLowerCase();const {data,error:e}=await db.from('browser_extension_b2b_communication_drafts').insert({prospect_id:prepared.prospect.id,opportunity_id:prepared.opportunity.id,contact_id:prepared.contact?.id||null,strategy_id:prepared.strategy.id,user_id:actor.id,channel,subject:payload.subject||prepared.strategy.subject,body:payload.body||prepared.strategy.body,status:'prepared',requires_confirmation:true,source_adapter:payload.sourceAdapter||null,source_context_id:payload.communicationContextId||null,metadata:{purpose:prepared.strategy.purpose}}).select('*').single();if(e)dbError('B2B_COMMUNICATION_DRAFT_FAILED',e);await timeline(db,actor,{prospectId:prepared.prospect.id,opportunityId:prepared.opportunity.id,contactId:prepared.contact?.id,eventType:'communication_prepared',title:`${channel} communication prepared`,description:data.subject||data.body,sourceAdapter:payload.sourceAdapter,sourceUrl:payload.sourceUrl,metadata:{draftId:data.id}});return{...prepared,draft:data}}

async function logCommunication(db:any,actor:any,_device:any,access:any,payload:any){
  const {opportunity,prospect}=await loadOpportunity(db,actor,access,payload);const channel=String(payload.channel||'Email');const outcome=String(payload.outcome||'Prepared');const outreach=await safeInsert(db,'b2b_outreach_logs',{prospect_id:prospect.id,contact_id:payload.contactId||null,channel,template_key:payload.templateKey||null,subject:string(payload.subject,1000),message_body:string(payload.body||payload.message,8000),outcome,sent_by:actor.id,sent_at:payload.sentAt||now(),next_follow_up_at:payload.nextFollowUpAt||null});if(payload.draftId)await db.from('browser_extension_b2b_communication_drafts').update({status:payload.sent?'sent':'copied',logged_at:now(),outcome}).eq('id',payload.draftId)
  await timeline(db,actor,{prospectId:prospect.id,opportunityId:opportunity.id,contactId:payload.contactId,eventType:'communication_logged',title:`${channel} · ${outcome}`,description:string(payload.subject||payload.body,4000),outcome,sourceAdapter:payload.sourceAdapter,sourceUrl:payload.sourceUrl,metadata:{outreachId:outreach?.id||null}})
  if(/reply|respond|interested|meeting|positive/i.test(outcome))await stopActiveSequences(db,actor,{prospectId:prospect.id,reason:`Conversation outcome: ${outcome}`})
  let followup=null;if(payload.nextFollowUpAt)followup=(await createFollowup(db,actor,null,access,{prospectId:prospect.id,opportunityId:opportunity.id,contactId:payload.contactId,title:payload.followUpTitle||`Follow up after ${channel}`,channel,dueAt:payload.nextFollowUpAt,objective:payload.nextAction||'Advance the commercial conversation'})).followup
  const nextBestAction=await refreshNextAction(db,actor,prospect,{...opportunity,last_activity_at:now()});return{outreach,followup,nextBestAction}
}

function extractConversationSignals(context:any){const source=JSON.stringify(context?.metadata||{});const dates=(source.match(/\b(?:20\d{2}-\d{2}-\d{2}|\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4})\b/g)||[]).slice(0,10);const positive=/pricing|price|proposal|devis|tarif|pilot|meeting|rendez-vous|interested|intéress/i.test(source);const objections=[] as string[];if(/price|prix|budget|tarif/i.test(source))objections.push('Pricing or budget');if(/approval|direction|validation|procurement|achat/i.test(source))objections.push('Internal approval');if(/later|delay|reporter|pas maintenant/i.test(source))objections.push('Timing');return{dates,positiveBuyingSignal:positive,objections}}

async function resolveCommunicationContext(db:any,actor:any,device:any,access:any,payload:any,adapter:string){
  const context=payload.context||{};const metadata=context.metadata||{};const participants=metadata.thread?.participants||context.contacts?.map((row:any)=>row.email).filter(Boolean)||[];const signals=extractConversationSignals(context);let prospect=null;if(payload.prospectId)prospect=await loadProspect(db,actor,access,payload.prospectId);else{const emails=participants.map(normalizeEmail).filter(Boolean);if(emails.length){const {data:contacts}=await db.from('b2b_contacts').select('*').in('email',emails);if(contacts?.[0])prospect=await loadProspect(db,actor,access,contacts[0].prospect_id)}if(!prospect&&context.organization?.domain){const {data}=await db.from('b2b_prospects').select('*').ilike('website',`%${context.organization.domain}%`).limit(1).maybeSingle();if(data)prospect=await loadProspect(db,actor,access,data.id)}}
  const {data,error:e}=await db.from('browser_extension_b2b_communication_contexts').insert({prospect_id:prospect?.id||null,opportunity_id:payload.opportunityId||null,user_id:actor.id,device_id:device.id,adapter_key:adapter,source_url:context.url,thread_key:string(metadata.thread?.subject||metadata.conversation?.title||context.title,500),participants,context_payload:context,signals,status:'resolved'}).select('*').single();if(e)dbError('B2B_COMMUNICATION_CONTEXT_FAILED',e);return{communicationContext:data,prospect,signals,context}}

async function prepareContextReply(db:any,actor:any,device:any,access:any,payload:any,adapter:string){const resolved=payload.communicationContextId?null:await resolveCommunicationContext(db,actor,device,access,payload,adapter);const prospectId=payload.prospectId||resolved?.prospect?.id;if(!prospectId)throw error('ACCOUNT_MATCH_REQUIRED_FOR_REPLY',409,{signals:resolved?.signals});return prepareCommunication(db,actor,device,access,{...payload,prospectId,sourceAdapter:adapter,communicationContextId:payload.communicationContextId||resolved?.communicationContext?.id,channel:adapter==='gmail'?'email':'whatsapp',purpose:payload.purpose||'followup'})}

async function prepareCall(db:any,actor:any,_device:any,access:any,payload:any){const {opportunity,prospect}=await loadOpportunity(db,actor,access,payload);const {data:contact}=payload.contactId?await db.from('b2b_contacts').select('*').eq('id',payload.contactId).maybeSingle():await db.from('b2b_contacts').select('*').eq('prospect_id',prospect.id).order('is_decision_maker',{ascending:false}).limit(1).maybeSingle();const strategy=buildOutreachStrategy({prospect,contact,opportunity,channel:'call',purpose:payload.purpose||'discovery'});const {data,error:e}=await db.from('browser_extension_b2b_call_briefs').insert({prospect_id:prospect.id,opportunity_id:opportunity.id,contact_id:contact?.id||null,user_id:actor.id,objective:payload.objective||strategy.callOpening,account_summary:`${prospect.name} · ${prospect.sector||'B2B'} · ${opportunity.stage}`,questions:strategy.discoveryQuestions,known_objections:payload.knownObjections||[],pricing_boundaries:payload.pricingBoundaries||{},desired_outcome:payload.desiredOutcome||'Secure a dated next commercial step',minimum_next_step:payload.minimumNextStep||'A follow-up with owner and deadline',status:'prepared'}).select('*').single();if(e)dbError('B2B_CALL_BRIEF_FAILED',e);return{callBrief:data,prospect,opportunity,contact}}

async function recordCall(db:any,actor:any,_device:any,access:any,payload:any){const {opportunity,prospect}=await loadOpportunity(db,actor,access,payload);const result=String(payload.result||'Completed');const call=await safeInsert(db,'b2b_calls',{prospect_id:prospect.id,contact_id:payload.contactId||null,caller_id:actor.id,call_type:payload.callType||'partnership_development',call_result:result,duration_minutes:number(payload.durationMinutes),summary:string(payload.summary,6000),objections:Array.isArray(payload.objections)?payload.objections.join('; '):string(payload.objections,3000),decision_maker_identified:Boolean(payload.decisionMakerIdentified),next_step:string(payload.nextStep,2000),next_follow_up_at:payload.nextFollowUpAt||null});if(payload.callBriefId)await db.from('browser_extension_b2b_call_briefs').update({status:'completed',outcome:result,completed_at:now()}).eq('id',payload.callBriefId);await timeline(db,actor,{prospectId:prospect.id,opportunityId:opportunity.id,contactId:payload.contactId,eventType:'call_completed',title:`Call · ${result}`,description:string(payload.summary,4000),outcome:result,metadata:{callId:call?.id||null,objections:payload.objections||[]}});let followup=null;if(payload.nextFollowUpAt)followup=(await createFollowup(db,actor,null,access,{prospectId:prospect.id,opportunityId:opportunity.id,contactId:payload.contactId,title:payload.nextStep||'Call follow-up',channel:'phone',dueAt:payload.nextFollowUpAt,objective:payload.nextStep||'Advance the opportunity'})).followup;const stageRecommendation=await recommendStage(db,actor,null,access,{opportunityId:opportunity.id,evidence:{hasNeed:Boolean(payload.needConfirmed),hasScope:Boolean(payload.scopeConfirmed)}});const nextBestAction=await refreshNextAction(db,actor,prospect,{...opportunity,last_activity_at:now()});return{call,followup,stageRecommendation,nextBestAction}}

async function createFieldVisit(db:any,actor:any,_device:any,access:any,payload:any){const {opportunity,prospect}=await loadOpportunity(db,actor,access,payload);const {data,error:e}=await db.from('browser_extension_b2b_field_visits').insert({prospect_id:prospect.id,opportunity_id:opportunity.id,assigned_to:payload.assignedTo||actor.id,created_by:actor.id,visit_objective:string(payload.objective,3000)||'Qualify the account and secure a commercial next step',planned_at:payload.plannedAt||datePlus(24),location:string(payload.location,1000)||prospect.address,status:'planned',evidence_requirements:payload.evidenceRequirements||['person met','outcome','next step']}).select('*').single();if(e)dbError('B2B_FIELD_VISIT_CREATE_FAILED',e);await createCoreTask(db,actor,{prospectId:prospect.id,title:`Field visit — ${prospect.name}`,taskType:'Field visit',assignedTo:payload.assignedTo||actor.id,dueAt:data.planned_at,description:data.visit_objective});return{fieldVisit:data,prospect,opportunity}}

async function recordFieldVisit(db:any,actor:any,_device:any,access:any,payload:any){if(!payload.visitId)throw error('VISIT_ID_REQUIRED');const {data:visit}=await db.from('browser_extension_b2b_field_visits').select('*').eq('id',payload.visitId).maybeSingle();if(!visit)throw error('FIELD_VISIT_NOT_FOUND',404);const {opportunity,prospect}=await loadOpportunity(db,actor,access,{opportunityId:visit.opportunity_id});const {data,error:e}=await db.from('browser_extension_b2b_field_visits').update({status:'completed',checked_in_at:payload.checkedInAt||visit.checked_in_at||now(),completed_at:now(),person_met:string(payload.personMet,240),contact_id:payload.contactId||null,outcome:string(payload.outcome,4000),notes:string(payload.notes,6000),evidence:payload.evidence||{},next_step:string(payload.nextStep,2000),next_follow_up_at:payload.nextFollowUpAt||null}).eq('id',visit.id).select('*').single();if(e)dbError('B2B_FIELD_VISIT_RESULT_FAILED',e);await timeline(db,actor,{prospectId:prospect.id,opportunityId:opportunity.id,contactId:payload.contactId,eventType:'field_visit_completed',title:`Field visit completed — ${prospect.name}`,description:data.outcome,outcome:data.next_step,evidence:data.evidence});let followup=null;if(payload.nextFollowUpAt)followup=(await createFollowup(db,actor,null,access,{prospectId:prospect.id,opportunityId:opportunity.id,contactId:payload.contactId,title:payload.nextStep||'Field visit follow-up',channel:'field',dueAt:payload.nextFollowUpAt,objective:payload.nextStep||'Advance the field opportunity'})).followup;return{fieldVisit:data,followup,nextBestAction:await refreshNextAction(db,actor,prospect,{...opportunity,last_activity_at:now()})}}

async function prepareMeeting(db:any,actor:any,_device:any,access:any,payload:any){const {opportunity,prospect}=await loadOpportunity(db,actor,access,payload);const counts=await contactCounts(db,prospect.id);const strategy=buildOutreachStrategy({prospect,opportunity,channel:'meeting',purpose:'discovery'});const missing=[] as string[];if(!counts.contactCount)missing.push('Validated contact');if(!counts.decisionMakerCount)missing.push('Decision authority');if(!opportunity.decision_process)missing.push('Decision process');if(!opportunity.launch_at)missing.push('Launch timing');const {data,error:e}=await db.from('browser_extension_b2b_meeting_briefs').insert({prospect_id:prospect.id,opportunity_id:opportunity.id,meeting_id:payload.meetingId||null,user_id:actor.id,meeting_type:payload.meetingType||'discovery',objective:payload.objective||'Confirm need, scope, timing, decision process and a dated next step',account_summary:`${prospect.name} · ${prospect.sector||'B2B'} · ${opportunity.stage}`,commercial_history:payload.commercialHistory||{},stakeholder_map:payload.stakeholderMap||{},missing_information:missing,questions:strategy.discoveryQuestions,likely_objections:payload.likelyObjections||[],pricing_restrictions:payload.pricingRestrictions||{},desired_commitment:payload.desiredCommitment||'Agreement on the next decision milestone',minimum_next_step:payload.minimumNextStep||'Owner and deadline for the next action',status:'prepared'}).select('*').single();if(e)dbError('B2B_MEETING_BRIEF_FAILED',e);return{meetingBrief:data,prospect,opportunity}}

async function createMeeting(db:any,actor:any,_device:any,access:any,payload:any){const {opportunity,prospect}=await loadOpportunity(db,actor,access,payload);if(!payload.scheduledAt)throw error('MEETING_SCHEDULE_REQUIRED');const meeting=await safeInsert(db,'b2b_meetings',{prospect_id:prospect.id,meeting_type:payload.meetingType||'Discovery',status:'Scheduled',scheduled_at:payload.scheduledAt,location:payload.location||null,video_link:payload.videoLink||null,agenda:payload.agenda||'Confirm need, scope, decision process and next step',notes:null,next_step:payload.nextStep||null,follow_up_at:payload.followUpAt||null,created_by:actor.id,updated_by:actor.id});if(!meeting)throw error('B2B_MEETING_CREATE_FAILED',500);await timeline(db,actor,{prospectId:prospect.id,opportunityId:opportunity.id,contactId:payload.contactId,eventType:'meeting_scheduled',title:`Meeting scheduled — ${payload.meetingType||'Discovery'}`,description:payload.agenda,outcome:payload.scheduledAt,metadata:{meetingId:meeting.id}});const brief=await prepareMeeting(db,actor,null,access,{...payload,opportunityId:opportunity.id,meetingId:meeting.id});return{meeting,meetingBrief:brief.meetingBrief,prospect,opportunity}}

async function assistMeeting(db:any,actor:any,_device:any,access:any,payload:any){const {opportunity,prospect}=await loadOpportunity(db,actor,access,payload);const checklist={confirmed:Array.isArray(payload.confirmed)?payload.confirmed:[],missing:Array.isArray(payload.missing)?payload.missing:[],objections:Array.isArray(payload.objections)?payload.objections:[],commitments:Array.isArray(payload.commitments)?payload.commitments:[],notes:string(payload.notes,8000)};const {data,error:e}=await db.from('browser_extension_b2b_meeting_live_notes').insert({prospect_id:prospect.id,opportunity_id:opportunity.id,meeting_id:payload.meetingId||null,user_id:actor.id,checklist,consent_confirmed:Boolean(payload.consentConfirmed),recording_used:false,status:'active'}).select('*').single();if(e)dbError('B2B_MEETING_ASSIST_FAILED',e);return{liveNotes:data,suggestedQuestion:checklist.missing[0]?`Can we confirm ${checklist.missing[0]} and who owns that decision?`:'What is the exact next decision milestone and date?'}}

async function prepareMeetingSummary(db:any,actor:any,_device:any,access:any,payload:any){const {opportunity,prospect}=await loadOpportunity(db,actor,access,payload);const notes=payload.notes||payload.context?.metadata?.meeting||{};const summary={attendees:payload.attendees||[],confirmedNeeds:payload.confirmedNeeds||[],scope:payload.scope||null,budget:payload.budget||null,timing:payload.timing||null,decisionProcess:payload.decisionProcess||null,stakeholders:payload.stakeholders||[],objections:payload.objections||[],commitments:payload.commitments||[],risks:payload.risks||[],nextActions:payload.nextActions||[],notes};const {data,error:e}=await db.from('browser_extension_b2b_meeting_outcomes').insert({prospect_id:prospect.id,opportunity_id:opportunity.id,meeting_id:payload.meetingId||null,user_id:actor.id,summary,confirmed_needs:summary.confirmedNeeds,scope_summary:string(summary.scope,4000),budget_summary:string(summary.budget,2000),timing_summary:string(summary.timing,2000),decision_process:string(summary.decisionProcess,4000),stakeholders:summary.stakeholders,objections:summary.objections,commitments:summary.commitments,risks:summary.risks,next_actions:summary.nextActions,status:'prepared'}).select('*').single();if(e)dbError('B2B_MEETING_SUMMARY_FAILED',e);return{meetingOutcome:data,prospect,opportunity,stageRecommendation:await recommendStage(db,actor,null,access,{opportunityId:opportunity.id,evidence:{hasNeed:summary.confirmedNeeds.length>0,hasScope:Boolean(summary.scope)}})}}

async function applyMeetingOutcome(db:any,actor:any,_device:any,access:any,payload:any){if(!payload.outcomeId)throw error('MEETING_OUTCOME_ID_REQUIRED');const {data:outcome}=await db.from('browser_extension_b2b_meeting_outcomes').select('*').eq('id',payload.outcomeId).maybeSingle();if(!outcome)throw error('MEETING_OUTCOME_NOT_FOUND',404);const {opportunity,prospect}=await loadOpportunity(db,actor,access,{opportunityId:outcome.opportunity_id});await db.from('browser_extension_b2b_meeting_outcomes').update({status:'applied',applied_at:now(),applied_by:actor.id}).eq('id',outcome.id);await db.from('browser_extension_b2b_opportunities').update({need_confirmed:Array.isArray(outcome.confirmed_needs)&&outcome.confirmed_needs.length>0,scope_summary:outcome.scope_summary||opportunity.scope_summary,decision_process:outcome.decision_process||opportunity.decision_process,last_activity_at:now(),updated_by:actor.id,updated_at:now()}).eq('id',opportunity.id);await timeline(db,actor,{prospectId:prospect.id,opportunityId:opportunity.id,eventType:'meeting_outcome_applied',title:'Meeting outcome applied to opportunity',description:string(outcome.summary,6000),metadata:{outcomeId:outcome.id}});const followups=[];for(const item of outcome.next_actions||[]){if(item?.title&&item?.dueAt)followups.push((await createFollowup(db,actor,null,access,{prospectId:prospect.id,opportunityId:opportunity.id,title:item.title,dueAt:item.dueAt,objective:item.objective||item.title,assignedTo:item.assignedTo||actor.id})).followup)}return{meetingOutcome:{...outcome,status:'applied'},followups,nextBestAction:await refreshNextAction(db,actor,prospect,{...opportunity,last_activity_at:now()})}}

async function createFollowup(db:any,actor:any,_device:any,access:any,payload:any){const {opportunity,prospect}=await loadOpportunity(db,actor,access,payload);if(!payload.dueAt)throw error('FOLLOWUP_DUE_AT_REQUIRED');const row={prospect_id:prospect.id,opportunity_id:opportunity.id,contact_id:payload.contactId||null,user_id:actor.id,assigned_to:payload.assignedTo||actor.id,channel:payload.channel||'internal',followup_type:payload.followupType||'commercial_followup',title:string(payload.title,500)||'Commercial follow-up',objective:string(payload.objective,3000)||'Advance the opportunity with a precise outcome',due_at:payload.dueAt,priority:payload.priority||'high',status:'open',escalation_rule:payload.escalationRule||{afterHours:24,action:'manager_alert'},source_event_id:payload.sourceEventId||null};const {data,error:e}=await db.from('browser_extension_b2b_followups').insert(row).select('*').single();if(e)dbError('B2B_FOLLOWUP_CREATE_FAILED',e);const task=await createCoreTask(db,actor,{prospectId:prospect.id,title:row.title,taskType:'Follow-up',assignedTo:row.assigned_to,priority:row.priority==='critical'?'Critical':'High',dueAt:row.due_at,description:row.objective,nextAction:row.title});await timeline(db,actor,{prospectId:prospect.id,opportunityId:opportunity.id,contactId:payload.contactId,eventType:'followup_created',title:row.title,description:row.objective,outcome:row.due_at,metadata:{followupId:data.id,taskId:task?.id||null}});return{followup:{...data,task_id:task?.id||null},nextBestAction:await persistNextAction(db,actor,prospect,opportunity,{actionType:'followup',title:row.title,objective:row.objective,dueAt:row.due_at,priority:row.priority,reasoning:['A dated commercial commitment was created']})}}

async function completeFollowup(db:any,actor:any,_device:any,access:any,payload:any){if(!payload.followupId)throw error('FOLLOWUP_ID_REQUIRED');const {data:followup}=await db.from('browser_extension_b2b_followups').select('*').eq('id',payload.followupId).maybeSingle();if(!followup)throw error('FOLLOWUP_NOT_FOUND',404);const {opportunity,prospect}=await loadOpportunity(db,actor,access,{opportunityId:followup.opportunity_id});const {data,error:e}=await db.from('browser_extension_b2b_followups').update({status:'completed',completed_at:now(),completed_by:actor.id,outcome:string(payload.outcome,3000),updated_at:now()}).eq('id',followup.id).select('*').single();if(e)dbError('B2B_FOLLOWUP_COMPLETE_FAILED',e);await timeline(db,actor,{prospectId:prospect.id,opportunityId:opportunity.id,eventType:'followup_completed',title:followup.title,description:string(payload.outcome,3000),outcome:'completed'});return{followup:data,nextBestAction:await refreshNextAction(db,actor,prospect,{...opportunity,last_activity_at:now()})}}

async function createSequence(db:any,actor:any,_device:any,_access:any,payload:any){const steps=Array.isArray(payload.steps)&&payload.steps.length?payload.steps:[{dayOffset:0,channel:'email',purpose:'introduction'},{dayOffset:1,channel:'phone',purpose:'discovery_call'},{dayOffset:3,channel:'email',purpose:'use_case'},{dayOffset:5,channel:'whatsapp',purpose:'pilot_discussion'},{dayOffset:8,channel:'email',purpose:'final_active_followup'}];const {data,error:e}=await db.from('browser_extension_b2b_sequences').insert({name:string(payload.name,300)||'B2B controlled outreach sequence',vertical:payload.vertical||'general',objective:string(payload.objective,2000)||'Convert qualified accounts into discovery meetings',status:'active',stop_rules:payload.stopRules||['reply_received','meeting_booked','wrong_contact','declined','proposal_requested','manager_intervention'],created_by:actor.id}).select('*').single();if(e)dbError('B2B_SEQUENCE_CREATE_FAILED',e);const rows=steps.map((step:any,index:number)=>({sequence_id:data.id,step_order:index+1,day_offset:number(step.dayOffset,index),channel:step.channel||'email',purpose:step.purpose||'followup',template_key:step.templateKey||null,requires_confirmation:true,status:'active'}));const {data:created,error:se}=await db.from('browser_extension_b2b_sequence_steps').insert(rows).select('*');if(se)dbError('B2B_SEQUENCE_STEPS_FAILED',se);return{sequence:data,steps:created||[]}}

async function enrollSequence(db:any,actor:any,_device:any,access:any,payload:any){if(!payload.sequenceId||!payload.prospectId)throw error('SEQUENCE_AND_PROSPECT_REQUIRED');const prospect=await loadProspect(db,actor,access,payload.prospectId);let opportunity=null;if(payload.opportunityId)opportunity=(await loadOpportunity(db,actor,access,payload)).opportunity;const {data:steps}=await db.from('browser_extension_b2b_sequence_steps').select('*').eq('sequence_id',payload.sequenceId).eq('status','active').order('step_order',{ascending:true});const first=steps?.[0];const nextRun=first?new Date(Date.now()+number(first.day_offset)*86400000).toISOString():null;const {data,error:e}=await db.from('browser_extension_b2b_sequence_enrollments').insert({sequence_id:payload.sequenceId,prospect_id:prospect.id,opportunity_id:opportunity?.id||null,contact_id:payload.contactId||null,user_id:actor.id,status:'active',current_step_order:0,next_run_at:nextRun,channel_state:{},enrolled_by:actor.id}).select('*').single();if(e)dbError('B2B_SEQUENCE_ENROLL_FAILED',e);await db.from('browser_extension_b2b_sequence_events').insert({enrollment_id:data.id,event_type:'enrolled',event_payload:{nextRunAt:nextRun},created_by:actor.id});return{enrollment:data,steps:steps||[]}}

async function changeSequenceStatus(db:any,actor:any,payload:any,status:string){if(!payload.enrollmentId)throw error('SEQUENCE_ENROLLMENT_REQUIRED');const {data,error:e}=await db.from('browser_extension_b2b_sequence_enrollments').update({status,stop_reason:string(payload.reason,1000),stopped_at:status==='stopped'?now():null,updated_at:now()}).eq('id',payload.enrollmentId).select('*').single();if(e)dbError('B2B_SEQUENCE_STATUS_FAILED',e);await db.from('browser_extension_b2b_sequence_events').insert({enrollment_id:data.id,event_type:status,event_payload:{reason:payload.reason||null},created_by:actor.id});return{enrollment:data}}

async function stopActiveSequences(db:any,actor:any,payload:any){let query=db.from('browser_extension_b2b_sequence_enrollments').select('*').eq('prospect_id',payload.prospectId).eq('status','active');const {data}=await query;const stopped=[];for(const row of data||[])stopped.push((await changeSequenceStatus(db,actor,{enrollmentId:row.id,reason:payload.reason},'stopped')).enrollment);return stopped}

async function attributeCampaign(db:any,actor:any,_device:any,access:any,payload:any){const {opportunity,prospect}=await loadOpportunity(db,actor,access,payload);const {data,error:e}=await db.from('browser_extension_b2b_attribution').insert({prospect_id:prospect.id,opportunity_id:opportunity.id,campaign_id:payload.campaignId||null,campaign_key:string(payload.campaignKey,300),source_type:payload.sourceType||'campaign',source_label:string(payload.sourceLabel,500),source_url:string(payload.sourceUrl,1500),first_touch:Boolean(payload.firstTouch),last_touch:Boolean(payload.lastTouch),attributed_value:number(payload.attributedValue,opportunity.estimated_annual_value),metadata:payload.metadata||{},created_by:actor.id}).select('*').single();if(e)dbError('B2B_CAMPAIGN_ATTRIBUTION_FAILED',e);return{attribution:data}}

async function recordReferral(db:any,actor:any,_device:any,access:any,payload:any){const prospect=await loadProspect(db,actor,access,payload.prospectId);const allowed=['ambassador','partner','employee','customer','professional','event','campaign','organic','direct_inbound','field_discovery','google_maps','institutional','other'];const type=String(payload.sourceType||'other');if(!allowed.includes(type))throw error('INVALID_REFERRAL_SOURCE');const {data:existing}=await db.from('browser_extension_b2b_referral_sources').select('*').eq('prospect_id',prospect.id).eq('is_primary',true).maybeSingle();if(existing&&!payload.override)throw error('PRIMARY_REFERRAL_SOURCE_ALREADY_EXISTS',409,{existing});if(existing&&payload.override)await db.from('browser_extension_b2b_referral_sources').update({is_primary:false,updated_at:now()}).eq('id',existing.id);const {data,error:e}=await db.from('browser_extension_b2b_referral_sources').insert({prospect_id:prospect.id,opportunity_id:payload.opportunityId||null,source_type:type,source_entity_id:payload.sourceEntityId||null,source_name:string(payload.sourceName,500),is_primary:payload.isPrimary!==false,attribution_status:'recorded',evidence:payload.evidence||{},created_by:actor.id}).select('*').single();if(e)dbError('B2B_REFERRAL_SOURCE_FAILED',e);return{referralSource:data}}

async function dailyCommand(db:any,actor:any,device:any,access:any,payload:any){const pipeline=await readPipeline(db,actor,device,access,{limit:500});const opportunityIds=pipeline.opportunities.map((row:any)=>row.id);const todayStart=new Date();todayStart.setHours(0,0,0,0);const todayEnd=new Date(todayStart);todayEnd.setDate(todayEnd.getDate()+1);const {data:actions}=opportunityIds.length?await db.from('browser_extension_b2b_next_best_actions').select('*').in('opportunity_id',opportunityIds).eq('status','open').order('due_at',{ascending:true}):{data:[]};const {data:followups}=opportunityIds.length?await db.from('browser_extension_b2b_followups').select('*').in('opportunity_id',opportunityIds).eq('status','open').order('due_at',{ascending:true}):{data:[]};const {data:allMeetings}=await db.from('b2b_meetings').select('*').gte('scheduled_at',todayStart.toISOString()).lt('scheduled_at',todayEnd.toISOString()).order('scheduled_at',{ascending:true});const allowedProspectIds=new Set(pipeline.opportunities.map((row:any)=>row.prospect_id));const meetings=(allMeetings||[]).filter((row:any)=>row.prospect_id&&allowedProspectIds.has(row.prospect_id));const overdue=(followups||[]).filter((row:any)=>new Date(row.due_at)<new Date());const priority=(actions||[]).filter((row:any)=>['critical','high'].includes(row.priority)).slice(0,12);const risks=await detectRisks(db,actor,device,access,{limit:500});const snapshot={period:'today',generatedAt:now(),priorityActions:priority,overdueFollowups:overdue,meetings:meetings||[],risks:risks.risks.slice(0,20),pipelineSummary:pipeline.summary,metrics:{activeOpportunities:pipeline.opportunities.length,priorityActions:priority.length,overdueFollowups:overdue.length,meetingsToday:(meetings||[]).length,atRisk:risks.total}};await db.from('browser_extension_b2b_daily_snapshots').insert({user_id:actor.id,snapshot_date:new Date().toISOString().slice(0,10),snapshot,generated_at:now()}).then(()=>undefined);return snapshot}

async function readTimeline(db:any,actor:any,_device:any,access:any,payload:any){if(!payload.prospectId)throw error('PROSPECT_ID_REQUIRED');const prospect=await loadProspect(db,actor,access,payload.prospectId);const [extension,activities,outreach,calls,meetings,tasks]=await Promise.all([db.from('browser_extension_b2b_timeline_events').select('*').eq('prospect_id',prospect.id).order('occurred_at',{ascending:false}).limit(100),db.from('b2b_activities').select('*').eq('prospect_id',prospect.id).order('created_at',{ascending:false}).limit(80),db.from('b2b_outreach_logs').select('*').eq('prospect_id',prospect.id).order('created_at',{ascending:false}).limit(50),db.from('b2b_calls').select('*').eq('prospect_id',prospect.id).order('created_at',{ascending:false}).limit(50),db.from('b2b_meetings').select('*').eq('prospect_id',prospect.id).order('created_at',{ascending:false}).limit(50),db.from('b2b_tasks').select('*').eq('prospect_id',prospect.id).order('created_at',{ascending:false}).limit(50)]);const rows=[...(extension.data||[]).map((row:any)=>({id:`extension-${row.id}`,type:row.event_type,title:row.title,description:row.description,occurredAt:row.occurred_at,source:'browser_os',raw:row})),...(activities.data||[]).map((row:any)=>({id:`activity-${row.id}`,type:row.activity_type,title:row.title,description:row.description,occurredAt:row.created_at,source:'b2b_activity',raw:row})),...(outreach.data||[]).map((row:any)=>({id:`outreach-${row.id}`,type:'outreach',title:`${row.channel} · ${row.outcome}`,description:row.subject||row.message_body,occurredAt:row.created_at||row.sent_at,source:'outreach',raw:row})),...(calls.data||[]).map((row:any)=>({id:`call-${row.id}`,type:'call',title:row.call_result||'Call',description:row.summary,occurredAt:row.created_at,source:'call',raw:row})),...(meetings.data||[]).map((row:any)=>({id:`meeting-${row.id}`,type:'meeting',title:`${row.meeting_type||'Meeting'} · ${row.status}`,description:row.agenda||row.notes,occurredAt:row.created_at||row.scheduled_at,source:'meeting',raw:row})),...(tasks.data||[]).map((row:any)=>({id:`task-${row.id}`,type:'task',title:`${row.status} · ${row.title}`,description:row.description,occurredAt:row.created_at,source:'task',raw:row}))].sort((a,b)=>new Date(b.occurredAt||0).getTime()-new Date(a.occurredAt||0).getTime());return{prospect,timeline:rows.slice(0,Number(payload.limit||150))}}

export async function executeB2BExecutionCommand(input:{db:any;actor:any;device:any;access:any;commandKey:string;payload:any}){
  const {db,actor,device,access,commandKey,payload}=input
  if(!B2B_EXECUTION_COMMAND_MAP.has(commandKey))throw error('UNSUPPORTED_B2B_EXECUTION_COMMAND')
  switch(commandKey){
    case'b2b.opportunity.create':return createOpportunity(db,actor,device,access,payload)
    case'b2b.opportunity.update':return updateOpportunity(db,actor,device,access,payload)
    case'b2b.opportunity.stage_recommend':return recommendStage(db,actor,device,access,payload)
    case'b2b.opportunity.stage_change':return changeStage(db,actor,device,access,payload)
    case'b2b.pipeline.read':return readPipeline(db,actor,device,access,payload)
    case'b2b.pipeline.risk_detect':return detectRisks(db,actor,device,access,payload)
    case'b2b.next_action.read':return readNextActions(db,actor,device,access,payload)
    case'b2b.next_action.complete':return completeNextAction(db,actor,device,access,payload)
    case'b2b.outreach.strategy_prepare':return prepareOutreach(db,actor,device,access,payload)
    case'b2b.communication.prepare':return prepareCommunication(db,actor,device,access,payload)
    case'b2b.communication.log':return logCommunication(db,actor,device,access,payload)
    case'b2b.gmail.thread_resolve':return resolveCommunicationContext(db,actor,device,access,payload,'gmail')
    case'b2b.gmail.reply_prepare':return prepareContextReply(db,actor,device,access,payload,'gmail')
    case'b2b.whatsapp.context_resolve':return resolveCommunicationContext(db,actor,device,access,payload,'whatsapp_web')
    case'b2b.whatsapp.message_prepare':return prepareContextReply(db,actor,device,access,payload,'whatsapp_web')
    case'b2b.call.prepare':return prepareCall(db,actor,device,access,payload)
    case'b2b.call.result_record':return recordCall(db,actor,device,access,payload)
    case'b2b.field_visit.create':return createFieldVisit(db,actor,device,access,payload)
    case'b2b.field_visit.result_record':return recordFieldVisit(db,actor,device,access,payload)
    case'b2b.meeting.prepare':return prepareMeeting(db,actor,device,access,payload)
    case'b2b.meeting.create':return createMeeting(db,actor,device,access,payload)
    case'b2b.meeting.assist':return assistMeeting(db,actor,device,access,payload)
    case'b2b.meeting.summary_prepare':return prepareMeetingSummary(db,actor,device,access,payload)
    case'b2b.meeting.outcome_apply':return applyMeetingOutcome(db,actor,device,access,payload)
    case'b2b.followup.create':return createFollowup(db,actor,device,access,payload)
    case'b2b.followup.complete':return completeFollowup(db,actor,device,access,payload)
    case'b2b.sequence.create':return createSequence(db,actor,device,access,payload)
    case'b2b.sequence.enroll':return enrollSequence(db,actor,device,access,payload)
    case'b2b.sequence.pause':return changeSequenceStatus(db,actor,payload,'paused')
    case'b2b.sequence.stop':return changeSequenceStatus(db,actor,payload,'stopped')
    case'b2b.campaign.attribute':return attributeCampaign(db,actor,device,access,payload)
    case'b2b.referral_source.record':return recordReferral(db,actor,device,access,payload)
    case'b2b.daily_command.read':return dailyCommand(db,actor,device,access,payload)
    case'b2b.timeline.read':return readTimeline(db,actor,device,access,payload)
    default:throw error('UNSUPPORTED_B2B_EXECUTION_COMMAND')
  }
}

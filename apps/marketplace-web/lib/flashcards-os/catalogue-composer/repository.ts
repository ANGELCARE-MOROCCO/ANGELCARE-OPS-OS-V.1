import 'server-only'
import { randomUUID } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import type { ActorContext } from '@/lib/flashcards-os/solutions/types'
import { composeCatalogueJourneys, composeCataloguePackages } from './adapter'
import { loadCatalogueComposerOptions } from './source'
import type {
  CatalogueCollectionCandidate,
  CatalogueCommercialCalculation,
  CatalogueCompositionResult,
  CatalogueCompositionScenario,
  CatalogueJourneyScenario,
  CataloguePackageScenario,
  CatalogueUniverse,
  JourneyComposerInput,
  PackageComposerInput,
} from './types'

const TENANT_KEY = 'angelcare-internal'
const VIEW_PREFIX = 'fc_os_'
type ServiceClient = Awaited<ReturnType<typeof createServiceClient>>
function table(client: ServiceClient, name: string) { return client.from(`${VIEW_PREFIX}${name}`) }
function clamp(value:number,min:number,max:number){return Math.min(Math.max(Math.trunc(value),min),max)}
function asStringArray(value:unknown){return Array.isArray(value)?value.map(String).filter(Boolean):[]}
function code(prefix:string){return `${prefix}-${new Date().toISOString().replace(/\D/g,'').slice(0,14)}-${randomUUID().slice(0,6).toUpperCase()}`}
function safeObject(value:unknown):Record<string,any>{return value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,any>: {}}
function moneyRound(value:number){return Math.round((value+Number.EPSILON)*100)/100}

async function audit(client:ServiceClient,actor:ActorContext,eventType:string,entityType:string,entityId:string,payload:Record<string,unknown>={}){
  await table(client,'audit_events').insert({tenant_key:TENANT_KEY,event_type:eventType,entity_type:entityType,entity_id:entityId,actor_id:actor.id,actor_name:actor.name,actor_role:actor.role,payload})
  await table(client,'outbox_events').insert({tenant_key:TENANT_KEY,event_type:eventType,aggregate_type:entityType,aggregate_id:entityId,payload:{...payload,actor:{id:actor.id,name:actor.name,role:actor.role}},status:'pending'})
}

function withinAge(item:CatalogueCollectionCandidate,ages:number[]){
  if(!ages.length)return true
  return ages.every((age)=>(item.ageMinMonths==null||age>=item.ageMinMonths)&&(item.ageMaxMonths==null||age<=item.ageMaxMonths))
}
function intersects(left:string[],right:string[]){return !right.length||left.some((item)=>right.includes(item))}
function normalizeInputIds(value:string[]){return [...new Set(value.map(String).filter(Boolean))]}

function filterCandidates(input:PackageComposerInput|JourneyComposerInput,all:CatalogueCollectionCandidate[]){
  const ages=input.learnerAgesMonths.map(Number).filter(Number.isFinite)
  const requiredCategories=new Set(input.requiredCategoryIds)
  const excludedCategories=new Set(input.excludedCategoryIds)
  const requiredCollections=new Set(input.requiredCollectionIds)
  const excludedCollections=new Set(input.excludedCollectionIds)
  const usageContexts='usageContexts' in input?input.usageContexts:input.usageContextKeys
  const candidates=all.filter((item)=>{
    if(item.status==='archived'||item.lifecycle==='archived'||item.commercialStatus==='inactive')return false
    if(item.priceDh==null||item.priceDh<=0)return false
    if(excludedCollections.has(item.id)||excludedCategories.has(item.categoryId))return false
    if(requiredCategories.size&&!requiredCategories.has(item.categoryId))return false
    if(!withinAge(item,ages))return false
    if(!intersects(item.languages,input.languages))return false
    if(input.deliveryMode!=='hybrid'&&!item.formats.includes(input.deliveryMode))return false
    if(usageContexts.length&&item.usageContexts.length&&!intersects(item.usageContexts,usageContexts))return false
    return true
  })
  const missingRequired=[...requiredCollections].filter((id)=>!candidates.some((item)=>item.id===id))
  if(missingRequired.length)throw new Error(`Required catalogue collections are not eligible: ${missingRequired.join(', ')}`)
  return candidates.sort((a,b)=>{
    const requiredDelta=Number(requiredCollections.has(b.id))-Number(requiredCollections.has(a.id))
    if(requiredDelta)return requiredDelta
    return b.readinessScore-a.readinessScore||a.name.localeCompare(b.name)
  })
}

function commercial(collectionIds:string[],collectionMap:Map<string,CatalogueCollectionCandidate>,quantity:number):CatalogueCommercialCalculation{
  const unique=[...new Set(collectionIds)]
  const lines=unique.map((id)=>{
    const item=collectionMap.get(id)
    if(!item||item.priceDh==null||item.priceDh<=0)throw new Error(`Collection ${id} has no authoritative catalogue price.`)
    return {collectionId:item.id,collectionCode:item.code,collectionName:item.name,versionId:item.versionId,versionLabel:item.versionLabel,quantity,unitPriceDh:item.priceDh,subtotalDh:moneyRound(item.priceDh*quantity),unitCostDh:item.unitCostDh,costSubtotalDh:item.unitCostDh==null?null:moneyRound(item.unitCostDh*quantity)}
  })
  const subtotalDh=moneyRound(lines.reduce((sum,line)=>sum+line.subtotalDh,0))
  const knownCosts=lines.filter((line)=>line.costSubtotalDh!=null)
  const totalKnownCostDh=moneyRound(knownCosts.reduce((sum,line)=>sum+(line.costSubtotalDh||0),0))
  const allCostsKnown=knownCosts.length===lines.length
  const grossMarginDh=allCostsKnown?moneyRound(subtotalDh-totalKnownCostDh):null
  const grossMarginPercent=grossMarginDh==null||subtotalDh<=0?null:moneyRound(grossMarginDh/subtotalDh*100)
  const warnings:string[]=[]
  if(!allCostsKnown)warnings.push('Certaines collections ne disposent pas encore d’un coût interne; la marge reste non certifiée.')
  return{currency:'Dh',lines,subtotalDh,taxPercent:0,taxDh:0,finalTotalDh:subtotalDh,totalKnownCostDh,grossMarginDh,grossMarginPercent,warnings,calculatedAt:new Date().toISOString()}
}

function validatePackageInput(raw:PackageComposerInput):PackageComposerInput{
  const input={...raw,
    title:String(raw.title||'').trim(),universe:raw.universe==='b2b'?'b2b':'b2c',customerSegment:String(raw.customerSegment||'').trim(),
    learnerAgesMonths:(raw.learnerAgesMonths||[]).map(Number).filter(Number.isFinite),learnerCount:clamp(Number(raw.learnerCount)||1,1,500),
    languages:normalizeInputIds(raw.languages||[]),usageContexts:normalizeInputIds(raw.usageContexts||[]),objectiveKeys:normalizeInputIds(raw.objectiveKeys||[]),painPointKeys:normalizeInputIds(raw.painPointKeys||[]),outcomeKeys:normalizeInputIds(raw.outcomeKeys||[]),
    requiredCategoryIds:normalizeInputIds(raw.requiredCategoryIds||[]),excludedCategoryIds:normalizeInputIds(raw.excludedCategoryIds||[]),requiredCollectionIds:normalizeInputIds(raw.requiredCollectionIds||[]),excludedCollectionIds:normalizeInputIds(raw.excludedCollectionIds||[]),
    minimumCollections:clamp(Number(raw.minimumCollections)||1,1,24),maximumCollections:clamp(Number(raw.maximumCollections)||4,1,24),budgetMaxDh:Math.max(0,Number(raw.budgetMaxDh)||0),quantity:clamp(Number(raw.quantity)||1,1,500),requestedProposalCount:clamp(Number(raw.requestedProposalCount)||3,1,10),variationPriorities:normalizeInputIds(raw.variationPriorities||[]),
    deliveryMode:['digital','hybrid'].includes(raw.deliveryMode)?raw.deliveryMode:'physical',
  } as PackageComposerInput
  if(!input.title)throw new Error('Package title is required.')
  if(!input.customerSegment)throw new Error('Customer profile is required.')
  if(input.minimumCollections>input.maximumCollections)throw new Error('Minimum collections cannot exceed maximum collections.')
  if(input.requiredCollectionIds.length>input.maximumCollections)throw new Error('Required collections exceed the configured maximum.')
  return input
}
function validateJourneyInput(raw:JourneyComposerInput):JourneyComposerInput{
  const input={...raw,title:String(raw.title||'').trim(),universe:raw.universe==='b2b'?'b2b':'b2c',learnerAgesMonths:(raw.learnerAgesMonths||[]).map(Number).filter(Number.isFinite),learnerCount:clamp(Number(raw.learnerCount)||1,1,500),languages:normalizeInputIds(raw.languages||[]),learnerProfileKeys:normalizeInputIds(raw.learnerProfileKeys||[]),usageContextKeys:normalizeInputIds(raw.usageContextKeys||[]),painPointKeys:normalizeInputIds(raw.painPointKeys||[]),objectiveKeys:normalizeInputIds(raw.objectiveKeys||[]),outcomeKeys:normalizeInputIds(raw.outcomeKeys||[]),durationDays:clamp(Number(raw.durationDays)||5,1,90),sessionsPerDay:clamp(Number(raw.sessionsPerDay)||1,1,5),minutesPerSession:clamp(Number(raw.minutesPerSession)||20,5,120),intensity:['light','intensive'].includes(raw.intensity)?raw.intensity:'medium',facilitatorType:String(raw.facilitatorType||'Parent'),deliveryMode:['digital','hybrid'].includes(raw.deliveryMode)?raw.deliveryMode:'physical',requiredCategoryIds:normalizeInputIds(raw.requiredCategoryIds||[]),excludedCategoryIds:normalizeInputIds(raw.excludedCategoryIds||[]),requiredCollectionIds:normalizeInputIds(raw.requiredCollectionIds||[]),excludedCollectionIds:normalizeInputIds(raw.excludedCollectionIds||[]),maximumCollections:clamp(Number(raw.maximumCollections)||4,1,24),budgetMaxDh:Math.max(0,Number(raw.budgetMaxDh)||0),quantity:clamp(Number(raw.quantity)||1,1,500),requestedProposalCount:clamp(Number(raw.requestedProposalCount)||3,1,10)} as JourneyComposerInput
  if(!input.title)throw new Error('Learning plan title is required.')
  if(!input.learnerProfileKeys.length||!input.usageContextKeys.length||!input.painPointKeys.length||!input.objectiveKeys.length||!input.outcomeKeys.length)throw new Error('All five planning dimensions are mandatory: learner profile, context, pain point, objective and desired outcome.')
  if(input.requiredCollectionIds.length>input.maximumCollections)throw new Error('Required collections exceed the configured maximum.')
  return input
}

function validatePackageOutput(raw:any,input:PackageComposerInput,candidates:CatalogueCollectionCandidate[],modelUsed:string,requestId:string):CataloguePackageScenario[]{
  const allowed=new Set(candidates.map((item)=>item.id));const map=new Map(candidates.map((item)=>[item.id,item]));const seen=new Set<string>()
  const scenarios=(Array.isArray(raw?.scenarios)?raw.scenarios:[]).slice(0,input.requestedProposalCount).map((scenario:any,index:number)=>{
    const collectionIds=normalizeInputIds(asStringArray(scenario.collectionIds)).filter((id)=>allowed.has(id)).slice(0,input.maximumCollections)
    for(const id of input.requiredCollectionIds)if(!collectionIds.includes(id))collectionIds.unshift(id)
    const bounded=normalizeInputIds(collectionIds).slice(0,input.maximumCollections)
    if(bounded.length<input.minimumCollections)throw new Error(`Scenario ${index+1} contains fewer than ${input.minimumCollections} eligible catalogue collections.`)
    const signature=[...bounded].sort().join('|');if(seen.has(signature))throw new Error('OpenRouter returned duplicate package compositions; no fake diversity was accepted.');seen.add(signature)
    const rationaleMap=new Map<string,any>((Array.isArray(scenario.collectionRationales)?scenario.collectionRationales:[]).map((item:any)=>[String(item.collectionId),item]))
    const calculation=commercial(bounded,map,input.quantity)
    if(input.budgetMaxDh>0&&calculation.finalTotalDh>input.budgetMaxDh)calculation.warnings.push(`Total ${calculation.finalTotalDh} Dh supérieur au budget cible ${input.budgetMaxDh} Dh.`)
    return{id:randomUUID(),mode:'package',requestId,name:String(scenario.name||`Package ${index+1}`),positioning:String(scenario.positioning||''),customerPromise:String(scenario.customerPromise||''),targetCustomer:String(scenario.targetCustomer||input.customerSegment),collectionIds:bounded,collectionRationales:bounded.map((id,order)=>({collectionId:id,rationale:String(rationaleMap.get(id)?.rationale||`Collection ${map.get(id)?.name||id} sélectionnée selon les contraintes locales.`),usageOrder:Number(rationaleMap.get(id)?.usageOrder)||order+1})),coverageGaps:asStringArray(scenario.coverageGaps),risks:asStringArray(scenario.risks),upsellCollectionIds:normalizeInputIds(asStringArray(scenario.upsellCollectionIds)).filter((id)=>allowed.has(id)&&!bounded.includes(id)).slice(0,3),upgradePath:String(scenario.upgradePath||''),salesArgument:String(scenario.salesArgument||''),confidenceScore:Math.min(100,Math.max(0,Number(scenario.confidenceScore)||0)),commercial:calculation,modelUsed,publishedSellableId:null} satisfies CataloguePackageScenario
  })
  if(!scenarios.length)throw new Error('OpenRouter returned no valid catalogue package proposal.')
  return scenarios
}

function validateJourneyOutput(raw:any,input:JourneyComposerInput,candidates:CatalogueCollectionCandidate[],modelUsed:string,requestId:string):CatalogueJourneyScenario[]{
  const allowed=new Set(candidates.map((item)=>item.id));const map=new Map(candidates.map((item)=>[item.id,item]));const seen=new Set<string>()
  const plans=(Array.isArray(raw?.plans)?raw.plans:[]).slice(0,input.requestedProposalCount).map((plan:any,index:number)=>{
    const requestedIds=normalizeInputIds(asStringArray(plan.collectionIds)).filter((id)=>allowed.has(id))
    for(const id of input.requiredCollectionIds)if(!requestedIds.includes(id))requestedIds.unshift(id)
    const collectionIds=requestedIds.slice(0,input.maximumCollections)
    if(!collectionIds.length)throw new Error(`Learning plan ${index+1} has no valid registered collection.`)
    const signature=[...collectionIds].sort().join('|')+'::'+String(plan.thesis||'');if(seen.has(signature))throw new Error('OpenRouter returned duplicate learning plans; no fake diversity was accepted.');seen.add(signature)
    const rawDays=Array.isArray(plan.days)?plan.days:[]
    if(rawDays.length!==input.durationDays)throw new Error(`Learning plan ${index+1} returned ${rawDays.length} days instead of ${input.durationDays}.`)
    const days=rawDays.map((day:any,dayIndex:number)=>{
      const rawSessions=Array.isArray(day.sessions)?day.sessions:[]
      if(rawSessions.length!==input.sessionsPerDay)throw new Error(`Day ${dayIndex+1} must contain exactly ${input.sessionsPerDay} session(s).`)
      return{dayNumber:dayIndex+1,title:String(day.title||`Jour ${dayIndex+1}`),objectiveKeys:asStringArray(day.objectiveKeys),parentOrTeacherContinuation:String(day.parentOrTeacherContinuation||''),sessions:rawSessions.map((session:any,sessionIndex:number)=>{
        const activities=(Array.isArray(session.activities)?session.activities:[]).map((activity:any,activityIndex:number)=>{
          const collectionId=String(activity.collectionId||'')
          if(!allowed.has(collectionId)||!collectionIds.includes(collectionId))throw new Error(`Day ${dayIndex+1}, session ${sessionIndex+1}: invented or unselected collection ${collectionId}.`)
          return{order:activityIndex+1,title:String(activity.title||''),instruction:String(activity.instruction||''),durationMinutes:Math.max(1,Number(activity.durationMinutes)||1),collectionId,cardReference:String(activity.cardReference||'Collection complète / sélection opérateur'),objectiveKeys:asStringArray(activity.objectiveKeys),expectedObservation:String(activity.expectedObservation||'')}
        })
        const activityMinutes=activities.reduce((sum:number,item:{durationMinutes:number})=>sum+item.durationMinutes,0)
        if(activityMinutes!==input.minutesPerSession)throw new Error(`Day ${dayIndex+1}, session ${sessionIndex+1}: activity duration ${activityMinutes} minutes does not equal ${input.minutesPerSession}.`)
        return{sessionNumber:sessionIndex+1,title:String(session.title||`Session ${sessionIndex+1}`),durationMinutes:input.minutesPerSession,objectiveKeys:asStringArray(session.objectiveKeys),activities,facilitatorInstruction:String(session.facilitatorInstruction||''),successIndicator:String(session.successIndicator||'')}
      })}
    })
    const calculation=commercial(collectionIds,map,input.quantity)
    if(input.budgetMaxDh>0&&calculation.finalTotalDh>input.budgetMaxDh)calculation.warnings.push(`Total ${calculation.finalTotalDh} Dh supérieur au budget cible ${input.budgetMaxDh} Dh.`)
    return{id:randomUUID(),mode:'journey',requestId,name:String(plan.name||`Programme ${index+1}`),thesis:String(plan.thesis||''),targetLearner:String(plan.targetLearner||''),expectedOutcome:String(plan.expectedOutcome||''),collectionIds,days,baseline:String(plan.baseline||''),midpointReview:String(plan.midpointReview||''),finalAssessment:String(plan.finalAssessment||''),adaptations:asStringArray(plan.adaptations),risks:asStringArray(plan.risks),commercial:calculation,modelUsed,publishedSellableId:null} satisfies CatalogueJourneyScenario
  })
  if(!plans.length)throw new Error('OpenRouter returned no valid catalogue learning plan.')
  return plans
}

export async function createCataloguePackageComposition(raw:PackageComposerInput,actor:ActorContext){
  const input=validatePackageInput(raw);const options=await loadCatalogueComposerOptions(input.universe);if(options.sourceMode!=='database')throw new Error('Le registre local en base est indisponible. Aucune composition ne sera générée depuis une source de secours.');const candidates=filterCandidates(input,options.collections)
  if(candidates.length<input.minimumCollections)throw new Error('The local catalogue does not contain enough eligible priced collections for this request.')
  const client=await createServiceClient();const requestId=randomUUID();const requestCode=code('CAT-PKG')
  const {error:requestError}=await table(client,'solution_requests').insert({id:requestId,tenant_key:TENANT_KEY,code:requestCode,title:input.title,universe:input.universe,status:'generating',customer_segment:input.customerSegment,learner_count:input.learnerCount,profile_snapshot:{customerSegment:input.customerSegment,learnerAgesMonths:input.learnerAgesMonths,learnerCount:input.learnerCount,languages:input.languages,compositionSource:'local_catalogue'},constraints_snapshot:{...input,compositionSource:'local_catalogue',eligibleCollectionIds:candidates.map((item)=>item.id)},requested_scenario_count:input.requestedProposalCount,priorities:input.variationPriorities,scenario_roles:[],composition_source:'catalogue',catalogue_collection_ids:candidates.map((item)=>item.id),created_by:actor.id})
  if(requestError)throw requestError
  try{
    const generated=await composeCataloguePackages(input,candidates)
    const scenarios=validatePackageOutput(generated.data,input,candidates,generated.usage.modelUsed,requestId);const runId=randomUUID()
    await table(client,'solution_generation_runs').insert({id:runId,tenant_key:TENANT_KEY,request_id:requestId,requested_count:input.requestedProposalCount,generated_count:scenarios.length,status:'succeeded',model_requested:generated.usage.modelRequested,model_used:generated.usage.modelUsed,fallback_used:false,prompt_tokens:generated.usage.promptTokens,completion_tokens:generated.usage.completionTokens,total_tokens:generated.usage.totalTokens,cost_usd:generated.usage.costUsd,latency_ms:generated.usage.latencyMs})
    const collectionMap=new Map(candidates.map((item)=>[item.id,item]))
    for(let index=0;index<scenarios.length;index++){
      const scenario=scenarios[index]
      await table(client,'solution_scenarios').insert({id:scenario.id,tenant_key:TENANT_KEY,code:code('CAT-SCN'),request_id:requestId,version_no:1,role:index===0?'balanced':'catalogue_variant',status:'generated',name:scenario.name,positioning:scenario.positioning,coverage_score:scenario.confidenceScore,suitability_score:scenario.confidenceScore,diversity_score:100,confidence_score:scenario.confidenceScore,commercial_calculation:scenario.commercial,snapshot:scenario,generation_run_id:runId,composition_source:'catalogue',collection_ids:scenario.collectionIds,collection_version_ids:scenario.collectionIds.map((id)=>collectionMap.get(id)?.versionId).filter(Boolean),created_by:actor.id})
      const rows=scenario.collectionRationales.map((item,sortOrder)=>{const collection=collectionMap.get(item.collectionId)!;return{tenant_key:TENANT_KEY,scenario_id:scenario.id,collection_id:collection.id,collection_version_id:collection.versionId,collection_version_label:collection.versionLabel,quantity:input.quantity,format:input.deliveryMode,rationale:item.rationale,usage_order:item.usageOrder,sort_order:sortOrder+1}})
      if(rows.length)await table(client,'catalogue_solution_items').insert(rows)
    }
    await table(client,'solution_requests').update({status:'generated',generated_scenario_ids:scenarios.map((item)=>item.id),updated_at:new Date().toISOString()}).eq('id',requestId)
    await audit(client,actor,'catalogue.package_generated','solution_request',requestId,{scenarioCount:scenarios.length,source:'local_catalogue_only'})
    return{requestId,requestCode,scenarioCount:scenarios.length}
  }catch(error){await table(client,'solution_requests').update({status:'validation_required',updated_at:new Date().toISOString()}).eq('id',requestId);throw error}
}

export async function createCatalogueJourneyComposition(raw:JourneyComposerInput,actor:ActorContext){
  const input=validateJourneyInput(raw);const options=await loadCatalogueComposerOptions(input.universe);if(options.sourceMode!=='database')throw new Error('Le registre local en base est indisponible. Aucune composition ne sera générée depuis une source de secours.');const candidates=filterCandidates(input,options.collections)
  if(!candidates.length)throw new Error('The local catalogue contains no eligible priced collection for this learning plan.')
  const client=await createServiceClient();const requestId=randomUUID();const requestCode=code('CAT-JRN')
  const {error:requestError}=await table(client,'journey_requests').insert({id:requestId,tenant_key:TENANT_KEY,code:requestCode,title:input.title,universe:input.universe,status:'generating',learner_profile_keys:input.learnerProfileKeys,usage_context_keys:input.usageContextKeys,pain_point_keys:input.painPointKeys,capability_objective_keys:input.objectiveKeys,desired_outcome_keys:input.outcomeKeys,primary_objective_key:input.objectiveKeys[0],secondary_objective_keys:input.objectiveKeys.slice(1),duration_days:input.durationDays,sessions_per_day:input.sessionsPerDay,minutes_per_session:input.minutesPerSession,intensity:input.intensity,individual_or_group:input.learnerCount>1?'group':'individual',facilitator_type:input.facilitatorType,parent_involvement:'configured',teacher_involvement:'configured',delivery_mode:input.deliveryMode,available_release_ids:[],required_release_ids:[],excluded_release_ids:[],maximum_collections:input.maximumCollections,budget_max_dh:input.budgetMaxDh,repetition_rhythm:'AI-composed from local catalogue',assessment_rhythm:'baseline, midpoint, final',adaptation_keys:[],requested_plan_count:input.requestedProposalCount,composition_source:'catalogue',available_collection_ids:candidates.map((item)=>item.id),required_collection_ids:input.requiredCollectionIds,excluded_collection_ids:input.excludedCollectionIds,created_by:actor.id})
  if(requestError)throw requestError
  try{
    const generated=await composeCatalogueJourneys(input,candidates)
    const scenarios=validateJourneyOutput(generated.data,input,candidates,generated.usage.modelUsed,requestId);const runId=randomUUID();const collectionMap=new Map(candidates.map((item)=>[item.id,item]))
    await table(client,'journey_generation_runs').insert({id:runId,tenant_key:TENANT_KEY,request_id:requestId,requested_count:input.requestedProposalCount,generated_count:scenarios.length,status:'succeeded',model_requested:generated.usage.modelRequested,model_used:generated.usage.modelUsed,fallback_used:false,prompt_tokens:generated.usage.promptTokens,completion_tokens:generated.usage.completionTokens,total_tokens:generated.usage.totalTokens,cost_usd:generated.usage.costUsd,latency_ms:generated.usage.latencyMs})
    for(const scenario of scenarios){
      await table(client,'journey_scenarios').insert({id:scenario.id,tenant_key:TENANT_KEY,code:code('CAT-PLAN'),request_id:requestId,version_no:1,status:'human_review',name:scenario.name,commercial_calculation:scenario.commercial,snapshot:scenario,generation_run_id:runId,composition_source:'catalogue',collection_ids:scenario.collectionIds,collection_version_ids:scenario.collectionIds.map((id)=>collectionMap.get(id)?.versionId).filter(Boolean),created_by:actor.id})
      const linkRows=scenario.collectionIds.map((id,sortOrder)=>{const collection=collectionMap.get(id)!;return{tenant_key:TENANT_KEY,scenario_id:scenario.id,collection_id:id,collection_version_id:collection.versionId,collection_version_label:collection.versionLabel,sort_order:sortOrder+1}})
      if(linkRows.length)await table(client,'catalogue_journey_items').insert(linkRows)
      const activityRows=scenario.days.flatMap((day)=>day.sessions.flatMap((session)=>session.activities.map((activity)=>{const collection=collectionMap.get(activity.collectionId)!;return{tenant_key:TENANT_KEY,scenario_id:scenario.id,day_number:day.dayNumber,session_number:session.sessionNumber,activity_order:activity.order,collection_id:activity.collectionId,collection_version_id:collection.versionId,collection_version_label:collection.versionLabel,card_reference:activity.cardReference}})))
      if(activityRows.length)await table(client,'catalogue_journey_activity_links').insert(activityRows)
    }
    await table(client,'journey_requests').update({status:'human_review',updated_at:new Date().toISOString()}).eq('id',requestId)
    await audit(client,actor,'catalogue.journeys_generated','journey_request',requestId,{scenarioCount:scenarios.length,source:'local_catalogue_only'})
    return{requestId,requestCode,scenarioCount:scenarios.length}
  }catch(error){await table(client,'journey_requests').update({status:'validation_required',updated_at:new Date().toISOString()}).eq('id',requestId);throw error}
}

export async function loadCatalogueCompositionResult(requestId:string):Promise<CatalogueCompositionResult|null>{
  const client=await createServiceClient();
  const {data:packageRequest}=await table(client,'solution_requests').select('*').eq('id',requestId).maybeSingle()
  if(packageRequest&&packageRequest.composition_source==='catalogue'){
    const options=await loadCatalogueComposerOptions(packageRequest.universe)
    const {data:rows,error}=await table(client,'solution_scenarios').select('*').eq('request_id',requestId).eq('composition_source','catalogue').order('created_at')
    if(error)throw error
    const scenarios=(rows||[]).map((row:any)=>({...safeObject(row.snapshot),id:String(row.id),requestId:String(row.request_id),mode:'package',commercial:safeObject(row.commercial_calculation)}) as CataloguePackageScenario)
    return{mode:'package',requestId,requestCode:String(packageRequest.code),title:String(packageRequest.title),universe:packageRequest.universe,sourceMode:options.sourceMode,sourceDoctrine:'local_catalogue_only',scenarios,collections:options.collections}
  }
  const {data:journeyRequest}=await table(client,'journey_requests').select('*').eq('id',requestId).maybeSingle()
  if(journeyRequest&&journeyRequest.composition_source==='catalogue'){
    const journeyOptions=await loadCatalogueComposerOptions(journeyRequest.universe)
    const {data:rows,error}=await table(client,'journey_scenarios').select('*').eq('request_id',requestId).eq('composition_source','catalogue').order('created_at')
    if(error)throw error
    const scenarios=(rows||[]).map((row:any)=>({...safeObject(row.snapshot),id:String(row.id),requestId:String(row.request_id),mode:'journey',commercial:safeObject(row.commercial_calculation)}) as CatalogueJourneyScenario)
    return{mode:'journey',requestId,requestCode:String(journeyRequest.code),title:String(journeyRequest.title),universe:journeyRequest.universe,sourceMode:journeyOptions.sourceMode,sourceDoctrine:'local_catalogue_only',scenarios,collections:journeyOptions.collections}
  }
  return null
}

async function existingSellableForScenario(client:ServiceClient,tableName:'b2c_sellables'|'b2b_sellables',scenario:CatalogueCompositionScenario){
  const query=scenario.mode==='package'?table(client,tableName).select('id').eq('scenario_id',scenario.id):table(client,tableName).select('id').eq('journey_scenario_id',scenario.id)
  const {data}=await query.maybeSingle();return data?.id?String(data.id):null
}

export async function publishCatalogueScenarios(requestId:string,scenarioIds:string[],universe:CatalogueUniverse,actor:ActorContext){
  const result=await loadCatalogueCompositionResult(requestId);if(!result)throw new Error('Catalogue composition request not found.')
  if(result.universe!==universe)throw new Error('Vitrine universe does not match the composition request.')
  const selected=result.scenarios.filter((item)=>scenarioIds.includes(item.id));if(!selected.length)throw new Error('Select at least one proposal to publish.')
  const client=await createServiceClient();const tableName=universe==='b2b'?'b2b_sellables':'b2c_sellables';const collectionMap=new Map(result.collections.map((item)=>[item.id,item]));const published=[] as Array<{scenarioId:string;sellableId:string;code:string}>
  for(const scenario of selected){
    const existing=await existingSellableForScenario(client,tableName,scenario);if(existing){published.push({scenarioId:scenario.id,sellableId:existing,code:'EXISTING'});continue}
    const collectionVersionIds=scenario.collectionIds.map((id)=>collectionMap.get(id)?.versionId).filter((id):id is string=>Boolean(id))
    const collectionNames=Object.fromEntries(scenario.collectionIds.map((id)=>[id,collectionMap.get(id)?.name||id]))
    const collectionVersionLabels=Object.fromEntries(scenario.collectionIds.map((id)=>[id,collectionMap.get(id)?.versionLabel||'Current catalogue version']))
    const catalogueSnapshot={...scenario,collectionIds:scenario.collectionIds,collectionVersionIds,collectionNames,collectionVersionLabels,releaseIds:[],deliveryMode:'physical' as const,sourceDoctrine:'local_catalogue_only' as const}
    let readyPlanId:string|null=null
    if(scenario.mode==='journey'){
      readyPlanId=randomUUID();const totalSessions=scenario.days.reduce((sum,day)=>sum+day.sessions.length,0);const totalMinutes=scenario.days.flatMap((day)=>day.sessions).reduce((sum,session)=>sum+session.durationMinutes,0)
      const planSnapshot={...catalogueSnapshot,targetLearner:scenario.targetLearner}
      await table(client,'ready_learning_plans').insert({id:readyPlanId,tenant_key:TENANT_KEY,code:code(universe==='b2b'?'CAT-PLAN-B2B':'CAT-PLAN-B2C'),universe,version_no:1,status:'published',name:scenario.name,scenario_id:scenario.id,learner_profile:scenario.targetLearner,objectives:[],release_ids:[],collection_ids:scenario.collectionIds,collection_version_ids:collectionVersionIds,catalogue_snapshot:planSnapshot,duration_days:scenario.days.length,total_sessions:totalSessions,total_minutes:totalMinutes,price_dh:scenario.commercial.finalTotalDh,gross_margin_percent:scenario.commercial.grossMarginPercent||0,created_by:actor.id,approved_by:actor.id,approved_at:new Date().toISOString(),approval_note:'Human publication from local catalogue composition theatre.',published_at:new Date().toISOString()})
      await table(client,'ready_learning_plan_versions').insert({tenant_key:TENANT_KEY,plan_id:readyPlanId,version_no:1,snapshot:planSnapshot,commercial_calculation:scenario.commercial,change_note:'Initial catalogue-backed ready plan.',created_by:actor.id})
    }
    const sellableId=randomUUID();const sellableCode=code(universe==='b2b'?'CAT-B2B':'CAT-B2C');const promise=scenario.mode==='package'?scenario.customerPromise:scenario.expectedOutcome;const target=scenario.mode==='package'?scenario.targetCustomer:scenario.targetLearner
    const sellableSnapshot={...catalogueSnapshot,targetSegment:target,learnerProfile:target}
    const row={id:sellableId,tenant_key:TENANT_KEY,code:sellableCode,scenario_id:scenario.mode==='package'?scenario.id:null,journey_scenario_id:scenario.mode==='journey'?scenario.id:null,version_no:1,status:'published',name:scenario.name,promise,target_segment:target,ready_plan_id:readyPlanId,release_ids:[],collection_ids:scenario.collectionIds,collection_version_ids:collectionVersionIds,price_dh:scenario.commercial.finalTotalDh,gross_margin_percent:scenario.commercial.grossMarginPercent||0,minimum_order:1,snapshot:sellableSnapshot,created_by:actor.id,approved_by:actor.id,approved_at:new Date().toISOString(),approval_note:'Human-selected local catalogue composition.',published_at:new Date().toISOString(),effective_from:new Date().toISOString().slice(0,10)}
    const {error}=await table(client,tableName).insert(row);if(error)throw error
    await table(client,universe==='b2b'?'b2b_sellable_versions':'b2c_sellable_versions').insert({tenant_key:TENANT_KEY,sellable_id:sellableId,version_no:1,snapshot:sellableSnapshot,commercial_calculation:scenario.commercial,change_note:'Initial local-catalogue sellable version.',created_by:actor.id})
    await table(client,'sellable_approvals').insert({tenant_key:TENANT_KEY,universe,sellable_id:sellableId,stage:'commercial',decision:'approved',approver_id:actor.id,approver_name:actor.name,approver_role:actor.role,note:'Human-selected local catalogue composition.'})
    await table(client,'sellable_publication_events').insert({tenant_key:TENANT_KEY,universe,sellable_id:sellableId,event_type:'published',actor_id:actor.id,actor_name:actor.name,detail:'Published directly from the catalogue composition theatre.'})
    const itemRows=scenario.collectionIds.map((id,sortOrder)=>{const item=collectionMap.get(id)!;const priceLine=scenario.commercial.lines.find((line)=>line.collectionId===id);return{tenant_key:TENANT_KEY,b2c_sellable_id:universe==='b2c'?sellableId:null,b2b_sellable_id:universe==='b2b'?sellableId:null,collection_id:id,collection_version_id:item.versionId,collection_version_label:item.versionLabel,quantity:priceLine?.quantity||1,sort_order:sortOrder+1}})
    if(itemRows.length)await table(client,'catalogue_sellable_items').insert(itemRows)
    if(scenario.mode==='package'){
      await table(client,'solution_scenarios').update({status:'selected',updated_at:new Date().toISOString()}).eq('id',scenario.id)
      await table(client,'solution_scenario_decisions').insert({tenant_key:TENANT_KEY,scenario_id:scenario.id,decision:'selected',note:'Human-selected and published directly from the local catalogue composition theatre.',actor_id:actor.id,actor_name:actor.name,actor_role:actor.role})
    }else{
      await table(client,'journey_scenarios').update({status:'approved',updated_at:new Date().toISOString()}).eq('id',scenario.id)
      await table(client,'journey_approvals').insert({tenant_key:TENANT_KEY,scenario_id:scenario.id,stage:'catalogue_publication',decision:'approved',approver_id:actor.id,approver_name:actor.name,approver_role:actor.role,note:'Human-selected and published directly from the local catalogue composition theatre.'})
    }
    await audit(client,actor,'catalogue.sellable_published',universe==='b2b'?'b2b_sellable':'b2c_sellable',sellableId,{scenarioId:scenario.id,mode:scenario.mode,collectionIds:scenario.collectionIds})
    published.push({scenarioId:scenario.id,sellableId,code:sellableCode})
  }
  if(result.mode==='package')await table(client,'solution_requests').update({status:'selected',updated_at:new Date().toISOString()}).eq('id',requestId)
  else await table(client,'journey_requests').update({status:'approved',updated_at:new Date().toISOString()}).eq('id',requestId)
  return{published}
}

export function actorFromUser(user:any):ActorContext{return{id:String(user?.id||user?.email||'unknown'),name:String(user?.full_name||user?.name||user?.email||'Utilisateur ANGELCARE'),role:String(user?.role||user?.role_key||'operator')}}

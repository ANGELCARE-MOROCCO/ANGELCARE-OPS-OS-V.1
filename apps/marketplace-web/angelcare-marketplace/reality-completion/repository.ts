import {createServiceClient} from '@/lib/supabase/server'
import type {MarketplaceRequestContext} from '../domain/types'
import {writeMarketplaceAudit} from '../audit/write-audit'
import {MarketplaceError} from '../server/errors'
import {getFinalMz2Workspace} from '../final-vertical/registry'
import {loadFinalWorkspaceData} from '../final-vertical/repository'
import {REALITY_DOMAIN_CONTRACTS,assertRealityTransition} from './domain-contract'
import type {RealityCommandInput,RealityCreateInput,RealityDomain,RealityEvent,RealityRecord,RealityWorkspaceData} from './types'

const now=()=>new Date().toISOString()
const text=(v:unknown)=>typeof v==='string'?v.trim():''
const optional=(v:unknown)=>{const x=text(v);return x||null}
const numeric=(v:unknown)=>{if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isFinite(n)?n:null}
const object=(v:unknown):Record<string,unknown>=>{if(v&&typeof v==='object'&&!Array.isArray(v))return v as Record<string,unknown>;if(typeof v==='string'&&v.trim()){try{const parsed=JSON.parse(v);return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed as Record<string,unknown>:{} }catch{return {note:v.trim()}}}return {}}
const fail=(action:string,error:unknown):never=>{throw new MarketplaceError('INTERNAL_ERROR',`Impossible de ${action}.`,{cause:error,retryable:true})}

function createPayload(domain:RealityDomain,input:RealityCreateInput,context:MarketplaceRequestContext){
  const v=input.values
  const common={workspace_key:input.workspaceKey,territory_id:context.territoryId,tenant_id:context.tenantId,source_id:input.sourceId||null,title:input.title,owner_id:context.actor.id,created_by:context.actor.id,updated_by:context.actor.id}
  switch(domain){
    case 'growth': return {...common,hypothesis:text(v.hypothesis),objective:text(v.objective),audience_key:optional(v.audienceKey),channel:optional(v.channel),metric_key:text(v.metricKey),baseline_value:numeric(v.baselineValue),target_value:numeric(v.targetValue),budget_dh:numeric(v.budgetDh)||0,evidence:object(v.evidence)}
    case 'qa': return {...common,defect_type:text(v.defectType)||'workflow',route_key:optional(v.routeKey),environment:text(v.environment)||'production',severity:text(v.severity)||'medium',reproduction_steps:text(v.reproductionSteps),expected_result:text(v.expectedResult),observed_result:text(v.observedResult),evidence:object(v.evidence)}
    case 'intelligence': return {...common,signal_type:text(v.signalType)||'observation',source_name:text(v.sourceName),source_reference:optional(v.sourceReference),observation:text(v.observation),freshness_status:text(v.freshnessStatus)||'current',confidence:numeric(v.confidence)||0,materiality:numeric(v.materiality)||0,evidence:object(v.evidence)}
    case 'platform_performance': return {...common,surface:text(v.surface),dependency:optional(v.dependency),metric_key:text(v.metricKey),observed_value:numeric(v.observedValue),threshold_value:numeric(v.thresholdValue),unit:optional(v.unit),severity:text(v.severity)||'medium',customer_impact:text(v.customerImpact),evidence:object(v.evidence)}
    case 'security': return {...common,asset:text(v.asset),attack_vector:optional(v.attackVector),data_exposure:optional(v.dataExposure),severity:text(v.severity)||'medium',evidence:object(v.evidence)}
    case 'trust': return {...common,allegation:text(v.allegation),subject_reference:optional(v.subjectReference),severity:text(v.severity)||'medium',investigator_id:context.actor.id,evidence:object(v.evidence)}
    case 'launch': return {...common,version_label:text(v.versionLabel),scope_summary:text(v.scopeSummary),dependency_summary:optional(v.dependencySummary),migration_summary:optional(v.migrationSummary),known_risks:optional(v.knownRisks),rollback_plan:text(v.rollbackPlan),evidence:object(v.evidence)}
  }
}

function commandPatch(domain:RealityDomain,current:RealityRecord,input:RealityCommandInput){
  const v=input.values
  const action=input.action
  let nextStatus:string|null=null
  let patch:Record<string,unknown>={}
  switch(domain){
    case 'growth': {
      const statuses:Record<string,string>={plan:'plan',request_approval:'approval',activate:'activation',monitor:'monitoring',analyze:'analysis',decide:'decision',scale:'scale',stop:'stop',close:'closed'}
      nextStatus=statuses[action]||null
      if(action==='update_details')patch={hypothesis:text(v.hypothesis),objective:text(v.objective),audience_key:optional(v.audienceKey),channel:optional(v.channel),metric_key:text(v.metricKey),baseline_value:numeric(v.baselineValue),target_value:numeric(v.targetValue),budget_dh:numeric(v.budgetDh)||0,next_action:optional(v.nextAction)}
      if(action==='monitor'||action==='analyze')patch={actual_value:numeric(v.actualValue),incremental_revenue_dh:numeric(v.incrementalRevenueDh)||0,evidence:object(v.evidence)}
      if(['decide','scale','stop','close'].includes(action))patch={decision:text(v.decision)||input.reason,next_action:optional(v.nextAction),evidence:object(v.evidence)}
      break
    }
    case 'qa': {
      const statuses:Record<string,string>={reproduce:'reproduced',triage:'triaged',own:'owned',correct:'corrective_action',retest:'retest',verify:'verified',close:'closed'}
      nextStatus=statuses[action]||null
      if(action==='reproduce')patch={reproduction_steps:text(v.reproductionSteps),expected_result:text(v.expectedResult),observed_result:text(v.observedResult),evidence:object(v.evidence)}
      if(action==='triage'||action==='own')patch={severity:text(v.severity)||current.severity||'medium',due_at:optional(v.dueAt)}
      if(action==='correct')patch={root_cause:text(v.rootCause),corrective_action:text(v.correctiveAction),regression_scope:optional(v.regressionScope)}
      if(action==='retest')patch={retest_result:text(v.retestResult),evidence:object(v.evidence)}
      if(action==='verify'||action==='close')patch={retest_result:text(v.retestResult)||text(current.retest_result),evidence:object(v.evidence)}
      break
    }
    case 'intelligence': {
      const statuses:Record<string,string>={validate:'validated',classify:'classified',analyze:'analysis',recommend:'recommendation',decide:'decision',act:'action',outcome:'outcome',close:'closed'}
      nextStatus=statuses[action]||null
      if(action==='validate'||action==='classify')patch={confidence:numeric(v.confidence)??current.confidence,materiality:numeric(v.materiality)??current.materiality,freshness_status:text(v.freshnessStatus)||current.freshness_status}
      if(action==='analyze')patch={analysis:text(v.analysis),evidence:object(v.evidence)}
      if(action==='recommend')patch={recommendation:text(v.recommendation)}
      if(action==='decide')patch={executive_decision:text(v.executiveDecision)}
      if(action==='act')patch={action_plan:text(v.actionPlan),due_at:optional(v.dueAt)}
      if(action==='outcome'||action==='close')patch={outcome:text(v.outcome),evidence:object(v.evidence)}
      break
    }
    case 'platform_performance': {
      const statuses:Record<string,string>={confirm:'confirmed',own:'owned',mitigate:'mitigation',recover:'recovery',verify:'verification',postmortem:'postmortem',close:'closed'}
      nextStatus=statuses[action]||null
      if(action==='confirm'||action==='own')patch={severity:text(v.severity)||current.severity||'medium',customer_impact:text(v.customerImpact)||text(current.customer_impact)}
      if(action==='mitigate')patch={mitigation:text(v.mitigation),evidence:object(v.evidence)}
      if(action==='recover')patch={recovered_at:now(),evidence:object(v.evidence)}
      if(action==='verify'||action==='postmortem'||action==='close')patch={root_cause:text(v.rootCause)||text(current.root_cause),prevention:text(v.prevention)||text(current.prevention),evidence:object(v.evidence)}
      break
    }
    case 'security': {
      const statuses:Record<string,string>={triage:'triaged',contain:'containment',investigate:'investigation',remediate:'remediation',recover:'recovery',postmortem:'postmortem',close:'closed'}
      nextStatus=statuses[action]||null
      if(action==='triage')patch={severity:text(v.severity)||current.severity||'medium',data_exposure:optional(v.dataExposure),due_at:optional(v.dueAt)}
      if(action==='contain')patch={containment:text(v.containment),evidence:object(v.evidence)}
      if(action==='investigate')patch={investigation_findings:text(v.investigationFindings),attack_vector:optional(v.attackVector),data_exposure:optional(v.dataExposure),evidence:object(v.evidence)}
      if(action==='remediate')patch={remediation:text(v.remediation)}
      if(action==='recover')patch={recovery_test:text(v.recoveryTest),evidence:object(v.evidence)}
      if(action==='postmortem'||action==='close')patch={postmortem:text(v.postmortem),evidence:object(v.evidence)}
      break
    }
    case 'trust': {
      const statuses:Record<string,string>={triage:'triage',own:'owned',investigate:'investigation',decide:'decision',remediate:'remediation',resolve_customer:'customer_resolution',verify:'verified',close:'closed'}
      nextStatus=statuses[action]||null
      if(action==='triage'||action==='own')patch={severity:text(v.severity)||current.severity||'medium',due_at:optional(v.dueAt)}
      if(action==='investigate')patch={findings:text(v.findings),evidence:object(v.evidence)}
      if(action==='decide')patch={decision:text(v.decision)}
      if(action==='remediate')patch={remediation:text(v.remediation)}
      if(action==='resolve_customer')patch={customer_resolution:text(v.customerResolution)}
      if(action==='verify'||action==='close')patch={verification:text(v.verification),evidence:object(v.evidence)}
      break
    }
    case 'launch': {
      const statuses:Record<string,string>={prepare:'preparation',technical_ready:'technical_ready',business_ready:'business_ready',approve:'approved',schedule:'scheduled',deploy:'deployed',verify:'verifying',accept:'accepted',block:'blocked',rollback:'rolled_back',recover:'recovery',close:'closed'}
      nextStatus=statuses[action]||null
      if(action==='prepare')patch={scope_summary:text(v.scopeSummary)||text(current.scope_summary),dependency_summary:optional(v.dependencySummary),migration_summary:optional(v.migrationSummary),known_risks:optional(v.knownRisks),rollback_plan:text(v.rollbackPlan)||text(current.rollback_plan)}
      if(action==='technical_ready'||action==='business_ready'||action==='approve')patch={test_evidence:text(v.testEvidence),evidence:object(v.evidence)}
      if(action==='schedule')patch={planned_at:optional(v.plannedAt)}
      if(action==='deploy')patch={deployed_at:now(),deployment_result:text(v.deploymentResult),evidence:object(v.evidence)}
      if(action==='verify'||action==='accept')patch={verification_result:text(v.verificationResult),evidence:object(v.evidence)}
      if(action==='block'||action==='rollback'||action==='recover'||action==='close')patch={deployment_result:text(v.deploymentResult)||text(current.deployment_result),verification_result:text(v.verificationResult)||text(current.verification_result),evidence:object(v.evidence)}
      break
    }
  }
  if(nextStatus){assertRealityTransition(domain,String(current.status),nextStatus);patch.status=nextStatus}
  if(action==='assign')patch={owner_id:text(v.ownerId)||null,due_at:optional(v.dueAt)}
  if(!nextStatus&&action!=='assign'&&action!=='update_details')throw new MarketplaceError('VALIDATION_ERROR',`Commande ${action} non reconnue pour ${domain}.`)
  return patch
}

async function event(input:{domain:RealityDomain;workspaceKey:string;entityId:string;action:string;before:RealityRecord|null;after:RealityRecord;reason:string;context:MarketplaceRequestContext;requestId:string}){
  const db=await createServiceClient()
  const {error}=await db.from('angelcare_marketplace_reality_command_events').insert({domain:input.domain,workspace_key:input.workspaceKey,entity_id:input.entityId,action:input.action,previous_status:input.before?.status||null,next_status:input.after.status,reason:input.reason||null,before_value:input.before,after_value:input.after,actor_id:input.context.actor.id,request_id:input.requestId,territory_id:input.context.territoryId,tenant_id:input.context.tenantId})
  if(error)fail('enregistrer la preuve de commande Reality Completion',error)
}

export async function loadRealityWorkspace(domain:RealityDomain,workspaceKey:string,context:MarketplaceRequestContext):Promise<RealityWorkspaceData>{
  const contract=REALITY_DOMAIN_CONTRACTS[domain]
  const db=await createServiceClient()
  let recordQuery=db.from(contract.table).select('*').eq('workspace_key',workspaceKey);if(context.tenantId)recordQuery=recordQuery.eq('tenant_id',context.tenantId);else if(context.territoryId)recordQuery=recordQuery.eq('territory_id',context.territoryId);const {data,error}=await recordQuery.order('updated_at',{ascending:false}).limit(250)
  if(error){const code=(error as {code?:string}).code;if(code==='42P01'||code==='PGRST205')throw new MarketplaceError('CONFIGURATION_ERROR','La migration Reality Completion doit être appliquée avant d’ouvrir cette autorité.',{cause:error});fail(`charger ${contract.label}`,error)}
  let eventQuery=db.from('angelcare_marketplace_reality_command_events').select('*').eq('workspace_key',workspaceKey);if(context.tenantId)eventQuery=eventQuery.eq('tenant_id',context.tenantId);else if(context.territoryId)eventQuery=eventQuery.eq('territory_id',context.territoryId);const {data:events,error:eventError}=await eventQuery.order('created_at',{ascending:false}).limit(120)
  if(eventError)fail('charger la chronologie Reality Completion',eventError)
  const def=getFinalMz2Workspace(workspaceKey)
  const source=def?await loadFinalWorkspaceData(def,context):{sourceRecords:[]}
  return {records:(data||[]) as RealityRecord[],sourceRecords:source.sourceRecords,events:(events||[]) as RealityEvent[]}
}

export async function createRealityRecord(domain:RealityDomain,input:RealityCreateInput,context:MarketplaceRequestContext,requestId:string,request?:Request){
  const contract=REALITY_DOMAIN_CONTRACTS[domain]
  const db=await createServiceClient()
  if(input.sourceId){let existingQuery=db.from(contract.table).select('*').eq('workspace_key',input.workspaceKey).eq('source_id',input.sourceId);if(context.tenantId)existingQuery=existingQuery.eq('tenant_id',context.tenantId);else if(context.territoryId)existingQuery=existingQuery.eq('territory_id',context.territoryId);const {data:existing}=await existingQuery.limit(1).maybeSingle();if(existing)return existing as RealityRecord}
  const payload=createPayload(domain,input,context)
  const {data,error}=await db.from(contract.table).insert(payload as never).select('*').single()
  if(error||!data)fail(`créer ${contract.label}`,error)
  const record=data as RealityRecord
  await event({domain,workspaceKey:input.workspaceKey,entityId:record.id,action:'created',before:null,after:record,reason:'Création spécialiste',context,requestId})
  await writeMarketplaceAudit({context,requestId,request,action:`reality.${domain}.created`,objectType:`reality_${domain}`,objectId:record.id,afterValue:record,source:'marketplace-reality-completion'})
  return record
}

export async function commandRealityRecord(domain:RealityDomain,id:string,input:RealityCommandInput,context:MarketplaceRequestContext,requestId:string,request:Request|undefined,expectedWorkspaceKey:string){
  const contract=REALITY_DOMAIN_CONTRACTS[domain]
  const db=await createServiceClient()
  const {data:current,error:loadError}=await db.from(contract.table).select('*').eq('id',id).single()
  if(loadError||!current)fail(`charger ${contract.label}`,loadError)
  const before=current as RealityRecord
  if(before.workspace_key!==expectedWorkspaceKey)throw new MarketplaceError('SCOPE_MISMATCH','Ce dossier n’appartient pas au workspace autorisé.');if(context.tenantId&&String(before.tenant_id||'')!==context.tenantId)throw new MarketplaceError('SCOPE_MISMATCH','Ce dossier appartient à un autre tenant.');if(!context.tenantId&&context.territoryId&&before.territory_id&&String(before.territory_id)!==context.territoryId)throw new MarketplaceError('SCOPE_MISMATCH','Ce dossier appartient à un autre territoire.')
  const patch={...commandPatch(domain,before,input),updated_by:context.actor.id,updated_at:now()}
  const {data,error}=await db.from(contract.table).update(patch as never).eq('id',id).select('*').single()
  if(error||!data)fail(`exécuter ${input.action}`,error)
  const after=data as RealityRecord
  await event({domain,workspaceKey:after.workspace_key,entityId:after.id,action:input.action,before,after,reason:input.reason,context,requestId})
  await writeMarketplaceAudit({context,requestId,request,action:`reality.${domain}.${input.action}`,objectType:`reality_${domain}`,objectId:id,beforeValue:before,afterValue:after,reason:input.reason,source:'marketplace-reality-completion',severity:['critical','high'].includes(String(after.severity||''))?'warning':'info'})
  return after
}

import { createServiceClient } from '@/lib/supabase/server'
import { resolveMarketAiProvider } from '@/lib/market-os/ai-runtime/provider-route'
import type { MarketAiCapability } from '@/lib/market-os/ai-runtime/types'
import { auditContentHeadquarters } from './repository'
import type { BudgetPolicy, HygieneCandidate, InternationalDefault, NotificationRule, ProductionControl, ProductionIncident, ProductionOperationsSnapshot, ProductionRelease, RoleHomeProfile } from './production-operations-types'

const CONTROL_ID = 'global'
const now = () => new Date().toISOString()
const clean = (value: unknown) => String(value || '').trim()
const rows = <T>(value: unknown): T[] => Array.isArray(value) ? value as T[] : []
const defaultControls: ProductionControl = { maintenanceMode:false, manualOnlyMode:false, aiAutomationPaused:false, tavilyPaused:false, openRouterPaused:false, scheduledScansPaused:false, scheduledPublishingPaused:false, reason:'', updatedAt:null, updatedBy:'System', criticalAuthorityId:'', criticalAuthorityName:'Aissaoui Ilyass' }

function relationMissing(error: any) { return error && (error.code === '42P01' || String(error.message || '').includes('does not exist')) }
function mapControls(row: any): ProductionControl { return row ? { maintenanceMode:Boolean(row.maintenance_mode), manualOnlyMode:Boolean(row.manual_only_mode), aiAutomationPaused:Boolean(row.ai_automation_paused), tavilyPaused:Boolean(row.tavily_paused), openRouterPaused:Boolean(row.openrouter_paused), scheduledScansPaused:Boolean(row.scheduled_scans_paused), scheduledPublishingPaused:Boolean(row.scheduled_publishing_paused), reason:clean(row.reason), updatedAt:row.updated_at || null, updatedBy:clean(row.updated_by_name) || 'System', criticalAuthorityId:clean(row.critical_authority_id), criticalAuthorityName:clean(row.critical_authority_name)||'Aissaoui Ilyass' } : defaultControls }
function mapRelease(row:any):ProductionRelease { return { id:String(row.id),versionCode:clean(row.version_code),label:clean(row.label),status:row.status,doctrineVersion:clean(row.doctrine_version),skillsVersion:clean(row.skills_version),commandsVersion:clean(row.commands_version),providerAssignmentVersion:clean(row.provider_assignment_version),freezeScope:rows<string>(row.freeze_scope),notes:clean(row.notes),approvedBy:clean(row.approved_by_name),effectiveAt:row.effective_at||null,createdAt:row.created_at } }
function mapIncident(row:any):ProductionIncident { return {id:String(row.id),sourceType:clean(row.source_type),sourceId:clean(row.source_id),incidentType:clean(row.incident_type),severity:row.severity,status:row.status,summary:clean(row.summary),detail:clean(row.detail),ownerName:clean(row.owner_name),nextAction:clean(row.next_action),sourceHref:clean(row.source_href),occurredAt:row.occurred_at,updatedAt:row.updated_at} }


export async function getGlobalOperatingDefaults(){
  const supabase=await createServiceClient() as any
  const result=await supabase.from('market_content_international_defaults').select('*').eq('scope_type','global').eq('scope_id','global').maybeSingle()
  if(result.error||!result.data)return {timezone:'Africa/Casablanca',locale:'fr-MA',defaultLanguage:'fr',contentLanguages:['fr','en'],currency:'Dh',dateFormat:'DD/MM/YYYY',workingDays:[1,2,3,4,5],holidays:[],marketScope:['Morocco','International']}
  return {timezone:clean(result.data.timezone)||'Africa/Casablanca',locale:clean(result.data.locale)||'fr-MA',defaultLanguage:clean(result.data.default_language)||'fr',contentLanguages:rows<string>(result.data.content_languages),currency:clean(result.data.currency)||'Dh',dateFormat:clean(result.data.date_format)||'DD/MM/YYYY',workingDays:rows<number>(result.data.working_days),holidays:rows<string>(result.data.holidays),marketScope:rows<string>(result.data.market_scope)}
}

export async function getProductionControls():Promise<ProductionControl>{
  const supabase=await createServiceClient() as any
  const result=await supabase.from('market_content_production_controls').select('*').eq('control_key',CONTROL_ID).maybeSingle()
  if(result.error){ if(relationMissing(result.error)) return defaultControls; throw result.error }
  return mapControls(result.data)
}

async function globalBudgetState(){
  const supabase=await createServiceClient() as any
  const policy=await supabase.from('market_content_budget_policies').select('*').eq('scope_type','global').eq('scope_id','global').maybeSingle()
  if(policy.error&&relationMissing(policy.error))return null
  if(policy.error)throw policy.error
  if(!policy.data)return null
  const monthStart=new Date();monthStart.setUTCDate(1);monthStart.setUTCHours(0,0,0,0)
  const todayStart=new Date();todayStart.setUTCHours(0,0,0,0)
  const ledger=await supabase.from('market_content_ai_cost_ledger').select('estimated_cost_dh,occurred_at').gte('occurred_at',monthStart.toISOString()).limit(10000)
  if(ledger.error)return {...policy.data,currentDayDh:0,currentMonthDh:0}
  let day=0,month=0;for(const row of ledger.data||[]){const value=Number(row.estimated_cost_dh||0);month+=value;if(new Date(row.occurred_at).getTime()>=todayStart.getTime())day+=value}
  return {...policy.data,currentDayDh:day,currentMonthDh:month}
}

export async function assertProductionCapability(capability:'ai'|'tavily'|'openrouter'|'scheduled_scan'|'publishing'){
  const controls=await getProductionControls()
  if(controls.maintenanceMode) return {allowed:false,reason:'PLATFORM_MAINTENANCE_MODE',manual:true,controls}
  if(controls.manualOnlyMode) return {allowed:false,reason:'MANUAL_ONLY_MODE',manual:true,controls}
  if(capability==='ai'&&controls.aiAutomationPaused) return {allowed:false,reason:'AI_AUTOMATION_PAUSED',manual:true,controls}
  if(capability==='tavily'&&(controls.aiAutomationPaused||controls.tavilyPaused)) return {allowed:false,reason:'TAVILY_PAUSED',manual:true,controls}
  if(capability==='openrouter'&&(controls.aiAutomationPaused||controls.openRouterPaused)) return {allowed:false,reason:'OPENROUTER_PAUSED',manual:true,controls}
  if(capability==='scheduled_scan'&&controls.scheduledScansPaused) return {allowed:false,reason:'SCHEDULED_SCANS_PAUSED',manual:false,controls}
  if(capability==='publishing'&&controls.scheduledPublishingPaused) return {allowed:false,reason:'SCHEDULED_PUBLISHING_PAUSED',manual:false,controls}
  if(['ai','tavily','openrouter'].includes(capability)){const budget=await globalBudgetState();if(budget?.hard_stop&&((Number(budget.daily_limit_dh)>0&&budget.currentDayDh>=Number(budget.daily_limit_dh))||(Number(budget.monthly_limit_dh)>0&&budget.currentMonthDh>=Number(budget.monthly_limit_dh))))return {allowed:false,reason:'AI_BUDGET_HARD_STOP',manual:true,controls}}
  return {allowed:true,reason:'',manual:false,controls}
}

export async function recordAiUsage(input:{actorId?:string|null;provider:string|null;model:string|null;capability:string;directorId?:string;missionId?:string;runId?:string;inputTokens:number;outputTokens:number;latencyMs:number;estimatedCostDh?:number}){
  try{const supabase=await createServiceClient() as any;const estimatedCostDh=input.estimatedCostDh??0;await supabase.from('market_content_ai_cost_ledger').insert({provider:input.provider||'manual',model:input.model||'',capability:input.capability,director_id:input.directorId||null,mission_id:input.missionId||null,run_id:input.runId||null,input_tokens:input.inputTokens||0,output_tokens:input.outputTokens||0,latency_ms:input.latencyMs||0,estimated_cost_dh:estimatedCostDh,created_by:input.actorId||null})}catch{}
}

export async function recordProductionIncident(input:{sourceType:string;sourceId:string;incidentType:string;severity?:string;summary:string;detail?:string;nextAction?:string;sourceHref?:string}){
  try{
    const supabase=await createServiceClient() as any
    await supabase.from('market_content_operational_incidents').upsert({source_type:input.sourceType,source_id:input.sourceId,incident_type:input.incidentType,severity:input.severity||'warning',summary:input.summary,detail:input.detail||'',next_action:input.nextAction||'Inspecter et décider',source_href:input.sourceHref||'',status:'open',occurred_at:now(),updated_at:now()},{onConflict:'source_type,source_id,incident_type'})
    const eventKey=input.incidentType==='publication_failure'?'publication.failed':input.incidentType.includes('provider')||input.sourceType==='ai_runtime'?'provider.unavailable':''
    if(eventKey){
      const rule=await supabase.from('market_content_notification_rules').select('*').eq('event_key',eventKey).maybeSingle()
      if(!rule.error&&rule.data?.enabled){
        for(const role of rows<string>(rule.data.recipient_roles)){
          const recent=await supabase.from('market_os_notifications').select('id',{count:'exact',head:true}).eq('title',input.summary).eq('target_role',role).gte('created_at',new Date(Date.now()-Number(rule.data.dedupe_minutes||60)*60000).toISOString())
          if(!recent.count)await supabase.from('market_os_notifications').insert({title:input.summary,body:input.detail||input.nextAction||'',severity:input.severity||rule.data.severity||'warning',target_role:role})
        }
      }
    }
  }catch{}
}

async function hygieneCandidates(supabase:any):Promise<HygieneCandidate[]>{
  const output:HygieneCandidate[]=[]
  const dossier=await supabase.from('market_content_dossiers').select('id,content_code,title,status,owner_name,updated_at').in('status',['opportunity','ideation','brief','scope_locked','planned','assigned','in_creation']).order('updated_at',{ascending:true}).limit(120)
  if(!dossier.error) for(const item of dossier.data||[]){const title=clean(item.title);const stale=Date.now()-new Date(item.updated_at).getTime()>30*86400000;const test=/\b(test|demo|legacy|essai)\b/i.test(title);const unowned=!clean(item.owner_name);if(test||stale||unowned)output.push({entityType:'dossier',id:item.id,code:item.content_code,title,status:item.status,reason:test?'Cas test/démonstration':unowned?'Dossier actif sans propriétaire':'Dossier actif sans mouvement depuis 30 jours',ownerName:clean(item.owner_name),updatedAt:item.updated_at})}
  const signal=await supabase.from('market_content_signals').select('id,code,title,status,updated_at').in('status',['captured','enriching','verified','qualified','deferred']).order('updated_at',{ascending:true}).limit(120)
  if(!signal.error) for(const item of signal.data||[]){const stale=Date.now()-new Date(item.updated_at).getTime()>45*86400000;const test=/\b(test|demo|legacy|essai)\b/i.test(clean(item.title));if(test||stale)output.push({entityType:'signal',id:item.id,code:item.code,title:item.title,status:item.status,reason:test?'Signal test/démonstration':'Signal actif ancien à requalifier',ownerName:'',updatedAt:item.updated_at})}
  return output.slice(0,80)
}

export async function getProductionOperationsSnapshot():Promise<ProductionOperationsSnapshot>{
  const supabase=await createServiceClient() as any
  const control=await supabase.from('market_content_production_controls').select('*').eq('control_key',CONTROL_ID).maybeSingle()
  if(control.error&&relationMissing(control.error)) return {generatedAt:now(),schemaReady:false,controls:defaultControls,activeRelease:null,releases:[],incidents:[],budgetPolicies:[],defaults:[],roleHomes:[],notificationRules:[],hygieneCandidates:[],health:{database:'setup_required',aiConfigured:0,aiCapabilities:0,openIncidents:0,criticalIncidents:0,failedJobs:0,publicationFailures:0,unownedActiveRecords:0}}
  if(control.error)throw control.error
  const aiCapabilities:MarketAiCapability[]=['web_research','source_extraction','structured_reasoning','structured_content','multimodal_analysis','image_generation']
  const aiConfigured=(await Promise.all(aiCapabilities.map(async capability=>{try{await resolveMarketAiProvider({capability,context:{commandCode:'PRODUCTION-OPS-HEALTH'},healthOnly:true});return true}catch{return false}}))).filter(Boolean).length
  const [release,incident,budget,defaults,roles,notifications,failedJobs,publishFailures,unowned]=await Promise.all([
    supabase.from('market_content_release_versions').select('*').order('created_at',{ascending:false}).limit(20),
    supabase.from('market_content_operational_incidents').select('*').in('status',['open','assigned','retry_scheduled','manual_continuation']).order('occurred_at',{ascending:false}).limit(100),
    supabase.from('market_content_budget_policies').select('*').order('scope_type'),
    supabase.from('market_content_international_defaults').select('*').order('scope_type'),
    supabase.from('market_content_role_home_profiles').select('*').order('role_key'),
    supabase.from('market_content_notification_rules').select('*').order('event_key'),
    supabase.from('market_ai_execution_jobs').select('id',{count:'exact',head:true}).in('status',['blocked','dead_letter','retry_scheduled']),
    supabase.from('market_content_publication_packages').select('id',{count:'exact',head:true}).in('status',['failed','verification_failed']),
    supabase.from('market_content_dossiers').select('id',{count:'exact',head:true}).is('owner_id',null).not('status','in','(closed,archived)'),
  ])
  for(const result of [release,incident,budget,defaults,roles,notifications]) if(result.error) throw result.error
  const releases=rows<any>(release.data).map(mapRelease)
  const incidents=rows<any>(incident.data).map(mapIncident)
  const globalBudget=await globalBudgetState();const budgets=rows<any>(budget.data).map((r:any):BudgetPolicy=>({id:r.id,scopeType:r.scope_type,scopeId:r.scope_id,dailyLimitDh:Number(r.daily_limit_dh||0),monthlyLimitDh:Number(r.monthly_limit_dh||0),warningPercent:Number(r.warning_percent||80),hardStop:Boolean(r.hard_stop),fallbackProvider:clean(r.fallback_provider),fallbackModel:clean(r.fallback_model),currentDayDh:r.scope_type==='global'&&globalBudget?Number(globalBudget.currentDayDh||0):0,currentMonthDh:r.scope_type==='global'&&globalBudget?Number(globalBudget.currentMonthDh||0):0}))
  return {generatedAt:now(),schemaReady:true,controls:mapControls(control.data),activeRelease:releases.find(r=>r.status==='active')||null,releases,incidents,budgetPolicies:budgets,defaults:rows<any>(defaults.data).map((r:any):InternationalDefault=>({id:r.id,scopeType:r.scope_type,scopeId:r.scope_id,label:r.label,timezone:r.timezone,locale:r.locale,defaultLanguage:r.default_language,contentLanguages:rows<string>(r.content_languages),currency:r.currency,dateFormat:r.date_format,weekStartsOn:Number(r.week_starts_on),workingDays:rows<number>(r.working_days),holidays:rows<string>(r.holidays),marketScope:rows<string>(r.market_scope)})),roleHomes:rows<any>(roles.data).map((r:any):RoleHomeProfile=>({roleKey:r.role_key,label:r.label,defaultRoute:r.default_route,visibleRoutes:rows<string>(r.visible_routes),onboardingState:r.onboarding_state})),notificationRules:rows<any>(notifications.data).map((r:any):NotificationRule=>({eventKey:r.event_key,label:r.label,enabled:Boolean(r.enabled),severity:r.severity,channels:rows<string>(r.channels),recipientRoles:rows<string>(r.recipient_roles),dedupeMinutes:Number(r.dedupe_minutes),escalateAfterMinutes:Number(r.escalate_after_minutes)})),hygieneCandidates:await hygieneCandidates(supabase),health:{database:'healthy',aiConfigured,aiCapabilities:aiCapabilities.length,openIncidents:incidents.length,criticalIncidents:incidents.filter(i=>i.severity==='critical').length,failedJobs:Number(failedJobs.count||0),publicationFailures:Number(publishFailures.count||0),unownedActiveRecords:Number(unowned.count||0)}}
}


async function assertCriticalAuthority(actorId:string){
  const controls=await getProductionControls()
  if(controls.criticalAuthorityId&&controls.criticalAuthorityId!==actorId)throw new Error('CRITICAL_AUTHORITY_REQUIRED')
}

export async function claimCriticalAuthority(input:{actorId:string;actorName:string;reason:string}){
  if(!clean(input.reason))throw new Error('CRITICAL_AUTHORITY_REASON_REQUIRED')
  const supabase=await createServiceClient() as any
  const result=await supabase.from('market_content_production_controls').upsert({control_key:CONTROL_ID,critical_authority_id:input.actorId||null,critical_authority_name:input.actorName,reason:input.reason,updated_by:input.actorId||null,updated_by_name:input.actorName,updated_at:now()},{onConflict:'control_key'}).select('*').single()
  if(result.error)throw result.error
  await auditContentHeadquarters({actorId:input.actorId,actorName:input.actorName,action:'production.critical_authority.claimed',entityType:'production_control',entityId:null,detail:{reason:input.reason}})
  return mapControls(result.data)
}

export async function updateProductionControls(input:{actorId:string;actorName:string;patch:Record<string,unknown>;reason:string}){
  await assertCriticalAuthority(input.actorId)
  if(!clean(input.reason))throw new Error('PRODUCTION_CONTROL_REASON_REQUIRED')
  const supabase=await createServiceClient() as any
  const allowed:Record<string,string>={maintenanceMode:'maintenance_mode',manualOnlyMode:'manual_only_mode',aiAutomationPaused:'ai_automation_paused',tavilyPaused:'tavily_paused',openRouterPaused:'openrouter_paused',scheduledScansPaused:'scheduled_scans_paused',scheduledPublishingPaused:'scheduled_publishing_paused'}
  const update:Record<string,unknown>={control_key:CONTROL_ID,reason:clean(input.reason),updated_by:input.actorId||null,updated_by_name:input.actorName,updated_at:now()}
  for(const [key,column] of Object.entries(allowed)) if(key in input.patch)update[column]=Boolean(input.patch[key])
  const result=await supabase.from('market_content_production_controls').upsert(update,{onConflict:'control_key'}).select('*').single();if(result.error)throw result.error
  await auditContentHeadquarters({actorId:input.actorId,actorName:input.actorName,action:'production.controls.updated',entityType:'production_control',entityId:null,detail:{patch:input.patch,reason:input.reason}})
  return mapControls(result.data)
}

export async function governProductionRelease(input:{actorId:string;actorName:string;action:'create'|'activate'|'retire';payload:Record<string,unknown>}){
  if(input.action==='activate'||input.action==='retire')await assertCriticalAuthority(input.actorId)
  const supabase=await createServiceClient() as any
  if(input.action==='create'){
    const versionCode=clean(input.payload.versionCode);if(!versionCode)throw new Error('RELEASE_VERSION_REQUIRED')
    const result=await supabase.from('market_content_release_versions').insert({version_code:versionCode,label:clean(input.payload.label)||`Production Release ${versionCode}`,status:'candidate',doctrine_version:clean(input.payload.doctrineVersion)||'AC-CCC-DOC-1.0',skills_version:clean(input.payload.skillsVersion)||'AC-CCC-SKL-1.0',commands_version:clean(input.payload.commandsVersion)||'AC-CCC-CMD-1.0',provider_assignment_version:clean(input.payload.providerAssignmentVersion)||'AC-CCC-AI-1.0',freeze_scope:rows<string>(input.payload.freezeScope),notes:clean(input.payload.notes),created_by:input.actorId||null,created_by_name:input.actorName}).select('*').single();if(result.error)throw result.error;return mapRelease(result.data)
  }
  const id=clean(input.payload.id);if(!id)throw new Error('RELEASE_ID_REQUIRED')
  if(input.action==='activate'){await supabase.from('market_content_release_versions').update({status:'superseded'}).eq('status','active').neq('id',id);const result=await supabase.from('market_content_release_versions').update({status:'active',approved_by:input.actorId||null,approved_by_name:input.actorName,approved_at:now(),effective_at:now()}).eq('id',id).select('*').single();if(result.error)throw result.error;await auditContentHeadquarters({actorId:input.actorId,actorName:input.actorName,action:'production.release.activated',entityType:'production_release',entityId:id,detail:{versionCode:result.data.version_code}});return mapRelease(result.data)}
  const result=await supabase.from('market_content_release_versions').update({status:'retired'}).eq('id',id).select('*').single();if(result.error)throw result.error;return mapRelease(result.data)
}

export async function updateBudgetPolicy(input:{actorId:string;actorName:string;payload:Record<string,unknown>}){
  const supabase=await createServiceClient() as any;const scopeType=clean(input.payload.scopeType)||'global';const scopeId=clean(input.payload.scopeId)||'global';const result=await supabase.from('market_content_budget_policies').upsert({scope_type:scopeType,scope_id:scopeId,daily_limit_dh:Number(input.payload.dailyLimitDh||0),monthly_limit_dh:Number(input.payload.monthlyLimitDh||0),warning_percent:Number(input.payload.warningPercent||80),hard_stop:Boolean(input.payload.hardStop),fallback_provider:clean(input.payload.fallbackProvider),fallback_model:clean(input.payload.fallbackModel),updated_by:input.actorId||null,updated_by_name:input.actorName,updated_at:now()},{onConflict:'scope_type,scope_id'}).select('*').single();if(result.error)throw result.error;return result.data
}

export async function updateInternationalDefault(input:{actorId:string;actorName:string;payload:Record<string,unknown>}){
  const supabase=await createServiceClient() as any;const result=await supabase.from('market_content_international_defaults').upsert({scope_type:clean(input.payload.scopeType)||'global',scope_id:clean(input.payload.scopeId)||'global',label:clean(input.payload.label)||'Global',timezone:clean(input.payload.timezone)||'Africa/Casablanca',locale:clean(input.payload.locale)||'fr-MA',default_language:clean(input.payload.defaultLanguage)||'fr',content_languages:rows<string>(input.payload.contentLanguages),currency:clean(input.payload.currency)||'Dh',date_format:clean(input.payload.dateFormat)||'DD/MM/YYYY',week_starts_on:Number(input.payload.weekStartsOn||1),working_days:rows<number>(input.payload.workingDays),holidays:rows<string>(input.payload.holidays),market_scope:rows<string>(input.payload.marketScope),updated_by:input.actorId||null,updated_by_name:input.actorName,updated_at:now()},{onConflict:'scope_type,scope_id'}).select('*').single();if(result.error)throw result.error;return result.data
}

export async function updateRoleHome(input:{actorId:string;actorName:string;payload:Record<string,unknown>}){const supabase=await createServiceClient() as any;const result=await supabase.from('market_content_role_home_profiles').upsert({role_key:clean(input.payload.roleKey),label:clean(input.payload.label),default_route:clean(input.payload.defaultRoute),visible_routes:rows<string>(input.payload.visibleRoutes),onboarding_state:clean(input.payload.onboardingState)||'ready',updated_by:input.actorId||null,updated_by_name:input.actorName,updated_at:now()},{onConflict:'role_key'}).select('*').single();if(result.error)throw result.error;return result.data}
export async function updateNotificationRule(input:{actorId:string;actorName:string;payload:Record<string,unknown>}){const supabase=await createServiceClient() as any;const result=await supabase.from('market_content_notification_rules').upsert({event_key:clean(input.payload.eventKey),label:clean(input.payload.label),enabled:Boolean(input.payload.enabled),severity:clean(input.payload.severity)||'warning',channels:rows<string>(input.payload.channels),recipient_roles:rows<string>(input.payload.recipientRoles),dedupe_minutes:Number(input.payload.dedupeMinutes||60),escalate_after_minutes:Number(input.payload.escalateAfterMinutes||240),updated_by:input.actorId||null,updated_by_name:input.actorName,updated_at:now()},{onConflict:'event_key'}).select('*').single();if(result.error)throw result.error;return result.data}

export async function refreshOperationalIncidents(input:{actorId:string;actorName:string}){
  const supabase=await createServiceClient() as any
  const jobs=await supabase.from('market_ai_execution_jobs').select('id,status,error,job_type,updated_at').in('status',['blocked','dead_letter','retry_scheduled']).limit(100)
  if(!jobs.error)for(const job of jobs.data||[])await recordProductionIncident({sourceType:'ai_job',sourceId:job.id,incidentType:'ai_execution_failure',severity:job.status==='dead_letter'?'critical':'high',summary:`Job IA ${job.job_type} · ${job.status}`,detail:clean(job.error),nextAction:'Réessayer, continuer manuellement ou résoudre',sourceHref:'/market-os/content-command-center/ai-director/recovery'})
  const packages=await supabase.from('market_content_publication_packages').select('id,status,channel,updated_at').in('status',['failed','verification_failed']).limit(100)
  if(!packages.error)for(const item of packages.data||[])await recordProductionIncident({sourceType:'publication_package',sourceId:item.id,incidentType:'publication_failure',severity:'high',summary:`Publication ${item.channel} · ${item.status}`,nextAction:'Ouvrir la récupération de publication',sourceHref:'/market-os/content-command-center/publishing'})
  await auditContentHeadquarters({actorId:input.actorId,actorName:input.actorName,action:'production.incidents.refreshed',entityType:'production_operations',entityId:null,detail:{jobs:jobs.data?.length||0,packages:packages.data?.length||0}})
  return getProductionOperationsSnapshot()
}

export async function actOnOperationalIncident(input:{actorId:string;actorName:string;incidentId:string;action:string;ownerName?:string;reason:string}){
  if(!clean(input.reason))throw new Error('INCIDENT_ACTION_REASON_REQUIRED')
  const supabase=await createServiceClient() as any;const current=await supabase.from('market_content_operational_incidents').select('*').eq('id',input.incidentId).single();if(current.error)throw current.error
  if(input.action==='retry'&&current.data.source_type==='ai_job')await supabase.from('market_ai_execution_jobs').update({status:'retry_scheduled',next_retry_at:now(),error:null,updated_at:now()}).eq('id',current.data.source_id)
  const status=input.action==='retry'?'retry_scheduled':input.action==='manual'?'manual_continuation':input.action==='assign'?'assigned':input.action==='dismiss'?'dismissed':'resolved'
  const update=await supabase.from('market_content_operational_incidents').update({status,owner_name:clean(input.ownerName),resolution_reason:clean(input.reason),resolved_by:status==='resolved'||status==='dismissed'?input.actorId:null,resolved_by_name:status==='resolved'||status==='dismissed'?input.actorName:'',resolved_at:status==='resolved'||status==='dismissed'?now():null,updated_at:now()}).eq('id',input.incidentId).select('*').single();if(update.error)throw update.error;return mapIncident(update.data)
}

export async function applyProductionHygiene(input:{actorId:string;actorName:string;items:Array<{entityType:string;id:string;action:string}>;reason:string}){
  if(!clean(input.reason))throw new Error('HYGIENE_REASON_REQUIRED');const supabase=await createServiceClient() as any
  for(const item of input.items){if(item.entityType==='dossier'&&item.action==='archive')await supabase.from('market_content_dossiers').update({status:'archived',updated_at:now()}).eq('id',item.id);else if(item.entityType==='signal'&&item.action==='reject')await supabase.from('market_content_signals').update({status:'rejected',human_conclusion:input.reason,updated_at:now()}).eq('id',item.id)}
  await auditContentHeadquarters({actorId:input.actorId,actorName:input.actorName,action:'production.hygiene.applied',entityType:'production_operations',entityId:null,detail:{items:input.items,reason:input.reason}});return getProductionOperationsSnapshot()
}

import { createServiceClient } from '@/lib/supabase/server'
import { executeStructuredContent } from '@/lib/market-os/ai-runtime/gateway'
import type { RuntimeContinuationMode, RuntimeSource } from '@/lib/market-os/ai-runtime/types'
import { auditContentHeadquarters, compileStrategyToPlan, createContentDossier, createMarketSignal, createMission, createStrategy, getContentHeadquartersSnapshot } from './repository'
import { runMarketIntelligenceScan } from './market-scan'
import type { JsonRecord, MarketSignal } from './types'

export const OPPORTUNITY_PROFILE_KIND = 'content_opportunity_profile'
export type OpportunityDecisionStatus = 'detected'|'qualified'|'recommended'|'under_review'|'selected'|'validated'|'deferred'|'rejected'|'expired'|'converted'
export type OpportunityProfile = {
  kind: typeof OPPORTUNITY_PROFILE_KIND
  version: 1
  classification: {
    origin: 'seasonal'|'periodic'|'event_driven'|'market_driven'|'trend_driven'|'competitor_driven'|'customer_driven'|'performance_driven'|'strategic'|'reactive'|'evergreen'
    trendType: string
    serviceLine: string
    businessObjective: string
    campaignObjective: string
    audience: string
    buyerProfile: string
    funnelStage: string
    geography: string
    language: string
    contentFamily: 'digital'|'print_offline'|'corporate_document'
    theme: string
    angle: string
    format: string
    channels: string[]
  }
  variables: {
    whyNow: string
    whatChanged: string
    customerProblem: string
    customerDesire: string
    messagePromise: string
    proofPoint: string
    callToAction: string
    emotionalOutcome: string
    sourceRequirements: string[]
    brandConstraints: string[]
    variants: Array<{ format: string; channel: string; angle?: string; language?: string }>
    measurementPlan: string
  }
  intelligence: {
    signalStrength: number
    sourceReliability: number
    freshness: string
    trendVelocity: string
    opportunityDuration: string
    competitionIntensity: string
    strategicFit: number
    existingContentOverlap: string
    reusePotential: string
    uncertainty: string
    recommendedResponseSpeed: string
    explanation: string
  }
  planning: {
    preparationHorizonDays: number
    productionDeadline: string | null
    publicationWindowStart: string | null
    publicationWindowEnd: string | null
    observationWindowDays: number
  }
  decision: {
    status: OpportunityDecisionStatus
    selectedBy?: string | null
    selectedAt?: string | null
    validatedBy?: string | null
    validatedAt?: string | null
    conditions?: string[]
    decisionReason?: string | null
  }
  sources: RuntimeSource[]
  conversion?: {
    status: 'not_started'|'in_progress'|'completed'|'partial'
    strategyId?: string | null
    actionPlanId?: string | null
    records: Array<{ dossierId: string; missionId?: string | null; contentCode?: string | null; format: string; channel: string }>
    convertedAt?: string | null
    convertedBy?: string | null
  }
}

type OpportunityCandidate = {
  title: string; summary: string; classification: OpportunityProfile['classification']; variables: OpportunityProfile['variables']; intelligence: OpportunityProfile['intelligence']; planning: OpportunityProfile['planning']; sourceUrls?: string[]
}

const clean=(value:unknown)=>String(value||'').trim()
const arr=(value:unknown)=>Array.isArray(value)?value.map(String).map(v=>v.trim()).filter(Boolean):[]
const clamp=(value:unknown,min=0,max=100)=>Math.max(min,Math.min(max,Number(value||0)))
const now=()=>new Date().toISOString()
const normalize=(value:string)=>value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim()
const record=(value:unknown):JsonRecord=>value&&typeof value==='object'&&!Array.isArray(value)?value as JsonRecord:{}

function datePlus(days:number){const d=new Date();d.setUTCDate(d.getUTCDate()+days);return d.toISOString()}
function profileFrom(signal:MarketSignal):OpportunityProfile|null{
  const evidence=Array.isArray(signal.evidence)?signal.evidence:[]
  const found=evidence.find(item=>record(item).kind===OPPORTUNITY_PROFILE_KIND)
  return found?found as unknown as OpportunityProfile:null
}
function signalEvidence(signal:MarketSignal,profile:OpportunityProfile){
  const evidence=(Array.isArray(signal.evidence)?signal.evidence:[]).filter(item=>record(item).kind!==OPPORTUNITY_PROFILE_KIND)
  return [...evidence,profile]
}
function derivedProfile(signal:MarketSignal):OpportunityProfile{
  return {kind:OPPORTUNITY_PROFILE_KIND,version:1,classification:{origin:'market_driven',trendType:'signal_non_classified',serviceLine:signal.services?.[0]||'Non classé',businessObjective:'À préciser',campaignObjective:'À préciser',audience:signal.audiences?.[0]||'À préciser',buyerProfile:'À préciser',funnelStage:'awareness',geography:signal.cities?.[0]||'Maroc',language:'fr',contentFamily:'digital',theme:signal.title,angle:'À constituer',format:'À sélectionner',channels:[]},variables:{whyNow:signal.summary,whatChanged:signal.ai_interpretation||'Interprétation non enregistrée.',customerProblem:'À qualifier',customerDesire:'À qualifier',messagePromise:'À constituer',proofPoint:'À sourcer',callToAction:'À définir',emotionalOutcome:'À définir',sourceRequirements:[],brandConstraints:[],variants:[],measurementPlan:'À constituer'},intelligence:{signalStrength:clamp(signal.opportunity_score),sourceReliability:clamp(signal.confidence),freshness:signal.freshness||'unknown',trendVelocity:'non_mesurée',opportunityDuration:'à déterminer',competitionIntensity:'non_mesurée',strategicFit:clamp(signal.opportunity_score),existingContentOverlap:'non inspecté',reusePotential:'à inspecter',uncertainty:'classification incomplète',recommendedResponseSpeed:Number(signal.urgency||0)>=70?'immédiat':'à planifier',explanation:signal.human_conclusion||signal.ai_interpretation||'Signal capturé, qualification approfondie requise.'},planning:{preparationHorizonDays:Number(signal.urgency||0)>=70?7:30,productionDeadline:null,publicationWindowStart:null,publicationWindowEnd:null,observationWindowDays:14},decision:{status:(signal.status==='qualified'?'qualified':signal.status==='converted'?'converted':signal.status==='deferred'?'deferred':signal.status==='rejected'?'rejected':signal.status==='expired'?'expired':'detected') as OpportunityDecisionStatus},sources:signal.source_url?[{title:signal.source_label||signal.title,url:signal.source_url,observedAt:signal.detected_at||signal.created_at,sourceType:'manual_source'}]:[],conversion:{status:'not_started',records:[]}}
}
function publicOpportunity(signal:MarketSignal){const profile=profileFrom(signal)||derivedProfile(signal);return {id:signal.id,code:signal.code,title:signal.title,summary:signal.summary,status:signal.status,confidence:Number(signal.confidence||0),urgency:Number(signal.urgency||0),opportunityScore:Number(signal.opportunity_score||0),sourceLabel:signal.source_label,sourceUrl:signal.source_url,services:signal.services||[],audiences:signal.audiences||[],cities:signal.cities||[],detectedAt:signal.detected_at,updatedAt:signal.updated_at,profile}}

export async function getOpportunityIntelligenceSnapshot(){
  const snapshot=await getContentHeadquartersSnapshot()
  const opportunities=snapshot.signals.map(publicOpportunity)
  const active=opportunities.filter(item=>!['converted','rejected','expired'].includes(item.status))
  const horizons=[7,30,60,90,180].map(days=>({days,count:active.filter(item=>{const start=item.profile.planning.publicationWindowStart;return start?new Date(start).getTime()<=Date.now()+days*86400000:item.profile.planning.preparationHorizonDays<=days}).length}))
  return {generatedAt:now(),opportunities,horizons,rollups:{total:opportunities.length,active:active.length,recommended:active.filter(item=>item.opportunityScore>=70||['recommended','validated','selected'].includes(item.profile.decision.status)).length,validated:active.filter(item=>item.profile.decision.status==='validated').length,converted:opportunities.filter(item=>item.status==='converted').length,seasonal:active.filter(item=>['seasonal','periodic','event_driven'].includes(item.profile.classification.origin)).length,market:active.filter(item=>['market_driven','trend_driven','competitor_driven','customer_driven'].includes(item.profile.classification.origin)).length},context:{strategies:snapshot.strategies.slice(0,40).map(item=>({id:item.id,title:item.title,status:item.status})),dossiers:snapshot.dossiers.slice(0,80).map(item=>({id:item.id,title:item.title,status:item.status,service:item.service_label,audience:item.audience,channel:item.channel})),researchControlHref:'/market-os/content-command-center/ai-director/research-control'}}
}

const opportunitySchema:JsonRecord={type:'object',additionalProperties:false,required:['opportunities'],properties:{opportunities:{type:'array',minItems:4,maxItems:12,items:{type:'object',additionalProperties:false,required:['title','summary','classification','variables','intelligence','planning'],properties:{title:{type:'string'},summary:{type:'string'},classification:{type:'object',additionalProperties:false,required:['origin','trendType','serviceLine','businessObjective','campaignObjective','audience','buyerProfile','funnelStage','geography','language','contentFamily','theme','angle','format','channels'],properties:{origin:{type:'string',enum:['seasonal','periodic','event_driven','market_driven','trend_driven','competitor_driven','customer_driven','performance_driven','strategic','reactive','evergreen']},trendType:{type:'string'},serviceLine:{type:'string'},businessObjective:{type:'string'},campaignObjective:{type:'string'},audience:{type:'string'},buyerProfile:{type:'string'},funnelStage:{type:'string'},geography:{type:'string'},language:{type:'string'},contentFamily:{type:'string',enum:['digital','print_offline','corporate_document']},theme:{type:'string'},angle:{type:'string'},format:{type:'string'},channels:{type:'array',items:{type:'string'}}}},variables:{type:'object',additionalProperties:false,required:['whyNow','whatChanged','customerProblem','customerDesire','messagePromise','proofPoint','callToAction','emotionalOutcome','sourceRequirements','brandConstraints','variants','measurementPlan'],properties:{whyNow:{type:'string'},whatChanged:{type:'string'},customerProblem:{type:'string'},customerDesire:{type:'string'},messagePromise:{type:'string'},proofPoint:{type:'string'},callToAction:{type:'string'},emotionalOutcome:{type:'string'},sourceRequirements:{type:'array',items:{type:'string'}},brandConstraints:{type:'array',items:{type:'string'}},variants:{type:'array',items:{type:'object',additionalProperties:false,required:['format','channel'],properties:{format:{type:'string'},channel:{type:'string'},angle:{type:'string'},language:{type:'string'}}}},measurementPlan:{type:'string'}}},intelligence:{type:'object',additionalProperties:false,required:['signalStrength','sourceReliability','freshness','trendVelocity','opportunityDuration','competitionIntensity','strategicFit','existingContentOverlap','reusePotential','uncertainty','recommendedResponseSpeed','explanation'],properties:{signalStrength:{type:'number'},sourceReliability:{type:'number'},freshness:{type:'string'},trendVelocity:{type:'string'},opportunityDuration:{type:'string'},competitionIntensity:{type:'string'},strategicFit:{type:'number'},existingContentOverlap:{type:'string'},reusePotential:{type:'string'},uncertainty:{type:'string'},recommendedResponseSpeed:{type:'string'},explanation:{type:'string'}}},planning:{type:'object',additionalProperties:false,required:['preparationHorizonDays','productionDeadline','publicationWindowStart','publicationWindowEnd','observationWindowDays'],properties:{preparationHorizonDays:{type:'number'},productionDeadline:{type:['string','null']},publicationWindowStart:{type:['string','null']},publicationWindowEnd:{type:['string','null']},observationWindowDays:{type:'number'}}},sourceUrls:{type:'array',items:{type:'string'}}}}}}}

function fallbackCandidates():OpportunityCandidate[]{
 const periods=[['Préparation du prochain cycle mensuel','periodic',30],['Fenêtre saisonnière à qualifier','seasonal',60],['Temps fort commercial du prochain trimestre','periodic',90],['Questions récurrentes du marché à transformer en contenu','customer_driven',21],['Réemploi des meilleurs actifs du cycle précédent','performance_driven',14]] as const
 return periods.map(([title,origin,days],index)=>({title,summary:'Opportunité de préparation issue du calendrier interne. Elle doit être enrichie par des sources réelles ou une conclusion humaine avant publication.',classification:{origin,trendType:'internal_calendar',serviceLine:'Toutes lignes pertinentes',businessObjective:'Anticiper la demande et renforcer la présence de marque',campaignObjective:'Préparer un contenu utile avant la fenêtre d’attention',audience:'À sélectionner',buyerProfile:'À sélectionner',funnelStage:index===4?'retention':'awareness',geography:'Maroc',language:'fr',contentFamily:'digital',theme:title,angle:'Préparation anticipée',format:'À sélectionner',channels:[]},variables:{whyNow:`Horizon de préparation à ${days} jours.`,whatChanged:'Cycle temporel prévisible, sans affirmation de tendance externe.',customerProblem:'À qualifier',customerDesire:'Recevoir une information pertinente au bon moment',messagePromise:'AngelCare anticipe et apporte une réponse utile',proofPoint:'À sourcer',callToAction:'À définir',emotionalOutcome:'Pertinence et confiance',sourceRequirements:['Source marché ou validation humaine'],brandConstraints:['Respect de la doctrine de marque'],variants:[],measurementPlan:'Définir un indicateur de portée, réponse ou conversion adapté.'},intelligence:{signalStrength:45,sourceReliability:40,freshness:'calendar_only',trendVelocity:'non_mesurée',opportunityDuration:`${days} jours`,competitionIntensity:'non_mesurée',strategicFit:60,existingContentOverlap:'à inspecter',reusePotential:'possible',uncertainty:'Aucune source externe jointe',recommendedResponseSpeed:days<=21?'rapide':'planifié',explanation:'Proposition de continuité interne créée sans fournisseur afin d’éviter un écran vide. Elle ne prétend pas représenter une tendance externe.'},planning:{preparationHorizonDays:days,productionDeadline:datePlus(Math.max(3,days-14)),publicationWindowStart:datePlus(days),publicationWindowEnd:datePlus(days+7),observationWindowDays:14},sourceUrls:[]}))
}

export async function runOpportunityIntelligence(input:{actorId:string;actorName:string;reason?:string;continuationMode?:RuntimeContinuationMode;scanWeb?:boolean}){
  let researchRun:unknown=null
  if(input.scanWeb!==false){try{researchRun=await runMarketIntelligenceScan({actorId:input.actorId,actorName:input.actorName,reason:input.reason||'opportunity_intelligence_scan'})}catch(error){researchRun={status:'degraded',error:error instanceof Error?error.message:'SCAN_UNAVAILABLE'}}}
  const current=await getContentHeadquartersSnapshot()
  const payload={today:new Date().toISOString().slice(0,10),timezone:'Africa/Casablanca',planningHorizons:[7,30,60,90,180],existingSignals:current.signals.slice(0,40).map(item=>({title:item.title,summary:item.summary,status:item.status,services:item.services,audiences:item.audiences,cities:item.cities})),existingContent:current.dossiers.slice(0,60).map(item=>({title:item.title,service:item.service_label,audience:item.audience,channel:item.channel,status:item.status})),requiredSignalClasses:['seasonal','periodic','event-driven','market','consumer','search','channel','format','competitor','service-demand','reputation','internal-performance-gap']}
  const result=await executeStructuredContent<{opportunities:OpportunityCandidate[]}>({context:{actorId:input.actorId,commandCode:'CONTENT_OPPORTUNITY_SCAN',moduleKey:'market_os_content_command',continuationMode:input.scanWeb===false?'without_research':input.continuationMode||'auto',reason:input.reason||'Continuous opportunity intelligence'},systemInstruction:'Tu es le moteur senior Opportunity Intelligence du Content Command Center. Détecte et prépare des opportunités de contenu actionnables, non des idées vagues. Combine saisonnalité, périodes, événements, marché, tendances de recherche et de formats, concurrents, demandes, réputation et lacunes internes. Évite les doublons avec le contenu existant. Toute affirmation externe doit être soutenue par les sources fournies. Transforme chaque signal en variables complètes permettant la création immédiate d’un dossier, brief, mission et tâches. Ne prétends jamais qu’une tendance existe sans preuve; utilise une qualification d’incertitude honnête.',payload,schema:opportunitySchema,schemaName:'content_opportunity_portfolio',researchQuery:`Maroc calendrier commercial périodes saisonnières tendances consommation marketing contenu plateformes recherche concurrents actualités opportunités éditoriales ${new Date().getUTCFullYear()}`,maxOutputTokens:12000})
  const candidates=result.result?.opportunities?.length?result.result.opportunities:fallbackCandidates()
  const supabase=await createServiceClient() as any
  const latest=(await getContentHeadquartersSnapshot()).signals
  const created=[] as MarketSignal[];const updated=[] as MarketSignal[];const seen=new Set(latest.map(item=>normalize(item.title)))
  for(const candidate of candidates.slice(0,12)){
    const key=normalize(candidate.title);if(!key)continue
    const sameInBatch=seen.has(key)&&!latest.some(item=>normalize(item.title)===key);if(sameInBatch)continue
    const duplicate=latest.find(item=>normalize(item.title)===normalize(candidate.title))
    let signal=duplicate||await createMarketSignal({actorId:input.actorId,actorName:input.actorName,title:candidate.title,summary:candidate.summary,sourceType:result.status==='completed'?'opportunity_intelligence':'internal_calendar',sourceLabel:result.status==='completed'?`${result.providerType||'OpenRouter'} + Tavily`:'Calendrier interne · continuité manuelle',sourceUrl:candidate.sourceUrls?.[0]||result.sources[0]?.url,services:[candidate.classification.serviceLine].filter(Boolean),audiences:[candidate.classification.audience].filter(Boolean),cities:[candidate.classification.geography].filter(Boolean)})
    const profile:OpportunityProfile={kind:OPPORTUNITY_PROFILE_KIND,version:1,classification:candidate.classification,variables:candidate.variables,intelligence:{...candidate.intelligence,signalStrength:clamp(candidate.intelligence.signalStrength),sourceReliability:clamp(candidate.intelligence.sourceReliability),strategicFit:clamp(candidate.intelligence.strategicFit)},planning:candidate.planning,decision:{status:candidate.intelligence.strategicFit>=75?'recommended':'qualified'},sources:result.sources.filter(source=>!candidate.sourceUrls?.length||candidate.sourceUrls.includes(source.url)),conversion:profileFrom(signal)?.conversion||{status:'not_started',records:[]}}
    const patch=await supabase.from('market_content_signals').update({summary:candidate.summary,status:profile.decision.status==='recommended'?'qualified':signal.status==='captured'?'verified':signal.status,confidence:profile.intelligence.sourceReliability,urgency:Math.max(0,100-Math.min(100,profile.planning.preparationHorizonDays)),opportunity_score:profile.intelligence.strategicFit,freshness:profile.intelligence.freshness,ai_interpretation:profile.intelligence.explanation,evidence:signalEvidence(signal,profile),next_scan_at:datePlus(7),updated_at:now()}).eq('id',signal.id).select('*').single()
    if(patch.error)throw patch.error
    signal=patch.data as MarketSignal
    if(duplicate)updated.push(signal);else created.push(signal);seen.add(key);if(!latest.some(item=>item.id===signal.id))latest.push(signal)
  }
  await auditContentHeadquarters({actorId:input.actorId,actorName:input.actorName,action:'opportunity_intelligence.scan_completed',entityType:'signal',detail:{created:created.length,updated:updated.length,runtimeStatus:result.status,provider:result.providerType,model:result.model,researchRun,warnings:result.warnings}})
  return {created,updated,runtime:{status:result.status,providerType:result.providerType,model:result.model,sources:result.sources,warnings:result.warnings,alternatives:result.alternatives},researchRun}
}

async function requireSignal(id:string){const supabase=await createServiceClient() as any;const result=await supabase.from('market_content_signals').select('*').eq('id',id).single();if(result.error||!result.data)throw new Error('OPPORTUNITY_NOT_FOUND');return result.data as MarketSignal}
async function saveProfile(signal:MarketSignal,profile:OpportunityProfile,patch:JsonRecord={}){const supabase=await createServiceClient() as any;const result=await supabase.from('market_content_signals').update({...patch,evidence:signalEvidence(signal,profile),updated_at:now()}).eq('id',signal.id).select('*').single();if(result.error)throw result.error;return result.data as MarketSignal}


export async function createManualOpportunity(input:{actorId:string;actorName:string;title:string;summary:string;reason:string;profilePatch?:JsonRecord}){
  if(!clean(input.title)||!clean(input.summary))throw new Error('OPPORTUNITY_TITLE_AND_SUMMARY_REQUIRED')
  let signal=await createMarketSignal({actorId:input.actorId,actorName:input.actorName,title:clean(input.title),summary:clean(input.summary),sourceType:'manual_opportunity',sourceLabel:'Constitution humaine',services:[],audiences:[],cities:[]})
  const base=derivedProfile(signal);const patch=input.profilePatch||{}
  const profile={...base,classification:{...base.classification,...record(patch.classification)},variables:{...base.variables,...record(patch.variables),sourceRequirements:patch.sourceRequirements?arr(patch.sourceRequirements):base.variables.sourceRequirements,brandConstraints:patch.brandConstraints?arr(patch.brandConstraints):base.variables.brandConstraints},planning:{...base.planning,...record(patch.planning)},intelligence:{...base.intelligence,...record(patch.intelligence),uncertainty:'Opportunité constituée manuellement; sources à joindre ou validation sous conditions.'},decision:{...base.decision,status:'under_review' as OpportunityDecisionStatus}} as OpportunityProfile
  signal=await saveProfile(signal,profile,{services:[profile.classification.serviceLine].filter(Boolean),audiences:[profile.classification.audience].filter(Boolean),cities:[profile.classification.geography].filter(Boolean),opportunity_score:clamp(profile.intelligence.strategicFit),confidence:clamp(profile.intelligence.sourceReliability),human_conclusion:input.reason})
  await auditContentHeadquarters({actorId:input.actorId,actorName:input.actorName,action:'content_opportunity.manual_created',entityType:'signal',entityId:signal.id,detail:{reason:input.reason}})
  return publicOpportunity(signal)
}

export async function updateOpportunityProfile(input:{actorId:string;actorName:string;signalId:string;title?:string;summary?:string;profilePatch?:JsonRecord;reason:string}){
 const signal=await requireSignal(input.signalId);const current=profileFrom(signal)||derivedProfile(signal);const patch=input.profilePatch||{};const next={...current,classification:{...current.classification,...record(patch.classification)},variables:{...current.variables,...record(patch.variables),sourceRequirements:patch.sourceRequirements?arr(patch.sourceRequirements):current.variables.sourceRequirements,brandConstraints:patch.brandConstraints?arr(patch.brandConstraints):current.variables.brandConstraints},intelligence:{...current.intelligence,...record(patch.intelligence)},planning:{...current.planning,...record(patch.planning)},decision:{...current.decision,...record(patch.decision)}} as OpportunityProfile
 const saved=await saveProfile(signal,next,{title:input.title||signal.title,summary:input.summary||signal.summary,services:[next.classification.serviceLine].filter(Boolean),audiences:[next.classification.audience].filter(Boolean),cities:[next.classification.geography].filter(Boolean),opportunity_score:clamp(next.intelligence.strategicFit),confidence:clamp(next.intelligence.sourceReliability)})
 await auditContentHeadquarters({actorId:input.actorId,actorName:input.actorName,action:'content_opportunity.edited',entityType:'signal',entityId:signal.id,detail:{reason:input.reason}});return publicOpportunity(saved)
}

export async function decideOpportunity(input:{actorId:string;actorName:string;signalId:string;decision:'validate'|'select'|'defer'|'reject'|'expire'|'reopen';reason:string;conditions?:string[]}){
 const signal=await requireSignal(input.signalId);const profile=profileFrom(signal)||derivedProfile(signal);const map={validate:['qualified','validated'],select:['qualified','selected'],defer:['deferred','deferred'],reject:['rejected','rejected'],expire:['expired','expired'],reopen:['captured','under_review']} as const;const [status,decisionStatus]=map[input.decision];profile.decision={...profile.decision,status:decisionStatus as OpportunityDecisionStatus,decisionReason:input.reason,conditions:input.conditions||[],selectedBy:input.decision==='select'?input.actorName:profile.decision.selectedBy,selectedAt:input.decision==='select'?now():profile.decision.selectedAt,validatedBy:input.decision==='validate'?input.actorName:profile.decision.validatedBy,validatedAt:input.decision==='validate'?now():profile.decision.validatedAt};const saved=await saveProfile(signal,profile,{status,human_conclusion:input.reason});await auditContentHeadquarters({actorId:input.actorId,actorName:input.actorName,action:`content_opportunity.${input.decision}`,entityType:'signal',entityId:signal.id,detail:{reason:input.reason,conditions:input.conditions||[]}});return publicOpportunity(saved)
}

function defaultTasks(profile:OpportunityProfile,title:string){return [
 ['Vérifier les sources et la fenêtre','Confirmer les sources, dates, fraîcheur et durée de l’opportunité.'],['Finaliser la stratégie et le brief',`Constituer l’angle ${profile.classification.angle}, le message, le CTA et les preuves.`],['Constituer le copy / script','Produire le texte maître aligné avec le brief validé.'],['Produire le format principal',`Créer ${profile.classification.format} pour ${profile.classification.channels.join(', ')||'les canaux sélectionnés'}.`],['Créer les variantes','Adapter formats, langues, angles et canaux prévus.'],['Contrôler la cohérence de marque','Inspecter doctrine, message, sources, CTA et qualité.'],['Soumettre les preuves de production','Joindre versions, previews et éléments de preuve.'],['Review professionnelle','Appliquer la rubrique adaptée et créer les constats.'],['Corriger et resoumettre','Résoudre les constats bloquants et produire une nouvelle version.'],['Validation formelle','Préparer la décision humaine sur la version correcte.'],['Préparer distribution et publication','Constituer packages, planning, autorisation et preuve attendue.'],['Observer et apprendre','Mesurer, attribuer, optimiser et enregistrer la leçon institutionnelle.']
 ].map(([task,description])=>({title:`${task} · ${title}`,description,evidenceRequired:true,completionDefinition:'État persisté, preuve attachée et prochain handover disponible.'}))}

export async function convertOpportunityToWorkflow(input:{actorId:string;actorName:string;signalId:string;mode:'single'|'bundle';reason:string;ownerId?:string;ownerName?:string;reviewerId?:string;reviewerName?:string;aiDirectorId?:string}){
 let signal=await requireSignal(input.signalId);let profile=profileFrom(signal)||derivedProfile(signal);if(profile.decision.status!=='validated'){profile.decision={...profile.decision,status:'validated',validatedBy:input.actorName,validatedAt:now(),decisionReason:input.reason||'Validation et conversion autorisées.'};signal=await saveProfile(signal,profile,{status:'qualified',human_conclusion:profile.decision.decisionReason})}
 const conversion=profile.conversion||{status:'not_started',records:[]};conversion.status='in_progress';profile.conversion=conversion;signal=await saveProfile(signal,profile)
 let strategyId=conversion.strategyId||null;let actionPlanId=conversion.actionPlanId||null
 if(!strategyId){const strategy=await createStrategy({actorId:input.actorId,actorName:input.actorName,title:`Stratégie · ${signal.title}`,problemStatement:profile.variables.customerProblem||signal.summary,businessObjective:profile.classification.businessObjective,contentObjective:profile.classification.campaignObjective||profile.variables.messagePromise,signalIds:[signal.id],services:[profile.classification.serviceLine],audiences:[profile.classification.audience],cities:[profile.classification.geography]});strategyId=strategy.id;conversion.strategyId=strategyId;signal=await saveProfile(signal,profile)}
 if(!actionPlanId){const plan=await compileStrategyToPlan({actorId:input.actorId,actorName:input.actorName,strategyId,title:`Plan de contenu · ${signal.title}`,objective:profile.classification.campaignObjective,deliverables:(profile.variables.variants.length?profile.variables.variants:[{format:profile.classification.format,channel:profile.classification.channels[0]||'À confirmer'}]).map(v=>({format:v.format,channel:v.channel,angle:v.angle||profile.classification.angle})),requiredRoles:['Content strategist','Copywriter','Creative producer','Reviewer','Publisher'],capacityHours:Math.max(8,(profile.variables.variants.length||1)*6)});actionPlanId=plan.id;conversion.actionPlanId=actionPlanId;signal=await saveProfile(signal,profile)}
 const variants=(input.mode==='bundle'&&profile.variables.variants.length?profile.variables.variants:[{format:profile.classification.format,channel:profile.classification.channels[0]||'À confirmer',angle:profile.classification.angle,language:profile.classification.language}]).slice(0,8)
 for(const variant of variants){if(conversion.records.some(item=>normalize(item.format)===normalize(variant.format)&&normalize(item.channel)===normalize(variant.channel)))continue
  const dossier=await createContentDossier({actorId:input.actorId,actorName:input.actorName,title:`${signal.title} · ${variant.format}`,family:profile.classification.contentFamily,category:profile.classification.theme,subcategory:variant.angle||profile.classification.angle,serviceKey:normalize(profile.classification.serviceLine).replaceAll(' ','_').slice(0,40)||'general',serviceLabel:profile.classification.serviceLine,strategyId,audience:profile.classification.audience,city:profile.classification.geography,language:variant.language||profile.classification.language,channel:variant.channel,journeyStage:profile.classification.funnelStage,objective:profile.classification.campaignObjective,messagePillar:profile.variables.messagePromise,cta:profile.variables.callToAction,ownerId:input.ownerId,ownerName:input.ownerName,reviewerId:input.reviewerId,reviewerName:input.reviewerName,aiDirectorId:input.aiDirectorId,dueAt:profile.planning.productionDeadline||undefined,brief:{opportunityId:signal.id,opportunityCode:signal.code,whyNow:profile.variables.whyNow,whatChanged:profile.variables.whatChanged,audience:profile.classification.audience,buyerProfile:profile.classification.buyerProfile,problem:profile.variables.customerProblem,desire:profile.variables.customerDesire,messagePromise:profile.variables.messagePromise,proofPoint:profile.variables.proofPoint,callToAction:profile.variables.callToAction,format:variant.format,channel:variant.channel,measurementPlan:profile.variables.measurementPlan,sources:profile.sources},scopeConstitution:{sourceOpportunity:signal.id,publicationWindowStart:profile.planning.publicationWindowStart,publicationWindowEnd:profile.planning.publicationWindowEnd,brandConstraints:profile.variables.brandConstraints,sourceRequirements:profile.variables.sourceRequirements,variants:profile.variables.variants}})
  const mission=await createMission({actorId:input.actorId,actorName:input.actorName,strategyId,actionPlanId,dossierId:dossier.id,title:`Mission de production · ${dossier.title}`,objective:profile.classification.campaignObjective,scope:`Produire, vérifier, valider, distribuer et mesurer ${variant.format} sur ${variant.channel}.`,successDefinition:'Contenu produit, version validée, publication confirmée et observation ouverte.',priority:profile.planning.preparationHorizonDays<=14?'high':'medium',assignedTo:input.ownerId,assignedToName:input.ownerName,reviewerId:input.reviewerId,reviewerName:input.reviewerName,aiDirectorId:input.aiDirectorId,dueAt:profile.planning.productionDeadline||undefined,tasks:defaultTasks(profile,dossier.title)})
  const supabase=await createServiceClient() as any;await supabase.from('market_content_dossiers').update({mission_id:mission.id,status:'brief',classification:{opportunityId:signal.id,origin:profile.classification.origin,trendType:profile.classification.trendType,theme:profile.classification.theme,angle:variant.angle||profile.classification.angle,format:variant.format,channel:variant.channel},updated_at:now()}).eq('id',dossier.id)
  conversion.records.push({dossierId:dossier.id,missionId:mission.id,contentCode:dossier.content_code,format:variant.format,channel:variant.channel});profile.conversion=conversion;signal=await saveProfile(signal,profile)
 }
 conversion.status='completed';conversion.convertedAt=now();conversion.convertedBy=input.actorName;profile.decision.status='converted';profile.conversion=conversion;signal=await saveProfile(signal,profile,{status:'converted',human_conclusion:input.reason||'Opportunité validée et convertie en workflow de production.'})
 await auditContentHeadquarters({actorId:input.actorId,actorName:input.actorName,action:'content_opportunity.converted',entityType:'signal',entityId:signal.id,detail:{strategyId,actionPlanId,records:conversion.records,mode:input.mode,reason:input.reason}});return {opportunity:publicOpportunity(signal),strategyId,actionPlanId,records:conversion.records}
}

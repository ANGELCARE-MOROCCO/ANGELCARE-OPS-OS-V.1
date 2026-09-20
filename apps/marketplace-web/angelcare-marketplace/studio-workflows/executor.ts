import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import { requireMarketplaceApiContext } from '@/angelcare-marketplace/auth/context'
import { asMarketplaceError,MarketplaceError } from '@/angelcare-marketplace/server/errors'
import { createPublicInquiry,recordPublicEvent } from '@/angelcare-marketplace/public-universe/repository'
import { createPublicDiagnosticRequest } from '@/angelcare-marketplace/b2b-verticals/repository'
import { createQuoteRequest } from '@/angelcare-marketplace/family-experience/repository'
import { createPublicConversionSession,updatePublicConversionSession,revalidateConversionPrice,revalidateConversionAvailability,recordConversionConsent,confirmPublicConversion } from '@/angelcare-marketplace/conversion-universe/repository'
import { getStudioWorkflowDescriptor } from './registry'
import { serverStudioAttribution } from '@/angelcare-marketplace/studio-attribution/server'
import type { StudioWorkflowDescriptor,StudioWorkflowSubmissionInput,StudioWorkflowSubmissionResult,StudioWorkflowValue } from './types'

const text=(v:unknown,max=4000)=>String(v??'').trim().slice(0,max)
const bool=(v:unknown)=>v===true||v==='true'||v==='on'
const number=(v:unknown)=>{const n=Number(v);return Number.isFinite(n)?n:null}
const live=(s:string)=>!['archived','disabled','deleted','draft','review','in_review'].includes(s.toLowerCase())
const values=(input:StudioWorkflowSubmissionInput)=>input.values||{}
const stringArray=(v:unknown)=>Array.isArray(v)?v.map(x=>text(x,300)).filter(Boolean):text(v,2000).split(/\r?\n|,/).map(x=>x.trim()).filter(Boolean).slice(0,30)

function validateFields(descriptor:StudioWorkflowDescriptor,input:StudioWorkflowSubmissionInput){
  const row=values(input)
  for(const field of descriptor.fields){const raw=row[field.key];if(field.required){if(field.type==='checkbox'&&!bool(raw))throw new MarketplaceError('VALIDATION_ERROR',`${field.label} est requis.`);if(field.type!=='checkbox'&&!text(raw).length)throw new MarketplaceError('VALIDATION_ERROR',`${field.label} est requis.`)}const value=text(raw,field.maxLength||4000);if(field.minLength&&value&&value.length<field.minLength)throw new MarketplaceError('VALIDATION_ERROR',`${field.label} est trop court.`);if(field.maxLength&&value.length>field.maxLength)throw new MarketplaceError('VALIDATION_ERROR',`${field.label} dépasse la taille autorisée.`);if(field.type==='number'&&raw!==''&&raw!=null){const n=number(raw);if(n===null)throw new MarketplaceError('VALIDATION_ERROR',`${field.label} est invalide.`);if(field.min!=null&&n<field.min)throw new MarketplaceError('VALIDATION_ERROR',`${field.label} est inférieur au minimum autorisé.`);if(field.max!=null&&n>field.max)throw new MarketplaceError('VALIDATION_ERROR',`${field.label} dépasse le maximum autorisé.`)}}
}

async function catalogTarget(input:StudioWorkflowSubmissionInput){
  const target=input.reference.target;if(!target||target.sourceId!=='catalog.items')throw new MarketplaceError('VALIDATION_ERROR','Une offre Marketplace publiée doit être sélectionnée.')
  const db=await createServiceClient();const {data,error}=await db.from('angelcare_marketplace_catalog_items').select('id,slug,item_key,category_key,status,operational_status').eq('id',target.entityId).maybeSingle();if(error)throw new MarketplaceError('DEPENDENCY_BLOCKED','Impossible de vérifier l’offre sélectionnée.');const state=String(data?.status||data?.operational_status||'').trim();if(!data||!state||!live(state))throw new MarketplaceError('NOT_FOUND','L’offre sélectionnée n’est plus publiée.')
  return data as {id:string;slug:string;item_key:string;category_key:string;status:string;operational_status:string|null}
}

async function executeInquiry(descriptor:StudioWorkflowDescriptor,input:StudioWorkflowSubmissionInput,request:Request):Promise<StudioWorkflowSubmissionResult>{
  const v=values(input);const result=await createPublicInquiry({audience:descriptor.audience||'other',sourceRoute:text(input.sourceRoute,300)||'/',fullName:text(v.fullName,180),email:text(v.email,250)||null,phone:text(v.phone,80)||null,organization:text(v.organization,240)||null,city:text(v.city,120)||null,message:text(v.message,4000),consent:bool(v.consent),locale:input.locale,territoryCode:text(input.territoryCode,50)||null,honeypot:text(v.website,300)||null,sourceMetadata:{studioAttribution:input.attribution||{}}},request)
  return{workflowId:descriptor.id,status:'SUBMITTED',publicReference:result.public_reference,canonicalObjectType:'public_inquiry',adminDestination:descriptor.adminDestination,nextHref:null,message:'Demande enregistrée.'}
}

async function executeB2B(descriptor:StudioWorkflowDescriptor,input:StudioWorkflowSubmissionInput):Promise<StudioWorkflowSubmissionResult>{
  const v=values(input);const result=await createPublicDiagnosticRequest({vertical:descriptor.b2bVertical,organizationName:text(v.organizationName,180),email:text(v.email,180),phone:text(v.phone,40),city:text(v.city,100),capacity:number(v.capacity),urgency:text(v.urgency,40)||'exploration',needs:text(v.needs,3000),sourceLocale:input.locale,consent:bool(v.consent)?'on':'off'})
  return{workflowId:descriptor.id,status:'SUBMITTED',publicReference:result.publicReference,canonicalObjectType:'b2b_public_request',adminDestination:descriptor.adminDestination,nextHref:null,message:'Demande professionnelle enregistrée.'}
}

async function executeFamily(descriptor:StudioWorkflowDescriptor,input:StudioWorkflowSubmissionInput,request:Request,requestId:string):Promise<StudioWorkflowSubmissionResult>{
  const item=await catalogTarget(input);let context;try{context=await requireMarketplaceApiContext('marketplace.family.requests.create')}catch(error){const normalized=asMarketplaceError(error);if(['AUTHENTICATION_REQUIRED','PERMISSION_DENIED','FORBIDDEN'].includes(normalized.code))throw new MarketplaceError('AUTHENTICATION_REQUIRED','Connectez-vous à votre espace famille pour envoyer cette demande.');throw error}
  const v=values(input);const result=await createQuoteRequest({childId:null,diagnosticId:null,serviceFamily:item.item_key,city:text(v.city,120),requestedStartDate:text(v.requestedStartDate,20)||null,schedule:{},durationExpectation:text(v.durationExpectation,120)||null,locationNotes:text(v.locationNotes,2000)||null,priorities:stringArray(v.priorities),context,requestId,sourceAttribution:input.attribution||null})
  return{workflowId:descriptor.id,status:'SUBMITTED',publicReference:result.public_reference,canonicalObjectType:'family_quote_request',adminDestination:descriptor.adminDestination,nextHref:null,message:'Demande famille enregistrée.'}
}

async function executeConversion(descriptor:StudioWorkflowDescriptor,input:StudioWorkflowSubmissionInput):Promise<StudioWorkflowSubmissionResult>{
  const item=await catalogTarget(input);const v=values(input);const visitor=text(input.visitorReference,180);const idem=text(input.idempotencyKey,220);if(!visitor||!idem)throw new MarketplaceError('VALIDATION_ERROR','Référence visiteur ou idempotence manquante.')
  const identity:Record<string,unknown>={fullName:text(v.fullName||v.contactName,180),contactName:text(v.contactName||v.fullName,180),organizationName:text(v.organizationName,240),email:text(v.email,250),phone:text(v.phone,80),city:text(v.city,120)}
  const configuration:Record<string,unknown>={studioWorkflowId:descriptor.id,city:text(v.city,120),requestedDate:text(v.requestedDate,20),startTime:text(v.startTime,20),duration:text(v.duration,120),locationType:text(v.locationType,80),locationNotes:text(v.locationNotes,2000),needs:text(v.needs,3000),quantity:number(v.quantity)||1,learnerType:text(v.learnerType,80),organizationName:text(v.organizationName,240),tenantType:text(v.tenantType,80),sites:number(v.sites),users:number(v.users),requestedModules:stringArray(v.requestedModules),notes:text(v.notes,2000)}
  const session=await createPublicConversionSession({itemSlug:item.slug,locale:input.locale,journey:descriptor.conversionJourney,visitorReference:visitor,sourceRoute:text(input.sourceRoute,500)||'/',territoryCode:text(input.territoryCode,80)||null,idempotencyKey:`p07:${descriptor.id}:${idem}`,initialConfiguration:configuration,attribution:input.attribution})
  await updatePublicConversionSession({sessionKey:session.session_key,visitorReference:visitor,identity,configuration,status:'availability_pending',territoryCode:text(input.territoryCode,80)||null})
  await revalidateConversionPrice({sessionKey:session.session_key,visitorReference:visitor,quantity:Math.max(1,number(v.quantity)||1)})
  const availability=await revalidateConversionAvailability({sessionKey:session.session_key,visitorReference:visitor,quantity:Math.max(1,number(v.quantity)||1),configuration})
  if(availability.status==='unavailable')throw new MarketplaceError('CONFLICT',availability.reason||'Cette offre n’est pas disponible pour la configuration demandée.')
  for(const key of descriptor.consentKeys)await recordConversionConsent({sessionKey:session.session_key,visitorReference:visitor,consentKey:key,consentVersion:'2026.1',locale:input.locale,accepted:bool(v.consent),evidence:{channel:'studio_workflow',workflowId:descriptor.id,sourceRoute:input.sourceRoute}})
  if(item.category_key==='health-partners')await recordConversionConsent({sessionKey:session.session_key,visitorReference:visitor,consentKey:'non_medical_boundary',consentVersion:'2026.1',locale:input.locale,accepted:bool(v.consent),evidence:{channel:'studio_workflow',workflowId:descriptor.id}})
  await updatePublicConversionSession({sessionKey:session.session_key,visitorReference:visitor,status:'ready'})
  const outcome=await confirmPublicConversion({sessionKey:session.session_key,visitorReference:visitor,idempotencyKey:`p07-confirm:${descriptor.id}:${idem}`})
  return{workflowId:descriptor.id,status:outcome.status==='handover_pending'?'HANDOVER_PENDING':'SUBMITTED',publicReference:outcome.public_reference,canonicalObjectType:outcome.canonical_object_type,adminDestination:descriptor.adminDestination,nextHref:null,message:outcome.status==='handover_pending'?'Demande enregistrée et transmise pour qualification.':'Demande confirmée dans le moteur canonique.'}
}

export async function executeStudioWorkflow(input:StudioWorkflowSubmissionInput,request:Request,requestId:string):Promise<StudioWorkflowSubmissionResult>{
  const descriptor=getStudioWorkflowDescriptor(input.reference.workflowId);if(!descriptor)throw new MarketplaceError('NOT_FOUND','Workflow Studio inconnu.')
  if(descriptor.targetRequired&&!input.reference.target)throw new MarketplaceError('VALIDATION_ERROR','Une cible canonique est requise pour ce workflow.')
  if(input.reference.target&&descriptor.targetSources.length&&!descriptor.targetSources.includes(input.reference.target.sourceId))throw new MarketplaceError('VALIDATION_ERROR','Type de cible non autorisé pour ce workflow.')
  const attribution=serverStudioAttribution(input.attribution,request,input.visitorReference)
  const enriched:StudioWorkflowSubmissionInput={...input,attribution:{...attribution,workflowId:descriptor.id}}
  validateFields(descriptor,enriched)
  let result:StudioWorkflowSubmissionResult
  if(descriptor.execution==='public_inquiry')result=await executeInquiry(descriptor,enriched,request)
  else if(descriptor.execution==='b2b_diagnostic')result=await executeB2B(descriptor,enriched)
  else if(descriptor.execution==='family_request')result=await executeFamily(descriptor,enriched,request,requestId)
  else if(descriptor.execution==='conversion')result=await executeConversion(descriptor,enriched)
  else throw new MarketplaceError('CONFIGURATION_ERROR','Mode de workflow non supporté.')
  await recordPublicEvent({eventName:'studio_workflow_submitted',route:text(input.sourceRoute,300)||'/',locale:input.locale,territoryCode:text(input.territoryCode,50)||null,data:{workflowId:descriptor.id,canonicalObjectType:result.canonicalObjectType,publicReference:result.publicReference,studioAttribution:attribution}}).catch(()=>undefined)
  return result
}

import 'server-only'
import type {AdaptiveExperienceData} from '@/angelcare-marketplace/category-native-experience/types'
import {getStudioActionDescriptor} from '@/angelcare-marketplace/studio-action-registry/registry'
import {getStudioWorkflowDescriptor} from '@/angelcare-marketplace/studio-workflows/registry'
import {publicExperienceDoctrineRecipe} from './doctrine-recipes'
import {publicExperienceResolvedContext} from './detail-resolver'
import type {PublicExperience360,PublicExperience360Action,PublicExperience360Relation} from './types'
import {loadPublicExperienceRelationGraph} from './relation-graph'
import {buildDomainExtension} from './public-experience-adapters'
import {loadAcademyPublicProjection,loadPublicSafeProviders} from './public-safe-projections'

const number=(v:unknown)=>Number.isFinite(Number(v))?Number(v):null
const text=(v:unknown)=>typeof v==='string'?v.trim():''
const obj=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{ }
const arr=(v:unknown)=>Array.isArray(v)?v:[]

function reviewProjection(data:AdaptiveExperienceData){const metadata=obj(data.item.metadata);const rating=number(metadata.rating??metadata.review_rating??metadata.average_rating),count=number(metadata.review_count??metadata.reviews_count);return{rating,count,source:rating!==null||count!==null?'catalog.metadata':null}}
function recommendationRelations(data:AdaptiveExperienceData):PublicExperience360Relation[]{return data.recommendations.map(item=>({kind:'recommendation',entityId:item.id,slug:item.slug,label:item.name,metadata:{kind:item.kind,category:item.category_key,availability:item.availability_status}}))}
function actions(data:AdaptiveExperienceData):PublicExperience360Action[]{const recipe=publicExperienceDoctrineRecipe(data.schema.schema_key);if(!recipe)return[];return recipe.requiredActions.map(actionId=>{const descriptor=getStudioActionDescriptor(actionId);const workflow=recipe.requiredWorkflows.find(id=>getStudioWorkflowDescriptor(id)?.actionId===actionId)||null;return{actionId,label:descriptor?.label||actionId,workflowId:workflow,available:Boolean(descriptor),reason:descriptor?null:'ACTION_DESCRIPTOR_MISSING',adminDestination:descriptor?.adminDestination||(workflow?getStudioWorkflowDescriptor(workflow)?.adminDestination||null:null)}})}
export async function buildPublicExperience360(data:AdaptiveExperienceData):Promise<PublicExperience360>{
 const context=await publicExperienceResolvedContext(data),review=reviewProjection(data),relationLoad=await loadPublicExperienceRelationGraph(data.item.id),recommendations=recommendationRelations(data)
 relationLoad.graph.recommendations=recommendations
 const relationRows=[...relationLoad.graph.accessories,...relationLoad.graph.bundles,...relationLoad.graph.upsells,...relationLoad.graph.alternatives,...relationLoad.graph.recommendations,...relationLoad.graph.collections,...relationLoad.graph.placements]
 const fulfillment=obj(relationLoad.raw.fulfillmentConfig)
 const [providerProjection,academyProjection]=await Promise.all([
  context.masterDomain==='b2c_service_family'?loadPublicSafeProviders({preferredProviderIds:fulfillment.preferred_provider_ids||fulfillment.preferredProviderIds||[],doctrineKey:context.doctrineKey,territoryId:data.item.territory_id||null}):Promise.resolve([]),
  context.masterDomain==='academy_admission'?loadAcademyPublicProjection(data.item.id):Promise.resolve(null),
 ])
 const domainExtension=buildDomainExtension({data,masterDomain:context.masterDomain,raw:relationLoad.raw,relations:relationLoad.graph,providerProjection,academyProjection:academyProjection as Record<string,unknown>|null})
 return{version:1,generatedAt:new Date().toISOString(),classification:{experienceClass:'offer_detail',masterDomain:context.masterDomain,catalogKind:data.item.kind,doctrineKey:context.doctrineKey,businessFamilyKey:context.businessFamilyKey,schemaKey:data.schema.schema_key,categoryKey:data.item.category_key||null,entityKey:data.item.item_key,locale:data.locale,territoryId:data.item.territory_id||null,audienceId:null},identity:{id:data.item.id,publicReference:data.item.public_reference,itemKey:data.item.item_key,slug:data.item.slug,name:data.item.name,shortDescription:data.item.short_description,description:data.item.description},content:{schemaName:data.schema.name_fr||data.schema.schema_key,schemaDescription:data.schema.description_fr||'',fields:data.fieldValues.map(row=>({key:row.field.field_key,section:row.field.section_key,label:row.field.label_fr,value:row.value,formatted:row.formatted}))},media:data.media.map(row=>({...row})),pricing:{mode:data.price.mode,amount:data.price.amount,currency:data.price.currencyLabel,label:data.price.label,source:data.price.source},availability:{status:data.availability.status,authority:data.availability.authority,availableQuantity:data.availability.availableQuantity,startsAt:data.availability.startsAt,endsAt:data.availability.endsAt,reason:data.availability.reason},variants:{groups:data.variantGroups.map(row=>({...row})),items:data.variants.map(row=>({...row})),count:data.variants.length},trust:{claims:data.trust.map(row=>({...row})),provenCount:data.trust.filter(row=>row.status==='verified'||row.status==='active'||Boolean(row.evidenceReference)).length},reviews:review,relations:relationRows,recommendations:data.recommendations.map(item=>({id:item.id,slug:item.slug,kind:item.kind,name:item.name,priceAmount:item.price_amount,currency:item.currency_label,availability:item.availability_status,mediaUrl:item.media_url})),actions:actions(data),domainExtension,sourceAuthorities:['category-native','catalog-discovery','catalog-media','catalog-pricing','availability-authority','trust-authority','product-360.relation_config','homepage.collections','homepage.placements',...(providerProjection.length?['provider-workforce.public-safe']:[]),...(academyProjection?['academy-engine.public-safe']:[])]}
}

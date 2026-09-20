import type { AdaptiveExperienceData } from '@/angelcare-marketplace/category-native-experience/types'
import type { StudioLiveBindingContext } from './types'

const fieldLabel=(data:AdaptiveExperienceData,row:AdaptiveExperienceData['fieldValues'][number])=>data.locale==='ar'?row.field.label_ar:data.locale==='en'?row.field.label_en:row.field.label_fr
const availabilityLabel=(locale:AdaptiveExperienceData['locale'],status:string)=>{
  const labels:Record<string,[string,string,string]>={available:['Disponible','Available','متاح'],hold_required:['Réservation à confirmer','Confirmation required','يتطلب التأكيد'],configuration_required:['Configuration requise','Configuration required','يتطلب الإعداد'],unavailable:['Indisponible','Unavailable','غير متاح']}
  const row=labels[status]||[status,status,status];return locale==='ar'?row[2]:locale==='en'?row[1]:row[0]
}
const obj=(v:unknown):Record<string,unknown>=>v&&typeof v==='object'&&!Array.isArray(v)?v as Record<string,unknown>:{ }
const items=(v:unknown)=>Array.isArray(v)?v.filter(x=>x&&typeof x==='object'):[]
const fieldValue=(data:AdaptiveExperienceData,...keys:string[])=>data.fieldValues.find(row=>keys.includes(row.field.field_key))?.value
const structuredItems=(v:unknown)=>Array.isArray(v)?v.map((row,index)=>typeof row==='object'&&row?{title:String((row as any).title||(row as any).name||(row as any).label||`Élément ${index+1}`),label:String((row as any).label||(row as any).type||''),body:String((row as any).body||(row as any).description||''),value:String((row as any).id||(row as any).key||index)}:{title:String(row),label:'',body:'',value:String(row)}):[]

export function createCatalogItemLiveBindingContext(data:AdaptiveExperienceData):StudioLiveBindingContext{
  const primary=data.media[0]||null,meta=obj(data.item.metadata),config=obj(data.item.experience_configuration),schemaConfig=obj(data.schema.configuration)
  const fields=data.fieldValues.map(row=>({title:fieldLabel(data,row),label:row.field.section_key||'details',body:row.formatted,value:row.formatted}))
  const gallery=data.media.map(row=>({title:row.alt,label:row.type,body:'',mediaUrl:row.url,mediaAlt:row.alt,value:row.key}))
  const trust=data.trust.map(row=>({title:row.label,label:row.status,body:row.evidenceReference||'',value:row.key}))
  const variants=data.variants.map(row=>({title:row.name,label:row.status,body:row.priceDelta==null?'':`${row.priceDelta>=0?'+':''}${row.priceDelta} ${data.price.currencyLabel}`,value:row.key}))
  const recommendations=data.recommendations.map(row=>({title:row.name,label:row.category_title||row.kind,body:row.short_description||'',mediaUrl:row.media_url||'',value:row.id,slug:row.slug,price:row.price_amount,currency:row.currency_label,availability:row.availability_status}))
  const rating=Number(meta.rating??meta.review_rating??meta.average_rating),reviewCount=Number(meta.review_count??meta.reviews_count),reviews=Number.isFinite(rating)&&Number.isFinite(reviewCount)&&reviewCount>0?{rating,reviewCount}:null
  const curriculum=structuredItems(config.curriculum??meta.curriculum??fieldValue(data,'curriculum','programme','modules'))
  const modules=structuredItems(config.modules??meta.modules??fieldValue(data,'modules','course_modules'))
  const trainers=structuredItems(config.trainers??meta.trainers??fieldValue(data,'trainers','faculty'))
  const plans=structuredItems(config.plans??meta.plans??fieldValue(data,'plans','service_plans','formulas'))
  const providers=structuredItems(config.providers??meta.providers??fieldValue(data,'providers','eligible_providers'))
  const coverage=obj(config.coverage??meta.coverage??fieldValue(data,'coverage','territory'))
  const scheduleRules=obj(config.schedule_rules??meta.schedule_rules??fieldValue(data,'schedule_rules','availability_rules'))
  const bookingModes=structuredItems(config.booking_modes??schemaConfig.booking_modes??fieldValue(data,'booking_modes'))
  const certification=obj(config.certification??meta.certification??fieldValue(data,'certification','certificate'))
  const nextCohort=obj(config.next_cohort??meta.next_cohort??fieldValue(data,'next_cohort','cohort'))
  const b2bFit=obj(config.organisation_fit??meta.organisation_fit??fieldValue(data,'organisation_fit'))
  const deployment=obj(config.deployment_model??meta.deployment_model??fieldValue(data,'deployment_model'))
  const diagnostic=obj(config.diagnostic??meta.diagnostic??fieldValue(data,'diagnostic'))
  const urgency=obj(config.urgency??meta.urgency??fieldValue(data,'urgency','emergency'))
  const admission=obj(config.admission??meta.admission??fieldValue(data,'admission','admission_requirements'))
  const portfolioProof=structuredItems(config.portfolio_proof??meta.portfolio_proof??fieldValue(data,'portfolio_proof','proofs','references'))
  return{
    summary:{itemId:data.item.id,itemSlug:data.item.slug,itemName:data.item.name,locale:data.locale,schemaKey:data.schema.schema_key,family:data.definition.family,priceAuthority:data.price.source,availabilityAuthority:data.availability.authority,mediaCount:data.media.length,publicFieldCount:data.fieldValues.length,trustClaimCount:data.trust.length,variantCount:data.variants.length},
    values:{
      'item.name':data.item.name,'item.short_description':data.item.short_description,'item.description':data.item.description,
      'schema.name':data.locale==='ar'?data.schema.name_ar:data.locale==='en'?data.schema.name_en:data.schema.name_fr,'schema.description':data.schema.description_fr,
      'price.label':data.price.label,'price.amount':data.price.amount,'price.currency':data.price.currencyLabel,'price.mode':data.price.mode,
      'availability.label':availabilityLabel(data.locale,data.availability.status),'availability.reason':data.availability.reason,'availability.available_quantity':data.availability.availableQuantity,
      'media.primary.url':primary?.url||null,'media.primary.alt':primary?.alt||null,'media.gallery':gallery,
      'trust.primary':data.trust[0]?.label||null,'trust.claims':trust,'experience.fields':fields,'variants.items':variants,'variants.count':data.variants.length,
      'reviews.summary':reviews,'relations.recommendations':recommendations,
      'product.specifications':fields,'product.delivery':obj(config.fulfillment??meta.fulfillment??fieldValue(data,'delivery','fulfillment')),'product.accessories':recommendations,'product.bundles':recommendations,
      'service.plans':plans,'service.coverage':coverage,'service.bookingModes':bookingModes,'service.scheduleRules':scheduleRules,'service.providers':providers,'service.urgency':urgency,
      'academy.curriculum':curriculum,'academy.modules':modules,'academy.trainers':trainers,'academy.nextCohort':nextCohort,'academy.capacity':data.availability.availableQuantity,'academy.certification':certification,'academy.admission':admission,
      'b2b.organisationFit':b2bFit,'b2b.deploymentModel':deployment,'b2b.diagnostic':diagnostic,'b2b.programmes':recommendations,'b2b.portfolioProof':portfolioProof,
    },
  }
}

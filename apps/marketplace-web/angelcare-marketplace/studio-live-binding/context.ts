import type { AdaptiveExperienceData } from '@/angelcare-marketplace/category-native-experience/types'
import type { StudioLiveBindingContext } from './types'

const fieldLabel=(data:AdaptiveExperienceData,row:AdaptiveExperienceData['fieldValues'][number])=>data.locale==='ar'?row.field.label_ar:data.locale==='en'?row.field.label_en:row.field.label_fr
const availabilityLabel=(locale:AdaptiveExperienceData['locale'],status:string)=>{
  const labels:Record<string,[string,string,string]>={available:['Disponible','Available','متاح'],hold_required:['Réservation à confirmer','Confirmation required','يتطلب التأكيد'],configuration_required:['Configuration requise','Configuration required','يتطلب الإعداد'],unavailable:['Indisponible','Unavailable','غير متاح']}
  const row=labels[status]||[status,status,status];return locale==='ar'?row[2]:locale==='en'?row[1]:row[0]
}

export function createCatalogItemLiveBindingContext(data:AdaptiveExperienceData):StudioLiveBindingContext{
  const primary=data.media[0]||null
  const fields=data.fieldValues.map(row=>({title:fieldLabel(data,row),label:row.field.section_key||'details',body:row.formatted,value:row.formatted}))
  const gallery=data.media.map(row=>({title:row.alt,label:row.type,body:'',mediaUrl:row.url,mediaAlt:row.alt,value:row.key}))
  const trust=data.trust.map(row=>({title:row.label,label:row.status,body:row.evidenceReference||'',value:row.key}))
  const variants=data.variants.map(row=>({title:row.name,label:row.status,body:row.priceDelta==null?'':`${row.priceDelta>=0?'+':''}${row.priceDelta} ${data.price.currencyLabel}`,value:row.key}))
  return{
    summary:{itemId:data.item.id,itemSlug:data.item.slug,itemName:data.item.name,locale:data.locale,schemaKey:data.schema.schema_key,family:data.definition.family,priceAuthority:data.price.source,availabilityAuthority:data.availability.authority,mediaCount:data.media.length,publicFieldCount:data.fieldValues.length,trustClaimCount:data.trust.length,variantCount:data.variants.length},
    values:{
      'item.name':data.item.name,
      'item.short_description':data.item.short_description,
      'item.description':data.item.description,
      'schema.name':data.locale==='ar'?data.schema.name_ar:data.locale==='en'?data.schema.name_en:data.schema.name_fr,
      'schema.description':data.schema.description_fr,
      'price.label':data.price.label,
      'price.amount':data.price.amount,
      'price.currency':data.price.currencyLabel,
      'price.mode':data.price.mode,
      'availability.label':availabilityLabel(data.locale,data.availability.status),
      'availability.reason':data.availability.reason,
      'availability.available_quantity':data.availability.availableQuantity,
      'media.primary.url':primary?.url||null,
      'media.primary.alt':primary?.alt||null,
      'media.gallery':gallery,
      'trust.primary':data.trust[0]?.label||null,
      'trust.claims':trust,
      'experience.fields':fields,
      'variants.items':variants,
      'variants.count':data.variants.length,
    },
  }
}

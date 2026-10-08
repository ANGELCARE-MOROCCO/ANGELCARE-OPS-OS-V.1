import { findProductDoctrine } from './product-doctrine'

export type Product360Readiness = {
  ready: boolean
  reasons: string[]
  checks: Record<string, boolean>
}

type Row = Record<string, unknown>
const text=(value:unknown)=>String(value??'').trim()
const object=(value:unknown):Row=>value&&typeof value==='object'&&!Array.isArray(value)?value as Row:{}
const rows=(value:unknown):Row[]=>Array.isArray(value)?value.filter((entry):entry is Row=>Boolean(entry)&&typeof entry==='object'&&!Array.isArray(entry)):[]
const number=(value:unknown):number|null=>{if(value===''||value===null||value===undefined)return null;const parsed=Number(typeof value==='string'?value.replace(/\s/g,'').replace(',','.'):value);return Number.isFinite(parsed)?parsed:null}
const present=(value:unknown):boolean=>{
  if(value===null||value===undefined)return false
  if(Array.isArray(value))return value.length>0
  if(typeof value==='object')return Object.keys(value as Row).length>0
  if(typeof value==='string')return value.trim().length>0
  return true
}

/**
 * Canonical Product 360 publication readiness.
 * This function is deliberately persistence-agnostic so importer, Commerce Studio,
 * Marketplace Core and Product Command Studio can consume the exact same rule set.
 * Unknown doctrines fail closed rather than inheriting another product doctrine.
 */
export function evaluateProduct360ReadinessRecord(snapshot:Row, doctrineKey:string):Product360Readiness{
  const definition=findProductDoctrine(doctrineKey)
  const priceRules=rows(snapshot.priceRules).filter((entry)=>text(entry.status)==='active')
  const media=rows(snapshot.media).filter((entry)=>text(entry.status)==='active')
  const categories=rows(snapshot.categories)
  const availability=rows(snapshot.availability)
  const attributes=object(snapshot.attributes)
  const experience=object(snapshot.experience_config)
  const commercial=object(snapshot.commercial_metadata)
  const fulfillment=object(snapshot.fulfillment_config)
  const trust=object(snapshot.trust_config)
  const territory=object(snapshot.territory_config)
  const seo=object(snapshot.seo_metadata)
  const doctrineReady=Boolean(definition)&&Boolean(definition?.fields.filter((entry)=>entry.required).every((entry)=>
    [snapshot[entry.key],attributes[entry.key],experience[entry.key],commercial[entry.key],fulfillment[entry.key],trust[entry.key],territory[entry.key]].some(present)
  ))
  const checks:Record<string,boolean>={
    doctrine_known:Boolean(definition),
    identity:Boolean(text(snapshot.item_key)&&text(snapshot.slug)&&text(snapshot.name_fr)),
    content:Boolean(text(snapshot.short_description_fr)&&text(snapshot.description_fr)),
    doctrine:doctrineReady,
    pricing:text(snapshot.price_mode)==='quote_only'||number(snapshot.price_amount)!==null||priceRules.length>0,
    category:categories.length>0,
    media:media.some((entry)=>text(entry.media_key)==='primary'&&present(entry.asset_url)),
    availability:text(snapshot.availability_status)==='available'||availability.some((entry)=>entry.available===true),
    seo:Boolean(text(seo.title_fr)&&text(seo.description_fr)),
    fulfillment:['mode','lead_time','delivery_method','capacity_model','customer_handover'].every((key)=>present(fulfillment[key])),
    trust:['trust_headline','certifications','guarantees','safety_information','provider_requirements'].every((key)=>present(trust[key])),
  }
  const reasons=Object.entries(checks).filter(([,ok])=>!ok).map(([key])=>key==='doctrine_known'?'DOCTRINE_UNKNOWN':`${key.toUpperCase()}_MISSING`)
  return{ready:reasons.length===0,reasons,checks}
}

export const PRODUCT_360_READINESS_LABELS:Record<string,string>={
  identity:'Identité',content:'Contenu FR',doctrine:'Doctrine',pricing:'Pricing',category:'Catégorie',media:'Média principal',availability:'Disponibilité',seo:'SEO FR',fulfillment:'Fulfillment',trust:'Trust & preuves',
}

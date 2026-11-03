/**
 * ANGELCARE Supplier Ops MAX R1 — canonical provider-neutral contract.
 * No demo rows, no synthetic prices or ratings, no provider-specific IDs masquerading as SKUs.
 */
export const PROVIDERS = ['cj', 'fulfillbot', 'hypersku', 'eprolo'] as const
export type Provider = typeof PROVIDERS[number]
export type ProviderMode = 'configured'|'credential_missing'|'documentation_required'
export type ProviderCapability = 'search'|'details'|'variants'|'inventory'|'freight'|'orders'|'tracking'
export type ProviderState = {
  id: Provider; name: string; mode: ProviderMode; capabilities: ProviderCapability[];
  docs: string; note: string; credentialsConfigured: boolean
}
export type SupplierVariant = {
  id:string; sku:string; label:string; cost:number|null; stock:number|null;
  attributes:Record<string,string>; imageUrl:string|null
}
export type SupplierListing = {
  provider:Provider; productId:string; title:string; sku:string; imageUrl:string|null;
  images:string[]; currency:string; cost:number|null; stock:number|null; moq:number|null;
  category:string|null; description:string|null; variants:SupplierVariant[];
  sourceUrl:string|null; fetchedAt:string; provenance:'live_provider_api'
}
export type Selection = {
  id:string; provider:Provider; provider_product_id:string; title:string; sku:string;
  image_url:string|null; currency:string; cost:number|null; stock:number|null; supplier_moq:number|null;
  normalized:SupplierListing; catalog_item_id:string|null; category_key:string|null; category_keys:string[]; canonical_supplier_id:string|null; supplier_offer_id:string|null; selected_variant_ids:string[];
  status:'selected'|'review'|'ready'|'imported'|'published'|'archived';
  editorial:Editorial; compliance:Compliance;
  target_margin:number|null; shipping_cost:number|null; duty_cost:number|null;
  updated_at:string; created_at:string
}
export type Editorial = {
  name_fr:string; name_en:string; name_ar:string;
  short_fr:string; short_en:string; short_ar:string;
  description_fr:string; description_en:string; description_ar:string;
  seo_title_fr:string; seo_description_fr:string;
  seo_title_en:string; seo_description_en:string;
  seo_title_ar:string; seo_description_ar:string;
  fulfillment_lead_time:string; fulfillment_delivery_method:string;
  fulfillment_customer_handover:string;
  trust_headline:string; trust_certifications:string; trust_guarantees:string;
  trust_safety_information:string; trust_provider_requirements:string;
}
export type Compliance = {
  mediaRightsVerified:boolean; supplierQualified:boolean;
  childSafetyReviewed:boolean; destinationRegulationsReviewed:boolean;
  actualStockVerified:boolean; freightVerified:boolean; evidenceNotes:string
}
export const EMPTY_EDITORIAL:Editorial = {
  name_fr:'',name_en:'',name_ar:'',short_fr:'',short_en:'',short_ar:'',
  description_fr:'',description_en:'',description_ar:'',
  seo_title_fr:'',seo_description_fr:'',seo_title_en:'',seo_description_en:'',
  seo_title_ar:'',seo_description_ar:'',fulfillment_lead_time:'',
  fulfillment_delivery_method:'',fulfillment_customer_handover:'',
  trust_headline:'',trust_certifications:'',trust_guarantees:'',
  trust_safety_information:'',trust_provider_requirements:''
}
export const EMPTY_COMPLIANCE:Compliance = {
  mediaRightsVerified:false,supplierQualified:false,childSafetyReviewed:false,
  destinationRegulationsReviewed:false,actualStockVerified:false,
  freightVerified:false,evidenceNotes:''
}
export type ProductGate = {ok:boolean;missing:string[];score:number;total:number}
const requiredEditorial:(keyof Editorial)[] = [
  'name_fr','name_en','name_ar','short_fr','short_en','short_ar',
  'description_fr','description_en','description_ar',
  'seo_title_fr','seo_description_fr','seo_title_en','seo_description_en',
  'seo_title_ar','seo_description_ar',
  'fulfillment_lead_time','fulfillment_delivery_method','fulfillment_customer_handover',
  'trust_headline','trust_certifications','trust_guarantees',
  'trust_safety_information','trust_provider_requirements'
]
const requiredCompliance:(keyof Compliance)[] = [
  'mediaRightsVerified','supplierQualified','childSafetyReviewed',
  'destinationRegulationsReviewed','actualStockVerified','freightVerified'
]
export function editorialGate(selection:Selection):ProductGate {
  const missing:string[]=[]
  if(!selection.category_key||!selection.category_keys.includes(selection.category_key))missing.push('Canonical primary category and assignment')
  if(!selection.image_url)missing.push('Primary image')
  if(!selection.sku)missing.push('Supplier SKU')
  for(const key of requiredEditorial)if(!String(selection.editorial[key]??'').trim())missing.push(key)
  for(const key of requiredCompliance)if(selection.compliance[key]!==true)missing.push(key)
  if(!String(selection.compliance.evidenceNotes||'').trim())missing.push('Documented sourcing, licensing and safety evidence references')
  if(selection.cost===null||selection.cost<=0)missing.push('Verified supplier cost')
  if(selection.supplier_moq===null||selection.supplier_moq<=0)missing.push('Verified supplier MOQ')
  if(selection.shipping_cost===null)missing.push('Verified freight cost')
  if(selection.duty_cost===null)missing.push('Destination duty / import cost estimate')
  const total=requiredEditorial.length+requiredCompliance.length+8
  return {ok:missing.length===0,missing,score:total-missing.length,total}
}
export function finiteMoney(value:unknown):number|null{
  if(value===null||value===undefined||value==='')return null
  const n=Number(typeof value==='string'?value.replace(/,/g,''):value)
  return Number.isFinite(n)&&n>=0&&n<=1_000_000_000?n:null
}
export function literalText(value:unknown,max=500):string{return String(value??'').trim().slice(0,max)}
export function supplierKey(provider:Provider,id:string):string{
  // Stable deterministic import identity: source PID, no random duplicate keys.
  const safe=id.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,105)
  if(!safe)throw Error('Invalid provider product ID')
  return `ac-supplier-${provider}-${safe}`
}
export function suggestedPrice(selection:Selection,rateToMad:number|null):{value:number|null;reason:string}{
  if(rateToMad===null||rateToMad<=0)return {value:null,reason:'Verified currency conversion not configured'}
  if(selection.cost===null||selection.shipping_cost===null||selection.duty_cost===null)return {value:null,reason:'Supplier cost, freight and duties must be verified'}
  const margin=selection.target_margin
  if(margin===null||margin<0||margin>=1)return {value:null,reason:'Target margin must be 0–99%'}
  const landed=(selection.cost+selection.shipping_cost+selection.duty_cost)*rateToMad
  return {value:Math.ceil(landed/(1-margin)),reason:'Estimate; final price requires finance approval'}
}

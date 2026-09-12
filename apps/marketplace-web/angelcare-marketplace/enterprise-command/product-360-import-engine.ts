import { createServiceClient } from '@/lib/supabase/server'
import type { MarketplaceRequestContext } from '../domain/types'
import { MarketplaceError } from '../server/errors'
import { requireProductDoctrine } from './product-doctrine'
import { canonicalProductImportKey } from './product-360-contract'
import { evaluateProduct360ReadinessRecord, type Product360Readiness } from './product-360-readiness'

export type Row = Record<string, any>

type ApplyInput = {
  db?: any
  context: MarketplaceRequestContext
  doctrineKey: string
  source: Record<string, unknown>
  normalized: Record<string, unknown>
  action: 'create' | 'update'
  importJobId: string
  requestId?: string
}

export type { Product360Readiness } from './product-360-readiness'

const text = (value: unknown): string => String(value ?? '').trim()
const nullableText = (value: unknown): string | null => text(value) || null
const object = (value: unknown): Row => value && typeof value === 'object' && !Array.isArray(value) ? value as Row : {}
const rows = (value: unknown): Row[] => Array.isArray(value) ? value.filter((entry): entry is Row => Boolean(entry) && typeof entry === 'object' && !Array.isArray(entry)) : []
const list = (value: unknown): string[] => Array.isArray(value) ? value.map(text).filter(Boolean) : text(value).split(/[|;,]+/).map((entry) => entry.trim()).filter(Boolean)
const number = (value: unknown): number | null => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(typeof value === 'string' ? value.replace(/\s/g,'').replace(',','.') : value)
  return Number.isFinite(parsed) ? parsed : null
}
const bool = (value: unknown): boolean | null => {
  if (typeof value === 'boolean') return value
  const normalized = text(value).toLowerCase()
  if (!normalized) return null
  if (['true','1','yes','oui','on'].includes(normalized)) return true
  if (['false','0','no','non','off'].includes(normalized)) return false
  return null
}
const hasOwn = (record: Record<string,unknown>, key: string): boolean => Object.keys(record).some((rawKey) => canonicalProductImportKey(rawKey) === key)
const sourceValue = (record: Record<string,unknown>, key: string): unknown => {
  const rawKey = Object.keys(record).find((candidate) => canonicalProductImportKey(candidate) === key)
  return rawKey === undefined ? undefined : record[rawKey]
}
const slugify = (value: string): string => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120)
const unique = <T>(values: T[]): T[] => [...new Set(values)]
const uuidLike = (value: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

function fail(message: string, cause?: unknown): never {
  throw new MarketplaceError('VALIDATION_ERROR', message, { cause })
}

function mergeMappedConfig(existing: unknown, source: Record<string,unknown>, normalized: Record<string,unknown>, mappings: Array<[string,string]>): Row {
  const next = { ...object(existing) }
  for (const [sourceKey, targetKey] of mappings) if (hasOwn(source, sourceKey)) next[targetKey] = normalized[sourceKey] ?? null
  return next
}

const COMMERCIAL_MAPPINGS: Array<[string,string]> = [
  ['commercial_promise','promise'],['commercial_highlights','highlights'],['commercial_inclusions','inclusions'],['commercial_exclusions','exclusions'],
  ['commercial_eligibility','eligibility'],['commercial_preparation','preparation'],['commercial_cancellation_copy','cancellation_copy'],['commercial_after_purchase','after_purchase'],
]
const SEO_MAPPINGS: Array<[string,string]> = [
  ['seo_title_fr','title_fr'],['seo_description_fr','description_fr'],['seo_title_en','title_en'],['seo_description_en','description_en'],['seo_title_ar','title_ar'],['seo_description_ar','description_ar'],
  ['seo_canonical_url','canonical'],['seo_social_title','social_title'],['seo_social_description','social_description'],
]
const TERRITORY_MAPPINGS: Array<[string,string]> = [
  ['territory_mode','mode'],['territory_fallback_behavior','fallback_behavior'],['territory_delivery_radius_km','delivery_radius_km'],['territory_message','territory_message'],['territory_codes','territory_codes'],
]
const FULFILLMENT_MAPPINGS: Array<[string,string]> = [
  ['fulfillment_mode','mode'],['fulfillment_lead_time','lead_time'],['fulfillment_delivery_method','delivery_method'],['fulfillment_capacity_model','capacity_model'],
  ['fulfillment_customer_handover','customer_handover'],['fulfillment_notes','fulfillment_notes'],['sourcing_source_type','source_type'],
  ['sourcing_preferred_provider_refs','preferred_provider_ids'],['sourcing_preferred_vendor_refs','preferred_vendor_ids'],['sourcing_required_capabilities','required_capabilities'],
  ['sourcing_assignment_strategy','assignment_strategy'],['sourcing_notes','sourcing_notes'],
]
const TRUST_MAPPINGS: Array<[string,string]> = [
  ['trust_headline','trust_headline'],['trust_certifications','certifications'],['trust_guarantees','guarantees'],['trust_safety_information','safety_information'],
  ['trust_provider_requirements','provider_requirements'],['trust_proof_urls','proof_urls'],
]
const RELATION_MAPPINGS: Array<[string,string]> = [
  ['relation_cross_sell_refs','cross_sell_ids'],['relation_upsell_refs','upsell_ids'],['relation_alternative_refs','alternative_ids'],['relation_bundle_refs','bundle_ids'],['relation_message','relation_message'],
]
const EXPERIENCE_MAPPINGS: Array<[string,string]> = [
  ['merchandising_badge','badge'],['merchandising_priority','priority'],['merchandising_card_variant','card_variant'],['merchandising_featured_copy','featured_copy'],['merchandising_seasonal_label','seasonal_label'],
  ['presentation_hero_variant','hero_variant'],['presentation_decision_headline','decision_headline'],['presentation_decision_support','decision_support'],['presentation_what_happens_next','what_happens_next'],
  ['presentation_comparison_message','comparison_message'],['presentation_faq_summary','faq_summary'],
]
const DISCOVERY_MAPPINGS: Array<[string,string]> = [
  ['discovery_age_range','age_range'],['discovery_duration','duration'],['discovery_format','format'],['discovery_language','language'],['discovery_keywords','keywords'],['discovery_filter_tags','filter_tags'],
]

async function resolveProductRefs(db:any, refs:string[], itemId:string):Promise<string[]> {
  if (!refs.length) return []
  const ids = refs.filter(uuidLike)
  const keys = refs.filter((entry) => !uuidLike(entry))
  const resolved = new Map<string,string>()
  if (ids.length) {
    const result = await db.from('angelcare_marketplace_catalog_items').select('id,item_key,public_reference').in('id',unique(ids))
    if (result.error) throw result.error
    for (const row of result.data || []) resolved.set(text(row.id), text(row.id))
  }
  if (keys.length) {
    const byKey = await db.from('angelcare_marketplace_catalog_items').select('id,item_key,public_reference').in('item_key',unique(keys))
    if (byKey.error) throw byKey.error
    for (const row of byKey.data || []) resolved.set(text(row.item_key), text(row.id))
    const missingAfterKey = unique(keys).filter((ref) => !resolved.has(ref))
    if (missingAfterKey.length) {
      const byRef = await db.from('angelcare_marketplace_catalog_items').select('id,item_key,public_reference').in('public_reference',missingAfterKey)
      if (byRef.error) throw byRef.error
      for (const row of byRef.data || []) resolved.set(text(row.public_reference), text(row.id))
    }
  }
  const missing = refs.filter((ref) => !resolved.has(ref))
  if (missing.length) fail(`Références produit introuvables : ${missing.join(', ')}.`)
  const output = refs.map((ref) => resolved.get(ref) as string)
  if (output.includes(itemId)) fail('Une relation produit ne peut pas cibler le produit lui-même.')
  return unique(output)
}

async function resolveProviderRefs(db:any, refs:string[]):Promise<string[]> {
  if (!refs.length) return []
  const ids = refs.filter(uuidLike), publicRefs = refs.filter((entry) => !uuidLike(entry))
  const resolved = new Map<string,string>()
  if (ids.length) {
    const result = await db.from('angelcare_marketplace_provider_profiles').select('id,public_reference').in('id',unique(ids)); if (result.error) throw result.error
    for (const row of result.data || []) resolved.set(text(row.id), text(row.id))
  }
  if (publicRefs.length) {
    const result = await db.from('angelcare_marketplace_provider_profiles').select('id,public_reference').in('public_reference',unique(publicRefs)); if (result.error) throw result.error
    for (const row of result.data || []) resolved.set(text(row.public_reference), text(row.id))
  }
  const missing = refs.filter((ref) => !resolved.has(ref)); if (missing.length) fail(`Providers introuvables : ${missing.join(', ')}.`)
  return refs.map((ref) => resolved.get(ref) as string)
}

async function resolveVendorRefs(db:any, refs:string[]):Promise<string[]> {
  if (!refs.length) return []
  const ids = refs.filter(uuidLike), publicRefs = refs.filter((entry) => !uuidLike(entry))
  const resolved = new Map<string,string>()
  if (ids.length) {
    const result = await db.from('angelcare_marketplace_vendor_links').select('id,vendor_reference').in('id',unique(ids)); if (result.error) throw result.error
    for (const row of result.data || []) resolved.set(text(row.id), text(row.id))
  }
  if (publicRefs.length) {
    const result = await db.from('angelcare_marketplace_vendor_links').select('id,vendor_reference').in('vendor_reference',unique(publicRefs)); if (result.error) throw result.error
    for (const row of result.data || []) resolved.set(text(row.vendor_reference), text(row.id))
  }
  const missing = refs.filter((ref) => !resolved.has(ref)); if (missing.length) fail(`Vendors introuvables : ${missing.join(', ')}.`)
  return refs.map((ref) => resolved.get(ref) as string)
}

async function resolveStructuredConfigs(db:any, itemId:string, existing:Row|null, source:Record<string,unknown>, normalized:Record<string,unknown>):Promise<Row> {
  const commercial = mergeMappedConfig(existing?.commercial_metadata, source, normalized, COMMERCIAL_MAPPINGS)
  const seo = mergeMappedConfig(existing?.seo_metadata, source, normalized, SEO_MAPPINGS)
  const territory = mergeMappedConfig(existing?.territory_config, source, normalized, TERRITORY_MAPPINGS)
  const fulfillment = mergeMappedConfig(existing?.fulfillment_config, source, normalized, FULFILLMENT_MAPPINGS)
  const trust = mergeMappedConfig(existing?.trust_config, source, normalized, TRUST_MAPPINGS)
  const relation = mergeMappedConfig(existing?.relation_config, source, normalized, RELATION_MAPPINGS)
  const experience = mergeMappedConfig(existing?.experience_config, source, normalized, EXPERIENCE_MAPPINGS)
  const attributes = mergeMappedConfig(existing?.attributes, source, normalized, DISCOVERY_MAPPINGS)
  if (hasOwn(source,'sourcing_preferred_provider_refs')) fulfillment.preferred_provider_ids = await resolveProviderRefs(db, list(normalized.sourcing_preferred_provider_refs))
  if (hasOwn(source,'sourcing_preferred_vendor_refs')) fulfillment.preferred_vendor_ids = await resolveVendorRefs(db, list(normalized.sourcing_preferred_vendor_refs))
  for (const [sourceKey,targetKey] of RELATION_MAPPINGS) if (targetKey.endsWith('_ids') && hasOwn(source, sourceKey)) relation[targetKey] = await resolveProductRefs(db, list(normalized[sourceKey]), itemId)
  return { commercial_metadata: commercial, seo_metadata: seo, territory_config: territory, fulfillment_config: fulfillment, trust_config: trust, relation_config: relation, experience_config: experience, attributes }
}

export async function loadProduct360Snapshot(itemId:string, db?:any):Promise<Row> {
  const client=db||await createServiceClient()
  return fullCatalogSnapshot(client,itemId)
}

async function fullCatalogSnapshot(db:any, itemId:string):Promise<Row> {
  const itemResult = await db.from('angelcare_marketplace_catalog_items').select('*,variants:angelcare_marketplace_catalog_variants(*),media:angelcare_marketplace_catalog_item_media(*),availability:angelcare_marketplace_catalog_availability(*),categories:angelcare_marketplace_catalog_item_categories(*)').eq('id',itemId).maybeSingle()
  if (itemResult.error) throw itemResult.error
  if (!itemResult.data) return {}
  const [priceRules, placements] = await Promise.all([
    db.from('angelcare_marketplace_finance_price_rules').select('*').eq('catalog_item_id',itemId),
    db.from('angelcare_marketplace_homepage_placements').select('*').eq('catalog_item_id',itemId),
  ])
  if (priceRules.error) throw priceRules.error
  if (placements.error) throw placements.error
  return { ...itemResult.data, priceRules: priceRules.data || [], placements: placements.data || [] }
}

function corePatch(source:Record<string,unknown>, normalized:Record<string,unknown>, existing:Row|null, doctrineKey:string):Row {
  const definition = requireProductDoctrine(doctrineKey)
  const patch:Row = { updated_at:new Date().toISOString(), kind:definition.catalogKind, sellable_type:definition.key }
  const direct = ['item_key','slug','sku','name_fr','name_en','name_ar','short_description_fr','short_description_en','short_description_ar','description_fr','description_en','description_ar','price_mode','price_amount','currency_label','availability_status','featured']
  // On updates, only mutate fields explicitly supplied by the operator. This is the
  // critical distinction between “column omitted” and “column intentionally cleared”.
  for (const key of direct) if (!existing || hasOwn(source,key)) patch[key] = normalized[key] ?? null
  if (!patch.slug && !existing) patch.slug = slugify(text(normalized.name_fr || normalized.item_key))
  if (!existing) {
    patch.item_key = text(normalized.item_key)
    patch.slug = text(normalized.slug) || slugify(text(normalized.name_fr || normalized.item_key))
    patch.name_fr = text(normalized.name_fr)
    patch.price_mode = text(normalized.price_mode) || definition.defaultPriceMode
    patch.currency_label = text(normalized.currency_label) || 'Dh'
    patch.availability_status = text(normalized.availability_status) || definition.defaultAvailability
    patch.featured = bool(normalized.featured) === true
  }
  if (hasOwn(source,'featured')) patch.featured = bool(normalized.featured) === true
  patch.status = 'draft'
  return patch
}

async function resolveCategories(db:any, keys:string[]):Promise<Array<{id:string;key:string}>> {
  if (!keys.length) return []
  const result = await db.from('angelcare_marketplace_catalog_categories').select('id,category_key,territory_id,locale').in('category_key',unique(keys)).eq('locale','fr').neq('status','archived')
  if (result.error) throw result.error
  const grouped = new Map<string,Row[]>()
  for (const row of result.data || []) grouped.set(text(row.category_key),[...(grouped.get(text(row.category_key))||[]),row])
  const resolved:Array<{id:string;key:string}>=[]
  for (const key of keys) {
    const candidates = grouped.get(key)||[]
    if (!candidates.length) fail(`Catégorie canonique introuvable : ${key}.`)
    const global = candidates.filter((row) => !row.territory_id)
    const chosen = global.length === 1 ? global[0] : candidates.length === 1 ? candidates[0] : null
    if (!chosen) fail(`Catégorie ambiguë ${key} : plusieurs catégories FR existent selon le territoire.`)
    resolved.push({id:text(chosen.id),key})
  }
  return resolved
}

async function syncCategories(db:any,itemId:string,source:Record<string,unknown>,normalized:Record<string,unknown>):Promise<void>{
  const categoriesTouched=hasOwn(source,'category_keys'),primaryTouched=hasOwn(source,'primary_category_key')
  if(!categoriesTouched&&!primaryTouched)return
  const existingResult=await db.from('angelcare_marketplace_catalog_item_categories').select('category_id,is_primary,sort_order').eq('catalog_item_id',itemId).order('sort_order');if(existingResult.error)throw existingResult.error
  let keys:string[]=[]
  if(categoriesTouched)keys=unique([text(normalized.primary_category_key),...list(normalized.category_keys)].filter(Boolean))
  else if(primaryTouched){
    const primaryKey=text(normalized.primary_category_key);if(!primaryKey)fail('primary_category_key ne peut pas être vide lorsqu’il est fourni.')
    const primaryResolved=await resolveCategories(db,[primaryKey])
    const existingIds=(existingResult.data||[]).map((row:any)=>text(row.category_id)).filter((id:string)=>id&&id!==primaryResolved[0].id)
    const del=await db.from('angelcare_marketplace_catalog_item_categories').delete().eq('catalog_item_id',itemId);if(del.error)throw del.error
    const rowsToInsert=[{catalog_item_id:itemId,category_id:primaryResolved[0].id,is_primary:true,sort_order:0,updated_at:new Date().toISOString()},...existingIds.map((id:string,index:number)=>({catalog_item_id:itemId,category_id:id,is_primary:false,sort_order:(index+1)*10,updated_at:new Date().toISOString()}))]
    const ins=await db.from('angelcare_marketplace_catalog_item_categories').insert(rowsToInsert);if(ins.error)throw ins.error
    return
  }
  const categories=await resolveCategories(db,keys)
  const del=await db.from('angelcare_marketplace_catalog_item_categories').delete().eq('catalog_item_id',itemId);if(del.error)throw del.error
  if(categories.length){const ins=await db.from('angelcare_marketplace_catalog_item_categories').insert(categories.map((category,index)=>({catalog_item_id:itemId,category_id:category.id,is_primary:index===0,sort_order:index*10,updated_at:new Date().toISOString()})));if(ins.error)throw ins.error}
}
async function resolveMediaReference(db:any,reference:string):Promise<Row>{
  if (!reference) fail('Référence média vide.')
  if (/^(https?:\/\/|\/)/.test(reference)) return { url:reference, alt_text_fr:'Visuel produit ANGELCARE', media_type:'image', asset_id:null }
  let result:any
  if(uuidLike(reference)) result=await db.from('angelcare_marketplace_media_assets').select('*').eq('id',reference).eq('status','active').maybeSingle()
  else result=await db.from('angelcare_marketplace_media_assets').select('*').eq('asset_key',reference).eq('status','active').maybeSingle()
  if(result.error)throw result.error
  if(!result.data)fail(`Média Media Library introuvable ou inactif : ${reference}.`)
  return {asset_id:text(result.data.id),url:text(result.data.desktop_url||result.data.public_url),alt_text_fr:text(result.data.alt_text_fr)||'Visuel produit ANGELCARE',alt_text_en:nullableText(result.data.alt_text_en),alt_text_ar:nullableText(result.data.alt_text_ar),media_type:text(result.data.media_type)||'image'}
}

async function syncMedia(db:any,itemId:string,actorId:string,source:Record<string,unknown>,normalized:Record<string,unknown>):Promise<void>{
  if(!hasOwn(source,'primary_image_reference')&&!hasOwn(source,'gallery_references')&&!hasOwn(source,'media_json'))return
  const desired:Row[]=[]
  for(const entry of rows(normalized.media_json)) desired.push({...entry})
  if(hasOwn(source,'gallery_references')) for(const [index,reference] of list(normalized.gallery_references).entries()) desired.push({media_key:`gallery-${index+1}`,reference,sort_order:(index+1)*10})
  if(hasOwn(source,'primary_image_reference')&&text(normalized.primary_image_reference)) desired.unshift({media_key:'primary',reference:text(normalized.primary_image_reference),sort_order:0})
  const deduped=new Map<string,Row>()
  for(const [index,entry] of desired.entries()){
    const key=text(entry.media_key)||(index===0?'primary':`gallery-${index}`)
    deduped.set(key,{...entry,media_key:key})
  }
  if(text(normalized.primary_image_reference)&&deduped.has('primary')){
    const primary=deduped.get('primary') as Row;deduped.delete('primary');deduped.set('primary',primary)
  }
  const keepKeys:string[]=[]
  for(const [mediaKey,entry] of deduped){
    const reference=text(entry.reference||entry.asset_key||entry.asset_url||entry.url)
    const resolved=reference?await resolveMediaReference(db,reference):{url:text(entry.asset_url||entry.url),alt_text_fr:text(entry.alt_text_fr)||'Visuel produit ANGELCARE',media_type:text(entry.media_type)||'image'}
    if(!text(resolved.url))fail(`Média ${mediaKey} sans URL exploitable.`)
    const up=await db.from('angelcare_marketplace_catalog_item_media').upsert({catalog_item_id:itemId,media_key:mediaKey,media_type:text(entry.media_type||resolved.media_type)||'image',asset_url:text(resolved.url),alt_text_fr:text(entry.alt_text_fr||resolved.alt_text_fr)||'Visuel produit ANGELCARE',alt_text_en:nullableText(entry.alt_text_en??resolved.alt_text_en),alt_text_ar:nullableText(entry.alt_text_ar??resolved.alt_text_ar),sort_order:number(entry.sort_order)??keepKeys.length*10,status:text(entry.status)||'active',updated_by:actorId,updated_at:new Date().toISOString()},{onConflict:'catalog_item_id,media_key'});if(up.error)throw up.error
    keepKeys.push(mediaKey)
  }
  const existing=await db.from('angelcare_marketplace_catalog_item_media').select('id,media_key,status').eq('catalog_item_id',itemId);if(existing.error)throw existing.error
  const fullReplace=hasOwn(source,'media_json'),galleryReplace=hasOwn(source,'gallery_references')
  const archiveIds=(existing.data||[]).filter((entry:any)=>{const key=text(entry.media_key);if(text(entry.status)==='archived'||keepKeys.includes(key))return false;if(fullReplace)return true;if(galleryReplace&&key!=='primary')return true;return false}).map((entry:any)=>entry.id)
  if(archiveIds.length){const archived=await db.from('angelcare_marketplace_catalog_item_media').update({status:'archived',updated_by:actorId,updated_at:new Date().toISOString()}).in('id',archiveIds);if(archived.error)throw archived.error}
}

async function syncVariants(db:any,itemId:string,actorId:string,source:Record<string,unknown>,normalized:Record<string,unknown>):Promise<void>{
  if(!hasOwn(source,'variants_json'))return
  const desired=rows(normalized.variants_json)
  const keep:string[]=[]
  for(const [index,entry] of desired.entries()){
    const variantKey=text(entry.variant_key)||slugify(text(entry.name_fr||entry.sku||`variant-${index+1}`));if(!variantKey)fail(`Variante #${index+1} sans variant_key exploitable.`)
    const name=text(entry.name_fr);if(!name)fail(`Variante ${variantKey} sans name_fr.`)
    let mediaAssetId=nullableText(entry.media_asset_id)
    const mediaReference=text(entry.media_asset_reference||entry.media_reference)
    if(mediaReference){const resolved=await resolveMediaReference(db,mediaReference);mediaAssetId=nullableText(resolved.asset_id);if(!mediaAssetId)fail(`Variante ${variantKey}: ${mediaReference} n’est pas un asset Media Library assignable.`)}
    if(mediaAssetId){const asset=await db.from('angelcare_marketplace_media_assets').select('id').eq('id',mediaAssetId).eq('status','active').maybeSingle();if(asset.error)throw asset.error;if(!asset.data)fail(`Variante ${variantKey}: media_asset_id introuvable ou inactif.`)}
    let territoryId=nullableText(entry.territory_id)
    const territoryCode=text(entry.territory_code)
    if(territoryCode){const resolved=await resolveTerritories(db,[territoryCode]);territoryId=resolved.get(territoryCode)||null}
    const payload={
      catalog_item_id:itemId,variant_key:variantKey,name_fr:name,name_en:nullableText(entry.name_en),name_ar:nullableText(entry.name_ar),sku:nullableText(entry.sku),
      configuration:object(entry.configuration||entry.option_values),option_values:object(entry.option_values||entry.configuration),
      price_delta:number(entry.price_delta),price_override:number(entry.price_override),media_asset_id:mediaAssetId,inventory_reference:nullableText(entry.inventory_reference),territory_id:territoryId,
      available:entry.available===undefined?true:bool(entry.available)===true,status:text(entry.status)||'active',sort_order:number(entry.sort_order)??index*10,updated_by:actorId,updated_at:new Date().toISOString(),
    }
    const up=await db.from('angelcare_marketplace_catalog_variants').upsert(payload,{onConflict:'catalog_item_id,variant_key'});if(up.error)throw up.error;keep.push(variantKey)
  }
  const existing=await db.from('angelcare_marketplace_catalog_variants').select('id,variant_key,status').eq('catalog_item_id',itemId);if(existing.error)throw existing.error
  const archiveIds=(existing.data||[]).filter((entry:any)=>!keep.includes(text(entry.variant_key))&&text(entry.status)!=='archived').map((entry:any)=>entry.id)
  if(archiveIds.length){const archived=await db.from('angelcare_marketplace_catalog_variants').update({status:'archived',updated_by:actorId,updated_at:new Date().toISOString()}).in('id',archiveIds);if(archived.error)throw archived.error}
}

async function resolveTerritories(db:any,codes:string[]):Promise<Map<string,string>>{
  const result=new Map<string,string>();if(!codes.length)return result
  const query=await db.from('angelcare_marketplace_territories').select('id,territory_code').in('territory_code',unique(codes));if(query.error)throw query.error
  for(const row of query.data||[])result.set(text(row.territory_code),text(row.id))
  const missing=codes.filter((code)=>!result.has(code));if(missing.length)fail(`Territoires introuvables : ${unique(missing).join(', ')}.`)
  return result
}

async function validateTerritoryIds(db:any,ids:string[]):Promise<Map<string,Row>>{
  const wanted=unique(ids.filter(Boolean));const resolved=new Map<string,Row>();if(!wanted.length)return resolved
  const query=await db.from('angelcare_marketplace_territories').select('id,territory_code,status').in('id',wanted);if(query.error)throw query.error
  for(const row of query.data||[])resolved.set(text(row.id),row)
  const missing=wanted.filter((id)=>!resolved.has(id));if(missing.length)fail(`Territory IDs introuvables : ${missing.join(', ')}.`)
  return resolved
}

async function validateCityZoneIds(db:any,entries:Array<{cityZoneId:string;territoryId?:string|null}>):Promise<void>{
  const wanted=unique(entries.map((entry)=>entry.cityZoneId).filter(Boolean));if(!wanted.length)return
  const query=await db.from('angelcare_marketplace_territory_city_zones').select('id,territory_id,coverage_status').in('id',wanted);if(query.error)throw query.error
  const resolved=new Map<string,Row>((query.data||[]).map((row:any)=>[text(row.id),row]))
  const missing=wanted.filter((id)=>!resolved.has(id));if(missing.length)fail(`City zone IDs introuvables : ${missing.join(', ')}.`)
  for(const entry of entries){
    const zone=resolved.get(entry.cityZoneId);if(!zone)continue
    if(entry.territoryId&&text(zone.territory_id)!==entry.territoryId)fail(`La city_zone_id ${entry.cityZoneId} n’appartient pas au territory_id ${entry.territoryId}.`)
  }
}

async function syncAvailability(db:any,itemId:string,actorId:string,source:Record<string,unknown>,normalized:Record<string,unknown>):Promise<void>{
  const touched=['territory_codes','availability_json','availability_audience','availability_capacity','availability_starts_at','availability_ends_at','availability_reason'].some((key)=>hasOwn(source,key))
  if(!touched)return
  const structured=rows(normalized.availability_json)
  const simpleCodes=list(normalized.territory_codes)
  const allCodes=unique([...simpleCodes,...structured.map((entry)=>text(entry.territory_code)).filter(Boolean)])
  const territories=await resolveTerritories(db,allCodes)
  const desired:Row[]=[]
  if(structured.length){
    for(const entry of structured){const code=text(entry.territory_code);desired.push({territory_id:code?territories.get(code):nullableText(entry.territory_id),city_zone_id:nullableText(entry.city_zone_id),audience:text(entry.audience)||'all',available:entry.available===undefined?true:bool(entry.available)===true,capacity_limit:number(entry.capacity_limit),starts_at:nullableText(entry.starts_at),ends_at:nullableText(entry.ends_at),reason:nullableText(entry.reason)})}
  }else{
    for(const code of simpleCodes)desired.push({territory_id:territories.get(code),city_zone_id:null,audience:text(normalized.availability_audience)||'all',available:text(normalized.availability_status)!=='unavailable'&&text(normalized.availability_status)!=='out_of_stock',capacity_limit:number(normalized.availability_capacity),starts_at:nullableText(normalized.availability_starts_at),ends_at:nullableText(normalized.availability_ends_at),reason:nullableText(normalized.availability_reason)})
  }
  const existing=await db.from('angelcare_marketplace_catalog_availability').select('*').eq('catalog_item_id',itemId);if(existing.error)throw existing.error
  const keepIds:string[]=[]
  for(const entry of desired){
    const match=(existing.data||[]).find((row:any)=>nullableText(row.territory_id)===nullableText(entry.territory_id)&&nullableText(row.city_zone_id)===nullableText(entry.city_zone_id)&&text(row.audience||'all')===text(entry.audience||'all'))
    const payload={...entry,catalog_item_id:itemId,capacity_limit:entry.capacity_limit===null?null:Math.max(0,Math.trunc(entry.capacity_limit)),updated_by:actorId,updated_at:new Date().toISOString()}
    if(match){const updated=await db.from('angelcare_marketplace_catalog_availability').update(payload).eq('id',match.id).select('id').single();if(updated.error)throw updated.error;keepIds.push(text(updated.data?.id||match.id))}
    else{const inserted=await db.from('angelcare_marketplace_catalog_availability').insert(payload).select('id').single();if(inserted.error)throw inserted.error;keepIds.push(text(inserted.data?.id))}
  }
  const removeIds=(existing.data||[]).map((entry:any)=>text(entry.id)).filter((id:string)=>id&&!keepIds.includes(id))
  if(removeIds.length){const del=await db.from('angelcare_marketplace_catalog_availability').delete().in('id',removeIds);if(del.error)throw del.error}
}

async function resolvePriceBook(db:any,reference:string):Promise<Row|null>{
  if(!reference)return null
  let query:any
  if(uuidLike(reference))query=await db.from('angelcare_marketplace_finance_price_books').select('*').eq('id',reference).maybeSingle()
  else {query=await db.from('angelcare_marketplace_finance_price_books').select('*').eq('public_reference',reference).maybeSingle();if(!query.data&&!query.error)query=await db.from('angelcare_marketplace_finance_price_books').select('*').eq('name',reference).eq('status','active').limit(2)}
  if(query.error)throw query.error
  if(Array.isArray(query.data)){if(query.data.length!==1)fail(`Price book ambigu ou introuvable : ${reference}.`);return query.data[0]}
  if(!query.data)fail(`Price book introuvable : ${reference}.`)
  return query.data
}

async function syncPriceRules(db:any,itemId:string,actorId:string,source:Record<string,unknown>,normalized:Record<string,unknown>):Promise<void>{
  const singularKeys=['price_rule_price_book','price_rule_model','price_rule_unit','price_rule_minimum','price_rule_standard','price_rule_maximum','price_rule_cost_basis','price_rule_target_margin','price_rule_floor_margin','price_rule_maximum_discount','price_rule_commission_rate']
  const structuredTouched=hasOwn(source,'price_rules_json'),singularTouched=singularKeys.some((key)=>hasOwn(source,key))
  if(!structuredTouched&&!singularTouched)return
  const desired:Row[]=structuredTouched?rows(normalized.price_rules_json):[{
    price_book_reference:normalized.price_rule_price_book,pricing_model:normalized.price_rule_model,unit_label:normalized.price_rule_unit,minimum_price:normalized.price_rule_minimum,standard_price:normalized.price_rule_standard,maximum_price:normalized.price_rule_maximum,cost_basis:normalized.price_rule_cost_basis,target_margin:normalized.price_rule_target_margin,floor_margin:normalized.price_rule_floor_margin,maximum_discount:normalized.price_rule_maximum_discount,commission_rate:normalized.price_rule_commission_rate,status:'active',
  }]
  const existingResult=await db.from('angelcare_marketplace_finance_price_rules').select('*').eq('catalog_item_id',itemId);if(existingResult.error)throw existingResult.error
  const existing=existingResult.data||[],keepIds:string[]=[]
  const identities=new Set<string>()
  for(const [index,entry] of desired.entries()){
    const reference=text(entry.price_book_reference||entry.price_book||entry.price_book_id);const book=await resolvePriceBook(db,reference);if(!book)fail(`price_rules_json #${index+1}: price book requis.`)
    const standard=number(entry.standard_price??entry.standard);if(standard===null)fail(`price_rules_json #${index+1}: standard_price est requis.`)
    const model=text(entry.pricing_model||entry.model)||'fixed';const identity=`${text(book.id)}::${model}`;if(identities.has(identity))fail(`Règle Finance dupliquée pour ${reference} / ${model}.`);identities.add(identity)
    const payload={price_book_id:book.id,source_object_type:'catalog_item',source_object_id:itemId,catalog_item_id:itemId,pricing_model:model,unit_label:nullableText(entry.unit_label??entry.unit),minimum_price:number(entry.minimum_price??entry.minimum),standard_price:standard,maximum_price:number(entry.maximum_price??entry.maximum),cost_basis:number(entry.cost_basis),target_margin:number(entry.target_margin),floor_margin:number(entry.floor_margin),maximum_discount:number(entry.maximum_discount),commission_rate:number(entry.commission_rate),territory_id:book.territory_id||null,status:text(entry.status)||'active',updated_by:actorId,updated_at:new Date().toISOString()}
    const match=existing.find((candidate:any)=>text(candidate.price_book_id)===text(book.id)&&text(candidate.pricing_model)===model)
    if(match){const updated=await db.from('angelcare_marketplace_finance_price_rules').update(payload).eq('id',match.id).select('id').single();if(updated.error)throw updated.error;keepIds.push(text(updated.data?.id||match.id))}
    else{const inserted=await db.from('angelcare_marketplace_finance_price_rules').insert({...payload,created_by:actorId}).select('id').single();if(inserted.error)throw inserted.error;keepIds.push(text(inserted.data?.id))}
  }
  // Structured JSON is an explicit replacement set; legacy singular fields only mutate that one rule.
  if(structuredTouched){const archiveIds=existing.map((entry:any)=>text(entry.id)).filter((id:string)=>id&&!keepIds.includes(id)&&text(existing.find((e:any)=>text(e.id)===id)?.status)!=='archived');if(archiveIds.length){const archived=await db.from('angelcare_marketplace_finance_price_rules').update({status:'archived',updated_by:actorId,updated_at:new Date().toISOString()}).in('id',archiveIds);if(archived.error)throw archived.error}}
}

async function syncMerchandising(db:any,itemId:string,actorId:string,source:Record<string,unknown>,normalized:Record<string,unknown>):Promise<void>{
  const badges:Array<[string,boolean|null]>= [['popular',hasOwn(source,'popular')?bool(normalized.popular):null],['best-pick',hasOwn(source,'best_pick')?bool(normalized.best_pick):null]]
  for(const [badge,active] of badges){if(active===null)continue;const placementKey=`${badge}-${itemId}`;const payload={placement_key:placementKey,catalog_item_id:itemId,locale:'fr',territory_id:null,audience:'all',merchandising_badge:badge,priority:number(normalized.merchandising_priority)??100,sort_order:100,starts_at:new Date().toISOString(),status:active?'active':'suppressed',updated_by:actorId};const up=await db.from('angelcare_marketplace_homepage_placements').upsert(payload,{onConflict:'placement_key,locale,territory_id'});if(up.error)throw up.error}
}

export function evaluateProduct360Readiness(snapshot:Row, doctrineKey:string):Product360Readiness{return evaluateProduct360ReadinessRecord(snapshot,doctrineKey)}

async function restoreSnapshotInternal(db:any,snapshot:Row,itemId:string,actorId:string):Promise<void>{
  if(!snapshot||!Object.keys(snapshot).length){const archived=await db.from('angelcare_marketplace_catalog_items').update({status:'archived',updated_by:actorId,updated_at:new Date().toISOString()}).eq('id',itemId);if(archived.error)throw archived.error;return}
  const core={...snapshot};const variants=rows(core.variants),media=rows(core.media),availability=rows(core.availability),categories=rows(core.categories),priceRules=rows(core.priceRules),placements=rows(core.placements)
  delete core.variants;delete core.media;delete core.availability;delete core.categories;delete core.priceRules;delete core.placements;delete core.created_at;delete core.updated_at
  const restored=await db.from('angelcare_marketplace_catalog_items').update({...core,updated_by:actorId,updated_at:new Date().toISOString()}).eq('id',itemId);if(restored.error)throw restored.error
  const currentVariants=await db.from('angelcare_marketplace_catalog_variants').select('id').eq('catalog_item_id',itemId);if(currentVariants.error)throw currentVariants.error
  const beforeVariantIds=new Set(variants.map((entry)=>text(entry.id)));const extraVariantIds=(currentVariants.data||[]).map((entry:any)=>text(entry.id)).filter((id:string)=>!beforeVariantIds.has(id));if(extraVariantIds.length){const a=await db.from('angelcare_marketplace_catalog_variants').update({status:'archived',updated_by:actorId,updated_at:new Date().toISOString()}).in('id',extraVariantIds);if(a.error)throw a.error}
  for(const entry of variants){const payload:Row={...entry,catalog_item_id:itemId};delete payload.created_at;delete payload.updated_at;const up=await db.from('angelcare_marketplace_catalog_variants').upsert(payload,{onConflict:'id'});if(up.error)throw up.error}
  const currentMedia=await db.from('angelcare_marketplace_catalog_item_media').select('id').eq('catalog_item_id',itemId);if(currentMedia.error)throw currentMedia.error
  const beforeMediaIds=new Set(media.map((entry)=>text(entry.id)));const extraMediaIds=(currentMedia.data||[]).map((entry:any)=>text(entry.id)).filter((id:string)=>!beforeMediaIds.has(id));if(extraMediaIds.length){const a=await db.from('angelcare_marketplace_catalog_item_media').update({status:'archived',updated_by:actorId,updated_at:new Date().toISOString()}).in('id',extraMediaIds);if(a.error)throw a.error}
  for(const entry of media){const payload:Row={...entry,catalog_item_id:itemId};delete payload.created_at;delete payload.updated_at;const up=await db.from('angelcare_marketplace_catalog_item_media').upsert(payload,{onConflict:'id'});if(up.error)throw up.error}
  const delAvail=await db.from('angelcare_marketplace_catalog_availability').delete().eq('catalog_item_id',itemId);if(delAvail.error)throw delAvail.error
  if(availability.length){const ins=await db.from('angelcare_marketplace_catalog_availability').insert(availability.map((entry)=>({...entry,catalog_item_id:itemId,updated_by:actorId,updated_at:new Date().toISOString()})));if(ins.error)throw ins.error}
  const delCat=await db.from('angelcare_marketplace_catalog_item_categories').delete().eq('catalog_item_id',itemId);if(delCat.error)throw delCat.error
  if(categories.length){const ins=await db.from('angelcare_marketplace_catalog_item_categories').insert(categories.map((entry)=>({...entry,catalog_item_id:itemId,updated_at:new Date().toISOString()})));if(ins.error)throw ins.error}
  const currentRules=await db.from('angelcare_marketplace_finance_price_rules').select('id').eq('catalog_item_id',itemId);if(currentRules.error)throw currentRules.error
  const beforeRuleIds=new Set(priceRules.map((entry)=>text(entry.id)));const extraRuleIds=(currentRules.data||[]).map((entry:any)=>text(entry.id)).filter((id:string)=>!beforeRuleIds.has(id));if(extraRuleIds.length){const a=await db.from('angelcare_marketplace_finance_price_rules').update({status:'archived',updated_by:actorId,updated_at:new Date().toISOString()}).in('id',extraRuleIds);if(a.error)throw a.error}
  for(const entry of priceRules){const payload:Row={...entry,catalog_item_id:itemId};delete payload.created_at;delete payload.updated_at;const up=await db.from('angelcare_marketplace_finance_price_rules').upsert(payload,{onConflict:'id'});if(up.error)throw up.error}
  const currentPlacements=await db.from('angelcare_marketplace_homepage_placements').select('id').eq('catalog_item_id',itemId);if(currentPlacements.error)throw currentPlacements.error
  const beforePlacementIds=new Set(placements.map((entry)=>text(entry.id)));const extraPlacementIds=(currentPlacements.data||[]).map((entry:any)=>text(entry.id)).filter((id:string)=>!beforePlacementIds.has(id));if(extraPlacementIds.length){const a=await db.from('angelcare_marketplace_homepage_placements').update({status:'archived',updated_by:actorId,updated_at:new Date().toISOString()}).in('id',extraPlacementIds);if(a.error)throw a.error}
  for(const entry of placements){const payload:Row={...entry,catalog_item_id:itemId};delete payload.created_at;delete payload.updated_at;const up=await db.from('angelcare_marketplace_homepage_placements').upsert(payload,{onConflict:'id'});if(up.error)throw up.error}
}

export async function restoreProduct360Snapshot(input:{db?:any;snapshot:Row|null;itemId:string;context:MarketplaceRequestContext}):Promise<void>{const db=input.db||await createServiceClient();await restoreSnapshotInternal(db,input.snapshot||{},input.itemId,input.context.actor.id)}

export async function applyProduct360ImportRow(input:ApplyInput):Promise<{itemId:string;beforeSnapshot:Row|null;afterSnapshot:Row;readiness:Product360Readiness;requestedStatus:string}> {
  const db=input.db||await createServiceClient();const key=text(input.normalized.item_key)
  const existingResult=await db.from('angelcare_marketplace_catalog_items').select('*').eq('item_key',key).maybeSingle();if(existingResult.error)throw existingResult.error
  const existing=existingResult.data as Row|null
  if(input.action==='create'&&existing)fail(`Le produit ${key} existe déjà.`)
  if(input.action==='update'&&!existing)fail(`Le produit ${key} n’existe pas pour mise à jour.`)
  const before=existing?await fullCatalogSnapshot(db,text(existing.id)):null
  let itemId=text(existing?.id)
  try{
    const patch=corePatch(input.source,input.normalized,existing,input.doctrineKey)
    const baseConfigs=await resolveStructuredConfigs(db,itemId||'00000000-0000-0000-0000-000000000000',existing,input.source,input.normalized)
    const definition=requireProductDoctrine(input.doctrineKey)
    const attributes:Row={...object(baseConfigs.attributes),doctrine:definition.key}
    for(const field of definition.fields)if(hasOwn(input.source,field.key))attributes[field.key]=input.normalized[field.key]
    const commercial={...object(baseConfigs.commercial_metadata),doctrine:definition.key,import_job_id:input.importJobId,import_note:hasOwn(input.source,'import_note')?nullableText(input.normalized.import_note):object(baseConfigs.commercial_metadata).import_note}
    const payload={...patch,...baseConfigs,commercial_metadata:commercial,attributes,updated_by:input.context.actor.id}
    let item:Row
    if(existing){const updated=await db.from('angelcare_marketplace_catalog_items').update(payload).eq('id',existing.id).select('*').single();if(updated.error||!updated.data)throw updated.error||new Error('Mise à jour produit impossible.');item=updated.data as Row}
    else{const inserted=await db.from('angelcare_marketplace_catalog_items').insert({...payload,created_by:input.context.actor.id}).select('*').single();if(inserted.error||!inserted.data)throw inserted.error||new Error('Création produit impossible.');item=inserted.data as Row}
    itemId=text(item.id)
    // Relations need the real item id for self-reference protection; resolve again after create.
    if(['relation_cross_sell_refs','relation_upsell_refs','relation_alternative_refs','relation_bundle_refs'].some((keyName)=>hasOwn(input.source,keyName))){
      const relation={...object(item.relation_config)}
      for(const [sourceKey,targetKey] of RELATION_MAPPINGS)if(targetKey.endsWith('_ids')&&hasOwn(input.source,sourceKey))relation[targetKey]=await resolveProductRefs(db,list(input.normalized[sourceKey]),itemId)
      const relUpdate=await db.from('angelcare_marketplace_catalog_items').update({relation_config:relation,updated_by:input.context.actor.id,updated_at:new Date().toISOString()}).eq('id',itemId);if(relUpdate.error)throw relUpdate.error
    }
    await syncCategories(db,itemId,input.source,input.normalized)
    await syncMedia(db,itemId,input.context.actor.id,input.source,input.normalized)
    await syncVariants(db,itemId,input.context.actor.id,input.source,input.normalized)
    await syncAvailability(db,itemId,input.context.actor.id,input.source,input.normalized)
    await syncPriceRules(db,itemId,input.context.actor.id,input.source,input.normalized)
    await syncMerchandising(db,itemId,input.context.actor.id,input.source,input.normalized)
    let after=await fullCatalogSnapshot(db,itemId)
    const readiness=evaluateProduct360Readiness(after,input.doctrineKey)
    const requestedStatus=hasOwn(input.source,'status')?(text(input.normalized.status)||'draft'):(text(existing?.status)||'draft')
    if(requestedStatus==='published'){
      if(!readiness.ready)fail(`Publication refusée par Product 360 readiness : ${readiness.reasons.join(', ')}.`)
      const published=await db.from('angelcare_marketplace_catalog_items').update({status:'published',publish_at:new Date().toISOString(),updated_by:input.context.actor.id,updated_at:new Date().toISOString()}).eq('id',itemId);if(published.error)throw published.error
    }else if(['draft','review','approved','paused','archived'].includes(requestedStatus)){
      const transitioned=await db.from('angelcare_marketplace_catalog_items').update({status:requestedStatus,updated_by:input.context.actor.id,updated_at:new Date().toISOString()}).eq('id',itemId);if(transitioned.error)throw transitioned.error
    }
    after=await fullCatalogSnapshot(db,itemId)
    return{itemId,beforeSnapshot:before,afterSnapshot:after,readiness:evaluateProduct360Readiness(after,input.doctrineKey),requestedStatus}
  }catch(error){
    if(itemId){
      try{await restoreSnapshotInternal(db,before||{},itemId,input.context.actor.id)}
      catch(recoveryError){
        const original=error instanceof Error?error.message:String(error)
        const recovery=recoveryError instanceof Error?recoveryError.message:String(recoveryError)
        throw new MarketplaceError('INTERNAL_ERROR',`Échec import ET restauration incomplète. Import: ${original} | Recovery: ${recovery}`,{cause:recoveryError})
      }
    }
    throw error
  }
}

export async function validateProductImportReferences(input:{db?:any;rows:Array<{valid:boolean;normalized:Record<string,unknown>;errors:string[];warnings:string[]}>}):Promise<void>{
  const db=input.db||await createServiceClient()
  for(const row of input.rows){
    if(!row.valid)continue
    try{
      const categoryKeys=unique([text(row.normalized.primary_category_key),...list(row.normalized.category_keys)].filter(Boolean));if(categoryKeys.length)await resolveCategories(db,categoryKeys)
      const availabilityRows=rows(row.normalized.availability_json),territoryCodes=unique([...list(row.normalized.territory_codes),...availabilityRows.map((entry)=>text(entry.territory_code)).filter(Boolean)]);const territoryByCode=territoryCodes.length?await resolveTerritories(db,territoryCodes):new Map<string,string>()
      const directTerritoryIds=unique(availabilityRows.map((entry)=>text(entry.territory_id)).filter(Boolean));if(directTerritoryIds.length)await validateTerritoryIds(db,directTerritoryIds)
      for(const entry of availabilityRows){const code=text(entry.territory_code),direct=text(entry.territory_id);if(code&&direct&&territoryByCode.get(code)!==direct)fail(`availability_json: territory_code ${code} ne correspond pas au territory_id ${direct}.`)}
      const zoneEntries=availabilityRows.map((entry)=>{const code=text(entry.territory_code);return{cityZoneId:text(entry.city_zone_id),territoryId:text(entry.territory_id)||territoryByCode.get(code)||null}}).filter((entry)=>entry.cityZoneId);if(zoneEntries.length)await validateCityZoneIds(db,zoneEntries)
      const mediaRefs=unique([text(row.normalized.primary_image_reference),...list(row.normalized.gallery_references),...rows(row.normalized.media_json).map((entry)=>text(entry.reference||entry.asset_key||entry.asset_url||entry.url)).filter(Boolean)].filter(Boolean));for(const reference of mediaRefs)await resolveMediaReference(db,reference)
      if(text(row.normalized.price_rule_price_book))await resolvePriceBook(db,text(row.normalized.price_rule_price_book))
      for(const priceRule of rows(row.normalized.price_rules_json)){const reference=text(priceRule.price_book_reference||priceRule.price_book||priceRule.price_book_id);if(reference)await resolvePriceBook(db,reference)}
      if(list(row.normalized.sourcing_preferred_provider_refs).length)await resolveProviderRefs(db,list(row.normalized.sourcing_preferred_provider_refs))
      if(list(row.normalized.sourcing_preferred_vendor_refs).length)await resolveVendorRefs(db,list(row.normalized.sourcing_preferred_vendor_refs))
      const own=await db.from('angelcare_marketplace_catalog_items').select('id').eq('item_key',text(row.normalized.item_key)).maybeSingle();if(own.error)throw own.error
      const ownId=text(own.data?.id)
      const relationRefs=unique(['relation_cross_sell_refs','relation_upsell_refs','relation_alternative_refs','relation_bundle_refs'].flatMap((key)=>list(row.normalized[key])))
      if(relationRefs.length)await resolveProductRefs(db,relationRefs,ownId)
      const structuredVariants=rows(row.normalized.variants_json)
      for(const variant of structuredVariants){const mediaRef=text(variant.media_asset_reference||variant.media_reference||variant.media_asset_id);if(mediaRef)await resolveMediaReference(db,mediaRef);const territoryCode=text(variant.territory_code),territoryId=text(variant.territory_id);const byCode=territoryCode?await resolveTerritories(db,[territoryCode]):new Map<string,string>();if(territoryId)await validateTerritoryIds(db,[territoryId]);if(territoryCode&&territoryId&&byCode.get(territoryCode)!==territoryId)fail(`variants_json: territory_code ${territoryCode} ne correspond pas au territory_id ${territoryId}.`)}
      const variantSkus=structuredVariants.map((entry)=>text(entry.sku)).filter(Boolean)
      if(new Set(variantSkus).size!==variantSkus.length)fail(`SKU variante dupliqué dans variants_json : ${variantSkus.join(', ')}.`)
      if(variantSkus.length){const variantConflict=await db.from('angelcare_marketplace_catalog_variants').select('sku,catalog_item_id').in('sku',unique(variantSkus));if(variantConflict.error)throw variantConflict.error;const foreign=(variantConflict.data||[]).filter((entry:any)=>text(entry.catalog_item_id)!==ownId);if(foreign.length)fail(`SKU variante déjà utilisé : ${unique(foreign.map((entry:any)=>text(entry.sku))).join(', ')}.`)}
    }catch(error){row.valid=false;row.errors.push(error instanceof Error?error.message:String(error))}
  }
}

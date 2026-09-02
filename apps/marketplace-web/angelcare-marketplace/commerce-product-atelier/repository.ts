import { createServiceClient } from '@/lib/supabase/server'
import type { MarketplaceRequestContext } from '../domain/types'
import { commerceStudioData } from '../commerce-studio/repository'
import { PRODUCT_DOCTRINES } from '../enterprise-command/product-doctrine'
import type { ProductDoctrineKey } from '../enterprise-command/types'
import type { AtelierProduct, CategoryStat, CommerceAttention, CommerceProductAtelierSnapshot, TerritoryAvailabilityStat } from './types'

type Row=Record<string,any>
const rows=(value:unknown):Row[]=>Array.isArray(value)?value.filter((entry):entry is Row=>Boolean(entry)&&typeof entry==='object'&&!Array.isArray(entry)):[]
const text=(value:unknown)=>String(value??'').trim()
const num=(value:unknown)=>Number.isFinite(Number(value))?Number(value):0
const arr=(value:unknown):Row[]=>rows(value)

export async function commerceProductAtelierSnapshot(context:MarketplaceRequestContext):Promise<CommerceProductAtelierSnapshot>{
  const db=await createServiceClient()
  const data=await commerceStudioData(context)
  const since=new Date(Date.now()-30*86400000).toISOString()
  const [sessionResult,lineResult,qualificationResult,providerResult]=await Promise.all([
    db.from('angelcare_marketplace_conversion_sessions').select('id,catalog_item_id,status,created_at').gte('created_at',since).limit(10000),
    db.from('angelcare_marketplace_order_lines').select('id,journey_id,catalog_item_id,line_total,status,created_at').gte('created_at',since).neq('status','archived').limit(10000),
    db.from('angelcare_marketplace_provider_service_qualifications').select('provider_id,service_key,territories,status').eq('status','qualified').limit(10000),
    db.from('angelcare_marketplace_provider_profiles').select('id,operational_status').eq('operational_status','active').limit(5000),
  ])
  const sessions=rows(sessionResult.data),lines=rows(lineResult.data),qualifications=rows(qualificationResult.data),providers=rows(providerResult.data)
  const activeProviders=new Set(providers.map(row=>text(row.id)))
  const sessionByItem=new Map<string,Row[]>(),lineByItem=new Map<string,Row[]>()
  for(const row of sessions){const key=text(row.catalog_item_id);if(!key)continue;sessionByItem.set(key,[...(sessionByItem.get(key)||[]),row])}
  for(const row of lines){const key=text(row.catalog_item_id);if(!key)continue;lineByItem.set(key,[...(lineByItem.get(key)||[]),row])}
  const qualificationsByService=new Map<string,Set<string>>()
  for(const row of qualifications){const service=text(row.service_key);const provider=text(row.provider_id);if(!service||!activeProviders.has(provider))continue;const set=qualificationsByService.get(service)||new Set<string>();set.add(provider);qualificationsByService.set(service,set)}

  const products:AtelierProduct[]=data.catalogItems.map(item=>{
    const itemSessions=sessionByItem.get(item.id)||[]
    const itemLines=lineByItem.get(item.id)||[]
    const confirmed=itemSessions.filter(row=>['confirmed','submitted','handover_pending'].includes(text(row.status))).length
    const conversion=itemSessions.length?confirmed/itemSessions.length*100:null
    const orders=new Set(itemLines.map(row=>text(row.journey_id)).filter(Boolean)).size
    const revenue=itemLines.reduce((sum,row)=>sum+num(row.line_total),0)
    const categoryIds=arr(item.categories).map(row=>text(row.category_id)).filter(Boolean)
    const availability=arr(item.availability)
    const availableTerritories=new Set(availability.filter(row=>Boolean(row.available)).map(row=>text(row.territory_id)).filter(Boolean)).size
    const missingMedia=Boolean((item as any).missing_media)||arr(item.media).filter(row=>text(row.status)!=='archived').length===0
    const missingPrice=Boolean((item as any).missing_price)||item.price_mode!=='quote_only'&&(item.price_amount==null)&&arr(item.priceRules).filter(row=>text(row.status)==='active').length===0
    const missingCategory=Boolean((item as any).missing_category)||categoryIds.length===0
    const missingTranslation=Boolean((item as any).missing_translation)
    const providerCoverage=qualificationsByService.get(item.item_key)?.size||0
    const readinessReasons:string[]=[]
    if(!item.name_fr||!item.description_fr) readinessReasons.push('CONTENT_MISSING')
    if(!item.seo_metadata?.title_fr&&item.name_fr) readinessReasons.push('SEO_MISSING')
    if(missingPrice) readinessReasons.push('PRICING_MISSING')
    if(missingCategory) readinessReasons.push('CATEGORY_MISSING')
    if(missingMedia) readinessReasons.push('MEDIA_MISSING')
    if(!availability.length&&item.availability_status!=='available') readinessReasons.push('AVAILABILITY_MISSING')
    if(!Object.keys(item.fulfillment_config||{}).length) readinessReasons.push('FULFILLMENT_MISSING')
    if(!Object.keys(item.trust_config||{}).length) readinessReasons.push('TRUST_MISSING')
    const reasons:string[]=[]
    if(item.status==='published'&&missingMedia)reasons.push('Média actif manquant')
    if(item.status==='published'&&missingCategory)reasons.push('Catégorie storefront manquante')
    if(item.status==='published'&&missingPrice)reasons.push('Pricing incomplet')
    if(['unavailable','out_of_stock','configuration_required'].includes(item.availability_status))reasons.push(`Disponibilité: ${item.availability_status}`)
    if(item.kind==='service'&&item.status==='published'&&providerCoverage===0)reasons.push('Aucun provider qualifié actif')
    if(itemSessions.length>=20&&conversion!==null&&conversion<2)reasons.push(`Conversion 30j faible (${conversion.toFixed(1)}%)`)
    const opportunity=itemSessions.length>=20&&conversion!==null&&conversion>=8&&item.kind==='service'&&providerCoverage<=2
    const health=opportunity?'opportunity':reasons.some(reason=>/Aucun provider|unavailable|out_of_stock/.test(reason))?'critical':reasons.length?'attention':'healthy'
    return {id:item.id,reference:item.public_reference,itemKey:item.item_key,slug:item.slug,name:item.name_fr,doctrine:item.sellable_type||item.kind,kind:item.kind,status:item.status,priceMode:item.price_mode,priceAmount:item.price_amount,currencyLabel:item.currency_label,availabilityStatus:item.availability_status,featured:item.featured,mediaCount:arr(item.media).length,categoryIds,categoryCount:categoryIds.length,availabilityCount:availability.length,availableTerritories,priceRuleCount:arr(item.priceRules).length,providerCoverage,sessions30d:itemSessions.length,confirmed30d:confirmed,conversion30d:conversion,orders30d:orders,revenue30d:revenue,updatedAt:item.updated_at||null,missingMedia,missingPrice,missingCategory,missingTranslation,readiness:{ready:readinessReasons.length===0,reasons:readinessReasons},health,healthReasons:opportunity?[`Demande forte · conversion ${conversion?.toFixed(1)}% · couverture provider ${providerCoverage}`]:reasons}
  })

  const doctrineKeys=Object.keys(PRODUCT_DOCTRINES) as ProductDoctrineKey[]
  const doctrines=doctrineKeys.map(key=>{const scoped=products.filter(product=>product.doctrine===key);return{definition:PRODUCT_DOCTRINES[key],offers:scoped.length,published:scoped.filter(product=>product.status==='published').length,attention:scoped.filter(product=>product.health==='attention'||product.health==='critical').length,revenue30d:scoped.reduce((sum,product)=>sum+product.revenue30d,0)}})
  const categoryStats:CategoryStat[]=data.categories.map(category=>{const scoped=products.filter(product=>product.categoryIds.includes(category.id));return{id:category.id,key:category.category_key,title:category.title,slug:category.slug,status:category.status,visible:category.visible,itemCount:category.item_count||scoped.length,publishedItems:scoped.filter(product=>product.status==='published').length,revenue30d:scoped.reduce((sum,product)=>sum+product.revenue30d,0)}})
  const territoryStats:TerritoryAvailabilityStat[]=data.territories.map(territory=>{
    const tid=text(territory.id);let configured=0,available=0,unavailable=0,capacity=0
    for(const item of data.catalogItems)for(const rule of arr(item.availability)){if(text(rule.territory_id)!==tid)continue;configured++;if(Boolean(rule.available))available++;else unavailable++;capacity+=num(rule.capacity_limit)}
    return{id:tid,code:text(territory.territory_code),name:text(territory.name),status:text(territory.status),configured,available,unavailable,capacity}
  })
  const attention:CommerceAttention[]=products.flatMap(product=>product.healthReasons.map((reason,index)=>({id:`${product.id}:${index}`,productId:product.id,reference:product.reference,title:product.name,doctrine:product.doctrine,severity:product.health,reason,detail:`${product.status} · ${product.priceAmount==null?'prix sur devis':`${product.priceAmount.toLocaleString('fr-FR')} ${product.currencyLabel}`} · ${product.availableTerritories} territoire(s) disponible(s)`,value:product.revenue30d,action:/Média/.test(reason)?'media':/Catégorie/.test(reason)?'categories':/Pricing|Conversion/.test(reason)?'pricing':/provider|Disponibilité/.test(reason)?'availability':product.status==='published'?'open':'publication'} as CommerceAttention))).sort((a,b)=>{const rank={critical:0,attention:1,opportunity:2,healthy:3};return rank[a.severity]-rank[b.severity]||b.value-a.value}).slice(0,80)
  const lowConversion=products.filter(product=>product.sessions30d>=20&&product.conversion30d!==null&&product.conversion30d<2).length
  const incomplete=products.filter(product=>product.missingMedia||product.missingCategory||product.missingPrice||product.missingTranslation).length
  const revenue30d=products.reduce((sum,product)=>sum+product.revenue30d,0),orders30d=products.reduce((sum,product)=>sum+product.orders30d,0)
  const nextMoves=attention.slice(0,6).map(entry=>({id:entry.id,title:entry.reason,detail:`${entry.reference} · ${entry.title}`,action:entry.action,productId:entry.productId}))
  return{generatedAt:new Date().toISOString(),metrics:{total:products.length,published:products.filter(p=>p.status==='published').length,draft:products.filter(p=>p.status==='draft').length,incomplete,unavailable:products.filter(p=>['unavailable','out_of_stock','configuration_required'].includes(p.availabilityStatus)).length,priceAttention:products.filter(p=>p.missingPrice).length,withoutMedia:products.filter(p=>p.missingMedia).length,lowConversion,revenue30d,orders30d},products,catalogItems:data.catalogItems,categories:data.categories,collections:data.collections,territories:data.territories,priceBooks:data.priceBooks,media:data.media,doctrines,categoryStats,territoryStats,attention,nextMoves,recentPublications:data.publicationEvents.slice(0,20),publicationEvents:data.publicationEvents}
}

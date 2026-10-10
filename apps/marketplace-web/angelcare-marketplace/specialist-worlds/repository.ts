import 'server-only'
import {createServiceClient} from '@/lib/supabase/server'
import {PROFILES} from './content'
import type {CatalogLocale,DiscoveryItem} from '../catalog-discovery/types'
import type {Profile} from './content'
import {academyEligible,type CatalogueState} from './contract'
type Row=Record<string,unknown>
const rows=(value:unknown):Row[]=>Array.isArray(value)?value.filter((r):r is Row=>!!r&&typeof r==='object'&&!Array.isArray(r)):[]
const text=(v:unknown)=>typeof v==='string'?v:''
const obj=(v:unknown):Row=>v&&typeof v==='object'&&!Array.isArray(v)?v as Row:{}
const strings=(v:unknown)=>Array.isArray(v)?v.filter((s):s is string=>typeof s==='string'&&s.length>0):[]
export function discoveryItem(row:Row,locale:CatalogLocale):DiscoveryItem{
 const local=(base:string)=>text(row[`${base}_${locale}`])||text(row[`${base}_fr`])||text(row[base])
 return {id:text(row.id),public_reference:text(row.public_reference),item_key:text(row.item_key),slug:text(row.slug),kind:text(row.kind) as DiscoveryItem['kind'],name:local('name'),short_description:local('short_description')||null,description:local('description')||null,currency_label:text(row.currency_label)||'Dh',price_mode:text(row.price_mode) as DiscoveryItem['price_mode'],price_amount:row.price_amount==null?null:Number(row.price_amount),featured:Boolean(row.featured),availability_status:text(row.availability_status),territory_id:text(row.territory_id)||null,category_key:text(row.category_key)||null,category_title:local('category_title')||null,media_url:text(row.media_url)||null,trust_labels:strings(row.trust_labels),metadata:{...obj(row.commercial_metadata),experience_schema_key:text(row.experience_schema_key)||null,experience_schema_version:Number(row.experience_schema_version||1),experience_configuration:obj(row.experience_configuration)}}
}
// Read-only association: no title matching, taxonomy writes, synthetic offer or inferred schema.
export async function specialistCatalogue(p:Profile,locale:CatalogLocale,db?:Awaited<ReturnType<typeof createServiceClient>>):Promise<CatalogueState>{
 const client=db||await createServiceClient(),territoryCode='MA-MASTER'
 const territory=await client.from('angelcare_marketplace_territories').select('id').eq('territory_code',territoryCode).maybeSingle()
 if(territory.error)throw Error('Specialist territory read failed')
 if(!territory.data?.id)throw Error('Specialist territory is not configured')
 const territoryId=String(territory.data.id)
 // Published parent configuration may declare existing native category/collection keys.
 const config=await client.from('angelcare_marketplace_catalog_categories').select('experience_config,locale,territory_id').eq('category_key',p.parent).eq('status','published').eq('visible',true).in('locale',[locale,'fr']).or(`territory_id.is.null,territory_id.eq.${territoryId}`)
 if(config.error)throw Error('Specialist association configuration read failed')
 const configRows=rows(config.data).sort((a,b)=>Number(b.locale===locale)-Number(a.locale===locale)||Number(b.territory_id===territoryId)-Number(a.territory_id===territoryId)),configuration=configRows[0]
 const declared=obj(obj(configuration?.experience_config).specialist_associations),association=obj(declared[p.route])
 const categoryKeys=strings(association.category_keys),collectionKeys=strings(association.collection_keys)
 const exactKeys=[p.route,p.route.replaceAll('/','-')]
 const nativeKeys=categoryKeys.length?categoryKeys:exactKeys,collectionNames=collectionKeys.length?collectionKeys:exactKeys
 const categoryIds=new Set<string>()
 for(let offset=0;;offset+=240){
  const result=await client.from('angelcare_marketplace_catalog_categories').select('id').in('category_key',nativeKeys).eq('status','published').eq('visible',true).in('locale',[locale,'fr']).or(`territory_id.is.null,territory_id.eq.${territoryId}`).order('id').range(offset,offset+239)
  if(result.error)throw Error('Specialist native categories read failed')
  const page=rows(result.data);page.forEach(r=>categoryIds.add(text(r.id)));if(page.length<240)break
 }
 const ids=new Set<string>(),cats=[...categoryIds]
 for(let start=0;start<cats.length;start+=100)for(let offset=0;;offset+=240){
  const result=await client.from('angelcare_marketplace_catalog_item_categories').select('catalog_item_id,category_id').in('category_id',cats.slice(start,start+100)).order('catalog_item_id').order('category_id').range(offset,offset+239)
  if(result.error)throw Error('Specialist category memberships read failed')
  const page=rows(result.data);page.forEach(r=>ids.add(text(r.catalog_item_id)));if(page.length<240)break
 }
 let collectionsFound=false
 for(let offset=0;;offset+=240){
  const result=await client.from('angelcare_marketplace_catalog_collections_v').select('id,items').in('collection_key',collectionNames).contains('storefront_keys',[p.parent]).eq('status','active').in('locale',[locale,'fr']).order('id').range(offset,offset+239)
  if(result.error)throw Error('Specialist collections read failed')
  const page=rows(result.data);if(page.length)collectionsFound=true;page.forEach(r=>rows(r.items).forEach(i=>ids.add(text(i.id))));if(page.length<240)break
 }
 const allIds=[...ids].filter(Boolean),items:DiscoveryItem[]=[],seen=new Set<string>()
 for(let start=0;start<allIds.length;start+=100)for(let offset=0;;offset+=240){
  const result=await client.from('angelcare_marketplace_catalog_discovery_v').select('*').eq('status','published').in('id',allIds.slice(start,start+100)).or(`territory_code.is.null,territory_code.eq.${territoryCode}`).order('id').range(offset,offset+239)
  if(result.error)throw Error('Specialist canonical offers read failed')
  const page=rows(result.data);for(const row of page){const item=discoveryItem(row,locale);if(item.id&&!seen.has(item.id)){items.push(item);seen.add(item.id)}}if(page.length<240)break
 }
 return {items,status:'ready',association:categoryIds.size||collectionsFound?'category_or_collection':'unassigned'}
}
export async function academyCatalogue(locale:CatalogLocale):Promise<CatalogueState>{
 const scope={...PROFILES[0],parent:'academy' as const,route:'academy'}
 const catalogue=await specialistCatalogue(scope,locale)
 return {...catalogue,items:catalogue.items.filter(academyEligible),association:'academy'}
}

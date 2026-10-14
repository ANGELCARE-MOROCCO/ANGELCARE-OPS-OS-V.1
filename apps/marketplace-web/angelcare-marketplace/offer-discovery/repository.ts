import 'server-only'
import {createServiceClient} from '@/lib/supabase/server'
import {getDiscoveryItem} from '../catalog-discovery/repository'
import {MarketplaceError} from '../server/errors'
import {schemaContract} from '../atomic-dossier/contract'
import {candidateDomain,selectOfferDiscovery,text,record,type Candidate,type DiscoverySelection,type SelectionContext} from './model'
import type {DiscoveryItem,CatalogLocale} from '../catalog-discovery/types'
const rows=(v:unknown):Candidate[]=>Array.isArray(v)?v.filter((r):r is Candidate=>!!r&&typeof r==='object'&&!Array.isArray(r)):[]
const ids=(v:unknown)=>Array.isArray(v)?[...new Set(v.filter((x):x is string=>typeof x==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(x)))]:[]
function checked(result:{data:unknown;error:unknown}):Candidate[]{if(result.error)throw new MarketplaceError('INTERNAL_ERROR','La sélection est momentanément indisponible.');return rows(result.data)}
/** Dependency injection permits real query-contract tests without touching a database. */
export async function readOfferDiscoveryWithDatabase(db:Awaited<ReturnType<typeof createServiceClient>>,current:DiscoveryItem,locale:CatalogLocale):Promise<DiscoverySelection>{
 const schemaKey=text(current.metadata.experience_schema_key),domain=schemaContract(schemaKey)?.domain||candidateDomain({kind:current.kind});if(!domain)throw new MarketplaceError('NOT_FOUND','Offre introuvable.')
 const categoryIds=new Set<string>(),memberIds=new Set<string>(),candidates:Candidate[]=[]
 const coreResult=await db.from('angelcare_marketplace_catalog_items').select('id,sellable_type,relation_config').eq('id',current.id).eq('status','published').maybeSingle();if(coreResult.error)throw new MarketplaceError('INTERNAL_ERROR','Le contexte de cette offre est indisponible.');if(!coreResult.data)throw new MarketplaceError('NOT_FOUND','Offre introuvable.')
 const core=record(coreResult.data),config=record(core.relation_config),relations:Record<string,string[]>={};for(const key of ['cross_sell_ids','bundle_ids','upsell_ids','alternative_ids'])relations[key]=ids(config[key])
 for(let offset=0;;offset+=240){const page=checked(await db.from('angelcare_marketplace_catalog_item_categories').select('category_id').eq('catalog_item_id',current.id).order('id').range(offset,offset+239));page.forEach(r=>{if(text(r.category_id))categoryIds.add(text(r.category_id))});if(page.length<240)break}
 const visible:string[]=[],categories=[...categoryIds],visibleKeys=new Set<string>();for(let at=0;at<categories.length;at+=100){let query=db.from('angelcare_marketplace_catalog_categories').select('id,category_key').in('id',categories.slice(at,at+100)).eq('status','published').eq('visible',true);query=current.territory_id?query.or('territory_id.is.null,territory_id.eq.'+current.territory_id):query.is('territory_id',null);checked(await query).forEach(r=>{visible.push(text(r.id));if(text(r.category_key))visibleKeys.add(text(r.category_key))})}
 if(current.category_key&&!visibleKeys.has(current.category_key)){let q=db.from('angelcare_marketplace_catalog_categories').select('id,category_key').eq('category_key',current.category_key).eq('status','published').eq('visible',true);q=current.territory_id?q.or('territory_id.is.null,territory_id.eq.'+current.territory_id):q.is('territory_id',null);checked(await q).forEach(row=>{if(text(row.id)&&!visible.includes(text(row.id)))visible.push(text(row.id));if(text(row.category_key))visibleKeys.add(text(row.category_key))})}
 for(let at=0;at<visible.length;at+=100)for(let offset=0;;offset+=240){const page=checked(await db.from('angelcare_marketplace_catalog_item_categories').select('catalog_item_id').in('category_id',visible.slice(at,at+100)).order('id').range(offset,offset+239));page.forEach(r=>{if(text(r.catalog_item_id))memberIds.add(text(r.catalog_item_id))});if(page.length<240)break}
 const query=()=>{let q=db.from('angelcare_marketplace_catalog_discovery_v').select('*').eq('status','published');q=current.territory_id?q.or('territory_id.is.null,territory_id.eq.'+current.territory_id):q.is('territory_id',null);return q.order('merchandising_priority',{ascending:false}).order('id')}
 const selected=[...new Set([...memberIds,...Object.values(relations).flat()])].filter(id=>id!==current.id)
 for(let at=0;at<selected.length;at+=100)candidates.push(...checked(await query().in('id',selected.slice(at,at+100))))
 const context:SelectionContext={id:current.id,domain,schemaKey,categoryKey:current.category_key&&visibleKeys.has(current.category_key)?current.category_key:null,territoryId:current.territory_id,locale,sellableType:text(core.sellable_type),memberIds,relations,limit:8}
 // Same primary category and same schema are contextual discovery, never invented complementary links.
 if(context.categoryKey)for(let offset=0;offset<96;offset+=48){const page=checked(await query().eq('category_key',context.categoryKey).range(offset,offset+47));candidates.push(...page);if(page.length<48)break}
 if(schemaKey)for(let offset=0;offset<96;offset+=48){const page=checked(await query().eq('experience_schema_key',schemaKey).range(offset,offset+47));candidates.push(...page);if(page.length<48)break}
 const unique=[...new Map(candidates.map(r=>[text(r.id),r])).values()],candidateIds=unique.map(r=>text(r.id)).filter(Boolean),details=new Map<string,Candidate>()
 for(let at=0;at<candidateIds.length;at+=100){const page=checked(await db.from('angelcare_marketplace_catalog_items').select('id,sellable_type,attributes').in('id',candidateIds.slice(at,at+100)).eq('status','published'));page.forEach(row=>details.set(text(row.id),row))}
 return selectOfferDiscovery(unique.filter(row=>details.has(text(row.id))).map(row=>({...row,sellable_type:details.get(text(row.id))?.sellable_type,attributes:details.get(text(row.id))?.attributes})),context)
}
export async function readOfferDiscovery(input:{slug:string;locale:CatalogLocale}):Promise<DiscoverySelection>{const current=await getDiscoveryItem(input);if(!current)throw new MarketplaceError('NOT_FOUND','Offre introuvable.');return readOfferDiscoveryWithDatabase(await createServiceClient(),current,input.locale)}

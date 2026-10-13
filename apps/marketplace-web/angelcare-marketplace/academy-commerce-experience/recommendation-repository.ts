import 'server-only'
import {createServiceClient} from '@/lib/supabase/server'
import {getDiscoveryItem} from '@/angelcare-marketplace/catalog-discovery/repository'
import {publicExperienceDoctrineRecipe} from '@/angelcare-marketplace/public-experience-authority/doctrine-recipes'
import {MarketplaceError} from '../server/errors'
import {selectAcademyRecommendations,type RecommendationRow} from './recommendation-model'
import type {Locale,Related} from './model'
const rows=(v:unknown):RecommendationRow[]=>Array.isArray(v)?v.filter((r):r is RecommendationRow=>!!r&&typeof r==='object'&&!Array.isArray(r)):[]
const text=(v:unknown)=>typeof v==='string'?v:''
function checked(result:{data:unknown;error:unknown}){if(result.error)throw new MarketplaceError('INTERNAL_ERROR','La sélection de formations est momentanément indisponible.');return rows(result.data)}
export async function readAcademyRecommendations(input:{slug:string;locale:Locale}):Promise<{items:Related[]}>{
 const current=await getDiscoveryItem({slug:input.slug,locale:input.locale})
 if(!current)throw new MarketplaceError('NOT_FOUND','Formation introuvable.')
 const schemaKey=text(current.metadata.experience_schema_key),domain=(key:string)=>key?publicExperienceDoctrineRecipe(key)?.masterDomain||null:null
 if(schemaKey==='preschool-admission'||!['training','course','programme','cohort','certification_pathway','academy_programme','workshop'].includes(current.kind)||(domain(schemaKey)&&domain(schemaKey)!=='academy_admission'))throw new MarketplaceError('NOT_FOUND','Formation introuvable.')
 const db=await createServiceClient(),categoryIds=new Set<string>(),memberIds=new Set<string>(),candidates:RecommendationRow[]=[]
 // Read all native memberships without altering taxonomy, imports or offers.
 for(let offset=0;;offset+=240){const page=checked(await db.from('angelcare_marketplace_catalog_item_categories').select('category_id').eq('catalog_item_id',current.id).order('id').range(offset,offset+239));page.forEach(r=>categoryIds.add(text(r.category_id)));if(page.length<240)break}
 const visibleIds:string[]=[],ids=[...categoryIds].filter(Boolean)
 for(let at=0;at<ids.length;at+=100){let q=db.from('angelcare_marketplace_catalog_categories').select('id').in('id',ids.slice(at,at+100)).eq('status','published').eq('visible',true);q=current.territory_id?q.or('territory_id.is.null,territory_id.eq.'+current.territory_id):q.is('territory_id',null);checked(await q).forEach(r=>visibleIds.push(text(r.id)))}
 for(let at=0;at<visibleIds.length;at+=100){for(let offset=0;;offset+=240){const page=checked(await db.from('angelcare_marketplace_catalog_item_categories').select('catalog_item_id').in('category_id',visibleIds.slice(at,at+100)).order('id').range(offset,offset+239));page.forEach(r=>memberIds.add(text(r.catalog_item_id)));if(page.length<240)break}}
 const query=()=>{let q=db.from('angelcare_marketplace_catalog_discovery_v').select('*').eq('status','published').in('kind',['training','course','programme','cohort','certification_pathway','academy_programme','workshop']);q=current.territory_id?q.or('territory_id.is.null,territory_id.eq.'+current.territory_id):q.is('territory_id',null);return q.order('featured',{ascending:false}).order('merchandising_priority',{ascending:false}).order('name_fr').order('id')}
 const context={id:current.id,categoryKey:current.category_key,schemaKey:schemaKey||null,territoryId:current.territory_id,locale:input.locale,memberIds,limit:8},members=[...memberIds].filter(id=>id&&id!==current.id)
 for(let at=0;at<members.length;at+=100)candidates.push(...checked(await query().in('id',members.slice(at,at+100))))
 if(selectAcademyRecommendations(candidates,context,domain).length<8&&current.category_key)candidates.push(...checked(await query().eq('category_key',current.category_key).range(0,31)))
 if(selectAcademyRecommendations(candidates,context,domain).length<8&&schemaKey)candidates.push(...checked(await query().eq('experience_schema_key',schemaKey).range(0,31)))
 // Broader discovery fills the rail only with published products, without claiming compatibility.
 if(selectAcademyRecommendations(candidates,context,domain).length<8){for(let offset=0;offset<240;offset+=40){const page=checked(await query().range(offset,offset+39));candidates.push(...page);if(page.length<40||selectAcademyRecommendations(candidates,context,domain).length>=8)break}}
 return{items:selectAcademyRecommendations(candidates,context,domain)}
}

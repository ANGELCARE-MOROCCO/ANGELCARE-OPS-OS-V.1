import 'server-only'
import type {MarketplaceRequestContext} from '@/angelcare-marketplace/domain/types'
import {createServiceClient} from '@/lib/supabase/server'
import {STUDIO_ASSIGNMENT_CACHE_TAG,studioSourceFamilyTag} from '@/angelcare-marketplace/studio-dependency-invalidation/registry'
import {PUBLIC_EXPERIENCE_MASTER_DOMAINS} from './registry'
import {publicExperienceAuthoritySnapshot} from './repository'
import {safePublicExperienceKey} from './reference'
import type {PublicExperienceDetailScope,PublicExperienceImpactNode,PublicExperienceImpactPreview} from './types'

const node=(id:string,kind:PublicExperienceImpactNode['kind'],label:string,count:number,parentId:string|null,severity:PublicExperienceImpactNode['severity']='info'):PublicExperienceImpactNode=>({id,kind,label,count,parentId,severity})
const chunks=<T,>(rows:T[],size=200)=>Array.from({length:Math.ceil(rows.length/size)},(_,i)=>rows.slice(i*size,(i+1)*size))
const text=(value:unknown)=>typeof value==='string'?value:''

type Candidate={id:string;slug:string;schema:string;categoryKey:string|null}
async function candidateItems(scope:PublicExperienceDetailScope|'storefront',key:string):Promise<Candidate[]>{
 const db=await createServiceClient()
 if(scope==='doctrine'){const q=await db.from('angelcare_marketplace_catalog_items').select('id,slug,experience_schema_key').eq('status','published').eq('experience_schema_key',key).limit(2000);return(q.data||[]).map((r:any)=>({id:String(r.id),slug:text(r.slug),schema:text(r.experience_schema_key),categoryKey:null}))}
 if(scope==='master_domain'){const doctrines=PUBLIC_EXPERIENCE_MASTER_DOMAINS.find(row=>row.key===key)?.doctrineKeys||[];if(!doctrines.length)return[];const q=await db.from('angelcare_marketplace_catalog_items').select('id,slug,experience_schema_key').eq('status','published').in('experience_schema_key',[...doctrines]).limit(3000);return(q.data||[]).map((r:any)=>({id:String(r.id),slug:text(r.slug),schema:text(r.experience_schema_key),categoryKey:null}))}
 if(scope==='storefront'){const q=await db.from('angelcare_marketplace_catalog_discovery_v').select('id,slug,experience_schema_key,category_key').eq('status','published').eq('category_key',key).limit(1000);return(q.data||[]).map((r:any)=>({id:String(r.id),slug:text(r.slug),schema:text(r.experience_schema_key),categoryKey:text(r.category_key)||null}))}
 const cats=await db.from('angelcare_marketplace_catalog_categories').select('id,category_key,parent_category_id').neq('status','archived').limit(2000);if(cats.error)return[]
 const rows=(cats.data||[]).map((r:any)=>({id:String(r.id),key:safePublicExperienceKey(String(r.category_key||'')),parent:r.parent_category_id?String(r.parent_category_id):null})),byId=new Map(rows.map(r=>[r.id,r])),rootIds=new Set(rows.filter(r=>r.key===safePublicExperienceKey(key)).map(r=>r.id));if(!rootIds.size)return[]
 let changed=true;while(changed){changed=false;for(const row of rows)if(row.parent&&rootIds.has(row.parent)&&!rootIds.has(row.id)){rootIds.add(row.id);changed=true}}
 const links=await db.from('angelcare_marketplace_catalog_item_categories').select('catalog_item_id,category_id').in('category_id',[...rootIds].slice(0,1000)).limit(5000);const ids=[...new Set((links.data||[]).map((r:any)=>String(r.catalog_item_id)).filter(Boolean))];if(!ids.length)return[]
 const out:Candidate[]=[];for(const part of chunks(ids)){const q=await db.from('angelcare_marketplace_catalog_items').select('id,slug,experience_schema_key').eq('status','published').in('id',part);for(const r of q.data||[])out.push({id:String(r.id),slug:text((r as any).slug),schema:text((r as any).experience_schema_key),categoryKey:key})}return out
}

export async function previewPublicExperienceImpact(input:{scope:PublicExperienceDetailScope|'storefront';key:string},context:MarketplaceRequestContext):Promise<PublicExperienceImpactPreview>{
 const [snapshot,items]=await Promise.all([publicExperienceAuthoritySnapshot(context),candidateItems(input.scope,input.key)]),db=await createServiceClient(),ids=items.map(x=>x.id),warnings:string[]=[]
 let preservedOverrides=0,storefronts=input.scope==='storefront'?1:0
 if(input.scope==='business_family'){preservedOverrides=snapshot.counts.detailAssignments;warnings.push('Overrides P04 exact/placement/collection/schema/category préservés et prioritaires.')}
 if(input.scope==='doctrine'){preservedOverrides=snapshot.counts.detailAssignments;warnings.push('Blast radius doctrine: les assignations plus spécifiques restent souveraines.')}
 if(input.scope==='master_domain'){preservedOverrides=snapshot.counts.detailAssignments;warnings.push('Master domain = fallback large; business family/doctrine et P04 spécifique restent prioritaires.')}
 if(input.scope==='storefront')warnings.push('La route storefront et son renderer natif restent le fallback de sécurité.')
 const collectionIds=new Set<string>(),placementIds=new Set<string>(),pageIds=new Set<string>();let dependencyEdges=0
 for(const part of chunks(ids)){
  const [collections,placements,edgesId,edgesKey]=await Promise.all([
   db.from('angelcare_marketplace_homepage_collection_items').select('collection_id').in('catalog_item_id',part).in('status',['active','scheduled','eligible','configured']).limit(5000),
   db.from('angelcare_marketplace_homepage_placements').select('id').in('catalog_item_id',part).neq('status','archived').limit(5000),
   db.from('angelcare_marketplace_cms_dependency_edges').select('page_id').in('target_type',['catalog.items','catalog_item']).in('target_id',part).limit(5000),
   db.from('angelcare_marketplace_cms_dependency_edges').select('page_id').in('target_type',['catalog.items','catalog_item']).in('target_key',part).limit(5000),
  ])
  for(const r of collections.data||[])collectionIds.add(String((r as any).collection_id));for(const r of placements.data||[])placementIds.add(String((r as any).id));for(const r of [...(edgesId.data||[]),...(edgesKey.data||[])]){dependencyEdges++;if((r as any).page_id)pageIds.add(String((r as any).page_id))}
 }
 if(collectionIds.size){for(const part of chunks([...collectionIds])){const edge=await db.from('angelcare_marketplace_cms_dependency_edges').select('page_id').in('target_type',['homepage.collections']).in('target_id',part).limit(5000);for(const r of edge.data||[]){dependencyEdges++;if((r as any).page_id)pageIds.add(String((r as any).page_id))}}
 }
 let campaignCount=0;const campaign=await db.from('angelcare_marketplace_homepage_campaigns').select('id,primary_cta_href,secondary_cta_href,status').in('status',['active','scheduled','approved']).limit(1000);if(!campaign.error){const needles=[input.key,...items.slice(0,250).map(x=>x.slug)].filter(Boolean);campaignCount=(campaign.data||[]).filter((r:any)=>{const href=`${text(r.primary_cta_href)} ${text(r.secondary_cta_href)}`;return needles.some(n=>n&&href.includes(n))}).length;warnings.push('Campagnes: seules les dépendances CTA explicites vers ce scope/item sont comptées; aucune relation implicite n’est inventée.')}
 const publishedEntities=items.length,affectedPages=pageIds.size,routes=publishedEntities+storefronts+affectedPages,cacheTags=[STUDIO_ASSIGNMENT_CACHE_TAG,studioSourceFamilyTag('catalog.items'),...(collectionIds.size?[studioSourceFamilyTag('homepage.collections')]:[])]
 const root=`${input.scope}:${input.key}`,nodes=[node(root,'scope',input.key,publishedEntities||storefronts,null,publishedEntities>100?'high':'watch')]
 if(publishedEntities)nodes.push(node(root+':entities','entity','Offres publiées candidates',publishedEntities,root,publishedEntities>100?'high':'watch'))
 if(storefronts)nodes.push(node(root+':storefront','storefront','Storefront canonique',1,root,'watch'))
 if(collectionIds.size)nodes.push(node(root+':collections','collection','Collections directement reliées',collectionIds.size,root,collectionIds.size>10?'watch':'info'))
 if(campaignCount)nodes.push(node(root+':campaigns','campaign','Campagnes CTA explicitement reliées',campaignCount,root,'watch'))
 if(affectedPages)nodes.push(node(root+':pages','route','Pages CMS dépendantes via P12',affectedPages,root,affectedPages>50?'high':'watch'))
 nodes.push(node(root+':routes','route','Routes publiques candidates',routes,root,routes>100?'high':'info'));nodes.push(node(root+':cache','cache','Tags d’invalidation ciblés',cacheTags.length,root,'info'))
 return{scope:input.scope,key:input.key,generatedAt:new Date().toISOString(),publishedEntities,preservedOverrides,storefronts,collections:collectionIds.size,campaigns:campaignCount,placements:placementIds.size,dependencyEdges,affectedPages,routes,cacheTags,nodes,warnings}
}

import crypto from "node:crypto"
import { auditSocial } from "@/lib/social-command/repository"
import type { SocialCommandActor } from "@/lib/social-command/auth"
import { cleanString, jsonObject, nowIso, socialDb, stringArray } from "@/lib/social-command/db"
import { createDeliveryUrl, deleteGatewayAsset } from "@/lib/social-command/storage"
import type { MediaVaultAsset, MediaVaultBootstrap, MediaVaultCategory, MediaVaultCollection, MediaVaultPermissions } from "@/lib/social-command/media-vault-types"

const ADMIN_ROLES = new Set(["admin","administrator","superadmin","super_admin","ceo","director","directeur","managing_director"])
const GOVERNOR_ROLES = new Set([...ADMIN_ROLES,"marketing_manager","marketing","manager","brand_manager","content_manager"])

function role(actor:SocialCommandActor){return cleanString(actor.role,120).toLowerCase().replace(/\s+/g,"_")||"user"}
function truthy(name:string,fallback=false){const v=String(process.env[name]??"").trim().toLowerCase();return v?["1","true","yes","on"].includes(v):fallback}
function normalize(value:string){return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,100)}
function lifecycle(value:unknown){const v=cleanString(value,40).toLowerCase();return v==="archived"||v==="trashed"?v:"active"}
function splitTags(value:unknown){return [...new Set((Array.isArray(value)?value.map(String):String(value??"").split(/[|;,\n]+/)).map(v=>cleanString(v,120)).filter(Boolean))]}

export function mediaVaultPermissions(actor:SocialCommandActor):MediaVaultPermissions{
  const actorRole=role(actor)
  const enforce=truthy("SOCIAL_COMMAND_MEDIA_VAULT_RBAC_ENFORCE",false)
  const govern=!enforce||GOVERNOR_ROLES.has(actorRole)
  const hard=!enforce||ADMIN_ROLES.has(actorRole)||truthy("SOCIAL_COMMAND_MEDIA_VAULT_ALLOW_HARD_DELETE",false)
  return {view:true,create:true,edit:true,classify:true,archive:govern,restore:govern,trash:govern,hardDelete:hard,manageCategories:govern,manageCollections:govern,actorRole,actorId:actor.id}
}
function requirePermission(actor:SocialCommandActor,key:keyof MediaVaultPermissions){const p=mediaVaultPermissions(actor);if(!p[key])throw new Error(`MEDIA_VAULT_PERMISSION_DENIED:${String(key)}`);return p}

async function categories(){const db=await socialDb();const {data,error}=await db.from("social_command_media_categories").select("*").order("sort_order",{ascending:true}).order("name",{ascending:true});if(error)throw error;return (data||[]) as MediaVaultCategory[]}
async function collections(){const db=await socialDb();const {data,error}=await db.from("social_command_media_collections").select("*").order("sort_order",{ascending:true}).order("name",{ascending:true});if(error)throw error;return (data||[]) as MediaVaultCollection[]}

async function hydrate(raw:any[]):Promise<MediaVaultAsset[]>{
  if(!raw.length)return []
  const db=await socialDb();const ids=raw.map(r=>r.id)
  const [catRows,colRows,cats,cols]=await Promise.all([
    db.from("social_command_media_category_links").select("asset_id,category_id").in("asset_id",ids),
    db.from("social_command_media_collection_items").select("asset_id,collection_id,sort_order").in("asset_id",ids).order("sort_order",{ascending:true}),
    categories(),collections(),
  ])
  if(catRows.error)throw catRows.error;if(colRows.error)throw colRows.error
  const catById=new Map(cats.map(c=>[c.id,c])),colById=new Map(cols.map(c=>[c.id,c]))
  const catMap=new Map<string,MediaVaultCategory[]>(),colMap=new Map<string,MediaVaultCollection[]>()
  for(const link of catRows.data||[]){const cat=catById.get(link.category_id);if(cat)catMap.set(link.asset_id,[...(catMap.get(link.asset_id)||[]),cat])}
  for(const link of colRows.data||[]){const col=colById.get(link.collection_id);if(col)colMap.set(link.asset_id,[...(colMap.get(link.asset_id)||[]),col])}
  return raw.map(row=>{let preview_url:string|null=null;try{if(row.status==="ready"&&row.lifecycle_status==="active")preview_url=createDeliveryUrl(row,6*60*60*1000)}catch{};return {...row,title:row.title||row.original_filename,description:row.description||"",lifecycle_status:row.lifecycle_status||"active",favorite:Boolean(row.favorite),updated_by:row.updated_by||null,updated_at:row.updated_at||row.created_at,categories:catMap.get(row.id)||[],collections:colMap.get(row.id)||[],preview_url} as MediaVaultAsset})
}

export async function listMediaVault(input:Record<string,unknown>,actor:SocialCommandActor):Promise<MediaVaultBootstrap>{
  requirePermission(actor,"view");const db=await socialDb();const {data,error}=await db.from("social_command_media_assets").select("*").neq("status","deleted").order("created_at",{ascending:false}).limit(1200);if(error)throw error
  const all=await hydrate(data||[]);let assets=all
  const q=cleanString(input.q,300).toLowerCase(),life=cleanString(input.lifecycle,40).toLowerCase(),categoryId=cleanString(input.categoryId??input.category_id,120),collectionId=cleanString(input.collectionId??input.collection_id,120),campaignId=cleanString(input.campaignId??input.campaign_id,120),kind=cleanString(input.kind,40).toLowerCase(),status=cleanString(input.status,40).toLowerCase(),favorite=String(input.favorite||"").toLowerCase()
  if(life)assets=assets.filter(a=>a.lifecycle_status===life);else assets=assets.filter(a=>a.lifecycle_status!=="trashed")
  if(status)assets=assets.filter(a=>a.status===status)
  if(categoryId)assets=assets.filter(a=>a.categories.some(c=>c.id===categoryId))
  if(collectionId)assets=assets.filter(a=>a.collections.some(c=>c.id===collectionId))
  if(campaignId)assets=assets.filter(a=>a.campaign_id===campaignId)
  if(kind==="image")assets=assets.filter(a=>a.mime_type.startsWith("image/"));if(kind==="video")assets=assets.filter(a=>a.mime_type.startsWith("video/"))
  if(favorite==="true")assets=assets.filter(a=>a.favorite)
  if(q)assets=assets.filter(a=>`${a.title} ${a.original_filename} ${a.description} ${(a.tags||[]).join(" ")} ${a.categories.map(c=>c.name).join(" ")} ${a.collections.map(c=>c.name).join(" ")}`.toLowerCase().includes(q))
  const cats=await categories(),cols=await collections();const active=all.filter(a=>a.lifecycle_status==="active")
  return {assets,categories:cats,collections:cols,stats:{active:active.length,archived:all.filter(a=>a.lifecycle_status==="archived").length,trashed:all.filter(a=>a.lifecycle_status==="trashed").length,ready:active.filter(a=>a.status==="ready").length,images:active.filter(a=>a.mime_type.startsWith("image/")).length,videos:active.filter(a=>a.mime_type.startsWith("video/")).length,favorites:active.filter(a=>a.favorite).length,categories:cats.filter(c=>c.status==="active").length,collections:cols.filter(c=>c.status==="active").length,bytes:active.reduce((n,a)=>n+Number(a.size_bytes||0),0)},permissions:mediaVaultPermissions(actor)}
}

export async function getMediaVaultAsset(id:string,actor:SocialCommandActor){requirePermission(actor,"view");const db=await socialDb();const {data,error}=await db.from("social_command_media_assets").select("*").eq("id",id).maybeSingle();if(error)throw error;if(!data)throw new Error("Media asset not found");return (await hydrate([data]))[0]}

async function replaceCategories(assetId:string,ids:string[]){const db=await socialDb();const {error:del}=await db.from("social_command_media_category_links").delete().eq("asset_id",assetId);if(del)throw del;if(ids.length){const {error}=await db.from("social_command_media_category_links").insert([...new Set(ids)].map(category_id=>({asset_id:assetId,category_id})));if(error)throw error}}
async function replaceCollections(assetId:string,ids:string[]){const db=await socialDb();const {error:del}=await db.from("social_command_media_collection_items").delete().eq("asset_id",assetId);if(del)throw del;if(ids.length){const {error}=await db.from("social_command_media_collection_items").insert([...new Set(ids)].map((collection_id,index)=>({asset_id:assetId,collection_id,sort_order:index})));if(error)throw error}}
async function syncTags(assetId:string,tags:string[],actorId:string){const db=await socialDb();const {error:clearError}=await db.from("social_command_media_asset_tags").delete().eq("asset_id",assetId);if(clearError)throw clearError;for(const label of tags){const normalized_label=normalize(label);if(!normalized_label)continue;const {data,error}=await db.from("social_command_media_tags").upsert({label,normalized_label,created_by:actorId},{onConflict:"normalized_label"}).select("id").single();if(error)throw error;const {error:link}=await db.from("social_command_media_asset_tags").upsert({asset_id:assetId,tag_id:data.id},{onConflict:"asset_id,tag_id"});if(link)throw link}}

export async function updateMediaVaultAsset(id:string,input:Record<string,unknown>,actor:SocialCommandActor){
  requirePermission(actor,"edit");const db=await socialDb();const patch:any={updated_by:actor.id,updated_at:nowIso()}
  if(input.title!==undefined)patch.title=cleanString(input.title,260);if(input.description!==undefined)patch.description=cleanString(input.description,3000);if(input.favorite!==undefined)patch.favorite=Boolean(input.favorite);if(input.campaignId!==undefined||input.campaign_id!==undefined)patch.campaign_id=cleanString(input.campaignId??input.campaign_id,120)||null;if(input.metadata!==undefined)patch.metadata=jsonObject(input.metadata)
  let tags:string[]|null=null;if(input.tags!==undefined){tags=splitTags(input.tags);patch.tags=tags}
  const {error}=await db.from("social_command_media_assets").update(patch).eq("id",id);if(error)throw error
  if(input.categoryIds!==undefined||input.category_ids!==undefined)await replaceCategories(id,stringArray(input.categoryIds??input.category_ids))
  if(input.collectionIds!==undefined||input.collection_ids!==undefined)await replaceCollections(id,stringArray(input.collectionIds??input.collection_ids))
  if(tags)await syncTags(id,tags,actor.id)
  await auditSocial(actor.id,"media_vault.asset_updated","media_asset",id,{fields:Object.keys(patch)});return getMediaVaultAsset(id,actor)
}

export async function setMediaLifecycle(id:string,state:"active"|"archived"|"trashed",actor:SocialCommandActor){const permission=state==="active"?"restore":state==="archived"?"archive":"trash";requirePermission(actor,permission);const db=await socialDb();const now=nowIso();const patch:any={lifecycle_status:state,updated_by:actor.id,updated_at:now};if(state==="archived"||state==="trashed")patch.archived_at=now;else patch.archived_at=null;const {error}=await db.from("social_command_media_assets").update(patch).eq("id",id);if(error)throw error;await auditSocial(actor.id,`media_vault.${state}`,"media_asset",id);return {id,lifecycle:state}}
export const archiveMediaAsset=(id:string,actor:SocialCommandActor)=>setMediaLifecycle(id,"archived",actor)
export const restoreMediaAsset=(id:string,actor:SocialCommandActor)=>setMediaLifecycle(id,"active",actor)
export const trashMediaAsset=(id:string,actor:SocialCommandActor)=>setMediaLifecycle(id,"trashed",actor)

export async function purgeMediaAsset(id:string,confirmation:string,actor:SocialCommandActor){
  requirePermission(actor,"hardDelete");if(confirmation!=="PERMANENTLY DELETE")throw new Error("MEDIA_VAULT_CONFIRMATION_REQUIRED")
  const db=await socialDb();const {data:asset,error}=await db.from("social_command_media_assets").select("*").eq("id",id).maybeSingle();if(error)throw error;if(!asset)throw new Error("Media asset not found")
  if(asset.lifecycle_status!=="trashed")throw new Error("MEDIA_VAULT_PURGE_REQUIRES_TRASH")
  const [{data:pubLinks,error:pubError},{data:usage,error:usageError}]=await Promise.all([db.from("social_command_publication_media").select("publication_id").eq("asset_id",id),db.from("social_command_media_usage").select("entity_type,entity_id,usage_role,created_at").eq("asset_id",id).limit(5000)])
  if(pubError)throw pubError;if(usageError)throw usageError
  const tombstone={id:crypto.randomUUID(),asset_id:id,title:asset.title||asset.original_filename,original_filename:asset.original_filename,mime_type:asset.mime_type,size_bytes:asset.size_bytes,sha256_hash:asset.sha256_hash,storage_provider:asset.storage_provider,storage_key:asset.storage_key,usage_count:Number(asset.usage_count||0),publication_ids:[...new Set((pubLinks||[]).map((r:any)=>r.publication_id))],usage_snapshot:usage||[],deleted_by:actor.id,deleted_at:nowIso(),metadata:{campaign_id:asset.campaign_id,tags:asset.tags}}
  const {error:tomb}=await db.from("social_command_media_tombstones").upsert(tombstone,{onConflict:"asset_id"});if(tomb)throw tomb
  try{await deleteGatewayAsset(id)}catch(error){const msg=error instanceof Error?error.message:String(error);if(!/(404|not found|enoent|missing)/i.test(msg))throw error}
  const {error:pubDelete}=await db.from("social_command_publication_media").delete().eq("asset_id",id);if(pubDelete)throw pubDelete
  const {error:usageDelete}=await db.from("social_command_media_usage").delete().eq("asset_id",id);if(usageDelete)throw usageDelete
  const {error:del}=await db.from("social_command_media_assets").delete().eq("id",id);if(del)throw del
  await auditSocial(actor.id,"media_vault.permanently_deleted","media_asset",id,{usageCount:tombstone.usage_count,publicationCount:tombstone.publication_ids.length});return {purged:true,id}
}

export async function createMediaCategory(input:Record<string,unknown>,actor:SocialCommandActor){requirePermission(actor,"manageCategories");const db=await socialDb();const name=cleanString(input.name,160);if(!name)throw new Error("Category name required");const row={id:crypto.randomUUID(),name,slug:normalize(cleanString(input.slug,120)||name)||crypto.randomUUID().slice(0,8),parent_id:cleanString(input.parentId??input.parent_id,120)||null,description:cleanString(input.description,1000),status:"active",sort_order:Number(input.sortOrder??input.sort_order??0),created_by:actor.id,created_at:nowIso(),updated_at:nowIso()};const {data,error}=await db.from("social_command_media_categories").insert(row).select("*").single();if(error)throw error;await auditSocial(actor.id,"media_vault.category_created","media_category",row.id,{name});return data as MediaVaultCategory}
export async function updateMediaCategory(id:string,input:Record<string,unknown>,actor:SocialCommandActor){requirePermission(actor,"manageCategories");const db=await socialDb();const patch:any={updated_at:nowIso()};if(input.name!==undefined){patch.name=cleanString(input.name,160);patch.slug=normalize(patch.name)}if(input.description!==undefined)patch.description=cleanString(input.description,1000);if(input.parentId!==undefined||input.parent_id!==undefined)patch.parent_id=cleanString(input.parentId??input.parent_id,120)||null;if(input.status!==undefined)patch.status=lifecycle(input.status);if(input.sortOrder!==undefined||input.sort_order!==undefined)patch.sort_order=Number(input.sortOrder??input.sort_order??0);const {data,error}=await db.from("social_command_media_categories").update(patch).eq("id",id).select("*").single();if(error)throw error;await auditSocial(actor.id,"media_vault.category_updated","media_category",id,{fields:Object.keys(patch)});return data as MediaVaultCategory}
export async function purgeMediaCategory(id:string,confirmation:string,actor:SocialCommandActor){requirePermission(actor,"manageCategories");if(confirmation!=="PERMANENTLY DELETE")throw new Error("MEDIA_CATEGORY_CONFIRMATION_REQUIRED");const db=await socialDb();const {data:row,error:read}=await db.from("social_command_media_categories").select("id,name,status").eq("id",id).maybeSingle();if(read)throw read;if(!row)throw new Error("Media category not found");if(row.status!=="trashed")throw new Error("MEDIA_CATEGORY_PURGE_REQUIRES_TRASH");const {error}=await db.from("social_command_media_categories").delete().eq("id",id);if(error)throw error;await auditSocial(actor.id,"media_vault.category_deleted","media_category",id,{name:row.name});return {purged:true,id}}

export async function createMediaCollection(input:Record<string,unknown>,actor:SocialCommandActor){requirePermission(actor,"manageCollections");const db=await socialDb();const name=cleanString(input.name,180);if(!name)throw new Error("Collection name required");const row={id:crypto.randomUUID(),name,description:cleanString(input.description,1200),status:"active",campaign_id:cleanString(input.campaignId??input.campaign_id,120)||null,sort_order:Number(input.sortOrder??input.sort_order??0),created_by:actor.id,created_at:nowIso(),updated_at:nowIso()};const {data,error}=await db.from("social_command_media_collections").insert(row).select("*").single();if(error)throw error;await auditSocial(actor.id,"media_vault.collection_created","media_collection",row.id,{name});return data as MediaVaultCollection}
export async function updateMediaCollection(id:string,input:Record<string,unknown>,actor:SocialCommandActor){requirePermission(actor,"manageCollections");const db=await socialDb();const patch:any={updated_at:nowIso()};if(input.name!==undefined)patch.name=cleanString(input.name,180);if(input.description!==undefined)patch.description=cleanString(input.description,1200);if(input.status!==undefined)patch.status=lifecycle(input.status);if(input.campaignId!==undefined||input.campaign_id!==undefined)patch.campaign_id=cleanString(input.campaignId??input.campaign_id,120)||null;if(input.sortOrder!==undefined||input.sort_order!==undefined)patch.sort_order=Number(input.sortOrder??input.sort_order??0);const {data,error}=await db.from("social_command_media_collections").update(patch).eq("id",id).select("*").single();if(error)throw error;await auditSocial(actor.id,"media_vault.collection_updated","media_collection",id,{fields:Object.keys(patch)});return data as MediaVaultCollection}
export async function purgeMediaCollection(id:string,confirmation:string,actor:SocialCommandActor){requirePermission(actor,"manageCollections");if(confirmation!=="PERMANENTLY DELETE")throw new Error("MEDIA_COLLECTION_CONFIRMATION_REQUIRED");const db=await socialDb();const {data:row,error:read}=await db.from("social_command_media_collections").select("id,name,status").eq("id",id).maybeSingle();if(read)throw read;if(!row)throw new Error("Media collection not found");if(row.status!=="trashed")throw new Error("MEDIA_COLLECTION_PURGE_REQUIRES_TRASH");const {error}=await db.from("social_command_media_collections").delete().eq("id",id);if(error)throw error;await auditSocial(actor.id,"media_vault.collection_deleted","media_collection",id,{name:row.name});return {purged:true,id}}

export async function bulkMediaAction(input:Record<string,unknown>,actor:SocialCommandActor){
  const ids=stringArray(input.assetIds??input.asset_ids).slice(0,300);if(!ids.length)throw new Error("No media selected")
  const action=cleanString(input.action,40);const results=[] as any[]
  for(const id of ids){
    try{
      if(action==="archive")results.push({id,ok:true,data:await archiveMediaAsset(id,actor)})
      else if(action==="restore")results.push({id,ok:true,data:await restoreMediaAsset(id,actor)})
      else if(action==="trash")results.push({id,ok:true,data:await trashMediaAsset(id,actor)})
      else if(action==="classify"){
        const current=await getMediaVaultAsset(id,actor)
        const addCategories=stringArray(input.categoryIds??input.category_ids)
        const addCollections=stringArray(input.collectionIds??input.collection_ids)
        const categoryIds=[...new Set([...current.categories.map(c=>c.id),...addCategories])]
        const collectionIds=[...new Set([...current.collections.map(c=>c.id),...addCollections])]
        const body:Record<string,unknown>={categoryIds,collectionIds}
        if(input.tags!==undefined)body.tags=[...new Set([...(current.tags||[]),...splitTags(input.tags)])]
        results.push({id,ok:true,data:await updateMediaVaultAsset(id,body,actor)})
      }else throw new Error("Unsupported media bulk action")
    }catch(error){results.push({id,ok:false,error:error instanceof Error?error.message:String(error)})}
  }
  return {results,ok:results.filter(r=>r.ok).length,failed:results.filter(r=>!r.ok).length}
}

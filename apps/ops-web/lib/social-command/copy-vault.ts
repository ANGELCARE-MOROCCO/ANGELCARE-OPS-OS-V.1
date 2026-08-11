import crypto from "node:crypto"
import { cleanString, jsonObject, nowIso, socialDb, stringArray } from "@/lib/social-command/db"
import { auditSocial } from "@/lib/social-command/repository"
import type { SocialCommandActor } from "@/lib/social-command/auth"
import type {
  CopyVaultBootstrap, CopyVaultCategory, CopyVaultImportMapping, CopyVaultImportPreview,
  CopyVaultImportPreviewRow, CopyVaultItem, CopyVaultPermissions, CopyVaultType,
  CopyVaultUsageSummary, CopyVaultVersion,
} from "@/lib/social-command/copy-vault-types"
import { COPY_VAULT_TYPES } from "@/lib/social-command/copy-vault-types"
import type { SocialChannel, SocialFormat } from "@/lib/social-command/types"

const COPY_STATUSES = new Set(["draft","in_review","approved","rejected","archived","expired"])
const CHANNELS = new Set<SocialChannel>(["facebook","instagram"])
const FORMATS = new Set<SocialFormat>(["post","story","reel","carousel"])
const DEFAULT_GOVERNOR_ROLES = ["admin","administrator","superadmin","super_admin","ceo","director","directeur","managing_director","marketing_manager","marketing","manager"]
const DEFAULT_EDITOR_ROLES = [...DEFAULT_GOVERNOR_ROLES,"editor","content_editor","social_editor","social_operator","operator"]
const DEFAULT_VIEWER_ROLES = [...DEFAULT_EDITOR_ROLES,"viewer","analyst","coordinator","coordinatrice"]
const DIRECTOR_ROLES = new Set(["admin","administrator","superadmin","super_admin","ceo","director","directeur","managing_director"])
const MARKETING_ROLES = new Set([...DEFAULT_GOVERNOR_ROLES,"marketing_lead","brand_manager","brand"])

function boolEnv(name: string, fallback = false) {
  const raw = String(process.env[name] ?? "").trim().toLowerCase()
  if (!raw) return fallback
  return ["1","true","yes","on"].includes(raw)
}
function roleSet(name: string, fallback: string[]) {
  const configured = String(process.env[name] || "").split(",").map(v => v.trim().toLowerCase()).filter(Boolean)
  return new Set(configured.length ? configured : fallback)
}
function normalizedRole(actor: SocialCommandActor) { return cleanString(actor.role, 120).toLowerCase().replace(/\s+/g, "_") || "user" }
function actorPermissionCodes(actor:SocialCommandActor){
  const raw=actor.raw||{}
  const candidates=[raw.permissions,raw.permission_codes,raw.permissionCodes,raw.capabilities]
  const values=candidates.flatMap(value=>Array.isArray(value)?value.map(String):[])
  return new Set(values.map(value=>value.trim().toLowerCase()).filter(Boolean))
}
export function copyVaultPermissions(actor: SocialCommandActor): CopyVaultPermissions {
  const role = normalizedRole(actor)
  const enforced = boolEnv("SOCIAL_COMMAND_COPY_VAULT_RBAC_ENFORCE", false)
  if(!enforced){return {view:true,use:true,create:true,edit:true,editOwn:true,editAll:true,submit:true,import:true,approve:true,reject:true,manageCategories:true,archive:true,restore:true,trash:true,hardDelete:true,deleteCategories:true,governance:true,rbacEnforced:false,actorRole:role,actorId:actor.id}}
  const governor = roleSet("SOCIAL_COMMAND_COPY_VAULT_GOVERNOR_ROLES", DEFAULT_GOVERNOR_ROLES)
  const editor = roleSet("SOCIAL_COMMAND_COPY_VAULT_EDITOR_ROLES", DEFAULT_EDITOR_ROLES)
  const viewer = roleSet("SOCIAL_COMMAND_COPY_VAULT_VIEWER_ROLES", DEFAULT_VIEWER_ROLES)
  const explicit=actorPermissionCodes(actor)
  const has=(code:string)=>explicit.has(code)||explicit.has("copy.*")||explicit.has("social_command.copy.*")
  const govern=governor.has(role)
  const editRole=govern||editor.has(role)
  const viewRole=editRole||viewer.has(role)
  const editOwn=editRole||has("copy.edit_own")
  const editAll=govern||has("copy.edit_all")
  return {
    view:viewRole||has("copy.view"), use:viewRole||has("copy.use"), create:editRole||has("copy.create"),
    edit:editOwn||editAll, editOwn, editAll, submit:editRole||has("copy.submit"), import:editRole||has("copy.import"),
    approve:govern||has("copy.approve"), reject:govern||has("copy.reject"), manageCategories:govern||has("copy.manage_categories"),
    archive:govern||has("copy.archive"), restore:govern||has("copy.restore"), trash:govern||has("copy.trash"),
    hardDelete:DIRECTOR_ROLES.has(role)||has("copy.hard_delete"), deleteCategories:govern||has("copy.delete_categories"),
    governance:govern||has("copy.manage_governance"), rbacEnforced:true, actorRole:role, actorId:actor.id,
  }
}
function requirePermission(actor: SocialCommandActor, permission: keyof CopyVaultPermissions) {
  const permissions = copyVaultPermissions(actor)
  if (!permissions[permission]) throw new Error(`COPY_VAULT_PERMISSION_DENIED:${String(permission)}`)
  return permissions
}
function requireItemEdit(actor:SocialCommandActor,item:CopyVaultItem){
  const permissions=copyVaultPermissions(actor)
  if(permissions.editAll)return permissions
  if(permissions.editOwn&&(item.owner_user_id===actor.id||item.created_by===actor.id))return permissions
  throw new Error("COPY_VAULT_PERMISSION_DENIED:copy.edit_own")
}
function normalizeText(value: unknown) { return cleanString(value, 30000).toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim() }
function fingerprint(body: string) { return crypto.createHash("sha256").update(normalizeText(body)).digest("hex") }
function slugify(value: string) { return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100) || `category-${crypto.randomUUID().slice(0,8)}` }
function splitFlexible(value: unknown) {
  const source = Array.isArray(value) ? value.map(String) : String(value ?? "").split(/[|;,\n]+/)
  return [...new Set(source.map(v => cleanString(v, 200)).filter(Boolean))]
}
function splitHashtags(value: unknown) {
  const source = Array.isArray(value) ? value.map(String) : String(value ?? "").split(/[\s|;,\n]+/)
  return [...new Set(source.map(v => cleanString(v, 200).replace(/^#/, "")).filter(Boolean))]
}
function channels(value: unknown): SocialChannel[] { return splitFlexible(value).map(v=>v.toLowerCase()).filter((v):v is SocialChannel=>CHANNELS.has(v as SocialChannel)) }
function formats(value: unknown): SocialFormat[] { return splitFlexible(value).map(v=>v.toLowerCase()).filter((v):v is SocialFormat=>FORMATS.has(v as SocialFormat)) }
function copyType(value: unknown): CopyVaultType {
  const v = cleanString(value, 100).toLowerCase() as CopyVaultType
  return COPY_VAULT_TYPES.includes(v) ? v : "post_caption"
}
function dateOrNull(value: unknown) {
  const raw = cleanString(value, 80); if (!raw) return null
  const d = new Date(raw); return Number.isNaN(d.getTime()) ? null : d.toISOString()
}
function currentStatus(version: CopyVaultVersion | null) {
  if (!version) return "draft"
  if (version.status === "approved" && version.valid_until && new Date(version.valid_until).getTime() < Date.now()) return "expired"
  return version.status
}
function tokenSet(value: string) { return new Set(normalizeText(value).split(/[^a-z0-9]+/).filter(v=>v.length>2)) }
function jaccard(a: string, b: string) {
  const A=tokenSet(a), B=tokenSet(b); if (!A.size || !B.size) return 0
  let inter=0; for (const token of A) if (B.has(token)) inter++
  return inter / (A.size + B.size - inter)
}
function safeJson(value: unknown) { return jsonObject(value) }
function asCopyVersion(row: any): CopyVaultVersion { return row as CopyVaultVersion }
function missingTableMessage(error: any) {
  const message = String(error?.message || error || "")
  if (/social_command_copy_/i.test(message) && /(does not exist|relation|schema cache)/i.test(message)) {
    return new Error("COPY_VAULT_DATABASE_NOT_READY: apply 20260810_social_command_mz5_copy_vault_migration.sql")
  }
  return error instanceof Error ? error : new Error(message || "Copy Vault database error")
}

async function readCategories() {
  const db = await socialDb()
  const { data, error } = await db.from("social_command_copy_categories").select("*").order("sort_order",{ascending:true}).order("name",{ascending:true})
  if (error) throw missingTableMessage(error)
  return (data || []) as CopyVaultCategory[]
}

async function hydrateItems(rawItems: any[], includeHistory = false): Promise<CopyVaultItem[]> {
  if (!rawItems.length) return []
  const db = await socialDb(); const ids = rawItems.map(row=>row.id)
  const [versionsResult, linksResult, usageResult] = await Promise.all([
    db.from("social_command_copy_versions").select("*").in("item_id",ids).order("version_no",{ascending:false}),
    db.from("social_command_copy_category_links").select("item_id,category_id").in("item_id",ids),
    db.from("social_command_copy_usage_events").select("item_id,version_no,surface,publication_id,bulk_plan_id,actor_user_id,content_snapshot,customized,context,created_at,id").in("item_id",ids).order("created_at",{ascending:false}).limit(5000),
  ])
  if (versionsResult.error) throw missingTableMessage(versionsResult.error)
  if (linksResult.error) throw missingTableMessage(linksResult.error)
  if (usageResult.error) throw missingTableMessage(usageResult.error)
  const categories = await readCategories()
  const categoryById = new Map(categories.map(c=>[c.id,c]))
  const versionsByItem = new Map<string,CopyVaultVersion[]>(); for (const row of versionsResult.data||[]) { const list=versionsByItem.get(row.item_id)||[]; list.push(asCopyVersion(row)); versionsByItem.set(row.item_id,list) }
  const linksByItem = new Map<string,string[]>(); for(const row of linksResult.data||[]) { const list=linksByItem.get(row.item_id)||[]; list.push(row.category_id); linksByItem.set(row.item_id,list) }
  const usageByItem = new Map<string,any[]>(); for(const row of usageResult.data||[]) { const list=usageByItem.get(row.item_id)||[]; list.push(row); usageByItem.set(row.item_id,list) }
  const pubIds=[...new Set((usageResult.data||[]).map((u:any)=>u.publication_id).filter(Boolean))]
  const publicationStates=new Map<string,string>(); const metricCodesByPublication=new Map<string,Set<string>>()
  if(pubIds.length){
    const [{data:pubs,error:pubErr},{data:metrics,error:metricErr}] = await Promise.all([
      db.from("social_command_publications").select("id,status").in("id",pubIds),
      db.from("social_command_metric_snapshots").select("entity_id,metric_code,truth_state").eq("entity_type","publication").in("entity_id",pubIds).in("truth_state",["live","stale"]).limit(5000),
    ])
    if(pubErr) throw pubErr
    if(metricErr) throw metricErr
    for(const row of pubs||[]) publicationStates.set(row.id,row.status)
    for(const row of metrics||[]){const set=metricCodesByPublication.get(row.entity_id)||new Set<string>();set.add(row.metric_code);metricCodesByPublication.set(row.entity_id,set)}
  }
  return rawItems.map(row=>{
    const versions=versionsByItem.get(row.id)||[]
    const current=versions.find(v=>v.version_no===row.current_version_no)||versions[0]||null
    const approved=row.approved_version_no?versions.find(v=>v.version_no===row.approved_version_no)||null:null
    const usage=usageByItem.get(row.id)||[]
    const publicationUses=usage.filter(u=>u.publication_id).length
    const publishedUses=usage.filter(u=>u.publication_id&&publicationStates.get(u.publication_id)==="published").length
    const metricCodes=new Set<string>(); let metricEvidence=0
    for(const u of usage){ if(!u.publication_id)continue; const codes=metricCodesByPublication.get(u.publication_id); if(codes){metricEvidence+=codes.size;for(const code of codes)metricCodes.add(code)} }
    const summary:CopyVaultUsageSummary={total:usage.length,publicationUses,publishedUses,lastUsedAt:usage[0]?.created_at||row.last_used_at||null,metricEvidence,metricCodes:[...metricCodes]}
    const item:CopyVaultItem={...row,categories:(linksByItem.get(row.id)||[]).map(id=>categoryById.get(id)).filter(Boolean) as CopyVaultCategory[],current_version:current?{...current,status:currentStatus(current) as any}:null,approved_version:approved?{...approved,status:currentStatus(approved) as any}:null,usage_summary:summary}
    if(includeHistory){item.versions=versions;item.usage=usage as any[]}
    return item
  })
}

export async function listCopyVault(input: Record<string,unknown>, actor: SocialCommandActor): Promise<CopyVaultBootstrap> {
  requirePermission(actor,"view")
  const db=await socialDb(); const {data,error}=await db.from("social_command_copy_items").select("*").order("updated_at",{ascending:false}).limit(1200)
  if(error) throw missingTableMessage(error)
  const all=await hydrateItems(data||[])
  let items=all
  const q=normalizeText(input.q)
  const status=cleanString(input.status,60).toLowerCase()
  const lifecycle=cleanString(input.lifecycle,40).toLowerCase()
  const language=cleanString(input.language,40).toLowerCase()
  const businessUnit=cleanString(input.businessUnit??input.business_unit,120).toLowerCase()
  const type=cleanString(input.copyType??input.copy_type,100)
  const categoryId=cleanString(input.categoryId??input.category_id,120)
  const approvedOnly=String(input.approvedOnly??input.approved_only??"").toLowerCase()==="true"||input.approvedOnly===true
  if(lifecycle) items=items.filter(item=>item.lifecycle_status===lifecycle)
  else if(status==="trashed") items=items.filter(item=>item.lifecycle_status==="trashed")
  else if(status==="archived") items=items.filter(item=>item.lifecycle_status==="archived")
  else items=items.filter(item=>item.lifecycle_status!=="trashed")
  if(q) items=items.filter(item=>normalizeText(`${item.code} ${item.title} ${item.business_unit} ${item.current_version?.body||""} ${item.approved_version?.body||""} ${item.current_version?.tags.join(" ")||""} ${item.categories.map(c=>c.name).join(" ")}`).includes(q))
  if(status&&status!=="archived"&&status!=="trashed") items=items.filter(item=>status==="approved"?item.approved_version?.status==="approved":item.current_version?.status===status)
  if(language) items=items.filter(item=>(item.approved_version||item.current_version)?.language.toLowerCase()===language)
  if(businessUnit) items=items.filter(item=>item.business_unit.toLowerCase()===businessUnit)
  if(type) items=items.filter(item=>item.copy_type===type)
  if(categoryId) items=items.filter(item=>item.categories.some(c=>c.id===categoryId))
  if(approvedOnly) items=items.filter(item=>item.lifecycle_status==="active"&&item.approved_version?.status==="approved"&&(!item.approved_version.valid_from||new Date(item.approved_version.valid_from).getTime()<=Date.now())&&(!item.approved_version.valid_until||new Date(item.approved_version.valid_until).getTime()>=Date.now()))
  const categories=await readCategories()
  const stats={
    items:all.filter(i=>i.lifecycle_status==="active").length,
    approved:all.filter(i=>i.approved_version?.status==="approved"&&i.lifecycle_status==="active").length,
    inReview:all.filter(i=>i.lifecycle_status==="active"&&i.current_version?.status==="in_review").length,
    drafts:all.filter(i=>i.lifecycle_status==="active"&&i.current_version?.status==="draft").length,
    rejected:all.filter(i=>i.lifecycle_status==="active"&&i.current_version?.status==="rejected").length,
    archived:all.filter(i=>i.lifecycle_status==="archived").length,
    trashed:all.filter(i=>i.lifecycle_status==="trashed").length,
    categories:categories.filter(c=>c.status==="active").length,
    usageEvents:all.reduce((n,i)=>n+Number(i.usage_count||0),0),
  }
  return {items,categories,stats,permissions:copyVaultPermissions(actor)}
}

export async function pickerCopy(input: Record<string,unknown>, actor: SocialCommandActor) {
  requirePermission(actor,"use")
  const library=await listCopyVault({...input,approvedOnly:true},actor)
  const requestedChannels=channels(input.channels), requestedFormat=cleanString(input.format,40) as SocialFormat, requestedTypes=splitFlexible(input.copyTypes)
  let items=library.items
  if(requestedChannels.length) items=items.filter(item=>{const v=item.approved_version!;return !v.channels.length||requestedChannels.some(c=>v.channels.includes(c))})
  if(requestedFormat&&FORMATS.has(requestedFormat)) items=items.filter(item=>{const v=item.approved_version!;return !v.formats.length||v.formats.includes(requestedFormat)})
  if(requestedTypes.length) items=items.filter(item=>requestedTypes.includes(item.copy_type))
  const campaignId=cleanString(input.campaignId,120); if(campaignId) items=items.filter(item=>!item.campaign_id||item.campaign_id===campaignId)
  return {...library,items:items.slice(0,180)}
}

export async function getCopyItem(itemId:string, actor:SocialCommandActor){
  requirePermission(actor,"view"); const db=await socialDb(); const {data,error}=await db.from("social_command_copy_items").select("*").eq("id",itemId).maybeSingle(); if(error)throw missingTableMessage(error); if(!data)throw new Error("Copy Vault item not found")
  const item=(await hydrateItems([data],true))[0]
  const {data:approvals,error:approvalError}=await db.from("social_command_copy_approval_events").select("*").eq("item_id",itemId).order("created_at",{ascending:false}); if(approvalError)throw approvalError
  item.approvals=approvals as any[]||[]; return item
}

async function replaceCategoryLinks(itemId:string,categoryIds:string[]){const db=await socialDb();const {error:deleteError}=await db.from("social_command_copy_category_links").delete().eq("item_id",itemId);if(deleteError)throw deleteError;if(categoryIds.length){const {error}=await db.from("social_command_copy_category_links").insert([...new Set(categoryIds)].map(category_id=>({item_id:itemId,category_id})));if(error)throw error}}
function itemCode(input:unknown){const requested=cleanString(input,120).toUpperCase().replace(/[^A-Z0-9_-]+/g,"-").replace(/^-|-$/g,"");return requested||`COPY-${new Date().toISOString().slice(0,10).replace(/-/g,"")}-${crypto.randomUUID().slice(0,8).toUpperCase()}`}
function versionRow(itemId:string,versionNo:number,input:Record<string,unknown>,actor:SocialCommandActor,status="draft"){
  const body=cleanString(input.body,30000); if(!body)throw new Error("Copy body is required")
  return {id:crypto.randomUUID(),item_id:itemId,version_no:versionNo,status:COPY_STATUSES.has(status)?status:"draft",body,short_version:cleanString(input.shortVersion??input.short_version,6000),cta:cleanString(input.cta,3000),hashtags:splitHashtags(input.hashtags),tags:splitFlexible(input.tags),channels:channels(input.channels),formats:formats(input.formats),language:cleanString(input.language,40)||"fr",country:cleanString(input.country,100)||"Morocco",city:cleanString(input.city,120),tone:cleanString(input.tone,120),purpose:cleanString(input.purpose,160),audience:cleanString(input.audience,300),collection_name:cleanString(input.collectionName??input.collection_name,180),valid_from:dateOrNull(input.validFrom??input.valid_from),valid_until:dateOrNull(input.validUntil??input.valid_until),approval_policy:cleanString(input.approvalPolicy??input.approval_policy,100)||"standard",change_summary:cleanString(input.changeSummary??input.change_summary,1000),body_fingerprint:fingerprint(body),metadata:safeJson(input.metadata),created_by:actor.id,created_at:nowIso(),reviewed_by:null,reviewed_at:null,decision_note:null}
}

export async function findSimilarCopy(body:string,actor:SocialCommandActor,excludeItemId?:string){
  requirePermission(actor,"view"); const db=await socialDb(); const fp=fingerprint(body); const {data,error}=await db.from("social_command_copy_versions").select("item_id,version_no,status,body,body_fingerprint").in("status",["approved","draft","in_review"]).order("created_at",{ascending:false}).limit(500);if(error)throw missingTableMessage(error)
  const candidates=(data||[]).filter((row:any)=>row.item_id!==excludeItemId).map((row:any)=>({itemId:row.item_id,versionNo:row.version_no,status:row.status,exact:row.body_fingerprint===fp,similarity:row.body_fingerprint===fp?1:jaccard(body,row.body),preview:cleanString(row.body,240)})).filter(row=>row.exact||row.similarity>=0.72).sort((a,b)=>b.similarity-a.similarity).slice(0,8)
  return candidates
}

export async function createCopyItem(input:Record<string,unknown>,actor:SocialCommandActor){
  requirePermission(actor,"create"); const db=await socialDb(); const now=nowIso(); const id=crypto.randomUUID(); const type=copyType(input.copyType??input.copy_type); const title=cleanString(input.title,260); if(!title)throw new Error("Copy title is required")
  const requestedStatus=(cleanString(input.status,60)||"draft").toLowerCase(); const status=requestedStatus==="approved"&&copyVaultPermissions(actor).approve?"approved":requestedStatus==="in_review"?"in_review":"draft"
  const row={id,code:itemCode(input.code),title,copy_type:type,business_unit:cleanString(input.businessUnit??input.business_unit,160),campaign_id:cleanString(input.campaignId??input.campaign_id,120)||null,owner_user_id:cleanString(input.ownerUserId??input.owner_user_id,120)||actor.id,lifecycle_status:"active",current_version_no:1,approved_version_no:status==="approved"?1:null,usage_count:0,last_used_at:null,metadata:safeJson(input.itemMetadata??input.item_metadata),created_by:actor.id,created_at:now,updated_by:actor.id,updated_at:now}
  const version=versionRow(id,1,input,actor,status)
  const {error:itemError}=await db.from("social_command_copy_items").insert(row);if(itemError)throw missingTableMessage(itemError)
  const {error:versionError}=await db.from("social_command_copy_versions").insert(version);if(versionError){await db.from("social_command_copy_items").delete().eq("id",id);throw versionError}
  await replaceCategoryLinks(id,stringArray(input.categoryIds??input.category_ids))
  if(status==="in_review"||status==="approved"){const {error:approvalError}=await db.from("social_command_copy_approval_events").insert({id:crypto.randomUUID(),item_id:id,version_no:1,action:status==="approved"?"approved":"submitted",stage:version.approval_policy,note:"",actor_user_id:actor.id,actor_role:normalizedRole(actor),created_at:now});if(approvalError){await db.from("social_command_copy_items").delete().eq("id",id);throw approvalError}}
  await auditSocial(actor.id,"copy_vault.item_created","copy_vault_item",id,{code:row.code,type,status})
  const similar=await findSimilarCopy(version.body,actor,id)
  return {item:await getCopyItem(id,actor),similar}
}

export async function createCopyRevision(itemId:string,input:Record<string,unknown>,actor:SocialCommandActor){
  const current=await getCopyItem(itemId,actor); requireItemEdit(actor,current); if(current.lifecycle_status!=="active")throw new Error("Only active Copy Vault items can be revised")
  const base=current.approved_version||current.current_version; const merged:Record<string,unknown>={body:input.body??base?.body,shortVersion:input.shortVersion??input.short_version??base?.short_version,cta:input.cta??base?.cta,hashtags:input.hashtags??base?.hashtags,tags:input.tags??base?.tags,channels:input.channels??base?.channels,formats:input.formats??base?.formats,language:input.language??base?.language,country:input.country??base?.country,city:input.city??base?.city,tone:input.tone??base?.tone,purpose:input.purpose??base?.purpose,audience:input.audience??base?.audience,collectionName:input.collectionName??input.collection_name??base?.collection_name,validFrom:input.validFrom??input.valid_from??base?.valid_from,validUntil:input.validUntil??input.valid_until??base?.valid_until,approvalPolicy:input.approvalPolicy??input.approval_policy??base?.approval_policy,changeSummary:input.changeSummary??input.change_summary,metadata:input.metadata??base?.metadata}
  const next=Math.max(0,...(current.versions||[]).map(v=>v.version_no))+1; const version=versionRow(itemId,next,merged,actor,"draft"); const db=await socialDb(); const {error}=await db.from("social_command_copy_versions").insert(version);if(error)throw error
  const updates:any={current_version_no:next,updated_by:actor.id,updated_at:nowIso()}; if(input.title!==undefined)updates.title=cleanString(input.title,260); if(input.copyType!==undefined||input.copy_type!==undefined)updates.copy_type=copyType(input.copyType??input.copy_type); if(input.businessUnit!==undefined||input.business_unit!==undefined)updates.business_unit=cleanString(input.businessUnit??input.business_unit,160); if(input.campaignId!==undefined||input.campaign_id!==undefined)updates.campaign_id=cleanString(input.campaignId??input.campaign_id,120)||null
  const {error:updateError}=await db.from("social_command_copy_items").update(updates).eq("id",itemId);if(updateError)throw updateError
  if(input.categoryIds!==undefined||input.category_ids!==undefined)await replaceCategoryLinks(itemId,stringArray(input.categoryIds??input.category_ids))
  await auditSocial(actor.id,"copy_vault.revision_created","copy_vault_item",itemId,{versionNo:next})
  return {item:await getCopyItem(itemId,actor),similar:await findSimilarCopy(version.body,actor,itemId)}
}

async function approvalEvent(itemId:string,versionNo:number,action:string,stage:string,note:string,actor:SocialCommandActor){const db=await socialDb();const {error}=await db.from("social_command_copy_approval_events").insert({id:crypto.randomUUID(),item_id:itemId,version_no:versionNo,action,stage,note,actor_user_id:actor.id,actor_role:normalizedRole(actor),created_at:nowIso()});if(error)throw error}
function policyAllows(actor:SocialCommandActor,policy:string){if(!copyVaultPermissions(actor).rbacEnforced)return true;const role=normalizedRole(actor);if(policy==="director")return DIRECTOR_ROLES.has(role);if(policy==="marketing"||policy==="brand")return MARKETING_ROLES.has(role);return copyVaultPermissions(actor).approve}
export async function submitCopyVersion(itemId:string,versionNo:number,actor:SocialCommandActor){requirePermission(actor,"submit");const current=await getCopyItem(itemId,actor);requireItemEdit(actor,current);const db=await socialDb();const {data,error}=await db.from("social_command_copy_versions").select("*").eq("item_id",itemId).eq("version_no",versionNo).maybeSingle();if(error)throw error;if(!data)throw new Error("Copy version not found");if(data.status!=="draft"&&data.status!=="rejected")throw new Error("Only draft/rejected versions can be submitted");const {error:updateError}=await db.from("social_command_copy_versions").update({status:"in_review",reviewed_by:null,reviewed_at:null,decision_note:null}).eq("id",data.id);if(updateError)throw updateError;await approvalEvent(itemId,versionNo,"submitted",data.approval_policy,"",actor);await auditSocial(actor.id,"copy_vault.submitted","copy_vault_item",itemId,{versionNo,policy:data.approval_policy});return getCopyItem(itemId,actor)}
export async function approveCopyVersion(itemId:string,versionNo:number,note:string,actor:SocialCommandActor){
  requirePermission(actor,"approve")
  const db=await socialDb()
  const {data,error}=await db.from("social_command_copy_versions").select("*").eq("item_id",itemId).eq("version_no",versionNo).maybeSingle()
  if(error)throw error
  if(!data)throw new Error("Copy version not found")
  if(data.status!=="in_review")throw new Error("Only in-review versions can be approved")
  if(!policyAllows(actor,data.approval_policy))throw new Error(`COPY_VAULT_APPROVAL_POLICY_DENIED:${data.approval_policy}`)
  const {data:itemRow,error:itemReadError}=await db.from("social_command_copy_items").select("current_version_no").eq("id",itemId).maybeSingle()
  if(itemReadError)throw itemReadError
  if(!itemRow)throw new Error("Copy Vault item not found")
  const reviewedAt=nowIso()
  const {error:updateError}=await db.from("social_command_copy_versions").update({status:"approved",reviewed_by:actor.id,reviewed_at:reviewedAt,decision_note:cleanString(note,2000)}).eq("id",data.id)
  if(updateError)throw updateError
  const currentVersionNo=Math.max(versionNo,Number(itemRow.current_version_no||versionNo))
  const {error:itemError}=await db.from("social_command_copy_items").update({approved_version_no:versionNo,current_version_no:currentVersionNo,updated_by:actor.id,updated_at:reviewedAt}).eq("id",itemId)
  if(itemError)throw itemError
  await approvalEvent(itemId,versionNo,"approved",data.approval_policy,cleanString(note,2000),actor)
  await auditSocial(actor.id,"copy_vault.approved","copy_vault_item",itemId,{versionNo,policy:data.approval_policy})
  return getCopyItem(itemId,actor)
}
export async function rejectCopyVersion(itemId:string,versionNo:number,note:string,actor:SocialCommandActor){requirePermission(actor,"reject");const db=await socialDb();const {data,error}=await db.from("social_command_copy_versions").select("*").eq("item_id",itemId).eq("version_no",versionNo).maybeSingle();if(error)throw error;if(!data)throw new Error("Copy version not found");if(data.status!=="in_review")throw new Error("Only in-review versions can be rejected");const {error:updateError}=await db.from("social_command_copy_versions").update({status:"rejected",reviewed_by:actor.id,reviewed_at:nowIso(),decision_note:cleanString(note,2000)}).eq("id",data.id);if(updateError)throw updateError;await approvalEvent(itemId,versionNo,"rejected",data.approval_policy,cleanString(note,2000),actor);await auditSocial(actor.id,"copy_vault.rejected","copy_vault_item",itemId,{versionNo});return getCopyItem(itemId,actor)}
export async function archiveCopyItem(itemId:string,actor:SocialCommandActor){requirePermission(actor,"archive");const db=await socialDb();const {error}=await db.from("social_command_copy_items").update({lifecycle_status:"archived",updated_by:actor.id,updated_at:nowIso()}).eq("id",itemId);if(error)throw error;await approvalEvent(itemId,0,"archived","governance","",actor);await auditSocial(actor.id,"copy_vault.archived","copy_vault_item",itemId);return {archived:true}}

export async function restoreCopyItem(itemId:string,actor:SocialCommandActor){
  requirePermission(actor,"restore")
  const db=await socialDb();const {error}=await db.from("social_command_copy_items").update({lifecycle_status:"active",updated_by:actor.id,updated_at:nowIso()}).eq("id",itemId)
  if(error)throw error
  await approvalEvent(itemId,0,"restored","governance","",actor)
  await auditSocial(actor.id,"copy_vault.restored","copy_vault_item",itemId)
  return {restored:true,itemId}
}
export async function trashCopyItem(itemId:string,actor:SocialCommandActor){
  requirePermission(actor,"trash")
  const db=await socialDb();const {error}=await db.from("social_command_copy_items").update({lifecycle_status:"trashed",updated_by:actor.id,updated_at:nowIso()}).eq("id",itemId)
  if(error)throw error
  await approvalEvent(itemId,0,"trashed","governance","",actor)
  await auditSocial(actor.id,"copy_vault.trashed","copy_vault_item",itemId)
  return {trashed:true,itemId}
}
export async function purgeCopyItem(itemId:string,confirmation:string,actor:SocialCommandActor){
  requirePermission(actor,"hardDelete")
  if(confirmation!=="PERMANENTLY DELETE")throw new Error("COPY_VAULT_CONFIRMATION_REQUIRED")
  const item=await getCopyItem(itemId,actor)
  if(item.lifecycle_status!=="trashed")throw new Error("COPY_VAULT_PURGE_REQUIRES_TRASH")
  const db=await socialDb()
  const versions=item.versions||[]
  const usage=item.usage||[]
  const tombstone={
    id:crypto.randomUUID(),
    item_id:item.id,
    code:item.code,
    title:item.title,
    copy_type:item.copy_type,
    business_unit:item.business_unit,
    category_names:item.categories.map(c=>c.name),
    version_count:versions.length,
    approved_version_no:item.approved_version_no,
    body_fingerprints:versions.map(v=>v.body_fingerprint).filter(Boolean),
    usage_count:Number(item.usage_count||0),
    usage_snapshot:usage.map(u=>({surface:u.surface,publication_id:u.publication_id,bulk_plan_id:u.bulk_plan_id,customized:u.customized,created_at:u.created_at})),
    deleted_by:actor.id,
    deleted_at:nowIso(),
    metadata:{campaign_id:item.campaign_id,owner_user_id:item.owner_user_id},
  }
  const {error:tombError}=await db.from("social_command_copy_tombstones").upsert(tombstone,{onConflict:"item_id"})
  if(tombError)throw tombError
  const {error:deleteError}=await db.from("social_command_copy_items").delete().eq("id",itemId)
  if(deleteError)throw deleteError
  await auditSocial(actor.id,"copy_vault.permanently_deleted","copy_vault_item",itemId,{code:item.code,versionCount:versions.length,usageCount:Number(item.usage_count||0)})
  return {purged:true,itemId}
}

export async function createCopyCategory(input:Record<string,unknown>,actor:SocialCommandActor){requirePermission(actor,"manageCategories");const db=await socialDb();const name=cleanString(input.name,160);if(!name)throw new Error("Category name is required");const parentId=cleanString(input.parentId??input.parent_id,120)||null;const row={id:crypto.randomUUID(),name,slug:slugify(cleanString(input.slug,120)||name),parent_id:parentId,description:cleanString(input.description,1000),status:"active",sort_order:Number((input.sortOrder ?? input.sort_order) || 0),created_by:actor.id,created_at:nowIso(),updated_at:nowIso()};const {data,error}=await db.from("social_command_copy_categories").insert(row).select("*").single();if(error)throw missingTableMessage(error);await auditSocial(actor.id,"copy_vault.category_created","copy_vault_category",row.id,{name,parentId});return data as CopyVaultCategory}
export async function updateCopyCategory(categoryId:string,input:Record<string,unknown>,actor:SocialCommandActor){requirePermission(actor,"manageCategories");const db=await socialDb();const patch:any={updated_at:nowIso()};if(input.name!==undefined){patch.name=cleanString(input.name,160);patch.slug=slugify(patch.name)}if(input.description!==undefined)patch.description=cleanString(input.description,1000);if(input.parentId!==undefined||input.parent_id!==undefined)patch.parent_id=cleanString(input.parentId??input.parent_id,120)||null;if(input.status!==undefined){const next=cleanString(input.status,30).toLowerCase();patch.status=next==="trashed"?"trashed":next==="archived"?"archived":"active"};if(input.sortOrder!==undefined||input.sort_order!==undefined)patch.sort_order=Number((input.sortOrder ?? input.sort_order) || 0);const {data,error}=await db.from("social_command_copy_categories").update(patch).eq("id",categoryId).select("*").single();if(error)throw error;await auditSocial(actor.id,"copy_vault.category_updated","copy_vault_category",categoryId,{patch:Object.keys(patch)});return data as CopyVaultCategory}

export async function setCopyCategoryLifecycle(categoryId:string,state:"active"|"archived"|"trashed",actor:SocialCommandActor){
  requirePermission(actor,state==="trashed"?"deleteCategories":"manageCategories")
  return updateCopyCategory(categoryId,{status:state},actor)
}
export async function purgeCopyCategory(categoryId:string,confirmation:string,actor:SocialCommandActor){
  requirePermission(actor,"deleteCategories")
  if(confirmation!=="PERMANENTLY DELETE")throw new Error("COPY_VAULT_CATEGORY_CONFIRMATION_REQUIRED")
  const db=await socialDb()
  const {data:category,error:readError}=await db.from("social_command_copy_categories").select("*").eq("id",categoryId).maybeSingle()
  if(readError)throw readError
  if(!category)throw new Error("Copy Vault category not found")
  if(category.status!=="trashed")throw new Error("COPY_VAULT_CATEGORY_PURGE_REQUIRES_TRASH")
  const {error}=await db.from("social_command_copy_categories").delete().eq("id",categoryId)
  if(error)throw error
  await auditSocial(actor.id,"copy_vault.category_permanently_deleted","copy_vault_category",categoryId,{name:category.name})
  return {purged:true,categoryId}
}

const CANONICAL_FIELDS=["title","body","short_version","copy_type","category","subcategory","collection","tags","business_unit","campaign_id","audience","language","country","city","tone","purpose","cta","hashtags","channels","formats","status","valid_from","valid_until","approval_policy","notes"]
const HEADER_ALIASES:Record<string,string[]>={title:["title","name","nom","titre"],body:["body","text","texte","caption","copy","message"],short_version:["short_version","short","version_courte"],copy_type:["copy_type","type","text_type"],category:["category","categorie"],subcategory:["subcategory","sub_category","sous_categorie"],collection:["collection","collection_name"],tags:["tags","tag"],business_unit:["business_unit","unit","service_line","unite"],campaign_id:["campaign_id","campaign","campagne"],audience:["audience","target","cible"],language:["language","lang","langue"],country:["country","pays"],city:["city","ville"],tone:["tone","ton"],purpose:["purpose","objectif","usage"],cta:["cta","call_to_action"],hashtags:["hashtags","hashtag"],channels:["channels","channel","canaux"],formats:["formats","format"],status:["status","statut"],valid_from:["valid_from","start","debut"],valid_until:["valid_until","end","fin","expiry"],approval_policy:["approval_policy","approval","policy"],notes:["notes","note"]}
function parseCsv(text:string){const rows:string[][]=[];let row:string[]=[],field="",quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){field+='"';i++}else if(c==='"'){quoted=false}else field+=c}else{if(c==='"')quoted=true;else if(c===','){row.push(field);field=""}else if(c==='\n'){row.push(field);rows.push(row);row=[];field=""}else if(c!=='\r')field+=c}}row.push(field);if(row.some(v=>v.length)||rows.length===0)rows.push(row);const headers=(rows.shift()||[]).map((v,index)=>cleanString(index===0?v.replace(/^\uFEFF/,""):v,200));return {headers,rows}}
function autoMapping(headers:string[]):CopyVaultImportMapping{const normalized=new Map(headers.map(h=>[normalizeText(h).replace(/\s+/g,"_"),h]));const mapping:CopyVaultImportMapping={};for(const field of CANONICAL_FIELDS){for(const alias of HEADER_ALIASES[field]||[field]){const match=normalized.get(alias);if(match){mapping[field]=match;break}}}return mapping}
function rowObject(headers:string[],row:string[]){const out:Record<string,string>={};headers.forEach((h,i)=>out[h]=cleanString(row[i]??"",30000));return out}
function mappedValue(raw:Record<string,string>,mapping:CopyVaultImportMapping,field:string){const header=mapping[field];return header?raw[header]||"":""}
async function existingFingerprints(){const db=await socialDb();const {data,error}=await db.from("social_command_copy_versions").select("body_fingerprint,item_id,version_no").limit(10000);if(error)throw missingTableMessage(error);return new Map((data||[]).map((row:any)=>[row.body_fingerprint,row]))}
function normalizeImportRow(raw:Record<string,string>,mapping:CopyVaultImportMapping){return {title:mappedValue(raw,mapping,"title"),body:mappedValue(raw,mapping,"body"),shortVersion:mappedValue(raw,mapping,"short_version"),copyType:mappedValue(raw,mapping,"copy_type")||"post_caption",category:mappedValue(raw,mapping,"category"),subcategory:mappedValue(raw,mapping,"subcategory"),collectionName:mappedValue(raw,mapping,"collection"),tags:splitFlexible(mappedValue(raw,mapping,"tags")),businessUnit:mappedValue(raw,mapping,"business_unit"),campaignId:mappedValue(raw,mapping,"campaign_id"),audience:mappedValue(raw,mapping,"audience"),language:mappedValue(raw,mapping,"language")||"fr",country:mappedValue(raw,mapping,"country")||"Morocco",city:mappedValue(raw,mapping,"city"),tone:mappedValue(raw,mapping,"tone"),purpose:mappedValue(raw,mapping,"purpose"),cta:mappedValue(raw,mapping,"cta"),hashtags:splitHashtags(mappedValue(raw,mapping,"hashtags")),channels:channels(mappedValue(raw,mapping,"channels")),formats:formats(mappedValue(raw,mapping,"formats")),status:(mappedValue(raw,mapping,"status")||"draft").toLowerCase(),validFrom:mappedValue(raw,mapping,"valid_from"),validUntil:mappedValue(raw,mapping,"valid_until"),approvalPolicy:(mappedValue(raw,mapping,"approval_policy")||"standard").toLowerCase(),notes:mappedValue(raw,mapping,"notes")}}
export async function previewCopyCsv(csv:string,mappingInput:CopyVaultImportMapping|undefined,actor:SocialCommandActor):Promise<CopyVaultImportPreview>{requirePermission(actor,"import");const parsed=parseCsv(csv);if(!parsed.headers.length)throw new Error("CSV header is missing");const mapping={...autoMapping(parsed.headers),...(mappingInput||{})};const existing=await existingFingerprints();const seen=new Set<string>();const rows:CopyVaultImportPreviewRow[]=parsed.rows.slice(0,2000).map((cells,index)=>{const raw=rowObject(parsed.headers,cells),normalized=normalizeImportRow(raw,mapping),errors:string[]=[];if(!normalized.title)errors.push("title required");if(!normalized.body)errors.push("body required");if(normalized.copyType&&!COPY_VAULT_TYPES.includes(normalized.copyType as CopyVaultType))errors.push(`unsupported copy_type: ${normalized.copyType}`);if(normalized.validFrom&&!dateOrNull(normalized.validFrom))errors.push("invalid valid_from");if(normalized.validUntil&&!dateOrNull(normalized.validUntil))errors.push("invalid valid_until");const fp=normalized.body?fingerprint(normalized.body):"";const duplicate=Boolean(fp&&(existing.has(fp)||seen.has(fp)));if(fp)seen.add(fp);return {rowNo:index+2,valid:errors.length===0,duplicate,errors,normalized:{...normalized,bodyFingerprint:fp}}});return {headers:parsed.headers,mapping,rows,total:rows.length,valid:rows.filter(r=>r.valid).length,invalid:rows.filter(r=>!r.valid).length,duplicates:rows.filter(r=>r.duplicate).length}}

async function ensureCategoryPath(names:string[],actor:SocialCommandActor){let parentId:string|null=null;const ids:string[]=[];for(const raw of names.map(v=>cleanString(v,160)).filter(Boolean)){const db=await socialDb();let query=db.from("social_command_copy_categories").select("*").eq("name",raw).eq("status","active");query=parentId?query.eq("parent_id",parentId):query.is("parent_id",null);const {data,error}=await query.limit(1).maybeSingle();if(error)throw error;let cat=data as CopyVaultCategory|null;if(!cat){cat=await createCopyCategory({name:raw,parentId},actor)}ids.push(cat.id);parentId=cat.id}return ids}
export async function commitCopyCsv(
  csv:string,
  mapping:CopyVaultImportMapping|undefined,
  filename:string,
  actor:SocialCommandActor,
  options?:{duplicatePolicy?:"skip"|"import";importState?:"draft"|"in_review"|"approved"},
){
  requirePermission(actor,"import")
  const preview=await previewCopyCsv(csv,mapping,actor)
  const duplicatePolicy=options?.duplicatePolicy==="import"?"import":"skip"
  const requestedImportState=options?.importState
  if(requestedImportState==="approved"&&!copyVaultPermissions(actor).approve)throw new Error("COPY_VAULT_PERMISSION_DENIED:approve")
  const db=await socialDb();const jobId=crypto.randomUUID();const now=nowIso()
  const duplicateSkipped=duplicatePolicy==="skip"?preview.rows.filter(row=>row.valid&&row.duplicate).length:0
  const {error:jobError}=await db.from("social_command_copy_import_jobs").insert({
    id:jobId,filename:cleanString(filename,260)||"copy-vault.csv",status:"processing",
    row_count:preview.total,valid_count:preview.valid,error_count:preview.invalid,duplicate_count:preview.duplicates,
    skipped_duplicate_count:duplicateSkipped,imported_count:0,mapping:preview.mapping,created_by:actor.id,created_at:now,completed_at:null,
  })
  if(jobError)throw missingTableMessage(jobError)
  let imported=0,failed=0,skippedDuplicates=0
  const itemIds:string[]=[]
  for(const row of preview.rows){
    let itemId:string|null=null,versionNo:number|null=null,rowStatus:"imported"|"failed"|"skipped_duplicate"="failed"
    const errors=[...row.errors]
    if(row.valid&&row.duplicate&&duplicatePolicy==="skip"){
      skippedDuplicates++;rowStatus="skipped_duplicate";errors.push("Exact duplicate skipped by import policy")
    }else if(row.valid){
      try{
        const normalized=row.normalized as Record<string,unknown>
        const categoryIds=await ensureCategoryPath([
          cleanString(normalized.category,160),
          cleanString(normalized.subcategory,160),
          cleanString(normalized.collectionName,160),
        ],actor)
        const csvState=(cleanString(normalized.status,60)||"draft").toLowerCase()
        const requestedStatus=requestedImportState||csvState
        const permittedStatus=requestedStatus==="approved"&&copyVaultPermissions(actor).approve
          ?"approved"
          :requestedStatus==="in_review"?"in_review":"draft"
        const result=await createCopyItem({
          ...normalized,categoryIds,status:permittedStatus,
          metadata:{import_job_id:jobId,import_row_no:row.rowNo,notes:cleanString(normalized.notes,2000)},
        },actor)
        itemId=result.item.id;versionNo=result.item.current_version_no;itemIds.push(itemId);imported++;rowStatus="imported"
      }catch(error){failed++;errors.push(error instanceof Error?error.message:String(error));rowStatus="failed"}
    }else failed++
    const {error:rowError}=await db.from("social_command_copy_import_rows").insert({
      id:crypto.randomUUID(),job_id:jobId,row_no:row.rowNo,status:rowStatus,error_messages:errors,
      raw:row.normalized,item_id:itemId,version_no:versionNo,created_at:nowIso(),
    })
    if(rowError)throw rowError
  }
  const {error:finishError}=await db.from("social_command_copy_import_jobs").update({
    status:failed?"completed_with_errors":"completed",imported_count:imported,error_count:failed,
    skipped_duplicate_count:skippedDuplicates,completed_at:nowIso(),
  }).eq("id",jobId)
  if(finishError)throw finishError
  let materializedCount=0,approvedCount=0,inReviewCount=0,draftCount=0
  if(itemIds.length){
    const {data:materialized,error:verifyError}=await db.from("social_command_copy_items")
      .select("id,lifecycle_status,approved_version_no,current_version_no").in("id",itemIds)
    if(verifyError)throw verifyError
    materializedCount=(materialized||[]).length
    const {data:versionStates,error:stateError}=await db.from("social_command_copy_versions")
      .select("item_id,status").in("item_id",itemIds)
    if(stateError)throw stateError
    const latest=new Map<string,string>()
    for(const row of versionStates||[])latest.set(row.item_id,row.status)
    approvedCount=(materialized||[]).filter((r:any)=>Boolean(r.approved_version_no)).length
    inReviewCount=[...latest.values()].filter(v=>v==="in_review").length
    draftCount=[...latest.values()].filter(v=>v==="draft").length
  }
  if(materializedCount!==imported)throw new Error(`COPY_VAULT_IMPORT_MATERIALIZATION_MISMATCH:${materializedCount}/${imported}`)
  await auditSocial(actor.id,"copy_vault.csv_imported","copy_vault_import",jobId,{
    rows:preview.total,imported,failed,duplicates:preview.duplicates,skippedDuplicates,duplicatePolicy,
    importState:requestedImportState||"csv",materializedCount,approvedCount,inReviewCount,draftCount,
  })
  return {
    jobId,imported,failed,skippedDuplicates,duplicatePolicy,importState:requestedImportState||"csv",
    materializedCount,approvedCount,inReviewCount,draftCount,itemIds,preview,
  }
}

export async function recordCopyUsage(input:Record<string,unknown>,actor:SocialCommandActor){requirePermission(actor,"use");const itemId=cleanString(input.itemId??input.item_id,120);const versionNo=Math.max(1,Number((input.versionNo ?? input.version_no) || 1));if(!itemId)throw new Error("itemId required");const publicationIds=splitFlexible(input.publicationIds??input.publication_ids);const directPublication=cleanString(input.publicationId??input.publication_id,120);if(directPublication&&!publicationIds.includes(directPublication))publicationIds.push(directPublication);const entries=publicationIds.length?publicationIds:[""];const db=await socialDb();const now=nowIso();const rows=entries.map(publicationId=>({id:crypto.randomUUID(),item_id:itemId,version_no:versionNo,surface:cleanString(input.surface,120)||"unknown",publication_id:publicationId||null,bulk_plan_id:cleanString(input.bulkPlanId??input.bulk_plan_id,120)||null,actor_user_id:actor.id,content_snapshot:cleanString(input.contentSnapshot??input.content_snapshot,30000),customized:Boolean(input.customized),context:safeJson(input.context),created_at:now}));const {error}=await db.from("social_command_copy_usage_events").insert(rows);if(error)throw missingTableMessage(error);await auditSocial(actor.id,"copy_vault.used","copy_vault_item",itemId,{versionNo,surface:rows[0].surface,count:rows.length,customized:Boolean(input.customized)});return {recorded:rows.length}}

export async function bulkCopyAction(input:Record<string,unknown>,actor:SocialCommandActor){
  const ids=stringArray(input.itemIds??input.item_ids).slice(0,300)
  const action=cleanString(input.action,40)
  if(!ids.length)throw new Error("No Copy Vault items selected")
  const results:any[]=[]
  for(const id of ids){
    try{
      const item=await getCopyItem(id,actor)
      const version=item.current_version_no
      if(action==="submit")results.push({id,ok:true,data:await submitCopyVersion(id,version,actor)})
      else if(action==="approve")results.push({id,ok:true,data:await approveCopyVersion(id,version,cleanString(input.note,1000),actor)})
      else if(action==="archive")results.push({id,ok:true,data:await archiveCopyItem(id,actor)})
      else if(action==="restore")results.push({id,ok:true,data:await restoreCopyItem(id,actor)})
      else if(action==="trash")results.push({id,ok:true,data:await trashCopyItem(id,actor)})
      else throw new Error("Unsupported bulk action")
    }catch(error){results.push({id,ok:false,error:error instanceof Error?error.message:String(error)})}
  }
  return {results,ok:results.filter(r=>r.ok).length,failed:results.filter(r=>!r.ok).length}
}

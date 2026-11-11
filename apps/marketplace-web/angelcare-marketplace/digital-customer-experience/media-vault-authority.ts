import { createServiceClient } from "@/lib/supabase/server";
import { hasMarketplacePermission } from "../auth/context";
import type { MarketplaceRequestContext } from "../domain/types";
import { MarketplaceError } from "../server/errors";

type Context = MarketplaceRequestContext;
type Row = Record<string, any>;
type Input = Record<string, unknown>;
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const validId = (v: string) => /^[\da-f]{8}-[\da-f]{4}-[1-5][\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(v);
const number = (v: unknown, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
};
const safeText = (v: unknown, max = 120) => text(v).slice(0, max);
function permitted(c: Context) {
  if (!hasMarketplacePermission(c, "marketplace.digital_experience.view") ||
      !hasMarketplacePermission(c, "marketplace.media.view"))
    throw new MarketplaceError("PERMISSION_DENIED", "Media Vault requires Digital Experience view and native Media view permission.");
}

export type NativeVaultFolder = {
  id: string; name: string; slug: string; parentId: string | null;
  status: string; path: string; depth: number; itemCount: number | null;
};
export function vaultPageSize(input: Input): 20 | 100 | 500 {
  const n = Number(input.pageSize);
  return n === 20 || n === 500 ? n : 100;
}
export function vaultDateWindow(input: Input, now = new Date()) {
  const rawField = safeText(input.dateField);
  const field = rawField === "updated" ? "updated_at" : "created_at";
  const minutes = Number(input.recentMinutes);
  if (text(input.recentMinutes) && (!Number.isInteger(minutes) || minutes < 1 || minutes > 525600))
    throw new MarketplaceError("VALIDATION_ERROR", "Recent interval must be between 1 and 525600 minutes.");
  const from = minutes > 0 && Number.isFinite(minutes)
    ? new Date(now.getTime() - minutes * 60000).toISOString()
    : safeText(input.dateFrom, 35);
  const until = safeText(input.dateTo, 35);
  for (const date of [from, until]) {
    if (date && (!Number.isFinite(Date.parse(date)) || date.length < 10))
      throw new MarketplaceError("VALIDATION_ERROR", "Date filter requires valid ISO timestamps.");
  }
  if (from && until && Date.parse(from) > Date.parse(until))
    throw new MarketplaceError("VALIDATION_ERROR", "Date range begins after its end.");
  return {field, from, until};
}
export function folderHierarchy(rows: Row[]): NativeVaultFolder[] {
  const nodes = new Map<string, NativeVaultFolder>();
  for (const r of rows) {
    if (!r?.id) continue;
    nodes.set(String(r.id), {
      id: String(r.id), name: text(r.name) || "Untitled folder",
      slug: text(r.slug), parentId: r.parent_id ? String(r.parent_id) : null,
      status: text(r.status), path: "", depth: 0,
      itemCount: null,
    });
  }
  const visit = (id: string, seen: Set<string>): {path: string; depth: number} => {
    const f = nodes.get(id);
    if (!f) return {path: "Unresolved folder", depth: 0};
    if (f.path) return {path: f.path, depth: f.depth};
    if (seen.has(id)) return {path: "Folder hierarchy cycle / " + f.name, depth: 0};
    seen.add(id);
    const parent = f.parentId && nodes.get(f.parentId) ? visit(f.parentId, seen) : null;
    f.path = parent ? parent.path + " / " + f.name : f.name;
    f.depth = parent ? Math.min(30, parent.depth + 1) : 0;
    seen.delete(id);
    return {path:f.path, depth:f.depth};
  };
  for (const id of nodes.keys()) visit(id, new Set());
  return [...nodes.values()].sort((a,b)=>a.path.localeCompare(b.path));
}
const folderToRow = (r: Row) => ({
  id:r.id, name:r.name, slug:r.slug, parent_id:r.parent_id,
  status:r.status, item_count:null,
});
export async function vaultFolders(c: Context, input: Input) {
  permitted(c);
  const db = await createServiceClient();
  const page = Math.max(1, Math.floor(number(input.page ?? 1, 1, 100000)));
  const pageSize = 500;
  const r = await db.from("angelcare_marketplace_media_folders")
    .select("id,name,slug,parent_id,status", {count:"exact"})
    .order("name", {ascending:true}).order("id", {ascending:true})
    .range((page-1)*pageSize,page*pageSize-1);
  if (r.error) throw new MarketplaceError("DEPENDENCY_BLOCKED", "Native folder directory could not be read: " + r.error.message);
  return {rows:(r.data||[]).map(folderToRow),total:r.count ?? 0,page,pageSize,
    complete:page * pageSize >= (r.count || 0)};
}
export function foldDescendants(folderId: string, folders: NativeVaultFolder[]) {
  const result = new Set([folderId]);
  let changed = true;
  while(changed) {
    changed = false;
    for(const folder of folders) {
      if(folder.parentId && result.has(folder.parentId) && !result.has(folder.id)) {
        result.add(folder.id); changed = true;
      }
    }
  }
  return [...result];
}
async function allFolders(db: Awaited<ReturnType<typeof createServiceClient>>) {
  const result: Row[] = [];
  for(let page = 0; ;page++) {
    const r = await db.from("angelcare_marketplace_media_folders")
      .select("id,name,slug,parent_id,status").order("id").range(page*500,page*500+499);
    if(r.error) throw new MarketplaceError("DEPENDENCY_BLOCKED","Could not traverse native folders: " + r.error.message);
    result.push(...(r.data||[]));
    if((r.data||[]).length < 500) break;
  }
  return folderHierarchy(result);
}
const knownSorts: Record<string, {field:string;ascending:boolean}> = {
  "recent":{field:"created_at",ascending:false},
  "updated":{field:"updated_at",ascending:false},
  "oldest":{field:"created_at",ascending:true},
  "name-asc":{field:"file_name",ascending:true},
  "name-desc":{field:"file_name",ascending:false},
  "largest":{field:"size_bytes",ascending:false},
  "smallest":{field:"size_bytes",ascending:true},
};
const match = (r: Row, input: Input) => {
  const meta = r.metadata && typeof r.metadata === "object" ? r.metadata : {};
  const width = Number(r.width ?? meta.width ?? meta.dimensions?.width);
  const height = Number(r.height ?? meta.height ?? meta.dimensions?.height);
  const orientation = safeText(input.orientation);
  const ratio = safeText(input.ratio);
  const minWidth = Number(input.minWidth) || 0, minHeight = Number(input.minHeight) || 0;
  if(orientation || ratio || minWidth || minHeight) {
    if(!(width > 0 && height > 0)) return false;
    const x=width/height;
    if(orientation==="square" && Math.abs(x-1) > .04) return false;
    if(orientation==="landscape" && x<=1.04) return false;
    if(orientation==="portrait" && x>=.96) return false;
    const targets: Record<string,number>={"1:1":1,"16:9":16/9,"4:3":4/3,"3:4":3/4,"9:16":9/16};
    if(ratio && (!targets[ratio] || Math.abs(x-targets[ratio])>.05)) return false;
    if(width < minWidth || height < minHeight) return false;
  }
  if(input.hasAlt === "true" && ![r.alt_text_fr,r.alt_text_en,r.alt_text_ar,meta.alt].some(v=>text(v))) return false;
  const optimization = String(r.optimization_status || meta.status || "").toLowerCase();
  if(input.readyOnly === "true" && !["ready","complete","completed","optimized"].includes(optimization)) return false;
  if(safeText(input.processing) && optimization !== safeText(input.processing).toLowerCase()) return false;
  const rights = String(r.rights_status || r.license_type || "").toLowerCase();
  if(input.publishedSafe === "true") {
    const url = text(r.public_url || r.desktop_url);
    if(text(r.status)!=="active" || !url ||
       !["approved","cleared","verified","owned","licensed","rights_approved"].includes(rights) ||
       (r.rights_expires_at && Date.parse(r.rights_expires_at)<=Date.now())) return false;
  }
  return true;
};
const mapAsset = (r: Row, byFolder: Map<string, NativeVaultFolder>) => {
  const folder = r.folder_id ? byFolder.get(String(r.folder_id)) : null;
  const metadata = r.metadata && typeof r.metadata === "object" ? r.metadata : {};
  return {
    id:r.id, title:r.file_name || r.asset_key, fileName:r.file_name || "",
    assetKey:r.asset_key || "", mime:r.mime_type || "", mediaType:r.media_type || "",
    url:r.public_url || r.desktop_url || "", size:r.size_bytes ?? 0,
    status:r.status || "", rights:r.rights_status || r.license_type || "",
    expiresAt:r.rights_expires_at || null,
    processingState:r.optimization_status || metadata.status || "",
    alt:r.alt_text_fr || r.alt_text_en || r.alt_text_ar || metadata.alt || "",
    width:r.width ?? metadata.width ?? metadata.dimensions?.width ?? null,
    height:r.height ?? metadata.height ?? metadata.dimensions?.height ?? null,
    folderId:r.folder_id || "", folderName:folder?.name || "",
    folderPath:folder?.path || (r.folder_id ? "Unresolved folder" : "Root / Unfiled"),
    folderStatus:folder?.status || "",
    collection: metadata.collection || "", category:metadata.category || "",
    language:metadata.language || "", uploadedBy:metadata.uploaded_by || "",
    tags:Array.isArray(metadata.tags) ? metadata.tags : [],
    usageCount:r.usage_count ?? metadata.usage_count ?? null,
    variants:Array.isArray(metadata.variants) ? metadata.variants.length : null,
    createdAt:r.created_at || "",updatedAt:r.updated_at || "",
  };
};
export async function vaultMedia(c: Context, input: Input) {
  permitted(c);
  const db=await createServiceClient();
  const pageSize=vaultPageSize(input);
  const page=Math.max(1,Math.floor(number(input.page ?? 1,1,100000)));
  const range=vaultDateWindow(input);
  const search=safeText(input.q).replace(/[^\p{L}\p{N} .@_-]/gu," ").slice(0,120);
  const {field:sortCol,ascending}=knownSorts[safeText(input.sort)] || knownSorts.recent;
  const status=safeText(input.status);
  const mime=safeText(input.mime);
  const folderId=safeText(input.folderId);
  const folderSet=folderId ? await allFolders(db) : [];
  if(folderId && (!validId(folderId) || !folderSet.some(f=>f.id===folderId)))
    throw new MarketplaceError("VALIDATION_ERROR","Selected folder does not exist in the native directory.");
  const descendantIds=folderId && input.includeChildren==="true"
    ? foldDescendants(folderId,folderSet) : folderId ? [folderId] : [];
  const extendedFolderScope=descendantIds.length > 300;
  const byFolder=new Map((folderId?folderSet:[]).map(f=>[f.id,f]));
  const filterCore = (builder: any) => {
    let q=builder;
    if(status && status!=="all") q=q.eq("status",status);
    if(mime==="image"||mime==="video"||mime==="audio"||mime==="application")
      q=q.like("mime_type",mime+"/%");
    else if(mime && /^[-a-z0-9.]+\/[-a-z0-9.+]+$/i.test(mime)) q=q.eq("mime_type",mime);
    if(search) q=q.or(
      "file_name.ilike.%" + search + "%,asset_key.ilike.%" + search +
      "%,alt_text_fr.ilike.%" + search + "%,alt_text_en.ilike.%" + search + "%"
    );
    if(folderId && !extendedFolderScope) q=descendantIds.length===1
      ? q.eq("folder_id",folderId) : q.in("folder_id",descendantIds);
    if(range.from) q=q.gte(range.field,range.from);
    if(range.until) q=q.lte(range.field,range.until);
    const rights=safeText(input.rights);
    if(rights) q=q.eq("rights_status",rights);
    const minSize=Number(input.minSize),maxSize=Number(input.maxSize);
    if(Number.isFinite(minSize) && minSize>0) q=q.gte("size_bytes",minSize);
    if(Number.isFinite(maxSize) && maxSize>0) q=q.lte("size_bytes",maxSize);
    const used=safeText(input.used);
    if(used==="used") q=q.gt("usage_count",0);
    else if(used==="unused") q=q.eq("usage_count",0);
    for(const [inputKey,metadataKey] of [
      ["category","category"],["collection","collection"],["language","language"],["uploader","uploaded_by"],
    ]) {
      const value=safeText(input[inputKey],90);
      if(value) q=q.contains("metadata",{[metadataKey]:value});
    }
    const tag=safeText(input.tag,90);
    if(tag) q=q.contains("metadata",{tags:[tag]});
    return q;
  };
  const postFilter=Boolean(
    safeText(input.orientation)||safeText(input.ratio)||
    Number(input.minWidth)>0||Number(input.minHeight)>0||
    input.hasAlt==="true"||input.readyOnly==="true"||
    input.publishedSafe==="true"||safeText(input.processing)||
    extendedFolderScope
  );
  let raw: Row[]=[];
  let total=0;
  if(!postFilter) {
    const r=await filterCore(db.from("angelcare_marketplace_media_assets").select("*",{count:"exact"}))
      .order(sortCol,{ascending}).order("id",{ascending:true})
      .range((page-1)*pageSize,page*pageSize-1);
    if(r.error) throw new MarketplaceError("DEPENDENCY_BLOCKED","Media catalogue query failed: "+r.error.message);
    raw=r.data||[]; total=r.count ?? 0;
  } else {
    // For dimensions, processing metadata and eligibility the existing table
    // has no indexed computed columns. Scan ALL server-matched rows before
    // pagination; never misrepresent page-local filtering as global filtering.
    const chunk=500;
    const first=await filterCore(db.from("angelcare_marketplace_media_assets").select("*",{count:"exact"}))
      .order(sortCol,{ascending}).order("id",{ascending:true}).range(0,chunk-1);
    if(first.error) throw new MarketplaceError("DEPENDENCY_BLOCKED","Media catalogue scan failed: "+first.error.message);
    const estimated=first.count ?? 0;
    const rows: Row[]=[...(first.data||[])];
    for(let i=1;i<Math.ceil(estimated/chunk);i+=5) {
      const batch=await Promise.all(
        Array.from({length:Math.min(5,Math.ceil(estimated/chunk)-i)},(_,j)=>
          filterCore(db.from("angelcare_marketplace_media_assets").select("*"))
            .order(sortCol,{ascending}).order("id",{ascending:true})
            .range((i+j)*chunk,(i+j+1)*chunk-1)
        )
      );
      for(const result of batch) {
        if(result.error) throw new MarketplaceError("DEPENDENCY_BLOCKED","Media catalogue scan incomplete: "+result.error.message);
        rows.push(...(result.data||[]));
      }
    }
    const allowedFolders=new Set(descendantIds);
    const filtered=rows.filter(r=>(!extendedFolderScope || allowedFolders.has(String(r.folder_id)))&&match(r,input));
    total=filtered.length;raw=filtered.slice((page-1)*pageSize,page*pageSize);
  }
  let directory=byFolder;
  if(!folderId && raw.some(r=>r.folder_id)) {
    directory=new Map((await allFolders(db)).map(f=>[f.id,f]));
  }
  const inventory=await db.from("angelcare_marketplace_media_assets").select("id",{count:"exact",head:true});
  if(inventory.error) throw new MarketplaceError("DEPENDENCY_BLOCKED","Media inventory count failed: "+inventory.error.message);
  return {
    rows:raw.map(r=>mapAsset(r,directory)),total,
    inventoryTotal:inventory.count ?? 0,
    page,pageSize,matchedBeforePagination:true,
    folderScope:folderId || "all",complete:true,
    dateApplied:range,
  };
}

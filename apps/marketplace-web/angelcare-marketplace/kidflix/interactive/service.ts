import 'server-only';
import { randomUUID } from 'node:crypto';
import { createServiceClient } from '@/lib/supabase/server';
import type { MarketplaceRequestContext } from '@/angelcare-marketplace/domain/types';
import { authorize, record, scopeKey } from '@/angelcare-marketplace/digital-customer-experience/repository';
import { inspectZip, previewToken, runtimeOrigin, rebuildPackageArchive, safePackagePath, sha256 } from './package';

export const KF_PACKAGE_BUCKET='kidflix-interactive-packages';
export const KF_PACKAGE_TABLE='ac_kidflix_interactive_packages';
const uuid=(s:unknown)=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
export type PackageRow={id:string;scope_key:string;owner_actor_id:string;family_key:string;locale:string;manifest:Record<string,unknown>;checksum_sha256:string;entry_path:string;original_storage_path:string;file_index:Record<string,{size:number;mime:string;sha256:string}>;state:string;record_id:string|null;release_id:string|null;};
function check(err:unknown,stage:string):never {throw Error(stage+': '+String((err as any)?.message||err));}
export async function scopedPackage(id:string,scope:string):Promise<PackageRow>{
  if(!uuid(id))throw Error('INVALID_PACKAGE_ID');
  const db=await createServiceClient();
  const {data,error}=await db.from(KF_PACKAGE_TABLE).select('*').eq('id',id).eq('scope_key',scope).maybeSingle();
  if(error)check(error,'PACKAGE_LOOKUP_FAILED');
  if(!data)throw Error('PACKAGE_NOT_FOUND_IN_SCOPE');
  return data as PackageRow;
}
export async function importPackage(c:MarketplaceRequestContext,archive:Buffer,declaredFamily:string,declaredLocale:string){
  authorize(c,'manage');
  const p=inspectZip(archive);
  if(p.manifest.family_key!==declaredFamily||p.manifest.target_locale!==declaredLocale)throw Error('PACKAGE_CATEGORY_OR_LANGUAGE_MISMATCH');
  // Verify the runtime is actually isolated BEFORE accepting any executable package.
  const origin=runtimeOrigin();
  const db=await createServiceClient(),id=randomUUID(),scope=scopeKey(c);
  const files:Record<string,{size:number;mime:string;sha256:string}>={};
  for(const f of p.files)files[f.path]={size:f.bytes.length,mime:f.mime,sha256:f.hash};
  const base=`${scope.replace(/[^a-zA-Z0-9_-]/g,'_')}/${id}`;
  const row={id,scope_key:scope,owner_actor_id:c.actor.id,family_key:declaredFamily,locale:declaredLocale,
    state:'processing',manifest:p.manifest,checksum_sha256:p.checksum,entry_path:p.entry,file_index:files,
    original_storage_path:base+'/original.zip',record_id:null,release_id:null};
  const inserted=await db.from(KF_PACKAGE_TABLE).insert(row).select('id').single();
  if(inserted.error)check(inserted.error,'PACKAGE_RECORD_CREATE_FAILED');
  let count=0;
  try{
    const upload=async(path:string,bytes:Buffer,mime:string)=>{
      const r=await db.storage.from(KF_PACKAGE_BUCKET).upload(base+'/'+path,bytes,{contentType:mime,upsert:false,cacheControl:'31536000'});
      if(r.error)check(r.error,'PACKAGE_UPLOAD_FAILED: '+path);
    };
    await upload('original.zip',archive,'application/zip');
    // Bounded parallelism prevents overwhelming self-hosted object storage.
    let next=0;const tasks=Array.from({length:Math.min(5,p.files.length)},async()=>{
      while(next<p.files.length){const f=p.files[next++];await upload('files/'+f.path,f.bytes,f.mime);count++}
    });
    await Promise.all(tasks);
    const updated=await db.from(KF_PACKAGE_TABLE).update({state:'validated'}).eq('id',id).eq('scope_key',scope).eq('state','processing').select('id').single();
    if(updated.error||!updated.data)check(updated.error||'FINALIZATION_CONFLICT','PACKAGE_FINALIZE_FAILED');
  }catch(e){
    await db.from(KF_PACKAGE_TABLE).update({state:'failed'}).eq('id',id).eq('scope_key',scope);
    throw e;
  }
  const token=previewToken(id,c.actor.id,Date.now()+10*60*1000);
  return {id,checksum:p.checksum,family:p.manifest.family_key,locale:p.manifest.target_locale,
    title:p.manifest.title,fileCount:count,totalBytes:p.bytes,state:'validated',entry:p.entry,
    previewUrl:`${origin}/api/kidflix/interactive/runtime/preview/${encodeURIComponent(token)}/${id}/${p.entry}`};
}
export async function assertPackageForPublication(c:MarketplaceRequestContext,r:{id:string;family:string|null;data:any},locale:string){
  const ref=r.data?.interactivePackage;
  if(!ref)return null;
  const packageId=ref?.id;
  if(!uuid(packageId)||!/^\w+$/.test(String(ref?.checksum||'')))throw Error('INVALID_INTERACTIVE_PACKAGE_REFERENCE');
  const p=await scopedPackage(packageId,scopeKey(c));
  if(p.state!=='validated'&&p.state!=='published')throw Error('INTERACTIVE_PACKAGE_NOT_VALIDATED');
  if(p.family_key!==r.family||p.locale!==locale||p.checksum_sha256!==ref.checksum)throw Error('INTERACTIVE_PACKAGE_IDENTITY_MISMATCH');
  if(p.record_id&&p.record_id!==r.id)throw Error('INTERACTIVE_PACKAGE_BOUND_TO_ANOTHER_DOSSIER');
  return p;
}
export async function bindPublishedPackage(c:MarketplaceRequestContext,packageId:string,recordId:string,releaseId:string,locale:string){
  if(!uuid(packageId)||!uuid(recordId)||!uuid(releaseId))throw Error('INVALID_PUBLISH_BINDING');
  const db=await createServiceClient(),scope=scopeKey(c);
  const r=await record(c,recordId);
  const p=await assertPackageForPublication(c,r,locale);
  if(!p||p.id!==packageId)throw Error('INTERACTIVE_PUBLISH_BINDING_MISMATCH');
  const result=await db.from(KF_PACKAGE_TABLE)
    .update({state:'published',record_id:recordId,release_id:releaseId})
    .eq('id',packageId).eq('scope_key',scope).in('state',['validated','published'])
    .or(`record_id.is.null,record_id.eq.${recordId}`).select('id').single();
  if(result.error||!result.data)check(result.error||'BINDING_CONFLICT','INTERACTIVE_PUBLICATION_BIND_FAILED');
}
/** In-flight signed preview: no public record is needed. */
export async function adminPackageInfo(c:MarketplaceRequestContext,id:string){
  authorize(c,'manage');const p=await scopedPackage(id,scopeKey(c));
  return {id:p.id,checksum:p.checksum_sha256,state:p.state,family:p.family_key,locale:p.locale,
    title:p.manifest.title,entry:p.entry_path,recordId:p.record_id,releaseId:p.release_id,
    files:Object.entries(p.file_index).map(([path,info])=>({path,...info})),
    capabilities:Array.isArray(p.manifest.capabilities)?p.manifest.capabilities:[],
    audience:p.manifest.audience||{},rights:p.manifest.copyright||{},
    parentId:(p.manifest.__kidflix_studio as any)?.parent||null,runtimeOrigin:runtimeOrigin(),
    previewUrl:`${runtimeOrigin()}/api/kidflix/interactive/runtime/preview/${encodeURIComponent(previewToken(id,c.actor.id,Date.now()+600000))}/${id}/${p.entry_path}`};
}


/** The operator can resume packages without re-uploading or visiting Media Vault. */
export async function listStudioPackages(c:MarketplaceRequestContext,family:string,locale:string){
  authorize(c,'manage');
  if(!['fr','en','ar'].includes(locale)||!/^[a-z-]{3,32}$/.test(family))throw Error('INVALID_STUDIO_FILTER');
  const db=await createServiceClient();
  const r=await db.from(KF_PACKAGE_TABLE)
    .select('id,checksum_sha256,manifest,file_index,locale,family_key,state,record_id,release_id,created_at,entry_path')
    .eq('scope_key',scopeKey(c)).eq('family_key',family).eq('locale',locale)
    .in('state',['validated','published']).order('created_at',{ascending:false}).limit(50);
  if(r.error)check(r.error,'STUDIO_LIBRARY_UNAVAILABLE');
  return (r.data||[]).map(p=>({id:p.id,checksum:p.checksum_sha256,title:p.manifest?.title||'Untitled',
    state:p.state,locale:p.locale,family:p.family_key,recordId:p.record_id,releaseId:p.release_id,
    entry:p.entry_path,createdAt:p.created_at,files:Object.keys(p.file_index||{}).length,
    parentId:p.manifest?.__kidflix_studio?.parent||null}));
}

const EDITABLE=new Set(['html','htm','css','js','mjs','json','md','txt','csv','vtt']);
function editable(path:string){
  const p=safePackagePath(path),ext=p.split('.').pop()?.toLowerCase()||'';
  if(!EDITABLE.has(ext))throw Error('THIS_ASSET_REQUIRES_BINARY_REPLACEMENT');
  return p;
}
async function sourceArchiveBytes(p:PackageRow){
  const db=await createServiceClient();
  const result=await db.storage.from(KF_PACKAGE_BUCKET).download(p.original_storage_path);
  if(result.error||!result.data)check(result.error||'SOURCE_ARCHIVE_NOT_FOUND','SOURCE_ARCHIVE_UNAVAILABLE');
  const bytes=Buffer.from(await result.data.arrayBuffer());
  if(sha256(bytes)!==p.checksum_sha256)throw Error('ORIGINAL_SOURCE_CHECKSUM_MISMATCH');
  return bytes;
}
async function sourceArchive(p:PackageRow){
  const parsed=inspectZip(await sourceArchiveBytes(p));
  if(parsed.manifest.family_key!==p.family_key||parsed.manifest.target_locale!==p.locale)
    throw Error('SOURCE_PACKAGE_IDENTITY_MISMATCH');
  return parsed;
}
/** Real original source download, including post-Studio immutable revisions. */
export async function exportStudioArchive(c:MarketplaceRequestContext,id:string){
  authorize(c,'manage');
  return sourceArchiveBytes(await scopedPackage(id,scopeKey(c)));
}
/** Reading editable content from private storage never executes that content. */
export async function readStudioSource(c:MarketplaceRequestContext,id:string,pathname:string){
  authorize(c,'manage');
  const p=await scopedPackage(id,scopeKey(c)),path=editable(pathname);
  const meta=p.file_index[path];if(!meta||meta.size>256*1024)throw Error('SOURCE_EDIT_SIZE_LIMIT');
  const base=p.scope_key.replace(/[^a-zA-Z0-9_-]/g,'_')+'/'+p.id+'/files/'+path;
  const db=await createServiceClient(),file=await db.storage.from(KF_PACKAGE_BUCKET).download(base);
  if(file.error||!file.data)check(file.error||'ASSET_MISSING','SOURCE_FILE_UNAVAILABLE');
  const bytes=Buffer.from(await file.data.arrayBuffer());
  if(bytes.length!==meta.size||sha256(bytes)!==meta.sha256)throw Error('SOURCE_FILE_INTEGRITY_FAILED');
  return {path,content:new TextDecoder('utf-8',{fatal:true}).decode(bytes),checksum:meta.sha256,bytes:bytes.length};
}
/**
 * Immutability guarantee: an edit creates a complete newly validated package.
 * The operator attaches the new identity to the EXISTING Content 360 draft.
 * Old public releases and original source packages remain unchanged.
 */
export async function deriveStudioPackage(c:MarketplaceRequestContext,sourceId:string,pathname:string,replace:Buffer,expectedSha:string){
  authorize(c,'manage');
  if(replace.length>36*1024*1024)throw Error('REPLACEMENT_EXCEEDS_ASSET_LIMIT');
  const p=await scopedPackage(sourceId,scopeKey(c)),path=safePackagePath(pathname);
  if(!['validated','published'].includes(p.state))throw Error('SOURCE_NOT_VALIDATED');
  const old=p.file_index[path];if(!old||old.sha256!==expectedSha)throw Error('SOURCE_FILE_REVISION_CONFLICT');
  const binary=!EDITABLE.has(path.split('.').pop()?.toLowerCase()||'');
  if(!binary&&replace.length>256*1024)throw Error('TEXT_EDITOR_FILE_TOO_LARGE');
  if(!binary)new TextDecoder('utf-8',{fatal:true}).decode(replace);
  if(binary){
    const extension=path.split('.').pop()?.toLowerCase();
    if(extension==='png'&&!(replace.length>8&&replace.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))))throw Error('PNG_MAGIC_MISMATCH');
    if(['jpg','jpeg'].includes(extension||'')&&!(replace.length>2&&replace[0]===0xff&&replace[1]===0xd8))throw Error('JPEG_MAGIC_MISMATCH');
    if(extension==='webp'&&!(replace.length>12&&replace.toString('ascii',0,4)==='RIFF'&&replace.toString('ascii',8,12)==='WEBP'))throw Error('WEBP_MAGIC_MISMATCH');
  }
  const parsed=await sourceArchive(p);
  const files=parsed.files.map(f=>({path:f.path,bytes:f.path===path?replace:f.bytes}));
  // Keep traceability inside the immutable new package; all platform scope and release IDs are host-assigned.
  const manifestIndex=files.findIndex(f=>f.path==='kidflix.manifest.json');
  if(manifestIndex<0)throw Error('SOURCE_MANIFEST_MISSING');
  const manifest=JSON.parse(files[manifestIndex].bytes.toString('utf8'));
  manifest.__kidflix_studio={parent:p.id,editedPath:path,editedAt:new Date().toISOString()};
  files[manifestIndex]={path:'kidflix.manifest.json',bytes:Buffer.from(JSON.stringify(manifest,null,2)+'\n')};
  const archive=rebuildPackageArchive(files);
  return importPackage(c,archive,p.family_key,p.locale);
}

/** Reuse a published project without re-uploading or stealing another dossier's binding. */
export async function cloneStudioPackage(c:MarketplaceRequestContext,sourceId:string){
  authorize(c,'manage');
  const source=await scopedPackage(sourceId,scopeKey(c));
  if(!['validated','published'].includes(source.state))throw Error('SOURCE_NOT_VALIDATED');
  const parsed=await sourceArchive(source);
  const files=parsed.files.map(f=>({path:f.path,bytes:f.bytes}));
  const index=files.findIndex(f=>f.path==='kidflix.manifest.json');
  if(index<0)throw Error('SOURCE_MANIFEST_MISSING');
  const manifest=JSON.parse(files[index].bytes.toString('utf8'));
  manifest.__kidflix_studio={parent:source.id,duplicatedAt:new Date().toISOString()};
  files[index]={path:'kidflix.manifest.json',bytes:Buffer.from(JSON.stringify(manifest,null,2)+'\n')};
  return importPackage(c,rebuildPackageArchive(files),source.family_key,source.locale);
}

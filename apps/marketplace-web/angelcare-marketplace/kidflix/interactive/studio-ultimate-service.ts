import 'server-only';
import {createServiceClient} from '@/lib/supabase/server';
import type {MarketplaceRequestContext} from '@/angelcare-marketplace/domain/types';
import {authorize,scopeKey} from '@/angelcare-marketplace/digital-customer-experience/repository';
import {KF_PACKAGE_BUCKET,scopedPackage,importPackage,exportStudioArchive} from './service';
import {inspectZip,rebuildPackageArchive,safePackagePath,sha256} from './package';

const allowedMedia=/\.(?:png|jpe?g|webp|gif|avif|mp3|ogg|wav|mp4|webm)$/i;
function fail(code:string,detail?:unknown):never{throw Error(code+(detail?': '+String(detail):''))}
export async function getStudioAsset(c:MarketplaceRequestContext,id:string,pathname:string){
 authorize(c,'manage');
 const p=await scopedPackage(id,scopeKey(c)),path=safePackagePath(pathname);
 if(!allowedMedia.test(path))fail('ONLY_PREVIEW_SAFE_MEDIA');
 const meta=p.file_index?.[path];if(!meta||meta.size>36*1024*1024)fail('MEDIA_NOT_FOUND_OR_TOO_LARGE');
 const base=p.scope_key.replace(/[^a-zA-Z0-9_-]/g,'_')+'/'+id+'/files/'+path;
 const r=await (await createServiceClient()).storage.from(KF_PACKAGE_BUCKET).download(base);
 if(r.error||!r.data)fail('MEDIA_ASSET_UNAVAILABLE',r.error?.message);
 const bytes=Buffer.from(await r.data.arrayBuffer());
 if(bytes.length!==meta.size||sha256(bytes)!==meta.sha256)fail('MEDIA_INTEGRITY_MISMATCH');
 return {bytes,mime:meta.mime,path};
}
export type PatchFile={path:string;checksum:string;content:Buffer};
function validReplacement(path:string,content:Buffer){
 if(content.length>36*1024*1024)fail('REPLACEMENT_ASSET_TOO_LARGE',path);
 const ext=path.split('.').pop()?.toLowerCase();
 if(ext==='png'&&!(content.length>=8&&content.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex'))))fail('PNG_MAGIC_MISMATCH',path);
 if((ext==='jpeg'||ext==='jpg')&&!(content.length>3&&content[0]===0xff&&content[1]===0xd8))fail('JPEG_MAGIC_MISMATCH',path);
 if(ext==='webp'&&!(content.length>12&&content.toString('ascii',0,4)==='RIFF'&&content.toString('ascii',8,12)==='WEBP'))fail('WEBP_MAGIC_MISMATCH',path);
 if(!allowedMedia.test(path))fail('BATCH_ACCEPTS_MEDIA_ONLY',path);
}
/** One atomic immutable revision for a group of asset replacements; old releases remain untouched. */
export async function deriveStudioMediaBatch(c:MarketplaceRequestContext,id:string,changes:PatchFile[]){
 authorize(c,'manage');
 if(changes.length<1||changes.length>24)fail('BATCH_MEDIA_COUNT_OUT_OF_RANGE');
 const p=await scopedPackage(id,scopeKey(c));
 if(!['validated','published'].includes(p.state))fail('SOURCE_NOT_VALIDATED');
 const lookup=new Map<string,Buffer>();let bytes=0;
 for(const item of changes){
  const path=safePackagePath(item.path),meta=p.file_index?.[path];
  if(lookup.has(path))fail('DUPLICATE_BATCH_PATH',path);
  if(!meta||meta.sha256!==item.checksum)fail('SOURCE_FILE_REVISION_CONFLICT',path);
  validReplacement(path,item.content);bytes+=item.content.length;
  if(bytes>60*1024*1024)fail('BATCH_MEDIA_TOTAL_EXCEEDED');
  lookup.set(path,item.content);
 }
 const archive=await exportStudioArchive(c,id),parsed=inspectZip(archive);
 if(parsed.checksum!==p.checksum_sha256)fail('ORIGINAL_PACKAGE_INTEGRITY_FAILED');
 const files=parsed.files.map(x=>({path:x.path,bytes:lookup.get(x.path)||x.bytes}));
 const manifest=files.find(f=>f.path==='kidflix.manifest.json');if(!manifest)fail('MISSING_ORIGINAL_MANIFEST');
 const raw=JSON.parse(manifest.bytes.toString('utf8'));
 raw.__kidflix_studio={parent:id,editedPaths:[...lookup.keys()],editedAt:new Date().toISOString(),changeType:'batch-media'};
 manifest.bytes=Buffer.from(JSON.stringify(raw,null,2)+'\n');
 return importPackage(c,rebuildPackageArchive(files),p.family_key,p.locale);
}

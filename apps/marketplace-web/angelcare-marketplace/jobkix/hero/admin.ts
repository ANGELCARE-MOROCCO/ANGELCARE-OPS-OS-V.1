import 'server-only';
import {createServiceClient} from '@/lib/supabase/server';
import {revalidatePath} from 'next/cache';
import {hasMarketplacePermission,hasMarketplaceWorkspaceAccess,requireMarketplaceApiContext} from '@/angelcare-marketplace/auth/context';
import {EMPTY_HERO,isUUID,validPlacement,validateHero,type HeroDocument} from './contracts';
const images=['image/jpeg','image/png','image/webp','image/avif'];
const fail=(message:string):never=>{throw Error(message)};
export async function heroAdminContext(write=false){
 const c=await requireMarketplaceApiContext('marketplace.admin.access');
 if(!hasMarketplaceWorkspaceAccess(c,'jobkix.editorial'))fail('HERO_EDITORIAL_ACCESS_REQUIRED');
 if(!hasMarketplacePermission(c,'marketplace.media.view'))fail('HERO_MEDIA_VIEW_PERMISSION_REQUIRED');
 if(write&&!hasMarketplacePermission(c,'marketplace.media.manage'))fail('HERO_MEDIA_MANAGE_PERMISSION_REQUIRED');
 return c;
}
export async function heroStudioRead(key:string){
 await heroAdminContext();if(!validPlacement(key))fail('Invalid page selection');
 const db=await createServiceClient(),{data,error}=await db.from('jobkix_hero_placements').select('placement_key,version,state,draft,published,published_revision,updated_at,updated_by').eq('placement_key',key).maybeSingle();
 if(error)throw Error('HERO_STORAGE_UNAVAILABLE: migration 029 may not be applied');
 const raw=data?.draft?validateHero(data.draft):EMPTY_HERO;
 const history=await db.from('jobkix_hero_revisions').select('revision,action,created_at,actor,reason').eq('placement_key',key).order('revision',{ascending:false}).limit(30);
 if(history.error)fail('Unable to load the publication history');
 const {data:assets,error:mediaError}=await db.from('angelcare_marketplace_media_assets').select('id,file_name,public_url,desktop_url,mobile_url,width,height,rights_status,rights_expires_at,mime_type,status').eq('status','active').order('updated_at',{ascending:false}).limit(120);
 if(mediaError)fail('Unable to load the media library');
 const ids=[...new Set(raw.slides.flatMap(s=>[s.assetId,...s.mobileAssetId?[s.mobileAssetId]:[]]))];
 const missing=ids.filter(id=>!(assets||[]).some(a=>a.id===id));
 let extra:typeof assets=[];if(missing.length){const more=await db.from('angelcare_marketplace_media_assets').select('id,file_name,public_url,desktop_url,mobile_url,width,height,rights_status,rights_expires_at,mime_type,status').in('id',missing);if(more.error)fail('Unable to recover linked gallery images');extra=more.data||[];}
 const rights=(a:Record<string,unknown>)=>['owned','licensed','public_domain'].includes(String(a.rights_status))&&(!a.rights_expires_at||Date.parse(String(a.rights_expires_at))>Date.now());
 return {placement:key,version:data?.version||0,state:data?.state||'new',draft:raw,publishedRevision:data?.published_revision||0,history:history.data||[],media:[...(assets||[]),...extra].filter(a=>a.status==='active'&&images.includes(a.mime_type)&&rights(a)),published:!!data?.published};
}
async function validateAssets(doc:HeroDocument){
 const ids=[...new Set(doc.slides.flatMap(s=>[s.assetId,...s.mobileAssetId?[s.mobileAssetId]:[]]))];
 if(!ids.length)return;
 if(!ids.every(isUUID))fail('Invalid asset ID');
 const db=await createServiceClient(),{data,error}=await db.from('angelcare_marketplace_media_assets').select('id,width,height,mime_type,rights_status,rights_expires_at,status,public_url').in('id',ids);
 if(error||!data||data.length!==ids.length)fail('Media asset missing or inaccessible');
 for(const a of data){
  if(a.status!=='active'||!images.includes(a.mime_type)||!['owned','licensed','public_domain'].includes(a.rights_status)||a.rights_expires_at&&Date.parse(a.rights_expires_at)<=Date.now())fail('Asset is inactive or unlicensed');
  if(!(Number(a.width)>0&&Number(a.height)>0))fail('Asset is missing validated dimensions');
  const mobileOnly=doc.slides.some(s=>s.mobileAssetId===a.id)&&!doc.slides.some(s=>s.assetId===a.id);
  if(mobileOnly?(Number(a.width)<500||Number(a.height)<650):(Number(a.width)<900||Number(a.height)<450))fail('Image is too small for a public hero');
 }
}
export async function heroStudioCommand(payload:unknown){
 const context=await heroAdminContext(true);
 if(!payload||typeof payload!=='object'||Array.isArray(payload))fail('Invalid request');
 const p=payload as Record<string,unknown>;
 const placement=String(p.placement||''),action=String(p.action||''),version=Number(p.version);
 if(!validPlacement(placement)||!Number.isSafeInteger(version)||version<0||!['save','review','publish','unpublish','restore'].includes(action))fail('Invalid command');
 const reason=String(p.reason||'').trim();if((action==='publish'||action==='unpublish'||action==='restore')&&(reason.length<20||reason.length>2000))fail('Publishing action requires a 20–2000 character explanation');
 const db=await createServiceClient();let doc:HeroDocument|null=null;
 if(action==='save')doc=validateHero(p.document);
 if(action==='review'||action==='publish'||action==='restore'){
  const {data,error}=await db.from('jobkix_hero_placements').select('draft').eq('placement_key',placement).maybeSingle();
  if(error||!data)fail('HERO_STORAGE_UNAVAILABLE');
  doc=validateHero(action==='restore'&&p.restoreRevision?await historicalDocument(db,placement,Number(p.restoreRevision)):data.draft);
 }
 if(doc)await validateAssets(doc);
 const restoreRevision=p.restoreRevision===undefined?null:Number(p.restoreRevision);
 if(restoreRevision!==null&&(!Number.isSafeInteger(restoreRevision)||restoreRevision<1))fail('Invalid rollback revision');
 const {data,error}=await db.rpc('jobkix_hero_command',{p_actor:String(context.actor.id),p_action:action,p_placement:placement,p_expected_version:version,p_document:action==='save'?doc:null,p_reason:reason,p_restore_revision:restoreRevision});
 if(error)fail(error.message.includes('HERO_VERSION_CONFLICT')?'HERO_VERSION_CONFLICT':error.message);
 if(action==='publish'||action==='restore'||action==='unpublish'){
  // JOBKIX public pages are primarily dynamic. Avoid caching new media server-side on next request.
  revalidatePath('/jobkix','layout');
  revalidatePath('/jobkix/en');revalidatePath('/jobkix/fr');revalidatePath('/jobkix/es');revalidatePath('/jobkix/hi');revalidatePath('/jobkix/tl');revalidatePath('/jobkix/id');revalidatePath('/jobkix/ar');
 }
 return data;
}
async function historicalDocument(db:Awaited<ReturnType<typeof createServiceClient>>,placement:string,revision:number){
 if(!Number.isSafeInteger(revision)||revision<1)fail('Invalid revision');
 const {data,error}=await db.from('jobkix_hero_revisions').select('snapshot').eq('placement_key',placement).eq('revision',revision).maybeSingle();
 if(error||!data?.snapshot)fail('Revision no longer available');
 return data.snapshot;
}

/** Bounded, permission-gated answer to “Where is this image used?” */
export async function heroAssetUsage(id:string){
 await heroAdminContext();if(!isUUID(id))fail('Invalid media asset ID');
 const db=await createServiceClient();const outputs:Record<string,string[]>={};
 for(const field of ['published','draft'] as const){
  const keys=new Set<string>();
  for(const source of ['assetId','mobileAssetId']){
   const {data,error}=await db.from('jobkix_hero_placements').select('placement_key').contains(field,{slides:[{[source]:id}]}).limit(100);
   if(error)fail('Unable to read gallery usage');
   for(const row of data||[])keys.add(String(row.placement_key));
  }
  outputs[field]=[...keys].sort();
 }
 return outputs;
}

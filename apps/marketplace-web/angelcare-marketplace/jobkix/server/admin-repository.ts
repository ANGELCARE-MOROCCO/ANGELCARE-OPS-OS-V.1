import 'server-only';
import { requireMarketplaceApiContext,hasMarketplaceWorkspaceAccess } from '../../auth/context';
import { createServiceClient } from '@/lib/supabase/server';
import { JobkixFault } from '../contracts';
import { ADMIN_ACTION_AREA,adminArea } from '../admin-contract';
import { object,uuid } from '../validation';
import { dependencyError } from './http';
import type { adminInput } from './admin-input';
import { listExperienceMediaAssets } from '../../experience-builder/repository';
import { text } from '../validation';
import { editorialPublicUrl } from '../editorial-media';
async function nativeMediaPermission(){try{return await requireMarketplaceApiContext('marketplace.media.view');}catch(error){if(error&&typeof error==='object'&&'code' in error&&error.code==='PERMISSION_DENIED')throw new JobkixFault('FORBIDDEN');throw dependencyError(error);}}
async function nativeAdmin(slug:string){
 const area=adminArea(slug);if(!area)throw new JobkixFault('NOT_FOUND');
 try{const context=await requireMarketplaceApiContext('marketplace.admin.access');if(!hasMarketplaceWorkspaceAccess(context,area.workspace))throw new JobkixFault('FORBIDDEN');return {context,area};}
 catch(error){if(error instanceof JobkixFault)throw error;if(error&&typeof error==='object'&&'code' in error){if(error.code==='AUTHENTICATION_REQUIRED')throw new JobkixFault('AUTHENTICATION_REQUIRED');if(error.code==='PERMISSION_DENIED')throw new JobkixFault('FORBIDDEN');}throw dependencyError(error);}
}
export async function executeAdmin(input:ReturnType<typeof adminInput>){
 const {context}=await nativeAdmin(ADMIN_ACTION_AREA[input.action]);
 if(input.action==='organization.media_review')await nativeMediaPermission();
 const sections=object(input.payload).sections;
 if(Array.isArray(sections)&&sections.some((section:unknown)=>section&&typeof section==='object'&&'media' in section&&section.media&&typeof section.media==='object'&&'source' in section.media&&section.media.source==='native'))await nativeMediaPermission();
 const db=await createServiceClient(),result=await db.rpc('jobkix_admin_command',{p_actor:uuid(context.actor.id),p_action:input.action,p_payload:input.action==='case.advance'||input.action==='organization.review'?{...input.payload,locale:context.locale}:input.payload,p_expected_version:input.version,p_idempotency_key:input.key});
 if(result.error)throw dependencyError(result.error);return object(result.data);
}
export async function readAdmin(slug:string,purpose:string,id:string|null=null){
 const {context,area}=await nativeAdmin(slug);
 const db=await createServiceClient(),result=await db.rpc('jobkix_admin_read',{p_actor:uuid(context.actor.id),p_collection:area.collection,p_purpose:purpose,p_id:id?uuid(id):null});
 if(result.error)throw dependencyError(result.error);
 return {locale:context.locale,area,data:result.data};
}
export async function adminFile(slug:string,id:string){
 if(slug!=='verification'&&slug!=='cases')throw new JobkixFault('FORBIDDEN');
 const {context}=await nativeAdmin(slug),db=await createServiceClient();
 const result=await db.rpc('jobkix_admin_file_download',{p_actor:uuid(context.actor.id),p_file:uuid(id),p_area:slug,p_purpose:'Authorized JOBKIX '+slug+' evidence review in native administration.'});
 if(result.error)throw dependencyError(result.error);return object(result.data);
}
export async function readEditorialMedia(query:string){
 await nativeAdmin('editorial');await nativeMediaPermission();
 const q=text(query,'q',0,120);if(!/^[\p{L}\p{M}\p{N}\s'’._-]*$/u.test(q))throw new JobkixFault('INVALID_INPUT');
 const assets=await listExperienceMediaAssets(q||undefined);
 return assets.flatMap(asset=>{if(!['image/jpeg','image/png','image/webp','image/avif'].includes(asset.mime_type)||!['owned','licensed','public_domain'].includes(asset.rights_status)||asset.rights_expires_at&&Date.parse(asset.rights_expires_at)<=Date.now())return [];try{return [{id:uuid(asset.id),name:asset.file_name,url:editorialPublicUrl(asset.desktop_url||asset.public_url),rights:asset.rights_status,width:asset.width,height:asset.height}];}catch{return [];}});
}

export async function readOperations(page:number,state:string){
 const {context,area}=await nativeAdmin('health'),db=await createServiceClient();
 const response=await db.rpc('jobkix_operations_read',{p_actor:uuid(context.actor.id),p_purpose:'Authorized JOBKIX D07 notification incident review in native administration.',p_page:page,p_state:state});
 if(response.error)throw dependencyError(response.error);return {locale:context.locale,area,data:response.data};
}

export async function readAdminPage(slug:string,purpose:string,page:number){
 const {context,area}=await nativeAdmin(slug),db=await createServiceClient();
 const response=await db.rpc('jobkix_admin_page',{p_actor:uuid(context.actor.id),p_collection:area.collection,p_purpose:purpose,p_page:page});
 if(response.error)throw dependencyError(response.error);return {locale:context.locale,area,data:response.data};
}

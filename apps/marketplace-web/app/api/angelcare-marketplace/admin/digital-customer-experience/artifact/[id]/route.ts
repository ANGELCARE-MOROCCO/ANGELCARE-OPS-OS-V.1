import {requireMarketplaceApiContext}from'@/angelcare-marketplace/auth/context'
import {apiFailure}from'@/angelcare-marketplace/server/request'
import {createServiceClient}from'@/lib/supabase/server'
import {createMarketplaceMediaDeliveryUrl}from'@/angelcare-marketplace/commerce-studio/media-storage'
import {workItem,result}from'@/angelcare-marketplace/digital-customer-experience/professional'
import {MarketplaceError}from'@/angelcare-marketplace/server/errors'
export const dynamic='force-dynamic';export const runtime='nodejs'
export async function GET(request:Request,context:{params:Promise<{id:string}>}){try{const c=await requireMarketplaceApiContext('marketplace.digital_experience.manage'),{id}=await context.params,db=await createServiceClient(),out=await result<any>(db.from('ac_dce_processing_outputs').select('*').eq('id',id).in('state',['verified','promoted']).maybeSingle());if(!out)throw new MarketplaceError('NOT_FOUND','Verified production output unavailable.');await workItem(c,out.job_id);const response=await fetch(createMarketplaceMediaDeliveryUrl(out.asset_id,60000),{signal:AbortSignal.timeout(30000),cache:'no-store'});if(!response.ok||!response.body)throw new MarketplaceError('NOT_READY','Output delivery unavailable.');return new Response(response.body,{headers:{'Content-Type':out.mime_type,'Content-Disposition':"inline; filename*=UTF-8''"+encodeURIComponent(out.file_name),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",Vary:'Cookie'}})}catch(e){return apiFailure(e)}}

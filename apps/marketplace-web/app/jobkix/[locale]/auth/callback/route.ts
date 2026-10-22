import { createUserClient } from '@/lib/supabase/server';
import { isLocale } from '@/angelcare-marketplace/jobkix/contracts';
import { safeReturnTo,href } from '@/angelcare-marketplace/jobkix/routes';
import { requestOrigin,PRIVATE_HEADERS } from '@/angelcare-marketplace/jobkix/server/http';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;if(!isLocale(locale))return new Response(null,{status:404,headers:PRIVATE_HEADERS});
 const url=new URL(request.url),origin=requestOrigin(request),code=url.searchParams.get('code');
 const token=url.searchParams.get('token_hash'),kind=url.searchParams.get('type');
 if(token&&/^[a-zA-Z0-9_-]{16,256}$/.test(token)&&(kind==='signup'||kind==='recovery'||kind==='magiclink'||kind==='invite'||kind==='email_change')){try{const client=await createUserClient(),result=await client.auth.verifyOtp({token_hash:token,type:kind});if(!result.error)return new Response(null,{status:303,headers:{...PRIVATE_HEADERS,Location:new URL(safeReturnTo(url.searchParams.get('next'),locale),origin).href}});}catch{/* Do not expose single-use token or auth diagnostics. */}}
 if(code && code.length<4000){try{const client=await createUserClient(),result=await client.auth.exchangeCodeForSession(code);if(!result.error)return new Response(null,{status:303,headers:{...PRIVATE_HEADERS,Location:new URL(safeReturnTo(url.searchParams.get('next'),locale),origin).href}});}catch{/* Show a safe recovery route without exposing auth tokens or errors. */}}
 const destination=new URL(href(locale,'auth/confirmation'),origin);destination.searchParams.set('state','link_failed');
 destination.searchParams.set('next',safeReturnTo(url.searchParams.get('next'),locale));
 return new Response(null,{status:303,headers:{...PRIVATE_HEADERS,Location:destination.href}});
}

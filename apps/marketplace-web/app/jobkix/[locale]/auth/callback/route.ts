import { createUserClient } from '@/lib/supabase/server';
import { isLocale } from '@/angelcare-marketplace/jobkix/contracts';
import { href } from '@/angelcare-marketplace/jobkix/routes';
import { requestOrigin,PRIVATE_HEADERS } from '@/angelcare-marketplace/jobkix/server/http';
import { authIntent,authContext,authCallbackDestination } from '@/angelcare-marketplace/jobkix/auth-navigation';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;if(!isLocale(locale))return new Response(null,{status:404,headers:PRIVATE_HEADERS});
 const url=new URL(request.url),origin=requestOrigin(request),code=url.searchParams.get('code');
 const token=url.searchParams.get('token_hash'),kind=url.searchParams.get('type');
 const intent=authIntent(url.searchParams.get('intent'),url.searchParams.get('next'));
 const success=()=>new Response(null,{status:303,headers:{...PRIVATE_HEADERS,Location:new URL(authCallbackDestination(locale,intent,url.searchParams.get('next'),kind),origin).href}});
 if(token&&/^[a-zA-Z0-9_-]{16,256}$/.test(token)&&(kind==='signup'||kind==='recovery'||kind==='magiclink'||kind==='invite'||kind==='email_change')){try{const client=await createUserClient(),result=await client.auth.verifyOtp({token_hash:token,type:kind});if(!result.error)return success();}catch{/* Do not expose single-use token or auth diagnostics. */}}
 if(code && code.length<4000){try{const client=await createUserClient(),result=await client.auth.exchangeCodeForSession(code);if(!result.error)return success();}catch{/* Show a safe recovery route without exposing auth tokens or errors. */}}
 let retryContext=authContext(locale,intent,url.searchParams.get('next'));
 if(kind==='recovery'){
  const reset=new URL(retryContext.get('next')!,origin);
  if(reset.pathname===href(locale,'auth/reset'))retryContext=authContext(locale,intent,reset.searchParams.get('next'));
 }
 const destination=new URL(href(locale,kind==='recovery'?'auth/recovery':'auth/confirmation',retryContext),origin);destination.searchParams.set('state','link_failed');
 return new Response(null,{status:303,headers:{...PRIVATE_HEADERS,Location:destination.href}});
}

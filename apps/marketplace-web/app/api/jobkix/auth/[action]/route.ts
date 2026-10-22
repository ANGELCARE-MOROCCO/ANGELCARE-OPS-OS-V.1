import { createUserClient } from '@/lib/supabase/server';
import { JobkixFault } from '@/angelcare-marketplace/jobkix/contracts';
import { requestJson,requestOrigin,failure,PRIVATE_HEADERS } from '@/angelcare-marketplace/jobkix/server/http';
import { locale,text } from '@/angelcare-marketplace/jobkix/validation';
import { href,safeReturnTo } from '@/angelcare-marketplace/jobkix/routes';
import { accountTerms } from '@/angelcare-marketplace/jobkix/server/repository';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(request:Request,{params}:{params:Promise<{action:string}>}){
 try{
  const {action}=await params,input=await requestJson(request,16000),lang=locale(input.locale);
  const intent=input.intent==='hirer'?'hirer':'candidate';
  const next=safeReturnTo(input.returnTo,lang,intent==='hirer'?'hiring':'career');
  const callback=new URL(href(lang,'auth/callback'),requestOrigin(request));callback.searchParams.set('next',next);
  const client=await createUserClient();
  const email=()=>{const value=text(input.email,'email',3,320).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))throw new JobkixFault('INVALID_INPUT',{email:'email'});return value;};
  const password=()=>text(input.password,'password',12,200);
  let error:{status?:number;code?:string}|null=null;
  if(action==='sign-up'){
   if(input.accepted!==true||input.adultConfirmed!==true)throw new JobkixFault('INVALID_INPUT',{accepted:'consent_required'});
   const terms=await accountTerms(lang);if(!terms)throw new JobkixFault('DEPENDENCY_UNAVAILABLE');if(input.consentRevision!==terms.revision)throw new JobkixFault('VERSION_CONFLICT');
   const result=await client.auth.signUp({email:email(),password:password(),options:{emailRedirectTo:callback.href,data:{full_name:text(input.fullName,'fullName',1,180),jobkix_locale:lang,jobkix_intent:intent,jobkix_account_consent_revision:terms.revision}}});error=result.error;
   if(!error)return Response.json({ok:true,verificationRequired:!result.data.session,next:result.data.session?href(lang,'onboarding',new URLSearchParams({intent,next})):href(lang,'auth/confirmation',new URLSearchParams({intent,next}))},{headers:PRIVATE_HEADERS});
  }else if(action==='sign-in'){
   const value=text(input.password,'password',1,200);const result=await client.auth.signInWithPassword({email:email(),password:value});error=result.error;
   if(!error && result.data.user){
    const account=await client.from('jobkix_accounts').select('status').eq('user_id',result.data.user.id).maybeSingle();
    if(account.error)throw new JobkixFault('DEPENDENCY_UNAVAILABLE');
    if(account.data && account.data.status!=='active')throw new JobkixFault('ACCOUNT_RESTRICTED');
    return Response.json({ok:true,next:account.data?next:href(lang,'onboarding',new URLSearchParams({intent,next}))},{headers:PRIVATE_HEADERS});
   }
  }else if(action==='recovery'){
   callback.searchParams.set('next',href(lang,'auth/reset'));
   const result=await client.auth.resetPasswordForEmail(email(),{redirectTo:callback.href});error=result.error;
  }else if(action==='resend'){
   const result=await client.auth.resend({type:'signup',email:email(),options:{emailRedirectTo:callback.href}});error=result.error;
  }else if(action==='reset'){
   const actor=await client.auth.getUser();if(actor.error||!actor.data.user)throw new JobkixFault('AUTHENTICATION_REQUIRED');
   const result=await client.auth.updateUser({password:password()});error=result.error;
  }else if(action==='sign-out'){
   const result=await client.auth.signOut({scope:input.scope==='global'?'global':'local'});error=result.error;
  }else throw new JobkixFault('NOT_FOUND');
  if(error){if(error.status===429)throw new JobkixFault('RATE_LIMITED');if(error.code==='email_not_confirmed')throw new JobkixFault('EMAIL_UNCONFIRMED');throw new JobkixFault(action==='sign-in'?'AUTHENTICATION_REQUIRED':'DEPENDENCY_UNAVAILABLE');}
  return Response.json({ok:true,next:action==='sign-out'?href(lang):next},{headers:PRIVATE_HEADERS});
 }catch(error){return failure(error);}
}

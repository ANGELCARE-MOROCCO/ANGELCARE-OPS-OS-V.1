import 'server-only';
import { cache } from 'react';
import { createUserClient } from '@/lib/supabase/server';
import { JobkixFault, type Locale, type Principal } from '../contracts';
import { object, locale, text } from '../validation';
import { dependencyError } from './http';

export type JobkixSession =
 | {state:'anonymous'}
 | {state:'verification_pending';userId:string}
 | {state:'onboarding';userId:string;email:string}
 | {state:'restricted';userId:string}
 | {state:'active';userId:string;email:string;locale:Locale;timezone:string;accountVersion:number;emailNotifications:boolean;principal:Principal};

async function readJobkixSession(): Promise<JobkixSession> {
 try {
  const client=await createUserClient();
  const auth=await client.auth.getUser();
  if(auth.error){
   if(auth.error.name==='AuthSessionMissingError' || auth.error.status===401 || auth.error.status===403)return {state:'anonymous'};
   throw new JobkixFault('DEPENDENCY_UNAVAILABLE');
  }
  const user=auth.data.user;if(!user)return {state:'anonymous'};
  if(!user.email_confirmed_at)return {state:'verification_pending',userId:user.id};
  const result=await client.from('jobkix_accounts').select('user_id,status,preferred_locale,timezone,version,notifications_email').eq('user_id',user.id).maybeSingle();
  if(result.error)throw result.error;
  if(!result.data)return {state:'onboarding',userId:user.id,email:user.email||''};
  const account=object(result.data);
  if(account.status!=='active')return {state:'restricted',userId:user.id};
  if(typeof account.version!=='number' || !Number.isSafeInteger(account.version)||typeof account.notifications_email!=='boolean')throw new JobkixFault('DEPENDENCY_UNAVAILABLE');
  return {state:'active',userId:user.id,email:user.email||'',locale:locale(account.preferred_locale),timezone:text(account.timezone,'timezone',1,100),accountVersion:account.version,emailNotifications:account.notifications_email,principal:{userId:user.id,emailConfirmed:true,restricted:false}};
 }catch(error){throw dependencyError(error);}
}
/** Request-local React cache; no identity or private records are cached across requests. */
export const getJobkixSession=cache(readJobkixSession);
export async function requireJobkixSession(): Promise<Extract<JobkixSession,{state:'active'}>> {
 const session=await getJobkixSession();
 if(session.state==='restricted')throw new JobkixFault('ACCOUNT_RESTRICTED');
 if(session.state==='verification_pending')throw new JobkixFault('EMAIL_UNCONFIRMED');
 if(session.state==='onboarding')throw new JobkixFault('AUTHENTICATION_REQUIRED',{onboarding:'required'});
 if(session.state!=='active')throw new JobkixFault('AUTHENTICATION_REQUIRED');
 return session;
}

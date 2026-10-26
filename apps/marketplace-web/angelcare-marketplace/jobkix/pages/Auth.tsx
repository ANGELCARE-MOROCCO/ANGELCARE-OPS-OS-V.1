import { redirect } from 'next/navigation';
import type { Locale } from '../contracts';
import { InvitationAcceptance } from '../client/InvitationAcceptance';
import { invitationPreview } from '../server/repository';
import { uuid,text } from '../validation';
import { AuthForm,type AuthMode } from '../client/AuthForm';
import { accountTerms } from '../server/repository';
import { getJobkixSession } from '../server/identity';
import { safeReturnTo,href } from '../routes';
import { Empty } from '../components/Public';
import { t,errorText } from '../i18n';
import { e } from '../experience-copy';
import { dependencyError } from '../server/http';
import { createUserClient } from '@/lib/supabase/server';
import { authIntent } from '../auth-navigation';
import { ConsentDocuments } from '../components/ConsentDocuments';
import s from '../jobkix.module.css';
const MODES:Record<string,AuthMode>={A01:'sign-up',A02:'sign-in',A03:'sign-up',A04:'sign-in',A05:'confirmation',A06:'recovery',A07:'reset',A08:'onboarding'};
export async function AuthPage({locale,screen,search}:{locale:Locale;screen:string;search:Record<string,string|string[]|undefined>}){
 const hasInvitation=screen==='A08'&&(search.invitation!==undefined||search.token!==undefined);
 const mode=MODES[screen],intent=hasInvitation||screen==='A03'||screen==='A04'?'hirer':screen==='A01'||screen==='A02'?'candidate':authIntent(search.intent,search.next);
 let invitationId='',invitationToken='';if(hasInvitation){try{invitationId=uuid(search.invitation);invitationToken=text(search.token,'token',64,64);if(!/^[a-f0-9]{64}$/.test(invitationToken))throw Error();}catch{return <Empty locale={locale} problem title={errorText(locale,'INVALID_INPUT')}/>;}}
 const next=safeReturnTo(typeof search.next==='string'?search.next:null,locale,intent==='hirer'?'hiring':'career');
 const invitationReturn=hasInvitation?href(locale,'onboarding',new URLSearchParams({intent:'hirer',invitation:invitationId,token:invitationToken})):null;
 let initialName='';
 {
  let session;try{session=await getJobkixSession();}catch(error){return <Empty locale={locale} problem title={errorText(locale,dependencyError(error).code)}/>;}
  if(session.state==='anonymous'&&(mode==='onboarding'||mode==='reset'))redirect(href(locale,intent+'/sign-in',new URLSearchParams({next:invitationReturn||href(locale,mode==='reset'?'auth/reset':'onboarding',new URLSearchParams({intent,next}))})));
  if(session.state==='verification_pending'&&mode!=='confirmation'&&mode!=='recovery')redirect(href(locale,'auth/confirmation',new URLSearchParams({intent,next:invitationReturn||next})));
  if(session.state==='pathway_review')return <Empty locale={locale} problem title={errorText(locale,'ACCOUNT_RESTRICTED')} description="This account requires pathway review. Contact JOBKIX support; your existing data remains protected."/>;
  if(session.state==='active'&&hasInvitation&&session.pathway!=='hirer')redirect(href(locale,'career',new URLSearchParams({pathway:'rejected'})));
  if(session.state==='active'&&hasInvitation){try{const record=await invitationPreview(invitationId,invitationToken);return <div className={s.authLayout}><InvitationAcceptance locale={locale} record={record} token={invitationToken} timezone={session.timezone}/></div>;}catch(error){return <Empty locale={locale} problem title={errorText(locale,dependencyError(error).code)}/>;}}
  if(session.state==='restricted'&&mode==='onboarding')return <Empty locale={locale} problem title={errorText(locale,'ACCOUNT_RESTRICTED')}/>;
  if(session.state==='active'&&(mode==='sign-in'||mode==='sign-up'||mode==='confirmation'))redirect(href(locale,session.pathway==='candidate'?'career':'hiring',session.pathway!==intent?new URLSearchParams({pathway:'rejected'}):undefined));
  if(session.state==='onboarding'&&(mode==='sign-in'||mode==='sign-up'||mode==='confirmation'))redirect(href(locale,'onboarding',new URLSearchParams({intent,next})));
  if(mode==='onboarding'&&session.state==='onboarding'){
   try{
    const client=await createUserClient(),user=await client.auth.getUser();
    const name=user.data.user?.user_metadata?.full_name;initialName=typeof name==='string'?name.slice(0,180):'';
   }catch(error){
    return <Empty locale={locale} problem title={errorText(locale,dependencyError(error).code)}/>;
   }
  }
 }
 let terms=null;try{if(mode==='sign-up'||mode==='onboarding')terms=await accountTerms(locale);}catch{/* Display the unavailable publication state; do not accept unreviewed terms. */}
 return <div className={s.authLayout}><aside className={s.authAside}><span className={s.eyebrow}>JOBKIX · GLOBAL CAREERS PLATFORM</span><h1>{t(locale,intent==='hirer'?'hirerJourney':'candidateJourney')}</h1><p>{e(locale,'privacyIntro')}</p><p>{t(locale,'profileControlDescription')}</p></aside><AuthForm locale={locale} mode={mode} intent={intent} next={invitationReturn||next} initialName={initialName} consentRevision={terms&&typeof terms.revision==='string'?terms.revision:null} consentDocuments={terms?<ConsentDocuments terms={terms}/>:null} linkFailed={search.state==='link_failed'}/></div>;
}

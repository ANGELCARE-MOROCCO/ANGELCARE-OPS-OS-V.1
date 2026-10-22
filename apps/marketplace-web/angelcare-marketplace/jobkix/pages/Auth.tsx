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
import s from '../jobkix.module.css';
const MODES:Record<string,AuthMode>={A01:'sign-up',A02:'sign-in',A03:'sign-up',A04:'sign-in',A05:'confirmation',A06:'recovery',A07:'reset',A08:'onboarding'};
export async function AuthPage({locale,screen,search}:{locale:Locale;screen:string;search:Record<string,string|string[]|undefined>}){
 const hasInvitation=screen==='A08'&&(search.invitation!==undefined||search.token!==undefined);
 const mode=MODES[screen],intent=hasInvitation?'hirer':screen==='A03'||screen==='A04'||search.intent==='hirer'?'hirer':'candidate';
 let invitationId='',invitationToken='';if(hasInvitation){try{invitationId=uuid(search.invitation);invitationToken=text(search.token,'token',64,64);if(!/^[a-f0-9]{64}$/.test(invitationToken))throw Error();}catch{return <Empty locale={locale} problem title={errorText(locale,'INVALID_INPUT')}/>;}}
 const next=safeReturnTo(typeof search.next==='string'?search.next:null,locale,intent==='hirer'?'hiring':'career');
 const invitationReturn=hasInvitation?href(locale,'onboarding',new URLSearchParams({intent:'hirer',invitation:invitationId,token:invitationToken})):null;
 let terms=null;try{if(mode==='sign-up'||mode==='onboarding')terms=await accountTerms(locale);}catch{/* Display the unavailable publication state; do not accept unreviewed terms. */}
 if(mode==='onboarding'||mode==='reset'){
  let session;try{session=await getJobkixSession();}catch(error){return <Empty locale={locale} problem title={errorText(locale,dependencyError(error).code)}/>;}
  if(session.state==='anonymous')redirect(href(locale,intent+'/sign-in',new URLSearchParams({next:invitationReturn||href(locale,mode==='reset'?'auth/reset':'onboarding',new URLSearchParams({intent,next}))})));
  if(session.state==='verification_pending')redirect(href(locale,'auth/confirmation',new URLSearchParams({intent,next:invitationReturn||next})));
  if(session.state==='active'&&hasInvitation){try{const record=await invitationPreview(invitationId,invitationToken);return <div className={s.authLayout}><InvitationAcceptance locale={locale} record={record} token={invitationToken} timezone={session.timezone}/></div>;}catch(error){return <Empty locale={locale} problem title={errorText(locale,dependencyError(error).code)}/>;}}
  if(session.state==='restricted'&&mode==='onboarding')return <Empty locale={locale} problem title={errorText(locale,'ACCOUNT_RESTRICTED')}/>;
 }
 return <div className={s.authLayout}><aside className={s.authAside}><span className={s.eyebrow}>JOBKIX · GLOBAL CAREERS PLATFORM</span><h1>{t(locale,intent==='hirer'?'hirerJourney':'candidateJourney')}</h1><p>{e(locale,'privacyIntro')}</p><p>{t(locale,'profileControlDescription')}</p></aside><AuthForm locale={locale} mode={mode} intent={intent} next={invitationReturn||next} consentRevision={terms&&typeof terms.revision==='string'?terms.revision:null} linkFailed={search.state==='link_failed'}/></div>;
}

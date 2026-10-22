import 'server-only';
import { redirect } from 'next/navigation';
import { JobkixFault,type Locale } from '../contracts';
import { href,safeReturnTo } from '../routes';
import { getJobkixSession } from './identity';
export async function studioSession(locale:Locale,intent:'candidate'|'hirer',returnTo:string){
 const session=await getJobkixSession(),next=safeReturnTo(returnTo,locale,intent==='candidate'?'career':'hiring');
 if(session.state==='anonymous')redirect(href(locale,intent+'/sign-in',new URLSearchParams({intent,next})));
 if(session.state==='verification_pending')redirect(href(locale,'auth/confirmation',new URLSearchParams({intent,next})));
 if(session.state==='onboarding')redirect(href(locale,'onboarding',new URLSearchParams({intent,next})));
 if(session.state==='restricted')throw new JobkixFault('ACCOUNT_RESTRICTED');return session;
}

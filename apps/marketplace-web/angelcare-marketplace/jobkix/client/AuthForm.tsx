'use client';
import { CommandForm } from './CommandForm';
import { GoogleSignIn } from './GoogleSignIn';
import { useEffect,useRef,useState,type FormEvent,type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { JobkixFault,type Locale } from '../contracts';
import { TIMEZONE_SUGGESTIONS } from '../timezone-suggestions';
import { CountryOptions } from '../Country';
import { href } from '../routes';
import { t,errorText } from '../i18n';
import { e } from '../experience-copy';
import { readResponse,useCommand } from './commands';
import s from '../jobkix.module.css';
import { announceJobkixNavigation,cancelJobkixNavigation } from './navigation-buffer-events';
export type AuthMode='sign-up'|'sign-in'|'confirmation'|'recovery'|'reset'|'onboarding';
export function AuthForm({locale,mode,intent,next,consentRevision,consentDocuments,initialName='',linkFailed=false}:{locale:Locale;mode:AuthMode;intent:'candidate'|'hirer';next:string;consentRevision:string|null;consentDocuments?:ReactNode;initialName?:string;linkFailed?:boolean}){
 const router=useRouter(),command=useCommand(),[pending,setPending]=useState(false),[error,setError]=useState<JobkixFault|null>(null),[sent,setSent]=useState(false),[zone,setZone]=useState('UTC');
 const mounted=useRef(true),busy=useRef(false);
 useEffect(()=>{mounted.current=true;setZone(Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC');return()=>{mounted.current=false;};},[]);
 const signup=mode==='sign-up',onboarding=mode==='onboarding',confirmation=mode==='confirmation',recovery=mode==='recovery',reset=mode==='reset';
 const requiresTerms=signup||onboarding,blocked=requiresTerms&&!consentRevision;
 const title=signup?t(locale,'signUp'):onboarding?e(locale,'welcome'):confirmation?e(locale,'confirmation'):recovery||reset?t(locale,'resetPassword'):t(locale,'signIn');
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(busy.current)return;busy.current=true;setPending(true);setError(null);setSent(false);
  const form=new FormData(event.currentTarget);
  if(!confirmation&&!recovery)announceJobkixNavigation(signup?href(locale,'auth/confirmation'):next,false);
  try{
   const common={locale,intent,returnTo:next,accepted:form.get('accepted')==='on',adultConfirmed:form.get('accepted')==='on',consentRevision};
   if(onboarding){const result=await command.run('account.initialize',{...common,displayName:String(form.get('fullName')||''),country:String(form.get('country')||'')||null,timezone:zone});if(result){router.push(intent==='hirer'&&next===href(locale,'hiring')?href(locale,'hiring/organization'):next);router.refresh();}else cancelJobkixNavigation();return;}
   const result=await readResponse(await fetch('/api/jobkix/auth/'+(confirmation?'resend':mode),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...common,fullName:String(form.get('fullName')||''),email:String(form.get('email')||''),password:String(form.get('password')||'')})}));
   if(confirmation||recovery){cancelJobkixNavigation();if(mounted.current)setSent(true);}
   else if(typeof result.next==='string'){router.push(result.next);router.refresh();}
   else throw new JobkixFault('DEPENDENCY_UNAVAILABLE');
  }catch(error){cancelJobkixNavigation();if(mounted.current)setError(error instanceof JobkixFault?error:new JobkixFault('DEPENDENCY_UNAVAILABLE'));}
  finally{busy.current=false;if(mounted.current)setPending(false);}
 }
 const fault=error||command.error;
 const context=new URLSearchParams({next,intent});
 return <section className={s.authCard}><span className={s.eyebrow}>JOBKIX · {t(locale,intent)}</span><h2>{title}</h2>
  {confirmation?<p>{e(locale,'confirmationHelp')}</p>:null}{linkFailed?<p className={s.notice} role="alert">{errorText(locale,'AUTHENTICATION_REQUIRED')}</p>:null}
  {blocked?<p className={s.notice} role="alert">{t(locale,'noPublishedContent')}</p>:null}
  <GoogleSignIn locale={locale} intent={intent} next={next} disabled={blocked}/>
  <CommandForm locale={locale} onSubmit={submit} aria-busy={pending}>
   {signup||onboarding?<label className={s.field}>{t(locale,'fullName')}<input name="fullName" autoComplete="name" maxLength={180} required defaultValue={initialName} aria-invalid={Boolean(fault?.fields.fullName||fault?.fields.displayName)}/></label>:null}
   {!onboarding&&!reset?<label className={s.field}>{t(locale,'email')}<input name="email" type="email" autoComplete="email" dir="ltr" maxLength={254} required aria-invalid={Boolean(fault?.fields.email)}/></label>:null}
   {!onboarding&&!confirmation&&!recovery?<label className={s.field}>{t(locale,'password')}<input name="password" type="password" autoComplete={signup||reset?'new-password':'current-password'} minLength={signup||reset?12:1} maxLength={200} required aria-describedby={signup||reset?'jobkix-password-help':undefined} aria-invalid={Boolean(fault?.fields.password)}/>{signup||reset?<small id="jobkix-password-help">{e(locale,'passwordHelp')}</small>:null}</label>:null}
   {onboarding?<><label className={s.field}>{t(locale,'origin')}<select name="country" defaultValue=""><option value="">{t(locale,'countryUnknown')}</option><CountryOptions locale={locale}/></select><small>{t(locale,'countryExplanation')}</small></label><label className={s.field}>{t(locale,'timezone')}<input value={zone} onChange={event=>setZone(event.target.value)} required maxLength={100} list="jobkix-timezones"/><datalist id="jobkix-timezones">{TIMEZONE_SUGGESTIONS.map(value=><option key={value} value={value}/>)}</datalist></label></>:null}
   {requiresTerms?<>{consentDocuments}<label className={s.checkbox}><input name="accepted" type="checkbox" required disabled={blocked}/><span>{t(locale,'consentAdult')}</span></label></>:null}
   {fault?<div className={s.notice} role="alert"><p>{errorText(locale,fault.code)}</p><p>{t(locale,'inputPreserved')}</p>{fault.code==='EMAIL_UNCONFIRMED'?<Link href={href(locale,'auth/confirmation',context)}>{e(locale,'resend')}</Link>:null}</div>:null}
   {sent?<p className={s.notice} role="status">{e(locale,'confirmationHelp')}</p>:null}
   <button className={s.button} type="submit" disabled={pending||blocked}>{pending?t(locale,'loading'):confirmation?e(locale,'resend'):signup?t(locale,'signUp'):onboarding?t(locale,'continue'):recovery||reset?t(locale,'resetPassword'):t(locale,'signIn')}</button>
  </CommandForm>
  <nav className={s.authLinks} aria-label={t(locale,'myAccount')}><Link href={href(locale,intent+(signup?'/sign-in':'/sign-up'),context)}>{t(locale,signup?'signIn':'signUp')}</Link><Link href={href(locale,'auth/recovery',context)}>{t(locale,'forgotPassword')}</Link></nav>
 </section>;
}

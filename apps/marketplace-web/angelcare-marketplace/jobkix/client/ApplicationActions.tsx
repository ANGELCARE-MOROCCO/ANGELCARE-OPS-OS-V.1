'use client';
import { CommandForm } from './CommandForm';
import { useCurrentTime } from './RuntimeClock';
import { useState,type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from '../contracts';
import type { DataRow } from '../server/repository';
import { str,number } from '../components/Public';
import { useCommand } from './commands';
import { st } from '../studio-copy';
import { t,errorText,formatDate,formatMoney } from '../i18n';
import { employmentLabel,e } from '../experience-copy';
import { op,operationLabel } from '../operations-copy';
import { object } from '../validation';
import s from '../jobkix.module.css';
export function ApplicationActions({locale,application}:{locale:Locale;application:DataRow}){
 const router=useRouter(),command=useCommand(),[confirm,setConfirm]=useState(false);
 const terminal=['hired','declined','withdrawn','closed_due_to_vacancy'].includes(str(application,'state'));
 async function withdraw(event:FormEvent<HTMLFormElement>){event.preventDefault();const result=await command.run('application.withdraw',{applicationId:application.id},number(application,'version')||0);if(result){setConfirm(false);router.refresh();}}
 if(terminal)return null;
 return <section className={s.panel}><button className={`${s.button} ${s.quiet}`} onClick={()=>setConfirm(value=>!value)} aria-expanded={confirm}>{st(locale,'withdraw')}</button>{confirm?<CommandForm locale={locale} onSubmit={withdraw}><p>{st(locale,'withdrawHelp')}</p><label className={s.checkbox}><input type="checkbox" required/><span>{st(locale,'withdraw')}</span></label><div className={s.inlineActions}><button className={s.button} type="submit" disabled={command.pending}>{command.pending?t(locale,'saving'):st(locale,'withdraw')}</button><button className={`${s.button} ${s.secondary}`} type="button" onClick={()=>setConfirm(false)}>{t(locale,'cancel')}</button></div></CommandForm>:null}{command.error?<p role="alert" className={s.notice}>{errorText(locale,command.error.code)}</p>:null}</section>;
}
export function InterviewResponse({locale,interview,timezone}:{locale:Locale;interview:DataRow;timezone:string}){
 const router=useRouter(),command=useCommand();
 async function respond(response:string){if(await command.run('interview.respond',{id:interview.id,response},number(interview,'version')||0))router.refresh();}
 const now=useCurrentTime(),active=['proposed','scheduled'].includes(str(interview,'state'))&&Date.parse(str(interview,'starts_at'))>now;
 return <article className={s.panel}><h3>{st(locale,'interviews')}</h3><p><time dateTime={str(interview,'starts_at')}>{formatDate(str(interview,'starts_at'),locale,timezone)}</time> · <bdi>{timezone}</bdi></p>{timezone!==interview.timezone?<p><time dateTime={str(interview,'starts_at')}>{formatDate(str(interview,'starts_at'),locale,str(interview,'timezone'))}</time> · <bdi>{str(interview,'timezone')}</bdi></p>:null}
  <p>{operationLabel(locale,str(interview,'format'))} · {operationLabel(locale,str(interview,'state'))}</p><p>{op(locale,'candidateResponse')}: {operationLabel(locale,str(interview,'candidate_response'))}</p><p className={s.authoredText}>{str(interview,'location')}</p><div className={s.inlineActions}>{active?<><button className={s.button} disabled={command.pending} onClick={()=>respond('accepted')}>{st(locale,'accept')}</button><button className={`${s.button} ${s.secondary}`} disabled={command.pending} onClick={()=>respond('reschedule_requested')}>{st(locale,'reschedule')}</button><button className={`${s.button} ${s.quiet}`} disabled={command.pending} onClick={()=>respond('declined')}>{st(locale,'decline')}</button></>:null}<a className={s.textLink} href={'/api/jobkix/interviews/'+str(interview,'id')+'/calendar'} download>{st(locale,'calendar')}</a></div>{command.error?<p className={s.notice} role="alert">{errorText(locale,command.error.code)}</p>:null}
 </article>;
}
export function OfferResponse({locale,offer,timezone}:{locale:Locale;offer:DataRow;timezone:string}){
 const router=useRouter(),command=useCommand(),[reviewedVersion,setReviewedVersion]=useState<number|null>(null),[resultState,setResultState]=useState<string|null>(null);
 const reviewed=reviewedVersion===number(offer,'version');
 async function respond(response:'accepted'|'declined'){if(!reviewed)return;const result=await command.run('offer.respond',{id:offer.id,response},number(offer,'version')||0);if(result){setResultState(response);router.refresh();}}
 const now=useCurrentTime(),current=offer.state==='sent'&&(!offer.response_deadline||Date.parse(str(offer,'response_deadline'))>now)&&!resultState;
 const pay=offer.compensation?object(offer.compensation):null;
 return <article className={s.panel}><span className={s.eyebrow}>{st(locale,'offers')} · {e(locale,'revision')} {number(offer,'version')}</span><h3>{str(offer,'title')}</h3><p className={s.authoredText}>{str(offer,'terms')}</p>{pay?<p>{[number(pay,'minimum'),number(pay,'maximum')].filter((value):value is number=>value!==null).map(value=>formatMoney(value,str(pay,'currency'),locale)).join(' – ')} · {employmentLabel(locale,str(pay,'unit'))}</p>:null}
  {offer.starts_at?<p>{op(locale,'starts')}: {formatDate(str(offer,'starts_at'),locale,timezone)}</p>:null}{offer.response_deadline?<p>{e(locale,'deadline')}: <time dateTime={str(offer,'response_deadline')}>{formatDate(str(offer,'response_deadline'),locale,timezone)}</time> · <bdi>{timezone}</bdi></p>:null}
  {current?<><label className={s.checkbox}><input type="checkbox" checked={reviewed} onChange={event=>setReviewedVersion(event.target.checked?number(offer,'version'):null)}/><span>{st(locale,'offerConfirm')}</span></label><div className={s.inlineActions}><button className={s.button} disabled={!reviewed||command.pending} onClick={()=>respond('accepted')}>{st(locale,'accept')}</button><button className={`${s.button} ${s.secondary}`} disabled={!reviewed||command.pending} onClick={()=>respond('declined')}>{st(locale,'decline')}</button></div></>:<p className={s.notice}>{resultState==='accepted'||offer.state==='accepted'?st(locale,'accept'):resultState==='declined'||offer.state==='declined'?st(locale,'decline'):offer.state==='sent'?errorText(locale,'OFFER_EXPIRED'):operationLabel(locale,str(offer,'state'))}</p>}
  {command.error?<p className={s.notice} role="alert">{errorText(locale,command.error.code)}</p>:null}
 </article>;
}

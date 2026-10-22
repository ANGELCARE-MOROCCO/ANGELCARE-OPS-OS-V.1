'use client';
import { CommandForm } from './CommandForm';
import { useRef,useState,type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { JobkixFault,type Locale,type FaultCode } from '../contracts';
import type { DataRow } from '../server/repository';
import { object } from '../validation';
import { vacancyActions } from '../hiring-vacancy';
import { wallTimeInstant } from '../zoned-time';
import { t,errorText } from '../i18n';
import { h } from '../hiring-copy';
import { str,number } from '../components/Public';
import { href } from '../routes';
import { useCommand } from './commands';
import s from '../jobkix.module.css';
const LABELS={ 'vacancy.submit_review':'submitReview','vacancy.publish':'publish','vacancy.pause':'pause','vacancy.close':'close','vacancy.archive':'archiveVacancy','vacancy.reopen':'reopen','vacancy.duplicate':'duplicate'} as const;
type Action=keyof typeof LABELS;
const isAction=(value:unknown):value is Action=>typeof value==='string'&&Object.hasOwn(LABELS,value);
interface Intent {action:Action;payload:DataRow;version:number;key:string}
function intentOf(value:unknown):Intent|null{if(!value||typeof value!=='object'||Array.isArray(value))return null;const row=object(value),action=row.action;if(!isAction(action)||typeof row.version!=='number'||typeof row.key!=='string'||!row.payload||typeof row.payload!=='object'||Array.isArray(row.payload))return null;return {action,payload:object(row.payload),version:row.version,key:row.key};}
export function VacancyPublication({locale,vacancy,organizationId,timezone,draft,receipt,canDuplicate}:{locale:Locale;vacancy:DataRow;organizationId:string;timezone:string;draft:DataRow|null;receipt:DataRow|null;canDuplicate:boolean}){
 const router=useRouter(),command=useCommand(),savedIntent=intentOf(draft?.body),actions=vacancyActions(vacancy).filter(isAction).filter(action=>action!=='vacancy.duplicate'||canDuplicate),[intent,setIntent]=useState<Intent|null>(savedIntent),[completed,setCompleted]=useState<DataRow|null>(receipt),[fault,setFault]=useState<FaultCode|null>(null),[reason,setReason]=useState(''),[closing,setClosing]=useState(''),[zone,setZone]=useState(timezone),[busy,setBusy]=useState(false),lock=useRef(false),draftVersion=useRef(number(draft||{},'version')||0),draftKey='vacancy-action:'+str(vacancy,'id');
 async function apply(next:Intent){const result=await command.run(next.action,next.payload,next.version,next.key);if(!result)return;setCompleted(result);await command.run('draft.remove',{kind:'vacancy',key:draftKey},draftVersion.current);if(next.action==='vacancy.duplicate')router.push(href(locale,'hiring/vacancies/'+str(result,'id'),new URLSearchParams({organization:organizationId})));else router.refresh();}
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();if(lock.current||completed)return;lock.current=true;setBusy(true);setFault(null);try{if(intent){await apply(intent);return;}const button=event.nativeEvent instanceof SubmitEvent?event.nativeEvent.submitter:null,action=button instanceof HTMLButtonElement?button.value:'';if(!isAction(action)||!actions.includes(action))throw new JobkixFault('INVALID_INPUT');const known=action,payload:DataRow={id:str(vacancy,'id')};if(known==='vacancy.publish')payload.expiresAt=wallTimeInstant(closing,zone);else if(known!=='vacancy.submit_review'){if(reason.trim().length<10||reason.length>1500)throw new JobkixFault('INVALID_INPUT');payload.reason=reason.trim();}
  const next={action:known,payload,version:number(vacancy,'version')||0,key:crypto.randomUUID()},checkpoint=await command.run('draft.save',{kind:'vacancy',key:draftKey,body:next},draftVersion.current);if(!checkpoint)return;draftVersion.current=number(checkpoint,'version')||draftVersion.current;setIntent(next);await apply(next);
 }catch(error){setFault(error instanceof JobkixFault?error.code:'DEPENDENCY_UNAVAILABLE');}finally{lock.current=false;setBusy(false);}}
 async function clear(){if(lock.current)return;lock.current=true;setBusy(true);try{const removed=await command.run('draft.remove',{kind:'vacancy',key:draftKey},draftVersion.current);if(removed){setIntent(null);setCompleted(null);draftVersion.current=0;router.refresh();}}finally{lock.current=false;setBusy(false);}}
 return <section className={s.panel}><h2>{h(locale,'reviewPublish')}</h2><p>{h(locale,'publishHelp')}</p>{vacancy.state==='pending_review'?<p className={s.notice}>{h(locale,vacancy.reviewed_version===vacancy.version?'reviewReady':'awaitingReview')}</p>:null}
 {completed?<div className={s.notice} role="status">{t(locale,'saved')}{intent?.action==='vacancy.duplicate'?<Link className={s.textLink} href={href(locale,'hiring/vacancies/'+str(completed,'id'),new URLSearchParams({organization:organizationId}))}>{h(locale,'editVacancy')}</Link>:null}{draft?<button className={`${s.button} ${s.secondary}`} type="button" disabled={busy} onClick={clear}>{t(locale,'continue')}</button>:null}</div>:<CommandForm locale={locale} onSubmit={submit} className={s.stack}>
  {intent?<p className={s.notice}>{h(locale,'recoverHelp')}</p>:<fieldset className={s.vacancyEditorFields} disabled={busy}>
   {actions.includes('vacancy.publish')?<div className={s.formGrid}><label className={s.field}>{h(locale,'closingTime')}<input type="datetime-local" value={closing} onChange={event=>setClosing(event.target.value)}/></label><label className={s.field}>{t(locale,'timezone')}<input value={zone} onChange={event=>setZone(event.target.value)} maxLength={100} dir="ltr"/></label><p className={`${s.notice} ${s.fullWidth}`}>{h(locale,'timeHelp')}</p></div>:null}
   {actions.some(action=>!['vacancy.publish','vacancy.submit_review'].includes(action))?<label className={s.field}>{h(locale,'reason')}<textarea value={reason} onChange={event=>setReason(event.target.value)} minLength={10} maxLength={1500}/></label>:null}
   <div className={s.inlineActions}>{actions.map(action=><button key={action} className={`${s.button} ${action==='vacancy.publish'||action==='vacancy.submit_review'?'':s.secondary}`} value={action} type="submit">{h(locale,LABELS[action])}</button>)}</div>
  </fieldset>}
  {intent?<button className={s.button} type="submit" disabled={busy}>{busy?t(locale,'saving'):h(locale,'resume')}</button>:null}
  {(fault||command.error)?<p className={s.notice} role="alert">{errorText(locale,fault||command.error?.code||'DEPENDENCY_UNAVAILABLE')} {t(locale,'inputPreserved')}</p>:null}
  {intent&&command.error&&['VERSION_CONFLICT','INVALID_INPUT','INVALID_TRANSITION','FORBIDDEN'].includes(command.error.code)?<button className={`${s.button} ${s.secondary}`} type="button" disabled={busy} onClick={clear}>{h(locale,'editVacancy')}</button>:null}
 </CommandForm>}</section>;
}

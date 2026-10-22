'use client';
import { CommandForm } from './CommandForm';
import { useEffect,useRef,useState,type FormEvent } from 'react';
import Link from 'next/link';
import { JobkixFault } from '../contracts';
import { poolMembershipResult } from '../pool-membership';
import { readResponse } from './commands';
import { href } from '../routes';
import { ChevronDown } from 'lucide-react';
import type { Locale } from '../contracts';
import type { DataRow } from '../server/repository';
import { object } from '../validation';
import { talentIntent,type TalentDraftAction } from '../talent-draft';
import { str } from '../components/Public';
import { w } from '../workforce-copy';
import { ac } from '../account-copy';
import { t,errorText } from '../i18n';
import { h } from '../hiring-copy';
import { st } from '../studio-copy';
import { useDurableDraft,type DraftProtocol } from './useDurableDraft';
import type { StudioSelectionResult } from '../studio-selection';
import { StudioRecordPicker } from './StudioRecordPicker';
import { validSelectionIds } from '../studio-selection';
import s from '../jobkix.module.css';
const protocol:DraftProtocol<TalentDraftAction>={kind:'talent',parse:talentIntent};
function Feedback({locale,workflow}:{locale:Locale;workflow:ReturnType<typeof useDurableDraft<TalentDraftAction>>}){return <>{workflow.pending?<p className={s.notice} role="status">{h(locale,'recoverHelp')}</p>:null}{workflow.result?<p className={s.notice} role="status">{t(locale,'saved')}</p>:null}{workflow.error?<p className={s.notice} role="alert">{errorText(locale,workflow.error.code)} {t(locale,'inputPreserved')}</p>:null}{workflow.pending&&workflow.error&&['INVALID_INPUT','VERSION_CONFLICT','INVALID_TRANSITION','FORBIDDEN'].includes(workflow.error.code)?<button className={`${s.button} ${s.secondary}`} type="button" disabled={workflow.processing} onClick={workflow.discard}>{t(locale,'back')}</button>:null}</>;}
export function TalentPoolCreate({locale,organizationId,draft,receipt}:{locale:Locale;organizationId:string;draft:DataRow|null;receipt:DataRow|null}){
 const workflow=useDurableDraft(protocol,'new-pool:'+organizationId,draft,receipt),initial=!receipt&&draft?.body?object(object(draft.body).fields||{}):{},[name,setName]=useState(str(initial,'name'));
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const fields={name},button=event.nativeEvent instanceof SubmitEvent?event.nativeEvent.submitter:null;if(button instanceof HTMLButtonElement&&button.value==='draft'){await workflow.saveDraft(fields);return;}await workflow.run('pool.create',{organizationId,name},0,fields);}
 return <section className={s.panel}><h2>{w(locale,'createPool')}</h2><CommandForm locale={locale} onSubmit={submit}><label className={s.field}>{w(locale,'poolName')}<input value={name} onChange={event=>setName(event.target.value)} required minLength={1} maxLength={180} disabled={workflow.processing||Boolean(workflow.pending)||Boolean(workflow.result)}/></label><div className={s.inlineActions}><button type="submit" className={s.button} disabled={workflow.processing||Boolean(workflow.result)}>{workflow.processing?t(locale,'saving'):workflow.pending?h(locale,'resume'):w(locale,'createPool')}</button>{!workflow.pending&&!workflow.result?<button type="submit" value="draft" formNoValidate className={`${s.button} ${s.secondary}`} disabled={workflow.processing}>{st(locale,'draft')}</button>:null}{workflow.result?<button type="button" className={`${s.button} ${s.secondary}`} disabled={workflow.processing} onClick={()=>{setName('');workflow.discard();}}>{w(locale,'createPool')}</button>:null}</div><Feedback locale={locale} workflow={workflow}/></CommandForm></section>;
}
export function TalentPoolControl({locale,organizationId,candidateId,pools,poolId,version=0,draft,receipt}:{locale:Locale;organizationId:string;candidateId:string;pools:StudioSelectionResult;poolId?:string;version?:number;draft:DataRow|null;receipt:DataRow|null}){
 const workflow=useDurableDraft(protocol,'candidate:'+organizationId+':'+candidateId,draft,receipt),initial=!receipt&&draft?.body?object(object(draft.body).fields||{}):{};
 const [selected,setSelected]=useState(str(initial,'poolId')||poolId||pools.items[0]?.id||''),[confirm,setConfirm]=useState(false),[checking,setChecking]=useState(false),[alreadySaved,setAlreadySaved]=useState(false),[lookupError,setLookupError]=useState<JobkixFault|null>(null),controller=useRef<AbortController|null>(null),mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;controller.current?.abort();};},[]);
 const frozen=checking||workflow.processing||Boolean(workflow.pending)||Boolean(workflow.result),action=poolId?'pool.remove':'pool.add',intent=workflow.pending,pendingPool=intent?validSelectionIds([intent.payload.poolId])[0]:null,mismatched=Boolean(intent&&(intent.action!==action||intent.payload.candidateUserId!==candidateId||intent.payload.poolId!==(poolId||selected)));
 const savedPath=intent&&intent.payload.candidateUserId===candidateId&&pendingPool&&(intent.action==='pool.add'||intent.action==='pool.remove')?href(locale,intent.action==='pool.add'?'hiring/talent':'hiring/pools',new URLSearchParams({organization:organizationId,...(intent.action==='pool.remove'?{pool:pendingPool}:{})})):null;
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(mismatched||checking||controller.current||workflow.processing||workflow.result||(!confirm&&!workflow.pending)||(!selected&&!workflow.pending))return;
  if(!poolId&&!workflow.pending){
   const request=new AbortController();controller.current=request;setChecking(true);setLookupError(null);
   try{
    const params=new URLSearchParams({organization:organizationId,pool:selected,candidate:candidateId}),response=await readResponse(await fetch('/api/jobkix/talent/pool-membership?'+params,{signal:request.signal,cache:'no-store'}));
    if(!mounted.current||request.signal.aborted)return;
    if(poolMembershipResult(response.result).present){setAlreadySaved(true);return;}
   }catch(error){if(mounted.current&&!request.signal.aborted)setLookupError(error instanceof JobkixFault?error:new JobkixFault('DEPENDENCY_UNAVAILABLE'));return;}
   finally{if(controller.current===request)controller.current=null;if(mounted.current)setChecking(false);}
   if(!mounted.current)return;
  }
  await workflow.run(poolId?'pool.remove':'pool.add',{poolId:poolId||selected,candidateUserId:candidateId},poolId?version:0,{poolId:poolId||selected});
 }
 return <CommandForm locale={locale} onSubmit={submit} className={s.stack}>
 {!poolId?<details className={`${s.filterDisclosure} ${s.studioRecordDisclosure}`}><summary className={s.studioRecordSummary}><span>{w(locale,'pool')}</span><ChevronDown size={18} aria-hidden="true"/></summary><StudioRecordPicker locale={locale} kind="pools" organization={organizationId} label={w(locale,'pool')} initial={pools} selected={selected?[selected]:[]} required disabled={frozen} onChange={ids=>{setSelected(ids[0]||'');setConfirm(false);setAlreadySaved(false);setLookupError(null);}}/></details>:null}
 <label className={s.checkbox}><input type="checkbox" required checked={confirm} disabled={frozen} onChange={event=>setConfirm(event.target.checked)}/><span>{ac(locale,'confirm')}</span></label>
 <button className={`${s.button} ${s.secondary}`} disabled={mismatched||checking||workflow.processing||Boolean(workflow.result)||alreadySaved||(!selected&&!workflow.pending)} type="submit">{checking||workflow.processing?t(locale,'saving'):workflow.pending?h(locale,'resume'):w(locale,poolId?'removePool':'addPool')}</button>
 {mismatched?<div className={s.notice} role="status"><p>{w(locale,'pendingPoolChange')}</p>{savedPath?<Link className={s.textLink} href={savedPath}>{w(locale,'openSavedChange')}</Link>:null}<button type="button" className={`${s.button} ${s.secondary}`} disabled={workflow.processing} onClick={workflow.discard}>{t(locale,'back')}</button></div>:null}
 {alreadySaved?<p className={s.notice} role="status">{w(locale,'alreadyInPool')} <Link className={s.textLink} href={href(locale,'hiring/pools',new URLSearchParams({organization:organizationId,pool:selected}))}>{w(locale,'openPool')}</Link></p>:null}
 {lookupError?<p className={s.notice} role="alert">{errorText(locale,lookupError.code)} {t(locale,'inputPreserved')}</p>:null}
 <Feedback locale={locale} workflow={workflow}/>
 {!poolId&&workflow.result?<button type="button" className={`${s.button} ${s.secondary}`} disabled={workflow.processing} onClick={async()=>{await workflow.discard();setConfirm(false);setAlreadySaved(false);setLookupError(null);}}>{w(locale,'anotherPool')}</button>:null}
 </CommandForm>;
}

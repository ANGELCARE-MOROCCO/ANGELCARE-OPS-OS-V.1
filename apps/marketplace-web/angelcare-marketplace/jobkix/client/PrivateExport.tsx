'use client';
import { useEffect,useRef,useState } from 'react';
import { JobkixFault,type FaultCode,type Locale } from '../contracts';
import { ac } from '../account-copy';
import { errorText } from '../i18n';
import { PRIVATE_EXPORT_FILENAME,privateExportBlob } from '../private-export';
import { readResponse } from './commands';
import s from '../jobkix.module.css';

export function PrivateExport({locale,userId}:{locale:Locale;userId:string}){
 const [state,setState]=useState<'idle'|'pending'|'ready'>('idle'),[fault,setFault]=useState<FaultCode|null>(null),generation=useRef(0),active=useRef<AbortController|null>(null),busy=useRef(false),downloads=useRef(new Map<string,number>());
 useEffect(()=>{const urls=downloads.current;return()=>{generation.current++;active.current?.abort();busy.current=false;for(const [url,timer] of urls){window.clearTimeout(timer);URL.revokeObjectURL(url);}urls.clear();};},[userId]);
 async function download(){
  if(busy.current)return;busy.current=true;const version=++generation.current,abort=new AbortController();active.current=abort;setFault(null);setState('pending');
  try{
   const response=await fetch('/api/jobkix/account/export',{cache:'no-store',credentials:'same-origin',redirect:'error',signal:abort.signal});
   if(!response.ok){await readResponse(response);throw new JobkixFault('DEPENDENCY_UNAVAILABLE');}
   const blob=await privateExportBlob(response,userId);
   if(abort.signal.aborted||version!==generation.current)return;
   const url=URL.createObjectURL(blob),link=document.createElement('a');
   link.href=url;link.download=PRIVATE_EXPORT_FILENAME;link.hidden=true;
   try{document.body.append(link);link.click();}finally{link.remove();const timer=window.setTimeout(()=>{URL.revokeObjectURL(url);downloads.current.delete(url);},1000);downloads.current.set(url,timer);}
   setState('ready');
  }catch(error){if(!abort.signal.aborted&&version===generation.current){setFault(error instanceof JobkixFault?error.code:'DEPENDENCY_UNAVAILABLE');setState('idle');}}
  finally{if(version===generation.current){active.current=null;busy.current=false;}}
 }
 return <div className={s.stack} data-jobkix-private-export aria-busy={state==='pending'}><div><button className={s.button} type="button" onClick={download} disabled={state==='pending'}>{ac(locale,state==='pending'?'exportPreparing':fault?'exportRetry':'export')}</button></div>{state==='pending'?<p className={s.notice} role="status">{ac(locale,'exportPreparing')}</p>:state==='ready'?<p className={s.notice} role="status">{ac(locale,'exportReady')}</p>:null}{fault?<p className={s.notice} role="alert">{errorText(locale,fault)}</p>:null}</div>;
}

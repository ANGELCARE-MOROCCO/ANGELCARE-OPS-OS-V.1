'use client';
import { useEffect,useRef,useState } from 'react';
import type { Locale,FaultCode } from '../contracts';
import { JobkixFault } from '../contracts';
import type { DataRow } from '../server/repository';
import { object } from '../validation';
import { str } from '../components/Public';
import { t,errorText } from '../i18n';
import { readResponse } from './commands';
import s from '../jobkix.module.css';
export function EmployerSelect({locale,value,onChange,initialName=''}:{locale:Locale;value:string;onChange:(value:string)=>void;initialName?:string}){
 const [query,setQuery]=useState(''),[rows,setRows]=useState<DataRow[]>([]),[page,setPage]=useState(1),[total,setTotal]=useState(0),[busy,setBusy]=useState(false),[fault,setFault]=useState<FaultCode|null>(null),[retry,setRetry]=useState(0),generation=useRef(0);
 useEffect(()=>{const version=++generation.current,abort=new AbortController();setBusy(true);const timeout=window.setTimeout(async()=>{try{const response=await readResponse(await fetch('/api/jobkix/employers?'+new URLSearchParams({q:query,page:String(page)}),{signal:abort.signal,cache:'no-store'})),result=object(response.result);if(!Array.isArray(result.items)||typeof result.total!=='number')throw new JobkixFault('DEPENDENCY_UNAVAILABLE');if(version===generation.current){setRows(result.items.map(object));setTotal(result.total);setFault(null);}}catch(error){if(!abort.signal.aborted&&version===generation.current)setFault(error instanceof JobkixFault?error.code:'DEPENDENCY_UNAVAILABLE');}finally{if(version===generation.current)setBusy(false);}},250);return()=>{generation.current++;window.clearTimeout(timeout);abort.abort();};},[query,page,retry]);
 return <div className={s.stack} aria-busy={busy}><label className={s.field}>{t(locale,'search')}<input type="search" value={query} onChange={event=>{setQuery(event.target.value);setPage(1);}} maxLength={300}/></label><label className={s.field}>{t(locale,'employers')}<select value={value} onChange={event=>onChange(event.target.value)} required><option value="">{t(locale,'any')}</option>{value&&!rows.some(row=>row.id===value)?<option value={value}>{initialName||value}</option>:null}{rows.map(row=><option key={str(row,'id')} value={str(row,'id')}>{str(row,'name')}</option>)}</select></label><div className={s.inlineActions}>{page>1?<button className={`${s.button} ${s.secondary}`} type="button" disabled={busy} onClick={()=>setPage(value=>value-1)}>{t(locale,'previous')}</button>:null}{page*24<total?<button className={`${s.button} ${s.secondary}`} type="button" disabled={busy} onClick={()=>setPage(value=>value+1)}>{t(locale,'next')}</button>:null}</div>{fault?<p className={s.notice} role="alert">{errorText(locale,fault)} <button className={s.textLink} type="button" onClick={()=>setRetry(value=>value+1)}>{t(locale,'retry')}</button></p>:null}</div>;
}

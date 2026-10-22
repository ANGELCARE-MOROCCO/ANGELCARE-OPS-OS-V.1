'use client';
import { useEffect,useRef,useState } from 'react';
import { JobkixFault,type Locale } from '../contracts';
import { documentSelectionResult,type DocumentSelectionResult,type SelectableDocument } from '../document-selection';
import { t,errorText } from '../i18n';
import { e } from '../experience-copy';
import { ac } from '../account-copy';
import { readResponse } from './commands';
import s from '../jobkix.module.css';

export function DocumentPicker({locale,initial,value,selected,required,disabled=false,onChange,onResolve,context,organizationId,label,searchLabel}:{locale:Locale;initial:DocumentSelectionResult;value:string;selected:SelectableDocument|null;required:boolean;disabled?:boolean;context?:'case'|'verification';organizationId?:string;label?:string;searchLabel?:string;onChange:(id:string,file:SelectableDocument|null)=>void;onResolve:(file:SelectableDocument|null)=>void}){
 const [result,setResult]=useState(initial),[query,setQuery]=useState(''),[pending,setPending]=useState(false),[error,setError]=useState<JobkixFault|null>(null);
 const sequence=useRef(0),controller=useRef<AbortController|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),lastRequest=useRef({page:1,q:''});
 useEffect(()=>()=>{sequence.current++;controller.current?.abort();if(timer.current)clearTimeout(timer.current);},[]);
 async function load(request:{page:number;q:string}){
  if(timer.current)clearTimeout(timer.current);controller.current?.abort();const token=++sequence.current,abort=new AbortController();controller.current=abort;lastRequest.current=request;setPending(true);setError(null);
  const params=new URLSearchParams({page:String(request.page),q:request.q});if(value)params.set('selected',value);if(context)params.set('context',context);if(context==='verification'&&organizationId)params.set('organization',organizationId);
  try{
   const response=await readResponse(await fetch('/api/jobkix/files?'+params,{signal:abort.signal,cache:'no-store'})),next=documentSelectionResult(response.result);
   if(sequence.current!==token||abort.signal.aborted)return;
   setResult(next);onResolve(value?(next.selected||next.items.find(item=>item.id===value)||null):null);
  }catch(error){if(sequence.current===token&&!abort.signal.aborted)setError(error instanceof JobkixFault?error:new JobkixFault('DEPENDENCY_UNAVAILABLE'));}
  finally{if(sequence.current===token&&!abort.signal.aborted)setPending(false);}
 }
 function search(next:string){setQuery(next);if(timer.current)clearTimeout(timer.current);controller.current?.abort();sequence.current++;setPending(true);timer.current=setTimeout(()=>{void load({page:1,q:next});},250);}
 const unavailableText=context?ac(locale,'evidenceUnavailable'):t(locale,'documentSelectionUnavailable'),selectedLabel=context?ac(locale,'selectedEvidence'):t(locale,'selectedDocument');
 const options=result.items.some(item=>item.id===value)||!selected?result.items:[...result.items,selected],unavailable=Boolean(value&&!selected),pages=Math.max(1,Math.ceil(result.total/result.pageSize));
 return <div className={s.stack} aria-busy={pending}>
  <label className={s.field}>{searchLabel||t(locale,'searchDocuments')}<input type="search" value={query} maxLength={180} disabled={disabled} onChange={event=>search(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();void load({page:1,q:query});}}}/></label>
  <label className={s.field}>{label||e(locale,'document')} · {t(locale,required?'required':'optional')}<select value={value} required={required} disabled={disabled||pending} onChange={event=>onChange(event.target.value,options.find(file=>file.id===event.target.value)||null)}><option value="">{e(locale,'noDocument')}</option>{unavailable?<option value={value} disabled>{unavailableText}</option>:null}{options.map(file=><option key={file.id} value={file.id}>{file.filename} · {file.revision}{file.archived?' · '+t(locale,'archivedDocument'):''}</option>)}</select></label>
  {value?<p className={s.notice} role={unavailable?'alert':undefined}>{selected?<><strong>{selectedLabel}: </strong>{selected.filename}{selected.archived?' · '+t(locale,'archivedDocument'):''}</>:unavailableText}</p>:null}
  <div className={s.inlineActions}><button type="button" className={`${s.button} ${s.secondary}`} disabled={disabled||pending||result.page<=1} onClick={()=>{void load({page:result.page-1,q:query});}}>{t(locale,'previous')}</button><span role="status">{pending?t(locale,'loading'):t(locale,'documentResults',{count:result.total,page:result.page,pages})}</span><button type="button" className={`${s.button} ${s.secondary}`} disabled={disabled||pending||result.page>=pages} onClick={()=>{void load({page:result.page+1,q:query});}}>{t(locale,'next')}</button></div>
  {error?<div className={s.notice} role="alert"><p>{errorText(locale,error.code)}</p><button type="button" className={`${s.button} ${s.secondary}`} disabled={disabled||pending} onClick={()=>{void load(lastRequest.current);}}>{t(locale,'retry')}</button></div>:null}
 </div>;
}

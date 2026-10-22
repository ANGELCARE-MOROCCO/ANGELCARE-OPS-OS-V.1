'use client';
import { useEffect,useRef,useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { JobkixFault,type Locale } from '../contracts';
import { studioSelectionResult,type StudioSelectionKind,type StudioSelectionRecord,type StudioSelectionResult } from '../studio-selection';
import { t,errorText } from '../i18n';
import { readResponse } from './commands';
import s from '../jobkix.module.css';
/** Bounded metadata view only. Native commands and current RLS own every effect. */
type PickerProps={locale:Locale;label:string;initial:StudioSelectionResult;selected:string[];multiple?:boolean;name?:string;required?:boolean;emptyLabel?:string;disabled?:boolean;onChange:(ids:string[])=>void}&({kind:StudioSelectionKind;organization?:string;purpose?:'vacancy'|'team';application?:never}|{kind:'panels';application:string;organization?:never;purpose?:never});
export function StudioRecordPicker({locale,kind,organization,purpose,application,label,initial,selected,multiple=false,name,required=false,emptyLabel,disabled=false,onChange}:PickerProps){
 const selectionLimit=kind==='panels'?20:100;
 const [result,setResult]=useState(initial),[query,setQuery]=useState(''),[pending,setPending]=useState(false),[error,setError]=useState<JobkixFault|null>(null),[resolvedIds,setResolvedIds]=useState<string[]>([]);
 const sequence=useRef(0),controller=useRef<AbortController|null>(null),timer=useRef<ReturnType<typeof setTimeout>|null>(null),lastRequest=useRef({page:1,q:''});
 useEffect(()=>()=>{sequence.current++;controller.current?.abort();if(timer.current)clearTimeout(timer.current);},[]);
 async function load(request:{page:number;q:string}){
  if(timer.current)clearTimeout(timer.current);controller.current?.abort();const token=++sequence.current,abort=new AbortController();controller.current=abort;lastRequest.current=request;setPending(true);setError(null);
  const params=new URLSearchParams({kind,page:String(request.page),q:request.q});if(organization)params.set('organization',organization);if(purpose)params.set('purpose',purpose);if(application)params.set('application',application);for(const id of selected.slice(0,selectionLimit))params.append('selected',id);
  try{const response=await readResponse(await fetch('/api/jobkix/lookups?'+params,{cache:'no-store',signal:abort.signal})),next=studioSelectionResult(response.result);if(sequence.current===token&&!abort.signal.aborted){setResult(next);setResolvedIds(selected);}}
  catch(error){if(sequence.current===token&&!abort.signal.aborted)setError(error instanceof JobkixFault?error:new JobkixFault('DEPENDENCY_UNAVAILABLE'));}
  finally{if(sequence.current===token&&!abort.signal.aborted)setPending(false);}
 }
 function search(next:string){setQuery(next);if(timer.current)clearTimeout(timer.current);controller.current?.abort();sequence.current++;setPending(true);timer.current=setTimeout(()=>{void load({page:1,q:next});},250);}
 const known=[...result.items,...result.selected,...initial.selected.filter(row=>!resolvedIds.includes(row.id))],rows:StudioSelectionRecord[]=[...result.items];
 for(const id of selected)if(!rows.some(row=>row.id===id))rows.push(known.find(row=>row.id===id)||{id,label:t(locale,'selectionUnavailable'),available:false});
 const pages=Math.max(1,Math.ceil(result.total/result.pageSize));
 return <fieldset className={s.profileEntry} disabled={disabled} aria-busy={pending}><legend>{label}</legend>
  <label className={s.field}>{t(locale,'lookupSearch',{label})}<input type="search" value={query} maxLength={180} onChange={event=>search(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();void load({page:1,q:query});}}}/></label>
  {multiple?<><p>{t(locale,'lookupSelected',{count:selected.length})}</p><div className={s.stack} style={{maxHeight:320,overflowY:'auto',paddingBlock:8}}>{rows.map(row=><label className={s.checkbox} style={{minHeight:44,marginBlock:0}} key={row.id}><input type="checkbox" checked={selected.includes(row.id)} disabled={pending||!row.available&&!selected.includes(row.id)||selected.length>=selectionLimit&&!selected.includes(row.id)} onChange={event=>onChange(event.target.checked?[...selected,row.id]:selected.filter(id=>id!==row.id))}/><span>{row.label}{!row.available?' · '+t(locale,'selectionUnavailable'):''}</span></label>)}</div>{selected.length>=selectionLimit?<p className={s.notice}>{t(locale,'selectionLimit',{count:selectionLimit})}</p>:null}</>:<label className={s.field}>{label}<select name={name} value={selected[0]||''} required={required} disabled={pending} onChange={event=>onChange(event.target.value?[event.target.value]:[])}><option value="">{emptyLabel||t(locale,'any')}</option>{rows.map(row=><option key={row.id} value={row.id} disabled={!row.available}>{row.label}{!row.available?' · '+t(locale,'selectionUnavailable'):''}</option>)}</select></label>}
  <div className={s.inlineActions}><button type="button" className={`${s.button} ${s.secondary}`} disabled={pending||result.page<=1} onClick={()=>{void load({page:result.page-1,q:query});}}>{t(locale,'previous')}</button><span role="status">{pending?t(locale,'loading'):t(locale,'lookupResults',{count:result.total,page:result.page,pages})}</span><button type="button" className={`${s.button} ${s.secondary}`} disabled={pending||result.page>=pages} onClick={()=>{void load({page:result.page+1,q:query});}}>{t(locale,'next')}</button></div>
  {error?<div className={s.notice} role="alert"><p>{errorText(locale,error.code)} {t(locale,'inputPreserved')}</p><button type="button" className={`${s.button} ${s.secondary}`} disabled={pending} onClick={()=>{void load(lastRequest.current);}}>{t(locale,'retry')}</button></div>:null}
 </fieldset>;
}
export function StudioFormSelection({value,...props}:Omit<Extract<PickerProps,{kind:StudioSelectionKind}>,'selected'|'onChange'|'multiple'>&{value:string}){
 const [selected,setSelected]=useState(value?[value]:[]),current=[...props.initial.items,...props.initial.selected].find(row=>row.id===value);
 return <details className={`${s.filterDisclosure} ${s.studioRecordDisclosure}`}><summary className={s.studioRecordSummary}><span>{props.label}{current?' · '+current.label:''}</span><ChevronDown size={18} aria-hidden="true"/></summary><StudioRecordPicker {...props} selected={selected} onChange={setSelected}/></details>;
}

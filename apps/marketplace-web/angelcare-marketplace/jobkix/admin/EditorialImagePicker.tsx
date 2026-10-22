'use client';
import { useEffect,useRef,useState } from 'react';
import { Button } from '../../design-system/ui';
import ui from '../../design-system/marketplace.module.css';
import { a,type AdminLocale } from '../admin-copy';
import { t,errorText } from '../i18n';
import { editorialMedia,type EditorialMedia } from '../editorial-media';
import { EDITORIAL_SCENES } from '../editorial-assets';
import { SETTING_NAMES } from '../taxonomy-copy';
import { settingExists } from '../taxonomy';
import { str } from '../components/Public';
import { object } from '../validation';
import type { DataRow } from '../server/repository';
import { JobkixFault,type FaultCode } from '../contracts';
import { readResponse } from '../client/commands';
export function EditorialImagePicker({locale,value,onChange,nativeOnly=false}:{locale:AdminLocale;value:EditorialMedia|null;onChange:(value:EditorialMedia|null)=>void;nativeOnly?:boolean}){
 const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[retry,setRetry]=useState(0),[assets,setAssets]=useState<DataRow[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState<FaultCode|null>(null),generation=useRef(0);
 useEffect(()=>{if(!open)return;const abort=new AbortController(),current=++generation.current;const timer=window.setTimeout(async()=>{setBusy(true);setError(null);try{const response=await readResponse(await fetch('/api/jobkix/admin/media?q='+encodeURIComponent(query),{cache:'no-store',signal:abort.signal}));if(!Array.isArray(response.result))throw new JobkixFault('DEPENDENCY_UNAVAILABLE');if(current===generation.current)setAssets(response.result.map(object));}catch(error){if(!abort.signal.aborted&&current===generation.current)setError(error instanceof JobkixFault?error.code:'DEPENDENCY_UNAVAILABLE');}finally{if(current===generation.current)setBusy(false);}},200);return ()=>{abort.abort();window.clearTimeout(timer);generation.current++;};},[open,query,retry]);
 function choose(source:'native'|'editorial',id:string){onChange({source,id,alt:value?.alt||'',desktopFocal:value?.desktopFocal||{x:50,y:45},mobileFocal:value?.mobileFocal||{x:50,y:45}});setOpen(false);}
 function update(patch:Partial<EditorialMedia>){if(value)onChange({...value,...patch});}
 return <div className={ui.stack}><div className={ui.toolbar}><Button type="button" variant="secondary" onClick={()=>setOpen(current=>!current)} aria-expanded={open}>{a(locale,'nativeImages')}</Button>{value?<Button type="button" variant="secondary" onClick={()=>onChange(null)}>{a(locale,'removeImage')}</Button>:null}</div>
  {!nativeOnly?<label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'editorialScene')}</span><select className={ui.selectField} value={value?.source==='editorial'?value.id:''} onChange={event=>{if(event.target.value)choose('editorial',event.target.value);}}><option value="">{t(locale,'any')}</option>{EDITORIAL_SCENES.map(id=>{const key=id.replace(/^setting-/,'');return <option key={id} value={id}>{settingExists(key)?SETTING_NAMES[key][locale]:t(locale,id==='home-hero'?'heroEyebrow':'findJobs')}</option>;})}</select></label>:null}
  {open?<div className={ui.stack}><label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'searchImages')}</span><input className={ui.textField} type="search" value={query} maxLength={120} onChange={event=>setQuery(event.target.value)}/></label>{busy?<p role="status">{t(locale,'loading')}</p>:null}{error?<div role="alert"><p>{errorText(locale,error)}</p><Button type="button" variant="secondary" onClick={()=>setRetry(current=>current+1)}>{t(locale,'retry')}</Button></div>:null}<div className={ui.formGrid} aria-busy={busy}>{assets.map(asset=><Button type="button" variant="secondary" key={str(asset,'id')} onClick={()=>choose('native',str(asset,'id'))}><span><img src={str(asset,'url')} alt="" width={160} height={100} style={{objectFit:'contain',maxWidth:'100%'}}/><span>{str(asset,'name')}</span><small>{str(asset,'rights')}</small></span></Button>)}</div>{!busy&&!error&&!assets.length?<p>{a(locale,'noRecords')}</p>:null}</div>:null}
  {value?<><p className={ui.fieldHelp}>{value.source} · {value.id}</p><label className={ui.fieldGroup}><span className={ui.fieldLabel}>{a(locale,'imageDescription')}</span><input className={ui.textField} value={value.alt} onChange={event=>update({alt:event.target.value})} maxLength={500} required/></label><div className={ui.formGrid}>{(['desktopFocal','mobileFocal'] as const).map(view=><fieldset key={view}><legend>{a(locale,view)}</legend>{(['x','y'] as const).map(axis=><label className={ui.fieldGroup} key={axis}><span className={ui.fieldLabel}>{axis.toUpperCase()} %</span><input className={ui.textField} type="number" min={0} max={100} step={1} required value={value[view][axis]} onChange={event=>update({[view]:{...value[view],[axis]:Number(event.target.value)}})}/></label>)}</fieldset>)}</div><p className={ui.fieldHelp}>{a(locale,'imageRightsHelp')}</p></>:null}
 </div>;
}
export function storedMedia(value:unknown):EditorialMedia|null{try{return editorialMedia(value);}catch{return null;}}

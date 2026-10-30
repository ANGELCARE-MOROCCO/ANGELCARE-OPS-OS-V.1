'use client';
import { useEffect,useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bookmark,Share2 } from 'lucide-react';
import type { Locale,FaultCode } from '../contracts';
import { href } from '../routes';
import { t,errorText } from '../i18n';
import { e } from '../experience-copy';
import { useCommand } from './commands';
import { resourceText as r } from '../resource-copy';
import s from '../jobkix.module.css';
export function JobActions({locale,id,initialSaved=false,initialVersion=0,initialCollection='default',initialError=null,external=false}:{locale:Locale;id:string;initialSaved?:boolean;initialVersion?:number;initialCollection?:string;initialError?:FaultCode|null;external?:boolean}){
 const router=useRouter(),command=useCommand(),[saved,setSaved]=useState(initialSaved),[version,setVersion]=useState(initialVersion),[copied,setCopied]=useState(false),[manualLink,setManualLink]=useState('');
 useEffect(()=>{setSaved(initialSaved);setVersion(initialVersion);},[initialSaved,initialVersion]);
 async function share(){const url=new URL(href(locale,'jobs/'+id),location.origin).href;try{if(navigator.share)await navigator.share({title:'JOBKIX',url});else{await navigator.clipboard.writeText(url);setCopied(true);}}catch(error){if(!(error instanceof DOMException&&error.name==='AbortError'))setManualLink(url);}}
 async function save(){const result=await command.run(external?(saved?'external.saved.remove':'external.saved.save'):(saved?'saved.remove':'saved.save'),{vacancyId:id,collection:initialCollection},version);if(result&&typeof result.version==='number'){setSaved(value=>!value);setVersion(result.version);}}
 return <div><div className={s.inlineActions}><button className={`${s.button} ${s.secondary}`} onClick={save} disabled={command.pending||Boolean(initialError)} aria-pressed={saved}><Bookmark size={17} aria-hidden="true"/>{saved?r(locale,'remove'):t(locale,'saveJob')}</button><button className={`${s.button} ${s.quiet}`} onClick={share}><Share2 size={17} aria-hidden="true"/>{t(locale,'share')}</button><Link className={s.textLink} href={href(locale,'report',new URLSearchParams(external?{url:href(locale,'jobs/'+id)}:{vacancy:id}))}>{t(locale,'report')}</Link></div>
 {copied?<p role="status" className={s.notice}>{e(locale,'copied')}</p>:null}{manualLink?<label className={s.field}>{t(locale,'share')}<input readOnly value={manualLink} onFocus={event=>event.currentTarget.select()}/></label>:null}
 {command.error||initialError?<div className={s.notice} role="alert">{errorText(locale,command.error?.code||initialError||'DEPENDENCY_UNAVAILABLE')}<button className={`${s.button} ${s.secondary}`} type="button" onClick={()=>router.refresh()}>{t(locale,'retry')}</button>{command.error?.code==='AUTHENTICATION_REQUIRED'?<Link className={s.textLink} href={href(locale,'candidate/sign-in',new URLSearchParams({next:href(locale,'jobs/'+id)}))}>{t(locale,'signIn')}</Link>:null}</div>:null}</div>;
}

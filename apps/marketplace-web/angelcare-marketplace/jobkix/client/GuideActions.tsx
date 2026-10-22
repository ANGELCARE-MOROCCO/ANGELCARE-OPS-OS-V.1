'use client';
import { useEffect,useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bookmark,Share2 } from 'lucide-react';
import type { FaultCode,Locale } from '../contracts';
import { href } from '../routes';
import { t,errorText } from '../i18n';
import { resourceText as r } from '../resource-copy';
import { useCommand } from './commands';
import s from '../jobkix.module.css';
export function GuideActions({locale,documentId,slug,initialSaved,initialVersion,authenticated,fault}:{locale:Locale;documentId:string;slug:string;initialSaved:boolean;initialVersion:number;authenticated:boolean;fault:FaultCode|null}){
 const router=useRouter(),command=useCommand(),[saved,setSaved]=useState(initialSaved),[version,setVersion]=useState(initialVersion),[copied,setCopied]=useState(false),[shareError,setShareError]=useState(false);
 useEffect(()=>{setSaved(initialSaved);setVersion(initialVersion);},[initialSaved,initialVersion]);
 async function toggle(){const result=await command.run('resource.save',{documentId,locale,saved:!saved,collection:'default'},version);if(result&&typeof result.saved==='boolean'&&typeof result.version==='number'){setSaved(result.saved);setVersion(result.version);}}
 async function share(){setShareError(false);setCopied(false);const url=new URL(href(locale,'resources/'+slug),window.location.origin).href;try{if(navigator.share)await navigator.share({url});else{await navigator.clipboard.writeText(url);setCopied(true);}}catch(error){if(!(error instanceof DOMException&&error.name==='AbortError'))setShareError(true);}}
 return <><div className={s.inlineActions}>{authenticated?<button className={s.button} type="button" disabled={command.pending||Boolean(fault)} onClick={toggle} aria-pressed={saved}><Bookmark size={17} aria-hidden="true"/>{command.pending?t(locale,'saving'):r(locale,saved?'removeSaved':'saveLater')}</button>:<Link className={s.button} href={href(locale,'candidate/sign-in',new URLSearchParams({next:href(locale,'resources/'+slug)}))}><Bookmark size={17} aria-hidden="true"/>{r(locale,'saveLater')}</Link>}<button className={`${s.button} ${s.secondary}`} type="button" onClick={share}><Share2 size={17} aria-hidden="true"/>{r(locale,'share')}</button></div>{saved?<p className={s.metadataLine} role="status">{r(locale,'saved')}</p>:null}{copied?<p className={s.metadataLine} role="status">{r(locale,'copied')}</p>:null}{shareError||fault||command.error?<div className={s.notice} role="alert"><p>{errorText(locale,command.error?.code||fault||'DEPENDENCY_UNAVAILABLE')}</p><button className={`${s.button} ${s.secondary}`} type="button" onClick={()=>router.refresh()}>{t(locale,'retry')}</button></div>:null}</>;
}

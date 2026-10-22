'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Bookmark,Share2 } from 'lucide-react';
import type { Locale,FaultCode } from '../contracts';
import { href } from '../routes';
import { em } from '../employer-copy';
import { t,errorText } from '../i18n';
import { resourceText as r } from '../resource-copy';
import { useCommand } from './commands';
import s from '../jobkix.module.css';
export function EmployerActions({locale,id,authenticated,initialSaved,fault}:{locale:Locale;id:string;authenticated:boolean;initialSaved:boolean;fault:FaultCode|null}){
 const command=useCommand(),[saved,setSaved]=useState(initialSaved),[copied,setCopied]=useState(false),[shareError,setShareError]=useState(false),destination=href(locale,'employers/'+id);
 async function save(){if(await command.run('employer.search.save',{organizationId:id}))setSaved(true);}
 async function share(){setShareError(false);setCopied(false);const url=new URL(destination,window.location.origin).href;try{if(navigator.share)await navigator.share({url});else{await navigator.clipboard.writeText(url);setCopied(true);}}catch(error){if(!(error instanceof DOMException&&error.name==='AbortError'))setShareError(true);}}
 return <><div className={s.inlineActions}>{saved?<Link className={s.button} href={href(locale,'career/alerts')}>{em(locale,'manage')}</Link>:authenticated?<button className={s.button} type="button" disabled={command.pending||Boolean(fault)} onClick={save}><Bookmark size={17} aria-hidden="true"/>{command.pending?t(locale,'saving'):em(locale,'save')}</button>:<Link className={s.button} href={href(locale,'candidate/sign-in',new URLSearchParams({next:destination}))}><Bookmark size={17} aria-hidden="true"/>{em(locale,'save')}</Link>}<button className={`${s.button} ${s.secondary}`} type="button" onClick={share}><Share2 size={17} aria-hidden="true"/>{em(locale,'share')}</button><Link className={s.textLink} href={href(locale,'report',new URLSearchParams({url:destination,category:'employer'}))}>{t(locale,'report')}</Link></div>{saved||copied?<p className={s.notice} role="status">{copied?r(locale,'copied'):t(locale,'saved')}</p>:null}{fault||command.error||shareError?<p className={s.notice} role="alert">{errorText(locale,command.error?.code||fault||'DEPENDENCY_UNAVAILABLE')}</p>:null}</>;
}

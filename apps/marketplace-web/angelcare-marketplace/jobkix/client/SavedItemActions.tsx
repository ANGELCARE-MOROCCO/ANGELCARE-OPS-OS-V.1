'use client';
import { CommandForm } from './CommandForm';
import { useEffect,useState,type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from '../contracts';
import { t,errorText } from '../i18n';
import { resourceText as r } from '../resource-copy';
import { useCommand } from './commands';
import s from '../jobkix.module.css';
export function SavedItemActions({locale,kind,id,initialVersion,initialCollection,available}:{locale:Locale;kind:'job'|'resource';id:string;initialVersion:number;initialCollection:string;available:boolean}){
 const router=useRouter(),command=useCommand(),[version,setVersion]=useState(initialVersion),[collection,setCollection]=useState(initialCollection==='default'?'':initialCollection),[removed,setRemoved]=useState(false),[saved,setSaved]=useState(false);
 useEffect(()=>{setVersion(initialVersion);setCollection(initialCollection==='default'?'':initialCollection);setRemoved(false);},[initialVersion,initialCollection]);
 async function act(remove:boolean){const desired=collection.trim()||'default';const result=await command.run(kind==='job'?(remove?'saved.remove':'saved.save'):'resource.save',kind==='job'?{vacancyId:id,collection:desired}:{documentId:id,locale,saved:!remove,collection:desired},version);if(result){if(typeof result.version==='number')setVersion(result.version);setRemoved(remove);setSaved(!remove);router.refresh();}}
 function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();act(false);}
 if(removed)return <p className={s.notice} role="status">{r(locale,'removed')}</p>;
 return <CommandForm locale={locale} onSubmit={submit} className={s.savedItemControls}><label className={s.field}>{r(locale,'collection')}<input value={collection} maxLength={180} placeholder={r(locale,'defaultCollection')} onChange={event=>{setCollection(event.target.value);setSaved(false);}}/></label><div className={s.inlineActions}><button type="submit" className={`${s.button} ${s.secondary}`} disabled={command.pending||kind==='resource'&&!available}>{t(locale,command.pending?'saving':'save')}</button><button type="button" className={`${s.button} ${s.quiet}`} disabled={command.pending} onClick={()=>act(true)}>{r(locale,'remove')}</button></div>{saved?<p role="status">{t(locale,'saved')}</p>:null}{command.error?<div className={s.notice} role="alert"><p>{errorText(locale,command.error.code)}</p><button className={`${s.button} ${s.secondary}`} type="button" onClick={()=>router.refresh()}>{t(locale,'retry')}</button></div>:null}</CommandForm>;
}

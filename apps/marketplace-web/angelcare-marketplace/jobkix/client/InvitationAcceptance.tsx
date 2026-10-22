'use client';
import { CommandForm } from './CommandForm';
import Link from 'next/link';
import { useState,type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from '../contracts';
import type { DataRow } from '../server/repository';
import { object } from '../validation';
import { str } from '../components/Public';
import { w } from '../workforce-copy';
import { ac } from '../account-copy';
import { operationLabel } from '../operations-copy';
import { t,errorText,formatDate } from '../i18n';
import { href } from '../routes';
import { useCommand } from './commands';
import s from '../jobkix.module.css';
export function InvitationAcceptance({locale,record,token,timezone}:{locale:Locale;record:DataRow;token:string;timezone:string}){
 const command=useCommand(),router=useRouter(),[confirmed,setConfirmed]=useState(false),[accepted,setAccepted]=useState(record.state==='accepted'),destination=href(locale,'hiring',new URLSearchParams({organization:str(record,'organizationId')}));
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!confirmed)return;const result=await command.run('team.accept',{id:record.id,token});if(result){setAccepted(true);router.replace(destination);router.refresh();}}
 return <section className={s.authCard}><h1>{w(locale,'invitationAccept')}</h1>{accepted?<div role="status"><p>{w(locale,'invitationAccepted')}</p><Link className={s.button} href={destination}>{t(locale,'hiringStudio')}</Link></div>:<><h2>{str(record,'organizationName')}</h2><p>{operationLabel(locale,str(record,'role'))}</p><p>{w(locale,'invitationHelp')}</p><p className={s.notice}>{w(locale,'teamHelp')}</p>{(['sites','vacancies'] as const).map(key=><section key={key}><h3>{w(locale,key)}</h3><ul>{Array.isArray(record[key])?record[key].map((value,index)=>{const row=object(value);return <li key={index}>{str(row,'label')||str(row,'title')}</li>;}):null}</ul></section>)}<time dateTime={str(record,'expiresAt')}>{formatDate(str(record,'expiresAt'),locale,timezone)}</time><CommandForm locale={locale} onSubmit={submit}><label className={s.checkbox}><input type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)} required disabled={command.pending}/><span>{ac(locale,'confirm')}</span></label><button className={s.button} type="submit" disabled={command.pending||!confirmed}>{command.pending?t(locale,'saving'):w(locale,'invitationAccept')}</button>{command.error?<p className={s.notice} role="alert">{errorText(locale,command.error.code)} {t(locale,'inputPreserved')}</p>:null}</CommandForm></>}</section>;
}

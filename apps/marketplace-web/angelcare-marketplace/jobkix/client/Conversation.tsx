'use client';
import { CommandForm } from './CommandForm';
import { useRef,useState,type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale } from '../contracts';
import type { DataRow } from '../server/repository';
import { str,number } from '../components/Public';
import { st } from '../studio-copy';
import { h } from '../hiring-copy';
import { t,errorText,formatDate,LANGUAGE_NAMES } from '../i18n';
import { LOCALES,isLocale } from '../contracts';
import { useCommand } from './commands';
import s from '../jobkix.module.css';
export function Conversation({locale,applicationId,messages,timezone,draft,readOnly=false}:{locale:Locale;applicationId:string;messages:DataRow[];timezone:string;draft:DataRow|null;readOnly?:boolean}){
 const router=useRouter(),command=useCommand(),draftVersion=useRef(number(draft||{},'version')||0),busy=useRef(false);
 const draftBody=draft?.body&&typeof draft.body==='object'&&!Array.isArray(draft.body)?Object.fromEntries(Object.entries(draft.body)):{};
 const messageKey=useRef(typeof draftBody.messageKey==='string'&&/^[a-f0-9-]{36}$/.test(draftBody.messageKey)?draftBody.messageKey:null);
 const [body,setBody]=useState(typeof draftBody.body==='string'?draftBody.body:''),[originalLocale,setOriginalLocale]=useState(isLocale(typeof draftBody.locale==='string'?draftBody.locale:'')?String(draftBody.locale):locale),[recorded,setRecorded]=useState(false),[processing,setProcessing]=useState(false),[recover,setRecover]=useState(draftBody.pending===true&&Boolean(messageKey.current));
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();if(busy.current||readOnly)return;busy.current=true;setProcessing(true);setRecorded(false);try{
  const native=event.nativeEvent,button=native instanceof SubmitEvent?native.submitter:null,draftOnly=button instanceof HTMLButtonElement&&button.value==='draft';
  if(!draftOnly&&!messageKey.current)messageKey.current=crypto.randomUUID();
  const draftResult=await command.run('draft.save',{kind:'message',key:applicationId,body:{body,locale:originalLocale,messageKey:messageKey.current,pending:!draftOnly}},draftVersion.current);if(!draftResult||typeof draftResult.version!=='number')return;draftVersion.current=draftResult.version;if(draftOnly)return;setRecover(true);
  const result=await command.run('message.send',{applicationId,body,locale:originalLocale,attachmentId:null},0,messageKey.current||undefined);if(result){setBody('');setRecorded(true);setRecover(false);messageKey.current=null;const cleared=await command.run('draft.remove',{kind:'message',key:applicationId},draftVersion.current);if(cleared)draftVersion.current=0;router.refresh();}
 }finally{busy.current=false;setProcessing(false);}}
 return <section className={s.panel}><h2>{st(locale,'messages')}</h2><div className={s.messageList}>{messages.map(message=><article key={str(message,'id')} className={`${s.message} ${message.fromMe?s.messageOwn:''}`}><p className={s.authoredText} lang={str(message,'originalLocale')}>{str(message,'body')}</p><small><time dateTime={str(message,'createdAt')}>{formatDate(str(message,'createdAt'),locale,timezone)}</time> · <bdi>{str(message,'originalLocale')}</bdi></small>{message.attachmentId?<a className={s.textLink} href={'/api/jobkix/files/'+str(message,'attachmentId')} download>{st(locale,'download')}</a>:null}</article>)}</div>{!messages.length?<p>{st(locale,'noActivity')}</p>:null}
  {readOnly?<p className={s.notice}>{errorText(locale,'FORBIDDEN')}</p>:<CommandForm locale={locale} onSubmit={submit}>{recover?<p className={s.notice}>{h(locale,'recoverHelp')}</p>:null}<fieldset className={s.vacancyEditorFields} disabled={processing||recover}><label className={s.field}>{st(locale,'message')}<textarea required value={body} onChange={event=>{setBody(event.target.value);setRecorded(false);}} maxLength={12000}/></label><label className={s.field}>{t(locale,'language')}<select value={originalLocale} onChange={event=>setOriginalLocale(event.target.value)}>{LOCALES.map(language=><option key={language} value={language}>{LANGUAGE_NAMES[language]}</option>)}</select></label></fieldset><div className={s.inlineActions}><button type="submit" className={s.button} value="send" disabled={processing}>{processing?t(locale,'saving'):recover?h(locale,'resume'):st(locale,'send')}</button>{!recover?<button type="submit" className={`${s.button} ${s.secondary}`} value="draft" formNoValidate disabled={processing}>{st(locale,'draft')}</button>:null}<button type="button" className={`${s.button} ${s.quiet}`} disabled={processing} onClick={()=>router.refresh()}>{t(locale,'retry')}</button></div>{recorded?<p className={s.notice} role="status">{t(locale,'saved')}</p>:null}{command.error?<p className={s.notice} role="alert">{errorText(locale,command.error.code)} {t(locale,'inputPreserved')}</p>:null}</CommandForm>}
 </section>;
}

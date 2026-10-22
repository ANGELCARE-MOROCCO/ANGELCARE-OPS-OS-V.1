'use client';
import { CommandForm } from './CommandForm';
import Link from 'next/link';
import { useRef,useState,type FormEvent } from 'react';
import type { Locale } from '../contracts';
import type { DataRow } from '../server/repository';
import { str,number } from '../components/Public';
import { object } from '../validation';
import { APPLICATION_CONSENT_REVISION } from '../domain';
import { href } from '../routes';
import { t,errorText } from '../i18n';
import { e } from '../experience-copy';
import { useCommand } from './commands';
import { DocumentPicker } from './DocumentPicker';
import type { DocumentSelectionResult } from '../document-selection';
import s from '../jobkix.module.css';
const stringList=(value:unknown)=>Array.isArray(value)?value.filter((item):item is string=>typeof item==='string').join(' · '):'';
export function ApplicationWizard({locale,job,profile,documents,draft}:{locale:Locale;job:DataRow;profile:DataRow;documents:DocumentSelectionResult;draft:DataRow|null}){
 const body=draft?.body&&typeof draft.body==='object'&&!Array.isArray(draft.body)?object(draft.body):{};
 const initialAnswers=body.answers&&typeof body.answers==='object'&&!Array.isArray(body.answers)?Object.fromEntries(Object.entries(body.answers).filter((item):item is [string,string]=>typeof item[1]==='string')):{};
 const [answers,setAnswers]=useState(initialAnswers),[documentId,setDocumentId]=useState(typeof body.documentId==='string'?body.documentId:''),[review,setReview]=useState(false),[consent,setConsent]=useState(false),[saved,setSaved]=useState(false),[receipt,setReceipt]=useState<DataRow|null>(null);
 const [selectedDocument,setSelectedDocument]=useState(documents.selected);
 const draftVersion=useRef(number(draft||{},'version')||0),submissionKey=useRef(typeof body.submissionKey==='string'&&/^[a-f0-9-]{36}$/.test(body.submissionKey)?body.submissionKey:null),busy=useRef(false);
 const command=useCommand(),id=str(job,'id'),questions=Array.isArray(job.questions)?job.questions.map(object):[];
 async function saveDraft(){if(!submissionKey.current)submissionKey.current=crypto.randomUUID();const result=await command.run('draft.save',{kind:'application',key:id,body:{answers,documentId,submissionKey:submissionKey.current}},draftVersion.current);if(result&&typeof result.version==='number'){draftVersion.current=result.version;setSaved(true);return true;}return false;}
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();if(busy.current)return;busy.current=true;try{if(!await saveDraft())return;const result=await command.run('application.submit',{vacancyId:id,vacancyVersion:number(job,'version'),profileVersion:number(profile,'version'),documentId:documentId||null,answers,sharingConsent:consent,consentRevision:APPLICATION_CONSENT_REVISION},0,submissionKey.current||undefined);if(result)setReceipt(result);}finally{busy.current=false;}}
 if(receipt)return <section className={s.panel} role="status"><h2>{e(locale,'sent')}</h2><p>{t(locale,'receipt',{reference:str(receipt,'receipt')})}</p><Link className={s.button} href={href(locale,'career/applications/'+str(receipt,'id'))}>{t(locale,'careerStudio')}</Link></section>;
 return <section className={s.panel} aria-labelledby="jobkix-application-title"><span className={s.eyebrow}>JOBKIX · {t(locale,'candidate')}</span><h2 id="jobkix-application-title">{e(locale,'applicationTitle')}</h2><p>{str(job,'title')} · {str(job,'employerName')}</p><p className={s.notice}>{e(locale,'snapshotNotice')}</p>
  <nav className={s.inlineActions} aria-label={t(locale,'apply')}><button className={`${s.button} ${s.secondary}`} aria-current={!review?'step':undefined} onClick={()=>setReview(false)}>{e(locale,'answers')}</button><span>{e(locale,'review')}</span></nav>
  <CommandForm locale={locale} onSubmit={review?submit:event=>{event.preventDefault();setReview(true);setConsent(false);}}>
   {!review?<><div className={s.notice}><strong>{str(profile,'display_name')}</strong><p>{str(profile,'headline')}</p><Link className={s.textLink} href={href(locale,'career/passport',new URLSearchParams({next:href(locale,'jobs/'+id,new URLSearchParams({apply:'1'}))}))}>{e(locale,'editProfile')}</Link></div>
    {questions.map(question=><label className={s.field} key={str(question,'id')}>{str(question,'label')} · {t(locale,question.required===true?'required':'optional')}{question.kind==='yes_no'?<select required={question.required===true} value={answers[str(question,'id')]||''} onChange={event=>{setAnswers({...answers,[str(question,'id')]:event.target.value});setSaved(false);}}><option value="">{t(locale,'any')}</option><option value="yes">{t(locale,'yes')}</option><option value="no">{t(locale,'no')}</option></select>:<textarea required={question.required===true} maxLength={number(question,'maxLength')||10000} value={answers[str(question,'id')]||''} onChange={event=>{setAnswers({...answers,[str(question,'id')]:event.target.value});setSaved(false);}}/>}</label>)}
    <DocumentPicker locale={locale} initial={documents} value={documentId} selected={selectedDocument} required={job.requiredDocument===true} disabled={command.pending} onChange={(id,file)=>{setDocumentId(id);setSelectedDocument(file);setSaved(false);}} onResolve={setSelectedDocument}/><Link className={s.textLink} href={href(locale,'career/cv',new URLSearchParams({next:href(locale,'jobs/'+id,new URLSearchParams({apply:'1'}))}))}>{e(locale,'document')}</Link>
   </>:<><h3>{e(locale,'review')}</h3><div className={s.notice}><strong>{str(profile,'display_name')}</strong><p>{str(profile,'headline')}</p><p>{str(profile,'summary')}</p><p>{stringList(profile.skills)}</p><p>{stringList(profile.occupations)}</p><p>{stringList(profile.languages)}</p><p>{str(profile,'country')}</p>{(['experience','education'] as const).map(key=>Array.isArray(profile[key])?profile[key].map((entry,index)=>{if(!entry||typeof entry!=='object'||Array.isArray(entry))return null;const row=object(entry);return <p key={key+index}>{['title','organization','institution','qualification','start','end','description'].map(key=>str(row,key)).filter(Boolean).join(' · ')}</p>;}):null)}</div>
    <dl>{questions.map(question=><div key={str(question,'id')}><dt>{str(question,'label')}</dt><dd className={s.authoredText}>{question.kind==='yes_no'&&['yes','no'].includes(answers[str(question,'id')])?t(locale,answers[str(question,'id')]==='yes'?'yes':'no'):answers[str(question,'id')]||'—'}</dd></div>)}</dl><p><strong>{e(locale,'document')}: </strong>{selectedDocument?.filename||e(locale,'noDocument')}</p>
    <label className={s.checkbox}><input type="checkbox" checked={consent} required onChange={event=>setConsent(event.target.checked)}/><span>{t(locale,'applicationConsent')}</span></label>
   </>}
   <div className={s.inlineActions}><button className={s.button} type="submit" disabled={command.pending||Boolean(documentId&&!selectedDocument)}>{command.pending?t(locale,'saving'):review?t(locale,'submit'):e(locale,'review')}</button><button className={`${s.button} ${s.secondary}`} type="button" onClick={saveDraft} disabled={command.pending}>{t(locale,'save')}</button>{review?<button type="button" className={`${s.button} ${s.quiet}`} onClick={()=>setReview(false)}>{e(locale,'edit')}</button>:null}</div>
   {saved?<p className={s.notice} role="status">{e(locale,'draftSaved')}</p>:null}{command.error?<div className={s.notice} role="alert"><p>{errorText(locale,command.error.code)}</p>{command.error.code==='VERSION_CONFLICT'?<Link className={s.textLink} href={href(locale,'jobs/'+id,new URLSearchParams({apply:'1'}))}>{t(locale,'retry')}</Link>:null}{command.error.code==='ALREADY_APPLIED'?<Link className={s.textLink} href={href(locale,'career/applications')}>{t(locale,'careerStudio')}</Link>:null}</div>:null}
  </CommandForm>
 </section>;
}

'use client';
import { CommandForm } from './CommandForm';
import { useRef,useState,type FormEvent } from 'react';
import {useJobkixRouter as useRouter} from './useJobkixRouter';
import type { Locale,FaultCode } from '../contracts';
import { LOCALES,isLocale } from '../contracts';
import type { DataRow } from '../server/repository';
import { object } from '../validation';
import { CountryOptions } from '../Country';
import { str,number } from '../components/Public';
import { t,errorText,LANGUAGE_NAMES } from '../i18n';
import { st } from '../studio-copy';
import { h } from '../hiring-copy';
import { href } from '../routes';
import { useCommand } from './commands';
import s from '../jobkix.module.css';
const KINDS=['household','institution','healthcare','hospitality','ngo','public','multi_site'] as const;
interface Fields{kind:string;publicName:string;description:string;country:string;city:string;originalLocale:string;legalName:string;contactEmail:string;contactPhone:string;privateAddress:string}
function restoreFields(data:DataRow,locale:Locale):Fields{return {kind:KINDS.find(kind=>kind===data.kind)||'household',publicName:str(data,'publicName'),description:str(data,'description'),country:str(data,'country'),city:str(data,'city'),originalLocale:isLocale(str(data,'originalLocale'))?str(data,'originalLocale'):locale,legalName:str(data,'legalName'),contactEmail:str(data,'contactEmail'),contactPhone:str(data,'contactPhone'),privateAddress:str(data,'privateAddress')};}
export function OrganizationEditor({locale,organization,privateRecord,draft}:{locale:Locale;organization:DataRow|null;privateRecord:DataRow|null;draft:DataRow|null}){
 const router=useRouter(),command=useCommand(),busy=useRef(false),draftVersion=useRef(number(draft||{},'version')||0),version=useRef(number(organization||{},'version')||0);
 const body=draft?.body&&typeof draft.body==='object'&&!Array.isArray(draft.body)?object(draft.body):{},storedPending=body.pendingCreatePayload&&typeof body.pendingCreatePayload==='object'&&!Array.isArray(body.pendingCreatePayload)?object(body.pendingCreatePayload):null;
 const creationKey=useRef(typeof body.creationKey==='string'?body.creationKey:null),[pendingCreate,setPendingCreate]=useState<DataRow|null>(organization?null:storedPending),[saved,setSaved]=useState(false),[draftSaved,setDraftSaved]=useState(false),[rebase,setRebase]=useState(false),[recordError,setRecordError]=useState<FaultCode|null>(null);
 const [fields,setFields]=useState<Fields>(()=>storedPending&&!organization?restoreFields(storedPending,locale):restoreFields({kind:organization?.kind,publicName:organization?.public_name,description:organization?.public_description,country:organization?.country,city:organization?.city,originalLocale:organization?.original_locale,legalName:privateRecord?.legal_name,contactEmail:privateRecord?.contact_email,contactPhone:privateRecord?.contact_phone,privateAddress:privateRecord?.private_address},locale));
 const draftKey=organization?str(organization,'id'):'new-organization',staleDraft=Boolean(organization&&body.baseVersion!==version.current);
 function set(key:keyof Fields,value:string){setFields(current=>({...current,[key]:value}));setSaved(false);setDraftSaved(false);}
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();if(busy.current)return;busy.current=true;setSaved(false);setRecordError(null);try{
  const submitter=event.nativeEvent instanceof SubmitEvent?event.nativeEvent.submitter:null,draftOnly=submitter instanceof HTMLButtonElement&&submitter.value==='draft';
  if(!creationKey.current)creationKey.current=crypto.randomUUID();
  const payload=organization?{organizationId:str(organization,'id'),...fields}:pendingCreate||{kind:fields.kind,publicName:fields.publicName,country:fields.country,city:fields.city,originalLocale:fields.originalLocale};
  const savedDraft=await command.run('draft.save',{kind:'organization',key:draftKey,body:{fields,baseVersion:version.current,creationKey:creationKey.current,pendingCreatePayload:!organization&&!draftOnly?payload:pendingCreate}},draftVersion.current);
  if(!savedDraft||typeof savedDraft.version!=='number')return;draftVersion.current=savedDraft.version;setDraftSaved(true);if(draftOnly)return;
  if(!organization)setPendingCreate(payload);
  const result=await command.run(organization?'organization.save':'organization.create',payload,version.current,organization?undefined:creationKey.current);
  if(!result){setRecordError(command.lastError.current?.code||'DEPENDENCY_UNAVAILABLE');if(!organization&&command.lastError.current?.code==='INVALID_INPUT'){setPendingCreate(null);await command.run('draft.save',{kind:'organization',key:draftKey,body:{fields,baseVersion:0,creationKey:creationKey.current,pendingCreatePayload:null}},draftVersion.current).then(value=>{if(typeof value?.version==='number')draftVersion.current=value.version;});}return;}
  if(typeof result.version==='number')version.current=result.version;setSaved(true);
  if(!organization&&typeof result.id==='string'){await command.run('draft.remove',{kind:'organization',key:draftKey},draftVersion.current);router.replace(href(locale,'hiring/organization',new URLSearchParams({organization:result.id})));}router.refresh();
 }finally{busy.current=false;}}
 function restore(){if(!body.fields)return;setFields(restoreFields(object(body.fields),locale));setSaved(false);setDraftSaved(false);}
 return <CommandForm locale={locale} className={s.stack} onSubmit={submit}>
  {pendingCreate?<div className={s.notice} role="status">{h(locale,'recoverHelp')}</div>:null}
  {body.fields&&!pendingCreate?<div className={s.notice}>{staleDraft?<label className={s.checkbox}><input type="checkbox" checked={rebase} onChange={event=>setRebase(event.target.checked)}/><span>{h(locale,'rebase')}</span></label>:null}<button className={`${s.button} ${s.secondary}`} type="button" disabled={staleDraft&&!rebase} onClick={restore}>{st(locale,'restoreDraft')}</button></div>:null}
  <section className={s.panel}><h2>{h(locale,'publicIdentity')}</h2><p>{h(locale,'publicPrivacy')}</p><div className={s.formGrid}>
   {!organization?<label className={s.field}>{h(locale,'organizationType')}<select value={fields.kind} onChange={event=>set('kind',event.target.value)} disabled={Boolean(pendingCreate)}>{KINDS.map(kind=><option value={kind} key={kind}>{h(locale,kind)}</option>)}</select></label>:null}
   <label className={s.field}>{h(locale,'publicName')}<input value={fields.publicName} onChange={event=>set('publicName',event.target.value)} required minLength={2} maxLength={180} readOnly={Boolean(pendingCreate)}/></label>
   <label className={s.field}>{t(locale,'country')}<select value={fields.country} onChange={event=>set('country',event.target.value)} required disabled={Boolean(pendingCreate)}><option value="">{t(locale,'country')}</option><CountryOptions locale={locale}/></select></label>
   <label className={s.field}>{t(locale,'city')}<input value={fields.city} onChange={event=>set('city',event.target.value)} maxLength={180} readOnly={Boolean(pendingCreate)}/></label>
   <label className={s.field}>{h(locale,'contentLanguage')}<select value={fields.originalLocale} onChange={event=>set('originalLocale',event.target.value)} disabled={Boolean(pendingCreate)}>{LOCALES.map(language=><option value={language} key={language}>{LANGUAGE_NAMES[language]}</option>)}</select></label>
   {organization?<label className={`${s.field} ${s.fullWidth}`}>{h(locale,'publicDescription')}<textarea value={fields.description} onChange={event=>set('description',event.target.value)} maxLength={24000}/></label>:null}
  </div></section>
  {organization?<section className={s.panel}><h2>{h(locale,'privateIdentity')}</h2><p>{t(locale,'privateByDefault')}</p><div className={s.formGrid}><label className={s.field}>{h(locale,'legalName')}<input value={fields.legalName} onChange={event=>set('legalName',event.target.value)} maxLength={180}/></label><label className={s.field}>{t(locale,'email')}<input type="email" value={fields.contactEmail} onChange={event=>set('contactEmail',event.target.value)} maxLength={320}/></label><label className={s.field}>{h(locale,'phone')}<input type="tel" value={fields.contactPhone} onChange={event=>set('contactPhone',event.target.value)} maxLength={100}/></label><label className={s.field}>{h(locale,'privateAddress')}<textarea value={fields.privateAddress} onChange={event=>set('privateAddress',event.target.value)} maxLength={1500}/></label></div><p className={s.notice}>{h(locale,'approvalHelp')}</p></section>:null}
  <section className={s.panel}><div className={s.inlineActions}><button className={s.button} type="submit" disabled={command.pending}>{command.pending?t(locale,'saving'):organization?t(locale,'save'):h(locale,pendingCreate?'resume':'create')}</button>{!pendingCreate?<button className={`${s.button} ${s.secondary}`} type="submit" value="draft" formNoValidate disabled={command.pending}>{st(locale,'draft')}</button>:null}</div>{saved?<p className={s.notice} role="status">{t(locale,'saved')}</p>:draftSaved?<p className={s.notice} role="status">{st(locale,'draft')}</p>:null}{command.error||recordError?<p className={s.notice} role="alert">{errorText(locale,recordError||command.error?.code||'DEPENDENCY_UNAVAILABLE')} {t(locale,'inputPreserved')}</p>:null}</section>
 </CommandForm>;
}

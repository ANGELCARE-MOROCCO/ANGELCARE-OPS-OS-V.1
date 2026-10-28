'use client';
import { CommandForm } from './CommandForm';
import { useState,type FormEvent } from 'react';
import Link from 'next/link';
import {useJobkixRouter as useRouter} from './useJobkixRouter';
import type { Locale } from '../contracts';
import type { DataRow } from '../server/repository';
import { str,number } from '../components/Public';
import { CountryOptions } from '../Country';
import { t,errorText } from '../i18n';
import { h } from '../hiring-copy';
import { st } from '../studio-copy';
import { href } from '../routes';
import { object } from '../validation';
import { siteIntent,type SiteAction } from '../site-draft';
import { useDurableDraft,type DraftProtocol } from './useDurableDraft';
import s from '../jobkix.module.css';
const protocol:DraftProtocol<SiteAction>={kind:'organization',parse:siteIntent};
type Fields={label:string;country:string;region:string;city:string;timezone:string;active:boolean;baseVersion:number};
function restore(row:DataRow,timezone:string,version:number):Fields{return {label:str(row,'label'),country:str(row,'country'),region:str(row,'region'),city:str(row,'city'),timezone:str(row,'timezone')||timezone,active:row.active!==false,baseVersion:version};}
function SiteForm({locale,organizationId,timezone,site,draft,receipt,onSaved}:{locale:Locale;organizationId:string;timezone:string;site:DataRow|null;draft:DataRow|null;receipt:DataRow|null;onSaved:(id:string)=>void}){
 const workflow=useDurableDraft(protocol,'site:'+organizationId+':'+(site?str(site,'id'):'new'),draft,receipt),body=workflow.body,stored=body.fields?object(body.fields):null,version=site?number(site,'version')||1:0;
 const [fields,setFields]=useState<Fields>(()=>restore(workflow.pending&&stored?stored:site||{},timezone,workflow.pending&&stored?number(stored,'baseVersion')||0:version)),[saved,setSaved]=useState(false),[rebase,setRebase]=useState(false);
 const frozen=workflow.processing||Boolean(workflow.pending)||Boolean(workflow.result),stale=Boolean(stored&&number(stored,'baseVersion')!==version);
 function change<K extends keyof Fields>(key:K,value:Fields[K]){setFields(row=>({...row,[key]:value}));setSaved(false);}
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setSaved(false);const button=event.nativeEvent instanceof SubmitEvent?event.nativeEvent.submitter:null;
  if(button instanceof HTMLButtonElement&&button.value==='draft'){if(await workflow.saveDraft(fields))setSaved(true);return;}
  const {baseVersion,...content}=fields,payload={...content,...(site?{id:str(site,'id')}:{organizationId})},result=await workflow.run(site?'site.save':'site.create',payload,baseVersion,fields);if(result)onSaved(str(result,'id'));
 }
 return <CommandForm locale={locale} className={s.panel} onSubmit={submit}><h3>{site?str(site,'label'):h(locale,'addSite')}</h3>
  {stored&&!workflow.pending&&!workflow.result?<div className={s.notice}>{stale?<label className={s.checkbox}><input type="checkbox" checked={rebase} onChange={event=>setRebase(event.target.checked)}/><span>{h(locale,'rebase')}</span></label>:null}<button className={`${s.button} ${s.secondary}`} type="button" disabled={workflow.processing||(stale&&!rebase)} onClick={()=>{setFields(restore(stored,timezone,version));setSaved(false);}}>{st(locale,'restoreDraft')}</button></div>:null}
  <fieldset className={s.vacancyEditorFields} disabled={frozen}><div className={s.formGrid}><label className={s.field}>{h(locale,'siteName')}<input name="label" required maxLength={180} value={fields.label} onChange={event=>change('label',event.target.value)}/></label><label className={s.field}>{t(locale,'country')}<select name="country" required value={fields.country} onChange={event=>change('country',event.target.value)}><option value="">{t(locale,'country')}</option><CountryOptions locale={locale}/></select></label><label className={s.field}>{t(locale,'city')}<input name="city" maxLength={180} value={fields.city} onChange={event=>change('city',event.target.value)}/></label><label className={s.field}>{h(locale,'region')}<input name="region" maxLength={180} value={fields.region} onChange={event=>change('region',event.target.value)}/></label><label className={s.field}>{t(locale,'timezone')}<input name="timezone" required maxLength={100} value={fields.timezone} onChange={event=>change('timezone',event.target.value)} placeholder="Europe/Paris"/></label>{site?<label className={s.checkbox}><input type="checkbox" name="active" checked={fields.active} onChange={event=>change('active',event.target.checked)}/><span>{h(locale,'active')}</span></label>:null}</div></fieldset>
  <div className={s.inlineActions}><button className={s.button} type="submit" disabled={workflow.processing||Boolean(workflow.result)}>{workflow.processing?t(locale,'saving'):workflow.pending?h(locale,'resume'):t(locale,'save')}</button>{!workflow.pending&&!workflow.result?<button className={`${s.button} ${s.secondary}`} type="submit" value="draft" formNoValidate disabled={workflow.processing}>{st(locale,'draft')}</button>:null}{workflow.result?<button className={`${s.button} ${s.secondary}`} type="button" onClick={()=>onSaved(str(workflow.result||{},'id'))}>{t(locale,'continue')}</button>:null}</div>
  {workflow.pending?<p className={s.notice} role="status">{h(locale,'recoverHelp')}</p>:null}{saved||workflow.result?<p className={s.notice} role="status">{t(locale,'saved')}</p>:null}{workflow.error?<p className={s.notice} role="alert">{errorText(locale,workflow.error.code)} {t(locale,'inputPreserved')}</p>:null}{workflow.pending&&workflow.error&&['INVALID_INPUT','VERSION_CONFLICT','INVALID_TRANSITION','FORBIDDEN'].includes(workflow.error.code)?<button className={`${s.button} ${s.secondary}`} type="button" disabled={workflow.processing} onClick={workflow.discard}>{t(locale,'back')}</button>:null}
 </CommandForm>;
}
export function SiteEditor({locale,organizationId,timezone,sites,editable,selected,creating,draft,receipt,search}:{locale:Locale;organizationId:string;timezone:string;sites:DataRow[];editable:boolean;selected:DataRow|null;creating:boolean;draft:DataRow|null;receipt:DataRow|null;search:Record<string,string|string[]|undefined>}){
 const router=useRouter();function destination(id:string|null,newSite=false){const params=new URLSearchParams();for(const [key,value] of Object.entries(search))if(typeof value==='string'&&!['site','newSite','new'].includes(key))params.set(key,value);params.set('organization',organizationId);if(id)params.set('site',id);if(newSite)params.set('newSite','1');return href(locale,'hiring/organization',params);}
 return <section className={s.stack}><div className={s.sectionHeading}><h2>{h(locale,'sites')}</h2>{editable?<Link className={`${s.button} ${s.secondary}`} href={destination(null,!creating)}>{creating?t(locale,'back'):h(locale,'addSite')}</Link>:null}</div>{sites.length?<div className={s.tableWrap}><table className={s.table}><thead><tr><th>{h(locale,'siteName')}</th><th>{t(locale,'city')}</th><th>{t(locale,'timezone')}</th><th>{h(locale,'active')}</th>{editable?<th>{t(locale,'continue')}</th>:null}</tr></thead><tbody>{sites.map(site=><tr key={str(site,'id')}><td>{str(site,'label')}</td><td>{str(site,'city')}</td><td><bdi>{str(site,'timezone')}</bdi></td><td>{h(locale,site.active===true?'active':'inactive')}</td>{editable?<td><Link className={s.textLink} href={destination(str(site,'id'))} aria-current={selected?.id===site.id?'page':undefined}>{t(locale,'continue')}</Link></td>:null}</tr>)}</tbody></table></div>:<p className={s.notice}>{t(locale,'notDeclared')}</p>}{editable&&(creating||selected)?<SiteForm locale={locale} organizationId={organizationId} timezone={timezone} site={selected} draft={draft} receipt={receipt} onSaved={id=>{if(id)router.replace(destination(id));router.refresh();}}/>:null}</section>;
}

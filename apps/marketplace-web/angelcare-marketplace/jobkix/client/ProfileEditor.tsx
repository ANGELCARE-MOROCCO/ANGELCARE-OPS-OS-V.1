'use client';
import { CommandForm } from './CommandForm';
import { useRef,useState,type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { Locale,ProfileEntry } from '../contracts';
import type { DataRow } from '../server/repository';
import { object,profileEntries } from '../validation';
import { str,number } from '../components/Public';
import { CountryOptions } from '../Country';
import { OCCUPATIONS } from '../taxonomy';
import { OCCUPATION_NAMES } from '../taxonomy-copy';
import { t,errorText } from '../i18n';
import { st } from '../studio-copy';
import { useCommand } from './commands';
import s from '../jobkix.module.css';
const values=(value:unknown)=>Array.isArray(value)?value.filter((item):item is string=>typeof item==='string'):[];
const lines=(value:string)=>value.split('\n').map(value=>value.trim()).filter(Boolean);
const draftEntries=(value:unknown):ProfileEntry[]=>Array.isArray(value)?value.slice(0,40).map(value=>{const row=object(value);return {id:str(row,'id'),title:str(row,'title'),organization:str(row,'organization'),start:str(row,'start'),end:str(row,'end'),description:str(row,'description')};}):[];
export function ProfileEditor({locale,profile,draft}:{locale:Locale;profile:DataRow;draft:DataRow|null}){
 const router=useRouter(),command=useCommand(),version=useRef(number(profile,'version')||1),draftVersion=useRef(number(draft||{},'version')||0),busy=useRef(false);
 const [displayName,setDisplayName]=useState(str(profile,'display_name')),[headline,setHeadline]=useState(str(profile,'headline')),[summary,setSummary]=useState(str(profile,'summary')),[country,setCountry]=useState(str(profile,'country')),[skills,setSkills]=useState(values(profile.skills).join('\n')),[languages,setLanguages]=useState(values(profile.languages).join('\n')),[occupations,setOccupations]=useState(values(profile.occupations));
 const [experience,setExperience]=useState(profileEntries(profile.experience,'experience')),[education,setEducation]=useState(profileEntries(profile.education,'education')),[saved,setSaved]=useState(false),[draftSaved,setDraftSaved]=useState(false);
 const payload=()=>({displayName,headline,summary,country:country||null,skills:lines(skills),languages:lines(languages),occupations,experience,education,preferences:profile.preferences&&typeof profile.preferences==='object'&&!Array.isArray(profile.preferences)?object(profile.preferences):{}});
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();if(busy.current)return;busy.current=true;setSaved(false);try{
  const data=payload(),draftResult=await command.run('draft.save',{kind:'profile',key:'career-passport',body:{...data,profileVersion:version.current}},draftVersion.current);
  if(!draftResult||typeof draftResult.version!=='number')return;draftVersion.current=draftResult.version;setDraftSaved(true);
  const native=event.nativeEvent,submitter=native instanceof SubmitEvent?native.submitter:null;if(submitter instanceof HTMLButtonElement&&submitter.value==='draft')return;
  const result=await command.run('profile.save',data,version.current);if(result&&typeof result.version==='number'){version.current=result.version;setSaved(true);router.refresh();}
 }finally{busy.current=false;}}
 function restore(){if(!draft?.body)return;const data=object(draft.body);setDisplayName(str(data,'displayName'));setHeadline(str(data,'headline'));setSummary(str(data,'summary'));setCountry(str(data,'country'));setSkills(values(data.skills).join('\n'));setLanguages(values(data.languages).join('\n'));setOccupations(values(data.occupations));setExperience(draftEntries(data.experience));setEducation(draftEntries(data.education));setSaved(false);}
 function entries(kind:'experience'|'education'){
  const rows=kind==='experience'?experience:education,set=kind==='experience'?setExperience:setEducation;
  function update(id:string,key:keyof ProfileEntry,value:string){set(current=>current.map(entry=>entry.id===id?{...entry,[key]:value}:entry));}
  return <section className={s.panel}><h2>{st(locale,kind)}</h2>{rows.map(entry=><fieldset key={entry.id} className={s.profileEntry}><legend>{entry.title||st(locale,kind)}</legend><div className={s.formGrid}>
   <label className={s.field}>{st(locale,'role')}<input required value={entry.title} onChange={event=>update(entry.id,'title',event.target.value)} maxLength={240}/></label><label className={s.field}>{st(locale,'organization')}<input required value={entry.organization} onChange={event=>update(entry.id,'organization',event.target.value)} maxLength={240}/></label>
   <label className={s.field}>{st(locale,'start')}<input required type="month" value={entry.start} onChange={event=>update(entry.id,'start',event.target.value)}/></label><label className={s.field}>{st(locale,'end')}<input type="month" value={entry.end} min={entry.start||undefined} onChange={event=>update(entry.id,'end',event.target.value)}/></label><label className={`${s.field} ${s.fullWidth}`}>{st(locale,'description')}<textarea value={entry.description} onChange={event=>update(entry.id,'description',event.target.value)} maxLength={4000}/></label>
  </div><button type="button" className={`${s.button} ${s.quiet}`} onClick={()=>set(current=>current.filter(value=>value.id!==entry.id))}>{st(locale,'remove')}</button></fieldset>)}<button type="button" className={`${s.button} ${s.secondary}`} disabled={rows.length>=40} onClick={()=>set(current=>[...current,{id:crypto.randomUUID(),title:'',organization:'',start:'',end:'',description:''}])}>{st(locale,'add')}</button></section>;
 }
 return <CommandForm locale={locale} onSubmit={submit} onChange={()=>{setSaved(false);setDraftSaved(false);}} className={s.stack}>{draft?.body?<div className={s.notice}><button type="button" className={`${s.button} ${s.secondary}`} onClick={restore}>{st(locale,'restoreDraft')}</button></div>:null}<section className={s.panel}><h2>{t(locale,'profileControl')}</h2><p>{t(locale,'privateByDefault')}</p><div className={s.formGrid}>
  <label className={s.field}>{t(locale,'fullName')}<input required value={displayName} onChange={event=>setDisplayName(event.target.value)} autoComplete="name" maxLength={180}/></label><label className={s.field}>{st(locale,'headline')}<input value={headline} onChange={event=>setHeadline(event.target.value)} maxLength={240}/></label>
  <label className={`${s.field} ${s.fullWidth}`}>{st(locale,'summary')}<textarea value={summary} onChange={event=>setSummary(event.target.value)} maxLength={12000}/></label><label className={s.field}>{t(locale,'origin')}<select value={country} onChange={event=>setCountry(event.target.value)}><option value="">{t(locale,'countryUnknown')}</option><CountryOptions locale={locale}/></select></label>
  <label className={s.field}>{st(locale,'skills')}<textarea value={skills} onChange={event=>setSkills(event.target.value)} maxLength={10000}/></label><label className={s.field}>{t(locale,'language')}<textarea value={languages} onChange={event=>setLanguages(event.target.value)} maxLength={1000}/><small>{st(locale,'languageCodes')}</small></label>
 </div><fieldset className={s.profileEntry}><legend>{t(locale,'professions')}</legend><div className={s.formGrid}>{OCCUPATIONS.map(([id])=><label className={s.checkbox} key={id}><input type="checkbox" checked={occupations.includes(id)} onChange={event=>setOccupations(current=>event.target.checked?[...current,id]:current.filter(value=>value!==id))}/><span>{OCCUPATION_NAMES[id][locale]}</span></label>)}</div></fieldset></section>
 {entries('experience')}{entries('education')}
 <section className={s.panel}><div className={s.inlineActions}><button className={s.button} type="submit" value="save" disabled={command.pending}>{command.pending?t(locale,'saving'):t(locale,'save')}</button><button className={`${s.button} ${s.secondary}`} type="submit" value="draft" formNoValidate disabled={command.pending}>{st(locale,'draft')}</button></div>{saved?<p className={s.notice} role="status">{t(locale,'saved')}</p>:draftSaved?<p className={s.notice} role="status">{st(locale,'draft')}</p>:null}{command.error?<p role="alert" className={s.notice}>{errorText(locale,command.error.code)} {t(locale,'inputPreserved')}</p>:null}</section>
 </CommandForm>;
}
